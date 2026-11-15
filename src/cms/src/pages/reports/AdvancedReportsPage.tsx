import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputSwitch } from 'primereact/inputswitch';
import { TabView, TabPanel } from 'primereact/tabview';
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
import { StandardPageHeader } from '@/components/StandardPageHeader';
import { UniversalFilterBar } from '@/components/UniversalFilterBar';
import { StandardRowActions } from '@/components/StandardRowActions';
import { StatusBadge, TypeBadge } from '@/components/StatusBadge';
import { exportToExcel } from '@/components/exportHelper';

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

  const [crossSellKeyword, setCrossSellKeyword] = useState('');
  const [scheduleKeyword, setScheduleKeyword] = useState('');

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
      toast.current?.show({
        severity: 'warn',
        summary: t('common.warn'),
        detail: t('report.schedule_required'),
      });
      return;
    }
    setSubmitting(true);
    try {
      await LoyaltyService.saveReportSchedule(
        scheduleForm as ScheduledReportModel,
        selectedTenant
      );
      toast.current?.show({
        severity: 'success',
        summary: t('common.success'),
        detail: t('report.schedule_saved'),
      });
      setShowScheduleDialog(false);
      fetchAll();
    } catch (err: any) {
      toast.current?.show({
        severity: 'error',
        summary: t('common.error'),
        detail: err?.response?.data?.message || err.message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSchedule = async (item: ScheduledReportModel) => {
    if (!item.id) return;
    try {
      await LoyaltyService.deleteReportSchedule(item.id, selectedTenant);
      toast.current?.show({
        severity: 'info',
        summary: t('common.success'),
        detail: item.reportName,
      });
      fetchAll();
    } catch (err: any) {
      toast.current?.show({
        severity: 'error',
        summary: t('common.error'),
        detail: err?.response?.data?.message || err.message,
      });
    }
  };

  const filteredCrossSell = useMemo(() => {
    if (!crossSellKeyword.trim()) return crossSell;
    const kw = crossSellKeyword.toLowerCase();
    return crossSell.filter(
      (c) =>
        c.sourcePartnerCode?.toLowerCase().includes(kw) ||
        c.sourcePartnerName?.toLowerCase().includes(kw) ||
        c.targetPartnerCode?.toLowerCase().includes(kw) ||
        c.targetPartnerName?.toLowerCase().includes(kw)
    );
  }, [crossSell, crossSellKeyword]);

  const filteredSchedules = useMemo(() => {
    if (!scheduleKeyword.trim()) return schedules;
    const kw = scheduleKeyword.toLowerCase();
    return schedules.filter(
      (s) =>
        s.reportName?.toLowerCase().includes(kw) ||
        s.reportType?.toLowerCase().includes(kw) ||
        s.recipients?.toLowerCase().includes(kw)
    );
  }, [schedules, scheduleKeyword]);

  const handleExportCrossSell = () => {
    exportToExcel(
      filteredCrossSell,
      [
        { header: t('report.source_partner'), field: 'sourcePartnerName' },
        { header: t('report.target_partner'), field: 'targetPartnerName' },
        { header: t('report.shared_customers'), field: 'crossUsersCount' },
        { header: t('report.cross_tx'), field: 'crossTransactionsCount' },
        { header: t('report.cross_gmv'), field: 'crossGmvAmount' },
      ],
      'bao_cao_ban_cheo'
    );
  };

  const handleExportLiability = () => {
    exportToExcel(
      liability?.byTier || [],
      [
        { header: t('tier.code'), field: 'tierCode' },
        { header: t('tier.name'), field: 'tierName' },
        { header: t('report.member_count'), field: 'memberCount' },
        { header: t('report.outstanding_points'), field: 'outstandingCoins' },
        { header: t('report.fiat_liability'), field: 'liabilityFiat' },
      ],
      'nghia_vu_diem_thuong'
    );
  };

  const handleExportSchedules = () => {
    exportToExcel(
      filteredSchedules,
      [
        { header: t('report.schedule_name'), field: 'reportName' },
        { header: t('report.schedule_type'), field: 'reportType' },
        { header: t('report.frequency'), field: 'frequency' },
        { header: t('report.recipients'), field: 'recipients' },
        { header: t('report.format'), field: 'format' },
        { header: t('common.status'), field: 'status' },
      ],
      'lich_gui_bao_cao'
    );
  };

  return (
    <div className="w-full">
      <Toast ref={toast} />
      <AppBreadcrumb items={[{ label: t('nav.advanced_reports') }]} />

      <StandardPageHeader
        title={t('report.advanced_title')}
        subtitle={t('report.advanced_subtitle')}
        extraLeft={<TenantSelector value={selectedTenant} onChange={setSelectedTenant} />}
        onRefresh={fetchAll}
        refreshLoading={loading}
      />

      <div className="card shadow-1 border-round surface-card p-4">
        <TabView>
          <TabPanel header={t('report.tab_cross_sell')}>
            <UniversalFilterBar
              keyword={crossSellKeyword}
              onKeywordChange={setCrossSellKeyword}
              searchPlaceholder={t('common.search')}
              onReset={() => setCrossSellKeyword('')}
              onExport={handleExportCrossSell}
            />

            {loading ? (
              <div className="flex flex-column gap-2 mt-3">
                <Skeleton height="2.5rem" />
                <Skeleton height="2.5rem" />
              </div>
            ) : (
              <DataTable<CrossSellReportModel[]>
                value={filteredCrossSell}
                paginator
                rows={10}
                stripedRows
                responsiveLayout="scroll"
                emptyMessage={t('common.no_data')}
                className="mt-3"
              >
                <Column
                  header={t('common.order_number', 'STT')}
                  body={(_, opt) => opt.rowIndex + 1}
                  style={{ width: '4rem', textAlign: 'center' }}
                />
                <Column
                  field="sourcePartnerName"
                  header={t('report.source_partner')}
                  body={(r: CrossSellReportModel) => (
                    <div>
                      <span className="font-bold font-mono text-900 mr-2">[{r.sourcePartnerCode}]</span>
                      <span className="text-900">{r.sourcePartnerName}</span>
                    </div>
                  )}
                  style={{ minWidth: '14rem' }}
                />
                <Column
                  field="targetPartnerName"
                  header={t('report.target_partner')}
                  body={(r: CrossSellReportModel) => (
                    <div>
                      <span className="font-bold font-mono text-900 mr-2">[{r.targetPartnerCode}]</span>
                      <span className="text-900">{r.targetPartnerName}</span>
                    </div>
                  )}
                  style={{ minWidth: '14rem' }}
                />
                <Column
                  field="crossUsersCount"
                  header={t('report.shared_customers')}
                  body={(r: CrossSellReportModel) => (
                    <span className="text-900 font-mono">
                      {Number(r.crossUsersCount || 0).toLocaleString()}
                    </span>
                  )}
                  style={{ minWidth: '9rem', textAlign: 'right' }}
                />
                <Column
                  field="crossTransactionsCount"
                  header={t('report.cross_tx')}
                  body={(r: CrossSellReportModel) => (
                    <span className="text-900 font-mono">
                      {Number(r.crossTransactionsCount || 0).toLocaleString()}
                    </span>
                  )}
                  style={{ minWidth: '9rem', textAlign: 'right' }}
                />
                <Column
                  field="crossGmvAmount"
                  header={t('report.cross_gmv')}
                  body={(r: CrossSellReportModel) => (
                    <span className="text-900 font-mono font-medium">
                      {Number(r.crossGmvAmount || 0).toLocaleString()} HTG
                    </span>
                  )}
                  style={{ minWidth: '11rem', textAlign: 'right' }}
                />
              </DataTable>
            )}
          </TabPanel>

          <TabPanel header={t('report.tab_liability')}>
            <div className="flex justify-content-end mb-3">
              <Button
                label={t('common.export_excel', 'Xuất Excel')}
                icon="pi pi-download"
                outlined
                size="small"
                onClick={handleExportLiability}
              />
            </div>

            {loading ? (
              <div className="flex flex-column gap-2">
                <Skeleton height="2.5rem" />
                <Skeleton height="2.5rem" />
              </div>
            ) : (
              <div className="flex flex-column gap-3">
                <div className="grid">
                  <div className="col-12 md:col-3">
                    <div className="p-3 border-round surface-50 border-1 surface-border">
                      <div className="text-xs text-500">{t('report.outstanding_points')}</div>
                      <div className="text-xl font-mono font-semibold text-900 mt-1">
                        {Number(liability?.totalOutstandingCoins || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="col-12 md:col-3">
                    <div className="p-3 border-round surface-50 border-1 surface-border">
                      <div className="text-xs text-500">{t('report.fiat_liability')}</div>
                      <div className="text-xl font-mono font-semibold text-orange-600 mt-1">
                        {Number(liability?.estimatedLiabilityFiat || 0).toLocaleString()} HTG
                      </div>
                    </div>
                  </div>
                  <div className="col-12 md:col-3">
                    <div className="p-3 border-round surface-50 border-1 surface-border">
                      <div className="text-xs text-500">{t('report.expiring_30_days')}</div>
                      <div className="text-xl font-mono font-semibold text-red-600 mt-1">
                        {Number(liability?.expiringWithin30Days || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="col-12 md:col-3">
                    <div className="p-3 border-round surface-50 border-1 surface-border">
                      <div className="text-xs text-500">{t('report.breakage_rate')}</div>
                      <div className="text-xl font-mono font-semibold text-900 mt-1">
                        {Number(liability?.breakageRatePercent || 0).toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </div>

                <DataTable<PointsLiabilityReportModel['byTier']>
                  value={liability?.byTier || []}
                  paginator
                  rows={10}
                  stripedRows
                  responsiveLayout="scroll"
                  emptyMessage={t('common.no_data')}
                  className="mt-2"
                >
                  <Column
                    header={t('common.order_number', 'STT')}
                    body={(_, opt) => opt.rowIndex + 1}
                    style={{ width: '4rem', textAlign: 'center' }}
                  />
                  <Column
                    field="tierCode"
                    header={t('tier.code')}
                    body={(r) => <span className="font-bold font-mono text-900">{r.tierCode}</span>}
                    style={{ minWidth: '9rem' }}
                  />
                  <Column
                    field="tierName"
                    header={t('tier.name')}
                    body={(r) => <span className="text-900">{r.tierName}</span>}
                    style={{ minWidth: '12rem' }}
                  />
                  <Column
                    field="memberCount"
                    header={t('report.member_count')}
                    body={(r) => (
                      <span className="text-900 font-mono">
                        {Number(r.memberCount || 0).toLocaleString()}
                      </span>
                    )}
                    style={{ minWidth: '9rem', textAlign: 'right' }}
                  />
                  <Column
                    field="outstandingCoins"
                    header={t('report.outstanding_points')}
                    body={(r) => (
                      <span className="text-900 font-mono">
                        {Number(r.outstandingCoins || 0).toLocaleString()}
                      </span>
                    )}
                    style={{ minWidth: '10rem', textAlign: 'right' }}
                  />
                  <Column
                    field="liabilityFiat"
                    header={t('report.fiat_liability')}
                    body={(r) => (
                      <span className="text-900 font-mono font-medium text-orange-600">
                        {Number(r.liabilityFiat || 0).toLocaleString()} HTG
                      </span>
                    )}
                    style={{ minWidth: '12rem', textAlign: 'right' }}
                  />
                </DataTable>
              </div>
            )}
          </TabPanel>

          <TabPanel header={t('report.tab_schedules', { count: schedules.length })}>
            <div className="flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
              <UniversalFilterBar
                keyword={scheduleKeyword}
                onKeywordChange={setScheduleKeyword}
                searchPlaceholder={t('common.search')}
                onReset={() => setScheduleKeyword('')}
                onExport={handleExportSchedules}
              />
              <Button
                label={t('common.create', 'Thêm mới')}
                icon="pi pi-plus"
                size="small"
                onClick={openNewSchedule}
              />
            </div>

            <DataTable<ScheduledReportModel[]>
              value={filteredSchedules}
              paginator
              rows={10}
              stripedRows
              responsiveLayout="scroll"
              emptyMessage={t('report.no_schedules')}
            >
              <Column
                header={t('common.order_number', 'STT')}
                body={(_, opt) => opt.rowIndex + 1}
                style={{ width: '4rem', textAlign: 'center' }}
              />
              <Column
                header={t('common.action', 'Thao tác')}
                body={(r: ScheduledReportModel) => (
                  <StandardRowActions
                    onEdit={() => {
                      setScheduleForm(r);
                      setShowScheduleDialog(true);
                    }}
                    onDelete={() => handleDeleteSchedule(r)}
                  />
                )}
                style={{ width: '7rem', textAlign: 'center' }}
              />
              <Column
                field="reportName"
                header={t('report.schedule_name')}
                body={(r: ScheduledReportModel) => (
                  <span className="text-900 font-medium">{r.reportName}</span>
                )}
                style={{ minWidth: '14rem' }}
              />
              <Column
                field="reportType"
                header={t('report.schedule_type')}
                body={(r: ScheduledReportModel) => (
                  <TypeBadge type={r.reportType} />
                )}
                style={{ minWidth: '11rem', textAlign: 'center' }}
              />
              <Column
                field="frequency"
                header={t('report.frequency')}
                body={(r: ScheduledReportModel) => (
                  <TypeBadge type={r.frequency} />
                )}
                style={{ minWidth: '8rem', textAlign: 'center' }}
              />
              <Column
                field="recipients"
                header={t('report.recipients')}
                body={(r: ScheduledReportModel) => (
                  <span className="text-900 font-mono text-sm">{r.recipients}</span>
                )}
                style={{ minWidth: '16rem' }}
              />
              <Column
                field="format"
                header={t('report.format')}
                body={(r: ScheduledReportModel) => (
                  <span className="text-900 font-mono">{r.format}</span>
                )}
                style={{ minWidth: '6.5rem', textAlign: 'center' }}
              />
              <Column
                field="status"
                header={t('common.status')}
                body={(r: ScheduledReportModel) => (
                  <StatusBadge status={r.status} />
                )}
                style={{ minWidth: '7.5rem', textAlign: 'center' }}
              />
            </DataTable>
          </TabPanel>
        </TabView>
      </div>

      <Dialog
        visible={showScheduleDialog}
        onHide={() => setShowScheduleDialog(false)}
        header={t('report.schedule_dialog')}
        style={{ width: '36rem' }}
        modal
        className="p-fluid"
      >
        <div className="flex flex-column gap-3">
          <div className="field m-0">
            <label className="text-sm font-medium">{t('report.schedule_name')} *</label>
            <InputText
              value={scheduleForm.reportName || ''}
              onChange={(e) => setScheduleForm({ ...scheduleForm, reportName: e.target.value })}
            />
          </div>
          <div className="grid">
            <div className="col-6 field m-0">
              <label className="text-sm font-medium">{t('report.schedule_type')}</label>
              <Dropdown
                value={scheduleForm.reportType}
                options={[
                  { label: 'POINTS_LIABILITY', value: 'POINTS_LIABILITY' },
                  { label: 'CROSS_SELL_MATRIX', value: 'CROSS_SELL_MATRIX' },
                  { label: 'PROGRAM_EFFECTIVENESS', value: 'PROGRAM_EFFECTIVENESS' },
                  { label: 'CLEARING_SUMMARY', value: 'CLEARING_SUMMARY' },
                ]}
                onChange={(e) => setScheduleForm({ ...scheduleForm, reportType: e.value })}
                appendTo="self"
              />
            </div>
            <div className="col-6 field m-0">
              <label className="text-sm font-medium">{t('report.frequency')}</label>
              <Dropdown
                value={scheduleForm.frequency}
                options={[
                  { label: 'DAILY', value: 'DAILY' },
                  { label: 'WEEKLY', value: 'WEEKLY' },
                  { label: 'MONTHLY', value: 'MONTHLY' },
                ]}
                onChange={(e) => setScheduleForm({ ...scheduleForm, frequency: e.value })}
                appendTo="self"
              />
            </div>
          </div>
          <div className="grid">
            <div className="col-8 field m-0">
              <label className="text-sm font-medium">{t('report.recipients')} *</label>
              <InputText
                value={scheduleForm.recipients || ''}
                onChange={(e) => setScheduleForm({ ...scheduleForm, recipients: e.target.value })}
                placeholder="cfo@natcash.ht, ops@natcash.ht"
              />
            </div>
            <div className="col-4 field m-0">
              <label className="text-sm font-medium">{t('report.format')}</label>
              <Dropdown
                value={scheduleForm.format}
                options={[
                  { label: 'XLSX', value: 'XLSX' },
                  { label: 'CSV', value: 'CSV' },
                  { label: 'PDF', value: 'PDF' },
                ]}
                onChange={(e) => setScheduleForm({ ...scheduleForm, format: e.value })}
                appendTo="self"
              />
            </div>
          </div>
          <div className="flex align-items-center gap-2">
            <InputSwitch
              checked={scheduleForm.status === CommonStatus.ACTIVE}
              onChange={(e) =>
                setScheduleForm({
                  ...scheduleForm,
                  status: e.value ? CommonStatus.ACTIVE : CommonStatus.INACTIVE,
                })
              }
            />
            <span className="text-sm text-900">{t('common.active')}</span>
          </div>
        </div>
        <div className="flex justify-content-end gap-2 mt-4">
          <Button label={t('common.cancel')} outlined onClick={() => setShowScheduleDialog(false)} />
          <Button
            label={t('common.save')}
            icon="pi pi-check"
            onClick={handleSaveSchedule}
            loading={submitting}
          />
        </div>
      </Dialog>
    </div>
  );
};

export default AdvancedReportsPage;
