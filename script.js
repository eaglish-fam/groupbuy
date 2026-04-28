// ============================================
// 鷹家買物社 - 圖片優化模組
// 功能：Google Drive 轉換、錯誤處理、lazy loading
// ============================================

const ImageOptimizer = {
  // Google Drive 圖片 URL 正規化
  // ✅ 使用 lh3.googleusercontent.com 格式（經實測最穩定）
  normalizeGoogleDriveUrl(url) {
    if (!url) return url;
    
    // 如果已經是 lh3.googleusercontent.com 格式，直接返回
    if (url.includes('lh3.googleusercontent.com')) {
      return url;
    }
    
    // 如果不是 Google Drive 連結，直接返回
    if (!url.includes('drive.google.com')) {
      return url;
    }

    try {
      let fileId = null;
      
      // 格式 1: https://drive.google.com/file/d/FILE_ID/view
      let match = url.match(/\/file\/d\/([^\/\?]+)/);
      if (match) {
        fileId = match[1];
      }
      
      // 格式 2: https://drive.google.com/open?id=FILE_ID
      if (!fileId) {
        match = url.match(/[?&]id=([^&]+)/);
        if (match) {
          fileId = match[1];
        }
      }
      
      // 格式 3: https://drive.google.com/uc?id=FILE_ID
      if (!fileId && url.includes('uc?')) {
        try {
          const urlObj = new URL(url);
          fileId = urlObj.searchParams.get('id');
        } catch {}
      }
      
      // 如果成功提取 FILE_ID，轉換為 lh3.googleusercontent.com 格式
      if (fileId) {
        // 清除可能的尾部參數
        fileId = fileId.split('?')[0].split('#')[0];
        const optimizedUrl = `https://lh3.googleusercontent.com/d/${fileId}=w1200`;
        return optimizedUrl;
      }
    } catch (error) {
    }

    return url;
  },

  // 驗證圖片 URL 是否有效
  async validateImageUrl(url) {
    if (!url) return false;

    try {
      const response = await fetch(url, { 
        method: 'HEAD',
        mode: 'no-cors', // 避免 CORS 問題
        cache: 'force-cache'
      });
      return true; // no-cors 模式下只要不報錯就算成功
    } catch (error) {
      return false;
    }
  },

  // 產生 fallback 圖片 (placeholder)
  generatePlaceholder(text = '無圖片', width = 400, height = 300) {
    // 使用 SVG placeholder
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
        <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="16" fill="#9ca3af" text-anchor="middle" dy=".3em">
          ${text}
        </text>
      </svg>
    `;
    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
  },

  // 產生模糊的 placeholder (LQIP - Low Quality Image Placeholder)
  generateBlurPlaceholder(color = '#f3f4f6') {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10">
        <rect width="100%" height="100%" fill="${color}"/>
      </svg>
    `;
    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
  },

  // 產生漸層 placeholder
  generateGradientPlaceholder() {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#fef3c7;stop-opacity:1" />
            <stop offset="50%" style="stop-color:#fcd34d;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#fef3c7;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grad)"/>
        <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="48" fill="#78350f" text-anchor="middle" dy=".3em">🦅</text>
      </svg>
    `;
    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
  },

  // 取得優化後的圖片 URL（含 fallback 鏈）
  getOptimizedImageUrl(originalUrl, brandName = '') {
    if (!originalUrl) {
      return {
        primary: this.generateGradientPlaceholder(),
        fallback: this.generatePlaceholder(brandName || '無圖片'),
        isPlaceholder: true
      };
    }

    // 正規化 Google Drive URL
    const normalizedUrl = this.normalizeGoogleDriveUrl(originalUrl);

    return {
      primary: normalizedUrl,
      fallback: this.generateGradientPlaceholder(),
      isPlaceholder: false
    };
  },

  // 產生響應式圖片屬性（含 srcset）
  getResponsiveImageAttrs(url, alt = '', sizes = '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw') {
    const { primary, fallback } = this.getOptimizedImageUrl(url, alt);

    return {
      src: primary,
      'data-fallback': fallback,
      alt: alt || '商品圖片',
      loading: 'lazy',
      decoding: 'async',
      sizes: sizes,
      // 防止 CLS (Cumulative Layout Shift)
      style: 'aspect-ratio: 4/3;'
    };
  },

  // 圖片載入錯誤處理
  handleImageError(imgElement) {
    if (!imgElement) return;

    const fallback = imgElement.getAttribute('data-fallback');
    const alt = imgElement.getAttribute('alt') || '無圖片';

    if (fallback && imgElement.src !== fallback) {
      imgElement.src = fallback;
    } else {
      // 最終 fallback
      imgElement.src = this.generatePlaceholder(alt);
    }

    // 移除 loading 動畫
    imgElement.classList.remove('loading');
    imgElement.classList.add('error');
  },

  // 初始化圖片 lazy loading 和錯誤處理
  initImageOptimization() {
    // 監聽所有圖片的錯誤事件（使用事件委派）
    document.addEventListener('error', (e) => {
      if (e.target.tagName === 'IMG') {
        this.handleImageError(e.target);
      }
    }, true);

    // Intersection Observer for lazy loading (備用，因為已有 loading="lazy")
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            
            // 預載圖片
            const tempImg = new Image();
            tempImg.onload = () => {
              img.classList.add('loaded');
              img.classList.remove('loading');
            };
            tempImg.onerror = () => {
              this.handleImageError(img);
            };
            tempImg.src = img.src;

            observer.unobserve(img);
          }
        });
      }, {
        rootMargin: '50px' // 提前 50px 開始載入
      });

      // 觀察所有延遲載入的圖片
      document.querySelectorAll('img[loading="lazy"]').forEach(img => {
        img.classList.add('loading');
        imageObserver.observe(img);
      });
    }

  },

  // 批次檢查圖片 URL（用於資料載入後）
  async validateAllImages(groups) {
    const results = {
      total: 0,
      valid: 0,
      invalid: 0,
      googleDrive: 0,
      normalized: 0
    };

    for (const group of groups) {
      if (!group.image) continue;

      results.total++;

      // 檢查是否為 Google Drive
      if (group.image.includes('drive.google.com')) {
        results.googleDrive++;
        
        // 正規化 URL
        const normalized = this.normalizeGoogleDriveUrl(group.image);
        if (normalized !== group.image) {
          group.image = normalized;
          results.normalized++;
        }
      }

      results.valid++;
    }

    return results;
  }
};

// 匯出到全域（方便使用）
window.ImageOptimizer = ImageOptimizer;

// ============================================
// 鷹家買物社 - 圖片渲染輔助函數
// 使用方式：在 renderGroupCard 等函數中使用
// ============================================

// 產生優化的圖片 HTML
function renderOptimizedImage(imageUrl, alt, brand, expired = false, clickable = true, groupUrl = '') {
  if (!imageUrl) {
    // 無圖片時顯示 placeholder
    return `
      <div class="masonry-card-image-wrapper">
        <div class="flex items-center justify-center h-full bg-gradient-to-br from-amber-50 to-orange-50">
          <div class="text-center">
            <div class="text-6xl mb-2">🦅</div>
            <div class="text-sm text-amber-700">${brand || '無圖片'}</div>
          </div>
        </div>
      </div>
    `;
  }

  // 使用 ImageOptimizer 處理 URL
  const { primary, fallback } = ImageOptimizer.getOptimizedImageUrl(imageUrl, brand);
  
  const imgTag = `
    <img src="${primary}" 
         alt="${alt || brand || '商品圖片'}"
         data-fallback="${fallback}"
         class="masonry-card-image ${expired ? 'grayscale' : ''}"
         loading="lazy"
         decoding="async"
         onerror="ImageOptimizer.handleImageError(this)"
         width="400"
         height="300"
         style="aspect-ratio: 4/3;">
  `;

  if (clickable && groupUrl) {
    return `
      <div class="masonry-card-image-wrapper">
        <a href="${groupUrl}" 
           target="_blank" 
           rel="noopener noreferrer"
           onclick="event.stopPropagation(); try{ if(typeof gtag !== 'undefined'){ gtag('event','image_click',{ event_category:'engagement', event_label:'${brand || ''}' }); } }catch(e){}">
          ${imgTag}
        </a>
      </div>
    `;
  } else {
    return `
      <div class="masonry-card-image-wrapper">
        ${imgTag}
      </div>
    `;
  }
}

// 產生響應式背景圖片樣式（用於特殊卡片）
function renderBackgroundImage(imageUrl, alt = '') {
  const { primary, fallback } = ImageOptimizer.getOptimizedImageUrl(imageUrl, alt);
  
  return `
    style="background-image: url('${primary}'); background-size: cover; background-position: center;"
    data-bg-fallback="${fallback}"
    onerror="this.style.backgroundImage = 'url(' + this.dataset.bgFallback + ')'"
  `;
}

// 圖片預載入（用於關鍵圖片）
function preloadImage(imageUrl) {
  if (!imageUrl) return;
  
  const { primary } = ImageOptimizer.getOptimizedImageUrl(imageUrl);
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = primary;
  document.head.appendChild(link);
}

// 預載前 3 張圖片（優化 LCP）
function preloadCriticalImages(groups) {
  const criticalImages = groups
    .filter(g => g.image)
    .slice(0, 3)
    .map(g => g.image);
  
  criticalImages.forEach(img => preloadImage(img));
}

// ============ 側邊欄和篩選器控制 ============
let sidebarOpen = false;
let mobileFiltersOpen = false;

// 桌面版側邊欄
function toggleSidebar() {
  sidebarOpen = !sidebarOpen;
  const sidebar = document.getElementById('desktopSidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const content = document.getElementById('content');
  
  if (sidebarOpen) {
    sidebar.classList.add('open');
    overlay.classList.add('active');
    content.style.marginLeft = '256px';
  } else {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
    content.style.marginLeft = '0';
  }
  
  // 儲存狀態
  try {
    localStorage.setItem(STORAGE_KEYS.sidebarOpen, String(sidebarOpen));
  } catch {}
  
  // GA4 追蹤
  if (typeof gtag !== 'undefined') {
    gtag('event', 'toggle_sidebar', {
      'action': sidebarOpen ? 'open' : 'close',
      'event_category': 'engagement'
    });
  }
}

// 手機版篩選器
function toggleMobileFilters() {
  mobileFiltersOpen = !mobileFiltersOpen;
  const panel = document.getElementById('mobileFiltersPanel');
  const btnText = document.getElementById('filterBtnText');
  
  if (mobileFiltersOpen) {
    panel.style.maxHeight = '500px';
    btnText.textContent = '收合';
  } else {
    panel.style.maxHeight = '0';
    btnText.textContent = '篩選';
  }
  
  // GA4 追蹤
  if (typeof gtag !== 'undefined') {
    gtag('event', 'toggle_mobile_filters', {
      'action': mobileFiltersOpen ? 'open' : 'close',
      'event_category': 'engagement'
    });
  }
}

// ============ 配置 ============
const CONFIG = {
  SHEET_ID: '1-RuyD9eCkrDpgFFXGHRWaTF-LYKaDK-MxAw3uNMozeU',
  
  // 🎨 分類圖示對應（可自訂，沒有的會使用預設）
  CATEGORY_ICONS: {
    '食品': '🍱',
    '母嬰': '👶',
    '服飾': '👕',
    '美妝': '💄',
    '居家': '🏠',
    '3c': '📱',
    '旅遊': '✈️',
    '運動': '🏃',
    '寵物': '🐾',
    '其他': '🎁'
  },
  
  // 🎨 分類顏色對應（可自訂，沒有的會使用預設）
  CATEGORY_COLORS: {
    '食品': 'bg-orange-100 text-orange-700 border-orange-300',
    '母嬰': 'bg-pink-100 text-pink-700 border-pink-300',
    '服飾': 'bg-purple-100 text-purple-700 border-purple-300',
    '美妝': 'bg-rose-100 text-rose-700 border-rose-300',
    '居家': 'bg-green-100 text-green-700 border-green-300',
    '3c': 'bg-blue-100 text-blue-700 border-blue-300',
    '旅遊': 'bg-sky-100 text-sky-700 border-sky-300',
    '運動': 'bg-cyan-100 text-cyan-700 border-cyan-300',
    '寵物': 'bg-amber-100 text-amber-700 border-amber-300',
    '其他': 'bg-gray-100 text-gray-700 border-gray-300'
  },
  
  // 🌏 國家旗幟對應（沒對到的自動 fallback 🌍；要加新國家直接 push 一筆）
  COUNTRY_FLAGS: {
    '臺灣': '🇹🇼',
    '台灣': '🇹🇼',          // 簡繁通用
    '日本': '🇯🇵',
    '韓國': '🇰🇷',
    '美國': '🇺🇸',
    '泰國': '🇹🇭',
    '以色列': '🇮🇱',
    '香港': '🇭🇰',
    '紐西蘭': '🇳🇿',
    '中國': '🇨🇳',
    '歐洲': '🇪🇺',
    '歐盟': '🇪🇺',
    '歐州': '🇪🇺',          // 常見錯字
    '東南亞': '🌏',
    '澳洲': '🇦🇺',
    '其他': '🌍'
  },
  
  BANNER_IMAGE_URL: "",
  BANNER_LINK_URL: "",
  REFRESH_INTERVAL: 5 * 60 * 1000,
  SEARCH_DEBOUNCE: 120,
  
  // 手機版篩選按鈕顯示數量
  MOBILE_FILTER_VISIBLE: 12
};

const STORAGE_KEYS = {
  search: 'eg_search',
  showExpired: 'eg_show_expired',
  month: 'eg_month',
  category: 'eg_category',
  country: 'eg_country',
  sidebarOpen: 'eg_sidebar_open',
  wishlist: 'eg_wishlist'
};

// ============ 康先生的書 — 卡片結構模板（內容全部從 Google Sheet 來）============
// Sheet 規則：類型=書籍，標籤/品牌=紙本 或 電子，圖片網址、商品描述、通路欄位都在 Sheet 上維護
// 沒有對應的 Sheet 列 → 該張卡（紙本 OR 電子）就不渲染
const KANG_BOOKS_TEMPLATE = [
  { format: 'paperback', title: '紙本書籍' },
  { format: 'ebook',     title: '電子書' }
];

// ============ 狀態管理 ============
const state = {
  searchTerm: '',
  groups: [],
  upcomingGroups: [],
  loading: true,
  error: null,
  showExpired: false,
  selectedCalendarMonth: 0,
  selectedCategory: 'all',
  selectedCountry: 'all',
  categoryExpanded: false,
  countryExpanded: false,
  wishlist: new Set(),  // 收藏清單（key = 品牌名）
  availableCategories: [], // 從資料中動態讀取
  availableCountries: [],    // 從資料中動態讀取
  hasActiveFilters: false
};

// ============ 工具函數 ============
const utils = {
  isURL: s => !!s && /^https?:\/\//i.test(s),
  isQA: s => !!s && s.includes('Q:') && s.includes('|A:'),
  normalizeBrand: s => (s || '').toLowerCase().replace(/\s+/g, '').trim(),
  isProbablyHTML: t => /<\/?html[\s>]/i.test(t) || /accounts\.google\.com/.test(t),
  formatCount: n => n > 99 ? '99+' : n > 9 ? '9+' : String(n),
  
  // 正規化分類/國家名稱（用於匹配）
  normalizeFilterValue: v => (v || '').toLowerCase().trim(),
  
  // 取得分類圖示
  getCategoryIcon: name => {
    const normalized = utils.normalizeFilterValue(name);
    for (const [key, icon] of Object.entries(CONFIG.CATEGORY_ICONS)) {
      if (utils.normalizeFilterValue(key) === normalized) {
        return icon;
      }
    }
    return '📦'; // 預設圖示
  },
  
  // 取得分類顏色
  getCategoryColor: name => {
    const normalized = utils.normalizeFilterValue(name);
    for (const [key, color] of Object.entries(CONFIG.CATEGORY_COLORS)) {
      if (utils.normalizeFilterValue(key) === normalized) {
        return color;
      }
    }
    return 'bg-gray-100 text-gray-700 border-gray-300'; // 預設顏色
  },
  
  // 取得國家旗幟
  getCountryFlag: name => {
    const normalized = utils.normalizeFilterValue(name);
    for (const [key, flag] of Object.entries(CONFIG.COUNTRY_FLAGS)) {
      if (utils.normalizeFilterValue(key) === normalized) {
        return flag;
      }
    }
    return '🌐'; // 預設旗幟
  },

  parseDateSafe(v) {
    if (!v) return null;
    if (typeof v === 'number') {
      const ms = Math.round((v - 25569) * 86400 * 1000);
      const d = new Date(ms);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    const s = String(v).trim();
    const m = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
    if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
    const d = new Date(s);
    if (!isNaN(d)) {
      d.setHours(0, 0, 0, 0);
      return d;
    }
    return null;
  },

  getDaysLeft(endStr) {
    const end = this.parseDateSafe(endStr);
    if (!end) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.ceil((end - today) / 86400000);
  },

  isExpired(endStr) {
    const d = this.getDaysLeft(endStr);
    return d !== null && d < 0;
  },

  parseQA(qaString) {
    if (!qaString) return [];
    const norm = qaString
      .replace(/\r\n?/g, '\n')
      .replace(/[|｜]\s*A\s*[：:]/g, '|A:')
      .replace(/Q\s*[：:]/g, 'Q:');
    const separated = norm.replace(/(\|A:[^\n]*?)\s+(?=Q:\s*)/g, '$1\n');
    const chunks = separated.split(/(?=Q:\s*)/g).map(s => s.trim()).filter(s => s.startsWith('Q:'));
    return chunks.map(chunk => {
      const m = chunk.match(/^Q:\s*(.*?)\s*\|A:\s*([\s\S]*?)$/);
      return m ? { q: m[1].trim(), a: m[2].trim() } : null;
    }).filter(Boolean);
  }
};

// ============ DOM 元素緩存 ============
const elements = {
  content: document.getElementById('content'),
  searchInput: document.getElementById('searchInput'),
  clearBtn: document.getElementById('clearBtn'),
  sectionButtons: document.getElementById('sectionButtons'),
  copyToast: document.getElementById('copyToast'),
  videoModal: document.getElementById('videoModal'),
  videoContainer: document.getElementById('videoContainer'),
  bannerSlot: document.getElementById('bannerSlot'),
  
  // 手機版篩選
  categoryFilters: document.getElementById('categoryFilters'),
  countryFilters: document.getElementById('countryFilters'),
  categoryExpand: document.getElementById('categoryExpand'),
  countryExpand: document.getElementById('countryExpand'),
  categoryExpandContent: document.getElementById('categoryExpandContent'),
  countryExpandContent: document.getElementById('countryExpandContent'),
  
  // 桌面版篩選
  desktopCategoryFilters: document.getElementById('desktopCategoryFilters'),
  desktopCountryFilters: document.getElementById('desktopCountryFilters')
};

// ============ 收藏功能（localStorage 持久化 + Modal）============
function toggleWishlist(brand) {
  if (!brand) return;
  const wasIn = state.wishlist.has(brand);
  if (wasIn) state.wishlist.delete(brand);
  else state.wishlist.add(brand);

  try { localStorage.setItem(STORAGE_KEYS.wishlist, JSON.stringify([...state.wishlist])); } catch {}

  if (typeof gtag !== 'undefined') {
    gtag('event', wasIn ? 'wishlist_remove' : 'wishlist_add', {
      brand,
      total_count: state.wishlist.size,
      event_category: 'engagement'
    });
  }

  renderContent();
  refreshWishlistModal();   // modal 開著就同步刷新
}

// 客服管道 modal（多管道時點按鈕觸發）
function openContactModal(brand) {
  const group = state.groups.find(g => g.brand === brand);
  if (!group || !group.contacts || group.contacts.length === 0) return;
  const modal = document.getElementById('contactModal');
  const title = document.getElementById('contactModalTitle');
  const body  = document.getElementById('contactModalBody');
  if (!modal || !body) return;

  if (title) title.textContent = `📞 ${brand} 客服管道`;
  body.innerHTML = group.contacts.map(c => `
    <a href="${smartContactHref(c.value)}" target="_blank" rel="noopener noreferrer"
       onclick="if(typeof gtag !== 'undefined'){gtag('event', 'click_contact', {group_name: '${brand.replace(/'/g, "\\'")}', channel: '${c.name.replace(/'/g, "\\'")}', source: 'modal', event_category: 'engagement'});} closeContactModal();"
       class="contact-modal-row">
      <div style="display:flex;align-items:center;gap:12px;">
        <span class="row-icon">${contactIcon(c.value)}</span>
        <div style="flex:1;min-width:0;">
          <div class="row-name">${c.name}</div>
          <div class="row-value">${c.value}</div>
        </div>
      </div>
    </a>
  `).join('');

  modal.classList.remove('hidden');
  modal.classList.add('flex');
  document.body.style.overflow = 'hidden';
  if (typeof gtag !== 'undefined') {
    gtag('event', 'open_contact_modal', { group_name: brand, count: group.contacts.length, event_category: 'engagement' });
  }
}

function closeContactModal() {
  const modal = document.getElementById('contactModal');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  document.body.style.overflow = '';
}

function refreshWishlistModal() {
  const modal = document.getElementById('wishlistModal');
  const content = document.getElementById('wishlistModalContent');
  if (!modal || !content || modal.classList.contains('hidden')) return;
  const items = state.groups.filter(g => state.wishlist.has(g.brand));
  if (items.length === 0) {
    content.innerHTML = `<div class="text-center py-12 px-6 text-gray-500">
      <p class="text-base">還沒收藏任何商品</p>
      <p class="text-sm text-gray-400 mt-2">在卡片上點 ❤️ 加入收藏</p>
    </div>`;
  } else {
    content.innerHTML = `<div class="masonry-grid">${items.map(renderWishlistCard).join('')}</div>`;
  }
}

function openWishlistModal() {
  const modal = document.getElementById('wishlistModal');
  if (!modal) return;
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  document.body.style.overflow = 'hidden';
  refreshWishlistModal();
  if (typeof gtag !== 'undefined') {
    gtag('event', 'open_wishlist_modal', { count: state.wishlist.size, event_category: 'engagement' });
  }
}

function closeWishlistModal() {
  const modal = document.getElementById('wishlistModal');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  document.body.style.overflow = '';
}

// ============ 篩選功能 ============
function setFilter(type, value) {
  if (type === 'category') {
    state.selectedCategory = value;
    try {
      localStorage.setItem(STORAGE_KEYS.category, value);
    } catch {}
    
    // GA4 追蹤
    if (typeof gtag !== 'undefined' && value !== 'all') {
      gtag('event', 'filter_category', {
        'category': value,
        'event_category': 'engagement'
      });
    }
  } else if (type === 'country') {
    state.selectedCountry = value;
    try {
      localStorage.setItem(STORAGE_KEYS.country, value);
    } catch {}
    
    // GA4 追蹤
    if (typeof gtag !== 'undefined' && value !== 'all') {
      gtag('event', 'filter_country', {
        'country': value,
        'event_category': 'engagement'
      });
    }
  }
  updateFilterStatus();
  renderFilters();
  renderContent();
}

// ===== 新增篩選狀態管理函數 =====
function updateFilterStatus() {
  state.hasActiveFilters = 
    state.selectedCategory !== 'all' || 
    state.selectedCountry !== 'all' ||
    state.searchTerm.trim() !== '';
}

function clearAllFilters() {
  state.selectedCategory = 'all';
  state.selectedCountry = 'all';
  state.searchTerm = '';
  
  try {
    localStorage.removeItem(STORAGE_KEYS.category);
    localStorage.removeItem(STORAGE_KEYS.country);
    localStorage.removeItem(STORAGE_KEYS.search);
  } catch {}
  
  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.value = '';
  
  const clearBtn = document.getElementById('clearBtn');
  if (clearBtn) clearBtn.classList.add('hidden');
  
  if (typeof gtag !== 'undefined') {
    gtag('event', 'clear_filters', {
      'event_category': 'engagement'
    });
  }
  
  updateFilterStatus();
  renderFilters();
  renderContent();
}

function getFilterCounts() {
  const filtered = state.groups.filter(g => {
    const okExpired = state.showExpired || !utils.isExpired(g.endDate);
    return okExpired;
  });
  
  const categoryCounts = { all: filtered.length };
  const countryCounts = { all: filtered.length };
  
  filtered.forEach(g => {
    // 處理複選分類（一個商品可能屬於多個分類）
    if (g.itemCategory && g.itemCategory.trim()) {
      const categories = g.itemCategory.split(/[,，]/).map(c => c.trim()).filter(c => c);
      categories.forEach(cat => {
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      });
    }
    
    // 處理複選國家（一個商品可能屬於多個國家）
    if (g.itemCountry && g.itemCountry.trim()) {
      const countries = g.itemCountry.split(/[,，]/).map(c => c.trim()).filter(c => c);
      countries.forEach(country => {
        countryCounts[country] = (countryCounts[country] || 0) + 1;
      });
    }
  });
  
  return { categoryCounts, countryCounts };
}

function renderFilters() {
  const { categoryCounts, countryCounts } = getFilterCounts();
  
  // 手機版篩選按鈕
  renderMobileFilters(categoryCounts, countryCounts);
  
  // 桌面版側邊欄
  renderDesktopFilters(categoryCounts, countryCounts);
}

function renderMobileFilters(categoryCounts, countryCounts) {
  // 分類篩選 - 全部顯示在滑動容器中
  elements.categoryFilters.innerHTML = `
    <button onclick="setFilter('category', 'all')" 
            class="px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap ${state.selectedCategory === 'all' ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-700'}">
      全部 (${categoryCounts.all || 0})
    </button>
  ` + state.availableCategories.map(cat => `
    <button onclick="setFilter('category', '${cat}')" 
            class="px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap ${
              state.selectedCategory === cat ? 'bg-amber-600 text-white' : utils.getCategoryColor(cat)
            }">
      ${cat} ${categoryCounts[cat] ? `(${categoryCounts[cat]})` : ''}
    </button>
  `).join('');
  
  // 國家篩選 - 全部顯示在滑動容器中
  elements.countryFilters.innerHTML = `
    <button onclick="setFilter('country', 'all')" 
            class="px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap ${state.selectedCountry === 'all' ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-700'}">
      全部 (${countryCounts.all || 0})
    </button>
  ` + state.availableCountries.map(country => `
    <button onclick="setFilter('country', '${country}')" 
            class="px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap ${
              state.selectedCountry === country ? 'bg-amber-600 text-white' : 'bg-blue-100 text-blue-700 border-blue-300'
            }">
      ${utils.getCountryFlag(country)} ${country} ${countryCounts[country] ? `(${countryCounts[country]})` : ''}
    </button>
  `).join('');
}

function renderDesktopFilters(categoryCounts, countryCounts) {
  // 桌面版分類
  elements.desktopCategoryFilters.innerHTML = `
    <button onclick="setFilter('category', 'all')" 
            class="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              state.selectedCategory === 'all' ? 'bg-amber-600 text-white font-medium' : 'hover:bg-gray-100 text-gray-700'
            }">
      全部 (${categoryCounts.all || 0})
    </button>
  ` + state.availableCategories.map(cat => `
    <button onclick="setFilter('category', '${cat}')" 
            class="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              state.selectedCategory === cat ? 'bg-amber-600 text-white font-medium' : 'hover:bg-gray-100'
            }">
      ${cat} ${categoryCounts[cat] ? `(${categoryCounts[cat]})` : ''}
    </button>
  `).join('');
  
  // 桌面版國家
  elements.desktopCountryFilters.innerHTML = `
    <button onclick="setFilter('country', 'all')" 
            class="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              state.selectedCountry === 'all' ? 'bg-amber-600 text-white font-medium' : 'hover:bg-gray-100 text-gray-700'
            }">
      全部 (${countryCounts.all || 0})
    </button>
  ` + state.availableCountries.map(country => `
    <button onclick="setFilter('country', '${country}')" 
            class="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              state.selectedCountry === country ? 'bg-amber-600 text-white font-medium' : 'hover:bg-gray-100 text-blue-700'
            }">
      ${utils.getCountryFlag(country)} ${country} ${countryCounts[country] ? `(${countryCounts[country]})` : ''}
    </button>
  `).join('');
}

// ===== 新增倒數計時功能 =====

function getTodayDeadlines() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return state.groups.filter(g => {
    if (!g.endDate) return false;
    const endDate = utils.parseDateSafe(g.endDate);
    if (!endDate) return false;
    return endDate >= today && endDate < tomorrow;
  }).map(g => g.brand || g.productName || '未命名');
}

function formatTimeRemaining() {
  const now = new Date();
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);
  
  const diff = endOfDay - now;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// 把單一數字渲染成可旋轉的 digit-cell（包 0-9 stack，初始 transform 直接帶到位）
function buildDigitStack(digit) {
  const digits = '0123456789'.split('').map(d => `<span>${d}</span>`).join('');
  return `<span class="digit-cell"><span class="digit-stack" style="transform:translateY(-${digit}em);">${digits}</span></span>`;
}

// 把 "05:03:32" 這種字串轉成 digit-cell 結構（: 用 .cd-sep）
function buildCountdownDigits(timeStr) {
  return [...timeStr].map(ch =>
    (ch >= '0' && ch <= '9') ? buildDigitStack(parseInt(ch, 10)) : `<span class="cd-sep">${ch}</span>`
  ).join('');
}

// 每秒更新時，只動 transform 不重建 DOM → 觸發 CSS spring 動畫
function setCountdownDigits(timeStr) {
  const root = document.getElementById('countdownDigits');
  if (!root) return;
  const cells = root.querySelectorAll('.digit-cell .digit-stack');
  let idx = 0;
  for (const ch of timeStr) {
    if (ch >= '0' && ch <= '9' && idx < cells.length) {
      cells[idx].style.transform = `translateY(-${parseInt(ch, 10)}em)`;
      idx++;
    }
  }
}

function renderTodayCountdown() {
  const deadlines = getTodayDeadlines();
  if (deadlines.length === 0) return '';

  const timeLeft = formatTimeRemaining();
  const chips = deadlines.slice(0, 4).map(b => {
    const safe = b.replace(/'/g, "\\'");
    return `<button class="countdown-chip" onclick="scrollToCard('${safe}')">${b}</button>`;
  }).join('');
  const more = deadlines.length > 4 ? `<span class="countdown-more">+${deadlines.length - 4}</span>` : '';

  return `
    <div id="todayCountdown" class="countdown-banner" role="region" aria-label="今日截止倒數">
      <span class="countdown-time" id="countdownDigits" aria-label="剩餘 ${timeLeft}">${buildCountdownDigits(timeLeft)}</span>
      <div class="countdown-chips">${chips}${more}</div>
    </div>
  `;
}

// 點品牌 chip → scroll 到該卡片並高亮
function scrollToCard(brand) {
  if (!brand) return;
  const el = document.querySelector(`[data-brand="${CSS.escape(brand)}"]`);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el.classList.add('card-highlighted');
  setTimeout(() => el.classList.remove('card-highlighted'), 2500);
}

let countdownInterval = null;

function startCountdownTimer() {
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }
  
  countdownInterval = setInterval(() => {
    const countdownEl = document.getElementById('todayCountdown');
    if (countdownEl && getTodayDeadlines().length > 0) {
      // 用 transform 動畫更新數字（CSS spring 自動產生旋轉感），不再重建 DOM
      setCountdownDigits(formatTimeRemaining());
    } else if (countdownEl) {
      countdownEl.remove();
      clearInterval(countdownInterval);
    }
  }, 1000); // 每秒更新
}


// ============ Banner 渲染 ============
function renderBanner() {
  if (!CONFIG.BANNER_IMAGE_URL) {
    elements.bannerSlot.innerHTML = "";
    elements.bannerSlot.classList.add('hidden');
    return;
  }
  let inner = `<img src="${CONFIG.BANNER_IMAGE_URL}" alt="banner" class="w-full max-h-56 object-cover rounded-xl border-2 border-amber-200 shadow-sm">`;
  if (CONFIG.BANNER_LINK_URL) {
    inner = `<a href="${CONFIG.BANNER_LINK_URL}" target="_blank" rel="noopener noreferrer">${inner}</a>`;
  }
  elements.bannerSlot.innerHTML = inner;
  elements.bannerSlot.classList.remove('hidden');
}

// ============ 影片處理 ============
const videoHandler = {
  loadedScripts: new Set(),

  addScriptOnce(id, src, onload) {
    if (this.loadedScripts.has(id)) {
      onload && onload();
      return;
    }
    const s = document.createElement('script');
    s.id = id;
    s.src = src;
    s.async = true;
    s.onload = () => {
      this.loadedScripts.add(id);
      onload && onload();
    };
    document.head.appendChild(s);
  },

  ensureFbRoot() {
    if (!document.getElementById('fb-root')) {
      const root = document.createElement('div');
      root.id = 'fb-root';
      document.body.appendChild(root);
    }
  },

  getRatioHint(url) {
    try {
      const u = new URL(url);
      const hash = (u.hash || '').toLowerCase();
      const qp = (u.searchParams.get('ratio') || '').toLowerCase();
      if (hash.includes('portrait') || qp === '9:16') return '9/16';
      if (hash.includes('landscape') || qp === '16:9') return '16/9';
    } catch {}
    return null;
  },

  buildVideoEmbed(url) {
    if (!url) return null;
    try {
      const u = new URL(url);
      const host = u.hostname.toLowerCase();

      if (host.includes('drive.google.com')) {
        const m = url.match(/[-\w]{25,}/);
        if (!m) return null;
        return {
          html: `<iframe src="https://drive.google.com/file/d/${m[0]}/preview" class="w-full h-full" frameborder="0" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`,
          ratio: this.getRatioHint(url) || '16/9'
        };
      }

      if (host.includes('youtube.com') || host.includes('youtu.be')) {
        const id = (url.match(/youtu\.be\/([^?&/]+)/) || url.match(/[?&]v=([^?&/]+)/) || url.match(/shorts\/([^?&/]+)/) || [])[1];
        if (!id) return null;
        return {
          html: `<iframe src="https://www.youtube.com/embed/${id}?playsinline=1" class="w-full h-full" frameborder="0" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`,
          ratio: this.getRatioHint(url) || '9/16'
        };
      }

      if (host.includes('instagram.com')) {
        const clean = u.origin + u.pathname.replace(/\/?$/, '/');
        return {
          html: `<blockquote class="instagram-media" data-instgrm-permalink="${clean}" data-instgrm-version="14" style="margin:0 auto; max-width:540px; width:100%"></blockquote>`,
          ratio: '9/16',
          after: () => this.addScriptOnce('ig-embed-js', 'https://www.instagram.com/embed.js', () => {
            window.instgrm?.Embeds?.process();
          })
        };
      }

      if (host.includes('facebook.com') || host === 'fb.watch') {
        const isVideo = /\/watch\/|\/video|\/videos|fb\.watch/.test(url);
        return {
          html: isVideo ? `<div class="fb-video" data-href="${url}" data-allowfullscreen="true" data-width="auto"></div>` 
                        : `<div class="fb-post" data-href="${url}" data-width="auto"></div>`,
          ratio: null,
          after: () => {
            this.ensureFbRoot();
            this.addScriptOnce('fb-embed-js', 'https://connect.facebook.net/zh_TW/sdk.js#xfbml=1&version=v19.0', () => {
              window.FB?.XFBML?.parse?.(elements.videoContainer);
            });
          }
        };
      }
    } catch {}
    return null;
  }
};

// ===== Scroll-spy：捲到哪個 section，對應 nav 按鈕加 .active highlight =====
let scrollSpyObserver = null;
function initScrollSpy() {
  if (scrollSpyObserver) scrollSpyObserver.disconnect();

  const sections = document.querySelectorAll('#content section[id]');
  if (!sections.length) return;

  scrollSpyObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        document.querySelectorAll('.section-nav-btn').forEach(b => {
          b.classList.toggle('active', b.dataset.target === id);
        });
      }
    });
  }, {
    // 只看畫面上方 25%-35% 的「鎖定線」，section 的標題剛好在這條線上時觸發
    rootMargin: '-25% 0px -65% 0px',
    threshold: 0
  });

  sections.forEach(s => scrollSpyObserver.observe(s));
}

// ===== 區塊導航 toggle（手機版收合）=====
function initSectionNav() {
  const toggle = document.getElementById('navToggle');
  const buttons = document.getElementById('sectionButtons');
  if (!toggle || !buttons) return;

  const stopHint = () => toggle.classList.remove('hint');

  toggle.addEventListener('click', () => {
    const expanded = buttons.classList.toggle('expanded');
    toggle.classList.toggle('expanded', expanded);
    toggle.setAttribute('aria-expanded', String(expanded));
    stopHint();
  });

  // 點 nav 按鈕後 250ms 自動收回（給時間先捲動到位）
  buttons.addEventListener('click', (e) => {
    if (!e.target.closest('.section-nav-btn')) return;
    setTimeout(() => {
      buttons.classList.remove('expanded');
      toggle.classList.remove('expanded');
      toggle.setAttribute('aria-expanded', 'false');
    }, 250);
    stopHint();
  });

  // 載入時 6 秒抖動提示「箭頭可點」
  toggle.classList.add('hint');
  setTimeout(stopHint, 6000);
  window.addEventListener('scroll', stopHint, { once: true, passive: true });
}

// ===== 新增 Sticky Header 功能 =====
let lastScrollTop = 0;
let isHeaderCompact = false;

function initStickyHeader() {
  const header = document.querySelector('header');
  if (!header) return;

  let scrollPending = false;

  window.addEventListener('scroll', () => {
    if (scrollPending) return;       // rAF 節流：每 frame 最多跑一次
    scrollPending = true;
    requestAnimationFrame(() => {
      scrollPending = false;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

      // 網格展開時不切 compact，避免 header 高度動態變化跟 scroll 互踢造成抖動
      const navExpanded = document.getElementById('sectionButtons')?.classList.contains('expanded');
      if (navExpanded) {
        lastScrollTop = scrollTop;
        return;
      }

      // 5px 閾值：忽略 layout reflow 導致的微小 scroll 變化
      if (Math.abs(scrollTop - lastScrollTop) < 5) return;

      // 向下滾動且超過100px時,壓縮header
      if (scrollTop > 100 && scrollTop > lastScrollTop && !isHeaderCompact) {
        header.classList.add('header-compact');
        isHeaderCompact = true;
      }
      // 向上滾動或回到頂部時,展開header
      else if ((scrollTop < lastScrollTop || scrollTop < 50) && isHeaderCompact) {
        header.classList.remove('header-compact');
        isHeaderCompact = false;
      }

      lastScrollTop = scrollTop;
    });
  }, { passive: true });
}

// ============ 全局函數（供 HTML 調用）============
function scrollToSection(sectionId) {
  const el = document.getElementById(sectionId);
  if (!el) return;
  const header = document.querySelector('header');
  const headerH = header ? header.getBoundingClientRect().height : 0;
  const top = Math.max(0, el.getBoundingClientRect().top + window.pageYOffset - headerH - 8);
  window.scrollTo({ top, behavior: 'smooth' });
}

function openVideoModal(event, videoUrl) {
  event.stopPropagation();
  
  if (typeof gtag !== 'undefined') {
    gtag('event', 'watch_video', {
      'video_url': videoUrl,
      'event_category': 'engagement',
      'event_label': videoUrl
    });
  }
  
  try {
    const host = new URL(videoUrl).hostname.toLowerCase();
    if (host.includes('youtube.com') || host.includes('youtu.be') || host.includes('drive.google.com')) {
      window.open(videoUrl, '_blank', 'noopener,noreferrer');
      return;
    }
  } catch {
    window.open(videoUrl, '_blank', 'noopener,noreferrer');
    return;
  }

  const embed = videoHandler.buildVideoEmbed(videoUrl);
  if (!embed) {
    window.open(videoUrl, '_blank', 'noopener,noreferrer');
    return;
  }

  elements.videoContainer.className = 'w-full flex justify-center items-center p-0';
  elements.videoContainer.style.removeProperty('aspect-ratio');

  const isPortrait = embed.ratio === '9/16';
  const wrapperClasses = isPortrait ? 'w-full mx-auto max-w-[560px] md:max-w-[640px]' : 'w-full mx-auto';

  if (embed.ratio && !isPortrait) {
    elements.videoContainer.style.aspectRatio = embed.ratio;
  }

  elements.videoContainer.innerHTML = `<div class="${wrapperClasses}">${embed.html}</div>`;
  elements.videoModal.classList.remove('hidden');
  elements.videoModal.classList.add('flex');

  embed.after?.();
}

function closeVideoModal() {
  elements.videoModal.classList.add('hidden');
  elements.videoModal.classList.remove('flex');
  elements.videoContainer.innerHTML = '';
}

// ============ Blog Modal (Google Docs 介紹彈窗) ============
function openBlogModal(event, googleDocUrl, brand, groupUrl) {
  if (event) event.stopPropagation();

  // 偵測 iOS PWA 獨立模式（從主畫面開啟）
  // iOS standalone 模式下，跨域 iframe（如 Google Docs）會被阻擋
  const isStandalone = window.navigator.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches;

  // 處理 Google Docs URL，確保是發布格式
  let embedUrl = googleDocUrl;
  if (googleDocUrl.includes('docs.google.com/document')) {
    if (!googleDocUrl.includes('/pub')) {
      const match = googleDocUrl.match(/\/d\/([^\/]+)/);
      if (match) {
        embedUrl = `https://docs.google.com/document/d/${match[1]}/pub`;
      }
    }
  }

  // GA4 追蹤
  if (typeof gtag !== 'undefined') {
    gtag('event', 'open_blog_modal', {
      group_name: brand || '',
      event_category: 'engagement',
      event_label: brand || ''
    });
  }

  // PWA 獨立模式：直接用 Safari 開啟，避免 iframe 跨域限制
  if (isStandalone) {
    window.open(embedUrl, '_blank');
    return;
  }

  const modal = document.getElementById('blogModal');
  const iframe = document.getElementById('blogIframe');
  const spinner = document.getElementById('blogLoadingSpinner');
  const title = document.getElementById('blogModalTitle');
  const ctaBtn = document.getElementById('blogModalCTA');

  if (!modal || !iframe) return;

  // 設定標題和購買連結
  title.textContent = brand ? `${brand} - 產品介紹` : '產品介紹';
  if (ctaBtn && groupUrl) {
    ctaBtn.href = groupUrl;
    ctaBtn.onclick = function() {
      if (typeof gtag !== 'undefined') {
        gtag('event', 'click_group_from_blog', {
          group_name: brand || '',
          event_category: 'conversion',
          event_label: brand || ''
        });
      }
    };
  }

  // 加上 embedded=true 給 iframe 用
  let iframeUrl = embedUrl + (embedUrl.includes('?') ? '&' : '?') + 'embedded=true';

  // 顯示 loading
  spinner.classList.remove('hidden');

  // 設定 iframe
  iframe.src = iframeUrl;
  iframe.onload = function() {
    spinner.classList.add('hidden');
  };

  // 顯示 modal
  modal.classList.remove('hidden');
  modal.classList.add('flex');

  // 禁止背景滾動
  document.body.style.overflow = 'hidden';
}

