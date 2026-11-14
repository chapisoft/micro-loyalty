import { KeyStorage } from '@/constants';
import { UserProfile } from '@/models';
import { apiClient } from '@/service/apiClient';
import { LocalStorage } from '@/utils/localStorage';

export interface LoginPayload {
  username: string;
  password: string;
}

export interface LoginResponse {
  userId?: number | string;
  username?: string;
  userName?: string;
  fullName?: string;
  email?: string;
  roles?: string[];
  partnerId?: number | string;
  partnerCode?: string;
  partnerName?: string;
  tenantId?: string;
  branchId?: number;
  accessToken?: string;
  refreshToken?: string;
  data?: LoginResponse;
}

export async function loginPartnerAccount(payload: LoginPayload): Promise<UserProfile> {
  let response: LoginResponse;
  try {
    response = await apiClient.post('/auth/login', payload);
  } catch (err: unknown) {
    const errObj = err as { message?: string; detail?: string; response?: { data?: { message?: string } } };
    const message = errObj?.response?.data?.message || errObj?.message || errObj?.detail || 'Authentication failed';
    throw new Error(message);
  }

  const authData = response?.data?.accessToken ? response.data : response;

  if (!authData?.accessToken) {
    const message = (authData as { message?: string })?.message || 'Authentication failed';
    throw new Error(message);
  }

  const profile: UserProfile = {
    userId: authData.userId,
    username: authData.username || authData.userName || payload.username,
    userName: authData.userName || authData.username || payload.username,
    fullName: authData.fullName || authData.username || payload.username,
    email: authData.email,
    roles: authData.roles || ['ROLE_PARTNER'],
    partnerId: authData.partnerId,
    partnerCode: authData.partnerCode,
    partnerName: authData.partnerName,
    tenantId: authData.tenantId,
    branchId: authData.branchId,
  };

  LocalStorage.set(KeyStorage.ACCESS_TOKEN, authData.accessToken);
  if (authData.refreshToken) {
    LocalStorage.set(KeyStorage.REFRESH_TOKEN, authData.refreshToken);
  }
  LocalStorage.set(KeyStorage.USER, profile);
  if (profile.tenantId) {
    LocalStorage.set(KeyStorage.SELECTED_TENANT, profile.tenantId);
    localStorage.setItem('selected_tenant_id', profile.tenantId);
  }

  return profile;
}

export function logoutPartnerAccount(): void {
  LocalStorage.remove(KeyStorage.ACCESS_TOKEN);
  LocalStorage.remove(KeyStorage.REFRESH_TOKEN);
  LocalStorage.remove(KeyStorage.USER);
  LocalStorage.remove(KeyStorage.SELECTED_TENANT);
  localStorage.removeItem('selected_tenant_id');
}

export function getStoredPartnerUser(): UserProfile | null {
  return LocalStorage.get<UserProfile>(KeyStorage.USER);
}
