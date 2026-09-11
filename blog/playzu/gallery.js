// Progressive enhancement: without JavaScript the image links still work.
document.addEventListener('click',event=>{
 const a=event.target.closest('a[data-pattern]');if(!a)return;
 event.preventDefault();const previous=document.activeElement,d=document.createElement('dialog');d.className='pattern-viewer';d.setAttribute('aria-label',a.dataset.pattern);
 const h=document.createElement('header'),title=document.createElement('h2'),close=document.createElement('button'),img=document.createElement('img');title.textContent=a.dataset.pattern;close.type='button';close.textContent='×';close.setAttribute('aria-label','關閉花色大圖');close.onclick=()=>d.close();img.src=a.href;img.alt=a.querySelector('img').alt;h.append(title,close);d.append(h,img);document.body.append(d);d.addEventListener('close',()=>{d.remove();previous?.focus()});d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close()}});d.showModal();
});
