import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderApprovedCountry} from '../scripts/trip-country-approved-adapter.mjs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const data=JSON.parse(read('trip/data/europe-approved-travel-v1.json'));
test('Norway geography precedes photos, with two equal maps and a non-wrapping tab row',()=>{
 const html=renderApprovedCountry(data,'norway');
 assert.ok(html.indexOf('country-map-slot')<html.indexOf('class="th-explorer"'));
 assert.match(html,/data-map-count="2"/);assert.equal((html.match(/viewBox="0 0 300 240"/g)||[]).length,2);
 assert.doesNotMatch(html,/approved-map-connections/);
 const css=read('trip/country-explorer.css');
 assert.match(css,/\.th-tabs\{[^}]*flex-flow:row nowrap[^}]*gap:0/);
 assert.match(css,/\.th-tabs a\{[^}]*flex:1 1 0/);assert.doesNotMatch(css,/flex-basis:50%/);
 assert.match(css,/\.th-panel-copy h2\{[^}]*text-wrap:balance/);
 const maps=read('trip/country-approved.css');assert.match(maps,/data-map-count="2"[^}]*repeat\(2,minmax\(0,1fr\)\)/);
 assert.doesNotMatch(maps,/width:65%|justify-self:end/);
});
test('Netherlands Giethoorn pin and text retain direct guide anchor',()=>{
 const html=renderApprovedCountry(data,'netherlands');
 assert.ok((html.match(/href="\/trip\/guides\/amsterdam-with-kids\/#am-giethoorn"/g)||[]).length>=2);
});
