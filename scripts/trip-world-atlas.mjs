// Build-time geographic rendering. No map SDK, tiles or geolocation request in the browser.
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {geoEqualEarth, geoPath, geoGraticule10, geoContains} from 'd3-geo';
import {feature} from 'topojson-client';

const require=createRequire(import.meta.url);
const topology=JSON.parse(readFileSync(require.resolve('world-atlas/countries-110m.json'),'utf8'));
const land=feature(topology,topology.objects.land);
const countries=feature(topology,topology.objects.countries).features;
const projection=geoEqualEarth().rotate([-140,0]).fitExtent([[16,12],[984,538]],{type:'Sphere'});
const path=geoPath(projection).digits(1);
const esc=value=>String(value).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const base=`<path class="home-map-ocean" d="${path({type:'Sphere'})}"/><path class="home-map-graticule" d="${path(geoGraticule10())}"/><path class="home-map-land" d="${path(land)}"/>`;

export const worldAtlasSource={
  dataset:'Natural Earth 4.1.0, 1:110m, via world-atlas 2.0.2',
  projection:'Equal Earth, central meridian 140°E',
  source:'https://github.com/topojson/world-atlas',
  terms:'https://www.naturalearthdata.com/about/terms-of-use/',
  purpose:'Destination discovery, not navigation or border adjudication',
};

export function projectDestination(point){
  if(!Array.isArray(point)||point.length!==2||!point.every(Number.isFinite)||Math.abs(point[0])>180||Math.abs(point[1])>90)throw new Error('Atlas requires valid longitude/latitude');
  return projection(point).map(n=>Math.round(n*100)/100);
}

export function destinationOnLand(geography){
  const country=countries.find(c=>c.id===geography.isoNumeric);
  return Boolean(country&&geoContains(country,geography.point));
}

export function renderWorldAtlas(records){
  const mapped=records.filter(c=>c.geography);
  const points=mapped.map(c=>projectDestination(c.geography.point));
  // Conservative collision guard for a 260px-wide map and 44px touch targets.
  // Nearby countries stay selectable through the separate country list.
  const closePoints=points.some(([x,y],i)=>points.slice(i+1).some(([a,b])=>Math.abs(x-a)<170&&Math.abs(y-b)<170));
  const dense=mapped.length>4||closePoints;
  const highlights=mapped.map(c=>{
    if(!/^\d{3}$/.test(c.geography.isoNumeric))throw new Error(`Invalid atlas country code: ${c.id}`);
    const country=countries.find(f=>f.id===c.geography.isoNumeric);
    // Small countries may be absent at 1:110m. Their validated point and text
    // destination remain usable without inventing or enlarging a land outline.
    if(!country)return '';
    return `<path class="home-map-country" data-atlas-land="${esc(c.id)}" d="${path(country)}"/>`;
  }).join('');
  const pins=mapped.map(c=>{
    const [x,y]=projectDestination(c.geography.point);
    const tag=dense?'span':'a';
    const control=dense?' data-atlas-decorative="true" aria-hidden="true"':` href="${esc(c.href)}" aria-label="探索${esc(c.name)}"`;
    return `<${tag} class="home-map-pin" data-atlas-country="${esc(c.id)}"${control} style="left:${x/10}%;top:${y/5.5}%"><span class="home-map-dot" aria-hidden="true"></span><span class="home-map-label">${esc(c.name)}</span></${tag}>`;
  }).join('');
  return `<div class="home-world-map${dense?' home-world-map-dense':''}"><svg class="home-world-svg" viewBox="0 0 1000 550" aria-hidden="true" focusable="false">${base}${highlights}</svg>${pins}<p class="home-map-credit">地圖資料：Natural Earth · 旅行目的地示意</p></div>`;
}
