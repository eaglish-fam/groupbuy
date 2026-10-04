// Executable synthetic sample only, not a website entry point or travel source.
import {mkdtempSync,writeFileSync,mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {syntheticTravelPackage,writeSyntheticPackage} from './travel-approved-package.mjs';
import {readApprovedTravelPackage,publicPackageHash} from '../../scripts/trip-approved-public-package.mjs';
import {renderApprovedCity} from '../../scripts/trip-city-approved-adapter.mjs';
import {renderApprovedCountry} from '../../scripts/trip-country-approved-adapter.mjs';
const root=mkdtempSync(resolve(tmpdir(),'approved-six-page-dry-build-'));
const data=await syntheticTravelPackage(root),frozen=writeSyntheticPackage(root,data);
const checked=await readApprovedTravelPackage(root,{...frozen,countryIds:data.coverage.countryIds,cityIds:data.coverage.cityIds});
const pages=[];
for(const [kind,records,render] of [['country',data.countries,renderApprovedCountry],['city',data.cities,renderApprovedCity]])for(const page of records){
 const html=render(data,page.id),path=resolve(root,page.path.slice(1),'index.html');mkdirSync(resolve(path,'..'),{recursive:true});writeFileSync(path,html);
 pages.push({kind,id:page.id,route:page.path,bytes:Buffer.byteLength(html),sha256:publicPackageHash(Buffer.from(html)),noindex:html.includes('content="noindex,nofollow"'),highPriorityImages:(html.match(/<img[^>]*fetchpriority="high"/g)||[]).length,latePlanner:html.indexOf('<section id="plan"')>html.indexOf('<section id="faq"')});
}
console.log(JSON.stringify({schema:'kira.synthetic-six-page-dry-build/v1',fixtureOnly:true,root,publicBuildRegistered:false,articleSha256:checked.articleSha256,verifiedMediaVariants:checked.verifiedVariants,pages,visualQA:false,realEuropeCopyOrMedia:false},null,2));
