import {readFileSync} from 'node:fs';
import {feature} from 'topojson-client';
import {geoMercator, geoPath} from 'd3-geo';

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
const approvedGuideIds = new Set(['oslo', 'tromso', 'svalbard', 'amsterdam']);
const n = value => Number(value.toFixed(3));
const pct = (value, extent) => `${n(value / extent * 100)}%`;

function guideTarget(point, country, cities) {
  // Consume the package's validated route, rather than assuming every future
  // city uses the current /guides/ namespace. Reject traversal/external URLs.
  const valid = value => typeof value === 'string' && /^\/trip\/(?:[a-z0-9-]+\/)+(?:#[a-z0-9-]+)?$/.test(value);
  if (point.href) {
    if (!valid(point.href)) throw new Error(`Invalid map destination: ${point.cityId}`);
    return point.href;
  }
  const city = cities.find(c => c.id === point.cityId);
  if (city) {
    if (!valid(city.path)) throw new Error(`Invalid guide path: ${point.cityId}`);
    return city.path;
  }
  if (!approvedGuideIds.has(point.cityId) || !country.cityIds?.includes(point.cityId)) throw new Error(`Unresolved map city: ${point.cityId}`);
  return `/trip/guides/${point.cityId}-with-kids/`;
}

/** Fit exactly the supplied geographic bounds; no illustrative substitute geometry. */
export function projectAtlasView(view, box) {
  const [west, south, east, north] = view.bounds;
  if (![west, south, east, north, ...box].every(Number.isFinite) || west >= east || south >= north || south <= -85 || north >= 85) throw new Error('Invalid atlas bounds');
  const [x, y, width, height] = box;
  const projection = geoMercator().scale(1).translate([0, 0]);
  const [left, top] = projection([west, north]);
  const [right, bottom] = projection([east, south]);
  const scale = Math.min(width / (right - left), height / (bottom - top));
  projection.scale(scale).translate([x + (width - (right-left)*scale)/2 - left*scale, y + (height - (bottom-top)*scale)/2 - top*scale]);
  projection.clipExtent([[x, y], [x + width, y + height]]);
  return projection;
}

function component(view, geography, config, country, cities) {
  const {box, labels, circle, key, width, height} = config;
  const projection = projectAtlasView(view, box);
  const points = view.points.map((point, i) => ({...point, xy: projection(point.point), labelBox: labels[i], href: guideTarget(point, country, cities)}));
  if (points.some(p => !p.xy?.every(Number.isFinite) || !p.labelBox)) throw new Error('Invalid atlas points or label slots');
  const clipId = `atlas-${country.id}-${key}-${view.id}`.replace(/[^a-z0-9-]/g, '');
  // SVG clips the geography after drawing, so geographic bounds never acquire
  // false coastline strokes along their rectangular cut edges.
  const path = geoPath(projection.clipExtent(null));
  const coast = `<path class="travel-atlas-coast" d="${esc(path(geography.land))}"/>`;
  const territory = geography.territory ? `<path class="travel-atlas-territory" data-geometry-country="${esc(geography.territory.id)}" d="${esc(path(geography.territory))}"/>` : '';
  const boxClip = `<defs><clipPath id="${clipId}-bounds"><rect x="${box[0]}" y="${box[1]}" width="${box[2]}" height="${box[3]}"/></clipPath></defs>`;
  const boundedCoast = `<g clip-path="url(#${clipId}-bounds)">${coast}${territory}</g>`;
  const geometry = boxClip + (circle ? `<defs><clipPath id="${clipId}"><circle cx="${circle[0]}" cy="${circle[1]}" r="${circle[2]}"/></clipPath></defs><circle class="travel-atlas-inset-paper" cx="${circle[0]}" cy="${circle[1]}" r="${circle[2]}"/><g clip-path="url(#${clipId})">${boundedCoast}</g><circle class="travel-atlas-inset-border" cx="${circle[0]}" cy="${circle[1]}" r="${circle[2]}"/>` : boundedCoast);
  const leaders = points.map(p => {
    const [x,y,w] = p.labelBox;
    const endpoint = [Math.max(x, Math.min(p.xy[0], x+w)), y];
    return `<path class="travel-atlas-country-leader" d="M${n(p.xy[0])},${n(p.xy[1])} L${n(endpoint[0])},${n(endpoint[1])}"/>`;
  }).join('');
  const links = points.map(p => {
    const [x,y,w] = p.labelBox;
    return `<a class="travel-atlas-dot" href="${esc(p.href)}" aria-label="探索${esc(p.label)}" style="left:${pct(p.xy[0],width)};top:${pct(p.xy[1],height)}"><i aria-hidden="true"></i></a><a class="travel-atlas-pin travel-atlas-country-label" href="${esc(p.href)}" style="--label-x:${pct(x,width)};--label-y:${pct(y,height)};--label-width:${pct(w,width)}"><span>${esc(p.label)}</span></a>`;
  }).join('');
  return {geometry: geometry + leaders, links};
}

export function renderApprovedCountryMap(country, {cities = []} = {}) {
  const map = country.geographicMap;
  if (!map) return '';
  const countryKey = String(country.id || 'country').replace(/[^a-z0-9-]/g,'');
  const topology = JSON.parse(readFileSync(new URL('../trip/globe-land.json', import.meta.url), 'utf8'));
  // The already-shipped Natural Earth topology contains real ISO country
  // polygons as well as coastlines. Country borders are not viewport edges.
  const geography = {land:feature(topology, topology.objects.land),territory:feature(topology, topology.objects.countries).features.find(f=>f.id===country.discovery?.isoNumeric)};
  const norway = country.id === 'norway';
  const width = 600, height = norway ? 760 : 560;
  const mainland = map.views.find(v => v.id === 'mainland');
  const island = map.views.find(v => v.id === 'svalbard-inset');
  const views = norway ? [
    {id:'all', label:'全圖', parts:[
      {view:mainland, box:[28,250,414,470], labels:[[280,654,160],[38,400,190]]},
      {view:island, box:[382,103,154,154], labels:[[348,355,218]], circle:[459,180,110]}
    ]},
    {id:'mainland', label:mainland.label, parts:[{view:mainland, box:[55,75,490,610], labels:[[300,610,170],[68,270,190]]}]},
    {id:'island', label:island.label, parts:[{view:island, box:[146,154,308,308], labels:[[191,610,218]], circle:[300,308,222]}]}
  ] : [{id:'all', label:map.views[0].label, parts:[{view:map.views[0], box:[42,48,516,456], labels:country.id==='netherlands'&&map.views[0].points.length===2 ? [[54,398,208],[360,158,168]] : map.views[0].points.map((_,i,points)=>[i%2?384:28,78+Math.floor(i/2)*400/Math.max(1,Math.ceil(points.length/2)-1),188])}]}];
  const panels = views.map(v => {
    const parts = v.parts.map(part => component(part.view, geography, {...part, key:v.id, width, height}, country, cities));
    const hasInset = v.id === 'all' && norway || v.id === 'island';
    const insetNote = hasInset ? `<div class="travel-atlas-inset-note${v.id === 'island' ? ' travel-atlas-inset-note--large' : ''}">斯瓦巴離島框・非等比例距離</div>` : '';
    const mainlandNote = norway && v.id !== 'island' ? `<div class="travel-atlas-country-heading${v.id === 'mainland' ? ' travel-atlas-country-heading--mainland' : ''}">${esc(mainland.label)}</div>` : '';
    const countryNote = country.id==='netherlands' ? `<div class="travel-atlas-country-heading travel-atlas-country-heading--single">${esc(country.name)}<small>${esc(country.englishName)}</small></div>` : '';
    return `<div class="travel-atlas-view" data-travel-atlas-view="${v.id}"${v.id !== 'all' ? ' hidden' : ''} aria-label="${esc(v.label)}"><svg class="travel-atlas-country-svg" viewBox="0 0 ${width} ${height}" aria-hidden="true" focusable="false">${parts.map(p=>p.geometry).join('')}</svg>${mainlandNote}${countryNote}${insetNote}${parts.map(p=>p.links).join('')}</div>`;
  }).join('');
  const controls = norway ? `<div class="travel-atlas-controls" hidden role="group" aria-label="挪威地圖範圍">${[['all','全圖'],['mainland','本土'],['island','斯瓦巴']].map(([id,label])=>`<button type="button" data-travel-atlas-select="${id}" aria-controls="travel-atlas-${countryKey}" aria-pressed="${id==='all'}">${label}</button>`).join('')}</div>` : '';
  const unique = [...new Map(map.views.flatMap(v=>v.points).map(p=>[guideTarget(p,country,cities)+p.label,p])).values()];
  return `<section class="approved-geographic-map travel-atlas-country" data-travel-atlas-root aria-label="${esc(country.name)}目的地位置圖">${controls}<div id="travel-atlas-${countryKey}" class="travel-atlas travel-atlas--country ${norway?'travel-atlas--norway':'travel-atlas--single'}" data-travel-atlas data-atlas-active="all">${panels}</div>${norway ? '<p class="travel-atlas-status" data-travel-atlas-status role="status" aria-live="polite">目前顯示：全圖</p>' : ''}<p class="travel-atlas-country-caption">${esc(map.caption)}</p><nav class="travel-atlas-destinations" aria-label="地圖目的地文字入口">${unique.map(p=>`<a href="${esc(guideTarget(p,country,cities))}">${esc(p.label)}</a>`).join('')}</nav><p class="approved-map-credit">Natural Earth · 目的地位置示意</p></section>`;
}
