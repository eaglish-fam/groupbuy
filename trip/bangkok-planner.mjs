import {resizePlan,replaceDay} from './bangkok-planner-model.mjs';

const root=document.querySelector('.bkk-planner');
if(root){
 const config=JSON.parse(document.getElementById('bkk-planner-data').textContent);
 const controls=root.querySelector('.bkk-planner-controls');
 const days=root.querySelector('#bkk-days');
 const choice=root.querySelector('#bkk-route-choice');
 const switcher=root.querySelector('.bkk-day-switcher');
 const status=root.querySelector('[role="status"]');
 const panels=[...root.querySelectorAll('[data-route-id]')];
 let plan=resizePlan([],2,config),active=0;
 const label=id=>config.routes.find(r=>r.id===id).label.split('｜').at(-1);
 function render({rebuild=false,announce=true}={}){
  days.value=String(plan.length);
  if(rebuild){
   switcher.replaceChildren(...plan.map((id,index)=>{
    const button=document.createElement('button');
    button.type='button';button.dataset.day=String(index);
    button.addEventListener('click',()=>{active=index;render();});
    return button;
   }));
  }
  [...switcher.children].forEach((button,index)=>{
   button.textContent=`第 ${index+1} 天 · ${label(plan[index])}`;
   button.setAttribute('aria-pressed',String(index===active));
   button.setAttribute('aria-controls',`route-${plan[index]}`);
  });
  choice.value=plan[active];
  choice.labels[0].textContent=`③ 第 ${active+1} 天想換玩法？`;
  panels.forEach(panel=>{
   const selected=panel.dataset.routeId===plan[active];
   panel.hidden=!selected;
   panel.open=selected;
  });
  if(announce)status.textContent=`${plan.length} 天試排 · 正在看第 ${active+1} 天：${label(plan[active])}`;
 }
 days.addEventListener('change',()=>{
  plan=resizePlan(plan,Number(days.value),config);active=Math.min(active,plan.length-1);
  render({rebuild:true});
 });
 choice.addEventListener('change',()=>{
  const other=plan.indexOf(choice.value);
  plan=replaceDay(plan,active,choice.value,config);render();
  if(other!==-1&&other!==active)status.textContent+=`。已與第 ${other+1} 天交換。`;
 });
 function revealLinkedRoute(){
  const panel=panels.find(p=>`#${p.id}`===location.hash);
  if(!panel)return;
  const index=plan.indexOf(panel.dataset.routeId);
  if(index<0)plan=replaceDay(plan,active,panel.dataset.routeId,config);
  else active=index;
  render();panel.scrollIntoView({block:'start'});
 }
 render({rebuild:true,announce:false});
 controls.hidden=false;
 root.querySelector('.bkk-planner-fallback').hidden=true;
 window.addEventListener('hashchange',revealLinkedRoute);
 revealLinkedRoute();
}
