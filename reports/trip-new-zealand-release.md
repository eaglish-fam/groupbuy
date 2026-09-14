# Travel destination release — 2026-09-14

## Scope and authority

Hiram requested modifying the production website after reviewing the New Zealand content sample. This release updates `/trip/`, adds New Zealand / Thailand country and destination hubs, and publishes the Christchurch / Akaroa itinerary. Existing Bangkok journal, shop homepage, product content, Sheet, DNS, analytics configuration and flight tools remain unchanged.

Production baseline: `f406f544a2b116d5710738133067a3d3ed9a50d5`. Deployment is GitHub Pages from main. Rollback is a normal revert of this isolated release commit, never a reset or overwrite of subsequent contributors' commits.

## Content

- 9 place / food cards: 3 documented visits, 6 editorial additions including one food candidate.
- Three-day primary itinerary; two-day and five-day curated variants. Not an unrestricted route optimizer or live booking tool.
- Two user-authorized photos from the eaglish.fam Instagram posts `DaPydUbFb76` and `DaVANgnFDKW`, matched to Shamarra and Akaroa Dolphins. Files retain source pixels; no generated replacement imagery.
- Actual supplier identity is preserved. Klook activity 7758 is a general link, not a verified affiliate attribution link. No fabricated KKday mapping, price or availability.
- Maps links use precise name/address queries, not fabricated coordinates or Place IDs.
- Current boarding point warning: Drummonds Jetty during Main Wharf closure. International visitor admission caution retained for Air Force Museum.
- Original transcripts, local extraction candidates, usage logs, credentials and private source manifests are not part of the release.

## Validation

- `npm run verify`: 120 tests passed after adding WebP payload regression coverage; site checks 30/30 and existing blog release checks 371/371. No change to product campaign contracts.
- New tests cover canonical URLs, local links/assets, fragments, JSON-LD validity, unique IDs, place evidence labels, Maps presence, itinerary nights and unique stops, static no-JavaScript route availability, sitemap membership and absence of a shop-homepage trip entry.
- Browser checks: homepage opens the itinerary; two / three / five day selection works; Enter expands a place detail. Checked 320, 390, 768 and 1280 pixel widths without document overflow. No loaded broken images observed. Desktop and mobile visuals inspected.
- Full route text is server/static HTML; JavaScript only selects visible day variants. Anchor links and all variants remain available when JavaScript is disabled.

## SEO, accessibility and performance

- Distinct canonical destination pages; Article and BreadcrumbList on the itinerary, BreadcrumbList on hubs; sitemap updated. No rankings or indexing guarantees.
- One H1 per page, semantic links and details/summary, visible focus, announced route changes, image alt text and explicit dimensions. Existing reduced-motion behavior retained. This is scoped testing, not a full WCAG certification.
- No additional JavaScript library or model/API call required for readers. Lower images load lazily and repeated URLs are reused. Original JPEGs are retained for social metadata; on-page WebP variants preserve dimensions and composition, reducing the two image payloads from 4,651,694 to 1,522,448 bytes (about 67%). No network-throttled performance score is claimed. Additional destination photos and responsive size variants remain follow-ups.
- General Klook link does not establish an affiliate relationship. Add applicable disclosure when verified commission-bearing links are connected.
- Future travel-date opening hours, booking stock, driving conditions and availability are not live-validated by this release.
