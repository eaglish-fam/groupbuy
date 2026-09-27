// Keep core city stops on their own day; optional additions yield to that day.
export function stopOwners(plan,pace,config){
 const preferred={blue:'city','night-market':'city',black:'north'};
 const owners={};
 for(const id of plan){const r=config.routes.find(r=>r.id===id);for(const stop of r[pace==='compact'?'compactSteps':'steps']){const key=stop[3];if(key&&!owners[key])owners[key]=id;}}
 for(const [key,id] of Object.entries(preferred))if(plan.includes(id)&&owners[key])owners[key]=id;
 return owners;
}
