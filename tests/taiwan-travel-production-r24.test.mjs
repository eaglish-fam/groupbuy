import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {renderTravelHomeR24} from '../scripts/render-travel-home-r24.mjs';
import {initialState} from '../trip/atlas-model.mjs';
import {excludedTaiwanPlaceIds,reducePlaceExperience,selectExperiencePlaces,plannedPlaces,readPlan,writePlan,planFocusIntent} from '../trip/taiwan-place-experience.mjs';
import {selectRegionalFilms,renderRegionalFilms,renderConsumerDetail} from '../trip/taiwan-consumer-content-r24.mjs';
import {canonicalTripPhoto} from '../trip/photo-source-identity.mjs';
import {photoContexts} from '../scripts/trip-photo-contexts-r22.mjs';
import {parseArticleMarkdown,renderTravelArticle} from '../scripts/travel-article-renderer.mjs';
import {presentCebuR24} from '../scripts/present-cebu-r24.mjs';
import {preservedArticle} from '../scripts/trip-photo-frames-r22.mjs';
const bytes=p=>fs.readFileSync(new URL('../'+p,import.meta.url));
const read=p=>bytes(p).toString();
const json=p=>JSON.parse(read(p));
const hash=b=>createHash('sha256').update(b).digest('hex');
const config=json('trip/data/taiwan-atlas-r24.json'),{data,catalog}=config;
const release=json('trip/data/taiwan-atlas-release-r24.json');
const registrationPath=new URL('../trip/data/approved-travel-registration-v1.json',import.meta.url);
const approved=fs.existsSync(registrationPath)?json(JSON.parse(fs.readFileSync(registrationPath)).dataPath):null;
const reduce=(s,a)=>reducePlaceExperience(s,a,data.geography,catalog,data);

