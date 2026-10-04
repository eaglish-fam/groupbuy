// Synthetic engineering sample ONLY. Never imported by the website build.
import {createHash} from 'node:crypto';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import sharp from 'sharp';
const digest=b=>createHash('sha256').update(b).digest('hex');
export async function syntheticTravelPackage(root){
 const sources=[{id:'fixture-source',kind:'official',url:'https://example.org/synthetic-source',rights:'Synthetic test fixture only',checkedOn:'2026-01-01',label:'Synthetic source'}];
 const sourceIds=['fixture-source'],assets=[];
 for(let i=0;i<6;i++){
  const assetId='fixture-photo-'+i,width=1200,height=i%2?800:1800,variants=[];
  for(const w of [320,640,960]){
   const h=Math.round(w*height/width),b=await sharp({create:{width:w,height:h,channels:3,background:{r:50+i*15,g:100,b:150}}}).webp().toBuffer();
   const url=`/trip/assets/fixture/${assetId}-${w}.webp`;mkdirSync(resolve(root,'trip/assets/fixture'),{recursive:true});writeFileSync(resolve(root,url.slice(1)),b);
   variants.push({url,width:w,height:h,bytes:b.length,sha256:digest(b)});
  }
  assets.push({assetId,width,height,alt:'Synthetic photo '+i,caption:'Synthetic caption '+i,focalPoint:[50,50],sourceIds,variants,lineage:{kind:'photo',sourceSha256:digest(Buffer.from('synthetic source '+i)),sourceWidth:width,sourceHeight:height,activePicture:{x:0,y:0,width,height}}});
 }
 const names=['fixture-city-a','fixture-city-b','fixture-city-c','fixture-city-d'];
 const countries=['fixture-country-a','fixture-country-b'].map((name,index)=>({id:name,path:'/trip/'+name+'/',name,englishName:name,flag:'TEST',title:'Synthetic country',description:'Synthetic description',intro:['Synthetic introduction'],updatedOn:'2026-01-01',image:assets[0].assetId,sourceIds,cityIds:index===0?names.slice(0,3):names.slice(3),faq:[{question:'Synthetic question?',answer:'Synthetic answer.',sourceIds}],discovery:{region:'europe',subregion:'northern-europe',point:[0,0],isoNumeric:'999',summary:'Synthetic discovery',assetId:assets[0].assetId,sourceIds},map:{assetId:assets[1].assetId,caption:'Synthetic geographic fixture; not a real map.',sourceIds,pins:(index===0?names.slice(0,3):names.slice(3)).map(cityId=>({cityId,x:50,y:50}))}}));
 countries.forEach(c=>c.intro.push('Synthetic second lead.'));
 const module={title:'Synthetic module',paragraphs:['Synthetic text.'],sourceIds,links:[]};
 const cities=names.map((name,index)=>{
  const placeId='fixture-stop-'+index,stableId=name+'-stop',images=assets.slice(0,3).map(a=>a.assetId);
  return {id:name,countryId:countries[index<3?0:1].id,path:'/trip/'+name+'/',name,englishName:name,destinationKind:index===0?'archipelago':'city',...(index===0?{visitedBase:'Synthetic base'}:{}),title:'Synthetic title：Synthetic subtitle',description:'Synthetic description',author:'Synthetic author',updatedOn:'2026-01-01',intro:['Synthetic lead one.','Synthetic lead two.'],sourceIds,hero:images,
   cards:[{target:placeId,assetId:images[0],title:'Synthetic place',play:'Synthetic play',time:'Synthetic duration',focalPoint:[50,50]}],
   places:[{id:placeId,stableId,title:'Synthetic place',paragraphs:['Synthetic introduction.'],images,sourceIds,facts:Object.fromEntries(['what','play','arrival','duration','availability','conditions'].map(k=>[k,{label:k,value:'Synthetic '+k,sourceIds}])),story:{text:'Synthetic record.',sourceIds},links:[{url:'#plan',label:'Synthetic plan link'}]}],
   food:structuredClone(module),stay:structuredClone(module),arrival:structuredClone(module),rain:structuredClone(module),faq:[{question:'Synthetic question?',answer:'Synthetic answer.',sourceIds}],
   planner:{title:'Synthetic plan',paragraphs:['Synthetic route; not a real itinerary.'],sourceIds,routes:[{id:'fixture-route',sightseeingDays:1,pace:'leisure',label:'Synthetic route',note:'Synthetic note',sourceIds,days:[{title:'Synthetic day',description:'Synthetic day description',stops:[placeId]}]}],calendar:[{placeId,validFrom:'2026-01-01',validThrough:'2026-12-31',closedDates:['2026-02-01'],closedWeekdays:[1],message:'Synthetic closure',sourceIds}]},videoSourceIds:['fixture-video']};
 });
 sources.push({id:'fixture-video',kind:'youtube',url:'https://www.youtube.com/watch?v=synthetic',rights:'Synthetic test only',label:'Synthetic video'});
 const profile={approved:true,arrivalDays:2,departureDays:1,dayRange:[4,30],extraDays:'round-robin',sourceIds,minimumStay:Object.fromEntries(countries[0].cityIds.map(city=>[city,{leisure:2,compact:1}])),routes:[{id:'fixture-north-route',label:'Synthetic route',description:'Synthetic transport budgets only.',cityIds:countries[0].cityIds,transferDays:[3,2],validFrom:'2026-01-01',validThrough:'2026-12-31',sourceIds}]};
 countries[0].allocation=profile;
 return {schema:'eaglish.approved-travel-package/v1',approved:true,sources,assets,countries,cities,coverage:{countryIds:countries.map(c=>c.id),cityIds:names}};
}
export function writeSyntheticPackage(root,data){
 const dataPath='trip/data/fixture-approved.json',bytes=Buffer.from(JSON.stringify(data));mkdirSync(resolve(root,'trip/data'),{recursive:true});writeFileSync(resolve(root,dataPath),bytes);return {dataPath,expectedSha256:digest(bytes)};
}
