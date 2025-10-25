// ============ åœ–ç‰‡è™•ç†å·¥å…· (ENHANCED VERSION) ============
const ImageHelper = {
  normalizeGoogleDriveUrl(url) {
    if (!url || typeof url !== 'string') return null;
    
    // Keep lh3 format as-is (fastest)
    if (url.includes('lh3.googleusercontent.com/d/')) {
      return url;
    }
    
    let fileId = null;
    const patterns = [
      /lh3\.googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/,
      /\/file\/d\/([a-zA-Z0-9_-]+)/,
      /\/d\/([a-zA-Z0-9_-]+)/,
      /[?&]id=([a-zA-Z0-9_-]+)/,
      /([a-zA-Z0-9_-]{25,})/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1] && match[1].length >= 25) {
        fileId = match[1];
        break;
      }
    }
    
    if (!fileId) return url;
    return `https://lh3.googleusercontent.com/d/${fileId}=w1200`;
  },

  getFallbackUrls(primaryUrl) {
    const fallbacks = [];
    if (!primaryUrl) return fallbacks;
    
    const fileId = this.extractFileId(primaryUrl);
    
    if (fileId) {
      // ✅ Use lh3 as primary (fastest and most reliable)
      if (!primaryUrl.includes('lh3.googleusercontent.com')) {
        fallbacks.push(`https://lh3.googleusercontent.com/d/${fileId}=w1200`);
      }
      fallbacks.push(`https://lh3.googleusercontent.com/d/${fileId}=w800`);
      fallbacks.push(`https://lh3.googleusercontent.com/d/${fileId}=w400`);
      // ✅ Add thumbnail as fallback
      fallbacks.push(`https://drive.google.com/thumbnail?id=${fileId}&sz=w800`);
      fallbacks.push(`https://drive.google.com/uc?export=view&id=${fileId}`);
    }
    
    // ✅ Always include original URL if not already there
    if (primaryUrl && !fallbacks.includes(primaryUrl)) {
      fallbacks.unshift(primaryUrl);
    }
    
    return [...new Set(fallbacks)];
  },
  
  // ✅ NEW: Get a placeholder SVG for missing images
  getPlaceholderSvg() {
    return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23fef3c7" width="400" height="300"/%3E%3Ctext x="50%25" y="45%25" text-anchor="middle" fill="%23d97706" font-size="48"%3E🦅%3C/text%3E%3Ctext x="50%25" y="60%25" text-anchor="middle" fill="%2378350f" font-size="14"%3E鷹家買物社%3C/text%3E%3C/svg%3E';
  },
  
  extractFileId(url) {
    if (!url) return null;
    
    const patterns = [
      /lh3\.googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/,
      /\/file\/d\/([a-zA-Z0-9_-]+)/,
      /\/d\/([a-zA-Z0-9_-]+)/,
      /[?&]id=([a-zA-Z0-9_-]+)/,
      /([a-zA-Z0-9_-]{25,})/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1] && match[1].length >= 25) {
        return match[1];
      }
    }
    return null;
  }
};


// ============ å„ªåŒ–çš„åœ–ç‰‡åˆå§‹åŒ–å‡½æ•¸ ============
function initializeImages() {
  const allImages = document.querySelectorAll('.masonry-card-image, .carousel-image');
  
  allImages.forEach((img) => {
    const wrapper = img.closest('.masonry-card-image-wrapper');
    if (!wrapper) return;
    
    const originalSrc = img.getAttribute('data-src') || img.getAttribute('src');
    if (!originalSrc || originalSrc.startsWith('data:image/svg')) return;
    
    wrapper.classList.add('loading');
    wrapper.classList.remove('loaded', 'error');
    
    const normalizedUrl = ImageHelper.normalizeGoogleDriveUrl(originalSrc);
    const fallbackUrls = ImageHelper.getFallbackUrls(normalizedUrl || originalSrc);
    
    let currentAttempt = 0;
    
    function tryLoad() {
      if (currentAttempt >= fallbackUrls.length) {
        wrapper.classList.remove('loading');
        wrapper.classList.add('error');
        img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23fee2e2" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="%23ef4444" font-size="14"%3Eç„¡æ³•è¼‰å…¥%3C/text%3E%3C/svg%3E';
        return;
      }
      
      const testImg = new Image();
      const timeout = setTimeout(() => {
        testImg.src = '';
        currentAttempt++;
        tryLoad();
      }, 5000);
      
      testImg.onload = function() {
        clearTimeout(timeout);
        img.src = fallbackUrls[currentAttempt];
        img.removeAttribute('data-src');
        wrapper.classList.remove('loading');
        wrapper.classList.add('loaded');
        
        const ratio = this.naturalWidth / this.naturalHeight;
        if (ratio > 1.7) img.setAttribute('data-aspect', 'wide');
        else if (ratio < 0.7) img.setAttribute('data-aspect', 'tall');
      };
      
      testImg.onerror = function() {
        clearTimeout(timeout);
        currentAttempt++;
        tryLoad();
      };
      
      testImg.src = fallbackUrls[currentAttempt];
    }
    
    tryLoad();
  });
}

// ============ å´é‚Šæ¬„å’Œç¯©é¸å™¨æŽ§åˆ¶ ============
let sidebarOpen = false;
let mobileFiltersOpen = false;

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
  
  try {
    localStorage.setItem(STORAGE_KEYS.sidebarOpen, String(sidebarOpen));
  } catch {}
  
  if (typeof gtag !== 'undefined') {
    gtag('event', 'toggle_sidebar', {
      'action': sidebarOpen ? 'open' : 'close',
      'event_category': 'engagement'
    });
  }
}

function toggleMobileFilters() {
  mobileFiltersOpen = !mobileFiltersOpen;
  const panel = document.getElementById('mobileFiltersPanel');
  const btnText = document.getElementById('filterBtnText');
  
  if (mobileFiltersOpen) {
    panel.style.maxHeight = '500px';
    btnText.textContent = 'æ”¶åˆ';
  } else {
    panel.style.maxHeight = '0';
    btnText.textContent = 'ç¯©é¸';
  }
  
  if (typeof gtag !== 'undefined') {
    gtag('event', 'toggle_mobile_filters', {
      'action': mobileFiltersOpen ? 'open' : 'close',
      'event_category': 'engagement'
    });
  }
}

function clearAllFilters() {
  state.searchTerm = '';
  state.selectedCategory = 'all';
  state.selectedCountry = 'all';
  
  if (elements.searchInput) {
    elements.searchInput.value = '';
  }
  
  try {
    localStorage.setItem(STORAGE_KEYS.search, '');
    localStorage.setItem(STORAGE_KEYS.category, 'all');
    localStorage.setItem(STORAGE_KEYS.country, 'all');
  } catch {}
  
  elements.clearBtn?.classList.add('hidden');
  
  if (typeof gtag !== 'undefined') {
    gtag('event', 'clear_all_filters', {
      'event_category': 'engagement'
    });
  }
  
  renderFilters();
  renderContent();
}

