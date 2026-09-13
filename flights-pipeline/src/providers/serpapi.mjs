import { ConfigurationError,ProviderError } from '../errors.mjs';
import { normalizeQuery } from '../query.mjs';
import { stableKey } from '../normalize.mjs';

export class SerpApiProvider {
  constructor({env=process.env,fetchImpl=globalThis.fetch}={}) {
    if(!env.SERPAPI_API_KEY)throw new ConfigurationError('SerpApi key is not configured');
    this.id='serpapi';this.key=env.SERPAPI_API_KEY;this.fetch=fetchImpl;
  }
  async searchIndicative(input) {
    const q=normalizeQuery(input),url=new URL('https://serpapi.com/search.json');
    const parameters={engine:'google_flights',departure_id:q.origin,arrival_id:q.destination,outbound_date:q.outbound.iso,type:q.inbound?'1':'2',adults:String(q.adults),travel_class:'1',currency:q.currency,hl:'zh-tw',gl:'tw',api_key:this.key};
    if(q.inbound)parameters.return_date=q.inbound.iso;
    for(const [k,v] of Object.entries(parameters))url.searchParams.set(k,v);
    let response,body;
    try {response=await this.fetch(url,{signal:AbortSignal.timeout(25000)});body=await response.json();}catch{throw new ProviderError('SerpApi transport failed',{retryable:true});}
    if(!response.ok || body.error)throw new ProviderError('SerpApi search failed',{status:response.status,retryable:response.status===429||response.status>=500});
    return body;
  }
  normalizeIndicative(body,input,observedAt=new Date().toISOString()) {
    const q=normalizeQuery(input);
    return [...(body.best_flights??[]),...(body.other_flights??[])].flatMap((r,index)=>{
      if(!(r.price>0)||!Array.isArray(r.flights)||!r.flights.length)return [];
      const flights=r.flights,first=flights[0],last=flights.at(-1);
      const identity=stableKey(flights.map(f=>[f.flight_number,f.departure_airport?.time,f.arrival_airport?.time].join(':')));
      let sourceUrl=null;try{const u=new URL(body.search_metadata?.google_flights_url);if(u.hostname==='www.google.com'&&u.protocol==='https:')sourceUrl=u.href;}catch{}
      return [{observationId:stableKey([identity,observedAt,index]),provider:this.id,providerResultId:identity,searchKind:'indicative',observedAt,origin:q.origin,destination:q.destination,routeOrigin:first.departure_airport?.id??q.origin,routeDestination:last.arrival_airport?.id??q.destination,outboundDate:q.outbound.iso,inboundDate:q.inbound?.iso??null,departure:first.departure_airport?.time??q.outbound.iso,returnDeparture:q.inbound?.iso??null,adults:q.adults,cabinClass:q.cabinClass,currency:q.currency,priceAmount:r.price,priceUnit:null,isDirect:q.inbound?null:flights.length===1,carrier:first.airline??null,bookingUrl:sourceUrl,freshness:'third_party_search_snapshot',providerObservedAt:body.search_metadata?.processed_at??null,complete:false}];
    });
  }
}
export const serpApiPreflight=(env=process.env)=>({provider:'serpapi',configured:Boolean(env.SERPAPI_API_KEY),requiredEnvironmentVariable:'SERPAPI_API_KEY',capabilities:['third_party_price_discovery'],productionVerified:false});
