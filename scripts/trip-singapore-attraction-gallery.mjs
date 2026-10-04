import {esc} from './trip-singapore-adapter.mjs';
import {picture} from './trip-singapore-renderer.mjs';

// Owner-approved images only. This structure never selects, crops or encodes
// media; each figure keeps its actual dimensions, alt and caption.
export function renderSingaporeAttractionGallery(images){
 if(!Array.isArray(images)||images.length!==3||new Set(images.map(i=>i.assetId)).size!==3)throw Error('Attraction gallery requires three distinct approved images');
 for(const image of images){
  if(!/^[A-Za-z0-9_-]+$/.test(image.assetId)||!Number.isInteger(image.width)||!Number.isInteger(image.height)||image.width<1||image.height<1||typeof image.alt!=='string'||!image.alt.trim()||typeof image.caption!=='string'||!image.caption.trim())throw Error('Missing gallery dimensions or approved accessible copy');
 }
 const ratios=images.slice(1).map(i=>i.width/i.height),total=ratios[0]+ratios[1];
 // Normalize to two fractional units: mixed horizontal/vertical sources
 // receive proportional widths, rather than leaving an empty tall half-row.
 const columns=ratios.map(r=>(2*r/total).toFixed(6)+'fr').join(' ');
 const figure=i=>`<figure${i.height>i.width?' data-portrait':''} data-asset-id="${i.assetId}">${picture(i)}<figcaption>${esc(i.caption)}</figcaption></figure>`;
 return `<div class="sg-gallery sg-attraction-gallery" data-attraction-photo-count="3"><div class="sg-gallery-lead">${figure(images[0])}</div><div class="sg-gallery-pair" style="--sg-pair-columns:${columns}">${images.slice(1).map(figure).join('')}</div></div>`;
}
