
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

export function updateKPIs({finalValue, finalReal, totalIn, gain, cagr, periods, freq, years, xirr}){
  $('outFinal').textContent = numberFmt.format(finalValue);
  $('outFinalReal').textContent = numberFmt.format(finalReal);
  $('outTotalIn').textContent = numberFmt.format(totalIn);
  $('outGain').textContent = numberFmt.format(gain);
  $('outCAGR').textContent = (isFinite(cagr)&&cagr>-1)? toPct(cagr):'—';
  $('outPeriods').textContent = periods;
  $('outFreq').textContent = freq;
  $('outYears').textContent = (years||0).toFixed(2);
  $('outXIRR').textContent = (xirr!=null&&isFinite(xirr))? toPct(xirr):'—';
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

// Irregular + XIRR
function xirr(cashflows){
  if(cashflows.length<2) return NaN;
  const yearDays=365;
  function npv(rate){
    const t0=new Date(cashflows[0].date);
    return cashflows.reduce((sum,cf)=>{
      const t=(new Date(cf.date)-t0)/(1000*60*60*24)/yearDays;
      return sum + cf.amount / Math.pow(1+rate, t);
    },0);
  }
  let lo=-0.9999, hi=10;
  for(let i=0;i<100;i++){
    const mid=(lo+hi)/2, v=npv(mid);
    if(Math.abs(v)<1e-6) return mid;
    const vlo=npv(lo); if(Math.sign(v)===Math.sign(vlo)) lo=mid; else hi=mid;
  }
  return (lo+hi)/2;
}
export function addCashflowRow(){ $('cashflowBody').insertAdjacentHTML('beforeend', rowTemplate('',0,'')); }
export function seedCashflows(){
  const now=$('startDate').value? new Date($('startDate').value):new Date();
  const rows=[[ymd(now),50000,'期初'],[ymd(monthAdd(now,3)),10000,'第4個月'],[ymd(monthAdd(now,7)),20000,'第8個月'],[ymd(monthAdd(now,13)),15000,'第14個月']];
  clearCashflows(); rows.forEach(r=> $('cashflowBody').insertAdjacentHTML('beforeend', rowTemplate(r[0],r[1],r[2])));
}
export function clearCashflows(){ $('cashflowBody').innerHTML=''; }
function rowTemplate(d, amt, note){
  return `<tr>
    <td><input type="date" class="input" value="${d||''}" /></td>
    <td><input type="number" class="input" value="${amt||0}" step="100" /></td>
    <td><input type="text" class="input" value="${note||''}" /></td>
    <td><button class="btn btn-ghost" onclick="this.closest('tr').remove()">刪除</button></td>
  </tr>`
}
export function runIrregular(){
  resetDetail();
  const rA=pctToRate($('annualReturn').value);
  const infl=pctToRate($('inflation').value);
  const mgmt=pctToRate($('mgmtPct').value);
  const endDate=$('endDate').value? new Date($('endDate').value):new Date();
  const endingValue=+$('endingValue').value||0;
  const effDaily=Math.pow(1+(rA-mgmt),1/365)-1;

  const rows=[...$('cashflowBody').querySelectorAll('tr')].map(tr=>{
    const [d,a,n]=tr.querySelectorAll('input');
    return {date:new Date(d.value), amount:parseFloat(a.value)||0, note:n.value};
  }).filter(r=>r.date instanceof Date && !isNaN(r.date)).sort((a,b)=> +a.date - +b.date);

  let bal=0,totalIn=0; let labels=[],series=[];
  let cursor=rows.length? new Date(rows[0].date):new Date();
  rows.forEach((r,idx)=>{
    const gap=Math.max(0, Math.floor((r.date - cursor)/(1000*60*60*24)));
    for(let d=0; d<gap; d++){ bal*=(1+effDaily); }
    cursor=new Date(r.date);
    // log
    const interest=0; // 已反映在滾存
    pushDetail(`D${idx}`, cursor, 0, interest, 0, 0, bal);
    bal+=r.amount; if(r.amount>0) totalIn+=r.amount;
    pushDetail(`C${idx}`, cursor, r.amount, 0, 0, 0, bal);
    if(idx===0){ labels.push(ymd(cursor)); series.push(bal); }
  });
  const gapEnd=Math.max(0, Math.floor((endDate - cursor)/(1000*60*60*24)));
  for(let d=0; d<gapEnd; d++){ bal*=(1+effDaily); }
  labels.push(ymd(endDate)); series.push(bal);

  const cf=rows.map(r=>({date:r.date, amount:-r.amount})); cf.push({date:endDate, amount:endingValue});
  const irr=xirr(cf);
  const years=(rows.length? (endDate - rows[0].date)/(1000*60*60*24)/365:0);
  const finalReal=endingValue / Math.pow(1+infl, years);
  const gain=endingValue-totalIn;

  renderChart(labels,series);
  updateKPIs({finalValue:endingValue, finalReal, totalIn, gain, cagr:irr, periods:rows.length, freq:'—', years, xirr:irr});
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
  const panels = { lump:$('panel-lump'), dca:$('panel-dca'), stepup:$('panel-stepup'), irregular:$('panel-irregular'), goal:$('panel-goal') };
  let lastRunner = runLump;
  function runLast(){ lastRunner && lastRunner(); }
  document.querySelectorAll('#tabs button').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('#tabs button').forEach(b=> b.className='tab tab-inactive');
      btn.className='tab tab-active';
      Object.values(panels).forEach(p=> p.classList.add('hidden'));
      const key=btn.dataset.tab; panels[key].classList.remove('hidden');
      lastRunner = ({lump:runLump, dca:runDCA, stepup:runStepUp, irregular:runIrregular, goal:runGoal})[key];
      if(key!=='irregular') runLast();
    });
  });
  return { runLast, setLast:(fn)=> lastRunner=fn };
}
