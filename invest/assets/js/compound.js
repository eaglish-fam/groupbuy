import { $, pctToRate, daysBetween, monthAdd, ymd, toPct, numberFmt } from './format.js';
import { renderChart } from './chart.js';

function resetDetail(){ 
  const tbody = $('detailBody');
  if (tbody) tbody.innerHTML = ''; 
}

function pushDetail(i, date, inAmt, interest, fees, tax, bal){
  const tbody = $('detailBody');
  if (!tbody) return;
  
  const tr=document.createElement('tr');
  const cells=[i, ymd(date)||'—', numberFmt.format(inAmt), numberFmt.format(interest), numberFmt.format(fees), numberFmt.format(tax), numberFmt.format(bal)];
  tr.innerHTML=cells.map(c=>`<td>${c}</td>`).join('');
  tbody.appendChild(tr);
}

function netGrowthRate(annualReturn, mgmtPct, compoundFreq){ 
  const r = annualReturn - mgmtPct; 
  return Math.pow(1 + r, 1/compoundFreq) - 1; 
}

function applyFeesAndTax(gain, taxPct){ 
  const tax = Math.max(0, gain) * taxPct; 
  const afterTaxGain = gain - tax; 
  return { afterTaxGain, tax }; 
}

function inflateToReal(nominalFinal, inflation, years){ 
  return nominalFinal / Math.pow(1+inflation, years); 
}

export function updateKPIs({finalValue, finalReal, totalIn, gain, cagr, periods, freq, years}){
  const updateEl = (id, val) => {
    const el = $(id);
    if (el) el.textContent = val;
  };
  
  updateEl('outFinal', numberFmt.format(finalValue));
  updateEl('outFinalReal', numberFmt.format(finalReal));
  updateEl('outTotalIn', numberFmt.format(totalIn));
  updateEl('outGain', numberFmt.format(gain));
  updateEl('outCAGR', (isFinite(cagr)&&cagr>-1)? toPct(cagr):'—');
  updateEl('outPeriods', periods);
  updateEl('outFreq', freq);
  updateEl('outYears', (years||0).toFixed(2));
}

// Helper to safely get input value
function getInputValue(id, defaultVal = 0) {
  const el = $(id);
  if (!el) {
    console.warn(`Input element '${id}' not found, using default: ${defaultVal}`);
    return defaultVal;
  }
  const val = parseFloat(el.value);
  return isNaN(val) ? defaultVal : val;
}

function getInputDate(id) {
  const el = $(id);
  return (el && el.value) ? new Date(el.value) : new Date();
}

// Lump sum
export function runLump(){
  console.log('Running Lump Sum calculation...');
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

  console.log('Inputs:', { PV, rA, nY, m, infl, feeIn, redeem, mgmt, tax });

  const eff=netGrowthRate(rA, mgmt, m);
  let bal=PV*(1-feeIn);
  let totalIn=PV*(1-feeIn);
  let labels=[], series=[];
  let date=new Date(start);

  for(let i=1;i<=nY*m;i++){
    const interest=bal*eff;
    const {afterTaxGain,tax:taxAmt}=applyFeesAndTax(interest,tax);
    bal+=afterTaxGain;
    const fees=0;
    if(i%m===0){ 
      labels.push(date.getFullYear()+"年"+((date.getMonth()+1))+'月'); 
      series.push(bal); 
    }
    pushDetail(i,date,0,afterTaxGain,fees,taxAmt,bal);
    date=monthAdd(date,12/m);
  }
  
  const finalValue=bal*(1-redeem);
  const finalReal=inflateToReal(finalValue,infl,nY);
  const gain=finalValue-totalIn;
  const cagr=Math.pow(finalValue/Math.max(1,totalIn),1/nY)-1;
  
  console.log('Results:', { finalValue, finalReal, gain, cagr });
  
  renderChart(labels,series);
  updateKPIs({finalValue,finalReal,totalIn,gain,cagr,periods:nY*m,freq:m,years:nY});
}

// DCA
export function runDCA(){
  console.log('Running DCA calculation...');
  resetDetail();
  
  const amt = getInputValue('dcaAmount', 0);
  const rA = pctToRate(getInputValue('annualReturn', 8));
  const nY = getInputValue('years', 10);
  const m = getInputValue('compoundFreq', 12);
  const infl = pctToRate(getInputValue('inflation', 2));
  const feeIn = pctToRate(getInputValue('feePct', 0));
  const redeem = pctToRate(getInputValue('redeemPct', 0));
  const mgmt = pctToRate(getInputValue('mgmtPct', 0));
  const tax = pctToRate(getInputValue('taxPct', 0));
  const start = getInputDate('startDate');

  const eff=netGrowthRate(rA, mgmt, m);
  let bal=0,totalIn=0;
  let labels=[],series=[];
  let date=new Date(start);

  for(let i=1;i<=nY*m;i++){
    let contribution=(m===12?amt:amt*(12/m));
    const fee=contribution*feeIn;
    contribution-=fee;
    bal+=contribution;
    totalIn+=(contribution+fee);

    const interest=bal*eff;
    const {afterTaxGain,tax:taxAmt}=applyFeesAndTax(interest,tax);
    bal+=afterTaxGain;

    if(i%m===0){ 
      labels.push(date.getFullYear()+"年"+((date.getMonth()+1))+'月'); 
      series.push(bal); 
    }
    pushDetail(i,date,contribution,afterTaxGain,fee,taxAmt,bal);
    date=monthAdd(date,12/m);
  }
  
  const finalValue=bal*(1-redeem);
  const finalReal=inflateToReal(finalValue,infl,nY);
  const gain=finalValue-totalIn;
  const cagr=Math.pow(finalValue/Math.max(1,totalIn),1/nY)-1;
  
  renderChart(labels,series);
  updateKPIs({finalValue,finalReal,totalIn,gain,cagr,periods:nY*m,freq:m,years:nY});
}

