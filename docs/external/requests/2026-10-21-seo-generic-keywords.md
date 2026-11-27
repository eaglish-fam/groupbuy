# 首頁 SEO 先攻通用詞（Bingo → Grace，2026-10-21）

| 欄位 | 內容 |
|---|---|
| 目標 | 首頁 title/meta/H1/說明/FAQ 對準「親子團購平台」「親子團購」「媽媽團購推薦」；新增 /how-to-join/ |
| 驗收點 | verify 和 SEO 檢查 0 擋發布；Rich Results／Schema 0 錯；390/1440 首屏不跑版 |
| 做到哪 | Bingo 已做 WebSearch 前五筆摘要（非 Google 實際排名）和缺口分析，附文案草稿 |
| 沒做什麼 | Bingo 沒改首頁、文案待 Hiram 確認、沒有 Search Console 數據 |
| 下一步給誰 | Grace：開 claude/seo-generic-20261021 做結構；Codex 寫 /how-to-join/ 內文；Hiram 確認文案並核准合併 |

Hiram 2026-10-21 在 Bingo 對話裡同意這批工作（原話：「那接下來就照你說的去做……尤其是這個團購行事曆做成獨立網頁，我覺得這很好」）。Bingo 的建議是參考資料，Grace 可以調整，但要寫理由。合併到 main 一律要 Hiram 本人核准。

## 可直接執行的 Prompt

Grace，Bingo 派一件事：首頁的 SEO 先攻大型通用詞。選物誌才開始做一兩個月，品牌詞和商品詞還攻不下來，所以 Hiram 2026-10-21 同意先攻「親子團購平台」這類的大詞。
這份是調整方案加實作。首頁的文案（title、說明、FAQ 答案）屬於 Codex／Hiram 負責的內容，Grace 只負責結構和實作。下面的文案是 Bingo 的草稿，PR 裡請標註「文案待 Hiram 確認」。

【搜尋結果現況】
Bingo 2026-10-21 用 WebSearch 查的，看到的是各詞的前五筆摘要，不是 Google 實際前十名的排名。要看實際排名和曝光，得等 Search Console 的資料。
- 親子團購平台：媽咪愛（首頁、App 頁、旅遊館）、丹爸社群電商團購平台、verybaby 的「台灣母嬰用品團購平台推薦」比較文。
- 親子團購：媽咪愛旅遊館、親子童享（住宿券）、瑞貝卡一家、豬爸一家團購頁。
- 媽媽團購推薦：媽咪愛（全站最新開團）、媽咪拜的搜尋結果頁；摘要裡還提到吐司兒和濤媽選物。
- 團購行事曆：倩兒☓魯蛋「2026 團購預告」（每月排程、持續更新）、腦波弱太太「開團中」、主夫尼克「2026/10 月份開團行事曆」、柳喪彪 vistoso.tw/calendar.html（可訂閱 ICS）、依娃「團購行事曆」。

【我們缺什麼】
1. 首頁 title 是「鷹家買物社｜把喜歡的日常，帶回家」（index.html 第 7 行），沒有任何一個目標詞。
2. H1（index.html 第 82 行）是手寫字 SVG，加上 sr-only 文字「把喜歡的日常帶回家」，同樣沒有目標詞。
3. meta description（第 8–11 行）提到了「團購行事曆」，但沒有「親子團購」。
4. 結構化資料只有 Organization（第 39 行），沒有 WebSite、FAQPage、ItemList。
5. 沒有「團購行事曆」的獨立網址，這部分交給 Prompt 2 的 /calendar/。
6. 沒有「怎麼跟團」的說明頁。/how-we-select/（我們怎麼選物）只講選物，沒講怎麼下單、出貨、找誰問。
7. 對手排得上去，靠的是：大量商品頁、每月更新且標題帶日期的行事曆文、比較型的「平台推薦」文。我們的優勢是鷹式一家的真實家庭、YouTube 的信任感，還有 LINE 社群。

【調整方案（請照這個做；文案可以微調，但要寫理由）】
A. 首頁 title（約 30 字）：鷹家買物社｜鷹式一家的親子團購平台・本週開團與團購行事曆
B. meta description：鷹式一家 Eaglish Family 的親子團購平台：餐桌好食、育兒用品、居家與旅行選物，一頁看本週開團、即將截止、折扣碼與團購行事曆，加入 LINE 社群不漏團。
C. H1：保留手寫字的視覺，但 H1 的文字換成「鷹式一家的親子團購平台」。可以是 sr-only，也可以在手寫字下面放一行看得見的小字，Grace 自行判斷。全頁只能有一個 H1。
D. 首屏下方加 80～120 字的說明：這裡是誰在開團、選物標準、怎麼跟團。要自然地帶到「親子團購」「媽媽團購」，不要堆關鍵字。
E. FAQ 區塊放在頁面中段，同時在頁面上顯示，並加上 FAQPage JSON-LD。問題五題：
   怎麼跟團下單？
   出貨和到貨時間怎麼看？
   折扣碼怎麼用？
   有問題要問誰？
   團購行事曆在哪裡看？
   答案只寫已經確認的通則，例如「各團的出貨、退換貨依該團廠商頁面為準」，不寫特定廠商的條件。要注意，Google 從 2023 年起只對政府和醫療類權威網站顯示 FAQ 複合式結果，所以這個 FAQ 主要是給頁面內容和 AI 摘要用，不要期待出現 FAQ 版面。
F. 新增一頁 /how-to-join/「怎麼跟團｜鷹家買物社」：
   - 跟團流程四步驟
   - LINE 社群三群各自的用途（只寫用途，不放邀請連結的對照）
   - 行事曆和折扣碼的入口
   - 客服方式
   - FAQ
   加進 sitemap 和頁尾，再從首頁 FAQ 和 /how-we-select/ 互相連結。內文請 Codex 寫，Grace 先做頁面骨架。
G. 結構化資料加 WebSite（name：鷹家買物社，alternateName：鷹式一家）。Organization 補 sameAs，填 YouTube、Instagram、Facebook、TikTok 的公開網址。
H. 「團購行事曆」這個詞交給 /calendar/（Prompt 2）。首頁用文字錨點「團購行事曆」連過去，兩頁不要搶同一個詞。

【驗收點】
- npm run verify 全部通過，scripts 裡的 SEO 檢查 0 個擋發布問題。
- 用 Rich Results Test 和 Schema validator 測首頁和 /how-to-join/，0 個錯誤（附結果截圖檔名）。
- 首頁在 390px 和 1440px 都實際看過：手寫字視覺沒有變，新增的說明文字和 FAQ 沒有讓首屏跑版。
- title 和 description 的字數在 Google 顯示範圍內（附字數）。

【分支和 PR】
從 origin/main 開 worktree，分支 claude/seo-generic-20261021，PR 到 main。合併要 Hiram 本人核准；文案要先由 Hiram 確認。
完成後在 PR #40 留言回報（用五欄格式），附上：
- 預覽網址
- 390px／1440px 截圖檔名
- 修改前和修改後的 title、description、H1 對照
合併後給 Bingo 正式站網址。Bingo 會在上線後 2 週和 4 週，用 Search Console 或搜尋結果追蹤這四個詞。
