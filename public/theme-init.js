(function () {
  try {
    var k = "help-nearby-theme";
    var t = localStorage.getItem(k);
    var d = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var el = document.documentElement;
    // Auto (nothing saved, or "system") follows the device, except in sunny countries (data-auto-theme="light").
    var autoLight = el.getAttribute("data-auto-theme") === "light";
    if (t === "dark" || (t !== "light" && d && !autoLight)) {
      el.classList.add("dark");
    } else {
      el.classList.remove("dark");
    }
  } catch (e) {
    /* ignore */
  }
})();
