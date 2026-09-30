import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import sharp from 'sharp';
const root=resolve(import.meta.dirname,'..'),[project,output]=process.argv.slice(2);
if(!project)throw Error('Supply approved Project path');
const read=p=>readFileSync(p),hash=b=>createHash('sha256').update(b).digest('hex');
const plan=JSON.parse(read(resolve(project,'luca-media-plan-v3.json')));
const current=JSON.parse(read(resolve(root,'trip/assets/cebu-bohol-media.json'))),previous=JSON.parse(read(resolve(root,'trip/assets/cebu-bohol-media-v2.json')));
const checks=[];
for(const m of current){
 const old=previous.find(v=>v.id===m.id);
 if(m.id.startsWith('photo')){assert.deepEqual(m,old);assert.equal(hash(read(resolve(root,'.'+m.file))),old.derivedSha256);continue;}
 const source=plan.videoFrames.find(v=>v.id===m.id);
 assert.equal(hash(read(source.pngPath)),source.pngSha256);assert.equal(hash(read(source.beforePngPath)),source.beforePngSha256);
 const rect=source.activePictureRect;
 const before=await sharp(source.beforePngPath).extract({left:rect.x,top:rect.y,width:rect.w,height:rect.h}).removeAlpha().raw().toBuffer();
 const after=await sharp(source.pngPath).removeAlpha().raw().toBuffer();
 assert.equal(Buffer.compare(before,after),0,`${m.id}: source active pixels changed`);
 const variants=[];
 for(const v of [{file:m.file,width:m.width,height:m.height,sha256:m.derivedSha256},...m.variants]){
  const buffer=read(resolve(root,'.'+v.file));assert.equal(hash(buffer),v.sha256);
  const {data,info}=await sharp(buffer).removeAlpha().raw().toBuffer({resolveWithObject:true});
  assert.equal(info.width,v.width);assert.equal(info.height,v.height);
  const blackRow=y=>{for(let x=0;x<info.width*info.channels;x++)if(data[y*info.width*info.channels+x]>48)return false;return true;};
  let top=0,bottom=0;while(top<info.height&&blackRow(top))top++;while(bottom<info.height&&blackRow(info.height-1-bottom))bottom++;
  assert.equal(top,0,`${m.id}/${v.width}: top encoded bar`);assert.equal(bottom,0,`${m.id}/${v.width}: bottom encoded bar`);
  if(v.width<=1440)assert.ok(buffer.length<=(v.width<=640?120000:v.width<=960?220000:400000));
  variants.push({file:v.file,width:info.width,height:info.height,bytes:buffer.length,sha256:v.sha256,blackRows:[top,bottom]});
 }
 checks.push({id:m.id,pts:m.presentationTimestamp,crop:m.crop,activePixelsEqual:true,uncroppedHashPreserved:m.crop===null?m.derivedSha256===old.derivedSha256:null,burnedText:m.burnedText,variants});
}
assert.equal(checks.length,7);
const result={checkedAt:new Date().toISOString(),passed:true,unchangedPhotos:8,frames:checks,articleSha256:hash(read(resolve(root,'trip/content/philippines/cebu-bohol-with-kids.md')))};
assert.equal(result.articleSha256,'106821b00e4441649f2701ce5721b468936f736af3252e205db00b038534640f');
if(output)writeFileSync(output,JSON.stringify(result,null,2)+'\n');
console.log(`PASS: 8 unchanged photos, 7 source-pixel-identical frames, 28 WebP decodes with no encoded black rows; source article unchanged.`);
