# Shared headline font

## Complete site font v1 — current two-phase controller

`noto-serif-tc-complete-500-v1.woff2` is the full, non-subset Noto Serif TC
2.003 weight-500 instance: 4,051,388 bytes, SHA-256
`5cb64d3c5e3326c802efc4dc7f57d3a50efcd45e45635897549ec3053f1dc620`.
`complete-site-font-v1.json` records the actual emitted cmap (20,748 codepoints,
20,939 glyphs), exact source-cmap equality, weight and checksums. Tests check
every public Chinese h1–h6 against these actual cmap ranges, not a desired list.

Official Google Fonts source commit: `6d17dab13b85129360f9748f057c7f67c5f484d4`.
Source: https://raw.githubusercontent.com/google/fonts/6d17dab13b85129360f9748f057c7f67c5f484d4/ofl/notoseriftc/NotoSerifTC%5Bwght%5D.ttf
Upstream variable SHA-256: `0077e18f57c6908f4a000969880940bdb0dad057c0e8d98b49dc364c3d1b09c6`.
Verified weight-500 TTF SHA-256: `4e964ce8ebc59027d86a21e868c5365d5efa94788dc02112d0e331f9f81f875f`.
The included `OFL-NotoSerifTC.txt` applies. The source's internal ExtraLight
family name is retained; the instantiated OS/2 weight and registered CSS weight
are 500. No TTF or private Project input is needed by ordinary builds.

The shared `site-font-loader.js` registers both existing aliases, `Eaglish
Heading Serif` and `Eaglish Travel Heading Serif`, from one immutable same-origin
font URL, only after both faces decode. System-sans body roles and Songti TC
serif fallback are preserved. Automatic CSS font faces and font preloads are
removed. All three entry pages (`/`, `/blog/`, `/trip/`) initially request no
font. A warm homepage may decode an already stored font after fallback paints,
using cache-only lookup with zero network GET; a cold cache remains deferred.
A real main-view change unlocks background loading; non-entry pages paint
fallback first and then request the font at low priority. Failure leaves content
readable without a retry loop. Completed downloads reuse the secure-page Cache
API (no worker), with normal HTTP cache as a storage-denied fallback. Only this
immutable public font is stored; no user data or persistence permission is used.
This avoids the observed WebKit cross-document HTTP-cache misses. Navigating
during an unfinished download may cancel that document's
request. There is no service worker or cross-document continuation guarantee.

Ordinary builds consume the checked-in WOFF2 and manifest. Optional manual
regeneration uses `node scripts/build-complete-site-font.mjs --python
<isolated-fonttools-python> --source <verified-weight-500.ttf>`; it verifies the
source hash and full cmap equality without subsetting or global installation.
Previous font binaries remain unchanged for history, but their automatic faces
are no longer active.

## Historical subset lineage (not the current loading workflow)

Approved travel v1 is an additive 37-glyph supplement for the six newly published
Norway/Netherlands pages, using the same OFL Noto Serif TC weight-500 approach
as Singapore. `noto-serif-tc-approved-travel-v1.woff2` is checked in; ordinary
repository builds need no private Project, source TTF or fontTools installation.
Before complete v1, publication-enabled approved city/country adapters emitted
its unicode-range face. That automatic registration is now inactive.
Rebuild with `scripts/build-approved-travel-heading-font.mjs`, an isolated
fontTools Python and the upstream weight-500 instance. The glyph list is frozen
in `approved-travel-heading-glyphs-v1.txt`; maximum supplement size is 24 KiB.
Upstream variable source is Google Fonts commit
`6d17dab13b85129360f9748f057c7f67c5f484d4`, `ofl/notoseriftc/NotoSerifTC[wght].ttf`.
The included `OFL-NotoSerifTC.txt` applies. Full source and emitted supplement
hashes are retained in the release engineering receipt; no full TTF is published.

Singapore v1 is an additive 29-glyph supplement (`noto-serif-tc-singapore-v1.woff2`) to the unchanged shared v8 font. It uses the same upstream Noto Serif TC weight-500 instance and included OFL license. Only Singapore CSS registers its explicit unicode range; no existing page, Songti setting or older font is replaced. Rebuild it with `scripts/build-singapore-heading-font.mjs`, an installed fontTools Python and the upstream weight-500 instance. Ordinary page builds use the checked-in WOFF2 and need no fontTools or source TTF.

Version 8 (`noto-serif-tc-headings-v8.woff2`) adds the 六福莊 room-choice article headings while retaining all prior glyphs, the weight-500 source instance, OFL license and 256 KiB budget. Version 7 is preserved. Build arguments: version `8`, source kind `instanced-500`.

Version 7 (`noto-serif-tc-headings-v7.woff2`) includes the reader-first Bohol hotel revision headings (including 般). It retains the full prior glyph set, weight-500 source instance, OFL license and 256 KiB budget; v6 remains immutable. Songti TC is unchanged. Build arguments: version `7`, source kind `instanced-500`.

Version 6 (`noto-serif-tc-headings-v6.woff2`) adds the two Bohol hotel articles' headings. It retains all previous glyphs and the full weight-500 source instance, uses the same license and 256 KiB budget, and preserves v3–v5 assets. Songti TC remains unchanged. Build arguments: version `6`, source kind `instanced-500`.

Version 5 (`noto-serif-tc-headings-v5.woff2`) adds the expanded guide's whale-shark and dining headings. It uses the retained full weight-500 Noto Serif TC instance, with the same license and 256 KiB limit; v4 is preserved. Songti TC is unchanged. Explicit build arguments select version `5` and source kind `instanced-500`.

Version 4 (`noto-serif-tc-headings-v4.woff2`) extends the same weight-500 family with Cebu/Bohol article and Philippines homepage headings. The previous v3 asset remains available. Rebuild using `scripts/build-heading-font.mjs` with installed fontTools and the upstream variable TTF; existing glyphs are retained, new public headings are added, and the 256 KiB budget is enforced. Songti TC remains the system serif fallback.

`noto-serif-tc-headings-v3.woff2` is a 500-weight subset of [Noto Serif TC](https://github.com/google/fonts/tree/main/ofl/notoseriftc), licensed under the included `OFL-NotoSerifTC.txt`. The source is the Google Fonts variable TTF (`NotoSerifTC[wght].ttf`). Version 3 adds the characters used by the EBEN article headings, including 桶、釀、双、柚、梅、涼.

The subset contains `heading-glyphs.txt` characters used by h1–h3 on public pages, plus ASCII and punctuation. It is served locally through `site-navigation.css` across 買物社、選物誌、遠行所. Body copy keeps its system sans-serif font. The source TTF is not stored in this repository.

For new headings, run the complete-font cmap gate. Do not reactivate a subset,
automatic font face or preload. Changes to the complete font require a new
immutable URL, source/license/hash evidence and the two-phase loading checks.
