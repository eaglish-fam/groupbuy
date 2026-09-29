# Shared headline font

`noto-serif-tc-headings-v2.woff2` is a 500-weight subset of [Noto Serif TC](https://github.com/google/fonts/tree/main/ofl/notoseriftc), licensed under the included `OFL-NotoSerifTC.txt`. The source is the Google Fonts variable TTF (`NotoSerifTC[wght].ttf`). Version 2 adds the character 普 for the EBEN heading.

The subset contains the characters used by h1–h3 on the 39 public pages at the time it was generated, plus ASCII and common punctuation. It is served locally through `site-navigation.css` across 買物社、選物誌、遠行所. Body copy keeps its existing system sans-serif font. Characters outside the subset fall back to system Songti/serif.

When adding headings with new characters, refresh `heading-glyphs.txt` from the public HTML, then use fontTools to instance the upstream TTF at weight 500 and subset it to WOFF2. Update the versioned filename in `site-navigation.css` to invalidate browser caches. The source TTF is intentionally not stored in this repository.
