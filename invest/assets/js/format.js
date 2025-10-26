
export const $ = (id) => document.getElementById(id);
export let currentCurrency = 'TWD';
export let numberFmt = new Intl.NumberFormat('zh-Hant-TW', { style: 'currency', currency: 'TWD', maximumFractionDigits: 0 });
export function setCurrency(code){
  currentCurrency = code;
  numberFmt = new Intl.NumberFormat('zh-Hant-TW', { style: 'currency', currency: code, maximumFractionDigits: 0 });
}
export function toPct(x){ if (x==null || isNaN(x)) return '—'; return (x*100).toFixed(2)+'%'; }
export const pctToRate = (v)=> (parseFloat(v)||0)/100;
export const daysBetween = (a,b)=> (new Date(b)-new Date(a))/(1000*60*60*24);
export function monthAdd(d, m){ const nd = new Date(d); nd.setMonth(nd.getMonth()+m); return nd; }
export function ymd(d){ if(!d) return ''; const z=new Date(d); return z.toISOString().slice(0,10); }