function closeBlogModal() {
  const modal = document.getElementById('blogModal');
  const iframe = document.getElementById('blogIframe');

  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }

  if (iframe) {
    iframe.src = '';
  }

  // 恢復背景滾動
  document.body.style.overflow = '';
}

// ESC 鍵關閉 Blog Modal
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    const blogModal = document.getElementById('blogModal');
    if (blogModal && !blogModal.classList.contains('hidden')) {
      closeBlogModal();
    }
  }
});

function copyCoupon(ev, txt) {
  ev.stopPropagation();
  
  if (typeof gtag !== 'undefined') {
    gtag('event', 'copy_coupon', {
      'coupon_code': txt,
      'event_category': 'engagement',
      'event_label': txt
    });
  }
  
  navigator.clipboard.writeText(txt).then(() => {
    elements.copyToast.style.opacity = '1';
    elements.copyToast.style.transform = 'translateX(0)';
    setTimeout(() => {
      elements.copyToast.style.opacity = '0';
      elements.copyToast.style.transform = 'translateX(200%)';
    }, 1600);
  }).catch(() => alert('複製失敗，請手動複製：' + txt));
}

function openNote(ev, url) {
  ev.stopPropagation();
  window.open(url, '_blank');
}

// ============ 行事曆按鈕功能 ============
function addToCalendar(event, title, date, url, description) {
  event.stopPropagation();
  
  if (typeof gtag !== 'undefined') {
    gtag('event', 'add_to_calendar', {
      'group_name': title,
      'event_category': 'engagement',
      'event_label': title
    });
  }
  
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  
  if (isSafari && isIOS) {
    showCalendarChoice(title, date, url, description, false);
  } else {
    addToGoogleCalendar(title, date, url, description);
  }
}

