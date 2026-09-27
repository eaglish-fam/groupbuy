import {readFileSync} from 'node:fs';
import {esc,external} from './trip-chiang-mai.mjs';
export const northMedia=JSON.parse(readFileSync(new URL('../trip/assets/north-thailand-media.json',import.meta.url)));
export function northImage(id,{tile=false,wide=false}={}){
 const m=northMedia.find(m=>m.id===id);if(!m)throw Error(`Missing media ${id}`);
 const set=[640,960].filter(w=>w<m.width).map(w=>`/trip/assets/${id}-${w}.webp ${w}w`).concat(`/trip/assets/${id}.webp ${m.width}w`).join(', ');
 return `<img src="/trip/assets/${id}.webp" srcset="${set}" sizes="${wide?'(max-width:700px) 88vw, 480px':tile?'(max-width:700px) 44vw, 320px':'(max-width:700px) 44vw, 380px'}" width="${m.width}" height="${m.height}" loading="lazy" fetchpriority="low" decoding="async" alt="${esc(m.alt)}">`;
}
export const northFigure=(id,options={})=>`<figure>${northImage(id,options)}<figcaption>${esc(northMedia.find(m=>m.id===id).caption)}</figcaption></figure>`;
export const reel=id=>external(`https://www.instagram.com/reel/${id}/`,'看這站的 IG 實訪影片');
export const mapLink=p=>external(p.mapsUrl||'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(p.mapsQuery),'Google Maps','button outline');
