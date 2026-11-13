import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputNumber } from 'primereact/inputnumber';
import { InputTextarea } from 'primereact/inputtextarea';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { Skeleton } from 'primereact/skeleton';
import { useTranslation } from 'react-i18next';
import { AppBreadcrumb } from 'components';
import { TenantSelector } from '@/components/TenantSelector';
import { ApprovalTargetType } from '@/models';
import { LoyaltyService, PolicyRuleModel } from '@/service/loyalty.service';

export const PartnerPointsPolicyPage: React.FC = () => {
  const { t } = useTranslation();
  const toast = useRef<Toast>(null);

  const [selectedTenant, setSelectedTenant] = useState<string>(
    () => localStorage.getItem('selected_tenant_id') || 'TENANT_NATCASH'
  );
  const [policies, setPolicies] = useState<PolicyRuleModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [editTarget, setEditTarget] = useState<PolicyRuleModel | null>(null);
  const [proposedEarnRate, setProposedEarnRate] = useState<number>(1);
  const [proposedReason, setProposedReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchPolicies = useCallback(async () => {
    setLoading(true);
    try {
      const list = await LoyaltyService.getPolicies(selectedTenant);
      setPolicies(Array.isArray(list) ? list : []);
    } finally {
      setLoading(false);
    }
  }, [selectedTenant]);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  const handleSubmitPolicyProposal = async () => {
    if (!editTarget || !proposedReason.trim()) {
      toast.current?.show({ severity: 'warn', summary: t('common.warn', { defaultValue: 'Thiếu lý do' }), detail: t('partner_portal.policy_reason_required', { defaultValue: 'Nhập lý do đề xuất thay đổi tỷ lệ tích điểm.' }) });
      return;
    }
    setSubmitting(true);
    try {
      await LoyaltyService.createApprovalRequest(
        {
          targetType: ApprovalTargetType.POLICY,
          actionType: 'UPDATE_PARTNER_EARN_RATE',
          targetId: String(editTarget.id || editTarget.policyCode || editTarget.code),
          reason: proposedReason.trim(),
          payloadBefore: { earnRatePercent: editTarget.earnRatePercent ?? editTarget.earnRate },
          payloadAfter: { earnRatePercent: proposedEarnRate },
        },
        selectedTenant
      );
      toast.current?.show({ severity: 'success', summary: t('common.success', { defaultValue: 'Đã gửi duyệt' }), detail: t('partner_portal.policy_submitted', { defaultValue: 'Đề xuất điều chỉnh chính sách đã chuyển tới hàng đợi duyệt 2 lớp.' }) });
      setEditTarget(null);
      setProposedReason('');
    } catch (err: any) {
      toast.current?.show({ severity: 'error', summary: t('common.error', { defaultValue: 'Lỗi' }), detail: err?.response?.data?.message || err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Toast ref={toast} />
      <AppBreadcrumb items={[{ label: t('partner_portal.nav_policy', { defaultValue: 'Partner Portal · Chính sách Điểm (LM-09)' }) }]} />

      <div className="card shadow-1 border-round surface-card p-4">
        <div className="flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
          <div>
            <h4 className="m-0 text-primary font-semibold">{t('partner_portal.policy_title', { defaultValue: 'Chính sách Tích & Tiêu điểm của Đối tác (LM-09)' })}</h4>
            <p className="m-0 text-xs text-500 mt-1">{t('partner_portal.policy_subtitle', { defaultValue: 'Xem tỷ lệ quy đổi điểm đang hiệu lực và gửi yêu cầu điều chỉnh qua phê duyệt 2 lớp.' })}</p>
          </div>
          <div className="flex gap-2 align-items-center">
            <TenantSelector value={selectedTenant} onChange={setSelectedTenant} />
            <Button icon="pi pi-refresh" outlined rounded onClick={fetchPolicies} loading={loading} />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-column gap-2"><Skeleton height="2.75rem" /><Skeleton height="2.75rem" /></div>
        ) : (
          <DataTable<PolicyRuleModel[]> value={policies} paginator rows={10} stripedRows responsiveLayout="scroll" emptyMessage={t('common.no_data', { defaultValue: 'Chưa có chính sách tích điểm áp dụng.' })}>
            <Column field="policyCode" header={t('policy.code', { defaultValue: 'Mã Chính Sách' })} body={(r: PolicyRuleModel) => <span className="font-mono white-space-nowrap font-medium text-primary">{r.policyCode || r.code || r.partnerCode}</span>} style={{ minWidth: '11rem' }} />
            <Column field="partnerName" header={t('policy.name', { defaultValue: 'Đối Tác / Chính Sách' })} body={(r: PolicyRuleModel) => r.name || r.partnerName} style={{ minWidth: '15rem' }} />
            <Column field="type" header={t('policy.action_type', { defaultValue: 'Loại Giao Dịch' })} body={(r: PolicyRuleModel) => <Tag value={r.type || 'EARN_BURN'} severity="info" />} style={{ minWidth: '10rem' }} />
            <Column header={t('policy.earn_rule', { defaultValue: 'Tỷ Lệ Tích (%)' })} body={(r: PolicyRuleModel) => <span className="font-mono">{Number(r.earnRatePercent ?? r.earnRate ?? 0)}% · Min {Number(r.minBillAmount || 0).toLocaleString()}</span>} style={{ minWidth: '12rem' }} />
            <Column field="settlementCycle" header={t('policy.settlement_cycle', { defaultValue: 'Chu Kỳ' })} body={(r: PolicyRuleModel) => r.settlementCycle || 'MONTHLY'} style={{ minWidth: '8rem' }} />
            <Column field="status" header={t('common.status', { defaultValue: 'Trạng Thái' })} body={(r: PolicyRuleModel) => <Tag value={r.status} severity={r.status === 'ACTIVE' ? 'success' : 'secondary'} />} style={{ minWidth: '8rem' }} />
            <Column header={t('common.action', { defaultValue: 'Đề Xuất Sửa' })} body={(r: PolicyRuleModel) => <Button icon="pi pi-send" label={t('partner_portal.propose_change', { defaultValue: 'Đề xuất' })} size="small" outlined onClick={() => { setEditTarget(r); setProposedEarnRate(r.earnRatePercent ?? r.earnRate ?? 1); }} />} style={{ minWidth: '9rem' }} />
          </DataTable>
        )}
      </div>

      <Dialog visible={!!editTarget} onHide={() => setEditTarget(null)} header={editTarget ? `${t('partner_portal.propose_policy', { defaultValue: 'Đề xuất điều chỉnh Chính sách' })} · ${editTarget.policyCode}` : ''} style={{ width: '34rem' }} modal className="p-fluid">
        {editTarget && (
          <div className="flex flex-column gap-3">
            <div className="field m-0">
              <label className="text-sm font-medium">{t('partner_portal.proposed_earn_amount', { defaultValue: 'Ngưỡng tiền quy đổi mới (HTG / điểm)' })}</label>
              <InputNumber value={proposedEarnRate} onValueChange={(e) => setProposedEarnRate(e.value || 1)} min={1} />
            </div>
            <div className="field m-0">
              <label className="text-sm font-medium">{t('common.reason', { defaultValue: 'Lý do đề xuất' })} *</label>
              <InputTextarea rows={3} value={proposedReason} onChange={(e) => setProposedReason(e.target.value)} />
            </div>
          </div>
        )}
        <div className="flex justify-content-end gap-2 mt-4">
          <Button label={t('common.cancel', { defaultValue: 'Hủy' })} outlined onClick={() => setEditTarget(null)} />
          <Button label={t('partner_portal.submit_approval', { defaultValue: 'Gửi duyệt 2 lớp' })} icon="pi pi-check" onClick={handleSubmitPolicyProposal} loading={submitting} />
        </div>
      </Dialog>
    </div>
  );
};

export default PartnerPointsPolicyPage;
