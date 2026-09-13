import { randomUUID } from 'node:crypto';
import { normalizeQuery } from './query.mjs';
import { normalizeQuote } from './radar-model.mjs';
import { normalizeLiveResponse } from './normalize.mjs';

// A selected live search may create a session and poll several times. Count
// transports, not sessions, against the same budget as background discovery.
export async function verifyQuote({store,quote,providerName,createProvider,config,fetchImpl=globalThis.fetch,now=()=>new Date().toISOString()}) {
  const started=now(), owner=randomUUID();
  if(!quote||quote.expiresAt<=started)throw new Error('Select an unexpired candidate');
  if(!['duffel','skyscanner'].includes(providerName))throw new Error('Select a live verification provider');
  if(store.get('paused',false))throw new Error('Collection is paused');
  if(!store.acquire(owner,started))throw new Error('A collector is already running');
  let run,requests=0,inserted=0;
  try {
    const day=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(started));
    const dayStart=new Date(day+'T00:00:00+08:00').toISOString();
    run=store.begin(providerName,started);
    const fetchCounted=async (...args)=>{
      if(requests>=config.runRequestLimit||store.attemptsSince(dayStart)>=config.dailyRequestLimit||Date.parse(now())-Date.parse(started)>=config.maxRuntimeSeconds*1000)throw new Error('Verification budget exhausted');
      requests++;
      const id=store.attempt(run,'verification:'+quote.id,now(),'started');
      try {
        const response=await fetchImpl(...args);
        store.db.prepare('UPDATE radar_attempts SET status=?,error_code=? WHERE id=?').run(response.ok?'ok':'failed',response.ok?null:'provider_http_'+response.status,id);
        return response;
      }catch(error){
        store.db.prepare('UPDATE radar_attempts SET status=?,error_code=? WHERE id=?').run('failed','transport_error',id);
        throw new Error('Verification transport failed');
      }
    };
    const provider=createProvider(fetchCounted);
    const query=normalizeQuery({origin:quote.origin,destination:quote.destination,outbound:quote.outboundDate,inbound:quote.inboundDate,adults:quote.adults,currency:quote.currency});
    const raw=await provider.searchLive(query,{userInitiated:true});
    const observedAt=now(), observations=providerName==='duffel'?provider.normalizeLive(raw,query,observedAt):normalizeLiveResponse(raw,query,observedAt);
    const normalized=observations.map(r=>normalizeQuote(r,query,observedAt,{purpose:'verification'})).filter(Boolean);
    inserted=store.insert(normalized,run,'verification');
    store.finish(run,now(),'succeeded',requests,inserted);
    return {quoteId:quote.id,provider:providerName,observedAt,requests,offers:normalized,reviewStatus:'pending',message:'Compare taxes, baggage and operating flights before approval.'};
  }catch(error){
    if(run)store.finish(run,now(),'failed',requests,inserted);
    throw new Error('Live verification failed; inspect configuration and request budget');
  }finally{store.release(owner);}
}
