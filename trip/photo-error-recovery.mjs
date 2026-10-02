import {canonicalTripPhoto} from './photo-source-identity.mjs';

// Two attempts per element, at most two concurrent refreshes. No new variant,
// query URL, third-party fallback or placeholder. The original attributes survive.
export function startPhotoRecovery(root=document,env=window){
 const records=new Map(),ready=[];let closed=false,active=0,ordinal=0;
 const rectVisible=img=>{const r=img.getBoundingClientRect();return r.width>0&&r.height>0&&r.bottom>0&&r.top<env.innerHeight&&!img.closest('[hidden]');};
 const failed=img=>img.complete&&img.naturalWidth===0;
 const identity=source=>canonicalTripPhoto(source,env.location.href);
 const allowed=img=>{
  const src=img.getAttribute('src'),set=img.getAttribute('srcset')||'';
  if(!src||!identity(src))return false;
  return set.split(',').filter(Boolean).every(s=>identity(s.trim().split(/\s+/)[0]));
 };
 function record(img){
  let r=records.get(img);if(r)return r;
  if(!allowed(img))return null;
  r={img,attempt:0,timer:null,controller:null,timeout:null,busy:false,source:null};records.set(img,r);observer?.observe(img);return r;
 }
 function success(img){const r=records.get(img);if(!r)return;if(r.timer!==null){env.clearTimeout(r.timer);r.timer=null;}if(r.attempt)img.dataset.photoRecovery='recovered';}
 function schedule(img){
  if(closed||!allowed(img))return;
  const r=record(img);if(!r||r.busy||r.timer!==null||!failed(img)||!rectVisible(img))return;
  if(r.attempt>=2){img.dataset.photoRecovery='exhausted';return;}
  const delay=(r.attempt?1500:450)+(ordinal++%4)*120;
  img.dataset.photoRecovery='scheduled';
  r.timer=env.setTimeout(()=>{r.timer=null;if(closed||!img.isConnected||!failed(img)||!rectVisible(img))return;r.busy=true;ready.push(r);pump();},delay);
 }
 function pump(){
  while(!closed&&active<2&&ready.length){const r=ready.shift();if(!r.img.isConnected){r.busy=false;continue;}active++;refresh(r).finally(()=>{active--;r.busy=false;pump();schedule(r.img);});}
 }
 async function refresh(r){
  const img=r.img;if(!failed(img)||!allowed(img))return;
  const attrs={src:img.getAttribute('src'),srcset:img.getAttribute('srcset'),sizes:img.getAttribute('sizes')};
  const selected=img.currentSrc||new URL(attrs.src,env.location.href).href;
  const sources=[attrs.src,...(attrs.srcset||'').split(',').filter(Boolean).map(s=>s.trim().split(/\s+/)[0])];
  if(!identity(selected)||!sources.some(s=>new URL(s,env.location.href).href===selected))return;
  r.attempt++;img.dataset.photoRecoveryAttempts=String(r.attempt);img.dataset.photoRecovery='retrying';
  r.controller=new AbortController();r.timeout=env.setTimeout(()=>r.controller?.abort(),12000);
  try{
   const response=await env.fetch(selected,{cache:'reload',credentials:'same-origin',signal:r.controller.signal});
   if(!response.ok||!response.headers.get('content-type')?.startsWith('image/'))throw Error('Photo refresh failed');
   await response.arrayBuffer();
   if(closed||!img.isConnected||!failed(img))return;
   if(Object.entries(attrs).some(([k,v])=>img.getAttribute(k)!==v))return;
   // Reload from the refreshed same-URL cache, keeping the browser's srcset choice.
   img.removeAttribute('srcset');img.removeAttribute('src');
   if(attrs.srcset!==null)img.setAttribute('srcset',attrs.srcset);
   img.setAttribute('src',attrs.src);
   // load/error listeners finish the state; a failed cache refresh is retried once.
  }catch{if(!closed)img.dataset.photoRecovery=r.attempt>=2?'exhausted':'waiting';}
  finally{env.clearTimeout(r.timeout);r.timeout=null;r.controller=null;}
 }
 const observer=env.IntersectionObserver?new env.IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting)schedule(e.target);}):null;
 const scan=()=>{
  for(const [img,r] of records)if(!img.isConnected){observer?.unobserve(img);if(r.timer!==null)env.clearTimeout(r.timer);r.controller?.abort();records.delete(img);}
  for(const img of root.querySelectorAll('img'))if(allowed(img)){record(img);schedule(img);}
 };
 const onError=e=>{if(e.target?.tagName==='IMG')schedule(e.target);};
 const onLoad=e=>{if(e.target?.tagName==='IMG')success(e.target);};
 const mutations=env.MutationObserver?new env.MutationObserver(scan):null;
 root.addEventListener('error',onError,true);root.addEventListener('load',onLoad,true);
 mutations?.observe(root.body||root,{childList:true,subtree:true});scan();
 function cleanup(){
  if(closed)return;closed=true;root.removeEventListener('error',onError,true);root.removeEventListener('load',onLoad,true);observer?.disconnect();mutations?.disconnect();ready.length=0;
  for(const r of records.values()){if(r.timer!==null)env.clearTimeout(r.timer);if(r.timeout!==null)env.clearTimeout(r.timeout);r.controller?.abort();}records.clear();env.removeEventListener('pagehide',cleanup);
 }
 env.addEventListener('pagehide',cleanup,{once:true});return cleanup;
}
