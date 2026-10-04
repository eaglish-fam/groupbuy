// Calendar helpers only: no import of the g2 catalog or invented route defaults.
export function validDate(value){
 if(value==='')return true;
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
 const date=new Date(value+'T00:00:00Z');
 return !Number.isNaN(date.getTime())&&date.toISOString().slice(0,10)===value;
}
export function dateForDay(value,index){
 if(!validDate(value)||!Number.isInteger(index)||index<0)throw new RangeError('Invalid date/day');
 if(!value)return '';
 const date=new Date(value+'T00:00:00Z');date.setUTCDate(date.getUTCDate()+index);return date.toISOString().slice(0,10);
}
export function selectedRoute(routes,days,pace){
 const r=routes.find(r=>r.sightseeingDays===Number(days)&&r.pace===pace);if(!r)throw Error('Choose approved 2–4 day route');return r;
}
export function approvedDay(routes,days,pace,index,startDate=''){
 const route=selectedRoute(routes,days,pace);if(!Number.isInteger(index)||index<0||index>=route.days.length)throw Error('Invalid day');
 const day=route.days[index],date=dateForDay(startDate,index);
 const closures={'flower-dome':['2026-10-06'],'cloud-forest':['2026-10-26'],'supertree':['2026-10-15']};
 const stops=day.stops.map(s=>({...s,blocked:Boolean(date&&closures[s.target]?.includes(date))}));
 const warnings=[];
 if(!date)warnings.push('尚未選日期；出發前核對維護日、場次與票券。');
 else warnings.push('填入新加坡當地日期，查看營運與維護日提醒。資訊核對：2026/10/3，出發前可再查各站公告。');
 for(const s of stops)if(s.blocked)warnings.push(s.label+' 在 '+date+' 公告維護，請換日期或選其他活動。');
 if(date==='2026-10-09'&&stops.some(s=>s.target==='national-museum'))warnings.push('Odyssea 當日 16:00 閉展，15:30 最後入場；上午行程也須再次核對。');
 if(stops.some(s=>s.target==='duck-tour'))warnings.push('依選購產品確認集合地點、報到時間、語言、日期、兒童規則與雨天安排。');
 return {route,day,date,stops,warnings};
}
