// Public serialization helpers. Private source adaptation remains outside
// the production build and is not required by a clean checkout.
export const esc=value=>String(value).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
export const scriptJson=value=>JSON.stringify(value).replaceAll('<','\\u003c');
