// A failed lazy request must not leave a valid approved photo broken forever.
// Retry the same local asset once, never another host/file or an unlimited loop.
export function installPhotoRetry(images,pageUrl){
 const retried=new WeakSet(),origin=new URL(pageUrl).origin;
 for(const img of images){
  const retry=()=>{
   if(retried.has(img))return;
   const url=new URL(img.currentSrc||img.src,pageUrl);
   if(url.origin!==origin||! /\/trip\/assets\/singapore\/[A-Za-z0-9_-]+\.webp$/.test(url.pathname))return;
   retried.add(img);url.searchParams.set('sg-image-retry','1');
   img.dataset.imageRetry='1';img.removeAttribute('srcset');img.src=url.href;
  };
  img.addEventListener('error',retry);
  if(img.complete&&!img.naturalWidth)retry();
 }
}
