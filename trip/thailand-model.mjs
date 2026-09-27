export const cities = [
  {id:'bangkok',name:'曼谷',en:'BANGKOK',number:'01',image:'bkk-aquarium-reef',guide:'/trip/guides/bangkok-with-kids/',tag:'市集・水族館・河畔夜晚',title:'白天看魚，晚上遇見恐龍',intro:'從恰圖恰的小店逛到 SEA LIFE，再把侏羅紀世界和河畔晚餐排進另一段。喜歡都市裡豐富的選擇，就從曼谷開始。',area:'中部・城市旅行',pace:'市區搭配一個郊區日',x:45,y:45,point:[100.5018,13.7563]},
  {id:'chiang-mai',name:'清邁',en:'CHIANG MAI',number:'02',image:'cm-thai-dress-family',guide:'/trip/guides/chiang-mai-with-kids/',tag:'古城泰服・市集・造紙手作',title:'換上泰服，走進古城與小店',intro:'在塔佩門拍全家照，週末到真心市集吃早餐，再安排一段纖維造紙體驗。喜歡手作、逛街和咖啡廳，清邁有很多玩法。',area:'北部・古城與手作',pace:'古城、寧曼與郊區分日',x:32,y:16,point:[98.9853,18.7883]},
  {id:'chiang-rai',name:'清萊',en:'CHIANG RAI',number:'03',image:'cr-white-temple',guide:'/trip/guides/chiang-rai-with-kids/',tag:'白廟・瀑布花園・山景羊群',title:'走進白色寺院，再去山裡看羊',intro:'白廟的建築細節、Lalitta 的瀑布花園，還有 Akha FarmVille 的羊群與山景。景點散在不同方向，選好區域，就能玩得更順。',area:'北部・建築與山景',pace:'南側景點、市區與山區分開',x:39,y:8,point:[99.8325,19.9105]}
];
export const themes = [{id:'all',name:'全部玩法'},{id:'market',name:'市集美食'},{id:'craft',name:'換裝手作'},{id:'family',name:'親子活動'},{id:'scenery',name:'建築山景'}];
export function normalizeState(input={}) {
  const selected=cities.filter(c=>(input.selected||['chiang-mai','chiang-rai']).includes(c.id)).map(c=>c.id);
  const first=selected.includes(input.first)?input.first:selected[0];
  const days=Number(input.days);
  return {selected,first,days:Number.isFinite(days)?Math.min(14,Math.max(3,Math.round(days))):7,pace:input.pace==='compact'?'compact':'relaxed'};
}
export function allocateTrip(input) {
  const state=normalizeState(input);
  if(!state.selected.length)return {...state,valid:false,message:'先選一座想去的城市。',stops:[]};
  // Follow contiguous north/south order after the selected arrival city.
  const orders={bangkok:['bangkok','chiang-mai','chiang-rai'],'chiang-mai':['chiang-mai','chiang-rai','bangkok'],'chiang-rai':['chiang-rai','chiang-mai','bangkok']};
  const order=orders[state.first].filter(id=>state.selected.includes(id));
  const transfers=order.length-1, usable=state.days-2-transfers;
  const minimum=order.map(id=>state.pace==='relaxed'&&id!=='chiang-rai'?2:1);
  const needed=minimum.reduce((a,b)=>a+b,0)+2+transfers;
  if(state.days<needed)return {...state,valid:false,needed,stops:[],message:`這個組合建議至少 ${needed} 天，包含抵達、離境及換城市的時間。可增加天數，或減少一座城市。`};
  const allocation=[...minimum];
  for(let n=0;n<usable-minimum.reduce((a,b)=>a+b,0);n++)allocation[n%order.length]++;
  let day=2;
  const stops=order.map((id,index)=>{const start=day,count=allocation[index];day+=count+(index<order.length-1?1:0);return {id,start,end:start+count-1,count,transferDay:index<order.length-1?start+count:null,next:order[index+1]};});
  return {...state,valid:true,stops,transfers,usable,needed};
}
export function stateFromHash(hash) {
  const p=new URLSearchParams(hash.replace(/^#/,''));
  return normalizeState({selected:p.has('cities')?p.get('cities').split(','):undefined,first:p.get('first'),days:p.has('days')?p.get('days'):undefined,pace:p.get('pace')});
}
export function shareHash(state) {
  const s=normalizeState(state);
  return new URLSearchParams({cities:s.selected.join(','),first:s.first||'',days:String(s.days),pace:s.pace}).toString();
}
