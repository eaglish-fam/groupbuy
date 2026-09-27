// Import Hiram's September 2026 photo batch; retain originals outside the public site.
// Usage: node scripts/import-bangkok-photos.mjs <attachment-directory> <private-archive-directory>
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {constants} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const [source,archive]=process.argv.slice(2);
if(!source||!archive)throw Error('Supply the attachment directory and private archive directory.');
const root=resolve(import.meta.dirname,'..');
if(resolve(archive).startsWith(root+'/'))throw Error('Originals must stay outside the published checkout.');
const photos=[
 ['bkk-jurassic-raptor-family','jurassic','媽媽與孩子在 Jurassic World 猛禽訓練室造景前合照','猛禽訓練室的場景與我們當時的合照。'],
 ['bkk-jurassic-family','jurassic','鷹式一家五人在 Jurassic World 發光入口招牌下合照','全家一起在侏羅紀世界入口拍張合照！'],
 ['bkk-canal-family','canal','一家人在彩色船篷下搭乘曼谷運河長尾船，身旁是水岸房屋','從船上看運河兩側的房屋，換個角度逛曼谷。'],
 ['bkk-canal-buddha','canal','孩子坐在長尾船上，後方是 Wat Paknam 的金色大佛','這次從船上看見的 Wat Paknam 金色大佛。'],
 ['bkk-bangkok-family','bangkok','鷹式一家五人帶著推車，在曼谷的商店步道合照','曼谷家庭旅行：逛街、搭船，再一起去看恐龍。'],
 ['bkk-canal-mother-kids','canal','媽媽與孩子坐在曼谷運河長尾船上，船後可見水岸建築','帶孩子搭船，也記得把等船、上船與休息時間算進去。'],
 ['bkk-safari-family','safari','爸爸與孩子在 Safari World 長頸鹿平台，兩隻長頸鹿靠近欄杆','長頸鹿靠得好近！參與活動時跟著現場工作人員的指示。'],
 ['bkk-sealife-boat-kids','indoors','兩個孩子穿著橘色救生衣，坐在 SEA LIFE 的玻璃底船上','館內玻璃底船是另一種看水中生物的方式；訂票時確認是否包含。'],
 ['bkk-city-stroller','practical','媽媽推著嬰兒車，與兩個孩子走在曼谷市區人行道上','市區移動也算行程的一部分：留時間找電梯、過馬路和補水。']
];
await mkdir(archive,{recursive:true});
const result=[];
for(const [i,[id,section,alt,caption]] of photos.entries()){
 const original=await readFile(resolve(source,`${i+1}-照片-${i+1}.jpg`));
 const sha256=createHash('sha256').update(original).digest('hex');
 const archiveFile=resolve(archive,`${id}.jpg`);
 try{await copyFile(resolve(source,`${i+1}-照片-${i+1}.jpg`),archiveFile,constants.COPYFILE_EXCL);}catch(e){if(e.code!=='EEXIST'||createHash('sha256').update(await readFile(archiveFile)).digest('hex')!==sha256)throw e;}
 const {data,info}=await sharp(original).rotate().resize({width:1280,withoutEnlargement:true}).webp({quality:80,effort:6}).toBuffer({resolveWithObject:true});
 await writeFile(resolve(root,`trip/assets/${id}.webp`),data);
 result.push({id,section,photoNumber:i+1,kind:'user-supplied-photo',source:'Hiram 提供的曼谷家庭照片（2026-09-27）',originalSha256:sha256,originalBytes:original.length,reviewedAt:'2026-09-27',width:info.width,height:info.height,portrait:info.height>info.width,alt,caption});
}
await writeFile(resolve(root,'trip/data/bangkok-photos.json'),JSON.stringify(result,null,2)+'\n');
await writeFile(resolve(archive,'manifest.json'),JSON.stringify(result,null,2)+'\n');
console.log(`Archived and compressed ${result.length} Bangkok photos.`);
