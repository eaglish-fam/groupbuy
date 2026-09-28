// Server-rendered links remain usable without JavaScript on every public page.
export function siteSection(pathname){
 const path=String(pathname||'/').split(/[?#]/)[0];
 if(path==='/trip'||path.startsWith('/trip/'))return 'travel';
 if(['/blog','/guides','/how-we-select'].some(prefix=>path===prefix||path.startsWith(prefix+'/')))return 'journal';
 return 'store';
}
export function renderSiteNavigation(pathname){
 const current=siteSection(pathname);
 const sites=[['store','/','買物社','鷹家買物社'],['journal','/blog/','選物誌','鷹家選物誌'],['travel','/trip/','遠行所','鷹家遠行所']];
 return `<!-- site-navigation:start --><nav class="site-switcher" aria-label="鷹式一家三站導覽"><div class="site-switcher-inner">${sites.map(([id,href,label,name])=>`<a href="${href}" data-site-section="${id}" aria-label="${name}"${id===current?' aria-current="location"':''}>${label}</a>`).join('')}</div></nav><!-- site-navigation:end -->`;
}
