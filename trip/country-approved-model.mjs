import {validateCountryAllocation,calendarDate} from './approved-travel-contract.mjs';
// Every geography/transport/minimum comes from the owner's profile. There are
// no Thailand cities, fixed transfers, route order or default travel-day values.
export function allocateApprovedCountryTrip(profile,cityIds,{routeId,days,pace,startDate}={}){
 validateCountryAllocation(profile,cityIds);
 const route=profile.routes.find(r=>r.id===routeId);
 if(!route)return {valid:false,reason:'unsupported-route'};
 if(!Number.isInteger(days)||days<profile.dayRange[0]||days>profile.dayRange[1])return {valid:false,reason:'unsupported-days'};
 if(!['leisure','compact'].includes(pace))return {valid:false,reason:'unsupported-pace'};
 if(!calendarDate(startDate))return {valid:false,reason:'local-start-date-required'};
 const endDate=addLocalDays(startDate,days-1);
 if(startDate<route.validFrom||endDate>route.validThrough)return {valid:false,reason:'outside-reviewed-route-dates'};
 const minimum=route.cityIds.map(i=>profile.minimumStay[i][pace]);
 const transferDays=route.transferDays.reduce((a,b)=>a+b,0)+(route.terminalTransfer?.days||0),needed=profile.arrivalDays+profile.departureDays+transferDays+minimum.reduce((a,b)=>a+b,0);
 if(days<needed)return {valid:false,reason:'insufficient-days',needed};
 const counts=[...minimum];for(let extra=0;extra<days-needed;extra++)counts[extra%counts.length]++;
 const timeline=[];let day=1;
 const block=(kind,count,details={})=>{if(!count)return;const start=day;day+=count;timeline.push({kind,start,end:day-1,count,...details});};
 block('arrival',profile.arrivalDays);
 for(let i=0;i<route.cityIds.length;i++){block('stay',counts[i],{cityId:route.cityIds[i]});if(i<route.cityIds.length-1)block('transfer',route.transferDays[i],{from:route.cityIds[i],to:route.cityIds[i+1]});}
 if(route.terminalTransfer)block('transfer',route.terminalTransfer.days,{from:route.terminalTransfer.from,to:route.terminalTransfer.to});
 block('departure',profile.departureDays,{cityId:route.terminalTransfer?.to||route.cityIds.at(-1)});
 return {valid:true,routeId,pace,days,startDate,endDate,needed,transferDays,timeline};
}
export function addLocalDays(value,index){
 if(!calendarDate(value)||!Number.isInteger(index)||index<0)throw Error('Invalid local date/day');
 const date=new Date(value+'T00:00:00Z');date.setUTCDate(date.getUTCDate()+index);return date.toISOString().slice(0,10);
}
export function approvedCityDay(planner,{routeId,index,startDate=''}={}){
 const route=planner.routes.find(r=>r.id===routeId);
 if(!route||!Number.isInteger(index)||index<0||index>=route.days.length)throw Error('Unsupported approved city day');
 const date=startDate?addLocalDays(startDate,index):'',day=route.days[index];
 const rules=(planner.calendar||[]).filter(r=>day.stops.includes(r.placeId));
 const outsideReviewedRules=date?rules.filter(r=>date<r.validFrom||date>r.validThrough):[];
 const applicable=rules.filter(r=>date&&date>=r.validFrom&&date<=r.validThrough);
 const weekday=date?new Date(date+'T00:00:00Z').getUTCDay():null;
 const blocked=applicable.filter(r=>r.closedDates.includes(date)||r.closedWeekdays.includes(weekday));
 return {route,day,date,blocked:blocked.map(r=>({placeId:r.placeId,message:r.message})),outsideReviewedRules:outsideReviewedRules.map(r=>r.placeId),calendarStatus:!date?'date-not-selected':outsideReviewedRules.length?'outside-reviewed-rules':rules.length?'reviewed-rules-applied':'no-rules-provided'};
}
