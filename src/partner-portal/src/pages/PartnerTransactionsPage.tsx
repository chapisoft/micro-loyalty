import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Skeleton } from 'primereact/skeleton';
import { useTranslation } from 'react-i18next';
import { AppBreadcrumb } from '@/components/AppBreadcrumb';
import { TenantSelector } from '@/components/TenantSelector';
import { PointActionType } from '@/models';
import { LoyaltyService, PointLedgerItem } from '@/service/loyalty.service';
import { StandardPageHeader } from '@/components/StandardPageHeader';
import { UniversalFilterBar } from '@/components/UniversalFilterBar';
import { exportToExcel } from '@/components/exportHelper';

export const PartnerTransactionsPage: React.FC = () => {
  const { t } = useTranslation();

  const [selectedTenant, setSelectedTenant] = useState<string>(
    () => localStorage.getItem('selected_tenant_id') || 'TENANT_NATCASH'
  );
  const [items, setItems] = useState<PointLedgerItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const list = await LoyaltyService.getPartnerPortalTransactions(
        { keyword: keyword.trim() || undefined },
        selectedTenant
      );
      setItems(Array.isArray(list) ? list : []);
    } finally {
      setLoading(false);
    }
  }, [selectedTenant, keyword]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const filteredItems = useMemo(() => {
    if (!keyword.trim()) return items;
    const kw = keyword.toLowerCase();
    return items.filter(
      (item) =>
        item.transactionId?.toLowerCase().includes(kw) ||
        item.externalUserId?.toLowerCase().includes(kw) ||
        item.referenceId?.toLowerCase().includes(kw)
    );
  }, [items, keyword]);

  const handleExport = () => {
    exportToExcel(
      filteredItems,
      [
        { header: t('transaction.id'), field: 'transactionId' },
        { header: t('customer.phone'), field: 'externalUserId' },
        { header: t('transaction.action_type'), field: 'actionType' },
        { header: t('transaction.amount'), field: 'points' },
        { header: t('partner_portal.order_ref'), field: 'referenceId' },
        { header: t('common.created_at'), field: 'createdAt' },
      ],
      'giao_dich_doi_tac'
    );
  };

  return (
    <div className="w-full">
      <AppBreadcrumb items={[{ label: t('partner_portal.nav_transactions') }]} />

      <StandardPageHeader
        title={t('partner_portal.transactions_title')}
        subtitle={t('partner_portal.transactions_subtitle')}
        extraLeft={<TenantSelector value={selectedTenant} onChange={setSelectedTenant} />}
        onRefresh={fetchTransactions}
        refreshLoading={loading}
      />

      <div className="card shadow-1 border-round surface-card p-4">
        <UniversalFilterBar
          keyword={keyword}
          onKeywordChange={setKeyword}
          searchPlaceholder={t('common.search')}
          onReset={() => setKeyword('')}
          onExport={handleExport}
        />

        {loading ? (
          <div className="flex flex-column gap-2 mt-3">
            <Skeleton height="2.75rem" />
            <Skeleton height="2.75rem" />
            <Skeleton height="2.75rem" />
          </div>
        ) : (
          <DataTable<PointLedgerItem[]>
            value={filteredItems}
            paginator
            rows={15}
            stripedRows
            responsiveLayout="scroll"
            emptyMessage={t('common.no_data')}
            className="mt-3"
          >
            <Column
              field="transactionId"
              header={t('transaction.id')}
              body={(r: PointLedgerItem) => (
                <span className="font-bold font-mono text-900">{r.transactionId}</span>
              )}
              style={{ minWidth: '15rem' }}
            />
            <Column
              field="externalUserId"
              header={t('customer.phone')}
              body={(r: PointLedgerItem) => (
                <span className="text-900 font-mono">{r.externalUserId}</span>
              )}
              style={{ minWidth: '11rem' }}
            />
            <Column
              field="actionType"
              header={t('transaction.action_type')}
              body={(r: PointLedgerItem) => (
                <Tag
                  value={r.actionType}
                  severity={r.actionType === PointActionType.EARN ? 'success' : 'warning'}
                />
              )}
              style={{ minWidth: '8.5rem', textAlign: 'center' }}
            />
            <Column
              field="points"
              header={t('transaction.amount')}
              body={(r: PointLedgerItem) => (
                <span className="text-900 font-mono">
                  {r.points > 0 ? `+${r.points}` : r.points}
                </span>
              )}
              style={{ minWidth: '8rem', textAlign: 'right' }}
            />
            <Column
              field="referenceId"
              header={t('partner_portal.order_ref')}
              body={(r: PointLedgerItem) => (
                <span className="text-900 font-mono">{r.referenceId || '--'}</span>
              )}
              style={{ minWidth: '10rem' }}
            />
            <Column
              field="createdAt"
              header={t('common.created_at')}
              body={(r: PointLedgerItem) => (
                <span className="text-900 font-mono text-xs">
                  {r.createdAt ? new Date(r.createdAt).toLocaleString('vi-VN') : '--'}
                </span>
              )}
              style={{ minWidth: '12rem' }}
            />
          </DataTable>
        )}
      </div>
    </div>
  );
};

export default PartnerTransactionsPage;
