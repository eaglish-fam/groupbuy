# Shared headline font

`noto-serif-tc-headings-v3.woff2` is a 500-weight subset of [Noto Serif TC](https://github.com/google/fonts/tree/main/ofl/notoseriftc), licensed under the included `OFL-NotoSerifTC.txt`. The source is the Google Fonts variable TTF (`NotoSerifTC[wght].ttf`). Version 3 adds the characters used by the EBEN article headings, including 桶、釀、双、柚、梅、涼.

The subset contains `heading-glyphs.txt` characters used by h1–h3 on public pages, plus ASCII and punctuation. It is served locally through `site-navigation.css` across 買物社、選物誌、遠行所. Body copy keeps its system sans-serif font. The source TTF is not stored in this repository.

For new headings, collect public h1–h3 glyphs, instance the upstream variable font at weight 500 with fontTools, subset to WOFF2, and update the versioned filename in `site-navigation.css` so browsers receive the new glyphs.
