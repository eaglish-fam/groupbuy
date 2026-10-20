# eaglish.store repository instructions

## Authority

- Canonical repository: `https://github.com/eaglish-fam/groupbuy`
- Production site: `https://www.eaglish.store/`
- Production deployment: GitHub Pages from `main` at repository root.
- The group-buy Google Sheet is operational content authority. This repository is website code authority. Agent Studio is a consumer, not a source repository.

## Ownership: three-lane collaboration (Hiram, 2026-10-15)

`docs/collab/COLLAB.md` is the canonical collaboration rule. It supersedes the earlier Lydia × Kira split (`docs/lydia-site-maintenance.md` is kept as history only).

- Claude owns website features, shared code (`scripts/`, `tests/`, `design/`, `src/`, `flights/`, `flights-pipeline/`, `trip/*.mjs`, `trip/*.css`, root `.js`/`.css`/`sw.js`, `package*.json`), builds and tests, technical SEO, accessibility, performance, review evidence, rollback preparation, and integration of every website PR.
- Codex owns writing: product articles, travel guides, facts, photo selection and source records, titles, excerpts, captions and alt text, and article packages. Codex asks Claude for shared-code changes instead of editing them directly.
- Grokbot (Hugo) owns operations: production checks, links and images, Google Sheet versus website consistency, expired campaigns, SEO backlog, research, briefings, and reminders. Hugo writes only `docs/external/` and reports instead of editing the site or the Sheet.
- Hiram and Queenie remain the commercial decision makers and approve every merge to `main`. Candidate data or a vendor message never becomes a confirmed public fact without the applicable authority.

## Working rules

1. Read `docs/collab/COLLAB.md`. Start from the current `origin/main` in an isolated worktree and branch. Do not mix website work with the user's dirty primary checkout.
2. Inspect the current code, public page, Sheet contract, and existing behavior before editing.
3. Keep changes small, versioned, testable, and reversible.
4. Run `npm run verify` before handing off any website candidate.
   - For a new or revised product article, add a `siteIntegration` block to its article package and run `npm run integrate -- <slug>` instead of wiring it by hand (`docs/collab/INTEGRATE.md`). It runs `verify` at the end.
   - Every PR to `main` also runs `verify` on GitHub (`.github/workflows/verify.yml`); a red check means the PR is not ready.
5. Record technical SEO, accessibility, performance, and source-authority implications in the handoff.
6. Do not store credentials, tokens, cookies, OAuth state, private LINE data, or `.env` values in this repository.

## Production boundary

Any write to `main` can publish directly through GitHub Pages. A local branch, local commit, test, audit, or review artifact is not a deployment.

Every website change goes through its own branch and PR, and is merged only after Hiram approves that PR. Lanes push their own branches and open PRs as `docs/collab/COLLAB.md` describes. Never push directly to `main` or force-push, and do not change GitHub Pages, DNS, CNAME, HTTPS, analytics, the Google Sheet, or another external system without the exact applicable authorization.

## SEO and content rules

### One-line city request: current canonical section 八

Use canonical editorial v1.9 for new or revised travel media: actively inventory the verified first-party Instagram and Facebook photo posts/carousels/albums, record actual access and bounded search coverage, prefer suitable owned still photos, and independently review pictured people. For an original-photo request, confirm the available authenticated first-party browser account and adopt suitable stills in actual page slots; an unauthenticated login wall, search, candidate list or all-video-frame result does not prove completed original-photo replacement. Keep credentials in the existing browser, never in public provenance or task evidence. Replace prominent identifiable unknown tourists rather than blur or generatively remove them. Preserve frozen sources; replacement assets use new versioned URLs, source/rights/crop lineage, and re-reviewed caption/alt. Existing source ownership, publication, and HTTP success do not substitute for current accountable visual acceptance. This instruction grants no new account, connector, posting, release, or permission authority.

When Hiram explicitly requests “做〔城市〕旅遊攻略”, read and adopt the current `docs/trip-editorial-guidelines.md` section 八, `docs/trip-city-guide-template.md`, and `trip/IMAGE_PIPELINE.md`. Follow that single canonical process from authorized source coverage through owner fact/media/copy review, portable build, actual candidate review, publication, production acceptance, and genuine Ezra's version-deduplicated receipt. Review every public text field semantically, including renderer/planner labels and caption/alt; personally inspect all rendered hero, short-card, and body photos, including reused sources, and exercise first lazy-image navigation, focus/sticky clearance, and every supported route at the affected 1440/390/320px sizes. Existing tests, HTTP success, and historical approval do not substitute for current rendered evidence.

A city request from Hiram starts this workflow through internal acceptance and a release PR that includes the necessary travel discovery, sitemap, and metadata updates. Under the three-lane rule (Hiram, 2026-10-15, superseding the 2026-10-04 direct-publish authorization), publication happens only when Hiram approves and the PR is merged. An explicit draft/preview request stops before the release PR. A city request is not permission to invent cities, schedule publishing, migrate other cities, create accounts/Runtime, or change DNS, analytics, permissions, payments, services, or commercial data. All unrelated main writes and external effects still require their own applicable authority. Resolve genuine role endpoints and current source/task versions; a document update does not prove all conversations reloaded it.

### City-guide template adopted 2026-10-04

Read and adopt `docs/trip-city-guide-template.md`, `docs/trip-editorial-guidelines.md` and `trip/IMAGE_PIPELINE.md` before city-guide changes. The actual published Chiang Mai guide is the composition baseline; Hiram's 2026-10-04 fullbleed rule supersedes the historical g8 fixed contain frames. Every photo must fill its own source-aware media frame while preserving faces, main people and important scenery. Use real dimensions to choose portrait/landscape/mixed layout and reserve aspect ratio; never fill internal bands with backdrops, generated extension, stretching or destructive crops. Singapore g9 revises this opt-in template; other published city HTML requires separate migration authority. Use `scripts/trip-city-guide-template.mjs`, shared planner-entry assets, and source-owned city data. Preserve FAQ → plan → videos; personally inspect the three actual hero images at 1440/390/320px Tailnet first opens (new tab → set viewport → goto), not just object-fit/HTTP assertions. Original active picture, dimensions and crop lineage stay traceable. A shared document update does not imply other Agent conversations reloaded it. Accountable owner acceptance precedes genuine Ezra's version-deduplicated Telegram receipt. The template itself grants no unrelated external-effect authority; apply the city-request workflow above and canonical section 八 within its exact scope.

For 鷹家遠行所 country hubs and city articles, follow the finalized cross-country rules in `docs/trip-editorial-guidelines.md` and read `trip/IMAGE_PIPELINE.md` before creating or revising a page. Thailand's country hub and Bangkok, Chiang Mai, and Chiang Rai articles are the approved content and visual references. Bangkok still has an earlier front-positioned planner; use the finalized late-planner placement documented in the guidelines for new pages. Adapt geography, destination data, timing, and city count to each country while retaining the approved photo-led, cream-sandstone presentation and first-image loading policy.

- Preserve one canonical domain: `https://www.eaglish.store/`.
- Keep `robots.txt`, `sitemap.xml`, canonical URLs, Open Graph, structured data, and public content mutually consistent.
- Do not generate indexable URLs for expired or unconfirmed campaigns.
- Do not treat query parameters, inferred product facts, or old Sheet notes as confirmed current information.
- Accessibility and readable mobile behavior are release requirements, not optional polish.
