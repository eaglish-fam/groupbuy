import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../site-font-loader.js',import.meta.url),'utf8');
function fixture(entry,{failure=false,cacheMode='none'}={}){
 const handlers={},frames=[],idle=[],requests=[],added=[],stored=[];
 let release;
 const cached={ok:true,arrayBuffer:async()=>new ArrayBuffer(8),clone(){return this;}};
 const response=new Promise((resolve,reject)=>{release=()=>failure?reject(Error('Injected offline')):resolve(cached);});
 const window={addEventListener:(name,fn)=>{handlers[name]=fn;},requestIdleCallback:()=>{}};
 const document={currentScript:{dataset:{fontEntry:String(entry)}},fonts:{add:face=>added.push(face.family)},addEventListener:(name,fn)=>{handlers[name]=fn;},dispatchEvent:()=>{}};
 class FontFace{constructor(family){this.family=family;}load(){return Promise.resolve(this);}}
 const caches=cacheMode==='none'?undefined:{open:async()=>{if(cacheMode==='denied')throw Error('Storage denied');return {match:async()=>cacheMode==='hit'?cached:undefined,put:async(url)=>{if(cacheMode==='quota')throw Error('Quota');stored.push(url);},delete:async()=>{}};}};
 vm.runInNewContext(source,{window,document,FontFace,caches,CustomEvent:class{},fetch:(url,options)=>{requests.push({url,options});return response;},requestAnimationFrame:fn=>frames.push(fn),requestIdleCallback:fn=>idle.push(fn),setTimeout:fn=>idle.push(fn)});
 return {window,handlers,requests,added,stored,release,paint(){while(frames.length)frames.shift()();while(idle.length)idle.shift()();}};
}
const tick=()=>new Promise(resolve=>setImmediate(resolve));
test('entry has zero initial requests; one trusted view change unlocks one complete font',async()=>{
 const f=fixture(true);f.paint();assert.equal(f.requests.length,0);
 f.handlers.click({isTrusted:false,target:{closest:()=>true}});f.paint();assert.equal(f.requests.length,0);
 f.handlers.click({isTrusted:true,target:{closest:()=>true}});f.paint();assert.equal(f.requests.length,1);assert.equal(f.added.length,0);
 f.release();await tick();assert.equal(f.window.EaglishSiteFont.status,'ready');
 assert.deepEqual(f.added,['Eaglish Heading Serif','Eaglish Travel Heading Serif']);
 f.handlers.hashchange();f.paint();assert.equal(f.requests.length,1);
});
test('non-entry paints fallback before one low-priority cacheable request',async()=>{
 const f=fixture(false);assert.equal(f.requests.length,0);assert.equal(f.added.length,0);
 f.paint();assert.equal(f.requests.length,1);assert.equal(f.added.length,0);
 assert.equal(f.requests[0].options.cache,'force-cache');assert.equal(f.requests[0].options.priority,'low');
 f.release();await tick();assert.equal(f.window.EaglishSiteFont.status,'ready');assert.equal(f.added.length,2);
});
test('font failure leaves fallback intact without retry',async()=>{
 const f=fixture(false,{failure:true});f.paint();f.release();await tick();
 assert.equal(f.window.EaglishSiteFont.status,'error');assert.equal(f.added.length,0);assert.equal(f.requests.length,1);
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
