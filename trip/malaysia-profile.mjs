const validId=id=>typeof id==='string'&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id);
const time=value=>typeof value==='string'&&/^\d{2}:\d{2}$/.test(value)&&(value==='24:00'||Number(value.slice(0,2))<24&&Number(value.slice(3))<60);
const minute=value=>Number(value.slice(0,2))*60+Number(value.slice(3));
const date=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(value+'T00:00:00Z'))&&new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value;
const need=(ok,message)=>{if(!ok)throw Error('Malaysia profile: '+message);};
const unique=values=>new Set(values).size===values.length;

export function validateMalaysiaExecutionProfile(profile,{cityId,placeIds,sourceCheck}={}){
 need(profile?.kind==='malaysia-constraints/v1'&&profile.cityId===cityId&&['penang','kuala-lumpur'].includes(cityId),'kind/city');
 need(date(profile.checkedOn)&&profile.timeZone==='Asia/Kuala_Lumpur','date/timezone');
 need(Array.isArray(profile.venues)&&profile.venues.length>0&&profile.venues.length<=25&&unique(profile.venues.map(v=>v.id)),'venues');
 const ids=new Set(profile.venues.map(v=>v.id));
 const sources=values=>{need(Array.isArray(values)&&unique(values)&&values.every(validId),'source identifiers');if(values.length&&sourceCheck)sourceCheck(values);};
 const window=w=>need(Array.isArray(w)&&w.length===2&&w.every(time)&&minute(w[1])>minute(w[0]),'opening window');
 for(const v of profile.venues){
  need(validId(v.id)&&placeIds?.includes(v.id)&&typeof v.title==='string'&&v.title.trim()&&typeof v.gate==='string','venue reference');sources(v.sourceIds);
  if(v.url!==undefined)need(typeof v.url==='string'&&v.url.startsWith('https://')&&!/[\s<>"'\\]/.test(v.url)&&!/[?&](?:access_token|oauth_code|api_key)=/i.test(v.url),'operator URL');
  const o=v.opening;if(!o)continue;
  need(v.sourceIds.length>0,'opening provenance');
  if(o.weekly)for(const w of Object.values(o.weekly))if(w!==null)window(w);
  if(o.daytimePlanningWindow)window(o.daytimePlanningWindow);
  if(o.lastEntry){for(const t of typeof o.lastEntry==='string'?[o.lastEntry]:Object.values(o.lastEntry))need(time(t),'last entry');}
  if(o.recurringClosed)need(Number.isInteger(o.recurringClosed.weekday)&&o.recurringClosed.weekday>=0&&o.recurringClosed.weekday<=6&&Array.isArray(o.recurringClosed.ordinal)&&o.recurringClosed.ordinal.every(n=>Number.isInteger(n)&&n>=1&&n<=5),'ordinal weekday');
  if(o.knownClosedDates)need(Array.isArray(o.knownClosedDates)&&o.knownClosedDates.every(date),'special closure');
  if(o.closures)need(Array.isArray(o.closures)&&o.closures.every(c=>date(c.start)&&date(c.end)&&c.end>=c.start),'closure range');
  if(o.partialClosure)need(Array.isArray(o.partialClosure)&&o.partialClosure.every(c=>date(c.date)&&time(c.before)),'partial closure');
 }
 need(Array.isArray(profile.modules)&&profile.modules.length>0&&profile.modules.length<=8&&unique(profile.modules.map(m=>m.id)),'bounded modules');
 const blocks=values=>{
  need(Array.isArray(values)&&values.length>=1&&values.length<=16,'bounded blocks');let end=-1;
  for(const b of values){need(time(b.start)&&time(b.end)&&minute(b.start)>=end&&minute(b.end)>minute(b.start),'ordered timeline');end=minute(b.end);need(typeof b.title==='string'&&b.title.trim()&&Array.isArray(b.placeIds)&&unique(b.placeIds)&&b.placeIds.every(id=>ids.has(id)),'block references');}
 };
 for(const m of profile.modules){
  need(validId(m.id)&&m.city===cityId&&typeof m.title==='string'&&m.title.trim()&&typeof m.pace?.relaxed==='string'&&typeof m.pace?.compact==='string','module');sources(m.sourceIds);need(m.sourceIds.length>0,'module provenance');blocks(m.blocks);
  if(m.branches?.noConfirmedFarm){need(time(m.branches.noConfirmedFarm.replaceBlocksStartingAtOrAfter),'branch cutoff');blocks(m.branches.noConfirmedFarm.blocks);}
 }
 return profile;
}
