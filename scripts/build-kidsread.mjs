// KidsRead 選物誌系列：從 data/kidsread/catalog.json 產生入口頁＋五篇（docs/kidsread/ARCHITECTURE.md）。
// Usage: node scripts/build-kidsread.mjs [--covers]
//   --covers  另外用 Chromium 依 assets/kidsread/covers/<page>-source.html 重畫六張封面（1600×1000＋480／960）。
// 每頁都是完整的靜態 HTML（Google 讀得到全文），互動由 /blog/kidsread/kidsread.js 疊上去。
// 會一起更新：config/content-articles.json（六篇知識文）、blog/index.html（六張卡片）、
// product-content.js（kidsread 型錄，給購買鈕讀 Sheet）、config/blog-cover-identities.json（封面雜湊）。
// 重跑安全：每一步都覆蓋自己上一次的輸出。
import {readFileSync, writeFileSync, mkdirSync, existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = p => readFileSync(root + p, 'utf8');
const write = (p, s) => { mkdirSync(root + p.replace(/[^/]+$/, ''), {recursive: true}); writeFileSync(root + p, s); };
const sha = p => createHash('sha256').update(readFileSync(root + p.replace(/^\//, ''))).digest('hex');
const esc = v => String(v ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const attr = v => String(v ?? '').replaceAll('&', '&amp;').replaceAll('"', '&quot;');
const ORIGIN = 'https://www.eaglish.store';
const PUBLISHED = '2026-11-23';
const MODIFIED = '2026-11-25';
const SERIES_CSS = '/blog/kidsread/kidsread.css?v=20261123';
const SERIES_JS = '/blog/kidsread/kidsread.js?v=20261123';

const C = JSON.parse(read('data/kidsread/catalog.json'));
const items = C.items.filter(i => i.status === 'active');
const byId = Object.fromEntries(items.map(i => [i.id, i]));
const homeOf = {english: 'kidsread-english', chinese: 'kidsread-chinese'};

// ---------- 頁面設定 ----------
const PAGES = [
  {id: 'hub', slug: 'kidsread', key: 'kidsread', n: '⓪', nav: 'KidsRead 指南',
    title: 'KidsRead 點讀筆完整指南：幾歲開始、怎麼選、這次有哪些點讀教材',
    h1: 'KidsRead 點讀筆完整指南：<em>陪孩子從 ABC 讀到小說。</em>',
    eyebrow: '點讀筆・完整指南', crumb: 'KidsRead 點讀筆指南',
    desc: `KidsRead 點讀筆怎麼選？鷹式一家整理這次開團的 ${items.length} 套點讀教材：依孩子年齡和想學的內容篩選，看鷹家推薦、點讀筆單筆套組和單筆差在哪，再連到英文、中文教材全書單與自然發音、注音路線。`,
    excerpt: '這次開團的點讀教材一次看：依年齡篩選、鷹家推薦，和點讀筆單筆套組怎麼選。',
    keywords: ['KidsRead', 'KidsRead 點讀筆', '點讀筆推薦', '點讀教材', '幼兒英文啟蒙'],
    readLabel: '依年齡挑點讀教材 →', meta: '點讀筆指南',
    cover: {title: 'KidsRead<br>點讀筆指南', sub: '依年齡挑教材，一次看懂', photo: '/assets/kidsread/2023-08-DSC07764.webp'}},
  {id: 'pen', slug: 'kidsread-pen', key: 'kidsreadPen', n: '①', nav: '點讀筆',
    title: '為什麼需要 KidsRead 點讀筆？錄音貼紙、四種聲音與孩子自學的心得',
    h1: '為什麼需要 KidsRead 點讀筆？',
    eyebrow: '點讀筆・使用心得', crumb: '為什麼需要點讀筆',
    desc: 'KidsRead 錄音點讀筆能點讀全系列教材，也能用錄音貼紙把家裡原本的書變成點讀書，一張貼紙可以錄中文、英文、第三種語言和解釋。整理鷹式一家用點讀筆陪孩子學習的心得，和 PLUS 3.0 單筆套組怎麼選。',
    excerpt: '內容、延伸性、自學動機：我們家最後只留 KidsRead 的原因，和 PLUS 3.0 怎麼選。',
    keywords: ['KidsRead 點讀筆', '錄音點讀筆', '點讀筆推薦', '錄音貼紙', 'PLUS 3.0'],
    readLabel: '看點讀筆怎麼用 →', meta: '點讀筆心得',
    cover: {title: '為什麼需要<br>點讀筆？', sub: 'KidsRead 錄音貼紙與自學心得', photo: C.pen.intro.find(b => b.t === 'img').f}},
  {id: 'reading', slug: 'kidsread-phonics-roadmap', key: 'kidsreadPhonicsRoadmap', n: '②', nav: '自然發音路線',
    title: 'KidsRead 自然發音路線圖：從字母、拼讀到英文小說，一階一階往上',
    h1: 'KidsRead 自然發音路線圖：從字母到英文小說',
    eyebrow: '英文閱讀・路線圖', crumb: '自然發音路線圖',
    desc: '自然發音怎麼教？把 KidsRead 英文點讀教材照程度排成六階：字母、自然發音、CVC 拼讀、常見字與分級讀本、橋樑書、章節小說。每一階列出適合的教材和年齡，看孩子現在在哪一階、下一步讀什麼。',
    excerpt: '字母 → 自然發音 → 拼讀 → 分級讀本 → 橋樑書 → 小說，每一階讀什麼。',
    keywords: ['自然發音怎麼教', '英文分級讀本', '點讀橋樑書', 'KidsRead 自然發音', '英文閱讀路線'],
    readLabel: '看孩子在哪一階 →', meta: '英文閱讀',
    cover: {title: '自然發音<br>路線圖', sub: 'KidsRead 從字母讀到小說', photo: '/assets/kidsread/2023-12-DSC01912.webp'}},
  {id: 'english', slug: 'kidsread-english', key: 'kidsreadEnglish', n: '③', nav: '英文教材全書單',
    title: 'KidsRead 英文教材全書單：自然發音、英文繪本、翻翻書依年齡挑',
    h1: 'KidsRead 英文教材全書單',
    eyebrow: '英文教材・全書單', crumb: '英文教材全書單',
    desc: `KidsRead 英文點讀教材全書單：自然發音讀本、JY Books 英文繪本與童謠洞洞書、找找書、翻翻書、科普和故事，共 ${items.filter(i => i.home === 'english').length} 套。每套寫清楚適讀年齡、內容物和點讀筆能做什麼，可以依年齡和類型篩選。`,
    excerpt: '全部英文點讀教材：每套的適讀年齡、內容物、點讀筆能做什麼。',
    keywords: ['KidsRead 英文教材', '英文點讀繪本', '英文繪本推薦', '幼兒英文教材', '點讀筆教材'],
    readLabel: '看全部英文教材 →', meta: '英文教材',
    cover: {title: '英文教材<br>全書單', sub: 'KidsRead 依年齡挑英文點讀書', photo: '/assets/kidsread/2026-11-IMG_1423.webp'}},
  {id: 'zhuyin', slug: 'kidsread-zhuyin', key: 'kidsreadZhuyin', n: '④', nav: '注音與識字',
    title: 'KidsRead 注音教材怎麼選：ㄅㄆㄇ初階、進階、拼音練習到認國字',
    h1: 'KidsRead 注音教材怎麼選：ㄅㄆㄇ初階到進階',
    eyebrow: '注音・識字', crumb: '注音教材怎麼選',
    desc: '孩子學注音從哪一套開始？KidsRead 的小康軒注音教材分初階商店街、進階故事王國和拼音機器人，學完再用文字魔法世界認常用國字。依孩子的程度和年齡比較，三套注音教材也可以一起買。',
    excerpt: 'ㄅㄆㄇ從哪一套開始：初階、進階、拼音練習，學完接著認國字。',
    keywords: ['注音怎麼學', 'ㄅㄆㄇ教材', '注音點讀', '小康軒注音', 'KidsRead 注音'],
    readLabel: '看注音從哪一套開始 →', meta: '注音教材',
    cover: {title: '注音教材<br>怎麼選', sub: 'KidsRead ㄅㄆㄇ初階到進階', photo: byId['k47'] ? byId['k47'].cover : '/assets/kidsread/2024-08-DSC07533.webp'}},
  {id: 'chinese', slug: 'kidsread-chinese', key: 'kidsreadChinese', n: '⑤', nav: '中文教材全書單',
    title: 'KidsRead 中文教材全書單：注音、識字、知識立體書、唐詩與名人故事',
    h1: 'KidsRead 中文教材全書單',
    eyebrow: '中文教材・全書單', crumb: '中文教材全書單',
    desc: `KidsRead 中文與雙語點讀教材全書單：注音與識字、KiDiDOC 知識立體書、西遊記立體書、與狗店長樂讀詩、小不點大夢想名人傳記等，共 ${items.filter(i => i.home === 'chinese').length} 套。每套寫清楚適讀年齡、內容物和點讀功能，可以依年齡和主題篩選。`,
    excerpt: '全部中文與雙語點讀教材：注音、識字、知識書、唐詩、名人故事。',
    keywords: ['KidsRead 中文教材', '中文點讀書', '注音點讀', '兒童知識立體書', '點讀筆教材'],
    readLabel: '看全部中文教材 →', meta: '中文教材',
    cover: {title: '中文教材<br>全書單', sub: 'KidsRead 注音、知識書、唐詩', photo: '/assets/kidsread/2024-08-DSC07493.webp'}},
];
const P = Object.fromEntries(PAGES.map(p => [p.id, p]));
const url = p => `/blog/${p.slug}/`;
const coverPath = p => `/assets/kidsread/covers/${p.id}.webp`;
const coverAlt = p => `${p.cover.title.replace(/<br>/g, '')}：${p.cover.sub}`;

// ---------- 內文區塊 ----------
const imgTag = (b, extra = '') => `<img src="${attr(b.f)}" width="${b.w}" height="${b.h}" alt="${attr(b.alt || b.cap || '')}" loading="lazy" decoding="async"${extra}>`;
function blocks(bs, {skipH2 = false} = {}) {
  return bs.map(b => {
    switch (b.t) {
      case 'p': { const h = b.html.trim(); return h ? `<p>${h}</p>` : ''; }
      case 'img': return (b.alt || b.cap) ? `<figure>${imgTag(b)}${b.cap ? `<figcaption>${esc(b.cap)}</figcaption>` : ''}</figure>` : `<figure>${imgTag({...b, alt: '教材實拍'})}</figure>`;
      case 'gallery': return `<div class="kr-gallery">${b.items.map(i => `<figure>${imgTag({...i, alt: i.alt || i.cap || '教材實拍'})}${i.cap ? `<figcaption>${esc(i.cap)}</figcaption>` : ''}</figure>`).join('')}</div>`;
      case 'h2': return skipH2 ? '' : `<h4>${esc(b.text)}</h4>`;
      case 'ul': case 'ol': return `<${b.t}>${b.items.map(x => `<li>${x}</li>`).join('')}</${b.t}>`;
      case 'hr': return '';
      default: return '';
    }
  }).join('\n');
}
// 原文裡的 <h2>／<h3> 轉成 h3／h4，讓頁面只有一個 h1、層級正確
const demote = html => html.replace(/<(\/?)h3>/g, '<$1h4>');

const rangesOf = a => a ? [a.together, a.alone, a.general].filter(Boolean).map(([lo, hi]) => `${lo}-${hi ?? ''}`).join(',') : '';
const langText = {en: '英文', zh: '中文', bi: '雙語', multi: '三語', none: '音樂・圖卡'};
const cats = Object.fromEntries(C.cats.map(c => [c.id, c.label]));
const goalOf = it => it.guide || it.home;
function badges(it) {
  return `<div class="kr-badges">${it.isNew ? '<span class="kr-badge kr-new">這次新品</span>' : ''}${it.ages ? `<span class="kr-badge kr-age">${esc(it.ages.label)}</span>` : '<span class="kr-badge kr-todo">年齡待補</span>'}<span class="kr-badge">${langText[it.lang] || ''}</span></div>`;
}
const bookId = it => 'book-' + it.id;
const bookHref = it => `/blog/${homeOf[it.home]}/#${bookId(it)}`;
function card(it, here) {
  const href = here === it.home ? `#${bookId(it)}` : bookHref(it);
  return `<li class="kr-card" data-book="${attr(it.id)}" data-ranges="${attr(rangesOf(it.ages))}" data-goal="${attr(goalOf(it))}" data-tags="${attr((it.tags || []).join(' '))}" data-guide="${attr(it.guide || '')}"><a href="${attr(href)}"><img src="${attr(it.cover)}" width="640" height="480" alt="${attr(it.name)}" loading="lazy" decoding="async"><span class="kr-card-body"><strong>${esc(it.name)}</strong>${badges(it)}<span class="kr-sum">${esc(it.summary)}</span></span></a></li>`;
}
const grid = (list, here, label) => `<ul class="kr-grid" data-kr-grid aria-label="${attr(label)}">${list.map(it => card(it, here)).join('')}</ul>`;

function seriesNav(cur) {
  return `<nav class="kr-series" aria-label="KidsRead 系列">${PAGES.map(p => `<a href="${url(p)}"${p.id === cur ? ' aria-current="page"' : ''}><span>${p.n}</span>${esc(p.nav)}</a>`).join('')}</nav>`;
}
function crumbs(p) {
  return p.id === 'hub' ? '' : `<p class="kr-crumb"><a href="${url(P.hub)}">KidsRead 指南</a> › ${esc(p.crumb)}</p>`;
}
function filterBlock(list, {goals = false, tags = false, guide = null} = {}) {
  const AG = [['all', '全部年齡'], ['0-3', '0–2 歲'], ['3-6', '3–5 歲'], ['6-99', '6 歲以上']];
  const GO = [['all', '都看看'], ['reading', '自然發音・英文閱讀'], ['english', '英文繪本・遊戲書'], ['zhuyin', '注音・識字'], ['chinese', '中文知識・繪本']];
  const tagIds = [...new Set(list.flatMap(i => i.tags || []))].filter(t => cats[t]);
  const chip = (set, v, label, on) => `<button type="button" class="kr-chip" data-kr-filter="${set}" data-v="${v}" aria-pressed="${on}">${esc(label)}</button>`;
  return `<div class="kr-finder" data-kr-finder hidden>
<p class="kr-q" id="kr-q-age">孩子幾歲？</p><div class="kr-chips" role="group" aria-labelledby="kr-q-age">${AG.map(([v, l], i) => chip('age', v, l, i === 0)).join('')}</div>
${goals ? `<p class="kr-q" id="kr-q-goal">想先學什麼？</p><div class="kr-chips" role="group" aria-labelledby="kr-q-goal">${GO.map(([v, l], i) => chip('goal', v, l, i === 0)).join('')}</div>` : ''}
${tags ? `<p class="kr-q" id="kr-q-tag">想找哪一類？</p><div class="kr-chips" role="group" aria-labelledby="kr-q-tag">${chip('tag', 'all', '全部', true)}${guide ? chip('tag', 'guide:' + guide.id, guide.label, false) : ''}${tagIds.map(t => chip('tag', t, cats[t], false)).join('')}</div>` : ''}
<p class="kr-count" aria-live="polite">找到 <b data-kr-count>${list.length}</b> 套</p></div>`;
}
const listButton = '<button type="button" class="kr-listbtn" data-kr-open-list hidden>選購清單 <b data-kr-list-count>0</b></button>';

function bookSection(it) {
  const note = it.variants?.length ? `<div class="kr-variants"><p><strong>這次可以買</strong></p><ul>${it.variants.map(v => `<li>${esc(v)}</li>`).join('')}</ul></div>` : '';
  return `<section class="kr-book" id="${bookId(it)}" data-book-section="${attr(it.id)}">
<h3>${esc(it.name)}</h3>
${badges(it)}
${note}
<div class="kr-prose">${demote(blocks(it.blocks))}</div>
<p class="kr-book-actions"><button type="button" class="kr-add" data-kr-add="${attr(it.id)}" hidden>加入選購清單</button><a href="#kr-books">回到書單 ↑</a></p>
</section>`;
}

// ---------- FAQ（每頁至少三題，依頁面主題） ----------
const FAQ = {
  hub: [
    ['幾歲可以開始用點讀筆？', '新生兒就有有聲黑白卡；0–3 歲可以從英文童謠洞洞書、翻翻書開始；3 歲以後再接自然發音和注音。上面的選書器選年齡，就會列出適合的教材。'],
    ['單筆套組和單筆差在哪？', '差在錄音貼紙冊。第一次買選單筆套組，可以把家裡原本的書錄成點讀書；已經有貼紙、想給第二個孩子多一支筆，選單筆。'],
    ['中文書也能點嗎？', '可以。注音、識字、唐詩、知識書都有點讀版，雙語書還能切換中英文。'],
    ['每本書的完整介紹在哪裡看？', '英文教材在「英文教材全書單」，中文教材在「中文教材全書單」。點任何一張書卡，也可以直接看重點。']],
  pen: [
    ['點讀筆一定要搭配 KidsRead 的書嗎？', '全系列 KidsRead 點讀書都能直接點；家裡原本的書，也可以貼上錄音貼紙，自己錄聲音進去，變成點讀書。'],
    ['錄音貼紙一張可以錄幾種聲音？', '一張貼紙有 A、B、C、D 四個位置，可以分別錄中文、英文、第三種語言和解釋，切換位置再點同一張貼紙，就會播不同的聲音。'],
    ['新出的教材要怎麼放進點讀筆？', '第一次買的教材，廠商會先把音檔放進筆裡；之後買新的教材，到 KidsRead 官網下載那本書的音檔，放進點讀筆就能用。'],
    ['PLUS 3.0 單筆套組和單筆怎麼選？', '單筆套組多一本錄音貼紙冊，第一次買選這個；已經有貼紙、想多一支筆，選單筆。']],
  reading: [
    ['孩子還不認得字母，可以直接學自然發音嗎？', '可以邊聽邊學。先從字母說唱、有聲積木熟悉 26 個字母的名稱和聲音，再進自然發音讀本，會比較順。'],
    ['怎麼知道孩子該往下一階了？', '這一階的書孩子可以自己點著讀、聽完能跟著唸，就可以往下一階；卡住的時候回上一階多讀幾輪也很正常。'],
    ['這次沒有開團的階段怎麼辦？', '常見字與分階讀本這一階這次沒有教材，可以先用自然發音讀本多讀幾輪，再接橋樑書。'],
    ['路線圖上的書完整介紹在哪裡？', '每本書的完整介紹都在「英文教材全書單」，點書卡就會帶你過去。']],
  english: [
    ['英文繪本要選有歌的，還是故事的？', '0–3 歲先從童謠、歌謠開始，聽熟了再回到書上指著字讀；3 歲以後可以加入故事和找找書，最後接自然發音讀本。'],
    ['書上寫的「親子共讀」和「自主閱讀」差在哪？', '親子共讀是爸媽陪著讀的年齡；自主閱讀是孩子可以自己拿點讀筆點著讀的年齡。同一本書兩段都寫的，就是可以讀很久。'],
    ['JY Books 的繪本可以單本買嗎？', '可以。艾瑞卡爾、Keith Baker 的繪本和童謠洞洞書，這次整套或單本都能買。'],
    ['找不到年齡寫法的書怎麼辦？', '頁面上寫「年齡待補」的，是我們還沒在官方資料上找到年齡，會再補上，不自己猜。']],
  zhuyin: [
    ['孩子還沒碰過注音，要從哪一套開始？', '從初階的商店街開始：先認聲符、韻符，再接進階的故事王國學拼音和聲調。'],
    ['已經認得符號了，還需要初階嗎？', '已經會認符號，可以直接看進階的故事王國，練二拼、三拼和結合韻。'],
    ['三套一起買有什麼不一樣？', '商店街、故事王國和拼音機器人三套一起買，加贈 3 本非點讀的趣味寫字本。'],
    ['注音學完接下來做什麼？', '用《文字魔法世界》認常用國字：繪本、遊戲圖卡和部首變身，從注音順順接到識字。']],
  chinese: [
    ['中文點讀書都有注音嗎？', '大部分給幼兒的中文點讀書都有注音；唐詩操作書還附漢語拼音和中英雙語故事。每本的細節寫在介紹裡。'],
    ['雙語書可以切換中英文嗎？', '有標示中英雙語點讀的書，可以切換中文和英文朗讀，例如小不點大夢想、那裡怪怪的。'],
    ['知識立體書適合幾歲？', 'KiDiDOC 是 3–4 歲親子共讀、5–8 歲可以自己讀；不可思議系列和翻玩看世界是 3–4 歲共讀、4–6 歲自己讀。'],
    ['這次有哪些新加入的中文書？', '狗探長的倫敦謎案大追查、文字魔法世界、小小書蟲俱樂部第 2 輯、不可思議系列立體書等，卡片上有「這次新品」標籤。']],
};
const faqHtml = (id, n) => `<section id="faq" data-editorial-section><p class="section-label">${n}</p><h2>常見問題</h2>${FAQ[id].map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</section>`;

function offerHtml(n) {
  // 檔期以團購 Sheet「Kidsread 點讀筆」為準（Hiram 2026-11-24 更正為 11/30 開團）；結束日待 Hiram 確認前不寫
  return `<section id="offer" class="purchase" data-editorial-section><p class="section-label">${n}</p><h2>KidsRead 團購 11/30（一）開團</h2><p>KidsRead 這一檔 2026/11/30（一）開團。開團前可以先在這系列文章挑好教材、加進選購清單；開團後按下面的按鈕就能下單。</p>${listButton}<a class="offer-link" href="/#catalog" data-sheet-offer data-open-label="選購 KidsRead 點讀教材 ↗" data-editorial-exclude>到買物社查看當期團購 ↗</a><p>本文含團購連結。</p><noscript><p data-editorial-exclude>請到<a href="/">買物社</a>查看當期團購。</p></noscript></section>`;
}

function nextReads(cur) {
  const others = PAGES.filter(p => p.id !== cur);
  return `<section id="series" data-editorial-section><p class="section-label">KidsRead 系列</p><h2>接著讀</h2><ul class="kr-next">${others.map(p => `<li><a href="${url(p)}"><img src="${coverPath(p).replace('.webp', '-480.webp')}" width="480" height="300" alt="${attr(coverAlt(p))}" loading="lazy" decoding="async"><span>${p.n} ${esc(p.nav)}</span></a></li>`).join('')}</ul></section>`;
}

// ---------- 各頁主體 ----------
const PEN_PRODUCTS = C.pen.products || [];
function body(p) {
  const S = [];
  if (p.id === 'hub') {
    const picksBy = a => (C.picks || []).filter(x => x.age === a).map(x => ({...x, it: byId[x.id]})).filter(x => x.it);
    S.push(['finder', '找教材', '30 秒找到適合的教材', `<p>選孩子的年齡和想先學的，下面的書單會馬上更新。每張卡片點進去，可以看那套教材的完整介紹。</p>${filterBlock(items, {goals: true})}${listButton}<div id="kr-books">${grid(items, 'hub', '全部教材')}</div>`]);
    S.push(['picks', '鷹家推薦', '不知道選哪個？鷹家先幫你挑', [['0-3', '0–2 歲'], ['3-6', '3–5 歲'], ['6+', '6 歲以上']].map(([a, l]) => `<h3>${l}</h3><ul class="kr-picks">${picksBy(a).map(x => `<li><a href="${attr(bookHref(x.it))}" data-book="${attr(x.it.id)}"><img src="${attr(x.it.cover)}" width="208" height="208" alt="${attr(x.it.name)}" loading="lazy" decoding="async"></a><div><p><strong>${esc(x.it.name)}</strong></p><p>${esc(x.why)}</p><button type="button" class="kr-add" data-kr-add="${attr(x.it.id)}" hidden>加入選購清單</button></div></li>`).join('')}</ul>`).join('')]);
    S.push(['buy', '怎麼買', '先選點讀筆，再依年齡配一套', `<p>所有教材都不含點讀筆。第一次買要筆加教材；家裡已經有 KidsRead 點讀筆，只挑教材就好。</p><div class="kr-buy">${PEN_PRODUCTS.map(x => `<div><h3>${esc(x.name)}</h3><p>${esc(x.who)}</p><ul>${x.contents.map(c => `<li>${esc(c)}</li>`).join('')}</ul></div>`).join('')}</div><p>PLUS 3.0：${(C.pen.specs || []).map(esc).join('、')}。</p>`]);
    S.push(['guides', '五篇導覽', '依孩子的需要，從這幾篇開始', `<ul class="kr-next kr-guides">${PAGES.filter(x => x.id !== 'hub').map(x => `<li><a href="${url(x)}"><img src="${coverPath(x).replace('.webp', '-480.webp')}" width="480" height="300" alt="${attr(coverAlt(x))}" loading="lazy" decoding="async"><span>${x.n} ${esc(x.nav)}</span><small>${esc(x.excerpt)}</small></a></li>`).join('')}</ul>`]);
  }
  if (p.id === 'pen') {
    S.push(['why', '我們的經驗', '市面上點讀筆很多，我們最後只留 KidsRead', `<div class="kr-prose">${demote(blocks(C.pen.intro.filter(b => b.t !== 'h2' && b !== C.pen.intro.find(x => x.t === 'img'))))}</div>`]);
    C.pen.sections.forEach((s, i) => S.push([`pen-${i + 1}`, `優勢 ${i + 1}`, s.name.replace(/\s+/g, ''), `<div class="kr-prose">${demote(blocks(s.blocks))}</div>`]));
    S.push(['sticker', '試試看', '一張錄音貼紙，可以放四種聲音', `<div class="kr-sticker" data-kr-sticker><p>點 A、B、C、D，看同一張貼紙可以錄什麼。</p><div class="kr-tabs" role="group" aria-label="貼紙位置">${'ABCD'.split('').map((k, i) => `<button type="button" data-kr-path="${k}" aria-pressed="${i === 0}">${k}</button>`).join('')}</div><p class="kr-out" aria-live="polite" data-kr-out>A・中文：「蘋果」，爸媽自己錄的中文唸法</p></div>`]);
    S.push(['buy', '怎麼買', 'PLUS 3.0 單筆套組和單筆怎麼選', `<div class="kr-buy">${PEN_PRODUCTS.map(x => `<div><h3>${esc(x.name)}</h3><p>${esc(x.who)}</p><ul>${x.contents.map(c => `<li>${esc(c)}</li>`).join('')}</ul></div>`).join('')}</div><p>PLUS 3.0：${(C.pen.specs || []).map(esc).join('、')}。</p><p><a href="${url(P.hub)}#finder">接著依孩子年齡挑教材 →</a></p>`]);
  }
  if (p.id === 'reading') {
    const intro = '<p>英文教材照孩子的程度排成六階。每一階先寫孩子這時候在學什麼，再列出適合的教材；點書卡會帶你到英文教材全書單，看那套書的完整介紹。</p>';
    S.push(['road', '六階路線', '先看孩子現在在哪一階', intro + `<ol class="kr-road">${C.stages.map((s, i) => `<li><a href="#stage-${s.id}"><span>${i + 1}</span>${esc(s.label)}</a></li>`).join('')}</ol>`]);
    const STAGE_TEXT = {
      alphabet: '先認識 26 個字母的名稱、形狀和發音。用歌謠、說唱和有聲積木，讓孩子邊玩邊把字母聽熟。',
      phonics: '學字母在單字裡發什麼音。從歌謠和短句開始，一個音一個音聽熟，再看到字就能唸出來。',
      cvc: '練「子音＋母音＋子音」的拼讀，例如 c-a-t。孩子會開始自己把字拼出來，閱讀的信心也從這裡建立。',
      sight: '常見字是很常出現、但不一定照規則發音的字，搭配分階讀本一階一階讀，閱讀速度會變快。',
      bridge: '從短短的讀本走到文字比較多的橋樑書，句子變長、故事變完整，孩子開始可以自己讀完一本書。',
      chapter: '章節小說有完整的故事和角色，點讀版可以逐字、整段或用廣播劇的方式聽，陪孩子讀完第一本英文小說。'};
    C.stages.forEach((s, i) => {
      const list = items.filter(it => it.guide === 'reading' && it.stage === s.id);
      S.push([`stage-${s.id}`, `第 ${i + 1} 階`, s.label, `<p>${STAGE_TEXT[s.id] || ''}</p>${list.length ? grid(list, 'reading', s.label) : '<p class="kr-empty">這一階這次沒有開團的教材。孩子到這個程度時，可以先回上一階多讀幾輪，或往下一階看看。</p>'}`]);
    });
  }
  if (p.id === 'english' || p.id === 'chinese') {
    const list = items.filter(i => i.home === p.id);
    const intro = (p.id === 'english' ? C.enIntro : C.zhIntro).filter(b => b.t !== 'h2');
    const guide = p.id === 'english' ? {id: 'reading', label: '自然發音・讀本'} : {id: 'zhuyin', label: '注音・識字'};
    S.push(['intro', '前言', p.id === 'english' ? '我們家怎麼用 KidsRead 學英文' : '我們家怎麼用 KidsRead 讀中文', `<div class="kr-prose">${demote(blocks(intro))}</div>`]);
    S.push(['kr-books', '書單', `全部 ${list.length} 套，依年齡和類型挑`, `<p>先選孩子的年齡和想找的類型，書單會馬上更新；點書卡會跳到那套書的完整介紹。</p>${filterBlock(list, {tags: true, guide})}${listButton}${grid(list, p.id, '全部教材')}`]);
    S.push(['books', '完整介紹', '每一套教材的完整介紹', list.map(bookSection).join('\n')]);
  }
  if (p.id === 'zhuyin') {
    const list = items.filter(i => i.guide === 'zhuyin');
    S.push(['start', '從哪一套開始', '先看孩子現在的程度', '<p>注音教材分初階和進階。還沒碰過注音的孩子，先從初階的「ㄅㄆㄇ商店街」開始，認聲符和韻符；已經認得符號的，可以直接看進階的「ㄅㄆㄇ故事王國」，練二拼、三拼、聲調和結合韻。「小康軒拼音機器人」用注音符號卡和拼音底板練拼音，適合想多玩幾輪的孩子。</p><p>注音熟了以後，接著用《文字魔法世界》認常用國字：繪本帶出情境，部首變身延伸出更多字詞，從注音順順接到識字。四套都是小康軒的教材，可以一路接著用。</p><div class="kr-steps"><p><strong>1</strong> 初階：認符號</p><p><strong>2</strong> 進階：拼音、聲調</p><p><strong>3</strong> 拼音練習</p><p><strong>4</strong> 認國字</p></div>']);
    S.push(['kr-books', '四套比較', '四套注音與識字教材', `<p>點書卡會帶你到中文教材全書單，看那套書的完整介紹。三套注音教材（商店街、故事王國、拼音機器人）也可以一起買，加贈 3 本非點讀的趣味寫字本。</p>${listButton}${grid(list, 'zhuyin', '注音與識字教材')}`]);
    S.push(['ages', '適讀年齡', '幾歲用哪一套', `<div class="table-scroll" role="region" tabindex="0" aria-label="注音教材適讀年齡"><table><thead><tr><th scope="col">教材</th><th scope="col">適讀年齡</th></tr></thead><tbody>${list.map(it => `<tr><th scope="row">${esc(it.name)}</th><td>${esc(it.ages?.label || '年齡待補')}</td></tr>`).join('')}</tbody></table></div><p>年齡依 KidsRead 官網商品頁的「適讀年齡」。</p>`]);
  }
  return S;
}

function opening(p) {
  const answers = {
    hub: `<p><strong>先講結論：</strong>點讀筆只要一支 KidsRead PLUS 3.0，再依孩子的年齡配教材。0–2 歲從有聲黑白卡、英文童謠洞洞書開始；3–5 歲接自然發音和注音；6 歲以上讀橋樑書、章節小說和知識立體書。這次開團一共 ${items.length} 套教材，下面可以依年齡和想學的內容篩選。</p>`,
    pen: '<p><strong>先講結論：</strong>點讀筆的價值不只在點讀教材，而是「錄音貼紙」：一張貼紙能錄中文、英文、第三種語言和解釋，家裡原本的書也能變成點讀書。我們家比較過很多點讀筆，最後只留 KidsRead，原因是內容、延伸性和自學動機。</p>',
    reading: '<p><strong>先講結論：</strong>自然發音照這個順序走：字母 → 自然發音 → CVC 拼讀 → 常見字與分階讀本 → 橋樑書 → 章節小說。每一階用點讀筆邊聽邊讀，孩子可以自己點著讀了，就往下一階。</p>',
    english: `<p><strong>先講結論：</strong>這次 KidsRead 英文教材一共 ${items.filter(i => i.home === 'english').length} 套：0–3 歲先從童謠、翻翻書和有聲黑白卡開始，3–5 歲接自然發音讀本和找找書，6 歲以上讀橋樑書和英文小說。每套都寫了適讀年齡、內容物和點讀筆能做什麼。</p>`,
    zhuyin: '<p><strong>先講結論：</strong>還沒碰過注音，從初階「ㄅㄆㄇ商店街」開始；已經認得符號，直接用進階「ㄅㄆㄇ故事王國」練拼音和聲調；注音熟了再用《文字魔法世界》認國字。三套注音教材一起買，加贈 3 本趣味寫字本。</p>',
    chinese: `<p><strong>先講結論：</strong>這次 KidsRead 中文與雙語教材一共 ${items.filter(i => i.home === 'chinese').length} 套：注音和識字、KiDiDOC 與不可思議系列等知識立體書、西遊記立體書、唐詩操作書、名人傳記和偵探推理書。每套都寫了適讀年齡、內容物和點讀功能。</p>`,
  };
  return `<section class="opening" id="intro" data-editorial-section data-answer-block>
${crumbs(p)}<p class="eyebrow">${esc(p.eyebrow)}</p>
<h1>${p.h1}</h1>
<p class="byline">鷹式一家｜${esc(p.meta)}｜2026/11/23</p>
<div class="answer">${answers[p.id]}</div><img class="article-cover" src="${coverPath(p)}" alt="${attr(coverAlt(p))}" width="1600" height="1000" fetchpriority="high">
${seriesNav(p.id)}
</section>`;
}

function page(p) {
  const S = body(p);
  const nLabel = i => String(i + 1).padStart(2, '0');
  const sections = S.map(([id, label, h2, html], i) => `<section id="${id}" data-editorial-section>\n<p class="section-label">${nLabel(i)}・${esc(label)}</p>\n<h2>${esc(h2)}</h2>\n${html}\n</section>`).join('\n\n');
  const toc = `<nav class="choice-links" data-reading-nav aria-label="文章目錄">${S.map(([id, label]) => `<a href="#${id}">${esc(label)}</a>`).join('')}<a href="#faq">常見問題</a><a href="#offer">開團</a></nav>`;
  const canonical = ORIGIN + url(p);
  const titleTag = `${p.title}｜鷹家選物誌`;
  const ld = {'@context': 'https://schema.org', '@graph': [
    {'@type': 'Article', headline: p.title, description: p.desc, image: [ORIGIN + coverPath(p)], datePublished: PUBLISHED, dateModified: MODIFIED, inLanguage: 'zh-Hant-TW',
      author: {'@type': 'Organization', name: '鷹式一家', url: ORIGIN + '/'}, publisher: {'@type': 'Organization', '@id': ORIGIN + '/#organization', name: '鷹式一家', url: ORIGIN + '/'},
      mainEntityOfPage: canonical, isAccessibleForFree: true, keywords: p.keywords},
    {'@type': 'BreadcrumbList', itemListElement: [
      {'@type': 'ListItem', position: 1, name: '鷹家買物社', item: ORIGIN + '/'},
      {'@type': 'ListItem', position: 2, name: '鷹家選物誌', item: ORIGIN + '/blog/'},
      ...(p.id === 'hub' ? [] : [{'@type': 'ListItem', position: 3, name: 'KidsRead 點讀筆指南', item: ORIGIN + url(P.hub)}]),
      {'@type': 'ListItem', position: p.id === 'hub' ? 3 : 4, name: p.crumb, item: canonical}]}]};
  return `<!doctype html>
<html lang="zh-Hant-TW"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="index,follow,max-image-preview:large"><title>${esc(titleTag)}</title><meta name="description" content="${attr(p.desc)}"><link rel="canonical" href="${canonical}"><meta property="og:type" content="article"><meta property="og:title" content="${attr(titleTag)}"><meta property="og:description" content="${attr(p.desc)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${ORIGIN + coverPath(p)}"><meta property="og:image:width" content="1600"><meta property="og:image:height" content="1000"><meta property="og:image:alt" content="${attr(coverAlt(p))}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${ORIGIN + coverPath(p)}"><link rel="stylesheet" href="/product-content.css?v=20260911-video-poster-${p.slug}"><link rel="stylesheet" href="/articles/article.css?v=20261112-offer"><link rel="stylesheet" href="/release.css"><link rel="stylesheet" href="/blog/journal-nav.css?v=20260910-2"><link rel="stylesheet" href="/blog/reading-nav.css?v=20260926-all-articles"><link rel="stylesheet" href="/content-hubs.css"><link rel="stylesheet" href="${SERIES_CSS}"><script defer src="/product-content.js?v=20260911-video-poster-${p.slug}"></script><script defer src="/design/papaparse.min.js"></script><script defer src="/articles/floating-offer.js"></script><script defer src="/articles/sheet-offer.js" data-catalog-key="kidsread"></script><script defer src="${SERIES_JS}"></script><script defer src="/site-runtime.js"></script><script defer src="/blog/journal-nav.js?v=20260910-2"></script><script defer src="/blog/reading-nav.js?v=20260926-all-articles"></script><script type="application/ld+json">${JSON.stringify(ld)}</script></head>
<body class="kidsread-series" data-article-key="${p.key}" data-kr-page="${p.id}" data-reading-nav-instant><a class="skip" href="#article">跳到文章</a><div class="journal-chrome"><header class="masthead"><a class="brand" href="/blog/" aria-label="鷹家選物誌，返回首頁"><span class="sr-only">鷹家選物誌</span><img src="/assets/editorial/eaglish-journal-wordmark-v1.svg" width="420" height="100" alt="" aria-hidden="true"></a><a href="/blog/">回到選物誌 ↗</a></header></div>
<main id="article" class="article-layout"><article><div class="article-body">
${opening(p)}
${toc}

${sections}

${faqHtml(p.id, String(S.length + 1).padStart(2, '0') + '・常見問題')}

${offerHtml(String(S.length + 2).padStart(2, '0') + '・開團')}
${nextReads(p.id)}
</div></article>
<dialog class="kr-sheet" id="kr-sheet" aria-labelledby="kr-sheet-title"></dialog>
</main>
</body></html>
`;
}

// ---------- 封面（--covers） ----------
function coverSource(p) {
  // 實拍照滿版；標題放在左下角的紙色小框，綠色只當點綴（Hiram 2026-11-23：「綠色都是點綴用的，不需要這麼大塊」）
  return `<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><title>${esc(p.nav)}封面原稿</title><style>*{box-sizing:border-box}body{margin:0}p,h1{margin:0}
.stage{position:relative;width:1600px;height:1000px;overflow:hidden;background:#faf9f3;font-family:"Noto Serif CJK TC","Noto Serif TC","Songti TC",serif;color:#333b32}
.photo{position:absolute;inset:0}
.photo img{width:100%;height:100%;object-fit:cover;display:block}
.card{position:absolute;left:56px;bottom:56px;max-width:700px;background:rgba(250,249,243,.96);padding:36px 44px 38px;border-left:8px solid #36594f}
.brand{font:600 26px "Noto Serif CJK TC",serif;letter-spacing:.2em;color:#9a654c;margin-bottom:14px}
h1{font-size:84px;font-weight:600;line-height:1.2;letter-spacing:.02em}
h1 small{display:block;font-size:40px;color:#36594f;font-weight:600;letter-spacing:.06em;margin-bottom:6px}
.sub{font:500 30px/1.5 "Noto Sans CJK TC","Noto Sans TC",sans-serif;margin-top:16px;color:#646b60}
</style><div class="stage"><div class="photo"><img src="../${p.cover.photo.split('/').pop()}" alt=""></div><div class="card"><p class="brand">鷹家選物誌</p><h1><small>KidsRead</small>${(t => t.replace(/<br>/g, '').length > 7 ? t : t.replace(/<br>/g, ''))(p.cover.title.replace(/^KidsRead<br>/, ''))}</h1><p class="sub">${esc(p.cover.sub)}</p></div></div></html>
`;
}

async function renderCovers() {
  const {createRequire} = await import('node:module');
  const {chromium} = createRequire(import.meta.url)('playwright');
  const sharp = (await import('sharp')).default;
  const browser = await chromium.launch();
  for (const p of PAGES) {
    const src = `assets/kidsread/covers/${p.id}-source.html`;
    write(src, coverSource(p));
    const pg = await browser.newPage({viewport: {width: 1600, height: 1000}, deviceScaleFactor: 1});
    await pg.goto('file://' + root + src); await pg.waitForTimeout(500);
    const png = await pg.screenshot({clip: {x: 0, y: 0, width: 1600, height: 1000}});
    await pg.close();
    await sharp(png).webp({quality: 82}).toFile(root + coverPath(p).slice(1));
    for (const w of [480, 960]) await sharp(png).resize(w).webp({quality: 80}).toFile(root + coverPath(p).slice(1).replace('.webp', `-${w}.webp`));
  }
  await browser.close();
}

// ---------- 站內登錄 ----------
function registerArticles() {
  const path = 'config/content-articles.json';
  const d = JSON.parse(read(path));
  const box = d.articles || d;
  for (const p of PAGES) {
    box[p.slug] = {mode: 'explainer', intent: `KidsRead series (${p.id}): ${p.keywords.slice(0, 3).join(', ')}`,
      title: p.title, description: p.desc, image: coverPath(p), alt: coverAlt(p), productNames: [], cluster: 'family',
      relatedArticles: PAGES.filter(x => x.id !== p.id).map(x => x.slug), publicationState: 'published',
      datePublished: PUBLISHED, dateModified: MODIFIED, datePrepared: PUBLISHED};
  }
  write(path, JSON.stringify(d, null, 2) + '\n');
}
function registerCards() {
  const path = 'blog/index.html';
  let s = read(path);
  s = s.replace(/\n?\s*<article class="article-card" data-article="kidsread[a-z-]*"[\s\S]*?<\/article>/g, '');
  const cardHtml = p => `
        <article class="article-card" data-article="${p.slug}" data-content-kind="explainer" data-category="母嬰" data-prepared="${PUBLISHED}" data-published="${PUBLISHED}" data-state="journal">
          <a class="card-image" href="${url(p)}"><img src="${coverPath(p)}" width="1600" height="1000" alt="${attr(coverAlt(p))}" loading="lazy" decoding="async" fetchpriority="low" srcset="${coverPath(p).replace('.webp', '-480.webp')} 480w, ${coverPath(p).replace('.webp', '-960.webp')} 960w, ${coverPath(p)} 1600w" sizes="(max-width:700px) 90vw, 45vw"></a>
          <div class="card-copy"><div class="card-meta"><span data-status>閱讀知識指南</span><span>${esc(p.meta)}</span></div><h3><a href="${url(p)}">${esc(p.title)}</a></h3><p>${esc(p.excerpt)}</p><div class="card-actions"><a class="read" href="${url(p)}">${esc(p.readLabel)}</a></div></div>
        </article>`;
  const anchor = s.search(/\n\s*<article class="article-card" data-article="insta360-ezway"/);
  if (anchor < 0) throw Error('blog/index.html: insertion anchor (insta360-ezway card) not found');
  s = s.slice(0, anchor) + PAGES.map(cardHtml).join('') + s.slice(anchor);
  write(path, s);
}
function registerCatalog() {
  const path = 'product-content.js';
  let s = read(path);
  const line = `    kidsread:{id:'kidsread',brands:['Kidsread 點讀筆'],article:null,title:'KidsRead 點讀筆',excerpt:'錄音點讀筆與中英文點讀教材：自然發音、英文繪本、注音、知識立體書，依孩子年齡挑。',category:'親子學習',image:'/assets/kidsread/covers/hub.webp',cardImage:'/assets/kidsread/covers/hub.webp',published:'${PUBLISHED}'},\n`;
  s = s.replace(/^ {4}kidsread:\{[^\n]*\n/m, '');
  const at = s.search(/^ {4}fushanFrozen:\{/m);
  if (at < 0) throw Error('product-content.js: anchor fushanFrozen not found');
  s = s.slice(0, at) + line + s.slice(at);
  write(path, s);
}
function registerCovers() {
  const path = 'config/blog-cover-identities.json';
  const d = JSON.parse(read(path));
  const reviewPath = 'docs/kidsread/cover-review.json';
  const review = existsSync(root + reviewPath) ? JSON.parse(read(reviewPath)) : {};
  for (const p of PAGES) {
    const image = coverPath(p), source = `/assets/kidsread/covers/${p.id}-source.html`;
    const imageSha256 = sha(image);
    const r = review[p.id];
    d.articles[url(p)] = {identity: 'KidsRead', image, imageSha256, source, sourceSha256: sha(source),
      review: r && r.imageSha256 === imageSha256 ? r : {identityVisible: false, realPhotoPreserved: false, imageSha256: '', viewportWidths: [], mobileCardLegible: false}};
  }
  write(path, JSON.stringify(d, null, 2) + '\n');
}

if (process.argv.includes('--covers')) await renderCovers();
for (const p of PAGES) write(`blog/${p.slug}/index.html`, page(p));
registerArticles(); registerCards(); registerCatalog(); registerCovers();
console.log(`[kidsread] ${PAGES.length} pages, ${items.length} active items`);
