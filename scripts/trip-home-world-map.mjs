// Build-time flat world map for the /trip/ home. Natural Earth 1:110m (public domain)
// from the pinned world-atlas package, projected once here; the page ships the SVG
// inline and the browser makes no map, tile or CDN request.
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {geoEqualEarth,geoPath,geoBounds} from 'd3-geo';
import {feature,mesh} from 'topojson-client';

const require=createRequire(import.meta.url);
const topology=JSON.parse(readFileSync(require.resolve('world-atlas/countries-110m.json'),'utf8'));
const countries=feature(topology,topology.objects.countries).features.filter(f=>f.id!=='010');// Antarctica is outside the frame.
const land=feature(topology,topology.objects.land);
const borders=mesh(topology,topology.objects.countries,(a,b)=>a!==b);
export const W=960,H=520;
// Rotated to centre Asia; framed from Norway/Svalbard down to New Zealand.
const frame={type:'MultiPoint',coordinates:[[-12,85],[178,85],[-12,-49],[178,-49],[83,85],[83,-49]]};
export const worldProjection=geoEqualEarth().rotate([-83,0]).fitExtent([[10,10],[W-10,H-10]],frame).clipExtent([[0,0],[W,H]]);
const round=n=>Math.round(n*10)/10;
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// Whole pixels in a 960-wide viewBox, dropping points closer than 1px: the 110m
// outlines stay crisp at map size while the inline SVG stays small. Collapsed
// slivers are removed.
function compactPath(projection){
 let d='',last=null;
 const ctx={
  moveTo(x,y){x=Math.round(x);y=Math.round(y);d+=`M${x} ${y}`;last=[x,y];},
  lineTo(x,y){x=Math.round(x);y=Math.round(y);if(last&&Math.hypot(x-last[0],y-last[1])<1)return;d+=`L${x} ${y}`;last=[x,y];},
  closePath(){d+='Z';},
  arc(){}
 };
 const path=geoPath(projection,ctx);
 return f=>{d='';path(f);return d.replace(/M([^MZ]+)Z/g,(m,body)=>body.split('L').length<3?'':m).replace(/L(-?\d+) (-?\d+)/g,' $1 $2');};
}

export function hasCountryShape(isoNumeric){return countries.some(f=>f.id===isoNumeric);}

// A pin must sit near its country (110m coastlines are coarse, so allow a margin);
// a typo in a coordinate table fails the build instead of pinning the wrong place.
export function assertPinNearCountry(isoNumeric,point,label){
 if(!Array.isArray(point)||point.length!==2||!point.every(Number.isFinite)||Math.abs(point[0])>180||Math.abs(point[1])>90)throw Error('Invalid map pin '+label);
 const shape=countries.find(f=>f.id===isoNumeric);
 if(!shape)return;
 const [[w,s],[e,n]]=geoBounds(shape),m=1.5;
 if(point[0]<w-m||point[0]>e+m||point[1]<s-m||point[1]>n+m)throw Error(`Map pin ${label} is outside its country`);
}

export function project(point){
 const xy=worldProjection(point);
 if(!xy||!xy.every(Number.isFinite)||xy[0]<0||xy[0]>W||xy[1]<0||xy[1]>H)throw Error('Map point outside the frame: '+point);
 return xy.map(round);
}

// visited: Set of ISO numeric ids; pins: [[lon,lat]...]; home: {point,label}.
export function renderWorldMap({visited,pins,home}){
 const draw=compactPath(worldProjection);
 const filled=[];
 for(const id of visited){
  const f=countries.find(c=>c.id===id);if(!f)continue;// Too small for 1:110m (Singapore): pin only.
  const d=draw(f);if(!d)throw Error('Visited country outside the map frame: '+id);
  filled.push(`<path d="${d}"/>`);
 }
 // Land as one shape plus one stroke of interior borders, then the visited countries.
 const base=`<path class="map-land" d="${draw(land)}"/><path class="map-borders" d="${draw(borders)}"/>`;
 const dots=pins.map(p=>{const [x,y]=project(p);return `<circle cx="${x}" cy="${y}" r="4"/>`;}).join('');
 const [hx,hy]=project(home.point);
 // Label sits south-east of Taiwan over open sea, with a short leader line.
 const lx=round(hx+44),ly=round(hy+40);
 const homeMark=`<g class="map-home"><circle cx="${hx}" cy="${hy}" r="9"/><path d="M${round(hx+7)} ${round(hy+6)}L${round(lx-4)} ${round(ly-8)}"/><text x="${lx}" y="${ly+6}">${escape(home.label)}</text></g>`;
 return `<svg class="world-map-svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true" focusable="false">${base}<g class="map-visited">${filled.join('')}</g><g class="map-pins">${dots}</g>${homeMark}</svg>`;
}
