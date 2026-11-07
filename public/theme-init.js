(function () {
  try {
    var el = document.documentElement;
    // The theme is automatic. A choice saved by the old manual switch is ignored and removed.
    try {
      localStorage.removeItem("help-nearby-theme");
    } catch (e) {
      /* storage blocked */
    }
    // Light in sunny countries (the server sets data-auto-theme="light" from the Vercel country header),
    // otherwise the device setting.
    var sunny = el.getAttribute("data-auto-theme") === "light";
    var dark = !sunny && window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (dark) {
      el.classList.add("dark");
    } else {
      el.classList.remove("dark");
    }
    el.style.colorScheme = dark ? "dark" : "light";
  } catch (e) {
    /* ignore */
  }
})();
