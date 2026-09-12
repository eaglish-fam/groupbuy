# Eaglish travel editorial design · 2026-09-12

Hiram requested the public flights page match the Eaglish shop and journal, with Zara's Zosia product design language as a directional reference.

## Design sources

- Shop: `design/design.css` — paper #faf8f3, ink #343a30, olive #46533a, fine rules, restrained square buttons, documentary photography.
- Journal: `blog/blog.css` — Noto Serif TC headings, Noto Sans TC text, short LXGW WenKai TC annotations, spacious image-led reading.
- Zara: `20260907-zosia-cross-category-product-design-language-v1.md` — quiet surfaces, functional directional lines, small warm signals. This is a product working baseline, not a new approved website CI.

The existing shop wordmark is reused unchanged. A blue origin–destination line and a small rust arrival point translate Zosia's principle into a functional flight route. Product images stay unmodified, and partner prices remain catalogue references. Only the first six products render initially; filtering and progressive disclosure keep the 24-item catalogue easy to browse on mobile.

## Photo provenance

- Hero: Klook affiliate product catalogue supplied through Hiram's authorized account, activity 4915 (Grindelwald, Lauterbrunnen and Interlaken day tour).
- Source: https://res.klook.com/image/upload/activities/aequultj3cqglzlqftcf.jpg
- Local: `flights/assets/lauterbrunnen.jpg`.
- Delivery: WebP encodings at 768 and 1280 pixels, selected with responsive image hints; the source composition is unchanged.
- The caption identifies the location and source; the photograph is not represented as an Eaglish family trip or a current fare offer.
- Other product photography and affiliate URLs remain read from the existing published Google Sheet.

## Release scope

The flight and product data authority, provider collection, schedules and Sheet contents are unchanged. Existing publication/approval requirements remain enforced. Date labels use Taiwan time for observations and preserve date-only itinerary values. Invalid prices and invalid or expired fares are hidden instead of being displayed as zero or current.

Consumer copy includes the price basis and affiliate disclosure without exposing implementation status. The canonical path remains `/flights/`; Open Graph now previews the travel photograph. No additional framework, tracking or runtime dependency is added.

Validation requires the repository verification command, real Sheet rendering, desktop and narrow mobile layout review, keyboard navigation, filters, search, more-results controls and expandable fare notes. Rollback is a revert of this scoped design commit; Sheet data and the first release remain available.

Verified: real published feed renders one fare and 24 products, with six initially visible and 12 after loading more. Tokyo search returns two products; combining Tokyo with Europe returns none; clearing the query returns five European products. The United States fare filter correctly shows an empty state. Fare notes expand. At 390px and 320px, document width equals viewport width. Desktop and mobile screenshots were visually reviewed; browser error log was empty. Repository verification passed 70 tests and all existing site/blog checks.
