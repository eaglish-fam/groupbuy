# Codex → Grace：日本4頁候選工程支援

| 欄位 | 內容 |
|---|---|
| 目標 | 依 `docs/external/requests/2026-10-21-trip-hokkaido-v1-grace.md` 支援日本入口、旭川札幌7天路線、旭川與札幌城市候選 |
| 驗收點 | 獨立日本公包 noindex，不進首頁/世界/ sitemap；既有Europe/Malaysia6頁內容不變；重用斯瓦巴/KL/挪威元件；1440/390/320無溢出、首跳與後置plan可操作 |
| 做到哪 | Codex分支 `codex/trip-hokkaido-v1-20261021` 從 `origin/main` 1960de1建立；開始來源缺口研究與原照盤點。將提供 `trip/data/japan-approved-travel-v1.json`、新WebP與來源表；目前尚未定稿 |
| 沒做什麼 | 沒改共用程式、沒有登錄候選或正式發布，沒有編造7日日序、住宿、雪場/合作性質；沒有合併 |
| 下一步給誰 | Grace：決定下述工程契約與分支，於PR40回覆；Codex依固定契約交資料，再整合Grace核定實作跑build/verify與親驗 |

## 請先確認的接點

1. 單一登錄不能把publication=false套到現有正式包。請支援獨立日本候選登錄，保留現有公開輸出。
2. 路線頁選 A（獨立route）或 B（region+referencePlans）請由Grace定，記DECISIONS並給精確資料欄位；Codex先按referencePlans保存已核日序，不用集數猜日數。
3. 建議路徑 `/trip/japan/`、`/trip/japan/hokkaido-asahikawa-sapporo-7-days/`、`/trip/guides/asahikawa-with-kids/`、`/trip/guides/sapporo-with-kids/`。
4. 地圖重用Natural Earth，日本全圖/北海道視角，接旭川/札幌/小樽/新千歲機場可靠座標；小樽和機場可href到路線段落。點/文字入口一致。請解除只接受既有歐洲城市的hardcoded白名單，不能臨時造道路。
5. 字型子集含旭川、札幌等新標題；同Songti系統和既有延後載入。手機320地名標籤不重疊。
6. 候選資料未完成前可用synthetic fixture驗機制，但不可當作真實文章/來源或照片驗收。請交工程branch/commit、契約、實際測試與未做項，不合併。

Codex最後交Draft PR及私下noindex Tailnet預覽；截圖僅M5橋接資料夾，公開repo只列檔名。工程請沿三線協作，不發Telegram/LINE。

## 來源補充對工程語意的影響（同日）

派工補充已確認住宿基地為札幌Airbnb；旭川無過夜。請勿讓日本入口的城市選擇器強制產生「旭川入住/退房/跨城換宿」。現有country allocation假設分配城市停留與移動日；若不適用札幌基地的往返結構，請Grace採明確支持的日遊/固定路線方式，不能用假住宿或虛構移動日讓模型過驗證。實際7日日序仍查核，未定前不以fixture或推薦路線冒充歷史日程。

現行 `renderMultiViewCountryMap` 已存在，但目前驗證每個point需為公包city且href屬該guide；小樽/機場點須由Grace提供可驗證的route-anchor語意，不能額外開兩座假城市。Codex提供經核座標與來源。

## 真實公包整合後的測試阻擋（2026-10-22）

| 目標 | 驗收點 | 做到哪 | 沒做什麼 | 下一步給誰 |
|---|---|---|---|---|
| 讓實際候選登錄可通過共用測試 | 真實候選存在時通過，非法 publication／碰撞仍 fail closed | Codex 接上日本入口、旭川、札幌三頁的真圖候選；build:trip 成功。verify 跑到 532 tests，531 pass、1 fail | 沒改 tests，也沒清掉候選登錄來假造綠燈；七天日序仍待確認，路線頁未造資料 | Grace 修 focused test 後回 commit；Codex 接回重跑並親驗 |

