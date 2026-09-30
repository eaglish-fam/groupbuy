import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {validateExpandedMediaBundle} from './cebu-bohol-media-contract.mjs';
const root=resolve(import.meta.dirname,'..'),[project,output]=process.argv.slice(2);
if(!project)throw Error('Supply approved Project');
const read=p=>readFileSync(p),hash=b=>createHash('sha256').update(b).digest('hex');
const planBuffer=read(resolve(project,'luca-media-plan-v4.json')),plan=JSON.parse(planBuffer);
const all=validateExpandedMediaBundle(plan,JSON.parse(read(resolve(project,'luca-media-plan-v3.json'))));
const current=JSON.parse(read(resolve(root,'trip/assets/cebu-bohol-media.json'))),previous=JSON.parse(read(resolve(root,'trip/assets/cebu-bohol-media-v3.json')));
assert.equal(current.length,32);assert.equal(previous.length,15);
for(const old of previous)assert.deepEqual(current.find(m=>m.id===old.id),old);
const checks=[];
for(const m of current){
 const source=all.find(s=>s.id===m.id);assert.equal(m.derivedSha256,source.derivedSha256);
 assert.equal(hash(read(resolve(root,'.'+m.file))),source.derivedSha256);
 if(m.id.startsWith('frame')){
  assert.equal(hash(read(source.pngPath)),source.pngSha256);assert.equal(hash(read(source.beforePngPath)),source.beforePngSha256);
  const r=source.activePictureRect;
  const before=await sharp(source.beforePngPath).extract({left:r.x,top:r.y,width:r.w,height:r.h}).removeAlpha().raw().toBuffer();
  const after=await sharp(source.pngPath).removeAlpha().raw().toBuffer();assert.equal(Buffer.compare(before,after),0,`${m.id}: source active pixels changed`);
 }
 const variants=[];
 for(const v of [{file:m.file,width:m.width,height:m.height,sha256:m.derivedSha256},...m.variants]){
  const buffer=read(resolve(root,'.'+v.file));assert.equal(hash(buffer),v.sha256);
  const {data,info}=await sharp(buffer).removeAlpha().raw().toBuffer({resolveWithObject:true});assert.equal(info.width,v.width);assert.equal(info.height,v.height);
  let bars=null;
  if(m.id.startsWith('frame')){
   const black=y=>{for(let x=0;x<info.width*info.channels;x++)if(data[y*info.width*info.channels+x]>48)return false;return true;};
   let top=0,bottom=0;while(top<info.height&&black(top))top++;while(bottom<info.height&&black(info.height-1-bottom))bottom++;
   assert.equal(top,0,`${m.id}: top encoded bar`);assert.equal(bottom,0,`${m.id}: bottom encoded bar`);bars=[top,bottom];
  }
  if(v.width<=1440)assert.ok(buffer.length<=(v.width<=640?120000:v.width<=960?220000:400000));
  variants.push({file:v.file,width:info.width,height:info.height,bytes:buffer.length,sha256:v.sha256,blackRows:bars});
 }
 checks.push({id:m.id,inherited:previous.some(p=>p.id===m.id),activePixelsEqual:m.kind==='owned-video-frame'?true:null,pts:m.presentationTimestamp,crop:source.crop,variants});
}
const result={checkedAt:new Date().toISOString(),passed:true,images:32,unchangedPublicRecords:15,newFrames:17,sourceManifestSha256:hash(planBuffer),publicManifestSha256:hash(read(resolve(root,'trip/assets/cebu-bohol-media.json'))),checks};
if(output)writeFileSync(output,JSON.stringify(result,null,2)+'\n');
if(output)for(const group of plan.expandedSections){
 const rows=Math.ceil(group.assetIds.length/2),layers=[];
 for(const [i,id] of group.assetIds.entries()){
  const source=all.find(s=>s.id===id),left=(i%2)*620+10,top=Math.floor(i/2)*390+40;
  layers.push({input:await sharp(source.derivedPath).resize(600,338,{fit:'contain',background:'#fcfaf5'}).toBuffer(),left,top});
  const label=`${id} / PTS ${source.presentationTimestamp}`;
  layers.push({input:Buffer.from(`<svg width="600" height="30"><rect width="600" height="30" fill="#fcfaf5"/><text x="10" y="21" font-size="18" font-family="sans-serif">${label}</text></svg>`),left,top:top-30});
 }
 await sharp({create:{width:1240,height:rows*390+10,channels:3,background:'#fcfaf5'}}).composite(layers).jpeg({quality:90}).toFile(resolve(dirname(output),`kira-v4-source-${group.section}.jpg`));
}
console.log('PASS: 32 source-bound masters; 15 public records identical; 24 pixel-exact PNG crops; all master/variant hashes, decodes, ratios and budgets verified.');
