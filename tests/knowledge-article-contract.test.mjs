import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import vm from 'node:vm';
import { articleIdentity, articlePublication, isKnowledgeArticle } from '../scripts/content-identity.mjs';
import { validateBlogCover } from '../scripts/blog-cover-contract.mjs';
import { auditBlog } from '../scripts/blog-release-audit.mjs';
import { buildContentHubs } from '../scripts/build-content-hubs.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const legacyRoot=process.env.KNOWLEDGE_LEGACY_ROOT || root;
const require=createRequire(import.meta.url), ProductContent=require('../product-content.js'), model=require('../blog/blog-model.js');
const fixtureRoots=[];
const descriptor={
  mode:'explainer',intent:'hummus-definition-eating-nutrition-storage',productNames:[],
  title:'鷹嘴豆泥是什麼？Hummus 的吃法、營養與保存一次看懂',
  description:'鷹嘴豆泥 Hummus 怎麼吃、熱量怎麼看？從芝麻醬與中世紀食譜，整理早餐、捲餅、餐盤搭配，對照熟豆與豆泥的每100g營養，並說明自製、冷藏解凍與份量換算，連到 Wave 商品介紹與當期組合。',
  image:'/assets/hummus-guide/cover-v1.webp',
  alt:'菇類與葉菜搭配鷹嘴豆泥的餐盤，搭配鷹嘴豆泥吃法、營養與保存主題標題。',
  cluster:'table',relatedArticles:['wave-hummus'],publicationState:'not_published',datePrepared:'2026-10-13'
};
const identity=()=>articleIdentity('hummus-guide',null,descriptor);
const read=(base,path)=>fs.readFileSync(join(base,path),'utf8');
const put=(base,path,value)=>{fs.mkdirSync(dirname(join(base,path)),{recursive:true});fs.writeFileSync(join(base,path),value);};
const hash=value=>createHash('sha256').update(value).digest('hex');
function temporaryRoot(){
  const value=fs.mkdtempSync(join(root,'.knowledge-fixtures-'));
  fixtureRoots.push(value);return value;
}
after(()=>{for(const value of fixtureRoots)fs.rmSync(value,{recursive:true,force:true});});

