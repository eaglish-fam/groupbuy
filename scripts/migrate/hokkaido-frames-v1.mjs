// Turns the video frames listed in trip/data/hokkaido-frames-v1.json into
// published WebP sizes (/trip/assets/<assetId>-{640,960,1440}.webp), each kept
// under the approved byte budgets. The JPEG frames are pulled from our own
// videos outside this repo; pass their folder (<dir>/<videoId>/<seconds>.jpg).
// Run: node scripts/migrate/hokkaido-frames-v1.mjs <frames-dir>
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import sharp from 'sharp';
import {root} from './legacy-approved-helpers.mjs';

const dir=process.argv[2];if(!dir)throw Error('Usage: hokkaido-frames-v1.mjs <frames-dir>');
const manifest=JSON.parse(readFileSync(resolve(root,'trip/data/hokkaido-frames-v1.json'),'utf8'));
const budget=width=>width<=640?120000:width<=960?220000:409600;
let made=0;
for(const f of manifest.frames){
 const source=resolve(dir,f.video,`${f.seconds}.jpg`);if(!existsSync(source))throw Error('Missing frame '+source);
 const {width}=await sharp(source).metadata();
 for(const target of [640,960,1440].filter(w=>w<=width)){
  const out=resolve(root,`trip/assets/${f.assetId}-${target}.webp`);
  let quality=82,buffer;
  do{buffer=await sharp(source).resize({width:target,kernel:'lanczos3'}).webp({quality}).toBuffer();quality-=6;}while(buffer.length>budget(target)&&quality>40);
  if(buffer.length>budget(target))throw Error(`Over budget ${f.assetId}-${target}: ${buffer.length}`);
  writeFileSync(out,buffer);made++;
 }
}
console.log('WebP variants written',made,'for',manifest.frames.length,'frames');
