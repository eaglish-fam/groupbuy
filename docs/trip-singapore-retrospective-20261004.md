# 新加坡製作復盤｜Eliora B · 2026-10-04

## 結論

這次讓 Hiram 多次修正，責任在製作與最終驗收：既有文字準則沒有逐欄執行，共用版型沒有完整接線，技術檢查被當作讀者體驗通過。以清邁為參考的固定閱讀結構，加上 Hiram 後續滿版指令，才是目前核准標準。g9-v1 已由 Hiram 核准正式發布；歷史版本與回條保存。

| 已觀察問題 | 成因與責任 | 此後固定驗收 |
| --- | --- | --- |
| 短卡過窄、文字過長 | 導覽入口混入正文；未比對清邁真正格數與短文字 | 桌機3欄／手機2欄、3:2照片，名稱／玩法／時間，首次點一下到詳解並聚焦標題 |
| 重複「不是、不用、不要、不等於」 | 來源辨別與內部防錯說明露出公稿；編輯與Root未逐欄親讀 | 全部公開文字逐句語意編修，直接寫地點、玩法、可行條件；lint只列候選，由Alma確認 |
| 飯店三代訂房教訓清單 | 泛用教訓擠占實住資訊 | 整塊刪除指定清單；寫地點、房間、床、餐飲、交通與實住觀察 |
| 一景點照片不足 | 張數盤點未轉成每站完整圖組 | 每站3張獨立真實互補場景，stable assetId/source/timecode/rights/alt/caption、完整人物 |
| 實用資料變成預設dl/dd | 最終整版回歸漏掉此元件；mobile CSS失效具體原因未證實 | facts/story元件單一來源critical style，桌機與手機親看標題、底色、細線、label/value間距、長文字換行 |
| 行程前置／入口不一致 | 沿舊城市版本拼接，shared helper未完整採用 | FAQ→#plan→完整影片；同一58×58兩行入口、focus、sticky／底部安全區避讓 |
| g8 首圖左右空帶 | contain保人物卻未適配固定橫框；Root把完整人物誤當構圖合格 | 滿版與完整人物同時必要。真實比例決定框與共用排列，照片內部空帶退回；親看像素，不只看object-fit與尺寸 |
| g10 新增首頁新加坡卡上下空帶 | Root 正式首頁實圖發現：文章圖片標記與固定3:2入口框受到首頁contain樣式作用；新增首頁入口未逐圖驗收 | g12 單卡改接首頁既有R22來源感知圖框，使用原圖1280×720比例，保留瀑布、屋頂與植栽；1440／390／320實圖及真實導流逐項驗收，其他卡與已核正文保持原樣。最終正式驗收仍由Root親做 |
| 公開建置依賴本機私有packet | 私人候選可驗收，卻未達跨機可維護發布 | 公共安全內容與來源資料隨repo版本固定；乾淨checkout可重建同一頁；private流程與正式可索引發布分開 |

## 一句城市名進入同一 pipeline

Hiram 說「做香港旅遊攻略」時，自行盤點既有授權素材、完整影片場景與current canon，取真實Alma/Terra/Luca/Kira交付，完成研究→寫作→媒體→同模板→內部退稿回修→Root親讀與實圖/操作→正式發布→Root正式網址與discovery驗收→真Ezra通知。每階段都有可開實物與當版本證據。只有核心身份/使用權或實際旅行範圍無法在現有來源確定時才精準詢問；已存在的資料自行查。

最新人類城市製作請求含其通過內部品管版本的正式發布授權；Hiram指定「草稿／預覽」時以指定階段交付。這是手動請求帶動的製作，無新scheduler、背景自動發文、未請求城市、DNS／權限／commercial scope。作者不把讀者要的公開文字變成審核報告，完成也不以排程或派工數量表示。

## 骨架、資料與來源

固定的是閱讀順序、字級／cream-Songti元件、短卡、facts/story、後置plan與shared launcher；城市輸入的是文字、來源照片、真實比例、地點身份與route/day/holiday facts。禁止逐城複製一份HTML/CSS再任意改版。公共包另存核准正文、alt/caption、當前事實日期與source IDs／公開來源，private原片／憑證／worker packet保留Project內。

## 完成條件

Alma親讀所有公稿欄位與具體事實；Luca親看每張源圖和衍生crop；Terra查現況來源；Kira完成public portable build、verify、meaningful contracts/每支援route及公開導覽；Eliora親讀渲染全文、逐張看全部實圖和320/390/1440各重要元件，做真正首次lazy跳轉、目錄與plan互動。最後發布commit／部署／正式頁與資產實際可取，Root親自正式頁驗收，真Ezra保存單版本去重 provider message_id。圖片存在、HTTP200或同名助手自報各屬支援證據。

Canonical 更新到 existing docs/trip-editorial-guidelines.md，圖片細則保留 trip/IMAGE_PIPELINE.md、版型細則保留 docs/trip-city-guide-template.md，repo AGENTS 指向同一入口；此文件只保存本次復盤歷史，不建立第二套流程。由真正Alma做寫作規範定稿，Root整合與品質判斷，Kira接線和正式發布。

## 本案證據

下列 `review/`、`briefs/` 名稱是內部 Project 的相對追溯名稱，並非本公開 repository 的檔案或可下載連結；私人原片、派工回條及完整審核紀錄保留在原 Project。

人類修正：Eliora B 負責對話中 2026-10-03／04 的圖片及文字；Root g8桌機首圖照片留白（review/root-g8-desktop-hero-v1.png）；g9實際滿版 desktop/mobile review（review/root-g9-cua-review-v1.json）；相同正文與125資產proof（review/root-g9-integrity-v1.json）；Root受影響scope重驗（review/root-g9-final-acceptance-v1.json）；Hiram當前核准發布與一句話要求（briefs/hiram-publication-and-one-line-pipeline-authority-v1.json）。原因未證實的事件保持未知；source hash與review status不當成美感pass。

Root 在 g10 正式首頁找到的新增卡片空帶另留 review/root-g10-production-home-card-v2.png；g12 只回修這張首頁入口與同一驗收條款釐清，保留 g10 已發布文章、媒體及 g11 主線規範，不把首頁缺陷寫成已核正文或語意修正失效。
