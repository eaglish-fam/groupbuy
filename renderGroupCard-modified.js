// ============================================
// 修改後的 renderGroupCard 函數
// 適用於雙排瀑布流佈局
// ============================================

function renderGroupCard(g) {
  const daysLeft = utils.getDaysLeft(g.endDate);
  const expired = utils.isExpired(g.endDate);
  const noteIsURL = utils.isURL(g.note);
  const noteIsQA = utils.isQA(g.note);
  const qaList = noteIsQA ? utils.parseQA(g.note) : [];
  const openClass = expired ? 'from-gray-400 to-gray-500 hover:from-gray-400 hover:to-gray-500' : 'from-amber-600 to-pink-600 hover:from-amber-700 hover:to-pink-700';

  // 處理複選的分類和國家
  const categories = g.itemCategory ? g.itemCategory.split(/[,，]/).map(c => c.trim()).filter(c => c) : [];
  const countries = g.itemCountry ? g.itemCountry.split(/[,，]/).map(c => c.trim()).filter(c => c) : [];
  
  // 生成分類標籤
  const categoryTags = categories.map(cat => 
    `<span class="text-xs ${utils.getCategoryColor(cat)} px-2 py-1 rounded-full border font-medium">${utils.getCategoryIcon(cat)} ${cat}</span>`
  ).join('');
  
  // 生成國家標籤
  const countryTags = countries.map(country => 
    `<span class="text-xs bg-blue-100 text-blue-700 border-blue-300 px-2 py-1 rounded-full border font-medium">${utils.getCountryFlag(country)} ${country}</span>`
  ).join('');

  const countdown = g.category === 'short' && daysLeft !== null
    ? `<div class="flex items-center gap-2 text-sm mb-2">
         <span class="${daysLeft < 0 ? 'text-gray-500' : daysLeft <= 3 ? 'text-red-600 font-semibold' : 'text-amber-700'}">
           ⏱ ${daysLeft > 0 ? '剩 ' + daysLeft + ' 天' : daysLeft === 0 ? '今天截止' : '結束 ' + Math.abs(daysLeft) + ' 天'}
         </span>
       </div>`
    : '';

  return `
    <div class="masonry-card ${expired ? 'opacity-60' : ''}">
      ${g.image ? `
        <div class="masonry-card-image-wrapper">
          <img src="${g.image}" 
               alt="${g.brand}" 
               class="masonry-card-image ${expired ? 'grayscale' : ''}"
               loading="lazy">
        </div>
      ` : ''}
      
      <div class="masonry-card-content">
        <h3 class="masonry-card-title ${expired ? 'text-gray-500' : 'text-amber-900'}">
          ${g.brand}
        </h3>
        
        <div class="flex flex-wrap gap-1.5 mb-2">
          ${expired ? '<span class="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">已結束</span>' : ''}
          ${categoryTags}
          ${countryTags}
          ${g.tag ? `<span class="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded-full font-medium">${g.tag}</span>` : ''}
          ${g.stock === '售完' ? '<span class="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">已售完</span>' : ''}
          ${g.stock === '少量' ? '<span class="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">少量現貨</span>' : ''}
        </div>
        
        ${g.description ? `<p class="text-xs ${expired ? 'text-gray-400' : 'text-gray-600'} mb-2 line-clamp-2">${g.description}</p>` : ''}
        
        ${countdown}
        
        ${g.note && !expired
          ? noteIsQA
            ? `<details class="mb-2 bg-indigo-50 border border-indigo-200 rounded-lg p-2">
                 <summary class="cursor-pointer text-xs text-indigo-700 font-medium">常見問題❓（${qaList.length}）</summary>
                 ${qaList.map(qa => `<div class="mt-2 border-t border-indigo-200 pt-2"><p class="text-xs font-semibold text-indigo-900 mb-1">Q: ${qa.q}</p><p class="text-xs text-indigo-700">A: ${qa.a}</p></div>`).join('')}
               </details>`
            : noteIsURL
              ? `<div class="mb-2"><button onclick='openNote(event, "${g.note}")' class="w-full bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors">📝 查看介紹</button></div>`
              : `<div class="mb-2 bg-blue-50 border border-blue-200 rounded-lg p-2"><p class="text-[10px] text-blue-600 font-semibold mb-1">ℹ️ 貼心說明</p><p class="text-xs text-blue-900 line-clamp-2">${g.note}</p></div>`
          : ''}
        
        ${g.video && !expired ? `
          <div class="mb-2">
            <button onclick='openVideoModal(event, "${g.video}")' 
                    class="w-full bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs font-medium hover:from-red-100 hover:to-pink-100 transition-colors">
              🎬 觀看影片
            </button>
          </div>
        ` : ''}
        
        ${g.coupon && !expired ? `
          <div class="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-2 mb-2">
            <div class="flex items-center justify-between">
              <div class="flex-1 min-w-0">
                <p class="text-[10px] text-green-700 font-semibold mb-0.5">🎟️ 專屬折扣碼</p>
                <code class="text-xs font-bold text-green-800 font-mono break-all">${g.coupon}</code>
              </div>
              <button onclick='copyCoupon(event, "${g.coupon}")' 
                      class="ml-2 bg-green-600 hover:bg-green-700 text-white px-2 py-1.5 rounded text-xs font-medium whitespace-nowrap">
                複製
              </button>
            </div>
          </div>
        ` : ''}
        
        ${g.endDate && !expired && g.category !== '長期' ? `
          <div class="mb-2">
            <button onclick="addToCalendar(event, '${g.brand.replace(/'/g, "\\'")} - 團購截止', '${g.endDate}', '${g.url}', '⏰ 今天是最後一天！記得下單')" 
                    class="w-full bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-blue-700 px-3 py-2 rounded-lg text-xs font-medium hover:from-blue-100 hover:to-indigo-100 transition-colors">
              📅 加入行事曆
            </button>
          </div>
        ` : ''}
        
        <a href="${g.url}" 
           target="_blank" 
           rel="noopener noreferrer" 
           onclick="if(typeof gtag !== 'undefined'){gtag('event', 'click_group', {group_name: '${g.brand.replace(/'/g, "\\'")}', group_category: '${g.category}', event_category: 'conversion', event_label: '${g.brand.replace(/'/g, "\\'")}', value: 1});}"
           class="block w-full text-center text-white py-2.5 rounded-lg font-bold text-sm bg-gradient-to-r ${openClass}">
          ${expired ? '仍可查看 →' : '立即前往 →'}
        </a>
      </div>
    </div>`;
}

