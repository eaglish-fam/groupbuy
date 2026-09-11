import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import fs from 'node:fs';
const require=createRequire(import.meta.url),pc=require('../product-content.js');
const html=fs.readFileSync(new URL('../blog/kietla-kids-sunglasses/index.html',import.meta.url),'utf8');
test('Ki ET LA uses exact product identity and all intended reading surfaces',()=>{
 assert.equal(pc.entry('法國 Ki ET LA 兒童太陽眼鏡｜墨鏡').id,'kietla-kids-sunglasses');
 assert.equal(pc.entry('法國 Ki ET LA 兒童太陽眼鏡｜墨鏡').article,'/blog/kietla-kids-sunglasses/');
 for(const path of ['blog/index.html','sitemap.xml'])assert.ok(fs.readFileSync(new URL('../'+path,import.meta.url),'utf8').includes('/blog/kietla-kids-sunglasses/'));
 assert.ok(html.includes('data-current-offer'));assert.ok(!html.includes('id="article-videos"'));
 assert.equal(pc.catalog.kietla.videoPolicy,'none');
 assert.deepEqual(pc.fromRow({'品牌':'法國 Ki ET LA 兒童太陽眼鏡｜墨鏡','影片網址':'https://youtu.be/opoJj0-_lOQ?t=1200'}),[]);
 assert.equal(pc.videoButton({brand:'法國 Ki ET LA 兒童太陽眼鏡｜墨鏡',video:'https://youtu.be/opoJj0-_lOQ?t=1200'}),'');
});
test('Ki ET LA ignores only explicitly closed history, never ambiguous current offers',()=>{
 const live={'品牌':'法國 Ki ET LA 兒童太陽眼鏡｜墨鏡','類型':'短期','開團日期':'2026-07-22','結束日期':'2026-09-30','連結':'https://gbf.tw/vqkfv','影片網址':'https://youtu.be/opoJj0-_lOQ?t=1200'};
 const closed={...live,'類型':'結團','連結':'','影片網址':'https://youtube.com/shorts/nHW4dMJ7M50'};
 assert.equal(pc.campaignFor([closed,live],'kietla','2026-09-11').state,'open');
 assert.equal(pc.rowForArticle([closed,live],'kietla'),live);
 assert.equal(pc.campaignFor([closed,live,{...live}],'kietla','2026-09-11').state,'unavailable');
 assert.equal(pc.campaignFor([live],'kietla','2026-10-01').state,'closed');
 assert.equal(pc.campaignFor([closed],'kietla','2026-09-11').state,'closed');
 assert.equal(pc.campaignFor([{...live,'連結':''},closed],'kietla','2026-09-11').state,'unavailable');
});
test('Ki ET LA provides >=20 unique real images with named model and age guidance',()=>{
 const imgs=[...html.matchAll(/<img[^>]+src="(\/assets\/kietla\/[^\"]+)"[^>]*>/g)];
 assert.ok(new Set(imgs.map(m=>m[1])).size>=20);
 for(const [,path]of imgs)assert.ok(fs.existsSync(new URL('..'+path,import.meta.url)),path);
 for(const name of ['DIABOLA','OOZZ','WAZZ','萌貝熊','LION','EYZZ','URBAN','Disco'])assert.ok(html.includes(name));
 for(const id of ['baby','toddler','older','uv','fit'])assert.ok(html.includes('id="'+id+'"'));
 assert.ok(html.includes('0–6'));assert.ok(html.includes('6–12'));
 assert.ok(html.includes('不是同一個鏡片配置'));
 assert.equal((html.match(/class="[^"]*explain-board/g)||[]).length,3);
 assert.doesNotMatch(html,/防止近視|大人的眼睛混濁|85–92%/);
});
test('all five Zhouxia photos stay documentary, and video timestamps survive embedding',()=>{
 for(const id of ['5600','3951','8508','0864','0863'])assert.ok(html.includes('zhouxia-'+id+'.webp'));
 const story=html.split('<section id="zhouxia">')[1].split('</section>')[0];
 assert.doesNotMatch(story,/DIABOLA|OOZZ|WAZZ|LION|EYZZ|URBAN|Disco/);
 for(const [time,seconds]of [['1200',1200],['20m',1200],['1h2m3s',3723]])assert.ok(pc.videos('https://youtu.be/opoJj0-_lOQ?t='+time)[0].embedUrl.endsWith('?start='+seconds));
 assert.equal(pc.videos('https://youtu.be/opoJj0-_lOQ?t=invalid')[0].embedUrl,'https://www.youtube-nocookie.com/embed/opoJj0-_lOQ');
});
