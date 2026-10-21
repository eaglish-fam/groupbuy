# eaglish.store｜決定紀錄

Claude 能自己決定的記在這裡，Hiram 可以推翻。要 Hiram 決定的寫在「待決」。

## Claude 已經決定

- 2026-10-15：三方討論沿用問路專案的方式：共用分支 `claude/groupbuy-collab` + 不合併的追蹤用草稿 PR。repo 是公開的，所以討論內容不放私人資料。
- 2026-10-15：建置產生的圖片尺寸版本，已存在就不重壓（`--force` 才重壓），避免不同電腦產生不同 bytes。

## Hiram 已經決定

- 2026-10-21：**M5 上的 Claude Code 叫 Zosia**（不是 Grace）。Grace 是雲端那一個，負責 M5 裡的各專案、跟 Hiram 對話並派工給 Zosia。Zosia 的回覆、留言、commit、回條開頭寫「Zosia」。本檔上面寫「M5 Grace」的條目，指的都是 Zosia。
- 2026-10-21：M5 的 Claude Code 全機設成完全放行（不每步詢問），保留擋「推到 main」和「force-push」的規則；之後問路、小倉幫和新專案都可能在 M5 做。目前派給 M5 Grace 的工作只有團購專案，其他專案要另外派工。
- 2026-10-21：Hiram 在雲端跟 Grace 對話，Grace 把工作傳給 M5 的 Grace（Remote Control）做。M5 在 herdr 裡啟動的 Codex 一律限制只能寫工作資料夾、不用每步問人（`--sandbox workspace-write --ask-for-approval never`）；Codex CLI 升級交 Eliora B（G-002）。
- 2026-10-21：Codex 那邊有兩個 Eliora（A、B）；**負責團購和網站的是 Eliora B**。給 Eliora 的買物社工作一律開在 `docs/collab/requests/`，不寫到問路的 `Docs/M5-TODO.md`。
- 2026-10-15：舊的內部規範（Lydia 需求驗收、Kira 程式、城市攻略「一句話直接上線」）全部改成三方協作。所有網站改動走獨立分支與 PR，Hiram 核准才合併。
- 2026-10-15（Claude 依上一條決定的細節，Hiram 可推翻）：Lydia 的工作拆給 Hugo（資料正確、連結圖片檢查、SEO 待辦、正式站驗收）、Codex（內容缺口），Claude 寫工程需求與驗收條件；Kira 的程式工作由 Claude 接手。`AGENTS.md`、`docs/lydia-site-maintenance.md` 已改（Claude）；`docs/trip-editorial-guidelines.md` 第八節由 Codex 改。
- 2026-10-16：手機版「文章目錄」側標從 36px 縮成 24px（觸控最小寬度），取代原本「已確認」的 36px／7px／3px 規格，不再蓋住內文。PR #43；`docs/trip-editorial-guidelines.md` 第 39 行由 Codex 更新。
- 2026-10-16：Hiram 核准 #42（UX 第一、二階段）和 #43（側標 24px），條件是先保留舊版以便回退。還原點：分支 `rollback/pre-ux-20261016`（= `0c60950`，Para'Kito 剛上線、這兩個 PR 之前的正式站）。#42 合併為 `fea20aa`，#43 合併為 `b7adcfb`。**回退方式**：規則不准 force push，所以不重設 main。在 `rollback/pre-ux-20261016` 的內容上開一個新分支（`git checkout -b claude/restore-pre-ux origin/main && git checkout origin/rollback/pre-ux-20261016 -- . && git commit`），跑 `npm run verify` 後開 PR，Hiram 核准後合併。只退其中一個：對那個 PR 的合併 commit 做 `git revert -m 1`，再跑 verify。這個還原點不要刪。
- 2026-10-20：**轉述的核准有效**（Hiram 在 Grace 對話中選擇）。大家共用同一個 GitHub 帳號，分不出本人和轉述，所以加兩道防呆：① 轉述必須寫出 PR 編號（例如「Hiram 核准 #51」）；② Grace 合併前確認 PR 內容和轉述當時相同（比對 commit 的檔案樹；核准後有新推送、內容變了，就要重新核准）。第一次套用：#51，Hugo 2026-10-19 21:28 轉述，內容與當時的 `7e3db1c` 相同，合併為 `9138900`。
- 2026-10-20：流程自動化先做兩件（Hiram 選）：PR 自動跑 `npm run verify`、一個指令整合文章包（Codex 也能在自己分支跑）。一鍵候選站、需求統一登記暫不做。

## 待決（請 Hiram 決定）

- （目前沒有）
