import React, { useEffect, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Tag } from 'primereact/tag';
import { useTranslation } from 'react-i18next';
import { AppBreadcrumb } from 'components';
import { TenantSelector } from '@/components/TenantSelector';
import { LoyaltyService } from '@/service/loyalty.service';
import { apiClient } from '@/service/config';
import { CommonStatus } from '@/models';

export interface LoyaltyMemberAccount {
  id: number;
  externalUserId: string;
  phoneNumber: string;
  fullName: string;
  currentPoints: number;
  tierPoints: number;
  tier?: {
    code: string;
    name: string;
    pointMultiplier: number;
  };
  status: string;
  createdAt: string;
}

export const Customers: React.FC = () => {
  const { t } = useTranslation();
  const [items, setItems] = useState<LoyaltyMemberAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [globalFilter, setGlobalFilter] = useState('');
  const [selectedTenant, setSelectedTenant] = useState('TENANT_NATCASH');

  const fetchData = async () => {
    setLoading(true);
    try {
      // Gọi API lấy thông tin hội viên mẫu theo tenant
      const userPhone = selectedTenant === 'TENANT_NATCASH' ? '50937123456' : '84977777777';
      const response: any = await apiClient.get(`/loyalty/v1/profile?externalUserId=${userPhone}`, {
        headers: { 'X-Tenant-Id': selectedTenant },
      });
      if (response && response.accountId) {
        setItems([
          {
            id: response.accountId,
            externalUserId: response.externalUserId,
            phoneNumber: response.phoneNumber || response.externalUserId,
            fullName: response.fullName || 'Hội viên Thân thiết',
            currentPoints: response.currentPoints || 0,
            tierPoints: response.tierPoints || 0,
            tier: response.tier,
            status: response.status || 'ACTIVE',
            createdAt: response.createdAt,
          },
        ]);
      } else {
        setItems([]);
      }
    } catch (e) {
      console.error('[Customers.fetchData] Error:', e);
      setItems([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [selectedTenant]);

  const tierBadgeTemplate = (rowData: LoyaltyMemberAccount) => {
    const tierCode = rowData.tier?.code || 'BRONZE';
    switch (tierCode) {
      case 'PLATINUM':
        return <Tag severity="info" value={rowData.tier?.name || 'Bạch Kim VIP'} icon="pi pi-crown" />;
      case 'GOLD':
        return <Tag severity="warning" value={rowData.tier?.name || 'Vàng Thân Thiết'} icon="pi pi-star-fill" />;
      case 'SILVER':
        return <Tag severity="info" value={rowData.tier?.name || 'Bạc'} icon="pi pi-star" />;
      default:
        return <Tag severity="secondary" value={rowData.tier?.name || 'Đồng Chuẩn'} />;
    }
  };

  const statusBodyTemplate = (rowData: LoyaltyMemberAccount) => {
    if (rowData.status === CommonStatus.ACTIVE) {
      return <Tag severity="success" value={t('customer.status_active', { defaultValue: 'Đang hoạt động' })} />;
    }
    return <Tag severity="danger" value={t('customer.status_inactive', { defaultValue: 'Tạm khóa' })} />;
  };

  const dateTemplate = (rowData: LoyaltyMemberAccount) => {
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
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <div className="flex align-items-center gap-3">
        <h4 className="m-0 text-primary font-bold">
          {t('customer.management_title', { defaultValue: 'Quản lý Hội viên & Tài khoản Loyalty' })}
        </h4>
        <TenantSelector value={selectedTenant} onChange={setSelectedTenant} />
      </div>
      <div className="flex gap-2">
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            type="search"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder={t('customer.search_placeholder', { defaultValue: 'Tìm kiếm theo SĐT, Mã hội viên...' })}
          />
        </span>
        <Button icon="pi pi-refresh" rounded outlined onClick={fetchData} tooltip={t('common.refresh', { defaultValue: 'Làm mới' })} />
      </div>
    </div>
  );

  return (
    <div>
      <AppBreadcrumb items={[{ label: t('nav.customers', { defaultValue: 'Hội viên' }) }]} />
      <div className="card shadow-1 border-round surface-card p-4">
        <DataTable
          value={items}
          loading={loading}
          header={header}
          globalFilter={globalFilter}
          dataKey="id"
          paginator
          rows={10}
          rowsPerPageOptions={[10, 25, 50]}
          emptyMessage={t('common.no_data', { defaultValue: 'Không có dữ liệu hội viên' })}
          stripedRows
          responsiveLayout="scroll"
        >
          <Column
            header={t('common.stt', { defaultValue: 'STT' })}
            body={(_, { rowIndex }) => rowIndex + 1}
            style={{ width: '3.5rem', textAlign: 'center' }}
          />
          <Column field="externalUserId" header={t('customer.phone_number', { defaultValue: 'Số điện thoại / Mã' })} sortable style={{ minWidth: '11rem' }} />
          <Column field="fullName" header={t('customer.full_name', { defaultValue: 'Họ và tên' })} sortable style={{ minWidth: '14rem' }} />
          <Column
            field="currentPoints"
            header={t('customer.current_points', { defaultValue: 'Điểm khả dụng' })}
            body={(row: LoyaltyMemberAccount) => (
              <span className="font-bold text-orange-600">
                {row.currentPoints?.toLocaleString()} Điểm
              </span>
            )}
            sortable
            style={{ minWidth: '11rem' }}
          />
          <Column
            field="tierPoints"
            header={t('customer.tier_points', { defaultValue: 'Điểm phân hạng' })}
            body={(row: LoyaltyMemberAccount) => (
              <span className="font-semibold text-blue-600">
                {row.tierPoints?.toLocaleString()} Điểm
              </span>
            )}
            sortable
            style={{ minWidth: '11rem' }}
          />
          <Column
            header={t('customer.tier_name', { defaultValue: 'Hạng hội viên' })}
            body={tierBadgeTemplate}
            style={{ minWidth: '11rem' }}
          />
          <Column field="status" body={statusBodyTemplate} header={t('common.status', { defaultValue: 'Trạng thái' })} sortable style={{ minWidth: '9rem' }} />
          <Column field="createdAt" body={dateTemplate} header={t('common.created_at', { defaultValue: 'Ngày tham gia' })} sortable style={{ minWidth: '12rem' }} />
        </DataTable>
      </div>
    </div>
  );
};

export default Customers;
