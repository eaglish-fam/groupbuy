# 泰國三城互動入口

## 範圍

- 正式路徑 `/trip/thailand/`，延續奶油砂岩、可可字色、橘紅訊號點與既有品牌字標。
- 地圖選城市、城市相片卡、12 個既有實訪景點的玩法／城市篩選、分批顯示。
- 後置城市天數分配器與四字懸浮入口。3–14 天，悠閒／緊湊、抵達城市選擇、可複製分享連結。
- 此工具分配完整遊玩日，不偽裝成已查詢班機或即時交通的逐小時行程。抵達／離境各預留一日，轉移城市各預留一日；各城詳細景點、營業與預約仍連回原攻略。
- 未增加商店主站的旅遊入口，未修改三篇攻略，也未改票券、價格或外部資料。

## UI/UX Pro Max 的採用

使用 design-system 查詢 `travel editorial interactive map`。搜尋回傳的 Aurora／漸層方向與已核准品牌不符，不採用；採用其觸控尺寸、焦點、可讀對比、降低動態效果及手機驗收規則。地圖用 HTML 錨點疊圖，鍵盤可用，無 hover-only 操作；無 JavaScript 仍可閱讀城市與所有景點卡。

## 圖片與生成紀錄

- 模式：內建 ImageGen（非 CLI／API）；插畫作為地理概念示意，自有旅行照片負責呈現真實景點。
- 原圖保留：`/Users/zosia/.codex/generated_images/01a01a15-1f65-72b0-9957-3537f872d7f1/exec-04144052-d198-4a1d-8de9-b6551d1c5627.png`。
- 網站資產：`trip/assets/thailand-atlas.webp`（1200px，74,622 bytes），`thailand-atlas-960.webp`（41,410 bytes），`thailand-atlas-640.webp`（23,902 bytes）。
- 首張地圖預載且 high priority；其餘照片 lazy / low、固定尺寸與 responsive srcset。城市相片與景點圖重用既有資產，無新增第三方地圖 SDK。
- 地圖標記為插畫內相對位置；Google Maps 詳細地點連結保留在各景點攻略中。

### 最終生成 prompt

Use case: stylized-concept. Asset type: background illustration for an interactive Thailand travel atlas, NOT a screenshot of a website. Create a charming loosely hand-drawn map of the entire country of Thailand, north up, recognizable geographically faithful silhouette including the long southern peninsula, the broad northeastern region, and the Gulf of Thailand. Single map centered on warm ivory paper (#faf7f0), square composition, Thailand occupies approximately 75% of canvas height and 65% width. Style: contemporary independent travel journal, confident imperfect pencil/ink outlines, flat sandstone washes, a few broad rough brush marks, intentionally simple not intricate. Cocoa-brown linework, cream and sand land, tiny terracotta accents, faint dusty blue sea hatching only. Absolutely no green, no gradients, no 3D, no glossy vector aesthetic. Small loose mountain strokes in far north, a tiny outlined temple near central Bangkok and a few subtle wave marks off the southern coast. Leave most interior calm and clear for interactive city pins added in HTML. Do not draw any pins, route lines, labels, lettering, words, numbers, legends, compass text, or interface components. Keep Chiang Mai and Chiang Rai areas in northwest/north unobstructed; keep central Bangkok area unobstructed. No national boundaries of neighboring countries. The result should feel like a warm minimal illustrated atlas, playful through line and shape rather than decorative clutter.

## 技術與資料

- `scripts/trip-thailand-hub.mjs`：建置時引用原城市景點 catalog 與圖片 helper，輸出可搜尋靜態內容。
- `trip/thailand-model.mjs`：城市資料、天數分配及分享狀態正規化；HTML 對使用者字串不直接插值。
- `trip/thailand-hub.mjs`：城市切換、玩法篩選、漸進顯示、旅程分享。
- Canonical 不變，新增 CollectionPage、保留 BreadcrumbList。原城市 index 入口與詳解連結均保留。
- 不載入新地圖供應商、不呼叫模型、不需 API key、不保存個資；分享連結僅包含城市、天數、步調。

## 驗收

- 全站 npm run verify 通過，184/184 測試；460 個圖片候選尺寸通過預算檢查，SEO blocking 0，20 個既有非阻擋警告。
- 桌機、390px／360px 手機及 768px 平板通過城市切換、清邁標籤完整、玩法篩選、空集合、行程天數不足提示及分享回復檢查；無橫向溢出。
- 回復方式：針對這次發佈 commit 進行 revert，再走既有 GitHub Pages 發佈流程。
