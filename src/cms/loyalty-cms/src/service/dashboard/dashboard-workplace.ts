import { QueryKey } from '@/constants';
import { IDefaultResponse } from '@/models';
import { apiClient } from '@/service/config';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { type AxiosError } from 'axios';

interface IDashboardWorkplaceParams {
  createAtStart?: string;
  createAtEnd?: string;
  agencyId?: string;
  fieldId?: string;
}

export interface IDashboardWorkplaceResponse extends IDefaultResponse {}

const getDashboardWorkplace = (params: IDashboardWorkplaceParams): Promise<any> => {
  const queryParams: Record<string, string> = {};

  if (params.createAtStart) {
    queryParams.createAtStart = params.createAtStart;
  }
  if (params.createAtEnd) {
    queryParams.createAtEnd = params.createAtEnd;
  }
  if (params.agencyId) {
    queryParams.agencyId = params.agencyId;
  }

  if (params.fieldId) {
    queryParams.fieldId = params.fieldId;
  }

  return apiClient.get('/rs/alarms-dashboard', { params: queryParams });
};

function useGetDashboardWorkplace(
  params: IDashboardWorkplaceParams
): UseQueryResult<IDashboardWorkplaceResponse, AxiosError> {
  return useQuery({
    queryKey: [QueryKey.GET_DASHBOARD_ANALYSIS, params],
    queryFn: () => getDashboardWorkplace(params),
  });
}

export { useGetDashboardWorkplace };
