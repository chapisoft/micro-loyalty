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
import { AppBreadcrumb } from 'components';
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
  const [selectedPolicies, setSelectedPolicies] = useState<PolicyRule[]>([]);
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
            partnerCode: item.partnerCode || 'DELIMART',
            partnerName: item.partnerName || 'Siêu Thị Delimart',
            earnRate: item.earnRate || 1.0,
            maxBurnPercentage: item.maxBurnPercentage || item.maxBurnPercent || 50,
            exchangeRate: item.exchangeRate || 1.0,
            status: (item.status as CommonStatus) || CommonStatus.ACTIVE,
            updatedAt: item.effectiveDate || new Date().toLocaleDateString('vi-VN'),
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
  }, []);

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
            <Tag value="Đã có chính sách" severity="warning" className="text-xs" />
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
    // Ưu tiên chọn Đối tác đầu tiên chưa có chính sách
    const availablePartner =
      partners.find((p) => !configuredPartnerIds.has(p.id)) || (partners.length > 0 ? partners[0] : null);

    setFormData({
      partnerId: availablePartner ? availablePartner.id : undefined,
      partnerCode: availablePartner ? availablePartner.partnerCode : '',
      partnerName: availablePartner ? availablePartner.partnerName : '',
      earnRate: 1.0,
      maxBurnPercentage: 50,
      exchangeRate: 1.0,
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
        name: item.partnerName,
        defaultValue: `Bạn có chắc chắn muốn xóa chính sách của đối tác "${item.partnerName}"? Thao tác này sẽ ngừng việc tích/tiêu điểm của đối tác tại máy POS.`,
      }),
      header: t('policy.delete_confirm_title', { defaultValue: 'Xác nhận Xóa Chính Sách' }),
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      acceptLabel: t('common.delete', { defaultValue: 'Xóa' }),
      rejectLabel: t('common.cancel', { defaultValue: 'Hủy' }),
      accept: async () => {
        setLoading(true);
        try {
          await LoyaltyService.deletePolicy(item.id, selectedTenant);
          toast.current?.show({
            severity: 'success',
            summary: t('common.success', { defaultValue: 'Thành công' }),
            detail: t('policy.delete_success', { defaultValue: 'Đã xóa chính sách thành công!' }),
            life: 3000,
          });
          await fetchPolicies(selectedTenant);
        } catch (e: any) {
          console.error('[deletePolicy] Error:', e);
          toast.current?.show({
            severity: 'error',
            summary: t('common.error', { defaultValue: 'Lỗi' }),
            detail: e?.message || 'Không thể xóa chính sách',
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
        summary: t('common.warning', { defaultValue: 'Cảnh báo' }),
        detail: t('policy.partner_required', { defaultValue: 'Vui lòng chọn Đối tác liên minh' }),
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
            status: formData.status,
            description: formData.description,
          },
          selectedTenant
        );
        toast.current?.show({
          severity: 'success',
          summary: t('common.success', { defaultValue: 'Thành công' }),
          detail: t('policy.update_success', { defaultValue: 'Cập nhật chính sách thành công!' }),
          life: 3000,
        });
      } else {
        await LoyaltyService.createPolicy(
          {
            partnerId: formData.partnerId,
            partnerCode: formData.partnerCode || 'NEW_PARTNER',
            partnerName: formData.partnerName || 'Đối Tác Mới',
            earnRatePercent: formData.earnRate || 1.0,
            maxBurnPercentage: formData.maxBurnPercentage || 50,
            exchangeRate: formData.exchangeRate || 1.0,
            status: formData.status || CommonStatus.ACTIVE,
            description: formData.description || '',
          },
          selectedTenant
        );
        toast.current?.show({
          severity: 'success',
          summary: t('common.success', { defaultValue: 'Thành công' }),
          detail: t('policy.create_success', { defaultValue: 'Thêm mới chính sách thành công!' }),
          life: 3000,
        });
      }
      setShowDialog(false);
      await fetchPolicies(selectedTenant);
    } catch (e: any) {
      console.error('[savePolicy] Error:', e);
      toast.current?.show({
        severity: 'error',
        summary: t('common.error', { defaultValue: 'Lỗi' }),
        detail: e?.message || 'Không thể lưu chính sách vào hệ thống',
        life: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const actionTemplate = (rowData: PolicyRule) => (
    <div className="flex gap-2 justify-content-center">
      <Button
        icon="pi pi-pencil"
        rounded
        outlined
        severity="warning"
        size="small"
        onClick={() => editItem(rowData)}
        tooltip={t('common.edit', { defaultValue: 'Sửa' })}
      />
      <Button
        icon="pi pi-trash"
        rounded
        outlined
        severity="danger"
        size="small"
        onClick={() => deleteItem(rowData)}
        tooltip={t('common.delete', { defaultValue: 'Xóa' })}
      />
    </div>
  );

  const statusTemplate = (rowData: PolicyRule) => {
    return rowData.status === CommonStatus.ACTIVE ? (
      <Tag severity="success" value={t('common.active', { defaultValue: 'Đang áp dụng' })} />
    ) : (
      <Tag severity="danger" value={t('common.inactive', { defaultValue: 'Tạm dừng' })} />
    );
  };

  const burnPercentageTemplate = (rowData: PolicyRule) => (
    <span className="text-primary font-medium font-mono">
      {rowData.maxBurnPercentage}% {t('policy.of_bill', { defaultValue: 'hóa đơn' })}
    </span>
  );

  const statusOptions = [
    { label: t('common.active', { defaultValue: 'Đang áp dụng' }), value: CommonStatus.ACTIVE },
    { label: t('common.inactive', { defaultValue: 'Tạm dừng' }), value: CommonStatus.INACTIVE },
  ];

  const burnOptions = [
    { label: '30% ' + t('policy.of_bill', { defaultValue: 'hóa đơn' }), value: 30 },
    { label: '50% ' + t('policy.of_bill', { defaultValue: 'hóa đơn' }), value: 50 },
    { label: '70% ' + t('policy.of_bill', { defaultValue: 'hóa đơn' }), value: 70 },
    { label: '100% ' + t('policy.of_bill', { defaultValue: 'hóa đơn' }), value: 100 },
  ];

  const header = (
    <div className="flex flex-column md:flex-row md:align-items-center md:justify-content-between gap-3">
      <div>
        <h4 className="m-0 text-primary font-bold text-xl">
          {t('policy.management_title', { defaultValue: 'Cấu hình Chính sách Tích & Tiêu Điểm' })}
        </h4>
        <p className="text-500 text-xs mt-1 mb-0">
          Thiết lập tỷ lệ tích lũy điểm, tỷ giá quy đổi và hạn mức khấu trừ tối đa tại các điểm bán đối tác.
        </p>
      </div>

      <div className="flex flex-wrap align-items-center gap-2">
        <TenantSelector value={selectedTenant} onChange={handleTenantChange} />
        
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            type="search"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder={t('common.search', { defaultValue: 'Tìm kiếm...' })}
            className="p-inputtext-sm"
          />
        </span>

        <Button
          label={t('policy.add_new', { defaultValue: 'Thêm Chính sách' })}
          icon="pi pi-plus"
          severity="success"
          onClick={openNew}
          className="p-button-sm font-semibold"
        />
        <Button
          icon="pi pi-refresh"
          outlined
          onClick={() => {
            fetchPolicies(selectedTenant);
            fetchPartners(selectedTenant);
          }}
          loading={loading}
          className="p-button-sm"
        />
      </div>
    </div>
  );

  return (
    <div>
      <Toast ref={toast} position="top-right" />
      <ConfirmDialog />
      
      <AppBreadcrumb items={[{ label: t('nav.policies', { defaultValue: 'Chính sách Điểm' }) }]} />
      
      <div className="card shadow-1 border-round-xl surface-card p-4">
        <DataTable<any>
          value={policies}
          selection={selectedPolicies}
          onSelectionChange={(e) => setSelectedPolicies(e.value as PolicyRule[])}
          dataKey="id"
          paginator
          rows={10}
          loading={loading}
          globalFilter={globalFilter}
          rowsPerPageOptions={[5, 10, 25]}
          header={header}
          responsiveLayout="scroll"
          emptyMessage={t('common.no_data', { defaultValue: 'Chưa có chính sách nào cho liên minh này' })}
        >
          <Column selectionMode="multiple" exportable={false} style={{ width: '3rem' }} />
          <Column field="id" header="#" style={{ width: '3.5rem', textAlign: 'center' }} />
          <Column
            field="partnerCode"
            header={t('policy.partner_code', { defaultValue: 'Mã Đối Tác' })}
            sortable
            body={(row: PolicyRule) => <Tag value={row.partnerCode} severity="info" className="font-mono text-xs" />}
            style={{ minWidth: '9rem' }}
          />
          <Column
            field="partnerName"
            header={t('policy.partner_name', { defaultValue: 'Tên Đối Tác' })}
            sortable
            body={(row: PolicyRule) => <span className="font-medium text-900">{row.partnerName}</span>}
            style={{ minWidth: '14rem' }}
          />
          <Column
            field="earnRate"
            header={
              <span title={t('policy.earn_rate_tooltip', { defaultValue: 'Tỷ lệ phần trăm tích điểm trên giá trị đơn hàng' })}>
                {t('policy.earn_rate', { defaultValue: 'Tỷ Lệ Tích' })}
              </span>
            }
            body={(row: PolicyRule) => <span className="font-mono">{row.earnRate}%</span>}
            sortable
            style={{ minWidth: '8rem', textAlign: 'center' }}
          />
          <Column
            field="maxBurnPercentage"
            header={
              <span title={t('policy.max_burn_tooltip', { defaultValue: 'Tỷ lệ khấu trừ điểm tối đa trên tổng giá trị hóa đơn' })}>
                {t('policy.max_burn', { defaultValue: 'Khấu Trừ Tối Đa' })}
              </span>
            }
            body={burnPercentageTemplate}
            sortable
            style={{ minWidth: '11rem', textAlign: 'center' }}
          />
          <Column
            field="exchangeRate"
            header={
              <span title={t('policy.exchange_rate_tooltip', { defaultValue: 'Tỷ giá quy đổi: 1 điểm tích lũy = bao nhiêu HTG' })}>
                {t('policy.exchange_rate', { defaultValue: 'Tỷ Giá Quy Đổi' })}
              </span>
            }
            body={(row: PolicyRule) => <span className="font-mono font-medium text-green-600">{row.exchangeRate} HTG</span>}
            sortable
            style={{ minWidth: '10rem', textAlign: 'center' }}
          />
          <Column
            field="status"
            header={t('common.status', { defaultValue: 'Trạng Thái' })}
            body={statusTemplate}
            sortable
            style={{ minWidth: '8.5rem', textAlign: 'center' }}
          />
          <Column
            field="updatedAt"
            header={t('common.updated_at', { defaultValue: 'Cập Nhật' })}
            sortable
            body={(row: PolicyRule) => <span className="text-600 text-xs font-mono">{row.updatedAt}</span>}
            style={{ minWidth: '8.5rem', textAlign: 'center' }}
          />
          <Column body={actionTemplate} exportable={false} style={{ width: '6rem', textAlign: 'center' }} />
        </DataTable>
      </div>

      {/* MODAL DIALOG: THÊM / SỬA CHÍNH SÁCH */}
      <Dialog
        visible={showDialog}
        style={{ width: '480px' }}
        header={isEdit ? t('policy.edit_title', { defaultValue: 'Cập nhật Chính sách' }) : t('policy.create_title', { defaultValue: 'Thêm mới Chính sách' })}
        modal
        className="p-fluid border-round-xl"
        onHide={() => setShowDialog(false)}
      >
        {/* Dropdown Chọn Đối Tác */}
        <div className="field mb-3">
          <label htmlFor="partnerSelector" className="font-bold text-900">
            {t('policy.select_partner', { defaultValue: 'Chọn Đối Tác Liên Minh' })} <span className="text-red-500">*</span>
          </label>
          <Dropdown
            id="partnerSelector"
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
            placeholder={t('policy.select_partner_placeholder', { defaultValue: 'Chọn đối tác áp dụng chính sách...' })}
            disabled={isEdit}
            filter
            className="w-full"
            appendTo="self"
          />
          {isEdit && (
            <small className="text-500 block mt-1">
              Mã đối tác: <strong className="font-mono">{formData.partnerCode}</strong> ({formData.partnerName})
            </small>
          )}
          {!isEdit && formData.partnerId && configuredPartnerIds.has(formData.partnerId) && (
            <div className="p-2 border-round surface-100 border-left-3 border-orange-500 text-orange-700 text-xs mt-2 flex align-items-center gap-2">
              <i className="pi pi-info-circle text-sm" />
              <span>Đối tác này đã có chính sách trong hệ thống. Việc lưu sẽ cập nhật cấu hình cho chính sách hiện tại.</span>
            </div>
          )}
        </div>

        {/* Tỷ Lệ Tích Điểm */}
        <div className="field mb-3">
          <label htmlFor="earnRate" className="font-bold text-900">
            {t('policy.earn_rate_percent', { defaultValue: 'Tỷ lệ tích điểm (%)' })}
          </label>
          <InputNumber
            id="earnRate"
            value={formData.earnRate}
            onValueChange={(e) => setFormData({ ...formData, earnRate: e.value || 0 })}
            mode="decimal"
            minFractionDigits={1}
            maxFractionDigits={2}
            min={0}
            max={100}
            suffix=" %"
          />
        </div>

        {/* Khấu Trừ Tối Đa */}
        <div className="field mb-3">
          <label htmlFor="maxBurnPercentage" className="font-bold text-900">
            {t('policy.max_burn_percentage', { defaultValue: 'Khấu trừ tối đa (% Hóa đơn)' })}
          </label>
          <Dropdown
            id="maxBurnPercentage"
            value={formData.maxBurnPercentage}
            options={burnOptions}
            onChange={(e) => setFormData({ ...formData, maxBurnPercentage: e.value })}
            placeholder={t('policy.select_burn', { defaultValue: 'Chọn tỷ lệ khấu trừ' })}
            appendTo="self"
          />
        </div>

        {/* Tỷ Giá Quy Đổi */}
        <div className="field mb-3">
          <label htmlFor="exchangeRate" className="font-bold text-900">
            {t('policy.exchange_rate', { defaultValue: 'Tỷ giá quy đổi (1 Điểm = ? HTG)' })}
          </label>
          <InputNumber
            id="exchangeRate"
            value={formData.exchangeRate}
            onValueChange={(e) => setFormData({ ...formData, exchangeRate: e.value || 1.0 })}
            mode="decimal"
            minFractionDigits={2}
            maxFractionDigits={4}
            min={0.01}
            suffix=" HTG"
          />
        </div>

        {/* Trạng Thái */}
        <div className="field mb-3">
          <label htmlFor="status" className="font-bold text-900">
            {t('common.status', { defaultValue: 'Trạng thái' })}
          </label>
          <Dropdown
            id="status"
            value={formData.status}
            options={statusOptions}
            onChange={(e) => setFormData({ ...formData, status: e.value })}
            appendTo="self"
          />
        </div>

        {/* Nút Hành Động */}
        <div className="flex justify-content-end gap-2 mt-4">
          <Button
            label={t('common.cancel', { defaultValue: 'Hủy' })}
            icon="pi pi-times"
            outlined
            onClick={() => setShowDialog(false)}
          />
          <Button
            label={t('common.save', { defaultValue: 'Lưu thay đổi' })}
            icon="pi pi-check"
            onClick={saveItem}
            loading={isSubmitting}
            severity="primary"
          />
        </div>
      </Dialog>
    </div>
  );
};

export default PolicyConfigurationPage;

