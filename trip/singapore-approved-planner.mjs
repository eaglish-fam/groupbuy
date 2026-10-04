import {approvedDay,selectedRoute,validDate} from './singapore-approved-model.mjs';
import {installPhotoRetry} from './singapore-photo-retry.mjs';
installPhotoRetry(document.querySelectorAll('img'),location.href);
// Reuse the measured, accessible TOC arrival for Singapore's whole cards.
// A native smooth anchor can shift while distant lazy images enter view.
const cards=document.querySelector('.sg-guide #places .bkk-overview');
cards?.addEventListener('click',event=>{
 const card=event.target.closest('a[data-place-ref]');
 if(!card||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||!document.querySelector('aside.reading-nav'))return;
 const chapter=[...document.querySelectorAll('nav.toc a[href^="#"]')].find(a=>a.hash===card.hash);
 if(chapter){event.preventDefault();chapter.click();}
});
const root=document.querySelector('[data-approved-plan]');
if(root){
 const data=JSON.parse(root.querySelector('[data-approved-routes]').textContent),days=root.querySelector('#sg-days'),date=root.querySelector('#sg-date'),switcher=root.querySelector('[data-day-switcher]'),panel=root.querySelector('[data-day-panel]'),status=root.querySelector('[role="status"]'),error=root.querySelector('[data-plan-error]');
 let active=0,pace='leisure',count=2,start='';
 const node=(tag,text)=>{const n=document.createElement(tag);n.textContent=text;return n;};
 const link=(target,label)=>{const a=node('a',label);a.href='#'+target;return a;};
 function render(){
  const {route,day,stops,date:localDate,warnings}=approvedDay(data.routes,count,pace,active,start);
  root.querySelector('[data-route-label]').textContent=route.label;root.querySelector('[data-route-fit]').textContent=route.fit;root.querySelector('[data-route-note]').textContent=route.note;
  if(switcher.children.length!==count)switcher.replaceChildren(...route.days.map((_,i)=>{const b=node('button','');b.type='button';b.dataset.day=String(i);b.setAttribute('aria-controls','sg-day-panel');b.addEventListener('click',()=>{active=i;render();});return b;}));
  [...switcher.children].forEach((b,i)=>{b.textContent=`第 ${i+1} 天 · ${route.days[i].title}`;b.setAttribute('aria-pressed',String(i===active));});
  const list=document.createElement('ol');list.className='sg-approved-stops';
  for(const s of stops){const li=document.createElement('li');li.dataset.stepKind=s.blocked?'blocked':'visit';li.append(node('span',s.blocked?'當日維護':'行程選點'));const body=document.createElement('div');body.append(link(s.target,s.label));if(s.blocked)body.append(node('p','這站當日維護，可改選其他日期，或參考下方選項調整行程。'));li.append(body);list.append(li);}
  const optional=document.createElement('p');if(day.optionalTargets.length){optional.append(node('strong',day.optionalMode==='choose_one'?'下午選一個：':day.optionalMode==='replace'?'可替換：':'加選或替換依上述安排：'));day.optionalTargets.forEach((id,i)=>{if(i)optional.append(document.createTextNode('、'));optional.append(link(id,data.titles[id]));});}
  const ul=document.createElement('ul');ul.className='sg-plan-notes';ul.append(...warnings.map(w=>node('li',w)));
  panel.replaceChildren(node('h3',`第 ${active+1} 個觀光日 · ${day.title}${localDate?' · '+localDate:''}`),list,node('p',day.description),optional,ul);
  status.textContent=`${count} 天${pace==='compact'?'緊湊':'悠閒'}，正在看第 ${active+1} 天：${day.title}。`;
 }
 days.addEventListener('change',()=>{count=Number(days.value);selectedRoute(data.routes,count,pace);active=Math.min(active,count-1);render();});
 root.querySelectorAll('[name="sg-pace"]').forEach(r=>r.addEventListener('change',()=>{if(r.checked){pace=r.value;render();}}));
 date.addEventListener('change',()=>{const invalid=date.validity.badInput||!date.checkValidity()||!validDate(date.value);date.setAttribute('aria-invalid',String(invalid));error.hidden=!invalid;if(invalid){error.textContent='請選有效日期；先前有效日期仍保留。';return;}start=date.value;render();});
 render();root.querySelector('[data-plan-controls]').hidden=false;root.querySelector('[data-plan-fallback]').hidden=true;
}
