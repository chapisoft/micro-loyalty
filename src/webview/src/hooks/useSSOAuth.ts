import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import i18n from '../language';
import { LoyaltyJSBridge, type NativeSessionPayload } from '../bridge/LoyaltyJSBridge';
import {
  LoyaltyApi,
  getTenantId,
  type SsoExchangeResponse,
  type TenantUserAuthRequest,
  type TenantUserContextResponse,
} from '../services/api';

export interface SsoUserSession {
  tenantId: string;
  externalUserId: string;
  token: string;
  fullName?: string;
  phoneNumber?: string;
  accountRole?: string;
}

export interface SSOAuthContextValue {
  session: SsoUserSession | null;
  userContext: TenantUserContextResponse | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  selectedTenantId: string;
  setTenantId: (tenantId: string) => void;
  loginWithTenantAccount: (req: TenantUserAuthRequest) => Promise<TenantUserContextResponse>;
  loginWithTicket: (ticket: string, tenantId?: string) => Promise<TenantUserContextResponse>;
  refreshContext: () => Promise<TenantUserContextResponse | null>;
  logout: () => void;
}

const THEME_COLOR_MAP: Record<string, { primary: string; accent: string }> = {
  delimart: { primary: '#2E7D32', accent: '#F57C00' },
  natcom: { primary: '#0056B3', accent: '#FFC107' },
  natcash: { primary: '#FE810D', accent: '#2E7D32' },
  micro_crm: { primary: '#2563EB', accent: '#FE810D' },
  default: { primary: '#FE810D', accent: '#2E7D32' },
};

const applyThemeColors = (themeOrTenant: string) => {
  const normalized = themeOrTenant.toLowerCase();
  const key = normalized.includes('delimart')
    ? 'delimart'
    : normalized.includes('natcom')
      ? 'natcom'
      : normalized.includes('micro_crm')
        ? 'micro_crm'
        : normalized.includes('natcash')
          ? 'natcash'
          : THEME_COLOR_MAP[normalized]
            ? normalized
            : 'default';
  const themeConfig = THEME_COLOR_MAP[key] || THEME_COLOR_MAP.default;
  document.documentElement.style.setProperty('--primary-color', themeConfig.primary);
  document.documentElement.style.setProperty('--accent-color', themeConfig.accent);
};

const persistSession = (ctx: {
  accessToken: string;
  tenantId: string;
  externalUserId: string;
}) => {
  sessionStorage.setItem('loyalty_token', ctx.accessToken);
  sessionStorage.setItem('loyalty_tenant', ctx.tenantId);
  sessionStorage.setItem('loyalty_user', ctx.externalUserId);
  localStorage.setItem('selected_tenant_id', ctx.tenantId);
};

const clearStoredSession = () => {
  sessionStorage.removeItem('loyalty_token');
  sessionStorage.removeItem('loyalty_user');
  sessionStorage.removeItem('loyalty_popup_shown');
};

const scrubAuthQueryParams = () => {
  const url = new URL(window.location.href);
  const sensitiveKeys = ['ticket', 'token', 'signature', 'timestamp'];
  let modified = false;
  for (const key of sensitiveKeys) {
    if (url.searchParams.has(key)) {
      url.searchParams.delete(key);
      modified = true;
    }
  }
  if (modified) {
    window.history.replaceState({}, '', url.toString());
  }
};

const SSOAuthContext = createContext<SSOAuthContextValue | null>(null);

