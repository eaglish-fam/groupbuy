import {photoContexts} from './trip-photo-contexts-r22.mjs';
const source=tag=>tag.match(/\bsrc="([^"]+)"/)?.[1];
const frame=(image,c,ratio=c.ratio,position=c.position)=>`<div class="r22-photo-frame" data-photo-frame="${ratio}" data-photo-context="${c.page}:${c.sequence}" data-photo-asset="${c.assetIndex}" style="--photo-ratio:${ratio.replace(':','/')};--photo-position:${position[0]}% ${position[1]}%">${image}</div>`;
function balancedDivEnd(html,start){
 const tags=/<\/?div\b[^>]*>/g;tags.lastIndex=start;let depth=0;
 for(let m;(m=tags.exec(html));){depth+=m[0].startsWith('</')?-1:1;if(depth===0)return tags.lastIndex;}
 throw Error('Unclosed photo gallery');
}
export function applyPhotoFrames(html,page){
 const contexts=photoContexts.filter(c=>c.page===page).sort((a,b)=>a.sequence-b.sequence);
 let sequence=0;
 html=html.replace(/<img\b[^>]*>/g,(image,offset)=>{
  const src=source(image);
  // Three existing circular topic thumbnails are intentionally outside the 54-context map.
  if(page==='home'&&html.slice(0,offset).endsWith('<figure class="home-panel-photo">'))return image;
  if(!src?.startsWith('/trip/assets/'))return image;
  // Topic thumbnails are the only 640 fallbacks; every reviewed Cebu source uses 960 or original.
  if(page==='cebu'&&src.endsWith('-640.webp'))return image;
  const c=contexts[sequence++];
  if(!c||src!==c.src)throw Error(`R22 ${page} context/source mismatch at ${sequence-1}: ${src}`);
  if(c.compound){
   const decorated=image.replace(/\balt="[^"]*"/,'alt=""').replace('<img ','<img data-photo-display-clone="loboc" aria-hidden="true" ');
   return `<div class="r22-compound" data-photo-compound="loboc" style="--photo-columns:8fr 15fr">${frame(image,c,'4:5',[0,50])}${frame(decorated,c,'3:2',[100,50])}</div>`;
  }
  if(page==='home'&&c.sequence>0)image=image.replace(/\bsizes="[^"]*"/,'sizes="(max-width:700px) calc(50vw - 27px), (max-width:1100px) calc(50vw - 42px), 378px"');
  return frame(image,c);
 });
 if(sequence!==contexts.length)throw Error(`R22 ${page} expected ${contexts.length} contexts, got ${sequence}`);
 if(page==='home')return html.replace(/<div class="home-guide-grid"/g,'<div class="home-guide-grid" data-photo-grid="guides"');
 // Flatten only the old presentation row wrappers, never move or replace story figures/captions.
 const starts=[...html.matchAll(/<div class="cb-gallery(?: cb-gallery-single)?"[^>]*>/g)].map(m=>m.index).reverse();
 for(const start of starts){
  const end=balancedDivEnd(html,start),group=html.slice(start,end),figures=[...group.matchAll(/<figure\b[^>]*>[\s\S]*?<\/figure>/g)].map(m=>m[0]);
  if(!figures.length)throw Error('Empty framed gallery');
  let columns='1fr 1fr';
  if(figures.length===2){const ratios=figures.map(f=>f.match(/data-photo-frame="([^"]+)"/)?.[1]);if(ratios[0]!==ratios[1])columns=ratios.map(r=>r==='4:5'?'8fr':'15fr').join(' ');}
  const opening=group.slice(0,group.indexOf('>')+1).replace('data-media-layout="source-ratio-v4"','data-media-layout="fixed-frames-r22"');
  const sized=figures.map((f,i)=>f.replace(/<img\b[^>]*>/g,img=>{
   const compound=f.includes('data-photo-compound'),portrait=f.includes('data-photo-frame="4:5"');
   const proportion=compound?(img.includes('data-photo-display-clone')?15/23:8/23):figures.length===1?1:figures.length===2&&columns!=='1fr 1fr'?(portrait?8/23:15/23):.5;
   const percent=Math.round(proportion*100),offset=Math.round(40*proportion+(proportion<1?12:0));
   return img.replace(/\bsizes="[^"]*"/,`sizes="(max-width:700px) calc(${percent}vw - ${offset}px), ${Math.round((760-(proportion<1?14:0))*proportion)}px"`);
  }));
  const replacement=opening.slice(0,-1)+` data-photo-grid="story" style="--photo-columns:${columns}">`+sized.join('')+'</div>';
  html=html.slice(0,start)+replacement+html.slice(end);
 }
 // The six attraction entry cards share the same chronological staggered layout.
 return html.replace('<div class="cb-photo-cards">','<div class="cb-photo-cards" data-photo-grid="attractions">');
}

// Compare meaningful content, original image identity/alt/source-set and every original link.
// Only display frames, responsive sizes and the approved decorative same-source clone differ.
export function preservedArticle(inventory){
 const attr=(tag,name)=>tag.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1]??null;
 const image=tag=>Object.fromEntries(['src','srcset','alt','width','height','loading','fetchpriority','decoding'].map(n=>[n,attr(tag,n)]));
 return {...inventory,images:inventory.images.filter(t=>!t.includes('data-photo-display-clone')).map(image),links:inventory.links.map(t=>({opening:t.slice(0,t.indexOf('>')+1),text:t.replace(/<[^>]*>/g,''),images:[...t.matchAll(/<img\b[^>]*>/g)].filter(m=>!m[0].includes('data-photo-display-clone')).map(m=>image(m[0]))}))};
}
