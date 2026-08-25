import React, { useState, useEffect, useCallback } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Tag } from 'primereact/tag';
import { Dropdown } from 'primereact/dropdown';
import { useTranslation } from 'react-i18next';
import { AppBreadcrumb } from 'components';
import { CommonStatus } from '@/models';
import { LoyaltyService } from '@/service/loyalty.service';

export interface PolicyRule {
  id: number;
  partnerCode: string;
  partnerName: string;
  earnRate: number;
  maxBurnPercentage: number;
  exchangeRate: number;
  status: CommonStatus;
  updatedAt: string;
  description?: string;
}

export const PolicyConfigurationPage: React.FC = () => {
  const { t } = useTranslation();
  const [policies, setPolicies] = useState<PolicyRule[]>([]);
  const [selectedPolicies, setSelectedPolicies] = useState<PolicyRule[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState<Partial<PolicyRule>>({});
  const [isEdit, setIsEdit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchPolicies = useCallback(async () => {
    setLoading(true);
    try {
      const data = await LoyaltyService.getPolicies();
      if (data && data.length > 0) {
        setPolicies(
          data.map((item) => ({
            id: item.id,
            partnerCode: item.partnerCode || 'DELIMART',
            partnerName: item.partnerName || 'Siêu Thị Delimart',
            earnRate: item.earnRate || 1.0,
            maxBurnPercentage: item.maxBurnPercentage || item.maxBurnPercent || 50,
            exchangeRate: item.exchangeRate || 1.0,
            status: (item.status as CommonStatus) || CommonStatus.ACTIVE,
            updatedAt: item.effectiveDate || new Date().toLocaleString('vi-VN'),
            description: item.description || '',
          }))
        );
      }
    } catch (e) {
      console.error('[fetchPolicies] Error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  const openNew = () => {
    setFormData({
      partnerCode: 'PARTNER_' + Math.floor(Math.random() * 1000),
      partnerName: 'Đối tác liên minh mới',
      earnRate: 1.0,
      maxBurnPercentage: 50,
      exchangeRate: 1.0,
      status: CommonStatus.ACTIVE,
      description: 'Chính sách áp dụng toàn hệ sinh thái',
    });
    setIsEdit(false);
    setShowDialog(true);
  };

  const editItem = (item: PolicyRule) => {
    setFormData({ ...item });
    setIsEdit(true);
    setShowDialog(true);
  };

  const deleteItem = async (item: PolicyRule) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa chính sách #${item.id} (${item.partnerName})?`)) {
      setLoading(true);
      try {
        await LoyaltyService.deletePolicy(item.id);
        await fetchPolicies();
      } catch (e) {
        console.error('[deletePolicy] Error:', e);
      } finally {
        setLoading(false);
      }
    }
  };

  const saveItem = async () => {
    setIsSubmitting(true);
    try {
      if (isEdit && formData.id) {
        await LoyaltyService.updatePolicy(formData.id, {
          partnerCode: formData.partnerCode,
          partnerName: formData.partnerName,
          earnRatePercent: formData.earnRate,
          maxBurnPercentage: formData.maxBurnPercentage,
          exchangeRate: formData.exchangeRate,
          status: formData.status,
          description: formData.description,
        });
      } else {
        await LoyaltyService.createPolicy({
          partnerCode: formData.partnerCode || 'NEW_PARTNER',
          partnerName: formData.partnerName || 'Đối Tác Mới',
          earnRatePercent: formData.earnRate || 1.0,
          maxBurnPercentage: formData.maxBurnPercentage || 50,
          exchangeRate: formData.exchangeRate || 1.0,
          status: formData.status || CommonStatus.ACTIVE,
          description: formData.description || 'Chính sách mới tạo từ CMS',
        });
      }
      setShowDialog(false);
      await fetchPolicies();
    } catch (e) {
      console.error('[savePolicy] Error:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const actionTemplate = (rowData: PolicyRule) => (
    <div className="flex gap-2">
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
    <span className="font-bold text-primary">{rowData.maxBurnPercentage}% {t('policy.of_bill', { defaultValue: 'hóa đơn' })}</span>
  );

  const statusOptions = [
    { label: t('common.active', { defaultValue: 'Đang áp dụng' }), value: CommonStatus.ACTIVE },
    { label: t('common.inactive', { defaultValue: 'Tạm dừng' }), value: CommonStatus.INACTIVE },
  ];

  const burnOptions = [
    { label: '30% ' + t('policy.of_bill', { defaultValue: 'hóa đơn' }), value: 30 },
    { label: '50% ' + t('policy.of_bill', { defaultValue: 'hóa đơn' }), value: 50 },
    { label: '100% ' + t('policy.of_bill', { defaultValue: 'hóa đơn' }), value: 100 },
  ];

  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <h4 className="m-0 text-primary font-bold">{t('policy.management_title', { defaultValue: 'Cấu hình Chính sách Tích & Tiêu Điểm' })}</h4>
      <div className="flex gap-2">
        <Button label={t('policy.add_new', { defaultValue: 'Thêm Chính sách' })} icon="pi pi-plus" severity="success" onClick={openNew} />
        <Button icon="pi pi-refresh" outlined onClick={fetchPolicies} loading={loading} />
      </div>
    </div>
  );

  return (
    <div>
      <AppBreadcrumb items={[{ label: t('nav.policies', { defaultValue: 'Chính sách Điểm' }) }]} />
      <div className="card shadow-1 border-round surface-card p-4">
        <DataTable<any>
          value={policies}
          selection={selectedPolicies}
          onSelectionChange={(e) => setSelectedPolicies(e.value as PolicyRule[])}
          dataKey="id"
          paginator
          rows={10}
          loading={loading}
          rowsPerPageOptions={[5, 10, 25]}
          header={header}
          responsiveLayout="scroll"
          emptyMessage={t('common.no_data', { defaultValue: 'Chưa có chính sách nào' })}
        >
          <Column selectionMode="multiple" exportable={false} style={{ width: '3rem' }} />
          <Column field="id" header="#" style={{ width: '4rem' }} />
          <Column field="partnerCode" header={t('policy.partner_code', { defaultValue: 'Mã Đối Tác' })} sortable />
          <Column field="partnerName" header={t('policy.partner_name', { defaultValue: 'Tên Đối Tác' })} sortable />
          <Column
            field="earnRate"
            header={t('policy.earn_rate', { defaultValue: 'Tỷ lệ tích điểm' })}
            body={(row: PolicyRule) => `${row.earnRate}%`}
            sortable
          />
          <Column
            field="maxBurnPercentage"
            header={t('policy.max_burn', { defaultValue: 'Khấu trừ tối đa' })}
            body={burnPercentageTemplate}
            sortable
          />
          <Column
            field="exchangeRate"
            header={t('policy.exchange_rate', { defaultValue: 'Quy đổi (1đ = ? HTG)' })}
            body={(row: PolicyRule) => `${row.exchangeRate} HTG`}
            sortable
          />
          <Column field="status" header={t('common.status', { defaultValue: 'Trạng thái' })} body={statusTemplate} sortable />
          <Column field="updatedAt" header={t('common.updated_at', { defaultValue: 'Cập nhật' })} sortable />
          <Column body={actionTemplate} exportable={false} style={{ minWidth: '8rem' }} />
        </DataTable>
      </div>

      <Dialog
        visible={showDialog}
        style={{ width: '450px' }}
        header={isEdit ? t('policy.edit_title', { defaultValue: 'Chỉnh sửa Chính sách' }) : t('policy.add_title', { defaultValue: 'Thêm mới Chính sách' })}
        modal
        className="p-fluid"
        onHide={() => setShowDialog(false)}
      >
        <div className="field mb-3">
          <label htmlFor="partnerCode" className="font-bold">{t('policy.partner_code', { defaultValue: 'Mã Đối Tác' })}</label>
          <InputText
            id="partnerCode"
            value={formData.partnerCode || ''}
            onChange={(e) => setFormData({ ...formData, partnerCode: e.target.value })}
            placeholder="VD: DELIMART_SUPERMARKET"
          />
        </div>

        <div className="field mb-3">
          <label htmlFor="partnerName" className="font-bold">{t('policy.partner_name', { defaultValue: 'Tên Đối Tác' })}</label>
          <InputText
            id="partnerName"
            value={formData.partnerName || ''}
            onChange={(e) => setFormData({ ...formData, partnerName: e.target.value })}
            placeholder="VD: Chuỗi Siêu Thị Delimart"
          />
        </div>

        <div className="field mb-3">
          <label htmlFor="earnRate" className="font-bold">{t('policy.earn_rate_percent', { defaultValue: 'Tỷ lệ tích điểm (%)' })}</label>
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

        <div className="field mb-3">
          <label htmlFor="maxBurnPercentage" className="font-bold">{t('policy.max_burn_percentage', { defaultValue: 'Khấu trừ tối đa (% Hóa đơn)' })}</label>
          <Dropdown
            id="maxBurnPercentage"
            value={formData.maxBurnPercentage}
            options={burnOptions}
            onChange={(e) => setFormData({ ...formData, maxBurnPercentage: e.value })}
            placeholder={t('policy.select_burn', { defaultValue: 'Chọn tỷ lệ khấu trừ' })}
          />
        </div>

        <div className="field mb-3">
          <label htmlFor="status" className="font-bold">{t('common.status', { defaultValue: 'Trạng thái' })}</label>
          <Dropdown
            id="status"
            value={formData.status}
            options={statusOptions}
            onChange={(e) => setFormData({ ...formData, status: e.value })}
          />
        </div>

        <div className="flex justify-content-end gap-2 mt-4">
          <Button label={t('common.cancel', { defaultValue: 'Hủy' })} icon="pi pi-times" outlined onClick={() => setShowDialog(false)} />
          <Button label={t('common.save', { defaultValue: 'Lưu thay đổi' })} icon="pi pi-check" onClick={saveItem} loading={isSubmitting} />
        </div>
      </Dialog>
    </div>
  );
};
export default PolicyConfigurationPage;