// Step-up
export function runStepUp(){
  console.log('Running Step-Up calculation...');
  resetDetail();
  
  let base = getInputValue('stepBase', 0);
  const stepPct = pctToRate(getInputValue('stepPct', 5));
  const stepFreq = getInputValue('stepFreq', 12);
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

  const eff=netGrowthRate(rA, mgmt, m);
  let bal=0,totalIn=0;
  let labels=[],series=[];
  let date=new Date(start);

  for(let i=1;i<=nY*m;i++){
    let thisMonth=base;
    if(cap>0) thisMonth=Math.min(thisMonth,cap);
    let contribution=(m===12?thisMonth:thisMonth*(12/m));
    const fee=contribution*feeIn;
    contribution-=fee;
    bal+=contribution; totalIn+=(contribution+fee);

    const interest=bal*eff;
    const {afterTaxGain,tax:taxAmt}=applyFeesAndTax(interest,tax);
    bal+=afterTaxGain;

    if(i%stepFreq===0){ base*=(1+stepPct); }

    if(i%m===0){ 
      labels.push(date.getFullYear()+"年"+((date.getMonth()+1))+'月'); 
      series.push(bal); 
    }
    pushDetail(i,date,contribution,afterTaxGain,fee,taxAmt,bal);
    date=monthAdd(date,12/m);
  }
  
  const finalValue=bal*(1-redeem);
  const finalReal=inflateToReal(finalValue,infl,nY);
  const gain=finalValue-totalIn;
  const cagr=Math.pow(finalValue/Math.max(1,totalIn),1/nY)-1;
  
  renderChart(labels,series);
  updateKPIs({finalValue,finalReal,totalIn,gain,cagr,periods:nY*m,freq:m,years:nY});
}

// Goal
export function solveMonthlyForTarget(target, rA, years, m){
  const i = Math.pow(1 + rA, 1/m) - 1;
  const n = Math.round(years*m);
  if (i===0) return target / n;
  return target * i / (Math.pow(1+i, n) - 1);
}

export function solveYearsForTarget(target, rA, monthly, m){
  const i = Math.pow(1 + rA, 1/m) - 1;
  let lo=0, hi=100;
  for(let k=0;k<100;k++){
    const mid=(lo+hi)/2; 
    const n=Math.round(mid*m);
    const fv=(i===0)? monthly*n : monthly*((Math.pow(1+i, n)-1)/i);
    if (fv>=target) hi=mid; else lo=mid;
  }
  return (lo+hi)/2;
}

export function runGoal(){
  console.log('Running Goal calculation...');
  resetDetail();
  
  const target = getInputValue('goalTarget', 0);
  const mode = $('goalSolveFor')?.value || 'monthly';
  const rA = pctToRate(getInputValue('annualReturn', 8));
  const m = getInputValue('compoundFreq', 12);
  const infl = pctToRate(getInputValue('inflation', 2));
  
  if(mode==='monthly'){
    const years = getInputValue('goalYears', 10);
    const pmt=solveMonthlyForTarget(target,rA,years,m);
    const totalIn=pmt*years*m;
    const finalReal=target / Math.pow(1+infl, years);
    const cagr=Math.pow(target/Math.max(1,totalIn),1/years)-1;
    renderChart(['0','目標'],[0,target]);
    updateKPIs({finalValue:target, finalReal, totalIn, gain:target-totalIn, cagr, periods:Math.round(years*m), freq:m, years});
  }else{
    const monthly = getInputValue('goalMonthly', 0);
    const years=solveYearsForTarget(target,rA,monthly,m);
    const totalIn=monthly*years*m;
    const finalReal=target / Math.pow(1+infl, years);
    const cagr=Math.pow(target/Math.max(1,totalIn),1/years)-1;
    renderChart(['0','目標'],[0,target]);
    updateKPIs({finalValue:target, finalReal, totalIn, gain:target-totalIn, cagr, periods:Math.round(years*m), freq:m, years});
  }
}

// wiring
export function wireCompoundTabs(){
  const panels = { 
    lump: $('panel-lump'), 
    dca: $('panel-dca'), 
    stepup: $('panel-stepup'), 
    goal: $('panel-goal') 
  };
  
  let lastRunner = runLump;
  
  function runLast(){ 
    if (lastRunner) {
      try {
        lastRunner();
      } catch (err) {
        console.error('Calculation error:', err);
        alert('計算發生錯誤：' + err.message);
      }
    }
  }
  
  const tabButtons = document.querySelectorAll('#tabs button');
  tabButtons.forEach(btn=>{
    btn.addEventListener('click', ()=>{
      tabButtons.forEach(b=> b.className='tab tab-inactive');
      btn.className='tab tab-active';
      Object.values(panels).forEach(p=> { if (p) p.classList.add('hidden'); });
      
      const key=btn.dataset.tab; 
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
  
  return { runLast, setLast:(fn)=> lastRunner=fn };
}
