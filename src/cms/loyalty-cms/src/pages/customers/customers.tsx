import React, { useEffect, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Tag } from 'primereact/tag';
import { useTranslation } from 'react-i18next';
import { User, userService } from '@/service/user.service';
import { AppBreadcrumb } from 'components';
import { confirmDialog } from 'primereact/confirmdialog';

export const Customers: React.FC = () => {
  const { t } = useTranslation();
  const [items, setItems] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [globalFilter, setGlobalFilter] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await userService.getAll();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('[Customers.fetchData] Error:', e);
      setItems([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUnlock = (user: User) => {
    confirmDialog({
      message: t('customer.confirm_unlock_message', {
        defaultValue: `Bạn có chắc chắn muốn mở khóa thiết bị cho số điện thoại ${user.phoneNumber}?`,
        phone: user.phoneNumber,
      }),
      header: t('customer.confirm_unlock_title', { defaultValue: 'Xác nhận Mở khóa Thiết bị' }),
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: t('common.confirm', { defaultValue: 'Xác nhận' }),
      rejectLabel: t('common.cancel', { defaultValue: 'Hủy' }),
      accept: async () => {
        if (user.id) {
          await userService.unlockUser(user.id);
          fetchData();
        }
      },
    });
  };

  const actionBodyTemplate = (rowData: User) => {
    const isLocked = rowData.status === 2 || rowData.wrongPinCount >= 5;
    return (
      <div className="flex gap-2">
        <Button
          label={t('customer.unlock', { defaultValue: 'Mở khóa' })}
          icon="pi pi-unlock"
          severity="warning"
          size="small"
          outlined
          onClick={() => handleUnlock(rowData)}
          disabled={!isLocked}
        />
      </div>
    );
  };

  const statusBodyTemplate = (rowData: User) => {
    if (rowData.status === 2 || rowData.wrongPinCount >= 5) {
      return <Tag severity="danger" value={t('customer.status_locked', { defaultValue: 'Đã khóa PIN' })} />;
    }
    if (rowData.status === 1) {
      return <Tag severity="success" value={t('customer.status_active', { defaultValue: 'Đang hoạt động' })} />;
    }
    return <Tag severity="secondary" value={t('customer.status_inactive', { defaultValue: 'Chưa kích hoạt' })} />;
  };

  const dateTemplate = (rowData: User) => {
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
      <h4 className="m-0 text-primary font-bold">{t('customer.management_title', { defaultValue: 'Quản lý Khách hàng & Thiết bị Smart OTP' })}</h4>
      <div className="flex gap-2">
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            type="search"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder={t('customer.search_placeholder', { defaultValue: 'Tìm kiếm SĐT, Device ID...' })}
          />
        </span>
        <Button icon="pi pi-refresh" rounded outlined onClick={fetchData} tooltip={t('common.refresh', { defaultValue: 'Làm mới' })} />
      </div>
    </div>
  );

  return (
    <div>
      <AppBreadcrumb items={[{ label: t('nav.customers', { defaultValue: 'Khách hàng' }) }]} />
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
          emptyMessage={t('common.no_data', { defaultValue: 'Không có dữ liệu khách hàng' })}
          stripedRows
          responsiveLayout="scroll"
        >
          <Column field="id" header="ID" sortable style={{ width: '5rem' }} />
          <Column field="phoneNumber" header={t('customer.phone_number', { defaultValue: 'Số điện thoại' })} sortable style={{ minWidth: '10rem' }} />
          <Column field="deviceId" header={t('customer.device_id', { defaultValue: 'Mã Thiết bị (Device ID)' })} sortable style={{ minWidth: '14rem' }} />
          <Column field="wrongPinCount" header={t('customer.wrong_pin_count', { defaultValue: 'Số lần sai PIN' })} sortable style={{ minWidth: '8rem' }} />
          <Column field="status" body={statusBodyTemplate} header={t('common.status', { defaultValue: 'Trạng thái' })} sortable style={{ minWidth: '9rem' }} />
          <Column field="createdAt" body={dateTemplate} header={t('common.created_at', { defaultValue: 'Ngày đăng ký' })} sortable style={{ minWidth: '12rem' }} />
          <Column body={actionBodyTemplate} exportable={false} header={t('common.actions', { defaultValue: 'Thao tác' })} style={{ minWidth: '8rem' }} />
        </DataTable>
      </div>
    </div>
  );
};

export default Customers;
