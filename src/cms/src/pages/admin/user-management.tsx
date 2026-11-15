import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { useQueryClient } from '@tanstack/react-query';

import {
  useGetUsers,
  useDeleteUser,
  useLockUser,
  useUnlockUser,
  useGetRoles,
  IUser,
  IRole,
} from '@/service/admin/admin';
import useToastService from '@/service/toast/toast-service';
import { QueryKey } from '@/constants';
import { StandardPageHeader } from '@/components/StandardPageHeader';
import { UniversalFilterBar } from '@/components/UniversalFilterBar';
import { StandardRowActions, RowActionItem } from '@/components/StandardRowActions';
import { StatusBadge } from '@/components/StatusBadge';
import { exportToExcel } from '@/components/exportHelper';

import UserFormDialog from './components/user-form-dialog';
import { UserRoleCell } from './components/UserRoleCell';
import { RoleAssignmentDialog } from './components/RoleAssignmentDialog';
import { ResetPasswordDialog } from './components/ResetPasswordDialog';

export const UserManagementPage: React.FC = () => {
  const { t } = useTranslation();
  const { showToast } = useToastService();
  const queryClient = useQueryClient();

  const [pageNumber, setPageNumber] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  const [selectedUsers, setSelectedUsers] = useState<IUser[]>([]);
  const [currentUser, setCurrentUser] = useState<IUser | null>(null);
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);

  const { data: usersData, isLoading, refetch } = useGetUsers({
    pageNumber,
    pageSize,
    keyword: searchKeyword,
  });

  const { data: rolesData } = useGetRoles();
  const allRoles = useMemo(() => {
    return ((rolesData?.data || rolesData?.roles || []) as IRole[]) || [];
  }, [rolesData]);

  const deleteUserMutation = useDeleteUser();
  const lockUserMutation = useLockUser();
  const unlockUserMutation = useUnlockUser();

  const rawUsers: IUser[] = useMemo(() => {
    if (!usersData) return [];
    if (Array.isArray(usersData)) return usersData as any;
    if (usersData.users && Array.isArray(usersData.users)) return usersData.users;
    if (usersData.data && Array.isArray(usersData.data)) return usersData.data;
    return [];
  }, [usersData]);

  // Client-side filtration for instant feedback
  const filteredUsers = useMemo(() => {
    return rawUsers.filter((u) => {
      if (searchKeyword.trim()) {
        const kw = searchKeyword.toLowerCase().trim();
        const matchUser = u.username?.toLowerCase().includes(kw);
        const matchName = u.fullName?.toLowerCase().includes(kw);
        const matchEmail = u.email?.toLowerCase().includes(kw);
        const matchPhone = u.phone?.toLowerCase().includes(kw);
        if (!matchUser && !matchName && !matchEmail && !matchPhone) return false;
      }

      if (selectedRoleId !== null) {
        const hasRole = u.roles?.some((r) => r.roleId === selectedRoleId);
        if (!hasRole) return false;
      }

      if (selectedStatus !== 'ALL') {
        const isLocked = u.isLocked !== 0 || u.status === 'LOCKED';
        if (selectedStatus === 'LOCKED' && !isLocked) return false;
        if (selectedStatus === 'ACTIVE' && (isLocked || u.isActive === 0)) return false;
        if (selectedStatus === 'INACTIVE' && (u.isActive !== 0 || isLocked)) return false;
      }

      return true;
    });
  }, [rawUsers, searchKeyword, selectedRoleId, selectedStatus]);

  const handleCreateUser = () => {
    setCurrentUser(null);
    setIsEditing(false);
    setShowFormDialog(true);
  };

  const handleEditUser = (user: IUser) => {
    setCurrentUser(user);
    setIsEditing(true);
    setShowFormDialog(true);
  };

  const handleOpenRoleAssignment = (user: IUser) => {
    setCurrentUser(user);
    setShowRoleDialog(true);
  };

  const handleOpenResetPassword = (user: IUser) => {
    setCurrentUser(user);
    setShowResetPasswordDialog(true);
  };

  const handleDeleteUser = (userId: number) => {
    if (window.confirm(t('common.confirm_delete', 'Bạn có chắc chắn muốn xóa người dùng này?'))) {
      deleteUserMutation.mutate(userId, {
        onSuccess: () => {
          showToast({
            severity: 'success',
            summary: t('common.success', 'Thành công'),
            detail: 'Xóa tài khoản thành công',
          });
          queryClient.invalidateQueries({ queryKey: [QueryKey.GET_ALL_USERS] });
        },
        onError: (error: any) => {
          showToast({
            severity: 'error',
            summary: t('common.error', 'Lỗi'),
            detail: error?.response?.data?.message || 'Không thể xóa tài khoản',
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
          summary: t('common.success', 'Thành công'),
          detail: 'Khóa tài khoản thành công',
        });
        queryClient.invalidateQueries({ queryKey: [QueryKey.GET_ALL_USERS] });
      },
      onError: (error: any) => {
        showToast({
          severity: 'error',
          summary: t('common.error', 'Lỗi'),
          detail: error?.response?.data?.message || 'Không thể khóa tài khoản',
        });
      },
    });
  };

  const handleUnlockUser = (userId: number) => {
    unlockUserMutation.mutate(userId, {
      onSuccess: () => {
        showToast({
          severity: 'success',
          summary: t('common.success', 'Thành công'),
          detail: 'Mở khóa tài khoản thành công',
        });
        queryClient.invalidateQueries({ queryKey: [QueryKey.GET_ALL_USERS] });
      },
      onError: (error: any) => {
        showToast({
          severity: 'error',
          summary: t('common.error', 'Lỗi'),
          detail: error?.response?.data?.message || 'Không thể mở khóa tài khoản',
        });
      },
    });
  };

  const handleResetFilters = () => {
    setSearchKeyword('');
    setSelectedRoleId(null);
    setSelectedStatus('ALL');
    setPageNumber(0);
  };

  const handleExportExcel = () => {
    exportToExcel(
      [
        { header: 'STT' },
        { header: 'Tên đăng nhập', field: 'username' },
        { header: 'Họ và tên', field: 'fullName' },
        { header: 'Email', field: 'email' },
        { header: 'Số điện thoại', field: 'phone' },
        {
          header: 'Vai trò',
          getValue: (r: IUser) => r.roles?.map((x) => x.name).join(', ') || '',
        },
        {
          header: 'Trạng thái',
          getValue: (r: IUser) =>
            r.isLocked !== 0 ? 'Đã khóa' : r.isActive !== 0 ? 'Hoạt động' : 'Ngừng hoạt động',
        },
        { header: 'Lần đăng nhập cuối', field: 'lastLoginAt' },
      ],
      filteredUsers,
      'Danh_sach_tai_khoan_quan_tri'
    );
  };

  // Row action menu items
  const renderRowActions = (rowData: IUser) => {
    const isLocked = rowData.isLocked !== 0 || rowData.status === 'LOCKED';
    const actions: RowActionItem[] = [
      {
        id: 'edit',
        label: t('common.edit', 'Sửa'),
        icon: 'pi pi-pencil',
        severity: 'secondary',
        onClick: () => handleEditUser(rowData),
      },
      {
        id: 'roles',
        label: 'Gán vai trò',
        icon: 'pi pi-shield',
        severity: 'secondary',
        onClick: () => handleOpenRoleAssignment(rowData),
      },
      {
        id: 'reset_pwd',
        label: 'Đặt lại mật khẩu',
        icon: 'pi pi-key',
        severity: 'secondary',
        onClick: () => handleOpenResetPassword(rowData),
      },
      {
        id: 'toggle_lock',
        label: isLocked ? 'Mở khóa tài khoản' : 'Khóa tài khoản',
        icon: isLocked ? 'pi pi-lock-open' : 'pi pi-lock',
        severity: isLocked ? 'info' : 'warning',
        onClick: () => (isLocked ? handleUnlockUser(rowData.userId) : handleLockUser(rowData.userId)),
      },
      {
        id: 'delete',
        label: t('common.delete', 'Xóa'),
        icon: 'pi pi-trash',
        danger: true,
        onClick: () => handleDeleteUser(rowData.userId),
      },
    ];

    return <StandardRowActions actions={actions} maxInline={3} />;
  };

  const statusTemplate = (rowData: IUser) => {
    const isLocked = rowData.isLocked !== 0 || rowData.status === 'LOCKED';
    const isActive = rowData.isActive !== 0 && !isLocked;
    const mustChange = Boolean(rowData.mustChangePassword);

    return (
      <div className="flex align-items-center gap-1 flex-wrap">
        <StatusBadge status={isLocked ? 'LOCKED' : isActive ? 'ACTIVE' : 'INACTIVE'} />
        {mustChange && (
          <span
            style={{
              fontSize: '11px',
              padding: '2px 6px',
              borderRadius: '4px',
              background: '#FEF3C7',
              color: '#D97706',
              border: '1px solid #FCD34D',
              whiteSpace: 'nowrap',
            }}
          >
            Đổi MK
          </span>
        )}
      </div>
    );
  };

  const roleFilterOptions = useMemo(() => {
    return [
      { label: 'Tất cả vai trò', value: null },
      ...allRoles.map((r) => ({ label: `${r.name} (${r.code})`, value: r.roleId })),
    ];
  }, [allRoles]);

  const statusOptions = [
    { label: 'Tất cả trạng thái', value: 'ALL' },
    { label: 'Hoạt động', value: 'ACTIVE' },
    { label: 'Đã khóa', value: 'LOCKED' },
    { label: 'Ngừng hoạt động', value: 'INACTIVE' },
  ];

  return (
    <div className="w-full flex flex-column gap-2">
      <StandardPageHeader
        breadcrumbs={[
          { label: t('nav.admin', 'Quản trị hệ thống') },
          { label: t('nav.users', 'Quản lý Tài khoản') },
        ]}
        title={t('nav.users', 'Quản lý Tài khoản')}
        subtitle="Quản lý danh sách tài khoản quản trị CMS, gán vai trò và trạng thái truy cập"
        actions={
          <Button
            label={t('common.add_new', 'Thêm mới')}
            icon="pi pi-plus"
            size="small"
            onClick={handleCreateUser}
            className="p-button-sm font-semibold"
          />
        }
      />

      <UniversalFilterBar
        searchValue={searchKeyword}
        onSearchChange={(val) => {
          setSearchKeyword(val);
          setPageNumber(0);
        }}
        searchPlaceholder="Tìm theo tên đăng nhập, họ tên, email, SĐT..."
        primaryFilters={
          <>
            <Dropdown
              value={selectedRoleId}
              options={roleFilterOptions}
              onChange={(e) => {
                setSelectedRoleId(e.value);
                setPageNumber(0);
              }}
              placeholder="Lọc theo vai trò"
              className="p-inputtext-sm"
              style={{ minWidth: '13rem', maxWidth: '16rem' }}
            />
            <Dropdown
              value={selectedStatus}
              options={statusOptions}
              onChange={(e) => {
                setSelectedStatus(e.value);
                setPageNumber(0);
              }}
              className="p-inputtext-sm"
              style={{ minWidth: '10rem', maxWidth: '12rem' }}
            />
          </>
        }
        onReset={handleResetFilters}
        onRefresh={() => refetch()}
        isLoading={isLoading}
        extraActions={
          <Button
            type="button"
            icon="pi pi-file-excel"
            label={t('common.export_excel', 'Xuất Excel')}
            outlined
            severity="secondary"
            size="small"
            onClick={handleExportExcel}
            className="p-button-sm font-medium"
          />
        }
      />

      <div className="surface-card border-round border-1 surface-border overflow-hidden w-full">
        <DataTable
          value={filteredUsers}
          selection={selectedUsers}
          onSelectionChange={(e: any) => setSelectedUsers(e.value)}
          selectionMode="checkbox"
          loading={isLoading}
          dataKey="userId"
          paginator
          rows={pageSize}
          first={pageNumber * pageSize}
          onPage={(e: any) => {
            setPageNumber(e.page);
            setPageSize(e.rows);
          }}
          totalRecords={filteredUsers.length}
          rowsPerPageOptions={[10, 20, 50]}
          tableStyle={{ minWidth: '60rem' }}
          className="p-datatable-sm p-datatable-striped"
          emptyMessage={t('common.no_data', 'Không có dữ liệu hiển thị')}
        >
          {/* Cột 1: Checkbox */}
          <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />

          {/* Cột 2: STT */}
          <Column
            header={t('common.stt', 'STT')}
            body={(_, options) => options.rowIndex + 1}
            style={{ width: '4rem', textAlign: 'center' }}
          />

          {/* Cột 3: Thao tác / Hành động (Max 3 inline + overflow menu) */}
          <Column
            header={t('common.actions', 'Thao tác')}
            body={renderRowActions}
            style={{ width: '8.5rem', textAlign: 'left' }}
          />

          {/* Cột 4: Tên đăng nhập (Bold monospace code) */}
          <Column
            field="username"
            header={t('user.username', 'Tên đăng nhập')}
            body={(row: IUser) => (
              <span className="font-mono font-bold text-900">
                {row.username}
              </span>
            )}
            style={{ width: '13%' }}
          />

          {/* Cột 5: Họ và tên */}
          <Column
            field="fullName"
            header={t('user.full_name', 'Họ và tên')}
            body={(row: IUser) => (
              <span className="font-normal text-900">{row.fullName}</span>
            )}
            style={{ width: '16%' }}
          />

          {/* Cột 6: Email */}
          <Column
            field="email"
            header={t('user.email', 'Email')}
            body={(row: IUser) => (
              <span className="font-normal text-900">{row.email}</span>
            )}
            style={{ width: '18%' }}
          />

          {/* Cột 7: Số điện thoại */}
          <Column
            field="phone"
            header={t('user.phone', 'Số điện thoại')}
            body={(row: IUser) => (
              <span className="font-normal text-900">{row.phone || '--'}</span>
            )}
            style={{ width: '11%' }}
          />

          {/* Cột 8: Vai trò (DIP UserRoleCell with popover & badges) */}
          <Column
            header={t('user.roles', 'Vai trò')}
            body={(row: IUser) => (
              <UserRoleCell user={row} onOpenRoleModal={handleOpenRoleAssignment} />
            )}
            style={{ width: '16%' }}
          />

          {/* Cột 9: Trạng thái (Semantic Tag) */}
          <Column
            header={t('common.status', 'Trạng thái')}
            body={statusTemplate}
            style={{ width: '11%' }}
          />
        </DataTable>
      </div>

      <UserFormDialog
        visible={showFormDialog}
        user={currentUser}
        isEditing={isEditing}
        onHide={() => setShowFormDialog(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: [QueryKey.GET_ALL_USERS] });
          setShowFormDialog(false);
        }}
      />

      <RoleAssignmentDialog
        visible={showRoleDialog}
        user={currentUser}
        onHide={() => setShowRoleDialog(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: [QueryKey.GET_ALL_USERS] });
        }}
      />

      <ResetPasswordDialog
        visible={showResetPasswordDialog}
        user={currentUser}
        onHide={() => setShowResetPasswordDialog(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: [QueryKey.GET_ALL_USERS] });
        }}
      />
    </div>
  );
};

export default UserManagementPage;
