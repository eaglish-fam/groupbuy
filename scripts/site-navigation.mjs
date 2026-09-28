// Server-rendered links remain usable without JavaScript on every public page.
export function siteSection(pathname){
 const path=String(pathname||'/').split(/[?#]/)[0];
 if(path==='/trip'||path.startsWith('/trip/'))return 'travel';
 if(['/blog','/guides','/how-we-select'].some(prefix=>path===prefix||path.startsWith(prefix+'/')))return 'journal';
 return 'store';
}
export function renderSiteNavigation(pathname){
 const current=siteSection(pathname);
 const sites=[['store','/','鷹家買物社','生活選物'],['journal','/blog/','鷹家選物誌','選購筆記'],['travel','/trip/','鷹家遠行所','旅行指南']];
 return `<!-- site-navigation:start --><nav class="site-switcher" aria-label="鷹式一家網站導覽"><div class="site-switcher-inner">${sites.map(([id,href,name,note])=>`<a href="${href}" data-site-section="${id}"${id===current?' aria-current="location"':''}><span>${name}</span><small>${note}</small></a>`).join('')}</div></nav><aside class="site-travel-return" data-travel-return hidden aria-label="返回旅行閱讀"><div class="site-travel-return-inner"><a href="/trip/" data-travel-return-link><span class="site-return-arrow" aria-hidden="true">←</span><span><strong>回到旅行</strong><span data-travel-return-title></span></span></a><button type="button" data-travel-return-dismiss aria-label="關閉返回旅行提示">×</button></div></aside><!-- site-navigation:end -->`;
}
