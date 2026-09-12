import { InputError } from '../errors.mjs';
import { SkyscannerProvider, skyscannerPreflight } from './skyscanner.mjs';
import { TravelpayoutsProvider, travelpayoutsPreflight } from './travelpayouts.mjs';

export function providerPreflight(env = process.env) {
  return [travelpayoutsPreflight(env), skyscannerPreflight(env)];
}

export function createIndicativeProvider(name = 'travelpayouts', options = {}) {
  if (name === 'travelpayouts') return new TravelpayoutsProvider(options);
  if (name === 'skyscanner') return new SkyscannerProvider(options);
  throw new InputError(`Unsupported flight provider: ${name}`, { field: 'provider' });
}
