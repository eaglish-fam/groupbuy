# EBEN 生康普茶文章研究與素材回條（2026-09-29）

## 搜尋需求與取材

- 主要查詢：`康普茶`；延伸查詢：`生康普茶`、`EBEN 双柚`、`康普茶 口味 保存`。
- 台灣 Google Trends 過去 12 個月、網頁搜尋比較 `康普茶`／`生康普茶`：相對指數平均約 32／0，後者為低量四捨五入結果，不能解讀為零搜尋量或絕對月搜量。[比較頁](https://trends.google.com/trends/explore?geo=TW&q=%E5%BA%B7%E6%99%AE%E8%8C%B6,%E7%94%9F%E5%BA%B7%E6%99%AE%E8%8C%B6)
- Google Search 實讀同題材頁面：[PopDaily](https://www.popdaily.com.tw/forum/food/1548810?is_app=true)、[愛食記](https://ifoodie.tw/post/65c2e0597be9c33298ffcb36)、[SHIN](https://shin.tw/gc-well-kombucha/)、[Vogue Taiwan](https://www.vogue.com.tw/lifestyle/article/what-is-kombucha)、[ReMe](https://remetw.com/convenience-store-kombucha/)、[Women's Health Taiwan](https://www.womenshealthmag.com/tw/healthhealth/nutritionalsupplements/a62644846/healthy-me-club-club-box-2024-autumn/)、[PTT 討論](https://www.ptt.cc/bbs/CVS/M.1715662919.A.5AD.html)。多數談定義、購買或健康好處；本文以自有海邊實拍與家人試喝來回答「是什麼、怎麼挑」的具體疑問，不複製其文案或未驗證的健康說法。
- 產品資料由 [EBEN 品牌介紹](https://www.ebenkombucha.com.tw/pages/about-ebenkombucha)、[品牌首頁](https://www.ebenkombucha.com.tw/)、[双柚產品說明](https://www.ebenkombucha.com.tw/products/groupbuy_doublecitrus)交叉核對：台灣茶、發酵茶飲、冷藏保存與初釀／双柚等口味描述。
- [衛生福利部食品廣告提醒](https://www.mohw.gov.tw/cp-2704-76599-1.html)作為風險邊界：不把一般飲品寫成有排毒、減重、提升免疫等功效。

## 自有影像與版本判斷

- Hiram 2026-09-29 提供的三張照片：海邊飲用、冰桶雙柚、海邊橫幅；原檔均已上傳原有 [Eben Drive 資料夾](https://drive.google.com/drive/folders/15NpqPntENtDTdplFQgobDhXusFJD3v9Y)。詳見 `assets/eben/README.md` 的 Drive ID。
- Google Sheet `現正開團!Q3` 兩支自有影片分別為 [YouTube Short](https://youtube.com/shorts/CP4VrwcyUxs) 與 [Instagram Reel](https://www.instagram.com/reel/DIbVzxRTMlF/)；後者是舊拍攝，含舊價格及不宜沿用的功效字樣，僅取第 41 秒沒有上述宣稱的試喝畫面做海報。YouTube 取第 8 秒家庭餐桌畫面。兩個海報已上傳 Drive。
- 不使用舊影片價格、團購組合、療效、「無酒精」或特定族群適飲宣稱。本文 CTA 由前台即時讀取 Sheet，失敗時不提供購買連結。

## 編輯與發布邊界

本文主文是消費者可讀的生活選物筆記；研究與舊素材的排除理由只留在此內部回條。此稿為本機發行候選。文章頁、選物誌列表、產品卡、SEO 與 sitemap 需一起驗證，公開發布需以本次文章的明確授權執行。當期團購照片修正與 Sheet 更新屬於本次使用者直接要求的修復。

## 2026-09-29 消費者視角重寫

- 沿用原 research；針對新增「為什麼喝／發酵原理／酒精／商品款式」補讀與查核，不將舊資料回條冒充新研究。
- 實際沿用 pipeline 3.5.0 與 article-package/v4；完整 HTML 與 package 公開欄位同步檢查。
- EBEN FAQ https://www.ebenkombucha.com.tw/pages/kombucha-faq 官方圖片為 0–0.2%，不可將使用者提到的0.02–0.2%套成品類通則。正文只寫品牌歸因的0–0.2%、市售變異、自釀可能超過1%。
- 原始商售檢測 https://pmc.ncbi.nlm.nih.gov/articles/PMC8838605/ 顯示不同產品乙醇有差異，不能把品牌FAQ範圍套所有產品。自釀研究 https://pmc.ncbi.nlm.nih.gov/articles/PMC9141729/ 有超過1%的樣本，但直接酒精計可能受基質干擾，未把最大值當典型上限。
- 保存／需避酒者資訊：https://www.canada.ca/en/health-canada/services/publications/food-nutrition/ethanol-non-alcoholic-fermented-beverages.html 。發酵原理與裝瓶後變化：https://www.ttb.gov/regulated-commodities/beverage-alcohol/kombucha 。人體研究：https://www.nature.com/articles/s41598-024-80281-w ，不將研究結果當EBEN成品療效。
- 當期廠商圖支持三款主選口味及石榴紅、四款經典系列，六張實際截圖共覆蓋八款。沒有核定「雙效」定義，文章不虛構雙效健康宣稱。
- 12張實際圖片在320／390／768／1440皆正常；兩支影片點擊建立各自播放器、原平台連結保留，無水平溢出。購買按鈕移至底部三站導覽上方，避免遮住。
- 正文1620編輯計數；v4 package及最終HTML消費者文字檢查通過。npm run verify 242/242。
- 本輪沒有部署正式站、修改Sheet或上傳新圖至Drive。Tailscale候選以站內資產包交付，新版封面不回退到舊版Drive封面。
