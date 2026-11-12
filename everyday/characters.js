/* 角色卡體驗（GB-028，測試版）：虛構角色與他們的一天。
   商品只用品牌名對應團購資料（Google Sheet 現正開團，失敗時用 config/catalog-snapshot.json）；
   故事只寫角色的需求，不替商品寫規格或功效，商品說明一律取自團購資料。 */
(function (root) {
  "use strict";
  // 只用常駐團購（團購表「類型」＝長期）：這頁是常駐的，限時團購結團後故事裡的商品會失效（Hiram 11/08）。
  // 名單核對 2026-11-08 團購表「現正開團」，品牌名必須和 config/catalog-snapshot.json 一字不差。
  const B = {
    playzu: "Playzu",
    alzip: "Alzipmat",
    happymoon: "Happymoon",
    mitoy: "MiToy米積木",
    shinwa: "心窪生活",
    plafarm: "PLAFARM",
    shoumaji: "收麻吉手捲收納袋",
    meroware: "Meroware 美學育兒用品",
    desk: "斜面式氣動升降伴讀桌",
    kietla: "法國 Ki ET LA 兒童太陽眼鏡｜墨鏡",
    rieti: "Rieti 太陽眼鏡",
    miamily: "瑞士 Miamily",
    maylily: "Maylily旅行小睡床&Copper Pearl",
    zoo: "比利時 ZooFamily 兒童相機",
    yookido: "Yookido 水玩具＋trixie 背包",
    yogurt: "紐登斯優格",
    avocado: "酪梨油品、紐西蘭食品",
    juice: "台東初鹿&青森蘋果汁",
    wave: "Wave 鷹嘴豆泥",
    kamee: "Kamee",
  };
  const permanentBrands = Object.values(B);

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
        { time: "07:30", title: "來不及吃早餐", text: "鬧鐘按掉兩次，換好衣服就得衝去捷運站。早餐又要空著肚子撐到中午了。", need: "出門前拿了就走的早餐", options: [B.juice], alts: [B.yogurt], reaction: "「冰箱拿一瓶就出門，捷運上也有早餐。」" },
        { time: "12:30", title: "午餐又是便利商店", text: "連續第五天微波便當。她想找點簡單、可以抹可以沾、帶到公司也不麻煩的東西。", need: "能讓午餐換一種心情的食物", options: [B.wave], alts: [B.juice], reaction: "「配蔬菜棒和全麥餅乾，午餐突然像樣多了。」" },
        { time: "16:00", title: "盯螢幕一整天", text: "簡報改到第七版，眼睛乾澀。她想了解保健食品怎麼挑，但也知道要先看清楚標示和自己的狀況。", need: "先弄懂怎麼挑，再決定要不要買", options: [B.kamee], alts: [], reaction: "「我先把成分標示看懂，有疑問再問藥師。」" },
        { time: "19:30", title: "第一次自己下廚", text: "搬來日常大樓後，她想學著自己煮。超市站了很久，不知道該買哪一瓶油。", need: "自己下廚、煎炒都順手的一瓶油", options: [B.avocado], alts: [B.wave], reaction: "「煎了一顆荷包蛋，隔壁的宜蓁說聞起來好香。」" },
        { time: "週末", title: "跟大學朋友去海邊", text: "第一次用自己的薪水安排小旅行，陽光很大。", need: "出門曬太陽也舒服", options: [B.rieti], alts: [], reaction: "「拍照也好看，這是給自己的畢業禮物。」" },
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
        { time: "06:50", title: "姊妹搶著自己盛早餐", text: "小米堅持要跟姊姊一樣自己盛粥，湯匙一歪，桌上又多了一灘。小麥已經在門口催了。", need: "孩子自己吃飯、不怕摔的餐具", options: [B.meroware], alts: [], reaction: "「慢慢來，自己盛的最好吃。」" },
        { time: "07:15", title: "小麥早上吃不下", text: "小麥說早上沒胃口，粥只吃了兩口。詩涵想讓她出門前至少吃一點東西。", need: "孩子早上吃得下的一小份", options: [B.yogurt], alts: [B.juice], reaction: "「一小杯就好，至少不是空著肚子去上學。」" },
        { time: "17:40", title: "小米在客廳翻跟斗", text: "從幼兒園回來，小米精力還是滿的，在沙發和地板之間跳來跳去，樓下應該也聽得到。", need: "孩子在家跳跳跑跑的柔軟地面", options: [B.alzip, B.playzu], alts: [B.happymoon], reaction: "「鋪好之後，翻跟斗也不怕了，樓下也安靜多了。」" },
        { time: "18:30", title: "多煮了一點，拿去！", text: "今天煎了一大盤雞腿，詩涵照例裝了一盒，端去對門給雅婷家。", need: "大火煎炒也順手的一瓶油", options: [B.avocado], alts: [B.wave], reaction: "「我多煮了一點，拿去！盒子下次再還我就好。」" },
        { time: "19:30", title: "姊姊寫功課，妹妹要人陪", text: "小麥在寫數學，小米一直跑來問「陪我玩」。詩涵想給小米一樣能自己專心玩一陣子的東西。", need: "讓孩子自己專心玩一陣子", options: [B.mitoy], alts: [B.shinwa], reaction: "「妹妹蓋好一座城堡，姊姊的功課也寫完了。」" },
        { time: "20:15", title: "玩具散滿地", text: "睡前客廳又像被颱風掃過。詩涵想要一個姊妹倆自己就會收的收納。", need: "孩子也能一起收的收納", options: [B.plafarm], alts: [B.shoumaji], reaction: "「我們來比賽，誰先把積木放回家！」" },
        { time: "週末", title: "小麥想當攝影師", text: "小麥一直借媽媽的手機拍照，拍了一百張小米的鬼臉。詩涵想讓她有一台自己的相機。", need: "讓孩子用自己的眼睛記錄生活", options: [B.zoo], alts: [], reaction: "「她拍的全家福，比我拍的還好看。」" },
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
        { time: "17:00", title: "寫功課姿勢歪歪", text: "品睿趴在餐桌寫作業，越寫越低，背也駝了。", need: "可以調高度的書桌", options: [B.desk], alts: [], reaction: "「桌面斜一點，他坐得比較直了。」" },
        { time: "19:30", title: "晚餐後不想給平板", text: "孩子說無聊。家豪想要一個全家能一起玩、又會動手的東西。", need: "不用螢幕也好玩的東西", options: [B.mitoy], alts: [B.shinwa], reaction: "「爸爸你蓋的城堡歪了！再一座！」" },
        { time: "週六上午", title: "下雨出不去", text: "原本要去公園，結果下起大雨。兩個孩子在家跑來跑去，精力完全沒處發洩。", need: "雨天在家也能放電", options: [B.happymoon], alts: [B.alzip, B.playzu], reaction: "「玩了一個早上，午覺睡得特別熟。」" },
        { time: "週六下午", title: "跟孩子做一件作品", text: "家豪想陪孩子做點手作，最後可以留在家裡當紀念。", need: "親子一起動手的木作", options: [B.shinwa], alts: [B.mitoy], reaction: "「這台木車是我們三個一起做的。」" },
        { time: "週日", title: "品妍想拍宜蓁阿姨的貓", text: "品妍每次去宜蓁家都想拍麻粬，借爸爸的手機又怕摔。", need: "孩子自己的相機", options: [B.zoo], alts: [], reaction: "「她把麻粬拍成一本小相簿，說要送給宜蓁阿姨。」" },
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
        { time: "週四", title: "打包四個人的行李", text: "衣服、尿布、玩具、外套……行李箱關不起來。", need: "把衣物壓小、分類", options: [B.shoumaji], alts: [], reaction: "「一人一袋，到飯店直接拿出來，不用翻。」" },
        { time: "出發日", title: "小豆走不動了", text: "逛到一半小豆說腳痠，要抱抱。雅婷手上還提著包包。", need: "長時間抱孩子的輔助", options: [B.miamily], alts: [], reaction: "「坐上去就不吵了，我的手也空出來了。」" },
        { time: "下午", title: "海邊太陽好大", text: "阿樂在沙灘上跑，瞇著眼睛說好刺眼，帽子戴不到五分鐘就拿掉。", need: "孩子戶外的太陽眼鏡", options: [B.kietla], alts: [B.rieti], reaction: "「挑了他喜歡的顏色，終於肯戴了。」" },
        { time: "傍晚", title: "兄弟倆都想玩水", text: "看到淺水池，阿樂和小豆都衝過去。雅婷想讓他們玩得開心，自己也不用一直追。", need: "孩子玩水、踏青的玩具和背包", options: [B.yookido], alts: [], reaction: "「一人一個，玩到不想回房間。」" },
        { time: "晚上", title: "小豆睡不慣", text: "住的地方沒有嬰兒床，小豆在大床上翻來翻去，一直滾到邊邊。", need: "旅行時孩子自己的小床", options: [B.maylily], alts: [], reaction: "「睡在自己的小床上，他一下就睡著了。」" },
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
        { time: "10:00", title: "小葡萄開始練趴", text: "醫師說可以讓寶寶多趴一趴。客廳的木地板太硬，佩珊想鋪一塊軟一點的地方。", need: "寶寶練趴的柔軟地墊", options: [B.alzip, B.playzu], alts: [], reaction: "「他抬頭看我的那一秒，我差點哭出來。」" },
        { time: "13:00", title: "自己也要吃好", text: "午餐常常站著扒兩口。她想把營養顧回來，但會先問醫師或藥師。", need: "產後的營養補給（先諮詢專業）", options: [B.kamee], alts: [B.wave], reaction: "「把成分表帶去問藥師，安心很多。」" },
        { time: "14:30", title: "白天只肯在客廳睡", text: "小葡萄白天一放回房間就醒。佩珊想讓他在客廳也有一個自己的小床。", need: "白天在客廳也能睡的小床", options: [B.maylily], alts: [], reaction: "「他在小床上睡著，我終於能坐下來喝口水。」" },
        { time: "16:00", title: "想喝點不一樣的", text: "白開水喝膩了，想要一點果香和甜味，冰箱裡放一瓶就好。", need: "冰箱裡的一點小確幸", options: [B.juice], alts: [], reaction: "「餵完奶喝一口，像重新開機。」" },
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
        { time: "09:30", title: "小豆在客廳玩", text: "小豆 2 歲，喜歡把東西堆高再推倒。阿嬤想找安全一點、可以一起玩的玩具。", need: "祖孫一起玩的積木", options: [B.mitoy], alts: [B.shinwa], reaction: "「阿嬤陪你蓋一座城堡。」" },
        { time: "10:30", title: "小豆跑太快", text: "小豆在客廳跑來跑去，跌倒了就哭。阿嬤的膝蓋蹲下去扶他，也越來越吃力。", need: "孩子跌倒也不怕的地墊", options: [B.playzu, B.alzip], alts: [B.happymoon], reaction: "「跌倒了自己爬起來，阿嬤也不用一直蹲。」" },
        { time: "15:00", title: "準備送禮", text: "要送親戚和女兒公婆，想要大家都喝得慣、拿得出手的。", need: "大家都喝得慣的伴手禮", options: [B.juice], alts: [B.avocado], reaction: "「老人家和小孩都能喝，送起來剛剛好。」" },
        { time: "18:00", title: "家族聚餐加菜", text: "週末阿明伯從台南上來，全家回來吃飯。她想煎一盤魚、多炒兩道菜。", need: "煎炒都順手的一瓶油", options: [B.avocado], alts: [B.wave], reaction: "「煎得金金黃黃，大家都說好吃。」" },
        { time: "週末", title: "帶孫子去公園", text: "雅婷要加班，阿嬤帶阿樂和小豆去公園。太陽一出來，兩個孩子都說好刺眼。", need: "孫子們的太陽眼鏡", options: [B.kietla], alts: [], reaction: "「戴上去像兩個小明星，阿嬤拍了好多張。」" },
      ],
    },
    {
      id: "chenghan", name: "李承翰", art: "/assets/play/characters/chenghan.webp", nick: "承翰", age: 32, gender: "m",
      role: "第一次一個人帶女兒出遊的爸爸", place: "日常里巷子", groups: ["dad", "travel"],
      color: "#5a6fa6", tagline: "女兒朵朵 4 歲，太太小麗出差三天，父女倆的冒險。",
      goal: "和女兒完成第一次兩個人的小旅行", goalShort: "父女小旅行",
      match: { ages: ["30 多歲"], kids: ["preschool"], rhythms: ["commute"], goals: ["trip", "kids"] },
      story: "太太出差，承翰決定帶女兒去住一晚農場。他列了一張清單，還是很緊張：防曬、玩水、吃飯、晚上無聊怎麼辦？",
      avatar: { skin: "#e5b993", hair: "#231c18", style: "short2", shirt: "#5a6fa6", acc: "beard", kid: { skin: "#ecc4a2", hair: "#231c18" } },
      day: [
        { time: "週五晚上", title: "打包父女倆的行李", text: "太太小麗出差前交代了一張清單。承翰照著打包，還是塞不進一個袋子。", need: "把衣物壓小、分類", options: [B.shoumaji], alts: [], reaction: "「清單上的都裝進去了……吧？」" },
        { time: "週六上午", title: "太陽好大", text: "女兒在草地上跑，瞇著眼睛說好刺眼。", need: "孩子的太陽眼鏡", options: [B.kietla], alts: [B.rieti], reaction: "「她說戴上去像明星，還要我幫她拍照。」" },
        { time: "週六下午", title: "朵朵看到小溪", text: "農場旁邊有一條淺淺的小溪，朵朵站在旁邊看了很久，說想玩水。", need: "孩子玩水、踏青的玩具和背包", options: [B.yookido], alts: [], reaction: "「她背著自己的小背包，冷靜地玩了一個下午。」" },
        { time: "晚餐", title: "女兒要自己吃", text: "她堅持要用自己的碗和杯子。", need: "孩子自己的餐具", options: [B.meroware], alts: [], reaction: "「帶著自己的餐具，在哪裡吃飯都像在家。」" },
        { time: "睡前", title: "沒有電視的晚上", text: "房間沒有平板，朵朵也不吵，拿出白天的相機一張一張翻。", need: "讓孩子記錄旅行的相機", options: [B.zoo], alts: [], reaction: "「她拍了四十張，有三十張是我。」" },
      ],
    },
    {
      id: "yizhen", name: "蔡宜蓁", art: "/assets/play/characters/yizhen.webp", nick: "宜蓁", age: 27, gender: "f",
      role: "新婚、在家工作的插畫家", place: "日常大樓 3F 小套房", groups: ["work", "home"],
      color: "#6b8e4e", tagline: "12 坪的家，兩個人、一隻貓，空間要用得很聰明。",
      goal: "12 坪也能住得清爽、工作得順", goalShort: "小家清爽",
      match: { ages: ["20 多歲"], kids: [], rhythms: ["home-work"], goals: ["home", "food", "self"] },
      story: "宜蓁在家接案，家就是辦公室。小套房東西一多就亂，午餐也常常忘了吃。她想要的是：每樣東西都有位置，生活不被家事追著跑。",
      avatar: { skin: "#f2d0b4", hair: "#5b3a2a", style: "bob-bangs", shirt: "#6b8e4e", acc: "earrings" },
      day: [
        { time: "08:30", title: "換季，衣櫃塞爆", text: "冬天的外套拿出來，夏天的衣服沒地方放。", need: "把換季衣物收小", options: [B.shoumaji, B.plafarm], alts: [], reaction: "「捲一捲壓一壓，衣櫃多出一整格。」" },
        { time: "12:30", title: "一個人的午餐", text: "工作時常常忘了吃飯。她想要冰箱裡有一樣隨手就能配的東西。", need: "隨手就能配的食物", options: [B.wave], alts: [B.avocado], reaction: "「抹在吐司上，五分鐘解決一餐，還吃得到豆子。」" },
        { time: "15:30", title: "下午卡關", text: "稿子卡住，想喝點不一樣的轉換一下。", need: "下午換個心情的飲料", options: [B.juice], alts: [], reaction: "「冰冰的一口，靈感回來了一點。」" },
        { time: "晚上", title: "阿岳想試保健食品", text: "健身教練阿岳說想吃點保健食品，宜蓁要他先搞清楚自己需要什麼。", need: "先弄懂怎麼挑，再決定要不要買", options: [B.kamee], alts: [], reaction: "「先看成分、問清楚，再決定。」" },
        { time: "週末", title: "品妍來家裡畫畫", text: "巷子裡的品妍又來找宜蓁畫畫，還一直想拍麻粬。宜蓁想送她一個小禮物。", need: "送小朋友的相機", options: [B.zoo], alts: [B.shinwa], reaction: "「她說長大要跟宜蓁阿姨一樣，把日常畫下來。」" },
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

  // 「建立我的角色」：訪客選的頭像。Hiram 11/12：直接用日常里的角色，不要另一套水彩風格。
  // 用配角（不用 8 位主角，免得訪客自己的卡和主角卡長得一樣）；id a1–a8 不變，已選過的訪客照舊。
  const extraAvatars = [
    { id: "a1", art: "/assets/play/characters/me/xiaoli.webp", color: "#b39274", avatar: { skin: "#efc9ab", hair: "#2b211c", style: "long", shirt: "#b39274", acc: "none" } },
    { id: "a2", art: "/assets/play/characters/me/teacherlin.webp", color: "#d9822b", avatar: { skin: "#efc9ab", hair: "#2b211c", style: "bob-bangs", shirt: "#d9822b", acc: "glasses" } },
    { id: "a3", art: "/assets/play/characters/me/mia.webp", color: "#7a5a3a", avatar: { skin: "#efc9ab", hair: "#2b211c", style: "short2", shirt: "#7a5a3a", acc: "none" } },
    { id: "a4", art: "/assets/play/characters/me/yian.webp", color: "#6f9bb5", avatar: { skin: "#efc9ab", hair: "#2b211c", style: "short", shirt: "#6f9bb5", acc: "none" } },
    { id: "a5", art: "/assets/play/characters/me/boyu.webp", color: "#8a8580", avatar: { skin: "#efc9ab", hair: "#2b211c", style: "short", shirt: "#8a8580", acc: "none" } },
    { id: "a6", art: "/assets/play/characters/me/azhe.webp", color: "#3e4a6b", avatar: { skin: "#efc9ab", hair: "#2b211c", style: "short", shirt: "#3e4a6b", acc: "none" } },
    { id: "a7", art: "/assets/play/characters/me/chunmei.webp", color: "#a0558a", avatar: { skin: "#efc9ab", hair: "#2b211c", style: "short-curl", shirt: "#a0558a", acc: "none" } },
    { id: "a8", art: "/assets/play/characters/me/zhihao.webp", color: "#7d8a96", avatar: { skin: "#efc9ab", hair: "#2b211c", style: "short", shirt: "#7d8a96", acc: "none", kid: { skin: "#f8dcc8", hair: "#3a2a22" } } },
    // Hiram 11/12：「可以增加到 12 個人。年齡分布可以更廣，甚至有一隻是狗也可以，反正可能有人想當狗啊。」
    { id: "a9", art: "/assets/play/characters/me/xiaoqing.webp", color: "#6b7a8f", avatar: { skin: "#efc9ab", hair: "#2b211c", style: "long", shirt: "#6b7a8f", acc: "glasses" } },
    { id: "a10", art: "/assets/play/characters/me/xiulan.webp", color: "#c0453a", avatar: { skin: "#efc9ab", hair: "#5b3a2a", style: "short-curl", shirt: "#c0453a", acc: "none" } },
    { id: "a11", art: "/assets/play/characters/me/amingbo.webp", color: "#9a8f7c", avatar: { skin: "#e5b993", hair: "#b8b2a8", style: "short", shirt: "#9a8f7c", acc: "none" } },
    { id: "a12", art: "/assets/play/characters/me/pudding.webp", color: "#d08a4a", avatar: { skin: "#f3d2b8", hair: "#d08a4a", style: "short", shirt: "#d08a4a", acc: "none" } },
  ];

  // 通用的一天場景（給自己建立的角色用）。order 決定在一天裡的先後。
  const sceneLibrary = {
    walking: { order: 12, time: "07:00", title: "孩子正在學走路", text: "{kid}扶著家具走兩步就跌坐，地板硬得讓人心驚。", kid: ["toddler", "baby"], need: "學走路、跌坐時的柔軟地面", options: [B.alzip, B.playzu], alts: [B.happymoon], reaction: "「{kid}跌坐下去也不怕，拍拍手又站起來了。」" },
    breakfast: { order: 14, time: "07:10", title: "早上吃不下", text: "{kid}說早上沒胃口，出門前只吃了兩口。", kid: ["school", "preschool"], need: "孩子早上吃得下的一小份", options: [B.yogurt], alts: [B.juice], reaction: "「一小份就好，至少不是空著肚子出門。」" },
    baby: { order: 20, time: "13:00", title: "寶寶白天的小睡", text: "{kid}白天一放回房間就醒，想在客廳也有一個自己的小床。", kid: ["baby"], need: "白天在客廳也能睡的小床", options: [B.maylily], alts: [B.alzip], reaction: "「{kid}睡著了，終於能坐下來喝口水。」" },
    lunch: { order: 30, time: "12:30", title: "午餐又隨便吃", text: "忙起來就隨便扒兩口，吃完也不覺得飽。", need: "簡單又能讓午餐像樣一點的食物", options: [B.wave], alts: [B.avocado, B.juice], reaction: "「五分鐘也能吃得像樣。」" },
    treat: { order: 36, time: "15:30", title: "給自己一點小獎勵", text: "下午有點累，想喝點不一樣的轉換心情。", need: "下午的一點小確幸", options: [B.juice], alts: [B.kamee], reaction: "「喝一口，重新開機。」" },
    homework: { order: 40, time: "17:00", title: "寫功課姿勢歪歪", text: "{kid}趴在餐桌寫作業，越寫越低。", kid: ["school"], need: "可以調高度的書桌", options: [B.desk], alts: [], reaction: "「桌面斜一點，坐得直多了。」" },
    toddler: { order: 44, time: "18:40", title: "邊煮飯邊顧孩子", text: "要準備晚餐，需要一樣{kid}能專心玩一陣子的東西。", kid: ["toddler", "preschool"], need: "讓孩子自己專心玩一陣子", options: [B.mitoy], alts: [B.shinwa], reaction: "「湯煮好了，{kid}也蓋好一座城堡。」" },
    meals: { order: 46, time: "18:30", title: "孩子吃飯一團亂", text: "{kid}堅持自己吃，桌上地上都是飯粒。", kid: ["preschool", "toddler"], need: "孩子自己練習吃飯的餐具", options: [B.meroware], alts: [], reaction: "「讓{kid}自己吃，練習本來就會弄髒。」" },
    cooking: { order: 48, time: "19:00", title: "今天自己下廚", text: "想煎一盤菜、炒兩道青菜，翻開櫥櫃發現油快用完了。", need: "煎炒都順手的一瓶油", options: [B.avocado], alts: [B.wave], reaction: "「煎得金金黃黃，家裡都說好吃。」" },
    screen: { order: 50, time: "19:30", title: "又在討平板", text: "晚餐後{kid}說無聊。你想試試平板以外的辦法。", kid: ["school", "preschool"], need: "不用螢幕也好玩的東西", options: [B.mitoy, B.zoo], alts: [B.shinwa, B.happymoon], reaction: "「{kid}說：再一次！」" },
    rain: { order: 55, time: "週六", title: "下雨出不去", text: "原本要出門，結果下起大雨，{kid}在家跑來跑去。", kid: ["toddler", "preschool", "school"], need: "雨天在家也能放電", options: [B.happymoon], alts: [B.alzip, B.playzu], reaction: "「玩了一個早上，午覺睡得特別熟。」" },
    clutter: { order: 60, time: "20:30", title: "東西多到收不完", text: "客廳、衣櫃、玩具區，每個角落都在提醒你該整理了。", need: "讓東西都有自己的位置", options: [B.plafarm, B.shoumaji], alts: [], reaction: "「收好之後，家像大了一點。」" },
    packing: { order: 82, time: "出發前", title: "行李箱關不起來", text: "衣服、外套、孩子的東西，怎麼塞都塞不下。", need: "把衣物壓小、分類", options: [B.shoumaji], alts: [B.miamily], reaction: "「一人一袋，到了直接拿。」" },
    outdoor: { order: 84, time: "出遊日", title: "太陽好大", text: "在戶外玩得正開心，太陽大到睜不開眼睛。", need: "戶外的太陽眼鏡", options: [B.kietla, B.rieti], alts: [B.yookido], reaction: "「玩得盡興，眼睛也舒服。」" },
    gift: { order: 90, time: "節日前", title: "送禮送什麼", text: "要送長輩、親戚和朋友，想要大家都喝得慣、拿得出手的。", need: "大家都喝得慣的伴手禮", options: [B.juice], alts: [B.avocado], reaction: "「這份心意，送得剛剛好。」" },
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
      { id: "elder", label: "家中長輩", scene: "gift" },
    ],
    goals: [
      { id: "self", label: "把自己照顧好", title: "自我照顧練習生", line: "想把自己照顧好", scene: "treat" },
      { id: "home", label: "讓家住得更舒服", title: "家的整理師", line: "想讓家住得更舒服", scene: "clutter" },
      { id: "kids", label: "多陪孩子玩、陪孩子長大", title: "陪玩隊長", line: "想多陪孩子玩、陪他們長大", scene: "screen" },
      { id: "trip", label: "全家一起出門走走", title: "出遊規劃師", line: "想帶全家出門走走", scene: "packing" },
      { id: "food", label: "吃得簡單又安心", title: "餐桌安心派", line: "想吃得簡單又安心", scene: "lunch" },
    ],
    worries: [
      { id: "clutter", label: "東西太多收不完", scene: "clutter" },
      { id: "walking", label: "孩子正在學走路", scene: "walking" },
      { id: "meals", label: "孩子吃飯一團亂", scene: "meals" },
      { id: "breakfast", label: "孩子早上吃不下", scene: "breakfast" },
      { id: "screen", label: "功課和螢幕時間", scene: "screen" },
      { id: "rain", label: "下雨天孩子在家放電", scene: "rain" },
      { id: "packing", label: "出門行李好多", scene: "packing" },
      { id: "outdoor", label: "戶外太陽好大", scene: "outdoor" },
      { id: "lunch", label: "午餐總是隨便", scene: "lunch" },
      { id: "cooking", label: "想自己好好煮一頓", scene: "cooking" },
      { id: "gift", label: "逢年過節要送禮", scene: "gift" },
    ],
  };

  root.PlayCharacters = { brands: B, permanentBrands, characters, cast, people, events, petEvents, groups, builder, sceneLibrary, extraAvatars };
})(typeof globalThis !== "undefined" ? globalThis : this);
