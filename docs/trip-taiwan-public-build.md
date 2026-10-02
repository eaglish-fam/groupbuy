# Taiwan public travel home

`npm run verify` rebuilds `/trip/` from `trip/content/home-r24.html.template` and
`trip/data/taiwan-atlas-r24.json`. These contain only reviewed public markup,
geography and consumer information; no private workspace, receipts or environment
variables are required. The original generic country renderer remains available
for subsequent editorial work. A catalog change must also reconcile the public
projection; the build fails instead of silently hiding a new country.

The release has 53 places: 41 attractions, 7 restaurants and 5 hotels. Its 48
feature-led square WebP photos are content-addressed and remain exact originals
of the accepted derivatives, not camera originals. Five places are text-only.
`trip/data/taiwan-atlas-release-r24.json` pins the public IDs, media and geometry.
No article is invented for a place that currently only has an information card.
Two regional films have 13 chapters; these are not extra places.

The list uses `eaglish.taiwan-trip-list.v1` in the current browser's localStorage.
It supports add, reorder, remove and undo, but no Google account or cross-device
sync. Google Maps search/directions are ordinary links without API credentials.

HOME and Cebu use the reviewed 4:5 / 3:2 presentation and a separate local travel
heading subset, leaving the journal/shop font and data untouched. Cebu still
rebuilds from its existing Markdown, media and route sources. Public controllers
and the globe bundle are built with the existing esbuild toolchain; county
geometry is a frozen public export, not a private host-path dependency.

For later edits, update the portable sources, run verify, inspect the scoped diff
and get applicable publication authorization. Do not deploy an old entire
checkout over current main. A scoped revert of the release commit restores the
previous travel home without resetting user data or unrelated site work.
