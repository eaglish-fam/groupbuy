const modes=new Set(['product','problem','comparison','scenario','explainer','use_care','longitudinal','budget_offer']);
const slugPattern=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const validDate=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value+'T00:00:00Z'))&&new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value;
const text=(value,max)=>typeof value==='string'&&value.trim().length>0&&value.length<=max;

export function isKnowledgeArticle(identity) {
  return identity?.productId===null&&identity.mode==='explainer'&&['not_published','published'].includes(identity.publicationState);
}

export function articleIdentity(slug,product,metadata) {
  if(!metadata) {
    if(!product) throw Error(`Article ${slug} needs reviewed mode/intent/productNames in config/content-articles.json`);
    return {productNames:product.brands,productId:product.id,mode:'product',intent:`product:${slug}`};
  }
  const invalid=()=>{throw Error(`Invalid reviewed content identity: ${slug}`);};
  if(!modes.has(metadata.mode)||!text(metadata.intent,180)||!Array.isArray(metadata.productNames)||metadata.productNames.length>20||!metadata.productNames.every(s=>text(s,300))) invalid();
  if(!product&&(metadata.mode==='product'||metadata.productId!=null)) invalid();
  const identity={mode:metadata.mode,intent:metadata.intent.trim(),productNames:metadata.productNames,productId:product?.id||null};
  // Only an explicit reviewed explainer descriptor gets the knowledge lifecycle.
  // Existing product identities and other reviewed modes keep their old contract.
  if(!product&&metadata.mode==='explainer') {
    if(!slugPattern.test(slug)||!text(metadata.title,180)||!text(metadata.description,500)||!text(metadata.alt,500)
      ||typeof metadata.image!=='string'||!/^\/assets\/[a-zA-Z0-9/_-]+\.(?:webp|png|jpe?g)$/.test(metadata.image)
      ||!slugPattern.test(metadata.cluster||'')||!Array.isArray(metadata.relatedArticles)||metadata.relatedArticles.length>20
      ||!metadata.relatedArticles.every(s=>typeof s==='string'&&slugPattern.test(s)&&s!==slug)
      ||!validDate(metadata.datePrepared)||!['not_published','published'].includes(metadata.publicationState)) invalid();
    if(metadata.publicationState==='not_published') {
      if(metadata.datePublished!=null||metadata.dateModified!=null) invalid();
    } else if(!validDate(metadata.datePublished)||!validDate(metadata.dateModified)
      ||metadata.datePublished<metadata.datePrepared||metadata.dateModified<metadata.datePublished) invalid();
    Object.assign(identity,{title:metadata.title.trim(),description:metadata.description.trim(),image:metadata.image,alt:metadata.alt.trim(),
      cluster:metadata.cluster,relatedArticles:[...new Set(metadata.relatedArticles)],publicationState:metadata.publicationState,datePrepared:metadata.datePrepared});
    if(metadata.publicationState==='published') Object.assign(identity,{datePublished:metadata.datePublished,dateModified:metadata.dateModified});
  }
  return identity;
}

export function articlePublication(identity,schema) {
  if(!isKnowledgeArticle(identity)) return {published:schema?.datePublished,modified:schema?.dateModified};
  if(identity.publicationState==='not_published') {
    if(schema?.datePublished!=null||schema?.dateModified!=null) throw Error('Unpublished knowledge article cannot claim publication or modification dates');
    return {publicationState:'not_published',prepared:identity.datePrepared};
  }
  if(schema?.datePublished!==identity.datePublished||schema?.dateModified!==identity.dateModified) throw Error('Knowledge publication dates must match reviewed metadata');
  return {publicationState:'published',prepared:identity.datePrepared,published:identity.datePublished,modified:identity.dateModified};
}