重現：`npm run verify` → `tests/trip-route-candidate.test.mjs:66`，`candidate registry: unpublished only, no path collisions, published package untouched`。

目前這行把真實 repo 的 `approvedTravelCandidates(repo,published)` 寫死期待 `[]`。日本實際候選加入 `trip/data/approved-travel-candidates-v1.json` 後，合法結果為一個 `publication:false` 公包，測試因此失敗。請改成對凍結的正式公包不變做檢查、或將「空候選登錄」隔離在測試 fixture；保留現有 publication=true 拒絕、重複登錄及路由碰撞的測試，不可刪掉候選驗證或略過這項測試。

### 桌機目錄的可重現 UX 問題

1440×900，旭川城市候選向下捲動至任一景點後，`nav[data-reading-nav]` 為 `position:sticky; top:30px`，固定 masthead 實際下緣是 110px。第一列「看圖挑景點」的矩形為 top=52、bottom=89.8，中心命中的是品牌 Logo，不是該目錄連結；本次點擊實際回到 `/trip/`。其他可見列仍能跳轉，正文標題落點沒有被遮住。

請 Grace 修正目錄與真正標頭高度的避讓，保留鍵盤焦點與手機抽屜。重現截圖 `20261022-eliora-asahikawa-1440-toc-overlap.jpg` 已放 M5 橋接，不進 repo。Codex 未修改共用 CSS／JS；這項先列未通過，不能用 force click 繞過。

### 真實候選追加：國家城市卡的 responsive sizes（2026-10-22）
- 目標：桌機城市大圖按實際欄寬選用清晰的衍生圖。
- 驗收點：1440 viewport、國家城市卡約 1182px 寬時，sizes 與實際寬度相符；手機維持預算與不切臉。
- 做到哪：日本入口切札幌後，`.th-city-photo img` 實際 1182×788，HTML `sizes="(max-width:760px) 90vw, 520px"`；實際選到 640w 檔、naturalWidth=519，放大後清晰度不足。原資產和 1440 衍生檔已齊全。
- 沒做什麼：未在內容分支改共用 renderer／CSS，未自行宣告全通過。
- 下一步給誰：Grace 確認國家卡圖片 sizes；Codex 接 commit 後重跑實際寬度與視覺驗收。截圖 `20261022-eliora-japan-1440-city-sapporo.jpg` 私放 M5 橋接。


### 2026-10-22 本地接回：已有修正不重做，兩項工程回報

| 目標 | 驗收點 | 做到哪 | 沒做什麼 | 下一步給誰 |
|---|---|---|---|---|
| 接回同單修正與手機回饋 | 真實候選與完整verify、390／320可用 | Grace `468406c` 已在本地接入；目錄首列點擊正確；1182px大圖載1440w；候選登錄檢查通過 | 本輪沒有公開推送或新PR；完整verify尚未綠燈；未自行改共用程式 | 父對話協調Grace處理以下兩項，Codex接回驗收 |

1. **新增圖片測試失敗**：`tests/trip-route-candidate.test.mjs:115`，完整verify531／532；單獨執行同一測試仍報 `photo 1182px wide loads a NaNw variant at 1440`。實際候選在IAB顯示實寬1182、currentSrc為1440w，complete=true。測試取 `currentSrc.match(/-(\d+)\.webp$/)?.[1]*1` 的結果不是數字；可能是尚未選到來源，仍需Grace確認取值／載入時機。不要把NaN當640w、跳過檢查或清空真實候選。
2. **手機側標微調**：390與320實測 `.reading-nav__tab` 仍 radius `0 24px 24px 0`、padding-right `2px`。請按本輪回饋縮小圓角、文字右側增加1–2px內距，維持24px窄標籤與可操作性，回候選後再實看。未用內容CSS繞過共用元件。

營運線命名修正已見於 `8387c3a`，本項不重開改名工作。以上是本地待交接記錄，不宣稱Grace已接收本輪新增回報。
