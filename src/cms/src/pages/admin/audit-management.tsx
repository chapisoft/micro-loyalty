import React, { useState, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { useTranslation } from 'react-i18next';
import { Calendar } from 'primereact/calendar';
import { Toast } from 'primereact/toast';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { Divider } from 'primereact/divider';
import * as XLSX from 'xlsx';

import { useAuditLogs } from '@/service/admin/audit-hooks';
import { AuditLog, AuditLogQuery } from '@/service/admin/audit';
import { AppBreadcrumb } from 'components';
import { TenantSelector } from '@/components/TenantSelector';

import './audit-management.scss';

export default function AuditLogPage() {
  const { t } = useTranslation();
  const toast = useRef<Toast>(null);

  // Thuê bao hiện tại đang chọn
  const [selectedTenant, setSelectedTenant] = useState<string>(
    () => localStorage.getItem('selected_tenant_id') || 'TENANT_NATCASH'
  );

  const [query, setQuery] = useState<AuditLogQuery>({
    tenantId: localStorage.getItem('selected_tenant_id') || 'TENANT_NATCASH',
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

  // Dialog xem chi tiết bản ghi kiểm toán & so sánh Diff Before / After
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState<boolean>(false);

  const { data, isLoading, refetch } = useAuditLogs(query);

  const handleTenantChange = (newTenant: string) => {
    setSelectedTenant(newTenant);
    localStorage.setItem('selected_tenant_id', newTenant);
    setFromDate(null);
    setToDate(null);
    setQuery({
      tenantId: newTenant,
      tableName: '',
      operation: '',
      username: '',
      fromDate: '',
      toDate: '',
      page: 0,
      size: 20,
    });
  };

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
      tenantId: selectedTenant,
      tableName: '',
      operation: '',
      username: '',
      fromDate: '',
      toDate: '',
      page: 0,
      size: 20,
    });
  };

  // Xuất file Excel kiểm toán chuyên nghiệp
  const handleExportExcel = () => {
    const rawList: AuditLog[] = Array.isArray(data)
      ? data
      : Array.isArray((data as any)?.content)
      ? (data as any).content
      : Array.isArray((data as any)?.data)
      ? (data as any).data
      : [];

    if (rawList.length === 0) {
      toast.current?.show({
        severity: 'warn',
        summary: t('common.notice', { defaultValue: 'Thông báo' }),
        detail: t('audit.no_data', { defaultValue: 'Không có dữ liệu để xuất Excel' }),
        life: 3000,
      });
      return;
    }

    const fromStr = query.fromDate || 'ALL';
    const toStr = query.toDate || 'ALL';
    const fileName = `Bao_Cao_Kiem_Toan_${selectedTenant}_${fromStr}_${toStr}.xlsx`;

    const exportData = rawList.map((item, index) => ({
      [t('common.no_order', { defaultValue: 'STT' })]: index + 1,
      [t('audit.id', { defaultValue: 'ID' })]: item.id,
      [t('audit.timestamp', { defaultValue: 'Thời gian' })]: item.timestamp ? new Date(item.timestamp).toLocaleString() : '',
      [t('audit.tenant', { defaultValue: 'Thuê bao' })]: item.tenantId || selectedTenant,
      [t('audit.module', { defaultValue: 'Phân hệ' })]: item.module || '',
      [t('audit.table', { defaultValue: 'Bảng dữ liệu' })]: item.tableName,
      [t('audit.operation', { defaultValue: 'Thao tác' })]: item.operation,
      [t('audit.entity_id', { defaultValue: 'Mã đối tượng' })]: item.entityId,
      [t('audit.actor', { defaultValue: 'Người thực hiện' })]: item.username,
      [t('audit.client_ip', { defaultValue: 'Địa chỉ IP' })]: item.clientIp || '',
      [t('audit.status', { defaultValue: 'Trạng thái' })]: item.status || 'SUCCESS',
      [t('audit.execution_time', { defaultValue: 'Thời gian xử lý (ms)' })]: item.executionTimeMs || 0,
      [t('audit.description', { defaultValue: 'Diễn giải nghiệp vụ' })]: item.description || '',
      [t('audit.before', { defaultValue: 'Dữ liệu trước' })]: item.beforeData || '',
      [t('audit.after', { defaultValue: 'Dữ liệu sau' })]: item.afterData || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    worksheet['!cols'] = [
      { wch: 6 },
      { wch: 8 },
      { wch: 20 },
      { wch: 18 },
      { wch: 14 },
      { wch: 24 },
      { wch: 14 },
      { wch: 22 },
      { wch: 16 },
      { wch: 16 },
      { wch: 12 },
      { wch: 12 },
      { wch: 35 },
      { wch: 30 },
      { wch: 30 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Audit_Logs');
    XLSX.writeFile(workbook, fileName);

    toast.current?.show({
      severity: 'success',
      summary: t('common.success', { defaultValue: 'Thành Công' }),
      detail: t('audit.export_success', {
        name: fileName,
        defaultValue: `Đã xuất báo cáo kiểm toán thành công: ${fileName}`,
      }),
      life: 3000,
    });
  };

  const handleOpenDetail = (log: AuditLog) => {
    setSelectedLog(log);
    setShowDetailDialog(true);
  };

  const operationBodyTemplate = (rowData: AuditLog) => {
    const op = String(rowData.operation || '').toUpperCase();
    let severity: 'success' | 'info' | 'warning' | 'danger' | 'secondary' = 'info';
    if (op === 'INSERT') severity = 'success';
    else if (op === 'UPDATE') severity = 'warning';
    else if (op === 'DELETE') severity = 'danger';
    else if (op === 'SETTLEMENT') severity = 'info';
    return <Tag severity={severity} value={op} />;
  };

  const tableBodyTemplate = (rowData: AuditLog) => {
    return (
      <span className="text-700 text-sm font-mono">{rowData.tableName}</span>
    );
  };

  const timestampBodyTemplate = (rowData: AuditLog) => {
    if (!rowData.timestamp) return '-';
    try {
      return (
        <span className="text-sm text-700 font-mono">
          {new Date(rowData.timestamp).toLocaleString()}
        </span>
      );
    } catch {
      return <span className="text-sm font-mono">{rowData.timestamp}</span>;
    }
  };

  const actorBodyTemplate = (rowData: AuditLog) => {
    return (
      <div className="flex flex-column gap-1">
        <span className="font-semibold text-sm text-900">{rowData.username}</span>
        {rowData.clientIp && (
          <span className="text-xs text-500 font-mono">IP: {rowData.clientIp}</span>
        )}
      </div>
    );
  };

  const descriptionBodyTemplate = (rowData: AuditLog) => {
    return (
      <span className="text-sm text-800 line-clamp-2" title={rowData.description || ''}>
        {rowData.description || '-'}
      </span>
    );
  };

  const actionBodyTemplate = (rowData: AuditLog) => {
    return (
      <Button
        icon="pi pi-eye"
        rounded
        outlined
        severity="info"
        size="small"
        onClick={() => handleOpenDetail(rowData)}
        tooltip={t('audit.view_diff', { defaultValue: 'Xem chi tiết thay đổi' })}
      />
    );
  };

  const renderJsonPretty = (jsonStr?: string) => {
    if (!jsonStr) return <span className="text-400 italic font-mono">- Không có dữ liệu -</span>;
    try {
      const parsed = JSON.parse(jsonStr);
      return (
        <pre className="m-0 p-3 border-round surface-100 text-xs font-mono max-h-20rem overflow-auto line-height-3 text-800">
          {JSON.stringify(parsed, null, 2)}
        </pre>
      );
    } catch {
      return <pre className="m-0 p-3 border-round surface-100 text-xs font-mono">{jsonStr}</pre>;
    }
  };

  const logList: AuditLog[] = Array.isArray(data)
    ? data
    : Array.isArray((data as any)?.content)
    ? (data as any).content
    : Array.isArray((data as any)?.data)
    ? (data as any).data
    : [];

  const totalRecords = typeof (data as any)?.totalElements === 'number'
    ? (data as any).totalElements
    : typeof (data as any)?.total === 'number'
    ? (data as any).total
    : Array.isArray(data)
    ? data.length
    : logList.length;

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
        {/* Header Bar: Tiêu Đề + TenantSelector + Nút Xuất Excel + Nút Refresh */}
        <div className="flex flex-wrap gap-3 align-items-center justify-content-between mb-4 pb-3 border-bottom-1 surface-border">
          <div>
            <h3 className="m-0 text-primary font-bold">{t('audit.management', { defaultValue: 'Nhật ký Hoạt động & Kiểm toán Hệ thống' })}</h3>
            <span className="text-500 text-sm mt-1 block">
              {t('audit.subtitle', { defaultValue: 'Truy vết 100% các thao tác thay đổi cấu hình, chính sách và giao dịch liên minh trên PostgreSQL 15+' })}
            </span>
          </div>
          <div className="flex flex-wrap gap-2 align-items-center">
            <TenantSelector value={selectedTenant} onChange={handleTenantChange} />
            <Button
              label={t('audit.export_excel', { defaultValue: 'Xuất Excel Kiểm Toán' })}
              icon="pi pi-file-excel"
              severity="success"
              outlined
              size="small"
              onClick={handleExportExcel}
              tooltip={t('audit.export_excel_tooltip', { defaultValue: 'Xuất toàn bộ dữ liệu nhật ký kiểm toán ra tệp Excel (.xlsx)' })}
            />
            <Button
              icon="pi pi-refresh"
              rounded
              outlined
              size="small"
              onClick={() => refetch()}
              tooltip={t('common.refresh', { defaultValue: 'Làm mới' })}
            />
          </div>
        </div>

        {/* Thanh Bộ Lọc Đa Tiêu Chí */}
        <div className="flex flex-wrap gap-2 align-items-center mb-4">
          <Dropdown
            className="w-16rem"
            placeholder={t('audit.table_name', { defaultValue: 'Chọn bảng dữ liệu' })}
            value={query.tableName || ''}
            options={[
              { label: t('audit.all_tables', { defaultValue: 'Tất cả bảng nghiệp vụ' }), value: '' },
              { label: 'Hạng Hội Viên (loyalty_tiers)', value: 'loyalty_tiers' },
              { label: 'Chính Sách Tích/Tiêu (loyalty_acceptance_policies)', value: 'loyalty_acceptance_policies' },
              { label: 'Cột Mốc Chiến Dịch (loyalty_campaign_milestones)', value: 'loyalty_campaign_milestones' },
              { label: 'Kho Voucher (loyalty_vouchers)', value: 'loyalty_vouchers' },
              { label: 'Cổng Game & Vòng Quay (loyalty_games)', value: 'loyalty_games' },
              { label: 'Đối Tác Liên Minh (loyalty_partners)', value: 'loyalty_partners' },
              { label: 'Bù Trừ Tài Chính (clearing_transactions)', value: 'clearing_transactions' },
              { label: 'Thiết Bị Điểm Bán POS (partner_user_devices)', value: 'partner_user_devices' },
              { label: 'Tham Số Hệ Thống (system_parameters)', value: 'system_parameters' },
              { label: 'Người Dùng Quản Trị (admin_users)', value: 'admin_users' },
            ]}
            onChange={e => setQuery(q => ({ ...q, tableName: e.value }))}
            showClear
          />

          <Dropdown
            className="w-12rem"
            placeholder={t('audit.operation', { defaultValue: 'Loại thao tác' })}
            value={query.operation || ''}
            options={[
              { label: t('audit.all_operations', { defaultValue: 'Tất cả thao tác' }), value: '' },
              { label: 'INSERT (Thêm mới)', value: 'INSERT' },
              { label: 'UPDATE (Cập nhật)', value: 'UPDATE' },
              { label: 'DELETE (Xóa bỏ)', value: 'DELETE' },
              { label: 'SETTLEMENT (Quyết toán)', value: 'SETTLEMENT' },
              { label: 'LOCK (Khóa bảo mật)', value: 'LOCK' },
              { label: 'UNLOCK (Mở khóa)', value: 'UNLOCK' },
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
            className="w-11rem"
          />

          <Calendar
            value={toDate}
            onChange={e => setToDate(e.value ?? null)}
            placeholder={t('audit.to_date', { defaultValue: 'Đến ngày' })}
            dateFormat="yy-mm-dd"
            showIcon
            className="w-11rem"
          />

          <Button
            label={t('audit.filter', { defaultValue: 'Tìm kiếm' })}
            icon="pi pi-search"
            size="small"
            onClick={handleFilter}
          />
          <Button
            label={t('audit.reset', { defaultValue: 'Đặt lại' })}
            icon="pi pi-filter-slash"
            severity="secondary"
            outlined
            size="small"
            onClick={handleReset}
          />
        </div>

        {/* Bảng Nhật Ký Kiểm Toán Chuẩn Mực */}
        <DataTable
          value={logList}
          lazy
          loading={isLoading}
          paginator
          rows={query.size || 20}
          first={(query.page || 0) * (query.size || 20)}
          onPage={handlePageChange}
          totalRecords={totalRecords}
          rowsPerPageOptions={[10, 20, 50]}
          className="p-datatable-striped p-datatable-gridlines text-sm"
          emptyMessage={t('audit.no_data', { defaultValue: 'Không có dữ liệu nhật ký hoạt động nào phù hợp' })}
        >
          <Column
            field="id"
            header={t('audit.id', { defaultValue: 'ID' })}
            style={{ minWidth: '70px', width: '5%' }}
          />
          <Column
            field="timestamp"
            header={t('audit.timestamp', { defaultValue: 'Thời gian' })}
            body={timestampBodyTemplate}
            style={{ minWidth: '150px', width: '13%' }}
          />
          <Column
            field="tenantId"
            header={t('audit.tenant', { defaultValue: 'Thuê bao' })}
            body={(rowData: AuditLog) => (
              <span className="font-medium text-primary text-xs">{rowData.tenantId || selectedTenant}</span>
            )}
            style={{ minWidth: '130px', width: '10%' }}
          />
          <Column
            field="tableName"
            header={t('audit.table', { defaultValue: 'Bảng dữ liệu' })}
            body={tableBodyTemplate}
            style={{ minWidth: '180px', width: '15%' }}
          />
          <Column
            field="operation"
            header={t('audit.operation', { defaultValue: 'Thao tác' })}
            body={operationBodyTemplate}
            style={{ minWidth: '100px', width: '8%' }}
          />
          <Column
            field="entityId"
            header={t('audit.entity_id', { defaultValue: 'Mã đối tượng' })}
            body={(rowData: AuditLog) => (
              <span className="font-mono text-xs text-800">{rowData.entityId}</span>
            )}
            style={{ minWidth: '140px', width: '11%' }}
          />
          <Column
            field="username"
            header={t('audit.actor', { defaultValue: 'Người thực hiện' })}
            body={actorBodyTemplate}
            style={{ minWidth: '140px', width: '12%' }}
          />
          <Column
            field="description"
            header={t('audit.description', { defaultValue: 'Diễn giải nghiệp vụ' })}
            body={descriptionBodyTemplate}
            style={{ minWidth: '200px', width: '18%' }}
          />
          <Column
            header={t('audit.actions', { defaultValue: 'Thao tác' })}
            body={actionBodyTemplate}
            style={{ minWidth: '80px', width: '8%', textAlign: 'center' }}
          />
        </DataTable>
      </div>

      {/* Dialog Chi Tiết Nhật Ký & So Sánh Diff Before / After */}
      <Dialog
        header={
          <div className="flex align-items-center gap-2">
            <i className="pi pi-shield text-primary text-xl" />
            <span className="font-bold text-lg">
              {t('audit.diff_title', { id: selectedLog?.id, defaultValue: `Chi tiết Nhật ký Kiểm toán #${selectedLog?.id}` })}
            </span>
          </div>
        }
        visible={showDetailDialog}
        style={{ width: '75vw', maxWidth: '1000px' }}
        onHide={() => setShowDetailDialog(false)}
        footer={
          <div className="flex justify-content-end">
            <Button
              label={t('common.close', { defaultValue: 'Đóng' })}
              icon="pi pi-times"
              onClick={() => setShowDetailDialog(false)}
            />
          </div>
        }
      >
        {selectedLog && (
          <div className="flex flex-column gap-3">
            {/* Thẻ Thông Tin Hành Động */}
            <div className="grid surface-50 p-3 border-round border-1 surface-border">
              <div className="col-12 sm:col-4">
                <span className="text-500 text-xs block">{t('audit.tenant', { defaultValue: 'Đơn vị Thuê bao' })}</span>
                <span className="font-semibold text-primary">{selectedLog.tenantId || selectedTenant}</span>
              </div>
              <div className="col-12 sm:col-4">
                <span className="text-500 text-xs block">{t('audit.table', { defaultValue: 'Bảng CSDL' })}</span>
                <span className="font-mono text-sm text-900">{selectedLog.tableName}</span>
              </div>
              <div className="col-12 sm:col-4">
                <span className="text-500 text-xs block">{t('audit.operation', { defaultValue: 'Thao tác' })}</span>
                {operationBodyTemplate(selectedLog)}
              </div>
              <div className="col-12 sm:col-4 mt-2">
                <span className="text-500 text-xs block">{t('audit.entity_id', { defaultValue: 'Mã đối tượng (Entity ID)' })}</span>
                <span className="font-mono text-sm text-900">{selectedLog.entityId}</span>
              </div>
              <div className="col-12 sm:col-4 mt-2">
                <span className="text-500 text-xs block">{t('audit.actor', { defaultValue: 'Người thực hiện' })}</span>
                <span className="font-semibold text-sm">{selectedLog.username}</span>
                {selectedLog.actorRole && (
                  <Tag severity="secondary" value={selectedLog.actorRole} className="ml-2 text-xs" />
                )}
              </div>
              <div className="col-12 sm:col-4 mt-2">
                <span className="text-500 text-xs block">{t('audit.client_ip', { defaultValue: 'Địa chỉ IP' })}</span>
                <span className="font-mono text-xs">{selectedLog.clientIp || 'N/A'}</span>
              </div>
              {selectedLog.description && (
                <div className="col-12 mt-2">
                  <span className="text-500 text-xs block">{t('audit.description', { defaultValue: 'Diễn giải nghiệp vụ' })}</span>
                  <span className="text-sm font-medium text-800">{selectedLog.description}</span>
                </div>
              )}
            </div>

            <Divider />

            {/* So Sánh Diff Before / After Dữ Liệu */}
            <div className="grid">
              <div className="col-12 md:col-6">
                <div className="border-1 border-orange-200 border-round p-3 surface-card">
                  <div className="flex align-items-center justify-content-between mb-2 pb-2 border-bottom-1 border-orange-100">
                    <span className="font-bold text-orange-700 text-sm">
                      <i className="pi pi-history mr-2" />
                      {t('audit.before', { defaultValue: 'Dữ liệu trước (Before Snapshot)' })}
                    </span>
                  </div>
                  {renderJsonPretty(selectedLog.beforeData)}
                </div>
              </div>

              <div className="col-12 md:col-6">
                <div className="border-1 border-green-200 border-round p-3 surface-card">
                  <div className="flex align-items-center justify-content-between mb-2 pb-2 border-bottom-1 border-green-100">
                    <span className="font-bold text-green-700 text-sm">
                      <i className="pi pi-check mr-2" />
                      {t('audit.after', { defaultValue: 'Dữ liệu sau (After Snapshot)' })}
                    </span>
                  </div>
                  {renderJsonPretty(selectedLog.afterData)}
                </div>
              </div>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
