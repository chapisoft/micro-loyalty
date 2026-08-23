import { MutationKey, QueryKey } from '@/constants';
import { IBaseRequestPagingParams } from '@/models';
import { cmsApiClient } from '@/service/config';
import { useMutation, UseMutationResult, useQuery, type UseQueryResult } from '@tanstack/react-query';
import { type AxiosError } from 'axios';

// ==================== TYPES ====================

export interface IUser {
  userId: number;
  username: string;
  email: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  isActive: number;
  isLocked: number;
  failedLoginAttempts: number;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  roles: IRole[];
}

export interface IUserPayload {
  username: string;
  email: string;
  fullName: string;
  phone?: string;
  password?: string;
  roleIds?: number[];
}

export interface IRole {
  roleId: number;
  code: string;
  name: string;
  description: string;
  isActive: number;
  createdAt: string;
  updatedAt: string;
  permissions?: IPermission[];
}

export interface IRolePayload {
  code: string;
  name: string;
  description: string;
  permissionIds?: number[];
}

export interface IPermission {
  permissionId: number;
  code: string;
  name: string;
  description: string;
  module: string;
  action: string;
  isActive: number;
  createdAt: string;
  updatedAt: string;
}

export interface IResponse<T> {
  status: number;
  message: string;
  data?: T;
  totalPages?: number;
  pageSize?: number;
  currentPage?: number;
  users?: T[];
  roles?: T[];
}

// ==================== USER MANAGEMENT ====================

const getUsers = (params: IBaseRequestPagingParams): Promise<IResponse<IUser>> =>
  cmsApiClient.get(`/users`, { params });

function useGetUsers(params: IBaseRequestPagingParams): UseQueryResult<IResponse<IUser>, AxiosError> {
  return useQuery({
    queryKey: [QueryKey.GET_ALL_USERS, params],
    queryFn: () => getUsers(params),
  });
}

const getUserById = (id: number): Promise<IResponse<IUser>> =>
  cmsApiClient.get(`/users/${id}`);

function useGetUserById(id: number): UseQueryResult<IResponse<IUser>, AxiosError> {
  return useQuery({
    queryKey: [QueryKey.GET_USER_DETAIL, id],
    queryFn: () => getUserById(id),
    enabled: !!id,
  });
}

const createUser = (data: IUserPayload): Promise<IResponse<IUser>> =>
  cmsApiClient.post(`/users`, data);

function useCreateUser(): UseMutationResult<IResponse<IUser>, AxiosError, IUserPayload> {
  return useMutation({
    mutationKey: [MutationKey.CREATE_USER],
    mutationFn: createUser,
  });
}

const updateUser = ({
  id,
  data,
}: {
  id: number;
  data: IUserPayload;
}): Promise<IResponse<IUser>> => cmsApiClient.put(`/users/${id}`, data);

function useUpdateUser(): UseMutationResult<
  IResponse<IUser>,
  AxiosError,
  { id: number; data: IUserPayload }
> {
  return useMutation({
    mutationKey: [MutationKey.UPDATE_USER],
    mutationFn: updateUser,
  });
}

const deleteUser = (id: number): Promise<IResponse<any>> =>
  cmsApiClient.delete(`/users/${id}`);

function useDeleteUser(): UseMutationResult<IResponse<any>, AxiosError, number> {
  return useMutation({
    mutationKey: [MutationKey.DELETE_USER],
    mutationFn: deleteUser,
  });
}

const lockUser = (id: number): Promise<IResponse<any>> =>
  cmsApiClient.post(`/users/${id}/lock`);

function useLockUser(): UseMutationResult<IResponse<any>, AxiosError, number> {
  return useMutation({
    mutationKey: [MutationKey.LOCK_USER],
    mutationFn: lockUser,
  });
}

const unlockUser = (id: number): Promise<IResponse<any>> =>
  cmsApiClient.post(`/users/${id}/unlock`);

function useUnlockUser(): UseMutationResult<IResponse<any>, AxiosError, number> {
  return useMutation({
    mutationKey: [MutationKey.UNLOCK_USER],
    mutationFn: unlockUser,
  });
}

// ==================== ROLE MANAGEMENT ====================

const getRoles = (params?: IBaseRequestPagingParams): Promise<IResponse<IRole>> =>
  cmsApiClient.get(`/roles`, { params });

function useGetRoles(params?: IBaseRequestPagingParams): UseQueryResult<IResponse<IRole>, AxiosError> {
  return useQuery({
    queryKey: [QueryKey.GET_ALL_ROLES, params],
    queryFn: () => getRoles(params),
  });
}

const getRoleById = (id: number): Promise<IResponse<IRole>> =>
  cmsApiClient.get(`/roles/${id}`);

function useGetRoleById(id: number): UseQueryResult<IResponse<IRole>, AxiosError> {
  return useQuery({
    queryKey: [QueryKey.GET_ROLE_DETAIL, id],
    queryFn: () => getRoleById(id),
    enabled: !!id,
  });
}

const createRole = (data: IRolePayload): Promise<IResponse<IRole>> =>
  cmsApiClient.post(`/roles`, data);

function useCreateRole(): UseMutationResult<IResponse<IRole>, AxiosError, IRolePayload> {
  return useMutation({
    mutationKey: [MutationKey.CREATE_ROLE],
    mutationFn: createRole,
  });
}

const updateRole = ({
  id,
  data,
}: {
  id: number;
  data: IRolePayload;
}): Promise<IResponse<IRole>> => cmsApiClient.put(`/roles/${id}`, data);

function useUpdateRole(): UseMutationResult<
  IResponse<IRole>,
  AxiosError,
  { id: number; data: IRolePayload }
> {
  return useMutation({
    mutationKey: [MutationKey.UPDATE_ROLE],
    mutationFn: updateRole,
  });
}

const deleteRole = (id: number): Promise<IResponse<any>> =>
  cmsApiClient.delete(`/roles/${id}`);

function useDeleteRole(): UseMutationResult<IResponse<any>, AxiosError, number> {
  return useMutation({
    mutationKey: [MutationKey.DELETE_ROLE],
    mutationFn: deleteRole,
  });
}

const approveRole = (id: number): Promise<IResponse<IRole>> =>
  cmsApiClient.post(`/roles/${id}/approve`, {});

function useApproveRole(): UseMutationResult<IResponse<IRole>, AxiosError, number> {
  return useMutation({
    mutationKey: ['APPROVE_ROLE'],
    mutationFn: approveRole,
  });
}

const rejectRole = (id: number, reason?: string): Promise<IResponse<IRole>> =>
  cmsApiClient.post(`/roles/${id}/reject`, { reason: reason || '' });

function useRejectRole(): UseMutationResult<IResponse<IRole>, AxiosError, { id: number; reason?: string }> {
  return useMutation({
    mutationKey: ['REJECT_ROLE'],
    mutationFn: ({ id, reason }) => rejectRole(id, reason),
  });
}

// ==================== PERMISSIONS ====================

const getPermissions = (): Promise<IResponse<IPermission>> =>
  cmsApiClient.get(`/roles/permissions`);

function useGetPermissions(): UseQueryResult<IResponse<IPermission>, AxiosError> {
  return useQuery({
    queryKey: ['GET_ALL_PERMISSIONS'],
    queryFn: () => getPermissions(),
  });
}

// ==================== EXPORTS ====================

export {
  // User hooks
  useGetUsers,
  useGetUserById,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useLockUser,
  useUnlockUser,
  // Role hooks
  useGetRoles,
  useGetRoleById,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
  useApproveRole,
  useRejectRole,
  // Permission hooks
  useGetPermissions,
};
