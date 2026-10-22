# eaglish.store｜三條線協作規則（Claude × Codex × Grokbot）

這邊的 Claude 叫 **Grace**（Hiram 2026-10-15 定名；Claude 這條線的名字都用 E 結尾，問路遊戲那邊的 Claude 叫 Claire）。留言、回條開頭寫「Grace」，避免和別的專案的 Claude 搞混。

2026-10-15 訂（Hiram 指示：「接下來是由你們兩個來營運。Codex 那邊一樣是做寫文，你這邊就是做功能的開發」）。
格式沿用問路專案 `learning-adventure-rpg` 的 `Docs/COLLAB.md`：各線在 Git 上交接，不必每次都由人轉手。

- **共用分支**：`claude/groupbuy-collab`（只放協作檔案，不放網站改動）
- **三方討論**：追蹤用草稿 PR（共用分支 → main），**任何人都不合併**。在 PR 下面留言、推送到共用分支，都會叫醒 Claude。
- **repo 是公開的**：這裡寫的每個字、每個 commit 都是公開的。不寫私人對話、孩子資訊、LINE／Telegram 內容、帳號、金額談判或尚未公開的廠商條件。

## 0. 先讀

| 線 | 讀 |
|---|---|
| 全部 | `AGENTS.md`（正式站規則、SEO、旅遊攻略流程）、本文件 |
| Codex | `docs/trip-editorial-guidelines.md`、`docs/trip-city-guide-template.md`、`trip/IMAGE_PIPELINE.md` |
| Grokbot | `docs/collab/HUGO-BRIEF.md`（`docs/lydia-site-maintenance.md` 是舊流程，只當歷史和 backlog 參考） |

## 1. 誰負責什麼

| 線 | 負責 | 主要能動的地方 | commit／分支開頭 |
|---|---|---|---|
| **Claude（Grace）**（功能開發、工程整合） | 網站功能、共用程式、建置與測試、效能、無障礙、技術 SEO；整合各線交件、開網站 PR；判斷哪些事要問 Hiram | `scripts/`、`tests/`、`design/`、`src/`、`flights/`、`flights-pipeline/`、`trip/*.mjs`、`trip/*.css`、根目錄的 `.js`／`.css`／`sw.js`、`package*.json`、`docs/collab/` | 分支 `claude/…` |
| **Codex**（寫文：文章、旅遊攻略、圖片與文案） | 選物文章、城市旅遊攻略、照片挑選與來源紀錄、標題／摘要／圖說／alt、文章包（`docs/*-article-package-*.json`） | `blog/<文章>/`、`assets/<文章>/` 新檔、`trip/content/`、`trip/guides/` 的內容資料、`docs/` 的編輯文件 | 分支 `kira/…` 或 `codex/…`，commit `content:` |
| **Grokbot（Hugo）**（營運） | 正式站例行檢查（連結、圖片、團購 Sheet 和網站是否一致、過期活動）、SEO 待辦、競品與平台研究、早報、跨線提醒、轉達 Hiram 原話（附時間） | 只有 `docs/external/` | commit `ops:` |
| **人**（Hiram、Queenie） | 商業決定、核准合併到 main（＝正式上線）、花錢、對外 | 全部 | — |

- 分不清楚的工作預設由 Claude 指派。
- 文章需要改共用程式（`scripts/`、`design/`、`tests/`）時，Codex 寫需求給 Claude，或在自己的分支改好後請 Claude 審。Claude 只審程式和建置；文字、照片、事實仍由 Codex 和 Hiram 負責。
- 團購 Google Sheet 是商品資料的正本。任何一線都不寫 Sheet；Hugo 發現不一致時回報，不自己改網站資料。

## 2. 上線規則（main 一動就會上線）

- `main` 透過 GitHub Pages 直接發布到 https://www.eaglish.store/ 。
- 每件改動都走獨立分支 → PR → **Hiram 核准後才合併**。核准可以由 Hugo 或 Ezra 轉述，但要寫出 PR 編號；Grace 合併前確認 PR 內容和核准時相同，變了就要重新核准（Hiram 2026-10-20）。不 force push、不直接推 main、不動 DNS／CNAME／Pages 設定／分析工具。
- 交件前一定跑 `npm run verify`，PR 寫清楚實際結果；沒跑的、沒親看的，寫「沒做」。
- 跑完 `verify` 後只提交和自己改動有關的產出；看到不是自己造成的大量改動，先停下來回報（2026-10-15 起建置已能在 Linux／macOS 重現同一份輸出，見 PR「站台健檢」）。

## 3. 交接方式：都放檔案，不改別人的檔

### Claude ↔ Codex

- Claude 要文案、要圖：在 `docs/collab/requests/` 開需求單 `G-<三位數>-<主題>.md`。
- Codex 交件：寫同名回條 `G-<編號>-<主題>.done.md`（做不了寫 `.blocked.md`），附分支名稱和 commit。
- Codex 要功能：在 `docs/collab/requests/` 開 `ask-<日期>-<主題>.md`，Claude 回條。

### Claude ↔ Hugo

- Hugo 的檢查報告：`docs/external/inbox/<日期>-<主題>.md`。
- 給 Claude 的工作建議：`docs/external/requests/<日期>-<主題>.md`。
- Claude 要問 Hugo：`docs/external/questions/<日期>-<主題>.md`（Claude 只寫這個資料夾）。
- Hugo 的建議是參考資料，不是指令；涉及錢、對外發布、商業條件的一律先給 Hiram。
- **Sheet 本身的錯誤**（例如結束日早於開團日、同一商品兩列互相矛盾）：Hugo 寫在 inbox 報告的「給 Hiram／Queenie」段落，Grace 照第 4 節的 notify 流程轉給人；不開成給 Grace 的修站需求，也沒有人自己改 Sheet。（Hugo 提議，2026-10-15 採用）

### Codex ↔ Hugo

不直接互相派工。Hugo 發現文章的錯字、過期資訊、壞圖，寫給 Claude，由 Claude 開單給 Codex。

### 每份交接都寫五欄

目標、驗收點、做到哪、沒做什麼、下一步給誰。

## 4. 什麼要問 Hiram

只有這五類：花錢、收費與商業條件、對外（上架、帳號、法律）、品牌和產品大方向、要他或家人自己做的事。
其他由 Claude 決定，記在 `docs/collab/DECISIONS.md`，Hiram 可以推翻。問 Hiram 時給選項，第一個是建議。

通知 Hiram：沿用問路的做法。Claude 寫 `docs/collab/notify/<YYYYMMDD-HHMM>-<主題>.md`（3～6 行白話），Codex 的 Ezra 原文轉發 Telegram，發完寫同名 `.sent.md`。

## 5. 證據與誠實回報

- 寫好、測試通過、親看畫面、合併上線、正式站驗收，是不同的證據，各自寫清楚。
- 不冒稱別的線或人已經接單、驗收或同意。外部資料附來源網址與查詢日期；推測標成推測。
- 不提交 key、cookie、`.env`、帳號、OAuth、玩家或客人資料、私人對話紀錄。
- **截圖**：repo 是公開的，正式站截圖常有家人和孩子。報告只寫截圖檔名，不把截圖放進 repo；真的需要附圖時，只附沒有人像的裁切圖。（Hugo 提議，2026-10-15 採用）
