// Shared NZ-family country and city entry. Only trusted parent-rendered photo
// markup is accepted; every public field and action attribute is escaped.
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function action(a,primary){
 if(!/^(\/trip\/|#[a-z0-9-]+$)/.test(a.href)||/[<>"'\s\\]/.test(a.href))throw Error('Unsafe travel entry target');
 const attributes=Object.entries(a.data||{}).map(([k,v])=>{if(!/^data-[a-z-]+$/.test(k))throw Error('Unsafe entry attribute');return ` ${k}="${esc(v)}"`;}).join('');
 return `<a class="home-panel-${primary?'primary':'secondary'} travel-entry-${primary?'primary':'secondary'}" href="${esc(a.href)}"${attributes}>${esc(a.label)}<span aria-hidden="true">${primary?'↗':'↓'}</span></a>`;
}
export function renderTravelEntryActions(primary,secondary,{className='home-panel-actions'}={}){
 if(!/^[a-z -]+$/.test(className))throw Error('Unsafe entry class');
 return `<div class="${className} travel-entry-actions">${action(primary,true)}${action(secondary,false)}</div>`;
}
export function renderCountryEntry(country,{photoHtml,regionLabel,hidden=false}={}){
 if(typeof photoHtml!=='string'||!photoHtml.includes('<img '))throw Error('Parent-rendered country photo required');
 return `<article${hidden?' hidden':''} class="home-country-panel travel-country-entry" data-country-panel="${esc(country.id)}" aria-labelledby="country-title-${esc(country.id)}"><figure class="home-panel-photo">${photoHtml}</figure><div class="home-panel-copy"><p class="home-eyebrow">${esc(regionLabel||country.regionLabel||'旅行目的地')} · ${country.guideIds.length} 份指南</p><h3 id="country-title-${esc(country.id)}">${esc(country.name)}</h3><p>${esc(country.summary)}</p>${renderTravelEntryActions({href:country.href,label:'走進'+country.name},{href:'#guides',label:'找這裡的玩法 ',data:{'data-explore-country':country.id}})}</div></article>`;
}
