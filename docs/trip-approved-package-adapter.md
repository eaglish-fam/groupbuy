# 核准旅行公包接線 v1（工程契約，2026-10-04）

沿用唯一 `trip-editorial-guidelines.md`、`trip-city-guide-template.md` 與 `trip/IMAGE_PIPELINE.md`。這份文件只定義可填資料的接點，不建立第二條製作 pipeline，也不批准內容／素材或發布。g2 尚未接歐洲六頁或正式 builder。

## 唯一資料形狀及範例

機器契約：`trip/approved-travel-contract.mjs` 的 `validateApprovedTravelPackage`。完整、可執行範例只在 `tests/fixtures/travel-approved-package.mjs`；全部是 synthetic，不能作旅遊資訊、圖像權利或正式資料使用。不要複製 fixture 中的座標、日期、天數、地名或語句。

| 欄位 | 內容及來源責任 |
|---|---|
| `schema`、`approved` | `eaglish.approved-travel-package/v1`；approved:true 只記錄 Root 已核定，不能取代其當次回條或發布授權 |
| `coverage.countryIds/cityIds` | 公包內實際全部 IDs；下一版 caller 另傳此次核准兩國／四地 IDs，拒絕第五城、缺頁或改身份 |
| `sources[]` | id、kind（official/youtube/instagram/photo）、公開 HTTPS url、rights；official 必帶 checkedOn；可帶 label、locator（公開時碼／貼文 item 定位），不帶私有路徑／逐字稿目錄／task packet |
| `assets[]` | assetId、來源主圖 width/height、核准 alt/caption、focalPoint:[x,y] 0–100、sourceIds、lineage、variants |
| `assets[].lineage` | kind=photo/video-frame、原 sourceSha256、sourceWidth/sourceHeight、activePicture:{x,y,width,height}；影片畫格另帶精確整數 pts 及 timebase `1/90000` 等。crop 不越原圖，比例與輸出匹配；原始 bytes／權利由 Luca 紀錄，不以公包代驗原片 |
| `variants[]` | 每張至少兩尺寸含≤640px，明列 url/width/height/bytes/sha256，遞增寬、最高1440；與來源比例相符；保留640/960/1440既有大小預算。可 nested `/trip/assets/norway/…webp`，不可猜尺寸 filename、用 file: 或 traversal |
| `countries[]` | id/path/name/englishName/flag/title/description/intro/updatedOn、image assetId、sourceIds、cityIds、faq；單主城也成立，固定名稱「旅行總覽」不寫死三城 |
| `country.map`（選填） | assetId、核准 caption、sourceIds、pins:{cityId,x,y}，等价文字入口同時存在。新 geo 不由 adapter 生成；挪威離島位置／尺度待 Terra。六頁整合時若主題需要地圖，須先取得正確 geodata／map，不用空 map 宣稱完成 |
| `country.discovery`（整合首頁時必填） | region/subregion、查證 point:[lng,lat] 與 isoNumeric、summary、assetId、sourceIds；此時資料尚不進 live catalog |
| `cities[]` | id/countryId/path/name/englishName/destinationKind、archipelago 必有 visitedBase；title/description/author/updatedOn、兩句 intro、sourceIds、hero:[main,support1,support2 assetIds] |
| `city.places[]` | 本頁 id anchor、canonical stableId、title、paragraphs、sourceIds、三個不同互補 images、links；optional story:{text,sourceIds}，沒有真實故事就不畫 story，不能補家人對話 |
| `place.facts` | what/play/arrival/duration/availability/conditions 六欄，各有 label/value/sourceIds；停留與營業分開、當年實訪與現況分開；語意／官方查核由 Terra/Alma，不由 validator 推斷 |
| `city.cards[]` | target 指同頁 place.id，assetId 必屬同站三圖，核准 title/play/time/focalPoint；3:2 卡只短文、同 venue，不硬寫八卡 |
| `food/stay/arrival/rain/extension` | title/paragraphs/sourceIds、optional images/links；extension 可省略，其餘固定 city modules 不可缺失，FAQ→#plan→videos 排序由共用 helper 保證 |
| `faq[]`、`videoSourceIds` | question/answer/sourceIds；影片引用公包 sources 中 youtube/instagram，source label 由 Alma 明確提供 |
| `planner` | title/paragraphs/sourceIds、routes、calendar；routes 每個 id/sightseeingDays/pace=leisure或compact/label/note/sourceIds、days:[{title,description,stops:[place anchors]}]；不自動增路線、不沿用 SG 2–4天／館舍資料 |
| `planner.calendar[]` | placeId、validFrom/validThrough、closedDates、closedWeekdays 0–6、message、sourceIds。現行 helper 支援日期／固定星期休止及有效期間，不是即時預約、時間窗／船班演算法；更多規則由來源整合後按需要擴充 |

文字、caption/alt、地點身份、公開 href、圖片選擇與焦點、maps／票價／開放條件必須是 owner 核准輸入。g2 不決定荷蘭主城；斯瓦巴顯示／key_terms 依 Root 固定名稱，destinationKind=archipelago，以已核長年鎮為基地，不增第五篇。

