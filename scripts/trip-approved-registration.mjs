import {existsSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {validateApprovedTravelPackage} from '../trip/approved-travel-contract.mjs';
export function approvedTravelRegistration(root){
 const path=resolve(root,'trip/data/approved-travel-registration-v1.json');if(!existsSync(path))return null;
 const registration=JSON.parse(readFileSync(path));
 if(registration.schema!=='eaglish.approved-travel-registration/v1'||!/^trip\/data\/[a-z0-9-]+\.json$/.test(registration.dataPath)||!/^[a-f0-9]{64}$/.test(registration.expectedSha256)||typeof registration.publication!=='boolean')throw Error('Invalid travel registration');
 const raw=readFileSync(resolve(root,registration.dataPath));if(createHash('sha256').update(raw).digest('hex')!==registration.expectedSha256)throw Error('Registered travel package changed');
 const view=validateApprovedTravelPackage(JSON.parse(raw),registration);
 return {...registration,data:view.data};
}
