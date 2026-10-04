// One-time supplement rebuild only. Ordinary builds consume checked-in WOFF2.
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..'),[python,source]=process.argv.slice(2);
if(!python||!source)throw Error('Supply isolated fontTools Python and the OFL Noto Serif TC weight500 source instance');
const glyphs=readFileSync(resolve(root,'assets/fonts/approved-travel-heading-glyphs-v1.txt'),'utf8').trim();
if(new Set(glyphs).size!==37||[...glyphs].length!==37)throw Error('This frozen supplement must contain exactly the reviewed37 glyphs');
execFileSync(python,['-c','from fontTools.ttLib import TTFont; import sys; f=TTFont(sys.argv[1]); assert "fvar" not in f and f["OS/2"].usWeightClass == 500; assert all(ord(c) in f.getBestCmap() for c in sys.argv[2])',source,glyphs],{stdio:'inherit'});
const destination=resolve(root,'assets/fonts/noto-serif-tc-approved-travel-v1.woff2');
execFileSync(python,['-m','fontTools.subset',source,'--text='+glyphs,'--flavor=woff2','--output-file='+destination],{stdio:'inherit'});
if(readFileSync(destination).length>24576)throw Error('Dedicated37-glyph supplement exceeds24KiB');
execFileSync(python,['-c','from fontTools.ttLib import TTFont; import sys; f=TTFont(sys.argv[1]); assert "fvar" not in f and f["OS/2"].usWeightClass == 500; assert set(f.getBestCmap()) == set(map(ord,sys.argv[2]))',destination,glyphs],{stdio:'inherit'});