export const SSOAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedTenantId, setSelectedTenantId] = useState<string>(() => getTenantId());
  const [session, setSession] = useState<SsoUserSession | null>(null);
  const [userContext, setUserContext] = useState<TenantUserContextResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const applyAuthenticatedContext = useCallback((ctx: TenantUserContextResponse) => {
    persistSession({
      accessToken: ctx.accessToken,
      tenantId: ctx.tenantId,
      externalUserId: ctx.externalUserId,
    });
    setSelectedTenantId(ctx.tenantId);
    applyThemeColors(ctx.tenantId);
    setSession({
      token: ctx.accessToken,
      tenantId: ctx.tenantId,
      externalUserId: ctx.externalUserId,
      fullName: ctx.fullName || ctx.profile?.fullName,
      phoneNumber: ctx.phoneNumber || ctx.profile?.phoneNumber,
      accountRole: ctx.accountRole,
    });
    setUserContext(ctx);
    setError(null);
  }, []);

  const setTenantId = useCallback((tenantId: string) => {
    const cleanTenant = tenantId.trim();
    if (!cleanTenant) return;
    sessionStorage.setItem('loyalty_tenant', cleanTenant);
    localStorage.setItem('selected_tenant_id', cleanTenant);
    setSelectedTenantId(cleanTenant);
    applyThemeColors(cleanTenant);

    const url = new URL(window.location.href);
    if (url.searchParams.has('tenantId') || url.searchParams.has('tenant_id')) {
      url.searchParams.delete('tenantId');
      url.searchParams.delete('tenant_id');
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  const loginWithTenantAccount = useCallback(
    async (req: TenantUserAuthRequest): Promise<TenantUserContextResponse> => {
      setError(null);
      try {
        const tenantId = req.tenantId || selectedTenantId || getTenantId();
        const ctx = await LoyaltyApi.authenticateTenantUser({ ...req, tenantId });
        applyAuthenticatedContext(ctx);
        return ctx;
      } catch (err: any) {
        const message = err?.message || i18n.t('sso.auth_failed');
        setError(message);
        throw err;
      }
    },
    [applyAuthenticatedContext, selectedTenantId]
  );

  const loginWithTicket = useCallback(
    async (ticket: string, tenantId?: string): Promise<TenantUserContextResponse> => {
      setError(null);
      try {
        const effectiveTenant = tenantId || selectedTenantId || getTenantId();
        const data: SsoExchangeResponse = await LoyaltyApi.exchangeSsoTicket(ticket, effectiveTenant);

        let ctx: TenantUserContextResponse;
        if (data.userContext) {
          ctx = data.userContext;
        } else {
          persistSession({
            accessToken: data.accessToken,
            tenantId: data.tenantId || effectiveTenant,
            externalUserId: data.externalUserId,
          });
          ctx = await LoyaltyApi.getMeContext(data.externalUserId);
        }

        scrubAuthQueryParams();

        applyAuthenticatedContext(ctx);
        return ctx;
      } catch (err: any) {
        console.error('[useSSOAuth] SSO ticket exchange error:', err);
        const message = err?.message || i18n.t('sso.auth_failed');
        setError(message);
        throw err;
      }
    },
    [applyAuthenticatedContext, selectedTenantId]
  );

  const refreshContext = useCallback(async (): Promise<TenantUserContextResponse | null> => {
    const token = sessionStorage.getItem('loyalty_token');
    if (!token) {
      return null;
    }
    try {
      const ctx = await LoyaltyApi.getMeContext();
      applyAuthenticatedContext(ctx);
      return ctx;
    } catch (err: any) {
      const status = (err as { status?: number })?.status;
      if (status === 401 || status === 403) {
        clearStoredSession();
        setSession(null);
        setUserContext(null);
      }
      return null;
    }
  }, [applyAuthenticatedContext]);

  const logout = useCallback(() => {
    clearStoredSession();
    setSession(null);
    setUserContext(null);
    setError(null);
  }, []);

  const authenticateFromNativeSession = useCallback(
    async (nativeSession: NativeSessionPayload, fallbackTenantId: string): Promise<boolean> => {
      if (nativeSession.sessionTicket) {
        await loginWithTicket(nativeSession.sessionTicket, nativeSession.tenantId || fallbackTenantId);
        return true;
      }
      if (nativeSession.externalUserId && (nativeSession.signature || nativeSession.token)) {
        const ctx = await LoyaltyApi.authenticateTenantUser({
          tenantId: nativeSession.tenantId || fallbackTenantId,
          externalUserId: nativeSession.externalUserId,
          phoneNumber: nativeSession.phoneNumber,
          fullName: nativeSession.fullName,
          accountRole: nativeSession.accountRole,
          partnerCode: nativeSession.partnerCode,
          verifyCode: nativeSession.token || nativeSession.signature,
          timestamp: nativeSession.timestamp,
          signature: nativeSession.signature,
          authMethod: nativeSession.signature ? 'HMAC_ASSERTION' : 'NATIVE_BRIDGE',
        });
        applyAuthenticatedContext(ctx);
        return true;
      }
      return false;
    },
    [applyAuthenticatedContext, loginWithTicket]
  );

  useEffect(() => {
    let active = true;

    const unsubscribeNativeSession = LoyaltyJSBridge.addEventListener(
      'onNativeSession',
      async (payload: NativeSessionPayload) => {
        if (!active || !payload) return;
        try {
          await authenticateFromNativeSession(payload, selectedTenantId || getTenantId());
        } catch (err: any) {
          if (active) {
            setError(err?.message || i18n.t('sso.auth_failed'));
          }
        }
      }
    );

    const bootstrapAuth = async () => {
      const params = new URLSearchParams(window.location.search);
      const ticket = params.get('ticket');
      const theme = params.get('theme');
      const tenantIdParam = params.get('tenantId') || params.get('tenant_id') || getTenantId();
      const userIdParam = params.get('userId') || params.get('user_id') || params.get('phone');
      const phoneParam = params.get('phone') || params.get('phoneNumber');
      const fullNameParam = params.get('fullName');
      const partnerCodeParam = params.get('partnerCode');
      const accountRoleParam = params.get('accountRole');
      const tokenParam = params.get('token');
      const timestampParam = params.get('timestamp');
      const signatureParam = params.get('signature');

      applyThemeColors(theme || tenantIdParam);

      if (ticket) {
        try {
          await loginWithTicket(ticket, tenantIdParam);
        } catch {
          // error state already set in loginWithTicket
        } finally {
          if (active) setLoading(false);
        }
        return;
      }

      if (userIdParam && signatureParam && timestampParam) {
        const parsedTs = Number(timestampParam);
        if (!Number.isNaN(parsedTs)) {
          try {
            const ctx = await LoyaltyApi.authenticateTenantUser({
              tenantId: tenantIdParam,
              externalUserId: userIdParam,
              phoneNumber: phoneParam || userIdParam,
              fullName: fullNameParam || undefined,
              partnerCode: partnerCodeParam || undefined,
              accountRole: accountRoleParam || undefined,
              verifyCode: signatureParam,
              timestamp: parsedTs,
              signature: signatureParam,
              authMethod: 'HMAC_ASSERTION',
            });
            scrubAuthQueryParams();
            if (active) {
              applyAuthenticatedContext(ctx);
            }
          } catch (err: any) {
            scrubAuthQueryParams();
            if (active) {
              setError(err?.message || i18n.t('sso.auth_failed'));
            }
          } finally {
            if (active) setLoading(false);
          }
          return;
        }
      }

      if (userIdParam && tokenParam) {
        try {
          const ctx = await LoyaltyApi.authenticateTenantUser({
            tenantId: tenantIdParam,
            externalUserId: userIdParam,
            phoneNumber: phoneParam || userIdParam,
            fullName: fullNameParam || undefined,
            partnerCode: partnerCodeParam || undefined,
            accountRole: accountRoleParam || undefined,
            verifyCode: tokenParam,
            authMethod: 'TENANT_TOKEN',
          });
          scrubAuthQueryParams();
          if (active) {
            applyAuthenticatedContext(ctx);
          }
        } catch (err: any) {
          scrubAuthQueryParams();
          if (active) {
            setError(err?.message || i18n.t('sso.auth_failed'));
          }
        } finally {
          if (active) setLoading(false);
        }
        return;
      }

      try {
        const nativeSession = await LoyaltyJSBridge.getNativeSession();
        if (nativeSession) {
          const handled = await authenticateFromNativeSession(nativeSession, tenantIdParam);
          if (handled) {
            if (active) setLoading(false);
            return;
          }
        }
      } catch (err: any) {
        console.warn('[useSSOAuth] Native session handshake failed:', err);
        if (active) {
          setError(err?.message || i18n.t('sso.auth_failed'));
        }
      }

      const storedToken = sessionStorage.getItem('loyalty_token');
      const storedUser = sessionStorage.getItem('loyalty_user');
      if (storedToken && storedUser) {
        try {
          const ctx = await LoyaltyApi.getMeContext();
          if (active) {
            applyAuthenticatedContext(ctx);
          }
        } catch (err: any) {
          console.warn('[useSSOAuth] Stored session expired or invalid:', err);
          clearStoredSession();
          if (active) {
            setSession(null);
            setUserContext(null);
          }
        } finally {
          if (active) setLoading(false);
        }
        return;
      }

      if (window.ReactNativeWebView && userIdParam) {
        try {
          const nativeToken = await LoyaltyJSBridge.getUserToken();
          if (nativeToken) {
            const ctx = await LoyaltyApi.authenticateTenantUser({
              tenantId: tenantIdParam,
              externalUserId: userIdParam,
              verifyCode: nativeToken,
              authMethod: 'NATIVE_BRIDGE',
            });
            if (active) {
              applyAuthenticatedContext(ctx);
            }
            if (active) setLoading(false);
            return;
          }
        } catch (err) {
          console.warn('[useSSOAuth] Native bridge auth skipped:', err);
        }
      }

      if (active) {
        setLoading(false);
      }
    };

    void bootstrapAuth();
    return () => {
      active = false;
      unsubscribeNativeSession();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value: SSOAuthContextValue = {
    session,
    userContext,
    isAuthenticated: !!session?.token && !!session?.externalUserId,
    loading,
    error,
    selectedTenantId,
    setTenantId,
    loginWithTenantAccount,
    loginWithTicket,
    refreshContext,
    logout,
  };

  return React.createElement(SSOAuthContext.Provider, { value }, children);
};

export const useSSOAuth = (): SSOAuthContextValue => {
  const ctx = useContext(SSOAuthContext);
  if (!ctx) {
    throw new Error('useSSOAuth must be used inside SSOAuthProvider');
  }
  return ctx;
};

export default useSSOAuth;
