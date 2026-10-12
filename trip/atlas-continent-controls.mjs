import {continentLevels,continentForState,continentCountries} from './atlas-model.mjs';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// One compact five-button row and one in-flow disclosure, never five panels.
export function renderContinentControls(state,catalog){
 const selected=continentForState(state)?.[0];
 const buttons=continentLevels.map(([id,name])=>`<button type="button" id="continent-${id}" data-action="continent" data-id="${id}" aria-expanded="${selected===id}" aria-controls="continent-countries-${id}">${name}</button>`).join('');
 const panels=continentLevels.map(([id,name])=>{const countries=continentCountries(id,catalog);return `<div id="continent-countries-${id}" class="continent-country-list" role="group" aria-labelledby="continent-${id}" ${selected===id?'':'hidden'}>${countries.length?countries.map(c=>`<button type="button" data-action="country" data-id="${esc(c.id)}" aria-pressed="${c.id===state.countryId}">${esc(c.name)}</button>`).join(''):`<p class="continent-empty">目前尚無${name}指南，可查看其他大洲。</p>`}</div>`;}).join('');
 return `<div class="continent-switches">${buttons}</div>${panels}`;
}