function candidateHtml(){
  const article={'@type':'Article',mainEntityOfPage:'https://www.eaglish.store/blog/hummus-guide/',
    author:{'@type':'Organization',name:'鷹式一家',url:'https://www.eaglish.store/'},
    publisher:{'@type':'Organization',name:'鷹式一家',url:'https://www.eaglish.store/'},
    image:['https://www.eaglish.store'+descriptor.image],keywords:['鷹嘴豆泥','Hummus']};
  return '<!doctype html><html lang="zh-TW"><head><title>'+descriptor.title+'｜鷹家選物誌</title>'+
    '<meta name="description" content="'+descriptor.description+'"><meta name="robots" content="noindex,follow,max-image-preview:large">'+
    '<link rel="canonical" href="https://www.eaglish.store/blog/hummus-guide/">'+
    '<meta property="og:image" content="https://www.eaglish.store'+descriptor.image+'">'+
    '<meta property="og:image:width" content="1600"><meta property="og:image:height" content="1000"><meta property="og:image:alt" content="'+descriptor.alt+'">'+
    '<meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="https://www.eaglish.store'+descriptor.image+'">'+
    '<meta name="twitter:title" content="'+descriptor.title+'"><meta name="twitter:description" content="'+descriptor.description+'">'+
    '<link rel="stylesheet" href="/product-content.css?v=20260911-video-poster"><script src="/product-content.js?v=20260911-video-poster"></script>'+
    '<script type="application/ld+json">'+JSON.stringify({'@context':'https://schema.org','@graph':[article,{'@type':'BreadcrumbList'}]})+'</script></head>'+
    '<body><main><h1><span class="seo-subject">鷹嘴豆泥</span>是什麼？Hummus 的吃法、營養與保存一次看懂</h1>'+
    '<time datetime="'+descriptor.datePrepared+'">資料整理於 '+descriptor.datePrepared+'</time>'+
    '<img src="'+descriptor.image+'" width="1600" height="1000" alt="'+descriptor.alt+'">'+
    '<section class="opening" data-answer-block><p>這是 Node 回歸測試的合成知識頁 fixture。</p></section>'+
    '<p>'+'回歸測試用正文，不是公開內容或真實閱讀驗收。'.repeat(100)+'</p>'+
    '<details><summary>A</summary>fixture</details>'.repeat(4)+
    '<a href="/blog/wave-hummus/">Wave 商品文章</a></main></body></html>';
}
function candidateCard(){
  return '<article data-article="hummus-guide" data-content-kind="explainer" data-category="食品" data-prepared="'+descriptor.datePrepared+'" data-state="journal">'+
    '<a href="/blog/hummus-guide/"><img src="'+descriptor.image+'" alt="'+descriptor.alt+'"></a>'+
    '<span data-status>閱讀知識指南</span><h3><a href="/blog/hummus-guide/">'+descriptor.title+'</a></h3></article>';
}
function legacyFixture(){
  const value=temporaryRoot();
  // These symlinks are read-only baseline dependencies. Mutated fixture files
  // (blog, config, sitemap and hummus assets) are always real copies inside value.
  for(const entry of fs.readdirSync(legacyRoot,{withFileTypes:true})){
    if(entry.name.startsWith('.')||['blog','config','assets','sitemap.xml','node_modules'].includes(entry.name))continue;
    fs.symlinkSync(join(legacyRoot,entry.name),join(value,entry.name));
  }
  fs.mkdirSync(join(value,'assets'));
  for(const entry of fs.readdirSync(join(legacyRoot,'assets'),{withFileTypes:true})){
    if(entry.name==='hummus-guide')continue;
    fs.symlinkSync(join(legacyRoot,'assets',entry.name),join(value,'assets',entry.name));
  }
  fs.mkdirSync(join(value,'blog'));
  for(const entry of fs.readdirSync(join(legacyRoot,'blog'),{withFileTypes:true})){
    if(entry.isFile()&&entry.name!=='index.html')fs.symlinkSync(join(legacyRoot,'blog',entry.name),join(value,'blog',entry.name));
  }
  for(const entry of Object.values(ProductContent.catalog).filter(p=>p.article)){
    put(value,entry.article.slice(1)+'index.html',read(legacyRoot,entry.article.slice(1)+'index.html'));
    for(const dependency of fs.readdirSync(join(legacyRoot,entry.article.slice(1)),{withFileTypes:true})){
      if(dependency.name==='index.html')continue;
      fs.symlinkSync(join(legacyRoot,entry.article.slice(1),dependency.name),join(value,entry.article.slice(1),dependency.name));
    }
  }
  const blogIndex=read(legacyRoot,'blog/index.html').replace(/<article\b[^>]*data-article="hummus-guide"[\s\S]*?<\/article>/g,'');
  put(value,'blog/index.html',blogIndex);
  put(value,'config/content-articles.json',JSON.stringify({version:1,articles:{}}));
  put(value,'config/blog-cover-identities.json',read(legacyRoot,'config/blog-cover-identities.json'));
  const sitemap=read(legacyRoot,'sitemap.xml').replace(/<url>[\s\S]*?<\/url>/g,item=>item.includes('/blog/hummus-guide/')?'':item);
  put(value,'sitemap.xml',sitemap);
  return value;
}
function candidateFixture(){
  const value=legacyFixture(), html=candidateHtml(),card=candidateCard();
  put(value,'blog/hummus-guide/index.html',html);
  put(value,'blog/index.html',read(value,'blog/index.html').replace('</main>',card+'</main>'));
  put(value,'config/content-articles.json',JSON.stringify({version:1,articles:{'hummus-guide':descriptor}}));
  const pixels=Buffer.from('Synthetic fixture bytes; not a rendered or reviewed hero.');
  const source='<h1>鷹嘴豆泥 Hummus</h1>';
  put(value,descriptor.image.slice(1),pixels);put(value,'assets/hummus-guide/cover-source.html',source);
  const entry={identity:'鷹嘴豆泥',image:descriptor.image,imageSha256:hash(pixels),source:'/assets/hummus-guide/cover-source.html',sourceSha256:hash(source),
    review:{identityVisible:true,realPhotoPreserved:true,imageSha256:hash(pixels),viewportWidths:[320,390,768,1440],mobileCardLegible:true}};
  const registry=JSON.parse(read(value,'config/blog-cover-identities.json'));registry.articles['/blog/hummus-guide/']=entry;
  put(value,'config/blog-cover-identities.json',JSON.stringify(registry));
  return {root:value,html,card,entry};
}

