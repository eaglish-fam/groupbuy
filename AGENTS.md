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

- Preserve one canonical domain: `https://www.eaglish.store/`.
- Keep `robots.txt`, `sitemap.xml`, canonical URLs, Open Graph, structured data, and public content mutually consistent.
- Do not generate indexable URLs for expired or unconfirmed campaigns.
- Do not treat query parameters, inferred product facts, or old Sheet notes as confirmed current information.
- Accessibility and readable mobile behavior are release requirements, not optional polish.
