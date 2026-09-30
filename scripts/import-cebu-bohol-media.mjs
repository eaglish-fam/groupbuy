import {readFileSync,existsSync,mkdirSync,copyFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {basename,resolve,relative,isAbsolute} from 'node:path';
import sharp from 'sharp';
import {validateExpandedMediaBundle} from './cebu-bohol-media-contract.mjs';
const root=resolve(import.meta.dirname,'..');
const project=process.argv[2];if(!project)throw Error('Supply the approved Project path');
const manifestName=process.argv[3]||'luca-media-plan-v2.json';
if(!['luca-media-plan-v2.json','luca-media-plan-v3.json','luca-media-plan-v4.json'].includes(manifestName))throw Error('Specify reviewed v2, v3 or v4 manifest');
const manifestBuffer=readFileSync(resolve(project,manifestName));
const manifest=JSON.parse(manifestBuffer),revision=Number(manifestName.match(/-v(\d)\./)[1]);
if(revision!==4&&(manifest.workId!=='cebu-bohol-blog-20260930'||manifest.totalReadyImages!==15))throw Error('Expected final source-bound 15-image bundle');
if(revision===3&&(manifest.schemaVersion!=='luca-media-plan/3'||manifest.status!=='MEDIA_V3_READY_FOR_KIRA_IMPORT'))throw Error('v3 is not ready for import');
const hash=b=>createHash('sha256').update(b).digest('hex');
const outputManifest=resolve(root,'trip/assets/cebu-bohol-media.json');
const previous=existsSync(outputManifest)?JSON.parse(readFileSync(outputManifest)):[];
const v3=revision===4?JSON.parse(readFileSync(resolve(project,'luca-media-plan-v3.json'))):null;
if(revision===4){
 validateExpandedMediaBundle(manifest,v3);
 const freeze=JSON.parse(readFileSync(resolve(project,'luca-media-freeze-v4.json')));
 if(freeze.workId!==manifest.workId||freeze.counts.totalReadyImages!==32||freeze.counts.assetCount!==32||freeze.counts.qaMasterCount!==32||freeze.counts.physicalWebpCount!==32||freeze.checks.allReadyTotalsAgree!==true)throw Error('Invalid v4 freeze counts');
 for(const entry of freeze.files){
  const scope=relative(resolve(project),resolve(entry.path));
  if(scope.startsWith('..')||isAbsolute(scope)||hash(readFileSync(entry.path))!==entry.sha256)throw Error(`Frozen media hash/scope differs: ${entry.kind}/${entry.id||basename(entry.path)}`);
 }
 const frozenMasters=freeze.files.filter(f=>f.kind==='master-webp');
 if(frozenMasters.length!==32)throw Error('Incomplete frozen masters');
 for(const image of [...manifest.photos,...manifest.videoFrames]){
  const bound=frozenMasters.find(f=>f.id===image.id);
  if(!bound||resolve(bound.path)!==resolve(image.derivedPath)||bound.sha256!==image.derivedSha256)throw Error(`Unbound frozen master: ${image.id}`);
  const dimensions=await sharp(readFileSync(image.derivedPath)).metadata();
  if(dimensions.width!==image.width||dimensions.height!==image.height)throw Error(`Frozen dimensions differ: ${image.id}`);
 }
 if(!previous.length)throw Error('Import v3 baseline before v4');
 const history=resolve(root,'trip/assets/cebu-bohol-media-v3.json');
 if(!previous.some(m=>m.mediaRevision===4)){
  if(existsSync(history)&&hash(readFileSync(history))!==hash(readFileSync(outputManifest)))throw Error('Existing v3 history differs');
  if(!existsSync(history))copyFileSync(outputManifest,history);
 }
}
const v2=revision===3?JSON.parse(readFileSync(resolve(project,'luca-media-plan-v2.json'))):null;
if(revision===3&&previous.length&&!previous.some(m=>m.mediaRevision===3)){
 const history=resolve(root,'trip/assets/cebu-bohol-media-v2.json');
 if(existsSync(history)&&hash(readFileSync(history))!==hash(readFileSync(outputManifest)))throw Error('Existing v2 history differs');
 if(!existsSync(history))copyFileSync(outputManifest,history);
}
const records=[];
for(const image of [...manifest.photos,...manifest.videoFrames]){
 const buffer=readFileSync(image.derivedPath);if(hash(buffer)!==image.derivedSha256)throw Error(`Derived hash mismatch: ${image.id}`);
 const sourceId=image.sourceId||image.id;
 if(!sourceId||image.id.startsWith('frame')&&(!Number.isFinite(image.actualSeconds)||!image.sourceUrl))throw Error(`Missing source identity: ${image.id}`);
 const frame=image.id.startsWith('frame');
 if(revision===4){
  const old=v3.photos.concat(v3.videoFrames).find(m=>m.id===image.id);
  if(old){const record=previous.find(m=>m.id===image.id);if(!record||record.derivedSha256!==image.derivedSha256||hash(readFileSync(resolve(root,'.'+record.file)))!==image.derivedSha256)throw Error(`Inherited public media differs: ${image.id}`);records.push(record);continue;}
 }
 if(revision===3){
  const old=[...v2.photos,...v2.videoFrames].find(m=>m.id===image.id);
  if(!old||image.sourceSha256!==old.sourceSha256)throw Error(`Source changed: ${image.id}`);
  if(!frame&&image.derivedSha256!==old.derivedSha256)throw Error(`Photo changed: ${image.id}`);
  if(frame){
   if(image.presentationTimestamp!==old.presentationTimestamp||image.timeBase!==old.timeBase||image.contentEditApplied!==false||image.letterbox!==false)throw Error(`Frame provenance changed: ${image.id}`);
   const rect=image.activePictureRect;
   if(!rect||rect.w!==image.width||rect.h!==image.height||rect.x<0||rect.y<0||rect.x+rect.w>image.beforeWidth||rect.y+rect.h>image.beforeHeight)throw Error(`Invalid active picture: ${image.id}`);
   if(Boolean(image.crop)!==image.cropApplied||image.crop&&JSON.stringify(image.crop)!==JSON.stringify(rect))throw Error(`Crop provenance mismatch: ${image.id}`);
  }
 }
 const name='ph-cebu-bohol-'+basename(image.derivedPath,'.webp')+(frame&&revision>=3?`-v${revision}-active`:''),file='/trip/assets/'+name+'.webp',dest=resolve(root,'.'+file);
 mkdirSync(resolve(root,'trip/assets'),{recursive:true});
 if(existsSync(dest)&&hash(readFileSync(dest))!==hash(buffer))throw Error(`Refuse to replace master: ${dest}`);
 if(!existsSync(dest))copyFileSync(image.derivedPath,dest);
 const dimensions=await sharp(buffer).metadata(),variants=[];
 if(dimensions.width!==image.width||dimensions.height!==image.height)throw Error(`Master dimensions mismatch: ${image.id}`);
 for(const width of [640,960,1440,dimensions.width].filter((v,i,a)=>v<=Math.min(dimensions.width,1440)&&a.indexOf(v)===i).sort((a,b)=>a-b)){
  let encoded,variantFile=file;
  if(width===dimensions.width)encoded=buffer;
  else{
   for(const quality of [78,72,66,60]){encoded=await sharp(buffer).rotate().resize({width,withoutEnlargement:true}).webp({quality,effort:5}).toBuffer();if(encoded.length<=(width<=640?120000:width<=960?220000:400000))break;}
   variantFile='/trip/assets/'+name+'-'+width+'.webp';
  }
  if(encoded.length>(width<=640?120000:width<=960?220000:400000))throw Error(`Responsive budget failed: ${image.id}/${width}`);
  const output=resolve(root,'.'+variantFile);
  if(!existsSync(output)||hash(readFileSync(output))!==hash(encoded))writeFileSync(output,encoded);
  const meta=await sharp(encoded).metadata();variants.push({file:variantFile,width:meta.width,height:meta.height,bytes:encoded.length,sha256:hash(encoded)});
 }
 const record={id:image.id,sourceId,kind:frame?'owned-video-frame':'user-supplied-photo',creator:'鷹式一家',file,width:dimensions.width,height:dimensions.height,alt:image.alt,caption:image.caption,position:image.mobileObjectPosition||'50% 50%',originalSha256:image.sourceSha256,derivedSha256:image.derivedSha256,cropApplied:image.cropApplied===true,contentEditApplied:false,reviewedAt:'2026-09-30',...(image.sourceUrl?{sourceUrl:image.sourceUrl,actualSeconds:image.actualSeconds,timecode:image.timecode,presentationTimestamp:image.presentationTimestamp,timeBase:image.timeBase,burnedText:image.burnedText,letterbox:image.letterbox}:{}),...(frame&&revision>=3?{mediaRevision:revision,sourceManifestSha256:hash(manifestBuffer),previousDerivedSha256:image.previousDerivedSha256,pngSha256:image.pngSha256,beforePngSha256:image.beforePngSha256,beforeWidth:image.beforeWidth,beforeHeight:image.beforeHeight,afterWidth:image.afterWidth,afterHeight:image.afterHeight,crop:image.crop,activePictureRect:image.activePictureRect,sourceLetterbox:image.sourceLetterbox,extractionFilter:image.extractionFilter,cropNote:image.cropNote,...(image.section?{section:image.section,role:image.role}:{} )}:{}),variants};
 const oldRecord=previous.find(m=>m.id===image.id);
 records.push(revision===3&&!frame&&oldRecord?oldRecord:record);
}
writeFileSync(outputManifest,JSON.stringify(records,null,2)+'\n');
console.log(`Imported ${records.length} reviewed images; generated budget-bound responsive variants; masters unchanged.`);
