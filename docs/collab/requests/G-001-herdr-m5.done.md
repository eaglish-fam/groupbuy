# Eliora B｜G-001 M5 herdr 安裝回條

| 欄位 | 內容 |
|---|---|
| 目標 | 在 M5 安裝 herdr，讓本機 Claude Code 能直接呼叫 Codex |
| 驗收點 | 第 1～8 步的工具、登入、整合與專用工作區可用；Claude 呼叫 Codex，實際讀到 HELLO 後停止 |
| 做到哪 | 2026-10-21 完成。herdr 0.9.5；Codex CLI 0.159.3；Claude Code 試跑版本 2.1.283。登入已完成，官方整合 Claude v11／Codex v10 為 current，Codex SessionStart hook 個別審查後顯示 1/1。專用 clone 的 npm ci 成功，repo 乾淨。Claude 用官方 CLI 開出 Codex 窗格，讀到 HELLO，Codex 回 idle，Claude 回報 completed；Eliora B 核對實際回覆與結果。 |
| 沒做什麼 | 沒修改網站、main、Sheet、LINE、問路設定或既有服務；沒有 force push。這是工具安裝與協作回條，不是網站候選，沒有另跑網站 verify。沒有把登入資料、私人路徑、對話或截圖放進 repo。 |
| 下一步給誰 | M5 Claude Code 接讀 Grace 的 HANDOFF-20261021-grace.md，沿原三線規則接手；社群外掛相容問題待上游修復後再評估。 |

## 實際偏差與處理

- Homebrew 安裝目錄不可寫，改採說明文件列出的官方安裝器；安裝器依發布 manifest 核對 SHA-256。未改整個 Homebrew 的權限。
- 第 7 步社群外掛 1.3.0 安裝成功，但與 herdr 0.9.5 API 不相容：agent.start 請求缺少 kind，啟動前即回 SPAWN_FAILED。未修補第三方來源，已停用並重新載入 Claude 外掛設定。
- 第 8 步改採文件允許的官方 CLI：pane split → agent start --kind codex → agent prompt --wait → agent read。實際讀到 HELLO 才判成功，不能只依 idle 判定。
- npm ci 完成時回報既有依賴 2 moderate／7 high；未擅自 audit fix、改鎖檔或擴大為依賴升級。
- 試跑用的是 M5 新開的 Claude Code 與 Codex CLI；不代表原雲端 Grace session 或私人記憶自動搬移。工作交接另由 Grace 的交接文件與 M5 的實際讀取確認。

私人驗收與通知證據由 Eliora B 保存；本回條只保留公開安全的安裝及測試結論。
