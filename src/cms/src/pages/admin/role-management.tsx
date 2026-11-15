import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { useQueryClient } from '@tanstack/react-query';

import { useGetRoles, useDeleteRole, IRole } from '@/service/admin/admin';
import useToastService from '@/service/toast/toast-service';
import { QueryKey } from '@/constants';
import { StandardPageHeader } from '@/components/StandardPageHeader';
import { UniversalFilterBar } from '@/components/UniversalFilterBar';
import { StandardRowActions, RowActionItem } from '@/components/StandardRowActions';
import { StatusBadge } from '@/components/StatusBadge';
import { exportToExcel } from '@/components/exportHelper';

import RoleFormDialog from './components/role-form-dialog';

const PLATFORM_BADGE_STYLE: Record<string, { bg: string; text: string }> = {
  WEB_CMS: { bg: '#EFF6FF', text: '#1D4ED8' },
  PARTNER_PORTAL: { bg: '#FFF7ED', text: '#C2410C' },
  ALL: { bg: '#F8FAFC', text: '#475569' },
};

export const RoleManagementPage: React.FC = () => {
  const { t } = useTranslation();
  const { showToast } = useToastService();
  const queryClient = useQueryClient();

  const [pageNumber, setPageNumber] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  const [currentRole, setCurrentRole] = useState<IRole | null>(null);
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const { data: rolesData, isLoading, refetch } = useGetRoles({
    pageNumber,
    pageSize,
    keyword: searchKeyword,
  });

  const deleteRoleMutation = useDeleteRole();

  const rawRoles: IRole[] = useMemo(() => {
    if (!rolesData) return [];
    if (Array.isArray(rolesData)) return rolesData as any;
    if (rolesData.roles && Array.isArray(rolesData.roles)) return rolesData.roles;
    if (rolesData.data && Array.isArray(rolesData.data)) return rolesData.data;
    return [];
  }, [rolesData]);

  // Client-side filtration
  const filteredRoles = useMemo(() => {
    return rawRoles.filter((r) => {
      if (searchKeyword.trim()) {
        const kw = searchKeyword.toLowerCase().trim();
        const matchCode = r.code?.toLowerCase().includes(kw);
        const matchName = r.name?.toLowerCase().includes(kw);
        const matchDesc = r.description?.toLowerCase().includes(kw);
        if (!matchCode && !matchName && !matchDesc) return false;
      }

      if (selectedPlatform !== 'ALL') {
        const plat = r.platform || 'WEB_CMS';
        if (selectedPlatform !== plat && plat !== 'ALL') return false;
      }

      if (selectedStatus !== 'ALL') {
        const active = r.isActive !== 0 && r.status !== 'INACTIVE';
        if (selectedStatus === 'ACTIVE' && !active) return false;
        if (selectedStatus === 'INACTIVE' && active) return false;
      }

      return true;
    });
  }, [rawRoles, searchKeyword, selectedPlatform, selectedStatus]);

  const handleCreateRole = () => {
    setCurrentRole(null);
    setIsEditing(false);
    setShowFormDialog(true);
  };

  const handleEditRole = (role: IRole) => {
    setCurrentRole(role);
    setIsEditing(true);
    setShowFormDialog(true);
  };

  const handleCloneRole = (role: IRole) => {
    const cloned: IRole = {
      ...role,
      roleId: 0,
      code: `${role.code}_COPY`,
      name: `${role.name} (Bản sao)`,
    };
    setCurrentRole(cloned);
    setIsEditing(false);
    setShowFormDialog(true);
  };

  const handleDeleteRole = (roleId: number) => {
    if (window.confirm(t('common.confirm_delete', 'Bạn có chắc chắn muốn xóa vai trò này?'))) {
      deleteRoleMutation.mutate(roleId, {
        onSuccess: () => {
          showToast({
            severity: 'success',
            summary: t('common.success', 'Thành công'),
            detail: 'Xóa vai trò thành công',
          });
          queryClient.invalidateQueries({ queryKey: [QueryKey.GET_ALL_ROLES] });
        },
        onError: (error: any) => {
          showToast({
            severity: 'error',
            summary: t('common.error', 'Lỗi'),
            detail: error?.response?.data?.message || 'Không thể xóa vai trò',
          });
        },
      });
    }
  };

  const handleResetFilters = () => {
    setSearchKeyword('');
    setSelectedPlatform('ALL');
    setSelectedStatus('ALL');
    setPageNumber(0);
  };

  const handleExportExcel = () => {
    exportToExcel(
      [
        { header: 'STT' },
        { header: 'Mã vai trò', field: 'code' },
        { header: 'Tên vai trò', field: 'name' },
        { header: 'Mô tả', field: 'description' },
        { header: 'Nền tảng', getValue: (r: IRole) => r.platform || 'WEB_CMS' },
        { header: 'Phạm vi', getValue: (r: IRole) => r.scope || 'ALL' },
        {
          header: 'Số quyền',
          getValue: (r: IRole) => (r.permissions ? r.permissions.length : 0),
        },
        { header: 'Số tài khoản', getValue: (r: IRole) => r.userCount || 0 },
        {
          header: 'Trạng thái',
          getValue: (r: IRole) =>
            r.isActive !== 0 && r.status !== 'INACTIVE' ? 'Hoạt động' : 'Ngừng hoạt động',
        },
      ],
      filteredRoles,
      'Danh_sach_vai_tro_quan_tri'
    );
  };

  const renderRowActions = (rowData: IRole) => {
    const actions: RowActionItem[] = [
      {
        id: 'edit',
        label: t('common.edit', 'Sửa'),
        icon: 'pi pi-pencil',
        severity: 'secondary',
        onClick: () => handleEditRole(rowData),
      },
      {
        id: 'clone',
        label: 'Sao chép vai trò',
        icon: 'pi pi-copy',
        severity: 'secondary',
        onClick: () => handleCloneRole(rowData),
      },
      {
        id: 'delete',
        label: t('common.delete', 'Xóa'),
        icon: 'pi pi-trash',
        danger: true,
        disabled: rowData.code === 'ADMIN' || rowData.code === 'SYS_ADMIN',
        onClick: () => handleDeleteRole(rowData.roleId),
      },
    ];

    return <StandardRowActions actions={actions} maxInline={3} />;
  };

  const platformFilterOptions = [
    { label: 'Tất cả nền tảng', value: 'ALL' },
    { label: 'CMS Quản trị (WEB_CMS)', value: 'WEB_CMS' },
    { label: 'Cổng Đối tác (PARTNER_PORTAL)', value: 'PARTNER_PORTAL' },
  ];

  const statusOptions = [
    { label: 'Tất cả trạng thái', value: 'ALL' },
    { label: 'Hoạt động', value: 'ACTIVE' },
    { label: 'Ngừng hoạt động', value: 'INACTIVE' },
  ];

  return (
    <div className="w-full flex flex-column gap-2">
      <StandardPageHeader
        breadcrumbs={[
          { label: t('nav.admin', 'Quản trị hệ thống') },
          { label: t('nav.roles', 'Quản lý Vai trò') },
        ]}
        title={t('nav.roles', 'Quản lý Vai trò')}
        subtitle="Định nghĩa danh mục vai trò, phạm vi quyền hạn và ma trận chức năng hệ thống"
        actions={
          <Button
            label={t('common.add_new', 'Thêm mới')}
            icon="pi pi-plus"
            size="small"
            onClick={handleCreateRole}
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
        searchPlaceholder="Tìm theo mã vai trò, tên vai trò, mô tả..."
        primaryFilters={
          <>
            <Dropdown
              value={selectedPlatform}
              options={platformFilterOptions}
              onChange={(e) => {
                setSelectedPlatform(e.value);
                setPageNumber(0);
              }}
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
          value={filteredRoles}
          loading={isLoading}
          dataKey="roleId"
          paginator
          rows={pageSize}
          first={pageNumber * pageSize}
          onPage={(e: any) => {
            setPageNumber(e.page);
            setPageSize(e.rows);
          }}
          totalRecords={filteredRoles.length}
          rowsPerPageOptions={[10, 20, 50]}
          tableStyle={{ minWidth: '60rem' }}
          className="p-datatable-sm p-datatable-striped"
          emptyMessage={t('common.no_data', 'Không có dữ liệu hiển thị')}
        >
          {/* Cột 1: STT */}
          <Column
            header={t('common.stt', 'STT')}
            body={(_, options) => options.rowIndex + 1}
            style={{ width: '4rem', textAlign: 'center' }}
          />

          {/* Cột 2: Thao tác (Max 3 inline + overflow menu) */}
          <Column
            header={t('common.actions', 'Thao tác')}
            body={renderRowActions}
            style={{ width: '8.5rem', textAlign: 'left' }}
          />

          {/* Cột 3: Mã vai trò (DIP Monospace bold highlight) */}
          <Column
            field="code"
            header={t('role.code', 'Mã vai trò')}
            body={(row: IRole) => (
              <span
                style={{
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  color: '#B42318',
                  background: '#FEF2F2',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                }}
              >
                {row.code}
              </span>
            )}
            style={{ width: '15%' }}
          />

          {/* Cột 4: Tên vai trò */}
          <Column
            field="name"
            header={t('role.name', 'Tên vai trò')}
            body={(row: IRole) => (
              <div className="flex flex-column gap-0">
                <span className="font-normal text-900">{row.name}</span>
                {row.description && (
                  <span className="text-xs text-500 font-normal">{row.description}</span>
                )}
              </div>
            )}
            style={{ width: '22%' }}
          />

          {/* Cột 5: Nền tảng (Platform badge) */}
          <Column
            field="platform"
            header="Nền tảng"
            body={(row: IRole) => {
              const plat = row.platform || 'WEB_CMS';
              const cfg = PLATFORM_BADGE_STYLE[plat] || PLATFORM_BADGE_STYLE['ALL'];
              return (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    background: cfg.bg,
                    color: cfg.text,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 600,
                  }}
                >
                  {plat}
                </span>
              );
            }}
            style={{ width: '13%' }}
          />

          {/* Cột 6: Phạm vi */}
          <Column
            field="scope"
            header="Phạm vi"
            body={(row: IRole) => (
              <span className="font-normal text-900">{row.scope || 'ALL'}</span>
            )}
            style={{ width: '11%' }}
          />

          {/* Cột 7: Số quyền */}
          <Column
            header="Số quyền"
            body={(row: IRole) => {
              const count = row.permissions ? row.permissions.length : 0;
              return (
                <span className="font-normal text-900">{count} quyền</span>
              );
            }}
            style={{ width: '11%' }}
          />

          {/* Cột 8: Số tài khoản */}
          <Column
            header="Số tài khoản"
            body={(row: IRole) => (
              <span className="font-normal text-900">
                {(row.userCount ?? 0).toLocaleString('vi-VN')}
              </span>
            )}
            style={{ width: '11%' }}
          />

          {/* Cột 9: Trạng thái (Semantic Tag) */}
          <Column
            header={t('common.status', 'Trạng thái')}
            body={(row: IRole) => {
              const isActive = row.isActive !== 0 && row.status !== 'INACTIVE';
              return (
                <StatusBadge status={isActive ? 'ACTIVE' : 'INACTIVE'} />
              );
            }}
            style={{ width: '12%' }}
          />
        </DataTable>
      </div>

      <RoleFormDialog
        visible={showFormDialog}
        role={currentRole}
        isEditing={isEditing}
        onHide={() => setShowFormDialog(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: [QueryKey.GET_ALL_ROLES] });
          setShowFormDialog(false);
        }}
      />
    </div>
  );
};

export default RoleManagementPage;
