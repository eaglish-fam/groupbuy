import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve, sep } from 'node:path';

export const COVER_IDENTITY_SINCE = '2026-09-14';
const compact = (value) => String(value || '').replace(/<[^>]*>/g, '').replace(/\s+/g, '');
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

// A checksum binds the visual review to the delivered pixels; it is not OCR.
// Existing untouched articles are grandfathered. New/revised articles need review.
export function validateBlogCover({ root, datePublished, dateModified, entry, html, indexCard, productEntry }) {
  if (!entry && [datePublished, dateModified].every((date) => date && date < COVER_IDENTITY_SINCE)) return [];
  const failures = [];
  const check = (id, passed) => { if (!passed) failures.push(id); };
  if (!entry) return ['cover-identity:missing-review'];
  const identity = compact(entry.identity);
  check('cover-identity:name', identity.length >= 2);
  const h1 = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1];
  check('cover-identity:article-title', identity && compact(h1).includes(identity));
  check('cover-identity:index-title', identity && compact(indexCard?.match(/<h3\b[^>]*>([\s\S]*?)<\/h3>/i)?.[1]).includes(identity));
  check('cover-identity:shared-title', identity && compact(productEntry?.match(/title:'([^']+)'/)?.[1]).includes(identity));
  const image = entry.image;
  const validImage = typeof image === 'string' && image.startsWith('/assets/') && !image.includes('..');
  check('cover-identity:image-path', validImage);
  if (validImage) {
    check('cover-identity:article-image', (html.match(/<img\b[^>]*>/gi) || []).some((tag) => tag.includes(`src="${image}"`)));
    check('cover-identity:sharing-image', ['og:image', 'twitter:image'].every((name) =>
      (html.match(/<meta\b[^>]*>/gi) || []).some((tag) => tag.includes(`"${name}"`) && tag.includes(`"https://www.eaglish.store${image}"`))));
    check('cover-identity:index-image', indexCard?.includes(`src="${image}"`));
    check('cover-identity:shared-image', productEntry?.includes(`image:'${image}'`));
  }
  const read = (path) => {
    if (typeof path !== 'string') throw Error('Missing asset path');
    const absolute = resolve(root, path.replace(/^\//, ''));
    if (!absolute.startsWith(resolve(root) + sep)) throw Error('Asset outside repository');
    return readFileSync(absolute);
  };
  try {
    check('cover-identity:render-checksum', validImage && sha256(read(image)) === entry.imageSha256);
    const source = read(entry.source);
    check('cover-identity:source-checksum', sha256(source) === entry.sourceSha256);
    if (entry.source.endsWith('.html')) {
      const headline = source.toString().match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1];
      check('cover-identity:source-headline', identity && compact(headline).includes(identity));
    }
  } catch { failures.push('cover-identity:asset-unreadable'); }
  check('cover-identity:pixel-review', entry.review?.identityVisible === true && entry.review?.realPhotoPreserved === true
    && entry.review?.imageSha256 === entry.imageSha256
    && [320, 390, 768, 1440].every((width) => entry.review?.viewportWidths?.includes(width))
    && entry.review?.mobileCardLegible === true);
  return failures;
}
