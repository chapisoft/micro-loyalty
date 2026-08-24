import { useEffect, useState } from 'react';

export interface SsoUserSession {
  tenantId: string;
  externalUserId: string;
  token: string;
}

const THEME_COLOR_MAP: Record<string, { primary: string; accent: string }> = {
  delimart: { primary: '#2E7D32', accent: '#F57C00' },
  natcom: { primary: '#0056B3', accent: '#FFC107' },
  natcash: { primary: '#F28230', accent: '#2E7D32' },
  default: { primary: '#4F46E5', accent: '#EC4899' },
};

export const useSSOAuth = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [session, setSession] = useState<SsoUserSession | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ticket = params.get('ticket');
    const theme = params.get('theme') || 'default';
    const tenantIdParam = params.get('tenantId') || 'DEFAULT';

    // 1. Cấu hình biến màu sắc nhận diện thương hiệu (CSS Variables)
    const themeConfig = THEME_COLOR_MAP[theme.toLowerCase()] || THEME_COLOR_MAP.default;
    document.documentElement.style.setProperty('--primary-color', themeConfig.primary);
    document.documentElement.style.setProperty('--accent-color', themeConfig.accent);

    // 2. Kiểm tra token đã lưu trong SessionStorage
    const storedToken = sessionStorage.getItem('loyalty_token');
    const storedTenant = sessionStorage.getItem('loyalty_tenant') || tenantIdParam;
    const storedUser = sessionStorage.getItem('loyalty_user') || 'ANONYMOUS';

    if (ticket) {
      // 3. Đổi vé SSO Ticket lấy JWT Access Token
      exchangeSsoTicket(ticket, tenantIdParam);
    } else if (storedToken) {
      setSession({
        token: storedToken,
        tenantId: storedTenant,
        externalUserId: storedUser,
      });
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, []);

  const exchangeSsoTicket = async (ticket: string, tenantId: string) => {
    try {
      const response = await fetch('/loyalty/v1/sso/exchange-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Id': tenantId,
        },
        body: JSON.stringify({ sessionTicket: ticket }),
      });

      if (!response.ok) {
        throw new Error(`Đổi vé SSO thất bại: HTTP ${response.status}`);
      }

      const data = await response.json();
      const userSession: SsoUserSession = {
        token: data.accessToken,
        tenantId: data.tenantId || tenantId,
        externalUserId: data.externalUserId,
      };

      sessionStorage.setItem('loyalty_token', data.accessToken);
      sessionStorage.setItem('loyalty_tenant', userSession.tenantId);
      sessionStorage.setItem('loyalty_user', userSession.externalUserId);

      // Xóa tham số ticket khỏi URL để bảo mật
      const url = new URL(window.location.href);
      url.searchParams.delete('ticket');
      window.history.replaceState({}, '', url.toString());

      setSession(userSession);
      setError(null);
    } catch (err: any) {
      console.error('[useSSOAuth] Lỗi xác thực SSO:', err);
      setError(err.message || 'Xác thực vé SSO không thành công');
    } finally {
      setLoading(false);
    }
  };

  return {
    session,
    isAuthenticated: !!session?.token,
    loading,
    error,
  };
};

export default useSSOAuth;
