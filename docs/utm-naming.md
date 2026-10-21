# UTM 命名規則（進站連結）

2026-10-21 訂（Bingo 草案，Zosia 整理）。適用於**別人點進 www.eaglish.store 的連結**：LINE 社群、Instagram、YouTube、Facebook、TikTok、QR Code、廣告。
`toolbox.html` 的 UTM 產生器照這份設定預設值和選項；改規則時兩邊一起改。

## 進站和出站是兩套規則

| | 進站 UTM（這份文件） | 出站 `withUTM` |
|---|---|---|
| 方向 | 外部平台 → 我們的網站 | 我們的網站 → 廠商的團購頁 |
| 誰在讀 | 我們的 GA4（流量來源、活動） | 廠商自己的分析工具 |
| 誰加的 | 人工貼連結時加（用 toolbox 產生） | 程式自動加：`script.js` 的 `utils.withUTM`、`product-content.js` 的 `withUTM` |
| 值 | 照下面的表 | 固定 `utm_source=eaglish`、`utm_medium=groupbuy`、`utm_campaign=<Sheet 品牌名>`（零售商按鈕另加 `utm_content=<零售商名>`）；廠商連結本來就有 `utm_source` 時不覆蓋 |

出站規則不在這份文件的範圍內，也不要改成小寫連字號：廠商那邊已經用品牌名對帳。

## 寫法

- 一律小寫英文，單字之間用連字號 `-`。不用空白、中文或底線。
  理由：GA4 的值分大小寫，`LINE` 和 `line` 會變成兩個來源；中文和空白貼到 LINE 時會被編碼成一長串 `%E9…`，很難看出是哪個連結。
- `utm_source` 填平台，`utm_medium` 填流量類型，`utm_campaign` 填這次活動，`utm_content` 填貼在哪個位置。
- 自然貼文的 `utm_medium` 一律寫 `social`，GA4 才會歸到 Organic Social。

| 平台 | utm_source | utm_medium | utm_content 範例 |
|---|---|---|---|
| LINE 社群 1 群／2 群／3 群 | `line` | `social` | `group1`、`group2`、`group3`（置頂公告加 `-pin`，例如 `group1-pin`） |
| LINE 官方帳號（之後才會用） | `line-oa` | `social` | `broadcast`、`richmenu` |
| Instagram | `instagram` | `social` | `bio`、`story`、`post`、`reels` |
| YouTube | `youtube` | `social` | `description`（說明欄）、`pinned-comment`、`shorts` |
| Facebook | `facebook` | `social` | `page-post`、`group-post`、`bio` |
| TikTok | `tiktok` | `social` | `bio`、`video` |
| 付費廣告 | `facebook`／`instagram`／`google` | `paid-social`（社群廣告）／`cpc`（搜尋廣告） | 廣告組名稱 |
| 實體 QR Code | 放在哪裡：`package`、`flyer`、`card`、`poster`、`store`、`event` | `qrcode` | 不填，或填版本（例如 `v2`） |

QR Code 這一列是 Zosia 加的：toolbox 本來就有 QR Code 產生器，會自動帶 `utm_medium=qrcode`，所以把它寫進規則，避免同一類流量有兩種寫法。GA4 沒有「實體」這個預設管道，這類流量會落在 Unassigned，但用來源／媒介報表仍然分得出來。
toolbox 原本還有 `email` 選項，我們沒有寄電子報，先拿掉；之後真的開始寄，再補一列 `utm_medium=email`。

## utm_campaign 格式

| 用途 | 格式 | 例子 |
|---|---|---|
| 單一團 | `gb-<品牌英文 slug>-<yyyymm>` | `gb-blackmores-202610` |
| 團購行事曆 | `calendar-<yyyymm>` | `calendar-202611` |
| 選物誌文章 | `journal-<文章 slug>` | `journal-blackmores` |
| 鷹家遠行所 | `trip-<城市 slug>` | `trip-chiang-mai` |
| 個人簡介、說明欄這類常駐連結 | `always-on` | `always-on` |

`<yyyymm>` 用開團的月份。品牌 slug 沿用文章網址（`/blog/<slug>/`）已經有的寫法；沒有文章的品牌，取英文品牌名轉小寫加連字號。

## 例子

- YouTube 說明欄的常駐連結：`https://www.eaglish.store/?utm_source=youtube&utm_medium=social&utm_campaign=always-on&utm_content=description`
- LINE 2 群置頂公告貼行事曆：`https://www.eaglish.store/calendar/?utm_source=line&utm_medium=social&utm_campaign=calendar-202611&utm_content=group2-pin`

## 網站送給 GA4 的部分（`site-runtime.js`）

- 網址只保留 `utm_source`、`utm_medium`、`utm_campaign`、`utm_term`、`utm_content`、`utm_id`、`gclid`、`gbraid`、`wbraid`、`fbclid`。其他參數和 `#` 後面的部分都拿掉，避免把 email、token 之類的個資送進 GA4。
- 參數名稱要完全照上面的小寫寫法；`UTM_SOURCE` 這種寫法會被當成其他參數拿掉。
- 只有進站的第一頁會帶 UTM。換到第二頁時網址上沒有 UTM 是正常的：GA4 已經把整個工作階段歸到第一頁的來源，網站不會把 UTM 帶到下一頁。

## 不放進這個 repo 的

LINE 社群的邀請連結和群名對照表（哪個 `group1` 是哪個群）不放進公開 repo，由 Bingo 私下維護。
