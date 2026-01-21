import { $, setCurrency } from './format.js';
import { tabs, bindCurrency, show, hide } from './ui.js';
import { runLump, runDCA, runStepUp, runGoal, wireCompoundTabs } from './compound.js';
import { applyLoanPreset, runLoan, resetLoan } from './loan.js';

// Wait for DOM to be ready
function initApp() {
  console.log('Initializing app...');
  
  // Header currency
  bindCurrency(()=> {
    // re-render current tool
    const loanTool = document.getElementById('tool-loan');
    if(loanTool && !loanTool.classList.contains('hidden')){
      runLoan();
    }else{
      runLump();
    }
  });

  // Top-level tool selection (tabs + dropdown)
  function showTool(key){
    hide('tool-compound'); 
    hide('tool-loan');
    show('tool-' + key);
    
    const sel = $('toolSelect'); 
    if(sel) sel.value = key;
    
    document.querySelectorAll('#toolTabs .tab').forEach(b=>{
      b.className = 'tab tab-inactive';
      if(b.dataset.tool===key) b.className = 'tab tab-active';
    });
  }
  
  const topTabs = tabs('#toolTabs', (k)=> showTool(k));
  const toolSelect = $('toolSelect');
  if (toolSelect) {
    toolSelect.addEventListener('change', e=> showTool(e.target.value));
  }

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
  
  // Run initial calculation with error handling
  try {
    runLump();
  } catch (err) {
    console.error('Initial calculation error:', err);
  }
  
  console.log('App initialized successfully');
}

// Run when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
