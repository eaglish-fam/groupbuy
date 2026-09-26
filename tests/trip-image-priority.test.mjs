import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';

const root=resolve(import.meta.dirname,'..');
const read=path=>readFileSync(resolve(root,path),'utf8');
const pages=[
 ['trip/index.html','nz-farm'],
 ['trip/new-zealand/index.html','nz-christchurch-tram'],
 ['trip/new-zealand/christchurch/index.html','nz-christchurch-tram'],
 ['trip/new-zealand/akaroa/index.html','nz-farm'],
 ['trip/new-zealand/christchurch/3-days/index.html','nz-christchurch-tram'],
 ['trip/thailand/index.html','bkk-aquarium-reef'],
 ['trip/thailand/bangkok/index.html','bkk-aquarium-reef'],
 ['trip/guides/bangkok-with-kids/index.html','bkk-aquarium-reef']
];

test('travel entry pages preload their first visual using the same responsive source as the image',()=>{
 for(const [path,id] of pages){
  const html=read(path);
  const head=html.split('</head>')[0];
  const preload=head.match(/<link rel="preload" as="image"[^>]+>/g)||[];
  assert.equal(preload.length,1,`${path}: exactly one image should be preloaded`);
  assert.ok(head.indexOf(preload[0])<head.indexOf('fonts.googleapis.com'),`${path}: preload must precede font requests`);
  assert.match(preload[0],new RegExp(`imagesrcset="[^"]*${id}-640\\.webp 640w`));
  assert.match(preload[0],/imagesizes="[^"]+"/);
  assert.match(preload[0],/fetchpriority="high"/);
  const preloadSource=preload[0].match(/href="([^"]+)"/)[1];
  assert.ok(existsSync(resolve(root,'.'+preloadSource)),`${path}: missing preload fallback`);
  const image=html.match(new RegExp(`<img [^>]*src="[^"]*${id}[^>]+>`))[0];
  assert.match(image,/loading="eager" fetchpriority="high"/);
  assert.equal(preload[0].match(/imagesrcset="([^"]+)"/)[1],image.match(/srcset="([^"]+)"/)[1]);
  assert.equal(preload[0].match(/imagesizes="([^"]+)"/)[1],image.match(/sizes="([^"]+)"/)[1]);
  assert.equal((html.match(/<img [^>]*fetchpriority="high"/g)||[]).length,1,`${path}: one high-priority image`);
 }
});

test('Bangkok guide holds adjacent hero tiles below the main image and defers the rest',()=>{
 const html=read('trip/guides/bangkok-with-kids/index.html');
 const hero=html.match(/<div class="bkk-hero">([\s\S]*?)<\/div>/)[1];
 assert.equal((hero.match(/loading="eager" fetchpriority="high"/g)||[]).length,1);
 assert.equal((hero.match(/loading="eager" fetchpriority="low"/g)||[]).length,2);
 const overview=html.match(/<div class="bkk-overview">([\s\S]*?)<\/div>/)[1];
 assert.equal((overview.match(/loading="lazy" fetchpriority="low"/g)||[]).length,8);
});
