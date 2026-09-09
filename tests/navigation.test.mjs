import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

function section(html,start,end){
  const from=html.indexOf(start),to=html.indexOf(end,from);
  assert.ok(from>=0&&to>from,`missing ${start}`);
  return html.slice(from,to);
}

test('desktop header is a utility row and content navigation is the single primary menu',()=>{
  for(const path of [new URL('../design/index.html',import.meta.url),new URL('../index.html',import.meta.url)]){
    const html=fs.readFileSync(path,'utf8');
    const header=section(html,'<header class="site-header">','</header>');
    const navigation=section(html,'<nav class="content-nav"','</nav>');
    assert.doesNotMatch(header,/<nav\b/,'utility header must not duplicate primary navigation');
    assert.match(header,/class="logo"/);
    assert.match(header,/class="header-actions"/);
    assert.match(navigation,/>購物須知<\/a><a href="#about">關於我們<\/a>/,'About follows shopping notice in the primary navigation');
  }
});
