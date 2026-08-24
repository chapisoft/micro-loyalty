import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Tag } from 'primereact/tag';
import { Calendar } from 'primereact/calendar';
import { AppBreadcrumb } from 'components';
import { ClearingStatus } from '@/models';

interface PartnerClearingItem {
  id: number;
  partnerCode: string;
  partnerName: string;
  totalTransactions: number;
  totalPointsRedeemed: number;
  totalFiatReceivable: number;
  totalFiatPayable: number;
  netSettlementAmount: number;
  status: ClearingStatus;
}

const INITIAL_CLEARING_SUMMARIES: PartnerClearingItem[] = [
  {
    id: 1,
    partnerCode: 'DELIMART_SUPERMARKET',
    partnerName: 'Hệ Thống Siêu Thị Delimart Port-au-Prince',
    totalTransactions: 1420,
    totalPointsRedeemed: 142000,
    totalFiatReceivable: 142000,
    totalFiatPayable: 0,
    netSettlementAmount: 142000, // Natcash cần chuyển trả Delimart 142.000 HTG
    status: ClearingStatus.PENDING,
  },
  {
    id: 2,
    partnerCode: 'NATCOM_TELECOM',
    partnerName: 'Công Ty Viễn Thông Natcom',
    totalTransactions: 890,
    totalPointsRedeemed: 44500,
    totalFiatReceivable: 0,
    totalFiatPayable: 44500,
    netSettlementAmount: -44500, // Natcom cần quyết toán 44.500 HTG
    status: ClearingStatus.PENDING,
  },
];

