import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {travelHomeCatalog} from '../trip/home-catalog.mjs';
import {renderHomepageTravelEntry} from '../scripts/homepage-travel-entry.mjs';

test('homepage travel entry shares real country routes and responsive photos without loading the globe',()=>{
 const html=renderHomepageTravelEntry();
 for(const country of travelHomeCatalog.countries.slice(0,2)){
  assert.ok(html.includes(`href="${country.href}"`));
  assert.ok(existsSync(new URL('..'+country.href+'index.html',import.meta.url)));
  assert.ok(html.includes(country.image.alt));
  assert.ok(html.includes(`${country.guideIds.length} 份城市・區域指南`));
 }
 assert.equal((html.match(/loading="lazy"/g)||[]).length,2);
 assert.equal((html.match(/srcset=/g)||[]).length,2);
 assert.doesNotMatch(html,/<script|fetchpriority="high"|<canvas|globe\.js/);
 const page=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 assert.ok(page.indexOf('id="catalog"')<page.indexOf('id="travel-entry"'));
 assert.ok(page.indexOf('id="travel-entry"')<page.indexOf('id="calendar"'));
 const nav=page.match(/<nav class="content-nav"[\s\S]*?<\/nav>/)[0];
 assert.deepEqual([...nav.matchAll(/href="([^"]+)"/g)].slice(0,3).map(m=>m[1]),['#catalog','#calendar','#coupon']);
 assert.match(page,/<nav class="site-switcher"[\s\S]*?aria-label="鷹家選物誌">選物誌<\/a>[\s\S]*?aria-label="鷹家遠行所">遠行所<\/a>/);
 assert.match(page,/<a class="hero-travel-link" href="\/trip\/">/);
 assert.match(page,/<link rel="canonical" href="https:\/\/www.eaglish.store\/">/);
});

test('a future country reuses the entry component and keeps the homepage a bounded preview',()=>{
 const catalog=structuredClone(travelHomeCatalog);
 const country={...structuredClone(catalog.countries[0]),id:'fixture',name:'測試 & 國家',englishName:'Test Country',href:'/trip/fixture/',guideIds:['fixture-guide']};
 catalog.countries.unshift(country);
 catalog.guides.push({...structuredClone(catalog.guides[0]),id:'fixture-guide',countryId:country.id,href:'/trip/fixture/guide/'});
 const html=renderHomepageTravelEntry(catalog);
 assert.ok(html.includes('測試 &amp; 國家'));
 assert.ok(html.includes('href="/trip/fixture/"'));
 assert.equal((html.match(/class="travel-entry-place"/g)||[]).length,2);
 assert.ok(html.includes('href="/trip/"'));
 assert.doesNotMatch(readFileSync(new URL('../index.html',import.meta.url),'utf8'),/\/trip\/fixture\//);
});
