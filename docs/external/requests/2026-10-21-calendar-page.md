# 團購行事曆獨立頁 /calendar/（Bingo → Grace，2026-10-21）

| 欄位 | 內容 |
|---|---|
| 目標 | /calendar/ 依「即將截止／開團中／即將開團」分組，即時讀 Sheet，可分享到 LINE 置頂 |
| 驗收點 | 三組數字和首頁一致；390/320/1440 實看；OG 卡正確（上線後 Bingo 用 LINE 實測）；verify 通過 |
| 做到哪 | Bingo 已整理現有程式位置（index.html L392、script.js L396/L2431/L2471/L2529/L1878/L3038）和競品做法 |
| 沒做什麼 | Bingo 沒改程式、沒寫 Sheet |
| 下一步給誰 | Grace：開 claude/calendar-page-20261021；Hiram 本人核准合併；Bingo 上線驗收 |

Hiram 2026-10-21 在 Bingo 對話裡同意這批工作（原話：「那接下來就照你說的去做……尤其是這個團購行事曆做成獨立網頁，我覺得這很好」）。Bingo 的建議是參考資料，Grace 可以調整，但要寫理由。合併到 main 一律要 Hiram 本人核准。

## 可直接執行的 Prompt

Grace，Bingo 派一件事：把首頁的團購行事曆做成獨立網頁 https://www.eaglish.store/calendar/ 。
Hiram 2026-10-21 原話是「尤其是這個團購行事曆做成獨立網頁，我覺得這很好」。

【現況（origin/main b2d5e05）】
- 首頁的行事曆是 index.html 第 392 行的 section#calendar，選單是 <a href="#calendar">。#錨點不能被搜尋引擎單獨收錄，也不方便貼到 LINE 置頂。
- 資料從 Sheet 即時讀取：script.js 第 396 行有 CONFIG.SHEET_ID，第 2471 行讀主表（MAIN_CSV），第 2431 行用 gviz 讀「即將開團」分頁（UPCOMING_CSV）。網誌連結是 row['網誌網址']（第 2529 行）。
- 已經有加入行事曆的功能：單團 .ics、Google 日曆，還有全部訂閱（第 1878 行的 subscribe_all_calendar）。
- 競品參考：vistoso.tw/calendar.html 有「訂閱開團行事曆」，用一份 ICS 讓手機日曆自動更新。主夫尼克、倩兒☓魯蛋則是每月更新一篇「2026/10 月開團行事曆」，靠新鮮度和帶日期的標題排名。

【要做的事】
1. 新增 /calendar/index.html，資料跟首頁一樣即時從 Sheet 讀取，共用現有的解析程式，不要再寫一份。Sheet 只讀不寫。
2. 分三組，手機優先，順序如下：
   (1) 即將截止：開團中，而且 3 天內結束，顯示倒數。
   (2) 開團中
   (3) 即將開團：顯示開團日。
   常駐和長期團放在最下面，可以收合。日期和狀態的判斷跟首頁現在的邏輯一致，避免兩頁顯示不同。
3. 每團附上：
   - 品牌和商品名
   - 開團／結團日
   - 「去團購」按鈕：用廠商連結，沿用 withUTM，GA 事件用 outbound_groupbuy_click，source_surface 寫 calendar_page
   - 「看選物誌」：Sheet 有網誌網址才顯示
   - 「加入行事曆」
   已結團的不顯示，也不替單一團產生可被收錄的網址（AGENTS.md 規定）。
4. 頁首要有：
   - 一行說明
   - 「加入 LINE 社群」：沿用 script.js 第 3038 行的 LINE_COMMUNITY_URL
   - 「訂閱整份行事曆」：沿用現有功能。如果可以做出靜態 .ics 讓手機日曆自動更新最好；做不到的話，在 PR 裡說明原因和替代方案。
5. 分享和 SEO：
   - title：鷹家買物社團購行事曆｜本週開團、即將截止一次看
   - meta description：一頁看鷹式一家本週開團、即將截止與即將開團的團購，附商品介紹、選物誌與加入行事曆，加入 LINE 社群不漏團。
   - canonical 設成 https://www.eaglish.store/calendar/
   - 要有 OG 圖，1200×630，給 LINE 置頂分享用。圖上寫「鷹家買物社｜團購行事曆」，不放孩子照片，也不放會過期的日期，這樣圖可以長期用。
   - 加進 sitemap.xml。
   - 結構化資料用 WebPage＋BreadcrumbList。每團的 Event 先不要做，因為團購不算 Google 定義的活動。
   - 沒有 JS 的時候，至少看得到說明文字和 LINE／首頁連結。
6. 首頁選單的「團購行事曆」改連到 /calendar/。首頁的 section#calendar 要保留還是縮成摘要，由 Grace 決定，寫進 DECISIONS.md。
7. GA：沿用 site-runtime.js，content_group 用 shopping 或新增 calendar 都可以，在 PR 裡寫明。

【驗收點】
- npm run verify 全部通過。
- 在 390px、320px、1440px 三種寬度實際看過：三組顯示正確，數字和首頁一致，倒數正確，按鈕不重疊，鍵盤能操作。
- 把網址貼進 LINE，預覽卡片的 OG 圖和標題正確。這一項等上線後由 Bingo 用 LINE 實測。
- Lighthouse 手機版的 SEO、無障礙都在 90 分以上（附數字）。

【分支和 PR】
從 origin/main 開 worktree，分支 claude/calendar-page-20261021，PR 到 main。合併要 Hiram 本人核准。
完成後在 PR #40 留言回報（用五欄格式），附上：
- 預覽網址
- 390px／1440px 截圖檔名（不放 repo）
- 與首頁筆數的對照
合併後給 Bingo 正式站網址 https://www.eaglish.store/calendar/ ，由 Bingo 驗收。
