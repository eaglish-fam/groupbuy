import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../site-font-loader.js',import.meta.url),'utf8');
const version=source.match(/const fontVersion = '([^']+)';/)[1],dir=`/assets/fonts/${version}/`;
function fixture(entry,{failure=false,cacheMode='none'}={}){
 const handlers={},frames=[],idle=[],requests=[],added=[],stored=[],opened=[],legacyMatches=[];
 let release;
 const cached={ok:true,arrayBuffer:async()=>new ArrayBuffer(8),json:async()=>manifest,clone(){return this;}};
 const response=new Promise((resolve,reject)=>{release=()=>failure?reject(Error('Injected offline')):resolve(cached);});
 const window={addEventListener:(name,fn)=>{handlers[name]=fn;},requestIdleCallback:()=>{}};
 const document={currentScript:{dataset:{fontEntry:String(entry)}},fonts:{add:face=>added.push(face.family)},addEventListener:(name,fn)=>{handlers[name]=fn;},dispatchEvent:()=>{}};
 class FontFace{constructor(family){this.family=family;}load(){return Promise.resolve(this);}}
 const caches=cacheMode==='none'?undefined:{match:async(url,options)=>{legacyMatches.push({url,options});return cacheMode.startsWith('legacy')?cached:undefined;},open:async(name)=>{opened.push(name);if(cacheMode==='denied')throw Error('Storage denied');return {match:async(url)=>cacheMode==='hit'||(cacheMode==='site-only'&&url.endsWith('site.woff2'))?cached:undefined,put:async(url)=>{if(['quota','legacy-quota'].includes(cacheMode))throw Error('Quota');stored.push(url);},delete:async()=>{}};}};
 vm.runInNewContext(source,{window,document,FontFace,caches,CustomEvent:class{},fetch:(url,options)=>{requests.push({url,options});return url.endsWith('manifest.json')?Promise.resolve({ok:true,json:async()=>manifest,clone(){return this;}}):response;},requestAnimationFrame:fn=>frames.push(fn),requestIdleCallback:fn=>idle.push(fn),setTimeout:fn=>idle.push(fn)});
 return {window,handlers,requests,added,stored,opened,legacyMatches,release,paint(){while(frames.length)frames.shift()();while(idle.length)idle.shift()();}};
}
const manifest={site:{unicodeRange:'U+20-7e,U+4e00'},slices:[{file:'slice-00.woff2',unicodeRange:'U+4e01'},{file:'slice-01.woff2',unicodeRange:'U+4e02'}]};
const tick=()=>new Promise(resolve=>setImmediate(resolve));
test('entry has zero initial requests; one trusted view change unlocks the site face and its slices',async()=>{
 const f=fixture(true);f.paint();assert.equal(f.requests.length,0);
 f.handlers.click({isTrusted:false,target:{closest:()=>true}});f.paint();assert.equal(f.requests.length,0);
 f.handlers.click({isTrusted:true,target:{closest:()=>true}});f.paint();await tick();assert.equal(f.requests.length,2);assert.equal(f.added.length,0);
 f.release();await tick();await tick();assert.equal(f.window.EaglishSiteFont.status,'ready');
 // Two requests in all: the site face and its small manifest; slices are registered, not fetched.
 assert.deepEqual(f.requests.map(r=>r.url),[dir+'site.woff2',dir+'manifest.json']);
 assert.deepEqual(f.added,['Eaglish Heading Serif','Eaglish Travel Heading Serif','Eaglish Heading Serif','Eaglish Heading Serif','Eaglish Travel Heading Serif','Eaglish Travel Heading Serif']);
 assert.equal(f.window.EaglishSiteFont.slices,2);
 f.handlers.hashchange();f.paint();assert.equal(f.requests.length,2);
});
test('non-entry paints fallback before low-priority cacheable requests',async()=>{
 const f=fixture(false);assert.equal(f.requests.length,0);assert.equal(f.added.length,0);
 f.paint();await tick();assert.equal(f.requests.length,2);assert.equal(f.added.length,0);
 assert.equal(f.requests[0].options.cache,'force-cache');assert.equal(f.requests[0].options.priority,'low');
 f.release();await tick();await tick();assert.equal(f.window.EaglishSiteFont.status,'ready');assert.equal(f.added.length,6);
 assert.ok(f.requests.every(r=>r.options.cache==='force-cache'&&r.options.priority==='low'));
});
test('font failure leaves fallback intact without retry',async()=>{
 const f=fixture(false,{failure:true});f.paint();await tick();f.release();await tick();
 assert.equal(f.window.EaglishSiteFont.status,'error');assert.equal(f.added.length,0);assert.equal(f.requests.length,2);
});
test('a stored complete v1 font is reused through named read-only matches, with no network',async()=>{
 for(const entry of [true,false]){const f=fixture(entry,{cacheMode:'legacy'});f.paint();await tick();
 assert.equal(f.window.EaglishSiteFont.status,'ready');assert.equal(f.window.EaglishSiteFont.cache,'complete-storage');
 // The complete font is a superset: one face per family, no manifest, no slices, nothing stored.
 assert.equal(f.requests.length,0);assert.equal(f.added.length,2);assert.equal(f.stored.length,0);
 assert.deepEqual(f.opened,[version]);
 assert.equal(f.legacyMatches[0].options.cacheName,'heading-serif-complete-500-v1');}
});
test('cold entry never creates a missing legacy cache or fetches',async()=>{
 const f=fixture(true,{cacheMode:'miss'});f.paint();await tick();
 assert.equal(f.window.EaglishSiteFont.status,'deferred');assert.equal(f.requests.length,0);
 assert.deepEqual(f.opened,[version]);assert.equal(f.stored.length,0);
});
test('quota refusal still decodes stored complete bytes without fetching',async()=>{
 const f=fixture(true,{cacheMode:'legacy-quota'});f.paint();await tick();
 assert.equal(f.window.EaglishSiteFont.status,'ready');
 assert.equal(f.requests.length,0);assert.equal(f.added.length,2);
});
test('actual existing worker activation deletes old eaglish cache but preserves new font namespace',async()=>{
 const worker=readFileSync(new URL('../sw.js',import.meta.url),'utf8'),handlers={},deleted=[];
 const names=['eaglish-complete-heading-font-v1','eaglish-old-version','heading-serif-complete-500-v1',version,'eaglish-living-edit-20260911-video-poster'];
 vm.runInNewContext(worker,{self:{addEventListener:(name,fn)=>{handlers[name]=fn;},clients:{claim:async()=>{}},location:{origin:'https://fixture.invalid'}},caches:{keys:async()=>names,delete:async name=>{deleted.push(name);}}});
 let completion;handlers.activate({waitUntil:promise=>{completion=promise;}});await completion;
 assert.deepEqual(deleted,['eaglish-complete-heading-font-v1','eaglish-old-version']);
});
test('secure cache hit loads both faces with zero network requests',async()=>{
 const f=fixture(false,{cacheMode:'hit'});f.paint();await tick();
 assert.equal(f.window.EaglishSiteFont.status,'ready');assert.equal(f.window.EaglishSiteFont.cache,'storage');assert.equal(f.requests.length,0);assert.equal(f.added.length,6);
});
test('warm entry decodes cached bytes after paint without fetching',async()=>{
 const f=fixture(true,{cacheMode:'hit'});f.paint();await tick();
 assert.equal(f.window.EaglishSiteFont.status,'ready');assert.equal(f.added.length,6);assert.equal(f.requests.length,0);
});
test('storage refusal or quota does not block successful font decoding',async()=>{
 for(const cacheMode of ['denied','quota']){const f=fixture(false,{cacheMode});f.paint();await tick();assert.equal(f.requests.length,2);f.release();await tick();await tick();assert.equal(f.window.EaglishSiteFont.status,'ready');assert.equal(f.added.length,6);}
});
test('a stored site face without its manifest is a cache miss and fetches both',async()=>{
 const f=fixture(false,{cacheMode:'site-only'});f.paint();await tick();
 assert.deepEqual(f.requests.map(r=>r.url),[dir+'site.woff2',dir+'manifest.json']);
 f.release();await tick();await tick();assert.equal(f.window.EaglishSiteFont.status,'ready');assert.equal(f.added.length,6);
});
