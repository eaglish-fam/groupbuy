/* Offer is network-only, fails closed, rechecked before navigation. Never a frozen purchase URL. */
const sheetUrl='https://docs.google.com/spreadsheets/d/1-RuyD9eCkrDpgFFXGHRWaTF-LYKaDK-MxAw3uNMozeU/gviz/tq?tqx=out:csv&headers=1&sheet='+encodeURIComponent('現正開團');
const articleKey=document.body.dataset.articleKey;
const article=ProductContent.catalog[articleKey];
const offerButton=document.querySelector('[data-current-offer]'),statusEl=document.querySelector('#offer-status'),videoEl=document.querySelector('#article-videos');let busy=false;
if(!article)throw Error('Unknown article identity');
// Keep the original button and its click/focus state; reserve its home in the article.
function mountFloatingOffer(button){
  const slot=document.createElement('div');slot.className='offer-slot';
  const bar=document.createElement('div');bar.className='offer-bar';
  button.before(slot);slot.append(bar);bar.append(button);
  let available=false,frame=0;
  function update(){
    frame=0;
    const height=button.getBoundingClientRect().height;
    slot.style.minHeight=height+'px';
    const home=slot.getBoundingClientRect();
    const bottom=parseFloat(getComputedStyle(bar).bottom)||12;
    const viewport=window.visualViewport;
    const editing=document.activeElement?.matches('input,textarea,[contenteditable="true"]');
    const keyboard=editing&&viewport&&viewport.height<window.innerHeight*.8;
    // Once reached, keep it in the article, including while reading the footer.
    // Reverse scrolling restores the float when its home passes below the baseline.
    const homeReached=home.top<=window.innerHeight-bottom-height;
    bar.classList.toggle('is-floating',available&&!homeReached&&!keyboard&&!document.fullscreenElement);
  }
  function schedule(){if(!frame)frame=requestAnimationFrame(update);}
  window.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',schedule,{passive:true});
  window.visualViewport?.addEventListener('resize',schedule,{passive:true});
  document.addEventListener('fullscreenchange',schedule);
  document.addEventListener('focusin',schedule);
  document.addEventListener('focusout',schedule);
  new ResizeObserver(schedule).observe(button);
  // Images and fonts can move the purchase section without a scroll event.
  new ResizeObserver(schedule).observe(document.body);
  return {setAvailable(value){available=value;schedule();}};
}
const floatingOffer=mountFloatingOffer(offerButton);
const seed=ProductContent.videos(videoEl?.dataset.seedVideoUrl?[{title:videoEl.dataset.seedVideoTitle||'使用影片',type:videoEl.dataset.seedVideoType||'使用紀錄',url:videoEl.dataset.seedVideoUrl}]:[]);
if(videoEl&&seed.length)ProductContent.mountVideos(videoEl,seed);
let videoSignature=JSON.stringify(seed);
async function refreshOffer(navigate=false){
  if(busy)return;busy=true;delete offerButton.dataset.desktopFloatingLabel;offerButton.disabled=true;offerButton.textContent='正在核對當期團購…';
  try{
    const r=await fetch(sheetUrl+'&_='+Date.now(),{cache:'no-store',signal:AbortSignal.timeout(12000)});if(!r.ok)throw Error('Sheet HTTP '+r.status);
    const csv=await r.text();if(/^\s*</.test(csv))throw Error('Unexpected HTML');
    const parsed=Papa.parse(csv,{header:false,skipEmptyLines:true});if(parsed.errors.length)throw Error('Invalid CSV');
    const rows=ProductContent.sheetRows(parsed.data),c=ProductContent.campaignFor(rows,articleKey);
    offerButton.textContent=c.label;offerButton.disabled=c.state!=='open';offerButton.setAttribute('aria-label',c.label);
    if(c.state==='open')offerButton.dataset.desktopFloatingLabel='true';
    floatingOffer.setAvailable(c.state==='open');
    statusEl.textContent=c.state==='open'?'已核對當期檔期。價格、庫存與優惠請以廠商賣場為準。':'暫不提供直接購買；仍可閱讀文章或返回團購首頁。';
    const current=rows.find(r=>ProductContent.entry(r['品牌'])?.id===article.id);
    const list=ProductContent.videos([...seed,...ProductContent.fromRow(current||{})]);
    const signature=JSON.stringify(list);if(videoEl&&signature!==videoSignature){videoEl.replaceChildren();ProductContent.mountVideos(videoEl,list);videoSignature=signature;}
    if(navigate&&c.state==='open'){window.SiteAnalytics?.track('click_group_from_blog',{group_name:article.brands[0],event_category:'conversion'});window.location.assign(c.url);}return c;
  }catch(error){floatingOffer.setAvailable(false);delete offerButton.dataset.desktopFloatingLabel;offerButton.disabled=false;offerButton.textContent='重新確認團購狀態';offerButton.setAttribute('aria-label','重新確認團購狀態');statusEl.textContent='目前無法取得最新資料，未使用過期連結。你可以重試或返回團購首頁。';console.warn(articleKey+' offer unavailable:',error.message);}
  finally{busy=false;}
}
offerButton.addEventListener('click',()=>refreshOffer(true));window.addEventListener('focus',()=>refreshOffer());document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshOffer();});refreshOffer();

setInterval(()=>{if(!document.hidden)refreshOffer();},300000);