// ============================================
// 修改後的 renderCouponCard 函數
// ============================================

function renderCouponCard(g) {
  const expired = utils.isExpired(g.endDate);
  const daysLeft = utils.getDaysLeft(g.endDate);
  const noteIsURL = utils.isURL(g.note);
  const noteIsQA = utils.isQA(g.note);
  const qaList = noteIsQA ? utils.parseQA(g.note) : [];

  // 處理複選的分類和國家
  const categories = g.itemCategory ? g.itemCategory.split(/[,，]/).map(c => c.trim()).filter(c => c) : [];
  const countries = g.itemCountry ? g.itemCountry.split(/[,，]/).map(c => c.trim()).filter(c => c) : [];
  
  // 生成分類標籤
  const categoryTags = categories.map(cat => 
    `<span class="text-xs ${utils.getCategoryColor(cat)} px-2 py-1 rounded-full border font-medium">${utils.getCategoryIcon(cat)} ${cat}</span>`
  ).join('');
  
  // 生成國家標籤
  const countryTags = countries.map(country => 
    `<span class="text-xs bg-blue-100 text-blue-700 border-blue-300 px-2 py-1 rounded-full border font-medium">${utils.getCountryFlag(country)} ${country}</span>`
  ).join('');

  return `
    <div class="masonry-card bg-gradient-to-br from-purple-50 to-pink-50 ${expired ? 'opacity-60' : ''}">
      ${g.image ? `
        <div class="masonry-card-image-wrapper">
          <img src="${g.image}" 
               alt="${g.brand}" 
               class="masonry-card-image ${expired ? 'grayscale' : ''}"
               loading="lazy">
        </div>
      ` : ''}
      
      <div class="masonry-card-content">
        <h3 class="masonry-card-title ${expired ? 'text-gray-500' : 'text-purple-900'}">
          ${g.brand}
        </h3>
        
        <div class="flex flex-wrap gap-1.5 mb-2">
          ${categoryTags}
          ${countryTags}
        </div>
        
        ${g.description ? `<p class="text-xs ${expired ? 'text-gray-400' : 'text-gray-600'} mb-2 line-clamp-2">${g.description}</p>` : ''}
        
        ${g.note && !expired
          ? noteIsQA
            ? `<details class="mb-2 bg-indigo-50 border border-indigo-200 rounded-lg p-2">
                 <summary class="cursor-pointer text-xs text-indigo-700 font-medium">常見問題❓（${qaList.length}）</summary>
                 ${qaList.map(qa => `<div class="mt-2 border-t border-indigo-200 pt-2"><p class="text-xs font-semibold text-indigo-900 mb-1">Q: ${qa.q}</p><p class="text-xs text-indigo-700">A: ${qa.a}</p></div>`).join('')}
               </details>`
            : noteIsURL
              ? `<button onclick='openNote(event, "${g.note}")' class="w-full bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors mb-2">📝 查看介紹</button>`
              : `<div class="mb-2 bg-blue-50 border border-blue-200 rounded-lg p-2"><p class="text-[10px] text-blue-600 font-semibold mb-1">ℹ️ 備註</p><p class="text-xs text-blue-900 line-clamp-2">${g.note}</p></div>`
          : ''}
        
        ${daysLeft !== null && !expired ? `
          <div class="flex items-center gap-2 text-sm mb-2">
            <span class="${daysLeft <= 7 ? 'text-red-600 font-semibold' : 'text-purple-700'}">
              ⏰ ${daysLeft > 0 ? '剩 ' + daysLeft + ' 天' : '今天截止'}
            </span>
          </div>
        ` : ''}
        
        ${g.coupon && !expired ? `
          <div class="bg-white border border-purple-300 rounded-lg p-3 mb-2">
            <p class="text-[10px] text-purple-600 font-semibold mb-1">🎟️ 折扣碼</p>
            <div class="flex items-center gap-2">
              <code class="text-sm font-bold text-purple-900 font-mono break-all flex-1 min-w-0">${g.coupon}</code>
              <button onclick='copyCoupon(event, "${g.coupon}")' 
                      class="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap flex-shrink-0">
                複製
              </button>
            </div>
          </div>
        ` : ''}
        
        <a href="${g.url}" 
           target="_blank" 
           rel="noopener noreferrer" 
           onclick="if(typeof gtag !== 'undefined'){gtag('event', 'click_coupon', {group_name: '${g.brand.replace(/'/g, "\\'")}', coupon_code: '${g.coupon || ''}', event_category: 'conversion', event_label: '${g.brand.replace(/'/g, "\\'")}', value: 1});}"
           class="block w-full text-center text-white py-2.5 rounded-lg font-bold text-sm bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 ${expired ? 'opacity-80' : ''}">
          ${expired ? '仍可查看 →' : '立即前往 →'}
        </a>
      </div>
    </div>`;
}

// ============================================
// 修改 renderContent 函數中的網格容器
// ============================================

// 將所有的：
// <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
// 
// 改為：
// <div class="masonry-grid">

// 範例（在 renderContent 函數中）：

/*
原始代碼：
(shortTerm.length ? `
  <section id="short-term" class="scroll-mt-24 md:scroll-mt-28 mb-8">
    <h2 class="text-2xl font-bold text-amber-900 mb-4 text-center">⏳ 限時團購</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      ${shortTerm.map(renderGroupCard).join('')}
    </div>
  </section>
` : '')

修改後：
(shortTerm.length ? `
  <section id="short-term" class="scroll-mt-24 md:scroll-mt-28 mb-8">
    <h2 class="text-2xl font-bold text-amber-900 mb-4 text-center">⏳ 限時團購</h2>
    <div class="masonry-grid">
      ${shortTerm.map(renderGroupCard).join('')}
    </div>
  </section>
` : '')
*/
