import React, { useState } from 'react';
import { useGetUsers, useDeleteUser, useLockUser, useUnlockUser, IUser } from '@/service/admin/admin';
import { IBaseRequestPagingParams } from '@/models';
import useToastService from '@/service/toast/toast-service';
import { useTranslation } from 'react-i18next';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { useQueryClient } from '@tanstack/react-query';
import { QueryKey } from '@/constants';
import UserFormDialog from './components/user-form-dialog';
import './user-management.scss';

const UserManagementPage: React.FC = () => {
  const { t } = useTranslation();
  const { showToast } = useToastService();
  const queryClient = useQueryClient();

  const [params, setParams] = useState<IBaseRequestPagingParams>({
    pageNumber: 0,
    pageSize: 10,
    keyword: '',
  });

  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<IUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const { data: usersData, isLoading } = useGetUsers(params);
  const deleteUserMutation = useDeleteUser();
  const lockUserMutation = useLockUser();
  const unlockUserMutation = useUnlockUser();

  const handleSearch = (value: string) => {
    setSearchKeyword(value);
    setParams({ ...params, keyword: value, pageNumber: 0 });
  };

  const handlePageChange = (e: any) => {
    setParams({ ...params, pageNumber: e.page, pageSize: e.rows });
  };

  const handleCreateUser = () => {
    setSelectedUser(null);
    setIsEditing(false);
    setShowFormDialog(true);
  };

  const handleEditUser = (user: IUser) => {
    setSelectedUser(user);
    setIsEditing(true);
    setShowFormDialog(true);
  };

  const handleDeleteUser = (userId: number) => {
    if (window.confirm(t('common.confirm_delete', { defaultValue: 'Bạn có chắc chắn muốn xóa bản ghi này?' }))) {
      deleteUserMutation.mutate(userId, {
        onSuccess: () => {
          showToast({
            severity: 'success',
            summary: t('common.success', { defaultValue: 'Thành công' }),
            detail: t('user.delete_success', { defaultValue: 'Xóa người dùng thành công' }),
          });
          queryClient.invalidateQueries({ queryKey: [QueryKey.GET_ALL_USERS] });
        },
        onError: (error: any) => {
          showToast({
            severity: 'error',
            summary: t('common.error', { defaultValue: 'Lỗi' }),
            detail: error?.response?.data?.message || t('user.delete_failed', { defaultValue: 'Xóa người dùng thất bại' }),
          });
        },
      });
    }
  };

  const handleLockUser = (userId: number) => {
    lockUserMutation.mutate(userId, {
      onSuccess: () => {
        showToast({
          severity: 'success',
          summary: t('common.success', { defaultValue: 'Thành công' }),
          detail: t('user.lock_success', { defaultValue: 'Khóa tài khoản thành công' }),
        });
        queryClient.invalidateQueries({ queryKey: [QueryKey.GET_ALL_USERS] });
      },
      onError: (error: any) => {
        showToast({
          severity: 'error',
          summary: t('common.error', { defaultValue: 'Lỗi' }),
          detail: error?.response?.data?.message || t('user.lock_failed', { defaultValue: 'Khóa tài khoản thất bại' }),
        });
      },
    });
  };

  const handleUnlockUser = (userId: number) => {
    unlockUserMutation.mutate(userId, {
      onSuccess: () => {
        showToast({
          severity: 'success',
          summary: t('common.success', { defaultValue: 'Thành công' }),
          detail: t('user.unlock_success', { defaultValue: 'Mở khóa tài khoản thành công' }),
        });
        queryClient.invalidateQueries({ queryKey: [QueryKey.GET_ALL_USERS] });
      },
      onError: (error: any) => {
        showToast({
          severity: 'error',
          summary: t('common.error', { defaultValue: 'Lỗi' }),
          detail: error?.response?.data?.message || t('user.unlock_failed', { defaultValue: 'Mở khóa tài khoản thất bại' }),
        });
      },
    });
  };

  const actionTemplate = (rowData: IUser) => (
    <div className="action-buttons flex gap-2">
      <Button
        icon="pi pi-pencil"
        className="p-button-rounded p-button-warning"
        onClick={() => handleEditUser(rowData)}
        tooltip={t('common.edit', { defaultValue: 'Sửa' })}
      />
      {rowData.isLocked !== 0 ? (
        <Button
          icon="pi pi-lock-open"
          className="p-button-rounded p-button-info"
          onClick={() => handleUnlockUser(rowData.userId)}
          tooltip={t('user.unlock', { defaultValue: 'Mở khóa' })}
        />
      ) : (
        <Button
          icon="pi pi-lock"
          className="p-button-rounded p-button-secondary"
          onClick={() => handleLockUser(rowData.userId)}
          tooltip={t('user.lock', { defaultValue: 'Khóa' })}
        />
      )}
      <Button
        icon="pi pi-trash"
        className="p-button-rounded p-button-danger"
        onClick={() => handleDeleteUser(rowData.userId)}
        tooltip={t('common.delete', { defaultValue: 'Xóa' })}
      />
    </div>
  );

  const statusTemplate = (rowData: IUser) => {
    if (rowData.isLocked !== 0) {
      return (
        <span className="status-badge inactive" style={{ backgroundColor: '#e74c3c' }}>
          {t('user.locked', { defaultValue: 'Đã khóa' })}
        </span>
      );
    }
    return (
      <span className={`status-badge ${rowData.isActive !== 0 ? 'active' : 'inactive'}`}>
        {rowData.isActive !== 0 ? t('common.active', { defaultValue: 'Đang hoạt động' }) : t('common.inactive', { defaultValue: 'Ngừng hoạt động' })}
      </span>
    );
  };

  const rolesTemplate = (rowData: IUser) => (
    <span>{rowData.roles?.map((role) => role.name).join(', ')}</span>
  );

  return (
    <div className="user-management-page">
      <div className="page-header">
        <h1>{t('user.management', { defaultValue: 'Quản lý Người dùng & Phân quyền' })}</h1>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <InputText
            placeholder={t('common.search', { defaultValue: 'Tìm kiếm...' })}
            value={searchKeyword}
            onChange={(e) => handleSearch(e.target.value)}
            className="search-input"
          />
        </div>
        <Button
          label={t('user.create_new', { defaultValue: 'Thêm Người dùng' })}
          icon="pi pi-plus"
          onClick={handleCreateUser}
          className="p-button-success"
        />
      </div>

      <div className="data-table-wrapper">
        <DataTable
          value={(usersData?.users ?? (usersData?.data ? (Array.isArray(usersData.data) ? usersData.data : [usersData.data]) : (Array.isArray(usersData) ? (usersData as any) : []))) as IUser[]}
          selection={selectedUsers}
          onSelectionChange={(e) => setSelectedUsers(e.value as IUser[])}
          loading={isLoading}
          dataKey="userId"
          paginator
          rows={params.pageSize}
          first={params.pageNumber * params.pageSize}
          onPage={handlePageChange}
          totalRecords={usersData?.totalPages ? usersData.totalPages * params.pageSize : ((usersData as any)?.length || 0)}
          rowsPerPageOptions={[10, 20, 50]}
          tableStyle={{ minWidth: '50rem' }}
          className="p-datatable-striped"
        >
          {/* Cột 1: Checkbox */}
          <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />

          {/* Cột 2: STT */}
          <Column
            header={t('common.stt', { defaultValue: 'STT' })}
            body={(_, options) => options.rowIndex + 1}
            style={{ width: '4rem', textAlign: 'center' }}
          />

          {/* Cột 3: Thao tác / Hành động */}
          <Column header={t('common.actions', { defaultValue: 'Thao tác' })} body={actionTemplate} style={{ width: '12rem' }} />

          {/* Cột 4 trở đi: Dữ liệu nghiệp vụ */}
          <Column field="username" header={t('user.username', { defaultValue: 'Tên đăng nhập' })} style={{ width: '15%' }} />
          <Column field="fullName" header={t('user.full_name', { defaultValue: 'Họ và tên' })} style={{ width: '18%' }} />
          <Column field="email" header={t('user.email', { defaultValue: 'Email' })} style={{ width: '20%' }} />
          <Column field="phone" header={t('user.phone', { defaultValue: 'Số điện thoại' })} style={{ width: '12%' }} />
          <Column header={t('user.roles', { defaultValue: 'Vai trò' })} body={rolesTemplate} style={{ width: '15%' }} />
          <Column header={t('common.status', { defaultValue: 'Trạng thái' })} body={statusTemplate} style={{ width: '10%' }} />
        </DataTable>
      </div>

      <UserFormDialog
        visible={showFormDialog}
        user={selectedUser}
        isEditing={isEditing}
        onHide={() => setShowFormDialog(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: [QueryKey.GET_ALL_USERS] });
          setShowFormDialog(false);
        }}
      />
    </div>
  );
};

export { UserManagementPage };
export default UserManagementPage;
