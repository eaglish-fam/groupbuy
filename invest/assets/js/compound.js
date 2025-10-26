import { $, pctToRate, daysBetween, monthAdd, ymd, toPct, numberFmt } from './format.js';
import { renderChart } from './chart.js';

function resetDetail(){ $('detailBody').innerHTML=''; }
function pushDetail(i, date, inAmt, interest, fees, tax, bal){
  const tr=document.createElement('tr');
  const cells=[i, ymd(date)||'—', numberFmt.format(inAmt), numberFmt.format(interest), numberFmt.format(fees), numberFmt.format(tax), numberFmt.format(bal)];
  tr.innerHTML=cells.map(c=>`<td>${c}</td>`).join('');
  $('detailBody').appendChild(tr);
}
function netGrowthRate(annualReturn, mgmtPct, compoundFreq){ const r = annualReturn - mgmtPct; return Math.pow(1 + r, 1/compoundFreq) - 1; }
function applyFeesAndTax(gain, taxPct){ const tax = Math.max(0, gain) * taxPct; const afterTaxGain = gain - tax; return { afterTaxGain, tax }; }
function inflateToReal(nominalFinal, inflation, years){ return nominalFinal / Math.pow(1+inflation, years); }

export function updateKPIs({finalValue, finalReal, totalIn, gain, cagr, periods, freq, years}){
  $('outFinal').textContent = numberFmt.format(finalValue);
  $('outFinalReal').textContent = numberFmt.format(finalReal);
  $('outTotalIn').textContent = numberFmt.format(totalIn);
  $('outGain').textContent = numberFmt.format(gain);
  $('outCAGR').textContent = (isFinite(cagr)&&cagr>-1)? toPct(cagr):'—';
  $('outPeriods').textContent = periods;
  $('outFreq').textContent = freq;
  $('outYears').textContent = (years||0).toFixed(2);
}

// Lump sum
export function runLump(){
  resetDetail();
  const PV=+$('lumpAmount').value||0;
  const rA=pctToRate($('annualReturn').value);
  const nY=+$('years').value||0;
  const m=+$('compoundFreq').value||12;
  const infl=pctToRate($('inflation').value);
  const feeIn=pctToRate($('feePct').value);
  const redeem=pctToRate($('redeemPct').value);
  const mgmt=pctToRate($('mgmtPct').value);
  const tax=pctToRate($('taxPct').value);
  const start=$('startDate').value? new Date($('startDate').value):new Date();

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
    if(i%m===0){ labels.push(date.getFullYear()+"年"+((date.getMonth()+1))+'月'); series.push(bal); }
    pushDetail(i,date,0,afterTaxGain,fees,taxAmt,bal);
    date=monthAdd(date,12/m);
  }
  const finalValue=bal*(1-redeem);
  const finalReal=inflateToReal(finalValue,infl,nY);
  const gain=finalValue-totalIn;
  const cagr=Math.pow(finalValue/Math.max(1,totalIn),1/nY)-1;
  renderChart(labels,series);
  updateKPIs({finalValue,finalReal,totalIn,gain,cagr,periods:nY*m,freq:m,years:nY});
}

// DCA
export function runDCA(){
  resetDetail();
  const amt=+$('dcaAmount').value||0;
  const rA=pctToRate($('annualReturn').value);
  const nY=+$('years').value||0;
  const m=+$('compoundFreq').value||12;
  const infl=pctToRate($('inflation').value);
  const feeIn=pctToRate($('feePct').value);
  const redeem=pctToRate($('redeemPct').value);
  const mgmt=pctToRate($('mgmtPct').value);
  const tax=pctToRate($('taxPct').value);
  const start=$('startDate').value? new Date($('startDate').value):new Date();

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

    if(i%m===0){ labels.push(date.getFullYear()+"年"+((date.getMonth()+1))+'月'); series.push(bal); }
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
  resetDetail();
  let base=+$('stepBase').value||0;
  const stepPct=pctToRate($('stepPct').value);
  const stepFreq=+$('stepFreq').value||12;
  const cap=+$('stepCap').value||0;
  const rA=pctToRate($('annualReturn').value);
  const nY=+$('years').value||0;
  const m=+$('compoundFreq').value||12;
  const infl=pctToRate($('inflation').value);
  const feeIn=pctToRate($('feePct').value);
  const redeem=pctToRate($('redeemPct').value);
  const mgmt=pctToRate($('mgmtPct').value);
  const tax=pctToRate($('taxPct').value);
  const start=$('startDate').value? new Date($('startDate').value):new Date();

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

    if(i%m===0){ labels.push(date.getFullYear()+"年"+((date.getMonth()+1))+'月'); series.push(bal); }
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
    const mid=(lo+hi)/2; const n=Math.round(mid*m);
    const fv=(i===0)? monthly*n : monthly*((Math.pow(1+i, n)-1)/i);
    if (fv>=target) hi=mid; else lo=mid;
  }
  return (lo+hi)/2;
}
export function runGoal(){
  resetDetail();
  const target=+$('goalTarget').value||0;
  const mode=$('goalSolveFor').value;
  const rA=pctToRate($('annualReturn').value);
  const m=+$('compoundFreq').value||12;
  if(mode==='monthly'){
    const years=+$('goalYears').value||10;
    const pmt=solveMonthlyForTarget(target,rA,years,m);
    const totalIn=pmt*years*m;
    const finalReal=target / Math.pow(1+pctToRate($('inflation').value), years);
    const cagr=Math.pow(target/Math.max(1,totalIn),1/years)-1;
    renderChart(['0','目標'],[0,target]);
    updateKPIs({finalValue:target, finalReal, totalIn, gain:target-totalIn, cagr, periods:Math.round(years*m), freq:m, years});
  }else{
    const monthly=+$('goalMonthly').value||0;
    const years=solveYearsForTarget(target,rA,monthly,m);
    const totalIn=monthly*years*m;
    const finalReal=target / Math.pow(1+pctToRate($('inflation').value), years);
    const cagr=Math.pow(target/Math.max(1,totalIn),1/years)-1;
    renderChart(['0','目標'],[0,target]);
    updateKPIs({finalValue:target, finalReal, totalIn, gain:target-totalIn, cagr, periods:Math.round(years*m), freq:m, years});
  }
}

// wiring
export function wireCompoundTabs(){
  const panels = { lump:$('panel-lump'), dca:$('panel-dca'), stepup:$('panel-stepup'), goal:$('panel-goal') };
  let lastRunner = runLump;
  function runLast(){ lastRunner && lastRunner(); }
  document.querySelectorAll('#tabs button').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('#tabs button').forEach(b=> b.className='tab tab-inactive');
      btn.className='tab tab-active';
      Object.values(panels).forEach(p=> p.classList.add('hidden'));
      const key=btn.dataset.tab; 
      panels[key].classList.remove('hidden');
      lastRunner = ({lump:runLump, dca:runDCA, stepup:runStepUp, goal:runGoal})[key];

      runLast();
    });
  });
  return { runLast, setLast:(fn)=> lastRunner=fn };
}
