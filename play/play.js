/* 角色卡體驗（GB-028，測試版）。進度只存在這台裝置的瀏覽器（localStorage），不上傳。 */
(function () {
  "use strict";
  const P = window.PlayCharacters;
  const ORIGIN = document.documentElement.dataset.origin || "";
  const abs = (u) => (u && u.startsWith("/") ? ORIGIN + u : u || "");
  const $ = (s, el = document) => el.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const STORE = "eaglish-play-v1";
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  // ---------- 進度 ----------
  const blank = () => ({ done: {}, saved: [], likeMe: null, me: null });
  let state = blank();
  try { state = { ...blank(), ...JSON.parse(localStorage.getItem(STORE) || "{}") }; } catch {}
  const save = () => { try { localStorage.setItem(STORE, JSON.stringify(state)); } catch {} };
  const progress = (id) => (state.done[id] ||= { scenes: {}, completed: false, bonus: 0 });
  const comfort = (c) => {
    const d = state.done[c.id];
    if (!d) return 20;
    const n = Object.keys(d.scenes).length;
    return Math.min(100, 20 + Math.round((80 * n) / c.day.length) + (d.completed ? d.bonus : 0));
  };
  const completedIds = () => P.characters.filter((c) => state.done[c.id]?.completed).map((c) => c.id);

  const BADGES = [
    { id: "first", icon: "✦", label: "第一次補給", test: () => Object.values(state.done).some((d) => Object.keys(d.scenes).length) },
    { id: "day", icon: "☀", label: "陪伴一整天", test: () => completedIds().length >= 1 },
    { id: "moms", icon: "♡", label: "媽媽後援會", test: () => ["shihan", "yating", "peishan"].every((i) => completedIds().includes(i)) },
    { id: "dads", icon: "⚑", label: "爸爸同盟", test: () => ["jiahao", "chenghan"].every((i) => completedIds().includes(i)) },
    { id: "travel", icon: "✈", label: "旅行規劃師", test: () => ["yating", "chenghan"].every((i) => completedIds().includes(i)) },
    { id: "me", icon: "☺", label: "這就是我", test: () => !!state.likeMe },
    { id: "card", icon: "✎", label: "我的角色卡", test: () => !!state.me },
    { id: "all", icon: "★", label: "全圖鑑完成", test: () => completedIds().length === P.characters.length },
  ];
  const LEVELS = [
    { min: 0, label: "見習補給官" },
    { min: 1, label: "補給官" },
    { min: 3, label: "資深補給官" },
    { min: 6, label: "首席補給官" },
  ];
  const level = () => [...LEVELS].reverse().find((l) => completedIds().length >= l.min).label;

  // ---------- 商品資料：團購 Sheet（即時）→ 快照（備援） ----------
  const products = new Map();
  let live = "loading"; // loading | live | snapshot
  const rank = { open: 0, upcoming: 1, unknown: 2, closed: 3 };
  async function loadProducts() {
    try {
      const snap = await fetch(abs("/config/catalog-snapshot.json"), { cache: "no-store" }).then((r) => r.json());
      for (const i of snap.items || []) {
        if (products.has(i.brand)) continue;
        products.set(i.brand, { brand: i.brand, image: abs(i.image), description: i.description, article: abs(i.article), status: { key: "unknown", label: "開團狀態以首頁為準" }, url: "", countdown: "" });
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
  const info = (brand) => products.get(brand) || { brand, image: "", description: "", article: "", status: { key: "unknown", label: "開團狀態以首頁為準" }, url: "", countdown: "" };

  // ---------- 角色頭像（SVG 插圖） ----------
  function avatar(c, size = 120) {
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
    return `<svg class="avatar" viewBox="0 0 120 120" width="${size}" height="${size}" role="img" aria-label="${esc(c.name)}的插圖">` +
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
    const host = document.querySelector("dialog[open]") || document.body;
    if (t.parentElement !== host) host.appendChild(t);
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => t.classList.remove("show"), 2400);
  }
  const meter = (value, color) => `<div class="meter" role="meter" aria-label="安心值" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${value}"><span style="width:${value}%;background:${color}"></span></div>`;
  function statusBadge(i) {
    const cls = { open: "open", upcoming: "upcoming", closed: "closed" }[i.status.key] || "unknown";
    return `<span class="status ${cls}">${esc(i.status.label)}</span>` + (i.countdown ? ` <span class="countdown${i.closingSoon ? " soon" : ""}">${esc(i.countdown)}</span>` : "");
  }
  function productCard(brand, { choose = null, compact = false } = {}) {
    const i = info(brand);
    const saved = state.saved.includes(brand);
    const img = i.image
      ? `<img src="${esc(i.image)}" alt="" loading="lazy" width="320" height="240">`
      : `<span class="img-fallback" aria-hidden="true">${esc([...brand.replace(/^[^A-Za-z一-鿿]+/, "")][0] || "鷹")}</span>`;
    const actions = [
      choose !== null ? `<button type="button" class="button primary" data-choose="${choose}" data-brand="${esc(brand)}">送出這個補給</button>` : "",
      i.url ? `<a class="button" href="${esc(i.url)}" target="_blank" rel="noopener noreferrer">前往團購</a>` : "",
      i.article ? `<a class="text-link" href="${esc(i.article)}">生活筆記</a>` : "",
      `<button type="button" class="save${saved ? " on" : ""}" data-save="${esc(brand)}" aria-pressed="${saved}">${saved ? "★ 已在補給清單" : "☆ 補給清單"}</button>`,
    ].filter(Boolean).join("");
    return `<article class="product${compact ? " compact" : ""}"><div class="product-img">${img}</div><div class="product-body"><h4>${esc(brand)}</h4>${statusBadge(i)}${compact ? "" : `<p>${esc(i.description || "商品說明以團購頁為準。")}</p>`}<div class="product-actions">${actions}</div></div></article>`;
  }

  // ---------- 首頁：進度、篩選、卡片 ----------
  let filter = "all";
  function renderStats() {
    const got = BADGES.filter((b) => b.test());
    $("#stats").innerHTML =
      `<div class="stat"><span class="stat-label">你的稱號</span><strong>${level()}</strong></div>` +
      `<div class="stat"><span class="stat-label">已陪伴</span><strong>${completedIds().length} / ${P.characters.length}</strong></div>` +
      `<div class="stat"><span class="stat-label">補給清單</span><strong><button type="button" class="link-button" id="open-saved">${state.saved.length} 件</button></strong></div>` +
      `<div class="stat badges-stat"><span class="stat-label">徽章 ${got.length} / ${BADGES.length}</span><span class="badges">${BADGES.map((b) => `<span class="badge${b.test() ? " got" : ""}" title="${esc(b.label)}"><span aria-hidden="true">${b.icon}</span><span class="sr-only">${esc(b.label)}${b.test() ? "（已獲得）" : "（未獲得）"}</span></span>`).join("")}</span></div>`;
  }
  function renderFilters() {
    $("#filters").innerHTML = P.groups.map((g) => `<button type="button" class="chip${filter === g.id ? " on" : ""}" data-filter="${g.id}" aria-pressed="${filter === g.id}">${g.label}</button>`).join("");
  }
  function renderGrid() {
    const list = P.characters.filter((c) => filter === "all" || c.groups.includes(filter));
    $("#grid").innerHTML = list.map((c) => {
      const d = state.done[c.id];
      const steps = d ? Object.keys(d.scenes).length : 0;
      const tag = d?.completed ? `<span class="card-flag done">已陪伴</span>` : steps ? `<span class="card-flag">進行中 ${steps}/${c.day.length}</span>` : "";
      return `<button type="button" class="char-card" data-open="${c.id}" style="--c:${c.color}" aria-label="打開${esc(c.name)}的角色卡">
        <span class="char-top">${tag}${state.likeMe === c.id ? `<span class="card-flag me">像我</span>` : ""}</span>
        ${avatar(c, 112)}
        <span class="char-name">${esc(c.name)}<small>${c.age} 歲</small></span>
        <span class="char-role">${esc(c.role)}</span>
        <span class="char-tagline">${esc(c.tagline)}</span>
        <span class="char-meter"><span class="meter-label">安心值</span>${meter(comfort(c), c.color)}</span>
      </button>`;
    }).join("");
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

  // ---------- 角色的一天 ----------
  let current = null;
  let eventFor = {};
  function renderDay() {
    const c = current;
    if (!c) return;
    const d = progress(c.id);
    if (eventFor[c.id] === undefined) eventFor[c.id] = Math.floor(Math.random() * P.events.length);
    const ev = P.events[eventFor[c.id]];
    const firstOpen = c.day.findIndex((_, i) => d.scenes[i] === undefined);
    const scenes = c.day.map((s, i) => {
      const chosen = d.scenes[i];
      let body;
      if (chosen !== undefined) {
        body = `<p class="scene-text">${esc(s.text)}</p><p class="reaction"><span aria-hidden="true">💬</span> ${esc(s.reaction)}</p>${productCard(chosen, { compact: true })}`;
      } else if (i === firstOpen) {
        body = `<p class="scene-text">${esc(s.text)}</p><p class="need"><strong>需要：</strong>${esc(s.need)}</p>
          <p class="choose-hint">${s.options.length > 1 ? `幫${esc(c.nick)}選一個補給：` : `送${esc(c.nick)}這個補給：`}</p>
          <div class="options">${s.options.map((b) => productCard(b, { choose: i })).join("")}</div>`;
      } else {
        body = `<p class="scene-text locked-text">這一段還沒發生。先陪${esc(c.nick)}度過上一段吧。</p>`;
      }
      const evHtml = i === 2 && (firstOpen === -1 || firstOpen > 2)
        ? `<li class="scene event"><span class="time">意外</span><div><h3>${esc(ev.title)}</h3><p class="scene-text">${esc(ev.text)}</p></div></li>` : "";
      return evHtml + `<li class="scene${chosen !== undefined ? " done" : i === firstOpen ? " current" : " locked"}"><span class="time">${esc(s.time)}</span><div><h3>${esc(s.title)}</h3>${body}</div></li>`;
    }).join("");
    const finished = d.completed;
    const summary = finished
      ? `<section class="summary" aria-labelledby="summary-title"><h3 id="summary-title">你陪${esc(c.nick)}過完了一天 ☀</h3>
          <p>今天的補給：${c.day.map((_, i) => esc(d.scenes[i])).filter(Boolean).map((b) => `<span class="pill">${b}</span>`).join("")}</p>
          <div class="summary-actions"><button type="button" class="button primary" id="save-all">全部加入補給清單</button><button type="button" class="button" id="share">分享這張角色卡</button><button type="button" class="button" id="next-char">認識下一位</button></div></section>` : "";
    $("#day-body").innerHTML = `
      <aside class="profile" style="--c:${c.color}">
        ${avatar(c, 150)}
        <h2 id="day-title">${esc(c.name)}<small>${c.age} 歲</small></h2>
        <p class="role">${esc(c.role)}・${esc(c.place)}</p>
        <p class="story">${esc(c.story)}</p>
        <div class="profile-meter"><span class="meter-label">安心值 ${comfort(c)}</span>${meter(comfort(c), c.color)}</div>
        <button type="button" class="button like${state.likeMe === c.id ? " on" : ""}" id="like-me" aria-pressed="${state.likeMe === c.id}">${state.likeMe === c.id ? "☺ 這就是我" : "這就是我！"}</button>
        <p class="data-note small" id="day-data-note">${live === "live" ? "商品開團狀態為即時資料。" : "開團狀態以首頁為準。"}</p>
      </aside>
      <div class="timeline"><ol>${scenes}</ol>${summary}</div>`;
  }
  function openCharacter(id, { fromDraw = false } = {}) {
    current = P.characters.find((c) => c.id === id);
    if (!current) return;
    renderDay();
    const dlg = $("#day");
    if (!dlg.open) dlg.showModal();
    dlg.scrollTop = 0;
    if (fromDraw) toast(`今天遇見的是：${current.nick}`);
    history.replaceState(null, "", "#" + id);
  }
  function choose(sceneIndex, brand) {
    const c = current;
    const d = progress(c.id);
    d.scenes[sceneIndex] = brand;
    if (Object.keys(d.scenes).length === c.day.length && !d.completed) {
      d.completed = true;
      d.bonus = P.events[eventFor[c.id] ?? 0].bonus;
      setTimeout(() => toast(`獲得徽章：陪伴${c.nick}一整天`), reduceMotion ? 0 : 300);
    }
    save();
    renderDay();
    renderAll();
    const next = $("#day .scene.current") || $("#day .summary");
    next?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }
  function toggleSave(brand) {
    const i = state.saved.indexOf(brand);
    if (i >= 0) state.saved.splice(i, 1); else state.saved.push(brand);
    save();
    toast(i >= 0 ? "已從補給清單移除" : "已加入補給清單");
    if ($("#day").open) renderDay();
    if ($("#saved").open) renderSaved();
    renderStats();
  }
  async function share(c) {
    const url = location.origin + location.pathname + "#" + c.id;
    const text = `${c.name}，${c.age} 歲，${c.role}。${c.tagline}`;
    try {
      if (navigator.share) { await navigator.share({ title: `鷹家日常圖鑑｜${c.name}`, text, url }); return; }
      await navigator.clipboard.writeText(`${text} ${url}`);
      toast("連結已複製");
    } catch {}
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

  // ---------- 補給清單 ----------
  function renderSaved() {
    $("#saved-body").innerHTML = state.saved.length
      ? state.saved.map((b) => productCard(b)).join("")
      : `<p class="empty">還沒有東西。陪角色過一天，或在商品上按「☆ 補給清單」。</p>`;
  }

  // ---------- 我的角色卡 ----------
  function renderMeForm() {
    const r = P.builder;
    const me = state.me || {};
    $("#me-body").innerHTML = `
      <form id="me-form">
        <fieldset><legend>你現在比較像</legend>${r.roles.map((x) => `<label class="radio"><input type="radio" name="role" value="${x.id}" ${me.role === x.id ? "checked" : ""} required> ${x.label}</label>`).join("")}</fieldset>
        <fieldset><legend>最近的煩惱</legend>${r.worries.map((x) => `<label class="radio"><input type="radio" name="worry" value="${x.id}" ${me.worry === x.id ? "checked" : ""} required> ${x.label}</label>`).join("")}</fieldset>
        <label class="field">卡片上的暱稱（選填，只存在這台裝置）<input name="nick" maxlength="12" value="${esc(me.nick || "")}" autocomplete="off"></label>
        <button class="button primary" type="submit">做出我的角色卡</button>
      </form>
      <div id="me-result">${state.me ? meCard() : ""}</div>`;
  }
  function meCard() {
    const r = P.builder;
    const me = state.me;
    const role = r.roles.find((x) => x.id === me.role);
    const worry = r.worries.find((x) => x.id === me.worry);
    if (!role || !worry) return "";
    const order = (b) => rank[info(b).status.key] ?? 9;
    const picks = [...new Set([...worry.brands, ...role.brands])].sort((a, b) => order(a) - order(b)).slice(0, 4);
    const like = P.characters.find((c) => c.groups.some((g) => ({ work: "work", baby: "mom", toddler: "mom", kid: "dad", senior: "senior" }[me.role] === g))) || P.characters[0];
    return `<section class="me-card" style="--c:#a84c2b"><h3>${esc(me.nick || "我")}的角色卡</h3><p class="role">${esc(role.label)}・${esc(worry.label)}</p>
      <p>你的日子和 <button type="button" class="link-button" data-open="${like.id}">${esc(like.name)}</button> 有點像。為你挑的補給：</p>
      <div class="options">${picks.map((b) => productCard(b)).join("")}</div></section>`;
  }

  // ---------- 事件 ----------
  document.addEventListener("click", (e) => {
    const t = e.target.closest("button, a");
    if (!t) return;
    if (t.dataset.open) { if ($("#me").open) $("#me").close(); openCharacter(t.dataset.open); }
    else if (t.dataset.filter) { filter = t.dataset.filter; renderFilters(); renderGrid(); }
    else if (t.dataset.choose !== undefined) choose(Number(t.dataset.choose), t.dataset.brand);
    else if (t.dataset.save) toggleSave(t.dataset.save);
    else if (t.id === "draw") draw();
    else if (t.id === "open-saved") { renderSaved(); $("#saved").showModal(); }
    else if (t.id === "open-me") { renderMeForm(); $("#me").showModal(); }
    else if (t.id === "like-me") { state.likeMe = state.likeMe === current.id ? null : current.id; save(); renderDay(); renderAll(); if (state.likeMe) toast("獲得徽章：這就是我"); }
    else if (t.id === "save-all") { current.day.forEach((_, i) => { const b = state.done[current.id].scenes[i]; if (b && !state.saved.includes(b)) state.saved.push(b); }); save(); renderDay(); renderStats(); toast("今天的補給都加入清單了"); }
    else if (t.id === "share") share(current);
    else if (t.id === "next-char") { const rest = P.characters.filter((c) => !state.done[c.id]?.completed); if (rest.length) openCharacter(rest[0].id); else { $("#day").close(); toast("全部角色都陪伴過了！"); } }
    else if (t.dataset.close) $("#" + t.dataset.close).close();
    else if (t.id === "reset") { if (confirm("清除這台裝置上的遊戲進度和補給清單？")) { state = blank(); save(); renderAll(); toast("已重新開始"); } }
  });
  document.addEventListener("submit", (e) => {
    if (e.target.id !== "me-form") return;
    e.preventDefault();
    const f = new FormData(e.target);
    state.me = { role: f.get("role"), worry: f.get("worry"), nick: String(f.get("nick") || "").trim().slice(0, 12) };
    save();
    $("#me-result").innerHTML = meCard();
    $("#me-result").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    renderStats();
    toast("獲得徽章：我的角色卡");
  });
  $("#day").addEventListener("close", () => { history.replaceState(null, "", location.pathname); current = null; });
  for (const id of ["day", "saved", "me"]) $("#" + id).addEventListener("click", (e) => { if (e.target.id === id) e.target.close(); });

  renderAll();
  renderDataNote();
  loadProducts().then(() => { renderAll(); });
  const hash = location.hash.slice(1);
  if (hash && P.characters.some((c) => c.id === hash)) openCharacter(hash);
})();
