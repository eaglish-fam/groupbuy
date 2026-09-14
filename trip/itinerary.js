(() => {
  const choices = [...document.querySelectorAll('[data-plan]')];
  const panels = [...document.querySelectorAll('[data-plan-panel]')];
  if (!choices.length || !panels.length) return;
  const select = (id, announce = false) => {
    if (!panels.some(panel => panel.dataset.planPanel === id)) return;
    panels.forEach(panel => { panel.hidden = panel.dataset.planPanel !== id; });
    choices.forEach(choice => {
      if (choice.dataset.plan === id) choice.setAttribute('aria-current', 'true');
      else choice.removeAttribute('aria-current');
    });
    const status = document.getElementById('plan-status');
    if (announce && status) status.textContent = `已切換為${choices.find(c => c.dataset.plan === id).textContent}行程`;
  };
  // Anchor links remain functional with JavaScript disabled; every route is rendered in HTML.
  choices.forEach(choice => choice.addEventListener('click', () => select(choice.dataset.plan, true)));
  const sync = () => {
    const id = location.hash.replace('#plan-', '');
    if (panels.some(panel => panel.dataset.planPanel === id)) select(id);
  };
  select('three');
  sync();
  window.addEventListener('hashchange', sync);
})();
