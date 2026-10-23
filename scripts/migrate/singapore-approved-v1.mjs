// Restates the published Singapore guide (trip/data/singapore-public-article-v1.json)
// in the approved-package shape used by Japan and Thailand. Text, photos, links and
// day plans are copied from the published article; nothing here adds new facts.
// Run once: node scripts/migrate/singapore-approved-v1.mjs
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {root} from './legacy-approved-helpers.mjs';

const json=p=>JSON.parse(readFileSync(resolve(root,p),'utf8'));
const {article:a}=json('trip/data/singapore-public-article-v1.json');
const manifest=json('trip/data/singapore-publication-v1.json');
const checkedOn=a.factCheckedOn||a.updatedOn;
const sources=new Map(),assets=new Map();
const addSource=s=>{if(!sources.has(s.id))sources.set(s.id,s);return s.id;};
const ownRights='鷹式一家自有公開照片與影片，原刊於本站新加坡攻略。';
const slug=url=>url.replace(/^https:\/\/(www\.)?/,'').replace(/[^a-z0-9]+/gi,'-').toLowerCase().slice(0,70).replace(/^-+|-+$/g,'');
const linkSource=l=>{
 const video=/youtube\.com|youtu\.be|instagram\.com/.test(l.url);
 return addSource(video?{id:'v-'+slug(l.url),kind:l.url.includes('instagram')?'instagram':'youtube',url:l.url,label:l.label,rights:ownRights}
  :{id:'o-'+slug(l.url),kind:'official',url:l.url,label:l.label,checkedOn,rights:'第一方公開資訊摘要；照片不採用'});
};
const mapsOrOfficial=links=>(links||[]).filter(l=>l.kind!=='maps').map(linkSource);

// Every image keeps its published variants; lineage points at the published master.
// Approved IDs are lowercase kebab-case; the published file names stay as they are.
const norm=id=>id.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
function addAsset(img){
 const aid=norm(img.assetId);
 if(assets.has(aid))return aid;
 const m=manifest.assets.find(x=>x.assetId===img.assetId)||{};
 const variants=img.variants.map(v=>({url:v.url,width:v.width,height:v.height,bytes:v.bytes,sha256:v.sha256})).sort((x,y)=>x.width-y.width),master=variants.at(-1);
 const frame=/^sg-yt-[A-Za-z0-9_-]{11}-(\d{6})/.exec(img.assetId);
 const url=m.sourceUrl||m.locatorUrl||`https://www.eaglish.store${a.path}`;
 const sourceId=addSource({id:'m-'+aid,kind:frame?'youtube':'photo',url:/^https:/.test(url)?url:`https://www.eaglish.store${a.path}`,label:img.caption||img.alt,rights:ownRights,...(m.locatorUrl&&m.locatorUrl!==url?{locator:m.locatorUrl}:{})});
 assets.set(aid,{assetId:aid,width:master.width,height:master.height,alt:img.alt,caption:img.caption||img.alt,focalPoint:[50,50],sourceIds:[sourceId],variants,
  lineage:{sourceSha256:master.sha256,sourceWidth:master.width,sourceHeight:master.height,kind:frame?'video-frame':'photo',activePicture:{x:0,y:0,width:master.width,height:master.height},...(frame?{pts:Number(frame[1])*90000,timebase:'1/90000'}:{})},
  legacyProvenance:{sourceUrl:m.sourceUrl,locatorUrl:m.locatorUrl,rawSha256:m.rawSha256,crop:m.crop,creator:m.creator}});
 return aid;
}
const imageById=new Map();
const collect=v=>{if(!v||typeof v!=='object')return;if(v.assetId&&v.variants)imageById.set(v.assetId,v);for(const c of Object.values(v))collect(c);};
collect(a);
const ref=id=>addAsset(imageById.get(id)||(()=>{throw Error('Unknown Singapore image '+id);})());