// ============ é…ç½® ============
const CONFIG = {
  SHEET_ID: '1-RuyD9eCkrDpgFFXGHRWaTF-LYKaDK-MxAw3uNMozeU',
  
  CATEGORY_ICONS: {
    'é£Ÿå“': 'ðŸ±',
    'æ¯å¬°': 'ðŸ‘¶',
    'æœé£¾': 'ðŸ‘•',
    'ç¾Žå¦': 'ðŸ’„',
    'å±…å®¶': 'ðŸ ',
    '3c': 'ðŸ“±',
    'æ—…éŠ': 'âœˆï¸',
    'é‹å‹•': 'ðŸƒ',
    'å¯µç‰©': 'ðŸ¾',
    'å…¶ä»–': 'ðŸŽ'
  },
  
  CATEGORY_COLORS: {
    'é£Ÿå“': 'bg-orange-100 text-orange-700 border-orange-300',
    'æ¯å¬°': 'bg-pink-100 text-pink-700 border-pink-300',
    'æœé£¾': 'bg-purple-100 text-purple-700 border-purple-300',
    'ç¾Žå¦': 'bg-rose-100 text-rose-700 border-rose-300',
    'å±…å®¶': 'bg-green-100 text-green-700 border-green-300',
    '3c': 'bg-blue-100 text-blue-700 border-blue-300',
    'æ—…éŠ': 'bg-sky-100 text-sky-700 border-sky-300',
    'é‹å‹•': 'bg-cyan-100 text-cyan-700 border-cyan-300',
    'å¯µç‰©': 'bg-amber-100 text-amber-700 border-amber-300',
    'å…¶ä»–': 'bg-gray-100 text-gray-700 border-gray-300'
  },
  
  COUNTRY_FLAGS: {
    'å°ç£': 'ðŸ‡¹ðŸ‡¼',
    'æ—¥æœ¬': 'ðŸ‡¯ðŸ‡µ',
    'éŸ“åœ‹': 'ðŸ‡°ðŸ‡·',
    'ç¾Žåœ‹': 'ðŸ‡ºðŸ‡¸',
    'æ­æ´²': 'ðŸ‡ªðŸ‡º',
    'æ³°åœ‹': 'ðŸ‡¹ðŸ‡­',
    'æ±å—äºž': 'ðŸŒ',
    'ä¸­åœ‹': 'ðŸ‡¨ðŸ‡³',
    'é¦™æ¸¯': 'ðŸ‡­ðŸ‡°',
    'æ­ç›Ÿ': 'ðŸ‡ªðŸ‡º',
    'æ­å·ž': 'ðŸ‡ªðŸ‡º',
    'å…¶ä»–': 'ðŸŒ'
  },
  
  BANNER_IMAGE_URL: "",
  BANNER_LINK_URL: "",
  REFRESH_INTERVAL: 5 * 60 * 1000,
  SEARCH_DEBOUNCE: 120,
  MOBILE_FILTER_VISIBLE: 12
};

const STORAGE_KEYS = {
  search: 'eg_search',
  showExpired: 'eg_show_expired',
  month: 'eg_month',
  category: 'eg_category',
  country: 'eg_country',
  sidebarOpen: 'eg_sidebar_open'
};

// ============ ç‹€æ…‹ç®¡ç† ============
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
  availableCategories: [],
  availableCountries: []
};

// ============ å·¥å…·å‡½æ•¸ ============
const utils = {
  isURL: s => !!s && /^https?:\/\//i.test(s),
  isQA: s => !!s && s.includes('Q:') && s.includes('|A:'),
  normalizeBrand: s => (s || '').toLowerCase().replace(/\s+/g, '').trim(),
  isProbablyHTML: t => /<\/?html[\s>]/i.test(t) || /accounts\.google\.com/.test(t),
  formatCount: n => n > 99 ? '99+' : n > 9 ? '9+' : String(n),
  normalizeFilterValue: v => (v || '').toLowerCase().trim(),
  
  getCategoryIcon: name => {
    const normalized = utils.normalizeFilterValue(name);
    for (const [key, icon] of Object.entries(CONFIG.CATEGORY_ICONS)) {
      if (utils.normalizeFilterValue(key) === normalized) {
        return icon;
      }
    }
    return 'ðŸ“¦';
  },
  
  getCategoryColor: name => {
    const normalized = utils.normalizeFilterValue(name);
    for (const [key, color] of Object.entries(CONFIG.CATEGORY_COLORS)) {
      if (utils.normalizeFilterValue(key) === normalized) {
        return color;
      }
    }
    return 'bg-gray-100 text-gray-700 border-gray-300';
  },
  
  getCountryFlag: name => {
    const normalized = utils.normalizeFilterValue(name);
    for (const [key, flag] of Object.entries(CONFIG.COUNTRY_FLAGS)) {
      if (utils.normalizeFilterValue(key) === normalized) {
        return flag;
      }
    }
    return 'ðŸŒ';
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
      .replace(/[|ï½œ]\s*A\s*[ï¼š:]/g, '|A:')
      .replace(/Q\s*[ï¼š:]/g, 'Q:');
    const separated = norm.replace(/(\|A:[^\n]*?)\s+(?=Q:\s*)/g, '$1\n');
    const chunks = separated.split(/(?=Q:\s*)/g).map(s => s.trim()).filter(s => s.startsWith('Q:'));
    return chunks.map(chunk => {
      const m = chunk.match(/^Q:\s*(.*?)\s*\|A:\s*([\s\S]*?)$/);
      return m ? { q: m[1].trim(), a: m[2].trim() } : null;
    }).filter(Boolean);
  },

  getTodayEndingGroups(groups) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return groups.filter(g => {
      const daysLeft = this.getDaysLeft(g.endDate);
      return daysLeft === 0;
    });
  }
};

// ============ å€’æ•¸è¨ˆæ™‚å™¨ ============
let countdownInterval = null;

function startCountdown() {
  const countdownEl = document.getElementById('todayEndingCountdown');
  if (!countdownEl) return;
  
  function updateCountdown() {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(23, 59, 59, 999);
    
    const diff = midnight - now;
    
    if (diff <= 0) {
      countdownEl.textContent = 'å·²çµæŸ';
      if (countdownInterval) clearInterval(countdownInterval);
      return;
    }
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    countdownEl.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  
  updateCountdown();
  if (countdownInterval) clearInterval(countdownInterval);
  countdownInterval = setInterval(updateCountdown, 1000);
}

// ============ DOM å…ƒç´ ç·©å­˜ ============
const elements = {
  content: document.getElementById('content'),
  searchInput: document.getElementById('searchInput'),
  clearBtn: document.getElementById('clearBtn'),
  sectionButtons: document.getElementById('sectionButtons'),
  copyToast: document.getElementById('copyToast'),
  videoModal: document.getElementById('videoModal'),
  videoContainer: document.getElementById('videoContainer'),
  bannerSlot: document.getElementById('bannerSlot'),
  categoryFilters: document.getElementById('categoryFilters'),
  countryFilters: document.getElementById('countryFilters'),
  categoryExpand: document.getElementById('categoryExpand'),
  countryExpand: document.getElementById('countryExpand'),
  categoryExpandContent: document.getElementById('categoryExpandContent'),
  countryExpandContent: document.getElementById('countryExpandContent'),
  desktopCategoryFilters: document.getElementById('desktopCategoryFilters'),
  desktopCountryFilters: document.getElementById('desktopCountryFilters')
};

// ============ ç¯©é¸åŠŸèƒ½ ============
function setFilter(type, value) {
  if (type === 'category') {
    state.selectedCategory = value;
    try {
      localStorage.setItem(STORAGE_KEYS.category, value);
    } catch {}
    
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
    
    if (typeof gtag !== 'undefined' && value !== 'all') {
      gtag('event', 'filter_country', {
        'country': value,
        'event_category': 'engagement'
      });
    }
  }
  
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
    if (g.itemCategory && g.itemCategory.trim()) {
      const categories = g.itemCategory.split(/[,ï¼Œ]/).map(c => c.trim()).filter(c => c);
      categories.forEach(cat => {
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      });
    }
    
    if (g.itemCountry && g.itemCountry.trim()) {
      const countries = g.itemCountry.split(/[,ï¼Œ]/).map(c => c.trim()).filter(c => c);
      countries.forEach(country => {
        countryCounts[country] = (countryCounts[country] || 0) + 1;
      });
    }
  });
  
  return { categoryCounts, countryCounts };
}

function renderFilters() {
  const { categoryCounts, countryCounts } = getFilterCounts();
  renderMobileFilters(categoryCounts, countryCounts);
  renderDesktopFilters(categoryCounts, countryCounts);
}

