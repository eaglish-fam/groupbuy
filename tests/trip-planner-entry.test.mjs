import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read = p => readFileSync(new URL('../'+p, import.meta.url),'utf8');
for (const [city,end] of [['chiang-mai','video'],['chiang-rai','films']]) {
  test(`${city}: places first, planner before films, four-character launcher`,()=>{
    const html=read(`trip/guides/${city}-with-kids/index.html`);
    assert.equal((html.match(/id="plan"/g)||[]).length,1);
    assert.equal((html.match(/data-plan-entry/g)||[]).length,1);
    assert.ok(html.indexOf('id="faq"')<html.indexOf('id="plan"'));
    assert.ok(html.indexOf('id="plan"')<html.indexOf(`id="${end}"`));
    assert.ok(html.indexOf(`id="${end}"`)<html.indexOf('<footer'));
    assert.match(html,/aria-label="行程規劃" data-plan-entry><span>行程<\/span><span>規劃<\/span>/);
    assert.match(html,/planner-entry\.js/);
    assert.doesNotMatch(read(`trip/thailand/${city}/index.html`),/data-plan-entry|planner-entry\.js/);
  });
}
test('launcher visibility, focus and reduced-motion jump',()=>{
  const callbacks={}, entry={hidden:false,addEventListener:(event,fn)=>callbacks[event]=fn};
  let planTop=2000, footerTop=5000, open=false, focus=null, behavior=null, hash='';
  const heading={setAttribute:(key,value)=>assert.deepEqual([key,value],['tabindex','-1']),focus:()=>{focus=heading;}};
  const plan={getBoundingClientRect:()=>({top:planTop,bottom:planTop+1000}),querySelector:()=>heading,scrollIntoView:options=>{behavior=options.behavior;}};
  const footer={getBoundingClientRect:()=>({top:footerTop,bottom:footerTop+200})};
  const nav={classList:{contains:()=>open}};
  const document={body:{},activeElement:null,querySelector:selector=>({'[data-plan-entry]':entry,'footer':footer,'.reading-nav':nav}[selector]),getElementById:()=>plan,addEventListener:(name,fn)=>callbacks[name]=fn};
  const location={hash};
  const context={document,location,history:{pushState:(_a,_b,value)=>location.hash=value},window:{innerHeight:844,innerWidth:390,addEventListener:(name,fn)=>callbacks[name]=fn},requestAnimationFrame:fn=>fn(),MutationObserver:class{constructor(fn){callbacks.mutation=fn;}observe(){}},matchMedia:()=>({matches:true})};
  vm.runInNewContext(read('trip/planner-entry.js'),context);
  assert.equal(entry.hidden,false);
  planTop=300;callbacks.scroll();assert.equal(entry.hidden,true);
  planTop=2000;callbacks.scroll();assert.equal(entry.hidden,false);
  open=true;callbacks.mutation();assert.equal(entry.hidden,true);
  open=false;footerTop=600;callbacks.scroll();assert.equal(entry.hidden,true);
  footerTop=5000;document.activeElement={getBoundingClientRect:()=>({right:370,bottom:820,top:780})};callbacks.focusin();assert.equal(entry.hidden,true);
  document.activeElement=null;callbacks.focusout();assert.equal(entry.hidden,false);
  let prevented=false;callbacks.click({button:0,preventDefault:()=>prevented=true});
  assert.equal(prevented,true);assert.equal(location.hash,'#plan');assert.equal(focus,heading);assert.equal(behavior,'instant');
  prevented=false;callbacks.click({button:0,ctrlKey:true,preventDefault:()=>prevented=true});assert.equal(prevented,false);
});
