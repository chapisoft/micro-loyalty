import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Tag } from 'primereact/tag';
import { Calendar } from 'primereact/calendar';
import { Toast } from 'primereact/toast';
import { AppBreadcrumb } from 'components';
import { TenantSelector } from '@/components/TenantSelector';
import { ClearingStatus } from '@/models';
import { LoyaltyService, ClearingSummaryModel, PartnerTransactionItemModel, PartnerTransactionsResponseModel } from '@/service/loyalty.service';

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
  const [selectedItems, setSelectedItems] = useState<ClearingSummaryModel[]>([]);
  const [showConfirmSettle, setShowConfirmSettle] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [settleSuccessMsg, setSettleSuccessMsg] = useState<string | null>(null);

  // Drill-down Modal State
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState<PartnerTransactionsResponseModel | null>(null);

  const fetchClearingData = useCallback(async () => {
    setLoading(true);
    try {
      const fromIso = fromDate ? new Date(fromDate + 'T00:00:00').toISOString() : undefined;
      const toIso = toDate ? new Date(toDate + 'T23:59:59').toISOString() : undefined;
      const report = await LoyaltyService.getClearingReport(selectedTenant, fromIso, toIso);
      if (report && Array.isArray(report.partnerSummaries)) {
        setClearingList(report.partnerSummaries);
      } else {
        setClearingList([]);
      }
    } catch (e) {
      console.error('[fetchClearingData] Error:', e);
      setClearingList([]);
    } finally {
      setLoading(false);
    }
  }, [selectedTenant, fromDate, toDate]);

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
        summary: t('common.error', { defaultValue: 'Lỗi' }),
        detail: err?.message || 'Không thể tải chi tiết giao dịch của đối tác!',
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
        setSettleSuccessMsg(t('clearing.batch_success', { code: res.settlementBatchCode, defaultValue: `Quyết toán thành công! Mã lô kết chuyển: ${res.settlementBatchCode}` }));
      } else {
        setSettleSuccessMsg(res?.message || t('clearing.settle_success', { defaultValue: 'Quyết toán kết chuyển kỳ bù trừ thành công!' }));
      }
      setShowConfirmSettle(false);
      await fetchClearingData();
    } catch (e: any) {
      console.error('[handleSettlePeriod] Error:', e);
      toast.current?.show({
        severity: 'error',
        summary: t('common.error', { defaultValue: 'Lỗi' }),
        detail: e?.response?.data?.message || e?.message || 'Không thể thực hiện quyết toán bù trừ!',
        life: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusTemplate = (status: string) => {
    return status === ClearingStatus.SETTLED ? (
      <Tag severity="success" value={t('common.settled', { defaultValue: 'Đã quyết toán' })} />
    ) : (
      <Tag severity="warning" value={t('common.pending', { defaultValue: 'Chờ quyết toán' })} />
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

  // Cột Thao tác trên từng dòng đối tác
  const actionTemplate = (rowData: ClearingSummaryModel) => (
    <div className="flex justify-content-center">
      <Button
        icon="pi pi-list"
        rounded
        outlined
        severity="info"
        size="small"
        onClick={() => handleViewDetails(rowData)}
        tooltip={t('clearing.view_detail_tooltip', { defaultValue: 'Xem chi tiết các hóa đơn' })}
      />
    </div>
  );

  const header = (
    <div className="flex flex-wrap gap-3 align-items-center justify-content-between">
      <div className="flex flex-wrap gap-2 align-items-center">
        <span className="font-bold text-lg text-primary">{t('clearing.management_title', { defaultValue: 'Bảng Đối Soát Bù Trừ Đa Phương' })}</span>
        {selectedItems.length > 0 && (
          <Tag severity="info" value={`${selectedItems.length} đối tác được chọn`} />
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
          tooltip={t('common.refresh', { defaultValue: 'Làm mới dữ liệu' })}
        />
        <Button
          label={t('clearing.export_excel', { defaultValue: 'Xuất Excel' })}
          icon="pi pi-file-excel"
          severity="success"
          outlined
          onClick={() => dt.current?.exportCSV()}
          tooltip={t('clearing.export_excel_tooltip', { defaultValue: 'Xuất dữ liệu bảng đối soát ra file CSV/Excel' })}
        />
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
      <Toast ref={toast} position="top-center" />
      <AppBreadcrumb items={[{ label: t('nav.clearing', { defaultValue: 'Bù Trừ & Quyết Toán' }) }]} />

      {/* Header Bar với TenantSelector và Bộ lọc khoảng ngày */}
      <div className="card shadow-1 border-round surface-card p-4 mb-4">
        <div className="flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
          <div>
            <h3 className="m-0 text-900 font-bold">{t('clearing.management_title', { defaultValue: 'Quyết Toán Bù Trừ Tài Chính Đa Phương' })}</h3>
            <p className="text-500 m-0 mt-1 text-sm">{t('clearing.subtitle', { defaultValue: 'Báo cáo tổng hợp số điểm phát hành và số điểm chấp nhận tiêu dùng giữa các bên liên minh' })}</p>
          </div>
          <div className="flex align-items-center gap-2">
            <TenantSelector value={selectedTenant} onChange={setSelectedTenant} />
          </div>
        </div>

        {/* Bộ lọc khoảng ngày đối soát & Chọn nhanh kỳ */}
        <div className="flex flex-wrap align-items-center justify-content-between gap-3 surface-50 p-3 border-round">
          <div className="flex flex-wrap align-items-center gap-3">
            <div className="flex align-items-center gap-2">
              <label htmlFor="fromDate" className="font-semibold text-sm text-700">{t('clearing.filter_date_from', { defaultValue: 'Từ ngày' })}:</label>
              <Calendar
                id="fromDate"
                value={parseLocalDate(fromDate)}
                onChange={(e) => setFromDate(e.value ? formatLocalDate(e.value as Date) : '')}
                dateFormat="yy-mm-dd"
                showIcon
                appendTo="self"
              />
            </div>
            <div className="flex align-items-center gap-2">
              <label htmlFor="toDate" className="font-semibold text-sm text-700">{t('clearing.filter_date_to', { defaultValue: 'Đến ngày' })}:</label>
              <Calendar
                id="toDate"
                value={parseLocalDate(toDate)}
                onChange={(e) => setToDate(e.value ? formatLocalDate(e.value as Date) : '')}
                dateFormat="yy-mm-dd"
                showIcon
                appendTo="self"
              />
            </div>
            <Button
              icon="pi pi-search"
              label={t('common.search', { defaultValue: 'Tra cứu' })}
              severity="primary"
              onClick={fetchClearingData}
              loading={loading}
            />
          </div>

          {/* Nút chọn nhanh kỳ kế toán */}
          <div className="flex flex-wrap align-items-center gap-2">
            <span className="text-500 text-xs font-semibold">{t('common.quick_select', { defaultValue: 'Kỳ nhanh:' })}</span>
            <Button
              label={t('common.this_month', { defaultValue: 'Tháng này' })}
              size="small"
              text
              severity="secondary"
              onClick={() => handleQuickPeriod('THIS_MONTH')}
            />
            <Button
              label={t('common.last_month', { defaultValue: 'Tháng trước' })}
              size="small"
              text
              severity="secondary"
              onClick={() => handleQuickPeriod('LAST_MONTH')}
            />
            <Button
              label={t('common.last_7_days', { defaultValue: '7 ngày qua' })}
              size="small"
              text
              severity="secondary"
              onClick={() => handleQuickPeriod('LAST_7_DAYS')}
            />
          </div>
        </div>
      </div>

      {settleSuccessMsg && (
        <div className="p-3 mb-4 border-round bg-green-50 text-green-800 border-1 border-green-200 flex align-items-center justify-content-between">
          <span><i className="pi pi-check-circle mr-2" />{settleSuccessMsg}</span>
          <Button icon="pi pi-times" text rounded severity="success" onClick={() => setSettleSuccessMsg(null)} />
        </div>
      )}

      {/* Thẻ Thống Kê Tổng Quan 4 Chỉ Số Cân Bằng */}
      <div className="grid mb-4">
        <div className="col-12 sm:col-6 lg:col-3">
          <div className="card shadow-1 border-round surface-card p-3">
            <span className="text-500 font-medium block mb-1 text-sm">{t('clearing.total_txs', { defaultValue: 'Tổng số GD đối soát' })}</span>
            <div className="text-900 font-bold text-2xl">{totalTransactions.toLocaleString()}</div>
          </div>
        </div>
        <div className="col-12 sm:col-6 lg:col-3">
          <div className="card shadow-1 border-round surface-card p-3">
            <span className="text-500 font-medium block mb-1 text-sm">{t('clearing.total_points_issued', { defaultValue: 'Tổng điểm phát hành' })}</span>
            <div className="text-orange-500 font-bold text-2xl">{totalPointsIssued.toLocaleString()} {t('common.points', { defaultValue: 'Điểm' })}</div>
          </div>
        </div>
        <div className="col-12 sm:col-6 lg:col-3">
          <div className="card shadow-1 border-round surface-card p-3">
            <span className="text-500 font-medium block mb-1 text-sm">{t('clearing.total_points_redeemed', { defaultValue: 'Tổng điểm thu hồi' })}</span>
            <div className="text-primary font-bold text-2xl">{totalPointsRedeemed.toLocaleString()} {t('common.points', { defaultValue: 'Điểm' })}</div>
          </div>
        </div>
        <div className="col-12 sm:col-6 lg:col-3">
          <div className="card shadow-1 border-round surface-card p-3">
            <span className="text-500 font-medium block mb-1 text-sm">{t('clearing.net_amount', { defaultValue: 'Tổng dư nợ ròng liên minh' })}</span>
            <div className={`font-bold text-2xl ${totalNetSettlement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalNetSettlement >= 0 ? '+' : ''}{totalNetSettlement.toLocaleString()} HTG
            </div>
          </div>
        </div>
      </div>

      {/* Bảng Danh Sách Bù Trừ Đa Phương Theo Chuẩn AGENTS.md */}
      <div className="card shadow-1 border-round surface-card p-4">
        <DataTable<any>
          ref={dt}
          value={clearingList}
          selection={selectedItems}
          onSelectionChange={(e: any) => setSelectedItems(e.value || [])}
          header={header}
          dataKey="partnerId"
          paginator
          rows={10}
          loading={loading}
          emptyMessage={t('common.no_data', { defaultValue: 'Không có dữ liệu đối soát trong khoảng thời gian này' })}
          stripedRows
          responsiveLayout="scroll"
        >
          <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
          <Column
            header={t('common.no_order', { defaultValue: '#' })}
            body={(_, options) => options.rowIndex + 1}
            style={{ width: '3.5rem', textAlign: 'center' }}
          />
          <Column
            header={t('common.action', { defaultValue: 'Thao tác' })}
            body={actionTemplate}
            exportable={false}
            style={{ width: '6rem', textAlign: 'center' }}
          />
          <Column field="partnerCode" header={t('clearing.partner_code', { defaultValue: 'Mã Đối Tác' })} sortable style={{ minWidth: '9rem', fontWeight: 600 }} />
          <Column field="partnerName" header={t('clearing.partner_name', { defaultValue: 'Tên Đối Tác' })} sortable style={{ minWidth: '13rem' }} />
          <Column field="partnerType" header={t('clearing.partner_type', { defaultValue: 'Loại' })} body={partnerTypeTemplate} sortable style={{ minWidth: '6.5rem', textAlign: 'center' }} />
          <Column field="totalTransactions" header={<span title={t('clearing.total_txs_tooltip', { defaultValue: 'Tổng số giao dịch bù trừ trong kỳ đối soát' })}>{t('clearing.total_txs', { defaultValue: 'Số GD' })}</span>} sortable style={{ minWidth: '6rem', textAlign: 'center' }} />
          <Column field="totalPointsIssued" header={<span title={t('clearing.total_points_issued_tooltip', { defaultValue: 'Tổng số điểm đối tác phát hành cho hội viên (Nợ quỹ liên minh)' })}>{t('clearing.total_points_issued', { defaultValue: 'Điểm Phát Hành' })}</span>} body={(row: ClearingSummaryModel) => Number(row.totalPointsIssued || 0).toLocaleString()} sortable style={{ minWidth: '8.5rem', textAlign: 'center' }} />
          <Column field="totalPointsRedeemed" header={<span title={t('clearing.total_points_redeemed_tooltip', { defaultValue: 'Tổng số điểm đối tác chấp nhận trừ trên hóa đơn (Quyền thu tiền)' })}>{t('clearing.total_points_redeemed', { defaultValue: 'Điểm Thu Hồi' })}</span>} body={(row: ClearingSummaryModel) => Number(row.totalPointsRedeemed || 0).toLocaleString()} sortable style={{ minWidth: '8.5rem', textAlign: 'center' }} />
          <Column field="totalFiatPayable" header={<span title={t('clearing.payable_tooltip', { defaultValue: 'Số tiền mặt phải trả vào Quỹ liên minh (HTG)' })}>{t('clearing.total_fiat_payable', { defaultValue: 'Phải Trả' })}</span>} body={(row: ClearingSummaryModel) => `${Number(row.totalFiatPayable || 0).toLocaleString()} HTG`} sortable style={{ minWidth: '8.5rem', textAlign: 'center' }} />
          <Column field="totalFiatReceivable" header={<span title={t('clearing.receivable_tooltip', { defaultValue: 'Số tiền mặt được nhận hoàn từ Quỹ liên minh (HTG)' })}>{t('clearing.total_fiat_receivable', { defaultValue: 'Phải Thu' })}</span>} body={(row: ClearingSummaryModel) => `${Number(row.totalFiatReceivable || 0).toLocaleString()} HTG`} sortable style={{ minWidth: '8.5rem', textAlign: 'center' }} />
          <Column field="netSettlementAmount" body={netAmountTemplate} header={<span title={t('clearing.net_amount_tooltip', { defaultValue: 'Số tiền chênh lệch bù trừ ròng = Phải Thu - Phải Trả (HTG)' })}>{t('clearing.net_amount', { defaultValue: 'Dư Nợ Ròng' })}</span>} sortable style={{ minWidth: '9.5rem', textAlign: 'center' }} />
          <Column field="status" body={(row: ClearingSummaryModel) => statusTemplate(row.status)} header={t('common.status', { defaultValue: 'Trạng Thái' })} sortable style={{ minWidth: '8.5rem', textAlign: 'center' }} />
        </DataTable>
      </div>

      {/* Modal Drill-Down Chi Tiết Giao Dịch Thành Phần Của Đối Tác */}
      <Dialog
        visible={showDetailDialog}
        style={{ width: '900px' }}
        header={
          detailData
            ? t('clearing.detail_title', { partner: `[${detailData.partnerCode}] ${detailData.partnerName}`, defaultValue: `Chi Tiết Giao Dịch Bù Trừ - [${detailData.partnerCode}] ${detailData.partnerName}` })
            : t('common.loading', { defaultValue: 'Đang tải dữ liệu...' })
        }
        modal
        onHide={() => setShowDetailDialog(false)}
      >
        {detailLoading ? (
          <div className="p-5 text-center text-500">
            <i className="pi pi-spin pi-spinner text-3xl mb-2" />
            <div>{t('common.loading', { defaultValue: 'Đang tải danh sách giao dịch...' })}</div>
          </div>
        ) : detailData ? (
          <div>
            {/* Thống kê nhanh của đối tác */}
            <div className="flex gap-3 mb-3 surface-100 p-3 border-round">
              <div className="flex-1">
                <span className="text-500 text-xs block">{t('clearing.total_txs', { defaultValue: 'Tổng số GD' })}:</span>
                <span className="font-bold text-lg text-900">{detailData.totalTransactions}</span>
              </div>
              <div className="flex-1">
                <span className="text-500 text-xs block">{t('clearing.detail_points', { defaultValue: 'Tổng điểm quy đổi' })}:</span>
                <span className="font-bold text-lg text-primary">{Number(detailData.totalPoints || 0).toLocaleString()}</span>
              </div>
              <div className="flex-1">
                <span className="text-500 text-xs block">{t('clearing.detail_amount', { defaultValue: 'Tổng tiền chiết khấu' })}:</span>
                <span className="font-bold text-lg text-green-600">{Number(detailData.totalFiat || 0).toLocaleString()} HTG</span>
              </div>
            </div>

            <DataTable<any>
              value={detailData.transactions || []}
              paginator
              rows={8}
              emptyMessage={t('common.no_data', { defaultValue: 'Không có giao dịch thành phần nào' })}
              stripedRows
              responsiveLayout="scroll"
            >
              <Column
                header="#"
                body={(_, opt) => opt.rowIndex + 1}
                style={{ width: '3rem', textAlign: 'center' }}
              />
              <Column field="transactionCode" header={t('clearing.detail_tx_code', { defaultValue: 'Mã Giao Dịch' })} style={{ minWidth: '12rem', fontWeight: 600 }} />
              <Column field="externalUserId" header={t('clearing.detail_user', { defaultValue: 'Khách Hàng' })} style={{ minWidth: '8rem' }} />
              <Column
                field="createdAt"
                header={t('clearing.detail_time', { defaultValue: 'Thời Gian' })}
                body={(row: PartnerTransactionItemModel) => (
                  <span className="text-sm text-600">
                    {row.createdAt ? new Date(row.createdAt).toLocaleString('vi-VN') : '--'}
                  </span>
                )}
                style={{ minWidth: '10rem', textAlign: 'center' }}
              />
              <Column
                field="role"
                header={t('clearing.detail_role', { defaultValue: 'Vai Trò' })}
                body={(row: PartnerTransactionItemModel) => (
                  <Tag
                    severity={row.role === 'REDEEMER' ? 'success' : 'warning'}
                    value={row.role === 'REDEEMER' ? t('clearing.role_redeemer', { defaultValue: 'Thu hồi tại quầy' }) : t('clearing.role_issuer', { defaultValue: 'Phát hành điểm' })}
                  />
                )}
                style={{ minWidth: '9rem', textAlign: 'center' }}
              />
              <Column
                field="pointsRedeemed"
                header={t('clearing.detail_points', { defaultValue: 'Điểm' })}
                body={(row: PartnerTransactionItemModel) => (
                  <span className="font-semibold text-primary">
                    {Number(row.pointsRedeemed || 0).toLocaleString()}
                  </span>
                )}
                style={{ minWidth: '6rem', textAlign: 'right' }}
              />
              <Column
                field="fiatAmount"
                header={t('clearing.detail_amount', { defaultValue: 'Số Tiền' })}
                body={(row: PartnerTransactionItemModel) => `${Number(row.fiatAmount || 0).toLocaleString()} HTG`}
                style={{ minWidth: '7.5rem', textAlign: 'right' }}
              />
              <Column
                field="status"
                header={t('common.status', { defaultValue: 'Trạng Thái' })}
                body={(row: PartnerTransactionItemModel) => statusTemplate(row.status)}
                style={{ minWidth: '7rem', textAlign: 'center' }}
              />
            </DataTable>
          </div>
        ) : null}

        <div className="flex justify-content-end mt-4">
          <Button label={t('common.close', { defaultValue: 'Đóng' })} icon="pi pi-times" outlined onClick={() => setShowDetailDialog(false)} />
        </div>
      </Dialog>

      {/* Dialog Xác nhận Kết chuyển Kỳ Quyết toán */}
      <Dialog
        visible={showConfirmSettle}
        style={{ width: '32rem' }}
        header={t('clearing.settle_confirm_title', { defaultValue: 'Xác nhận Quyết toán Kỳ Bù trừ' })}
        modal
        onHide={() => setShowConfirmSettle(false)}
      >
        <div className="flex align-items-center gap-3 mb-4">
          <i className="pi pi-exclamation-triangle text-3xl text-warning" />
          <span>{t('clearing.settle_confirm_msg', { defaultValue: 'Bạn có chắc chắn muốn chốt quyết toán và kết chuyển công nợ kỳ này? Các giao dịch sau khi kết chuyển sẽ chuyển sang trạng thái ĐÃ QUYẾT TOÁN và được lưu vào sổ cái chốt kỳ bất biến.' })}</span>
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
