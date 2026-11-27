# Taiwan public travel home

`npm run verify` rebuilds `/trip/` with `scripts/render-travel-home-r24.mjs` from
`trip/data/taiwan-atlas-r24.json` (reviewed catalog, Taiwan places, regional films),
the registered approved travel packages and the pinned Natural Earth 1:110m map
(`world-atlas`, projected at build time in `scripts/trip-home-world-map.mjs`; the
page ships an inline SVG and makes no map request). The home is: world map with the
country list, destination cards by continent, a Taiwan door into `/trip/taiwan/`
(region counts by each place's first county), the two regional films, and the
planning tools. The 53 Taiwan places themselves are rendered on `/trip/taiwan/` by
`scripts/build-trip-taiwan.mjs`. `trip/content/home-r24.html.template` is kept only
as the reviewed source of the 鷹家遠行所 wordmark. A catalog change must also
reconcile the public projection; the build fails instead of silently hiding a new
country.

The release has 53 places: 41 attractions, 7 restaurants and 5 hotels. Its 48
feature-led square WebP photos are content-addressed and remain exact originals
of the accepted derivatives, not camera originals. Five places are text-only.
`trip/data/taiwan-atlas-release-r24.json` pins the public IDs, media and geometry.
No article is invented for a place that currently only has an information card.
Two regional films have 13 chapters; these are not extra places.

The saved list uses `eaglish.taiwan-trip-list.v1` in the current browser's
localStorage. Since the home redesign the add/reorder controls of the old atlas are
gone; the home's 旅程清單 card appears only when this browser already saved places,
and lists them with a remove button. No Google account or cross-device sync.

The home uses 3:2 destination covers (approved camera-first photos, never cropped
to a portrait) and the shared site heading serif, like `/trip/taiwan/`. Cebu keeps
the reviewed 4:5 / 3:2 presentation and its travel heading subset, and still
rebuilds from its existing Markdown, media and route sources. Public controllers
and the globe bundle are built with the existing esbuild toolchain; county
geometry is a frozen public export, not a private host-path dependency.

For later edits, update the portable sources, run verify, inspect the scoped diff
and get applicable publication authorization. Do not deploy an old entire
checkout over current main. A scoped revert of the release commit restores the
previous travel home without resetting user data or unrelated site work.
