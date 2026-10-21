import {existsSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {validateApprovedTravelPackage} from '../trip/approved-travel-contract.mjs';
const validRegistration=registration=>/^trip\/data\/[a-z0-9-]+\.json$/.test(registration?.dataPath)&&/^[a-f0-9]{64}$/.test(registration.expectedSha256)&&typeof registration.publication==='boolean';
function boundPackage(root,registration){
 const raw=readFileSync(resolve(root,registration.dataPath));if(createHash('sha256').update(raw).digest('hex')!==registration.expectedSha256)throw Error('Registered travel package changed');
 const view=validateApprovedTravelPackage(JSON.parse(raw),registration);
 return {...registration,data:view.data};
}
export function approvedTravelRegistration(root){
 const path=resolve(root,'trip/data/approved-travel-registration-v1.json');if(!existsSync(path))return null;
 const registration=JSON.parse(readFileSync(path));
 if(registration.schema!=='eaglish.approved-travel-registration/v1'||!validRegistration(registration))throw Error('Invalid travel registration');
 return boundPackage(root,registration);
}
// Candidate packages render noindex pages for owner review. They never join
// the published registration, its content index, sitemap or discovery entries.
export function approvedTravelCandidates(root,published=approvedTravelRegistration(root)){
 const path=resolve(root,'trip/data/approved-travel-candidates-v1.json');if(!existsSync(path))return [];
 const file=JSON.parse(readFileSync(path));
 if(file.schema!=='eaglish.approved-travel-candidates/v1'||!Array.isArray(file.packages))throw Error('Invalid travel candidate registration');
 const paths=new Set(published?[...published.data.countries,...published.data.cities,...(published.data.routes||[])].map(p=>p.path):[]),dataPaths=new Set(published?[published.dataPath]:[]);
 return file.packages.map(registration=>{
  if(!validRegistration(registration)||registration.publication!==false)throw Error('Candidate travel packages must stay unpublished');
  if(dataPaths.has(registration.dataPath))throw Error('Candidate travel package registered twice');dataPaths.add(registration.dataPath);
  const bound=boundPackage(root,registration);
  for(const page of [...bound.data.countries,...bound.data.cities,...(bound.data.routes||[])]){if(paths.has(page.path))throw Error('Candidate travel page collides with another package: '+page.path);paths.add(page.path);}
  return bound;
 });
}
