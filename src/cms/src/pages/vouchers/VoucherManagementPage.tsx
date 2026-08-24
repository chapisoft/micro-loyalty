import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { AppBreadcrumb } from 'components';
import { CommonStatus, DiscountType } from '@/models';

interface VoucherItem {
  id: number;
  voucherCode: string;
  title: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderValue: number;
  maxDiscountAmount: number;
  pointsRequired: number;
  totalQuantity: number;
  remainingQuantity: number;
  partnerScope: string;
  validFrom: string;
  validTo: string;
  status: CommonStatus;
}

const INITIAL_VOUCHERS: VoucherItem[] = [
  {
    id: 1,
    voucherCode: 'DELIMART_50K',
    title: 'Phiếu Giảm 50 HTG Tại Siêu Thị Delimart',
    discountType: DiscountType.FIXED_AMOUNT,
    discountValue: 50,
    minOrderValue: 200,
    maxDiscountAmount: 50,
    pointsRequired: 50,
    totalQuantity: 10000,
    remainingQuantity: 8420,
    partnerScope: 'DELIMART_ALL',
    validFrom: '2026-08-01',
    validTo: '2026-08-31',
    status: CommonStatus.ACTIVE,
  },
  {
    id: 2,
    voucherCode: 'NATCASH_TELCO_10PCT',
    title: 'Chiết Khấu 10% Nạp Tiền Di Động Natcom',
    discountType: DiscountType.PERCENTAGE,
    discountValue: 10,
    minOrderValue: 100,
    maxDiscountAmount: 100,
    pointsRequired: 30,
    totalQuantity: 5000,
    remainingQuantity: 3110,
    partnerScope: 'NATCASH_APP',
    validFrom: '2026-08-01',
    validTo: '2026-12-31',
    status: CommonStatus.ACTIVE,
  },
];

import { LoyaltyService } from '@/service/loyalty.service';

