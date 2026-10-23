// Restates the published Thailand hub and the Bangkok, Chiang Mai and Chiang Rai
// guides in the approved-package shape (the Japan template). Text, photos,
// links and day plans come from the published legacy data and pages; nothing
// here adds new facts. Run once: node scripts/migrate/thailand-approved-v1.mjs
import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {root,legacyAsset,section,plain,inline,links,faqs,moduleFromSection} from './legacy-approved-helpers.mjs';
import {media as bkkMedia} from '../trip-bangkok-places.mjs';

const json=p=>JSON.parse(readFileSync(resolve(root,p),'utf8'));
// Legacy pages are read from the last commit that still published them, so the
// script can be re-run after the build has replaced them.
const LEGACY_REF='b90122a';
const page=p=>execFileSync('git',['-C',root,'show',`${LEGACY_REF}:${p}/index.html`],{encoding:'utf8',maxBuffer:1<<26});
const site='https://www.eaglish.store';
const northMedia=[...json('trip/assets/north-thailand-media.json'),...json('trip/assets/chiang-mai-media.json')];
const sources=new Map(),assets=new Map();
const addSource=s=>{if(!sources.has(s.id))sources.set(s.id,s);return s.id;};
const ownRights='鷹式一家自有公開照片與影片，原刊於本站泰國攻略。';
const official=(label,url,checkedOn)=>{
 const id='o-'+url.replace(/^https:\/\/(www\.)?/,'').replace(/[^a-z0-9]+/gi,'-').toLowerCase().replace(/^-|-$/g,'').slice(0,60);
 return addSource({id,kind:'official',url,label,checkedOn,rights:'第一方公開資訊摘要；照片不採用'});
};
const video=(url,label)=>{
 const kind=url.includes('instagram.com')?'instagram':'youtube';
 const id='v-'+url.replace(/^https:\/\/(www\.)?/,'').replace(/[^a-z0-9]+/gi,'-').toLowerCase().replace(/^-|-$/g,'').slice(0,70);
 return addSource({id,kind,url,label,rights:ownRights});
};

