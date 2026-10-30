// Draft: restates the Taiwan places already published on the travel home atlas
// (trip/data/taiwan-atlas-r24.json) as an approved-package candidate with four
// regional guides. Only the atlas's own text, photos, addresses and links are used;
// everything the atlas does not have is written as 「【待補】」 so the page shows the
// gap instead of inventing it. Lydia's TRIP-TW-001 materials replace those later.
// The package stays a candidate (unpublished) while any 【待補】 remains.
// Run: node scripts/migrate/taiwan-approved-v1.mjs
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {root,sha256} from './legacy-approved-helpers.mjs';

const atlas=JSON.parse(readFileSync(resolve(root,'trip/data/taiwan-atlas-r24.json'),'utf8'));
const TBD='【待補】';
const checkedOn='2026-10-02'; // taiwan-r24-20261002 release, when the atlas facts were reviewed
const regions=[
 {id:'taipei',name:'台北',englishName:'Taipei',counties:['tw-taipei-city']},
 {id:'new-taipei-keelung',name:'新北・基隆',englishName:'New Taipei · Keelung',counties:['tw-new-taipei-city','tw-keelung-city']},
 {id:'yilan',name:'宜蘭',englishName:'Yilan',counties:['tw-yilan-county']},
 {id:'kaohsiung',name:'高雄',englishName:'Kaohsiung',counties:['tw-kaohsiung-city']},
];
const sources=new Map(),assets=new Map();
const addSource=s=>{if(!sources.has(s.id))sources.set(s.id,s);return s.id;};
const slug=url=>url.replace(/^https:\/\/(www\.)?/,'').replace(/[^a-z0-9]+/gi,'-').toLowerCase().slice(0,70).replace(/^-+|-+$/g,'');
const ownRights='鷹式一家自有公開貼文與影片。';
const visitSource=l=>addSource(/youtube\.com|youtu\.be/.test(l.url)?{id:'v-'+slug(l.url),kind:'youtube',url:l.url,label:l.label,rights:ownRights}
 :/instagram\.com/.test(l.url)?{id:'v-'+slug(l.url),kind:'instagram',url:l.url,label:l.label,rights:ownRights}
 :{id:'p-'+slug(l.url),kind:'photo',url:l.url,label:l.label,rights:ownRights});
const officialSource=(url,label)=>addSource({id:'o-'+slug(url),kind:'official',url,label,checkedOn,rights:'第一方公開資訊；照片不採用'});

