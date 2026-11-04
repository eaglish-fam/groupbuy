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
      id: "kexin", name: "林可昕", nick: "可昕", age: 22, gender: "f",
      role: "剛畢業的行銷助理", place: "新北通勤到台北", groups: ["work"],
      color: "#d8a35d", tagline: "第一份工作第三個月，正在學著照顧自己。",
      goal: "把第一份工作做好，也把自己照顧好", goalShort: "照顧好自己",
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
      id: "shihan", name: "黃詩涵", nick: "詩涵", age: 30, gender: "f",
      role: "雙薪家庭的媽媽・會計", place: "桃園", groups: ["mom", "work"],
      color: "#c46b4e", tagline: "女兒小米 14 個月，正扶著沙發學走路。",
      goal: "讓小米安心學走路，自己也能喘口氣", goalShort: "安心育兒",
      story: "詩涵和先生都上班，白天小米給保母帶，晚上和週末是一家三口的時間。小米最近什麼都想摸、什麼都想爬，詩涵最在意的是：家裡怎麼讓她安心探索，自己又能喘口氣。",
      avatar: { skin: "#f1cdb0", hair: "#3a2a22", style: "bob", shirt: "#c46b4e", acc: "none", kid: { skin: "#f6d9c3", hair: "#3a2a22" } },
      day: [
        { time: "06:40", title: "小米醒了就想往下爬", text: "她扶著床邊站起來，搖搖晃晃走了兩步就跌坐下去。客廳木地板很硬，詩涵每次都心頭一緊。", need: "學走路、跌坐時的柔軟地面", options: [B.alzip, B.playzu], alts: [B.mitoy], reaction: "「鋪好之後，她跌坐下去自己拍拍手又站起來了。」" },
        { time: "07:30", title: "早餐自己抓著吃", text: "小米堅持自己吃，蒸地瓜捏得滿桌都是，碗也被推到地上。", need: "孩子自己練習吃飯的餐具", options: [B.deer, B.meroware], alts: [B.locknlock], reaction: "「讓她自己吃吧，練習本來就會弄髒。」" },
        { time: "18:40", title: "邊煮飯邊顧孩子", text: "接回小米後要準備晚餐，她需要一樣小米能專心玩一陣子的東西，最好放進嘴巴也不會讓人太緊張。", need: "讓孩子自己專心玩一陣子", options: [B.mitoy], alts: [B.shinwa, B.giiker], reaction: "「她把積木疊起來又推倒，笑了好久，我終於把湯煮好了。」" },
        { time: "20:00", title: "玩具散滿地", text: "收玩具收到懷疑人生。詩涵想要一個小米長大後自己也會用的收納。", need: "孩子也能一起收的收納", options: [B.plafarm], alts: [B.shoumaji], reaction: "「我們來比賽，誰先把積木放回家！」" },
        { time: "20:30", title: "洗澡時間", text: "小米洗完澡一直扭來扭去，要快快包起來擦乾。", need: "孩子洗澡後的浴巾與小方巾", options: [B.lange], alts: [B.atojet], reaction: "「包起來像一顆小飯糰。」" },
        { time: "22:30", title: "終於輪到自己", text: "孩子睡了、碗洗了，詩涵躺上床時腰還在痠。明天六點半又要起床。", need: "讓大人也睡好", options: [B.emma], alts: [B.blackmores, B.juice], reaction: "「媽媽睡飽，明天才有力氣陪她走路。」" },
      ],
    },
    {
      id: "jiahao", name: "陳家豪", nick: "家豪", age: 37, gender: "m",
      role: "軟體工程師・兩個孩子的爸爸", place: "新竹", groups: ["dad", "work"],
      color: "#4f7a6a", tagline: "6 歲和 9 歲，負責接送和睡前共讀。",
      goal: "少一點螢幕，多一點和孩子一起動手", goalShort: "陪孩子動手",
      story: "家豪下午四點半準時下班去接孩子，那是他和太太說好的分工。回家後功課、晚餐、洗澡、共讀，他想讓孩子少一點螢幕、多一點一起動手的時間。",
      avatar: { skin: "#e8bf9c", hair: "#1f1a17", style: "short", shirt: "#4f7a6a", acc: "glasses", kid: { skin: "#efc9a8", hair: "#1f1a17" } },
      day: [
        { time: "07:10", title: "出門前的水壺大戰", text: "老大說學校的水不好喝，老二的水壺又找不到蓋子。", need: "孩子願意帶、好拆洗的水壺", options: [B.locknlock, B.deer], alts: [], reaction: "「自己的水壺自己背，回家自己拿出來洗。」" },
        { time: "17:00", title: "寫功課姿勢歪歪", text: "老大趴在餐桌寫作業，越寫越低，背也駝了。", need: "可以調高度的書桌", options: [B.desk], alts: [B.knsh], reaction: "「桌面斜一點，她坐得比較直了。」" },
        { time: "19:30", title: "晚餐後不想給平板", text: "孩子說無聊。家豪想要一個全家能一起玩、又會動腦的東西。", need: "不用螢幕也好玩的益智遊戲", options: [B.giiker], alts: [B.shinwa, B.mitoy], reaction: "「爸爸你輸了！再一局！」" },
        { time: "20:40", title: "睡前共讀", text: "老二剛開始認注音，老大已經會自己讀短篇故事。", need: "依年齡選的共讀刊物", options: [B.knsh], alts: [B.giiker], reaction: "「每個月收到新的一期，兩個人都搶著先看。」" },
        { time: "週末", title: "跟孩子做一件作品", text: "家豪想陪孩子做點手作，最後可以留在家裡當紀念。", need: "親子一起動手的木作", options: [B.shinwa], alts: [B.mitoy], reaction: "「這台木車是我們三個一起做的。」" },
      ],
    },
    {
      id: "yating", name: "王雅婷", nick: "雅婷", age: 38, gender: "f",
      role: "業務主管・兩寶媽", place: "台中", groups: ["mom", "travel"],
      color: "#3f7f9a", tagline: "5 歲和 2 歲，每季一定要安排一次全家旅行。",
      goal: "讓全家輕鬆出門、開心回家", goalShort: "全家出遊",
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
      id: "peishan", name: "吳佩珊", nick: "佩珊", age: 33, gender: "f",
      role: "育嬰假中的新手媽媽", place: "台北", groups: ["mom"],
      color: "#9a6fa8", tagline: "寶寶 4 個月，夜奶兩次，正在找回自己的節奏。",
      goal: "照顧好寶寶，也找回自己的節奏", goalShort: "找回節奏",
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
      id: "shufen", name: "許淑芬", nick: "淑芬阿姨", age: 56, gender: "f",
      role: "剛退休、幫忙帶孫的阿嬤", place: "台南", groups: ["senior"],
      color: "#a5803e", tagline: "週間幫女兒帶 3 歲的孫子，週末想讓自己輕鬆一點。",
      goal: "顧好孫子、顧好家，也顧好自己的膝蓋", goalShort: "顧家也顧自己",
      story: "淑芬退休後，生活重心變成孫子和家裡。她很會持家，但膝蓋和腰開始不聽話；逢年過節，她總是張羅送禮和家族聚餐的那個人。",
      avatar: { skin: "#ecc5a6", hair: "#8d8780", style: "short-curl", shirt: "#a5803e", acc: "glasses" },
      day: [
        { time: "09:30", title: "孫子在客廳玩", text: "孫子 3 歲，喜歡把東西堆高再推倒。阿嬤想找安全一點、可以一起玩的玩具。", need: "祖孫一起玩的積木", options: [B.mitoy], alts: [B.shinwa, B.alzip], reaction: "「阿嬤陪你蓋一座城堡。」" },
        { time: "11:00", title: "浴室要刷了", text: "浴缸和角落要彎腰刷，膝蓋越來越吃力。", need: "不用一直彎腰的清潔工具", options: [B.artisan], alts: [B.atojet], reaction: "「站著就刷得到，腰不痠了。」" },
        { time: "15:00", title: "準備中秋送禮", text: "要送親戚和女兒公婆，想要體面、大家都吃得慣的。", need: "送得出手的禮盒", options: [B.fushan], alts: [B.juice, B.eben], reaction: "「先挑口味再裝禮盒，送起來有面子。」" },
        { time: "18:00", title: "家族聚餐加菜", text: "週末全家回來吃飯，她想多加一道菜，又不想在廚房站太久。", need: "加熱就能上桌的料理", options: [B.fushanFrozen], alts: [B.fushan], reaction: "「加熱一下就上桌，大家都說好吃。」" },
        { time: "週末", title: "帶孫子去農場", text: "女兒說要一起去住農場，阿嬤想先看看早餐和活動適不適合老人家和小孩。", need: "三代同行的住宿", options: [B.sanfu], alts: [B.leofoo], reaction: "「三代一起，晚上還去看了夜間導覽。」" },
      ],
    },
    {
      id: "chenghan", name: "李承翰", nick: "承翰", age: 32, gender: "m",
      role: "第一次一個人帶女兒出遊的爸爸", place: "高雄", groups: ["dad", "travel"],
      color: "#5a6fa6", tagline: "女兒 4 歲，太太出差三天，父女倆的冒險。",
      goal: "和女兒完成第一次兩個人的小旅行", goalShort: "父女小旅行",
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
      id: "yizhen", name: "蔡宜蓁", nick: "宜蓁", age: 27, gender: "f",
      role: "新婚、在家工作的插畫家", place: "台北小套房", groups: ["work", "home"],
      color: "#6b8e4e", tagline: "12 坪的家，兩個人、一隻貓，空間要用得很聰明。",
      goal: "12 坪也能住得清爽、工作得順", goalShort: "小家清爽",
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
    { id: "a1", color: "#c9876a", avatar: { skin: "#f3d2b8", hair: "#2b211c", style: "ponytail", shirt: "#c9876a", acc: "none" } },
    { id: "a2", color: "#7a8fb5", avatar: { skin: "#eac3a2", hair: "#4a3326", style: "bob-bangs", shirt: "#7a8fb5", acc: "glasses" } },
    { id: "a3", color: "#8aa070", avatar: { skin: "#f1cdb0", hair: "#1f1a17", style: "long", shirt: "#8aa070", acc: "earrings" } },
    { id: "a4", color: "#b58a4a", avatar: { skin: "#e5b993", hair: "#3a2a22", style: "bun", shirt: "#b58a4a", acc: "none" } },
    { id: "a5", color: "#5d8c8a", avatar: { skin: "#e8bf9c", hair: "#231c18", style: "short", shirt: "#5d8c8a", acc: "none" } },
    { id: "a6", color: "#8c6a9e", avatar: { skin: "#ecc5a6", hair: "#2e2420", style: "short2", shirt: "#8c6a9e", acc: "glasses" } },
    { id: "a7", color: "#a8695a", avatar: { skin: "#ecc5a6", hair: "#9a948c", style: "short-curl", shirt: "#a8695a", acc: "none" } },
    { id: "a8", color: "#6f7d4f", avatar: { skin: "#f5d6bf", hair: "#5b3a2a", style: "bob", shirt: "#6f7d4f", acc: "none", kid: { skin: "#f8dcc8", hair: "#5b3a2a" } } },
  ];

  // 通用的一天場景（給自己建立的角色用）。order 決定在一天裡的先後。
  const sceneLibrary = {
    lost: { order: 10, time: "07:30", title: "出門前找不到鑰匙", text: "包包翻了兩遍，鑰匙不知道又跑去哪裡。", need: "常找不到的東西，留一個線索", options: [B.hereu], alts: [], reaction: "「出門前看一眼手機就知道在哪。」" },
    walking: { order: 12, time: "07:00", title: "孩子正在學走路", text: "扶著家具走兩步就跌坐，地板硬得讓人心驚。", need: "學走路、跌坐時的柔軟地面", options: [B.alzip, B.playzu], alts: [B.mitoy], reaction: "「跌坐下去也不怕，再站起來就好。」" },
    bottle: { order: 14, time: "07:10", title: "出門前的水壺", text: "孩子說學校的水不好喝，水壺的蓋子又找不到。", need: "孩子願意帶、好拆洗的水壺", options: [B.locknlock, B.deer], alts: [], reaction: "「自己的水壺自己背。」" },
    baby: { order: 20, time: "09:00", title: "幫寶寶洗澡", text: "洗完要快快包起來擦乾，拍嗝巾也總是不夠用。", need: "寶寶洗澡與拍嗝用的布巾", options: [B.lange], alts: [B.atojet], reaction: "「多備幾條，洗了晾著也不怕不夠。」" },
    bathroom: { order: 24, time: "10:30", title: "浴室角落又黃了", text: "每次都要彎腰刷很久，拖著拖著又一週。", need: "不用一直彎腰的清潔", options: [B.artisan], alts: [B.atojet], reaction: "「站著就刷得到，終於不拖了。」" },
    lunch: { order: 30, time: "12:30", title: "午餐又隨便吃", text: "忙起來就隨便扒兩口，吃完也不覺得飽。", need: "簡單又能讓午餐像樣一點的食物", options: [B.wave], alts: [B.fushanFrozen, B.juice], reaction: "「五分鐘也能吃得像樣。」" },
    treat: { order: 36, time: "15:30", title: "給自己一點小獎勵", text: "下午有點累，想喝點不一樣的轉換心情。", need: "下午的一點小確幸", options: [B.eben, B.juice], alts: [B.blackmores], reaction: "「喝一口，重新開機。」" },
    homework: { order: 40, time: "17:00", title: "寫功課姿勢歪歪", text: "孩子趴在餐桌寫作業，越寫越低。", need: "可以調高度的書桌", options: [B.desk], alts: [B.knsh], reaction: "「桌面斜一點，坐得直多了。」" },
    toddler: { order: 44, time: "18:40", title: "邊煮飯邊顧孩子", text: "要準備晚餐，需要一樣孩子能專心玩一陣子的東西。", need: "讓孩子自己專心玩一陣子", options: [B.mitoy], alts: [B.shinwa], reaction: "「湯煮好了，他也蓋好一座城堡。」" },
    meals: { order: 46, time: "18:30", title: "孩子吃飯一團亂", text: "堅持自己吃，桌上地上都是飯粒。", need: "孩子自己練習吃飯的餐具", options: [B.deer, B.meroware], alts: [B.locknlock], reaction: "「讓他自己吃，練習本來就會弄髒。」" },
    screen: { order: 50, time: "19:30", title: "又在討平板", text: "晚餐後孩子說無聊。你想試試平板以外的辦法。", need: "不用螢幕也好玩的東西", options: [B.giiker, B.knsh], alts: [B.shinwa, B.mitoy], reaction: "「再一局！」" },
    clutter: { order: 60, time: "20:30", title: "東西多到收不完", text: "客廳、衣櫃、玩具區，每個角落都在提醒你該整理了。", need: "讓東西都有自己的位置", options: [B.plafarm, B.shoumaji], alts: [B.branden], reaction: "「收好之後，家像大了一點。」" },
    sleep: { order: 70, time: "23:00", title: "又是翻來覆去的一晚", text: "躺上床已經很晚了，腦袋還在轉，明天還要早起。", need: "讓睡眠好一點", options: [B.emma], alts: [B.lange], reaction: "「今晚想好好睡一覺。」" },
    trip: { order: 80, time: "週一", title: "這次要住哪裡", text: "想帶家人出去走走，先比較房型、餐食和費用。", need: "適合家人的住宿", options: [B.leofoo, B.caesar], alts: [B.sanfu], reaction: "「先算清楚，出發就不慌。」" },
    packing: { order: 82, time: "出發前", title: "行李箱關不起來", text: "衣服、外套、孩子的東西，怎麼塞都塞不下。", need: "把衣物壓小、分類", options: [B.shoumaji, B.branden], alts: [B.hereu], reaction: "「一人一袋，到了直接拿。」" },
    outdoor: { order: 84, time: "出遊日", title: "太陽好大、蚊子好多", text: "在戶外玩得正開心，曬和叮都來了。", need: "戶外的防曬和防蚊", options: [B.kietla, B.parakito], alts: [B.rieti], reaction: "「玩得盡興，回家也舒服。」" },
    gift: { order: 90, time: "節日前", title: "送禮送什麼", text: "要送長輩、親戚和朋友，想要體面又吃得慣的。", need: "送得出手的禮盒", options: [B.fushan], alts: [B.juice, B.eben], reaction: "「這份心意，送得剛剛好。」" },
  };

  const builder = {
    ages: ["20 多歲", "30 多歲", "40 多歲", "50 歲以上"],
    rhythms: [
      { id: "commute", label: "每天通勤上班" },
      { id: "home-work", label: "在家工作" },
      { id: "leave", label: "育嬰假中" },
      { id: "carer", label: "全職照顧家裡" },
      { id: "retired", label: "退休了" },
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

  root.PlayCharacters = { brands: B, characters, events, groups, builder, sceneLibrary, extraAvatars };
})(typeof globalThis !== "undefined" ? globalThis : this);
