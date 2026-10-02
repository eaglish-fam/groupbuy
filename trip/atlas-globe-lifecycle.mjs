// One bounded lifecycle. Stale imports cannot paint; aborted mounts must clean up.
export function createGlobeLifecycle({loadModule,mount,getView,onState=()=>{},onError=()=>{},timeoutMs=16000}){
 let phase='idle',generation=0,attempt=0,active=null,controller=null,pending=null,disposed=false,suspended=false;
 const publish=(next,error=null)=>{phase=next;onState({phase,attempt,error});};
 function start(){
  if(disposed||suspended)return Promise.resolve(null);
  const ticket=++generation;
  active?.abort();controller?.destroy();controller=null;
  const abort=new AbortController();active=abort;attempt++;
  publish('loading');
  let timer;
  const deadline=new Promise((_,reject)=>{timer=setTimeout(()=>reject(Object.assign(new Error('Globe initialization deadline'),{stage:'timeout'})),timeoutMs);});
  let cancel;
  const cancelled=new Promise(resolve=>{cancel=()=>resolve(null);abort.signal.addEventListener('abort',cancel,{once:true});});
  const work=(async()=>{
   let module;
   try{module=await loadModule({attempt,signal:abort.signal});}catch(error){throw Object.assign(error,{stage:error.stage||'module'});}
   if(disposed||ticket!==generation||abort.signal.aborted)return null;
   const result=await mount(module,{signal:abort.signal,view:getView()});
   if(disposed||ticket!==generation||abort.signal.aborted){result?.destroy();return null;}
   // A region can change while geometry is loading; apply the latest state.
   try{result.setView(getView());}catch(error){result.destroy();throw Object.assign(error,{stage:'draw'});}
   return result;
  })();
  pending=Promise.race([work,deadline,cancelled]).then(result=>{
   if(ticket!==generation||disposed){result?.destroy();return null;}
   controller=result;if(result)publish('ready');return result;
  }).catch(error=>{
   if(ticket===generation&&!disposed){abort.abort();controller?.destroy();controller=null;publish('failed',error.stage||'mount');onError({stage:error.stage||'mount',attempt});}
   return null;
  }).finally(()=>{clearTimeout(timer);abort.signal.removeEventListener('abort',cancel);if(ticket===generation)pending=null;});
  return pending;
 }
 const ensure=()=>disposed||suspended?Promise.resolve(null):phase==='idle'?start():pending||Promise.resolve(controller);
 return {get phase(){return phase;},get attempt(){return attempt;},get controller(){return controller;},
  ensure,
  retry(){return phase==='loading'?pending:start();},
  // BFCache preserves this document. Keep a ready renderer (its visibility
  // handler stops animation), but invalidate interrupted imports/mounts.
  suspend(){if(disposed||suspended)return;suspended=true;generation++;active?.abort();active=null;pending=null;if(!controller)publish('idle');},
  resume(){if(disposed)return Promise.resolve(null);suspended=false;return ensure();},
  destroy(){disposed=true;generation++;active?.abort();controller?.destroy();controller=null;publish('disposed');}
 };
}

export function bindGlobePageLifecycle(lifecycle,target,onRestore=()=>{}){
 const detach=()=>{target.removeEventListener('pagehide',hide);target.removeEventListener('pageshow',show);};
 const hide=event=>{if(event.persisted)lifecycle.suspend();else{lifecycle.destroy();detach();}};
 const show=event=>{if(event.persisted)lifecycle.resume().then(onRestore);};
 target.addEventListener('pagehide',hide);target.addEventListener('pageshow',show);
 return detach;
}
