# Grace 交接（2026-10-21 08:50 台灣時間）

給 M5 的 Claude Code。回 Eliora B 在 #40 的請求。這是公開 repo，只寫公開安全的內容；私人對話不在這裡。
規則照舊：三條線權責不變，Hiram 核准才合併到 main；這份交接不增加任何發布、發送或商業權限。

## 1. 目前狀態

- `main` = `b2d5e05`（#53 合併）。沒有未合併的網站 PR；唯一開著的是 #40（追蹤用，永不合併）。
- 雲端 Grace 這邊**沒有未提交的工作**，所有分支都已合併。交接期間我不另開新的網站實作。
- 10-19 之後合併的：

| PR | 內容 | 正式站驗收 |
|---|---|---|
| #46 | 根目錄 `/favicon.ico` | Hugo 已驗收 |
| #47 | 首頁快截止的團排前面、「剩 N 天」 | Hugo 已驗收 |
| #49 | 澳佳寶選購指南上線（含 #48 內容） | Hugo 已驗收 |
| #51 | 澳佳寶新封面、去背商品圖、新標題 | Hugo 已驗收（#40 10-21 07:30） |
| #52 | 每個 PR 自動跑 `verify`；`npm run integrate -- <slug>`；共用 `articles/sheet-offer.js` | 不影響頁面；GitHub 檢查已在 #53 實際跑過、綠燈 |
| #53 | 選物誌首頁電腦版（≥901px）Editor's Pick 輪播；手機不變 | **還沒驗收**（給 Hugo） |

## 2. 還沒完成的事（下一個具體動作）

| 事情 | 狀態 | 下一步給誰 |
|---|---|---|
| #53 正式站驗收 | 已上線、未驗收 | Hugo：1440／1024 看到輪播、22 篇可切換；390／320 跟以前一樣、沒有輪播 |
| 澳佳寶 LINE 社群推播稿 | Hugo 已驗收 #51，請 Lydia 今天交稿；團購 10/25 截止 | Lydia 交稿 → Hiram 確認 → Lydia 發 |
| 澳佳寶文章加家人照片 | Hiram 要「有挑選、有區分」地放，不是全放（我 10-19 全放被糾正、已還原） | Lydia 挑照片和位置；Grace 線轉 WebP、去 EXIF、另開 PR。Lydia 要留意：小的孩子年齡和包裝 4 歲以上標示、黃色膠囊是哪一款、照片裡有沒有入鏡的別的商品 |
| 澳佳寶去背商品圖畫質 | 目前無損 WebP；q90（約 300KB）是可選的編輯決定 | Codex 決定，沒有就維持 |
| G-001 herdr | Eliora B 回報 HELLO 試跑完成 | Eliora B 補 `docs/collab/requests/G-001-herdr-m5.done.md` |
| Codex 的 `docs/trip-editorial-guidelines.md` 更新 PR | 還沒看到 | Codex |

## 3. 等 Hiram 決定的（都是候選，沒有定案）

- Hugo 要不要給寫入權限（token）。
- 團購 Sheet 11 月有一列結束日早於開團日 → 轉給 Queenie 確認（沒有人自己改 Sheet）。
- Codex 和 Grace 之間的工作切分細節。
- 還原點分支 `rollback/pre-ux-20261016` 要不要刪。
- 團購結束後文章按鈕的文字。
- 關掉 Codex 對每個 PR 的自動 review（額度用完時只留「usage limits」留言）。
- eaglish-fam 帳號 Actions 設 $0 預算（2,000 分鐘已用完；groupbuy 是公開 repo，不受影響）。

## 4. 文件沒寫、但接手要知道的工程判斷和踩坑

- **先跑 `npm run verify` 再交件**，結果照實寫在 PR。GitHub 上也會跑同一個檢查，另外會檢查「產生的檔案有沒有忘了 commit」（`reports/blog-release-v1.json` 的時間戳例外）。
- **sitemap 的 lastmod 來自 git**：檔案沒 commit 時那一頁的 lastmod 會消失。做法：先 commit 頁面，再跑 verify 產生 sitemap，再把 sitemap 一起 commit；不要先 commit 一個只跑了一半建置的 `index.html`。
- **標題字型是子集**：新文章標題有新字時，`node scripts/build-site-heading-font.mjs --python <有 fontTools、brotli 的 Python>`（約 15 分鐘），資料夾名稱含雜湊。`npm run integrate` 會先檢查需不需要。
- **新文章整合用 `npm run integrate -- <slug>`**（`docs/collab/INTEGRATE.md`）：文章包要有 `siteIntegration` 段。它處理 WebP、團購按鈕、目錄、選物誌卡、封面身分、測試、SEO、字型，最後跑 verify；重跑不會多出改動。
- **發布檢查的要求**：文章購買區要有 `<noscript>` 連回首頁的連結；JSON-LD 的 Article image 用網址清單；去背（有透明）的圖用無損 WebP。
- **選物誌首頁的輪播第一張也是 `<article>`**：抓文章卡要用 `data-article`，不要抓「第一個 `<article>`」。
- **澳佳寶文章有內文雜湊測試**（`tests/blackmores-article.test.mjs`）：改內文要同步更新雜湊，且文字是 Codex／Hiram 的責任。
- **GitHub 留言不要寫「@Codex」**：會叫起 Codex 雲端 review bot。
- **大家共用 `eaglish-fam` 帳號**：每則留言、檔案開頭都寫自己的名字。
- **轉述核准**：Hugo／Ezra 轉述要寫出 PR 編號；合併前比對 PR 內容和核准時相同（樹雜湊），變了就重問。
- **需求一定要落成檔案或 PR 留言**：只在某一線對話裡講的需求，等於沒交接（照片那次就是這樣漏的）。
- **候選站**：雲端 Grace 是用 Playwright 抓頁面做成 claude.ai 的私人預覽頁給 Hiram 對照；在 M5 上可以直接開本機伺服器給他看。

## 5. 來源

`AGENTS.md`、`docs/collab/COLLAB.md`、`docs/collab/DECISIONS.md`、`docs/collab/INTEGRATE.md`、`docs/collab/HERDR-M5.md`、`docs/collab/HUGO-BRIEF.md`、#40 的留言。
