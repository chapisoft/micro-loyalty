import { useQuery } from '@tanstack/react-query';
import { fetchAuditLogs, AuditLogQuery } from '@/service/admin/audit';

export function useAuditLogs(query: AuditLogQuery) {
  return useQuery({
    queryKey: ['audit-logs', query],
    queryFn: () => fetchAuditLogs(query),
    keepPreviousData: true,
  });
}
