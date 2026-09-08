(function(){
  const sheetUrl='https://docs.google.com/spreadsheets/d/1-RuyD9eCkrDpgFFXGHRWaTF-LYKaDK-MxAw3uNMozeU/gviz/tq?tqx=out:csv&headers=1&sheet='+encodeURIComponent('現正開團');
  const cards=[...document.querySelectorAll('[data-article]')];
  const shelves={open:document.querySelector('[data-shelf="open"]'),upcoming:document.querySelector('[data-shelf="upcoming"]'),journal:document.querySelector('[data-shelf="journal"]')};
  const freshness=document.querySelector('#freshness');
  const today=()=>ProductContent.today();
  function render(rows){
    for(const card of cards){const state=BlogIndexModel.stateFor(BlogIndexModel.rowFor(rows,card.dataset.article));card.dataset.state=state.shelf;card.querySelector('[data-status]').textContent=state.label;const buy=card.querySelector('[data-buy]');if(state.url){buy.href=state.url;buy.hidden=false;buy.target='_blank';buy.rel='noopener noreferrer';}else{buy.hidden=true;buy.removeAttribute('href');}shelves[state.shelf].append(card);}
    for(const [key,shelf] of Object.entries(shelves)){const has=shelf.querySelector('[data-article]');document.querySelector(`[data-empty="${key}"]`).hidden=Boolean(has);}
    freshness.textContent=`團購狀態已依 ${today().replaceAll('-','/')} 的最新資料確認。`;
  }
  function fail(){freshness.textContent='目前無法取得最新團購狀態；文章仍可閱讀，購買入口暫不顯示。';for(const card of cards){card.querySelector('[data-status]').textContent='團購狀態待確認';card.querySelector('[data-buy]').hidden=true;shelves.journal.append(card);}document.querySelector('[data-empty="open"]').hidden=false;document.querySelector('[data-empty="upcoming"]').hidden=false;}
  async function refresh(){try{const response=await fetch(sheetUrl+'&_='+Date.now(),{cache:'no-store',signal:AbortSignal.timeout(12000)});if(!response.ok)throw Error('Sheet unavailable');const text=await response.text();if(/^\s*</.test(text))throw Error('Unexpected response');const parsed=Papa.parse(text,{header:false,skipEmptyLines:true});if(parsed.errors.length)throw Error('Invalid CSV');render(ProductContent.sheetRows(parsed.data));}catch(error){console.warn('Blog campaign status unavailable:',error.message);fail();}}
  refresh();
})();
