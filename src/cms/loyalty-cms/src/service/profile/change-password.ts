import { MutationKey } from '@/constants';
import { IDefaultResponse } from '@/models';
import { cmsApiClient as apiAuthClient } from '@/service/config';
import { useMutation, UseMutationResult } from '@tanstack/react-query';
import { type AxiosError } from 'axios';

export interface IChangePasswordParams {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface IChangePasswordResponse extends IDefaultResponse {
  message: string;
}

const changePassword = (params: IChangePasswordParams): Promise<IChangePasswordResponse> => {
  return apiAuthClient.post('/v1/sandbox/auth/change-password', params);
};

function useChangePassword(): UseMutationResult<IChangePasswordResponse, AxiosError, IChangePasswordParams> {
  return useMutation({
    mutationKey: [MutationKey.CHANGE_PASSWORD],
    mutationFn: changePassword,
  });
}

export { useChangePassword };
