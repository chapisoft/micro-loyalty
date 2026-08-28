import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Tag } from 'primereact/tag';
import { AppBreadcrumb } from 'components';
import { ClearingStatus } from '@/models';
import { LoyaltyService } from '@/service/loyalty.service';

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

export const ClearingSettlementPage: React.FC = () => {
  const { t } = useTranslation();
  const [clearingList, setClearingList] = useState<PartnerClearingItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<PartnerClearingItem[]>([]);
  const [showConfirmSettle, setShowConfirmSettle] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [settleSuccessMsg, setSettleSuccessMsg] = useState<string | null>(null);

  const fetchClearingData = useCallback(async () => {
    setLoading(true);
    try {
      const report = await LoyaltyService.getClearingReport();
      if (report && report.partnerSummaries) {
        setClearingList(
          report.partnerSummaries.map((s, idx) => ({
            id: s.partnerId || idx + 1,
            partnerCode: s.partnerId === 1 ? 'DELIMART' : s.partnerId === 2 ? 'NATCOM' : `PARTNER_${s.partnerId}`,
            partnerName: s.partnerName,
            totalTransactions: s.totalTransactions || 0,
            totalPointsRedeemed: s.totalPointsRedeemed || 0,
            totalFiatReceivable: s.totalFiatReceivable || 0,
            totalFiatPayable: s.totalFiatPayable || 0,
            netSettlementAmount: s.netSettlementAmount || 0,
            status: (s.status as ClearingStatus) || ClearingStatus.PENDING,
          }))
        );
      }
    } catch (e) {
      console.error('[fetchClearingData] Error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClearingData();
  }, [fetchClearingData]);

  const totalTransactions = clearingList.reduce((sum, item) => sum + item.totalTransactions, 0);
  const totalPointsRedeemed = clearingList.reduce((sum, item) => sum + item.totalPointsRedeemed, 0);
  const totalNetSettlement = clearingList.reduce((sum, item) => sum + item.netSettlementAmount, 0);

  const handleSettlePeriod = async () => {
    setIsSubmitting(true);
    try {
      const res = await LoyaltyService.settleClearingPeriod();
      if (res && res.settlementBatchCode) {
        setSettleSuccessMsg(`Quyết toán thành công! Mã lô kết chuyển: ${res.settlementBatchCode}`);
      } else {
        setSettleSuccessMsg(res?.message || 'Quyết toán kết chuyển kỳ bù trừ thành công!');
      }
      setShowConfirmSettle(false);
      await fetchClearingData();
    } catch (e: any) {
      console.error('[handleSettlePeriod] Error:', e);
      alert('Không thể thực hiện quyết toán bù trừ: ' + (e?.message || 'Lỗi hệ thống'));
    } finally {
      setIsSubmitting(false);
    }
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
        <Button icon="pi pi-refresh" outlined onClick={fetchClearingData} loading={loading} />
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

      {settleSuccessMsg && (
        <div className="p-3 mb-3 border-round bg-green-50 text-green-800 border-1 border-green-200 flex align-items-center justify-content-between">
          <span><i className="pi pi-check-circle mr-2" />{settleSuccessMsg}</span>
          <Button icon="pi pi-times" text rounded severity="success" onClick={() => setSettleSuccessMsg(null)} />
        </div>
      )}

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
          loading={loading}
          emptyMessage={t('common.no_data', { defaultValue: 'Không có dữ liệu đối soát' })}
          stripedRows
          responsiveLayout="scroll"
        >
          <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
          <Column
            header={t('common.stt', { defaultValue: 'STT' })}
            body={(_, options) => options.rowIndex + 1}
            style={{ width: '4rem', textAlign: 'center' }}
          />
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
