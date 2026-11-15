import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { StandardPageHeader } from '@/components/StandardPageHeader';
import { UniversalFilterBar } from '@/components/UniversalFilterBar';
import { StandardRowActions } from '@/components/StandardRowActions';
import { exportToExcel } from '@/components/exportHelper';

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
    if (
      !formData.branchCode?.trim() ||
      !formData.branchName?.trim() ||
      !formData.paymentPointCode?.trim()
    ) {
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
        await LoyaltyService.updatePaymentPoint(
          formData.id,
          formData as NatcashPaymentPointModel,
          selectedTenant
        );
      } else {
        await LoyaltyService.createPaymentPoint(
          formData as NatcashPaymentPointModel,
          selectedTenant
        );
      }
      toast.current?.show({
        severity: 'success',
        summary: t('common.success'),
        detail: t('payment_point.saved'),
      });
      setShowDialog(false);
      fetchData();
    } catch (err: any) {
      toast.current?.show({
        severity: 'error',
        summary: t('common.error'),
        detail: err?.response?.data?.message || err.message,
      });
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
          toast.current?.show({
            severity: 'success',
            summary: t('common.success'),
            detail: item.paymentPointCode,
          });
          fetchData();
        } catch (err: any) {
          toast.current?.show({
            severity: 'error',
            summary: t('common.error'),
            detail: err?.response?.data?.message || err.message,
          });
        }
      },
    });
  };

  const filteredItems = useMemo(() => {
    if (!keyword.trim()) return items;
    const kw = keyword.toLowerCase();
    return items.filter(
      (item) =>
        item.branchCode?.toLowerCase().includes(kw) ||
        item.branchName?.toLowerCase().includes(kw) ||
        item.paymentPointCode?.toLowerCase().includes(kw) ||
        item.province?.toLowerCase().includes(kw) ||
        item.address?.toLowerCase().includes(kw) ||
        item.managerPhone?.toLowerCase().includes(kw)
    );
  }, [items, keyword]);

  const handleExport = () => {
    exportToExcel(
      filteredItems,
      [
        { header: t('payment_point.branch_code'), field: 'branchCode' },
        { header: t('payment_point.name'), field: 'branchName' },
        { header: t('payment_point.code'), field: 'paymentPointCode' },
        { header: t('payment_point.city'), field: 'province' },
        { header: t('payment_point.address'), field: 'address' },
        { header: t('payment_point.phone'), field: 'managerPhone' },
        { header: t('common.status'), field: 'status' },
      ],
      'diem_giao_dich_natcash'
    );
  };

  const statusFilterOptions = [
    { label: `${t('common.status')}: ${t('common.all')}`, value: 'ALL' },
    { label: CommonStatus.ACTIVE, value: CommonStatus.ACTIVE },
    { label: CommonStatus.INACTIVE, value: CommonStatus.INACTIVE },
  ];

  return (
    <div className="w-full">
      <Toast ref={toast} />
      <ConfirmDialog />
      <AppBreadcrumb items={[{ label: t('nav.payment_points') }]} />

      <StandardPageHeader
        title={t('payment_point.title')}
        subtitle={t('payment_point.subtitle')}
        primaryAction={{
          label: t('common.create', 'Thêm mới'),
          onClick: openNew,
        }}
        extraLeft={<TenantSelector value={selectedTenant} onChange={setSelectedTenant} />}
        onRefresh={fetchData}
        refreshLoading={loading}
      />

      <div className="card shadow-1 border-round surface-card p-4">
        <UniversalFilterBar
          keyword={keyword}
          onKeywordChange={setKeyword}
          searchPlaceholder={t('common.search')}
          primaryFilters={
            <Dropdown
              value={statusFilter}
              options={statusFilterOptions}
              onChange={(e) => setStatusFilter(e.value)}
              className="w-13rem"
            />
          }
          onReset={() => {
            setKeyword('');
            setStatusFilter('ALL');
          }}
          onExport={handleExport}
        />

        {loading ? (
          <div className="flex flex-column gap-2 mt-3">
            <Skeleton height="2.75rem" />
            <Skeleton height="2.75rem" />
            <Skeleton height="2.75rem" />
          </div>
        ) : (
          <DataTable<NatcashPaymentPointModel[]>
            value={filteredItems}
            paginator
            rows={15}
            stripedRows
            responsiveLayout="scroll"
            emptyMessage={t('payment_point.empty')}
            className="mt-3"
          >
            <Column
              header={t('common.order_number', 'STT')}
              body={(_, opt) => opt.rowIndex + 1}
              style={{ width: '4rem', textAlign: 'center' }}
            />
            <Column
              header={t('common.action', 'Thao tác')}
              body={(r: NatcashPaymentPointModel) => (
                <StandardRowActions
                  onEdit={() => {
                    setFormData(r);
                    setShowDialog(true);
                  }}
                  onDelete={() => handleDelete(r)}
                />
              )}
              style={{ width: '7rem', textAlign: 'center' }}
            />
            <Column
              field="paymentPointCode"
              header={t('payment_point.code')}
              body={(r: NatcashPaymentPointModel) => (
                <span className="font-bold font-mono text-900">{r.paymentPointCode}</span>
              )}
              style={{ minWidth: '11rem' }}
            />
            <Column
              field="branchCode"
              header={t('payment_point.branch_code')}
              body={(r: NatcashPaymentPointModel) => (
                <span className="font-mono text-900">{r.branchCode}</span>
              )}
              style={{ minWidth: '10rem' }}
            />
            <Column
              field="branchName"
              header={t('payment_point.name')}
              body={(r: NatcashPaymentPointModel) => (
                <span className="text-900">{r.branchName}</span>
              )}
              style={{ minWidth: '14rem' }}
            />
            <Column
              field="province"
              header={t('payment_point.city')}
              body={(r: NatcashPaymentPointModel) => (
                <span className="text-900">{r.province || '--'}</span>
              )}
              style={{ minWidth: '9rem' }}
            />
            <Column
              field="address"
              header={t('payment_point.address')}
              body={(r: NatcashPaymentPointModel) => (
                <span className="text-900">{r.address || '--'}</span>
              )}
              style={{ minWidth: '15rem' }}
            />
            <Column
              field="managerPhone"
              header={t('payment_point.phone')}
              body={(r: NatcashPaymentPointModel) => (
                <span className="text-900 font-mono text-xs">{r.managerPhone || '--'}</span>
              )}
              style={{ minWidth: '10rem' }}
            />
            <Column
              field="status"
              header={t('common.status')}
              body={(r: NatcashPaymentPointModel) => (
                <Tag
                  value={r.status || CommonStatus.ACTIVE}
                  severity={r.status === CommonStatus.ACTIVE ? 'success' : 'secondary'}
                />
              )}
              style={{ minWidth: '8rem', textAlign: 'center' }}
            />
          </DataTable>
        )}
      </div>

      <Dialog
        visible={showDialog}
        onHide={() => setShowDialog(false)}
        header={t('payment_point.dialog_title')}
        style={{ width: '38rem' }}
        modal
        className="p-fluid"
      >
        <div className="grid">
          <div className="col-12 md:col-6 field">
            <label className="text-sm font-medium">{t('payment_point.branch_code')} *</label>
            <InputText
              value={formData.branchCode || ''}
              onChange={(e) =>
                setFormData({ ...formData, branchCode: e.target.value.toUpperCase() })
              }
              className="font-mono"
            />
          </div>
          <div className="col-12 md:col-6 field">
            <label className="text-sm font-medium">{t('payment_point.name')} *</label>
            <InputText
              value={formData.branchName || ''}
              onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
            />
          </div>
          <div className="col-12 md:col-6 field">
            <label className="text-sm font-medium">{t('payment_point.code')} *</label>
            <InputText
              value={formData.paymentPointCode || ''}
              onChange={(e) =>
                setFormData({ ...formData, paymentPointCode: e.target.value.toUpperCase() })
              }
              className="font-mono"
            />
          </div>
          <div className="col-12 md:col-6 field">
            <label className="text-sm font-medium">{t('payment_point.phone')}</label>
            <InputText
              value={formData.managerPhone || ''}
              onChange={(e) => setFormData({ ...formData, managerPhone: e.target.value })}
              className="font-mono"
            />
          </div>
          <div className="col-12 md:col-6 field">
            <label className="text-sm font-medium">{t('payment_point.city')}</label>
            <InputText
              value={formData.province || ''}
              onChange={(e) => setFormData({ ...formData, province: e.target.value })}
            />
          </div>
          <div className="col-12 md:col-6 field">
            <label className="text-sm font-medium">{t('common.status')}</label>
            <Dropdown
              value={formData.status || CommonStatus.ACTIVE}
              options={[
                { label: CommonStatus.ACTIVE, value: CommonStatus.ACTIVE },
                { label: CommonStatus.INACTIVE, value: CommonStatus.INACTIVE },
              ]}
              onChange={(e) => setFormData({ ...formData, status: e.value })}
            />
          </div>
          <div className="col-12 field">
            <label className="text-sm font-medium">{t('payment_point.address')}</label>
            <InputText
              value={formData.address || ''}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>
        </div>
        <div className="flex justify-content-end gap-2 mt-3">
          <Button label={t('common.cancel')} outlined onClick={() => setShowDialog(false)} />
          <Button
            label={t('common.save')}
            icon="pi pi-check"
            onClick={handleSave}
            loading={submitting}
          />
        </div>
      </Dialog>
    </div>
  );
};

export default NatcashBranchesPaymentPointsPage;
