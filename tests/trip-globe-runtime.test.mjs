import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mountGlobe} from '../trip/globe-source.mjs';

const topology=JSON.parse(readFileSync(new URL('../trip/globe-land.json',import.meta.url),'utf8'));
const countries=[
 {id:'thailand',region:'asia',subregion:'southeast-asia',geography:{isoNumeric:'764',point:[100.5,15]}},
 {id:'new-zealand',region:'oceania',subregion:'australasia',geography:{isoNumeric:'554',point:[172.8,-43.2]}},
];

// Run the real d3 drawing and runtime against a minimal canvas platform. No network.
function environment(t){
 const replaced=['document','window','performance','requestAnimationFrame','cancelAnimationFrame','ResizeObserver','fetch'];
 const descriptors=new Map(replaced.map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
 t.after(()=>{for(const key of replaced){const descriptor=descriptors.get(key);if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}});
 const noop=()=>{};
 const state={frames:new Map(),frameId:0,time:0,draws:0,points:[],fetches:0,observerDisconnected:false};
 let lastArc=null;
 const context={setTransform:noop,clearRect(){state.draws++;state.points=[];},fillRect:noop,save:noop,restore:noop,beginPath(){lastArc=null;},moveTo:noop,lineTo:noop,ellipse:noop,arc(x,y,r){lastArc={x,y,r};},closePath:noop,fill(){if(lastArc&&['#774735','#95755b'].includes(this.fillStyle))state.points.push({...lastArc,selected:this.fillStyle==='#774735'});},stroke:noop,clip:noop,createRadialGradient:()=>({addColorStop:noop})};
 const handlers={};
 const canvas={style:{},setAttribute:noop,getContext:()=>context,addEventListener:(name,fn)=>handlers[name]=fn,removeEventListener:name=>delete handlers[name],remove(){this.removed=true;},setPointerCapture:noop,hasPointerCapture:()=>false};
 const motion={matches:false,addEventListener:(name,fn)=>motion.change=fn,removeEventListener:()=>delete motion.change};
 const docHandlers={};
 const document={hidden:false,createElement:()=>canvas,addEventListener:(name,fn)=>docHandlers[name]=fn,removeEventListener:name=>delete docHandlers[name]};
 const window={devicePixelRatio:3,matchMedia:()=>motion,addEventListener:noop,removeEventListener:noop};
 const fakePerformance={now:()=>state.time};
 const globals={document,window,performance:fakePerformance,requestAnimationFrame:fn=>{const id=++state.frameId;state.frames.set(id,fn);return id;},cancelAnimationFrame:id=>state.frames.delete(id),ResizeObserver:class{observe(){}disconnect(){state.observerDisconnected=true;}},fetch:async()=>{state.fetches++;return {ok:true,json:async()=>topology};}};
 for(const [key,value] of Object.entries(globals))Object.defineProperty(globalThis,key,{value,writable:true,configurable:true});
 const fallback={hidden:false,style:{display:''}};
 const classes=new Set();
 const host={clientWidth:400,dataset:{},querySelector:()=>fallback,appendChild:node=>host.canvas=node,classList:{add:value=>classes.add(value),remove:value=>classes.delete(value)}};
 const flush=at=>{state.time=at;const callbacks=[...state.frames.values()];state.frames.clear();callbacks.forEach(callback=>callback(at));};
 const mount=options=>mountGlobe(host,{countries,region:{id:'asia',center:[110,25]},selectedCountry:'thailand',...options});
 return {state,canvas,handlers,document,docHandlers,motion,fallback,host,classes,flush,mount};
}

test('globe keeps static fallback until geography succeeds and caps canvas DPR',async t=>{
 const env=environment(t);
 let release;
 globalThis.fetch=()=>new Promise(resolve=>release=resolve);
 const pending=env.mount();
 assert.equal(env.fallback.hidden,false);
 assert.equal(env.host.canvas,undefined);
 release({ok:true,json:async()=>topology});
 const globe=await pending;
 assert.equal(env.fallback.hidden,true);
 assert.equal(env.canvas.width,600);
 assert.equal(env.canvas.height,413);
 assert.equal(env.state.draws,1);
 assert.equal(env.state.frames.size,0);
 globe.destroy();
});

test('globe transition stops and newest selection replaces an in-flight transition',async t=>{
 const env=environment(t);
 const globe=await env.mount();
 globe.setView({center:[-160,30],countryId:'new-zealand',regionId:'oceania'});
 assert.equal(env.classes.has('is-travelling'),true);
 env.flush(100);
 assert.equal(env.state.frames.size,1);
 // New target wins before the old transition reaches its endpoint.
 globe.setView({center:[100.5,15],countryId:'thailand',regionId:'southeast-asia'});
 assert.equal(env.state.frames.size,1);
 env.flush(450);
 assert.equal(env.state.frames.size,0);
 assert.equal(env.classes.size,0);
 const selected=env.state.points.find(point=>point.selected);
 assert.ok(selected,'selected subregion country remains visible');
 assert.ok(Math.abs(selected.x-200)<.01,'newest selected country is at the projection center');
 assert.equal(env.state.points.length,1,'other-region points are excluded');
 const count=env.state.draws;
 env.flush(1000);
 assert.equal(env.state.draws,count,'no idle animation loop');
 globe.destroy();
});

test('reduced motion, page hiding and destroy cancel transition work',async t=>{
 const env=environment(t);
 const globe=await env.mount();
 globe.setView({center:[-30,40]});
 env.document.hidden=true;env.docHandlers.visibilitychange();
 assert.equal(env.state.frames.size,0);
 assert.equal(env.classes.size,0);
 env.document.hidden=false;env.motion.matches=true;
 globe.setView({center:[100.5,15]});
 assert.equal(env.classes.size,0);
 env.flush(500);
 assert.equal(env.state.frames.size,0);
 env.motion.matches=false;globe.setView({center:[80,10]});
 assert.equal(env.state.frames.size,1);
 env.motion.matches=true;env.motion.change();
 assert.equal(env.classes.size,0);
 env.flush(600);
 assert.equal(env.state.frames.size,0);
 env.motion.matches=false;globe.setView({center:[-50,30]});
 globe.destroy();
 assert.equal(env.state.frames.size,0);
 assert.equal(env.classes.size,0);
 assert.equal(env.fallback.hidden,false);
 assert.equal(env.fallback.style.display,'');
 assert.equal(env.canvas.removed,true);
 assert.equal(env.state.observerDisconnected,true);
 assert.equal(env.docHandlers.visibilitychange,undefined);
 assert.equal(env.handlers.keydown,undefined);
});

test('failed geography leaves fallback intact and a later retry can mount',async t=>{
 const env=environment(t);
 globalThis.fetch=async()=>{throw new Error('offline');};
 await assert.rejects(env.mount(),/offline/);
 assert.equal(env.fallback.hidden,false);
 assert.equal(env.host.canvas,undefined);
 globalThis.fetch=async()=>({ok:true,json:async()=>topology});
 const globe=await env.mount();
 assert.equal(env.fallback.hidden,true);
 globe.destroy();
 env.canvas.getContext=()=>null;
 let requested=false;globalThis.fetch=async()=>{requested=true;};
 await assert.rejects(env.mount(),/Canvas is unavailable/);
 assert.equal(requested,false);
 assert.equal(env.fallback.hidden,false);
});

test('keyboard rotates on demand, rear points disappear, vertical touch keeps scrolling',async t=>{
 const env=environment(t);
 const globe=await env.mount({region:{id:'asia',center:[100.5,15]}});
 const before=env.state.points.find(point=>point.selected).x;
 let prevented=false;
 env.handlers.keydown({key:'ArrowRight',preventDefault(){prevented=true;}});
 env.flush(20);
 assert.equal(prevented,true);
 assert.notEqual(env.state.points.find(point=>point.selected).x,before);
 assert.equal(env.state.frames.size,0);
 env.handlers.pointerdown({isPrimary:true,button:0,pointerType:'touch',pointerId:1,clientX:100,clientY:100});
 let touchPrevented=false;
 env.handlers.pointermove({pointerId:1,clientX:103,clientY:140,cancelable:true,preventDefault(){touchPrevented=true;}});
 assert.equal(touchPrevented,false);
 assert.equal(env.state.frames.size,0);
 env.handlers.pointercancel({pointerId:1});
 env.motion.matches=true;globe.setView({center:[-79.5,-15]});env.flush(30);
 assert.equal(env.state.points.length,0,'backside destination point is not drawn');
 globe.destroy();
});