test('legacy product identity and shared reviewed comparison metadata retain their contract',()=>{
  assert.deepEqual(articleIdentity('wave-hummus',ProductContent.catalog.wave),{productNames:['Wave 鷹嘴豆泥'],productId:'wave-hummus',mode:'product',intent:'product:wave-hummus'});
  assert.deepEqual(articleIdentity('mat-compare',null,{mode:'comparison',intent:'floor-mat-choice',productNames:['Playzu','ALZiPMAT']}),{mode:'comparison',intent:'floor-mat-choice',productNames:['Playzu','ALZiPMAT'],productId:null});
  assert.equal(isKnowledgeArticle(articleIdentity('wave-hummus',ProductContent.catalog.wave,{...descriptor,mode:'explainer'})),false);
});

test('explicit reviewed explainer has no product identity and separates preparation from publication',()=>{
  const value=identity();
  assert.equal(value.productId,null);assert.equal(isKnowledgeArticle(value),true);
  assert.deepEqual(articlePublication(value,{}),{publicationState:'not_published',prepared:'2026-10-13'});
  assert.throws(()=>articlePublication(value,{datePublished:'2026-10-13'}),/cannot claim/);
  assert.throws(()=>articlePublication(value,{dateModified:'2026-10-13'}),/cannot claim/);
  assert.equal('datePublished' in value,false);assert.equal('dateModified' in value,false);
});

test('missing, malformed or fabricated knowledge descriptors fail closed',()=>{
  assert.throws(()=>articleIdentity('unknown',null),/needs reviewed/);
  for(const change of [
    {mode:'product'},{mode:'random'},{intent:''},{productNames:null},{productId:'wave-hummus'},
    {title:''},{description:''},{image:'/assets/../wave/family.webp'},{alt:''},{cluster:''},{relatedArticles:['hummus-guide']},
    {publicationState:'ready'},{datePrepared:'2026-02-30'},{datePublished:'2026-10-13'},{dateModified:'2026-10-13'}
  ])assert.throws(()=>articleIdentity('hummus-guide',null,{...descriptor,...change}),/Invalid reviewed/,JSON.stringify(change));
  assert.throws(()=>articleIdentity('hummus-guide',null,{mode:'explainer',intent:'hummus',productNames:[]}),/Invalid reviewed/);
});

test('a later published knowledge revision must carry real matching publication and modification dates',()=>{
  const published=articleIdentity('hummus-guide',null,{...descriptor,publicationState:'published',datePublished:'2026-10-14',dateModified:'2026-10-15'});
  assert.deepEqual(articlePublication(published,{datePublished:'2026-10-14',dateModified:'2026-10-15'}),{publicationState:'published',prepared:'2026-10-13',published:'2026-10-14',modified:'2026-10-15'});
  assert.throws(()=>articlePublication(published,{datePublished:'2026-10-13',dateModified:'2026-10-15'}),/must match/);
  assert.throws(()=>articleIdentity('hummus-guide',null,{...descriptor,publicationState:'published',datePublished:'2026-10-12',dateModified:'2026-10-15'}),/Invalid reviewed/);
});

test('knowledge cover binds shared descriptor, index, sharing, source and pixels without a fake productEntry',()=>{
  const fixture=candidateFixture();
  const input={root:fixture.root,entry:fixture.entry,html:fixture.html,indexCard:fixture.card,articleIdentity:identity()};
  assert.deepEqual(validateBlogCover(input),[]);
  assert.ok(validateBlogCover({...input,productEntry:"title:'鷹嘴豆泥',image:'/assets/hummus-guide/cover-v1.webp'"}).includes('cover-identity:non-product'));
  assert.ok(validateBlogCover({...input,articleIdentity:undefined}).includes('cover-identity:shared-title'));
  assert.ok(validateBlogCover({...input,indexCard:fixture.card.replace(descriptor.image,'/assets/wave/family.webp')}).includes('cover-identity:index-image'));
  assert.deepEqual(validateBlogCover({...input,entry:null,datePublished:'2026-09-01',dateModified:'2026-09-01'}),['cover-identity:missing-review']);
  assert.deepEqual(validateBlogCover({datePublished:'2026-09-01',dateModified:'2026-09-01'}),[]);
  assert.deepEqual(validateBlogCover({datePublished:'2026-10-13',dateModified:'2026-10-13'}),['cover-identity:missing-review']);
});

