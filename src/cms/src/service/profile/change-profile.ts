import { MutationKey, QueryKey } from '@/constants';
import { IDefaultResponse } from '@/models';
import { cmsApiClient as apiAuthClient } from '@/service/config';
import { useMutation, UseMutationResult, useQuery, UseQueryOptions } from '@tanstack/react-query';
import { type AxiosError } from 'axios';

export interface IChangeProfileParams {
  userId?: number;
  fullName: string;
  email: string;
  phone: string;
}

export interface IChangeProfileResponse extends IDefaultResponse {
  message: string;
}

// export interface IGetProfileResponse extends IDefaultResponse {
// }

export interface IUserInfo {
  id: number;
  fullName: string;
  username: string;
  email: string;
  phoneNumber: string;
  isVerified: number;
  createdAt: string;
  updatedAt: string | null;
  roles: string;
  [key: string]: any;
}

const changeProfile = (params: IChangeProfileParams): Promise<IChangeProfileResponse> => {
  const userId = params.userId || (window as any).__USER_ID__;
  return apiAuthClient.put(`/users/${userId}`, {
    fullName: params.fullName,
    phone: params.phone,
  });
};

const getProfile = (): Promise<IUserInfo> => {
  // Get current user info from stored context
  const userStr = localStorage.getItem('user');
  if (userStr) {
    return Promise.resolve(JSON.parse(userStr));
  }
  return Promise.reject(new Error('User not found'));
};

const fetchProfile = async (): Promise<IUserInfo> => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    return JSON.parse(userStr);
  }
  throw new Error('User not found');
};

function useChangeProfile(): UseMutationResult<IChangeProfileResponse, AxiosError, IChangeProfileParams> {
  return useMutation({
    mutationKey: [MutationKey.CHANGE_PROFILE],
    mutationFn: changeProfile,
  });
}

const useGetProfile = (options?: UseQueryOptions<IUserInfo, AxiosError>) => {
  return useQuery({
    queryKey: [QueryKey.GET_PROFILE],
    queryFn: () => getProfile(),
    ...options,
  });
};

export { useChangeProfile, useGetProfile, fetchProfile };

