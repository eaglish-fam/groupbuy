import {approvedTravelSchema,validateApprovedTravelPackage} from '../trip/approved-travel-contract.mjs';
import {approvedInlineTokens} from './trip-approved-text.mjs';

const aid=value=>value.replaceAll('--','-');
const sid=value=>value.toLowerCase().replaceAll(':','-');
const cityInfo={oslo:{name:'奧斯陸',englishName:'Oslo',countryId:'norway'},svalbard:{name:'斯瓦巴',englishName:'Svalbard',countryId:'norway',destinationKind:'archipelago',visitedBase:'Longyearbyen'},tromso:{name:'特羅姆瑟',englishName:'Tromsø',countryId:'norway'},amsterdam:{name:'阿姆斯特丹',englishName:'Amsterdam',countryId:'netherlands'}};
const placeBindings={'os-natural-history':'oslo-natural-history','os-historical':'oslo-historical','os-fram':'oslo-fram','tr-polaria':'tromso-polaria','tr-reindeer':'tromso-reindeer','tr-fjellheisen':'tromso-fjellheisen','tr-polar-museum':'tromso-polar-museum','sv-town':'svalbard-town','sv-museum':'svalbard-museum','sv-seed':'svalbard-seed-vault','sv-dogs':'svalbard-dog-wagon','sv-cruise':'svalbard-cruise','sv-city-tour':'svalbard-guiding','am-artis':'amsterdam-artis','am-giethoorn':'netherlands-giethoorn'};
const factKeys=['what','play','arrival','duration','availability','conditions'];
const section=(page,id)=>{const s=page.sections.find(s=>s.id===id);if(!s)throw Error('Missing final editorial section '+id);return s;};
const unique=values=>[...new Set(values)];
const inlineLinks=values=>values.flatMap(value=>approvedInlineTokens(value).filter(t=>t.url).map(({url,label})=>({url,label})));

/** Pure composition only. Caller verifies immutable owner receipts first.
 * This does not read private workspaces or authorize publication. */
