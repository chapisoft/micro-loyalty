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
        summary: t('common.warn'),
        detail: t('payment_point.required_fields'),
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
        summary: t('common.success'),
        detail: t('payment_point.saved'),
      });
      setShowDialog(false);
      fetchData();
    } catch (err: any) {
      toast.current?.show({ severity: 'error', summary: t('common.error'), detail: err?.response?.data?.message || err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (item: NatcashPaymentPointModel) => {
    if (!item.id) return;
    confirmDialog({
      message: `${t('common.confirm_delete')} ${item.paymentPointCode}?`,
      header: t('common.confirm'),
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      accept: async () => {
        try {
          await LoyaltyService.deletePaymentPoint(item.id!, selectedTenant);
          toast.current?.show({ severity: 'success', summary: t('common.success'), detail: item.paymentPointCode });
          fetchData();
        } catch (err: any) {
          toast.current?.show({ severity: 'error', summary: t('common.error'), detail: err?.response?.data?.message || err.message });
        }
      },
    });
  };

  const statusFilterOptions = [
    { label: t('common.all'), value: 'ALL' },
    { label: CommonStatus.ACTIVE, value: CommonStatus.ACTIVE },
    { label: CommonStatus.INACTIVE, value: CommonStatus.INACTIVE },
  ];

  return (
    <div>
      <Toast ref={toast} />
      <ConfirmDialog />
      <AppBreadcrumb items={[{ label: t('nav.payment_points') }]} />

      <div className="card shadow-1 border-round surface-card p-4">
        <div className="flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
          <div>
            <h4 className="m-0 text-primary font-semibold">
              {t('payment_point.title')}
            </h4>
            <p className="m-0 text-xs text-500 mt-1">
              {t('payment_point.subtitle')}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 align-items-center">
            <TenantSelector value={selectedTenant} onChange={setSelectedTenant} />
            <Dropdown value={statusFilter} options={statusFilterOptions} onChange={(e) => setStatusFilter(e.value)} className="w-13rem" />
            <span className="p-input-icon-left">
              <i className="pi pi-search" />
              <InputText value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder={t('common.search')} className="w-14rem p-inputtext-sm" />
            </span>
            <Button label={t('payment_point.add_new')} icon="pi pi-plus" severity="success" size="small" onClick={openNew} />
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
            emptyMessage={t('payment_point.empty')}
          >
            <Column field="branchCode" header={t('payment_point.branch_code')} body={(r: NatcashPaymentPointModel) => <span className="font-mono white-space-nowrap font-medium text-primary">{r.branchCode}</span>} style={{ minWidth: '10rem' }} />
            <Column field="branchName" header={t('payment_point.name')} style={{ minWidth: '14rem' }} />
            <Column field="paymentPointCode" header={t('payment_point.code')} body={(r: NatcashPaymentPointModel) => <span className="font-mono white-space-nowrap">{r.paymentPointCode}</span>} style={{ minWidth: '11rem' }} />
            <Column field="province" header={t('payment_point.city')} style={{ minWidth: '9rem' }} />
            <Column field="address" header={t('payment_point.address')} style={{ minWidth: '15rem' }} />
            <Column field="managerPhone" header={t('payment_point.phone')} body={(r: NatcashPaymentPointModel) => <span className="font-mono white-space-nowrap text-xs">{r.managerPhone || '--'}</span>} style={{ minWidth: '10rem' }} />
            <Column field="status" header={t('common.status')} body={(r: NatcashPaymentPointModel) => <Tag value={r.status || CommonStatus.ACTIVE} severity={r.status === CommonStatus.ACTIVE ? 'success' : 'secondary'} />} style={{ minWidth: '8rem', textAlign: 'center' }} />
            <Column
              header={t('common.action')}
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
        header={formData.id ? t('payment_point.edit_title') : t('payment_point.create_title')}
        style={{ width: '40rem' }}
        modal
        className="p-fluid"
      >
        <div className="grid">
          <div className="col-12 md:col-6 field">
            <label className="text-sm font-medium">{t('payment_point.branch_code')} *</label>
            <InputText value={formData.branchCode || ''} onChange={(e) => setFormData({ ...formData, branchCode: e.target.value.toUpperCase() })} className="font-mono" disabled={!!formData.id} />
          </div>
          <div className="col-12 md:col-6 field">
            <label className="text-sm font-medium">{t('payment_point.code')} *</label>
            <InputText value={formData.paymentPointCode || ''} onChange={(e) => setFormData({ ...formData, paymentPointCode: e.target.value.toUpperCase() })} className="font-mono" disabled={!!formData.id} />
          </div>
          <div className="col-12 field">
            <label className="text-sm font-medium">{t('payment_point.name')} *</label>
            <InputText value={formData.branchName || ''} onChange={(e) => setFormData({ ...formData, branchName: e.target.value })} />
          </div>
          <div className="col-12 md:col-6 field">
            <label className="text-sm font-medium">{t('payment_point.phone')}</label>
            <InputText value={formData.managerPhone || ''} onChange={(e) => setFormData({ ...formData, managerPhone: e.target.value })} className="font-mono" />
          </div>
          <div className="col-12 md:col-6 field">
            <label className="text-sm font-medium">{t('payment_point.city')}</label>
            <InputText value={formData.province || ''} onChange={(e) => setFormData({ ...formData, province: e.target.value })} />
          </div>
          <div className="col-12 md:col-6 field">
            <label className="text-sm font-medium">{t('common.status')}</label>
            <Dropdown
              value={formData.status || CommonStatus.ACTIVE}
              options={[{ label: CommonStatus.ACTIVE, value: CommonStatus.ACTIVE }, { label: CommonStatus.INACTIVE, value: CommonStatus.INACTIVE }]}
              onChange={(e) => setFormData({ ...formData, status: e.value })}
              appendTo="self"
            />
          </div>
          <div className="col-12 field">
            <label className="text-sm font-medium">{t('payment_point.address')}</label>
            <InputText value={formData.address || ''} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
          </div>
        </div>
        <div className="flex justify-content-end gap-2 mt-3">
          <Button label={t('common.cancel')} icon="pi pi-times" outlined onClick={() => setShowDialog(false)} />
          <Button label={t('common.save')} icon="pi pi-check" onClick={handleSave} loading={submitting} />
        </div>
      </Dialog>
    </div>
  );
};

export default NatcashBranchesPaymentPointsPage;
