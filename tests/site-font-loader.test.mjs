import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../site-font-loader.js',import.meta.url),'utf8');
function fixture(entry,{failure=false,cacheMode='none'}={}){
 const handlers={},frames=[],idle=[],requests=[],added=[],stored=[],opened=[],legacyMatches=[];
 let release;
 const cached={ok:true,arrayBuffer:async()=>new ArrayBuffer(8),clone(){return this;}};
 const response=new Promise((resolve,reject)=>{release=()=>failure?reject(Error('Injected offline')):resolve(cached);});
 const window={addEventListener:(name,fn)=>{handlers[name]=fn;},requestIdleCallback:()=>{}};
 const document={currentScript:{dataset:{fontEntry:String(entry)}},fonts:{add:face=>added.push(face.family)},addEventListener:(name,fn)=>{handlers[name]=fn;},dispatchEvent:()=>{}};
 class FontFace{constructor(family){this.family=family;}load(){return Promise.resolve(this);}}
 const caches=cacheMode==='none'?undefined:{match:async(url,options)=>{legacyMatches.push({url,options});return cacheMode.startsWith('legacy')?cached:undefined;},open:async(name)=>{opened.push(name);if(cacheMode==='denied')throw Error('Storage denied');return {match:async()=>cacheMode==='hit'?cached:undefined,put:async(url)=>{if(['quota','legacy-quota'].includes(cacheMode))throw Error('Quota');stored.push(url);},delete:async()=>{}};}};
 vm.runInNewContext(source,{window,document,FontFace,caches,CustomEvent:class{},fetch:(url,options)=>{requests.push({url,options});return response;},requestAnimationFrame:fn=>frames.push(fn),requestIdleCallback:fn=>idle.push(fn),setTimeout:fn=>idle.push(fn)});
 return {window,handlers,requests,added,stored,opened,legacyMatches,release,paint(){while(frames.length)frames.shift()();while(idle.length)idle.shift()();}};
}
const tick=()=>new Promise(resolve=>setImmediate(resolve));
test('entry has zero initial requests; one trusted view change unlocks one complete font',async()=>{
 const f=fixture(true);f.paint();assert.equal(f.requests.length,0);
 f.handlers.click({isTrusted:false,target:{closest:()=>true}});f.paint();assert.equal(f.requests.length,0);
 f.handlers.click({isTrusted:true,target:{closest:()=>true}});f.paint();await tick();assert.equal(f.requests.length,1);assert.equal(f.added.length,0);
 f.release();await tick();assert.equal(f.window.EaglishSiteFont.status,'ready');
 assert.deepEqual(f.added,['Eaglish Heading Serif','Eaglish Travel Heading Serif']);
 f.handlers.hashchange();f.paint();assert.equal(f.requests.length,1);
});
test('non-entry paints fallback before one low-priority cacheable request',async()=>{
 const f=fixture(false);assert.equal(f.requests.length,0);assert.equal(f.added.length,0);
 f.paint();await tick();assert.equal(f.requests.length,1);assert.equal(f.added.length,0);
 assert.equal(f.requests[0].options.cache,'force-cache');assert.equal(f.requests[0].options.priority,'low');
 f.release();await tick();assert.equal(f.window.EaglishSiteFont.status,'ready');assert.equal(f.added.length,2);
});
test('font failure leaves fallback intact without retry',async()=>{
 const f=fixture(false,{failure:true});f.paint();await tick();f.release();await tick();
 assert.equal(f.window.EaglishSiteFont.status,'error');assert.equal(f.added.length,0);assert.equal(f.requests.length,1);
});
test('legacy font migrates using named read-only match, with no network or legacy open',async()=>{
 for(const entry of [true,false]){const f=fixture(entry,{cacheMode:'legacy'});f.paint();await tick();
 assert.equal(f.window.EaglishSiteFont.status,'ready');assert.equal(f.window.EaglishSiteFont.migrated,true);
 assert.equal(f.requests.length,0);assert.equal(f.added.length,2);assert.equal(f.stored.length,1);
 assert.deepEqual(f.opened,['heading-serif-complete-500-v1']);
 assert.equal(f.legacyMatches[0].options.cacheName,'eaglish-complete-heading-font-v1');}
});
test('cold entry never creates a missing legacy cache or fetches',async()=>{
 const f=fixture(true,{cacheMode:'miss'});f.paint();await tick();
 assert.equal(f.window.EaglishSiteFont.status,'deferred');assert.equal(f.requests.length,0);
 assert.deepEqual(f.opened,['heading-serif-complete-500-v1']);assert.equal(f.stored.length,0);
});
test('migration quota refusal still decodes legacy bytes without fetching',async()=>{
 const f=fixture(true,{cacheMode:'legacy-quota'});f.paint();await tick();
 assert.equal(f.window.EaglishSiteFont.status,'ready');assert.equal(f.window.EaglishSiteFont.cacheIssue.stage,'migrate');
 assert.equal(f.requests.length,0);assert.equal(f.added.length,2);
});
test('actual existing worker activation deletes old eaglish cache but preserves new font namespace',async()=>{
 const worker=readFileSync(new URL('../sw.js',import.meta.url),'utf8'),handlers={},deleted=[];
 const names=['eaglish-complete-heading-font-v1','eaglish-old-version','heading-serif-complete-500-v1','eaglish-living-edit-20260911-video-poster'];
 vm.runInNewContext(worker,{self:{addEventListener:(name,fn)=>{handlers[name]=fn;},clients:{claim:async()=>{}},location:{origin:'https://fixture.invalid'}},caches:{keys:async()=>names,delete:async name=>{deleted.push(name);}}});
 let completion;handlers.activate({waitUntil:promise=>{completion=promise;}});await completion;
 assert.deepEqual(deleted,['eaglish-complete-heading-font-v1','eaglish-old-version']);
});
test('secure cache hit loads both faces with zero network requests',async()=>{
 const f=fixture(false,{cacheMode:'hit'});f.paint();await tick();
 assert.equal(f.window.EaglishSiteFont.status,'ready');assert.equal(f.window.EaglishSiteFont.cache,'storage');assert.equal(f.requests.length,0);assert.equal(f.added.length,2);
});
test('warm entry decodes cached bytes after paint without fetching',async()=>{
 const f=fixture(true,{cacheMode:'hit'});f.paint();await tick();
 assert.equal(f.window.EaglishSiteFont.status,'ready');assert.equal(f.added.length,2);assert.equal(f.requests.length,0);
});
test('storage refusal or quota does not block successful font decoding',async()=>{
 for(const cacheMode of ['denied','quota']){const f=fixture(false,{cacheMode});f.paint();await tick();assert.equal(f.requests.length,1);f.release();await tick();assert.equal(f.window.EaglishSiteFont.status,'ready');assert.equal(f.added.length,2);}
});
