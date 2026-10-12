import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {initialState,reduceAtlas,atlasNavigation,topLevels,continentLevels,continentCountries,eligibleCountryIds} from '../trip/atlas-model.mjs';
import {renderContinentControls} from '../trip/atlas-continent-controls.mjs';
import {atlasCamera} from '../trip/atlas-globe-camera.mjs';
import {renderTravelHomeR24,inlineTravelStyles} from '../scripts/render-travel-home-r24.mjs';
const root=new URL('../',import.meta.url),config=JSON.parse(readFileSync(new URL('trip/data/taiwan-atlas-r24.json',root))),geo=config.data.geography,catalog=config.catalog,reduce=(s,a)=>reduceAtlas(s,a,geo,catalog);
test('only two modes; each continent remains World, does not implicitly select a country and collapses back to overview',()=>{
 assert.deepEqual(topLevels,[['taiwan','台灣'],['world','世界']]);assert.deepEqual(continentLevels.map(x=>x[1]),['亞洲','大洋洲','歐洲','美洲','非洲']);let state=reduce(initialState(),{type:'top',id:'world'});assert.equal(state.countryId,null);for(const[id]of continentLevels){state=reduce(state,{type:'continent',id});assert.equal(state.top,'world');assert.equal(state.continentId,id);assert.equal(state.countryId,null);assert.equal(atlasNavigation(state,geo,catalog).showWorld,true);assert.equal(atlasNavigation(state,geo,catalog).breadcrumbs.length,0);assert.equal(atlasCamera(state,config.geometry.globe,catalog,config.regions).regionId,id);state=reduce(state,{type:'continent',id});assert.equal(state.continentId,null);assert.equal(atlasNavigation(state,geo,catalog).showWorld,false);}
});
test('compact native continent controls preserve all five headings, one disclosed list and registered destinations only',()=>{
 const state=reduce(initialState(),{type:'continent',id:'asia'}),html=renderContinentControls(state,catalog);assert.equal((html.match(/data-action="continent"/g)||[]).length,5);assert.equal((html.match(/aria-expanded="true"/g)||[]).length,1);assert.equal((html.match(/aria-controls="continent-countries-/g)||[]).length,5);assert.equal((html.match(/class="continent-country-list"/g)||[]).length,5);assert.equal((html.match(/class="continent-country-list"[^>]*hidden/g)||[]).length,4);assert.deepEqual(continentCountries('asia',catalog).map(c=>c.id),['tw','thailand','philippines']);assert(html.includes('data-id="tw"'));assert(renderContinentControls({...state,continentId:'africa'},catalog).includes('目前尚無非洲指南'));
});
test('country picks follow their real continent, preserve selected guide scope and return World without a stale disclosure',()=>{
 let state=reduce(initialState(),{type:'continent',id:'asia'});state=reduce(state,{type:'country',id:'new-zealand'});assert.equal(state.top,'world');assert.equal(state.continentId,'oceania');assert.deepEqual(eligibleCountryIds(state,catalog),['new-zealand']);assert.deepEqual(atlasCamera(state,config.geometry.globe,catalog,config.regions).center,catalog.countries.find(c=>c.id==='new-zealand').geography.point);state=reduce(state,{type:'top',id:'world'});assert.equal(state.continentId,null);assert.equal(state.countryId,null);assert.equal(eligibleCountryIds(state,catalog).length,catalog.countries.length);
});
test('Taiwan region/county/back remains hierarchical without a redundant world breadcrumb row',()=>{
 let state=initialState();assert.equal(atlasNavigation(state,geo,catalog).breadcrumbs.length,0);state=reduce(state,{type:'region',id:'tw-north'});assert.equal(state.top,'taiwan');assert.equal(state.continentId,null);assert.equal(atlasNavigation(state,geo,catalog).backLabel,'回台灣全覽');const county=geo.counties.find(c=>c.regionId==='tw-north');state=reduce(state,{type:'county',id:county.id});assert.equal(state.countyId,county.id);state=reduce(state,{type:'back'});assert.equal(state.countyId,null);assert.equal(state.regionId,'tw-north');state=reduce(state,{type:'back'});assert.equal(state.regionId,null);state=reduce(state,{type:'country',id:'tw'});assert.equal(state.top,'taiwan');
});
test('rendered portable home has two no-JS mode links, aligned title/recenter shell and no old world arrow/breadcrumb rows',()=>{
 const html=renderTravelHomeR24(),primary=html.match(/<nav id="top-levels"[^>]*>([\s\S]*?)<\/nav>/)[1];assert.equal((primary.match(/<a /g)||[]).length,2);assert(html.includes('class="map-heading-row"'));assert(html.includes('id="continent-nav"'));assert(html.includes('hidden>回到世界地圖</button>'));assert(!html.includes('<span>看世界地圖</span>'));assert(html.includes('data-site-style="/trip/atlas-navigation.css"'));assert(html.includes('globe-nav-g1-20261013'));for(const country of catalog.countries)assert(html.includes(country.href));
});
test('disclosure data labels escape markup and geometry source remains canonical',()=>{
 const hostile=structuredClone(catalog);hostile.countries[0].name='<img src=x onerror=bad>';const html=renderContinentControls({top:'world',continentId:'asia',countryId:null},hostile);assert(html.includes('&lt;img'));assert(!html.includes('<img src=x'));const geometry=JSON.parse(readFileSync(new URL('trip/taiwan-counties.json',root)));assert.equal(geometry.features.length,22);assert.equal(geometry.features.reduce((n,f)=>n+f.properties.ringCount,0),697);
});
test('shared style inlining does not inject home-only globe controls into an unrelated guide',()=>{
 const html='<html><head></head><body class="cb-guide"><h1>Existing guide</h1></body></html>';assert.equal(inlineTravelStyles(html),html);
});
test('narrow continent row keeps 14px text and 44px hit targets with reduced padding, not hidden or scrolling labels',()=>{
 const css=readFileSync(new URL('trip/atlas-navigation.css',root),'utf8');assert.match(css,/@media\(max-width:380px\).*continent-switches\{gap:4px\}.*continent-switches button\{padding-inline:4px\}/);assert.match(css,/min-height:44px;min-width:44px/);assert.match(css,/font-size:14px/);assert.match(css,/continent-switches[^}]*flex-wrap:wrap/);assert(!/overflow-x:|font-size:1[0-3]px/.test(css.split('@media(max-width:380px)')[1]));
});
