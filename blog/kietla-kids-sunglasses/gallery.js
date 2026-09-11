// Real-image links remain usable without scripting.
document.addEventListener('click',event=>{
 const link=event.target.closest('a[data-photo]');if(!link||event.ctrlKey||event.metaKey||event.shiftKey)return;
 event.preventDefault();const previous=document.activeElement,dialog=document.createElement('dialog');dialog.className='photo-viewer';dialog.setAttribute('aria-label',link.dataset.photo);
 const header=document.createElement('header'),heading=document.createElement('h2'),close=document.createElement('button'),img=document.createElement('img');
 heading.textContent=link.dataset.photo;close.type='button';close.textContent='×';close.setAttribute('aria-label','關閉大圖');close.onclick=()=>dialog.close();img.src=link.href;img.alt=link.querySelector('img').alt;
 header.append(heading,close);dialog.append(header,img);document.body.append(dialog);dialog.addEventListener('close',()=>{dialog.remove();previous?.focus()});dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()});dialog.showModal();
});
