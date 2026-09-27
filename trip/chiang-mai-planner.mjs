import {resizePlan,replaceDay} from './bangkok-planner-model.mjs';
import {dayOfTrip,available} from './chiang-mai-planner-model.mjs';
const root=document.querySelector('[data-cnx-planner]');
if(root){
 const config=JSON.parse(document.getElementById('cnx-planner-data').textContent);
 const controls=root.querySelector('.bkk-planner-controls'),days=root.querySelector('#cnx-days'),date=root.querySelector('#cnx-date'),choice=root.querySelector('#cnx-route'),switcher=root.querySelector('.bkk-day-switcher'),status=root.querySelector('[role="status"]');
 const panels=[...root.querySelectorAll('[data-route-id]')];
 let plan=resizePlan([],2,config),active=0,pace='relaxed';
 const label=id=>config.routes.find(r=>r.id===id).label.split('｜').at(-1);
 const dayLabel=i=>{const d=dayOfTrip(date.value,i);return d?`${d.iso.slice(5)}（${'日一二三四五六'[d.weekday]}）`:`第 ${i+1} 天`;};
 function render(rebuild=false){
  days.value=String(plan.length);
  if(rebuild)switcher.replaceChildren(...plan.map((id,i)=>{const b=document.createElement('button');b.type='button';b.addEventListener('click',()=>{active=i;render();});return b;}));
  [...switcher.children].forEach((b,i)=>{b.textContent=`${dayLabel(i)} · ${label(plan[i])}`;b.setAttribute('aria-pressed',String(i===active));b.setAttribute('aria-controls',`route-${plan[i]}`);});
  choice.value=plan[active];choice.labels[0].textContent=`${dayLabel(active)} 想換去哪區？`;
  const currentDate=dayOfTrip(date.value,active);
  panels.forEach(panel=>{
   panel.hidden=panel.dataset.routeId!==plan[active];panel.open=!panel.hidden;
   panel.querySelectorAll('[data-pace]').forEach(el=>{el.hidden=el.dataset.pace!==pace;if(el.tagName==='DETAILS')el.open=!el.hidden;});
   panel.querySelectorAll('[data-weekdays]').forEach(el=>{const open=available(el.dataset.weekdays.split(',').map(Number),currentDate);el.querySelector('[data-open-step]').hidden=!open;el.querySelector('[data-closed-step]').hidden=open;});
  });
  status.textContent=`${plan.length} 天${pace==='compact'?'緊湊':'悠閒'}試排 · ${dayLabel(active)}：${label(plan[active])}${currentDate?.weekday===0&&plan[active]==='north'?'。週日紙園中文導覽不提供；請確認其他語言場次，或與另一日交換。':''}${!currentDate?'。未選日期，請核對週末與週日條件。':plan[active]==='city'&&currentDate.weekday!==0?'。這天沒有週日市集，已替換晚餐安排。':''}`;
 }
 days.addEventListener('change',()=>{plan=resizePlan(plan,Number(days.value),config);active=Math.min(active,plan.length-1);render(true);});
 date.addEventListener('change',()=>render());
 choice.addEventListener('change',()=>{const other=plan.indexOf(choice.value);plan=replaceDay(plan,active,choice.value,config);render();if(other>=0&&other!==active)status.textContent+=` 已和第 ${other+1} 天交換。`;});
 root.querySelectorAll('[name="cnx-pace"]').forEach(input=>input.addEventListener('change',()=>{if(input.checked){pace=input.value;render();}}));
 function reveal(){const panel=panels.find(p=>`#${p.id}`===location.hash);if(!panel)return;const i=plan.indexOf(panel.dataset.routeId);if(i<0)plan=replaceDay(plan,active,panel.dataset.routeId,config);else active=i;render();panel.scrollIntoView({block:'start'});}
 render(true);controls.hidden=false;root.querySelector('.bkk-planner-fallback').hidden=true;
 window.addEventListener('hashchange',reveal);reveal();
}
