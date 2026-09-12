import { setTimeout as delay } from 'node:timers/promises';

import { ConfigurationError, InputError, ProviderError } from '../errors.mjs';
import { normalizeQuery } from '../query.mjs';

const DEFAULT_BASE_URL = 'https://partners.api.skyscanner.net/apiservices/v3';
const COMPLETE = 'RESULT_STATUS_COMPLETE';

function requireApiKey(env) {
  const apiKey = env.SKYSCANNER_API_KEY?.trim();
  if (!apiKey) {
    throw new ConfigurationError('Skyscanner API key is not configured', {
      requiredEnvironmentVariable: 'SKYSCANNER_API_KEY',
      setup: 'Request partner API access, then expose the key only through the local secret boundary.',
    });
  }
  return apiKey;
}

function dateObject(date) {
  return { year: date.year, month: date.month, day: date.day };
}

function liveLeg(origin, destination, date) {
  return {
    originPlaceId: { iata: origin },
    destinationPlaceId: { iata: destination },
    date: dateObject(date),
  };
}

function indicativeLeg(origin, destination, date) {
  return {
    originPlace: { queryPlace: { iata: origin } },
    destinationPlace: { queryPlace: { iata: destination } },
    fixedDate: dateObject(date),
  };
}

export function buildLiveRequest(input) {
  const query = normalizeQuery(input);
  const queryLegs = [liveLeg(query.origin, query.destination, query.outbound)];
  if (query.inbound) {
    queryLegs.push(liveLeg(query.destination, query.origin, query.inbound));
  }
  return {
    query: {
      market: query.market,
      locale: query.locale,
      currency: query.currency,
      queryLegs,
      adults: query.adults,
      cabinClass: query.cabinClass,
      nearbyAirports: false,
      includeSustainabilityData: true,
    },
  };
}

export function buildIndicativeRequest(input) {
  const query = normalizeQuery(input);
  const queryLegs = [indicativeLeg(query.origin, query.destination, query.outbound)];
  if (query.inbound) {
    queryLegs.push(indicativeLeg(query.destination, query.origin, query.inbound));
  }
  return {
    query: {
      market: query.market,
      locale: query.locale,
      currency: query.currency,
      queryLegs,
      dateTimeGroupingType: 'DATE_TIME_GROUPING_TYPE_BY_DATE',
    },
  };
}

function makeAbortSignal(timeoutMs) {
  return AbortSignal.timeout(timeoutMs);
}

async function parseResponse(response) {
  const text = await response.text();
  let body = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { unparseableBody: true };
  }
  if (!response.ok) {
    throw new ProviderError(`Skyscanner returned HTTP ${response.status}`, {
      status: response.status,
      retryable: response.status === 429 || response.status >= 500,
      details: { provider: 'skyscanner' },
    });
  }
  return body;
}

function createTransport({ apiKey, fetchImpl, baseUrl, timeoutMs }) {
  return async function post(path, body) {
    let response;
    try {
      response = await fetchImpl(`${baseUrl}${path}`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'user-agent': 'eaglish-terra-flight-scanner/0.1',
          'x-api-key': apiKey,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: makeAbortSignal(timeoutMs),
      });
    } catch (error) {
      throw new ProviderError('Skyscanner request failed before a response was received', {
        retryable: true,
        details: { provider: 'skyscanner', cause: error.name },
      });
    }
    return parseResponse(response);
  };
}

export class SkyscannerProvider {
  constructor({
    env = process.env,
    fetchImpl = globalThis.fetch,
    baseUrl = DEFAULT_BASE_URL,
    timeoutMs = 15_000,
    maxPolls = 5,
    pollIntervalMs = 1_000,
  } = {}) {
    this.apiKey = requireApiKey(env);
    this.post = createTransport({ apiKey: this.apiKey, fetchImpl, baseUrl, timeoutMs });
    this.maxPolls = maxPolls;
    this.pollIntervalMs = pollIntervalMs;
  }

  async searchIndicative(input) {
    return this.post('/flights/indicative/search', buildIndicativeRequest(input));
  }

  async searchLive(input, { userInitiated = false } = {}) {
    if (!userInitiated) {
      throw new InputError(
        'Skyscanner live search requires a user-initiated exact-date request',
        { field: 'userInitiated' },
      );
    }
    let result = await this.post('/flights/live/search/create', buildLiveRequest(input));
    if (!result.sessionToken) {
      throw new ProviderError('Skyscanner live response did not include a session token');
    }
    let polls = 0;
    while (result.status !== COMPLETE && polls < this.maxPolls) {
      polls += 1;
      if (this.pollIntervalMs > 0) await delay(this.pollIntervalMs);
      const next = await this.post(
        `/flights/live/search/poll/${encodeURIComponent(result.sessionToken)}`,
      );
      result = mergeLiveResults(result, next);
    }
    return { ...result, pollCount: polls, complete: result.status === COMPLETE };
  }
}

function mergeKeyed(previous = {}, next = {}, action) {
  return action === 'RESULT_ACTION_REPLACED' ? { ...next } : { ...previous, ...next };
}

export function mergeLiveResults(previous, next) {
  const action = next.action;
  const previousResults = previous.content?.results ?? {};
  const nextResults = next.content?.results ?? {};
  return {
    ...previous,
    ...next,
    sessionToken: next.sessionToken ?? previous.sessionToken,
    content: {
      ...(previous.content ?? {}),
      ...(next.content ?? {}),
      results: {
        ...previousResults,
        ...nextResults,
        itineraries: mergeKeyed(previousResults.itineraries, nextResults.itineraries, action),
        legs: mergeKeyed(previousResults.legs, nextResults.legs, action),
        segments: mergeKeyed(previousResults.segments, nextResults.segments, action),
        carriers: mergeKeyed(previousResults.carriers, nextResults.carriers, action),
        agents: mergeKeyed(previousResults.agents, nextResults.agents, action),
        places: mergeKeyed(previousResults.places, nextResults.places, action),
      },
    },
  };
}

export function skyscannerPreflight(env = process.env) {
  return {
    provider: 'skyscanner',
    configured: Boolean(env.SKYSCANNER_API_KEY?.trim()),
    secretBoundary: 'environment',
    requiredEnvironmentVariable: 'SKYSCANNER_API_KEY',
    capabilities: ['indicative_search', 'live_search'],
  };
}
