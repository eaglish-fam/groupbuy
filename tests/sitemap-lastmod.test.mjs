import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {supportedLastmod,generateSitemap} from '../scripts/generate-sitemap.mjs';

test('sitemap keeps valid editorial dates and never substitutes today for unknown changes',()=>{
 assert.equal(supportedLastmod({file:'blog/example/index.html',html:'{"dateModified":"2026-09-12"}',dirty:true,committed:'2026-09-20'}),'2026-09-12');
 assert.equal(supportedLastmod({file:'trip/index.html',dirty:true,committed:'2026-09-20'}),undefined);
 assert.equal(supportedLastmod({file:'new-page.html',committed:''}),undefined);
 assert.equal(supportedLastmod({file:'trip/index.html',dirty:false,committed:'2026-09-20'}),'2026-09-20');
 assert.equal(supportedLastmod({file:'blog/example/index.html',html:'{"dateModified":"2026-02-30"}',dirty:true}),undefined);
 assert.equal(supportedLastmod({file:'trip/index.html',committed:'not-a-date'}),undefined);
});

test('dirty and untracked pages omit optional lastmod while unchanged Git evidence is preserved',t=>{
 const root=mkdtempSync(join(tmpdir(),'eaglish-sitemap-date-'));t.after(()=>rmSync(root,{recursive:true,force:true}));
 const git=args=>execFileSync('git',args,{cwd:root,encoding:'utf8',env:{...process.env,GIT_AUTHOR_DATE:'2026-09-12T10:00:00+08:00',GIT_COMMITTER_DATE:'2026-09-12T10:00:00+08:00'}});
 const html=path=>`<!doctype html><html><head><link rel="canonical" href="https://www.eaglish.store${path}"></head><body>Source-backed page</body></html>`;
 git(['init','--quiet']);git(['config','user.name','Sitemap fixture']);git(['config','user.email','fixture@example.invalid']);
 writeFileSync(join(root,'index.html'),html('/'));
 mkdirSync(join(root,'clean'));writeFileSync(join(root,'clean/index.html'),html('/clean/'));
 git(['add','.']);git(['commit','--quiet','-m','Fixture documents']);
 writeFileSync(join(root,'index.html'),html('/').replace('Source-backed','Changed'));
 mkdirSync(join(root,'new'));writeFileSync(join(root,'new/index.html'),html('/new/'));
 const first=generateSitemap(root),second=generateSitemap(root);
 assert.equal(first,second,'repeated builds preserve exactly the same date evidence');
 const blocks=[...first.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(m=>m[1]);
 assert.doesNotMatch(blocks.find(block=>block.includes('<loc>https://www.eaglish.store/</loc>')),/<lastmod>/);
 assert.doesNotMatch(blocks.find(block=>block.includes('/new/')),/<lastmod>/);
 assert.match(blocks.find(block=>block.includes('/clean/')),/<lastmod>2026-09-12<\/lastmod>/);
});
