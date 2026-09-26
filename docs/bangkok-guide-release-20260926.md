# Bangkok place-first guide — release record

## Scope

- Preserve `/trip/guides/bangkok-with-kids/` and existing section anchors.
- Replace vlog-led copy with three place introductions, activities, transport, suggested time, weather suitability, two-day route and FAQs.
- Reuse stable place IDs and the same catalog in the Bangkok city hub and guide. No personal itinerary persistence or drag-and-drop builder is claimed.
- Update Thailand/Bangkok previews and social preview images; leave NZ articles, shop navigation and flight scanning unchanged.

## Sources and images

- Family-owned video: `https://www.youtube.com/watch?v=f5h0gGdaX2c`.
- Aquarium identity: SEA LIFE entrance sign at 2187 seconds, followed by the water exhibits and boat sequence. Museum identity and context at 1070–1097 seconds; market name and section signage at 742–744 seconds.
- Seven reviewed scene frames: market aisle and section sign, climbing net and sand area, aquarium fish and shark scene, glass-bottom boat. Subtitle bands cropped from market aisle and boat frames; no image generation or scene reconstruction.
- `trip/assets/bkk-media.json` records public source links, exact time points, crops, output dimensions, hashes and responsive variants. Original video/temporary candidate frames are not deployed.
- BMA sources confirm museum branch, location and Tue–Sun 10:00–16:00 hours. SEA LIFE's Thai opening-hours page confirms 10:00–20:00 and last entry 19:00 as checked 2026-09-26.
- Boat eligibility statements differ across official page sections; do not publish an exact age/price as universal. Direct readers to their selected package and current operator requirements.

## Commercial links

- Klook product 357 and KKday product 2735 identify SEA LIFE Bangkok. No current price, coupon or lowest-price promise is embedded.
- Klook account attribution comes from the family's public video description link `https://tinyurl.com/eaglishklook`, which resolves to affiliate account 43858, ad 921120. The same redirect endpoint with the product destination returned HTTP 302 to product 357 with that attribution.
- KKday `cid=22159` comes from the family's public video description. The link points at the matching product, rather than the platform homepage.
- Both commercial links are marked `rel="sponsored noopener"` with a reader-facing commission disclosure. Redirect validation does not establish conversion/commission reporting; that needs an actual affiliate account report later.
- Klook browser page presented a device check during image review. No challenge bypass or guest-review photo reuse. This release uses only family-owned scene imagery. Official partner feed imagery remains a future enhancement, subject to the provided usage terms.

## Validation and rollback

- Full repository verification passed: 152 tests, site maintenance 30/30, blog release 499/499, SEO gate zero blocking findings. Whole-site nonblocking image warnings decreased from 38 to 30; remaining warnings include existing NZ image weights and footer logo loading.
- Browser checks at 1280, 390 and 320 CSS pixels: no horizontal overflow; one H1; hero loads; aquarium scene images load; FAQ expands; city card links return to the correct article anchor.
- Seven full-size WebP images under 350 KiB each plus 640px variants. Explicit dimensions, alt text, lazy loading below the hero and existing reduced-motion/focus styles retained. This is not a claim of a measured Core Web Vitals score or a full WCAG audit.
- Canonical URL stays unchanged; Article and BreadcrumbList match the page. Sitemap lastmod changes only for the guide and two destination hubs.
- Rollback: revert this scoped release commit and allow the normal Pages build to publish. No data migration, credential change, deployment configuration change or new service.
