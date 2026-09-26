// Promote the first travel photo on each static page, not every image in a hero group.
// The preload mirrors its responsive candidates so the browser does not download two sizes.
export function prioritizeFirstTravelImage(html){
 const match=html.match(/<img\b[^>]*\bsrc="(\/trip\/assets\/[^\"]+)"[^>]*>/);
 if(!match)return html;
 const tag=match[0];
 const srcset=tag.match(/\bsrcset="([^\"]+)"/)?.[1];
 const sizes=tag.match(/\bsizes="([^\"]+)"/)?.[1];
 if(!srcset||!sizes)throw new Error(`First travel image lacks responsive sources: ${match[1]}`);
 const promoted=tag.replace(/\s(?:loading|fetchpriority)="[^\"]*"/g,'').replace(/>$/,' loading="eager" fetchpriority="high">');
 const fallback=srcset.split(',').map(candidate=>candidate.trim().split(' ')).find(([,width])=>width==='960w')?.[0]||match[1];
 const preload=`<link rel="preload" as="image" href="${fallback}" imagesrcset="${srcset}" imagesizes="${sizes}" fetchpriority="high">`;
 if(!html.includes('<link rel="icon"'))throw new Error('Travel page has no head insertion point');
 return html.replace(tag,promoted).replace('<link rel="icon"',preload+'<link rel="icon"');
}
