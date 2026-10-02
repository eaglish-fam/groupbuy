// Pure recipes: real geometry bounds drive the camera, never travel-place pins.
const rad=Math.PI/180;
export const shortestLongitude=value=>((value+180)%360+360)%360-180;
export function projectUnit([lng,lat],[cx,cy]){const d=(lng-cx)*rad,p=lat*rad,c=cy*rad;return [Math.cos(p)*Math.sin(d),Math.cos(c)*Math.sin(p)-Math.sin(c)*Math.cos(p)*Math.cos(d)];}
export function fitGlobe(bounds,width,height,padding=38){
 const center=[(bounds[0]+bounds[2])/2,(bounds[1]+bounds[3])/2];
 const points=[[bounds[0],bounds[1]],[bounds[0],bounds[3]],[bounds[2],bounds[1]],[bounds[2],bounds[3]]].map(p=>projectUnit(p,center));
 const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
 const scale=Math.min((width-2*padding)/(Math.max(...xs)-Math.min(...xs)),(height-2*padding)/(Math.max(...ys)-Math.min(...ys)));
 return {center,scale,translate:[width/2,height/2]};
}
// A fixed circular viewport, independent of geographic zoom. Fitting all four
// projected bounds corners radially preserves the official island context.
export function globeLensFrame(width,height){const radius=Math.min(width,height)*.42,cx=width/2,cy=height*.46;return {cx,cy,radius,ringRadius:radius+6,shadowCy:cy+radius+18,shadowRx:radius*.68,shadowRy:Math.max(3,radius*.025)};}
export function fitCircularGlobe(bounds,width,height){
 const center=[(bounds[0]+bounds[2])/2,(bounds[1]+bounds[3])/2],frame=globeLensFrame(width,height);
 const points=[[bounds[0],bounds[1]],[bounds[0],bounds[3]],[bounds[2],bounds[1]],[bounds[2],bounds[3]]].map(p=>projectUnit(p,center));
 const scale=frame.radius*.9/Math.max(...points.map(p=>Math.hypot(...p)));
 return {center,scale,translate:[frame.cx,frame.cy]};
}
const union=rows=>[Math.min(...rows.map(r=>r[0])),Math.min(...rows.map(r=>r[1])),Math.max(...rows.map(r=>r[2])),Math.max(...rows.map(r=>r[3]))];
// National framing uses the principal mainland body, not its counties' small
// offshore rings. This derives a view only; every official polygon is retained.
const ringArea=ring=>Math.abs(ring.slice(1).reduce((sum,p,i)=>sum+ring[i][0]*p[1]-p[0]*ring[i][1],0));
export function mainlandBodyBounds(geometry){
 const rings=geometry.features.filter(f=>f.properties.regionId!=='tw-offshore').map(f=>f.geometry.coordinates.reduce((best,p)=>ringArea(p[0])>ringArea(best[0])?p:best)[0]);
 const points=rings.flat();
 return points.reduce((b,[x,y])=>[Math.min(b[0],x),Math.min(b[1],y),Math.max(b[2],x),Math.max(b[3],y)],[Infinity,Infinity,-Infinity,-Infinity]);
}
export function atlasCamera(state,geometry,catalog,regions){
 if(state.top!=='taiwan')return {mode:'world',center:catalog.countries.find(c=>c.id===state.countryId)?.geography.point||regions.find(r=>r.id===state.top)?.center||[112,22],countryId:state.countryId,regionId:state.top==='world'?'all':state.top};
 let bounds=geometry.mainlandBodyBounds||mainlandBodyBounds(geometry);
 if(state.countyId||state.regionId){
  const selected=geometry.features.filter(f=>state.countyId?f.id===state.countyId:f.properties.regionId===state.regionId);
  if(selected.length){bounds=union(selected.map(f=>f.properties.coreBounds));const cx=(bounds[0]+bounds[2])/2,cy=(bounds[1]+bounds[3])/2;
   const dx=Math.max(.6,(bounds[2]-bounds[0])*.8),dy=Math.max(.6,(bounds[3]-bounds[1])*.75);
   bounds=[cx-dx,cy-dy,cx+dx,cy+dy];
  }
 }
 return {mode:'taiwan',bounds,depth:state.taiwanDepth||'national',regionId:state.regionId,countyId:state.countyId,countryId:'tw'};
}
export const cameraKey=view=>JSON.stringify(view);
export function nearestMarker(hits,[x,y],radius=22){return hits.map(h=>({...h,distance:Math.hypot(h.point[0]-x,h.point[1]-y)})).filter(h=>h.distance<radius).sort((a,b)=>a.distance-b.distance)[0]??null;}
export function interpolateCamera(from,to,progress){const t=1-(1-Math.min(1,Math.max(0,progress)))**3;return {center:[shortestLongitude(from.center[0]+shortestLongitude(to.center[0]-from.center[0])*t),from.center[1]+(to.center[1]-from.center[1])*t],scale:Math.exp(Math.log(from.scale)+(Math.log(to.scale)-Math.log(from.scale))*t)};}
