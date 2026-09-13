import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { normalizeQuote } from './radar-model.mjs';
import { seedPanel, validateConfig } from './radar-plan.mjs';

function taiwanDayStart(iso) { const day=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(iso));return new Date(day+'T00:00:00+08:00').toISOString(); }
export async function collect({store,provider,config,now=()=>new Date().toISOString(),sleep=delay}) {
  validateConfig(config);
  if(!['travelpayouts','skyscanner','serpapi'].includes(provider.id))throw new Error('Provider not qualified for discovery');
  const started=now(), owner=randomUUID();
  if(store.get('paused',false))return {status:'paused',requests:0,inserted:0};
  if(!store.acquire(owner,started))return {status:'already_running',requests:0,inserted:0};
  let runId,requests=0,inserted=0,successes=0,failed=0;
  try {
    // A killed process is recorded separately rather than counted as successful.
    store.db.prepare("UPDATE radar_runs SET status='interrupted',finished_at=? WHERE status='running'").run(started);
    seedPanel(store,config,provider.id,started);
    const remaining=Math.max(0,config.dailyRequestLimit-store.attemptsSince(taiwanDayStart(started)));
    const budget=Math.min(config.runRequestLimit,remaining);
    if(!budget)return {status:'daily_budget_exhausted',requests:0,inserted:0};
    const available=store.due(provider.id,new Date(Date.parse(started)-config.minIntervalHours*3600000).toISOString(),10000);
    const baseline=available.filter(x=>x.purpose==='baseline'), discovery=available.filter(x=>x.purpose==='discovery');
    const baseCount=Math.max(0,budget-(discovery.length?Math.min(2,Math.floor(budget/4)):0));
    const due=[...baseline.slice(0,baseCount),...discovery.slice(0,budget-Math.min(baseCount,baseline.length))];
    if(!due.length)return {status:'nothing_due',requests:0,inserted:0};
    runId=store.begin(provider.id,started);
    for(const entry of due) {
      if(requests>=budget || Date.parse(now())-Date.parse(started)>=config.maxRuntimeSeconds*1000 || store.get('paused',false))break;
      const query=JSON.parse(entry.query_json);
      for(let attempt=0;attempt<=config.retryLimit && requests<budget;attempt++) {
        const at=now();
        requests++;
        // Persist before transport so a crash cannot hide a billable request.
        store.attempt(runId,entry.id,at,'started');
        const attemptId=store.db.prepare('SELECT id FROM radar_attempts WHERE run_id=? ORDER BY rowid DESC LIMIT 1').get(runId).id;
        try {
          const response=await provider.searchIndicative(query);
          const received=now();
          const observations=provider.normalizeIndicative(response,query,received);
          const quotes=observations.map(r=>normalizeQuote(r,query,received,{purpose:entry.purpose})).filter(Boolean);
          const status=quotes.length?'ok':observations.length?'invalid':'empty';
          inserted+=store.insert(quotes,runId,entry.id);
          store.transaction(()=>{
            store.db.prepare('UPDATE radar_attempts SET status=?,response_count=? WHERE id=?').run(status,quotes.length,attemptId);
            if(status!=='invalid')store.db.prepare('UPDATE radar_queries SET last_success=? WHERE id=?').run(received,entry.id);
          });
          if(status==='invalid')failed++;else successes++;break;
        } catch(error) {
          store.db.prepare('UPDATE radar_attempts SET status=?,error_code=? WHERE id=?').run('failed',String(error.code??'provider_error').slice(0,80),attemptId);
          if(error.retryable && attempt<config.retryLimit && requests<budget) {await sleep(Math.min(1000*2**attempt,4000));continue;}
          failed++;
          if([401,403,429].includes(error.status)) {requests=Math.min(requests,budget);throw Object.assign(new Error('Provider temporarily unavailable'),{code:'provider_stop'});}
          break;
        }
      }
    }
    const status=failed?(successes?'partial':'failed'):'succeeded';
    store.finish(runId,now(),status,requests,inserted);
    const failedRuns=successes?0:store.get('failedRuns',0)+1;
    store.set('failedRuns',failedRuns);if(failedRuns>=3)store.set('paused',true);
    return {runId,status,requests,inserted,successfulQueries:successes,failedQueries:failed};
  } catch(error) {
    if(runId)store.finish(runId,now(),successes?'partial':'failed',requests,inserted);
    const failedRuns=store.get('failedRuns',0)+1;store.set('failedRuns',failedRuns);if(failedRuns>=3)store.set('paused',true);
    return {runId,status:successes?'partial':'failed',requests,inserted,errorCode:error.code??'collector_error'};
  } finally {store.release(owner);}
}
