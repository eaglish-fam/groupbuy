# Grace 交接（2026-10-22 19:10 台灣時間）

從舊的雲端對話（10-15 開、主 repo 是問路）交給只接 groupbuy 的新 Grace 對話。Hiram 決定留一個 Grace 對話。公開 repo，只寫公開安全的內容。

先讀：`docs/collab/COLLAB.md`、`docs/collab/DECISIONS.md`（最上面幾條是最新的）。

## 進行中

| 事項 | 狀態 | 下一步 |
|---|---|---|
| **日本／北海道候選**（Bingo 派工單 `docs/external/requests/2026-10-21-trip-hokkaido-v1-grace.md`） | 工程在 Draft PR #57（`claude/trip-japan-support-20261021`，不合併）；內容在 Codex 的 Draft PR #56。整合分支 `claude/hokkaido-integration-20261022`（`e09848b`）＝ Codex `86d4054` ＋ #57 ＋ main，本機 verify 533/533，Codex 可以快轉 | 等 Codex 快轉並親驗 |
| **日本三頁先上線**（日本入口、旭川、札幌；路線篇不含） | Hiram 10-22：先看三頁截圖（Codex 放在 M5 `~/agent-bridge/bingo-eliora/to-bingo/`），由 Bingo 拿給他看 | Hiram 說可以上線後，開上線 PR：正式登錄要能放多個公包（目前 `approved-travel-registration-v1.json` 只能放一個）、日本 `publication:true`、內容索引、R24 首頁／世界地圖 discovery 加日本與亞洲、sitemap、回退方式。PR 先給 Codex 驗收，再等 Hiram 核准 |
| **北海道 7 天路線篇** | Hiram 10-22 給了：旭川↔札幌「搭車」（不是自己開車）、機場搭 Uber、嬰兒照片可露臉。每天的日序還沒給 | Codex 依影片／IG 排一版 D1–D7，經 Bingo 給 Hiram 確認 |
| **首頁 SEO 通用關鍵字＋`/how-to-join/`**（Bingo 第 3 件） | Hiram 10-22：方向可以。文案還沒交（`docs/collab/requests/G-003-seo-copy.md`） | Codex 交文案 → Hiram 確認文案 → Grace 做，分支 `claude/seo-generic-20261021` |
| **#59 正式站驗收** | 已合併（`12a996d`）：電腦版目錄避開標頭、國家頁照片 sizes | Bingo 在正式站確認 |

## 已完成（這兩天）

#52～#55、#58、#59 已合併；#54（GA4 保留 UTM）是 Zosia 做的。#60（手機目錄標籤）是新 Grace 對話做的。

## 規則（Hiram 這兩天定的）

- **要看的東西一律交 Bingo 給 Hiram**：截圖和說明放 M5 `~/agent-bridge/bingo-eliora/to-bingo/<日期>-<誰>-<PR>/`。雲端 Grace 拍不到 M5，就把腳本傳給 Zosia（M5 的 Claude Code，對話名稱現在是「Josie | M5 本機」，session `session_017Yivgk4fHNveZssejLwCMb`）在 M5 跑。範例腳本：`docs/collab/tools/bingo-shots-pr57.mjs`（改之前／改之後對照＋候選頁三種寬度）。截圖有家人和孩子，不進 repo。
- **問 Hiram 要寫清楚「建議做什麼」**，他回好或不要；不要留開放式問題，也不要用工程術語。跟 Hiram 用繁體中文。
- 轉述的核准要寫 PR 編號；合併前確認 PR 內容和核准時一樣。
- Zosia 自己合併 PR 的權限：暫緩。Codex 自動審查「額度用完」的留言、GitHub Actions 付費額度：不處理。

## 派工給 Zosia（M5）

`send_message` 到上面的 session；先 `get_session` 確認她閒著。她不能回訊息，看她的回覆要用 `list_events`（kinds `result`）。
