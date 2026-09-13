import { ConfigurationError,InputError,ProviderError } from '../errors.mjs';
import { normalizeQuery } from '../query.mjs';

export class DuffelProvider {
  constructor({env=process.env,fetchImpl=globalThis.fetch}={}) {
    if(!env.DUFFEL_ACCESS_TOKEN)throw new ConfigurationError('Duffel access token is not configured');
    this.id='duffel';this.token=env.DUFFEL_ACCESS_TOKEN;this.fetch=fetchImpl;
  }
  async searchLive(input,{userInitiated=false}={}) {
    if(!userInitiated)throw new InputError('Duffel verification requires a selected exact itinerary');
    const q=normalizeQuery(input),slices=[{origin:q.origin,destination:q.destination,departure_date:q.outbound.iso}];
    if(q.inbound)slices.push({origin:q.destination,destination:q.origin,departure_date:q.inbound.iso});
    let response,body;
    try {response=await this.fetch('https://api.duffel.com/air/offer_requests?supplier_timeout=10000',{method:'POST',headers:{Authorization:'Bearer '+this.token,'Duffel-Version':'v2','Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({data:{slices,passengers:Array.from({length:q.adults},()=>({type:'adult'})),cabin_class:'economy',max_connections:1}}),signal:AbortSignal.timeout(20000)});body=await response.json();}catch{throw new ProviderError('Duffel request failed',{retryable:true});}
    if(!response.ok)throw new ProviderError('Duffel offer request failed',{status:response.status,retryable:response.status===429||response.status>=500});
    if(body.data?.live_mode!==true)throw new ProviderError('Duffel test results cannot verify production fares');
    return body;
  }
  normalizeLive(body,input,at=new Date().toISOString()) {
    const q=normalizeQuery(input);
    return (body.data?.offers??[]).filter(o=>o.total_currency===q.currency&&Number(o.total_amount)>0).map(o=>({provider:this.id,providerResultId:o.id,searchKind:'live',observedAt:at,providerObservedAt:at,origin:q.origin,destination:q.destination,outboundDate:q.outbound.iso,inboundDate:q.inbound?.iso??null,departure:o.slices?.[0]?.segments?.[0]?.departing_at,returnDeparture:o.slices?.[1]?.segments?.[0]?.departing_at??null,adults:q.adults,cabinClass:q.cabinClass,currency:o.total_currency,priceAmount:Number(o.total_amount)/q.adults,priceUnit:null,isDirect:o.slices?.every(s=>s.segments?.length===1)??null,carrier:o.owner?.iata_code??null,bookingUrl:null,freshness:'live_search',complete:true,taxIncluded:true,providerExpiresAt:o.expires_at}));
  }
}
export const duffelPreflight=(env=process.env)=>({provider:'duffel',configured:Boolean(env.DUFFEL_ACCESS_TOKEN),requiredEnvironmentVariable:'DUFFEL_ACCESS_TOKEN',capabilities:['on_demand_verification'],productionVerified:false});
