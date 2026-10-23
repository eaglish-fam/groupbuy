import {approvedPicture} from './trip-city-approved-adapter.mjs';
import {readFileSync} from 'node:fs';
import {feature} from 'topojson-client';
import {geoBounds, geoMercator, geoPath} from 'd3-geo';

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
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
  // Route-article points (e.g. a port town or airport) carry routeId instead.
  const city = cities.find(c => c.id === (point.cityId ?? point.routeId));
  if (city) {
    if (!valid(city.path)) throw new Error(`Invalid guide path: ${point.cityId}`);
    return city.path;
  }
  throw new Error(`Unresolved map city: ${point.cityId}`);
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

/** Derive viewport bounds from a real country polygon or a selected real part. */
export function deriveAtlasBounds(geometry, paddingFraction = .08) {
  const value = geometry?.type === 'Feature' ? geometry.geometry : geometry;
  if (!value || !['Polygon', 'MultiPolygon'].includes(value.type) || !Number.isFinite(paddingFraction) || paddingFraction < 0 || paddingFraction > .25) throw new Error('Invalid atlas geometry or padding');
  const [[west, south], [east, north]] = geoBounds(geometry);
  if (![west, south, east, north].every(Number.isFinite) || west >= east || south >= north || east - west > 180) throw new Error('Unsupported atlas geometry bounds');
  const dx = (east - west) * paddingFraction, dy = (north - south) * paddingFraction;
  const bounds = [Math.max(-180, west-dx), Math.max(-84.99, south-dy), Math.min(180, east+dx), Math.min(84.99, north+dy)];
  projectAtlasView({bounds}, [0, 0, 600, 400]);
  return bounds;
}

function component(view, geography, config, country, cities) {
  const {box, labels, circle, key, width, height, drawLeaders = true} = config;
  const projection = projectAtlasView(view, box);
  const points = view.points.map((point, i) => ({...point, xy: projection(point.point), labelBox: labels[i], href: guideTarget(point, country, cities)}));
  if (points.some(p => !p.xy?.every(Number.isFinite) || !p.labelBox)) throw new Error('Invalid atlas points or label slots');
  const clipId = `atlas-${country.id}-${key}-${view.id}`.replace(/[^a-z0-9-]/g, '');
  // SVG clips the geography after drawing, so geographic bounds never acquire
  // false coastline strokes along their rectangular cut edges.
  // Detailed geometry is pre-clipped just outside the box (the cut edges stay
  // hidden by the SVG clip) so a zoomed view does not inline a whole continent.
  const path = geoPath(geography.detail ? projection.clipExtent([[box[0]-24, box[1]-24], [box[0]+box[2]+24, box[1]+box[3]+24]]) : projection.clipExtent(null));
  const coast = `<path class="travel-atlas-coast" d="${esc(path(geography.land))}"/>`;
  const territory = geography.territory ? `<path class="travel-atlas-territory" data-geometry-country="${esc(geography.territory.id)}" d="${esc(path(geography.territory))}"/>` : '';
  const boxClip = `<defs><clipPath id="${clipId}-bounds"><rect x="${box[0]}" y="${box[1]}" width="${box[2]}" height="${box[3]}"/></clipPath></defs>`;
  const boundedCoast = `<g clip-path="url(#${clipId}-bounds)">${coast}${territory}</g>`;
  const geometry = boxClip + (circle ? `<defs><clipPath id="${clipId}"><circle cx="${circle[0]}" cy="${circle[1]}" r="${circle[2]}"/></clipPath></defs><circle class="travel-atlas-inset-paper" cx="${circle[0]}" cy="${circle[1]}" r="${circle[2]}"/><g clip-path="url(#${clipId})">${boundedCoast}</g><circle class="travel-atlas-inset-border" cx="${circle[0]}" cy="${circle[1]}" r="${circle[2]}"/>` : boundedCoast);
  const leaders = drawLeaders ? points.map(p => {
    const [x,y,w] = p.labelBox;
    const endpoint = [Math.max(x, Math.min(p.xy[0], x+w)), y];
    return `<path class="travel-atlas-country-leader" d="M${n(p.xy[0])},${n(p.xy[1])} L${n(endpoint[0])},${n(endpoint[1])}"/>`;
  }).join('') : '';
  const links = points.map(p => {
    const [x,y,w] = p.labelBox;
    return `<a class="travel-atlas-dot" href="${esc(p.href)}" aria-label="探索${esc(p.label)}" style="left:${pct(p.xy[0],width)};top:${pct(p.xy[1],height)}"><i aria-hidden="true"></i></a><a class="travel-atlas-pin travel-atlas-country-label" href="${esc(p.href)}" style="--label-x:${pct(x,width)};--label-y:${pct(y,height)};--label-width:${pct(w,width)}"><span>${esc(p.label)}</span></a>`;
  }).join('');
  return {geometry: geometry + leaders, links, points};
}

