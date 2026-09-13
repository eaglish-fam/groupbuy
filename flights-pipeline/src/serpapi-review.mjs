#!/usr/bin/env node
import { readFileSync,writeFileSync,mkdirSync,chmodSync } from 'node:fs';
import { join,dirname,resolve } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { RadarStore } from './radar-store.mjs';
import { normalizeQuote } from './radar-model.mjs';
import { SerpApiProvider } from './providers/serpapi.mjs';
import { providerEnvironment } from './secret-boundary.mjs';

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2);
const option=(name,fallback)=>{const i=args.indexOf('--'+name);return i<0?fallback:args[i+1];};
const now=()=>new Date().toISOString();
const dayStart=iso=>{const day=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(iso));return new Date(day+'T00:00:00+08:00').toISOString();};
const allFlights=body=>[...(body.best_flights??[]),...(body.other_flights??[])];
const safeWrite=(path,value)=>{mkdirSync(dirname(path),{recursive:true,mode:0o700});writeFileSync(path,JSON.stringify(value,null,2)+'\n',{mode:0o600});};
const segments=row=>(row?.flights??[]).map(f=>({origin:f.departure_airport?.id??null,destination:f.arrival_airport?.id??null,departure:f.departure_airport?.time??null,arrival:f.arrival_airport?.time??null,airline:f.airline??null,flightNumber:f.flight_number??null}));
const matching=(rows,deal,token)=>rows.find(r=>Number(r.price)===deal.price&&r[token]&&segments(r)[0]?.origin===(token==='departure_token'?deal.origin:deal.destination))??null;
const bookingDetails=(body,price)=>{
  const together=(body.booking_options??[]).map(x=>x.together).find(x=>Number(x?.price)===price);
  const bags=Array.isArray(together?.baggage_prices)?together.baggage_prices.filter(x=>typeof x==='string'&&x.trim()):[];
  return {bookWith:together?.book_with??null,marketedAs:together?.marketed_as??[],baggage:bags.length?bags.join('; '):'unknown'};
};

