import {byId} from '../trip/new-zealand-data.mjs';

const escape = value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const regionPoint = {
  'north-island': [67,33], wellington: [61,53], kaikoura: [55,60],
  'christchurch-akaroa': [51,67], 'mid-canterbury': [45,69],
  'wanaka-tekapo': [40,71], 'queenstown-arrowtown': [32,77], otago: [40,83]
};
const regionNames = {
  'north-island':['北島','Auckland · Rotorua'], wellington:['威靈頓','Wellington'],
  kaikoura:['凱庫拉','Kaikōura'], 'christchurch-akaroa':['基督城／阿卡羅阿','Christchurch · Akaroa'],
  'mid-canterbury':['中坎特伯雷','Mid Canterbury'], 'wanaka-tekapo':['瓦納卡／蒂卡波','Wānaka · Tekapo'],
  'queenstown-arrowtown':['皇后鎮／箭鎮','Queenstown · Arrowtown'], otago:['奧塔哥','Otago']
};
function regionPin(id,side,y) {
  return {id,point:regionPoint[id],side,y,zh:regionNames[id][0],en:regionNames[id][1],href:byId[id].route};
}
const northRoute = byId['north-island'].route;
export const atlasViews = {
  all: {
    title:'紐西蘭旅行地圖', english:'NEW ZEALAND', scale:1, translate:[0,0],
    pins:[regionPin('north-island','right',25),regionPin('wellington','right',47),regionPin('kaikoura','right',61),regionPin('christchurch-akaroa','right',75),regionPin('mid-canterbury','left',58),regionPin('wanaka-tekapo','left',74),regionPin('queenstown-arrowtown','left',90),regionPin('otago','right',89)],
    routes:[], note:'選擇北島或南島，放大看區域與路線。點地名開啟攻略。'
  },
  north: {
    title:'北島旅行地圖', english:'NORTH ISLAND', scale:1.75, translate:[-62.875,-8],
    pins:[
      {id:'auckland',point:[60.2,24.5],side:'left',y:22,zh:'奧克蘭',en:'Auckland',href:northRoute+'#sky-tower'},
      {id:'hamilton',point:[62.6,30.5],side:'left',y:40,zh:'漢密爾頓',en:'Hamilton',href:northRoute+'#hamilton-zoo'},
      {id:'matamata',point:[65,30.7],side:'right',y:30,zh:'瑪塔瑪塔',en:'Matamata · Hobbiton',href:northRoute+'#hobbiton-site'},
      {id:'rotorua',point:[67,33],side:'right',y:49,zh:'羅托魯瓦',en:'Rotorua',href:northRoute+'#rotorua-luge'},
      regionPin('wellington','right',86)
    ],
    routes:[{kind:'main',points:[[60.2,24.5],[62.6,30.5],[65,30.7],[67,33]]}],
    note:'跨區順序示意：奧克蘭 → 漢密爾頓 → 瑪塔瑪塔 → 羅托魯瓦。威靈頓另安排交通接續；虛線表示旅行順序，非實際道路或一日行程。'
  },
  south: {
    title:'南島旅行地圖', english:'SOUTH ISLAND', scale:1.85, translate:[-24.925,-78.725],
    pins:[regionPin('kaikoura','right',20),regionPin('christchurch-akaroa','right',57),regionPin('mid-canterbury','left',38),regionPin('wanaka-tekapo','left',57),regionPin('queenstown-arrowtown','left',78),regionPin('otago','right',83)],
    routes:[
      {kind:'main',points:[[55,60],[51,67],[45,69],[40,71],[32,77]]},
      {kind:'coast',points:[[51,67],[49,73],[45,79],[40,83]]}
    ],
    note:'跨區順序示意：凱庫拉 → 基督城 → 中坎特伯雷 → 湖區 → 皇后鎮；另一方向沿東岸往奧塔哥。虛線表示旅行順序，非實際道路或一日行程。'
  }
};
export function projectAtlasPoint(view,point) {
  const config = atlasViews[view];
  return point.map((value,index)=>Number((value*config.scale+config.translate[index]).toFixed(3)));
}
const clip = {
  north:'polygon(47% 4%, 86% 4%, 86% 58%, 60% 58%, 59% 47%, 52% 45%)',
  south:'polygon(15% 43%, 55% 43%, 61% 56%, 61% 95%, 15% 95%)'
};
function viewMarkup(name,view) {
  const positions = view.pins.map(pin=>({...pin,display:projectAtlasPoint(name,pin.point)}));
  const leaders = positions.map(pin=>`<line x1="${pin.display[0]}" y1="${pin.display[1]}" x2="${pin.side==='left'?29:67}" y2="${pin.y}"></line>`).join('');
  const paths = view.routes.map(route=>`<polyline class="nz-atlas-route nz-atlas-route--${route.kind}" points="${route.points.map(point=>projectAtlasPoint(name,point).join(',')).join(' ')}"></polyline>`).join('');
  const pins = positions.map(pin=>{
    const left = pin.side==='left'?3:67;
    const width = pin.side==='left'?26:30;
    return `<a class="nz-atlas-pin nz-atlas-pin--${pin.side}" href="${pin.href}" data-atlas-place="${pin.id}" style="--label-x:${left}%;--label-width:${width}%;--label-y:${pin.y}%;--dot-x:${(pin.display[0]-left)/width*100}%;--dot-y:${pin.display[1]-pin.y}cqw" aria-label="${escape(pin.zh)}攻略"><i aria-hidden="true"></i><span>${escape(pin.zh)}<small lang="en">${escape(pin.en)}</small></span></a>`;
  }).join('');
  const hitAreas = name==='all' ? `<svg class="nz-atlas-islands" viewBox="0 0 100 100" aria-label="選擇島嶼放大" hidden><path d="M50 8 L54 8 60 18 60 23 65 29 68 26 69 29 75 29 78 30 76 39 72 42 67 50 64 55 60 53 62 45 57 42 55 40 60 36 60 30 56 21Z" data-atlas-select="north" role="button" tabindex="0" aria-label="放大北島" aria-pressed="false"><title>點選放大北島</title></path><path d="M52 45 L54 48 59 49 58 55 54 63 54 69 47 71 45 79 41 85 36 88 28 87 22 84 21 80 25 76 31 70 41 63 45 57 47 50Z" data-atlas-select="south" role="button" tabindex="0" aria-label="放大南島" aria-pressed="false"><title>點選放大南島</title></path></svg>` : '';
  return `<div class="nz-atlas-view" data-atlas-view="${name}"${name==='all'?'':' hidden'}><div class="nz-atlas-image"><img src="/trip/assets/new-zealand-atlas.webp" srcset="/trip/assets/new-zealand-atlas-640.webp 640w, /trip/assets/new-zealand-atlas-960.webp 960w, /trip/assets/new-zealand-atlas.webp 1254w" sizes="(max-width:600px) 92vw, 580px" width="1254" height="1254" alt="${escape(view.title)}，水彩地理示意" loading="lazy" fetchpriority="low" decoding="async" style="transform:translate(${view.translate[0]}%,${view.translate[1]}%) scale(${view.scale});${clip[name]?`clip-path:${clip[name]};`:''}"></div>${hitAreas}<svg class="nz-atlas-leaders" viewBox="0 0 100 100" aria-hidden="true">${paths}${leaders}</svg><div class="nz-atlas-caption" aria-hidden="true">${view.english}<small>${view.title}</small></div>${pins}</div>`;
}
export function newZealandAtlas() {
  const controls = [['all','全圖'],['north','北島'],['south','南島']].map(([value,label])=>`<button type="button" data-atlas-select="${value}" aria-pressed="${value==='all'}" aria-controls="nz-travel-atlas">${label}</button>`).join('');
  return `<div class="nz-map-pair" data-nz-atlas><div class="nz-atlas-controls" role="group" aria-label="選擇地圖範圍，可用左右方向鍵切換" hidden>${controls}</div><div class="nz-atlas" id="nz-travel-atlas" data-atlas-active="all">${Object.entries(atlasViews).map(([name,view])=>viewMarkup(name,view)).join('')}</div><p class="nz-atlas-status" data-atlas-status role="status">紐西蘭全圖 · 可從下方照片卡選擇區域</p>${Object.entries(atlasViews).map(([name,view])=>`<p class="nz-atlas-description" data-atlas-description="${name}"${name==='all'?'':' hidden'}><span class="nz-atlas-note">旅行位置示意</span> · ${view.note}</p>`).join('')}</div>`;
}
