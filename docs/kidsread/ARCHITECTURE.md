# KidsRead 選物誌系列：架構（草稿，尚未上線）

依據：Hiram 2026-11-23（Kingdom `decisions/2026-11-23-hiram-kidsread-migration.md`）：舊部落格三篇 KidsRead 文章移植到選物誌，拆成一個入口頁加五篇，以 UX 為核心、提高轉換率，做出 React 那種即時互動的手感。

- 1:1 移植預覽（私人）：https://claude.ai/artifact/TZdagHuXynpaAnyCKZamhD
- 規劃與互動原型（私人）：https://claude.ai/artifact/MpMW6DouugQCm3BXc9CPQz

## 頁面

| 頁面 | 網址 | 主要互動 |
|---|---|---|
| ⓪ KidsRead 指南（入口） | `/blog/kidsread/` | 年齡 × 主題篩選、即時書單、五篇導覽 |
| ① 為什麼需要點讀筆 | `/blog/kidsread-pen/` | 點讀貼紙 A/B/C/D 四路徑切換示意 |
| ② 英文閱讀路線圖 | `/blog/kidsread-english-reading/` | 六階路線（字母 → 自然發音 → 拼讀 → 常見字與分階 → 橋樑書 → 章節小說） |
| ③ 英文點讀繪本 | `/blog/kidsread-english-books/` | 年齡、類型篩選、書卡展開 |
| ④ 注音與數學 | `/blog/kidsread-zhuyin/` | 初階／進階對照 |
| ⑤ 中文點讀繪本 | `/blog/kidsread-chinese-books/` | 年齡、主題篩選、書卡展開 |

## 資料

- `data/kidsread/catalog.json`：唯一的內容來源。
  - 共 66 套教材，每套欄位：`id`、`name`、`article`、`stage`、`lang`、`ages`、`tags`、`cover`、`blocks`（原文圖文）、`status`。
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
4. 舊部落格三篇改成導流頁，連到新文章；能設 301 轉址最好。
