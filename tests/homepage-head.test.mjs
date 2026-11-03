import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const html=readFileSync(resolve(root,'index.html'),'utf8');
const lines=html.split('\n');

test('the homepage description, og and twitter description are one identical sentence, each tag on one line',()=>{
 const get=re=>{const m=lines.map(l=>l.match(re)).filter(Boolean);assert.equal(m.length,1,String(re));return m[0][1];};
 const description=get(/^\s*<meta name="description" content="([^"]+)">\s*$/);
 assert.equal(get(/<meta property="og:description" content="([^"]+)">/),description);
 assert.equal(get(/<meta name="twitter:description" content="([^"]+)">/),description);
 assert.ok(description.length>=70&&description.length<=180,'length '+description.length);
 assert.match(description,/^鷹式一家 Eaglish Family 官方團購網站。/);
});
test('the homepage title carries the brand terms and matches og and twitter titles',()=>{
 const title=html.match(/<title>([^<]+)<\/title>/)[1];
 assert.match(title,/^鷹式一家團購｜/);
 assert.ok(html.includes(`<meta property="og:title" content="${title}">`));
 assert.ok(html.includes(`<meta name="twitter:title" content="${title}">`));
});
