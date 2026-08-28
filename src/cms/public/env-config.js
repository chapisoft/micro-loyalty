(function() {
  const hostname = window.location.hostname;
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
  const origin = window.location.origin;
  const protocol = window.location.protocol;

  // Cũ (gửi tới Gateway production):
  // const apiBase = isLocal ? 'https://api.mid.io.vn' : (hostname.includes('mid.io.vn') ? (protocol + '//api.mid.io.vn') : (origin + '/loyalty'));

  // Mới (gửi tới Backend Service local):
  const apiBase = isLocal 
    ? 'http://localhost:8080/loyalty-service' 
    : (hostname.includes('mid.io.vn') ? (protocol + '//api.mid.io.vn') : (origin + '/loyalty'));

  window.__ENV__ = {
    VITE_MODE: isLocal ? 'development' : 'production',
    VITE_API_URL: apiBase,
    VITE_API_AUTH_URL: apiBase,
    // VITE_IMAGE_URL: isLocal ? 'https://cms.mid.io.vn/' : (origin + '/'),
    VITE_IMAGE_URL: isLocal ? 'http://localhost:8080/' : (origin + '/'),
    VITE_ACCESS_TOKEN: '',
    VITE_CONTEXT_PATH: '/'
  };
})();
