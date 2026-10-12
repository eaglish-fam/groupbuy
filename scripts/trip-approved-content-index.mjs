import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {approvedTravelRegistration} from './trip-approved-registration.mjs';
// Refresh after the final global SEO/font pass as well as initial rendering.
// The index hashes actual compiled documents, not pre-normalization snapshots.
export function writeApprovedTravelContentIndex(root,registration=approvedTravelRegistration(root)){
 if(!registration)return null;
 const data=registration.data;
 const index={schema:'eaglish.approved-travel-content-index/v1',packageSha256:registration.expectedSha256,publication:registration.publication,pages:[...data.countries,...data.cities].map(page=>({path:page.path,title:page.title,description:page.description,updatedOn:page.updatedOn,sourceIds:page.sourceIds,sha256:createHash('sha256').update(readFileSync(resolve(root,page.path.slice(1),'index.html'))).digest('hex')}))};
 writeFileSync(resolve(root,'trip/data/approved-travel-content-index-v1.json'),JSON.stringify(index,null,2)+'\n');
 return index;
}
