import { InputError } from './errors.mjs';

const IATA_PATTERN = /^[A-Z]{3}$/;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function parseIsoDate(value, fieldName) {
  if (!ISO_DATE_PATTERN.test(value ?? '')) {
    throw new InputError(`${fieldName} must use YYYY-MM-DD`, { field: fieldName });
  }
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new InputError(`${fieldName} is not a valid date`, { field: fieldName });
  }
  return { year, month, day, iso: value };
}

export function normalizeQuery(input) {
  const origin = String(input.origin ?? '').trim().toUpperCase();
  const destination = String(input.destination ?? '').trim().toUpperCase();
  if (!IATA_PATTERN.test(origin)) {
    throw new InputError('origin must be a 3-letter IATA code', { field: 'origin' });
  }
  if (!IATA_PATTERN.test(destination)) {
    throw new InputError('destination must be a 3-letter IATA code', { field: 'destination' });
  }
  if (origin === destination) {
    throw new InputError('origin and destination must differ');
  }

  const outbound = parseIsoDate(input.outbound, 'outbound');
  const inbound = input.inbound ? parseIsoDate(input.inbound, 'inbound') : null;
  if (inbound && inbound.iso <= outbound.iso) {
    throw new InputError('inbound must be later than outbound', { field: 'inbound' });
  }

  const adults = Number(input.adults ?? 1);
  if (!Number.isInteger(adults) || adults < 1 || adults > 8) {
    throw new InputError('adults must be an integer from 1 to 8', { field: 'adults' });
  }

  return {
    origin,
    destination,
    outbound,
    inbound,
    adults,
    market: String(input.market ?? 'TW').toUpperCase(),
    locale: String(input.locale ?? 'zh-TW'),
    currency: String(input.currency ?? 'TWD').toUpperCase(),
    cabinClass: String(input.cabinClass ?? 'CABIN_CLASS_ECONOMY'),
  };
}
