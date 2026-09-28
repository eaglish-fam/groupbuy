import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {travelHomeCatalog} from '../trip/home-catalog.mjs';
import {travelHomeCommerce} from '../trip/home-commerce.mjs';
import {renderTravelHome} from '../scripts/build-trip-home.mjs';
import {projectDestination,destinationOnLand,renderWorldAtlas} from '../scripts/trip-world-atlas.mjs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const fixtures=[
 ['us','美國','americas','美洲','840',[-100,40]],['ca','加拿大','americas','美洲','124',[-106,56]],
 ['uk','英國','europe','歐洲','826',[-2,54]],['fr','法國','europe','歐洲','250',[2,46]],
 ['it','義大利','europe','歐洲','380',[12,43]],['jp','日本','asia','亞洲','392',[138,36]],
 ['au','澳洲','oceania','大洋洲','036',[134,-25]],['tw','台灣','asia','亞洲','158',[121,24]],
];
function tenCountryCatalog(){
 const catalog=structuredClone(travelHomeCatalog);
 for(const [id,name,region,regionLabel,isoNumeric,point] of fixtures){
  const countryId='fixture-'+id,guideId=countryId+'-guide';
  catalog.countries.push({...structuredClone(catalog.countries[0]),id:countryId,name,englishName:id,href:`/trip/${countryId}/`,region,regionLabel,geography:{isoNumeric,point},guideIds:[guideId]});
  catalog.guides.push({...structuredClone(catalog.guides[0]),id:guideId,countryId,href:`/trip/${countryId}/guide/`});
 }
 return catalog;
}

test('atlas places published destination points on their actual land geometry',()=>{
 for(const country of travelHomeCatalog.countries){
  assert.equal(destinationOnLand(country.geography),true,country.id);
  const [x,y]=projectDestination(country.geography.point);
  assert.ok(x>=16&&x<=984&&y>=12&&y<=538,country.id);
 }
 for(const point of [[181,0],[0,91],[NaN,0],[],[0]])assert.throws(()=>projectDestination(point));
 assert.throws(()=>renderWorldAtlas([{id:'unknown',geography:{point:[0,0],isoNumeric:'invalid'}}]));
 const small=renderWorldAtlas([{id:'singapore',name:'新加坡',href:'/trip/singapore/',geography:{point:[103.82,1.35],isoNumeric:'702'}}]);
 assert.match(small,/data-atlas-country="singapore"/);
 assert.doesNotMatch(small,/data-atlas-land="singapore"/);
 const adjacent=renderWorldAtlas([
  {id:'france',name:'法國',href:'/trip/france/',geography:{point:[2.35,48.85],isoNumeric:'250'}},
  {id:'germany',name:'德國',href:'/trip/germany/',geography:{point:[13.4,52.52],isoNumeric:'276'}},
 ]);
 assert.equal((adjacent.match(/data-atlas-decorative="true"/g)||[]).length,2);
 assert.doesNotMatch(adjacent,/<a /);
});

test('ten destinations reuse atlas, region filters, panels and guide options without entering production',()=>{
 const catalog=tenCountryCatalog(),html=renderTravelHome(catalog);
 assert.equal((html.match(/data-atlas-country=/g)||[]).length,10);
 assert.equal((html.match(/data-atlas-choice=/g)||[]).length,10);
 assert.equal((html.match(/data-country-panel=/g)||[]).length,10);
 assert.equal((html.match(/data-atlas-region=/g)||[]).length,5);
 assert.match(html,/home-world-map-dense/);
 assert.equal((html.match(/data-atlas-decorative="true"/g)||[]).length,10);
 assert.doesNotMatch(html,/NaN|Infinity/);
 for(const country of catalog.countries){
  assert.ok(html.includes(`value="${country.id}"`));
  assert.ok(html.includes(`href="${country.href}"`));
 }
 assert.doesNotMatch(read('trip/index.html'),/fixture-(us|ca|uk|fr|it|jp|au|tw)/);
});

