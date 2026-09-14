# 鷹家遠行所網址調整

Hiram requested the consumer path change from /flights/ to /trip/ on 2026-09-14, under the existing authorization to update the production travel page.

- /trip/ serves the existing travel page, with updated canonical, Open Graph URL, structured data and self-navigation.
- /flights/ is a client-side redirect that preserves query parameters and fragments. GitHub Pages does not provide a server-side 301 configuration here. A plain link and noscript refresh provide fallback navigation.
- Sitemap lists /trip/ instead of the legacy page. The redirect is noindex,follow. Shop and journal entry links remain hidden.
- Existing assets and scripts keep their stable /flights/ URLs. Data sources, affiliate links, analytics events and collectors are unchanged.
- Verification: npm run verify, 112 tests passed; redirect parameters/fragment and all local page resource paths checked.
- Layout, accessible controls and asset sizes are unchanged. No new dependency or tracking is introduced.
- Rollback: revert this route migration commit without resetting other website work.
