import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,relative,isAbsolute} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import sharp from 'sharp';

const sha=b=>createHash('sha256').update(b).digest('hex');
const expectedIds=['molly-stair-circulation','molly-room-robe-detail','henann-brand-open-corridor'];
export function projectPath(project,path){
 const target=resolve(project,path),scope=relative(resolve(project),target);
 if(!scope||scope==='..'||scope.startsWith('../')||isAbsolute(scope))throw Error('Hotel evidence escapes approved Project');
 return target;
}
export function validateHotelSelection(selection,provenance){
 if(selection.workId!=='cebu-bohol-blog-20260930'||provenance.workId!==selection.workId||selection.reviewer!=='Eliora')throw Error('Hotel selection owner/work mismatch');
 if(provenance.frozenV4Modified!==false||provenance.assetCount!==4||provenance.assets?.length!==4)throw Error('Hotel provenance counts/protected history differ');
 if(JSON.stringify(selection.selected)!==JSON.stringify(expectedIds)||!selection.excluded?.['henann-brand-interior-departure'])throw Error('Hotel selection differs from reviewed three-image scope');
 if(new Set(provenance.assets.map(m=>m.id)).size!==4)throw Error('Duplicate hotel source ID');
 return expectedIds.map(id=>{
  const m=provenance.assets.find(m=>m.id===id);
  if(!m||m.sourceId!=='youtube-QmngtzfPVDk'||m.sourceSha256!=='646e22ae077095f6604740ae09819de0b8d4b500b7cd787423f764a01c44ced9'||m.timeBase!=='1/60000'||!Number.isSafeInteger(m.presentationTimestamp)||Math.abs(m.presentationTimestamp/60000-m.actualSeconds)>1e-8)throw Error(`Hotel frame identity mismatch: ${id}`);
  if(m.contentEdited!==false||m.retainedPngPixelsEqual!==true||m.objectFit!=='contain'||JSON.stringify(m.beforeDimensions)!=='[1920,1080]'||JSON.stringify(m.crop)!=='{"x":0,"y":108,"w":1920,"h":864}'||m.width!==1920||m.height!==864)throw Error(`Hotel active picture mismatch: ${id}`);
  if(![m.webpSha256,m.pngSha256,m.uncroppedEvidenceSha256].every(h=>/^[a-f0-9]{64}$/.test(h||'')))throw Error(`Missing hotel source hash: ${id}`);
  return m;
 });
}

export async function checkHotelMedia(project){
 const selectionBuffer=readFileSync(projectPath(project,'eliora-hotel-media-selection-v1.json'));
 const selection=JSON.parse(selectionBuffer);
 for(const [name,hash] of Object.entries(selection.sourceHashes||{}))if(sha(readFileSync(projectPath(project,name)))!==hash)throw Error(`Hotel selection source changed: ${name}`);
 const provenanceBuffer=readFileSync(projectPath(project,'media/hotels-v1/provenance.json'));
 const provenance=JSON.parse(provenanceBuffer),assets=validateHotelSelection(selection,provenance),checkedSources=new Set(),checks=[];
 for(const m of assets){
  if(!checkedSources.has(m.sourcePath)){
   if(sha(readFileSync(projectPath(project,m.sourcePath)))!==m.sourceSha256)throw Error(`Hotel original video hash differs: ${m.id}`);
   checkedSources.add(m.sourcePath);
  }
  for(const [path,hash] of [[m.webpPath,m.webpSha256],[m.pngPath,m.pngSha256],[m.uncroppedEvidencePath,m.uncroppedEvidenceSha256]])if(sha(readFileSync(projectPath(project,path)))!==hash)throw Error(`Hotel derived hash differs: ${m.id}`);
  const before=await sharp(projectPath(project,m.uncroppedEvidencePath)).metadata();
  if(before.width!==1920||before.height!==1080)throw Error(`Hotel original dimensions differ: ${m.id}`);
  const original=await sharp(projectPath(project,m.uncroppedEvidencePath)).extract({left:m.crop.x,top:m.crop.y,width:m.crop.w,height:m.crop.h}).removeAlpha().raw().toBuffer();
  const retained=await sharp(projectPath(project,m.pngPath)).removeAlpha().raw().toBuffer();
  if(!original.equals(retained))throw Error(`Hotel retained PNG pixels differ: ${m.id}`);
  const webp=readFileSync(projectPath(project,m.webpPath)),meta=await sharp(webp).metadata();
  if(meta.format!=='webp'||meta.width!==m.width||meta.height!==m.height||webp.length!==m.bytes)throw Error(`Hotel WebP dimensions/bytes differ: ${m.id}`);
  checks.push({id:m.id,pts:m.presentationTimestamp,timeBase:m.timeBase,width:m.width,height:m.height,bytes:m.bytes,webpSha256:m.webpSha256,retainedPixelsEqual:true,contentEdited:false});
 }
 const protectedRoot=resolve(import.meta.dirname,'..'),oldManifest=readFileSync(resolve(protectedRoot,'trip/assets/cebu-bohol-media.json'));
 if(sha(oldManifest)!=='9af76b77485370bc5e10c1c3daedd0927078401bee65016929e9cd6b30f94b3e')throw Error('Protected original 32-media manifest changed');
 return {workId:selection.workId,checkedAt:new Date().toISOString(),passed:true,scope:'source preflight only; no import, publication, HTML, runtime or UI acceptance',selectionSha256:sha(selectionBuffer),provenanceSha256:sha(provenanceBuffer),protectedMediaManifestSha256:sha(oldManifest),selectedAssets:checks};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const [project,output]=process.argv.slice(2);if(!project)throw Error('Supply approved Project');
 const result=await checkHotelMedia(project);
 if(output)writeFileSync(projectPath(project,output),JSON.stringify(result,null,2)+'\n');
 console.log(`PASS: ${result.selectedAssets.length} selected hotel sources; exact original/PNG/WebP hashes and retained pixels; protected 32-image manifest unchanged. No candidate publication performed.`);
}
