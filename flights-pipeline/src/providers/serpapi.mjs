import { ConfigurationError,ProviderError } from '../errors.mjs';
import { normalizeQuery } from '../query.mjs';
import { stableKey } from '../normalize.mjs';

const IATA=/^[A-Z]{3}$/;
const ISO_DATE=/^\d{4}-\d{2}-\d{2}$/;
const googleFlightUrl=value=>{
  try {
    const url=new URL(value);
    return url.protocol==='https:' && ['www.google.com','google.com'].includes(url.hostname) ? url.href : null;
  } catch { return null; }
};

function serpApiLink(value) {
  try {
    const url=new URL(value);
    if(url.protocol!=='https:' || url.hostname!=='serpapi.com' || url.searchParams.get('engine')!=='google_flights')return null;
    url.searchParams.delete('api_key');
    return url.href;
  } catch { return null; }
}

export class SerpApiProvider {
  constructor({env=process.env,fetchImpl=globalThis.fetch}={}) {
    if(!env.SERPAPI_API_KEY)throw new ConfigurationError('SerpApi key is not configured');
    this.id='serpapi';this.key=env.SERPAPI_API_KEY;this.fetch=fetchImpl;
  }
  async request(parameters,base='https://serpapi.com/search.json') {
    const url=new URL(base);
    url.searchParams.delete('api_key');
    for(const [key,value] of Object.entries(parameters))if(value!==null&&value!==undefined&&value!=='')url.searchParams.set(key,String(value));
    url.searchParams.set('api_key',this.key);
    let response,body;
    try {response=await this.fetch(url,{signal:AbortSignal.timeout(25000)});body=await response.json();}catch{throw new ProviderError('SerpApi transport failed',{retryable:true});}
    if(!response.ok || body.error)throw new ProviderError('SerpApi search failed',{status:response.status,retryable:response.status===429||response.status>=500});
    return body;
  }
  async searchIndicative(input) {
    const q=normalizeQuery(input),url=new URL('https://serpapi.com/search.json');
    const parameters={engine:'google_flights',departure_id:q.origin,arrival_id:q.destination,outbound_date:q.outbound.iso,type:q.inbound?'1':'2',adults:String(q.adults),travel_class:'1',currency:q.currency,hl:'zh-tw',gl:'tw'};
    if(q.inbound)parameters.return_date=q.inbound.iso;
    return this.request(parameters,url);
  }
  async searchDeals(input) {
    const origin=String(input.origin??'').toUpperCase();
    const outboundStart=String(input.outboundStart??''),outboundEnd=String(input.outboundEnd??'');
    const minNights=Number(input.minNights),maxNights=Number(input.maxNights);
    if(!IATA.test(origin))throw new ConfigurationError('A valid departure airport is required');
    if(!ISO_DATE.test(outboundStart)||!ISO_DATE.test(outboundEnd)||outboundEnd<outboundStart)throw new ConfigurationError('A valid outbound date range is required');
    if(!Number.isInteger(minNights)||!Number.isInteger(maxNights)||minNights<1||maxNights<minNights||maxNights>30)throw new ConfigurationError('A valid trip length is required');
    return this.request({engine:'google_flights_deals',departure_id:origin,outbound_date:`${outboundStart},${outboundEnd}`,trip_length:`${minNights},${maxNights}`,type:'1',adults:String(input.adults??1),travel_class:'1',currency:input.currency??'TWD',hl:'zh-tw',gl:'tw',stops:input.directOnly?'1':undefined});
  }
  normalizeDeals(body,input,observedAt=new Date().toISOString()) {
    const origin=String(input.origin??'').toUpperCase(),currency=input.currency??'TWD';
    return (body.deals??[]).flatMap((deal,index)=>{
      const destination=String(deal.arrival_airport_code??'').toUpperCase();
      const price=Number(deal.price),averagePrice=Number(deal.average_price),discountPercentage=Number(deal.discount_percentage);
      const verificationUrl=serpApiLink(deal.serpapi_flight_link),bookingUrl=googleFlightUrl(deal.flight_link);
      if(!IATA.test(destination)||!ISO_DATE.test(deal.outbound_date)||!ISO_DATE.test(deal.return_date)||!(price>0)||!bookingUrl||!verificationUrl)return [];
      return [{candidateId:stableKey([origin,destination,deal.outbound_date,deal.return_date,price,index]),provider:this.id,origin,destination,outboundDate:deal.outbound_date,inboundDate:deal.return_date,adults:Number(input.adults??1),cabinClass:'economy',currency,price,averagePrice:averagePrice>0?averagePrice:null,discountPercentage:Number.isFinite(discountPercentage)?discountPercentage:null,isDirect:deal.stops===0?true:deal.stops>0?false:null,stops:Number.isInteger(deal.stops)?deal.stops:null,carrier:deal.airline??null,bookingUrl,verificationUrl,observedAt,freshness:'third_party_search_snapshot',requiresVerification:true}];
    });
  }
  async searchSelection(verificationUrl,{departureToken,bookingToken}={}) {
    const safe=serpApiLink(verificationUrl);
    if(!safe)throw new ConfigurationError('A safe SerpApi Google Flights link is required');
    return this.request({departure_token:departureToken,booking_token:bookingToken},safe);
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
export const serpApiPreflight=(env=process.env)=>({provider:'serpapi',configured:Boolean(env.SERPAPI_API_KEY),requiredEnvironmentVariable:'SERPAPI_API_KEY',capabilities:['third_party_price_discovery','flexible_date_deals','selected_itinerary_recheck'],productionVerified:false});
