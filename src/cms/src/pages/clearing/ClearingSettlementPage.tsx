import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Tag } from 'primereact/tag';
import { TabView, TabPanel } from 'primereact/tabview';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { AppBreadcrumb } from 'components';
import { ClearingStatus } from '@/models';
import { LoyaltyService, DisputeItemModel } from '@/service/loyalty.service';

interface PartnerClearingItem {
  id: number;
  partnerCode: string;
  partnerName: string;
  totalTransactions: number;
  totalPointsRedeemed: number;
  totalFiatReceivable: number;
  totalFiatPayable: number;
  totalCommissionFee: number;
  netSettlementAmount: number;
  status: ClearingStatus;
}

export const ClearingSettlementPage: React.FC = () => {
  const { t } = useTranslation();
  const [clearingList, setClearingList] = useState<PartnerClearingItem[]>([]);
  const [disputeList, setDisputeList] = useState<DisputeItemModel[]>([]);
  const [selectedItems, setSelectedItems] = useState<PartnerClearingItem[]>([]);
  const [showConfirmSettle, setShowConfirmSettle] = useState(false);
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState<DisputeItemModel | null>(null);
  const [resolveStatus, setResolveStatus] = useState<string>('RESOLVED');
  const [resolvedAmount, setResolvedAmount] = useState<number>(0);
  const [resolveNote, setResolveNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [settleSuccessMsg, setSettleSuccessMsg] = useState<string | null>(null);

  const fetchClearingData = useCallback(async () => {
    setLoading(true);
    try {
      const [report, disputes] = await Promise.all([
        LoyaltyService.getClearingReport(),
        LoyaltyService.getDisputes(),
      ]);

      if (report && report.partnerSummaries) {
        setClearingList(
          report.partnerSummaries.map((s, idx) => ({
            id: s.partnerId || idx + 1,
            partnerCode: s.partnerCode || (s.partnerId === 1 ? 'DELIMART' : s.partnerId === 2 ? 'NATCOM' : `PARTNER_${s.partnerId}`),
            partnerName: s.partnerName,
            totalTransactions: s.totalTransactions || 0,
            totalPointsRedeemed: s.totalPointsRedeemed || 0,
            totalFiatReceivable: s.totalFiatReceivable || 0,
            totalFiatPayable: s.totalFiatPayable || 0,
            totalCommissionFee: s.totalCommissionFee || 0,
            netSettlementAmount: s.netSettlementAmount || 0,
            status: (s.status as ClearingStatus) || ClearingStatus.PENDING,
          }))
        );
      }

      if (Array.isArray(disputes)) {
        setDisputeList(disputes);
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
  const totalCommission = clearingList.reduce((sum, item) => sum + item.totalCommissionFee, 0);
  const totalNetSettlement = clearingList.reduce((sum, item) => sum + item.netSettlementAmount, 0);

  const handleSettlePeriod = async () => {
    setIsSubmitting(true);
    try {
      const res = await LoyaltyService.settleClearingPeriod();
      if (res && res.settlementBatchCode) {
        setSettleSuccessMsg(t('clearing.batch_success', { code: res.settlementBatchCode, defaultValue: `Quyết toán thành công! Mã lô kết chuyển: ${res.settlementBatchCode}` }));
      } else {
        setSettleSuccessMsg(res?.message || t('clearing.settle_success', { defaultValue: 'Quyết toán kết chuyển kỳ bù trừ thành công!' }));
      }
      setShowConfirmSettle(false);
      await fetchClearingData();
    } catch (e: any) {
      console.error('[handleSettlePeriod] Error:', e);
      alert(t('clearing.settle_error', { error: e?.message || '', defaultValue: 'Không thể thực hiện quyết toán bù trừ: ' + (e?.message || '') }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenResolve = (dispute: DisputeItemModel) => {
    setSelectedDispute(dispute);
    setResolveStatus('RESOLVED');
    setResolvedAmount(dispute.partnerAmount || dispute.loyaltyAmount || 0);
    setResolveNote('');
    setShowResolveDialog(true);
  };

  const handleSaveResolve = async () => {
    if (!selectedDispute) return;
    setIsSubmitting(true);
    try {
      await LoyaltyService.resolveDispute(selectedDispute.disputeCode, resolveStatus, resolvedAmount, resolveNote);
      setShowResolveDialog(false);
      await fetchClearingData();
    } catch (e: any) {
      console.error('[resolveDispute] Error:', e);
      alert('Không thể cập nhật xử lý khiếu nại: ' + (e?.message || ''));
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
      <span className={`font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? '+' : ''}{rowData.netSettlementAmount.toLocaleString()} HTG
      </span>
    );
  };

  const disputeStatusTemplate = (status: string) => {
    switch (status) {
      case 'RESOLVED':
        return <Tag severity="success" value="Đã xử lý" />;
      case 'REJECTED':
        return <Tag severity="danger" value="Bác bỏ" />;
      case 'IN_REVIEW':
        return <Tag severity="warning" value="Đang xem xét" />;
      default:
        return <Tag severity="info" value="Mới mở" />;
    }
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
        <div className="col-12 md:col-3">
          <div className="card shadow-1 border-round surface-card p-4">
            <span className="text-500 font-medium block mb-2">{t('clearing.total_txs', { defaultValue: 'Tổng số giao dịch' })}</span>
            <div className="text-900 font-bold text-2xl">{totalTransactions.toLocaleString()}</div>
          </div>
        </div>
        <div className="col-12 md:col-3">
          <div className="card shadow-1 border-round surface-card p-4">
            <span className="text-500 font-medium block mb-2">{t('clearing.total_points_redeemed', { defaultValue: 'Tổng điểm tiêu dùng' })}</span>
            <div className="text-primary font-bold text-2xl">{totalPointsRedeemed.toLocaleString()} {t('common.points', { defaultValue: 'Điểm' })}</div>
          </div>
        </div>
        <div className="col-12 md:col-3">
          <div className="card shadow-1 border-round surface-card p-4">
            <span className="text-500 font-medium block mb-2">Tổng phí hoa hồng sàn (MDR)</span>
            <div className="text-orange-600 font-bold text-2xl">{totalCommission.toLocaleString()} HTG</div>
          </div>
        </div>
        <div className="col-12 md:col-3">
          <div className="card shadow-1 border-round surface-card p-4">
            <span className="text-500 font-medium block mb-2">{t('clearing.net_amount', { defaultValue: 'Tổng thanh toán ròng' })}</span>
            <div className={`font-bold text-2xl ${totalNetSettlement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalNetSettlement >= 0 ? '+' : ''}{totalNetSettlement.toLocaleString()} HTG
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-1 border-round surface-card p-4">
        <TabView>
          <TabPanel header="Bảng Tổng Hợp Đối Soát Bù Trừ" leftIcon="pi pi-table mr-2">
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
                style={{ width: '3.5rem', textAlign: 'center' }}
              />
              <Column field="partnerCode" header={t('partner.code', { defaultValue: 'Mã Đối Tác' })} sortable style={{ minWidth: '8.5rem', fontWeight: 600 }} />
              <Column field="partnerName" header={t('clearing.partner_name', { defaultValue: 'Tên Đối Tác' })} sortable style={{ minWidth: '12rem' }} />
              <Column field="totalTransactions" header={<span title={t('clearing.total_txs_tooltip', { defaultValue: 'Tổng số giao dịch đối soát trong kỳ' })}>{t('clearing.total_txs', { defaultValue: 'Số GD' })}</span>} sortable style={{ minWidth: '6rem', textAlign: 'center' }} />
              <Column field="totalPointsRedeemed" header={<span title={t('clearing.total_points_tooltip', { defaultValue: 'Tổng điểm tiêu dùng liên minh' })}>{t('clearing.total_points_redeemed', { defaultValue: 'Điểm Tiêu' })}</span>} body={(row: PartnerClearingItem) => row.totalPointsRedeemed.toLocaleString()} sortable style={{ minWidth: '7.5rem', textAlign: 'center' }} />
              <Column field="totalFiatReceivable" header={<span title={t('clearing.receivable_tooltip', { defaultValue: 'Tổng số tiền phải thu từ đối tác (HTG)' })}>{t('clearing.total_fiat_receivable', { defaultValue: 'Phải Thu' })}</span>} body={(row: PartnerClearingItem) => `${row.totalFiatReceivable.toLocaleString()} HTG`} sortable style={{ minWidth: '8rem', textAlign: 'center' }} />
              <Column field="totalCommissionFee" header={<span title="Tổng phí hoa hồng sàn MDR thu từ đối tác">Phí Sàn MDR</span>} body={(row: PartnerClearingItem) => `${(row.totalCommissionFee || 0).toLocaleString()} HTG`} sortable style={{ minWidth: '8rem', textAlign: 'center' }} />
              <Column field="netSettlementAmount" body={netAmountTemplate} header={<span title={t('clearing.net_amount_tooltip', { defaultValue: 'Số tiền chênh lệch bù trừ ròng sau phí (HTG)' })}>{t('clearing.net_amount', { defaultValue: 'Quyết Toán Ròng' })}</span>} sortable style={{ minWidth: '9.5rem', textAlign: 'center' }} />
              <Column field="status" body={(row: PartnerClearingItem) => statusTemplate(row.status)} header={t('common.status', { defaultValue: 'Trạng Thái' })} sortable style={{ minWidth: '8rem', textAlign: 'center' }} />
            </DataTable>
          </TabPanel>

          <TabPanel header={`Xử Lý Sai Lệch & Khiếu Nại (${disputeList.length})`} leftIcon="pi pi-exclamation-triangle mr-2">
            <DataTable
              value={disputeList}
              paginator
              rows={10}
              emptyMessage="Chưa có khiếu nại sai lệch nào được ghi nhận"
              stripedRows
              responsiveLayout="scroll"
            >
              <Column header="STT" body={(_, options) => options.rowIndex + 1} style={{ width: '3.5rem', textAlign: 'center' }} />
              <Column field="disputeCode" header="Mã Khiếu Nại" sortable style={{ minWidth: '9.5rem', fontWeight: 600 }} />
              <Column field="partnerName" header="Đối Tác" sortable style={{ minWidth: '11rem' }} />
              <Column field="batchCode" header="Mã Lô" sortable style={{ minWidth: '9rem' }} />
              <Column field="disputeType" header="Loại Lệch" body={(row: DisputeItemModel) => <Tag severity="warning" value={row.disputeType} />} style={{ minWidth: '8.5rem', textAlign: 'center' }} />
              <Column field="partnerAmount" header="Số Tiền Đối Tác" body={(row: DisputeItemModel) => `${(row.partnerAmount || 0).toLocaleString()} HTG`} sortable style={{ minWidth: '9rem', textAlign: 'center' }} />
              <Column field="loyaltyAmount" header="Số Tiền Hệ Thống" body={(row: DisputeItemModel) => `${(row.loyaltyAmount || 0).toLocaleString()} HTG`} sortable style={{ minWidth: '9rem', textAlign: 'center' }} />
              <Column field="status" header="Trạng Thái" body={(row: DisputeItemModel) => disputeStatusTemplate(row.status)} sortable style={{ minWidth: '8rem', textAlign: 'center' }} />
              <Column
                header="Thao Tác"
                body={(row: DisputeItemModel) => (
                  <Button
                    label="Xử lý"
                    icon="pi pi-check"
                    size="small"
                    outlined
                    onClick={() => handleOpenResolve(row)}
                  />
                )}
                style={{ width: '7rem', textAlign: 'center' }}
              />
            </DataTable>
          </TabPanel>
        </TabView>
      </div>

      {/* Dialog Xác Nhận Quyết Toán */}
      <Dialog
        visible={showConfirmSettle}
        style={{ width: '30rem' }}
        header={t('clearing.settle_confirm_title', { defaultValue: 'Xác nhận Quyết toán Kỳ Bù trừ' })}
        modal
        onHide={() => setShowConfirmSettle(false)}
      >
        <div className="flex align-items-center gap-3 mb-4">
          <i className="pi pi-exclamation-triangle text-3xl text-warning" />
          <span>{t('clearing.settle_confirm_msg', { defaultValue: 'Bạn có chắc chắn muốn chốt quyết toán và kết chuyển công nợ kỳ này? Các giao dịch sau khi kết chuyển sẽ chuyển sang trạng thái ĐÃ QUYẾT TOÁN và bắn Webhook thông báo cho đối tác.' })}</span>
        </div>
        <div className="flex justify-content-end gap-2">
          <Button label={t('common.cancel', { defaultValue: 'Hủy' })} icon="pi pi-times" outlined onClick={() => setShowConfirmSettle(false)} disabled={isSubmitting} />
          <Button label={t('common.confirm', { defaultValue: 'Xác nhận Quyết toán' })} icon="pi pi-check" severity="success" onClick={handleSettlePeriod} loading={isSubmitting} disabled={isSubmitting} />
        </div>
      </Dialog>

      {/* Dialog Xử Lý Khiếu Nại */}
      <Dialog
        visible={showResolveDialog}
        style={{ width: '32rem' }}
        header={`Xử lý khiếu nại ${selectedDispute?.disputeCode || ''}`}
        modal
        onHide={() => setShowResolveDialog(false)}
      >
        <div className="p-fluid">
          <div className="field mb-3">
            <label className="font-bold">Kết luận xử lý</label>
            <Dropdown
              value={resolveStatus}
              options={[
                { label: 'Chấp thuận giải quyết (RESOLVED)', value: 'RESOLVED' },
                { label: 'Bác bỏ khiếu nại (REJECTED)', value: 'REJECTED' },
              ]}
              onChange={(e) => setResolveStatus(e.value)}
            />
          </div>

          <div className="field mb-3">
            <label className="font-bold">Số tiền thống nhất thanh toán bù trừ (HTG)</label>
            <InputNumber
              value={resolvedAmount}
              onValueChange={(e) => setResolvedAmount(e.value || 0)}
              mode="decimal"
              minFractionDigits={2}
              suffix=" HTG"
            />
          </div>

          <div className="field mb-3">
            <label className="font-bold">Ghi chú kết luận đối soát</label>
            <InputText
              value={resolveNote}
              onChange={(e) => setResolveNote(e.target.value)}
              placeholder="Nhập lý do hoặc mã chứng từ điều chỉnh..."
            />
          </div>
        </div>

        <div className="flex justify-content-end gap-2 mt-4">
          <Button label="Hủy" icon="pi pi-times" outlined onClick={() => setShowResolveDialog(false)} />
          <Button label="Lưu kết luận" icon="pi pi-check" severity="success" onClick={handleSaveResolve} loading={isSubmitting} />
        </div>
      </Dialog>
    </div>
  );
};

export default ClearingSettlementPage;
