import { digest } from './radar-store.mjs';

const DAY = 86400000;
const units = { PRICE_UNIT_WHOLE:1, PRICE_UNIT_MILLI:1000, PRICE_UNIT_MICRO:1000000 };
const validTime = value => Number.isFinite(Date.parse(value));
export function normalizeQuote(row, query, fetchedAt, { legacy = false, purpose = 'baseline' } = {}) {
  let price = Number(row.priceAmount);
  if (row.priceUnit) { if (!units[row.priceUnit]) return null; price /= units[row.priceUnit]; }
  if (!(price > 0) || !Number.isFinite(price)) return null;
  const outboundDate = (row.departure ?? row.outboundDate ?? '').slice(0,10);
  const inboundDate = (row.returnDeparture ?? row.inboundDate ?? '').slice(0,10) || null;
  if (!validTime(outboundDate) || (inboundDate && (!validTime(inboundDate) || inboundDate<=outboundDate))) return null;
  const provider = row.provider;
  if(!validTime(fetchedAt) || (validTime(row.providerObservedAt) && Date.parse(row.providerObservedAt)>Date.parse(fetchedAt)))return null;
  const sourceAt = validTime(row.providerObservedAt) && Date.parse(row.providerObservedAt)<=Date.parse(fetchedAt) ? new Date(row.providerObservedAt).toISOString() : null;
  const origin = row.routeOrigin ?? row.origin;
  const destination = row.routeDestination ?? row.destination;
  const isDirect = typeof row.isDirect === 'boolean' ? row.isDirect : null;
  const baggage = row.baggage ?? 'unknown';
  const tax = row.taxIncluded ?? 'unknown';
  const cabin = row.cabinClass ?? 'unknown';
  const adults = row.adults ?? 1;
  const currency = row.currency;
  // Exact dates are frozen in the baseline panel: a changing lead-time sample cannot fabricate a 90-day history.
  const comparableKey = digest([provider,origin,destination,outboundDate,inboundDate,adults,cabin,currency,isDirect,baggage,tax]);
  const sourceKey = digest([provider,row.providerResultId,sourceAt,origin,destination,outboundDate,inboundDate,price,isDirect,baggage]);
  const id = digest([sourceKey,fetchedAt]);
  let bookingUrl = null;
  try { const u = new URL(row.bookingUrl); if(u.protocol==='https:' && !u.username && !u.password) bookingUrl=u.href; } catch {}
  const maxAge = provider==='skyscanner' ? 4*DAY : provider==='travelpayouts' ? 7*DAY : DAY;
  const stale = sourceAt && Date.parse(fetchedAt)-Date.parse(sourceAt)>maxAge;
  const sourceQualified = !legacy && !stale;
  const expiresAt = new Date(Math.min(Date.parse(fetchedAt)+12*3600000, sourceAt ? Date.parse(sourceAt)+maxAge : Infinity,validTime(row.providerExpiresAt)?Date.parse(row.providerExpiresAt):Infinity)).toISOString();
  return {id,provider,sourceKey,comparableKey,fetchedAt,sourceAt,expiresAt,origin,destination,outboundDate,inboundDate,adults,cabin,currency,price:Math.round(price*100)/100,isDirect,baggage,tax,carrier:row.carrier??null,bookingUrl,freshness:row.freshness,historyBasis:row.freshness==='live_search'?'live_quotes':'observed_cached_prices',sourceQualified,purpose,legacy,queryId:digest(query),providerResultId:row.providerResultId};
}

export function historyFor(quote, rows, now = new Date().toISOString()) {
  const end=Date.parse(now), eligible=rows.filter(r=>r.comparableKey===quote.comparableKey && Date.parse(r.fetchedAt)<=end);
  const windows={};
  for(const days of [7,30,90]) {
    const lower=end-days*DAY;
    const filtered=eligible.filter(r=>r.sourceQualified && r.purpose==='baseline' && Date.parse(r.fetchedAt)>lower && Date.parse(r.sourceAt ?? r.fetchedAt)>lower);
    const unique=[...new Map(filtered.map(r=>[r.sourceKey,r])).values()];
    const daily=new Map();
    for(const r of filtered) {const date=(r.sourceAt??r.fetchedAt).slice(0,10);daily.set(date,Math.min(daily.get(date)??Infinity,r.price));}
    const points=[...daily].sort().map(([date,price])=>({date,price}));
    const prices=points.map(x=>x.price).sort((a,b)=>a-b);
    const median=prices.length ? (prices[Math.floor((prices.length-1)/2)]+prices[Math.ceil((prices.length-1)/2)])/2:null;
    const first=eligible.filter(r=>r.sourceQualified && r.purpose==='baseline').map(r=>Date.parse(r.fetchedAt)).sort((a,b)=>a-b)[0];
    const mature=Boolean(first<=end-days*DAY && daily.size>=Math.ceil(days*.8));
    windows[days]={days,observedDays:daily.size,samples:unique.length,coverage:daily.size/days,mature,min:prices[0]??null,median,p10:prices.length?prices[Math.floor((prices.length-1)*.1)]:null,points};
  }
  return {comparableKey:quote.comparableKey,asOf:now,windows};
}

export function candidates(rows, now=new Date().toISOString(), thresholds={}) {
  const latest=new Map();
  for(const r of rows) {
    const nights=r.inboundDate?(Date.parse(r.inboundDate)-Date.parse(r.outboundDate))/DAY:null;
    if(r.legacy || r.expiresAt<=now || r.fetchedAt>now || r.outboundDate<now.slice(0,10) || !r.bookingUrl || r.currency!=='TWD' || nights===null || nights<2 || nights>21) continue;
    const old=latest.get(r.comparableKey);if(!old || r.fetchedAt>old.fetchedAt || (r.fetchedAt===old.fetchedAt&&r.price<old.price))latest.set(r.comparableKey,r);
  }
  return [...latest.values()].map(q=>{
    const history=historyFor(q,rows,now);
    const w=history.windows[90].mature?history.windows[90]:history.windows[30].mature?history.windows[30]:null;
    const threshold=thresholds[`${q.origin}-${q.destination}`];
    const discount=w?.median ? 1-q.price/w.median:null;
    const reason=w && q.price<=w.p10 ? `${w.days} 天觀測低價` : Number.isFinite(threshold)&&q.price<=threshold ? '達到航線參考門檻' : null;
    return {quote:q,history,reason,discount,suspectedErrorFare:discount!==null&&discount>=.6,status:'pending',requiresVerification:true};
  }).filter(c=>c.reason).sort((a,b)=>(b.discount??0)-(a.discount??0));
}
