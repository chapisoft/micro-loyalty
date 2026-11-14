declare global {
  interface Window {
    __ENV__?: {
      API_URL?: string;
      API_GATEWAY_URL?: string;
      TENANT_ID?: string;
      DEFAULT_TENANT_ID?: string;
      PUBLIC_CMS_URL?: string;
      PUBLIC_WEBVIEW_URL?: string;
      PUBLIC_PARTNER_PORTAL_URL?: string;
    };
  }
}

export function getApiBaseUrl(): string {
  const configured = window.__ENV__?.API_GATEWAY_URL || window.__ENV__?.API_URL || '';
  if (configured) {
    return configured;
  }
  if (typeof window !== 'undefined' && window.location.hostname.includes('mid.io.vn')) {
    return `${window.location.protocol}//api.mid.io.vn`;
  }
  return '';
}

export function getDefaultTenantId(): string {
  return window.__ENV__?.DEFAULT_TENANT_ID || window.__ENV__?.TENANT_ID || 'TENANT_NATCASH';
}

export async function loadRuntimeConfig(): Promise<void> {
  try {
    const res = await fetch('/config/env-config.json', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      window.__ENV__ = {
        ...window.__ENV__,
        ...data,
      };
    }
  } catch {
    // Fallback gracefully to /env-config.js or Vite dev proxy
  }
}
