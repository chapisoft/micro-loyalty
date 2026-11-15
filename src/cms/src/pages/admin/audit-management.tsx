import React, { useState, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Card } from 'primereact/card';
import { useTranslation } from 'react-i18next';
import { Calendar } from 'primereact/calendar';
import { Toast } from 'primereact/toast';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { Divider } from 'primereact/divider';
import { TabView, TabPanel } from 'primereact/tabview';
import * as XLSX from 'xlsx';

import { useAuditLogs } from '@/service/admin/audit-hooks';
import { AuditLog, AuditLogQuery } from '@/service/admin/audit';
import { TenantSelector } from '@/components/TenantSelector';
import { AppBreadcrumb } from 'components';
import { StandardPageHeader } from '@/components/StandardPageHeader';
import { StandardRowActions } from '@/components/StandardRowActions';

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
          summary: t('audit.invalid_range'),
          detail: t('audit.from_before_to'),
          life: 3000,
        });
        return;
      }
      if (diff > 31) {
        toast.current?.show({
          severity: 'warn',
          summary: t('audit.too_much'),
          detail: t('audit.max_31'),
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
        summary: t('common.notice'),
        detail: t('audit.no_data'),
        life: 3000,
      });
      return;
    }

    const fromStr = query.fromDate || 'ALL';
    const toStr = query.toDate || 'ALL';
    const fileName = `Bao_Cao_Kiem_Toan_${selectedTenant}_${fromStr}_${toStr}.xlsx`;

    const exportData = rawList.map((item, index) => ({
      [t('common.no_order')]: index + 1,
      [t('audit.id')]: item.id,
      [t('audit.timestamp')]: item.timestamp ? new Date(item.timestamp).toLocaleString() : '',
      [t('audit.tenant')]: item.tenantId || selectedTenant,
      [t('audit.module')]: item.module || '',
      [t('audit.table')]: item.tableName,
      [t('audit.operation')]: item.operation,
      [t('audit.entity_id')]: item.entityId,
      [t('audit.actor')]: item.username,
      [t('audit.client_ip')]: item.clientIp || '',
      [t('audit.status')]: item.status || 'SUCCESS',
      [t('audit.execution_time')]: item.executionTimeMs || 0,
      [t('audit.description')]: item.description || '',
      [t('audit.before')]: item.beforeData || '',
      [t('audit.after')]: item.afterData || '',
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
      summary: t('common.success'),
      detail: t('audit.export_success', {
        name: fileName
      }),
      life: 3000,
    });
  };

  const handleOpenDetail = (log: AuditLog) => {
    setSelectedLog(log);
    setShowDetailDialog(true);
  };

  const idBodyTemplate = (rowData: AuditLog) => {
    return (
      <span className="font-bold font-mono text-900 white-space-nowrap">
        #{rowData.id}
      </span>
    );
  };

  const operationBodyTemplate = (rowData: AuditLog) => {
    const op = String(rowData.operation || '').toUpperCase();
    let severity: 'success' | 'info' | 'warning' | 'danger' | 'secondary' = 'info';
    if (op === 'INSERT') {
      severity = 'success';
    } else if (op === 'UPDATE') {
      severity = 'warning';
    } else if (op === 'DELETE') {
      severity = 'danger';
    } else if (op === 'SETTLEMENT') {
      severity = 'info';
    } else if (op === 'LOCK') {
      severity = 'danger';
    } else if (op === 'UNLOCK') {
      severity = 'success';
    }
    return <Tag severity={severity} value={op} className="text-xs px-2 py-1 white-space-nowrap" />;
  };

  const tableBodyTemplate = (rowData: AuditLog) => {
    return (
      <span className="text-900 text-sm font-mono white-space-nowrap">{rowData.tableName}</span>
    );
  };

  const timestampBodyTemplate = (rowData: AuditLog) => {
    if (!rowData.timestamp) return '-';
    try {
      return (
        <span className="text-sm text-900 font-mono white-space-nowrap">
          {new Date(rowData.timestamp).toLocaleString()}
        </span>
      );
    } catch {
      return <span className="text-sm text-900 font-mono white-space-nowrap">{rowData.timestamp}</span>;
    }
  };

  const actorBodyTemplate = (rowData: AuditLog) => {
    return (
      <div className="flex flex-column gap-1">
        <span className="font-medium text-sm text-900 white-space-nowrap">{rowData.username}</span>
        {rowData.clientIp && (
          <span className="text-xs text-500 font-mono white-space-nowrap">IP: {rowData.clientIp}</span>
        )}
      </div>
    );
  };

  const descriptionBodyTemplate = (rowData: AuditLog) => {
    return (
      <span className="text-sm text-900 line-clamp-2" title={rowData.description || ''}>
        {rowData.description || '-'}
      </span>
    );
  };

  const actionBodyTemplate = (rowData: AuditLog) => {
    return (
      <StandardRowActions
        actions={[
          {
            icon: 'pi pi-eye',
            label: t('audit.view_diff', 'Xem chi tiết'),
            severity: 'info',
            onClick: () => handleOpenDetail(rowData),
          },
        ]}
      />
    );
  };

  const computeJsonDiff = (beforeStr?: string, afterStr?: string) => {
    const parseSafe = (raw?: string): Record<string, any> => {
      if (!raw) return {};
      try {
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : { value: parsed };
      } catch {
        return { raw };
      }
    };
    const beforeObj = parseSafe(beforeStr);
    const afterObj = parseSafe(afterStr);
    const keys = Array.from(new Set([...Object.keys(beforeObj), ...Object.keys(afterObj)]));
    return keys.map((key) => {
      const hasBefore = Object.prototype.hasOwnProperty.call(beforeObj, key);
      const hasAfter = Object.prototype.hasOwnProperty.call(afterObj, key);
      const bVal = hasBefore ? JSON.stringify(beforeObj[key]) : undefined;
      const aVal = hasAfter ? JSON.stringify(afterObj[key]) : undefined;
      let changeType: 'ADDED' | 'REMOVED' | 'MODIFIED' | 'UNCHANGED' = 'UNCHANGED';
      if (!hasBefore && hasAfter) changeType = 'ADDED';
      else if (hasBefore && !hasAfter) changeType = 'REMOVED';
      else if (bVal !== aVal) changeType = 'MODIFIED';
      return {
        field: key,
        beforeValue: bVal ?? '—',
        afterValue: aVal ?? '—',
        changeType,
      };
    });
  };

  const renderJsonPretty = (jsonStr?: string) => {
    if (!jsonStr) return <span className="text-400 italic font-mono">- {t('no_data_available')} -</span>;
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
    <div className="w-full">
      <AppBreadcrumb items={[{ label: t('audit.management') }]} />

      <StandardPageHeader
        title={t('audit.management')}
        subtitle={t('audit.subtitle')}
        secondaryActions={[
          {
            label: t('audit.export_excel', 'Xuất Excel'),
            icon: 'pi pi-download',
            onClick: handleExportExcel,
          },
        ]}
        extraLeft={<TenantSelector value={selectedTenant} onChange={handleTenantChange} />}
        onRefresh={() => refetch()}
        refreshLoading={isLoading}
      />

      {/* 2. Filter Bar */}
      <Card className="mb-4 shadow-1 border-round-xl">
        <div className="flex flex-wrap align-items-center gap-3">
          {/* Nhóm Filter Điều Kiện */}
          <div className="flex flex-wrap align-items-center gap-3 flex-1">
            {/* 1. Chọn Bảng Dữ Liệu */}
            <div className="w-16rem">
              <Dropdown
                className="w-full"
                placeholder={t('audit.table_name')}
                value={query.tableName || ''}
                options={[
                  { label: t('audit.all_tables'), value: '' },
                  { label: `${t('audit.table_loyalty_policies')} (loyalty_policies)`, value: 'loyalty_policies' },
                  { label: `${t('audit.table_loyalty_tiers')} (loyalty_tiers)`, value: 'loyalty_tiers' },
                  { label: `${t('audit.table_loyalty_vouchers')} (loyalty_vouchers)`, value: 'loyalty_vouchers' },
                  { label: `${t('audit.table_loyalty_games')} (loyalty_games)`, value: 'loyalty_games' },
                  { label: `${t('audit.table_loyalty_game_prizes')} (loyalty_game_prizes)`, value: 'loyalty_game_prizes' },
                  { label: `${t('audit.table_loyalty_partners')} (loyalty_partners)`, value: 'loyalty_partners' },
                  { label: `${t('audit.table_admin_users')} (admin_users)`, value: 'admin_users' },
                ]}
                onChange={e => setQuery(q => ({ ...q, tableName: e.value }))}
                showClear
              />
            </div>

            {/* 2. Chọn Loại Thao Tác */}
            <div className="w-13rem">
              <Dropdown
                className="w-full"
                placeholder={t('audit.operation')}
                value={query.operation || ''}
                options={[
                  { label: t('audit.all_operations'), value: '' },
                  { label: t('audit.op_insert'), value: 'INSERT' },
                  { label: t('audit.op_update'), value: 'UPDATE' },
                  { label: t('audit.op_delete'), value: 'DELETE' },
                  { label: t('audit.op_settlement'), value: 'SETTLEMENT' },
                  { label: t('audit.op_lock'), value: 'LOCK' },
                  { label: t('audit.op_unlock'), value: 'UNLOCK' },
                ]}
                onChange={e => setQuery(q => ({ ...q, operation: e.value }))}
                showClear
              />
            </div>

            {/* 3. Người Thực Hiện với Icon */}
            <div className="w-14rem">
              <span className="p-input-icon-left w-full">
                <i className="pi pi-user text-400" />
                <InputText
                  className="w-full"
                  placeholder={t('audit.username')}
                  value={query.username || ''}
                  onChange={e => setQuery(q => ({ ...q, username: e.target.value }))}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleFilter();
                  }}
                />
              </span>
            </div>

            {/* 4. Khối Chọn Khoảng Thời Gian (Từ ngày -> Đến ngày) */}
            <div className="audit-date-range-capsule">
              <Calendar
                value={fromDate}
                onChange={e => setFromDate(e.value ?? null)}
                placeholder={t('audit.from_date')}
                dateFormat="yy-mm-dd"
                showIcon
                className="w-8rem audit-calendar-input"
              />
              <i className="pi pi-arrow-right text-400 text-xs mx-1" />
              <Calendar
                value={toDate}
                onChange={e => setToDate(e.value ?? null)}
                placeholder={t('audit.to_date')}
                dateFormat="yy-mm-dd"
                showIcon
                className="w-8rem audit-calendar-input"
              />
            </div>

            {/* 5. Nút Thao Tác (Tìm kiếm & Đặt lại) */}
            <div className="flex align-items-center gap-2">
              <Button
                label={t('audit.filter')}
                icon="pi pi-search"
                className="p-button-primary px-3"
                size="small"
                onClick={handleFilter}
              />
              <Button
                label={t('audit.reset')}
                icon="pi pi-refresh"
                severity="secondary"
                outlined
                size="small"
                className="px-3"
                onClick={handleReset}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Bảng Nhật Ký Kiểm Toán Chuẩn Mực */}
      <div className="card shadow-1 border-round surface-card p-4">
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
          emptyMessage={t('audit.no_data')}
        >
          <Column
            header={t('common.order_number', 'STT')}
            body={(_, options) => ((query.page || 0) * (query.size || 20)) + options.rowIndex + 1}
            style={{ width: '4rem', textAlign: 'center' }}
          />
          <Column
            header={t('audit.actions')}
            body={actionBodyTemplate}
            style={{ width: '6rem', textAlign: 'center' }}
          />
          <Column
            field="id"
            header={<span title={t('audit.id_tooltip')}>{t('audit.id')}</span>}
            body={idBodyTemplate}
            style={{ minWidth: '85px', textAlign: 'center' }}
            headerStyle={{ textAlign: 'center' }}
          />
          <Column
            field="timestamp"
            header={<span title={t('audit.timestamp_tooltip')}>{t('audit.timestamp')}</span>}
            body={timestampBodyTemplate}
            style={{ minWidth: '175px' }}
          />
          <Column
            field="tenantId"
            header={t('audit.tenant')}
            body={(rowData: AuditLog) => (
              <span className="text-900 text-xs font-mono white-space-nowrap">{rowData.tenantId || selectedTenant}</span>
            )}
            style={{ minWidth: '145px' }}
          />
          <Column
            field="tableName"
            header={t('audit.table')}
            body={tableBodyTemplate}
            style={{ minWidth: '190px' }}
          />
          <Column
            field="operation"
            header={t('audit.operation')}
            body={operationBodyTemplate}
            style={{ minWidth: '115px' }}
          />
          <Column
            field="entityId"
            header={<span title={t('audit.entity_id_tooltip')}>{t('audit.entity_id')}</span>}
            body={(rowData: AuditLog) => (
              <span className="font-mono text-xs text-800 white-space-nowrap">{rowData.entityId}</span>
            )}
            style={{ minWidth: '170px' }}
          />
          <Column
            field="username"
            header={t('audit.actor')}
            body={actorBodyTemplate}
            style={{ minWidth: '150px' }}
          />
          <Column
            field="description"
            header={t('audit.description')}
            body={descriptionBodyTemplate}
            style={{ minWidth: '220px' }}
          />
        </DataTable>
      </div>

      {/* Dialog Chi Tiết Nhật Ký & So Sánh Diff Before / After */}
      <Dialog
        header={
          <div className="flex align-items-center gap-2">
            <i className="pi pi-shield text-primary text-xl" />
            <span className="font-bold text-lg">
              {t('audit.diff_title', { id: selectedLog?.id })}
            </span>
          </div>
        }
        visible={showDetailDialog}
        style={{ width: '75vw', maxWidth: '1000px' }}
        onHide={() => setShowDetailDialog(false)}
        footer={
          <div className="flex justify-content-end">
            <Button
              label={t('common.close')}
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
                <span className="text-500 text-xs block">{t('audit.tenant')}</span>
                <span className="font-semibold text-primary">{selectedLog.tenantId || selectedTenant}</span>
              </div>
              <div className="col-12 sm:col-4">
                <span className="text-500 text-xs block">{t('audit.table')}</span>
                <span className="font-mono text-sm text-900">{selectedLog.tableName}</span>
              </div>
              <div className="col-12 sm:col-4">
                <span className="text-500 text-xs block">{t('audit.operation')}</span>
                {operationBodyTemplate(selectedLog)}
              </div>
              <div className="col-12 sm:col-4 mt-2">
                <span className="text-500 text-xs block">{t('audit.entity_id')}</span>
                <span className="font-mono text-sm text-900">{selectedLog.entityId}</span>
              </div>
              <div className="col-12 sm:col-4 mt-2">
                <span className="text-500 text-xs block">{t('audit.actor')}</span>
                <span className="font-semibold text-sm">{selectedLog.username}</span>
                {selectedLog.actorRole && (
                  <Tag severity="secondary" value={selectedLog.actorRole} className="ml-2 text-xs" />
                )}
              </div>
              <div className="col-12 sm:col-4 mt-2">
                <span className="text-500 text-xs block">{t('audit.client_ip')}</span>
                <span className="font-mono text-xs">{selectedLog.clientIp || 'N/A'}</span>
              </div>
              {selectedLog.description && (
                <div className="col-12 mt-2">
                  <span className="text-500 text-xs block">{t('audit.description')}</span>
                  <span className="text-sm font-medium text-800">{selectedLog.description}</span>
                </div>
              )}
            </div>

            <Divider />

            {/* So Sánh Diff Before / After Dữ Liệu (QT-04) */}
            <TabView>
              <TabPanel header={t('audit.diff_table_tab')} leftIcon="pi pi-arrows-h mr-2">
                <DataTable
                  value={computeJsonDiff(selectedLog.beforeData, selectedLog.afterData)}
                  size="small"
                  stripedRows
                  emptyMessage={t('no_data_available')}
                  responsiveLayout="scroll"
                >
                  <Column
                    field="field"
                    header={t('audit.diff_field')}
                    body={(row: any) => <span className="font-mono text-xs text-900 white-space-nowrap">{row.field}</span>}
                    style={{ minWidth: '160px' }}
                  />
                  <Column
                    field="changeType"
                    header={t('audit.diff_type')}
                    body={(row: any) => {
                      const sev =
                        row.changeType === 'ADDED'
                          ? 'success'
                          : row.changeType === 'REMOVED'
                          ? 'danger'
                          : row.changeType === 'MODIFIED'
                          ? 'warning'
                          : 'secondary';
                      return <Tag value={row.changeType} severity={sev} className="text-xs" />;
                    }}
                    style={{ minWidth: '110px', textAlign: 'center' }}
                  />
                  <Column
                    field="beforeValue"
                    header={t('audit.before')}
                    body={(row: any) => (
                      <span
                        className={`font-mono text-xs block p-1 border-round ${
                          row.changeType === 'MODIFIED' || row.changeType === 'REMOVED'
                            ? 'bg-red-50 text-red-700'
                            : 'text-600'
                        }`}
                      >
                        {row.beforeValue}
                      </span>
                    )}
                    style={{ minWidth: '200px' }}
                  />
                  <Column
                    field="afterValue"
                    header={t('audit.after')}
                    body={(row: any) => (
                      <span
                        className={`font-mono text-xs block p-1 border-round ${
                          row.changeType === 'MODIFIED' || row.changeType === 'ADDED'
                            ? 'bg-green-50 text-green-700'
                            : 'text-600'
                        }`}
                      >
                        {row.afterValue}
                      </span>
                    )}
                    style={{ minWidth: '200px' }}
                  />
                </DataTable>
              </TabPanel>
              <TabPanel header={t('audit.raw_json_tab')} leftIcon="pi pi-code mr-2">
                <div className="grid">
                  <div className="col-12 md:col-6">
                    <div className="border-1 border-orange-200 border-round p-3 surface-card">
                      <div className="flex align-items-center justify-content-between mb-2 pb-2 border-bottom-1 border-orange-100">
                        <span className="font-medium text-orange-700 text-sm">
                          <i className="pi pi-history mr-2" />
                          {t('audit.before')}
                        </span>
                      </div>
                      {renderJsonPretty(selectedLog.beforeData)}
                    </div>
                  </div>

                  <div className="col-12 md:col-6">
                    <div className="border-1 border-green-200 border-round p-3 surface-card">
                      <div className="flex align-items-center justify-content-between mb-2 pb-2 border-bottom-1 border-green-100">
                        <span className="font-medium text-green-700 text-sm">
                          <i className="pi pi-check mr-2" />
                          {t('audit.after')}
                        </span>
                      </div>
                      {renderJsonPretty(selectedLog.afterData)}
                    </div>
                  </div>
                </div>
              </TabPanel>
            </TabView>
          </div>
        )}
      </Dialog>
    </div>
  );
}
