import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Toast } from 'primereact/toast';
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
  const toastRef = useRef<Toast>(null);
  const [selectedTenant, setSelectedTenant] = useState('TENANT_NATCASH');
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

  const deleteItem = (item: VoucherItem) => {
    confirmDialog({
      message: `Bạn có chắc chắn muốn xóa voucher ${item.voucherCode} (${item.title}) khỏi hệ thống?`,
      header: t('common.confirm_delete', { defaultValue: 'Xác nhận xóa voucher' }),
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      acceptLabel: t('common.yes', { defaultValue: 'Xác nhận xóa' }),
      rejectLabel: t('common.no', { defaultValue: 'Hủy' }),
      accept: async () => {
        setLoading(true);
        try {
          await LoyaltyService.deleteVoucher(item.id);
          toastRef.current?.show({
            severity: 'success',
            summary: t('common.success', { defaultValue: 'Thành công' }),
            detail: `Đã xóa thành công voucher ${item.voucherCode}!`,
            life: 3000,
          });
          await fetchVouchers();
        } catch (e: any) {
          console.error('[deleteVoucher] Error:', e);
          toastRef.current?.show({
            severity: 'error',
            summary: t('common.error', { defaultValue: 'Lỗi' }),
            detail: e?.message || 'Không thể xóa voucher, vui lòng thử lại sau!',
            life: 4000,
          });
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleSaveConfirmed = async () => {
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
        toastRef.current?.show({
          severity: 'success',
          summary: t('common.success', { defaultValue: 'Thành công' }),
          detail: `Cập nhật thành công voucher ${formData.voucherCode || ''}!`,
          life: 3000,
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
        toastRef.current?.show({
          severity: 'success',
          summary: t('common.success', { defaultValue: 'Thành công' }),
          detail: 'Thêm mới voucher vào kho thành công!',
          life: 3000,
        });
      }
      setShowDialog(false);
      await fetchVouchers();
    } catch (e: any) {
      console.error('[saveVoucher] Error:', e);
      toastRef.current?.show({
        severity: 'error',
        summary: t('common.error', { defaultValue: 'Lỗi' }),
        detail: e?.message || 'Không thể lưu voucher, vui lòng thử lại sau!',
        life: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveItem = () => {
    if (isEdit) {
      confirmDialog({
        message: `Bạn có chắc chắn muốn cập nhật thay đổi cho voucher ${formData.voucherCode || ''}?`,
        header: t('common.confirm_update', { defaultValue: 'Xác nhận cập nhật voucher' }),
        icon: 'pi pi-info-circle',
        acceptLabel: t('common.save', { defaultValue: 'Lưu thay đổi' }),
        rejectLabel: t('common.cancel', { defaultValue: 'Hủy' }),
        accept: handleSaveConfirmed,
      });
    } else {
      handleSaveConfirmed();
    }
  };

  const downloadSampleCsv = () => {
    const csvContent =
      'CODE,TITLE,DISCOUNT_VAL,POINTS_COST,TOTAL_QTY,DISCOUNT_TYPE\n' +
      'NATCASH_SUMMER50,Voucher Mùa Hè 50 HTG,50,50,500,FIXED_AMOUNT\n' +
      'DELIMART_DISCOUNT10,Giảm 10% Siêu Thị Delimart,10,100,1000,PERCENTAGE\n' +
      'NATCOM_DATA4G,Gói Data 4G Natcom 1GB,30,40,2000,FIXED_AMOUNT\n' +
      'FAHASA_BOOK20K,Phiếu Mua Sách Fahasa 20 HTG,20,30,800,FIXED_AMOUNT\n' +
      'HIGHLANDS_COFFEE50,Voucher Cà Phê Highlands 50 HTG,50,60,600,FIXED_AMOUNT\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'voucher_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportCsv = async (event: any) => {
    const file = event.files?.[0];
    if (!file) return;

    setIsSubmitting(true);
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((l: string) => l.trim().length > 0);
      if (lines.length <= 1) {
        toastRef.current?.show({
          severity: 'warn',
          summary: t('common.warning', { defaultValue: 'Cảnh báo' }),
          detail: t('voucher.csv_empty', { defaultValue: 'Tệp CSV không có dữ liệu' }),
        });
        setIsSubmitting(false);
        return;
      }

      const startIndex = lines[0].toUpperCase().includes('CODE') ? 1 : 0;
      const voucherList: any[] = [];

      for (let i = startIndex; i < lines.length; i++) {
        const parts = lines[i].split(',').map((p: string) => p.trim().replace(/^["']|["']$/g, ''));
        if (parts.length >= 2 && parts[0]) {
          const code = parts[0];
          const title = parts[1] || `Voucher ${code}`;
          const discountVal = parseFloat(parts[2]) || 50;
          const pointsCost = parseFloat(parts[3]) || 50;
          const totalQty = parseInt(parts[4]) || 1000;
          const discountType = parts[5]?.toUpperCase() === 'PERCENTAGE' ? 'PERCENTAGE' : 'FIXED_AMOUNT';

          voucherList.push({
            voucherCode: code,
            title: title,
            description: `Voucher ưu đãi ${title}`,
            discountValue: discountVal,
            discountType: discountType,
            pointCost: pointsCost,
            totalQuantity: totalQty,
            minBillAmount: 0,
            status: 'ACTIVE',
          });
        }
      }

      if (voucherList.length > 0) {
        await LoyaltyService.batchImportVouchers(voucherList, selectedTenant);
        toastRef.current?.show({
          severity: 'success',
          summary: t('common.success', { defaultValue: 'Thành công' }),
          detail: t('voucher.import_success', {
            defaultValue: `Đã nhập thành công ${voucherList.length} mã voucher từ CSV`,
            count: voucherList.length,
          }),
        });
        setShowImportDialog(false);
        await fetchVouchers();
      }
    } catch (e: any) {
      console.error('[handleImportCsv] Error:', e);
      toastRef.current?.show({
        severity: 'error',
        summary: t('common.error', { defaultValue: 'Lỗi' }),
        detail: e?.message || t('voucher.import_failed', { defaultValue: 'Không thể đọc hoặc xử lý tệp CSV' }),
      });
    } finally {
      setIsSubmitting(false);
    }
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
      <Toast ref={toastRef} position="top-center" />
      <ConfirmDialog />
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
        style={{ width: '480px' }}
        header={t('voucher.import_csv_title', { defaultValue: 'Nhập lô Voucher từ CSV' })}
        modal
        onHide={() => setShowImportDialog(false)}
      >
        <div className="p-fluid">
          <p className="text-secondary mb-2">
            {t('voucher.import_instruction', {
              defaultValue: 'Tải lên tệp CSV chứa danh sách mã voucher (Cột: CODE, TITLE, DISCOUNT_VAL, POINTS_COST, TOTAL_QTY, DISCOUNT_TYPE)',
            })}
          </p>

          <div className="mb-3 flex justify-content-between align-items-center surface-100 p-2 border-round">
            <span className="text-xs text-600 font-semibold">Tệp mẫu chuẩn (.csv):</span>
            <Button
              label="Tải file mẫu CSV"
              icon="pi pi-download"
              size="small"
              outlined
              severity="help"
              onClick={downloadSampleCsv}
              type="button"
            />
          </div>

          <FileUpload
            mode="basic"
            name="file"
            accept=".csv, text/csv, application/vnd.ms-excel, text/plain, application/csv, text/x-csv, text/comma-separated-values, *"
            maxFileSize={10000000}
            customUpload
            uploadHandler={handleImportCsv}
            auto
            chooseLabel={t('common.choose_file', { defaultValue: 'Chọn tệp CSV từ máy tính' })}
          />
          {isSubmitting && (
            <div className="mt-3 text-center text-primary font-semibold">
              <i className="pi pi-spin pi-spinner mr-2" />
              Đang xử lý nhập dữ liệu vào kho...
            </div>
          )}
        </div>
      </Dialog>
    </div>
  );
};
export default VoucherManagementPage;
