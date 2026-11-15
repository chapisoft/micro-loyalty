import React, { useCallback, useEffect, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Skeleton } from 'primereact/skeleton';
import { useTranslation } from 'react-i18next';
import { AppBreadcrumb } from '@/components/AppBreadcrumb';
import { TenantSelector } from '@/components/TenantSelector';
import { LoyaltyService, PartnerPortalDashboardModel } from '@/service/loyalty.service';
import { StandardPageHeader } from '@/components/StandardPageHeader';

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
    <div className="w-full">
      <AppBreadcrumb items={[{ label: t('partner_portal.nav_dashboard') }]} />

      <StandardPageHeader
        title={t('partner_portal.dashboard_title')}
        subtitle={
          data
            ? `${data.partnerCode} — ${data.partnerName}`
            : t('partner_portal.dashboard_subtitle')
        }
        extraLeft={<TenantSelector value={selectedTenant} onChange={setSelectedTenant} />}
        onRefresh={fetchDashboard}
        refreshLoading={loading}
      />

      <div className="card shadow-1 border-round surface-card p-4">
        {loading ? (
          <div className="grid">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="col-12 md:col-3">
                <Skeleton height="6.5rem" />
              </div>
            ))}
          </div>
        ) : !data ? (
          <div className="text-center p-5 border-1 surface-border border-round surface-50 text-500">
            {t('partner_portal.no_dashboard')}
          </div>
        ) : (
          <>
            <div className="grid mb-4">
              <div className="col-12 md:col-3">
                <div className="p-3 border-round surface-50 border-1 surface-border">
                  <div className="text-xs text-500 uppercase">
                    {t('partner_portal.paying_customers')}
                  </div>
                  <div className="text-2xl font-mono font-semibold text-primary mt-1">
                    {Number(data.payingCustomersCount || 0).toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="col-12 md:col-3">
                <div className="p-3 border-round surface-50 border-1 surface-border">
                  <div className="text-xs text-500 uppercase">{t('partner_portal.burn_tx')}</div>
                  <div className="text-2xl font-mono font-semibold text-blue-600 mt-1">
                    {Number(data.burnTransactionsCount || 0).toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="col-12 md:col-3">
                <div className="p-3 border-round surface-50 border-1 surface-border">
                  <div className="text-xs text-500 uppercase">
                    {t('partner_portal.new_members')}
                  </div>
                  <div className="text-2xl font-mono font-semibold text-green-600 mt-1">
                    {Number(data.newMembersAcquired || 0).toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="col-12 md:col-3">
                <div className="p-3 border-round surface-50 border-1 surface-border">
                  <div className="text-xs text-500 uppercase">
                    {t('partner_portal.net_settlement')}
                  </div>
                  <div className="text-2xl font-mono font-semibold text-orange-600 mt-1">
                    {Number(data.pendingSettlementAmount || 0).toLocaleString()} HTG
                  </div>
                </div>
              </div>
            </div>

            <h5 className="mb-3 text-900 font-semibold">{t('partner_portal.recent_tx')}</h5>
            <DataTable
              value={data.recentTransactions || []}
              paginator
              rows={5}
              stripedRows
              responsiveLayout="scroll"
              emptyMessage={t('common.no_data')}
            >
              <Column
                field="transactionId"
                header={t('transaction.id')}
                body={(r: any) => (
                  <span className="font-bold font-mono text-900">{r.transactionId}</span>
                )}
                style={{ minWidth: '12rem' }}
              />
              <Column
                field="externalUserId"
                header={t('customer.phone')}
                body={(r: any) => (
                  <span className="text-900 font-mono">{r.externalUserId}</span>
                )}
                style={{ minWidth: '10rem' }}
              />
              <Column
                field="actionType"
                header={t('transaction.action_type')}
                body={(r: any) => <span className="text-900 text-sm">{r.actionType}</span>}
                style={{ minWidth: '8rem' }}
              />
              <Column
                field="points"
                header={t('transaction.amount')}
                body={(r: any) => (
                  <span className="text-900 font-mono">
                    {Number(r.points || 0).toLocaleString()}
                  </span>
                )}
                style={{ minWidth: '8rem', textAlign: 'right' }}
              />
            </DataTable>
          </>
        )}
      </div>
    </div>
  );
};

export default PartnerDashboardPage;
