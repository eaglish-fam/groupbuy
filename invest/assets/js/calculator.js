// ============================================
// 🦅 鷹家投資工具箱 - 增強版 v2.1.0
// 新增：定期定額支援初始投資本金
// Date: 2025-10-27
// ============================================

// ============================================
// 📦 Core Utilities (format.js)
// ============================================
const $ = (id) => document.getElementById(id);

let currentCurrency = 'TWD';
let numberFmt = new Intl.NumberFormat('zh-Hant-TW', { 
  style: 'currency', 
  currency: 'TWD', 
  maximumFractionDigits: 0 
});

function setCurrency(code) {
  currentCurrency = code;
  numberFmt = new Intl.NumberFormat('zh-Hant-TW', { 
    style: 'currency', 
    currency: code, 
    maximumFractionDigits: 0 
  });
}

function toPct(x) { 
  if (x == null || isNaN(x)) return '—'; 
  return (x * 100).toFixed(2) + '%'; 
}

const pctToRate = (v) => (parseFloat(v) || 0) / 100;

const daysBetween = (a, b) => (new Date(b) - new Date(a)) / (1000 * 60 * 60 * 24);

function monthAdd(d, m) { 
  const nd = new Date(d); 
  nd.setMonth(nd.getMonth() + m); 
  return nd; 
}

function ymd(d) { 
  if (!d) return ''; 
  const z = new Date(d); 
  return z.toISOString().slice(0, 10); 
}

// ============================================
// 📊 Chart Rendering (chart.js)
// ============================================
let chart, loanChart;

function renderChart(labels, series) {
  const ctx = $('chart');
  if (!ctx) return;
  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: 'line',
    data: { 
      labels, 
      datasets: [{ 
        label: '資產餘額', 
        data: series, 
        fill: false,
        borderColor: 'rgb(37, 99, 235)',
        tension: 0.1
      }] 
    },
    options: { 
      responsive: true, 
      plugins: { 
        legend: { display: false } 
      } 
    }
  });
}

function renderLoanChart(labels, series) {
  const ctx = $('loanChart');
  if (!ctx) return;
  if (loanChart) loanChart.destroy();
  loanChart = new Chart(ctx, {
    type: 'line',
    data: { 
      labels, 
      datasets: [{ 
        label: '剩餘本金', 
        data: series, 
        fill: false,
        borderColor: 'rgb(239, 68, 68)',
        tension: 0.1
      }] 
    },
    options: { 
      responsive: true, 
      plugins: { 
        legend: { display: false } 
      } 
    }
  });
}

// ============================================
// 🎨 UI Helpers (ui.js)
// ============================================
function bindCurrency(onChange) {
  const el = $('currency');
  if (!el) return;
  el.addEventListener('change', e => {
    setCurrency(e.target.value);
    onChange && onChange();
  });
}

function tabs(containerSelector, callback) {
  const buttons = document.querySelectorAll(containerSelector + ' .tab');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.className = 'tab tab-inactive');
      btn.className = 'tab tab-active';
      callback && callback(btn.dataset.tab || btn.dataset.tool);
    });
  });
  return buttons;
}

function show(id) { 
  const el = document.getElementById(id); 
  if (el) el.classList.remove('hidden'); 
}

function hide(id) { 
  const el = document.getElementById(id); 
  if (el) el.classList.add('hidden'); 
}

// ============================================
// 🛡️ Safe Input Helpers
// ============================================
function getInputValue(id, defaultVal = 0) {
  const el = $(id);
  if (!el) {
    console.warn(`⚠️ Input element '${id}' not found, using default: ${defaultVal}`);
    return defaultVal;
  }
  const val = parseFloat(el.value);
  return isNaN(val) ? defaultVal : val;
}

function getSelectValue(id, defaultVal = '') {
  const el = $(id);
  return (el && el.value) ? el.value : defaultVal;
}

function getInputDate(id) {
  const el = $(id);
  return (el && el.value) ? new Date(el.value) : new Date();
}

// ============================================
// 💰 Investment Calculator (compound.js)
// ============================================

