import {readFileSync,writeFileSync,existsSync,mkdirSync,copyFileSync} from 'node:fs';
import {resolve} from 'node:path';
import sharp from 'sharp';
import {checkHotelMedia,projectPath} from './check-cebu-bohol-hotel-media.mjs';
import {hash,readPublicationPack,pageConfig,validatePageSource} from './cebu-bohol-hotel-pack.mjs';
const root=resolve(import.meta.dirname,'..'),project=process.argv[2];if(!project)throw Error('Supply approved source Project');
await checkHotelMedia(project);
const packName=process.argv[3];
const {pack,sha256,factAudit}=readPublicationPack(project,packName),original=readFileSync(resolve(root,'trip/assets/cebu-bohol-media.json'));
const media=JSON.parse(original),provenance=JSON.parse(readFileSync(projectPath(project,'media/hotels-v1/provenance.json'))),newMedia=[];
const used=new Map(pack.pages.flatMap(p=>p.media).map(m=>[m.id,m]));
for(const m of used.values()){
 const existing=media.find(r=>r.id===m.id);
 if(existing){if(existing.derivedSha256!==m.sha256)throw Error(`Existing source differs: ${m.id}`);continue;}
 const source=provenance.assets.find(r=>r.id===m.id);if(!source||!['molly-stair-circulation','henann-brand-open-corridor'].includes(m.id))throw Error('Unexpected new hotel media');
 const master=readFileSync(projectPath(project,m.path)),file=`/trip/assets/ph-stay-${m.id}-v1.webp`,variants=[];
 const immutableWrite=(path,bytes)=>{if(existsSync(path)&&hash(readFileSync(path))!==hash(bytes))throw Error(`Refuse to replace versioned hotel output: ${path}`);if(!existsSync(path))writeFileSync(path,bytes);};
 immutableWrite(resolve(root,'.'+file),master);
 for(const width of [640,960,1440]){
  let encoded;for(const quality of [78,72,66,60]){encoded=await sharp(master).resize({width,withoutEnlargement:true}).webp({quality,effort:5}).toBuffer();if(encoded.length<=(width<=640?120000:width<=960?220000:400000))break;}
  if(encoded.length>(width<=640?120000:width<=960?220000:400000))throw Error('Hotel responsive budget exceeded');
  const variant=file.replace('.webp',`-${width}.webp`);immutableWrite(resolve(root,'.'+variant),encoded);const meta=await sharp(encoded).metadata();
  variants.push({file:variant,width:meta.width,height:meta.height,bytes:encoded.length,sha256:hash(encoded)});
 }
 const record={id:m.id,sourceId:source.sourceId,kind:'owned-video-frame',creator:'鷹式一家',file,width:m.width,height:m.height,alt:m.alt,caption:m.caption,originalSha256:source.sourceSha256,derivedSha256:m.sha256,presentationTimestamp:source.presentationTimestamp,timeBase:source.timeBase,actualSeconds:source.actualSeconds,sourceUrl:source.sourceUrl,crop:source.crop,contentEditApplied:false,branchAttribution:m.branchAttribution,sourceManifestSha256:hash(readFileSync(projectPath(project,'media/hotels-v1/provenance.json'))),variants};
 newMedia.push(record);media.push(record);
}
const mediaById=Object.fromEntries(media.map(m=>[m.id,m])),overview=JSON.parse(readFileSync(resolve(root,'trip/data/cebu-bohol-guide.json')));
const planned=pack.pages.map(p=>{const source=readFileSync(projectPath(project,p.file),'utf8'),config=pageConfig(p,overview);validatePageSource(source,p,config,mediaById);return {page:p,config,source};});
const content=resolve(root,'trip/content/philippines'),history=resolve(content,'history');mkdirSync(history,{recursive:true});
const previousPath=resolve(content,'cebu-bohol-with-kids.md'),previousReceipt=resolve(content,'alma-source-receipt.json'),old=JSON.parse(readFileSync(previousReceipt));
if(hash(readFileSync(previousPath))!==old.sha256)throw Error('Existing guide differs from import receipt');
if(old.sourceArtifact!==pack.pages[0].file){
 for(const [path,name] of [[previousPath,old.sourceArtifact],[previousReceipt,old.sourceArtifact.replace('.md','-receipt.json')]]){
  const target=resolve(history,name);if(existsSync(target)&&hash(readFileSync(target))!==hash(readFileSync(path)))throw Error('Protected editorial history differs');if(!existsSync(target))copyFileSync(path,target);
 }
}
writeFileSync(resolve(root,'trip/assets/cebu-bohol-hotel-media-v1.json'),JSON.stringify(newMedia,null,2)+'\n');
const pages=[];
for(const {page,config,source} of planned){
 const filename=page.articleType==='guide'?'cebu-bohol-with-kids.md':page.file;
 writeFileSync(resolve(content,filename),source);
 pages.push({...page,source:`trip/content/philippines/${filename}`,config});
 if(page.articleType==='guide')writeFileSync(resolve(root,'trip/data/cebu-bohol-guide.json'),JSON.stringify(config,null,2)+'\n');
}
const mapArtifact=pack.artifacts.find(a=>/^alma-hotel-sources-map-v\d+\.md$/.test(a.path));
for(const artifact of pack.artifacts.filter(a=>/^alma-hotel-(?:sources-map|selfcheck)-v\d+\.md$/.test(a.path)))copyFileSync(projectPath(project,artifact.path),resolve(content,artifact.path));
copyFileSync(projectPath(project,packName),resolve(content,packName));
if(factAudit)copyFileSync(projectPath(project,factAudit.path),resolve(content,factAudit.path));
writeFileSync(previousReceipt,JSON.stringify({sourceOwner:'Alma',sourceArtifact:pack.pages[0].file,sha256:pack.pages[0].sha256,sourceMapArtifact:mapArtifact.path,sourceMapSha256:mapArtifact.sha256,freezeArtifact:packName,freezeSha256:sha256,importedAt:new Date().toISOString(),contentChanges:false,factAcceptance:factAudit?.status||pack.review.terraFactStatus,...(factAudit?{factAudit}:{})},null,2)+'\n');
writeFileSync(resolve(root,'trip/data/cebu-bohol-hotel-publication-v1.json'),JSON.stringify({workId:pack.workId,sourcePackSha256:sha256,publicationAuthorized:false,review:pack.review,...(factAudit?{factAudit}:{}),pages},null,2)+'\n');
if(hash(readFileSync(resolve(root,'trip/assets/cebu-bohol-media.json')))!==hash(original))throw Error('Original 32-image manifest changed');
console.log(`Imported three hash-bound editorial sources; ${newMedia.length} hotel media records (versioned master/variant bytes protected); archived prior guide, original 32 media unchanged; no publication or UI acceptance.`);
