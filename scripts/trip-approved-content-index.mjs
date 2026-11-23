import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {approvedTravelRegistrations} from './trip-approved-registration.mjs';
// Refresh after the final global SEO/font pass as well as initial rendering.
// The index hashes actual compiled documents, not pre-normalization snapshots.
export function writeApprovedTravelContentIndex(root,registrations=approvedTravelRegistrations(root)){
 if(!registrations.length)return null;
 const index={schema:'eaglish.approved-travel-content-index/v2',
  packages:registrations.map(r=>({dataPath:r.dataPath,packageSha256:r.expectedSha256,publication:r.publication})),
  pages:registrations.flatMap(r=>[...r.data.countries.filter(c=>!c.singleDestination),...r.data.cities].map(page=>({path:page.path,packageSha256:r.expectedSha256,title:page.title,description:page.description,updatedOn:page.updatedOn,sourceIds:page.sourceIds,sha256:createHash('sha256').update(readFileSync(resolve(root,page.path.slice(1),'index.html'))).digest('hex')})))};
 writeFileSync(resolve(root,'trip/data/approved-travel-content-index-v1.json'),JSON.stringify(index,null,2)+'\n');
 return index;
}
