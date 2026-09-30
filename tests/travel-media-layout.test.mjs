import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mediaRatio,planMediaRows,galleryImageSizes,topicImageSizes} from '../scripts/travel-media-layout.mjs';
import {renderEditorialGallery} from '../scripts/travel-article-renderer.mjs';
const media=(width,height)=>({file:'/trip/assets/test.webp',alt:'Original scene',caption:'Reviewed caption',width,height,variants:[{file:'/trip/assets/test.webp',width,height}]});
test('gallery ratio uses exactly the same responsive fallback as the image renderer',()=>{
 assert.equal(mediaRatio(media(960,1200)),.8);
 assert.equal(mediaRatio({...media(1920,1080),variants:[{width:1440,height:810},{width:640,height:360}]}),1440/810);
 assert.equal(mediaRatio({...media(1920,1080),variants:[{width:1440,height:810},{width:960,height:540}]}),960/540);
 for(const bad of [{width:0,height:10},{width:100,height:NaN},{width:-1,height:2}])assert.throws(()=>mediaRatio(bad),/dimensions/);
});
test('mixed portraits use weighted desktop rows and full-width phone layers, without source cropping',()=>{
 const photos=[media(960,640),media(960,1200)],row=planMediaRows(photos)[0];
 assert.equal(row.mixed,true);assert.deepEqual(row.indices,[0,1]);assert.deepEqual(row.portraits,[false,true]);
 assert.match(galleryImageSizes(row,0),/calc\(100vw - 40px\)/);
 assert.match(galleryImageSizes(row,1),/min\(280px, calc\(100vw - 40px\)\)/);
 const h=renderEditorialGallery(photos.map(m=>({media:m,caption:m.caption})));
 assert.match(h,/cb-gallery-row-mixed/);assert.match(h,/cb-photo-portrait/);
 assert.equal((h.match(/<img /g)||[]).length,2);assert.doesNotMatch(h,/object-fit:cover|clip-path|overflow:hidden/);
});
test('source order and large first leads survive; unmatched support uses a whole row',()=>{
 for(let count=0;count<=8;count++){
  const rows=planMediaRows(Array.from({length:count},()=>media(960,540)));
  assert.deepEqual(rows.flatMap(r=>r.indices),Array.from({length:count},(_,i)=>i));
  assert.ok(rows.every(r=>r.indices.length<=2));
  if(count>2)assert.deepEqual(rows[0].indices,[0]);
 }
 assert.deepEqual(planMediaRows(Array.from({length:4},()=>media(960,540))).map(r=>r.indices),[[0],[1,2],[3]]);
 assert.equal(planMediaRows([media(960,1280)])[0].columns,'1fr','single portrait must use the full track before its figure is centered');
 assert.equal(planMediaRows([media(960,540),media(960,540),media(960,1280)])[0].columns,'1fr');
 assert.equal(planMediaRows([media(200,1000),media(100,1000)])[0].columns,'66.666667fr 33.333333fr','narrow portrait pairs use all available track space');
});
test('landscape pairs reserve equal natural image heights even when native ratios differ',()=>{
 const row=planMediaRows([media(960,540),media(960,432)])[0];
 assert.equal(row.mixed,false);
 const available=350-10,total=row.ratios.reduce((a,b)=>a+b,0);
 const heights=row.ratios.map(r=>available*(r/total)/r);
 assert.ok(Math.abs(heights[0]-heights[1])<.01);
 assert.match(galleryImageSizes(row,0),/44\.4444vw/);
});
test('topic circles keep equal columns, real smooth soft-focus and crisp labels without changing body photos',()=>{
 assert.equal(topicImageSizes(),'(max-width:700px) clamp(76px, 25vw, 98px), 150px');
 for(const viewport of [320,390,700]){
  const circle=Math.min(98,Math.max(76,viewport*.25)),column=(viewport-40-20)/3;
  assert.ok(circle<=column,`circle fits without horizontal overflow at ${viewport}px`);
 }
 const css=readFileSync(new URL('../trip/cebu-bohol.css',import.meta.url),'utf8');
 assert.match(css,/\.cb-guide \.cb-topic-entries\{[^}]*grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
 assert.match(css,/--cb-topic-size:150px/);
 assert.match(css,/--cb-topic-size:clamp\(76px,25vw,98px\)/);
 assert.match(css,/\.cb-topic-photo\{[^}]*border-radius:50%;overflow:hidden/);
 assert.match(css,/\.cb-guide \.cb-topic-entries img\{[^}]*aspect-ratio:1\/1;object-fit:cover;object-position:var\(--cb-topic-position/);
 assert.match(css,/mask-image:radial-gradient\(circle closest-side,#000 90%,transparent 100%\)/);
 assert.match(css,/--cb-topic-blur:1\.5px/);
 assert.match(css,/--cb-topic-blur:1px/);
 assert.match(css,/\.cb-guide \.cb-topic-entries img\{[^}]*image-rendering:auto;filter:blur\(var\(--cb-topic-blur\)\);transform:scale\(1\.08\);transform-origin:center/);
 assert.doesNotMatch(css,/image-rendering:(?:pixelated|crisp-edges)|cb-topic-columns/);
 const filteredRules=[...css.matchAll(/([^{}]+)\{([^{}]*filter:[^{}]*)\}/g)];
 assert.equal(filteredRules.length,1,'only the navigation thumbnail image may be blurred');
 assert.equal(filteredRules[0][1].trim(),'.cb-guide .cb-topic-entries img');
 assert.match(css,/\.cb-topic-label>span\{display:block;white-space:nowrap\}/);
 assert.match(css,/\.cb-topic-label>span:first-child\{font-size:13px;font-weight:500;color:var\(--muted\)/);
 assert.match(css,/\.cb-topic-label\{font-size:14px\}/);
 assert.match(css,/\.cb-guide \.cb-topic-entries>a:focus-visible/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/\.cb-gallery-row-mixed\{grid-template-columns:1fr/);
 assert.match(css,/\.cb-guide \.cb-gallery img\{[^}]*object-fit:contain/);
 const launcher=readFileSync(new URL('../trip/planner-entry.js',import.meta.url),'utf8');
 assert.match(launcher,/body\.cb-guide :is\(\.cb-topic-entries,\.cb-toc\)/);
 assert.match(launcher,/inlineGuideNav\.some/);
 assert.match(launcher,/window\.innerWidth < 1200/);
});

test('topic labels overlay inside the circle with smooth white halo, not a blurred caption or rectangular card',()=>{
 const css=readFileSync(new URL('../trip/cebu-bohol.css',import.meta.url),'utf8');
 assert.match(css,/\.cb-topic-entries>a\{position:relative;display:block;justify-self:center;width:var\(--cb-topic-size\);height:var\(--cb-topic-size\);border-radius:50%/);
 const label=css.match(/\.cb-topic-label\{([^}]+)\}/)[1];
 assert.match(label,/position:absolute;inset:0;z-index:1/);
 assert.match(label,/justify-content:center/);
 assert.match(label,/border-radius:50%/);
 assert.match(label,/pointer-events:none/);
 assert.match(label,/text-shadow:[^;]*#fff/);
 assert.match(label,/background:radial-gradient\(ellipse at center/);
 assert.doesNotMatch(label,/filter:|backdrop-filter:|background:(?:#fff|white)[;}]/);
 assert.match(css,/\.cb-topic-chevron\{position:absolute;[^}]*bottom:12%;left:50%/);
 const config=JSON.parse(readFileSync(new URL('../trip/data/cebu-bohol-guide.json',import.meta.url),'utf8'));
 assert.deepEqual(config.topics.map(t=>t.labelLines),[['景點','怎麼玩'],['餐廳','吃什麼'],['飯店','住哪裡']]);
 assert.deepEqual(config.topics.map(t=>t.target),['choose','dining','stay']);
 assert.ok(config.topics.every(t=>!/[?？]/.test(t.label+t.labelLines.join(''))));
 // At 320px the widest three-character prompt (14px font) is 42px;
 // the 80px circle's central chord leaves room for its padding and halo.
 assert.ok(3*14+2*4<80);
});
