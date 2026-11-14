import { cmsApiClient } from './config';

export interface SandboxUser {
  id?: number;
  username: string;
  password?: string;
  fullName: string;
  phone?: string;
  email?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'LOCKED' | string;
  lastLoginAt?: string;
  groupIds?: number[];
  groupNames?: string[];
}

export interface SandboxGroup {
  id?: number;
  name: string;
  description?: string;
  menuIds?: number[];
}

export interface SandboxMenu {
  id?: number;
  parentId?: number;
  name: string;
  path: string;
  icon?: string;
  menuOrder?: number;
}

export interface SandboxContent {
  id?: number;
  menuId: number;
  title?: string;
  bodyMarkdown?: string;
  codeDemo?: string;
  docFilePath?: string;
  codeFilePath?: string;
  postmanUrl?: string;
  testAccountInfo?: string;
}

class SandboxAdminService {
  // USERS
  async getUsers(): Promise<SandboxUser[]> {
    try {
      const res: any = await cmsApiClient.get('/api/v1/sandbox/admin/users');
      return Array.isArray(res) ? res : res?.data || [];
    } catch (e) {
      console.warn('[SandboxAdminService.getUsers] Fallback or error:', e);
      return [];
    }
  }

  async createUser(user: SandboxUser): Promise<SandboxUser> {
    const res: any = await cmsApiClient.post('/api/v1/sandbox/admin/users', user);
    return res?.data || res;
  }

  async approveUser(id: number): Promise<void> {
    await cmsApiClient.post(`/api/v1/sandbox/admin/users/${id}/approve`);
  }

  async toggleUserStatus(id: number, status: string): Promise<void> {
    await cmsApiClient.post(`/api/v1/sandbox/admin/users/${id}/toggle-status?status=${status}`);
  }

  // GROUPS
  async getGroups(): Promise<SandboxGroup[]> {
    try {
      const res: any = await cmsApiClient.get('/api/v1/sandbox/admin/groups');
      return Array.isArray(res) ? res : res?.data || [];
    } catch (e) {
      console.warn('[SandboxAdminService.getGroups] Fallback or error:', e);
      return [];
    }
  }

  async createGroup(group: SandboxGroup): Promise<SandboxGroup> {
    const res: any = await cmsApiClient.post('/api/v1/sandbox/admin/groups', group);
    return res?.data || res;
  }

  async assignGroupMenus(groupId: number, menuIds: number[]): Promise<void> {
    await cmsApiClient.post(`/api/v1/sandbox/admin/groups/${groupId}/menus`, menuIds);
  }

  // MENUS
  async getMenus(): Promise<SandboxMenu[]> {
    try {
      const res: any = await cmsApiClient.get('/api/v1/sandbox/admin/menus');
      return Array.isArray(res) ? res : res?.data || [];
    } catch (e) {
      console.warn('[SandboxAdminService.getMenus] Fallback or error:', e);
      return [];
    }
  }

  async createMenu(menu: SandboxMenu): Promise<SandboxMenu> {
    const res: any = await cmsApiClient.post('/api/v1/sandbox/admin/menus', menu);
    return res?.data || res;
  }

  async deleteMenu(id: number): Promise<void> {
    await cmsApiClient.delete(`/api/v1/sandbox/admin/menus/${id}`);
  }

  // CONTENTS
  async getContent(menuId: number): Promise<SandboxContent> {
    try {
      const res: any = await cmsApiClient.get(`/api/v1/sandbox/admin/contents/menu/${menuId}`);
      return res?.data || res || { menuId };
    } catch {
      return {
        menuId,
      };
    }
  }

  async saveContent(menuId: number, content: SandboxContent): Promise<void> {
    await cmsApiClient.post(`/api/v1/sandbox/admin/contents/menu/${menuId}`, content);
  }
}

export const sandboxAdminService = new SandboxAdminService();
