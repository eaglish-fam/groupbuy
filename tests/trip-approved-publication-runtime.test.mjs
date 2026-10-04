import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderApprovedCity} from '../scripts/trip-city-approved-adapter.mjs';
import {renderApprovedCountry} from '../scripts/trip-country-approved-adapter.mjs';
const data=JSON.parse(readFileSync(new URL('../trip/data/europe-approved-travel-v1.json',import.meta.url)));
test('published guides and countries reuse the existing site runtime; noindex candidates remain unchanged',()=>{
 for(const [pages,render] of [[data.cities,renderApprovedCity],[data.countries,renderApprovedCountry]])for(const page of pages){
  const draft=render(data,page.id),published=render(data,page.id,{publication:true});
  assert.doesNotMatch(draft,/<script[^>]+src="\/site-runtime\.js/);
  assert.doesNotMatch(draft,/data-approved-publication-font/);
  assert.match(published,/<style data-approved-publication-font>@font-face/);
  assert.match(published,/<script defer src="\/site-runtime\.js\?v=20260914-analytics-v1"><\/script>/);
  assert.equal(published.replace('content="index,follow,max-image-preview:large"','content="noindex,nofollow"').replace('<script defer src="/site-runtime.js?v=20260914-analytics-v1"></script>','').replace(/<style data-approved-publication-font>[\s\S]*?<\/style>/,''),draft);
 }
});
