/* Progressive enhancement: static HTML always contains every country and guide. */
(() => {
 const form=document.querySelector('[data-home-filters]');
 const grid=document.querySelector('[data-home-guides]');
 if(!form||!grid)return;
 const country=form.elements.country;
 const theme=form.elements.theme;
 const cards=[...grid.querySelectorAll('[data-guide-id]')];
 const status=document.querySelector('[data-home-status]');
 const empty=document.querySelector('[data-home-empty]');
 const more=document.querySelector('[data-home-more]');
 const batchSize=6;
 let limit=batchSize;
 const matches=()=>cards.filter(card=>(country.value==='all'||card.dataset.country===country.value)&&(theme.value==='all'||card.dataset.themes.split(' ').includes(theme.value)));
 function render(){
  const matched=matches();
  const visible=new Set(matched.slice(0,limit));
  cards.forEach(card=>{card.hidden=!visible.has(card);});
  empty.hidden=matched.length!==0;
  more.hidden=matched.length<=limit;
  more.textContent=`再看 ${Math.min(batchSize,Math.max(0,matched.length-limit))} 份指南 ↓`;
  const selected=[country.value!=='all'?country.selectedOptions[0].textContent:'',theme.value!=='all'?theme.selectedOptions[0].textContent:''].filter(Boolean).join('・');
  status.textContent=`${selected?selected+' · ':''}${matched.length} 份指南${matched.length>limit?`，先看 ${limit} 份`:''}`;
 }
 form.addEventListener('submit',event=>event.preventDefault());
 form.addEventListener('change',()=>{limit=batchSize;render();});
 form.addEventListener('reset',event=>{event.preventDefault();country.value='all';theme.value='all';limit=batchSize;render();});
 document.querySelector('[data-home-reset]').addEventListener('click',()=>{form.reset();country.focus({preventScroll:true});});
 more.addEventListener('click',()=>{
  const firstNew=matches()[limit];
  limit+=batchSize;
  render();
  firstNew?.querySelector('a')?.focus({preventScroll:true});
 });
 form.hidden=false;
 render();
})();
