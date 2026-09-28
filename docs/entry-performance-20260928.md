# Entry-page performance candidate — 2026-09-28

Owner: Kira (website code). Coordination: Eliora. Model route: GPT-6 Sol / high.

## Change

- Use local system fonts for public pages. `Songti TC` stays the first serif choice for editorial headings; body text uses the device's system sans font. The generated public pages no longer block first paint on Google CJK font CSS and subsets.
- Generate 480px and 960px WebP variants for the homepage and journal index. Static cards use accurate `srcset`/`sizes`; all journal covers below the text hero load lazily. The homepage carousel fetches each later slide only when selected.
- Render the latest article as the static first carousel slide. A local image-width map supplies correct original-width descriptors to client-rendered cards and slides.
- Keep the static catalog readable while the two live public Sheet tabs load after first paint. Direct product links and the catalog CTA trigger an immediate refresh. Known products use reviewed local cover/card art; unknown Google-hosted card images request a smaller variant. Checkout still rechecks the current Sheet before navigation.
- Queue GA4 page identity immediately, then download its library after page load and idle. Fast exits may be undercounted; conversion event identities and clean URL handling are unchanged.

## Verification

- `npm run verify`: 240 tests passed, 0 failed. Site maintenance 30/30; blog release 499/499; SEO release 0 blocking issues.
- Local screenshots reviewed for homepage, journal and travel entry at a narrow viewport. Songti headings, navigation, hero and image composition remained usable.
- Lighthouse 12.8.2, mobile simulated network, performance category. Baseline is the live public site; candidate is local HTTP, so scores and timing are directional, not a production field measurement.

| Entry | Baseline score / transfer / FCP / LCP | Candidate score / transfer / FCP / LCP |
| --- | --- | --- |
| Home | 55 / 4.40 MB / 17.1 s / 17.8 s | 92 / 1.19 MB / 1.5 s / 3.2 s |
| Journal | 55 / 4.21 MB / 17.8 s / 20.0 s | 100 / 0.43 MB / 1.1 s / 1.6 s |
| Travel | 55 / 2.36 MB / 13.8 s / 15.3 s | 93 / 0.60 MB / 1.7 s / 3.2 s |

All candidate entries recorded zero remote font file requests. Remaining SEO audit warnings are nonblocking image recommendations, including the existing PNG logo and first journal card's lazy loading.

## Release boundary

This is a local candidate. The group-buy Sheet remains the authority for current offers. No public content claims, canonicals, robots rules, external settings, or production branch were changed. Publishing requires the repository's production authorization and should be followed by a live mobile check on `/`, `/blog/`, and `/trip/`.
