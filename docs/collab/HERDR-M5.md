# 在 M5 裝 herdr：讓 Claude Code 直接叫 Codex 做事

Hiram 2026-10-21 要的安裝說明。照順序做，每一步後面有「怎麼確認裝好了」。
這份只講安裝和試跑，**不改現在的三方分工和核准規則**：所有改網站的東西照舊開 PR、Hiram 核准才合併。

## 這是什麼（一段話）

herdr 是在終端機裡開好幾個 AI 的工作區（像 tmux）。Claude Code 和 Codex 各在一個窗格裡跑，
Claude Code 可以自己開新窗格叫 Codex、把工作交給它、等它做完再收結果。
不用再透過 GitHub 檔案和 Telegram 轉來轉去叫醒彼此。
官方網站：https://herdr.dev　原始碼：https://github.com/herdrdev/herdr（Apache-2.0、免費）

## 先知道的事

- **要在 M5 本機跑**。雲端的 Grace（這個 session）連不到 M5，所以 herdr 裡的 Claude Code 是 M5 上另開的一個。
- **額度照算**：Codex 用你 ChatGPT 帳號的 Codex 額度，Claude Code 用你 Claude 帳號的額度。herdr 本身不收錢。
- **M5 要開著**，關機或睡眠時窗格裡的工作會停（herdr 會記住版面，重開可以接回）。
- herdr 還在 0.x 版，指令名稱改過。下面寫的指令如果對不上，以 `herdr --help` 為準。
- 不要把任何 key、token、帳密寫進 repo 或這份文件。登入都在各工具自己的登入畫面做。

## 第 1 步：裝 herdr

打開「終端機」，貼上：

```sh
brew install herdr
```

（沒有 Homebrew 的話改用：`curl -fsSL https://herdr.dev/install.sh | sh`）

確認：`herdr --version` 會印出版本號。

## 第 2 步：裝 Codex CLI 並登入

```sh
brew install --cask codex      # 或：npm install -g @openai/codex
codex                          # 第一次開會請你登入，選「用 ChatGPT 帳號登入」
```

確認：`codex --version` 有版本號；在 `codex` 裡打一句「hi」會回話。打 `/exit` 離開。

## 第 3 步：裝 Claude Code 並登入（M5 上如果還沒有）

```sh
curl -fsSL https://claude.ai/install.sh | bash
claude                         # 第一次開會請你登入 Claude 帳號
```

確認：`claude --version` 有版本號。

## 第 4 步：讓 herdr 認得 Claude Code 和 Codex

```sh
herdr integration install claude
herdr integration install codex
herdr integration status
```

確認：`status` 兩個都顯示已安裝。這一步會改 `~/.claude` 和 `~/.codex` 裡的設定（加 hook），
是 herdr 官方的做法，不要手動去覆蓋那兩個資料夾裡原本的設定檔。

## 第 5 步：準備一份專用的 groupbuy 工作資料夾

不要和你平常用的資料夾混在一起：

```sh
mkdir -p ~/herdr-work && cd ~/herdr-work
git clone https://github.com/eaglish-fam/groupbuy.git
cd groupbuy
npm ci
```

## 第 6 步：開 herdr，在裡面開 Claude Code

```sh
cd ~/herdr-work/groupbuy
herdr
```

進去後在第一個窗格打 `claude`。
離開但讓它繼續跑：按 `ctrl+b` 再按 `q`。要回來：再打 `herdr`。

## 第 7 步：裝「Claude 叫 Codex」的外掛（建議）

在 Claude Code 裡依序打這三行：

```
/plugin marketplace add yigitkonur/claude-code-herdr-plugin
/plugin install claude-code-herdr-plugin
/reload-plugins
```

這是社群做的外掛（不是 herdr 或 Anthropic 官方），作用是讓 Claude 把工作交給 Codex 後，
每一輪拿回一個清楚的狀態（做完／有問題要問／等你核准計畫／卡住）。
不想裝外掛也可以：Claude Code 會用 herdr 自己的指令（`herdr agent start`、`herdr agent prompt … --wait`）叫 Codex，只是比較陽春。

## 第 8 步：試跑一次

在 Claude Code 裡說：

> 叫 codex 印出 HELLO 然後停下來。

成功的樣子：旁邊多開一個 Codex 窗格，大約 30 秒後 Claude 回報「completed」。

## 之後怎麼用（給買物社的例子）

在 Claude Code 裡用一般的話講就好，例如：

- 「請 codex 依 docs/ 裡的文章包寫 XX 的選購指南草稿，先給我看計畫」→ Codex 先提計畫，你在對話裡點頭它才寫。
- 「codex 寫完後，你跑 `npm run integrate -- <slug>` 和 `npm run verify`，開 PR 給我」→ Claude 整合、檢查、開 PR。
- 「讓 codex 在另一個 git worktree 裡改，不要動目前的分支」→ 有風險的改動隔開做。

規則不變：

- 只推到自己的分支、開 PR；**不推 main、不 force-push**，Hiram 核准才合併。
- 不寫 Google Sheet、不碰 LINE、不放私人資料或孩子資訊到 repo（repo 是公開的）。
- Hugo 的上線驗收照舊。

## 卡住時

| 狀況 | 先試 |
|---|---|
| `herdr` 指令找不到 | 重開終端機；或 `brew reinstall herdr` |
| Claude 說找不到 `$HERDR_PANE_ID` | Claude Code 要在 herdr 的窗格裡開，不是一般終端機 |
| Codex 窗格一直在等 | 切過去看它在問什麼（多半是第一次的權限確認），回答後再回 Claude |
| 指令名稱對不上 | `herdr --help`、`herdr agent --help` 看目前版本的寫法 |
| 想全部移除 | Claude Code 裡 `/plugin uninstall claude-code-herdr-plugin`；終端機 `brew uninstall herdr` |

參考：herdr 官方文件 https://herdr.dev/docs/ 、外掛 https://github.com/yigitkonur/claude-code-herdr-plugin
