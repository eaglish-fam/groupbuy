import {esc} from './trip-singapore-adapter.mjs';
import {picture} from './trip-singapore-renderer.mjs';

const text=value=>{if(typeof value!=='string'||!value.trim())throw Error('Missing navigation text');return value;};
const point=value=>{
 if(!value||!['x','y'].every(key=>typeof value[key]==='number'&&Number.isFinite(value[key])&&value[key]>=0&&value[key]<=100))throw Error('Navigation focal point needs x/y percentages');
 return {x:value.x,y:value.y};
};

// Engineering seam only. The next frozen packet supplies Alma's short public
// copy plus Luca's approved per-photo asset/focal point. Do not guess them here.
// Images resolve from the already adapted same-venue public references, never
// from an arbitrary URL/path or a crop map's private provenance.
export function resolveSingaporeNavigation(article,navigationView){
 const originals=article.overview.cards,views=navigationView?.cards||originals;
 if(originals.length!==8||views.length!==8)throw Error('Eight navigation cards required');
 const paragraphs=navigationView?.paragraphs||article.overview.paragraphs;
 if(!Array.isArray(paragraphs)||!paragraphs.length)throw Error('Missing navigation introduction');
 if(navigationView&&paragraphs.length!==1)throw Error('The revised navigation introduction is one approved short paragraph');
 return {title:text(article.overview.title),paragraphs:paragraphs.map(text),cards:views.map((view,index)=>{
  const original=originals[index],section=article.sections.find(s=>s.id===original.target);
  if(view.target!==original.target||!section)throw Error('Navigation target/order must preserve venue identity');
  const assetId=navigationView?text(view.assetId):original.image.assetId;
  const image=[original.image,...section.images].find(i=>i.assetId===assetId);
  if(!image)throw Error('Navigation photo is not an adapted accepted image of this venue');
  return {target:original.target,stableId:section.stableId,title:text(view.title),play:text(view.play),time:text(view.time),image:navigationView&&view.alt?{...image,alt:text(view.alt)}:image,focalPoint:navigationView?point(view.focalPoint):null};
 })};
}

export function renderSingaporeNavigationOverview(article,navigationView){
 const navigation=resolveSingaporeNavigation(article,navigationView);
 const cards=navigation.cards.map(card=>{
  let img=picture(card.image,{overview:true});
  if(card.focalPoint)img=img.replace('style="',`style="object-position:${card.focalPoint.x}% ${card.focalPoint.y}%;`);
  // The shared Chiang Mai/bkk card has exactly name, brief play and duration.
  // Captions and longer explanations belong to approved body content, not a
  // hidden/truncated duplicate or a fourth navigation-card text field.
  return `<a href="#${card.target}" data-place-ref="${card.stableId}" data-asset-id="${card.image.assetId}">${img}<span class="bkk-overview-copy"><strong>${esc(card.title)}</strong><span>${esc(card.play)}</span><small>${esc(card.time)}</small></span></a>`;
 }).join('');
 return `<section id="places"><h2>${esc(navigation.title)}</h2>${navigation.paragraphs.map(t=>`<p>${esc(t)}</p>`).join('')}<div class="bkk-overview sg-main-cards">${cards}</div></section>`;
}
