# 北海道 v1｜候選內容與逐圖採用紀錄

| 目標 | 驗收點 | 做到哪 | 沒做什麼 | 下一步給誰 |
|---|---|---|---|---|
| 日本入口與北海道親子系列第一版候選 | 同族模板、可追來源、真圖、noindex、三種寬度 | 日本、旭川、札幌三頁候選；27 張圖、9 站各三張；6 條城市建議路線 | 七天逐日日序仍缺，第四頁未渲染；共用測試／桌機目錄／國家大圖 sizes 尚待修；沒有發布核准 | Grace 修工程；Bingo 轉作者確認日序；Codex 接回驗收 |

## 本版採用範圍

- 公包 `trip/data/japan-approved-travel-v1.json`；獨立候選登錄 `publication:false`，不改正式公包。
- 日本入口僅收旭川、札幌；小樽段落保留在路線篇編輯稿，待七天日序確認後接第四頁與小樽／新千歲地圖點。沒有建立小樽城市篇或虛構日程。
- 城市正文 9 站：旭山動物園、科學館、博物館、拉麵村、大黑屋；手稻、白色戀人、AOAO、Ario。Ario 是生活補給用途，未把它寫成必去景點。
- 11 張自家社群原照，16 張乾淨影片畫格。另有 7 個 3:2 短卡專用裁切、每個 4 份 WebP；原正文照片保留來源比例。共 136 個新 WebP。
- 所有 27 張正文原衍生圖及 7 個短卡裁切均逐張檢視；實際模板另在 1440／390／320 開啟。每站以不同內容組成一主兩輔，沒有用重複裁切充三張。
- 來源雜湊、畫格 PTS/timebase、原始尺寸、activePicture 與每個衍生圖 hash/尺寸在公包保存。私有原檔、完整逐字稿與驗收截圖不進 repo。

## 圖片採用與人物判斷

照片來源日期採貼文公開日期；不把貼文日期當作精確拍攝日。影片畫格的來源年份是此次 2026 年 3 月旅程，精確日序仍待確認。

