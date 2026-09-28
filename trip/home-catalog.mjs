// Homepage discovery data. Existing destination guides remain the content authority.
// Add a country and its guides here; renderer and filter UI do not branch on country IDs.
// Image sources are documented in trip/assets/*-media.json. Reuse the same image
// record wherever a cover is shared, so cards and responsive markup stay in sync.
const images = {
  thailand: {src:'/trip/assets/cm-thai-dress-family.webp',alt:'一家四口穿著泰服，站在清邁塔佩門的紅磚城牆前合照',width:1280,height:853,position:'50% 62%'},
  newZealand: {src:'/trip/assets/nz-wanaka-tree.webp',alt:'一家人在 Wānaka 湖畔合照，後方是湖中樹與群山',width:1440,height:960,position:'50% 60%'},
  bangkok: {src:'/trip/assets/bkk-bangkok-family.webp',alt:'鷹式一家五人帶著推車，在曼谷的商店步道合照',width:1024,height:1280,position:'50% 62%'},
  chiangRai: {src:'/trip/assets/cr-white-temple.webp',alt:'一家四口在清萊白廟 Wat Rong Khun 前合照',width:960,height:1200,position:'50% 58%'},
  queenstown: {src:'/trip/assets/nz-queenstown-lake.webp',alt:'孩子與家人在皇后鎮湖邊玩耍，後方可見碼頭與船隻',width:1440,height:810},
  christchurch: {src:'/trip/assets/nz-christchurch-tram.webp',alt:'一家人在基督城復古電車前合照',width:1440,height:961},
  northIsland: {src:'/trip/assets/nz-rotorua-luge.webp',alt:'Rotorua Skyline 園區搭乘纜椅的旅行畫格',width:1440,height:810},
  wellington: {src:'/trip/assets/nz-wellington-harbour.webp',alt:'威靈頓海港的旅行畫格',width:1440,height:810},
  midCanterbury: {src:'/trip/assets/nz-mid-canterbury-mt-hutt-ski-v1.webp',alt:'家人在 Mt Hutt 雪道上陪孩子練習滑雪',width:1280,height:720},
  kaikoura: {src:'/trip/assets/nz-kaikoura-ohau-seals-v1.webp',alt:'凱庫拉 Ōhau Point 岩岸與潮水間聚集的海狗',width:1280,height:635},
  otago: {src:'/trip/assets/nz-oamaru-precinct.webp',alt:'一家人在 Oamaru 維多利亞歷史街區漫步',width:1440,height:959},
};

