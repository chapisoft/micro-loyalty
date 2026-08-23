import React, { useEffect, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Tag } from 'primereact/tag';
import { useTranslation } from 'react-i18next';
import { Transaction, transactionService } from '@/service/transaction.service';
import { AppBreadcrumb } from 'components';

export const Transactions: React.FC = () => {
  const { t } = useTranslation();
  const [items, setItems] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [globalFilter, setGlobalFilter] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await transactionService.getAll();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('[Transactions.fetchData] Error:', e);
      setItems([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const statusBodyTemplate = (rowData: Transaction) => {
    if (rowData.status === 1) {
      return <Tag severity="success" value={t('common.success', { defaultValue: 'Thành công' })} />;
    }
    if (rowData.status === 2) {
      return <Tag severity="danger" value={t('common.failed', { defaultValue: 'Thất bại' })} />;
    }
    return <Tag severity="warning" value={t('common.pending', { defaultValue: 'Đang xử lý' })} />;
  };

  const amountTemplate = (rowData: Transaction) => {
    if (rowData.amount === null || rowData.amount === undefined) return '-';
    return (
      <span className="font-bold" style={{ color: '#FF6B00' }}>
        {rowData.amount.toLocaleString()} {rowData.currency || 'HTG'}
      </span>
    );
  };

  const dateTemplate = (rowData: Transaction) => {
    if (!rowData.createdAt) return '-';
    try {
      const d = new Date(rowData.createdAt);
      if (isNaN(d.getTime())) return rowData.createdAt;
      return d.toLocaleString('vi-VN');
    } catch {
      return rowData.createdAt;
    }
  };

  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <h4 className="m-0 text-primary font-bold">{t('transaction.management_title', { defaultValue: 'Nhật ký Xác thực Giao dịch Smart OTP' })}</h4>
      <div className="flex gap-2">
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            type="search"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder={t('transaction.search_placeholder', { defaultValue: 'Tìm theo Mã GD, SĐT...' })}
          />
        </span>
        <Button icon="pi pi-refresh" rounded outlined onClick={fetchData} tooltip={t('common.refresh', { defaultValue: 'Làm mới' })} />
      </div>
    </div>
  );

  return (
    <div>
      <AppBreadcrumb items={[{ label: t('nav.transactions', { defaultValue: 'Giao dịch OTP' }) }]} />
      <div className="card shadow-1 border-round surface-card p-4">
        <DataTable
          value={items}
          loading={loading}
          header={header}
          globalFilter={globalFilter}
          dataKey="id"
          paginator
          rows={15}
          rowsPerPageOptions={[15, 30, 50]}
          emptyMessage={t('common.no_data', { defaultValue: 'Không có dữ liệu giao dịch' })}
          stripedRows
          responsiveLayout="scroll"
        >
          <Column field="transactionId" header={t('transaction.id', { defaultValue: 'Mã Giao dịch' })} sortable style={{ minWidth: '13rem' }} />
          <Column field="partnerCode" header={t('transaction.partner', { defaultValue: 'Đối tác' })} sortable style={{ minWidth: '8rem' }} />
          <Column field="phoneNumber" header={t('transaction.phone', { defaultValue: 'Số điện thoại' })} sortable style={{ minWidth: '10rem' }} />
          <Column field="amount" body={amountTemplate} header={t('transaction.amount', { defaultValue: 'Số tiền' })} sortable style={{ minWidth: '11rem' }} />
          <Column field="status" body={statusBodyTemplate} header={t('common.status', { defaultValue: 'Trạng thái' })} sortable style={{ minWidth: '9rem' }} />
          <Column field="createdAt" body={dateTemplate} header={t('common.created_at', { defaultValue: 'Thời gian tạo' })} sortable style={{ minWidth: '13rem' }} />
        </DataTable>
      </div>
    </div>
  );
};

export default Transactions;
