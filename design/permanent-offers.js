/* Reviewed permanent offers stay separate from the live Google Sheet. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.PermanentOffers = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const slug = /^[a-z][a-zA-Z0-9-]{1,79}$/;
  const code = /^[a-zA-Z0-9_-]{1,64}$/;
  const sha256 = /^[a-f0-9]{64}$/;
  const articlePath = /^\/blog\/[a-z0-9]+(?:-[a-z0-9]+)*\/$/;
  const assetPath = /^\/assets\/[a-z0-9/_-]+\.webp$/;
  const date = /^\d{4}-\d{2}-\d{2}$/;
  const text = (value, max) =>
    typeof value === "string" && value.trim() === value && value.length > 0 && value.length <= max;

  function exactHttpsUrl(value) {
    if (!text(value, 1000)) throw Error("Invalid permanent-offer destination");
    let parsed;
    try { parsed = new URL(value); } catch { throw Error("Invalid permanent-offer destination"); }
    if (parsed.protocol !== "https:" || parsed.username || parsed.password || parsed.hash || parsed.href !== value)
      throw Error("Permanent-offer destination must be an exact HTTPS URL");
    return value;
  }

  function validDate(value) {
    if (!date.test(value || "")) return false;
    const parsed = new Date(`${value}T00:00:00Z`);
    return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  }

  function validateOffer(input) {
    if (!input || typeof input !== "object" || Array.isArray(input)) throw Error("Invalid permanent offer");
    if (!slug.test(input.id || "") || !slug.test(input.brandId || "")) throw Error("Invalid permanent-offer identity");
    if (!text(input.brandName, 120) || !text(input.title, 180) || !code.test(input.code || ""))
      throw Error("Invalid permanent-offer display fields");
    if (!input.discount || !Number.isInteger(input.discount.amount) || input.discount.amount <= 0 ||
      input.discount.currency !== "TWD" || !text(input.discount.display, 80))
      throw Error("Invalid permanent-offer discount");
    exactHttpsUrl(input.destinationUrl);
    if (!articlePath.test(input.articlePath || "")) throw Error("Invalid permanent-offer article path");
    if (!input.image || !assetPath.test(input.image.path || "") || !sha256.test(input.image.sha256 || "") ||
      !text(input.image.alt, 240)) throw Error("Invalid permanent-offer image");
    if (!input.source || !text(input.source.kind, 80) || !sha256.test(input.source.sha256 || "") ||
      !text(input.source.authority, 200)) throw Error("Invalid permanent-offer source");
    if (!validDate(input.observedAt)) throw Error("Invalid permanent-offer observation date");
    if (!input.terms || typeof input.terms !== "object" || Array.isArray(input.terms))
      throw Error("Invalid permanent-offer terms");
    if (!text(input.disclosure, 240)) throw Error("Invalid permanent-offer disclosure");
    if (!new Set(["candidate", "published"]).has(input.state)) throw Error("Invalid permanent-offer state");
    if (typeof input.publicationNotYetAccepted !== "boolean") throw Error("Invalid permanent-offer publication gate");
    if (input.state === "candidate" && !input.publicationNotYetAccepted)
      throw Error("Candidate permanent offer must remain publication-gated");
    if (input.state === "published" && input.publicationNotYetAccepted)
      throw Error("Published permanent offer cannot remain publication-gated");
    return Object.freeze({
      ...input,
      discount: Object.freeze({ ...input.discount }),
      source: Object.freeze({ ...input.source }),
      terms: Object.freeze({ ...input.terms }),
      image: Object.freeze({ ...input.image }),
    });
  }

  function validateRegistry(input) {
    if (!input || input.schema !== "eaglish.permanent-offers/v1" || !Array.isArray(input.offers))
      throw Error("Invalid permanent-offer registry");
    const offers = input.offers.map(validateOffer);
    if (new Set(offers.map((offer) => offer.id)).size !== offers.length)
      throw Error("Duplicate permanent-offer id");
    return Object.freeze({ schema: input.schema, offers: Object.freeze(offers) });
  }

  function toProduct(offer) {
    return {
      brand: offer.brandName,
      key: `permanent-offer:${offer.id}`,
      source: {},
      description: offer.discount.display,
      url: offer.destinationUrl,
      images: [offer.image.path],
      fallbackImage: "",
      category: "其他",
      country: "",
      start: "",
      end: "",
      status: { key: "open", label: "推薦優惠", long: true },
      note: "",
      details: "",
      qa: "",
      contacts: "",
      coupon: offer.code,
      videos: [],
      article: { id: offer.brandId, article: offer.articlePath, title: offer.title },
      blogUrl: "",
      googleDoc: "",
      featured: false,
      type: "常駐優惠",
      kind: "coupon",
      retailers: [],
      warranty: "",
      permanentOfferId: offer.id,
      exactDestination: true,
      disclosure: offer.disclosure,
      offerState: offer.state,
      terms: offer.terms,
    };
  }

  const key = (brand, coupon) => `${String(brand || "").trim().toLocaleLowerCase("zh-TW")}\u0000${String(coupon || "").trim().toLowerCase()}`;

  function mergeProducts(sheetProducts, registry) {
    if (!Array.isArray(sheetProducts)) throw Error("Invalid Sheet products");
    const reviewed = validateRegistry(registry).offers.filter((offer) =>
      offer.state === "published" && offer.publicationNotYetAccepted === false,
    ).map(toProduct);
    const ids = new Set(reviewed.map((offer) => offer.permanentOfferId));
    const identities = new Set(reviewed.map((offer) => key(offer.brand, offer.coupon)));
    const sheet = sheetProducts.filter((product) =>
      !ids.has(product.permanentOfferId) && !identities.has(key(product.brand, product.coupon)),
    );
    return [...sheet, ...reviewed];
  }

  function unavailableProducts(previousProducts, registry) {
    if (!Array.isArray(previousProducts)) throw Error("Invalid previous products");
    const ordinary = previousProducts
      .filter((product) => !product.permanentOfferId && !product.exactDestination)
      .map((product) => ({
        ...product,
        retailers: [],
        status: {
          ...(product.status || {}),
          key: "unknown",
          label: "團購狀態待確認",
        },
      }));
    return mergeProducts(ordinary, registry);
  }

  async function load(url = "/config/permanent-offers.json", fetcher = globalThis.fetch) {
    if (typeof fetcher !== "function") throw Error("Permanent-offer fetch unavailable");
    const response = await fetcher(url, { cache: "no-store" });
    if (!response?.ok) throw Error("Permanent-offer registry unavailable");
    return validateRegistry(await response.json());
  }

  async function copyCode(value, { clipboard = globalThis.navigator?.clipboard, onSuccess, onFailure } = {}) {
    try {
      if (!clipboard || typeof clipboard.writeText !== "function") throw Error("Clipboard unavailable");
      await clipboard.writeText(value);
      onSuccess?.();
      return { ok: true, manual: false };
    } catch {
      onFailure?.();
      return { ok: false, manual: true };
    }
  }

  return { validateRegistry, mergeProducts, unavailableProducts, load, copyCode };
});
