import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { DataTable, DataTablePageEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { useTranslation } from 'react-i18next';
import { AppBreadcrumb } from 'components';
import { TenantSelector } from '@/components/TenantSelector';
import { loyaltyService, PointLedgerItem } from '@/service/loyalty.service';
import { partnerService, Partner } from '@/service/partner.service';

export const Transactions: React.FC = () => {
  const { t } = useTranslation();
  const toastRef = React.useRef<Toast>(null);

  const [items, setItems] = useState<PointLedgerItem[]>([]);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedTenant, setSelectedTenant] = useState<string>('TENANT_NATCASH');
  const [selectedPartner, setSelectedPartner] = useState<string>('ALL');
  const [selectedActionType, setSelectedActionType] = useState<string>('ALL');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [tenantPartners, setTenantPartners] = useState<Partner[]>([]);

  // Server-side lazy pagination state
  const [lazyParams, setLazyParams] = useState({
    first: 0,
    rows: 15,
    page: 0,
  });

  // Selected item for audit detail modal
  const [detailItem, setDetailItem] = useState<PointLedgerItem | null>(null);
  const [detailDialogVisible, setDetailDialogVisible] = useState<boolean>(false);

  // Load partners of selected tenant for filter dropdown
  useEffect(() => {
    let isMounted = true;
    partnerService.getAll(selectedTenant).then((partners) => {
      if (isMounted) {
        setTenantPartners(Array.isArray(partners) ? partners : []);
      }
    }).catch(() => {
      if (isMounted) setTenantPartners([]);
    });
    return () => { isMounted = false; };
  }, [selectedTenant]);

  const fetchData = useCallback(async (page: number, size: number) => {
    setLoading(true);
    try {
      const res = await loyaltyService.getPointLedger(selectedTenant, {
        page,
        size,
        actionType: selectedActionType !== 'ALL' ? selectedActionType : undefined,
        partnerCode: selectedPartner !== 'ALL' ? selectedPartner : undefined,
        keyword: searchKeyword.trim() || undefined,
      });

      setItems(res.items || []);
      setTotalRecords(res.totalElements || 0);
    } catch (e) {
      console.error('[Transactions.fetchData] Error:', e);
      setItems([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  }, [selectedTenant, selectedActionType, selectedPartner, searchKeyword]);

  useEffect(() => {
    // When filters or tenant changes, reset to page 0
    setLazyParams((prev) => ({ ...prev, first: 0, page: 0 }));
    fetchData(0, lazyParams.rows);
  }, [selectedTenant, selectedActionType, selectedPartner, fetchData, lazyParams.rows]);

  const onPage = (event: DataTablePageEvent) => {
    const newPage = event.page ?? Math.floor((event.first ?? 0) / (event.rows ?? 15));
    const newRows = event.rows ?? 15;
    setLazyParams({
      first: event.first ?? 0,
      rows: newRows,
      page: newPage,
    });
    fetchData(newPage, newRows);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setLazyParams((prev) => ({ ...prev, first: 0, page: 0 }));
      fetchData(0, lazyParams.rows);
    }
  };

  const handleRefresh = () => {
    fetchData(lazyParams.page, lazyParams.rows);
  };

  const partnerOptions = useMemo(() => {
    const staticCodes = [
      'NATCASH_WALLET',
      'DELIMART_RETAIL',
      'NATCOM_TELCO',
      'EDH_POWER',
      'FAHASA_BOOKSTORE',
      'HIGHLANDS_COFFEE',
      'CGV_CINEMAS',
      'RINGME',
    ];
    const liveCodes = tenantPartners.map((p) => p.partnerCode).filter(Boolean);
    const allCodes = Array.from(new Set([...staticCodes, ...liveCodes]));

    return [
      { label: t('transaction.filter_partner', { defaultValue: 'Tất cả Đối tác' }), value: 'ALL' },
      ...allCodes.map((code) => {
        const found = tenantPartners.find((p) => p.partnerCode === code);
        const name = found ? found.partnerName : t(`alliance_partners.${code}`, { defaultValue: code });
        return {
          label: `${code} — ${name}`,
          value: code,
        };
      }),
    ];
  }, [tenantPartners, t]);

  const actionTypeOptions = useMemo(() => [
    { label: t('transaction.filter_action', { defaultValue: 'Tất cả Loại GD' }), value: 'ALL' },
    { label: t('action_type.earn', { defaultValue: 'TÍCH ĐIỂM (EARN)' }), value: 'EARN' },
    { label: t('action_type.burn', { defaultValue: 'TIÊU ĐIỂM (BURN)' }), value: 'BURN' },
    { label: t('action_type.reward', { defaultValue: 'THƯỞNG CỘT MỐC (REWARD)' }), value: 'REWARD' },
    { label: t('action_type.spin', { defaultValue: 'VÒNG QUAY (SPIN)' }), value: 'SPIN' },
    { label: t('action_type.voucher', { defaultValue: 'ĐỔI VOUCHER (VOUCHER)' }), value: 'VOUCHER' },
    { label: t('action_type.refund', { defaultValue: 'HOÀN ĐIỂM (REFUND)' }), value: 'REFUND' },
    { label: t('action_type.expire', { defaultValue: 'HẾT HẠN (EXPIRE)' }), value: 'EXPIRE' },
    { label: t('action_type.adjust', { defaultValue: 'ĐIỀU CHỈNH (ADJUST)' }), value: 'ADJUST' },
  ], [t]);

  const copyToClipboard = (text: string, msgKey: string) => {
    navigator.clipboard.writeText(text);
    toastRef.current?.show({
      severity: 'success',
      summary: t('common.success', { defaultValue: 'Thành công' }),
      detail: t(msgKey, { defaultValue: 'Đã sao chép vào bộ nhớ tạm!' }),
      life: 2500,
    });
  };

  const openDetailDialog = (item: PointLedgerItem) => {
    setDetailItem(item);
    setDetailDialogVisible(true);
  };

  // Templates
  const actionBodyTemplate = (rowData: PointLedgerItem) => {
    return (
      <div className="flex align-items-center justify-content-center">
        <Button
          icon="pi pi-eye"
          rounded
          text
          severity="info"
          onClick={() => openDetailDialog(rowData)}
          tooltip={t('transaction.view_detail', { defaultValue: 'Xem chi tiết đối soát' })}
          tooltipOptions={{ position: 'top' }}
        />
      </div>
    );
  };

  const actionTypeTemplate = (rowData: PointLedgerItem) => {
    switch (rowData.actionType) {
      case 'EARN':
        return <Tag severity="success" value={t('action_type.earn', { defaultValue: 'Tích Điểm' })} icon="pi pi-arrow-up-right" />;
      case 'BURN':
        return <Tag severity="danger" value={t('action_type.burn', { defaultValue: 'Tiêu Điểm' })} icon="pi pi-arrow-down-left" />;
      case 'REWARD':
        return <Tag severity="info" value={t('action_type.reward', { defaultValue: 'Thưởng Cột Mốc' })} icon="pi pi-gift" />;
      case 'SPIN':
        return <Tag severity="warning" value={t('action_type.spin', { defaultValue: 'Vòng Quay' })} icon="pi pi-compass" />;
      case 'VOUCHER':
        return <Tag severity="info" value={t('action_type.voucher', { defaultValue: 'Đổi Voucher' })} icon="pi pi-ticket" />;
      case 'REFUND':
        return <Tag severity="help" value={t('action_type.refund', { defaultValue: 'Hoàn Điểm' })} icon="pi pi-replay" />;
      case 'EXPIRE':
        return <Tag severity="secondary" value={t('action_type.expire', { defaultValue: 'Hết Hạn' })} icon="pi pi-clock" />;
      default:
        return <Tag severity="secondary" value={rowData.actionType || t('common.actions', { defaultValue: 'Giao Dịch' })} />;
    }
  };

  const pointsTemplate = (rowData: PointLedgerItem) => {
    const isPositive = rowData.actionType === 'EARN' || rowData.actionType === 'REWARD' || rowData.actionType === 'SPIN';
    return (
      <span className={`font-semibold font-mono ${isPositive ? 'text-green-600' : 'text-orange-600'}`}>
        {isPositive ? `+${rowData.points.toLocaleString()}` : `-${rowData.points.toLocaleString()}`} {t('common.points', { defaultValue: 'Điểm' })}
      </span>
    );
  };

  const balanceAfterTemplate = (rowData: PointLedgerItem) => {
    return (
      <span className="font-normal font-mono text-700">
        {rowData.balanceAfter != null ? rowData.balanceAfter.toLocaleString() : '-'} {t('common.points', { defaultValue: 'Điểm' })}
      </span>
    );
  };

  const partnerTemplate = (rowData: PointLedgerItem) => {
    const name = rowData.partnerName || t(`alliance_partners.${rowData.partnerCode}`, { defaultValue: rowData.partnerCode });
    return (
      <div className="flex flex-column">
        <span className="font-medium text-800">{name}</span>
        <span className="font-mono text-xs text-500">{rowData.partnerCode}</span>
      </div>
    );
  };

  const dateTemplate = (rowData: PointLedgerItem) => {
    if (!rowData.createdAt) return '-';
    try {
      const d = new Date(rowData.createdAt);
      if (isNaN(d.getTime())) return rowData.createdAt;
      return d.toLocaleString('vi-VN');
    } catch {
      return rowData.createdAt;
    }
  };

  const statusTemplate = (rowData: PointLedgerItem) => {
    const status = rowData.status || (rowData.actionType === 'REFUND' ? 'REFUNDED' : rowData.actionType === 'EXPIRE' ? 'EXPIRED' : 'COMPLETED');
    switch (status) {
      case 'REFUNDED':
        return <Tag severity="warning" value={t('transaction.status_refunded', { defaultValue: 'Đã hoàn' })} />;
      case 'EXPIRED':
        return <Tag severity="danger" value={t('transaction.status_expired', { defaultValue: 'Hết hạn' })} />;
      case 'COMPLETED':
      default:
        return <Tag severity="success" value={t('transaction.status_completed', { defaultValue: 'Hoàn tất' })} />;
    }
  };

  const header = (
    <div className="flex flex-wrap gap-3 align-items-center justify-content-between">
      <div className="flex flex-wrap align-items-center gap-3">
        <div>
          <h4 className="m-0 text-primary font-bold">
            {t('transaction.management_title', { defaultValue: 'Nhật ký Biến động Sổ cái Điểm & Giao dịch Loyalty' })}
          </h4>
          <p className="text-xs text-500 m-0 mt-1">
            {t('transaction.subtitle', { defaultValue: 'Kiểm toán biến động điểm thưởng bất biến theo chuẩn kế toán liên minh đa đối tác' })}
          </p>
        </div>
        <TenantSelector value={selectedTenant} onChange={setSelectedTenant} />
      </div>
      <div className="flex flex-wrap gap-2 align-items-center">
        <Dropdown
          value={selectedPartner}
          options={partnerOptions}
          onChange={(e) => setSelectedPartner(e.value)}
          placeholder={t('transaction.filter_partner', { defaultValue: 'Đối tác' })}
          className="w-13rem"
        />
        <Dropdown
          value={selectedActionType}
          options={actionTypeOptions}
          onChange={(e) => setSelectedActionType(e.value)}
          placeholder={t('transaction.filter_action', { defaultValue: 'Loại GD' })}
          className="w-12rem"
        />
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            type="search"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder={t('transaction.search_placeholder', { defaultValue: 'Tìm theo Mã GD, SĐT, Đối tác...' })}
            className="w-14rem md:w-18rem"
          />
        </span>
        <Button
          icon="pi pi-refresh"
          rounded
          outlined
          onClick={handleRefresh}
          tooltip={t('common.refresh', { defaultValue: 'Làm mới' })}
        />
      </div>
    </div>
  );

  return (
    <div>
      <Toast ref={toastRef} />
      <AppBreadcrumb items={[{ label: t('nav.transactions', { defaultValue: 'Sổ Cái & Giao Dịch' }) }]} />

      <div className="card shadow-1 border-round surface-card p-4">
        <DataTable
          value={items}
          lazy
          paginator
          first={lazyParams.first}
          rows={lazyParams.rows}
          totalRecords={totalRecords}
          onPage={onPage}
          loading={loading}
          header={header}
          dataKey="id"
          rowsPerPageOptions={[15, 30, 50]}
          emptyMessage={t('common.no_data', { defaultValue: 'Chưa có biến động giao dịch điểm nào phù hợp với bộ lọc' })}
          stripedRows
          responsiveLayout="scroll"
        >
          {/* Cột 1: STT */}
          <Column
            header="#"
            body={(_, { rowIndex }) => rowIndex + 1 + lazyParams.first}
            style={{ width: '3.5rem', textAlign: 'center' }}
          />

          {/* Cột 2: Thao tác (Xem chi tiết) */}
          <Column
            header={t('transaction.actions', { defaultValue: 'Thao tác' })}
            body={actionBodyTemplate}
            style={{ width: '4.5rem', textAlign: 'center' }}
          />

          {/* Cột 3: Mã GD */}
          <Column
            field="transactionId"
            header={<span title={t('transaction.id_tooltip', { defaultValue: 'Mã định danh giao dịch sổ cái duy nhất' })}>{t('transaction.id', { defaultValue: 'Mã GD' })}</span>}
            body={(row: PointLedgerItem) => (
              <div className="flex align-items-center gap-1">
                <span className="font-mono font-bold text-primary text-sm">{row.transactionId}</span>
                <Button
                  icon="pi pi-copy"
                  text
                  rounded
                  className="p-1 text-400 hover:text-primary"
                  style={{ width: '1.5rem', height: '1.5rem' }}
                  onClick={() => copyToClipboard(row.transactionId, 'transaction.copied_tx_code')}
                  tooltip={t('transaction.copy_tx_code', { defaultValue: 'Sao chép mã GD' })}
                  tooltipOptions={{ position: 'top' }}
                />
              </div>
            )}
            style={{ minWidth: '12rem' }}
          />

          {/* Cột 4: Số Điện Thoại / User ID */}
          <Column
            field="externalUserId"
            header={<span title={t('transaction.phone_tooltip', { defaultValue: 'Số điện thoại hoặc mã định danh hội viên' })}>{t('transaction.phone', { defaultValue: 'Số Điện Thoại' })}</span>}
            body={(row: PointLedgerItem) => <span className="font-mono text-800">{row.externalUserId}</span>}
            style={{ minWidth: '10rem' }}
          />

          {/* Cột 5: Loại GD */}
          <Column
            field="actionType"
            body={actionTypeTemplate}
            header={<span title={t('transaction.action_tooltip', { defaultValue: 'Loại biến động điểm trong hệ thống' })}>{t('transaction.action_type', { defaultValue: 'Loại GD' })}</span>}
            style={{ minWidth: '9rem', textAlign: 'center' }}
          />

          {/* Cột 6: Biến Động Điểm */}
          <Column
            field="points"
            body={pointsTemplate}
            header={<span title={t('transaction.amount_tooltip', { defaultValue: 'Số lượng điểm cộng hoặc trừ' })}>{t('transaction.amount', { defaultValue: 'Biến Động' })}</span>}
            style={{ minWidth: '8.5rem', textAlign: 'center' }}
          />

          {/* Cột 7: Số Dư Sau */}
          <Column
            field="balanceAfter"
            body={balanceAfterTemplate}
            header={<span title={t('transaction.balance_after_tooltip', { defaultValue: 'Số dư khả dụng của hội viên sau giao dịch' })}>{t('transaction.balance_after', { defaultValue: 'Số Dư Sau' })}</span>}
            style={{ minWidth: '8.5rem', textAlign: 'center' }}
          />

          {/* Cột 8: Đối Tác */}
          <Column
            field="partnerCode"
            body={partnerTemplate}
            header={<span title={t('transaction.partner_tooltip', { defaultValue: 'Đơn vị đối tác liên minh phát sinh giao dịch' })}>{t('transaction.partner', { defaultValue: 'Đối Tác' })}</span>}
            style={{ minWidth: '12rem' }}
          />

          {/* Cột 9: Thời Gian */}
          <Column
            field="createdAt"
            body={dateTemplate}
            header={t('common.created_at', { defaultValue: 'Thời Gian' })}
            style={{ minWidth: '10.5rem' }}
          />

          {/* Cột 10: Trạng Thái */}
          <Column
            header={t('transaction.status', { defaultValue: 'Trạng Thái' })}
            body={statusTemplate}
            style={{ width: '7.5rem', textAlign: 'center' }}
          />
        </DataTable>
      </div>

      {/* MODAL CHI TIẾT ĐỐI SOÁT GIAO DỊCH SỔ CÁI */}
      <Dialog
        header={
          <div className="flex align-items-center gap-2">
            <i className="pi pi-book text-primary text-xl" />
            <div>
              <div className="font-bold text-lg text-primary">{t('transaction.detail_title', { defaultValue: 'Chi Tiết Giao Dịch Sổ Cái Điểm' })}</div>
              <div className="text-xs text-500 font-normal">{t('transaction.detail_subtitle', { defaultValue: 'Chứng từ kế toán & kiểm toán biến động điểm bất biến' })}</div>
            </div>
          </div>
        }
        visible={detailDialogVisible}
        style={{ width: '640px' }}
        modal
        onHide={() => setDetailDialogVisible(false)}
        footer={
          <Button
            label={t('common.close', { defaultValue: 'Đóng' })}
            icon="pi pi-times"
            outlined
            onClick={() => setDetailDialogVisible(false)}
          />
        }
      >
        {detailItem && (
          <div className="flex flex-column gap-3 pt-2">
            {/* KHỐI CÂN BẰNG SỔ CÁI KẾ TOÁN (DOUBLE-ENTRY BALANCE) */}
            <div className="surface-100 p-3 border-round border-1 surface-border">
              <div className="font-semibold text-700 text-xs mb-2 uppercase tracking-wide">
                {t('transaction.double_entry_title', { defaultValue: 'Cân Bằng Sổ Cái Điểm (Double-Entry Balance)' })}
              </div>
              <div className="grid text-center align-items-center">
                <div className="col-4">
                  <div className="text-xs text-500 mb-1">{t('transaction.balance_before', { defaultValue: 'Số Dư Trước' })}</div>
                  <div className="font-mono font-bold text-lg text-700">
                    {detailItem.balanceBefore != null ? detailItem.balanceBefore.toLocaleString() : '-'}
                  </div>
                  <div className="text-xs text-400">{t('common.points', { defaultValue: 'Điểm' })}</div>
                </div>

                <div className="col-4">
                  <div className="text-xs text-500 mb-1">{t('transaction.amount', { defaultValue: 'Biến Động' })}</div>
                  <div className={`font-mono font-bold text-xl ${(detailItem.actionType === 'EARN' || detailItem.actionType === 'REWARD' || detailItem.actionType === 'SPIN') ? 'text-green-600' : 'text-orange-600'}`}>
                    {(detailItem.actionType === 'EARN' || detailItem.actionType === 'REWARD' || detailItem.actionType === 'SPIN') ? `+${detailItem.points.toLocaleString()}` : `-${detailItem.points.toLocaleString()}`}
                  </div>
                  <div>{actionTypeTemplate(detailItem)}</div>
                </div>

                <div className="col-4">
                  <div className="text-xs text-500 mb-1">{t('transaction.balance_after', { defaultValue: 'Số Dư Sau' })}</div>
                  <div className="font-mono font-bold text-lg text-primary">
                    {detailItem.balanceAfter != null ? detailItem.balanceAfter.toLocaleString() : '-'}
                  </div>
                  <div className="text-xs text-400">{t('common.points', { defaultValue: 'Điểm' })}</div>
                </div>
              </div>
            </div>

            {/* THÔNG TIN GIAO DỊCH & THAM CHIẾU */}
            <div className="border-1 surface-border border-round p-3">
              <div className="font-semibold text-primary text-sm mb-3">
                <i className="pi pi-receipt mr-2" />
                {t('transaction.tx_info_title', { defaultValue: 'Thông Tin Giao Dịch & Tham Chiếu' })}
              </div>
              <div className="grid">
                <div className="col-6">
                  <span className="text-500 text-xs">{t('transaction.tx_id', { defaultValue: 'Mã Giao Dịch Sổ Cái' })}:</span>
                  <div className="font-mono font-bold text-sm text-primary flex align-items-center gap-1 mt-1">
                    <span>{detailItem.transactionId}</span>
                    <Button
                      icon="pi pi-copy"
                      text
                      rounded
                      className="p-0 text-400 hover:text-primary"
                      style={{ width: '1.2rem', height: '1.2rem' }}
                      onClick={() => copyToClipboard(detailItem.transactionId, 'transaction.copied_tx_code')}
                    />
                  </div>
                </div>

                <div className="col-6">
                  <span className="text-500 text-xs">{t('transaction.reference_code', { defaultValue: 'Mã Tham Chiếu Gốc (POS / Bill)' })}:</span>
                  <div className="font-mono text-sm text-800 mt-1">
                    {detailItem.referenceId || detailItem.transactionId}
                  </div>
                </div>

                <div className="col-6 mt-2">
                  <span className="text-500 text-xs">{t('transaction.created_at', { defaultValue: 'Thời Gian Ghi Sổ' })}:</span>
                  <div className="font-normal text-sm text-700 mt-1">{dateTemplate(detailItem)}</div>
                </div>

                <div className="col-6 mt-2">
                  <span className="text-500 text-xs">{t('transaction.status', { defaultValue: 'Trạng Thái' })}:</span>
                  <div className="mt-1">{statusTemplate(detailItem)}</div>
                </div>

                <div className="col-12 mt-2">
                  <span className="text-500 text-xs">{t('transaction.description', { defaultValue: 'Diễn Giải Nội Dung' })}:</span>
                  <div className="text-sm text-800 surface-50 p-2 border-round mt-1">
                    {detailItem.description || t('common.no_description', { defaultValue: 'Không có ghi chú' })}
                  </div>
                </div>
              </div>
            </div>

            {/* THÔNG TIN HỘI VIÊN & ĐỐI TÁC */}
            <div className="border-1 surface-border border-round p-3">
              <div className="font-semibold text-primary text-sm mb-3">
                <i className="pi pi-users mr-2" />
                {t('transaction.member_info_title', { defaultValue: 'Thông Tin Hội Viên & Đối Tác' })}
              </div>
              <div className="grid">
                <div className="col-6">
                  <span className="text-500 text-xs">{t('transaction.member_phone', { defaultValue: 'Số Điện Thoại / User ID' })}:</span>
                  <div className="font-mono font-bold text-sm text-800 mt-1">{detailItem.externalUserId}</div>
                </div>

                <div className="col-6">
                  <span className="text-500 text-xs">{t('transaction.tenant_name', { defaultValue: 'Đơn Vị Thuê Bao' })}:</span>
                  <div className="font-medium text-sm text-primary mt-1">{selectedTenant}</div>
                </div>

                <div className="col-6 mt-2">
                  <span className="text-500 text-xs">{t('transaction.partner_name', { defaultValue: 'Tên Đơn Vị Đối Tác' })}:</span>
                  <div className="font-medium text-sm text-800 mt-1">
                    {detailItem.partnerName || t(`alliance_partners.${detailItem.partnerCode}`, { defaultValue: detailItem.partnerCode })}
                  </div>
                </div>

                <div className="col-6 mt-2">
                  <span className="text-500 text-xs">{t('transaction.partner_code', { defaultValue: 'Mã Đối Tác' })}:</span>
                  <div className="font-mono text-sm text-600 mt-1">{detailItem.partnerCode}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};

export default Transactions;