export const VoucherManagementPage: React.FC = () => {
  const { t } = useTranslation();
  const [vouchers, setVouchers] = useState<VoucherItem[]>(INITIAL_VOUCHERS);
  const [selectedVouchers, setSelectedVouchers] = useState<VoucherItem[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [formData, setFormData] = useState<Partial<VoucherItem>>({});
  const [isEdit, setIsEdit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    LoyaltyService.getVouchers().then((data) => {
      if (data && data.length > 0) {
        setVouchers(
          data.map((item) => ({
            id: item.id,
            voucherCode: item.voucherCode,
            title: item.title,
            discountType: item.discountType as DiscountType,
            discountValue: item.discountValue,
            minOrderValue: item.minBillAmount,
            maxDiscountAmount: item.discountValue,
            pointsRequired: item.pointCost,
            totalQuantity: item.totalQuantity,
            remainingQuantity: item.availableQuantity,
            partnerScope: item.partnerName || 'DELIMART_ALL',
            validFrom: item.startDate ? item.startDate.substring(0, 10) : '2026-08-01',
            validTo: item.endDate ? item.endDate.substring(0, 10) : '2026-12-31',
            status: item.status as CommonStatus,
          }))
        );
      }
    });
  }, []);

  const openNew = () => {
    setFormData({
      discountType: DiscountType.FIXED_AMOUNT,
      discountValue: 50,
      minOrderValue: 100,
      maxDiscountAmount: 50,
      pointsRequired: 50,
      totalQuantity: 1000,
      remainingQuantity: 1000,
      partnerScope: 'DELIMART_ALL',
      validFrom: '2026-08-01',
      validTo: '2026-08-31',
      status: CommonStatus.ACTIVE,
    });
    setIsEdit(false);
    setShowDialog(true);
  };

  const editItem = (item: VoucherItem) => {
    setFormData({ ...item });
    setIsEdit(true);
    setShowDialog(true);
  };

  const saveItem = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      if (isEdit && formData.id) {
        setVouchers(vouchers.map((v) => (v.id === formData.id ? ({ ...v, ...formData } as VoucherItem) : v)));
      } else {
        const newItem: VoucherItem = {
          id: Date.now(),
          voucherCode: formData.voucherCode || 'NEW_VOUCHER',
          title: formData.title || 'Phiếu ưu đãi mới',
          discountType: formData.discountType || DiscountType.FIXED_AMOUNT,
          discountValue: formData.discountValue || 50,
          minOrderValue: formData.minOrderValue || 100,
          maxDiscountAmount: formData.maxDiscountAmount || 50,
          pointsRequired: formData.pointsRequired || 50,
          totalQuantity: formData.totalQuantity || 1000,
          remainingQuantity: formData.totalQuantity || 1000,
          partnerScope: formData.partnerScope || 'ALL',
          validFrom: formData.validFrom || '2026-08-01',
          validTo: formData.validTo || '2026-08-31',
          status: formData.status || CommonStatus.ACTIVE,
        };
        setVouchers([...vouchers, newItem]);
      }
      setIsSubmitting(false);
      setShowDialog(false);
    }, 300);
  };

  const handleImportCsv = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setShowImportDialog(false);
    }, 500);
  };

  const actionTemplate = (rowData: VoucherItem) => (
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

  const statusTemplate = (rowData: VoucherItem) => {
    return rowData.status === CommonStatus.ACTIVE ? (
      <Tag severity="success" value={t('common.active', { defaultValue: 'Đang áp dụng' })} />
    ) : (
      <Tag severity="danger" value={t('common.inactive', { defaultValue: 'Tạm dừng' })} />
    );
  };

  const discountBadgeTemplate = (rowData: VoucherItem) => {
    return rowData.discountType === DiscountType.PERCENTAGE ? (
      <span className="font-bold text-primary">{rowData.discountValue}%</span>
    ) : (
      <span className="font-bold text-primary">{rowData.discountValue} HTG</span>
    );
  };

  const discountTypeOptions = [
    { label: t('voucher.fixed_amount', { defaultValue: 'Số tiền cố định (HTG)' }), value: DiscountType.FIXED_AMOUNT },
    { label: t('voucher.percentage', { defaultValue: 'Phần trăm hóa đơn (%)' }), value: DiscountType.PERCENTAGE },
  ];

  const statusOptions = [
    { label: t('common.active', { defaultValue: 'Đang áp dụng' }), value: CommonStatus.ACTIVE },
    { label: t('common.inactive', { defaultValue: 'Tạm dừng' }), value: CommonStatus.INACTIVE },
  ];

  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <h4 className="m-0 text-primary font-bold">{t('voucher.management_title', { defaultValue: 'Quản trị Kho Quà & Phiếu Ưu Đãi (Vouchers)' })}</h4>
      <div className="flex gap-2">
        <Button label={t('voucher.import_csv', { defaultValue: 'Nhập CSV (10.000 mã)' })} icon="pi pi-upload" severity="info" outlined onClick={() => setShowImportDialog(true)} />
        <Button label={t('voucher.add_new', { defaultValue: 'Tạo Phiếu Ưu Đãi' })} icon="pi pi-plus" severity="success" onClick={openNew} />
      </div>
    </div>
  );

  return (
    <div>
      <AppBreadcrumb items={[{ label: t('nav.vouchers', { defaultValue: 'Kho Voucher' }) }]} />
      <div className="card shadow-1 border-round surface-card p-4">
        <DataTable<any>
          value={vouchers}
          selection={selectedVouchers}
          onSelectionChange={(e: any) => setSelectedVouchers(e.value || [])}
          header={header}
          dataKey="id"
          paginator
          rows={10}
          emptyMessage={t('common.no_data', { defaultValue: 'Không có phiếu ưu đãi nào' })}
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
          <Column field="voucherCode" header={t('voucher.code', { defaultValue: 'Mã Voucher' })} sortable style={{ minWidth: '10rem' }} />
          <Column field="title" header={t('voucher.title', { defaultValue: 'Tiêu đề Voucher' })} sortable style={{ minWidth: '16rem' }} />
          <Column field="discountValue" body={discountBadgeTemplate} header={t('voucher.discount_value', { defaultValue: 'Giá trị giảm' })} sortable style={{ minWidth: '8rem' }} />
          <Column field="pointsRequired" header={t('voucher.points_required', { defaultValue: 'Điểm đổi' })} sortable style={{ minWidth: '8rem', textAlign: 'center' }} />
          <Column field="remainingQuantity" header={t('voucher.remaining_quantity', { defaultValue: 'Còn lại / Tổng' })} body={(row: VoucherItem) => `${row.remainingQuantity.toLocaleString()} / ${row.totalQuantity.toLocaleString()}`} sortable style={{ minWidth: '10rem' }} />
          <Column field="partnerScope" header={t('voucher.partner_scope', { defaultValue: 'Đối tác áp dụng' })} sortable style={{ minWidth: '10rem' }} />
          <Column field="validTo" header={t('voucher.valid_to', { defaultValue: 'Hiệu lực đến' })} sortable style={{ minWidth: '9rem' }} />
          <Column field="status" body={statusTemplate} header={t('common.status', { defaultValue: 'Trạng thái' })} sortable style={{ minWidth: '9rem' }} />
        </DataTable>
      </div>

      <Dialog
        visible={showDialog}
        style={{ width: '36rem' }}
        breakpoints={{ '960px': '75vw', '641px': '90vw' }}
        header={isEdit ? t('voucher.edit_title', { defaultValue: 'Cập nhật Phiếu Ưu Đãi' }) : t('voucher.create_title', { defaultValue: 'Tạo mới Phiếu Ưu Đãi' })}
        modal
        className="p-fluid"
        onHide={() => setShowDialog(false)}
      >
        <div className="field mb-3">
          <label htmlFor="voucherCode" className="font-bold">{t('voucher.code', { defaultValue: 'Mã Voucher' })}</label>
          <InputText
            id="voucherCode"
            value={formData.voucherCode || ''}
            onChange={(e) => setFormData({ ...formData, voucherCode: e.target.value })}
            required
            disabled={isEdit}
            placeholder={t('voucher.code_placeholder', { defaultValue: 'Ví dụ: DELIMART_50K' })}
          />
        </div>
        <div className="field mb-3">
          <label htmlFor="title" className="font-bold">{t('voucher.title', { defaultValue: 'Tiêu đề Voucher' })}</label>
          <InputText
            id="title"
            value={formData.title || ''}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            placeholder={t('voucher.title_placeholder', { defaultValue: 'Ví dụ: Phiếu Giảm 50 HTG Tại Siêu Thị Delimart' })}
          />
        </div>
        <div className="grid">
          <div className="col-6 field mb-3">
            <label htmlFor="discountType" className="font-bold">{t('voucher.discount_type', { defaultValue: 'Loại ưu đãi' })}</label>
            <Dropdown
              id="discountType"
              value={formData.discountType || DiscountType.FIXED_AMOUNT}
              options={discountTypeOptions}
              onChange={(e) => setFormData({ ...formData, discountType: e.value })}
            />
          </div>
          <div className="col-6 field mb-3">
            <label htmlFor="discountValue" className="font-bold">{t('voucher.discount_value', { defaultValue: 'Giá trị giảm' })}</label>
            <InputNumber
              id="discountValue"
              value={formData.discountValue ?? 50}
              onValueChange={(e) => setFormData({ ...formData, discountValue: e.value ?? 50 })}
            />
          </div>
        </div>
        <div className="grid">
          <div className="col-6 field mb-3">
            <label htmlFor="pointsRequired" className="font-bold">{t('voucher.points_required', { defaultValue: 'Điểm đổi voucher' })}</label>
            <InputNumber
              id="pointsRequired"
              value={formData.pointsRequired ?? 50}
              onValueChange={(e) => setFormData({ ...formData, pointsRequired: e.value ?? 50 })}
            />
          </div>
          <div className="col-6 field mb-3">
            <label htmlFor="totalQuantity" className="font-bold">{t('voucher.total_quantity', { defaultValue: 'Tổng số lượng phát hành' })}</label>
            <InputNumber
              id="totalQuantity"
              value={formData.totalQuantity ?? 1000}
              onValueChange={(e) => setFormData({ ...formData, totalQuantity: e.value ?? 1000 })}
            />
          </div>
        </div>
        <div className="field mb-3">
          <label htmlFor="partnerScope" className="font-bold">{t('voucher.partner_scope', { defaultValue: 'Phạm vi đối tác áp dụng' })}</label>
          <InputText
            id="partnerScope"
            value={formData.partnerScope || ''}
            onChange={(e) => setFormData({ ...formData, partnerScope: e.target.value })}
            placeholder={t('voucher.partner_scope_placeholder', { defaultValue: 'Ví dụ: DELIMART_ALL' })}
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
          <Button label={t('common.save', { defaultValue: 'Lưu phiếu ưu đãi' })} icon="pi pi-check" onClick={saveItem} loading={isSubmitting} disabled={isSubmitting} />
        </div>
      </Dialog>

      <Dialog
        visible={showImportDialog}
        style={{ width: '30rem' }}
        header={t('voucher.import_csv', { defaultValue: 'Nhập tệp CSV chứa 10.000 mã Voucher' })}
        modal
        onHide={() => setShowImportDialog(false)}
      >
        <div className="text-center p-4 surface-100 border-round border-dashed border-primary mb-3">
          <i className="pi pi-file-excel text-4xl text-primary mb-2 block" />
          <p className="font-bold m-0 mb-1">{t('voucher.drop_file', { defaultValue: 'Kéo thả tệp .CSV chứa danh sách mã ưu đãi vào đây' })}</p>
          <span className="text-sm text-500">Định dạng mẫu: voucher_code, pin_code, expired_date</span>
        </div>
        <div className="flex justify-content-end gap-2">
          <Button label={t('common.cancel', { defaultValue: 'Hủy' })} icon="pi pi-times" outlined onClick={() => setShowImportDialog(false)} disabled={isSubmitting} />
          <Button label={t('common.confirm', { defaultValue: 'Tải lên & Lưu mã' })} icon="pi pi-upload" onClick={handleImportCsv} loading={isSubmitting} disabled={isSubmitting} />
        </div>
      </Dialog>
    </div>
  );
};

export default VoucherManagementPage;