// Photos and video frames, with the provenance the old pages recorded.
function addAsset(id,guidePath){
 if(assets.has(id))return id;
 const bkk=bkkMedia[id],north=northMedia.find(m=>m.id===id);
 const m=bkk||north;if(!m)throw Error('Unknown legacy media '+id);
 const isFrame=bkk?Boolean(bkk.video):m.kind==='owned-video-frame';
 let sourceId;
 if(isFrame){
  const url=bkk?`https://www.youtube.com/watch?v=${bkk.video}&t=${bkk.second}s`:m.source;
  sourceId=video(url,m.caption||m.alt);
 }else if(m.kind==='owned-instagram-photo'&&/^https:/.test(m.source||'')){
  sourceId=addSource({id:'p-'+id,kind:'photo',url:m.source,label:m.caption||m.alt,rights:ownRights});
 }else{
  sourceId=addSource({id:'p-'+id,kind:'photo',url:site+guidePath,label:m.caption||m.alt,rights:ownRights,locator:m.source||'鷹式一家旅行照片'});
 }
 assets.set(id,legacyAsset(id,{alt:m.alt,caption:m.caption||m.alt,sourceIds:[sourceId],frame:isFrame?{second:Number(m.second||0)}:null,
  provenance:{kind:m.kind||(bkk?.video?'owned-video-frame':'user-supplied-photo'),source:m.source||(bkk?.video?`https://www.youtube.com/watch?v=${bkk.video}`:undefined),reviewedAt:m.reviewedAt,originalSha256:m.originalSha256}}));
 return id;
}
const imgIds=html=>[...html.matchAll(/src="\/trip\/assets\/([a-z0-9-]+?)(?:-640|-960)?\.webp"/g)].map(m=>m[1]);
const firstSentence=s=>{const i=s.indexOf('。');return i<0?s:s.slice(0,i+1);};
const label={what:'是什麼',play:'玩什麼',arrival:'怎麼去',duration:'留多久',availability:'何時能去',conditions:'雨天或特殊條件'};
const facts=(values,sourceIds)=>Object.fromEntries(Object.entries(values).map(([k,v])=>[k,{label:label[k],value:v,sourceIds}]));
const maps=q=>({label:'Google Maps',url:'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(q).replaceAll("'",'%27')});
const pad=t=>t.length===4?'0'+t:t;
const toMin=t=>{const [h,m]=t.split(':').map(Number);return h*60+m;};
const fromMin=n=>`${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;

// Day plans: consecutive legacy steps become non-overlapping time blocks.
// A step without a clock time (e.g. "上午") is kept as day text, not a timed block.
const clock=t=>/^\d{1,2}:\d{2}$/.test(t||'');
export const looseSteps=steps=>steps.filter(s=>!clock(s.start)).map(s=>s.text?`${s.start}：${s.title}，${s.text}`:`${s.start}：${s.title}`);
function blocks(allSteps,placeIds){
 const out=[],steps=allSteps.filter(s=>clock(s.start));
 steps.forEach((s,i)=>{
  const start=toMin(pad(s.start)),next=steps[i+1]?toMin(pad(steps[i+1].start)):null;
  let end=s.end?toMin(pad(s.end)):next??Math.min(start+90,24*60);
  if(next!==null&&end>next)end=next;if(end<=start)end=Math.min(start+30,24*60);
  const ids=s.anchor&&placeIds.includes(s.anchor)?[s.anchor]:[];
  out.push({start:fromMin(start),end:fromMin(end),description:s.text?`${s.title}：${s.text}`:s.title,placeIds:ids});
 });
 return out;
}

function cityFrom({id,guidePath,legacyPage,places,checkedAt,overview,routes,modules,extensionHtml,videoLinks,heroIds,name,englishName}){
 const html=page(legacyPage);
 const h1=html.match(/<h1>([\s\S]*?)<\/h1>/)[1],[mainTitle,sub]=h1.split(/<br\s*\/?>/);
 const lead=html.match(/<p class="article-lead">([\s\S]*?)<\/p>/)[1].split(/<br\s*\/?>/).map(plain).filter(Boolean);
 const hero=(heroIds||imgIds(html.match(/<header class="article-header[\s\S]*?<\/header>/)[0])).slice(0,3).map(a=>addAsset(a,guidePath));
 const anchorMap=Object.fromEntries(places.map(p=>[p.legacyId,p.id]));
 const cityPlaces=places.map(p=>{
  const officialIds=p.sources.map(s=>official(s.label,s.url,checkedAt));
  const momentId=p.moment?video(p.moment.url,p.moment.label):null;
  const factSources=officialIds.length?officialIds:[momentId];
  const images=[...new Set(p.images)].map(a=>addAsset(a,guidePath));
  return {id:p.id,stableId:p.legacyId,title:p.title,paragraphs:p.paragraphs,sourceIds:[...officialIds,...(momentId?[momentId]:[])],
   facts:facts(p.facts,factSources),images:images.slice(0,3),...(images.length>3?{supportImages:images.slice(3)}:{}),
   ...(p.story?{story:{title:'我們那次的小記錄',text:p.story,paragraphs:[p.story],sourceIds:[momentId||factSources[0]]}}:{}),
   links:[...p.sources.map(s=>({label:s.label,url:s.url})),(p.mapsUrl?{label:'Google Maps',url:p.mapsUrl}:maps(p.mapsQuery)),...(p.moment?[{label:p.moment.label,url:p.moment.url}]:[])],
   ...(p.booking?{booking:p.booking}:{}),...(p.relatedReading?{relatedReading:p.relatedReading}:{})};
 });
 // Overview cards keep the old card copy and photo; the photo must be one of the place's three.
 const cards=[...section(html,'before').matchAll(/<a href="#([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)].map(m=>{
  const place=cityPlaces.find(p=>p.id===m[1]);if(!place)return null;
  const asset=imgIds(m[2])[0];
  if(!place.images.includes(asset)){place.images=[asset,...place.images.filter(a=>a!==asset)].slice(0,3);addAsset(asset,guidePath);}
  const copy=[...m[2].matchAll(/<(strong|span|small)>([\s\S]*?)<\/\1>/g)].map(x=>plain(x[2]));
  return {target:place.id,assetId:asset,title:copy[0],play:copy[1],time:copy[2],focalPoint:[50,50]};
 }).filter(Boolean);
 const allSources=[...new Set(cityPlaces.flatMap(p=>p.sourceIds))];
 const videoIds=videoLinks.map(v=>video(v.url,v.label));
 const mod=(sid,opts)=>{const h=section(html,sid);return h?moduleFromSection(h,{id:opts.id||sid,sourceIds:[...new Set(videoIds.slice(0,1).concat(allSources.slice(0,2)))],anchorMap,...opts}):undefined;};
 const city={id,countryId:'thailand',path:guidePath,name,englishName,destinationKind:'city',
  title:`${plain(mainTitle)}：${plain(sub||'')}`,metadataTitle:plain(html.match(/<title>([\s\S]*?)<\/title>/)[1]),
  description:plain(html.match(/<meta name="description" content="([^"]*)"/)[1]),intro:lead.slice(0,2),
  sourceIds:[...new Set([...videoIds,...allSources.slice(0,4)])],author:'鷹式一家',updatedOn:html.match(/更新 (\d{4})\.(\d{2})\.(\d{2})/).slice(1).join('-'),
  hero,places:cityPlaces,cards,faq:faqs(section(html,'faq')).map(q=>({...q,sourceIds:[videoIds[0]]})),videoSourceIds:videoIds,planner:routes(cityPlaces.map(p=>p.id),videoIds)};
 for(const [key,sid,extra] of modules){const m=mod(sid,{id:key});if(m)city[key]=extra.images?{...m,images:extra.images}:m;}
 if(extensionHtml)city.extension=extensionHtml(html,anchorMap,videoIds,guidePath);
 for(const key of ['food','stay','arrival','rain'])if(city[key]&&city[key].images)city[key].images=city[key].images.map(a=>addAsset(a,guidePath));
 return city;
}

// Inner place sections (Chiang Mai 2023 reels, Chiang Rai "more") keep their ids
// as subsections of the further-reading module so old deep links still land.
function innerPlacesModule(html,sid,{guidePath,sourceIds,title}){
 const h=section(html,sid);
 const lead=[...h.replace(/<section\b[\s\S]*$/,'').matchAll(/<p(?! class="eyebrow")\b[^>]*>([\s\S]*?)<\/p>/g)].map(m=>inline(m[1])).filter(Boolean);
 const inner=[...h.matchAll(/<section id="([^"]+)" data-place-id[^>]*>([\s\S]*?)<\/section>/g)].map(([,id,body])=>{
  const images=imgIds(body.match(/<figure>[\s\S]*?<\/figure>/g)?.join('')||'').map(a=>addAsset(a,guidePath));
  // Keep the old "我們去過／我們推薦" tag, which tells readers whether we visited.
  const origin=plain(body.match(/<p class="origin-tag">([\s\S]*?)<\/p>/)?.[1]||'');
  const area=plain(body.match(/<p class="place-english">([\s\S]*?)<\/p>/)?.[1]||'');
  const paragraphs=[...(origin?[`（${origin}）`]:[]),...(area?[`地點：${area}`]:[]),...[...body.replace(/<figure>[\s\S]*?<\/figure>/g,'').matchAll(/<p\b(?![^>]*class="(?:origin-tag|place-english)")[^>]*>([\s\S]*?)<\/p>/g)].map(m=>inline(m[1])).filter(Boolean)];
  return {id,title:plain(body.match(/<h3>([\s\S]*?)<\/h3>/)[1]),paragraphs,sourceIds,links:links(body.replace(/<p\b[\s\S]*?<\/p>/g,'')),...(images.length?{images}:{})};
 });
 const tail=h.slice(h.lastIndexOf('</section>',h.length-11)+10,h.length-10);
 const extra=tail.split(/(?=<h3\b)/).filter(c=>c.startsWith('<h3')).map((chunk,i)=>({id:`${sid}-more-${i+1}`,title:plain(chunk.match(/<h3[^>]*>([\s\S]*?)<\/h3>/)[1]),
  paragraphs:[...chunk.matchAll(/<(p|li)\b[^>]*>([\s\S]*?)<\/\1>/g)].map(m=>inline(m[2])).filter(Boolean),sourceIds,links:links(chunk.replace(/<(p|li)\b[\s\S]*?<\/\1>/g,''))}));
 return {title:title||plain(h.match(/<h2>([\s\S]*?)<\/h2>/)[1]),paragraphs:lead,sourceIds,links:[],subsections:[...inner,...extra]};
}

// ---- Bangkok ----
const bkk=json('trip/data/bangkok-places.json'),bkkRoutes=json('trip/data/bangkok-routes.json');
const bkkVideos=bkk.videos;
const bangkok=cityFrom({id:'bangkok',name:'曼谷',englishName:'Bangkok',guidePath:'/trip/guides/bangkok-with-kids/',legacyPage:'trip/guides/bangkok-with-kids',checkedAt:bkk.checkedAt,
 places:bkk.places.map(p=>({id:p.anchor,legacyId:p.id,title:p.name,
  paragraphs:[p.intro,...p.activities.map(a=>`${a.title}：${a.text}`),`出發前：${p.tip}`],
  facts:{what:firstSentence(p.summary),play:p.activities.map(a=>a.title).join('；'),arrival:p.transport,duration:p.duration,availability:p.hours,conditions:p.weather},
  story:p.experience,images:[p.image,...p.gallery],sources:p.sources,mapsQuery:p.mapsQuery,mapsUrl:p.mapsUrl,
  moment:{url:`${p.video||bkk.video}&t=${p.videoSeconds}s`,label:'看我們的體驗片段'},relatedReading:p.relatedReading,
  booking:p.booking?.length?{title:`想去 ${p.name}？先看日期與方案`,intro:p.bookingIntro||'確認入場日、旅客身分與包含項目，再比較總價。',links:p.booking.map(b=>({label:b.label,url:b.url,sponsored:Boolean(b.affiliate)})),note:'本文的 Klook／KKday 連結為聯盟連結；透過連結購買，我們可能獲得佣金。價格與方案依預訂頁顯示。'}:undefined})),
 videoLinks:links(section(page('trip/guides/bangkok-with-kids'),'video')).map(l=>({url:l.url,label:l.label==='看完整旅行影片'?(bkkVideos.find(v=>l.url===v.url)?.label||l.label):l.label})),
 modules:[['food','food',{}],['arrival','practical',{images:['bkk-city-stroller']}],['rain','rain',{}]],
 routes:(placeIds,videoIds)=>{
  const hours=Object.fromEntries(bkk.places.map(p=>[p.anchor,p.plannerHours]));
  const withHours=s=>s.anchor&&hours[s.anchor]?`${s.text}（開放參考：${hours[s.anchor]}）`:s.text;
  const day=id=>{const r=bkkRoutes.routes.find(x=>x.id===id);const steps=r.steps.map(s=>({start:s.time,title:s.title,text:withHours(s),anchor:s.anchor}));return {title:r.label,description:[`${r.duration}。${r.condition||''}`.trim(),...looseSteps(steps)].join(' '),stops:[...new Set(r.steps.map(s=>s.anchor).filter(a=>placeIds.includes(a)))],
   blocks:blocks(steps,placeIds)};};
  // Compact days follow the old guide: the market day takes the Jurassic evening only
  // when the plan has no separate riverside day.
  const compactDay=(id,combo)=>{const r=bkkRoutes.routes.find(x=>x.id===id),jurassic=r.compactJurassicSteps&&!combo.routes.includes('riverside');
   const raw=(jurassic?r.compactJurassicSteps:r.compactSteps)||r.steps;
   const steps=raw.map(s=>({start:s.time,title:s.title,anchor:s.anchor,text:s.hours?`${s.text}（開放參考：${s.hours}）`:withHours(s)}));
   return {title:r.label,description:[jurassic?r.compactJurassicDuration:(r.compactDuration||r.duration),jurassic?r.compactJurassicNote:(r.compactNote||r.condition)].filter(Boolean).join('。'),
    stops:[...new Set(steps.map(s=>s.anchor).filter(a=>placeIds.includes(a)))].concat(),blocks:blocks(steps,placeIds)};};
  const extras=bkkRoutes.routes.flatMap(r=>[[r.compactSourceLabel,r.compactSourceUrl],[r.compactJurassicSourceLabel,r.compactJurassicSourceUrl],...[...(r.compactSteps||[]),...(r.compactJurassicSteps||[])].filter(s=>s.mapsQuery).flatMap(s=>[[`${s.title} Google Maps`,'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(s.mapsQuery)],...(s.hoursSourceUrl?[[`${s.title}營業資訊`,s.hoursSourceUrl]]:[])])]).filter(([l,u])=>l&&u);
  const extraLinks=[...new Map(extras.map(([l,u])=>[u,`[${l}](${u})`])).values()];
  const planHtml=section(page('trip/guides/bangkok-with-kids'),'plan'),reminder=planHtml.slice(planHtml.indexOf('排日期前，先看這些提醒'));
  const reminderParagraphs=[...reminder.slice(0,reminder.search(/<h3|遇到下雨/)).matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g)].map(m=>inline(m[1])).filter(Boolean);
  return {title:'曼谷 2～5 日，選天數與步調來試排',paragraphs:[...reminderParagraphs,`緊湊版加入的延伸點與資訊來源：${extraLinks.join('、')}`],sourceIds:videoIds.slice(0,2),
   routes:bkkRoutes.combinations.flatMap(c=>[{id:`bangkok-${c.days}d-leisure`,label:`${c.days} 天｜${c.label}`,sightseeingDays:c.days,pace:'leisure',note:c.note,sourceIds:videoIds.slice(0,2),days:c.routes.map(day)},
    {id:`bangkok-${c.days}d-compact`,label:`${c.days} 天｜${c.label}`,sightseeingDays:c.days,pace:'compact',note:c.note,sourceIds:videoIds.slice(0,2),days:c.routes.map(id=>compactDay(id,c))}])
    // The old planner let any single area route be chosen for a day; keep that as one-day options.
    .concat(bkkRoutes.routes.flatMap(r=>[{id:`bangkok-1d-${r.id}-leisure`,label:`1 天｜${r.label}`,sightseeingDays:1,pace:'leisure',note:r.condition||r.duration,sourceIds:videoIds.slice(0,2),days:[day(r.id)]},
     {id:`bangkok-1d-${r.id}-compact`,label:`1 天｜${r.label}`,sightseeingDays:1,pace:'compact',note:r.condition||r.duration,sourceIds:videoIds.slice(0,2),days:[compactDay(r.id,{routes:[r.id]})]}]))};
 }});

// ---- Chiang Mai ----
const cm=json('trip/data/chiang-mai-places.json'),cmRoutes=json('trip/data/chiang-mai-routes.json');
const chiangMai=cityFrom({id:'chiang-mai',name:'清邁',englishName:'Chiang Mai',guidePath:'/trip/guides/chiang-mai-with-kids/',legacyPage:'trip/guides/chiang-mai-with-kids',checkedAt:cm.checkedAt,
 places:cm.places.map(p=>({id:p.anchor,legacyId:p.id,title:p.name,
  paragraphs:[p.intro,...(p.tips||[]).map(([t,x])=>`${t}：${x}`),...(p.budget?[`費用：${p.budget}`]:[])],
  facts:{what:firstSentence(p.summary),play:p.activity,arrival:p.transport,duration:p.duration,availability:p.hours,conditions:p.weather},
  story:p.experience,images:[p.image,...(p.gallery||[])],sources:p.sources||[],mapsQuery:p.mapsQuery,mapsUrl:p.mapsUrl,
  moment:p.video?{url:`https://www.youtube.com/watch?v=${p.video}&t=${Math.round(p.videoSeconds||0)}s`,label:'看我們的體驗片段'}:null,
  booking:p.booking?{title:'想預先安排紙園體驗？',intro:p.booking.note,links:[{label:p.booking.label,url:'https://affiliate.klook.com/redirect?aid=43858&aff_adid=921120&k_site='+encodeURIComponent(p.booking.url),sponsored:true},{label:'也可查看紙園官方預訂',url:'https://www.poopoopaperpark.com/book-online',sponsored:false}],note:'此處含聯盟行銷連結；透過連結購買，我們可能獲得佣金，不影響你的購買價格。請比較方案包含內容與最終結帳金額。'}:undefined})),
 videoLinks:links(section(page('trip/guides/chiang-mai-with-kids'),'video')).map((l,i)=>({url:l.url,label:cm.videos?.[i]?.title||cm.videos?.[i]?.label||l.label})),
 modules:[['food','food',{}],['arrival','transport',{images:['cm-songthaew-family']}],['rain','rain',{}]],
 extensionHtml:(html,anchorMap,videoIds,guidePath)=>innerPlacesModule(html,'reels-2023',{guidePath,sourceIds:videoIds.slice(0,1)}),
 routes:(placeIds,videoIds)=>{
  const toSteps=steps=>steps.map(s=>({start:s.time,end:s.end,title:s.title,anchor:s.anchor,text:[s.text,s.days?.length?`（限${s.days.map(d=>'日一二三四五六'[d]).map(d=>'週'+d).join('、')}）`:'',s.otherwise?`其他日子：${s.otherwise}`:''].filter(Boolean).join(' ')}));
  const day=(id,compact)=>{const r=cmRoutes.routes.find(x=>x.id===id),steps=toSteps(compact&&r.compactSteps?r.compactSteps:r.steps);
   return {title:r.label,description:[r.note,...looseSteps(steps)].join(' '),stops:[...new Set(steps.map(s=>s.anchor).filter(a=>placeIds.includes(a)))],blocks:blocks(steps,placeIds)};};
  return {title:'清邁行程試排：選天數與步調',paragraphs:[plain(section(page('trip/guides/chiang-mai-with-kids'),'plan').match(/<p(?! class="eyebrow")\b[^>]*>([\s\S]*?)<\/p>/)?.[1]||'')].filter(Boolean),sourceIds:videoIds.slice(0,3),
   routes:cmRoutes.combinations.flatMap(c=>['leisure','compact'].map(pace=>({id:`chiang-mai-${c.days}d-${pace}`,label:`${c.days} 天｜${c.routes.map(id=>cmRoutes.routes.find(r=>r.id===id).label.replace(/^[A-Z]｜/,'')).join('＋')}`,sightseeingDays:c.days,pace,note:c.routes.map(id=>cmRoutes.routes.find(r=>r.id===id).label).join('、'),sourceIds:videoIds.slice(0,3),days:c.routes.map(id=>day(id,pace==='compact'))})))
    // The old planner let any area route (including the Hang Dong Elefin day) fill a single day.
    .concat(cmRoutes.routes.flatMap(r=>['leisure','compact'].map(pace=>({id:`chiang-mai-1d-${r.id}-${pace}`,label:`1 天｜${r.label}`,sightseeingDays:1,pace,note:r.note,sourceIds:videoIds.slice(0,3),days:[day(r.id,pace==='compact')]}))))};
 }});

