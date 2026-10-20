// One-command site integration for a product article Codex delivered.
// Usage: npm run integrate -- <slug> [--no-verify]
//
// Reads blog/<slug>/index.html and the newest docs/<slug>-article-package-v*.json, whose
// `siteIntegration` block carries the few website-only fields (see docs/collab/INTEGRATE.md).
// It never edits the article's prose: it wires the page into the site (catalog entry, journal
// card, cover review record, purchase controls, WebP images, structured-data image list, a
// generated test), rebuilds the heading font when new characters need it, then runs verify.
// Safe to re-run: every step replaces its own previous output instead of adding a second copy.
import {readFileSync, writeFileSync, existsSync, readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync, spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(import.meta.url);
const args = process.argv.slice(2);
const slug = args.find(a => !a.startsWith('--'));
const fail = message => { console.error(`[integrate] ${message}`); process.exit(1); };
const log = message => console.log(`[integrate] ${message}`);
if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) fail('usage: npm run integrate -- <slug> [--no-verify]');

const read = path => readFileSync(root + path, 'utf8');
const write = (path, text) => writeFileSync(root + path, text);
const sha256 = path => createHash('sha256').update(readFileSync(root + path.replace(/^\//, ''))).digest('hex');
const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
const js = value => String(value).replaceAll('\\', '\\\\').replaceAll("'", "\\'");
const camel = s => s.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());

// --- inputs -------------------------------------------------------------------------------------
const articlePath = `blog/${slug}/index.html`;
if (!existsSync(root + articlePath)) fail(`${articlePath} not found`);
const packages = readdirSync(root + 'docs').filter(f => new RegExp(`^${slug}-article-package-v(\\d+)\\.json$`).test(f))
  .sort((a, b) => Number(a.match(/v(\d+)\.json$/)[1]) - Number(b.match(/v(\d+)\.json$/)[1]));
if (!packages.length) fail(`docs/${slug}-article-package-v*.json not found`);
const pkg = JSON.parse(read('docs/' + packages.at(-1)));
const site = pkg.siteIntegration;
if (!site) fail(`${packages.at(-1)} has no "siteIntegration" block (fields: docs/collab/INTEGRATE.md)`);
const need = ['brand', 'category', 'journalCategory', 'excerpt', 'readLabel', 'cover', 'coverIdentity', 'coverSource', 'coverReview'];
const missing = need.filter(k => site[k] == null || site[k] === '');
if (missing.length) fail(`siteIntegration is missing: ${missing.join(', ')}`);
if (!['食品', '居家', '母嬰', '旅遊'].includes(site.journalCategory)) fail('siteIntegration.journalCategory must be 食品, 居家, 母嬰 or 旅遊');
const review = site.coverReview;
if (!(review.identityVisible === true && review.realPhotoPreserved === true && review.mobileCardLegible === true
  && [320, 390, 768, 1440].every(w => review.viewportWidths?.includes(w)) && review.reviewer && review.reviewScope))
  fail('siteIntegration.coverReview must record identityVisible, realPhotoPreserved, mobileCardLegible = true, viewportWidths 320/390/768/1440, reviewer and reviewScope');
const key = site.catalogKey || camel(slug);
const published = pkg.technicalSeo?.datePublished;
if (!/^\d{4}-\d{2}-\d{2}$/.test(published || '')) fail('technicalSeo.datePublished must be YYYY-MM-DD');
for (const asset of [site.cover, site.card, site.coverSource].filter(Boolean)) if (!existsSync(root + asset.replace(/^\//, ''))) fail(`${asset} not found`);

let html = read(articlePath);
const meta = (attr, name) => html.match(new RegExp(`<meta[^>]*${attr}="${name}"[^>]*content="([^"]*)"`))?.[1];
const title = (meta('property', 'og:title') || '').replace(/｜鷹家選物誌$/, '');
const coverAlt = meta('property', 'og:image:alt');
if (!title || !coverAlt) fail('article needs og:title and og:image:alt');
if ((html.match(/<h1\b/g) || []).length !== 1) fail('article must have exactly one <h1>');
if (!html.includes(`"https://www.eaglish.store${site.cover}"`)) fail(`og:image must be https://www.eaglish.store${site.cover}`);
const article = html.match(/<article>[\s\S]*?<\/article>/)?.[0];
if (!article) fail('article body <article>…</article> not found');

// --- 1. article images: anything raster that is not WebP becomes WebP; originals stay as masters.
const sharp = require('sharp');
const rasters = [...new Set([...article.matchAll(/(?:src|srcset)="([^"]+)"/g)].flatMap(m => m[1].split(',').map(s => s.trim().split(/\s+/)[0])))]
  .filter(p => /^\/assets\/[\w./-]+\.(?:png|jpe?g)$/i.test(p));
let body = article;
for (const src of rasters) {
  const out = src.replace(/\.(?:png|jpe?g)$/i, '.webp');
  const input = root + src.slice(1);
  const {hasAlpha} = await sharp(input).metadata();
  // PNG with transparency: lossless keeps every visible pixel and alpha; photos: high quality.
  await sharp(input).rotate().webp(hasAlpha ? {lossless: true, effort: 6} : {quality: 85, effort: 5}).toFile(root + out.slice(1));
  body = body.replaceAll(src, out);
  log(`image ${src} → ${out}`);
}
html = html.replace(article, body);

// --- 2. purchase controls and runtime scripts (shared sheet-offer.js; legacy per-page scripts kept).
// An article that already ships its own blog/<slug>/<slug>.js keeps it; otherwise Codex's
// per-article attribute names (data-<slug>-offer / -early) move to the shared ones.
const legacyOffer = existsSync(root + `blog/${slug}/${slug}.js`);
if (!legacyOffer) {
  html = html.replaceAll(`data-${slug}-offer`, 'data-sheet-offer').replaceAll(`data-${slug}-early`, 'data-sheet-early');
  if (!/data-sheet-offer\b/.test(html)) fail('article needs one <a data-sheet-offer href="/#catalog"> purchase link (and optionally data-sheet-early)');
  html = html.replace(/<script defer src="\/articles\/sheet-offer\.js"[^>]*><\/script>/g, '');
}
html = html.replace(/<link rel="stylesheet" href="\/product-content\.css(?:\?[^"]*)?">/, `<link rel="stylesheet" href="/product-content.css?v=20260911-video-poster-${slug}">`)
  .replace(/<script defer src="\/product-content\.js(?:\?[^"]*)?"[^>]*><\/script>/, `<script defer src="/product-content.js?v=20260911-video-poster-${slug}"></script>`);
if (!html.includes('/product-content.js?v=')) fail('article must load /product-content.js and /product-content.css');
for (const [src, after] of [['/design/papaparse.min.js', '/product-content.js'], ['/articles/floating-offer.js', '/design/papaparse.min.js']])
  if (!html.includes(`src="${src}"`)) html = html.replace(new RegExp(`(<script defer src="${after.replace(/[.?]/g, '\\$&')}[^"]*"[^>]*></script>)`), `$1<script defer src="${src}"></script>`);
if (!legacyOffer) html = html.replace(/(<script defer src="\/articles\/floating-offer\.js"><\/script>)/, `$1<script defer src="/articles/sheet-offer.js" data-catalog-key="${key}"></script>`);

// --- 3. crawlable store link without JavaScript, required by the release audit.
if (!/<noscript>[\s\S]*?<a\s+[^>]*href="\/"/.test(html)) {
  const offerSection = html.match(/<section[^>]*id="offer"[\s\S]*?<\/section>/)?.[0] || html.match(/<section[^>]*class="[^"]*purchase[^"]*"[\s\S]*?<\/section>/)?.[0];
  if (!offerSection) fail('no purchase section (id="offer") to hold the <noscript> store link');
  html = html.replace(offerSection, offerSection.replace(/<\/section>$/, '<noscript><p data-editorial-exclude>請到<a href="/">買物社</a>查看當期團購。</p></noscript></section>'));
}

// --- 4. Article JSON-LD images are a plain list of first-party URLs (release audit contract).
html = html.replace(/(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/, (all, open, json, close) => {
  const data = JSON.parse(json);
  for (const node of data['@graph'] || [data]) if (node['@type'] === 'Article' && node.image)
    node.image = [].concat(node.image).map(i => (typeof i === 'string' ? i : i.url));
  return open + JSON.stringify(data) + close;
});
write(articlePath, html);
log(`${articlePath} wired`);

// --- 5. catalog entry: exact Sheet brand, article, titles, cover and product card.
const fields = {id: slug, brands: [site.brand], article: `/blog/${slug}/`, title: site.cardTitle || title,
  readingTitle: site.readingTitle || title, coverAlt, excerpt: site.excerpt, category: site.category,
  image: site.cover, ...(site.card ? {cardImage: site.card} : {}), published};
const entry = `    ${key}:{${Object.entries(fields).map(([k, v]) => `${k}:${Array.isArray(v) ? `[${v.map(x => `'${js(x)}'`).join(',')}]` : `'${js(v)}'`}`).join(',')}},`;
let catalog = read('product-content.js');
const existing = new RegExp(`^    ${key}:\\{.*\\},$`, 'm');
catalog = existing.test(catalog) ? catalog.replace(existing, entry) : catalog.replace(/(\n  const catalog=\{\n)/, `$1${entry}\n`);
if (!catalog.includes(entry)) fail('could not place the catalog entry in product-content.js');
write('product-content.js', catalog);
delete require.cache[require.resolve(root + 'product-content.js')];
const content = require(root + 'product-content.js');
if (content.entry(site.brand)?.id !== slug) fail(`brand "${site.brand}" does not resolve to this article only (another entry claims it?)`);
log(`catalog ${key} ← "${site.brand}"`);

// --- 6. journal card, newest first.
const coverBase = site.cover.replace(/\.webp$/, '');
const srcset = [480, 960].every(w => existsSync(root + `${coverBase.slice(1)}-${w}.webp`)) ? ` srcset="${coverBase}-480.webp 480w, ${coverBase}-960.webp 960w, ${site.cover} 1600w" sizes="(max-width:700px) 90vw, 45vw"` : '';
const card = `        <article class="article-card" data-article="${key}" data-category="${site.journalCategory}" data-published="${published}" data-state="checking"><a class="card-image" href="/blog/${slug}/"><img src="${site.cover}" width="1600" height="1000" loading="eager" fetchpriority="high" alt="${esc(coverAlt)}" decoding="async"${srcset}></a><div class="card-copy"><div class="card-meta"><span data-status>團購狀態待確認</span><span>${esc(site.category)}</span></div><h3><a href="/blog/${slug}/">${esc(fields.title)}</a></h3><p>${esc(site.excerpt)}</p><div class="card-actions"><a class="read" href="/blog/${slug}/">${esc(site.readLabel)}</a><a class="buy" data-buy hidden>查看當期團購 ↗</a></div></div></article>\n`;
let journal = read('blog/index.html');
const oldCard = new RegExp(`        <article class="article-card" data-article="${key}"[\\s\\S]*?</article>\\n`);
journal = oldCard.test(journal) ? journal.replace(oldCard, card) : journal.replace(/(<div class="article-grid" data-shelf="journal">\n)/, `$1${card}`);
if (!journal.includes(card)) fail('could not place the journal card in blog/index.html');
write('blog/index.html', journal);
log('journal card placed');

// --- 7. cover review record bound to the reviewed pixels.
const identities = JSON.parse(read('config/blog-cover-identities.json'));
const imageSha256 = sha256(site.cover);
identities.articles[`/blog/${slug}/`] = {identity: site.coverIdentity, image: site.cover, imageSha256, source: site.coverSource,
  sourceSha256: sha256(site.coverSource), review: {identityVisible: true, realPhotoPreserved: true, imageSha256,
    viewportWidths: review.viewportWidths, mobileCardLegible: true, reviewer: review.reviewer, reviewScope: review.reviewScope}};
write('config/blog-cover-identities.json', JSON.stringify(identities, null, 2) + '\n');
log('cover review recorded');

// --- 8. generated contract test (left alone once it exists, so hand edits survive).
const testPath = `tests/${slug}-article.test.mjs`;
if (!existsSync(root + testPath)) {
  write(testPath, `// Generated by scripts/integrate-article.mjs; edit freely.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {createRequire} from 'node:module';
const pc=createRequire(import.meta.url)('../product-content.js');
const html=readFileSync(new URL('../blog/${slug}/index.html',import.meta.url),'utf8');
const brand='${js(site.brand)}';
const row={'品牌':brand,'連結':'https://example.com/offer','類型':'短期','開團日期':'2026-01-10','結束日期':'2026-01-20'};

test('${slug}: catalog binds only the exact Sheet brand',()=>{
 assert.equal(pc.entry(brand)?.id,'${slug}');
 assert.equal(pc.entry(brand.slice(0,-1)),undefined);
 for(const image of [pc.entry(brand).image,pc.entry(brand).cardImage].filter(Boolean))assert.ok(existsSync(new URL('..'+image,import.meta.url)),image);
});
test('${slug}: offer follows the Sheet dates and fails closed',()=>{
 assert.equal(pc.campaignFor([row],'${key}','2026-01-10').state,'open');
 assert.equal(pc.campaignFor([row],'${key}','2026-01-21').state,'closed');
 assert.equal(pc.campaignFor([row],'${key}','2026-01-09').state,'upcoming');
 assert.equal(pc.campaignFor([row,row],'${key}','2026-01-15').state,'unavailable');
 assert.equal(pc.campaignFor([],'${key}','2026-01-15').state,'unavailable');
});
test('${slug}: one H1, resolvable chapters, crawlable fallback',()=>{
 assert.equal((html.match(/<h1\\b/g)||[]).length,1);
 const nav=html.match(/<nav[^>]*data-reading-nav[^>]*>([\\s\\S]*?)<\\/nav>/)?.[1]||'';
 for(const [,id] of nav.matchAll(/href="#([^"]+)"/g))assert.match(html,new RegExp(\`id="\${id}"\`),id);
 assert.match(html,/<noscript>[\\s\\S]*?href="\\/"/);
 assert.doesNotMatch(html,/https:\\/\\/example\\.com\\/offer/);
});
test('${slug}: listed in the journal with a hidden buy link',()=>{
 const card=readFileSync(new URL('../blog/index.html',import.meta.url),'utf8').match(/<article class="article-card" data-article="${key}"[\\s\\S]*?<\\/article>/)?.[0];
 assert.ok(card,'journal card');
 assert.ok(card.includes('<a class="buy" data-buy hidden>'));
});
`);
  log(`${testPath} generated`);
}

// --- 9. builders that rewrite the head, then the heading font if the new title needs characters.
const run = (cmd, argv, opts = {}) => spawnSync(cmd, argv, {cwd: root, stdio: opts.quiet ? 'pipe' : 'inherit', encoding: 'utf8'});
run('node', ['scripts/normalize-blog-seo.mjs', '--write']);
if (run('node', ['--test', 'tests/site-heading-font.test.mjs'], {quiet: true}).status !== 0) {
  const python = process.env.FONT_PYTHON || 'python3';
  if (run(python, ['-c', 'import fontTools, brotli'], {quiet: true}).status !== 0)
    fail(`new heading characters need the font subset rebuilt; install fontTools+brotli and re-run with FONT_PYTHON=<that python>`);
  log('rebuilding the heading font subset (a few minutes)…');
  if (run('node', ['scripts/build-site-heading-font.mjs', '--python', python]).status !== 0) fail('font rebuild failed');
}

if (args.includes('--no-verify')) { log('done (verify skipped)'); process.exit(0); }
const verify = run('npm', ['run', 'verify']);
if (verify.status !== 0) fail('npm run verify failed; read the first failure above');
const changed = execFileSync('git', ['status', '--porcelain'], {cwd: root, encoding: 'utf8'}).trim();
log(`done. verify passed. Review and commit:\n${changed}`);
