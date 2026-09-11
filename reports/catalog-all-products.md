# 全部商品預設入口與交替排序

- Base: 9a2c06a origin/main; isolated branch fix/catalog-all-products.
- Candidate: https://zosiamac-mini.tailb3e7be.ts.net:28443/design/
- Production unchanged; no push or Sheet write.

## Behavior

Default All shows active ordinary products only (no expired, unknown, upcoming, coupon-only, book or charity rows). Timed products sort by closing date ascending, evergreen products retain normalized Sheet order. Interleave timed/evergreen, append remaining side, then paginate. Equal dates remain stable. Category shortcuts and filter reset return to All; search/category/country filters apply before interleaving. Explicit closing/new sort remains available. Upcoming, saved, dedicated books/charity/coupon sections and Taipei today-closing reminder remain intact.

## Validation

- npm run verify: 49 tests passed; SEO and maintenance gates passed.
- Live read-only Sheet browser check, 390 px and 1440 px: All 25, timed 8, evergreen 17; first 12 alternate, including Meroware.
- Mobile 2 columns (175 px each), desktop 3 columns; no document horizontal overflow or JS errors.
- Visually reviewed mobile screenshot: neutral All with green selected underline, permanent orange timed tab, today-closing timer preserved.
- Unit regression: Sheet order, ties, unequal sides, empty sides, pagination order, explicit sort override, default active-only guard.

## Implications and rollback

No new indexable URL, metadata, canonical, sitemap or structured-data change. No dependencies or additional network calls. Ordering is in-memory on existing data; photo and layout behavior unchanged. Semantic buttons, aria-pressed, keyboard focus and selection underline retained. Source authority remains Google Sheet. Built homepage assets use a new version token. Rollback is reverting this candidate commit; no data migration required.
