import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
const pc=createRequire(import.meta.url)('../product-content.js');
const read=path=>readFileSync(new URL(`../${path}`,import.meta.url));
const row={'品牌':'法國帕洛防蚊液','連結':'https://gbf.tw/qdfm4','類型':'短期','開團日期':'2026-10-15','結束日期':'2026-10-21'};

test('Para’Kito article body is the accepted #44 delivery',()=>{
 // Codex accepted these exact bytes; integration must not rewrite the article.
 assert.equal(createHash('sha256').update(read('blog/parakito/index.html')).digest('hex'),'3aecb254fe1a7c6078dca297f062677ffc585629aa68906070ede78834e33f12');
});

test('Para’Kito catalog entry binds only the exact Sheet brand',()=>{
 const entry=pc.entry(row.品牌);
 assert.equal(entry?.id,'parakito');assert.equal(entry.article,'/blog/parakito/');
 assert.equal(pc.entry('Para’Kito'),undefined);assert.equal(pc.entry('帕洛防蚊液'),undefined);
 assert.equal(entry.image,'/assets/parakito/cover.webp');assert.equal(entry.published,'2026-10-15');
 assert.equal(entry.url,undefined);assert.equal(entry.buyUrl,undefined);
});

test('Para’Kito offer opens only inside the Sheet dates and fails closed otherwise',()=>{
 assert.equal(pc.campaignFor([row],'parakito','2026-10-15').state,'open');
 assert.equal(pc.campaignFor([row],'parakito','2026-10-21').state,'open');
 assert.equal(pc.campaignFor([row],'parakito','2026-10-22').state,'closed');
 assert.equal(pc.campaignFor([row,row],'parakito','2026-10-16').state,'unavailable');
 assert.equal(pc.campaignFor([],'parakito','2026-10-16').state,'unavailable');
});

test('Para’Kito page keeps one H1, resolvable chapters and a single offer link',()=>{
 const html=read('blog/parakito/index.html').toString();
 assert.equal((html.match(/<h1\b/g)||[]).length,1);
 assert.equal((html.match(/data-parakito-offer/g)||[]).length,1);
 const nav=html.match(/<nav[^>]*data-reading-nav[^>]*>([\s\S]*?)<\/nav>/)?.[1];
 assert.ok(nav,'chapter navigation');
 const anchors=[...nav.matchAll(/href="#([^"]+)"/g)].map(m=>m[1]);
 assert.ok(anchors.length>=6,`chapters: ${anchors.length}`);
 for(const id of anchors) assert.match(html,new RegExp(`id="${id}"`),`#${id}`);
 // No purchase URL is baked into the page; parakito.js fills it from the Sheet when open.
 assert.doesNotMatch(html,/gbf\.tw\/qdfm4/);
});

test('Para’Kito is listed in the journal with the shared cover',()=>{
 const index=read('blog/index.html').toString();
 const card=index.match(/<article class="article-card" data-article="parakito"[\s\S]*?<\/article>/)?.[0];
 assert.ok(card,'journal card');
 assert.ok(card.includes('src="/assets/parakito/cover.webp"'));
 assert.ok(card.includes('<a class="buy" data-buy hidden>'),'buy link stays hidden until the Sheet says open');
});
