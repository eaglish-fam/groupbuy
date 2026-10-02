// One bounded lifecycle. Stale imports cannot paint; aborted mounts must clean up.
export function createGlobeLifecycle({loadModule,mount,getView,onState=()=>{},onError=()=>{},timeoutMs=16000}){
 let phase='idle',generation=0,attempt=0,active=null,controller=null,pending=null,disposed=false;
 const publish=(next,error=null)=>{phase=next;onState({phase,attempt,error});};
 function start(){
  if(disposed)return Promise.resolve(null);
  const ticket=++generation;
  active?.abort();controller?.destroy();controller=null;
  const abort=new AbortController();active=abort;attempt++;
  publish('loading');
  let timer;
  const deadline=new Promise((_,reject)=>{timer=setTimeout(()=>{abort.abort();reject(Object.assign(new Error('Globe initialization deadline'),{stage:'timeout'}));},timeoutMs);});
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
  pending=Promise.race([work,deadline]).then(result=>{
   if(ticket!==generation||disposed){result?.destroy();return null;}
   controller=result;if(result)publish('ready');return result;
  }).catch(error=>{
   if(ticket===generation&&!disposed){abort.abort();controller?.destroy();controller=null;publish('failed',error.stage||'mount');onError({stage:error.stage||'mount',attempt});}
   return null;
  }).finally(()=>{clearTimeout(timer);if(ticket===generation)pending=null;});
  return pending;
 }
 return {get phase(){return phase;},get attempt(){return attempt;},get controller(){return controller;},
  ensure(){return phase==='idle'?start():pending||Promise.resolve(controller);},
  retry(){return phase==='loading'?pending:start();},
  destroy(){disposed=true;generation++;active?.abort();controller?.destroy();controller=null;publish('disposed');}
 };
}
