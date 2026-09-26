// Deterministic, local-only route selection; no booking or live opening-hours claim.
export function resizePlan(current,days,config){
 const defaults=config.combinations.find(c=>c.days===Number(days));
 if(!defaults)throw new RangeError('Unsupported day count');
 const allowed=new Set(config.routes.map(r=>r.id));
 return [...new Set([...current,...defaults.routes,...allowed])].filter(id=>allowed.has(id)).slice(0,defaults.days);
}
export function replaceDay(current,index,routeId,config){
 if(!Number.isInteger(index)||index<0||index>=current.length)throw new RangeError('Invalid day');
 if(!config.routes.some(r=>r.id===routeId))throw new RangeError('Unknown route');
 const next=[...current],other=next.indexOf(routeId);
 if(other!==-1)next[other]=next[index];
 next[index]=routeId;
 return next;
}
