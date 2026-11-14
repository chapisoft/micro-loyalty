import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { AppBreadcrumb } from 'components';
import { TenantSelector } from '@/components/TenantSelector';
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

  return (
    <div>
      <Toast ref={toast} />
      <AppBreadcrumb items={[{ label: t('nav.approvals') }]} />

      <div className="card shadow-1 border-round surface-card p-4">
        <div className="flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
          <div>
            <h4 className="m-0 text-primary font-semibold">
              {t('approval.title')}
            </h4>
            <p className="m-0 text-xs text-500 mt-1">
              {t('approval.subtitle')}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 align-items-center">
            <TenantSelector value={selectedTenant} onChange={setSelectedTenant} />
            <Dropdown
              value={statusFilter}
              options={[
                { label: t('common.all'), value: 'ALL' },
                { label: ApprovalStatus.PENDING, value: ApprovalStatus.PENDING },
                { label: ApprovalStatus.APPROVED, value: ApprovalStatus.APPROVED },
                { label: ApprovalStatus.REJECTED, value: ApprovalStatus.REJECTED },
              ]}
              onChange={(e) => setStatusFilter(e.value)}
              className="w-12rem"
            />
            <Dropdown
              value={targetFilter}
              options={[
                { label: t('common.all'), value: 'ALL' },
                { label: ApprovalTargetType.POINT_ADJUSTMENT, value: ApprovalTargetType.POINT_ADJUSTMENT },
                { label: ApprovalTargetType.MEMBER_LOCK, value: ApprovalTargetType.MEMBER_LOCK },
                { label: ApprovalTargetType.POLICY, value: ApprovalTargetType.POLICY },
                { label: ApprovalTargetType.PROGRAM, value: ApprovalTargetType.PROGRAM },
                { label: ApprovalTargetType.PARTNER_PROPOSAL, value: ApprovalTargetType.PARTNER_PROPOSAL },
                { label: ApprovalTargetType.PAYMENT_BATCH, value: ApprovalTargetType.PAYMENT_BATCH },
                { label: ApprovalTargetType.SYSTEM_PARAM, value: ApprovalTargetType.SYSTEM_PARAM },
              ]}
              onChange={(e) => setTargetFilter(e.value)}
              className="w-13rem"
            />
            <Button icon="pi pi-refresh" outlined rounded onClick={fetchApprovals} loading={loading} />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-column gap-2"><Skeleton height="2.75rem" /><Skeleton height="2.75rem" /><Skeleton height="2.75rem" /></div>
        ) : (
          <DataTable<ApprovalRequestModel[]>
            value={items}
            paginator
            rows={15}
            stripedRows
            responsiveLayout="scroll"
            emptyMessage={t('approval.empty')}
          >
            <Column field="requestCode" header={t('approval.request_id')} body={(r) => <span className="font-mono white-space-nowrap font-medium text-primary">{r.requestCode || r.id}</span>} style={{ minWidth: '13rem' }} />
            <Column field="targetType" header={t('approval.target_type')} body={(r) => <Tag value={r.targetType} severity="info" />} style={{ minWidth: '11rem' }} />
            <Column field="actionType" header={t('approval.action_type')} body={(r) => <span className="font-mono text-xs">{r.actionType}</span>} style={{ minWidth: '10rem' }} />
            <Column field="targetId" header={t('approval.target_id')} body={(r) => <span className="font-mono white-space-nowrap">{r.targetId}</span>} style={{ minWidth: '11rem' }} />
            <Column field="makerUsername" header={t('approval.maker')} body={(r) => r.makerUsername || r.makerId || '--'} style={{ minWidth: '10rem' }} />
            <Column field="reason" header={t('common.reason')} style={{ minWidth: '14rem' }} />
            <Column field="status" header={t('common.status')} body={(r) => <Tag value={r.status} severity={statusSeverity(r.status)} />} style={{ minWidth: '8.5rem', textAlign: 'center' }} />
            <Column field="createdAt" header={t('common.created_at')} body={(r) => <span className="font-mono white-space-nowrap text-xs">{r.createdAt ? new Date(r.createdAt).toLocaleString('vi-VN') : '--'}</span>} style={{ minWidth: '11rem' }} />
            <Column
              header={t('common.action')}
              body={(r) => (
                <Button
                  label={r.status === ApprovalStatus.PENDING ? t('approval.review_btn') : t('common.detail')}
                  icon="pi pi-search"
                  size="small"
                  outlined
                  onClick={() => { setReviewItem(r); setDecisionNote(''); }}
                />
              )}
              style={{ minWidth: '9rem' }}
            />
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
              <div className="col-6"><span className="text-500 text-xs block">Maker</span><span>{reviewItem.makerUsername || reviewItem.makerId || '--'}</span></div>
              <div className="col-6"><span className="text-500 text-xs block">{t('common.status')}</span><Tag value={reviewItem.status} severity={statusSeverity(reviewItem.status)} /></div>
              <div className="col-12 mt-2"><span className="text-500 text-xs block">{t('approval.reason')}</span><span>{reviewItem.reason || '--'}</span></div>
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