test('affiliate offers resolve to existing guide anchors and unchanged source tracking URLs',()=>{
 const html=renderTravelHome();
 for(const offer of travelHomeCommerce.offers){
  const guide=travelHomeCatalog.guides.find(g=>g.id===offer.guideId);
  assert.equal(guide.countryId,offer.countryId);
  assert.ok(offer.guideHref.startsWith(guide.href+'#'));
  const page=read(guide.href.slice(1)+'index.html');
  assert.ok(page.includes(`id="${offer.guideHref.split('#')[1]}"`),offer.guideHref);
  const source=read(offer.source.file)+(offer.source.linkBuilder?read(offer.source.linkBuilder):'');
  for(const provider of offer.providers){
   const escaped=provider.url.replaceAll('&','&amp;');
   assert.ok(source.includes(provider.url)||page.includes(`href="${escaped}"`),provider.url);
   assert.ok(['affiliate.klook.com','www.kkday.com'].includes(new URL(provider.url).hostname));
   assert.ok(html.includes(`href="${provider.url.replaceAll('&','&amp;')}" target="_blank" rel="sponsored noopener"`));
  }
 }
 assert.ok(html.includes(travelHomeCommerce.disclosure));
 assert.equal(travelHomeCommerce.capabilities.find(c=>c.id==='lodging').status,'needsLink');
 assert.equal(travelHomeCommerce.capabilities.find(c=>c.id==='flights').status,'paused');
 assert.doesNotMatch(html,/<script[^>]+(?:flights\.js|klook|kkday|agoda)|href="https:[^"]*agoda|href="\/trip\/flights\//);
 assert.doesNotMatch(read('trip/home.js'),/fetch\(|XMLHttpRequest|gtag\(|setInterval\(/);
});

test('ten-country controller supports region selection, expand and contextual commerce without silently filtering guides',()=>{
 const catalog=tenCountryCatalog();
 const el=(dataset={})=>({dataset,hidden:false,attrs:{},events:{},textContent:'',classList:{toggle(){}},setAttribute(k,v){this.attrs[k]=v;},addEventListener(k,f){this.events[k]=f;},querySelector(){return {textContent:this.dataset.atlasChoice||'',focus(){}};}});
 const choices=catalog.countries.map(c=>el({atlasChoice:c.id,countryRegion:c.region}));
 const pins=catalog.countries.map(c=>el({atlasCountry:c.id}));
 const panels=catalog.countries.map(c=>el({countryPanel:c.id}));
 const regions=['all','asia','oceania','americas','europe'].map(id=>el({atlasRegion:id}));
 const offers=travelHomeCommerce.offers.map(o=>el({offerCountry:o.countryId}));
 const explore=catalog.countries.map(c=>el({exploreCountry:c.id}));
 const country={value:'all',selectedOptions:[{textContent:'選擇國家'}],focus(){}},theme={value:'all',selectedOptions:[{textContent:'玩法'}]};
 const form=el();form.elements={country,theme};form.reset=()=>form.events.reset({preventDefault(){}});
 const cards=catalog.guides.map(g=>el({guideId:g.id,country:g.countryId,themes:g.suitableFor.join(' ')}));
 const grid=el();grid.querySelectorAll=()=>cards;
 const singles={'[data-home-filters]':form,'[data-home-guides]':grid,'.home-atlas':el()};
 for(const name of ['home-status','home-empty','home-more','home-reset','atlas-more','atlas-status','commerce-empty','region-filters'])singles[`[data-${name}]`]=el();
 singles['.home-affiliate-note']=el();
 const lists={'[data-atlas-choice]':choices,'[data-atlas-country]':pins,'[data-country-panel]':panels,'[data-atlas-region]':regions,'[data-offer-country]':offers,'[data-explore-country]':explore};
 runInNewContext(read('trip/home.js'),{document:{querySelector:s=>singles[s]||null,querySelectorAll:s=>lists[s]||[]}});
 const click=control=>control.events.click({preventDefault(){}});
 assert.equal(choices.filter(c=>!c.hidden).length,6);
 assert.equal(panels.filter(c=>!c.hidden).length,1);
 assert.equal(singles['.home-affiliate-note'].hidden,false);
 click(singles['[data-atlas-more]']);assert.equal(choices.filter(c=>!c.hidden).length,10);
 click(regions.find(r=>r.dataset.atlasRegion==='europe'));
 assert.equal(choices.filter(c=>!c.hidden).length,3);
 assert.equal(pins.filter(c=>!c.hidden).length,3);
 assert.equal(panels.find(c=>!c.hidden).dataset.countryPanel,'fixture-uk');
 assert.equal(country.value,'all');
 assert.equal(singles['[data-commerce-empty]'].hidden,false);
 assert.equal(singles['.home-affiliate-note'].hidden,true);
 click(regions[0]);
 const nz=choices.find(c=>c.dataset.atlasChoice==='new-zealand');
 nz.events.keydown({key:' ',preventDefault(){}});
 assert.equal(panels.find(c=>!c.hidden).dataset.countryPanel,'new-zealand');
 assert.equal(country.value,'all');
 click(explore.find(c=>c.dataset.exploreCountry==='new-zealand'));
 assert.equal(country.value,'new-zealand');
 assert.equal(cards.filter(c=>!c.hidden).length,6);
 click(singles['[data-home-more]']);assert.equal(cards.filter(c=>!c.hidden).length,8);
 click(choices[0]);assert.equal(offers.filter(c=>!c.hidden).length,3);
 assert.equal(singles['.home-affiliate-note'].hidden,false);
});
