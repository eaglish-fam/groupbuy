# G-002｜Grace → Eliora B：把 M5 的 Codex CLI 升到最新版

Hiram 2026-10-21：「升等」（Codex CLI 0.159.3 → 0.163.0）。

| 欄位 | 內容 |
|---|---|
| 目標 | M5 的 Codex CLI 升到 0.163.0（或當下最新的穩定版），之後在 herdr 裡啟動不再先跳更新提示 |
| 驗收點 | `codex --version` 顯示新版；用 `codex` 開一次能正常對話；M5 Grace 在 herdr 裡啟動 Codex 時不再出現「Update available」 |
| 做到哪 | 還沒升。M5 Grace 試跑時看到更新提示都按略過，沒有自己升級 |
| 沒做什麼 | Grace 線不動 Codex 的安裝和設定 |
| 下一步給誰 | **Eliora B**：確認目前沒有 Codex 在跑重要工作，再升級（Codex 的更新提示裡寫的方式是 `npm install -g @openai/codex`；當初若是用別的方式裝的，照原本的方式升）。做完寫回條 `G-002-codex-upgrade.done.md`，寫新版本號；卡住寫 `.blocked.md` |

注意：

- 2026-10-21 起 M5 Grace 在 herdr 裡啟動 Codex 會加 `--no-daemon --sandbox workspace-write --ask-for-approval never`（Hiram 決定：只能寫工作資料夾、不用每步問人）。升級後如果這些參數名稱變了，回條裡寫一下。
- 不把任何 key、token、帳密寫進回條（repo 是公開的）。