function resetDetail() {
  const tbody = $('detailBody');
  if (tbody) tbody.innerHTML = '';
}

function pushDetail(i, date, inAmt, interest, fees, tax, bal) {
  const tbody = $('detailBody');
  if (!tbody) return;

  const tr = document.createElement('tr');
  const cells = [
    i,
    ymd(date) || '—',
    numberFmt.format(inAmt),
    numberFmt.format(interest),
    numberFmt.format(fees),
    numberFmt.format(tax),
    numberFmt.format(bal)
  ];
  tr.innerHTML = cells.map(c => `<td>${c}</td>`).join('');
  tbody.appendChild(tr);
}

function netGrowthRate(annualReturn, mgmtPct, compoundFreq) {
  const r = annualReturn - mgmtPct;
  return Math.pow(1 + r, 1 / compoundFreq) - 1;
}

function applyFeesAndTax(gain, taxPct) {
  const tax = Math.max(0, gain) * taxPct;
  const afterTaxGain = gain - tax;
  return { afterTaxGain, tax };
}

function inflateToReal(nominalFinal, inflation, years) {
  return nominalFinal / Math.pow(1 + inflation, years);
}

function updateKPIs({ finalValue, finalReal, totalIn, gain, cagr, periods, freq, years, initialInvestment }) {
  const updateEl = (id, val) => {
    const el = $(id);
    if (el) el.textContent = val;
  };

  updateEl('outFinal', numberFmt.format(finalValue));
  updateEl('outFinalReal', numberFmt.format(finalReal));
  updateEl('outTotalIn', numberFmt.format(totalIn));
  updateEl('outGain', numberFmt.format(gain));
  updateEl('outCAGR', (isFinite(cagr) && cagr > -1) ? toPct(cagr) : '—');
  updateEl('outPeriods', periods);
  updateEl('outFreq', freq);
  updateEl('outYears', (years || 0).toFixed(2));
  
  // 🆕 顯示初始投資資訊 (如果有的話)
  if (initialInvestment && initialInvestment > 0) {
    updateEl('outInitial', numberFmt.format(initialInvestment));
    const initialInfo = $('initialInvestmentInfo');
    if (initialInfo) initialInfo.classList.remove('hidden');
  } else {
    const initialInfo = $('initialInvestmentInfo');
    if (initialInfo) initialInfo.classList.add('hidden');
  }
}

// Lump Sum Calculator
function runLump() {
  console.log('💰 Running Lump Sum calculation...');
  resetDetail();

  const PV = getInputValue('lumpAmount', 0);
  const rA = pctToRate(getInputValue('annualReturn', 8));
  const nY = getInputValue('years', 10);
  const m = getInputValue('compoundFreq', 12);
  const infl = pctToRate(getInputValue('inflation', 2));
  const feeIn = pctToRate(getInputValue('feePct', 0));
  const redeem = pctToRate(getInputValue('redeemPct', 0));
  const mgmt = pctToRate(getInputValue('mgmtPct', 0));
  const tax = pctToRate(getInputValue('taxPct', 0));
  const start = getInputDate('startDate');

  const eff = netGrowthRate(rA, mgmt, m);
  let bal = PV * (1 - feeIn);
  let totalIn = PV * (1 - feeIn);
  let labels = [], series = [];
  let date = new Date(start);

  for (let i = 1; i <= nY * m; i++) {
    const interest = bal * eff;
    const { afterTaxGain, tax: taxAmt } = applyFeesAndTax(interest, tax);
    bal += afterTaxGain;
    const fees = 0;
    if (i % m === 0) {
      labels.push(date.getFullYear() + "年" + ((date.getMonth() + 1)) + '月');
      series.push(bal);
    }
    pushDetail(i, date, 0, afterTaxGain, fees, taxAmt, bal);
    date = monthAdd(date, 12 / m);
  }

  const finalValue = bal * (1 - redeem);
  const finalReal = inflateToReal(finalValue, infl, nY);
  const gain = finalValue - totalIn;
  const cagr = Math.pow(finalValue / Math.max(1, totalIn), 1 / nY) - 1;

  renderChart(labels, series);
  updateKPIs({ finalValue, finalReal, totalIn, gain, cagr, periods: nY * m, freq: m, years: nY });
}

