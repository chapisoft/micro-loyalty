import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { AppBreadcrumb } from '@/components/AppBreadcrumb';
import { TenantSelector } from '@/components/TenantSelector';
import { PaymentBatchStatus } from '@/models';
import { LoyaltyService, PartnerSettlementBatchModel } from '@/service/loyalty.service';
import { StandardPageHeader } from '@/components/StandardPageHeader';
import { UniversalFilterBar } from '@/components/UniversalFilterBar';
import { StandardRowActions } from '@/components/StandardRowActions';
import { exportToExcel } from '@/components/exportHelper';

export const PartnerSettlementPage: React.FC = () => {
  const { t } = useTranslation();
  const toast = useRef<Toast>(null);

  const [selectedTenant, setSelectedTenant] = useState<string>(
    () => localStorage.getItem('selected_tenant_id') || localStorage.getItem('tenant_id') || ''
  );
  const [batches, setBatches] = useState<PartnerSettlementBatchModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
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
      toast.current?.show({
        severity: 'success',
        summary: t('common.success'),
        detail: `${batch.batchCode}`,
      });
      fetchSettlements();
    } catch (err: any) {
      toast.current?.show({
        severity: 'error',
        summary: t('common.error'),
        detail: err?.response?.data?.message || err.message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRaiseClaim = async () => {
    if (!claimBatch || !claimReason.trim()) {
      toast.current?.show({
        severity: 'warn',
        summary: t('common.warn'),
        detail: t('partner_portal.claim_reason_required'),
      });
      return;
    }
    setSubmitting(true);
    try {
      await LoyaltyService.raisePartnerSettlementClaim(
        {
          batchCode: claimBatch.batchCode,
          claimedAmount: claimAmount,
          reason: claimReason.trim(),
        },
        selectedTenant
      );
      toast.current?.show({
        severity: 'success',
        summary: t('common.success'),
        detail: claimBatch.batchCode,
      });
      setClaimBatch(null);
      setClaimReason('');
      fetchSettlements();
    } catch (err: any) {
      toast.current?.show({
        severity: 'error',
        summary: t('common.error'),
        detail: err?.response?.data?.message || err.message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredBatches = useMemo(() => {
    if (!keyword.trim()) return batches;
    const kw = keyword.toLowerCase();
    return batches.filter(
      (b) =>
        b.batchCode?.toLowerCase().includes(kw) ||
        b.periodFrom?.toLowerCase().includes(kw) ||
        b.periodTo?.toLowerCase().includes(kw) ||
        b.status?.toLowerCase().includes(kw)
    );
  }, [batches, keyword]);

  const handleExport = () => {
    exportToExcel(
      filteredBatches,
      [
        { header: t('clearing.batch_code'), field: 'batchCode' },
        { header: t('clearing.gross_amount'), field: 'grossAmount' },
        { header: t('clearing.mdr_fee'), field: 'mdrFeeAmount' },
        { header: t('clearing.net_payable'), field: 'netPayableAmount' },
        { header: t('common.status'), field: 'status' },
      ],
      'doi_soat_bu_tru_doi_tac'
    );
  };

  return (
    <div className="w-full">
      <Toast ref={toast} />
      <AppBreadcrumb items={[{ label: t('partner_portal.nav_settlement') }]} />

      <StandardPageHeader
        title={t('partner_portal.settlement_title')}
        subtitle={t('partner_portal.settlement_subtitle')}
        extraLeft={<TenantSelector value={selectedTenant} onChange={setSelectedTenant} />}
        onRefresh={fetchSettlements}
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
          </div>
        ) : (
          <DataTable<PartnerSettlementBatchModel[]>
            value={filteredBatches}
            paginator
            rows={10}
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
              body={(r: PartnerSettlementBatchModel) => (
                <StandardRowActions
                  actions={[
                    ...(r.status === PaymentBatchStatus.PENDING_CONFIRM
                      ? [
                          {
                            icon: 'pi pi-check',
                            label: t('partner_portal.confirm_batch', 'Xác nhận'),
                            onClick: () => handleConfirm(r),
                          },
                        ]
                      : []),
                    {
                      icon: 'pi pi-exclamation-triangle',
                      label: t('partner_portal.raise_claim', 'Khiếu nại'),
                      onClick: () => {
                        setClaimBatch(r);
                        setClaimAmount(r.netPayableAmount || 0);
                        setClaimReason('');
                      },
                    },
                  ]}
                />
              )}
              style={{ width: '7rem', textAlign: 'center' }}
            />
            <Column
              field="batchCode"
              header={t('clearing.batch_code')}
              body={(r: PartnerSettlementBatchModel) => (
                <span className="font-bold font-mono text-900">{r.batchCode}</span>
              )}
              style={{ minWidth: '13rem' }}
            />
            <Column
              header={t('clearing.period')}
              body={(r: PartnerSettlementBatchModel) => (
                <span className="text-900 font-mono text-xs">
                  {r.periodFrom} → {r.periodTo}
                </span>
              )}
              style={{ minWidth: '13rem' }}
            />
            <Column
              field="grossAmount"
              header={t('clearing.gross_amount')}
              body={(r: PartnerSettlementBatchModel) => (
                <span className="text-900 font-mono">
                  {Number(r.grossAmount || 0).toLocaleString()} HTG
                </span>
              )}
              style={{ minWidth: '9.5rem', textAlign: 'right' }}
            />
            <Column
              field="mdrFeeAmount"
              header={t('clearing.mdr_fee')}
              body={(r: PartnerSettlementBatchModel) => (
                <span className="text-900 font-mono">
                  {Number(r.mdrFeeAmount || 0).toLocaleString()} HTG
                </span>
              )}
              style={{ minWidth: '9.5rem', textAlign: 'right' }}
            />
            <Column
              field="netPayableAmount"
              header={t('clearing.net_payable')}
              body={(r: PartnerSettlementBatchModel) => (
                <span className="text-900 font-mono font-medium">
                  {Number(r.netPayableAmount || 0).toLocaleString()} HTG
                </span>
              )}
              style={{ minWidth: '10rem', textAlign: 'right' }}
            />
            <Column
              field="status"
              header={t('common.status')}
              body={(r: PartnerSettlementBatchModel) => (
                <Tag
                  value={r.status}
                  severity={
                    r.status === PaymentBatchStatus.PAID
                      ? 'success'
                      : r.status === PaymentBatchStatus.DISPUTED
                      ? 'danger'
                      : 'warning'
                  }
                />
              )}
              style={{ minWidth: '9rem', textAlign: 'center' }}
            />
          </DataTable>
        )}
      </div>

      <Dialog
        visible={!!claimBatch}
        onHide={() => setClaimBatch(null)}
        header={claimBatch ? `${t('partner_portal.raise_claim')} · ${claimBatch.batchCode}` : ''}
        style={{ width: '34rem' }}
        modal
        className="p-fluid"
      >
        <div className="flex flex-column gap-3">
          <div className="field m-0">
            <label className="text-sm font-medium">{t('partner_portal.disputed_amount')}</label>
            <InputNumber
              value={claimAmount}
              onValueChange={(e) => setClaimAmount(e.value || 0)}
              min={0}
            />
          </div>
          <div className="field m-0">
            <label className="text-sm font-medium">{t('common.reason')} *</label>
            <InputTextarea
              rows={3}
              value={claimReason}
              onChange={(e) => setClaimReason(e.target.value)}
              placeholder="Chi tiết khiếu nại đối soát"
            />
          </div>
        </div>
        <div className="flex justify-content-end gap-2 mt-4">
          <Button label={t('common.cancel')} outlined onClick={() => setClaimBatch(null)} />
          <Button
            label={t('common.confirm')}
            icon="pi pi-check"
            severity="warning"
            onClick={handleRaiseClaim}
            loading={submitting}
          />
        </div>
      </Dialog>
    </div>
  );
};

export default PartnerSettlementPage;