function showCalendarChoice(title, date, url, description, isBoth, brand, startDate, endDate) {
  const modal = `
    <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onclick="this.remove()">
      <div class="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl" onclick="event.stopPropagation()">
        <h3 class="text-lg font-bold text-gray-900 mb-4 text-center">選擇行事曆</h3>
        ${isBoth ? '<p class="text-sm text-gray-600 mb-4 text-center">將加入開團和截止兩個提醒</p>' : ''}
        <div class="space-y-3">
          <button onclick="${isBoth ? `addBothToGoogleCalendar('${brand.replace(/'/g, "\\'")}', '${startDate}', '${endDate}', '${url}')` : `addToGoogleCalendar('${title.replace(/'/g, "\\'")}', '${date}', '${url}', '${description.replace(/'/g, "\\'")}')` }; this.closest('.fixed').remove();" 
                  class="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google 日曆
          </button>
          
          <button onclick="${isBoth ? `addBothToAppleCalendar('${brand.replace(/'/g, "\\'")}', '${startDate}', '${endDate}', '${url}')` : `addToAppleCalendar('${title.replace(/'/g, "\\'")}', '${date}', '${url}', '${description.replace(/'/g, "\\'")}')` }; this.closest('.fixed').remove();" 
                  class="w-full bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
            iOS 日曆
          </button>
          
          <button onclick="this.closest('.fixed').remove()" 
                  class="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors">
            取消
          </button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modal);
}

// 行事曆事件預設時間：早上 08:00，持續 1 小時（最容易讓使用者實際打開購物的時段）
function formatCalendarTimes(dateStr, hour = 8, durationHours = 1) {
  if (!dateStr) return null;
  const d = utils.parseDateSafe(dateStr);
  if (!d) return null;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const sh = String(hour).padStart(2, '0');
  const eh = String(hour + durationHours).padStart(2, '0');
  return {
    start: `${year}${month}${day}T${sh}0000`,
    end:   `${year}${month}${day}T${eh}0000`
  };
}

function addToGoogleCalendar(title, date, url, description) {
  const t = formatCalendarTimes(date);
  if (!t) return;

  let desc = description || '🛒 鷹家Fun生買物社團購';
  if (url) {
    desc += `\n\n🔗 團購連結：${url}`;
  }

  const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${t.start}/${t.end}&details=${encodeURIComponent(desc)}&trp=false`;

  window.open(calendarUrl, '_blank', 'noopener,noreferrer');
}

