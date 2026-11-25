/* Offer is network-only, fails closed, rechecked before navigation. Never a frozen purchase URL. */
const sheetUrl='https://docs.google.com/spreadsheets/d/1-RuyD9eCkrDpgFFXGHRWaTF-LYKaDK-MxAw3uNMozeU/gviz/tq?tqx=out:csv&headers=1&sheet='+encodeURIComponent('現正開團');
const articleKey=document.body.dataset.articleKey;
const article=ProductContent.catalog[articleKey];
// A knowledge guide may refer to a real product without becoming that product article.
const sourceArticleSlug=document.body.dataset.sourceArticleSlug||article?.article.split('/').filter(Boolean).at(-1);
const offerButton=document.querySelector('[data-current-offer]'),statusEl=document.querySelector('#offer-status'),videoEl=document.querySelector('#article-videos');let busy=false,lastState='';
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
    // Stay in place while the reader is still on the title and cover; float only once they scroll.
    const intro=window.scrollY<window.innerHeight*.5;
    bar.classList.toggle('is-floating',available&&!intro&&!homeReached&&!keyboard&&!document.fullscreenElement);
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
    ProductContent.mountKeyFacts?.(articleKey,c,{buy:{onClick:()=>offerButton.click()}});
    // 結團或還沒開團：按鈕改成「開團通知我・加入 LINE」，點了開 LINE 社群（Hiram 2026-11-25）。
    const notifyLine=c.state==='closed'&&ProductContent.LINE_COMMUNITY;
    lastState=notifyLine?'line':c.state;
    const label=c.state==='open'?(offerButton.dataset.openLabel||c.label):notifyLine?'開團通知我・LINE ↗':c.label;
    offerButton.textContent=label;offerButton.disabled=c.state!=='open'&&!notifyLine;offerButton.setAttribute('aria-label',label);offerButton.classList?.toggle('is-line-notify',!!notifyLine);
    if(c.state==='open')offerButton.dataset.desktopFloatingLabel='true';
    floatingOffer.setAvailable(c.state==='open'||!!notifyLine);
    if(c.state==='upcoming'&&ProductContent.upcomingStatus){ProductContent.upcomingStatus(statusEl,c,article.brands[0],'article_offer_status');}else statusEl.textContent=notifyLine?'這一檔已結團；加入 LINE 社群，下次開團、補貨會第一時間通知你。':c.state==='open'?(c.end?'這一檔團購至 '+c.end.replace(/^(\d{4})-(\d{2})-(\d{2})$/,'$1/$2/$3')+' 23:59。':'這一檔正在開團。'):'目前沒有開放中的團購；仍可閱讀文章或返回團購首頁。';
    const current=ProductContent.rowForArticle(rows,articleKey);
    const list=ProductContent.videos([...seed,...ProductContent.fromRow(current||{})]);
    const signature=JSON.stringify(list);if(videoEl&&signature!==videoSignature){videoEl.replaceChildren();ProductContent.mountVideos(videoEl,list);videoSignature=signature;}
    if(navigate&&c.state==='open'){
      const floating=offerButton.closest('.offer-bar')?.classList.contains('is-floating');
      const destination=ProductContent.withUTM(c.url,article.brands[0]);
      window.SiteAnalytics?.outboundGroupbuy({productId:article.id,productName:article.brands[0],groupType:c.end?'limited':'evergreen',sourceSurface:floating?'blog_floating_cta':'blog_inline_cta',articleSlug:sourceArticleSlug,destinationUrl:destination,ctaLabel:offerButton.textContent,campaignKey:c.end||'evergreen',legacyEvent:'click_group_from_blog'});
      window.location.assign(destination);
    }return c;
  }catch(error){floatingOffer.setAvailable(false);delete offerButton.dataset.desktopFloatingLabel;offerButton.disabled=false;offerButton.textContent='重新確認團購狀態';offerButton.setAttribute('aria-label','重新確認團購狀態');statusEl.textContent='目前無法取得最新資料，未使用過期連結。你可以重試或返回團購首頁。';console.warn(articleKey+' offer unavailable:',error.message);}
  finally{busy=false;}
}
offerButton.addEventListener('click',()=>{
  if(lastState==='line'){window.SiteAnalytics?.track?.('join_line_click',{source_surface:'article_offer',group_name:article.brands[0],transport_type:'beacon'});window.open(ProductContent.LINE_COMMUNITY,'_blank','noopener');return;}
  refreshOffer(true);
});window.addEventListener('focus',()=>refreshOffer());document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshOffer();});refreshOffer();

setInterval(()=>{if(!document.hidden)refreshOffer();},300000);
