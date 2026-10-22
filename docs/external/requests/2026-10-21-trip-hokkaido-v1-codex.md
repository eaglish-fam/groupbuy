# Bingo → Codex：日本入口＋北海道旭川＋札幌 7 天（第一版候選）

寄件：Bingo（Grokbot，團購營運與鷹家遠行所）｜2026-10-21 23:40（台灣時間）
經手：照 `docs/collab/COLLAB.md` 第 3 節，Bingo 的工作建議放這個資料夾，由 Grace 確認分工；Hiram 2026-10-21 指定遠行所新文章的寫文和地圖由 Codex 做、元件和工程由 Grace 做，所以這張直接寫給 Codex，副本給 Grace。工程需求另見同日的 `2026-10-21-trip-hokkaido-v1-grace.md`。

| 目標 | 驗收點 | 做到哪 | 沒做什麼 | 下一步給誰 |
|---|---|---|---|---|
| 做出 4 頁第一版候選：日本入口頁、北海道旭川＋札幌 7 天路線篇、旭川城市篇、札幌城市篇，先給 Hiram 看 | 規格、風格、地圖、卡片和標竿篇一致；每個事實都有第一手或官方來源；有 noindex 預覽網址和 1440／390／320 截圖；**沒合併** | 素材盤點、寫作順序和形式都已經由 Hiram 核准（Eliora B 審閱版 v3） | Bingo 沒寫內文、沒改網站、沒選照片 | **Codex**：補缺口 → 寫文 → 選圖 → 開候選 PR；需要改共用程式的地方給 **Grace** |

## 1. Hiram 已定的事（2026-10-21，第一手）

- 這趟是 **2026 年 3 月，7 天**。這是 Hiram 親口確認的，用 7 天寫。合輯 `2Y6go4ITpAM` 標題也寫「七天六夜」。
- 主線：**第一次帶 7 個月大的寶寶出國**（影片 `vH6EMGtzvdE` 標題已公開這件事）。
- 形式：**路線篇 1 篇＋旭川城市篇＋札幌城市篇**，三篇互相連結，內容不互抄。路線篇講「7 天怎麼排、怎麼移動、為什麼這樣排」；城市篇講「這座城市每站玩什麼」。小樽（`nAKoy93DtQw`）只放在路線篇的段落裡，這次不開小樽城市篇（小樽篇排在余市＋Kiroro 那條）。
- 日本目前**沒有國家入口頁**（`/trip/japan/` 是 404）。這次要一併做入口頁，收錄範圍照實寫，先只有北海道這兩座城市。
- 品質優先。第一版先給 Hiram 看，他核准前不上線、不合併。
- 合作或受邀：只有**核實過**是合作或受邀的篇章，才在文末加一句「本行程為受邀或合作體驗」。有優惠碼或 hashtag 不算證據。
- 大人行程也可以寫，但這篇主線是親子。

## 2. 標竿篇（照這兩組做，不要另創版型）

| 用途 | 標竿 | 正式網址 | repo |
|---|---|---|---|
| 城市篇 | **斯瓦巴**（v1.7 長文五項的範例：背景、真實故事、交通圖解、重要知識、實住住宿；也是冬季、寒地、帶孩子的題材） | https://www.eaglish.store/trip/guides/svalbard-with-kids/ | `trip/data/europe-malaysia-approved-travel-v1.json` 的 `cities[id=svalbard]` |
| 城市篇（照片與試排） | **吉隆坡**（v1.9：已登入 IG 原照採用、2–4 天兩種步調的試排） | https://www.eaglish.store/trip/guides/kuala-lumpur-with-kids/ | 同檔 `cities[id=kuala-lumpur]` |
| 入口頁＋路線 | **挪威入口**（真實地理地圖加離島框、城市卡、「旅行路線靈感」參考日程 `referencePlans`、「把城市與移動日串起來」的國家試排） | https://www.eaglish.store/trip/norway/ | 同檔 `countries[id=norway]` |

版型和視覺的正本是泰國組（`/trip/thailand/`、清邁），上面三篇都用同一套奶油砂岩元件。紐西蘭的 `/trip/new-zealand/christchurch/3-days/` 是舊版路線頁，試排放在 FAQ 前面，**不要照它**。

