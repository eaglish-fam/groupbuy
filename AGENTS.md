# eaglish.store repository instructions

## Authority

- Canonical repository: `https://github.com/eaglish-fam/groupbuy`
- Production site: `https://www.eaglish.store/`
- Production deployment: GitHub Pages from `main` at repository root.
- The group-buy Google Sheet is operational content authority. This repository is website code authority. Agent Studio is a consumer, not a source repository.

## Ownership

- Lydia owns group-buy website requirements, public-data accuracy, link and image checks, content gaps, SEO backlog, and acceptance criteria.
- Kira owns code maintenance, isolated implementation, tests, review evidence, and rollback preparation.
- Hiram and Queenie remain the commercial decision makers. Candidate data or a vendor message never becomes a confirmed public fact without the applicable authority.

## Working rules

1. Start from the current `origin/main` in an isolated worktree and branch. Do not mix website work with the user's dirty primary checkout.
2. Inspect the current code, public page, Sheet contract, and existing behavior before editing.
3. Keep changes small, versioned, testable, and reversible.
4. Run `npm run verify` before handing off any website candidate.
5. Record technical SEO, accessibility, performance, and source-authority implications in the handoff.
6. Do not store credentials, tokens, cookies, OAuth state, private LINE data, or `.env` values in this repository.

## Production boundary

Any write to `main` can publish directly through GitHub Pages. A local branch, local commit, test, audit, or review artifact is not a deployment.

Do not push, open or merge a PR, modify `main`, change GitHub Pages, DNS, CNAME, HTTPS, analytics, the Google Sheet, or another external system without the exact applicable authorization.

## SEO and content rules

### City-guide template adopted 2026-10-04

Read and adopt `docs/trip-city-guide-template.md`, `docs/trip-editorial-guidelines.md` and `trip/IMAGE_PIPELINE.md` before city-guide changes. The actual published Chiang Mai guide is the composition baseline; Hiram's 2026-10-04 fullbleed rule supersedes the historical g8 fixed contain frames. Every photo must fill its own source-aware media frame while preserving faces, main people and important scenery. Use real dimensions to choose portrait/landscape/mixed layout and reserve aspect ratio; never fill internal bands with backdrops, generated extension, stretching or destructive crops. Singapore g9 revises this opt-in template; other published city HTML requires separate migration authority. Use `scripts/trip-city-guide-template.mjs`, shared planner-entry assets, and source-owned city data. Preserve FAQ → plan → videos; personally inspect the three actual hero images at 1440/390/320px Tailnet first opens (new tab → set viewport → goto), not just object-fit/HTTP assertions. Original active picture, dimensions and crop lineage stay traceable. A shared document update does not imply other Agent conversations reloaded it. Accountable owner acceptance precedes genuine Ezra's version-deduplicated Telegram receipt; this adds no deployment or messaging authority.

For 鷹家遠行所 country hubs and city articles, follow the finalized cross-country rules in `docs/trip-editorial-guidelines.md` and read `trip/IMAGE_PIPELINE.md` before creating or revising a page. Thailand's country hub and Bangkok, Chiang Mai, and Chiang Rai articles are the approved content and visual references. Bangkok still has an earlier front-positioned planner; use the finalized late-planner placement documented in the guidelines for new pages. Adapt geography, destination data, timing, and city count to each country while retaining the approved photo-led, cream-sandstone presentation and first-image loading policy.

- Preserve one canonical domain: `https://www.eaglish.store/`.
- Keep `robots.txt`, `sitemap.xml`, canonical URLs, Open Graph, structured data, and public content mutually consistent.
- Do not generate indexable URLs for expired or unconfirmed campaigns.
- Do not treat query parameters, inferred product facts, or old Sheet notes as confirmed current information.
- Accessibility and readable mobile behavior are release requirements, not optional polish.
