/* 日常里繪本閱讀器（試播）。一集 = 封面 → 8 頁 → 尾頁（商品卡、感謝小卡）。
 * 聲音預設關閉，按「▶ 聽故事」才播放（手機瀏覽器不允許網頁自動出聲）；每句一個音檔，念完自動換下一句、下一頁。
 * 讀者在 /everyday/ 建立的角色（只存在這台裝置）會出現在最後一頁；名字只顯示在畫面上，不送去配音。 */
(function () {
  "use strict";
  const root = document.getElementById("book");
  const params = new URLSearchParams(location.search);
  const epId = (params.get("ep") || "ep01").replace(/[^a-z0-9]/g, "");
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const SPEEDS = [1, 1.2, 0.85];
  let ep, page = -1, sound = false, speed = 0, audio = null, lineIdx = 0, timer = 0;

  function me() {
    // Preview: ?me=a12&nick=小鷹媽 ; otherwise the character saved by /everyday/ on this device.
    let m = null;
    try { m = (JSON.parse(localStorage.getItem("eaglish-play-v2") || "null") || {}).me || null; } catch (e) {}
    if (params.get("me")) m = { avatar: params.get("me"), nick: params.get("nick") || "" };
    if (!m) return null;
    const list = (window.PlayCharacters && window.PlayCharacters.extraAvatars) || [];
    const look = list.find((a) => a.id === m.avatar) || list[0];
    return look ? { art: look.art, nick: (m.nick || "").slice(0, 12), dog: /pudding/.test(look.art) } : null;
  }

  function stopAudio() {
    clearTimeout(timer);
    if (audio) { audio.pause(); audio.onended = audio.onerror = null; audio = null; }
  }
  function audioSrc(p, i) { return `/assets/play/book/${ep.id}/p${p + 1}-${i + 1}.mp3`; }
  function playLine() {
    stopAudio();
    const lines = root.querySelectorAll(".line");
    lines.forEach((el, i) => el.classList.toggle("playing", sound && i === lineIdx));
    root.querySelector(".text")?.classList.toggle("has-audio", sound);
    if (!sound || page < 0 || page >= ep.pages.length) return;
    if (lineIdx >= ep.pages[page].lines.length) { timer = setTimeout(() => go(page + 1), 900); return; }
    audio = new Audio(audioSrc(page, lineIdx));
    audio.playbackRate = SPEEDS[speed];
    audio.onended = () => { lineIdx++; timer = setTimeout(playLine, 350); };
    audio.onerror = () => { lineIdx++; timer = setTimeout(playLine, 1600); }; // no file yet: give reading time
    audio.play().catch(() => { sound = false; render(); });
  }

  function face(who) { const v = ep.voices[who]; return v && v.face ? v.face : ""; }
  function lineHtml(l) {
    if (l.who === "narrator") return `<p class="line narrator">${esc(l.text)}</p>`;
    const v = ep.voices[l.who] || { name: l.who };
    return `<p class="line say"><img src="${esc(face(l.who))}" alt="" width="44" height="44"><span><b>${esc(v.name)}</b>${esc(l.text)}</span></p>`;
  }

  function cover() {
    const cast = ep.cast.map((k) => `<img src="/assets/play/characters/cast/${esc(k)}.webp" alt="" width="40" height="40">`).join("");
    return `<section class="cover">
      <div class="cover-art"><img src="${esc(ep.pages[0].art)}" alt="${esc(ep.pages[0].alt)}"><div class="cover-title"><small>鷹家日常里・第 ${ep.number} 集・約 ${ep.minutes} 分鐘</small><h1>${esc(ep.title)}</h1></div></div>
      <div class="cover-meta"><span class="cast" aria-hidden="true">${cast}</span><p>${esc(ep.teaser)}</p></div>
      <div class="actions"><button class="btn primary" data-start="sound">▶ 聽故事</button><button class="btn" data-start="quiet">安靜讀</button></div>
      <p class="small">${esc(ep.artNote)}</p>
    </section>`;
  }

  function pageHtml() {
    const p = ep.pages[page];
    const m = p.reader ? me() : null;
    const readerSlot = p.reader && m ? `<div class="reader-me"><img src="${esc(m.art)}" alt="你的角色"><span>${esc(m.nick || "你")}</span></div>` : "";
    const welcome = p.reader ? (m
      ? `<p class="welcome">${esc(m.dog ? "哇，是新搬來的狗狗！" : (m.nick ? m.nick + "，" : "") + "歡迎搬進日常里！")}</p>`
      : `<p class="welcome">你也想搬進日常里嗎？<a href="/everyday/">建立你自己的角色 →</a></p>`) : "";
    const tag = p.product ? `<button class="product-tag" data-product>這是 ${esc(ep.product.name)} →</button>` : "";
    const dots = ep.pages.map((_, i) => `<span class="${i === page ? "on" : ""}"></span>`).join("");
    return `<section class="page">
      <div class="art"><img src="${esc(p.art)}" alt="${esc(p.alt)}">
        <div class="art-bar"><span class="counter">${page + 1} / ${ep.pages.length}</span><span class="tools">
          <button class="tool" data-sound aria-pressed="${sound}" aria-label="${sound ? "關閉聲音" : "開啟聲音"}">${sound ? "🔊" : "🔈"}</button>
          <button class="tool" data-speed aria-label="播放速度">${SPEEDS[speed]}×</button></span></div>
        ${tag}${readerSlot}</div>
      <div class="side"><div class="text">${p.lines.map(lineHtml).join("")}${welcome}</div>
      <div class="nav"><button class="btn" data-go="-1">← 上一頁</button><span class="dots" aria-hidden="true">${dots}</span><button class="btn primary" data-go="1">${page === ep.pages.length - 1 ? "看完了 →" : "下一頁 →"}</button></div>
      <span class="direct">不想看故事？<a href="${esc(ep.product.article)}">直接看 ${esc(ep.product.name)}</a></span></div>
    </section>`;
  }

  function productCard() {
    const pr = ep.product;
    return `<div class="product-card"><img src="${esc(pr.photo)}" alt="${esc(pr.name)} 實拍"><div><h3>${esc(pr.name)}</h3><p>${esc(pr.line)}</p>
      <div class="actions"><a class="btn accent" href="${esc(pr.article)}#offer">查看當期團購 ↗</a><a class="btn" href="${esc(pr.article)}">看選物誌</a></div>
      <p class="small">${esc(pr.disclosure)}價格、組合與開團狀態以團購頁為準。</p></div></div>`;
  }

  function endHtml() {
    const from = ep.thanks.from.map((k) => `<img src="/assets/play/characters/cast/${esc(k)}.webp" alt="" width="40" height="40">`).join("");
    const names = ep.thanks.from.map((k) => (ep.voices[k] || {}).name || k).join("和");
    return `<section class="end">
      <h2>謝謝你讀完第 ${ep.number} 集</h2>
      <div class="card-box">${productCard()}</div>
      <div class="thanks"><span class="cast" aria-hidden="true">${from}</span><p>${esc(ep.thanks.text)}<small>—— ${esc(names)}・日常大樓 7 樓</small></p></div>
      <p class="small">${esc(ep.next)}</p>
      <div class="actions"><button class="btn" data-again>再看一次</button><a class="btn" href="/everyday/">回到鷹家日常</a><a class="btn primary" href="/everyday/">建立你自己的角色</a></div>
      <ul class="notes"><li>日常里的住戶和故事都是虛構的。</li><li>語音由 AI 生成（VoAI）；插畫為 AI 輔助繪製。</li><li>${esc(ep.product.disclosure)}</li></ul>
    </section>`;
  }

  function render() {
    stopAudio();
    root.innerHTML = page < 0 ? cover() : page >= ep.pages.length ? endHtml() : pageHtml();
    if (page >= 0 && page < ep.pages.length) root.insertAdjacentHTML("beforeend", `<div class="sheet" role="dialog" aria-label="${esc(ep.product.name)}"><button class="sheet-close" data-close aria-label="關閉">×</button>${productCard()}</div>`);
    if (page >= 0 && page < ep.pages.length) { lineIdx = 0; playLine(); }
  }
  function go(n) { page = Math.max(-1, Math.min(ep.pages.length, n)); render(); window.scrollTo({ top: 0, behavior: "smooth" }); }

  root.addEventListener("click", (e) => {
    const t = e.target.closest("button, a");
    if (!t) return;
    if (t.dataset.start) { sound = t.dataset.start === "sound"; go(0); }
    else if (t.dataset.go) go(page + Number(t.dataset.go));
    else if (t.hasAttribute("data-sound")) { sound = !sound; lineIdx = 0; render(); }
    else if (t.hasAttribute("data-speed")) { speed = (speed + 1) % SPEEDS.length; t.textContent = SPEEDS[speed] + "×"; if (audio) audio.playbackRate = SPEEDS[speed]; }
    else if (t.hasAttribute("data-product")) { stopAudio(); root.querySelector(".sheet").classList.add("open"); }
    else if (t.hasAttribute("data-close")) root.querySelector(".sheet").classList.remove("open");
    else if (t.hasAttribute("data-again")) go(-1);
  });
  document.addEventListener("keydown", (e) => {
    if (!ep || e.target.closest("input, textarea")) return;
    if (e.key === "ArrowRight") go(page + 1);
    if (e.key === "ArrowLeft") go(page - 1);
    if (e.key === "Escape") root.querySelector(".sheet")?.classList.remove("open");
  });
  let x0 = null;
  root.addEventListener("touchstart", (e) => { if (e.target.closest(".art")) x0 = e.touches[0].clientX; }, { passive: true });
  root.addEventListener("touchend", (e) => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; x0 = null; if (Math.abs(dx) > 50 && page >= 0) go(page + (dx < 0 ? 1 : -1)); });

  fetch(`./${epId}.json`).then((r) => r.json()).then((d) => { ep = d; document.title = `日常里繪本｜第 ${ep.number} 集 ${ep.title}（試播）`; render(); })
    .catch(() => { root.innerHTML = `<p class="loading">繪本暫時打不開，請稍後再試。</p>`; });
})();
