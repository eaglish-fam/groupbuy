import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {travelHomeCatalog} from '../trip/home-catalog.mjs';
import {regionsForCatalog} from '../trip/home-regions.mjs';
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
  catalog.countries.push({...structuredClone(catalog.countries[0]),id:countryId,name,englishName:id,href:`/trip/${countryId}/`,region,regionLabel,subregion:region==='asia'?'east-asia':region==='europe'?({'uk':'northern-europe','fr':'western-europe','it':'southern-europe'}[id]):region==='oceania'?'australasia':'north-america',geography:{isoNumeric,point},guideIds:[guideId]});
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
 assert.equal((html.match(/data-atlas-country=/g)||[]).length,0); // No overlapping globe labels or hitboxes.
 assert.equal((html.match(/data-atlas-choice=/g)||[]).length,10);
 assert.equal((html.match(/data-country-panel=/g)||[]).length,10);
 assert.equal((html.match(/data-atlas-region=/g)||[]).length,6);
 assert.match(html,/home-globe-preview/);
 const config=JSON.parse(html.match(/id="home-globe-config">([\s\S]*?)<\/script>/)[1]);
 assert.equal(config.countries.length,10);
 assert.equal(config.initialRegion,'all');
 assert.match(html,/data-atlas-scope>世界<\/span>/);
 assert.equal(config.regions.find(r=>r.id==='asia').children.length,5);
 assert.doesNotMatch(html,/<script[^>]+src="[^"]*globe\.js|<link[^>]+globe-land/);
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

