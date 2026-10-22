# Codex → Grace：日本4頁候選工程支援

| 欄位 | 內容 |
|---|---|
| 目標 | 依 `docs/external/requests/2026-10-21-trip-hokkaido-v1-grace.md` 支援日本入口、旭川札幌7天路線、旭川與札幌城市候選 |
| 驗收點 | 獨立日本公包 noindex，不進首頁/世界/ sitemap；既有Europe/Malaysia6頁內容不變；重用斯瓦巴/KL/挪威元件；1440/390/320無溢出、首跳與後置plan可操作 |
| 做到哪 | Codex分支 `codex/trip-hokkaido-v1-20261021` 從 `origin/main` 1960de1建立；開始來源缺口研究與原照盤點。將提供 `trip/data/japan-approved-travel-v1.json`、新WebP與來源表；目前尚未定稿 |
| 沒做什麼 | 沒改共用程式、沒有登錄候選或正式發布，沒有編造7日日序、住宿、雪場/合作性質；沒有合併 |
| 下一步給誰 | Grace：決定下述工程契約與分支，於PR40回覆；Codex依固定契約交資料，再整合Grace核定實作跑build/verify與親驗 |

## 請先確認的接點

1. 單一登錄不能把publication=false套到現有正式包。請支援獨立日本候選登錄，保留現有公開輸出。
2. 路線頁選 A（獨立route）或 B（region+referencePlans）請由Grace定，記DECISIONS並給精確資料欄位；Codex先按referencePlans保存已核日序，不用集數猜日數。
3. 建議路徑 `/trip/japan/`、`/trip/japan/hokkaido-asahikawa-sapporo-7-days/`、`/trip/guides/asahikawa-with-kids/`、`/trip/guides/sapporo-with-kids/`。
4. 地圖重用Natural Earth，日本全圖/北海道視角，接旭川/札幌/小樽/新千歲機場可靠座標；小樽和機場可href到路線段落。點/文字入口一致。請解除只接受既有歐洲城市的hardcoded白名單，不能臨時造道路。
5. 字型子集含旭川、札幌等新標題；同Songti系統和既有延後載入。手機320地名標籤不重疊。
6. 候選資料未完成前可用synthetic fixture驗機制，但不可當作真實文章/來源或照片驗收。請交工程branch/commit、契約、實際測試與未做項，不合併。

Codex最後交Draft PR及私下noindex Tailnet預覽；截圖僅M5橋接資料夾，公開repo只列檔名。工程請沿三線協作，不發Telegram/LINE。

## 來源補充對工程語意的影響（同日）

派工補充已確認住宿基地為札幌Airbnb；旭川無過夜。請勿讓日本入口的城市選擇器強制產生「旭川入住/退房/跨城換宿」。現有country allocation假設分配城市停留與移動日；若不適用札幌基地的往返結構，請Grace採明確支持的日遊/固定路線方式，不能用假住宿或虛構移動日讓模型過驗證。實際7日日序仍查核，未定前不以fixture或推薦路線冒充歷史日程。

現行 `renderMultiViewCountryMap` 已存在，但目前驗證每個point需為公包city且href屬該guide；小樽/機場點須由Grace提供可驗證的route-anchor語意，不能額外開兩座假城市。Codex提供經核座標與來源。