test('legacy website release audit remains ready and product gates stay strict',()=>{
  const value=legacyFixture(),report=auditBlog({root:value});
  assert.equal(report.status,'ready',JSON.stringify(report.failures,null,2));
  assert.equal(report.summary.unpublishedKnowledge,0);
  const wave=read(value,'blog/wave-hummus/index.html');
  put(value,'blog/wave-hummus/index.html',wave.replace('index,follow','noindex,follow'));
  put(value,'config/content-articles.json',JSON.stringify({version:1,articles:{'wave-hummus':{mode:'product',intent:'wave',productNames:['Wave 鷹嘴豆泥'],publicationState:'not_published',datePrepared:'2026-10-13'}}}));
  assert.ok(auditBlog({root:value}).failures.some(item=>item.id==='blog:wave-hummus:index.html:indexable'));
});

test('unpublished knowledge becomes candidate_ready without dates, sitemap publication or product mapping',()=>{
  const fixture=candidateFixture(),report=auditBlog({root:fixture.root});
  assert.equal(report.status,'candidate_ready',JSON.stringify(report.failures,null,2));
  assert.equal(report.summary.failures,0);assert.equal(report.summary.unpublishedKnowledge,1);
  assert.ok(!read(fixture.root,'product-content.js').includes("article:'/blog/hummus-guide/'"));
  assert.equal(ProductContent.catalog.wave.article,'/blog/wave-hummus/');
  assert.equal(ProductContent.catalog.wave.id,'wave-hummus');
});

test('candidate release rejects noindex loss, fake dates, sitemap inclusion, purchase cards and missing reviewed identity',()=>{
  const fixture=candidateFixture(),value=fixture.root;
  const html=read(value,'blog/hummus-guide/index.html'),index=read(value,'blog/index.html'),sitemap=read(value,'sitemap.xml'),meta=read(value,'config/content-articles.json');
  const failed=id=>assert.ok(auditBlog({root:value}).failures.some(item=>item.id===id),id);
  put(value,'blog/hummus-guide/index.html',html.replace('noindex,follow','index,follow'));
  failed('blog:hummus-guide:index.html:indexable');put(value,'blog/hummus-guide/index.html',html);
  put(value,'blog/hummus-guide/index.html',html.replace('"@type":"Article"','"@type":"Article","datePublished":"2026-10-13"'));
  failed('blog:hummus-guide:index.html:schema-dates');put(value,'blog/hummus-guide/index.html',html);
  put(value,'blog/index.html',index.replace('data-prepared="2026-10-13"','data-prepared="2026-10-13" data-published="2026-10-13"'));
  failed('blog:hummus-guide:index.html:schema-dates');put(value,'blog/index.html',index);
  put(value,'sitemap.xml',sitemap.replace('</urlset>','<url><loc>https://www.eaglish.store/blog/hummus-guide/</loc></url></urlset>'));
  failed('blog:hummus-guide:index.html:sitemap');put(value,'sitemap.xml',sitemap);
  put(value,'blog/index.html',index.replace('<span data-status>閱讀知識指南','<a data-buy href="https://example.com/buy">buy</a><span data-status>閱讀知識指南'));
  failed('blog:hummus-guide:index.html:knowledge-shelf');put(value,'blog/index.html',index);
  put(value,'config/content-articles.json',JSON.stringify({version:1,articles:{}}));
  failed('blog:hummus-guide:index.html:reviewed-identity');put(value,'config/content-articles.json',meta);
  assert.equal(auditBlog({root:value}).status,'candidate_ready');
});

test('knowledge stays on the journal shelf without campaigns; Wave keeps its existing live identity',()=>{
  const wave={'品牌':'Wave 鷹嘴豆泥','類型':'長期','開團日期':'','結束日期':'','連結':'https://example.com/wave'};
  assert.deepEqual(model.stateForArticle([wave],'hummus-guide','2026-10-13','explainer'),{shelf:'journal',label:'閱讀知識指南'});
  assert.equal(model.stateForArticle([wave],'wave','2026-10-13','explainer').url,wave['連結']);
  assert.equal(model.stateForArticle([],'unknown','2026-10-13').label,'團購狀態待確認');
  assert.equal(model.newestFirst('2026-10-13','2026-09-08')<0,true);
});

