// R24 opt-in projection. The sole travel build verifies the public byte closure
// before the homepage consumes this registered package.
import {isDeepStrictEqual} from 'node:util';
import {validateApprovedTravelPackage} from '../trip/approved-travel-contract.mjs';
import {approvedPicture,escapeTravel,travelScriptJson} from './trip-city-approved-adapter.mjs';
import {renderPhotoFrame} from './trip-photo-frames-r22.mjs';
import {regionsForCatalog} from '../trip/home-regions.mjs';
const esc=escapeTravel;
export function renderApprovedHomePhoto(asset,sizes){
 return renderPhotoFrame(approvedPicture(asset,{sizes}),{page:'home',sequence:'approved-'+asset.assetId,assetIndex:asset.assetId,ratio:asset.width+':'+asset.height,position:asset.focalPoint});
}
export function prepareApprovedR24Discovery(html,data,{catalog,config}){
 const v=validateApprovedTravelPackage(data);
 if(config.privateAtlas!==null||!isDeepStrictEqual(catalog,config.catalog))throw Error('Reconcile the reviewed R24 catalog projection first');
 const projected=structuredClone(catalog),panels=[],cards=[],staticLinks=[];
 for(const c of v.countries.values()){
  const d=c.discovery;if(!d)throw Error('Approved country geography/discovery required');
  if(projected.countries.some(old=>old.id===c.id||old.href===c.path))throw Error('Discovery may only add explicitly new countries');
  const photo=v.assets.get(d.assetId),src=photo.variants.find(v=>v.width===960)||photo.variants.at(-1);
  // Future runtime consumes the explicit approvedPhoto, not a fake R22 context
  // or invented unsuffixed image filename. Old records retain their old shape.
  const country={id:c.id,name:c.name,englishName:c.englishName,href:c.path,region:d.region,subregion:d.subregion,summary:d.summary,geography:{point:d.point,isoNumeric:d.isoNumeric},guideIds:c.cityIds,image:{src:src.url,width:photo.width,height:photo.height,alt:photo.alt},approvedPhoto:photo};
  projected.countries.push(country);
  const region=regionsForCatalog(projected).find(r=>r.id===d.region);if(!region.children.some(child=>child.id===d.subregion))throw Error('Unknown discovery subregion');
  panels.push(`<article hidden class="home-country-panel" data-country-panel="${esc(c.id)}" aria-labelledby="country-title-${esc(c.id)}"><figure class="home-panel-photo">${approvedPicture(photo)}</figure><div class="home-panel-copy"><h3 id="country-title-${esc(c.id)}">${esc(c.name)}</h3><p>${esc(d.summary)}</p><a href="${c.path}">走進${esc(c.name)} ↗</a></div></article>`);
  staticLinks.push(`<a href="${c.path}">${esc(c.name)}旅行總覽</a>`);
  for(const cityId of c.cityIds){
   const city=v.cities.get(cityId),a=v.assets.get(city.hero[0]),src=a.variants.find(v=>v.width===960)||a.variants.at(-1);
   if(projected.guides.some(old=>old.id===city.id||old.href===city.path))throw Error('Duplicate discovery guide');
   projected.guides.push({id:city.id,countryId:c.id,name:city.name,englishName:city.englishName,href:city.path,summary:city.description,suitableFor:[],image:{src:src.url,width:a.width,height:a.height,alt:a.alt},approvedPhoto:a});
   cards.push(`<article class="home-guide" data-guide-id="${city.id}" data-country="${c.id}"><a class="home-guide-link" href="${city.path}"><div class="home-guide-photo">${renderApprovedHomePhoto(a,'(max-width:700px) calc(50vw - 27px), (max-width:1100px) calc(50vw - 42px), 378px')}</div><div class="home-guide-copy"><p class="home-guide-meta">${esc(c.name)}</p><h3>${esc(city.name)}<span aria-hidden="true">↗</span></h3><p class="home-guide-summary">${esc(city.description)}</p></div></a></article>`);
   staticLinks.push(`<a href="${city.path}">${esc(city.name)}攻略</a>`);
  }
 }
 const once=(markup,marker,insert)=>{if(markup.split(marker).length!==2)throw Error('Expected one actual R24 marker '+marker);return markup.replace(marker,marker+insert);};
 let output=once(html,'<div id="country-panels">',panels.join(''));
 output=once(output,'<div class="home-guide-grid" data-photo-grid="guides">',cards.join(''));
 output=output.replace('<div id="country-panels">',`<noscript><nav aria-label="新增旅行目的地">${staticLinks.join(' · ')}</nav></noscript><div id="country-panels">`);
 output=output.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,(tag,raw)=>{
  const schema=JSON.parse(raw);if(schema['@type']!=='CollectionPage')return tag;
  schema.hasPart=[...(schema.hasPart||[]),...[...v.countries.values(),...v.cities.values()].map(p=>({'@type':'WebPage',name:p.name,url:'https://www.eaglish.store'+p.path}))];
  return '<script type="application/ld+json">'+travelScriptJson(schema)+'</script>';
 });
 return {html:output,catalog:projected,config:{...structuredClone(config),catalog:projected,regions:regionsForCatalog(projected)},runtimeIntegrationRequired:false};
}
