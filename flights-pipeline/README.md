# Terra flight pipeline

Private backend pipeline for the public Eaglish flight-deal page. It keeps provider credentials and raw search activity out of browser code.

## First provider

Skyscanner is implemented behind a provider adapter:

- `indicative`: broad discovery; cached prices may be up to four days old.
- `live`: exact-date verification; requires an explicit user-initiated flag, creates a session and polls up to a bounded limit.
- normalized observations are appended to local SQLite for later comparison and scoring.

No key is committed. Provide `SKYSCANNER_API_KEY` through the local runtime secret boundary.

```sh
npm run flight:preflight
SKYSCANNER_API_KEY=... npm run flight:indicative -- \
  --origin TPE --destination NRT --outbound 2026-10-08 --inbound 2026-10-12

SKYSCANNER_API_KEY=... npm run flight:scan -- \
  --region asia --outbound 2026-10-08 --inbound 2026-10-12 --max-requests 20
```

Default database: `flights-pipeline/data/fares.sqlite` (gitignored).

The pipeline uses the built-in `node:sqlite` module and requires Node.js 22.13 or newer.

## Safety boundaries

- Read-only supplier calls only.
- Scheduled discovery may use indicative prices only; Skyscanner live pricing is restricted to explicit user requests.
- No booking, purchase, messaging, Google Sheet write, background schedule, or production deployment.
- API responses are normalized before storage; API keys are never emitted to output or logs.
- `preflight` reports only whether configuration exists.
