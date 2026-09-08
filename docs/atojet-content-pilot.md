# Atojet article and multi-video pilot

Base: origin/main 519d4f3. Isolated branch feature/atojet-content-pilot-20260908. Not deployed.

## Content and evidence
- Sheet `現正開團`, row 3, read via connected Google Sheets on 2026-09-08. One video, no blog URL.
- Original video: https://www.youtube.com/watch?v=ntovrIfv6DE (Eaglish Family, 2026-02-10, 17s). Its description contains an obsolete purchase URL, intentionally not reused.
- Video observations are photographic evidence only: 00:06 removed yellow-brown long filter, 00:12 round filter. No subtitle, duration-of-use, contaminant analysis, or measured removal percentage available.
- Vendor: https://www.kindays-1shop.com/e45i5g. Images originate in its data-media-pre assets. Original evidence and hashes live in Lydia outputs/20260908-atojet-pilot.
- No microbubble/medical/drinking-water claims. No invented personal experience. Other Atojet product families excluded.
- Generated image explorations rejected for identity drift. Final two images use original source pixels with deterministic layout; no AI-generated product pixels.

## Website integration
- Card actions use one reading button: internal article for exact Atojet brand mapping, otherwise a dialog preserving existing blog/Docs sources. Old articles are NOT rewritten globally in this pilot.
- Existing single `影片網址` remains compatible. It may contain multiple lines `title | URL`; optional future `影片清單`/`Videos` supports JSON array `{title,type,url}` or the same multiline format. No Sheet cells/columns were changed.
- Videos are deduplicated by YouTube ID. UI uses one iframe at a time; other platforms offer source links. Article includes the verified original video and merges current Sheet videos.
- Article is noindex/nofollow until human content approval. It is not added to sitemap. Before release remove preview banner/robots only with content approval, update sitemap, validate canonical/OG and image links.
- Offer uses network-only Sheet CSV with `headers=1` (otherwise gviz combines the section marker into the header). Empty unused columns ignored. Required headings validated. Missing/duplicate/closed/invalid/future/soldout rows fail closed. Refresh on focus/visibility and before vendor navigation. No price stored in the article.
- Service worker version updated; docs.google.com requests bypass cache. No source secret or private group conversation stored in repo.

## Verification and boundaries
- `npm run verify`, Node tests and `git diff --check` required before handoff.
- Responsive visual review: 390px mobile and 1280px desktop. Native dialog supports Escape, close, focus restoration; multiple-video fixture is isolated under tests and not product evidence.
- Existing dependency finding: one low severity postcss-selector-parser advisory; no moderate/high/critical. Not silently upgraded as part of content work. caniuse-lite outdated warning remains.
- No main push, PR, deployment, DNS, Sheet writes, runtime changes, catalog activation, or LINE sends authorized by this pilot. Drive review archiving only follows the existing Lydia material-library workflow.

## Next approval
Review native article tone and two original-photo creatives. Approve content separately from production deployment and LINE send. Atojet has only one verified source video; second-video functionality is tested with labeled fixtures, not invented product videos.

## Final verification — 2026-09-08
- `npm run verify`: 11/11 tests; site audit 28/28, zero warnings. `git diff --check`: clean. Tailwind rebuilt from the existing lockfile.
- Browser real-data check: homepage search Atojet returns one current card; its video dialog loads the actual Atojet YouTube player and closes; its reading link opens the native article. New script explicitly uses UTF-8 with a versioned URL to avoid the prototype's earlier encoding-cache error.
- Article current-offer check: live Sheet resolves the current vendor link; no expired video-description purchase link is reused. Dialog fixture covers second-video selection and Escape/focus restoration separately from product evidence.
- Drive readback verified six review files, without changing sharing permissions: https://drive.google.com/drive/folders/1CwBPwF2JLeWCym1st8C_Pf0jXNIGOZIU
- Review contents: two final original-source PNGs, article Markdown, LINE copy Markdown, package and visual manifest. Rejected AI redraw explorations were not uploaded.
- Local article: http://127.0.0.1:8767/blog/atojet/ and blog index: http://127.0.0.1:8767/blog/ . These are local candidates, not remotely hosted or deployed pages. `/articles/atojet/` is a noindex compatibility redirect to the canonical `/blog/atojet/` path.
