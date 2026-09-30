import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateHotelSelection,projectPath} from '../scripts/check-cebu-bohol-hotel-media.mjs';

const ids=['molly-stair-circulation','molly-room-robe-detail','henann-brand-open-corridor'];
const selection={workId:'cebu-bohol-blog-20260930',reviewer:'Eliora',selected:ids,excluded:{'henann-brand-interior-departure':'unapproved'}};
const source={workId:selection.workId,frozenV4Modified:false,assetCount:4,assets:[...ids,'henann-brand-interior-departure'].map(id=>({id,sourceId:'youtube-QmngtzfPVDk',sourceSha256:'646e22ae077095f6604740ae09819de0b8d4b500b7cd787423f764a01c44ced9',timeBase:'1/60000',presentationTimestamp:60000,actualSeconds:1,contentEdited:false,retainedPngPixelsEqual:true,objectFit:'contain',beforeDimensions:[1920,1080],crop:{x:0,y:108,w:1920,h:864},width:1920,height:864,webpSha256:'a'.repeat(64),pngSha256:'b'.repeat(64),uncroppedEvidenceSha256:'c'.repeat(64)}))};
test('hotel preflight only permits the exact selected three sources and preserves excluded evidence',()=>{
 assert.deepEqual(validateHotelSelection(selection,source).map(m=>m.id),ids);
 assert.throws(()=>validateHotelSelection({...selection,selected:[...ids,'henann-brand-interior-departure']},source),/scope/);
 assert.throws(()=>validateHotelSelection({...selection,reviewer:'unknown'},source),/owner/);
 assert.throws(()=>validateHotelSelection(selection,{...source,frozenV4Modified:true}),/protected history/);
});
test('hotel source validation fails closed on crop, edited content, time identity and hash changes',()=>{
 for(const patch of [{crop:{x:0,y:0,w:1920,h:864}},{contentEdited:true},{presentationTimestamp:60001},{timeBase:'1/1000'},{webpSha256:null}]){
  const changed=structuredClone(source);Object.assign(changed.assets[0],patch);
  assert.throws(()=>validateHotelSelection(selection,changed),/mismatch|hash/);
 }
});
test('source paths are restricted to approved Project, never peer private workspace',()=>{
 assert.equal(projectPath('/tmp/approved','media/photo.webp'),'/tmp/approved/media/photo.webp');
 assert.throws(()=>projectPath('/tmp/approved','../private/video.mp4'),/escapes/);
 assert.throws(()=>projectPath('/tmp/approved','/tmp/other/video.mp4'),/escapes/);
 assert.throws(()=>projectPath('/tmp/approved','.'),/escapes/);
 assert.ok(readFileSync(new URL('../scripts/check-cebu-bohol-hotel-media.mjs',import.meta.url),'utf8').includes('No candidate publication performed'));
});