function addToAppleCalendar(title, date, url, description) {
  const t = formatCalendarTimes(date);
  if (!t) return;

  let desc = description || '🛒 鷹家Fun生買物社團購';
  if (url) {
    desc += '\\n\\n🔗 團購連結：' + url;
  }

  const icalContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//鷹家Fun生買物社//NONSGML Event//EN',
    'BEGIN:VEVENT',
    `UID:${Date.now()}-${Math.random().toString(36).substr(2, 9)}@eaglish.store`,
    `DTSTAMP:${t.start}`,
    `DTSTART:${t.start}`,
    `DTEND:${t.end}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${desc}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'BEGIN:VALARM',
    'TRIGGER:-PT24H',
    'ACTION:DISPLAY',
    'DESCRIPTION:明天就要截止了！',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
  
  const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function addBothToCalendar(event, brand, startDate, endDate, url) {
  event.stopPropagation();
  
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  
  if (isSafari && isIOS) {
    showCalendarChoice('', '', url, '', true, brand, startDate, endDate);
  } else {
    addBothToGoogleCalendar(brand, startDate, endDate, url);
  }
}

function addBothToGoogleCalendar(brand, startDate, endDate, url) {
  addToGoogleCalendar(`${brand} - 開團`, startDate, url, '🎉 團購開始！');
  setTimeout(() => {
    addToGoogleCalendar(`${brand} - 截止`, endDate, url, '⏰ 今天是最後一天！記得下單');
  }, 500);
}

// 把全部仍未截止的短期團購打包成 ics 字串 + Blob，回傳 { blob, count } 或 null
function _buildAllGroupsIcs() {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const upcoming = (state.groups || []).filter(g =>
    g && g.category !== '長期' && g.endDate && !utils.isExpired(g.endDate)
  );

  if (upcoming.length === 0) return null;

  const events = [];
  upcoming.forEach((g, idx) => {
    const brand = g.brand || g.productName || '團購';
    const url = g.url || '';
    const st = utils.parseDateSafe(g.startDate);
    const en = utils.parseDateSafe(g.endDate);
    const stamp = `${today.getFullYear()}${String(today.getMonth()+1).padStart(2,'0')}${String(today.getDate()).padStart(2,'0')}T080000`;

    // 開團（若有 startDate 且尚未過期；過期就略過避免行事曆塞舊事件）
    if (st && st >= today) {
      const t = formatCalendarTimes(g.startDate);
      if (t) {
        events.push([
          'BEGIN:VEVENT',
          `UID:eaglish-start-${idx}-${Date.now()}@eaglish.store`,
          `DTSTAMP:${stamp}`,
          `DTSTART:${t.start}`,
          `DTEND:${t.end}`,
          `SUMMARY:🎉 ${brand} 開團`,
          `DESCRIPTION:團購開始！${url ? '\\n\\n🔗 連結：' + url : ''}`,
          'STATUS:CONFIRMED',
          'END:VEVENT'
        ].join('\r\n'));
      }
    }

    // 截止
    if (en) {
      const t = formatCalendarTimes(g.endDate);
      if (t) {
        events.push([
          'BEGIN:VEVENT',
          `UID:eaglish-end-${idx}-${Date.now()}@eaglish.store`,
          `DTSTAMP:${stamp}`,
          `DTSTART:${t.start}`,
          `DTEND:${t.end}`,
          `SUMMARY:⏰ ${brand} 截止`,
          `DESCRIPTION:今天是最後一天，記得下單！${url ? '\\n\\n🔗 連結：' + url : ''}`,
          'STATUS:CONFIRMED',
          'BEGIN:VALARM',
          'TRIGGER:-PT24H',
          'ACTION:DISPLAY',
          'DESCRIPTION:明天就要截止了！',
          'END:VALARM',
          'END:VEVENT'
        ].join('\r\n'));
      }
    }
  });

  if (events.length === 0) return null;

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//鷹家Fun生買物社//全部開團//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:鷹家全部開團',
    ...events,
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  return { blob, count: events.length };
}

function _downloadIcsBlob(blob, filename) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

// 只在 Apple Safari（iOS / macOS）露出「訂閱全部開團」按鈕：.ics 在這兩個環境直通 Apple Calendar，
// 其他瀏覽器沒有乾淨的 batch 路徑，留按鈕只會讓人困惑
function _isAppleSafari() {
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
  return isSafari && (isIOS || /Macintosh/.test(ua));
}

function subscribeAllGroups() {
  const built = _buildAllGroupsIcs();
  if (!built) {
    alert('目前沒有未截止的限時團購可訂閱');
    return;
  }
  _downloadIcsBlob(built.blob, 'eaglish_全部開團.ics');
  if (typeof gtag !== 'undefined') {
    gtag('event', 'subscribe_all_calendar', { event_category: 'engagement', value: built.count });
  }
}

function addBothToAppleCalendar(brand, startDate, endDate, url) {
  const startT = formatCalendarTimes(startDate);
  const endT   = formatCalendarTimes(endDate);
  if (!startT || !endT) return;

  const icalContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//鷹家Fun生買物社//NONSGML Event//EN',
    'BEGIN:VEVENT',
    `UID:${Date.now()}-start@eaglish.store`,
    `DTSTAMP:${startT.start}`,
    `DTSTART:${startT.start}`,
    `DTEND:${startT.end}`,
    `SUMMARY:${brand} - 開團`,
    `DESCRIPTION:🎉 團購開始！\\n\\n🔗 團購連結：${url || ''}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'BEGIN:VEVENT',
    `UID:${Date.now()}-end@eaglish.store`,
    `DTSTAMP:${endT.start}`,
    `DTSTART:${endT.start}`,
    `DTEND:${endT.end}`,
    `SUMMARY:${brand} - 截止`,
    `DESCRIPTION:⏰ 今天是最後一天！記得下單\\n\\n🔗 團購連結：${url || ''}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT24H',
    'ACTION:DISPLAY',
    'DESCRIPTION:明天就要截止了！',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
  
  const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${brand.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}_團購.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ============ 行事曆相關 ============
function showDayGroups(day) {
  const { currentMonth, currentYear, groupsByDateEnd, groupsByDateStart } = getCalendarData(state.selectedCalendarMonth);
  const endList = groupsByDateEnd[day] || [];
  const startList = groupsByDateStart[day] || [];

  const card = g => `
    <div class="bg-amber-50 border-2 border-amber-200 rounded-lg p-3 mb-2">
      <div class="font-bold text-amber-900 text-center">${g.brand || ''}</div>
      ${g.productName ? `<div class="text-sm text-gray-600 text-center mt-1">${g.productName}</div>` : ''}
      ${g.url ? `<a href="${g.url}" target="_blank" rel="noopener noreferrer" class="block w-full mt-2 bg-amber-600 text-white px-3 py-2 rounded text-sm text-center hover:bg-amber-700">前往團購</a>` : ''}
    </div>`;

  const modal = `
    <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onclick="this.remove()">
      <div class="bg-white rounded-xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto" onclick="event.stopPropagation()">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xl font-bold text-amber-900">${currentYear}年 ${currentMonth + 1}月 ${day}日</h3>
          <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700 text-2xl">×</button>
        </div>
        ${startList.length ? `<h4 class="font-bold text-teal-700 mb-2">當日開團（${startList.length}）</h4>${startList.map(card).join('')}` : ''}
        ${endList.length ? `<h4 class="font-bold text-red-700 mt-4 mb-2">當日截止（${endList.length}）</h4>${endList.map(card).join('')}` : ''}
      </div>
    </div>`;
  document.body.insertAdjacentHTML('beforeend', modal);
}

function toggleExpired() {
  state.showExpired = !state.showExpired;
  try {
    localStorage.setItem(STORAGE_KEYS.showExpired, String(state.showExpired));
  } catch {}
  renderFilters();
  renderContent();
}

function switchCalendarMonth(m) {
  state.selectedCalendarMonth = m;
  try {
    localStorage.setItem(STORAGE_KEYS.month, String(m));
  } catch {}
  renderContent();
}

function getCalendarData(monthOffset = 0) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const curM = target.getMonth();
  const curY = target.getFullYear();

  const byEnd = {};
  const byStart = {};

  state.groups.forEach(g => {
    const end = utils.parseDateSafe(g.endDate);
    if (end && end.getMonth() === curM && end.getFullYear() === curY) {
      const d = end.getDate();
      (byEnd[d] || (byEnd[d] = [])).push(g);
    }
  });

  state.groups.forEach(g => {
    const st = utils.parseDateSafe(g.startDate);
    if (st && st >= today && st.getMonth() === curM && st.getFullYear() === curY) {
      const d = st.getDate();
      (byStart[d] || (byStart[d] = [])).push(g);
    }
  });

  state.upcomingGroups.forEach((ug, i) => {
    const ust = utils.parseDateSafe(ug.startDate);
    if (ust && ust >= today && ust.getMonth() === curM && ust.getFullYear() === curY) {
      const d = ust.getDate();
      (byStart[d] || (byStart[d] = [])).push({ id: 'u-' + i, brand: ug.brand, url: '' });
    }
  });

  return { currentMonth: curM, currentYear: curY, groupsByDateEnd: byEnd, groupsByDateStart: byStart };
}

function renderCalendar() {
  const cal = getCalendarData(state.selectedCalendarMonth);
  const { currentMonth: curM, currentYear: curY, groupsByDateEnd: byEnd, groupsByDateStart: byStart } = cal;

  const days = new Date(curY, curM + 1, 0).getDate();
  const first = new Date(curY, curM, 1).getDay();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isThisMonth = curM === today.getMonth() && curY === today.getFullYear();

  let html = '<div class="grid grid-cols-7 gap-2 select-none">';
  ['日', '一', '二', '三', '四', '五', '六'].forEach(n => {
    html += `<div class="text-center font-bold text-amber-900 py-2">${n}</div>`;
  });

  for (let i = 0; i < first; i++) html += '<div></div>';

  for (let d = 1; d <= days; d++) {
    const endList = byEnd[d] || [];
    const startList = byStart[d] || [];
    const hasEnd = endList.length > 0;
    const hasStart = startList.length > 0;

    const isToday = isThisMonth && d === today.getDate();
    const isPast = isThisMonth ? d < today.getDate() : state.selectedCalendarMonth < 0;

    let bg = 'bg-white';
    let text = 'text-gray-900';
    let border = 'border-amber-200';

    if (isPast) {
      bg = 'bg-gray-100';
      text = 'text-gray-400';
    } else if (isToday) {
      bg = 'bg-yellow-300';
      text = 'text-blue-900 font-bold';
      border = 'border-black-800';
    } else if (hasEnd) {
      const left = Math.ceil((new Date(curY, curM, d) - today) / 86400000);
      if (left <= 3) {
        bg = 'bg-red-100 hover:bg-red-200';
        text = 'text-red-700 font-semibold';
        border = 'border-red-200';
      } else if (left <= 7) {
        bg = 'bg-orange-100 hover:bg-orange-200';
        text = 'text-orange-700 font-semibold';
        border = 'border-orange-200';
      } else {
        bg = 'bg-amber-100 hover:bg-amber-200';
        text = 'text-amber-700';
        border = 'border-amber-300';
      }
    } else if (hasStart) {
      bg = 'bg-teal-100 hover:bg-teal-200';
      text = 'text-teal-700 font-semibold';
      border = 'border-teal-200';
    }

    const clickable = hasEnd || hasStart ? `onclick="showDayGroups(${d})"` : '';
    html += `
      <div class="${bg} ${text} rounded-lg p-2 text-center border-2 ${border} ${clickable ? 'cursor-pointer transition-colors' : ''}" ${clickable}>
        <div class="text-sm">${d}</div>
        ${hasEnd || hasStart ? `
          <div class="mt-1 flex items-center justify-center gap-1">
            ${hasEnd ? `<span class="text-[10px] leading-none px-1.5 py-0.5 rounded bg-white/80 border border-red-300 text-red-700 min-w-[1.1rem] text-center">${utils.formatCount(endList.length)}</span>` : ''}
            ${hasStart ? `<span class="text-[10px] leading-none px-1.5 py-0.5 rounded bg-white/80 border border-teal-300 text-teal-700 min-w-[1.1rem] text-center">${utils.formatCount(startList.length)}</span>` : ''}
          </div>` : ''}
      </div>`;
  }
  html += '</div>';
  return html;
}

function renderMonthlyGroupList() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const target = new Date(today.getFullYear(), today.getMonth() + state.selectedCalendarMonth, 1);
  const curM = target.getMonth();
  const curY = target.getFullYear();
  const monthName = `${curY}年${curM + 1}月`;

  const monthlyGroups = [];

  state.groups.forEach(g => {
    const st = utils.parseDateSafe(g.startDate);
    if (st && st.getMonth() === curM && st.getFullYear() === curY) {
      const isExpired = utils.isExpired(g.endDate);
      monthlyGroups.push({
        brand: g.brand,
        startDate: g.startDate,
        endDate: g.endDate,
        url: g.url,
        image: g.image,
        isExpired: isExpired,
        isUpcoming: false
      });
    }
  });

  state.upcomingGroups.forEach(ug => {
    const st = utils.parseDateSafe(ug.startDate);
    if (st && st >= today && st.getMonth() === curM && st.getFullYear() === curY) {
      monthlyGroups.push({
        brand: ug.brand,
        startDate: ug.startDate,
        endDate: ug.endDate || '',
        url: '',
        image: ug.image || '',
        isExpired: false,
        isUpcoming: true
      });
    }
  });

  monthlyGroups.sort((a, b) => {
    const dateA = utils.parseDateSafe(a.startDate);
    const dateB = utils.parseDateSafe(b.startDate);
    if (!dateA) return 1;
    if (!dateB) return -1;
    return dateA - dateB;
  });

  if (monthlyGroups.length === 0) {
    return `
      <div class="mt-6 pt-6 border-t-2 border-gray-200">
        <div class="text-center py-6 text-gray-500">
          <p class="text-sm">📭 本月暫無開團項目</p>
        </div>
      </div>
    `;
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = utils.parseDateSafe(dateStr);
    if (!d) return dateStr;
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${curY}-${month}-${day}`;
  };

  const groupListHTML = monthlyGroups.map(g => {
    const startDateStr = formatDate(g.startDate);
    const endDateStr = formatDate(g.endDate);
    
    return `
      <div class="border-b border-gray-200 last:border-0">
        <div class="py-3 flex items-start gap-3 hover:bg-gray-50 rounded px-2 -mx-2 transition-colors">
          ${g.image ? `
            ${g.url ? `
              <a href="${g.url}" target="_blank" rel="noopener noreferrer"
                 onclick="event.stopPropagation(); try{ if (typeof gtag !== 'undefined') { gtag('event', 'image_click', { event_category: 'engagement', event_label: '${g.brand || ''}' }); } } catch (e) {}">
                <img src="${g.image}" alt="${g.brand || ''}" class="w-16 h-16 object-cover rounded-lg flex-shrink-0" loading="lazy">
              </a>
            ` : `
              <img src="${g.image}" alt="${g.brand || ''}" class="w-16 h-16 object-cover rounded-lg flex-shrink-0" loading="lazy">
            `}
          ` : ''}
          <div class="flex-1 min-w-0">
            <div class="flex items-start gap-2 mb-2">
              <div class="flex-1 min-w-0">
                <h4 class="font-medium ${g.isExpired ? 'text-gray-500' : 'text-gray-900'} text-sm break-words leading-relaxed">${g.brand}</h4>
                ${g.productName ? `<p class="text-xs ${g.isExpired ? 'text-gray-400' : 'text-gray-600'} mt-0.5">${g.productName}</p>` : ''}
              </div>
              ${g.isUpcoming ? '<span class="text-xs bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">即將開團</span>' : ''}
              ${g.isExpired ? '<span class="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">已結束</span>' : ''}
            </div>
            
            <div class="text-xs ${g.isExpired ? 'text-gray-400' : 'text-gray-600'} space-y-0.5">
              ${startDateStr ? `<div class="flex items-center gap-1"><span>📅</span><span>開團：${startDateStr}</span></div>` : ''}
              ${endDateStr ? `<div class="flex items-center gap-1"><span>⏰</span><span>截止：${endDateStr}</span></div>` : ''}
            </div>
          </div>
          
          <div class="flex flex-col gap-2 flex-shrink-0">
            ${g.url && !g.isUpcoming ? `
              <a href="${g.url}" 
                 target="_blank" 
                 rel="noopener noreferrer" 
                 onclick="event.stopPropagation()"
                 class="${g.isExpired ? 'bg-gray-400' : 'bg-teal-600 hover:bg-teal-700'} text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors text-center">
                前往
              </a>
            ` : ''}
            ${g.startDate && g.endDate && !g.isExpired ? `
              <button onclick="addBothToCalendar(event, '${g.brand.replace(/'/g, "\\'")}', '${g.startDate}', '${g.endDate}', '${g.url}')" 
                      class="bg-blue-50 border border-blue-300 text-blue-600 px-3 py-2 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors whitespace-nowrap">
                📅 行事曆
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="mt-6 pt-6 border-t-2 border-gray-200">
      <details class="group">
        <summary class="cursor-pointer list-none">
          <div class="flex items-center justify-between p-4 bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg border-2 border-teal-200 hover:border-teal-300 transition-colors">
            <div class="flex items-center gap-3">
              <span class="text-2xl">📋</span>
              <div>
                <h3 class="font-bold text-teal-900">${monthName} 即將開團總表</h3>
                <p class="text-xs text-teal-700 mt-0.5">共 ${monthlyGroups.length} 個團購項目</p>
              </div>
            </div>
            <svg class="w-6 h-6 text-teal-600 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </div>
        </summary>
        
        <div class="mt-4 bg-white rounded-lg border border-gray-200 p-4">
          <div class="space-y-2">
            ${groupListHTML}
          </div>
        </div>
      </details>
    </div>
  `;
}

// ============ 搜尋功能 ============
let isComposing = false;
let searchDebounce;

function applySearch(val) {
  state.searchTerm = val || '';
  
  if (state.searchTerm && typeof gtag !== 'undefined') {
    gtag('event', 'search', {
      'search_term': state.searchTerm,
      'event_category': 'engagement'
    });
  }
  
  try {
    localStorage.setItem(STORAGE_KEYS.search, state.searchTerm);
  } catch {}
  elements.clearBtn?.classList.toggle('hidden', state.searchTerm.length === 0);
  
  updateFilterStatus();
  renderContent();
}

function initSearch() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.search) || '';
    const savedShow = localStorage.getItem(STORAGE_KEYS.showExpired);
    const savedMonth = localStorage.getItem(STORAGE_KEYS.month);
    const savedCategory = localStorage.getItem(STORAGE_KEYS.category);
    const savedCountry = localStorage.getItem(STORAGE_KEYS.country);
    
    if (elements.searchInput && saved) {
      state.searchTerm = saved;
      elements.searchInput.value = saved;
      elements.clearBtn?.classList.remove('hidden');
    }
    if (savedShow != null) state.showExpired = savedShow === 'true';
    if (savedMonth != null) state.selectedCalendarMonth = parseInt(savedMonth, 10) || 0;
    if (savedCategory) state.selectedCategory = savedCategory;
    if (savedCountry) state.selectedCountry = savedCountry;
    // Wishlist
    const savedWishlist = localStorage.getItem(STORAGE_KEYS.wishlist);
    if (savedWishlist) {
      try {
        const arr = JSON.parse(savedWishlist);
        if (Array.isArray(arr)) state.wishlist = new Set(arr);
      } catch {}
    }
  } catch {}

  if (elements.searchInput) {
    elements.searchInput.addEventListener('compositionstart', () => isComposing = true);
    elements.searchInput.addEventListener('compositionend', e => {
      isComposing = false;
      applySearch(e.target.value);
    });
    elements.searchInput.addEventListener('input', e => {
      elements.clearBtn?.classList.toggle('hidden', e.target.value.length === 0);
      if (isComposing) return;
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(() => applySearch(e.target.value), CONFIG.SEARCH_DEBOUNCE);
    });
    elements.searchInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        applySearch(elements.searchInput.value);
      }
    });
  }

  elements.clearBtn?.addEventListener('click', () => {
    if (elements.searchInput) elements.searchInput.value = '';
    applySearch('');
    elements.searchInput?.focus();
  });
}

// ============ 資料載入 ============
function showError(msg) {
  state.error = msg;
  state.loading = false;
  elements.content.innerHTML = `
    <div class="flex items-center justify-center min-h-[40vh]">
      <div class="text-center">
        <div class="text-4xl mb-4">⚠️</div>
        <div class="text-xl text-red-600 font-bold mb-4">${msg}</div>
        <button onclick="location.reload()" class="bg-amber-600 text-white px-6 py-2 rounded-lg hover:bg-amber-700">重新整理</button>
      </div>
    </div>`;
}

async function loadUpcomingFromTab() {
  try {
    const UPCOMING_CSV = `https://docs.google.com/spreadsheets/d/${CONFIG.SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent('即將開團')}`;
    const res = await fetch(UPCOMING_CSV, { credentials: 'omit' });
    const text = await res.text();
    if (utils.isProbablyHTML(text)) return [];

    const out = [];
    Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: h => (h || '').trim(),
      complete: r => {
        (r.data || []).forEach((row, i) => {
          const brand = (row['品牌'] || row['Brand'] || '').trim();
          if (!brand) return;
          out.push({
            id: 'u-tab-' + (i + 1),
            brand,
            productName: row['商品名稱'] || row['ProductName'] || row['product_name'] || '',
            startDate: row['開團日期'] || row['StartDate'] || '',
            endDate: row['結束日期'] || row['EndDate'] || '',
            image: row['圖片網址'] || row['image'] || ''
          });
        });
      }
    });
    return out;
  } catch {
    return [];
  }
}

