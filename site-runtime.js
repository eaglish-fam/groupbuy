/* Preserve the existing GA4 property and names; private previews emit no hits. */
(() => {
  if (window.SiteAnalytics?.initialized) return;
  const robots = document.querySelector?.('meta[name="robots"]')?.content || "";
  const production = ["www.eaglish.store", "eaglish.store"].includes(location.hostname)
    && !/^\/(?:design|lab|docs)\//.test(location.pathname) && !/noindex/i.test(robots);
  // Page and referral identity do not require search parameters or fragments.
  const cleanPageUrl = value => {
    if (!value) return '';
    try { const url = new URL(value, location.href); return url.origin + url.pathname; }
    catch { return ''; }
  };
  const track = (name, data = {}) => {
    if (production && typeof window.gtag === "function") window.gtag("event", name, data);
  };
  const text = value => String(value ?? "").trim();
  const vendorKey = value => {
    try { return new URL(value, location.href).hostname.toLowerCase().replace(/^www\./, ""); }
    catch { return ""; }
  };
  const outboundGroupbuy = ({
    productId,
    productName,
    groupType,
    sourceSurface,
    articleSlug = "",
    destinationUrl = "",
    ctaLabel = "",
    campaignKey = "",
    vendor = "",
    legacyEvent = "",
    legacyData = {},
  } = {}) => {
    const payload = {
      product_id: text(productId),
      product_name: text(productName),
      group_type: text(groupType),
      source_surface: text(sourceSurface),
      article_slug: text(articleSlug),
      vendor_key: text(vendor) || vendorKey(destinationUrl),
      cta_label: text(ctaLabel),
      campaign_key: text(campaignKey),
      destination_host: vendorKey(destinationUrl),
      event_category: "conversion",
      transport_type: "beacon",
    };
    // A conversion without these dimensions cannot answer which product and surface worked.
    if (!payload.product_id || !payload.product_name || !payload.group_type || !payload.source_surface) return false;
    const emit = window.SiteAnalytics?.track || track;
    emit("outbound_groupbuy_click", payload);
    // Keep the historical series during migration. Only outbound_groupbuy_click is a key event.
    if (legacyEvent) emit(legacyEvent, { ...legacyData, group_name: payload.product_name, event_category: "conversion" });
    return true;
  };
  window.SiteAnalytics = { track, outboundGroupbuy, vendorKey, initialized: true };
  if (production && !window.gtag) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    const contentGroup = location.pathname.startsWith('/trip/') ? 'travel'
      : location.pathname.startsWith('/blog/') ? 'journal'
      : location.pathname.startsWith('/guides/') ? 'shopping_guides' : 'shopping';
    window.gtag("config", "G-7SW2X9B19H", { send_page_view: true, content_group: contentGroup, page_location: cleanPageUrl(location.href), page_referrer: cleanPageUrl(document.referrer) });
    const loadAnalytics = () => {
      if (document.querySelector?.('script[data-site-analytics]')) return;
      const script = document.createElement("script");
      script.async = true;
      if (script.dataset) script.dataset.siteAnalytics = "";
      script.src = "https://www.googletagmanager.com/gtag/js?id=G-7SW2X9B19H";
      document.head.append(script);
    };
    const afterPageLoad = () => {
      if ("requestIdleCallback" in window) requestIdleCallback(loadAnalytics, { timeout: 2000 });
      else setTimeout(loadAnalytics, 300);
    };
    if (document.readyState === "complete") afterPageLoad();
    else if (typeof window.addEventListener === "function") window.addEventListener("load", afterPageLoad, { once: true });
    else loadAnalytics();
  }
  const countryFromPath = path => {
    const id = path.match(/^\/trip\/([a-z0-9-]+)\//)?.[1] || '';
    return ['guides', 'flights'].includes(id) ? '' : id;
  };
  // Older city articles live under /trip/guides/. Their visible breadcrumb
  // schema provides the country, without maintaining another country lookup.
  let pageCountry = countryFromPath(location.pathname);
  if (!pageCountry && location.pathname.startsWith('/trip/')) {
    for (const script of document.querySelectorAll?.('script[type="application/ld+json"]') || []) {
      try {
        const data = JSON.parse(script.textContent);
        const nodes = Array.isArray(data) ? data : data['@graph'] || [data];
        for (const node of nodes) if (node['@type'] === 'BreadcrumbList') {
          for (const item of node.itemListElement || []) {
            const url = new URL(typeof item.item === 'string' ? item.item : item.item?.['@id'], location.href);
            if (url.origin === location.origin) pageCountry ||= countryFromPath(url.pathname);
          }
        }
      } catch { /* A malformed optional schema must not break navigation. */ }
    }
  }
  const surface = a => a.closest('.hero-entry-actions') ? 'homepage_hero'
    : a.closest('.travel-entry') ? 'homepage_travel'
    : a.closest('.content-nav') ? 'homepage_navigation'
    : a.closest('footer') ? 'footer'
    : a.closest('[data-home-guides]') ? 'travel_guide_grid'
    : a.closest('[data-country-panel]') ? 'travel_country_panel'
    : location.pathname.startsWith('/trip/') ? 'travel_content' : 'site_navigation';
  const countryFor = (a, path = '') => a.closest('[data-country]')?.dataset.country
    || a.closest('[data-offer-country]')?.dataset.offerCountry
    || a.closest('[data-country-panel]')?.dataset.countryPanel
    || countryFromPath(path) || pageCountry || '';
  const selectedCountry = () => document.querySelector?.('#home-country-filter')?.value || 'unavailable';
  document.addEventListener('change', e => {
    if (e.target.id === 'home-country-filter') track('travel_destination_select', {
      country_id: selectedCountry(), source_surface: 'guide_filter',
    });
    else if (e.target.id === 'home-theme-filter') track('travel_filter_change', {
      country_id: selectedCountry(), theme_id: e.target.value,
    });
  });
  document.addEventListener('reset', e => {
    if (e.target.hasAttribute?.('data-home-filters')) track('travel_filter_change', {
      country_id: 'all', theme_id: 'all',
    });
  });
  document.addEventListener('keydown', e => {
    if (e.key === ' ' && !e.repeat && e.target.closest('[data-atlas-choice]')) {
      track('travel_destination_select', {country_id: selectedCountry(), source_surface: 'globe_country'});
    }
  });
  document.addEventListener("click", e => {
    const atlas = e.target.closest('[data-atlas-choice]');
    const region = e.target.closest('[data-atlas-region], [data-atlas-subregion], [data-atlas-back], [data-atlas-return]');
    if ((atlas || region) && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
      track('travel_destination_select', {country_id: selectedCountry(), source_surface: atlas ? 'globe_country' : 'globe_region'});
      return;
    }
    const a = e.target.closest("a");
    if (!a || !a.href || a.hasAttribute("data-buy-key") || a.hasAttribute("data-buy")) return;
    // SVG anchors expose SVGAnimatedString rather than an HTML href string.
    const href = typeof a.href === 'string' ? a.href : a.getAttribute('href');
    if (!href) return;
    let u; try { u = new URL(href, location.href); } catch { return; }
    if (u.origin === location.origin && u.pathname.startsWith('/trip/') && u.pathname !== location.pathname) {
      const sourceSurface = surface(a);
      track(sourceSurface === 'travel_guide_grid' ? 'travel_guide_open' : 'travel_entry_click', {
        country_id: countryFor(a, u.pathname) || 'all', destination_path: u.pathname, source_surface: sourceSurface,
        transport_type: 'beacon',
      });
      return;
    }
    const provider = /(^|\.)klook\.com$/.test(u.hostname) ? 'klook'
      : /(^|\.)kkday\.com$/.test(u.hostname) ? 'kkday'
      : /(^|\.)agoda\.com$/.test(u.hostname) ? 'agoda'
      : u.protocol==='https:' && ['www.skyscanner.com.tw','skyscanner.com.tw'].includes(u.hostname) ? 'skyscanner' : '';
    if (provider && location.pathname.startsWith('/trip/')) {
      track('outbound_travel_click', {
        country_id: countryFor(a) || 'unknown', provider, destination_host: u.hostname,
        source_surface: a.closest('[data-offer-country]') ? 'travel_home_offer' : 'travel_article',
        transport_type: 'beacon',
      });
      return;
    }
    const brand = a.closest(".product-card")?.querySelector("h3")?.textContent || "";
    const outbound = a.closest("[data-outbound-product-id]");
    if (outbound) {
      outboundGroupbuy({
        productId: outbound.dataset.outboundProductId,
        productName: outbound.dataset.outboundProductName || brand,
        groupType: outbound.dataset.outboundGroupType,
        sourceSurface: outbound.dataset.outboundSourceSurface,
        articleSlug: outbound.dataset.outboundArticleSlug,
        destinationUrl: a.href,
        ctaLabel: a.textContent,
        campaignKey: outbound.dataset.outboundCampaignKey,
        legacyEvent: outbound.dataset.outboundLegacyEvent,
        legacyData: { retailer: outbound.dataset.outboundRetailer || "" },
      });
    } else if (u.origin === location.origin && u.pathname.startsWith("/blog/"))
      track("open_blog_modal", { group_name: brand, article_path: u.pathname, source: "journal" });
    else if (a.classList.contains("retailer-link"))
      track("click_book", { group_name: brand, retailer: a.textContent.trim() });
    else if (a.closest(".social-links") || /line.me|instagram.com|facebook.com|youtube.com|tiktok.com/.test(u.hostname))
      track("click_social", { social_platform: u.hostname, event_category: "engagement" });
  });
  if (production && "serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }).then(r => r.update()).catch(() => {});
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      try {
        const key = "eaglish-upgraded-20260909";
        if (!sessionStorage.getItem(key)) { sessionStorage.setItem(key, "1"); location.reload(); }
      } catch {}
    });
  }
})();
