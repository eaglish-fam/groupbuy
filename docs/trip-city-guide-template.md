# 城市指南共用模板 v1 · 2026-10-04

Canonical 製作流程：[編輯準則](trip-editorial-guidelines.md)、[媒體 pipeline](../trip/IMAGE_PIPELINE.md)。此檔只定義同流程使用的版型，基準為清邁真實桌面與手機頁。

| 元件 | 固定模板 | 城市資料／接線 |
| --- | --- | --- |
| 首屏 | breadcrumb → 英文 eyebrow → H1 主＋次標 → 兩句 lead → 作者／更新日 | 核准 title 可依既有冒號拆行；文字、作者與日期由城市資料供應 |
| Hero | main、support-1、support-2；真實尺寸選擇 portraits／landscapes／mixed 共用分支 | 每張照片填滿自己的原比例媒體版位，同時保留完整人臉、主要人物與重要景物；禁止照片內部空帶、補景或拉伸 |
| 圖片版位 | 三直圖桌機按來源比例分欄並排；橫圖桌機左主右輔，混合圖按比例分欄；手機上主、下兩輔按比例配對 | 由每張 width／height 預留原比例，無固定橫框；caption 沿用核准文案放在照片下方，不遮人物 |
| 短卡 | 3:2，desktop 三欄／手機兩欄；名稱、玩法、時間 | 逐卡 approved photo、focal、place ID；長文留正文 |
| 正文 | 每景點一主＋兩輔實拍、本文、短家族記錄、實用資料 | 當城景點、三圖原比例、官方來源與查核日期 |
| 後段 | 飲食 → 住宿 → 交通 → 雨備 → FAQ → #plan → 影片 → 延伸 | 區域、Maps、營業、票種、影片及延伸；模組標籤共用、內容標題沿用城市核准文案 |
| 試排 | ①天數、②步調、③日期 → 單日切換；晚置 FAQ 後 | 城市已支援天數、路線、維護／營業限制；SG 六路線18天內容，無換區演算法 |
| 入口 | 現有 58×58 兩行行程／規劃；H2 focus；sticky、安全區及固定底導覽避讓 | plan、footer 或閱讀抽屜可見時隱藏；href #plan |
| 視覺 | Songti、奶油砂岩、暖棕 H3、inline robust facts/story | 城市實際來源與內容；人物及資訊完整 |

實作：`scripts/trip-city-guide-template.mjs` 提供固定排序、目錄標籤、首屏 renderer 與 `cityGuideHeroLayout`；`trip/city-guide-template.css` 只對 `.city-guide` opt-in。新加坡 `trip-singapore-approved-renderer.mjs` 實際接線；圖組模式、欄寬及每張比例由真實 dimensions 推得，重用 `trip-planner-entry.mjs` 及既有 launcher CSS/JS。Generic helper 不讀新加坡資料，後續城市提供相同 slots 與模組即可接線。

2026-10-04 滿版修正優先於歷史 g8 contain 固定槽位例外：grid gap、文章外側留白是版面間距，照片自身四邊須到實際照片邊緣。原始來源、active picture、focal、尺寸與裁切紀錄保留；必要裁切須逐圖證實人物與景物完整，不符時調整框比例／排列或另選已核准素材，不以奶油、黑色、模糊、生成延伸、遮罩或拉伸填空。本規則適用首屏、短卡、正文與未來城市；本次只修新加坡首屏，既有正文與短卡不重做。

## 遷移狀態

| 城市 | 當前狀態 |
| --- | --- |
| 新加坡 | 採用已驗收 g9 的 source-aware 滿版首屏與正文；`trip/data/singapore-public-article-v1.json`、`singapore-publication-v1.json` 與公共 build 可在乾淨 checkout 重建。g8／g9 私人歷史保留；正式發布與最終驗收以 Pages 及負責對話的實際回條為準 |
| 清邁 | 已發布版型與 late planner 的實際參照；本次 HTML 未改，未接新 helper |
| 清萊 | 既有後置工具；未接新 helper，待獨立核准遷移 |
| 曼谷 | legacy 前置工具；未遷移，本次未改 |
| 基督城／Akaroa | legacy FAQ 前工具；未遷移，本次未改 |
| 其他城市 | 先盤點素材與已支援工具，再依當次核准遷移 |

共用模板 CSS 保存在單一檔案，建置時將同一份既有 trip 基礎、Bangkok 元件、城市 adapter 明確提供的 compatibility CSS、目錄、站點導覽、模板與 launcher 樣式以精確 SHA256 嵌入 head；標題層級、向量品牌尺寸、正文、首屏構圖、planner 與 #plan sticky 避讓在外部樣式請求延遲時仍保持一致。私人預覽同步封閉 inline CSS 字型路徑並重算雜湊；外部 CSS 仍納入完整 bundle，來源樣式檔不另造一套副本。既有 g7 facts/story critical style 原樣保留。

清邁與新加坡目前重整會恢復試排預設，share URL restore 尚未接線。首屏 QA 使用 new tab → set viewport → goto，親看 1440px、390px、320px 的每張實圖：滿版無內部空帶、完整人物／人臉、caption 清晰、無橫向溢出。object-fit 名稱、尺寸或 HTTP 僅輔助證據；首次跳轉及路線狀態仍須依受影響範圍驗證。未支援功能記為缺口，驗收與發布權限分開。
