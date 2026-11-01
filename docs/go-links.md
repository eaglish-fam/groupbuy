# 短網址 /go/<代碼>/（帶好追蹤碼的跳轉連結）

貼到 LINE 社群、IG、YouTube 的連結用這個：短、不用手動加 utm，打字也不會寫錯。

- 例：`https://www.eaglish.store/go/cal/?c=group1` → 自動跳到 `/calendar/?utm_source=line&utm_medium=social&utm_campaign=calendar-<當月>&utm_content=group1`
- `?c=` 是貼在哪裡（`group1`、`group2-pin`…，小寫英數與連字號、最多 40 字；不合格式就略過）。規則見 `docs/utm-naming.md`。
- `utm_campaign` 的月份（`{yyyymm}`）取點擊當下的台北月份。
- 設定在 `config/go-links.json`：每個代碼一列（標題、描述、預覽圖給 LINE 預覽用；目的地只能是站內路徑）。改完跑 `npm run build:go`，開 PR，Hiram 核准後上線。
- `/go/` 底下手寫的頁面（例如 `sanfu-farm`）不受影響；代碼不能和它們撞名。
- 這些頁面 noindex，不進 sitemap。GA4 的流量由目的地頁面（有載入 GA4 的頁面）記錄，utm 在網址上，所以來源、媒介、活動、內容都會歸到 LINE。
- 目前網域是 `www.eaglish.store`。`go.eaglish.store` 這種子網域要改 DNS，且 GitHub Pages 一個 repo 只能綁一個網域（`CNAME` 現在是 `www.eaglish.store`），所以需要另外的主機；沒有 Hiram 的同意不做。

## 選物誌文章導來的連結（2026-11-01）

選物誌裡要連到 /go/ 的地方，不另加 `utm_*`（站內連結帶新的 utm，GA4 會當成新來源、蓋掉 LINE 的來源），改用 `?c=blog-<文章slug>`：

- 例：`/go/cal/?c=blog-leofoo` → `/calendar/?utm_source=line&utm_medium=social&utm_campaign=calendar-<當月>&utm_content=blog-leofoo`
- 這樣 GA4 內建的「工作階段手動廣告內容」維度就分得出是哪一篇文章導來的，不用註冊自訂維度，也不用改 `site-runtime.js`。
- 限制：`utm_source` 仍然是設定檔裡的 `line`，所以文章導來的流量會歸在 LINE 來源底下，靠 `utm_content` 以 `blog-` 開頭來區分。要不要為文章另開一個來源值（例如 `blog`），是設定檔的決定，要改再開 PR。

## 每日彙總（給 Bingo）

`scripts/ga4-go-daily.mjs`：把 GA4 報表 CSV 轉成每日彙總。

```
node scripts/ga4-go-daily.mjs <ga4.csv> 2026-11-01 > daily.csv
```

欄位：`date, source, utm_source, utm_medium, utm_campaign, utm_content, views`；`source` 是 `line`／`blog`／`other`。

**`views` 是目的地頁（例如 /calendar/）帶著這組 utm 被打開的次數，不是 /go/ 頁的瀏覽數（/go/ 頁只轉址、不載入 GA4），也不是「按去廠商」的次數。** 「按去廠商」要看既有的 `outbound_groupbuy_click` 事件。

GA4 報表欄位名稱的對照還沒用真實匯出檔驗證過；找不到欄位時腳本會停下來並印出實際的欄位名，不會亂猜。
