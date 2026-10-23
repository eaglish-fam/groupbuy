// Public, portable data only. An approval flag records owner review; it cannot
// grant publishing authority or prove the truth of the referenced sources.
import {validateMalaysiaExecutionProfile} from './malaysia-profile.mjs';
export const approvedTravelSchema='eaglish.approved-travel-package/v1';
const fail=message=>{throw Error('Approved travel package: '+message);};
export const text=value=>{if(typeof value!=='string'||!value.trim())fail('non-empty text required');return value;};
export const id=value=>{if(typeof value!=='string'||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value))fail('invalid stable ID');return value;};
export const positive=value=>{if(!Number.isInteger(value)||value<1)fail('positive integer required');return value;};
export const calendarDate=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(value+'T00:00:00Z'))&&new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value;
export function publicUrl(value){
 if(typeof value!=='string'||!/^(https:\/\/|\/trip\/|#[a-z0-9-]+$)/.test(value)||/[\\\s<>"']/.test(value)||/%(?:2e|2f|5c)/i.test(value.split(/[?#]/)[0])||/[?&](?:access_token|api_key|oauth_code)=/i.test(value))fail('unsafe public URL');
 const u=new URL(value,'https://www.eaglish.store');
 if(u.protocol!=='https:'||u.username||u.password||value.split(/[?#]/)[0].split('/').includes('..'))fail('unsafe public URL');
 return value;
}
export function publicAssetUrl(value){
 if(typeof value!=='string'||!/^\/trip\/assets\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.webp$/.test(value))fail('unsafe public WebP path');return value;
}
export function publicDiagramUrl(value){
 if(typeof value!=='string'||!/^\/trip\/assets\/[a-zA-Z0-9_-]+\.svg$/.test(value))fail('unsafe public diagram path');return value;
}
export function validateCityIntro(intro,leadFormat){
 strings(intro);
 if(leadFormat===undefined){if(intro.length!==2)fail('two approved leads required');}
 else if(leadFormat!=='longform-context/v1'||intro.length<3||intro.length>4)fail('invalid approved longform context');
 return intro;
}
export function routePath(value){if(typeof value!=='string'||!/^\/trip\/(?:[a-z0-9-]+\/)+$/.test(value))fail('invalid page path');return value;}
export function focalPoint(value){if(!Array.isArray(value)||value.length!==2||value.some(v=>!Number.isFinite(v)||v<0||v>100))fail('invalid approved focal point');return value;}
const array=value=>{if(!Array.isArray(value))fail('array required');return value;};
const unique=(values,label)=>{if(new Set(values).size!==values.length)fail('duplicate '+label);return values;};
const strings=value=>array(value).forEach(text);
const clockTime=value=>value==='24:00'||typeof value==='string'&&/^\d{2}:\d{2}$/.test(value)&&Number(value.slice(0,2))<24&&Number(value.slice(3))<60;
const minutes=value=>Number(value.slice(0,2))*60+Number(value.slice(3));
export const approvedRouteDayKinds=Object.freeze(['international_outbound','arrival','full_play','full_play_flexible','full_play_regional','transfer','international_departure','international_arrival']);
export function validateApprovedTravelPackage(data,{countryIds,cityIds,routeIds}={}){
 if(!data||data.schema!==approvedTravelSchema||data.approved!==true)fail('owner-approved schema required');
 // Private working paths, task dispatches and raw source locators are not public provenance.
 const raw=JSON.stringify(data);
 if(/\/Users\/|\/tmp\/|file:\/\/|"(?:rawPath|videoPath|transcriptDirectory|dispatchId|packetSha256|credentials|accessToken)"/i.test(raw))fail('private dependency');
 const sourceMap=new Map(),assets=new Map(),countries=new Map(),cities=new Map(),diagrams=new Map(),routes=new Map();
 const sources=value=>{
  if(!Array.isArray(value)||!value.length||new Set(value).size!==value.length||value.some(v=>!sourceMap.has(v)))fail('unresolved source provenance');
 };
 for(const s of array(data.sources)){
  id(s.id);if(sourceMap.has(s.id))fail('duplicate source');
  if(!['official','youtube','instagram','photo'].includes(s.kind))fail('invalid source kind');
  if(!publicUrl(s.url).startsWith('https://'))fail('source needs HTTPS');text(s.rights);
  if((s.kind==='official'||s.checkedOn!==undefined)&&!calendarDate(s.checkedOn))fail('invalid source check date');
  if(s.locator!==undefined)text(s.locator);sourceMap.set(s.id,s);
 }
 for(const a of array(data.assets)){
  id(a.assetId);if(assets.has(a.assetId))fail('duplicate asset');positive(a.width);positive(a.height);text(a.alt);text(a.caption);focalPoint(a.focalPoint);sources(a.sourceIds);
  const lineage=a.lineage,picture=lineage?.activePicture;
  if(!lineage||!['photo','video-frame'].includes(lineage.kind)||!/^[a-f0-9]{64}$/.test(lineage.sourceSha256))fail('source/active-picture lineage required');
  positive(lineage.sourceWidth);positive(lineage.sourceHeight);
  if(!picture||!Number.isInteger(picture.x)||!Number.isInteger(picture.y)||picture.x<0||picture.y<0)fail('invalid active-picture origin');
  positive(picture.width);positive(picture.height);
  if(picture.x+picture.width>lineage.sourceWidth||picture.y+picture.height>lineage.sourceHeight||Math.abs(a.height-a.width*picture.height/picture.width)>1)fail('active-picture bounds/ratio');
  if(lineage.kind==='video-frame'&&(!Number.isInteger(lineage.pts)||lineage.pts<0||!/^\d+\/[1-9]\d*$/.test(lineage.timebase)||Number(lineage.timebase.split('/')[0])<1))fail('exact frame PTS/timebase required');
  if(!array(a.variants).length)fail('empty variants');let previous=0;
  unique(a.variants.map(v=>v.url),'variant URL');
  for(const v of a.variants){
   publicAssetUrl(v.url);positive(v.width);positive(v.height);positive(v.bytes);
   if(!/^[a-f0-9]{64}$/.test(v.sha256)||v.width<=previous||v.width>1440||v.width>a.width||Math.abs(v.height-v.width*a.height/a.width)>1)fail('invalid variant dimensions/hash');
   if(v.bytes>(v.width<=640?120000:v.width<=960?220000:409600))fail('variant size budget');previous=v.width;
  }
  if(a.variants.length<2||!a.variants.some(v=>v.width<=640))fail('responsive variants required');
  if(a.cardPhoto){const card=a.cardPhoto,crop=card.activePicture;
   positive(card.width);positive(card.height);
   if(!crop||![crop.x,crop.y,crop.width,crop.height].every(Number.isInteger)||crop.x<0||crop.y<0||crop.width<1||crop.height<1||crop.x+crop.width>lineage.sourceWidth||crop.y+crop.height>lineage.sourceHeight||Math.abs(card.height-card.width*crop.height/crop.width)>1)fail('card crop lineage');
   if(card.width>crop.width||card.height>crop.height||!Array.isArray(card.variants)||card.variants.length<2)fail('card responsive variants');
   const resampling=card.variantResampling;
   if(resampling&&(resampling.method!=='lanczos'||resampling.effectiveSourceWidth!==crop.width||resampling.effectiveSourceHeight!==crop.height||resampling.maxOutputWidth!==1440||resampling.nativeDetailAdded!==false))fail('card resampling disclosure');
   const maxVariantWidth=resampling?resampling.maxOutputWidth:card.width;
   let last=0;for(const v of card.variants){publicAssetUrl(v.url);positive(v.width);positive(v.height);positive(v.bytes);if(v.width<=last||v.width>maxVariantWidth||v.width>1440||Math.abs(v.height-v.width*card.height/card.width)>1||!/^[a-f0-9]{64}$/.test(v.sha256)||v.bytes>(v.width<=640?120000:v.width<=960?220000:409600))fail('card variant');last=v.width;}
   if(!card.variants.some(v=>v.width<=640))fail('card mobile variant');
  }
  assets.set(a.assetId,a);
 }
 const image=assetId=>{if(!assets.has(assetId))fail('unresolved approved image');return assets.get(assetId);};
 const photoPair=refs=>{if(array(refs).length!==2||new Set(refs).size!==2)fail('two distinct card photographs');const pair=refs.map(image);if(pair.some(a=>a.lineage.kind!=='photo'||a.width>=a.height)||new Set(pair.map(a=>a.lineage.sourceSha256)).size!==2)fail('independent original portrait photographs required');};
 const links=value=>{for(const l of array(value)){text(l.label);publicUrl(l.url);}};
 const faq=value=>{if(!array(value).length)fail('FAQ required');for(const q of value){text(q.question);text(q.answer);sources(q.sourceIds);}};
 const module=(value,child=false)=>{text(value.title);strings(value.paragraphs);if(!value.paragraphs.length&&!(value.links||[]).length&&!value.subsections?.length)fail('empty module');sources(value.sourceIds);for(const a of value.images||[])image(a);links(value.links||[]);
  if(value.subsections){if(child||!array(value.subsections).length||value.subsections.length>12)fail('bounded module subsections required');unique(value.subsections.map(s=>{id(s.id);module(s,true);return s.id;}),'module subsection');}
 };
 const routeDiagram=value=>{
  id(value.id);if(diagrams.has(value.id)||value.kind!=='route-svg')fail('invalid or duplicate route diagram');
  publicDiagramUrl(value.url);positive(value.width);positive(value.height);positive(value.bytes);
  if(value.bytes>65536||!/^[a-f0-9]{64}$/.test(value.sha256)||!calendarDate(value.checkedOn))fail('invalid diagram bytes/hash/date');
  for(const key of ['title','alt','caption'])text(value[key]);sources(value.sourceIds);
  if(value.sourceIds.some(s=>sourceMap.get(s).kind!=='official'))fail('diagram needs official provenance');
  if(array(value.routes).length<1||value.routes.length>8)fail('one to eight approved diagram routes required');
  unique(value.routes.map(r=>{id(r.id);text(r.title);text(r.sampleCaption);strings(r.edgeLabels||[]);return r.id;}),'diagram route');
  diagrams.set(value.id,value);
 };
 const paths=[];
 for(const c of array(data.countries)){
  id(c.id);if(countries.has(c.id))fail('duplicate country');routePath(c.path);paths.push(c.path);
  for(const key of ['name','englishName','flag','title','description'])text(c[key]);strings(c.intro);if(c.leadFormat!==undefined)validateCityIntro(c.intro,c.leadFormat);image(c.image);sources(c.sourceIds);faq(c.faq);
  if(!calendarDate(c.updatedOn))fail('country update date');
  if(c.packing)module(c.packing);if(c.videos)module(c.videos);if(c.related)module(c.related);if(c.planInfo)module(c.planInfo);
  if(c.transport){const t=c.transport;text(t.heading);text(t.intro);sources(t.sourceIds);links(t.links);
   if(t.paragraphs)strings(t.paragraphs);for(const d of t.diagrams||[])routeDiagram(d);
   if(!array(t.cards).length)fail('empty transport routes');
   unique(t.cards.map(r=>{id(r.id);for(const key of ['title','routeLabel','flightLabel','durationLabel','body'])text(r[key]);return r.id;}),'transport route');
  }
  if(c.discovery){const g=c.discovery;
   if(!['asia','oceania','europe','americas','africa'].includes(g.region))fail('discovery region');
   id(g.subregion);text(g.summary);image(g.assetId);sources(g.sourceIds);
   if(!Array.isArray(g.point)||g.point.length!==2||!g.point.every(Number.isFinite)||Math.abs(g.point[0])>180||Math.abs(g.point[1])>90||!/^\d{3}$/.test(g.isoNumeric))fail('discovery geography');
  }
  unique(array(c.cityIds),'country city');if(!c.cityIds.length)fail('country without guides');countries.set(c.id,c);
 }
 for(const c of array(data.cities)){
  id(c.id);if(cities.has(c.id))fail('duplicate city');routePath(c.path);paths.push(c.path);id(c.countryId);
  if(!countries.has(c.countryId))fail('unknown country');
  if(!['city','archipelago','region'].includes(c.destinationKind))fail('destination kind');
  if(c.destinationKind==='archipelago')text(c.visitedBase);
  for(const key of ['name','englishName','title','description','author'])text(c[key]);
  validateCityIntro(c.intro,c.leadFormat);if(!calendarDate(c.updatedOn))fail('city update date');sources(c.sourceIds);
  if(array(c.hero).length!==3||new Set(c.hero).size!==3)fail('three distinct hero assets');c.hero.forEach(image);
  if(c.entryImagePair){photoPair(c.entryImagePair);if(c.entryImagePair[0]!==c.hero[0])fail('city entry/photo identity mismatch');}
  const places=new Map();
  for(const p of array(c.places)){
   id(p.id);id(p.stableId);if(places.has(p.id))fail('duplicate place anchor');
   if(['main','places','food','stay','arrival','rain','faq','plan','videos','extension'].includes(p.id))fail('reserved place anchor');
   text(p.title);strings(p.paragraphs);if(!p.paragraphs.length)fail('place introduction required');sources(p.sourceIds);
   if(p.locality!==undefined)text(p.locality);
   // Three photos is the standard; a migrated place with only two real photos keeps two rather than borrowing another venue's.
   if(![2,3].includes(array(p.images).length)||new Set(p.images).size!==p.images.length)fail('two or three distinct attraction images');p.images.forEach(image);
   for(const key of ['what','play','arrival','duration','availability','conditions']){const f=p.facts?.[key];if(!f)fail('six practical questions required');text(f.label);text(f.value);sources(f.sourceIds);}
   if(p.story){text(p.story.text);if(p.story.paragraphs)strings(p.story.paragraphs);sources(p.story.sourceIds);}
   for(const f of p.extraFacts||[]){text(f.label);text(f.value);sources(f.sourceIds);}
   for(const a of p.supportImages||[])image(a);
   for(const g of p.additionalGalleries||[]){text(g.title);if(array(g.images).length!==3||new Set(g.images).size!==3)fail('additional gallery needs three distinct images');g.images.forEach(image);}
   links(p.links||[]);places.set(p.id,p);
  }
  if(!places.size)fail('approved places required');unique(c.places.map(p=>p.stableId),'place stable ID');
  if(c.chapters){
   if(!array(c.chapters).length||c.chapters.length>24)fail('bounded editorial chapters required');
   const grouped=[];unique(c.chapters.map(chapter=>{id(chapter.id);text(chapter.title);sources(chapter.sourceIds);strings(chapter.paragraphs||[]);
    if(places.has(chapter.id)||['main','places','food','stay','arrival','rain','faq','plan','videos','extension','day-reading'].includes(chapter.id))fail('chapter anchor collision');
    if(!array(chapter.placeIds).length||chapter.placeIds.some(pid=>!places.has(pid)))fail('unresolved chapter place');grouped.push(...chapter.placeIds);return chapter.id;
   }),'chapter');unique(grouped,'chapter place');if(grouped.length!==places.size)fail('every place belongs to one chapter');
  }
  const cardTargets=unique(array(c.cards).map(card=>{
   const p=places.get(card.target);if(!p||!p.images.includes(card.assetId))fail('card/photo/venue mismatch');image(card.assetId);
   if(card.imagePair){photoPair(card.imagePair);if(card.imagePair[0]!==card.assetId||card.imagePair.some(ref=>!p.images.includes(ref)))fail('card pair/photo/venue mismatch');}
   for(const key of ['title','play','time'])text(card[key]);focalPoint(card.focalPoint);return card.target;
  }),'card target');
  if(!cardTargets.length)fail('navigation cards required');
  // Migrated guides omit a module the original article never had, instead of inventing one.
  for(const key of ['food','stay','arrival','rain'])if(c[key]!==undefined)module(c[key]);faq(c.faq);if(c.extension)module(c.extension);if(c.reading)module(c.reading);
  if(c.arrival?.diagram)routeDiagram(c.arrival.diagram);
  for(const d of c.arrival?.diagrams||[])routeDiagram(d);
  const anchors=new Set(['main','places',...['food','stay','arrival','rain'].filter(k=>c[k]),'faq','plan','videos',...(c.extension?['extension']:[]),...(c.reading?['day-reading']:[]),...places.keys()]);
  const allLinks=[...c.places.flatMap(p=>p.links||[]),...['food','stay','arrival','rain','extension'].flatMap(k=>c[k]?.links||[])];
  if(allLinks.some(l=>l.url.startsWith('#')&&!anchors.has(l.url.slice(1))))fail('unresolved same-page link');
  const planner=c.planner;if(!planner||!array(planner.routes).length)fail('approved routes required');text(planner.title);strings(planner.paragraphs);sources(planner.sourceIds);
  if(planner.executionProfile){
   validateMalaysiaExecutionProfile(planner.executionProfile,{cityId:c.id,placeIds:[...places.keys()],sourceCheck:sources});
   const moduleIds=new Set(planner.executionProfile.modules.map(m=>m.id));
   for(const route of planner.routes)if(!Array.isArray(route.moduleIds)||route.moduleIds.length!==route.sightseeingDays||new Set(route.moduleIds).size!==route.moduleIds.length||route.moduleIds.some(id=>!moduleIds.has(id)))fail('Malaysia route module references');
  }
  unique(planner.routes.map(r=>r.id),'route');
  for(const r of planner.routes){
   id(r.id);positive(r.sightseeingDays);if(!['leisure','compact'].includes(r.pace))fail('route pace');text(r.label);text(r.note);sources(r.sourceIds);
   if(array(r.days).length!==r.sightseeingDays)fail('route day count');
   for(const day of r.days){
    text(day.title);text(day.description);if(!array(day.stops).length||day.stops.some(v=>!places.has(v))||new Set(day.stops).size!==day.stops.length)fail('route target');
    let previousEnd=-1;
    for(const b of day.blocks||[]){
     if(!clockTime(b.start)||!clockTime(b.end)||b.start>=b.end||minutes(b.start)<previousEnd)fail('route time/overlap');
     previousEnd=minutes(b.end);text(b.description);
     if(!Array.isArray(b.placeIds)||b.placeIds.some(p=>!day.stops.includes(p)))fail('block target');
     if(b.sourceIds?.length)sources(b.sourceIds);
    }
   }
  }
  // Alternate approved seasonal routes may share the same day/pace combination.
  unique((planner.rules||[]).map(r=>r.placeId),'calendar rule place');
  for(const rule of planner.rules||[]){
   if(!places.has(rule.placeId))fail('rule place');sources(rule.sourceIds);text(rule.note);publicUrl(rule.url);
   if(!calendarDate(rule.validFrom)||!calendarDate(rule.validThrough)||rule.validFrom>rule.validThrough)fail('rule validity');
   if(rule.minAge!==undefined&&(!Number.isInteger(rule.minAge)||rule.minAge<0||rule.minAge>110))fail('rule age');
   if(rule.minimumMinutes!==undefined)positive(rule.minimumMinutes);
   for(const key of ['needsAgeConfirmation','needsDateConfirmation'])if(rule[key]!==undefined&&typeof rule[key]!=='boolean')fail('rule confirmation flag');
   if(!array(rule.windows).length&&!rule.needsDateConfirmation)fail('rule windows');
   const monthDay=value=>/^\d{2}-\d{2}$/.test(value)&&calendarDate('2000-'+value);
   if(rule.closedMonthDays&&(!Array.isArray(rule.closedMonthDays)||rule.closedMonthDays.some(d=>!monthDay(d))))fail('annual closed dates');
   for(const o of rule.overrides||[])if(!monthDay(o.monthDay)||!clockTime(o.opens)||!clockTime(o.closes)||o.opens>=o.closes)fail('annual opening override');
   for(const w of rule.windows){
    if(!calendarDate(w.from)||!calendarDate(w.to)||w.from>w.to||w.from<rule.validFrom||w.to>rule.validThrough)fail('rule season');
    if(!Array.isArray(w.weekdays)||!w.weekdays.length||w.weekdays.some(n=>!Number.isInteger(n)||n<0||n>6))fail('rule weekdays');
    if(w.months&&(!Array.isArray(w.months)||!w.months.length||w.months.some(n=>!Number.isInteger(n)||n<1||n>12)))fail('rule months');
    if(w.needsDateConfirmation!==undefined&&typeof w.needsDateConfirmation!=='boolean')fail('window confirmation flag');
    if(!clockTime(w.opens)||(w.closes===null?!w.needsDateConfirmation:!clockTime(w.closes)||w.opens>=w.closes))fail('rule time window');
    if(w.startTimes&&(!Array.isArray(w.startTimes)||w.startTimes.some(t=>!clockTime(t)||t<w.opens||(w.closes!==null&&t>=w.closes))))fail('rule start times');
   }
  }
  for(const rule of planner.calendar||[]){
   if(!places.has(rule.placeId))fail('calendar place');text(rule.message);sources(rule.sourceIds);
   if(!calendarDate(rule.validFrom)||!calendarDate(rule.validThrough)||rule.validFrom>rule.validThrough)fail('calendar validity');
   if(!Array.isArray(rule.closedDates)||rule.closedDates.some(d=>!calendarDate(d)||d<rule.validFrom||d>rule.validThrough))fail('calendar dates');
   if(!Array.isArray(rule.closedWeekdays)||rule.closedWeekdays.some(d=>!Number.isInteger(d)||d<0||d>6))fail('calendar weekdays');
  }
  sources(c.videoSourceIds);if(c.videoSourceIds.some(v=>!['youtube','instagram'].includes(sourceMap.get(v).kind)))fail('video provenance');cities.set(c.id,c);
 }
 // Route articles (one fixed multi-day itinerary) link into city guides; they never invent a planner.
 for(const r of array(data.routes||[])){
  id(r.id);if(routes.has(r.id)||cities.has(r.id))fail('duplicate route');routePath(r.path);paths.push(r.path);id(r.countryId);
  if(!countries.has(r.countryId))fail('unknown route country');
  for(const key of ['name','englishName','title','description','author'])text(r[key]);
  validateCityIntro(r.intro,r.leadFormat);if(!calendarDate(r.updatedOn))fail('route update date');sources(r.sourceIds);
  if(array(r.hero).length!==3||new Set(r.hero).size!==3)fail('three distinct hero assets');r.hero.forEach(image);
  unique(array(r.cityIds),'route city');if(r.cityIds.some(v=>cities.get(v)?.countryId!==r.countryId))fail('route city country');
  for(const f of array(r.facts||[])){text(f.label);text(f.value);sources(f.sourceIds);}
  if((r.facts||[]).length>8)fail('bounded route facts');
  if(!Number.isInteger(r.calendarDays)||r.calendarDays<2||r.calendarDays>21||array(r.days).length!==r.calendarDays)fail('route day count');
  r.days.forEach((day,index)=>{
   if(day.day!==index+1)fail('route day order');if(!approvedRouteDayKinds.includes(day.kind))fail('route day type');
   for(const key of ['title','destination'])text(day[key]);if(day.overnight!==undefined)text(day.overnight);
   strings(day.paragraphs);if(!day.paragraphs.length)fail('route day text required');sources(day.sourceIds);
   if(day.images!==undefined){if(array(day.images).length!==3||new Set(day.images).size!==3)fail('route day needs three distinct images');day.images.forEach(image);}
   unique(array(day.places||[]).map(ref=>{if(!r.cityIds.includes(ref.cityId)||!cities.get(ref.cityId).places.some(p=>p.id===ref.placeId))fail('unresolved route place');return ref.cityId+':'+ref.placeId;}),'route day place');
   links(day.links||[]);
  });
  for(const key of ['transport','stay','packing','related'])if(r[key])module(r[key]);
  if(r.plan){text(r.plan.title);strings(r.plan.paragraphs);sources(r.plan.sourceIds);}
  faq(r.faq);sources(r.videoSourceIds);if(r.videoSourceIds.some(v=>!['youtube','instagram'].includes(sourceMap.get(v).kind)))fail('video provenance');
  const anchors=new Set(routeAnchors(r));
  const allLinks=[...r.days.flatMap(d=>d.links||[]),...['transport','stay','packing','related'].flatMap(k=>r[k]?.links||[])];
  if(allLinks.some(l=>l.url.startsWith('#')&&!anchors.has(l.url.slice(1))))fail('unresolved same-page link');
  routes.set(r.id,r);
 }
 unique(paths,'public path');
 for(const c of countries.values()){
  if(c.cityIds.some(v=>cities.get(v)?.countryId!==c.id)||[...cities.values()].some(city=>city.countryId===c.id&&!c.cityIds.includes(city.id)))fail('country/city membership');
  if(c.routeIds!==undefined){unique(array(c.routeIds),'country route article');if(!c.routeIds.length)fail('empty country routes');}
  if((c.routeIds||[]).some(v=>routes.get(v)?.countryId!==c.id)||[...routes.values()].some(r=>r.countryId===c.id&&!(c.routeIds||[]).includes(r.id)))fail('country/route membership');
  if(c.map){image(c.map.assetId);text(c.map.caption);sources(c.map.sourceIds);
   unique(array(c.map.pins).map(pin=>{if(!c.cityIds.includes(pin.cityId))fail('map destination');focalPoint([pin.x,pin.y]);return pin.cityId;}),'map pin');
  }
  if(c.geographicMap){
   const m=c.geographicMap;text(m.caption);sources(m.sourceIds);if(m.detail!==undefined&&m.detail!=='50m')fail('map detail');
   if(!array(m.views).length)fail('map views');
   for(const v of m.views){id(v.id);text(v.label);text(v.note);
    if(!Array.isArray(v.bounds)||v.bounds.length!==4||!v.bounds.every(Number.isFinite)||v.bounds[0]>=v.bounds[2]||v.bounds[1]>=v.bounds[3]||Math.abs(v.bounds[0])>180||Math.abs(v.bounds[2])>180||Math.abs(v.bounds[1])>85||Math.abs(v.bounds[3])>85)fail('map viewport');
    for(const p of array(v.points)){text(p.label);if((p.routeId!==undefined)===(p.cityId!==undefined))fail('map point needs one city or route');if(p.routeId!==undefined?!(c.routeIds||[]).includes(p.routeId)||p.href===undefined:!c.cityIds.includes(p.cityId))fail('map source point');if(!Array.isArray(p.point)||p.point.length!==2||!p.point.every(Number.isFinite)||p.point[0]<v.bounds[0]||p.point[0]>v.bounds[2]||p.point[1]<v.bounds[1]||p.point[1]>v.bounds[3])fail('map source point');sources(p.sourceIds);}
   }
   for(const v of m.views)for(const p of v.points)if(p.href!==undefined){
    const href=publicUrl(p.href);
    if(href.startsWith('/trip/')){
     const [path,anchor]=href.split('#');
     if(p.routeId!==undefined){const route=routes.get(p.routeId);if(path!==route.path||(anchor!==undefined&&!routeAnchors(route).includes(anchor)))fail('unresolved map article target');}
     else{const city=cities.get(p.cityId);
     const anchors=new Set(['main','places',...['food','stay','arrival','rain'].filter(k=>city[k]),'faq','plan','videos',...(city.extension?['extension']:[]),...(city.reading?['day-reading']:[]),...city.places.map(place=>place.id)]);
     if(path!==city.path||(anchor!==undefined&&!anchors.has(anchor)))fail('unresolved map article target');}
    }
   }
   for(const leg of m.connections||[]){text(leg.fromLabel);text(leg.toLabel);text(leg.label);sources(leg.sourceIds);if(!['flight','train','road','boat'].includes(leg.mode))fail('map transfer mode');}
  }
  if(c.presentation){const p=c.presentation;
   for(const key of ['overviewTitle','overviewText'])if(p[key]!==undefined)text(p[key]);
   if(p.experienceTitle!==undefined)text(p.experienceTitle);if(p.experienceParagraphs)strings(p.experienceParagraphs);
   for(const r of [...(p.routeInspirations||[]),...(p.destinationNotes||[])]){text(r.title);strings(r.paragraphs);links(r.links||[]);}
   const summaries=unique(array(p.citySummaries||[]).map(s=>{if(!c.cityIds.includes(s.cityId))fail('presentation city');for(const key of ['tag','pace','intro'])if(s[key]!==undefined)text(s[key]);return s.cityId;}),'presentation city');
   const themes=unique(array(p.themes||[]).map(t=>{id(t.id);text(t.label);if(t.id==='all')fail('reserved theme');return t.id;}),'presentation theme');
   unique(array(p.placeThemes||[]).map(e=>{if(!c.cityIds.includes(e.cityId)||!cities.get(e.cityId).places.some(p=>p.id===e.placeId)||!Array.isArray(e.themeIds)||e.themeIds.some(t=>!themes.includes(t)))fail('presentation place theme');unique(e.themeIds,'place theme');return e.cityId+':'+e.placeId;}),'presentation place');
  }
  if(c.allocation){validateCountryAllocation(c.allocation,c.cityIds);sources(c.allocation.sourceIds);for(const r of c.allocation.routes){sources(r.sourceIds);if(r.terminalTransfer)sources(r.terminalTransfer.sourceIds);}}
  if(c.referencePlans){unique(array(c.referencePlans).map(r=>{
   id(r.id);text(r.title);sources(r.sourceIds);
   if(!Number.isInteger(r.calendarDays)||r.calendarDays<1||array(r.days).length!==r.calendarDays)fail('reference timetable day count');
   r.days.forEach((day,index)=>{if(day.day!==index+1)fail('reference timetable day order');text(day.destination);if(!approvedRouteDayKinds.includes(day.kind))fail('reference timetable day type');strings(day.paragraphs);});
   if(r.routeId!==undefined&&!(c.routeIds||[]).includes(r.routeId))fail('reference timetable route');return r.id;
  }),'reference timetable');}
 }
 const same=(actual,expected,label)=>{if(!Array.isArray(expected)||JSON.stringify([...actual].sort())!==JSON.stringify([...expected].sort()))fail(label+' coverage mismatch');};
 same([...countries.keys()],data.coverage?.countryIds,'country');same([...cities.keys()],data.coverage?.cityIds,'city');
 if(routes.size||data.coverage?.routeIds!==undefined)same([...routes.keys()],data.coverage?.routeIds,'route');
 if(countryIds)same([...countries.keys()],countryIds,'requested country');if(cityIds)same([...cities.keys()],cityIds,'requested city');if(routeIds)same([...routes.keys()],routeIds,'requested route');
 return {data,sources:sourceMap,assets,countries,cities,diagrams,routes};
}
// Fixed anchors of a route article: overview, Day sections and the shared closing modules.
export function routeAnchors(route){
 return ['main','overview',...route.days.map(d=>'day-'+d.day),...['transport','stay','packing'].filter(k=>route[k]),'faq','plan','videos',...(route.related?['related']:[])];
}
export function validateCountryAllocation(profile,cityIds){
 if(!profile||profile.approved!==true)fail('approved allocation profile required');
 const nonnegative=n=>{if(!Number.isInteger(n)||n<0)fail('nonnegative day budget required');};
 nonnegative(profile.arrivalDays);nonnegative(profile.departureDays);
 if(!Array.isArray(profile.dayRange)||profile.dayRange.length!==2)fail('approved day range');profile.dayRange.forEach(positive);
 if(profile.dayRange[0]>profile.dayRange[1]||profile.extraDays!=='round-robin')fail('allocation policy');
 if(!array(profile.routes).length)fail('approved country routes required');unique(profile.routes.map(r=>r.id),'country route');
 for(const r of profile.routes){id(r.id);text(r.label);text(r.description);unique(array(r.cityIds),'allocation destination');
  if(!r.cityIds.length||r.cityIds.some(v=>!cityIds.includes(v))||array(r.transferDays).length!==r.cityIds.length-1)fail('allocation route shape');r.transferDays.forEach(nonnegative);
  if(r.terminalTransfer){const t=r.terminalTransfer;positive(t.days);if(t.from!==r.cityIds.at(-1)||!cityIds.includes(t.to)||t.from===t.to||!Array.isArray(t.sourceIds)||!t.sourceIds.length)fail('terminal transfer');}
  if(!calendarDate(r.validFrom)||!calendarDate(r.validThrough)||r.validFrom>r.validThrough)fail('route applicability');
  for(const destination of r.cityIds)for(const pace of ['leisure','compact'])positive(profile.minimumStay?.[destination]?.[pace]);
 }
 return profile;
}
