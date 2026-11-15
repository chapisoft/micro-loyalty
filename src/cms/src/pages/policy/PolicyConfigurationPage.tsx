import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Tag } from 'primereact/tag';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { useTranslation } from 'react-i18next';
import { StandardPageHeader } from '@/components/StandardPageHeader';
import { UniversalFilterBar } from '@/components/UniversalFilterBar';
import { StandardRowActions, RowActionItem } from '@/components/StandardRowActions';
import { exportToExcel } from '@/components/exportHelper';
import { TenantSelector } from '@/components/TenantSelector';
import { CommonStatus } from '@/models';
import { LoyaltyService } from '@/service/loyalty.service';

export interface PolicyRule {
  id: number;
  partnerId?: number;
  partnerCode: string;
  partnerName: string;
  earnRate: number;
  maxBurnPercentage: number;
  exchangeRate: number;
  commissionRatePercent?: number;
  fixedFeePerTx?: number;
  maxBurnPointsPerTx?: number;
  settlementCreditLimit?: number;
  settlementCycle?: string;
  status: CommonStatus;
  updatedAt: string;
  description?: string;
}

export interface PartnerOptionItem {
  id: number;
  partnerCode: string;
  partnerName: string;
  partnerType?: string;
  status: string | number;
}

export const PolicyConfigurationPage: React.FC = () => {
  const { t } = useTranslation();
  const toast = useRef<Toast>(null);
  const [selectedTenant, setSelectedTenant] = useState<string>(
    () => localStorage.getItem('selected_tenant_id') || 'TENANT_NATCASH'
  );
  const [policies, setPolicies] = useState<PolicyRule[]>([]);
  const [partners, setPartners] = useState<PartnerOptionItem[]>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState<Partial<PolicyRule>>({});
  const [isEdit, setIsEdit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  // 1. Tải danh sách Chính sách theo Tenant
  const fetchPolicies = useCallback(async (tenantId: string) => {
    setLoading(true);
    try {
      const data = await LoyaltyService.getPolicies(tenantId);
      if (data && data.length > 0) {
        setPolicies(
          data.map((item) => ({
            id: item.id,
            partnerId: item.partnerId,
            partnerCode: item.partnerCode || '',
            partnerName: item.partnerName || '',
            earnRate: item.earnRate ?? 0,
            maxBurnPercentage: item.maxBurnPercentage ?? item.maxBurnPercent ?? 0,
            exchangeRate: item.exchangeRate ?? 0,
            commissionRatePercent: item.commissionRatePercent,
            fixedFeePerTx: item.fixedFeePerTx,
            maxBurnPointsPerTx: item.maxBurnPointsPerTx,
            settlementCreditLimit: item.settlementCreditLimit,
            settlementCycle: item.settlementCycle || '',
            status: (item.status as CommonStatus) || CommonStatus.ACTIVE,
            updatedAt: item.effectiveDate || '--',
            description: item.description || '',
          }))
        );
      } else {
        setPolicies([]);
      }
    } catch (e) {
      console.error('[fetchPolicies] Error:', e);
      setPolicies([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  // 2. Tải danh sách Đối tác theo Tenant
  const fetchPartners = useCallback(async (tenantId: string) => {
    try {
      const data = await LoyaltyService.getPartners(tenantId);
      if (Array.isArray(data) && data.length > 0) {
        setPartners(data);
      } else {
        setPartners([]);
      }
    } catch (e) {
      console.error('[fetchPartners] Error:', e);
      setPartners([]);
    }
  }, []);

  // 3. Tải dữ liệu ban đầu và khi đổi Tenant
  useEffect(() => {
    fetchPolicies(selectedTenant);
    fetchPartners(selectedTenant);
  }, [selectedTenant, fetchPolicies, fetchPartners]);

  const handleTenantChange = (newTenant: string) => {
    setSelectedTenant(newTenant);
    localStorage.setItem('selected_tenant_id', newTenant);
  };

  // 4. Danh sách ID các Đối Tác đã được cấu hình chính sách
  const configuredPartnerIds = useMemo(() => {
    return new Set(policies.map((p) => p.partnerId).filter(Boolean));
  }, [policies]);

  // 5. Danh sách Options cho Dropdown Đối Tác
  const partnerDropdownOptions = useMemo(() => {
    return partners.map((p) => {
      const isConfigured = configuredPartnerIds.has(p.id);
      return {
        label: `${p.partnerName} (${p.partnerCode})`,
        value: p.id,
        partner: p,
        isConfigured,
      };
    });
  }, [partners, configuredPartnerIds]);

  const burnOptions = useMemo(() => [
    { label: `20% (${t('policy.burn_standard')})`, value: 20 },
    { label: `30% (${t('policy.burn_popular')})`, value: 30 },
    { label: `50% (${t('policy.burn_attractive')})`, value: 50 },
    { label: `100% (${t('policy.burn_full')})`, value: 100 },
  ], [t]);

  const cycleOptions = useMemo(() => [
    { label: t('clearing.cycle_daily'), value: 'DAILY' },
    { label: t('clearing.cycle_weekly'), value: 'WEEKLY' },
    { label: t('clearing.cycle_monthly'), value: 'MONTHLY' },
  ], [t]);

  const statusOptions = useMemo(() => [
    { label: t('common.active'), value: 'ACTIVE' },
    { label: t('common.inactive'), value: 'INACTIVE' },
  ], [t]);

  const partnerOptionTemplate = (option: any) => {
    if (!option) return null;
    const p = option.partner || option;
    const isConfigured = option.isConfigured;
    return (
      <div className="flex align-items-center justify-content-between w-full py-1 gap-2">
        <div className="flex align-items-center gap-2">
          <i className="pi pi-building text-primary font-medium" />
          <span className="font-medium text-900">{p.partnerName}</span>
        </div>
        <div className="flex align-items-center gap-1">
          {isConfigured && !isEdit && (
            <Tag value={t('policy.already_has_policy')} severity="warning" className="text-xs" />
          )}
          <Tag value={p.partnerCode} severity="info" className="text-xs font-mono" />
        </div>
      </div>
    );
  };

  const selectedPartnerValueTemplate = (option: any, props: any) => {
    if (option) {
      const p = option.partner || option;
      return (
        <div className="flex align-items-center gap-2">
          <i className="pi pi-building text-primary font-medium" />
          <span className="font-semibold text-900">{p.partnerName || option.label}</span>
          {p.partnerCode && <Tag value={p.partnerCode} severity="info" className="text-xs font-mono ml-1" />}
        </div>
      );
    }
    return <span>{props.placeholder}</span>;
  };

  const openNew = () => {
    setFormData({
      status: CommonStatus.ACTIVE,
      description: '',
    });
    setIsEdit(false);
    setShowDialog(true);
  };

  const editItem = (item: PolicyRule) => {
    setFormData({ ...item });
    setIsEdit(true);
    setShowDialog(true);
  };

  const deleteItem = (item: PolicyRule) => {
    confirmDialog({
      message: t('policy.delete_confirm_msg', {
        name: item.partnerName
      }),
      header: t('policy.delete_confirm_title'),
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      acceptLabel: t('common.delete'),
      rejectLabel: t('common.cancel'),
      accept: async () => {
        setLoading(true);
        try {
          await LoyaltyService.deletePolicy(item.id, selectedTenant);
          toast.current?.show({
            severity: 'success',
            summary: t('common.success'),
            detail: t('policy.delete_success'),
            life: 3000,
          });
          await fetchPolicies(selectedTenant);
        } catch (e: any) {
          console.error('[deletePolicy] Error:', e);
          toast.current?.show({
            severity: 'error',
            summary: t('common.error'),
            detail: e?.message || t('policy.delete_failed'),
            life: 4000,
          });
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const saveItem = async () => {
    if (!formData.partnerId && !isEdit) {
      toast.current?.show({
        severity: 'warn',
        summary: t('common.warning'),
        detail: t('policy.partner_required'),
        life: 3000,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEdit && formData.id) {
        await LoyaltyService.updatePolicy(
          formData.id,
          {
            partnerId: formData.partnerId,
            partnerCode: formData.partnerCode,
            partnerName: formData.partnerName,
            earnRatePercent: formData.earnRate,
            maxBurnPercentage: formData.maxBurnPercentage,
            exchangeRate: formData.exchangeRate,
            commissionRatePercent: formData.commissionRatePercent,
            fixedFeePerTx: formData.fixedFeePerTx,
            maxBurnPointsPerTx: formData.maxBurnPointsPerTx,
            settlementCreditLimit: formData.settlementCreditLimit,
            settlementCycle: formData.settlementCycle,
            status: formData.status,
            description: formData.description,
          },
          selectedTenant
        );
        toast.current?.show({
          severity: 'success',
          summary: t('common.success'),
          detail: t('policy.update_success'),
          life: 3000,
        });
      } else {
        await LoyaltyService.createPolicy(
          {
            partnerId: formData.partnerId,
            partnerCode: formData.partnerCode || '',
            partnerName: formData.partnerName || '',
            earnRatePercent: formData.earnRate,
            maxBurnPercentage: formData.maxBurnPercentage,
            exchangeRate: formData.exchangeRate,
            commissionRatePercent: formData.commissionRatePercent,
            fixedFeePerTx: formData.fixedFeePerTx,
            maxBurnPointsPerTx: formData.maxBurnPointsPerTx,
            settlementCreditLimit: formData.settlementCreditLimit,
            settlementCycle: formData.settlementCycle,
            status: formData.status || CommonStatus.ACTIVE,
            description: formData.description || '',
          },
          selectedTenant
        );
        toast.current?.show({
          severity: 'success',
          summary: t('common.success'),
          detail: t('policy.create_success'),
          life: 3000,
        });
      }
      setShowDialog(false);
      await fetchPolicies(selectedTenant);
    } catch (e: any) {
      console.error('[savePolicy] Error:', e);
      toast.current?.show({
        severity: 'error',
        summary: t('common.error'),
        detail: e?.message || t('policy.save_failed'),
        life: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderRowActions = (rowData: PolicyRule) => {
    const actions: RowActionItem[] = [
      {
        id: 'edit',
        label: t('common.edit', 'Sửa'),
        icon: 'pi pi-pencil',
        severity: 'secondary',
        onClick: () => editItem(rowData),
      },
      {
        id: 'delete',
        label: t('common.delete', 'Xóa'),
        icon: 'pi pi-trash',
        danger: true,
        onClick: () => deleteItem(rowData),
      },
    ];
    return <StandardRowActions actions={actions} maxInline={3} />;
  };

  const statusTemplate = (rowData: PolicyRule) => {
    return rowData.status === CommonStatus.ACTIVE ? (
      <Tag severity="success" value={t('common.active', 'Hoạt động')} rounded={false} />
    ) : (
      <Tag severity="warning" value={t('common.inactive', 'Ngừng hoạt động')} rounded={false} />
    );
  };

  const handleExportExcel = () => {
    exportToExcel(
      [
        { header: 'STT' },
        { header: 'Mã đối tác', field: 'partnerCode' },
        { header: 'Tên đối tác', field: 'partnerName' },
        { header: 'Tỷ giá quy đổi', getValue: (r: PolicyRule) => `${r.exchangeRate} HTG` },
        { header: 'Tiêu tối đa', getValue: (r: PolicyRule) => `${r.maxBurnPercentage}%` },
        {
          header: 'Phí MDR',
          getValue: (r: PolicyRule) =>
            r.commissionRatePercent != null ? `${r.commissionRatePercent}%` : '--',
        },
        {
          header: 'Điểm tiêu tối đa/GD',
          getValue: (r: PolicyRule) =>
            r.maxBurnPointsPerTx != null ? r.maxBurnPointsPerTx.toLocaleString() : '--',
        },
        {
          header: 'Chu kỳ quyết toán',
          getValue: (r: PolicyRule) =>
            r.settlementCycle === 'DAILY' ? 'T+1' : r.settlementCycle === 'WEEKLY' ? 'W+1' : 'M+1',
        },
        {
          header: 'Trạng thái',
          getValue: (r: PolicyRule) =>
            r.status === CommonStatus.ACTIVE ? 'Hoạt động' : 'Ngừng hoạt động',
        },
        { header: 'Ngày cập nhật', field: 'updatedAt' },
      ],
      policies,
      'Chinh_sach_tich_tieu_diem'
    );
  };

  return (
    <div className="w-full flex flex-column gap-2">
      <Toast ref={toast} position="top-right" />
      <ConfirmDialog />

      <StandardPageHeader
        breadcrumbs={[
          { label: t('nav.loyalty_policies', 'Chính sách Loyalty') },
          { label: t('nav.policies', 'Chính sách Điểm') },
        ]}
        title={t('policy.management_title', 'Chính sách Tích & Tiêu Điểm')}
        subtitle="Quản lý tỷ lệ tích/tiêu điểm, tỷ giá quy đổi, hạn mức và chu kỳ quyết toán liên minh"
        actions={
          <Button
            label={t('common.add_new', 'Thêm mới')}
            icon="pi pi-plus"
            size="small"
            onClick={openNew}
            className="p-button-sm font-semibold"
          />
        }
      />

      <UniversalFilterBar
        searchValue={globalFilter}
        onSearchChange={setGlobalFilter}
        searchPlaceholder={t('common.search', 'Tìm kiếm...')}
        primaryFilters={
          <TenantSelector value={selectedTenant} onChange={handleTenantChange} />
        }
        onReset={() => setGlobalFilter('')}
        onRefresh={() => fetchPolicies(selectedTenant)}
        isLoading={loading}
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
          value={policies}
          loading={loading}
          globalFilter={globalFilter}
          dataKey="id"
          paginator
          rows={10}
          rowsPerPageOptions={[10, 20, 50]}
          emptyMessage={t('common.no_data', 'Không có dữ liệu hiển thị')}
          className="p-datatable-sm p-datatable-striped"
          responsiveLayout="scroll"
        >
          <Column selectionMode="multiple" exportable={false} style={{ width: '3rem' }} />
          <Column
            header={t('common.stt', 'STT')}
            body={(_, { rowIndex }) => rowIndex + 1}
            style={{ width: '3.5rem', textAlign: 'center' }}
          />
          <Column
            header={t('common.actions', 'Thao tác')}
            body={renderRowActions}
            exportable={false}
            style={{ width: '7rem', textAlign: 'left' }}
          />
          <Column
            field="partnerCode"
            header={t('policy.partner_code', 'Mã đối tác')}
            body={(row: PolicyRule) => (
              <span className="font-mono font-bold text-900" style={{ fontSize: '13px' }}>
                {row.partnerCode}
              </span>
            )}
            sortable
            style={{ minWidth: '10rem' }}
          />
          <Column
            field="partnerName"
            header={t('policy.partner_name', 'Tên đối tác')}
            body={(row: PolicyRule) => (
              <span className="font-normal text-900">{row.partnerName}</span>
            )}
            sortable
            style={{ minWidth: '13rem' }}
          />
          <Column
            field="exchangeRate"
            header={t('policy.exchange_rate', 'Tỷ giá')}
            body={(row: PolicyRule) => (
              <span className="font-normal text-900">{row.exchangeRate} HTG</span>
            )}
            sortable
            style={{ minWidth: '7.5rem', textAlign: 'right' }}
          />
          <Column
            field="maxBurnPercentage"
            header={t('policy.max_burn', 'Tiêu tối đa')}
            body={(row: PolicyRule) => (
              <span className="font-normal text-900">{row.maxBurnPercentage}%</span>
            )}
            sortable
            style={{ minWidth: '8rem', textAlign: 'right' }}
          />
          <Column
            field="commissionRatePercent"
            header={t('policy.mdr_rate', 'Phí MDR')}
            body={(row: PolicyRule) => (
              <span className="font-normal text-900">
                {row.commissionRatePercent != null ? `${row.commissionRatePercent}%` : '--'}
              </span>
            )}
            sortable
            style={{ minWidth: '7.5rem', textAlign: 'right' }}
          />
          <Column
            field="maxBurnPointsPerTx"
            header={t('policy.max_burn_points', 'Điểm tối đa/GD')}
            body={(row: PolicyRule) => (
              <span className="font-normal text-900">
                {row.maxBurnPointsPerTx != null ? row.maxBurnPointsPerTx.toLocaleString() : '--'}
              </span>
            )}
            sortable
            style={{ minWidth: '9rem', textAlign: 'right' }}
          />
          <Column
            field="settlementCycle"
            header={t('policy.settlement_cycle', 'Chu kỳ')}
            body={(row: PolicyRule) => {
              const cycle = row.settlementCycle || 'DAILY';
              return (
                <span className="font-normal text-900">
                  {cycle === 'DAILY' ? 'T+1' : cycle === 'WEEKLY' ? 'W+1' : 'M+1'}
                </span>
              );
            }}
            sortable
            style={{ minWidth: '7rem', textAlign: 'center' }}
          />
          <Column
            field="status"
            header={t('common.status', 'Trạng thái')}
            body={statusTemplate}
            sortable
            style={{ minWidth: '8rem', textAlign: 'center' }}
          />
          <Column
            field="updatedAt"
            header={t('common.updated_at', 'Cập nhật')}
            sortable
            style={{ minWidth: '9rem', textAlign: 'center' }}
          />
        </DataTable>
      </div>

      <Dialog
        visible={showDialog}
        style={{ width: '650px' }}
        header={isEdit ? t('policy.edit_title') : t('policy.create_title')}
        modal
        className="p-fluid"
        footer={
          <div className="flex justify-content-end gap-2">
            <Button label={t('common.cancel')} icon="pi pi-times" outlined onClick={() => setShowDialog(false)} />
            <Button label={t('common.save')} icon="pi pi-check" severity="success" onClick={saveItem} loading={isSubmitting} />
          </div>
        }
        onHide={() => setShowDialog(false)}
      >
        <div className="field mb-3">
          <label htmlFor="partnerSelect" className="font-bold text-900">
            {t('policy.select_partner_label')} <span className="text-red-500">*</span>
          </label>
          <Dropdown
            id="partnerSelect"
            value={formData.partnerId}
            options={partnerDropdownOptions}
            onChange={(e) => {
              const selected = partners.find((p) => p.id === e.value);
              setFormData({
                ...formData,
                partnerId: e.value,
                partnerCode: selected ? selected.partnerCode : '',
                partnerName: selected ? selected.partnerName : '',
              });
            }}
            optionLabel="label"
            optionValue="value"
            itemTemplate={partnerOptionTemplate}
            valueTemplate={selectedPartnerValueTemplate}
            placeholder={t('policy.select_partner_placeholder')}
            disabled={isEdit}
            filter
            className="w-full"
            appendTo="self"
          />
        </div>

        <div className="grid">
          <div className="col-12 md:col-6 field mb-3">
            <label htmlFor="exchangeRate" className="font-bold text-900">
              {t('policy.exchange_rate')}
            </label>
            <InputNumber
              id="exchangeRate"
              value={formData.exchangeRate ?? null}
              onValueChange={(e) => setFormData({ ...formData, exchangeRate: e.value ?? undefined })}
              mode="decimal"
              minFractionDigits={2}
              maxFractionDigits={4}
              min={0.01}
              suffix=" HTG"
            />
          </div>

          <div className="col-12 md:col-6 field mb-3">
            <label htmlFor="maxBurnPercentage" className="font-bold text-900">
              {t('policy.max_burn_percentage')}
            </label>
            <Dropdown
              id="maxBurnPercentage"
              value={formData.maxBurnPercentage}
              options={burnOptions}
              onChange={(e) => setFormData({ ...formData, maxBurnPercentage: e.value })}
              placeholder={t('policy.select_burn')}
              appendTo="self"
            />
          </div>
        </div>

        <div className="grid">
          <div className="col-12 md:col-6 field mb-3">
            <label htmlFor="commissionRate" className="font-bold text-900">
              {t('policy.mdr_rate_label')}
            </label>
            <InputNumber
              id="commissionRate"
              value={formData.commissionRatePercent ?? null}
              onValueChange={(e) => setFormData({ ...formData, commissionRatePercent: e.value ?? undefined })}
              mode="decimal"
              minFractionDigits={1}
              maxFractionDigits={2}
              min={0}
              max={50}
              suffix=" %"
            />
          </div>

          <div className="col-12 md:col-6 field mb-3">
            <label htmlFor="fixedFee" className="font-bold text-900">
              {t('policy.fixed_fee_label')}
            </label>
            <InputNumber
              id="fixedFee"
              value={formData.fixedFeePerTx ?? null}
              onValueChange={(e) => setFormData({ ...formData, fixedFeePerTx: e.value ?? undefined })}
              mode="decimal"
              minFractionDigits={2}
              min={0}
              suffix=" HTG"
            />
          </div>
        </div>

        <div className="grid">
          <div className="col-12 md:col-6 field mb-3">
            <label htmlFor="maxBurnPerTx" className="font-bold text-900">
              {t('policy.max_burn_points_label')}
            </label>
            <InputNumber
              id="maxBurnPerTx"
              value={formData.maxBurnPointsPerTx ?? null}
              onValueChange={(e) => setFormData({ ...formData, maxBurnPointsPerTx: e.value ?? undefined })}
              mode="decimal"
              min={10}
              suffix={` ${t('common.points_unit')}`}
            />
          </div>

          <div className="col-12 md:col-6 field mb-3">
            <label htmlFor="settlementCycle" className="font-bold text-900">
              {t('policy.settlement_cycle_label')}
            </label>
            <Dropdown
              id="settlementCycle"
              value={formData.settlementCycle}
              options={cycleOptions}
              onChange={(e) => setFormData({ ...formData, settlementCycle: e.value })}
              appendTo="self"
            />
          </div>
        </div>

        <div className="field mb-3">
          <label htmlFor="status" className="font-bold text-900">
            {t('common.status')}
          </label>
          <Dropdown
            id="status"
            value={formData.status}
            options={statusOptions}
            onChange={(e) => setFormData({ ...formData, status: e.value })}
            appendTo="self"
          />
        </div>
      </Dialog>
    </div>
  );
};

export default PolicyConfigurationPage;
