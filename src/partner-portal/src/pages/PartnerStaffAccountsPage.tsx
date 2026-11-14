import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { Skeleton } from 'primereact/skeleton';
import { useTranslation } from 'react-i18next';
import { AppBreadcrumb } from '@/components/AppBreadcrumb';
import { TenantSelector } from '@/components/TenantSelector';
import { KeyStorage, PARTNER_PORTAL_CONSTANTS } from '@/constants';
import { CommonStatus, PartnerStaffRole } from '@/models';
import { LoyaltyService, PartnerStaffAccountModel } from '@/service/loyalty.service';

export const PartnerStaffAccountsPage: React.FC = () => {
  const { t } = useTranslation();
  const toast = useRef<Toast>(null);

  const [selectedTenant, setSelectedTenant] = useState<string>(
    () => localStorage.getItem(KeyStorage.SELECTED_TENANT_ID) || PARTNER_PORTAL_CONSTANTS.DEFAULT_TENANT_ID
  );
  const [staffList, setStaffList] = useState<PartnerStaffAccountModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<PartnerStaffAccountModel>>({});

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const list = await LoyaltyService.getPartnerStaff(selectedTenant);
      setStaffList(Array.isArray(list) ? list : []);
    } finally {
      setLoading(false);
    }
  }, [selectedTenant]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const openNew = () => {
    setFormData({
      username: '',
      fullName: '',
      roleCode: PartnerStaffRole.PARTNER_CASHIER,
      branchId: undefined,
      branchName: '',
      phoneNumber: '',
      status: CommonStatus.ACTIVE,
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formData.username?.trim() || !formData.fullName?.trim()) {
      toast.current?.show({ severity: 'warn', summary: t('common.warn'), detail: t('partner_portal.staff_required') });
      return;
    }
    setSubmitting(true);
    try {
      await LoyaltyService.savePartnerStaff(formData as PartnerStaffAccountModel, selectedTenant);
      toast.current?.show({ severity: 'success', summary: t('common.success'), detail: formData.username });
      setShowDialog(false);
      fetchStaff();
    } catch (err: any) {
      toast.current?.show({ severity: 'error', summary: t('common.error'), detail: err?.response?.data?.message || err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Toast ref={toast} />
      <AppBreadcrumb items={[{ label: t('partner_portal.nav_staff') }]} />

      <div className="card shadow-1 border-round surface-card p-4">
        <div className="flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
          <div>
            <h4 className="m-0 text-primary font-semibold">{t('partner_portal.staff_title')}</h4>
            <p className="m-0 text-xs text-500 mt-1">{t('partner_portal.staff_subtitle')}</p>
          </div>
          <div className="flex gap-2 align-items-center">
            <TenantSelector value={selectedTenant} onChange={setSelectedTenant} />
            <Button label={t('partner_portal.add_staff')} icon="pi pi-plus" severity="success" size="small" onClick={openNew} />
            <Button icon="pi pi-refresh" outlined rounded onClick={fetchStaff} loading={loading} />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-column gap-2"><Skeleton height="2.75rem" /><Skeleton height="2.75rem" /></div>
        ) : (
          <DataTable<PartnerStaffAccountModel[]> value={staffList} paginator rows={10} stripedRows responsiveLayout="scroll" emptyMessage={t('common.no_data')}>
            <Column field="username" header={t('partner_portal.username')} body={(r: PartnerStaffAccountModel) => <span className="font-mono white-space-nowrap font-medium text-primary">{r.username}</span>} style={{ minWidth: '10rem' }} />
            <Column field="fullName" header={t('customer.name')} style={{ minWidth: '13rem' }} />
            <Column
              field="roleCode"
              header={t('partner_portal.role')}
              body={(r: PartnerStaffAccountModel) => {
                const normalizedRole = r.roleCode
                  ? (r.roleCode.startsWith('PARTNER_') ? r.roleCode : `PARTNER_${r.roleCode}`)
                  : '';
                const isKnownRole = Object.values(PartnerStaffRole).includes(normalizedRole as PartnerStaffRole);
                return (
                  <Tag
                    value={isKnownRole ? t(`enum.partner_staff_role.${normalizedRole}`) : (r.roleCode || '--')}
                    severity="info"
                  />
                );
              }}
              style={{ minWidth: '10rem' }}
            />
            <Column field="branchName" header={t('partner_portal.branch_code')} body={(r: PartnerStaffAccountModel) => <span className="font-mono text-xs">{r.branchName || (r.branchId ? `BR#${r.branchId}` : t('common.all'))}</span>} style={{ minWidth: '9rem' }} />
            <Column field="phoneNumber" header={t('customer.phone')} body={(r: PartnerStaffAccountModel) => <span className="font-mono white-space-nowrap">{r.phoneNumber || '--'}</span>} style={{ minWidth: '10rem' }} />
            <Column field="status" header={t('common.status')} body={(r: PartnerStaffAccountModel) => <Tag value={t(r.status === CommonStatus.ACTIVE ? 'common.active' : 'common.inactive')} severity={r.status === CommonStatus.ACTIVE ? 'success' : 'secondary'} />} style={{ minWidth: '8rem', textAlign: 'center' }} />
            <Column header={t('common.action')} body={(r: PartnerStaffAccountModel) => <Button icon="pi pi-pencil" text rounded size="small" onClick={() => { setFormData(r); setShowDialog(true); }} />} style={{ minWidth: '5rem' }} />
          </DataTable>
        )}
      </div>

      <Dialog visible={showDialog} onHide={() => setShowDialog(false)} header={t('partner_portal.staff_dialog')} style={{ width: '36rem' }} modal className="p-fluid">
        <div className="grid">
          <div className="col-6 field">
            <label className="text-sm font-medium">{t('partner_portal.username')} *</label>
            <InputText value={formData.username || ''} onChange={(e) => setFormData({ ...formData, username: e.target.value })} className="font-mono" disabled={!!formData.id} />
          </div>
          <div className="col-6 field">
            <label className="text-sm font-medium">{t('partner_portal.role')}</label>
            <Dropdown
              value={formData.roleCode}
              options={Object.values(PartnerStaffRole).map((role) => ({
                label: t(`enum.partner_staff_role.${role}`),
                value: role,
              }))}
              onChange={(e) => setFormData({ ...formData, roleCode: e.value })}
              appendTo="self"
            />
          </div>
          <div className="col-12 field">
            <label className="text-sm font-medium">{t('customer.name')} *</label>
            <InputText value={formData.fullName || ''} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} />
          </div>
          <div className="col-6 field">
            <label className="text-sm font-medium">{t('partner_portal.branch_code')}</label>
            <InputText value={formData.branchId ? String(formData.branchId) : ''} onChange={(e) => setFormData({ ...formData, branchId: Number(e.target.value) || 0 })} className="font-mono" />
          </div>
          <div className="col-6 field">
            <label className="text-sm font-medium">{t('customer.phone')}</label>
            <InputText value={formData.phoneNumber || ''} onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })} className="font-mono" />
          </div>
          <div className="col-6 field">
            <label className="text-sm font-medium">{t('partner_portal.branch_name')}</label>
            <InputText value={formData.branchName || ''} onChange={(e) => setFormData({ ...formData, branchName: e.target.value })} />
          </div>
          <div className="col-6 field">
            <label className="text-sm font-medium">{t('common.status')}</label>
            <Dropdown
              value={formData.status}
              options={[
                { label: t('common.active'), value: CommonStatus.ACTIVE },
                { label: t('common.inactive'), value: CommonStatus.INACTIVE },
              ]}
              onChange={(e) => setFormData({ ...formData, status: e.value })}
              appendTo="self"
            />
          </div>
        </div>
        <div className="flex justify-content-end gap-2 mt-3">
          <Button label={t('common.cancel')} outlined onClick={() => setShowDialog(false)} />
          <Button label={t('common.save')} icon="pi pi-check" onClick={handleSave} loading={submitting} />
        </div>
      </Dialog>
    </div>
  );
};

export default PartnerStaffAccountsPage;
