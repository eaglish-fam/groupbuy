# 新版 eaglish.store 上線前稽核與提案

日期：2026-09-09。範圍：Tailscale 23443 /design/、/blog/ 與三篇文章；對照正式站首頁與原始功能。分支 design/eaglish-living-edit-20260909；唯讀確認 origin/main 仍為 de3f7e746bff3c103a12cc0b9902d3e2421da599。

## 結論

保留目前美術方向與版型，但尚不建議直接部署。現有測試全數通過仍未涵蓋新版的多套渲染器、舊版升級及資料刷新。此次沒有發布或修改商品來源。

## 已驗證可保留

- 首頁現場資料：124 筆、23 件開團商品，首批12件，可展開全部23件；折扣8件、書籍2件、公益4件。未逐一驗證124筆商品的廠商內容與結帳流程。
- 320/390px雙欄；768/1440px三欄，無頁面水平溢出。搜尋無結果與重設正常。
- 月曆可見、下方明細預設收折。
- 初次讀取 Sheet 失敗時主商品列表不提供購買按鈕，提供重試。
- 三篇文章手機無水平溢出、無捕獲到的JS例外、已載入圖片未發現損壞。Atojet與Wave嵌入正確平台URL；ARTISAN文章無iframe。這不等於平台一定允許所有訪客播放。
- npm run verify：站點28/28、部落格56/56、23/23測試。站點稽核主要讀原本index.html，不能當成design首頁部署驗證。

## 上線前必要修正

### 1. ARTISAN商品彈窗仍顯示美腿機影片

實測openDetail後iframe為 https://www.youtube-nocookie.com/embed/bFNLF_Vgn7k 。文章已修正，但design/design.js normalize直接使用fromRow，openDetail直接mountVideos，繞過product-content.js videoButton的限制。

提案：在商品影片資料解析層統一產品身分規則；合併團購列不能自動充當CB301影片來源。驗收需涵蓋文章、卡片及真實商品彈窗，不只HTML靜態掃描。

### 2. 團購資料更新與失敗狀態

design/design.js只有載入時load；模擬focus及visibilitychange後fetch次數為0。首頁與blog/blog.js購買連結可停留在舊狀態；文章購買按鈕已有重新核對邏輯。

提案：回到頁面、跨日及準備購買時重新核對有效檔期與最新URL，刷新失敗時停用舊購買入口；保留閱讀、分類、收藏與目前捲動位置。避免只更新日期字樣卻保留舊狀態。

### 3. 部落格隱藏按鈕被CSS覆蓋

攔截Sheet請求模擬失敗：3個[data-buy]均hidden=true且href=null，但computed display=flex，仍占44px高度。來源為.card-actions a/.buy明確display覆蓋hidden。

提案：明確落實hidden的隱藏規則，失敗同時清除href。驗收初次讀取失敗、開團轉已結團、成功後重新讀取失敗三種狀態。

### 4. 首頁正式切換不能直接覆蓋檔案

- design/complete-content.js從/index.html的#noticeModal讀取6則購物須知。替換index後若不搬移來源，會取得0則且沒有拋出錯誤。
- design/index.html仍有noindex、預覽提示、相對資產路徑及原版連結；缺正式首頁canonical/分享metadata。
- 現有sw.js快取優先保留舊首頁及共用JS，需驗證既有訪客更新流程。

提案：先產出正式首頁候選、內建或獨立保存須知，保留舊版可回復版本，補齊canonical/OG並整理正式資產路徑。用已有舊Service Worker的瀏覽器驗證新版可載入及可回復。

### 5. 延續既有收藏與成效資料

舊收藏key為eg_wishlist，新版為eaglish-design-saved；目前沒有遷移。新版沒有舊站的GA4設定與click_group等事件。這在私人預覽合理，但正式替換會使使用者看不到原收藏，也無法延續原本事件比較。

提案：正式版兼容並合併既有收藏；承接既有成效追蹤，確認購買、收藏、折扣碼、文章入口等事件不重複送出。預覽繼續避免污染正式成效。

## 次要改善

- 商品以品牌名當key：PLAFARM、Kamee各有兩筆open，另有同品牌不同狀態；不直接刪資料，先辨識不同商品/檔期，將商品與檔期ID分開避免收藏互相綁定。
- 全部選物可開啟的已結團商品彈窗仍顯示折扣碼，建議清楚標示歷史資訊或隱藏舊碼。首頁折扣區已正確過濾。
- 手機少量次要連結僅22–30px高，可擴大點按區而保持原視覺。
- 可縮短兩段英文眉題、統一生活筆記/選物部落格的導覽用詞；非必要改版。
- 主視覺family.webp本機約184KiB、兩個手寫SVG約10/12KiB，不是目前主要阻礙。本輪不是Lighthouse或真實行動網路速度報告。

## 建議執行順序

1. 修復商品身分與動態狀態：影片、資料刷新、按鈕隱藏、歷史折扣碼。
2. 完成正式首頁切換：須知來源、路徑與SEO、收藏承接、既有追蹤、舊快取更新與回復。
3. 在正式路徑結構測試主要互動與斷線/跨日情境；通過後依Hiram本次允許合格版本直接上線的授權發布並驗證正式網址。

目前僅完成audit與提案，未將以上建議宣稱為已實作。
