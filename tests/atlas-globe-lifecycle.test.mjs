import test from 'node:test';
import assert from 'node:assert/strict';
import {createGlobeLifecycle,bindGlobePageLifecycle} from '../trip/atlas-globe-lifecycle.mjs';

const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};
const drain=()=>new Promise(resolve=>setImmediate(resolve));
const transition=(target,name,persisted)=>{const event=new Event(name);Object.defineProperty(event,'persisted',{value:persisted});target.dispatchEvent(event);};
function fixture(options={}){
 let view={county:'taiwan'},mounts=0;
 const controllers=[],states=[],errors=[];
 const mount=async()=>{const controller={views:[],destroyed:0,setView(v){this.views.push(v);},destroy(){this.destroyed++;}};controllers.push(controller);mounts++;return controller;};
 const lifecycle=createGlobeLifecycle({loadModule:async()=>({}),mount,getView:()=>view,onState:s=>states.push(s),onError:e=>errors.push(e),...options});
 const target=new EventTarget(),restored=[];
 bindGlobePageLifecycle(lifecycle,target,()=>{restored.push(lifecycle.controller);lifecycle.controller?.setView(view);});
 return {lifecycle,target,controllers,states,errors,restored,get mounts(){return mounts;},select(v){view=v;}};
}

test('repeated persisted history returns retain the ready globe and apply latest selection',async()=>{
 const f=fixture(),original=await f.lifecycle.ensure();
 for(const county of ['taoyuan','world','taiwan']){
  transition(f.target,'pagehide',true);
  assert.equal(f.lifecycle.phase,'ready');assert.equal(original.destroyed,0);
  f.select({county});transition(f.target,'pageshow',true);await drain();
  assert.equal(f.lifecycle.controller,original);assert.equal(f.lifecycle.phase,'ready');
  assert.deepEqual(original.views.at(-1),{county});
 }
 assert.equal(f.mounts,1);assert.equal(f.restored.length,3);
 transition(f.target,'pagehide',false);assert.equal(original.destroyed,1);assert.equal(f.lifecycle.phase,'disposed');
 transition(f.target,'pageshow',true);await drain();assert.equal(f.restored.length,3);
 assert.equal(await f.lifecycle.resume(),null);assert.equal(await f.lifecycle.retry(),null);
});

test('pending import is cancelled promptly; cached-page return starts once with current view',async()=>{
 const old=deferred();let calls=0,oldSignal;
 const f=fixture({loadModule:({signal})=>{calls++;if(calls===1){oldSignal=signal;return old.promise;}return Promise.resolve({});}});
 const pending=f.lifecycle.ensure();assert.equal(f.lifecycle.phase,'loading');
 transition(f.target,'pagehide',true);assert.equal(oldSignal.aborted,true);
 assert.equal(await pending,null);assert.equal(f.lifecycle.phase,'idle');
 assert.equal(await f.lifecycle.ensure(),null);assert.equal(calls,1);
 f.select({county:'taoyuan'});transition(f.target,'pageshow',true);await drain();
 const current=f.lifecycle.controller;assert.ok(current);assert.equal(calls,2);assert.equal(f.mounts,1);
 assert.deepEqual(current.views.at(-1),{county:'taoyuan'});
 old.resolve({});await drain();assert.equal(f.mounts,1);assert.equal(f.lifecycle.controller,current);assert.equal(f.lifecycle.phase,'ready');
 f.lifecycle.destroy();
});

test('stale asynchronous mount after restore is disposed without replacing the new renderer',async()=>{
 const old=deferred();let mounts=0,oldSignal;const stale={destroyed:0,destroy(){this.destroyed++;},setView(){assert.fail('stale mount must not receive view');}};
 const live={destroyed:0,views:[],destroy(){this.destroyed++;},setView(v){this.views.push(v);}};
 const f=fixture({mount:(_module,{signal})=>{if(++mounts===1){oldSignal=signal;return old.promise;}return Promise.resolve(live);}});
 const pending=f.lifecycle.ensure();await drain();transition(f.target,'pagehide',true);assert.equal(oldSignal.aborted,true);assert.equal(await pending,null);
 f.select({county:'offshore'});transition(f.target,'pageshow',true);await drain();assert.equal(f.lifecycle.controller,live);
 old.resolve(stale);await drain();assert.equal(stale.destroyed,1);assert.equal(live.destroyed,0);assert.equal(f.lifecycle.controller,live);assert.deepEqual(live.views.at(-1),{county:'offshore'});
 f.lifecycle.destroy();
});

test('non-persisted teardown cancels pending work and cannot mount on a later pageshow',async()=>{
 const old=deferred();let signal;
 const f=fixture({loadModule:o=>{signal=o.signal;return old.promise;}}),pending=f.lifecycle.ensure();
 transition(f.target,'pagehide',false);assert.equal(signal.aborted,true);assert.equal(await pending,null);assert.equal(f.lifecycle.phase,'disposed');
 old.resolve({});transition(f.target,'pageshow',true);await drain();assert.equal(f.mounts,0);assert.equal(f.restored.length,0);
});

test('failed and timed-out loads preserve explicit retry and can recover after history return',async()=>{
 let attempts=0;const f=fixture({loadModule:async()=>{if(++attempts===1)throw Object.assign(Error('offline'),{stage:'data_http'});return {};}});
 assert.equal(await f.lifecycle.ensure(),null);assert.equal(f.lifecycle.phase,'failed');assert.equal(f.errors[0].stage,'data_http');
 assert.ok(await f.lifecycle.retry());assert.equal(f.lifecycle.phase,'ready');f.lifecycle.destroy();
 const slow=deferred(),g=fixture({timeoutMs:5,loadModule:({attempt})=>attempt===1?slow.promise:Promise.resolve({})});
 assert.equal(await g.lifecycle.ensure(),null);assert.equal(g.lifecycle.phase,'failed');assert.equal(g.errors[0].stage,'timeout');
 transition(g.target,'pagehide',true);transition(g.target,'pageshow',true);await drain();assert.equal(g.lifecycle.phase,'ready');
 slow.resolve({});await drain();assert.equal(g.mounts,1);g.lifecycle.destroy();
});
