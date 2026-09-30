import test from 'node:test';
import assert from 'node:assert/strict';
import {validateExpandedMediaBundle} from '../scripts/cebu-bohol-media-contract.mjs';
function bundle(){
 const photos=Array.from({length:8},(_,i)=>({id:`photo-${String(i+1).padStart(2,'0')}`,sourceSha256:'photo-source',derivedSha256:'photo-output'}));
 const frames=Array.from({length:24},(_,i)=>({id:`frame-${String(i+9).padStart(2,'0')}`,sourceSha256:'646e22ae077095f6604740ae09819de0b8d4b500b7cd787423f764a01c44ced9',derivedSha256:'frame-output',presentationTimestamp:i*60000,timeBase:'1/60000',sourceUrl:'https://www.youtube.com/watch?v=QmngtzfPVDk',letterbox:false,contentEditApplied:false,width:1920,height:1080,beforeWidth:1920,beforeHeight:1080,crop:null,cropApplied:false,activePictureRect:{x:0,y:0,w:1920,h:1080}}));
 const previous={photos:structuredClone(photos),videoFrames:structuredClone(frames.slice(0,7))};
 let n=7;
 const expandedSections=Object.entries({mist:4,ubeco:4,molly:3,lila:4,'henann-brand':2}).map(([section,count])=>{const group=frames.slice(n,n+=count);for(const f of group)f.section=section;return {section,assetIds:group.map(f=>f.id),heroId:group[0].id,formalBranchMapAllowed:false};});
 return {previous,manifest:{workId:'cebu-bohol-blog-20260930',schemaVersion:'luca-media-plan/4',status:'MEDIA_V4_READY_FOR_KIRA_IMPORT',importReady:true,totalReadyImages:32,assetCount:32,carriedForwardCount:15,newFrameCount:17,photos,videoFrames:frames,expandedSections}};
}
test('v4 counts, inherited identities and distinct expanded source groups agree',()=>{const {manifest,previous}=bundle();assert.equal(validateExpandedMediaBundle(manifest,previous).length,32);});
test('stale totals, changed inheritance, duplicate identities and invalid crop fail closed',()=>{
 for(const change of [m=>m.totalReadyImages=15,m=>m.photos[0].derivedSha256='changed',m=>m.videoFrames[23].id=m.videoFrames[22].id,m=>m.videoFrames[7].cropApplied=true,m=>m.videoFrames[7].activePictureRect.x=1]){const {manifest,previous}=bundle();change(manifest);assert.throws(()=>validateExpandedMediaBundle(manifest,previous));}
});
test('unsupported branch mapping, repeated PTS and missing expanded identities fail closed',()=>{
 for(const change of [m=>m.expandedSections[4].formalBranchMapAllowed=true,m=>m.videoFrames[8].presentationTimestamp=m.videoFrames[7].presentationTimestamp,m=>m.expandedSections[0].assetIds.pop(),m=>m.videoFrames[7].contentEditApplied=true]){const {manifest,previous}=bundle();change(manifest);assert.throws(()=>validateExpandedMediaBundle(manifest,previous));}
});
