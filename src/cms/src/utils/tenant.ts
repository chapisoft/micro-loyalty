/**
 * Tenant Management Utility
 * Strictly enforces Enterprise Zero-Hardcode Standard.
 * Zero hardcoded default tenant value for any specific entity.
 */

export const getStoredTenantId = (): string => {
  if (typeof window === 'undefined') return '';
  return (
    localStorage.getItem('selected_tenant_id') ||
    localStorage.getItem('tenant_id') ||
    ''
  );
};

export const setStoredTenantId = (tenantId: string): void => {
  if (typeof window === 'undefined') return;
  if (tenantId && tenantId.trim()) {
    const clean = tenantId.trim();
    localStorage.setItem('selected_tenant_id', clean);
    localStorage.setItem('tenant_id', clean);
  } else {
    localStorage.removeItem('selected_tenant_id');
    localStorage.removeItem('tenant_id');
  }
};
