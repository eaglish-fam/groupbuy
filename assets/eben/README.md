# EBEN 團購素材來源

2026-09-29 從鷹式一家 Google Drive 的 [Eben 資料夾](https://drive.google.com/drive/folders/15NpqPntENtDTdplFQgobDhXusFJD3v9Y) 找回素材，供 2026-09-28～10-04 團購卡片使用。圖片為 2026-05 建立的既有素材；當期價格與組合以 [品牌團購頁](https://www.ebenkombucha.com.tw/events/eaglishfam) 為準。

- `cover.webp`：原檔 `Eben main.png`，Drive ID `1XMvo1A4-ZFZ921DfcaB-IvZqO-7gOefq`；僅轉 WebP 格式。
- `flavors-first-brew.jpg`：原檔 `IMG_2898.PNG`，Drive ID `1OWClPBDmMfPsSotqbrGto0Opbr1kE7gL`。
- `flavors-citrus-grape.jpg`：原檔 `IMG_2899.PNG`，Drive ID `1dkDlc1unZB4rGarEPCXxhYcZvvQiUoCa`。
- `flavors-ume-roselle.jpg`：原檔 `IMG_2900.PNG`，Drive ID `1z09P7VDhsFqLFESHLt2r6hb4l7IEwuPn`。

未使用 `eben.PNG`（含未核對的健康功效文案）與 `IMG_2901.PNG`（舊版比較圖）；不把它們當作本次活動宣稱。

## 2026-09-29 新增的文章素材

Hiram 提供的三張海邊原始照片先上傳至同一個 Eben Drive 資料夾，再轉為站內 WebP；文章圖片載入失敗時回退到各自公開的 Drive 原檔。團購 Sheet 的 T3 已附上原始照片網址，J3 使用原有公開的封面圖。

- `beach-sip.webp`：原檔 Drive ID `1oYSP6mz8cYxl0KpaH2vvYNEyfzmTwMXk`。
- `double-citrus-cooler.webp`：原檔 Drive ID `1W8iWU2eoE5QPqYSfyauXIq2cq9tuqpTE`。
- `beach-portrait.webp`：原檔 Drive ID `1-yqthmA25YvicQVMKdz-yhOk2q3cuFIn`。
- `blog-cover.webp`：以上一張橫幅實拍與標題排版製作；目前為消費者視角修訂版，排版來源為 `blog-cover-source.html`。Drive ID `1gmLUplRTWvrrqu1Z939I9aYZlT_kXfuV` 是初版歷史檔，不再作為新版封面 fallback。
- `video-youtube-poster.webp`：鷹式一家 YouTube Short `CP4VrwcyUxs` 第 8 秒截圖；Drive ID `1Q3F6AdjbWfFQPQkfAMLYmBGXIbQ7PovR`。
- `video-instagram-poster.webp`：鷹式一家 Instagram Reel `DIbVzxRTMlF` 第 41 秒截圖；Drive ID `1Zq1F_iZYagLrNk_B98Of0ww8TsCKgGm1`。舊片其餘畫面可能有舊活動或功效字樣，文章沒有把它用於當期宣稱。

## 消費者視角修訂（2026-09-29）

- 首圖改為左右獨立區塊，右側實拍以人物與手中瓶子為中心；封面由可重現的 HTML/CSS 排版截圖輸出，人物與產品未重繪。
- `vendor-first-brew.webp`、`vendor-double-citrus.webp`、`vendor-plum.webp`、`vendor-roselle.webp`、`vendor-classic.webp`、`vendor-tea.webp` 為當期團購頁實際商品圖的瀏覽器局部截圖，保存完整瓶身及相鄰配方／風味資訊。
- 每張來源 URL、觀察日期與截圖範圍見 `vendor-screenshot-provenance.json`。截圖排除網站浮動選單，未改寫圖中文字或產品外觀。
- 新增截圖隨網站候選保存在 assets，Tailscale 預覽內嵌同一批實際檔案避免子資源載入問題；未寫入 Google Sheet 或冒稱已上傳 Drive。既有照片與影片海報仍保留 Drive fallback。

## ImageGen 發酵解說圖（2026-09-29）

Hiram 明確要求將發酵段落圖像化。`kombucha-ingredients-diagram.webp` 與 `kombucha-fermentation-diagram.webp` 由內建 ImageGen 生成，為一般原理解說，非商品實拍或自釀操作指南。圖上保留「部分酒精」與有氧轉化概念，旁邊正文保留殘糖與微量酒精限制。兩圖均1536×1024，網頁完整呈現、延後載入，支援點圖放大。提示詞、科學來源及輸出雜湊見 `fermentation-diagrams-provenance.json`。
