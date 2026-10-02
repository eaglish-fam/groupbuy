import {eligibleCountryIds} from './atlas-model.mjs';

// Same area/country eligibility as guides; theme/search are not booking-country filters.
// Reversible visibility only: keep every original guide/affiliate URL and node.
export function syncPlanningOffers(root,state,catalog){
 const eligible=new Set(eligibleCountryIds(state,catalog));
 const offers=[...root.querySelectorAll('[data-offer-country]')];
 for(const offer of offers)offer.hidden=!eligible.has(offer.dataset.offerCountry);
 const empty=root.querySelector('[data-commerce-empty]');
 if(empty)empty.hidden=offers.some(offer=>!offer.hidden&&offer.dataset.planningOnly!=='true');
 return [...eligible];
}
