import { cmsApiClient } from './config';

export interface User {
  id?: number;
  phoneNumber: string;
  status: number;
  wrongPinCount: number;
  lockedUntil?: string;
  deviceId?: string;
  createdAt?: string;
  updatedAt?: string;
}

class UserService {
  async getAll(): Promise<User[]> {
    try {
      const response: any = await cmsApiClient.get('/api/v1/users');
      if (Array.isArray(response)) return response;
      if (response && Array.isArray(response.data)) return response.data;
      if (response && Array.isArray(response.users)) return response.users;
      return [];
    } catch (e) {
      console.error('[UserService.getAll] Error:', e);
      return [];
    }
  }

  async unlockUser(id: number): Promise<any> {
    const response: any = await cmsApiClient.post(`/api/v1/users/${id}/unlock`, {});
    return response?.data || response;
  }
}

export const userService = new UserService();
