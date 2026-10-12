import {esc} from './trip-singapore-adapter.mjs';
import {picture} from './trip-singapore-renderer.mjs';
import {renderApprovedPhotoPair} from '../trip/approved-photo-pair.mjs';
import {isDeepStrictEqual} from 'node:util';

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
  const pool=[original.image,...section.images];
  // A pair may reuse an already accepted hero only when its venue/facet is
  // identical. This does not make unrelated hero photographs eligible.
  if(view.imagePair)pool.push(...(article.heroImages||[]).filter(i=>section.images.some(s=>s.facetId&&s.facetId===i.facetId)));
  const image=pool.find(i=>i.assetId===assetId);
  if(!image)throw Error('Navigation photo is not an adapted accepted image of this venue');
  const primary=navigationView&&view.alt?{...image,alt:text(view.alt)}:image;
  let imagePair=null;
  if(view.imagePair){
   if(!Array.isArray(view.imagePair)||view.imagePair.length!==2||view.imagePair[0]!==assetId||new Set(view.imagePair).size!==2)throw Error('Invalid navigation photo pair identity');
   imagePair=view.imagePair.map(id=>pool.find(i=>i.assetId===id));
   if(imagePair.some(i=>!i||i.facetId!==image.facetId))throw Error('Navigation pair must belong to the same accepted venue');
   for(const selected of imagePair)if(pool.filter(i=>i.assetId===selected.assetId).some(i=>i.lineage?.sourceSha256!==selected.lineage?.sourceSha256||i.width!==selected.width||i.height!==selected.height||!isDeepStrictEqual(i.variants,selected.variants)))throw Error('Conflicting navigation pair source references');
   imagePair[0]={...primary};
   renderApprovedPhotoPair(imagePair); // Shared shape/source/focal validation.
  }
  return {target:original.target,stableId:section.stableId,title:text(view.title),play:text(view.play),time:text(view.time),image:primary,imagePair,focalPoint:navigationView?point(view.focalPoint):null};
 })};
}

export function renderSingaporeNavigationOverview(article,navigationView){
 const navigation=resolveSingaporeNavigation(article,navigationView);
 const cards=navigation.cards.map(card=>{
  let img=card.imagePair?renderApprovedPhotoPair(card.imagePair,{sizes:'(max-width:700px) calc(25vw - 12px), 125px'}):picture(card.image,{overview:true});
  if(!card.imagePair&&card.focalPoint)img=img.replace('style="',`style="object-position:${card.focalPoint.x}% ${card.focalPoint.y}%;`);
  // The shared Chiang Mai/bkk card has exactly name, brief play and duration.
  // Captions and longer explanations belong to approved body content, not a
  // hidden/truncated duplicate or a fourth navigation-card text field.
  return `<a href="#${card.target}" data-place-ref="${card.stableId}" data-asset-id="${card.image.assetId}">${img}<span class="bkk-overview-copy"><strong>${esc(card.title)}</strong><span>${esc(card.play)}</span><small>${esc(card.time)}</small></span></a>`;
 }).join('');
 return `<section id="places"><h2>${esc(navigation.title)}</h2>${navigation.paragraphs.map(t=>`<p>${esc(t)}</p>`).join('')}<div class="bkk-overview sg-main-cards">${cards}</div></section>`;
}
