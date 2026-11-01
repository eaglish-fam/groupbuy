# 短網址 /go/<代碼>/（帶好追蹤碼的跳轉連結）

貼到 LINE 社群、IG、YouTube 的連結用這個：短、不用手動加 utm，打字也不會寫錯。

- 例：`https://www.eaglish.store/go/cal/?c=group1` → 自動跳到 `/calendar/?utm_source=line&utm_medium=social&utm_campaign=calendar-<當月>&utm_content=group1`
- `?c=` 是貼在哪裡（`group1`、`group2-pin`…，小寫英數與連字號、最多 24 字；不合格式就略過）。規則見 `docs/utm-naming.md`。
- `utm_campaign` 的月份（`{yyyymm}`）取點擊當下的台北月份。
- 設定在 `config/go-links.json`：每個代碼一列（標題、描述、預覽圖給 LINE 預覽用；目的地只能是站內路徑）。改完跑 `npm run build:go`，開 PR，Hiram 核准後上線。
- `/go/` 底下手寫的頁面（例如 `sanfu-farm`）不受影響；代碼不能和它們撞名。
- 這些頁面 noindex，不進 sitemap。GA4 的流量由目的地頁面（有載入 GA4 的頁面）記錄，utm 在網址上，所以來源、媒介、活動、內容都會歸到 LINE。
- 目前網域是 `www.eaglish.store`。`go.eaglish.store` 這種子網域要改 DNS，且 GitHub Pages 一個 repo 只能綁一個網域（`CNAME` 現在是 `www.eaglish.store`），所以需要另外的主機；沒有 Hiram 的同意不做。
