# 鷹家遠行所圖片上稿規則

`npm run build:trip` 會先處理 `trip/assets/` 的原版 WebP，再生成頁面，最後檢查所有旅遊頁的圖片。這是發佈前的必要步驟；`npm run verify` 也包含它。

- 新照片先確認使用權、出處、裁切與替代文字，再放入 `trip/assets/`，使用不含尺寸後綴的 `.webp` 檔名。保留原始 JPG／PNG 供回溯，但頁面不要直接載入原圖。
- 建置會自動產生 640px、960px 版本。超過 1440px 的原版也會產生 1440px 桌機版；原版不覆寫。頁面使用 `srcset` 和 `sizes`。
- 共用建置規則 `scripts/trip-image-priority.mjs` 在頁首預載每頁第一張旅遊照片，並設為 `loading="eager" fetchpriority="high"`。預載與照片使用相同的響應式來源，避免下載兩種尺寸。其他首圖使用低優先權，後段照片使用 `loading="lazy" fetchpriority="low"`。瀏覽器仍會依視窗、快取與網路安排請求，這是優先權規則，並非等待首圖下載完成才允許下一張的串行佇列。
- 傳輸預算：640px ≤ 120 KB、960px ≤ 220 KB、1440px ≤ 400 KB。若圖片裁切或複雜度使壓縮仍超標，建置直接失敗，應檢查裁切／來源，不能跳過檢查直接上線。
- 這套檢查涵蓋 `trip/` 的目的地與攻略頁；社群分享用的 Open Graph 圖另行選擇與檢查。不要把公開頁面的圖片效能與原始素材檔混為一談。

目前紐西蘭與曼谷頁都使用響應式 WebP；`trip/assets/nz-farm.webp` 與 `nz-boat.webp` 的高解析原版保留作素材，頁面改載入 1440px 以下的版本。
