import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {parseArticleMarkdown} from '../scripts/travel-article-renderer.mjs';
import {travelHomeCatalog} from '../trip/home-catalog.mjs';
import {validateTravelHomeCatalog} from '../scripts/build-trip-home.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const config=JSON.parse(read('trip/data/cebu-bohol-guide.json'));
const html=read('trip/guides/cebu-bohol-with-kids/index.html');
test('actual Alma v6 source is materialized exactly and its used media identities render without deleting masters',()=>{
 const source=read('trip/content/philippines/cebu-bohol-with-kids.md');
 const receipt=JSON.parse(read('trip/content/philippines/alma-source-receipt.json'));
 assert.equal(createHash('sha256').update(source).digest('hex'),receipt.sha256);
 const article=parseArticleMarkdown(source,config.sectionMap);
 assert.equal(article.sections.length,14);assert.match(article.intro,/想帶孩子/);assert.doesNotMatch(article.intro,/!\[|hero_source_id|media\//);
 assert.doesNotMatch(html,/&lt;a id=|media\/webp|\/Users\/|典型私車鄉村線約八小時/);
 const media=JSON.parse(read('trip/assets/cebu-bohol-media.json'));
 assert.equal(media.length,32);assert.equal(receipt.sourceArtifact,'alma-article-v6.md');
 assert.match(source,/buggy 行程途中，導遊幫我們拍照；拿著安全帽的拍法，是孩子自己的創意。/);
 const refs=[...source.matchAll(/^!\[[^\]]*\]\(([^)]+)\)$/gm)].map(m=>config.mediaMap[m[1]]);assert.equal(refs.length,29);
 for(const m of media){if(refs.includes(m.id))assert.ok(html.includes(m.variants.find(v=>v.width===960)?.file||m.variants.at(-1).file),m.id);assert.equal(createHash('sha256').update(readFileSync(new URL('..'+m.file,import.meta.url))).digest('hex'),m.derivedSha256);}
});
test('photo comparison, stable Bilar identity, source TOC, canonical and post-FAQ planner agree',()=>{
 const compare=html.slice(html.indexOf('<section id="choose"'),html.indexOf('<section id="islands"'));
 assert.equal((compare.match(/<img\b/g)||[]).length,6);assert.doesNotMatch(compare,/<table/);
 assert.match(html,/Bohol Tarsier Conservation Area/);assert.match(html,/query_place_id=ChIJORwIIvxDqjMREtkvm-C7978/);assert.doesNotMatch(html,/Corella/);
 const ids=[...html.matchAll(/<section id="([^"]+)"/g)].map(m=>m[1]);
 assert.deepEqual(ids,['choose','islands','buggy','hills','tarsier','loboc','cross','whale-shark','dining','stay','transport','faq','plan','films']);
 assert.equal((html.match(/<img[^>]*fetchpriority="high"/g)||[]).length,1);
 assert.ok(html.indexOf('data-cb-planner')<html.indexOf('<details class="cb-static-examples"'));
 assert.match(html,/<summary>看一至兩天的行程範例<\/summary>/);
 for(const heading of ['一天悠閒｜山景加一種體驗','一天緊湊｜先固定午餐，再接活動','兩天悠閒｜不同玩法分兩天','兩天緊湊｜四種玩法與調整空間'])assert.ok(html.includes(heading));
 assert.match(html,/rel="canonical" href="https:\/\/www.eaglish.store\/trip\/guides\/cebu-bohol-with-kids\/"/);
 for(const [,anchor] of html.matchAll(/href="#([a-z0-9-]+)"/g))assert.ok(html.includes(`id="${anchor}"`),anchor);
});
test('single-guide country entrance is explicit and does not permit unrelated duplicate routes',()=>{
 const country=travelHomeCatalog.countries.find(c=>c.id==='philippines'),guide=travelHomeCatalog.guides.find(g=>g.id==='cebu-bohol');
 assert.equal(country.href,guide.href);assert.equal(country.entryKind,'single-guide');assert.equal(validateTravelHomeCatalog(travelHomeCatalog),true);
 const invalid=structuredClone(travelHomeCatalog);invalid.countries.find(c=>c.id==='philippines').entryKind='hub';assert.throws(()=>validateTravelHomeCatalog(invalid),/duplicate route/);
});
test('only the Cebu guide opts its travel masthead into measured reading navigation',()=>{
 const readingNav=read('blog/reading-nav.js');
 assert.match(html,/<body class="bkk-guide cb-guide" data-country="philippines">/);
 assert.match(readingNav,/querySelector\('\.journal-chrome'\) \|\|\s*document\.querySelector\('body\.cb-guide > header\.masthead\.wrap'\)/);
 assert.doesNotMatch(html,/<header class="[^"]*journal-chrome/);
 assert.match(readingNav,/padding - headerBottom\(\) - 16/);
 assert.match(readingNav,/body\.classList\.contains\('cb-guide'\) \? 1 : 0/);
 assert.match(readingNav,/behavior: reducedMotion\.matches \|\| guideRoundingBuffer \? 'instant' : 'smooth'/);
 assert.match(readingNav,/observer\.observe\(chrome\)/);
 assert.match(readingNav,/document\.fonts\?\.status === 'loading'/);
 assert.match(readingNav,/document\.fonts\.ready\.then/);
 assert.match(readingNav,/cancelled \|\| document\.activeElement !== heading/);
});
test('unloaded editorial images reserve their source ratio so the first TOC jump stays stable',()=>{
 const css=read('trip/cebu-bohol.css');
 assert.match(css,/\.cb-guide \.cb-hero img\{[^}]*aspect-ratio:var\(--cb-photo-ratio\)/);
 assert.match(css,/\.cb-guide \.cb-gallery img\{[^}]*aspect-ratio:var\(--cb-photo-ratio\)/);
 for(const tag of html.matchAll(/<img[^>]*src="\/trip\/assets\/ph-cebu-bohol-[^>]+>/g)){
  const width=tag[0].match(/ width="(\d+)"/)[1],height=tag[0].match(/ height="(\d+)"/)[1];
  assert.ok(tag[0].includes(`--cb-photo-ratio:${width}/${height}`));
 }
 assert.match(css,/\.cb-photo-cards img\{[^}]*aspect-ratio:1\/1/);
});
test('v3 active-picture frames use new URLs, retain crop provenance, and leave photos identical',()=>{
 const current=JSON.parse(read('trip/assets/cebu-bohol-media.json'));
 const previous=JSON.parse(read('trip/assets/cebu-bohol-media-v2.json'));
 assert.match(read('trip/cebu-bohol.css'),/\[href="#loboc"\][^}]*object-fit:contain/);
 for(const m of current.filter(m=>m.kind==='user-supplied-photo'||m.mediaRevision===3)){
  const old=previous.find(v=>v.id===m.id);
  if(m.id.startsWith('photo')){assert.deepEqual(m,old);continue;}
  assert.equal(m.mediaRevision,3);assert.match(m.file,/-v3-active\.webp$/);
  assert.equal(m.presentationTimestamp,old.presentationTimestamp);assert.equal(m.timeBase,old.timeBase);
  assert.equal(m.letterbox,false);assert.equal(m.contentEditApplied,false);
  assert.equal(m.height,Number(m.id.slice(-2))>=12?864:1080);
  assert.deepEqual(m.crop,Number(m.id.slice(-2))>=12?{x:0,y:108,w:1920,h:864}:null);
  assert.equal(m.activePictureRect.h,m.height);
  for(const v of m.variants){assert.match(v.file,/-v3-active-/);assert.ok(html.includes(v.file));}
  assert.ok(!html.includes(old.variants[0].file));
 }
});

