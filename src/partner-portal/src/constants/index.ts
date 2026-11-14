export enum KeyStorage {
  ACCESS_TOKEN = 'accessToken',
  REFRESH_TOKEN = 'refreshToken',
  USER = 'user',
  LANGUAGE = 'lng',
  SELECTED_TENANT = 'selectedTenantId',
  SELECTED_TENANT_ID = 'selected_tenant_id',
}

export const PARTNER_PORTAL_CONSTANTS = {
  DEFAULT_TENANT_ID: 'TENANT_NATCASH',
  DEFAULT_LANGUAGE: 'vi',
  DEFAULT_EXCHANGE_RATE: 1,
  HTTP_TIMEOUT_MS: 30000,
  DEFAULT_LOGIN_USERNAME: 'delimart',
  DEFAULT_LOGIN_PASSWORD: 'Admin@123456',
} as const;

export const SUPPORTED_LANGUAGES = [
  { code: 'vi', name: 'Tiếng Việt (VN)', short: 'VI' },
  { code: 'en', name: 'English (EN)', short: 'EN' },
  { code: 'fr', name: 'Français (FR)', short: 'FR' },
  { code: 'ht', name: 'Kreyòl Ayisyen (HT)', short: 'HT' },
] as const;
