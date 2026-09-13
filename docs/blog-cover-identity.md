# Blog cover identity — effective 2026-09-14

Every newly created or materially revised article needs the actual brand/product/hotel name as **readable text in the cover image**, not only in alt text, metadata, a caption or an adjacent heading. A slogan such as “先選房” does not identify the hotel. A small badge is acceptable only if it stays legible on the two-column mobile index; otherwise make the identity the main headline.

- Use a source-bound 1600 × 1000 editorial cover and preserve real product/facility pixels. The Caesar example uses an editable cream left panel, large brand type and the original pool photo, not an invented hotel.
- Keep the brand in the left-safe text region for homepage crops. Leave sufficient padding and avoid busy imagery behind lettering.
- Keep evergreen covers free of volatile prices, dates and “開團中” promises. Display the current group-buy state through the existing live card/status UI.
- Align the article hero, blog index, shared ProductContent/editorial carousel, OG/Twitter and Article image. Product-card artwork is a separate asset and must not be overwritten incidentally.
- Inspect actual pixels and layouts at 320, 390, 768 and 1440 widths, plus the two-column mobile blog card. A textual declaration or checksum cannot establish visual correctness.
- After inspection, register the exact image and editable source SHA-256 plus review in `config/blog-cover-identities.json`. A changed image/source invalidates that review. Run `npm run verify` before handoff.
- The dynamic article audit requires this record for articles published or modified on/after 2026-09-14. Untouched legacy articles remain unchanged until individually revised; do not falsify their dates to bypass the gate.
- Editorial readiness does not authorize production deployment.
