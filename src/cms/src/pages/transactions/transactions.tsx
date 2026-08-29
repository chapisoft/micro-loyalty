import React, { useEffect, useState, useMemo } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { useTranslation } from 'react-i18next';
import { AppBreadcrumb } from 'components';
import { TenantSelector } from '@/components/TenantSelector';
import { loyaltyService, PointLedgerItem } from '@/service/loyalty.service';

export const Transactions: React.FC = () => {
  const { t } = useTranslation();
  const [items, setItems] = useState<PointLedgerItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [globalFilter, setGlobalFilter] = useState('');
  const [selectedTenant, setSelectedTenant] = useState('TENANT_NATCASH');
  const [selectedPartner, setSelectedPartner] = useState<string>('ALL');
  const [selectedActionType, setSelectedActionType] = useState<string>('ALL');

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await loyaltyService.getPointLedger(selectedTenant);
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('[Transactions.fetchData] Error:', e);
      setItems([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [selectedTenant]);

  const partnerOptions = useMemo(() => {
    const catalogCodes = [
      'NATCASH_WALLET',
      'DELIMART_RETAIL',
      'NATCOM_TELCO',
      'EDH_POWER',
      'FAHASA_BOOKSTORE',
      'HIGHLANDS_COFFEE',
      'CGV_CINEMAS',
      'RINGME',
    ];
    const itemCodes = items.map((i) => i.partnerCode).filter(Boolean);
    const allCodes = Array.from(new Set([...catalogCodes, ...itemCodes]));

    return [
      { label: t('common.all_partners', { defaultValue: 'Tất cả Đối tác' }), value: 'ALL' },
      ...allCodes.map((code) => {
        const partnerName = t(`alliance_partners.${code}`, { defaultValue: code });
        return {
          label: partnerName !== code ? `${code} — ${partnerName}` : code,
          value: code,
        };
      }),
    ];
  }, [items, t]);

  const actionTypeOptions = useMemo(() => [
    { label: t('common.all_actions', { defaultValue: 'Tất cả Loại GD' }), value: 'ALL' },
    { label: t('action_type.earn', { defaultValue: 'TÍCH ĐIỂM (EARN)' }), value: 'EARN' },
    { label: t('action_type.burn', { defaultValue: 'TIÊU ĐIỂM (BURN)' }), value: 'BURN' },
    { label: t('action_type.reward', { defaultValue: 'THƯỞNG CỘT MỐC (REWARD)' }), value: 'REWARD' },
    { label: t('action_type.spin', { defaultValue: 'VÒNG QUAY (SPIN)' }), value: 'SPIN' },
    { label: t('action_type.voucher', { defaultValue: 'ĐỔI VOUCHER (VOUCHER)' }), value: 'VOUCHER' },
    { label: t('action_type.refund', { defaultValue: 'HOÀN ĐIỂM (REFUND)' }), value: 'REFUND' },
    { label: t('action_type.expire', { defaultValue: 'HẾT HẠN (EXPIRE)' }), value: 'EXPIRE' },
    { label: t('action_type.adjust', { defaultValue: 'ĐIỀU CHỈNH (ADJUST)' }), value: 'ADJUST' },
  ], [t]);

  const filteredItems = useMemo(() => {
    const rawQuery = globalFilter.trim().toLowerCase();
    const cleanQuery = rawQuery.replace(/[\s\-_+()]/g, '');

    return items.filter((item) => {
      const matchPartner = selectedPartner === 'ALL' || item.partnerCode === selectedPartner;
      const matchAction = selectedActionType === 'ALL' || item.actionType === selectedActionType;
      if (!matchPartner || !matchAction) return false;

      if (!rawQuery) return true;

      const txId = (item.transactionId || '').toLowerCase();
      const userId = (item.externalUserId || '').toLowerCase();
      const cleanUserId = userId.replace(/[\s\-_+()]/g, '');
      const partner = (item.partnerCode || '').toLowerCase();
      const action = (item.actionType || '').toLowerCase();
      const desc = (item.description || '').toLowerCase();
      const points = String(item.points || '');

      return (
        txId.includes(rawQuery) ||
        txId.includes(cleanQuery) ||
        userId.includes(rawQuery) ||
        cleanUserId.includes(cleanQuery) ||
        partner.includes(rawQuery) ||
        action.includes(rawQuery) ||
        desc.includes(rawQuery) ||
        points.includes(rawQuery)
      );
    });
  }, [items, selectedPartner, selectedActionType, globalFilter]);

  const actionTypeTemplate = (rowData: PointLedgerItem) => {
    switch (rowData.actionType) {
      case 'EARN':
        return <Tag severity="success" value="Tích Điểm" icon="pi pi-arrow-up-right" />;
      case 'BURN':
        return <Tag severity="danger" value="Tiêu Điểm" icon="pi pi-arrow-down-left" />;
      case 'REWARD':
        return <Tag severity="info" value="Thưởng Cột Mốc" icon="pi pi-gift" />;
      case 'SPIN':
        return <Tag severity="warning" value="Vòng Quay" icon="pi pi-compass" />;
      case 'VOUCHER':
        return <Tag severity="info" value="Đổi Voucher" icon="pi pi-ticket" />;
      default:
        return <Tag severity="secondary" value={rowData.actionType || 'Giao Dịch'} />;
    }
  };

  const pointsTemplate = (rowData: PointLedgerItem) => {
    const isPositive = rowData.actionType === 'EARN' || rowData.actionType === 'REWARD' || rowData.actionType === 'SPIN';
    return (
      <span className={`font-medium font-mono ${isPositive ? 'text-green-600' : 'text-orange-600'}`}>
        {isPositive ? `+${rowData.points}` : `-${rowData.points}`} Điểm
      </span>
    );
  };

  const balanceAfterTemplate = (rowData: PointLedgerItem) => {
    return (
      <span className="font-normal font-mono text-700">
        {rowData.balanceAfter?.toLocaleString() || rowData.points?.toLocaleString() || 0} Điểm
      </span>
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

  const header = (
    <div className="flex flex-wrap gap-3 align-items-center justify-content-between">
      <div className="flex flex-wrap align-items-center gap-3">
        <h4 className="m-0 text-primary font-bold">
          {t('transaction.management_title', { defaultValue: 'Nhật ký Biến động Sổ cái Điểm & Giao dịch Loyalty' })}
        </h4>
        <TenantSelector value={selectedTenant} onChange={setSelectedTenant} />
      </div>
      <div className="flex flex-wrap gap-2 align-items-center">
        <Dropdown
          value={selectedPartner}
          options={partnerOptions}
          onChange={(e) => setSelectedPartner(e.value)}
          placeholder={t('transaction.filter_partner', { defaultValue: 'Đối tác' })}
          className="w-11rem"
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
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder={t('transaction.search_placeholder', { defaultValue: 'Tìm theo Mã GD, SĐT, Đối tác...' })}
            className="w-14rem md:w-18rem"
          />
        </span>
        <Button icon="pi pi-refresh" rounded outlined onClick={fetchData} tooltip={t('common.refresh', { defaultValue: 'Làm mới' })} />
      </div>
    </div>
  );

  return (
    <div>
      <AppBreadcrumb items={[{ label: t('nav.transactions', { defaultValue: 'Sổ Cái & Giao Dịch' }) }]} />
      <div className="card shadow-1 border-round surface-card p-4">
        <DataTable
          value={filteredItems}
          loading={loading}
          header={header}
          globalFilter={globalFilter}
          globalFilterFields={['transactionId', 'externalUserId', 'partnerCode', 'actionType', 'description']}
          dataKey="id"
          paginator
          rows={15}
          rowsPerPageOptions={[15, 30, 50]}
          emptyMessage={t('common.no_data', { defaultValue: 'Chưa có biến động giao dịch điểm nào phù hợp với bộ lọc' })}
          stripedRows
          responsiveLayout="scroll"
        >
          <Column
            header="#"
            body={(_, { rowIndex }) => rowIndex + 1}
            style={{ width: '3.5rem', textAlign: 'center' }}
          />
          <Column field="transactionId" header={<span title={t('transaction.id_tooltip', { defaultValue: 'Mã định danh giao dịch sổ cái duy nhất' })}>{t('transaction.id', { defaultValue: 'Mã GD' })}</span>} sortable style={{ minWidth: '10rem', fontWeight: 600 }} />
          <Column field="externalUserId" header={<span title={t('transaction.phone_tooltip', { defaultValue: 'Số điện thoại hoặc mã định danh hội viên' })}>{t('transaction.phone', { defaultValue: 'Số Điện Thoại' })}</span>} sortable style={{ minWidth: '9.5rem' }} />
          <Column field="actionType" body={actionTypeTemplate} header={<span title={t('transaction.action_tooltip', { defaultValue: 'Loại biến động điểm trong hệ thống' })}>{t('transaction.action_type', { defaultValue: 'Loại GD' })}</span>} sortable style={{ minWidth: '8.5rem', textAlign: 'center' }} />
          <Column field="points" body={pointsTemplate} header={<span title={t('transaction.amount_tooltip', { defaultValue: 'Số lượng điểm cộng hoặc trừ' })}>{t('transaction.amount', { defaultValue: 'Biến Động' })}</span>} sortable style={{ minWidth: '8rem', textAlign: 'center' }} />
          <Column field="balanceAfter" body={balanceAfterTemplate} header={<span title={t('transaction.balance_after_tooltip', { defaultValue: 'Số dư khả dụng của hội viên sau giao dịch' })}>{t('transaction.balance_after', { defaultValue: 'Số Dư Sau' })}</span>} sortable style={{ minWidth: '8rem', textAlign: 'center' }} />
          <Column field="partnerCode" header={t('transaction.partner', { defaultValue: 'Đối Tác' })} sortable style={{ minWidth: '9rem' }} />
          <Column field="createdAt" body={dateTemplate} header={t('common.created_at', { defaultValue: 'Thời Gian' })} sortable style={{ minWidth: '10rem' }} />
          <Column
            header={t('common.status', { defaultValue: 'Trạng Thái' })}
            body={() => <Tag severity="success" value="Hoàn tất" />}
            style={{ width: '7rem', textAlign: 'center' }}
          />
        </DataTable>
      </div>
    </div>
  );
};

export default Transactions;
