import {writeFileSync,mkdirSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {buildDestinations} from './build-trip-destinations.mjs';
import {buildNewZealand} from './build-trip-new-zealand.mjs';
import {buildCebuBohol} from './build-trip-cebu-bohol.mjs';
import {buildCebuBoholHotels} from './build-trip-cebu-bohol-hotels.mjs';
import {buildApprovedTravel} from './build-trip-approved.mjs';
import {bangkokCatalog,media} from './trip-bangkok-places.mjs';
const root=resolve(import.meta.dirname,'..');
// Verify the registered portable closure before any legacy writer runs. Thailand
// (hub, Bangkok, Chiang Mai, Chiang Rai) and Singapore render from their approved packages.
await buildApprovedTravel(root);
writeFileSync(resolve(root,'trip/assets/bkk-media.json'),JSON.stringify(Object.entries(media).map(([id,m])=>({
 id,source:m.source||(m.video?`https://www.youtube.com/watch?v=${m.video}`:bangkokCatalog.video)+`&t=${m.second}s`,kind:m.kind||'owned-video-frame',creator:'鷹式一家',reviewedAt:m.reviewedAt||'2026-09-26',alt:m.alt,
 ...(m.kind==='user-supplied-photo'?{section:m.section,photoNumber:m.photoNumber,originalSha256:m.originalSha256,originalBytes:m.originalBytes}:{crop:m.crop||[0,0,1920,1080]}),
 width:m.width||1440,height:m.height,variants:['',...[640,960].filter(w=>w<(m.width||1440)).map(w=>'-'+w)].map(suffix=>{const file=`/trip/assets/${id}${suffix}.webp`,buffer=readFileSync(resolve(root,'.'+file));return {file,bytes:buffer.length,sha256:createHash('sha256').update(buffer).digest('hex')};})
})),null,2)+'\n');
buildCebuBohol(root);
buildCebuBoholHotels(root);
buildDestinations(root);
buildNewZealand();
console.log('Built approved travel pages and shared destination cards.');
