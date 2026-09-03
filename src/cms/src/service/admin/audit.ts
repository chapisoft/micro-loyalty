import { cmsApiClient } from '@/service/config';

export interface AuditLog {
  id: number;
  tenantId?: string;
  module?: string;
  tableName: string;
  operation: string;
  entityId: string;
  username: string;
  actorRole?: string;
  clientIp?: string;
  userAgent?: string;
  timestamp: string;
  beforeData: string;
  afterData: string;
  description?: string;
  status?: string;
  executionTimeMs?: number;
}

export interface AuditLogQuery {
  tenantId?: string;
  tableName?: string;
  operation?: string;
  username?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  size?: number;
}

export async function fetchAuditLogs(params: AuditLogQuery) {
  const queryParams: Record<string, any> = {
    page: params.page ?? 0,
    size: params.size ?? 20,
  };
  if (params.tenantId) queryParams.tenantId = params.tenantId;
  if (params.tableName) queryParams.tableName = params.tableName;
  if (params.operation) queryParams.operation = params.operation;
  if (params.username) queryParams.username = params.username;
  if (params.fromDate) queryParams.fromDate = params.fromDate;
  if (params.toDate) queryParams.toDate = params.toDate;

  const headers: Record<string, string> = {};
  if (params.tenantId) {
    headers['X-Tenant-Id'] = params.tenantId;
  }

  const res: any = await cmsApiClient.get('/api/audit-logs', { params: queryParams, headers });
  return res;
}
