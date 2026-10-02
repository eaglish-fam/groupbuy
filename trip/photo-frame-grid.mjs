// Sequential shortest-column layout: item tops never decrease in DOM order.
// No dense placement, CSS columns or moved nodes; captions stay with their figure.
export function sequentialPhotoSlots(heights,widths,gap,full=[]){
 const bottoms=widths.map(()=>0);let lastTop=0;
 return heights.map((height,i)=>{
  const wide=full[i]||widths.length===1;
  const column=wide?0:bottoms.indexOf(Math.min(...bottoms));
  const top=Math.max(lastTop,wide?Math.max(...bottoms):bottoms[column]);
  const slot={column,top,height,wide};lastTop=top;
  if(wide)bottoms.fill(top+height+gap);else bottoms[column]=top+height+gap;
  return slot;
 });
}
export function layoutPhotoGrids(root=document){
 for(const grid of root.querySelectorAll('[data-photo-grid]')){
  const items=[...grid.children].filter(n=>!n.hidden);if(!items.length){grid.style.height='0px';continue;}
  const style=getComputedStyle(grid),gap=parseFloat(style.columnGap)||14;
  const columns=style.gridTemplateColumns.split(' ').map(parseFloat),width=grid.clientWidth;
  if(columns.some(v=>!Number.isFinite(v))||!width)continue;
  const full=items.map(n=>!!n.querySelector('[data-photo-compound]')||items.length===1);
  // Measure at the final width before positioning: fixed frames already reserve image height.
  for(let i=0;i<items.length;i++){items[i].style.width=(full[i]?width:columns[i%columns.length])+'px';items[i].style.position='relative';}
  // For unequal two-frame pairs the column is predetermined and photo heights match.
  const heights=items.map(n=>n.getBoundingClientRect().height);
  const slots=sequentialPhotoSlots(heights,columns,gap,full);
  for(let i=0;i<items.length;i++){
   const n=items[i],s=slots[i],w=s.wide?width:columns[s.column];
   n.style.width=w+'px';n.style.position='absolute';n.style.left=(columns.slice(0,s.column).reduce((sum,v)=>sum+v+gap,0))+'px';n.style.top=s.top+'px';
  }
  grid.style.height=Math.max(...slots.map(s=>s.top+s.height))+'px';grid.dataset.photoLayout='ready';
 }
}
export function startPhotoGrids(){
 layoutPhotoGrids();let pending=false;
 const schedule=()=>{if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;layoutPhotoGrids();});};
 const observer=new ResizeObserver(schedule);
 for(const grid of document.querySelectorAll('[data-photo-grid]')){observer.observe(grid);for(const child of grid.children)observer.observe(child);}
 document.fonts?.ready.then(()=>layoutPhotoGrids());window.addEventListener('resize',schedule,{passive:true});
 return ()=>observer.disconnect();
}
