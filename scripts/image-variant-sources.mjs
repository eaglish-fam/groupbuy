// Records which source bytes each committed responsive variant was made from, so a variant is
// re-encoded only when its source changed in place, not because checkout mtimes look stale or
// because sharp output differs by platform. A variant with no record, or whose bytes no longer
// match its record (regenerated deliberately, e.g. by an article asset script), is adopted as is.
import {createHash} from 'node:crypto';
import {existsSync, readFileSync, writeFileSync} from 'node:fs';

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

export function openVariantSources(file) {
  const records = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {};
  const before = JSON.stringify(records);
  return {
    needsEncode(key, sourceBytes, variantBytes) {
      if (!variantBytes) return true;
      const source = sha256(sourceBytes), variant = sha256(variantBytes), seen = records[key];
      if (seen?.variant === variant) return seen.source !== source;
      records[key] = {source, variant};
      return false;
    },
    record(key, sourceBytes, variantBytes) {
      records[key] = {source: sha256(sourceBytes), variant: sha256(variantBytes)};
    },
    save() {
      const sorted = Object.fromEntries(Object.keys(records).sort().map(key => [key, records[key]]));
      if (JSON.stringify(sorted) !== before) writeFileSync(file, `${JSON.stringify(sorted, null, 2)}\n`);
    },
  };
}