function boundedAtlasText(value, max, field, allowEmpty = false) {
  if (typeof value !== 'string' || (!allowEmpty && !value.trim()) || [...value].length > max || /[\u0000-\u001f\u007f]/.test(value)) throw new Error(`Invalid atlas ${field}`);
  return value;
}

function atlasId(value, field) {
  if (typeof value !== 'string' || value.length > 64 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) throw new Error(`Invalid atlas ${field}`);
  return value;
}

function renderMultiViewCountryMap(country, cities, geography) {
  const map = country.geographicMap;
  const countryKey = atlasId(country.id, 'country id');
  boundedAtlasText(country.name, 80, 'country name');
  boundedAtlasText(country.englishName ?? '', 80, 'English name', true);
  boundedAtlasText(map.caption ?? '', 300, 'caption', true);
  if (!geography.territory || map.views.length > 8) throw new Error('Missing country geometry or too many atlas views');
  const ids = new Set();
  const views = map.views.map(view => {
    const id = atlasId(view.id, 'view id');
    if (ids.has(id)) throw new Error('Duplicate atlas view id');
    ids.add(id);
    boundedAtlasText(view.label, 64, 'view label');
    if (!Array.isArray(view.bounds) || view.bounds.length !== 4 || view.bounds[0] < -180 || view.bounds[2] > 180 || !Array.isArray(view.points) || view.points.length > 12) throw new Error('Invalid atlas view bounds or points');
    projectAtlasView(view, [28, 16, 544, 330]);
    for (const point of view.points) {
      const ownerId = point.cityId ?? point.routeId;
      atlasId(ownerId, 'city id');
      boundedAtlasText(point.label, 64, 'point label');
      const city = cities.find(c => c.id === ownerId);
      const owned = point.routeId !== undefined ? point.cityId === undefined && country.routeIds?.includes(point.routeId) : country.cityIds?.includes(point.cityId);
      if (!owned || !city) throw new Error('Unresolved atlas guide');
      const route = guideTarget({...point, href: undefined}, country, cities);
      const target = guideTarget(point, country, cities);
      if (route.length > 512 || target.length > 512) throw new Error('Atlas guide destination is too long');
      if (target !== route && !target.startsWith(`${route}#`)) throw new Error('Atlas destination does not match its guide');
      if (!Array.isArray(point.point) || point.point.length !== 2 || !point.point.every(Number.isFinite) || point.point[0] < view.bounds[0] || point.point[0] > view.bounds[2] || point.point[1] < view.bounds[1] || point.point[1] > view.bounds[3]) throw new Error('Atlas point is outside its view');
    }
    return view;
  });
  const firstId = views[0].id;
  const width = 600, height = 400;
  const panels = views.map(view => {
    // Normal-flow labels reserve their own height on small screens. For larger
    // marker collections they become a text legend, without ambiguous leaders.
    const labels = view.points.map((_, i) => [i % 2 ? 320 : 28, 392, 252]);
    const part = component(view, geography, {box:[28,16,544,330], labels, key:view.id, width, height, drawLeaders:view.points.length <= 2}, country, cities);
    const dots = part.points.map(point => `<a class="travel-atlas-dot" href="${esc(point.href)}" aria-label="探索${esc(point.label)}" style="left:${pct(point.xy[0],width)};top:${pct(point.xy[1],height)}"><i aria-hidden="true"></i></a>`).join('');
    const links = part.points.map(point => `<a class="travel-atlas-pin travel-atlas-country-label" href="${esc(point.href)}"><span>${esc(point.label)}</span></a>`).join('');
    const heading = `<div class="travel-atlas-country-heading travel-atlas-country-heading--single travel-atlas-country-heading--multiview">${esc(country.name)}<small>${esc(country.englishName)}</small></div>`;
    return `<div class="travel-atlas-view" data-travel-atlas-view="${esc(view.id)}"${view.id !== firstId ? ' hidden' : ''} aria-label="${esc(view.label)}">${heading}<div class="travel-atlas-country-stage"><svg class="travel-atlas-country-svg" viewBox="0 0 ${width} ${height}" aria-hidden="true" focusable="false">${part.geometry}</svg>${dots}</div><div class="travel-atlas-country-labels${view.points.length === 1 ? ' travel-atlas-country-labels--one' : ''}">${links}</div></div>`;
  }).join('');
  const controls = `<div class="travel-atlas-controls" hidden role="group" aria-label="${esc(country.name)}地圖範圍">${views.map(view=>`<button type="button" data-travel-atlas-select="${esc(view.id)}" aria-controls="travel-atlas-${countryKey}" aria-pressed="${view.id === firstId}">${esc(view.label)}</button>`).join('')}</div>`;
  const unique = [...new Map(views.flatMap(view=>view.points).map(point=>[JSON.stringify([guideTarget(point,country,cities),point.label]),point])).values()];
  return `<section class="approved-geographic-map travel-atlas-country travel-atlas-country--multiview" data-travel-atlas-root aria-label="${esc(country.name)}目的地位置圖">${controls}<div id="travel-atlas-${countryKey}" class="travel-atlas travel-atlas--country travel-atlas--multiview" data-travel-atlas data-atlas-active="${esc(firstId)}">${panels}</div><p class="travel-atlas-status" data-travel-atlas-status role="status" aria-live="polite">目前顯示：${esc(views[0].label)}</p><p class="travel-atlas-country-caption">${esc(map.caption)}</p><nav class="travel-atlas-destinations" aria-label="地圖目的地文字入口">${unique.map(point=>`<a href="${esc(guideTarget(point,country,cities))}">${esc(point.label)}</a>`).join('')}</nav><p class="approved-map-credit">Natural Earth · 目的地位置示意</p></section>`;
}