test('production build renders portable53 exactly with no private or preview data',()=>{
 const html=renderTravelHomeR24(),actual=JSON.parse(html.match(/<script id="atlas-config" type="application\/json">([\s\S]*?)<\/script>/)[1]);
 assert.deepEqual({...actual,catalog:config.catalog},config);assert.equal(actual.privateAtlas,null);
 assert.deepEqual(actual.catalog.hero,catalog.hero);assert.deepEqual(actual.catalog.themes,catalog.themes);
 for(const type of ['countries','guides']){
  const originalIds=new Set(catalog[type].map(v=>v.id));assert.deepEqual(actual.catalog[type].filter(v=>originalIds.has(v.id)),catalog[type]);
  const additions=actual.catalog[type].filter(v=>!originalIds.has(v.id)),owners=type==='countries'?approved?.countries||[]:approved?.cities||[];
  assert.deepEqual(additions.map(v=>v.id).sort(),owners.map(v=>v.id).sort());
  for(const record of additions){const owner=owners.find(v=>v.id===record.id),asset=approved.assets.find(a=>a.assetId===(type==='countries'?owner.discovery.assetId:owner.hero[0]));assert.equal(record.href,owner.path);assert.deepEqual(record.approvedPhoto,asset);}
 }
 assert.doesNotMatch(html,/\/Users\/|tailb3|\/candidates\/|noindex|artifactPath|rawSha256|rawPath|candidateRevision/);
 assert.equal(data.places.length,53);assert.deepEqual(data.places.map(p=>p.id),release.places);
 assert.deepEqual(Object.fromEntries(['attraction','restaurant','hotel'].map(c=>[c,data.places.filter(p=>p.category===c).length])),{attraction:41,restaurant:7,hotel:5});
 for(const id of excludedTaiwanPlaceIds)assert.ok(!data.places.some(p=>p.id===id));
 assert.match(html,/name="robots" content="index,follow,max-image-preview:large"/);
 assert.match(html,/rel="canonical" href="https:\/\/www.eaglish.store\/trip\/"/);
 assert.equal((html.match(/\sid="guides"/g)||[]).length,1);
 assert.match(html,/id="category-tabs"/);assert.match(html,/id="place-detail"/);
 assert.match(html,/id="trip-list-feedback" role="status" aria-live="polite"/);
 assert.match(html,/href="#planning">排行程/);
 assert.match(html,/data-site-style="\/trip\/home\.css"/);
});
test('all48 content-addressed photo bytes remain480 square with5 genuine text-only gaps',async()=>{
 assert.equal(Object.keys(release.photos).length,48);assert.equal(data.places.filter(p=>p.photo).length,48);
 assert.deepEqual(data.places.filter(p=>!p.photo).map(p=>p.id),release.textOnly);assert.equal(release.textOnly.length,5);
 for(const p of data.places.filter(p=>p.photo)){
  const src=p.photo.src;assert.equal(canonicalTripPhoto(src,'https://www.eaglish.store/trip/'),src);
  assert.equal(hash(bytes(src.slice(1))),release.photos[src.slice(1)]);
  const m=await sharp(bytes(src.slice(1))).metadata();assert.equal(m.width,480);assert.equal(m.height,480);assert.equal(m.format,'webp');
  assert.deepEqual(p.photo.position,[50,50]);assert.ok(p.photo.alt);
 }
});
test('official Maps and meaningful compact information remain attached to everyplace',()=>{
 for(const p of data.places){
  const u=new URL(p.maps.search);assert.equal(u.origin,'https://www.google.com');assert.equal(u.searchParams.get('api'),'1');assert.ok(u.searchParams.get('query').includes(p.name));
  assert.doesNotMatch(p.maps.search,/key=|place_id=/);assert.ok(p.whatToExpect);assert.ok(renderConsumerDetail(p).includes('Google Maps'));
 }
});
test('saved list survives geography,category,search,world andstorage reload thenreorder/remove/undo',()=>{
 const [one,two]=data.places;let s=reduce(reduce(initialState(),{type:'plan',id:one.id}),{type:'plan',id:two.id});
 for(const a of [{type:'region',id:'tw-offshore'},{type:'county',id:'tw-lienchiang-county'},{type:'category',id:'hotel'},{type:'query',value:'nothing'},{type:'top',id:'world'},{type:'country',id:'new-zealand'},{type:'back'},{type:'country',id:'tw'}]){s=reduce(s,a);assert.deepEqual(s.selectedIds,[one.id,two.id]);}
 s=reduce(s,{type:'plan-up',id:two.id});assert.deepEqual(plannedPlaces(s.selectedIds,data).map(p=>p.id),[two.id,one.id]);
 const memory=new Map(),storage={setItem:(k,v)=>memory.set(k,v),getItem:k=>memory.get(k)};assert.ok(writePlan(storage,s.selectedIds,data));assert.deepEqual(readPlan(storage,data).ids,s.selectedIds);
 s=reduce(s,{type:'plan-remove',id:two.id});assert.deepEqual(s.selectedIds,[one.id]);s=reduce(s,{type:'plan',id:two.id});assert.deepEqual(s.selectedIds,[one.id,two.id]);
 assert.equal(writePlan(null,s.selectedIds,data),false);assert.equal(readPlan(null,data).available,false);
});
test('classificationtabsfilterprimarycategory andfilm chapters followregion',()=>{
 assert.equal(selectExperiencePlaces({...initialState(),category:'restaurant'},data).length,7);
 assert.equal(selectExperiencePlaces({...initialState(),category:'hotel'},data).length,5);
 assert.equal(data.regionalFilms.length,2);assert.equal(data.regionalFilms.flatMap(f=>f.chapters).length,13);
 assert.equal(selectRegionalFilms(initialState(),data).length,2);
 assert.equal(selectRegionalFilms({...initialState(),regionId:'tw-offshore',countyId:'tw-lienchiang-county'},data).length,1);
 assert.equal(selectRegionalFilms({...initialState(),regionId:'tw-offshore',countyId:'tw-penghu-county'},data).length,0);
 assert.equal(selectRegionalFilms({...initialState(),top:'world'},data).length,0);
 assert.doesNotMatch(renderRegionalFilms(data.regionalFilms),/iframe|autoplay/);
 const daqiu=data.places.find(p=>p.id==='place-tw-daqiu');assert.ok(daqiu.visitLinks.some(l=>l.url==='https://www.youtube.com/watch?v=pUoNpHyWl-A&t=2210s'));
});
test('productionphotoidentityrejectsforeignorigin,unknownnamespace andqueries',()=>{
 const src=data.places.find(p=>p.photo).photo.src,base='https://www.eaglish.store/trip/';
 assert.equal(canonicalTripPhoto('https://other.example'+src,base),null);assert.equal(canonicalTripPhoto('/preview'+src,base),null);assert.equal(canonicalTripPhoto(src+'?x=1',base),null);
});
test('a11yselectedcontrast,44px touch and list-contextfocusremainexplicit',()=>{
 const css=read('trip/home.css');assert.match(css,/breadcrumbs button\{min-inline-size:44px/);
 assert.match(css,/color:\s*#15366a\s*;background:\s*#edf2f6/);
 assert.deepEqual(planFocusIntent('plan-remove','b',['a','b','c'],['a','c']),{id:'c',actions:['plan-remove','place-detail','plan-up','plan-down']});
 assert.deepEqual(planFocusIntent('plan-remove','a',['a'],[]),{heading:true});
 assert.match(read('trip/atlas-ui.mjs'),/showModal\(\)/);
});
test('publiccountygeometryandisolatedtravel fontmatchacceptedbytes',()=>{
 assert.equal(hash(bytes('trip/taiwan-counties.json')),release.countyGeometrySha256);
 const geo=json('trip/taiwan-counties.json');assert.equal(geo.features.length,22);assert.equal(geo.features.reduce((n,f)=>n+f.properties.ringCount,0),697);
 assert.equal(hash(bytes('assets/fonts/noto-serif-tc-travel-r24.woff2')),release.fontSha256);
 assert.equal(bytes('assets/fonts/noto-serif-tc-travel-r24.woff2').toString('ascii',0,4),'wOF2');
 assert.doesNotMatch(read('trip/heading-theme-r24.css'),/@font-face\s*\{/);
 assert.match(read('site-font-loader.js'),/Eaglish Travel Heading Serif/);
});
test('Cebu narratives,captions,sourceimages and links remainexact afterreviewed frames',()=>{
 const c=json('trip/data/cebu-bohol-guide.json'),media=Object.fromEntries(json('trip/assets/cebu-bohol-media.json').map(m=>[m.id,m]));
 const raw=renderTravelArticle(parseArticleMarkdown(read('trip/content/philippines/cebu-bohol-with-kids.md'),c.sectionMap),c,media);
 const presented=presentCebuR24(raw,read('flights/assets/faraway-wordmark.svg'));
 const inventory=h=>({paragraphs:[...h.matchAll(/<p\b[^>]*>[\s\S]*?<\/p>/g)].map(m=>m[0]),captions:[...h.matchAll(/<figcaption\b[^>]*>[\s\S]*?<\/figcaption>/g)].map(m=>m[0]),images:[...h.matchAll(/<img\b[^>]*>/g)].map(m=>m[0]),links:[...h.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/g)].filter(m=>!m[0].includes('class="trip-plan-entry"')).map(m=>m[0].replace(/<svg\b[\s\S]*?<\/svg>/g,''))});
 const before=preservedArticle(inventory(raw)),after=preservedArticle(inventory(presented));
 // Wordmarks become inlineSVG, leaving all actual story photos and links exact.
 const story=i=>({...i,images:i.images.filter(p=>p.src?.startsWith('/trip/assets/')),links:i.links.filter(l=>!l.opening.includes('class="brand"'))});
 assert.deepEqual(story(after),story(before));
 for(const c of photoContexts.filter(c=>c.page==='cebu'))assert.ok(presented.includes(`data-photo-context="cebu:${c.sequence}"`));
 assert.equal((presented.match(/data-photo-frame=/g)||[]).length,36);assert.equal((presented.match(/data-photo-display-clone=/g)||[]).length,1);
});
