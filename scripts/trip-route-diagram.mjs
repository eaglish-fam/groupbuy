const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const wrapRouteText=(value,width=16)=>{
 const tokens=String(value).match(/[A-Za-z0-9]+(?:[ .'’/-]+[A-Za-z0-9]+)*|[^\r\n]|[\r\n]/gu)||[],result=[];let line='';
 const push=()=>{if(line.trim())result.push(line.trim());line='';};
 for(const token of tokens){
  if(/[\r\n]/.test(token)){push();continue;}
  const parts=Array.from(token).length>width?(token.match(/[A-Za-z0-9]+|\s+|./gu)||[]):[token];
  for(const part of parts){if(!line&&!part.trim())continue;if(Array.from(line+part).length>width&&line)push();line+=part;}
 }
 push();return result.length?result:[''];
};

// A bounded portrait diagram stays legible in a 320px viewport. The adjacent
// HTML facts carry the full sourced times/conditions; the SVG is a route aid.
export function renderRouteDiagramSvg({title,alt,routes}){
 if(!Array.isArray(routes)||routes.length<1||routes.length>8)throw Error('Diagram supports one to eight routes');
 if(new Set(routes.map(r=>r.id)).size!==routes.length)throw Error('Duplicate diagram route');
 let y=76;
 const text=(value,x,start,{size=17,color='#334f44',weight=400,width=16}={})=>{
  const body=wrapRouteText(value,width),height=body.length*(size+6);
  return {height,svg:`<text x="${x}" y="${start}" font-size="${size}" fill="${color}" font-weight="${weight}">${body.map((line,i)=>`<tspan x="${x}" dy="${i?size+6:0}">${esc(line)}</tspan>`).join('')}</text>`};
 };
 let body='';
 for(const route of routes){
  if(!/^[a-z0-9-]+$/.test(route.id)||!Array.isArray(route.nodes)||route.nodes.length<2||route.nodes.length>8||route.nodes.some(n=>typeof n!=='string'||!n.trim()||n.length>120))throw Error('Invalid diagram nodes');
  if(routes.length!==1||route.title!==title){const heading=text(route.title,18,y,{size:20,weight:600,width:14});body+=heading.svg;y+=heading.height+18;}
  for(let i=0;i<route.nodes.length;i++){
   const node=text(route.nodes[i],38,y,{width:15});
   body+=`<circle cx="23" cy="${y-5}" r="5" fill="#8d4b35"/>${node.svg}`;y+=node.height;
   if(i<route.nodes.length-1){body+=`<path d="M23 ${y-9}V${y+12}" stroke="#6f8f83" stroke-width="2"/>`;y+=24;}
  }
  body+=`<path d="M18 ${y+4}H302" stroke="#d8d0bf"/>`;y+=40;
 }
 const height=y+8;
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="320" height="${height}" viewBox="0 0 320 ${height}" role="img" aria-labelledby="route-title route-description"><title id="route-title">${esc(title)}</title><desc id="route-description">${esc(alt)}</desc><rect width="320" height="${height}" fill="#faf8f1"/><g font-family="Songti TC, Songti SC, PMingLiU, serif">${text(title,18,35,{size:21,weight:600,width:14}).svg}${body}</g></svg>`;
 if(Buffer.byteLength(svg)>65536)throw Error('Diagram exceeds 64KiB');
 return {svg,width:320,height};
}

export function compileMalaysiaTransport(research){
 const legs=new Map(research.transport.map(leg=>[leg.id,leg])),raw=[
  ['my-tpe-pen','臺灣直飛檳城',['TPE 臺灣桃園機場','PEN 檳城國際機場','George Town 喬治市'],['tpe-pen','pen-georgetown']],
  ['my-tpe-kul','臺灣直飛吉隆坡',['TPE 臺灣桃園機場','KUL 吉隆坡機場','依航司確認 T1／T2'],['tpe-kul']],
  ['my-kul-t1-sentral','T1 到市中心',['KUL T1 ERL 站','KLIA Ekspres','KL Sentral ERL 站'],['kul-t1-sentral']],
  ['my-kul-t2-sentral','T2 到市中心',['KUL T2 ERL 站','KLIA Ekspres 經 T1','KL Sentral ERL 站'],['kul-t2-sentral']],
  ['my-ets-ferry','吉隆坡到檳城：鐵路及船',['KL Sentral KTM 站','Butterworth KTM 站','Penang Sentral 步行連接','Sultan Abdul Halim 碼頭','渡輪到 Raja Tun Uda','George Town 喬治市'],['sentral-butterworth','butterworth-sentral','butterworth-ferry','ferry-georgetown']],
  ['my-domestic-flight','吉隆坡到檳城：國內線',['吉隆坡市區','KUL T2：AirAsia 樣本','PEN 檳城國際機場','George Town 喬治市'],['kul-pen','pen-georgetown']],
  ['my-sentral-mrt','Sentral 轉 MRT',['KL Sentral','步行至 Muzium Negara MRT','Kajang 線往 Pasar Seni／Merdeka／Bukit Bintang'],['sentral-pasarseni']],
  ['my-kidzania-transfer','到 KidZania 的末段',['吉隆坡市區','MRT Mutiara Damansara','另接末段到 Curve NX'],['sentral-kidzania']]
 ];
 const routes=raw.map(([id,title,nodes,legIds])=>{
  const selected=legIds.map(id=>{if(!legs.has(id))throw Error('Unresolved reviewed transport leg');return legs.get(id);});
  return {id,title,nodes,legIds,sampleCaption:selected.map(s=>`${s.from} → ${s.to}：${s.time}。${s.note}`).join(' '),edgeLabels:[],sourceIds:[...new Set(selected.flatMap(s=>[...s.sourceIds,...(s.terminalSourceIds||[])]))].map(id=>'my-'+id.toLowerCase())};
 });
 routes[4].edgeLabels=[research.transportDiagram.railCityToCityBudget,'島上 07:00 首班渡輪接不上 Butterworth 05:15 ETS；早班需先在大陸端過夜。'];
 routes[5].edgeLabels=['1 小時為 2026-10-13 航班樣本；城市到城市預留 4–5 小時，地面交通、報到、行李另計。'];
 return {id:'my-transport-engineering-g3',kind:'route-svg',url:'/trip/assets/malaysia-engineering-transport-g3.svg',title:'馬來西亞交通接線',alt:'臺灣直飛兩城、KUL T1／T2 到 Sentral、ETS 加渡輪、國內線及市內末段的八條規劃路線。',caption:'核對於 '+research.checkedOn+'。圖是讀者規劃工具，不是兩次家庭實訪間的歷史移動線；所有班次、航站與票券出發前另核。',checkedOn:research.checkedOn,routes,sourceIds:[...new Set(routes.flatMap(r=>r.sourceIds))],transportLegs:research.transport.map(({id,from,to,mode,time,timeKind,note,sourceIds,terminals,sampleDate})=>({id,from,to,mode,time,timeKind,note,sourceIds,terminals,sampleDate}))};
}