// 🆕 Enhanced DCA Calculator with Initial Investment
function runDCA() {
  console.log('📅 Running Enhanced DCA calculation with initial investment...');
  resetDetail();

  const amt = getInputValue('dcaAmount', 0);
  const initialInvestment = getInputValue('dcaInitial', 0); // 🆕 初始投資本金
  const rA = pctToRate(getInputValue('annualReturn', 8));
  const nY = getInputValue('years', 10);
  const m = getInputValue('compoundFreq', 12);
  const infl = pctToRate(getInputValue('inflation', 2));
  const feeIn = pctToRate(getInputValue('feePct', 0));
  const redeem = pctToRate(getInputValue('redeemPct', 0));
  const mgmt = pctToRate(getInputValue('mgmtPct', 0));
  const tax = pctToRate(getInputValue('taxPct', 0));
  const start = getInputDate('startDate');

  const eff = netGrowthRate(rA, mgmt, m);
  
  // 🆕 起始餘額 = 初始投資扣除手續費
  let bal = initialInvestment * (1 - feeIn);
  let totalIn = initialInvestment * (1 - feeIn);
  
  let labels = [], series = [];
  let date = new Date(start);

  for (let i = 1; i <= nY * m; i++) {
    const inAmt = amt * (1 - feeIn);
    bal += inAmt;
    totalIn += inAmt;
    const interest = bal * eff;
    const { afterTaxGain, tax: taxAmt } = applyFeesAndTax(interest, tax);
    bal += afterTaxGain;
    const fees = amt * feeIn;
    
    if (i % m === 0) {
      labels.push(date.getFullYear() + "年" + ((date.getMonth() + 1)) + '月');
      series.push(bal);
    }
    
    pushDetail(i, date, inAmt, afterTaxGain, fees, taxAmt, bal);
    date = monthAdd(date, 12 / m);
  }

  const finalValue = bal * (1 - redeem);
  const finalReal = inflateToReal(finalValue, infl, nY);
  const gain = finalValue - totalIn;
  const cagr = Math.pow(finalValue / Math.max(1, totalIn), 1 / nY) - 1;

  renderChart(labels, series);
  updateKPIs({ 
    finalValue, 
    finalReal, 
    totalIn, 
    gain, 
    cagr, 
    periods: nY * m, 
    freq: m, 
    years: nY,
    initialInvestment: initialInvestment * (1 - feeIn) // 🆕 傳遞初始投資資訊
  });
}

// StepUp Calculator (Enhanced with Initial Investment)
function runStepUp() {
  console.log('📈 Running StepUp calculation...');
  resetDetail();

  const base = getInputValue('stepBase', 8000);
  const initialInvestment = getInputValue('stepInitial', 0); // 🆕 初始投資本金
  const stepPct = pctToRate(getInputValue('stepPct', 5));
  const stepEvery = getInputValue('stepFreq', 12);
  const cap = getInputValue('stepCap', 0);
  const rA = pctToRate(getInputValue('annualReturn', 8));
  const nY = getInputValue('years', 10);
  const m = getInputValue('compoundFreq', 12);
  const infl = pctToRate(getInputValue('inflation', 2));
  const feeIn = pctToRate(getInputValue('feePct', 0));
  const redeem = pctToRate(getInputValue('redeemPct', 0));
  const mgmt = pctToRate(getInputValue('mgmtPct', 0));
  const tax = pctToRate(getInputValue('taxPct', 0));
  const start = getInputDate('startDate');

  const eff = netGrowthRate(rA, mgmt, m);
  
  // 🆕 起始餘額 = 初始投資扣除手續費
  let bal = initialInvestment * (1 - feeIn);
  let totalIn = initialInvestment * (1 - feeIn);
  
  let current = base;
  let labels = [], series = [];
  let date = new Date(start);

  for (let i = 1; i <= nY * m; i++) {
    if (i > 1 && i % stepEvery === 1) {
      current = current * (1 + stepPct);
      if (cap > 0 && current > cap) current = cap;
    }
    
    const inAmt = current * (1 - feeIn);
    bal += inAmt;
    totalIn += inAmt;
    const interest = bal * eff;
    const { afterTaxGain, tax: taxAmt } = applyFeesAndTax(interest, tax);
    bal += afterTaxGain;
    const fees = current * feeIn;
    
    if (i % m === 0) {
      labels.push(date.getFullYear() + "年" + ((date.getMonth() + 1)) + '月');
      series.push(bal);
    }
    
    pushDetail(i, date, inAmt, afterTaxGain, fees, taxAmt, bal);
    date = monthAdd(date, 12 / m);
  }

  const finalValue = bal * (1 - redeem);
  const finalReal = inflateToReal(finalValue, infl, nY);
  const gain = finalValue - totalIn;
  const cagr = Math.pow(finalValue / Math.max(1, totalIn), 1 / nY) - 1;

  renderChart(labels, series);
  updateKPIs({ 
    finalValue, 
    finalReal, 
    totalIn, 
    gain, 
    cagr, 
    periods: nY * m, 
    freq: m, 
    years: nY,
    initialInvestment: initialInvestment * (1 - feeIn) // 🆕 傳遞初始投資資訊
  });
}

