import {geoOrthographic,geoPath,geoGraticule10,geoDistance} from 'd3-geo';
import {feature} from 'topojson-client';

const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const longitude=value=>((value+180)%360+360)%360-180;
const isPoint=value=>Array.isArray(value)&&value.length===2&&value.every(Number.isFinite)&&Math.abs(value[0])<=180&&Math.abs(value[1])<=90;

/**
 * Optional enhancement. Call only after a user chooses to interact with the atlas.
 * Country selection remains in the accessible external list, never canvas hit tests.
 * region may be {id,center:[longitude,latitude]} or a region ID. selectedCountry
 * may be the catalog ID or record. Explicit setView centers take precedence.
 */
export async function mountGlobe(host,{countries=[],region,selectedCountry,onSelect}={}){
 if(!host||typeof host.appendChild!=='function')throw new Error('Globe host is required');
 const canvas=document.createElement('canvas');
 const context=canvas.getContext('2d');
 if(!context)throw new Error('Canvas is unavailable');
 const abort=new AbortController();
 const timeout=setTimeout(()=>abort.abort(),15000);
 let topology;
 try{
  const response=await fetch(new URL('./globe-land.json',import.meta.url),{signal:abort.signal,credentials:'same-origin'});
  if(!response.ok)throw new Error('Globe geography unavailable');
  topology=await response.json();
 }finally{clearTimeout(timeout);}
 if(topology?.type!=='Topology'||!topology.objects?.land||!topology.objects?.countries||!Array.isArray(topology.arcs))throw new Error('Invalid globe geography');
 const land=feature(topology,topology.objects.land);
 const boundaries=feature(topology,topology.objects.countries).features;
 const byIso=new Map(boundaries.map(item=>[String(item.id).padStart(3,'0'),item]));
 const catalog=new Map(countries.map(country=>[country.id,country]));
 const initialId=typeof selectedCountry==='string'?selectedCountry:selectedCountry?.id;
 let currentId=initialId||countries[0]?.id;
 let regionId=typeof region==='string'?region:region?.id;
 const initialPoint=region?.center||catalog.get(currentId)?.geography?.point;
 let center=isPoint(initialPoint)?[initialPoint[0],clamp(initialPoint[1],-75,75)]:[0,20];
 let width=640,height=440,destroyed=false,frame=0,drag=null,transition=null;
 const reducedMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)');
 const projection=geoOrthographic().clipAngle(90).precision(.4);
 const path=geoPath(projection,context);
 const graticule=geoGraticule10();
 const fallback=host.querySelector('[data-globe-fallback]')||host.querySelector('svg');
 const fallbackHidden=fallback?.hidden;
 const fallbackDisplay=fallback?.style.display;
 canvas.className='home-globe-canvas';
 canvas.tabIndex=0;
 canvas.setAttribute('role','img');
 canvas.setAttribute('aria-label','可旋轉的地球。左右拖曳或使用方向鍵轉動；請從國家清單選擇目的地。');
 canvas.style.cssText='display:block;width:100%;height:auto;aspect-ratio:640/440;touch-action:pan-y;cursor:grab;outline-offset:-4px;border-radius:inherit;';

 function paint(shape,fill,stroke,lineWidth=.7){
  context.beginPath();path(shape);
  if(fill){context.fillStyle=fill;context.fill();}
  if(stroke){context.strokeStyle=stroke;context.lineWidth=lineWidth;context.stroke();}
 }
 function draw(){
  if(destroyed)return;
  const dpr=Math.min(1.5,window.devicePixelRatio||1);
  width=Math.max(220,host.clientWidth||640);
  height=width*440/640;
  const pixelWidth=Math.round(width*dpr),pixelHeight=Math.round(height*dpr);
  if(canvas.width!==pixelWidth||canvas.height!==pixelHeight){canvas.width=pixelWidth;canvas.height=pixelHeight;}
  context.setTransform(dpr,0,0,dpr,0,0);
  context.clearRect(0,0,width,height);
  const scale=width/640,radius=184*scale,cx=width/2,cy=213*scale;
  projection.scale(radius).translate([cx,cy]).rotate([-center[0],-center[1],0]);
  // Match the static SVG's exact sphere, ring, shadow and palette on upgrade.
  context.beginPath();context.ellipse(325*scale,418*scale,126*scale,7*scale,0,0,Math.PI*2);context.fillStyle='rgba(88,77,57,.08)';context.fill();
  context.beginPath();context.arc(cx,cy,191*scale,0,Math.PI*2);context.strokeStyle='#bdc9bc';context.lineWidth=.8*scale;context.stroke();
  const sea=context.createRadialGradient(cx-radius*.36,cy-radius*.52,0,cx-radius*.36,cy-radius*.52,radius*1.56);
  sea.addColorStop(0,'#bed5cc');sea.addColorStop(.65,'#80a69b');sea.addColorStop(1,'#4d716c');
  paint({type:'Sphere'},sea);
  paint(graticule,null,'rgba(230,239,228,.45)',.55*scale);
  paint(land,'#eadfc5','#b9b49b',.65*scale);
  const selected=catalog.get(currentId);
  const outline=selected?.geography?.isoNumeric&&byIso.get(selected.geography.isoNumeric);
  if(outline)paint(outline,'#b97451','#875c41',.8*scale);
  // Light/shade is cosmetic; geographic clipping is handled by the projection.
  context.save();context.beginPath();path({type:'Sphere'});context.clip();
  const light=context.createRadialGradient(cx-radius*.44,cy-radius*.6,0,cx-radius*.44,cy-radius*.6,radius*1.6);
  light.addColorStop(0,'rgba(255,247,223,.24)');light.addColorStop(.65,'rgba(255,247,223,0)');light.addColorStop(1,'rgba(35,68,64,.22)');
  context.fillStyle=light;context.fillRect(0,0,width,height);context.restore();
  for(const country of countries){
   if(regionId&&regionId!=='all'&&country.region!==regionId&&country.subregion!==regionId)continue;
   const point=country.geography?.point;
   if(!isPoint(point)||geoDistance(center,point)>=Math.PI/2-.015)continue;
   const projected=projection(point);if(!projected)continue;
   const active=country.id===currentId;
   context.beginPath();context.arc(projected[0],projected[1],(active?5:3)*scale,0,Math.PI*2);
   context.fillStyle=active?'#774735':'#95755b';context.fill();context.strokeStyle='#fff7e9';context.lineWidth=(active?2:1.2)*scale;context.stroke();
  }
 }
 function stopTravel(finish=false){
  if(finish&&transition)center=[...transition.to];
  transition=null;host.classList.remove('is-travelling');
  if(frame){cancelAnimationFrame(frame);frame=0;}
 }
 function tick(now){
  frame=0;
  if(destroyed)return;
  if(document.hidden){stopTravel(true);return;}
  if(transition){
   const progress=clamp((now-transition.started)/320,0,1);
   const eased=1-Math.pow(1-progress,3);
   center=[longitude(transition.from[0]+transition.delta*eased),transition.from[1]+(transition.to[1]-transition.from[1])*eased];
   if(progress>=1){center=[...transition.to];transition=null;host.classList.remove('is-travelling');}
  }
  draw();
  if(transition)requestDraw();
 }
 function requestDraw(){
  if(destroyed||frame||document.hidden)return;
  frame=requestAnimationFrame(tick);
 }
 function setView({center:nextCenter,countryId,regionId:nextRegion}={}){
  if(destroyed)return;
  if(nextCenter!==undefined&&!isPoint(nextCenter))throw new Error('Globe center needs valid longitude and latitude');
  if(countryId!==undefined)currentId=countryId;
  if(nextRegion!==undefined)regionId=nextRegion;
  stopTravel();
  if(nextCenter!==undefined){
   const target=[nextCenter[0],clamp(nextCenter[1],-75,75)];
   if(reducedMotion?.matches||document.hidden){center=target;}
   else if(Math.abs(longitude(target[0]-center[0]))+Math.abs(target[1]-center[1])>.1){
    transition={from:[...center],to:target,delta:longitude(target[0]-center[0]),started:performance.now()};
    host.classList.add('is-travelling');
   }else center=target;
  }
  requestDraw();
 }
 function visibility(){
  if(document.hidden)stopTravel(true);
  else requestDraw();
 }
 function motionChanged(){
  if(reducedMotion?.matches){stopTravel(true);requestDraw();}
 }
 function down(event){
  if(event.isPrimary===false||event.button!==0)return;
  stopTravel();
  drag={pointer:event.pointerId,x:event.clientX,y:event.clientY,origin:[...center],active:event.pointerType!=='touch',touch:event.pointerType==='touch'};
  if(drag.active){canvas.setPointerCapture?.(event.pointerId);canvas.style.cursor='grabbing';}
 }
 function move(event){
  if(!drag||event.pointerId!==drag.pointer)return;
  const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
  if(!drag.active){
   // Wait for a horizontal gesture. Vertical touches retain native page scrolling.
   if(Math.abs(dx)<8||Math.abs(dx)<Math.abs(dy)*1.15)return;
   drag.active=true;canvas.setPointerCapture?.(event.pointerId);canvas.style.cursor='grabbing';
  }
  if(event.cancelable)event.preventDefault();
  const sensitivity=150/Math.max(220,width);
  center=[longitude(drag.origin[0]-dx*sensitivity),clamp(drag.origin[1]+dy*sensitivity,-75,75)];
  requestDraw();
 }
 function up(event){
  if(!drag||event.pointerId!==drag.pointer)return;
  try{if(canvas.hasPointerCapture?.(event.pointerId))canvas.releasePointerCapture(event.pointerId);}catch{}
  drag=null;canvas.style.cursor='grab';
 }
 function key(event){
  const movement={ArrowLeft:[-7,0],ArrowRight:[7,0],ArrowUp:[0,5],ArrowDown:[0,-5]}[event.key];
  if(!movement)return;
  stopTravel();
  event.preventDefault();center=[longitude(center[0]+movement[0]),clamp(center[1]+movement[1],-75,75)];requestDraw();
 }
 const listeners=[['pointerdown',down],['pointermove',move],['pointerup',up],['pointercancel',up],['lostpointercapture',up],['keydown',key]];
 let observer;
 const resized=()=>requestDraw();
 // Nothing is mounted until the asset has decoded and the first draw succeeds.
 draw();
 host.appendChild(canvas);
 if(fallback){fallback.hidden=true;fallback.style.display='none';}
 host.dataset.globeReady='true';
 listeners.forEach(([name,listener])=>canvas.addEventListener(name,listener));
 document.addEventListener('visibilitychange',visibility);
 reducedMotion?.addEventListener?.('change',motionChanged);
 if(typeof ResizeObserver==='function'){observer=new ResizeObserver(resized);observer.observe(host);}
 else window.addEventListener('resize',resized);
 return {setView,destroy(){
  if(destroyed)return;destroyed=true;stopTravel();
  observer?.disconnect();window.removeEventListener('resize',resized);
  document.removeEventListener('visibilitychange',visibility);
  reducedMotion?.removeEventListener?.('change',motionChanged);
  listeners.forEach(([name,listener])=>canvas.removeEventListener(name,listener));
  canvas.remove();delete host.dataset.globeReady;
  if(fallback){fallback.hidden=fallbackHidden;fallback.style.display=fallbackDisplay;}
 }};
}
