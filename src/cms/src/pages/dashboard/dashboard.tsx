import React, { useState, useEffect } from 'react';
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

  const [selectedTenant, setSelectedTenant] = useState<string>(
    () => localStorage.getItem('selected_tenant_id') || 'TENANT_NATCASH'
  );
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
    try {
      localStorage.setItem('selected_tenant_id', tenant);
    } catch {
      // Ignore storage errors in restricted contexts
    }
  };

  const fetchDashboardData = async () => {
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
  };

  const fetchSystemHealth = async () => {
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
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedTenant]);

  useEffect(() => {
    if (showSystemHealth && systemHealth.length === 0) {
      fetchSystemHealth();
    }
  }, [showSystemHealth]);

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
        return `${t('dashboard.metric_bill', { defaultValue: 'Chi tiêu tích lũy' })} ${val} HTG`;
      case 'TRANSACTION_COUNT':
        return `${t('dashboard.metric_tx_count', { defaultValue: 'Số giao dịch' })} ${val} ${t('dashboard.unit_times', { defaultValue: 'lần' })}`;
      case 'EARN_POINTS':
        return `${t('dashboard.metric_points', { defaultValue: 'Điểm tích lũy' })} ${val} ${t('common.points', { defaultValue: 'điểm' })}`;
      case 'GAME_SPINS':
        return `${t('dashboard.metric_spins', { defaultValue: 'Lượt quay game' })} ${val} ${t('common.spins', { defaultValue: 'lượt' })}`;
      default:
        return val ? `${val} ${metric || ''}` : '-';
    }
  };

  const getRewardSummary = (camp: MilestoneItemModel) => {
    const rewards: string[] = [];
    if (camp.rewardPoints && camp.rewardPoints > 0) {
      rewards.push(`+${camp.rewardPoints.toLocaleString()} ${t('common.points', { defaultValue: 'Điểm' })}`);
    }
    if (camp.rewardGameTurns && camp.rewardGameTurns > 0) {
      rewards.push(`+${camp.rewardGameTurns} ${t('common.spins', { defaultValue: 'Lượt quay' })}`);
    }
    if (camp.rewardVoucherId) {
      rewards.push(`+1 ${t('dashboard.reward_voucher_label', { defaultValue: 'Voucher' })}`);
    }
    if (rewards.length === 0) {
      return t('dashboard.default_reward', { defaultValue: 'Quà tri ân hội viên' });
    }
    return rewards.join(' • ');
  };

  const actionTypeBodyTemplate = (rowData: PointLedgerItem) => {
    switch (rowData.actionType) {
      case 'EARN':
        return <Tag severity="success" value={t('action_type.earn', { defaultValue: 'TÍCH ĐIỂM (EARN)' })} icon="pi pi-arrow-up-right" />;
      case 'BURN':
        return <Tag severity="danger" value={t('action_type.burn', { defaultValue: 'TIÊU ĐIỂM (BURN)' })} icon="pi pi-arrow-down-left" />;
      case 'REWARD':
        return <Tag severity="info" value={t('action_type.reward', { defaultValue: 'THƯỞNG CỘT MỐC' })} icon="pi pi-gift" />;
      case 'SPIN':
        return <Tag severity="warning" value={t('action_type.spin', { defaultValue: 'VÒNG QUAY' })} icon="pi pi-compass" />;
      case 'VOUCHER':
        return <Tag severity="info" value={t('action_type.voucher', { defaultValue: 'ĐỔI VOUCHER' })} icon="pi pi-ticket" />;
      default:
        return <Tag severity="secondary" value={rowData.actionType || t('common.actions', { defaultValue: 'GIAO DỊCH' })} />;
    }
  };

  const pointsBodyTemplate = (rowData: PointLedgerItem) => {
    const isPositive = rowData.actionType === 'EARN' || rowData.actionType === 'REWARD' || rowData.actionType === 'SPIN';
    return (
      <span className={`font-semibold ${isPositive ? 'text-green-600' : 'text-orange-600'}`}>
        {isPositive ? `+${rowData.points}` : `-${rowData.points}`} {t('common.points', { defaultValue: 'Điểm' })}
      </span>
    );
  };

  const statusBodyTemplate = (row: PointLedgerItem) => {
    const status = (row.status || 'SUCCESS').toUpperCase();
    if (status === 'SUCCESS') {
      return <Tag severity="success" value={t('common.success', { defaultValue: 'Thành Công' })} />;
    }
    if (status === 'PENDING') {
      return <Tag severity="warning" value={t('common.pending', { defaultValue: 'Đang Xử Lý' })} />;
    }
    if (status === 'FAILED') {
      return <Tag severity="danger" value={t('common.failed', { defaultValue: 'Thất Bại' })} />;
    }
    return <Tag severity="secondary" value={status} />;
  };

  const dateTemplate = (rowData: PointLedgerItem) => {
    if (!rowData.createdAt) return '-';
    try {
      const d = new Date(rowData.createdAt);
      if (isNaN(d.getTime())) return rowData.createdAt;
      return d.toLocaleString('vi-VN');
    } catch {
      return rowData.createdAt;
    }
  };

  return (
    <div className="grid">
      <div className="col-12 flex flex-wrap justify-content-between align-items-center mb-2 gap-2">
        <AppBreadcrumb items={[{ label: t('dashboard.title', { defaultValue: 'Tổng quan Nền tảng Loyalty & GameHub' }) }]} />
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
                ? t('dashboard.toggle_infra_hide', { defaultValue: 'Ẩn thông tin hạ tầng' })
                : t('dashboard.toggle_infra_show', { defaultValue: 'Xem thông tin hạ tầng hệ thống' })
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
                {t('dashboard.total_members', { defaultValue: 'Tổng Hội viên Liên minh' })}
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
                count: (stats.activeMembers || 0).toLocaleString(),
                defaultValue: `${(stats.activeMembers || 0).toLocaleString()} hội viên đang hoạt động`,
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
                {t('dashboard.points_issued', { defaultValue: 'Tổng Điểm Đã Phát hành' })}
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
                amount: (stats.totalEarnedPoints || 0).toLocaleString(),
                defaultValue: `Quy đổi 1:1 HTG (Tương đương ${(stats.totalEarnedPoints || 0).toLocaleString()} HTG)`,
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
                {t('dashboard.points_redeemed', { defaultValue: 'Tổng Điểm Đã Tiêu dùng' })}
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
                amount: (stats.clearingSettledAmount || 0).toLocaleString(),
                defaultValue: `Quyết toán bù trừ: ${(stats.clearingSettledAmount || 0).toLocaleString()} HTG`,
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
                {t('dashboard.active_vouchers', { defaultValue: 'Kho Voucher Đang Mở Đổi' })}
              </span>
              <div className="text-900 font-extrabold text-3xl line-height-1 flex align-items-baseline gap-2">
                <span>{(stats.activeVouchers || 0).toLocaleString()}</span>
                <span className="text-base font-semibold text-500">
                  {t('dashboard.voucher_unit', { defaultValue: 'voucher' })}
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
                count: (stats.totalTransactions || 0).toLocaleString(),
                defaultValue: `Tổng ${(stats.totalTransactions || 0).toLocaleString()} giao dịch điểm`,
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Dynamic Tier Distribution Card */}
      <div className={showSystemHealth ? 'col-12 lg:col-4' : 'col-12 lg:col-6'}>
        <Card title={t('dashboard.tier_distribution', { defaultValue: 'Phân bố Hội viên theo Hạng thẻ' })} className="h-full shadow-2 border-round-2xl">
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
                        {tier.memberCount.toLocaleString()} {t('dashboard.member_count_unit', { defaultValue: 'hội viên' })} ({tier.percentage}%)
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
                {t('dashboard.no_tiers_configured', { defaultValue: 'Chưa có hạng hội viên nào được cấu hình' })}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-top-1 surface-border flex justify-content-between align-items-center">
            <span className="text-xs text-500">{t('dashboard.evaluation_cycle', { defaultValue: 'Chu kỳ tự động đánh giá: 12 tháng' })}</span>
            <Button
              label={t('dashboard.view_tier_config', { defaultValue: 'Xem cấu hình hạng' })}
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
          title={t('dashboard.top_campaigns', { defaultValue: 'Chiến dịch Cột mốc & Nhiệm vụ Nổi bật' })}
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
                          value={t('dashboard.step_prefix', { step: camp.milestoneStep || 1, defaultValue: `Chặng ${camp.milestoneStep || 1}` })}
                          className="text-xs"
                        />
                      </div>
                      <span className="text-xs text-600">
                        <span className="font-medium text-500">{t('dashboard.target_label', { defaultValue: 'Mục tiêu:' })}</span>{' '}
                        {getTargetMetricText(camp.targetMetric, camp.targetValue)}
                      </span>
                    </div>
                    <Tag
                      severity={camp.status === 'ACTIVE' ? 'success' : 'secondary'}
                      value={camp.status === 'ACTIVE' ? t('common.active', { defaultValue: 'Đang diễn ra' }) : t('common.inactive', { defaultValue: 'Đã kết thúc' })}
                    />
                  </div>
                  <div className="text-xs text-blue-700 font-medium flex align-items-center gap-1">
                    <i className="pi pi-gift text-amber-500" />
                    <span>
                      <span className="font-medium text-500">{t('dashboard.reward_label', { defaultValue: 'Phần thưởng:' })}</span>{' '}
                      {getRewardSummary(camp)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <i className="pi pi-calendar-times text-400 text-3xl mb-2" />
                <p className="text-500 text-sm m-0 mb-3">
                  {t('dashboard.no_campaigns', { defaultValue: 'Chưa có chiến dịch nào được cấu hình cho đối tác này' })}
                </p>
                <Button
                  label={t('dashboard.create_campaign_cta', { defaultValue: '+ Tạo Chiến Dịch Mới' })}
                  size="small"
                  outlined
                  onClick={() => navigate(paths.campaignMilestones)}
                />
              </div>
            )}
          </div>
          <div className="mt-3 text-right">
            <Button
              label={t('dashboard.manage_campaigns', { defaultValue: 'Quản lý chiến dịch' })}
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
                  {t('dashboard.services_status', { defaultValue: 'Trạng thái Hạ tầng Microservices' })}
                </span>
                <Button
                  icon="pi pi-refresh"
                  rounded
                  text
                  size="small"
                  loading={healthLoading}
                  onClick={fetchSystemHealth}
                  tooltip={t('dashboard.refresh_status', { defaultValue: 'Làm mới trạng thái' })}
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
                        {t('dashboard.port_label', { defaultValue: 'Cổng:' })} {service.port}
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
          title={t('dashboard.recent_transactions', { defaultValue: 'Giao dịch Sổ cái Điểm Gần đây' })}
          className="shadow-2 border-round-2xl"
        >
          <DataTable
            value={recentTransactions}
            loading={loading}
            emptyMessage={t('common.no_data', { defaultValue: 'Chưa có giao dịch biến động điểm nào' })}
            responsiveLayout="scroll"
          >
            <Column
              field="transactionId"
              header={t('dashboard.tx_code', { defaultValue: 'Mã Giao Dịch' })}
              body={(row: PointLedgerItem) => (
                <span className="font-mono text-xs font-semibold text-slate-700">{row.transactionId}</span>
              )}
            />
            <Column
              field="partnerCode"
              header={t('dashboard.partner_pos', { defaultValue: 'Điểm bán / Đối tác' })}
              body={(row: PointLedgerItem) => <Tag value={row.partnerCode || selectedTenant} severity="info" />}
            />
            <Column
              field="externalUserId"
              header={t('dashboard.customer_id', { defaultValue: 'Mã Khách Hàng' })}
              body={(row: PointLedgerItem) => <span className="font-mono text-xs">{row.externalUserId}</span>}
            />
            <Column header={t('dashboard.action', { defaultValue: 'Loại Giao Dịch' })} body={actionTypeBodyTemplate} />
            <Column header={t('dashboard.points_delta', { defaultValue: 'Biến Động Điểm' })} body={pointsBodyTemplate} />
            <Column
              field="status"
              header={t('dashboard.status', { defaultValue: 'Trạng Thái' })}
              body={statusBodyTemplate}
            />
            <Column
              field="createdAt"
              header={t('dashboard.time', { defaultValue: 'Thời Gian' })}
              body={dateTemplate}
            />
          </DataTable>
          <div className="mt-3 flex flex-wrap justify-content-between align-items-center gap-2">
            <span className="text-xs text-500">
              {t('dashboard.sync_note', { defaultValue: 'Đồng bộ hai chiều với cơ sở dữ liệu PostgreSQL 15+ độc lập' })}
            </span>
            <div className="flex align-items-center gap-2">
              <Button
                label={t('dashboard.view_clearing_report', { defaultValue: 'Xem Báo Cáo Đối Soát Bù Trừ' })}
                icon="pi pi-chart-line"
                text
                size="small"
                onClick={() => navigate(paths.clearingSettlement)}
              />
              <Button
                label={t('dashboard.view_all_transactions', { defaultValue: 'Xem Toàn Bộ Sổ Cái' })}
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
