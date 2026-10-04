import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..'),[python,source]=process.argv.slice(2);
if(!python||!source)throw Error('Supply installed fontTools Python and weight-500 Noto Serif TC source; see assets/fonts/README.md');
const glyphs=readFileSync(resolve(root,'assets/fonts/singapore-heading-glyphs-v1.txt'),'utf8').trim();
execFileSync(python,['-c','from fontTools.ttLib import TTFont; import sys; f=TTFont(sys.argv[1]); assert "fvar" not in f and f["OS/2"].usWeightClass == 500',source],{stdio:'inherit'});
execFileSync(python,['-m','fontTools.subset',source,'--text='+glyphs,'--flavor=woff2','--output-file='+resolve(root,'assets/fonts/noto-serif-tc-singapore-v1.woff2')],{stdio:'inherit'});
if(readFileSync(resolve(root,'assets/fonts/noto-serif-tc-singapore-v1.woff2')).length>=16000)throw Error('Singapore supplement exceeds 16 KB');
