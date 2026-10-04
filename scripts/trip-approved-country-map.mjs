import {readFileSync} from 'node:fs';
import {feature} from 'topojson-client';
import {geoMercator,geoPath} from 'd3-geo';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Labels must not hide another real pin, especially Amsterdam / nearby Giethoorn.
function placeMapLabels(pins,width,height,size){
 const placed=[],pinBoxes=pins.map(p=>({x:p.xy[0]-12,y:p.xy[1]-12,w:24,h:24}));
 const overlap=(a,b)=>Math.max(0,Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y));
 return pins.map(p=>{
  const w=[...p.label].length*size;
  const candidates=[[p.xy[0]+18,p.xy[1]-22],[p.xy[0]+18,p.xy[1]+size+22],[p.xy[0]-w-18,p.xy[1]-22],[p.xy[0]-w-18,p.xy[1]+size+22]].map(([x,y],order)=>{
   x=Math.max(8,Math.min(x,width-w-8));y=Math.max(size+8,Math.min(y,height-size*.25-8));
   const box={x,y:y-size,w,h:size*1.25};return {x,y,box,order,score:[...pinBoxes,...placed].reduce((sum,b)=>sum+overlap(box,b),0)};
  }).sort((a,b)=>a.score-b.score||a.order-b.order);
  const selected=candidates[0];placed.push(selected.box);return {...p,labelX:selected.x,labelY:selected.y};
 });
}

export function renderApprovedCountryMap(country){
 const map=country.geographicMap;if(!map)return '';
 const topology=JSON.parse(readFileSync(new URL('../trip/globe-land.json',import.meta.url),'utf8'));
 const land=feature(topology,topology.objects.land);
 const target=p=>p.href||(country.cityIds.length>1?'#city-'+p.cityId:'/trip/guides/'+p.cityId+'-with-kids/');
 const attributes=p=>!p.href&&country.cityIds.length>1?` data-country-city="${esc(p.cityId)}"`:'';
 return `<section class="approved-geographic-map" aria-label="${esc(country.name)}目的地位置圖"><div class="approved-map-views" data-map-count="${map.views.length}">${map.views.map(view=>{
  const compact=map.views.length>1,width=compact?300:500,height=compact?240:320,labelSize=compact?28:24;
  const [west,south,east,north]=view.bounds,projection=geoMercator().scale(1).translate([0,0]);
  const topLeft=projection([west,north]),bottomRight=projection([east,south]),scale=Math.min((width-40)/(bottomRight[0]-topLeft[0]),(height-56)/(bottomRight[1]-topLeft[1]));
  projection.scale(scale).translate([(width-(bottomRight[0]-topLeft[0])*scale)/2-topLeft[0]*scale,28-topLeft[1]*scale]).clipExtent([[8,8],[width-8,height-8]]);
  const path=geoPath(projection),pins=placeMapLabels(view.points.map(p=>({...p,xy:projection(p.point)})),width,height,labelSize);
  return `<div class="approved-map-view"><h3>${esc(view.label)}</h3><svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(view.label)}；下方可用文字選擇目的地"><rect width="${width}" height="${height}" fill="#f2eee5"/><path d="${path(land)}" fill="#e1d5bc" stroke="#b6a991" stroke-width="1"/>${pins.map(p=>`<a href="${esc(target(p))}"${attributes(p)} aria-label="探索${esc(p.label)}"><circle cx="${p.xy[0].toFixed(2)}" cy="${p.xy[1].toFixed(2)}" r="8" fill="#784b39" stroke="#fcfaf5" stroke-width="3"/><text x="${p.labelX.toFixed(2)}" y="${p.labelY.toFixed(2)}" fill="#494139" font-size="${labelSize}">${esc(p.label)}</text></a>`).join('')}</svg>${compact?'':`<p>${esc(view.note)}</p>`}</div>`;
 }).join('')}</div><p>${esc(map.caption)}</p><nav aria-label="地圖目的地文字入口">${map.views.flatMap(v=>v.points).map(p=>`<a href="${esc(target(p))}"${attributes(p)}>${esc(p.label)}</a>`).join('')}</nav><p class="approved-map-credit">Natural Earth · 目的地位置示意</p></section>`;
}
