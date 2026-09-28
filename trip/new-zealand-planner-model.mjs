import {byId, regions} from './new-zealand-data.mjs';

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const countryMinimumDays = {
  'north-island': 3, wellington: 2, 'christchurch-akaroa': 2,
  'mid-canterbury': 2, kaikoura: 2, otago: 2,
  'queenstown-arrowtown': 2, 'wanaka-tekapo': 2
};
const groupFor = (regionId,stop) => {
  if (regionId === 'otago') return ['oamaru','moeraki'].includes(stop.area) ? 'coastal-transfer' : 'dunedin';
  if (regionId === 'wanaka-tekapo') return ['cardrona','wanaka'].includes(stop.area) ? 'wanaka-transfer' : 'tekapo';
  if (['north-island','christchurch-akaroa','mid-canterbury','queenstown-arrowtown','kaikoura'].includes(regionId)) return stop.area;
  return null;
};
const preferred = {
  'north-island':['sky-tower','rotorua-luge','hobbiton-site'],
  wellington:['harbour-market','te-papa','wellington-zoo','cable-car'],
  'christchurch-akaroa':['tram','ninja-valley','shamarra'],
  'mid-canterbury':['ashburton-museum','aviation-museum','balloon'],
  kaikoura:['ohau-point','coastal-walk'],
  otago:['oamaru','moeraki','otago-museum'],
  'queenstown-arrowtown':['skyline','lakefront','arrowtown'],
  'wanaka-tekapo':['cardrona','wanaka-lake','tekapo-lake']
};
export const defaultSelectedStops = regionId => [...(preferred[regionId] ?? [])];
export const normalizeActiveDay = (index,count) => Number.isInteger(index) && count > 0
  ? Math.max(0,Math.min(index,count-1)) : 0;

export function validDate(value) {
  if (!datePattern.test(String(value ?? ''))) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0,10) === value;
}

