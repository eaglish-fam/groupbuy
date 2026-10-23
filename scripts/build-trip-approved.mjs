import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {approvedTravelRegistrations,approvedTravelCandidates} from './trip-approved-registration.mjs';
import {readApprovedTravelPackage} from './trip-approved-public-package.mjs';
import {renderApprovedCity} from './trip-city-approved-adapter.mjs';
import {renderApprovedCountry} from './trip-country-approved-adapter.mjs';
import {renderApprovedRoute} from './trip-route-approved-adapter.mjs';
import {writeApprovedTravelContentIndex} from './trip-approved-content-index.mjs';
async function renderPackage(root,registration){
 const view=await readApprovedTravelPackage(root,registration);
 const pages=[...view.countries.values()].filter(c=>!c.singleDestination).map(c=>[c.path,renderApprovedCountry(view.data,c.id,registration)]).concat([...view.cities.values()].map(c=>[c.path,renderApprovedCity(view.data,c.id,registration)]),[...view.routes.values()].map(r=>[r.path,renderApprovedRoute(view.data,r.id,registration)]));
 return {view,pages};
}
export async function buildApprovedTravel(root){
 const registrations=approvedTravelRegistrations(root);if(!registrations.length)return null;
 const published=[];for(const registration of registrations)published.push(await renderPackage(root,registration));
 const candidates=[];for(const candidate of approvedTravelCandidates(root,registrations))candidates.push(await renderPackage(root,candidate));
 // No partial writes on source/image/renderer failure.
 for(const[path,html]of [...published,...candidates].flatMap(p=>p.pages)){const directory=resolve(root,path.slice(1));mkdirSync(directory,{recursive:true});writeFileSync(resolve(directory,'index.html'),html);}
 // Travel has its own source-bound index; the shop's blog index stays unchanged.
 writeApprovedTravelContentIndex(root,registrations);
 return {pages:published.flatMap(p=>p.pages.map(([path])=>path)),candidatePages:candidates.flatMap(c=>c.pages.map(([path])=>path)),verifiedVariants:published.reduce((sum,p)=>sum+p.view.verifiedVariants,0)};
}
