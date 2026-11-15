import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { StandardPageHeader } from '@/components/StandardPageHeader';
import { UniversalFilterBar } from '@/components/UniversalFilterBar';
import { StandardRowActions } from '@/components/StandardRowActions';
import { exportToExcel } from '@/components/exportHelper';

export const AlertCenterPage: React.FC = () => {
  const { t } = useTranslation();
  const toast = useRef<Toast>(null);

  const [selectedTenant, setSelectedTenant] = useState<string>(
    () => localStorage.getItem('selected_tenant_id') || 'TENANT_NATCASH'
  );
  const [alerts, setAlerts] = useState<SystemAlertModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
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

  const filteredAlerts = useMemo(() => {
    if (!keyword.trim()) return alerts;
    const kw = keyword.toLowerCase();
    return alerts.filter(
      (a) =>
        a.alertCode?.toLowerCase().includes(kw) ||
        a.title?.toLowerCase().includes(kw) ||
        a.message?.toLowerCase().includes(kw) ||
        a.category?.toLowerCase().includes(kw)
    );
  }, [alerts, keyword]);

  const handleExport = () => {
    exportToExcel(
      filteredAlerts,
      [
        { header: t('alert.code'), field: 'alertCode' },
        { header: t('alert.severity'), field: 'severity' },
        { header: t('alert.category'), field: 'category' },
        { header: t('alert.subject'), field: 'title' },
        { header: t('common.description'), field: 'message' },
        { header: t('common.status'), field: 'status' },
        { header: t('common.created_at'), field: 'createdAt' },
      ],
      'canh_bao_he_thong'
    );
  };

  const handleResetFilters = () => {
    setKeyword('');
    setSeverityFilter('ALL');
    setStatusFilter('ALL');
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
    <div className="w-full">
      <Toast ref={toast} />
      <AppBreadcrumb items={[{ label: t('nav.alerts') }]} />

      <StandardPageHeader
        title={t('alert.title')}
        subtitle={t('alert.subtitle')}
        extraLeft={<TenantSelector value={selectedTenant} onChange={setSelectedTenant} />}
        onRefresh={fetchAlerts}
        refreshLoading={loading}
      />

      <div className="card shadow-1 border-round surface-card p-4">
        <UniversalFilterBar
          keyword={keyword}
          onKeywordChange={setKeyword}
          searchPlaceholder={t('common.search')}
          primaryFilters={
            <>
              <Dropdown
                value={severityFilter}
                options={[
                  { label: `${t('alert.severity')}: ${t('common.all')}`, value: 'ALL' },
                  ...Object.values(AlertSeverity).map((v) => ({ label: v, value: v })),
                ]}
                onChange={(e) => setSeverityFilter(e.value)}
                className="w-13rem"
              />
              <Dropdown
                value={statusFilter}
                options={[
                  { label: `${t('common.status')}: ${t('common.all')}`, value: 'ALL' },
                  ...Object.values(AlertStatus).map((v) => ({ label: v, value: v })),
                ]}
                onChange={(e) => setStatusFilter(e.value)}
                className="w-13rem"
              />
            </>
          }
          onReset={handleResetFilters}
          onExport={handleExport}
        />

        {loading ? (
          <div className="flex flex-column gap-2 mt-3">
            <Skeleton height="2.75rem" />
            <Skeleton height="2.75rem" />
            <Skeleton height="2.75rem" />
          </div>
        ) : (
          <DataTable<SystemAlertModel[]>
            value={filteredAlerts}
            paginator
            rows={15}
            stripedRows
            responsiveLayout="scroll"
            emptyMessage={t('alert.empty')}
            className="mt-3"
          >
            <Column
              header={t('common.order_number', 'STT')}
              body={(_, opt) => opt.rowIndex + 1}
              style={{ width: '4rem', textAlign: 'center' }}
            />
            <Column
              header={t('common.action', 'Thao tác')}
              body={(r: SystemAlertModel) => (
                <StandardRowActions
                  actions={[
                    ...(r.status === AlertStatus.OPEN
                      ? [
                          {
                            icon: 'pi pi-check',
                            label: t('alert.ack_btn', 'Tiếp nhận'),
                            onClick: () => handleAcknowledge(r),
                          },
                        ]
                      : []),
                    ...(r.status !== AlertStatus.RESOLVED
                      ? [
                          {
                            icon: 'pi pi-check-circle',
                            label: t('alert.resolve_btn', 'Xử lý'),
                            onClick: () => {
                              setResolveTarget(r);
                              setResolveNote('');
                            },
                          },
                        ]
                      : []),
                  ]}
                />
              )}
              style={{ width: '7rem', textAlign: 'center' }}
            />
            <Column
              field="alertCode"
              header={t('alert.code')}
              body={(r: SystemAlertModel) => (
                <span className="font-bold font-mono text-900">{r.alertCode}</span>
              )}
              style={{ minWidth: '12rem' }}
            />
            <Column
              field="severity"
              header={t('alert.severity')}
              body={(r: SystemAlertModel) => (
                <Tag value={r.severity} severity={severityTag(r.severity)} />
              )}
              style={{ minWidth: '8rem', textAlign: 'center' }}
            />
            <Column
              field="category"
              header={t('alert.category')}
              body={(r: SystemAlertModel) => (
                <span className="text-900 text-sm">{r.category}</span>
              )}
              style={{ minWidth: '10rem' }}
            />
            <Column
              field="title"
              header={t('alert.subject')}
              body={(r: SystemAlertModel) => (
                <div>
                  <div className="text-900 font-medium text-sm">{r.title}</div>
                  <div className="text-xs text-500 mt-1">{r.message}</div>
                </div>
              )}
              style={{ minWidth: '18rem' }}
            />
            <Column
              field="createdAt"
              header={t('common.created_at')}
              body={(r: SystemAlertModel) => (
                <span className="text-900 font-mono text-sm">
                  {r.createdAt ? new Date(r.createdAt).toLocaleString('vi-VN') : '--'}
                </span>
              )}
              style={{ minWidth: '11rem' }}
            />
            <Column
              field="status"
              header={t('common.status')}
              body={(r: SystemAlertModel) => (
                <Tag value={r.status} severity={statusTag(r.status)} />
              )}
              style={{ minWidth: '9rem', textAlign: 'center' }}
            />
          </DataTable>
        )}
      </div>

      <Dialog
        visible={!!resolveTarget}
        onHide={() => setResolveTarget(null)}
        header={resolveTarget ? `${t('alert.resolve_title')} · ${resolveTarget.alertCode}` : ''}
        style={{ width: '32rem' }}
        modal
      >
        <div className="flex flex-column gap-3">
          <div className="text-sm text-900 font-medium">{resolveTarget?.title}</div>
          <InputTextarea
            rows={3}
            value={resolveNote}
            onChange={(e) => setResolveNote(e.target.value)}
            placeholder={t('alert.resolve_note')}
            className="w-full"
          />
        </div>
        <div className="flex justify-content-end gap-2 mt-3">
          <Button label={t('common.cancel')} outlined onClick={() => setResolveTarget(null)} />
          <Button
            label={t('alert.resolve_confirm')}
            severity="success"
            icon="pi pi-check"
            onClick={handleResolve}
            loading={submitting}
          />
        </div>
      </Dialog>
    </div>
  );
};

export default AlertCenterPage;
