import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../articles/floating-offer.js',import.meta.url),'utf8');
test('floating CTA docks without height oscillation and returns on reverse scroll',()=>{
 const frames=[];let homeTop=1000;const classes=new Set();
 const bar={classList:{toggle(name,on){on?classes.add(name):classes.delete(name);}},append(){}};
 const slot={style:{},append(){},getBoundingClientRect:()=>({top:homeTop})};
 const button={before(){},getBoundingClientRect:()=>({height:classes.has('is-floating')?52:54})};
 const document={createElement:()=>document.created++?bar:slot,created:0,body:{},addEventListener(){},activeElement:null};
 const window={innerHeight:800,addEventListener(){}};
 const context={document,window,requestAnimationFrame:fn=>(frames.push(fn),frames.length),getComputedStyle:()=>({bottom:'69px'}),ResizeObserver:class{observe(){}}};
 vm.runInNewContext(source,context);
 const ctrl=context.ArticleFloatingOffer.mount(button);const flush=()=>frames.shift()();
 flush();assert.equal(classes.has('is-floating'),true);
 homeTop=678;ctrl.schedule();flush();assert.equal(classes.has('is-floating'),true);
 ctrl.schedule();flush();assert.equal(classes.has('is-floating'),true);
 homeTop=677;ctrl.schedule();flush();assert.equal(classes.has('is-floating'),false);
 ctrl.schedule();flush();assert.equal(classes.has('is-floating'),false);
 homeTop=900;ctrl.schedule();flush();assert.equal(classes.has('is-floating'),true);
 assert.equal(context.ArticleFloatingOffer.mount(button),ctrl);
 ctrl.setAvailable(false);flush();assert.equal(classes.has('is-floating'),false);
});
test('official CTA invokes clipboard immediately without intercepting native navigation, including denial',()=>{
 const source=readFileSync(new URL('../blog/shinwa-living/shinwa.js',import.meta.url),'utf8');
 for(const outcome of ['onSuccess','onFailure']){
  const status={};const feedback={setAttribute(){}};let handler,called=false;
  const offer={dataset:{shinwaCopyOnOpen:'eaglish'},parentElement:{append(){}}};
  vm.runInNewContext(source,{document:{querySelector:s=>s==='.copy-status'?status:offer,createElement:()=>feedback,addEventListener:(name,fn)=>handler=fn},ArticleFloatingOffer:{mount(){}},PermanentOffers:{copyCode(code,callbacks){assert.equal(code,'eaglish');called=true;callbacks[outcome]();return Promise.resolve();}},setTimeout(){},clearTimeout(){}});
  handler({target:{closest:s=>s==='[data-shinwa-offer]'?offer:null},preventDefault(){throw Error('must not block native link');}});
  assert.equal(called,true);assert.equal(feedback.textContent,status.textContent);
  assert.match(status.textContent,outcome==='onSuccess'?/已複製/:/請長按複製/);
 }
});