// The published practical rows map onto the six questions; the rest stay as extra facts.
const label={what:'是什麼',play:'玩什麼',arrival:'怎麼去',duration:'留多久',availability:'何時能去',conditions:'雨天或特殊條件'};
const pick=(rows,names)=>rows.filter(r=>names.includes(r.label));
const videoIds=[...a.videos.main,...(a.videos.shorts||[])].map(v=>linkSource({label:v.label,url:v.url}));
const stableSeen=new Set();
const places=a.sections.map(s=>{
 const card=a.overview.cards.find(c=>c.target===s.id);
 const official=mapsOrOfficial(s.links),storyId=s.story?.video?linkSource(s.story.video):null;
 const factSources=official.length?official:[storyId||videoIds[0]];
 const rows=s.practical,used=new Set();
 const take=names=>{const r=pick(rows,names);r.forEach(x=>used.add(x.label));return r.map(x=>x.value).join(' ');};
 const facts={
  what:s.paragraphs[0].split('。')[0]+'。',
  play:card?.play||s.title.split('：').slice(1).join('：'),
  arrival:take(['位置','交通','位置與交通','開放時間與位置'])||'見下方地圖與官方交通資訊。',
  duration:take(['預留時間'])||card?.time||'依現場安排。',
  availability:take(['開放時間','營業時間','瀑布時間','常設展'])||'依官方公告。',
  conditions:take(['雨天安排','雨天或帶長輩','DUCKtours 天氣','帶孩子注意','身高與穿著'])||'依現場天氣與公告調整。'};
 const stableId=stableSeen.has(s.stableId)?`${s.stableId}-${s.id}`:s.stableId;stableSeen.add(s.stableId);
 return {id:s.id,stableId,title:s.title,paragraphs:s.paragraphs,sourceIds:[...new Set([...official,...(storyId?[storyId]:[])])],
  facts:Object.fromEntries(Object.entries(facts).map(([k,v])=>[k,{label:label[k],value:v,sourceIds:factSources}])),
  extraFacts:rows.filter(r=>!used.has(r.label)).map(r=>({label:r.label,value:r.value,sourceIds:factSources})),
  images:s.images.map(i=>ref(typeof i==="string"?i:i.assetId)),
  ...(s.story?{story:{title:'我們那次的小記錄',text:s.story.text,paragraphs:[s.story.text],sourceIds:[storyId||factSources[0]]}}:{}),
  links:[...s.links.map(l=>({label:l.label,url:l.url})),...(s.story?.video?[{label:s.story.video.label,url:s.story.video.url}]:[])]};
});
const cards=a.overview.cards.filter(c=>places.some(p=>p.id===c.target)).map(c=>{
 const place=places.find(p=>p.id===c.target),asset=ref(c.image.assetId);
 // The card photo must be one of the place's three; a photo it displaces moves below them.
 if(!place.images.includes(asset)){const all=[asset,...place.images];place.images=all.slice(0,3);place.supportImages=[...(place.supportImages||[]),...all.slice(3)];}
 return {target:c.target,assetId:asset,title:c.title,play:c.play,time:c.time,focalPoint:[50,50]};
});
const allSources=[...new Set(places.flatMap(p=>p.sourceIds))];
const sub=(id,title,paragraphs,{images=[],links=[]}={})=>({id,title,paragraphs,sourceIds:videoIds.slice(0,1),links:links.map(l=>({label:l.label,url:l.url})),...(images.length?{images:images.map(i=>ref(i.assetId||i))}:{})});
const food={title:a.food.title,paragraphs:[a.food.intro],sourceIds:videoIds.slice(0,2),links:[],
 subsections:a.food.items.map(i=>sub(`food-${i.id}`,i.title,i.paragraphs,{images:i.images||[],links:[...(i.maps?[{label:'Google Maps',url:i.maps}]:[]),...(i.links||[])]}))};
const stay={title:a.stay.title,paragraphs:a.stay.paragraphs,sourceIds:videoIds,links:(a.stay.links||[]).map(l=>({label:l.label,url:l.url})),
 subsections:[sub('stay-experience',a.stay.experienceTitle,a.stay.experience,{images:a.stay.images||[]})]};
