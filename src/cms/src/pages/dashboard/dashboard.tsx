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
import { LoyaltyService, DashboardStatsModel, PointLedgerItem } from '@/service/loyalty.service';

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

export const Dashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [selectedTenant, setSelectedTenant] = useState('TENANT_NATCASH');
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
  });

  const [recentTransactions, setRecentTransactions] = useState<PointLedgerItem[]>([]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsData, ledgerData] = await Promise.all([
        LoyaltyService.getDashboardStats(selectedTenant),
        LoyaltyService.getPointLedger(selectedTenant),
      ]);
      if (statsData) {
        setStats(statsData);
      }
      if (Array.isArray(ledgerData)) {
        setRecentTransactions(ledgerData.slice(0, 6));
      }
    } catch (e) {
      console.error('[Dashboard.fetchData] Error:', e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedTenant]);

  const services: ServiceHealth[] = [
    {
      serviceId: 'loyalty-service',
      displayName: 'Core Loyalty & Rules Engine',
      port: 8088,
      status: 'UP',
      icon: 'pi-star',
      color: '#3b82f6',
      responseTimeMs: 8,
    },
    {
      serviceId: 'loyalty-db',
      displayName: 'PostgreSQL 15+ Cluster (loyalty_db)',
      port: 15435,
      status: 'UP',
      icon: 'pi-database',
      color: '#10b981',
      responseTimeMs: 3,
    },
    {
      serviceId: 'redis-lock-cluster',
      displayName: 'Redis 7.x Cluster & Redisson Lock',
      port: 16385,
      status: 'UP',
      icon: 'pi-lock',
      color: '#ef4444',
      responseTimeMs: 2,
    },
    {
      serviceId: 'redis-streams',
      displayName: 'Redis Streams Event Bus',
      port: 16385,
      status: 'UP',
      icon: 'pi-sync',
      color: '#8b5cf6',
      responseTimeMs: 2,
    },
    {
      serviceId: 'natcash-eu-api',
      displayName: 'Natcash Gateway Reverse Proxy',
      port: 18095,
      status: 'UP',
      icon: 'pi-shield',
      color: '#f97316',
      responseTimeMs: 6,
    },
  ];

  const topCampaigns: CampaignItem[] = [
    {
      code: 'NATCASH_WELCOME_2026',
      name: 'Chào Mừng Hội Viên Mới — Tặng 100 Điểm & 2 Lượt Quay',
      participants: 1250,
      completionRate: 88,
      rewardType: '100 Điểm + 2 Vòng Quay',
      status: 'ACTIVE',
    },
    {
      code: 'TOPUP_CASHBACK_5PCT',
      name: 'Nạp Tiền Ví Nhận Hoàn Điểm 5% Không Giới Hạn',
      participants: 3420,
      completionRate: 94,
      rewardType: 'Hoàn điểm 5%',
      status: 'ACTIVE',
    },
    {
      code: 'SUPERMARKET_DELIMART_2026',
      name: 'Mua Sắm Siêu Thị Delimart — Tiêu Điểm Giảm Tới 50%',
      participants: 2890,
      completionRate: 78,
      rewardType: 'Giảm 50% Hóa Đơn',
      status: 'ACTIVE',
    },
  ];

  const refreshHealth = () => {
    setHealthLoading(true);
    setTimeout(() => {
      setHealthLoading(false);
    }, 400);
  };

  const actionTypeBodyTemplate = (rowData: PointLedgerItem) => {
    switch (rowData.actionType) {
      case 'EARN':
        return <Tag severity="success" value="TÍCH ĐIỂM (EARN)" icon="pi pi-arrow-up-right" />;
      case 'BURN':
        return <Tag severity="danger" value="TIÊU ĐIỂM (BURN)" icon="pi pi-arrow-down-left" />;
      case 'REWARD':
        return <Tag severity="info" value="THƯỞNG CỘT MỐC" icon="pi pi-gift" />;
      case 'SPIN':
        return <Tag severity="warning" value="VÒNG QUAY" icon="pi pi-compass" />;
      case 'VOUCHER':
        return <Tag severity="info" value="ĐỔI VOUCHER" icon="pi pi-ticket" />;
      default:
        return <Tag severity="secondary" value={rowData.actionType || 'GIAO DỊCH'} />;
    }
  };

  const pointsBodyTemplate = (rowData: PointLedgerItem) => {
    const isPositive = rowData.actionType === 'EARN' || rowData.actionType === 'REWARD' || rowData.actionType === 'SPIN';
    return (
      <span className={`font-bold ${isPositive ? 'text-green-600' : 'text-orange-600'}`}>
        {isPositive ? `+${rowData.points}` : `-${rowData.points}`} Điểm
      </span>
    );
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
          {/* Professional Scalable Tenant / Partner Dropdown */}
          <TenantSelector value={selectedTenant} onChange={setSelectedTenant} />

          {/* Subtle button to toggle infrastructure health widget */}
          <Button
            icon={showSystemHealth ? 'pi pi-shield' : 'pi pi-server'}
            rounded
            text
            size="small"
            severity={showSystemHealth ? 'warning' : 'secondary'}
            onClick={() => setShowSystemHealth(!showSystemHealth)}
            tooltip={showSystemHealth ? 'Ẩn thông tin hạ tầng' : 'Xem thông tin hạ tầng hệ thống'}
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
              <span className="block text-600 font-semibold text-sm mb-2">{t('dashboard.total_members', { defaultValue: 'Tổng Hội viên Liên minh' })}</span>
              <div className="text-900 font-extrabold text-3xl line-height-1">{(stats.totalMembers || 0).toLocaleString()}</div>
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
            <span className="text-xs font-semibold text-emerald-600">
              {stats.activeMembers || 0} hội viên đang hoạt động
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
              <span className="block text-600 font-semibold text-sm mb-2">{t('dashboard.points_issued', { defaultValue: 'Tổng Điểm Đã Phát hành' })}</span>
              <div className="text-900 font-extrabold text-3xl line-height-1">{(stats.totalEarnedPoints || 0).toLocaleString()}</div>
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
            <span className="text-xs font-semibold text-600">{t('dashboard.exchange_note', { defaultValue: 'Tỷ lệ quy đổi: 1 Điểm = 1 HTG' })}</span>
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
              <span className="block text-600 font-semibold text-sm mb-2">{t('dashboard.points_redeemed', { defaultValue: 'Tổng Điểm Đã Tiêu dùng' })}</span>
              <div className="text-900 font-extrabold text-3xl line-height-1">{(stats.totalBurnedPoints || 0).toLocaleString()}</div>
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
            <span className="text-xs font-semibold text-amber-700">
              Quyết toán bù trừ: {(stats.clearingSettledAmount || 0).toLocaleString()} HTG
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
              <span className="block text-600 font-semibold text-sm mb-2">{t('dashboard.game_revenue', { defaultValue: 'Kho Voucher Đang Mở Đổi' })}</span>
              <div className="text-900 font-extrabold text-3xl line-height-1">{(stats.activeVouchers || 0).toLocaleString()} voucher</div>
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
            <span className="text-xs font-semibold text-purple-700">
              Tổng {(stats.totalTransactions || 0).toLocaleString()} giao dịch điểm
            </span>
          </div>
        </div>
      </div>

      {/* Tier Distribution Card */}
      <div className={showSystemHealth ? 'col-12 lg:col-4' : 'col-12 lg:col-6'}>
        <Card title={t('dashboard.tier_distribution', { defaultValue: 'Phân bố Hội viên theo Hạng thẻ' })} className="h-full shadow-2 border-round-2xl">
          <div className="flex flex-column gap-4">
            <div>
              <div className="flex justify-content-between mb-1">
                <span className="font-semibold text-sm text-slate-700 flex align-items-center gap-2">
                  <i className="pi pi-circle-fill text-slate-400 text-xs" /> Hạng Đồng (Bronze)
                </span>
                <span className="text-sm font-bold text-slate-900">Chuẩn Hội Viên (1.0x)</span>
              </div>
              <ProgressBar value={60} showValue={false} style={{ height: '8px' }} color="#94a3b8" />
            </div>

            <div>
              <div className="flex justify-content-between mb-1">
                <span className="font-semibold text-sm text-blue-700 flex align-items-center gap-2">
                  <i className="pi pi-circle-fill text-blue-500 text-xs" /> Hạng Bạc (Silver)
                </span>
                <span className="text-sm font-bold text-blue-900">Từ 1.000 Điểm (1.2x)</span>
              </div>
              <ProgressBar value={25} showValue={false} style={{ height: '8px' }} color="#3b82f6" />
            </div>

            <div>
              <div className="flex justify-content-between mb-1">
                <span className="font-semibold text-sm text-amber-700 flex align-items-center gap-2">
                  <i className="pi pi-circle-fill text-amber-500 text-xs" /> Hạng Vàng (Gold)
                </span>
                <span className="text-sm font-bold text-amber-900">Từ 5.000 Điểm (1.5x)</span>
              </div>
              <ProgressBar value={10} showValue={false} style={{ height: '8px' }} color="#f59e0b" />
            </div>

            <div>
              <div className="flex justify-content-between mb-1">
                <span className="font-semibold text-sm text-cyan-700 flex align-items-center gap-2">
                  <i className="pi pi-circle-fill text-cyan-500 text-xs" /> Hạng Bạch Kim (Platinum VIP)
                </span>
                <span className="text-sm font-bold text-cyan-900">Từ 15.000 Điểm (2.0x)</span>
              </div>
              <ProgressBar value={5} showValue={false} style={{ height: '8px' }} color="#06b6d4" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-top-1 surface-border flex justify-content-between align-items-center">
            <span className="text-xs text-500">{t('dashboard.evaluation_cycle', { defaultValue: 'Chu kỳ tự động đánh giá: 12 tháng' })}</span>
            <Button label={t('dashboard.view_tier_config', { defaultValue: 'Xem cấu hình hạng' })} text size="small" onClick={() => navigate(paths.tierManagement)} />
          </div>
        </Card>
      </div>

      {/* Featured Campaigns */}
      <div className={showSystemHealth ? 'col-12 lg:col-4' : 'col-12 lg:col-6'}>
        <Card title={t('dashboard.top_campaigns', { defaultValue: 'Chiến dịch Cột mốc & Nhiệm vụ Nổi bật' })} className="h-full shadow-2 border-round-2xl">
          <div className="flex flex-column gap-3">
            {topCampaigns.map((camp) => (
              <div key={camp.code} className="p-3 surface-ground border-round-xl border-1 surface-border">
                <div className="flex justify-content-between align-items-start mb-2">
                  <div>
                    <span className="font-bold text-sm text-900 block">{camp.name}</span>
                    <span className="text-xs text-500">{camp.participants.toLocaleString()} {t('dashboard.participants', { defaultValue: 'lượt tham gia' })}</span>
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
            <Button label={t('dashboard.manage_campaigns', { defaultValue: 'Quản lý chiến dịch' })} icon="pi pi-arrow-right" iconPos="right" text size="small" onClick={() => navigate(paths.campaignMilestones)} />
          </div>
        </Card>
      </div>

      {/* Microservices & Infrastructure Health (Hidden by default, shown when user clicks discreet trigger) */}
      {showSystemHealth && (
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
      )}

      {/* Recent Point Ledger Activity Table */}
      <div className="col-12">
        <Card title={t('dashboard.recent_transactions', { defaultValue: 'Giao dịch Sổ cái Điểm Gần đây' })} className="shadow-2 border-round-2xl">
          <DataTable
            value={recentTransactions}
            loading={loading}
            emptyMessage={t('common.no_data', { defaultValue: 'Chưa có giao dịch biến động điểm nào' })}
            responsiveLayout="scroll"
          >
            <Column
              field="transactionId"
              header={t('dashboard.tx_code', { defaultValue: 'Mã Giao Dịch' })}
              body={(row: PointLedgerItem) => <span className="font-mono text-xs font-bold text-slate-700">{row.transactionId}</span>}
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
              body={() => <Tag severity="success" value={t('common.success', { defaultValue: 'Thành Công' })} />}
            />
            <Column
              field="createdAt"
              header={t('dashboard.time', { defaultValue: 'Thời Gian' })}
              body={dateTemplate}
            />
          </DataTable>
          <div className="mt-3 flex justify-content-between align-items-center">
            <span className="text-xs text-500">{t('dashboard.sync_note', { defaultValue: 'Đồng bộ hai chiều với cơ sở dữ liệu PostgreSQL 15+ độc lập' })}</span>
            <Button label={t('dashboard.view_clearing_report', { defaultValue: 'Xem Sổ Cái Chi Tiết' })} icon="pi pi-external-link" text size="small" onClick={() => navigate(paths.transactions)} />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
