import { getStoredTenantId } from '@/utils/tenant';
import React, { useState, useEffect, useCallback } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { ProgressBar } from 'primereact/progressbar';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { paths } from '@/paths';
import { AppBreadcrumb } from 'components';
import { TenantSelector } from '@/components/TenantSelector';
import { CommonStatus, PointActionType, TransactionStatus } from '@/models';
import {
  LoyaltyService,
  DashboardStatsModel,
  PointLedgerItem,
  MilestoneItemModel,
  SystemComponentHealthModel,
} from '@/service/loyalty.service';

export const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [selectedTenant, setSelectedTenant] = useState<string>('ALL');
  const [loading, setLoading] = useState(false);
  const [healthLoading, setHealthLoading] = useState(false);
  const [showSystemHealth, setShowSystemHealth] = useState(false);

  const [stats, setStats] = useState<DashboardStatsModel>({
    totalMembers: 0,
    activeMembers: 0,
    totalEarnedPoints: 0,
    totalBurnedPoints: 0,
    activeVouchers: 0,
    totalTransactions: 0,
    clearingSettledAmount: 0,
    uptimePercent: 100.0,
    tierDistributions: [],
  });

  const [recentTransactions, setRecentTransactions] = useState<PointLedgerItem[]>([]);
  const [campaigns, setCampaigns] = useState<MilestoneItemModel[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemComponentHealthModel[]>([]);

  const handleTenantChange = (tenant: string) => {
    setSelectedTenant(tenant);
  };

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsData, ledgerData, milestonesData] = await Promise.all([
        LoyaltyService.getDashboardStats(selectedTenant),
        LoyaltyService.getPointLedger(selectedTenant),
        LoyaltyService.getMilestones(selectedTenant),
      ]);

      if (statsData) {
        setStats(statsData);
      }

      const ledgerList = Array.isArray(ledgerData) ? ledgerData : ((ledgerData as any)?.items || []);
      setRecentTransactions(ledgerList.slice(0, 6));

      if (Array.isArray(milestonesData)) {
        setCampaigns(milestonesData.slice(0, 3));
      }
    } catch (e) {
      console.error('[Dashboard.fetchData] Error:', e);
    }
    setLoading(false);
  }, [selectedTenant]);

  const fetchSystemHealth = useCallback(async () => {
    setHealthLoading(true);
    try {
      const res = await LoyaltyService.getSystemHealth(selectedTenant);
      if (res && Array.isArray(res.components)) {
        setSystemHealth(res.components);
      }
    } catch (e) {
      console.error('[Dashboard.fetchHealth] Error:', e);
    }
    setHealthLoading(false);
  }, [selectedTenant]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    if (showSystemHealth && systemHealth.length === 0) {
      fetchSystemHealth();
    }
  }, [showSystemHealth, systemHealth.length, fetchSystemHealth]);

  const getTierColors = (level: number) => {
    switch (level) {
      case 1:
        return { barColor: '#94a3b8', dotColor: '#94a3b8', textColor: '#475569' };
      case 2:
        return { barColor: '#3b82f6', dotColor: '#3b82f6', textColor: '#1d4ed8' };
      case 3:
        return { barColor: '#f59e0b', dotColor: '#f59e0b', textColor: '#b45309' };
      case 4:
      default:
        return { barColor: '#06b6d4', dotColor: '#06b6d4', textColor: '#0e7490' };
    }
  };

  const getTargetMetricText = (metric?: string, value?: number) => {
    const val = Number(value || 0).toLocaleString();
    switch (metric) {
      case 'BILL_AMOUNT':
        return `${t('dashboard.metric_bill')} ${val} HTG`;
      case 'TRANSACTION_COUNT':
        return `${t('dashboard.metric_tx_count')} ${val} ${t('dashboard.unit_times')}`;
      case 'EARN_POINTS':
        return `${t('dashboard.metric_points')} ${val} ${t('common.points')}`;
      case 'GAME_SPINS':
        return `${t('dashboard.metric_spins')} ${val} ${t('common.spins')}`;
      default:
        return val ? `${val} ${metric || ''}` : '-';
    }
  };

  const getRewardSummary = (camp: MilestoneItemModel) => {
    const rewards: string[] = [];
    if (camp.rewardPoints && camp.rewardPoints > 0) {
      rewards.push(`+${camp.rewardPoints.toLocaleString()} ${t('common.points')}`);
    }
    if (camp.rewardGameTurns && camp.rewardGameTurns > 0) {
      rewards.push(`+${camp.rewardGameTurns} ${t('common.spins')}`);
    }
    if (camp.rewardVoucherId) {
      rewards.push(`+1 ${t('dashboard.reward_voucher_label')}`);
    }
    if (rewards.length === 0) {
      return t('dashboard.default_reward');
    }
    return rewards.join(' • ');
  };

  const actionTypeBodyTemplate = (rowData: PointLedgerItem) => {
    switch (rowData.actionType) {
      case 'EARN':
        return <Tag severity="success" value={t('action_type.earn')} />;
      case 'BURN':
        return <Tag severity="danger" value={t('action_type.burn')} />;
      case 'REWARD':
        return <Tag severity="info" value={t('action_type.reward')} />;
      case 'SPIN':
        return <Tag severity="warning" value={t('action_type.spin')} />;
      case 'VOUCHER':
        return <Tag severity="info" value={t('action_type.voucher')} />;
      default:
        return <Tag severity="secondary" value={rowData.actionType || t('common.actions')} />;
    }
  };

  const pointsBodyTemplate = (rowData: PointLedgerItem) => {
    const isPositive =
      rowData.actionType === PointActionType.EARN ||
      rowData.actionType === PointActionType.REWARD ||
      rowData.actionType === PointActionType.SPIN;
    return (
      <span className={`font-semibold ${isPositive ? 'text-green-600' : 'text-orange-600'}`}>
        {isPositive ? `+${rowData.points}` : `-${rowData.points}`} {t('common.points')}
      </span>
    );
  };

  const statusBodyTemplate = (row: PointLedgerItem) => {
    const status = (row.status || TransactionStatus.SUCCESS).toUpperCase();
    if (status === TransactionStatus.SUCCESS) {
      return <Tag severity="success" value={t('common.success')} />;
    }
    if (status === TransactionStatus.PENDING) {
      return <Tag severity="warning" value={t('common.pending')} />;
    }
    if (status === TransactionStatus.FAILED) {
      return <Tag severity="danger" value={t('common.failed')} />;
    }
    return <Tag severity="secondary" value={status} />;
  };

  const dateTemplate = (rowData: PointLedgerItem) => {
    if (!rowData.createdAt) return '-';
    try {
      const d = new Date(rowData.createdAt);
      if (isNaN(d.getTime())) return rowData.createdAt;
      return d.toLocaleString();
    } catch {
      return rowData.createdAt;
    }
  };

  return (
    <div className="grid">
      <div className="col-12 flex flex-wrap justify-content-between align-items-center mb-2 gap-2">
        <AppBreadcrumb items={[{ label: t('dashboard.title') }]} />
        <div className="flex align-items-center gap-3">
          {/* Scalable Tenant / Partner Dropdown */}
          <TenantSelector value={selectedTenant} onChange={handleTenantChange} />

          {/* Toggle Infrastructure Health Widget */}
          <Button
            icon={showSystemHealth ? 'pi pi-shield' : 'pi pi-server'}
            rounded
            text
            size="small"
            severity={showSystemHealth ? 'warning' : 'secondary'}
            onClick={() => setShowSystemHealth(!showSystemHealth)}
            tooltip={
              showSystemHealth
                ? t('dashboard.toggle_infra_hide')
                : t('dashboard.toggle_infra_show')
            }
            className="p-button-sm opacity-60 hover:opacity-100"
          />
        </div>
      </div>

      {/* 4 Core KPI Cards */}
      <div className="col-12 md:col-6 lg:col-3">
        <div
          className="surface-card p-4 border-round-2xl transition-all transition-duration-200 hover:shadow-4"
          style={{
            border: '1px solid rgba(226, 232, 240, 0.9)',
            borderLeft: '4px solid #2563eb',
            background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
            boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.06)',
          }}
        >
          <div className="flex justify-content-between align-items-start mb-3">
            <div>
              <span className="block text-600 font-semibold text-sm mb-2">
                {t('dashboard.total_members')}
              </span>
              <div className="text-900 font-extrabold text-3xl line-height-1">
                {(stats.totalMembers || 0).toLocaleString()}
              </div>
            </div>
            <div
              className="flex align-items-center justify-content-center border-round-xl flex-shrink-0"
              style={{
                width: '3.4rem',
                height: '3.4rem',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                boxShadow: '0 8px 18px -3px rgba(37, 99, 235, 0.45)',
              }}
            >
              <i className="pi pi-users text-white text-2xl" />
            </div>
          </div>
          <div className="flex align-items-center gap-2 pt-2 border-top-1 surface-border">
            <i className="pi pi-check-circle text-emerald-600 text-xs font-bold" />
            <span className="text-xs font-medium text-emerald-600">
              {t('dashboard.active_members_info', {
                count: stats.activeMembers || 0
              })}
            </span>
          </div>
        </div>
      </div>

      <div className="col-12 md:col-6 lg:col-3">
        <div
          className="surface-card p-4 border-round-2xl transition-all transition-duration-200 hover:shadow-4"
          style={{
            border: '1px solid rgba(226, 232, 240, 0.9)',
            borderLeft: '4px solid #10b981',
            background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
            boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.06)',
          }}
        >
          <div className="flex justify-content-between align-items-start mb-3">
            <div>
              <span className="block text-600 font-semibold text-sm mb-2">
                {t('dashboard.points_issued')}
              </span>
              <div className="text-900 font-extrabold text-3xl line-height-1">
                {(stats.totalEarnedPoints || 0).toLocaleString()}
              </div>
            </div>
            <div
              className="flex align-items-center justify-content-center border-round-xl flex-shrink-0"
              style={{
                width: '3.4rem',
                height: '3.4rem',
                background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
                boxShadow: '0 8px 18px -3px rgba(16, 185, 129, 0.45)',
              }}
            >
              <i className="pi pi-star-fill text-white text-2xl" />
            </div>
          </div>
          <div className="flex align-items-center gap-2 pt-2 border-top-1 surface-border">
            <i className="pi pi-check-circle text-emerald-600 text-xs" />
            <span className="text-xs font-normal text-600">
              {t('dashboard.exchange_rate_info', {
                amount: (stats.totalEarnedPoints || 0).toLocaleString()
              })}
            </span>
          </div>
        </div>
      </div>

      <div className="col-12 md:col-6 lg:col-3">
        <div
          className="surface-card p-4 border-round-2xl transition-all transition-duration-200 hover:shadow-4"
          style={{
            border: '1px solid rgba(226, 232, 240, 0.9)',
            borderLeft: '4px solid #f59e0b',
            background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
            boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.06)',
          }}
        >
          <div className="flex justify-content-between align-items-start mb-3">
            <div>
              <span className="block text-600 font-semibold text-sm mb-2">
                {t('dashboard.points_redeemed')}
              </span>
              <div className="text-900 font-extrabold text-3xl line-height-1">
                {Math.abs(stats.totalBurnedPoints || 0).toLocaleString()}
              </div>
            </div>
            <div
              className="flex align-items-center justify-content-center border-round-xl flex-shrink-0"
              style={{
                width: '3.4rem',
                height: '3.4rem',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                boxShadow: '0 8px 18px -3px rgba(245, 158, 11, 0.45)',
              }}
            >
              <i className="pi pi-shopping-cart text-white text-2xl" />
            </div>
          </div>
          <div className="flex align-items-center gap-2 pt-2 border-top-1 surface-border">
            <i className="pi pi-percentage text-amber-600 text-xs" />
            <span className="text-xs font-normal text-amber-700">
              {t('dashboard.clearing_settled_info', {
                amount: (stats.clearingSettledAmount || 0).toLocaleString()
              })}
            </span>
          </div>
        </div>
      </div>

      <div className="col-12 md:col-6 lg:col-3">
        <div
          className="surface-card p-4 border-round-2xl transition-all transition-duration-200 hover:shadow-4"
          style={{
            border: '1px solid rgba(226, 232, 240, 0.9)',
            borderLeft: '4px solid #8b5cf6',
            background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
            boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.06)',
          }}
        >
          <div className="flex justify-content-between align-items-start mb-3">
            <div>
              <span className="block text-600 font-semibold text-sm mb-2">
                {t('dashboard.active_vouchers')}
              </span>
              <div className="text-900 font-extrabold text-3xl line-height-1 flex align-items-baseline gap-2">
                <span>{(stats.activeVouchers || 0).toLocaleString()}</span>
                <span className="text-base font-semibold text-500">
                  {t('dashboard.voucher_unit')}
                </span>
              </div>
            </div>
            <div
              className="flex align-items-center justify-content-center border-round-xl flex-shrink-0"
              style={{
                width: '3.4rem',
                height: '3.4rem',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                boxShadow: '0 8px 18px -3px rgba(139, 92, 246, 0.45)',
              }}
            >
              <i className="pi pi-ticket text-white text-2xl" />
            </div>
          </div>
          <div className="flex align-items-center gap-2 pt-2 border-top-1 surface-border">
            <i className="pi pi-bolt text-purple-600 text-xs" />
            <span className="text-xs font-normal text-purple-700">
              {t('dashboard.total_txs_info', {
                count: stats.totalTransactions || 0
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Dynamic Tier Distribution Card */}
      <div className={showSystemHealth ? 'col-12 lg:col-4' : 'col-12 lg:col-6'}>
        <Card title={t('dashboard.tier_distribution')} className="h-full shadow-2 border-round-2xl">
          <div className="flex flex-column gap-4">
            {stats.tierDistributions && stats.tierDistributions.length > 0 ? (
              stats.tierDistributions.map((tier) => {
                const colors = getTierColors(tier.tierLevel);
                return (
                  <div key={tier.tierId || tier.tierCode}>
                    <div className="flex justify-content-between mb-1">
                      <span className="font-semibold text-sm flex align-items-center gap-2" style={{ color: colors.textColor }}>
                        <i className="pi pi-circle-fill text-xs" style={{ color: colors.dotColor }} />
                        {tier.tierName || tier.tierCode} ({tier.pointMultiplier}x)
                      </span>
                      <span className="text-sm font-medium text-slate-800">
                        {tier.memberCount.toLocaleString()} {t('dashboard.member_count_unit')} ({tier.percentage}%)
                      </span>
                    </div>
                    <ProgressBar
                      value={Number(tier.percentage) || 0}
                      showValue={false}
                      style={{ height: '8px' }}
                      color={colors.barColor}
                    />
                  </div>
                );
              })
            ) : (
              <div className="text-center py-4 text-500 text-sm">
                <i className="pi pi-info-circle mr-2" />
                {t('dashboard.no_tiers_configured')}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-top-1 surface-border flex justify-content-between align-items-center">
            <span className="text-xs text-500">{t('dashboard.evaluation_cycle')}</span>
            <Button
              label={t('dashboard.view_tier_config')}
              text
              size="small"
              onClick={() => navigate(paths.tierManagement)}
            />
          </div>
        </Card>
      </div>

      {/* Dynamic Featured Campaigns */}
      <div className={showSystemHealth ? 'col-12 lg:col-4' : 'col-12 lg:col-6'}>
        <Card
          title={t('dashboard.top_campaigns')}
          className="h-full shadow-2 border-round-2xl"
        >
          <div className="flex flex-column gap-3">
            {campaigns && campaigns.length > 0 ? (
              campaigns.map((camp) => (
                <div key={camp.id || `${camp.campaignCode}_${camp.milestoneStep}`} className="p-3 surface-ground border-round-xl border-1 surface-border">
                  <div className="flex justify-content-between align-items-start mb-2">
                    <div>
                      <div className="flex align-items-center gap-2 mb-1">
                        <span className="font-semibold text-sm text-900 block">{camp.campaignName || camp.campaignCode}</span>
                        <Tag
                          severity="info"
                          value={t('dashboard.step_prefix', { step: camp.milestoneStep || 1 })}
                          className="text-xs"
                        />
                      </div>
                      <span className="text-xs text-600">
                        <span className="font-medium text-500">{t('dashboard.target_label')}</span>{' '}
                        {getTargetMetricText(camp.targetMetric, camp.targetValue)}
                      </span>
                    </div>
                    <Tag
                      severity={camp.status === CommonStatus.ACTIVE ? 'success' : 'secondary'}
                      value={camp.status === CommonStatus.ACTIVE ? t('common.active') : t('common.inactive')}
                    />
                  </div>
                  <div className="text-xs text-blue-700 font-medium flex align-items-center gap-1">
                    <i className="pi pi-gift text-amber-500" />
                    <span>
                      <span className="font-medium text-500">{t('dashboard.reward_label')}</span>{' '}
                      {getRewardSummary(camp)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <i className="pi pi-calendar-times text-400 text-3xl mb-2" />
                <p className="text-500 text-sm m-0 mb-3">
                  {t('dashboard.no_campaigns')}
                </p>
                <Button
                  label={t('dashboard.create_campaign_cta')}
                  size="small"
                  outlined
                  onClick={() => navigate(paths.campaignMilestones)}
                />
              </div>
            )}
          </div>
          <div className="mt-3 text-right">
            <Button
              label={t('dashboard.manage_campaigns')}
              icon="pi pi-arrow-right"
              iconPos="right"
              text
              size="small"
              onClick={() => navigate(paths.campaignMilestones)}
            />
          </div>
        </Card>
      </div>

      {/* Real-time Microservices & Infrastructure Health */}
      {showSystemHealth && (
        <div className="col-12 lg:col-4">
          <Card
            title={
              <div className="flex align-items-center justify-content-between">
                <span className="font-bold text-xl">
                  {t('dashboard.services_status')}
                </span>
                <Button
                  icon="pi pi-refresh"
                  rounded
                  text
                  size="small"
                  loading={healthLoading}
                  onClick={fetchSystemHealth}
                  tooltip={t('dashboard.refresh_status')}
                />
              </div>
            }
            className="h-full shadow-2 border-round-2xl"
          >
            <ul className="list-none p-0 m-0">
              {systemHealth.map((service, idx) => (
                <li
                  key={service.componentId}
                  className={`flex align-items-center justify-content-between py-2 ${
                    idx < systemHealth.length - 1 ? 'border-bottom-1 surface-border' : ''
                  }`}
                >
                  <div className="flex align-items-center gap-2">
                    <div
                      className="flex align-items-center justify-content-center border-round-lg flex-shrink-0"
                      style={{
                        width: '2.2rem',
                        height: '2.2rem',
                        background: service.color
                          ? `linear-gradient(135deg, ${service.color} 0%, ${service.color}dd 100%)`
                          : '#3b82f6',
                      }}
                    >
                      <i className={`pi ${service.icon || 'pi-server'} text-white text-sm`} />
                    </div>
                    <div>
                      <div className="font-medium text-900 text-xs line-height-1">{service.displayName}</div>
                      <div className="text-500 text-xs mt-1 font-mono">
                        {t('dashboard.port_label')} {service.port}
                      </div>
                    </div>
                  </div>
                  <div className="flex align-items-center gap-2">
                    <span className="text-500 text-xs font-mono">{service.responseTimeMs}ms</span>
                    <Tag severity={service.status === 'UP' ? 'success' : 'danger'} value={service.status} />
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {/* Recent Point Ledger Activity Table */}
      <div className="col-12">
        <Card
          title={t('dashboard.recent_transactions')}
          className="shadow-2 border-round-2xl"
        >
          <DataTable
            value={recentTransactions}
            loading={loading}
            emptyMessage={t('common.no_data')}
            responsiveLayout="scroll"
          >
            <Column
              header={t('common.order_number', 'STT')}
              body={(_, opt) => opt.rowIndex + 1}
              style={{ width: '4rem', textAlign: 'center' }}
            />
            <Column
              field="transactionId"
              header={t('dashboard.tx_code')}
              body={(row: PointLedgerItem) => (
                <span className="font-bold font-mono text-900 text-xs">{row.transactionId}</span>
              )}
            />
            <Column
              field="partnerCode"
              header={t('dashboard.partner_pos')}
              body={(row: PointLedgerItem) => (
                <span className="text-900 text-sm">{row.partnerCode || selectedTenant}</span>
              )}
            />
            <Column
              field="externalUserId"
              header={t('dashboard.customer_id')}
              body={(row: PointLedgerItem) => (
                <span className="text-900 font-mono text-xs">{row.externalUserId}</span>
              )}
            />
            <Column header={t('dashboard.action')} body={actionTypeBodyTemplate} />
            <Column header={t('dashboard.points_delta')} body={pointsBodyTemplate} />
            <Column
              field="createdAt"
              header={t('dashboard.time')}
              body={dateTemplate}
            />
            <Column
              field="status"
              header={t('dashboard.status')}
              body={statusBodyTemplate}
            />
          </DataTable>
          <div className="mt-3 flex flex-wrap justify-content-between align-items-center gap-2">
            <span className="text-xs text-500">
              {t('dashboard.sync_note')}
            </span>
            <div className="flex align-items-center gap-2">
              <Button
                label={t('dashboard.view_clearing_report')}
                icon="pi pi-chart-line"
                text
                size="small"
                onClick={() => navigate(paths.clearingSettlement)}
              />
              <Button
                label={t('dashboard.view_all_transactions')}
                icon="pi pi-external-link"
                text
                size="small"
                onClick={() => navigate(paths.transactions)}
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
