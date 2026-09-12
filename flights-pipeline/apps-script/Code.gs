const TERRA_CONFIG = Object.freeze({
  productSheet: '旅遊商品',
  flightSheet: '機票優惠',
  statusSheet: '系統狀態',
  catalogProperty: 'KLOOK_CATALOG_URL',
  maxProductsPerCountry: 12,
  countries: ['日本', '韓國', '泰國', '新加坡', '馬來西亞', '美國', '英國', '法國', '義大利', '德國', '西班牙', '荷蘭', '瑞士', '奧地利'],
});

const PRODUCT_HEADERS = Object.freeze([
  'product_id', 'status', 'region', 'country', 'city', 'category', 'title',
  'price_twd', 'rating', 'review_count', 'earliest_available',
  'instant_confirmation', 'cancellation_policy', 'image_url', 'affiliate_url',
  'updated_at', 'source',
]);

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Terra 旅遊資料')
    .addItem('設定 Klook 目錄連結', 'configureKlookCatalogUrl')
    .addItem('立即同步 Klook 商品', 'syncKlookCatalogOnDemand')
    .addSeparator()
    .addItem('將過期機票退出公開', 'expireFlightDeals')
    .addToUi();
}

function configureKlookCatalogUrl() {
  const ui = SpreadsheetApp.getUi();
  const result = ui.prompt(
    '設定 Klook 目錄下載連結',
    '在 Klook「產品目錄」選 JSON，再按「複製下載連結」。連結只存進 Apps Script 屬性，不會寫入試算表。',
    ui.ButtonSet.OK_CANCEL,
  );
  if (result.getSelectedButton() !== ui.Button.OK) return;
  const url = validateCatalogUrl_(result.getResponseText());
  PropertiesService.getScriptProperties().setProperty(TERRA_CONFIG.catalogProperty, url);
  ui.alert('已保存。現在可以執行「立即同步 Klook 商品」。');
}

function syncKlookCatalogOnDemand() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const catalogUrl = PropertiesService.getScriptProperties().getProperty(TERRA_CONFIG.catalogProperty);
    if (!catalogUrl) throw new Error('尚未設定 Klook 目錄下載連結。');
    const response = UrlFetchApp.fetch(validateCatalogUrl_(catalogUrl), {
      method: 'get',
      followRedirects: true,
      muteHttpExceptions: true,
      headers: { Accept: 'application/json' },
    });
    if (response.getResponseCode() !== 200) throw new Error(`Klook 目錄下載失敗（HTTP ${response.getResponseCode()}）。`);
    const source = JSON.parse(response.getContentText());
    if (!Array.isArray(source)) throw new Error('Klook 目錄格式不是陣列。');

    const now = new Date().toISOString();
    const selected = selectProducts_(source);
    const values = selected.map((item) => normalizeProduct_(item, now));
    replaceSheetData_(TERRA_CONFIG.productSheet, PRODUCT_HEADERS, values);
    setStatus_('last_klook_catalog_import', now, `Klook 官方目錄 ${source.length} 筆；公開 ${values.length} 筆代表商品`);
    setStatus_('klook_catalog_status', 'on_demand_sync_ok', '由 Terra 選單人工觸發；尚未安裝背景排程');
    SpreadsheetApp.getUi().alert(`同步完成：從 ${source.length} 筆目錄整理出 ${values.length} 筆公開商品。`);
  } finally {
    lock.releaseLock();
  }
}

function expireFlightDeals() {
  const sheet = getRequiredSheet_(TERRA_CONFIG.flightSheet);
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return;
  const headers = values[0].map(String);
  const statusIndex = headers.indexOf('status');
  const expiresIndex = headers.indexOf('expires_at');
  if (statusIndex < 0 || expiresIndex < 0) throw new Error('機票優惠欄位不完整。');
  const now = Date.now();
  let changed = 0;
  for (let index = 1; index < values.length; index += 1) {
    const expiry = Date.parse(values[index][expiresIndex]);
    if (values[index][statusIndex] === 'published' && Number.isFinite(expiry) && expiry <= now) {
      values[index][statusIndex] = 'expired';
      changed += 1;
    }
  }
  if (changed) sheet.getRange(2, 1, values.length - 1, values[0].length).setValues(values.slice(1));
  setStatus_('last_flight_expiry_check', new Date().toISOString(), `${changed} 筆優惠退出公開`);
  SpreadsheetApp.getUi().alert(`檢查完成：${changed} 筆過期優惠已退出公開。`);
}

