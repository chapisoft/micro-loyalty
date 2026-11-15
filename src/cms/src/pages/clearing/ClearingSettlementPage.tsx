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
import { Calendar } from 'primereact/calendar';
import { Toast } from 'primereact/toast';
import { ProgressBar } from 'primereact/progressbar';
import { StandardPageHeader } from '@/components/StandardPageHeader';
import { UniversalFilterBar } from '@/components/UniversalFilterBar';
import { StandardRowActions } from '@/components/StandardRowActions';
import { exportToExcel as runExportToExcel } from '@/components/exportHelper';
import { ClearingStatus, DisputeStatus, PaymentBatchStatus } from '@/models';
import {
  LoyaltyService,
  ClearingSummaryModel,
  ClearingPaymentBatchModel,
  DisputeItemModel,
  PartnerTransactionItemModel,
  PartnerTransactionsResponseModel,
} from '@/service/loyalty.service';
import * as XLSX from 'xlsx';

// Hàm format ngày địa phương an toàn (chống Timezone Drift)
const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Hàm parse ngày chuỗi sang Date địa phương
const parseLocalDate = (dateStr?: string): Date | null => {
  if (!dateStr) return null;
  const cleanStr = String(dateStr).substring(0, 10);
  const parts = cleanStr.split('-');
  if (parts.length !== 3) return new Date(dateStr);
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
};

