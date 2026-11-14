import { cmsApiClient } from './config';

export type ParamValueType =
  | 'STRING'
  | 'BOOLEAN'
  | 'INTEGER'
  | 'DECIMAL'
  | 'ENUM'
  | 'TIME_WINDOW'
  | 'JSON';

export interface SystemParameter {
  id?: number;
  paramKey: string;
  paramName?: string;
  paramValue: string;
  defaultValue?: string;
  valueType?: ParamValueType | string;
  groupCode?: string;
  allowedValues?: string | null;
  description?: string;
  status?: number;
  updatedBy?: string;
  fromDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SystemParamSpecItem {
  code: string;
  paramName?: string;
  groupCode: string;
  valueType: ParamValueType | string;
  defaultValue: string;
  allowedValues?: string | null;
  description?: string;
}

export interface SysCodeTypeConfig {
  id?: number;
  codeType: string;
  description?: string;
  formatTemplate: string;
  staticPrefix: string;
  dateFormat: string;
  seqPadding: number;
  seqName: string;
  batchAllocationSize?: number;
  immutableAfterCreate?: boolean;
  status: number;
  samplePreview?: string;
  updatedAt?: string;
}

export interface CacheRefreshResult {
  tenantId: string;
  parametersCached: number;
  codeTypesCached: number;
}

export interface CodePreviewResult {
  codeType: string;
  preview: string;
}

class SystemParameterService {
  async getAllParameters(groupCode?: string, keyword?: string): Promise<SystemParameter[]> {
    try {
      const params: Record<string, string> = {};
      if (groupCode && groupCode !== 'ALL') params.groupCode = groupCode;
      if (keyword && keyword.trim()) params.keyword = keyword.trim();
      const response: any = await cmsApiClient.get('/api/v1/system-parameters', { params });
      if (Array.isArray(response)) return response;
      if (response && Array.isArray(response.data)) return response.data;
      return [];
    } catch {
      return [];
    }
  }

  async getParameter(paramKey: string): Promise<SystemParameter> {
    const response: any = await cmsApiClient.get(`/api/v1/system-parameters/${paramKey}`);
    return response?.data || response;
  }

  async getParameterSpecs(): Promise<SystemParamSpecItem[]> {
    try {
      const response: any = await cmsApiClient.get('/api/v1/system-parameters/specs');
      if (Array.isArray(response)) return response;
      if (response && Array.isArray(response.data)) return response.data;
      return [];
    } catch {
      return [];
    }
  }

  async createParameter(data: Partial<SystemParameter>): Promise<SystemParameter> {
    const response: any = await cmsApiClient.post('/api/v1/system-parameters', data);
    return response?.data || response;
  }

  async updateParameter(paramKey: string, data: Partial<SystemParameter>): Promise<SystemParameter> {
    const response: any = await cmsApiClient.put(`/api/v1/system-parameters/${paramKey}`, data);
    return response?.data || response;
  }

  async deleteParameter(paramKey: string): Promise<void> {
    await cmsApiClient.delete(`/api/v1/system-parameters/${paramKey}`);
  }

  async refreshCache(): Promise<CacheRefreshResult> {
    const response: any = await cmsApiClient.post('/api/v1/system-parameters/refresh-cache');
    return response?.data || response;
  }

  async getCodeTypes(): Promise<SysCodeTypeConfig[]> {
    try {
      const response: any = await cmsApiClient.get('/api/v1/system-parameters/code-types');
      if (Array.isArray(response)) return response;
      if (response && Array.isArray(response.data)) return response.data;
      return [];
    } catch {
      return [];
    }
  }

  async updateCodeType(codeType: string, data: Partial<SysCodeTypeConfig>): Promise<SysCodeTypeConfig> {
    const response: any = await cmsApiClient.put(`/api/v1/system-parameters/code-types/${codeType}`, data);
    return response?.data || response;
  }

  async previewCodeType(
    codeType: string,
    config: Partial<SysCodeTypeConfig>,
    sampleParams?: Record<string, string>
  ): Promise<CodePreviewResult> {
    const response: any = await cmsApiClient.post(`/api/v1/system-parameters/code-types/${codeType}/preview`, {
      config,
      sampleParams: sampleParams || {}
    });
    return response?.data || response;
  }
}

export const systemParameterService = new SystemParameterService();
