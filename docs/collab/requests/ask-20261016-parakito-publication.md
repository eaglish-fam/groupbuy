# Para’Kito 文章發布整合交件（Codex → Celeste）

## 目標

把已完成編輯驗收的 Para’Kito 選購文章上線到 `/blog/parakito/`。本交件只帶入文章、原始核准媒體及文章專用 CSS/JS，不覆蓋後來的正式站更新。

## 驗收點

- 正式文章、選物誌列表、法國帕洛防蚊液商品卡的閱讀入口、sitemap 和分享資訊一致。
- 桌機及 320／390／768px 手機平板圖片完整，目錄與頁內影片正常；購買入口依現有 Sheet 的精確品牌記錄判定，未開放時不暴露購買連結。
- 本文不改寫、不換圖。`blog/parakito/index.html` SHA-256：`3aecb254fe1a7c6078dca297f062677ffc585629aa68906070ede78834e33f12`。
- 跑完整 `npm run verify`、現行瀏覽器驗收與正式部署驗收。不得把未完成註冊的內容分支直接合併。

## 做到哪

- 本分支從 `5a332100761d2f6e45a29fc87d23653fa2468684` 建立。
- 精確沿用既有編輯來源 `5f5c6aaf47990fdd3ee86de3fc7e7b8bbd53216f` 的 `blog/parakito/`、`assets/parakito/`、`media/parakito/`；最終 HTML 與已驗收文章逐位元相同。
- 文章 package 重新驗證 ready，1572 編輯字元，公開 HTML 檢查零錯誤。
- 保留既有素材版本，不使用舊來源的整份首頁、共用程式或產出覆蓋 main。
- 本次確實執行 `npm run verify`：在 `build:content` 停止，錯誤為 `Article parakito needs reviewed mode/intent/productNames in config/content-articles.json`；catalog 尚未註冊是確定的整合缺口，不是文章通過全站測試。`git diff --check` 通過。

## 沒做什麼

- 未修改共用程式、Sheet、DNS、Pages 設定、其他文章；未合併、未上線。
- 未在這個內容分支完成 catalog／封面註冊及共用建置整合，因此不能把這份 PR 當成可直接發布的完整網站版本。
- 本分支尚無正式站驗收；發送不屬於此公開 PR 的執行範圍。

## 下一步給誰

請 Celeste 依三線規則完成工程整合與發布 PR。所需來源已在既有 commit `5f5c6aa`：

1. 僅加入 `product-content.js` 的 `parakito` catalog entry，保留 main 的所有其他 entry（尤其心窪 coverAlt）。
2. 加入 `config/blog-cover-identities.json` 對應封面識別及資產來源；沿用現行圖片衍生檔 registry 規則，不覆蓋 registry。
3. 以現行 builder 產出 blog index、content index、首頁入口、entry image widths、sitemap、必要 reports；不要沿用舊生成檔。補上 `/blog/parakito/` 的 llms 入口。
4. 既有 `tests/parakito-article.test.mjs` 可從 `5f5c6aa` 作為參考；把相依測試調整納入工程審查，不降低閘門。
5. 依現行 PR 核准流程發布；若仍須針對發布 PR 取得核准，直接列出 PR，不能自行宣稱核准已完成。

請回覆實際整合分支／PR、測試結果及部署 SHA（如已核准並部署），不要以接單代替完成。

### 不依賴本機歷史 commit 的整合資料

原 commit 可能尚未推到遠端；以下提供足夠的公開內容映射，歷史 SHA 只作來源定位。

- catalog key／id：`parakito`；精確品牌：`法國帕洛防蚊液`。
- article：`/blog/parakito/`；category：`親子戶外`；published：`2026-10-15`（沿用已驗收文章 metadata）。
- title：`Para’Kito 防蚊液怎麼選？噴霧、滾珠與防蚊手環比較`。
- readingTitle：`Para’Kito 防蚊用品｜四款配方與使用形式`。
- excerpt：`噴霧、滾珠、手環怎麼挑？比較四款配方、使用方式與補充片，搭配我們的戶外影片和照片。`
- image：`/assets/parakito/cover.webp`；1600×1000；SHA-256 `bc16169fac7de0e85b28112909a803c4ad36bf1a68bb3487ff2ac7e75dcd6a3e`。
- cover source：`/assets/parakito/cover-source.webp`；SHA-256 `d19bb9c0e319a21f881aa69352155eef1375eafaac051baf748a0d8b5eb698ef`。
- 圖像是核准原始照片排版；此前已由負責對話驗收 320／390／768／1440，這是既有編輯證據，仍需新基底工程與正式站親驗。
- offer 測試：同精確品牌、URL `https://gbf.tw/qdfm4`、短期、日期 `2026-10-15` 至 `2026-10-21`；10/15 和 10/21 應 open、10/22 應 closed。未取得唯一有效記錄時 fail closed。
- 正文／媒體核對：單一 H1、8 個章節目錄錨點、完整原生影片、只有一個 `data-parakito-offer`，手機商品比較不溢出；實際章節數請以 HTML 為準。
