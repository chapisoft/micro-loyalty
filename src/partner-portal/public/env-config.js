(function () {
  var hostname = window.location.hostname;
  var protocol = window.location.protocol;
  var apiBase = hostname.indexOf('mid.io.vn') !== -1 ? protocol + '//api.mid.io.vn' : '';

  window.__ENV__ = {
    API_URL: (window.__ENV__ && window.__ENV__.API_URL) || apiBase,
    API_GATEWAY_URL: (window.__ENV__ && window.__ENV__.API_GATEWAY_URL) || apiBase,
    TENANT_ID: (window.__ENV__ && window.__ENV__.TENANT_ID) || 'TENANT_NATCASH',
  };
})();
