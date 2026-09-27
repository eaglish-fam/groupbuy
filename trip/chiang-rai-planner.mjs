import {resizePlan,replaceDay} from './bangkok-planner-model.mjs';
import {stopOwners} from './chiang-rai-planner-model.mjs';
const root=document.querySelector('[data-cei-planner]');
if(root){
 const config=JSON.parse(document.querySelector('#cei-plan-data').textContent),days=root.querySelector('#cei-days'),route=root.querySelector('#cei-route'),switcher=root.querySelector('.bkk-day-switcher'),status=root.querySelector('[role=status]');
 let plan=resizePlan([],2,config),active=0,pace='relaxed';
 function render(){
  switcher.replaceChildren(...plan.map((id,i)=>{let b=document.createElement('button');b.type='button';b.textContent=`第 ${i+1} 天 · ${config.routes.find(r=>r.id===id).label.split('｜')[1]}`;b.setAttribute('aria-pressed',String(active===i));b.setAttribute('aria-controls','cei-'+id);b.onclick=()=>{active=i;render();};return b;}));
  route.value=plan[active];
  const owners=stopOwners(plan,pace,config);
  for(const id of plan){const panel=root.querySelector(`[data-route="${id}"]`);for(const li of panel.querySelectorAll(`[data-pace="${pace}"] li[data-place]`)){const repeated=owners[li.dataset.place]!==id;li.querySelector('[data-visit]').hidden=repeated;li.querySelector('[data-repeat]').hidden=!repeated;}}
  root.querySelectorAll('[data-route]').forEach(p=>{p.hidden=p.dataset.route!==plan[active];p.open=!p.hidden;p.querySelectorAll('[data-pace]').forEach(v=>{v.hidden=v.dataset.pace!==pace;if(v.tagName==='DETAILS')v.open=!v.hidden;});});
  status.textContent=`${plan.length} 天 · ${pace==='relaxed'?'悠閒':'緊湊'} · 正在看第 ${active+1} 天。重複景點已換成休息／附近用餐；營業與接待請行前另確認。`;
 }
 days.onchange=()=>{plan=resizePlan(plan,Number(days.value),config);active=Math.min(active,plan.length-1);render();};
 route.onchange=()=>{plan=replaceDay(plan,active,route.value,config);render();};
 root.querySelectorAll('[name=cei-pace]').forEach(x=>x.onchange=()=>{pace=x.value;render();});
 root.querySelector('.bkk-planner-controls').hidden=false;root.querySelector('.bkk-planner-fallback').hidden=true;render();
}
