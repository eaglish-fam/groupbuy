// Sourced preview data; no provider SDK, credentials, requests or live inventory.
// Booking URLs match the existing guide catalog/builders. checkedAt is the guide
// source check date, not a claim that current prices or availability were rechecked.
// Reconcile against the named source records when updating offers.
export const travelHomeCommerce = {
  "disclosure": "以下活動連結含聯盟連結；透過連結購買，我們可能獲得佣金。價格、可訂日期與方案內容以預訂頁為準。",
  "offers": [
    {
      "id": "th-bangkok-sea-life-ocean-world-booking",
      "countryId": "thailand",
      "guideId": "bangkok",
      "placeId": "th-bangkok-sea-life-ocean-world",
      "title": "SEA LIFE 曼谷海洋世界",
      "why": "想安排室內水族館，先分清基本入場與加購體驗。",
      "whatToCheck": "確認入場日期、旅客身分、兒童條件，玻璃底船與 4D 是否包含。",
      "guideHref": "/trip/guides/bangkok-with-kids/#indoors",
      "source": {
        "file": "trip/data/bangkok-places.json",
        "anchor": "indoors",
        "checkedAt": "2026-09-27"
      },
      "providers": [
        {
          "id": "klook",
          "label": "Klook：查看入場與套票",
          "url": "https://affiliate.klook.com/redirect?aid=43858&aff_adid=921120&k_site=https%3A%2F%2Fwww.klook.com%2Fzh-TW%2Factivity%2F357-sea-life-bangkok-ocean-world-bangkok%2F",
          "affiliate": true
        },
        {
          "id": "kkday",
          "label": "KKday：查看入場與套票",
          "url": "https://www.kkday.com/zh-tw/product/2735?cid=22159",
          "affiliate": true
        }
      ]
    },
    {
      "id": "th-bangkok-jurassic-world-experience-booking",
      "countryId": "thailand",
      "guideId": "bangkok",
      "placeId": "th-bangkok-jurassic-world-experience",
      "title": "曼谷侏羅紀世界體驗",
      "why": "喜歡恐龍場景的家庭，可以接著安排 Asiatique 河畔散步。",
      "whatToCheck": "先看孩子能否接受聲光效果，再核對場次、兒童票、陪同與退改規定。",
      "guideHref": "/trip/guides/bangkok-with-kids/#jurassic",
      "source": {
        "file": "trip/data/bangkok-places.json",
        "anchor": "jurassic",
        "checkedAt": "2026-09-27"
      },
      "providers": [
        {
          "id": "klook",
          "label": "Klook：查看侏羅紀體驗場次",
          "url": "https://affiliate.klook.com/redirect?aid=43858&aff_adid=921120&k_site=https%3A%2F%2Fwww.klook.com%2Fzh-TW%2Factivity%2F187815-jurassic-world-the-experience-bangkok-at-asiatique-the-riverfront%2F",
          "affiliate": true
        }
      ]
    },
    {
      "id": "th-chiang-mai-poopoopaper-booking",
      "countryId": "thailand",
      "guideId": "chiang-mai",
      "placeId": "th-chiang-mai-poopoopaper",
      "title": "清邁紙園導覽與造紙體驗",
      "why": "帶孩子看纖維造紙製程，選擇想參加的導覽與手作。",
      "whatToCheck": "確認導覽語言、日期、手作材料與退改條件；需要中文服務時再次確認當日場次。",
      "guideHref": "/trip/guides/chiang-mai-with-kids/#paper",
      "source": {
        "file": "trip/data/chiang-mai-places.json",
        "linkBuilder": "scripts/trip-chiang-mai.mjs",
        "anchor": "paper",
        "checkedAt": "2026-09-27"
      },
      "providers": [
        {
          "id": "klook",
          "label": "比較紙園導覽與造紙方案",
          "url": "https://affiliate.klook.com/redirect?aid=43858&aff_adid=921120&k_site=https%3A%2F%2Fwww.klook.com%2Fzh-TW%2Factivity%2F189925-elephant-poopoopaper-park-ticket-chiang-mai%2F",
          "affiliate": true
        }
      ]
    }
  ],
  "capabilities": [
    {
      "id": "activities",
      "label": "景點與體驗",
      "status": "available",
      "description": "從已整理的景點挑活動，再查看日期與方案。"
    },
    {
      "id": "lodging",
      "label": "住宿選擇",
      "status": "needsLink",
      "description": "住宿搜尋入口準備中。"
    },
    {
      "id": "flights",
      "label": "便宜機票雷達",
      "status": "paused",
      "pausedBy": "user",
      "description": "機票雷達暫停更新。"
    }
  ]
};
