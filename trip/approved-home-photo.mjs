// Only the byte-closed public package supplies this opt-in branch. Legacy R22
// entries remain governed by their exact frozen photo contexts.
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function approvedHomePhoto(asset,{sizes='(max-width:700px) calc(50vw - 40px), 340px'}={}){
 if(!asset||!Array.isArray(asset.variants)||asset.variants.length<2||asset.variants.some(v=>!/^\/trip\/assets\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.webp$/.test(v.url)||!Number.isInteger(v.width)))throw Error('Invalid approved home photo');
 const src=asset.variants.find(v=>v.width===960)||asset.variants.at(-1);
 return `<div class="r22-photo-frame" data-photo-frame="${asset.width}:${asset.height}" data-photo-context="home:approved-${esc(asset.assetId)}" data-photo-asset="${esc(asset.assetId)}" style="--photo-ratio:${asset.width}/${asset.height};--photo-position:${asset.focalPoint[0]}% ${asset.focalPoint[1]}%"><img src="${esc(src.url)}" srcset="${esc(asset.variants.map(v=>`${v.url} ${v.width}w`).join(', '))}" sizes="${esc(sizes)}" alt="${esc(asset.alt)}" width="${asset.width}" height="${asset.height}" loading="lazy" fetchpriority="low" decoding="async"></div>`;
}
