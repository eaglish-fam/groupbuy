import {readFileSync} from 'node:fs';
import {feature} from 'topojson-client';
import {geoMercator,geoPath} from 'd3-geo';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function renderApprovedCountryMap(country){
 const map=country.geographicMap;if(!map)return '';
 const topology=JSON.parse(readFileSync(new URL('../trip/globe-land.json',import.meta.url),'utf8'));
 const land=feature(topology,topology.objects.land);
 const target=p=>p.href||(country.cityIds.length>1?'#city-'+p.cityId:'/trip/guides/'+p.cityId+'-with-kids/');
 const attributes=p=>!p.href&&country.cityIds.length>1?` data-country-city="${esc(p.cityId)}"`:'';
 return `<section class="approved-geographic-map" aria-label="${esc(country.name)}目的地位置圖"><div class="approved-map-views">${map.views.map(view=>{
  const inset=view.id==='svalbard-inset',width=inset?280:560,height=inset?240:480;
  const [west,south,east,north]=view.bounds,projection=geoMercator().scale(1).translate([0,0]);
  const topLeft=projection([west,north]),bottomRight=projection([east,south]),scale=Math.min((width-48)/(bottomRight[0]-topLeft[0]),(height-72)/(bottomRight[1]-topLeft[1]));
  projection.scale(scale).translate([24-topLeft[0]*scale,48-topLeft[1]*scale]).clipExtent([[12,36],[width-12,height-16]]);
  const path=geoPath(projection),pins=view.points.map(p=>({...p,xy:projection(p.point)}));
  return `<div class="approved-map-view"><h3>${esc(view.label)}</h3><svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(view.label)}；下方可用文字選擇目的地"><rect width="${width}" height="${height}" fill="#f2eee5"/><path d="${path(land)}" fill="#e1d5bc" stroke="#b6a991" stroke-width="1"/>${pins.map(p=>`<a href="${esc(target(p))}"${attributes(p)} aria-label="探索${esc(p.label)}"><circle cx="${p.xy[0].toFixed(2)}" cy="${p.xy[1].toFixed(2)}" r="7" fill="#784b39" stroke="#fcfaf5" stroke-width="3"/><text x="${(p.xy[0]+12).toFixed(2)}" y="${(p.xy[1]-12).toFixed(2)}" fill="#494139" font-size="15">${esc(p.label)}</text></a>`).join('')}</svg><p>${esc(view.note)}</p></div>`;
 }).join('')}</div><p>${esc(map.caption)}</p>${map.connections?.length?`<ul class="approved-map-connections" aria-label="目的地交通銜接">${map.connections.map(leg=>`<li>${esc(leg.fromLabel)} → ${esc(leg.toLabel)}<small>${leg.mode==='flight'?'航段':'交通銜接'} · ${esc(leg.label)}</small></li>`).join('')}</ul>`:''}<nav aria-label="地圖目的地文字入口">${map.views.flatMap(v=>v.points).map(p=>`<a href="${esc(target(p))}"${attributes(p)}>${esc(p.label)}</a>`).join('')}</nav><p class="approved-map-credit">Natural Earth · 目的地位置示意</p></section>`;
}
