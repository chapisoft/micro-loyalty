/**
 * Tenant Management Utility
 * Strictly enforces Enterprise Zero-Hardcode Standard.
 * Zero hardcoded default tenant value for any specific entity.
 */

// Clear any legacy persistent partner override to guarantee default is ALL
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('selected_tenant_id');
    localStorage.removeItem('tenant_id');
  } catch {
    // Ignore storage errors
  }
}

export const getStoredTenantId = (): string => {
  return 'ALL';
};

export const setStoredTenantId = (tenantId: string): void => {
  // Always default to 'ALL' on initial page loads and resets
  void tenantId;
};
