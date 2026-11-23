// Optional asset-maintenance command, not part of ordinary repository builds.
// Usage: node scripts/build-site-heading-font.mjs --python <python with fontTools + brotli>
// Splits the complete weight-500 heading font into one "site" face holding every character the
// repository publishes today, plus small slices covering the rest of the complete cmap. The
// loader registers the slices with unicode-range, so a new character (a Sheet product name, a
// new article) downloads one ~100 KB slice instead of rendering in the fallback serif. Together
// the faces cover exactly the complete font's cmap; nothing is dropped.
import {readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, renameSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const arg = key => process.argv[process.argv.indexOf(key) + 1];
if (!process.argv.includes('--python')) throw Error('An isolated Python with fontTools and brotli is required');
const python = arg('--python');
const root = fileURLToPath(new URL('../', import.meta.url));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const complete = JSON.parse(readFileSync(`${root}assets/fonts/complete-site-font-v1.json`, 'utf8'));
const sourceFile = `${root}assets/fonts/${complete.fontFile}`;
if (hash(readFileSync(sourceFile)) !== complete.sha256) throw Error('Unexpected complete font');

// Every build lands in a new directory named by its content hash, and the loader is pointed at
// it: a returning visitor's cached manifest can then never mix with rebuilt slices, whose
// ranges shift whenever a character moves into the site face.
const outDir = `${root}assets/fonts/.heading-serif-500-build/`;
const sliceSize = 400;

// Every published text source: tracked files outside build tooling, tests and internal docs.
const tracked = execFileSync('git', ['ls-files', '-z'], {cwd: root, encoding: 'utf8'}).split('\0')
  .filter(path => /\.(html|js|mjs|json|txt)$/.test(path) && !/^(docs|tests|reports|scripts|flights-pipeline|node_modules)\//.test(path) && !/^assets\/fonts\/\.?heading-serif-500-/.test(path));
const cmap = new Set(complete.ranges.flatMap(([a, z]) => Array.from({length: z - a + 1}, (_, i) => a + i)));
const used = new Set();
for (let cp = 0x20; cp <= 0x7e; cp++) used.add(cp);
for (const path of tracked) for (const char of readFileSync(`${root}${path}`, 'utf8')) {
  const cp = char.codePointAt(0);
  if (cmap.has(cp)) used.add(cp);
}
const site = [...used].sort((a, b) => a - b);
const rest = [...cmap].filter(cp => !used.has(cp)).sort((a, b) => a - b);

const unicodeRange = cps => {
  const ranges = [];
  for (const cp of cps) {
    const last = ranges.at(-1);
    if (last && cp === last[1] + 1) last[1] = cp; else ranges.push([cp, cp]);
  }
  return ranges.map(([a, z]) => `U+${a.toString(16)}${z > a ? `-${z.toString(16)}` : ''}`).join(',');
};
const subset = (name, cps) => {
  const file = `${outDir}${name}`;
  execFileSync(python, ['-m', 'fontTools.subset', sourceFile, `--unicodes=${cps.map(cp => cp.toString(16)).join(',')}`,
    '--flavor=woff2', '--layout-features=*', '--no-hinting', `--output-file=${file}`], {stdio: 'inherit'});
  const bytes = readFileSync(file);
  return {file: name, sha256: hash(bytes), bytes: bytes.length, count: cps.length, unicodeRange: unicodeRange(cps)};
};

rmSync(outDir, {recursive: true, force: true});
mkdirSync(outDir, {recursive: true});
const slices = [];
for (let i = 0; i < rest.length; i += sliceSize)
  slices.push(subset(`slice-${String(slices.length).padStart(2, '0')}.woff2`, rest.slice(i, i + sliceSize)));
const siteFace = subset('site.woff2', site);
if (siteFace.count + slices.reduce((n, s) => n + s.count, 0) !== complete.unicodeCount) throw Error('Faces do not cover the complete cmap');
const version = `heading-serif-500-${hash([siteFace, ...slices].map(face => face.sha256).join('\n')).slice(0, 10)}`;
const manifest = {version, source: {file: complete.fontFile, sha256: complete.sha256, unicodeCount: complete.unicodeCount}, site: siteFace, slices};
writeFileSync(`${outDir}manifest.json`, `${JSON.stringify(manifest, null, 1)}\n`);
for (const old of readdirSync(`${root}assets/fonts/`)) if (/^heading-serif-500-/.test(old)) rmSync(`${root}assets/fonts/${old}`, {recursive: true});
renameSync(outDir, `${root}assets/fonts/${version}/`);
const loaderPath = `${root}site-font-loader.js`, loader = readFileSync(loaderPath, 'utf8');
const pointed = loader.replace(/const fontVersion = '[^']+';/, `const fontVersion = '${version}';`);
if (pointed === loader && !loader.includes(`'${version}'`)) throw Error('site-font-loader.js fontVersion marker not found');
writeFileSync(loaderPath, pointed);
console.log(JSON.stringify({site: {count: manifest.site.count, bytes: manifest.site.bytes}, slices: slices.length,
  sliceBytes: slices.reduce((n, s) => n + s.bytes, 0), maxSlice: Math.max(...slices.map(s => s.bytes))}));
