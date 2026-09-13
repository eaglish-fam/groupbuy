# 鷹家遠行所 · 可操作設計稿 v1

Date: 2026-09-13
Status: local implementation and verification complete; not deployed.
Preview: http://127.0.0.1:8767/flights/

## Approved direction

Hiram chose 鷹家遠行所. Retain B's panoramic image with overlapping headline panel and a two-column boarding-pass layout, with A's blue sky and airplane imagery. Orange-red is an accent role, NOT exclusively a geometric dot: section numbers, prices, experience buttons and selected endpoints may use it. No orange/peach section fill and no green UI palette. Root-shop and journal entries to /flights/ remain hidden.

Brand-guidelines informed the distinction between broad quiet surfaces and active signals. Senior-frontend informed component implementation, readable responsive layout, truthful empty states and keyboard/touch targets. No new framework or background task.

## Assets and font

- assets/faraway-wordmark.svg: five glyphs 鷹家遠行所 outlined from the user's local AaTWHZXDXHjf / Aa台灣漢字心動信號（簡繁） font. This is not an AI approximation of the lettering. Build with scripts/build-faraway-wordmark.py and a separately supplied font file. The full font is not redistributed. Existing font use rights still apply; outlining alone does not establish a new licence.
- assets/fuji-sky.webp (1800px), assets/fuji-sky-800.webp and assets/fuji-sky.jpg: built-in ImageGen brand mood panorama, labelled AI 視覺 on the page and AI 品牌意象 in footer/OG. Not documentary destination evidence.
- assets/sky-wing.webp (1600px): built-in ImageGen decorative flight/sky image. Reused for generic ticket atmosphere with an airport-code label, not a false destination photograph or airline endorsement.
- Product images, prices and affiliate links remain from the existing published Google Sheet. No product photo is AI substituted.

## Data and interaction

The approved/published/nonexpired fare rules are unchanged. A live run showed 1 eligible fare and 24 published products (6 initially visible). The two-column grid only fills with actual eligible records; a single record is not duplicated. A separate isolated browser interception verified two cards on desktop and one column at 320px; no fixture endpoint, sample fare, or preview switch was added to the website. Ticket design is explicitly not proof of a booked ticket or reserved seat.

Search, region selection, more results, price conditions, date/time format, affiliate disclosure and fail-closed behaviour remain functional.

## Verification

- npm run verify: 74 tests passed; site checks 28/28 and blog checks 329/329.
- Real published data: search 東京, combine Europe, clear query, return all; more results; price details.
- 1440px desktop, 390px and 320px phone: no document overflow.
- Two-ticket fixture is in one row at desktop, one column at narrow width.
- Offline reads show separate retry actions.
- Browser page errors: none.
- Main dark text, muted text, blue/white buttons and orange-red/white text pass computed WCAG AA 4.5:1 contrast.
- Wordmark, hero and product images visually reviewed; screenshot references retained in this thread's private design folder.

Re-run browser QA with Playwright available to Node resolution and FARAWAY_BROWSER_EXECUTABLE set if needed:
`node scripts/check-faraway-browser.mjs`
It expects a local preview server on 127.0.0.1:8767.

## Release and maintenance

No push, deployment, Sheet mutation, connector activation, schedule, analytics, DNS or production entry changes. Canonical URL stays /flights/. Page title, OG and WebPage name align with 鷹家遠行所; the parent WebSite remains 鷹家買物社. Generated sitemap updates the local flight page date. The future release can be reverted as one scoped commit without changing data.

Delivery uses WebP, responsive hero source, lazy-loaded lower imagery, an 8KB outlined wordmark instead of a whole font download, and no new client dependencies. faraway.css is a scoped visual layer after the existing functional page styles; it may be consolidated after Hiram's visual acceptance.

## Exact ImageGen prompts (built-in tool, not CLI/API fallback)

### Sky-wing asset
```text
Use case: photorealistic-natural. Website decorative panoramic footer photograph, very wide landscape 3:1. A realistic silver commercial airplane wing enters from the lower LEFT corner and points toward the center-left horizon, its small winglet is deep cobalt BLUE, viewed from a passenger window but no window frame visible. Brilliant clean true-blue sky and soft white cumulus clouds far below. Upper half mostly open pale sky, plenty of clear negative space across right two thirds for separately overlaid dark-blue website typography. Natural daylight, calm but uplifting feeling of departure, bright airy refined travel magazine photography. Physically plausible wing geometry with subtle panel details, no extra wings, no airline logo, no letters, no typography, no watermark. NO green or teal, no orange-red sky. Not a website mockup, not an illustration, only the panoramic sky-and-wing asset. High resolution.
```

### Hero panorama
```text
Use case: photorealistic-natural. Generate only a wide panoramic scenic brand illustration for a travel website, 3:1 landscape, no typography or UI. Exquisitely bright crisp blue sky, fluffy small white clouds, snowcapped Mount Fuji positioned at 70 percent of image width so its entire beautiful silhouette is visible to the RIGHT of a future text panel covering left 40 percent. Calm bright blue lake across bottom, distant tiny Japanese shoreline village, a few delicate pale pink cherry blossoms at far right edge. Blue/white dominant fresh inviting travel energy. Left half mostly calm open sky/lake suitable to be covered by a separate white panel. Natural daylight, credible photo-like scenic imagery but used as an explicitly AI-generated travel mood illustration, not documentary photography. Avoid green-dominant vegetation, orange-red autumn colors, sunset, teal. No people, boats, aircraft, logos, watermark, embedded text, frames, collage. High resolution.
```

