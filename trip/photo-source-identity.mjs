// Production accepts only canonical same-origin photos; no preview namespace.
export function canonicalTripPhoto(source,base){
 try{
  const context=new URL(base),url=new URL(source,context);
  if(url.origin!==context.origin||url.search||url.hash)return null;
  const pathname=url.pathname;
  return /^\/trip\/assets\/(?:[a-zA-Z0-9_-]+|taiwan-place-cards-r24\/place-tw-[a-z0-9-]+-[a-f0-9]{12})\.webp$/.test(pathname)?pathname:null;
 }catch{return null;}
}
