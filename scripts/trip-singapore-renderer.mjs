import {esc} from './trip-singapore-adapter.mjs';
// Same source-ratio responsive markup as the accepted reader version.
export function picture(a,{overview=false,sizes:sourceSizes}={}){
 const variants=a.variants,src=variants.find(v=>v.width===960)||variants.at(-1);
 const srcset=variants.map(v=>`${v.url} ${v.width}w`).join(', '),sizes=sourceSizes||(overview?'(max-width:900px) 42vw, 180px':'(max-width:700px) 90vw, 680px');
 return `<img style="--photo-ratio:${a.width}/${a.height}" src="${src.url}" srcset="${srcset}" sizes="${sizes}" width="${a.width}" height="${a.height}" alt="${esc(a.alt)}" loading="lazy" fetchpriority="low" decoding="async">`;
}
