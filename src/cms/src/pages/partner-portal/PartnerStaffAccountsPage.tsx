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
import { AppBreadcrumb } from 'components';
import { TenantSelector } from '@/components/TenantSelector';
import { CommonStatus } from '@/models';
import { LoyaltyService, PartnerStaffAccountModel } from '@/service/loyalty.service';

export const PartnerStaffAccountsPage: React.FC = () => {
  const { t } = useTranslation();
  const toast = useRef<Toast>(null);

  const [selectedTenant, setSelectedTenant] = useState<string>(
    () => localStorage.getItem('selected_tenant_id') || 'TENANT_NATCASH'
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
      roleCode: 'CASHIER',
      branchCode: '',
      email: '',
      phone: '',
      status: CommonStatus.ACTIVE,
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formData.username?.trim() || !formData.fullName?.trim()) {
      toast.current?.show({ severity: 'warn', summary: t('common.warn', { defaultValue: 'Thiếu thông tin' }), detail: t('partner_portal.staff_required', { defaultValue: 'Vui lòng nhập Tên đăng nhập và Họ tên nhân viên.' }) });
      return;
    }
    setSubmitting(true);
    try {
      await LoyaltyService.savePartnerStaff(formData as PartnerStaffAccountModel, selectedTenant);
      toast.current?.show({ severity: 'success', summary: t('common.success', { defaultValue: 'Thành công' }), detail: formData.username });
      setShowDialog(false);
      fetchStaff();
    } catch (err: any) {
      toast.current?.show({ severity: 'error', summary: t('common.error', { defaultValue: 'Lỗi' }), detail: err?.response?.data?.message || err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Toast ref={toast} />
      <AppBreadcrumb items={[{ label: t('partner_portal.nav_staff', { defaultValue: 'Partner Portal · Tài khoản Nhân viên (QT-03)' }) }]} />

      <div className="card shadow-1 border-round surface-card p-4">
        <div className="flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
          <div>
            <h4 className="m-0 text-primary font-semibold">{t('partner_portal.staff_title', { defaultValue: 'Quản lý Tài khoản Nhân viên & Phân quyền Quầy (QT-03)' })}</h4>
            <p className="m-0 text-xs text-500 mt-1">{t('partner_portal.staff_subtitle', { defaultValue: 'Cấp quyền Thu ngân (CASHIER), Quản lý Chi nhánh (BRANCH_MANAGER), Kế toán (ACCOUNTANT) hoặc Quản trị (PARTNER_ADMIN).' })}</p>
          </div>
          <div className="flex gap-2 align-items-center">
            <TenantSelector value={selectedTenant} onChange={setSelectedTenant} />
            <Button label={t('partner_portal.add_staff', { defaultValue: 'Thêm Nhân viên' })} icon="pi pi-plus" severity="success" size="small" onClick={openNew} />
            <Button icon="pi pi-refresh" outlined rounded onClick={fetchStaff} loading={loading} />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-column gap-2"><Skeleton height="2.75rem" /><Skeleton height="2.75rem" /></div>
        ) : (
          <DataTable<PartnerStaffAccountModel> value={staffList} paginator rows={10} stripedRows responsiveLayout="scroll" emptyMessage={t('common.no_data', { defaultValue: 'Chưa có tài khoản nhân viên nào.' })}>
            <Column field="username" header={t('partner_portal.username', { defaultValue: 'Tài Khoản' })} body={(r) => <span className="font-mono white-space-nowrap font-medium text-primary">{r.username}</span>} style={{ minWidth: '10rem' }} />
            <Column field="fullName" header={t('customer.name', { defaultValue: 'Họ Tên' })} style={{ minWidth: '13rem' }} />
            <Column field="roleCode" header={t('partner_portal.role', { defaultValue: 'Vai Trò' })} body={(r) => <Tag value={r.roleCode} severity="info" />} style={{ minWidth: '10rem' }} />
            <Column field="branchCode" header={t('partner_portal.branch_code', { defaultValue: 'Chi Nhánh' })} body={(r) => <span className="font-mono text-xs">{r.branchCode || 'ALL'}</span>} style={{ minWidth: '9rem' }} />
            <Column field="email" header="Email" style={{ minWidth: '13rem' }} />
            <Column field="phone" header={t('customer.phone', { defaultValue: 'SĐT' })} body={(r) => <span className="font-mono white-space-nowrap">{r.phone || '--'}</span>} style={{ minWidth: '10rem' }} />
            <Column field="status" header={t('common.status', { defaultValue: 'Trạng Thái' })} body={(r) => <Tag value={r.status} severity={r.status === CommonStatus.ACTIVE ? 'success' : 'secondary'} />} style={{ minWidth: '8rem', textAlign: 'center' }} />
            <Column header={t('common.action', { defaultValue: 'Sửa' })} body={(r) => <Button icon="pi pi-pencil" text rounded size="small" onClick={() => { setFormData(r); setShowDialog(true); }} />} style={{ minWidth: '5rem' }} />
          </DataTable>
        )}
      </div>

      <Dialog visible={showDialog} onHide={() => setShowDialog(false)} header={t('partner_portal.staff_dialog', { defaultValue: 'Thông tin Tài khoản Nhân viên Đối tác' })} style={{ width: '36rem' }} modal className="p-fluid">
        <div className="grid">
          <div className="col-6 field">
            <label className="text-sm font-medium">{t('partner_portal.username', { defaultValue: 'Tên đăng nhập' })} *</label>
            <InputText value={formData.username || ''} onChange={(e) => setFormData({ ...formData, username: e.target.value })} className="font-mono" disabled={!!formData.id} />
          </div>
          <div className="col-6 field">
            <label className="text-sm font-medium">{t('partner_portal.role', { defaultValue: 'Vai trò' })}</label>
            <Dropdown value={formData.roleCode} options={[{ label: 'PARTNER_ADMIN', value: 'PARTNER_ADMIN' }, { label: 'BRANCH_MANAGER', value: 'BRANCH_MANAGER' }, { label: 'CASHIER', value: 'CASHIER' }, { label: 'ACCOUNTANT', value: 'ACCOUNTANT' }]} onChange={(e) => setFormData({ ...formData, roleCode: e.value })} appendTo="self" />
          </div>
          <div className="col-12 field">
            <label className="text-sm font-medium">{t('customer.name', { defaultValue: 'Họ Tên' })} *</label>
            <InputText value={formData.fullName || ''} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} />
          </div>
          <div className="col-6 field">
            <label className="text-sm font-medium">{t('partner_portal.branch_code', { defaultValue: 'Mã chi nhánh' })}</label>
            <InputText value={formData.branchCode || ''} onChange={(e) => setFormData({ ...formData, branchCode: e.target.value.toUpperCase() })} className="font-mono" />
          </div>
          <div className="col-6 field">
            <label className="text-sm font-medium">{t('customer.phone', { defaultValue: 'Số điện thoại' })}</label>
            <InputText value={formData.phone || ''} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="font-mono" />
          </div>
          <div className="col-8 field">
            <label className="text-sm font-medium">Email</label>
            <InputText value={formData.email || ''} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
          </div>
          <div className="col-4 field">
            <label className="text-sm font-medium">{t('common.status', { defaultValue: 'Trạng thái' })}</label>
            <Dropdown value={formData.status} options={[{ label: CommonStatus.ACTIVE, value: CommonStatus.ACTIVE }, { label: CommonStatus.INACTIVE, value: CommonStatus.INACTIVE }]} onChange={(e) => setFormData({ ...formData, status: e.value })} appendTo="self" />
          </div>
        </div>
        <div className="flex justify-content-end gap-2 mt-3">
          <Button label={t('common.cancel', { defaultValue: 'Hủy' })} outlined onClick={() => setShowDialog(false)} />
          <Button label={t('common.save', { defaultValue: 'Lưu' })} icon="pi pi-check" onClick={handleSave} loading={submitting} />
        </div>
      </Dialog>
    </div>
  );
};

export default PartnerStaffAccountsPage;
