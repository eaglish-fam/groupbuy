import { createHash, randomUUID } from 'node:crypto';

function dateTimeToIso(value) {
  if (!value?.year || !value?.month || !value?.day) return null;
  const month = String(value.month).padStart(2, '0');
  const day = String(value.day).padStart(2, '0');
  const hour = String(value.hour ?? 0).padStart(2, '0');
  const minute = String(value.minute ?? 0).padStart(2, '0');
  const second = String(value.second ?? 0).padStart(2, '0');
  return `${value.year}-${month}-${day}T${hour}:${minute}:${second}`;
}

function stableKey(parts) {
  return createHash('sha256').update(parts.join('|')).digest('hex').slice(0, 24);
}

function observationBase({ kind, query, provider, observedAt }) {
  return {
    observationId: randomUUID(),
    provider,
    searchKind: kind,
    observedAt,
    origin: query.origin,
    destination: query.destination,
    outboundDate: query.outbound.iso,
    inboundDate: query.inbound?.iso ?? null,
    adults: query.adults,
    cabinClass: query.cabinClass,
    currency: query.currency,
  };
}

export function normalizeIndicativeResponse(response, query, observedAt = new Date().toISOString()) {
  const quotes = response.content?.results?.quotes ?? {};
  const places = response.content?.results?.places ?? {};
  const carriers = response.content?.results?.carriers ?? {};
  return Object.entries(quotes).flatMap(([quoteId, quote]) => {
    const amount = Number(quote.minPrice?.amount);
    if (!Number.isFinite(amount)) return [];
    const outbound = quote.outboundLeg ?? {};
    const inbound = quote.inboundLeg ?? null;
    const origin = places[outbound.originPlaceId]?.iata ?? query.origin;
    const destination = places[outbound.destinationPlaceId]?.iata ?? query.destination;
    const carrier = carriers[outbound.marketingCarrierId]?.name ?? null;
    const departure = dateTimeToIso(outbound.departureDateTime);
    const returnDeparture = dateTimeToIso(inbound?.departureDateTime);
    return [{
      ...observationBase({ kind: 'indicative', query, provider: 'skyscanner', observedAt }),
      providerResultId: quoteId,
      fareKey: stableKey(['skyscanner', 'indicative', origin, destination, departure, returnDeparture ?? '']),
      routeOrigin: origin,
      routeDestination: destination,
      departure,
      returnDeparture,
      priceAmount: amount,
      priceUnit: quote.minPrice?.unit ?? null,
      isDirect: Boolean(quote.isDirect),
      carrier,
      bookingUrl: null,
      freshness: 'cached_up_to_4_days',
      complete: response.status === 'RESULT_STATUS_COMPLETE',
    }];
  });
}

export function normalizeLiveResponse(response, query, observedAt = new Date().toISOString()) {
  const results = response.content?.results ?? {};
  const itineraries = results.itineraries ?? {};
  return Object.entries(itineraries).flatMap(([itineraryId, itinerary]) => {
    const options = itinerary.pricingOptions ?? [];
    return options.flatMap((option, optionIndex) => {
      const amount = Number(option.price?.amount);
      if (!Number.isFinite(amount)) return [];
      const item = option.items?.[0] ?? {};
      return [{
        ...observationBase({ kind: 'live', query, provider: 'skyscanner', observedAt }),
        providerResultId: `${itineraryId}:${option.id ?? optionIndex}`,
        fareKey: stableKey(['skyscanner', 'live', itineraryId, option.id ?? String(optionIndex)]),
        routeOrigin: query.origin,
        routeDestination: query.destination,
        departure: `${query.outbound.iso}T00:00:00`,
        returnDeparture: query.inbound ? `${query.inbound.iso}T00:00:00` : null,
        priceAmount: amount,
        priceUnit: option.price?.unit ?? null,
        isDirect: (itinerary.legIds?.length ?? 0) <= (query.inbound ? 2 : 1),
        carrier: null,
        bookingUrl: item.deepLink ?? null,
        freshness: 'live_search',
        complete: Boolean(response.complete ?? response.status === 'RESULT_STATUS_COMPLETE'),
      }];
    });
  });
}
