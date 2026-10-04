import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderApprovedCountry} from '../scripts/trip-country-approved-adapter.mjs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const data=JSON.parse(read('trip/data/europe-approved-travel-v1.json'));
test('Norway geography precedes photos, in one paper panel with a labeled circular inset and horizontal tabs',()=>{
 const html=renderApprovedCountry(data,'norway');
 assert.ok(html.indexOf('country-map-slot')<html.indexOf('class="th-explorer"'));
 assert.match(html,/travel-atlas--norway/);assert.equal((html.match(/data-travel-atlas-view="/g)||[]).length,3);
 assert.match(html,/斯瓦巴離島框・非等比例距離/);assert.match(html,/travel-atlas-inset-border/);
 assert.match(html,/data-geometry-country="578"/);
 assert.doesNotMatch(html,/approved-map-view|data-map-count/);
 const map=html.match(/<section class="approved-geographic-map[\s\S]*?<\/section>/)[0];
 assert.doesNotMatch(map,/data-country-city|href="#city-/);
 for(const id of ['oslo','svalbard','tromso'])assert.match(map,new RegExp('href="/trip/guides/'+id+'-with-kids/"'));
 assert.doesNotMatch(html,/approved-map-connections/);
 const css=read('trip/country-explorer.css');
 assert.match(css,/\.th-tabs\{[^}]*flex-flow:row nowrap[^}]*gap:0/);
 assert.match(css,/\.th-tabs a\{[^}]*flex:1 1 0/);assert.doesNotMatch(css,/flex-basis:50%/);
 assert.match(css,/\.th-panel-copy h2\{[^}]*text-wrap:balance/);
 const maps=read('trip/travel-atlas-country.css');assert.match(maps,/travel-atlas--country/);
 assert.doesNotMatch(maps,/width:65%|justify-self:end/);
});
test('Netherlands Giethoorn pin and text retain direct guide anchor',()=>{
 const html=renderApprovedCountry(data,'netherlands');
 assert.ok((html.match(/href="\/trip\/guides\/amsterdam-with-kids\/#am-giethoorn"/g)||[]).length>=2);
 assert.match(html,/data-geometry-country="528"/);assert.match(html,/荷蘭<small>Netherlands<\/small>/);
});
