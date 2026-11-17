// Once Otaru and Yoichi have guides, the Japan country page names all four
// Hokkaido guides, links their videos and lists them in related reading.
// Run after japan-otaru-v1.mjs and japan-yoichi-v1.mjs.
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {root} from './legacy-approved-helpers.mjs';

const pkgPath=resolve(root,'trip/data/japan-approved-travel-v1.json');
const pkg=JSON.parse(readFileSync(pkgPath,'utf8'));
const japan=pkg.countries.find(c=>c.id==='japan'),has=id=>japan.cityIds.includes(id);
if(!has('otaru')||!has('yoichi'))throw Error('Run the Otaru and Yoichi scripts first (both need their photos)');

Object.assign(japan,{
 title:'日本親子旅行：北海道旭川、札幌、小樽與余市攻略',
 subtitle:'動物園、科學館、滑雪、運河散步與海邊度假屋',
 metadataTitle:'日本親子旅行｜北海道旭川、札幌、小樽、余市實訪｜鷹家遠行所',
 description:'日本親子旅行先看北海道：旭川動物園、札幌滑雪與市區、小樽運河與三角市場、余市海邊度假屋與 Kiroro 玩雪，附實訪照片、交通和嬰兒照顧經驗。',
 intro:['我們的日本親子旅行從北海道開始：旭川看動物、玩科學，札幌帶孩子上雪場，小樽沿著運河散步，余市住進海邊的度假屋。','這裡整理我們兩趟冬天的北海道紀錄：一趟帶著七個月大的嬰兒走旭川、札幌與小樽，另一趟住在余市、上 Kiroro 玩雪。']
});
japan.sourceIds=[...new Set([...japan.sourceIds,'o01','y00'])];
japan.presentation.overviewText='先挑想看的城市與玩法，再按停留時間安排動物園、室內活動、雪場和海邊小鎮。';
japan.planInfo={...japan.planInfo,title:'先安排各城市的遊玩日',
 paragraphs:['旭川先選動物園或兩座室內館舍；札幌先決定是否安排兩天滑雪；小樽可以當作一天散步，余市則適合住幾晚、上雪場再看在地景點。下方可分別試排各城市的遊玩日。'],
 sourceIds:[...new Set([...japan.planInfo.sourceIds,'o01','y03','y05'])]};
const addLinks=(module,links,sourceIds)=>{for(const l of links)if(!module.links.some(x=>x.url===l.url))module.links.push(l);module.sourceIds=[...new Set([...module.sourceIds,...sourceIds])];};
addLinks(japan.videos,[{label:'小樽一日散步',url:'https://www.youtube.com/watch?v=nAKoy93DtQw'},{label:'余市五天四夜',url:'https://www.youtube.com/watch?v=VThgTPbHDVU'}],['o01','y00']);
addLinks(japan.related,[{label:'小樽城市篇',url:'/trip/guides/otaru-with-kids/'},{label:'余市城市篇',url:'/trip/guides/yoichi-with-kids/'}],['o01','y00']);
const q='想住在海邊、慢慢玩雪，可以怎麼排？';
japan.faq=japan.faq.filter(f=>f.question!==q).concat({question:q,answer:'另一趟冬天我們住在余市海邊的度假屋，第二天上 Kiroro 玩雪、下午去雪上活動，最後一天看海邊奇岩、逛 Nikka 蒸餾所；小樽水族館和音樂盒則排在中間一天。',sourceIds:['y03','y04','y05','y07','y11']});
writeFileSync(pkgPath,JSON.stringify(pkg,null,2)+'\n');
console.log('Japan country updated for',japan.cityIds.join(', '));
