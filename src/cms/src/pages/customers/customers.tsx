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
  const [searchPhone, setSearchPhone] = useState('');
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
            fullName: response.fullName || t('customer.default_member', { defaultValue: 'Hội viên Thân thiết' }),
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
        return <Tag severity="info" value={rowData.tier?.name || t('tier.tier_platinum', { defaultValue: 'Hạng Bạch Kim (Platinum)' })} icon="pi pi-crown" />;
      case 'GOLD':
        return <Tag severity="warning" value={rowData.tier?.name || t('tier.tier_gold', { defaultValue: 'Hạng Vàng (Gold)' })} icon="pi pi-star-fill" />;
      case 'SILVER':
        return <Tag severity="info" value={rowData.tier?.name || t('tier.tier_silver', { defaultValue: 'Hạng Bạc (Silver)' })} icon="pi pi-star" />;
      default:
        return <Tag severity="secondary" value={rowData.tier?.name || t('tier.tier_bronze', { defaultValue: 'Hạng Đồng (Bronze)' })} />;
    }
  };

  const statusBodyTemplate = (rowData: LoyaltyMemberAccount) => {
    if (rowData.status === CommonStatus.ACTIVE) {
      return <Tag severity="success" value={t('customer.status_active', { defaultValue: 'Đang hoạt động' })} />;
    }
    return <Tag severity="secondary" value={t('customer.status_inactive', { defaultValue: 'Tạm khóa' })} />;
  };

  const dateTemplate = (rowData: LoyaltyMemberAccount) => {
    return rowData.createdAt ? new Date(rowData.createdAt).toLocaleDateString('vi-VN') : '-';
  };

  const header = (
    <div className="flex flex-wrap gap-3 align-items-center justify-content-between">
      <div className="flex align-items-center gap-3">
        <h4 className="m-0 text-primary font-bold">{t('customer.management_title', { defaultValue: 'Quản Lý Hội Viên & Khách Hàng Loyalty' })}</h4>
        <TenantSelector value={selectedTenant} onChange={setSelectedTenant} />
      </div>
      <div className="flex flex-wrap gap-2 align-items-center">
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            value={searchPhone}
            onChange={(e) => setSearchPhone(e.target.value)}
            placeholder={t('customer.search_placeholder', { defaultValue: 'Tìm theo SĐT...' })}
            className="p-inputtext-sm"
          />
        </span>
        <Button label={t('common.search', { defaultValue: 'Tìm Kiếm' })} icon="pi pi-search" onClick={fetchData} loading={loading} />
        <Button icon="pi pi-refresh" outlined onClick={() => { setSearchPhone(''); fetchData(); }} />
      </div>
    </div>
  );

  return (
    <div>
      <AppBreadcrumb items={[{ label: t('nav.customers', { defaultValue: 'Hội Viên' }) }]} />
      <div className="card shadow-1 border-round surface-card p-4">
        <DataTable<any>
          value={items}
          loading={loading}
          header={header}
          dataKey="id"
          paginator
          rows={10}
          rowsPerPageOptions={[10, 25, 50]}
          emptyMessage={t('common.no_data', { defaultValue: 'Không tìm thấy dữ liệu hội viên' })}
          stripedRows
          responsiveLayout="scroll"
        >
          <Column
            header={t('common.stt', { defaultValue: 'STT' })}
            body={(_, { rowIndex }) => rowIndex + 1}
            style={{ width: '3.5rem', textAlign: 'center' }}
          />
          <Column field="externalUserId" header={<span title={t('customer.phone_tooltip', { defaultValue: 'Số điện thoại hoặc mã hội viên' })}>{t('customer.phone_number', { defaultValue: 'Số Điện Thoại' })}</span>} sortable style={{ minWidth: '9.5rem', fontWeight: 600 }} />
          <Column field="fullName" header={t('customer.full_name', { defaultValue: 'Họ Và Tên' })} sortable style={{ minWidth: '12rem' }} />
          <Column
            field="currentPoints"
            header={<span title={t('customer.current_points_tooltip', { defaultValue: 'Số điểm khả dụng dùng để tiêu dùng hoặc đổi quà' })}>{t('customer.current_points', { defaultValue: 'Điểm Khả Dụng' })}</span>}
            body={(row: LoyaltyMemberAccount) => (
              <span className="font-medium font-mono text-orange-600">
                {row.currentPoints?.toLocaleString()} {t('common.points', { defaultValue: 'Điểm' })}
              </span>
            )}
            sortable
            style={{ minWidth: '9.5rem', textAlign: 'center' }}
          />
          <Column
            field="tierPoints"
            header={<span title={t('customer.tier_points_tooltip', { defaultValue: 'Điểm tích lũy dùng để xét phân hạng trong chu kỳ' })}>{t('customer.tier_points', { defaultValue: 'Điểm Xét Hạng' })}</span>}
            body={(row: LoyaltyMemberAccount) => (
              <span className="font-medium font-mono text-blue-600">
                {row.tierPoints?.toLocaleString()} {t('common.points', { defaultValue: 'Điểm' })}
              </span>
            )}
            sortable
            style={{ minWidth: '9.5rem', textAlign: 'center' }}
          />
          <Column
            header={t('customer.tier_name', { defaultValue: 'Hạng Hội Viên' })}
            body={tierBadgeTemplate}
            style={{ minWidth: '9rem', textAlign: 'center' }}
          />
          <Column field="status" body={statusBodyTemplate} header={t('common.status', { defaultValue: 'Trạng Thái' })} sortable style={{ minWidth: '8.5rem', textAlign: 'center' }} />
          <Column field="createdAt" body={dateTemplate} header={t('common.created_at', { defaultValue: 'Ngày Tham Gia' })} sortable style={{ minWidth: '9.5rem' }} />
        </DataTable>
      </div>
    </div>
  );
};

export default Customers;
