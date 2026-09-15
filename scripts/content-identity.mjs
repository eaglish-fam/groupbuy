const modes=new Set(['product','problem','comparison','scenario','explainer','use_care','longitudinal','budget_offer']);
export function articleIdentity(slug,product,metadata) {
  if(!metadata) {
    if(!product) throw Error(`Article ${slug} needs reviewed mode/intent/productNames in config/content-articles.json`);
    return {productNames:product.brands,productId:product.id,mode:'product',intent:`product:${slug}`};
  }
  if(!modes.has(metadata.mode)||typeof metadata.intent!=='string'||!metadata.intent.trim()||metadata.intent.length>180||!Array.isArray(metadata.productNames)||metadata.productNames.length>20||!metadata.productNames.every(s=>typeof s==='string'&&s.trim()&&s.length<=300)) throw Error(`Invalid reviewed content identity: ${slug}`);
  return {mode:metadata.mode,intent:metadata.intent.trim(),productNames:metadata.productNames,productId:product?.id||null};
}