function renderMobileFilters(categoryCounts, countryCounts) {
  elements.categoryFilters.innerHTML = `
    <button onclick="setFilter('category', 'all')" 
            class="px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap ${state.selectedCategory === 'all' ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-700'}">
      å…¨éƒ¨ (${categoryCounts.all || 0})
    </button>
  ` + state.availableCategories.map(cat => `
    <button onclick="setFilter('category', '${cat}')" 
            class="px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap ${
              state.selectedCategory === cat ? 'bg-amber-600 text-white' : utils.getCategoryColor(cat)
            }">
      ${utils.getCategoryIcon(cat)} ${cat} ${categoryCounts[cat] ? `(${categoryCounts[cat]})` : ''}
    </button>
  `).join('');
  
  elements.countryFilters.innerHTML = `
    <button onclick="setFilter('country', 'all')" 
            class="px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap ${state.selectedCountry === 'all' ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-700'}">
      å…¨éƒ¨ (${countryCounts.all || 0})
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
  elements.desktopCategoryFilters.innerHTML = `
    <button onclick="setFilter('category', 'all')" 
            class="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              state.selectedCategory === 'all' ? 'bg-amber-600 text-white font-medium' : 'hover:bg-gray-100 text-gray-700'
            }">
      å…¨éƒ¨ (${categoryCounts.all || 0})
    </button>
  ` + state.availableCategories.map(cat => `
    <button onclick="setFilter('category', '${cat}')" 
            class="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              state.selectedCategory === cat ? 'bg-amber-600 text-white font-medium' : 'hover:bg-gray-100'
            }">
      ${utils.getCategoryIcon(cat)} ${cat} ${categoryCounts[cat] ? `(${categoryCounts[cat]})` : ''}
    </button>
  `).join('');
  
  elements.desktopCountryFilters.innerHTML = `
    <button onclick="setFilter('country', 'all')" 
            class="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              state.selectedCountry === 'all' ? 'bg-amber-600 text-white font-medium' : 'hover:bg-gray-100 text-gray-700'
            }">
      å…¨éƒ¨ (${countryCounts.all || 0})
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

// ============ è¼ªæ’­åŠŸèƒ½ ============
const carouselStates = new Map();

function initializeCarousels() {
  const carousels = document.querySelectorAll('.image-carousel');
  
  carousels.forEach(carousel => {
    const id = carousel.getAttribute('data-carousel-id');
    const images = carousel.querySelectorAll('.carousel-image');
    const dots = carousel.parentElement.querySelector('.carousel-dots');
    
    if (images.length <= 1) {
      if (dots) dots.style.display = 'none';
      return;
    }
    
    carouselStates.set(id, {
      currentIndex: 0,
      totalImages: images.length,
      autoplayInterval: null
    });
    
    const state = carouselStates.get(id);
    
    function updateCarousel() {
      images.forEach((img, idx) => {
        img.classList.toggle('active', idx === state.currentIndex);
      });
      
      if (dots) {
        const dotElements = dots.querySelectorAll('.carousel-dot');
        dotElements.forEach((dot, idx) => {
          dot.classList.toggle('active', idx === state.currentIndex);
        });
      }
    }
    
    function nextImage() {
      state.currentIndex = (state.currentIndex + 1) % state.totalImages;
      updateCarousel();
    }
    
    if (state.autoplayInterval) clearInterval(state.autoplayInterval);
    state.autoplayInterval = setInterval(nextImage, 3000);
    
    updateCarousel();
  });
}

function goToSlide(carouselId, index) {
  const state = carouselStates.get(carouselId);
  if (!state) return;
  
  state.currentIndex = index;
  const carousel = document.querySelector(`[data-carousel-id="${carouselId}"]`);
  if (!carousel) return;
  
  const images = carousel.querySelectorAll('.carousel-image');
  images.forEach((img, idx) => {
    img.classList.toggle('active', idx === state.currentIndex);
  });
  
  const dots = carousel.parentElement.querySelector('.carousel-dots');
  if (dots) {
    const dotElements = dots.querySelectorAll('.carousel-dot');
    dotElements.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === state.currentIndex);
    });
  }
  
  if (state.autoplayInterval) {
    clearInterval(state.autoplayInterval);
    state.autoplayInterval = setInterval(() => nextSlide(carouselId), 3000);
  }
}

function nextSlide(carouselId) {
  const state = carouselStates.get(carouselId);
  if (!state) return;
  
  state.currentIndex = (state.currentIndex + 1) % state.totalImages;
  goToSlide(carouselId, state.currentIndex);
}

function prevSlide(carouselId) {
  const state = carouselStates.get(carouselId);
  if (!state) return;
  
  state.currentIndex = (state.currentIndex - 1 + state.totalImages) % state.totalImages;
  goToSlide(carouselId, state.currentIndex);
}

// ============ Banner æ¸²æŸ“ ============
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

// ============ å½±ç‰‡è™•ç† ============
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

// ============ å…¨åŸŸå‡½æ•¸ï¼ˆä¾› HTML èª¿ç”¨ï¼‰============
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
  }).catch(() => alert('è¤‡è£½å¤±æ•—ï¼Œè«‹æ‰‹å‹•è¤‡è£½ï¼š' + txt));
}

function openNote(ev, url) {
  ev.stopPropagation();
  window.open(url, '_blank');
}

// ============ è¡Œäº‹æ›†æŒ‰éˆ•åŠŸèƒ½ ============
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
        <h3 class="text-lg font-bold text-gray-900 mb-4 text-center">é¸æ“‡è¡Œäº‹æ›†</h3>
        ${isBoth ? '<p class="text-sm text-gray-600 mb-4 text-center">å°‡åŠ å…¥é–‹åœ˜å’Œæˆªæ­¢å…©å€‹æé†’</p>' : ''}
        <div class="space-y-3">
          <button onclick="${isBoth ? `addBothToGoogleCalendar('${brand.replace(/'/g, "\\'")}', '${startDate}', '${endDate}', '${url}')` : `addToGoogleCalendar('${title.replace(/'/g, "\\'")}', '${date}', '${url}', '${description.replace(/'/g, "\\'")}')` }; this.closest('.fixed').remove();" 
                  class="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google æ—¥æ›†
          </button>
          
          <button onclick="${isBoth ? `addBothToAppleCalendar('${brand.replace(/'/g, "\\'")}', '${startDate}', '${endDate}', '${url}')` : `addToAppleCalendar('${title.replace(/'/g, "\\'")}', '${date}', '${url}', '${description.replace(/'/g, "\\'")}')` }; this.closest('.fixed').remove();" 
                  class="w-full bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
            iOS æ—¥æ›†
          </button>
          
          <button onclick="this.closest('.fixed').remove()" 
                  class="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors">
            å–æ¶ˆ
          </button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modal);
}

function addToGoogleCalendar(title, date, url, description) {
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = utils.parseDateSafe(dateStr);
    if (!d) return '';
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    return `${year}${month}${day}T235900`;
  };
  
  const dateFormatted = formatDate(date);
  
  let desc = description || 'ðŸ›’ é·¹å®¶Funç”Ÿè²·ç‰©ç¤¾åœ˜è³¼';
  if (url) {
    desc += `\n\nðŸ”— åœ˜è³¼é€£çµ:${url}`;
  }
  
  const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${dateFormatted}/${dateFormatted}&details=${encodeURIComponent(desc)}&trp=false`;
  
  window.open(calendarUrl, '_blank', 'noopener,noreferrer');
}

function addToAppleCalendar(title, date, url, description) {
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = utils.parseDateSafe(dateStr);
    if (!d) return '';
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    return `${year}${month}${day}T235900`;
  };
  
  const dateFormatted = formatDate(date);
  
  let desc = description || 'ðŸ›’ é·¹å®¶Funç”Ÿè²·ç‰©ç¤¾åœ˜è³¼';
  if (url) {
    desc += '\\n\\nðŸ”— åœ˜è³¼é€£çµ:' + url;
  }
  
  const icalContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//é·¹å®¶Funç”Ÿè²·ç‰©ç¤¾//NONSGML Event//EN',
    'BEGIN:VEVENT',
    `UID:${Date.now()}-${Math.random().toString(36).substr(2, 9)}@eaglish.store`,
    `DTSTAMP:${dateFormatted}`,
    `DTSTART:${dateFormatted}`,
    `DTEND:${dateFormatted}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${desc}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'BEGIN:VALARM',
    'TRIGGER:-PT24H',
    'ACTION:DISPLAY',
    'DESCRIPTION:æ˜Žå¤©å°±è¦æˆªæ­¢äº†!',
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
  addToGoogleCalendar(`${brand} - é–‹åœ˜`, startDate, url, 'ðŸŽ‰ åœ˜è³¼é–‹å§‹!');
  setTimeout(() => {
    addToGoogleCalendar(`${brand} - æˆªæ­¢`, endDate, url, 'â° ä»Šå¤©æ˜¯æœ€å¾Œä¸€å¤©!è¨˜å¾—ä¸‹å–®');
  }, 500);
}