## 3. 必須一致的規格和元件

先讀：`AGENTS.md`、`docs/trip-editorial-guidelines.md`（v1.9，特別是第三、四、八節）、`docs/trip-city-guide-template.md`、`trip/IMAGE_PIPELINE.md`、`docs/trip-approved-package-adapter.md`。

- **資料格式**：核准旅行公包 JSON，schema 是 `eaglish.approved-travel-package/v1`，驗證器在 `trip/approved-travel-contract.mjs` 的 `validateApprovedTravelPackage`。建議新檔 `trip/data/japan-approved-travel-v1.json`，要不要併進現有檔、怎麼登錄，由 Grace 決定。`tests/fixtures/travel-approved-package.mjs` 是假資料，只看格式，不能抄內容。
- **城市篇閱讀順序**：首屏（麵包屑 → 英文 eyebrow → H1 主標＋次標 → 兩句導讀，背景長的話用三到四段的 `longform-context/v1` → 署名和更新日 → 一主兩輔三張圖）→ 看圖挑景點（3:2 短卡，桌機三欄、手機兩欄；卡上只放名稱、玩法、時間）→ 景點詳解（每站一主兩輔三張互補實拍；`facts` 六欄：是什麼、玩什麼、怎麼去、留多久、何時能去、雨天或特殊條件；`story.paragraphs` 照「選擇原因 → 現場行動 → 具體細節 → 結果」寫）→ 飲食 → 住宿 → 交通 → 雨備 → FAQ → `#plan` 試排 → 完整影片 → 延伸閱讀。
- **入口頁**：對照挪威的 `countries[]` 欄位：`title`、`subtitle`、`metadataTitle`、`description`、`intro`（剛好兩句）、`image`、`geographicMap`、`presentation`（`citySummaries`、`themes`、`placeThemes`）、`transport`、`faq`、`allocation`、`referencePlans`、`packing`、`videos`、`related`、`discovery`。入口選單用「旅行總覽」，國名上方寫「🇯🇵 Japan」。
- **地圖**：`geographicMap` 用既有的 Natural Earth 幾何（`trip/globe-land.json`），由 `scripts/trip-approved-country-map.mjs` 用 d3-geo 和 topojson 畫。你提供的是 `views[].bounds`（西、南、東、北）、`points[].point:[經度, 緯度]`，每個點都要附 `sourceIds`，座標從官方或可靠來源查，不能猜；再加 `caption` 和 `connections`（旭川 ↔ 札幌 ↔ 小樽、新千歲機場）。建議兩個視角：日本全圖、北海道放大。圖上要標「示意」，不當導航用。不要複製紐西蘭的地形，也不要自己畫道路。
- **路線篇**：現在的公包沒有獨立的「路線篇」頁型。路線的日程資料先照 `referencePlans` 的格式寫（`calendarDays: 7`，每天有 `day`、`kind`、`destination`、`paragraphs`），城市篇的試排照 `planner.routes`、`planner.rules` 的格式寫。頁面的長相和路由由 Grace 決定，你先把資料寫齊。
- **圖片**：`trip/assets/` 放不含尺寸後綴的 WebP，建置時自動產生 640、960、1440 三種寬度，預算分別是 120 KB、220 KB、400 KB（新公包的 1440 是 400 KiB）。`assets[]` 要記 `lineage`：原圖 sha256、尺寸、`activePicture`；影片畫格另外記 `pts` 和 timebase。照片要滿版、不切到臉，不補背景、不拉伸、不打碼。
- **視覺**：奶油砂岩色票（`#f2eee5`、`#faf7f0`、`#fcfaf5`、`#494139`、`#dcd5c9`），H3 用暖棕 `#784b39` 加 `#bb7658` 3px 左線，標題用宋體。**不要另寫 CSS**。
- **字數上限**：H1 約 40 字；H2、H3 約 28 字；導讀兩句共 120 字；短卡 18／12／12 字；每站特色 220 字；家庭紀錄 160 字；FAQ 答案 140 字；caption 45 字；alt 70 字。

## 4. 來源清單（只能用這些和你另外查到的第一手或官方來源）

**YouTube（@eaglish.family）**

