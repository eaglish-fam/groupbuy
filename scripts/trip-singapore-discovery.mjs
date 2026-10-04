import {readFileSync} from 'node:fs';
import {esc} from './trip-singapore-adapter.mjs';
import {picture} from './trip-singapore-renderer.mjs';
// A direct guide, not a new country hub or a second destination database.
// All displayed copy and photo identity come from the approved reader model.
export function addSingaporeDiscovery(html){
 const {article:a,navigationView}=JSON.parse(readFileSync(new URL('../trip/data/singapore-public-article-v1.json',import.meta.url)));
 const card=navigationView.cards.find(c=>c.target==='jewel');
 const photo=[...a.sections.flatMap(s=>s.images),...a.overview.cards.map(c=>c.image)].find(i=>i.assetId===card.assetId);
 if(!photo)throw Error('Approved discovery image missing');
 const slot='<div class="home-guide-grid" data-photo-grid="guides">';
 if(html.split(slot).length!==2)throw Error('Expected existing travel guide entry');
 const guide=`<article class="home-guide" data-guide-id="singapore"><a class="home-guide-link" href="${a.path}"><div class="home-guide-photo" style="aspect-ratio:3/2">${picture({...photo,alt:card.alt},{sizes:'(max-width:700px) 90vw, 378px'}).replace('style="--photo-ratio:','style="object-position:'+card.focalPoint.x+'% '+card.focalPoint.y+'%;--photo-ratio:')}</div><div class="home-guide-copy"><p class="home-guide-meta">新加坡</p><h3>新加坡<span aria-hidden="true">↗</span></h3><p class="home-guide-summary">${esc(a.description)}</p></div></a></article>`;
 return html.replace(slot,slot+guide).replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,(tag,text)=>{
  const data=JSON.parse(text);
  if(data['@type']!=='CollectionPage')return tag;
  data.hasPart=[...(data.hasPart||[]),{'@type':'WebPage',name:a.title,url:'https://www.eaglish.store'+a.path}];
  return '<script type="application/ld+json">'+JSON.stringify(data).replaceAll('<','\\u003c')+'</script>';
 });
}
