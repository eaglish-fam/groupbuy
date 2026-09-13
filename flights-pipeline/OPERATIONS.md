# Flight Radar v4

The private collector runs with Node.js 22.13+ and SQLite; routine collection, scoring and exports make no model calls. The website continues to read the existing public Google Sheet. Source API responses are observations, not confirmed tickets.

## Commands

Run from the repository root:

```sh
node flights-pipeline/src/radar-cli.mjs preflight
node flights-pipeline/src/radar-cli.mjs init --legacy /absolute/path/to/old/fares.sqlite
node flights-pipeline/src/radar-cli.mjs plan
node flights-pipeline/src/radar-cli.mjs collect
node flights-pipeline/src/radar-cli.mjs health
node flights-pipeline/src/radar-cli.mjs backup
node flights-pipeline/src/radar-cli.mjs candidates
node flights-pipeline/src/radar-cli.mjs verify --quote-id QUOTE_ID --provider duffel
node flights-pipeline/src/radar-cli.mjs approve --quote-id QUOTE_ID --evidence /private/path/verification.json
node flights-pipeline/src/radar-cli.mjs export
node flights-pipeline/src/radar-cli.mjs pause
node flights-pipeline/src/radar-cli.mjs resume
```

Default data location is `~/Library/Application Support/Eaglish/flight-radar/`. Use `--data-dir` for a test sandbox. Data, review exports and backups are outside every Git checkout. Legacy import preserves the original source and is idempotent. The legacy rows cannot mature a new baseline.

## Collection

28 routes × four anchored date pairs make 112 baseline queries. Each pair remains fixed until its departure day passes. 112 additional month queries explore other dates. At least two slots in a full run are reserved for discovery. Oldest unattempted queries run first, following the configured route order. Empty cache results mean no cached offer, not an unsold or unavailable route.

Limit: 40 requests/run, 120/day in Asia/Taipei, one bounded retry, ten-minute run deadline, a single-writer lease, and pause after three fully failed runs. Every attempted request is recorded before transport. The cache source can have sparse Taiwan coverage; inspect returned-price coverage as well as transport success. A repeated source quote can create a later fetch record but cannot create an extra source observation day.

Provider activation:

| Source | Implemented use | Setup |
| --- | --- | --- |
| Travelpayouts | Exact date and month cached discovery | Existing Keychain tool boundary |
| Skyscanner | Indicative discovery; user-selected Live verification | Partner API key and required public attribution |
| SerpApi | Google Flights exact-date search snapshot | SERPAPI_API_KEY and chosen quota |
| Duffel | Selected itinerary verification only | DUFFEL_ACCESS_TOKEN and production access |

No new account, paid subscription or credential is created by the installer. SerpApi requires its key in the provider request query; the request URL and raw errors never leave the transport. Other secrets remain in headers. Sandbox Duffel offers fail verification. More platforms are enabled only after a successful production canary and observed incremental coverage.

The selected live-verification command takes the same collector lock and request budget. Each session create and poll is recorded separately before transport; a live session is not counted as one request. The optional browser regression uses `PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs node scripts/flights-radar-browser-audit.mjs` when Playwright is supplied by the workspace rather than this repository.

## History

Comparison keys include provider, airports, exact travel dates, passenger count, cabin, currency, directness, baggage and tax information. Unknown values remain unknown. Cached-price history is explicitly a history of observed reference prices, not live airline inventory. Source timestamps are used when present; otherwise the retrieval day records what the cache showed that day. Known stale sources are excluded. Cold-start data never inherits third-party historical arrays as our own observations.

7/30/90-day windows require the full elapsed window and at least 80% of distinct observation days for the comparable group. We compute daily minima, median of daily minima, p10, sample counts and date/value points. Discovery-triggered samples are excluded from the fixed baseline. Thresholds in config are editorial cold-start filters, not claims about the market's historical average. Missing 30/90-day coverage hides those labels from the public page.

## Publication and LINE

2026-09-13 priority: first verified website fares and a second usable source; LINE development/publication is deferred by Hiram. Public visibility ends at the earliest explicit expiry, source expiry, campaign end, or one hour after verification (legacy fallback: observation time). Re-fetching a Sheet never extends this deadline. Unknown/future check times and known sold-out/changed/withdrawn availability fail closed. Open pages remove expired fares on a timer, recheck on resume and outbound clicks, and refresh only the public Sheet every two minutes while visible. A failed refresh hides fares until a successful reload. Supplier price changes cannot be detected instantly without a live response; this is not an inventory guarantee. Historical SQLite records are retained, not deleted when a card disappears.

Candidates are private and pending. An approval binds quote hash, actor, checked time, supplier URL, price, route, exact dates, passenger count, currency, directness and baggage. Changed quotes require a new review. Export requires a still-current quote and verification within one hour. It produces JSON, CSV with the existing Sheet column contract, and a deterministic SVG/text LINE draft. Export is not a Sheet write or LINE send. New `history_json` is optional on the existing public Sheet; the page only displays mature, fresh statistics. A LINE draft still needs final visual review and the existing Lydia sending workflow.

## Local service

```sh
node flights-pipeline/src/install-radar.mjs install
node flights-pipeline/src/install-radar.mjs status
node flights-pipeline/src/install-radar.mjs uninstall
```

Install copies an immutable code/config release outside the worktree and registers `com.eaglish.flight-radar` with the existing macOS launchd service. It runs once at load and at 06:30, 13:30, 20:30 in the host timezone (verify Asia/Taipei before install). Daily SQLite backups are integrity-checked. A sleeping/offline/logged-out Mac does not promise exact-time execution; inspect the recorded runs. Uninstall retains the database, releases, logs and disabled plist. Updating code requires an explicit unload/install; editing Git files cannot silently change the running release.

## Sources verified 2026-09-13

- https://support.travelpayouts.com/hc/en-us/articles/203956163-Aviasales-Data-API
- https://developers.skyscanner.net/docs/getting-started/usage-guidelines
- https://serpapi.com/google-flights-api
- https://duffel.com/docs/api/offer-requests

Future work requiring external resources: platform credentials and successful real canaries; a supplier that improves Taiwan live-price coverage; genuine 30/90-day observation; Hiram-approved fare and final LINE artwork; Lydia delivery acknowledgement. Never mark these completed from tests or installer existence.
