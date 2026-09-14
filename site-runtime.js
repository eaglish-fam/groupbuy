/* Preserve the existing GA4 property and names; private previews emit no hits. */
(() => {
  const production = ["www.eaglish.store", "eaglish.store"].includes(location.hostname) && !location.pathname.startsWith("/design/");
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
  window.SiteAnalytics = { track, outboundGroupbuy, vendorKey };
  if (production && !window.gtag) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", "G-7SW2X9B19H", { send_page_view: true });
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtag/js?id=G-7SW2X9B19H";
    document.head.append(script);
  }
  document.addEventListener("click", e => {
    const a = e.target.closest("a");
    if (!a || !a.href || a.hasAttribute("data-buy-key") || a.hasAttribute("data-buy")) return;
    const u = new URL(a.href);
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
