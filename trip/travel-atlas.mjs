/** Bind only neutral country atlas roots; NZ retains its existing controller. */
export function initTravelAtlases(scope = document) {
  for (const root of scope.querySelectorAll('[data-travel-atlas-root]')) {
    if (root.dataset.travelAtlasBound) continue;
    const atlas = root.querySelector('[data-travel-atlas]');
    const controls = [...root.querySelectorAll('[data-travel-atlas-select]')];
    const views = [...root.querySelectorAll('[data-travel-atlas-view]')];
    if (!atlas || !views.length) continue;
    root.dataset.travelAtlasBound = 'true';
    const select = (id, focus = false) => {
      if (!views.some(view => view.dataset.travelAtlasView === id)) return;
      atlas.dataset.atlasActive = id;
      views.forEach(view => {view.hidden = view.dataset.travelAtlasView !== id;});
      controls.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.travelAtlasSelect === id)));
      const button = controls.find(button => button.dataset.travelAtlasSelect === id);
      const status = root.querySelector('[data-travel-atlas-status]');
      if (status && button) status.textContent = `目前顯示：${button.textContent.trim()}`;
      if (focus) button?.focus();
    };
    controls.forEach((button, index) => {
      button.addEventListener('click', () => select(button.dataset.travelAtlasSelect));
      button.addEventListener('keydown', event => {
        let next;
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % controls.length;
        if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + controls.length) % controls.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = controls.length - 1;
        if (next === undefined) return;
        event.preventDefault();
        select(controls[next].dataset.travelAtlasSelect, true);
      });
    });
    select(atlas.dataset.atlasActive || 'all');
    const toolbar = root.querySelector('.travel-atlas-controls');
    if (toolbar && controls.length) toolbar.hidden = false;
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => initTravelAtlases(), {once:true});
  else initTravelAtlases();
}
