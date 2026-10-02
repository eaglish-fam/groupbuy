export const reviewCategoryLabels={attraction:'景點',restaurant:'餐廳',hotel:'飯店',accommodation:'住宿',public_market_activity:'公開市集活動',public_retail:'公開商店',transit:'交通',activity_venue:'活動場所',public_event:'公開活動',dining:'餐飲經驗',shopping:'購物經驗'};
export const reviewRelationLabels={visit_confirmed:'確認實訪',current_actual:'當次實訪',current_actual_visit:'當次實訪',historical_actual:'過往實訪',historical_actual_visit:'過往實訪',current_and_historical_actual:'當次及過往實訪',actual_visit_identity_unresolved:'實訪、地點待核',historical_taiwan_visit:'過往台灣實訪',historical_taiwan_dining_experience:'過往台灣餐飲經驗（分店未確認）',uncertain_historical_taiwan_experience:'過往台灣經驗（證據不確定）',source_bound_identity_pending:'來源已綁定、名稱與地點待核'};
Object.assign(reviewCategoryLabels,{unknown:'類別待核',dining_experience:'餐飲經驗',attraction_activity:'景點與體驗活動',third_party_context:'他人行程背景（非作者住宿）',regional_travel_activity:'區域旅行活動',regional_visit:'區域實訪',retail_experience:'購物經驗'});
Object.assign(reviewRelationLabels,{
 current_dining_experience:'當次餐飲經驗（場所未確認）',historical_country_unknown:'過往經驗（國別不明）',historical_dining_experience:'過往餐飲經驗',uncertain_historical_experience:'過往經驗（證據不確定）',
 current_hotel_dropoff_not_stay:'當次接送至飯店（不是住宿）',current_reported_dining_activity:'當次自述餐飲活動',current_hosted_travel_activity:'當次接待旅行活動',current_public_event:'當次公開活動',historical_public_event:'過往公開活動',current_public_activity:'當次公開體驗',historical_regular_visits:'過往經常實訪',current_actual_activity:'當次實際活動',historical_activity:'過往活動',current_transit_and_historical_destination_reference:'當次交通及過往目的地提及',current_transit:'當次交通',historical_visit_country_uncertain:'過往實訪（國別待核）',current_actual_experience:'當次實際體驗',uncertain_third_party_reference:'他人行程提及（證據不確定）',
 unlocated_current_visit:'當次實訪、地點待核',dining_experience_not_physical_venue:'餐飲經驗（不能推定實體分店）',uncertain:'證據待核',matched_reviewed_public_place:'對應既有已核地點',unlocated_historical_visit:'過往實訪、地點待核',unlocated_transport_activity:'交通活動、地點待核',unlocated_hosted_activity:'接待活動、地點待核',uncertain_country_unlocated_visit:'實訪、國別與地點待核',identity_pending:'來源身分待核（請求與觀察網址不一致）',unlocated_public_event:'公開活動、地點待核',unlocated_historical_public_event:'過往公開活動、地點待核',uncertain_country_unlocated_activity:'活動、國別與地點待核',public_access_pending:'場所開放性待核',mention_only:'僅提及／線索',unresolved:'未解'
});
export function displayTimecode(seconds){
 if(!Number.isFinite(seconds)||seconds<0)return '沒有時碼';
 const hundredths=Math.round(seconds*100),minutes=Math.floor(hundredths/6000),remainder=hundredths%6000;
 return String(minutes).padStart(2,'0')+':'+String(Math.floor(remainder/100)).padStart(2,'0')+(remainder%100?'.'+String(remainder%100).padStart(2,'0'):'');
}
export function displayReviewStatus(row){
 if(row.effectiveIdentityStatus==='identity_pending'||row.disposition==='identity_pending')return reviewRelationLabels.identity_pending;
 return [...new Set([reviewRelationLabels[row.relation]??'時間關係待核',reviewRelationLabels[row.disposition]??'關係待核'])].join(' · ');
}
const fold=v=>String(v??'').normalize('NFKC').toLocaleLowerCase('zh-TW');
export function selectReviewRecords(records,{query='',category='all',categoryScope='either'}={}){
 const needle=fold(query).trim();
 return records.filter(r=>{
  const categories=categoryScope==='primary'?[r.category]:categoryScope==='secondary'?(r.secondaryCategories??[]):[r.category,...(r.secondaryCategories??[])];
  if(category!=='all'&&!categories.includes(category))return false;
  return !needle||fold([r.label,r.pendingName,r.sourceId,r.sourceUrl,r.relation,reviewRelationLabels[r.relation],reviewCategoryLabels[r.category],...(r.secondaryCategories??[]).map(c=>reviewCategoryLabels[c]),...r.evidence.map(e=>e.excerpt)].join(' ')).includes(needle);
 });
}
export function reviewPage(records,options={}){
 const selected=selectReviewRecords(records,options),size=Number.isInteger(options.pageSize)&&options.pageSize>0?Math.min(options.pageSize,100):20;
 const pages=Math.max(1,Math.ceil(selected.length/size)),page=Math.max(1,Math.min(pages,Math.trunc(options.page)||1));
 return {total:selected.length,page,pages,records:selected.slice((page-1)*size,page*size)};
}
export function mountReviewBrowser(doc){
 const data=doc.getElementById('atlas-data'),controls=doc.getElementById('review-controls');
 if(!data||!controls)return;
 const records=JSON.parse(data.textContent).records,articles=[...doc.querySelectorAll('[data-review-index]')];
 const query=doc.getElementById('review-query'),category=doc.getElementById('review-category'),scope=doc.getElementById('review-category-scope');
 const count=doc.getElementById('review-count'),prev=doc.getElementById('review-prev'),next=doc.getElementById('review-next'),empty=doc.getElementById('review-empty');
 let page=1;
 const render=()=>{
  const result=reviewPage(records,{query:query.value,category:category.value,categoryScope:scope.value,page});page=result.page;
  const visible=new Set(result.records.map(r=>r.id));
  for(const article of articles)article.hidden=!visible.has(records[Number(article.dataset.reviewIndex)].id);
  count.textContent=`找到 ${result.total}／${records.length} 筆紀錄 · 第 ${page}／${result.pages} 頁 · 本頁 ${result.records.length} 筆`;
  empty.hidden=result.total!==0;prev.disabled=page===1;next.disabled=page===result.pages;
 };
 for(const field of [query,category,scope])field.addEventListener(field===query?'input':'change',()=>{page=1;render();});
 doc.getElementById('review-reset').addEventListener('click',()=>{query.value='';category.value='all';scope.value='either';page=1;render();query.focus();});
 const turn=delta=>{page+=delta;render();doc.getElementById('review-results').focus();};
 prev.addEventListener('click',()=>turn(-1));next.addEventListener('click',()=>turn(1));
 controls.hidden=false;doc.getElementById('review-pagination').hidden=false;render();
}
if(typeof document!=='undefined')mountReviewBrowser(document);
