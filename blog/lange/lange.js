(() => {
  const form = document.querySelector('#lange-planner');
  const output = document.querySelector('#lange-planner-result');
  if (!form || !output) return;

  const uses = [
    { id: 'face', label: '擦臉／擦手／洗澡小巾', size: '22x22cm', pack: 3, packLabel: '3入組' },
    { id: 'burp', label: '拍嗝巾', size: '25x40cm', pack: 2, packLabel: '2入組' },
    { id: 'bath', label: '洗澡浴巾', size: '70x95cm', pack: 1, packLabel: '單件' },
    { id: 'hair', label: '擦髮巾', size: '55x90cm', pack: 1, packLabel: '單件' }
  ];

  const number = (data, name, min, max) => {
    const value = Number(data.get(name));
    if (!Number.isFinite(value)) return min;
    return Math.min(max, Math.max(min, Math.round(value)));
  };

  function calculate(shouldFocus = false) {
    const data = new FormData(form);
    const wash = number(data, 'wash', 1, 14);
    const reserve = number(data, 'reserve', 0, 7);
    const rows = [];
    for (const use of uses) {
      if (data.get(`use-${use.id}`) !== 'on') continue;
      const daily = number(data, `daily-${use.id}`, 0, 12);
      const owned = number(data, `owned-${use.id}`, 0, 99);
      const total = daily * (wash + reserve);
      const missing = Math.max(0, total - owned);
      const packs = missing ? Math.ceil(missing / use.pack) : 0;
      const size = use.id === 'bath' ? String(data.get('bath-size') || use.size) : use.size;
      rows.push({ ...use, size, daily, owned, total, missing, packs });
    }

    if (!rows.length) {
      output.innerHTML = '<p><strong>先選一個用途。</strong></p><p class="estimator-note">沒有用到的用途不用買；也可以只估小方巾或浴巾其中一項。</p>';
      if (shouldFocus) output.focus({ preventScroll: true });
      return;
    }

    const items = rows.map(row => {
      const supplement = row.missing === 0
        ? '目前數量已足夠，不一定要補。'
        : row.pack === 1
          ? `這次約補 ${row.missing} 條，約 ${row.packs} 件。`
          : `這次約缺 ${row.missing} 條；換算 ${row.packLabel} 約 ${row.packs} 包，共 ${row.packs * row.pack} 條。`;
      return `<div class="result-item"><strong>${row.label}｜${row.size}</strong><span>建議總數 ${row.total} 條；家裡已有 ${row.owned} 條。${supplement}</span></div>`;
    }).join('');

    output.innerHTML = `<p><strong>依你的換洗節奏，先這樣抓：</strong></p>
      <div class="result-list">${items}</div>
      <p class="estimator-note">這是可調整的換洗估算，不是官方必買數量。當期顏色、入數與組合請回購買頁核對。</p>`;
    if (shouldFocus) output.focus({ preventScroll: true });
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    calculate(true);
  });
  calculate();

  document.querySelectorAll('[data-lange-video] .ig-poster').forEach(button => {
    button.addEventListener('click', () => {
      const src = button.dataset.embedUrl;
      if (!src) return;
      const iframe = document.createElement('iframe');
      iframe.src = src;
      iframe.title = 'L’Ange 棉之境 Instagram Reel';
      iframe.loading = 'lazy';
      iframe.allow = 'autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share';
      iframe.allowFullscreen = true;
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      iframe.className = 'ig-frame';
      button.replaceWith(iframe);
    }, { once: true });
  });
})();
