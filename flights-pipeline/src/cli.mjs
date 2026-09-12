#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { ConfigurationError, InputError, ProviderError } from './errors.mjs';
import { normalizeIndicativeResponse, normalizeLiveResponse } from './normalize.mjs';
import { SkyscannerProvider, skyscannerPreflight } from './providers/skyscanner.mjs';
import { normalizeQuery } from './query.mjs';
import { buildScanQueries, runIndicativeScan } from './scan.mjs';
import { FareStore } from './store.mjs';

function parseArguments(values) {
  const parsed = {};
  for (let index = 0; index < values.length; index += 1) {
    const token = values[index];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    const next = values[index + 1];
    if (!next || next.startsWith('--')) parsed[key] = true;
    else {
      parsed[key] = next;
      index += 1;
    }
  }
  return parsed;
}

function usage() {
  return [
    'Usage:',
    '  npm run flight:preflight',
    '  npm run flight:indicative -- --origin TPE --destination NRT --outbound 2026-10-08 --inbound 2026-10-12',
    '  npm run flight:live -- --origin TPE --destination NRT --outbound 2026-10-08 --inbound 2026-10-12 --user-initiated',
    '  npm run flight:scan -- --region asia --outbound 2026-10-08 --inbound 2026-10-12 --max-requests 20',
  ].join('\n');
}

function publicError(error) {
  if (error instanceof ConfigurationError || error instanceof InputError || error instanceof ProviderError) {
    return {
      ok: false,
      code: error.code,
      message: error.message,
      retryable: error.retryable ?? false,
      details: error.details,
    };
  }
  return { ok: false, code: 'unexpected_error', message: error.message };
}

async function main() {
  const command = process.argv[2];
  if (command === 'preflight') {
    const result = skyscannerPreflight();
    console.log(JSON.stringify({ ok: result.configured, ...result }, null, 2));
    process.exitCode = result.configured ? 0 : 2;
    return;
  }
  if (!['indicative', 'live', 'scan'].includes(command)) {
    console.error(usage());
    process.exitCode = 2;
    return;
  }

  const args = parseArguments(process.argv.slice(3));
  if (command === 'scan') {
    const configPath = resolve(args.config ?? 'flights-pipeline/config/routes.sample.json');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    const queries = buildScanQueries(config, args);
    const provider = new SkyscannerProvider();
    const databasePath = resolve(args.database ?? 'flights-pipeline/data/fares.sqlite');
    const store = new FareStore(databasePath);
    const summary = await runIndicativeScan({ provider, store, queries });
    store.close();
    console.log(JSON.stringify({ ok: summary.failed === 0, provider: 'skyscanner', summary }, null, 2));
    process.exitCode = summary.failed === 0 ? 0 : 1;
    return;
  }
  const query = normalizeQuery(args);
  const provider = new SkyscannerProvider();
  const raw = command === 'indicative'
    ? await provider.searchIndicative(query)
    : await provider.searchLive(query, { userInitiated: args.userInitiated === true });
  const observations = command === 'indicative'
    ? normalizeIndicativeResponse(raw, query)
    : normalizeLiveResponse(raw, query);
  const databasePath = resolve(args.database ?? 'flights-pipeline/data/fares.sqlite');
  const store = new FareStore(databasePath);
  const inserted = store.insertMany(observations);
  const total = store.count();
  store.close();
  console.log(JSON.stringify({
    ok: true,
    provider: 'skyscanner',
    searchKind: command,
    inserted,
    totalStored: total,
    observations,
  }, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify(publicError(error), null, 2));
  process.exitCode = 1;
});