async function loadData() {
  try {
    const MAIN_CSV = `https://docs.google.com/spreadsheets/d/${CONFIG.SHEET_ID}/export?format=csv`;

    const res = await fetch(MAIN_CSV, { credentials: 'omit' });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    
    const csv = await res.text();

    if (utils.isProbablyHTML(csv)) {
      showError('Google Sheet 無法公開讀取。請將權限改為「知道連結的任何人可檢視」，或使用「檔案 → 發佈到網路上」。');
      return;
    }
    
    const all = [];
    Papa.parse(csv, {
      header: true,
      skipEmptyLines: true,
      transformHeader: h => (h || '').trim(),
      complete: r => {
        (r.data || []).forEach((row, i) => {
          const brand = (row['品牌'] || row['Brand'] || '').trim();
          const url = (row['連結'] || row['URL'] || row['Link'] || '').trim();
          if (!brand || brand.includes('---') || brand.includes('===')) return;

          const typeRaw = String(row['類型'] || row['Type'] || '').toLowerCase();
          let category = 'short';
          if (/長期|long/.test(typeRaw)) category = 'long';
          else if (/折扣|coupon|affiliate/.test(typeRaw)) category = 'coupon';
          else if (/即將|upcoming/.test(typeRaw)) category = 'upcoming';
          else if (/教育|公益|edu|charity/.test(typeRaw)) category = 'edu';
          else if (/書籍|書|book/.test(typeRaw)) category = 'book';
          all.push({
            id: i + 1,
            brand,
            productName: row['商品名稱'] || row['ProductName'] || row['product_name'] || '',
            url,
            startDate: row['開團日期'] || row['StartDate'] || '',
            endDate: row['結束日期'] || row['EndDate'] || '',
            category,
            image: row['圖片網址'] || row['image'] || '',
            description: row['商品描述'] || row['Description'] || '',
            stock: row['庫存狀態'] || row['Stock'] || '',
            tag: row['標籤'] || row['Tag'] || '',
            coupon: row['折扣碼'] || row['Coupon'] || row['DiscountCode'] || '',
            note: row['備註'] || row['Note'] || row['Remark'] || '', // 純文字備註
            blogUrl: row['網誌網址'] || row['BlogURL'] || row['blog_url'] || '',
            googleDoc: row['Google文件'] || row['GoogleDoc'] || row['文件介紹'] || '',
            qa: row['QA'] || row['Q&A'] || '',
            video: row['影片網址'] || row['Video'] || row['VideoURL'] || '',
            itemCategory: row['分類'] || row['Category'] || '',
            itemCountry: row['國家'] || row['Country'] || '',
            // 主推（任何非空值都算）
            // 「主推」欄一欄兩用：
            //   - 有值 = 上 hero
            //   - 值是 URL → 拿來當 hero banner 圖（21:9）
            //   - 值不是 URL（例如 Y、TRUE、1）→ hero 圖 fallback 用「圖片網址」
            featured: !!String(row['主推'] || row['Featured'] || row['Hero'] || '').trim(),
            heroImage: (function(){
              const m = String(row['主推'] || row['Featured'] || row['Hero'] || '').trim();
              if (/^https?:\/\//i.test(m)) return m;       // 主推欄填 URL → hero 圖
              return row['圖片網址'] || row['image'] || ''; // 主推欄是 Y/TRUE → 用商品圖
            })(),
            // 保固 / 官網（單一 URL）
            warrantyUrl: row['官網保固'] || row['官網'] || row['保固網站'] || row['Warranty'] || row['OfficialSite'] || '',
            // 客服管道（多行）。兩種寫法都吃：
            //   1. name=value（明確命名，例 LINE=@kidsread）
            //   2. 純值（系統自動判斷類型）：
            //      @kidsread       → LINE
            //      x@y.com         → Email
            //      02-1234-5678    → 電話
            //      https://...     → 官方網站
            contacts: String(row['客服'] || row['Contact'] || row['Support'] || '').split(/\r?\n/).map(line => {
              const trimmed = line.trim();
              if (!trimmed) return null;
              const eq = trimmed.search(/[=＝:：]/);
              if (eq >= 0) {
                const name = trimmed.slice(0, eq).trim();
                const value = trimmed.slice(eq + 1).trim();
                return name && value ? { name, value } : null;
              }
              // 沒分隔符 → 自動判斷類型 + 自動取名
              if (/^@/.test(trimmed))                              return { name: 'LINE', value: trimmed };
              if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmed))      return { name: 'Email', value: trimmed };
              if (/^[+\d][\d\-\s()]+$/.test(trimmed))              return { name: '電話', value: trimmed };
              if (/^https?:\/\//i.test(trimmed))                   return { name: '官方網站', value: trimmed };
              return null;
            }).filter(Boolean),
            // 「通路」欄位：支援多通路 Linktree 模式
            // 格式：每行一個通路，name=url（也吃全形 ＝ 跟冒號 :／：）
            //   博客來=https://...
            //   金石堂=https://...
            retailers: String(row['通路'] || row['Channels'] || '').split(/\r?\n/).map(line => {
              const trimmed = line.trim();
              if (!trimmed) return null;
              const eq = trimmed.search(/[=＝:：]/);
              if (eq < 0) {
                // 沒分隔符：整列若是 URL → 自動用 domain 當名稱
                if (/^https?:\/\//i.test(trimmed)) {
                  try { return { name: new URL(trimmed).hostname.replace(/^www\./, ''), url: trimmed }; } catch { return null; }
                }
                return null;
              }
              const name = trimmed.slice(0, eq).trim();
              const url = trimmed.slice(eq + 1).trim();
              return name && url ? { name, url } : null;
            }).filter(Boolean)
          });
        });
      }
    });

    // 保留條件：非 upcoming + (有「連結」或有「通路」多連結)
    state.groups = all.filter(g => g.category !== 'upcoming' && (!!g.url || (g.retailers && g.retailers.length > 0)));

    // 提取所有不重複的分類和國家
    const categoriesSet = new Set();
    const countriesSet = new Set();
    
    state.groups.forEach(g => {
      // 處理分類（可能包含逗號分隔的多個值）
      if (g.itemCategory && g.itemCategory.trim()) {
        const categories = g.itemCategory.split(/[,，]/).map(c => c.trim()).filter(c => c);
        categories.forEach(cat => categoriesSet.add(cat));
      }
      
      // 處理國家（可能包含逗號分隔的多個值）
      if (g.itemCountry && g.itemCountry.trim()) {
        const countries = g.itemCountry.split(/[,，]/).map(c => c.trim()).filter(c => c);
        countries.forEach(country => countriesSet.add(country));
      }
    });
    
    // 轉換為陣列並自訂排序
    state.availableCategories = Array.from(categoriesSet).sort();
    
    // 自訂國家排序：中國和香港排到最後
    state.availableCountries = Array.from(countriesSet).sort((a, b) => {
      const sensitiveCountries = ['中國', '香港'];
      const aIsSensitive = sensitiveCountries.includes(a);
      const bIsSensitive = sensitiveCountries.includes(b);
      
      // 如果 a 是敏感國家，b 不是，a 排後面
      if (aIsSensitive && !bIsSensitive) return 1;
      // 如果 b 是敏感國家，a 不是，b 排後面
      if (!aIsSensitive && bIsSensitive) return -1;
      // 否則按照字母順序
      return a.localeCompare(b, 'zh-TW');
    });

    const fromMain = all.filter(g => g.category === 'upcoming')
      .map(g => ({ id: 'u-main-' + g.id, brand: g.brand, startDate: g.startDate || '', endDate: g.endDate || '', image: g.image || '' }));
    const fromTab = await loadUpcomingFromTab();
    const seen = {};
    const merged = fromMain.concat(fromTab);
    state.upcomingGroups = [];
    merged.forEach(it => {
      const key = (it.brand || '') + '|' + (it.startDate || '') + '|' + (it.endDate || '');
      if (seen[key]) return;
      seen[key] = true;
      state.upcomingGroups.push(it);
    });

    state.loading = false;

    // 🎨 圖片優化：驗證和正規化所有圖片 URL
    await ImageOptimizer.validateAllImages(state.groups);
    
    // 🎨 圖片優化：預載前 3 張關鍵圖片
    preloadCriticalImages(state.groups);
    
    renderFilters();
    renderContent();
  } catch (error) {
    showError('無法連接資料來源（網路或權限問題）');
  }
}

