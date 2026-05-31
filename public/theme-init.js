(function () {
  try {
    var k = "help-nearby-theme";
    var t = localStorage.getItem(k);
    var d = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var el = document.documentElement;
    if (t === "dark" || (t === "system" && d) || (!t && d)) {
      el.classList.add("dark");
    } else {
      el.classList.remove("dark");
    }
  } catch (e) {
    /* ignore */
  }
})();
