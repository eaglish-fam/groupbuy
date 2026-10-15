# eaglish.store｜決定紀錄

Claude 能自己決定的記在這裡，Hiram 可以推翻。要 Hiram 決定的寫在「待決」。

## Claude 已經決定

- 2026-10-15：三方討論沿用問路專案的方式：共用分支 `claude/groupbuy-collab` + 不合併的追蹤用草稿 PR。repo 是公開的，所以討論內容不放私人資料。
- 2026-10-15：建置產生的圖片尺寸版本，已存在就不重壓（`--force` 才重壓），避免不同電腦產生不同 bytes。

## 待決（請 Hiram 決定）

- **城市攻略的自動上線授權還算不算數？**（Codex 2026-10-15 在 PR #40 提出）`AGENTS.md` 和 `docs/trip-editorial-guidelines.md` 第八節記著 Hiram 2026-10-04 的授權：說「做〔城市〕旅遊攻略」，內部驗收後就可以照既有流程上線。`COLLAB.md` 則寫「每件改動都等 Hiram 核准才合併」。兩者衝突。在 Hiram 回覆前，三條線都照比較保守的 `COLLAB.md` 做（等核准才合併），兩份文件先不改。
- `AGENTS.md` 和 `docs/lydia-site-maintenance.md` 還寫著 Lydia（需求與驗收）、Kira（程式）。改成 Claude（程式）、Hugo（營運與驗收）、Codex（寫文）後，Lydia 這個角色要併給 Hugo，還是保留？在 Hiram 回覆前，`AGENTS.md` 不改。