// Goal Calculator
function runGoal() {
  console.log('🎯 Running Goal calculation...');
  resetDetail();

  const target = getInputValue('goalTarget', 10000000);
  const solveFor = getSelectValue('goalSolveFor', 'monthly');
  const rA = pctToRate(getInputValue('annualReturn', 8));
  const m = getInputValue('compoundFreq', 12);
  const infl = pctToRate(getInputValue('inflation', 2));
  const feeIn = pctToRate(getInputValue('feePct', 0));
  const redeem = pctToRate(getInputValue('redeemPct', 0));
  const mgmt = pctToRate(getInputValue('mgmtPct', 0));
  const tax = pctToRate(getInputValue('taxPct', 0));

  const eff = netGrowthRate(rA, mgmt, m);
  let result = { value: 0, type: solveFor };

  if (solveFor === 'monthly') {
    const nY = getInputValue('goalYears', 15);
    const n = nY * m;
    const targetAdj = target / (1 - redeem);
    const factor = Math.pow(1 + eff, n) - 1;
    const pmt = (targetAdj * eff) / factor;
    const grossPmt = pmt / (1 - feeIn);
    result.value = grossPmt;
    result.years = nY;
    result.periods = n;
    
    alert(`💡 達成目標 ${numberFmt.format(target)}，需每期投入約 ${numberFmt.format(grossPmt)}`);
  } else {
    const pmt = getInputValue('goalMonthly', 10000);
    const netPmt = pmt * (1 - feeIn);
    const targetAdj = target / (1 - redeem);
    
    let lo = 0, hi = 100;
    for (let iter = 0; iter < 100; iter++) {
      const mid = (lo + hi) / 2;
      const n = mid * m;
      const factor = Math.pow(1 + eff, n) - 1;
      const fv = netPmt * (factor / eff);
      if (Math.abs(fv - targetAdj) < 1000) {
        result.value = mid;
        result.periods = n;
        alert(`💡 每期投入 ${numberFmt.format(pmt)}，約需 ${mid.toFixed(1)} 年可達成目標 ${numberFmt.format(target)}`);
        break;
      }
      if (fv < targetAdj) lo = mid; else hi = mid;
    }
  }
}

// Wire Compound Tabs
function wireCompoundTabs() {
  const panels = {
    lump: $('panel-lump'),
    dca: $('panel-dca'),
    stepup: $('panel-stepup'),
    goal: $('panel-goal')
  };

  let lastRunner = runLump;

  function runLast() {
    if (lastRunner) {
      try {
        lastRunner();
      } catch (err) {
        console.error('❌ Calculation error:', err);
        alert('計算發生錯誤：' + err.message);
      }
    }
  }

  const tabButtons = document.querySelectorAll('#tabs button');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.className = 'tab tab-inactive');
      btn.className = 'tab tab-active';
      Object.values(panels).forEach(p => { if (p) p.classList.add('hidden'); });

      const key = btn.dataset.tab;
      if (panels[key]) panels[key].classList.remove('hidden');

      lastRunner = ({
        lump: runLump,
        dca: runDCA,
        stepup: runStepUp,
        goal: runGoal
      })[key];

      runLast();
    });
  });

  return { runLast, setLast: (fn) => lastRunner = fn };
}

