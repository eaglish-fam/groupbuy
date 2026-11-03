import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {diffClassify,formatDiff,loadOldCore} from '../scripts/classify-diff.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const core=createRequire(import.meta.url)('../design/catalog-core.js');
// A fake "old" classify: the new one with 賣完為止 rows treated as plain closed after their end date.
const oldCore={classify:(r,t)=>core.classify({...r,類型:String(r['類型']).replace('賣完為止','長期')},t)};
const csv=[
 '品牌,商品描述,類型,開團日期,結束日期,連結,庫存狀態',
 'Happymoon,x,賣完為止,2026-10-01,2026-10-31,https://example.com/h,',
 'Other,y,長期,,,https://example.com/o,',
 'Limited,z,短期,2026-11-01,2026-11-08,https://example.com/l,',
 '// note,,,,,,'
].join('\n');

test('only the row that uses the new type is reported, the rest are listed as unchanged',()=>{
 const res=diffClassify({csvText:csv,oldCore,newCore:core,today:'2026-11-03'});
 assert.equal(res.total,3);
 assert.deepEqual(res.changed.map(c=>c.brand),['Happymoon']);
 assert.equal(res.changed[0].old.label,'當期連結待更新');
 assert.equal(res.changed[0].now.label,'賣完為止');
});
test('exit status: expected differences pass, unexpected ones fail',()=>{
 const res=diffClassify({csvText:csv,oldCore,newCore:core,today:'2026-11-03'});
 assert.equal(formatDiff(res,'2026-11-03',['Happymoon']).ok,true);
 const bad=formatDiff(res,'2026-11-03',[]);
 assert.equal(bad.ok,false);assert.match(bad.text,/FAIL：1 列/);assert.match(bad.text,/\*\*否\*\*/);
});
test('identical classifiers produce no differences',()=>{
 const res=diffClassify({csvText:csv,oldCore:core,newCore:core,today:'2026-11-03'});
 assert.equal(res.changed.length,0);
 assert.equal(formatDiff(res,'2026-11-03').ok,true);
});
test('the old classifier can be loaded from a git ref',()=>{
 const sha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
 const old=loadOldCore(sha);
 try{assert.equal(typeof old.core.classify,'function');}finally{old.cleanup();}
});
test('a malformed Sheet export is an error, not an empty comparison',()=>{
 assert.throws(()=>diffClassify({csvText:'a,b\n1,2',oldCore:core,newCore:core,today:'2026-11-03'}),/headers/);
});
