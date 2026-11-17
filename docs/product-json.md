# 逐商品資料（groupbuy.product v2）

GB-022：每支商品一份 JSON。Bingo 從工作庫匯出，網站建置時讀；**這份只定格式與規則，還沒有任何頁面用它**（商品頁網址 `/products/…` 要 Hiram 同意才實作）。

- 格式：`scripts/schemas/product.v2.schema.json`（JSON Schema）。
- 檢查：`node scripts/validate-product-json.mjs <檔案或資料夾>`，有問題 exit 1。測試：`tests/product-json.test.mjs`（用編造的假資料，不放真實商品資料）。
- 不會有成本、分潤欄位：欄位名一出現就判錯（`cost`、`commission`、`分潤`、`成本`…）。「使用推薦折扣碼購買，我們可能獲得分潤」這種揭露**字句**放在 `disclosure`，只放字句，不放比例。
- `_` 開頭的欄位是備註，檢查會略過。

## 規則（從真實案例來的）
| 規則 | 為什麼 |
|---|---|
| `offer_type: standing` ⇒ `round.end` 必須是 null；`limited` ⇒ 必須有 `end` | 常駐沒有結束日 |
| `round.link_rotates` 有值 ⇒ 必須有 `round.current_link_end` | 常駐團的連結會過期：廠商的「當期表單」只開一期（Bingo 11/01 實測，經驗庫 L-001） |
| `status: unconfirmed` ⇒ 不能有價格或分檔 | 沒核對的團不能編價格（例：Giiker） |
| 有價格 ⇒ 要有 `price_checked_at`、`price_scope`、來源 | 價格會過期，要知道哪天核對的 |
| 商品層價格的來源寫 `facts_source.price`；分檔價格的來源寫 `facts_source.variants` | 沿用 Bingo 樣本的寫法 |
| 有規格 ⇒ `facts_source.specs`；有適用年齡 ⇒ `facts_source.age` | 沒來源的欄位網站不顯示 |

## 網站該怎麼用（還沒做）：`visibility(product, today)`
- 可索引：`status=active` 且（常駐，或 `end` 還沒過）。
- 顯示價格：可索引、`current_link_end` 還沒過、而且有 `price_checked_at`。
- 常駐團連結過期後：**商品頁不下架，只是不顯示價格**。
