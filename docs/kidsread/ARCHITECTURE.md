# KidsRead 選物誌系列：架構（草稿，尚未上線）

依據：Hiram 2026-11-23（Kingdom `decisions/2026-11-23-hiram-kidsread-migration.md`）：舊部落格三篇 KidsRead 文章移植到選物誌，拆成一個入口頁加五篇，以 UX 為核心、提高轉換率，做出 React 那種即時互動的手感。

- 1:1 移植預覽（私人）：https://claude.ai/artifact/TZdagHuXynpaAnyCKZamhD
- 規劃與互動原型（私人）：https://claude.ai/artifact/MpMW6DouugQCm3BXc9CPQz

## 頁面

| 頁面 | 網址 | 主打搜尋 | 主要互動 | 舊站 301 來源 |
|---|---|---|---|---|
| ⓪ KidsRead 指南（入口） | `/blog/kidsread/` | KidsRead 點讀筆 | 年齡 × 主題篩選、即時書單（只放摘要）、五篇導覽 | — |
| ① 為什麼需要點讀筆 | `/blog/kidsread-pen/` | 點讀筆推薦、點讀筆怎麼用 | 點讀貼紙 A/B/C/D 四路徑切換示意 | `projecteaglet.com/kidsread-pen/` |
| ② 自然發音路線圖 | `/blog/kidsread-phonics-roadmap/` | 自然發音怎麼教、英文分級讀本、點讀橋樑書 | 六階路線（字母 → 自然發音 → 拼讀 → 常見字與分階 → 橋樑書 → 章節小說），書卡連到③ | — |
| ③ KidsRead 英文教材全書單 | `/blog/kidsread-english/` | KidsRead 英文教材、英文點讀繪本 | 年齡、類型篩選、書卡展開；**英文書完整文字只放這裡** | `projecteaglet.com/kidsread-book/` |
| ④ 注音初階到進階 | `/blog/kidsread-zhuyin/` | 注音怎麼學、ㄅㄆㄇ教材 | 初階／進階對照，書卡連到⑤ | — |
| ⑤ KidsRead 中文教材全書單 | `/blog/kidsread-chinese/` | KidsRead 中文教材、中文點讀繪本 | 年齡、主題篩選、書卡展開；**中文書完整文字只放這裡** | `projecteaglet.com/kidsreadchbook/` |

標題、H1 和主打字是暫定的，等 projecteaglet.com 的 Search Console 匯出再依真實關鍵字定稿（見文末 SEO 段）。

## 資料

- `data/kidsread/catalog.json`：唯一的內容來源。
  - `pages`：六頁的 id、網址、標題、主打字、`redirectFrom`（舊站網址，只有①③⑤有）。建置程式和 sitemap 都從這裡讀。
  - 共 66 套教材，每套欄位：`id`、`name`、`home`、`guide`、`stage`、`lang`、`ages`、`tags`、`cover`、`blocks`（原文圖文）、`status`。
    - `home`：完整文字放哪一頁，`english`（③，46 套）或 `chinese`（⑤，20 套）。每套只有一個 home。
    - `guide`：另外出現在哪篇導讀，`reading`（②，12 套）、`zhuyin`（④，4 套）或 `null`。導讀頁只放摘要和連到 home 的連結。
  - 點讀筆那篇放在 `pen`；英文、中文兩篇的前言放在 `enIntro`、`zhIntro`。
  - `ages` 是從原文「適用／適讀年齡」抽出來的；原文沒寫的 29 套是 `null`，頁面標成「年齡待補」，不自己猜。
  - `status` 目前都是 `pending`。等 Hiram 給停售清單和 12/31 賣場頁，才改成 `active`／`removed`；`removed` 不顯示。
- `data/kidsread/migrated-posts.json`：三篇原文照順序的完整區塊，當作備查的原始檔。
- `assets/kidsread/`：原文全部 224 張圖，原尺寸縮到最寬 1280px 的 WebP，去除相機資料。
- `docs/kidsread/extract-old-posts.py`：當時從舊站 HTML 抽出區塊用的程式。

## 前端做法（正式版）

- **建置程式**：`scripts/build-kidsread.mjs`（之後寫）讀 catalog，輸出六個靜態 HTML，每本書的完整文字都在 HTML 裡，Google 讀得到。
- **互動**：`blog/kidsread/kidsread.js` 用「狀態 → 重畫」的元件寫法做篩選、路線圖、書卡下方滑出、固定購買列，跟原型的做法相同；不載入 React 本體，手機開得快。
- **共用元件**：系列導覽列、篩選籤（至少 44px、選中有填色＋文字、結果數 aria-live）、書卡、下方滑出的書籍介紹（dialog）、固定購買列。
- **購買**：沿用 `articles/sheet-offer.js`。KidsRead 在 Sheet 是 2026/12/31～2027/01/06，按鈕依檔期自動切換：開團前「加入開團提醒」、開團中「選購」、結團後「目前沒有開放中的團購」。
- 寫作照 `docs/journal-editorial-guidelines.md`：不留 2023、2024 年的舊團購按鈕和舊檔期，不寫免責套語。