| 用途 | 影片 |
|---|---|
| 旭川：嬰兒出國、婆媳二打三 | [vH6EMGtzvdE](https://www.youtube.com/watch?v=vH6EMGtzvdE) |
| 旭川：科學館、博物館、美食 | [6YEfYUrGAbw](https://www.youtube.com/watch?v=6YEfYUrGAbw) |
| 札幌市區：白色戀人、啤酒博物館等 | [jgQ2CHrQ6fg](https://www.youtube.com/watch?v=jgQ2CHrQ6fg) |
| 札幌：新手親子滑雪、一對一私人課 | [J2CcCvsu0gM](https://www.youtube.com/watch?v=J2CcCvsu0gM) |
| 小樽（只放進路線篇） | [nAKoy93DtQw](https://www.youtube.com/watch?v=nAKoy93DtQw) |
| 7 天合輯 | [2Y6go4ITpAM](https://www.youtube.com/watch?v=2Y6go4ITpAM) |
| **歸屬待核，先不要用**：North Snow Land、圓山動物園、北極熊 | [bJb8KGwDito](https://www.youtube.com/watch?v=bJb8KGwDito) |
| **歸屬待核，先不要用**：Shorts「這次 9 天的北海道假期結束了」 | [xCLZBsDipis](https://www.youtube.com/shorts/xCLZBsDipis) |
| 待核：Shorts 納豆和滑雪 | [ca-0iRyTn84](https://www.youtube.com/shorts/ca-0iRyTn84) |

**Instagram（@eaglish.fam）**

- 旭川：[DV6AWntk_oO](https://www.instagram.com/eaglish.fam/p/DV6AWntk_oO/)（旭山動物園、科學館、博物館）
- 札幌：[DV8gjUFE01b](https://www.instagram.com/eaglish.fam/reel/DV8gjUFE01b/)（旭川轉札幌、兩天滑雪）
- 千歲、札幌，歸屬待核：[DTSlVfNE2QH](https://www.instagram.com/eaglish.fam/p/DTSlVfNE2QH/)（2026-01-09 發布，North Snow Land、圓山動物園）
- 其他原照：用 M5 既有瀏覽器的**已登入** IG 和 Facebook，主動翻 2026 年 3 月前後的輪播和相簿，記下帳號、搜尋範圍和圖序（v1.9 第四節）。

**M5 上的逐字稿和索引**（Eliora 的 workspace，`$ELIORA_WS` = M5 上 Eliora 的 `workspace` 目錄）

- 影片索引：`$ELIORA_WS/projects/taiwan-travel-atlas-20260930/sources/alma-handoff/youtube-source-index-v1.json`（2026-09-30 快照，501 筆，記錄每支影片有沒有逐字稿、在哪裡）。上表長片都有 ASR（`local_asr`），專有名詞要對照畫面校正。
- 合輯 ASR：`$ELIORA_WS/projects/taiwan-travel-atlas-20260930/sources/youtube/compilation-g9-v1/2Y6go4ITpAM/transcript-raw.json`，同目錄有 `chunk-*-review-v1.json`。
- 閱讀紀錄：`$ELIORA_WS/projects/taiwan-travel-atlas-20260930/sources/tova-hokkaido-semantic-read-v1/readcoverage-checkpoint-022-v1.json`（4,399 段 ASR 都讀過，但 `originalVideoViewed=false`，**當時是為台灣篩選讀的，不能當成日本已審完**）。
- 盤點、審閱版：`~/agent-bridge/bingo-eliora/archive/` 裡 20261021 的日本準備度 v3 和「鷹式一家去過的地方」。
- 流程範本：`$ELIORA_WS/projects/malaysia-travel-20261012/briefs/country-goal-prompt-template-v5.md`，換國家的執行 prompt，照現行協作規則用，**不沿用裡面的直接發布授權**。

## 5. 先補這幾個缺口再寫（補不到就停在那裡，寫進 PR 的「沒做什麼」）

1. **住宿名稱**：旭川可能是 Airbnb，札幌不知道住哪。從影片畫面、ASR、IG 確認；確認不了就請 Bingo 轉問 Hiram。Airbnb 只寫區域、房型怎麼用、交通，**不寫地址或房源連結**；Hiram 說要保密的，公開檔一律不寫。
2. **雪場名稱**：札幌私人滑雪課是在哪個雪場、哪家業者。標題有 `#iSKI`，合作或受邀的性質要核實（官方頁、影片說明欄、家人確認），核實了才加揭露句。
3. **圓山動物園算不算這一趟**：`DTSlVfNE2QH`（2026-01 發布）和 `bJb8KGwDito` 看起來是 2026 年 1 月另一趟。確認前不要寫進 3 月這趟的路線和城市篇。
4. **「9 天」Shorts**：`xCLZBsDipis` 標題寫 9 天，跟 Hiram 確認的 7 天不一樣。先查它是不是別趟（例如 1 月那趟，或 2024 年余市那趟）。**一律用 7 天**；有證據顯示有衝突，就回報，不要自己改。
5. **原始照片**：每個正文景點都要一主兩輔三張互補畫面。先找已登入 IG 和 Facebook 的原照，不夠才用乾淨的影片畫格（記錄 PTS 和裁切）。要排除以陌生旅客為主體的畫面，特別是別人家的孩子。**嬰兒的臉要不要露出、可以露多少**，第一版先照家裡過去在公開社群的做法選，在 PR 列出每張有嬰兒的圖，交給 Hiram 審。
6. **7 天的日序**：每天在哪座城市、怎麼移動（例如旭川到札幌搭電車還是開車、新千歲機場怎麼進出），從影片和 IG 找證據。不能從影片集數推天數，也不能把不同天的片段拼成同一天。
7. **現況事實**：營業時間、票價、兒童免費條件（例如「科學館小朋友不用錢」）、冬季休館、交通，都要查官方來源並記查詢日期。當年的體驗和現在的規定分開寫。

## 6. 不能做的事

- **不編造**：沒有來源的使用感受、孩子的反應、對話、店名、房型、天數都不能寫。精確引語要有原話可查，其他用自然轉述。
- 對外文章**不放內部查核說明**（素材審核狀態、模型判讀、「待核」這類字），這些留在資料文件。
- 不寫私人資訊：孩子的全名和學校、家人的帳號、LINE 內容、廠商的商業條件。repo 是公開的。
- 不改共用程式（`scripts/`、`tests/`、`trip/*.mjs`、`trip/*.css`），需要的改動寫給 Grace。
- **不合併、不推 main**，也不發 LINE、Telegram 或任何社群貼文。

## 7. SEO 方向（定稿由你決定）

標題寫清楚地點和讀者會問的問題，不堆關鍵字。以下是 Bingo 的草稿，不是定稿：

- 入口頁：「日本親子旅行｜北海道旭川、札幌實訪路線與攻略｜鷹家遠行所」
- 路線篇：「北海道 7 天親子路線：旭川＋札幌，第一次帶嬰兒出國怎麼排」
- 旭川篇：「旭川親子攻略：動物園、科學館與冬天室內行程」（景點以核實的為準）
- 札幌篇：「札幌親子攻略：市區一日玩法與新手滑雪課」（景點以核實的為準）

FAQ 先回答讀者實際會搜的問題：幾個月大的嬰兒可以去北海道嗎、冬天要穿什麼、旭川和札幌之間怎麼移動、孩子第一次滑雪要上什麼課、下雪天有什麼室內行程。答案只寫有來源的內容。

## 8. 交付方式

1. 分支用 `codex/trip-hokkaido-v1-20261021`，commit 開頭寫 `content:`。只動內容的範圍：`trip/data/` 的日本公包、`trip/assets/` 的新 WebP、`docs/` 的來源和選圖紀錄。
2. 開 **Draft PR 到 `main`**，標題「content: 日本入口＋北海道旭川札幌 7 天（第一版候選，不合併）」。PR 內文寫五欄，再附：
   - **預覽網址**：noindex 候選。可以在 M5 開本機伺服器走 Tailnet HTTPS（Hiram 的手機要開得了），或用 Grace 的私人預覽頁。網址寫在 PR 或私下給 Hiram；如果網址不能公開，就寫「已私下交付」。
   - **截圖**：4 頁各拍 1440、390、320px 三種寬度，手機版要包含首屏、看圖挑景點、地圖、試排。照 COLLAB 第 5 節，截圖**不放進 repo**，放到 M5 的 `~/agent-bridge/bingo-eliora/to-bingo/`，PR 裡只寫檔名。
   - 來源表、每張圖的來源和人物判斷、缺口清單、`npm run verify` 的實際結果（沒跑就寫沒跑）。
3. 工程上要 Grace 接的部分（路由、路線篇頁型、地圖城市白名單、字型子集、登錄），在 `docs/collab/requests/ask-20261021-trip-hokkaido.md` 開需求，或直接回覆 Grace 那張派工單。
4. 做完在 #40 留一則五欄留言；需要 Bingo 驗收或轉問 Hiram 的事，寫一份到 `~/agent-bridge/bingo-eliora/to-bingo/`。

## 9. 驗收標準（Bingo 會照這份驗收，再交給 Hiram）

- [ ] 4 頁都在預覽網址打得開，`noindex`，不進 sitemap。
- [ ] 城市篇的閱讀順序和斯瓦巴、吉隆坡相同，`#plan` 在 FAQ 後、影片前。
- [ ] 入口頁有真實地理地圖（日本全圖＋北海道），點和同樣內容的文字按鈕都能進城市篇或路線篇；手機 320px 地名不重疊。
- [ ] 三篇互相連結，路線篇和城市篇沒有整段重複。
- [ ] 每個正文景點三張互補實拍，滿版、不切臉、沒有內部空帶；沒有以陌生人為主體的照片；每張有嬰兒的圖都列給 Hiram 看。
- [ ] 每站的六個問題都答得出來；營業時間和票價有官方來源和查詢日期；當年的體驗和現在的規定分開寫。
- [ ] 7 天的日序有證據，抵達日、離境日、移動日沒被當成完整遊玩日。
- [ ] 圓山、9 天 Shorts、住宿、雪場四個缺口：有結論，或明確寫「未解決」並說明怎麼處理。
- [ ] 揭露句只出現在核實過的篇章。
- [ ] 公開文字裡沒有內部查核字眼、私人路徑或個資。
- [ ] `npm run build:trip`、`npm run verify` 的實際結果寫在 PR。
- [ ] 1440、390、320 三種寬度的截圖都交了；第一次點目錄或短卡時，標題沒被 sticky 標頭蓋住。
- [ ] PR 仍是 Draft，沒合併。

## 補充：Hiram 2026-10-21 23:27 親口確認（第一手，優先於素材推測）
- 住宿：全程住札幌的 Airbnb；旭川沒有過夜（當日往返或途經）。公開文只寫札幌區域與使用方式，不寫地址或房源連結。
- 札幌滑雪的 iSKI 是合作：該段所在篇章文末加「本行程為受邀或合作體驗」。
- 天數一律 7 天；標「9 天」的 Shorts 是標題筆誤，不另成一趟。
- 円山動物園是 2026 年 1 月另一趟，不寫進 3 月這趟。

## Hiram 照片核准（2026-10-22 08:11 台北）

- `zoo-family-terrace`（旭山動物園輔圖）：可用。
- `daikokuya-family`（大黑屋合照）：可用。

## Hiram 照片核准（2026-10-22 08:11 台北）

- `zoo-family-terrace`（旭山動物園輔圖）：可用。
- `daikokuya-family`（大黑屋合照）：可用。

## 更正：旭川有住（Hiram 2026-10-22 08:14 台北）

- 取代上方「旭川沒住、全程札幌 Airbnb」：旭川和札幌都有住 Airbnb。合輯 ASR「明天離開旭川前往札幌」成立。
- 日序請改成旭川住宿段、移動、札幌住宿段。公開頁不放房源連結或地址。

## 交通與付款（Hiram 2026-10-22 11:00 台北）

- 以 JR、地鐵等大眾運輸為主，也常叫 Uber。
- 進出新千歲機場：Hiram 印象是 JR，但不確定。只能寫「通常搭 JR，也常用 Uber」，不要寫成確定的親身路線。
- 旭川往返札幌：先從影片核實；查不到就寫一般建議，不寫成親身經歷。
- 付款：Uber 可以直接刷卡；計程車大多能刷卡，但有要付現的風險。小攤販、老店常只收現金，所以盡量刷卡，把現金留給只收現金的地方。可以做成一張實用提醒卡。
