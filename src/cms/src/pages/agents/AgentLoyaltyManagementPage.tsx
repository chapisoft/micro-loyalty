import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { TabView, TabPanel } from 'primereact/tabview';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { ProgressBar } from 'primereact/progressbar';
import { Skeleton } from 'primereact/skeleton';
import { useTranslation } from 'react-i18next';
import { AppBreadcrumb } from 'components';
import { TenantSelector } from '@/components/TenantSelector';
import { AgentRoleType } from '@/models';
import { LoyaltyService, AgentLoyaltyItemModel, SupportPlaybookModel, AgentTargetConfigModel } from '@/service/loyalty.service';

export const AgentLoyaltyManagementPage: React.FC = () => {
  const { t } = useTranslation();
  const toast = useRef<Toast>(null);

  const [selectedTenant, setSelectedTenant] = useState<string>(
    () => localStorage.getItem('selected_tenant_id') || 'TENANT_NATCASH'
  );
  const [agents, setAgents] = useState<AgentLoyaltyItemModel[]>([]);
  const [playbooks, setPlaybooks] = useState<SupportPlaybookModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  const [showTargetDialog, setShowTargetDialog] = useState(false);
  const [targetForm, setTargetForm] = useState<AgentTargetConfigModel>({
    roleType: AgentRoleType.AGENT,
    month: new Date().toISOString().substring(0, 7),
    targetCustomers: 100,
    rewardAmount: 500,
    minQualifiedNetworkPercent: 50,
  });

  const [showPlaybookDialog, setShowPlaybookDialog] = useState(false);
  const [playbookForm, setPlaybookForm] = useState<Partial<SupportPlaybookModel>>({});
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [agentList, pbList] = await Promise.all([
        LoyaltyService.getAdminAgents({ roleType: roleFilter !== 'ALL' ? roleFilter : undefined }, selectedTenant),
        LoyaltyService.getAgentPlaybooks(selectedTenant),
      ]);
      setAgents(Array.isArray(agentList) ? agentList : []);
      setPlaybooks(Array.isArray(pbList) ? pbList : []);
    } finally {
      setLoading(false);
    }
  }, [selectedTenant, roleFilter]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleSaveTarget = async () => {
    setSubmitting(true);
    try {
      await LoyaltyService.saveAgentTarget(targetForm, selectedTenant);
      toast.current?.show({ severity: 'success', summary: t('common.success', { defaultValue: 'Thành công' }), detail: t('agent.target_saved', { defaultValue: 'Đã cập nhật chỉ tiêu thi đua Đại lý.' }) });
      setShowTargetDialog(false);
      fetchAll();
    } catch (err: any) {
      toast.current?.show({ severity: 'error', summary: t('common.error', { defaultValue: 'Lỗi' }), detail: err?.response?.data?.message || err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveReward = async (agent: AgentLoyaltyItemModel) => {
    try {
      await LoyaltyService.approveAgentReward(agent.id, agent.month, selectedTenant);
      toast.current?.show({ severity: 'success', summary: t('common.success', { defaultValue: 'Đã duyệt thưởng' }), detail: agent.agentCode });
      fetchAll();
    } catch (err: any) {
      toast.current?.show({ severity: 'error', summary: t('common.error', { defaultValue: 'Lỗi' }), detail: err?.response?.data?.message || err.message });
    }
  };

  const handleSavePlaybook = async () => {
    if (!playbookForm.playbookCode?.trim() || !playbookForm.title?.trim()) {
      toast.current?.show({ severity: 'warn', summary: t('common.warn', { defaultValue: 'Thiếu thông tin' }), detail: t('agent.playbook_required', { defaultValue: 'Vui lòng nhập Mã tài liệu và Tiêu đề Playbook.' }) });
      return;
    }
    setSubmitting(true);
    try {
      await LoyaltyService.saveAgentPlaybook(playbookForm as SupportPlaybookModel, selectedTenant);
      toast.current?.show({ severity: 'success', summary: t('common.success', { defaultValue: 'Thành công' }), detail: t('agent.playbook_saved', { defaultValue: 'Đã lưu tài liệu hướng dẫn Đại lý.' }) });
      setShowPlaybookDialog(false);
      fetchAll();
    } catch (err: any) {
      toast.current?.show({ severity: 'error', summary: t('common.error', { defaultValue: 'Lỗi' }), detail: err?.response?.data?.message || err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Toast ref={toast} />
      <AppBreadcrumb items={[{ label: t('nav.agent_loyalty', { defaultValue: 'Quản lý Loyalty Đại lý (AG-03)' }) }]} />

      <div className="card shadow-1 border-round surface-card p-4">
        <div className="flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
          <div>
            <h4 className="m-0 text-primary font-semibold">
              {t('agent.title', { defaultValue: 'Quản trị Chỉ tiêu & Thưởng Loyalty Đại lý / Tổng đại lý (AG-03)' })}
            </h4>
            <p className="m-0 text-xs text-500 mt-1">
              {t('agent.subtitle', { defaultValue: 'Agent: ≥100 giao dịch/tháng · Super Agent: ≥50% đại lý trực thuộc đạt KPI. Hỗ trợ duyệt thưởng và Playbook thực chiến.' })}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 align-items-center">
            <TenantSelector value={selectedTenant} onChange={setSelectedTenant} />
            <Dropdown value={roleFilter} options={[{ label: t('common.all', { defaultValue: 'Tất cả cấp' }), value: 'ALL' }, { label: 'AGENT', value: AgentRoleType.AGENT }, { label: 'SUPER_AGENT', value: AgentRoleType.SUPER_AGENT }]} onChange={(e) => setRoleFilter(e.value)} className="w-11rem" />
            <Button label={t('agent.set_target', { defaultValue: 'Thiết lập KPI' })} icon="pi pi-sliders-h" size="small" onClick={() => setShowTargetDialog(true)} />
            <Button icon="pi pi-refresh" outlined rounded onClick={fetchAll} loading={loading} />
          </div>
        </div>

        <TabView>
          <TabPanel header={t('agent.tab_performance', { defaultValue: 'Bảng Theo dõi KPI & Duyệt thưởng' })} leftIcon="pi pi-users mr-2">
            {loading ? (
              <div className="flex flex-column gap-2"><Skeleton height="2.75rem" /><Skeleton height="2.75rem" /></div>
            ) : (
              <DataTable<AgentLoyaltyItemModel[]> value={agents} paginator rows={10} stripedRows responsiveLayout="scroll" emptyMessage={t('agent.empty', { defaultValue: 'Chưa có dữ liệu hiệu suất Đại lý trong kỳ.' })}>
                <Column field="agentCode" header={t('agent.code', { defaultValue: 'Mã Đại Lý' })} body={(r: AgentLoyaltyItemModel) => <span className="font-mono white-space-nowrap font-medium text-primary">{r.agentCode}</span>} style={{ minWidth: '10rem' }} />
                <Column field="agentName" header={t('agent.name', { defaultValue: 'Tên Đại Lý' })} style={{ minWidth: '14rem' }} />
                <Column field="roleType" header={t('agent.role', { defaultValue: 'Cấp Bậc' })} body={(r: AgentLoyaltyItemModel) => <Tag value={r.roleType} severity={r.roleType === AgentRoleType.SUPER_AGENT ? 'warning' : 'info'} />} style={{ minWidth: '9rem' }} />
                <Column field="month" header={t('agent.period', { defaultValue: 'Kỳ' })} style={{ minWidth: '6.5rem' }} />
                <Column
                  header={t('agent.progress', { defaultValue: 'Tiến độ KPI' })}
                  body={(r: AgentLoyaltyItemModel) => {
                    const pct = r.roleType === AgentRoleType.SUPER_AGENT
                      ? Number(r.subAgentsQualifiedPercent || 0)
                      : (r.targetCustomers > 0 ? Math.min(100, (Number(r.ekycNewCustomers || 0) / r.targetCustomers) * 100) : 0);
                    return (
                      <div className="flex flex-column gap-1">
                        <span className="text-xs font-mono">
                          {r.roleType === AgentRoleType.SUPER_AGENT
                            ? `${Number(r.subAgentsQualifiedPercent || 0).toFixed(1)}% (mục tiêu ≥50%)`
                            : `${r.ekycNewCustomers}/${r.targetCustomers} KH eKYC`}
                        </span>
                        <ProgressBar value={Number(pct.toFixed(0))} showValue={false} style={{ height: '6px' }} />
                      </div>
                    );
                  }}
                  style={{ minWidth: '13rem' }}
                />
                <Column field="rewardAmount" header={t('agent.bonus', { defaultValue: 'Thưởng Dự Kiến' })} body={(r: AgentLoyaltyItemModel) => <span className="font-mono">{Number(r.rewardAmount || 0).toLocaleString()} {r.rewardCurrency || 'HTG'}</span>} style={{ minWidth: '9rem', textAlign: 'right' }} />
                <Column field="rewardStatus" header={t('common.status', { defaultValue: 'Trạng Thái' })} body={(r: AgentLoyaltyItemModel) => <Tag value={r.rewardStatus} severity={r.rewardStatus === 'APPROVED' || r.rewardStatus === 'PAID' ? 'success' : 'warning'} />} style={{ minWidth: '8.5rem', textAlign: 'center' }} />
                <Column
                  header={t('common.action', { defaultValue: 'Duyệt Thưởng' })}
                  body={(r: AgentLoyaltyItemModel) => r.rewardStatus === 'ELIGIBLE' ? <Button label={t('approval.approve_btn', { defaultValue: 'Duyệt' })} icon="pi pi-check" size="small" severity="success" onClick={() => handleApproveReward(r)} /> : null}
                  style={{ minWidth: '8rem' }}
                />
              </DataTable>
            )}
          </TabPanel>

          <TabPanel header={t('agent.tab_playbooks', { defaultValue: `Tài liệu Hỗ trợ / Playbooks (${playbooks.length})` })} leftIcon="pi pi-book mr-2">
            <div className="flex justify-content-end mb-3">
              <Button icon="pi pi-plus" label={t('agent.add_playbook', { defaultValue: 'Thêm Playbook' })} severity="success" size="small" onClick={() => { setPlaybookForm({ playbookCode: '', title: '', category: AgentRoleType.AGENT, summary: '', stepsMarkdown: '' }); setShowPlaybookDialog(true); }} />
            </div>
            <DataTable<SupportPlaybookModel[]> value={playbooks} paginator rows={10} stripedRows responsiveLayout="scroll" emptyMessage={t('agent.no_playbooks', { defaultValue: 'Chưa có Playbook hướng dẫn nào.' })}>
              <Column field="playbookCode" header="Mã Playbook" body={(r: SupportPlaybookModel) => <span className="font-mono white-space-nowrap">{r.playbookCode}</span>} style={{ minWidth: '10rem' }} />
              <Column field="title" header="Tiêu Đề" style={{ minWidth: '15rem' }} />
              <Column field="category" header="Đối Tượng" body={(r: SupportPlaybookModel) => <Tag value={r.category} />} style={{ minWidth: '9rem' }} />
              <Column field="summary" header="Tóm Tắt" style={{ minWidth: '18rem' }} />
              <Column header={t('common.action', { defaultValue: 'Sửa' })} body={(r: SupportPlaybookModel) => <Button icon="pi pi-pencil" text rounded size="small" onClick={() => { setPlaybookForm(r); setShowPlaybookDialog(true); }} />} style={{ minWidth: '5rem' }} />
            </DataTable>
          </TabPanel>
        </TabView>
      </div>

      <Dialog visible={showTargetDialog} onHide={() => setShowTargetDialog(false)} header={t('agent.target_dialog', { defaultValue: 'Thiết lập KPI Tháng cho Đại lý' })} style={{ width: '32rem' }} modal className="p-fluid">
        <div className="flex flex-column gap-3">
          <div className="grid">
            <div className="col-6 field m-0">
              <label className="text-sm font-medium">{t('agent.role', { defaultValue: 'Cấp Bậc' })}</label>
              <Dropdown value={targetForm.roleType} options={[{ label: 'AGENT', value: AgentRoleType.AGENT }, { label: 'SUPER_AGENT', value: AgentRoleType.SUPER_AGENT }]} onChange={(e) => setTargetForm({ ...targetForm, roleType: e.value })} appendTo="self" />
            </div>
            <div className="col-6 field m-0">
              <label className="text-sm font-medium">{t('agent.period', { defaultValue: 'Kỳ Tháng' })}</label>
              <InputText value={targetForm.month} onChange={(e) => setTargetForm({ ...targetForm, month: e.target.value })} className="font-mono" />
            </div>
          </div>
          <div className="grid">
            <div className="col-6 field m-0">
              <label className="text-sm font-medium">Chỉ tiêu KH eKYC</label>
              <InputNumber value={targetForm.targetCustomers} onValueChange={(e) => setTargetForm({ ...targetForm, targetCustomers: e.value || 100 })} min={1} />
            </div>
            <div className="col-6 field m-0">
              <label className="text-sm font-medium">Thưởng đạt KPI (HTG)</label>
              <InputNumber value={targetForm.rewardAmount} onValueChange={(e) => setTargetForm({ ...targetForm, rewardAmount: e.value || 0 })} min={0} />
            </div>
          </div>
          {targetForm.roleType === AgentRoleType.SUPER_AGENT && (
            <div className="field m-0">
              <label className="text-sm font-medium">Tỷ lệ Đại lý đạt KPI tối thiểu (%)</label>
              <InputNumber value={targetForm.minQualifiedNetworkPercent ?? 50} onValueChange={(e) => setTargetForm({ ...targetForm, minQualifiedNetworkPercent: e.value || 50 })} min={1} max={100} />
            </div>
          )}
        </div>
        <div className="flex justify-content-end gap-2 mt-4">
          <Button label={t('common.cancel', { defaultValue: 'Hủy' })} outlined onClick={() => setShowTargetDialog(false)} />
          <Button label={t('common.save', { defaultValue: 'Lưu KPI' })} icon="pi pi-check" onClick={handleSaveTarget} loading={submitting} />
        </div>
      </Dialog>

      <Dialog visible={showPlaybookDialog} onHide={() => setShowPlaybookDialog(false)} header={t('agent.playbook_dialog', { defaultValue: 'Biên tập Playbook Hỗ trợ Đại lý' })} style={{ width: '40rem' }} modal className="p-fluid">
        <div className="flex flex-column gap-3">
          <div className="grid">
            <div className="col-6 field m-0">
              <label className="text-sm font-medium">Mã Playbook *</label>
              <InputText value={playbookForm.playbookCode || ''} onChange={(e) => setPlaybookForm({ ...playbookForm, playbookCode: e.target.value.toUpperCase() })} className="font-mono" />
            </div>
            <div className="col-6 field m-0">
              <label className="text-sm font-medium">Đối tượng</label>
              <Dropdown value={playbookForm.category} options={[{ label: 'AGENT', value: AgentRoleType.AGENT }, { label: 'SUPER_AGENT', value: AgentRoleType.SUPER_AGENT }]} onChange={(e) => setPlaybookForm({ ...playbookForm, category: e.value })} appendTo="self" />
            </div>
          </div>
          <div className="field m-0">
            <label className="text-sm font-medium">Tiêu đề *</label>
            <InputText value={playbookForm.title || ''} onChange={(e) => setPlaybookForm({ ...playbookForm, title: e.target.value })} />
          </div>
          <div className="field m-0">
            <label className="text-sm font-medium">Tóm tắt</label>
            <InputText value={playbookForm.summary || ''} onChange={(e) => setPlaybookForm({ ...playbookForm, summary: e.target.value })} />
          </div>
          <div className="field m-0">
            <label className="text-sm font-medium">Nội dung hướng dẫn</label>
            <InputTextarea rows={5} value={playbookForm.stepsMarkdown || ''} onChange={(e) => setPlaybookForm({ ...playbookForm, stepsMarkdown: e.target.value })} />
          </div>
        </div>
        <div className="flex justify-content-end gap-2 mt-4">
          <Button label={t('common.cancel', { defaultValue: 'Hủy' })} outlined onClick={() => setShowPlaybookDialog(false)} />
          <Button label={t('common.save', { defaultValue: 'Lưu Playbook' })} icon="pi pi-check" onClick={handleSavePlaybook} loading={submitting} />
        </div>
      </Dialog>
    </div>
  );
};

export default AgentLoyaltyManagementPage;
