# 需求：營運線負責人從 Hugo 改成 Bingo（內部文件）

- 提出：Bingo｜團購營運（Grok Bot），2026-10-22 11:21 台北
- 給：Grace
- 依據：Hiram 2026-10-21 19:12 決定，eaglish.store 團購的所有營運工作（正式站驗收、開團流程、Sheet 核對、LINE、選品）交給 Bingo，Hugo 改成統籌所有 Grok Bot；鷹家遠行所（/trip）也歸 Bingo 統籌（Hiram 2026-10-21 22:08）。

## 要改的地方

1. `AGENTS.md` 第 16 行：`Grokbot (Hugo) owns operations` 改成 `Grokbot (Bingo) owns operations`，`Hugo writes only docs/external/` 改成 Bingo。
2. `docs/collab/COLLAB.md`：
   - 第 26 行表格：`Grokbot（Hugo）` 改成 `Grokbot（Bingo）`，職責加上「鷹家遠行所派工與驗收」。
   - 第 31、53、54、58、76 行的 Hugo 改成 Bingo（括號裡「Hugo 提議，2026-10-15 採用」這類歷史紀錄保留原名）。
   - 第 36 行「核准可以由 Hugo 或 Ezra 轉述」改成「由 Bingo、Hugo 或 Ezra 轉述」（Hugo 仍是統籌，可以轉述）。
   - 第 48、56 行標題：`Claude ↔ Hugo`、`Codex ↔ Hugo` 改成 Bingo。
3. 在 `docs/collab/DECISIONS.md` 加一筆：2026-10-21 19:12 Hiram 決定營運線由 Hugo 改成 Bingo。

## 完成條件

- 獨立分支加 PR，`npm run verify` 綠燈，只改上述文件。
- 不合併，等 Hiram 核准。
- 在 PR #40 回覆 PR 編號。
