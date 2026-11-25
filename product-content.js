/* Shared article/video contract. No Sheet writes, publishing or message sending. */
(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.ProductContent=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const catalog={
    janJulWinter:{facts:{price:'外套 NT$1,780 起、雪靴 NT$1,480 起',shipping:'本島單筆滿 NT$3,000 免運（未滿 NT$90）',delivery:'12 月上旬陸續出貨'},id:'jan-jul-winter',brands:['加拿大 Jan & Jul 秋冬保暖系列'],article:'/blog/jan-jul-winter/',title:'Jan & Jul 秋冬保暖怎麼挑？防水外套、刷毛褲、雪靴與手套，出國玩雪和台灣濕冷都好穿',readingTitle:'Jan & Jul 秋冬保暖怎麼挑？防水外套、刷毛褲、雪靴與手套，出國玩雪和台灣濕冷都好穿',coverAlt:'兩個孩子穿著 Jan & Jul 防水外套在海邊沙灘上走；下雨下雪照樣出門玩',excerpt:'過年去日本、韓國玩雪，或台灣冬天濕冷通勤：照用途整理 Jan & Jul 防水外套、刷毛褲、雪靴和手套怎麼配，附我們家兩兄弟的實拍。',category:'秋冬保暖',image:'/assets/jan-jul-winter/cover.webp',cardImage:'/assets/jan-jul/product-card.webp',published:'2026-11-22'},
    jowua:{id:'jowua',brands:['Jowua'],article:'/blog/jowua/',title:'Jowua 折扣碼 eagle 全館 95 折｜Tesla 車用配件怎麼挑、折扣碼怎麼用',readingTitle:'Jowua 折扣碼 eagle 全館 95 折｜Tesla 車用配件怎麼挑、折扣碼怎麼用',coverAlt:'Jowua 折扣碼 eagle 全館 95 折；Qi2 車架、掛鉤、螢幕保護貼與扶手箱收納',excerpt:'Jowua 折扣碼 eagle，台灣官網全館 95 折，從連結進入自動帶入。整理 Tesla Model 3／Y 新車常買的遮陽簾、腳踏墊、保護貼與 Qi2 車架，還有運費、退貨與保固。',category:'車用配件',image:'/assets/jowua/cover.webp',cardImage:'/assets/jowua/product-card.webp',published:'2026-11-16'},
    brushBaby:{id:'brush-baby',brands:['Brush Baby 兒童電動牙刷'],article:'/blog/brush-baby/',title:'孩子不愛刷牙怎麼辦？Brush Baby 從嬰兒潔牙棉巾到兒童電動牙刷，依年齡挑',readingTitle:'孩子不愛刷牙怎麼辦？Brush Baby 從嬰兒潔牙棉巾到兒童電動牙刷，依年齡挑',coverAlt:'在恩與在熙小時候坐在沙發上拿著 Brush Baby 電動牙刷；刷牙變成好玩的事',excerpt:'孩子不愛刷牙？先讓刷牙變好玩。照年齡整理 Brush Baby 潔牙棉巾、嬰兒牙刷到 3 歲以上電動牙刷怎麼挑，附我們家兩兄弟小時候的實際用法。',category:'口腔清潔',image:'/assets/brush-baby/cover.webp',cardImage:'/assets/brush-baby/product-card.webp',published:'2026-11-13'},
    acerLuggage:{id:'acer-luggage',brands:['acer 前開式行李箱'],article:'/blog/acer-luggage/',title:'acer 前開式行李箱怎麼選？哥本哈根 20、25、28 吋尺寸、容量與全家搭法',readingTitle:'acer 前開式行李箱怎麼選？哥本哈根 20、25、28 吋尺寸、容量與團購價',coverAlt:'acer 哥本哈根前開式行李箱五色；尺寸與團購價選購筆記',excerpt:'acer 哥本哈根前開式行李箱 20 吋登機、25／28 吋託運：整理三種尺寸的長寬高、容量、重量和五種顏色，以及親子出國、過年返鄉怎麼搭。',category:'旅行選物',image:'/assets/acer-luggage/cover.webp',cardImage:'/assets/acer-luggage/product-card.webp',published:'2026-11-10'},
    ilovekidsBookcase:{facts:{price:'旋轉書櫃一組 NT$6,199（原價 NT$9,999）',shipping:'本島滿 NT$2,399 免運，單買書櫃就過門檻',delivery:'11/30 起陸續出貨'},id:'ilovekids-rotating-bookcase',brands:['愛兒館 旋轉書櫃'],article:'/blog/ilovekids-rotating-bookcase/',title:'愛兒館旋轉書櫃好用嗎？小房間收繪本，孩子自己拿、自己放回去',readingTitle:'愛兒館旋轉書櫃好用嗎？小房間收繪本，孩子自己拿、自己放回去',coverAlt:'孩子站在愛兒館旋轉書櫃旁拿繪本；愛兒館旋轉書櫃使用心得',excerpt:'孩子房間不到 2 坪，長型書架讓書東倒西歪。我們 2023 年開始用愛兒館旋轉書櫃：佔地小、每格不深孩子好拿放，也整理了 DIY 組裝和退貨前要知道的事。',category:'兒童閱讀收納',image:'/assets/ilovekids-rotating-bookcase/cover.webp',cardImage:'/assets/ilovekids-rotating-bookcase/product-card.webp',published:'2026-11-10'},
    kidsActiveToys:{id:'kids-active-toys',brands:['兒童放電神器'],article:'/blog/kids-active-toys/',title:'兒童放電神器怎麼選？平衡車、扭扭車、Vespa 電動車、滑板車與彈跳床，依年齡和場地挑',readingTitle:'兒童放電神器怎麼選？平衡車、扭扭車、Vespa 電動車、滑板車與彈跳床，依年齡和場地挑',coverAlt:'兩個孩子坐在 Vespa 兒童電動車旁；兒童放電神器選購筆記',excerpt:'平衡車、扭扭車、Vespa 電動車、滑板車和彈跳床，先看孩子年齡和常去的場地：公園玩哪幾樣、下雨天在家玩哪幾樣，用鷹家實拍整理五樣怎麼挑。',category:'親子放電',image:'/assets/kids-active-toys/cover.webp',cardImage:'/assets/kids-active-toys/product-card.webp',published:'2026-11-10'},
    momaxLocator:{facts:{price:'單入 NT$699、2 入 NT$1,360、四色 NT$2,600',shipping:'超商滿 NT$699、宅配滿 NT$1,200 免運',delivery:'下單後 5 個工作天內寄出'},id:'momax-locator',brands:['Momax 定位器 X 鷹式一家','Momax 定位器','Momax','MOMAX 定位器','Momax 定位器 x 鷹式一家'],article:'/blog/momax-locator/',title:'Momax 定位器怎麼選？Metro Poppies 聯名雙系統款，iPhone、Android 都能用',readingTitle:'Momax 定位器怎麼選？Metro Poppies 聯名雙系統款，iPhone、Android 都能用',coverAlt:'Momax Metro Poppies 聯名四色絨毛定位器；iPhone、Android 都能用的防丟選購筆記',excerpt:'家裡手機有 iPhone 也有 Android？Momax Metro Poppies 聯名雙系統定位器兩種都能設定，但使用時只能擇一系統。整理它怎麼找東西、掛在哪裡最有用，以及團購價與免運門檻。',category:'生活防丟',image:'/assets/momax-locator/cover.webp',cardImage:'/assets/momax-locator/product-card.webp',published:'2026-11-10'},
    zoofamilyKidsCamera:{id:'zoofamily-kids-camera',brands:['比利時 ZooFamily 兒童相機'],article:'/blog/zoofamily-kids-camera/',title:'ZooFamily 兒童相機怎麼選？四款功能、年齡與價格比較',readingTitle:'ZooFamily 兒童相機怎麼選？四款功能、年齡與價格比較',coverAlt:'ZooFamily 兒童相機，四款怎麼選',excerpt:'ZooFamily 兒童相機怎麼選？比較 ZooFriends、UrbanZoo、ZooPrint、ZooVideo 的適用年齡、觸控操作、黑白列印與自拍錄影，也說清楚實際感光畫素與軟體插值，依孩子的玩法縮小選擇。',category:'親子探索',image:'/assets/zoofamily-kids-camera/cover.webp',cardImage:'/assets/zoofamily-kids-camera/product-card.webp',published:'2026-11-06'},
    bernie:{id:'bernie',brands:['伯尼寢具'],article:'/blog/bernie/',title:'伯尼寢具選物指南：天絲床包、舒芙水洗被怎麼挑？',readingTitle:'伯尼寢具選物指南：天絲床包、舒芙水洗被怎麼挑？',coverAlt:'媽媽和兩個孩子在白底彩色點點的被面上共讀繪本，旁有伯尼寢具標題',excerpt:'伯尼寢具選物指南：用家庭實拍看白底點點和米色床面，比較舒芙水洗被、單件兩用被、無被套床包枕套組與完整床組，再按床墊高度、換洗習慣及現貨預購挑選。',category:'居家選物',image:'/assets/bernie/cover.webp',cardImage:'/assets/bernie/product-card.webp',published:'2026-11-06'},
    sanfufarm:{id:'sanfufarm',brands:['三富休閒農場'],article:'/blog/sanfufarm/',title:'三富休閒農場房型怎麼選？森林館、紫屋與欒樹館比較',excerpt:'依人數、孩子年齡與是否帶狗，比較森林館、紫屋與欒樹館，並整理早餐、下午茶、DIY 與夜間導覽的份數。',category:'親子旅行',image:'/assets/sanfufarm/cover.webp',published:'2026-10-23'},
    doneByDeer:{id:'done-by-deer',brands:['丹麥 Done by deer兒童用品'],article:'/blog/done-by-deer/',title:'Done by deer 兒童餐具怎麼選？餐盤、水壺、便當盒依年齡分，加彌月送禮清單',readingTitle:'Done by deer 兒童餐具怎麼選？餐盤、水壺、便當盒依年齡分，加彌月送禮清單',coverAlt:'Done by deer 餐盤、水壺與禮盒的真實商品圖與選購主題',excerpt:'依孩子階段和用途比較 Done by deer 餐盤、水壺、便當盒與禮盒。',category:'親子餐桌',image:'/assets/done-by-deer/cover.webp',cardImage:'/assets/done-by-deer/product-card.webp',published:'2026-10-22'},
    blackmores:{id:'blackmores',brands:['澳佳寶保健食品'],article:'/blog/blackmores/',title:'澳佳寶保健食品｜5款魚油、葉黃素與乳酸菌比較',readingTitle:'澳佳寶保健食品｜5款魚油、葉黃素與乳酸菌比較',coverAlt:'澳佳寶機伶小子魚油、兒童葉黃素與LC-Plasma乳酸菌盒裝，置於淺色展示台',excerpt:'機伶小子與迷你魚油、兒童與成人葉黃素，以及LC-Plasma乳酸菌；比較五款的吃法、成分標示與適用條件。',category:'家庭營養',image:'/assets/blackmores/cover-v2.webp',cardImage:'/assets/blackmores/product-card-v2.webp',published:'2026-10-19'},
    parakito:{id:'parakito',brands:['法國帕洛防蚊液'],article:'/blog/parakito/',title:'Para’Kito 防蚊液怎麼選？噴霧、滾珠與防蚊手環比較',readingTitle:'Para’Kito 防蚊用品｜四款配方與使用形式',coverAlt:'鷹式一家四人在戶外拿著 Para’Kito 防蚊用品',excerpt:'噴霧、滾珠、手環怎麼挑？比較四款配方、使用方式與補充片，搭配我們的戶外影片和照片。',category:'親子戶外',image:'/assets/parakito/cover.webp',published:'2026-10-15'},
    knsh:{id:'knsh',brands:['康軒雜誌'],article:'/blog/knsh/',title:'康軒學習雜誌怎麼選？學前、初階、進階版比較',excerpt:'年齡、注音、刊期與年費一次比較，搭配雜誌介紹影片、孩子共讀照片與各版試閱。',description:'學前版陪孩子看圖共讀、初階版有注音、進階版無注音；從閱讀程度挑選適合的版本。',details:'康軒學習雜誌｜三個版本怎麼選？\n學前版：2–6 歲，親子共讀；月刊，一年 12 期，NT$6,480／年。\n初階版：6–10 歲，有注音；半月刊，一年 24 期，NT$7,920／年。\n進階版：10–12 歲以上，無注音；半月刊，一年 24 期，NT$7,920／年。\n年齡供參考，建議搭配試閱與孩子的閱讀程度選擇。完整比較、共讀照片、雜誌介紹影片及試閱入口，請見「閱讀文章」。訂閱禮與當期組合以團購頁為準。',category:'親子共讀',image:'/assets/knsh/cover.webp',cardImage:'/assets/knsh/product-card.webp',published:'2026-10-13'},
    locknlock:{id:'locknlock',brands:['樂扣樂扣'],article:'/blog/locknlock/',title:'樂扣樂扣水壺怎麼選？兒童水壺、吸管杯與容量比較',excerpt:'孩子自己帶水、大人外帶飲料、長時間補水，從喝法、容量到每天的拆洗。',category:'生活補水',image:'/assets/locknlock/cover.webp',cardImage:'/assets/locknlock/product-card.webp',published:'2026-10-08'},
    shinwaLiving:{id:'shinwa-living',brands:['心窪生活'],article:'/blog/shinwa-living/',title:'心窪生活手工木作推薦｜台灣檜木積木、兒童桌椅與木製禮物',readingTitle:'心窪生活木作｜積木、兒童桌椅與禮物',coverAlt:'心窪生活木作：積木、兒童桌椅與木製禮物',excerpt:'陪孩子做木車，也從積木、桌椅、遊戲桌面與紀念禮物，看看手作怎麼走進每天的生活。',category:'家的模樣',image:'/assets/shinwa-living/cover.webp',cardImage:'/assets/shinwa-living/product-card.webp',published:'2026-10-14'},
    leofoo:{id:'leofoo',brands:['六福莊飯店','六福莊住宿 A｜樂園無限玩','六福莊住宿 B｜經典探險','六福莊住宿 C｜FUN肆玩樂季'],planBrands:{A:'六福莊住宿 A｜樂園無限玩',B:'六福莊住宿 B｜經典探險',C:'六福莊住宿 C｜FUN肆玩樂季'},article:'/blog/leofoo/',title:'六福莊房型怎麼選？剛果、肯亞與三種住宿方案',excerpt:'先按人數、樓梯與動物景觀選房，再比較一晚或兩晚、動物體驗、晚餐和第四位同行者的安排。',category:'親子旅行',image:'/assets/leofoo/cover.webp',cardImage:'/assets/leofoo/product-card.webp',published:'2026-10-02'},
    branden:{id:'branden',brands:['Branden 壓縮袋'],article:'/blog/branden/',title:'旅行壓縮袋好用嗎？BRANDEN 二代與 Lite 怎麼選',excerpt:'從真實打包影片看拉鍊式壓縮袋，再按袋身、重量、開口與尺寸挑選。',category:'旅行收納',image:'/assets/branden/cover.webp',cardImage:'/assets/branden/product-card.webp',published:'2026-09-24'},
    lange:{id:'lange',brands:["L'Ange 棉之境"],article:'/blog/lange/',title:'紗布巾｜全家日用和旅行，尺寸怎麼挑？',excerpt:'洗臉、拍嗝、擦髮、洗澡和旅行自帶浴巾，先看尺寸，再照家裡的換洗習慣估數量。',category:'居家生活',image:'/assets/lange/cover.webp',published:'2026-09-17'},
    shoumaji:{id:'shoumaji',brands:['收麻吉手捲收納袋'],article:'/blog/shoumaji/',title:'收麻吉手捲壓縮袋｜旅行怎麼挑尺寸與袋數？',excerpt:'用天數、人數與衣物厚度先算 XS、S、M 袋數，再看真實影片的收納前後與手捲步驟。',category:'旅行收納',image:'/assets/shoumaji/cover.webp',published:'2026-09-17'},
    miamily:{id:'miamily',brands:['瑞士 Miamily'],article:'/blog/miamily/',title:'MiaMily｜孩子走累了，旅行還可以慢慢走。',excerpt:'六張旅行實拍，看看孩子乘坐、載大包的日常，以及前開與對開兩代的收納取捨。',category:'親子旅行',image:'/assets/miamily/cover.webp',published:'2026-09-16'},
    caesarKenting:{id:'caesar-kenting',brands:['墾丁凱撒大飯店'],article:'/blog/caesar-kenting/',title:'墾丁凱撒大飯店｜先選對房，再把假期留給一家人。',excerpt:'五種房型實景、我們的旅行影片與家庭費用試算，從選房到一泊二食，把訂房前的問題看清楚。',category:'親子旅行',image:'/assets/caesar-kenting/journal/cover-title-v2.webp',cardImage:'/assets/caesar-kenting/product-card.webp',published:'2026-09-13'},
    fushan:{id:'fushan-gifts',brands:['富山私房菜｜常溫品','鷹式一家 × 富山私房菜（常溫品）'],article:'/blog/fushan-gifts/',title:'送禮之前，先想起那個人。',excerpt:'原味、香辣牛肉乾、蜜香紅茶與禮盒空盒，先挑口味，再裝一份心意。',category:'餐桌與送禮',image:'/assets/fushan/cover.webp',cardImage:'/assets/fushan/product-card.webp',published:'2026-09-12',videoPolicy:'none'},
    kidsread:{id:'kidsread',brands:['Kidsread 點讀筆'],article:null,contentUrl:'/blog/kidsread/',title:'KidsRead 點讀筆',excerpt:'錄音點讀筆與中英文點讀教材：自然發音、英文繪本、注音、知識立體書，依孩子年齡挑。',category:'親子學習',image:'/assets/kidsread/covers/hub.webp',cardImage:'/assets/kidsread/covers/hub.webp',published:'2026-11-23'},
    fushanFrozen:{id:'fushan-frozen',brands:['富山私房菜｜冷凍品'],article:null,title:'富山私房菜冷凍團',excerpt:'蒲燒鰻、白燒鰻、一口吃烏魚子與冷凍料理，中秋送禮與家常加菜都方便。',category:'餐桌與送禮',image:'/assets/fushan-frozen/product-card.webp',cardImage:'/assets/fushan-frozen/product-card.webp',published:'2026-09-17'},
    kietla:{id:'kietla-kids-sunglasses',brands:['法國 Ki ET LA 兒童太陽眼鏡｜墨鏡'],ignoreExplicitlyClosedHistory:true,videoPolicy:'none',article:'/blog/kietla-kids-sunglasses/',title:'小小的臉，也有自己的風格。',excerpt:'從 0–1 歲到大童，配戴照片、框型圖鑑與護眼圖解，找到孩子願意戴的那一副。',category:'和孩子一起出門',image:'/assets/kietla/cover-style-v2.webp',published:'2026-09-11'},
    playzu:{id:'playzu',brands:['Playzu'],article:'/blog/playzu/',title:'Playzu 摩洛哥地墊｜兩款灰色怎麼挑？',excerpt:'濛霧之影、鹽梅之寄：一組 6 片、鋪好 124×183 公分，先量空間再挑深淺。',category:'家的模樣',image:'/assets/playzu/cover.webp',published:'2026-09-11'},
    hereu:{id:'hereu-tag',brands:['hereu 智慧定位器'],article:'/blog/hereu-tag/',title:'出門前，少找一輪。',excerpt:'從 iPhone 設定到鑰匙、行李的找回方法，替常找不到的東西留一個線索。',category:'旅行與日常',image:'/assets/hereu-tag/cover.webp',published:'2026-09-11'},
    mitoy:{id:'mitoy-rice-blocks',brands:["MiToy米積木"],article:'/blog/mitoy-rice-blocks/',title:"同一盒積木，每天都有新的樣子。",excerpt:"從在恩、在熙的遊戲時光，看看 25 顆、50 顆與主題組怎麼選。",category:"孩子的遊戲時光",image:'/assets/mitoy-rice-blocks/play.webp',published:'2026-09-10'},
    chuluAomori:{id:'chulu-aomori-drinks',brands:["台東初鹿&青森蘋果汁"],article:'/blog/chulu-aomori-drinks/',title:"早餐的那一杯，留給家人喜歡的味道。",excerpt:"原味、可可、伯爵、黑豆芝麻與蘋果香，從家人的飲用習慣慢慢挑。",category:"餐桌上的日常",image:'/assets/chulu-aomori-drinks/flavored.webp',published:'2026-09-10'},
    atojet:{id:'atojet-home-shower',brands:['Atojet 濾芯蓮蓬頭'],article:'/blog/atojet/',title:'洗澡的水，看起來很乾淨。直到我們拆開了濾芯。',excerpt:'一段真實的換芯紀錄，一點關於浴室日常用水的留意。',category:'居家生活',image:'/assets/atojet/vendor-shower.webp',published:'2026-09-08'},
    wave:{id:'wave-hummus',brands:['Wave 鷹嘴豆泥'],article:'/blog/wave-hummus/',title:'Wave 鷹嘴豆泥怎麼吃？直接吃、沾蔬菜、配烤肉',excerpt:'Wave 鷹嘴豆泥怎麼吃？解凍拌勻就能直接吃，也能沾蔬菜、配烤肉、加進沙拉與捲餅；認識經典款與香料烤蔬菜即食盒，整理份量與保存重點。',category:'餐桌日常',image:'/assets/wave/cover.webp',cardImage:'/assets/wave/product-card.webp',published:'2026-09-08'},
    eben:{id:'eben-kombucha',brands:['EBEN康普茶'],article:'/blog/eben-kombucha/',title:'第一次喝康普茶？EBEN 生康普茶這樣挑才對味',excerpt:'從茶香與果香挑口味，搭配商品圖、家人試喝、微量酒精與冷藏說明，再選適合的團購組合。',category:'餐桌飲品',image:'/assets/eben/blog-cover.webp',cardImage:'/assets/eben/cover.webp',published:'2026-09-29'},
    artisanCb301:{id:'artisan-cb301',brands:['ARTISAN浴室清潔＆小腿按摩器'],article:'/blog/artisan-cb301/',title:'浴室真正難刷的，通常不是最髒的那一塊。',excerpt:'高處、角落和總要彎下腰的地方，才是讓人一拖再拖的原因。',category:'居家清潔',image:'/assets/artisan-cb301/blog-cover-v2.webp',published:'2026-09-08',videoPolicy:'none'},
    meroware:{id:'meroware-parenting',brands:['Meroware 美學育兒用品'],article:'/blog/meroware/',title:'從第一口，到自己吃。',excerpt:'在恩、在熙到舟夏，幾件陪我們家走過不同用餐階段的餐桌小物。',category:'親子餐桌',image:'/assets/meroware/blog-cover-v1.webp',published:'2026-09-09'}
  };
  const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function safeUrl(value){try{const u=new URL(String(value).trim());return ['https:','http:'].includes(u.protocol)&&!u.username&&!u.password?u.href:'';}catch{return '';}}
  function withUTM(value,brand){const safe=safeUrl(value);if(!safe)return '';const u=new URL(safe);if(!u.searchParams.has('utm_source')){u.searchParams.set('utm_source','eaglish');u.searchParams.set('utm_medium','groupbuy');if(brand)u.searchParams.set('utm_campaign',brand);}return u.href;}
  function videoId(url){try{const u=new URL(url);if(u.hostname==='youtu.be')return /^[\w-]{11}$/.test(u.pathname.slice(1))?u.pathname.slice(1):'';if(['youtube.com','www.youtube.com','m.youtube.com','www.youtube-nocookie.com'].includes(u.hostname)){const id=u.searchParams.get('v')||u.pathname.split('/')[2]||'';return /^[\w-]{11}$/.test(id)?id:'';}}catch{}return '';}
  function instagramEmbed(url){try{const u=new URL(url);if(!['instagram.com','www.instagram.com'].includes(u.hostname))return '';const match=u.pathname.match(/^\/(reel|reels|p)\/([\w-]+)\/?/);if(!match)return '';const kind=match[1]==='reels'?'reel':match[1];return `https://www.instagram.com/${kind}/${match[2]}/embed/`;}catch{return '';}}
  function youtubeStart(url){try{const u=new URL(url),raw=u.searchParams.get('start')||u.searchParams.get('t')||'';if(!raw)return 0;const match=raw.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);const seconds=/^\d+$/.test(raw)?Number(raw):match?Number(match[1]||0)*3600+Number(match[2]||0)*60+Number(match[3]||0):0;return Number.isSafeInteger(seconds)&&seconds>0&&seconds<=86400?seconds:0;}catch{return 0;}}
  function videos(input){
    let list=input;if(typeof list==='string'){try{list=JSON.parse(list);}catch{list=list.split(/\r?\n/);}}if(!Array.isArray(list))list=list?[list]:[];
    const seen=new Set();return list.flatMap((v)=>{if(typeof v==='string'){const i=v.indexOf('|');v=i<0?{url:v}:{title:v.slice(0,i).trim(),url:v.slice(i+1).trim()};}if(!v||typeof v!=='object')return [];const url=safeUrl(v.url),id=videoId(url),instagram=instagramEmbed(url),key=id||instagram||url;if(!url||seen.has(key))return [];seen.add(key);const start=youtubeStart(url),youtube=id?`https://www.youtube-nocookie.com/embed/${id}${start?'?start='+start:''}`:'';return [{url,title:String(v.title||`影片 ${seen.size}`),type:String(v.type||'其他'),youtubeId:id,embedUrl:youtube||instagram,embedType:youtube?'youtube':instagram?'instagram':'external',vertical:Boolean(instagram||/\/shorts\//.test(new URL(url).pathname))}];});
  }
  function fromRow(row){if(entry(row['品牌'])?.videoPolicy==='none')return [];return videos([...(videos(row['影片清單']||row['Videos']||'')),...(videos(row['影片網址']||row.Video||row.VideoURL||''))]);}
  function sheetRows(data){const headers=(data[0]||[]).map(x=>String(x).trim());for(const h of ['品牌','連結','類型','開團日期','結束日期'])if(headers.filter(x=>x===h).length!==1)throw Error('Unexpected Sheet headers');return data.slice(1).map(row=>Object.fromEntries(headers.flatMap((h,i)=>h?[[h,row[i]||'']]:[])));}
  function entry(brand){return Object.values(catalog).find(x=>x.brands.some(b=>b.toLowerCase()===String(brand).trim().toLowerCase()));}
  function readingLinks(g){const own=entry(g.brand);if(own?.article)return [{title:'閱讀文章',url:own.article}];const used=new Set();return [{title:'原始網誌',url:g.blogUrl},{title:'商品介紹',url:g.googleDoc}].filter(x=>{x.url=safeUrl(x.url);if(!x.url||used.has(x.url))return false;used.add(x.url);return true;});}
  function readingButton(g){const links=readingLinks(g);if(!links.length)return '';if(entry(g.brand)?.article)return `<div class="mb-3"><a class="card-secondary-btn" href="${escape(links[0].url)}">閱讀文章</a></div>`;return `<div class="mb-3"><button class="card-secondary-btn" data-reading-brand="${escape(g.brand)}">閱讀文章</button></div>`;}
  function videoButton(g){if(entry(g.brand)?.videoPolicy==='none')return '';const list=videos(g.videos||g.video);return list.length?`<div class="mb-3"><button class="card-secondary-btn" data-video-brand="${escape(g.brand)}">觀看影片${list.length>1?`（${list.length}）`:''}</button></div>`:'';}
  function today(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
  function date(value){const m=String(value||'').trim().match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);if(!m)return '';const s=`${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`;const d=new Date(s+'T00:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===s?s:'';}
  function rowForArticle(rows,key){
    const item=catalog[key];if(!item)return null;
    let matches=rows.filter(r=>entry(r['品牌']||'')?.id===item.id);
    // Opt-in only for verified brands with separate, explicitly closed historical rows.
    // Ambiguous current rows still fail closed, regardless of date or URL.
    if(item.ignoreExplicitlyClosedHistory){const current=matches.filter(r=>!/結團|已結束|closed|ended/i.test(String(r['類型']||'')));if(current.length)matches=current;}
    return matches.length===1?matches[0]:null;
  }
  function campaignFor(rows,key,now=today()){
    const item=catalog[key];
    if(!item)return {state:'unavailable',label:'目前無法確認團購狀態'};
    if(item.planBrands){
      const plans=Object.fromEntries(Object.entries(item.planBrands).map(([code,brand])=>{
        const matches=rows.filter(r=>String(r['品牌']||'').trim()===brand);
        const row=matches.length===1?matches[0]:null;
        const expectedUrl={A:'https://pse.is/9p7sug',B:'https://pse.is/9p7svd',C:'https://pse.is/9p7svv'}[code];
        // Hiram confirmed one campaign cutoff for all three booking links.
        const expectedEnd='2026-10-07';
        const verified=row && row['連結']===expectedUrl && date(row['開團日期'])==='2026-10-02' && date(row['結束日期'])===expectedEnd;
        return [code,campaignRow(verified?row:null,now)];
      }));
      const active=Object.values(plans).filter(p=>p.state==='open');
      if(active.length)return {state:'open',label:'比較當期住宿方案',url:'https://www.eaglish.store'+item.article+'#plans',plans,end:active.map(p=>p.end).sort().at(-1)};
      return {state:Object.values(plans).every(p=>p.state==='closed')?'closed':'unavailable',label:Object.values(plans).every(p=>p.state==='closed')?'本次團購已結束':'目前無法確認團購狀態',plans};
    }
    const r=rowForArticle(rows,key);
    return campaignRow(r,now);
  }
  function campaignRow(r,now){
    if(!r)return {state:'unavailable',label:'目前無法確認團購狀態'};
    const type=String(r['類型']||''),start=date(r['開團日期']),end=date(r['結束日期']),url=safeUrl(r['連結']);
    if(/結團|已結束|closed|ended/i.test(type))return {state:'closed',label:'本次團購已結束'};
    if((r['開團日期']&&!start)||(r['結束日期']&&!end)||(!end&&!/長期|long/i.test(type)))return {state:'unavailable',label:'檔期待確認'};
    if(start&&end&&start>end)return {state:'unavailable',label:'檔期待確認'};
    if(end&&now>end)return {state:'closed',label:'本次團購已結束'};
    if(start&&now<start)return {state:'upcoming',label:'尚未開團',start,end};
    if(!url)return {state:'unavailable',label:'購買連結待確認'};
    if(String(r['庫存狀態']||'')==='售完')return {state:'closed',label:'目前已售完'};
    return {state:'open',label:'查看當期組合優惠',url,videos:fromRow(r),start,end};
  }


  // 結團、還沒開團時的下一步：加入 LINE 社群，開團第一時間通知（Hiram 2026-11-25：結團就引導加入 LINE）。
  const LINE_COMMUNITY='https://line.me/ti/g2/YOQM0ZQlrN3jj_R5BP4W-hnxE3Ij1005VxJT7w';
  // 即將開團的狀態列：先說開團日，LINE 只是後面的小連結（內容優先；Hiram 2026-11-25）。
  function upcomingStatus(el,c,product,surface){
    if(!el)return;const d=c?.start?c.start.replace(/^(\d{4})-(\d{2})-(\d{2})$/,(_,y,m,dd)=>`${+m}/${+dd}`):'';
    el.textContent=(d?`這一檔 ${d} 開團；`:'這一檔還沒開團；')+'內容可以先看、先挑好。想開團當天收到通知：';
    if(LINE_COMMUNITY&&typeof document!=='undefined'&&typeof document.createElement==='function')try{const t=document.createElement('template');t.innerHTML=lineNotifyLink({surface,product,label:'LINE 提醒我',className:'offer-line-text'});const a=t.content?.firstElementChild;if(a&&el.append)el.append(a);}catch{}
  }
  function lineNotifyLink({surface,product='',label='開團通知我・加入 LINE',className='line-notify'}={}){
    return `<a class="${escape(className)}" href="${LINE_COMMUNITY}" target="_blank" rel="noopener noreferrer" data-line-notify="${escape(surface||'')}" data-line-product="${escape(product)}">${escape(label)}<span aria-hidden="true">↗</span></a>`;
  }
  // 文章開頭的「這一檔重點」卡：檔期、團購價、運費、出貨，加一個購買鈕。只在開團中或即將開團時出現。
  // facts（團購價／運費／出貨）寫在 catalog 該篇條目，來源是文章自己的團購說明段落。
  function mountKeyFacts(key,c,{buy}={}){
    if(typeof document==='undefined')return;
    const item=catalog[key];let card=document.querySelector('.key-facts');
    if(!item||!c||!['open','upcoming','closed'].includes(c.state)){card?.remove();return;}
    const byline=document.querySelector('main .byline');if(!byline)return;
    if(!document.getElementById('key-facts-style')){const st=document.createElement('style');st.id='key-facts-style';st.textContent=KEY_FACTS_CSS;document.head.append(st);}
    if(!card){card=document.createElement('aside');card.className='key-facts';card.setAttribute('aria-label','這一檔重點');card.setAttribute('data-editorial-exclude','');byline.after(card);}
    if(c.state==='closed'){
      if(!document.getElementById('key-facts-style')){const st=document.createElement('style');st.id='key-facts-style';st.textContent=KEY_FACTS_CSS;document.head.append(st);}
      if(!card){card=document.createElement('aside');card.className='key-facts';card.setAttribute('aria-label','這一檔重點');card.setAttribute('data-editorial-exclude','');byline.after(card);}
      card.classList.remove('is-urgent');card.classList.add('is-closed');
      card.innerHTML=`<div class="kf-head"><p class="kf-title">這一檔已結團</p><span class="kf-pill">等下一檔</span></div><p class="kf-note">文章可以繼續看。想買的話，加入 LINE 社群，下次開團、補貨會第一時間通知你。</p><div class="kf-actions">${lineNotifyLink({surface:'article_key_facts',product:item.brands[0],className:'kf-buy kf-line'})}<a class="kf-more" href="/#catalog">看正在開團的好物</a></div>`;
      return;
    }
    card?.classList.remove('is-closed');
    const md=d=>{const [y,m,dd]=d.split('-').map(Number);return `${m}/${dd}（${'日一二三四五六'[new Date(Date.UTC(y,m-1,dd)).getUTCDay()]}）`;};
    const left=c.end?Math.floor((Date.parse(c.end+'T00:00:00+08:00')+86400000-Date.now())/86400000):null;
    const pill=c.state==='upcoming'?'即將開團':c.end?(left>=1?`開團中・剩 ${left} 天`:'今天最後一天'):'開團中';
    // 開團前只寫開團日（結束日在開團後才寫）；跨年的結束日把年份寫出來。
    const endText=c.end?(c.start&&c.end.slice(0,4)!==c.start.slice(0,4)?c.end.slice(0,4)+'/':'')+md(c.end)+'23:59':'';
    const range=c.state==='upcoming'?md(c.start)+'開團':c.end?`${c.start?md(c.start)+'～':''}${endText}`:'常駐開團';
    const f=item.facts||{};
    const rows=[['檔期',range],['團購價',f.price],['運費',f.shipping],['出貨',f.delivery]].filter(([,v])=>v);
    card.classList.toggle('is-urgent',c.state==='open'&&left!==null&&left<=3);
    card.innerHTML=`<div class="kf-head"><p class="kf-title">這一檔重點</p><span class="kf-pill">${escape(pill)}</span></div><dl>${rows.map(([k,v])=>`<div><dt>${escape(k)}</dt><dd>${escape(v)}</dd></div>`).join('')}</dl><div class="kf-actions">${c.state==='open'?(buy?.href?`<a class="kf-buy" href="${escape(buy.href)}" target="_blank" rel="noopener noreferrer">前往團購<span aria-hidden="true">↗</span></a>`:'<button type="button" class="kf-buy">前往團購<span aria-hidden="true">↗</span></button>'):`<span class="kf-soon">開團前內容先看、清單先挑好</span>`}${document.getElementById('offer')?'<a class="kf-more" href="#offer">看團購細節</a>':''}</div>${c.state==='upcoming'?`<p class="kf-remind">想開團當天收到通知？${lineNotifyLink({surface:'article_key_facts',product:item.brands[0],label:'LINE 提醒我',className:'kf-line-text'})}</p>`:''}`;
    const b=card.querySelector('button.kf-buy');if(b&&buy?.onClick)b.addEventListener('click',buy.onClick);
  }
  const KEY_FACTS_CSS=`.key-facts{text-align:left;margin:22px 0 26px;padding:18px 20px 16px;border:1px solid #dcd5c9;border-radius:16px;background:#fffdf8;font-family:-apple-system,BlinkMacSystemFont,"PingFang TC","Microsoft JhengHei",sans-serif;line-height:1.6;color:#343a30}
.key-facts .kf-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px}
.key-facts .kf-title{margin:0;font-size:13px;font-weight:700;letter-spacing:.08em;color:#46533a}
.key-facts .kf-pill{padding:3px 11px;border-radius:999px;background:#eee9dd;color:#46533a;font-size:13px;font-weight:700;white-space:nowrap}
.key-facts.is-urgent .kf-pill{background:#a84c2b;color:#fffdf8}
.key-facts dl{display:grid;gap:6px;margin:0}
.key-facts dl div{display:grid;grid-template-columns:4.2em 1fr;gap:10px;align-items:baseline}
.key-facts dt{margin:0;font-size:13px;color:#676d60}
.key-facts dd{margin:0;font-size:15px;font-weight:600}
.key-facts .kf-actions{display:flex;align-items:center;flex-wrap:wrap;gap:8px 16px;margin-top:14px}
.key-facts .kf-buy{display:inline-flex;align-items:center;gap:6px;min-height:44px;padding:0 20px;border:0;border-radius:999px;background:#343a30;color:#fffdf8;font-family:inherit;font-size:15px;font-weight:700;line-height:1;text-decoration:none;cursor:pointer}
.key-facts .kf-buy:hover{background:#22271f}
.key-facts .kf-buy:focus-visible,.key-facts .kf-more:focus-visible{outline:3px solid #a84c2b;outline-offset:2px}
.key-facts .kf-wait{font-size:14px;color:#676d60}
.key-facts .kf-note{margin:0;font-size:15px;line-height:1.75;color:#343a30}
.key-facts.is-closed{background:#f6f3ec}
.key-facts .kf-soon{font-size:14px;color:#5b6152}
.key-facts .kf-remind{margin:10px 0 0;font-size:13.5px;color:#5b6152}
.key-facts .kf-line-text,.offer-line-text{display:inline-flex;align-items:center;gap:5px;color:#2F4A36;font-weight:600;text-decoration:underline;text-underline-offset:3px}
.key-facts .kf-line-text::before,.offer-line-text::before{content:"";width:14px;height:14px;flex:none;background:#06C755;-webkit-mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 3C6.5 3 2 6.6 2 11c0 3.9 3.5 7.2 8.3 7.9.3.1.8.2.9.5.1.3.1.7 0 1l-.1.9c0 .3-.2 1 .9.5s5.8-3.4 7.9-5.9C21.4 14.3 22 12.7 22 11c0-4.4-4.5-8-10-8z'/%3E%3C/svg%3E") center/contain no-repeat;mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 3C6.5 3 2 6.6 2 11c0 3.9 3.5 7.2 8.3 7.9.3.1.8.2.9.5.1.3.1.7 0 1l-.1.9c0 .3-.2 1 .9.5s5.8-3.4 7.9-5.9C21.4 14.3 22 12.7 22 11c0-4.4-4.5-8-10-8z'/%3E%3C/svg%3E") center/contain no-repeat}
.key-facts .kf-line{background:#E8EEE3;border:1px solid #C9D6C0;color:#2F4A36;gap:7px}
.key-facts .kf-line:hover{background:#DDE6D5;border-color:#B8C8AE;color:#2F4A36}
.key-facts .kf-line::before{content:"";width:18px;height:18px;flex:none;background:#06C755;-webkit-mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 3C6.5 3 2 6.6 2 11c0 3.9 3.5 7.2 8.3 7.9.3.1.8.2.9.5.1.3.1.7 0 1l-.1.9c0 .3-.2 1 .9.5s5.8-3.4 7.9-5.9C21.4 14.3 22 12.7 22 11c0-4.4-4.5-8-10-8z'/%3E%3C/svg%3E") center/contain no-repeat;mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 3C6.5 3 2 6.6 2 11c0 3.9 3.5 7.2 8.3 7.9.3.1.8.2.9.5.1.3.1.7 0 1l-.1.9c0 .3-.2 1 .9.5s5.8-3.4 7.9-5.9C21.4 14.3 22 12.7 22 11c0-4.4-4.5-8-10-8z'/%3E%3C/svg%3E") center/contain no-repeat}
.key-facts .kf-more{display:inline-flex;align-items:center;min-height:44px;color:#a84c2b;font-size:14px;font-weight:600;text-decoration:underline;text-underline-offset:3px}
@media(max-width:700px){.key-facts{margin:18px 0 22px;padding:16px 16px 14px}.key-facts dd{font-size:14.5px}.key-facts .kf-buy{flex:1 1 auto;justify-content:center}}`;
  function campaign(rows,now=today()){return campaignFor(rows,'atojet',now);}
  function dialog(title){const d=document.createElement('dialog');d.className='content-dialog';d.setAttribute('aria-label',title);const head=document.createElement('header'),h=document.createElement('h2'),close=document.createElement('button');h.textContent=title;close.className='close';close.textContent='關閉 ×';close.setAttribute('aria-label','關閉視窗');close.onclick=()=>d.close();head.append(h,close);d.append(head);const previous=document.activeElement;d.addEventListener('close',()=>{d.remove();previous?.focus();});d.addEventListener('click',e=>{if(e.target===d){const b=d.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)d.close();}});document.body.append(d);return d;}
  function mountVideos(container,input){
    const list=videos(input);
    if(!list.length){container.textContent='尚未提供影片';return;}
    const nav=document.createElement('div'),panel=document.createElement('div');
    nav.className='video-choices';nav.setAttribute('aria-label','選擇影片');panel.className='video-panel';
    const frameFor=v=>{
      const frame=document.createElement('iframe'),src=new URL(v.embedUrl);
      if(v.embedType==='youtube'){
        src.searchParams.set('playsinline','1');src.searchParams.set('rel','0');src.searchParams.set('autoplay','1');
        if(typeof location!=='undefined'&&/^https?:$/.test(location.protocol))src.searchParams.set('origin',location.origin);
      }
      frame.src=src.href;frame.title=v.title;frame.allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';frame.allowFullscreen=true;frame.referrerPolicy='strict-origin-when-cross-origin';frame.className=v.vertical?'is-vertical':'is-landscape';frame.dataset.provider=v.embedType;return frame;
    };
    const select=(v,i)=>{
      panel.replaceChildren();[...nav.children].forEach((b,j)=>b.setAttribute('aria-pressed',String(j===i)));
      const a=document.createElement('a');a.href=v.url;a.target='_blank';a.rel='noopener noreferrer';a.textContent='若影片無法播放，在原平台觀看 ↗';
      if(v.embedType==='youtube'){
        const poster=document.createElement('button'),image=document.createElement('img'),play=document.createElement('span');
        poster.type='button';poster.className=`video-poster ${v.vertical?'is-vertical':'is-landscape'}`;poster.setAttribute('aria-label',`播放：${v.title}`);
        image.src=`https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg`;image.alt='';image.setAttribute('aria-hidden','true');image.loading='eager';
        play.className='video-play';play.setAttribute('aria-hidden','true');play.textContent='▶';poster.append(image,play);
        poster.addEventListener('click',()=>poster.replaceWith(frameFor(v)),{once:true});panel.append(poster);
      }else if(v.embedUrl){
        const frame=frameFor(v);frame.loading='lazy';panel.append(frame);
      }else{
        const p=document.createElement('p');p.textContent='這個平台目前不支援站內播放。';panel.append(p);
      }
      panel.append(a);
    };
    list.forEach((v,i)=>{const b=document.createElement('button');b.textContent=v.title;b.type='button';b.onclick=()=>select(v,i);nav.append(b);});
    container.append(nav,panel);select(list[0],0);
  }
  function install(getGroups){document.addEventListener('click',e=>{const v=e.target.closest('[data-video-brand]'),r=e.target.closest('[data-reading-brand]');if(!v&&!r)return;const g=getGroups().find(g=>g.brand===(v?.dataset.videoBrand||r?.dataset.readingBrand));if(!g)return;e.preventDefault();e.stopPropagation();const d=dialog(v?'觀看影片':'閱讀文章');if(v)mountVideos(d,g.videos||g.video);else{const p=document.createElement('p');p.textContent='選擇閱讀內容（尚未整合的舊文保留原始入口）';d.append(p);for(const x of readingLinks(g)){const a=document.createElement('a');a.href=x.url;a.target='_blank';a.rel='noopener noreferrer';a.textContent=x.title;d.append(a);}}d.showModal();});}
  return {catalog,escape,safeUrl,withUTM,videoId,instagramEmbed,videos,fromRow,sheetRows,entry,readingLinks,readingButton,videoButton,date,campaign,campaignFor,rowForArticle,today,mountVideos,mountKeyFacts,LINE_COMMUNITY,lineNotifyLink,upcomingStatus,install};
});
