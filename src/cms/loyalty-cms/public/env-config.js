(function() {
  const hostname = window.location.hostname;
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
  const origin = window.location.origin;
  const apiBase = isLocal ? 'https://cms.miotp.io.vn/cms' : (origin + '/cms');

  window.__ENV__ = {
    VITE_MODE: isLocal ? 'development' : 'production',
    VITE_API_URL: apiBase,
    VITE_API_AUTH_URL: apiBase,
    VITE_IMAGE_URL: isLocal ? 'https://cms.miotp.io.vn/' : (origin + '/'),
    VITE_ACCESS_TOKEN: '',
    VITE_CONTEXT_PATH: '/'
  };
})();