// ============================================
// 🏦 Loan Calculator (loan.js)
// ============================================

function applyLoanPreset(type) {
  const set = (id, v) => {
    const el = $(id);
    if (el) el.value = v;
  };

  if (type === 'personal') {
    set('loanMethod', 'annuity');
    set('loanAPR', 8);
    set('loanYears', 5);
    set('loanPY', 12);
  }
  if (type === 'mortgage') {
    set('loanMethod', 'annuity');
    set('loanAPR', 2);
    set('loanYears', 20);
    set('loanPY', 12);
  }
  if (type === 'auto') {
    set('loanMethod', 'annuity');
    set('loanAPR', 3);
    set('loanYears', 5);
    set('loanPY', 12);
  }
  if (type === 'policy') {
    set('loanMethod', 'interest_only');
    set('loanAPR', 4);
    set('loanYears', 3);
    set('loanPY', 12);
  }
}

function runLoan() {
  console.log('🏦 Running Loan calculation...');

  const P = getInputValue('loanAmount', 0);
  const apr = pctToRate(getInputValue('loanAPR', 2));
  const years = getInputValue('loanYears', 20);
  const py = getInputValue('loanPY', 12);
  const n = Math.round(years * py);
  const i = apr / py;
  const method = getSelectValue('loanMethod', 'annuity');
  const startDate = getInputDate('loanStart');
  const feeFixed = getInputValue('loanFeeFixed', 0);
  const feePct = pctToRate(getInputValue('loanFeePct', 0));
  const upfrontFee = feeFixed + P * feePct;

  let balance = P;
  let labels = [], series = [];
  let tbody = $('loanDetailBody');
  if (tbody) tbody.innerHTML = '';

  let totalInterest = 0;
  let schedule = [];
  let PMT = 0;
  let cursor = new Date(startDate);

  if (method === 'annuity') {
    PMT = (i === 0) ? P / n : P * i * Math.pow(1 + i, n) / (Math.pow(1 + i, n) - 1);
    for (let k = 1; k <= n; k++) {
      const interest = balance * i;
      const principal = PMT - interest;
      balance = Math.max(0, balance - principal);
      schedule.push({ k, date: new Date(cursor.getTime()), principal, interest, payment: PMT, balance });
      cursor.setMonth(cursor.getMonth() + (12 / py));
      totalInterest += interest;
      labels.push(`第${k}`);
      series.push(balance);
    }
  } else if (method === 'equal_principal') {
    const principalBase = P / n;
    for (let k = 1; k <= n; k++) {
      const interest = balance * i;
      const payment = principalBase + interest;
      balance = Math.max(0, balance - principalBase);
      schedule.push({ k, date: new Date(cursor.getTime()), principal: principalBase, interest, payment, balance });
      cursor.setMonth(cursor.getMonth() + (12 / py));
      totalInterest += interest;
      labels.push(`第${k}`);
      series.push(balance);
    }
    PMT = schedule.length ? schedule[0].payment : 0;
  } else { // interest_only / bullet
    for (let k = 1; k <= n; k++) {
      const interest = P * i;
      const payment = (k === n) ? (interest + P) : interest;
      const principal = (k === n) ? P : 0;
      const bal = (k === n) ? 0 : P;
      schedule.push({ k, date: new Date(cursor.getTime()), principal, interest, payment, balance: bal });
      cursor.setMonth(cursor.getMonth() + (12 / py));
      totalInterest += interest;
      labels.push(`第${k}`);
      series.push(bal);
    }
    PMT = schedule[0]?.payment || 0;
  }

  if (tbody) {
    schedule.forEach(r => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${r.k}</td><td>${ymd(r.date)}</td><td>${numberFmt.format(r.principal)}</td><td>${numberFmt.format(r.interest)}</td><td>${numberFmt.format(r.payment)}</td><td>${numberFmt.format(r.balance)}</td>`;
      tbody.appendChild(tr);
    });
  }

  const totalPayment = schedule.reduce((s, r) => s + r.payment, 0);
  const totalCost = totalPayment + upfrontFee;

  const updateEl = (id, val) => {
    const el = $(id);
    if (el) el.textContent = val;
  };

  updateEl('loanOutPMT', numberFmt.format(PMT));
  updateEl('loanOutInterest', numberFmt.format(totalInterest));
  updateEl('loanOutTotalCost', numberFmt.format(totalCost));
  updateEl('loanOutN', n);

  renderLoanChart(labels, series);

  // APR IRR (per period -> annualized)
  const cfs = [{ t: 0, amt: (P - upfrontFee) }];
  schedule.forEach((r, idx) => cfs.push({ t: idx + 1, amt: -r.payment }));
  const aprEff = irrFromSchedule(cfs, py);
  updateEl('loanOutAPR', isFinite(aprEff) ? ((aprEff * 100).toFixed(2) + '%') : '—');
}

function resetLoan() {
  ['loanAmount', 'loanAPR', 'loanYears', 'loanPY', 'loanMethod', 'loanStart', 'loanFeeFixed', 'loanFeePct'].forEach(id => {
    const el = $(id);
    if (!el) return;
    const v = el.getAttribute('value');
    if (v != null) el.value = v;
  });

  const tbody = $('loanDetailBody');
  if (tbody) tbody.innerHTML = '';

  renderLoanChart([], []);

  ['loanOutPMT', 'loanOutInterest', 'loanOutTotalCost', 'loanOutN', 'loanOutAPR'].forEach(id => {
    const el = $(id);
    if (el) el.textContent = '—';
  });
}

function irrFromSchedule(cfs, py) {
  function npv(r) {
    return cfs.reduce((s, cf) => s + cf.amt / Math.pow(1 + r, cf.t), 0);
  }

  let lo = -0.9999, hi = 10;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2, v = npv(mid);
    if (Math.abs(v) < 1e-7) return Math.pow(1 + mid, py) - 1;
    const vlo = npv(lo);
    if (Math.sign(v) === Math.sign(vlo)) lo = mid; else hi = mid;
  }
  return Math.pow(1 + (lo + hi) / 2, py) - 1;
}

// ============================================
// 🚀 Main App Initialization
// ============================================

function initApp() {
  console.log('🦅 Initializing 鷹家投資工具箱 v2.1.0...');

  // Header currency binding
  bindCurrency(() => {
    const loanTool = document.getElementById('tool-loan');
    if (loanTool && !loanTool.classList.contains('hidden')) {
      runLoan();
    } else {
      runLump();
    }
  });

  // Top-level tool selection
  function showTool(key) {
    hide('tool-compound');
    hide('tool-loan');
    show('tool-' + key);

    const sel = $('toolSelect');
    if (sel) sel.value = key;

    document.querySelectorAll('#toolTabs .tab').forEach(b => {
      b.className = 'tab tab-inactive';
      if (b.dataset.tool === key) b.className = 'tab tab-active';
    });
  }

  tabs('#toolTabs', (k) => showTool(k));
  
  const toolSelect = $('toolSelect');
  if (toolSelect) {
    toolSelect.addEventListener('change', e => showTool(e.target.value));
  }

  // Wire compound tool tabs
  wireCompoundTabs();

  // Expose functions globally for inline onclick handlers
  window.runLump = runLump;
  window.runDCA = runDCA;
  window.runStepUp = runStepUp;
  window.runGoal = runGoal;
  window.applyLoanPreset = applyLoanPreset;
  window.runLoan = runLoan;
  window.resetLoan = resetLoan;

  // Initialize
  setCurrency('TWD');
  showTool('compound');

  // Run initial calculation
  try {
    runLump();
    console.log('✅ App initialized successfully');
  } catch (err) {
    console.error('❌ Initial calculation error:', err);
  }
}

// DOM Ready Check
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
