(function() {
  const hostname = window.location.hostname;
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
  const origin = window.location.origin;
  const protocol = window.location.protocol;

  // Local chạy qua Vite API Gateway Proxy (same-origin); SaaS trỏ api.mid.io.vn; On-Premise trỏ trực tiếp Nginx origin
  const apiBase = isLocal
    ? origin
    : (hostname.includes('mid.io.vn') ? (protocol + '//api.mid.io.vn') : origin);

  window.__ENV__ = {
    VITE_MODE: isLocal ? 'development' : 'production',
    VITE_API_URL: apiBase,
    VITE_API_AUTH_URL: apiBase,
    VITE_IMAGE_URL: origin + '/',
    VITE_ACCESS_TOKEN: '',
    VITE_CONTEXT_PATH: '/'
  };
})();