export function composeApprovedEditorialPackage({editorial,media,planning,routeData,ownerAccepted=false}){
 if(!ownerAccepted||editorial.schema!=='alma.travel-editorial-content/v1'||editorial.pages.length!==6)throw Error('Current accepted six-page editorial export required');
 const assets=structuredClone(media.assets),sourceList=structuredClone([...planning.sources,...media.sources]),sourceMap=new Map(sourceList.map(s=>[s.id,s]));
 const assetMap=new Map(assets.map(a=>[a.assetId,a]));
 for(const entry of editorial.media){const asset=assetMap.get(aid(entry.assetId));if(!asset)throw Error('Unresolved final editorial media');asset.alt=entry.alt;asset.caption=entry.caption;}
 const addLink=(url,label,checkedOn,publicTitle=false)=>{
  // Keep per-page approved public titles distinct from provenance labels and
  // from another page's different approved title for the same source URL.
  const found=[...sourceMap.values()].find(s=>s.url===url&&(!publicTitle||s.label===label));if(found)return found.id;
  const kind=/youtube\.com|youtu\.be/.test(new URL(url).hostname)?'youtube':/instagram\.com/.test(new URL(url).hostname)?'instagram':'official';
  const id='editorial-source-'+String(sourceMap.size+1).padStart(3,'0');
  sourceMap.set(id,{id,kind,url,label,checkedOn,rights:kind==='official'?'已核正文引用的公開資料；照片權利依各圖來源。':'鷹式一家已公開的自有旅行紀錄。'});return id;
 };
 const pageSources=page=>{
  const links=[];
  const visit=value=>{if(typeof value==='string'){for(const l of inlineLinks([value]))if(l.url.startsWith('https://'))links.push(l);if(/^https:\/\//.test(value)&&!value.includes(' '))links.push({url:value,label:page.title});}else if(Array.isArray(value))value.forEach(visit);else if(value&&typeof value==='object')Object.values(value).forEach(visit);};
  visit(page.sections);visit(page.lead);visit(page.sources);
  return unique(links.map(l=>addLink(l.url,l.label,page.checkedOn||page.updatedOn)));
 };
 const imagesSources=ids=>unique(ids.flatMap(id=>assetMap.get(aid(id))?.sourceIds||[]));
 const module=(s,sourceIds)=>({title:s.title,paragraphs:s.body||[],sourceIds,images:(s.galleryAssetIds||[]).map(aid),links:inlineLinks(s.links||[])});
 const cities=editorial.pages.filter(p=>p.type!=='country_hub').map(page=>{
  const id=page.id.replace('-guide',''),info=cityInfo[id];if(!info)throw Error('Unsupported city');
  const ps=pageSources(page),rawPlaces=section(page,'places').places;
  const planner=structuredClone(planning.planners[id]);if(!planner)throw Error('Missing source-owned planner');
  const anchors=new Map(rawPlaces.map(p=>[placeBindings[p.id]||p.id,p.id]));
  const translate=id=>{if(!anchors.has(id))throw Error('Unresolved final planner place '+id);return anchors.get(id);};
  for(const route of planner.routes)for(const day of route.days){day.stops=day.stops.map(translate);for(const block of day.blocks||[])block.placeIds=block.placeIds.map(translate);}
  for(const rule of planner.rules)rule.placeId=translate(rule.placeId);
  for(const rule of planner.calendar||[])rule.placeId=translate(rule.placeId);
  const planSection=section(page,'plan');planner.title=planSection.title;planner.paragraphs=[...planSection.body,...(planSection.planner.conditions||[]),...(planSection.planner.hint?[planSection.planner.hint]:[])];
  const sourceIds=unique([...ps,...planner.sourceIds,...imagesSources(rawPlaces.flatMap(p=>p.galleryAssetIds))]);
  if(!sourceIds.length)throw Error('Final page needs actual public sources');
  const places=rawPlaces.map(p=>{
   const refs=unique([...imagesSources(p.galleryAssetIds),...(planner.rules.find(r=>r.placeId===p.id)?.sourceIds||[]),...inlineLinks(p.links||[]).filter(l=>l.url.startsWith('https://')).map(l=>addLink(l.url,l.label,page.checkedOn))]);
   if(p.facts.length<6)throw Error('Final place requires six questions');
   return {id:p.id,stableId:placeBindings[p.id]||p.id,title:p.title,paragraphs:p.body,sourceIds:refs.length?refs:sourceIds,images:p.galleryAssetIds.map(aid),facts:Object.fromEntries(factKeys.map((key,i)=>[key,{label:p.facts[i].label,value:p.facts[i].value,sourceIds:refs.length?refs:sourceIds}])),extraFacts:p.facts.slice(6).map(f=>({label:f.label,value:f.value,sourceIds:refs.length?refs:sourceIds})),...(p.story?.length?{story:{text:p.story.join('\n\n'),paragraphs:p.story,sourceIds:unique([...imagesSources(p.galleryAssetIds),...ps.filter(id=>['instagram','youtube'].includes(sourceMap.get(id).kind))])}}:{}),links:inlineLinks(p.links||[]),supportImages:(p.supportAssetIds||[]).map(aid),additionalGalleries:(p.additionalGalleries||[]).map(g=>({title:g.title,images:g.assetIds.map(aid)}))};
  });
  const hero=[page.hero.mainAssetId,...page.hero.supportAssetIds].map(aid);
  return {id,...info,destinationKind:info.destinationKind||'city',path:page.canonicalPath,title:page.title,subtitle:page.subtitle,metadataTitle:page.metadata.title,description:page.metadata.description,author:page.author,updatedOn:page.updatedOn,intro:page.lead,sourceIds,hero,places,cards:section(page,'photos').cards.map(c=>({target:c.placeId,title:c.title,play:c.play,time:c.time,assetId:aid(c.assetId),focalPoint:assetMap.get(aid(c.assetId)).focalPoint})),food:module(section(page,'food'),sourceIds),stay:module(section(page,'stay'),sourceIds),arrival:module(section(page,'arrival'),sourceIds),rain:module(section(page,'weather'),sourceIds),reading:module(section(page,'day-reading'),sourceIds),faq:section(page,'faq').faq.map(q=>({question:q.question,answer:q.answer,sourceIds})),planner,videoSourceIds:unique(inlineLinks(section(page,'videos').links).map(l=>addLink(l.url,l.label,page.checkedOn,true))),extension:module(section(page,'related'),sourceIds)};
 });
 const countries=editorial.pages.filter(p=>p.type==='country_hub').map(page=>{
  const id=page.id.replace('-hub',''),norway=id==='norway',code=norway?'NO':'NL',info=routeData.geography.countryLayouts.find(g=>g.countryCode===code),localCities=cities.filter(c=>c.countryId===id),sourceIds=unique([...pageSources(page),...localCities.flatMap(c=>c.sourceIds)]);
  const mapSection=section(page,'map'),geoPoints=routeData.geography.places.filter(p=>p.country===code),point=p=>({cityId:p.id==='svalbard-longyearbyen'?'svalbard':p.id==='giethoorn'?'amsterdam':p.id,label:p.id==='svalbard-longyearbyen'?'斯瓦巴・長年鎮':p.id==='giethoorn'?'羊角村':localCities.find(c=>c.id===p.id).name,point:p.geoJSONCoordinates,sourceIds:p.sourceIds.map(sid)});
  const candidate=routeData.countryCandidates.find(r=>r.country===code),minimum=norway?{oslo:2,svalbard:3,tromso:2}:{amsterdam:2},routeRefs=candidate.sourceIds.map(sid),cityIds=norway?['oslo','svalbard','tromso']:['amsterdam'];
  const planSection=section(page,'plan');
  const referencePlans=planSection.planner.routeSuggestions.filter(r=>r.id!==candidate.id&&r.calendarDays===16).map(r=>{
   const source=routeData.countryCandidates.find(c=>c.id===r.id);if(!source||source.calendarDays!==r.calendarDays||source.dayPlan.length!==r.days.length)throw Error('Unbound editorial reference timetable');
   const destinationNames={Taipei:'台北',Europe:'歐洲',Oslo:'奧斯陸',Longyearbyen:'長年鎮','Tromsø':'特羅姆瑟',Amsterdam:'阿姆斯特丹',Giethoorn:'羊角村'};
   return {id:r.id,title:r.title,calendarDays:r.calendarDays,sourceIds:source.sourceIds.map(sid),days:r.days.map(day=>{
    if(source.dayPlan[day.day-1].kind!==day.kind)throw Error('Reference day type differs from accepted facts');
    const destination=day.location.split(' → ').map(name=>{if(!destinationNames[name])throw Error('Unknown reference destination');return destinationNames[name];}).join(' → ');
    return {day:day.day,kind:day.kind,destination,paragraphs:[...(day.steps||[]),...(day.note?[day.note]:[])]};
   })};
  });
  const allocation={approved:true,arrivalDays:1,departureDays:1,dayRange:[candidate.calendarDays,candidate.calendarDays+6],extraDays:'round-robin',sourceIds:routeRefs,minimumStay:Object.fromEntries(Object.entries(minimum).map(([id,days])=>[id,{leisure:days,compact:days}])),routes:[{id:candidate.id,label:norway?'奧斯陸 → 斯瓦巴 → 特羅姆瑟':'阿姆斯特丹與羊角村',description:candidate.condition,cityIds,transferDays:norway?[1,1]:[],...(norway?{terminalTransfer:{from:'tromso',to:'oslo',days:1,sourceIds:routeRefs}}:{}),validFrom:'2026-01-01',validThrough:'2026-12-31',sourceIds:routeRefs}]};
  const exp=section(page,'experiences'),themes=unique(exp.experienceCards.map(c=>c.category));
  const geographicMap={caption:mapSection.mapData.scaleLabel||mapSection.mapData.label,sourceIds:unique(geoPoints.flatMap(p=>p.sourceIds.map(sid))),views:norway?[{id:'mainland',label:'挪威本土',note:'奧斯陸與特羅姆瑟',bounds:info.map.mainlandViewport,points:geoPoints.filter(p=>p.id!=='svalbard-longyearbyen').map(point)},{id:'svalbard-inset',label:'斯瓦巴群島・長年鎮',note:'離島框與本土不同比例',bounds:info.map.svalbardInsetViewport,points:geoPoints.filter(p=>p.id==='svalbard-longyearbyen').map(point)}]:[{id:'netherlands-main',label:'阿姆斯特丹與羊角村',note:'羊角村是區域日遊目的地',bounds:info.map.viewport,points:geoPoints.map(point)}],connections:norway?[{fromLabel:'奧斯陸',toLabel:'斯瓦巴',label:'依實際班次安排',mode:'flight',sourceIds:routeRefs},{fromLabel:'斯瓦巴',toLabel:'特羅姆瑟',label:'依實際班次安排',mode:'flight',sourceIds:routeRefs},{fromLabel:'特羅姆瑟',toLabel:'奧斯陸',label:'國際航班銜接',mode:'flight',sourceIds:routeRefs}]:[]};
  const presentation={overviewTitle:mapSection.title,overviewText:mapSection.body.join(' '),destinationNotes:localCities.length===1?mapSection.citySwitch.cards.map(c=>({title:c.title,paragraphs:c.body,links:[{url:c.href,label:c.title}]})):[],citySummaries:mapSection.citySwitch.cards.filter(c=>localCities.some(city=>city.id===c.destinationId)).map(c=>({cityId:c.destinationId,tag:c.title,intro:c.body.join(' ')})),themes:themes.map((label,i)=>({id:'theme-'+(i+1),label})),placeThemes:exp.experienceCards.map(c=>({cityId:c.destinationId==='daytrip'?'amsterdam':c.destinationId,placeId:c.placeId,themeIds:['theme-'+(themes.indexOf(c.category)+1)]})),experienceTitle:exp.title,experienceParagraphs:exp.body,routeInspirations:section(page,'routes').routeCards.map(c=>({title:c.title,paragraphs:c.body,links:inlineLinks([`[${c.title}](${c.href})`])}))};
  return {id,name:norway?'挪威':'荷蘭',englishName:info.englishName,flag:info.flag,path:page.canonicalPath,title:page.title,subtitle:page.subtitle,metadataTitle:page.metadata.title,description:page.metadata.description,intro:page.lead,updatedOn:page.updatedOn,sourceIds,cityIds:localCities.map(c=>c.id),image:aid(page.hero.mainAssetId),faq:section(page,'faq').faq.map(q=>({question:q.question,answer:q.answer,sourceIds})),geographicMap,presentation,allocation,referencePlans,planInfo:{...module(section(page,'plan'),sourceIds),paragraphs:[...section(page,'plan').body,...section(page,'plan').planner.conditions,section(page,'plan').planner.hint]},packing:module(section(page,'packing'),sourceIds),videos:module(section(page,'videos'),sourceIds),related:module(section(page,'related'),sourceIds),discovery:{region:'europe',subregion:norway?'northern-europe':'western-europe',summary:page.metadata.description,assetId:aid(page.hero.mainAssetId),sourceIds,point:norway?[10.738889,59.913333]:[4.883333,52.366667],isoNumeric:norway?'578':'528'}};
 });
 const data={schema:approvedTravelSchema,approved:true,coverage:{countryIds:countries.map(c=>c.id),cityIds:cities.map(c=>c.id)},sources:[...sourceMap.values()],assets,countries,cities};
 validateApprovedTravelPackage(data);return data;
}
