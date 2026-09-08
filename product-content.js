/* Shared article/video contract. No Sheet writes, publishing or message sending. */
(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.ProductContent=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const catalog={
    atojet:{id:'atojet-home-shower',brands:['Atojet 濾芯蓮蓬頭'],article:'/blog/atojet/',title:'洗澡的水，看起來很乾淨。直到我們拆開了濾芯。',excerpt:'一段真實的換芯紀錄，一點關於浴室日常用水的留意。',category:'居家生活',image:'/assets/atojet/vendor-shower.webp'},
    wave:{id:'wave-hummus',brands:['Wave 鷹嘴豆泥'],article:'/blog/wave-hummus/',title:'吐司吃膩了，也許不是吐司的問題。',excerpt:'一盒鷹嘴豆泥，從抹、沾到拌，替普通的一餐換一種心情。',category:'餐桌日常',image:'/assets/wave/family.webp'},
    artisanCb301:{id:'artisan-cb301',brands:['ARTISAN浴室清潔＆小腿按摩器'],article:'/blog/artisan-cb301/',title:'浴室真正難刷的，通常不是最髒的那一塊。',excerpt:'高處、角落和總要彎下腰的地方，才是讓人一拖再拖的原因。',category:'居家清潔',image:'/assets/artisan-cb301/cover.webp'}
  };
  const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function safeUrl(value){try{const u=new URL(String(value).trim());return ['https:','http:'].includes(u.protocol)&&!u.username&&!u.password?u.href:'';}catch{return '';}}
  function videoId(url){try{const u=new URL(url);if(u.hostname==='youtu.be')return /^[\w-]{11}$/.test(u.pathname.slice(1))?u.pathname.slice(1):'';if(['youtube.com','www.youtube.com','m.youtube.com','www.youtube-nocookie.com'].includes(u.hostname)){const id=u.searchParams.get('v')||u.pathname.split('/')[2]||'';return /^[\w-]{11}$/.test(id)?id:'';}}catch{}return '';}
  function videos(input){
    let list=input;if(typeof list==='string'){try{list=JSON.parse(list);}catch{list=list.split(/\r?\n/);}}if(!Array.isArray(list))list=list?[list]:[];
    const seen=new Set();return list.flatMap((v)=>{if(typeof v==='string'){const i=v.indexOf('|');v=i<0?{url:v}:{title:v.slice(0,i).trim(),url:v.slice(i+1).trim()};}if(!v||typeof v!=='object')return [];const url=safeUrl(v.url),id=videoId(url),key=id||url;if(!url||seen.has(key))return [];seen.add(key);return [{url,title:String(v.title||`影片 ${seen.size}`),type:String(v.type||'其他'),youtubeId:id}];});
  }
  function fromRow(row){return videos([...(videos(row['影片清單']||row['Videos']||'')),...(videos(row['影片網址']||row.Video||row.VideoURL||''))]);}
  function sheetRows(data){const headers=(data[0]||[]).map(x=>String(x).trim());for(const h of ['品牌','連結','類型','開團日期','結束日期'])if(headers.filter(x=>x===h).length!==1)throw Error('Unexpected Sheet headers');return data.slice(1).map(row=>Object.fromEntries(headers.flatMap((h,i)=>h?[[h,row[i]||'']]:[])));}
  function entry(brand){return Object.values(catalog).find(x=>x.brands.some(b=>b.toLowerCase()===String(brand).trim().toLowerCase()));}
  function readingLinks(g){const own=entry(g.brand);if(own)return [{title:'閱讀文章',url:own.article}];const used=new Set();return [{title:'原始網誌',url:g.blogUrl},{title:'商品介紹',url:g.googleDoc}].filter(x=>{x.url=safeUrl(x.url);if(!x.url||used.has(x.url))return false;used.add(x.url);return true;});}
  function readingButton(g){const links=readingLinks(g);if(!links.length)return '';if(entry(g.brand))return `<div class="mb-3"><a class="card-secondary-btn" href="${escape(links[0].url)}">閱讀文章</a></div>`;return `<div class="mb-3"><button class="card-secondary-btn" data-reading-brand="${escape(g.brand)}">閱讀文章</button></div>`;}
  function videoButton(g){const list=videos(g.videos||g.video);return list.length?`<div class="mb-3"><button class="card-secondary-btn" data-video-brand="${escape(g.brand)}">觀看影片${list.length>1?`（${list.length}）`:''}</button></div>`:'';}
  function today(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
  function date(value){const m=String(value||'').trim().match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);if(!m)return '';const s=`${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`;const d=new Date(s+'T00:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===s?s:'';}
  function campaignFor(rows,key,now=today()){
    const item=catalog[key];
    if(!item)return {state:'unavailable',label:'目前無法確認團購狀態'};
    const matches=rows.filter(r=>entry(r['品牌']||'')?.id===item.id);
    if(matches.length!==1)return {state:'unavailable',label:'目前無法確認團購狀態'};
    const r=matches[0],type=String(r['類型']||''),start=date(r['開團日期']),end=date(r['結束日期']),url=safeUrl(r['連結']);
    if(/結團|已結束|closed|ended/i.test(type))return {state:'closed',label:'本次團購已結束'};
    if((r['開團日期']&&!start)||(r['結束日期']&&!end)||(!end&&!/長期|long/i.test(type)))return {state:'unavailable',label:'檔期待確認'};
    if(start&&end&&start>end)return {state:'unavailable',label:'檔期待確認'};
    if(end&&now>end)return {state:'closed',label:'本次團購已結束'};
    if(start&&now<start)return {state:'upcoming',label:'尚未開團'};
    if(!url)return {state:'unavailable',label:'購買連結待確認'};
    if(String(r['庫存狀態']||'')==='售完')return {state:'closed',label:'目前已售完'};
    return {state:'open',label:'查看當期組合與優惠',url,videos:fromRow(r),end};
  }
  function campaign(rows,now=today()){return campaignFor(rows,'atojet',now);}
  function dialog(title){const d=document.createElement('dialog');d.className='content-dialog';d.setAttribute('aria-label',title);const head=document.createElement('header'),h=document.createElement('h2'),close=document.createElement('button');h.textContent=title;close.textContent='關閉 ×';close.setAttribute('aria-label','關閉視窗');close.onclick=()=>d.close();head.append(h,close);d.append(head);const previous=document.activeElement;d.addEventListener('close',()=>{d.remove();previous?.focus();});d.addEventListener('click',e=>{if(e.target===d){const b=d.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)d.close();}});document.body.append(d);return d;}
  function mountVideos(container,input){const list=videos(input);if(!list.length){container.textContent='尚未提供影片';return;}const nav=document.createElement('div'),panel=document.createElement('div');nav.className='video-choices';nav.setAttribute('aria-label','選擇影片');panel.className='video-panel';const select=(v,i)=>{panel.replaceChildren();[...nav.children].forEach((b,j)=>b.setAttribute('aria-pressed',String(j===i)));const a=document.createElement('a');a.href=v.url;a.target='_blank';a.rel='noopener noreferrer';a.textContent='在原平台觀看 ↗';if(v.youtubeId){const frame=document.createElement('iframe');frame.src=`https://www.youtube-nocookie.com/embed/${v.youtubeId}`;frame.title=v.title;frame.allowFullscreen=true;frame.referrerPolicy='strict-origin-when-cross-origin';panel.append(frame);}else{const p=document.createElement('p');p.textContent='此影片請在原平台觀看。';panel.append(p);}panel.append(a);};list.forEach((v,i)=>{const b=document.createElement('button');b.textContent=v.title;b.type='button';b.onclick=()=>select(v,i);nav.append(b);});container.append(nav,panel);select(list[0],0);}
  function install(getGroups){document.addEventListener('click',e=>{const v=e.target.closest('[data-video-brand]'),r=e.target.closest('[data-reading-brand]');if(!v&&!r)return;const g=getGroups().find(g=>g.brand===(v?.dataset.videoBrand||r?.dataset.readingBrand));if(!g)return;e.preventDefault();e.stopPropagation();const d=dialog(v?'觀看影片':'閱讀文章');if(v)mountVideos(d,g.videos||g.video);else{const p=document.createElement('p');p.textContent='選擇閱讀內容（尚未整合的舊文保留原始入口）';d.append(p);for(const x of readingLinks(g)){const a=document.createElement('a');a.href=x.url;a.target='_blank';a.rel='noopener noreferrer';a.textContent=x.title;d.append(a);}}d.showModal();});}
  return {catalog,escape,safeUrl,videoId,videos,fromRow,sheetRows,entry,readingLinks,readingButton,videoButton,date,campaign,campaignFor,today,mountVideos,install};
});
