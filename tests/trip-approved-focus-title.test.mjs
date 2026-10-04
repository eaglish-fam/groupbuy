import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {initApprovedCountryExplorer} from '../trip/country-explorer.mjs';
import {renderApprovedCity} from '../scripts/trip-city-approved-adapter.mjs';
import {renderApprovedCountry} from '../scripts/trip-country-approved-adapter.mjs';
const source=JSON.parse(readFileSync(new URL('../trip/data/europe-approved-travel-v1.json',import.meta.url)));
function fixture(){
 const listeners=new Map(),winListeners=new Map(),status={textContent:''};
 const titles=['總覽','城市'].map(textContent=>({textContent,attrs:{},setAttribute(k,v){this.attrs[k]=v;},focus(o){this.focusOptions=o;},scrollIntoView(o){this.scrollOptions=o;}}));
 const panels=['all','city'].map((id,i)=>({dataset:{countryPanel:id},querySelector(){return titles[i];}}));
 const controls=['all','city'].map(id=>({dataset:{countryCity:id},attrs:{},setAttribute(k,v){this.attrs[k]=v;},removeAttribute(k){delete this.attrs[k];},hasAttribute(k){return k==='data-country-city';},closest(){return this;}}));
 const win={location:{hash:''},addEventListener(k,v){winListeners.set(k,v);},removeEventListener(k){winListeners.delete(k);}};
 const root={dataset:{},ownerDocument:{defaultView:win},contains:()=>true,querySelector:s=>s==='[data-country-city-status]'?status:null,querySelectorAll:s=>s==='[data-country-panel]'?panels:s==='[data-country-city]'?controls:[],addEventListener(k,v){listeners.set(k,v);},removeEventListener(k){listeners.delete(k);}};
 const cleanup=initApprovedCountryExplorer(root),click=(detail=0)=>listeners.get('click')({target:controls[1],button:0,detail,preventDefault(){}});
 return {root,listeners,winListeners,status,titles,panels,controls,cleanup,click};
}
test('pointer and zero-detail touch retain actual heading focus, selection and status without keyboard scrolling',()=>{
 for(const event of ['pointerdown','touchstart']){const f=fixture();f.listeners.get(event)({});f.click(0);assert.equal(f.root.dataset.countryFocusMode,'pointer');assert.deepEqual(f.titles[1].focusOptions,{preventScroll:true});assert.equal(f.titles[1].attrs.tabindex,'-1');assert.equal(f.titles[1].scrollOptions,undefined);assert.equal(f.panels[0].hidden,true);assert.equal(f.panels[1].hidden,false);assert.equal(f.controls[1].attrs['aria-current'],'true');assert.equal(f.status.textContent,'顯示城市');f.cleanup();assert.equal(f.listeners.size,0);assert.equal(f.winListeners.size,0);assert.equal(f.root.dataset.countryFocusMode,undefined);}
});
test('Tab/Enter after pointer restores keyboard focus and minimally scrolls the same selected panel',()=>{
 const f=fixture();f.listeners.get('pointerdown')({});f.listeners.get('keydown')({key:'Tab'});f.listeners.get('keydown')({key:'Enter'});f.click();assert.equal(f.root.dataset.countryFocusMode,'keyboard');assert.deepEqual(f.titles[1].scrollOptions,{block:'nearest',behavior:'auto'});assert.equal(f.status.textContent,'顯示城市');
});
test('four city and two country renderers share opt-in hierarchy; only specified city subtitle is absent',()=>{
 const css=readFileSync(new URL('../trip/approved-heading-hierarchy.css',import.meta.url),'utf8');
 assert.match(css,/country-focus-mode="pointer"/);assert.match(css,/country-focus-mode="keyboard"/);assert.doesNotMatch(css,/(?:^|\n)(?:\*|:root|body)\s*\{/);
 for(const city of source.cities){const html=renderApprovedCity(source,city.id);assert.ok(html.includes(css));assert.ok(html.includes('class="prose"'));if(city.id==='tromso'){assert.equal(city.subtitle,undefined);assert.doesNotMatch(html,/把戶外活動與兩座室內場館交錯安排。|class="city-subtitle"/);}else assert.ok(html.includes(city.subtitle));}
 const explorerHash=createHash('sha256').update(readFileSync(new URL('../trip/country-explorer.mjs',import.meta.url))).digest('hex').slice(0,12);
 for(const country of source.countries){const html=renderApprovedCountry(source,country.id);assert.ok(html.includes(css));assert.ok(html.includes(`/trip/country-explorer.mjs?v=${explorerHash}"`),'published country module must use actual-byte cache bust');}
});
