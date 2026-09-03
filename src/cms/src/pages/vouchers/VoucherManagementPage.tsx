import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Toast } from 'primereact/toast';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Calendar } from 'primereact/calendar';
import { Tag } from 'primereact/tag';
import { Dropdown } from 'primereact/dropdown';
import { FileUpload } from 'primereact/fileupload';
import { useTranslation } from 'react-i18next';
import { AppBreadcrumb } from 'components';
import { TenantSelector } from '@/components/TenantSelector';
import { CommonStatus, DiscountType } from '@/models';
import { LoyaltyService, PartnerItemModel, VoucherItemModel } from '@/service/loyalty.service';

export interface VoucherItem {
  id: number;
  voucherCode: string;
  title: string;
  description?: string;
  partnerId?: number | null;
  partnerCode?: string;
  partnerName?: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderValue: number;
  maxDiscountAmount?: number;
  pointsRequired: number;
  totalQuantity: number;
  remainingQuantity: number;
  validFrom: string;
  validTo: string;
  status: CommonStatus;
}

export const VoucherManagementPage: React.FC = () => {
  const { t } = useTranslation();
  const toastRef = useRef<Toast>(null);

  const [selectedTenant, setSelectedTenant] = useState<string>(
    () => localStorage.getItem('selected_tenant_id') || 'TENANT_NATCASH'
  );
  const [vouchers, setVouchers] = useState<VoucherItem[]>([]);
  const [partners, setPartners] = useState<PartnerItemModel[]>([]);
  const [selectedVouchers, setSelectedVouchers] = useState<VoucherItem[]>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importDefaultPartnerId, setImportDefaultPartnerId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<VoucherItem>>({});
  const [isEdit, setIsEdit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  // 1. Tải danh sách Voucher theo Liên minh
  const fetchVouchers = useCallback(async (tenantId: string) => {
    setLoading(true);
    try {
      const data = await LoyaltyService.getVouchers(tenantId);
      if (data && data.length > 0) {
        setVouchers(
          data.map((item: VoucherItemModel) => ({
            id: item.id,
            voucherCode: item.voucherCode,
            title: item.title,
            description: item.description,
            partnerId: item.partnerId || null,
            partnerCode: item.partnerCode || 'ALL',
            partnerName: item.partnerName || (item.partnerId ? `Đối tác #${item.partnerId}` : 'Toàn Hệ Sinh Thái'),
            discountType: (item.discountType as DiscountType) || DiscountType.FIXED_AMOUNT,
            discountValue: item.discountValue || 0,
            minOrderValue: item.minBillAmount || 0,
            maxDiscountAmount: item.maxDiscountAmount || item.discountValue || 0,
            pointsRequired: item.pointCost || 0,
            totalQuantity: item.totalQuantity || 0,
            remainingQuantity: item.availableQuantity != null ? item.availableQuantity : item.totalQuantity || 0,
            validFrom: item.startDate ? String(item.startDate).substring(0, 10) : new Date().toISOString().substring(0, 10),
            validTo: item.endDate ? String(item.endDate).substring(0, 10) : new Date(Date.now() + 90 * 86400000).toISOString().substring(0, 10),
            status: (item.status as CommonStatus) || CommonStatus.ACTIVE,
          }))
        );
      } else {
        setVouchers([]);
      }
    } catch (e) {
      console.error('[fetchVouchers] Error:', e);
      setVouchers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. Tải danh sách Đối tác theo Liên minh để phục vụ chọn Partner
  const fetchPartners = useCallback(async (tenantId: string) => {
    try {
      const data = await LoyaltyService.getPartners(tenantId);
      setPartners(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('[fetchPartners] Error:', e);
      setPartners([]);
    }
  }, []);

  // Xử lý khi thay đổi Liên minh
  const handleTenantChange = (newTenantId: string) => {
    setSelectedTenant(newTenantId);
    localStorage.setItem('selected_tenant_id', newTenantId);
    fetchVouchers(newTenantId);
    fetchPartners(newTenantId);
  };

  useEffect(() => {
    fetchVouchers(selectedTenant);
    fetchPartners(selectedTenant);
  }, [selectedTenant, fetchVouchers, fetchPartners]);

  // Dropdown options chọn đối tác
  const partnerDropdownOptions = useMemo(() => {
    return [
      {
        label: `🌟 ${t('voucher.scope_all_alliance', { defaultValue: 'Toàn Hệ Sinh Thái (Tất cả đối tác liên minh)' })}`,
        value: null,
      },
      ...partners.map((p) => ({
        label: `${p.partnerName} (${p.partnerCode})`,
        value: p.id,
        partner: p,
      })),
    ];
  }, [partners, t]);

  const partnerOptionTemplate = (option: any) => {
    if (!option) return null;
    if (option.value === null) {
      return (
        <div className="flex align-items-center gap-2 py-1">
          <i className="pi pi-globe text-primary font-medium" />
          <span className="font-semibold text-primary">{option.label}</span>
        </div>
      );
    }
    const p = option.partner || option;
    return (
      <div className="flex align-items-center justify-content-between w-full py-1 gap-2">
        <div className="flex align-items-center gap-2">
          <i className="pi pi-building text-600" />
          <span className="font-medium text-900">{p.partnerName}</span>
        </div>
        <Tag value={p.partnerCode} severity="info" className="text-xs font-mono" />
      </div>
    );
  };

  // Mở modal tạo mới
  const openNew = () => {
    const today = new Date().toISOString().substring(0, 10);
    const end90Days = new Date(Date.now() + 90 * 86400000).toISOString().substring(0, 10);

    setFormData({
      voucherCode: 'VCH_' + Math.floor(10000 + Math.random() * 90000),
      title: '',
      description: '',
      partnerId: null, // Mặc định: Toàn hệ sinh thái
      discountType: DiscountType.FIXED_AMOUNT,
      discountValue: 50,
      minOrderValue: 150,
      maxDiscountAmount: 50,
      pointsRequired: 50,
      totalQuantity: 1000,
      remainingQuantity: 1000,
      validFrom: today,
      validTo: end90Days,
      status: CommonStatus.ACTIVE,
    });
    setIsEdit(false);
    setShowDialog(true);
  };

  // Mở modal chỉnh sửa
  const editItem = (item: VoucherItem) => {
    setFormData({ ...item });
    setIsEdit(true);
    setShowDialog(true);
  };

  // Xóa voucher
  const deleteItem = (item: VoucherItem) => {
    confirmDialog({
      message: t('voucher.confirm_delete_msg', {
        code: item.voucherCode,
        title: item.title,
        defaultValue: `Bạn có chắc chắn muốn xóa voucher "${item.voucherCode}" (${item.title}) khỏi hệ thống?`,
      }),
      header: t('common.confirm_delete', { defaultValue: 'Xác nhận xóa voucher' }),
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      acceptLabel: t('common.yes', { defaultValue: 'Xác nhận xóa' }),
      rejectLabel: t('common.no', { defaultValue: 'Hủy' }),
      accept: async () => {
        setLoading(true);
        try {
          await LoyaltyService.deleteVoucher(item.id, selectedTenant);
          toastRef.current?.show({
            severity: 'success',
            summary: t('common.success', { defaultValue: 'Thành công' }),
            detail: t('voucher.delete_success', { code: item.voucherCode, defaultValue: `Đã xóa thành công voucher ${item.voucherCode}!` }),
            life: 3000,
          });
          await fetchVouchers(selectedTenant);
        } catch (e: any) {
          console.error('[deleteVoucher] Error:', e);
          toastRef.current?.show({
            severity: 'error',
            summary: t('common.error', { defaultValue: 'Lỗi' }),
            detail: e?.message || t('voucher.delete_failed', { defaultValue: 'Không thể xóa voucher, vui lòng thử lại sau!' }),
            life: 4000,
          });
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // Lưu voucher (Thêm / Sửa)
  const handleSaveConfirmed = async () => {
    setIsSubmitting(true);
    try {
      const payload: Partial<VoucherItemModel> = {
        voucherCode: (formData.voucherCode || '').trim().toUpperCase(),
        title: (formData.title || '').trim(),
        description: formData.description || '',
        partnerId: formData.partnerId != null ? Number(formData.partnerId) : undefined,
        discountType: formData.discountType || DiscountType.FIXED_AMOUNT,
        discountValue: formData.discountValue || 0,
        minBillAmount: formData.minOrderValue || 0,
        maxDiscountAmount: formData.maxDiscountAmount,
        pointCost: formData.pointsRequired || 0,
        totalQuantity: formData.totalQuantity || 1000,
        startDate: formData.validFrom ? new Date(formData.validFrom).toISOString() : new Date().toISOString(),
        endDate: formData.validTo ? new Date(formData.validTo).toISOString() : new Date(Date.now() + 90 * 86400000).toISOString(),
        status: formData.status || CommonStatus.ACTIVE,
      };

      if (isEdit && formData.id) {
        await LoyaltyService.updateVoucher(formData.id, payload, selectedTenant);
        toastRef.current?.show({
          severity: 'success',
          summary: t('common.success', { defaultValue: 'Thành công' }),
          detail: t('voucher.update_success', { code: formData.voucherCode || '', defaultValue: `Cập nhật thành công voucher ${formData.voucherCode || ''}!` }),
          life: 3000,
        });
      } else {
        await LoyaltyService.createVoucher(payload, selectedTenant);
        toastRef.current?.show({
          severity: 'success',
          summary: t('common.success', { defaultValue: 'Thành công' }),
          detail: t('voucher.create_success', { defaultValue: 'Thêm mới voucher vào kho thành công!' }),
          life: 3000,
        });
      }
      setShowDialog(false);
      await fetchVouchers(selectedTenant);
    } catch (e: any) {
      console.error('[saveVoucher] Error:', e);
      toastRef.current?.show({
        severity: 'error',
        summary: t('common.error', { defaultValue: 'Lỗi' }),
        detail: e?.message || t('voucher.save_failed', { defaultValue: 'Không thể lưu voucher, vui lòng kiểm tra lại dữ liệu!' }),
        life: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveItem = () => {
    if (!formData.voucherCode || !formData.title) {
      toastRef.current?.show({
        severity: 'warn',
        summary: t('common.warning', { defaultValue: 'Cảnh báo' }),
        detail: 'Vui lòng nhập đầy đủ Mã voucher và Tiêu đề voucher!',
        life: 3000,
      });
      return;
    }

    if (isEdit) {
      confirmDialog({
        message: t('voucher.confirm_update_msg', { code: formData.voucherCode || '', defaultValue: `Bạn có chắc chắn muốn cập nhật thay đổi cho voucher ${formData.voucherCode || ''}?` }),
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

  // Tải file mẫu CSV (Bổ sung UTF-8 BOM \uFEFF để Microsoft Excel trên Windows tự động nhận diện tiếng Việt)
  const downloadSampleCsv = () => {
    const csvContent =
      '\uFEFF' +
      'CODE,TITLE,DISCOUNT_VAL,POINTS_COST,TOTAL_QTY,DISCOUNT_TYPE,PARTNER_CODE,MIN_ORDER\n' +
      'DELIMART_GIAM_50K,Voucher Mua Sắm Siêu Thị Delimart 50 HTG,50,50,500,FIXED_AMOUNT,DELIMART_RETAIL,200\n' +
      'NATCOM_DATA_1GB,Gói Data 4G Natcom 1GB Tốc Độ Cao,30,40,2000,FIXED_AMOUNT,NATCOM_TELCO,0\n' +
      'NATCASH_CASHBACK_10,Voucher Hoàn Tiền Ví Natcash 10%,10,100,1000,PERCENTAGE,NATCASH_WALLET,150\n' +
      'ALLIANCE_CHAO_BAN_MOI,Voucher Chào Mừng Hội Viên Mới Giảm 20 HTG,20,0,5000,FIXED_AMOUNT,,100\n';

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

  // Xử lý nhập file CSV (Đọc UTF-8 chuẩn xác)
  const handleImportCsv = async (event: any) => {
    const file = event.files?.[0];
    if (!file) return;

    setIsSubmitting(true);
    try {
      // Sử dụng FileReader với mã hóa UTF-8 rõ ràng
      const text = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve((e.target?.result as string) || '');
        reader.onerror = (e) => reject(e);
        reader.readAsText(file, 'UTF-8');
      });

      // Loại bỏ BOM nếu tệp upload đã có BOM
      const cleanText = text.replace(/^\uFEFF/, '');
      const lines = cleanText.split(/\r?\n/).filter((l: string) => l.trim().length > 0);

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
          const partnerCode = parts[6] ? parts[6].trim().toUpperCase() : undefined;
          const minOrder = parseFloat(parts[7]) || 0;

          voucherList.push({
            voucherCode: code,
            title: title,
            description: `Voucher ưu đãi ${title}`,
            partnerCode: partnerCode,
            partnerId: !partnerCode && importDefaultPartnerId != null ? importDefaultPartnerId : undefined,
            discountValue: discountVal,
            discountType: discountType,
            pointCost: pointsCost,
            totalQuantity: totalQty,
            minBillAmount: minOrder,
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
        await fetchVouchers(selectedTenant);
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

  // Templates cho bảng dữ liệu
  const actionTemplate = (rowData: VoucherItem) => (
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

  const statusTemplate = (rowData: VoucherItem) => {
    return rowData.status === CommonStatus.ACTIVE ? (
      <Tag severity="success" value={t('common.active', { defaultValue: 'Đang áp dụng' })} />
    ) : (
      <Tag severity="danger" value={t('common.inactive', { defaultValue: 'Tạm dừng' })} />
    );
  };

  const discountBadgeTemplate = (rowData: VoucherItem) => {
    return rowData.discountType === DiscountType.PERCENTAGE ? (
      <span className="text-primary font-medium font-mono">Giảm {rowData.discountValue}%</span>
    ) : (
      <span className="text-green-600 font-medium font-mono">-{rowData.discountValue} HTG</span>
    );
  };

  const partnerScopeTemplate = (rowData: VoucherItem) => {
    if (!rowData.partnerId) {
      return (
        <Tag
          severity="info"
          icon="pi pi-globe"
          value={t('voucher.scope_all_short', { defaultValue: 'Toàn Hệ Sinh Thái' })}
          className="text-xs"
        />
      );
    }
    return (
      <div className="flex flex-column gap-1">
        <span className="font-medium text-900 text-sm">{rowData.partnerName}</span>
        {rowData.partnerCode && rowData.partnerCode !== 'ALL' && (
          <Tag value={rowData.partnerCode} severity="warning" className="text-xs font-mono w-fit" />
        )}
      </div>
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
    <div className="flex flex-column md:flex-row md:align-items-center md:justify-content-between gap-3">
      <div className="flex align-items-center gap-3">
        <h4 className="m-0 text-primary font-bold">
          <i className="pi pi-ticket mr-2 text-xl" />
          {t('voucher.management_title', { defaultValue: 'Quản trị Kho Quà & Phiếu Ưu Đãi (Vouchers)' })}
        </h4>
        <TenantSelector value={selectedTenant} onChange={handleTenantChange} />
      </div>
      <div className="flex flex-wrap gap-2 align-items-center">
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            type="search"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder={t('common.search', { defaultValue: 'Tìm kiếm voucher...' })}
            className="p-inputtext-sm w-14rem"
          />
        </span>
        <Button
          label={t('voucher.import_csv', { defaultValue: 'Nhập CSV' })}
          icon="pi pi-upload"
          severity="help"
          size="small"
          onClick={() => setShowImportDialog(true)}
        />
        <Button
          label={t('voucher.add_new', { defaultValue: 'Tạo Voucher' })}
          icon="pi pi-plus"
          severity="success"
          size="small"
          onClick={openNew}
        />
        <Button
          icon="pi pi-refresh"
          outlined
          size="small"
          onClick={() => fetchVouchers(selectedTenant)}
          loading={loading}
          tooltip={t('common.refresh', { defaultValue: 'Làm mới' })}
        />
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
          globalFilter={globalFilter}
          responsiveLayout="scroll"
          emptyMessage={t('common.no_data', { defaultValue: 'Chưa có voucher nào cho liên minh này' })}
        >
          <Column selectionMode="multiple" exportable={false} style={{ width: '3rem' }} />
          <Column
            field="voucherCode"
            header={t('voucher.code', { defaultValue: 'Mã Voucher' })}
            body={(row: VoucherItem) => <span className="font-bold text-primary font-mono">{row.voucherCode}</span>}
            sortable
            style={{ minWidth: '9.5rem' }}
          />
          <Column
            field="title"
            header={t('voucher.title_label', { defaultValue: 'Tiêu Đề Voucher' })}
            body={(row: VoucherItem) => (
              <div>
                <div className="font-semibold text-900">{row.title}</div>
                {row.description && <div className="text-xs text-500 line-clamp-1">{row.description}</div>}
              </div>
            )}
            sortable
            style={{ minWidth: '13rem' }}
          />
          <Column
            field="partnerScope"
            header={<span title={t('voucher.partner_scope_tooltip', { defaultValue: 'Đối tác áp dụng voucher hoặc Toàn hệ sinh thái' })}>{t('voucher.partner_scope', { defaultValue: 'Phạm Vi Áp Dụng' })}</span>}
            body={partnerScopeTemplate}
            sortable
            style={{ minWidth: '13rem' }}
          />
          <Column
            field="discountValue"
            header={<span title={t('voucher.discount_tooltip', { defaultValue: 'Mức giảm giá trực tiếp hoặc theo phần trăm' })}>{t('voucher.discount_value', { defaultValue: 'Mức Giảm' })}</span>}
            body={discountBadgeTemplate}
            sortable
            style={{ minWidth: '8rem', textAlign: 'center' }}
          />
          <Column
            field="minOrderValue"
            header={<span title={t('voucher.min_order_tooltip', { defaultValue: 'Giá trị đơn hàng tối thiểu để áp dụng voucher' })}>{t('voucher.min_order', { defaultValue: 'Đơn Tối Thiểu' })}</span>}
            body={(row: VoucherItem) => <span className="font-mono">{row.minOrderValue} HTG</span>}
            sortable
            style={{ minWidth: '8.5rem', textAlign: 'center' }}
          />
          <Column
            field="pointsRequired"
            header={<span title={t('voucher.points_cost_tooltip', { defaultValue: 'Số điểm cần tiêu để đổi phiếu voucher này' })}>{t('voucher.points_cost', { defaultValue: 'Điểm Đổi' })}</span>}
            body={(row: VoucherItem) => (
              <span className="text-orange-500 font-medium font-mono">
                <i className="pi pi-star-fill mr-1 text-xs" />
                {row.pointsRequired}
              </span>
            )}
            sortable
            style={{ minWidth: '7.5rem', textAlign: 'center' }}
          />
          <Column
            field="remainingQuantity"
            header={<span title={t('voucher.inventory_tooltip', { defaultValue: 'Số lượng còn lại trong kho / Tổng phát hành' })}>{t('voucher.inventory', { defaultValue: 'Kho / Tổng' })}</span>}
            body={(row: VoucherItem) => (
              <span className="font-mono text-sm">
                <strong className="text-primary">{row.remainingQuantity}</strong> / {row.totalQuantity}
              </span>
            )}
            sortable
            style={{ minWidth: '8rem', textAlign: 'center' }}
          />
          <Column
            field="validFrom"
            header={<span title={t('voucher.date_range_tooltip', { defaultValue: 'Thời hạn hiệu lực của voucher' })}>{t('voucher.date_range', { defaultValue: 'Thời Hạn' })}</span>}
            body={(row: VoucherItem) => (
              <span className="text-xs text-600 font-mono">
                {row.validFrom} &rarr; {row.validTo}
              </span>
            )}
            sortable
            style={{ minWidth: '10.5rem', textAlign: 'center' }}
          />
          <Column field="status" header={t('common.status', { defaultValue: 'Trạng Thái' })} body={statusTemplate} sortable style={{ minWidth: '8.5rem', textAlign: 'center' }} />
          <Column body={actionTemplate} exportable={false} style={{ width: '6rem', textAlign: 'center' }} />
        </DataTable>
      </div>

      {/* MODAL DIALOG: THÊM / SỬA VOUCHER */}
      <Dialog
        visible={showDialog}
        style={{ width: '540px' }}
        header={isEdit ? t('voucher.edit_title', { defaultValue: 'Cập nhật Phiếu Ưu Đãi' }) : t('voucher.create_title', { defaultValue: 'Tạo mới Phiếu Ưu Đãi' })}
        modal
        className="p-fluid border-round-xl"
        onHide={() => setShowDialog(false)}
      >
        {/* Dropdown Chọn Đối Tác */}
        <div className="field mb-3">
          <label htmlFor="partnerSelector" className="font-bold text-900">
            {t('voucher.select_partner', { defaultValue: 'Đối Tác Áp Dụng Voucher' })}
          </label>
          <Dropdown
            id="partnerSelector"
            value={formData.partnerId}
            options={partnerDropdownOptions}
            onChange={(e) => setFormData({ ...formData, partnerId: e.value })}
            optionLabel="label"
            optionValue="value"
            itemTemplate={partnerOptionTemplate}
            placeholder={t('voucher.select_partner_placeholder', { defaultValue: 'Chọn đối tác hoặc Toàn hệ sinh thái...' })}
            className="w-full"
            appendTo="self"
          />
          <small className="text-500 block mt-1">
            {formData.partnerId == null
              ? '🌟 Voucher này có thể áp dụng tại TẤT CẢ các điểm bán trong liên minh.'
              : '🏢 Voucher độc quyền, chỉ áp dụng tại điểm bán của đối tác được chọn.'}
          </small>
        </div>

        <div className="formgrid grid mb-3">
          <div className="field col-6">
            <label htmlFor="voucherCode" className="font-bold text-900">
              {t('voucher.code', { defaultValue: 'Mã Voucher' })} <span className="text-red-500">*</span>
            </label>
            <InputText
              id="voucherCode"
              value={formData.voucherCode || ''}
              onChange={(e) => setFormData({ ...formData, voucherCode: e.target.value.toUpperCase() })}
              placeholder="VD: DELIMART_GIAM_50K"
              disabled={isEdit}
            />
          </div>
          <div className="field col-6">
            <label htmlFor="discountType" className="font-bold text-900">{t('voucher.discount_type', { defaultValue: 'Loại ưu đãi' })}</label>
            <Dropdown
              id="discountType"
              value={formData.discountType}
              options={discountTypeOptions}
              onChange={(e) => setFormData({ ...formData, discountType: e.value })}
              appendTo="self"
            />
          </div>
        </div>

        <div className="field mb-3">
          <label htmlFor="title" className="font-bold text-900">
            {t('voucher.title_label', { defaultValue: 'Tiêu Đề Voucher' })} <span className="text-red-500">*</span>
          </label>
          <InputText
            id="title"
            value={formData.title || ''}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="VD: Giảm 50 HTG cho hóa đơn từ 200 HTG"
          />
        </div>

        <div className="field mb-3">
          <label htmlFor="description" className="font-bold text-900">{t('common.description', { defaultValue: 'Mô tả & Điều kiện sử dụng' })}</label>
          <InputText
            id="description"
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="VD: Áp dụng tại quầy thu ngân Siêu thị Delimart..."
          />
        </div>

        <div className="formgrid grid mb-3">
          <div className="field col-6">
            <label htmlFor="discountValue" className="font-bold text-900">
              {formData.discountType === DiscountType.PERCENTAGE ? 'Mức giảm (%)' : 'Mức giảm (HTG)'}
            </label>
            <InputNumber
              id="discountValue"
              value={formData.discountValue}
              onValueChange={(e) => setFormData({ ...formData, discountValue: e.value || 0 })}
              min={0}
              suffix={formData.discountType === DiscountType.PERCENTAGE ? ' %' : ' HTG'}
            />
          </div>
          <div className="field col-6">
            <label htmlFor="minOrderValue" className="font-bold text-900">{t('voucher.min_order', { defaultValue: 'Đơn tối thiểu (HTG)' })}</label>
            <InputNumber
              id="minOrderValue"
              value={formData.minOrderValue}
              onValueChange={(e) => setFormData({ ...formData, minOrderValue: e.value || 0 })}
              min={0}
              suffix=" HTG"
            />
          </div>
        </div>

        <div className="formgrid grid mb-3">
          <div className="field col-6">
            <label htmlFor="pointsRequired" className="font-bold text-900">{t('voucher.points_cost', { defaultValue: 'Điểm đổi (0 = Quà tặng)' })}</label>
            <InputNumber
              id="pointsRequired"
              value={formData.pointsRequired}
              onValueChange={(e) => setFormData({ ...formData, pointsRequired: e.value || 0 })}
              min={0}
              placeholder="0"
            />
          </div>
          <div className="field col-6">
            <label htmlFor="totalQuantity" className="font-bold text-900">{t('voucher.total_quantity', { defaultValue: 'Tổng số lượng phát hành' })}</label>
            <InputNumber
              id="totalQuantity"
              value={formData.totalQuantity}
              onValueChange={(e) => setFormData({ ...formData, totalQuantity: e.value || 0 })}
              min={1}
            />
          </div>
        </div>

        {/* Thời gian hiệu lực */}
        <div className="formgrid grid mb-3">
          <div className="field col-6">
            <label htmlFor="validFrom" className="font-bold text-900">{t('voucher.valid_from', { defaultValue: 'Hiệu lực từ ngày' })}</label>
            <Calendar
              id="validFrom"
              value={formData.validFrom ? new Date(formData.validFrom) : null}
              onChange={(e) => setFormData({ ...formData, validFrom: e.value ? (e.value as Date).toISOString().substring(0, 10) : '' })}
              dateFormat="yy-mm-dd"
              showIcon
              appendTo="self"
            />
          </div>
          <div className="field col-6">
            <label htmlFor="validTo" className="font-bold text-900">{t('voucher.valid_to', { defaultValue: 'Hiệu lực đến ngày' })}</label>
            <Calendar
              id="validTo"
              value={formData.validTo ? new Date(formData.validTo) : null}
              onChange={(e) => setFormData({ ...formData, validTo: e.value ? (e.value as Date).toISOString().substring(0, 10) : '' })}
              dateFormat="yy-mm-dd"
              showIcon
              appendTo="self"
            />
          </div>
        </div>

        <div className="field mb-3">
          <label htmlFor="status" className="font-bold text-900">{t('common.status', { defaultValue: 'Trạng thái' })}</label>
          <Dropdown
            id="status"
            value={formData.status}
            options={statusOptions}
            onChange={(e) => setFormData({ ...formData, status: e.value })}
            appendTo="self"
          />
        </div>

        <div className="flex justify-content-end gap-2 mt-4">
          <Button label={t('common.cancel', { defaultValue: 'Hủy' })} icon="pi pi-times" outlined onClick={() => setShowDialog(false)} />
          <Button label={t('common.save', { defaultValue: 'Lưu Voucher' })} icon="pi pi-check" onClick={saveItem} loading={isSubmitting} severity="primary" />
        </div>
      </Dialog>

      {/* MODAL DIALOG: IMPORT CSV */}
      <Dialog
        visible={showImportDialog}
        style={{ width: '520px' }}
        header={t('voucher.import_csv_title', { defaultValue: 'Nhập lô Voucher từ tệp CSV' })}
        modal
        className="border-round-xl"
        onHide={() => setShowImportDialog(false)}
      >
        <div className="p-fluid">
          <p className="text-secondary mb-3 text-sm">
            {t('voucher.import_instruction', {
              defaultValue: 'Tải lên tệp CSV chứa danh sách mã voucher (Cột: CODE, TITLE, DISCOUNT_VAL, POINTS_COST, TOTAL_QTY, DISCOUNT_TYPE, PARTNER_CODE, MIN_ORDER)',
            })}
          </p>

          {/* Chọn đối tác mặc định cho file CSV nếu dòng không ghi mã */}
          <div className="field mb-3 surface-100 p-3 border-round">
            <label htmlFor="importPartner" className="font-bold text-sm text-900 block mb-1">
              {t('voucher.import_partner_label', { defaultValue: 'Đối Tác Mặc Định Cho File Này (Nếu dòng CSV để trống PARTNER_CODE):' })}
            </label>
            <Dropdown
              id="importPartner"
              value={importDefaultPartnerId}
              options={partnerDropdownOptions}
              onChange={(e) => setImportDefaultPartnerId(e.value)}
              className="w-full"
              appendTo="self"
            />
          </div>

          <div className="mb-3 flex justify-content-between align-items-center surface-100 p-2 border-round">
            <span className="text-xs text-600 font-semibold">{t('voucher.sample_csv_label', { defaultValue: 'Tệp mẫu chuẩn (.csv):' })}</span>
            <Button
              label={t('voucher.download_sample_csv', { defaultValue: 'Tải file mẫu CSV' })}
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
              {t('voucher.importing_csv_notice', { defaultValue: 'Đang xử lý nhập dữ liệu vào kho...' })}
            </div>
          )}
        </div>
      </Dialog>
    </div>
  );
};

export default VoucherManagementPage;