// ---- Chiang Rai ----
const cr=json('trip/data/chiang-rai-places.json'),crRoutes=json('trip/data/chiang-rai-routes.json');
const chiangRai=cityFrom({id:'chiang-rai',name:'清萊',englishName:'Chiang Rai',guidePath:'/trip/guides/chiang-rai-with-kids/',legacyPage:'trip/guides/chiang-rai-with-kids',checkedAt:cr.checkedAt,
 // The old header has two photos; the hub's white-temple family photo completes the three.
 heroIds:['cr-lalitta-garden','cr-lalitta-walk','cr-white-temple'],
 places:cr.places.map(p=>({id:p.id,legacyId:'cei-'+p.id,title:p.name,
  paragraphs:[p.intro,...(p.tips||[]).map(([t,x])=>`${t}：${x}`),...(p.budget?[`費用：${p.budget}`]:[])],
  facts:{what:firstSentence(p.intro),play:p.activity,arrival:p.transport,duration:p.duration,availability:p.hours,conditions:p.weather},
  story:p.experience,images:[p.image,...(p.gallery||[])],sources:p.sources||[],mapsQuery:p.mapsQuery,mapsUrl:p.mapsUrl,
  moment:p.reel?{url:`https://www.instagram.com/reel/${p.reel}/`,label:'看這站的 IG 實訪影片'}:null})),
 videoLinks:links(section(page('trip/guides/chiang-rai-with-kids'),'films')).map(l=>({url:l.url,label:l.label})),
 modules:[['arrival','transport',{}],['rain','rain',{}]],
 extensionHtml:(html,anchorMap,videoIds,guidePath)=>innerPlacesModule(html,'more',{guidePath,sourceIds:videoIds.slice(-1)}),
 routes:(placeIds,videoIds)=>{
  const toSteps=steps=>steps.map(([range,title,text,anchor])=>{const [start,end]=range.split(/[–-]/);return {start,end,title,text,anchor};});
  const day=(id,compact)=>{const r=crRoutes.routes.find(x=>x.id===id),steps=toSteps(compact&&r.compactSteps?r.compactSteps:r.steps);
   return {title:r.label,description:[r.note,...looseSteps(steps)].join(' '),stops:[...new Set(steps.map(s=>s.anchor).filter(a=>placeIds.includes(a)))],blocks:blocks(steps,placeIds)};};
  return {title:'清萊 1～3 日行程：選天數與步調',paragraphs:['以清萊市區住宿為起點，南側日和北側日分開安排。'],sourceIds:videoIds.slice(0,2),
   routes:crRoutes.combinations.flatMap(c=>['leisure','compact'].map(pace=>({id:`chiang-rai-${c.days}d-${pace}`,label:`${c.days} 天｜${c.routes.map(id=>crRoutes.routes.find(r=>r.id===id).label.replace(/^[A-Z]｜/,'')).join('＋')}`,sightseeingDays:c.days,pace,note:c.routes.map(id=>crRoutes.routes.find(r=>r.id===id).label).join('、'),sourceIds:videoIds.slice(0,2),days:c.routes.map(id=>day(id,pace==='compact'))})))
    .concat(crRoutes.routes.filter(r=>!crRoutes.combinations.some(c=>c.days===1&&c.routes[0]===r.id)).flatMap(r=>['leisure','compact'].map(pace=>({id:`chiang-rai-1d-${r.id}-${pace}`,label:`1 天｜${r.label}`,sightseeingDays:1,pace,note:r.note,sourceIds:videoIds.slice(0,2),days:[day(r.id,pace==='compact')]}))))};
 }});

