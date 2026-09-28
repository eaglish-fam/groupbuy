import {areaLabel, byId, regions} from './new-zealand-data.mjs';
import {normalizeActiveDay, planCountry, planRegion, validDate} from './new-zealand-planner-model.mjs';

const form = document.querySelector('[data-nz-planner]');
if (form) {
  const output = form.querySelector('[data-nz-plan-output]');
  const kind = form.dataset.kind;
  const regionId = form.dataset.regionId;
  const allowed = kind === 'country' ? regions.map(region => region.id) : byId[regionId]?.stops.map(stop => stop.id) ?? [];
  const choices = [...form.querySelectorAll('input[data-choice]')];
  let activeDay = 0;
  const parameters = new URLSearchParams(location.search);
  const daysControl = form.querySelector('[name="days"]');
  const paceControl = form.querySelector('[name="pace"]');
  const dateControl = form.querySelector('[name="date"]');
  const validDays = [...daysControl.options].map(option => option.value);

  if (validDays.includes(parameters.get('days'))) daysControl.value = parameters.get('days');
  if (['relaxed','packed'].includes(parameters.get('pace'))) paceControl.value = parameters.get('pace');
  if (validDate(parameters.get('date'))) dateControl.value = parameters.get('date');
  const rawChoice = parameters.get(kind === 'country' ? 'regions' : 'places');
  if (rawChoice !== null) {
    const selected = new Set(rawChoice.split(',').filter(id => allowed.includes(id)));
    for (const input of choices) input.checked = selected.has(input.value);
  }

  const element = (tag,text,className) => {
    const node = document.createElement(tag);
    node.textContent = text;
    if (className) node.className = className;
    return node;
  };
  if (regionId === 'north-island') {
    const products = choices.filter(input => ['hobbiton-site','hobbiton-ite'].includes(input.value));
    for (const input of products) input.addEventListener('change',() => {
      if (input.checked) for (const other of products) if (other !== input) other.checked = false;
    });
  }
  function render(updateUrl) {
    const selected = choices.filter(input => input.checked).map(input => input.value);
    const options = {days:Number(daysControl.value),pace:paceControl.value,date:dateControl.value || null};
    const result = kind === 'country'
      ? planCountry({...options,regions:selected})
      : planRegion(regionId,{...options,places:selected});
    activeDay = normalizeActiveDay(activeDay,result.itinerary.length);
    const list = element('ol','', 'nz-plan-days');
    const switcher = element('div','', 'nz-day-switcher');
    switcher.setAttribute('role','group');
    switcher.setAttribute('aria-label','選擇要閱讀的行程日期');
    const dayButtons = [];
    const dayPanels = [];
    let previousActivityArea = null;
    for (const day of result.itinerary) {
      const item = element('li','',`nz-plan-day nz-plan-day--${day.kind}`);
      item.id = `nz-plan-day-${day.number}`;
      item.hidden = day.number-1 !== activeDay;
      item.append(element('h3',`Day ${day.number}${day.date ? `｜${day.date}` : ''}`));
      const button = element('button',`第 ${day.number} 天${day.date ? ` · ${day.date}` : ''}`);
      button.type = 'button';
      button.setAttribute('aria-controls',item.id);
      button.setAttribute('aria-pressed',String(day.number-1 === activeDay));
      switcher.append(button);
      dayButtons.push(button);
      dayPanels.push(item);
      if (kind === 'country') {
        item.append(element('p',day.label));
        if (day.regionId) {
          const link = element('a','看這區完整攻略 ↗');
          link.href = byId[day.regionId].route;
          item.append(link);
        }
      } else if (day.stops.length) {
        const areaNames = [...new Set(day.stops.map(stop => areaLabel(regionId,stop.area)))];
        if (previousActivityArea && previousActivityArea !== day.area) {
          item.append(element('p',`跨區移動：從 ${areaLabel(regionId,previousActivityArea)} 到 ${areaNames[0]}；請另外核對交通時間，這一天不要當作完整遊玩日。`,'nz-plan-transfer-note'));
        }
        item.append(element('p',`今日區域：${areaNames.join(' → ')}。移動、用餐及休息另留時間。`,'nz-plan-day-area'));
        if (areaNames.length > 1) item.append(element('p','同日跨區已預留粗估緩衝，實際車程與路況請另查。','nz-plan-transfer-note'));
        const stops = element('ul','');
        for (const stop of day.stops) {
          const detail = stop.start ? `${stop.start}–${stop.end}` : stop.time;
          const entry = element('li',`${detail}｜${stop.name}`);
          if (stop.note) entry.append(element('small',stop.note));
          stops.append(entry);
        }
        item.append(stops);
        previousActivityArea = day.stops.at(-1).area;
      } else item.append(element('p','這天保留休息、交通或依當日天氣調整。'));
      list.append(item);
    }
    dayButtons.forEach((button,index) => button.addEventListener('click',() => {
      activeDay = index;
      dayButtons.forEach((other,dayIndex)=>other.setAttribute('aria-pressed',String(dayIndex===index)));
      dayPanels.forEach((panel,dayIndex)=>{ panel.hidden=dayIndex!==index; });
      dayStatus.textContent = `正在看第 ${index+1} 天，共 ${result.days} 天。`;
    }));
    const intro = kind === 'country'
      ? `共 ${result.days} 天，已含抵達、${result.itinerary.filter(day=>day.kind==='transfer').length} 個轉移日與離境；沒有把跨區移動算成完整遊玩日。`
      : `共 ${result.days} 天；同日不重複景點，跨城區域獨立安排。預約活動請依實際訂單核對集合時間。`;
    const dayStatus = element('p',`正在看第 ${activeDay+1} 天，共 ${result.days} 天。`,'nz-day-status');
    dayStatus.setAttribute('role','status');
    output.replaceChildren(element('p',intro,'nz-plan-summary'),switcher,dayStatus,list);
    if (result.unscheduled.length) {
      const note = element('div','','nz-plan-warning');
      note.append(element('h3','這次沒有硬塞進路線的選項'));
      const items = element('ul','');
      for (const item of result.unscheduled) items.append(element('li',`${item.name}：${item.reason}`));
      note.append(items);
      output.append(note);
    }
    if (updateUrl) {
      const url = new URL(location.href);
      url.searchParams.set('days',String(result.days));
      url.searchParams.set('pace',result.pace);
      if (result.date) url.searchParams.set('date',result.date);
      else url.searchParams.delete('date');
      url.searchParams.set(kind === 'country' ? 'regions' : 'places',selected.join(','));
      history.replaceState(null,'',url);
    }
  }
  form.addEventListener('change',() => render(true));
  render(false);
}

const filters = [...document.querySelectorAll('[data-island-filter]')];
if (filters.length) {
  function show(island) {
    for (const button of filters) {
      const active = button.dataset.islandFilter === island;
      button.setAttribute('aria-pressed',String(active));
    }
    for (const card of document.querySelectorAll('[data-island-card]')) {
      card.hidden = island !== 'all' && card.dataset.islandCard !== island;
    }
  }
  for (const button of filters) button.addEventListener('click',() => show(button.dataset.islandFilter));
}
