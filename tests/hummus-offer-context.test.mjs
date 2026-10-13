import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),ProductContent=require('../product-content.js');
const source=fs.readFileSync(new URL('../articles/article.js',import.meta.url),'utf8');
// Execute the actual source-context declaration and actual refresh function,
// without the unrelated floating DOM mechanics. Network/navigation are fixtures.
const context=source.match(/const sourceArticleSlug=[^;]+;/)[0];
const refresh=source.slice(source.indexOf('async function refreshOffer('),source.indexOf('\nofferButton.addEventListener('));
function fixture({slug,openLabel,state='open',failure=false}){
  const attrs={},button={dataset:openLabel?{openLabel}:{},disabled:true,textContent:'',setAttribute(k,v){attrs[k]=v;},closest(){return {classList:{contains:()=>false}};}},status={textContent:''},effects=[],requests=[];
  const sandbox={document:{body:{dataset:slug?{sourceArticleSlug:slug}:{}}},article:ProductContent.catalog.wave,articleKey:'wave',offerButton:button,statusEl:status,
    sheetUrl:'https://fixture.invalid/current-wave.csv',busy:false,seed:[],videoSignature:'[]',videoEl:null,ProductContent:{...ProductContent,sheetRows:()=>[],campaignFor:()=>({state,label:'fixture '+state,url:'https://example.com/current-wave',end:''}),rowForArticle:()=>null},
    floatingOffer:{setAvailable(v){effects.push(['available',v]);}},Papa:{parse:()=>({errors:[],data:[]})},Date,AbortSignal,
    fetch:async(url,options)=>{requests.push({url,options});if(failure)throw Error('explicit network-failure fixture');return {ok:true,text:async()=>'fixture CSV'};},
    window:{SiteAnalytics:{outboundGroupbuy(v){effects.push(['event',v]);}},location:{assign(v){effects.push(['navigate',v]);}}},console:{warn(){}},
  };
  vm.createContext(sandbox);vm.runInContext(context+'\n'+refresh,sandbox);
  return {sandbox,button,status,effects,requests,run:navigate=>sandbox.refreshOffer(navigate)};
}
test('knowledge purchase preserves real Wave verification and records hummus-guide source',async()=>{
  const f=fixture({slug:'hummus-guide',openLabel:'查看當期 Wave 組合與購買方式'});await f.run(true);
  assert.equal(f.button.textContent,'查看當期 Wave 組合與購買方式');assert.equal(f.button.disabled,false);
  const event=f.effects.find(e=>e[0]==='event')[1];assert.equal(event.articleSlug,'hummus-guide');assert.equal(event.productId,'wave-hummus');
  assert.equal(f.requests[0].options.cache,'no-store');assert.ok(f.effects.some(e=>e[0]==='navigate'));
  await f.run(true);assert.equal(f.requests.length,2,'each navigation rechecks network');
});
test('legacy Wave source and label remain unchanged without knowledge context',async()=>{
  const f=fixture({});await f.run(true);assert.equal(f.button.textContent,'fixture open');assert.equal(f.effects.find(e=>e[0]==='event')[1].articleSlug,'wave-hummus');
});
test('closed, upcoming and unknown fixtures never navigate or emit purchase events',async()=>{
  for(const state of ['closed','upcoming','unknown']){const f=fixture({slug:'hummus-guide',state});await f.run(true);assert.equal(f.button.disabled,true);assert.ok(!f.effects.some(e=>['event','navigate'].includes(e[0])));}
});
test('failed network is retryable but cannot use a prior offer or vendor URL',async()=>{
  const f=fixture({slug:'hummus-guide',failure:true});await f.run(true);assert.equal(f.button.textContent,'重新確認團購狀態');assert.equal(f.button.disabled,false);assert.ok(!f.effects.some(e=>['event','navigate'].includes(e[0])));assert.match(f.status.textContent,/未使用過期連結/);
});
