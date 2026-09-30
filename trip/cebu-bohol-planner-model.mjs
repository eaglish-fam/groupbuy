export const plannerChoices = {
  hills: {id:'hills',label:'巧克力山',href:'#hills',note:'看全景、登階與休息；觀景台條件向實際場館確認。'},
  buggy: {id:'buggy',label:'家庭 buggy',href:'#buggy',note:'先確認四座車、孩子乘坐與雨天方案，連裝備與集合時間一起留。'},
  tarsier: {id:'tarsier',label:'眼鏡猴觀察（Bilar）',href:'#tarsier',note:'Bohol Tarsier Conservation Area 位於 Villa Aurora, Bilar；確認當日開放與接送，安靜觀察、不開閃光燈。'},
  lunch: {id:'lunch',label:'Loboc 午餐船',href:'#loboc',note:'以確認的登船時段反推順序，含排隊、用餐與上下船約留 1.5～2 小時。'},
};

export function normalizePlan(input={}) {
  const flag=(value,fallback)=>value===undefined?fallback:value===true||value==='1';
  return {days:Number(input.days)===2?2:1,pace:input.pace==='packed'?'packed':'relaxed',buggy:flag(input.buggy,false),lunch:flag(input.lunch,false)};
}

export function planCebuBohol(input={}) {
  const state=normalizePlan(input);
  const day=(number,ids,rest)=>({number,stops:ids.map(id=>plannerChoices[id]),rest});
  const warnings=[];
  let days;
  if(state.days===2) {
    if(state.pace==='relaxed') days=[day(1,['hills',...(state.buggy?['buggy']:[])],'山丘活動之間留接送與用餐，下午回住宿休息。'),day(2,['tarsier',...(state.lunch?['lunch']:[])],'確認 Bilar 園區與 Loboc 登船時段後再決定先後，保留登船等候或住宿附近的空白時間。')];
    else days=[day(1,['hills',...(state.buggy?['buggy']:[]),'tarsier'],'預約與園區位置確認後再定順序，移動、午餐與孩子休息另留時間。'),day(2,state.lunch?['lunch']:[],'不再重排昨天的景點；可留住宿附近活動與休息，不加碼跨島往返。')];
  } else if(state.pace==='packed') {
    days=[day(1,['hills',...(state.buggy?['buggy']:[]),'tarsier',...(state.lunch?['lunch']:[])],'這是完整鄉村活動日；有預約船班時反推路線，接送與餐食不能只用各站停留時間相加。')];
    if(state.buggy&&state.lunch) warnings.push('同日包含越野車與午餐船，需完整一天及確認過的接送／場次；若遇雨或等待較久，先刪減活動。');
  } else {
    days=[day(1,state.buggy?['hills','buggy']:state.lunch?['tarsier','lunch']:['hills','tarsier'],'一天悠閒只安排兩種體驗，午餐船也算一種；另留接送、陸上午餐或孩子休息。')];
    if(state.buggy) warnings.push('未安排：Bilar 眼鏡猴。悠閒的一日先保留山景與越野車，眼鏡猴另留一天。');
    else if(state.lunch) warnings.push('未安排：巧克力山。悠閒的一日先保留 Bilar 眼鏡猴與午餐船；想加山景，改兩天或緊湊步調。');
    if(state.buggy&&state.lunch) warnings.push('你也選了午餐船；這個悠閒一日方案未排入，改成兩個完整日或緊湊步調才一起安排。');
  }
  return {state,days,warnings,transfers:{before:'抵達／跨島日：先確認船票、到港與行李時間，再接住宿附近餐食與休息。這天不算完整薄荷島遊玩日。',after:'離島／離境日：保留碼頭與航班緩衝。麥哲倫十字架另外安排在宿霧市區停留，不插進薄荷島內陸日。'},scope:'這是活動選擇與日程草案，不是即時船班、門票或營業承諾；園區、接送和天候確認後再定順序。'};
}

export function stateFromSearch(search) {
  const p=new URLSearchParams(search);
  return normalizePlan({days:p.get('boholDays')??undefined,pace:p.get('pace')??undefined,buggy:p.get('buggy')??undefined,lunch:p.get('lunch')??undefined});
}

export function planSearch(search,state) {
  const p=new URLSearchParams(search),s=normalizePlan(state);
  for(const [key,value] of Object.entries({boholDays:s.days,pace:s.pace,buggy:s.buggy?'1':'0',lunch:s.lunch?'1':'0'}))p.set(key,String(value));
  return '?'+p.toString();
}
