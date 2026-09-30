import {planCebuBohol,stateFromSearch,planSearch} from './cebu-bohol-planner-model.mjs';
const host=document.querySelector('[data-cb-planner]');
if(host) {
  const form=host.querySelector('form'),output=host.querySelector('[data-plan-output]');
  let active=1;
  const make=(tag,text,className)=>{const el=document.createElement(tag);if(text)el.textContent=text;if(className)el.className=className;return el;};
  function apply(state){for(const key of ['days','pace'])form.elements[key].value=String(state[key]);for(const key of ['buggy','lunch'])form.elements[key].checked=state[key];}
  function render({share=false}={}) {
    const plan=planCebuBohol({days:form.elements.days.value,pace:form.elements.pace.value,buggy:form.elements.buggy.checked,lunch:form.elements.lunch.checked});
    active=Math.min(active,plan.days.length);output.replaceChildren();
    const summary=make('p',`${plan.state.days} 個完整薄荷島遊玩日 · ${plan.state.pace==='packed'?'緊湊':'悠閒'}`,'cb-plan-summary');output.append(summary);
    const tabs=make('div',null,'cb-day-tabs');tabs.setAttribute('role','group');tabs.setAttribute('aria-label','選擇要看的完整遊玩日');
    for(const d of plan.days){const button=make('button',`第 ${d.number} 個完整日`);button.type='button';button.setAttribute('aria-pressed',String(d.number===active));button.addEventListener('click',()=>{active=d.number;render();output.querySelectorAll('.cb-day-tabs button')[active-1].focus();});tabs.append(button);}
    output.append(tabs);
    const selected=plan.days[active-1],list=make('ol',null,'cb-plan-stops');
    for(const stop of selected.stops){const li=make('li'),a=make('a',stop.label);a.href=stop.href;li.append(a,make('p',stop.note));list.append(li);}
    if(!selected.stops.length)output.append(make('p','這天留給住宿附近活動、用餐與休息。'));
    output.append(list,make('p',selected.rest));
    if(plan.warnings.length){const warnings=make('ul',null,'cb-plan-warnings');for(const text of plan.warnings)warnings.append(make('li',text));output.append(warnings);}
    const transfers=make('div',null,'cb-transfer-notes');transfers.append(make('h4','完整日之外，再留移動與宿霧停留'),make('p',plan.transfers.before),make('p',plan.transfers.after));output.append(transfers,make('p',plan.scope,'cb-plan-note'));
    if(share)history.replaceState(null,'',location.pathname+planSearch(location.search,plan.state)+location.hash);
  }
  form.addEventListener('submit',e=>e.preventDefault());form.addEventListener('change',()=>{active=1;render({share:true});});
  window.addEventListener('popstate',()=>{apply(stateFromSearch(location.search));active=1;render();});
  apply(stateFromSearch(location.search));render();form.hidden=false;
}
