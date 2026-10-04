import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {approvedTravelRegistration} from './trip-approved-registration.mjs';
import {readApprovedTravelPackage} from './trip-approved-public-package.mjs';
import {renderApprovedCity} from './trip-city-approved-adapter.mjs';
import {renderApprovedCountry} from './trip-country-approved-adapter.mjs';
export async function buildApprovedTravel(root){
 const registration=approvedTravelRegistration(root);if(!registration)return null;
 const view=await readApprovedTravelPackage(root,registration);
 const pages=[...view.countries.values()].map(c=>[c.path,renderApprovedCountry(view.data,c.id,registration)]).concat([...view.cities.values()].map(c=>[c.path,renderApprovedCity(view.data,c.id,registration)]));
 // No partial writes on source/image/renderer failure.
 for(const[path,html]of pages){const directory=resolve(root,path.slice(1));mkdirSync(directory,{recursive:true});writeFileSync(resolve(directory,'index.html'),html);}
 return {pages:pages.map(([path])=>path),verifiedVariants:view.verifiedVariants,articleSha256:view.articleSha256};
}
