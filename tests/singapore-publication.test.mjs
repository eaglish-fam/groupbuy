import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,mkdirSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {validateSingaporePublicPackage,hash} from '../scripts/build-trip-singapore.mjs';
import {renderApprovedSingapore} from '../scripts/trip-singapore-approved-renderer.mjs';
import {cityGuideTemplateStyle,cityGuideHeroLayout,cityGuideBody} from '../scripts/trip-city-guide-template.mjs';
import {renderTravelHomeR24} from '../scripts/render-travel-home-r24.mjs';
import {approvedDay,selectedRoute,validDate} from '../trip/singapore-approved-model.mjs';
import {collectIndexablePages} from '../scripts/site-seo-inventory.mjs';
const root=resolve(import.meta.dirname,'..');
const model=JSON.parse(readFileSync(root+'/trip/data/singapore-public-article-v1.json'));
const manifest=JSON.parse(readFileSync(root+'/trip/data/singapore-publication-v1.json'));
const rendered=()=>renderApprovedSingapore(model.article,readFileSync(root+'/flights/assets/faraway-wordmark.svg','utf8'),{navigationView:model.navigationView,publication:true});
test('portable approved package has exact real media closure and no private dependencies',()=>{
 assert.deepEqual(validateSingaporePublicPackage(root),model);
 assert.equal(manifest.assets.length,37);assert.equal(manifest.assets.flatMap(a=>a.variants).length,111);
 assert(!/\/Users\/|rawPath|videoPath|dispatchId|packetSha256/.test(JSON.stringify(model)+JSON.stringify(manifest)+readFileSync(root+'/scripts/build-trip-singapore.mjs','utf8').replace(/\/Users\\\/\|dispatchId\|packetSha256\|rawPath\|videoPath/,'')));
});
test('reject changed article hash, missing approved coverage and unsafe media URL',()=>{
 for(const change of [({data})=>{data.article.title+=' changed';},({data,receipt})=>{data.article.sections.pop();receipt.articleSha256=hash(JSON.stringify(data));},({receipt})=>{receipt.assets[0].variants[0].url='/../secret.webp';}]){
  const dir=mkdtempSync(resolve(tmpdir(),'sg-public-')),data=structuredClone(model),receipt=structuredClone(manifest);
  change({data,receipt});mkdirSync(dir+'/trip/data',{recursive:true});writeFileSync(dir+'/trip/data/singapore-public-article-v1.json',JSON.stringify(data));writeFileSync(dir+'/trip/data/singapore-publication-v1.json',JSON.stringify(receipt));
  assert.throws(()=>validateSingaporePublicPackage(dir));
 }
});
test('production is indexable with consistent canonical, OG, Article, Breadcrumb and nine FAQ answers',()=>{
 const html=rendered(),url='https://www.eaglish.store/trip/singapore/';
 assert(!html.includes('noindex'));assert(html.includes('content="index,follow,max-image-preview:large"'));
 assert(html.includes('rel="canonical" href="'+url+'"'));assert(html.includes('property="og:url" content="'+url+'"'));
 const schema=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
 assert.equal(schema[0].mainEntityOfPage,url);assert.equal(schema[1].itemListElement[1].item,url);assert.equal(schema[2].mainEntity.length,9);
 const preview=renderApprovedSingapore(model.article,'',{navigationView:model.navigationView});assert(preview.includes('noindex,nofollow'));
 assert.equal(html.split('<body')[1],preview.split('<body')[1].replace('<img src="/flights/assets/faraway-wordmark.svg" width="220" height="65" alt="鷹家遠行所">',readFileSync(root+'/flights/assets/faraway-wordmark.svg','utf8')));
});
test('approved fullbleed source dimensions, three heroes, thirty attraction images and eight short cards remain',()=>{
 const html=rendered();assert.equal((html.match(/<figure[^>]*data-hero-slot=/g)||[]).length,3);assert.equal((html.match(/data-place-ref=/g)||[]).length,8);
 assert.equal(new Set([...model.article.sections,...model.article.supportingStops].flatMap(s=>s.images.map(i=>i.assetId))).size,30);
 const layout=cityGuideHeroLayout(model.article.heroImages);assert.equal(layout.mode,'portraits');assert.deepEqual(layout.ratios,['1440/1798','1440/1798','1440/1798']);
 assert.throws(()=>cityGuideHeroLayout([{width:0,height:1},{width:2,height:3},{width:2,height:3}]));
});
test('public body uses same single CSS source, robust facts, complete anchors and late planner',()=>{
 const html=rendered(),css=readFileSync(root+'/trip/singapore.css','utf8');assert(html.includes(cityGuideTemplateStyle({compatCss:css})));
 const ids=[...html.matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);
 for(const [,id] of html.matchAll(/href="#([^"]+)"/g))assert(ids.includes(id),id);
 assert(html.indexOf('id="faq"')<html.indexOf('id="plan"'));assert(html.indexOf('id="plan"')<html.indexOf('id="videos"'));assert(html.includes('data-plan-entry'));assert(html.includes('data-approved-routes'));
 assert.throws(()=>cityGuideBody({plan:''}));
});
test('all six approved routes and eighteen days retain exact stops and supported calendar warnings',()=>{
 const routes=model.article.planner.routes;assert.equal(routes.length,6);assert.equal(routes.reduce((n,r)=>n+r.days.length,0),18);
 for(const r of routes){assert.deepEqual(selectedRoute(routes,r.sightseeingDays,r.pace),r);r.days.forEach((d,i)=>assert.deepEqual(approvedDay(routes,r.sightseeingDays,r.pace,i).day,d));}
 assert.equal(validDate('2026-02-30'),false);assert.throws(()=>selectedRoute(routes,5,'compact'));
 const fixture=[{id:'2-leisure',sightseeingDays:2,pace:'leisure',days:[{stops:[{target:'flower-dome',label:'花穹'}]}]}];
 assert.equal(approvedDay(fixture,2,'leisure',0,'2026-10-06').stops[0].blocked,true);
});
test('travel homepage has a usable static approved Singapore guide and schema without new country hub',()=>{
 const html=renderTravelHomeR24();assert.equal((html.match(/data-guide-id="singapore"/g)||[]).length,1);assert(html.includes('href="/trip/singapore/"'));
 const schema=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);assert(schema.hasPart.some(p=>p.url==='https://www.eaglish.store/trip/singapore/'));
 assert(html.includes('data-photo-grid="guides"'));assert(html.includes('id="globe-stage"'));
});
test('built Singapore is part of public indexable inventory',()=>{
 assert(collectIndexablePages(root).some(p=>p.path==='/trip/singapore/'));
});
