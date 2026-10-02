import {readFileSync,writeFileSync,readdirSync,mkdtempSync} from 'node:fs';
import {resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {execFileSync} from 'node:child_process';
const root=resolve(import.meta.dirname,'..'),[python,source,version='5',sourceKind='variable']=process.argv.slice(2);
if(!python||!source)throw Error('Supply installed fontTools Python and upstream Noto Serif TC variable TTF');
if(!/^[45678]$/.test(version)||!['variable','instanced-500'].includes(sourceKind))throw Error('Specify reviewed font version and source kind');
const glyphs=new Set(readFileSync(resolve(root,'assets/fonts/heading-glyphs.txt'),'utf8'));
function walk(path){for(const entry of readdirSync(resolve(root,path),{withFileTypes:true})){const p=path+'/'+entry.name;if(entry.isDirectory())walk(p);else if(entry.name==='index.html')collect(p);}}
function collect(path){const html=readFileSync(resolve(root,path),'utf8');if(/name="robots" content="noindex/.test(html))return;for(const [,heading] of html.matchAll(/<h[1-3]\b[^>]*>([\s\S]*?)<\/h[1-3]>/gi))for(const char of heading.replace(/<[^>]*>/g,''))glyphs.add(char);}
collect('index.html');for(const dir of ['blog','trip','guides','how-we-select'])walk(dir);
for(let cp=32;cp<127;cp++)glyphs.add(String.fromCodePoint(cp));
const characters=[...glyphs].sort((a,b)=>a.codePointAt(0)-b.codePointAt(0)).join('');
const temp=mkdtempSync(resolve(tmpdir(),'cebu-heading-font-'));let instanced=source;
if(sourceKind==='variable'){instanced=resolve(temp,'NotoSerifTC-500.ttf');execFileSync(python,['-m','fontTools.varLib.instancer',source,'wght=500','--output',instanced],{stdio:'inherit'});}
else execFileSync(python,['-c','from fontTools.ttLib import TTFont; import sys; f=TTFont(sys.argv[1]); assert "fvar" not in f and f["OS/2"].usWeightClass == 500',source],{stdio:'inherit'});
const output=resolve(root,`assets/fonts/noto-serif-tc-headings-v${version}.woff2`);
execFileSync(python,['-m','fontTools.subset',instanced,'--text='+characters,'--flavor=woff2','--output-file='+output],{stdio:'inherit'});
if(readFileSync(output).length>=256*1024)throw Error('Headline subset exceeds 256 KiB budget');
writeFileSync(resolve(root,'assets/fonts/heading-glyphs.txt'),characters);
console.log(`Built weight-500 Noto Serif TC v${version} with ${glyphs.size} glyphs; ${readFileSync(output).length} bytes.`);
