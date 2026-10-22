// Synthetic engineering sample ONLY: a Japan-shaped candidate package that
// exercises the route article, route map points and 1:50m map detail.
// The text, photos and itinerary are placeholders, not a real trip.
import {createHash} from 'node:crypto';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import sharp from 'sharp';
const digest=b=>createHash('sha256').update(b).digest('hex');
export const syntheticRoutePath='/trip/japan/hokkaido-asahikawa-sapporo-7-days/';
export async function syntheticJapanCandidate(root,{label=false}={}){
 const sources=[{id:'fixture-official',kind:'official',url:'https://example.org/synthetic-official',rights:'Synthetic test fixture only',checkedOn:'2026-10-21',label:'Synthetic source'},{id:'fixture-video',kind:'youtube',url:'https://www.youtube.com/watch?v=synthetic',rights:'Synthetic test only',label:'示意影片'}];
 const sourceIds=['fixture-official'],assets=[];
 // Distinct sand tones; landscape and portrait shapes like real hero/gallery photos.
 for(let i=0;i<12;i++){
  const assetId='jp-fixture-'+i,width=1440,height=i%3===2?2160:960,variants=[];
  for(const w of [640,960,1440]){
   const h=Math.round(w*height/width),tone={r:214-i*6,g:200-i*4,b:180-i*3};
   const text=label?Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><text x="50%" y="50%" text-anchor="middle" font-family="sans-serif" font-size="${Math.round(w/14)}" fill="#494139">PHOTO ${i+1}</text></svg>`):null;
   let image=sharp({create:{width:w,height:h,channels:3,background:tone}});if(text)image=image.composite([{input:text}]);
   const b=await image.webp({quality:60}).toBuffer(),url=`/trip/assets/fixture-japan/${assetId}-${w}.webp`;
   mkdirSync(resolve(root,'trip/assets/fixture-japan'),{recursive:true});writeFileSync(resolve(root,url.slice(1)),b);
   variants.push({url,width:w,height:h,bytes:b.length,sha256:digest(b)});
  }
  assets.push({assetId,width,height,alt:'示意照片 '+(i+1),caption:'示意照片 '+(i+1)+'（工程樣板）',focalPoint:[50,50],sourceIds,variants,lineage:{kind:'photo',sourceSha256:digest(Buffer.from('synthetic japan '+i)),sourceWidth:width,sourceHeight:height,activePicture:{x:0,y:0,width,height}}});
 }
 const a=i=>assets[i].assetId,module=title=>({title,paragraphs:['示意文字，正式內容由 Codex 依來源撰寫。'],sourceIds,links:[]});
 const facts=Object.fromEntries(['what','play','arrival','duration','availability','conditions'].map((k,i)=>[k,{label:['是什麼','玩什麼','怎麼去','留多久','何時能去','雨天或特殊條件'][i],value:'示意文字',sourceIds}]));
 const city=(id,name,englishName,offset)=>{
  const places=[0,1].map(n=>({id:`${id}-stop-${n+1}`,stableId:`${id}-stop-${n+1}`,title:`${name}示意景點 ${n+1}`,paragraphs:['示意文字。'],images:[a(offset+n*3),a(offset+n*3+1),a(offset+n*3+2)],sourceIds,facts,story:{text:'示意紀錄。',sourceIds},links:[]}));
  return {id,countryId:'japan',path:`/trip/guides/${id}-with-kids/`,name,englishName,destinationKind:'city',title:`${name}親子攻略：工程樣板`,description:`${name}城市篇的工程樣板。`,author:'鷹式一家',updatedOn:'2026-10-21',intro:['這是工程樣板的第一句導讀。','正式內容會由 Codex 依來源撰寫。'],sourceIds,hero:[a(offset),a(offset+1),a(offset+2)],
   cards:places.map(p=>({target:p.id,assetId:p.images[0],title:p.title,play:'示意玩法',time:'示意時間',focalPoint:[50,50]})),places,
   food:module('餐食與費用'),stay:module('住宿'),arrival:module('交通'),rain:module('雨天替換'),faq:[{question:'示意問題？',answer:'示意答案。',sourceIds}],
   planner:{title:'行程規劃',paragraphs:['示意試排。'],sourceIds,routes:[{id:`${id}-one-day`,sightseeingDays:1,pace:'leisure',label:'示意一日',note:'示意',sourceIds,days:[{title:'示意一天',description:'示意',stops:[places[0].id]}]}]},
   videoSourceIds:['fixture-video']};
 };
 const asahikawa=city('asahikawa','旭川','Asahikawa',0),sapporo=city('sapporo','札幌','Sapporo',6);
 const routeId='hokkaido-asahikawa-sapporo-7-days';
 const kinds=['arrival','full_play','full_play_regional','full_play','full_play_regional','full_play_flexible','international_departure'];
 const where=['新千歲機場→札幌','札幌','旭川','札幌','小樽','札幌','札幌→新千歲機場'];
 const route={id:routeId,countryId:'japan',path:syntheticRoutePath,name:'北海道 7 天路線',englishName:'Hokkaido 7 Days',title:'北海道 7 天親子路線：工程樣板',description:'路線篇的工程樣板：逐日段落連到城市篇。',author:'鷹式一家',updatedOn:'2026-10-21',intro:['這是路線篇工程樣板的第一句導讀。','正式內容會由 Codex 依來源撰寫。'],sourceIds,hero:[a(0),a(6),a(3)],cityIds:['asahikawa','sapporo'],
  facts:[{label:'天數',value:'7 天（示意）',sourceIds},{label:'住宿基地',value:'示意',sourceIds},{label:'移動',value:'示意',sourceIds}],calendarDays:7,
  days:kinds.map((kind,i)=>({day:i+1,kind,destination:where[i],title:`示意標題 ${i+1}`,...(i===1||i===3||i===5?{overnight:'札幌'}:{}),paragraphs:['示意文字：這天怎麼移動、為什麼這樣排。'],sourceIds,...(i===2?{images:[a(0),a(1),a(2)],places:[{cityId:'asahikawa',placeId:'asahikawa-stop-1'},{cityId:'asahikawa',placeId:'asahikawa-stop-2'}]}:{}),...(i===1?{places:[{cityId:'sapporo',placeId:'sapporo-stop-1'}]}:{}),links:[]})),
  transport:module('怎麼移動'),faq:[{question:'示意問題？',answer:'示意答案。',sourceIds}],plan:{title:'7 天總表',paragraphs:['示意：固定路線，不是試排。'],sourceIds},videoSourceIds:['fixture-video'],related:module('延伸閱讀')};
 const point=(label,lonlat,extra)=>({label,point:lonlat,sourceIds,...extra});
 const japan={id:'japan',path:'/trip/japan/',name:'日本',englishName:'Japan',flag:'🇯🇵',title:'日本親子旅行：工程樣板',description:'日本入口頁的工程樣板。',intro:['這是入口頁工程樣板的第一句導讀。','正式內容會由 Codex 依來源撰寫。'],updatedOn:'2026-10-21',image:a(0),sourceIds,faq:[{question:'示意問題？',answer:'示意答案。',sourceIds}],
  cityIds:['asahikawa','sapporo'],routeIds:[routeId],
  discovery:{region:'asia',subregion:'east-asia',summary:'示意',assetId:a(0),sourceIds,point:[142.4,43.4],isoNumeric:'392'},
  geographicMap:{detail:'50m',caption:'位置示意，不作導航用。',sourceIds,views:[
   {id:'japan',label:'日本全圖',note:'示意',bounds:[128.4,30.6,146.4,45.8],points:[point('旭川',[142.365,43.7706],{cityId:'asahikawa'}),point('札幌',[141.3545,43.0618],{cityId:'sapporo'})]},
   {id:'hokkaido',label:'北海道',note:'示意',bounds:[139.2,41.3,146.0,45.6],points:[point('旭川',[142.365,43.7706],{cityId:'asahikawa'}),point('札幌',[141.3545,43.0618],{cityId:'sapporo'}),point('小樽',[140.9947,43.1907],{routeId,href:syntheticRoutePath+'#day-5'}),point('新千歲機場',[141.6923,42.7752],{routeId,href:syntheticRoutePath+'#day-1'})]}],
   connections:[{fromLabel:'旭川',toLabel:'札幌',label:'示意',mode:'train',sourceIds}]},
  referencePlans:[{id:'hokkaido-7-days-reference',title:'北海道 7 天',sourceIds,calendarDays:7,routeId,days:route.days.map(d=>({day:d.day,kind:d.kind,destination:d.destination,paragraphs:d.paragraphs}))}]};
 return {schema:'eaglish.approved-travel-package/v1',approved:true,sources,assets,countries:[japan],cities:[asahikawa,sapporo],routes:[route],coverage:{countryIds:['japan'],cityIds:['asahikawa','sapporo'],routeIds:[routeId]}};
}
export function writeCandidate(root,data,dataPath='trip/data/fixture-japan-candidate.json'){
 const bytes=Buffer.from(JSON.stringify(data));mkdirSync(resolve(root,'trip/data'),{recursive:true});writeFileSync(resolve(root,dataPath),bytes);
 return {dataPath,expectedSha256:digest(bytes),countryIds:data.coverage.countryIds,cityIds:data.coverage.cityIds,routeIds:data.coverage.routeIds,publication:false};
}
