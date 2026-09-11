# Article purchase button candidate

Eight published journal articles share one purchase button. While its original slot is below the viewport, the button floats 12 px above the bottom safe area. It returns to normal flow when the slot reaches that baseline and remains there through the footer. Scrolling back above the slot restores the floating button. The reserved slot prevents layout jumps; there is no duplicate button or duplicated conversion listener.

The existing network-only campaign lookup remains authoritative. Only confirmed open campaigns float. Clicking still rechecks the Sheet; closed, missing, ambiguous or failed lookups do not navigate to an old URL. No product facts, Sheet records, messaging drafts or published URLs were changed.

## Verification

- `npm run verify`: all 41 tests pass; site and blog audits pass.
- `node scripts/floating-offer-browser-audit.mjs`: 106 browser checks pass across all eight articles at 390 px and 1440 px. Checks cover one control, viewport fit, docking, footer, reverse scrolling, closed/error states, and revalidation before navigation.
- Mobile and desktop screenshots reviewed at `/tmp/floating-offer-{390,1440}-{floating,docked}.png`.
- Tailscale candidate responds HTTP 200 with `no-store` and `noindex, nofollow`.

## Handoff

Preview: https://zosiamac-mini.tailb3e7be.ts.net:23443/blog/playzu/?v=floating-offer-1

Accessibility: retains native button, keyboard focus, disabled state, 54 px minimum target, existing focus outline; safe-area spacing; no transition animation. Fullscreen video suppresses the floating position. Keyboard/visual viewport resize recalculates placement. Physical iOS keyboard and browser-toolbar changes remain a manual device check.

Performance: no library or extra network request; passive scroll listener schedules at most one layout update per animation frame. Resize observers handle image/font changes. Shared CSS/JS cache versions are updated in all eight article pages.

SEO: canonical URLs, metadata, sitemap and article copy are unchanged. Preview is not indexable.

Production has not been deployed. The isolated branch is based on `d93d7e3`; deploy only the candidate commit after the user's release instruction. Reverting that commit restores the in-article-only control.
