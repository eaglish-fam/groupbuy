import { normalizeQuery } from './query.mjs';

function addDays(day,n) {return new Date(Date.parse(day+'T00:00:00Z')+n*86400000).toISOString().slice(0,10);}
export function seedPanel(store, config, provider, now) {
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(now));
  let added=0;
  for(const route of config.routes) {
    for(const lead of config.leadDays) {
      const slot=`${route.origin}-${route.destination}-${lead}`;
      if(store.activeSlot(provider,slot,today))continue;
      const outbound=addDays(today,lead), inbound=addDays(outbound,route.nights);
      const q=normalizeQuery({origin:route.origin,destination:route.destination,outbound,inbound,adults:1,currency:'TWD'});
      store.enqueue(provider,slot,q,'baseline',now);added++;
    }
  }
  if(provider==='travelpayouts' && config.discoveryMonths)for(const route of config.routes)for(const month of config.discoveryMonths) {
    const monthStart=new Date(today+'T00:00:00Z');monthStart.setUTCDate(1);monthStart.setUTCMonth(monthStart.getUTCMonth()+month);
    const outbound=monthStart.toISOString().slice(0,10),slot=`month-${route.origin}-${route.destination}-${month}`;
    // Month queries retire only after the month ends; their sample is excluded from the fixed baseline.
    const active=store.activeSlot(provider,slot,today.slice(0,8)+'01');if(active)continue;
    const query={...normalizeQuery({origin:route.origin,destination:route.destination,outbound,inbound:addDays(outbound,route.nights)}),dateMode:'month'};
    store.enqueue(provider,slot,query,'discovery',now);added++;
  }
  return added;
}

export function validateConfig(c) {
  for(const [key,min,max] of [['dailyRequestLimit',1,1000],['runRequestLimit',1,100],['retryLimit',0,2],['maxRuntimeSeconds',1,900],['minIntervalHours',1,48]]) if(!Number.isInteger(c[key])||c[key]<min||c[key]>max)throw new Error(`Invalid ${key}`);
  if(!Array.isArray(c.leadDays)||!c.leadDays.length||c.leadDays.some(n=>!Number.isInteger(n)||n<1||n>330))throw new Error('Invalid leadDays');
  if(!Array.isArray(c.routes)||!c.routes.length)throw new Error('Missing routes');
  for(const r of c.routes)if(!/^[A-Z]{3}$/.test(r.origin)||!/^[A-Z]{3}$/.test(r.destination)||!Number.isInteger(r.nights)||r.nights<1||r.nights>30)throw new Error('Invalid route');
  return c;
}
