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
import { CommonStatus, PartnerHierarchyLevel } from '@/models';
import { LoyaltyService, PaymentPointModel } from '@/service/loyalty.service';

export const NatcashBranchesPaymentPointsPage: React.FC = () => {
  const { t } = useTranslation();
  const toast = useRef<Toast>(null);

  const [selectedTenant, setSelectedTenant] = useState<string>(
    () => localStorage.getItem('selected_tenant_id') || 'TENANT_NATCASH'
  );
  const [items, setItems] = useState<PaymentPointModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('ALL');
  const [showDialog, setShowDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<PaymentPointModel>>({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const list = await LoyaltyService.getPaymentPoints(
        {
          keyword: keyword.trim() || undefined,
          hierarchyLevel: levelFilter !== 'ALL' ? levelFilter : undefined,
        },
        selectedTenant
      );
      setItems(Array.isArray(list) ? list : []);
    } finally {
      setLoading(false);
    }
  }, [selectedTenant, keyword, levelFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openNew = () => {
    setFormData({
      pointCode: '',
      pointName: '',
      hierarchyLevel: PartnerHierarchyLevel.PAYMENT_POINT,
      city: '',
      address: '',
      phone: '',
      qrMerchantRef: '',
      status: CommonStatus.ACTIVE,
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formData.pointCode?.trim() || !formData.pointName?.trim()) {
      toast.current?.show({
        severity: 'warn',
        summary: t('common.warn', { defaultValue: 'Thiếu thông tin' }),
        detail: t('payment_point.required_fields', { defaultValue: 'Vui lòng nhập Mã điểm thu và Tên chi nhánh/điểm thanh toán.' }),
      });
      return;
    }
    setSubmitting(true);
    try {
      if (formData.id) {
        await LoyaltyService.updatePaymentPoint(formData.id, formData as PaymentPointModel, selectedTenant);
      } else {
        await LoyaltyService.createPaymentPoint(formData as PaymentPointModel, selectedTenant);
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

  const handleDelete = (item: PaymentPointModel) => {
    if (!item.id) return;
    confirmDialog({
      message: `${t('common.confirm_delete', { defaultValue: 'Xác nhận xóa điểm thanh toán' })} ${item.pointCode}?`,
      header: t('common.confirm', { defaultValue: 'Xác nhận' }),
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      accept: async () => {
        try {
          await LoyaltyService.deletePaymentPoint(item.id!, selectedTenant);
          toast.current?.show({ severity: 'success', summary: t('common.success', { defaultValue: 'Đã xóa' }), detail: item.pointCode });
          fetchData();
        } catch (err: any) {
          toast.current?.show({ severity: 'error', summary: t('common.error', { defaultValue: 'Lỗi' }), detail: err?.response?.data?.message || err.message });
        }
      },
    });
  };

  const levelOptions = [
    { label: t('common.all', { defaultValue: 'Tất cả cấp' }), value: 'ALL' },
    { label: t('payment_point.level_brand', { defaultValue: 'Thương hiệu (BRAND)' }), value: PartnerHierarchyLevel.BRAND },
    { label: t('payment_point.level_branch', { defaultValue: 'Chi nhánh (BRANCH)' }), value: PartnerHierarchyLevel.BRANCH },
    { label: t('payment_point.level_point', { defaultValue: 'Điểm thanh toán (PAYMENT_POINT)' }), value: PartnerHierarchyLevel.PAYMENT_POINT },
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
            <Dropdown value={levelFilter} options={levelOptions} onChange={(e) => setLevelFilter(e.value)} className="w-13rem" />
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
          <DataTable<PaymentPointModel>
            value={items}
            paginator
            rows={15}
            stripedRows
            responsiveLayout="scroll"
            emptyMessage={t('payment_point.empty', { defaultValue: 'Chưa có chi nhánh hoặc điểm thanh toán nào trong liên minh này.' })}
          >
            <Column field="pointCode" header={t('payment_point.code', { defaultValue: 'Mã Điểm Thu' })} body={(r) => <span className="font-mono white-space-nowrap font-medium text-primary">{r.pointCode}</span>} style={{ minWidth: '11rem' }} />
            <Column field="pointName" header={t('payment_point.name', { defaultValue: 'Tên Chi nhánh / Quầy' })} style={{ minWidth: '15rem' }} />
            <Column field="hierarchyLevel" header={t('payment_point.level', { defaultValue: 'Phân Cấp' })} body={(r) => <Tag value={r.hierarchyLevel} severity={r.hierarchyLevel === PartnerHierarchyLevel.BRAND ? 'info' : r.hierarchyLevel === PartnerHierarchyLevel.BRANCH ? 'warning' : 'success'} />} style={{ minWidth: '10rem' }} />
            <Column field="partnerCode" header={t('payment_point.partner', { defaultValue: 'Đối Tác' })} body={(r) => <span className="font-mono white-space-nowrap text-xs">{r.partnerCode || '--'}</span>} style={{ minWidth: '10rem' }} />
            <Column field="city" header={t('payment_point.city', { defaultValue: 'Tỉnh / Thành' })} style={{ minWidth: '9rem' }} />
            <Column field="address" header={t('payment_point.address', { defaultValue: 'Địa Chỉ' })} style={{ minWidth: '15rem' }} />
            <Column field="qrMerchantRef" header={t('payment_point.qr_ref', { defaultValue: 'Mã QR Merchant' })} body={(r) => <span className="font-mono white-space-nowrap text-xs">{r.qrMerchantRef || '--'}</span>} style={{ minWidth: '11rem' }} />
            <Column field="status" header={t('common.status', { defaultValue: 'Trạng Thái' })} body={(r) => <Tag value={r.status || CommonStatus.ACTIVE} severity={r.status === CommonStatus.ACTIVE ? 'success' : 'secondary'} />} style={{ minWidth: '8rem', textAlign: 'center' }} />
            <Column
              header={t('common.action', { defaultValue: 'Thao Tác' })}
              body={(r) => (
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
            <label className="text-sm font-medium">{t('payment_point.code', { defaultValue: 'Mã Điểm Thu' })} *</label>
            <InputText value={formData.pointCode || ''} onChange={(e) => setFormData({ ...formData, pointCode: e.target.value.toUpperCase() })} className="font-mono" disabled={!!formData.id} />
          </div>
          <div className="col-12 md:col-6 field">
            <label className="text-sm font-medium">{t('payment_point.level', { defaultValue: 'Phân cấp' })}</label>
            <Dropdown
              value={formData.hierarchyLevel || PartnerHierarchyLevel.PAYMENT_POINT}
              options={levelOptions.filter((o) => o.value !== 'ALL')}
              onChange={(e) => setFormData({ ...formData, hierarchyLevel: e.value })}
              appendTo="self"
            />
          </div>
          <div className="col-12 field">
            <label className="text-sm font-medium">{t('payment_point.name', { defaultValue: 'Tên Chi nhánh / Quầy' })} *</label>
            <InputText value={formData.pointName || ''} onChange={(e) => setFormData({ ...formData, pointName: e.target.value })} />
          </div>
          <div className="col-12 md:col-6 field">
            <label className="text-sm font-medium">{t('payment_point.partner', { defaultValue: 'Mã Đối Tác' })}</label>
            <InputText value={formData.partnerCode || ''} onChange={(e) => setFormData({ ...formData, partnerCode: e.target.value.toUpperCase() })} className="font-mono" />
          </div>
          <div className="col-12 md:col-6 field">
            <label className="text-sm font-medium">{t('payment_point.qr_ref', { defaultValue: 'Mã QR Merchant' })}</label>
            <InputText value={formData.qrMerchantRef || ''} onChange={(e) => setFormData({ ...formData, qrMerchantRef: e.target.value })} className="font-mono" />
          </div>
          <div className="col-12 md:col-6 field">
            <label className="text-sm font-medium">{t('payment_point.city', { defaultValue: 'Tỉnh / Thành' })}</label>
            <InputText value={formData.city || ''} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
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
