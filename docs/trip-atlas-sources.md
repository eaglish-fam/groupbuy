# 首頁圖集來源

首頁使用 Natural Earth 1:110m 海陸／國家幾何，透過固定版本 `world-atlas@2.0.2`（Natural Earth 4.1.0）取得。

- 原始資料及說明：https://github.com/topojson/world-atlas
- Natural Earth 使用條款：https://www.naturalearthdata.com/about/terms-of-use/
- v3 球面投影文件：https://d3js.org/d3-geo/azimuthal#geoOrthographic

Natural Earth 地圖資料為 public domain；world-atlas 發行包為 ISC。此低解析底圖適合目的地探索，不用於導航或邊界判定。v3 海岸線、地點及高亮國家共用 Orthographic 球面投影；首屏 SVG 與 Canvas 使用同樣比例、中心與光影。這是以 2D 畫布重畫球面的偽 3D，不是 WebGL 模型。舊 v2 Equal Earth helper 留作幾何測試參照，首頁已不渲染它。

`d3-geo@3.1.1`、`topojson-client@3.1.0`、`world-atlas@2.0.2` 用於建置與產生延後載入的本機互動資源。`esbuild@0.25.10` 只用於建置，裁掉未使用程式。使用者選地區／國家或啟用轉動後，才載入本機 globe.js 與 globe-land.json；不連第三方地圖 tile、SDK 或定位服務。版本及套件完整性由 package-lock 保存。

互動資源包含必要的套件 notices；完整授權亦輸出在 `trip/globe-licenses.txt`，包含 d3-geo、d3-array、internmap、topojson-client、world-atlas。建置設定 gzip 體積預算；gzip 數字是壓縮估算，非實際 HTTP 傳輸或手機速度保證。

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
