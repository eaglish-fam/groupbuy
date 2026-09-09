/* Preserve the existing GA4 property and names; private previews emit no hits. */
(() => {
  const production = ["www.eaglish.store", "eaglish.store"].includes(location.hostname) && !location.pathname.startsWith("/design/");
  const track = (name, data = {}) => {
    if (production && typeof window.gtag === "function") window.gtag("event", name, data);
  };
  window.SiteAnalytics = { track };
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
    if (u.origin === location.origin && u.pathname.startsWith("/blog/"))
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
