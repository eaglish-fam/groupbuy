
import { $ } from './format.js';

let chart, loanChart;
export function renderChart(labels, series){
  const ctx = $('chart');
  if (!ctx) return;
  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type:'line',
    data:{ labels, datasets:[{ label:'資產餘額', data:series, fill:false }] },
    options:{ responsive:true, plugins:{ legend:{ display:false } } }
  });
}
export function renderLoanChart(labels, series){
  const ctx = $('loanChart');
  if (!ctx) return;
  if (loanChart) loanChart.destroy();
  loanChart = new Chart(ctx, {
    type:'line',
    data:{ labels, datasets:[{ label:'剩餘本金', data:series, fill:false }] },
    options:{ responsive:true, plugins:{ legend:{ display:false } } }
  });
}
