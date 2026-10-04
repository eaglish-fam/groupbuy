import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {mapFirstTravelHome,renderTravelHomeR24} from '../scripts/render-travel-home-r24.mjs';
import {prioritizeFirstTravelImage} from '../scripts/trip-image-priority.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const template=read('trip/content/home-r24.html.template');
const registrationPath=new URL('../trip/data/approved-travel-registration-v1.json',import.meta.url),registration=existsSync(registrationPath)?JSON.parse(readFileSync(registrationPath)):null;
const approvedGuides=registration?JSON.parse(read(registration.dataPath)).cities:[];

test('home has one brief H1 then the actual map before any promoted photo or article',()=>{
 const html=renderTravelHomeR24();
 const main=html.slice(html.indexOf('<main id="main">'));
 assert.match(main,/^<main id="main"><section class="home-introduction home-wrap"/);
 const intro=main.indexOf('id="home-title"'),map=main.indexOf('id="destinations"'),hero=main.indexOf('class="home-opening home-wrap"'),featured=main.indexOf('id="featured"'),planning=main.indexOf('id="planning"');
 assert.ok(intro<map&&map<hero&&hero<featured&&featured<planning);
 assert.doesNotMatch(main.slice(0,map),/<img\b|class="home-guide"|home-opening-photo/);
 assert.equal((main.match(/\sid="home-title"/g)||[]).length,1);
 assert.equal((main.match(/\sid="destinations"/g)||[]).length,1);
 assert.doesNotMatch(main,/從一片風景，開始遠行。|先選地區，再找到想去的國家。|aria-labelledby="atlas-heading"|class="atlas-intro"/);
 assert.match(main,/<section class="home-destinations home-wrap" id="destinations" aria-label="目的地地圖">/);
 const guideSection=main.slice(featured,planning);
 assert.equal((guideSection.match(/class="home-guide"/g)||[]).length,7+approvedGuides.length);
 for(const guide of approvedGuides)assert.equal((guideSection.match(new RegExp(`data-guide-id="${guide.id}"`,'g'))||[]).length,1);
 assert.equal((guideSection.match(/data-guide-id="singapore"/g)||[]).length,1);
 const withoutSingapore=guideSection.replace(/<article class="home-guide" data-guide-id="singapore">[\s\S]*?<\/article>/,'');
 assert.equal((withoutSingapore.match(/class="home-guide"/g)||[]).length,6+approvedGuides.length);
});
test('module reorder preserves approved content except the removed duplicate introduction and its ARIA reference',()=>{
 const actual=mapFirstTravelHome(template);
 const reviewedTemplate=template.replace('<div class="atlas-intro"><h2 id="atlas-heading">從一片風景，開始遠行。</h2><p>先選地區，再找到想去的國家。</p></div>','').replace('aria-labelledby="atlas-heading"','aria-label="目的地地圖"');
 const inventory=html=>[...html.matchAll(/<(?:h[1-4]|p|figcaption|img|a)\b[^>]*(?:>[\s\S]*?<\/(?:h[1-4]|p|figcaption|a)>|>)/g)].map(m=>m[0].replace(' data-primary-travel-photo','')).sort();
 assert.deepEqual(inventory(actual),inventory(reviewedTemplate));
 const frames=html=>[...html.matchAll(/<div class="r22-photo-frame"[^>]*>/g)].map(m=>m[0]).sort();
 assert.deepEqual(frames(actual),frames(template));
 const mapStart='<section class="home-destinations home-wrap"';
 const beforeMap=reviewedTemplate.slice(reviewedTemplate.indexOf(mapStart),reviewedTemplate.indexOf('<section class="home-planning home-wrap"'));
 const afterMap=actual.slice(actual.indexOf(mapStart),actual.indexOf('<section class="home-opening home-wrap"'));
 assert.ok(beforeMap.length>100000);assert.equal(afterMap,beforeMap);
 assert.equal(actual.split('{{ATLAS_CONFIG}}').length,2);
});
test('reorder fails closed for duplicate, missing or unexpectedly reordered source modules',()=>{
 assert.throws(()=>mapFirstTravelHome(template.replace('home-destinations home-wrap','missing-map')),/Expected one/);
 assert.throws(()=>mapFirstTravelHome(template+'<section class="home-destinations home-wrap"'),/Expected one/);
 assert.throws(()=>mapFirstTravelHome(template.replace('home-featured home-wrap','temporary home-wrap').replace('home-destinations home-wrap','home-featured home-wrap').replace('temporary home-wrap','home-destinations home-wrap')),/Unexpected/);
});
test('travel map labels explicitly use the isolated serif with both Taiwan glyphs',()=>{
 const css=read('trip/home.css'),rule=css.match(/\.travel-home \.atlas-component :is\(#top-levels button,[^}]+\}/)?.[0];
 assert.ok(rule);assert.match(rule,/#counties button\[data-action="country"\]/);assert.match(rule,/#breadcrumbs button/);assert.match(rule,/font-family:var\(--serif\)/);assert.match(rule,/font-synthesis:none/);
 assert.match(read('trip/heading-theme-r24.css'),/body\.travel-home,body\.cb-guide\{--serif:"Eaglish Travel Heading Serif"/);
 const glyphs=read('assets/fonts/travel-heading-glyphs-r24.txt');
 for(const char of '臺台灣泰國紐西蘭菲律賓')assert.ok(glyphs.includes(char));
});
test('map-first hidden panels and no-JS fallback cannot steal or duplicate the primary-photo preload',()=>{
 const image='<img src="/trip/assets/photo.webp" srcset="/trip/assets/photo-640.webp 640w, /trip/assets/photo-960.webp 960w" sizes="100vw" loading="lazy" fetchpriority="low">';
 const marked=image.replace('<img ','<img data-primary-travel-photo ');
 const input=`<head><link rel="icon" href="/icon.png"></head><section hidden>${image.replaceAll('photo','hidden')}</section><noscript>${image}</noscript><figure>${marked}</figure>`;
 const html=prioritizeFirstTravelImage(input);
 assert.ok(html.includes(`<noscript>${image}</noscript>`));
 assert.match(html,/<figure><img[^>]+loading="eager" fetchpriority="high">/);
 assert.equal((html.match(/rel="preload"/g)||[]).length,1);
 assert.equal((html.match(/<img[^>]+fetchpriority="high"/g)||[]).length,1);
 assert.doesNotMatch(html.match(/rel="preload"[^>]+/)[0],/hidden/);
 assert.throws(()=>prioritizeFirstTravelImage(input+marked),/multiple primary/);
 assert.equal(prioritizeFirstTravelImage(`<head><link rel="icon" href="/icon.png"></head><noscript>${image}</noscript>`),`<head><link rel="icon" href="/icon.png"></head><noscript>${image}</noscript>`);
});