const detailedGeography = {};
function detailed(resolution) {
  if (resolution !== '50m') throw new Error('Unsupported atlas detail');
  if (!detailedGeography[resolution]) {
    // Natural Earth 1:50m from the pinned world-atlas package, read at build time only.
    const read = name => JSON.parse(readFileSync(new URL(`../node_modules/world-atlas/${name}-${resolution}.json`, import.meta.url), 'utf8'));
    const land = read('land'), countries = read('countries');
    detailedGeography[resolution] = {land:feature(land, land.objects.land), countries:feature(countries, countries.objects.countries).features};
  }
  return detailedGeography[resolution];
}
// An illustrated map image with pins (country.map), used when a migrated country page
// keeps its original drawn map instead of a sourced Natural Earth geographicMap.
function renderIllustratedCountryMap(country, cities, assets) {
  const m = country.map, a = assets?.get(m.assetId);
  if (!a) throw Error('Illustrated map asset missing');
  // Up to five places carry their name on the map; more would collide, so they become numbered dots with a legend.
  const numbered = m.pins.length > 5, city = p => cities.find(x => x.id === p.cityId);
  const pins = m.pins.map((p, i) => { const c = city(p); return numbered
    ? `<a class="approved-map-pin approved-map-pin--numbered" href="${esc(c.path)}" style="--x:${p.x}%;--y:${p.y}%" aria-label="${esc(c.name)}"><i aria-hidden="true">${i + 1}</i></a>`
    : `<a class="approved-map-pin${p.align === 'left' ? ' approved-map-pin--left' : ''}" href="${esc(c.path)}" style="--x:${p.x}%;--y:${p.y}%"><i aria-hidden="true"></i><span>${esc(c.name)}<small lang="en">${esc(c.englishName)}</small></span></a>`; }).join('');
  const legend = numbered ? `<ol class="approved-map-legend">${m.pins.map((p, i) => { const c = city(p); return `<li><a href="${esc(c.path)}"><b aria-hidden="true">${i + 1}</b><span>${esc(c.name)}<small lang="en">${esc(c.englishName)}</small></span></a></li>`; }).join('')}</ol>` : '';
  return `<section class="approved-geographic-map approved-illustrated-map" aria-label="${esc(country.name)}旅行位置示意圖"><figure><div class="approved-illustrated-map-frame">${approvedPicture(a, {sizes:'(max-width:700px) calc(100vw - 40px), 580px'})}${pins}</div><figcaption>${esc(m.caption)}</figcaption>${legend}</figure></section>`;
}
export function renderApprovedCountryMap(country, {cities = [], routes = [], assets} = {}) {
  const map = country.geographicMap;
  if (!map) return country.map ? renderIllustratedCountryMap(country, cities, assets) : '';
  const countryKey = String(country.id || 'country').replace(/[^a-z0-9-]/g,'');
  const topology = JSON.parse(readFileSync(new URL('../trip/globe-land.json', import.meta.url), 'utf8'));
  // The already-shipped Natural Earth topology contains real ISO country
  // polygons as well as coastlines. Country borders are not viewport edges.
  const geography = {land:feature(topology, topology.objects.land),territory:feature(topology, topology.objects.countries).features.find(f=>f.id===country.discovery?.isoNumeric)};
  const norway = country.id === 'norway';
  if (map.detail) {
    const fine = detailed(map.detail);
    Object.assign(geography, {land:fine.land, territory:fine.countries.find(f=>f.id===country.discovery?.isoNumeric), detail:map.detail});
  }
  if (!norway && Array.isArray(map.views) && map.views.length > 1) return renderMultiViewCountryMap(country, [...cities, ...routes], geography);
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
