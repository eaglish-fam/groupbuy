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
 let synchronizeDestination=null;
 const matches=()=>cards.filter(card=>(country.value==='all'||card.dataset.country===country.value)&&(theme.value==='all'||card.dataset.themes.split(' ').includes(theme.value)));
 function render(){
  const matched=matches();
  const visible=new Set(matched.slice(0,limit));
  cards.forEach(card=>{card.hidden=!visible.has(card);});
  empty.hidden=matched.length!==0;
  more.hidden=matched.length<=limit;
  more.textContent=`再看 ${Math.min(batchSize,Math.max(0,matched.length-limit))} 份指南 ↓`;
  const selected=[country.value!=='all'?country.selectedOptions[0]?.textContent||'':'',theme.value!=='all'?theme.selectedOptions[0].textContent:''].filter(Boolean).join('・');
  status.textContent=`${selected?selected+' · ':''}${matched.length} 份指南${matched.length>limit?`，先看 ${limit} 份`:''}`;
 }
 form.addEventListener('submit',event=>event.preventDefault());
 form.addEventListener('change',event=>{
  limit=batchSize;
  if(synchronizeDestination&&event.target===country)synchronizeDestination(country.value);
  else render();
 });
 form.addEventListener('reset',event=>{event.preventDefault();theme.value='all';limit=batchSize;
  if(synchronizeDestination)synchronizeDestination('all');
  else {country.value='all';render();}});
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
 const configNode=document.querySelector('#home-globe-config');
 if(!configNode)return;
 const config=JSON.parse(configNode.textContent);
 const choices=[...document.querySelectorAll('[data-atlas-choice]')];
 const panels=[...document.querySelectorAll('[data-country-panel]')];
 const regionButtons=[...document.querySelectorAll('[data-atlas-region]')];
 const subButtons=[...document.querySelectorAll('[data-atlas-subregion]')];
 const subGroups=[...document.querySelectorAll('[data-subregion-group]')];
 const atlasMore=document.querySelector('[data-atlas-more]');
 const atlasStatus=document.querySelector('[data-atlas-status]');
 const offers=[...document.querySelectorAll('[data-offer-country]')];
 const commerceEmpty=document.querySelector('[data-commerce-empty]');
 const emptyPanel=document.querySelector('[data-atlas-empty]');
 const back=document.querySelector('[data-atlas-back]');
 const scopeLabel=document.querySelector('[data-atlas-scope]');
 const host=document.querySelector('[data-globe-host]');
 const enable=document.querySelector('[data-globe-enable]');
 const resetView=document.querySelector('[data-globe-reset]');
 const globeMessage=document.querySelector('[data-globe-message]');
 let selectedCountry='',selectedRegion=config.initialRegion,selectedSubregion='all',expandedCountries=false;
 let globe=null,globeTask=null;
 const world={id:'all',label:'世界',center:[112,22],children:[]};
 const region=()=>config.regions.find(r=>r.id===selectedRegion)||world;
 const scope=()=>region().children.find(r=>r.id===selectedSubregion)||region();
 let desiredView={center:region().center,countryId:'',regionId:selectedRegion};

 function loadGlobe(){
  if(!host||!enable)return Promise.resolve();
  if(globe){globe.setView(desiredView);return Promise.resolve(globe);}
  if(globeTask)return globeTask;
  enable.disabled=true;host.setAttribute('aria-busy','true');
  globeMessage.textContent='地球載入中，國家清單仍可操作。';
  globeTask=import('/trip/globe.js?v=20260928-globe-3')
   .then(module=>module.mountGlobe(host,{countries:config.countries,region:config.regions.find(r=>r.id===config.initialRegion),selectedCountry:config.countries[0]?.id}))
   .then(instance=>{
    globe=instance;globe.setView(desiredView);enable.hidden=true;resetView.hidden=false;
    globeMessage.textContent='左右拖曳，或用方向鍵轉動。';
    return instance;
   }).catch(()=>{
    globeTask=null;enable.textContent='重新載入地球';
    globeMessage.textContent='暫時顯示靜態預覽，仍可從清單選目的地。';
   }).finally(()=>{enable.disabled=false;host.setAttribute('aria-busy','false');});
  return globeTask;
 }
 function moveGlobe(center,activate=true){
  desiredView={center,countryId:selectedCountry==='all'?'':selectedCountry,regionId:selectedSubregion==='all'?selectedRegion:selectedSubregion};
  if(activate)loadGlobe();
  else if(globe)globe.setView(desiredView);
 }
 function selectCountry(id,{announce=true,move=true}={}){
  const chosen=choices.find(choice=>choice.dataset.atlasChoice===id);
  const nextCountry=chosen?id:id==='all'?'all':'';
  if(country.value!==nextCountry)limit=batchSize;
  selectedCountry=nextCountry;
  country.value=selectedCountry;
  const unavailable=document.querySelector('[data-country-unavailable]');
  if(unavailable)unavailable.hidden=selectedCountry!=='';
  render();
  panels.forEach(panel=>{panel.hidden=panel.dataset.countryPanel!==selectedCountry;});
  choices.forEach(control=>{
   const active=control.dataset.atlasChoice===selectedCountry;
   control.setAttribute('aria-pressed',String(active));control.classList.toggle('is-selected',active);
  });
  offers.forEach(offer=>{offer.hidden=selectedCountry!=='all'&&offer.dataset.offerCountry!==selectedCountry;});
  commerceEmpty.hidden=offers.some(offer=>!offer.hidden);
  document.querySelector('.home-affiliate-note').hidden=!commerceEmpty.hidden;
  emptyPanel.hidden=Boolean(chosen);
  document.querySelector('[data-atlas-empty-copy]').textContent=selectedCountry==='all'
   ?'從清單選一個國家，照片、指南與活動會一起切換。下方目前顯示所有目的地。'
   :`${scope().label}目前沒有公開的旅行指南。你可以繼續探索地球，或看看已有的目的地。`;
  document.querySelector('[data-atlas-return]').hidden=selectedCountry==='all';
  if(chosen&&announce)atlasStatus.textContent=`已選擇${chosen.querySelector('span').textContent}，顯示當地照片與指南入口。`;
  if(move){
   const record=config.countries.find(c=>c.id===selectedCountry);
   moveGlobe(record?.geography?.point||scope().center);
  }
 }
 function showCountries(activate=true,preferred){
  const matched=choices.filter(choice=>(selectedRegion==='all'||choice.dataset.countryRegion===selectedRegion)&&(selectedSubregion==='all'||choice.dataset.countrySubregion===selectedSubregion));
  const keep=matched.some(choice=>choice.dataset.atlasChoice===selectedCountry);
  const nextCountry=preferred??(keep?selectedCountry:matched[0]?.dataset.atlasChoice);
  const visible=new Set(expandedCountries?matched:matched.slice(0,6));
  const selectedChoice=matched.find(choice=>choice.dataset.atlasChoice===nextCountry);
  if(selectedChoice&&!visible.has(selectedChoice)){
   visible.delete([...visible].at(-1));visible.add(selectedChoice);
  }
  choices.forEach(choice=>{choice.hidden=!visible.has(choice);});
  atlasMore.hidden=matched.length<=6;
  atlasMore.textContent=expandedCountries?'收合目的地':`展開全部 ${matched.length} 個目的地`;
  atlasMore.setAttribute('aria-expanded',String(expandedCountries));
  regionButtons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.atlasRegion===selectedRegion)));
  subGroups.forEach(group=>{group.hidden=group.dataset.subregionGroup!==selectedRegion;});
  subButtons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.atlasSubregion===selectedSubregion)));
  scopeLabel.textContent=selectedSubregion==='all'?region().label:`${region().label} ／ ${scope().label}`;
  back.textContent=selectedSubregion==='all'?'← 世界':`← ${region().label}`;
  back.hidden=selectedRegion==='all';
  document.querySelector('[data-atlas-count]').textContent=`${matched.length} 個目的地`;
  document.querySelector('[data-atlas-country-heading]').textContent=`${scope().label}的旅行指南`;
  selectCountry(nextCountry,{announce:false,move:false});
  atlasStatus.textContent=`${scope().label}，${matched.length} 個已公開目的地。`;
  const record=preferred&&config.countries.find(c=>c.id===preferred);
  moveGlobe(record?.geography?.point||scope().center,activate);
 }
 synchronizeDestination=id=>{
  const record=config.countries.find(c=>c.id===id);
  selectedRegion=record?.region||'all';
  selectedSubregion=record?.subregion||'all';
  expandedCountries=false;
  showCountries(true,record?record.id:'all');
 };
 choices.forEach(control=>{
  control.setAttribute('role','button');
  control.addEventListener('click',event=>{
   if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
   event.preventDefault();selectCountry(control.dataset.atlasChoice);
  });
  control.addEventListener('keydown',event=>{if(event.key===' '){event.preventDefault();selectCountry(control.dataset.atlasChoice);}});
 });
 regionButtons.forEach(button=>button.addEventListener('click',()=>{selectedRegion=button.dataset.atlasRegion;selectedSubregion='all';expandedCountries=false;showCountries();}));
 subButtons.forEach(button=>button.addEventListener('click',()=>{selectedRegion=button.dataset.parentRegion;selectedSubregion=button.dataset.atlasSubregion;expandedCountries=false;showCountries();}));
 back.addEventListener('click',()=>{if(selectedSubregion!=='all')selectedSubregion='all';else selectedRegion='all';expandedCountries=false;showCountries();});
 document.querySelector('[data-atlas-return]').addEventListener('click',()=>{selectedRegion='all';selectedSubregion='all';expandedCountries=true;showCountries();});
 atlasMore.addEventListener('click',()=>{expandedCountries=!expandedCountries;showCountries(false,selectedCountry);});
 document.querySelectorAll('[data-explore-country]').forEach(link=>link.addEventListener('click',()=>{theme.value='all';limit=batchSize;synchronizeDestination(link.dataset.exploreCountry);}));
 enable?.addEventListener('click',()=>loadGlobe());
 resetView?.addEventListener('click',()=>moveGlobe(scope().center));
 document.querySelector('[data-region-filters]').hidden=false;
 document.querySelector('[data-subregions]').hidden=false;
 document.querySelector('[data-atlas-breadcrumb]').hidden=false;
 if(host)document.querySelector('[data-globe-toolbar]').hidden=false;
 showCountries(false);
})();
