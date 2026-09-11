(function(root,factory){const api=factory(typeof module==='object'?require('../product-content.js'):root.ProductContent);if(typeof module==='object')module.exports=api;else root.BlogIndexModel=api;})(typeof globalThis!=='undefined'?globalThis:this,function(ProductContent){
  function formatDate(value){const date=ProductContent.date(value);if(!date)return '';return new Intl.DateTimeFormat('zh-TW',{timeZone:'Asia/Taipei',month:'long',day:'numeric'}).format(new Date(date+'T12:00:00+08:00'));}
  function rowFor(rows,key){return ProductContent.rowForArticle(rows,key);}
  function newestFirst(a,b){
    const left=ProductContent.date(a)||'0000-00-00',right=ProductContent.date(b)||'0000-00-00';
    return right.localeCompare(left);
  }
  function stateFor(row,now=ProductContent.today()){
    if(!row)return {shelf:'journal',label:'團購狀態待確認'};
    const rawStart=String(row['開團日期']||'').trim(),rawEnd=String(row['結束日期']||'').trim();
    const start=ProductContent.date(rawStart),end=ProductContent.date(rawEnd),kind=String(row['類型']||''),url=ProductContent.safeUrl(row['連結']);
    if((rawStart&&!start)||(rawEnd&&!end)||(start&&end&&start>end))return {shelf:'journal',label:'團購狀態待確認'};
    if(/結團|已結束|closed|ended/i.test(kind)||(end&&now>end))return {shelf:'journal',label:'目前未開團'};
    if(start&&now<start)return {shelf:'upcoming',label:`${formatDate(start)} 開團`};
    if((end||/長期|long/i.test(kind))&&url)return {shelf:'open',label:'開團中',url};
    return {shelf:'journal',label:'團購狀態待確認'};
  }
  return {formatDate,rowFor,stateFor,newestFirst};
});
