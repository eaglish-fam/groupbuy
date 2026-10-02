import {geoOrthographic,geoPath,geoGraticule10,geoDistance,geoContains} from 'd3-geo';
import {feature} from 'topojson-client';
import {fitCircularGlobe,globeLensFrame,cameraKey,interpolateCamera,shortestLongitude,nearestMarker} from './atlas-globe-camera.mjs';
const colors={'tw-north':'#88a99a','tw-central':'#c3b58d','tw-south':'#c89b7d','tw-east':'#a2b7bf','tw-offshore':'#b49dad'};
// Label anchors reuse principal-island coordinates, not new venue/geography data.
export const regionEntries=[
 {id:'tw-north',name:'北部',county:'tw-taoyuan-city',dx:60,dy:-22},
 {id:'tw-central',name:'中部',county:'tw-changhua-county',dx:-62,dy:-18},
 {id:'tw-south',name:'南部',county:'tw-tainan-city',dx:-60,dy:24},
 {id:'tw-east',name:'東部',county:'tw-hualien-county',dx:62,dy:20},
 {id:'tw-offshore',name:'離島',county:'tw-penghu-county',dx:-54,dy:-12},
];
const clamp=(n,low,high)=>Math.max(low,Math.min(high,n));
export const regionLabelPosition=(point,entry,width,height,size={width:72,height:44})=>[clamp(point[0]+entry.dx,8+size.width/2,width-8-size.width/2),clamp(point[1]+(entry.dy||0),8+size.height/2,height-8-size.height/2)];
// Pack measured native rectangles near their real projected anchors. Font zoom
// changes dimensions, never geography or the minimum font size. No idle solver.
export function layoutRegionLabels(items,width,height){
 const placed=[];
 for(const item of items){
  const w=Math.max(72,item.width||72),h=Math.max(44,item.height||44),size={width:w,height:h},desired=regionLabelPosition(item.anchor,item.entry,width,height,size);
  const xs=[desired[0],8+w/2,width-8-w/2],ys=[desired[1],8+h/2,height-8-h/2];
  for(const p of placed){xs.push(p.x-(p.width+w)/2-8,p.x+(p.width+w)/2+8);ys.push(p.y-(p.height+h)/2-8,p.y+(p.height+h)/2+8);}
  const candidates=xs.flatMap(x=>ys.map(y=>({x:clamp(x,8+w/2,width-8-w/2),y:clamp(y,8+h/2,height-8-h/2)}))).sort((a,b)=>Math.hypot(a.x-desired[0],a.y-desired[1])-Math.hypot(b.x-desired[0],b.y-desired[1]));
  const position=candidates.find(c=>placed.every(p=>Math.abs(p.x-c.x)>=(p.width+w)/2+8-1e-6||Math.abs(p.y-c.y)>=(p.height+h)/2+8-1e-6));
  if(!position)throw Error('Region label layout has no edge-safe space');
  placed.push({...item,...position,width:w,height:h});
 }
 return placed;
}
export async function mountUnifiedGlobe(host,{countries=[],view,signal,onSelect=()=>{},onExplore=()=>{},onRegion=()=>{},onCounty=()=>{}}){
 const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');if(!ctx)throw Object.assign(Error('Canvas unavailable'),{stage:'canvas'});
 const abort=new AbortController(),cancel=()=>abort.abort();
 signal?.addEventListener('abort',cancel,{once:true});if(signal?.aborted)abort.abort();
 const timeout=setTimeout(()=>abort.abort(),15000);
 let topology,geometry;
 try{[topology,geometry]=await Promise.all(['globe-land.json','taiwan-counties.json'].map(async name=>{let r;try{r=await fetch(new URL('./'+name,import.meta.url),{signal:abort.signal,credentials:'same-origin'});}catch(error){throw Object.assign(error,{stage:abort.signal.aborted?'timeout':'data_http'});}if(!r.ok)throw Object.assign(Error('Geography unavailable'),{stage:'data_http'});try{return await r.json();}catch(error){throw Object.assign(error,{stage:'data_parse'});}}));}
 catch(error){abort.abort();throw error;}
 finally{clearTimeout(timeout);signal?.removeEventListener('abort',cancel);}
 if(signal?.aborted)throw Object.assign(Error('Mount cancelled'),{stage:'cancelled'});
 if(topology.type!=='Topology'||geometry.type!=='FeatureCollection'||geometry.features.length!==22||geometry.features.reduce((n,f)=>n+f.properties.ringCount,0)!==697)throw Object.assign(Error('Invalid source geography'),{stage:'data_schema'});
 const land=feature(topology,topology.objects.land),boundaries=feature(topology,topology.objects.countries).features;
 const byIso=new Map(boundaries.map(f=>[String(f.id).padStart(3,'0'),f])),graticule=geoGraticule10();
 const projection=geoOrthographic().clipAngle(90).precision(.25),path=geoPath(projection,ctx);
 const motion=window.matchMedia?.('(prefers-reduced-motion: reduce)'),fallback=host.querySelector('[data-globe-fallback]');
 let width=640,height=560,camera=null,target=null,frame=0,transition=null,destroyed=false,drag=null,lastKey='',hits=[];
 const labels=regionEntries.map(r=>{const b=document.createElement('button');b.type='button';b.className='globe-region-label';b.textContent=r.name;b.setAttribute('aria-label','放大'+r.name);b.dataset.action='region';b.dataset.id=r.id;b.addEventListener('click',e=>{e.stopPropagation();onRegion(r.id);});return {entry:r,point:geometry.features.find(f=>f.id===r.county).properties.labelPoint,node:b};});
 canvas.className='home-globe-canvas';canvas.tabIndex=0;canvas.setAttribute('role','img');canvas.setAttribute('aria-label','同一個地球：台灣五區與世界。按 Enter 回台灣全覽；方向鍵旋轉。使用地圖地區按鈕放大。');
 canvas.style.cssText='display:block;width:100%;height:100%;touch-action:pan-y;cursor:grab;outline-offset:-4px;border-radius:inherit';
 const sizing=()=>{width=Math.max(220,host.clientWidth||640);height=host.clientHeight||560;};
 function recipe(v){return v.mode==='taiwan'?fitCircularGlobe(v.bounds,width,height):{center:v.center,scale:globeLensFrame(width,height).radius};}
 function paint(shape,fill,stroke,lineWidth=.7){ctx.beginPath();path(shape);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lineWidth;ctx.stroke();}}
 function draw(){
  if(destroyed)return;sizing();const dpr=Math.min(1.5,window.devicePixelRatio||1);const pw=Math.round(width*dpr),ph=Math.round(height*dpr);
  if(canvas.width!==pw||canvas.height!==ph){canvas.width=pw;canvas.height=ph;}
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);
  const lens=globeLensFrame(width,height),{cx,cy,radius}=lens;
  projection.scale(camera.scale).translate([cx,cy]).rotate([-camera.center[0],-camera.center[1],0]);
  // Same original floating globe material in both modes. Only the real
  // geographic camera zooms; the rim, disc clip and detached shadow stay fixed.
  ctx.beginPath();ctx.ellipse(cx,lens.shadowCy,lens.shadowRx,lens.shadowRy,0,0,Math.PI*2);ctx.fillStyle='rgba(88,77,57,.08)';ctx.fill();
  ctx.beginPath();ctx.arc(cx,cy,lens.ringRadius,0,Math.PI*2);ctx.strokeStyle='#bdc9bc';ctx.lineWidth=.8;ctx.stroke();
  const sea=ctx.createRadialGradient(cx-radius*.36,cy-radius*.52,0,cx-radius*.36,cy-radius*.52,radius*1.56);
  sea.addColorStop(0,'#bed5cc');sea.addColorStop(.65,'#80a69b');sea.addColorStop(1,'#4d716c');
  ctx.beginPath();ctx.arc(cx,cy,radius,0,Math.PI*2);ctx.fillStyle=sea;ctx.fill();
  ctx.save();ctx.beginPath();ctx.arc(cx,cy,radius,0,Math.PI*2);ctx.clip();
  paint(graticule,null,'rgba(230,239,228,.45)',.55);paint(land,'#eadfc5','#b9b49b',.65);
  // Natural Earth's coarse Taiwan coastline must not remain outside the
  // source-precise county union when zoomed in. Erase only that coarse shape.
  const coarseTaiwan=byIso.get('158');if(coarseTaiwan)paint(coarseTaiwan,sea);
  const selected=countries.find(c=>c.id===view.countryId);
  if(view.mode==='world'&&selected?.geography?.isoNumeric){const shape=byIso.get(selected.geography.isoNumeric);if(shape)paint(shape,'#b97451','#875c41');}
  for(const f of geometry.features){const p=f.properties,drill=view.mode==='taiwan',active=view.countyId===f.id,muted=view.regionId&&view.regionId!==p.regionId;
   paint(f,active?'#8b6246':drill?(muted?'#d9d4bd':colors[p.regionId]):'#eadfc5',drill&&view.depth==='counties'?(active?'#5e4736':'#fcfaf5'):null,active?1.6:.8);
  }
  hits=[];
  if(view.mode==='world')for(const c of countries){if(view.regionId!=='all'&&c.region!==view.regionId&&c.subregion!==view.regionId)continue;const point=c.geography?.point;if(!point||geoDistance(camera.center,point)>=Math.PI/2-.015)continue;const p=projection(point);hits.push({point:p,id:c.id});ctx.beginPath();ctx.arc(...p,c.id===view.countryId?5:4,0,Math.PI*2);ctx.fillStyle='#784b39';ctx.fill();ctx.strokeStyle='#fff7e9';ctx.lineWidth=1.5;ctx.stroke();}
  // End disc clipping before decorative leaders; native paper buttons are not
  // clipped and retain their full accessible rectangles around the lens.
  ctx.restore();const visibleLabels=[];
  for(const label of labels){const {point,node}=label,p=projection(point),remote=view.bounds?.every((n,i)=>n===geometry.fullBounds[i]),visible=view.mode==='taiwan'&&!view.regionId&&!remote&&geoDistance(camera.center,point)<Math.PI/2&&Math.hypot(p[0]-cx,p[1]-cy)<=radius&&p[0]>0&&p[0]<width&&p[1]>0&&p[1]<height;
   node.hidden=!visible;node.setAttribute('aria-pressed','false');if(visible)visibleLabels.push({...label,anchor:p,width:label.size?.width,height:label.size?.height});
  }
  for(const label of layoutRegionLabels(visibleLabels,width,height)){
   const {node,x,y,width:w,height:h,anchor:[ax,ay]}=label;node.style.left=x+'px';node.style.top=y+'px';
   // Decorative line and ring are painted on the non-interactive canvas layer.
   const dx=ax-x,dy=ay-y,t=1/Math.max(Math.abs(dx)/(w/2),Math.abs(dy)/(h/2),1),ex=x+dx*t,ey=y+dy*t;
   ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(ex,ey);ctx.strokeStyle='#fcfaf5';ctx.lineWidth=1.2;ctx.stroke();ctx.beginPath();ctx.arc(ax,ay,3.5,0,Math.PI*2);ctx.strokeStyle='#fcfaf5';ctx.lineWidth=1.6;ctx.stroke();
  }
  // Taiwan is already an established destination; use the geometry's true
  // main-island label point for the world marker, not a fabricated venue pin.
  if(view.mode==='world'&&['all','asia'].includes(view.regionId)){const point=geometry.mainlandPoint,p=projection(point);if(geoDistance(camera.center,point)<Math.PI/2){hits.push({point:p,id:'tw'});ctx.beginPath();ctx.arc(...p,5,0,Math.PI*2);ctx.fillStyle='#547364';ctx.fill();ctx.strokeStyle='#fcfaf5';ctx.lineWidth=2;ctx.stroke();}}
 }
 function stop(finish=false){if(finish&&target)camera={...target,center:[...target.center]};transition=null;host.classList.remove('is-travelling');if(frame)cancelAnimationFrame(frame);frame=0;}
 function tick(now){frame=0;if(destroyed)return;if(document.hidden){stop(true);return;}if(transition){const progress=(now-transition.start)/650;camera=interpolateCamera(transition.from,target,progress);if(progress>=1)stop(true);}draw();if(transition)request();}
 function request(){if(!destroyed&&!frame&&!document.hidden)frame=requestAnimationFrame(tick);}
 function setView(v,{force=false}={}){const key=cameraKey(v);if(!force&&key===lastKey)return;lastKey=key;view=v;stop();sizing();target=recipe(view);if(!camera||motion?.matches||document.hidden)camera={...target,center:[...target.center]};else{transition={from:{...camera,center:[...camera.center]},start:performance.now()};host.classList.add('is-travelling');}request();}
 function selectAt(x,y){const lens=globeLensFrame(width,height);if(Math.hypot(x-lens.cx,y-lens.cy)>lens.radius)return;if(view.mode==='world'){const h=nearestMarker(hits,[x,y]);if(h)onSelect(h.id);return;}
  const point=projection.invert([x,y]);if(!point||geoDistance(camera.center,point)>=Math.PI/2)return;
  const f=geometry.features.find(f=>geoContains(f,point));if(!f)return;
  if(!view.regionId||view.regionId!==f.properties.regionId)onRegion(f.properties.regionId);else onCounty(f.id);
 }
 function down(e){if(e.isPrimary===false||e.button!==0)return;stop();drag={pointer:e.pointerId,x:e.clientX,y:e.clientY,origin:[...camera.center],active:false};}
 function move(e){if(!drag||e.pointerId!==drag.pointer)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(!drag.active){if(Math.abs(dx)<8||Math.abs(dx)<Math.abs(dy)*1.15)return;drag.active=true;canvas.setPointerCapture?.(e.pointerId);}if(e.cancelable)e.preventDefault();const rate=150/(Math.max(width,220)*Math.max(1,camera.scale/(Math.min(width,height)*.42)));camera.center=[shortestLongitude(drag.origin[0]-dx*rate),Math.max(-80,Math.min(80,drag.origin[1]+dy*rate))];request();}
 function up(e){if(!drag||e.pointerId!==drag.pointer)return;const click=e.type==='pointerup'&&!drag.active&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<8;try{if(canvas.hasPointerCapture?.(e.pointerId))canvas.releasePointerCapture(e.pointerId);}catch{}drag=null;if(click){const b=canvas.getBoundingClientRect();selectAt(e.clientX-b.left,e.clientY-b.top);}}
 function key(e){if(e.key==='Enter'&&view.mode==='taiwan'){e.preventDefault();onExplore();return;}const delta={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,1],ArrowDown:[0,-1]}[e.key];if(!delta)return;e.preventDefault();stop();const rate=view.mode==='taiwan'?.25:7;camera.center=[shortestLongitude(camera.center[0]+delta[0]*rate),Math.max(-80,Math.min(80,camera.center[1]+delta[1]*rate))];request();}
 function visibility(){if(document.hidden)stop(true);else request();}
 function changed(){if(motion?.matches){stop(true);request();}}
 const resized=()=>{stop();sizing();target=recipe(view);camera={...target,center:[...target.center]};request();};
 function measureLabels(){for(const label of labels){const r=label.node.getBoundingClientRect();if(r.width&&r.height)label.size={width:r.width,height:r.height};}}
 try{sizing();target=recipe(view);camera={...target,center:[...target.center]};lastKey=cameraKey(view);host.appendChild(canvas);labels.forEach(l=>host.appendChild(l.node));measureLabels();draw();}
 catch(error){labels.forEach(l=>l.node.remove());canvas.remove();throw Object.assign(error,{stage:'draw'});}
 if(fallback)fallback.hidden=true;host.dataset.globeReady='true';
 const listeners=[['pointerdown',down],['pointermove',move],['pointerup',up],['pointercancel',up],['keydown',key]];listeners.forEach(([n,f])=>canvas.addEventListener(n,f));document.addEventListener('visibilitychange',visibility);motion?.addEventListener?.('change',changed);
 const observer=typeof ResizeObserver==='function'?new ResizeObserver(()=>{measureLabels();resized();}):null;observer?.observe(host);if(!observer)window.addEventListener('resize',resized);
 const labelObserver=typeof ResizeObserver==='function'?new ResizeObserver(()=>{measureLabels();request();}):null;labels.forEach(l=>labelObserver?.observe(l.node));
 const fontReady=()=>{if(!destroyed){measureLabels();request();}};document.fonts?.ready.then(fontReady);document.fonts?.addEventListener?.('loadingdone',fontReady);
 return {setView,recenter(){setView(view,{force:true});},destroy(){if(destroyed)return;destroyed=true;stop();observer?.disconnect();labelObserver?.disconnect();document.fonts?.removeEventListener?.('loadingdone',fontReady);window.removeEventListener('resize',resized);document.removeEventListener('visibilitychange',visibility);motion?.removeEventListener?.('change',changed);listeners.forEach(([n,f])=>canvas.removeEventListener(n,f));labels.forEach(l=>l.node.remove());canvas.remove();if(fallback)fallback.hidden=false;delete host.dataset.globeReady;}};
}
