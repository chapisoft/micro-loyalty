import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { Skeleton } from 'primereact/skeleton';
import { useTranslation } from 'react-i18next';
import { AppBreadcrumb } from '@/components/AppBreadcrumb';
import { TenantSelector } from '@/components/TenantSelector';
import { NotificationCategory } from '@/models';
import { LoyaltyService, PartnerNotificationModel } from '@/service/loyalty.service';

export const PartnerNotificationsPage: React.FC = () => {
  const { t } = useTranslation();
  const toast = useRef<Toast>(null);

  const [selectedTenant, setSelectedTenant] = useState<string>(
    () => localStorage.getItem('selected_tenant_id') || 'TENANT_NATCASH'
  );
  const [items, setItems] = useState<PartnerNotificationModel[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const list = await LoyaltyService.getPartnerNotifications(selectedTenant);
      setItems(Array.isArray(list) ? list : []);
    } finally {
      setLoading(false);
    }
  }, [selectedTenant]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkRead = async (n: PartnerNotificationModel) => {
    if (!n.id || n.isRead) return;
    try {
      await LoyaltyService.markPartnerNotificationRead(n.id, selectedTenant);
      setItems((prev) => prev.map((it) => (it.id === n.id ? { ...it, isRead: true } : it)));
    } catch (err: any) {
      toast.current?.show({ severity: 'error', summary: t('common.error'), detail: err?.response?.data?.message || err.message });
    }
  };

  return (
    <div>
      <Toast ref={toast} />
      <AppBreadcrumb items={[{ label: t('partner_portal.nav_notifications') }]} />

      <div className="card shadow-1 border-round surface-card p-4">
        <div className="flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
          <div>
            <h4 className="m-0 text-primary font-semibold">{t('partner_portal.notifications_title')}</h4>
            <p className="m-0 text-xs text-500 mt-1">{t('partner_portal.notifications_subtitle')}</p>
          </div>
          <div className="flex gap-2 align-items-center">
            <TenantSelector value={selectedTenant} onChange={setSelectedTenant} />
            <Button icon="pi pi-refresh" outlined rounded onClick={fetchNotifications} loading={loading} />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-column gap-3">
            {[1, 2, 3, 4].map((idx) => (
              <Skeleton key={idx} height="4.5rem" className="border-round" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center p-6 border-1 surface-border border-round surface-50">
            <i className="pi pi-inbox text-4xl text-400 mb-3 block" />
            <div className="text-700 font-medium mb-1">{t('partner_portal.no_notifications_title')}</div>
            <div className="text-xs text-500">{t('partner_portal.no_notifications_desc')}</div>
          </div>
        ) : (
          <div className="flex flex-column gap-2">
            {items.map((n) => (
              <div
                key={n.id}
                onClick={() => handleMarkRead(n)}
                className={`p-3 border-round border-1 flex justify-content-between align-items-start gap-3 cursor-pointer ${
                  n.isRead ? 'surface-card surface-border' : 'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex flex-column gap-1">
                  <div className="flex align-items-center gap-2">
                    <Tag value={n.category} severity={n.category === NotificationCategory.ALERT ? 'danger' : n.category === NotificationCategory.SETTLEMENT ? 'warning' : 'info'} />
                    <span className={n.isRead ? 'text-800 font-medium' : 'text-900 font-semibold'}>{n.title}</span>
                    {!n.isRead && <Tag value={t('partner_portal.unread')} severity="info" />}
                  </div>
                  <span className="text-sm text-600">{n.message}</span>
                </div>
                <span className="font-mono text-xs text-500 white-space-nowrap">
                  {n.createdAt ? new Date(n.createdAt).toLocaleString('vi-VN') : '--'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PartnerNotificationsPage;
