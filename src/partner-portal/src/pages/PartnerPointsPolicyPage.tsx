import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { AppBreadcrumb } from '@/components/AppBreadcrumb';
import { TenantSelector } from '@/components/TenantSelector';
import { ApprovalTargetType, CommonStatus } from '@/models';
import { LoyaltyService, PolicyRuleModel } from '@/service/loyalty.service';
import { StandardPageHeader } from '@/components/StandardPageHeader';
import { UniversalFilterBar } from '@/components/UniversalFilterBar';
import { StandardRowActions } from '@/components/StandardRowActions';
import { exportToExcel } from '@/components/exportHelper';

export const PartnerPointsPolicyPage: React.FC = () => {
  const { t } = useTranslation();
  const toast = useRef<Toast>(null);

  const [selectedTenant, setSelectedTenant] = useState<string>(
    () => localStorage.getItem('selected_tenant_id') || localStorage.getItem('tenant_id') || ''
  );
  const [policies, setPolicies] = useState<PolicyRuleModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
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
      toast.current?.show({
        severity: 'warn',
        summary: t('common.warn'),
        detail: t('partner_portal.policy_reason_required'),
      });
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
      toast.current?.show({
        severity: 'success',
        summary: t('common.success'),
        detail: t('partner_portal.policy_submitted'),
      });
      setEditTarget(null);
      setProposedReason('');
    } catch (err: any) {
      toast.current?.show({
        severity: 'error',
        summary: t('common.error'),
        detail: err?.response?.data?.message || err.message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPolicies = useMemo(() => {
    if (!keyword.trim()) return policies;
    const kw = keyword.toLowerCase();
    return policies.filter(
      (p) =>
        (p.policyCode && p.policyCode.toLowerCase().includes(kw)) ||
        (p.name && p.name.toLowerCase().includes(kw)) ||
        (p.partnerName && p.partnerName.toLowerCase().includes(kw))
    );
  }, [policies, keyword]);

  const handleExport = () => {
    exportToExcel(
      filteredPolicies,
      [
        { header: t('policy.code'), field: 'policyCode' },
        { header: t('policy.name'), field: 'name' },
        { header: t('policy.action_type'), field: 'type' },
        { header: t('policy.settlement_cycle'), field: 'settlementCycle' },
        { header: t('common.status'), field: 'status' },
      ],
      'chinh_sach_tich_diem_doi_tac'
    );
  };

  return (
    <div className="w-full">
      <Toast ref={toast} />
      <AppBreadcrumb items={[{ label: t('partner_portal.nav_policy') }]} />

      <StandardPageHeader
        title={t('partner_portal.policy_title')}
        subtitle={t('partner_portal.policy_subtitle')}
        extraLeft={<TenantSelector value={selectedTenant} onChange={setSelectedTenant} />}
        onRefresh={fetchPolicies}
        refreshLoading={loading}
      />

      <div className="card shadow-1 border-round surface-card p-4">
        <UniversalFilterBar
          keyword={keyword}
          onKeywordChange={setKeyword}
          searchPlaceholder={t('common.search')}
          onReset={() => setKeyword('')}
          onExport={handleExport}
        />

        {loading ? (
          <div className="flex flex-column gap-2 mt-3">
            <Skeleton height="2.75rem" />
            <Skeleton height="2.75rem" />
          </div>
        ) : (
          <DataTable<PolicyRuleModel[]>
            value={filteredPolicies}
            paginator
            rows={10}
            stripedRows
            responsiveLayout="scroll"
            emptyMessage={t('common.no_data')}
            className="mt-3"
          >
            <Column
              header={t('common.order_number', 'STT')}
              body={(_, opt) => opt.rowIndex + 1}
              style={{ width: '4rem', textAlign: 'center' }}
            />
            <Column
              header={t('common.action', 'Thao tác')}
              body={(r: PolicyRuleModel) => (
                <StandardRowActions
                  actions={[
                    {
                      icon: 'pi pi-send',
                      label: t('partner_portal.propose_change', 'Đề xuất đổi tỷ lệ'),
                      onClick: () => {
                        setEditTarget(r);
                        setProposedEarnRate(r.earnRatePercent ?? r.earnRate ?? 1);
                      },
                    },
                  ]}
                />
              )}
              style={{ width: '6rem', textAlign: 'center' }}
            />
            <Column
              field="policyCode"
              header={t('policy.code')}
              body={(r: PolicyRuleModel) => (
                <span className="font-bold font-mono text-900">
                  {r.policyCode || r.code || r.partnerCode}
                </span>
              )}
              style={{ minWidth: '11rem' }}
            />
            <Column
              field="partnerName"
              header={t('policy.name')}
              body={(r: PolicyRuleModel) => <span className="text-900">{r.name || r.partnerName}</span>}
              style={{ minWidth: '15rem' }}
            />
            <Column
              field="type"
              header={t('policy.action_type')}
              body={(r: PolicyRuleModel) => (
                <span className="text-900 text-sm">{r.type || 'EARN_BURN'}</span>
              )}
              style={{ minWidth: '10rem' }}
            />
            <Column
              header={t('policy.earn_rule')}
              body={(r: PolicyRuleModel) => (
                <span className="text-900 font-mono text-sm">
                  {Number(r.earnRatePercent ?? r.earnRate ?? 0)}% · Min{' '}
                  {Number(r.minBillAmount || 0).toLocaleString()}
                </span>
              )}
              style={{ minWidth: '12rem' }}
            />
            <Column
              field="settlementCycle"
              header={t('policy.settlement_cycle')}
              body={(r: PolicyRuleModel) => (
                <span className="text-900 font-mono text-sm">
                  {r.settlementCycle || 'MONTHLY'}
                </span>
              )}
              style={{ minWidth: '8rem', textAlign: 'center' }}
            />
            <Column
              field="status"
              header={t('common.status')}
              body={(r: PolicyRuleModel) => (
                <Tag
                  value={r.status}
                  severity={r.status === CommonStatus.ACTIVE ? 'success' : 'secondary'}
                />
              )}
              style={{ minWidth: '8rem', textAlign: 'center' }}
            />
          </DataTable>
        )}
      </div>

      <Dialog
        visible={!!editTarget}
        onHide={() => setEditTarget(null)}
        header={t('partner_portal.propose_change')}
        style={{ width: '32rem' }}
        modal
        className="p-fluid"
      >
        <div className="flex flex-column gap-3">
          <div className="field m-0">
            <label className="text-sm font-medium">{t('partner_portal.new_earn_rate')} (%) *</label>
            <InputNumber
              value={proposedEarnRate}
              onValueChange={(e) => setProposedEarnRate(e.value || 0)}
              min={0}
              max={50}
              minFractionDigits={1}
              maxFractionDigits={2}
            />
          </div>
          <div className="field m-0">
            <label className="text-sm font-medium">{t('common.reason')} *</label>
            <InputTextarea
              rows={3}
              value={proposedReason}
              onChange={(e) => setProposedReason(e.target.value)}
              placeholder="Lý do đề xuất điều chỉnh tỷ lệ tích điểm"
            />
          </div>
        </div>
        <div className="flex justify-content-end gap-2 mt-4">
          <Button label={t('common.cancel')} outlined onClick={() => setEditTarget(null)} />
          <Button
            label={t('common.save')}
            icon="pi pi-check"
            onClick={handleSubmitPolicyProposal}
            loading={submitting}
          />
        </div>
      </Dialog>
    </div>
  );
};

export default PartnerPointsPolicyPage;
