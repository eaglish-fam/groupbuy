// Before/after screenshots for Bingo: PR #57 fixes on published travel pages,
// plus the noindex Japan candidate pages built from the synthetic sample.
// Usage: node bingo-shots-pr57.mjs <repo> <out-dir>   (copy outside the repo first; run on M5)
//   <repo> is a groupbuy clone with node_modules installed and Playwright's Chromium.
import {execFileSync} from 'node:child_process';
import {existsSync,mkdirSync,readFileSync,rmSync,statSync,symlinkSync,writeFileSync} from 'node:fs';
import http from 'node:http';
import {extname,resolve} from 'node:path';
const [repo,out]=process.argv.slice(2).map(p=>resolve(p));
if(!repo||!out)throw Error('Usage: node shots.mjs <repo> <out-dir>');
const git=(...a)=>execFileSync('git',['-C',repo,...a],{encoding:'utf8'}).trim();
const work=resolve(out,'.work');rmSync(work,{recursive:true,force:true});mkdirSync(work,{recursive:true});
git('fetch','-q','origin','+refs/heads/main:refs/remotes/origin/main','+refs/heads/claude/trip-japan-support-20261021:refs/remotes/origin/claude/trip-japan-support-20261021');
const before=resolve(work,'before'),after=resolve(work,'after');
git('worktree','add','-q','--detach',before,'origin/main');
git('worktree','add','-q','--detach',after,'origin/claude/trip-japan-support-20261021');
const afterSha=git('-C',after,'rev-parse','--short','HEAD'),beforeSha=git('-C',before,'rev-parse','--short','HEAD');
for(const dir of [before,after])symlinkSync(resolve(repo,'node_modules'),resolve(dir,'node_modules'));
// Candidate pages exist only after registering the synthetic sample and building.
const {syntheticJapanCandidate,writeCandidate}=await import(resolve(after,'tests/fixtures/travel-route-package.mjs'));
const reg=writeCandidate(after,await syntheticJapanCandidate(after,{label:true}),'trip/data/japan-engineering-sample.json');
writeFileSync(resolve(after,'trip/data/approved-travel-candidates-v1.json'),JSON.stringify({schema:'eaglish.approved-travel-candidates/v1',packages:[reg]},null,2)+'\n');
for(const cmd of [['scripts/build-trip.mjs'],['scripts/normalize-public-fonts.mjs'],['scripts/normalize-site-seo.mjs','--write']])execFileSync('node',cmd,{cwd:after,stdio:'ignore'});
const mime={'.css':'text/css','.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2'};
const serve=root=>new Promise(done=>{const s=http.createServer((q,r)=>{let f=resolve(root,'.'+decodeURIComponent(new URL(q.url,'http://x').pathname));if(existsSync(f)&&statSync(f).isDirectory())f=resolve(f,'index.html');if(!f.startsWith(root)||!existsSync(f)){r.statusCode=404;return r.end();}r.setHeader('Content-Type',mime[extname(f)]||'application/octet-stream');r.end(readFileSync(f));});s.listen(0,'127.0.0.1',()=>done({s,base:`http://127.0.0.1:${s.address().port}`}));});
const B=await serve(before),A=await serve(after);
const {loadBrowserRuntime}=await import(resolve(after,'tests/browser-runtime.mjs'));
const runtime=await loadBrowserRuntime();if(!runtime)throw Error('Playwright Chromium is not available');
const browser=await runtime.chromium.launch({headless:true,executablePath:runtime.executablePath});
const notes=[];
async function shot(name,base,path,{width,height=900,scale=1,prepare,full=false,clip}={}){
 const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:scale,serviceWorkers:'block'});
 await context.route('**/*',route=>new URL(route.request().url()).origin===base?route.continue():route.fulfill({status:204,body:''}));
 const page=await context.newPage();await page.goto(base+path,{waitUntil:'load'});await page.waitForTimeout(600);
 const note=prepare?await prepare(page):undefined;
 const area=clip?await clip(page):undefined;
 await page.screenshot({path:resolve(out,name),type:'jpeg',quality:80,fullPage:full,...(area?{clip:area}:{})});
 await context.close();if(note)notes.push(`${name}: ${note}`);
}
// Fix 1: on a non-chapter city guide the sticky contents list began at 30px, under the 110px masthead.
const tocState=async page=>{await page.mouse.wheel(0,2600);await page.waitForTimeout(700);return page.evaluate(()=>{const a=document.querySelector('nav[data-reading-nav] a'),r=a.getBoundingClientRect(),hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return `目錄第一項「${a.textContent.trim()}」在 y=${Math.round(r.top)}，那個位置點到的是 ${hit?.closest('nav[data-reading-nav] a')===a?'目錄第一項（正確）':'標頭／Logo（錯）'}`;});};
for(const [tag,srv] of [['before',B],['after',A]])await shot(`01-svalbard-toc-1440-${tag}.jpg`,srv.base,'/trip/guides/svalbard-with-kids/',{width:1440,height:560,prepare:tocState});
// Fix 2: the Norway city photo renders 1182px wide but declared 520px, so it loaded the 640w file.
const photoState=async page=>{await page.locator('.th-tabs [data-country-city="oslo"]').click();await page.waitForTimeout(800);await page.locator('#city-oslo .th-city-photo').scrollIntoViewIfNeeded();await page.waitForTimeout(800);return page.evaluate(()=>{const i=document.querySelector('#city-oslo .th-city-photo img');return `顯示 ${Math.round(i.getBoundingClientRect().width)}px 寬，載入 ${i.currentSrc.split('/').pop()}（原檔 ${i.naturalWidth}px）`;});};
const photoClip=async page=>{const b=await page.locator('#city-oslo .th-city-photo img').boundingBox();return {x:b.x+b.width*.3,y:b.y+b.height*.3,width:Math.min(520,b.width*.4),height:Math.min(320,b.height*.4)};};
for(const [tag,srv] of [['before',B],['after',A]])await shot(`02-norway-oslo-photo-1440-${tag}.jpg`,srv.base,'/trip/norway/',{width:1440,scale:1,prepare:photoState,clip:photoClip});
// Candidate pages (synthetic sample, noindex): what the new page types look like.
const hokkaido=async page=>{const b=page.locator('[data-travel-atlas-select="hokkaido"]');if(await b.isVisible())await b.click();await page.locator('#atlas').scrollIntoViewIfNeeded();await page.waitForTimeout(400);};
for(const width of [1440,390,320]){
 await shot(`10-japan-map-hokkaido-${width}.jpg`,A.base,'/trip/japan/',{width,prepare:hokkaido});
 await shot(`11-japan-country-${width}-full.jpg`,A.base,'/trip/japan/',{width,full:true});
 await shot(`12-route-7-days-${width}-full.jpg`,A.base,'/trip/japan/hokkaido-asahikawa-sapporo-7-days/',{width,full:true});
}
await shot('13-asahikawa-city-390-full.jpg',A.base,'/trip/guides/asahikawa-with-kids/',{width:390,full:true});
await browser.close();B.s.close();A.s.close();
writeFileSync(resolve(out,'README-grace-pr57.md'),`# Grace → Bingo：PR #57 要給 Hiram 看的畫面

- 改之前：main \`${beforeSha}\`；改之後：\`claude/trip-japan-support-20261021\` \`${afterSha}\`
- 日本頁是**合成樣板**（灰色 PHOTO 方塊、示意文字），只看版型，不是內容。不給 Google 收錄，也不會上線。
- 這些截圖只放 M5 橋接資料夾，不進公開 repo。

## 一、已上線頁面的兩個修正（合併後才會上線）

1. **電腦版文章目錄被上方標頭蓋住**：\`01-svalbard-toc-1440-before.jpg\` vs \`-after.jpg\`。之前目錄第一項躲在標頭後面，點下去會回遠行所首頁；之後目錄從標頭下方開始。奧斯陸、特羅姆瑟、阿姆斯特丹同樣修好。
2. **國家頁城市大照片偏糊**：\`02-norway-oslo-photo-1440-before.jpg\` vs \`-after.jpg\`（照片中間裁切，原尺寸）。之前只載入 640 寬的小檔，之後載入夠寬的檔。荷蘭、馬來西亞同樣修好。

## 二、日本候選頁（新版型）

- \`10-japan-map-hokkaido-*.jpg\`：日本入口頁地圖，切到「北海道」視角，有旭川、札幌、小樽、新千歲機場。
- \`11-japan-country-*-full.jpg\`：入口頁整頁，中間有「完整路線篇」卡片。
- \`12-route-7-days-*-full.jpg\`：新的路線篇，第 1 天到第 7 天各一段，最後是 7 天總表。
- \`13-asahikawa-city-390-full.jpg\`：旭川城市篇（沿用現有城市篇版型）。
- 寬度：1440＝電腦、390＝一般手機、320＝小手機。

## 量測

${notes.map(n=>'- '+n).join('\n')}
`);
git('worktree','remove','--force',before);git('worktree','remove','--force',after);rmSync(work,{recursive:true,force:true});
console.log('Wrote',out);console.log(notes.join('\n'));
