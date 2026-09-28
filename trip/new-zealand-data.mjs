// Stable page and place identities shared by cards, maps, and itinerary tools.
// Editorial prose lives in trip/content/new-zealand; this module only adds UI metadata.
export const updatedAt = '2026-09-28';
export const countryRoute = '/trip/new-zealand/';

export const regions = [
  {
    id: 'north-island', island: 'north', label: '奧克蘭、Rotorua、Matamata、Hamilton', short: '北島自駕',
    route: '/trip/new-zealand/north-island/', manuscript: 'auckland-rotorua-hobbiton-hamilton.md',
    hero: 'nz-rotorua-luge', heroAlt: 'Rotorua Skyline 園區搭乘纜椅的旅行畫格',
    heroCaption: 'Rotorua Skyline；這張圖不代表奧克蘭市區', days: [3, 4, 5],
    map: [29, 19], summary: '城市觀景、滑車、電影場景和動物園，按區域分日。',
    stops: [
      {id:'sky-tower',name:'Sky Tower',heading:'Sky Tower',area:'auckland',time:'約 1 小時',duration:60,map:'Sky Tower Auckland',photo:null},
      {id:'mount-eden',name:'Mount Eden',heading:'Mount Eden',area:'auckland',time:'約 1 小時',duration:60,map:'Maungawhau Mount Eden Auckland',photo:null},
      {id:'rotorua-luge',name:'Rotorua Skyline／Luge',heading:'Rotorua Skyline',area:'rotorua',time:'約半天',duration:180,map:'Skyline Rotorua',photo:'nz-rotorua-luge',photoAlt:'Rotorua Skyline 園區搭乘纜椅的旅行畫格'},
      {id:'hobbiton-site',name:'Hobbiton 園區出發導覽',heading:'Hobbiton',area:'matamata',time:'導覽約 2.5 小時，另留報到',duration:150,map:'Hobbiton Movie Set Tours Shire Rest',photo:'nz-hobbiton',photoAlt:'Hobbiton 入口的旅行畫格',exclusive:'hobbiton',checkin:20},
      {id:'hobbiton-ite',name:'Hobbiton Matamata i-SITE 出發',heading:'Hobbiton',area:'matamata',time:'產品約 4 小時，另留報到',duration:240,map:'Matamata i-SITE',photo:'nz-hobbiton',photoAlt:'Hobbiton 入口的旅行畫格',exclusive:'hobbiton',checkin:20,alternate:true},
      {id:'hamilton-zoo',name:'Hamilton Zoo',heading:'Hamilton Zoo',area:'hamilton',time:'約半天',duration:180,map:'Hamilton Zoo New Zealand',photo:null,open:'09:30',close:'16:30',lastEntry:'15:30',closedDates:['12-25']}
    ]
  },
  {
    id: 'wellington', island: 'north', label: '威靈頓', short: '海港與博物館',
    route: '/trip/new-zealand/wellington/', manuscript: 'wellington-with-kids.md',
    hero: 'nz-wellington-harbour', heroAlt: '威靈頓海港的旅行畫格', map: [35, 45], days: [2, 3],
    summary: '周日市集、Te Papa、動物園與 Cable Car，市區和跨島日分開。',
    stops: [
      {id:'harbour-market',name:'周日港口市集',heading:'周日港口市集',area:'harbour',time:'1～2 小時',duration:90,map:'Harbourside Market Wellington',photo:'nz-wellington-harbour',photoAlt:'威靈頓海港的旅行畫格',weekdays:[0],open:'07:30',close:'13:00'},
      {id:'te-papa',name:'Te Papa',heading:'Te Papa',area:'harbour',time:'2～3 小時',duration:150,map:'Museum of New Zealand Te Papa Tongarewa',photo:null,open:'10:00',close:'18:00',closedDates:['12-25']},
      {id:'wellington-zoo',name:'Wellington Zoo',heading:'Wellington Zoo',area:'zoo',time:'約半天',duration:180,map:'Wellington Zoo',photo:null},
      {id:'cable-car',name:'Cable Car',heading:'Cable Car',area:'central',time:'1～1.5 小時',duration:75,map:'Wellington Cable Car Lambton Quay',photo:'nz-wellington-cable-car-v1',photoAlt:'威靈頓紅色纜車從彩色燈光隧道駛進車站'}
    ]
  },
  {
    id: 'christchurch-akaroa', island: 'south', label: '基督城與 Akaroa', short: '電車與海灣',
    route: '/trip/new-zealand/christchurch/3-days/', manuscript: 'christchurch-akaroa-with-kids.md',
    hero: 'nz-christchurch-tram', heroAlt: '一家人在基督城復古電車前合照', map: [40, 57], days: [2, 3],
    summary: '市區電車和海灣活動分日；羊駝與出海可擇一。',
    stops: [
      {id:'tram',name:'基督城電車',heading:'基督城市區電車',area:'christchurch',time:'約 50 分鐘，另留步行',duration:90,map:'Christchurch Tram Cathedral Junction',photo:'nz-christchurch-tram',photoAlt:'一家人在基督城復古電車前合照',seasonalOpen:{winter:'09:00',summer:'08:30'},seasonalClose:{winter:'17:00',summer:'18:30'}},
      {id:'ninja-valley',name:'Ninja Valley',heading:'Ninja Valley',area:'christchurch',time:'約半天',duration:150,map:'Ninja Valley Christchurch',photo:null},
      {id:'shamarra',name:'Shamarra 羊駝農場',heading:'Shamarra Alpacas',area:'akaroa',time:'導覽約 1 小時，須預約',duration:90,map:'Shamarra Alpacas Akaroa',photo:'nz-farm',photoAlt:'一家人在 Shamarra 羊駝農場的合照',slots:['11:00','13:00','16:00'],exceptionDates:['12-25']},
      {id:'akaroa-dolphins',name:'Akaroa Dolphins',heading:'Akaroa Dolphins',area:'akaroa',time:'航程約 2 小時，提前報到',duration:180,map:'Akaroa Dolphins 65 Beach Road',photo:'nz-boat',photoAlt:'一家人在 Akaroa 港灣出海的旅行畫面',checkin:30},
      {id:'akaroa-museum',name:'Akaroa Museum',heading:'Akaroa 海濱',area:'akaroa',time:'30～45 分鐘',duration:45,map:'Akaroa Museum 71 Rue Lavaud',photo:'nz-akaroa-museum',photoAlt:'Akaroa Museum 的模型船與展品',open:'10:30',seasonalClose:{winter:'16:00',summer:'16:30'},specialOpenDates:{'04-25':'13:00'},closedDates:['12-25']}
    ]
  },
  {
    id: 'mid-canterbury', island: 'south', label: 'Mid Canterbury', short: '四季玩法',
    route: '/trip/new-zealand/mid-canterbury/', manuscript: 'mid-canterbury-with-kids.md',
hero: 'nz-mid-canterbury-mt-hutt-ski-v1', heroAlt: '家人在 Mt Hutt 雪道上陪孩子練習滑雪', map: [43, 64], days: [2, 3],
    summary: 'Ashburton、Methven 與 Rakaia Gorge 分成城市、清晨與季節活動。',
    stops: [
      {id:'ashburton-museum',name:'Ashburton Museum',heading:'Ashburton Museum',area:'ashburton',time:'約 1 小時',duration:60,map:'Ashburton Museum 327 West Street',photo:null,open:'10:00',close:'16:00'},
      {id:'aviation-museum',name:'Ashburton Aviation Museum',heading:'Ashburton Aviation Museum',area:'ashburton',time:'約 1 小時',duration:60,map:'Ashburton Aviation Museum 387 Seafield Road',photo:null,open:'13:00',close:'15:00',specialOpen:{3:'09:30',6:'09:30'}},
      {id:'aero-club',name:'Mid Canterbury Aero Club',heading:'Mid Canterbury Aero Club',area:'ashburton',time:'依預訂產品',duration:120,map:'Mid Canterbury Aero Club 393 Seafield Road',photo:'nz-mid-canterbury-ashburton-plane-v1',photoAlt:'Ashburton 機場草地上的小飛機，非博物館預約地點',needsBooking:true},
      {id:'balloon',name:'Methven 熱氣球',heading:'Methven',area:'methven',time:'清晨場，依業者確認',duration:180,map:'Adventure Balloons Methven',photo:null,needsBooking:true},
      {id:'mt-hutt',name:'Mt Hutt 滑雪',heading:'Mt Hutt',area:'mthutt',time:'完整雪場日',duration:360,map:'Mt Hutt Ski Area',photo:'nz-mid-canterbury-mt-hutt-ski-v1',photoAlt:'家人在 Mt Hutt 雪道上陪孩子練習滑雪',seasonal:true},
      {id:'staveley',name:'Staveley Ice Rink',heading:'Staveley Ice Rink',area:'staveley',time:'依當季公告',duration:120,map:'Staveley Ice Rink 294 Flynns Road',photo:'nz-mid-canterbury-staveley-ice-v1',photoAlt:'孩子在 Staveley 歷史冰季的戶外冰場練習滑冰',seasonal:true,closedYear:2026},
      {id:'discovery-jet',name:'Discovery Jet',heading:'Rakaia Gorge',area:'rakaia',time:'依預訂場次',duration:120,map:'Discovery Jet Rakaia Gorge Bridge north side',photo:'nz-mid-canterbury-discovery-jet-v1',photoAlt:'家人穿救生衣坐在 Rakaia Gorge 地區的噴射快艇上',needsBooking:true}
    ]
  },
  {
    id: 'kaikoura', island: 'south', label: 'Kaikōura', short: '海岸與海狗',
    route: '/trip/new-zealand/kaikoura/', manuscript: 'kaikoura-with-kids.md',
    hero: 'nz-kaikoura-ohau-seals-v1', heroAlt: '凱庫拉 Ōhau Point 岩岸與潮水間聚集的海狗', map: [48, 55], days: [2, 3],
    summary: '從觀景平台看海狗；海上活動是另一次旅程。',
    stops: [
      {id:'ohau-point',name:'Ōhau Point 海狗觀景',heading:'Ōhau Point Lookout',area:'coast',time:'約 45 分鐘',duration:45,map:'Ohau Point Seal Colony Lookout',photo:'nz-kaikoura-ohau-seals-close-v1',photoAlt:'Ōhau Point 岩石上休息的海狗；請在觀景平台遠距觀看'},
      {id:'coastal-walk',name:'海岸散步',heading:'海岸散步',area:'coast',time:'約 1 小時',duration:60,map:'Kaikoura Peninsula Walkway',photo:null},
      {id:'seal-kayak',name:'海狗皮划艇',heading:'海狗皮划艇',area:'sea',time:'依預訂與海況',duration:180,map:'Kaikoura kayak tours',photo:null,needsBooking:true}
    ]
  },
  {
    id: 'otago', island: 'south', label: 'Oamaru、Moeraki、但尼丁', short: '東岸三站',
    route: '/trip/new-zealand/otago/', manuscript: 'dunedin-oamaru-moeraki-with-kids.md',
    hero: 'nz-oamaru-precinct', heroAlt: '一家人在 Oamaru 歷史街區漫步', map: [49, 78], days: [2, 3],
    summary: '歷史街區、圓石海岸到但尼丁；順路停靠仍要算移動。',
    stops: [
      {id:'oamaru',name:'Oamaru Victorian Precinct',heading:'Oamaru',area:'oamaru',time:'約 1 小時',duration:60,map:'Oamaru Victorian Precinct 2 Harbour Street',photo:'nz-oamaru-precinct',photoAlt:'一家人在 Oamaru 歷史街區漫步'},
      {id:'moeraki',name:'Moeraki Boulders',heading:'Moeraki Boulders',area:'moeraki',time:'約 1 小時',duration:60,map:'Moeraki Boulders',photo:'nz-moeraki-boulders',photoAlt:'Moeraki 圓石海灘'},
      {id:'otago-museum',name:'Otago Museum',heading:'Otago Museum',area:'dunedin',time:'約 2 小時',duration:120,map:'Otago Museum Dunedin',photo:null,open:'10:00',close:'17:00'},
      {id:'baldwin',name:'Baldwin Street',heading:'Baldwin Street',area:'dunedin',time:'30～45 分鐘',duration:45,map:'Baldwin Street Dunedin',photo:'nz-baldwin-street',photoAlt:'一家人在 Baldwin Street 的陡坡前'},
      {id:'sandfly',name:'Sandfly Bay',heading:'Sandfly Bay',area:'dunedin',time:'依步道選擇',duration:90,map:'Sandfly Bay Track Dunedin',photo:'nz-sandfly-bay',photoAlt:'一家人在 Sandfly Bay 沙灘'}
    ]
  },
  {
    id: 'queenstown-arrowtown', island: 'south', label: '皇后鎮與箭鎮', short: '湖畔與淘金',
    route: '/trip/new-zealand/queenstown-arrowtown/', manuscript: 'queenstown-arrowtown-with-kids.md',
    hero: 'nz-queenstown-lake', heroAlt: '皇后鎮湖畔散步的旅行畫格', map: [35, 82], days: [2, 3],
    summary: '滑車、蒸汽船與農場分開選；箭鎮留一段走路時間。',
    stops: [
      {id:'skyline',name:'Queenstown Skyline／Luge',heading:'Skyline 與 Luge',area:'queenstown',time:'約半天',duration:180,map:'Skyline Queenstown',photo:'nz-queenstown-skyline-luge-v1',photoAlt:'從高處看 Queenstown Skyline 滑坡車彎道與車輛'},
      {id:'earnslaw',name:'TSS Earnslaw／Walter Peak',heading:'TSS Earnslaw',area:'queenstown',time:'依船班與產品',duration:180,map:'TSS Earnslaw Queenstown',photo:'nz-queenstown-earnslaw-v1',photoAlt:'家人在 TSS Earnslaw 蒸汽船甲板上，後方可見煙囪與瓦卡蒂普湖；非 Walter Peak 農場畫面',needsBooking:true},
      {id:'lakefront',name:'Queenstown 湖畔',heading:'湖畔與 Fergburger',area:'queenstown',time:'約 1 小時',duration:60,map:'Queenstown Bay Beach',photo:'nz-queenstown-lake',photoAlt:'皇后鎮湖畔散步的旅行畫格'},
      {id:'arrowtown',name:'Arrowtown 淘金街區',heading:'箭鎮',area:'arrowtown',time:'約半天',duration:150,map:'Arrowtown New Zealand',photo:'nz-arrowtown-street-v1',photoAlt:'Arrowtown 秋葉下的街道、低矮店屋與行人'}
    ]
  },
  {
    id: 'wanaka-tekapo', island: 'south', label: 'Cardrona、Wānaka、Tekapo', short: '湖區移動日',
    route: '/trip/new-zealand/wanaka-tekapo/', manuscript: 'wanaka-tekapo-cardrona.md',
    hero: 'nz-tekapo-lake', heroAlt: 'Lake Tekapo 湖畔的家庭旅行畫面', map: [40, 72], days: [2, 3],
    summary: 'Cardrona 可停、Wānaka 可住、Tekapo 另留抵達與看湖時間。',
    stops: [
      {id:'cardrona',name:'Cardrona／Bradrona',heading:'Cardrona',area:'cardrona',time:'短停約 30 分鐘',duration:30,map:'Bradrona Cardrona',photo:'nz-cardrona',photoAlt:'Cardrona 山谷旅行畫面'},
      {id:'wanaka-lake',name:'Wānaka 湖畔',heading:'Wānaka 湖畔',area:'wanaka',time:'約 1 小時',duration:60,map:'Lake Wanaka waterfront',photo:'nz-wanaka-tree',photoAlt:'一家人在 Wānaka 湖畔的樹旁'},
      {id:'wanaka-tree',name:'That Wānaka Tree',heading:'That Wānaka Tree',area:'wanaka',time:'約 1 小時',duration:60,map:'That Wanaka Tree',photo:'nz-wanaka-tree',photoAlt:'一家人在 Wānaka 湖畔的樹旁'},
      {id:'tekapo-lake',name:'Lake Tekapo',heading:'Lake Tekapo',area:'tekapo',time:'約 1 小時',duration:60,map:'Lake Tekapo New Zealand',photo:'nz-tekapo-lake',photoAlt:'Lake Tekapo 湖畔的家庭旅行畫面'},
      {id:'church',name:'好牧羊人教堂',heading:'Lake Tekapo 與好牧羊人教堂',area:'tekapo',time:'約 30 分鐘',duration:30,map:'Church of the Good Shepherd Lake Tekapo',photo:'nz-tekapo-church',photoAlt:'一家人在好牧羊人教堂前'}
    ]
  }
];

export const byId = Object.fromEntries(regions.map(region => [region.id, region]));
export const byRoute = Object.fromEntries(regions.map(region => [region.route, region]));

const areaNames = {
  'north-island': {auckland:'奧克蘭',rotorua:'Rotorua',matamata:'Matamata',hamilton:'Hamilton'},
  wellington: {harbour:'海港與博物館',zoo:'動物園周邊',central:'市中心'},
  'christchurch-akaroa': {christchurch:'基督城市區',akaroa:'Akaroa 海灣'},
  'mid-canterbury': {ashburton:'Ashburton',methven:'Methven',mthutt:'Mt Hutt',staveley:'Staveley',rakaia:'Rakaia Gorge'},
  kaikoura: {coast:'Kaikōura 海岸',sea:'海上活動'},
  otago: {oamaru:'Oamaru',moeraki:'Moeraki',dunedin:'但尼丁'},
  'queenstown-arrowtown': {queenstown:'皇后鎮',arrowtown:'箭鎮'},
  'wanaka-tekapo': {cardrona:'Cardrona',wanaka:'Wānaka',tekapo:'Tekapo'}
};
export const areaLabel = (regionId,area) => areaNames[regionId]?.[area] ?? byId[regionId]?.label ?? '本區';
