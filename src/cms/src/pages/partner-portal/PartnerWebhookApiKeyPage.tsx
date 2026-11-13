import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { Skeleton } from 'primereact/skeleton';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { useTranslation } from 'react-i18next';
import { AppBreadcrumb } from 'components';
import { TenantSelector } from '@/components/TenantSelector';
import { ApiKeyStatus } from '@/models';
import { LoyaltyService, PartnerApiKeyItemModel } from '@/service/loyalty.service';

export const PartnerWebhookApiKeyPage: React.FC = () => {
  const { t } = useTranslation();
  const toast = useRef<Toast>(null);

  const [selectedTenant, setSelectedTenant] = useState<string>(
    () => localStorage.getItem('selected_tenant_id') || 'TENANT_NATCASH'
  );
  const [keys, setKeys] = useState<PartnerApiKeyItemModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingWebhook, setSavingWebhook] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [newKeyOnce, setNewKeyOnce] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [ipWhitelist, setIpWhitelist] = useState('');

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    try {
      const cfg = await LoyaltyService.getPartnerApiKeys(selectedTenant);
      setKeys(Array.isArray(cfg?.keys) ? cfg.keys : []);
      if (cfg?.webhookUrl) {
        setWebhookUrl(cfg.webhookUrl);
      }
      if (cfg?.ipWhitelist) {
        setIpWhitelist(cfg.ipWhitelist);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedTenant]);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const computeGraceRemaining = (graceUntil?: string): string => {
    if (!graceUntil) return '--';
    const diffMs = new Date(graceUntil).getTime() - Date.now();
    if (diffMs <= 0) return t('partner_portal.grace_expired', { defaultValue: 'Đã hết hạn' });
    const days = Math.floor(diffMs / 86400000);
    const hours = Math.floor((diffMs % 86400000) / 3600000);
    return `${days}d ${hours}h`;
  };

  const handleSaveWebhook = async () => {
    if (!webhookUrl.trim()) {
      toast.current?.show({ severity: 'warn', summary: t('common.warn', { defaultValue: 'Thiếu URL' }), detail: t('partner_portal.webhook_required', { defaultValue: 'Vui lòng nhập Webhook Callback URL.' }) });
      return;
    }
    setSavingWebhook(true);
    try {
      await LoyaltyService.updatePartnerWebhookConfig(
        {
          webhookUrl: webhookUrl.trim(),
          ipWhitelist: ipWhitelist.split(',').map((s) => s.trim()).filter(Boolean).join(','),
        },
        selectedTenant
      );
      toast.current?.show({ severity: 'success', summary: t('common.success', { defaultValue: 'Thành công' }), detail: t('partner.webhook_updated', { defaultValue: 'Đã cập nhật Webhook URL & IP Whitelist.' }) });
    } catch (err: any) {
      toast.current?.show({ severity: 'error', summary: t('common.error', { defaultValue: 'Lỗi' }), detail: err?.response?.data?.message || err.message });
    } finally {
      setSavingWebhook(false);
    }
  };

  const handleRotate = async () => {
    setRotating(true);
    try {
      const res = await LoyaltyService.rotatePartnerApiKey({ label: `Rotated Key (${new Date().toISOString().slice(0, 10)})` }, selectedTenant);
      setNewKeyOnce(res?.plainTextKey || null);
      toast.current?.show({
        severity: 'success',
        summary: t('partner.rotate_btn', { defaultValue: 'Xoay vòng API Key' }),
        detail: t('partner.rotate_success', { defaultValue: 'Đã sinh khóa mới (hiển thị 1 lần). Khóa cũ duy trì Grace Period 7 ngày.' }),
      });
      fetchKeys();
    } catch (err: any) {
      toast.current?.show({ severity: 'error', summary: t('common.error', { defaultValue: 'Lỗi' }), detail: err?.response?.data?.message || err.message });
    } finally {
      setRotating(false);
    }
  };

  const handleRevokeOldKey = (k: PartnerApiKeyItemModel) => {
    if (!k.id) return;
    confirmDialog({
      message: `${t('partner_portal.confirm_revoke_msg', { defaultValue: 'Thu hồi ngay khóa cũ' })} ${k.keyPrefix}***?`,
      header: t('partner.revoke_now', { defaultValue: 'Revoke old key now' }),
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      accept: async () => {
        try {
          await LoyaltyService.revokePartnerApiKey(k.id!, selectedTenant);
          toast.current?.show({ severity: 'info', summary: t('common.success', { defaultValue: 'Đã thu hồi' }), detail: `${k.keyPrefix}***` });
          fetchKeys();
        } catch (err: any) {
          toast.current?.show({ severity: 'error', summary: t('common.error', { defaultValue: 'Lỗi' }), detail: err?.response?.data?.message || err.message });
        }
      },
    });
  };

  return (
    <div>
      <Toast ref={toast} />
      <ConfirmDialog />
      <AppBreadcrumb items={[{ label: t('partner_portal.nav_api_keys', { defaultValue: 'Partner Portal · Webhook & API Keys (QT-06)' }) }]} />

      <div className="card shadow-1 border-round surface-card p-4">
        <div className="flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
          <div>
            <h4 className="m-0 text-primary font-semibold">{t('partner_portal.api_keys_title', { defaultValue: 'Quản lý API Key, Grace Period 7 ngày & Webhook (QT-06)' })}</h4>
            <p className="m-0 text-xs text-500 mt-1">{t('partner_portal.api_keys_subtitle', { defaultValue: 'Xoay vòng khóa không gián đoạn (Zero-Downtime Rotation) với thời gian ân hạn 7 ngày và thu hồi khẩn cấp.' })}</p>
          </div>
          <div className="flex gap-2 align-items-center">
            <TenantSelector value={selectedTenant} onChange={setSelectedTenant} />
            <Button label={t('partner.rotate_btn', { defaultValue: 'Xoay vòng API Key' })} icon="pi pi-sync" severity="warning" size="small" onClick={handleRotate} loading={rotating} />
            <Button icon="pi pi-refresh" outlined rounded onClick={fetchKeys} loading={loading} />
          </div>
        </div>

        {newKeyOnce && (
          <div className="p-3 border-round bg-green-50 border-1 border-green-300 mb-4">
            <div className="text-xs font-medium text-green-900 mb-1">
              <i className="pi pi-shield mr-1" />
              {t('partner.show_once_warning', { defaultValue: 'Khóa mới chỉ hiển thị DUY NHẤT 1 LẦN. Vui lòng sao chép ngay trước khi rời trang:' })}
            </div>
            <div className="flex align-items-center gap-2">
              <code className="flex-1 p-2 border-round bg-white font-mono text-sm text-green-900">{newKeyOnce}</code>
              <Button icon="pi pi-copy" size="small" onClick={() => { navigator.clipboard.writeText(newKeyOnce); toast.current?.show({ severity: 'info', summary: 'Copied', detail: 'API Key copied' }); }} />
            </div>
          </div>
        )}

        <div className="p-3 border-round surface-50 border-1 surface-border mb-4">
          <div className="font-medium text-sm mb-2">{t('partner.webhook_ip_section', { defaultValue: 'Cấu hình Webhook Callback & IP Whitelist' })}</div>
          <div className="grid">
            <div className="col-12 md:col-6">
              <label className="text-xs text-600 block mb-1">Webhook Callback URL</label>
              <InputText value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} className="w-full font-mono p-inputtext-sm" placeholder="https://api.partner.ht/loyalty/callback" />
            </div>
            <div className="col-12 md:col-6">
              <label className="text-xs text-600 block mb-1">IP Whitelist (CIDR, dấu phẩy)</label>
              <InputText value={ipWhitelist} onChange={(e) => setIpWhitelist(e.target.value)} className="w-full font-mono p-inputtext-sm" placeholder="203.0.113.10/32, 198.51.100.0/24" />
            </div>
          </div>
          <div className="flex justify-content-end mt-2">
            <Button label={t('common.save', { defaultValue: 'Lưu cấu hình Webhook' })} icon="pi pi-save" size="small" onClick={handleSaveWebhook} loading={savingWebhook} />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-column gap-2"><Skeleton height="2.75rem" /><Skeleton height="2.75rem" /></div>
        ) : (
          <DataTable<PartnerApiKeyItemModel[]> value={keys} paginator rows={10} stripedRows responsiveLayout="scroll" emptyMessage={t('partner.no_keys', { defaultValue: 'Chưa có API Key nào.' })}>
            <Column field="keyPrefix" header="Key Prefix" body={(r: PartnerApiKeyItemModel) => <span className="font-mono white-space-nowrap font-medium">{r.keyPrefix}••••••••</span>} style={{ minWidth: '11rem' }} />
            <Column field="label" header={t('common.name', { defaultValue: 'Nhãn Khóa' })} style={{ minWidth: '12rem' }} />
            <Column field="status" header={t('common.status', { defaultValue: 'Trạng Thái' })} body={(r: PartnerApiKeyItemModel) => <Tag value={r.status} severity={r.status === ApiKeyStatus.ACTIVE ? 'success' : r.status === ApiKeyStatus.GRACE_PERIOD ? 'warning' : 'danger'} />} style={{ minWidth: '9rem', textAlign: 'center' }} />
            <Column field="graceExpiresAt" header="Grace Period (7d)" body={(r: PartnerApiKeyItemModel) => r.status === ApiKeyStatus.GRACE_PERIOD ? <span className="font-mono text-orange-700 white-space-nowrap">{computeGraceRemaining(r.graceExpiresAt)}</span> : <span className="text-400">--</span>} style={{ minWidth: '10rem' }} />
            <Column field="createdAt" header={t('common.created_at', { defaultValue: 'Ngày Tạo' })} body={(r: PartnerApiKeyItemModel) => <span className="font-mono white-space-nowrap text-xs">{r.createdAt ? new Date(r.createdAt).toLocaleString('vi-VN') : '--'}</span>} style={{ minWidth: '11rem' }} />
            <Column
              header={t('common.action', { defaultValue: 'Thu Hồi Khẩn' })}
              body={(r: PartnerApiKeyItemModel) =>
                r.status === ApiKeyStatus.GRACE_PERIOD ? (
                  <Button label={t('partner.revoke_now', { defaultValue: 'Revoke old key now' })} icon="pi pi-ban" size="small" severity="danger" outlined onClick={() => handleRevokeOldKey(r)} />
                ) : null
              }
              style={{ minWidth: '12rem' }}
            />
          </DataTable>
        )}
      </div>
    </div>
  );
};

export default PartnerWebhookApiKeyPage;