function dateAt(start, offset) {
  if (!validDate(start)) return null;
  const date = new Date(`${start}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return date;
}

function clock(minute) {
  return `${String(Math.floor(minute / 60)).padStart(2,'0')}:${String(minute % 60).padStart(2,'0')}`;
}

function minute(value) {
  if (!value || !/^\d{2}:\d{2}$/.test(value)) return null;
  const [hour,min] = value.split(':').map(Number);
  return hour * 60 + min;
}

function availability(stop, day) {
  if (stop.seasonal) return stop.closedYear === day?.getUTCFullYear()
    ? '這一季已結束，不能排入當日路線'
    : '季節活動需先確認當季公告與實際場次';
  if (!day) return stop.weekdays ? '先選日期才能確認營業星期' : null;
  if (stop.weekdays && !stop.weekdays.includes(day.getUTCDay())) return '僅特定星期營業';
  const monthDay = day.toISOString().slice(5,10);
  if (stop.closedDates?.includes(monthDay)) return '當日休館';
  if (stop.exceptionDates?.includes(monthDay)) return '當日有特別安排，需先核對官方公告與實際預約';
  return null;
}

function selectStops(region, selected) {
  const allowed = new Set(region.stops.map(stop => stop.id));
  const ids = Array.isArray(selected) ? selected.filter(id => allowed.has(id)) : preferred[region.id];
  const chosen = new Set(ids);
  const exclusive = new Set();
  const conflicts = [];
  const stops = region.stops.filter(stop => {
    if (!chosen.has(stop.id)) return false;
    if (stop.exclusive && exclusive.has(stop.exclusive)) {
      conflicts.push({id:stop.id,name:stop.name,reason:'與同系列另一個出發產品互斥；請只選其中一種'});
      return false;
    }
    if (stop.exclusive) exclusive.add(stop.exclusive);
    return true;
  });
  return {stops,conflicts};
}

export function planRegion(regionId, options = {}) {
  const region = byId[regionId];
  if (!region) throw new Error(`Unknown region: ${regionId}`);
  const days = region.days.includes(Number(options.days)) ? Number(options.days) : region.days[0];
  const pace = options.pace === 'packed' ? 'packed' : 'relaxed';
  const startDate = validDate(options.date) ? options.date : null;
  const selection = selectStops(region, options.places);
  const chosen = selection.stops;
  const maxStops = pace === 'packed' ? 3 : 2;
  const itinerary = Array.from({length:days}, (_,index) => ({number:index+1,date:dateAt(startDate,index)?.toISOString().slice(0,10) ?? null,area:null,group:null,stops:[],kind:'activity'}));
  const unscheduled = [...selection.conflicts];
  const schedule = (items,date) => {
    let cursor = pace === 'packed' ? 8*60+30 : 9*60+30;
    let precedingArea = null;
    let precedingTimeUnknown = false;
    const scheduled = [];
    for (const item of items) {
      const stop = region.stops.find(candidate => candidate.id === item.id);
      if (precedingArea && precedingArea !== stop.area) cursor += 90;
      const monthDay = date?.toISOString().slice(5,10);
      const month = date?.getUTCMonth()+1;
      const seasonal = month >= 5 && month <= 9 ? 'winter' : 'summer';
      const opening = stop.specialOpenDates?.[monthDay] ?? stop.specialOpen?.[date?.getUTCDay()] ?? stop.seasonalOpen?.[seasonal] ?? stop.open;
      cursor = Math.max(cursor,minute(opening) ?? cursor);
      if (stop.slots) {
        const slot = stop.slots.map(minute).find(value => value != null && value >= cursor);
        if (slot == null) return {issue:'當日已無可用的已列場次；依預約再安排'};
        cursor = slot;
      }
      if (stop.lastEntry && cursor > minute(stop.lastEntry)) return {issue:`晚於 ${stop.lastEntry} 最後入場`};
      const closing = stop.seasonalClose?.[seasonal] ?? stop.close;
      if (closing && cursor + stop.duration > minute(closing)) return {issue:`超過 ${closing} 關閉時間`};
      const hoursUnverified = !opening && !closing && !stop.slots;
      const exact = Boolean(date) && !precedingTimeUnknown && !hoursUnverified && !stop.needsBooking && !stop.checkin && !stop.slots;
      const note = stop.checkin ? `開始前至少 ${stop.checkin} 分鐘報到；以預訂產品與集合點為準`
        : stop.slots ? '官網列出的場次仍需實際預訂確認；這裡不代表已取得名額'
        : stop.needsBooking ? '需先確認場次、兒童條件與集合點'
        : hoursUnverified ? '請依出發日營業時間安排；以下為建議順序'
        : precedingTimeUnknown ? '前一站時段未定，這站不能給固定抵達時間' : null;
      scheduled.push({...item,start:exact?clock(cursor):null,end:exact?clock(cursor+stop.duration):null,note});
      if (hoursUnverified || stop.needsBooking || stop.checkin || stop.slots) precedingTimeUnknown = true;
      cursor += stop.duration + (pace === 'packed' ? 25 : 45);
      precedingArea = stop.area;
    }
    return {scheduled};
  };
  // Date-restricted stops get their valid day first, but never prevent the
  // remaining stops from filling earlier days.
  const ordered = [...chosen].sort((a,b) => Number(Boolean(b.weekdays)) - Number(Boolean(a.weekdays)));
  for (const stop of ordered) {
    let placed = false;
    let lastIssue = null;
    const group = groupFor(regionId,stop);
    for (let index=0; index<days; index++) {
      const day = itinerary[index];
      const date = dateAt(startDate,index);
      const issue = availability(stop,date);
      if (issue) { lastIssue = issue; continue; }
      if (day.stops.length >= maxStops) continue;
      if (group && day.group && day.group !== group) continue;
      const attempt = schedule([...day.stops,{id:stop.id,name:stop.name,area:stop.area,duration:stop.duration,time:stop.time,booking:Boolean(stop.needsBooking || stop.checkin || stop.slots),checkin:stop.checkin ?? null}],date);
      if (attempt.issue) { lastIssue = attempt.issue; continue; }
      day.group = group;
      day.area ??= stop.area;
      day.stops = attempt.scheduled;
      placed = true;
      break;
    }
    if (!placed) unscheduled.push({id:stop.id,name:stop.name,reason:lastIssue ?? '天數或跨區移動不足；請增加天數或減少選站'});
  }
  for (const day of itinerary) if (!day.stops.length) day.kind = 'rest';
  return {regionId,days,pace,date:startDate,itinerary,unscheduled};
}

export function planCountry(options = {}) {
  const days = [7,13,21].includes(Number(options.days)) ? Number(options.days) : 7;
  const pace = options.pace === 'packed' ? 'packed' : 'relaxed';
  const startDate = validDate(options.date) ? options.date : null;
  const validIds = new Set(regions.map(region => region.id));
  const selected = (Array.isArray(options.regions) ? options.regions : ['north-island'])
    .filter((id,index,array) => validIds.has(id) && array.indexOf(id) === index);
  const included = [];
  const unscheduled = [];
  for (const id of selected) {
    const proposed = [...included,id];
    const required = 2 + proposed.reduce((sum,regionId) => sum + countryMinimumDays[regionId] + (pace === 'relaxed' ? 1 : 0),0) + (proposed.length - 1);
    if (required <= days) included.push(id);
    else unscheduled.push({id,name:byId[id].label,reason:`至少需要 ${required} 天（抵離、各區遊玩及轉移日另計）`});
  }
  const itinerary = [{kind:'arrival',label:'抵達與安頓'}];
  included.forEach((id,index) => {
    if (index) itinerary.push({kind:'transfer',label:byId[included[index-1]].island === byId[id].island ? '跨區移動日' : '跨島交通日',from:included[index-1],to:id});
    const regionDays = countryMinimumDays[id] + (pace === 'relaxed' ? 1 : 0);
    for (let i=0;i<regionDays;i++) itinerary.push({kind:'activity',label:`${byId[id].label}・遊玩日 ${i+1}`,regionId:id});
  });
  while (itinerary.length < days-1) itinerary.push({kind:'rest',label:included.length ? `${byId[included.at(-1)].label}・彈性與休息日` : '抵達後休息與路線準備'});
  itinerary.push({kind:'departure',label:'離境、還車與交通緩衝'});
  return {days,pace,date:startDate,included,unscheduled,itinerary:itinerary.map((day,index) => ({...day,number:index+1,date:dateAt(startDate,index)?.toISOString().slice(0,10) ?? null}))};
}
