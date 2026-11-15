import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dialog } from 'primereact/dialog';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { sandboxAdminService, SandboxUser } from '@/service/sandbox.service';

// eslint-disable-next-line react-refresh/only-export-components
export enum SandboxUserStatus {
  APPROVED = 'APPROVED',
  PENDING = 'PENDING',
  LOCKED = 'LOCKED',
  REJECTED = 'REJECTED',
}

export function SandboxUsersPage() {
  const { t } = useTranslation();
  const toast = useRef<Toast>(null);

  const [users, setUsers] = useState<SandboxUser[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');

  // Dialog State
  const [showDialog, setShowDialog] = useState<boolean>(false);
  const [formData, setFormData] = useState<Partial<SandboxUser>>({
    username: '',
    fullName: '',
    email: '',
    phone: '',
    password: '',
    status: SandboxUserStatus.APPROVED,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const uList = await sandboxAdminService.getUsers();
      setUsers(uList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (id: number) => {
    try {
      await sandboxAdminService.approveUser(id);
      toast.current?.show({
        severity: 'success',
        summary: t('common.success'),
        detail: t('sandbox.approve_user_success'),
        life: 2500,
      });
      loadData();
    } catch {
      toast.current?.show({
        severity: 'error',
        summary: t('common.error'),
        detail: t('sandbox.approve_user_failed'),
        life: 2500,
      });
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: string) => {
    const nextStatus =
      currentStatus === SandboxUserStatus.LOCKED ? SandboxUserStatus.APPROVED : SandboxUserStatus.LOCKED;
    try {
      await sandboxAdminService.toggleUserStatus(id, nextStatus);
      toast.current?.show({
        severity: 'info',
        summary: t('common.update'),
        detail: t('sandbox.status_changed_to', { status: nextStatus }),
        life: 2500,
      });
      loadData();
    } catch {
      toast.current?.show({
        severity: 'error',
        summary: t('common.error'),
        detail: t('sandbox.change_status_failed'),
        life: 2500,
      });
    }
  };

  const handleSaveUser = async () => {
    if (!formData.username || !formData.fullName) {
      toast.current?.show({
        severity: 'warn',
        summary: t('common.warning'),
        detail: t('sandbox.enter_username_fullname'),
        life: 2500,
      });
      return;
    }

    try {
      await sandboxAdminService.createUser(formData as SandboxUser);
      toast.current?.show({
        severity: 'success',
        summary: t('common.success'),
        detail: t('sandbox.create_user_success'),
        life: 2500,
      });
      setShowDialog(false);
      loadData();
    } catch {
      toast.current?.show({
        severity: 'error',
        summary: t('common.error'),
        detail: t('sandbox.create_user_failed'),
        life: 2500,
      });
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-3 md:p-4 surface-ground min-h-screen">
      <Toast ref={toast} />

      {/* Header */}
      <div className="flex flex-column md:flex-row justify-content-between align-items-start md:align-items-center mb-4 gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-900 m-0">{t('sandbox.users_title')}</h1>
          <p className="text-xs text-500 m-0 mt-1 font-medium">
            {t('sandbox.users_subtitle')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            label={t('common.refresh')}
            icon="pi pi-refresh"
            outlined
            onClick={loadData}
            className="p-button-sm font-medium"
          />
          <Button
            label={t('sandbox.add_user_btn')}
            icon="pi pi-plus"
            onClick={() => {
              setFormData({
                username: '',
                fullName: '',
                email: '',
                phone: '',
                password: '',
                status: SandboxUserStatus.APPROVED,
              });
              setShowDialog(true);
            }}
            className="p-button-sm font-semibold border-none"
            style={{ background: '#FF6B00', color: '#ffffff' }}
          />
        </div>
      </div>

      {/* Main Table Card */}
      <div className="surface-card p-4 border-round-2xl border-1 surface-border shadow-1">
        <div className="flex justify-content-between align-items-center mb-3">
          <span className="p-input-icon-left w-full md:w-20rem">
            <i className="pi pi-search" />
            <InputText
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('sandbox.search_users_placeholder')}
              className="w-full p-inputtext-sm"
            />
          </span>
          <span className="text-xs text-500 font-medium">{t('sandbox.total_users_count', { count: filteredUsers.length })}</span>
        </div>

        <DataTable
          value={filteredUsers}
          loading={loading}
          paginator
          rows={10}
          emptyMessage={t('sandbox.no_users')}
          className="p-datatable-sm"
        >
          <Column
            header={t('common.order_number', 'STT')}
            body={(_, options) => (
              <span className="font-mono text-xs text-600 font-normal">
                {options.rowIndex + 1}
              </span>
            )}
            style={{ width: '4rem', textAlign: 'center' }}
          />
          <Column
            header={t('common.action', 'Thao tác')}
            body={(r: SandboxUser) => (
              <div className="flex gap-2 justify-content-center">
                {r.status === SandboxUserStatus.PENDING && (
                  <Button
                    label={t('sandbox.approve_btn')}
                    icon="pi pi-check"
                    severity="success"
                    size="small"
                    outlined
                    onClick={() => r.id && handleApprove(r.id)}
                  />
                )}
                <Button
                  label={r.status === SandboxUserStatus.LOCKED ? t('sandbox.unlock_btn') : t('sandbox.lock_btn')}
                  icon={r.status === SandboxUserStatus.LOCKED ? 'pi pi-lock-open' : 'pi pi-lock'}
                  severity={r.status === SandboxUserStatus.LOCKED ? 'info' : 'danger'}
                  size="small"
                  outlined
                  onClick={() => r.id && handleToggleStatus(r.id, r.status)}
                />
              </div>
            )}
            style={{ width: '10rem', textAlign: 'center' }}
          />
          <Column field="username" header={t('sandbox.username_col')} body={(r: SandboxUser) => <span className="font-bold font-mono text-900">{r.username}</span>} />
          <Column field="fullName" header={t('sandbox.fullname_col')} body={(r: SandboxUser) => <span className="text-900">{r.fullName}</span>} />
          <Column field="email" header={t('user.email')} body={(r: SandboxUser) => <span className="text-900">{r.email || '-'}</span>} />
          <Column field="phone" header={t('sandbox.phone_col')} body={(r: SandboxUser) => <span className="text-900 font-mono text-xs">{r.phone || '-'}</span>} />
          <Column
            header={t('sandbox.roles_group_col')}
            body={(r: SandboxUser) => (
              <div className="flex flex-wrap gap-1">
                {r.groupNames && r.groupNames.length > 0 ? (
                  r.groupNames.map((g, idx) => <Tag key={idx} value={g} severity="info" className="text-xs" />)
                ) : (
                  <span className="text-xs text-400">{t('sandbox.unassigned')}</span>
                )}
              </div>
            )}
          />
          <Column
            field="status"
            header={t('common.status')}
            body={(r: SandboxUser) => {
              const statusMap: Record<string, { label: string; severity: 'success' | 'warning' | 'danger' | 'info' }> = {
                APPROVED: { label: t('sandbox.status_approved'), severity: 'success' },
                PENDING: { label: t('sandbox.status_pending'), severity: 'warning' },
                LOCKED: { label: t('sandbox.status_locked'), severity: 'danger' },
                REJECTED: { label: t('sandbox.status_rejected'), severity: 'danger' },
              };
              const item = statusMap[r.status] || { label: r.status, severity: 'info' };
              return <Tag value={item.label} severity={item.severity} className="font-semibold text-xs" />;
            }}
            style={{ minWidth: '8rem', textAlign: 'center' }}
          />
        </DataTable>
      </div>

      {/* Create Dialog */}
      <Dialog
        header={t('sandbox.create_user_dialog_header')}
        visible={showDialog}
        style={{ width: '480px' }}
        onHide={() => setShowDialog(false)}
        footer={
          <div className="flex justify-content-end gap-2">
            <Button label={t('common.cancel')} severity="secondary" outlined onClick={() => setShowDialog(false)} />
            <Button
              label={t('sandbox.create_user_submit')}
              icon="pi pi-check"
              onClick={handleSaveUser}
              style={{ background: '#FF6B00', borderColor: '#FF6B00', color: '#ffffff' }}
            />
          </div>
        }
      >
        <div className="flex flex-column gap-3 mt-2">
          <div>
            <label className="text-xs font-semibold text-700 block mb-1">{t('sandbox.username_label')}</label>
            <InputText
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder={t('sandbox.username_placeholder')}
              className="w-full p-inputtext-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-700 block mb-1">{t('sandbox.password_init_label')}</label>
            <InputText
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder={t('sandbox.password_init_placeholder')}
              className="w-full p-inputtext-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-700 block mb-1">{t('sandbox.fullname_label')}</label>
            <InputText
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder={t('sandbox.fullname_placeholder')}
              className="w-full p-inputtext-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-700 block mb-1">{t('user.email')}</label>
            <InputText
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder={t('sandbox.email_placeholder')}
              className="w-full p-inputtext-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-700 block mb-1">{t('sandbox.phone_label')}</label>
            <InputText
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder={t('sandbox.phone_placeholder')}
              className="w-full p-inputtext-sm"
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}

export default SandboxUsersPage;
