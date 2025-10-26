
import { $, setCurrency } from './format.js';

export function bindCurrency(onChange){
  const el = $('currency');
  if(!el) return;
  el.addEventListener('change', e=>{
    setCurrency(e.target.value);
    onChange && onChange();
  });
}

export function tabs(containerSelector, callback){
  const buttons = document.querySelectorAll(containerSelector + ' .tab');
  buttons.forEach(btn=>{
    btn.addEventListener('click', ()=>{
      buttons.forEach(b=> b.className='tab tab-inactive');
      btn.className='tab tab-active';
      callback && callback(btn.dataset.tab || btn.dataset.tool);
    });
  });
  return buttons;
}

export function show(id){ const el = document.getElementById(id); if(el) el.classList.remove('hidden'); }
export function hide(id){ const el = document.getElementById(id); if(el) el.classList.add('hidden'); }
