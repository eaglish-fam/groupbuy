// Pure consumer rendering: no storage, network, media acquisition or planning mutation.
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const link=(label,url)=>`<a href="${escape(url)}" rel="noopener noreferrer">${escape(label)} ↗</a>`;
export const renderPlaceSummary=p=>p.whatToExpect?`<p class="place-summary">${escape(p.whatToExpect)}</p>`:'';
export function renderConsumerDetail(p){
 const facts=p.detail?.planningFacts??(p.address?[{label:'地址',value:p.address}]:[]);
 const visits=[...(p.visitLinks??[])];
 if(p.articleUrl&&!visits.some(v=>v.url===p.articleUrl))visits.unshift({label:'閱讀完整文章',url:p.articleUrl});
 const uniqueVisits=[...new Map(visits.map(v=>[v.url,v])).values()];
 return `${p.detail?.paragraphs.map(t=>`<p class="place-detail-copy">${escape(t)}</p>`).join('')??''}<section><h3>位置與行程資訊</h3>${facts.length?`<dl class="place-planning-facts">${facts.map(f=>`<div><dt>${escape(f.label)}</dt><dd>${escape(f.value)}</dd></div>`).join('')}</dl>`:''}<div class="detail-links">${link('Google Maps 查看位置',p.maps.search)}${link('Google Maps 路線',p.maps.directions)}${p.officialUrl?link('官方資訊',p.officialUrl):''}</div></section><section><h3>我們的實訪紀錄</h3>${uniqueVisits.map(v=>`<p>${link(v.label,v.url)}</p>`).join('')}</section>`;
}
export function selectRegionalFilms(state,data){
 if(state.top!=='taiwan')return [];
 const films=data.regionalFilms??[];
 if(state.countyId)return films.filter(f=>f.countyIds.includes(state.countyId));
 if(!state.regionId)return films;
 return films.filter(f=>f.countyIds.some(id=>data.geography.counties.find(c=>c.id===id)?.regionId===state.regionId));
}
export function renderRegionalFilms(films){
 return films.map(f=>`<article class="regional-film" data-film-id="${escape(f.videoId)}"><h3>${escape(f.title)}</h3><p>${escape(f.introduction)}</p><p class="film-full-link">${link(f.fullLinkLabel,f.fullUrl)}</p><details><summary>看旅行章節（${f.chapters.length}）</summary><ol>${f.chapters.map(c=>`<li class="film-chapter">${link(c.label,c.url)}<p>${escape(c.description)}</p>${c.planningNotice?`<p class="film-notice">${escape(c.planningNotice.text)} ${link('查看官方公告',c.planningNotice.sourceUrl)}</p>`:''}</li>`).join('')}</ol></details></article>`).join('');
}
