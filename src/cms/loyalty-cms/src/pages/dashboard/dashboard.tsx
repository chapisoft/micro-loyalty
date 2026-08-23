import React, { useState } from 'react';
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

export enum PointActionType {
  EARN = 'EARN',
  BURN = 'BURN',
  CASHBACK = 'CASHBACK',
  REFUND = 'REFUND',
  EXPIRE = 'EXPIRE',
  ADJUST = 'ADJUST',
}

interface ServiceHealth {
  serviceId: string;
  displayName: string;
  port: number;
  status: 'UP' | 'DOWN';
  icon: string;
  color: string;
  responseTimeMs: number;
}

interface CampaignItem {
  code: string;
  name: string;
  participants: number;
  completionRate: number;
  rewardType: string;
  status: 'ACTIVE' | 'UPCOMING';
}

interface RecentLedgerTx {
  id: string;
  partnerCode: string;
  externalUserId: string;
  actionType: PointActionType;
  points: number;
  status: 'SUCCESS' | 'PENDING';
  createdAt: string;
}

export const Dashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [loading] = useState(false);
  const [healthLoading, setHealthLoading] = useState(false);

  const services: ServiceHealth[] = [
    {
      serviceId: 'loyalty-service',
      displayName: 'Core Loyalty & Rules Engine',
      port: 8080,
      status: 'UP',
      icon: 'pi-star',
      color: '#3b82f6',
      responseTimeMs: 12,
    },
    {
      serviceId: 'loyalty-db',
      displayName: 'PostgreSQL 15+ Cluster (loyalty_db)',
      port: 5432,
      status: 'UP',
      icon: 'pi-database',
      color: '#10b981',
      responseTimeMs: 4,
    },
    {
      serviceId: 'redis-lock-cluster',
      displayName: 'Redis 7.x Cluster & Redisson Lock',
      port: 6379,
      status: 'UP',
      icon: 'pi-lock',
      color: '#ef4444',
      responseTimeMs: 2,
    },
    {
      serviceId: 'redis-streams',
      displayName: 'Redis Streams Event Bus',
      port: 6379,
      status: 'UP',
      icon: 'pi-sync',
      color: '#8b5cf6',
      responseTimeMs: 3,
    },
    {
      serviceId: 'natcash-eu-api',
      displayName: 'Natcash Gateway Reverse Proxy',
      port: 8090,
      status: 'UP',
      icon: 'pi-shield',
      color: '#f97316',
      responseTimeMs: 9,
    },
  ];

  const topCampaigns: CampaignItem[] = [
    {
      code: 'GOLDEN_WEEK_2026',
      name: 'Tuần Lễ Vàng Mua Sắm Delimart',
      participants: 12450,
      completionRate: 84,
      rewardType: '500 Điểm + Voucher 20%',
      status: 'ACTIVE',
    },
    {
      code: 'TOPUP_CHALLENGE',
      name: 'Thử Thách Nạp Thẻ Viễn Thông Natcom',
      participants: 28900,
      completionRate: 92,
      rewardType: '3 Lượt Quay Vòng May Mắn',
      status: 'ACTIVE',
    },
    {
      code: 'SUMMER_SPIN_FEST',
      name: 'Lễ Hội Vòng Quay May Mắn Mùa Hè',
      participants: 45200,
      completionRate: 76,
      rewardType: '10.000 HTG Tiền Mặt',
      status: 'ACTIVE',
    },
  ];

  const recentTransactions: RecentLedgerTx[] = [
    {
      id: 'TX_DELI_98214',
      partnerCode: 'DELIMART_POS',
      externalUserId: 'CUST_882914',
      actionType: PointActionType.BURN,
      points: 250,
      status: 'SUCCESS',
      createdAt: '23/08/2026 19:42:10',
    },
    {
      id: 'TX_NATC_55102',
      partnerCode: 'NATCASH_WALLET',
      externalUserId: 'CUST_110942',
      actionType: PointActionType.EARN,
      points: 120,
      status: 'SUCCESS',
      createdAt: '23/08/2026 19:40:05',
    },
    {
      id: 'TX_SPIN_33918',
      partnerCode: 'LUCKY_WHEEL',
      externalUserId: 'CUST_449102',
      actionType: PointActionType.EARN,
      points: 50,
      status: 'SUCCESS',
      createdAt: '23/08/2026 19:38:22',
    },
    {
      id: 'TX_CASH_11048',
      partnerCode: 'NATCASH_WALLET',
      externalUserId: 'CUST_772109',
      actionType: PointActionType.CASHBACK,
      points: 500,
      status: 'SUCCESS',
      createdAt: '23/08/2026 19:35:44',
    },
  ];

  const refreshHealth = () => {
    setHealthLoading(true);
    setTimeout(() => {
      setHealthLoading(false);
    }, 400);
  };

  const actionTypeBodyTemplate = (rowData: RecentLedgerTx) => {
    switch (rowData.actionType) {
      case PointActionType.EARN:
        return <Tag severity="success" value={t('point_action.earn', { defaultValue: 'Tích Điểm (+)' })} icon="pi pi-plus" />;
      case PointActionType.BURN:
        return <Tag severity="danger" value={t('point_action.burn', { defaultValue: 'Tiêu Điểm (-)' })} icon="pi pi-minus" />;
      case PointActionType.CASHBACK:
        return <Tag severity="info" value={t('point_action.cashback', { defaultValue: 'Hoàn Tiền Ví' })} icon="pi pi-wallet" />;
      case PointActionType.REFUND:
        return <Tag severity="warning" value={t('point_action.refund', { defaultValue: 'Hoàn Điểm' })} icon="pi pi-replay" />;
      default:
        return <Tag severity="neutral" value={rowData.actionType} />;
    }
  };

  const pointsBodyTemplate = (rowData: RecentLedgerTx) => {
    const isPositive = rowData.actionType === PointActionType.EARN || rowData.actionType === PointActionType.REFUND;
    return (
      <span className={`font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? '+' : '-'}{rowData.points.toLocaleString()} pts
      </span>
    );
  };

  return (
    <div className="grid">
      <div className="col-12">
        <AppBreadcrumb items={[{ label: t('dashboard.title', { defaultValue: 'Tổng quan Nền tảng Loyalty & GameHub' }) }]} />
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
              <span className="block text-600 font-semibold text-sm mb-2">{t('dashboard.total_members', { defaultValue: 'Tổng Hội viên Liên minh' })}</span>
              <div className="text-900 font-extrabold text-3xl line-height-1">128,450</div>
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
            <i className="pi pi-arrow-up-right text-emerald-600 text-xs font-bold" />
            <span className="text-xs font-semibold text-emerald-600">{t('dashboard.growth_prev_month', { defaultValue: '+12.5% so với tháng trước' })}</span>
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
              <span className="block text-600 font-semibold text-sm mb-2">{t('dashboard.points_issued', { defaultValue: 'Tổng Điểm Đã Phát hành' })}</span>
              <div className="text-900 font-extrabold text-3xl line-height-1">5,420,000</div>
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
            <span className="text-xs font-semibold text-600">{t('dashboard.exchange_note', { defaultValue: 'Quy đổi 1:1 HTG (Tương đương 5.42M HTG)' })}</span>
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
              <span className="block text-600 font-semibold text-sm mb-2">{t('dashboard.points_redeemed', { defaultValue: 'Tổng Điểm Tiêu dùng' })}</span>
              <div className="text-900 font-extrabold text-3xl line-height-1">3,180,000</div>
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
            <span className="text-xs font-semibold text-amber-700">{t('dashboard.burn_rate_note', { defaultValue: 'Tỷ lệ tiêu dùng (Burn Rate): 58.7%' })}</span>
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
              <span className="block text-600 font-semibold text-sm mb-2">{t('dashboard.game_revenue', { defaultValue: 'Doanh thu Cổng Game' })}</span>
              <div className="text-900 font-extrabold text-3xl line-height-1">845,200 HTG</div>
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
              <i className="pi pi-play text-white text-2xl" />
            </div>
          </div>
          <div className="flex align-items-center gap-2 pt-2 border-top-1 surface-border">
            <i className="pi pi-bolt text-purple-600 text-xs" />
            <span className="text-xs font-semibold text-purple-700">{t('dashboard.spins_note', { defaultValue: '14,200 lượt chơi & quay thưởng' })}</span>
          </div>
        </div>
      </div>

      {/* Tier Distribution Card */}
      <div className="col-12 lg:col-4">
        <Card title={t('dashboard.tier_distribution', { defaultValue: 'Phân bố Hội viên theo Hạng thẻ' })} className="h-full shadow-2 border-round-2xl">
          <div className="flex flex-column gap-4">
            <div>
              <div className="flex justify-content-between mb-1">
                <span className="font-semibold text-sm text-slate-700 flex align-items-center gap-2">
                  <i className="pi pi-circle-fill text-slate-400 text-xs" /> {t('dashboard.silver_tier', { defaultValue: 'Hạng Bạc (Silver)' })}
                </span>
                <span className="text-sm font-bold text-slate-900">83,492 (65%)</span>
              </div>
              <ProgressBar value={65} showValue={false} style={{ height: '8px' }} color="#94a3b8" />
            </div>

            <div>
              <div className="flex justify-content-between mb-1">
                <span className="font-semibold text-sm text-amber-700 flex align-items-center gap-2">
                  <i className="pi pi-circle-fill text-amber-500 text-xs" /> {t('dashboard.gold_tier', { defaultValue: 'Hạng Vàng (Gold)' })}
                </span>
                <span className="text-sm font-bold text-amber-900">28,259 (22%)</span>
              </div>
              <ProgressBar value={22} showValue={false} style={{ height: '8px' }} color="#f59e0b" />
            </div>

            <div>
              <div className="flex justify-content-between mb-1">
                <span className="font-semibold text-sm text-cyan-700 flex align-items-center gap-2">
                  <i className="pi pi-circle-fill text-cyan-500 text-xs" /> {t('dashboard.platinum_tier', { defaultValue: 'Hạng Bạch Kim (Platinum)' })}
                </span>
                <span className="text-sm font-bold text-cyan-900">12,845 (10%)</span>
              </div>
              <ProgressBar value={10} showValue={false} style={{ height: '8px' }} color="#06b6d4" />
            </div>

            <div>
              <div className="flex justify-content-between mb-1">
                <span className="font-semibold text-sm text-indigo-700 flex align-items-center gap-2">
                  <i className="pi pi-circle-fill text-indigo-500 text-xs" /> {t('dashboard.diamond_tier', { defaultValue: 'Hạng Kim Cương (Diamond)' })}
                </span>
                <span className="text-sm font-bold text-indigo-900">3,854 (3%)</span>
              </div>
              <ProgressBar value={3} showValue={false} style={{ height: '8px' }} color="#6366f1" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-top-1 surface-border flex justify-content-between align-items-center">
            <span className="text-xs text-500">{t('dashboard.evaluation_cycle', { defaultValue: 'Chu kỳ đánh giá: 12 tháng' })}</span>
            <Button label={t('dashboard.view_tier_config', { defaultValue: 'Xem cấu hình hạng' })} text size="small" onClick={() => navigate(paths.tiers)} />
          </div>
        </Card>
      </div>

      {/* Microservices & Infrastructure Health */}
      <div className="col-12 lg:col-4">
        <Card
          title={
            <div className="flex align-items-center justify-content-between">
              <span className="font-bold text-xl">{t('dashboard.services_status', { defaultValue: 'Trạng thái Hạ tầng Microservices' })}</span>
              <Button
                icon="pi pi-refresh"
                rounded
                text
                size="small"
                loading={healthLoading}
                onClick={refreshHealth}
                tooltip={t('dashboard.refresh_status', { defaultValue: 'Làm mới trạng thái' })}
              />
            </div>
          }
          className="h-full shadow-2 border-round-2xl"
        >
          <ul className="list-none p-0 m-0">
            {services.map((service, idx) => (
              <li
                key={service.serviceId}
                className={`flex align-items-center justify-content-between py-2 ${idx < services.length - 1 ? 'border-bottom-1 surface-border' : ''}`}
              >
                <div className="flex align-items-center gap-2">
                  <div
                    className="flex align-items-center justify-content-center border-round-lg flex-shrink-0"
                    style={{
                      width: '2.2rem',
                      height: '2.2rem',
                      background: service.color ? `linear-gradient(135deg, ${service.color} 0%, ${service.color}dd 100%)` : '#3b82f6',
                    }}
                  >
                    <i className={`pi ${service.icon || 'pi-server'} text-white text-sm`} />
                  </div>
                  <div>
                    <div className="font-semibold text-900 text-xs line-height-1">{service.displayName}</div>
                    <div className="text-500 text-xs mt-1 font-mono">Port :{service.port}</div>
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

      {/* Featured Campaigns */}
      <div className="col-12 lg:col-4">
        <Card title={t('dashboard.top_campaigns', { defaultValue: 'Chiến dịch Cột mốc Nổi bật' })} className="h-full shadow-2 border-round-2xl">
          <div className="flex flex-column gap-3">
            {topCampaigns.map((camp) => (
              <div key={camp.code} className="p-3 surface-ground border-round-xl border-1 surface-border">
                <div className="flex justify-content-between align-items-start mb-2">
                  <div>
                    <span className="font-bold text-sm text-900 block">{camp.name}</span>
                    <span className="text-xs text-500">{camp.participants.toLocaleString()} {t('dashboard.participants', { defaultValue: 'người tham gia' })}</span>
                  </div>
                  <Tag severity="success" value={`${camp.completionRate}%`} />
                </div>
                <div className="text-xs text-blue-600 font-semibold mb-2">
                  <i className="pi pi-gift mr-1" /> {camp.rewardType}
                </div>
                <ProgressBar value={camp.completionRate} showValue={false} style={{ height: '6px' }} color="#10b981" />
              </div>
            ))}
          </div>
          <div className="mt-3 text-right">
            <Button label={t('dashboard.manage_campaigns', { defaultValue: 'Quản lý chiến dịch' })} icon="pi pi-arrow-right" iconPos="right" text size="small" onClick={() => navigate(paths.campaigns)} />
          </div>
        </Card>
      </div>

      {/* Recent Point Ledger Activity Table */}
      <div className="col-12">
        <Card title={t('dashboard.recent_transactions', { defaultValue: 'Giao dịch Sổ cái Điểm Gần đây' })} className="shadow-2 border-round-2xl">
          <DataTable value={recentTransactions} loading={loading} emptyMessage={t('common.no_data', { defaultValue: 'Chưa có dữ liệu giao dịch' })}>
            <Column field="id" header={t('dashboard.tx_code', { defaultValue: 'Mã Giao Dịch' })} body={(row) => <span className="font-mono text-xs font-bold text-slate-700">{row.id}</span>} />
            <Column field="partnerCode" header={t('dashboard.partner_pos', { defaultValue: 'Điểm bán / Đối tác' })} body={(row) => <Tag value={row.partnerCode} severity="neutral" />} />
            <Column field="externalUserId" header={t('dashboard.customer_id', { defaultValue: 'Mã Khách Hàng' })} body={(row) => <span className="font-mono text-xs">{row.externalUserId}</span>} />
            <Column header={t('dashboard.action', { defaultValue: 'Hành Động' })} body={actionTypeBodyTemplate} />
            <Column header={t('dashboard.points_delta', { defaultValue: 'Điểm Biến Động' })} body={pointsBodyTemplate} />
            <Column field="status" header={t('dashboard.status', { defaultValue: 'Trạng Thái' })} body={() => <Tag severity="success" value={t('common.success', { defaultValue: 'Thành Công' })} />} />
            <Column field="createdAt" header={t('dashboard.time', { defaultValue: 'Thời Gian' })} body={(row) => <span className="text-500 text-xs">{row.createdAt}</span>} />
          </DataTable>
          <div className="mt-3 flex justify-content-between align-items-center">
            <span className="text-xs text-500">{t('dashboard.sync_note', { defaultValue: 'Đồng bộ hai chiều với cơ sở dữ liệu PostgreSQL 15+ độc lập' })}</span>
            <Button label={t('dashboard.view_clearing_report', { defaultValue: 'Xem Báo Cáo Đối Soát Bù Trừ' })} icon="pi pi-external-link" text size="small" onClick={() => navigate(paths.clearing)} />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
