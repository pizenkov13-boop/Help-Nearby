(function () {
  try {
    var stored = localStorage.getItem("hn-language");
    var supported = ["en", "ru", "es", "fr", "de", "zh", "ar"];
    var el = document.documentElement;
    // The server renders the browser's language. A language picked by hand wins: hide the page
    // until the app has switched to it, so the other language is never seen.
    if (stored && supported.indexOf(stored) !== -1 && stored !== el.lang) {
      el.lang = stored;
      el.dir = stored === "ar" ? "rtl" : "ltr";
      el.classList.add("lang-pending");
      setTimeout(function () {
        el.classList.remove("lang-pending");
      }, 2500);
    }
  } catch (e) {
    /* ignore */
  }
})();
