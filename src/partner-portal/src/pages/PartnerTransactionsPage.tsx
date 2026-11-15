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
import { StandardRowActions } from '@/components/StandardRowActions';
import { exportToExcel } from '@/components/exportHelper';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';

export const PartnerTransactionsPage: React.FC = () => {
  const { t } = useTranslation();

  const [selectedTenant, setSelectedTenant] = useState<string>(
    () => localStorage.getItem('selected_tenant_id') || 'TENANT_NATCASH'
  );
  const [items, setItems] = useState<PointLedgerItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [selectedTx, setSelectedTx] = useState<PointLedgerItem | null>(null);

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
              header={t('common.order_number', 'STT')}
              body={(_, opt) => opt.rowIndex + 1}
              style={{ width: '4rem', textAlign: 'center' }}
            />
            <Column
              header={t('common.action', 'Thao tác')}
              body={(r: PointLedgerItem) => (
                <StandardRowActions
                  actions={[
                    {
                      icon: 'pi pi-eye',
                      label: t('common.view', 'Xem chi tiết'),
                      onClick: () => setSelectedTx(r),
                    },
                  ]}
                />
              )}
              style={{ width: '6rem', textAlign: 'center' }}
            />
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
          </DataTable>
        )}
      </div>

      <Dialog
        visible={!!selectedTx}
        onHide={() => setSelectedTx(null)}
        header={t('transaction.details', 'Chi tiết giao dịch')}
        style={{ width: '32rem' }}
        modal
      >
        {selectedTx && (
          <div className="flex flex-column gap-3">
            <div className="flex justify-content-between border-bottom-1 surface-border py-2">
              <span className="text-600">{t('transaction.id')}:</span>
              <span className="font-bold font-mono text-900">{selectedTx.transactionId}</span>
            </div>
            <div className="flex justify-content-between border-bottom-1 surface-border py-2">
              <span className="text-600">{t('customer.phone')}:</span>
              <span className="text-900 font-mono">{selectedTx.externalUserId}</span>
            </div>
            <div className="flex justify-content-between border-bottom-1 surface-border py-2">
              <span className="text-600">{t('transaction.action_type')}:</span>
              <Tag
                value={selectedTx.actionType}
                severity={selectedTx.actionType === PointActionType.EARN ? 'success' : 'warning'}
              />
            </div>
            <div className="flex justify-content-between border-bottom-1 surface-border py-2">
              <span className="text-600">{t('transaction.amount')}:</span>
              <span className="text-900 font-mono font-bold">
                {selectedTx.points > 0 ? `+${selectedTx.points}` : selectedTx.points}
              </span>
            </div>
            <div className="flex justify-content-between border-bottom-1 surface-border py-2">
              <span className="text-600">{t('partner_portal.order_ref')}:</span>
              <span className="text-900 font-mono">{selectedTx.referenceId || '--'}</span>
            </div>
            <div className="flex justify-content-between py-2">
              <span className="text-600">{t('common.created_at')}:</span>
              <span className="text-900 font-mono text-xs">
                {selectedTx.createdAt ? new Date(selectedTx.createdAt).toLocaleString('vi-VN') : '--'}
              </span>
            </div>
            <div className="flex justify-content-end mt-3">
              <Button label={t('common.close', 'Đóng')} outlined onClick={() => setSelectedTx(null)} />
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};

export default PartnerTransactionsPage;
