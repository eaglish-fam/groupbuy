import test from 'node:test';
import assert from 'node:assert/strict';
import {inlineMarkdown,renderMarkdown,parseArticleMarkdown,validateTravelArticle,renderTravelArticle,renderTravelImage} from '../scripts/travel-article-renderer.mjs';
const media={photo:{file:'/trip/assets/test.webp',alt:'Family & hills',caption:'Caption',width:1280,height:853,variants:[{file:'/trip/assets/test-640.webp',width:640,height:426},{file:'/trip/assets/test-960.webp',width:960,height:640}]}};
const article={title:'Test title',intro:'Actual editorial introduction',sections:['before','hills','faq','plan','video'].map(id=>({id,label:id,title:id,lines:id==='faq'?['### A question','An answer']:['Real editorial paragraph.']}))};
const config={path:'/trip/guides/test/',hero:'photo',tocTitle:'Test',author:'鷹式一家',updatedAt:'2026-09-30',eyebrow:'TEST',cards:[{target:'hills',image:'photo',name:'Hills',region:'Bohol',duration:'Planning duration'}]};
test('travel renderer escapes source text and unsafe links instead of allowing injected HTML',()=>{
 assert.doesNotMatch(inlineMarkdown('<img onerror=x> [x](javascript:alert)'),/<img|href="javascript/);
 assert.match(renderMarkdown(['### Detail','A **strong** paragraph','- List item']),/<h3>Detail<\/h3>/);
 assert.throws(()=>parseArticleMarkdown('# T\n\nI\n## Unknown\nP',{}),/Unmapped/);
});
test('shared shell has numbered same-source TOC, valid canonical, no dead country hub and exactly one high-priority image',()=>{
 const h=renderTravelArticle(article,config,media);assert.equal((h.match(/fetchpriority="high"/g)||[]).length,2); // one preload, one img
 assert.equal((h.match(/<img[^>]*fetchpriority="high"/g)||[]).length,1);
 assert.match(h,/class="cb-toc-number">01<\/span> <span>/);assert.match(h,/data-reading-nav/);
 assert.match(h,/href="https:\/\/www.eaglish.store\/trip\/guides\/test\/"/);assert.doesNotMatch(h,/href="\/trip\/philippines\//);
 assert.ok(h.indexOf('<section id="faq"')<h.indexOf('<section id="plan"'));assert.ok(h.indexOf('<section id="plan"')<h.indexOf('<section id="video"'));
 assert.match(h,/data-plan-output/);assert.match(h,/class="cb-photo-cards"/);
});
test('source-bound cards, sections and planner placement fail closed when inconsistent',()=>{
 assert.throws(()=>validateTravelArticle({...article,sections:article.sections.filter(s=>s.id!=='plan')},config,media),/Required/);
 assert.throws(()=>validateTravelArticle(article,{...config,cards:[{target:'missing',image:'photo'}]},media),/Invalid/);
 assert.throws(()=>validateTravelArticle({...article,sections:[...article.sections,article.sections[0]]},config,media),/duplicate/);
});

test('topic thumbnails use smallest existing fallback and accessible two-line whole links; body output is unchanged',()=>{
 const topics=[['before','景點','怎麼玩','50% 65%'],['hills','餐廳','吃什麼','70% 50%'],['faq','飯店','住哪裡','40% 50%']].map(([target,title,prompt,position])=>({target,image:'photo',label:`${title}：${prompt}`,labelLines:[title,prompt],position}));
 const oldHtml=renderTravelArticle(article,config,media),html=renderTravelArticle(article,{...config,topics},media);
 const nav=html.match(/<nav class="cb-topic-entries"[\s\S]*?<\/nav>/)[0];
 assert.match(nav,/data-media-layout="topic-circles-v5"/);
 assert.equal((nav.match(/<a /g)||[]).length,3);
 assert.equal((nav.match(/src="\/trip\/assets\/test-640.webp"/g)||[]).length,3);
 assert.equal((nav.match(/alt=""/g)||[]).length,3);
 assert.equal((nav.match(/class="cb-topic-chevron" aria-hidden="true"/g)||[]).length,3);
 assert.doesNotMatch(nav,/[?？]/);
 for(const t of topics){assert.ok(nav.includes(`href="#${t.target}" aria-label="${t.label}"`));assert.ok(nav.includes(t.labelLines.map(l=>`<span>${l}</span>`).join('')));assert.ok(nav.includes(`--cb-topic-position:${t.position}`));}
 assert.equal(html.replace(nav,''),oldHtml,'only the added navigation may change, not the body, hero or source captions');
 assert.match(renderTravelImage(media.photo),/src="\/trip\/assets\/test-960.webp"/);
 assert.match(renderTravelImage(media.photo),/alt="Family &amp; hills"/);
 assert.throws(()=>validateTravelArticle(article,{...config,topics:[{...topics[0],labelLines:['one']}]},media),/label lines/);
 assert.throws(()=>validateTravelArticle(article,{...config,topics:[{...topics[0],position:'50% 50%;filter:blur(9px)'}]},media),/focal position/);
});

test('reviewed frontmatter description is retained and inconsistent title fails closed',()=>{
 const mapping=Object.fromEntries(article.sections.map(s=>[s.title,{id:s.id,label:s.label}]));
 const md='---\ntitle: Test title\ndescription: Reviewed scope with dining and stay\n---\n# Test title\n\nActual intro\n'+article.sections.map(s=>`## ${s.title}\nReal paragraph`).join('\n');
 const parsed=parseArticleMarkdown(md,mapping),h=renderTravelArticle(parsed,config,media);
 assert.match(h,/name="description" content="Reviewed scope with dining and stay"/);
 assert.throws(()=>parseArticleMarkdown(md.replace('title: Test title','title: Other'),mapping),/differs from H1/);
 assert.throws(()=>validateTravelArticle(article,{...config,topics:[{target:'missing',image:'photo',label:'Dining'}]},media),/Invalid topic/);
});

test('hotel articles share metadata and individual TOC without city-day planner or invented hotel facts',()=>{
 const a={title:'Reviewed stay article',intro:'Source-bound introduction',metadata:{description:'Reviewed lodging questions'},sections:[{id:'rooms',title:'Room evidence',label:'Rooms',lines:['An approved [Maps source](https://www.google.com/maps/) and [booking source](https://example.org/booking).']},{id:'faq',title:'Questions',label:'FAQ',lines:['### A reviewed question','An approved answer.']}]};
 for(const slug of ['test-a','test-b']){
  const c={...config,articleType:'hotel',path:`/trip/stays/${slug}/`,cards:[],related:[{href:'/trip/guides/test/',label:'Related overview'}]};
  const h=renderTravelArticle(a,c,media);
  assert.ok(h.includes('https://www.eaglish.store'+c.path));
  assert.match(h,/data-reading-nav/);assert.match(h,/class="cb-toc-number">02<\/span>/);
  assert.match(h,/\/blog\/reading-nav.js/);assert.match(h,/class="cb-related"/);
  assert.match(h,/href="#rooms">住宿介紹/);assert.match(h,/href="#faq">入住問題/);
  assert.match(h,/name="description" content="Reviewed lodging questions"/);
  assert.doesNotMatch(h,/cebu-bohol-planner|data-cb-planner|trip-plan-entry|data-plan-entry|href="#plan"|LodgingBusiness|aggregateRating/);
  assert.match(h,/https:\/\/www.google.com\/maps\//);assert.match(h,/https:\/\/example.org\/booking/);
 }
 assert.throws(()=>validateTravelArticle(a,{...config,articleType:'hotel',cards:[]},media),/related travel links/);
 assert.throws(()=>validateTravelArticle({...a,sections:[...a.sections,{id:'plan'}]},{...config,articleType:'hotel'},media),/must not attach/);
 assert.throws(()=>validateTravelArticle(a,{...config,articleType:'unknown'},media),/Unsupported/);
});
