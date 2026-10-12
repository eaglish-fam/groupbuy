import {calendarDate} from './approved-travel-contract.mjs';
import {addLocalDays} from './country-approved-model.mjs';
import {validateMalaysiaExecutionProfile} from './malaysia-profile.mjs';

export const malaysiaProfileKind='malaysia-constraints/v1';
const unique=values=>[...new Set(values)];
const minutes=time=>time==='24:00'?1440:/^\d{2}:\d{2}$/.test(time)&&Number(time.slice(0,2))<24&&Number(time.slice(3))<60?Number(time.slice(0,2))*60+Number(time.slice(3)):null;
const weekdays=['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
const makeBlock=(start,end,description,placeIds=[],kind='rest')=>({start,end,description,placeIds,kind});
const cloneBlock=b=>makeBlock(b.start,b.end,b.title||b.description,[...b.placeIds],b.kind);
const notice=(placeId,kind,message,url)=>({placeId,kind,message,url});
const placesIn=blocks=>unique(blocks.flatMap(b=>b.placeIds));
const profileOf=city=>{
 const p=city.planner.executionProfile;
 if(p?.kind!==malaysiaProfileKind||p.cityId!==city.id||!Array.isArray(p.modules)||!Array.isArray(p.venues))throw Error('Unsupported Malaysia execution profile');
 return p;
};

// Calendar rules compare Malaysian local calendar dates, never the browser's
// timezone. A rule match is not a ticket reservation or live operating status.
export function malaysiaOpening(venue,date,block){
 if(!calendarDate(date))throw Error('Invalid local date');
 const o=venue.opening,weekday=new Date(date+'T00:00:00Z').getUTCDay();
 if(venue.gate==='requires_verified_session_before_auto_schedule'||venue.gate==='requires_confirmed_slot_and_supply'||venue.gate==='source_story_only_not_schedulable')return {status:'unknown',kind:'unverified-operator'};
 if(!o)return {status:'daylight',kind:'public-exterior'};
 if(o.knownClosedDates?.includes(date)||o.recurringClosed&&weekday===o.recurringClosed.weekday&&o.recurringClosed.ordinal.includes(Math.ceil(Number(date.slice(8))/7)))return {status:'closed',kind:'closed-date'};
 if(o.closures?.some(c=>date>=c.start&&date<=c.end))return {status:'closed',kind:'maintenance'};
 if(o.partialClosure?.some(c=>date===c.date&&minutes(block.start)<minutes(c.before)))return {status:'closed',kind:'partial-maintenance'};
 const weekly=o.weekly;
 let window=weekly?(Object.hasOwn(weekly,weekdays[weekday])?weekly[weekdays[weekday]]:weekly.default||weekly[weekday===0||weekday===6?'weekendHoliday':'weekday']):o.daytimePlanningWindow;
 if(weekly&&window===null)return {status:'unknown',kind:'unverified-weekday'};
 if(!window)return {status:'unknown',kind:'unverified-hours'};
 const lastEntry=typeof o.lastEntry==='string'?o.lastEntry:o.lastEntry?.[weekday===0||weekday===6?'weekendHoliday':'weekday'];
 if(minutes(block.start)<minutes(window[0])||minutes(block.end)>minutes(window[1])||lastEntry&&minutes(block.start)>minutes(lastEntry))return {status:'closed',kind:'time-window'};
 return {status:'open',kind:'reviewed-window'};
}

export function assessMalaysiaDay(city,day,{date='',youngestAge=''}={}){
 const p=profileOf(city),venues=new Map(p.venues.map(v=>[v.id,v])),blocked=[],unknown=[],reminders=[...(day.adjustments||[])];
 if(date&&!calendarDate(date))throw Error('Invalid local date');
 if(youngestAge!==''&&(!Number.isInteger(Number(youngestAge))||Number(youngestAge)<0||Number(youngestAge)>110))throw Error('Invalid traveller age');
 let end=-1;
 for(const b of day.blocks){
  if(minutes(b.start)===null||minutes(b.end)===null||minutes(b.start)<end||minutes(b.end)<=minutes(b.start))throw Error('Overlapping or invalid Malaysia timeline');
  end=minutes(b.end);
 }
 for(const id of day.stops){
  const v=venues.get(id);if(!v)throw Error('Unknown Malaysia place');
  if(!date){unknown.push(notice(id,'date-required',`${v.title}：選好日期後再核對公告。`,v.url));continue;}
  for(const b of day.blocks.filter(b=>b.placeIds.includes(id))){
   const availability=malaysiaOpening(v,date,b);
   if(availability.status==='closed')blocked.push(notice(id,availability.kind,`${v.title}：這段日期或時間不符合已核公告。`,v.url));
   if(availability.status==='unknown')unknown.push(notice(id,availability.kind,`${v.title}：這天的營業或場次尚未確認。`,v.url));
  }
  if(id==='my-kl-petrosains')reminders.push(notice(id,'booking','Petrosains：選好日期後預約入場時段，提前 15 分鐘到。',v.url));
  else if(v.opening?.onlineOnly)reminders.push(notice(id,'booking',`${v.title}：先購買線上入場票，再安排當天的職業活動時段。`,v.url));
  if(id==='my-kl-kidzania-aw')reminders.push(notice(id,'embedded-session','A&W 活動使用 RM 支付；向現場確認梯次，再從園內體驗時間調整。',v.url));
  if(id==='my-kl-tower'||id==='my-penang-komtar-the-top')reminders.push(notice(id,'weather-ticket','觀景票種與戶外平台是否開放，仍要核對當日天氣及售票。',v.url));
 }
 return {date,blocked,unknown,reminders,status:blocked.length?'conflict':unknown.length?'needs-check':'within-reviewed-rules'};
}

function restDay(moduleId,reason){
 return {moduleId,title:'住宿休息與補給',description:reason,stops:[],blocks:[makeBlock('09:00','12:00','在住宿休息或調整後續旅行'),makeBlock('12:00','13:30','午餐與休息',[],'meal_rest'),makeBlock('13:30','16:30','住宿休息與補給')],adjustments:[],lost:20,shortened:true};
}

function moduleDay(city,moduleId,{pace,days,indoorChoice,date,rain}){
 const p=profileOf(city),m=p.modules.find(m=>m.id===moduleId);if(!m)throw Error('Unresolved Malaysia module');
 const venues=new Map(p.venues.map(v=>[v.id,v])),adjustments=[],blocks=m.blocks.map(cloneBlock);
 let b=blocks,description=m.pace[pace==='leisure'?'relaxed':'compact'],title=m.title,lost=0;
 const omitted=(id,kind,message)=>{adjustments.push(notice(id,kind,message,venues.get(id)?.url));};
 if(moduleId==='penang-old-town'){
  title='老城與水岸';description=pace==='leisure'?'老街散步後用餐休息，下午挑姓周橋走走。':'老街散步與用餐休息，下午沿水岸走姓周橋與姓陳橋。';
  b=b.map(x=>x.placeIds.includes('my-penang-peranakan-mansion')?makeBlock(x.start,x.end,'老城休息與補給'):x);
  omitted('my-penang-peranakan-mansion','unverified-session','娘惹宅邸需先向業者確認營業及場次；這份行程先留老城休息。');
  if(pace==='leisure')b=b.filter(x=>x.start<'15:00').concat(makeBlock('15:00','16:30','水岸後回程與休息',[],'rest_transfer'));
  b.unshift(makeBlock('08:15','09:00','住宿前往選定老街',[],'transfer'));
 }
 if(moduleId==='penang-komtar'){
  const selected=indoorChoice==='jurassic'?'my-penang-top-jurassic':'my-penang-top-aquarium',other=selected==='my-penang-top-jurassic'?'my-penang-top-aquarium':'my-penang-top-jurassic';
  b=b.flatMap(x=>x.start==='13:15'?[makeBlock(x.start,x.end,venues.get(selected).title,[selected],'visit')]:x.start==='14:15'&&pace==='compact'?[makeBlock('14:15','14:30','館內轉場緩衝',[],'transfer'),makeBlock('14:30','15:30',venues.get(other).title,[other],'visit'),makeBlock('15:30','15:45','飲水休息')]:[x]);
  if(pace==='leisure')b=b.map(x=>x.start==='14:15'?{...x,description:'午後休息'}:x);
  description=pace==='leisure'?'上午科學館，下午挑一間水族／恐龍館，再依體力安排觀景。':'上午科學館，下午水族館與恐龍館各留一段，休息後再觀景。';
  b.unshift(makeBlock('09:15','10:00','前往光大及入場準備',[],'transfer_check_in'));
  b.push(makeBlock('17:15','18:00','回住宿',[],'transfer'));
 }
 if(moduleId==='penang-entopia-day'){
  const branch=m.branches.noConfirmedFarm;
  b=b.filter(x=>minutes(x.start)<minutes(branch.replaceBlocksStartingAtOrAfter)).concat(branch.blocks.map(cloneBlock));
  omitted('my-penang-durian-tree-house','unverified-farm','果園接待與供應需先向業者確認；本次 Entopia 後直接回喬治市，果園另選一天。');
  description='Entopia 半日後午餐，再直接回喬治市休息。';
  b=b.map(x=>x.placeIds.includes('my-penang-butterfly-garden')?{...x,description:'Entopia 自然區與室內探索；蝴蝶釋放場次先看當日公告'}:x);
 }
 if(moduleId==='kl-science'){
  if(pace==='leisure'||days===4||rain){b=b.filter(x=>x.start<'15:45').concat(makeBlock('15:45','16:30','回住宿及休息',[],'transfer_rest'));}
  else b=b.map(x=>x.start==='15:45'?{...x,description:'前往 KL Tower',kind:'transfer'}:x.start==='16:30'?{...x,description:'KL Tower 觀景',kind:'visit'}:x).concat(makeBlock('18:00','18:45','回住宿',[],'transfer'));
  description=pace==='compact'&&days<4&&!rain?'科學館、午餐與商場休息，下午再登塔看城市。':'科學館完整玩，午餐後休息，再看看 KLCC 外觀。';
  b.unshift(makeBlock('08:30','09:15','住宿前往 Suria KLCC 與入場層',[],'transfer'));
 }
 if(moduleId==='kl-old-chinatown'){description='早上看老城建築外觀，用餐後到書店與壁畫街區。';b.unshift(makeBlock('08:15','09:00','住宿前往老城',[],'transfer'));}
 if(moduleId==='kl-old-only'){description='把老城慢慢走，午餐後留給午睡、休息與補給。';b.unshift(makeBlock('08:15','09:00','住宿前往老城',[],'transfer'));b=b.map(x=>x.start==='13:00'?{...x,description:'住宿休息與補給'}:x);}
 if(moduleId==='kl-chinatown-tower'){
  if(pace==='leisure')b=b.flatMap(x=>x.start==='11:15'?[{...x,end:'12:45'}]:x.start==='12:30'?[{...x,start:'12:45'}]:x.start==='14:00'?[{...x,end:'14:30'},makeBlock('14:30','14:45','飲水及休息')]:[x]);
  description=pace==='leisure'?'書店多留一點時間，午餐休息後看壁畫，再登塔看城市。':'書店、壁畫與城市觀景分段安排，中間留午餐與交通時間。';
  b.unshift(makeBlock('09:15','10:00','住宿前往茨廠街',[],'transfer'));
  b.push(makeBlock('17:00','17:45','回住宿',[],'transfer'));
 }
 // The two KidZania visit blocks represent one continuous visit. Their child
 // activity remains an embedded, unreserved option rather than a second day.
 if(moduleId==='kl-kidzania-day'){
  description=pace==='leisure'?'少選幾個工作，讓孩子完整參與，中間留飲水與休息。':'先安排孩子最想玩的兩個熱門工作，再用空檔選較短活動。';
  if(pace==='leisure')b=b.map(x=>x.start==='10:00'?{...x,description:'少選幾個職業，讓孩子完整參與並留休息'}:x.start==='13:00'?{...x,description:'延續園內體驗，依孩子體力休息'}:x);
 }
 if(moduleId==='penang-hill-day')description='早上搭纜車看景與山頂散步，下山用餐後保留下午休息。';

 if(date){
  const critical=moduleId==='kl-science'?'my-kl-petrosains':moduleId==='penang-hill-day'?'my-penang-hill':null;
  if(critical){const x=b.find(x=>x.placeIds.includes(critical)),availability=malaysiaOpening(venues.get(critical),date,x);if(availability.status==='closed')return restDay(moduleId,`${venues.get(critical).title} 在 ${date} 的這段時間休館或停運，今天保留住宿休息；可另選開放日。`);}
  if(new Date(date+'T00:00:00Z').getUTCDay()===1&&b.some(x=>x.placeIds.includes('my-kl-rexkl-bookxcess'))){
   b=b.map(x=>x.placeIds.includes('my-kl-rexkl-bookxcess')?makeBlock(x.start,x.end,'附近用餐與休息'):x);lost+=1;
   omitted('my-kl-rexkl-bookxcess','unknown-monday','BookXcess：週一先向書店確認開放時間，這天先留用餐與休息。');
   if(moduleId==='kl-old-chinatown'){title='老城與壁畫街區';description='早上看老城外觀，用餐休息後走走鬼仔巷壁畫。';}
   if(moduleId==='kl-chinatown-tower'){title='茨廠街、壁畫與城市觀景';description='街區午餐與休息後看壁畫，再登塔看城市。';}
  }
 }
 if(rain){
  if(['penang-old-town','penang-hill-day','penang-entopia-day','kl-old-only'].includes(moduleId))return restDay(moduleId,'強降雨，今天保留住宿休息與補給，也可縮短本次行程。');
  if(moduleId==='penang-komtar'){
   b=b.map(x=>x.placeIds.includes('my-penang-komtar-the-top')?makeBlock(x.start,x.end,'午後休息與補給'):x);
   title='光大室內探索';description=pace==='leisure'?'上午科學館，下午挑一間水族／恐龍館，留足休息。':'上午科學館，下午水族館與恐龍館分段探索。';
   omitted('my-penang-komtar-the-top','rain-outdoor','強降雨先留室內探索；觀景平台請另核當日開放與票種。');lost+=1;
  }
  if(moduleId==='kl-science'){title='科學館與商場休息';description='上午科學探索，午餐後留在商場休息。';b=b.map(x=>x.placeIds.includes('my-kl-petronas-suria')?makeBlock(x.start,x.end,'科學館後留在商場休息'):x);}
  if(['kl-old-chinatown','kl-chinatown-tower'].includes(moduleId)){
   const book=b.find(x=>x.placeIds.includes('my-kl-rexkl-bookxcess'));
   if(!book)return restDay(moduleId,'大雨且書店週一開放需確認，今天先安排住宿休息。');
   title='書店半日';description='到 BookXcess 閱讀與挑書，午餐後回住宿休息。';
   b=[makeBlock('09:00','10:00','住宿休息'),makeBlock('10:00','11:00','前往 REXKL',[],'transfer'),makeBlock('11:00','12:30','BookXcess 閱讀與挑書',['my-kl-rexkl-bookxcess'],'visit'),makeBlock('12:30','14:00','午餐休息',[],'meal_rest'),makeBlock('14:00','15:00','回住宿',[],'transfer'),makeBlock('15:00','16:30','午後休息')];
   lost+=5;adjustments.push(notice('', 'rain-shortened','強降雨改成書店半日，午餐後回住宿休息。',null));
  }
 }
 if(moduleId==='kl-science'&&!rain)title=b.some(x=>x.placeIds.includes('my-kl-tower'))?'科學館與城市觀景':'科學館與 KLCC 外觀';
 return {moduleId,title,description,stops:placesIn(b),blocks:b,adjustments,lost};
}

const permutations=list=>list.length<=1?[list]:list.flatMap((item,i)=>permutations(list.filter((_,j)=>j!==i)).map(rest=>[item,...rest]));

export function materializeMalaysiaRoute(city,route,args={}){
 const p=profileOf(city),startDate=args.startDate||'',rain=args.rain||'none',indoorChoice=args.indoorChoice||'aquarium',completedDays=args.completedDays??0;
 validateMalaysiaExecutionProfile(p,{cityId:city.id,placeIds:city.places.map(place=>place.id)});
 if(startDate&&!calendarDate(startDate))throw Error('Invalid local date');
 if(!['leisure','compact'].includes(route.pace)||route.moduleIds.length!==route.sightseeingDays||route.sightseeingDays<2||route.sightseeingDays>4)throw Error('Invalid Malaysia route');
 if(!['none','all',...Array.from({length:route.sightseeingDays},(_,i)=>String(i+1))].includes(rain)||!['aquarium','jurassic'].includes(indoorChoice)||!Number.isInteger(completedDays)||completedDays<0||completedDays>route.sightseeingDays)throw Error('Unsupported Malaysia options');
 if(args.youngestAge!==undefined&&args.youngestAge!==''&&(!Number.isInteger(Number(args.youngestAge))||Number(args.youngestAge)<0||Number(args.youngestAge)>110))throw Error('Invalid traveller age');
 const original=route.moduleIds,prefix=original.slice(0,completedDays),suffix=original.slice(completedDays);
 const candidates=permutations(suffix).map(tail=>{
  const ids=[...prefix,...tail],days=ids.map((id,index)=>moduleDay(city,id,{pace:route.pace,days:route.sightseeingDays,indoorChoice,date:startDate?addLocalDays(startDate,index):'',rain:index>=completedDays&&(rain==='all'||rain===String(index+1))}));
  const seen=new Set(),duplicate=days.some(d=>d.stops.some(id=>seen.has(id))||(d.stops.forEach(id=>seen.add(id)),false));
  return {ids,days,score:days.reduce((sum,d)=>sum+d.lost*1000,0)+(duplicate?1e9:0)+ids.reduce((n,id,i)=>n+Math.abs(original.indexOf(id)-i),0)};
 });
 candidates.sort((a,b)=>a.score-b.score);
 let result=candidates[0].days,seen=new Set(result.flatMap(d=>d.stops));
 // Only source-reviewed unused indoor modules may replace a lost theme. A
 // previous day's museum is never offered again under a new rain label.
 result=result.map((day,index)=>{
  if(!day.shortened||index<completedDays||!(rain==='all'||rain===String(index+1)))return day;
  if(city.id==='kuala-lumpur'&&!seen.has('my-kl-kidzania')){
   const replacement=moduleDay(city,'kl-kidzania-day',{pace:route.pace,days:route.sightseeingDays,indoorChoice,date:startDate?addLocalDays(startDate,index):'',rain:true});
   replacement.adjustments.push(notice('my-kl-kidzania','changed-interest','強降雨改成 KidZania 職業體驗日；先購買線上入場票，再安排現場活動時段。',p.venues.find(v=>v.id==='my-kl-kidzania').url));replacement.stops.forEach(id=>seen.add(id));return replacement;
  }
  if(city.id==='penang'){
   const unused=['my-penang-top-aquarium','my-penang-top-jurassic'].find(id=>!seen.has(id));
   if(unused){seen.add(unused);const v=p.venues.find(v=>v.id===unused);return {moduleId:'penang-unused-indoor',title:'光大室內館半日',description:'午餐後挑一間這趟尚未去過的室內館，下午回住宿休息。',stops:[unused],blocks:[makeBlock('09:00','11:30','住宿休息'),makeBlock('11:30','12:15','前往光大',[],'transfer'),makeBlock('12:15','13:15','午餐休息',[],'meal_rest'),makeBlock('13:15','14:15',v.title,[unused],'visit'),makeBlock('14:15','15:00','休息'),makeBlock('15:00','16:00','回住宿',[],'transfer')],adjustments:[notice(unused,'rain-half-day','強降雨改成室內館半日，各館票券分開確認。',v.url)],shortened:true};}
  }
  return day;
 });
 const dateDays=result.map((day,index)=>{
  const date=startDate?addLocalDays(startDate,index):'';
  const adjustments=[...day.adjustments];
  if(candidates[0].ids[index]!==original[index])adjustments.unshift(notice('', 'reordered','已依開放日期與天氣交換遊玩日。',null));
  const normalized={...day,adjustments,index,date};delete normalized.lost;
  return {...normalized,assessment:assessMalaysiaDay(city,normalized,{date,youngestAge:args.youngestAge??''})};
 });
 const encountered=new Set();for(const d of dateDays)for(const id of d.stops){if(encountered.has(id))throw Error('Duplicate place across Malaysia days');encountered.add(id);}
 return dateDays;
}
