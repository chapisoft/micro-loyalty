import React, { useState, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { useTranslation } from 'react-i18next';
import { useAuditLogs } from '@/service/admin/audit-hooks';
import { AuditLogQuery } from '@/service/admin/audit';
import { Calendar } from 'primereact/calendar';
import { Toast } from 'primereact/toast';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { AppBreadcrumb } from 'components';

import './audit-management.scss';

export default function AuditLogPage() {
  const { t } = useTranslation();
  const [query, setQuery] = useState<AuditLogQuery>({
    tableName: '',
    operation: '',
    username: '',
    fromDate: '',
    toDate: '',
    page: 0,
    size: 20,
  });
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const toast = useRef<any>(null);
  const { data, isLoading, refetch } = useAuditLogs(query);

  const handlePageChange = (e: any) => {
    setQuery(q => ({ ...q, page: e.page, size: e.rows }));
  };

  const handleFilter = () => {
    let fromStr = '';
    let toStr = '';
    if (fromDate && toDate) {
      const diff = (toDate.getTime() - fromDate.getTime()) / (1000 * 3600 * 24);
      if (diff < 0) {
        toast.current?.show({
          severity: 'warn',
          summary: t('audit.invalid_range', { defaultValue: 'Khoảng ngày không hợp lệ' }),
          detail: t('audit.from_before_to', { defaultValue: 'Từ ngày phải trước hoặc bằng Đến ngày' }),
          life: 3000,
        });
        return;
      }
      if (diff > 31) {
        toast.current?.show({
          severity: 'warn',
          summary: t('audit.too_much', { defaultValue: 'Khoảng thời gian quá lớn' }),
          detail: t('audit.max_31', { defaultValue: 'Khoảng thời gian tìm kiếm tối đa 31 ngày' }),
          life: 4000,
        });
        return;
      }
      fromStr = fromDate.toISOString().slice(0, 10);
      toStr = toDate.toISOString().slice(0, 10);
    } else if (fromDate) {
      fromStr = fromDate.toISOString().slice(0, 10);
    } else if (toDate) {
      toStr = toDate.toISOString().slice(0, 10);
    }
    setQuery(q => ({ ...q, page: 0, fromDate: fromStr, toDate: toStr }));
  };

  const handleReset = () => {
    setFromDate(null);
    setToDate(null);
    setQuery({
      tableName: '',
      operation: '',
      username: '',
      fromDate: '',
      toDate: '',
      page: 0,
      size: 20,
    });
  };

  const operationBodyTemplate = (rowData: any) => {
    const op = String(rowData.operation || '').toUpperCase();
    let severity: 'success' | 'info' | 'warning' | 'danger' | 'secondary' = 'info';
    if (op === 'INSERT') severity = 'success';
    else if (op === 'UPDATE') severity = 'warning';
    else if (op === 'DELETE') severity = 'danger';
    return <Tag severity={severity} value={op} />;
  };

  const tableBodyTemplate = (rowData: any) => {
    return <Tag severity="secondary" value={rowData.tableName} />;
  };

  const timestampBodyTemplate = (rowData: any) => {
    if (!rowData.timestamp) return '-';
    try {
      return new Date(rowData.timestamp).toLocaleString();
    } catch {
      return rowData.timestamp;
    }
  };

  const formatJsonData = (jsonStr: string) => {
    if (!jsonStr) return <span className="text-400 italic">-</span>;
    try {
      const obj = JSON.parse(jsonStr);
      return (
        <pre className="m-0 p-2 border-round surface-100 text-xs font-mono max-h-8rem overflow-y-auto line-height-2">
          {JSON.stringify(obj, null, 2)}
        </pre>
      );
    } catch {
      return <pre className="m-0 p-2 border-round surface-100 text-xs font-mono">{jsonStr}</pre>;
    }
  };

  return (
    <div className="audit-management-page">
      <Toast ref={toast} position="top-center" />
      <AppBreadcrumb
        items={[
          { label: t('nav.admin', { defaultValue: 'Quản trị hệ thống' }) },
          { label: t('nav.audit_logs', { defaultValue: 'Nhật ký Hoạt động' }) },
        ]}
      />

      <div className="card shadow-1 border-round surface-card p-4">
        <div className="flex flex-wrap gap-2 align-items-center justify-content-between mb-4">
          <h4 className="m-0 text-primary">{t('audit.management', { defaultValue: 'Nhật ký Hoạt động (Audit Logs)' })}</h4>
          <Button icon="pi pi-refresh" rounded outlined onClick={() => refetch()} tooltip={t('common.refresh', { defaultValue: 'Làm mới' })} />
        </div>

        <div className="flex flex-wrap gap-2 align-items-center mb-4">
          <Dropdown
            className="w-14rem"
            placeholder={t('audit.table_name', { defaultValue: 'Chọn bảng dữ liệu' })}
            value={query.tableName || ''}
            options={[
              { label: t('common.view_all', { defaultValue: 'Tất cả bảng' }), value: '' },
              { label: 'User / Customer', value: 'User' },
              { label: 'Partner', value: 'Partner' },
              { label: 'Transaction', value: 'Transaction' },
              { label: 'SystemParameter', value: 'SystemParameter' },
              { label: 'AdminUser', value: 'AdminUser' },
              { label: 'Role', value: 'Role' },
            ]}
            onChange={e => setQuery(q => ({ ...q, tableName: e.value }))}
            showClear
          />

          <Dropdown
            className="w-12rem"
            placeholder={t('audit.operation', { defaultValue: 'Loại thao tác' })}
            value={query.operation || ''}
            options={[
              { label: t('common.view_all', { defaultValue: 'Tất cả thao tác' }), value: '' },
              { label: 'INSERT', value: 'INSERT' },
              { label: 'UPDATE', value: 'UPDATE' },
              { label: 'DELETE', value: 'DELETE' },
            ]}
            onChange={e => setQuery(q => ({ ...q, operation: e.value }))}
            showClear
          />

          <InputText
            className="w-14rem"
            placeholder={t('audit.username', { defaultValue: 'Tên người thực hiện' })}
            value={query.username || ''}
            onChange={e => setQuery(q => ({ ...q, username: e.target.value }))}
          />

          <Calendar
            value={fromDate}
            onChange={e => setFromDate(e.value ?? null)}
            placeholder={t('audit.from_date', { defaultValue: 'Từ ngày' })}
            dateFormat="yy-mm-dd"
            showIcon
            className="w-12rem"
          />

          <Calendar
            value={toDate}
            onChange={e => setToDate(e.value ?? null)}
            placeholder={t('audit.to_date', { defaultValue: 'Đến ngày' })}
            dateFormat="yy-mm-dd"
            showIcon
            className="w-12rem"
          />

          <Button label={t('audit.filter', { defaultValue: 'Tìm kiếm' })} icon="pi pi-search" onClick={handleFilter} />
          <Button label={t('common.cancel', { defaultValue: 'Đặt lại' })} icon="pi pi-filter-slash" severity="secondary" outlined onClick={handleReset} />
        </div>

        <DataTable
          value={Array.isArray((data as any)?.content) ? (data as any).content : []}
          loading={isLoading}
          paginator
          rows={query.size || 20}
          first={(query.page || 0) * (query.size || 20)}
          onPage={handlePageChange}
          totalRecords={typeof (data as any)?.totalElements === 'number' ? (data as any).totalElements : 0}
          rowsPerPageOptions={[10, 20, 50]}
          className="p-datatable-striped"
          emptyMessage={t('audit.no_data', { defaultValue: 'Không có dữ liệu nhật ký hoạt động' })}
        >
          <Column field="id" header={t('audit.id', { defaultValue: 'ID' })} style={{ width: '5%' }} />
          <Column field="tableName" header={t('audit.table', { defaultValue: 'Bảng dữ liệu' })} body={tableBodyTemplate} style={{ width: '12%' }} />
          <Column field="operation" header={t('audit.operation', { defaultValue: 'Thao tác' })} body={operationBodyTemplate} style={{ width: '9%' }} />
          <Column field="entityId" header={t('audit.entity_id', { defaultValue: 'Entity ID' })} style={{ width: '12%' }} />
          <Column field="username" header={t('audit.username', { defaultValue: 'Người thực hiện' })} style={{ width: '12%' }} />
          <Column field="timestamp" header={t('audit.timestamp', { defaultValue: 'Thời gian' })} body={timestampBodyTemplate} style={{ width: '14%' }} />
          <Column field="beforeData" header={t('audit.before', { defaultValue: 'Dữ liệu trước' })} body={(rowData: any) => formatJsonData(rowData.beforeData)} style={{ width: '18%' }} />
          <Column field="afterData" header={t('audit.after', { defaultValue: 'Dữ liệu sau' })} body={(rowData: any) => formatJsonData(rowData.afterData)} style={{ width: '18%' }} />
        </DataTable>
      </div>
    </div>
  );
}
