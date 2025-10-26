import { $, pctToRate, ymd, numberFmt } from './format.js';
import { renderLoanChart } from './chart.js';

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

function getSelectValue(id, defaultVal = '') {
  const el = $(id);
  return (el && el.value) ? el.value : defaultVal;
}

function getInputDate(id) {
  const el = $(id);
  return (el && el.value) ? new Date(el.value) : new Date();
}

export function applyLoanPreset(type){
  const set=(id,v)=>{ 
    const el=$(id); 
    if(el) el.value=v; 
  };
  
  if(type==='personal'){ 
    set('loanMethod','annuity'); 
    set('loanAPR',8); 
    set('loanYears',5); 
    set('loanPY',12); 
  }
  if(type==='mortgage'){ 
    set('loanMethod','annuity'); 
    set('loanAPR',2); 
    set('loanYears',20); 
    set('loanPY',12); 
  }
  if(type==='auto'){ 
    set('loanMethod','annuity'); 
    set('loanAPR',3); 
    set('loanYears',5); 
    set('loanPY',12); 
  }
  if(type==='policy'){ 
    set('loanMethod','interest_only'); 
    set('loanAPR',4); 
    set('loanYears',3); 
    set('loanPY',12); 
  }
}

export function runLoan(){
  console.log('Running Loan calculation...');
  
  const P = getInputValue('loanAmount', 0);
  const apr = pctToRate(getInputValue('loanAPR', 2));
  const years = getInputValue('loanYears', 20);
  const py = getInputValue('loanPY', 12);
  const n = Math.round(years*py);
  const i = apr/py;
  const method = getSelectValue('loanMethod', 'annuity');
  const startDate = getInputDate('loanStart');
  const feeFixed = getInputValue('loanFeeFixed', 0);
  const feePct = pctToRate(getInputValue('loanFeePct', 0));
  const upfrontFee = feeFixed + P*feePct;

  console.log('Loan inputs:', { P, apr, years, py, n, i, method, upfrontFee });

  let balance=P; 
  let labels=[], series=[]; 
  let tbody=$('loanDetailBody'); 
  if (tbody) tbody.innerHTML='';
  
  let totalInterest=0; 
  let schedule=[]; 
  let PMT=0; 
  let cursor = new Date(startDate);

  if(method==='annuity'){
    PMT = (i===0)? P/n : P * i * Math.pow(1+i,n) / (Math.pow(1+i,n)-1);
    for(let k=1;k<=n;k++){
      const interest=balance*i; 
      const principal=PMT - interest; 
      balance=Math.max(0,balance-principal);
      schedule.push({k, date:new Date(cursor.getTime()), principal, interest, payment:PMT, balance});
      cursor.setMonth(cursor.getMonth() + (12/py)); 
      totalInterest+=interest;
      labels.push(`第${k}`); 
      series.push(balance);
    }
  } else if(method==='equal_principal'){
    const principalBase = P/n;
    for(let k=1;k<=n;k++){
      const interest=balance*i; 
      const payment=principalBase+interest; 
      balance=Math.max(0,balance-principalBase);
      schedule.push({k, date:new Date(cursor.getTime()), principal:principalBase, interest, payment, balance});
      cursor.setMonth(cursor.getMonth() + (12/py)); 
      totalInterest+=interest;
      labels.push(`第${k}`); 
      series.push(balance);
    }
    PMT = schedule.length? schedule[0].payment:0;
  } else { // interest_only / bullet
    for(let k=1;k<=n;k++){
      const interest=P*i; 
      const payment=(k===n)? (interest+P) : interest; 
      const principal=(k===n)? P:0; 
      const bal=(k===n)? 0:P;
      schedule.push({k, date:new Date(cursor.getTime()), principal, interest, payment, balance:bal});
      cursor.setMonth(cursor.getMonth() + (12/py)); 
      totalInterest+=interest;
      labels.push(`第${k}`); 
      series.push(bal);
    }
    PMT = schedule[0]?.payment||0;
  }

  if (tbody) {
    schedule.forEach(r=>{
      const tr=document.createElement('tr');
      tr.innerHTML=`<td>${r.k}</td><td>${ymd(r.date)}</td><td>${numberFmt.format(r.principal)}</td><td>${numberFmt.format(r.interest)}</td><td>${numberFmt.format(r.payment)}</td><td>${numberFmt.format(r.balance)}</td>`;
      tbody.appendChild(tr);
    });
  }
  
  const totalPayment = schedule.reduce((s,r)=> s + r.payment, 0);
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
  const cfs = [{t:0, amt:(P - upfrontFee)}];
  schedule.forEach((r,idx)=> cfs.push({t:idx+1, amt:-r.payment}));
  const aprEff = irrFromSchedule(cfs, py);
  updateEl('loanOutAPR', isFinite(aprEff)? ((aprEff*100).toFixed(2)+'%') : '—');
  
  console.log('Loan results:', { PMT, totalInterest, totalCost, aprEff });
}

export function resetLoan(){
  ['loanAmount','loanAPR','loanYears','loanPY','loanMethod','loanStart','loanFeeFixed','loanFeePct'].forEach(id=>{
    const el=$(id); 
    if(!el) return; 
    const v=el.getAttribute('value'); 
    if(v!=null) el.value = v;
  });
  
  const tbody = $('loanDetailBody');
  if (tbody) tbody.innerHTML='';
  
  renderLoanChart([],[]);
  
  ['loanOutPMT','loanOutInterest','loanOutTotalCost','loanOutN','loanOutAPR'].forEach(id => {
    const el = $(id);
    if (el) el.textContent = '—';
  });
}

function irrFromSchedule(cfs, py){
  function npv(r){ 
    return cfs.reduce((s,cf)=> s + cf.amt/Math.pow(1+r, cf.t), 0); 
  }
  
  let lo=-0.9999, hi=10;
  for(let i=0;i<200;i++){
    const mid=(lo+hi)/2, v=npv(mid);
    if(Math.abs(v)<1e-7) return Math.pow(1+mid, py)-1;
    const vlo=npv(lo);
    if(Math.sign(v)===Math.sign(vlo)) lo=mid; else hi=mid;
  }
  return Math.pow(1+(lo+hi)/2, py)-1;
}
