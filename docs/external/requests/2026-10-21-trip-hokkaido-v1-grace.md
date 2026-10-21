# Bingo → Grace：日本入口＋北海道路線篇的工程支援（第一版候選）

寄件：Bingo（Grokbot，團購營運與鷹家遠行所）｜2026-10-21 23:40（台灣時間）
配對：內容派工單 `docs/external/requests/2026-10-21-trip-hokkaido-v1-codex.md`。Hiram 2026-10-21 指定：遠行所新文章的寫文和地圖交給 Codex，元件和工程交給 Grace；要先出第一版給他看，他核准前不上線。

| 目標 | 驗收點 | 做到哪 | 沒做什麼 | 下一步給誰 |
|---|---|---|---|---|
| 讓 Codex 的日本公包能產出 4 頁 noindex 候選：`/trip/japan/`、北海道 7 天路線篇、旭川篇、札幌篇 | 不動已發布的 6 頁和其他國家；新頁 noindex、不進 sitemap；`npm run verify` 綠燈；有預覽網址可以給 Hiram 手機看 | Bingo 已盤點現行規格（見下面第 1 節） | 沒改程式；沒決定最後的網址 | **Grace**：確認做法並在 #40 回覆；需要的改動另開 `claude/trip-japan-support-20261021` |

## 1. 我查到的現況（2026-10-21 `origin/main` 和協作分支）

- 新城市走核准公包：`trip/data/approved-travel-registration-v1.json` → `scripts/trip-approved-registration.mjs` → `validateApprovedTravelPackage`（`trip/approved-travel-contract.mjs`）→ `renderApprovedCity`／`renderApprovedCountry`（`scripts/build-trip.mjs` 開頭呼叫 `buildApprovedTravel`）。
- **登錄檔只能放一個公包**，而且只有一個 `publication` 開關。現在登錄的是 `europe-malaysia-approved-travel-v1.json`，而且是 `publication: true`。日本要做成 noindex 候選，就不能直接併進這個檔，也不能把開關改掉。
- `destinationKind` 只接受 `city`、`archipelago`、`region`，**沒有路線篇的頁型**。`referencePlans` 只是國家頁裡一段不能操作的參考日程。紐西蘭的 `/trip/new-zealand/christchurch/3-days/` 是舊版路線頁，試排在 FAQ 前面。
- `scripts/trip-approved-country-map.mjs` 第 6 行，地圖 fallback 寫死了 `approvedGuideIds`（oslo、tromso、svalbard、amsterdam）。不是城市篇的地點（小樽、新千歲機場）要靠 `point.href` 才能連出去。
- 新標題字會用到標題字型子集（HANDOFF 第 4 節，`build-site-heading-font.mjs`）。

## 2. 要請你決定或支援的事

1. **登錄多個公包**：讓日本公包用自己的 `publication: false` 登錄，europe-malaysia 的輸出要逐位元組不變。做法你決定，例如把登錄檔改成陣列，或另加 v2 登錄檔。
2. **路線篇頁型**，二選一，你判斷：
   - A. 新增一個 `route` 頁型。沿用城市篇的首屏、目錄、facts、FAQ、影片元件；正文改成逐日（Day 1–7）的段落，每天連到城市篇裡的景點；`#plan` 用固定 7 天路線，不做假的試排。
   - B. 先用 `destinationKind: 'region'`（北海道）的城市篇外殼，加上入口頁的 `referencePlans`。這樣比較快，但標題和 Article schema 要能表達「7 天路線」。
   我的建議是 A，因為之後京阪奈、熊本阿蘇、余市、越後湯澤都是路線篇。
3. **網址**，建議：
   - 入口 `/trip/japan/`
   - 路線篇 `/trip/japan/hokkaido-asahikawa-sapporo-7-days/`
   - 城市篇 `/trip/guides/asahikawa-with-kids/`、`/trip/guides/sapporo-with-kids/`（沿用現有 guides 的格式）
   最後由你決定，再寫進 `docs/collab/DECISIONS.md`。
4. **地圖**：日本全圖加北海道放大兩個視角。用 Natural Earth 的真實幾何，北海道要清楚、不能被裁掉。不是城市篇的點（小樽、新千歲機場）用 `href` 連到路線篇的段落。手機 320px 地名不能重疊。
5. **首頁和世界地圖入口**：這次先不接（noindex 候選）。等 Hiram 核准正式上線，再走 R24 discovery 的同版更新，加日本和亞洲入口。
6. **預覽**：給 Hiram 手機打得開的 noindex 候選，可以用 M5 本機伺服器加 Tailnet HTTPS，或你的私人預覽頁。網址不要寫進公開 repo，私下給 Hiram 或 Bingo。
7. **字型子集**：補上新標題會用到的字，例如旭川、札幌、嬰兒。

## 3. 不做的事

- 不合併、不推 main。正式上線要 Hiram 核准 PR 編號。
- 不改文案、照片、事實，這些是 Codex 和 Hiram 的。
- 不動已發布的國家頁和城市頁、DNS、Pages、分析工具。

## 4. 驗收標準

- [ ] europe-malaysia 6 頁和其他舊頁的 HTML 沒有差異，或只有你說明過、必要的差異。
- [ ] 日本 4 頁用 Codex 的公包可以重建、`noindex`、不進 sitemap、canonical 正確。
- [ ] 路線篇頁型（或 B 方案）有聚焦測試；1440、390、320px 沒有橫向捲動；目錄第一次點擊不被 sticky 標頭蓋住。
- [ ] `npm run verify` 結果照實寫在 PR。
- [ ] 預覽網址交給 Bingo 或 Hiram；截圖不放 repo。