export const travelHomeCatalog = {
  hero: {
    eyebrow: 'EAGLISH FAMILY TRAVEL',
    title: '下一趟，想一起去哪裡？',
    description: '從我們走過的城市、山湖與海岸，找到一家人想玩的地方。先選目的地，再把喜歡的景點排進旅程。',
  },
  themes: [
    {id:'nature',label:'山湖與海岸',description:'沿著湖畔、山景與海岸，找一段親近自然的旅程。'},
    {id:'animals',label:'動物與農場',description:'從海岸觀察到農場參訪，找到孩子感興趣的活動。'},
    {id:'city',label:'城市與文化',description:'走進街區、博物館與特色建築，慢慢認識一座城市。'},
    {id:'food',label:'市集與美食',description:'從市集、小店到湖畔用餐，安排旅途中的一餐。'},
  ],
  countries: [
    {
      id:'thailand',name:'泰國',englishName:'Thailand',href:'/trip/thailand/',
      region:'asia',regionLabel:'亞洲',geography:{point:[100.5,15],isoNumeric:'764'},
      summary:'從曼谷的運河與市集，到清邁古城、清萊花園，挑一座城市開始。',
      image:images.thailand,
      guideIds:['bangkok','chiang-mai','chiang-rai'],
    },
    {
      id:'new-zealand',name:'紐西蘭',englishName:'New Zealand',href:'/trip/new-zealand/',
      region:'oceania',regionLabel:'大洋洲',geography:{point:[172.8,-43.2],isoNumeric:'554'},
      summary:'北島的城市與戶外活動，南島的湖泊、海岸與農場，先選一段喜歡的風景。',
      image:images.newZealand,
      guideIds:['north-island','wellington','christchurch-akaroa','mid-canterbury','kaikoura','otago','queenstown-arrowtown','wanaka-tekapo'],
    },
  ],
  // Curated discovery order balances countries. Country views use guideIds above.
  guides: [
    {
      id:'bangkok',countryId:'thailand',name:'曼谷',englishName:'Bangkok',href:'/trip/guides/bangkok-with-kids/',
      summary:'搭運河長尾船、逛市集，再選一段水族館與河畔活動。',
      image:images.bangkok,suitableFor:['city','food','animals'],
    },
    {
      id:'queenstown-arrowtown',countryId:'new-zealand',name:'皇后鎮與箭鎮',englishName:'Queenstown · Arrowtown',href:'/trip/new-zealand/queenstown-arrowtown/',
      summary:'在湖畔散步，搭蒸汽船、玩滑車，再去箭鎮走老街與淘金。',
      image:images.queenstown,suitableFor:['nature','city','food'],
    },
    {
      id:'chiang-mai',countryId:'thailand',name:'清邁',englishName:'Chiang Mai',href:'/trip/guides/chiang-mai-with-kids/',
      summary:'換上泰服走古城，逛市集、找咖啡廳，也留時間體驗造紙手作。',
      image:images.thailand,suitableFor:['city','food','animals'],
    },
    {
      id:'wanaka-tekapo',countryId:'new-zealand',name:'Wānaka、Tekapo 與 Cardrona',englishName:'Wānaka · Tekapo · Cardrona',href:'/trip/new-zealand/wanaka-tekapo/',
      summary:'沿途停看 Cardrona，走到 Wānaka 湖邊，再看 Tekapo 湖與好牧羊人教堂。',
      image:images.newZealand,suitableFor:['nature'],
    },
    {
      id:'chiang-rai',countryId:'thailand',name:'清萊',englishName:'Chiang Rai',href:'/trip/guides/chiang-rai-with-kids/',
      summary:'看白廟建築、走瀑布花園，到山景農場看羊，晚上再逛夜市。',
      image:images.chiangRai,suitableFor:['city','nature','animals','food'],
    },
    {
      id:'christchurch-akaroa',countryId:'new-zealand',name:'基督城與 Akaroa',englishName:'Christchurch · Akaroa',href:'/trip/new-zealand/christchurch/3-days/',
      summary:'搭復古電車探索市區，再到 Akaroa 看海灣、參訪羊駝農場或出海。',
      image:images.christchurch,suitableFor:['city','nature','animals'],
    },
    {
      id:'north-island',countryId:'new-zealand',name:'奧克蘭與北島自駕',englishName:'Auckland · Rotorua · Matamata · Hamilton',href:'/trip/new-zealand/north-island/',
      summary:'從奧克蘭觀景出發，按區域選 Rotorua 滑車、Hobbiton 與 Hamilton 動物園。',
      image:images.northIsland,suitableFor:['city','nature','animals'],
    },
    {
      id:'wellington',countryId:'new-zealand',name:'威靈頓',englishName:'Wellington',href:'/trip/new-zealand/wellington/',
      summary:'沿海港散步、逛周日市集，搭纜車，走進 Te Papa 與動物園。',
      image:images.wellington,suitableFor:['city','food','animals'],
    },
    {
      id:'mid-canterbury',countryId:'new-zealand',name:'Mid Canterbury',englishName:'Ashburton · Methven · Rakaia Gorge',href:'/trip/new-zealand/mid-canterbury/',
      summary:'從 Ashburton 的博物館，到 Methven、Mt Hutt 與 Rakaia Gorge，按季節挑玩法。',
      image:images.midCanterbury,suitableFor:['nature','city'],
    },
    {
      id:'kaikoura',countryId:'new-zealand',name:'凱庫拉',englishName:'Kaikōura',href:'/trip/new-zealand/kaikoura/',
      summary:'在岩岸看海狗、沿海岸散步，再依海況選擇皮划艇活動。',
      image:images.kaikoura,suitableFor:['nature','animals'],
    },
    {
      id:'otago',countryId:'new-zealand',name:'Otago 東岸',englishName:'Oamaru · Moeraki · Dunedin',href:'/trip/new-zealand/otago/',
      summary:'走 Oamaru 歷史街區、看 Moeraki 圓石，再到但尼丁逛博物館與海灣。',
      image:images.otago,suitableFor:['nature','city'],
    },
  ],
};
