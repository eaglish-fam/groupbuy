
import { $, setCurrency } from './format.js';
import { tabs, bindCurrency, show, hide } from './ui.js';
import { runLump, runDCA, runStepUp, runGoal, wireCompoundTabs } from './compound.js';
import { applyLoanPreset, runLoan, resetLoan } from './loan.js';

// Header currency
bindCurrency(()=> {
  // re-render current tool
  if(!document.getElementById('tool-loan').classList.contains('hidden')){
    runLoan();
  }else{
    runLump();
  }
});

// Top-level tool selection (tabs + dropdown)
function showTool(key){
  hide('tool-compound'); hide('tool-loan');
  show('tool-' + key);
  const sel = $('toolSelect'); if(sel) sel.value = key;
  document.querySelectorAll('#toolTabs .tab').forEach(b=>{
    b.className = 'tab tab-inactive';
    if(b.dataset.tool===key) b.className = 'tab tab-active';
  });
}
const topTabs = tabs('#toolTabs', (k)=> showTool(k));
const toolSelect = $('toolSelect');
toolSelect && toolSelect.addEventListener('change', e=> showTool(e.target.value));

// Wire compound tool tabs
const { runLast } = wireCompoundTabs();

// Expose for inline buttons
window.runLump = runLump;
window.runDCA = runDCA;
window.runStepUp = runStepUp;
window.runGoal = runGoal;

window.applyLoanPreset = applyLoanPreset;
window.runLoan = runLoan;
window.resetLoan = resetLoan;

// Init
setCurrency('TWD');
showTool('compound');
runLump();
