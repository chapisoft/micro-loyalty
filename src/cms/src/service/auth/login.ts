import { MutationKey } from '@/constants';
import { IDefaultResponse } from '@/models';
import { apiAuthClient } from '@/service/config';
import { useMutation, UseMutationResult } from '@tanstack/react-query';
import { type AxiosError } from 'axios';

export interface ILoginParams {
  username: string;
  password: string;
  refreshToken?: string;
}

export interface IForgotPasswordParams {
  email: string;
}

export interface ILoginOtpParams {
  otp: number;
  email: string;
}

export interface IChangePasswordParams {
  userId: number;
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface IRegisterParams {
  fullName: string;
  userName: string;
  email: string;
  phoneNumber: string;
  password: string;
}

export interface IResetPasswordParams {
  newPassword: string;
  confirmPassword: string;
  token?: string;
}

export interface ILoginResponse extends IDefaultResponse {
  userId: string;
  otp: string;
  accessToken?: string;
  refreshToken?: string;
  fullName?: string;
  username?: string;
  email?: string;
  avatarUrl?: string;
  roles?: string[];
  permissions?: string[];
  expiresIn?: number;
}

export interface IRegisterResponse extends IDefaultResponse{
  message: string;
}

export interface IForgotPasswordResponse extends IDefaultResponse{
  message: string;
}

export interface ILoginOtpResponse extends IDefaultResponse{
  accessToken: string;
  refreshToken: string;
  userId: number;
}

export interface IUserInformation {
  id: string;
  email: string;
  fullName: string;
  userName: string;
  phoneNumber: string;
}

export interface IResetPasswordResponse extends IDefaultResponse{
  message: string;
}

const login = (params: ILoginParams): Promise<ILoginResponse> => {
  return apiAuthClient.post('/auth/login', params);
};

const forgotPassword = (params: IForgotPasswordParams): Promise<IForgotPasswordResponse> => {
  return apiAuthClient.post('/auth/forgot-password', params);
};

const registerAccount = (params: IRegisterParams): Promise<IRegisterResponse> => {
  return apiAuthClient.post('/auth/register', params);
};

const loginOtp = (params: ILoginOtpParams): Promise<ILoginOtpResponse> => {
  return apiAuthClient.post('/auth/verify-otp', params);
};

const resetPassword = (params: IResetPasswordParams): Promise<IResetPasswordResponse> => {
  return apiAuthClient.post('/auth/reset-password', params);
}

const resendOtp = (email: string): Promise<IForgotPasswordResponse> => {
  return apiAuthClient.post('/auth/resend-otp', { email });
}

function useLogin(): UseMutationResult<ILoginResponse, AxiosError, ILoginParams> {
  return useMutation({
    mutationKey: [MutationKey.LOG_IN],
    mutationFn: login,
  });
}

function useForgotPassword(): UseMutationResult<IForgotPasswordResponse, AxiosError, IForgotPasswordParams> {
  return useMutation({
    mutationKey: [MutationKey.FORGOT_PASSWORD],
    mutationFn: forgotPassword,
  });
}

function useRegisterAccount(): UseMutationResult<IRegisterResponse, AxiosError, IRegisterParams> {
  return useMutation({
    mutationKey: [MutationKey.REGISTER_ACCOUNT],
    mutationFn: registerAccount,
  });
}

function useLoginOtp(): UseMutationResult<ILoginOtpResponse, AxiosError, ILoginOtpParams> {
  return useMutation({
    mutationKey: [MutationKey.LOG_IN_OTP],
    mutationFn: loginOtp,
  });
}

function useResetPassword(): UseMutationResult<IResetPasswordResponse, AxiosError, IResetPasswordParams> {
  return useMutation({
    mutationKey: [MutationKey.RESET_PASSWORD],
    mutationFn: resetPassword,
  });
}

function useResendOtp(): UseMutationResult<IForgotPasswordResponse, AxiosError, string> {
  return useMutation({
    mutationKey: [MutationKey.RESEND_OTP],
    mutationFn: resendOtp,
  });
}

export { useForgotPassword, useLogin, useLoginOtp, useRegisterAccount, useResetPassword, useResendOtp };
