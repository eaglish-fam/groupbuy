#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const html = readFileSync(resolve(root, 'blog/shinwa-living/index.html'), 'utf8');
const manifest = JSON.parse(readFileSync(resolve(root, 'assets/shinwa-living/media-manifest.json'), 'utf8'));
const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1];
if (!main) throw new Error('Missing Shinwa article main');
const bodyText = main
  .replace(/<script\b[\s\S]*?<\/script>/gi, '')
  .replace(/<style\b[\s\S]*?<\/style>/gi, '')
  .replace(/<[^>]*>/g, ' ')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&rarr;/g, '→')
  .replace(/\s+/g, ' ').trim();

const alt = {
  'cover.webp': '森呼吸積木在森林背景前疊成高塔，可見不同色澤的木紋',
  'blocks-forest.webp': '木塊塔與散落積木放在森林中的石面上',
  'cypress-child-table-chairs.webp': '沙發前的一張木桌與兩張椅子，桌面和椅面可見方格木紋',
  'fold-table-mahjong.webp': '繃布木框桌面放在圓餐桌上，桌面排有麻將',
  'fold-table-detail.webp': '雙手扶著桌框邊緣，可見木紋與扣環',
  'memory-box-dog.webp': '圓角木框內是彩色狗狗刺繡，擺在桌燈旁',
  'cat-scratcher.webp': '長柄木製抓背器掛在木件旁，可見貓臉與末端雙叉造型',
  'cat-shoehorn-whole.webp': '長柄木製鞋拔斜靠樹幹，柄身與貓臉完整可見',
  'cat-shoehorn-detail.webp': '深色木製鞋拔上的貓臉近拍，可見圓眼和木紋',
  'cat-shoehorn-use.webp': '畫面中的雙腳正在穿鞋，長柄鞋拔放在鞋後跟',
  'video-woodwork.webp': '工作室裡，大人在木板上畫車形，孩子在一旁看',
  'video-blocks.webp': '桌前拿著木塊交談，旁邊疊著一座木塊塔',
  'video-bed.webp': '手指著床邊山形木擋上的小樹裝飾',
  'video-visit.webp': '兩人在木工工作室交談，旁邊可見工作檯與工具',
  'video-market.webp': '站在植栽旁介紹夜市擺攤前的準備',
  'video-outing.webp': '一家人在車內聊起前一晚回朋友家留宿',
  'product-card.webp': '森林中的森呼吸積木塔與心窪生活文章標題',
};
const sourceFor = name => name.startsWith('video-') ? 'first-party-video' : name === 'cypress-child-table-chairs.webp' ? 'official-product-page' : 'reviewed-product-photo';
const mediaNames = Object.keys(alt);
const media = mediaNames.map((name, index) => {
  const output = manifest.outputs.find(item => item.path.endsWith(`/${name}`));
  if (!output) throw new Error(`Missing media output: ${name}`);
  return {
    id: name.replace(/\.webp$/, ''), path: output.path,
    purpose: name === 'cover.webp' ? 'cover' : name.startsWith('video-') ? 'editorial_scene' : 'product_evidence',
    identityStatus: 'confirmed', shows: alt[name], alt: alt[name], caption: '', basis: 'Root-adopted genuine source bound by media-manifest hash', sourceId: sourceFor(name),
  };
});

