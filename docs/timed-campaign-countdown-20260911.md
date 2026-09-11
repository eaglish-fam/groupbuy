# Timed campaign reminders

The catalog's limited-time tab opens with nearest closing dates first. Consumers can still change the sort order. The selected tab uses the existing orange text with no filled background or underline. Card labels distinguish limited-time and evergreen campaigns.

A today-closing section appears immediately above the catalog tabs, before search and product cards. It lists all verified, active, non-resource, non-evergreen campaigns ending today, independent of the current filters. Names open product details. The section disappears when no qualifying campaigns remain. Its text clock updates every second without rebuilding the buttons or using a screen-reader live region.

Dates use the Sheet's inclusive end date in Asia/Taipei. Card countdowns are neutral until the remaining duration reaches 72 hours, then use the shared orange accent. The last day displays hours and minutes. The today-closing clock targets the following Taiwan midnight. Expired cards are reclassified and an expired open detail loses its purchase link. Returning to a visible page refreshes countdowns; existing Sheet refresh and click-time verification remain in place.

No new indexable URLs, SEO metadata, analytics events, or Sheet writes. Styling uses existing fonts and colors, native buttons, tabular numerals, and a small non-sticky section. Mobile two-column product cards remain unchanged. Verification covered 390px and 1440px layouts, live date sorting, neutral/urgent colors, native detail links, hidden empty reminders, evergreen exclusions, exact 72-hour boundaries, and Taiwan midnight. Full repository verification is required before handoff/deployment. Rollback is the preceding repository commit.
