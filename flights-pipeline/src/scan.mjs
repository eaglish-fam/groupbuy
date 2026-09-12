import { normalizeQuery } from './query.mjs';

export function buildScanQueries(config, input) {
  const region = input.region ?? 'all';
  const origins = config.originAirports ?? [];
  const destinationGroups = config.regions ?? {};
  const destinations = region === 'all'
    ? Object.values(destinationGroups).flat()
    : destinationGroups[region];
  if (!Array.isArray(destinations)) {
    throw new Error(`Unknown route region: ${region}`);
  }

  const requestedLimit = Number(input.maxRequests ?? 20);
  if (!Number.isInteger(requestedLimit) || requestedLimit < 1 || requestedLimit > 100) {
    throw new Error('maxRequests must be an integer from 1 to 100');
  }

  const uniquePairs = [];
  const seen = new Set();
  for (const origin of origins) {
    for (const destination of destinations) {
      const key = `${origin}:${destination}`;
      if (origin === destination || seen.has(key)) continue;
      seen.add(key);
      uniquePairs.push(normalizeQuery({
        ...input,
        origin,
        destination,
        market: config.market,
        locale: config.locale,
        currency: config.currency,
      }));
    }
  }
  return uniquePairs.slice(0, requestedLimit);
}

export async function runIndicativeScan({ provider, store, queries, now = () => new Date().toISOString() }) {
  const summary = { requested: queries.length, succeeded: 0, failed: 0, inserted: 0, failures: [] };
  for (const query of queries) {
    try {
      const response = await provider.searchIndicative(query);
      const observations = provider.normalizeIndicative(response, query, now());
      summary.inserted += store.insertMany(observations);
      summary.succeeded += 1;
    } catch (error) {
      summary.failed += 1;
      summary.failures.push({
        origin: query.origin,
        destination: query.destination,
        code: error.code ?? 'unexpected_error',
        retryable: error.retryable ?? false,
      });
    }
  }
  return summary;
}
