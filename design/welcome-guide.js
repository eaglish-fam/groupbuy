/* 首次來訪引導「你想找什麼？」（Hiram 2026-11-10）。
 * 只在點「幫我找」時打開（Hiram 2026-11-12）；原本首訪自動跳出已取消。
 * 選分類 → 交給 design.js 既有的 [data-category] 點擊流程篩選並捲到目錄；
 * 「看鷹家日常」→ /everyday/；「先自己逛逛」、Esc、點背景 → 關閉。三種都記住，不再自動出現。
 * 「不知道從哪看起？」可以隨時重新打開。 */
(function () {
  "use strict";
  var KEY = "eg_welcome_v1";

  function shouldShow(loc, storage) {
    if (loc.hash && loc.hash !== "#") return false;
    if (/[?&]p=/.test(loc.search || "")) return false;
    try {
      return storage.getItem(KEY) !== "done";
    } catch (e) {
      return false; // 讀不到記錄就不打擾，避免每次都跳出來
    }
  }
  function remember(storage) {
    try { storage.setItem(KEY, "done"); } catch (e) {}
  }
  function track(choice) {
    try {
      if (typeof window.gtag === "function")
        window.gtag("event", "welcome_guide", { choice: choice, event_category: "engagement" });
    } catch (e) {}
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { shouldShow: shouldShow, KEY: KEY };
    return;
  }

  var dialog = document.getElementById("welcome-guide");
  if (!dialog || typeof dialog.showModal !== "function") return;

  function open() {
    if (dialog.open) return;
    dialog.showModal();
    var first = dialog.querySelector("[data-welcome-choice]");
    if (first) first.focus();
  }
  function close(choice) {
    remember(window.localStorage);
    track(choice);
    if (dialog.open) dialog.close();
  }

  // Bubbles before design.js's document-level [data-category] handler, so the dialog is
  // closed before that handler scrolls the catalogue into view.
  dialog.addEventListener("click", function (e) {
    var choice = e.target.closest("[data-welcome-choice]");
    if (choice) return close(choice.dataset.welcomeChoice);
    if (e.target.closest("[data-welcome-skip]")) return close("skip");
    if (e.target === dialog) close("backdrop");
  });
  dialog.addEventListener("cancel", function () { close("escape"); });
  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-welcome-open]")) { track("reopen"); open(); }
  });

  // Hiram 2026-11-12：不自動跳出；點「幫我找」才打開。shouldShow 保留給之後若要恢復首訪自動跳出。
})();
