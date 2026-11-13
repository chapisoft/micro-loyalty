import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputNumber } from 'primereact/inputnumber';
import { InputTextarea } from 'primereact/inputtextarea';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { Skeleton } from 'primereact/skeleton';
import { useTranslation } from 'react-i18next';
import { AppBreadcrumb } from 'components';
import { TenantSelector } from '@/components/TenantSelector';
import { PaymentBatchStatus } from '@/models';
import { LoyaltyService, PartnerSettlementBatchModel } from '@/service/loyalty.service';

export const PartnerSettlementPage: React.FC = () => {
  const { t } = useTranslation();
  const toast = useRef<Toast>(null);

  const [selectedTenant, setSelectedTenant] = useState<string>(
    () => localStorage.getItem('selected_tenant_id') || 'TENANT_NATCASH'
  );
  const [batches, setBatches] = useState<PartnerSettlementBatchModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [claimBatch, setClaimBatch] = useState<PartnerSettlementBatchModel | null>(null);
  const [claimAmount, setClaimAmount] = useState<number>(0);
  const [claimReason, setClaimReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchSettlements = useCallback(async () => {
    setLoading(true);
    try {
      const list = await LoyaltyService.getPartnerPortalSettlements(selectedTenant);
      setBatches(Array.isArray(list) ? list : []);
    } finally {
      setLoading(false);
    }
  }, [selectedTenant]);

  useEffect(() => {
    fetchSettlements();
  }, [fetchSettlements]);

  const handleConfirm = async (batch: PartnerSettlementBatchModel) => {
    setSubmitting(true);
    try {
      await LoyaltyService.confirmPartnerSettlement(batch.batchCode, selectedTenant);
      toast.current?.show({ severity: 'success', summary: t('common.success', { defaultValue: 'Đã xác nhận' }), detail: `${batch.batchCode}` });
      fetchSettlements();
    } catch (err: any) {
      toast.current?.show({ severity: 'error', summary: t('common.error', { defaultValue: 'Lỗi' }), detail: err?.response?.data?.message || err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRaiseClaim = async () => {
    if (!claimBatch || !claimReason.trim()) {
      toast.current?.show({ severity: 'warn', summary: t('common.warn', { defaultValue: 'Thiếu thông tin' }), detail: t('partner_portal.claim_reason_required', { defaultValue: 'Vui lòng nhập Lý do khiếu nại sai lệch.' }) });
      return;
    }
    setSubmitting(true);
    try {
      await LoyaltyService.raisePartnerSettlementClaim(
        { batchCode: claimBatch.batchCode, claimedAmount: claimAmount, reason: claimReason.trim() },
        selectedTenant
      );
      toast.current?.show({ severity: 'success', summary: t('common.success', { defaultValue: 'Đã gửi khiếu nại' }), detail: claimBatch.batchCode });
      setClaimBatch(null);
      setClaimReason('');
      fetchSettlements();
    } catch (err: any) {
      toast.current?.show({ severity: 'error', summary: t('common.error', { defaultValue: 'Lỗi' }), detail: err?.response?.data?.message || err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Toast ref={toast} />
      <AppBreadcrumb items={[{ label: t('partner_portal.nav_settlement', { defaultValue: 'Partner Portal · Đối soát & Thanh toán (LM-10)' }) }]} />

      <div className="card shadow-1 border-round surface-card p-4">
        <div className="flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
          <div>
            <h4 className="m-0 text-primary font-semibold">{t('partner_portal.settlement_title', { defaultValue: 'Bảng Đối soát Bù trừ & Lô Thanh toán Đối tác (LM-10)' })}</h4>
            <p className="m-0 text-xs text-500 mt-1">{t('partner_portal.settlement_subtitle', { defaultValue: 'Xác nhận số liệu bù trừ kỳ đối soát, kiểm tra Phí Sàn MDR (MDR Fee) hoặc gửi khiếu nại sai lệch.' })}</p>
          </div>
          <div className="flex gap-2 align-items-center">
            <TenantSelector value={selectedTenant} onChange={setSelectedTenant} />
            <Button icon="pi pi-refresh" outlined rounded onClick={fetchSettlements} loading={loading} />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-column gap-2"><Skeleton height="2.75rem" /><Skeleton height="2.75rem" /></div>
        ) : (
          <DataTable<PartnerSettlementBatchModel[]> value={batches} paginator rows={10} stripedRows responsiveLayout="scroll" emptyMessage={t('common.no_data', { defaultValue: 'Chưa có lô thanh toán đối soát nào.' })}>
            <Column field="batchCode" header={t('clearing.batch_code', { defaultValue: 'Mã Lô PAY' })} body={(r: PartnerSettlementBatchModel) => <span className="font-mono white-space-nowrap font-medium text-primary">{r.batchCode}</span>} style={{ minWidth: '13rem' }} />
            <Column header={t('clearing.period', { defaultValue: 'Kỳ Đối Soát' })} body={(r: PartnerSettlementBatchModel) => <span className="font-mono white-space-nowrap text-xs">{r.periodFrom} → {r.periodTo}</span>} style={{ minWidth: '13rem' }} />
            <Column field="grossAmount" header={t('clearing.gross_amount', { defaultValue: 'Tổng Giá Trị' })} body={(r: PartnerSettlementBatchModel) => <span className="font-mono">{Number(r.grossAmount || 0).toLocaleString()} HTG</span>} style={{ minWidth: '9.5rem', textAlign: 'right' }} />
            <Column field="mdrFeeAmount" header={<span title={t('clearing.mdr_fee_tooltip', { defaultValue: 'Phí dịch vụ thương mại (Merchant Discount Rate - MDR Fee) khấu trừ theo tỷ lệ hợp đồng trên giá trị giao dịch bù trừ.' })}>MDR Fee <i className="pi pi-info-circle text-xs text-400 ml-1" /></span>} body={(r: PartnerSettlementBatchModel) => <span className="font-mono text-orange-600">{Number(r.mdrFeeAmount || 0).toLocaleString()} HTG</span>} style={{ minWidth: '9.5rem', textAlign: 'right' }} />
            <Column field="netPayableAmount" header={t('clearing.net_payable', { defaultValue: 'Thực Nhận Ròng' })} body={(r: PartnerSettlementBatchModel) => <span className="font-mono font-medium text-green-700">{Number(r.netPayableAmount || 0).toLocaleString()} HTG</span>} style={{ minWidth: '10rem', textAlign: 'right' }} />
            <Column field="status" header={t('common.status', { defaultValue: 'Trạng Thái' })} body={(r: PartnerSettlementBatchModel) => <Tag value={r.status} severity={r.status === PaymentBatchStatus.PAID ? 'success' : r.status === PaymentBatchStatus.DISPUTED ? 'danger' : 'warning'} />} style={{ minWidth: '9rem', textAlign: 'center' }} />
            <Column
              header={t('common.action', { defaultValue: 'Thao Tác' })}
              body={(r: PartnerSettlementBatchModel) => (
                <div className="flex gap-1">
                  {r.status === PaymentBatchStatus.PENDING_CONFIRM && (
                    <Button label={t('partner_portal.confirm_batch', { defaultValue: 'Xác nhận' })} icon="pi pi-check" size="small" severity="success" onClick={() => handleConfirm(r)} loading={submitting} />
                  )}
                  <Button label={t('partner_portal.raise_claim', { defaultValue: 'Raise a claim' })} icon="pi pi-exclamation-triangle" size="small" severity="warning" outlined onClick={() => { setClaimBatch(r); setClaimAmount(r.netPayableAmount || 0); setClaimReason(''); }} />
                </div>
              )}
              style={{ minWidth: '14rem' }}
            />
          </DataTable>
        )}
      </div>

      <Dialog visible={!!claimBatch} onHide={() => setClaimBatch(null)} header={claimBatch ? `${t('partner_portal.raise_claim', { defaultValue: 'Khiếu nại Sai lệch Đối soát' })} · ${claimBatch.batchCode}` : ''} style={{ width: '34rem' }} modal className="p-fluid">
        <div className="flex flex-column gap-3">
          <div className="field m-0">
            <label className="text-sm font-medium">{t('partner_portal.disputed_amount', { defaultValue: 'Số tiền đối soát đối tác ghi nhận (HTG)' })}</label>
            <InputNumber value={claimAmount} onValueChange={(e) => setClaimAmount(e.value || 0)} min={0} />
          </div>
          <div className="field m-0">
            <label className="text-sm font-medium">{t('common.reason', { defaultValue: 'Chi tiết sai lệch' })} *</label>
            <InputTextarea rows={3} value={claimReason} onChange={(e) => setClaimReason(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-content-end gap-2 mt-4">
          <Button label={t('common.cancel', { defaultValue: 'Hủy' })} outlined onClick={() => setClaimBatch(null)} />
          <Button label={t('partner_portal.submit_claim', { defaultValue: 'Gửi Khiếu Nại' })} icon="pi pi-send" severity="warning" onClick={handleRaiseClaim} loading={submitting} />
        </div>
      </Dialog>
    </div>
  );
};

export default PartnerSettlementPage;
