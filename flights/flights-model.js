(function (root) {
  'use strict';
  const airports = {
    TPE: ['台北', '桃園'], TSA: ['台北', '松山'], KHH: ['高雄', '小港'], RMQ: ['台中', '清泉崗'],
    NRT: ['東京', '成田'], HND: ['東京', '羽田'], TYO: ['東京', '東京各機場'],
    KIX: ['大阪', '關西'], OSA: ['大阪', '大阪各機場'], FUK: ['福岡', '福岡'],
    OKA: ['沖繩', '那霸'], CTS: ['札幌', '新千歲'], NGO: ['名古屋', '中部'],
    ICN: ['首爾', '仁川'], GMP: ['首爾', '金浦'], SEL: ['首爾', '首爾各機場'], PUS: ['釜山', '金海'],
    BKK: ['曼谷', '蘇凡納布'], DMK: ['曼谷', '廊曼'], CNX: ['清邁', '清邁'],
    SIN: ['新加坡', '樟宜'], KUL: ['吉隆坡', '吉隆坡'], PEN: ['檳城', '檳城'],
    DAD: ['峴港', '峴港'], MNL: ['馬尼拉', '馬尼拉'], HKG: ['香港', '香港'], MFM: ['澳門', '澳門'],
    SYD: ['雪梨', '雪梨'], MEL: ['墨爾本', '墨爾本'], BNE: ['布里斯本', '布里斯本'], AKL: ['奧克蘭', '奧克蘭'],
    LAX: ['洛杉磯', '洛杉磯'], SFO: ['舊金山', '舊金山'], JFK: ['紐約', '甘迺迪'],
    NYC: ['紐約', '紐約各機場'], SEA: ['西雅圖', '西雅圖'],
    CDG: ['巴黎', '戴高樂'], PAR: ['巴黎', '巴黎各機場'], LHR: ['倫敦', '希斯洛'],
    LON: ['倫敦', '倫敦各機場'], AMS: ['阿姆斯特丹', '史基浦'], FRA: ['法蘭克福', '法蘭克福'],
    ZRH: ['蘇黎世', '蘇黎世'], FCO: ['羅馬', '菲烏米奇諾']
  };
  function airport(code) {
    const key = String(code || '').trim().toUpperCase();
    const place = airports[key];
    return { code: key, city: place ? place[0] : key, name: place ? place[1] : '' };
  }
  function amount(value) {
    const text = String(value ?? '').trim().replace(/^(?:NT\$|TWD)\s*/i, '').replaceAll(',', '');
    if (!/^\d+(?:\.\d+)?$/.test(text)) return null;
    const number = Number(text);
    return Number.isFinite(number) && number > 0 ? Math.round(number) : null;
  }
  function money(value) {
    const valueNumber = amount(value);
    return valueNumber === null ? '查看最新價格' : 'NT$ ' + valueNumber.toLocaleString('zh-TW');
  }
  function safeUrl(value, hosts = []) {
    try {
      const url = new URL(String(value));
      if (url.protocol !== 'https:') return '';
      if (hosts.length && !hosts.some(host => url.hostname === host || url.hostname.endsWith('.' + host))) return '';
      return url.href;
    } catch { return ''; }
  }
  function isFresh(row, now = Date.now()) {
    const expires = Date.parse(row.expires_at);
    return Number.isFinite(expires) && expires > now;
  }
  function eligibleDeals(rows, region = '全部', now = Date.now()) {
    return rows.filter(row => row.status === 'published' && row.review_status === 'approved' &&
      isFresh(row, now) && amount(row.price_twd) !== null && safeUrl(row.search_url) &&
      (region === '全部' || row.region === region));
  }
  function matchingProducts(rows, region = '全部', query = '') {
    const text = query.trim().toLocaleLowerCase('zh-TW');
    return rows.filter(row => row.status === 'published' &&
      (region === '全部' || row.region === region) &&
      (!text || [row.country, row.city, row.category, row.title].join(' ').toLocaleLowerCase('zh-TW').includes(text)));
  }
  function localDate(value, withTime = true) {
    const time = Date.parse(value);
    if (!Number.isFinite(time)) return '時間未提供';
    return new Intl.DateTimeFormat('zh-TW', {
      timeZone: 'Asia/Taipei', month: '2-digit', day: '2-digit',
      ...(withTime ? { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' } : {})
    }).format(new Date(time));
  }
  function travelDate(value, withYear = false) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return '日期待確認';
    const date = new Date(value + 'T00:00:00Z');
    if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) return '日期待確認';
    const day = '日一二三四五六'[date.getUTCDay()];
    const prefix = withYear ? value.slice(0, 4) + '/' : '';
    return prefix + Number(value.slice(5, 7)) + '/' + Number(value.slice(8, 10)) + '（' + day + '）';
  }
  function priceHistory(row, now=Date.now()) {
    let history;try{history=typeof row.history_json==='string'?JSON.parse(row.history_json):null;}catch{return null;}
    if(!history?.windows || !Number.isFinite(Date.parse(history.asOf)) || Date.parse(history.asOf)>now || now-Date.parse(history.asOf)>86400000)return null;
    for(const days of [90,30,7]){
      const w=history.windows[days];
      if(!w?.mature || !Number.isInteger(w.observedDays)||w.observedDays<Math.ceil(days*.8)||w.observedDays>days+1||!Number.isFinite(w.min)||w.min<=0||!Number.isFinite(w.median)||w.median<w.min)continue;
      const points=Array.isArray(w.points)?w.points.filter(p=>/^\d{4}-\d{2}-\d{2}$/.test(p.date)&&Number.isFinite(p.price)&&p.price>0).slice(-days):[];
      if(!points.length)return null;
      return {days,min:w.min,median:w.median,observedDays:w.observedDays,points,asOf:history.asOf};
    }
    return null;
  }
  const api = { airport, amount, money, safeUrl, isFresh, eligibleDeals, matchingProducts, localDate, travelDate, priceHistory };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.FlightsModel = api;
})(typeof window !== 'undefined' ? window : globalThis);