// ============ 卡片渲染 ============
// 卡片動態 OG meta + scroll-to-card via ?p=BRAND_NAME
function setMeta(prop, value) {
  let meta = document.querySelector(`meta[property="${prop}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('property', prop);
    document.head.appendChild(meta);
  }
  meta.content = value;
}

const DEFAULT_OG = {
  title: '鷹式一家 Eaglish Family - 精選團購·優質好物',
  description: '跟著鷹式一家一起買！精選台日韓歐美優質商品團購，母嬰、居家、美妝通通有。',
  image: 'https://www.eaglish.store/logo-horizontal.jpg',
  url: 'https://www.eaglish.store/'
};

function updateOGMeta(card) {
  if (!card) {
    document.title = '鷹式一家團購 | 鷹家買物社 - 精選團購·優質好物';
    setMeta('og:title', DEFAULT_OG.title);
    setMeta('og:description', DEFAULT_OG.description);
    setMeta('og:image', DEFAULT_OG.image);
    setMeta('og:url', DEFAULT_OG.url);
    return;
  }
  const title = `${card.brand}｜鷹家買物社`;
  const desc = (card.description || `跟著鷹式一家買！${card.brand}`).slice(0, 200);
  let image = DEFAULT_OG.image;
  if (card.image && typeof ImageOptimizer !== 'undefined') {
    try { image = ImageOptimizer.getOptimizedImageUrl(card.image, card.brand).primary || DEFAULT_OG.image; } catch {}
  }
  const url = `${window.location.origin}/?p=${encodeURIComponent(card.brand)}`;
  document.title = title;
  setMeta('og:title', title);
  setMeta('og:description', desc);
  setMeta('og:image', image);
  setMeta('og:url', url);
}

// 載入時讀 ?p=X 參數，scroll 到對應卡片 + 高亮 + 更新 OG
function applyUrlParams() {
  const brand = new URLSearchParams(window.location.search).get('p');
  if (!brand) { updateOGMeta(null); return; }

  // 等 renderContent 跑完，DOM 上才有 [data-brand]
  setTimeout(() => {
    const card = state.groups.find(g => g.brand === brand);
    if (card) updateOGMeta(card);
    const el = document.querySelector(`[data-brand="${CSS.escape(brand)}"]`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('card-highlighted');
    setTimeout(() => el.classList.remove('card-highlighted'), 2500);
  }, 600);
}

// 「分享這張卡片」— 產生 ?p=BRAND 的獨立連結
function shareCard(brand) {
  if (!brand) return;
  const card = state.groups.find(g => g.brand === brand);
  const url = `${window.location.origin}/?p=${encodeURIComponent(brand)}`;
  const data = {
    title: `${brand}｜鷹家買物社`,
    text: card?.description || `跟著鷹式一家買！${brand}`,
    url
  };
  const trackShare = (method) => {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'share_card', { brand, method, event_category: 'engagement' });
    }
  };
  if (navigator.share) {
    navigator.share(data).then(() => trackShare('Web Share API')).catch(() => {});
  } else if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(() => {
      trackShare('Copy Link');
      const toast = document.getElementById('copyToast');
      if (toast) {
        toast.textContent = '✓ 連結已複製';
        toast.classList.remove('opacity-0', 'translate-x-[200%]');
        setTimeout(() => toast.classList.add('opacity-0', 'translate-x-[200%]'), 1800);
      }
    });
  }
}

// 把純文字裡的 URL 轉成可點的超連結（用於「貼心說明」這類 free-form 欄位）
function linkify(text) {
  if (!text) return '';
  // 先跳脫 HTML，避免使用者輸入的 <script> 等被執行
  const escaped = String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  // 再把 http(s) URL 包成 <a>（跟旁邊文字同色，只用底線當「可點」訊號，不再突兀）
  return escaped.replace(
    /(https?:\/\/[^\s<>"']+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer" style="color:inherit;text-decoration:underline;text-decoration-color:rgba(0,0,0,0.3);text-underline-offset:2px;word-break:break-all;">$1</a>'
  );
}

// 客服欄位智慧 href：判斷是 email / phone / LINE OA / 一般 URL，自動套對的 protocol
function smartContactHref(value) {
  const v = String(value || '').trim();
  if (!v) return '';
  if (/^(https?|mailto|tel|line):/i.test(v)) return v;            // 已經是完整 URL
  if (/^@/.test(v))                          return `https://line.me/R/ti/p/${encodeURIComponent(v)}`;  // LINE OA @xxx
  if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v))  return `mailto:${v}`;                                       // Email
  if (/^[+\d][\d\-\s()]+$/.test(v))          return `tel:${v.replace(/[\s\-()]/g, '')}`;                 // 電話
  if (/\./i.test(v))                         return v.startsWith('http') ? v : `https://${v}`;          // 看起來像 domain
  return v;
}

// 客服按鈕的 emoji（純視覺輔助，不靠 SVG/外部 icon）
function contactIcon(value) {
  const href = smartContactHref(value);
  if (href.startsWith('mailto:')) return '✉️';
  if (href.startsWith('tel:'))    return '📞';
  if (/line\.me/i.test(href))     return '💬';
  return '🔗';
}

// 卡片動作列（左：國家 pill；右：分享 + 收藏）
// mobile 上 pill 只露國旗 emoji，≥768px 才補中文，避免擠壓 row
function renderCardActions(brand, countries) {
  if (!brand) return '';
  return `<div class="card-actions-row">`
       + `<div class="card-actions-left">${renderCountryFlagPills(countries)}</div>`
       + `<div class="card-actions-right">${renderShareButton(brand)}${renderWishlistHeart(brand)}</div>`
       + `</div>`;
}

function renderCountryFlagPills(countries) {
  if (!countries || countries.length === 0) return '';
  return countries.map(country => {
    const safe = country.replace(/'/g, "\\'");
    const flag = utils.getCountryFlag(country);
    return `<button type="button" class="card-country-pill" `
         + `onclick="event.stopPropagation(); event.preventDefault(); setFilter('country', '${safe}');" `
         + `aria-label="篩選 ${country}">`
         + `<span class="card-country-flag">${flag}</span>`
         + `<span class="card-country-name">${country}</span>`
         + `</button>`;
  }).join('');
}

// 卡片右上角的分享按鈕（跟愛心並排）
function renderShareButton(brand) {
  if (!brand) return '';
  const safe = brand.replace(/'/g, "\\'");
  return `<button type="button" class="card-share-btn" `
       + `onclick="event.stopPropagation(); event.preventDefault(); shareCard('${safe}');" `
       + `aria-label="分享這張卡片">`
       + `<svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none">`
       + `<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>`
       + `<line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>`
       + `</svg></button>`;
}

// 收藏愛心按鈕（卡片右上角，所有卡片共用）
function renderWishlistHeart(brand) {
  if (!brand) return '';
  const safe = brand.replace(/'/g, "\\'");
  const isSaved = state.wishlist.has(brand);
  return `<button type="button" class="wishlist-heart ${isSaved ? 'saved' : ''}" `
       + `onclick="event.stopPropagation(); event.preventDefault(); toggleWishlist('${safe}');" `
       + `aria-label="${isSaved ? '取消收藏' : '加入收藏'}" aria-pressed="${isSaved}">`
       + `<svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="${isSaved ? 'currentColor' : 'none'}">`
       + `<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>`
       + `</svg></button>`;
}

// Hero Banner — 大圖主推（Sheet 主推欄填值就會在這出現）
function renderHeroBanner(items) {
  if (!items || !items.length) return '';

  const buildCard = (item, isFirst) => {
    // hero 用大圖，eager load，不 lazy（above the fold）
    // 優先用 heroImage（主推欄填的 URL），fallback 圖片網址
    const rawSrc = item.heroImage || item.image || '';
    let imgSrc = rawSrc;
    if (imgSrc && typeof ImageOptimizer !== 'undefined') {
      try {
        imgSrc = ImageOptimizer.getOptimizedImageUrl(rawSrc, item.brand).primary;
        imgSrc = imgSrc.replace(/=w\d+(-h\d+)?$/i, '=w1600');
      } catch {}
    }

    // 點擊行為：多通路 → scroll 到該卡讓 user 選；單連結 → 直接跳
    const isMultiLink = item.retailers && item.retailers.length > 1;
    const safeBrand = item.brand.replace(/'/g, "\\'");
    const gaTrack = `if(typeof gtag !== 'undefined'){gtag('event', 'click_hero', {brand: '${safeBrand}', mode: '${isMultiLink ? 'scroll' : 'link'}', event_category: 'engagement'});}`;

    const inner = `${imgSrc ? `<img src="${imgSrc}" alt="${item.brand}" ${isFirst ? 'fetchpriority="high"' : ''} loading="${isFirst ? 'eager' : 'lazy'}">` : `<div class="hero-card-placeholder">📌</div>`}
      <div class="hero-overlay">
        <span class="hero-badge">📌 編輯精選</span>
        <h2 class="hero-title">${item.brand}</h2>
        ${item.description ? `<p class="hero-desc">${item.description}</p>` : ''}
        <span class="hero-cta">${isMultiLink ? '看詳情 →' : '立即查看 →'}</span>
      </div>`;

    if (isMultiLink) {
      // <button> for scroll-to-card 行為
      return `<button type="button" class="hero-card" data-brand="${item.brand}"
         onclick="${gaTrack} scrollToCard('${safeBrand}');">${inner}</button>`;
    }
    // <a> for direct link
    const linkHref = item.url || (item.retailers && item.retailers[0]?.url) || '#';
    return `<a href="${linkHref}" target="_blank" rel="noopener noreferrer"
       class="hero-card" data-brand="${item.brand}"
       onclick="${gaTrack}">${inner}</a>`;
  };

  if (items.length === 1) {
    return `<section id="featured" class="hero-banner">${buildCard(items[0], true)}</section>`;
  }

  // 多張 → 水平 carousel + dot indicators
  const dots = items.map((_, i) =>
    `<button class="hero-dot${i === 0 ? ' active' : ''}" data-idx="${i}" aria-label="切到第 ${i+1} 張"></button>`
  ).join('');
  return `<section id="featured" class="hero-banner">
    <div class="hero-carousel" id="heroCarousel">${items.map((it, i) => buildCard(it, i === 0)).join('')}</div>
    <div class="hero-dots">${dots}</div>
  </section>`;
}

function renderUpcomingSearchCard(g) {
  return `
    <div class="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl overflow-hidden border-2 border-pink-200 shadow-md transition-all hover:shadow-lg">
      ${g.image ? `
        <div class="w-full h-40 bg-gray-100">
          ${g.url ? `
            <a href="${g.url}" target="_blank" rel="noopener noreferrer"
               onclick="try{ if(typeof gtag!=='undefined'){ gtag('event','coupon_image_click',{ event_category:'engagement', event_label:'${g.brand || ''}' }); } }catch(e){}">
              <img src="${g.image}" class="w-full h-full object-cover" loading="lazy" alt="${g.brand || ''}">
            </a>
          ` : `
            <img src="${g.image}" class="w-full h-full object-cover" loading="lazy" alt="${g.brand || ''}">
          `}
        </div>
      ` : ''}
      <div class="p-5">
        <div class="flex items-center gap-2 mb-2">
          <span class="bg-pink-500 text-white px-2.5 py-0.5 rounded-full text-xs font-bold">敬請期待</span>
        </div>
        <h3 class="text-lg font-bold text-pink-900 mb-1 text-center">${g.brand || ''}</h3>
        ${g.productName ? `<p class="text-sm text-gray-600 mb-2 text-center">${g.productName}</p>` : ''}
        ${g.startDate ? `<div class="text-sm text-pink-700 mb-1">📅 預計開團：${g.startDate}</div>` : ''}
        ${g.endDate ? `<div class="text-sm text-pink-700 mb-3">⏰ 預計結束：${g.endDate}</div>` : ''}
        <div class="bg-white border-2 border-pink-300 rounded-lg p-3 text-center">
          <p class="text-sm text-pink-800 font-medium">團購尚未開始，請密切關注</p>
        </div>
      </div>
    </div>`;
}

// 卡片本體（標題以下：描述、動作、tags、倒數、備註、網誌、文件、QA、影片、折扣碼、行事曆）+ CTA
// 抽出成 helper，renderGroupCard 跟 renderWishlistCard（展開區）共用
function renderGroupCardBody(g) {
  const daysLeft = utils.getDaysLeft(g.endDate);
  const expired = utils.isExpired(g.endDate);
  const qaList = g.qa && utils.isQA(g.qa) ? utils.parseQA(g.qa) : [];
  const openClass = expired ? 'from-gray-400 to-gray-500 hover:from-gray-400 hover:to-gray-500' : 'from-amber-600 to-pink-600 hover:from-amber-700 hover:to-pink-700';

  const categories = g.itemCategory ? g.itemCategory.split(/[,，]/).map(c => c.trim()).filter(c => c) : [];
  const countries = g.itemCountry ? g.itemCountry.split(/[,，]/).map(c => c.trim()).filter(c => c) : [];

  const categoryTags = categories.map(cat =>
    `<button type="button" onclick="event.stopPropagation(); setFilter('category', '${cat.replace(/'/g, "\\'")}')" class="card-filter-tag" aria-label="篩選 ${cat}">${cat}</button>`
  ).join('');

  const countdown = g.category === 'short' && daysLeft !== null
    ? `<div class="flex items-center gap-2 text-sm mb-3">
         <span class="${daysLeft < 0 ? 'text-gray-500' : daysLeft <= 3 ? 'text-red-600 font-semibold' : 'text-amber-700'}">
           ⏱ ${daysLeft > 0 ? '剩 ' + daysLeft + ' 天' : daysLeft === 0 ? '今天截止' : '結束 ' + Math.abs(daysLeft) + ' 天'}
         </span>
       </div>`
    : '';

  const body = `
    ${g.description ? `<p class="text-base md:text-base ${expired ? 'text-gray-600' : 'text-gray-700'} leading-6 md:leading-6 mb-3">${g.description}</p>` : ''}
    ${renderCardActions(g.brand, countries)}
    <div class="flex flex-wrap gap-2 mb-3">
      ${expired ? '<span class="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">已結束</span>' : ''}
      ${categoryTags}
      ${g.tag ? `<span class="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded-full font-medium">${g.tag}</span>` : ''}
      ${g.stock === '售完' ? '<span class="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">已售完</span>' : ''}
      ${g.stock === '少量' ? '<span class="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">少量現貨</span>' : ''}
    </div>
    ${countdown}
    ${g.note && !expired ? `<div class="mb-3 bg-blue-50 border-2 border-blue-200 rounded-lg p-3"><p class="text-xs text-blue-600 font-semibold mb-1">ℹ️ 貼心說明</p><p class="text-sm text-blue-900" style="white-space: pre-wrap;">${linkify(g.note)}</p></div>` : ''}
    ${g.blogUrl && !expired ? `<div class="mb-3"><a href="${g.blogUrl}" target="_blank" rel="noopener noreferrer" class="w-full bg-gradient-to-r from-gray-50 to-slate-50 border-2 border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:from-gray-100 hover:to-slate-100 transition-colors flex items-center justify-center gap-2" onclick="if(typeof gtag !== 'undefined'){gtag('event', 'click_blog', {group_name: '${g.brand.replace(/'/g, "\\'")}', event_category: 'engagement'});}">📝 查看網誌</a></div>` : ''}
    ${g.warrantyUrl && !expired ? `<div class="mb-3"><a href="${g.warrantyUrl}" target="_blank" rel="noopener noreferrer" class="w-full bg-gradient-to-r from-slate-50 to-gray-50 border-2 border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:from-slate-100 hover:to-gray-100 transition-colors flex items-center justify-center gap-2" onclick="if(typeof gtag !== 'undefined'){gtag('event', 'click_warranty', {group_name: '${g.brand.replace(/'/g, "\\'")}', event_category: 'engagement'});}">🛡️ 保固網站</a></div>` : ''}
    ${g.googleDoc && !expired ? `<div class="mb-3"><button onclick="openBlogModal(event, '${g.googleDoc.replace(/'/g, "\\'")}', '${g.brand.replace(/'/g, "\\'")}', '${(g.url || '').replace(/'/g, "\\'")}')" class="w-full bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 text-amber-800 px-4 py-2 rounded-lg text-sm font-medium hover:from-amber-100 hover:to-orange-100 transition-colors flex items-center justify-center gap-2">📄 查看介紹</button></div>` : ''}
    ${(() => {
      if (!g.contacts || g.contacts.length === 0 || expired) return '';
      // 只有 1 個管道：全寬按鈕直接跳
      if (g.contacts.length === 1) {
        const c = g.contacts[0];
        return `<div class="mb-3"><a href="${smartContactHref(c.value)}" target="_blank" rel="noopener noreferrer" `
             + `onclick="if(typeof gtag !== 'undefined'){gtag('event', 'click_contact', {group_name: '${g.brand.replace(/'/g, "\\'")}', channel: '${c.name.replace(/'/g, "\\'")}', event_category: 'engagement'});}" `
             + `class="contact-button">${contactIcon(c.value)} ${c.name} 客服</a></div>`;
      }
      // 2+ 個管道：點開 modal
      return `<div class="mb-3"><button onclick="openContactModal('${g.brand.replace(/'/g, "\\'")}')" `
           + `class="contact-button">📞 客服管道 (${g.contacts.length})</button></div>`;
    })()}
    ${qaList.length > 0 && !expired ? `<details class="mb-3 bg-indigo-50 border-2 border-indigo-200 rounded-lg p-3">
      <summary class="cursor-pointer text-indigo-700 font-medium">常見問題❓(${qaList.length})</summary>
      ${qaList.map(qa => `<div class="mt-2 border-t border-indigo-200 pt-2"><p class="text-sm font-semibold text-indigo-900 mb-1">Q: ${qa.q}</p><p class="text-sm text-indigo-700">A: ${qa.a}</p></div>`).join('')}
    </details>` : ''}
    ${g.video && !expired ? `<div class="mb-3"><button onclick='openVideoModal(event, "${g.video}")' class="w-full bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm font-medium hover:from-red-100 hover:to-pink-100 transition-colors">🎬 觀看影片</button></div>` : ''}
    ${g.coupon && !expired ? `<div class="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-3 mb-3"><div class="flex items-center justify-between"><div class="flex-1 min-w-0"><p class="text-xs text-green-700 font-semibold mb-1">🎟️ 專屬折扣碼</p><code class="text-base font-bold text-green-800 font-mono break-all">${g.coupon}</code></div><button onclick='copyCoupon(event, "${g.coupon}")' class="ml-3 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium">複製</button></div></div>` : ''}
    ${g.endDate && !expired && g.category !== '長期' ? `<div class="mb-3"><button onclick="addToCalendar(event, '${g.brand.replace(/'/g, "\\'")} - 團購截止', '${g.endDate}', '${g.url || ''}', '⏰ 今天是最後一天!記得下單')" class="w-full bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium hover:from-blue-100 hover:to-indigo-100 transition-colors">📅 加入行事曆</button></div>` : ''}
  `;

  const cta = (g.retailers && g.retailers.length > 0)
    ? `<div class="retailer-buttons">${g.retailers.map(r => `<a href="${r.url}" target="_blank" rel="noopener noreferrer" onclick="if(typeof gtag !== 'undefined'){gtag('event', 'click_retailer', {retailer: '${(r.name || '').replace(/'/g, "\\'")}', group_name: '${g.brand.replace(/'/g, "\\'")}', event_category: 'conversion'});}">${r.name}</a>`).join('')}</div>`
    : (g.url ? `<a href="${g.url}" target="_blank" rel="noopener noreferrer" onclick="if(typeof gtag !== 'undefined'){gtag('event', 'click_group', {group_name: '${g.brand.replace(/'/g, "\\'")}', group_category: '${g.category}', event_category: 'conversion', event_label: '${g.brand.replace(/'/g, "\\'")}', value: 1});}" class="block w-full text-center text-white py-3 rounded-xl font-bold bg-gradient-to-r ${openClass}">${expired ? '仍可查看 →' : '🛒 立即前往 →'}</a>` : '');

  return { body, cta, expired };
}