test('expanded page has usable topic entrances, grouped media, ordinary flights and precise scope',()=>{
 const source=read('trip/content/philippines/cebu-bohol-with-kids.md'),article=parseArticleMarkdown(source,config.sectionMap);
 const topics=html.match(/<nav class="cb-topic-entries"[\s\S]*?<\/nav>/)[0];
 assert.equal((topics.match(/<img /g)||[]).length,3);
 for(const id of ['choose','dining','stay'])assert.ok(topics.includes(`href="#${id}"`));
 const galleries=[...html.matchAll(/<div class="cb-gallery[^"]*" data-photo-count="(\d+)"/g)].map(m=>Number(m[1]));
 assert.ok(galleries.filter(n=>n===4).length===3);assert.ok(galleries.includes(3));assert.ok(galleries.includes(2));
 assert.match(html,/name="description" content="從鷹式一家實訪/);assert.ok(html.includes(article.metadata.description));
 assert.match(html,/href="https:\/\/www.skyscanner.com.tw\/" target="_blank" rel="noopener"/);
 assert.doesNotMatch(html,/不是幼兒淺池|Molly 的泳池不是|media-slot:|待核|sponsored[^>]*>Skyscanner/);
 assert.match(html,/成人與孩子在水下，周圍是藍色海水/);
 const planner=read('trip/cebu-bohol-planner-model.mjs');assert.doesNotMatch(planner,/whale-shark|Lila|Henann|MIST|Ubeco/);
 const home=read('trip/index.html');
 for(const link of travelHomeCatalog.guides.find(g=>g.id==='cebu-bohol').planningLinks)assert.ok(home.includes(config.path+'#'+link.target));
 assert.match(home,/機票雷達目前暫停更新/);
 assert.match(read('trip/home.js'),/planningOnly!=='true'/);
 const media=JSON.parse(read('trip/assets/cebu-bohol-media.json')),old=JSON.parse(read('trip/assets/cebu-bohol-media-v3.json'));
 for(const m of old)assert.deepEqual(media.find(n=>n.id===m.id),m);
 for(const m of media.filter(n=>n.mediaRevision===4)){assert.match(m.file,/-v4-active\.webp$/);assert.equal(m.letterbox,false);assert.equal(m.contentEditApplied,false);}
});