export const ClearingSettlementPage: React.FC = () => {
  const { t } = useTranslation();
  const toast = React.useRef<Toast>(null);
  const dt = React.useRef<DataTable<any>>(null);

  const [selectedTenant, setSelectedTenant] = useState<string>(
    () => localStorage.getItem('selected_tenant_id') || 'TENANT_NATCASH'
  );

  // Mặc định từ ngày 1 đầu tháng đến ngày hiện tại
  const [fromDate, setFromDate] = useState<string>(() => {
    const now = new Date();
    return formatLocalDate(new Date(now.getFullYear(), now.getMonth(), 1));
  });
  const [toDate, setToDate] = useState<string>(() => formatLocalDate(new Date()));

  // Chọn nhanh kỳ kế toán đối soát
  const handleQuickPeriod = (type: 'THIS_MONTH' | 'LAST_MONTH' | 'LAST_7_DAYS') => {
    const now = new Date();
    if (type === 'THIS_MONTH') {
      setFromDate(formatLocalDate(new Date(now.getFullYear(), now.getMonth(), 1)));
      setToDate(formatLocalDate(now));
    } else if (type === 'LAST_MONTH') {
      const firstDayPrev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDayPrev = new Date(now.getFullYear(), now.getMonth(), 0);
      setFromDate(formatLocalDate(firstDayPrev));
      setToDate(formatLocalDate(lastDayPrev));
    } else if (type === 'LAST_7_DAYS') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
      setFromDate(formatLocalDate(sevenDaysAgo));
      setToDate(formatLocalDate(now));
    }
  };

  const [clearingList, setClearingList] = useState<ClearingSummaryModel[]>([]);
  const [disputeList, setDisputeList] = useState<DisputeItemModel[]>([]);
  const [selectedItems, setSelectedItems] = useState<ClearingSummaryModel[]>([]);
  const [showConfirmSettle, setShowConfirmSettle] = useState(false);
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState<DisputeItemModel | null>(null);
  const [resolveStatus, setResolveStatus] = useState<string>(DisputeStatus.RESOLVED);
  const [resolvedAmount, setResolvedAmount] = useState<number | null>(null);
  const [resolutionNote, setResolutionNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [settleSuccessMsg, setSettleSuccessMsg] = useState<string | null>(null);

  // Drill-down Modal State
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState<PartnerTransactionsResponseModel | null>(null);

  // LM-07 Payment Batches (PAY-...)
  const [batches, setBatches] = useState<ClearingPaymentBatchModel[]>([]);
  const [batchesLoading, setBatchesLoading] = useState(false);
  const [showCreateBatchDialog, setShowCreateBatchDialog] = useState(false);
  const [batchPartnerId, setBatchPartnerId] = useState<number | null>(null);
  const [batchMdrRate, setBatchMdrRate] = useState<number>(1.5);
  const [trackBatch, setTrackBatch] = useState<ClearingPaymentBatchModel | null>(null);

  const fetchClearingData = useCallback(async () => {
    setLoading(true);
    setBatchesLoading(true);
    try {
      const fromIso = fromDate ? new Date(fromDate + 'T00:00:00').toISOString() : undefined;
      const toIso = toDate ? new Date(toDate + 'T23:59:59').toISOString() : undefined;

      const [report, disputes, batchRes] = await Promise.all([
        LoyaltyService.getClearingReport(selectedTenant, fromIso, toIso),
        LoyaltyService.getDisputes(selectedTenant),
        LoyaltyService.getClearingBatches(selectedTenant),
      ]);

      if (report && Array.isArray(report.partnerSummaries)) {
        setClearingList(report.partnerSummaries);
      } else {
        setClearingList([]);
      }

      if (Array.isArray(disputes)) {
        setDisputeList(disputes);
      } else {
        setDisputeList([]);
      }

      setBatches(Array.isArray(batchRes) ? batchRes : []);
    } catch (e) {
      console.error('[fetchClearingData] Error:', e);
      setClearingList([]);
      setDisputeList([]);
      setBatches([]);
    } finally {
      setLoading(false);
      setBatchesLoading(false);
    }
  }, [selectedTenant, fromDate, toDate]);

  const handleCreateBatch = async () => {
    if (!batchPartnerId) {
      toast.current?.show({ severity: 'warn', summary: t('common.warn'), detail: t('clearing.select_partner_batch') });
      return;
    }
    setIsSubmitting(true);
    try {
      await LoyaltyService.createClearingBatch(
        { partnerId: batchPartnerId, periodFrom: fromDate, periodTo: toDate },
        selectedTenant
      );
      toast.current?.show({ severity: 'success', summary: t('common.success'), detail: t('clearing.batch_created') });
      setShowCreateBatchDialog(false);
      fetchClearingData();
    } catch (err: any) {
      toast.current?.show({ severity: 'error', summary: t('common.error'), detail: err?.response?.data?.message || err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmBatch = async (batch: ClearingPaymentBatchModel) => {
    setIsSubmitting(true);
    try {
      await LoyaltyService.confirmClearingBatch(batch.batchCode, selectedTenant);
      toast.current?.show({ severity: 'success', summary: t('common.success'), detail: `${batch.batchCode} ${t('clearing.batch_confirmed')}` });
      setTrackBatch(null);
      fetchClearingData();
    } catch (err: any) {
      toast.current?.show({ severity: 'error', summary: t('common.error'), detail: err?.response?.data?.message || err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    fetchClearingData();
  }, [fetchClearingData]);

  // Tổng hợp thống kê
  const totalTransactions = clearingList.reduce((sum, item) => sum + (item.totalTransactions || 0), 0);
  const totalPointsIssued = clearingList.reduce((sum, item) => sum + (item.totalPointsIssued || 0), 0);
  const totalPointsRedeemed = clearingList.reduce((sum, item) => sum + (item.totalPointsRedeemed || 0), 0);
  const totalNetSettlement = clearingList.reduce((sum, item) => sum + (item.netSettlementAmount || 0), 0);

  // Mở modal xem chi tiết hóa đơn đối tác
  const handleViewDetails = async (partner: ClearingSummaryModel) => {
    setShowDetailDialog(true);
    setDetailLoading(true);
    setDetailData(null);
    try {
      const fromIso = new Date(fromDate + 'T00:00:00').toISOString();
      const toIso = new Date(toDate + 'T23:59:59').toISOString();
      const data = await LoyaltyService.getPartnerClearingTransactions(selectedTenant, partner.partnerId, fromIso, toIso);
      setDetailData(data);
    } catch (err: any) {
      console.error('[handleViewDetails] Error:', err);
      toast.current?.show({
        severity: 'error',
        summary: t('common.error'),
        detail: err?.message || t('clearing.fetch_detail_error'),
        life: 4000,
      });
    } finally {
      setDetailLoading(false);
    }
  };

  // Kết chuyển kỳ quyết toán
  const handleSettlePeriod = async () => {
    setIsSubmitting(true);
    try {
      const fromIso = new Date(fromDate + 'T00:00:00').toISOString();
      const toIso = new Date(toDate + 'T23:59:59').toISOString();
      const res = await LoyaltyService.settleClearingPeriod(selectedTenant, fromIso, toIso);
      if (res && res.settlementBatchCode) {
        setSettleSuccessMsg(
          t('clearing.batch_success', {
            code: res.settlementBatchCode
          })
        );
      } else {
        setSettleSuccessMsg(res?.message || t('clearing.settle_success'));
      }
      setShowConfirmSettle(false);
      await fetchClearingData();
    } catch (e: any) {
      console.error('[handleSettlePeriod] Error:', e);
      toast.current?.show({
        severity: 'error',
        summary: t('common.error'),
        detail: e?.response?.data?.message || e?.message || t('clearing.settle_error'),
        life: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenResolve = (dispute: DisputeItemModel) => {
    setSelectedDispute(dispute);
    setResolveStatus(DisputeStatus.RESOLVED);
    setResolvedAmount(dispute.loyaltyAmount || dispute.partnerAmount);
    setResolutionNote('');
    setShowResolveDialog(true);
  };

  const handleSaveResolve = async () => {
    if (!selectedDispute) return;
    setIsSubmitting(true);
    try {
      await LoyaltyService.resolveDispute(
        selectedDispute.disputeCode,
        resolveStatus,
        resolvedAmount ?? undefined,
        resolutionNote,
        selectedTenant
      );
      toast.current?.show({
        severity: 'success',
        summary: t('common.success'),
        detail: t('clearing.resolve_dispute_success'),
        life: 3000,
      });
      setShowResolveDialog(false);
      await fetchClearingData();
    } catch (e: any) {
      console.error('[handleSaveResolve] Error:', e);
      toast.current?.show({
        severity: 'error',
        summary: t('common.error'),
        detail: e?.response?.data?.message || e?.message || t('clearing.resolve_dispute_error'),
        life: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusTemplate = (status: string) => {
    return status === ClearingStatus.SETTLED ? (
      <Tag severity="success" value={t('common.settled')} />
    ) : (
      <Tag severity="warning" value={t('common.pending')} />
    );
  };

  const partnerTypeTemplate = (rowData: ClearingSummaryModel) => {
    const type = rowData.partnerType || 'RETAIL';
    return (
      <Tag
        severity={type === 'RETAIL' ? 'warning' : type === 'TELECOM' ? 'info' : 'success'}
        value={type}
      />
    );
  };

  const netAmountTemplate = (rowData: ClearingSummaryModel) => {
    const isPositive = (rowData.netSettlementAmount || 0) >= 0;
    return (
      <span className={`font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? '+' : ''}{Number(rowData.netSettlementAmount || 0).toLocaleString()} HTG
      </span>
    );
  };

  const disputeStatusTemplate = (status: string) => {
    switch (status) {
      case DisputeStatus.RESOLVED:
        return <Tag severity="success" value={t('enum.dispute_status.RESOLVED')} />;
      case DisputeStatus.REJECTED:
        return <Tag severity="danger" value={t('enum.dispute_status.REJECTED')} />;
      case DisputeStatus.INVESTIGATING:
        return <Tag severity="warning" value={t('enum.dispute_status.INVESTIGATING')} />;
      case DisputeStatus.OPEN:
      default:
        return <Tag severity="info" value={t('enum.dispute_status.OPEN')} />;
    }
  };

  // Cột Thao tác trên từng dòng đối tác
  const actionTemplate = (rowData: ClearingSummaryModel) => (
    <StandardRowActions
      onView={() => handleViewDetails(rowData)}
    />
  );

  const exportToExcel = () => {
    const fromStr = fromDate ? fromDate.trim() : 'ALL';
    const toStr = toDate ? toDate.trim() : 'ALL';
    const fileName = `Bao_Cao_Doi_Soat_Bu_Tru_${selectedTenant}_${fromStr}_${toStr}.xlsx`;

    const dataToExport = (selectedItems.length > 0 ? selectedItems : clearingList).map((item, index) => ({
      [t('common.no_order')]: index + 1,
      [t('clearing.partner_code')]: item.partnerCode || '',
      [t('clearing.partner_name')]: item.partnerName || '',
      [t('clearing.partner_type')]: item.partnerType || '',
      [t('clearing.total_txs')]: Number(item.totalTransactions || 0),
      [t('clearing.total_points_issued')]: Number(item.totalPointsIssued || 0),
      [t('clearing.total_points_redeemed')]: Number(item.totalPointsRedeemed || 0),
      [t('clearing.total_fiat_payable')]: Number(item.totalFiatPayable || 0),
      [t('clearing.total_fiat_receivable')]: Number(item.totalFiatReceivable || 0),
      [t('clearing.total_commission_fee')]: Number(item.totalCommissionFee || 0),
      [t('clearing.net_amount')]: Number(item.netSettlementAmount || 0),
      [t('common.status')]:
        item.status === ClearingStatus.SETTLED ? t('clearing.settled') : t('clearing.pending'),
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);

    worksheet['!cols'] = [
      { wch: 6 },
      { wch: 18 },
      { wch: 30 },
      { wch: 16 },
      { wch: 16 },
      { wch: 18 },
      { wch: 18 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 22 },
      { wch: 18 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Doi_Soat_Bu_Tru');
    XLSX.writeFile(workbook, fileName);

    toast.current?.show({
      severity: 'success',
      summary: t('common.success'),
      detail: t('clearing.export_success', {
        name: fileName
      }),
      life: 3000,
    });
  };

  const header = (
    <div className="flex flex-wrap align-items-center justify-content-between gap-3">
      <div className="flex flex-wrap gap-2 align-items-center">
        <span className="font-bold text-lg text-primary">{t('clearing.management_title')}</span>
        {selectedItems.length > 0 && (
          <Tag severity="info" value={t('clearing.selected_partners_count', { count: selectedItems.length })} />
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          icon="pi pi-refresh"
          severity="secondary"
          outlined
          rounded
          onClick={fetchClearingData}
          loading={loading}
          tooltip={t('common.refresh')}
        />
        <Button
          label={t('clearing.export_excel')}
          icon="pi pi-file-excel"
          severity="success"
          outlined
          onClick={exportToExcel}
          tooltip={t('clearing.export_excel_tooltip')}
        />
        <Button
          label={t('clearing.settle_period')}
          icon="pi pi-check-circle"
          onClick={() => setShowConfirmSettle(true)}
          disabled={clearingList.length === 0}
          tooltip={t('clearing.settle_tooltip')}
        />
      </div>
    </div>
  );

  return (
    <div className="w-full">
      <Toast ref={toast} position="top-center" />
      <StandardPageHeader
        title={t('nav.clearing')}
        subtitle={t('clearing.subtitle', 'Đối soát bù trừ doanh thu, phát hành & thu hồi điểm liên minh')}
        breadcrumbs={[{ label: t('nav.clearing') }]}
        tenantValue={selectedTenant}
        onTenantChange={setSelectedTenant}
        primaryAction={{
          label: t('clearing.settle_period'),
          icon: 'pi pi-check-circle',
          onClick: () => setShowConfirmSettle(true),
          disabled: clearingList.length === 0,
        }}
      />

      {/* Bộ lọc khoảng ngày đối soát & Chọn nhanh kỳ */}
      <div className="card shadow-1 border-round surface-card p-3 mb-3 w-full">
        <div className="flex flex-wrap align-items-center justify-content-between gap-3">
          <div className="flex flex-wrap align-items-center gap-3">
            <div className="flex align-items-center gap-2">
              <label htmlFor="fromDate" className="font-semibold text-sm text-700">{t('clearing.filter_date_from')}:</label>
              <Calendar
                id="fromDate"
                value={parseLocalDate(fromDate)}
                onChange={(e) => setFromDate(e.value ? formatLocalDate(e.value as Date) : '')}
                dateFormat="yy-mm-dd"
                showIcon
                className="p-inputtext-sm"
              />
            </div>
            <div className="flex align-items-center gap-2">
              <label htmlFor="toDate" className="font-semibold text-sm text-700">{t('clearing.filter_date_to')}:</label>
              <Calendar
                id="toDate"
                value={parseLocalDate(toDate)}
                onChange={(e) => setToDate(e.value ? formatLocalDate(e.value as Date) : '')}
                dateFormat="yy-mm-dd"
                showIcon
                className="p-inputtext-sm"
              />
            </div>
            <Button
              icon="pi pi-search"
              label={t('common.search')}
              onClick={fetchClearingData}
              loading={loading}
              size="small"
            />
            <Button
              icon="pi pi-file-excel"
              label={t('common.export')}
              severity="secondary"
              outlined
              onClick={exportToExcel}
              size="small"
            />
          </div>

          {/* Nút chọn nhanh kỳ kế toán */}
          <div className="flex flex-wrap align-items-center gap-1">
            <span className="text-500 text-xs font-semibold mr-1">{t('common.quick_select')}:</span>
            <Button
              label={t('common.this_month')}
              size="small"
              text
              severity="secondary"
              onClick={() => handleQuickPeriod('THIS_MONTH')}
            />
            <Button
              label={t('common.last_month')}
              size="small"
              text
              severity="secondary"
              onClick={() => handleQuickPeriod('LAST_MONTH')}
            />
            <Button
              label={t('common.last_7_days')}
              size="small"
              text
              severity="secondary"
              onClick={() => handleQuickPeriod('LAST_7_DAYS')}
            />
          </div>
        </div>
      </div>

      {settleSuccessMsg && (
        <div className="p-3 mb-3 border-round bg-green-50 text-green-800 border-1 border-green-200 flex align-items-center justify-content-between">
          <span><i className="pi pi-check-circle mr-2" />{settleSuccessMsg}</span>
          <Button icon="pi pi-times" text rounded severity="success" onClick={() => setSettleSuccessMsg(null)} />
        </div>
      )}

      {/* Thẻ Thống Kê Tổng Quan 4 Chỉ Số Cân Bằng */}
      <div className="grid mb-3">
        <div className="col-12 sm:col-6 lg:col-3">
          <div className="card shadow-1 border-round surface-card p-3">
            <span className="text-500 font-medium block mb-1 text-sm">{t('clearing.total_txs')}</span>
            <div className="text-900 font-bold text-2xl">{totalTransactions.toLocaleString()}</div>
          </div>
        </div>
        <div className="col-12 sm:col-6 lg:col-3">
          <div className="card shadow-1 border-round surface-card p-3">
            <span className="text-500 font-medium block mb-1 text-sm">{t('clearing.total_points_issued')}</span>
            <div className="text-900 font-bold text-2xl">{totalPointsIssued.toLocaleString()} {t('common.points')}</div>
          </div>
        </div>
        <div className="col-12 sm:col-6 lg:col-3">
          <div className="card shadow-1 border-round surface-card p-3">
            <span className="text-500 font-medium block mb-1 text-sm">{t('clearing.total_points_redeemed')}</span>
            <div className="text-900 font-bold text-2xl">{totalPointsRedeemed.toLocaleString()} {t('common.points')}</div>
          </div>
        </div>
        <div className="col-12 sm:col-6 lg:col-3">
          <div className="card shadow-1 border-round surface-card p-3">
            <span className="text-500 font-medium block mb-1 text-sm">{t('clearing.net_amount')}</span>
            <div className="font-bold text-2xl text-900">
              {totalNetSettlement >= 0 ? '+' : ''}{totalNetSettlement.toLocaleString()} HTG
            </div>
          </div>
        </div>
      </div>

      {/* TabView Phân Tách Bảng Bù Trừ và Bảng Xử Lý Sai Lệch */}
      <div className="card shadow-1 border-round surface-card p-3 w-full">
        <TabView>
          <TabPanel header={t('clearing.tab_summary')} leftIcon="pi pi-table mr-2">
            <DataTable<any>
              ref={dt}
              value={clearingList}
              selection={selectedItems}
              onSelectionChange={(e: any) => setSelectedItems(e.value || [])}
              dataKey="partnerId"
              exportFilename={`Bao_Cao_Doi_Soat_Bu_Tru_${selectedTenant}_${fromDate ? fromDate.trim() : 'ALL'}_${toDate ? toDate.trim() : 'ALL'}`}
              paginator
              rows={10}
              rowsPerPageOptions={[5, 10, 25, 50]}
              loading={loading}
              emptyMessage={t('common.no_data')}
              stripedRows
              responsiveLayout="scroll"
            >
              <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
              <Column
                header={t('common.no_order')}
                body={(_, options) => options.rowIndex + 1}
                style={{ width: '3.5rem', textAlign: 'center' }}
              />
              <Column
                header={t('common.action')}
                body={actionTemplate}
                exportable={false}
                style={{ width: '6rem', textAlign: 'center' }}
              />
              <Column field="partnerCode" header={t('clearing.partner_code')} body={(row: ClearingSummaryModel) => <span className="font-bold font-mono text-900">{row.partnerCode}</span>} sortable style={{ minWidth: '9rem' }} />
              <Column field="partnerName" header={t('clearing.partner_name')} body={(row: ClearingSummaryModel) => <span className="text-900">{row.partnerName}</span>} sortable style={{ minWidth: '13rem' }} />
              <Column field="partnerType" header={t('clearing.partner_type')} body={(row: ClearingSummaryModel) => <span className="text-900">{row.partnerType || 'RETAIL'}</span>} sortable style={{ minWidth: '6.5rem', textAlign: 'center' }} />
              <Column field="totalTransactions" header={t('clearing.total_txs')} body={(row: ClearingSummaryModel) => <span className="text-900">{Number(row.totalTransactions || 0).toLocaleString()}</span>} sortable style={{ minWidth: '6rem', textAlign: 'center' }} />
              <Column field="totalPointsIssued" header={t('clearing.total_points_issued')} body={(row: ClearingSummaryModel) => <span className="text-900">{Number(row.totalPointsIssued || 0).toLocaleString()}</span>} sortable style={{ minWidth: '8.5rem', textAlign: 'center' }} />
              <Column field="totalPointsRedeemed" header={t('clearing.total_points_redeemed')} body={(row: ClearingSummaryModel) => <span className="text-900">{Number(row.totalPointsRedeemed || 0).toLocaleString()}</span>} sortable style={{ minWidth: '8.5rem', textAlign: 'center' }} />
              <Column field="totalFiatPayable" header={t('clearing.total_fiat_payable')} body={(row: ClearingSummaryModel) => <span className="text-900">{Number(row.totalFiatPayable || 0).toLocaleString()} HTG</span>} sortable style={{ minWidth: '8.5rem', textAlign: 'center' }} />
              <Column field="totalFiatReceivable" header={t('clearing.total_fiat_receivable')} body={(row: ClearingSummaryModel) => <span className="text-900">{Number(row.totalFiatReceivable || 0).toLocaleString()} HTG</span>} sortable style={{ minWidth: '8.5rem', textAlign: 'center' }} />
              <Column field="totalCommissionFee" header={t('clearing.mdr_fee')} body={(row: ClearingSummaryModel) => <span className="text-900">{Number(row.totalCommissionFee || 0).toLocaleString()} HTG</span>} sortable style={{ minWidth: '9.5rem', textAlign: 'center' }} />
              <Column field="netSettlementAmount" body={(row: ClearingSummaryModel) => <span className="text-900 font-semibold">{Number(row.netSettlementAmount || 0).toLocaleString()} HTG</span>} header={t('clearing.net_amount')} sortable style={{ minWidth: '9.5rem', textAlign: 'center' }} />
              <Column field="status" body={(row: ClearingSummaryModel) => statusTemplate(row.status)} header={t('common.status')} sortable style={{ minWidth: '8.5rem', textAlign: 'center' }} />
            </DataTable>
          </TabPanel>

          <TabPanel header={t('clearing.disputes_tab', { count: disputeList.length })} leftIcon="pi pi-exclamation-circle mr-2">
            <DataTable<any>
              value={disputeList}
              paginator
              rows={10}
              rowsPerPageOptions={[5, 10, 25, 50]}
              emptyMessage={t('clearing.no_disputes')}
              stripedRows
              responsiveLayout="scroll"
            >
              <Column header="#" body={(_, opt) => opt.rowIndex + 1} style={{ width: '3.5rem', textAlign: 'center' }} />
              <Column field="disputeCode" header={t('clearing.dispute_code')} body={(r: DisputeItemModel) => <span className="font-bold font-mono text-900">{r.disputeCode}</span>} sortable style={{ minWidth: '12rem' }} />
              <Column field="batchCode" header={t('clearing.batch_code')} body={(r: DisputeItemModel) => <span className="font-mono text-900">{r.batchCode}</span>} sortable style={{ minWidth: '12rem' }} />
              <Column field="partnerName" header={t('common.partner')} body={(r: DisputeItemModel) => <span className="text-900">{r.partnerName}</span>} sortable style={{ minWidth: '12rem' }} />
              <Column field="disputeType" header={t('clearing.dispute_type')} body={(r: DisputeItemModel) => <span className="text-900">{r.disputeType}</span>} sortable style={{ minWidth: '10rem' }} />
              <Column field="partnerAmount" header={t('clearing.partner_amount')} body={(r: DisputeItemModel) => <span className="text-900">{Number(r.partnerAmount || 0).toLocaleString()} HTG</span>} sortable style={{ minWidth: '8.5rem', textAlign: 'right' }} />
              <Column field="loyaltyAmount" header={t('clearing.loyalty_amount')} body={(r: DisputeItemModel) => <span className="text-900">{Number(r.loyaltyAmount || 0).toLocaleString()} HTG</span>} sortable style={{ minWidth: '8.5rem', textAlign: 'right' }} />
              <Column field="resolvedAmount" header={t('clearing.resolved_amount')} body={(r: DisputeItemModel) => <span className="text-900">{r.resolvedAmount != null ? `${Number(r.resolvedAmount).toLocaleString()} HTG` : '--'}</span>} sortable style={{ minWidth: '8.5rem', textAlign: 'right' }} />
              <Column field="status" header={t('common.status')} body={(r: DisputeItemModel) => disputeStatusTemplate(r.status)} sortable style={{ minWidth: '8rem', textAlign: 'center' }} />
              <Column field="createdAt" header={t('common.time')} body={(r: DisputeItemModel) => <span className="text-900">{r.createdAt ? new Date(r.createdAt).toLocaleString() : '--'}</span>} sortable style={{ minWidth: '10rem', textAlign: 'center' }} />
              <Column
                header={t('common.action')}
                body={(r: DisputeItemModel) => (
                  <StandardRowActions
                    onEdit={r.status !== DisputeStatus.RESOLVED && r.status !== DisputeStatus.REJECTED ? () => handleOpenResolve(r) : undefined}
                  />
                )}
                style={{ width: '6rem', textAlign: 'center' }}
              />
            </DataTable>
          </TabPanel>

          <TabPanel header={t('clearing.tab_batches', { count: batches.length })} leftIcon="pi pi-money-bill mr-2">
            <div className="flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
              <span className="text-sm text-600">{t('clearing.batches_desc')}</span>
              <div className="flex gap-2">
                <Button icon="pi pi-plus" label={t('clearing.create_batch')} severity="success" size="small" onClick={() => setShowCreateBatchDialog(true)} />
                <Button icon="pi pi-refresh" outlined size="small" onClick={fetchClearingData} loading={batchesLoading} />
              </div>
            </div>
            <DataTable<ClearingPaymentBatchModel[]> value={batches} loading={batchesLoading} paginator rows={10} stripedRows responsiveLayout="scroll" emptyMessage={t('clearing.no_batches')}>
              <Column field="batchCode" header={t('clearing.batch_code')} body={(b: ClearingPaymentBatchModel) => <span className="font-bold font-mono text-900">{b.batchCode}</span>} style={{ minWidth: '13rem' }} />
              <Column field="partnerName" header={t('clearing.partner_name')} body={(b: ClearingPaymentBatchModel) => <span className="text-900">{b.partnerCode} - {b.partnerName || ''}</span>} style={{ minWidth: '13rem' }} />
              <Column header={t('clearing.period')} body={(b: ClearingPaymentBatchModel) => <span className="text-900 font-mono text-xs">{b.periodFrom} → {b.periodTo}</span>} style={{ minWidth: '13rem' }} />
              <Column field="grossAmount" header={t('clearing.gross_amount')} body={(b: ClearingPaymentBatchModel) => <span className="text-900">{Number(b.grossAmount || 0).toLocaleString()} HTG</span>} style={{ minWidth: '9.5rem', textAlign: 'right' }} />
              <Column field="mdrFeeAmount" header="MDR Fee" body={(b: ClearingPaymentBatchModel) => <span className="text-900">{Number(b.mdrFeeAmount || 0).toLocaleString()} HTG</span>} style={{ minWidth: '9.5rem', textAlign: 'right' }} />
              <Column field="netPayableAmount" header={t('clearing.net_payable')} body={(b: ClearingPaymentBatchModel) => <span className="text-900 font-semibold">{Number(b.netPayableAmount || 0).toLocaleString()} HTG</span>} style={{ minWidth: '10rem', textAlign: 'right' }} />
              <Column field="status" header={t('common.status')} body={(b: ClearingPaymentBatchModel) => <Tag value={b.status ? t(`enum.payment_batch_status.${b.status}`) : ''} severity={b.status === PaymentBatchStatus.PAID ? 'success' : b.status === PaymentBatchStatus.DISPUTED ? 'danger' : 'warning'} />} style={{ minWidth: '8.5rem', textAlign: 'center' }} />
              <Column header={t('common.action')} body={(b: ClearingPaymentBatchModel) => (
                <StandardRowActions
                  onView={() => setTrackBatch(b)}
                />
              )} style={{ minWidth: '6rem', textAlign: 'center' }} />
            </DataTable>
          </TabPanel>
        </TabView>
      </div>

      {/* Modal Drill-Down Chi Tiết Giao Dịch Thành Phần Của Đối Tác */}
      <Dialog
        visible={showDetailDialog}
        style={{ width: '900px' }}
        header={
          detailData
            ? t('clearing.detail_title', {
              partner: `[${detailData.partnerCode}] ${detailData.partnerName}`
            })
            : t('common.loading')
        }
        modal
        onHide={() => setShowDetailDialog(false)}
      >
        {detailLoading ? (
          <div className="p-5 text-center text-500">
            <i className="pi pi-spin pi-spinner text-3xl mb-2" />
            <div>{t('common.loading')}</div>
          </div>
        ) : detailData ? (
          <div>
            {/* Thống kê nhanh của đối tác */}
            <div className="flex gap-3 mb-3 surface-100 p-3 border-round">
              <div className="flex-1">
                <span className="text-500 text-xs block">{t('clearing.total_txs')}:</span>
                <span className="font-bold text-lg text-900">{detailData.totalTransactions}</span>
              </div>
              <div className="flex-1">
                <span className="text-500 text-xs block">{t('clearing.detail_points')}:</span>
                <span className="font-bold text-lg text-primary">{Number(detailData.totalPoints || 0).toLocaleString()}</span>
              </div>
              <div className="flex-1">
                <span className="text-500 text-xs block">{t('clearing.detail_amount')}:</span>
                <span className="font-bold text-lg text-green-600">{Number(detailData.totalFiat || 0).toLocaleString()} HTG</span>
              </div>
            </div>

            <DataTable<any>
              value={detailData.transactions || []}
              paginator
              rows={8}
              emptyMessage={t('common.no_data')}
              stripedRows
              responsiveLayout="scroll"
            >
              <Column
                header="#"
                body={(_, opt) => opt.rowIndex + 1}
                style={{ width: '3rem', textAlign: 'center' }}
              />
              <Column field="transactionCode" header={t('clearing.detail_tx_code')} style={{ minWidth: '12rem', fontWeight: 600 }} />
              <Column field="externalUserId" header={t('clearing.detail_user')} style={{ minWidth: '8rem' }} />
              <Column
                field="createdAt"
                header={t('clearing.detail_time')}
                body={(row: PartnerTransactionItemModel) => (
                  <span className="text-sm text-600">
                    {row.createdAt ? new Date(row.createdAt).toLocaleString('vi-VN') : '--'}
                  </span>
                )}
                style={{ minWidth: '10rem', textAlign: 'center' }}
              />
              <Column
                field="role"
                header={t('clearing.detail_role')}
                body={(row: PartnerTransactionItemModel) => (
                  <Tag
                    severity={row.role === 'REDEEMER' ? 'success' : 'warning'}
                    value={row.role === 'REDEEMER' ? t('clearing.role_redeemer') : t('clearing.role_issuer')}
                  />
                )}
                style={{ minWidth: '9rem', textAlign: 'center' }}
              />
              <Column
                field="pointsRedeemed"
                header={t('clearing.detail_points')}
                body={(row: PartnerTransactionItemModel) => (
                  <span className="font-semibold text-primary">
                    {Number(row.pointsRedeemed || 0).toLocaleString()}
                  </span>
                )}
                style={{ minWidth: '6rem', textAlign: 'right' }}
              />
              <Column
                field="fiatAmount"
                header={t('clearing.detail_amount')}
                body={(row: PartnerTransactionItemModel) => `${Number(row.fiatAmount || 0).toLocaleString()} HTG`}
                style={{ minWidth: '7.5rem', textAlign: 'right' }}
              />
              <Column
                field="status"
                header={t('common.status')}
                body={(row: PartnerTransactionItemModel) => statusTemplate(row.status)}
                style={{ minWidth: '7rem', textAlign: 'center' }}
              />
            </DataTable>
          </div>
        ) : null}

        <div className="flex justify-content-end mt-4">
          <Button label={t('common.close')} icon="pi pi-times" outlined onClick={() => setShowDetailDialog(false)} />
        </div>
      </Dialog>

      {/* Dialog Xác nhận Kết chuyển Kỳ Quyết toán */}
      <Dialog
        visible={showConfirmSettle}
        style={{ width: '32rem' }}
        header={t('clearing.settle_confirm_title')}
        modal
        onHide={() => setShowConfirmSettle(false)}
      >
        <div className="flex align-items-center gap-3 mb-4">
          <i className="pi pi-exclamation-triangle text-3xl text-warning" />
          <span>{t('clearing.settle_confirm_msg')}</span>
        </div>
        <div className="flex justify-content-end gap-2">
          <Button label={t('common.cancel')} icon="pi pi-times" outlined onClick={() => setShowConfirmSettle(false)} disabled={isSubmitting} />
          <Button label={t('clearing.settle_action')} icon="pi pi-check" onClick={handleSettlePeriod} loading={isSubmitting} />
        </div>
      </Dialog>

      {/* Dialog Giải Quyết Khiếu Nại Đối Soát */}
      <Dialog
        visible={showResolveDialog}
        style={{ width: '34rem' }}
        header={t('clearing.resolve_dialog_title')}
        modal
        onHide={() => setShowResolveDialog(false)}
      >
        {selectedDispute && (
          <div className="flex flex-column gap-3">
            <div className="flex justify-content-between surface-100 p-2 border-round text-sm">
              <span><strong>{t('common.partner')}:</strong> {selectedDispute.partnerName}</span>
              <span><strong>{t('clearing.dispute_code')}:</strong> {selectedDispute.disputeCode}</span>
            </div>
            <div className="grid">
              <div className="col-6">
                <label className="text-500 text-xs block">{t('clearing.partner_requested_amount')}:</label>
                <div className="font-bold text-lg text-orange-600">{Number(selectedDispute.partnerAmount || 0).toLocaleString()} HTG</div>
              </div>
              <div className="col-6">
                <label className="text-500 text-xs block">{t('clearing.loyalty_recorded_amount')}:</label>
                <div className="font-bold text-lg text-primary">{Number(selectedDispute.loyaltyAmount || 0).toLocaleString()} HTG</div>
              </div>
            </div>
            <div className="flex flex-column gap-1">
              <label className="font-semibold text-sm">{t('clearing.resolution_decision')}:</label>
              <Dropdown
                value={resolveStatus}
                onChange={(e) => setResolveStatus(e.value)}
                options={[
                  { label: t('enum.dispute_status.RESOLVED'), value: DisputeStatus.RESOLVED },
                  { label: t('enum.dispute_status.REJECTED'), value: DisputeStatus.REJECTED },
                  { label: t('enum.dispute_status.INVESTIGATING'), value: DisputeStatus.INVESTIGATING },
                ]}
              />
            </div>
            <div className="flex flex-column gap-1">
              <label className="font-semibold text-sm">{t('clearing.final_resolved_amount_htg')}:</label>
              <InputNumber
                value={resolvedAmount}
                onValueChange={(e) => setResolvedAmount(e.value ?? null)}
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={2}
              />
            </div>
            <div className="flex flex-column gap-1">
              <label className="font-semibold text-sm">{t('clearing.resolution_note')}:</label>
              <InputText
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                placeholder={t('clearing.resolution_note_placeholder')}
              />
            </div>
          </div>
        )}
        <div className="flex justify-content-end gap-2 mt-4">
          <Button label={t('common.cancel')} icon="pi pi-times" outlined onClick={() => setShowResolveDialog(false)} disabled={isSubmitting} />
          <Button label={t('clearing.save_resolution')} icon="pi pi-check" severity="success" onClick={handleSaveResolve} loading={isSubmitting} />
        </div>
      </Dialog>

      {/* Dialog Create Batch PAY-... (LM-07) */}
      <Dialog visible={showCreateBatchDialog} onHide={() => setShowCreateBatchDialog(false)} header={t('clearing.create_batch_title')} style={{ width: '34rem' }} modal className="p-fluid">
        <div className="flex flex-column gap-3">
          <div className="field m-0">
            <label className="text-sm font-medium">{t('clearing.partner_name')} *</label>
            <Dropdown
              value={batchPartnerId}
              options={clearingList.map((c) => ({ label: `[${c.partnerCode}] ${c.partnerName}`, value: c.partnerId }))}
              onChange={(e) => setBatchPartnerId(e.value)}
              placeholder={t('clearing.select_partner_batch')}
              appendTo="self"
            />
          </div>
          <div className="grid">
            <div className="col-6 field m-0">
              <label className="text-sm font-medium">{t('clearing.from_date')}</label>
              <InputText value={fromDate} readOnly className="font-mono bg-50" />
            </div>
            <div className="col-6 field m-0">
              <label className="text-sm font-medium">{t('clearing.to_date')}</label>
              <InputText value={toDate} readOnly className="font-mono bg-50" />
            </div>
          </div>
          <div className="field m-0">
            <label className="text-sm font-medium" title={t('clearing.mdr_fee_tooltip')}>
              {t('clearing.mdr_rate')}
            </label>
            <InputNumber value={batchMdrRate} onValueChange={(e) => setBatchMdrRate(e.value || 0)} min={0} max={20} minFractionDigits={1} maxFractionDigits={2} suffix="%" />
          </div>
        </div>
        <div className="flex justify-content-end gap-2 mt-4">
          <Button label={t('common.cancel')} icon="pi pi-times" outlined onClick={() => setShowCreateBatchDialog(false)} />
          <Button label={t('clearing.create_batch')} icon="pi pi-check" severity="success" onClick={handleCreateBatch} loading={isSubmitting} />
        </div>
      </Dialog>

      {/* Dialog Track Batch (LM-07) */}
      <Dialog visible={!!trackBatch} onHide={() => setTrackBatch(null)} header={trackBatch ? `${t('clearing.track_batch_title')} · ${trackBatch.batchCode}` : ''} style={{ width: '40rem' }} modal>
        {trackBatch && (
          <div className="flex flex-column gap-3">
            <div className="grid text-sm">
              <div className="col-6"><span className="text-500 block text-xs">{t('common.partner')}</span><span className="font-medium">{trackBatch.partnerCode} - {trackBatch.partnerName}</span></div>
              <div className="col-6"><span className="text-500 block text-xs">{t('common.status')}</span><Tag value={trackBatch.status ? t(`enum.payment_batch_status.${trackBatch.status}`) : ''} severity={trackBatch.status === PaymentBatchStatus.PAID ? 'success' : 'warning'} /></div>
              <div className="col-4 mt-2"><span className="text-500 block text-xs">{t('clearing.gross_amount')}</span><span className="font-mono">{Number(trackBatch.grossAmount || 0).toLocaleString()} HTG</span></div>
              <div className="col-4 mt-2"><span className="text-500 block text-xs" title={t('clearing.mdr_fee_tooltip')}>{t('clearing.mdr_fee')}</span><span className="font-mono text-orange-600">{Number(trackBatch.mdrFeeAmount || 0).toLocaleString()} HTG</span></div>
              <div className="col-4 mt-2"><span className="text-500 block text-xs">{t('clearing.net_payable_amount')}</span><span className="font-mono font-medium text-green-700">{Number(trackBatch.netPayableAmount || 0).toLocaleString()} HTG</span></div>
            </div>
            <div>
              <div className="text-xs text-500 mb-1">{t('clearing.settlement_progress')}</div>
              <ProgressBar value={trackBatch.status === PaymentBatchStatus.PAID ? 100 : trackBatch.status === PaymentBatchStatus.PARTNER_CONFIRMED ? 75 : trackBatch.status === PaymentBatchStatus.PENDING_CONFIRM ? 40 : 20} />
            </div>
            <div className="flex justify-content-end gap-2 mt-2">
              <Button label={t('common.close')} outlined onClick={() => setTrackBatch(null)} />
              {trackBatch.status !== PaymentBatchStatus.PAID && (
                <Button label={t('clearing.confirm_settle_batch')} icon="pi pi-check-circle" severity="success" onClick={() => handleConfirmBatch(trackBatch)} loading={isSubmitting} />
              )}
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};

export default ClearingSettlementPage;
