import React, { useEffect, useState, useRef, useMemo } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Tag } from 'primereact/tag';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { useTranslation } from 'react-i18next';
import { Partner, partnerService } from '@/service/partner.service';
import { TenantSelector } from '@/components/TenantSelector';
import { AppBreadcrumb } from 'components';

export const PARTNER_TYPES = [
  { value: 'RETAIL', icon: 'pi pi-shopping-cart', badgeColor: '#10B981', translationKey: 'type_retail' },
  { value: 'TELECOM', icon: 'pi pi-phone', badgeColor: '#0284C7', translationKey: 'type_telecom' },
  { value: 'BANKING', icon: 'pi pi-wallet', badgeColor: '#F59E0B', translationKey: 'type_banking' },
  { value: 'F_AND_B', icon: 'pi pi-coffee', badgeColor: '#EF4444', translationKey: 'type_f_and_b' },
  { value: 'FUEL', icon: 'pi pi-bolt', badgeColor: '#8B5CF6', translationKey: 'type_fuel' },
  { value: 'UTILITIES', icon: 'pi pi-home', badgeColor: '#06B6D4', translationKey: 'type_utilities' },
  { value: 'ENTERTAINMENT', icon: 'pi pi-play', badgeColor: '#EC4899', translationKey: 'type_entertainment' },
  { value: 'HEALTHCARE', icon: 'pi pi-heart', badgeColor: '#E11D48', translationKey: 'type_healthcare' },
  { value: 'HOTEL', icon: 'pi pi-building', badgeColor: '#3B82F6', translationKey: 'type_hotel' },
  { value: 'OTHER', icon: 'pi pi-circle', badgeColor: '#6B7280', translationKey: 'type_other' },
];