| assetId | 來源／圖序或時碼 | 人物與用途判斷 |
|---|---|---|
| `zoo-bear-children` | [來源](https://www.instagram.com/eaglish.fam/p/DV6AWntk_oO/?img_index=3)；原貼文照片 | 自家人物／活動主體；未採陌生旅客特寫，保留人物重點與臉部。 |
| `science-bubble` | [來源](https://www.instagram.com/eaglish.fam/p/DV6AWntk_oO/?img_index=8)；原貼文照片 | 自家人物／活動主體；未採陌生旅客特寫，保留人物重點與臉部。 |
| `daikokuya-grill` | [來源](https://www.instagram.com/eaglish.fam/p/DV6AWntk_oO/?img_index=10)；原貼文照片 | 自家人物／活動主體；未採陌生旅客特寫，保留人物重點與臉部。 |
| `asahiyama-bear-entry` | [來源](https://www.youtube.com/watch?v=6YEfYUrGAbw&t=1421)；PTS 42651609; timebase 1/30000 | 場景、物件或動物主體；未以可辨識陌生旅客作主角。 |
| `zoo-family-terrace` | [來源](https://www.instagram.com/eaglish.fam/p/DV6AWntk_oO/?img_index=1)；原貼文照片 | 家人合照，含嬰兒臉部；需 Hiram 審閱本張採用。 |
| `science-platform` | [來源](https://www.youtube.com/watch?v=6YEfYUrGAbw&t=1810)；PTS 54300246; timebase 1/30000 | 自家人物／活動主體；未採陌生旅客特寫，保留人物重點與臉部。 |
| `science-gyroscope` | [來源](https://www.instagram.com/eaglish.fam/p/DV6AWntk_oO/?img_index=7)；原貼文照片 | 自家人物／活動主體；未採陌生旅客特寫，保留人物重點與臉部。 |
| `museum-overview` | [來源](https://www.youtube.com/watch?v=6YEfYUrGAbw&t=2015)；PTS 60450390; timebase 1/30000 | 場景、物件或動物主體；未以可辨識陌生旅客作主角。 |
| `museum-tools` | [來源](https://www.youtube.com/watch?v=6YEfYUrGAbw&t=2010)；PTS 60300240; timebase 1/30000 | 場景、物件或動物主體；未以可辨識陌生旅客作主角。 |
| `museum-daily-life-case` | [來源](https://www.youtube.com/watch?v=6YEfYUrGAbw&t=2082)；PTS 62463401; timebase 1/30000 | 場景、物件或動物主體；未以可辨識陌生旅客作主角。 |
| `ramen-bowl` | [來源](https://www.youtube.com/watch?v=6YEfYUrGAbw&t=269)；PTS 8070062; timebase 1/30000 | 場景、物件或動物主體；未以可辨識陌生旅客作主角。 |
| `ramen-aoba-sign` | [來源](https://www.youtube.com/watch?v=6YEfYUrGAbw&t=78)；PTS 2359357; timebase 1/30000 | 場景、物件或動物主體；未以可辨識陌生旅客作主角。 |
| `ramen-guide-plaque` | [來源](https://www.youtube.com/watch?v=6YEfYUrGAbw&t=236)；PTS 7083076; timebase 1/30000 | 場景、物件或動物主體；未以可辨識陌生旅客作主角。 |
| `daikokuya-food-spread` | [來源](https://www.youtube.com/watch?v=6YEfYUrGAbw&t=2302)；PTS 69071002; timebase 1/30000 | 場景、物件或動物主體；未以可辨識陌生旅客作主角。 |
| `daikokuya-family` | [來源](https://www.instagram.com/eaglish.fam/p/DV6AWntk_oO/?img_index=11)；原貼文照片 | 自家原公開合照，含同框店員；請作者審閱。 |
| `teine-child-board` | [來源](https://www.instagram.com/eaglish.fam/p/DWBtEzKkxgm/?img_index=13)；原貼文照片 | 自家人物／活動主體；未採陌生旅客特寫，保留人物重點與臉部。 |
| `shiroi-workshop` | [來源](https://www.facebook.com/photo/?fbid=1492205499581345&set=pcb.1492205576248004)；原貼文照片 | 自家人物／活動主體；未採陌生旅客特寫，保留人物重點與臉部。 |
| `aoao-family-eels` | [來源](https://www.facebook.com/photo/?fbid=1492205486248013&set=pcb.1492205576248004)；原貼文照片 | 自家人物／活動主體；未採陌生旅客特寫，保留人物重點與臉部。 |
| `teine-family` | [來源](https://www.instagram.com/eaglish.fam/p/DWBtEzKkxgm/?img_index=1)；原貼文照片 | 自家人物／活動主體；未採陌生旅客特寫，保留人物重點與臉部。 |
| `teine-conveyor` | [來源](https://www.instagram.com/eaglish.fam/p/DWBtEzKkxgm/?img_index=7)；原貼文照片 | 自家人物／活動主體；未採陌生旅客特寫，保留人物重點與臉部。 |
| `shiroi-entrance` | [來源](https://www.youtube.com/watch?v=jgQ2CHrQ6fg&t=359)；PTS 10788778; timebase 1/30000 | 場景、物件或動物主體；未以可辨識陌生旅客作主角。 |
| `shiroi-hall` | [來源](https://www.youtube.com/watch?v=jgQ2CHrQ6fg&t=235)；PTS 7050043; timebase 1/30000 | 場景、物件或動物主體；未以可辨識陌生旅客作主角。 |
| `aoao-seahorse` | [來源](https://www.youtube.com/watch?v=jgQ2CHrQ6fg&t=627)；PTS 18810792; timebase 1/30000 | 場景、物件或動物主體；未以可辨識陌生旅客作主角。 |
| `aoao-garden-eels` | [來源](https://www.youtube.com/watch?v=jgQ2CHrQ6fg&t=630)；PTS 18900882; timebase 1/30000 | 場景、物件或動物主體；未以可辨識陌生旅客作主角。 |
| `ario-entrance` | [來源](https://www.youtube.com/watch?v=jgQ2CHrQ6fg&t=883)；PTS 26492466; timebase 1/30000 | 自家人物／活動主體；未採陌生旅客特寫，保留人物重點與臉部。 |
| `ario-child-toys` | [來源](https://www.youtube.com/watch?v=jgQ2CHrQ6fg&t=892)；PTS 26779753; timebase 1/30000 | 自家人物／活動主體；未採陌生旅客特寫，保留人物重點與臉部。 |
| `ario-breeze-sign` | [來源](https://www.youtube.com/watch?v=jgQ2CHrQ6fg&t=914)；PTS 27445418; timebase 1/30000 | 場景、物件或動物主體；未以可辨識陌生旅客作主角。 |

### 嬰兒影像審閱清單

本版唯一採用的嬰兒臉部照片：`zoo-family-terrace`，公開檔 `trip/assets/hokkaido-g3-zoo-family-terrace-v1.webp`，用於旭山動物園正文輔圖與短卡原照並排。候選圖中的其他嬰兒影像未一併採用。這份清單交作者審閱，未宣稱已獲最終採用核准。

## 文字與事實取捨

- 依作者確認：三月七天、札幌 Airbnb 基地、iSKI 合作；一月圓山排除，9 天 Short 標題筆誤。住宿不放地址、房源或未核房型。
- 未把 ASR 的相對事件轉成 D1–D7，也未把影片集數當日數。住宿敘事與舊逐字稿相對時間的衝突留在私有釐清，不把推測寫給讀者。
- 手稻雪場以 iSKI 第一方家庭頁、官方課程與影片佐證；合作揭露只在札幌篇文末，未延伸成其他店家或整趟受邀。
- 棕熊照片寫棕熊；故事另寫當次看的北極熊，沒有混稱。青葉門面不等於已證實實吃青葉；米其林牌匾只描述拍攝時 2012／2017 收錄字樣。
- 啤酒博物館當次抵達太晚、未入館，保留交通段短記。沒有以館內素材冒充實訪；沒有乾淨外觀圖便不造三圖景點。
- 新票價與年末休館按官方現況（2026-10-21～22 查核）寫，與三月故事分開。科學館已於 10/1 改價；白色戀人冬季園區時間與付費設施、手作末場分開。
- 城市試排是建議，不等同作者七天實際日表。未核實的完整冬季日曆、滑雪幼兒安排與預約條件保留確認，不顯示保證可行。

## 候選驗收與剩餘工作

- 三頁含 `noindex,nofollow`，無 site-runtime／GA；未進 sitemap、首頁或世界地圖。預覽私下交付。
- 三種寬度已實看，短卡、地圖地名、城市切換、FAQ、兩城六條路線／逐日切換已操作。首次短卡到正文標題未被標頭蓋住。
- **未通過**：桌機 TOC 第一列被標頭遮蓋；國家城市大圖 sizes 與實際欄寬不符；`npm run verify` 531／532，一項共用測試將候選登錄寫死為空。均在同次工程需求／PR #57 回報，未自行改共用程式。
- 分享按鈕顯示已複製，但本次瀏覽器讀回剪貼簿為空，未將分享持久化列為已驗收。
- 第四頁、互鏈、小樽／機場路線地圖點、四頁全部通過尚未完成。精確七天日序的合併問題已交 Bingo 轉作者，沒有重問已確認的四項。
- 截圖只在 M5 橋接；本文和 PR 僅列檔名。PR 保持 Draft，未合併、未發布、未發社群或通知。
