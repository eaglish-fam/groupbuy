# 鷹家遠行所圖片上稿規則

版本：2026-10-04。沿用 [canonical 編輯流程](../docs/trip-editorial-guidelines.md)與[固定城市模板](../docs/trip-city-guide-template.md)，實際清邁為構圖基準；這是同一製作 pipeline 的媒體步驟。

城市名 → 真實 YouTube／IG／照片來源與權利 → 逐景點一主＋兩輔 → 官方事實與直接文案／alt／caption → 同模板接線 → 真實桌面／手機與首次跳轉 QA → 負責對話候選驗收 → 既有正式發布 → 負責對話正式頁驗收 → 真正 Ezra 版本去重 Telegram 回條。啟動範圍、草稿／預覽例外與發布權限依 [canonical 第八節](../docs/trip-editorial-guidelines.md)；本檔不另建製作流程。缺來源、畫面或事實保留具體缺件。

首屏固定 main + support-1 + support-2 身份；首頁國家入口、國家城市主圖、城市 main 優先已核自有原照 3:2 衍生圖，共用同一地點身份。原照缺少才用乾淨代表畫格並記錄原因；不選有無關對話字幕的主圖，不抹字、不生成補景。真正直式素材保留 source-aware paired 例外；support 與正文由真實 width／height 決定共用分支：三直圖桌面原比例並排，橫圖左主右輔，混合圖按來源比例分欄；手機上主圖、下兩輔圖按比例並排。2026-10-04 Hiram 滿版要求優先於歷史 g8 contain 固定框：每張實際照片填滿自己的媒體版位，同時保留完整人臉、主要人物與重要景物，caption 在照片下方。正文每景點三張互補實拍採 source-aware main+pair；短入口卡使用核准 3:2 裁切，桌面三欄、手機兩欄。本次歐洲修訂只替換核准主圖及相關 metadata；既有 support、正文三圖、facts 與故事保存。

照片內部的左右／上下空帶是缺陷，grid gap 與文章外側留白是正常版面間距。禁止背景顏色、黑色、模糊延伸、生成補景、拉伸或遮罩填空；也不為滿版硬切人臉。框比例不合時調整比例／排列或另選已核准素材。保留精確原始來源、active picture、focal point、dimensions、裁切與衍生 hash；多城市只替換資料及素材。

首屏親自驗收 1440／390／320px 的 Tailnet 首次開頁（new tab → set viewport → goto）：逐張確認像素滿版、人物／人臉完整、caption 清晰、不遮主體、無橫向溢出。CSS object-fit 名稱、尺寸或 HTTP 200 僅輔助，不能代替實圖構圖判斷；原始與 active source、裁切紀錄及截圖隨版本保存。

`npm run build:trip` 會先處理 `trip/assets/` 的原版 WebP，再生成頁面，最後檢查所有旅遊頁的圖片。這是發佈前的必要步驟；`npm run verify` 也包含它。

- 新照片先確認使用權、出處、裁切與替代文字，再放入 `trip/assets/`，使用不含尺寸後綴的 `.webp` 檔名。保留原始 JPG／PNG 供回溯，但頁面不要直接載入原圖。
- 建置會自動產生 640px、960px 版本。超過 1440px 的原版也會產生 1440px 桌機版；原版不覆寫。頁面使用 `srcset` 和 `sizes`。
- 共用建置規則 `scripts/trip-image-priority.mjs` 在頁首預載每頁第一張旅遊照片，並設為 `loading="eager" fetchpriority="high"`。預載與照片使用相同的響應式來源，避免下載兩種尺寸。其他首圖使用低優先權，後段照片使用 `loading="lazy" fetchpriority="low"`。瀏覽器仍會依視窗、快取與網路安排請求，這是優先權規則，並非等待首圖下載完成才允許下一張的串行佇列。
- 傳輸預算：640px ≤ 120 KB、960px ≤ 220 KB、1440px ≤ 400 KB。若圖片裁切或複雜度使壓縮仍超標，建置直接失敗，應檢查裁切／來源，不能跳過檢查直接上線。
- 這套檢查涵蓋 `trip/` 的目的地與攻略頁；社群分享用的 Open Graph 圖另行選擇與檢查。不要把公開頁面的圖片效能與原始素材檔混為一談。

目前紐西蘭與曼谷頁都使用響應式 WebP；`trip/assets/nz-farm.webp` 與 `nz-boat.webp` 的高解析原版保留作素材，頁面改載入 1440px 以下的版本。

## 影片畫格的讀者視覺驗收

- 先逐幀確認是否有原片 letterbox；不要把編碼在原片內的上下黑條直接當成文章照片上稿。沒有黑條的畫格保持完整，不為統一比例硬裁。
- 只移除有證據的黑條，保留 active picture、字幕、人物與景物；不得用黑遮罩遮字幕、抹字、生成修補或拉伸實景。字幕若與黑條重疊須另選合適畫格或交回審核，不能犧牲內容換取外觀。
- 來源紀錄須保留原影片 hash、同幀 PTS／timebase、裁切座標與前後尺寸、衍生 hash；舊版保留。公開圖像修訂使用新 URL／variants，避免讀到舊快取。
- width／height 和載入前的 CSS aspect-ratio 預留空間以裁切後真實比例為準；不把 active picture 強制套回 16:9。驗收包含逐圖、手機／桌面實際頁面與尚未載入圖片時的首次目錄跳轉，不只檢查檔案存在。