export const Partners: React.FC = () => {
  const { t } = useTranslation();
  const [selectedTenant, setSelectedTenant] = useState<string>('TENANT_NATCASH');
  const [items, setItems] = useState<Partner[]>([]);
  const [selectedItems, setSelectedItems] = useState<Partner[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showDialog, setShowDialog] = useState<boolean>(false);
  const [showDetailDialog, setShowDetailDialog] = useState<boolean>(false);
  const [detailPartner, setDetailPartner] = useState<Partner | null>(null);
  const [formData, setFormData] = useState<Partial<Partner>>({});
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [showSecret, setShowSecret] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const toast = useRef<Toast>(null);

  // Sinh khóa B2B ngẫu nhiên
  const generateRandomApiKey = () => {
    const randomHex = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
    return `pk_live_${randomHex}`;
  };

  const generateRandomSecretKey = () => {
    const randomHex = Array.from({ length: 4 }, () => Math.random().toString(36).substring(2, 10)).join('');
    return `sk_live_${randomHex}`;
  };

  const generateRandomWebhookSecret = () => {
    const randomHex = Array.from({ length: 3 }, () => Math.random().toString(36).substring(2, 10)).join('');
    return `whsec_${randomHex}`;
  };

  const fetchData = async (tenantId: string = selectedTenant) => {
    setLoading(true);
    try {
      const data = await partnerService.getAll(tenantId);
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('[Partners.fetchData] Error:', e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(selectedTenant);
  }, [selectedTenant]);

  const handleTenantChange = (tenantId: string) => {
    setSelectedTenant(tenantId);
  };

  const copyToClipboard = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.current?.show({
      severity: 'info',
      summary: t('common.success', { defaultValue: 'Thành công' }),
      detail: `${label}: ${t('partner.copied_key', { defaultValue: 'Đã sao chép vào bộ nhớ tạm!' })}`,
      life: 2500,
    });
  };

  const openNew = () => {
    setFormData({
      partnerCode: '',
      partnerName: '',
      partnerType: 'RETAIL',
      apiKey: generateRandomApiKey(),
      secretKey: generateRandomSecretKey(),
      webhookUrl: '',
      webhookSecret: generateRandomWebhookSecret(),
      ipWhitelist: '0.0.0.0/0',
      status: 1,
    });
    setIsEdit(false);
    setShowSecret(false);
    setShowDialog(true);
  };

  const openDetail = (partner: Partner) => {
    setDetailPartner(partner);
    setShowDetailDialog(true);
  };

  const editItem = (item: Partner) => {
    const statusVal = Number(item.status) === 1 || String(item.status) === 'ACTIVE' ? 1 : 0;
    setFormData({
      ...item,
      partnerType: item.partnerType || 'RETAIL',
      apiKey: item.apiKey || generateRandomApiKey(),
      secretKey: item.secretKey || generateRandomSecretKey(),
      webhookUrl: item.webhookUrl || '',
      webhookSecret: item.webhookSecret || '',
      ipWhitelist: item.ipWhitelist || '0.0.0.0/0',
      status: statusVal,
    });
    setIsEdit(true);
    setShowSecret(false);
    setShowDialog(true);
  };

  const deleteItem = async (item: Partner) => {
    if (!item.id) return;
    confirmDialog({
      message: t('partner.confirm_delete_msg', { name: item.partnerName, defaultValue: `Bạn có chắc chắn muốn xóa đối tác "${item.partnerName}" khỏi hệ thống không?` }),
      header: t('common.confirm_delete', { defaultValue: 'Xác nhận Xóa Đối Tác' }),
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      acceptLabel: t('common.delete', { defaultValue: 'Xóa' }),
      rejectLabel: t('common.cancel', { defaultValue: 'Hủy' }),
      accept: async () => {
        try {
          await partnerService.delete(item.id!, selectedTenant);
          toast.current?.show({
            severity: 'success',
            summary: t('common.success', { defaultValue: 'Thành công' }),
            detail: t('partner.delete_success', { defaultValue: 'Đã xóa đối tác thành công!' }),
            life: 3000,
          });
          fetchData(selectedTenant);
        } catch (e: any) {
          console.error('[Partners.deleteItem] Error:', e);
          toast.current?.show({
            severity: 'error',
            summary: t('common.error', { defaultValue: 'Lỗi' }),
            detail: t('partner.delete_failed', { defaultValue: 'Xóa đối tác thất bại' }) + ': ' + (e?.message || ''),
            life: 4000,
          });
        }
      },
    });
  };

  const executeSave = async () => {
    try {
      const payload: Partial<Partner> = {
        partnerCode: (formData.partnerCode || '').trim().toUpperCase(),
        partnerName: (formData.partnerName || '').trim(),
        partnerType: formData.partnerType || 'RETAIL',
        apiKey: formData.apiKey || generateRandomApiKey(),
        secretKey: formData.secretKey || generateRandomSecretKey(),
        webhookUrl: formData.webhookUrl ? formData.webhookUrl.trim() : undefined,
        webhookSecret: formData.webhookSecret ? formData.webhookSecret.trim() : undefined,
        ipWhitelist: formData.ipWhitelist ? formData.ipWhitelist.trim() : '0.0.0.0/0',
        status: formData.status ?? 1,
      };

      if (isEdit && formData.id) {
        await partnerService.update(formData.id, payload, selectedTenant);
        toast.current?.show({
          severity: 'success',
          summary: t('common.success', { defaultValue: 'Thành công' }),
          detail: t('partner.update_success', { defaultValue: 'Cập nhật thông tin đối tác thành công!' }),
          life: 3000,
        });
      } else {
        await partnerService.create(payload, selectedTenant);
        toast.current?.show({
          severity: 'success',
          summary: t('common.success', { defaultValue: 'Thành công' }),
          detail: t('partner.create_success', { defaultValue: 'Thêm mới đối tác thành công!' }),
          life: 3000,
        });
      }
      setShowDialog(false);
      fetchData(selectedTenant);
    } catch (e: any) {
      console.error('[Partners.saveItem] Error:', e);
      toast.current?.show({
        severity: 'error',
        summary: t('common.error', { defaultValue: 'Lỗi' }),
        detail: t('partner.save_failed', { defaultValue: 'Lưu đối tác thất bại' }) + ': ' + (e?.message || ''),
        life: 4000,
      });
    }
  };

  const saveItem = () => {
    if (!formData.partnerCode || !formData.partnerName) {
      toast.current?.show({
        severity: 'warn',
        summary: t('common.warning', { defaultValue: 'Cảnh báo' }),
        detail: t('partner.enter_required_fields', { defaultValue: 'Vui lòng nhập Mã đối tác và Tên đối tác!' }),
        life: 3000,
      });
      return;
    }

    if (isEdit) {
      confirmDialog({
        message: t('partner.confirm_update_msg', { name: formData.partnerName || '', defaultValue: `Bạn có chắc chắn muốn lưu các thay đổi cho đối tác "${formData.partnerName || ''}"?` }),
        header: t('common.confirm_update', { defaultValue: 'Xác nhận Cập Nhật' }),
        icon: 'pi pi-question-circle',
        acceptLabel: t('common.confirm', { defaultValue: 'Xác nhận' }),
        rejectLabel: t('common.cancel', { defaultValue: 'Hủy' }),
        accept: executeSave,
      });
    } else {
      executeSave();
    }
  };

  // Danh sách lĩnh vực hiển thị
  const partnerTypeOptions = useMemo(() => {
    return PARTNER_TYPES.map((pt) => ({
      value: pt.value,
      label: t(`partner.${pt.translationKey}`, { defaultValue: pt.value }),
      icon: pt.icon,
      color: pt.badgeColor,
    }));
  }, [t]);

  // Bộ lọc dữ liệu trên giao diện
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // 1. Tìm kiếm chung (Mã, Tên, API key)
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        (item.partnerCode && item.partnerCode.toLowerCase().includes(q)) ||
        (item.partnerName && item.partnerName.toLowerCase().includes(q)) ||
        (item.apiKey && item.apiKey.toLowerCase().includes(q));

      // 2. Lọc theo lĩnh vực
      const matchType = filterType === 'ALL' || item.partnerType === filterType;

      // 3. Lọc theo trạng thái
      const isActive = Number(item.status) === 1 || String(item.status) === 'ACTIVE';
      const matchStatus =
        filterStatus === 'ALL' ||
        (filterStatus === 'ACTIVE' && isActive) ||
        (filterStatus === 'INACTIVE' && !isActive);

      return matchSearch && matchType && matchStatus;
    });
  }, [items, searchQuery, filterType, filterStatus]);

  const partnerTypeTemplate = (rowData: Partner) => {
    const pt = PARTNER_TYPES.find((p) => p.value === rowData.partnerType) || PARTNER_TYPES[PARTNER_TYPES.length - 1];
    return (
      <div className="inline-flex align-items-center gap-1 px-2 py-1 border-round-md" style={{ backgroundColor: `${pt.badgeColor}15`, color: pt.badgeColor }}>
        <i className={`${pt.icon} text-xs`} />
        <span className="font-medium text-xs">
          {t(`partner.${pt.translationKey}`, { defaultValue: rowData.partnerType || 'OTHER' })}
        </span>
      </div>
    );
  };

  const apiKeyTemplate = (rowData: Partner) => {
    if (!rowData.apiKey) return <span className="text-400 text-xs italic">Chưa cấp</span>;
    return (
      <div className="flex align-items-center gap-1">
        <code className="px-2 py-1 border-round bg-bluegray-50 text-bluegray-800 text-xs font-mono font-medium">
          {rowData.apiKey.length > 18 ? `${rowData.apiKey.substring(0, 15)}...` : rowData.apiKey}
        </code>
        <Button
          icon="pi pi-copy"
          text
          rounded
          size="small"
          className="p-0 text-500 hover:text-primary"
          style={{ width: '1.5rem', height: '1.5rem' }}
          onClick={(e) => {
            e.stopPropagation();
            copyToClipboard(rowData.apiKey || '', 'API Key');
          }}
          tooltip={t('partner.copy_api_key', { defaultValue: 'Sao chép API Key' })}
        />
      </div>
    );
  };

  const webhookTemplate = (rowData: Partner) => {
    if (!rowData.webhookUrl) {
      return <span className="text-400 text-xs italic">Chưa cấu hình</span>;
    }
    return (
      <div className="flex align-items-center gap-1" title={rowData.webhookUrl}>
        <i className="pi pi-link text-xs text-green-600" />
        <span className="text-xs text-700 text-overflow-ellipsis overflow-hidden white-space-nowrap" style={{ maxWidth: '12rem' }}>
          {rowData.webhookUrl.replace(/^https?:\/\//, '')}
        </span>
      </div>
    );
  };

  const ipWhitelistTemplate = (rowData: Partner) => {
    const ip = rowData.ipWhitelist || '0.0.0.0/0';
    const isAll = ip === '0.0.0.0/0';
    return (
      <Tag
        value={ip}
        severity={isAll ? 'warning' : 'info'}
        className="text-xs font-mono"
        style={{ padding: '2px 6px' }}
      />
    );
  };

  const actionBodyTemplate = (rowData: Partner) => {
    return (
      <div className="flex gap-1 align-items-center">
        <Button
          icon="pi pi-eye"
          rounded
          outlined
          severity="info"
          size="small"
          onClick={() => openDetail(rowData)}
          tooltip={t('partner.detail_title', { defaultValue: 'Xem thông tin tích hợp' })}
        />
        <Button
          icon="pi pi-pencil"
          rounded
          outlined
          severity="warning"
          size="small"
          onClick={() => editItem(rowData)}
          tooltip={t('common.edit', { defaultValue: 'Chỉnh sửa' })}
        />
        <Button
          icon="pi pi-trash"
          rounded
          outlined
          severity="danger"
          size="small"
          onClick={() => deleteItem(rowData)}
          tooltip={t('common.delete', { defaultValue: 'Xóa đối tác' })}
        />
      </div>
    );
  };

  const statusBodyTemplate = (rowData: Partner) => {
    const isActive = Number(rowData.status) === 1 || String(rowData.status) === 'ACTIVE';
    return isActive ? (
      <Tag severity="success" value={t('common.active', { defaultValue: 'Hoạt động' })} />
    ) : (
      <Tag severity="danger" value={t('common.inactive', { defaultValue: 'Ngừng hoạt động' })} />
    );
  };

  const dateTemplate = (rowData: Partner) => {
    if (!rowData.createdAt) return '-';
    try {
      const d = new Date(rowData.createdAt);
      if (isNaN(d.getTime())) return rowData.createdAt;
      return d.toLocaleString('vi-VN');
    } catch {
      return rowData.createdAt;
    }
  };

  const statusOptions = [
    { label: t('common.active', { defaultValue: 'Đang hoạt động' }), value: 1 },
    { label: t('common.inactive', { defaultValue: 'Ngừng hoạt động' }), value: 0 },
  ];

  const typeFilterOptions = [
    { label: t('partner.all_types', { defaultValue: 'Tất cả lĩnh vực' }), value: 'ALL' },
    ...partnerTypeOptions,
  ];

  const statusFilterOptions = [
    { label: t('common.all', { defaultValue: 'Tất cả trạng thái' }), value: 'ALL' },
    { label: t('common.active', { defaultValue: 'Đang hoạt động' }), value: 'ACTIVE' },
    { label: t('common.inactive', { defaultValue: 'Ngừng hoạt động' }), value: 'INACTIVE' },
  ];

  const header = (
    <div className="flex flex-column gap-3">
      {/* Top Bar: Title & Action Buttons */}
      <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
        <div>
          <h4 className="m-0 text-primary font-bold">{t('partner.management_title', { defaultValue: 'Quản lý Đối tác Liên minh' })}</h4>
          <p className="m-0 text-500 text-xs mt-1">
            {t('partner.subtitle', { defaultValue: 'Quản lý danh sách đối tác kết nối, phân loại lĩnh vực, thông tin xác thực API và Webhook' })}
          </p>
        </div>
        <div className="flex gap-2 align-items-center">
          <Button
            label={t('partner.add_new', { defaultValue: 'Thêm Đối tác' })}
            icon="pi pi-plus"
            severity="success"
            onClick={openNew}
            className="shadow-1"
          />
          <Button
            icon="pi pi-refresh"
            rounded
            outlined
            onClick={() => fetchData(selectedTenant)}
            tooltip={t('common.refresh', { defaultValue: 'Làm mới' })}
          />
        </div>
      </div>

      {/* Filter Bar: Tenant Selector & Search & Dropdown Filters */}
      <div className="flex flex-wrap gap-2 align-items-center justify-content-between pt-2 border-top-1 surface-border">
        <div className="flex flex-wrap gap-2 align-items-center">
          <TenantSelector value={selectedTenant} onChange={handleTenantChange} />
          <Dropdown
            value={filterType}
            options={typeFilterOptions}
            onChange={(e) => setFilterType(e.value)}
            className="w-14rem"
            placeholder={t('partner.filter_partner_type', { defaultValue: 'Lọc theo lĩnh vực' })}
          />
          <Dropdown
            value={filterStatus}
            options={statusFilterOptions}
            onChange={(e) => setFilterStatus(e.value)}
            className="w-12rem"
            placeholder={t('common.select_status', { defaultValue: 'Trạng thái' })}
          />
        </div>
        <div className="p-input-icon-left w-16rem">
          <i className="pi pi-search" />
          <InputText
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('common.search', { defaultValue: 'Tìm kiếm mã, tên, API Key...' })}
            className="w-full p-inputtext-sm"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <Toast ref={toast} position="top-right" />
      <ConfirmDialog />
      <AppBreadcrumb items={[{ label: t('nav.partners', { defaultValue: 'Đối tác' }) }]} />

      <div className="card shadow-1 border-round surface-card p-4">
        <DataTable<any>
          value={filteredItems}
          selection={selectedItems}
          onSelectionChange={(e: any) => setSelectedItems(e.value || [])}
          loading={loading}
          header={header}
          dataKey="id"
          paginator
          rows={10}
          rowsPerPageOptions={[10, 25, 50]}
          emptyMessage={t('common.no_data', { defaultValue: 'Không có dữ liệu đối tác' })}
          stripedRows
          responsiveLayout="scroll"
          className="p-datatable-sm"
        >
          {/* Cột 1: Checkbox */}
          <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />

          {/* Cột 2: STT */}
          <Column
            header={t('common.stt', { defaultValue: 'STT' })}
            body={(_, options) => options.rowIndex + 1}
            style={{ width: '3.5rem', textAlign: 'center' }}
          />

          {/* Cột 3: Thao tác / Hành động */}
          <Column
            body={actionBodyTemplate}
            exportable={false}
            header={t('common.actions', { defaultValue: 'Thao tác' })}
            style={{ width: '7.5rem', textAlign: 'center' }}
          />

          {/* Cột 4: Mã Đối tác */}
          <Column
            field="partnerCode"
            header={t('partner.code', { defaultValue: 'Mã Đối tác' })}
            body={(rowData) => <span className="font-mono font-bold text-primary">{rowData.partnerCode}</span>}
            sortable
            style={{ minWidth: '11rem' }}
          />

          {/* Cột 5: Tên Đối tác */}
          <Column
            field="partnerName"
            header={t('partner.name', { defaultValue: 'Tên Đối tác' })}
            body={(rowData) => <span className="font-semibold text-900">{rowData.partnerName}</span>}
            sortable
            style={{ minWidth: '14rem' }}
          />

          {/* Cột 6: Lĩnh vực kinh doanh */}
          <Column
            field="partnerType"
            header={t('partner.type', { defaultValue: 'Lĩnh vực' })}
            body={partnerTypeTemplate}
            sortable
            style={{ minWidth: '11rem' }}
          />

          {/* Cột 7: API Key */}
          <Column
            field="apiKey"
            header={t('partner.api_key', { defaultValue: 'API Key (B2B)' })}
            body={apiKeyTemplate}
            style={{ minWidth: '13rem' }}
          />

          {/* Cột 8: Webhook Callback */}
          <Column
            field="webhookUrl"
            header={t('partner.webhook_title', { defaultValue: 'Webhook' })}
            body={webhookTemplate}
            style={{ minWidth: '11rem' }}
          />

          {/* Cột 9: IP Whitelist */}
          <Column
            field="ipWhitelist"
            header={t('partner.ip_whitelist', { defaultValue: 'IP Whitelist' })}
            body={ipWhitelistTemplate}
            style={{ minWidth: '9rem' }}
          />

          {/* Cột 10: Trạng thái */}
          <Column
            field="status"
            body={statusBodyTemplate}
            header={t('common.status', { defaultValue: 'Trạng thái' })}
            sortable
            style={{ minWidth: '8.5rem' }}
          />

          {/* Cột 11: Ngày tạo */}
          <Column
            field="createdAt"
            body={dateTemplate}
            header={t('common.created_at', { defaultValue: 'Ngày tạo' })}
            sortable
            style={{ minWidth: '11rem' }}
          />
        </DataTable>
      </div>

      {/* Dialog Tạo mới / Chỉnh sửa Đối tác */}
      <Dialog
        visible={showDialog}
        style={{ width: '46rem' }}
        breakpoints={{ '960px': '75vw', '641px': '95vw' }}
        header={isEdit ? t('partner.edit_title', { defaultValue: 'Cập nhật Thông tin Đối tác' }) : t('partner.create_title', { defaultValue: 'Thêm mới Đối tác Liên minh' })}
        modal
        className="p-fluid"
        onHide={() => setShowDialog(false)}
      >
        <div className="flex flex-column gap-4 py-2">
          {/* Section 1: Thông tin cơ bản */}
          <div className="p-3 border-round surface-50 border-1 surface-border">
            <h5 className="m-0 mb-3 text-900 font-bold flex align-items-center gap-2">
              <i className="pi pi-id-card text-primary" />
              {t('common.basic_info', { defaultValue: 'Thông tin Định danh Đối tác' })}
            </h5>
            <div className="grid">
              <div className="col-12 md:col-6 field mb-3">
                <label htmlFor="partnerCode" className="font-semibold text-xs text-700">
                  {t('partner.code', { defaultValue: 'Mã Đối tác' })} <span className="text-red-500">*</span>
                </label>
                <InputText
                  id="partnerCode"
                  value={formData.partnerCode || ''}
                  onChange={(e) => setFormData({ ...formData, partnerCode: e.target.value.toUpperCase() })}
                  required
                  autoFocus
                  disabled={isEdit}
                  placeholder={t('partner.code_placeholder', { defaultValue: 'Ví dụ: DELIMART_RETAIL' })}
                  className="p-inputtext-sm font-mono"
                />
              </div>

              <div className="col-12 md:col-6 field mb-3">
                <label htmlFor="partnerName" className="font-semibold text-xs text-700">
                  {t('partner.name', { defaultValue: 'Tên Đối tác' })} <span className="text-red-500">*</span>
                </label>
                <InputText
                  id="partnerName"
                  value={formData.partnerName || ''}
                  onChange={(e) => setFormData({ ...formData, partnerName: e.target.value })}
                  required
                  placeholder={t('partner.name_placeholder', { defaultValue: 'Ví dụ: Hệ Thống Siêu Thị Delimart' })}
                  className="p-inputtext-sm"
                />
              </div>

              <div className="col-12 md:col-6 field mb-3">
                <label htmlFor="partnerType" className="font-semibold text-xs text-700">
                  {t('partner.type', { defaultValue: 'Lĩnh vực kinh doanh' })}
                </label>
                <Dropdown
                  id="partnerType"
                  value={formData.partnerType || 'RETAIL'}
                  options={partnerTypeOptions}
                  onChange={(e) => setFormData({ ...formData, partnerType: e.value })}
                  placeholder={t('partner.type_placeholder', { defaultValue: 'Chọn lĩnh vực hoạt động...' })}
                  className="p-inputtext-sm"
                  itemTemplate={(option) => (
                    <div className="flex align-items-center gap-2">
                      <i className={option.icon} style={{ color: option.color }} />
                      <span>{option.label}</span>
                    </div>
                  )}
                />
              </div>

              <div className="col-12 md:col-6 field mb-3">
                <label htmlFor="status" className="font-semibold text-xs text-700">
                  {t('common.status', { defaultValue: 'Trạng thái' })}
                </label>
                <Dropdown
                  id="status"
                  value={formData.status ?? 1}
                  options={statusOptions}
                  onChange={(e) => setFormData({ ...formData, status: e.value })}
                  className="p-inputtext-sm"
                />
              </div>
            </div>
          </div>

          {/* Section 2: B2B Dual-Key Security */}
          <div className="p-3 border-round surface-50 border-1 surface-border">
            <div className="flex justify-content-between align-items-center mb-3">
              <h5 className="m-0 text-900 font-bold flex align-items-center gap-2">
                <i className="pi pi-shield text-primary" />
                {t('partner.credentials_title', { defaultValue: 'Thông tin Xác thực B2B Dual-Key (Bảo mật API)' })}
              </h5>
              <Button
                label={t('partner.generate_keys', { defaultValue: 'Tạo cặp khóa mới' })}
                icon="pi pi-sync"
                size="small"
                outlined
                severity="secondary"
                onClick={() => {
                  setFormData({
                    ...formData,
                    apiKey: generateRandomApiKey(),
                    secretKey: generateRandomSecretKey(),
                  });
                  toast.current?.show({
                    severity: 'info',
                    summary: t('common.success', { defaultValue: 'Thành công' }),
                    detail: 'Đã sinh cặp khóa B2B mới!',
                    life: 2000,
                  });
                }}
              />
            </div>

            <div className="grid">
              <div className="col-12 field mb-3">
                <label className="font-semibold text-xs text-700">
                  {t('partner.api_key', { defaultValue: 'API Key (Public Key)' })}
                </label>
                <div className="p-inputgroup">
                  <InputText
                    value={formData.apiKey || ''}
                    onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                    placeholder={t('partner.api_key_placeholder', { defaultValue: 'pk_live_...' })}
                    className="p-inputtext-sm font-mono"
                  />
                  <Button
                    icon="pi pi-copy"
                    severity="secondary"
                    outlined
                    onClick={() => copyToClipboard(formData.apiKey || '', 'API Key')}
                    tooltip={t('partner.copy_api_key', { defaultValue: 'Sao chép API Key' })}
                  />
                </div>
              </div>

              <div className="col-12 field mb-3">
                <label className="font-semibold text-xs text-700">
                  {t('partner.secret_key', { defaultValue: 'Secret Key (Khóa bí mật HMAC)' })}
                </label>
                <div className="p-inputgroup">
                  <InputText
                    type={showSecret ? 'text' : 'password'}
                    value={formData.secretKey || ''}
                    onChange={(e) => setFormData({ ...formData, secretKey: e.target.value })}
                    placeholder={t('partner.secret_key_placeholder', { defaultValue: 'sk_live_...' })}
                    className="p-inputtext-sm font-mono"
                  />
                  <Button
                    icon={showSecret ? 'pi pi-eye-slash' : 'pi pi-eye'}
                    severity="secondary"
                    outlined
                    onClick={() => setShowSecret(!showSecret)}
                    tooltip={showSecret ? t('partner.hide_secret', { defaultValue: 'Ẩn Secret Key' }) : t('partner.show_secret', { defaultValue: 'Hiển thị Secret Key' })}
                  />
                  <Button
                    icon="pi pi-copy"
                    severity="secondary"
                    outlined
                    onClick={() => copyToClipboard(formData.secretKey || '', 'Secret Key')}
                    tooltip={t('partner.copy_secret_key', { defaultValue: 'Sao chép Secret Key' })}
                  />
                </div>
              </div>

              <div className="col-12 field mb-0">
                <label className="font-semibold text-xs text-700 flex align-items-center gap-1">
                  {t('partner.ip_whitelist', { defaultValue: 'Danh sách IP Whitelist' })}
                  <i className="pi pi-info-circle text-500 text-xs" title={t('partner.ip_whitelist_tooltip', { defaultValue: 'Địa chỉ IP được phép gọi API tích/tiêu điểm' })} />
                </label>
                <InputText
                  value={formData.ipWhitelist || ''}
                  onChange={(e) => setFormData({ ...formData, ipWhitelist: e.target.value })}
                  placeholder={t('partner.ip_whitelist_placeholder', { defaultValue: 'Ví dụ: 192.168.1.1, 10.0.0.0/24 hoặc 0.0.0.0/0' })}
                  className="p-inputtext-sm font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Webhook Outbox Event */}
          <div className="p-3 border-round surface-50 border-1 surface-border">
            <h5 className="m-0 mb-3 text-900 font-bold flex align-items-center gap-2">
              <i className="pi pi-send text-primary" />
              {t('partner.webhook_title', { defaultValue: 'Cấu hình Webhook Sự kiện' })}
            </h5>
            <div className="grid">
              <div className="col-12 field mb-3">
                <label className="font-semibold text-xs text-700">
                  {t('partner.webhook_url', { defaultValue: 'Webhook Callback URL' })}
                </label>
                <InputText
                  value={formData.webhookUrl || ''}
                  onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
                  placeholder={t('partner.webhook_url_placeholder', { defaultValue: 'https://api.partner.com/loyalty/webhook' })}
                  className="p-inputtext-sm font-mono"
                />
              </div>

              <div className="col-12 field mb-0">
                <div className="flex justify-content-between align-items-center mb-1">
                  <label className="font-semibold text-xs text-700">
                    {t('partner.webhook_secret', { defaultValue: 'Webhook Secret (Ký X-Loyalty-Signature)' })}
                  </label>
                  <Button
                    label={t('partner.generate_webhook_secret', { defaultValue: 'Tạo mã mới' })}
                    icon="pi pi-key"
                    text
                    size="small"
                    className="p-0 text-xs text-primary"
                    onClick={() => setFormData({ ...formData, webhookSecret: generateRandomWebhookSecret() })}
                  />
                </div>
                <div className="p-inputgroup">
                  <InputText
                    value={formData.webhookSecret || ''}
                    onChange={(e) => setFormData({ ...formData, webhookSecret: e.target.value })}
                    placeholder={t('partner.webhook_secret_placeholder', { defaultValue: 'whsec_...' })}
                    className="p-inputtext-sm font-mono"
                  />
                  <Button
                    icon="pi pi-copy"
                    severity="secondary"
                    outlined
                    onClick={() => copyToClipboard(formData.webhookSecret || '', 'Webhook Secret')}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-content-end gap-2 mt-4">
          <Button label={t('common.cancel', { defaultValue: 'Hủy' })} icon="pi pi-times" outlined onClick={() => setShowDialog(false)} />
          <Button label={t('common.save', { defaultValue: 'Lưu thông tin' })} icon="pi pi-check" severity="success" onClick={saveItem} />
        </div>
      </Dialog>

      {/* Dialog Xem Chi tiết Thông số Tích hợp B2B (Integration Modal) */}
      <Dialog
        visible={showDetailDialog}
        style={{ width: '40rem' }}
        breakpoints={{ '960px': '75vw', '641px': '95vw' }}
        header={t('partner.detail_title', { defaultValue: 'Thông số Tích hợp Kỹ thuật B2B' })}
        modal
        onHide={() => setShowDetailDialog(false)}
      >
        {detailPartner && (
          <div className="flex flex-column gap-3 py-2">
            <div className="flex align-items-center justify-content-between p-3 border-round bg-primary-50">
              <div>
                <h4 className="m-0 text-primary font-bold">{detailPartner.partnerName}</h4>
                <code className="text-sm font-mono font-semibold text-700">{detailPartner.partnerCode}</code>
              </div>
              <div>{partnerTypeTemplate(detailPartner)}</div>
            </div>

            <div className="flex flex-column gap-2">
              <label className="font-semibold text-xs text-500">API Key (X-Api-Key Header)</label>
              <div className="p-inputgroup">
                <InputText value={detailPartner.apiKey || 'Chưa cấp'} readOnly className="p-inputtext-sm font-mono bg-50" />
                <Button icon="pi pi-copy" severity="secondary" outlined onClick={() => copyToClipboard(detailPartner.apiKey || '', 'API Key')} />
              </div>
            </div>

            <div className="flex flex-column gap-2">
              <label className="font-semibold text-xs text-500">Secret Key (Ký HMAC-SHA256)</label>
              <div className="p-inputgroup">
                <InputText value={detailPartner.secretKey || 'Chưa cấp'} readOnly className="p-inputtext-sm font-mono bg-50" />
                <Button icon="pi pi-copy" severity="secondary" outlined onClick={() => copyToClipboard(detailPartner.secretKey || '', 'Secret Key')} />
              </div>
            </div>

            <div className="flex flex-column gap-2">
              <label className="font-semibold text-xs text-500">Webhook URL</label>
              <div className="p-inputgroup">
                <InputText value={detailPartner.webhookUrl || 'Chưa cấu hình'} readOnly className="p-inputtext-sm font-mono bg-50" />
                {detailPartner.webhookUrl && (
                  <Button icon="pi pi-copy" severity="secondary" outlined onClick={() => copyToClipboard(detailPartner.webhookUrl || '', 'Webhook URL')} />
                )}
              </div>
            </div>

            <div className="flex flex-column gap-2">
              <label className="font-semibold text-xs text-500">Webhook Secret (X-Loyalty-Signature)</label>
              <div className="p-inputgroup">
                <InputText value={detailPartner.webhookSecret || 'Chưa cấu hình'} readOnly className="p-inputtext-sm font-mono bg-50" />
                {detailPartner.webhookSecret && (
                  <Button icon="pi pi-copy" severity="secondary" outlined onClick={() => copyToClipboard(detailPartner.webhookSecret || '', 'Webhook Secret')} />
                )}
              </div>
            </div>

            <div className="flex flex-column gap-2">
              <label className="font-semibold text-xs text-500">IP Whitelist</label>
              <InputText value={detailPartner.ipWhitelist || '0.0.0.0/0'} readOnly className="p-inputtext-sm font-mono bg-50" />
            </div>

            <div className="p-3 border-round surface-100 border-1 surface-border mt-2">
              <div className="font-semibold text-xs text-700 mb-1">Mẫu HTTP Headers khi gọi API từ POS / Backend Đối tác:</div>
              <pre className="m-0 text-xs font-mono text-800 line-height-3 bg-white p-2 border-round">
{`X-Tenant-Id: ${selectedTenant}
X-Api-Key: ${detailPartner.apiKey || 'pk_live_...'}
X-Signature: <HMAC-SHA256(timestamp + "." + body, secretKey)>
X-Timestamp: ${Math.floor(Date.now() / 1000)}
Content-Type: application/json`}
              </pre>
            </div>
          </div>
        )}
        <div className="flex justify-content-end mt-3">
          <Button label={t('common.close', { defaultValue: 'Đóng' })} icon="pi pi-times" onClick={() => setShowDetailDialog(false)} />
        </div>
      </Dialog>
    </div>
  );
};

export default Partners;
