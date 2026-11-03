import test from 'node:test';
import assert from 'node:assert/strict';
import {validate,visibility,check,schema} from '../scripts/validate-product-json.mjs';

// Synthetic products only: real samples live in Kingdom and are checked with the CLI.
const standing=(extra={})=>({
 schema:'groupbuy.product/v2-draft',slug:'sample-juice',brand_slug:'sample-brand',name:'Sample juice',
 status:'active',offer_type:'standing',
 round:{round_url:'https://example.com/r',start:'2026-10-01',end:null,link_rotates:'monthly',current_link_end:'2026-10-31'},
 article:'/blog/sample-brand/',
 variants:[{variant_slug:'6-pack',name:'6 pack',price:100,list_price:150},{variant_slug:'12-pack',name:'12 pack',price:190,list_price:300}],
 price_scope:'group price (October round)',price_checked_at:'2026-10-30',
 specs:[{name:'volume',value:'980',unit:'ml'}],age:null,faq:[{q:'Q',a:'A',source:'https://example.com/faq'}],
 facts_source:{variants:'https://example.com/r',specs:'https://example.com/r'},
 storage_usage:null,shipping:null,contents:null,notes:[],
 images:[{url:'https://example.com/a.jpg',alt:'a bottle',rights:'vendor image, permission unconfirmed',source:'example.com'}],
 disclosure:null,fetched_at:'2026-10-30',...extra});
const limitedUnconfirmed=(extra={})=>({
 schema:'groupbuy.product/v2-draft',slug:'sample-game',brand_slug:'sample-toy',name:'Sample game',
 status:'unconfirmed',offer_type:'limited',
 round:{round_url:'https://example.com/g',start:'2026-10-29',end:'2026-11-04',link_rotates:null,current_link_end:'2026-11-04'},
 article:null,price:null,list_price:null,price_scope:null,price_checked_at:null,variants:[],specs:[],age:null,faq:[],
 facts_source:{price:null,specs:null,age:null,_why_null:'no per-product data yet'},
 storage_usage:null,shipping:null,contents:null,notes:[],images:[],disclosure:null,fetched_at:'2026-10-26',...extra});

test('a standing product with priced variants and underscore notes is valid',()=>{
 assert.deepEqual(validate(standing({_note:'free-form'})),[]);
});
test('an unconfirmed product with every fact null is valid',()=>{
 assert.deepEqual(validate(limitedUnconfirmed()),[]);
});
test('structure: missing fields, bad enums, bad dates and non-https links are reported',()=>{
 const bad=standing({status:'live',fetched_at:'11/01',article:'/blog/Bad/'});
 delete bad.name;
 const e=validate(bad).join('\n');
 assert.match(e,/\$\.name: required/);
 assert.match(e,/\$\.status: must be one of/);
 assert.match(e,/\$\.fetched_at: does not match/);
 assert.match(e,/\$\.article: does not match/);
 assert.match(validate(standing({faq:[{q:'Q',a:'A',source:'http://example.com'}]})).join(),/faq\[0\]\.source/);
 assert.match(validate(standing({unexpected:1})).join(),/\$\.unexpected: not allowed/);
});
test('cost and commission fields can never exist, at any depth',()=>{
 assert.match(validate(standing({commission:'10%'})).join(),/must not exist/);
 assert.match(validate(standing({specs:[{name:'x',value:'1',unit:null,成本:5}]})).join(),/must not exist/);
 for(const k of ['cost','costs','commission','margin','rebate','affiliate_rate','分潤','成本','佣金'])assert.match(validate(standing({[k]:1})).join(),/must not exist/,k);
 // The official disclosure sentence mentions 分潤 as text, which is fine: only field names are checked.
 assert.deepEqual(validate(standing({disclosure:'使用推薦折扣碼購買，我們可能獲得分潤。'})),[]);
});
test('standing needs end=null, limited needs an end, rotating links need current_link_end',()=>{
 assert.match(validate(standing({round:{...standing().round,end:'2026-12-31'}})).join(),/standing offer: round\.end must be null/);
 assert.match(validate(limitedUnconfirmed({offer_type:'limited',round:{...limitedUnconfirmed().round,end:null}})).join(),/limited offer: round\.end is required/);
 assert.match(validate(standing({round:{...standing().round,current_link_end:null}})).join(),/current_link_end is required/);
});
test('an unconfirmed product cannot carry prices or variants',()=>{
 assert.match(validate(limitedUnconfirmed({price:99,price_scope:'x',price_checked_at:'2026-10-30',facts_source:{price:'https://example.com'}})).join(),/unconfirmed product must not carry prices/);
});
test('every price needs a checked date, a scope and a source',()=>{
 assert.match(validate(standing({price_checked_at:null})).join(),/needs price_checked_at/);
 assert.match(validate(standing({price_scope:null})).join(),/needs price_scope/);
 assert.match(validate(standing({facts_source:{specs:'https://example.com'}})).join(),/variant prices need facts_source\.variants/);
 assert.match(validate(standing({price:100,list_price:150,facts_source:{variants:'https://example.com',specs:'https://example.com'}})).join(),/product price needs facts_source\.price/);
 assert.match(validate(standing({specs:[{name:'v',value:'1',unit:null}],facts_source:{variants:'https://example.com'}})).join(),/specs need facts_source\.specs/);
});
test('variant slugs are unique',()=>{
 const v=standing().variants;
 assert.match(validate(standing({variants:[v[0],{...v[1],variant_slug:v[0].variant_slug}]})).join(),/variant_slug must be unique/);
});
test('visibility: a standing offer stays indexable after its link expires, but its price is hidden',()=>{
 const p=standing();
 assert.deepEqual(visibility(p,'2026-10-31'),{indexable:true,showPrice:true,linkExpired:false});
 assert.deepEqual(visibility(p,'2026-11-01'),{indexable:true,showPrice:false,linkExpired:true});
});
test('visibility: limited offers stop being indexable after their end date; unconfirmed and ended never are',()=>{
 const l=standing({offer_type:'limited',round:{round_url:'https://example.com/r',start:'2026-10-26',end:'2026-11-02',link_rotates:null,current_link_end:'2026-11-02'}});
 assert.equal(visibility(l,'2026-11-02').indexable,true);
 assert.equal(visibility(l,'2026-11-03').indexable,false);
 assert.equal(visibility(limitedUnconfirmed(),'2026-11-01').indexable,false);
 assert.equal(visibility(standing({status:'ended'}),'2026-11-01').indexable,false);
});
test('visibility: no price is shown without a checked date',()=>{
 assert.equal(visibility(standing({price_checked_at:null}),'2026-10-30').showPrice,false);
});
test('the schema file itself is well formed (every property used by the checker exists)',()=>{
 assert.equal(schema.type,'object');
 for(const k of schema.required)assert.ok(k in schema.properties,k);
 assert.deepEqual(check({},{type:'object',required:['a'],properties:{}}),['$.a: required']);
});
