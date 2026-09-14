# 鷹家遠行所：曼谷旅行筆記首版

## Scope

- /trip/ is the travel journal home; /trip/guides/bangkok-with-kids/ is the first article.
- Existing flight frontend remains at /trip/flights/. Flight collectors, data, expiry rules and Sheet configuration are unchanged.
- No inbound navigation was added to the shop home or product journal.
- Generate with npm run build:trip; npm run verify includes generation and all tests.

## Content authority

Based on the family's Bangkok video https://www.youtube.com/watch?v=f5h0gGdaX2c and reviewed footage.
Market discussion: 843 seconds; Children's Discovery Museum: 1097 seconds; aquarium and boat: 2289 seconds; food court: 2471 seconds.
Four existing video frames are used unchanged as JPEGs with descriptive alt text. Private transcripts and model outputs are not shipped.
The aquarium and individual restaurants are not assigned unverified names or booking links. Current admission prices, age concessions and opening times are not asserted. Proposed itinerary arrangements are distinguished from the filmed sequence.
Google Maps links are explicitly name searches, not claimed verified Place IDs. Affiliate product matching is not complete and no unverified affiliate offers were added.

## Verification and implications

- npm run verify: 115 tests passed; site audit 30/30; existing blog audit 371/371.
- Browser: 390px home/article visual checks; 320px article has no horizontal overflow; 1440px home visual check.
- Article navigation and native FAQ expansion verified.
- One H1 per page, canonical URLs, descriptions, Open Graph, sitemap entries, skip link, keyboard focus styles, reduced-motion styling and responsive layout.
- Four small JPEGs with intrinsic dimensions; below-fold images lazy-loaded. No new client framework or external content feed.
- This is a first travel article and homepage, not completion of a world map, itinerary planner or affiliate booking pipeline.

## Rollback

Revert the dedicated travel-journal release commit (not unrelated commits), regenerate and verify, then publish through the existing authorized release process. No database migration or remote settings were changed.
