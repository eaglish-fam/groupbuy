# Terra Google Sheet bridge

This bound Apps Script keeps Klook catalogue retrieval behind the Google account boundary and writes only normalized public product rows.

## Current behavior

- adds a `Terra 旅遊資料` menu to the existing `eagle-groupbuy` spreadsheet;
- stores the Klook JSON download URL in Script Properties, never in cells or website code;
- fetches the official catalogue only when an editor chooses `立即同步 Klook 商品`;
- selects a bounded set of high-review products for the target countries;
- replaces only the `旅遊商品` data rows and updates `系統狀態`;
- marks expired published fares as `expired` on demand.

No timer trigger is installed by this version. Klook activity products are not a source of airline fares. A flight-price provider or supervised real browser observation is still required before the public `機票優惠` sheet may contain a fare.
