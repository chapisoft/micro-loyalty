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
import { Steps } from 'primereact/steps';
import { SelectButton } from 'primereact/selectbutton';
import { MultiSelect } from 'primereact/multiselect';
import { InputSwitch } from 'primereact/inputswitch';
import { useTranslation } from 'react-i18next';
import { StandardPageHeader } from '@/components/StandardPageHeader';
import { UniversalFilterBar } from '@/components/UniversalFilterBar';
import { StandardRowActions, RowActionItem } from '@/components/StandardRowActions';
import { StatusBadge } from '@/components/StatusBadge';
import { exportToExcel } from '@/components/exportHelper';
import { TenantSelector } from '@/components/TenantSelector';
import { ImageUploadField } from '@/components/ImageUploadField';
import {
  AudienceRole,
  CommonStatus,
  DiscountType,
  MediaFolder,
  VoucherAcquireType,
  VoucherBatchPeriod,
  VoucherUsageType,
} from '@/models';
import { categoryService, GeneralCategory } from '@/service/category.service';
import {
  LoyaltyService,
  NatcashPaymentPointModel,
  PartnerItemModel,
  TierConfigModel,
  VoucherItemModel,
} from '@/service/loyalty.service';

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
  // VQ-04 "How customers get it" / "How customers use it"
  acquireType: 'COINS' | 'FREE_COLLECT' | 'GIVEN';
  usageType: 'NATCASH_STORE' | 'PARTNER_CODE' | 'ONLINE';
  categoryCode?: string;
  audienceRole: 'CUSTOMER' | 'AGENT' | 'SUPER_AGENT';
  eligibleTiers: string[];
  perCustomerLimit?: number;
  batchQuantity?: number;
  batchPeriod: 'NONE' | 'DAILY' | 'WEEKLY';
  validDaysAfterCollect?: number;
  requireEkyc: boolean;
  showInFreeStrip: boolean;
  stripOrder?: number;
  serviceLink?: string;
  branchScope?: string;
  branchCodes?: string[];
  imageUrl?: string;
  /** Name and condition in English, Français, Kreyòl (stored as i18nJson) */
  i18n: Record<'en' | 'fr' | 'ht', { name?: string; condition?: string }>;
}

const VOUCHER_CATEGORY_GROUP = 'VOUCHER_CATEGORY';
const EMPTY_I18N = { en: {}, fr: {}, ht: {} } as VoucherItem['i18n'];
const parseI18n = (raw?: string): VoucherItem['i18n'] => {
  try {
    return { ...EMPTY_I18N, ...(raw ? JSON.parse(raw) : {}) };
  } catch {
    return { ...EMPTY_I18N };
  }
};
const parseBranchScope = (raw?: string): string[] => {
  if (!raw || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map((x) => String(x).trim()).filter(Boolean);
  } catch {
    // fallback comma-separated
  }
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
};

