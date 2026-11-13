import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Skeleton } from 'primereact/skeleton';
import { useTranslation } from 'react-i18next';
import { AppBreadcrumb } from 'components';
import { TenantSelector } from '@/components/TenantSelector';
import { CommonStatus } from '@/models';
import { LoyaltyService, NatcashPaymentPointModel } from '@/service/loyalty.service';

export const NatcashBranchesPaymentPointsPage: React.FC = () => {
  const { t } = useTranslation();
  const toast = useRef<Toast>(null);

  const [selectedTenant, setSelectedTenant] = useState<string>(
    () => localStorage.getItem('selected_tenant_id') || 'TENANT_NATCASH'
  );
  const [items, setItems] = useState<NatcashPaymentPointModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showDialog, setShowDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<NatcashPaymentPointModel>>({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const list = await LoyaltyService.getPaymentPoints(
        {
          keyword: keyword.trim() || undefined,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
        },
        selectedTenant
      );
      setItems(Array.isArray(list) ? list : []);
    } finally {
      setLoading(false);
    }
  }, [selectedTenant, keyword, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openNew = () => {
    setFormData({
      branchCode: '',
      branchName: '',
      paymentPointCode: '',
      province: '',
      address: '',
      managerPhone: '',
      status: CommonStatus.ACTIVE,
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formData.branchCode?.trim() || !formData.branchName?.trim() || !formData.paymentPointCode?.trim()) {
      toast.current?.show({
        severity: 'warn',
        summary: t('common.warn', { defaultValue: 'Thiếu thông tin' }),
        detail: t('payment_point.required_fields', { defaultValue: 'Vui lòng nhập Mã chi nhánh, Tên chi nhánh và Mã điểm thanh toán.' }),
      });
      return;
    }
    setSubmitting(true);
    try {
      if (formData.id) {
        await LoyaltyService.updatePaymentPoint(formData.id, formData as NatcashPaymentPointModel, selectedTenant);
      } else {
        await LoyaltyService.createPaymentPoint(formData as NatcashPaymentPointModel, selectedTenant);
      }
      toast.current?.show({
        severity: 'success',
        summary: t('common.success', { defaultValue: 'Thành công' }),
        detail: t('payment_point.saved', { defaultValue: 'Đã lưu thông tin chi nhánh / điểm thanh toán.' }),
      });
      setShowDialog(false);
      fetchData();
    } catch (err: any) {
      toast.current?.show({ severity: 'error', summary: t('common.error', { defaultValue: 'Lỗi' }), detail: err?.response?.data?.message || err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (item: NatcashPaymentPointModel) => {
    if (!item.id) return;
    confirmDialog({
      message: `${t('common.confirm_delete', { defaultValue: 'Xác nhận xóa điểm thanh toán' })} ${item.paymentPointCode}?`,
      header: t('common.confirm', { defaultValue: 'Xác nhận' }),
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      accept: async () => {
        try {
          await LoyaltyService.deletePaymentPoint(item.id!, selectedTenant);
          toast.current?.show({ severity: 'success', summary: t('common.success', { defaultValue: 'Đã xóa' }), detail: item.paymentPointCode });
          fetchData();
        } catch (err: any) {
          toast.current?.show({ severity: 'error', summary: t('common.error', { defaultValue: 'Lỗi' }), detail: err?.response?.data?.message || err.message });
        }
      },
    });
  };

  const statusFilterOptions = [
    { label: t('common.all', { defaultValue: 'Tất cả trạng thái' }), value: 'ALL' },
    { label: CommonStatus.ACTIVE, value: CommonStatus.ACTIVE },
    { label: CommonStatus.INACTIVE, value: CommonStatus.INACTIVE },
  ];

  return (
    <div>
      <Toast ref={toast} />
      <ConfirmDialog />
      <AppBreadcrumb items={[{ label: t('nav.payment_points', { defaultValue: 'Chi nhánh & Điểm Thanh toán (LM-02)' }) }]} />

      <div className="card shadow-1 border-round surface-card p-4">
        <div className="flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
          <div>
            <h4 className="m-0 text-primary font-semibold">
              {t('payment_point.title', { defaultValue: 'Mạng lưới Chi nhánh Natcash & Điểm Thanh toán QR (LM-02)' })}
            </h4>
            <p className="m-0 text-xs text-500 mt-1">
              {t('payment_point.subtitle', { defaultValue: 'Quản lý cây phân cấp Thương hiệu → Chi nhánh → Quầy thu ngân / Payment Point.' })}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 align-items-center">
            <TenantSelector value={selectedTenant} onChange={setSelectedTenant} />
            <Dropdown value={statusFilter} options={statusFilterOptions} onChange={(e) => setStatusFilter(e.value)} className="w-13rem" />
            <span className="p-input-icon-left">
              <i className="pi pi-search" />
              <InputText value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder={t('common.search', { defaultValue: 'Tìm mã điểm, địa chỉ...' })} className="w-14rem p-inputtext-sm" />
            </span>
            <Button label={t('payment_point.add_new', { defaultValue: 'Thêm điểm thu' })} icon="pi pi-plus" severity="success" size="small" onClick={openNew} />
            <Button icon="pi pi-refresh" outlined rounded onClick={fetchData} loading={loading} />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-column gap-2">
            <Skeleton height="2.75rem" />
            <Skeleton height="2.75rem" />
            <Skeleton height="2.75rem" />
          </div>
        ) : (
          <DataTable<NatcashPaymentPointModel[]>
            value={items}
            paginator
            rows={15}
            stripedRows
            responsiveLayout="scroll"
            emptyMessage={t('payment_point.empty', { defaultValue: 'Chưa có chi nhánh hoặc điểm thanh toán nào trong liên minh này.' })}
          >
            <Column field="branchCode" header={t('payment_point.branch_code', { defaultValue: 'Mã Chi Nhánh' })} body={(r: NatcashPaymentPointModel) => <span className="font-mono white-space-nowrap font-medium text-primary">{r.branchCode}</span>} style={{ minWidth: '10rem' }} />
            <Column field="branchName" header={t('payment_point.name', { defaultValue: 'Tên Chi Nhánh' })} style={{ minWidth: '14rem' }} />
            <Column field="paymentPointCode" header={t('payment_point.code', { defaultValue: 'Mã Điểm Thu' })} body={(r: NatcashPaymentPointModel) => <span className="font-mono white-space-nowrap">{r.paymentPointCode}</span>} style={{ minWidth: '11rem' }} />
            <Column field="province" header={t('payment_point.city', { defaultValue: 'Tỉnh / Thành' })} style={{ minWidth: '9rem' }} />
            <Column field="address" header={t('payment_point.address', { defaultValue: 'Địa Chỉ' })} style={{ minWidth: '15rem' }} />
            <Column field="managerPhone" header={t('payment_point.phone', { defaultValue: 'SĐT Quản Lý' })} body={(r: NatcashPaymentPointModel) => <span className="font-mono white-space-nowrap text-xs">{r.managerPhone || '--'}</span>} style={{ minWidth: '10rem' }} />
            <Column field="status" header={t('common.status', { defaultValue: 'Trạng Thái' })} body={(r: NatcashPaymentPointModel) => <Tag value={r.status || CommonStatus.ACTIVE} severity={r.status === CommonStatus.ACTIVE ? 'success' : 'secondary'} />} style={{ minWidth: '8rem', textAlign: 'center' }} />
            <Column
              header={t('common.action', { defaultValue: 'Thao Tác' })}
              body={(r: NatcashPaymentPointModel) => (
                <div className="flex gap-1">
                  <Button icon="pi pi-pencil" text rounded size="small" onClick={() => { setFormData(r); setShowDialog(true); }} />
                  <Button icon="pi pi-trash" text rounded severity="danger" size="small" onClick={() => handleDelete(r)} />
                </div>
              )}
              style={{ minWidth: '7rem' }}
            />
          </DataTable>
        )}
      </div>

      <Dialog
        visible={showDialog}
        onHide={() => setShowDialog(false)}
        header={formData.id ? t('payment_point.edit_title', { defaultValue: 'Cập nhật Điểm Thanh Toán' }) : t('payment_point.create_title', { defaultValue: 'Thêm Chi nhánh / Điểm Thanh Toán' })}
        style={{ width: '40rem' }}
        modal
        className="p-fluid"
      >
        <div className="grid">
          <div className="col-12 md:col-6 field">
            <label className="text-sm font-medium">{t('payment_point.branch_code', { defaultValue: 'Mã Chi Nhánh' })} *</label>
            <InputText value={formData.branchCode || ''} onChange={(e) => setFormData({ ...formData, branchCode: e.target.value.toUpperCase() })} className="font-mono" disabled={!!formData.id} />
          </div>
          <div className="col-12 md:col-6 field">
            <label className="text-sm font-medium">{t('payment_point.code', { defaultValue: 'Mã Điểm Thu' })} *</label>
            <InputText value={formData.paymentPointCode || ''} onChange={(e) => setFormData({ ...formData, paymentPointCode: e.target.value.toUpperCase() })} className="font-mono" disabled={!!formData.id} />
          </div>
          <div className="col-12 field">
            <label className="text-sm font-medium">{t('payment_point.name', { defaultValue: 'Tên Chi Nhánh' })} *</label>
            <InputText value={formData.branchName || ''} onChange={(e) => setFormData({ ...formData, branchName: e.target.value })} />
          </div>
          <div className="col-12 md:col-6 field">
            <label className="text-sm font-medium">{t('payment_point.phone', { defaultValue: 'SĐT Quản Lý' })}</label>
            <InputText value={formData.managerPhone || ''} onChange={(e) => setFormData({ ...formData, managerPhone: e.target.value })} className="font-mono" />
          </div>
          <div className="col-12 md:col-6 field">
            <label className="text-sm font-medium">{t('payment_point.city', { defaultValue: 'Tỉnh / Thành' })}</label>
            <InputText value={formData.province || ''} onChange={(e) => setFormData({ ...formData, province: e.target.value })} />
          </div>
          <div className="col-12 md:col-6 field">
            <label className="text-sm font-medium">{t('common.status', { defaultValue: 'Trạng Thái' })}</label>
            <Dropdown
              value={formData.status || CommonStatus.ACTIVE}
              options={[{ label: CommonStatus.ACTIVE, value: CommonStatus.ACTIVE }, { label: CommonStatus.INACTIVE, value: CommonStatus.INACTIVE }]}
              onChange={(e) => setFormData({ ...formData, status: e.value })}
              appendTo="self"
            />
          </div>
          <div className="col-12 field">
            <label className="text-sm font-medium">{t('payment_point.address', { defaultValue: 'Địa Chỉ' })}</label>
            <InputText value={formData.address || ''} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
          </div>
        </div>
        <div className="flex justify-content-end gap-2 mt-3">
          <Button label={t('common.cancel', { defaultValue: 'Hủy' })} icon="pi pi-times" outlined onClick={() => setShowDialog(false)} />
          <Button label={t('common.save', { defaultValue: 'Lưu' })} icon="pi pi-check" onClick={handleSave} loading={submitting} />
        </div>
      </Dialog>
    </div>
  );
};

export default NatcashBranchesPaymentPointsPage;
