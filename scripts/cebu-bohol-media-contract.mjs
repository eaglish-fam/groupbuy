export function validateExpandedMediaBundle(manifest,previous){
 const all=[...manifest.photos,...manifest.videoFrames];
 if(manifest.workId!=='cebu-bohol-blog-20260930'||manifest.schemaVersion!=='luca-media-plan/4'||manifest.status!=='MEDIA_V4_READY_FOR_KIRA_IMPORT'||manifest.importReady!==true)throw Error('v4 is not ready for import');
 if(manifest.totalReadyImages!==32||manifest.assetCount!==32||all.length!==32||manifest.photos.length!==8||manifest.videoFrames.length!==24||manifest.carriedForwardCount!==15||manifest.newFrameCount!==17)throw Error('Inconsistent v4 32-image counts');
 if(new Set(all.map(m=>m.id)).size!==32)throw Error('Duplicate v4 media ID');
 const old=[...previous.photos,...previous.videoFrames];
 for(const m of old){const now=all.find(n=>n.id===m.id);
  if(!now||now.sourceSha256!==m.sourceSha256||now.derivedSha256!==m.derivedSha256)throw Error(`Inherited media changed: ${m.id}`);
  if(m.id.startsWith('frame')&&(now.presentationTimestamp!==m.presentationTimestamp||now.timeBase!==m.timeBase||JSON.stringify(now.crop)!==JSON.stringify(m.crop)))throw Error(`Inherited frame changed: ${m.id}`);
 }
 for(const m of manifest.videoFrames){
  const r=m.activePictureRect;
  if(!Number.isSafeInteger(m.presentationTimestamp)||m.timeBase!=='1/60000'||m.sourceSha256!=='646e22ae077095f6604740ae09819de0b8d4b500b7cd787423f764a01c44ced9'||m.sourceUrl!=='https://www.youtube.com/watch?v=QmngtzfPVDk'||m.letterbox!==false||m.contentEditApplied!==false)throw Error(`Invalid frame source: ${m.id}`);
  if(!r||![r.x,r.y,r.w,r.h].every(Number.isInteger)||r.x<0||r.y<0||r.w!==m.width||r.h!==m.height||r.x+r.w>m.beforeWidth||r.y+r.h>m.beforeHeight||Boolean(m.crop)!==m.cropApplied||m.crop&&JSON.stringify(m.crop)!==JSON.stringify(r))throw Error(`Invalid frame crop: ${m.id}`);
 }
 const expected={mist:4,ubeco:4,molly:3,lila:4,'henann-brand':2};
 if(manifest.expandedSections?.length!==5)throw Error('Missing v4 section groups');
 const grouped=[];
 for(const [section,count] of Object.entries(expected)){
  const g=manifest.expandedSections.find(s=>s.section===section);
  if(!g||g.assetIds.length!==count||!g.assetIds.includes(g.heroId)||section==='henann-brand'&&g.formalBranchMapAllowed!==false)throw Error(`Invalid v4 group: ${section}`);
  for(const id of g.assetIds){const m=all.find(n=>n.id===id);if(!m||m.section!==section||old.some(n=>n.id===id))throw Error(`Invalid v4 section media: ${id}`);}
  if(new Set(g.assetIds.map(id=>all.find(m=>m.id===id).presentationTimestamp)).size!==count)throw Error(`Repeated source frame: ${section}`);
  grouped.push(...g.assetIds);
 }
 if(new Set(grouped).size!==17)throw Error('Repeated/missing expanded source identities');
 return all;
}
