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
import {
  LoyaltyService,
  CrossSellMatrixItemModel,
  PointsLiabilityBucketModel,
  ReportScheduleModel,
} from '@/service/loyalty.service';

export const AdvancedReportsPage: React.FC = () => {
  const { t } = useTranslation();
  const toast = useRef<Toast>(null);

  const [selectedTenant, setSelectedTenant] = useState<string>(
    () => localStorage.getItem('selected_tenant_id') || 'TENANT_NATCASH'
  );
  const [crossSell, setCrossSell] = useState<CrossSellMatrixItemModel[]>([]);
  const [liability, setLiability] = useState<PointsLiabilityBucketModel[]>([]);
  const [schedules, setSchedules] = useState<ReportScheduleModel[]>([]);
  const [loading, setLoading] = useState(false);

  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [scheduleForm, setScheduleForm] = useState<Partial<ReportScheduleModel>>({});

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [csRes, libRes, schRes] = await Promise.all([
        LoyaltyService.getCrossSellReport(undefined, selectedTenant),
        LoyaltyService.getPointsLiabilityReport(selectedTenant),
        LoyaltyService.getReportSchedules(selectedTenant),
      ]);
      setCrossSell(Array.isArray(csRes) ? csRes : []);
      setLiability(Array.isArray(libRes) ? libRes : []);
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
      enabled: true,
    });
    setShowScheduleDialog(true);
  };

  const handleSaveSchedule = async () => {
    if (!scheduleForm.reportName?.trim() || !scheduleForm.recipients?.trim()) {
      toast.current?.show({ severity: 'warn', summary: t('common.warn', { defaultValue: 'Thiếu thông tin' }), detail: t('report.schedule_required', { defaultValue: 'Vui lòng nhập Tên lịch báo cáo và Email người nhận.' }) });
      return;
    }
    setSubmitting(true);
    try {
      await LoyaltyService.saveReportSchedule(scheduleForm as ReportScheduleModel, selectedTenant);
      toast.current?.show({ severity: 'success', summary: t('common.success', { defaultValue: 'Thành công' }), detail: t('report.schedule_saved', { defaultValue: 'Đã lưu lịch gửi báo cáo tự động.' }) });
      setShowScheduleDialog(false);
      fetchAll();
    } catch (err: any) {
      toast.current?.show({ severity: 'error', summary: t('common.error', { defaultValue: 'Lỗi' }), detail: err?.response?.data?.message || err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSchedule = async (item: ReportScheduleModel) => {
    if (!item.id) return;
    try {
      await LoyaltyService.deleteReportSchedule(item.id, selectedTenant);
      toast.current?.show({ severity: 'info', summary: t('common.success', { defaultValue: 'Đã xóa' }), detail: item.reportName });
      fetchAll();
    } catch (err: any) {
      toast.current?.show({ severity: 'error', summary: t('common.error', { defaultValue: 'Lỗi' }), detail: err?.response?.data?.message || err.message });
    }
  };

  return (
    <div>
      <Toast ref={toast} />
      <AppBreadcrumb items={[{ label: t('nav.advanced_reports', { defaultValue: 'Báo cáo Chuyên sâu (NS-05/06/07)' }) }]} />

      <div className="card shadow-1 border-round surface-card p-4">
        <div className="flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
          <div>
            <h4 className="m-0 text-primary font-semibold">
              {t('report.advanced_title', { defaultValue: 'Báo cáo Liên minh Nâng cao (NS-05 · NS-06 · NS-07)' })}
            </h4>
            <p className="m-0 text-xs text-500 mt-1">
              {t('report.advanced_subtitle', { defaultValue: 'Ma trận bán chéo liên minh, nghĩa vụ điểm chưa tiêu FIFO (Points Liability) và lịch gửi báo cáo định kỳ.' })}
            </p>
          </div>
          <div className="flex gap-2 align-items-center">
            <TenantSelector value={selectedTenant} onChange={setSelectedTenant} />
            <Button icon="pi pi-refresh" outlined rounded onClick={fetchAll} loading={loading} />
          </div>
        </div>

        <TabView>
          <TabPanel header={t('report.tab_cross_sell', { defaultValue: 'Ma trận Bán chéo (NS-05)' })} leftIcon="pi pi-th-large mr-2">
            {loading ? (
              <div className="flex flex-column gap-2"><Skeleton height="2.5rem" /><Skeleton height="2.5rem" /></div>
            ) : (
              <DataTable<CrossSellMatrixItemModel> value={crossSell} paginator rows={10} stripedRows responsiveLayout="scroll" emptyMessage={t('common.no_data', { defaultValue: 'Chưa có dữ liệu luân chuyển điểm chéo đối tác.' })}>
                <Column field="sourcePartnerName" header={t('report.source_partner', { defaultValue: 'Đối tác Phát hành (Nguồn)' })} body={(r) => <span><span className="font-mono text-xs mr-1">[{r.sourcePartnerCode}]</span>{r.sourcePartnerName}</span>} style={{ minWidth: '14rem' }} />
                <Column field="targetPartnerName" header={t('report.target_partner', { defaultValue: 'Đối tác Tiêu điểm (Đích)' })} body={(r) => <span><span className="font-mono text-xs mr-1">[{r.targetPartnerCode}]</span>{r.targetPartnerName}</span>} style={{ minWidth: '14rem' }} />
                <Column field="sharedCustomersCount" header={t('report.shared_customers', { defaultValue: 'Số Khách Chung' })} body={(r) => Number(r.sharedCustomersCount || 0).toLocaleString()} style={{ minWidth: '9rem', textAlign: 'right' }} />
                <Column field="crossPointsRedeemed" header={t('report.cross_points', { defaultValue: 'Điểm Tiêu Chéo' })} body={(r) => <span className="font-mono">{Number(r.crossPointsRedeemed || 0).toLocaleString()}</span>} style={{ minWidth: '9rem', textAlign: 'right' }} />
                <Column field="crossGmvAmount" header={t('report.cross_gmv', { defaultValue: 'Giá trị Giao dịch (GMV)' })} body={(r) => <span className="font-mono font-medium">{Number(r.crossGmvAmount || 0).toLocaleString()} HTG</span>} style={{ minWidth: '11rem', textAlign: 'right' }} />
              </DataTable>
            )}
          </TabPanel>

          <TabPanel header={t('report.tab_liability', { defaultValue: 'Nghĩa vụ Điểm FIFO (NS-06)' })} leftIcon="pi pi-wallet mr-2">
            {loading ? (
              <div className="flex flex-column gap-2"><Skeleton height="2.5rem" /><Skeleton height="2.5rem" /></div>
            ) : (
              <DataTable<PointsLiabilityBucketModel> value={liability} paginator rows={10} stripedRows responsiveLayout="scroll" emptyMessage={t('common.no_data', { defaultValue: 'Chưa có dữ liệu tồn dư nghĩa vụ điểm theo kỳ hết hạn.' })}>
                <Column field="bucketLabel" header={t('report.expiry_bucket', { defaultValue: 'Kỳ Hết Hạn FIFO' })} body={(r) => <span className="font-mono font-medium">{r.bucketLabel}</span>} style={{ minWidth: '12rem' }} />
                <Column field="memberCount" header={t('report.member_count', { defaultValue: 'Số Hội Viên' })} body={(r) => Number(r.memberCount || 0).toLocaleString()} style={{ minWidth: '9rem', textAlign: 'right' }} />
                <Column field="outstandingPoints" header={t('report.outstanding_points', { defaultValue: 'Tổng Điểm Tồn' })} body={(r) => <span className="font-mono">{Number(r.outstandingPoints || 0).toLocaleString()}</span>} style={{ minWidth: '10rem', textAlign: 'right' }} />
                <Column field="estimatedFiatLiability" header={t('report.fiat_liability', { defaultValue: 'Dự phòng Tài chính (HTG)' })} body={(r) => <span className="font-mono font-medium text-orange-600">{Number(r.estimatedFiatLiability || 0).toLocaleString()} HTG</span>} style={{ minWidth: '12rem', textAlign: 'right' }} />
                <Column field="expiringIn30Days" header={t('report.expiring_30d', { defaultValue: 'Sắp hết hạn 30 ngày' })} body={(r) => <span className="font-mono text-red-600">{Number(r.expiringIn30Days || 0).toLocaleString()}</span>} style={{ minWidth: '10rem', textAlign: 'right' }} />
              </DataTable>
            )}
          </TabPanel>

          <TabPanel header={t('report.tab_schedules', { defaultValue: `Lịch Gửi Email Tự động (${schedules.length}) · NS-07` })} leftIcon="pi pi-envelope mr-2">
            <div className="flex justify-content-end mb-3">
              <Button icon="pi pi-plus" label={t('report.add_schedule', { defaultValue: 'Tạo Lịch Gửi Báo cáo' })} severity="success" size="small" onClick={openNewSchedule} />
            </div>
            <DataTable<ReportScheduleModel> value={schedules} paginator rows={10} stripedRows responsiveLayout="scroll" emptyMessage={t('report.no_schedules', { defaultValue: 'Chưa có lịch gửi báo cáo tự động nào.' })}>
              <Column field="reportName" header={t('report.schedule_name', { defaultValue: 'Tên Báo Cáo' })} style={{ minWidth: '14rem' }} />
              <Column field="reportType" header={t('report.schedule_type', { defaultValue: 'Loại Báo Cáo' })} body={(r) => <Tag value={r.reportType} severity="info" />} style={{ minWidth: '11rem' }} />
              <Column field="frequency" header={t('report.frequency', { defaultValue: 'Tần Suất' })} body={(r) => <Tag value={r.frequency} />} style={{ minWidth: '8rem' }} />
              <Column field="recipients" header={t('report.recipients', { defaultValue: 'Email Nhận' })} style={{ minWidth: '16rem' }} />
              <Column field="format" header={t('report.format', { defaultValue: 'Định Dạng' })} style={{ minWidth: '6.5rem', textAlign: 'center' }} />
              <Column field="enabled" header={t('common.status', { defaultValue: 'Trạng Thái' })} body={(r) => <Tag value={r.enabled ? 'ACTIVE' : 'PAUSED'} severity={r.enabled ? 'success' : 'secondary'} />} style={{ minWidth: '7.5rem', textAlign: 'center' }} />
              <Column
                header={t('common.action', { defaultValue: 'Thao Tác' })}
                body={(r) => (
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

      <Dialog visible={showScheduleDialog} onHide={() => setShowScheduleDialog(false)} header={t('report.schedule_dialog', { defaultValue: 'Cấu hình Lịch Gửi Báo Cáo (NS-07)' })} style={{ width: '36rem' }} modal className="p-fluid">
        <div className="flex flex-column gap-3">
          <div className="field m-0">
            <label className="text-sm font-medium">{t('report.schedule_name', { defaultValue: 'Tên Lịch Báo Cáo' })} *</label>
            <InputText value={scheduleForm.reportName || ''} onChange={(e) => setScheduleForm({ ...scheduleForm, reportName: e.target.value })} />
          </div>
          <div className="grid">
            <div className="col-6 field m-0">
              <label className="text-sm font-medium">{t('report.schedule_type', { defaultValue: 'Loại Báo Cáo' })}</label>
              <Dropdown value={scheduleForm.reportType} options={[{ label: 'POINTS_LIABILITY', value: 'POINTS_LIABILITY' }, { label: 'CROSS_SELL_MATRIX', value: 'CROSS_SELL_MATRIX' }, { label: 'PROGRAM_EFFECTIVENESS', value: 'PROGRAM_EFFECTIVENESS' }, { label: 'CLEARING_SUMMARY', value: 'CLEARING_SUMMARY' }]} onChange={(e) => setScheduleForm({ ...scheduleForm, reportType: e.value })} appendTo="self" />
            </div>
            <div className="col-6 field m-0">
              <label className="text-sm font-medium">{t('report.frequency', { defaultValue: 'Tần suất' })}</label>
              <Dropdown value={scheduleForm.frequency} options={[{ label: 'DAILY', value: 'DAILY' }, { label: 'WEEKLY', value: 'WEEKLY' }, { label: 'MONTHLY', value: 'MONTHLY' }]} onChange={(e) => setScheduleForm({ ...scheduleForm, frequency: e.value })} appendTo="self" />
            </div>
          </div>
          <div className="grid">
            <div className="col-8 field m-0">
              <label className="text-sm font-medium">{t('report.recipients', { defaultValue: 'Email nhận (cách nhau dấu phẩy)' })} *</label>
              <InputText value={scheduleForm.recipients || ''} onChange={(e) => setScheduleForm({ ...scheduleForm, recipients: e.target.value })} placeholder="cfo@natcash.ht, ops@natcash.ht" />
            </div>
            <div className="col-4 field m-0">
              <label className="text-sm font-medium">{t('report.format', { defaultValue: 'Định dạng' })}</label>
              <Dropdown value={scheduleForm.format} options={[{ label: 'XLSX', value: 'XLSX' }, { label: 'CSV', value: 'CSV' }, { label: 'PDF', value: 'PDF' }]} onChange={(e) => setScheduleForm({ ...scheduleForm, format: e.value })} appendTo="self" />
            </div>
          </div>
          <div className="flex align-items-center gap-2">
            <InputSwitch checked={!!scheduleForm.enabled} onChange={(e) => setScheduleForm({ ...scheduleForm, enabled: e.value })} />
            <span className="text-sm">{t('common.active', { defaultValue: 'Kích hoạt gửi tự động' })}</span>
          </div>
        </div>
        <div className="flex justify-content-end gap-2 mt-4">
          <Button label={t('common.cancel', { defaultValue: 'Hủy' })} outlined onClick={() => setShowScheduleDialog(false)} />
          <Button label={t('common.save', { defaultValue: 'Lưu Lịch' })} icon="pi pi-check" onClick={handleSaveSchedule} loading={submitting} />
        </div>
      </Dialog>
    </div>
  );
};

export default AdvancedReportsPage;
