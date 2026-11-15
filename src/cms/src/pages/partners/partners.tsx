import React, { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { TabView, TabPanel } from 'primereact/tabview';
import { Skeleton } from 'primereact/skeleton';
import { useTranslation } from 'react-i18next';
import { Partner, partnerService } from '@/service/partner.service';
import { LoyaltyService, SystemIntegrationItemModel, PartnerApiKeyItemModel } from '@/service/loyalty.service';
import { StandardPageHeader } from '@/components/StandardPageHeader';
import { UniversalFilterBar } from '@/components/UniversalFilterBar';
import { StandardRowActions } from '@/components/StandardRowActions';
import { StatusBadge, TypeBadge } from '@/components/StatusBadge';
import { exportToExcel } from '@/components/exportHelper';
import { ApiKeyStatus, CommonStatus } from '@/models';
import { useGeneralCategory } from '@/hooks/useGeneralCategory';

// eslint-disable-next-line react-refresh/only-export-components
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
  const { data: dbPartnerTypes } = useGeneralCategory('PARTNER_TYPE');
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

  // QT-06 Connections overview · 6 systems & API Key Rotate / IP-Webhook Dialog
  const [integrations, setIntegrations] = useState<SystemIntegrationItemModel[]>([]);
  const [integrationsLoading, setIntegrationsLoading] = useState<boolean>(false);
  const [showKeyWebhookDialog, setShowKeyWebhookDialog] = useState<boolean>(false);
  const [keyTargetPartner, setKeyTargetPartner] = useState<Partner | null>(null);
  const [editWebhookUrl, setEditWebhookUrl] = useState<string>('');
  const [editIpWhitelist, setEditIpWhitelist] = useState<string>('');
  const [rotatedKeyOnce, setRotatedKeyOnce] = useState<string | null>(null);
  const [partnerKeys, setPartnerKeys] = useState<PartnerApiKeyItemModel[]>([]);
  const [keyLoading, setKeyLoading] = useState<boolean>(false);

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

  const fetchData = useCallback(async (tenantId: string = selectedTenant) => {
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
  }, [selectedTenant]);

  const fetchIntegrations = useCallback(async (tenantId: string = selectedTenant) => {
    setIntegrationsLoading(true);
    try {
      const list = await LoyaltyService.getIntegrationsOverview(tenantId);
      setIntegrations(Array.isArray(list) ? list : []);
    } finally {
      setIntegrationsLoading(false);
    }
  }, [selectedTenant]);

  useEffect(() => {
    fetchData(selectedTenant);
    fetchIntegrations(selectedTenant);
  }, [fetchData, fetchIntegrations, selectedTenant]);

  const openKeyWebhookDialog = async (p: Partner) => {
    setKeyTargetPartner(p);
    setEditWebhookUrl(p.webhookUrl || '');
    setEditIpWhitelist(p.ipWhitelist || '0.0.0.0/0');
    setRotatedKeyOnce(null);
    setShowKeyWebhookDialog(true);
    setKeyLoading(true);
    try {
      const cfg = await LoyaltyService.getPartnerApiKeys(selectedTenant);
      setPartnerKeys(Array.isArray(cfg?.keys) ? cfg.keys : []);
    } finally {
      setKeyLoading(false);
    }
  };

  const handleSaveWebhookAndIp = async () => {
    if (!keyTargetPartner) return;
    setKeyLoading(true);
    try {
      await LoyaltyService.updatePartnerWebhookConfig(
        { webhookUrl: editWebhookUrl.trim(), ipWhitelist: editIpWhitelist.split(',').map((s) => s.trim()).filter(Boolean).join(',') },
        selectedTenant
      );
      toast.current?.show({ severity: 'success', summary: t('common.success'), detail: t('partner.webhook_updated') });
      fetchData(selectedTenant);
    } catch (err: any) {
      toast.current?.show({ severity: 'error', summary: t('common.error'), detail: err?.response?.data?.message || err.message });
    } finally {
      setKeyLoading(false);
    }
  };

  const handleRotateApiKey = async () => {
    setKeyLoading(true);
    try {
      const res = await LoyaltyService.rotatePartnerApiKey({ label: `Rotated Key (${new Date().toISOString().slice(0, 10)})` }, selectedTenant);
      setRotatedKeyOnce(res?.plainTextKey || null);
      const cfg = await LoyaltyService.getPartnerApiKeys(selectedTenant);
      setPartnerKeys(Array.isArray(cfg?.keys) ? cfg.keys : []);
      toast.current?.show({ severity: 'success', summary: t('common.success'), detail: t('partner.rotate_success') });
    } catch (err: any) {
      toast.current?.show({ severity: 'error', summary: t('common.error'), detail: err?.response?.data?.message || err.message });
    } finally {
      setKeyLoading(false);
    }
  };

  const handleRevokeOldKey = async (keyId: number) => {
    setKeyLoading(true);
    try {
      await LoyaltyService.revokePartnerApiKey(keyId, selectedTenant);
      const keys = await LoyaltyService.getPartnerApiKeys(selectedTenant);
      setPartnerKeys(Array.isArray(keys) ? keys : []);
      toast.current?.show({ severity: 'info', summary: t('common.success'), detail: t('partner.key_revoked') });
    } catch (err: any) {
      toast.current?.show({ severity: 'error', summary: t('common.error'), detail: err?.response?.data?.message || err.message });
    } finally {
      setKeyLoading(false);
    }
  };

  const handleTenantChange = (tenantId: string) => {
    setSelectedTenant(tenantId);
  };

  const copyToClipboard = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.current?.show({
      severity: 'info',
      summary: t('common.success'),
      detail: `${label}: ${t('partner.copied_key')}`,
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
    const statusVal = Number(item.status) === 1 || String(item.status) === CommonStatus.ACTIVE ? 1 : 0;
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
      message: t('partner.confirm_delete_msg', { name: item.partnerName }),
      header: t('common.confirm_delete'),
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      acceptLabel: t('common.delete'),
      rejectLabel: t('common.cancel'),
      accept: async () => {
        try {
          await partnerService.delete(item.id!, selectedTenant);
          toast.current?.show({
            severity: 'success',
            summary: t('common.success'),
            detail: t('partner.delete_success'),
            life: 3000,
          });
          fetchData(selectedTenant);
        } catch (e: any) {
          console.error('[Partners.deleteItem] Error:', e);
          toast.current?.show({
            severity: 'error',
            summary: t('common.error'),
            detail: t('partner.delete_failed') + ': ' + (e?.message || ''),
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
          summary: t('common.success'),
          detail: t('partner.update_success'),
          life: 3000,
        });
      } else {
        await partnerService.create(payload, selectedTenant);
        toast.current?.show({
          severity: 'success',
          summary: t('common.success'),
          detail: t('partner.create_success'),
          life: 3000,
        });
      }
      setShowDialog(false);
      fetchData(selectedTenant);
    } catch (e: any) {
      console.error('[Partners.saveItem] Error:', e);
      toast.current?.show({
        severity: 'error',
        summary: t('common.error'),
        detail: t('partner.save_failed') + ': ' + (e?.message || ''),
        life: 4000,
      });
    }
  };

  const saveItem = () => {
    if (!formData.partnerCode || !formData.partnerName) {
      toast.current?.show({
        severity: 'warn',
        summary: t('common.warning'),
        detail: t('partner.enter_required_fields'),
        life: 3000,
      });
      return;
    }

    if (isEdit) {
      confirmDialog({
        message: t('partner.confirm_update_msg', { name: formData.partnerName || '' }),
        header: t('common.confirm_update'),
        icon: 'pi pi-question-circle',
        acceptLabel: t('common.confirm'),
        rejectLabel: t('common.cancel'),
        accept: executeSave,
      });
    } else {
      executeSave();
    }
  };

  // Danh sách lĩnh vực hiển thị từ Danh mục động CSDL (hoặc danh mục mặc định)
  const partnerTypeOptions = useMemo(() => {
    if (dbPartnerTypes.length > 0) {
      return dbPartnerTypes.map((pt) => ({
        value: pt.code,
        label: pt.name,
        icon: 'pi pi-tag',
        color: '#3B82F6',
      }));
    }
    return PARTNER_TYPES.map((pt) => ({
      value: pt.value,
      label: t(`partner.${pt.translationKey}`),
      icon: pt.icon,
      color: pt.badgeColor,
    }));
  }, [dbPartnerTypes, t]);

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
      const isActive = Number(item.status) === 1 || String(item.status) === CommonStatus.ACTIVE;
      const matchStatus =
        filterStatus === 'ALL' ||
        (filterStatus === CommonStatus.ACTIVE && isActive) ||
        (filterStatus === CommonStatus.INACTIVE && !isActive);

      return matchSearch && matchType && matchStatus;
    });
  }, [items, searchQuery, filterType, filterStatus]);

  const partnerTypeTemplate = (rowData: Partner) => {
    const dbType = dbPartnerTypes.find((p) => p.code === rowData.partnerType);
    if (dbType) {
      return <TypeBadge type={dbType.code} label={dbType.name} />;
    }
    const pt = PARTNER_TYPES.find((p) => p.value === rowData.partnerType) || PARTNER_TYPES[PARTNER_TYPES.length - 1];
    return (
      <span className="text-900">
        {t(`partner.${pt.translationKey}`)}
      </span>
    );
  };

  const apiKeyTemplate = (rowData: Partner) => {
    if (!rowData.apiKey) return <span className="text-400 text-xs italic">{t('partner.not_issued')}</span>;
    return (
      <div className="flex align-items-center gap-1">
        <span className="text-900 font-mono text-xs">
          {rowData.apiKey.length > 18 ? `${rowData.apiKey.substring(0, 15)}...` : rowData.apiKey}
        </span>
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
          tooltip={t('partner.copy_api_key')}
        />
      </div>
    );
  };

  const webhookTemplate = (rowData: Partner) => {
    if (!rowData.webhookUrl) {
      return <span className="text-400 text-xs italic">{t('partner.not_configured')}</span>;
    }
    return (
      <span className="text-900 text-xs text-overflow-ellipsis overflow-hidden white-space-nowrap block" style={{ maxWidth: '12rem' }} title={rowData.webhookUrl}>
        {rowData.webhookUrl.replace(/^https?:\/\//, '')}
      </span>
    );
  };

  const ipWhitelistTemplate = (rowData: Partner) => {
    const ip = rowData.ipWhitelist || '0.0.0.0/0';
    return (
      <span className="text-900 text-xs font-mono">
        {ip}
      </span>
    );
  };

  const actionBodyTemplate = (rowData: Partner) => {
    return (
      <StandardRowActions
        onView={() => openDetail(rowData)}
        onEdit={() => editItem(rowData)}
        onDelete={() => deleteItem(rowData)}
        extraActions={[
          {
            label: t('partner.manage_key_webhook'),
            icon: 'pi pi-key',
            onClick: () => openKeyWebhookDialog(rowData),
          },
        ]}
      />
    );
  };

  const handleExport = () => {
    exportToExcel(
      filteredItems.map((p, idx) => ({
        stt: idx + 1,
        partnerCode: p.partnerCode,
        partnerName: p.partnerName,
        partnerType: p.partnerType,
        apiKey: p.apiKey || '',
        webhookUrl: p.webhookUrl || '',
        ipWhitelist: p.ipWhitelist || '',
        status: Number(p.status) === 1 ? t('common.active') : t('common.inactive'),
      })),
      [
        { key: 'stt', header: t('common.stt') },
        { key: 'partnerCode', header: t('partner.code') },
        { key: 'partnerName', header: t('partner.name') },
        { key: 'partnerType', header: t('partner.type') },
        { key: 'apiKey', header: t('partner.api_key') },
        { key: 'webhookUrl', header: t('partner.webhook_url') },
        { key: 'ipWhitelist', header: t('partner.ip_whitelist') },
        { key: 'status', header: t('common.status') },
      ],
      `Danh_Sach_Doi_Tac_${selectedTenant}`
    );
  };

  const statusBodyTemplate = (rowData: Partner) => {
    const isActive = Number(rowData.status) === 1 || String(rowData.status) === CommonStatus.ACTIVE;
    return <StatusBadge status={isActive ? 'ACTIVE' : 'INACTIVE'} />;
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
    { label: t('common.active'), value: 1 },
    { label: t('common.inactive'), value: 0 },
  ];

  const typeFilterOptions = [
    { label: t('partner.all_types'), value: 'ALL' },
    ...partnerTypeOptions,
  ];

  const statusFilterOptions = [
    { label: t('common.all'), value: 'ALL' },
    { label: t('common.active'), value: CommonStatus.ACTIVE },
    { label: t('common.inactive'), value: CommonStatus.INACTIVE },
  ];

  return (
    <div className="w-full">
      <Toast ref={toast} position="top-right" />
      <ConfirmDialog />
      <StandardPageHeader
        title={t('nav.partners')}
        subtitle={t('partner.subtitle', 'Quản lý danh sách đối tác liên minh, cấp phát API Key B2B và Webhook')}
        breadcrumbs={[{ label: t('nav.partners') }]}
        tenantValue={selectedTenant}
        onTenantChange={handleTenantChange}
        primaryAction={{
          label: t('common.add_new'),
          icon: 'pi pi-plus',
          onClick: openNew,
        }}
      />

      <div className="card shadow-1 border-round surface-card p-3 w-full">
        <TabView>
          <TabPanel header={t('partner.tab_directory')} leftIcon="pi pi-building mr-2">
            <UniversalFilterBar
              searchValue={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder={t('common.search')}
              basicFilters={[
                {
                  key: 'filterType',
                  label: t('partner.filter_partner_type'),
                  value: filterType,
                  options: typeFilterOptions,
                  onChange: (val) => setFilterType(val),
                  placeholder: t('partner.filter_partner_type'),
                },
                {
                  key: 'filterStatus',
                  label: t('common.select_status'),
                  value: filterStatus,
                  options: statusFilterOptions,
                  onChange: (val) => setFilterStatus(val),
                  placeholder: t('common.select_status'),
                },
              ]}
              onExport={handleExport}
              onReset={() => {
                setSearchQuery('');
                setFilterType('ALL');
                setFilterStatus('ALL');
              }}
              onRefresh={() => fetchData(selectedTenant)}
            />

            <DataTable<any>
              value={filteredItems}
              selection={selectedItems}
              onSelectionChange={(e: any) => setSelectedItems(e.value || [])}
              loading={loading}
              dataKey="id"
              paginator
              rows={10}
              rowsPerPageOptions={[10, 25, 50]}
              emptyMessage={t('common.no_data')}
              stripedRows
              responsiveLayout="scroll"
              className="p-datatable-sm"
            >
              {/* Cột 1: Checkbox */}
              <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />

              {/* Cột 2: STT */}
              <Column
                header={t('common.order_number', 'STT')}
                body={(_, options) => options.rowIndex + 1}
                style={{ width: '4rem', textAlign: 'center' }}
              />

              {/* Cột 3: Thao tác / Hành động */}
              <Column
                body={actionBodyTemplate}
                exportable={false}
                header={t('common.action', 'Thao tác')}
                style={{ width: '7.5rem', textAlign: 'center' }}
              />

              {/* Cột 4: Mã Đối tác */}
              <Column
                field="partnerCode"
                header={t('partner.code')}
                body={(rowData) => <span className="font-mono font-bold text-900">{rowData.partnerCode}</span>}
                sortable
                style={{ minWidth: '11rem' }}
              />

              {/* Cột 5: Tên Đối tác */}
              <Column
                field="partnerName"
                header={t('partner.name')}
                body={(rowData) => <span className="text-900">{rowData.partnerName}</span>}
                sortable
                style={{ minWidth: '14rem' }}
              />

              {/* Cột 6: Lĩnh vực kinh doanh */}
              <Column
                field="partnerType"
                header={t('partner.type')}
                body={partnerTypeTemplate}
                sortable
                style={{ minWidth: '11rem' }}
              />

              {/* Cột 7: API Key */}
              <Column
                field="apiKey"
                header={t('partner.api_key')}
                body={apiKeyTemplate}
                style={{ minWidth: '13rem' }}
              />

              {/* Cột 8: Webhook Callback */}
              <Column
                field="webhookUrl"
                header={t('partner.webhook_title')}
                body={webhookTemplate}
                style={{ minWidth: '11rem' }}
              />

              {/* Cột 9: IP Whitelist */}
              <Column
                field="ipWhitelist"
                header={t('partner.ip_whitelist')}
                body={ipWhitelistTemplate}
                style={{ minWidth: '9rem' }}
              />

              {/* Cột 10: Trạng thái */}
              <Column
                field="status"
                body={statusBodyTemplate}
                header={t('common.status')}
                sortable
                style={{ minWidth: '8.5rem', textAlign: 'center' }}
              />

          {/* Cột 11: Ngày tạo */}
          <Column
            field="createdAt"
            body={dateTemplate}
            header={t('common.created_at')}
            sortable
            style={{ minWidth: '11rem' }}
          />
        </DataTable>
          </TabPanel>

          <TabPanel header={t('partner.tab_connections_overview')} leftIcon="pi pi-sitemap mr-2">
            <div className="flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
              <div>
                <h5 className="m-0 font-medium text-900">{t('partner.qt06_title')}</h5>
                <span className="text-xs text-500">{t('partner.qt06_desc')}</span>
              </div>
              <Button icon="pi pi-refresh" label={t('common.refresh')} outlined size="small" onClick={() => fetchIntegrations(selectedTenant)} loading={integrationsLoading} />
            </div>

            {integrationsLoading ? (
              <div className="grid">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="col-12 md:col-4"><Skeleton height="8rem" /></div>
                ))}
              </div>
            ) : integrations.length === 0 ? (
              <div className="text-center p-5 border-1 surface-border border-round surface-50 text-500">
                <i className="pi pi-sitemap text-3xl mb-2 block text-400" />
                {t('partner.no_integrations')}
              </div>
            ) : (
              <div className="grid">
                {integrations.map((sys) => (
                  <div key={sys.systemCode} className="col-12 md:col-6 lg:col-4">
                    <div className="p-3 border-round surface-card border-1 surface-border h-full flex flex-column justify-content-between gap-2">
                      <div className="flex justify-content-between align-items-start gap-2">
                        <div>
                          <div className="font-medium text-900">{sys.systemName}</div>
                          <div className="text-xs font-mono text-500">{sys.systemCode} · {sys.protocol || 'REST/HTTPS'}</div>
                        </div>
                        <StatusBadge status={sys.status} />
                      </div>
                      <div className="text-xs text-600 text-overflow-ellipsis overflow-hidden white-space-nowrap" title={sys.endpointUrl}>{sys.endpointUrl || '--'}</div>
                      <div className="flex justify-content-between text-xs pt-2 border-top-1 surface-border">
                        <span>Latency: <span className="font-mono">{sys.latencyMs ?? 0} ms</span></span>
                        <span>Uptime: <span className="font-mono">{Number(sys.uptimePercent ?? 0).toFixed(2)}%</span></span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabPanel>
        </TabView>
      </div>

      {/* Dialog Tạo mới / Chỉnh sửa Đối tác */}
      <Dialog
        visible={showDialog}
        style={{ width: '46rem' }}
        breakpoints={{ '960px': '75vw', '641px': '95vw' }}
        header={isEdit ? t('partner.edit_title') : t('partner.create_title')}
        modal
        onHide={() => setShowDialog(false)}
      >
        <div className="p-fluid flex flex-column gap-4 py-2">
          {/* Section 1: Thông tin cơ bản */}
          <div className="p-3 border-round surface-50 border-1 surface-border">
            <h5 className="m-0 mb-3 text-900 font-bold flex align-items-center gap-2">
              <i className="pi pi-id-card text-primary" />
              {t('common.basic_info')}
            </h5>
            <div className="grid">
              <div className="col-12 md:col-6 field mb-3">
                <label htmlFor="partnerCode" className="font-semibold text-xs text-700">
                  {t('partner.code')} <span className="text-red-500">*</span>
                </label>
                <InputText
                  id="partnerCode"
                  value={formData.partnerCode || ''}
                  onChange={(e) => setFormData({ ...formData, partnerCode: e.target.value.toUpperCase() })}
                  required
                  autoFocus
                  disabled={isEdit}
                  placeholder={t('partner.code_placeholder')}
                  className="p-inputtext-sm font-mono"
                />
              </div>

              <div className="col-12 md:col-6 field mb-3">
                <label htmlFor="partnerName" className="font-semibold text-xs text-700">
                  {t('partner.name')} <span className="text-red-500">*</span>
                </label>
                <InputText
                  id="partnerName"
                  value={formData.partnerName || ''}
                  onChange={(e) => setFormData({ ...formData, partnerName: e.target.value })}
                  required
                  placeholder={t('partner.name_placeholder')}
                  className="p-inputtext-sm"
                />
              </div>

              <div className="col-12 md:col-6 field mb-3">
                <label htmlFor="partnerType" className="font-semibold text-xs text-700">
                  {t('partner.type')}
                </label>
                <Dropdown
                  id="partnerType"
                  value={formData.partnerType || 'RETAIL'}
                  options={partnerTypeOptions}
                  onChange={(e) => setFormData({ ...formData, partnerType: e.value })}
                  placeholder={t('partner.type_placeholder')}
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
                  {t('common.status')}
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
                {t('partner.credentials_title')}
              </h5>
              <Button
                label={t('partner.generate_keys')}
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
                    summary: t('common.success'),
                    detail: t('partner.b2b_keys_generated'),
                    life: 2000,
                  });
                }}
              />
            </div>

            <div className="grid">
              <div className="col-12 field mb-3">
                <label className="font-semibold text-xs text-700">
                  {t('partner.api_key')}
                </label>
                <div className="p-inputgroup">
                  <InputText
                    value={formData.apiKey || ''}
                    onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                    placeholder={t('partner.api_key_placeholder')}
                    className="p-inputtext-sm font-mono"
                  />
                  <Button
                    icon="pi pi-copy"
                    severity="secondary"
                    outlined
                    onClick={() => copyToClipboard(formData.apiKey || '', 'API Key')}
                    tooltip={t('partner.copy_api_key')}
                  />
                </div>
              </div>

              <div className="col-12 field mb-3">
                <label className="font-semibold text-xs text-700">
                  {t('partner.secret_key')}
                </label>
                <div className="p-inputgroup">
                  <InputText
                    type={showSecret ? 'text' : 'password'}
                    value={formData.secretKey || ''}
                    onChange={(e) => setFormData({ ...formData, secretKey: e.target.value })}
                    placeholder={t('partner.secret_key_placeholder')}
                    className="p-inputtext-sm font-mono"
                  />
                  <Button
                    icon={showSecret ? 'pi pi-eye-slash' : 'pi pi-eye'}
                    severity="secondary"
                    outlined
                    onClick={() => setShowSecret(!showSecret)}
                    tooltip={showSecret ? t('partner.hide_secret') : t('partner.show_secret')}
                  />
                  <Button
                    icon="pi pi-copy"
                    severity="secondary"
                    outlined
                    onClick={() => copyToClipboard(formData.secretKey || '', 'Secret Key')}
                    tooltip={t('partner.copy_secret_key')}
                  />
                </div>
              </div>

              <div className="col-12 field mb-0">
                <label className="font-semibold text-xs text-700 flex align-items-center gap-1">
                  {t('partner.ip_whitelist')}
                  <i className="pi pi-info-circle text-500 text-xs" title={t('partner.ip_whitelist_tooltip')} />
                </label>
                <InputText
                  value={formData.ipWhitelist || ''}
                  onChange={(e) => setFormData({ ...formData, ipWhitelist: e.target.value })}
                  placeholder={t('partner.ip_whitelist_placeholder')}
                  className="p-inputtext-sm font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Webhook Outbox Event */}
          <div className="p-3 border-round surface-50 border-1 surface-border">
            <h5 className="m-0 mb-3 text-900 font-bold flex align-items-center gap-2">
              <i className="pi pi-send text-primary" />
              {t('partner.webhook_title')}
            </h5>
            <div className="grid">
              <div className="col-12 field mb-3">
                <label className="font-semibold text-xs text-700">
                  {t('partner.webhook_url')}
                </label>
                <InputText
                  value={formData.webhookUrl || ''}
                  onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
                  placeholder={t('partner.webhook_url_placeholder')}
                  className="p-inputtext-sm font-mono"
                />
              </div>

              <div className="col-12 field mb-0">
                <div className="flex justify-content-between align-items-center mb-1">
                  <label className="font-semibold text-xs text-700">
                    {t('partner.webhook_secret')}
                  </label>
                  <Button
                    label={t('partner.generate_webhook_secret')}
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
                    placeholder={t('partner.webhook_secret_placeholder')}
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
          <Button label={t('common.cancel')} icon="pi pi-times" outlined onClick={() => setShowDialog(false)} />
          <Button label={t('common.save')} icon="pi pi-check" severity="success" onClick={saveItem} />
        </div>
      </Dialog>

      {/* Dialog Xem Chi tiết Thông số Tích hợp B2B (Integration Modal) */}
      <Dialog
        visible={showDetailDialog}
        style={{ width: '40rem' }}
        breakpoints={{ '960px': '75vw', '641px': '95vw' }}
        header={t('partner.detail_title')}
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
              <label className="font-semibold text-xs text-500">{t('partner.api_key_header')}</label>
              <div className="p-inputgroup">
                <InputText value={detailPartner.apiKey || t('partner.not_issued')} readOnly className="p-inputtext-sm font-mono bg-50" />
                <Button icon="pi pi-copy" severity="secondary" outlined onClick={() => copyToClipboard(detailPartner.apiKey || '', 'API Key')} />
              </div>
            </div>

            <div className="flex flex-column gap-2">
              <label className="font-semibold text-xs text-500">{t('partner.secret_key_sign')}</label>
              <div className="p-inputgroup">
                <InputText value={detailPartner.secretKey || t('partner.not_issued')} readOnly className="p-inputtext-sm font-mono bg-50" />
                <Button icon="pi pi-copy" severity="secondary" outlined onClick={() => copyToClipboard(detailPartner.secretKey || '', 'Secret Key')} />
              </div>
            </div>

            <div className="flex flex-column gap-2">
              <label className="font-semibold text-xs text-500">{t('partner.webhook_url_label')}</label>
              <div className="p-inputgroup">
                <InputText value={detailPartner.webhookUrl || t('partner.not_configured')} readOnly className="p-inputtext-sm font-mono bg-50" />
                {detailPartner.webhookUrl && (
                  <Button icon="pi pi-copy" severity="secondary" outlined onClick={() => copyToClipboard(detailPartner.webhookUrl || '', 'Webhook URL')} />
                )}
              </div>
            </div>

            <div className="flex flex-column gap-2">
              <label className="font-semibold text-xs text-500">{t('partner.webhook_secret_label')}</label>
              <div className="p-inputgroup">
                <InputText value={detailPartner.webhookSecret || t('partner.not_configured')} readOnly className="p-inputtext-sm font-mono bg-50" />
                {detailPartner.webhookSecret && (
                  <Button icon="pi pi-copy" severity="secondary" outlined onClick={() => copyToClipboard(detailPartner.webhookSecret || '', 'Webhook Secret')} />
                )}
              </div>
            </div>

            <div className="flex flex-column gap-2">
              <label className="font-semibold text-xs text-500">{t('partner.ip_whitelist_label')}</label>
              <InputText value={detailPartner.ipWhitelist || '0.0.0.0/0'} readOnly className="p-inputtext-sm font-mono bg-50" />
            </div>

            <div className="p-3 border-round surface-100 border-1 surface-border mt-2">
              <div className="font-semibold text-xs text-700 mb-1">{t('partner.http_headers_sample')}</div>
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
          <Button label={t('common.close')} icon="pi pi-times" onClick={() => setShowDetailDialog(false)} />
        </div>
      </Dialog>

      {/* Dialog Xoay vòng API Key (hiển thị 1 lần) & Cấu hình IP/Webhook */}
      <Dialog
        visible={showKeyWebhookDialog}
        onHide={() => setShowKeyWebhookDialog(false)}
        header={keyTargetPartner ? `${t('partner.key_webhook_title')} · ${keyTargetPartner.partnerCode}` : ''}
        style={{ width: '44rem' }}
        breakpoints={{ '641px': '95vw' }}
        modal
      >
        <div className="flex flex-column gap-3">
          <div className="p-3 border-round surface-50 border-1 surface-border">
            <div className="font-medium text-sm mb-2">{t('partner.webhook_ip_section')}</div>
            <div className="flex flex-column gap-2">
              <label className="text-xs text-600">{t('partner.webhook_url')}</label>
              <InputText value={editWebhookUrl} onChange={(e) => setEditWebhookUrl(e.target.value)} className="font-mono p-inputtext-sm" placeholder={t('partner.webhook_url_placeholder')} />
              <label className="text-xs text-600 mt-1">{t('partner.ip_whitelist_comma_label')}</label>
              <InputText value={editIpWhitelist} onChange={(e) => setEditIpWhitelist(e.target.value)} className="font-mono p-inputtext-sm" placeholder="103.1.2.3/32, 103.1.2.4/32" />
              <div className="flex justify-content-end mt-2">
                <Button label={t('common.save')} icon="pi pi-save" size="small" onClick={handleSaveWebhookAndIp} loading={keyLoading} />
              </div>
            </div>
          </div>

          <div className="p-3 border-round surface-50 border-1 surface-border">
            <div className="flex justify-content-between align-items-center mb-2">
              <span className="font-medium text-sm">{t('partner.rotate_section')}</span>
              <Button label={t('partner.rotate_btn')} icon="pi pi-sync" severity="warning" size="small" onClick={handleRotateApiKey} loading={keyLoading} />
            </div>

            {rotatedKeyOnce && (
              <div className="p-3 border-round bg-green-50 border-1 border-green-300 mb-3">
                <div className="text-xs font-medium text-green-800 mb-1">
                  <i className="pi pi-exclamation-circle mr-1" />
                  {t('partner.show_once_warning')}
                </div>
                <div className="flex align-items-center gap-2">
                  <code className="flex-1 p-2 border-round bg-white font-mono text-sm text-green-900">{rotatedKeyOnce}</code>
                  <Button icon="pi pi-copy" size="small" onClick={() => copyToClipboard(rotatedKeyOnce, 'New API Key')} />
                </div>
              </div>
            )}

            <DataTable<PartnerApiKeyItemModel[]> value={partnerKeys} size="small" emptyMessage={t('partner.no_keys')}>
              <Column
                header={t('common.order_number', 'STT')}
                body={(_, opt) => opt.rowIndex + 1}
                style={{ width: '3.5rem', textAlign: 'center' }}
              />
              <Column header={t('common.action')} body={(k: PartnerApiKeyItemModel) => k.id && k.status === ApiKeyStatus.GRACE_PERIOD ? <Button label={t('partner.revoke_now')} icon="pi pi-ban" size="small" severity="danger" outlined onClick={() => handleRevokeOldKey(k.id!)} /> : null} style={{ width: '8rem', textAlign: 'center' }} />
              <Column field="keyPrefix" header={t('system_parameter.code_types.prefix')} body={(k: PartnerApiKeyItemModel) => <span className="font-mono font-bold text-900 white-space-nowrap">{k.keyPrefix}***</span>} style={{ minWidth: '8rem' }} />
              <Column field="graceExpiresAt" header={t('partner.grace_period')} body={(k: PartnerApiKeyItemModel) => <span className="font-mono text-xs text-900 white-space-nowrap">{k.graceExpiresAt ? new Date(k.graceExpiresAt).toLocaleString('vi-VN') : '--'}</span>} style={{ minWidth: '10rem' }} />
              <Column field="status" header={t('common.status')} body={(k: PartnerApiKeyItemModel) => <StatusBadge status={k.status} />} style={{ minWidth: '8rem', textAlign: 'center' }} />
            </DataTable>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default Partners;