export const VoucherManagementPage: React.FC = () => {
  const { t } = useTranslation();
  const toastRef = useRef<Toast>(null);

  const [selectedTenant, setSelectedTenant] = useState<string>('ALL');
  const [vouchers, setVouchers] = useState<VoucherItem[]>([]);
  const [partners, setPartners] = useState<PartnerItemModel[]>([]);
  const [voucherCategories, setVoucherCategories] = useState<GeneralCategory[]>([]);
  const [tiers, setTiers] = useState<TierConfigModel[]>([]);
  const [paymentPoints, setPaymentPoints] = useState<NatcashPaymentPointModel[]>([]);
  const [previewLang, setPreviewLang] = useState<'en' | 'fr' | 'ht'>('en');
  const [selectedVouchers, setSelectedVouchers] = useState<VoucherItem[]>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importDefaultPartnerId, setImportDefaultPartnerId] = useState<number | null>(null);
  const [importStep, setImportStep] = useState<number>(0);
  const [importFileName, setImportFileName] = useState<string>('');
  const [importPreviewRows, setImportPreviewRows] = useState<
    Array<{
      rowNumber: number;
      voucherCode: string;
      title: string;
      discountValue: number;
      discountType: string;
      pointCost: number;
      totalQuantity: number;
      minBillAmount: number;
      partnerCode?: string;
      partnerId?: number;
      isValid: boolean;
      errorMessage?: string;
    }>
  >([]);
  const [importSummary, setImportSummary] = useState<{
    importedCount: number;
    skippedCount: number;
  } | null>(null);
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
            partnerName: item.partnerName || (item.partnerId ? t('voucher.partner_fallback', { id: item.partnerId }) : t('voucher.all_ecosystem')),
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
            acquireType: item.acquireType || 'COINS',
            usageType: item.usageType || 'PARTNER_CODE',
            categoryCode: item.categoryCode,
            audienceRole: item.audienceRole || 'CUSTOMER',
            eligibleTiers: item.eligibleTiers || [],
            perCustomerLimit: item.perCustomerLimit,
            batchQuantity: item.batchQuantity,
            batchPeriod: item.batchPeriod || 'NONE',
            validDaysAfterCollect: item.validDaysAfterCollect,
            requireEkyc: !!item.requireEkyc,
            showInFreeStrip: !!item.showInFreeStrip,
            stripOrder: item.stripOrder,
            serviceLink: item.serviceLink,
            branchScope: item.branchScope,
            branchCodes: parseBranchScope(item.branchScope),
            imageUrl: item.imageUrl,
            i18n: parseI18n(item.i18nJson),
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
  }, [t]);

  // 2. Tải danh sách Đối tác, Danh mục ngành hàng, Hạng hội viên & Chi nhánh điểm thanh toán
  const fetchPartners = useCallback(async (tenantId: string) => {
    try {
      const data = await LoyaltyService.getPartners(tenantId);
      setPartners(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('[fetchPartners] Error:', e);
      setPartners([]);
    }
  }, []);

  const fetchFormMasterData = useCallback(async (tenantId: string) => {
    try {
      const [catList, tierList, branchList] = await Promise.all([
        categoryService.getCategoriesByType(VOUCHER_CATEGORY_GROUP),
        LoyaltyService.getTiers(tenantId),
        LoyaltyService.getPaymentPoints(undefined, tenantId),
      ]);
      setVoucherCategories(Array.isArray(catList) ? catList.filter((c) => c.status !== 0) : []);
      setTiers(Array.isArray(tierList) ? tierList : []);
      setPaymentPoints(Array.isArray(branchList) ? branchList : []);
    } catch (e) {
      console.error('[fetchFormMasterData] Error:', e);
    }
  }, []);

  // Xử lý khi thay đổi Liên minh
  const handleTenantChange = (newTenantId: string) => {
    setSelectedTenant(newTenantId);
    fetchVouchers(newTenantId);
    fetchPartners(newTenantId);
    fetchFormMasterData(newTenantId);
  };

  useEffect(() => {
    fetchVouchers(selectedTenant);
    fetchPartners(selectedTenant);
    fetchFormMasterData(selectedTenant);
  }, [selectedTenant, fetchVouchers, fetchPartners, fetchFormMasterData]);

  // Dropdown options chọn đối tác
  const partnerDropdownOptions = useMemo(() => {
    return [
      {
        label: `🌟 ${t('voucher.scope_all_alliance')}`,
        value: null,
      },
      ...partners.map((p) => ({
        label: `${p.partnerName} (${p.partnerCode})`,
        value: p.id,
        partner: p,
      })),
    ];
  }, [partners, t]);

  const discountTypeOptions = useMemo(() => [
    { label: t('voucher.discount_type_percent', 'Phần trăm (%)'), value: DiscountType.PERCENTAGE },
    { label: t('voucher.discount_type_fixed', 'Số tiền cố định (HTG)'), value: DiscountType.FIXED_AMOUNT },
  ], [t]);

  const statusOptions = useMemo(() => [
    { label: t('common.active', 'Hoạt động'), value: CommonStatus.ACTIVE },
    { label: t('common.inactive', 'Ngừng hoạt động'), value: CommonStatus.INACTIVE },
  ], [t]);

  const categoryOptions = useMemo(() => {
    const opts = voucherCategories.map((c) => ({
      label: `${c.name} (${c.code})`,
      value: c.code,
    }));
    const current = formData.categoryCode?.trim().toUpperCase();
    if (current && !opts.some((o) => o.value === current)) {
      opts.push({ label: current, value: current });
    }
    return opts;
  }, [voucherCategories, formData.categoryCode]);

  const tierOptions = useMemo(
    () =>
      tiers.map((tier) => ({
        label: tier.name ? `${tier.name} (${tier.code})` : tier.code,
        value: tier.code,
      })),
    [tiers]
  );

  const audienceRoleOptions = useMemo(
    () => [
      { label: t('voucher.audience_customer'), value: AudienceRole.CUSTOMER },
      { label: t('voucher.audience_agent'), value: AudienceRole.AGENT },
      { label: t('voucher.audience_super_agent'), value: AudienceRole.SUPER_AGENT },
    ],
    [t]
  );

  const batchPeriodOptions = useMemo(
    () => [
      { label: t('voucher.batch_none'), value: VoucherBatchPeriod.NONE },
      { label: t('voucher.batch_daily'), value: VoucherBatchPeriod.DAILY },
      { label: t('voucher.batch_weekly'), value: VoucherBatchPeriod.WEEKLY },
    ],
    [t]
  );

  const branchScopeOptions = useMemo(() => {
    const selectedPartner = partners.find((p) => p.id === formData.partnerId);
    const filtered = selectedPartner?.partnerCode
      ? paymentPoints.filter(
          (b) => !b.partnerCode || b.partnerCode.toUpperCase() === selectedPartner.partnerCode.toUpperCase()
        )
      : paymentPoints;
    return filtered.map((b) => ({
      label: `${b.branchName || b.branchCode} (${b.branchCode})${b.province ? ` · ${b.province}` : ''}`,
      value: b.branchCode,
    }));
  }, [paymentPoints, partners, formData.partnerId]);

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
      acquireType: VoucherAcquireType.COINS,
      usageType: VoucherUsageType.NATCASH_STORE,
      audienceRole: AudienceRole.CUSTOMER,
      eligibleTiers: [],
      batchPeriod: VoucherBatchPeriod.NONE,
      branchCodes: [],
      i18n: { en: {}, fr: {}, ht: {} },
    });
    setIsEdit(false);
    setShowDialog(true);
  };

  // Mở modal chỉnh sửa
  const editItem = (item: VoucherItem) => {
    setFormData({
      ...item,
      branchCodes: item.branchCodes ?? parseBranchScope(item.branchScope),
    });
    setIsEdit(true);
    setShowDialog(true);
  };

  // Xóa voucher
  const deleteItem = (item: VoucherItem) => {
    confirmDialog({
      message: t('voucher.confirm_delete_msg', {
        code: item.voucherCode,
        title: item.title
      }),
      header: t('common.confirm_delete'),
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      acceptLabel: t('common.yes'),
      rejectLabel: t('common.no'),
      accept: async () => {
        setLoading(true);
        try {
          await LoyaltyService.deleteVoucher(item.id, selectedTenant);
          toastRef.current?.show({
            severity: 'success',
            summary: t('common.success'),
            detail: t('voucher.delete_success', { code: item.voucherCode }),
            life: 3000,
          });
          await fetchVouchers(selectedTenant);
        } catch (e: any) {
          console.error('[deleteVoucher] Error:', e);
          toastRef.current?.show({
            severity: 'error',
            summary: t('common.error'),
            detail: e?.message || t('voucher.delete_failed'),
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
        acquireType: formData.acquireType || 'COINS',
        usageType: formData.usageType || 'PARTNER_CODE',
        categoryCode: formData.categoryCode || '',
        audienceRole: formData.audienceRole || 'CUSTOMER',
        eligibleTiers: formData.eligibleTiers || [],
        perCustomerLimit: formData.perCustomerLimit || 1,
        batchQuantity: formData.batchQuantity || 0,
        batchPeriod: formData.batchPeriod || 'NONE',
        validDaysAfterCollect: formData.validDaysAfterCollect || 0,
        requireEkyc: !!formData.requireEkyc,
        showInFreeStrip: !!formData.showInFreeStrip,
        stripOrder: formData.stripOrder,
        serviceLink: formData.serviceLink || '',
        branchScope:
          formData.usageType === VoucherUsageType.ONLINE || !formData.branchCodes?.length
            ? ''
            : JSON.stringify(formData.branchCodes),
        imageUrl: formData.imageUrl || '',
        i18nJson: JSON.stringify(formData.i18n || EMPTY_I18N),
      };
      if (payload.acquireType === 'FREE_COLLECT') payload.pointCost = 0;

      if (isEdit && formData.id) {
        await LoyaltyService.updateVoucher(formData.id, payload, selectedTenant);
        toastRef.current?.show({
          severity: 'success',
          summary: t('common.success'),
          detail: t('voucher.update_success', { code: formData.voucherCode || '' }),
          life: 3000,
        });
      } else {
        await LoyaltyService.createVoucher(payload, selectedTenant);
        toastRef.current?.show({
          severity: 'success',
          summary: t('common.success'),
          detail: t('voucher.create_success'),
          life: 3000,
        });
      }
      setShowDialog(false);
      await fetchVouchers(selectedTenant);
    } catch (e: any) {
      console.error('[saveVoucher] Error:', e);
      toastRef.current?.show({
        severity: 'error',
        summary: t('common.error'),
        detail: e?.message || t('voucher.save_failed'),
        life: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveItem = () => {
    if (formData.usageType === 'ONLINE' && !formData.serviceLink) {
      toastRef.current?.show({ severity: 'warn', summary: t('common.warning'), detail: t('voucher.service_link_required', 'Online vouchers need a service link'), life: 3000 });
      return;
    }
    if (!formData.voucherCode || !formData.title) {
      toastRef.current?.show({
        severity: 'warn',
        summary: t('common.warning'),
        detail: t('voucher.code_title_required'),
        life: 3000,
      });
      return;
    }

    if (isEdit) {
      confirmDialog({
        message: t('voucher.confirm_update_msg', { code: formData.voucherCode || '' }),
        header: t('common.confirm_update'),
        icon: 'pi pi-info-circle',
        acceptLabel: t('common.save'),
        rejectLabel: t('common.cancel'),
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
      t('voucher.csv_sample_rows') + '\n';

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

  const openImportWizard = () => {
    setImportStep(0);
    setImportFileName('');
    setImportPreviewRows([]);
    setImportSummary(null);
    setShowImportDialog(true);
  };

  // Bước 1: Đọc & kiểm tra từng dòng tệp CSV (File Check)
  const handleCsvFileCheck = async (event: any) => {
    const file = event.files?.[0];
    if (!file) return;

    try {
      const text = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve((e.target?.result as string) || '');
        reader.onerror = (e) => reject(e);
        reader.readAsText(file, 'UTF-8');
      });

      const cleanText = text.replace(/^\uFEFF/, '');
      const lines = cleanText.split(/\r?\n/).filter((l: string) => l.trim().length > 0);

      if (lines.length <= 1) {
        toastRef.current?.show({
          severity: 'warn',
          summary: t('common.warning'),
          detail: t('voucher.csv_empty'),
        });
        return;
      }

      const startIndex = lines[0].toUpperCase().includes('CODE') ? 1 : 0;
      const existingCodes = new Set(vouchers.map((v) => v.voucherCode.toUpperCase()));
      const seenCodesInFile = new Set<string>();
      const parsedRows: typeof importPreviewRows = [];

      for (let i = startIndex; i < lines.length; i++) {
        const parts = lines[i].split(',').map((p: string) => p.trim().replace(/^["']|["']$/g, ''));
        const code = (parts[0] || '').toUpperCase();
        const title = parts[1] || '';
        const discountVal = Number(parts[2]);
        const pointsCost = Number(parts[3]);
        const totalQty = Number(parts[4]);
        const rawType = (parts[5] || 'FIXED_AMOUNT').toUpperCase();
        const discountType = rawType === DiscountType.PERCENTAGE ? DiscountType.PERCENTAGE : DiscountType.FIXED_AMOUNT;
        const partnerCode = parts[6] ? parts[6].trim().toUpperCase() : undefined;
        const minOrder = Number(parts[7] || 0);

        const errors: string[] = [];
        if (!code) errors.push(t('voucher.csv_err_code'));
        if (code && seenCodesInFile.has(code)) {
          errors.push(t('voucher.csv_err_dup_file'));
        }
        if (code && existingCodes.has(code)) {
          errors.push(t('voucher.csv_err_dup_db'));
        }
        if (!title) errors.push(t('voucher.csv_err_title'));
        if (isNaN(discountVal) || discountVal <= 0) {
          errors.push(t('voucher.csv_err_discount'));
        }
        if (isNaN(pointsCost) || pointsCost < 0) {
          errors.push(t('voucher.csv_err_points'));
        }
        if (isNaN(totalQty) || totalQty <= 0) {
          errors.push(t('voucher.csv_err_qty'));
        }
        if (discountType === DiscountType.PERCENTAGE && discountVal > 100) {
          errors.push(t('voucher.csv_err_pct'));
        }

        if (code) seenCodesInFile.add(code);

        parsedRows.push({
          rowNumber: i + 1,
          voucherCode: code || `ROW_${i + 1}`,
          title: title || '—',
          discountValue: isNaN(discountVal) ? 0 : discountVal,
          discountType,
          pointCost: isNaN(pointsCost) ? 0 : pointsCost,
          totalQuantity: isNaN(totalQty) ? 0 : totalQty,
          minBillAmount: isNaN(minOrder) ? 0 : minOrder,
          partnerCode,
          partnerId: !partnerCode && importDefaultPartnerId != null ? importDefaultPartnerId : undefined,
          isValid: errors.length === 0,
          errorMessage: errors.join('; '),
        });
      }

      setImportFileName(file.name);
      setImportPreviewRows(parsedRows);
      if (event.options?.clear) {
        event.options.clear();
      }
    } catch (e: any) {
      console.error('[handleCsvFileCheck] Error:', e);
      toastRef.current?.show({
        severity: 'error',
        summary: t('common.error'),
        detail: e?.message || t('voucher.import_failed'),
      });
    }
  };

  // Bước 2 -> 3: Xác nhận lưu các dòng hợp lệ lên máy chủ
  const handleConfirmImportCsv = async () => {
    const validRows = importPreviewRows.filter((r) => r.isValid);
    if (validRows.length === 0) return;

    setIsSubmitting(true);
    try {
      const payload = validRows.map((r) => ({
        voucherCode: r.voucherCode,
        title: r.title,
        description: r.title,
        partnerCode: r.partnerCode,
        partnerId: !r.partnerCode && importDefaultPartnerId != null ? importDefaultPartnerId : undefined,
        discountValue: r.discountValue,
        discountType: r.discountType,
        pointCost: r.pointCost,
        totalQuantity: r.totalQuantity,
        minBillAmount: r.minBillAmount,
        status: CommonStatus.ACTIVE,
      }));
      await LoyaltyService.batchImportVouchers(payload, selectedTenant);
      const skipped = importPreviewRows.length - validRows.length;
      setImportSummary({ importedCount: validRows.length, skippedCount: skipped });
      setImportStep(2);
      await fetchVouchers(selectedTenant);
      toastRef.current?.show({
        severity: 'success',
        summary: t('common.success'),
        detail: t('voucher.import_success', {
          count: validRows.length
        }),
      });
    } catch (e: any) {
      console.error('[handleConfirmImportCsv] Error:', e);
      toastRef.current?.show({
        severity: 'error',
        summary: t('common.error'),
        detail: e?.message || t('voucher.import_failed'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Templates cho bảng dữ liệu
  const renderRowActions = (rowData: VoucherItem) => {
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

  const statusTemplate = (rowData: VoucherItem) => {
    return <StatusBadge status={rowData.status} />;
  };

  const discountBadgeTemplate = (rowData: VoucherItem) => {
    return (
      <span className="font-normal text-900">
        {rowData.discountType === DiscountType.PERCENTAGE
          ? `${rowData.discountValue}%`
          : `-${rowData.discountValue} HTG`}
      </span>
    );
  };

  const partnerScopeTemplate = (rowData: VoucherItem) => {
    return (
      <span className="font-normal text-900">
        {rowData.partnerName || 'Toàn hệ thống'}
      </span>
    );
  };

  const handleExportExcel = () => {
    exportToExcel(
      [
        { header: 'STT' },
        { header: 'Mã voucher', field: 'voucherCode' },
        { header: 'Tên voucher', field: 'title' },
        {
          header: 'Mức giảm giá',
          getValue: (r: VoucherItem) =>
            r.discountType === DiscountType.PERCENTAGE
              ? `${r.discountValue}%`
              : `-${r.discountValue} HTG`,
        },
        { header: 'Điểm đổi', getValue: (r: VoucherItem) => (r.pointsRequired ?? 0).toLocaleString() },
        { header: 'Đối tác áp dụng', getValue: (r: VoucherItem) => r.partnerName || 'Toàn hệ thống' },
        { header: 'Còn lại', getValue: (r: VoucherItem) => `${r.remainingQuantity ?? 0} / ${r.totalQuantity ?? '∞'}` },
        { header: 'Hạn sử dụng', field: 'validTo' },
        {
          header: 'Trạng thái',
          getValue: (r: VoucherItem) =>
            r.status === CommonStatus.ACTIVE ? 'Hoạt động' : 'Ngừng hoạt động',
        },
      ],
      vouchers,
      'Danh_sach_voucher'
    );
  };

  return (
    <div className="w-full flex flex-column gap-2">
      <Toast ref={toastRef} position="top-center" />
      <ConfirmDialog />

      <StandardPageHeader
        breadcrumbs={[
          { label: t('nav.rewards_games', 'Khuyến mãi & Game') },
          { label: t('nav.vouchers', 'Kho Voucher') },
        ]}
        title={t('voucher.management_title', 'Kho Voucher & Mã Khuyến Mãi')}
        subtitle={t('voucher.subtitle', 'Quản lý phát hành voucher, tỷ lệ giảm giá, kho mã số lượng lớn và đối tác liên minh áp dụng')}
        actions={
          <div className="flex align-items-center gap-2">
            <Button
              type="button"
              label={t('common.import_csv', 'Nhập CSV')}
              icon="pi pi-upload"
              size="small"
              outlined
              severity="secondary"
              onClick={openImportWizard}
              className="p-button-sm font-medium"
            />
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
            <Button
              label={t('common.add_new', 'Thêm mới')}
              icon="pi pi-plus"
              size="small"
              onClick={openNew}
              className="p-button-sm font-semibold"
            />
          </div>
        }
      />

      <UniversalFilterBar
        searchValue={globalFilter}
        onSearchChange={setGlobalFilter}
        searchPlaceholder={t('common.search', 'Tìm kiếm...')}
        primaryFilters={
          <TenantSelector value={selectedTenant} onChange={handleTenantChange} />
        }
        onReset={() => {
          setGlobalFilter('');
          handleTenantChange('ALL');
        }}
        onRefresh={() => fetchVouchers(selectedTenant)}
        isLoading={loading}
      />

      <div className="surface-card border-round border-1 surface-border overflow-hidden w-full">
        <DataTable<any>
          value={vouchers}
          selection={selectedVouchers}
          onSelectionChange={(e) => setSelectedVouchers(e.value as VoucherItem[])}
          dataKey="id"
          paginator
          rows={10}
          loading={loading}
          rowsPerPageOptions={[10, 20, 50]}
          globalFilter={globalFilter}
          responsiveLayout="scroll"
          emptyMessage={t('common.no_data', 'Không có dữ liệu hiển thị')}
          className="p-datatable-sm p-datatable-striped"
        >
          <Column selectionMode="multiple" exportable={false} style={{ width: '3rem' }} />
          <Column
            header={t('common.stt', 'STT')}
            body={(_: any, options: any) => options.rowIndex + 1}
            style={{ width: '3.5rem', textAlign: 'center' }}
          />
          <Column
            header={t('common.actions', 'Thao tác')}
            body={renderRowActions}
            exportable={false}
            style={{ width: '6.5rem', textAlign: 'left' }}
          />
          <Column
            field="voucherCode"
            header={t('voucher.code', 'Mã voucher')}
            body={(row: VoucherItem) => (
              <span className="font-mono font-bold text-900">
                {row.voucherCode}
              </span>
            )}
            sortable
            style={{ minWidth: '9.5rem' }}
          />
          <Column
            field="title"
            header={t('voucher.title_label', 'Tên voucher')}
            body={(row: VoucherItem) => (
              <span className="font-normal text-900">{row.title}</span>
            )}
            sortable
            style={{ minWidth: '14rem' }}
          />
          <Column
            field="partnerScope"
            header={<span title={t('voucher.partner_scope_tooltip')}>{t('voucher.partner_scope')}</span>}
            body={partnerScopeTemplate}
            sortable
            style={{ minWidth: '13rem' }}
          />
          <Column
            field="discountValue"
            header={<span title={t('voucher.discount_tooltip')}>{t('voucher.discount_value')}</span>}
            body={discountBadgeTemplate}
            sortable
            style={{ minWidth: '8rem', textAlign: 'center' }}
          />
          <Column
            field="minOrderValue"
            header={<span title={t('voucher.min_order_tooltip')}>{t('voucher.min_order')}</span>}
            body={(row: VoucherItem) => <span className="font-mono">{row.minOrderValue} HTG</span>}
            sortable
            style={{ minWidth: '8.5rem', textAlign: 'center' }}
          />
          <Column
            field="pointsRequired"
            header={<span title={t('voucher.points_cost_tooltip')}>{t('voucher.points_cost')}</span>}
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
            field="acquireType"
            header={t('voucher.how_to_get', 'How to get')}
            body={(row: VoucherItem) => (
              <Tag value={row.acquireType === 'FREE_COLLECT' ? t('voucher.acquire_free', 'Free – collect') : row.acquireType === 'GIVEN' ? t('voucher.acquire_given', 'Given only') : t('voucher.acquire_coins', 'With coins')} severity={row.acquireType === 'FREE_COLLECT' ? 'success' : row.acquireType === 'GIVEN' ? 'info' : 'warning'} />
            )}
            sortable
            style={{ minWidth: '8.5rem', textAlign: 'center' }}
          />
          <Column
            field="usageType"
            header={t('voucher.how_to_use', 'How to use')}
            body={(row: VoucherItem) => (
              <span className="text-sm">{row.usageType === 'NATCASH_STORE' ? t('voucher.usage_store', 'Natcash at store') : row.usageType === 'ONLINE' ? t('voucher.usage_online', 'Online service') : t('voucher.usage_partner', 'Partner code')}</span>
            )}
            sortable
            style={{ minWidth: '9rem' }}
          />
          <Column
            field="remainingQuantity"
            header={<span title={t('voucher.inventory_tooltip')}>{t('voucher.inventory')}</span>}
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
            header={<span title={t('voucher.date_range_tooltip')}>{t('voucher.date_range')}</span>}
            body={(row: VoucherItem) => (
              <span className="text-xs text-600 font-mono">
                {row.validFrom} &rarr; {row.validTo}
              </span>
            )}
            sortable
            style={{ minWidth: '10.5rem', textAlign: 'center' }}
          />
          <Column field="status" header={t('common.status')} body={statusTemplate} sortable style={{ minWidth: '8.5rem', textAlign: 'center' }} />
        </DataTable>
      </div>

      {/* MODAL DIALOG: THÊM / SỬA VOUCHER */}
      <Dialog
        visible={showDialog}
        style={{ width: '760px', maxWidth: '96vw' }}
        header={isEdit ? t('voucher.edit_title') : t('voucher.create_title')}
        modal
        className="border-round-xl"
        onHide={() => setShowDialog(false)}
      >
        <div className="p-fluid">
          {/* Dropdown Chọn Đối Tác */}
          <div className="field mb-3">
            <label htmlFor="partnerSelector" className="font-bold text-900">
              {t('voucher.select_partner')}
            </label>
            <Dropdown
              id="partnerSelector"
              value={formData.partnerId}
              options={partnerDropdownOptions}
              onChange={(e) => setFormData({ ...formData, partnerId: e.value })}
              optionLabel="label"
              optionValue="value"
              itemTemplate={partnerOptionTemplate}
              placeholder={t('voucher.select_partner_placeholder')}
              className="w-full"
              appendTo="self"
            />
            <small className="text-500 block mt-1">
              {formData.partnerId == null
                ? t('voucher.scope_all_alliance_desc')
                : t('voucher.scope_exclusive_partner_desc')}
            </small>
          </div>

          <div className="formgrid grid mb-3">
            <div className="field col-6">
              <label htmlFor="voucherCode" className="font-bold text-900">
                {t('voucher.code')} <span className="text-red-500">*</span>
              </label>
              <InputText
                id="voucherCode"
                value={formData.voucherCode || ''}
                onChange={(e) => setFormData({ ...formData, voucherCode: e.target.value.toUpperCase() })}
                placeholder={t('voucher.code_placeholder')}
                disabled={isEdit}
              />
            </div>
            <div className="field col-6">
              <label htmlFor="discountType" className="font-bold text-900">{t('voucher.discount_type')}</label>
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
              {t('voucher.title_label')} <span className="text-red-500">*</span>
            </label>
            <InputText
              id="title"
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder={t('voucher.title_placeholder')}
            />
          </div>

          <div className="field mb-3">
            <label htmlFor="description" className="font-bold text-900">{t('common.description')}</label>
            <InputText
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t('voucher.description_placeholder')}
            />
          </div>

          <div className="formgrid grid mb-3">
            <div className="field col-6">
              <label htmlFor="discountValue" className="font-bold text-900">
                {formData.discountType === DiscountType.PERCENTAGE ? t('voucher.discount_value_percent') : t('voucher.discount_value_htg')}
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
              <label htmlFor="minOrderValue" className="font-bold text-900">{t('voucher.min_order')}</label>
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
              <label htmlFor="pointsRequired" className="font-bold text-900">{t('voucher.points_cost')}</label>
              <InputNumber
                id="pointsRequired"
                value={formData.pointsRequired}
                onValueChange={(e) => setFormData({ ...formData, pointsRequired: e.value || 0 })}
                min={0}
                placeholder="0"
                disabled={formData.acquireType === 'FREE_COLLECT' || formData.acquireType === 'GIVEN'}
              />
            </div>
            <div className="field col-6">
              <label htmlFor="totalQuantity" className="font-bold text-900">{t('voucher.total_quantity')}</label>
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
              <label htmlFor="validFrom" className="font-bold text-900">{t('voucher.valid_from')}</label>
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
              <label htmlFor="validTo" className="font-bold text-900">{t('voucher.valid_to')}</label>
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

          {/* VQ-04 · Category, image, audience, names in 3 languages */}
          <div className="formgrid grid mb-3">
            <div className="field col-6">
              <label htmlFor="categoryCode" className="font-bold text-900">{t('voucher.category', 'Category')}</label>
              <Dropdown
                id="categoryCode"
                value={formData.categoryCode || null}
                options={categoryOptions}
                onChange={(e) => setFormData({ ...formData, categoryCode: e.value || '' })}
                placeholder={t('voucher.category_placeholder')}
                filter
                showClear
                appendTo="self"
              />
              <small className="text-500">{t('voucher.category_hint', 'Used by the Store filters in the app')}</small>
            </div>
            <div className="field col-6">
              <label htmlFor="audienceRole" className="font-bold text-900">{t('voucher.audience', 'Who can get it')}</label>
              <Dropdown
                id="audienceRole"
                value={formData.audienceRole || AudienceRole.CUSTOMER}
                options={audienceRoleOptions}
                onChange={(e) => setFormData({ ...formData, audienceRole: e.value })}
                appendTo="self"
              />
            </div>
          </div>
          <div className="field mb-3">
            <ImageUploadField
              value={formData.imageUrl}
              onChange={(url) => setFormData({ ...formData, imageUrl: url })}
              folder={MediaFolder.VOUCHERS}
              tenantId={selectedTenant}
              label={t('voucher.image_url')}
              aspect="card"
            />
          </div>
          <div className="formgrid grid mb-3">
            {(['en', 'fr', 'ht'] as const).map((lng) => (
              <div key={lng} className="field col-4">
                <label className="font-bold text-900">{t('voucher.name_in', 'Name')} · {lng === 'en' ? 'English' : lng === 'fr' ? 'Français' : 'Kreyòl'}</label>
                <InputText value={formData.i18n?.[lng]?.name || ''} onChange={(e) => setFormData({ ...formData, i18n: { ...(formData.i18n || EMPTY_I18N), [lng]: { ...(formData.i18n?.[lng] || {}), name: e.target.value } } })} />
                <InputText className="mt-2" placeholder={t('voucher.condition', 'Condition')} value={formData.i18n?.[lng]?.condition || ''} onChange={(e) => setFormData({ ...formData, i18n: { ...(formData.i18n || EMPTY_I18N), [lng]: { ...(formData.i18n?.[lng] || {}), condition: e.target.value } } })} />
              </div>
            ))}
          </div>

          {/* VQ-04 · How customers get it (decides the button in the app) */}
          <div className="surface-50 border-round-lg p-3 mb-3">
            <div className="font-bold text-900 mb-2">{t('voucher.how_to_get', 'How customers get it')}</div>
            <SelectButton
              value={formData.acquireType || VoucherAcquireType.COINS}
              options={[
                { label: t('voucher.acquire_coins', 'Get with coins'), value: VoucherAcquireType.COINS },
                { label: t('voucher.acquire_free', 'Free – collect'), value: VoucherAcquireType.FREE_COLLECT },
                { label: t('voucher.acquire_given', 'Given only'), value: VoucherAcquireType.GIVEN },
              ]}
              onChange={(e) => e.value && setFormData({ ...formData, acquireType: e.value, pointsRequired: e.value === VoucherAcquireType.FREE_COLLECT ? 0 : formData.pointsRequired })}
            />
            <small className="text-500 block mt-2">
              {formData.acquireType === VoucherAcquireType.FREE_COLLECT
                ? t('voucher.acquire_free_hint', 'App button “Collect”: saved to My vouchers with a small toast, reserved when collected.')
                : formData.acquireType === VoucherAcquireType.GIVEN
                ? t('voucher.acquire_given_hint', 'Not shown in the Store; sent by a mission, game or campaign.')
                : t('voucher.acquire_coins_hint', 'App button “Get voucher”: coins are deducted, popup “Voucher added”.')}
            </small>
            {formData.acquireType === VoucherAcquireType.FREE_COLLECT && (
              <div className="formgrid grid mt-3">
                <div className="field col-4">
                  <label className="font-bold text-900">{t('voucher.batch_quantity', 'Quantity per batch')}</label>
                  <InputNumber value={formData.batchQuantity} onValueChange={(e) => setFormData({ ...formData, batchQuantity: e.value || undefined })} min={0} />
                </div>
                <div className="field col-4">
                  <label className="font-bold text-900">{t('voucher.batch_period', 'New batch')}</label>
                  <Dropdown value={formData.batchPeriod || VoucherBatchPeriod.NONE} options={batchPeriodOptions} onChange={(e) => setFormData({ ...formData, batchPeriod: e.value })} appendTo="self" />
                </div>
                <div className="field col-4">
                  <label className="font-bold text-900">{t('voucher.per_customer_limit', 'Limit per customer')}</label>
                  <InputNumber value={formData.perCustomerLimit ?? 1} onValueChange={(e) => setFormData({ ...formData, perCustomerLimit: e.value || 1 })} min={1} />
                </div>
                <div className="field col-4">
                  <label className="font-bold text-900">{t('voucher.valid_days_after_collect', 'Valid after collecting')}</label>
                  <InputNumber value={formData.validDaysAfterCollect} onValueChange={(e) => setFormData({ ...formData, validDaysAfterCollect: e.value || undefined })} min={1} />
                  <small className="text-500">{t('voucher.fixed_date_hint', 'The app shows a fixed date')}</small>
                </div>
                <div className="field col-8">
                  <label className="font-bold text-900">{t('voucher.eligible_tiers', 'Eligible tiers')}</label>
                  <MultiSelect value={formData.eligibleTiers || []} options={tierOptions} onChange={(e) => setFormData({ ...formData, eligibleTiers: e.value })} placeholder={t('voucher.all_tiers', 'All tiers')} display="chip" appendTo="self" />
                  <small className="text-500">{t('voucher.eligible_tiers_hint', 'Other tiers see it locked: “See member tiers”')}</small>
                </div>
                <div className="field col-5 flex align-items-center gap-2">
                  <InputSwitch checked={!!formData.requireEkyc} onChange={(e) => setFormData({ ...formData, requireEkyc: !!e.value })} />
                  <span>{t('voucher.require_ekyc', 'Verified wallets only (eKYC)')}</span>
                </div>
                <div className="field col-4 flex align-items-center gap-2">
                  <InputSwitch checked={!!formData.showInFreeStrip} onChange={(e) => setFormData({ ...formData, showInFreeStrip: !!e.value })} />
                  <span>{t('voucher.show_in_free_strip', 'Show in “Free to collect” on the Store')}</span>
                </div>
                {formData.showInFreeStrip && (
                  <div className="field col-3">
                    <label className="font-bold text-900">{t('voucher.strip_order')}</label>
                    <InputNumber value={formData.stripOrder ?? 1} onValueChange={(e) => setFormData({ ...formData, stripOrder: e.value ?? 1 })} min={1} />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* VQ-04 · How customers use it (decides what Use opens) */}
          <div className="surface-50 border-round-lg p-3 mb-3">
            <div className="font-bold text-900 mb-2">{t('voucher.how_to_use', 'How customers use it')}</div>
            <SelectButton
              value={formData.usageType || VoucherUsageType.PARTNER_CODE}
              options={[
                { label: t('voucher.usage_store', 'Natcash payment at store'), value: VoucherUsageType.NATCASH_STORE },
                { label: t('voucher.usage_partner', 'Partner code'), value: VoucherUsageType.PARTNER_CODE },
                { label: t('voucher.usage_online', 'Online service'), value: VoucherUsageType.ONLINE },
              ]}
              onChange={(e) => e.value && setFormData({ ...formData, usageType: e.value })}
            />
            <small className="text-500 block mt-2">
              {formData.usageType === VoucherUsageType.NATCASH_STORE
                ? t('voucher.usage_store_hint', 'Use → Pay at counter with this voucher; the cashier scans one code.')
                : formData.usageType === VoucherUsageType.ONLINE
                ? t('voucher.usage_online_hint', 'Use → opens the service checkout (top-up, data, bills) with the voucher applied.')
                : t('voucher.usage_partner_hint', 'Use → shows QR / barcode for the partner’s own POS; needs code stock.')}
            </small>
            {formData.usageType === VoucherUsageType.ONLINE ? (
              <div className="field mt-3 mb-0">
                <label className="font-bold text-900">{t('voucher.service_link', 'Service link')} <span className="text-red-500">*</span></label>
                <InputText value={formData.serviceLink || ''} onChange={(e) => setFormData({ ...formData, serviceLink: e.target.value })} placeholder="natcash://topup" />
              </div>
            ) : (
              <div className="field mt-3 mb-0">
                <label className="font-bold text-900">{t('voucher.branch_scope')}</label>
                <MultiSelect
                  value={formData.branchCodes || []}
                  options={branchScopeOptions}
                  onChange={(e) => setFormData({ ...formData, branchCodes: e.value || [] })}
                  placeholder={t('voucher.branch_scope_placeholder')}
                  filter
                  display="chip"
                  appendTo="self"
                />
                <small className="text-500 block mt-1">{t('voucher.branch_scope_hint')}</small>
              </div>
            )}
          </div>

          {/* VQ-04 · Live App Card Preview */}
          <div className="surface-50 border-round-lg p-3 mb-3 border-1 surface-border">
            <div className="flex align-items-center justify-content-between mb-2">
              <span className="font-bold text-900 text-sm">
                <i className="pi pi-mobile mr-2 text-primary" />
                {t('voucher.preview_title')}
              </span>
              <div className="flex gap-1">
                {(['en', 'fr', 'ht'] as const).map((lng) => (
                  <Button
                    key={lng}
                    type="button"
                    label={lng.toUpperCase()}
                    size="small"
                    outlined={previewLang !== lng}
                    severity={previewLang === lng ? undefined : 'secondary'}
                    className="py-1 px-2 text-xs"
                    onClick={() => setPreviewLang(lng)}
                  />
                ))}
              </div>
            </div>
            <div className="surface-card border-round-xl p-3 border-1 surface-border flex align-items-center gap-3">
              <div
                className="relative border-round-lg overflow-hidden flex-shrink-0 flex align-items-center justify-content-center"
                style={{
                  width: 96,
                  height: 68,
                  background: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)',
                }}
              >
                {formData.imageUrl ? (
                  <img
                    src={formData.imageUrl}
                    alt={formData.title || ''}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <i className="pi pi-ticket text-2xl text-primary" />
                )}
                <span
                  className="text-xs font-semibold px-2 py-0 border-round-xl"
                  style={{
                    position: 'absolute',
                    top: 6,
                    left: 6,
                    background: 'rgba(255,255,255,0.92)',
                    color: '#0f172a',
                    fontSize: '0.65rem',
                  }}
                >
                  {partners.find((p) => p.id === formData.partnerId)?.partnerName || t('voucher.scope_all_short')}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-900 text-base white-space-nowrap overflow-hidden text-overflow-ellipsis">
                  {formData.i18n?.[previewLang]?.name || formData.title || t('voucher.new_title')}
                </div>
                <div className="text-xs text-600 mt-1 white-space-nowrap overflow-hidden text-overflow-ellipsis">
                  {formData.i18n?.[previewLang]?.condition ||
                    formData.description ||
                    (formData.minOrderValue ? `${t('voucher.min_order')}: ${formData.minOrderValue} HTG` : '—')}
                </div>
                <div className="flex align-items-center gap-2 mt-2 flex-wrap">
                  {formData.categoryCode && (
                    <Tag
                      value={
                        voucherCategories.find((c) => c.code === formData.categoryCode)?.name ||
                        formData.categoryCode
                      }
                      severity="info"
                      className="text-xs"
                    />
                  )}
                  <span className="text-xs text-500">
                    {formData.usageType === VoucherUsageType.ONLINE
                      ? t('voucher.usage_online')
                      : formData.usageType === VoucherUsageType.NATCASH_STORE
                      ? t('voucher.usage_store')
                      : t('voucher.usage_partner')}
                  </span>
                </div>
              </div>
              <div className="flex-shrink-0">
                <span
                  className="px-3 py-1 border-round-xl font-bold text-xs inline-block"
                  style={{
                    background:
                      formData.acquireType === VoucherAcquireType.FREE_COLLECT
                        ? '#FFF7ED'
                        : formData.acquireType === VoucherAcquireType.GIVEN
                        ? '#EFF6FF'
                        : '#FF6B00',
                    color:
                      formData.acquireType === VoucherAcquireType.FREE_COLLECT
                        ? '#EA580C'
                        : formData.acquireType === VoucherAcquireType.GIVEN
                        ? '#1D4ED8'
                        : '#FFFFFF',
                    border:
                      formData.acquireType === VoucherAcquireType.FREE_COLLECT
                        ? '1px solid #FDBA74'
                        : 'none',
                  }}
                >
                  {formData.acquireType === VoucherAcquireType.FREE_COLLECT
                    ? t('voucher.acquire_free')
                    : formData.acquireType === VoucherAcquireType.GIVEN
                    ? t('voucher.acquire_given')
                    : `${formData.pointsRequired || 0}`}
                </span>
              </div>
            </div>
          </div>

          <div className="field mb-3">
            <label htmlFor="status" className="font-bold text-900">{t('common.status')}</label>
            <Dropdown
              id="status"
              value={formData.status}
              options={statusOptions}
              onChange={(e) => setFormData({ ...formData, status: e.value })}
              appendTo="self"
            />
          </div>
        </div>

        <div className="flex justify-content-end gap-2 mt-4">
          <Button label={t('common.cancel')} icon="pi pi-times" outlined onClick={() => setShowDialog(false)} />
          <Button label={t('common.save')} icon="pi pi-check" onClick={saveItem} loading={isSubmitting} />
        </div>
      </Dialog>

      {/* MODAL WIZARD 3 BƯỚC: IMPORT CSV (VQ-04: file check -> confirm -> done) */}
      <Dialog
        visible={showImportDialog}
        style={{ width: '56rem' }}
        breakpoints={{ '960px': '85vw', '641px': '95vw' }}
        header={t('voucher.import_csv_title')}
        modal
        className="border-round-xl"
        onHide={() => setShowImportDialog(false)}
      >
        <div className="flex flex-column gap-4">
          <Steps
            model={[
              { label: t('voucher.wizard_step_check') },
              { label: t('voucher.wizard_step_confirm') },
              { label: t('voucher.wizard_step_done') },
            ]}
            activeIndex={importStep}
          />

          {importStep === 0 && (
            <div className="p-fluid flex flex-column gap-3">
              <p className="text-secondary m-0 text-sm">
                {t('voucher.import_instruction')}
              </p>

              <div className="grid">
                <div className="col-12 md:col-7">
                  <div className="surface-100 p-3 border-round h-full">
                    <label htmlFor="importPartner" className="font-medium text-sm text-900 block mb-2">
                      {t('voucher.import_partner_label')}
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
                </div>
                <div className="col-12 md:col-5">
                  <div className="surface-100 p-3 border-round h-full flex flex-column justify-content-between gap-2">
                    <span className="text-xs text-600 font-medium">
                      {t('voucher.sample_csv_label')}
                    </span>
                    <Button
                      label={t('voucher.download_sample_csv')}
                      icon="pi pi-download"
                      size="small"
                      outlined
                      severity="help"
                      onClick={downloadSampleCsv}
                      type="button"
                    />
                  </div>
                </div>
              </div>

              <FileUpload
                mode="basic"
                name="file"
                accept=".csv, text/csv, application/vnd.ms-excel, text/plain"
                maxFileSize={10000000}
                customUpload
                uploadHandler={handleCsvFileCheck}
                auto
                chooseLabel={
                  importFileName
                    ? `${t('voucher.reselect_file')}: ${importFileName}`
                    : t('common.choose_file')
                }
              />

              {importPreviewRows.length > 0 && (
                <div>
                  <div className="flex flex-wrap gap-2 align-items-center justify-content-between mb-2">
                    <div className="flex gap-2">
                      <Tag
                        severity="info"
                        value={`${t('voucher.csv_total_rows')}: ${importPreviewRows.length}`}
                      />
                      <Tag
                        severity="success"
                        value={`${t('voucher.csv_valid_rows')}: ${importPreviewRows.filter((r) => r.isValid).length
                          }`}
                      />
                      <Tag
                        severity="danger"
                        value={`${t('voucher.csv_error_rows')}: ${importPreviewRows.filter((r) => !r.isValid).length
                          }`}
                      />
                    </div>
                  </div>
                  <DataTable
                    value={importPreviewRows}
                    size="small"
                    scrollable
                    scrollHeight="220px"
                    stripedRows
                  >
                    <Column field="rowNumber" header="#" style={{ width: '3rem' }} />
                    <Column
                      field="voucherCode"
                      header={t('voucher.code')}
                      body={(r: any) => <span className="font-mono text-xs">{r.voucherCode}</span>}
                      style={{ minWidth: '8.5rem' }}
                    />
                    <Column
                      field="title"
                      header={t('voucher.title_label')}
                      style={{ minWidth: '12rem' }}
                    />
                    <Column
                      field="discountValue"
                      header={t('voucher.discount_value')}
                      body={(r: any) => (
                        <span className="font-mono text-xs">
                          {r.discountValue} {r.discountType === DiscountType.PERCENTAGE ? '%' : 'HTG'}
                        </span>
                      )}
                      style={{ minWidth: '6.5rem' }}
                    />
                    <Column
                      field="totalQuantity"
                      header={t('voucher.total_quantity')}
                      style={{ minWidth: '4.5rem' }}
                    />
                    <Column
                      header={t('common.status')}
                      body={(r: any) =>
                        r.isValid ? (
                          <Tag severity="success" value={t('common.valid')} />
                        ) : (
                          <Tag severity="danger" value={r.errorMessage} />
                        )
                      }
                      style={{ minWidth: '12rem' }}
                    />
                  </DataTable>
                </div>
              )}

              <div className="flex justify-content-end gap-2 mt-2">
                <Button
                  label={t('common.cancel')}
                  icon="pi pi-times"
                  outlined
                  onClick={() => setShowImportDialog(false)}
                />
                <Button
                  label={t('common.next')}
                  icon="pi pi-arrow-right"
                  iconPos="right"
                  disabled={importPreviewRows.filter((r) => r.isValid).length === 0}
                  onClick={() => setImportStep(1)}
                />
              </div>
            </div>
          )}

          {importStep === 1 && (
            <div className="flex flex-column gap-3">
              <div className="surface-50 p-4 border-round border-1 surface-border">
                <h5 className="m-0 mb-2 text-900 font-bold">
                  {t('voucher.wizard_confirm_heading')}
                </h5>
                <div className="text-sm text-700 mb-3">
                  {t('voucher.wizard_confirm_desc', {
                    valid: importPreviewRows.filter((r) => r.isValid).length,
                    skipped: importPreviewRows.filter((r) => !r.isValid).length
                  })}
                </div>
                <div className="flex gap-3">
                  <Tag
                    severity="info"
                    value={`${t('voucher.file_label')}: ${importFileName}`}
                  />
                  <Tag
                    severity="success"
                    value={`${t('voucher.csv_valid_rows')}: ${importPreviewRows.filter((r) => r.isValid).length
                      }`}
                  />
                </div>
              </div>

              <div className="flex justify-content-between gap-2 mt-2">
                <Button
                  label={t('common.back')}
                  icon="pi pi-arrow-left"
                  outlined
                  onClick={() => setImportStep(0)}
                  disabled={isSubmitting}
                />
                <Button
                  label={t('voucher.wizard_commit_btn')}
                  icon="pi pi-check"
                  severity="success"
                  loading={isSubmitting}
                  onClick={handleConfirmImportCsv}
                />
              </div>
            </div>
          )}

          {importStep === 2 && (
            <div className="flex flex-column align-items-center text-center gap-3 py-4">
              <i className="pi pi-check-circle text-6xl text-green-500" />
              <h4 className="m-0 text-900 font-bold">
                {t('voucher.wizard_done_title')}
              </h4>
              <p className="m-0 text-sm text-600">
                {t('voucher.wizard_done_desc', {
                  imported: importSummary?.importedCount ?? 0,
                  skipped: importSummary?.skippedCount ?? 0
                })}
              </p>
              <div className="flex gap-2 mt-2">
                <Button
                  label={t('voucher.import_another')}
                  icon="pi pi-upload"
                  outlined
                  onClick={openImportWizard}
                />
                <Button
                  label={t('common.close')}
                  icon="pi pi-check"
                  onClick={() => setShowImportDialog(false)}
                />
              </div>
            </div>
          )}
        </div>
      </Dialog>
    </div>
  );
};

export default VoucherManagementPage;
