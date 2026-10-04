// Reviewed public markup + portable public atlas, not private Project receipts.
import {readFileSync} from 'node:fs';
import {travelHomeCatalog} from '../trip/home-catalog.mjs';
import {validateTravelHomeCatalog} from './build-trip-home.mjs';
import {addSingaporeDiscovery} from './trip-singapore-discovery.mjs';
import {approvedTravelRegistration} from './trip-approved-registration.mjs';
import {prepareApprovedR24Discovery} from './trip-approved-discovery.mjs';
import {fileURLToPath} from 'node:url';
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
 let html=addSingaporeDiscovery(mapFirstTravelHome(template)),projection=config;
 const approved=approvedTravelRegistration(fileURLToPath(new URL('..',import.meta.url)));
 if(approved){const added=prepareApprovedR24Discovery(html,approved.data,{catalog:travelHomeCatalog,config});html=added.html;projection=added.config;}
 return inlineTravelStyles(html.replace('{{ATLAS_CONFIG}}',JSON.stringify(projection).replaceAll('<','\\u003c'))
  .replace('/trip/atlas-ui-bundle.mjs?v=r24-20261002','/trip/atlas-ui-bundle.mjs?v=r28-20261002')
  .replace(/<link\b[^>]*rel="preload"[^>]*as="image"[^>]*>/g,''));
}
// Reorder the reviewed top-level modules in the actual document, without
// reserializing the map, photos, copy or embedded data. Fail closed if a later
// template revision changes these boundaries; never silently drop a module.
export function mapFirstTravelHome(template){
 const markers=['<section class="home-opening home-wrap"','<section class="home-featured home-wrap"','<section class="home-destinations home-wrap"','<section class="home-planning home-wrap"'];
 const positions=markers.map(marker=>{
  const start=template.indexOf(marker);
  if(start<0||template.indexOf(marker,start+marker.length)>=0)throw Error('Expected one reviewed home module: '+marker);
  return start;
 });
 if(!positions.every((start,i)=>i===0||start>positions[i-1]))throw Error('Unexpected reviewed home module order');
 const [openingStart,featuredStart,mapStart,planningStart]=positions;
 const opening=template.slice(openingStart,featuredStart);
 const introduction=opening.match(/<h1 id="home-title">[^<]+<\/h1><p>[^<]+<\/p>/g);
 if(introduction?.length!==1)throw Error('Expected one brief home introduction');
 const intro=`<section class="home-introduction home-wrap" aria-labelledby="home-title">${introduction[0]}</section>`;
 const map=template.slice(mapStart,planningStart);
 // Keep the frozen reviewed snapshot; the live home needs only the main intro.
 const duplicateIntro='<div class="atlas-intro"><h2 id="atlas-heading">從一片風景，開始遠行。</h2><p>先選地區，再找到想去的國家。</p></div>';
 if(map.split(duplicateIntro).length!==2||map.split('aria-labelledby="atlas-heading"').length!==2)throw Error('Expected one reviewed atlas introduction and accessible name');
 const destinations=map.replace(duplicateIntro,'').replace('aria-labelledby="atlas-heading"','aria-label="目的地地圖"');
 return template.slice(0,openingStart)+intro+destinations
  +opening.replace(introduction[0],'').replace('<img ','<img data-primary-travel-photo ')
  +template.slice(featuredStart,mapStart)+template.slice(planningStart);
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
