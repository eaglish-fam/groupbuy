# Long-article side navigation pilot

Pilot: `/blog/caesar-kenting/`. Production is unchanged until Hiram approves deployment.

## Interaction contract

- The article's inline `<nav data-reading-nav>` is the only link/label/order source. It remains usable without JavaScript.
- The side navigation appears only after that entire inline navigation passes the sticky site masthead, not merely because it is outside the viewport below the fold. It disappears when the original navigation returns.
- At 1200px and wider, the list occupies the existing left gutter without shifting article content. Narrow desktop windows, tablets and phones use a drawer to avoid covering the article with a permanent list.
- When a reader has actually seen the inline navigation, its next exit triggers a 760ms decorative copy shrinking toward the left destination. The copy is inert, hidden from assistive technology and removed on completion. Returning to the inline navigation, resizing or opening the drawer cancels it. Direct deep links and reduced-motion readers skip this transition.
- Following Hiram's pilot feedback, the compact tab has a visibly painted 48px-wide, at least 76px-high rounded target with a white-to-sage gradient, short soft shadow and white glow (no hard border). This deliberately trades a little edge overlap for a clearer, easier touch target, without changing article width. A chevron hints twice, never continuously. Tap/right swipe opens; close/left swipe/outside tap/Escape closes. Vertical scrolling stays native.
- The panel uses a paper-to-sage gradient and an independently scrollable, ordered link list. Current section is indicated by rust text, weight and `aria-current="location"`.
- Selecting a link updates the hash, positions its section label below the measured masthead, and focuses the heading without a second scroll. Modified clicks retain native behavior. Reduced-motion users get no animations or smooth scrolling.
- Hidden drawer links are inert. Closing with Escape restores focus. The navigation is non-modal and never locks body scrolling. Print hides the side navigation.
- Existing floating purchase CTA, campaign checks, video behavior, original article geometry, images and SEO metadata are unchanged. Mobile panel stops above the bottom purchase control.

## Reuse

1. Create stable section IDs and a real inline anchor list in document order. List independently useful sections (e.g. each room type separately), not duplicated labels.
2. Add `data-reading-nav` to that list and include `/blog/reading-nav.css` and deferred `/blog/reading-nav.js`, with matching asset versions.
3. Check the article's actual gutter widths and site header selector (`.journal-chrome`); this pilot assumes `.article-body` is at most 920px wide with 44px desktop / 22px mobile padding. Adapt breakpoints for a wider article before opting it in.
4. Re-run the browser audit for that article, check phones/landscape/narrow desktop, purchase controls, deep links, no-JS fallback, keyboard and reduced motion. Do not automatically opt in all articles before pilot approval.

No new library, external request, generated image, analytics event, product data source or indexable URL is added. Scroll work is coalesced into one animation frame with a bounded eleven-section list.

## Verification

Run `node scripts/article-preview-server.mjs` then `node scripts/reading-nav-browser-audit.mjs`. Browser executable, module path and base URL can be overridden with `CHROME_PATH`, `PLAYWRIGHT_MODULE` and `PREVIEW_URL`.

Also run `npm run verify` and `git diff --check`. Browser fixtures intercept external analytics and product data; no live purchase is executed. Screenshots are written to `/tmp/caesar-reading-nav-*`. Chrome touch emulation is not a physical iPhone/Safari test; Hiram can inspect the candidate over the existing Tailscale preview before production approval.

Rollback after a future release: remove the two new asset includes and `data-reading-nav` from the pilot page. All article links/content remain ordinary HTML.
