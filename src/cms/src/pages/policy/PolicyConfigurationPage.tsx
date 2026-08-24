import React, { useState } from 'react';
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

export interface PolicyRule {
  id: number;
  partnerCode: string;
  partnerName: string;
  earnRate: number; // Điểm nhận trên 100 HTG
  maxBurnPercentage: number; // 30, 50, 100%
  exchangeRate: number; // 1 Điểm = X HTG
  status: CommonStatus;
  updatedAt: string;
}

const INITIAL_POLICIES: PolicyRule[] = [
  {
    id: 1,
    partnerCode: 'NATCASH_WALLET',
    partnerName: 'Ví Điện Tử Natcash',
    earnRate: 1.0,
    maxBurnPercentage: 100,
    exchangeRate: 1.0,
    status: CommonStatus.ACTIVE,
    updatedAt: '2026-08-23 10:00:00',
  },
  {
    id: 2,
    partnerCode: 'DELIMART_SUPERMARKET',
    partnerName: 'Chuỗi Siêu Thị Delimart',
    earnRate: 1.2,
    maxBurnPercentage: 50,
    exchangeRate: 1.0,
    status: CommonStatus.ACTIVE,
    updatedAt: '2026-08-23 10:00:00',
  },
  {
    id: 3,
    partnerCode: 'NATCOM_TELECOM',
    partnerName: 'Nhà Mạng Viễn Thông Natcom',
    earnRate: 1.5,
    maxBurnPercentage: 30,
    exchangeRate: 1.0,
    status: CommonStatus.ACTIVE,
    updatedAt: '2026-08-23 10:00:00',
  },
];

import { LoyaltyService } from '@/service/loyalty.service';

