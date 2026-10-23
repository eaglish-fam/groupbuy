import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {regions} from '../trip/new-zealand-data.mjs';
import {travelHomeCatalog} from '../trip/home-catalog.mjs';

const root=resolve(import.meta.dirname,'..');
const read=path=>readFileSync(resolve(root,path),'utf8');
const pages=[
 ['trip/index.html',travelHomeCatalog.guides.find(g=>g.id==='cebu-bohol').image.src.split('/').at(-1).replace(/\.webp$/,'')],
 ['trip/new-zealand/index.html','nz-christchurch-tram'],
 ['trip/new-zealand/christchurch/index.html','nz-christchurch-tram'],
 ['trip/new-zealand/akaroa/index.html','nz-farm'],
 ['trip/new-zealand/christchurch/3-days/index.html','nz-christchurch-tram'],
 ...regions.filter(region=>region.route!=='/trip/new-zealand/christchurch/3-days/').map(region=>[region.route.slice(1)+'index.html',region.hero]),
 ['trip/thailand/index.html','cm-thai-dress-family'],
 ['trip/guides/bangkok-with-kids/index.html','bkk-bangkok-family'],
 ['trip/guides/chiang-mai-with-kids/index.html','cm-thai-dress-family'],
 ['trip/guides/chiang-rai-with-kids/index.html','cr-lalitta-garden']
];

test('travel entry pages preload their first visual using the same responsive source as the image',()=>{
 for(const [path,id] of pages){
  const html=read(path);
  const head=html.split('</head>')[0];
  const preload=head.match(/<link rel="preload" as="image"[^>]+>/g)||[];
  assert.equal(preload.length,1,`${path}: exactly one image should be preloaded`);
  assert.doesNotMatch(head,/fonts\.googleapis\.com/,`${path}: system fonts should avoid render-blocking font requests`);
  assert.ok(head.indexOf(preload[0])<head.indexOf('<link rel="stylesheet"'),`${path}: preload must precede stylesheets`);
  assert.match(preload[0],new RegExp(`imagesrcset="[^"]*${id}-640\\.webp 640w`));
  assert.match(preload[0],/imagesizes="[^"]+"/);
  assert.match(preload[0],/fetchpriority="high"/);
  const preloadSource=preload[0].match(/href="([^"]+)"/)[1];
  assert.ok(existsSync(resolve(root,'.'+preloadSource)),`${path}: missing preload fallback`);
  // The map-first homepage contains earlier inert destination-panel copies.
  // Verify its explicit visible primary, not a hidden image with the same src.
  const image=path==='trip/index.html'
   ?html.match(/<img\b[^>]*\bdata-primary-travel-photo\b[^>]*>/)?.[0]
   :html.match(new RegExp(`<img [^>]*src="[^"]*${id}[^>]+>`))[0];
  if(path==='trip/index.html'){
   assert.equal((html.match(/<img\b[^>]*\bdata-primary-travel-photo\b[^>]*>/g)||[]).length,1);
   assert.match(image,new RegExp(`src="[^"]*${id}[^\"]*"`));
  }
  assert.match(image,/loading="eager" fetchpriority="high"/);
  assert.equal(preload[0].match(/imagesrcset="([^"]+)"/)[1],image.match(/srcset="([^"]+)"/)[1]);
  assert.equal(preload[0].match(/imagesizes="([^"]+)"/)[1],image.match(/sizes="([^"]+)"/)[1]);
  assert.equal((html.match(/<img [^>]*fetchpriority="high"/g)||[]).length,1,`${path}: one high-priority image`);
 }
});

test('Bangkok guide (approved template) loads only its main hero eagerly and defers the place cards',()=>{
 const html=read('trip/guides/bangkok-with-kids/index.html');
 const hero=html.match(/<div class="city-guide-hero"[\s\S]*?<\/div>/)[0];
 assert.equal((hero.match(/fetchpriority="high"/g)||[]).length,1);
 const cards=html.match(/<section id="places">[\s\S]*?<\/section>/)[0];
 assert.equal((cards.match(/<img\b/g)||[]).length,9);
 assert.doesNotMatch(cards,/fetchpriority="high"|loading="eager"/);
});
