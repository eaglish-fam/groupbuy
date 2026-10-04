import {calendarDate} from './approved-travel-contract.mjs';
import {addLocalDays,allocateApprovedCountryTrip} from './country-approved-model.mjs';

export const clockMinutes=value=>value==='24:00'?1440:/^\d{2}:\d{2}$/.test(value)&&Number(value.slice(0,2))<24&&Number(value.slice(3))<60?Number(value.slice(0,2))*60+Number(value.slice(3)):null;
const issue=(placeId,kind,message,url)=>({placeId,kind,message,url});

// A checked schedule is not ticket inventory or a promise that an activity runs.
// All seasons, age limits and opening windows below are explicit public input.
export function assessApprovedDay(city,day,{date='',youngestAge=''}={}){
 if(date&&!calendarDate(date))throw Error('Invalid local date');
 const age=youngestAge===''?null:Number(youngestAge);
 if(age!==null&&(!Number.isInteger(age)||age<0||age>110))throw Error('Invalid traveller age');
 const rules=city.planner.rules||[],blocked=[],unknown=[],reminders=[];
 const weekday=date?new Date(date+'T00:00:00Z').getUTCDay():null;
 for(const placeId of day.stops){
  const rule=rules.find(r=>r.placeId===placeId),name=city.places.find(p=>p.id===placeId)?.title||placeId;
  if(!rule){unknown.push(issue(placeId,'no-rule',`${name}：出發前再核對官方日期與預約。`,null));continue;}
  if(rule.note)reminders.push(issue(placeId,'condition',rule.note,rule.url));
  if(rule.needsAgeConfirmation)unknown.push(issue(placeId,'operator-age',`${name}：孩童接待條件仍需向業者確認，請先聯絡業者確認。`,rule.url));
  if(rule.needsDateConfirmation)unknown.push(issue(placeId,'operator-date',`${name}：實際日期、運轉或場次仍需向官方確認。`,rule.url));
  if(rule.minAge!==undefined){
   if(age===null)unknown.push(issue(placeId,'age-required',`${name}：請填同行最小年齡，這個方案至少 ${rule.minAge} 歲。`,rule.url));
   else if(age<rule.minAge)blocked.push(issue(placeId,'age',`${name}：這個方案至少 ${rule.minAge} 歲，不能照此方案安排。`,rule.url));
  }
  if(!date){unknown.push(issue(placeId,'date-required',`${name}：選好日期後核對公告時段。`,rule.url));continue;}
  if(date<rule.validFrom||date>rule.validThrough){unknown.push(issue(placeId,'outside-review',`${name}：日期超出公告涵蓋期間，請先查官方日期。`,rule.url));continue;}
  if(rule.closedMonthDays?.includes(date.slice(5))){blocked.push(issue(placeId,'annual-closure',`${name}：這天是公告休館日。`,rule.url));continue;}
  const legacy=(city.planner.calendar||[]).filter(r=>r.placeId===placeId&&date>=r.validFrom&&date<=r.validThrough);
  if(legacy.some(r=>r.closedDates.includes(date)||r.closedWeekdays.includes(weekday))){blocked.push(issue(placeId,'closed-date',`${name}：這天不符合公告開放日。`,rule.url));continue;}
  if(!rule.windows.length){unknown.push(issue(placeId,'operator-calendar',`${name}：尚無此日期的已確認時段，請選定業者與場次。`,rule.url));continue;}
  const override=rule.overrides?.find(o=>o.monthDay===date.slice(5));
  const windows=rule.windows.filter(w=>date>=w.from&&date<=w.to&&w.weekdays.includes(weekday)&&(!w.months||w.months.includes(Number(date.slice(5,7))))).map(w=>override?{...w,opens:override.opens,closes:override.closes,needsDateConfirmation:false}:w);
  if(!windows.length){blocked.push(issue(placeId,'season-or-weekday',`${name}：這天不在此方案的公告季節或開放日。`,rule.url));continue;}
  if(windows.some(w=>w.needsDateConfirmation))unknown.push(issue(placeId,'opening-check',`${name}：請查看當日官網，確認入場與閉園時間。`,rule.url));
  const blocks=(day.blocks||[]).filter(b=>b.placeIds.includes(placeId));
  if(!blocks.length){unknown.push(issue(placeId,'time-unset',`${name}：這份路線未指定入場時間，請先確認官方場次。`,rule.url));continue;}
  for(const b of blocks){
   const start=clockMinutes(b.start),end=clockMinutes(b.end);
   const fit=windows.some(w=>start>=clockMinutes(w.opens)&&(w.closes===null||end<=clockMinutes(w.closes))&&(!w.startTimes?.length||w.startTimes.includes(b.start)));
   if(!fit)blocked.push(issue(placeId,'time-window',`${name}：${b.start}–${b.end} 不符合公告開放或團次時段，請改選時間。`,rule.url));
   if(rule.minimumMinutes!==undefined&&end-start<rule.minimumMinutes)blocked.push(issue(placeId,'duration',`${name}：此方案需保留至少 ${rule.minimumMinutes} 分鐘，不能縮短成這段時間。`,rule.url));
  }
 }
 return {date,blocked,unknown,reminders,status:blocked.length?'conflict':unknown.length?'needs-check':'within-reviewed-rules'};
}

