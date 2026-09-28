import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const esc=value=>String(value).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
// Optional editorial suggestions. The page chooses relevance, not a global upsell.
export function renderRelatedJournal(reading){
 if(!reading)return '';
 if(!reading.title||!reading.description||!Array.isArray(reading.links)||!reading.links.length)throw Error('Incomplete related journal entry');
 const links=reading.links.map(link=>{
  if(!/^[a-z0-9-]+$/.test(link.slug)||!link.label||!existsSync(resolve(root,`blog/${link.slug}/index.html`)))throw Error('Related journal must point to an existing article');
  return `<li><a href="/blog/${link.slug}/">${esc(link.label)} →</a></li>`;
 }).join('');
 return `<aside class="bkk-tip site-reading-note" aria-label="延伸選物筆記"><p><strong>延伸選物筆記</strong></p><h3>${esc(reading.title)}</h3><p>${esc(reading.description)}</p><ul>${links}</ul></aside>`;
}
