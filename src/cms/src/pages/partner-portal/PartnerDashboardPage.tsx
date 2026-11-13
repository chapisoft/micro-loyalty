import React, { useCallback, useEffect, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Skeleton } from 'primereact/skeleton';
import { useTranslation } from 'react-i18next';
import { AppBreadcrumb } from 'components';
import { TenantSelector } from '@/components/TenantSelector';
import { LoyaltyService, PartnerPortalDashboardModel } from '@/service/loyalty.service';

export const PartnerDashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const [selectedTenant, setSelectedTenant] = useState<string>(
    () => localStorage.getItem('selected_tenant_id') || 'TENANT_NATCASH'
  );
  const [data, setData] = useState<PartnerPortalDashboardModel | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await LoyaltyService.getPartnerPortalDashboard(undefined, selectedTenant);
      setData(res);
    } finally {
      setLoading(false);
    }
  }, [selectedTenant]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return (
    <div>
      <AppBreadcrumb items={[{ label: t('partner_portal.nav_dashboard', { defaultValue: 'Partner Portal · Tổng quan (NS-04)' }) }]} />

      <div className="card shadow-1 border-round surface-card p-4">
        <div className="flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
          <div>
            <h4 className="m-0 text-primary font-semibold">
              {t('partner_portal.dashboard_title', { defaultValue: 'Bảng điều khiển Đối tác Liên minh (NS-04)' })}
            </h4>
            <p className="m-0 text-xs text-500 mt-1">
              {data ? `${data.partnerCode} — ${data.partnerName}` : t('partner_portal.dashboard_subtitle', { defaultValue: 'Theo dõi hiệu suất phát hành/tiêu điểm tại quầy và công nợ bù trừ ròng.' })}
            </p>
          </div>
          <div className="flex gap-2 align-items-center">
            <TenantSelector value={selectedTenant} onChange={setSelectedTenant} />
            <Button icon="pi pi-refresh" outlined rounded onClick={fetchDashboard} loading={loading} />
          </div>
        </div>

        {loading ? (
          <div className="grid">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="col-12 md:col-3"><Skeleton height="6.5rem" /></div>
            ))}
          </div>
        ) : !data ? (
          <div className="text-center p-5 border-1 surface-border border-round surface-50 text-500">
            <i className="pi pi-chart-line text-3xl mb-2 block text-400" />
            {t('partner_portal.no_dashboard', { defaultValue: 'Chưa có dữ liệu tổng quan Partner Portal từ máy chủ.' })}
          </div>
        ) : (
          <>
            <div className="grid mb-4">
              <div className="col-12 md:col-3">
                <div className="p-3 border-round surface-50 border-1 surface-border">
                  <div className="text-xs text-500 uppercase">{t('partner_portal.paying_customers', { defaultValue: 'Khách Thanh Toán' })}</div>
                  <div className="text-2xl font-mono font-semibold text-primary mt-1">{Number(data.payingCustomersCount || 0).toLocaleString()}</div>
                </div>
              </div>
              <div className="col-12 md:col-3">
                <div className="p-3 border-round surface-50 border-1 surface-border">
                  <div className="text-xs text-500 uppercase">{t('partner_portal.burn_tx', { defaultValue: 'Giao Dịch Tiêu Điểm' })}</div>
                  <div className="text-2xl font-mono font-semibold text-blue-600 mt-1">{Number(data.burnTransactionsCount || 0).toLocaleString()}</div>
                </div>
              </div>
              <div className="col-12 md:col-3">
                <div className="p-3 border-round surface-50 border-1 surface-border">
                  <div className="text-xs text-500 uppercase">{t('partner_portal.new_members', { defaultValue: 'Hội Viên Mới' })}</div>
                  <div className="text-2xl font-mono font-semibold text-green-600 mt-1">{Number(data.newMembersAcquired || 0).toLocaleString()}</div>
                </div>
              </div>
              <div className="col-12 md:col-3">
                <div className="p-3 border-round surface-50 border-1 surface-border">
                  <div className="text-xs text-500 uppercase">{t('partner_portal.net_settlement', { defaultValue: 'Công Nợ Chờ Quyết Toán' })}</div>
                  <div className="text-2xl font-mono font-semibold text-orange-600 mt-1">{Number(data.pendingSettlementAmount || 0).toLocaleString()} HTG</div>
                </div>
              </div>
            </div>

            <h5 className="mb-2 text-800">{t('partner_portal.recent_tx', { defaultValue: 'Giao dịch Gần đây tại Đối tác' })}</h5>
            <DataTable value={data.recentTransactions || []} paginator rows={5} stripedRows responsiveLayout="scroll" emptyMessage={t('common.no_data', { defaultValue: 'Chưa có giao dịch gần đây.' })}>
              <Column field="transactionId" header={t('transaction.id', { defaultValue: 'Mã GD' })} body={(r: any) => <span className="font-mono white-space-nowrap">{r.transactionId}</span>} style={{ minWidth: '12rem' }} />
              <Column field="externalUserId" header={t('customer.phone', { defaultValue: 'Hội Viên' })} body={(r: any) => <span className="font-mono">{r.externalUserId}</span>} style={{ minWidth: '10rem' }} />
              <Column field="actionType" header={t('transaction.action_type', { defaultValue: 'Loại GD' })} style={{ minWidth: '8rem' }} />
              <Column field="points" header={t('transaction.amount', { defaultValue: 'Điểm' })} body={(r: any) => <span className="font-mono">{Number(r.points || 0).toLocaleString()}</span>} style={{ minWidth: '8rem', textAlign: 'right' }} />
            </DataTable>
          </>
        )}
      </div>
    </div>
  );
};

export default PartnerDashboardPage;