function selectProducts_(source) {
  const buckets = {};
  TERRA_CONFIG.countries.forEach((country) => { buckets[country] = []; });
  source.forEach((item) => {
    const country = String(item['國家名稱'] || '').trim();
    if (!buckets[country]) return;
    buckets[country].push(item);
  });
  return TERRA_CONFIG.countries.flatMap((country) => buckets[country]
    .sort((a, b) => numeric_(b['評論數量']) - numeric_(a['評論數量']))
    .slice(0, TERRA_CONFIG.maxProductsPerCountry));
}

function normalizeProduct_(item, now) {
  const country = String(item['國家名稱'] || '').trim();
  return [
    `klook-${String(item['活動ID'] || '').trim()}`,
    'published',
    regionFor_(country),
    country,
    String(item['城市名稱'] || '').trim(),
    String(item['活動類別'] || '').trim(),
    String(item['活動名稱'] || '').trim(),
    numeric_(item['KLOOK客路價格']),
    numeric_(item['等級']),
    numeric_(item['評論數量']),
    String(item['最早可用日期'] || '').trim(),
    String(item['即時確認'] || '').trim(),
    String(item['取消政策'] || '').trim(),
    requireHttps_(item['圖片網址1'], '圖片網址'),
    requireHttps_(item['附屬連結'], '聯盟連結'),
    now,
    'Klook Product Catalog',
  ];
}

function replaceSheetData_(sheetName, headers, values) {
  const sheet = getRequiredSheet_(sheetName);
  const neededRows = Math.max(2, values.length + 1);
  if (sheet.getMaxRows() < neededRows) sheet.insertRowsAfter(sheet.getMaxRows(), neededRows - sheet.getMaxRows());
  const oldRows = Math.max(0, sheet.getLastRow() - 1);
  if (oldRows) sheet.getRange(2, 1, oldRows, headers.length).clearContent();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  if (values.length) sheet.getRange(2, 1, values.length, headers.length).setValues(values);
}

function setStatus_(key, value, note) {
  const sheet = getRequiredSheet_(TERRA_CONFIG.statusSheet);
  const rows = sheet.getDataRange().getValues();
  let rowNumber = rows.findIndex((row, index) => index > 0 && String(row[0]) === key) + 1;
  if (!rowNumber) rowNumber = Math.max(2, sheet.getLastRow() + 1);
  sheet.getRange(rowNumber, 1, 1, 3).setValues([[key, value, note]]);
}

function getRequiredSheet_(name) {
  const sheet = SpreadsheetApp.getActive().getSheetByName(name);
  if (!sheet) throw new Error(`找不到分頁：${name}`);
  return sheet;
}

function validateCatalogUrl_(value) {
  const url = String(value || '').trim();
  if (!/^https:\/\//i.test(url)) throw new Error('目錄連結必須使用 HTTPS。');
  if (!/(^|\.)klook\.com(?=\/|:)/i.test(url.replace(/^https:\/\//i, '').split('?')[0])) {
    throw new Error('這不是 Klook 網域的目錄連結。');
  }
  return url;
}

function requireHttps_(value, label) {
  const url = String(value || '').trim();
  if (!url) return '';
  if (!/^https:\/\//i.test(url)) throw new Error(`${label} 不是 HTTPS。`);
  return url;
}

function numeric_(value) {
  const number = Number(String(value || '').replace(/[^\d.]/g, ''));
  return Number.isFinite(number) ? number : 0;
}

function regionFor_(country) {
  if (country === '美國') return '美國';
  if (['英國', '法國', '義大利', '德國', '西班牙', '荷蘭', '瑞士', '奧地利'].includes(country)) return '歐洲';
  return '亞洲';
}