async function runtimeFixture(failNetwork){
  const status={textContent:''},card={dataset:{article:'hummus-guide',contentKind:'explainer',category:'食品',prepared:'2026-10-13'},hidden:false,querySelector:selector=>selector==='[data-status]'?status:null};
  const shelves=Object.fromEntries(['open','upcoming','journal'].map(key=>[key,{cards:key==='journal'?[card]:[],classList:{toggle(){}},closest:()=>({hidden:false}),
    querySelectorAll(){return this.cards;},append(item){for(const shelf of Object.values(shelves))shelf.cards=shelf.cards.filter(x=>x!==item);this.cards.push(item);}}]));
  const clickListeners=[],events={},empty={hidden:true};
  let refreshed,openCount=0;
  const document={hidden:false,readyState:'complete',querySelectorAll:selector=>selector==='[data-article]'?[card]:[],
    querySelector:selector=>selector.startsWith('[data-shelf=')?shelves[selector.match(/"([^"]+)"/)[1]]:empty,
    addEventListener(name,fn){if(name==='click')clickListeners.push(fn);}};
  const window={Papa:{},addEventListener(name,fn){events[name]=fn;},requestIdleCallback(fn){refreshed=fn();},open(){openCount++;return null;}};
  const sandbox={document,window,ProductContent,BlogIndexModel:model,Papa:{parse:()=>({errors:[],data:[['品牌','類型','開團日期','結束日期','連結'],['Wave 鷹嘴豆泥','長期','','','https://example.com/wave']]})},
    URL,URLSearchParams,AbortSignal,Date,location:{href:'https://www.eaglish.store/blog/',search:''},history:{pushState(){}},
    fetch:async()=>{if(failNetwork)throw Error('fixture network failure');return {ok:true,text:async()=>'fixture CSV'};},
    requestIdleCallback:fn=>window.requestIdleCallback(fn),setTimeout:fn=>fn(),setInterval(){}};
  vm.runInNewContext(fs.readFileSync(new URL('../blog/blog.js',import.meta.url),'utf8'),sandbox);
  await refreshed;
  const forged={closest:()=>card,textContent:'buy'},event={preventDefault(){},target:{closest:selector=>selector==='[data-buy]'?forged:null}};
  for(const listener of clickListeners)await listener(event);
  return {card,status,shelves,openCount};
}
test('actual list runtime handles an explainer with no buy node on network success and failure',async()=>{
  for(const failNetwork of [false,true]){
    const result=await runtimeFixture(failNetwork);
    assert.equal(result.card.dataset.state,'journal');assert.equal(result.status.textContent,'閱讀知識指南');
    assert.ok(result.shelves.journal.cards.includes(result.card));assert.equal(result.openCount,0);
  }
});

test('two-article hub fixture discovers knowledge metadata and gives Wave a reciprocal reading link',()=>{
  const value=temporaryRoot();
  put(value,'product-content.js',fs.readFileSync(new URL('../product-content.js',import.meta.url)));
  put(value,'config/content-articles.json',JSON.stringify({version:1,articles:{'hummus-guide':descriptor}}));
  put(value,'config/content-clusters.json',JSON.stringify({version:1,clusters:[{id:'table',title:'餐桌與送禮',question:'fixture question',answer:'fixture answer',articles:['wave-hummus']}]}));
  put(value,'blog/wave-hummus/index.html',read(legacyRoot,'blog/wave-hummus/index.html'));
  put(value,'blog/hummus-guide/index.html',candidateHtml());
  const manifest=buildContentHubs({root:pathToFileURL(value+'/')});
  const knowledge=manifest.articles.find(item=>item.slug==='hummus-guide');
  assert.equal(knowledge.productId,null);assert.equal(knowledge.cluster,'table');assert.equal(knowledge.title,descriptor.title);
  assert.equal(knowledge.publicationState,'not_published');assert.equal(knowledge.prepared,'2026-10-13');
  assert.equal('published' in knowledge,false);assert.equal('modified' in knowledge,false);
  assert.ok(read(value,'guides/index.html').includes('<h3>'+descriptor.title+'</h3>'));
  assert.ok(read(value,'guides/index.html').includes('閱讀知識指南'));
  assert.ok(read(value,'blog/wave-hummus/index.html').includes('href="/blog/hummus-guide/"'));
  assert.ok(read(value,'blog/hummus-guide/index.html').includes('href="/blog/wave-hummus/"'));
  assert.ok(!read(value,'blog/hummus-guide/index.html').includes('href="/#product-"'));
  assert.ok(read(value,'content-index.json').includes('"prepared": "2026-10-13"'));
  const waveBefore=read(value,'blog/wave-hummus/index.html');
  put(value,'blog/hummus-guide/index.html',candidateHtml().replace('"@type":"Article"','"@type":"Article","dateModified":"2026-10-13"'));
  assert.throws(()=>buildContentHubs({root:pathToFileURL(value+'/')}),/cannot claim/);
  assert.equal(read(value,'blog/wave-hummus/index.html'),waveBefore,'invalid knowledge dates cannot cause partial article writes');
});
