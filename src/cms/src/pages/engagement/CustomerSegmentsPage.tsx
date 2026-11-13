import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { Skeleton } from 'primereact/skeleton';
import { useTranslation } from 'react-i18next';
import { AppBreadcrumb } from 'components';
import { TenantSelector } from '@/components/TenantSelector';
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
  const [recalcId, setRecalcId] = useState<number | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<CustomerSegmentModel | null>(null);
  const [members, setMembers] = useState<SegmentMemberModel[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

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
      toast.current?.show({ severity: 'success', summary: t('common.success', { defaultValue: 'Thành công' }), detail: `${t('segment.recalculated', { defaultValue: 'Đã tính toán lại phân khúc' })} ${seg.segmentCode}` });
      fetchSegments();
    } catch (err: any) {
      toast.current?.show({ severity: 'error', summary: t('common.error', { defaultValue: 'Lỗi' }), detail: err?.response?.data?.message || err.message });
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

  const handleExportCsv = () => {
    if (!selectedSegment || members.length === 0) return;
    const ws = XLSX.utils.json_to_sheet(members);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Members');
    XLSX.writeFile(wb, `segment_${selectedSegment.segmentCode}_${selectedTenant}.csv`);
  };

  return (
    <div>
      <Toast ref={toast} />
      <AppBreadcrumb items={[{ label: t('nav.segments', { defaultValue: 'Phân khúc Khách hàng (CN-03)' }) }]} />

      <div className="card shadow-1 border-round surface-card p-4">
        <div className="flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
          <div>
            <h4 className="m-0 text-primary font-semibold">
              {t('segment.title', { defaultValue: '7 Phân khúc Hội viên Động (CN-03)' })}
            </h4>
            <p className="m-0 text-xs text-500 mt-1">
              {t('segment.subtitle', { defaultValue: 'VIP, NEW_30D, AT_RISK, CHURN_90D, HIGH_FREQUENCY, GAME_LOVERS, VOUCHER_HUNTERS — tự động đồng bộ với kịch bản gợi nhắc.' })}
            </p>
          </div>
          <div className="flex gap-2 align-items-center">
            <TenantSelector value={selectedTenant} onChange={setSelectedTenant} />
            <Button icon="pi pi-refresh" outlined rounded onClick={fetchSegments} loading={loading} />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-column gap-2"><Skeleton height="2.75rem" /><Skeleton height="2.75rem" /><Skeleton height="2.75rem" /></div>
        ) : (
          <DataTable<CustomerSegmentModel[]>
            value={segments}
            paginator
            rows={10}
            stripedRows
            responsiveLayout="scroll"
            emptyMessage={t('segment.empty', { defaultValue: 'Chưa có dữ liệu phân khúc hội viên trong liên minh này.' })}
          >
            <Column field="segmentCode" header={t('segment.code', { defaultValue: 'Mã Phân Khúc' })} body={(r: CustomerSegmentModel) => <Tag value={r.segmentCode} severity="info" className="font-mono" />} style={{ minWidth: '11rem' }} />
            <Column field="segmentName" header={t('segment.name', { defaultValue: 'Tên Phân Khúc' })} style={{ minWidth: '14rem' }} />
            <Column field="ruleSummary" header={t('segment.rule_expr', { defaultValue: 'Điều Kiện Lọc' })} body={(r: CustomerSegmentModel) => <span className="font-mono text-xs text-600">{r.ruleSummary || '--'}</span>} style={{ minWidth: '16rem' }} />
            <Column field="memberCount" header={t('segment.member_count', { defaultValue: 'Số Hội Viên' })} body={(r: CustomerSegmentModel) => <span className="font-mono font-medium">{Number(r.memberCount || 0).toLocaleString()}</span>} style={{ minWidth: '8.5rem', textAlign: 'right' }} />
            <Column field="lastCalculatedAt" header={t('segment.last_computed', { defaultValue: 'Cập Nhật Lần Cuối' })} body={(r: CustomerSegmentModel) => <span className="font-mono white-space-nowrap text-xs">{r.lastCalculatedAt ? new Date(r.lastCalculatedAt).toLocaleString('vi-VN') : '--'}</span>} style={{ minWidth: '11rem' }} />
            <Column
              header={t('common.action', { defaultValue: 'Thao Tác' })}
              body={(r: CustomerSegmentModel) => (
                <div className="flex gap-1">
                  <Button icon="pi pi-users" label={t('segment.view_members', { defaultValue: 'Hội viên' })} size="small" outlined onClick={() => openMembers(r)} />
                  <Button icon="pi pi-sync" label={t('segment.recalculate', { defaultValue: 'Tính lại' })} size="small" outlined severity="warning" loading={recalcId === r.id} onClick={() => handleRecalculate(r)} />
                </div>
              )}
              style={{ minWidth: '13rem' }}
            />
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
          <span className="text-sm text-600">{t('segment.members_preview', { defaultValue: 'Danh sách hội viên thuộc phân khúc' })}</span>
          <Button icon="pi pi-download" label={t('common.export_csv', { defaultValue: 'Xuất CSV' })} size="small" outlined onClick={handleExportCsv} disabled={members.length === 0} />
        </div>
        {membersLoading ? (
          <div className="flex flex-column gap-2"><Skeleton height="2.2rem" /><Skeleton height="2.2rem" /></div>
        ) : (
          <DataTable<SegmentMemberModel[]> value={members} paginator rows={10} size="small" emptyMessage={t('common.no_data', { defaultValue: 'Chưa có hội viên nào trong phân khúc này.' })}>
            <Column field="externalUserId" header={t('customer.phone', { defaultValue: 'SĐT / User ID' })} body={(m: SegmentMemberModel) => <span className="font-mono white-space-nowrap">{m.externalUserId}</span>} style={{ minWidth: '11rem' }} />
            <Column field="fullName" header={t('customer.name', { defaultValue: 'Họ Tên' })} style={{ minWidth: '12rem' }} />
            <Column field="tierCode" header={t('tier.code', { defaultValue: 'Hạng' })} body={(m: SegmentMemberModel) => <Tag value={m.tierCode} />} style={{ minWidth: '7rem' }} />
            <Column field="currentPoints" header={t('customer.available_points', { defaultValue: 'Điểm Khả Dụng' })} body={(m: SegmentMemberModel) => <span className="font-mono">{Number(m.currentPoints || 0).toLocaleString()}</span>} style={{ minWidth: '9rem', textAlign: 'right' }} />
          </DataTable>
        )}
      </Dialog>
    </div>
  );
};

export default CustomerSegmentsPage;
