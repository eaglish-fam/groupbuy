(() => {
  const form = document.querySelector('#bag-planner');
  const output = document.querySelector('#planner-result');
  if (!form || !output) return;

  const plural = (count, size) => `${size} × ${count} 片`;
  const calculate = () => {
    const data = new FormData(form);
    const days = Number(data.get('days'));
    const adults = Number(data.get('adults'));
    const children = Number(data.get('children'));
    const winter = data.get('season') === 'winter';
    const diapers = data.get('diapers') === 'yes' && children > 0;
    const separate = data.get('separate') === 'yes';

    let s = Math.max(0, Math.ceil((adults * days) / 4));
    let xs = Math.max(0, Math.ceil((children * days) / 4));
    let m = winter ? Math.max(1, Math.ceil((adults + children) / 2)) : 0;
    if (diapers) xs += days <= 3 ? 1 : Math.ceil(days / 4);
    if (separate) s += 1;

    const reasons = [];
    if (adults) reasons.push(`${adults} 位成人、${days} 天：先以每人每 4 天約 1 片 S 分裝日常衣物。`);
    if (children) reasons.push(`${children} 位小孩：以 XS 分開裝童裝，臨時換洗比較好找。`);
    if (winter) reasons.push(`厚外套或毛衣另加 ${m} 片 M；不要用 S 硬塞蓬鬆衣物。`);
    if (diapers) reasons.push('尿布另外估 XS；請再按自家每日用量，對照官網每片約 10–15 片的容量。');
    if (separate) reasons.push('多留 1 片 S 裝已穿但乾燥的衣物；潮濕衣物先晾乾。');

    const packText = [
      xs ? `XS 約 ${Math.ceil(xs / 3)} 包（每包 3 片）` : '',
      s ? `S 約 ${Math.ceil(s / 2)} 包（每包 2 片）` : '',
      m ? `M 約 ${Math.ceil(m / 2)} 包（每包 2 片）` : ''
    ].filter(Boolean).join('、');

    output.innerHTML = `<p><strong>這趟可先從這組開始：</strong></p>
      <div class="bag-counts">
        ${xs ? `<div class="bag-count"><strong>${plural(xs, 'XS')}</strong><span>童裝／尿布</span></div>` : ''}
        ${s ? `<div class="bag-count"><strong>${plural(s, 'S')}</strong><span>日常換洗衣物</span></div>` : ''}
        ${m ? `<div class="bag-count"><strong>${plural(m, 'M')}</strong><span>厚衣／蓬鬆衣物</span></div>` : ''}
      </div>
      <p>${packText}</p>
      <ul class="result-reason">${reasons.map((reason) => `<li>${reason}</li>`).join('')}</ul>
      <p class="estimator-note">這是依官網尺寸容量做的起始估算。衣服厚度、換洗頻率與折法都會影響結果；出發前請先實裝一次，行李限重也要另外確認。</p>`;
    output.hidden = false;
    output.focus({ preventScroll: true });
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    calculate();
  });
  calculate();
})();
