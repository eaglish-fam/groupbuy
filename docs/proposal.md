# 鷹家買物社 UI/UX & 功能提案

> **本檔位置**：`docs/proposal.md`
> **建立日期**：2026-04-30
> **背景**：對齊「IP-driven Linktree、外連廠商表單、短期 vs 常駐並存」的核心 constraint 後整理
> **狀態圖例**：✅ 已完成 / 🔨 進行中 / 📋 要做（待實作） / ☐ 待決定（之後再評估）/ ⏸️ 暫不做

---

## 對齊基礎

這個站的本質：

- **IP-driven 策展型聚合站**（鷹式一家頻道 → eaglish.store）
- 連結點出去到**外部廠商團購表單**（不是站內結帳）
- 卡片有不同類型，**SEO 戰略要依類型分層**

| 卡片類型 | 該不該做 SEO | 原因 |
|---|---|---|
| 常駐團購（long） | ✅ 值得 | Evergreen，可 indexable |
| 書籍（康先生的書） | ✅ 強烈值得 | 長尾、IP 強連結 |
| 教育公益（edu） | ✅ 值得 | 長期內容、低競爭關鍵字 |
| 折扣碼（coupon） | ⚠️ 看狀況 | 變動快，常駐品牌可以 |
| **短期團購（short）** | ❌ **不該做** | 兩週後就死頁，反而傷站體質 |
| 即將開團（upcoming） | ❌ 不該做 | 同理 |

**站內留存比 SEO 拉新更高 ROI**，因為主流量從 YT/IG 來，不是 Google。

---

## 📋 要做（全部完成 — 2026-04-30）

> 全部 10 項已實作 + push 到 production，狀態同步移到下方「✅ 已完成」

---

## ☐ 待決定（未來再評估，不強迫做）

| ID | 項目 | 槓桿 | 工程 | 為什麼保留 |
|---|---|---|---|---|
| **A1** | 策展主題頁系統 | ⭐⭐⭐⭐⭐ | 中 | SEO 真正的長期武器，等其他穩了再考慮 |
| **A2** | 常駐 + 書籍獨立 URL + Schema | ⭐⭐⭐⭐ | 中 | A1 之後的下一步 |
| **A3** | FAQPage schema | ⭐⭐⭐ | 低 | 跟 A2 一起做最省事 |
| **B1** | Hiram 一句話推薦 | ⭐⭐⭐⭐⭐ | 極低 | Hiram 認為現有素材（YT/網誌/文章）已足夠 |
| **B2-FOMO 部分** | 紅色脈衝、倒數 24h 強調 | ⭐⭐⭐⭐⭐ | 低 | Hiram 不傾向強迫感，已改做軟版（見上） |
| **B3** | 多通路最低價標記 | ⭐⭐⭐⭐ | 中 | 待 retailers 欄加價格再說 |
| **C1** | Web Push 開團通知 | ⭐⭐⭐⭐⭐ | 中 | 需後端，暫不投入 |
| **C2** | 收藏雲端化 + Email | ⭐⭐⭐⭐ | 中 | 需後端，暫不投入 |
| **C3** | 「我有興趣」即將開團登記 | ⭐⭐⭐ | 中 | 需後端，暫不投入 |
| **D2** | 過期卡片自動沉底 + 灰色化 | ⭐⭐⭐ | 低 | 部分已有，視 D1 完成後再評估 |
| **E1** | 排序（即將截止 / 折扣最大 / 熱門） | ⭐⭐⭐ | 低 | 主流篩選已夠用，先不加 |
| **F1** | 「上次團購回顧」歷史檔案頁 | ⭐⭐⭐⭐ | 中 | 配合 A1 一起做 |
| **F2** | 每張常駐卡片嵌 Hiram 部落格短文 | ⭐⭐⭐⭐ | 低 | 配合 A2 一起做 |
| **F3** | 與 Koffee Letter 電子報互導 | ⭐⭐⭐ | 低 | 之後再評估 |

---

## ✅ 已完成

### 2026-04-30 perf / bug fix 階段

- ✅ PWA `skipWaiting` + `clients.claim`：手機主畫面不再卡舊版（`sw.js`）
- ✅ 首屏載入加速：PapaParse defer + YouTube iframe lazy + preconnect
- ✅ CSV boot fetch：`<head>` inline script 提前並行下載，省 500-800ms
- ✅ Fetch retry + timeout：解決「重整才有資料」bug（`fetchWithRetry` in `script.js`）
- ✅ View Transitions API：篩選切換 cross-fade，不再閃爍
- ✅ 手機卡片寬度：grid padding 對齊行事曆白框，每張卡 +20px

### 2026-04-30 提案實作階段（10/10 全完成）

- ✅ **B4** affiliate UTM 自動注入 — `utils.withUTM()` wrap 9 處外連 CTA（commit `50808cf`）
- ✅ **E2** NEW 標籤 — 開團 3 天內自動掛綠色徽章（commit `cbce18a` + `f39cff0` 改閾值 7→3）
- ✅ **B2** 軟版倒數脈衝 — 琥珀色取代紅色 FOMO，2 天閾值（commit `d8d8563`）
- ✅ **D1** 過期/短期 noindex — `setRobotsNoindex()` 條件式 meta 注入（commit `2e2d8bd`）
- ✅ **A4 + D3** 動態 sitemap 腳本 — `scripts/generate-sitemap.mjs` 過濾 evergreen（commit `da110e6`）
  - 註：`.github/workflows/sitemap.yml` 因 OAuth scope 限制暫留本機，需手動補 push
- ✅ **E5** Pull-to-refresh — standalone PWA 下拉重整 + 琥珀色 indicator（commit `656a86b`）
- ✅ **E4** iOS 分享 sheet 客製化 — 圖片 file 附件 + 倒數 + 鷹式品牌簽名（commit `2b5c5da`）
- ✅ **E3** 搜尋自動完成 — 最近搜尋 + 熱門推薦 dropdown（commit `2ec7922`）
- ✅ **E6** 暗色模式自動切換 — `prefers-color-scheme: dark` 覆蓋 CSS 變數（commit `a8a549b`）
- ✅ **A5** 動態 OG 圖 — lh3 server-side crop 到 1200×630（commit `fd93005`）

---

## 工程備忘

- 任何 JS/CSS 改動 → 必 bump `sw.js` `CACHE_NAME`
- commit + push 到 `eaglish-fam/groupbuy` `main`，GitHub Pages 自動部署
- 桌面（無痕）+ 手機 PWA 兩處測試
- 每完成一個項目，這份檔的「要做」→「已完成」狀態同步更新
