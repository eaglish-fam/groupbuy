import {travelHomeCatalog} from '../trip/home-catalog.mjs';
import {validateTravelHomeCatalog,renderTravelPhoto} from './build-trip-home.mjs';

const esc=value=>String(value).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll("'",'&#39;').replaceAll('<','&lt;').replaceAll('>','&gt;');

// This is a small editorial entry, not a second destination directory.
// It shares published country records with /trip/ and never invents destinations.
export function renderHomepageTravelEntry(catalog=travelHomeCatalog){
 validateTravelHomeCatalog(catalog);
 const featured=catalog.countries.slice(0,2);
 return `<section class="travel-entry wrap" id="travel-entry" aria-labelledby="travel-entry-title">
  <div class="travel-entry-copy">
   <p class="eyebrow">鷹家遠行所 · 旅行指南</p>
   <h2 id="travel-entry-title">下一趟，<br>想一起去哪裡？</h2>
   <p>把一家人走過的風景，整理成你的下一站。<br>從實訪照片找靈感，再看景點、交通與行程。</p>
   <a class="button primary" href="/trip/">探索所有目的地 <span aria-hidden="true">→</span></a>
  </div>
  <div class="travel-entry-places">${featured.map(country=>`<a class="travel-entry-place" href="${esc(country.href)}">
   <div class="travel-entry-photo">${renderTravelPhoto(country.image,'(max-width: 700px) calc((100vw - 52px) / 2), (max-width: 1000px) calc((100vw - 100px) / 2), 350px')}</div>
   <div class="travel-entry-caption"><span>${esc(country.englishName.toUpperCase())}</span><h3>${esc(country.name)} <span aria-hidden="true">→</span></h3><p>${country.guideIds.length} 份城市・區域指南</p></div>
  </a>`).join('')}</div>
 </section>`;
}
