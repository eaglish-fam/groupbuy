#!/usr/bin/env node
import { readFileSync,writeFileSync,mkdirSync,existsSync,chmodSync } from 'node:fs';
import { join,dirname,resolve } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { RadarStore } from './radar-store.mjs';
import { normalizeQuote,candidates } from './radar-model.mjs';
import { collect } from './radar-collect.mjs';
import { createIndicativeProvider,providerPreflight } from './providers/index.mjs';
import { providerEnvironment } from './secret-boundary.mjs';
import { seedPanel,validateConfig } from './radar-plan.mjs';
import { approve,exportApproved,toCsv,lineDraft } from './radar-review.mjs';
import { DuffelProvider } from './providers/duffel.mjs';
import { SkyscannerProvider } from './providers/skyscanner.mjs';
import { verifyQuote } from './radar-verify.mjs';

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2), command=args.shift();
const option=(name,fallback)=>{const i=args.indexOf('--'+name);return i<0?fallback:args[i+1];};
const dataRoot=option('data-dir',process.env.TERRA_FLIGHTS_DATA_DIR??join(homedir(),'Library','Application Support','Eaglish','flight-radar'));
const database=join(dataRoot,'fares.sqlite');
const now=()=>new Date().toISOString();
function writePrivate(path,data){mkdirSync(dirname(path),{recursive:true,mode:0o700});writeFileSync(path,JSON.stringify(data,null,2)+'\n',{mode:0o600});}
async function main(){
  if(command==='preflight'){console.log(JSON.stringify(providerPreflight(providerEnvironment()),null,2));return;}
  if(!['init','collect','health','backup','candidates','pause','resume','plan','approve','export','verify'].includes(command))throw new Error('Unknown radar command');
  mkdirSync(dataRoot,{recursive:true,mode:0o700});chmodSync(dataRoot,0o700);
  const config=validateConfig(JSON.parse(readFileSync(option('config',join(ROOT,'config','radar.json')),'utf8')));
  const store=new RadarStore(database);chmodSync(database,0o600);
  try {
    let result;
    if(command==='init'){
      const legacy=option('legacy',null);let inserted=0;
      if(legacy&&existsSync(legacy)) {
        const source=new DatabaseSync(legacy,{readOnly:true});
        try {
          for(const row of source.prepare('SELECT payload_json FROM fare_observations').all()) {
            const old=JSON.parse(row.payload_json), q=normalizeQuote(old,{},old.observedAt,{legacy:true,purpose:'legacy'});
            if(q)inserted+=store.insert([q],'legacy','legacy');
          }
        }finally{source.close();}
      }
      result={database,legacyInserted:inserted,health:store.health(now())};
    }
    if(command==='plan'){seedPanel(store,config,option('provider','travelpayouts'),now());result=store.health(now());}
    if(command==='collect'){
      const provider=createIndicativeProvider(option('provider','travelpayouts'),{env:providerEnvironment()});
      const requested=option('max-requests',null);if(requested!==null){const n=Number(requested);if(!Number.isInteger(n)||n<1||n>config.runRequestLimit)throw new Error('max-requests must be within configured run limit');config.runRequestLimit=n;}
      result=await collect({store,provider,config});
      writePrivate(join(dataRoot,'health.json'),store.health(now()));
      writePrivate(join(dataRoot,'review','candidates.json'),candidates(store.quotes(),now(),config.thresholds));
      if(['failed','partial'].includes(result.status))process.exitCode=1;
    }
    if(command==='health')result=store.health(now());
    if(command==='verify'){
      const quote=store.quotes().find(q=>q.id===option('quote-id',''));
      if(!quote||quote.expiresAt<=now())throw new Error('Select an unexpired candidate');
      const name=option('provider','duffel'),env=providerEnvironment();
      if(!['duffel','skyscanner'].includes(name))throw new Error('Select a live verification provider');
      result=await verifyQuote({store,quote,providerName:name,config,createProvider:fetchImpl=>name==='duffel'?new DuffelProvider({env,fetchImpl}):new SkyscannerProvider({env,fetchImpl})});
      writePrivate(join(dataRoot,'review','verification-'+quote.id+'.json'),result);
    }
    if(command==='approve'){result=approve(store,option('quote-id',''),JSON.parse(readFileSync(option('evidence',''),'utf8')),now());}
    if(command==='export'){
      const rows=exportApproved(store,config,now());writePrivate(join(dataRoot,'review','approved.json'),rows);
      writeFileSync(join(dataRoot,'review','approved.csv'),toCsv(rows),{mode:0o600});
      for(const row of rows){const draft=lineDraft(row);writePrivate(join(dataRoot,'review',row.release_id+'.json'),draft);writeFileSync(join(dataRoot,'review',row.release_id+'.svg'),draft.svg,{mode:0o600});}
      result={approvedCount:rows.length,output:join(dataRoot,'review'),externalPublication:false};
    }
    if(command==='backup')result={backup:store.backup(join(dataRoot,'backups','fares-'+now().replaceAll(':','-')+'.sqlite'))};
    if(command==='candidates'){result=candidates(store.quotes(),now(),config.thresholds);writePrivate(join(dataRoot,'review','candidates.json'),result);}
    if(command==='pause'||command==='resume'){store.set('paused',command==='pause');if(command==='resume')store.set('failedRuns',0);result={paused:store.get('paused')};}
    console.log(JSON.stringify(result,null,2));
  }finally{store.close();}
}
main().catch(()=>{console.error(JSON.stringify({ok:false,code:'radar_command_failed',message:'Command failed; check provider configuration, arguments and local data availability.'}));process.exitCode=1;});
