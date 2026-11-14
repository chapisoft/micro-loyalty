import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { Skeleton } from 'primereact/skeleton';
import { useTranslation } from 'react-i18next';
import { AppBreadcrumb } from 'components';
import { TenantSelector } from '@/components/TenantSelector';
import { AlertSeverity, AlertStatus } from '@/models';
import { LoyaltyService, SystemAlertModel } from '@/service/loyalty.service';

export const AlertCenterPage: React.FC = () => {
  const { t } = useTranslation();
  const toast = useRef<Toast>(null);

  const [selectedTenant, setSelectedTenant] = useState<string>(
    () => localStorage.getItem('selected_tenant_id') || 'TENANT_NATCASH'
  );
  const [alerts, setAlerts] = useState<SystemAlertModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>(AlertStatus.OPEN);
  const [resolveTarget, setResolveTarget] = useState<SystemAlertModel | null>(null);
  const [resolveNote, setResolveNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const list = await LoyaltyService.getAlerts(
        {
          severity: severityFilter !== 'ALL' ? severityFilter : undefined,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
        },
        selectedTenant
      );
      setAlerts(Array.isArray(list) ? list : []);
    } finally {
      setLoading(false);
    }
  }, [selectedTenant, severityFilter, statusFilter]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const handleAcknowledge = async (alert: SystemAlertModel) => {
    if (!alert.id) return;
    try {
      await LoyaltyService.acknowledgeAlert(alert.id, selectedTenant);
      toast.current?.show({ severity: 'info', summary: t('common.success'), detail: alert.alertCode });
      fetchAlerts();
    } catch (err: any) {
      toast.current?.show({ severity: 'error', summary: t('common.error'), detail: err?.response?.data?.message || err.message });
    }
  };

  const handleResolve = async () => {
    if (!resolveTarget?.id) return;
    setSubmitting(true);
    try {
      await LoyaltyService.resolveAlert(resolveTarget.id, resolveNote.trim() || undefined, selectedTenant);
      toast.current?.show({ severity: 'success', summary: t('common.success'), detail: resolveTarget.alertCode });
      setResolveTarget(null);
      setResolveNote('');
      fetchAlerts();
    } catch (err: any) {
      toast.current?.show({ severity: 'error', summary: t('common.error'), detail: err?.response?.data?.message || err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const severityTag = (sev: string) => {
    switch (sev) {
      case AlertSeverity.CRITICAL:
        return 'danger';
      case AlertSeverity.WARNING:
        return 'warning';
      default:
        return 'info';
    }
  };

  const statusTag = (st: string) => {
    switch (st) {
      case AlertStatus.RESOLVED:
        return 'success';
      case AlertStatus.ACKNOWLEDGED:
        return 'info';
      default:
        return 'warning';
    }
  };

  return (
    <div>
      <Toast ref={toast} />
      <AppBreadcrumb items={[{ label: t('nav.alerts') }]} />

      <div className="card shadow-1 border-round surface-card p-4">
        <div className="flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
          <div>
            <h4 className="m-0 text-primary font-semibold">
              {t('alert.title')}
            </h4>
            <p className="m-0 text-xs text-500 mt-1">
              {t('alert.subtitle')}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 align-items-center">
            <TenantSelector value={selectedTenant} onChange={setSelectedTenant} />
            <Dropdown
              value={severityFilter}
              options={[
                { label: t('common.all'), value: 'ALL' },
                ...Object.values(AlertSeverity).map((v) => ({ label: v, value: v })),
              ]}
              onChange={(e) => setSeverityFilter(e.value)}
              className="w-11rem"
            />
            <Dropdown
              value={statusFilter}
              options={[
                { label: t('common.all'), value: 'ALL' },
                ...Object.values(AlertStatus).map((v) => ({ label: v, value: v })),
              ]}
              onChange={(e) => setStatusFilter(e.value)}
              className="w-12rem"
            />
            <Button icon="pi pi-refresh" outlined rounded onClick={fetchAlerts} loading={loading} />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-column gap-2"><Skeleton height="2.75rem" /><Skeleton height="2.75rem" /></div>
        ) : (
          <DataTable<SystemAlertModel[]> value={alerts} paginator rows={15} stripedRows responsiveLayout="scroll" emptyMessage={t('alert.empty')}>
            <Column field="alertCode" header={t('alert.code')} body={(r) => <span className="font-mono white-space-nowrap font-medium text-primary">{r.alertCode}</span>} style={{ minWidth: '12rem' }} />
            <Column field="severity" header={t('alert.severity')} body={(r) => <Tag value={r.severity} severity={severityTag(r.severity)} />} style={{ minWidth: '8rem', textAlign: 'center' }} />
            <Column field="category" header={t('alert.category')} body={(r) => <span className="font-mono text-xs">{r.category}</span>} style={{ minWidth: '10rem' }} />
            <Column field="title" header={t('alert.subject')} body={(r) => <div><div>{r.title}</div><div className="text-xs text-500">{r.message}</div></div>} style={{ minWidth: '18rem' }} />
            <Column field="status" header={t('common.status')} body={(r) => <Tag value={r.status} severity={statusTag(r.status)} />} style={{ minWidth: '9rem', textAlign: 'center' }} />
            <Column field="createdAt" header={t('common.created_at')} body={(r) => <span className="font-mono white-space-nowrap text-xs">{r.createdAt ? new Date(r.createdAt).toLocaleString('vi-VN') : '--'}</span>} style={{ minWidth: '11rem' }} />
            <Column
              header={t('common.action')}
              body={(r) => (
                <div className="flex gap-1">
                  {r.status === AlertStatus.OPEN && (
                    <Button label={t('alert.ack_btn')} size="small" outlined severity="info" onClick={() => handleAcknowledge(r)} />
                  )}
                  {r.status !== AlertStatus.RESOLVED && (
                    <Button label={t('alert.resolve_btn')} size="small" outlined severity="success" onClick={() => { setResolveTarget(r); setResolveNote(''); }} />
                  )}
                </div>
              )}
              style={{ minWidth: '11rem' }}
            />
          </DataTable>
        )}
      </div>

      <Dialog visible={!!resolveTarget} onHide={() => setResolveTarget(null)} header={resolveTarget ? `${t('alert.resolve_title')} · ${resolveTarget.alertCode}` : ''} style={{ width: '32rem' }} modal>
        <div className="flex flex-column gap-3">
          <div className="text-sm text-700">{resolveTarget?.title}</div>
          <InputTextarea rows={3} value={resolveNote} onChange={(e) => setResolveNote(e.target.value)} placeholder={t('alert.resolve_note')} className="w-full" />
        </div>
        <div className="flex justify-content-end gap-2 mt-3">
          <Button label={t('common.cancel')} outlined onClick={() => setResolveTarget(null)} />
          <Button label={t('alert.resolve_confirm')} severity="success" icon="pi pi-check" onClick={handleResolve} loading={submitting} />
        </div>
      </Dialog>
    </div>
  );
};

export default AlertCenterPage;
