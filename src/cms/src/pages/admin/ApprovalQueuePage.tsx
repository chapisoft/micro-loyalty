import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { Skeleton } from 'primereact/skeleton';
import { useTranslation } from 'react-i18next';
import { StandardPageHeader } from '@/components/StandardPageHeader';
import { UniversalFilterBar } from '@/components/UniversalFilterBar';
import { StandardRowActions } from '@/components/StandardRowActions';
import { exportToExcel } from '@/components/exportHelper';
import { ApprovalStatus, ApprovalTargetType } from '@/models';
import { LoyaltyService, ApprovalRequestModel } from '@/service/loyalty.service';

export const ApprovalQueuePage: React.FC = () => {
  const { t } = useTranslation();
  const toast = useRef<Toast>(null);

  const [selectedTenant, setSelectedTenant] = useState<string>(
    () => localStorage.getItem('selected_tenant_id') || 'TENANT_NATCASH'
  );
  const [items, setItems] = useState<ApprovalRequestModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>(ApprovalStatus.PENDING);
  const [targetFilter, setTargetFilter] = useState<string>('ALL');
  const [reviewItem, setReviewItem] = useState<ApprovalRequestModel | null>(null);
  const [decisionNote, setDecisionNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');

  const fetchApprovals = useCallback(async () => {
    setLoading(true);
    try {
      const list = await LoyaltyService.getApprovals(
        {
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          targetType: targetFilter !== 'ALL' ? targetFilter : undefined,
        },
        selectedTenant
      );
      setItems(Array.isArray(list) ? list : []);
    } finally {
      setLoading(false);
    }
  }, [selectedTenant, statusFilter, targetFilter]);

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

  const handleApprove = async () => {
    if (!reviewItem) return;
    setSubmitting(true);
    try {
      await LoyaltyService.approveRequest(reviewItem.id, decisionNote.trim() || undefined, selectedTenant);
      toast.current?.show({
        severity: 'success',
        summary: t('approval.approved'),
        detail: `${reviewItem.requestCode || reviewItem.id}`,
      });
      setReviewItem(null);
      setDecisionNote('');
      fetchApprovals();
    } catch (err: any) {
      toast.current?.show({ severity: 'error', summary: t('common.error'), detail: err?.response?.data?.message || err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!reviewItem) return;
    if (!decisionNote.trim()) {
      toast.current?.show({
        severity: 'warn',
        summary: t('common.warn'),
        detail: t('approval.reject_reason_required'),
      });
      return;
    }
    setSubmitting(true);
    try {
      await LoyaltyService.rejectRequest(reviewItem.id, decisionNote.trim(), selectedTenant);
      toast.current?.show({
        severity: 'info',
        summary: t('approval.rejected'),
        detail: `${reviewItem.requestCode || reviewItem.id}`,
      });
      setReviewItem(null);
      setDecisionNote('');
      fetchApprovals();
    } catch (err: any) {
      toast.current?.show({ severity: 'error', summary: t('common.error'), detail: err?.response?.data?.message || err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const statusSeverity = (status: string) => {
    switch (status) {
      case ApprovalStatus.APPROVED:
        return 'success';
      case ApprovalStatus.REJECTED:
        return 'danger';
      default:
        return 'warning';
    }
  };

  const filteredItems = useMemo(() => {
    const q = searchKeyword.toLowerCase().trim();
    if (!q) return items;
    return items.filter(
      (item) =>
        (item.requestCode && item.requestCode.toLowerCase().includes(q)) ||
        (item.targetId && item.targetId.toLowerCase().includes(q)) ||
        (item.reason && item.reason.toLowerCase().includes(q)) ||
        (item.makerUsername && item.makerUsername.toLowerCase().includes(q))
    );
  }, [items, searchKeyword]);

  const handleExport = () => {
    exportToExcel(
      filteredItems.map((r, idx) => ({
        stt: idx + 1,
        requestCode: r.requestCode || r.id,
        targetType: r.targetType,
        actionType: r.actionType,
        targetId: r.targetId,
        maker: r.makerUsername || r.makerId || '--',
        reason: r.reason || '',
        status: r.status,
        createdAt: r.createdAt ? new Date(r.createdAt).toLocaleString('vi-VN') : '',
      })),
      [
        { key: 'stt', header: '#' },
        { key: 'requestCode', header: t('approval.request_id') },
        { key: 'targetType', header: t('approval.target_type') },
        { key: 'actionType', header: t('approval.action_type') },
        { key: 'targetId', header: t('approval.target_id') },
        { key: 'maker', header: t('approval.maker') },
        { key: 'reason', header: t('common.reason') },
        { key: 'status', header: t('common.status') },
        { key: 'createdAt', header: t('common.created_at') },
      ],
      `Danh_Sach_Phe_Duyet_${selectedTenant}`
    );
  };

  return (
    <div className="w-full">
      <Toast ref={toast} />
      <StandardPageHeader
        title={t('nav.approvals')}
        subtitle={t('approval.subtitle', 'Danh sách yêu cầu điều chỉnh điểm, khóa tài khoản và chính sách chờ phê duyệt')}
        breadcrumbs={[{ label: t('nav.approvals') }]}
        tenantValue={selectedTenant}
        onTenantChange={setSelectedTenant}
      />

      <div className="card shadow-1 border-round surface-card p-3 w-full">
        <UniversalFilterBar
          searchValue={searchKeyword}
          onSearchChange={setSearchKeyword}
          searchPlaceholder={t('common.search')}
          basicFilters={[
            {
              key: 'status',
              label: t('common.status'),
              value: statusFilter,
              options: [
                { label: t('common.all'), value: 'ALL' },
                { label: ApprovalStatus.PENDING, value: ApprovalStatus.PENDING },
                { label: ApprovalStatus.APPROVED, value: ApprovalStatus.APPROVED },
                { label: ApprovalStatus.REJECTED, value: ApprovalStatus.REJECTED },
              ],
              onChange: (val) => setStatusFilter(val),
              placeholder: t('common.status'),
            },
            {
              key: 'targetType',
              label: t('approval.target_type'),
              value: targetFilter,
              options: [
                { label: t('common.all'), value: 'ALL' },
                { label: ApprovalTargetType.POINT_ADJUSTMENT, value: ApprovalTargetType.POINT_ADJUSTMENT },
                { label: ApprovalTargetType.MEMBER_LOCK, value: ApprovalTargetType.MEMBER_LOCK },
                { label: ApprovalTargetType.POLICY, value: ApprovalTargetType.POLICY },
                { label: ApprovalTargetType.PROGRAM, value: ApprovalTargetType.PROGRAM },
                { label: ApprovalTargetType.PARTNER_PROPOSAL, value: ApprovalTargetType.PARTNER_PROPOSAL },
                { label: ApprovalTargetType.PAYMENT_BATCH, value: ApprovalTargetType.PAYMENT_BATCH },
                { label: ApprovalTargetType.SYSTEM_PARAM, value: ApprovalTargetType.SYSTEM_PARAM },
              ],
              onChange: (val) => setTargetFilter(val),
              placeholder: t('approval.target_type'),
            },
          ]}
          onExport={handleExport}
          onReset={() => {
            setSearchKeyword('');
            setStatusFilter(ApprovalStatus.PENDING);
            setTargetFilter('ALL');
          }}
          onRefresh={fetchApprovals}
        />

        {loading ? (
          <div className="flex flex-column gap-2"><Skeleton height="2.75rem" /><Skeleton height="2.75rem" /><Skeleton height="2.75rem" /></div>
        ) : (
          <DataTable<ApprovalRequestModel[]>
            value={filteredItems}
            paginator
            rows={15}
            rowsPerPageOptions={[15, 30, 50]}
            stripedRows
            responsiveLayout="scroll"
            emptyMessage={t('approval.empty')}
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
              body={(r) => (
                <StandardRowActions
                  onView={() => { setReviewItem(r); setDecisionNote(''); }}
                />
              )}
              style={{ width: '6rem', textAlign: 'center' }}
            />
            <Column field="requestCode" header={t('approval.request_id')} body={(r) => <span className="font-bold font-mono text-900">{r.requestCode || r.id}</span>} sortable style={{ minWidth: '13rem' }} />
            <Column field="targetType" header={t('approval.target_type')} body={(r) => <span className="text-900">{r.targetType}</span>} sortable style={{ minWidth: '11rem' }} />
            <Column field="actionType" header={t('approval.action_type')} body={(r) => <span className="text-900 font-mono text-xs">{r.actionType}</span>} sortable style={{ minWidth: '10rem' }} />
            <Column field="targetId" header={t('approval.target_id')} body={(r) => <span className="text-900 font-mono">{r.targetId}</span>} style={{ minWidth: '11rem' }} />
            <Column field="makerUsername" header={t('approval.maker')} body={(r) => <span className="text-900">{r.makerUsername || r.makerId || '--'}</span>} style={{ minWidth: '10rem' }} />
            <Column field="reason" header={t('common.reason')} body={(r) => <span className="text-900">{r.reason}</span>} style={{ minWidth: '14rem' }} />
            <Column field="createdAt" header={t('common.created_at')} body={(r) => <span className="text-900 font-mono text-xs">{r.createdAt ? new Date(r.createdAt).toLocaleString('vi-VN') : '--'}</span>} sortable style={{ minWidth: '11rem' }} />
            <Column field="status" header={t('common.status')} body={(r) => <Tag value={r.status} severity={statusSeverity(r.status)} />} sortable style={{ minWidth: '8.5rem', textAlign: 'center' }} />
          </DataTable>
        )}
      </div>

      <Dialog
        visible={!!reviewItem}
        onHide={() => setReviewItem(null)}
        header={reviewItem ? `${t('approval.dialog_title')} · ${reviewItem.requestCode || reviewItem.id}` : ''}
        style={{ width: '48rem' }}
        breakpoints={{ '641px': '95vw' }}
        modal
      >
        {reviewItem && (
          <div className="flex flex-column gap-3">
            <div className="grid text-sm">
              <div className="col-6"><span className="text-500 text-xs block">Maker</span><span className="text-900">{reviewItem.makerUsername || reviewItem.makerId || '--'}</span></div>
              <div className="col-6"><span className="text-500 text-xs block">{t('common.status')}</span><Tag value={reviewItem.status} severity={statusSeverity(reviewItem.status)} /></div>
              <div className="col-12 mt-2"><span className="text-500 text-xs block">{t('approval.reason')}</span><span className="text-900">{reviewItem.reason || '--'}</span></div>
            </div>

            <div className="grid">
              <div className="col-12 md:col-6">
                <div className="text-xs font-medium text-500 mb-1">{t('approval.payload_before')}</div>
                <pre className="m-0 p-2 border-round surface-50 border-1 surface-border text-xs font-mono overflow-auto" style={{ maxHeight: '14rem' }}>
                  {JSON.stringify(reviewItem.payloadBefore || {}, null, 2)}
                </pre>
              </div>
              <div className="col-12 md:col-6">
                <div className="text-xs font-medium text-500 mb-1">{t('approval.payload_after')}</div>
                <pre className="m-0 p-2 border-round bg-green-50 border-1 border-green-200 text-xs font-mono overflow-auto" style={{ maxHeight: '14rem' }}>
                  {JSON.stringify(reviewItem.payloadAfter || {}, null, 2)}
                </pre>
              </div>
            </div>

            {reviewItem.status === ApprovalStatus.PENDING && (
              <div className="flex flex-column gap-2">
                <label className="text-sm font-medium">{t('approval.checker_note')}</label>
                <InputTextarea rows={2} value={decisionNote} onChange={(e) => setDecisionNote(e.target.value)} className="w-full" />
              </div>
            )}

            <div className="flex justify-content-end gap-2 mt-2">
              <Button label={t('common.close')} outlined onClick={() => setReviewItem(null)} />
              {reviewItem.status === ApprovalStatus.PENDING && (
                <>
                  <Button label={t('approval.reject_btn')} icon="pi pi-times" severity="danger" outlined onClick={handleReject} loading={submitting} />
                  <Button label={t('approval.approve_btn')} icon="pi pi-check" severity="success" onClick={handleApprove} loading={submitting} />
                </>
              )}
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};

export default ApprovalQueuePage;