function renderGroupCard(g) {
  const { body, cta, expired } = renderGroupCardBody(g);
  return `
    <div class="masonry-card ${expired ? 'opacity-60' : ''}" data-brand="${g.brand}">
      ${renderOptimizedImage(g.image, g.brand, g.brand, expired, !!g.url, g.url)}
      <div class="masonry-card-content p-5">
        <h3 class="masonry-card-title text-lg font-bold text-center ${expired ? 'text-gray-500' : 'text-amber-900'} mb-2">${g.brand}</h3>
        ${body}
        ${cta}
      </div>
    </div>`;
}

// 收藏頁面專用：精簡卡（圖+標題+CTA）+ 展開後是「跟一般卡片一樣的完整內容」
function renderWishlistCard(g) {
  const { body, cta, expired } = renderGroupCardBody(g);
  return `
    <div class="masonry-card wishlist-compact ${expired ? 'opacity-60' : ''}" data-brand="${g.brand}">
      ${renderOptimizedImage(g.image, g.brand, g.brand, expired, !!g.url, g.url)}
      <div class="masonry-card-content">
        <h3 class="masonry-card-title text-lg font-bold text-center ${expired ? 'text-gray-500' : 'text-amber-900'} mb-2">${g.brand}</h3>
        ${cta}
        <details class="wishlist-expand">
          <summary>查看更多</summary>
          <div class="wishlist-expand-body">${body}</div>
        </details>
      </div>
    </div>`;
}

function renderCouponCard(g) {
  const expired = utils.isExpired(g.endDate);
  const daysLeft = utils.getDaysLeft(g.endDate);
  const noteIsURL = utils.isURL(g.note);
  const noteIsQA = utils.isQA(g.note);
  const qaList = noteIsQA ? utils.parseQA(g.note) : [];

  // 處理複選的分類和國家
  const categories = g.itemCategory ? g.itemCategory.split(/[,，]/).map(c => c.trim()).filter(c => c) : [];
  const countries = g.itemCountry ? g.itemCountry.split(/[,，]/).map(c => c.trim()).filter(c => c) : [];

  // 生成分類標籤（可點 → 套上分類篩選）
  const categoryTags = categories.map(cat =>
    `<button type="button" onclick="event.stopPropagation(); setFilter('category', '${cat.replace(/'/g, "\\'")}')" class="card-filter-tag" aria-label="篩選 ${cat}">${cat}</button>`
  ).join('');

  return `
    <div class="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl overflow-hidden ${expired ? 'opacity-60' : ''}" data-brand="${g.brand}">
      ${renderOptimizedImage(g.image, g.brand, g.brand, expired, !!g.url, g.url)}
      <div class="p-6">
        <div class="flex items-start justify-between gap-3 mb-3">
          <div class="flex-1">
            <h3 class="text-lg font-bold ${expired ? 'text-gray-600' : 'text-purple-900'} text-center">${g.brand}</h3>
            ${g.productName ? `<p class="text-sm ${expired ? 'text-gray-400' : 'text-gray-600'} mt-1 text-center">${g.productName}</p>` : ''}
          </div>
          ${expired ? '<span class="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">已結束</span>' : ''}
        </div>
        ${g.description ? `<p class="text-base ${expired ? 'text-gray-600' : 'text-gray-700'} leading-6 mb-3">${g.description}</p>` : ''}
        ${renderCardActions(g.brand, countries)}
        ${categoryTags ? `<div class="flex flex-wrap gap-2 mb-3">${categoryTags}</div>` : ''}
        ${g.note && !noteIsURL && !noteIsQA ? `<p class="text-sm text-gray-700 mb-3 leading-relaxed">${g.note}</p>` : ''}
        ${noteIsURL ? `<div class="mb-3"><a href="${g.note}" target="_blank" rel="noopener noreferrer" class="w-full bg-gradient-to-r from-gray-50 to-slate-50 border-2 border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:from-gray-100 hover:to-slate-100 transition-colors flex items-center justify-center gap-2">📄 查看詳細說明</a></div>` : ''}
        ${g.googleDoc && !expired ? `<div class="mb-3"><button onclick="openBlogModal(event, '${g.googleDoc.replace(/'/g, "\\'")}', '${g.brand.replace(/'/g, "\\'")}', '${g.url.replace(/'/g, "\\'")}')" class="w-full bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 text-amber-800 px-4 py-2 rounded-lg text-sm font-medium hover:from-amber-100 hover:to-orange-100 transition-colors flex items-center justify-center gap-2">📄 查看介紹</button></div>` : ''}
        ${noteIsQA ? `<div class="space-y-2 mb-3">${qaList.map((qa, i) => `<details class="bg-white rounded-lg border border-purple-200 p-3"><summary class="cursor-pointer font-semibold text-purple-900 text-sm">${qa.q}</summary><div class="mt-2 text-sm text-gray-700">${qa.a}</div></details>`).join('')}</div>` : ''}
        ${g.video ? `<div class="mb-3"><button onclick='openVideoModal(event, "${g.video}")' class="w-full bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm font-medium hover:from-red-100 hover:to-pink-100 transition-colors">🎬 觀看影片</button></div>` : ''}
        ${g.endDate && !expired ? `<div class="flex items-center gap-2 text-sm mb-4"><span class="${daysLeft <= 7 ? 'text-red-600 font-semibold' : 'text-purple-700'}">⏰ ${daysLeft > 0 ? '剩 ' + daysLeft + ' 天' : '今天截止'}</span></div>` : ''}
        ${g.coupon && !expired ? `
          <div class="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-3 mb-3">
            <div class="flex items-center justify-between">
              <div class="flex-1 min-w-0">
                <p class="text-xs text-green-700 font-semibold mb-1">🎟️ 專屬折扣碼</p>
                <code class="text-base font-bold text-green-800 font-mono break-all">${g.coupon}</code>
              </div>
              <button onclick='copyCoupon(event, "${g.coupon}")' class="ml-3 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium">複製</button>
            </div>
          </div>
        ` : ''}
        ${g.endDate && !expired && g.category !== '長期' ? `<div class="mb-3"><button onclick="addToCalendar(event, '${g.brand.replace(/'/g, "\\'")} - 團購截止', '${g.endDate}', '${g.url}', '⏰ 今天是最後一天！記得下單')" class="w-full bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium hover:from-blue-100 hover:to-indigo-100 transition-colors">📅 加入行事曆</button></div>` : ''}
        <a href="${g.url}" target="_blank" rel="noopener noreferrer" 
           onclick="if(typeof gtag !== 'undefined'){gtag('event', 'click_coupon', {group_name: '${g.brand.replace(/'/g, "\\'")}', coupon_code: '${g.coupon || ''}', event_category: 'conversion', event_label: '${g.brand.replace(/'/g, "\\'")}', value: 1});}"
           class="block w-full text-center text-white py-3 rounded-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 ${expired ? 'opacity-80' : ''}">${expired ? '仍可查看 →' : '🛒 立即前往 →'}</a>
      </div>
    </div>`;
}

// ============ 康先生的書 — 套 .masonry-card 外觀，內部 Linktree buttons ============
function renderKangBooksSection(books) {
  if (!books.length) return '';

  const renderRetailer = (r) => `
    <a href="${r.url}" target="_blank" rel="noopener noreferrer"
       onclick="if(typeof gtag !== 'undefined'){gtag('event', 'click_book', {retailer: '${(r.name || '').replace(/'/g, "\\'")}', event_category: 'kang_books'});}">${r.name}</a>`;

  const renderBookCard = (b) => {
    const emoji = b.format === 'paperback' ? '📚' : '📱';
    const variant = b.format === 'paperback' ? 'kang-paperback' : 'kang-ebook';

    let coverHtml;
    if (b.cover) {
      // 走 ImageOptimizer：自動把 Drive 分享連結轉成 lh3.googleusercontent.com 格式
      const { primary, fallback } = ImageOptimizer.getOptimizedImageUrl(b.cover, b.title);
      coverHtml = `<img class="masonry-card-image" src="${primary}" data-fallback="${fallback}" alt="${b.title}書封" loading="lazy" decoding="async" onerror="ImageOptimizer.handleImageError(this)">`;
    } else {
      coverHtml = `<div class="kang-cover-empty" aria-hidden="true">${emoji}</div>`;
    }

    return `
      <div class="masonry-card ${variant}" data-brand="${b.title}">
        <div class="masonry-card-image-wrapper">
          ${coverHtml}
        </div>
        <div class="masonry-card-content">
          <h3 class="masonry-card-title text-lg font-bold text-center text-amber-900 mb-2">${b.title}</h3>
          ${b.description ? `<p class="text-base text-gray-700 leading-6 mb-3">${b.description}</p>` : ''}
          ${renderCardActions(b.title)}
          <div class="retailer-buttons">
            ${b.retailers.map(renderRetailer).join('')}
          </div>
        </div>
      </div>`;
  };

  return `
    <section id="kang-books" class="scroll-mt-24 md:scroll-mt-28 mb-8">
      <h2 class="text-2xl font-bold text-amber-900 mb-4 text-center">📖 康先生的書</h2>
      <div class="masonry-grid">
        ${books.map(renderBookCard).join('')}
      </div>
    </section>`;
}

