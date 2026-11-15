import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { DataTable, DataTablePageEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { InputNumber } from 'primereact/inputnumber';
import { InputTextarea } from 'primereact/inputtextarea';
import { useTranslation } from 'react-i18next';
import { StandardPageHeader } from '@/components/StandardPageHeader';
import { UniversalFilterBar } from '@/components/UniversalFilterBar';
import { StandardRowActions } from '@/components/StandardRowActions';
import { exportToExcel } from '@/components/exportHelper';
import { AdjustmentDirection, CurrencyAssetType, PointActionType } from '@/models';
import { loyaltyService, LoyaltyService, PointLedgerItem } from '@/service/loyalty.service';
import { partnerService, Partner } from '@/service/partner.service';
import { useGeneralCategory } from '@/hooks/useGeneralCategory';

export const Transactions: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { data: dbTxTypes } = useGeneralCategory('TRANSACTION_TYPE');
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

  // DT-02 Manual Point Adjustment (2-layer approval)
  const [adjustVisible, setAdjustVisible] = useState<boolean>(false);
  const [adjustSubmitting, setAdjustSubmitting] = useState<boolean>(false);
  const [adjustUserId, setAdjustUserId] = useState<string>('');
  const [adjustDirection, setAdjustDirection] = useState<AdjustmentDirection>(AdjustmentDirection.CREDIT);
  const [adjustAssetType, setAdjustAssetType] = useState<CurrencyAssetType>(CurrencyAssetType.LOYALTY_COIN);
  const [adjustAmount, setAdjustAmount] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [adjustTicketRef, setAdjustTicketRef] = useState<string>('');

  const handleSubmitAdjustment = async () => {
    if (!adjustUserId.trim() || adjustAmount <= 0 || !adjustReason.trim()) {
      toastRef.current?.show({ severity: 'warn', summary: t('common.warn'), detail: t('transaction.adjust_required') });
      return;
    }
    setAdjustSubmitting(true);
    try {
      await LoyaltyService.createPointAdjustment(
        {
          externalUserId: adjustUserId.trim(),
          direction: adjustDirection,
          assetType: adjustAssetType,
          points: adjustAmount,
          reason: adjustReason.trim(),
          referenceDoc: adjustTicketRef.trim() || undefined,
        },
        selectedTenant
      );
      toastRef.current?.show({
        severity: 'success',
        summary: t('common.success'),
        detail: t('transaction.adjust_submitted'),
      });
      setAdjustVisible(false);
      setAdjustUserId('');
      setAdjustAmount(0);
      setAdjustReason('');
      setAdjustTicketRef('');
    } catch (err: any) {
      toastRef.current?.show({ severity: 'error', summary: t('common.error'), detail: err?.response?.data?.message || err.message });
    } finally {
      setAdjustSubmitting(false);
    }
  };

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
      { label: t('transaction.filter_partner'), value: 'ALL' },
      ...allCodes.map((code) => {
        const found = tenantPartners.find((p) => p.partnerCode === code);
        const name = found ? found.partnerName : (i18n.exists(`alliance_partners.${code}`) ? t(`alliance_partners.${code}`) : code);
        return {
          label: `${code} — ${name}`,
          value: code,
        };
      }),
    ];
  }, [tenantPartners, t, i18n]);

  const actionTypeOptions = useMemo(() => {
    const list = [{ label: t('transaction.filter_action', 'Tất cả loại giao dịch'), value: 'ALL' }];
    if (dbTxTypes.length > 0) {
      dbTxTypes.forEach((item) => {
        list.push({ label: item.name, value: item.code });
      });
    } else {
      list.push(
        { label: t('action_type.earn'), value: 'EARN' },
        { label: t('action_type.burn'), value: 'BURN' },
        { label: t('action_type.reward'), value: 'REWARD' },
        { label: t('action_type.spin'), value: 'SPIN' },
        { label: t('action_type.voucher'), value: 'VOUCHER' },
        { label: t('action_type.refund'), value: 'REFUND' },
        { label: t('action_type.expire'), value: 'EXPIRE' },
        { label: t('action_type.adjust'), value: 'ADJUST' },
      );
    }
    return list;
  }, [dbTxTypes, t]);

  const copyToClipboard = (text: string, msgKey: string) => {
    navigator.clipboard.writeText(text);
    toastRef.current?.show({
      severity: 'success',
      summary: t('common.success'),
      detail: t(msgKey),
      life: 2500,
    });
  };

  const openDetailDialog = (item: PointLedgerItem) => {
    setDetailItem(item);
    setDetailDialogVisible(true);
  };

  const handleExport = () => {
    exportToExcel(
      items.map((row, idx) => ({
        stt: idx + 1 + lazyParams.first,
        transactionId: row.transactionId,
        externalUserId: row.externalUserId,
        actionType: row.actionType,
        points: row.points,
        balanceAfter: row.balanceAfter != null ? row.balanceAfter : '',
        partnerCode: row.partnerCode,
        createdAt: row.createdAt ? new Date(row.createdAt).toLocaleString('vi-VN') : '',
        status: row.status || 'COMPLETED',
      })),
      [
        { key: 'stt', header: '#' },
        { key: 'transactionId', header: t('transaction.id') },
        { key: 'externalUserId', header: t('transaction.phone') },
        { key: 'actionType', header: t('transaction.action_type') },
        { key: 'points', header: t('transaction.amount') },
        { key: 'balanceAfter', header: t('transaction.balance_after') },
        { key: 'partnerCode', header: t('transaction.partner') },
        { key: 'createdAt', header: t('common.created_at') },
        { key: 'status', header: t('transaction.status') },
      ],
      `Lich_Su_Giao_Dich_${selectedTenant}`
    );
  };

  // Templates
  const actionBodyTemplate = (rowData: PointLedgerItem) => {
    return (
      <StandardRowActions
        onView={() => openDetailDialog(rowData)}
      />
    );
  };

  const actionTypeTemplate = (rowData: PointLedgerItem) => {
    switch (rowData.actionType) {
      case 'EARN':
        return <Tag severity="success" value={t('action_type.earn')} />;
      case 'BURN':
        return <Tag severity="danger" value={t('action_type.burn')} />;
      case 'REWARD':
        return <Tag severity="info" value={t('action_type.reward')} />;
      case 'SPIN':
        return <Tag severity="warning" value={t('action_type.spin')} />;
      case 'VOUCHER':
        return <Tag severity="info" value={t('action_type.voucher')} />;
      case 'REFUND':
        return <Tag severity="info" value={t('action_type.refund')} />;
      case 'EXPIRE':
        return <Tag severity="secondary" value={t('action_type.expire')} />;
      default:
        return <Tag severity="secondary" value={rowData.actionType || t('common.actions')} />;
    }
  };

  const pointsTemplate = (rowData: PointLedgerItem) => {
    const isPositive =
      rowData.actionType === PointActionType.EARN ||
      rowData.actionType === PointActionType.REWARD ||
      rowData.actionType === PointActionType.SPIN;
    return (
      <span className="font-mono text-900">
        {isPositive ? `+${rowData.points.toLocaleString()}` : `-${rowData.points.toLocaleString()}`} {t('common.points')}
      </span>
    );
  };

  const balanceAfterTemplate = (rowData: PointLedgerItem) => {
    return (
      <span className="font-mono text-900">
        {rowData.balanceAfter != null ? rowData.balanceAfter.toLocaleString() : '-'} {t('common.points')}
      </span>
    );
  };

  const partnerTemplate = (rowData: PointLedgerItem) => {
    const name = rowData.partnerName || (i18n.exists(`alliance_partners.${rowData.partnerCode}`) ? t(`alliance_partners.${rowData.partnerCode}`) : rowData.partnerCode);
    return (
      <div className="flex flex-column">
        <span className="text-900">{name}</span>
        <span className="font-mono text-xs text-500">{rowData.partnerCode}</span>
      </div>
    );
  };

  const dateTemplate = (rowData: PointLedgerItem) => {
    if (!rowData.createdAt) return '-';
    try {
      const d = new Date(rowData.createdAt);
      if (isNaN(d.getTime())) return <span className="text-900">{rowData.createdAt}</span>;
      return <span className="text-900">{d.toLocaleString('vi-VN')}</span>;
    } catch {
      return <span className="text-900">{rowData.createdAt}</span>;
    }
  };

  const statusTemplate = (rowData: PointLedgerItem) => {
    const status = rowData.status || (rowData.actionType === 'REFUND' ? 'REFUNDED' : rowData.actionType === 'EXPIRE' ? 'EXPIRED' : 'COMPLETED');
    switch (status) {
      case 'REFUNDED':
        return <Tag severity="warning" value={t('transaction.status_refunded')} />;
      case 'EXPIRED':
        return <Tag severity="danger" value={t('transaction.status_expired')} />;
      case 'COMPLETED':
      default:
        return <Tag severity="success" value={t('transaction.status_completed')} />;
    }
  };

  return (
    <div className="w-full">
      <Toast ref={toastRef} />
      <StandardPageHeader
        title={t('nav.transactions')}
        subtitle={t('transaction.subtitle', 'Tra cứu sổ cái tích điểm, đổi thưởng và biến động số dư')}
        breadcrumbs={[{ label: t('nav.transactions') }]}
        tenantValue={selectedTenant}
        onTenantChange={setSelectedTenant}
        extraActions={[
          {
            label: t('transaction.manual_adjust_btn'),
            icon: 'pi pi-sliders-h',
            severity: 'warning',
            outlined: true,
            onClick: () => setAdjustVisible(true),
          },
        ]}
      />

      <div className="card shadow-1 border-round surface-card p-3 w-full">
        <UniversalFilterBar
          searchValue={searchKeyword}
          onSearchChange={setSearchKeyword}
          searchPlaceholder={t('transaction.search_placeholder')}
          basicFilters={[
            {
              key: 'partnerCode',
              label: t('transaction.filter_partner'),
              value: selectedPartner,
              options: partnerOptions,
              onChange: (val) => setSelectedPartner(val),
              placeholder: t('transaction.filter_partner'),
            },
            {
              key: 'actionType',
              label: t('transaction.filter_action'),
              value: selectedActionType,
              options: actionTypeOptions,
              onChange: (val) => setSelectedActionType(val),
              placeholder: t('transaction.filter_action'),
            },
          ]}
          onExport={handleExport}
          onReset={() => {
            setSearchKeyword('');
            setSelectedPartner('ALL');
            setSelectedActionType('ALL');
          }}
          onRefresh={handleRefresh}
        />

        <DataTable
          value={items}
          lazy
          paginator
          first={lazyParams.first}
          rows={lazyParams.rows}
          totalRecords={totalRecords}
          onPage={onPage}
          loading={loading}
          dataKey="id"
          rowsPerPageOptions={[15, 30, 50]}
          emptyMessage={t('common.no_data')}
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
            header={t('transaction.actions')}
            body={actionBodyTemplate}
            style={{ width: '4.5rem', textAlign: 'center' }}
          />

          {/* Cột 3: Mã GD */}
          <Column
            field="transactionId"
            header={t('transaction.id')}
            body={(row: PointLedgerItem) => (
              <span className="font-bold font-mono text-900">{row.transactionId}</span>
            )}
            style={{ minWidth: '15rem' }}
          />

          {/* Cột 4: Số Điện Thoại / User ID */}
          <Column
            field="externalUserId"
            header={t('transaction.phone')}
            body={(row: PointLedgerItem) => <span className="font-mono text-900">{row.externalUserId}</span>}
            style={{ minWidth: '12rem' }}
          />

          {/* Cột 5: Loại GD */}
          <Column
            field="actionType"
            body={actionTypeTemplate}
            header={t('transaction.action_type')}
            style={{ minWidth: '9rem', textAlign: 'center' }}
          />

          {/* Cột 6: Biến Động Điểm */}
          <Column
            field="points"
            body={pointsTemplate}
            header={t('transaction.amount')}
            style={{ minWidth: '8.5rem', textAlign: 'center' }}
          />

          {/* Cột 7: Số Dư Sau */}
          <Column
            field="balanceAfter"
            body={balanceAfterTemplate}
            header={t('transaction.balance_after')}
            style={{ minWidth: '8.5rem', textAlign: 'center' }}
          />

          {/* Cột 8: Đối Tác */}
          <Column
            field="partnerCode"
            body={partnerTemplate}
            header={t('transaction.partner')}
            style={{ minWidth: '12rem' }}
          />

          {/* Cột 9: Thời Gian */}
          <Column
            field="createdAt"
            body={dateTemplate}
            header={t('common.created_at')}
            style={{ minWidth: '12rem' }}
          />

          {/* Cột 10: Trạng Thái */}
          <Column
            header={t('transaction.status')}
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
              <div className="font-bold text-lg text-primary">{t('transaction.detail_title')}</div>
              <div className="text-xs text-500 font-normal">{t('transaction.detail_subtitle')}</div>
            </div>
          </div>
        }
        visible={detailDialogVisible}
        style={{ width: '640px' }}
        modal
        onHide={() => setDetailDialogVisible(false)}
        footer={
          <Button
            label={t('common.close')}
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
                {t('transaction.double_entry_title')}
              </div>
              <div className="grid text-center align-items-center">
                <div className="col-4">
                  <div className="text-xs text-500 mb-1">{t('transaction.balance_before')}</div>
                  <div className="font-mono font-bold text-lg text-700">
                    {detailItem.balanceBefore != null ? detailItem.balanceBefore.toLocaleString() : '-'}
                  </div>
                  <div className="text-xs text-400">{t('common.points')}</div>
                </div>

                <div className="col-4">
                  <div className="text-xs text-500 mb-1">{t('transaction.amount')}</div>
                  <div
                    className={`font-mono font-bold text-xl ${detailItem.actionType === PointActionType.EARN ||
                      detailItem.actionType === PointActionType.REWARD ||
                      detailItem.actionType === PointActionType.SPIN
                      ? 'text-green-600'
                      : 'text-orange-600'
                      }`}
                  >
                    {detailItem.actionType === PointActionType.EARN ||
                      detailItem.actionType === PointActionType.REWARD ||
                      detailItem.actionType === PointActionType.SPIN
                      ? `+${detailItem.points.toLocaleString()}`
                      : `-${detailItem.points.toLocaleString()}`}
                  </div>
                  <div>{actionTypeTemplate(detailItem)}</div>
                </div>

                <div className="col-4">
                  <div className="text-xs text-500 mb-1">{t('transaction.balance_after')}</div>
                  <div className="font-mono font-bold text-lg text-primary">
                    {detailItem.balanceAfter != null ? detailItem.balanceAfter.toLocaleString() : '-'}
                  </div>
                  <div className="text-xs text-400">{t('common.points')}</div>
                </div>
              </div>
            </div>

            {/* THÔNG TIN GIAO DỊCH & THAM CHIẾU */}
            <div className="border-1 surface-border border-round p-3">
              <div className="font-semibold text-primary text-sm mb-3">
                <i className="pi pi-receipt mr-2" />
                {t('transaction.tx_info_title')}
              </div>
              <div className="grid">
                <div className="col-6">
                  <span className="text-500 text-xs">{t('transaction.tx_id')}:</span>
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
                  <span className="text-500 text-xs">{t('transaction.reference_code')}:</span>
                  <div className="font-mono text-sm text-800 mt-1">
                    {detailItem.referenceId || detailItem.transactionId}
                  </div>
                </div>

                <div className="col-6 mt-2">
                  <span className="text-500 text-xs">{t('transaction.created_at')}:</span>
                  <div className="font-normal text-sm text-700 mt-1">{dateTemplate(detailItem)}</div>
                </div>

                <div className="col-6 mt-2">
                  <span className="text-500 text-xs">{t('transaction.status')}:</span>
                  <div className="mt-1">{statusTemplate(detailItem)}</div>
                </div>

                <div className="col-12 mt-2">
                  <span className="text-500 text-xs">{t('transaction.description')}:</span>
                  <div className="text-sm text-800 surface-50 p-2 border-round mt-1">
                    {detailItem.description || t('common.no_description')}
                  </div>
                </div>
              </div>
            </div>

            {/* THÔNG TIN HỘI VIÊN & ĐỐI TÁC */}
            <div className="border-1 surface-border border-round p-3">
              <div className="font-semibold text-primary text-sm mb-3">
                <i className="pi pi-users mr-2" />
                {t('transaction.member_info_title')}
              </div>
              <div className="grid">
                <div className="col-6">
                  <span className="text-500 text-xs">{t('transaction.member_phone')}:</span>
                  <div className="font-mono font-bold text-sm text-800 mt-1">{detailItem.externalUserId}</div>
                </div>

                <div className="col-6">
                  <span className="text-500 text-xs">{t('transaction.tenant_name')}:</span>
                  <div className="font-medium text-sm text-primary mt-1">{selectedTenant}</div>
                </div>

                <div className="col-6 mt-2">
                  <span className="text-500 text-xs">{t('transaction.partner_name')}:</span>
                  <div className="font-medium text-sm text-800 mt-1">
                    {detailItem.partnerName || (i18n.exists(`alliance_partners.${detailItem.partnerCode}`) ? t(`alliance_partners.${detailItem.partnerCode}`) : detailItem.partnerCode)}
                  </div>
                </div>

                <div className="col-6 mt-2">
                  <span className="text-500 text-xs">{t('transaction.partner_code')}:</span>
                  <div className="font-mono text-sm text-600 mt-1">{detailItem.partnerCode}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Dialog>

      {/* Dialog DT-02: Điều chỉnh điểm thủ công (Gửi duyệt 2 lớp) */}
      <Dialog
        visible={adjustVisible}
        onHide={() => setAdjustVisible(false)}
        header={t('transaction.dt02_title')}
        style={{ width: '36rem' }}
        breakpoints={{ '641px': '95vw' }}
        modal
      >
        <div className="p-fluid flex flex-column gap-3">
          <div className="p-3 border-round bg-blue-50 border-1 border-blue-200 text-xs text-blue-900">
            <i className="pi pi-shield mr-2" />
            {t('transaction.dt02_approval_hint')}
          </div>
          <div className="field m-0">
            <label className="text-sm font-medium">{t('transaction.phone')} *</label>
            <InputText value={adjustUserId} onChange={(e) => setAdjustUserId(e.target.value)} className="font-mono" placeholder="+509..." />
          </div>
          <div className="grid">
            <div className="col-6 field m-0">
              <label className="text-sm font-medium">{t('transaction.adjust_direction')}</label>
              <Dropdown
                value={adjustDirection}
                options={[
                  { label: t('transaction.dir_credit'), value: AdjustmentDirection.CREDIT },
                  { label: t('transaction.dir_debit'), value: AdjustmentDirection.DEBIT },
                ]}
                onChange={(e) => setAdjustDirection(e.value)}
                appendTo="self"
              />
            </div>
            <div className="col-6 field m-0">
              <label className="text-sm font-medium">{t('transaction.adjust_asset')}</label>
              <Dropdown
                value={adjustAssetType}
                options={[
                  { label: t('transaction.asset_coin'), value: CurrencyAssetType.LOYALTY_COIN },
                  { label: t('transaction.asset_tier'), value: CurrencyAssetType.TIER_POINT },
                ]}
                onChange={(e) => setAdjustAssetType(e.value)}
                appendTo="self"
              />
            </div>
          </div>
          <div className="grid">
            <div className="col-6 field m-0">
              <label className="text-sm font-medium">{t('transaction.adjust_amount')} *</label>
              <InputNumber value={adjustAmount} onValueChange={(e) => setAdjustAmount(e.value || 0)} min={1} />
            </div>
            <div className="col-6 field m-0">
              <label className="text-sm font-medium">{t('transaction.ticket_ref')}</label>
              <InputText value={adjustTicketRef} onChange={(e) => setAdjustTicketRef(e.target.value)} className="font-mono" placeholder="INC-2026-001" />
            </div>
          </div>
          <div className="field m-0">
            <label className="text-sm font-medium">{t('common.reason')} *</label>
            <InputTextarea rows={3} value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-content-end gap-2 mt-4">
          <Button label={t('common.cancel')} icon="pi pi-times" outlined onClick={() => setAdjustVisible(false)} />
          <Button label={t('transaction.submit_adjust')} icon="pi pi-send" severity="warning" onClick={handleSubmitAdjustment} loading={adjustSubmitting} />
        </div>
      </Dialog>
    </div>
  );
};

export default Transactions;