async function main(){
  const dataRoot=option('data-dir',process.env.TERRA_FLIGHTS_DATA_DIR??join(homedir(),'Library','Application Support','Eaglish','flight-radar'));
  const config=JSON.parse(readFileSync(option('config',join(ROOT,'config','radar.json')),'utf8'));
  const store=new RadarStore(join(dataRoot,'fares.sqlite'));chmodSync(join(dataRoot,'fares.sqlite'),0o600);
  const started=now(),owner=randomUUID(),limit=Math.min(3,Math.max(1,Number(option('top','3'))||3));
  let runId,requests=0,inserted=0,status='failed';
  let locked=false;
  const provider=new SerpApiProvider({env:providerEnvironment()});
  const record=async(slot,purpose,input,operation)=>{
    const queryId=store.enqueue('serpapi',slot,input,purpose,now());
    store.attempt(runId,queryId,now(),'started');requests++;
    const attemptId=store.db.prepare('SELECT id FROM radar_attempts WHERE run_id=? ORDER BY rowid DESC LIMIT 1').get(runId).id;
    try {
      const result=await operation();
      store.db.prepare('UPDATE radar_attempts SET status=?,response_count=? WHERE id=?').run('ok',Array.isArray(result?.deals)?result.deals.length:allFlights(result).length,attemptId);
      store.db.prepare('UPDATE radar_queries SET last_success=? WHERE id=?').run(now(),queryId);
      return result;
    }catch(error){store.db.prepare('UPDATE radar_attempts SET status=?,error_code=? WHERE id=?').run('failed',String(error.code??'provider_error').slice(0,80),attemptId);throw error;}
  };
  try {
    if(store.get('paused',false))throw new Error('Collector is paused');
    locked=store.acquire(owner,started);if(!locked)throw new Error('Collector is already running');
    const remaining=Math.max(0,(config.providerDailyRequestLimits?.serpapi??10)-store.attemptsSince(dayStart(started),'serpapi'));
    const required=1+limit*3;
    if(remaining<required)throw new Error('Not enough daily SerpApi request budget for a complete supervised review');
    runId=store.begin('serpapi',started);
    const input={origin:option('origin','TPE').toUpperCase(),outboundStart:option('start',new Date(Date.parse(started)+18*86400000).toISOString().slice(0,10)),outboundEnd:option('end',new Date(Date.parse(started)+200*86400000).toISOString().slice(0,10)),minNights:Number(option('min-nights','3')),maxNights:Number(option('max-nights','10')),currency:'TWD',adults:1};
    const dealsBody=await record('flexible-deals','discovery',input,()=>provider.searchDeals(input));
    const discovered=provider.normalizeDeals(dealsBody,input,now()).filter(x=>x.outboundDate>=started.slice(0,10)&&x.isDirect===true).sort((a,b)=>(b.discountPercentage??-1)-(a.discountPercentage??-1)||a.price-b.price);
    const reviewed=[];
    for(const deal of discovered.slice(0,limit)){
      const exact=await record(`exact-${deal.candidateId}`,'verification',{candidateId:deal.candidateId,step:'outbound'},()=>provider.searchSelection(deal.verificationUrl));
      const outbound=matching(allFlights(exact),deal,'departure_token');
      if(!outbound)continue;
      const returns=await record(`return-${deal.candidateId}`,'verification',{candidateId:deal.candidateId,step:'return'},()=>provider.searchSelection(deal.verificationUrl,{departureToken:outbound.departure_token}));
      const inbound=matching(allFlights(returns),deal,'booking_token');
      if(!inbound)continue;
      const booking=await record(`booking-${deal.candidateId}`,'verification',{candidateId:deal.candidateId,step:'booking'},()=>provider.searchSelection(deal.verificationUrl,{bookingToken:inbound.booking_token}));
      const details=bookingDetails(booking,deal.price),checkedAt=now(),outboundSegments=segments(outbound),inboundSegments=segments(inbound);
      const direct=outboundSegments.length===1&&inboundSegments.length===1&&outboundSegments[0].origin===deal.origin&&outboundSegments[0].destination===deal.destination&&inboundSegments[0].origin===deal.destination&&inboundSegments[0].destination===deal.origin;
      if(!direct)continue;
      const query={origin:deal.origin,destination:deal.destination,outbound:deal.outboundDate,inbound:deal.inboundDate,currency:'TWD',adults:1};
      const quote=normalizeQuote({provider:'serpapi',providerResultId:deal.candidateId,routeOrigin:deal.origin,routeDestination:deal.destination,departure:outboundSegments[0].departure??deal.outboundDate,returnDeparture:inboundSegments[0].departure??deal.inboundDate,adults:1,cabinClass:'economy',currency:'TWD',priceAmount:deal.price,isDirect:true,baggage:details.baggage,taxIncluded:'unknown',carrier:deal.carrier,bookingUrl:deal.bookingUrl,freshness:'selected_itinerary_recheck',providerObservedAt:checkedAt,providerExpiresAt:new Date(Date.parse(checkedAt)+3600000).toISOString()},query,checkedAt,{purpose:'discovery'});
      if(!quote)continue;
      inserted+=store.insert([quote],runId,`review-${deal.candidateId}`);
      reviewed.push({quoteId:quote.id,status:'pending_hiram_approval',origin:deal.origin,destination:deal.destination,outboundDate:deal.outboundDate,inboundDate:deal.inboundDate,priceTwd:deal.price,averagePriceTwd:deal.averagePrice,providerDiscountPercentage:deal.discountPercentage,airline:deal.carrier,direct:true,baggage:details.baggage,outbound:outboundSegments,inbound:inboundSegments,bookingUrl:deal.bookingUrl,checkedAt,expiresAt:quote.expiresAt,historyClaimAllowed:false,publicationPerformed:false});
    }
    status=reviewed.length?'succeeded':'empty';store.finish(runId,now(),status,requests,inserted);
    const artifact={generatedAt:now(),source:'SerpApi Google Flights Deals and selected-itinerary recheck',requestCount:requests,reviewedCount:reviewed.length,publicationPerformed:false,linePerformed:false,candidates:reviewed};
    const output=join(dataRoot,'review','serpapi-first-batch.json');safeWrite(output,artifact);
    console.log(JSON.stringify({ok:true,runId,status,requests,inserted,output,candidates:reviewed.map(({bookingUrl,...item})=>item)},null,2));
  }catch(error){if(runId)store.finish(runId,now(),'failed',requests,inserted);throw error;}
  finally{if(locked)store.release(owner);store.close();}
}

main().catch(()=>{console.error(JSON.stringify({ok:false,code:'serpapi_review_failed',message:'Supervised SerpApi review failed; inspect local provider health and quota.'}));process.exitCode=1;});