function addBothToAppleCalendar(brand, startDate, endDate, url) {
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = utils.parseDateSafe(dateStr);
    if (!d) return '';
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    return `${year}${month}${day}T235900`;
  };
  
  const startFormatted = formatDate(startDate);
  const endFormatted = formatDate(endDate);
  
  const icalContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//é·¹å®¶Funç”Ÿè²·ç‰©ç¤¾//NONSGML Event//EN',
    'BEGIN:VEVENT',
    `UID:${Date.now()}-start@eaglish.store`,
    `DTSTAMP:${startFormatted}`,
    `DTSTART:${startFormatted}`,
    `DTEND:${startFormatted}`,
    `SUMMARY:${brand} - é–‹åœ˜`,
    `DESCRIPTION:ðŸŽ‰ åœ˜è³¼é–‹å§‹!\\n\\nðŸ”— åœ˜è³¼é€£çµ:${url || ''}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'BEGIN:VEVENT',
    `UID:${Date.now()}-end@eaglish.store`,
    `DTSTAMP:${endFormatted}`,
    `DTSTART:${endFormatted}`,
    `DTEND:${endFormatted}`,
    `SUMMARY:${brand} - æˆªæ­¢`,
    `DESCRIPTION:â° ä»Šå¤©æ˜¯æœ€å¾Œä¸€å¤©!è¨˜å¾—ä¸‹å–®\\n\\nðŸ”— åœ˜è³¼é€£çµ:${url || ''}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT24H',
    'ACTION:DISPLAY',
    'DESCRIPTION:æ˜Žå¤©å°±è¦æˆªæ­¢äº†!',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
  
  const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${brand.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}_åœ˜è³¼.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ============ è¡Œäº‹æ›†ç›¸é—œ ============
function showDayGroups(day) {
  const { currentMonth, currentYear, groupsByDateEnd, groupsByDateStart } = getCalendarData(state.selectedCalendarMonth);
  const endList = groupsByDateEnd[day] || [];
  const startList = groupsByDateStart[day] || [];

  const card = g => `
    <div class="bg-amber-50 border-2 border-amber-200 rounded-lg p-3 mb-2">
      <div class="font-bold text-amber-900 text-center">${g.brand || ''}</div>
      ${g.productName ? `<div class="text-sm text-gray-600 text-center mt-1">${g.productName}</div>` : ''}
      ${g.url ? `<a href="${g.url}" target="_blank" rel="noopener noreferrer" class="block w-full mt-2 bg-amber-600 text-white px-3 py-2 rounded text-sm text-center hover:bg-amber-700">å‰å¾€åœ˜è³¼</a>` : ''}
    </div>`;

  const modal = `
    <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onclick="this.remove()">
      <div class="bg-white rounded-xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto" onclick="event.stopPropagation()">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xl font-bold text-amber-900">${currentYear}å¹´ ${currentMonth + 1}æœˆ ${day}æ—¥</h3>
          <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700 text-2xl">Ã—</button>
        </div>
        ${startList.length ? `<h4 class="font-bold text-teal-700 mb-2">ç•¶æ—¥é–‹åœ˜ï¼ˆ${startList.length}ï¼‰</h4>${startList.map(card).join('')}` : ''}
        ${endList.length ? `<h4 class="font-bold text-red-700 mt-4 mb-2">ç•¶æ—¥æˆªæ­¢ï¼ˆ${endList.length}ï¼‰</h4>${endList.map(card).join('')}` : ''}
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
  ['æ—¥', 'ä¸€', 'äºŒ', 'ä¸‰', 'å››', 'äº”', 'å…­'].forEach(n => {
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
  const monthName = `${curY}å¹´${curM + 1}æœˆ`;

  const monthlyGroups = [];

  state.groups.forEach(g => {
    const st = utils.parseDateSafe(g.startDate);
    if (st && st.getMonth() === curM && st.getFullYear() === curY) {
      const isExpired = utils.isExpired(g.endDate);
      monthlyGroups.push({
        brand: g.brand,
        productName: g.productName,
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
        productName: '',
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
          <p class="text-sm">ðŸ”­ æœ¬æœˆæš«ç„¡é–‹åœ˜é …ç›®</p>
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
              ${g.isUpcoming ? '<span class="text-xs bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">å³å°‡é–‹åœ˜</span>' : ''}
              ${g.isExpired ? '<span class="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">å·²çµæŸ</span>' : ''}
            </div>
            
            <div class="text-xs ${g.isExpired ? 'text-gray-400' : 'text-gray-600'} space-y-0.5">
              ${startDateStr ? `<div class="flex items-center gap-1"><span>ðŸ“…</span><span>é–‹åœ˜:${startDateStr}</span></div>` : ''}
              ${endDateStr ? `<div class="flex items-center gap-1"><span>â°</span><span>æˆªæ­¢:${endDateStr}</span></div>` : ''}
            </div>
          </div>
          
          <div class="flex flex-col gap-2 flex-shrink-0">
            ${g.url && !g.isUpcoming ? `
              <a href="${g.url}" 
                 target="_blank" 
                 rel="noopener noreferrer" 
                 onclick="event.stopPropagation()"
                 class="${g.isExpired ? 'bg-gray-400' : 'bg-teal-600 hover:bg-teal-700'} text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors text-center">
                å‰å¾€
              </a>
            ` : ''}
            ${g.startDate && g.endDate && !g.isExpired ? `
              <button onclick="addBothToCalendar(event, '${g.brand.replace(/'/g, "\\'")}', '${g.startDate}', '${g.endDate}', '${g.url}')" 
                      class="bg-blue-50 border border-blue-300 text-blue-600 px-3 py-2 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors whitespace-nowrap">
                ðŸ“… è¡Œäº‹æ›†
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
              <span class="text-2xl">ðŸ“‹</span>
              <div>
                <h3 class="font-bold text-teal-900">${monthName} å³å°‡é–‹åœ˜ç¸½è¡¨</h3>
                <p class="text-xs text-teal-700 mt-0.5">å…± ${monthlyGroups.length} å€‹åœ˜è³¼é …ç›®</p>
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

// ============ æœå°‹åŠŸèƒ½ ============
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

// ============ è³‡æ–™è¼‰å…¥ ============
function showError(msg) {
  state.error = msg;
  state.loading = false;
  elements.content.innerHTML = `
    <div class="flex items-center justify-center min-h-[40vh]">
      <div class="text-center">
        <div class="text-4xl mb-4">âš ï¸</div>
        <div class="text-xl text-red-600 font-bold mb-4">${msg}</div>
        <button onclick="location.reload()" class="bg-amber-600 text-white px-6 py-2 rounded-lg hover:bg-amber-700">é‡æ–°æ•´ç†</button>
      </div>
    </div>`;
}

