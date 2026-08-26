# Lydia × Kira｜eaglish.store 維護方式

## 現在的接線

```text
團購 Sheet／公開網站／營運問題
              ↓
       Lydia 定義需求與驗收
              ↓
eaglish-fam/groupbuy（唯一程式庫）
              ↓
   Kira 隔離開發、測試、回退準備
              ↓
        Hiram 核准正式發布
              ↓
GitHub Pages main → www.eaglish.store
```

Lydia 不維護另一份網站，也不把 Agent Studio 當成網站原始碼。Agent Studio 目前只會讀取團購資料產生摘要。

## 日常流程

1. Lydia 從 Sheet、公開頁、連結檢查或 Hiram／Queenie 指示建立有來源的網站維護項目。
2. Kira 從最新 `origin/main` 建立隔離 worktree。
3. Kira 實作功能、SEO、效能或無障礙候選，並執行 `npm run verify`。
4. 候選以 commit、測試結果、前後差異與回退方式交付。
5. 只有取得正式發布授權後才 push／merge；`main` 會直接由 GitHub Pages 發布。

## 驗證指令

```bash
npm ci
npm run verify
```

`npm run audit:site` 會生成 `reports/site-maintenance-baseline-v1.json`。報告只包含程式與公開網站檢查結果，不包含 token、Sheet 原始內容、LINE 訊息或使用者資料。

## 2026-08-26 首次盤點

已確認：

- GitHub repository 為 public `eaglish-fam/groupbuy`，default branch 是 `main`。
- GitHub Pages 從 `main` repository root 發布到 `www.eaglish.store`。
- 本機 canonical clone 與 `origin/main` 同為 `fd62f438868f0173449f0551630b6608999f2c2c`。
- `https://www.eaglish.store/`、`robots.txt` 與 `sitemap.xml` 可讀。

目前需保留在 backlog、不可靜默掩蓋的問題：

1. GitHub Pages 回報 `https_enforced: false`，`http://www.eaglish.store/` 不會轉址至 HTTPS。
2. `https://eaglish.store/` 的 apex domain 目前連線逾時；只有 `www` 版本可穩定使用。
3. 首頁缺少 self-referencing canonical link。
4. Search Console verification meta 的 content 疑似包含多餘的 `google-site-verification=` 前綴，需在 Search Console 確認後修正。
5. YouTube iframe 缺少可存取的 `title`。
6. sitemap 的既有 `lastmod` 仍停在 2026-04-30；本機 primary checkout 有一份尚未納入 Git 的自動更新 workflow，不能在未審閱前當成 production authority。
7. `llms.txt` 將品牌主理人寫成「Hiram 與 Zosia」，需要 Hiram／Queenie 確認正式對外說法後才能修改。

## 不在本次候選內

- 沒有修改正式網站內容。
- 沒有修改團購 Sheet。
- 沒有採用 primary checkout 裡未追蹤的 `.github/workflows/sitemap.yml`。
- 沒有 push、PR、merge、GitHub Pages、DNS、CNAME 或 HTTPS 設定變更。
