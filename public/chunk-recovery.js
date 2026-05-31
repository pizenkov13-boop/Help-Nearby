(function () {
  var reloadKey = "help-nearby-chunk-reload";
  var chunkErrorPattern = /ChunkLoadError|Loading chunk \d+ failed/i;

  function hardReload() {
    if (sessionStorage.getItem(reloadKey)) return;
    sessionStorage.setItem(reloadKey, "1");

    function navigate() {
      var url = new URL(window.location.href);
      url.searchParams.set("_cb", String(Date.now()));
      window.location.replace(url.toString());
    }

    if ("caches" in window) {
      caches
        .keys()
        .then(function (keys) {
          return Promise.all(
            keys.map(function (key) {
              return caches.delete(key);
            }),
          );
        })
        .finally(navigate);
      return;
    }

    navigate();
  }

  function isChunkLoadFailure(message) {
    return chunkErrorPattern.test(message || "");
  }

  window.addEventListener("error", function (event) {
    var message =
      event.message || (event.error && event.error.message) || "";
    if (isChunkLoadFailure(message)) hardReload();
  });

  window.addEventListener("unhandledrejection", function (event) {
    var reason = event.reason;
    var message =
      (reason && reason.message) || String(reason || "");
    if (isChunkLoadFailure(message)) hardReload();
  });
})();
