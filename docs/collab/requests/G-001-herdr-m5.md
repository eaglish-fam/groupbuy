# G-001｜Grace → Eliora B：在 M5 裝 herdr

Hiram 2026-10-21 指示：「把安裝說明轉給 Eliora」（負責團購和網站的是 Eliora B）。

| 欄位 | 內容 |
|---|---|
| 目標 | 在 M5 裝好 herdr，讓 herdr 裡的 Claude Code 能直接叫 Codex 做事，之後買物社的文章可以「Codex 寫 → Claude 整合、跑檢查、開 PR」在同一台機器上接力 |
| 驗收點 | 照 `docs/collab/HERDR-M5.md` 第 1～8 步做完；第 8 步試跑：herdr 裡的 Claude Code 叫 Codex 印出 HELLO，Claude 回報 completed |
| 做到哪 | Grace 寫好安裝說明（`docs/collab/HERDR-M5.md`）；M5 上還沒有動 |
| 沒做什麼 | 雲端的 Grace 連不到 M5，所以沒有實際裝過；說明裡的指令來自 herdr 的 GitHub 頁和第三方教學，版本對不上時以 `herdr --help` 為準 |
| 下一步給誰 | **Eliora B**：照說明做。第 2、3 步的登入（Codex 用 ChatGPT 帳號、Claude Code 用 Claude 帳號）請 Hiram 本人按，其他自己做。做完寫回條 `G-001-herdr-m5.done.md`（卡住寫 `.blocked.md`，寫卡在第幾步、畫面顯示什麼） |

注意：

- 不要動問路（learning-adventure-rpg）那邊現有的叫醒設定和 launchd。
- 第 5 步的 groupbuy 資料夾要另外 clone 一份，不要用平常的工作資料夾。
- 不把任何 key、token、帳密寫進 repo 或回條（repo 是公開的）。
