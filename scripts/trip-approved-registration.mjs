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
// A single-destination country shares its guide's page, so it is not a page of its own.
const pagesOf=pkg=>[...pkg.data.countries.filter(c=>!c.singleDestination),...pkg.data.cities,...(pkg.data.routes||[])];
// v1 registers one published package; v2 lists several. Each keeps its own
// byte-bound source file, and no two packages may claim the same page path.
export function approvedTravelRegistrations(root){
 const path=resolve(root,'trip/data/approved-travel-registration-v1.json');if(!existsSync(path))return [];
 const file=JSON.parse(readFileSync(path));
 const list=file.schema==='eaglish.approved-travel-registration/v1'?[file]
  :file.schema==='eaglish.approved-travel-registration/v2'&&Array.isArray(file.packages)&&file.packages.length?file.packages:null;
 if(!list||!list.every(validRegistration))throw Error('Invalid travel registration');
 const dataPaths=new Set(),paths=new Set();
 return list.map(registration=>{
  if(dataPaths.has(registration.dataPath))throw Error('Published travel package registered twice');dataPaths.add(registration.dataPath);
  const bound=boundPackage(root,registration);
  for(const page of pagesOf(bound)){if(paths.has(page.path))throw Error('Published travel page collides with another package: '+page.path);paths.add(page.path);}
  return bound;
 });
}
// Candidate packages render noindex pages for owner review. They never join
// the published registration, its content index, sitemap or discovery entries.
export function approvedTravelCandidates(root,published=approvedTravelRegistrations(root)){
 const path=resolve(root,'trip/data/approved-travel-candidates-v1.json');if(!existsSync(path))return [];
 const file=JSON.parse(readFileSync(path));
 if(file.schema!=='eaglish.approved-travel-candidates/v1'||!Array.isArray(file.packages))throw Error('Invalid travel candidate registration');
 const paths=new Set((published||[]).flatMap(pkg=>pagesOf(pkg).map(p=>p.path))),dataPaths=new Set((published||[]).map(pkg=>pkg.dataPath));
 return file.packages.map(registration=>{
  if(!validRegistration(registration)||registration.publication!==false)throw Error('Candidate travel packages must stay unpublished');
  if(dataPaths.has(registration.dataPath))throw Error('Candidate travel package registered twice');dataPaths.add(registration.dataPath);
  const bound=boundPackage(root,registration);
  for(const page of pagesOf(bound)){if(paths.has(page.path))throw Error('Candidate travel page collides with another package: '+page.path);paths.add(page.path);}
  return bound;
 });
}
