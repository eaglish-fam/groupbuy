import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createRequire} from 'node:module';
const pc=createRequire(import.meta.url)('../product-content.js');
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=read('blog/sanfufarm/index.html'),landing=read('go/sanfu-farm/index.html');
const CTA='https://www.eaglish.store/go/sanfu-farm/';
test('sanfufarm: catalog entry, one H1, assets exist',()=>{
 assert.equal(pc.entry('三富休閒農場')?.id,'sanfufarm');
 assert.equal((html.match(/<h1\b/g)||[]).length,1);
 for(const [,src] of html.matchAll(/(?:src|href)="(\/assets\/sanfufarm\/[^"]+)"/g))assert.ok(existsSync(new URL('..'+src,import.meta.url)),src);
});
test('sanfufarm: every booking CTA goes to the unified entry, never a single pid',()=>{
 const ctas=[...html.matchAll(/<a class="offer-cta" href="([^"]+)"/g)].map(m=>m[1]);
 assert.ok(ctas.length>=2);
 assert.ok(ctas.every(h=>h===CTA));
 assert.doesNotMatch(html,/bbnet\.com\.tw|pid=|準備中|審稿|預覽/);
});
test('sanfufarm landing: noindex, no price or commission wording, links the article, ten booking links kept',()=>{
 assert.match(landing,/<meta name="robots" content="noindex,follow">/);
 assert.doesNotMatch(landing,/NT\$|\$\d|回饋|分潤|佣金/);
 assert.ok(landing.includes('href="/blog/sanfufarm/"'));
 assert.equal((landing.match(/href="https:\/\/www\.bbnet\.com\.tw\/violetforest\/reserve\/index\.php\?lang=tw&amp;c=pack&amp;m=info&amp;pid=5\d\d"/g)||[]).length,10);
 for(const img of landing.match(/<img\b[^>]*>/g))assert.match(img,/width="\d+" height="\d+"/);
});
