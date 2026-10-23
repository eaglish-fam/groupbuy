import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
// The hub renders from the approved Thailand package.
const pkg=JSON.parse(readFileSync(new URL('../trip/data/thailand-approved-travel-v1.json',import.meta.url),'utf8'));
const country=pkg.countries[0],cities=pkg.cities.map(c=>({guide:c.path}));
test('Country hub has static crawlable links, one priority image and late planner',()=>{
 const html=readFileSync(new URL('../trip/thailand/index.html',import.meta.url),'utf8');
 assert.equal((html.match(/<h1[ >]/g)||[]).length,1);
 assert.ok(html.includes('CollectionPage'));
 for(const c of cities)assert.ok(html.includes(`href="${c.guide}"`));
 assert.equal((html.match(/<img[^>]+fetchpriority="high"/g)||[]).length,1);
 assert.ok(html.indexOf('id="plan"')>html.indexOf('id="faq"'));
 assert.ok(!html.includes('悠閒散步'));
});
test('Country heading and overview navigation are not tied to the city count',()=>{
 const html=readFileSync(new URL('../trip/thailand/index.html',import.meta.url),'utf8');
 assert.ok(html.includes(`<span aria-hidden="true">${country.flag}</span> <span lang="en">${country.englishName}</span>`));
 assert.match(html,/data-country-city="all" aria-current="true">[^<]+<\/a>/);
 assert.ok(!html.includes('三城一覽'));
 assert.ok(!html.includes('THREE CITIES, YOUR WAY'));
});
