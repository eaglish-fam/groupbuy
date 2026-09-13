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

export function stableKey(parts) {
  return createHash('sha256').update(parts.join('|')).digest('hex').slice(0, 24);
}

function travelpayoutsBookingUrl(link) {
  if (!link) return null;
  if (/^https:\/\//.test(link)) return link;
  const path = `/${String(link).replace(/^\/+/, '')}`;
  return path.startsWith('/search/')
    ? `https://www.aviasales.com${path}`
    : `https://www.aviasales.com/search${path}`;
}

export function normalizeTravelpayoutsResponse(response, query, observedAt = new Date().toISOString()) {
  const rows = Array.isArray(response.data) ? response.data : [];
  return rows.flatMap((row, index) => {
    const amount = Number(row.price ?? row.value);
    if (!Number.isFinite(amount) || amount <= 0) return [];
    const departure = row.departure_at ?? row.depart_date ?? null;
    const returnDeparture = row.return_at ?? row.return_date ?? null;
    const origin = row.origin_airport ?? row.origin ?? query.origin;
    const destination = row.destination_airport ?? row.destination ?? query.destination;
    const resultId = row.signature ?? row.link ?? `${origin}-${destination}-${departure}-${index}`;
    return [{
      ...observationBase({ kind: 'indicative', query, provider: 'travelpayouts', observedAt }),
      providerResultId: resultId,
      fareKey: stableKey(['travelpayouts', 'indicative', origin, destination, departure ?? '', returnDeparture ?? '', row.airline ?? '']),
      routeOrigin: origin,
      routeDestination: destination,
      departure,
      returnDeparture,
      priceAmount: amount,
      priceUnit: null,
      isDirect: row.transfers == null && row.number_of_changes == null ? null : (Number(row.number_of_changes ?? row.transfers) > 0 || Number(row.return_transfers ?? 0)>0) ? false : returnDeparture && row.return_transfers == null ? null : true,
      carrier: row.airline ?? null,
      bookingUrl: travelpayoutsBookingUrl(row.link ?? row.ticket_link),
      freshness: 'cached_recent_user_search',
      providerObservedAt: row.found_at ?? null,
      providerActual: row.actual ?? null,
      providerExpiresAt: row.expires_at ?? null,
      complete: response.success === true,
    }];
  });
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
      isDirect: itinerary.legIds?.length && itinerary.legIds.every(id => results.legs?.[id]?.segmentIds?.length) ? itinerary.legIds.every(id => results.legs[id].segmentIds.length === 1) : null,
        carrier: null,
        bookingUrl: item.deepLink ?? null,
        freshness: 'live_search',
        complete: Boolean(response.complete ?? response.status === 'RESULT_STATUS_COMPLETE'),
      }];
    });
  });
}