export function assessApprovedCityRoute(city,route,{startDate='',youngestAge=''}={}){
 return route.days.map((day,index)=>({...day,index,date:startDate?addLocalDays(startDate,index):'',assessment:assessApprovedDay(city,day,{date:startDate?addLocalDays(startDate,index):'',youngestAge})}));
}

export function matchingApprovedRoutes(city,{days,pace}){
 return city.planner.routes.filter(r=>r.sightseeingDays===Number(days)&&r.pace===pace);
}

export function feasibleApprovedDates(city,route,{startDate,youngestAge='',limit=14}={}){
 if(!calendarDate(startDate))return [];
 const found=[];
 for(let offset=1;offset<=Math.min(limit,31);offset++){
  const date=addLocalDays(startDate,offset),days=assessApprovedCityRoute(city,route,{startDate:date,youngestAge});
  if(days.every(d=>d.assessment.status==='within-reviewed-rules'))found.push(date);
  if(found.length===3)break;
 }
 return found;
}

export function countryPlanWithRules(country,cities,args){
 const plan=allocateApprovedCountryTrip(country.allocation,country.cityIds,args);
 if(!plan.valid)return plan;
 const cityMap=new Map(cities.map(c=>[c.id,c])),days=[];
 const selectedRoutes=new Map();
 for(const block of plan.timeline)for(let i=0;i<block.count;i++){
  const index=block.start-1+i,date=addLocalDays(args.startDate,index);
  if(block.kind!=='stay'){days.push({...block,index,date});continue;}
  const city=cityMap.get(block.cityId),paces=new Set(city.planner.routes.map(r=>r.pace));
  // A country pace may change the reviewed stay-day allocation, never the
  // duration of a fixed city tour. One source-owned city pace serves either.
  const routes=city.planner.routes.filter(r=>(paces.size===1||r.pace===args.pace)&&r.sightseeingDays<=block.count);
  // Pick only an explicit, reviewed route; prefer one without a known conflict
  // across this whole stay. Unknown operator inventory is never promoted.
  if(!selectedRoutes.has(block.cityId)){
   const ranked=routes.map(route=>{const assessed=assessApprovedCityRoute(city,route,{startDate:addLocalDays(args.startDate,block.start-1),youngestAge:args.youngestAge??''}),blocked=assessed.reduce((n,d)=>n+d.assessment.blocked.length,0),unknown=assessed.reduce((n,d)=>n+d.assessment.unknown.length,0);return {route,blocked,unknown,rank:blocked?2:unknown?1:0};});
   ranked.sort((a,b)=>a.rank-b.rank||a.blocked-b.blocked||a.unknown-b.unknown||b.route.sightseeingDays-a.route.sightseeingDays);
   selectedRoutes.set(block.cityId,ranked[0]?.route);
  }
  const route=selectedRoutes.get(block.cityId);
  if(!route){days.push({...block,index,date,city,unsupported:true});continue;}
  const day=route.days[i];
  days.push({...block,index,date,city,route,...(day?{day,assessment:assessApprovedDay(city,day,{date,youngestAge:args.youngestAge??''})}:{flexible:true})});
 }
 return {...plan,days};
}

export function approvedPlanParameters(url){
 const params=new URL(url,'https://www.eaglish.store').searchParams;
 return Object.fromEntries(['routeId','days','pace','startDate','youngestAge','day'].filter(k=>params.has(k)).map(k=>[k,params.get(k)]));
}
export function approvedPlanShareUrl(url,state){
 const result=new URL(url,'https://www.eaglish.store');
 result.search='';result.hash='plan';
 for(const key of ['routeId','days','pace','startDate','youngestAge','day'])if(state[key]!==undefined&&state[key]!=='')result.searchParams.set(key,String(state[key]));
 return result.href;
}
