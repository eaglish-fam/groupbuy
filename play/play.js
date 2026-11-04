/* 角色卡體驗（GB-028，測試版）。進度只存在這台裝置的瀏覽器（localStorage），不上傳。 */
(function () {
  "use strict";
  const P = window.PlayCharacters;
  const ORIGIN = document.documentElement.dataset.origin || "";
  const abs = (u) => (u && u.startsWith("/") ? ORIGIN + u : u || "");
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const STORE = "eaglish-play-v2";
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  // ---------- 進度 ----------
  const blank = () => ({ done: {}, cart: [], likeMe: null, me: null });
  let state = blank();
  try {
    const saved = JSON.parse(localStorage.getItem(STORE) || "null");
    if (saved) state = { ...blank(), ...saved };
    else {
      const v1 = JSON.parse(localStorage.getItem("eaglish-play-v1") || "null");
      if (v1) state.cart = Array.isArray(v1.saved) ? v1.saved : [];
    }
  } catch {}
  const save = () => { try { localStorage.setItem(STORE, JSON.stringify(state)); } catch {} };
  const progress = (id) => (state.done[id] ||= { picks: {}, completed: false, packed: false, bonus: 0 });
  const answered = (d, c) => c.day.filter((_, i) => d && d.picks[i] !== undefined).length;

  // ---------- 角色（預設角色＋自己建立的角色） ----------
  const B = P.builder;
  // 使用者自己輸入的名字只在這台裝置用來組故事，不送任何地方（包括 VoAI）。
  const kidFor = (m, prefs) => {
    const kids = m.kids || [];
    return (prefs || []).map((a) => kids.find((k) => k.age === a && k.name)).find(Boolean) || kids.find((k) => k.name && (prefs || []).includes(k.age)) || null;
  };
  const fillText = (t, m, scene) => {
    const kid = kidFor(m, scene?.kid);
    return String(t || "").replaceAll("{kid}", kid ? kid.name : "孩子").replaceAll("{pet}", m.pet?.name || "毛孩");
  };
  function meCharacter() {
    const m = state.me;
    if (!m) return null;
    const look = P.extraAvatars.find((a) => a.id === m.avatar) || P.extraAvatars[0];
    const goal = B.goals.find((g) => g.id === m.goal) || B.goals[0];
    const rhythm = B.rhythms.find((r) => r.id === m.rhythm);
    const kids = (m.kids || []).filter((k) => k.age);
    const worries = B.worries.filter((w) => (m.worries || []).includes(w.id));
    const kidScenes = { baby: "baby", toddler: "toddler", preschool: "meals", school: "homework" };
    const keys = [...new Set([...worries.map((w) => w.scene), goal.scene, ...kids.map((k) => kidScenes[k.age]), m.elder ? "bathroom" : ""])].filter((k) => P.sceneLibrary[k]);
    for (const k of ["treat", "lunch", "sleep", "clutter"]) if (keys.length < 4 && !keys.includes(k)) keys.push(k);
    const day = keys.slice(0, 6).map((k) => P.sceneLibrary[k]).sort((a, b) => a.order - b.order).map((sc) => {
      const kid = kidFor(m, sc.kid);
      return { ...sc, title: kid ? sc.title.replace("孩子", kid.name) : sc.title, text: fillText(sc.text, m, sc), reaction: fillText(sc.reaction, m, sc) };
    });
    const nick = m.nick || "我";
    const ageWord = (a) => (B.kidAges.find((x) => x.id === a) || {}).label || "";
    const kidLine = kids.length ? `家裡有${kids.map((k) => `${ageWord(k.age)}的${k.name || "孩子"}`).join("、")}` : "";
    const petLine = m.pet?.type ? `還有一隻叫${m.pet.name || "毛孩"}的${(B.pets.find((x) => x.id === m.pet.type) || {}).label || "毛孩"}` : "";
    const who = [kidLine, petLine].filter(Boolean).join("，") || "自己一個人生活";
    const story = `${nick}，${m.age || ""}，${rhythm ? rhythm.label : ""}。${who}。${goal.line}，但最近${worries.length ? worries.map((w) => w.label).join("、") : "日子有點忙"}。`;
    const event = m.pet?.type ? P.petEvents.map((e) => ({ ...e, title: fillText(e.title, m), text: fillText(e.text, m) })) : null;
    return {
      id: "me", mine: true, name: nick, nick, ageLabel: m.age || "", gender: "", role: m.goal ? goal.title : "還在想我的目標", place: rhythm ? rhythm.label : "",
      groups: [], color: look.color, avatar: look.avatar, art: look.art, tagline: `目標：${goal.label}`, goal: goal.label, goalShort: goal.label,
      story, day, events: event,
    };
  }
  // 依入口的選擇，找出最像使用者的預設角色。
  function recommend(m) {
    const kidAges = (m.kids || []).map((k) => k.age);
    const worryBrands = new Set(B.worries.filter((w) => (m.worries || []).includes(w.id)).flatMap((w) => { const sc = P.sceneLibrary[w.scene]; return sc ? [...sc.options, ...sc.alts] : []; }));
    const scored = P.characters.map((c) => {
      const t = c.match || {};
      let score = 0;
      if ((t.ages || []).includes(m.age)) score += 3;
      if ((t.rhythms || []).includes(m.rhythm)) score += 2;
      if ((t.goals || []).includes(m.goal)) score += 3;
      score += kidAges.filter((a) => (t.kids || []).includes(a)).length * 4;
      if (kidAges.length && !(t.kids || []).length && !t.elder) score -= 3;
      if (!kidAges.length && (t.kids || []).length) score -= 3;
      if (m.elder && t.elder) score += 2;
      const brands = new Set(c.day.flatMap((s) => s.options));
      score += [...worryBrands].filter((b) => brands.has(b)).length;
      return { c, score };
    }).sort((a, b) => b.score - a.score);
    return scored[0].c;
  }
  const allCharacters = () => [meCharacter(), ...P.characters].filter(Boolean);
  const getChar = (id) => allCharacters().find((c) => c.id === id);
  const completedIds = () => P.characters.filter((c) => state.done[c.id]?.completed).map((c) => c.id);
  const progressPct = (c) => {
    const d = state.done[c.id];
    if (!d) return 0;
    return Math.min(100, Math.round((100 * answered(d, c)) / c.day.length));
  };

  const BADGES = [
    { id: "first", icon: "✦", label: "第一個選擇", test: () => Object.values(state.done).some((d) => Object.keys(d.picks || {}).length) },
    { id: "day", icon: "☀", label: "陪伴一整天", test: () => completedIds().length >= 1 },
    { id: "moms", icon: "♡", label: "媽媽的後援", test: () => ["shihan", "yating", "peishan"].every((i) => completedIds().includes(i)) },
    { id: "dads", icon: "⚑", label: "爸爸同盟", test: () => ["jiahao", "chenghan"].every((i) => completedIds().includes(i)) },
    { id: "travel", icon: "✈", label: "旅行規劃師", test: () => ["yating", "chenghan"].every((i) => completedIds().includes(i)) },
    { id: "like", icon: "☺", label: "這就是我", test: () => !!state.likeMe },
    { id: "mine", icon: "✎", label: "建立我的角色", test: () => !!state.me },
    { id: "myday", icon: "⌂", label: "過完我的一天", test: () => !!state.done.me?.completed },
    { id: "all", icon: "★", label: "全圖鑑完成", test: () => completedIds().length === P.characters.length },
  ];
  const LEVELS = [
    { min: 0, label: "剛認識" },
    { min: 1, label: "好鄰居" },
    { min: 3, label: "生活夥伴" },
    { min: 6, label: "老朋友" },
  ];
  const level = () => [...LEVELS].reverse().find((l) => completedIds().length >= l.min).label;

  // ---------- 商品資料：團購 Sheet（即時）→ 快照（備援）；圖庫來自選物誌 ----------
  const products = new Map();
  let media = {};
  let live = "loading";
  const rank = { open: 0, upcoming: 1, unknown: 2, closed: 3 };
  async function loadProducts() {
    try {
      const m = window.PLAY_MEDIA || await fetch(abs("/play/product-media.json")).then((r) => r.json());
      media = m.products || {};
    } catch (error) { console.warn("media unavailable", error); }
    try {
      const snap = window.PLAY_SNAPSHOT || await fetch(abs("/config/catalog-snapshot.json"), { cache: "no-store" }).then((r) => r.json());
      for (const i of snap.items || []) {
        if (products.has(i.brand)) continue;
        products.set(i.brand, { brand: i.brand, image: abs(i.image), images: [], description: i.description, article: abs(i.article), status: { key: "unknown", label: "開團狀態以首頁為準" }, url: "", countdown: "" });
      }
    } catch (error) { console.warn("snapshot unavailable", error); }
    try {
      if (!window.CatalogCore || !window.Papa) throw Error("catalog scripts missing");
      let registry = { schema: "eaglish.permanent-offers/v1", offers: [] };
      try { registry = await window.PermanentOffers.load(abs("/config/permanent-offers.json")); } catch {}
      const rows = await window.CatalogCore.fetchRows("現正開團");
      const list = window.CatalogCore.buildCatalog(rows, registry);
      const best = new Map();
      for (const p of list) {
        const prev = best.get(p.brand);
        if (!prev || (rank[p.status.key] ?? 9) < (rank[prev.status.key] ?? 9)) best.set(p.brand, p);
      }
      for (const [brand, p] of best) {
        const base = products.get(brand) || { brand, image: "", description: "", article: "" };
        const timed = window.CatalogCore.timedCampaign(p);
        products.set(brand, {
          ...base,
          image: base.image || abs(p.images?.[0] || p.fallbackImage || ""),
          images: (p.images || []).map(abs),
          description: base.description || p.description || "",
          article: base.article || abs(p.article?.article || ""),
          status: p.status,
          url: p.status.key === "open" ? p.url : "",
          countdown: timed ? window.CatalogCore.countdownText(p.end) : "",
          closingSoon: timed && window.CatalogCore.isClosingSoon(p.end),
        });
      }
      live = "live";
    } catch (error) {
      console.warn("live catalog unavailable", error);
      live = "snapshot";
    }
    renderDataNote();
  }
  const info = (brand) => products.get(brand) || { brand, image: "", images: [], description: "", article: "", status: { key: "unknown", label: "開團狀態以首頁為準" }, url: "", countdown: "" };
  function gallery(brand) {
    const i = info(brand);
    const list = [...(media[brand] || []).map((m) => ({ src: abs(m.src), alt: m.alt }))];
    if (i.image && !list.some((m) => m.src === i.image)) list.unshift({ src: i.image, alt: brand });
    for (const src of i.images || []) if (src && !list.some((m) => m.src === src)) list.push({ src, alt: brand });
    return list.slice(0, 10);
  }

  // ---------- 角色頭像（SVG 插圖；之後換成正式插畫） ----------
  function avatar(c, size = 120) {
    // 正式插畫（GB-029 繪本水彩）到位後，角色資料加 art 路徑就換成插畫。
    if (c.art) return `<img class="avatar art" src="${esc(abs(c.art))}" width="${size}" height="${size}" alt="${esc(c.name || "角色")}的插畫">`;
    const a = c.avatar;
    const hair = a.hair, skin = a.skin;
    const backHair = {
      long: `<path d="M34 50c0-20 12-32 26-32s26 12 26 32v44H34z" fill="${hair}"/>`,
      bob: `<path d="M35 52c0-19 11-31 25-31s25 12 25 31v20H35z" fill="${hair}"/>`,
      "bob-bangs": `<path d="M35 52c0-19 11-31 25-31s25 12 25 31v20H35z" fill="${hair}"/>`,
      ponytail: `<ellipse cx="86" cy="58" rx="9" ry="20" fill="${hair}" transform="rotate(-12 86 58)"/>`,
      bun: `<circle cx="60" cy="24" r="10" fill="${hair}"/>`,
    }[a.style] || "";
    const frontHair = {
      long: `<path d="M38 50c2-16 10-24 22-24s20 8 22 24c-6-8-14-12-22-12s-16 4-22 12z" fill="${hair}"/>`,
      bob: `<path d="M38 52c1-16 9-25 22-25s21 9 22 25c-4-9-12-14-22-14s-18 5-22 14z" fill="${hair}"/>`,
      "bob-bangs": `<path d="M38 54c1-17 9-27 22-27s21 10 22 27c-2-5-5-8-9-10-4 3-9 4-13 4s-10-1-14-4c-4 2-7 5-8 10z" fill="${hair}"/>`,
      ponytail: `<path d="M38 50c2-15 10-23 22-23s20 8 22 23c-7-8-14-11-22-11s-15 3-22 11z" fill="${hair}"/>`,
      bun: `<path d="M38 50c2-15 10-23 22-23s20 8 22 23c-7-8-14-11-22-11s-15 3-22 11z" fill="${hair}"/>`,
      short: `<path d="M38 48c1-14 10-21 22-21s21 7 22 21c-5-5-12-8-22-8s-17 3-22 8z" fill="${hair}"/>`,
      short2: `<path d="M38 49c0-15 10-23 22-23s22 8 22 23l-6-5-5 3-5-4-6 3-6-3-5 4-5-3z" fill="${hair}"/>`,
      "short-curl": [44, 52, 60, 68, 76].map((x, i) => `<circle cx="${x}" cy="${33 + (i % 2) * 2}" r="8" fill="${hair}"/>`).join("") + `<circle cx="40" cy="42" r="6" fill="${hair}"/><circle cx="80" cy="42" r="6" fill="${hair}"/>`,
    }[a.style] || "";
    const acc = {
      glasses: `<g fill="none" stroke="#2f2a26" stroke-width="1.6"><circle cx="52" cy="53" r="5.5"/><circle cx="68" cy="53" r="5.5"/><path d="M57.5 53h5"/></g>`,
      sunglasses: `<g><rect x="44" y="23" width="13" height="7" rx="3.5" fill="#2f2a26"/><rect x="63" y="23" width="13" height="7" rx="3.5" fill="#2f2a26"/><path d="M57 26h6" stroke="#2f2a26" stroke-width="1.6"/></g>`,
      earrings: `<circle cx="38.5" cy="62" r="2" fill="#e2b13c"/><circle cx="81.5" cy="62" r="2" fill="#e2b13c"/>`,
      beard: `<path d="M44 60c2 10 8 14 16 14s14-4 16-14c-3 4-9 6-16 6s-13-2-16-6z" fill="${hair}" opacity=".85"/>`,
    }[a.acc] || "";
    let kid = "";
    if (a.kid) {
      const k = a.kid;
      kid = `<g><path d="M76 120c0-12 6-18 14-18s14 6 14 18z" fill="#f4efe4"/><circle cx="90" cy="94" r="12" fill="${k.skin}"/>` +
        (k.baby ? `<path d="M88 82c2-3 6-3 7 0" fill="none" stroke="${k.hair}" stroke-width="2" stroke-linecap="round"/>` : `<path d="M78 92c0-8 5-13 12-13s12 5 12 13c-3-4-7-6-12-6s-9 2-12 6z" fill="${k.hair}"/>`) +
        `<circle cx="86" cy="95" r="1.4" fill="#2f2a26"/><circle cx="94" cy="95" r="1.4" fill="#2f2a26"/><path d="M87 99q3 2 6 0" fill="none" stroke="#2f2a26" stroke-width="1.2" stroke-linecap="round"/><circle cx="83" cy="98" r="2" fill="#f19a8a" opacity=".5"/><circle cx="97" cy="98" r="2" fill="#f19a8a" opacity=".5"/></g>`;
    }
    return `<svg class="avatar" viewBox="0 0 120 120" width="${size}" height="${size}" role="img" aria-label="${esc(c.name || "角色")}的插圖">` +
      `<circle cx="60" cy="60" r="60" fill="${c.color}" opacity=".22"/>` + backHair +
      `<path d="M26 120c0-22 15-34 34-34s34 12 34 34z" fill="${a.shirt}"/><rect x="54" y="72" width="12" height="14" rx="5" fill="${skin}"/>` +
      `<circle cx="60" cy="54" r="22" fill="${skin}"/><circle cx="38.5" cy="56" r="4" fill="${skin}"/><circle cx="81.5" cy="56" r="4" fill="${skin}"/>` +
      frontHair +
      `<circle cx="52" cy="54" r="2" fill="#2f2a26"/><circle cx="68" cy="54" r="2" fill="#2f2a26"/><path d="M54 63q6 4 12 0" fill="none" stroke="#2f2a26" stroke-width="1.6" stroke-linecap="round"/>` +
      `<circle cx="47" cy="61" r="3" fill="#f19a8a" opacity=".45"/><circle cx="73" cy="61" r="3" fill="#f19a8a" opacity=".45"/>` +
      acc + kid + `</svg>`;
  }

  // ---------- 小元件 ----------
  function toast(msg) {
    const t = $("#toast");
    const host = $$("dialog[open]").pop() || document.body;
    if (t.parentElement !== host) host.appendChild(t);
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => t.classList.remove("show"), 2400);
  }
  const meter = (value, color, label = "目標進度") => `<div class="meter" role="meter" aria-label="${label}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${value}"><span style="width:${value}%;background:${color}"></span></div>`;
  function statusBadge(i) {
    const cls = { open: "open", upcoming: "upcoming", closed: "closed" }[i.status.key] || "unknown";
    return `<span class="status ${cls}">${esc(i.status.label)}</span>` + (i.countdown ? ` <span class="countdown${i.closingSoon ? " soon" : ""}">${esc(i.countdown)}</span>` : "");
  }
  function carousel(brand, { big = false } = {}) {
    const imgs = gallery(brand);
    if (!imgs.length) return `<div class="carousel empty${big ? " big" : ""}"><span class="img-fallback" aria-hidden="true">${esc([...brand.replace(/^[^A-Za-z一-鿿]+/, "")][0] || "鷹")}</span></div>`;
    const many = imgs.length > 1;
    return `<div class="carousel${big ? " big" : ""}" data-carousel>
      <div class="track" tabindex="0" aria-label="${esc(brand)} 的照片，可左右滑動">${imgs.map((m, n) => `<figure class="slide"><img src="${esc(m.src)}" alt="${esc(m.alt || brand)}" loading="${n ? "lazy" : "eager"}" decoding="async"></figure>`).join("")}</div>
      ${many ? `<button type="button" class="nav prev" data-slide="-1" aria-label="上一張">‹</button><button type="button" class="nav next" data-slide="1" aria-label="下一張">›</button><span class="count" aria-hidden="true">1 / ${imgs.length}</span>` : ""}
    </div>`;
  }
  // mode: choose（可選）、compact（已選）、list（清單）
  function productCard(brand, { mode = "", scene = null } = {}) {
    const i = info(brand);
    const inCart = state.cart.includes(brand);
    const actions = [
      mode === "choose" ? `<button type="button" class="button primary" data-pick="${scene}" data-brand="${esc(brand)}">選這個</button>` : "",
      `<button type="button" class="button ghost" data-detail="${esc(brand)}">看更多</button>`,
      mode !== "choose" && i.url ? `<a class="button" href="${esc(i.url)}" target="_blank" rel="noopener noreferrer">前往團購</a>` : "",
      mode === "list" ? `<button type="button" class="text-link" data-remove="${esc(brand)}">移除</button>` : "",
      mode === "" ? `<button type="button" class="save${inCart ? " on" : ""}" data-cart="${esc(brand)}" aria-pressed="${inCart}">${inCart ? "✓ 已在購物清單" : "＋ 購物清單"}</button>` : "",
    ].filter(Boolean).join("");
    return `<article class="product${mode === "compact" || mode === "list" ? " compact" : ""}">${carousel(brand)}<div class="product-body"><h4>${esc(brand)}</h4>${statusBadge(i)}${mode === "compact" || mode === "list" ? "" : `<p>${esc(i.description || "商品說明以團購頁為準。")}</p>`}<div class="product-actions">${actions}</div></div></article>`;
  }

  // ---------- 首頁 ----------
  let filter = "all";
  function renderStats() {
    const got = BADGES.filter((b) => b.test());
    $("#stats").innerHTML =
      `<div class="stat"><span class="stat-label">你和大家的關係</span><strong>${level()}</strong></div>` +
      `<div class="stat"><span class="stat-label">陪伴過的一天</span><strong>${completedIds().length} / ${P.characters.length}</strong></div>` +
      `<div class="stat"><span class="stat-label">購物清單</span><strong><button type="button" class="link-button" id="open-cart">${state.cart.length} 件</button></strong></div>` +
      `<div class="stat badges-stat"><span class="stat-label">徽章 ${got.length} / ${BADGES.length}</span><span class="badges">${BADGES.map((b) => `<span class="badge${b.test() ? " got" : ""}" title="${esc(b.label)}"><span aria-hidden="true">${b.icon}</span><span class="sr-only">${esc(b.label)}${b.test() ? "（已獲得）" : "（未獲得）"}</span></span>`).join("")}</span></div>`;
    $("#open-me").textContent = state.me ? "✎ 我的角色" : "✎ 建立我的角色";
  }
  function renderFilters() {
    $("#filters").innerHTML = P.groups.map((g) => `<button type="button" class="chip${filter === g.id ? " on" : ""}" data-filter="${g.id}" aria-pressed="${filter === g.id}">${g.label}</button>`).join("");
  }
  function charCard(c) {
    const d = state.done[c.id];
    const steps = answered(d, c);
    const tag = d?.completed ? `<span class="card-flag done">已陪伴</span>` : steps ? `<span class="card-flag">進行中 ${steps}/${c.day.length}</span>` : c.mine ? `<span class="card-flag mine">我的角色</span>` : "";
    return `<button type="button" class="char-card${c.mine ? " mine" : ""}" data-open="${c.id}" style="--c:${c.color}" aria-label="打開${esc(c.name)}的角色卡">
      <span class="char-top">${tag}${state.likeMe === c.id ? `<span class="card-flag me">像我</span>` : ""}</span>
      ${avatar(c, 112)}
      <span class="char-name">${esc(c.name)}<small>${esc(c.mine ? c.ageLabel : c.age + " 歲")}</small></span>
      <span class="char-role">${esc(c.role)}</span>
      <span class="char-goal">🎯 ${esc(c.goal)}</span>
      <span class="char-meter"><span class="meter-label">目標進度</span>${meter(progressPct(c), c.color)}</span>
    </button>`;
  }
  function renderGrid() {
    const list = allCharacters().filter((c) => filter === "all" || c.mine || c.groups.includes(filter));
    $("#grid").innerHTML = list.map(charCard).join("");
  }
  function renderDataNote() {
    $("#data-note").textContent = live === "live"
      ? "開團狀態：即時讀取團購資料。"
      : live === "snapshot"
        ? "開團狀態暫時讀不到，商品介紹先用網站快照；要買之前請回首頁確認。"
        : "正在讀取開團狀態……";
    if ($("#day").open) renderDay();
  }
  function renderAll() { renderStats(); renderFilters(); renderGrid(); }

  // ---------- 語音（VoAI 事先產生；只有文字相符的段落才播） ----------
  let voice = { items: {} };
  const player = new Audio();
  player.preload = "none";
  let playing = null;
  let afterPlay = null;
  async function loadVoice() {
    try { voice = window.PLAY_VOICE || await fetch(abs("/play/voice-manifest.json")).then((r) => r.json()); } catch { voice = { items: {} }; }
  }
  function voiceFor(cid, part) {
    const it = voice.items?.[`${cid}/${part}`];
    const c = P.characters.find((x) => x.id === cid);
    if (!it || !c) return null;
    // 文字改過就不播舊錄音。
    if (part === "intro") return it.text.includes(c.story) ? it : null;
    const s = c.day[Number(part.slice(1))];
    if (!s) return null;
    const expected = part[0] === "s" ? s.text : s.reaction.replace(/[「」]/g, "");
    return it.text.includes(expected) ? it : null;
  }
  function play(key, then = null) {
    const [cid, part] = key.split("/");
    const it = voiceFor(cid, part);
    if (!it) return;
    if (playing === key && !player.paused) { player.pause(); afterPlay = null; markPlaying(null); return; }
    afterPlay = then;
    player.src = abs(it.file);
    player.play().then(() => markPlaying(key)).catch(() => markPlaying(null));
  }
  function markPlaying(key) {
    playing = key;
    for (const b of $$("[data-play]")) b.classList.toggle("on", b.dataset.play === key);
  }
  player.addEventListener("ended", () => { markPlaying(null); const next = afterPlay; afterPlay = null; if (next) next(); });

  // ---------- 一天 ----------
  let current = null;
  const eventFor = {};
  const swapAt = {};
  function scenePool(s) { return [...new Set([...s.options, ...(s.alts || [])])]; }
  function renderDay() {
    const c = current && getChar(current);
    if (!c) return;
    const d = progress(c.id);
    const evPool = c.events || P.events;
    if (eventFor[c.id] === undefined || eventFor[c.id] >= evPool.length) eventFor[c.id] = Math.floor(Math.random() * evPool.length);
    const ev = evPool[eventFor[c.id]];
    const firstOpen = c.day.findIndex((_, i) => d.picks[i] === undefined);
    const scenes = c.day.map((s, i) => {
      const pick = d.picks[i];
      let body;
      if (pick) {
        body = `<p class="scene-text">${esc(s.text)}</p><p class="reaction"><span aria-hidden="true">💬</span> ${esc(s.reaction)}</p>${productCard(pick, { mode: "compact" })}<button type="button" class="text-link" data-redo="${i}">改選</button>`;
      } else if (pick === null) {
        body = `<p class="scene-text">${esc(s.text)}</p><p class="skipped">這一刻不需要額外的東西。</p><button type="button" class="text-link" data-redo="${i}">改選</button>`;
      } else if (i === firstOpen) {
        const pool = scenePool(s);
        const per = Math.min(2, pool.length);
        const offset = (swapAt[c.id + i] || 0) % pool.length;
        const shown = Array.from({ length: per }, (_, n) => pool[(offset + n) % pool.length]);
        body = `<p class="scene-text">${esc(s.text)}</p><p class="need"><strong>卡住的是：</strong>${esc(s.need)}</p>
          <p class="choose-hint">${c.mine ? "這一刻，有什麼幫得上你？" : `這一刻，有什麼幫得上${esc(c.nick)}？`}</p>
          <div class="options">${shown.map((b) => productCard(b, { mode: "choose", scene: i })).join("")}</div>
          <div class="scene-actions">${pool.length > per ? `<button type="button" class="button ghost" data-swap="${i}">換一個看看（${pool.length} 選 ${per}）</button>` : ""}<button type="button" class="button ghost" data-skip="${i}">這個不需要</button></div>`;
      } else {
        body = `<p class="scene-text locked-text">這一段還沒發生。先走完上一段吧。</p>`;
      }
      const evHtml = i === 2 && (firstOpen === -1 || firstOpen > 2)
        ? `<li class="scene event"><span class="time">意外</span><div><h3>${esc(ev.title)}</h3><p class="scene-text">${esc(ev.text)}</p></div></li>` : "";
      const cls = pick ? " done" : pick === null ? " skip" : i === firstOpen ? " current" : " locked";
      const listen = pick === undefined && i === firstOpen && voiceFor(c.id, "s" + i) ? ` <button type="button" class="listen" data-play="${c.id}/s${i}" aria-label="聽這一段">▶ 聽</button>` : "";
      return evHtml + `<li class="scene${cls}" data-scene="${i}"><span class="time">${esc(s.time)}</span><div><h3>${esc(s.title)}${listen}</h3>${body}</div></li>`;
    }).join("");
    let summary = "";
    if (firstOpen === -1) {
      const chosen = c.day.map((_, i) => d.picks[i]).filter(Boolean);
      const unique = [...new Set(chosen)];
      const skipped = c.day.filter((_, i) => d.picks[i] === null).map((s) => s.title);
      summary = `<section class="summary" aria-labelledby="summary-title"><h3 id="summary-title">${c.mine ? "你的一天走完了" : `${esc(c.nick)}離目標又近了一步`} ☀</h3>
        <p class="goal-line">🎯 ${esc(c.goal)}</p>
        ${unique.length ? `<p>打包清單：勾選想要的，放進購物清單。</p><ul class="pack">${unique.map((b) => `<li><label><input type="checkbox" name="pack" value="${esc(b)}" checked> ${esc(b)} ${statusBadge(info(b))}</label></li>`).join("")}</ul>` : `<p>這一天都不需要額外的東西，也很好。</p>`}
        ${skipped.length ? `<p class="small">不需要的時刻：${skipped.map(esc).join("、")}</p>` : ""}
        <div class="summary-actions">${unique.length ? `<button type="button" class="button primary" id="pack-cart">${d.packed ? "再放一次" : "放進購物清單"}</button>` : ""}<button type="button" class="button" id="share">分享這張角色卡</button>${c.mine ? "" : `<button type="button" class="button" id="next-char">認識下一位</button>`}</div></section>`;
    }
    $("#day-body").innerHTML = `
      <aside class="profile" style="--c:${c.color}">
        ${avatar(c, 150)}
        <h2 id="day-title">${esc(c.name)}<small>${esc(c.mine ? c.ageLabel : c.age + " 歲")}</small></h2>
        <p class="role">${esc(c.role)}${c.place ? "・" + esc(c.place) : ""}</p>
        <p class="goal-box"><span>${c.mine ? "我想要" : c.gender === "m" ? "他想要" : "她想要"}</span>${esc(c.goal)}</p>
        <p class="story">${esc(c.story)}</p>
        ${voiceFor(c.id, "intro") ? `<div class="voice-row"><button type="button" class="button ghost" data-play="${c.id}/intro">▶ 聽${esc(c.nick)}的故事</button><label class="auto-read"><input type="checkbox" id="auto-read" ${state.autoRead ? "checked" : ""}> 自動朗讀</label></div><p class="small">語音由 AI（VoAI）生成。</p>` : ""}
        <div class="profile-meter"><span class="meter-label">目標進度 ${progressPct(c)}%</span>${meter(progressPct(c), c.color)}</div>
        ${c.mine ? `<button type="button" class="button" id="edit-me">修改我的角色</button>` : `<button type="button" class="button like${state.likeMe === c.id ? " on" : ""}" id="like-me" aria-pressed="${state.likeMe === c.id}">${state.likeMe === c.id ? "☺ 這就是我" : "這就是我！"}</button>`}
        <p class="data-note small">${live === "live" ? "商品開團狀態為即時資料。" : "開團狀態以首頁為準。"}</p>
      </aside>
      <div class="timeline"><ol>${scenes}</ol>${summary}</div>`;
  }
  function openCharacter(id, { fromDraw = false } = {}) {
    if (!getChar(id)) return;
    current = id;
    renderDay();
    const dlg = $("#day");
    if (!dlg.open) dlg.showModal();
    dlg.scrollTop = 0;
    if (fromDraw) toast(`今天遇見的是：${getChar(id).nick}`);
    history.replaceState(null, "", "#" + id);
  }
  function scrollToCurrent() {
    const next = $("#day .scene.current") || $("#day .summary");
    next?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }
  function answer(sceneIndex, brand) {
    const c = getChar(current);
    const d = progress(c.id);
    d.picks[sceneIndex] = brand;
    if (answered(d, c) === c.day.length && !d.completed) {
      d.completed = true;
      setTimeout(() => toast(c.mine ? "獲得徽章：過完我的一天" : `獲得徽章：陪伴${c.nick}一整天`), reduceMotion ? 0 : 300);
    }
    save();
    renderDay();
    renderAll();
    scrollToCurrent();
    if (state.autoRead && brand && !c.mine) {
      const next = c.day.findIndex((_, i) => d.picks[i] === undefined);
      play(`${c.id}/r${sceneIndex}`, next >= 0 ? () => { if (current === c.id) play(`${c.id}/s${next}`); } : null);
    }
  }
  function toggleCart(brand, force) {
    const i = state.cart.indexOf(brand);
    const add = force ?? i < 0;
    if (add && i < 0) state.cart.push(brand);
    if (!add && i >= 0) state.cart.splice(i, 1);
    save();
    renderStats();
    if ($("#day").open) renderDay();
    if ($("#cart").open) renderCart();
    if ($("#product").open) renderProduct();
  }
  async function share(c) {
    const url = location.origin + location.pathname + (c.mine ? "" : "#" + c.id);
    const text = c.mine ? `我在鷹家日常圖鑑建立了自己的角色：${c.role}，目標是「${c.goal}」。` : `${c.name}，${c.age} 歲，${c.role}。目標：${c.goal}。`;
    if (navigator.share) {
      try { await navigator.share({ title: `鷹家日常圖鑑｜${c.name}`, text, url }); return; }
      catch (error) { if (error?.name === "AbortError") return; }
    }
    try { await navigator.clipboard.writeText(`${text} ${url}`); toast("連結已複製"); }
    catch { toast(`複製這個連結分享：${url}`); }
  }
  function draw() {
    const pool = P.characters.filter((c) => !state.done[c.id]?.completed);
    const list = pool.length ? pool : P.characters;
    const c = list[Math.floor(Math.random() * list.length)];
    const card = $(`[data-open="${c.id}"]`);
    if (card && !reduceMotion) {
      card.classList.add("drawn");
      setTimeout(() => { card.classList.remove("drawn"); openCharacter(c.id, { fromDraw: true }); }, 650);
    } else openCharacter(c.id, { fromDraw: true });
  }

  // ---------- 商品詳細（大圖左右滑） ----------
  let detailBrand = null;
  function renderProduct() {
    const b = detailBrand;
    const i = info(b);
    const inCart = state.cart.includes(b);
    $("#product-title").textContent = b;
    $("#product-body").innerHTML = `${carousel(b, { big: true })}
      <div class="detail-copy">${statusBadge(i)}<p>${esc(i.description || "商品說明以團購頁為準。")}</p>
      <div class="product-actions">${i.url ? `<a class="button primary" href="${esc(i.url)}" target="_blank" rel="noopener noreferrer">前往團購</a>` : ""}${i.article ? `<a class="button" href="${esc(i.article)}">讀完整選物誌</a>` : ""}<button type="button" class="save${inCart ? " on" : ""}" data-cart="${esc(b)}" aria-pressed="${inCart}">${inCart ? "✓ 已在購物清單" : "＋ 購物清單"}</button></div>
      <p class="small">商品、配送與售後由廠商提供，詳情以當期團購頁為準。</p></div>`;
  }

  // ---------- 購物清單 ----------
  function renderCart() {
    if (!state.cart.length) { $("#cart-body").innerHTML = `<p class="empty">還沒有東西。陪一個人過完一天，在「打包清單」勾選想要的，就會放到這裡。</p>`; return; }
    const groups = [
      { title: "現在可以買", test: (i) => i.status.key === "open" },
      { title: "即將開團", test: (i) => i.status.key === "upcoming" },
      { title: "先收著，開團再買", test: (i) => !["open", "upcoming"].includes(i.status.key) },
    ];
    $("#cart-body").innerHTML = groups.map((g) => {
      const list = state.cart.filter((b) => g.test(info(b)));
      return list.length ? `<section><h3 class="cart-group">${g.title}（${list.length}）</h3><div class="cart-list">${list.map((b) => productCard(b, { mode: "list" })).join("")}</div></section>` : "";
    }).join("") + `<p class="small">清單只存在這台裝置。${live === "live" ? "" : "開團狀態以首頁為準。"}</p>`;
  }

  // ---------- 入口：儀式感的設定流程 → 推薦角色卡（也就是「建立我的角色」） ----------
  let draft = null;
  let step = 0;
  const STEPS = ["開始", "關於你", "孩子", "毛孩", "目標", "卡住的地方", "你的卡"];
  const blankDraft = () => ({ avatar: P.extraAvatars[0].id, nick: "", age: "", rhythm: "", hasKids: null, kids: [], elder: false, pet: { type: "", name: "" }, goal: "", worries: [] });
  function withDraft(fn) { const keep = state.me; state.me = draft; try { return fn(); } finally { state.me = keep; } }
  function miniCard(c, label) {
    return `<div class="reveal-card" style="--c:${c.color}"><span class="reveal-label">${label}</span>${avatar(c, 120)}<strong class="char-name">${esc(c.name)}<small>${esc(c.mine ? c.ageLabel : c.age + " 歲")}</small></strong><span class="char-role">${esc(c.role)}</span><span class="char-goal">🎯 ${esc(c.goal)}</span></div>`;
  }
  function renderWizard() {
    const d = draft;
    const dlg = $("#me");
    dlg.classList.toggle("ritual-mode", step === 0);
    const head = step === 0 || step === STEPS.length - 1 ? "" : `<ol class="steps" aria-label="進度">${STEPS.slice(1, -1).map((t, i) => `<li class="${i + 1 === step ? "on" : i + 1 < step ? "done" : ""}">${t}</li>`).join("")}</ol>`;
    let body = "";
    if (step === 0) body = `<div class="ritual"><div class="book" aria-hidden="true"><span class="page p1"></span><span class="page p2"></span><span class="page p3"></span></div>
      <p class="eyebrow">鷹家日常圖鑑</p><h2 class="ritual-title">每一頁，<br>都是某個人的一天。</h2>
      <p>回答幾個小問題：你幾歲、家裡有誰、想讓日子變成什麼樣子。我們幫你找到最像你的那張卡，也幫你做一張你自己的。</p>
      <p class="small">你填的名字只存在這台裝置，不會送出去。</p></div>`;
    if (step === 1) body = `<fieldset><legend>先選一個像你的樣子</legend><div class="avatar-grid">${P.extraAvatars.map((a) => `<label class="avatar-pick"><input type="radio" name="avatar" value="${a.id}" ${d.avatar === a.id ? "checked" : ""}>${avatar({ ...a, name: "頭像" }, 76)}</label>`).join("")}</div></fieldset>
      <label class="field" for="me-nick">怎麼稱呼你？<input id="me-nick" name="nick" maxlength="12" value="${esc(d.nick)}" autocomplete="off" placeholder="例如：小鷹媽"></label>
      <fieldset><legend>年齡</legend><div class="chips">${B.ages.map((a) => `<label class="chip-pick"><input type="radio" name="age" value="${a}" ${d.age === a ? "checked" : ""}> ${a}</label>`).join("")}</div></fieldset>
      <fieldset><legend>平常的節奏</legend><div class="chips">${B.rhythms.map((r) => `<label class="chip-pick"><input type="radio" name="rhythm" value="${r.id}" ${d.rhythm === r.id ? "checked" : ""}> ${r.label}</label>`).join("")}</div></fieldset>`;
    if (step === 2) body = `<fieldset><legend>家裡有小孩嗎？</legend><div class="chips"><label class="chip-pick"><input type="radio" name="hasKids" value="yes" ${d.hasKids === true ? "checked" : ""}> 有</label><label class="chip-pick"><input type="radio" name="hasKids" value="no" ${d.hasKids === false ? "checked" : ""}> 沒有</label></div></fieldset>
      ${d.hasKids ? `<fieldset><legend>幫孩子取個名字（會出現在你的故事裡）</legend><div class="kid-rows">${d.kids.map((k, i) => `<div class="kid-row"><label class="field" for="kid-name-${i}">名字<input id="kid-name-${i}" name="kidName" maxlength="8" value="${esc(k.name)}" autocomplete="off" placeholder="例如：小米"></label><label class="field" for="kid-age-${i}">年紀<select id="kid-age-${i}" name="kidAge"><option value="">選一個</option>${B.kidAges.map((a) => `<option value="${a.id}" ${k.age === a.id ? "selected" : ""}>${a.label}</option>`).join("")}</select></label>${d.kids.length > 1 ? `<button type="button" class="text-link" data-kid-remove="${i}">移除</button>` : ""}</div>`).join("")}</div>${d.kids.length < 4 ? `<button type="button" class="button ghost" id="kid-add">＋ 再加一個孩子</button>` : ""}</fieldset>` : ""}
      <label class="chip-pick"><input type="checkbox" name="elder" ${d.elder ? "checked" : ""}> 也和長輩同住</label>`;
    if (step === 3) body = `<fieldset><legend>家裡有毛孩嗎？</legend><div class="chips"><label class="chip-pick"><input type="radio" name="petType" value="" ${!d.pet.type ? "checked" : ""}> 沒有</label>${B.pets.map((x) => `<label class="chip-pick"><input type="radio" name="petType" value="${x.id}" ${d.pet.type === x.id ? "checked" : ""}> ${x.label}</label>`).join("")}</div></fieldset>
      ${d.pet.type ? `<label class="field" for="pet-name">牠叫什麼名字？<input id="pet-name" name="petName" maxlength="8" value="${esc(d.pet.name)}" autocomplete="off" placeholder="例如：豆豆"></label><p class="small">毛孩會在你的一天裡出現；目前還沒有毛孩的團購商品。</p>` : ""}`;
    if (step === 4) body = `<fieldset><legend>你想讓日子變成什麼樣子？</legend><div class="goal-list">${B.goals.map((g) => `<label class="goal-pick"><input type="radio" name="goal" value="${g.id}" ${d.goal === g.id ? "checked" : ""}><span><strong>${g.label}</strong><small>你的稱號會是：${g.title}</small></span></label>`).join("")}</div></fieldset>`;
    if (step === 5) body = `<fieldset><legend>最近卡住的地方（最多 3 個）</legend><div class="chips">${B.worries.map((w) => `<label class="chip-pick"><input type="checkbox" name="worries" value="${w.id}" ${d.worries.includes(w.id) ? "checked" : ""}> ${w.label}</label>`).join("")}</div></fieldset>`;
    if (step === 6) {
      const me = withDraft(meCharacter);
      const rec = recommend(draft);
      body = `<div class="reveal"><p class="eyebrow">你的卡出來了</p><div class="reveal-cards">${miniCard(rec, "最像你的人")}${miniCard(me, "你的角色卡")}</div>
        <p class="reveal-why">${esc(rec.nick)}和你一樣${(rec.match?.goals || []).includes(draft.goal) ? `想「${esc(B.goals.find((g) => g.id === draft.goal).label)}」` : "在努力把日子過好"}。先看看${esc(rec.nick)}的一天，或直接開始你自己的。</p>
        <div class="reveal-actions"><button type="button" class="button primary" data-open="${rec.id}">陪${esc(rec.nick)}過一天</button><button type="button" class="button" id="me-start">開始我的一天</button><button type="button" class="button ghost" id="me-browse">看看其他人的生活</button></div></div>`;
    }
    const preview = step > 1 && step < 6 ? withDraft(() => { const c = meCharacter(); return `<div class="me-preview" style="--c:${c.color}">${avatar(c, 56)}<div><strong>${esc(c.name)}</strong>・${esc(c.role)}<br><span class="small">${esc(c.story)}</span></div></div>`; }) : "";
    const actions = step === 6 ? "" : `<div class="wizard-actions">${step === 0 ? `<button type="button" class="button ghost" id="me-skip">先隨便看看</button>` : `<button type="button" class="button ghost" id="me-back">上一步</button>`}<button class="button primary" type="submit">${step === 0 ? "翻開第一頁" : step === 5 ? "做出我的卡" : "下一步"}</button></div>`;
    $("#me-body").innerHTML = `${head}<form id="me-form" novalidate>${body}<p class="form-error" id="me-error" role="alert"></p>${actions}</form>${preview}`;
    $("#me-body").scrollTop = 0;
  }
  function readStep() {
    const f = $("#me-form");
    if (!f) return;
    const v = new FormData(f);
    if (step === 1) { draft.avatar = v.get("avatar") || draft.avatar; draft.nick = String(v.get("nick") || "").trim().slice(0, 12); draft.age = v.get("age") || draft.age; draft.rhythm = v.get("rhythm") || draft.rhythm; }
    if (step === 2) {
      const has = v.get("hasKids");
      if (has) draft.hasKids = has === "yes";
      const names = v.getAll("kidName"), ages = v.getAll("kidAge");
      if (draft.hasKids) draft.kids = names.map((n, i) => ({ name: String(n).trim().slice(0, 8), age: ages[i] || "" }));
      if (draft.hasKids && !draft.kids.length) draft.kids = [{ name: "", age: "" }];
      if (draft.hasKids === false) draft.kids = [];
      draft.elder = v.get("elder") === "on";
    }
    if (step === 3) { draft.pet = { type: v.get("petType") || "", name: String(v.get("petName") || draft.pet.name || "").trim().slice(0, 8) }; if (!draft.pet.type) draft.pet.name = ""; }
    if (step === 4) draft.goal = v.get("goal") || "";
    if (step === 5) draft.worries = v.getAll("worries");
  }
  function openWizard({ fresh = false } = {}) {
    draft = state.me && !fresh ? { ...blankDraft(), ...JSON.parse(JSON.stringify(state.me)) } : blankDraft();
    step = state.me && !fresh ? 1 : 0;
    renderWizard();
    if (!$("#me").open) $("#me").showModal();
  }

  // ---------- 事件 ----------
  document.addEventListener("click", (e) => {
    const t = e.target.closest("button, a");
    if (!t) return;
    const ds = t.dataset;
    if (ds.open) { if ($("#me").open) $("#me").close(); openCharacter(ds.open); }
    else if (ds.filter) { filter = ds.filter; renderFilters(); renderGrid(); }
    else if (ds.pick !== undefined) answer(Number(ds.pick), ds.brand);
    else if (ds.skip !== undefined) answer(Number(ds.skip), null);
    else if (ds.swap !== undefined) { const k = current + ds.swap; swapAt[k] = (swapAt[k] || 0) + Math.min(2, scenePool(getChar(current).day[Number(ds.swap)]).length); renderDay(); $(`#day [data-scene="${ds.swap}"]`)?.scrollIntoView({ block: "nearest" }); }
    else if (ds.redo !== undefined) { const d = progress(current); delete d.picks[Number(ds.redo)]; d.completed = false; save(); renderDay(); renderAll(); $(`#day [data-scene="${ds.redo}"]`)?.scrollIntoView({ block: "start", behavior: reduceMotion ? "auto" : "smooth" }); }
    else if (ds.play) play(ds.play);
    else if (ds.detail) { detailBrand = ds.detail; renderProduct(); $("#product").showModal(); }
    else if (ds.cart) { const had = state.cart.includes(ds.cart); toggleCart(ds.cart); toast(had ? "已從購物清單移除" : "已放進購物清單"); }
    else if (ds.remove) { toggleCart(ds.remove, false); toast("已從購物清單移除"); }
    else if (ds.slide) { const track = t.closest("[data-carousel]").querySelector(".track"); track.scrollBy({ left: Number(ds.slide) * track.clientWidth, behavior: reduceMotion ? "auto" : "smooth" }); }
    else if (t.id === "draw") draw();
    else if (t.id === "open-cart") { renderCart(); $("#cart").showModal(); }
    else if (t.id === "open-me") { if (state.me) openCharacter("me"); else openWizard({ fresh: true }); }
    else if (t.id === "edit-me") { if ($("#day").open) $("#day").close(); openWizard(); }
    else if (t.id === "restart-intro") openWizard({ fresh: true });
    else if (t.id === "me-back") { readStep(); step = Math.max(0, step - 1); renderWizard(); }
    else if (t.id === "me-skip") { state.introSeen = true; save(); $("#me").close(); }
    else if (t.id === "kid-add") { readStep(); draft.kids.push({ name: "", age: "" }); renderWizard(); }
    else if (ds.kidRemove !== undefined) { readStep(); draft.kids.splice(Number(ds.kidRemove), 1); renderWizard(); }
    else if (t.id === "me-start") { $("#me").close(); openCharacter("me"); }
    else if (t.id === "me-browse") { $("#me").close(); $("#grid").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" }); }
    else if (t.id === "like-me") { state.likeMe = state.likeMe === current ? null : current; save(); renderDay(); renderAll(); if (state.likeMe) toast("獲得徽章：這就是我"); }
    else if (t.id === "pack-cart") { const boxes = $$('#day input[name="pack"]'); boxes.forEach((b) => { if (b.checked) toggleCart(b.value, true); }); progress(current).packed = true; save(); renderDay(); toast(`放進購物清單：${boxes.filter((b) => b.checked).length} 件`); }
    else if (t.id === "share") share(getChar(current));
    else if (t.id === "next-char") { const rest = P.characters.filter((c) => !state.done[c.id]?.completed); if (rest.length) openCharacter(rest[0].id); else { $("#day").close(); toast("每個人的一天都陪伴過了！"); } }
    else if (ds.close) $("#" + ds.close).close();
    else if (t.id === "reset") { $("#reset-confirm").hidden = false; }
    else if (t.id === "reset-yes") { state = blank(); save(); $("#reset-confirm").hidden = true; renderAll(); toast("已重新開始"); }
    else if (t.id === "reset-no") { $("#reset-confirm").hidden = true; }
  });
  document.addEventListener("change", (e) => {
    if (["hasKids", "petType"].includes(e.target.name) && $("#me").open) { readStep(); renderWizard(); return; }
    if (e.target.id !== "auto-read") return;
    state.autoRead = e.target.checked;
    save();
    if (state.autoRead && current) {
      const c = getChar(current);
      const d = progress(c.id);
      const i = c.day.findIndex((_, n) => d.picks[n] === undefined);
      play(i >= 0 ? `${c.id}/s${i}` : `${c.id}/intro`);
    }
  });
  document.addEventListener("submit", (e) => {
    if (e.target.id !== "me-form") return;
    e.preventDefault();
    readStep();
    const err = $("#me-error");
    if (step === 2 && draft.hasKids === null) { err.textContent = "選「有」或「沒有」。"; return; }
    if (step === 2 && draft.hasKids && draft.kids.some((k) => !k.age)) { err.textContent = "幫每個孩子選一下年紀，故事才對得上。"; return; }
    if (step === 4 && !draft.goal) { err.textContent = "選一個目標，你的一天會從這裡開始。"; return; }
    if (step === 5 && draft.worries.length > 3) { err.textContent = "最多選 3 個，先挑最困擾的。"; return; }
    if (step === 5) {
      const changed = JSON.stringify(state.me) !== JSON.stringify(draft);
      state.me = JSON.parse(JSON.stringify(draft));
      state.introSeen = true;
      if (changed) delete state.done.me;
      save();
      renderAll();
      toast("獲得徽章：建立我的角色");
    }
    step = Math.min(STEPS.length - 1, step + 1);
    renderWizard();
  });
  // 輪播頁碼
  document.addEventListener("scroll", (e) => {
    const track = e.target;
    if (!(track instanceof HTMLElement) || !track.classList.contains("track")) return;
    const count = track.parentElement.querySelector(".count");
    if (count) count.textContent = `${Math.round(track.scrollLeft / track.clientWidth) + 1} / ${track.children.length}`;
  }, true);
  // 圖讀不到時換成色塊，不留破圖。
  document.addEventListener("error", (e) => {
    const img = e.target;
    if (!(img instanceof HTMLImageElement) || !img.closest(".slide")) return;
    const slide = img.closest(".slide");
    const track = slide.parentElement;
    slide.remove();
    if (!track.children.length) track.closest(".carousel").innerHTML = `<span class="img-fallback" aria-hidden="true">鷹</span>`;
  }, true);
  $("#day").addEventListener("close", () => { history.replaceState(null, "", location.pathname); current = null; afterPlay = null; player.pause(); markPlaying(null); });
  for (const id of ["day", "cart", "me", "product"]) $("#" + id).addEventListener("click", (e) => { if (e.target.id === id) e.target.close(); });

  renderAll();
  renderDataNote();
  loadProducts().then(() => { renderAll(); });
  loadVoice().then(() => { if ($("#day").open) renderDay(); });
  const hash = location.hash.slice(1);
  if (hash && getChar(hash)) openCharacter(hash);
  else if (!state.me && !state.introSeen) openWizard({ fresh: true });
})();
