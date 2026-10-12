# Travel globe navigation

The travel homepage has two modes: 台灣 and 世界. Continents are disclosures within 世界, not additional top modes. Keep all five continent choices visible in compact wrapping rows; only the selected country list adds height. Native buttons expose expansion/selection and retain focus after rendering.

Continent/country selection changes camera orientation and the relevant guide list. It must never filter the globe's registered destination markers. Only natural front/back geographic visibility controls drawing and hit testing; Taiwan's canonical geometry supplies its marker.

World overview starts with no selected country. 回到世界地圖 clears the country and disclosure and restores overview; 重新置中 restores the current camera recipe without changing navigation selection. Taiwan's five-region/county drill-down and planning state retain their existing behavior.

Check real marker clicks after rotating from Oceania toward Asia/Europe, both keyboard expansion keys, heading/recenter alignment, 320/390/1440 overflow, no-JS destination links, and all previously published country/guide routes before release.