// The atlas card photo (480px square) is the only published size for now.
function cardAsset(place,sourceIds){
 const url=place.photo.src,id=url.split('/').pop().replace(/\.webp$/,'').toLowerCase();
 if(!assets.has(id)){
  // A 320px downscale (same pixels, smaller) gives the template its required second size.
  const variant=(u,w)=>{const b=readFileSync(resolve(root,'.'+u));return {url:u,width:w,height:w*place.photo.height/place.photo.width,bytes:b.length,sha256:sha256(b)};};
  const v=variant(url,place.photo.width),small=variant(url.replace(/\.webp$/,'-320.webp'),320);
  assets.set(id,{assetId:id,width:v.width,height:v.height,alt:place.photo.alt,caption:place.photo.alt,focalPoint:place.photo.position||[50,50],sourceIds,variants:[small,v],
   lineage:{sourceSha256:v.sha256,sourceWidth:v.width,sourceHeight:v.height,kind:'photo',activePicture:{x:0,y:0,width:v.width,height:v.height}}});
 }
 return id;
}
const label={what:'是什麼',play:'玩什麼',arrival:'怎麼去',duration:'留多久',availability:'何時能去',conditions:'雨天或特殊條件'};
const cities=[];
for(const r of regions){
 const all=atlas.data.places.filter(p=>p.countyIds.some(c=>r.counties.includes(c)));
 const withPhoto=all.filter(p=>p.photo),textOnly=all.filter(p=>!p.photo);
 const places=withPhoto.map(p=>{
  const visits=p.visitLinks.map(visitSource),official=p.officialUrl?[officialSource(p.officialUrl,`${p.name} 官方資訊`)]:[];
  const sourceIds=[...new Set([...official,...visits])];
  const id=p.id.replace(/^place-tw-/,'');
  const f={what:p.whatToExpect||p.detail.paragraphs[0],play:p.tags.length?p.tags.join('、'):TBD,arrival:p.address?`地址：${p.address}`:TBD,duration:TBD,
   availability:p.officialUrl?`出發前依[官方資訊](${p.officialUrl})確認開放時間。`:'出發前依官方公告確認。',conditions:TBD};
  return {id,stableId:'tw-'+id,title:p.name,paragraphs:[...p.detail.paragraphs,TBD+'我們當時怎麼玩、孩子的反應與安排建議（TRIP-TW-001）。'],sourceIds,
   facts:Object.fromEntries(Object.keys(label).map(k=>[k,{label:label[k],value:f[k],sourceIds}])),
   images:[cardAsset(p,visits.length?visits:sourceIds)],
   links:[{label:'Google Maps',url:p.maps.search},...(p.officialUrl?[{label:'官方資訊',url:p.officialUrl}]:[]),...p.visitLinks.map(l=>({label:l.label,url:l.url}))],_place:p};
 });
 const videos=[...new Set(places.flatMap(p=>p.sourceIds.filter(id=>sources.get(id).kind!=='official'&&sources.get(id).kind!=='photo')))];
 const main=videos[0]||places[0].sourceIds[0];
 // Draft plan: places in atlas order, four a day, until the real itinerary arrives.
 const chunks=[];for(let i=0;i<places.length;i+=4)chunks.push(places.slice(i,i+4));
 const route={id:`${r.id}-draft`,label:`${TBD}行程草稿`,sightseeingDays:chunks.length,pace:'leisure',note:`${TBD}依地點順序暫排四站一天，等實際行程替換。`,sourceIds:[main],
  days:chunks.map((c,i)=>({title:`第 ${i+1} 天（草稿）`,description:`${TBD}暫排：${c.map(p=>p.title).join('、')}。`,stops:c.map(p=>p.id)}))};
 cities.push({id:r.id,countryId:'taiwan',path:`/trip/guides/${r.id}-with-kids/`,name:r.name,englishName:r.englishName,destinationKind:'region',
  title:`${r.name}親子旅行：${TBD}`,description:`${r.name}親子景點、餐廳與住宿：${places.map(p=>p._place.name.split(' ')[0]).slice(0,4).join('、')}等。${TBD}`,
  intro:[`${TBD}${r.name}篇的開場（TRIP-TW-001）。`,`目前整理了我們去過的 ${places.length} 個地點${textOnly.length?`，另有 ${textOnly.length} 個還沒有照片`:''}。`],
  sourceIds:[...new Set(places.flatMap(p=>p.sourceIds))].slice(0,8),author:'鷹式一家',updatedOn:checkedOn,
  hero:places.slice(0,3).map(p=>p.images[0]),places:places.map(({_place,...p})=>p),
  cards:places.map(p=>({target:p.id,assetId:p.images[0],title:p._place.name,play:(p._place.whatToExpect||'').split(/[，。]/)[0]||TBD,time:TBD,focalPoint:p._place.photo.position||[50,50]})),
  faq:[{question:`${TBD}${r.name}常見問題`,answer:`${TBD}（TRIP-TW-001）`,sourceIds:[main]}],
  videoSourceIds:videos.length?videos:[main],planner:{title:`${r.name}行程規劃`,paragraphs:[`${TBD}行程說明（TRIP-TW-001）。`],sourceIds:[main],routes:[route]},
  ...(textOnly.length?{extension:{title:'還在補照片的地點',paragraphs:[`${textOnly.map(p=>p.name).join('、')}：${TBD}照片與介紹。`],sourceIds:[main],links:textOnly.map(p=>({label:`${p.name} Google Maps`,url:p.maps.search}))}}:{})});
}
const lead=cities[0];
const country={id:'taiwan',path:'/trip/taiwan/',name:'臺灣',englishName:'Taiwan',flag:'🇹🇼',title:`臺灣親子旅行：${TBD}`,description:`台北、新北・基隆、宜蘭、高雄的親子景點、餐廳與住宿。${TBD}`,
 intro:[`${TBD}臺灣總覽開場（TRIP-TW-001）。`,'先依區域挑地點，再看各區攻略。'],author:'鷹式一家',updatedOn:checkedOn,sourceIds:lead.sourceIds.slice(0,3),cityIds:cities.map(c=>c.id),
 image:lead.hero[0],faq:[{question:`${TBD}臺灣常見問題`,answer:`${TBD}（TRIP-TW-001）`,sourceIds:lead.sourceIds.slice(0,1)}]};
const pkg={schema:'eaglish.approved-travel-package/v1',approved:true,sources:[...sources.values()],assets:[...assets.values()],countries:[country],cities,routes:[],
 coverage:{countryIds:['taiwan'],cityIds:cities.map(c=>c.id)}};
const out=resolve(root,'trip/data/taiwan-approved-travel-v1.json');
writeFileSync(out,JSON.stringify(pkg,null,2)+'\n');
console.log('wrote',out,'cities',cities.length,'places',cities.reduce((n,c)=>n+c.places.length,0),'assets',assets.size,'TBD',(JSON.stringify(pkg).match(/【待補】/g)||[]).length);
