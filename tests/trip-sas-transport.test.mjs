import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderApprovedCountry} from '../scripts/trip-country-approved-adapter.mjs';
import {validateApprovedTravelPackage} from '../trip/approved-travel-contract.mjs';
const data=JSON.parse(readFileSync(new URL('../trip/data/europe-approved-travel-v1.json',import.meta.url)));
test('Norway replaces filler legs with two sourced SAS routes without changing calendar',()=>{
 const html=renderApprovedCountry(data,'norway'),country=data.countries.find(c=>c.id==='norway');
 assert.match(html,/怎麼飛到斯瓦巴/);assert.match(html,/我們搭 SAS 前往斯瓦巴/);
 for(const number of ['SK4492','SK4496','SK4414'])assert.ok(html.includes(number));
 assert.match(html,/約1小時50分鐘/);assert.match(html,/約1小時40分鐘/);assert.match(html,/約4小時10分鐘/);
 assert.equal((html.match(/data-transport-route=/g)||[]).length,2);
 assert.doesNotMatch(html,/國際航班銜接|依實際班次安排|必須換機|只有SAS|同機保證|北上的交通要按航段安排|以可確認的航段串接/);
 assert.equal(country.geographicMap.connections.length,0);
 assert.equal(country.referencePlans[0].calendarDays,16);
 assert.equal(country.referencePlans[0].days[11].kind,'transfer');
 assert.equal(country.allocation.routes[0].terminalTransfer.from,'tromso');
 assert.doesNotMatch(renderApprovedCountry(data,'netherlands'),/data-transport-route=/);
});
test('transport rejects missing provenance, unsafe links and duplicate route IDs',()=>{
 for(const mutate of [t=>{t.sourceIds=['unknown'];},t=>{t.links[0].url='javascript:alert(1)';},t=>{t.cards[1].id=t.cards[0].id;}]){
  const d=structuredClone(data);mutate(d.countries[0].transport);assert.throws(()=>validateApprovedTravelPackage(d));
 }
});