export const ClearingSettlementPage: React.FC = () => {
  const { t } = useTranslation();
  const [clearingList, setClearingList] = useState<PartnerClearingItem[]>(INITIAL_CLEARING_SUMMARIES);
  const [selectedItems, setSelectedItems] = useState<PartnerClearingItem[]>([]);
  const [fromDate, setFromDate] = useState<Date | null>(new Date(2026, 7, 1));
  const [toDate, setToDate] = useState<Date | null>(new Date(2026, 7, 23));
  const [showConfirmSettle, setShowConfirmSettle] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalTransactions = clearingList.reduce((sum, item) => sum + item.totalTransactions, 0);
  const totalPointsRedeemed = clearingList.reduce((sum, item) => sum + item.totalPointsRedeemed, 0);
  const totalNetSettlement = clearingList.reduce((sum, item) => sum + item.netSettlementAmount, 0);

  const handleSettlePeriod = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setClearingList(clearingList.map((item) => ({ ...item, status: ClearingStatus.SETTLED })));
      setIsSubmitting(false);
      setShowConfirmSettle(false);
    }, 500);
  };

  const statusTemplate = (status: ClearingStatus) => {
    return status === ClearingStatus.SETTLED ? (
      <Tag severity="success" value={t('common.settled', { defaultValue: 'Đã quyết toán' })} />
    ) : (
      <Tag severity="warning" value={t('common.pending', { defaultValue: 'Chờ quyết toán' })} />
    );
  };

  const netAmountTemplate = (rowData: PartnerClearingItem) => {
    const isPositive = rowData.netSettlementAmount >= 0;
    return (
      <span className={`font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? '+' : ''}{rowData.netSettlementAmount.toLocaleString()} HTG
      </span>
    );
  };

  const header = (
    <div className="flex flex-wrap gap-3 align-items-center justify-content-between">
      <h4 className="m-0 text-primary font-bold">{t('clearing.management_title', { defaultValue: 'Quyết Toán Bù Trừ Tài Chính Đa Phương' })}</h4>
      <div className="flex flex-wrap gap-2">
        <Button label={t('clearing.export_excel', { defaultValue: 'Xuất File Đối Soát' })} icon="pi pi-file-excel" severity="info" outlined />
        <Button
          label={t('clearing.settle_period', { defaultValue: 'Kết Chuyển Kỳ Quyết Toán' })}
          icon="pi pi-check-circle"
          severity="success"
          onClick={() => setShowConfirmSettle(true)}
        />
      </div>
    </div>
  );

  return (
    <div>
      <AppBreadcrumb items={[{ label: t('nav.clearing', { defaultValue: 'Bù Trừ & Quyết Toán' }) }]} />

      {/* Thẻ Thống Kê Tổng Quan */}
      <div className="grid mb-4">
        <div className="col-12 md:col-4">
          <div className="card shadow-1 border-round surface-card p-4">
            <span className="text-500 font-medium block mb-2">{t('clearing.total_txs', { defaultValue: 'Tổng số giao dịch tiêu điểm' })}</span>
            <div className="text-900 font-bold text-2xl">{totalTransactions.toLocaleString()}</div>
          </div>
        </div>
        <div className="col-12 md:col-4">
          <div className="card shadow-1 border-round surface-card p-4">
            <span className="text-500 font-medium block mb-2">{t('clearing.total_points_redeemed', { defaultValue: 'Tổng điểm tiêu dùng liên minh' })}</span>
            <div className="text-primary font-bold text-2xl">{totalPointsRedeemed.toLocaleString()} Điểm</div>
          </div>
        </div>
        <div className="col-12 md:col-4">
          <div className="card shadow-1 border-round surface-card p-4">
            <span className="text-500 font-medium block mb-2">{t('clearing.net_amount', { defaultValue: 'Tổng công nợ ròng kỳ' })}</span>
            <div className="text-green-600 font-bold text-2xl">+{totalNetSettlement.toLocaleString()} HTG</div>
          </div>
        </div>
      </div>

      <div className="card shadow-1 border-round surface-card p-4">
        <DataTable<any>
          value={clearingList}
          selection={selectedItems}
          onSelectionChange={(e: any) => setSelectedItems(e.value || [])}
          header={header}
          dataKey="id"
          paginator
          rows={10}
          emptyMessage={t('common.no_data', { defaultValue: 'Không có dữ liệu đối soát' })}
          stripedRows
          responsiveLayout="scroll"
        >
          {/* Cột 1: Checkbox */}
          <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />

          {/* Cột 2: STT */}
          <Column
            header={t('common.stt', { defaultValue: 'STT' })}
            body={(_, options) => options.rowIndex + 1}
            style={{ width: '4rem', textAlign: 'center' }}
          />

          {/* Cột 3: Thao tác */}
          <Column
            body={() => (
              <Button icon="pi pi-eye" rounded outlined severity="info" size="small" tooltip={t('common.view', { defaultValue: 'Xem chi tiết' })} />
            )}
            header={t('common.actions', { defaultValue: 'Thao tác' })}
            style={{ width: '6rem' }}
          />

          {/* Cột 4 trở đi: Dữ liệu */}
          <Column field="partnerCode" header={t('partner.code', { defaultValue: 'Mã Đối tác' })} sortable style={{ minWidth: '10rem' }} />
          <Column field="partnerName" header={t('clearing.partner_name', { defaultValue: 'Đơn vị Đối tác' })} sortable style={{ minWidth: '16rem' }} />
          <Column field="totalTransactions" header={t('clearing.total_txs', { defaultValue: 'Số Giao dịch' })} sortable style={{ minWidth: '9rem', textAlign: 'center' }} />
          <Column field="totalPointsRedeemed" header={t('clearing.total_points_redeemed', { defaultValue: 'Điểm tiêu dùng' })} body={(row: PartnerClearingItem) => row.totalPointsRedeemed.toLocaleString()} sortable style={{ minWidth: '10rem' }} />
          <Column field="totalFiatReceivable" header={t('clearing.total_fiat_receivable', { defaultValue: 'Phải thu (HTG)' })} body={(row: PartnerClearingItem) => `${row.totalFiatReceivable.toLocaleString()} HTG`} sortable style={{ minWidth: '10rem' }} />
          <Column field="totalFiatPayable" header={t('clearing.total_fiat_payable', { defaultValue: 'Phải trả (HTG)' })} body={(row: PartnerClearingItem) => `${row.totalFiatPayable.toLocaleString()} HTG`} sortable style={{ minWidth: '10rem' }} />
          <Column field="netSettlementAmount" body={netAmountTemplate} header={t('clearing.net_amount', { defaultValue: 'Dư nợ ròng (HTG)' })} sortable style={{ minWidth: '11rem' }} />
          <Column field="status" body={(row: PartnerClearingItem) => statusTemplate(row.status)} header={t('common.status', { defaultValue: 'Trạng thái' })} sortable style={{ minWidth: '9rem' }} />
        </DataTable>
      </div>

      <Dialog
        visible={showConfirmSettle}
        style={{ width: '30rem' }}
        header={t('clearing.settle_confirm_title', { defaultValue: 'Xác nhận Quyết toán Kỳ Bù trừ' })}
        modal
        onHide={() => setShowConfirmSettle(false)}
      >
        <div className="flex align-items-center gap-3 mb-4">
          <i className="pi pi-exclamation-triangle text-3xl text-warning" />
          <span>{t('clearing.settle_confirm_msg', { defaultValue: 'Bạn có chắc chắn muốn chốt quyết toán và kết chuyển công nợ kỳ này? Các giao dịch sau khi kết chuyển sẽ chuyển sang trạng thái ĐÃ QUYẾT TOÁN.' })}</span>
        </div>
        <div className="flex justify-content-end gap-2">
          <Button label={t('common.cancel', { defaultValue: 'Hủy' })} icon="pi pi-times" outlined onClick={() => setShowConfirmSettle(false)} disabled={isSubmitting} />
          <Button label={t('common.confirm', { defaultValue: 'Xác nhận Quyết toán' })} icon="pi pi-check" severity="success" onClick={handleSettlePeriod} loading={isSubmitting} disabled={isSubmitting} />
        </div>
      </Dialog>
    </div>
  );
};

export default ClearingSettlementPage;
