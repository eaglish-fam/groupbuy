# Living Edit 正式換版與回歸紀錄

日期：2026-09-09。取代同日上線前audit中的待修狀態。

## 完成的變更

- 正式首頁由 design/index.html 產生；原有 Logo、手機雙欄、月曆、折扣碼、書籍、公益、六則購物須知與社群入口保留。
- 字標、文案、縮小靠右CTA與嵌入影片採用Hiram確認的版本。
- ARTISAN混合商品列的影片在共用解析層阻擋；文章與商品彈窗均不載入美腿機影片。
- 首頁/部落格恢復可見或取得焦點時，超過30秒即重新核對；可見狀態每5分鐘刷新並檢查跨日；購買點擊一律重新取得資料。相同進行中請求合併，購買防止重複觸發。
- 資料失敗、未知或結團時不提供購買入口。已結團商品詳情不顯示歷史折扣碼。hidden優先於CSS版型display。
- 舊收藏以品牌名轉成商品key並保留原始資料；只執行一次遷移。同品牌不同商品不再共用收藏；完全相同的商品/優惠列合併顯示，有衝突則不猜測訂購入口。
- 新分享連結使用商品key，舊品牌分享連結仍可開啟；同品牌多商品會顯示搜尋結果。
- 購物須知內建於首頁，不再讀取/index.html反向依賴舊版。
- 正式首頁補齊canonical、OG、Search Console驗證及manifest圖示路徑。sitemap只列8個canonical文件，原查詢連結仍可分享；產生器保留文章網址。
- 既有GA4 property與事件名稱承接，預覽不送出追蹤；消費者購買驗證成功才記錄一次轉換事件。保留廠商既有UTM，無UTM時沿用eaglish/groupbuy。
- 新Service Worker使用網路優先、離線備援；不快取Sheet。升級只清理eaglish前綴舊快取。
- postcss-selector-parser 6.1.2更新6.1.4，npm audit無漏洞。

## 自我audit

- npm run verify：正式首頁28/28、部落格56/56、單元測試23/23。
- scripts/release-browser-audit.mjs：26項瀏覽器回歸通過，覆蓋手機/桌面、錯置影片、跨日、資料失敗、購買前更新、收藏、重複列、購物須知、GA初始化/事件去重及真實舊Service Worker升級。
- GA測試攔截外部傳輸，只驗證呼叫與事件佇列；不冒稱已在GA後台核對報表。
- 真實Sheet與Tailscale候選：手機無水平溢出；文章無JS例外與已載入壞圖；ARTISAN彈窗無iframe；月曆不列過去事件。
- 本輪未逐一實際下單，也不保證所有第三方影片在各地區/登入狀態都允許嵌入；原平台備用連結保留。

## 建置與回復

- npm run build:homepage由design/index.html重建正式index.html，部署前npm run verify包含此步。
- 上線前Git版本為de3f7e746bff3c103a12cc0b9902d3e2421da599；本機保留backup/eaglish-before-living-edit-20260909。
- 本輪以單一release commit发布；需要回復時，以git revert該release commit建立可追溯的回復提交，依部署權限發布。不要對主checkout執行破壞式重置。
- 原始/Users/zosia/Dev/groupbuy中未提交的.github/workflows/sitemap.yml不納入本次變更。
- GitHub Pages來源保持main的/，未更動DNS、CNAME、Sheet或外部GA管理設定。
