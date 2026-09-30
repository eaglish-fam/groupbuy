# Shared headline font

Version 7 (`noto-serif-tc-headings-v7.woff2`) includes the reader-first Bohol hotel revision headings (including 般). It retains the full prior glyph set, weight-500 source instance, OFL license and 256 KiB budget; v6 remains immutable. Songti TC is unchanged. Build arguments: version `7`, source kind `instanced-500`.

Version 6 (`noto-serif-tc-headings-v6.woff2`) adds the two Bohol hotel articles' headings. It retains all previous glyphs and the full weight-500 source instance, uses the same license and 256 KiB budget, and preserves v3–v5 assets. Songti TC remains unchanged. Build arguments: version `6`, source kind `instanced-500`.

Version 5 (`noto-serif-tc-headings-v5.woff2`) adds the expanded guide's whale-shark and dining headings. It uses the retained full weight-500 Noto Serif TC instance, with the same license and 256 KiB limit; v4 is preserved. Songti TC is unchanged. Explicit build arguments select version `5` and source kind `instanced-500`.

Version 4 (`noto-serif-tc-headings-v4.woff2`) extends the same weight-500 family with Cebu/Bohol article and Philippines homepage headings. The previous v3 asset remains available. Rebuild using `scripts/build-heading-font.mjs` with installed fontTools and the upstream variable TTF; existing glyphs are retained, new public headings are added, and the 256 KiB budget is enforced. Songti TC remains the system serif fallback.

`noto-serif-tc-headings-v3.woff2` is a 500-weight subset of [Noto Serif TC](https://github.com/google/fonts/tree/main/ofl/notoseriftc), licensed under the included `OFL-NotoSerifTC.txt`. The source is the Google Fonts variable TTF (`NotoSerifTC[wght].ttf`). Version 3 adds the characters used by the EBEN article headings, including 桶、釀、双、柚、梅、涼.

The subset contains `heading-glyphs.txt` characters used by h1–h3 on public pages, plus ASCII and punctuation. It is served locally through `site-navigation.css` across 買物社、選物誌、遠行所. Body copy keeps its system sans-serif font. The source TTF is not stored in this repository.

For new headings, collect public h1–h3 glyphs, instance the upstream variable font at weight 500 with fontTools, subset to WOFF2, and update the versioned filename in `site-navigation.css` so browsers receive the new glyphs.
