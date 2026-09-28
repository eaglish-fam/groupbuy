// Geographic browsing is separate from availability of published travel guides.
export const homeRegions = [
 {id:'asia',label:'亞洲',english:'ASIA',center:[112,22],children:[
  {id:'east-asia',label:'東亞',center:[126,32]},
  {id:'southeast-asia',label:'東南亞',center:[110,8]},
  {id:'south-asia',label:'南亞',center:[78,20]},
  {id:'west-asia',label:'西亞・中東',center:[46,28]},
  {id:'central-asia',label:'中亞',center:[68,42]},
 ]},
 {id:'oceania',label:'大洋洲',english:'OCEANIA',center:[155,-25],children:[
  {id:'australasia',label:'澳洲・紐西蘭',center:[160,-32]},
  {id:'pacific-islands',label:'太平洋島嶼',center:[-170,-15]},
 ]},
 {id:'europe',label:'歐洲',english:'EUROPE',center:[16,48],children:[
  {id:'northern-europe',label:'北歐',center:[15,62]},
  {id:'western-europe',label:'西歐',center:[4,48]},
  {id:'southern-europe',label:'南歐',center:[17,39]},
  {id:'eastern-europe',label:'東歐',center:[30,50]},
 ]},
 {id:'americas',label:'美洲',english:'AMERICAS',center:[-90,15],children:[
  {id:'north-america',label:'北美洲',center:[-105,40]},
  {id:'central-america',label:'中美洲・加勒比',center:[-84,17]},
  {id:'south-america',label:'南美洲',center:[-60,-15]},
 ]},
 {id:'africa',label:'非洲',english:'AFRICA',center:[22,5],children:[
  {id:'north-africa',label:'北非',center:[15,28]},
  {id:'east-africa',label:'東非',center:[38,0]},
  {id:'west-central-africa',label:'西非・中非',center:[7,5]},
  {id:'southern-africa',label:'南部非洲',center:[25,-25]},
 ]},
];

export function regionsForCatalog(catalog){
 const regions=structuredClone(homeRegions);
 for(const country of catalog.countries){
  const id=country.region||'other';
  if(!regions.some(r=>r.id===id))regions.push({id,label:country.regionLabel||'其他目的地',english:'EXPLORE',center:country.geography?.point||[0,0],children:[]});
 }
 return regions;
}