// ---- Thailand hub ----
const hub=page('trip/thailand');
const hubVideoIds=[...new Set([bangkok,chiangMai,chiangRai].map(c=>c.videoSourceIds[0]))];
const cityCopy=Object.fromEntries([...hub.matchAll(/<article hidden id="city-([a-z-]+)"[\s\S]*?<p class="eyebrow">([\s\S]*?)<\/p><h2>([\s\S]*?)<\/h2><p>([\s\S]*?)<\/p>/g)].map(m=>[m[1],{tag:plain(m[2]),intro:`${plain(m[3])}。${plain(m[4])}`}]));
const themeIds={market:'市集美食',craft:'換裝手作',family:'親子活動',scenery:'建築山景'};
const placeThemes=[...hub.matchAll(/<a class="th-place" href="\/trip\/guides\/([a-z-]+)-with-kids\/#([a-z0-9-]+)" data-place-city="([a-z-]+)" data-theme-id="([a-z]+)"/g)]
 .map(m=>({cityId:m[3],placeId:m[2],themeIds:[m[4]]})).filter(e=>[bangkok,chiangMai,chiangRai].find(c=>c.id===e.cityId).places.some(p=>p.id===e.placeId));
const overview=hub.match(/<div class="th-panel-copy"><p class="eyebrow">YOUR THAILAND NOTEBOOK<\/p><h2>([\s\S]*?)<\/h2><p>([\s\S]*?)<\/p>/);
const order={bangkok:['bangkok','chiang-mai','chiang-rai'],'chiang-mai':['chiang-mai','chiang-rai','bangkok'],'chiang-rai':['chiang-rai','chiang-mai','bangkok']};
const names={bangkok:'曼谷','chiang-mai':'清邁','chiang-rai':'清萊'};
const allocationRoutes=[];
for(const first of Object.keys(order))for(const size of [1,2,3]){
 for(const subset of [['bangkok'],['chiang-mai'],['chiang-rai'],['chiang-mai','chiang-rai'],['bangkok','chiang-mai'],['bangkok','chiang-rai'],['bangkok','chiang-mai','chiang-rai']].filter(s=>s.length===size&&s.includes(first))){
  const ids=order[first].filter(id=>subset.includes(id)),routeId=ids.join('-');
  if(allocationRoutes.some(r=>r.id===routeId))continue;
  allocationRoutes.push({id:routeId,label:ids.map(id=>names[id]).join(' → '),description:'天數包含抵達與離境日；每次換城市留一天交通。',cityIds:ids,transferDays:ids.slice(1).map(()=>1),validFrom:'2026-01-01',validThrough:'2027-12-31',sourceIds:hubVideoIds});
 }
}
const thailand={id:'thailand',path:'/trip/thailand/',name:'泰國',englishName:'Thailand',flag:'🇹🇭',
 title:'泰國親子旅行：曼谷、清邁、清萊',metadataTitle:'泰國自由行：曼谷、清邁、清萊景點與行程｜鷹家遠行所',
 description:'看實訪照片挑曼谷、清邁與清萊的市集、手作、水族館、白廟與山景，依天數和步調串起三城旅行，再看各城完整攻略。',
 intro:[`${plain(overview[2]).split('。')[0]}。`,`${plain(overview[2]).split('。').slice(1).join('。').trim()}`].filter(Boolean),
 author:'鷹式一家',updatedOn:'2026-09-27',sourceIds:hubVideoIds,cityIds:['bangkok','chiang-mai','chiang-rai'],image:'cm-thai-dress-family',
 presentation:{overviewTitle:'旅行總覽',overviewText:plain(overview[2]),
  citySummaries:['bangkok','chiang-mai','chiang-rai'].map(id=>({cityId:id,tag:cityCopy[id].tag,intro:cityCopy[id].intro,sourceIds:hubVideoIds})),
  themes:Object.entries(themeIds).map(([id,l])=>({id,label:l})),placeThemes},
 allocation:{approved:true,arrivalDays:1,departureDays:1,dayRange:[3,14],extraDays:'round-robin',sourceIds:hubVideoIds,
  minimumStay:{bangkok:{leisure:2,compact:1},'chiang-mai':{leisure:2,compact:1},'chiang-rai':{leisure:1,compact:1}},routes:allocationRoutes},
 planInfo:{title:'把城市串成你的旅程',paragraphs:[plain(section(hub,'plan').match(/<p class="th-plan-footnote">([\s\S]*?)<\/p>/)[1])],sourceIds:hubVideoIds,links:[]},
 faq:faqs(section(hub,'faq')).map(q=>({...q,sourceIds:hubVideoIds})),
 related:{title:'延伸閱讀',paragraphs:[],sourceIds:hubVideoIds,links:[{label:'曼谷城市篇',url:'/trip/guides/bangkok-with-kids/'},{label:'清邁城市篇',url:'/trip/guides/chiang-mai-with-kids/'},{label:'清萊城市篇',url:'/trip/guides/chiang-rai-with-kids/'}]},
 discovery:{region:'asia',subregion:'southeast-asia',summary:'從曼谷的運河與市集，到清邁古城、清萊花園，挑一座城市開始。',assetId:'cm-thai-dress-family',sourceIds:hubVideoIds,point:[100.5,15],isoNumeric:'764'}};
