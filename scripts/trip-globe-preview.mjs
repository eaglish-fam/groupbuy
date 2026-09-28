import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {geoOrthographic,geoPath,geoGraticule10,geoDistance} from 'd3-geo';
import {feature} from 'topojson-client';
const require=createRequire(import.meta.url);
const topology=JSON.parse(readFileSync(require.resolve('world-atlas/countries-110m.json'),'utf8'));
const land=feature(topology,topology.objects.land);
const boundaries=feature(topology,topology.objects.countries).features;

// First paint is a sphere too. Interactive drawing and geometry load on intent.
export function renderGlobePreview(records,center=[112,22]){
 const projection=geoOrthographic().rotate([-center[0],-center[1]]).translate([320,213]).scale(184);
 const path=geoPath(projection).digits(1);
 const first=records[0],chosen=boundaries.find(c=>c.id===first?.geography?.isoNumeric);
 const point=first?.geography?.point;
 const pin=point&&geoDistance(center,point)<Math.PI/2?projection(point):null;
 return `<svg class="home-globe-preview" viewBox="0 0 640 440" aria-hidden="true" focusable="false"><defs><radialGradient id="globe-sea" cx="32%" cy="24%" r="78%"><stop offset="0" stop-color="#bed5cc"/><stop offset=".65" stop-color="#80a69b"/><stop offset="1" stop-color="#4d716c"/></radialGradient><radialGradient id="globe-light" cx="28%" cy="20%" r="80%"><stop offset="0" stop-color="#fff7df" stop-opacity=".24"/><stop offset=".65" stop-color="#fff7df" stop-opacity="0"/><stop offset="1" stop-color="#234440" stop-opacity=".22"/></radialGradient></defs><ellipse cx="325" cy="418" rx="126" ry="7" fill="#584d39" opacity=".08"/><circle cx="320" cy="213" r="191" fill="none" stroke="#bdc9bc" stroke-width=".8"/><circle cx="320" cy="213" r="184" fill="url(#globe-sea)"/><path d="${path(geoGraticule10())}" fill="none" stroke="#e6efe4" stroke-width=".55" opacity=".45"/><path d="${path(land)}" fill="#eadfc5" stroke="#b9b49b" stroke-width=".65" stroke-linejoin="round"/>${chosen?`<path d="${path(chosen)||''}" fill="#b97451" stroke="#875c41" stroke-width=".8"/>`:''}<circle cx="320" cy="213" r="184" fill="url(#globe-light)"/>${pin?`<circle cx="${pin[0].toFixed(1)}" cy="${pin[1].toFixed(1)}" r="5" fill="#774735" stroke="#fff7e9" stroke-width="2"/>`:''}</svg>`;
}
