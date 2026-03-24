(function () {
  var keep = new Set(['accessKey', 'clientKey', 'sidebar_state', 'clientMeta', '__next_hmr_refresh_hash__']);
  var cookies = document.cookie.split(';').map(function(c) { return c.trim(); });

  cookies.forEach(function (c) {
    var name = c.split('=')[0];
    if (keep.has(name)) return;
    document.cookie = name + '=; Max-Age=0; path=/; domain=' + location.hostname;
    document.cookie = name + '=; Max-Age=0; path=/';
  });
})();
