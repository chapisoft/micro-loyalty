import { cmsApiClient } from '@/service/config';

export interface AuditLog {
  id: number;
  tableName: string;
  operation: string;
  entityId: string;
  username: string;
  timestamp: string;
  beforeData: string;
  afterData: string;
}

export interface AuditLogQuery {
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
  if (params.tableName) queryParams.tableName = params.tableName;
  if (params.operation) queryParams.operation = params.operation;
  if (params.username) queryParams.username = params.username;
  if (params.fromDate) queryParams.fromDate = params.fromDate;
  if (params.toDate) queryParams.toDate = params.toDate;

  const res: any = await cmsApiClient.get('/api/audit-logs', { params: queryParams });
  return res?.data || res;
}
