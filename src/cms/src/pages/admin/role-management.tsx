import React, { useState } from 'react';
import { useGetRoles, useDeleteRole, useApproveRole, useRejectRole, IRole } from '@/service/admin/admin';
import { IBaseRequestPagingParams } from '@/models';
import useToastService from '@/service/toast/toast-service';
import { t } from 'i18next';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { useQueryClient } from '@tanstack/react-query';
import { useUser } from 'micro-sdk';
import RoleFormDialog from './components/role-form-dialog';
import './role-management.scss';

const RoleManagementPage: React.FC = () => {
  const { showToast } = useToastService();
  const queryClient = useQueryClient();
  const { user } = useUser();
  
  const [params, setParams] = useState<IBaseRequestPagingParams>({
    pageNumber: 0,
    pageSize: 10,
    keyword: '',
  });

  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedRole, setSelectedRole] = useState<IRole | null>(null);
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const { data: rolesData, isLoading } = useGetRoles(params);
  const deleteRoleMutation = useDeleteRole();
  const approveRoleMutation = useApproveRole();
  const rejectRoleMutation = useRejectRole();

  const isAdmin = user?.roles?.includes('ADMIN');
  const userPermissions = user?.permissions || [];
  const hasPermission = (code: string) => isAdmin || userPermissions.includes(code);

  const canCreateRole = hasPermission('ROLE_CREATE');
  const canUpdateRole = hasPermission('ROLE_UPDATE') || hasPermission('ROLE_EDIT');
  const canDeleteRole = hasPermission('ROLE_DELETE');
  const canApproveRole = hasPermission('ROLE_APPROVE') || canUpdateRole;
  const canRejectRole = hasPermission('ROLE_REJECT') || canUpdateRole;

  const handleSearch = (value: string) => {
    setSearchKeyword(value);
    setParams({ ...params, keyword: value, pageNumber: 0 });
  };

  const handlePageChange = (e: any) => {
    setParams({ ...params, pageNumber: e.page, pageSize: e.rows });
  };

  const handleCreateRole = () => {
    setSelectedRole(null);
    setIsEditing(false);
    setShowFormDialog(true);
  };

  const handleEditRole = (role: IRole) => {
    setSelectedRole(role);
    setIsEditing(true);
    setShowFormDialog(true);
  };

  const handleDeleteRole = (roleId: number) => {
    if (!canDeleteRole) {
      showToast({ code: 403, detail: t('common.no_permission') });
      return;
    }

    if (window.confirm(t('common.confirm_delete'))) {
      deleteRoleMutation.mutate(roleId, {
        onSuccess: () => {
          showToast({ code: 200, detail: t('role.delete_success') });
          queryClient.invalidateQueries({ queryKey: ['GET_ALL_ROLES'] });
        },
        onError: (error: any) => {
          showToast({ code: 400, detail: error?.response?.data?.message || t('role.delete_failed') });
        },
      });
    }
  };

  const handleApproveRole = (role: IRole) => {
    if (!canApproveRole) {
      showToast({ code: 403, detail: t('common.no_permission') });
      return;
    }
    setSelectedRole(role);
    setShowApproveDialog(true);
  };

  const handleRejectRole = (role: IRole) => {
    if (!canRejectRole) {
      showToast({ code: 403, detail: t('common.no_permission') });
      return;
    }
    setSelectedRole(role);
    setShowRejectDialog(true);
  };

  const confirmApproveRole = () => {
    if (!selectedRole) return;
    approveRoleMutation.mutate(selectedRole.roleId, {
      onSuccess: () => {
        showToast({ code: 200, detail: t('role.approve_success') });
        setShowApproveDialog(false);
        queryClient.invalidateQueries({ queryKey: ['GET_ALL_ROLES'] });
      },
      onError: (error: any) => {
        showToast({ code: 400, detail: error?.response?.data?.message || t('role.approve_failed') });
      },
    });
  };

  const confirmRejectRole = () => {
    if (!selectedRole) return;
    rejectRoleMutation.mutate({ id: selectedRole.roleId }, {
      onSuccess: () => {
        showToast({ code: 200, detail: t('role.reject_success') });
        setShowRejectDialog(false);
        queryClient.invalidateQueries({ queryKey: ['GET_ALL_ROLES'] });
      },
      onError: (error: any) => {
        showToast({ code: 400, detail: error?.response?.data?.message || t('role.reject_failed') });
      },
    });
  };

  const actionTemplate = (rowData: IRole) => (
    <div className="action-buttons">
      {canApproveRole && !rowData.isActive && (
        <Button
          icon="pi pi-check"
          className="p-button-rounded p-button-success p-mr-2"
          onClick={() => handleApproveRole(rowData)}
          tooltip={t('button.approve')}
        />
      )}
      {canRejectRole && rowData.isActive && (
        <Button
          icon="pi pi-times"
          className="p-button-rounded p-button-danger p-mr-2"
          onClick={() => handleRejectRole(rowData)}
          tooltip={t('button.reject')}
        />
      )}
      {canUpdateRole && (
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-warning p-mr-2"
          onClick={() => handleEditRole(rowData)}
          tooltip={t('common.edit')}
        />
      )}
      {canDeleteRole && (
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-danger"
          onClick={() => handleDeleteRole(rowData.roleId)}
          tooltip={t('common.delete')}
        />
      )}
    </div>
  );

  const statusTemplate = (rowData: IRole) => (
    <span className={`status-badge ${rowData.isActive ? 'active' : 'inactive'}`}>
      {rowData.isActive ? t('common.active') : t('common.inactive')}
    </span>
  );

  const permissionsTemplate = (rowData: IRole) => (
    <span title={rowData.permissions?.map((p) => p.name).join(', ')}>
      {rowData.permissions?.length
        ? rowData.permissions.map((p) => p.name).join(', ')
        : '0 ' + t('role.permissions')}
    </span>
  );

  return (
    <div className="role-management-page">
      <div className="page-header">
        <h1>{t('role.management')}</h1>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <InputText
            placeholder={t('common.search')}
            value={searchKeyword}
            onChange={(e) => handleSearch(e.target.value)}
            className="search-input"
          />
        </div>
        <Button
          label={t('role.create_new')}
          icon="pi pi-plus"
          onClick={handleCreateRole}
          className="p-button-success"
          disabled={!canCreateRole}
        />
      </div>

      <div className="data-table-wrapper">
        <DataTable
          value={(rolesData?.roles ?? (rolesData?.data ? (Array.isArray(rolesData.data) ? rolesData.data : [rolesData.data]) : [])) as IRole[]}
          loading={isLoading}
          paginator
          rows={params.pageSize}
          first={params.pageNumber * params.pageSize}
          onPage={handlePageChange}
          totalRecords={rolesData?.totalPages ? rolesData.totalPages * params.pageSize : 0}
          rowsPerPageOptions={[10, 20, 50]}
          tableStyle={{ minWidth: '50rem' }}
          className="p-datatable-striped"
        >
          <Column field="code" header={t('role.code')} style={{ width: '15%' }} />
          <Column field="name" header={t('role.name')} style={{ width: '25%' }} />
          <Column field="description" header={t('role.description')} style={{ width: '30%' }} />
          <Column header={t('role.permissions')} body={permissionsTemplate} style={{ width: '15%' }} />
          <Column header={t('common.status')} body={statusTemplate} style={{ width: '10%' }} />
          <Column header={t('common.actions')} body={actionTemplate} style={{ width: '10%' }} />
        </DataTable>
      </div>

      <RoleFormDialog
        visible={showFormDialog}
        role={selectedRole}
        isEditing={isEditing}
        onHide={() => setShowFormDialog(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['GET_ALL_ROLES'] });
          setShowFormDialog(false);
        }}
      />

      <Dialog
        header={t('button.approve')}
        visible={showApproveDialog}
        onHide={() => setShowApproveDialog(false)}
      >
        <div className="dialog-content">
          <p>{t('role.confirm_approve')}</p>
          <p><strong>{selectedRole?.name}</strong></p>
        </div>
        <div className="dialog-footer">
          <Button label={t('common.cancel')} className="p-button-text" onClick={() => setShowApproveDialog(false)} />
          <Button label={t('button.approve')} onClick={confirmApproveRole} loading={approveRoleMutation.isPending} />
        </div>
      </Dialog>

      <Dialog
        header={t('button.reject')}
        visible={showRejectDialog}
        onHide={() => setShowRejectDialog(false)}
      >
        <div className="dialog-content">
          <p>{t('role.confirm_reject')}</p>
          <p><strong>{selectedRole?.name}</strong></p>
        </div>
        <div className="dialog-footer">
          <Button label={t('common.cancel')} className="p-button-text" onClick={() => setShowRejectDialog(false)} />
          <Button label={t('button.reject')} severity="danger" onClick={confirmRejectRole} loading={rejectRoleMutation.isPending} />
        </div>
      </Dialog>
    </div>
  );
};

export { RoleManagementPage };
export default RoleManagementPage;
