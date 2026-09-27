# North Thailand content release — 2026-09-27

## Scope and authority

Continues Hiram's approved production travel-blog work: expand Chiang Mai from the supplied 2023 Instagram collection and publish a separate Chiang Rai guide. Twelve supplied Instagram sources are linked across the two articles. Prior 2025 Chiang Mai material remains intact. No new shop homepage entry, scheduler, connector, tracking, or outbound messaging.

## Editorial and source checks

- Retains the approved Bangkok place-first structure, cream-sandstone styling, reusable place identities, short family anecdotes, Maps links, and adjustable itineraries.
- Four photographed Chiang Rai places plus five supplementary destinations distinguish confirmed past visits from editorial suggestions. Three additional Chiang Mai destinations retain their own sources and images.
- Original captions establish historical visits; current official venue/TAT references establish available practical details. Historical Reel prices are not reused as current prices.
- Village map is explicitly a candidate, not a verified match to the historical entrance. Conditional village route is not selected by default. No inferred identity or anatomy claims from photographs.
- Take a Walk belongs to Chiang Mai's Doi Saket area, not a Chiang Rai city stop. Blue Temple and Chiang Rai Wat Phra Kaew are marked editorial extensions.
- Local Qwen3.5:27b performs sampled visual/caption analysis. Model classification is advisory, not geographic authority. This is not a claim of frame-by-frame review of complete videos.

## Media and performance

- Fourteen owned-source WebP assets with source URLs/timecodes or user-photo provenance, hashes, dimensions and crops in north-thailand-media.json.
- 640px responsive variants, metadata stripping, image-size checks, first-image preload/high priority, later images lazy loaded.
- Clean Lalitta garden frames form the article hero. Vertical Reel frames are paired; original video links remain available.

## Validation

- npm run verify: 176 tests pass; 32 sitemap documents; zero blocking SEO findings. Twenty existing site-wide SEO warnings remain outside this content scope.
- Local browser: both articles fit a 390px viewport without horizontal overflow (scrollWidth = clientWidth = 390); photo cards form two columns; mobile TOC opens.
- Interactive 3-day compact plan tested: city day retains Blue Temple, Wat Phra Kaew and night market; duplicate optional earlier stops are replaced. No browser console errors observed.
- Canonicals, breadcrumbs, Article metadata, city/home discovery links, no-JS routes, anchor integrity and original source links covered by checks.

## Rollback

Revert this release commit on main, rebuild and verify. Do not reset unrelated production commits. Private raw footage, local model results and runtime receipts are not published.
