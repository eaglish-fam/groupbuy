/* Direction hysteresis avoids flicker; no scroll interception or layout-height animation. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else api.install(root.document,root);
})(typeof globalThis==='undefined'?this:globalThis,function(){
  function step(state,position,pinned=false){
    const y=Math.max(0,position),delta=y-state.y;
    if(pinned||y<=20)return {y,direction:0,distance:0,hidden:false};
    if(Math.abs(delta)<2)return {...state,y};
    const direction=Math.sign(delta),distance=direction===state.direction?state.distance+Math.abs(delta):Math.abs(delta);
    let hidden=state.hidden;
    if(direction>0&&distance>=64&&y>100)hidden=true;
    if(direction<0&&distance>=32)hidden=false;
    return {y,direction,distance,hidden};
  }
  function install(doc,win){
    const chrome=doc.querySelector('.journal-chrome'),nav=chrome?.querySelector('.article-filters');
    if(!chrome)return;
    const measure=()=>{doc.documentElement.style.scrollPaddingTop=Math.ceil(chrome.getBoundingClientRect().height+16)+'px';};
    measure();if(win.ResizeObserver)new win.ResizeObserver(measure).observe(chrome);
    if(!nav)return;
    let state={y:Math.max(0,win.scrollY),direction:0,distance:0,hidden:false},frame=0,keyboard=false;
    const apply=()=>{
      chrome.classList.toggle('is-categories-hidden',state.hidden);
      nav.inert=state.hidden;
      if(state.hidden)nav.setAttribute('aria-hidden','true');else nav.removeAttribute('aria-hidden');
    };
    const reveal=()=>{state={y:Math.max(0,win.scrollY),direction:0,distance:0,hidden:false};apply();};
    const update=()=>{
      frame=0;
      // Clamp rubber-band overscroll, including Safari's bottom bounce.
      const max=Math.max(0,doc.documentElement.scrollHeight-win.innerHeight);
      state=step(state,Math.min(max,Math.max(0,win.scrollY)),keyboard&&chrome.contains(doc.activeElement));apply();
    };
    win.addEventListener('scroll',()=>{if(!frame)frame=win.requestAnimationFrame(update);},{passive:true});
    doc.addEventListener('pointerdown',()=>{keyboard=false;},{passive:true});
    doc.addEventListener('keydown',event=>{if(event.key==='Tab'){keyboard=true;reveal();}});
    chrome.addEventListener('focusin',()=>{if(keyboard)reveal();});
    win.addEventListener('pageshow',reveal);
    win.addEventListener('resize',()=>{measure();reveal();},{passive:true});
  }
  return {step,install};
});
