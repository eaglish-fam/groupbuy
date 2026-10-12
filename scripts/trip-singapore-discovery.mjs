import {readFileSync} from 'node:fs';
import {esc} from './trip-singapore-adapter.mjs';
import {renderPhotoFrame} from './trip-photo-frames-r22.mjs';
import {resolveSingaporeNavigation} from './trip-singapore-navigation-cards.mjs';
import {renderApprovedPhotoPair} from '../trip/approved-photo-pair.mjs';
// A direct guide, not a new country hub or a second destination database.
// All displayed copy and photo identity come from the approved reader model.
export function addSingaporeDiscovery(html){
 const {article:a,navigationView}=JSON.parse(readFileSync(new URL('../trip/data/singapore-public-article-v1.json',import.meta.url)));
 const card=resolveSingaporeNavigation(a,navigationView).cards.find(c=>c.target==='jewel');
 const photo=card.image;
 const slot='<div class="home-guide-grid" data-photo-grid="guides">';
 if(html.split(slot).length!==2)throw Error('Expected existing travel guide entry');
 const src=photo.variants.find(v=>v.width===960)||photo.variants.at(-1);
 const image=`<img src="${esc(src.url)}" srcset="${esc(photo.variants.map(v=>`${v.url} ${v.width}w`).join(', '))}" sizes="(max-width:700px) calc(50vw - 27px), (max-width:1100px) calc(50vw - 42px), 378px" width="${photo.width}" height="${photo.height}" alt="${esc(photo.alt)}" loading="lazy" fetchpriority="low" decoding="async">`;
 const framed=card.imagePair?renderApprovedPhotoPair(card.imagePair,{sizes:'(max-width:700px) calc(25vw - 14px), (max-width:1100px) calc(25vw - 21px), 189px'}):renderPhotoFrame(image,{page:'home',sequence:'singapore',assetIndex:photo.assetId,ratio:`${photo.width}:${photo.height}`,position:[card.focalPoint.x,card.focalPoint.y]});
 const guide=`<article class="home-guide" data-guide-id="singapore"><a class="home-guide-link" href="${a.path}"><div class="home-guide-photo">${framed}</div><div class="home-guide-copy"><p class="home-guide-meta">新加坡</p><h3>新加坡<span aria-hidden="true">↗</span></h3><p class="home-guide-summary">${esc(a.description)}</p></div></a></article>`;
 return html.replace(slot,slot+guide).replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,(tag,text)=>{
  const data=JSON.parse(text);
  if(data['@type']!=='CollectionPage')return tag;
  data.hasPart=[...(data.hasPart||[]),{'@type':'WebPage',name:a.title,url:'https://www.eaglish.store'+a.path}];
  return '<script type="application/ld+json">'+JSON.stringify(data).replaceAll('<','\\u003c')+'</script>';
 });
}
