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

 // The atlas is optional when this controller is reused with only guide discovery.
 if(!document.querySelector('.home-atlas'))return;
 // The atlas uses the same country records as the static links and guide filter.
 const choices=[...document.querySelectorAll('[data-atlas-choice]')];
 const pins=[...document.querySelectorAll('[data-atlas-country]')];
 const panels=[...document.querySelectorAll('[data-country-panel]')];
 const regions=[...document.querySelectorAll('[data-atlas-region]')];
 const atlasMore=document.querySelector('[data-atlas-more]');
 const atlasStatus=document.querySelector('[data-atlas-status]');
 const offers=[...document.querySelectorAll('[data-offer-country]')];
 const commerceEmpty=document.querySelector('[data-commerce-empty]');
 let selectedCountry=choices[0]?.dataset.atlasChoice;
 let selectedRegion='all',expandedCountries=false;
 function selectCountry(id,announce=true){
  const chosen=choices.find(choice=>choice.dataset.atlasChoice===id);
  if(!chosen)return;
  selectedCountry=id;
  panels.forEach(panel=>{panel.hidden=panel.dataset.countryPanel!==id;});
  [...choices,...pins].forEach(control=>{
   const active=(control.dataset.atlasChoice||control.dataset.atlasCountry)===id;
   control.setAttribute('aria-pressed',String(active));
   control.classList.toggle('is-selected',active);
  });
  offers.forEach(offer=>{offer.hidden=offer.dataset.offerCountry!==id;});
  commerceEmpty.hidden=offers.some(offer=>!offer.hidden);
  document.querySelector('.home-affiliate-note').hidden=commerceEmpty.hidden===false;
  if(announce)atlasStatus.textContent=`已選擇${chosen.querySelector('span').textContent}，下方顯示當地照片與指南入口。`;
 }
 function showCountries(){
  const matched=choices.filter(choice=>selectedRegion==='all'||choice.dataset.countryRegion===selectedRegion);
  const visible=new Set(expandedCountries?matched:matched.slice(0,6));
  choices.forEach(choice=>{choice.hidden=!visible.has(choice);});
  pins.forEach(pin=>{pin.hidden=!matched.some(choice=>choice.dataset.atlasChoice===pin.dataset.atlasCountry);});
  atlasMore.hidden=matched.length<=6;
  atlasMore.textContent=expandedCountries?'收合目的地':`展開全部 ${matched.length} 個目的地`;
  atlasMore.setAttribute('aria-expanded',String(expandedCountries));
  regions.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.atlasRegion===selectedRegion)));
  if(!matched.some(choice=>choice.dataset.atlasChoice===selectedCountry)&&matched[0])selectCountry(matched[0].dataset.atlasChoice);
 }
 [...choices,...pins.filter(pin=>pin.dataset.atlasDecorative!=='true')].forEach(control=>{
  control.setAttribute('role','button');
  control.addEventListener('click',event=>{
   if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
   event.preventDefault();selectCountry(control.dataset.atlasChoice||control.dataset.atlasCountry);
  });
  control.addEventListener('keydown',event=>{if(event.key===' '){event.preventDefault();selectCountry(control.dataset.atlasChoice||control.dataset.atlasCountry);}});
 });
 regions.forEach(button=>button.addEventListener('click',()=>{selectedRegion=button.dataset.atlasRegion;expandedCountries=false;showCountries();}));
 atlasMore.addEventListener('click',()=>{expandedCountries=!expandedCountries;showCountries();});
 document.querySelectorAll('[data-explore-country]').forEach(link=>link.addEventListener('click',()=>{
  country.value=link.dataset.exploreCountry;theme.value='all';limit=batchSize;render();
 }));
 document.querySelector('[data-region-filters]').hidden=false;
 if(selectedCountry)selectCountry(selectedCountry,false);
 showCountries();
})();
