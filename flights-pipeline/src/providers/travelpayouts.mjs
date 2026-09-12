import { ConfigurationError, ProviderError } from '../errors.mjs';
import { normalizeTravelpayoutsResponse } from '../normalize.mjs';
import { normalizeQuery } from '../query.mjs';

const DEFAULT_BASE_URL = 'https://api.travelpayouts.com';

function requireToken(env) {
  const token = env.TRAVELPAYOUTS_API_TOKEN?.trim();
  if (!token) {
    throw new ConfigurationError('Travelpayouts API token is not configured', {
      requiredEnvironmentVariable: 'TRAVELPAYOUTS_API_TOKEN',
      setup: 'Create or use a Travelpayouts affiliate account, then expose its API token only through the local secret boundary.',
    });
  }
  return token;
}

export function buildTravelpayoutsUrl(input, baseUrl = DEFAULT_BASE_URL) {
  const query = normalizeQuery(input);
  const url = new URL('/aviasales/v3/prices_for_dates', baseUrl);
  url.searchParams.set('origin', query.origin);
  url.searchParams.set('destination', query.destination);
  url.searchParams.set('departure_at', query.outbound.iso);
  if (query.inbound) url.searchParams.set('return_at', query.inbound.iso);
  url.searchParams.set('one_way', query.inbound ? 'false' : 'true');
  url.searchParams.set('direct', 'false');
  url.searchParams.set('currency', query.currency.toLowerCase());
  url.searchParams.set('market', query.market.toLowerCase());
  url.searchParams.set('sorting', 'price');
  url.searchParams.set('unique', 'false');
  url.searchParams.set('limit', '30');
  url.searchParams.set('page', '1');
  return url;
}

export class TravelpayoutsProvider {
  constructor({
    env = process.env,
    fetchImpl = globalThis.fetch,
    baseUrl = DEFAULT_BASE_URL,
    timeoutMs = 15_000,
  } = {}) {
    this.id = 'travelpayouts';
    this.token = requireToken(env);
    this.fetchImpl = fetchImpl;
    this.baseUrl = baseUrl;
    this.timeoutMs = timeoutMs;
  }

  async searchIndicative(input) {
    const url = buildTravelpayoutsUrl(input, this.baseUrl);
    let response;
    try {
      response = await this.fetchImpl(url, {
        method: 'GET',
        headers: {
          accept: 'application/json',
          'user-agent': 'eaglish-terra-flight-scanner/0.1',
          'x-access-token': this.token,
        },
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (error) {
      throw new ProviderError('Travelpayouts request failed before a response was received', {
        retryable: true,
        details: { provider: this.id, cause: error.name },
      });
    }

    let body = {};
    try {
      body = JSON.parse(await response.text());
    } catch {
      body = { success: false };
    }
    if (!response.ok || body.success === false) {
      throw new ProviderError('Travelpayouts returned an unsuccessful response', {
        status: response.status,
        retryable: response.status === 429 || response.status >= 500,
        details: { provider: this.id },
      });
    }
    return body;
  }

  normalizeIndicative(response, query, observedAt) {
    return normalizeTravelpayoutsResponse(response, query, observedAt);
  }
}

export function travelpayoutsPreflight(env = process.env) {
  return {
    provider: 'travelpayouts',
    configured: Boolean(env.TRAVELPAYOUTS_API_TOKEN?.trim()),
    secretBoundary: 'environment',
    requiredEnvironmentVariable: 'TRAVELPAYOUTS_API_TOKEN',
    capabilities: ['cached_price_discovery'],
  };
}