## UX 檢查（UI/UX Pro Max 規則）

- **可及性**：對比 4.5:1、可用鍵盤操作、焦點清楚、圖片都有說明。
- **觸控與回饋**：觸控目標 ≥44px，按下有回饋。
- **圖片**：WebP、延遲載入、預留尺寸。
- **版面**：手機優先、不橫向捲動、固定列不擋內容。
- **動態**：160–240ms，尊重 reduced-motion。
- **主題**：淺色、深色都要檢查。

## 待辦

1. Hiram 給停售商品清單 → 更新 `status`。
2. 12/31 賣場頁 → 核對品項、補當期價格與缺的年齡。
3. 寫建置程式與 `kidsread.js`，六頁上線（12/31 開團前）。
4. 舊部落格三篇一對一 301 到①③⑤（做不到就改 canonical，見下方）。

## SEO：舊站三篇的排名怎麼接過來（2026-11-23 補）

舊站現況：projecteaglet.com 用 Yoast 和 Google Site Kit（已接 Search Console）。三篇都有自己的 canonical，彼此互相連結；最近一次更新是 2026-07，算是活躍頁面；中文教材那篇沒有 meta description。

### 會不會有影響：會，處理不好會掉
1. **重複內容**：新文章大量沿用舊文的圖文。舊頁還在、又沒有 301 或 canonical 的話，Google 只會挑一個版本排名，很可能是歷史比較久的舊站，新頁會排不上去。
2. **一個舊網址的排名只能交給一個新網址**：301 是一對一的。舊「英文教材」拆成②③、舊「中文教材」拆成④⑤時，要決定由誰接，另一篇從零開始。
3. **自家頁互搶**：②和③都寫英文教材、④和⑤都寫中文教材，標題太像會分散排名。

### 調整後的分法（網址數量不變）
- 舊「點讀筆」頁 → ①「為什麼需要點讀筆」（`/blog/kidsread-pen/`），內容最接近，301 過去。
- 舊「英文教材」頁 → ③ 改成「KidsRead 英文教材全書單」（`/blog/kidsread-english/`），收錄全部英文教材，包含路線圖裡的 12 套，舊頁 301 到這裡。
- ② 改成主打另一組搜尋：「自然發音怎麼教／英文分級讀本／點讀橋樑書」（`/blog/kidsread-phonics-roadmap/`）。書卡連到③的完整介紹，不重複放全文。
- 舊「中文教材」頁 → ⑤ 改成「KidsRead 中文教材全書單」（`/blog/kidsread-chinese/`），收錄全部中文教材，舊頁 301 到這裡。
- ④ 主打「注音怎麼學／ㄅㄆㄇ教材初階進階」（`/blog/kidsread-zhuyin/`），同樣連到⑤的完整介紹。
- ⓪ 入口頁主打品牌字「KidsRead 點讀筆」，以篩選和導覽為主，每本書只放摘要。

### 每本書的完整文字只放一個地方
- 英文書放③，中文書放⑤，而且要寫在靜態 HTML 裡，Google 才讀得到。
- 入口頁、②、④的書卡只放摘要。點開時從 catalog 載入完整內容，或連到 `③#書名`。
- 這樣同一段文字在站內只出現一次，各頁的主題也不重疊。

### 上線當天的順序
1. 新六頁上線，sitemap 一起更新。
2. 舊站三篇設定 301 轉址到對應的新網址（WordPress 用 Redirection 外掛或 Yoast Premium 的轉址功能）。
   - 如果沒辦法 301：舊頁留一段短介紹加連結，並在 Yoast「進階」欄把 canonical 填成新網址（免費版就有這個欄位）。
3. 在兩個網站的 Search Console 都送出新網址請求索引；轉址至少保留一年。
4. 預期 2～6 週排名會有波動，之後由新頁接手。

### 要先拿到的資料（在 Hiram 手上）
- projecteaglet.com 的 Search Console：成效 → 網頁 → 分別點這三個網址 → 查詢。匯出近 12 個月的關鍵字、點擊、曝光。
- 依真實的關鍵字決定三個 301 的落點、新頁的標題和 H1；例如如果「點讀筆推薦」帶來最多點擊，① 就主打這個字。
