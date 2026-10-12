import {materializeMalaysiaRoute,malaysiaProfileKind} from '../trip/malaysia-plan-model.mjs';
import {validateMalaysiaExecutionProfile} from '../trip/malaysia-profile.mjs';

const copy=value=>JSON.parse(JSON.stringify(value));
const labels={what:'這是什麼',play:'怎麼玩',arrival:'交通',duration:'遊玩時長',availability:'開放與預約',conditions:'同行條件'};

// This adapter accepts the owner-reviewed research DTO; it does not retrieve
// accounts, private transcripts or operator data, and cannot register pages.
export function compileMalaysiaPlanner({research,venueFacts,officialSources,entopiaIdentityVerified=false}){
 if(research.planner?.schema!=='terra.planner-research/v1'||research.planner.timeZone!=='Asia/Kuala_Lumpur')throw Error('Unsupported research');
 const sources=new Map(officialSources.map(s=>[s.id,s]));
 const publicId=id=>'my-'+id.toLowerCase();
 const publicIds=ids=>ids.map(id=>{if(!sources.has(id))throw Error('Unresolved research source '+id);return publicId(id);});
 const sourceUrl=ids=>ids.map(id=>sources.get(id)?.url).find(url=>typeof url==='string'&&url.startsWith('https://'));
 const cities=['penang','kuala-lumpur'].map(id=>{
  const modules=research.planner.modules.filter(m=>m.city===id),plans=research.planner.plans.filter(m=>m.city===id);
  if(plans.length!==3||plans.some(p=>![2,3,4].includes(p.fullSightseeingDays)))throw Error('Missing reviewed plans');
  const referenced=new Set(modules.flatMap(m=>m.blocks.flatMap(b=>b.placeIds)));
  if(id==='penang')referenced.add('my-penang-top-jurassic');
  const selected=venueFacts.venues.filter(v=>v.city===id&&referenced.has(v.id));
  if([...referenced].some(ref=>!selected.some(v=>v.id===ref)))throw Error('Unresolved venue reference');
  const venues=selected.map(v=>({id:v.id,title:v.id==='my-penang-butterfly-garden'&&entopiaIdentityVerified?'Entopia by Penang Butterfly Farm':v.title,opening:copy(v.opening),gate:v.plannerGate,url:sourceUrl(v.facts.availability.sourceIds),sourceIds:publicIds(v.facts.availability.sourceIds)}));
  const city={id,name:id==='penang'?'檳城':'吉隆坡',path:id==='penang'?'/trip/guides/penang-with-kids/':'/trip/guides/kuala-lumpur-with-kids/',places:selected.map(v=>({id:v.id,title:venues.find(x=>x.id===v.id).title,links:[{label:'Google Maps',url:v.location.mapsUrl},...(sourceUrl(v.facts.availability.sourceIds)?[{label:'營運資料',url:sourceUrl(v.facts.availability.sourceIds)}]:[])],facts:Object.fromEntries(Object.entries(labels).map(([key,label])=>[key,{label,value:v.facts[key].text,sourceIds:v.facts[key].sourceIds,kind:v.facts[key].kind}]))})),planner:{title:'檳城／吉隆坡行程工程檢查',paragraphs:['這是已核研究的工程接線，不是定稿攻略或已預訂行程。只算完整遊玩日，抵達、離境及跨城交通另計。','選日期後比較休館與時段；可依雨天交換日序或縮短，未確認的宅邸與果園不會被自動排入。'],rules:[],executionProfile:{kind:malaysiaProfileKind,cityId:id,checkedOn:venueFacts.checkedOn,timeZone:research.planner.timeZone,modules:copy(modules),venues},routes:[]}};
  for(const m of city.planner.executionProfile.modules)m.sourceIds=publicIds(m.sourceIds);
  for(const place of city.places)for(const fact of Object.values(place.facts))fact.sourceIds=publicIds(fact.sourceIds);
  city.planner.title='排行程';
  city.planner.paragraphs=['選擇遊玩天數與步調；遇到強降雨，可以交換室內日，或留半日與休息。'];
  validateMalaysiaExecutionProfile(city.planner.executionProfile,{cityId:id,placeIds:city.places.map(p=>p.id)});
  city.planner.routes=plans.flatMap(plan=>['leisure','compact'].map(pace=>{
   const route={id:plan.id+'-'+pace,sightseeingDays:plan.fullSightseeingDays,pace,label:`${plan.fullSightseeingDays} 天 · ${pace==='leisure'?'悠閒':'緊湊'}`,moduleIds:[...plan.moduleIds],note:'時段與地面交通為建議緩衝，請依當日路況及票券確認；不是實測車程、保證場次或家庭歷史行程。'};
   route.note='出發前確認入場票及活動時段。';
   route.days=materializeMalaysiaRoute(city,route).map(({assessment,index,date,adjustments,...day})=>({...day,adjustments}));return route;
  }));
  return city;
 });
 const used=new Set(cities.flatMap(c=>[...c.planner.executionProfile.modules.flatMap(m=>m.sourceIds),...c.planner.executionProfile.venues.flatMap(v=>v.sourceIds),...c.places.flatMap(p=>Object.values(p.facts).flatMap(f=>f.sourceIds))]));
 const publicSources=officialSources.filter(s=>used.has(publicId(s.id))).map(s=>({id:publicId(s.id),kind:'official',url:s.url,checkedOn:s.checkedOn,label:s.title,rights:'Reference link only; no media reuse permission inferred.'}));
 return {schema:'eaglish.malaysia-engineering-planner/v1',checkedOn:venueFacts.checkedOn,engineeringOnly:true,pageRegistration:false,sources:publicSources,cities};
}
