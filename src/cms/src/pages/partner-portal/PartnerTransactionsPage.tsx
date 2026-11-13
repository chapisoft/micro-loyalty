import React, { useCallback, useEffect, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Tag } from 'primereact/tag';
import { Skeleton } from 'primereact/skeleton';
import { useTranslation } from 'react-i18next';
import { AppBreadcrumb } from 'components';
import { TenantSelector } from '@/components/TenantSelector';
import { LoyaltyService, PointLedgerItem } from '@/service/loyalty.service';
import * as XLSX from 'xlsx';

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

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(items);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'PartnerTransactions');
    XLSX.writeFile(wb, `partner_transactions_${selectedTenant}.xlsx`);
  };

  return (
    <div>
      <AppBreadcrumb items={[{ label: t('partner_portal.nav_transactions', { defaultValue: 'Partner Portal · Lịch sử Giao dịch (LM-11)' }) }]} />

      <div className="card shadow-1 border-round surface-card p-4">
        <div className="flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
          <div>
            <h4 className="m-0 text-primary font-semibold">{t('partner_portal.transactions_title', { defaultValue: 'Lịch sử Giao dịch Tích & Tiêu điểm Đối tác (LM-11)' })}</h4>
            <p className="m-0 text-xs text-500 mt-1">{t('partner_portal.transactions_subtitle', { defaultValue: 'Tra cứu giao dịch theo mã GD, số điện thoại hội viên và xuất Excel đối soát.' })}</p>
          </div>
          <div className="flex flex-wrap gap-2 align-items-center">
            <TenantSelector value={selectedTenant} onChange={setSelectedTenant} />
            <span className="p-input-icon-left">
              <i className="pi pi-search" />
              <InputText value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder={t('common.search', { defaultValue: 'Tìm Mã GD, SĐT...' })} className="w-14rem p-inputtext-sm" />
            </span>
            <Button label={t('common.export_excel', { defaultValue: 'Xuất Excel' })} icon="pi pi-file-excel" severity="success" outlined size="small" onClick={handleExport} disabled={items.length === 0} />
            <Button icon="pi pi-refresh" outlined rounded onClick={fetchTransactions} loading={loading} />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-column gap-2"><Skeleton height="2.75rem" /><Skeleton height="2.75rem" /><Skeleton height="2.75rem" /></div>
        ) : (
          <DataTable<PointLedgerItem> value={items} paginator rows={15} stripedRows responsiveLayout="scroll" emptyMessage={t('common.no_data', { defaultValue: 'Chưa phát sinh giao dịch nào tại đối tác.' })}>
            <Column field="transactionId" header={t('transaction.id', { defaultValue: 'Mã GD' })} body={(r) => <span className="font-mono white-space-nowrap font-medium text-primary">{r.transactionId}</span>} style={{ minWidth: '15rem' }} />
            <Column field="externalUserId" header={t('customer.phone', { defaultValue: 'Hội Viên' })} body={(r) => <span className="font-mono white-space-nowrap">{r.externalUserId}</span>} style={{ minWidth: '11rem' }} />
            <Column field="actionType" header={t('transaction.action_type', { defaultValue: 'Loại GD' })} body={(r) => <Tag value={r.actionType} severity={r.actionType === 'EARN' ? 'success' : 'warning'} />} style={{ minWidth: '8.5rem', textAlign: 'center' }} />
            <Column field="points" header={t('transaction.amount', { defaultValue: 'Biến Động' })} body={(r) => <span className="font-mono">{r.points > 0 ? `+${r.points}` : r.points}</span>} style={{ minWidth: '8rem', textAlign: 'right' }} />
            <Column field="amount" header={t('partner_portal.bill_amount', { defaultValue: 'Giá Trị Đơn' })} body={(r) => <span className="font-mono">{Number(r.amount || 0).toLocaleString()} HTG</span>} style={{ minWidth: '10rem', textAlign: 'right' }} />
            <Column field="createdAt" header={t('common.created_at', { defaultValue: 'Thời Gian' })} body={(r) => <span className="font-mono white-space-nowrap text-xs">{r.createdAt ? new Date(r.createdAt).toLocaleString('vi-VN') : '--'}</span>} style={{ minWidth: '12rem' }} />
          </DataTable>
        )}
      </div>
    </div>
  );
};

export default PartnerTransactionsPage;
