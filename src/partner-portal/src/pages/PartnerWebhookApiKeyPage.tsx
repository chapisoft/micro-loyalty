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
import { AppBreadcrumb } from '@/components/AppBreadcrumb';
import { TenantSelector } from '@/components/TenantSelector';
import { ApiKeyStatus } from '@/models';
import { LoyaltyService, PartnerApiKeyItemModel } from '@/service/loyalty.service';
import { StandardPageHeader } from '@/components/StandardPageHeader';
import { StandardRowActions } from '@/components/StandardRowActions';

export const PartnerWebhookApiKeyPage: React.FC = () => {
  const { t } = useTranslation();
  const toast = useRef<Toast>(null);

  const [selectedTenant, setSelectedTenant] = useState<string>(
    () => localStorage.getItem('selected_tenant_id') || localStorage.getItem('tenant_id') || ''
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
    if (diffMs <= 0) return t('partner_portal.grace_expired');
    const days = Math.floor(diffMs / 86400000);
    const hours = Math.floor((diffMs % 86400000) / 3600000);
    return `${days}d ${hours}h`;
  };

  const handleSaveWebhook = async () => {
    if (!webhookUrl.trim()) {
      toast.current?.show({
        severity: 'warn',
        summary: t('common.warn'),
        detail: t('partner_portal.webhook_required'),
      });
      return;
    }
    setSavingWebhook(true);
    try {
      await LoyaltyService.updatePartnerWebhookConfig(
        {
          webhookUrl: webhookUrl.trim(),
          ipWhitelist: ipWhitelist
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
            .join(','),
        },
        selectedTenant
      );
      toast.current?.show({
        severity: 'success',
        summary: t('common.success'),
        detail: t('partner.webhook_updated'),
      });
    } catch (err: any) {
      toast.current?.show({
        severity: 'error',
        summary: t('common.error'),
        detail: err?.response?.data?.message || err.message,
      });
    } finally {
      setSavingWebhook(false);
    }
  };

  const handleRotate = async () => {
    setRotating(true);
    try {
      const res = await LoyaltyService.rotatePartnerApiKey(
        { label: `Rotated Key (${new Date().toISOString().slice(0, 10)})` },
        selectedTenant
      );
      setNewKeyOnce(res?.plainTextKey || null);
      toast.current?.show({
        severity: 'success',
        summary: t('partner.rotate_btn'),
        detail: t('partner.rotate_success'),
      });
      fetchKeys();
    } catch (err: any) {
      toast.current?.show({
        severity: 'error',
        summary: t('common.error'),
        detail: err?.response?.data?.message || err.message,
      });
    } finally {
      setRotating(false);
    }
  };

  const handleRevokeOldKey = (k: PartnerApiKeyItemModel) => {
    if (!k.id) return;
    confirmDialog({
      message: `${t('partner_portal.confirm_revoke_msg')} ${k.keyPrefix}***?`,
      header: t('partner.revoke_now'),
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      accept: async () => {
        try {
          await LoyaltyService.revokePartnerApiKey(k.id!, selectedTenant);
          toast.current?.show({
            severity: 'info',
            summary: t('common.success'),
            detail: `${k.keyPrefix}***`,
          });
          fetchKeys();
        } catch (err: any) {
          toast.current?.show({
            severity: 'error',
            summary: t('common.error'),
            detail: err?.response?.data?.message || err.message,
          });
        }
      },
    });
  };

  return (
    <div className="w-full">
      <Toast ref={toast} />
      <ConfirmDialog />
      <AppBreadcrumb items={[{ label: t('partner_portal.nav_api_keys') }]} />

      <StandardPageHeader
        title={t('partner_portal.api_keys_title')}
        subtitle={t('partner_portal.api_keys_subtitle')}
        primaryAction={{
          label: t('partner.rotate_btn', 'Đổi khóa API'),
          icon: 'pi pi-sync',
          onClick: handleRotate,
          loading: rotating,
        }}
        extraLeft={<TenantSelector value={selectedTenant} onChange={setSelectedTenant} />}
        onRefresh={fetchKeys}
        refreshLoading={loading}
      />

      <div className="card shadow-1 border-round surface-card p-4">
        {newKeyOnce && (
          <div className="p-3 border-round bg-green-50 border-1 border-green-300 mb-4">
            <div className="text-xs font-medium text-green-900 mb-1">
              {t('partner.show_once_warning')}
            </div>
            <div className="flex align-items-center gap-2">
              <code className="flex-1 p-2 border-round bg-white font-mono text-sm text-green-900">
                {newKeyOnce}
              </code>
              <Button
                icon="pi pi-copy"
                size="small"
                onClick={() => {
                  navigator.clipboard.writeText(newKeyOnce);
                  toast.current?.show({
                    severity: 'info',
                    summary: t('common.success'),
                    detail: t('partner.api_key_copied'),
                  });
                }}
              />
            </div>
          </div>
        )}

        <div className="p-3 border-round surface-50 border-1 surface-border mb-4">
          <div className="font-semibold text-sm text-900 mb-2">
            {t('partner.webhook_ip_section')}
          </div>
          <div className="grid">
            <div className="col-12 md:col-6">
              <label className="text-xs text-600 block mb-1">
                {t('partner.webhook_url_label')}
              </label>
              <InputText
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="w-full font-mono p-inputtext-sm"
                placeholder="https://api.partner.ht/loyalty/callback"
              />
            </div>
            <div className="col-12 md:col-6">
              <label className="text-xs text-600 block mb-1">
                {t('partner.ip_whitelist_label')}
              </label>
              <InputText
                value={ipWhitelist}
                onChange={(e) => setIpWhitelist(e.target.value)}
                className="w-full font-mono p-inputtext-sm"
                placeholder="203.0.113.10/32, 198.51.100.0/24"
              />
            </div>
          </div>
          <div className="flex justify-content-end mt-2">
            <Button
              label={t('common.save')}
              icon="pi pi-check"
              size="small"
              onClick={handleSaveWebhook}
              loading={savingWebhook}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-column gap-2">
            <Skeleton height="2.75rem" />
            <Skeleton height="2.75rem" />
          </div>
        ) : (
          <DataTable<PartnerApiKeyItemModel[]>
            value={keys}
            paginator
            rows={10}
            stripedRows
            responsiveLayout="scroll"
            emptyMessage={t('partner.no_keys')}
          >
            <Column
              header={t('common.order_number', 'STT')}
              body={(_, opt) => opt.rowIndex + 1}
              style={{ width: '4rem', textAlign: 'center' }}
            />
            <Column
              header={t('common.action', 'Thao tác')}
              body={(r: PartnerApiKeyItemModel) =>
                r.status === ApiKeyStatus.GRACE_PERIOD ? (
                  <StandardRowActions
                    actions={[
                      {
                        icon: 'pi pi-ban',
                        label: t('partner.revoke_now', 'Thu hồi ngay'),
                        onClick: () => handleRevokeOldKey(r),
                      },
                    ]}
                  />
                ) : (
                  <span className="text-400">--</span>
                )
              }
              style={{ width: '6rem', textAlign: 'center' }}
            />
            <Column
              field="keyPrefix"
              header={t('partner.key_prefix')}
              body={(r: PartnerApiKeyItemModel) => (
                <span className="font-bold font-mono text-900">{r.keyPrefix}••••••••</span>
              )}
              style={{ minWidth: '11rem' }}
            />
            <Column
              field="label"
              header={t('common.name')}
              body={(r: PartnerApiKeyItemModel) => <span className="text-900">{r.label}</span>}
              style={{ minWidth: '12rem' }}
            />
            <Column
              field="graceExpiresAt"
              header={t('partner.grace_period')}
              body={(r: PartnerApiKeyItemModel) =>
                r.status === ApiKeyStatus.GRACE_PERIOD ? (
                  <span className="font-mono text-900 text-xs white-space-nowrap">
                    {computeGraceRemaining(r.graceExpiresAt)}
                  </span>
                ) : (
                  <span className="text-400">--</span>
                )
              }
              style={{ minWidth: '10rem' }}
            />
            <Column
              field="createdAt"
              header={t('common.created_at')}
              body={(r: PartnerApiKeyItemModel) => (
                <span className="text-900 font-mono text-xs">
                  {r.createdAt ? new Date(r.createdAt).toLocaleString('vi-VN') : '--'}
                </span>
              )}
              style={{ minWidth: '11rem' }}
            />
            <Column
              field="status"
              header={t('common.status')}
              body={(r: PartnerApiKeyItemModel) => (
                <Tag
                  value={r.status}
                  severity={
                    r.status === ApiKeyStatus.ACTIVE
                      ? 'success'
                      : r.status === ApiKeyStatus.GRACE_PERIOD
                      ? 'warning'
                      : 'danger'
                  }
                />
              )}
              style={{ minWidth: '9rem', textAlign: 'center' }}
            />
          </DataTable>
        )}
      </div>
    </div>
  );
};

export default PartnerWebhookApiKeyPage;
