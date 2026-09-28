// Build local globe assets; this script makes no network or provider requests.
import {readFileSync,writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {gzipSync} from 'node:zlib';
import {build} from 'esbuild';

const require=createRequire(import.meta.url);
const root=new URL('../',import.meta.url);
const topology=JSON.parse(readFileSync(require.resolve('world-atlas/countries-110m.json'),'utf8'));
// Shared quantized arcs keep this much smaller than expanded GeoJSON polygons.
const geometry={type:'Topology',transform:topology.transform,objects:{
 land:topology.objects.land,
 countries:{...topology.objects.countries,geometries:topology.objects.countries.geometries.map(({properties,...shape})=>shape)},
},arcs:topology.arcs};
const data=JSON.stringify(geometry);
if(Buffer.byteLength(data)>300000)throw new Error('Globe geography exceeds the 300 KB raw budget');
writeFileSync(new URL('trip/globe-land.json',root),data+'\n');
const notices=['d3-geo','d3-array','internmap','topojson-client','world-atlas'].map(name=>`${name}\n${readFileSync(new URL(`node_modules/${name}/LICENSE`,root),'utf8')}`).join('\n\n');
writeFileSync(new URL('trip/globe-licenses.txt',root),notices);
await build({entryPoints:[fileURLToPath(new URL('trip/globe-source.mjs',root))],outfile:fileURLToPath(new URL('trip/globe.js',root)),bundle:true,minify:true,format:'esm',platform:'browser',target:['es2020'],legalComments:'eof',banner:{js:`/*!\n${notices}\n*/`}});
const sizes={};
for(const name of ['globe.js','globe-land.json']){
 const bytes=readFileSync(new URL('trip/'+name,root));
 sizes[name]={rawBytes:bytes.length,gzipBytes:gzipSync(bytes).length};
}
if(sizes['globe.js'].gzipBytes+sizes['globe-land.json'].gzipBytes>65000)throw new Error('Interactive globe exceeds the 65 KB gzip estimate budget');
console.log(JSON.stringify({built:'local orthographic globe',...sizes},null,2));
