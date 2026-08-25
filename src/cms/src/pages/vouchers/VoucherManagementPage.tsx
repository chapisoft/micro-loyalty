import React, { useState, useEffect, useCallback } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Tag } from 'primereact/tag';
import { Dropdown } from 'primereact/dropdown';
import { FileUpload } from 'primereact/fileupload';
import { useTranslation } from 'react-i18next';
import { AppBreadcrumb } from 'components';
import { CommonStatus, DiscountType } from '@/models';
import { LoyaltyService } from '@/service/loyalty.service';

export interface VoucherItem {
  id: number;
  voucherCode: string;
  title: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderValue: number;
  maxDiscountAmount?: number;
  pointsRequired: number;
  totalQuantity: number;
  remainingQuantity: number;
  partnerScope: string;
  validFrom: string;
  validTo: string;
  status: CommonStatus;
}

export const VoucherManagementPage: React.FC = () => {
  const { t } = useTranslation();
  const [vouchers, setVouchers] = useState<VoucherItem[]>([]);
  const [selectedVouchers, setSelectedVouchers] = useState<VoucherItem[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [formData, setFormData] = useState<Partial<VoucherItem>>({});
  const [isEdit, setIsEdit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchVouchers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await LoyaltyService.getVouchers();
      if (data && data.length > 0) {
        setVouchers(
          data.map((item) => ({
            id: item.id,
            voucherCode: item.voucherCode,
            title: item.title,
            discountType: (item.discountType as DiscountType) || DiscountType.FIXED_AMOUNT,
            discountValue: item.discountValue || 0,
            minOrderValue: item.minBillAmount || 0,
            maxDiscountAmount: item.maxDiscountAmount || item.discountValue || 0,
            pointsRequired: item.pointCost || 0,
            totalQuantity: item.totalQuantity || 0,
            remainingQuantity: item.availableQuantity || 0,
            partnerScope: item.partnerName || 'DELIMART_ALL',
            validFrom: item.startDate ? item.startDate.substring(0, 10) : '2026-08-01',
            validTo: item.endDate ? item.endDate.substring(0, 10) : '2026-12-31',
            status: (item.status as CommonStatus) || CommonStatus.ACTIVE,
          }))
        );
      }
    } catch (e) {
      console.error('[fetchVouchers] Error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVouchers();
  }, [fetchVouchers]);

  const openNew = () => {
    setFormData({
      voucherCode: 'VCH_' + Math.floor(Math.random() * 100000),
      title: 'Phiếu giảm giá ưu đãi',
      discountType: DiscountType.FIXED_AMOUNT,
      discountValue: 50,
      minOrderValue: 100,
      maxDiscountAmount: 50,
      pointsRequired: 50,
      totalQuantity: 1000,
      remainingQuantity: 1000,
      partnerScope: 'DELIMART_ALL',
      validFrom: '2026-08-01',
      validTo: '2026-12-31',
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

  const deleteItem = async (item: VoucherItem) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa voucher ${item.voucherCode} (${item.title})?`)) {
      setLoading(true);
      try {
        await LoyaltyService.deleteVoucher(item.id);
        await fetchVouchers();
      } catch (e) {
        console.error('[deleteVoucher] Error:', e);
      } finally {
        setLoading(false);
      }
    }
  };

  const saveItem = async () => {
    setIsSubmitting(true);
    try {
      if (isEdit && formData.id) {
        await LoyaltyService.updateVoucher(formData.id, {
          title: formData.title,
          voucherCode: formData.voucherCode,
          discountType: formData.discountType,
          discountValue: formData.discountValue,
          minBillAmount: formData.minOrderValue,
          maxDiscountAmount: formData.maxDiscountAmount,
          pointCost: formData.pointsRequired,
          totalQuantity: formData.totalQuantity,
        });
      } else {
        await LoyaltyService.createVoucher({
          voucherCode: formData.voucherCode || 'VCH_' + Date.now(),
          title: formData.title || 'Phiếu ưu đãi mới',
          discountType: formData.discountType || DiscountType.FIXED_AMOUNT,
          discountValue: formData.discountValue || 50,
          minBillAmount: formData.minOrderValue || 100,
          maxDiscountAmount: formData.maxDiscountAmount || 50,
          pointCost: formData.pointsRequired || 50,
          totalQuantity: formData.totalQuantity || 1000,
        });
      }
      setShowDialog(false);
      await fetchVouchers();
    } catch (e) {
      console.error('[saveVoucher] Error:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImportCsv = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setShowImportDialog(false);
      fetchVouchers();
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
      <h4 className="m-0 text-primary font-bold">{t('voucher.management_title', { defaultValue: 'Quản lý Kho Phiếu Ưu Đãi (Vouchers)' })}</h4>
      <div className="flex gap-2">
        <Button label={t('voucher.import_csv', { defaultValue: 'Nhập tệp CSV' })} icon="pi pi-upload" severity="help" onClick={() => setShowImportDialog(true)} />
        <Button label={t('voucher.add_new', { defaultValue: 'Thêm Voucher' })} icon="pi pi-plus" severity="success" onClick={openNew} />
        <Button icon="pi pi-refresh" outlined onClick={fetchVouchers} loading={loading} />
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
          onSelectionChange={(e) => setSelectedVouchers(e.value as VoucherItem[])}
          dataKey="id"
          paginator
          rows={10}
          loading={loading}
          rowsPerPageOptions={[5, 10, 25]}
          header={header}
          responsiveLayout="scroll"
          emptyMessage={t('common.no_data', { defaultValue: 'Chưa có voucher nào' })}
        >
          <Column selectionMode="multiple" exportable={false} style={{ width: '3rem' }} />
          <Column field="voucherCode" header={t('voucher.code', { defaultValue: 'Mã Voucher' })} sortable style={{ fontWeight: 'bold' }} />
          <Column field="title" header={t('voucher.title_label', { defaultValue: 'Tên Phiếu' })} sortable />
          <Column field="discountValue" header={t('voucher.discount_value', { defaultValue: 'Mức giảm' })} body={discountBadgeTemplate} sortable />
          <Column
            field="minOrderValue"
            header={t('voucher.min_order', { defaultValue: 'Đơn tối thiểu' })}
            body={(row: VoucherItem) => `${row.minOrderValue} HTG`}
            sortable
          />
          <Column
            field="pointsRequired"
            header={t('voucher.points_cost', { defaultValue: 'Điểm đổi' })}
            body={(row: VoucherItem) => (
              <span className="font-bold text-orange-500">
                <i className="pi pi-star-fill mr-1" />
                {row.pointsRequired}
              </span>
            )}
            sortable
          />
          <Column
            field="remainingQuantity"
            header={t('voucher.inventory', { defaultValue: 'Kho / Tổng' })}
            body={(row: VoucherItem) => `${row.remainingQuantity} / ${row.totalQuantity}`}
            sortable
          />
          <Column field="partnerScope" header={t('voucher.partner_scope', { defaultValue: 'Phạm vi đối tác' })} sortable />
          <Column field="status" header={t('common.status', { defaultValue: 'Trạng thái' })} body={statusTemplate} sortable />
          <Column body={actionTemplate} exportable={false} style={{ minWidth: '8rem' }} />
        </DataTable>
      </div>

      <Dialog
        visible={showDialog}
        style={{ width: '500px' }}
        header={isEdit ? t('voucher.edit_title', { defaultValue: 'Chỉnh sửa Voucher' }) : t('voucher.add_title', { defaultValue: 'Tạo Voucher mới' })}
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
            placeholder="VD: DELIMART_GIAM_50K"
            disabled={isEdit}
          />
        </div>

        <div className="field mb-3">
          <label htmlFor="title" className="font-bold">{t('voucher.title_label', { defaultValue: 'Tên Phiếu Ưu Đãi' })}</label>
          <InputText
            id="title"
            value={formData.title || ''}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="VD: Giảm 50 HTG cho hóa đơn từ 200 HTG"
          />
        </div>

        <div className="formgrid grid mb-3">
          <div className="field col-6">
            <label htmlFor="discountType" className="font-bold">{t('voucher.discount_type', { defaultValue: 'Loại giảm giá' })}</label>
            <Dropdown
              id="discountType"
              value={formData.discountType}
              options={discountTypeOptions}
              onChange={(e) => setFormData({ ...formData, discountType: e.value })}
            />
          </div>
          <div className="field col-6">
            <label htmlFor="discountValue" className="font-bold">{t('voucher.discount_value', { defaultValue: 'Mức giảm' })}</label>
            <InputNumber
              id="discountValue"
              value={formData.discountValue}
              onValueChange={(e) => setFormData({ ...formData, discountValue: e.value || 0 })}
            />
          </div>
        </div>

        <div className="formgrid grid mb-3">
          <div className="field col-6">
            <label htmlFor="minOrderValue" className="font-bold">{t('voucher.min_order', { defaultValue: 'Đơn tối thiểu (HTG)' })}</label>
            <InputNumber
              id="minOrderValue"
              value={formData.minOrderValue}
              onValueChange={(e) => setFormData({ ...formData, minOrderValue: e.value || 0 })}
            />
          </div>
          <div className="field col-6">
            <label htmlFor="pointsRequired" className="font-bold">{t('voucher.points_cost', { defaultValue: 'Điểm đổi' })}</label>
            <InputNumber
              id="pointsRequired"
              value={formData.pointsRequired}
              onValueChange={(e) => setFormData({ ...formData, pointsRequired: e.value || 0 })}
            />
          </div>
        </div>

        <div className="formgrid grid mb-3">
          <div className="field col-6">
            <label htmlFor="totalQuantity" className="font-bold">{t('voucher.total_quantity', { defaultValue: 'Tổng số lượng' })}</label>
            <InputNumber
              id="totalQuantity"
              value={formData.totalQuantity}
              onValueChange={(e) => setFormData({ ...formData, totalQuantity: e.value || 0 })}
            />
          </div>
          <div className="field col-6">
            <label htmlFor="status" className="font-bold">{t('common.status', { defaultValue: 'Trạng thái' })}</label>
            <Dropdown
              id="status"
              value={formData.status}
              options={statusOptions}
              onChange={(e) => setFormData({ ...formData, status: e.value })}
            />
          </div>
        </div>

        <div className="flex justify-content-end gap-2 mt-4">
          <Button label={t('common.cancel', { defaultValue: 'Hủy' })} icon="pi pi-times" outlined onClick={() => setShowDialog(false)} />
          <Button label={t('common.save', { defaultValue: 'Lưu Voucher' })} icon="pi pi-check" onClick={saveItem} loading={isSubmitting} />
        </div>
      </Dialog>

      <Dialog
        visible={showImportDialog}
        style={{ width: '450px' }}
        header={t('voucher.import_csv_title', { defaultValue: 'Nhập lô Voucher từ CSV' })}
        modal
        onHide={() => setShowImportDialog(false)}
      >
        <div className="p-fluid">
          <p className="text-secondary mb-3">
            {t('voucher.import_instruction', {
              defaultValue: 'Tải lên tệp CSV chứa danh sách mã voucher (Cột: CODE, TITLE, DISCOUNT_VAL, POINTS_COST, TOTAL_QTY)',
            })}
          </p>
          <FileUpload
            mode="basic"
            name="file"
            accept=".csv"
            maxFileSize={1000000}
            customUpload
            uploadHandler={handleImportCsv}
            auto
            chooseLabel={t('common.choose_file', { defaultValue: 'Chọn tệp CSV' })}
          />
          {isSubmitting && <div className="mt-2 text-center text-primary font-semibold">Đang xử lý nhập dữ liệu...</div>}
        </div>
      </Dialog>
    </div>
  );
};
export default VoucherManagementPage;
