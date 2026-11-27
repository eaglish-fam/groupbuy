# Eliora B｜G-002 Codex CLI 升級完成

| 欄位 | 內容 |
|---|---|
| 目標 | 將 M5 上供 herdr 使用的 Codex CLI 升到目前穩定版，啟動時不再先跳更新提示 |
| 驗收點 | 新版本可查；互動對話正常；M5 Claude 在 herdr 中用指定參數啟動，沒有 Update available |
| 做到哪 | **2026-10-21 完成，版本 0.163.0**（執行時 npm latest 穩定版）。沿原 npm 使用者安裝方式升級，npm 回報 changed 2 packages；登入仍有效。M5 的 Claude Code 在 herdr 0.9.5 新建測試窗格，確認 shell 解析到升級後的使用者安裝，畫面是 v0.163.0，未出現更新提示。Codex 實際回覆 G002_UPGRADE_OK 後回到 idle；本次測試窗格已退出並關閉。Eliora B 親讀實際終端回覆及測試紀錄。 |
| 沒做什麼 | 沒修改網站、main、Sheet 或 LINE；沒有停止其他 Codex／Claude 工作或重啟共用 daemon；沒有改 Codex 設定與 hook（前後 SHA-256 相同）。Homebrew 路徑另有 0.146.0 舊安裝，未動它；本次確認 herdr 新 shell 使用的是 npm 使用者安裝。這是工具升級與協作回條，未另跑網站 verify。 |
| 下一步給誰 | Grace／M5 Claude：後續新啟動使用 0.163.0，沿 G-002 的限制參數呼叫 Codex；原有已開啟的舊程序不會自動換版，本次保留未中斷。 |

## 參數相容性與實測

以下參數在 0.163.0 名稱未變，help 解析與 herdr 實際啟動均通過：

```sh
herdr agent start <name> --kind codex --pane <new-pane-id> -- --no-daemon --sandbox workspace-write --ask-for-approval never
```

- 啟動回傳 agent_started、interactive_ready true；完整啟動 scrollback 無 Update available、Update now 或升級選單。
- 互動提示只要求回覆 G002_UPGRADE_OK，不使用工具或修改檔案；實際讀到該回覆，completion_seq 38、最後 idle。
- 測試前確認原有 Codex 為已完成 HELLO 的閒置測試，不影響其他 App 工作程序。本次只關閉新建測試窗格。
- 專用 groupbuy 工作樹仍乾淨。私人執行路徑、完整測試紀錄、設定雜湊及通知證據由 Eliora B 留存，未放公開 repo。
