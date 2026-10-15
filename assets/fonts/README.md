# Shared headline font

## Site face + slices v2 — current loader (2026-10-15)

`heading-serif-500-v2/` splits the unchanged complete v1 font (below) into
`site.woff2`, which holds every character the repository publishes, and small
`slice-NN.woff2` files covering the rest of the complete cmap. `manifest.json`
records each face's file, SHA-256, size, codepoint count and `unicode-range`.
The faces are disjoint and together equal the complete cmap exactly, so nothing
falls back to Songti TC; `tests/site-heading-font.test.mjs` checks this and that
every public h1–h6 Han character is in the site face.

Why this does not repeat the v1–v8 subset problem: those subsets *dropped*
characters, so a new heading rendered in the fallback serif until someone
rebuilt the font. Here the slices keep every character; a new character (a Sheet
product name, a new article) downloads one ~100 KB slice on demand instead of
the 3.9 MB complete font on every first visit. Rerunning the build only moves
new characters from slices into the site face.

`site-font-loader.js` keeps the two-phase rules below. It stores the site face
and manifest together in the Cache API (`heading-serif-site-500-v2`); a visitor
who already stored the complete v1 font keeps using it with no network. Slices
use the normal HTTP cache. Regenerate with
`node scripts/build-site-heading-font.mjs --python <isolated-fonttools-python>`
(fontTools + brotli); it verifies the complete font's hash first.