const arrival={title:a.arrival.title,paragraphs:a.arrival.paragraphs,sourceIds:videoIds.slice(0,2),links:[],
 subsections:a.arrival.items.map((i,n)=>sub(`arrival-${n+1}`,i.title,[i.text],{links:i.links||[]}))};
const rain={title:a.planner.weather.title,paragraphs:[a.planner.weather.text],sourceIds:videoIds.slice(0,2),links:[]};
// Supporting stops (Supertree, T3 slide) and the cruise extension keep their own anchors.
const extension={title:'加選與延伸旅行',paragraphs:[...a.closing,a.sourceNote],sourceIds:videoIds,links:[],
 subsections:[...a.supportingStops.map(s=>sub(s.id,s.title,s.paragraphs,{images:s.images.map(i=>typeof i==="string"?{assetId:i}:i),links:s.links})),
  sub(a.cruise.id,a.cruise.title,a.cruise.paragraphs,{links:a.cruise.links})]};
const placeIds=new Set(places.map(p=>p.id));
const planner={title:a.planner.title,paragraphs:[...a.planner.paragraphs,`${a.planner.airportModule.title}：${a.planner.airportModule.text}`],sourceIds:videoIds,
 routes:a.planner.routes.map(r=>({id:`singapore-${r.id}`,label:r.label,sightseeingDays:r.sightseeingDays,pace:r.pace,note:[r.fit,r.note].filter(Boolean).join(' '),sourceIds:videoIds,
  days:r.days.map(d=>{const optional=(d.optionalTargets||[]).map(t=>a.overview.cards.find(c=>c.target===t)?.title||a.supportingStops.find(s=>s.id===t)?.title.split('：')[0]||t);
   const nonPlace=d.stops.filter(s=>!placeIds.has(s.target)).map(s=>s.label);
   return {title:d.title,description:[d.description,nonPlace.length?`另含：${nonPlace.join('、')}。`:'',optional.length?`可${d.optionalMode==='replace'?'改選':'加選'}：${optional.join('、')}。`:''].filter(Boolean).join(' '),
    stops:[...new Set(d.stops.map(s=>s.target).filter(t=>placeIds.has(t)))]};})}))};
for(const r of planner.routes)for(const d of r.days)if(!d.stops.length)throw Error('Route day without a place '+r.id);

const city={id:'singapore',countryId:'singapore',path:a.path,name:'新加坡',englishName:'Singapore',destinationKind:'city',
 title:a.title,description:a.description,intro:a.intro,sourceIds:[...new Set([...videoIds,...allSources.slice(0,4)])],author:a.author,updatedOn:a.updatedOn,
 hero:a.heroImages.map(i=>addAsset(i)),places,cards,food,stay,arrival,rain,faq:a.faq.items.map(q=>({question:q.question,answer:q.answer,sourceIds:videoIds.slice(0,1)})),
 videoSourceIds:videoIds,planner,extension};
const country={id:'singapore',path:a.path,singleDestination:true,name:'新加坡',englishName:'Singapore',flag:'🇸🇬',title:a.title,description:a.description,intro:a.intro,
 author:a.author,updatedOn:a.updatedOn,sourceIds:videoIds,cityIds:['singapore'],image:city.hero[0],faq:city.faq.slice(0,1)};
const pkg={schema:'eaglish.approved-travel-package/v1',approved:true,sources:[...sources.values()],assets:[...assets.values()],countries:[country],cities:[city],routes:[],
 coverage:{countryIds:['singapore'],cityIds:['singapore']}};
const out=resolve(root,'trip/data/singapore-approved-travel-v1.json');
writeFileSync(out,JSON.stringify(pkg,null,2)+'\n');
console.log('wrote',out,'sources',pkg.sources.length,'assets',pkg.assets.length,'places',places.length,'routes',planner.routes.length);
