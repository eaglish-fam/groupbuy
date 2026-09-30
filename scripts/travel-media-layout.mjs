// Editorial galleries preserve source ratios and reading order. Navigation
// thumbnails may use an explicitly approved CSS crop, never altered pixels.
export function mediaRatio(media){
 const variants=[...(media?.variants||[])].sort((a,b)=>a.width-b.width);
 const fallback=variants.find(v=>v.width===960)||variants.at(-1);
 const width=fallback?.width||media?.width,height=fallback?.height||media?.height;
 if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)throw Error('Invalid layout image dimensions');
 return width/height;
}
export function planMediaRows(media){
 const rows=[];let index=0;
 // Every story of three or more photos keeps its first large lead. A final
 // unpaired support gets a whole row, never an orphaned half-width cell.
 if(media.length===1||media.length>2)rows.push([index++]);
 while(index<media.length)rows.push(index===media.length-1?[index++]:[index++,index++]);
 return rows.map(indices=>{
  const ratios=indices.map(i=>mediaRatio(media[i]));
  const portraits=ratios.map(r=>r<1);
  const mixed=portraits.some(Boolean)&&portraits.some(p=>!p);
  const total=ratios.reduce((a,b)=>a+b,0);
  return {indices,ratios,mixed,columns:indices.length===1?'1fr':ratios.map(r=>`${(100*r/total).toFixed(6)}fr`).join(' '),portraits};
 });
}
export function galleryImageSizes(row,index){
 const portrait=row.portraits[index];
 if(row.indices.length===1)return portrait?'(max-width:700px) min(280px, calc(100vw - 40px)), 340px':'(max-width:700px) calc(100vw - 40px), 760px';
 const fraction=row.ratios[index]/row.ratios.reduce((a,b)=>a+b,0);
 const mobile=row.mixed?(portrait?'min(280px, calc(100vw - 40px))':'calc(100vw - 40px)'):`calc(${(fraction*100).toFixed(4)}vw - ${(fraction*50).toFixed(4)}px)`;
 return `(max-width:700px) ${mobile}, ${Math.round(744*fraction)}px`;
}
export function topicImageSizes(){
 // Matches the CSS circle diameter: 80px at 320, 97.5px at 390, 150px desktop.
 return '(max-width:700px) clamp(76px, 25vw, 98px), 150px';
}