export const PolicyConfigurationPage: React.FC = () => {
  const { t } = useTranslation();
  const [policies, setPolicies] = useState<PolicyRule[]>(INITIAL_POLICIES);
  const [selectedPolicies, setSelectedPolicies] = useState<PolicyRule[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState<Partial<PolicyRule>>({});
  const [isEdit, setIsEdit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    LoyaltyService.getPolicies().then((data) => {
      if (data && data.length > 0) {
        setPolicies(
          data.map((item) => ({
            id: item.id,
            partnerCode: item.partnerCode,
            partnerName: item.partnerName,
            earnRate: item.earnRate,
            maxBurnPercentage: item.maxBurnPercent,
            exchangeRate: 1.0,
            status: item.status as CommonStatus,
            updatedAt: item.effectiveDate || '2026-08-24 00:00:00',
          }))
        );
      }
    });
  }, []);

  const openNew = () => {
    setFormData({
      earnRate: 1.0,
      maxBurnPercentage: 50,
      exchangeRate: 1.0,
      status: CommonStatus.ACTIVE,
    });
    setIsEdit(false);
    setShowDialog(true);
  };

  const editItem = (item: PolicyRule) => {
    setFormData({ ...item });
    setIsEdit(true);
    setShowDialog(true);
  };

  const saveItem = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      if (isEdit && formData.id) {
        setPolicies(policies.map((p) => (p.id === formData.id ? ({ ...p, ...formData, updatedAt: new Date().toLocaleString('vi-VN') } as PolicyRule) : p)));
      } else {
        const newItem: PolicyRule = {
          id: Date.now(),
          partnerCode: formData.partnerCode || 'NEW_PARTNER',
          partnerName: formData.partnerName || 'Đối tác mới',
          earnRate: formData.earnRate || 1.0,
          maxBurnPercentage: formData.maxBurnPercentage || 50,
          exchangeRate: formData.exchangeRate || 1.0,
          status: formData.status || CommonStatus.ACTIVE,
          updatedAt: new Date().toLocaleString('vi-VN'),
        };
        setPolicies([...policies, newItem]);
      }
      setIsSubmitting(false);
      setShowDialog(false);
    }, 300);
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
          onSelectionChange={(e: any) => setSelectedPolicies(e.value || [])}
          header={header}
          dataKey="id"
          paginator
          rows={10}
          emptyMessage={t('common.no_data', { defaultValue: 'Không có chính sách nào' })}
          stripedRows
          responsiveLayout="scroll"
        >
          {/* Cột 1: Checkbox */}
          <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />

          {/* Cột 2: STT */}
          <Column
            header={t('common.stt', { defaultValue: 'STT' })}
            body={(_, options) => options.rowIndex + 1}
            style={{ width: '4rem', textAlign: 'center' }}
          />

          {/* Cột 3: Thao tác */}
          <Column body={actionTemplate} exportable={false} header={t('common.actions', { defaultValue: 'Thao tác' })} style={{ width: '6rem' }} />

          {/* Cột 4 trở đi: Dữ liệu */}
          <Column field="partnerCode" header={t('policy.partner_code', { defaultValue: 'Mã Đối tác' })} sortable style={{ minWidth: '10rem' }} />
          <Column field="partnerName" header={t('policy.partner_name', { defaultValue: 'Tên Điểm bán / Kênh' })} sortable style={{ minWidth: '14rem' }} />
          <Column field="earnRate" header={t('policy.earn_rate', { defaultValue: 'Tỷ lệ tích điểm' })} sortable style={{ minWidth: '9rem' }} />
          <Column field="maxBurnPercentage" body={burnPercentageTemplate} header={t('policy.max_burn', { defaultValue: 'Hạn mức trừ điểm tối đa' })} sortable style={{ minWidth: '12rem' }} />
          <Column field="exchangeRate" header={t('policy.exchange_rate', { defaultValue: 'Tỷ giá quy đổi (1 Điểm = ? HTG)' })} sortable style={{ minWidth: '12rem' }} />
          <Column field="status" body={statusTemplate} header={t('common.status', { defaultValue: 'Trạng thái' })} sortable style={{ minWidth: '9rem' }} />
          <Column field="updatedAt" header={t('common.updated_at', { defaultValue: 'Cập nhật' })} sortable style={{ minWidth: '11rem' }} />
        </DataTable>
      </div>

      <Dialog
        visible={showDialog}
        style={{ width: '32rem' }}
        breakpoints={{ '960px': '75vw', '641px': '90vw' }}
        header={isEdit ? t('policy.edit_title', { defaultValue: 'Cập nhật Chính sách' }) : t('policy.create_title', { defaultValue: 'Thêm mới Chính sách' })}
        modal
        className="p-fluid"
        onHide={() => setShowDialog(false)}
      >
        <div className="field mb-3">
          <label htmlFor="partnerCode" className="font-bold">{t('policy.partner_code', { defaultValue: 'Mã Đối tác' })}</label>
          <InputText
            id="partnerCode"
            value={formData.partnerCode || ''}
            onChange={(e) => setFormData({ ...formData, partnerCode: e.target.value })}
            required
            autoFocus
            disabled={isEdit}
            placeholder={t('policy.partner_code_placeholder', { defaultValue: 'Ví dụ: DELIMART_POS' })}
          />
        </div>
        <div className="field mb-3">
          <label htmlFor="partnerName" className="font-bold">{t('policy.partner_name', { defaultValue: 'Tên Điểm bán' })}</label>
          <InputText
            id="partnerName"
            value={formData.partnerName || ''}
            onChange={(e) => setFormData({ ...formData, partnerName: e.target.value })}
            required
            placeholder={t('policy.partner_name_placeholder', { defaultValue: 'Ví dụ: Siêu thị Delimart Port-au-Prince' })}
          />
        </div>
        <div className="field mb-3">
          <label htmlFor="earnRate" className="font-bold">{t('policy.earn_rate', { defaultValue: 'Hệ số tích điểm cơ bản' })}</label>
          <InputNumber
            id="earnRate"
            value={formData.earnRate ?? 1.0}
            onValueChange={(e) => setFormData({ ...formData, earnRate: e.value ?? 1.0 })}
            minFractionDigits={1}
            maxFractionDigits={2}
          />
        </div>
        <div className="field mb-3">
          <label htmlFor="maxBurnPercentage" className="font-bold">{t('policy.max_burn', { defaultValue: 'Hạn mức tiêu điểm tối đa' })}</label>
          <Dropdown
            id="maxBurnPercentage"
            value={formData.maxBurnPercentage ?? 50}
            options={burnOptions}
            onChange={(e) => setFormData({ ...formData, maxBurnPercentage: e.value })}
          />
        </div>
        <div className="field mb-3">
          <label htmlFor="status" className="font-bold">{t('common.status', { defaultValue: 'Trạng thái' })}</label>
          <Dropdown
            id="status"
            value={formData.status || CommonStatus.ACTIVE}
            options={statusOptions}
            onChange={(e) => setFormData({ ...formData, status: e.value })}
          />
        </div>
        <div className="flex justify-content-end gap-2 mt-4">
          <Button label={t('common.cancel', { defaultValue: 'Hủy' })} icon="pi pi-times" outlined onClick={() => setShowDialog(false)} disabled={isSubmitting} />
          <Button label={t('common.save', { defaultValue: 'Lưu chính sách' })} icon="pi pi-check" onClick={saveItem} loading={isSubmitting} disabled={isSubmitting} />
        </div>
      </Dialog>
    </div>
  );
};

export default PolicyConfigurationPage;
