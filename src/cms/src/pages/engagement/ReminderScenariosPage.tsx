import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputSwitch } from 'primereact/inputswitch';
import { Dropdown } from 'primereact/dropdown';
import { TabView, TabPanel } from 'primereact/tabview';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { Skeleton } from 'primereact/skeleton';
import { useTranslation } from 'react-i18next';
import { AppBreadcrumb } from 'components';
import { TenantSelector } from '@/components/TenantSelector';
import { CommonStatus, CustomerSegmentCode } from '@/models';
import { LoyaltyService, ReminderScenarioModel, ReminderSendLogModel } from '@/service/loyalty.service';

export const ReminderScenariosPage: React.FC = () => {
  const { t } = useTranslation();
  const toast = useRef<Toast>(null);

  const [selectedTenant, setSelectedTenant] = useState<string>(
    () => localStorage.getItem('selected_tenant_id') || 'TENANT_NATCASH'
  );
  const [scenarios, setScenarios] = useState<ReminderScenarioModel[]>([]);
  const [sendLogs, setSendLogs] = useState<ReminderSendLogModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<ReminderScenarioModel>>({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sList, logList] = await Promise.all([
        LoyaltyService.getReminderScenarios(selectedTenant),
        LoyaltyService.getReminderSendLogs(selectedTenant),
      ]);
      setScenarios(Array.isArray(sList) ? sList : []);
      setSendLogs(Array.isArray(logList) ? logList : []);
    } finally {
      setLoading(false);
    }
  }, [selectedTenant]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openNew = () => {
    setFormData({
      scenarioCode: '',
      scenarioName: '',
      targetSegment: CustomerSegmentCode.WIN_BACK,
      channel: 'PUSH_INAPP',
      triggerType: 'POINTS_EXPIRING_7D',
      bodyVi: '',
      bodyEn: '',
      bodyFr: '',
      bodyHt: '',
      quietHoursRespect: true,
      maxPerWeek: 2,
      status: CommonStatus.ACTIVE,
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formData.scenarioCode?.trim() || !formData.scenarioName?.trim()) {
      toast.current?.show({ severity: 'warn', summary: t('common.warn'), detail: t('scenario.required') });
      return;
    }
    setSubmitting(true);
    try {
      await LoyaltyService.saveReminderScenario(formData as ReminderScenarioModel, selectedTenant);
      toast.current?.show({ severity: 'success', summary: t('common.success'), detail: t('scenario.saved') });
      setShowDialog(false);
      fetchData();
    } catch (err: any) {
      toast.current?.show({ severity: 'error', summary: t('common.error'), detail: err?.response?.data?.message || err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Toast ref={toast} />
      <AppBreadcrumb items={[{ label: t('nav.scenarios') }]} />

      <div className="card shadow-1 border-round surface-card p-4">
        <div className="flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
          <div>
            <h4 className="m-0 text-primary font-semibold">
              {t('scenario.title')}
            </h4>
            <p className="m-0 text-xs text-500 mt-1">
              {t('scenario.subtitle')}
            </p>
          </div>
          <div className="flex gap-2 align-items-center">
            <TenantSelector value={selectedTenant} onChange={setSelectedTenant} />
            <Button label={t('scenario.add_new')} icon="pi pi-plus" severity="success" size="small" onClick={openNew} />
            <Button icon="pi pi-refresh" outlined rounded onClick={fetchData} loading={loading} />
          </div>
        </div>

        <TabView>
          <TabPanel header={t('scenario.tab_list')} leftIcon="pi pi-bell mr-2">
            {loading ? (
              <div className="flex flex-column gap-2"><Skeleton height="2.75rem" /><Skeleton height="2.75rem" /></div>
            ) : (
              <DataTable<ReminderScenarioModel[]> value={scenarios} paginator rows={10} stripedRows responsiveLayout="scroll" emptyMessage={t('scenario.empty')}>
                <Column field="scenarioCode" header={t('scenario.code')} body={(r: ReminderScenarioModel) => <span className="font-mono white-space-nowrap font-medium text-primary">{r.scenarioCode}</span>} style={{ minWidth: '11rem' }} />
                <Column field="scenarioName" header={t('scenario.name')} style={{ minWidth: '14rem' }} />
                <Column field="targetSegment" header={t('segment.code')} body={(r: ReminderScenarioModel) => <Tag value={r.targetSegment} severity="info" />} style={{ minWidth: '10rem' }} />
                <Column field="channel" header={t('scenario.channel')} body={(r: ReminderScenarioModel) => <Tag value={r.channel} />} style={{ minWidth: '9rem' }} />
                <Column
                  header={t('scenario.anti_spam')}
                  body={(r: ReminderScenarioModel) => (
                    <span className="text-xs font-mono">
                      {r.quietHoursRespect ? `${t('scenario.quiet_hours_short')} · ` : ''}
                      {t('scenario.max_per_week_short', { count: r.maxPerWeek })}
                    </span>
                  )}
                  style={{ minWidth: '11rem' }}
                />
                <Column field="status" header={t('common.status')} body={(r: ReminderScenarioModel) => <Tag value={r.status} severity={r.status === CommonStatus.ACTIVE ? 'success' : 'secondary'} />} style={{ minWidth: '8rem', textAlign: 'center' }} />
                <Column header={t('common.action')} body={(r: ReminderScenarioModel) => <Button icon="pi pi-pencil" text rounded size="small" onClick={() => { setFormData(r); setShowDialog(true); }} />} style={{ minWidth: '5rem' }} />
              </DataTable>
            )}
          </TabPanel>

          <TabPanel header={t('scenario.tab_logs', { count: sendLogs.length })} leftIcon="pi pi-history mr-2">
            <DataTable<ReminderSendLogModel[]> value={sendLogs} paginator rows={15} stripedRows responsiveLayout="scroll" emptyMessage={t('common.no_data')}>
              <Column field="scenarioCode" header={t('scenario.code')} body={(r: ReminderSendLogModel) => <span className="font-mono white-space-nowrap">{r.scenarioCode}</span>} style={{ minWidth: '11rem' }} />
              <Column field="externalUserId" header={t('customer.phone')} body={(r: ReminderSendLogModel) => <span className="font-mono white-space-nowrap">{r.externalUserId}</span>} style={{ minWidth: '10rem' }} />
              <Column field="channel" header={t('scenario.channel')} style={{ minWidth: '8rem' }} />
              <Column field="status" header={t('common.status')} body={(r: ReminderSendLogModel) => <Tag value={r.status} severity={r.status === 'SENT' ? 'success' : r.status === 'SUPPRESSED' ? 'warning' : 'danger'} />} style={{ minWidth: '8.5rem' }} />
              <Column field="sentAt" header={t('common.created_at')} body={(r: ReminderSendLogModel) => <span className="font-mono white-space-nowrap text-xs">{r.sentAt ? new Date(r.sentAt).toLocaleString('vi-VN') : '--'}</span>} style={{ minWidth: '11rem' }} />
            </DataTable>
          </TabPanel>
        </TabView>
      </div>

      <Dialog visible={showDialog} onHide={() => setShowDialog(false)} header={t('scenario.dialog_title')} style={{ width: '48rem' }} modal className="p-fluid">
        <div className="grid">
          <div className="col-12 md:col-6 field">
            <label className="text-sm font-medium">{t('scenario.code')} *</label>
            <InputText value={formData.scenarioCode || ''} onChange={(e) => setFormData({ ...formData, scenarioCode: e.target.value.toUpperCase() })} className="font-mono" />
          </div>
          <div className="col-12 md:col-6 field">
            <label className="text-sm font-medium">{t('scenario.name')} *</label>
            <InputText value={formData.scenarioName || ''} onChange={(e) => setFormData({ ...formData, scenarioName: e.target.value })} />
          </div>
          <div className="col-12 md:col-4 field">
            <label className="text-sm font-medium">{t('segment.code')}</label>
            <Dropdown value={formData.targetSegment} options={Object.values(CustomerSegmentCode).map((v) => ({ label: v, value: v }))} onChange={(e) => setFormData({ ...formData, targetSegment: e.value })} appendTo="self" />
          </div>
          <div className="col-12 md:col-4 field">
            <label className="text-sm font-medium">{t('scenario.channel')}</label>
            <Dropdown value={formData.channel} options={[{ label: 'PUSH_INAPP', value: 'PUSH_INAPP' }, { label: 'SMS', value: 'SMS' }, { label: 'EMAIL', value: 'EMAIL' }, { label: 'USSD_FLASH', value: 'USSD_FLASH' }]} onChange={(e) => setFormData({ ...formData, channel: e.value })} appendTo="self" />
          </div>
          <div className="col-12 md:col-4 field">
            <label className="text-sm font-medium">Trigger</label>
            <InputText value={formData.triggerType || ''} onChange={(e) => setFormData({ ...formData, triggerType: e.target.value })} className="font-mono" />
          </div>
          <div className="col-12 md:col-6 field flex align-items-center gap-2 pt-3">
            <InputSwitch checked={!!formData.quietHoursRespect} onChange={(e) => setFormData({ ...formData, quietHoursRespect: e.value })} />
            <label className="text-sm font-medium m-0">{t('scenario.quiet_hours_label')}</label>
          </div>
          <div className="col-12 md:col-6 field">
            <label className="text-sm font-medium">{t('scenario.max_per_week')}</label>
            <InputNumber value={formData.maxPerWeek ?? undefined} onValueChange={(e) => setFormData({ ...formData, maxPerWeek: e.value ?? undefined })} min={1} />
          </div>
          <div className="col-12 md:col-6 field">
            <label className="text-sm font-medium">{t('scenario.template_vi')}</label>
            <InputTextarea rows={2} value={formData.bodyVi || ''} onChange={(e) => setFormData({ ...formData, bodyVi: e.target.value })} />
          </div>
          <div className="col-12 md:col-6 field">
            <label className="text-sm font-medium">{t('scenario.template_en')}</label>
            <InputTextarea rows={2} value={formData.bodyEn || ''} onChange={(e) => setFormData({ ...formData, bodyEn: e.target.value })} />
          </div>
          <div className="col-12 md:col-6 field">
            <label className="text-sm font-medium">{t('scenario.template_fr')}</label>
            <InputTextarea rows={2} value={formData.bodyFr || ''} onChange={(e) => setFormData({ ...formData, bodyFr: e.target.value })} />
          </div>
          <div className="col-12 md:col-6 field">
            <label className="text-sm font-medium">{t('scenario.template_ht')}</label>
            <InputTextarea rows={2} value={formData.bodyHt || ''} onChange={(e) => setFormData({ ...formData, bodyHt: e.target.value })} />
          </div>
          <div className="col-12 flex align-items-center gap-2">
            <InputSwitch checked={formData.status === CommonStatus.ACTIVE} onChange={(e) => setFormData({ ...formData, status: e.value ? CommonStatus.ACTIVE : CommonStatus.INACTIVE })} />
            <span className="text-sm">{formData.status === CommonStatus.ACTIVE ? t('common.active') : t('common.inactive')}</span>
          </div>
        </div>
        <div className="flex justify-content-end gap-2 mt-3">
          <Button label={t('common.cancel')} outlined onClick={() => setShowDialog(false)} />
          <Button label={t('common.save')} icon="pi pi-check" onClick={handleSave} loading={submitting} />
        </div>
      </Dialog>
    </div>
  );
};

export default ReminderScenariosPage;