## 公共 bytes 封閉

1. Root 下一版核定四城兩國、完整公包、媒體 manifest 與精確 SHA256。
2. 只把公開安全資料存 repo `trip/data/<approved-name>.json`，媒體在 repo `trip/assets/...`。原片、IG 取得帳號、私有 exports、工作 packet 保留 source owner／Project；公開 build 不讀它們。
3. `await readApprovedTravelPackage(root, {dataPath, expectedSha256, countryIds, cityIds})` 核 article bytes、所有 source/target membership、每張 WebP 的 bytes/hash/actual dimensions/format、root realpath/symlink 邊界。原片定位和 rights 是可審來源紀錄，不是此 helper 能重新驗證的原素材。
4. 只有閉包驗過的 `view.data` 交 `renderApprovedCity`／`renderApprovedCountry`；預設 noindex。`publication:true` 只是 HTML 輸出選項，不授權 push／merge／發布。
5. 乾淨 checkout 同 lockfile 就能重建；不發 API／HTTP 請求、不查私有檔、不加依賴或排程。

## Country allocation API

`allocateApprovedCountryTrip(profile, allowedCityIds, {routeId,days,pace,startDate})` 只用 approved profile：arrivalDays、departureDays、dayRange、minimumStay 各城 leisure/compact、extraDays:'round-robin'、routes:[id,label,description,cityIds,transferDays,validFrom,validThrough,sourceIds]、profile sourceIds。

每段轉移數可以不同／多日，不猜航班／開車時間；按 approved route order，完整結算抵達、stay、transfer、離境。未知 route、日期、pace、天數或不在核定期間回 valid:false；天數不足帶 needed。沒有根據 ID 排地理順序或 Thai 固定1日轉移。額外天數 round-robin 是顯式 profile 選擇，不推定實際航班可用。

`approvedCityDay(planner, {routeId,index,startDate})` 只讀核准路線／calendar。返回 blocked、outsideReviewedRules 及 calendarStatus；無規則返回 no-rules-provided，不當成當前健康／開放。這是純資料能力，g2 renderer 提供核准靜態 routes，**沒有偽裝工作的日期表單或新 controller**。g3 以真正城市來源接 ①天數②步調③日期／單日切換，再驗所有支援操作；時間窗／年齡／導覽條件若影響 route，不能只塞一段文字就宣稱程式已限制。

## R24 seam（尚未啟用）

`prepareApprovedR24Discovery(actualR24Html, approvedData, {catalog,config})` 僅作用真正 R24 的 `country-panels`、`home-guide-grid` marker，fail closed；用所在首頁的 `renderPhotoFrame` 及來源比例，不冒用 R22 frozen context、不硬套文章3:2。返回含新 country panel、city featured card、六頁 no-JS links、CollectionPage 的 html，以及相同 catalog/config projection。

先要求既有 catalog/config 相符，只新增核准 countries/guides、保留台灣資料；nested variants 在 `approvedPhoto` 中明列，不猜 unsuffixed 檔。不得只改舊 generic `renderTravelHome` 就說已改正式首頁。

g2 不 import 這個 seam 到 live build，不改既有 catalog/projection／atlas bundle。返回 `runtimeIntegrationRequired:true`：g3 必須接 `atlas-ui.mjs` 的 approvedPhoto renderer（舊 record 保留 frozen context 驗證）、實際 renderTravelHomeR24 config slot、country panels／static links、catalog/projection的同版reconcile、build ordering、image checker 與 SEO inventory。先 source identity freeze，才啟用兩國四篇。未正式接線不能宣稱 world／Europe 按鈕已可進新頁。

## 保全及驗收

全部新增元件 opt-in；SG/Thai renderer、CSS、圖片、資料與現有公開 HTML 不遷移。圖框 dimensions／比例、六問／字元 escaping／metadata／未知 route 與 byte closure 有 focused tests；fixture dry build 可生成兩國四篇 noindex 測試頁，但不是真歐洲文章、合法照片或讀者驗收。

g3 正式 source integration 後仍需 clean rebuild／verify、Root 六頁及新增首頁 1440/390/320px 真圖、首次lazy跳轉、facts/sticky/focus、所有route/date/pins、正式發布另版與實際部署回條。g2不使用 shared Chrome/IAB、不建立預覽服務、不發 Ezra/Telegram。

## g3 實際接線（取代上面的 g2 尚未接線狀態）

