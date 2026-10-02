// Promote the first travel photo on each static page, not every image in a hero group.
// The preload mirrors its responsive candidates so the browser does not download two sizes.
export function prioritizeFirstTravelImage(html){
 // A map-first page can put its no-JS fallback before the promoted photo.
 // Those inert images must not steal the normal browser's single preload.
 // A page with hidden destination panels marks its actual primary photo.
 const matches=[...html.matchAll(/<noscript\b[^>]*>[\s\S]*?<\/noscript>|<img\b[^>]*\bsrc="(\/trip\/assets\/[^\"]+)"[^>]*>/g)].filter(m=>m[1]);
 const primary=matches.filter(m=>/\bdata-primary-travel-photo(?:\s|>)/.test(m[0]));
 if(primary.length>1)throw new Error('Travel page has multiple primary photos');
 const match=primary[0]||matches[0];
 if(!match)return html;
 const tag=match[0];
 const srcset=tag.match(/\bsrcset="([^\"]+)"/)?.[1];
 const sizes=tag.match(/\bsizes="([^\"]+)"/)?.[1];
 if(!srcset||!sizes)throw new Error(`First travel image lacks responsive sources: ${match[1]}`);
 const promoted=tag.replace(/\s(?:loading|fetchpriority)="[^\"]*"/g,'').replace(/>$/,' loading="eager" fetchpriority="high">');
 const fallback=srcset.split(',').map(candidate=>candidate.trim().split(' ')).find(([,width])=>width==='960w')?.[0]||match[1];
 const preload=`<link rel="preload" as="image" href="${fallback}" imagesrcset="${srcset}" imagesizes="${sizes}" fetchpriority="high">`;
 if(!html.includes('<link rel="icon"'))throw new Error('Travel page has no head insertion point');
 const updated=html.slice(0,match.index)+promoted+html.slice(match.index+tag.length);
 return updated.replace('<link rel="icon"',preload+'<link rel="icon"');
}
