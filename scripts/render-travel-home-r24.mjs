// Reviewed public markup + portable public atlas, not private Project receipts.
import {readFileSync} from 'node:fs';
import {travelHomeCatalog} from '../trip/home-catalog.mjs';
import {validateTravelHomeCatalog} from './build-trip-home.mjs';
const read=rel=>readFileSync(new URL('../'+rel,import.meta.url),'utf8');
export function renderTravelHomeR24(){
 const config=JSON.parse(read('trip/data/taiwan-atlas-r24.json'));
 validateTravelHomeCatalog(config.catalog);
 // A subsequent catalog update must explicitly update this reviewed projection,
 // rather than silently serving an old set of countries after a successful build.
 if(JSON.stringify(config.catalog)!==JSON.stringify(travelHomeCatalog))throw Error('Travel catalog changed; reconcile the reviewed public atlas');
 if(config.privateAtlas!==null||config.data.places.length!==53)throw Error('Invalid public atlas');
 const template=read('trip/content/home-r24.html.template');
 if(template.split('{{ATLAS_CONFIG}}').length!==2)throw Error('Expected one atlas config slot');
 // The shared destination writer promotes the first image once. The reviewed
 // snapshot already contained a preload, so remove that before the normal pass.
 return inlineTravelStyles(template.replace('{{ATLAS_CONFIG}}',JSON.stringify(config).replaceAll('<','\\u003c'))
  .replace(/<link\b[^>]*rel="preload"[^>]*as="image"[^>]*>/g,''));
}
// Preserve reviewed deterministic first paint without a preview host dependency.
// Current shared CSS is read from this checkout; other sites are never replaced.
export function inlineTravelStyles(html){
 const allowed=new Set(['/trip/trip.css','/trip/home.css','/trip/atlas-component.css','/trip/bangkok.css','/trip/cebu-bohol.css','/trip/cebu-presentation-r21.css','/site-navigation.css','/trip/heading-theme-r24.css']);
 return html.replace(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"<>]+)"[^>]*>/g,(tag,href)=>{
  const p=new URL(href,'https://www.eaglish.store').pathname;
  if(!allowed.has(p))return tag;
  const css=read(p.slice(1));if(/<\/style/i.test(css))throw Error('Invalid stylesheet');
  return `<style data-site-style="${p}">${css}</style>`;
 });
}
