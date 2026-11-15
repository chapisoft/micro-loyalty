import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { Skeleton } from 'primereact/skeleton';
import { useTranslation } from 'react-i18next';
import { StandardPageHeader } from '@/components/StandardPageHeader';
import { UniversalFilterBar } from '@/components/UniversalFilterBar';
import { StandardRowActions } from '@/components/StandardRowActions';
import { exportToExcel } from '@/components/exportHelper';
import { LoyaltyService, CustomerSegmentModel, SegmentMemberModel } from '@/service/loyalty.service';
import * as XLSX from 'xlsx';

export const CustomerSegmentsPage: React.FC = () => {
  const { t } = useTranslation();
  const toast = useRef<Toast>(null);

  const [selectedTenant, setSelectedTenant] = useState<string>(
    () => localStorage.getItem('selected_tenant_id') || 'TENANT_NATCASH'
  );
  const [segments, setSegments] = useState<CustomerSegmentModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<CustomerSegmentModel | null>(null);
  const [members, setMembers] = useState<SegmentMemberModel[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');

  const fetchSegments = useCallback(async () => {
    setLoading(true);
    try {
      const list = await LoyaltyService.getSegments(selectedTenant);
      setSegments(Array.isArray(list) ? list : []);
    } finally {
      setLoading(false);
    }
  }, [selectedTenant]);

  useEffect(() => {
    fetchSegments();
  }, [fetchSegments]);

  const handleRecalculate = async (seg: CustomerSegmentModel) => {
    if (!seg.id) return;
    setRecalcId(seg.id);
    try {
      await LoyaltyService.recalculateSegment(seg.id, selectedTenant);
      toast.current?.show({ severity: 'success', summary: t('common.success'), detail: `${t('segment.recalculated')} ${seg.segmentCode}` });
      fetchSegments();
    } catch (err: any) {
      toast.current?.show({ severity: 'error', summary: t('common.error'), detail: err?.response?.data?.message || err.message });
    } finally {
      setRecalcId(null);
    }
  };

  const openMembers = async (seg: CustomerSegmentModel) => {
    setSelectedSegment(seg);
    if (!seg.segmentCode) return;
    setMembersLoading(true);
    try {
      const list = await LoyaltyService.getSegmentMembers(seg.segmentCode, selectedTenant);
      setMembers(Array.isArray(list) ? list : []);
    } finally {
      setMembersLoading(false);
    }
  };

  const filteredSegments = useMemo(() => {
    const q = searchKeyword.toLowerCase().trim();
    if (!q) return segments;
    return segments.filter(
      (s) =>
        (s.segmentCode && s.segmentCode.toLowerCase().includes(q)) ||
        (s.segmentName && s.segmentName.toLowerCase().includes(q)) ||
        (s.ruleSummary && s.ruleSummary.toLowerCase().includes(q))
    );
  }, [segments, searchKeyword]);

  const handleExport = () => {
    exportToExcel(
      filteredSegments.map((s, idx) => ({
        stt: idx + 1,
        segmentCode: s.segmentCode,
        segmentName: s.segmentName,
        ruleSummary: s.ruleSummary || '',
        memberCount: s.memberCount || 0,
        lastCalculatedAt: s.lastCalculatedAt ? new Date(s.lastCalculatedAt).toLocaleString('vi-VN') : '',
      })),
      [
        { key: 'stt', header: '#' },
        { key: 'segmentCode', header: t('segment.code') },
        { key: 'segmentName', header: t('segment.name') },
        { key: 'ruleSummary', header: t('segment.rule_expr') },
        { key: 'memberCount', header: t('segment.member_count') },
        { key: 'lastCalculatedAt', header: t('segment.last_computed') },
      ],
      `Danh_Sach_Phan_Khuc_${selectedTenant}`
    );
  };

  const handleExportCsv = () => {
    if (!selectedSegment || members.length === 0) return;
    const ws = XLSX.utils.json_to_sheet(members);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Members');
    XLSX.writeFile(wb, `segment_${selectedSegment.segmentCode}_${selectedTenant}.csv`);
  };

  return (
    <div className="w-full">
      <Toast ref={toast} />
      <StandardPageHeader
        title={t('nav.segments')}
        subtitle={t('segment.subtitle', 'Định nghĩa tập khách hàng mục tiêu, điều kiện kích hoạt chiến dịch và đồng bộ thành viên')}
        breadcrumbs={[{ label: t('nav.segments') }]}
        tenantValue={selectedTenant}
        onTenantChange={setSelectedTenant}
      />

      <div className="card shadow-1 border-round surface-card p-3 w-full">
        <UniversalFilterBar
          searchValue={searchKeyword}
          onSearchChange={setSearchKeyword}
          searchPlaceholder={t('common.search')}
          onExport={handleExport}
          onReset={() => setSearchKeyword('')}
          onRefresh={fetchSegments}
        />

        {loading ? (
          <div className="flex flex-column gap-2"><Skeleton height="2.75rem" /><Skeleton height="2.75rem" /><Skeleton height="2.75rem" /></div>
        ) : (
          <DataTable<CustomerSegmentModel[]>
            value={filteredSegments}
            paginator
            rows={10}
            rowsPerPageOptions={[10, 25, 50]}
            stripedRows
            responsiveLayout="scroll"
            emptyMessage={t('segment.empty')}
          >
            <Column
              header={t('common.order_number', 'STT')}
              body={(_data, options) => (
                <span className="font-mono text-xs text-600">{options.rowIndex + 1}</span>
              )}
              style={{ width: '4rem', textAlign: 'center' }}
            />
            <Column
              header={t('common.action')}
              body={(r: CustomerSegmentModel) => (
                <StandardRowActions
                  onView={() => openMembers(r)}
                  extraActions={[
                    {
                      label: t('segment.recalculate'),
                      icon: 'pi pi-sync',
                      onClick: () => handleRecalculate(r),
                    },
                  ]}
                />
              )}
              style={{ width: '6rem', textAlign: 'center' }}
            />
            <Column field="segmentCode" header={t('segment.code')} body={(r: CustomerSegmentModel) => <span className="font-bold font-mono text-900">{r.segmentCode}</span>} sortable style={{ minWidth: '11rem' }} />
            <Column field="segmentName" header={t('segment.name')} body={(r: CustomerSegmentModel) => <span className="text-900">{r.segmentName}</span>} sortable style={{ minWidth: '14rem' }} />
            <Column field="ruleSummary" header={t('segment.rule_expr')} body={(r: CustomerSegmentModel) => <span className="font-mono text-xs text-900">{r.ruleSummary || '--'}</span>} style={{ minWidth: '16rem' }} />
            <Column field="memberCount" header={t('segment.member_count')} body={(r: CustomerSegmentModel) => <span className="font-mono text-900">{Number(r.memberCount || 0).toLocaleString()}</span>} sortable style={{ minWidth: '8.5rem', textAlign: 'right' }} />
            <Column field="lastCalculatedAt" header={t('segment.last_computed')} body={(r: CustomerSegmentModel) => <span className="text-900 font-mono text-xs">{r.lastCalculatedAt ? new Date(r.lastCalculatedAt).toLocaleString('vi-VN') : '--'}</span>} sortable style={{ minWidth: '11rem' }} />
          </DataTable>
        )}
      </div>

      <Dialog
        visible={!!selectedSegment}
        onHide={() => setSelectedSegment(null)}
        header={selectedSegment ? `${selectedSegment.segmentCode} · ${selectedSegment.segmentName}` : ''}
        style={{ width: '52rem' }}
        breakpoints={{ '641px': '95vw' }}
        modal
      >
        <div className="flex justify-content-between align-items-center mb-3">
          <span className="text-sm text-600">{t('segment.members_preview')}</span>
          <Button icon="pi pi-download" label={t('common.export_csv')} size="small" outlined onClick={handleExportCsv} disabled={members.length === 0} />
        </div>
        {membersLoading ? (
          <div className="flex flex-column gap-2"><Skeleton height="2.2rem" /><Skeleton height="2.2rem" /></div>
        ) : (
          <DataTable<SegmentMemberModel[]> value={members} paginator rows={10} size="small" emptyMessage={t('common.no_data')}>
            <Column
              header={t('common.order_number', 'STT')}
              body={(_data, options) => options.rowIndex + 1}
              style={{ width: '3.5rem', textAlign: 'center' }}
            />
            <Column field="externalUserId" header={t('customer.phone')} body={(m: SegmentMemberModel) => <span className="font-mono text-900">{m.externalUserId}</span>} style={{ minWidth: '11rem' }} />
            <Column field="fullName" header={t('customer.name')} body={(m: SegmentMemberModel) => <span className="text-900">{m.fullName}</span>} style={{ minWidth: '12rem' }} />
            <Column field="tierCode" header={t('tier.code')} body={(m: SegmentMemberModel) => <Tag value={m.tierCode} />} style={{ minWidth: '7rem', textAlign: 'center' }} />
            <Column field="currentPoints" header={t('customer.available_points')} body={(m: SegmentMemberModel) => <span className="font-mono text-900">{Number(m.currentPoints || 0).toLocaleString()}</span>} style={{ minWidth: '9rem', textAlign: 'right' }} />
          </DataTable>
        )}
      </Dialog>
    </div>
  );
};

export default CustomerSegmentsPage;
