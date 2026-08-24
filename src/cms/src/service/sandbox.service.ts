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
      return [
        {
          id: 1,
          username: 'developer',
          fullName: 'Developer Đối Tác Demo',
          email: 'developer@partner.vn',
          phone: '0988123456',
          status: 'APPROVED',
          groupNames: ['Smart OTP Standard Partners'],
        },
        {
          id: 2,
          username: 'bank_vietcombank',
          fullName: 'Vietcombank Fintech Team',
          email: 'integration@vcb.com.vn',
          phone: '0912345678',
          status: 'PENDING',
          groupNames: ['Smart OTP Standard Partners'],
        },
      ];
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
      return [
        {
          id: 1,
          name: 'Smart OTP Standard Partners',
          description: 'Nhóm đối tác tiêu chuẩn tích hợp Smart OTP',
          menuIds: [1, 2, 3, 4, 5, 6],
        },
        {
          id: 2,
          name: 'Banking & Core Fintech',
          description: 'Nhóm đối tác ngân hàng bảo mật cao cấp',
          menuIds: [1, 2, 3, 4],
        },
      ];
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
      return [
        { id: 1, name: 'Tổng quan & Cấu hình Test', path: '/dashboard', menuOrder: 1, icon: 'LuCompass' },
        { id: 2, name: '1. Kích hoạt Thiết bị (Provisioning)', path: '/docs/1', menuOrder: 2, icon: 'LuSmartphone' },
        { id: 3, name: '2. Khởi tạo Thử thách (Challenge Init)', path: '/docs/2', menuOrder: 3, icon: 'LuShieldAlert' },
        { id: 4, name: '3. Kiểm thực Smart OTP (Verify)', path: '/docs/3', menuOrder: 4, icon: 'LuCheckCircle2' },
        { id: 5, name: '4. Tích hợp Mobile SDK (iOS/Android)', path: '/docs/4', menuOrder: 5, icon: 'LuCode2' },
        { id: 6, name: '5. Trình Giả Lập Trực Quan (Simulator)', path: '/simulator', menuOrder: 6, icon: 'LuPlaySquare' },
      ];
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
    } catch (e) {
      return {
        menuId,
        title: 'Hướng Dẫn Tích Hợp Smart OTP',
        bodyMarkdown: '# Hướng Dẫn Tích Hợp Smart OTP\n\nNội dung chi tiết cho menu này...',
        codeDemo: 'curl -X POST "https://api.miotp.io.vn/api/v1/otp/verify"',
        testAccountInfo: 'Base URL: https://api.miotp.io.vn/api/v1\nPartner Code: PARTNER_DEMO_01',
      };
    }
  }

  async saveContent(menuId: number, content: SandboxContent): Promise<void> {
    await cmsApiClient.post(`/api/v1/sandbox/admin/contents/menu/${menuId}`, content);
  }
}

export const sandboxAdminService = new SandboxAdminService();
