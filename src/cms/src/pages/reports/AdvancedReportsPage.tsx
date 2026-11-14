import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputSwitch } from 'primereact/inputswitch';
import { TabView, TabPanel } from 'primereact/tabview';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { Skeleton } from 'primereact/skeleton';
import { useTranslation } from 'react-i18next';
import { AppBreadcrumb } from 'components';
import { TenantSelector } from '@/components/TenantSelector';
import { CommonStatus } from '@/models';
import {
  LoyaltyService,
  CrossSellReportModel,
  PointsLiabilityReportModel,
  ScheduledReportModel,
} from '@/service/loyalty.service';

export const AdvancedReportsPage: React.FC = () => {
  const { t } = useTranslation();
  const toast = useRef<Toast>(null);

  const [selectedTenant, setSelectedTenant] = useState<string>(
    () => localStorage.getItem('selected_tenant_id') || 'TENANT_NATCASH'
  );
  const [crossSell, setCrossSell] = useState<CrossSellReportModel[]>([]);
  const [liability, setLiability] = useState<PointsLiabilityReportModel | null>(null);
  const [schedules, setSchedules] = useState<ScheduledReportModel[]>([]);
  const [loading, setLoading] = useState(false);

  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [scheduleForm, setScheduleForm] = useState<Partial<ScheduledReportModel>>({});

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [csRes, libRes, schRes] = await Promise.all([
        LoyaltyService.getCrossSellReport(undefined, selectedTenant),
        LoyaltyService.getPointsLiabilityReport(selectedTenant),
        LoyaltyService.getReportSchedules(selectedTenant),
      ]);
      setCrossSell(Array.isArray(csRes) ? csRes : []);
      setLiability(libRes || null);
      setSchedules(Array.isArray(schRes) ? schRes : []);
    } finally {
      setLoading(false);
    }
  }, [selectedTenant]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const openNewSchedule = () => {
    setScheduleForm({
      reportName: '',
      reportType: 'POINTS_LIABILITY',
      frequency: 'MONTHLY',
      recipients: '',
      format: 'XLSX',
      status: CommonStatus.ACTIVE,
    });
    setShowScheduleDialog(true);
  };

  const handleSaveSchedule = async () => {
    if (!scheduleForm.reportName?.trim() || !scheduleForm.recipients?.trim()) {
      toast.current?.show({ severity: 'warn', summary: t('common.warn'), detail: t('report.schedule_required') });
      return;
    }
    setSubmitting(true);
    try {
      await LoyaltyService.saveReportSchedule(scheduleForm as ScheduledReportModel, selectedTenant);
      toast.current?.show({ severity: 'success', summary: t('common.success'), detail: t('report.schedule_saved') });
      setShowScheduleDialog(false);
      fetchAll();
    } catch (err: any) {
      toast.current?.show({ severity: 'error', summary: t('common.error'), detail: err?.response?.data?.message || err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSchedule = async (item: ScheduledReportModel) => {
    if (!item.id) return;
    try {
      await LoyaltyService.deleteReportSchedule(item.id, selectedTenant);
      toast.current?.show({ severity: 'info', summary: t('common.success'), detail: item.reportName });
      fetchAll();
    } catch (err: any) {
      toast.current?.show({ severity: 'error', summary: t('common.error'), detail: err?.response?.data?.message || err.message });
    }
  };

  return (
    <div>
      <Toast ref={toast} />
      <AppBreadcrumb items={[{ label: t('nav.advanced_reports') }]} />

      <div className="card shadow-1 border-round surface-card p-4">
        <div className="flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
          <div>
            <h4 className="m-0 text-primary font-semibold">
              {t('report.advanced_title')}
            </h4>
            <p className="m-0 text-xs text-500 mt-1">
              {t('report.advanced_subtitle')}
            </p>
          </div>
          <div className="flex gap-2 align-items-center">
            <TenantSelector value={selectedTenant} onChange={setSelectedTenant} />
            <Button icon="pi pi-refresh" outlined rounded onClick={fetchAll} loading={loading} />
          </div>
        </div>

        <TabView>
          <TabPanel header={t('report.tab_cross_sell')} leftIcon="pi pi-th-large mr-2">
            {loading ? (
              <div className="flex flex-column gap-2"><Skeleton height="2.5rem" /><Skeleton height="2.5rem" /></div>
            ) : (
              <DataTable<CrossSellReportModel[]> value={crossSell} paginator rows={10} stripedRows responsiveLayout="scroll" emptyMessage={t('common.no_data')}>
                <Column field="sourcePartnerName" header={t('report.source_partner')} body={(r: CrossSellReportModel) => <span><span className="font-mono text-xs mr-1">[{r.sourcePartnerCode}]</span>{r.sourcePartnerName}</span>} style={{ minWidth: '14rem' }} />
                <Column field="targetPartnerName" header={t('report.target_partner')} body={(r: CrossSellReportModel) => <span><span className="font-mono text-xs mr-1">[{r.targetPartnerCode}]</span>{r.targetPartnerName}</span>} style={{ minWidth: '14rem' }} />
                <Column field="crossUsersCount" header={t('report.shared_customers')} body={(r: CrossSellReportModel) => Number(r.crossUsersCount || 0).toLocaleString()} style={{ minWidth: '9rem', textAlign: 'right' }} />
                <Column field="crossTransactionsCount" header={t('report.cross_tx')} body={(r: CrossSellReportModel) => <span className="font-mono">{Number(r.crossTransactionsCount || 0).toLocaleString()}</span>} style={{ minWidth: '9rem', textAlign: 'right' }} />
                <Column field="crossGmvAmount" header={t('report.cross_gmv')} body={(r: CrossSellReportModel) => <span className="font-mono font-medium">{Number(r.crossGmvAmount || 0).toLocaleString()} HTG</span>} style={{ minWidth: '11rem', textAlign: 'right' }} />
              </DataTable>
            )}
          </TabPanel>

          <TabPanel header={t('report.tab_liability')} leftIcon="pi pi-wallet mr-2">
            {loading ? (
              <div className="flex flex-column gap-2"><Skeleton height="2.5rem" /><Skeleton height="2.5rem" /></div>
            ) : (
              <div className="flex flex-column gap-3">
                <div className="grid">
                  <div className="col-12 md:col-3"><div className="p-3 border-round surface-50 border-1 surface-border"><div className="text-xs text-500">{t('report.outstanding_points')}</div><div className="text-xl font-mono font-semibold mt-1">{Number(liability?.totalOutstandingCoins || 0).toLocaleString()}</div></div></div>
                  <div className="col-12 md:col-3"><div className="p-3 border-round surface-50 border-1 surface-border"><div className="text-xs text-500">{t('report.fiat_liability')}</div><div className="text-xl font-mono font-semibold text-orange-600 mt-1">{Number(liability?.estimatedLiabilityFiat || 0).toLocaleString()} HTG</div></div></div>
                  <div className="col-12 md:col-3"><div className="p-3 border-round surface-50 border-1 surface-border"><div className="text-xs text-500">{t('report.expiring_30_days')}</div><div className="text-xl font-mono font-semibold text-red-600 mt-1">{Number(liability?.expiringWithin30Days || 0).toLocaleString()}</div></div></div>
                  <div className="col-12 md:col-3"><div className="p-3 border-round surface-50 border-1 surface-border"><div className="text-xs text-500">{t('report.breakage_rate')}</div><div className="text-xl font-mono font-semibold mt-1">{Number(liability?.breakageRatePercent || 0).toFixed(2)}%</div></div></div>
                </div>
                <DataTable<PointsLiabilityReportModel['byTier']> value={liability?.byTier || []} paginator rows={10} stripedRows responsiveLayout="scroll" emptyMessage={t('common.no_data')}>
                  <Column field="tierCode" header={t('tier.code')} body={(r) => <span className="font-mono font-medium">{r.tierCode}</span>} style={{ minWidth: '9rem' }} />
                  <Column field="tierName" header={t('tier.name')} style={{ minWidth: '12rem' }} />
                  <Column field="memberCount" header={t('report.member_count')} body={(r) => Number(r.memberCount || 0).toLocaleString()} style={{ minWidth: '9rem', textAlign: 'right' }} />
                  <Column field="outstandingCoins" header={t('report.outstanding_points')} body={(r) => <span className="font-mono">{Number(r.outstandingCoins || 0).toLocaleString()}</span>} style={{ minWidth: '10rem', textAlign: 'right' }} />
                  <Column field="liabilityFiat" header={t('report.fiat_liability')} body={(r) => <span className="font-mono font-medium text-orange-600">{Number(r.liabilityFiat || 0).toLocaleString()} HTG</span>} style={{ minWidth: '12rem', textAlign: 'right' }} />
                </DataTable>
              </div>
            )}
          </TabPanel>

          <TabPanel header={t('report.tab_schedules', { count: schedules.length })} leftIcon="pi pi-envelope mr-2">
            <div className="flex justify-content-end mb-3">
              <Button icon="pi pi-plus" label={t('report.add_schedule')} severity="success" size="small" onClick={openNewSchedule} />
            </div>
            <DataTable<ScheduledReportModel[]> value={schedules} paginator rows={10} stripedRows responsiveLayout="scroll" emptyMessage={t('report.no_schedules')}>
              <Column field="reportName" header={t('report.schedule_name')} style={{ minWidth: '14rem' }} />
              <Column field="reportType" header={t('report.schedule_type')} body={(r: ScheduledReportModel) => <Tag value={r.reportType} severity="info" />} style={{ minWidth: '11rem' }} />
              <Column field="frequency" header={t('report.frequency')} body={(r: ScheduledReportModel) => <Tag value={r.frequency} />} style={{ minWidth: '8rem' }} />
              <Column field="recipients" header={t('report.recipients')} style={{ minWidth: '16rem' }} />
              <Column field="format" header={t('report.format')} style={{ minWidth: '6.5rem', textAlign: 'center' }} />
              <Column field="status" header={t('common.status')} body={(r: ScheduledReportModel) => <Tag value={r.status} severity={r.status === CommonStatus.ACTIVE ? 'success' : 'secondary'} />} style={{ minWidth: '7.5rem', textAlign: 'center' }} />
              <Column
                header={t('common.action')}
                body={(r: ScheduledReportModel) => (
                  <div className="flex gap-1">
                    <Button icon="pi pi-pencil" text rounded size="small" onClick={() => { setScheduleForm(r); setShowScheduleDialog(true); }} />
                    <Button icon="pi pi-trash" text rounded severity="danger" size="small" onClick={() => handleDeleteSchedule(r)} />
                  </div>
                )}
                style={{ minWidth: '7rem' }}
              />
            </DataTable>
          </TabPanel>
        </TabView>
      </div>

      <Dialog visible={showScheduleDialog} onHide={() => setShowScheduleDialog(false)} header={t('report.schedule_dialog')} style={{ width: '36rem' }} modal className="p-fluid">
        <div className="flex flex-column gap-3">
          <div className="field m-0">
            <label className="text-sm font-medium">{t('report.schedule_name')} *</label>
            <InputText value={scheduleForm.reportName || ''} onChange={(e) => setScheduleForm({ ...scheduleForm, reportName: e.target.value })} />
          </div>
          <div className="grid">
            <div className="col-6 field m-0">
              <label className="text-sm font-medium">{t('report.schedule_type')}</label>
              <Dropdown value={scheduleForm.reportType} options={[{ label: 'POINTS_LIABILITY', value: 'POINTS_LIABILITY' }, { label: 'CROSS_SELL_MATRIX', value: 'CROSS_SELL_MATRIX' }, { label: 'PROGRAM_EFFECTIVENESS', value: 'PROGRAM_EFFECTIVENESS' }, { label: 'CLEARING_SUMMARY', value: 'CLEARING_SUMMARY' }]} onChange={(e) => setScheduleForm({ ...scheduleForm, reportType: e.value })} appendTo="self" />
            </div>
            <div className="col-6 field m-0">
              <label className="text-sm font-medium">{t('report.frequency')}</label>
              <Dropdown value={scheduleForm.frequency} options={[{ label: 'DAILY', value: 'DAILY' }, { label: 'WEEKLY', value: 'WEEKLY' }, { label: 'MONTHLY', value: 'MONTHLY' }]} onChange={(e) => setScheduleForm({ ...scheduleForm, frequency: e.value })} appendTo="self" />
            </div>
          </div>
          <div className="grid">
            <div className="col-8 field m-0">
              <label className="text-sm font-medium">{t('report.recipients')} *</label>
              <InputText value={scheduleForm.recipients || ''} onChange={(e) => setScheduleForm({ ...scheduleForm, recipients: e.target.value })} placeholder="cfo@natcash.ht, ops@natcash.ht" />
            </div>
            <div className="col-4 field m-0">
              <label className="text-sm font-medium">{t('report.format')}</label>
              <Dropdown value={scheduleForm.format} options={[{ label: 'XLSX', value: 'XLSX' }, { label: 'CSV', value: 'CSV' }, { label: 'PDF', value: 'PDF' }]} onChange={(e) => setScheduleForm({ ...scheduleForm, format: e.value })} appendTo="self" />
            </div>
          </div>
          <div className="flex align-items-center gap-2">
            <InputSwitch checked={scheduleForm.status === CommonStatus.ACTIVE} onChange={(e) => setScheduleForm({ ...scheduleForm, status: e.value ? CommonStatus.ACTIVE : CommonStatus.INACTIVE })} />
            <span className="text-sm">{t('common.active')}</span>
          </div>
        </div>
        <div className="flex justify-content-end gap-2 mt-4">
          <Button label={t('common.cancel')} outlined onClick={() => setShowScheduleDialog(false)} />
          <Button label={t('common.save')} icon="pi pi-check" onClick={handleSaveSchedule} loading={submitting} />
        </div>
      </Dialog>
    </div>
  );
};

export default AdvancedReportsPage;
