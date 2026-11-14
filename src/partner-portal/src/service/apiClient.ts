import axios, { AxiosInstance } from 'axios';

import { KeyStorage, PARTNER_PORTAL_CONSTANTS } from '@/constants';
import type { UserProfile } from '@/models';
import { getApiBaseUrl } from '@/service/config';
import { LocalStorage } from '@/utils/localStorage';

const apiClient: AxiosInstance = axios.create({
  timeout: PARTNER_PORTAL_CONSTANTS.HTTP_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const baseUrl = getApiBaseUrl();
    if (baseUrl) {
      config.baseURL = baseUrl;
    }

    const token = LocalStorage.get<string>(KeyStorage.ACCESS_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const storedUser = LocalStorage.get<UserProfile>(KeyStorage.USER);
    if (storedUser?.tenantId) {
      config.headers['X-Tenant-Id'] = storedUser.tenantId;
    }
    if (storedUser?.partnerId !== undefined && storedUser?.partnerId !== null && String(storedUser.partnerId) !== '') {
      config.headers['X-Partner-Id'] = String(storedUser.partnerId);
    }

    const language = LocalStorage.get<string>(KeyStorage.LANGUAGE) || PARTNER_PORTAL_CONSTANTS.DEFAULT_LANGUAGE;
    config.headers.language = language;

    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => {
    const data = response.data;
    if (data && typeof data === 'object' && 'code' in data && data.code === 401) {
      return Promise.reject(data);
    }
    return data;
  },
  async (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      LocalStorage.remove(KeyStorage.ACCESS_TOKEN);
      LocalStorage.remove(KeyStorage.REFRESH_TOKEN);
      LocalStorage.remove(KeyStorage.USER);
      if (!window.location.pathname.startsWith('/auth')) {
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error?.response?.data || error);
  }
);

export { apiClient };
