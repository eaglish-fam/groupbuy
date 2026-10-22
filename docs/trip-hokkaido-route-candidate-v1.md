# 北海道七天路線候選｜續接原四頁任務

| 目標 | 驗收點 | 做到哪 | 沒做什麼 | 下一步給誰 |
|---|---|---|---|---|
| 完成原第四篇可開啟的候選 | 七天建議與實訪故事分區；沿用原路線版型；noindex；三種寬度親驗 | 既有 renderer 產生路線 HTML，保留三頁已發布版本，未改共用程式 | 未宣稱還原完整七天；未發布路線、未修改正式登錄與公開入口 | 原內容主責驗收；正式接入的工程仍由既有 M5 主責處理 |

## 寫作與證據界線

- 開頭、路線一覽與住宿 FAQ 都明寫這是依實訪素材編排的「七天建議」。旭川兩晚、札幌四晚是建議分配。
- 七天表依序是抵達、動物園、參觀與跨城、兩天滑雪、小樽、離境。抵達、移動及離境各有對應日型，沒有列成完整遊玩日。
- 七個建議日之後另放三節「實訪故事」，保留既有八章、十八段敘事。當次遇到的採買、分工、四站取捨、滑雪休息、小樽用餐及回程均留在故事中。
- 原七格影片證據還原表保留在 `docs/trip-hokkaido-v1-route-draft.md`，與新建議排法分開。已證事件有影片與時碼；未交代的日期、跨城方式、住宿日號保留「影片未提」。返程口述超過一週與原七天口徑的差異沒有被新建議消除。
- 札幌完整市區可以替換第六天的小樽；兩段都要時需延長或調出其他活動。離境日只保留充足餘裕時的一段短採買。
- Airbnb 不提供地址或房源連結。iSKI 合作揭露保留。

## 內容與圖片

- 完整候選輸入：`trip/data/japan-hokkaido-route-candidate-v1.json`，沿用 `eaglish.approved-travel-package/v1` 與既有驗證器。
- 這是凍結的候選快照：包含已發布日本包的兩座城市供來源、圖片、連結驗證，加上本篇路線與三張小樽圖。只有路線 HTML 是這次新增的頁面；正式日本公包內容及雜湊維持不變。
- 小樽主圖是自家 Facebook 原照，兩張輔圖是自有影片畫格；分別呈現家人、孩子與運河景觀。保留原比例、原圖 sha256、畫格 PTS／timebase 和 640／960／1440 版本，沒有補背景或遮臉。
- 運河主圖遠岸紅衣人影無可辨識臉、非主體；三張小樽圖都沒有嬰兒。既有動物園家庭照及滑雪照片沿用原採用範圍。
- 沒有新增陌生旅客近照、原始逐字稿、私有路徑或內部任務資料。

## 沿用現有建置，不改版型

在 repo 根目錄可重現候選 HTML：

```sh
node --input-type=module <<'JS'
import fs from 'node:fs';
import {validateApprovedTravelPackage} from './trip/approved-travel-contract.mjs';
import {renderApprovedRoute} from './scripts/trip-route-approved-adapter.mjs';
const data=JSON.parse(fs.readFileSync('trip/data/japan-hokkaido-route-candidate-v1.json'));
validateApprovedTravelPackage(data);
fs.mkdirSync('trip/japan/hokkaido-asahikawa-sapporo-7-days',{recursive:true});
fs.writeFileSync('trip/japan/hokkaido-asahikawa-sapporo-7-days/index.html',
  renderApprovedRoute(data,'hokkaido-seven-days',{publication:false}));
JS
npm run verify
```

候選快照不加入正式登錄，也不加入目前以整包路徑為單位的候選登錄，以免重複宣告已發布的日本入口與兩座城市。它是待接入的內容候選，不能只把 HTML 的 noindex 拿掉便當作正式發布。

## 驗收與交件

- 既有公包驗證器通過；路線七日、來源引用、站內連結和圖片 lineage 皆可解析。
- `npm run verify` 完整通過 540／540，0 skipped。沒有修改 scripts、tests、CSS 或其他共用程式。
- 候選 HTML 是 `noindex,nofollow`，私有 HTTPS 預覽另加 HTTP noindex；正式 sitemap、llms.txt、公開旅遊索引和世界入口沒有這篇。
- 手機與桌機截圖放 M5 共用資料夾，不進 repo。預覽網址已私下交付。
- 正式發布前仍由既有工程主責將本篇採用資料接回正式日本包、更新雜湊綁定、反向連結、國家路線入口及必要地圖節點，重新建置並驗收。
