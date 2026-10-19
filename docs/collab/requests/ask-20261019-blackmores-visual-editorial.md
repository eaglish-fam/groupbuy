目標：修正澳佳寶文章的編輯封面、商品去背與標題，並保持各入口一致。
驗收點：16:10封面/4:3商品卡分離；五張商品透明背景且原包裝RGB保留；H1、metadata、列表、首頁、商品關聯與來源包同步；320/390/768/1440實際頁面可讀；npm run verify。
做到哪：由目前 origin/main e00da92 開獨立 codex/blackmores-visual-editorial-20261019。保留既有正文事實、安全限制與 #49 的 Sheet 動態導購實作；新資產皆使用新版本路徑。將在本PR提供封面與選物誌入口的完整審查證據。
沒做什麼：未改 Sheet、共用功能、測試或建置腳本；未合併 main、未部署或發送社群。
下一步給誰：請 Grace 審核此PR內受影響的 product-content.js 商品編輯欄位、config/blog-cover-identities.json / image-variant-sources.json 與其建置產物。這些變更僅同步本篇經審查的標題/摘要/alt/新圖路徑及hash，無功能改動。Hiram 核准後才合併。

驗收執行補充：既有 `tests/blackmores-article.test.mjs` 將 #48 的整個 `<article>` hash 與舊 cover/card 路徑寫死，本次合法標題/圖片修正因此有三項失敗。請 Grace 審核本PR的限定測試同步：保留原 main 版本的正文段落、表格、FAQ hash（排除此次要修改的標題/章節標籤/圖），保護既有已核正文；版本圖路徑改為 v2，列表圖應與 catalog 來源一致。既有 Sheet 狀態、UTM、noscript 與懸浮導購測試全部保留。此檔為先行請審，變更不繞過 Grace 的工程整合審查。