addAsset('cm-thai-dress-family','/trip/guides/chiang-mai-with-kids/');
const atlasSource=addSource({id:'p-thailand-atlas',kind:'photo',url:site+'/trip/thailand/',label:'泰國手繪旅行示意圖',rights:'鷹式一家自製旅行示意圖，原刊於本站泰國總覽。',locator:'泰國總覽地圖'});
assets.set('thailand-atlas',legacyAsset('thailand-atlas',{alt:'泰國手繪旅行示意圖：清邁與清萊在北部，曼谷位於中部',caption:'旅行位置示意；點城市看攻略。',sourceIds:[atlasSource]}));
thailand.map={assetId:'thailand-atlas',caption:'旅行位置示意；點城市看攻略。',sourceIds:[atlasSource],pins:[{cityId:'bangkok',x:45,y:45},{cityId:'chiang-mai',x:32,y:16,align:'left'},{cityId:'chiang-rai',x:39,y:8}]};

const cities=[bangkok,chiangMai,chiangRai];
const pkg={schema:'eaglish.approved-travel-package/v1',approved:true,sources:[...sources.values()],assets:[...assets.values()],countries:[thailand],cities,routes:[],
 coverage:{countryIds:['thailand'],cityIds:cities.map(c=>c.id)}};
const out=resolve(root,'trip/data/thailand-approved-travel-v1.json');
writeFileSync(out,JSON.stringify(pkg,null,2)+'\n');
console.log('wrote',out,'sources',pkg.sources.length,'assets',pkg.assets.length,'places',cities.map(c=>c.places.length).join('/'));
