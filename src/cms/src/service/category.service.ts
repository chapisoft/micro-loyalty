import { cmsApiClient } from './config';

export interface GeneralCategory {
  tenantId?: string;
  categoryType: string;
  code: string;
  name: string;
  parentCode?: string | null;
  displayOrder?: number;
  status?: number; // 1: Active, 0: Inactive
  description?: string;
  metadata?: string;
}

class CategoryService {
  private clientCache = new Map<string, GeneralCategory[]>();

  async getCategoryGroups(): Promise<GeneralCategory[]> {
    return this.getCategoriesByType('CATEGORY_GROUP');
  }

  async getCategoriesByType(categoryType: string, forceRefresh = false): Promise<GeneralCategory[]> {
    if (!categoryType) return [];
    if (!forceRefresh && this.clientCache.has(categoryType)) {
      return this.clientCache.get(categoryType) || [];
    }
    try {
      const response: any = await cmsApiClient.get('/api/v1/admin/categories', {
        params: { categoryType },
      });
      const data: GeneralCategory[] = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : [];
      this.clientCache.set(categoryType, data);
      return data;
    } catch {
      return this.clientCache.get(categoryType) || [];
    }
  }

  async getAllCategories(forceRefresh = false): Promise<GeneralCategory[]> {
    const cacheKey = '__ALL__';
    if (!forceRefresh && this.clientCache.has(cacheKey)) {
      return this.clientCache.get(cacheKey) || [];
    }
    try {
      const response: any = await cmsApiClient.get('/api/v1/admin/categories/all');
      const data: GeneralCategory[] = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : [];
      this.clientCache.set(cacheKey, data);
      return data;
    } catch {
      return [];
    }
  }

  async getCategoryDetail(categoryType: string, code: string): Promise<GeneralCategory> {
    const response: any = await cmsApiClient.get(`/api/v1/admin/categories/${categoryType}/${code}`);
    return response?.data || response;
  }

  async createCategory(data: Partial<GeneralCategory>): Promise<GeneralCategory> {
    const response: any = await cmsApiClient.post('/api/v1/admin/categories', data);
    this.clearClientCache(data.categoryType);
    return response?.data || response;
  }

  async updateCategory(
    categoryType: string,
    code: string,
    data: Partial<GeneralCategory>
  ): Promise<GeneralCategory> {
    const response: any = await cmsApiClient.put(
      `/api/v1/admin/categories/${categoryType}/${code}`,
      data
    );
    this.clearClientCache(categoryType);
    return response?.data || response;
  }

  async deleteCategory(categoryType: string, code: string): Promise<void> {
    await cmsApiClient.delete(`/api/v1/admin/categories/${categoryType}/${code}`);
    this.clearClientCache(categoryType);
  }

  async evictBackendCache(): Promise<void> {
    await cmsApiClient.post('/api/v1/admin/categories/cache/evict', {});
    this.clientCache.clear();
  }

  clearClientCache(categoryType?: string) {
    if (categoryType) {
      this.clientCache.delete(categoryType);
    } else {
      this.clientCache.clear();
    }
    this.clientCache.delete('__ALL__');
    this.clientCache.delete('CATEGORY_GROUP');
  }
}

export const categoryService = new CategoryService();