const packageData = {
  schema: 'eaglish.article-package/v4',
  createdAt: new Date().toISOString(),
  editorialStatus: 'ready',
  publicationAuthorized: false,
  identity: {
    productId: 'shinwa-living', productName: '心窪生活', categoryModule: 'household_goods', slug: 'shinwa-living',
    scope: { includedFamilies: ['手工木作','親子積木','兒童桌椅','遊戲桌面','訂製紀念禮物','貓咪日用木作'], includedModels: [], variantsKeptTogether: ['森呼吸積木濃郁款與清香款','兒童桌椅換板套件與完整組'], excludedSiblings: ['未核實露營車故事'], legacyOnly: [] },
  },
  brief: {
    intent: 'commercial_investigation', primaryQuery: '心窪生活手工木作推薦',
    readerJob: '從家中使用位置、收納、送禮與日常用途，挑一件會常常拿起來用的木作。',
    angle: '從多年朋友關係、親子木工體驗與真實商品照片，看手作如何走進家庭日常。',
    title: '心窪生活推薦｜宜蘭朋友的手工木作、親子積木與手作禮物',
    h1: '心窪生活：把宜蘭朋友的手作，帶進家的日常',
    metaDescription: '從陪孩子做木車、到宜蘭朋友家作客，認識心窪生活的手工木作。比較森呼吸積木的香氣組合、檜木兒童桌椅的換板與完整組，再按桌遊、送禮或玄關日用挑選，搭配我們過去的影片與真實商品照片。',
    openingAnswer: '心窪生活的手工木作可以先按家中用途挑選：親子共玩看森呼吸積木，閱讀角落看兒童桌椅，桌遊與收納看折疊桌面，送禮看訂製記憶盒，日常工具則看貓咪不求人與鞋拔。',
    relatedQuestions: ['已有桌椅怎麼選？','貓咪不求人和黑貓鞋拔怎麼挑？','訂製禮物要先確認什麼？'],
  },
  sources: [
    { id:'official-product-page', authority:'心窪生活官方商品頁', url:'https://www.shinwaliving.com/' },
    { id:'reviewed-product-photo', authority:'Hiram／Root 採用的真實商品照片', locator:'assets/shinwa-living/media-manifest.json' },
    { id:'first-party-video', authority:'鷹式一家第一方影片與採用畫格', url:'https://www.youtube.com/@eaglishfamily' },
    { id:'hiram-offer', authority:'Hiram 直接提供的優惠碼來源', locator:'config/permanent-offers.json' },
    { id:'human-context', authority:'Hiram 直接確認的朋友關係與家庭背景' },
  ],
  claims: [
    { id:'friendship', text:'和心窪生活的朋友在教會認識多年，也常到宜蘭住朋友家。', sourceIds:['human-context'] },
    { id:'blocks', text:'森呼吸積木現售規格、木種組合與價格。', sourceIds:['official-product-page'] },
    { id:'chair', text:'兒童桌椅換板套件與完整組的內容和價格不同。', sourceIds:['official-product-page'] },
    { id:'woodwork-story', text:'陪孩子做木車三個半小時、兩台仍未完成。', sourceIds:['first-party-video'] },
    { id:'offer', text:'推薦折扣碼 eaglish 現折 NT$200。', sourceIds:['hiram-offer'] },
    { id:'daily-use', text:'遊戲桌面、記憶盒、不求人與鞋拔按日常用途挑選。', sourceIds:['official-product-page','reviewed-product-photo'] },
  ],
  coverage: [
    { factId:'friendship', summary:'多年朋友與宜蘭留宿背景', disposition:'body' },
    { factId:'blocks', summary:'積木規格、木種、玩法與價格', disposition:'body' },
    { factId:'chair', summary:'換板套件與完整組差異', disposition:'body' },
    { factId:'woodwork-story', summary:'木車製作與手作時間', disposition:'body' },
    { factId:'offer', summary:'推薦碼、折扣與分潤揭露', disposition:'body' },
    { factId:'daily-use', summary:'其他木作的用途與選購方式', disposition:'body' },
  ],
  media,
  mediaCoverage: [
    { productId:'forest-blocks', publicName:'森呼吸積木', disposition:'matched_media', mediaIds:['blocks-forest','cover','video-blocks'] },
    { productId:'child-table', publicName:'檜木兒童桌椅', disposition:'matched_media', mediaIds:['cypress-child-table-chairs'] },
    { productId:'fold-table', publicName:'折疊遊戲桌面', disposition:'matched_media', mediaIds:['fold-table-mahjong','fold-table-detail'] },
    { productId:'memory-box', publicName:'時光記憶盒', disposition:'matched_media', mediaIds:['memory-box-dog'] },
    { productId:'cat-scratcher', publicName:'貓咪不求人', disposition:'matched_media', mediaIds:['cat-scratcher'] },
    { productId:'cat-shoehorn', publicName:'黑貓鞋拔', disposition:'matched_media', mediaIds:['cat-shoehorn-whole','cat-shoehorn-detail','cat-shoehorn-use'] },
    { productId:'family-videos', publicName:'朋友與木作影片', disposition:'matched_media', mediaIds:['video-woodwork','video-bed','video-visit','video-market','video-outing'] },
  ],
  releaseCandidate: { articleRoute:'/blog/shinwa-living/', surfaces:['article','blog_index','product_card','sitemap','robots'], productLookupKey:'shinwaLiving', assetPaths:media.map(item => item.path) },
  technicalSeo: {
    author:{ type:'Organization', name:'鷹式一家', url:'https://www.eaglish.store/' }, datePublished:'2026-10-14', dateModified:'2026-10-14',
    social:{ ogImage:'https://www.eaglish.store/assets/shinwa-living/cover.webp', ogImageAlt:alt['cover.webp'], width:1600, height:1000, twitterCard:'summary_large_image' },
    structuredData:['Article','BreadcrumbList'], crawlableOfferFallback:'/',
  },
  bodyText,
  answerBlocks: [
    { question:'心窪生活的木作先從哪一類選？', answer:'一起玩可以先看積木或遊戲桌面；整理閱讀角落看桌椅；送禮看刺繡記憶盒；日常工具則看不求人或鞋拔。', claimIds:['blocks','chair','daily-use'] },
    { question:'兒童桌椅換板套件和完整組差在哪裡？', answer:'NT$6,800 是一張桌板、兩張椅板的升級套件，不含木架；NT$8,800 的完整組才含 IKEA 一桌二椅主體與升級板。', claimIds:['chair'] },
    { question:'推薦折扣碼是什麼？', answer:'在心窪生活官網輸入推薦折扣碼 eaglish，現折 NT$200；未知低消、效期、疊加與適用品項保持省略。', claimIds:['offer'] },
  ],
  categoryCoverage: [
    { question:'產品與品牌是什麼？', disposition:'body' },
    { question:'規格與款式如何比較？', disposition:'body' },
    { question:'如何按使用情境挑選？', disposition:'body' },
    { question:'有哪些真實照片與影片？', disposition:'body' },
    { question:'價格、折扣與揭露是什麼？', disposition:'body' },
    { question:'有哪些未知條件？', disposition:'omitted', reason:'低消、效期、疊加與適用品項未獲確認，不在公開文補寫。' },
  ],
  engineering: { mediaManifest:'assets/shinwa-living/media-manifest.json', candidatePath:'/candidates/shinwa-living-blog-20261014/working-v3/', released:false },
};
writeFileSync(resolve(root, 'docs/shinwa-living-article-package-v4.json'), JSON.stringify(packageData, null, 2) + '\n');
console.log(`Built Shinwa article package with ${bodyText.length} characters`);
