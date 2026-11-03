// Validates groupbuy.product/v2 JSON files (GB-022) and answers "may this product be indexed / show a price today?".
//
// Usage: node scripts/validate-product-json.mjs <file-or-directory>...   (exit 1 on any problem)
//
// The structural rules live in scripts/schemas/product.v2.schema.json and are applied by the tiny checker below
// (type, enum, pattern, required, additionalProperties, items, min/max): no new dependency. The cross-field rules
// in `rules()` are the ones that came from real cases (see fleets/groupbuy/memory/lessons/L-001 in Kingdom).
import {readFileSync,readdirSync,statSync} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';

const here=dirname(fileURLToPath(import.meta.url));
export const schema=JSON.parse(readFileSync(resolve(here,'schemas/product.v2.schema.json'),'utf8'));

const typeOf=v=>v===null?'null':Array.isArray(v)?'array':Number.isInteger(v)?'integer':typeof v;
const typeOk=(v,t)=>{const ts=[].concat(t),k=typeOf(v);return ts.includes(k)||(k==='integer'&&ts.includes('number'));};

export function check(value,sch,path='$',out=[]){
 if('enum' in sch&&!sch.enum.some(e=>e===value)){out.push(`${path}: must be one of ${JSON.stringify(sch.enum)}`);return out;}
 if(sch.type&&!typeOk(value,sch.type)){out.push(`${path}: expected ${[].concat(sch.type).join('|')}, got ${typeOf(value)}`);return out;}
 if(typeof value==='string'){
  if(sch.pattern&&!new RegExp(sch.pattern).test(value))out.push(`${path}: does not match ${sch.pattern}`);
  if(sch.minLength!==undefined&&value.length<sch.minLength)out.push(`${path}: too short`);
  if(sch.maxLength!==undefined&&value.length>sch.maxLength)out.push(`${path}: too long`);
 }
 if(typeof value==='number'&&sch.minimum!==undefined&&value<sch.minimum)out.push(`${path}: below ${sch.minimum}`);
 if(Array.isArray(value)&&sch.items)value.forEach((v,i)=>check(v,sch.items,`${path}[${i}]`,out));
 if(value&&typeof value==='object'&&!Array.isArray(value)){
  for(const k of sch.required||[])if(!(k in value))out.push(`${path}.${k}: required`);
  for(const [k,v] of Object.entries(value)){
   const sub=sch.properties?.[k];
   if(sub)check(v,sub,`${path}.${k}`,out);
   else if(sch.additionalProperties===false&&!k.startsWith('_'))out.push(`${path}.${k}: not allowed`);
  }
 }
 return out;
}

const FORBIDDEN_KEY=/^(cost|costs|commission|margin|rebate|affiliate_rate|分潤|成本|佣金)$/i;
const deepKeys=(v,out=[])=>{if(Array.isArray(v))v.forEach(x=>deepKeys(x,out));else if(v&&typeof v==='object')for(const [k,x] of Object.entries(v)){out.push(k);deepKeys(x,out);}return out;};
const has=v=>v!==null&&v!==undefined&&v!==''&&!(Array.isArray(v)&&!v.length);

export function rules(p){
 const e=[];
 for(const k of deepKeys(p))if(FORBIDDEN_KEY.test(k))e.push(`field "${k}" must not exist (cost and commission never go in this repo)`);
 const r=p.round||{};
 if(p.offer_type==='standing'&&r.end!==null)e.push('standing offer: round.end must be null');
 if(p.offer_type==='limited'&&!r.end)e.push('limited offer: round.end is required');
 if(r.link_rotates&&!r.current_link_end)e.push('link_rotates is set: round.current_link_end is required');
 if(r.start&&r.end&&r.start>r.end)e.push('round.start is after round.end');
 const topPrice=p.price!==null&&p.price!==undefined;
 const variantPrices=(p.variants||[]).some(v=>v.price!==null&&v.price!==undefined);
 const prices=topPrice||variantPrices;
 if(p.status==='unconfirmed'&&(prices||(p.variants||[]).length))e.push('unconfirmed product must not carry prices or variants');
 if(prices&&!p.price_checked_at)e.push('a price needs price_checked_at');
 if(prices&&!p.price_scope)e.push('a price needs price_scope');
 const fs=p.facts_source||{};
 // Prices on the product itself are sourced under facts_source.price; prices on variants under facts_source.variants.
 if(topPrice&&!has(fs.price))e.push('a product price needs facts_source.price');
 if(variantPrices&&!has(fs.variants)&&!has(fs.price))e.push('variant prices need facts_source.variants');
 if(has(p.specs)&&!has(fs.specs))e.push('specs need facts_source.specs');
 if(has(p.age)&&!has(fs.age))e.push('age needs facts_source.age');
 const slugs=(p.variants||[]).map(v=>v.variant_slug);
 if(new Set(slugs).size!==slugs.length)e.push('variant_slug must be unique');
 return e;
}

export function validate(p){return [...check(p,schema),...rules(p)];}

// May the product page be indexed, and may its price be shown, on `today` (YYYY-MM-DD, Taipei date)?
// A standing offer whose current link has run out keeps its page but hides the price (GB-022, L-001).
export function visibility(p,today){
 const r=p.round||{};
 const active=p.status==='active';
 const indexable=active&&(p.offer_type==='standing'||(!!r.end&&r.end>=today));
 const linkExpired=!!r.current_link_end&&r.current_link_end<today;
 return {indexable,showPrice:indexable&&!linkExpired&&has(p.price_checked_at),linkExpired};
}

function files(arg){
 const s=statSync(arg);
 if(s.isFile())return [arg];
 return readdirSync(arg).flatMap(n=>n.startsWith('_')?[]:files(join(arg,n))).filter(f=>f.endsWith('.json'));
}
if(import.meta.url===`file://${process.argv[1]}`){
 const args=process.argv.slice(2);
 if(!args.length){console.error('usage: node scripts/validate-product-json.mjs <file-or-directory>...');process.exit(2);}
 let bad=0,n=0;
 for(const f of args.flatMap(files)){
  n++;
  let p;try{p=JSON.parse(readFileSync(f,'utf8'));}catch(err){console.log(`FAIL ${f}\n  invalid JSON: ${err.message}`);bad++;continue;}
  const errs=validate(p);
  if(errs.length){bad++;console.log(`FAIL ${f}\n`+errs.map(x=>'  '+x).join('\n'));}else console.log(`ok   ${f}`);
 }
 console.log(`${n-bad}/${n} files valid`);
 process.exit(bad?1:0);
}
