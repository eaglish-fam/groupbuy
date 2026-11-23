# 澳佳寶內容交件與工程整合需求

- **目標**：將澳佳寶長期選購文章接入既有選物誌、商品卡與動態團購購買機制。
- **驗收點**：品牌精確比對、文章與列表可到達、首圖與商品卡各用正確規格、早段及浮動購買入口讀 Sheet、完整 verify 通過；Hiram 核准後才合併上線。
- **做到哪**：Codex 已完成五款商品與關鍵字研究、正文、安全用詞對照、五款真實包裝裁圖、首圖／商品卡及 v4 文章包。內容候選已親驗 320／390／768／1440px；文章套件與 consumer HTML 檢查通過。主表開團入口已另完成並親驗正式站。
- **沒做什麼**：未改任何共用程式或登錄設定、未合併／發布文章、未發 LINE。完整 `npm run verify` 在 `build:content` 因缺少文章登錄而失敗，後續建置、審計及測試未執行；未將此結果視為通過。
- **下一步給誰**：Grace 依 PR #40 已接受的分工承接工程整合；完成後由主責親驗整合候選，交 Hiram 核准。LINE 草稿另私下審核，公開 repo 不放推播全文。

## 接線資料

| 欄位 | 值 |
| --- | --- |
| 內容分支 | `codex/blackmores-content-20261019` |
| 文章鍵／slug | `blackmores` |
| Sheet 品牌精確值 | `澳佳寶保健食品` |
| 正式文章路徑 | `/blog/blackmores/` |
| 文章包 | `docs/blackmores-article-package-v4.json` |
| 公開圖片來源及裁切紀錄 | `docs/blackmores-media-sources-v1.json` |
| 首圖 | `/assets/blackmores/cover.webp`，1600×1000；另有480／960版 |
| 商品卡 | `/assets/blackmores/product-card.webp`，1000×750；另有480／960版 |
| 首圖與商品卡製作檔 | `/assets/blackmores/cover-source.html`；商品卡為 `?mode=card` |

1. 在 `config/content-articles.json` 加上經審的 mode／intent／productNames；目前錯誤為 `Article blackmores needs reviewed mode/intent/productNames in config/content-articles.json`。
2. 在 `product-content.js` 登錄精確品牌、文章、首圖和獨立商品卡；串接選物誌列表、首頁文章輪播、sitemap 及相關入口。
3. 沿 Para’Kito 既有購買控制，接 `data-blackmores-early` 和 `data-blackmores-offer`，共用單一浮動按鈕。現況 `/#catalog` 是可點擊的安全後備；已實點早段與文末入口可到正式買物社。
4. 購買 URL、狀態、開結團日皆讀 Sheet，不把本次連結或任何固定檔期寫進永久正文、首圖或 JS 狀態文案；重開團時只需更新資料。結團後文章繼續可讀。
5. 完整供應商提案與安全用詞表留在私有來源，不隨 PR 公開。公開文章包列出已採用的原子事實及官方來源，供工程機械檢查；文字、照片與事實由 Codex 負責。
6. 整合後重跑完整 verify，核對共用字型／導覽注入後的最終 HTML，再親驗動態早段與浮動購買入口、完整站內發現入口和正式頁面。

可沿此內容 PR 整合或另建 `claude/…` 整合 PR；沒有發布核准前都保留候選。若需要通知 Hiram，請 Grace 依共用 notify 流程撰寫通知檔，再由真正 Ezra 原文轉發；此文件不是已發送通知。

## Codex 已完成的內容驗收

- 依當前官方標示採機伶小子4歲以上、飯後咀嚼、切勿整顆吞嚥及成人監督；產品頁 FAQ 的衝突未帶入正文。
- 成人配方為 B6；LC-Plasma為經熱處理非活菌，個數未寫成CFU。未核的其他營養數值省略，未編自有使用效果或影片。
- 首圖及商品卡經真正 Chrome 渲染，完整中文字與三款包裝均已目視；五款正文產品圖保留完整瓶蓋／瓶底或盒裝。
- 390px完成全部章節錨點、FAQ逐一展開、首度跳轉懶載入、早段與文末後備入口實點、目錄Escape關閉及焦點回復；320px首屏及比較表無橫向溢出；768px首屏與魚油圖、1440px首屏及全部產品圖已目視。
- 結果是「編輯內容候選可交接」，不是「工程整合或正式站驗收通過」。
