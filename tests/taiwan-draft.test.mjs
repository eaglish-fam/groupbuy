import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const data='trip/data/taiwan-approved-travel-v1.json';

// Taiwan is a draft built from the travel-home atlas; 【待補】 marks what Lydia's TRIP-TW-001 materials still owe.
// While any 【待補】 remains, the package may only be an unpublished candidate (noindex, no sitemap, no discovery).
test('Taiwan stays an unpublished candidate while any 【待補】 placeholder remains',()=>{
 const pending=(read(data).match(/【待補】/g)||[]).length;
 const published=JSON.parse(read('trip/data/approved-travel-registration-v1.json')).packages.some(p=>p.dataPath===data);
 if(pending)assert.equal(published,false,`${pending} placeholders left`);
 const candidate=JSON.parse(read('trip/data/approved-travel-candidates-v1.json')).packages.find(p=>p.dataPath===data);
 if(candidate)assert.equal(candidate.publication,false);
 for(const path of ['trip/taiwan/','trip/guides/taipei-with-kids/','trip/guides/new-taipei-keelung-with-kids/','trip/guides/yilan-with-kids/','trip/guides/kaohsiung-with-kids/']){
  const html=read(path+'index.html');
  if(pending)assert.match(html,/<meta name="robots" content="noindex,nofollow">/,path);
 }
 if(pending)assert.ok(!read('sitemap.xml').includes('/trip/taiwan/'));
});
