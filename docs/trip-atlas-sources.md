# 首頁圖集來源

首頁使用 Natural Earth 1:110m 海陸／國家幾何，透過固定版本 `world-atlas@2.0.2`（Natural Earth 4.1.0）取得。

- 原始資料及說明：https://github.com/topojson/world-atlas
- Natural Earth 使用條款：https://www.naturalearthdata.com/about/terms-of-use/
- 投影文件：https://d3js.org/d3-geo/cylindrical#geoEqualEarth

Natural Earth 地圖資料為 public domain；world-atlas 發行包為 ISC。此低解析底圖適合目的地探索，不用於導航或邊界判定。海岸線、地點及高亮國家共用 Equal Earth 投影，以140°E為中央經線，沒有手繪拼湊海陸比例。

`d3-geo@3.1.1`、`topojson-client@3.1.0`、`world-atlas@2.0.2` 僅用於建置。頁面輸出靜態SVG＋既有本機JavaScript，不下載地圖SDK，不連地圖tile服務，不索取旅人的位置。版本及套件完整性由package-lock保存。

World Atlas ISC notice:

Copyright 2013-2019 Michael Bostock

Permission to use, copy, modify, and/or distribute this software for any purpose
with or without fee is hereby granted, provided that the above copyright notice
and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND
FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS
OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER
TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF
THIS SOFTWARE.
