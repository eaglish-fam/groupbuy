(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else{root.LeofooGuide=api;api.mount();}})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const plans={A:{brand:'六福莊住宿 A｜樂園無限玩',url:'https://pse.is/9p7sug',end:'2026-10-07T23:59:59+08:00'},B:{brand:'六福莊住宿 B｜經典探險',url:'https://pse.is/9p7svd',end:'2026-10-07T23:59:59+08:00'},C:{brand:'六福莊住宿 C｜FUN肆玩樂季',url:'https://pse.is/9p7svv',end:'2026-10-07T23:59:59+08:00'}};
  const csv='https://docs.google.com/spreadsheets/d/1-RuyD9eCkrDpgFFXGHRWaTF-LYKaDK-MxAw3uNMozeU/gviz/tq?tqx=out:csv&headers=1&sheet=%E7%8F%BE%E6%AD%A3%E9%96%8B%E5%9C%98';
  function choose({people,stairs,view,trip}){
    const count=Number(people),many=count>4,over=count>6,avoid=stairs==='avoid';
    let room=over?'請分房，並洽飯店安排':many&&avoid?'請洽飯店安排剛果分房':many?'肯亞樓中樓':avoid?'剛果單層':'先比較剛果單層';
    const viewName={blue:'藍天',grass:'草原',green:'綠地'}[view];if(viewName&&!room.startsWith('請'))room+='，再看'+viewName+'景觀';
    const reason=over?'剛果最多四人、肯亞最多六人；七人以上可詢問飯店分房安排。':many&&avoid?'肯亞在二樓且房內有樓梯，飯店沒有電梯；希望避開樓梯，可詢問剛果分房安排。':many?'五至六人先看肯亞樓中樓，三張雙人床可分配睡眠空間。':avoid?'剛果在一樓，床和衛浴都在同一層，不用爬樓梯。':'四人以內可先看剛果單層；想要更多空間，也可以比較肯亞樓中樓。';
    const tripReason={park:'住一晚以樂園為主，想提早進園，先問好入園方式和行李寄放。',animal:'想加動物體驗，河馬、草原歷險、大羚羊的場次和年齡限制不同，先看下方再預約。',slow:'住兩晚，把晚餐和 DIY 分到不同天；惡靈餐廳只在指定日期開餐，要先訂位。'}[trip]||'';
    return {room,trip,reason:reason+tripReason};
  }
  function resolve(rows,PC,now=new Date()){
    const date=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
    const live=PC.campaignFor(rows,'leofoo',date).plans||{};
    return Object.fromEntries(Object.entries(plans).map(([id,p])=>{
      const found=live[id];
      if(now>new Date(p.end))return [id,{state:'closed',label:'本次訂房已截止'}];
      if(found?.state!=='open')return [id,{state:found?.state||'unavailable',label:found?.label||'訂房入口待確認'}];
      if(found.url!==p.url||found.end!==p.end.slice(0,10))return [id,{state:'unavailable',label:'方案內容更新，請先確認'}];
      return [id,{state:'open',label:'查看 '+id+' 方案日期與總額 ↗',url:p.url}];
    }));
  }
  function mount(){
    const picker=document.querySelector('#room-picker'),result=document.querySelector('#picker-result');
    picker?.addEventListener('submit',e=>{e.preventDefault();const selected=choose(Object.fromEntries(new FormData(picker)));const h=document.createElement('h3'),p=document.createElement('p');h.textContent=selected.room;p.textContent=selected.reason;result.replaceChildren(h,p);});
    if(document.querySelector('#family-video'))ProductContent.mountVideos(document.querySelector('#family-video'),'https://www.youtube.com/watch?v=i5yGptoSF0M');
    let busy=false;
    async function refresh(clicked){
      if(busy)return;busy=true;
      const buttons=[...document.querySelectorAll('[data-plan]')];buttons.forEach(b=>b.disabled=true);
      try{
        const response=await fetch(csv,{cache:'no-store',signal:AbortSignal.timeout(12000)});if(!response.ok)throw Error('sheet_unavailable');
        const parsed=Papa.parse(await response.text()).data,rows=ProductContent.sheetRows(parsed),resolved=resolve(rows,ProductContent);
        for(const button of buttons){const p=resolved[button.dataset.plan];button.textContent=p.label;button.disabled=p.state!=='open';document.querySelector(`[data-plan-status="${button.dataset.plan}"]`).textContent=p.state==='open'?'請填完整日期與同行者。':'請到團購首頁確認最新資訊。';}
        if(clicked&&resolved[clicked]?.state==='open')window.location.assign(resolved[clicked].url);
      }catch{buttons.forEach(b=>{b.disabled=true;b.textContent='訂房入口暫時無法確認';document.querySelector(`[data-plan-status="${b.dataset.plan}"]`).textContent='請稍後重試，或到團購首頁查看。';});}
      finally{busy=false;}
    }
    document.querySelectorAll('[data-plan]').forEach(b=>b.addEventListener('click',()=>refresh(b.dataset.plan)));
    const more=document.querySelector('.purchase .more');if(more&&window.ArticleFloatingOffer)window.ArticleFloatingOffer.mount(more);
    if(document.querySelector('[data-plan]')){window.addEventListener('focus',()=>refresh());refresh();setInterval(()=>refresh(),300000);}
  }
  return {choose,resolve,plans,mount};
});