// ============ 內容渲染 ============
function renderContent() {
  if (state.loading) {
    // Skeleton：6 張 shimmer 卡片佔位（masonry-card.loading 類別已在 style.css 有 shimmer 動畫）
    elements.content.innerHTML = `
      <div class="masonry-grid">
        ${Array(6).fill('<div class="masonry-card loading skeleton-card"></div>').join('')}
      </div>
    `;
    return;
  }

  const q = (state.searchTerm || '').toLowerCase();
  const filtered = state.groups.filter(g => {
    // 搜尋篩選
    const okSearch = !q || 
      g.brand.toLowerCase().includes(q) || 
      (g.tag || '').toLowerCase().includes(q) || 
      (g.description || '').toLowerCase().includes(q);
    
    // 過期篩選
    const okExpired = state.showExpired || !utils.isExpired(g.endDate);
    
    // 分類篩選（支援複選：「韓國，歐洲」點擊「韓國」也會出現）
    const okCategory = state.selectedCategory === 'all' || 
      (g.itemCategory && g.itemCategory.split(/[,，]/).map(c => c.trim()).includes(state.selectedCategory));
    
    // 國家篩選（支援複選）
    const okCountry = state.selectedCountry === 'all' || 
      (g.itemCountry && g.itemCountry.split(/[,，]/).map(c => c.trim()).includes(state.selectedCountry));
    
    return okSearch && okExpired && okCategory && okCountry;
  });

  const longTerm = filtered.filter(g => g.category === 'long');
  const shortTerm = filtered.filter(g => g.category === 'short').sort((a, b) => {
    if (!a.endDate && !b.endDate) return 0;
    if (!a.endDate) return 1;
    if (!b.endDate) return -1;
    return utils.parseDateSafe(a.endDate) - utils.parseDateSafe(b.endDate);
  });
  const coupon = filtered.filter(g => g.category === 'coupon');
  const edu = filtered.filter(g => g.category === 'edu');
  const book = filtered.filter(g => g.category === 'book');
  // 收藏：從 state.groups 抓所有 saved（不受 search/category filter 影響）
  const wishlistItems = state.groups.filter(g => state.wishlist.has(g.brand));
  // Hero 主推：從 state.groups 抓 featured（不受 filter 影響，永遠顯示，但過期排除）
  const heroItems = state.groups.filter(g => g.featured && !utils.isExpired(g.endDate));
  // 把 Sheet 上的書籍 row 分組（紙本/電子）；同時看「標籤」跟「品牌」欄裡的關鍵字
  const isPaperback = (b) => /紙本|paperback/i.test(b.tag || '') || /紙本|paperback/i.test(b.brand || '');
  const isEbook     = (b) => /電子|ebook/i.test(b.tag || '')     || /電子|ebook/i.test(b.brand || '');
  const sheetPaperback = book.filter(isPaperback);
  const sheetEbook     = book.filter(isEbook);

  const buildFromSheet = (rows, template) => {
    if (!rows.length) return null;  // Sheet 沒對應的列 → 不渲染這張卡

    // 優先：第一筆有「通路」欄位（多通路單列）→ 整張卡的 retailers 直接用
    const rowWithRetailers = rows.find(r => r.retailers && r.retailers.length > 0);
    if (rowWithRetailers) {
      return {
        ...template,
        title: rowWithRetailers.brand || template.title,  // Sheet 品牌優先
        cover: rowWithRetailers.image || '',
        description: rowWithRetailers.description || '',
        retailers: rowWithRetailers.retailers
      };
    }
    // Legacy 相容：每列代表一個通路
    return {
      ...template,
      cover: (rows.find(r => r.image) || {}).image || '',
      description: (rows.find(r => r.description) || {}).description || '',
      retailers: rows.map(r => ({ name: r.brand, url: r.url })).filter(r => r.url)
    };
  };
  const kangBooks = [
    buildFromSheet(sheetPaperback, KANG_BOOKS_TEMPLATE[0]),
    buildFromSheet(sheetEbook,     KANG_BOOKS_TEMPLATE[1])
  ].filter(Boolean);
  const expiredCount = state.groups.filter(g => utils.isExpired(g.endDate)).length;

  const term = (state.searchTerm || '').trim().toLowerCase();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const activeBrandSet = new Set(filtered.filter(g => !utils.isExpired(g.endDate)).map(g => utils.normalizeBrand(g.brand)));

  const rawUpcoming = term ? (state.upcomingGroups || []).filter(u => {
    const hit = (u.brand || '').toLowerCase().includes(term);
    const st = utils.parseDateSafe(u.startDate);
    const fut = !!st && st > today;
    const diff = !activeBrandSet.has(utils.normalizeBrand(u.brand));
    return hit && fut && diff;
  }) : [];

  const soonestByBrand = {};
  for (const u of rawUpcoming) {
    const key = utils.normalizeBrand(u.brand);
    const st = utils.parseDateSafe(u.startDate);
    if (!soonestByBrand[key] || st < utils.parseDateSafe(soonestByBrand[key].startDate)) {
      soonestByBrand[key] = u;
    }
  }
  const upcomingMatches = Object.values(soonestByBrand);

  // 統一風格：所有 tab 同一個 .section-nav-btn class，emoji + 文字，amber hover
  const btn = (id, txt) => `<button onclick="scrollToSection('${id}')" data-target="${id}" class="section-nav-btn">${txt}</button>`;
  // 滑軌 nav 不放收藏按鈕（收藏改用 modal，從工具列點開）
  elements.sectionButtons.innerHTML =
    (shortTerm.length ? btn('short-term', '⏳ 限時團購') : '') +
    (longTerm.length ? btn('long-term', '☀️ 常駐團購') : '') +
    (kangBooks.length ? btn('kang-books', '📖 康先生的書') : '') +
    (coupon.length ? btn('coupon', '🎟️ 折扣碼') : '') +
    (edu.length ? btn('edu', '📚 教育公益') : '') +
    btn('calendar', '🗓️ 行事曆');

  const m1 = today.getMonth() + 1;
  const m2 = (today.getMonth() + 1) % 12 + 1;
  const m3 = (today.getMonth() + 2) % 12 + 1;

  elements.content.innerHTML =
    renderHeroBanner(heroItems) +

    `<div class="mb-6 flex gap-3 items-center flex-wrap">
       ${state.searchTerm ? `<span class="text-sm text-gray-700 bg-gray-100 px-3 py-1.5 rounded-lg">找到 <strong class="text-amber-700">${filtered.length}</strong> 筆「${state.searchTerm}」</span>` : ''}
       ${wishlistItems.length ? `<button onclick="openWishlistModal()" style="display:inline-flex;align-items:center;gap:8px;white-space:nowrap;padding:8px 16px;border-radius:8px;background:white;color:#374151;border:2px solid #e5e7eb;font-weight:500;font-size:14px;cursor:pointer;transition:background-color 0.15s ease;" onmouseover="this.style.background='#f9fafb'" onmouseout="this.style.background='white'"><svg width="16" height="16" viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" stroke-width="2" style="flex-shrink:0;"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg><span>我的收藏 (${wishlistItems.length})</span></button>` : ''}
       ${state.hasActiveFilters ? `<button onclick="clearAllFilters()" class="filter-clear-btn px-4 py-2 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-2">
         <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
         </svg>
         清除篩選
       </button>` : ''}
     </div>` +

    (state.searchTerm && upcomingMatches.length && shortTerm.length === 0 && longTerm.length === 0 && coupon.length === 0 ? `
      <section id="upcoming-search" class="scroll-mt-24 md:scroll-mt-28 mb-8">
        <h2 class="text-2xl font-bold text-amber-900 mb-4 text-center">即將開團（${upcomingMatches.length}）</h2>
        <div class="masonry-grid">
          ${upcomingMatches.map(renderUpcomingSearchCard).join('')}
        </div>
      </section>
    ` : '') +

    (shortTerm.length ? `
     <section id="short-term" class="scroll-mt-24 md:scroll-mt-28 mb-8">
       <h2 class="text-2xl font-bold text-amber-900 mb-4 text-center">⏳ 限時團購</h2>
       ${renderTodayCountdown()}
       <div class="masonry-grid">${shortTerm.map(renderGroupCard).join('')}</div>
     </section>` : '') +

    (longTerm.length ? `<section id="long-term" class="scroll-mt-24 md:scroll-mt-28 mb-8">
       <h2 class="text-2xl font-bold text-amber-900 mb-4 text-center">☀️ 常駐團購</h2>
       <div class="masonry-grid">${longTerm.map(renderGroupCard).join('')}</div>
     </section>` : '') +

    renderKangBooksSection(kangBooks) +

    (coupon.length ? `<section id="coupon" class="scroll-mt-24 md:scroll-mt-28 mb-8">
       <h2 class="text-2xl font-bold text-amber-900 mb-4 text-center">🎟️ 折扣碼優惠</h2>
       <div class="coupon-grid">${coupon.map(renderCouponCard).join('')}</div>
     </section>` : '') +

    (edu.length ? `<section id="edu" class="scroll-mt-24 md:scroll-mt-28 mb-8">
      <h2 class="text-2xl font-bold text-amber-900 mb-4 text-center">📚 教育／公益資源</h2>
      <div class="masonry-grid">${edu.map(renderGroupCard).join('')}</div>
    </section>` : '') +

    `<section id="calendar" class="scroll-mt-24 md:scroll-mt-28 mb-6">
       <h2 class="text-2xl font-bold text-amber-900 mb-4 text-center">🗓️ 團購行事曆</h2>
       <div class="bg-white rounded-xl p-4 border-2 border-amber-200">
         ${_isAppleSafari() ? `<div class="mb-4 flex justify-center">
           <button onclick="subscribeAllGroups()" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-600 text-white font-semibold hover:bg-amber-700 active:scale-95 transition shadow-sm">
             <span>📅</span><span>訂閱全部開團</span>
           </button>
         </div>` : ''}
         <div class="flex gap-2 mb-4 justify-center">
           <button onclick="switchCalendarMonth(0)" class="px-4 py-2 rounded-lg font-medium ${state.selectedCalendarMonth === 0 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}">${m1}月</button>
           <button onclick="switchCalendarMonth(1)" class="px-4 py-2 rounded-lg font-medium ${state.selectedCalendarMonth === 1 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}">${m2}月</button>
           <button onclick="switchCalendarMonth(2)" class="px-4 py-2 rounded-lg font-medium ${state.selectedCalendarMonth === 2 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}">${m3}月</button>
         </div>
         ${renderCalendar()}
         <div class="mt-4 flex gap-4 text-xs text-gray-600 justify-center flex-wrap">
           <div class="flex items-center gap-1"><div class="w-4 h-4 bg-yellow-200 border border-blue-300 rounded"></div><span>今天</span></div>
           <div class="flex items-center gap-1"><div class="w-4 h-4 bg-red-100 border border-red-300 rounded"></div><span>3天內截止</span></div>
           <div class="flex items-center gap-1"><span class="text-[10px] leading-none px-1.5 py-0.5 rounded bg-white border border-red-300 text-red-700">3</span><span>＝ 當日截止數</span></div>
           <div class="flex items-center gap-1"><span class="text-[10px] leading-none px-1.5 py-0.5 rounded bg-white border border-teal-300 text-teal-700">2</span><span>＝ 當日開團數</span></div>
         </div>
         ${renderMonthlyGroupList()}
       </div>
     </section>` +

    (filtered.length === 0 && state.searchTerm ? `<div class="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 text-center"><p class="text-lg text-yellow-900 font-medium">找不到「${state.searchTerm}」相關的團購</p><p class="text-sm text-yellow-700 mt-2">試試其他關鍵字，或清空搜尋</p></div>` : '') +
    (filtered.length === 0 && !state.searchTerm ? `<div class="text-center py-12 text-amber-700"><p class="text-lg">目前沒有團購項目</p></div>` : '');
  // 啟動倒數計時器
  if (getTodayDeadlines().length > 0) {
    setTimeout(startCountdownTimer, 500);
  }
  // 重建 scroll-spy（每次 re-render 都要，因為 section DOM 是新的）
  initScrollSpy();
  // Hero carousel：scroll 同步 dots + 點 dot 切換
  initHeroCarousel();
}

function initHeroCarousel() {
  const carousel = document.getElementById('heroCarousel');
  if (!carousel) return;
  const dots = document.querySelectorAll('.hero-dot');
  if (!dots.length) return;

  // scroll → 算出當前 index → highlight 對應 dot
  carousel.addEventListener('scroll', () => {
    const idx = Math.round(carousel.scrollLeft / carousel.clientWidth);
    dots.forEach((d, i) => d.classList.toggle('active', i === idx));
  }, { passive: true });

  // 點 dot → scroll 到對應 card
  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      const idx = parseInt(dot.dataset.idx, 10);
      carousel.scrollTo({ left: idx * carousel.clientWidth, behavior: 'smooth' });
    });
  });
}

// ============ 初始化 ============
function init() {
  // 恢復側邊欄狀態（僅桌面版）
  if (window.innerWidth >= 1024) {
    try {
      const savedSidebarState = localStorage.getItem(STORAGE_KEYS.sidebarOpen);
      if (savedSidebarState === 'true') {
        // 延遲打開，避免動畫問題
        setTimeout(() => toggleSidebar(), 100);
      }
    } catch {}
  }
  // 初始化 Sticky Header
  initStickyHeader();
  // 初始化區塊導航 toggle
  initSectionNav();
}

// 🎨 圖片優化：初始化圖片處理系統
ImageOptimizer.initImageOptimization();

initSearch();
renderBanner();
init();
loadData().then(applyUrlParams);
// 只在分頁可見時 refresh，分頁回到前景立即抓一次（背景分頁不浪費流量）
setInterval(() => { if (!document.hidden) loadData(); }, CONFIG.REFRESH_INTERVAL);
document.addEventListener('visibilitychange', () => { if (!document.hidden) loadData(); });

// 分享功能
function shareWebsite() {
  const shareData = {
    title: '🦅 鷹家Fun生買物社',
    text: '精選團購 · 優質好物',
    url: window.location.href
  };
  
  if (navigator.share) {
    navigator.share(shareData).then(() => {
      if (typeof gtag !== 'undefined') {
        gtag('event', 'share', {
          method: 'Web Share API',
          content_type: 'website',
          event_category: 'engagement'
        });
      }
    }).catch(() => {});
  } else {
    navigator.clipboard.writeText(window.location.href).then(() => {
      elements.copyToast.textContent = '✓ 連結已複製！快分享給朋友';
      elements.copyToast.style.opacity = '1';
      elements.copyToast.style.transform = 'translateX(0)';
      setTimeout(() => {
        elements.copyToast.style.opacity = '0';
        elements.copyToast.style.transform = 'translateX(200%)';
      }, 2000);
      
      if (typeof gtag !== 'undefined') {
        gtag('event', 'share', {
          method: 'Copy Link',
          content_type: 'website',
          event_category: 'engagement'
        });
      }
    });
  }
}


// 讓 HTML 的 onclick 屬性可以調用這些函數
window.scrollToSection = scrollToSection;
window.openVideoModal = openVideoModal;
window.closeVideoModal = closeVideoModal;
window.copyCoupon = copyCoupon;
window.openNote = openNote;
window.addToCalendar = addToCalendar;
window.addBothToCalendar = addBothToCalendar;
window.showDayGroups = showDayGroups;
window.toggleExpired = toggleExpired;
window.openWishlistModal = openWishlistModal;
window.closeWishlistModal = closeWishlistModal;
window.openContactModal = openContactModal;
window.closeContactModal = closeContactModal;
window.scrollToCard = scrollToCard;
window.switchCalendarMonth = switchCalendarMonth;
window.addToGoogleCalendar = addToGoogleCalendar;
window.addToAppleCalendar = addToAppleCalendar;
window.addBothToGoogleCalendar = addBothToGoogleCalendar;
window.addBothToAppleCalendar = addBothToAppleCalendar;
window.showCalendarChoice = showCalendarChoice;
window.subscribeAllGroups = subscribeAllGroups;
window.setFilter = setFilter;

window.shareWebsite = shareWebsite;
window.clearAllFilters = clearAllFilters;
window.getTodayDeadlines = getTodayDeadlines;
window.formatTimeRemaining = formatTimeRemaining;
