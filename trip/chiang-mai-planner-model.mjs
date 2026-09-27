// Pure date arithmetic. Never parse local midnight (DST/device-zone dependent).
export function dayOfTrip(start,index){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(start)||!Number.isInteger(index)||index<0)return null;
 const date=new Date(`${start}T12:00:00Z`);
 if(!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==start)return null;
 date.setUTCDate(date.getUTCDate()+index);
 return {iso:date.toISOString().slice(0,10),weekday:date.getUTCDay()};
}
export const available=(days,date)=>!days||!date||days.includes(date.weekday);