test('region and subregion browsing scales to ten countries, clears empty regions and synchronizes destination choices and offers',()=>{
 const catalog=tenCountryCatalog();
 const allRegions=regionsForCatalog(catalog);
 const el=(dataset={})=>({dataset,hidden:false,attrs:{},events:{},textContent:'',classList:{toggle(){}},setAttribute(k,v){this.attrs[k]=v;},addEventListener(k,f){this.events[k]=f;},querySelector(){return {textContent:this.dataset.atlasChoice||'',focus(){}};}});
 const choices=catalog.countries.map(c=>el({atlasChoice:c.id,countryRegion:c.region,countrySubregion:c.subregion||''}));
 const panels=catalog.countries.map(c=>el({countryPanel:c.id}));
 const regions=['all',...allRegions.map(r=>r.id)].map(id=>el({atlasRegion:id}));
 const subButtons=allRegions.flatMap(r=>['all',...r.children.map(c=>c.id)].map(id=>el({atlasSubregion:id,parentRegion:r.id})));
 const subGroups=allRegions.map(r=>el({subregionGroup:r.id}));
 const offers=travelHomeCommerce.offers.map(o=>el({offerCountry:o.countryId}));
 const explore=catalog.countries.map(c=>el({exploreCountry:c.id}));
 const country={value:'all',selectedOptions:[{textContent:'選擇國家'}],focus(){}},theme={value:'all',selectedOptions:[{textContent:'玩法'}]};
 const form=el();form.elements={country,theme};form.reset=()=>form.events.reset({preventDefault(){}});
 const cards=catalog.guides.map(g=>el({guideId:g.id,country:g.countryId,themes:g.suitableFor.join(' ')}));
 const grid=el();grid.querySelectorAll=()=>cards;
 const singles={'[data-home-filters]':form,'[data-home-guides]':grid,'.home-atlas':el()};
 for(const name of ['home-status','home-empty','home-more','home-reset','atlas-more','atlas-status','commerce-empty','region-filters','atlas-empty','atlas-back','atlas-scope','atlas-count','atlas-country-heading','atlas-empty-copy','atlas-return','subregions','atlas-breadcrumb','country-unavailable'])singles[`[data-${name}]`]=el();
 singles['.home-affiliate-note']=el();
 singles['#home-globe-config']={textContent:JSON.stringify({regions:allRegions,countries:catalog.countries,initialRegion:'all'})};
 const lists={'[data-atlas-choice]':choices,'[data-country-panel]':panels,'[data-atlas-region]':regions,'[data-atlas-subregion]':subButtons,'[data-subregion-group]':subGroups,'[data-offer-country]':offers,'[data-explore-country]':explore};
 runInNewContext(read('trip/home.js'),{document:{querySelector:s=>singles[s]||null,querySelectorAll:s=>lists[s]||[]}});
 const click=control=>control.events.click({preventDefault(){}});
 assert.equal(regions.find(r=>r.attrs['aria-pressed']==='true').dataset.atlasRegion,'all');
 assert.equal(choices.filter(c=>!c.hidden).length,6); // World starts with the first six destinations.
 assert.equal(panels.filter(c=>!c.hidden).length,1);
 assert.equal(singles['.home-affiliate-note'].hidden,false);
 click(subButtons.find(b=>b.dataset.atlasSubregion==='east-asia'));
 assert.deepEqual(choices.filter(c=>!c.hidden).map(c=>c.dataset.atlasChoice),['fixture-jp','fixture-tw']);
 assert.equal(panels.find(c=>!c.hidden).dataset.countryPanel,'fixture-jp');
 assert.equal(country.value,'fixture-jp');
 click(singles['[data-atlas-back]']);assert.equal(choices.filter(c=>!c.hidden).length,3);
 click(regions[0]);assert.equal(choices.filter(c=>!c.hidden).length,6);
 click(singles['[data-atlas-more]']);assert.equal(choices.filter(c=>!c.hidden).length,10);
 click(regions.find(r=>r.dataset.atlasRegion==='europe'));
 assert.equal(choices.filter(c=>!c.hidden).length,3);
 assert.equal(panels.find(c=>!c.hidden).dataset.countryPanel,'fixture-uk');
 click(subButtons.find(b=>b.dataset.atlasSubregion==='eastern-europe'));
 assert.equal(choices.filter(c=>!c.hidden).length,0);
 assert.equal(panels.filter(c=>!c.hidden).length,0);
 assert.equal(offers.filter(c=>!c.hidden).length,0);
 assert.equal(singles['[data-atlas-empty]'].hidden,false);
 assert.equal(singles['.home-affiliate-note'].hidden,true);
 assert.equal(country.value,'');
 assert.equal(cards.filter(c=>!c.hidden).length,0);
 assert.equal(singles['[data-country-unavailable]'].hidden,false);
 click(singles['[data-atlas-return]']);assert.equal(choices.filter(c=>!c.hidden).length,10);
 click(regions.find(r=>r.dataset.atlasRegion==='oceania'));
 const nz=choices.find(c=>c.dataset.atlasChoice==='new-zealand');
 nz.events.keydown({key:' ',preventDefault(){}});
 assert.equal(panels.find(c=>!c.hidden).dataset.countryPanel,'new-zealand');
 assert.equal(country.value,'new-zealand');
 assert.ok(cards.filter(c=>!c.hidden).every(c=>c.dataset.country==='new-zealand'));
 assert.equal(offers.filter(c=>!c.hidden).length,0);
 click(explore.find(c=>c.dataset.exploreCountry==='new-zealand'));
 assert.equal(country.value,'new-zealand');
 assert.equal(cards.filter(c=>!c.hidden).length,6);
 click(singles['[data-home-more]']);assert.equal(cards.filter(c=>!c.hidden).length,8);
 click(regions.find(r=>r.dataset.atlasRegion==='asia'));
 click(choices[0]);assert.equal(offers.filter(c=>!c.hidden).length,3);
 assert.equal(singles['.home-affiliate-note'].hidden,false);
 // Reproduce the reported dropdown -> globe/planning mismatch in both directions.
 const choose=id=>{country.value=id;form.events.change({target:country});};
 choose('new-zealand');
 assert.equal(panels.find(c=>!c.hidden).dataset.countryPanel,'new-zealand');
 assert.equal(regions.find(r=>r.attrs['aria-pressed']==='true').dataset.atlasRegion,'oceania');
 assert.equal(choices.find(c=>c.attrs['aria-pressed']==='true').hidden,false);
 assert.equal(offers.filter(c=>!c.hidden).length,0);
 assert.ok(cards.filter(c=>!c.hidden).every(c=>c.dataset.country==='new-zealand'));
 theme.value='unavailable-theme';form.events.change({target:theme});
 assert.equal(country.value,'new-zealand');
 assert.equal(cards.filter(c=>!c.hidden).length,0);
 assert.equal(offers.filter(c=>!c.hidden).length,0);
 theme.value='all';form.events.change({target:theme});
 click(singles['[data-home-more]']);
 click(singles['[data-atlas-more]']);
 assert.equal(cards.filter(c=>!c.hidden).length,8); // List expansion doesn't reset guide pagination.
 choose('thailand');
 assert.equal(panels.find(c=>!c.hidden).dataset.countryPanel,'thailand');
 assert.equal(offers.filter(c=>!c.hidden).length,3);
 assert.equal(cards.filter(c=>!c.hidden).length,3);
 form.reset();
 assert.equal(country.value,'all');
 assert.equal(panels.filter(c=>!c.hidden).length,0);
 assert.equal(choices.filter(c=>c.attrs['aria-pressed']==='true').length,0);
 assert.equal(regions.find(r=>r.attrs['aria-pressed']==='true').dataset.atlasRegion,'all');
 assert.equal(cards.filter(c=>!c.hidden).length,6);
 assert.equal(offers.filter(c=>!c.hidden).length,3);
 assert.equal(singles['[data-country-unavailable]'].hidden,true);
 assert.match(singles['[data-atlas-empty-copy]'].textContent,/所有目的地/);
 choose('fixture-tw');
 assert.equal(panels.find(c=>!c.hidden).dataset.countryPanel,'fixture-tw');
 assert.equal(choices.find(c=>c.dataset.atlasChoice==='fixture-tw').hidden,false);
 assert.equal(offers.filter(c=>!c.hidden).length,0);
 assert.equal(cards.filter(c=>!c.hidden).length,1);
});
