import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
const pc=createRequire(import.meta.url)('../product-content.js');
const read=path=>readFileSync(new URL(`../${path}`,import.meta.url));
const row={'品牌':'澳佳寶保健食品','連結':'https://www.blackmores.com.tw/page/zion.zenith2610?utm_source=KOL','類型':'短期','開團日期':'2026-10-19','結束日期':'2026-10-25'};

test('Blackmores verified prose, comparison tables and FAQ remain unchanged during the visual/editorial revision',()=>{
 // Baseline is origin/main e00da92 before this revision, not a hash recomputed from the edited article.
 // Headings, section labels, media and the source footer are explicitly being revised.
 const html=read('blog/blackmores/index.html').toString();
 const body=html.split('<div class="article-body">')[1]?.split('<footer class="sources">')[0]||'';
 const parts=[...body.matchAll(/<(?:p|table|details)\b[^>]*>[\s\S]*?<\/(?:p|table|details)>/g)]
  .map(m=>m[0]).filter(v=>!/^<p\b[^>]*(?:section-label|data-editorial-exclude)/.test(v))
  .map(v=>v.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim());
 assert.ok(parts.length>15,'verified content blocks are present');
 assert.equal(createHash('sha256').update(parts.join('\n')).digest('hex'),'de5d2a91c8724796b95338f21ea685b8a9050c3bcd7a8d0a2d02793c60841a8e');
});

test('Blackmores catalog entry binds only the exact Sheet brand and uses the standalone product card',()=>{
 const entry=pc.entry(row.品牌);
 assert.equal(entry?.id,'blackmores');assert.equal(entry.article,'/blog/blackmores/');
 for(const near of ['澳佳寶','Blackmores','澳佳寶保健','澳佳寶 保健食品 2'])assert.equal(pc.entry(near),undefined,near);
 assert.equal(entry.image,'/assets/blackmores/cover-v2.webp');assert.equal(entry.cardImage,'/assets/blackmores/product-card-v2.webp');
 assert.equal(entry.published,'2026-10-19');assert.equal(entry.url,undefined);assert.equal(entry.buyUrl,undefined);
 for(const image of [entry.image,entry.cardImage])assert.ok(existsSync(new URL(`..${image}`,import.meta.url)),image);
});

test('Blackmores offer opens only inside the Sheet dates and fails closed otherwise',()=>{
 assert.equal(pc.campaignFor([row],'blackmores','2026-10-19').state,'open');
 assert.equal(pc.campaignFor([row],'blackmores','2026-10-25').state,'open');
 assert.equal(pc.campaignFor([row],'blackmores','2026-10-26').state,'closed');
 assert.equal(pc.campaignFor([row],'blackmores','2026-10-18').state,'upcoming');
 assert.equal(pc.campaignFor([row,row],'blackmores','2026-10-20').state,'unavailable');
 assert.equal(pc.campaignFor([],'blackmores','2026-10-20').state,'unavailable');
 assert.equal(pc.campaignFor([{...row,'類型':'結團'}],'blackmores','2026-10-20').state,'closed');
 assert.equal(pc.campaignFor([{...row,'品牌':'澳佳寶'}],'blackmores','2026-10-20').state,'unavailable');
 // The tracked Sheet link keeps its own UTM parameters; ours are only added when none exist.
 const open=pc.campaignFor([row],'blackmores','2026-10-20');
 assert.equal(pc.withUTM(open.url,'澳佳寶保健食品'),row.連結);
});

test('Blackmores page keeps one H1, resolvable chapters, a crawlable fallback and no baked-in purchase URL',()=>{
 const html=read('blog/blackmores/index.html').toString();
 assert.equal((html.match(/<h1\b/g)||[]).length,1);
 assert.equal((html.match(/data-blackmores-offer/g)||[]).length,1);
 assert.equal((html.match(/data-blackmores-early/g)||[]).length,1);
 const nav=html.match(/<nav[^>]*data-reading-nav[^>]*>([\s\S]*?)<\/nav>/)?.[1];
 assert.ok(nav,'chapter navigation');
 const anchors=[...nav.matchAll(/href="#([^"]+)"/g)].map(m=>m[1]);
 assert.ok(anchors.length>=6,`chapters: ${anchors.length}`);
 for(const id of anchors)assert.match(html,new RegExp(`id="${id}"`),`#${id}`);
 assert.doesNotMatch(html,/blackmores\.com\.tw\/page\/zion|gbf\.tw|utm_campaign=zion/);
 assert.match(html,/<noscript>[\s\S]*?href="\/"/);
 assert.match(html,/src="\/blog\/blackmores\/blackmores\.js"/);
 // Without JavaScript or an open Sheet row both buttons still reach the live catalogue.
 for(const attr of ['data-blackmores-early','data-blackmores-offer'])assert.match(html,new RegExp(`<a[^>]*href="/#catalog"[^>]*${attr}|<a[^>]*${attr}[^>]*href="/#catalog"`));
});

test('Blackmores is listed in the journal with the shared cover and a hidden buy link',()=>{
 const index=read('blog/index.html').toString();
 const card=index.match(/<article class="article-card" data-article="blackmores"[\s\S]*?<\/article>/)?.[0];
 assert.ok(card,'journal card');
 assert.ok(card.includes(`src="${pc.entry(row.品牌).image}"`));
 assert.ok(card.includes('<a class="buy" data-buy hidden>'),'buy link stays hidden until the Sheet says open');
 assert.ok(card.includes('data-category="食品"')||index.includes('data-article="blackmores" data-category="食品"'));
});

test('Blackmores script drives both controls and the floating button from the same Sheet row',()=>{
 const js=read('blog/blackmores/blackmores.js').toString();
 assert.match(js,/campaignFor\(.*'blackmores'\)/);
 assert.match(js,/ArticleFloatingOffer\.mount\(offer/);
 assert.match(js,/state !== 'open'/);
 assert.doesNotMatch(js,/https?:\/\/(?!docs\.google\.com)/,'no hard-coded purchase destination');
});

test('Blackmores article carries the family photographs Hiram supplied, each with alt text and a lazy load',()=>{
 const html=read('blog/blackmores/index.html').toString();
 const photos=['family-fish-oil','kids-lutein-tablets','kids-fish-oil-capsules','capsules-side-by-side','capsules-tray-top','capsules-tray-angle','mini-capsule','kids-capsule','mini-capsules-cut','mini-capsule-cut','kids-capsules-cut','capsules-cut-pair'];
 for(const name of photos){
  const tag=html.match(new RegExp(`<img src="/assets/blackmores/photo-${name}\\.webp"[^>]*>`))?.[0];
  assert.ok(tag,name);
  assert.match(tag,/loading="lazy"/,name);assert.match(tag,/alt="[^"]{8,}"/,name);
  for(const file of tag.match(/\/assets\/blackmores\/photo-[\w-]+\.webp/g))assert.ok(existsSync(new URL(`..${file}`,import.meta.url)),file);
 }
});
