/* 角色卡體驗（GB-028，測試版）：虛構角色與他們的一天。
   商品只用品牌名對應團購資料（Google Sheet 現正開團，失敗時用 config/catalog-snapshot.json）；
   故事只寫角色的需求，不替商品寫規格或功效，商品說明一律取自團購資料。 */
(function (root) {
  "use strict";
  const B = {
    kietla: "法國 Ki ET LA 兒童太陽眼鏡｜墨鏡",
    playzu: "Playzu",
    deer: "丹麥 Done by deer兒童用品",
    juice: "台東初鹿&青森蘋果汁",
    wave: "Wave 鷹嘴豆泥",
    miamily: "瑞士 Miamily",
    rieti: "Rieti 太陽眼鏡",
    meroware: "Meroware 美學育兒用品",
    mitoy: "MiToy米積木",
    desk: "斜面式氣動升降伴讀桌",
    plafarm: "PLAFARM",
    shinwa: "心窪生活",
    alzip: "Alzipmat",
    sanfu: "三富休閒農場",
    giiker: "Giiker益智遊戲機+Gocube魔術方塊",
    emma: "emma 床墊",
    knsh: "康軒雜誌",
    parakito: "法國帕洛防蚊液",
    blackmores: "澳佳寶保健食品",
    shoumaji: "收麻吉手捲收納袋",
    locknlock: "樂扣樂扣",
    caesar: "墾丁凱撒大飯店",
    leofoo: "六福莊住宿 B｜經典探險",
    lange: "L'Ange 棉之境",
    branden: "Branden 壓縮袋",
    hereu: "hereu 智慧定位器",
    atojet: "Atojet 濾芯蓮蓬頭",
    artisan: "ARTISAN浴室清潔＆小腿按摩器",
    eben: "EBEN康普茶",
    fushan: "富山私房菜｜常溫品",
    fushanFrozen: "富山私房菜｜冷凍品",
  };

  // 角色比例（第一版）：Hiram「平台大概有八成以上是女性使用者」＋目前商品分類（母嬰 14、居家 8、食品 7、旅遊 5）。
  // 拿到 GB-028 的真實彙總數字後再調整。
  const characters = [
    {
      id: "kexin", name: "林可昕", art: "/assets/play/characters/kexin.webp", nick: "可昕", age: 22, gender: "f",
      role: "剛畢業的行銷助理", place: "日常大樓 3F，通勤到台北", groups: ["work"],
      color: "#d8a35d", tagline: "第一份工作第三個月，正在學著照顧自己。",
      goal: "把第一份工作做好，也把自己照顧好", goalShort: "照顧好自己",
      match: { ages: ["20 多歲"], kids: [], rhythms: ["commute"], goals: ["self", "food"] },
      story: "可昕每天搭捷運四十分鐘進公司，早上手忙腳亂、中午吃什麼總是隨便、下班時眼睛和肩膀一起抗議。她開始想：除了把工作做好，也要把自己的日子顧好。",
      avatar: { skin: "#f3d2b8", hair: "#2b211c", style: "long", shirt: "#5f7d95", acc: "earrings" },
      day: [
        { time: "07:20", title: "出門前找不到鑰匙", text: "包包翻了兩遍，鑰匙其實在昨天那件外套口袋裡。差點趕不上那班捷運。", need: "常找不到的東西，留一個線索", options: [B.hereu], alts: [], reaction: "「以後鑰匙跟包包一起掛著，出門前看一眼手機就好。」" },
        { time: "10:30", title: "同事又揪手搖", text: "一天一杯手搖，月底看帳本有點心虛。她想自己帶杯子，至少少一點塑膠杯。", need: "可以每天帶出門的杯子", options: [B.locknlock], alts: [B.deer], reaction: "「自己帶杯，還可以裝公司的熱茶。」" },
        { time: "12:30", title: "午餐又是便利商店", text: "連續第五天微波便當。她想找點簡單、可以抹可以沾、帶到公司也不麻煩的東西。", need: "能讓午餐換一種心情的食物", options: [B.wave, B.juice], alts: [B.fushanFrozen], reaction: "「配蔬菜棒和全麥餅乾，午餐突然像樣多了。」" },
        { time: "16:00", title: "盯螢幕一整天", text: "簡報改到第七版，眼睛乾澀。她想了解保健食品怎麼挑，但也知道要先看清楚標示和自己的狀況。", need: "先弄懂怎麼挑，再決定要不要買", options: [B.blackmores], alts: [], reaction: "「我先把成分標示看懂，有疑問再問藥師。」" },
        { time: "19:00", title: "下班，給自己一點獎勵", text: "不想喝含糖飲料，又想要一點儀式感。", need: "下班後的小小儀式感", options: [B.eben], alts: [B.juice], reaction: "「冰過再喝，今天也辛苦了。」" },
        { time: "週末", title: "跟大學朋友去海邊", text: "第一次用自己的薪水安排小旅行，陽光很大。", need: "出門曬太陽也舒服", options: [B.rieti], alts: [B.parakito], reaction: "「拍照也好看，這是給自己的畢業禮物。」" },
      ],
    },
    {
      id: "shihan", name: "黃詩涵", art: "/assets/play/characters/shihan.webp", nick: "詩涵", age: 35, gender: "f",
      role: "雙薪家庭的媽媽・會計", place: "日常大樓 7A", groups: ["mom", "work"],
      color: "#c46b4e", tagline: "小麥 9 歲、小米 5 歲，對門 7B 是最常串門子的雅婷一家。",
      goal: "把兩個女兒和這個家顧得好好的，也留一點時間給自己", goalShort: "顧好這個家",
      match: { ages: ["30 多歲"], kids: ["school", "preschool"], rhythms: ["commute"], goals: ["kids", "home", "food"] },
      story: "詩涵和先生阿哲都上班。早上趕小麥上學、送小米去幼兒園，晚上煮飯、功課、洗澡，一樣一樣排得井井有條。她常常多煮一點，裝一盒送去對門。",
      avatar: { skin: "#f1cdb0", hair: "#3a2a22", style: "bob", shirt: "#c46b4e", acc: "none", kid: { skin: "#f6d9c3", hair: "#3a2a22" } },
      day: [
        { time: "06:50", title: "姊妹搶著自己盛早餐", text: "小米堅持要跟姊姊一樣自己盛粥，湯匙一歪，桌上又多了一灘。小麥已經在門口催了。", need: "孩子自己吃飯、不怕摔的餐具", options: [B.deer, B.meroware], alts: [B.locknlock], reaction: "「慢慢來，自己盛的最好吃。」" },
        { time: "07:20", title: "小麥的水壺呢？", text: "校車快到了，小麥的水壺還在洗碗槽裡，蓋子不知道又跑去哪裡。", need: "孩子願意帶、好拆洗的水壺", options: [B.locknlock, B.deer], alts: [], reaction: "「自己的水壺，回家自己拿出來洗喔。」" },
        { time: "17:40", title: "小米在客廳翻跟斗", text: "從幼兒園回來，小米精力還是滿的，在沙發和地板之間跳來跳去，樓下應該也聽得到。", need: "孩子在家跳跳跑跑的柔軟地面", options: [B.alzip, B.playzu], alts: [B.mitoy], reaction: "「鋪好之後，翻跟斗也不怕了，樓下也安靜多了。」" },
        { time: "18:30", title: "多煮了一點，拿去！", text: "今天燉了一鍋滷肉，詩涵照例裝了一盒，端去對門給雅婷家。", need: "裝菜送鄰居、也好收進冰箱的保鮮盒", options: [B.locknlock], alts: [B.fushanFrozen], reaction: "「我多煮了一點，拿去！盒子下次再還我就好。」" },
        { time: "19:30", title: "姊姊寫功課，妹妹要人陪", text: "小麥在寫數學，小米一直跑來問「陪我玩」。詩涵想給小米一樣能自己專心玩一陣子的東西。", need: "讓孩子自己專心玩一陣子", options: [B.mitoy], alts: [B.shinwa, B.giiker], reaction: "「妹妹蓋好一座城堡，姊姊的功課也寫完了。」" },
        { time: "20:15", title: "玩具散滿地", text: "睡前客廳又像被颱風掃過。詩涵想要一個姊妹倆自己就會收的收納。", need: "孩子也能一起收的收納", options: [B.plafarm], alts: [B.shoumaji], reaction: "「我們來比賽，誰先把積木放回家！」" },
        { time: "22:30", title: "終於輪到自己", text: "孩子睡了、碗洗了，明天的便當也備好了。詩涵躺上床，想好好睡一覺。", need: "讓大人也睡好", options: [B.emma], alts: [B.lange, B.juice], reaction: "「睡飽了，明天才有力氣再把日子排好。」" },
      ],
    },
    {
      id: "jiahao", name: "陳家豪", art: "/assets/play/characters/jiahao.webp", nick: "家豪", age: 37, gender: "m",
      role: "軟體工程師・兩個孩子的爸爸", place: "日常里巷子裡的三樓透天", groups: ["dad", "work"],
      color: "#4f7a6a", tagline: "品睿 9 歲、品妍 6 歲，太太輪班，他負責接送和睡前共讀。",
      goal: "少一點螢幕，多一點和孩子一起動手", goalShort: "陪孩子動手",
      match: { ages: ["30 多歲", "40 多歲"], kids: ["school", "preschool"], rhythms: ["commute", "home-work"], goals: ["kids"] },
      story: "家豪下午四點半準時下班去接孩子，那是他和太太說好的分工。回家後功課、晚餐、洗澡、共讀，他想讓孩子少一點螢幕、多一點一起動手的時間。",
      avatar: { skin: "#e8bf9c", hair: "#1f1a17", style: "short", shirt: "#4f7a6a", acc: "glasses", kid: { skin: "#efc9a8", hair: "#1f1a17" } },
      day: [
        { time: "07:10", title: "出門前的水壺大戰", text: "老大說學校的水不好喝，老二的水壺又找不到蓋子。", need: "孩子願意帶、好拆洗的水壺", options: [B.locknlock, B.deer], alts: [], reaction: "「自己的水壺自己背，回家自己拿出來洗。」" },
        { time: "17:00", title: "寫功課姿勢歪歪", text: "品睿趴在餐桌寫作業，越寫越低，背也駝了。", need: "可以調高度的書桌", options: [B.desk], alts: [B.knsh], reaction: "「桌面斜一點，他坐得比較直了。」" },
        { time: "19:30", title: "晚餐後不想給平板", text: "孩子說無聊。家豪想要一個全家能一起玩、又會動腦的東西。", need: "不用螢幕也好玩的益智遊戲", options: [B.giiker], alts: [B.shinwa, B.mitoy], reaction: "「爸爸你輸了！再一局！」" },
        { time: "20:40", title: "睡前共讀", text: "老二剛開始認注音，老大已經會自己讀短篇故事。", need: "依年齡選的共讀刊物", options: [B.knsh], alts: [B.giiker], reaction: "「每個月收到新的一期，兩個人都搶著先看。」" },
        { time: "週末", title: "跟孩子做一件作品", text: "家豪想陪孩子做點手作，最後可以留在家裡當紀念。", need: "親子一起動手的木作", options: [B.shinwa], alts: [B.mitoy], reaction: "「這台木車是我們三個一起做的。」" },
      ],
    },
    {
      id: "yating", name: "王雅婷", art: "/assets/play/characters/yating.webp", nick: "雅婷", age: 38, gender: "f",
      role: "業務主管・兩寶媽", place: "日常大樓 7B", groups: ["mom", "travel"],
      color: "#3f7f9a", tagline: "阿樂 9 歲、小豆 2 歲，每季一定要安排一次全家旅行。",
      goal: "讓全家輕鬆出門、開心回家", goalShort: "全家出遊",
      match: { ages: ["30 多歲", "40 多歲"], kids: ["preschool", "toddler"], rhythms: ["commute"], goals: ["trip"] },
      story: "雅婷平常工作很滿，旅行是她給全家的固定約會。她最怕的是行李爆量、孩子曬傷被叮、到了現場才發現房型不適合。所以她習慣把功課做在前面。",
      avatar: { skin: "#f0cbae", hair: "#4a3326", style: "ponytail", shirt: "#3f7f9a", acc: "sunglasses", kid: { skin: "#f4d5bd", hair: "#4a3326" } },
      day: [
        { time: "週一", title: "選這次住哪裡", text: "老二還小、老大想看動物。雅婷想先比較房型、餐食和費用，再決定。", need: "適合帶小孩的住宿", options: [B.leofoo, B.caesar], alts: [B.sanfu], reaction: "「先算清楚一晚多少、早餐含不含，就不用在現場猶豫。」" },
        { time: "週四", title: "打包四個人的行李", text: "衣服、尿布、玩具、外套……行李箱關不起來。", need: "把衣物壓小、分類", options: [B.shoumaji, B.branden], alts: [B.hereu], reaction: "「一人一袋，到飯店直接拿出來，不用翻。」" },
        { time: "出發日", title: "老二走不動了", text: "逛到一半老二說腳痠，要抱抱。雅婷手上還提著包包。", need: "長時間抱孩子的輔助", options: [B.miamily], alts: [], reaction: "「坐上去就不吵了，我的手也空出來了。」" },
        { time: "下午", title: "海邊太陽好大", text: "孩子在沙灘玩不肯戴帽子，草叢邊還有蚊子。", need: "孩子戶外的防曬和防蚊", options: [B.kietla, B.parakito], alts: [B.rieti], reaction: "「挑了他喜歡的顏色，終於肯戴了。」" },
        { time: "回程", title: "行李箱在哪？", text: "轉車時人很多，一轉身差點搞不清楚哪個箱子是自己的。", need: "行李多時的安心", options: [B.hereu], alts: [B.branden], reaction: "「看手機就知道箱子在哪，心定很多。」" },
      ],
    },
    {
      id: "peishan", name: "吳佩珊", art: "/assets/play/characters/peishan.webp", nick: "佩珊", age: 30, gender: "f",
      role: "育嬰假中的新手媽媽", place: "日常大樓 10F", groups: ["mom"],
      color: "#9a6fa8", tagline: "寶寶 4 個月，夜奶兩次，正在找回自己的節奏。",
      goal: "照顧好寶寶，也找回自己的節奏", goalShort: "找回節奏",
      match: { ages: ["30 多歲", "20 多歲"], kids: ["baby"], rhythms: ["leave", "carer"], goals: ["self", "kids"] },
      story: "佩珊請了半年育嬰假。她發現新手媽媽的一天沒有上下班，只有餵奶、拍嗝、洗澡和偶爾的十分鐘。她想把家裡的小事安排好，留一點力氣給自己。",
      avatar: { skin: "#f5d6bf", hair: "#2e2420", style: "bun", shirt: "#9a6fa8", acc: "none", kid: { skin: "#f8dcc8", hair: "#2e2420", baby: true } },
      day: [
        { time: "03:10", title: "第二次夜奶", text: "餵完、拍完嗝，寶寶在懷裡睡著，佩珊的肩膀上搭著一條紗布巾。", need: "拍嗝、擦口水的紗布巾", options: [B.lange], alts: [], reaction: "「多備幾條，洗了晾著也不怕不夠用。」" },
        { time: "09:00", title: "幫寶寶洗澡", text: "她開始在意洗澡水，想知道換濾芯蓮蓬頭是怎麼一回事。", need: "了解家裡的用水", options: [B.atojet], alts: [B.lange], reaction: "「先看別人的換芯紀錄，再決定要不要換。」" },
        { time: "13:00", title: "自己也要吃好", text: "午餐常常站著扒兩口。她想把營養顧回來，但會先問醫師或藥師。", need: "產後的營養補給（先諮詢專業）", options: [B.blackmores], alts: [B.wave], reaction: "「把成分表帶去問藥師，安心很多。」" },
        { time: "16:00", title: "想喝點不一樣的", text: "白開水喝膩了，想要一點果香和甜味，冰箱裡放一瓶就好。", need: "冰箱裡的一點小確幸", options: [B.juice], alts: [B.eben], reaction: "「餵完奶喝一口，像重新開機。」" },
        { time: "22:00", title: "能睡就快睡", text: "下一次夜奶大概在凌晨一點。床如果不舒服，短短的睡眠就更難熬。", need: "睡得深一點的床墊", options: [B.emma], alts: [B.lange], reaction: "「就算只睡三小時，也要睡好。」" },
      ],
    },
    {
      id: "shufen", name: "許淑芬", art: "/assets/play/characters/shufen.webp", nick: "淑芬阿姨", age: 56, gender: "f",
      role: "剛退休、幫忙帶孫的阿嬤", place: "日常大樓 1F", groups: ["senior"],
      color: "#a5803e", tagline: "住 1 樓，週間幫 7 樓的女兒顧 2 歲的小豆，整棟樓都叫她淑芬阿姨。",
      goal: "顧好孫子、顧好家，也顧好自己的膝蓋", goalShort: "顧家也顧自己",
      match: { ages: ["50 歲以上"], kids: [], rhythms: ["retired", "carer"], goals: ["home", "food"], elder: true },
      story: "淑芬退休後，生活重心變成孫子和家裡。她很會持家，但膝蓋和腰開始不聽話；逢年過節，她總是張羅送禮和家族聚餐的那個人。",
      avatar: { skin: "#ecc5a6", hair: "#8d8780", style: "short-curl", shirt: "#a5803e", acc: "glasses" },
      day: [
        { time: "09:30", title: "孫子在客廳玩", text: "小豆 2 歲，喜歡把東西堆高再推倒。阿嬤想找安全一點、可以一起玩的玩具。", need: "祖孫一起玩的積木", options: [B.mitoy], alts: [B.shinwa, B.alzip], reaction: "「阿嬤陪你蓋一座城堡。」" },
        { time: "11:00", title: "浴室要刷了", text: "浴缸和角落要彎腰刷，膝蓋越來越吃力。", need: "不用一直彎腰的清潔工具", options: [B.artisan], alts: [B.atojet], reaction: "「站著就刷得到，腰不痠了。」" },
        { time: "15:00", title: "準備中秋送禮", text: "要送親戚和女兒公婆，想要體面、大家都吃得慣的。", need: "送得出手的禮盒", options: [B.fushan], alts: [B.juice, B.eben], reaction: "「先挑口味再裝禮盒，送起來有面子。」" },
        { time: "18:00", title: "家族聚餐加菜", text: "週末全家回來吃飯，她想多加一道菜，又不想在廚房站太久。", need: "加熱就能上桌的料理", options: [B.fushanFrozen], alts: [B.fushan], reaction: "「加熱一下就上桌，大家都說好吃。」" },
        { time: "週末", title: "帶孫子去農場", text: "女兒說要一起去住農場，阿嬤想先看看早餐和活動適不適合老人家和小孩。", need: "三代同行的住宿", options: [B.sanfu], alts: [B.leofoo], reaction: "「三代一起，晚上還去看了夜間導覽。」" },
      ],
    },
    {
      id: "chenghan", name: "李承翰", art: "/assets/play/characters/chenghan.webp", nick: "承翰", age: 32, gender: "m",
      role: "第一次一個人帶女兒出遊的爸爸", place: "日常里巷子", groups: ["dad", "travel"],
      color: "#5a6fa6", tagline: "女兒朵朵 4 歲，太太小麗出差三天，父女倆的冒險。",
      goal: "和女兒完成第一次兩個人的小旅行", goalShort: "父女小旅行",
      match: { ages: ["30 多歲"], kids: ["preschool"], rhythms: ["commute"], goals: ["trip", "kids"] },
      story: "太太出差，承翰決定帶女兒去住一晚農場。他列了一張清單，還是很緊張：防曬、防蚊、吃飯、晚上無聊怎麼辦？",
      avatar: { skin: "#e5b993", hair: "#231c18", style: "short2", shirt: "#5a6fa6", acc: "beard", kid: { skin: "#ecc4a2", hair: "#231c18" } },
      day: [
        { time: "週五晚上", title: "決定去哪裡", text: "女兒想看動物、想玩 DIY。承翰想找一個不用開太遠、一晚就能玩夠的地方。", need: "適合父女小旅行的住宿", options: [B.sanfu, B.leofoo], alts: [B.caesar], reaction: "「館別、早餐和 DIY 都先看好，出發前就不慌。」" },
        { time: "週六上午", title: "太陽好大", text: "女兒在草地上跑，瞇著眼睛說好刺眼。", need: "孩子的太陽眼鏡", options: [B.kietla], alts: [B.parakito], reaction: "「她說戴上去像明星，還要我幫她拍照。」" },
        { time: "週六傍晚", title: "草叢邊的蚊子", text: "傍晚散步時，女兒腿上被叮了一個包。", need: "戶外防蚊", options: [B.parakito], alts: [B.kietla], reaction: "「出門前先擦，後面就沒再被叮了。」" },
        { time: "晚餐", title: "女兒要自己吃", text: "她堅持要用自己的碗和杯子。", need: "孩子自己的餐具和水杯", options: [B.deer], alts: [B.locknlock, B.meroware], reaction: "「帶著自己的餐具，在哪裡吃飯都像在家。」" },
        { time: "睡前", title: "沒有電視的晚上", text: "房間沒有平板，女兒說無聊。承翰包包裡還有一樣祕密武器。", need: "旅途中可以一起玩的解謎遊戲", options: [B.giiker], alts: [B.mitoy], reaction: "「我們一起解了三關，她說明天還要玩。」" },
      ],
    },
    {
      id: "yizhen", name: "蔡宜蓁", art: "/assets/play/characters/yizhen.webp", nick: "宜蓁", age: 27, gender: "f",
      role: "新婚、在家工作的插畫家", place: "日常大樓 3F 小套房", groups: ["work", "home"],
      color: "#6b8e4e", tagline: "12 坪的家，兩個人、一隻貓，空間要用得很聰明。",
      goal: "12 坪也能住得清爽、工作得順", goalShort: "小家清爽",
      match: { ages: ["20 多歲"], kids: [], rhythms: ["home-work"], goals: ["home", "food", "self"] },
      story: "宜蓁在家接案，家就是辦公室。小套房東西一多就亂，浴室也總是有拖了很久沒處理的角落。她想要的是：每樣東西都有位置，生活不被家事追著跑。",
      avatar: { skin: "#f2d0b4", hair: "#5b3a2a", style: "bob-bangs", shirt: "#6b8e4e", acc: "earrings" },
      day: [
        { time: "08:30", title: "換季，衣櫃塞爆", text: "冬天的外套拿出來，夏天的衣服沒地方放。", need: "把換季衣物收小", options: [B.shoumaji, B.branden], alts: [B.plafarm], reaction: "「捲一捲壓一壓，衣櫃多出一整格。」" },
        { time: "11:00", title: "浴室角落的水垢", text: "畫圖畫累了起來走走，看到浴室角落又黃了。", need: "不用一直彎腰的清潔", options: [B.artisan], alts: [B.atojet], reaction: "「刷完心情跟浴室一起亮了。」" },
        { time: "12:30", title: "一個人的午餐", text: "工作時常常忘了吃飯。她想要冰箱裡有一樣隨手就能配的東西。", need: "隨手就能配的食物", options: [B.wave], alts: [B.fushanFrozen, B.juice], reaction: "「抹在吐司上，五分鐘解決一餐，還吃得到豆子。」" },
        { time: "15:30", title: "下午卡關", text: "稿子卡住，想喝點氣泡的東西轉換一下。", need: "下午的提神小飲", options: [B.eben], alts: [B.juice], reaction: "「冰冰的一口，靈感回來了一點。」" },
        { time: "晚上", title: "老公的鑰匙又不見", text: "兩個人每天輪流找鑰匙、找遙控器。", need: "常找不到的東西，留一個線索", options: [B.hereu], alts: [], reaction: "「掛上去之後，再也不用全家翻沙發。」" },
      ],
    },
  ];


  // 日常里的家人與鄰居（GB-033／GB-034／GB-035 角色設計；設定見鷹家社區設定書）。角色全部虛構。
  // art 是頭像；home 用來分組。people 是每位主角卡上「身邊的人」，可以指向主角或配角。
  const A = (id) => `/assets/play/characters/cast/${id}.webp`;
  const cast = {
    azhe: { name: "阿哲", role: "詩涵的先生・37 歲", note: "很會修東西，家裡壞了什麼都找他", home: "7A", art: A("azhe") },
    xiaomai: { name: "小麥", role: "詩涵的大女兒・9 歲小三", note: "跟對門的阿樂同班", home: "7A", art: A("xiaomai") },
    xiaomi: { name: "小米", role: "詩涵的小女兒・5 歲", note: "什麼都想跟姊姊一樣", home: "7A", art: A("xiaomi") },
    junhong: { name: "俊宏", role: "雅婷的先生・40 歲", note: "常出差、愛釣魚，回家就被孩子按在地上玩", home: "7B", art: A("junhong") },
    ale: { name: "阿樂", role: "雅婷的大兒子・9 歲小三", note: "跟對門的小麥同班", home: "7B", art: A("ale") },
    xiaodou: { name: "小豆", role: "雅婷的小兒子・2 歲", note: "黏媽媽，白天常在 1 樓外婆家", home: "7B", art: A("xiaodou") },
    amingbo: { name: "阿明伯", role: "淑芬的先生・60 歲", note: "還在台南上班，偶爾上來", home: "1F", art: A("amingbo") },
    ayue: { name: "阿岳", role: "宜蓁的先生・29 歲", note: "健身教練，鑰匙常常不見", home: "3F", art: A("ayue") },
    mochi: { name: "麻粬", role: "宜蓁家的貓", note: "常偷偷溜進隔壁可昕家", home: "3F", art: A("mochi") },
    zhihao: { name: "志豪", role: "佩珊的先生・34 歲", note: "銀行員，笨拙但很認真的新手爸爸", home: "10F", art: A("zhihao") },
    xiaoputao: { name: "小葡萄", role: "佩珊的寶寶・4 個月", note: "大家的開心果", home: "10F", art: A("xiaoputao") },
    yian: { name: "怡安", role: "家豪的太太・36 歲", note: "輪班護理師，家裡真正的指揮官", home: "巷子", art: A("yian") },
    pinrui: { name: "品睿", role: "家豪的兒子・9 歲小三", note: "愛問為什麼，小麥和阿樂的同學", home: "巷子", art: A("pinrui") },
    pinyan: { name: "品妍", role: "家豪的女兒・6 歲小一", note: "安靜愛畫畫，宜蓁的小粉絲", home: "巷子", art: A("pinyan") },
    xiaoli: { name: "小麗", role: "承翰的太太・31 歲", note: "常出差的業務，常在視訊裡出場", home: "巷子", art: A("xiaoli") },
    duoduo: { name: "朵朵", role: "承翰的女兒・4 歲", note: "很冷靜，把爸爸的清單當藏寶圖", home: "巷子", art: A("duoduo") },
    chenbo: { name: "陳伯", role: "大樓管理員・65 歲", note: "整棟樓的消息都經過他", home: "社區", art: A("chenbo") },
    asen: { name: "阿森", role: "團購取貨站站長・35 歲", note: "新商品「到貨」都是他抱來的", home: "社區", art: A("asen") },
    xiulan: { name: "秀蘭", role: "早安小站老闆娘・45 歲", note: "記得每個人的早餐", home: "社區", art: A("xiulan") },
    xiaohe: { name: "小禾", role: "秀蘭的女兒・9 歲小三", note: "小麥的好朋友，常來 7 樓玩", home: "社區", art: A("xiaohe") },
    mia: { name: "Mia", role: "轉角咖啡店長・30 歲", note: "聽大家說心事", home: "社區", art: A("mia") },
    chunmei: { name: "春美", role: "黃昏市場菜攤阿姨・52 歲", note: "嗓門大，最愛送蔥", home: "社區", art: A("chunmei") },
    akai: { name: "阿凱", role: "春美的兒子・17 歲高二", note: "嘴笨但很會照顧人", home: "社區", art: A("akai") },
    xiaoqing: { name: "小晴", role: "陳伯的孫女・16 歲高二", note: "成績好、會害羞", home: "社區", art: A("xiaoqing") },
    boyu: { name: "柏宇", role: "上班族・28 歲", note: "常被自家的狗拉著走", home: "社區", art: A("boyu") },
    pudding: { name: "布丁", role: "柏宇的狗", note: "一看到可昕就衝過去", home: "社區", art: A("pudding") },
    teacherlin: { name: "林老師", role: "小樹苗幼兒園老師・28 歲", note: "孩子們的小祕密她都知道", home: "社區", art: A("teacherlin") },
  };
  const people = {
    kexin: [["yizhen", "住隔壁的插畫家"], ["mochi"], ["boyu"], ["pudding"], ["mia"]],
    shihan: [["azhe"], ["xiaomai"], ["xiaomi"], ["yating", "對門 7B，最常串門子"], ["teacherlin", "小米的幼兒園老師"]],
    jiahao: [["yian"], ["pinrui"], ["pinyan"]],
    yating: [["junhong"], ["ale"], ["xiaodou"], ["shufen", "媽媽，住 1 樓"], ["shihan", "對門 7A，常送菜過來"]],
    peishan: [["zhihao"], ["xiaoputao"]],
    shufen: [["amingbo"], ["yating", "女兒，住 7B"], ["xiaodou", "孫子，白天常在她家"], ["ale", "孫子"], ["chenbo", "交換消息的老朋友"]],
    chenghan: [["xiaoli"], ["duoduo"]],
    yizhen: [["ayue"], ["mochi"], ["kexin", "住隔壁"], ["pinyan"]],
  };

  // 意外事件（八角框架第 7 項「好奇與未知」）：每位角色的一天隨機插入一張。
  const events = [
    { title: "午後雷陣雨", text: "突然下起大雨，計畫被打亂了一下。還好，日子總會找到新的節奏。", bonus: 5 },
    { title: "朋友傳來訊息", text: "「你上次說的那個，後來買了嗎？」原來不只自己有這個煩惱。", bonus: 5 },
    { title: "意外的空檔", text: "原本的行程取消，多出半小時。拿來好好喝杯水、伸個懶腰。", bonus: 5 },
    { title: "小小的失誤", text: "東西忘在家裡，只好折返。沒關係，下次就會記得。", bonus: 5 },
    { title: "被稱讚了", text: "今天有人說：「你最近氣色很好。」原來照顧自己，別人看得見。", bonus: 10 },
  ];

  const groups = [
    { id: "all", label: "全部" },
    { id: "mom", label: "媽媽" },
    { id: "dad", label: "爸爸" },
    { id: "work", label: "上班族" },
    { id: "travel", label: "旅行" },
    { id: "home", label: "居家" },
    { id: "senior", label: "長輩" },
  ];

  // 「建立我的角色」：額外的頭像（先用 SVG；之後換成 Codex 依選定風格畫的插圖，預設角色與額外頭像約 1:1）。
  const extraAvatars = [
    { id: "a1", art: "/assets/play/characters/a1.webp", color: "#c9876a", avatar: { skin: "#f3d2b8", hair: "#2b211c", style: "ponytail", shirt: "#c9876a", acc: "none" } },
    { id: "a2", art: "/assets/play/characters/a2.webp", color: "#7a8fb5", avatar: { skin: "#eac3a2", hair: "#4a3326", style: "bob-bangs", shirt: "#7a8fb5", acc: "glasses" } },
    { id: "a3", art: "/assets/play/characters/a3.webp", color: "#8aa070", avatar: { skin: "#f1cdb0", hair: "#1f1a17", style: "long", shirt: "#8aa070", acc: "earrings" } },
    { id: "a4", art: "/assets/play/characters/a4.webp", color: "#b58a4a", avatar: { skin: "#e5b993", hair: "#3a2a22", style: "bun", shirt: "#b58a4a", acc: "none" } },
    { id: "a5", art: "/assets/play/characters/a5.webp", color: "#5d8c8a", avatar: { skin: "#e8bf9c", hair: "#231c18", style: "short", shirt: "#5d8c8a", acc: "none" } },
    { id: "a6", art: "/assets/play/characters/a6.webp", color: "#8c6a9e", avatar: { skin: "#ecc5a6", hair: "#2e2420", style: "short2", shirt: "#8c6a9e", acc: "glasses" } },
    { id: "a7", art: "/assets/play/characters/a7.webp", color: "#a8695a", avatar: { skin: "#ecc5a6", hair: "#9a948c", style: "short-curl", shirt: "#a8695a", acc: "none" } },
    { id: "a8", art: "/assets/play/characters/a8.webp", color: "#6f7d4f", avatar: { skin: "#f5d6bf", hair: "#5b3a2a", style: "bob", shirt: "#6f7d4f", acc: "none", kid: { skin: "#f8dcc8", hair: "#5b3a2a" } } },
  ];

  // 通用的一天場景（給自己建立的角色用）。order 決定在一天裡的先後。
  const sceneLibrary = {
    lost: { order: 10, time: "07:30", title: "出門前找不到鑰匙", text: "包包翻了兩遍，鑰匙不知道又跑去哪裡。", need: "常找不到的東西，留一個線索", options: [B.hereu], alts: [], reaction: "「出門前看一眼手機就知道在哪。」" },
    walking: { order: 12, time: "07:00", title: "孩子正在學走路", text: "{kid}扶著家具走兩步就跌坐，地板硬得讓人心驚。", kid: ["toddler", "baby"], need: "學走路、跌坐時的柔軟地面", options: [B.alzip, B.playzu], alts: [B.mitoy], reaction: "「{kid}跌坐下去也不怕，拍拍手又站起來了。」" },
    bottle: { order: 14, time: "07:10", title: "出門前的水壺", text: "{kid}說學校的水不好喝，水壺的蓋子又找不到。", kid: ["school", "preschool"], need: "孩子願意帶、好拆洗的水壺", options: [B.locknlock, B.deer], alts: [], reaction: "「自己的水壺自己背。」" },
    baby: { order: 20, time: "09:00", title: "幫寶寶洗澡", text: "{kid}洗完要快快包起來擦乾，拍嗝巾也總是不夠用。", kid: ["baby"], need: "寶寶洗澡與拍嗝用的布巾", options: [B.lange], alts: [B.atojet], reaction: "「多備幾條，洗了晾著也不怕不夠。」" },
    bathroom: { order: 24, time: "10:30", title: "浴室角落又黃了", text: "每次都要彎腰刷很久，拖著拖著又一週。", need: "不用一直彎腰的清潔", options: [B.artisan], alts: [B.atojet], reaction: "「站著就刷得到，終於不拖了。」" },
    lunch: { order: 30, time: "12:30", title: "午餐又隨便吃", text: "忙起來就隨便扒兩口，吃完也不覺得飽。", need: "簡單又能讓午餐像樣一點的食物", options: [B.wave], alts: [B.fushanFrozen, B.juice], reaction: "「五分鐘也能吃得像樣。」" },
    treat: { order: 36, time: "15:30", title: "給自己一點小獎勵", text: "下午有點累，想喝點不一樣的轉換心情。", need: "下午的一點小確幸", options: [B.eben, B.juice], alts: [B.blackmores], reaction: "「喝一口，重新開機。」" },
    homework: { order: 40, time: "17:00", title: "寫功課姿勢歪歪", text: "{kid}趴在餐桌寫作業，越寫越低。", kid: ["school"], need: "可以調高度的書桌", options: [B.desk], alts: [B.knsh], reaction: "「桌面斜一點，坐得直多了。」" },
    toddler: { order: 44, time: "18:40", title: "邊煮飯邊顧孩子", text: "要準備晚餐，需要一樣{kid}能專心玩一陣子的東西。", kid: ["toddler", "preschool"], need: "讓孩子自己專心玩一陣子", options: [B.mitoy], alts: [B.shinwa], reaction: "「湯煮好了，{kid}也蓋好一座城堡。」" },
    meals: { order: 46, time: "18:30", title: "孩子吃飯一團亂", text: "{kid}堅持自己吃，桌上地上都是飯粒。", kid: ["preschool", "toddler"], need: "孩子自己練習吃飯的餐具", options: [B.deer, B.meroware], alts: [B.locknlock], reaction: "「讓{kid}自己吃，練習本來就會弄髒。」" },
    screen: { order: 50, time: "19:30", title: "又在討平板", text: "晚餐後{kid}說無聊。你想試試平板以外的辦法。", kid: ["school", "preschool"], need: "不用螢幕也好玩的東西", options: [B.giiker, B.knsh], alts: [B.shinwa, B.mitoy], reaction: "「{kid}說：再一局！」" },
    clutter: { order: 60, time: "20:30", title: "東西多到收不完", text: "客廳、衣櫃、玩具區，每個角落都在提醒你該整理了。", need: "讓東西都有自己的位置", options: [B.plafarm, B.shoumaji], alts: [B.branden], reaction: "「收好之後，家像大了一點。」" },
    sleep: { order: 70, time: "23:00", title: "又是翻來覆去的一晚", text: "躺上床已經很晚了，腦袋還在轉，明天還要早起。", need: "讓睡眠好一點", options: [B.emma], alts: [B.lange], reaction: "「今晚想好好睡一覺。」" },
    trip: { order: 80, time: "週一", title: "這次要住哪裡", text: "想帶家人出去走走，先比較房型、餐食和費用。", need: "適合家人的住宿", options: [B.leofoo, B.caesar], alts: [B.sanfu], reaction: "「先算清楚，出發就不慌。」" },
    packing: { order: 82, time: "出發前", title: "行李箱關不起來", text: "衣服、外套、孩子的東西，怎麼塞都塞不下。", need: "把衣物壓小、分類", options: [B.shoumaji, B.branden], alts: [B.hereu], reaction: "「一人一袋，到了直接拿。」" },
    outdoor: { order: 84, time: "出遊日", title: "太陽好大、蚊子好多", text: "在戶外玩得正開心，曬和叮都來了。", need: "戶外的防曬和防蚊", options: [B.kietla, B.parakito], alts: [B.rieti], reaction: "「玩得盡興，回家也舒服。」" },
    gift: { order: 90, time: "節日前", title: "送禮送什麼", text: "要送長輩、親戚和朋友，想要體面又吃得慣的。", need: "送得出手的禮盒", options: [B.fushan], alts: [B.juice, B.eben], reaction: "「這份心意，送得剛剛好。」" },
  };

  // 有毛孩時，自己的一天會出現一張毛孩事件卡（目前沒有寵物商品，只是故事）。
  const petEvents = [
    { title: "{pet}的早安", text: "{pet}一大早就跳上床，用鼻子把你叫醒。今天就從一個擁抱開始。", bonus: 5 },
    { title: "{pet}搗蛋了", text: "一轉身，{pet}把拖鞋叼到沙發底下。生氣不起來，只好笑著去撿。", bonus: 5 },
    { title: "{pet}在門口等你", text: "回到家，{pet}已經在門口等。一天的累，好像少了一半。", bonus: 10 },
  ];

  const builder = {
    ages: ["20 多歲", "30 多歲", "40 多歲", "50 歲以上"],
    rhythms: [
      { id: "commute", label: "每天通勤上班" },
      { id: "home-work", label: "在家工作" },
      { id: "leave", label: "育嬰假中" },
      { id: "carer", label: "全職照顧家裡" },
      { id: "retired", label: "退休了" },
    ],
    kidAges: [
      { id: "baby", label: "0–1 歲" },
      { id: "toddler", label: "1–3 歲" },
      { id: "preschool", label: "3–6 歲" },
      { id: "school", label: "6–12 歲" },
      { id: "teen", label: "12 歲以上" },
    ],
    pets: [
      { id: "dog", label: "狗狗" },
      { id: "cat", label: "貓咪" },
      { id: "other", label: "其他毛孩" },
    ],
    family: [
      { id: "partner", label: "伴侶" },
      { id: "baby", label: "寶寶（0–1 歲）", scene: "baby" },
      { id: "toddler", label: "幼兒（1–3 歲）", scene: "toddler" },
      { id: "preschool", label: "學齡前（3–6 歲）", scene: "meals" },
      { id: "school", label: "小學生（6–12 歲）", scene: "homework" },
      { id: "elder", label: "家中長輩", scene: "bathroom" },
    ],
    goals: [
      { id: "self", label: "把自己照顧好", title: "自我照顧練習生", line: "想把自己照顧好", scene: "treat" },
      { id: "home", label: "讓家住得更舒服", title: "家的整理師", line: "想讓家住得更舒服", scene: "clutter" },
      { id: "kids", label: "多陪孩子玩、陪孩子長大", title: "陪玩隊長", line: "想多陪孩子玩、陪他們長大", scene: "screen" },
      { id: "trip", label: "全家一起出門走走", title: "出遊規劃師", line: "想帶全家出門走走", scene: "trip" },
      { id: "food", label: "吃得簡單又安心", title: "餐桌安心派", line: "想吃得簡單又安心", scene: "lunch" },
    ],
    worries: [
      { id: "sleep", label: "睡不好", scene: "sleep" },
      { id: "clutter", label: "東西太多收不完", scene: "clutter" },
      { id: "walking", label: "孩子正在學走路", scene: "walking" },
      { id: "meals", label: "孩子吃飯一團亂", scene: "meals" },
      { id: "screen", label: "功課和螢幕時間", scene: "screen" },
      { id: "packing", label: "出門行李好多", scene: "packing" },
      { id: "outdoor", label: "戶外怕曬又怕蚊子", scene: "outdoor" },
      { id: "lunch", label: "午餐總是隨便", scene: "lunch" },
      { id: "lost", label: "常常找不到東西", scene: "lost" },
      { id: "bathroom", label: "浴室清潔好累", scene: "bathroom" },
      { id: "gift", label: "逢年過節要送禮", scene: "gift" },
    ],
  };

  root.PlayCharacters = { brands: B, characters, cast, people, events, petEvents, groups, builder, sceneLibrary, extraAvatars };
})(typeof globalThis !== "undefined" ? globalThis : this);