- 唯一 builder `scripts/build-trip.mjs` 開始時呼叫 `buildApprovedTravel`，先完成文章與媒體 hash／WebP 尺寸閉包，再写所有六頁。其他 builder、已發布城市與既有53筆台灣資料不遷移。
- `trip/data/approved-travel-registration-v1.json` 明列 schema=`eaglish.approved-travel-registration/v1`、repo-local `dataPath`、expectedSha256、countryIds/cityIds、publication boolean；候選必為 false。未登錄時現行首頁與舊旅行輸出完全沿用。publication flag 只決定 metadata，不授權發布。
- `renderTravelHomeR24` 實際套用同版 catalog/config/regions、country panels、featured cards、no-JS links、CollectionPage 新成員；`atlas-ui` 先處理明列 variants 的 approvedPhoto，舊 frozen R22 context 分支不變。新國家 pins 使用公包的實際 geography，不猜座標。
- image checker 包含全部六頁與來源 crop variants。可索引清單與 sitemap 沿用唯一 SEO inventory；noindex候選不進 sitemap，核准正式 revision 的 publication=true 才能進索引。分享參數保持 canonical 父頁。
- `countries[].intro` 正好兩句；`presentation` 可提供 overviewTitle/overviewText、citySummaries[{cityId,tag,pace,intro}]、themes[{id,label}]、placeThemes[{cityId,placeId,themeIds}]，全部由定稿來源提供，禁止按關鍵字猜分類。
- `geographicMap` 使用既有 Natural Earth 幾何、views[{id,label,note,bounds:[west,south,east,north],points:[{cityId,label,point:[lng,lat],sourceIds}]}]、caption/sourceIds、connections[{fromLabel,toLabel,label,mode,sourceIds}]。離島獨立尺度，飛行連線以虛線路線示意呈現，不當作公路或比例距離。
- `assets[].cardPhoto` 可保留 Luca 核對的獨立短卡 crop：width/height、activePicture、variants；與同一來源 bounds／比例一致、不可放大。主文與 hero 用原始 active-picture，短卡才用此 crop。新公包1440px上限採400KiB（409600bytes），640/960仍120000/220000；舊頁所有預算保持不變。這容納已核 ARTIS 401550bytes原variant，不重壓來源圖。
- `planner.routes[].days[].blocks`=[{start,end,description,placeIds,sourceIds?}]；HH:MM 支援24:00終點，時段不重疊、placeIds只指此日stops。交通／用餐／報到可為空placeIds，不能當入場時間檢查。
- Country route 可有 `terminalTransfer:{from,to,days,sourceIds}`，只將最後一站連回此國既有出境基地，保留獨立移動日；例如特羅姆瑟→奧斯陸，再隔日離境，不把回程塞進遊玩日或新增景點。日期／年齡符合的 route 優先於未知與衝突，再比較活動天數；只有未知時保留查證提示。
- `planner.rules[]`={placeId,sourceIds,url,note,validFrom,validThrough,minAge?,minimumMinutes?,needsAgeConfirmation?,needsDateConfirmation?,closedMonthDays?:['MM-DD'],overrides?:[{monthDay,opens,closes}],windows:[{from,to,weekdays:0–6[],opens,closes,months?:1–12[],startTimes?:['HH:MM']}]}。沒有已查官方日曆的業者 windows=[]且needsDateConfirmation=true。未知接待年齡始終提示聯絡業者，不能因填了年齡自動認可。
- 純 `approved-plan-model` 分別回 conflict/needs-check/within-reviewed-rules；任何狀態都不是即時名額。多日檢查使用目的地當地日期。country按arrival/stay/transfer/departure精確分日，選來源已核且少衝突的 city route；額外天數保留彈性休息，不虛構活動。
- 城市有天數／步調／route／日期／最小年齡／單日與分享；只提出已核可行路線或未超公告範圍的替換日期。國家有目的地組合／核定順序／整趟天數／步調／日期／最小年齡／逐日／分享；未支援的目的地組合明確請改選，不臨時創新行程。
- 公包只含公開 URL、來源 locator、rights、必要 lineage 与輸出variant。一次性來源正規化在 Project 工程區，正常／clean build 不讀 Project、原片、逐字稿或IG帳號。

- 步調只在來源資料確實有不同安排時呈現。固定城市路線只保留一個 pace，隱藏無效的選單；國家 pace 只在 minimumStay 分配有差異時顯示，絕不縮短固定活動或交通。
- 官方閉園時間衝突時，window 可用 closes=null 且 needsDateConfirmation=true，已知開門時間仍檢查，閉園未知明示查官網；明確的節日 overrides 可代替當日未知。
- 薄 editorial adapter 保留 source-owned day-reading、story paragraphs、extraFacts、supportImages、additionalGalleries、packing、videos 與 related。Inline Markdown links 以安全 escaping／balanced URL 解析，不執行 HTML；source provenance 只取公開引用，不复制來源私有路徑。

Root 仍須親自驗收真圖構圖、正文語意與全部操作；工程自動測試、synthetic headless 測試及本機候選發布不代替此接受，也不等於正式上線。
# Bounded reference timetables

`countries[].referencePlans` may preserve a source-approved, non-interactive
cross-country timetable next to the country planner. Each ID, public title,
sourceIds, exact calendarDays and contiguous numbered days with public paragraphs
are validated. It does not create a new selectable allocation route or certify
flight availability. Free destination checkboxes are not exposed: route choices
come only from allocation.routes, with visible individual city-planner links.
