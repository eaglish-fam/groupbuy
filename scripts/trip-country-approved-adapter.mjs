import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateApprovedTravelPackage} from '../trip/approved-travel-contract.mjs';
import {approvedPicture,approvedFigure,approvedTravelMetadata,paragraphs,travelLink,escapeTravel} from './trip-city-approved-adapter.mjs';
import {plannerAssets,plannerEntry} from './trip-planner-entry.mjs';
import {renderSiteNavigation} from './site-navigation.mjs';
import {prioritizeFirstTravelImage} from './trip-image-priority.mjs';
import {renderApprovedCountryBody,approvedCountryAssets} from './trip-approved-country-body.mjs';
import {renderApprovedCountryMap} from './trip-approved-country-map.mjs';
import {travelScriptJson} from './trip-city-approved-adapter.mjs';
const esc=escapeTravel;
export function renderApprovedCountry(data,countryId,{publication=false}={}){
 const v=validateApprovedTravelPackage(data),c=v.countries.get(countryId);if(!c)throw Error('Unknown approved country');
 const cities=c.cityIds.map(id=>v.cities.get(id));
 const css=readFileSync(new URL('../trip/trip.css',import.meta.url),'utf8')+'\n'+readFileSync(new URL('../trip/country-approved.css',import.meta.url),'utf8')+'\n'+readFileSync(new URL('../trip/approved-city-guide.css',import.meta.url),'utf8')+'\n'+readFileSync(new URL('../trip/approved-heading-hierarchy.css',import.meta.url),'utf8');
 let body=renderApprovedCountryBody(data,countryId,{mapHtml:renderApprovedCountryMap(c)});
 if(c.allocation){
  // Supported combinations are selected by the source-owned route dropdown,
  // never by free checkboxes that appear to offer unsupported combinations.
  const options=cities.map(city=>`<input type="checkbox" hidden checked value="${esc(city.id)}" data-country-destination>`).join('')+`<p>依所選路線的目的地順序安排；若只去其中一地，可使用下方城市行程。</p><nav aria-label="各城市行程">${cities.map(city=>travelLink({url:city.path+'#plan',label:city.name+'行程'})).join(' · ')}</nav>`;
  body=body.replace('<form data-country-plan>','<form data-country-plan>'+options).replace('<button type="submit" class="th-share">安排旅程</button>','<label>同行最小年齡（選填）<input name="youngestAge" type="number" min="0" max="110" step="1"></label><button type="submit" class="th-share">查看行程</button><button type="button" data-country-share>分享行程連結</button><p data-country-share-status role="status"></p>');
  body+=`<script type="application/json" id="approved-country-plan-data">${travelScriptJson({country:c,cities:cities.map(city=>({id:city.id,name:city.name,path:city.path,places:city.places.map(p=>({id:p.id,title:p.title,links:p.links})),planner:city.planner}))})}</script><script type="module" src="/trip/approved-country-planner.mjs"></script>`;
 }
 const styleHash=createHash('sha256').update(css).digest('hex');
 const explorerHash=createHash('sha256').update(readFileSync(new URL('../trip/country-explorer.mjs',import.meta.url))).digest('hex').slice(0,12);
 const countryAssets=approvedCountryAssets.replace('/trip/country-explorer.mjs"',`/trip/country-explorer.mjs?v=${explorerHash}"`);
 const html=`<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(c.metadataTitle||c.title+'｜鷹家遠行所')}</title>${approvedTravelMetadata(c,c,c.faq,{publication,imageUrl:v.assets.get(c.image).variants.at(-1).url,relatedPages:cities})}<meta property="og:image" content="https://www.eaglish.store${v.assets.get(c.image).variants.at(-1).url}"><link rel="icon" href="/icons/favicon.svg"><style data-approved-country-style>${css}</style>${plannerAssets}${countryAssets}<link rel="stylesheet" href="/site-navigation.css"></head><body class="approved-country"><a class="skip" href="#main">跳到主要內容</a><header class="masthead wrap"><a class="brand" href="/trip/"><img src="/flights/assets/faraway-wordmark.svg" width="220" height="65" alt="鷹家遠行所"></a><nav aria-label="主要導覽"><a href="#city-all">旅行總覽</a><a href="#experiences">找玩法</a><a href="#plan">排行程</a></nav></header><main id="main" class="wrap">${body}</main>${plannerEntry}<footer class="footer"><div class="wrap">${travelLink({url:'/trip/',label:'回旅行總覽'})}</div></footer>${renderSiteNavigation(c.path)}</body></html>`;
 return prioritizeFirstTravelImage(html.replace('<style data-approved-country-style>',`<style data-approved-country-style data-style-sha256="${styleHash}">`));
}
