// Pure navigation and evidence projection. No browser state or private paths.
export const topLevels = [
  ['taiwan','台灣'],['world','世界'],['asia','亞洲'],['oceania','大洋洲'],
  ['europe','歐洲'],['americas','美洲'],['africa','非洲'],
];
export const categoryNames = {attraction:'景點',restaurant:'餐廳',hotel:'飯店'};
const tagLabels={historic_street:'老街散步',night_market:'夜市美食',memorial:'文化地標',landmark:'城市地標',
 親子:'親子',動物互動:'動物互動',度假飯店:'度假飯店',飯店餐廳:'飯店餐廳',自助餐:'自助餐',古著選物探店:'古著選物探店',
 歷史季節活動:'歷史季節活動',非永久場館:'非永久場館',歷史手作體驗:'歷史手作體驗',快閃活動:'快閃活動'};
export const publicTagLabels=tags=>[...new Set(tags.filter(t=>Object.hasOwn(tagLabels,t)).map(t=>tagLabels[t]))];
export const initialState = () => ({top:'taiwan',countryId:'tw',regionId:null,countyId:null,taiwanDepth:'national',category:'all',theme:'all',query:'',view:'places',relation:'visit_confirmed',selectedIds:[]});
const normalized = text => String(text ?? '').normalize('NFKC').toLowerCase().replaceAll('臺','台').trim();
export function reduceAtlas(state, action, geography, catalog) {
  switch (action.type) {
    case 'top':
      if (!topLevels.some(([id])=>id===action.id)) return state;
      return {...state,top:action.id,countryId:action.id==='taiwan'?'tw':null,regionId:null,countyId:null,taiwanDepth:'national',category:'all',theme:'all',query:'',selectedIds:[]};
    case 'explore': return state.top==='taiwan'?{...state,regionId:null,countyId:null,taiwanDepth:'national',selectedIds:[]}:state;
    case 'region':
      if (!geography.regions.some(r=>r.id===action.id)) return state;
      return {...state,top:'taiwan',countryId:'tw',regionId:action.id,countyId:null,taiwanDepth:'counties',selectedIds:[]};
    case 'county': {
      const county = geography.counties.find(c=>c.id===action.id);
      return county ? {...state,top:'taiwan',countryId:'tw',regionId:county.regionId,countyId:county.id,taiwanDepth:'counties',selectedIds:[]} : state;
    }
    case 'country': {
      const country=catalog.countries.find(c=>c.id===action.id);
      if (action.id==='tw') return reduceAtlas(state,{type:'top',id:'taiwan'},geography,catalog);
      if (!country) return state;
      return {...state,top:state.top==='world'?'world':country.region,countryId:country.id,regionId:null,countyId:null,category:'all',selectedIds:[]};
    }
    case 'back':
      if(state.countyId) return {...state,countyId:null,selectedIds:[]};
      if(state.regionId) return {...state,regionId:null,taiwanDepth:'national',selectedIds:[]};
      if(state.top==='taiwan'&&state.taiwanDepth==='regions')return {...state,taiwanDepth:'national'};
      if(state.countryId!=='tw' && state.countryId) return {...state,countryId:null,selectedIds:[]};
      return reduceAtlas(state,{type:'top',id:'taiwan'},geography,catalog);
    case 'category': return action.id==='all'||Object.hasOwn(categoryNames,action.id)?{...state,category:action.id}:state;
    case 'theme': return action.id==='all'||catalog.themes.some(t=>t.id===action.id)?{...state,theme:action.id}:state;
    case 'query': return {...state,query:String(action.value).slice(0,160)};
    case 'view': return ['places','sources'].includes(action.id)?{...state,view:action.id}:state;
    case 'relation': return ['all','visit_confirmed','mention_only','unresolved'].includes(action.id)?{...state,relation:action.id}:state;
    case 'plan': return {...state,selectedIds:state.selectedIds.includes(action.id)?state.selectedIds.filter(id=>id!==action.id):[...state.selectedIds,action.id]};
    default: return state;
  }
}
// Copy and reducer destinations share one model. Overview has no dead back action.
export function atlasNavigation(state,geography,catalog){
 const region=geography.regions.find(r=>r.id===state.regionId),county=geography.counties.find(c=>c.id===state.countyId),country=catalog.countries.find(c=>c.id===state.countryId);
 const crumb=(label,type,id)=>({label,type,id});
 const breadcrumbs=[crumb('世界地圖','top','world')];
 let backLabel=null;
 if(state.top==='taiwan'){
  breadcrumbs.push(crumb('台灣','top','taiwan'));
  if(region)breadcrumbs.push(crumb(region.name,'region',region.id));
  if(county)breadcrumbs.push({label:county.name});
  if(county)backLabel='回'+region.name;
  else if(region)backLabel='回台灣全覽';
 }else{
  const name=topLevels.find(([id])=>id===state.top)?.[1];
  if(state.top!=='world')breadcrumbs.push(crumb(name,'top',state.top));
  if(country){breadcrumbs.push({label:country.name});backLabel=state.top==='world'?'回世界全覽':'回'+name+'全覽';}
 }
 return {breadcrumbs,backLabel,showWorld:state.top==='taiwan'};
}
export function safeSourceUrl(value) {
  try {
    const u=new URL(value);
    if(u.protocol!=='https:' || u.username || u.password) return null;
    const host=u.hostname;
    const allowed = (host==='www.youtube.com'&&u.pathname==='/watch'&&/^[\w-]{11}$/.test(u.searchParams.get('v')||'')) ||
      (host==='www.youtube.com'&&/^\/(?:shorts|live)\/[\w-]{11}\/?$/.test(u.pathname)) ||
      (host==='youtu.be'&&/^\/[\w-]{11}$/.test(u.pathname)) ||
      (['www.instagram.com','instagram.com'].includes(host)&&/^\/(?:[\w.]+\/)?(?:p|reel)\/[\w-]+\/?$/.test(u.pathname)) ||
      (['www.facebook.com','facebook.com'].includes(host)&&(/^[\/]reel\/[\w-]+\/?$/.test(u.pathname)||/^\/[\w.]+\/(posts|videos|reel)\/[\w-]+\/?$/.test(u.pathname))) ||
      (['www.eaglish.store','eaglish.store'].includes(host)&&/^\/(blog|trip)\/[\w/-]+\/$/.test(u.pathname));
    if(!allowed) return null;
    for(const key of [...u.searchParams.keys()]) if(!['v','t'].includes(key))u.searchParams.delete(key);
    u.hash=''; return u.href;
  } catch { return null; }
}
export function publicProjection(atlas, routeExists=()=>false, readiness=null, {reviewedOccurrenceIds=[],excludedSourceIds=[]}={}) {
  const sourceById=new Map(atlas.sources.map(s=>[s.id,s]));
  const reviewed=new Set(reviewedOccurrenceIds);
  const excluded=new Set(excludedSourceIds);
  const positive=new Set(['first_person_caption','first_person_transcript','first_person_article','onsite_visual','user_confirmation']);
  const places=[];
  for(const p of atlas.places) {
    const ready=readiness?.places.find(r=>r.placeId===p.id);
    if(readiness&&ready?.indexEligible!==true)continue;
    if(p.identityStatus!=='confirmed'||p.geoConfidence!=='confirmed'||p.countryId!=='tw'||!p.countyIds.length) continue;
    const visits=atlas.occurrences.filter(o=>o.placeId===p.id&&o.relation==='visit_confirmed'&&o.identityConfidence==='confirmed'&&o.evidence.some(e=>positive.has(e.kind)));
    const ownedVisits=visits.filter(o=>{const s=sourceById.get(o.sourceId);return s&&!excluded.has(s.id)&&(s.ownership==='verified_owned'||reviewed.has(o.id))&&['reviewed','partial'].includes(s.bodyStatus)&&safeSourceUrl(s.canonicalUrl);});
    if(!ownedVisits.length) continue;
    const links=[...new Set(ownedVisits.map(o=>safeSourceUrl(sourceById.get(o.sourceId).canonicalUrl)))];
    const route=p.articlePlanning?.status==='published'&&routeExists(p.articlePlanning.route)?p.articlePlanning.route:null;
    places.push({id:p.id,name:p.canonicalName,aliases:[...p.aliases],countyIds:[...p.countyIds],category:p.category,secondaryCategories:[...new Set((p.secondaryCategories??[]).filter(c=>Object.hasOwn(categoryNames,c)&&c!==p.category))],tags:publicTagLabels(p.tags),recordKind:ready?.recordKind||'place',sourceLinks:links,articleUrl:route?`https://www.eaglish.store${route}`:null});
  }
  return {version:'taiwan-public/v1',geography:atlas.geography,places};
}
export function selectPlaces(state, data) {
  if(state.countryId!=='tw') return [];
  const countyIds=new Set(data.geography.counties.filter(c=>!state.regionId||c.regionId===state.regionId).map(c=>c.id));
  const q=normalized(state.query);
  return data.places.filter(p=>p.countyIds.some(id=>state.countyId?id===state.countyId:countyIds.has(id)) &&
    (state.category==='all'||p.category===state.category||(p.secondaryCategories??[]).includes(state.category)) && (!q||normalized([p.name,...p.aliases,...p.tags,...p.countyIds.map(id=>data.geography.counties.find(c=>c.id===id)?.name)].join(' ')).includes(q)));
}
export function eligibleCountryIds(state,catalog) {
  if(state.top==='taiwan') return ['tw'];
  return catalog.countries.filter(c=>(state.top==='world'||c.region===state.top)&&(!state.countryId||c.id===state.countryId)).map(c=>c.id);
}
export function selectGuides(state,catalog) {
  const eligible=new Set(eligibleCountryIds(state,catalog));
  const ids=new Set(catalog.countries.filter(c=>eligible.has(c.id)).flatMap(c=>c.guideIds));
  return catalog.guides.filter(g=>ids.has(g.id)&&(state.theme==='all'||!state.theme||g.suitableFor.includes(state.theme))&&normalized([g.name,g.summary].join(' ')).includes(normalized(state.query)));
}
export function sourceGroups(state, atlas, projected) {
  const visible=new Set(selectPlaces({...state,query:''},projected).map(p=>p.id));
  const q=normalized(state.query);
  return atlas.sources.map(s=>({source:s,occurrences:atlas.occurrences.filter(o=>visible.has(o.placeId)&&(state.relation==='all'||o.relation===state.relation)).filter(o=>o.sourceId===s.id)
    .sort((a,b)=>(a.evidence.find(e=>e.timecode)?.timecode.startSeconds??Infinity)-(b.evidence.find(e=>e.timecode)?.timecode.startSeconds??Infinity))}))
    .filter(g=>g.occurrences.length&&(!q||normalized([g.source.id,g.source.title,g.source.canonicalUrl,...g.occurrences.map(o=>atlas.places.find(p=>p.id===o.placeId)?.canonicalName)].join(' ')).includes(q)));
}
export function csvText(rows) {
  const cell=v=>'"'+String(v??'').replace(/^[=+@-]/,"'$&").replaceAll('"','""')+'"';
  return '\ufeff'+[['id','名稱','類別','縣市','來源','副類別'],...rows.map(p=>[p.id,p.name,p.category,p.countyIds.join(' / '),p.sourceLinks.join(' / '),(p.secondaryCategories??[]).join(' / ')])].map(row=>row.map(cell).join(',')).join('\r\n');
}