async function loadUpcomingFromTab() {
  try {
    const UPCOMING_CSV = `https://docs.google.com/spreadsheets/d/${CONFIG.SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent('å³å°‡é–‹åœ˜')}`;
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
          const brand = (row['å“ç‰Œ'] || row['Brand'] || '').trim();
          if (!brand) return;
          out.push({
            id: 'u-tab-' + (i + 1),
            brand,
            productName: row['å•†å“åç¨±'] || row['ProductName'] || row['product_name'] || '',
            startDate: row['é–‹åœ˜æ—¥æœŸ'] || row['StartDate'] || '',
            endDate: row['çµæŸæ—¥æœŸ'] || row['EndDate'] || '',
            image: row['åœ–ç‰‡ç¶²å€'] || row['image'] || ''
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
    const csv = await res.text();

    if (utils.isProbablyHTML(csv)) {
      showError('Google Sheet ç„¡æ³•å…¬é–‹è®€å–ã€‚è«‹å°‡æ¬Šé™æ”¹ç‚ºã€ŒçŸ¥é“é€£çµçš„ä»»ä½•äººå¯æª¢è¦–ã€,æˆ–ä½¿ç”¨ã€Œæª”æ¡ˆ â†’ ç™¼ä½ˆåˆ°ç¶²è·¯ä¸Šã€ã€‚');
      return;
    }

    const all = [];
    Papa.parse(csv, {
      header: true,
      skipEmptyLines: true,
      transformHeader: h => (h || '').trim(),
      complete: r => {
        (r.data || []).forEach((row, i) => {
          const brand = (row['å“ç‰Œ'] || row['Brand'] || '').trim();
          const url = (row['é€£çµ'] || row['URL'] || row['Link'] || '').trim();
          if (!brand || brand.includes('---') || brand.includes('===')) return;

          const typeRaw = String(row['é¡žåž‹'] || row['Type'] || '').toLowerCase();
          let category = 'short';
          if (/é•·æœŸ|long/.test(typeRaw)) category = 'long';
          else if (/æŠ˜æ‰£|coupon|affiliate/.test(typeRaw)) category = 'coupon';
          else if (/å³å°‡|upcoming/.test(typeRaw)) category = 'upcoming';

          all.push({
            id: i + 1,
            brand,
            productName: row['å•†å“åç¨±'] || row['ProductName'] || row['product_name'] || '',
            url,
            startDate: row['é–‹åœ˜æ—¥æœŸ'] || row['StartDate'] || '',
            endDate: row['çµæŸæ—¥æœŸ'] || row['EndDate'] || '',
            category,
            image: row['åœ–ç‰‡ç¶²å€'] || row['image'] || '',
            description: row['å•†å“æè¿°'] || row['Description'] || '',
            stock: row['åº«å­˜ç‹€æ…‹'] || row['Stock'] || '',
            tag: row['æ¨™ç±¤'] || row['Tag'] || '',
            coupon: row['æŠ˜æ‰£ç¢¼'] || row['Coupon'] || row['DiscountCode'] || '',
            note: row['å‚™è¨»'] || row['Note'] || row['Remark'] || '',
            video: row['å½±ç‰‡ç¶²å€'] || row['Video'] || row['VideoURL'] || '',
            itemCategory: row['åˆ†é¡ž'] || row['Category'] || '',
            itemCountry: row['åœ‹å®¶'] || row['Country'] || ''
          });
        });
      }
    });

    state.groups = all.filter(g => g.category !== 'upcoming' && !!g.url);

    const categoriesSet = new Set();
    const countriesSet = new Set();
    
    state.groups.forEach(g => {
      if (g.itemCategory && g.itemCategory.trim()) {
        const categories = g.itemCategory.split(/[,ï¼Œ]/).map(c => c.trim()).filter(c => c);
        categories.forEach(cat => categoriesSet.add(cat));
      }
      
      if (g.itemCountry && g.itemCountry.trim()) {
        const countries = g.itemCountry.split(/[,ï¼Œ]/).map(c => c.trim()).filter(c => c);
        countries.forEach(country => countriesSet.add(country));
      }
    });
    
    state.availableCategories = Array.from(categoriesSet).sort();
    
    state.availableCountries = Array.from(countriesSet).sort((a, b) => {
      const sensitiveCountries = ['ä¸­åœ‹', 'é¦™æ¸¯'];
      const aIsSensitive = sensitiveCountries.includes(a);
      const bIsSensitive = sensitiveCountries.includes(b);
      
      if (aIsSensitive && !bIsSensitive) return 1;
      if (!aIsSensitive && bIsSensitive) return -1;
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
    renderFilters();
    renderContent();
  } catch {
    showError('ç„¡æ³•é€£æŽ¥è³‡æ–™ä¾†æº(ç¶²è·¯æˆ–æ¬Šé™å•é¡Œ)');
  }
}

// ============ å¡ç‰‡æ¸²æŸ“ ============
function renderUpcomingSearchCard(g) {
  return `
    <div class="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl overflow-hidden border-2 border-pink-200 shadow-md transition-all hover:shadow-lg">
      ${g.image ? `<div class="w-full h-40 bg-gray-100"><img src="${g.image}" class="w-full h-full object-cover" loading="lazy" alt="${g.brand || ''}"></div>` : ''}
      <div class="p-5">
        <div class="flex items-center gap-2 mb-2">
          <span class="bg-pink-500 text-white px-2.5 py-0.5 rounded-full text-xs font-bold">æ•¬è«‹æœŸå¾…</span>
        </div>
        <h3 class="text-lg font-bold text-pink-900 mb-1 text-center">${g.brand || ''}</h3>
        ${g.productName ? `<p class="text-sm text-gray-600 mb-2 text-center">${g.productName}</p>` : ''}
        ${g.startDate ? `<div class="text-sm text-pink-700 mb-1">ðŸ“… é è¨ˆé–‹åœ˜:${g.startDate}</div>` : ''}
        ${g.endDate ? `<div class="text-sm text-pink-700 mb-3">â° é è¨ˆçµæŸ:${g.endDate}</div>` : ''}
        <div class="bg-white border-2 border-pink-300 rounded-lg p-3 text-center">
          <p class="text-sm text-pink-800 font-medium">åœ˜è³¼å°šæœªé–‹å§‹,è«‹å¯†åˆ‡é—œæ³¨</p>
        </div>
      </div>
    </div>`;
}

function renderGroupCard(g) {
  const daysLeft = utils.getDaysLeft(g.endDate);
  const expired = utils.isExpired(g.endDate);
  const noteIsURL = utils.isURL(g.note);
  const noteIsQA = utils.isQA(g.note);
  const qaList = noteIsQA ? utils.parseQA(g.note) : [];
  const openClass = expired ? 'from-gray-400 to-gray-500 hover:from-gray-400 hover:to-gray-500' : 'from-amber-600 to-pink-600 hover:from-amber-700 hover:to-pink-700';

  const categories = g.itemCategory ? g.itemCategory.split(/[,ï¼Œ]/).map(c => c.trim()).filter(c => c) : [];
  const countries = g.itemCountry ? g.itemCountry.split(/[,ï¼Œ]/).map(c => c.trim()).filter(c => c) : [];
  
  const categoryTags = categories.map(cat => 
    `<span class="text-xs ${utils.getCategoryColor(cat)} px-2 py-1 rounded-full border font-medium">${utils.getCategoryIcon(cat)} ${cat}</span>`
  ).join('');
  
  const countryTags = countries.map(country => 
    `<span class="text-xs bg-blue-100 text-blue-700 border-blue-300 px-2 py-1 rounded-full border font-medium">${utils.getCountryFlag(country)} ${country}</span>`
  ).join('');

  const images = g.image ? g.image.split(/[,ã€|]/).map(url => url.trim()).filter(url => url) : [];
  let imageHTML = '';

  if (images.length === 0) {
    imageHTML = '';
  } else if (images.length === 1) {
  // Single image - use data-src for lazy load
    const normalizedUrl = ImageHelper.normalizeGoogleDriveUrl(images[0]);
    imageHTML = `
      <div class="masonry-card-image-wrapper">
        ${g.url ? `
          <a href="${g.url}" target="_blank" rel="noopener noreferrer"
             onclick="event.stopPropagation(); trackImageClick('${g.brand || ''}');">
            <img data-src="${normalizedUrl || images[0]}" 
                 src="${ImageHelper.getPlaceholderSvg()}"
                 alt="${g.brand}çš„å•†å“åœ–ç‰‡" 
                 class="masonry-card-image ${expired ? 'grayscale' : ''}"
                 loading="lazy"
                 width="400"
                 height="300">
          </a>
        ` : `
          <img data-src="${normalizedUrl || images[0]}" 
               src="${ImageHelper.getPlaceholderSvg()}"
               alt="${g.brand}çš„å•†å“åœ–ç‰‡" 
               class="masonry-card-image ${expired ? 'grayscale' : ''}"
               loading="lazy"
               width="400"
               height="300">
        `}
      </div>
    `;
  } else {
    // Multiple images - carousel
    const carouselId = `carousel-${g.id}`;
    const normalizedImages = images.map(img => ImageHelper.normalizeGoogleDriveUrl(img) || img);
  
    imageHTML = `
      <div class="masonry-card-image-wrapper relative">
        <div class="image-carousel" data-carousel-id="${carouselId}">
          ${normalizedImages.map((img, idx) => `
            <img data-src="${img}" 
                 src="${ImageHelper.getPlaceholderSvg()}"
                 alt="${g.brand}çš„å•†å“åœ–ç‰‡ ${idx + 1}" 
                 class="carousel-image ${idx === 0 ? 'active' : ''} ${expired ? 'grayscale' : ''}"
                 loading="lazy"
                 width="400"
                 height="300">
          `).join('')}
        </div>
        ${normalizedImages.length > 1 ? `
          <div class="carousel-controls">
            <button onclick="prevSlide('${carouselId}')" class="carousel-btn carousel-btn-prev" aria-label="ä¸Šä¸€å¼µåœ–ç‰‡">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
              </svg>
            </button>
            <button onclick="nextSlide('${carouselId}')" class="carousel-btn carousel-btn-next" aria-label="ä¸‹ä¸€å¼µåœ–ç‰‡">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </button>
          </div>
          <div class="carousel-dots">
            ${normalizedImages.map((_, idx) => `
              <button onclick="goToSlide('${carouselId}', ${idx})" 
                      class="carousel-dot ${idx === 0 ? 'active' : ''}" 
                      aria-label="å‰å¾€ç¬¬ ${idx + 1} å¼µåœ–ç‰‡"></button>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }
  const countdown = g.category === 'short' && daysLeft !== null
    ? `<div class="flex items-center gap-2 text-sm mb-3">
         <span class="${daysLeft < 0 ? 'text-gray-500' : daysLeft <= 3 ? 'text-red-600 font-semibold' : 'text-amber-700'}">
           â± ${daysLeft > 0 ? 'å‰© ' + daysLeft + ' å¤©' : daysLeft === 0 ? 'ä»Šå¤©æˆªæ­¢' : 'çµæŸ ' + Math.abs(daysLeft) + ' å¤©'}
         </span>
       </div>`
    : '';

  return `
    <div class="masonry-card ${expired ? 'opacity-60' : ''}">
      ${imageHTML}
      <div class="masonry-card-content p-5">
        <h3 class="masonry-card-title text-lg font-bold text-center ${expired ? 'text-gray-500' : 'text-amber-900'} mb-2">${g.brand}</h3>
        ${g.description ? `<p class="text-base md:text-base ${expired ? 'text-gray-600' : 'text-gray-700'} leading-6 md:leading-6 mb-3">${g.description}</p>` : ''}
        <div class="flex flex-wrap gap-2 mb-3">
          ${expired ? '<span class="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">å·²çµæŸ</span>' : ''}
          ${categoryTags}
          ${countryTags}
          ${g.tag ? `<span class="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded-full font-medium">${g.tag}</span>` : ''}
          ${g.stock === 'å”®å®Œ' ? '<span class="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">å·²å”®å®Œ</span>' : ''}
          ${g.stock === 'å°‘é‡' ? '<span class="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">å°‘é‡ç¾è²¨</span>' : ''}
        </div>
        ${countdown}
        ${g.note && !expired
          ? noteIsQA
            ? `<details class="mb-3 bg-indigo-50 border-2 border-indigo-200 rounded-lg p-3">
                 <summary class="cursor-pointer text-indigo-700 font-medium">å¸¸è¦‹å•é¡Œâ“(${qaList.length})</summary>
                 ${qaList.map(qa => `<div class="mt-2 border-t border-indigo-200 pt-2"><p class="text-sm font-semibold text-indigo-900 mb-1">Q: ${qa.q}</p><p class="text-sm text-indigo-700">A: ${qa.a}</p></div>`).join('')}
               </details>`
            : noteIsURL
              ? `<div class="mb-3"><button onclick='openNote(event, "${g.note}")' class="w-full bg-blue-50 border-2 border-blue-200 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors">ðŸ“ æŸ¥çœ‹ä»‹ç´¹</button></div>`
              : `<div class="mb-3 bg-blue-50 border-2 border-blue-200 rounded-lg p-3"><p class="text-xs text-blue-600 font-semibold mb-1">â„¹ï¸ è²¼å¿ƒèªªæ˜Ž</p><p class="text-sm text-blue-900">${g.note}</p></div>`
          : ''}
        ${g.video && !expired ? `<div class="mb-3"><button onclick='openVideoModal(event, "${g.video}")' class="w-full bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm font-medium hover:from-red-100 hover:to-pink-100 transition-colors">ðŸŽ¬ è§€çœ‹å½±ç‰‡</button></div>` : ''}
        ${g.coupon && !expired ? `<div class="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-3 mb-3"><div class="flex items-center justify-between"><div class="flex-1 min-w-0"><p class="text-xs text-green-700 font-semibold mb-1">ðŸŽŸï¸ å°ˆå±¬æŠ˜æ‰£ç¢¼</p><code class="text-base font-bold text-green-800 font-mono break-all">${g.coupon}</code></div><button onclick='copyCoupon(event, "${g.coupon}")' class="ml-3 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium">è¤‡è£½</button></div></div>` : ''}
        ${g.endDate && !expired && g.category !== 'é•·æœŸ' ? `<div class="mb-3"><button onclick="addToCalendar(event, '${g.brand.replace(/'/g, "\\'")} - åœ˜è³¼æˆªæ­¢', '${g.endDate}', '${g.url}', 'â° ä»Šå¤©æ˜¯æœ€å¾Œä¸€å¤©!è¨˜å¾—ä¸‹å–®')" class="w-full bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium hover:from-blue-100 hover:to-indigo-100 transition-colors">ðŸ“… åŠ å…¥è¡Œäº‹æ›†</button></div>` : ''}
        <a href="${g.url}" target="_blank" rel="noopener noreferrer" 
           onclick="if(typeof gtag !== 'undefined'){gtag('event', 'click_group', {group_name: '${g.brand.replace(/'/g, "\\'")}', group_category: '${g.category}', event_category: 'conversion', event_label: '${g.brand.replace(/'/g, "\\'")}', value: 1});}"
           class="block w-full text-center text-white py-3 rounded-xl font-bold bg-gradient-to-r ${openClass}">${expired ? 'ä»å¯æŸ¥çœ‹ â†’' : 'ðŸ›’ ç«‹å³å‰å¾€ â†’'}</a>
      </div>
    </div>`;
}

// Track image clicks for analytics
function trackImageClick(brandName) {
  if (typeof gtag !== 'undefined') {
    gtag('event', 'image_click', {
      'event_category': 'engagement',
      'event_label': brandName,
      'brand': brandName
    });
  }
}

function renderCouponCard(g) {
  const expired = utils.isExpired(g.endDate);
  const daysLeft = utils.getDaysLeft(g.endDate);
  const noteIsURL = utils.isURL(g.note);
  const noteIsQA = utils.isQA(g.note);
  const qaList = noteIsQA ? utils.parseQA(g.note) : [];

  const categories = g.itemCategory ? g.itemCategory.split(/[,ï¼Œ]/).map(c => c.trim()).filter(c => c) : [];
  const countries = g.itemCountry ? g.itemCountry.split(/[,ï¼Œ]/).map(c => c.trim()).filter(c => c) : [];
  
  const categoryTags = categories.map(cat => 
    `<span class="text-xs ${utils.getCategoryColor(cat)} px-2 py-1 rounded-full border font-medium">${utils.getCategoryIcon(cat)} ${cat}</span>`
  ).join('');
  
  const countryTags = countries.map(country => 
    `<span class="text-xs bg-blue-100 text-blue-700 border-blue-300 px-2 py-1 rounded-full border font-medium">${utils.getCountryFlag(country)} ${country}</span>`
  ).join('');

  return `
    <div class="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl overflow-hidden border-2 ${expired ? 'opacity-60 border-gray-300' : 'border-purple-300'}">
      ${g.image ? `<a href="${g.url}" target="_blank" rel="noopener noreferrer" class="block w-full h-40 bg-gray-100" onclick="if(typeof gtag !== 'undefined'){gtag('event', 'click_image', {group_name: '${g.brand.replace(/'/g, "\\'")}', coupon_code: '${g.coupon || ''}', event_category: 'engagement', event_label: 'coupon_image_click'});}" ><img src="${g.image}" alt="${g.brand}" class="w-full h-full object-cover ${expired ? 'grayscale' : ''}" loading="lazy"></a>` : ''}
      <div class="p-6">
        <div class="flex items-start justify-between gap-3 mb-3">
          <div class="flex-1">
            <h3 class="text-lg font-bold ${expired ? 'text-gray-600' : 'text-purple-900'} text-center">${g.brand}</h3>
            ${g.productName ? `<p class="text-sm ${expired ? 'text-gray-400' : 'text-gray-600'} mt-1 text-center">${g.productName}</p>` : ''}
          </div>
          ${expired ? '<span class="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">å·²çµæŸ</span>' : ''}
        </div>
        <div class="flex flex-wrap gap-2 mb-3">${categoryTags}${countryTags}</div>
        ${g.note && !noteIsURL && !noteIsQA ? `<p class="text-sm text-gray-700 mb-3 leading-relaxed">${g.note}</p>` : ''}
        ${noteIsURL ? `<div class="mb-3"><a href="${g.note}" target="_blank" rel="noopener noreferrer" class="w-full bg-gradient-to-r from-gray-50 to-slate-50 border-2 border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:from-gray-100 hover:to-slate-100 transition-colors flex items-center justify-center gap-2">ðŸ“„ æŸ¥çœ‹è©³ç´°èªªæ˜Ž</a></div>` : ''}
        ${noteIsQA ? `<div class="space-y-2 mb-3">${qaList.map((qa, i) => `<details class="bg-white rounded-lg border border-purple-200 p-3"><summary class="cursor-pointer font-semibold text-purple-900 text-sm">${qa.q}</summary><div class="mt-2 text-sm text-gray-700">${qa.a}</div></details>`).join('')}</div>` : ''}
        ${g.video ? `<div class="mb-3"><button onclick='openVideoModal(event, "${g.video}")' class="w-full bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm font-medium hover:from-red-100 hover:to-pink-100 transition-colors">ðŸŽ¬ è§€çœ‹å½±ç‰‡</button></div>` : ''}
        ${g.endDate && !expired ? `<div class="flex items-center gap-2 text-sm mb-4"><span class="${daysLeft <= 7 ? 'text-red-600 font-semibold' : 'text-purple-700'}">â° ${daysLeft > 0 ? 'å‰© ' + daysLeft + ' å¤©' : 'ä»Šå¤©æˆªæ­¢'}</span></div>` : ''}
        ${g.coupon && !expired ? `
          <div class="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-3 mb-3">
            <div class="flex items-center justify-between">
              <div class="flex-1 min-w-0">
                <p class="text-xs text-green-700 font-semibold mb-1">ðŸŽŸï¸ å°ˆå±¬æŠ˜æ‰£ç¢¼</p>
                <code class="text-base font-bold text-green-800 font-mono break-all">${g.coupon}</code>
              </div>
              <button onclick='copyCoupon(event, "${g.coupon}")' class="ml-3 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium">è¤‡è£½</button>
            </div>
          </div>
        ` : ''}
        ${g.endDate && !expired && g.category !== 'é•·æœŸ' ? `<div class="mb-3"><button onclick="addToCalendar(event, '${g.brand.replace(/'/g, "\\'")} - åœ˜è³¼æˆªæ­¢', '${g.endDate}', '${g.url}', 'â° ä»Šå¤©æ˜¯æœ€å¾Œä¸€å¤©!è¨˜å¾—ä¸‹å–®')" class="w-full bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium hover:from-blue-100 hover:to-indigo-100 transition-colors">ðŸ“… åŠ å…¥è¡Œäº‹æ›†</button></div>` : ''}
        <a href="${g.url}" target="_blank" rel="noopener noreferrer" 
           onclick="if(typeof gtag !== 'undefined'){gtag('event', 'click_coupon', {group_name: '${g.brand.replace(/'/g, "\\'")}', coupon_code: '${g.coupon || ''}', event_category: 'conversion', event_label: '${g.brand.replace(/'/g, "\\'")}', value: 1});}"
           class="block w-full text-center text-white py-3 rounded-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 ${expired ? 'opacity-80' : ''}">${expired ? 'ä»å¯æŸ¥çœ‹ â†’' : 'ðŸ›’ ç«‹å³å‰å¾€ â†’'}</a>
      </div>
    </div>`;
}

// ============ å…§å®¹æ¸²æŸ“ ============
function renderContent() {
  if (state.loading) {
    elements.content.innerHTML = `
      <div class="flex items-center justify-center min-h-[40vh]">
        <div class="text-center">
          <div class="text-4xl mb-4">ðŸ¦…</div>
          <div class="text-xl text-amber-900 font-bold">è¼‰å…¥ä¸­...</div>
        </div>
      </div>`;
    return;
  }
  if (state.error) return;

  const q = (state.searchTerm || '').toLowerCase();
  const filtered = state.groups.filter(g => {
    const okSearch = !q || 
      g.brand.toLowerCase().includes(q) || 
      (g.tag || '').toLowerCase().includes(q) || 
      (g.description || '').toLowerCase().includes(q);
    
    const okExpired = state.showExpired || !utils.isExpired(g.endDate);
    
    const okCategory = state.selectedCategory === 'all' || 
      (g.itemCategory && g.itemCategory.split(/[,ï¼Œ]/).map(c => c.trim()).includes(state.selectedCategory));
    
    const okCountry = state.selectedCountry === 'all' || 
      (g.itemCountry && g.itemCountry.split(/[,ï¼Œ]/).map(c => c.trim()).includes(state.selectedCountry));
    
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
  const expiredCount = state.groups.filter(g => utils.isExpired(g.endDate)).length;

  const todayEndingGroups = utils.getTodayEndingGroups(shortTerm);

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

  const btn = (id, txt, cls) => `<button onclick="scrollToSection('${id}')" class="px-4 py-2 ${cls} rounded-lg font-medium whitespace-nowrap hover:opacity-90 text-sm">${txt}</button>`;
  elements.sectionButtons.innerHTML = (shortTerm.length ? btn('short-term', 'é™æ™‚åœ˜è³¼', 'bg-orange-100 text-orange-700') : '') +
    (longTerm.length ? btn('long-term', 'å¸¸é§åœ˜è³¼', 'bg-green-100 text-green-700') : '') +
    (coupon.length ? btn('coupon', 'æŠ˜æ‰£ç¢¼å„ªæƒ ', 'bg-purple-100 text-purple-700') : '') +
    btn('calendar', 'åœ˜è³¼è¡Œäº‹æ›†', 'bg-blue-100 text-blue-700');

  const m1 = today.getMonth() + 1;
  const m2 = (today.getMonth() + 1) % 12 + 1;
  const m3 = (today.getMonth() + 2) % 12 + 1;

  const hasActiveFilters = state.searchTerm || state.selectedCategory !== 'all' || state.selectedCountry !== 'all';
  
  const filterBadges = [];
  if (state.searchTerm) filterBadges.push(`æœå°‹: "${state.searchTerm}"`);
  if (state.selectedCategory !== 'all') filterBadges.push(`åˆ†é¡ž: ${state.selectedCategory}`);
  if (state.selectedCountry !== 'all') filterBadges.push(`åœ‹å®¶: ${state.selectedCountry}`);

  elements.content.innerHTML =
    `<div class="mb-6 flex flex-wrap items-center gap-3">
       ${expiredCount ? `<button onclick="toggleExpired()" class="px-4 py-2 rounded-lg font-medium ${state.showExpired ? 'bg-gray-600 text-white' : 'bg-white text-gray-700 border-2 border-gray-300'}">${state.showExpired ? 'éš±è—' : 'é¡¯ç¤º'}å·²çµæŸï¼ˆ${expiredCount}ï¼‰</button>` : ''}
       ${hasActiveFilters ? `
         <div class="flex items-center gap-2 flex-wrap">
           <div class="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-300 rounded-lg text-sm">
             <span class="text-blue-700 font-medium">ç¯©é¸ä¸­:</span>
             ${filterBadges.map(badge => `<span class="bg-white px-2 py-0.5 rounded text-blue-800">${badge}</span>`).join('')}
           </div>
           <button onclick="clearAllFilters()" class="px-4 py-2 bg-red-50 border-2 border-red-300 text-red-700 rounded-lg font-medium hover:bg-red-100 transition-colors flex items-center gap-1.5">
             <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
             </svg>
             æ¸…é™¤ç¯©é¸
           </button>
         </div>
       ` : ''}
     </div>` +

    (state.searchTerm && upcomingMatches.length && shortTerm.length === 0 && longTerm.length === 0 && coupon.length === 0 ? `
      <section id="upcoming-search" class="scroll-mt-24 md:scroll-mt-28 mb-8">
        <h2 class="text-2xl font-bold text-amber-900 mb-4 text-center">å³å°‡é–‹åœ˜ï¼ˆ${upcomingMatches.length}ï¼‰</h2>
        <div class="masonry-grid">
          ${upcomingMatches.map(renderUpcomingSearchCard).join('')}
        </div>
      </section>
    ` : '') +

    (shortTerm.length ? `<section id="short-term" class="scroll-mt-24 md:scroll-mt-28 mb-8">
       <div class="flex items-center justify-between mb-4">
         <h2 class="text-2xl font-bold text-amber-900 text-center flex-1">â³ é™æ™‚åœ˜è³¼</h2>
       </div>
       
       ${todayEndingGroups.length > 0 ? `
         <div id="todayEndingBanner" class="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-300 rounded-xl p-4 mb-6 shadow-md">
           <div class="flex items-center justify-between flex-wrap gap-3">
             <div class="flex items-center gap-3">
               <span class="text-3xl animate-pulse">â°</span>
               <div>
                 <h3 class="font-bold text-red-800 text-lg">ä»Šæ—¥æˆªæ­¢å€’æ•¸</h3>
                 <p class="text-sm text-red-700">è·é›¢æˆªæ­¢é‚„æœ‰</p>
               </div>
             </div>
             <div id="todayEndingCountdown" class="text-2xl font-mono font-bold text-red-600">
               è¼‰å…¥ä¸­...
             </div>
             <div class="flex-1 min-w-[200px]">
               <p class="text-sm text-red-700 font-medium">ä»Šæ—¥æˆªæ­¢å•†å“ï¼š</p>
               <p class="text-sm text-red-800">${todayEndingGroups.map(g => g.brand).join('ã€')}</p>
             </div>
           </div>
         </div>
       ` : ''}
       
       <div class="masonry-grid">${shortTerm.map(renderGroupCard).join('')}</div>
     </section>` : '') +

    (longTerm.length ? `<section id="long-term" class="scroll-mt-24 md:scroll-mt-28 mb-8">
       <h2 class="text-2xl font-bold text-amber-900 mb-4 text-center">â˜€ï¸ å¸¸é§åœ˜è³¼</h2>
       <div class="masonry-grid">${longTerm.map(renderGroupCard).join('')}</div>
     </section>` : '') +

    (coupon.length ? `<section id="coupon" class="scroll-mt-24 md:scroll-mt-28 mb-8">
       <h2 class="text-2xl font-bold text-amber-900 mb-4 text-center">ðŸŽŸï¸ æŠ˜æ‰£ç¢¼å„ªæƒ </h2>
       <div class="coupon-grid">${coupon.map(renderCouponCard).join('')}</div>
     </section>` : '') +

    `<section id="calendar" class="scroll-mt-24 md:scroll-mt-28 mb-6">
       <h2 class="text-2xl font-bold text-amber-900 mb-4 text-center">ðŸ—“ï¸ åœ˜è³¼è¡Œäº‹æ›†</h2>
       <div class="bg-white rounded-xl p-4 border-2 border-amber-200">
         <div class="flex gap-2 mb-4 justify-center">
           <button onclick="switchCalendarMonth(0)" class="px-4 py-2 rounded-lg font-medium ${state.selectedCalendarMonth === 0 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}">${m1}æœˆ</button>
           <button onclick="switchCalendarMonth(1)" class="px-4 py-2 rounded-lg font-medium ${state.selectedCalendarMonth === 1 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}">${m2}æœˆ</button>
           <button onclick="switchCalendarMonth(2)" class="px-4 py-2 rounded-lg font-medium ${state.selectedCalendarMonth === 2 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}">${m3}æœˆ</button>
         </div>
         ${renderCalendar()}
         <div class="mt-4 flex gap-4 text-xs text-gray-600 justify-center flex-wrap">
           <div class="flex items-center gap-1"><div class="w-4 h-4 bg-yellow-200 border border-blue-300 rounded"></div><span>ä»Šå¤©</span></div>
           <div class="flex items-center gap-1"><div class="w-4 h-4 bg-red-100 border border-red-300 rounded"></div><span>3å¤©å…§æˆªæ­¢</span></div>
           <div class="flex items-center gap-1"><span class="text-[10px] leading-none px-1.5 py-0.5 rounded bg-white border border-red-300 text-red-700">3</span><span>ï¼š ç•¶æ—¥æˆªæ­¢æ•¸</span></div>
           <div class="flex items-center gap-1"><span class="text-[10px] leading-none px-1.5 py-0.5 rounded bg-white border border-teal-300 text-teal-700">2</span><span>ï¼š ç•¶æ—¥é–‹åœ˜æ•¸</span></div>
         </div>
         ${renderMonthlyGroupList()}
       </div>
     </section>` +

    (filtered.length === 0 && state.searchTerm ? `<div class="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 text-center"><p class="text-lg text-yellow-900 font-medium">æ‰¾ä¸åˆ°ã€Œ${state.searchTerm}ã€ç›¸é—œçš„åœ˜è³¼</p><p class="text-sm text-yellow-700 mt-2">è©¦è©¦å…¶ä»–é—œéµå­—,æˆ–æ¸…ç©ºæœå°‹</p></div>` : '') +
    (filtered.length === 0 && !state.searchTerm ? `<div class="text-center py-12 text-amber-700"><p class="text-lg">ç›®å‰æ²’æœ‰åœ˜è³¼é …ç›®</p></div>` : '');

  if (todayEndingGroups.length > 0) {
    startCountdown();
  }

  setTimeout(() => {
    initializeCarousels();
    initializeImages(); // This will now use the enhanced version
  }, 200);
}

// ============ åˆå§‹åŒ– ============
function init() {
  if (window.innerWidth >= 1024) {
    try {
      const savedSidebarState = localStorage.getItem(STORAGE_KEYS.sidebarOpen);
      if (savedSidebarState === 'true') {
        setTimeout(() => toggleSidebar(), 100);
      }
    } catch {}
  }
}

initSearch();
renderBanner();
init();
loadData();
setInterval(loadData, CONFIG.REFRESH_INTERVAL);

// ============ æš´éœ²å‡½æ•¸åˆ°å…¨åŸŸä½œç”¨åŸŸ ============
window.toggleSidebar = toggleSidebar;
window.toggleMobileFilters = toggleMobileFilters;
window.scrollToSection = scrollToSection;
window.openVideoModal = openVideoModal;
window.closeVideoModal = closeVideoModal;
window.copyCoupon = copyCoupon;
window.openNote = openNote;
window.addToCalendar = addToCalendar;
window.addBothToCalendar = addBothToCalendar;
window.showDayGroups = showDayGroups;
window.toggleExpired = toggleExpired;
window.switchCalendarMonth = switchCalendarMonth;
window.addToGoogleCalendar = addToGoogleCalendar;
window.addToAppleCalendar = addToAppleCalendar;
window.addBothToGoogleCalendar = addBothToGoogleCalendar;
window.addBothToAppleCalendar = addBothToAppleCalendar;
window.showCalendarChoice = showCalendarChoice;
window.setFilter = setFilter;
window.clearAllFilters = clearAllFilters;
window.goToSlide = goToSlide;
window.nextSlide = nextSlide;
window.prevSlide = prevSlide;
window.shareWebsite = shareWebsite;

function shareWebsite() {
  const shareData = {
    title: 'ðŸ¦… é·¹å®¶Funç”Ÿè²·ç‰©ç¤¾',
    text: 'ç²¾é¸åœ˜è³¼ Â· å„ªè³ªå¥½ç‰©',
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
      elements.copyToast.textContent = 'âœ“ é€£çµå·²è¤‡è£½ï¼å¿«åˆ†äº«çµ¦æœ‹å‹';
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

window.addEventListener('beforeunload', () => {
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }
});
