import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { AgentKpiRewardStatus, AgentRoleType } from '@/models';
import {
  LoyaltyService,
  AgentLoyaltyItemModel,
  SupportPlaybookModel,
  AgentTargetConfigModel,
} from '@/service/loyalty.service';
import { StandardPageHeader } from '@/components/StandardPageHeader';
import { UniversalFilterBar } from '@/components/UniversalFilterBar';
import { StandardRowActions } from '@/components/StandardRowActions';
import { exportToExcel } from '@/components/exportHelper';

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
  const [keyword, setKeyword] = useState('');
  const [playbookKeyword, setPlaybookKeyword] = useState('');

  const [showTargetDialog, setShowTargetDialog] = useState(false);
  const [targetForm, setTargetForm] = useState<AgentTargetConfigModel>({
    roleType: AgentRoleType.AGENT,
    month: new Date().toISOString().substring(0, 7),
    targetCustomers: undefined,
    rewardAmount: undefined,
    minQualifiedNetworkPercent: undefined,
  });

  const [showPlaybookDialog, setShowPlaybookDialog] = useState(false);
  const [playbookForm, setPlaybookForm] = useState<Partial<SupportPlaybookModel>>({});
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [agentList, pbList] = await Promise.all([
        LoyaltyService.getAdminAgents(
          { roleType: roleFilter !== 'ALL' ? roleFilter : undefined },
          selectedTenant
        ),
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
      toast.current?.show({
        severity: 'success',
        summary: t('common.success'),
        detail: t('agent.target_saved'),
      });
      setShowTargetDialog(false);
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

  const handleApproveReward = async (agent: AgentLoyaltyItemModel) => {
    try {
      await LoyaltyService.approveAgentReward(agent.id, agent.month, selectedTenant);
      toast.current?.show({
        severity: 'success',
        summary: t('common.success'),
        detail: agent.agentCode,
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

  const handleSavePlaybook = async () => {
    if (!playbookForm.playbookCode?.trim() || !playbookForm.title?.trim()) {
      toast.current?.show({
        severity: 'warn',
        summary: t('common.warn'),
        detail: t('agent.playbook_required'),
      });
      return;
    }
    setSubmitting(true);
    try {
      await LoyaltyService.saveAgentPlaybook(
        playbookForm as SupportPlaybookModel,
        selectedTenant
      );
      toast.current?.show({
        severity: 'success',
        summary: t('common.success'),
        detail: t('agent.playbook_saved'),
      });
      setShowPlaybookDialog(false);
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

  const filteredAgents = useMemo(() => {
    if (!keyword.trim()) return agents;
    const kw = keyword.toLowerCase();
    return agents.filter(
      (a) =>
        a.agentCode?.toLowerCase().includes(kw) ||
        a.agentName?.toLowerCase().includes(kw) ||
        a.month?.toLowerCase().includes(kw)
    );
  }, [agents, keyword]);

  const filteredPlaybooks = useMemo(() => {
    if (!playbookKeyword.trim()) return playbooks;
    const kw = playbookKeyword.toLowerCase();
    return playbooks.filter(
      (p) =>
        p.playbookCode?.toLowerCase().includes(kw) ||
        p.title?.toLowerCase().includes(kw) ||
        p.summary?.toLowerCase().includes(kw)
    );
  }, [playbooks, playbookKeyword]);

  const handleExportAgents = () => {
    exportToExcel(
      filteredAgents,
      [
        { header: t('agent.code'), field: 'agentCode' },
        { header: t('agent.name'), field: 'agentName' },
        { header: t('agent.role'), field: 'roleType' },
        { header: t('agent.period'), field: 'month' },
        { header: t('agent.bonus'), field: 'rewardAmount' },
        { header: t('common.status'), field: 'rewardStatus' },
      ],
      'dai_ly_loyalty'
    );
  };

  const handleExportPlaybooks = () => {
    exportToExcel(
      filteredPlaybooks,
      [
        { header: t('agent.playbook_code'), field: 'playbookCode' },
        { header: t('agent.playbook_title'), field: 'title' },
        { header: t('agent.target_audience'), field: 'category' },
        { header: t('agent.playbook_summary'), field: 'summary' },
      ],
      'so_tay_ho_tro_dai_ly'
    );
  };

  return (
    <div className="w-full">
      <Toast ref={toast} />
      <AppBreadcrumb items={[{ label: t('nav.agent_loyalty') }]} />

      <StandardPageHeader
        title={t('agent.title')}
        subtitle={t('agent.subtitle')}
        primaryAction={{
          label: t('agent.set_target', 'Thiết lập mục tiêu'),
          icon: 'pi pi-sliders-h',
          onClick: () => setShowTargetDialog(true),
        }}
        extraLeft={<TenantSelector value={selectedTenant} onChange={setSelectedTenant} />}
        onRefresh={fetchAll}
        refreshLoading={loading}
      />

      <div className="card shadow-1 border-round surface-card p-4">
        <TabView>
          <TabPanel header={t('agent.tab_performance')}>
            <UniversalFilterBar
              keyword={keyword}
              onKeywordChange={setKeyword}
              searchPlaceholder={t('common.search')}
              primaryFilters={
                <Dropdown
                  value={roleFilter}
                  options={[
                    { label: `${t('agent.role')}: ${t('common.all')}`, value: 'ALL' },
                    { label: t('enum.agent_role.AGENT'), value: AgentRoleType.AGENT },
                    { label: t('enum.agent_role.SUPER_AGENT'), value: AgentRoleType.SUPER_AGENT },
                  ]}
                  onChange={(e) => setRoleFilter(e.value)}
                  className="w-14rem"
                />
              }
              onReset={() => {
                setKeyword('');
                setRoleFilter('ALL');
              }}
              onExport={handleExportAgents}
            />

            {loading ? (
              <div className="flex flex-column gap-2 mt-3">
                <Skeleton height="2.75rem" />
                <Skeleton height="2.75rem" />
              </div>
            ) : (
              <DataTable<AgentLoyaltyItemModel[]>
                value={filteredAgents}
                paginator
                rows={10}
                stripedRows
                responsiveLayout="scroll"
                emptyMessage={t('agent.empty')}
                className="mt-3"
              >
                <Column
                  header={t('common.order_number', 'STT')}
                  body={(_, opt) => opt.rowIndex + 1}
                  style={{ width: '4rem', textAlign: 'center' }}
                />
                <Column
                  header={t('common.action', 'Thao tác')}
                  body={(r: AgentLoyaltyItemModel) => (
                    <StandardRowActions
                      actions={
                        r.rewardStatus === AgentKpiRewardStatus.ELIGIBLE
                          ? [
                              {
                                icon: 'pi pi-check',
                                label: t('approval.approve_btn', 'Duyệt thưởng'),
                                onClick: () => handleApproveReward(r),
                              },
                            ]
                          : []
                      }
                    />
                  )}
                  style={{ width: '7rem', textAlign: 'center' }}
                />
                <Column
                  field="agentCode"
                  header={t('agent.code')}
                  body={(r: AgentLoyaltyItemModel) => (
                    <span className="font-bold font-mono text-900">{r.agentCode}</span>
                  )}
                  style={{ minWidth: '10rem' }}
                />
                <Column
                  field="agentName"
                  header={t('agent.name')}
                  body={(r: AgentLoyaltyItemModel) => (
                    <span className="text-900">{r.agentName}</span>
                  )}
                  style={{ minWidth: '14rem' }}
                />
                <Column
                  field="roleType"
                  header={t('agent.role')}
                  body={(r: AgentLoyaltyItemModel) => (
                    <span className="text-900 text-sm">
                      {r.roleType ? t(`enum.agent_role.${r.roleType}`) : ''}
                    </span>
                  )}
                  style={{ minWidth: '9rem' }}
                />
                <Column
                  field="month"
                  header={t('agent.period')}
                  body={(r: AgentLoyaltyItemModel) => (
                    <span className="text-900 font-mono text-sm">{r.month}</span>
                  )}
                  style={{ minWidth: '6.5rem' }}
                />
                <Column
                  header={t('agent.progress')}
                  body={(r: AgentLoyaltyItemModel) => {
                    const pct =
                      r.roleType === AgentRoleType.SUPER_AGENT
                        ? Number(r.subAgentsQualifiedPercent || 0)
                        : r.targetCustomers > 0
                        ? Math.min(100, (Number(r.ekycNewCustomers || 0) / r.targetCustomers) * 100)
                        : 0;
                    return (
                      <div className="flex flex-column gap-1">
                        <span className="text-xs font-mono text-900">
                          {r.roleType === AgentRoleType.SUPER_AGENT
                            ? t('agent.super_agent_progress', {
                                percent: Number(r.subAgentsQualifiedPercent || 0).toFixed(1),
                              })
                            : t('agent.ekyc_progress', {
                                current: r.ekycNewCustomers,
                                target: r.targetCustomers,
                              })}
                        </span>
                        <ProgressBar value={Number(pct.toFixed(0))} showValue={false} style={{ height: '6px' }} />
                      </div>
                    );
                  }}
                  style={{ minWidth: '13rem' }}
                />
                <Column
                  field="rewardAmount"
                  header={t('agent.bonus')}
                  body={(r: AgentLoyaltyItemModel) => (
                    <span className="text-900 font-mono">
                      {Number(r.rewardAmount || 0).toLocaleString()} {r.rewardCurrency || 'HTG'}
                    </span>
                  )}
                  style={{ minWidth: '9rem', textAlign: 'right' }}
                />
                <Column
                  field="rewardStatus"
                  header={t('common.status')}
                  body={(r: AgentLoyaltyItemModel) => (
                    <Tag
                      value={t(`enum.agent_kpi_reward_status.${r.rewardStatus}`)}
                      severity={
                        r.rewardStatus === AgentKpiRewardStatus.APPROVED ||
                        r.rewardStatus === AgentKpiRewardStatus.PAID
                          ? 'success'
                          : 'warning'
                      }
                    />
                  )}
                  style={{ minWidth: '8.5rem', textAlign: 'center' }}
                />
              </DataTable>
            )}
          </TabPanel>

          <TabPanel header={t('agent.tab_playbooks', { count: playbooks.length })}>
            <div className="flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
              <UniversalFilterBar
                keyword={playbookKeyword}
                onKeywordChange={setPlaybookKeyword}
                searchPlaceholder={t('common.search')}
                onReset={() => setPlaybookKeyword('')}
                onExport={handleExportPlaybooks}
              />
              <Button
                label={t('common.create', 'Thêm mới')}
                icon="pi pi-plus"
                size="small"
                onClick={() => {
                  setPlaybookForm({
                    playbookCode: '',
                    title: '',
                    category: AgentRoleType.AGENT,
                    summary: '',
                    stepsMarkdown: '',
                  });
                  setShowPlaybookDialog(true);
                }}
              />
            </div>

            <DataTable<SupportPlaybookModel[]>
              value={filteredPlaybooks}
              paginator
              rows={10}
              stripedRows
              responsiveLayout="scroll"
              emptyMessage={t('agent.no_playbooks')}
            >
              <Column
                header={t('common.order_number', 'STT')}
                body={(_, opt) => opt.rowIndex + 1}
                style={{ width: '4rem', textAlign: 'center' }}
              />
              <Column
                header={t('common.action', 'Thao tác')}
                body={(r: SupportPlaybookModel) => (
                  <StandardRowActions
                    onEdit={() => {
                      setPlaybookForm(r);
                      setShowPlaybookDialog(true);
                    }}
                  />
                )}
                style={{ width: '6rem', textAlign: 'center' }}
              />
              <Column
                field="playbookCode"
                header={t('agent.playbook_code')}
                body={(r: SupportPlaybookModel) => (
                  <span className="font-bold font-mono text-900">{r.playbookCode}</span>
                )}
                style={{ minWidth: '10rem' }}
              />
              <Column
                field="title"
                header={t('agent.playbook_title')}
                body={(r: SupportPlaybookModel) => <span className="text-900">{r.title}</span>}
                style={{ minWidth: '15rem' }}
              />
              <Column
                field="category"
                header={t('agent.target_audience')}
                body={(r: SupportPlaybookModel) => (
                  <span className="text-900 text-sm">
                    {r.category ? t(`enum.agent_role.${r.category}`) : ''}
                  </span>
                )}
                style={{ minWidth: '9rem' }}
              />
              <Column
                field="summary"
                header={t('agent.playbook_summary')}
                body={(r: SupportPlaybookModel) => (
                  <span className="text-900 text-sm">{r.summary}</span>
                )}
                style={{ minWidth: '18rem' }}
              />
            </DataTable>
          </TabPanel>
        </TabView>
      </div>

      <Dialog
        visible={showTargetDialog}
        onHide={() => setShowTargetDialog(false)}
        header={t('agent.target_dialog')}
        style={{ width: '32rem' }}
        modal
        className="p-fluid"
      >
        <div className="flex flex-column gap-3">
          <div className="grid">
            <div className="col-6 field m-0">
              <label className="text-sm font-medium">{t('agent.role')}</label>
              <Dropdown
                value={targetForm.roleType}
                options={[
                  { label: t('enum.agent_role.AGENT'), value: AgentRoleType.AGENT },
                  { label: t('enum.agent_role.SUPER_AGENT'), value: AgentRoleType.SUPER_AGENT },
                ]}
                onChange={(e) => setTargetForm({ ...targetForm, roleType: e.value })}
                appendTo="self"
              />
            </div>
            <div className="col-6 field m-0">
              <label className="text-sm font-medium">{t('agent.period')}</label>
              <InputText
                value={targetForm.month}
                onChange={(e) => setTargetForm({ ...targetForm, month: e.target.value })}
                className="font-mono"
              />
            </div>
          </div>
          <div className="grid">
            <div className="col-6 field m-0">
              <label className="text-sm font-medium">{t('agent.target_ekyc_label')}</label>
              <InputNumber
                value={targetForm.targetCustomers ?? undefined}
                onValueChange={(e) =>
                  setTargetForm({ ...targetForm, targetCustomers: e.value ?? undefined })
                }
                min={1}
              />
            </div>
            <div className="col-6 field m-0">
              <label className="text-sm font-medium">{t('agent.reward_amount_label')}</label>
              <InputNumber
                value={targetForm.rewardAmount ?? undefined}
                onValueChange={(e) =>
                  setTargetForm({ ...targetForm, rewardAmount: e.value ?? undefined })
                }
                min={0}
              />
            </div>
          </div>
          {targetForm.roleType === AgentRoleType.SUPER_AGENT && (
            <div className="field m-0">
              <label className="text-sm font-medium">
                {t('agent.min_qualified_percent_label')}
              </label>
              <InputNumber
                value={targetForm.minQualifiedNetworkPercent ?? undefined}
                onValueChange={(e) =>
                  setTargetForm({
                    ...targetForm,
                    minQualifiedNetworkPercent: e.value ?? undefined,
                  })
                }
                min={1}
                max={100}
              />
            </div>
          )}
        </div>
        <div className="flex justify-content-end gap-2 mt-4">
          <Button label={t('common.cancel')} outlined onClick={() => setShowTargetDialog(false)} />
          <Button
            label={t('common.save')}
            icon="pi pi-check"
            onClick={handleSaveTarget}
            loading={submitting}
          />
        </div>
      </Dialog>

      <Dialog
        visible={showPlaybookDialog}
        onHide={() => setShowPlaybookDialog(false)}
        header={t('agent.playbook_dialog')}
        style={{ width: '38rem' }}
        modal
        className="p-fluid"
      >
        <div className="flex flex-column gap-3">
          <div className="grid">
            <div className="col-6 field m-0">
              <label className="text-sm font-medium">{t('agent.playbook_code')} *</label>
              <InputText
                value={playbookForm.playbookCode || ''}
                onChange={(e) =>
                  setPlaybookForm({ ...playbookForm, playbookCode: e.target.value.toUpperCase() })
                }
                className="font-mono"
              />
            </div>
            <div className="col-6 field m-0">
              <label className="text-sm font-medium">{t('agent.target_audience')}</label>
              <Dropdown
                value={playbookForm.category || AgentRoleType.AGENT}
                options={[
                  { label: t('enum.agent_role.AGENT'), value: AgentRoleType.AGENT },
                  { label: t('enum.agent_role.SUPER_AGENT'), value: AgentRoleType.SUPER_AGENT },
                ]}
                onChange={(e) => setPlaybookForm({ ...playbookForm, category: e.value })}
                appendTo="self"
              />
            </div>
          </div>
          <div className="field m-0">
            <label className="text-sm font-medium">{t('agent.playbook_title')} *</label>
            <InputText
              value={playbookForm.title || ''}
              onChange={(e) => setPlaybookForm({ ...playbookForm, title: e.target.value })}
            />
          </div>
          <div className="field m-0">
            <label className="text-sm font-medium">{t('agent.playbook_summary')}</label>
            <InputTextarea
              rows={2}
              value={playbookForm.summary || ''}
              onChange={(e) => setPlaybookForm({ ...playbookForm, summary: e.target.value })}
            />
          </div>
          <div className="field m-0">
            <label className="text-sm font-medium">{t('agent.playbook_steps')}</label>
            <InputTextarea
              rows={4}
              value={playbookForm.stepsMarkdown || ''}
              onChange={(e) => setPlaybookForm({ ...playbookForm, stepsMarkdown: e.target.value })}
            />
          </div>
        </div>
        <div className="flex justify-content-end gap-2 mt-4">
          <Button label={t('common.cancel')} outlined onClick={() => setShowPlaybookDialog(false)} />
          <Button
            label={t('common.save')}
            icon="pi pi-check"
            onClick={handleSavePlaybook}
            loading={submitting}
          />
        </div>
      </Dialog>
    </div>
  );
};

export default AgentLoyaltyManagementPage;
