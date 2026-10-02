// R24 candidate curation and browser-local planning. No account or network writes.
import {reduceAtlas,selectPlaces} from './atlas-model.mjs';
export const excludedTaiwanPlaceIds=Object.freeze(['place-tw-christmasland','place-tw-winterland','place-tw-fayaque-a9']);
export const planStorageKey='eaglish.taiwan-trip-list.v1';
export function normalizePlanIds(ids,data){
 const valid=new Set(data.places.filter(p=>!excludedTaiwanPlaceIds.includes(p.id)).map(p=>p.id));
 return Array.isArray(ids)?[...new Set(ids.filter(id=>typeof id==='string'&&valid.has(id)))].slice(0,200):[];
}
export function plannedPlaces(ids,data){const byId=new Map(data.places.map(p=>[p.id,p]));return normalizePlanIds(ids,data).map(id=>byId.get(id));}
export function movePlan(ids,id,direction,data){const list=normalizePlanIds(ids,data),i=list.indexOf(id),j=i+direction;if(![-1,1].includes(direction)||i<0||j<0||j>=list.length)return list;[list[i],list[j]]=[list[j],list[i]];return list;}
export function reducePlaceExperience(state,action,geography,catalog,data){
 const ids=normalizePlanIds(state.selectedIds,data),valid=data.places.some(p=>p.id===action.id&&!excludedTaiwanPlaceIds.includes(p.id));
 if(action.type==='plan')return valid?{...state,selectedIds:ids.includes(action.id)?ids.filter(id=>id!==action.id):[...ids,action.id]}:state;
 if(action.type==='plan-remove')return valid?{...state,selectedIds:ids.filter(id=>id!==action.id)}:state;
 if(action.type==='plan-up'||action.type==='plan-down')return {...state,selectedIds:movePlan(ids,action.id,action.type==='plan-up'?-1:1,data)};
 const next=reduceAtlas(state,action,geography,catalog);
 return {...next,selectedIds:ids,category:next.top==='taiwan'&&next.category==='all'?'attraction':next.category};
}
export function selectExperiencePlaces(state,data){return selectPlaces(state,data).filter(p=>state.category==='all'||p.category===state.category);}
export function readPlan(storage,data){
 try{const raw=storage.getItem(planStorageKey);if(!raw)return {ids:[],available:true};if(raw.length>20000)return {ids:[],available:true};const saved=JSON.parse(raw);return {ids:saved.version===1?normalizePlanIds(saved.ids,data):[],available:true};}catch{return {ids:[],available:false};}
}
export function writePlan(storage,ids,data){try{storage.setItem(planStorageKey,JSON.stringify({version:1,ids:normalizePlanIds(ids,data)}));return true;}catch{return false;}}
export function mapsUrls(place,geography){
 const county=place.countyIds.map(id=>geography.counties.find(c=>c.id===id)?.name).filter(Boolean).join(' ');
 const query=[place.name,place.address||county,'台灣'].filter(Boolean).join(' ');
 const search=new URL('https://www.google.com/maps/search/');search.searchParams.set('api','1');search.searchParams.set('query',query);
 const directions=new URL('https://www.google.com/maps/dir/');directions.searchParams.set('api','1');directions.searchParams.set('destination',query);
 return {search:search.href,directions:directions.href,query};
}

// Focus policy only; existing selection, storage and content logic above stays exact.
export function planFocusIntent(type,id,beforeIds,afterIds){
 if(!['plan-up','plan-down','plan-remove','plan-undo'].includes(type))return null;
 if(!afterIds.length)return {heading:true};
 let target=id;
 if(type==='plan-remove'){
  const index=beforeIds.indexOf(id),retained=new Set(afterIds);
  target=index<0?afterIds[0]:beforeIds.slice(index+1).find(v=>retained.has(v))??beforeIds.slice(0,index).reverse().find(v=>retained.has(v))??afterIds[0];
 }else if(!afterIds.includes(target))target=afterIds[0];
 const actions=type==='plan-up'?['plan-up','plan-down','plan-remove','place-detail']:type==='plan-down'?['plan-down','plan-up','plan-remove','place-detail']:['plan-remove','place-detail','plan-up','plan-down'];
 return {id:target,actions};
}
