# 文章上線整合：一個指令

`npm run integrate -- <slug>`（Hiram 2026-10-20 選定的自動化）

Codex 交文章時，在自己的分支跑這個指令，PR 就能直接進候選、等 Hiram 核准。以前要 Grace 手動做的網站接線，現在都由指令完成：

| 指令會做 | 說明 |
| --- | --- |
| 商品對應 | 在 `product-content.js` 加（或更新）條目：Sheet 品牌精確值、文章、標題、摘要、首圖、商品卡 |
| 選物誌卡片 | 在 `blog/index.html` 放最前面（已有就更新） |
| 封面審查紀錄 | 寫進 `config/blog-cover-identities.json`，雜湊依實際圖檔計算 |
| 購買按鈕 | 頁面接上共用的 `articles/sheet-offer.js`：開團期間連到 Sheet 的連結，其他時候退回 `/#catalog`；手機浮動按鈕一起處理 |
| 圖片 | `<article>` 裡的 PNG／JPG 轉成 WebP（透明 PNG 用無損，照片品質 85），去除相機資料；原檔保留 |
| 發布檢查要求 | 文末 `<noscript>` 買物社連結、結構化資料的圖片改成網址清單 |
| 測試 | 產生 `tests/<slug>-article.test.mjs`（已存在就不動） |
| 標題字型 | 新標題有站上字型沒有的字時，自動重建子集（需要 Python 的 fontTools 和 brotli；用 `FONT_PYTHON=<python 路徑>` 指定） |
| 驗證 | 最後跑 `npm run verify`；`--no-verify` 可跳過 |

重跑是安全的：每一步都取代自己上一次的輸出，不會多出第二份。

## 文章這邊要準備的

1. `blog/<slug>/index.html`：只有一個 `<h1>`；`og:title`、`og:image`（＝下面的 `cover`）、`og:image:alt`；文末有 `id="offer"` 的購買段落。
2. 購買連結：文末一個 `<a href="/#catalog" data-sheet-offer>`，需要的話早段一個 `<a href="/#catalog" data-sheet-early>`。舊寫法 `data-<slug>-offer`／`data-<slug>-early` 會自動改名。要讓開團時換文字，加 `data-open-label="選購○○ ↗"`。
3. 文章包 `docs/<slug>-article-package-v<N>.json`（取最大的 N）要有 `technicalSeo.datePublished`，以及：

```json
"siteIntegration": {
  "brand": "澳佳寶保健食品",
  "category": "家庭營養",
  "journalCategory": "食品",
  "excerpt": "選物誌卡片和首頁輪播用的一兩句摘要。",
  "readLabel": "比較五款產品 →",
  "cover": "/assets/<slug>/cover.webp",
  "card": "/assets/<slug>/product-card.webp",
  "coverSource": "/assets/<slug>/cover-source.html",
  "coverIdentity": "澳佳寶",
  "coverReview": {
    "identityVisible": true,
    "realPhotoPreserved": true,
    "mobileCardLegible": true,
    "viewportWidths": [320, 390, 768, 1440],
    "reviewer": "誰看的",
    "reviewScope": "看了什麼、在哪些寬度"
  }
}
```

| 欄位 | 規則 |
| --- | --- |
| `brand` | 和團購 Sheet「品牌」欄**一字不差**；近似名稱不會綁到這篇 |
| `journalCategory` | 只能是 食品、居家、母嬰、旅遊（選物誌的篩選） |
| `category` | 卡片上顯示的分類文字，自由寫 |
| `card` | 首頁商品卡用的 4:3 圖，可省略（省略就用 `cover`） |
| `coverIdentity` | 封面和 `coverSource` 的 `<h1>` 都要出現的品牌字 |
| `coverReview` | 人真的看過封面才填 `true`；四個寬度都要看過。指令只記錄，不會替你判斷 |
| `catalogKey`、`cardTitle`、`readingTitle` | 選填；預設分別是 slug 的駝峰寫法、`og:title` 去掉「｜鷹家選物誌」 |

## 指令不做的事

- 不改文章的文字、表格、照片選擇或圖說。
- 不寫 Sheet、不合併、不上線。合併仍要 Hiram 核准（轉述要寫 PR 編號，見 `COLLAB.md`）。
- 跑完請看 `git status`，只提交和這篇有關的檔案。`reports/blog-release-v1.json` 每次只會改時間戳。
