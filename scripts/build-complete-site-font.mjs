// Optional asset-maintenance command, not part of ordinary repository builds.
// Usage: node scripts/build-complete-site-font.mjs --python <isolated-python> --source <NotoSerifTC-500.ttf>
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const arg=k=>process.argv[process.argv.indexOf(k)+1],python=arg('--python'),source=arg('--source');
if(!process.argv.includes('--python')||!process.argv.includes('--source'))throw Error('Explicit isolated Python and verified weight500 source required');
const hash=b=>createHash('sha256').update(b).digest('hex');
const sourceHash='4e964ce8ebc59027d86a21e868c5365d5efa94788dc02112d0e331f9f81f875f';
if(hash(readFileSync(source))!==sourceHash)throw Error('Unexpected full weight500 source');
const output=fileURLToPath(new URL('../assets/fonts/noto-serif-tc-complete-500-v1.woff2',import.meta.url));
execFileSync(python,['-m','fontTools.ttLib.woff2','compress',source,'-o',output],{stdio:'inherit'});
const inspect=`import json,sys\nfrom fontTools.ttLib import TTFont\nf=TTFont(sys.argv[1]);s=TTFont(sys.argv[2]);c=sorted(f.getBestCmap());assert c==sorted(s.getBestCmap());assert f['OS/2'].usWeightClass==500\nr=[]\nfor p in c:\n if r and p==r[-1][1]+1:r[-1][1]=p\n else:r.append([p,p])\nprint(json.dumps({'family':f['name'].getDebugName(1),'version':f['name'].getDebugName(5),'weight':500,'glyphCount':f['maxp'].numGlyphs,'unicodeCount':len(c),'ranges':r,'fullSourceCmapExact':True}))`;
const verified=JSON.parse(execFileSync(python,['-c',inspect,output,source],{encoding:'utf8'}));
const bytes=readFileSync(output);
const manifest={fontFile:'noto-serif-tc-complete-500-v1.woff2',sha256:hash(bytes),bytes:bytes.length,sourceInstanceSha256:sourceHash,upstreamCommit:'6d17dab13b85129360f9748f057c7f67c5f484d4',upstreamVariableSha256:'0077e18f57c6908f4a000969880940bdb0dad057c0e8d98b49dc364c3d1b09c6',upstreamUrl:'https://raw.githubusercontent.com/google/fonts/6d17dab13b85129360f9748f057c7f67c5f484d4/ofl/notoseriftc/NotoSerifTC%5Bwght%5D.ttf',licenseFile:'OFL-NotoSerifTC.txt',...verified};
writeFileSync(new URL('../assets/fonts/complete-site-font-v1.json',import.meta.url),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({...manifest,ranges:verified.ranges.length}));
