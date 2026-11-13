import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { Skeleton } from 'primereact/skeleton';
import { useTranslation } from 'react-i18next';
import { AppBreadcrumb } from 'components';
import { TenantSelector } from '@/components/TenantSelector';
import { ProposalStatus } from '@/models';
import { LoyaltyService, PartnerProposalModel } from '@/service/loyalty.service';

export const PartnerProgramProposalPage: React.FC = () => {
  const { t } = useTranslation();
  const toast = useRef<Toast>(null);

  const [selectedTenant, setSelectedTenant] = useState<string>(
    () => localStorage.getItem('selected_tenant_id') || 'TENANT_NATCASH'
  );
  const [proposals, setProposals] = useState<PartnerProposalModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<PartnerProposalModel>>({});

  const fetchProposals = useCallback(async () => {
    setLoading(true);
    try {
      const list = await LoyaltyService.getPartnerProposals(selectedTenant);
      setProposals(Array.isArray(list) ? list : []);
    } finally {
      setLoading(false);
    }
  }, [selectedTenant]);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  const openNew = () => {
    setFormData({
      proposalType: 'CO_FUNDED_CAMPAIGN',
      title: '',
      description: '',
      proposedBudgetAmount: 0,
      coFundRatioPercent: 50,
    });
    setShowDialog(true);
  };

  const handleSubmit = async () => {
    if (!formData.title?.trim()) {
      toast.current?.show({ severity: 'warn', summary: t('common.warn', { defaultValue: 'Thiếu thông tin' }), detail: t('partner_portal.proposal_title_required', { defaultValue: 'Vui lòng nhập Tiêu đề Đề xuất.' }) });
      return;
    }
    setSubmitting(true);
    try {
      await LoyaltyService.createPartnerProposal(formData as PartnerProposalModel, selectedTenant);
      toast.current?.show({ severity: 'success', summary: t('common.success', { defaultValue: 'Đã gửi đề xuất' }), detail: t('partner_portal.proposal_submitted', { defaultValue: 'Đề xuất đồng tài trợ đã được gửi tới Ban vận hành Loyalty.' }) });
      setShowDialog(false);
      fetchProposals();
    } catch (err: any) {
      toast.current?.show({ severity: 'error', summary: t('common.error', { defaultValue: 'Lỗi' }), detail: err?.response?.data?.message || err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Toast ref={toast} />
      <AppBreadcrumb items={[{ label: t('partner_portal.nav_proposals', { defaultValue: 'Partner Portal · Đề xuất Chương trình (NV-07)' }) }]} />

      <div className="card shadow-1 border-round surface-card p-4">
        <div className="flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
          <div>
            <h4 className="m-0 text-primary font-semibold">{t('partner_portal.proposals_title', { defaultValue: 'Đề xuất Chiến dịch & Voucher Đồng tài trợ (NV-07)' })}</h4>
            <p className="m-0 text-xs text-500 mt-1">{t('partner_portal.proposals_subtitle', { defaultValue: 'Gửi đề xuất chiến dịch khuyến mãi liên minh và theo dõi trạng thái phê duyệt.' })}</p>
          </div>
          <div className="flex gap-2 align-items-center">
            <TenantSelector value={selectedTenant} onChange={setSelectedTenant} />
            <Button label={t('partner_portal.create_proposal', { defaultValue: 'Gửi Đề xuất mới' })} icon="pi pi-plus" severity="success" size="small" onClick={openNew} />
            <Button icon="pi pi-refresh" outlined rounded onClick={fetchProposals} loading={loading} />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-column gap-2"><Skeleton height="2.75rem" /><Skeleton height="2.75rem" /></div>
        ) : (
          <DataTable<PartnerProposalModel> value={proposals} paginator rows={10} stripedRows responsiveLayout="scroll" emptyMessage={t('common.no_data', { defaultValue: 'Chưa có đề xuất chương trình nào.' })}>
            <Column field="proposalCode" header={t('partner_portal.proposal_code', { defaultValue: 'Mã Đề Xuất' })} body={(r) => <span className="font-mono white-space-nowrap font-medium text-primary">{r.proposalCode || '--'}</span>} style={{ minWidth: '11rem' }} />
            <Column field="proposalType" header={t('partner_portal.proposal_type', { defaultValue: 'Loại Đề Xuất' })} body={(r) => <Tag value={r.proposalType} severity="info" />} style={{ minWidth: '11rem' }} />
            <Column field="title" header={t('partner_portal.proposal_name', { defaultValue: 'Tiêu Đề' })} style={{ minWidth: '16rem' }} />
            <Column field="proposedBudgetAmount" header={t('budget.cap', { defaultValue: 'Ngân Sách Đề Xuất' })} body={(r) => <span className="font-mono">{Number(r.proposedBudgetAmount || 0).toLocaleString()} HTG</span>} style={{ minWidth: '10rem', textAlign: 'right' }} />
            <Column field="coFundRatioPercent" header={t('partner_portal.cofund_ratio', { defaultValue: 'Tỷ Lệ Đồng Tài Trợ' })} body={(r) => `${r.coFundRatioPercent || 0}%`} style={{ minWidth: '9rem', textAlign: 'center' }} />
            <Column field="status" header={t('common.status', { defaultValue: 'Trạng Thái' })} body={(r) => <Tag value={r.status || ProposalStatus.SUBMITTED} severity={r.status === ProposalStatus.APPROVED ? 'success' : r.status === ProposalStatus.REJECTED ? 'danger' : 'warning'} />} style={{ minWidth: '8.5rem', textAlign: 'center' }} />
            <Column field="reviewerNote" header={t('approval.checker_note', { defaultValue: 'Phản Hồi' })} style={{ minWidth: '13rem' }} />
          </DataTable>
        )}
      </div>

      <Dialog visible={showDialog} onHide={() => setShowDialog(false)} header={t('partner_portal.create_proposal', { defaultValue: 'Tạo Đề xuất Chương trình Đồng tài trợ' })} style={{ width: '38rem' }} modal className="p-fluid">
        <div className="flex flex-column gap-3">
          <div className="field m-0">
            <label className="text-sm font-medium">{t('partner_portal.proposal_type', { defaultValue: 'Loại Đề Xuất' })}</label>
            <Dropdown value={formData.proposalType} options={[{ label: 'CO_FUNDED_CAMPAIGN', value: 'CO_FUNDED_CAMPAIGN' }, { label: 'VOUCHER_SUPPLY', value: 'VOUCHER_SUPPLY' }, { label: 'TIER_PERK', value: 'TIER_PERK' }]} onChange={(e) => setFormData({ ...formData, proposalType: e.value })} appendTo="self" />
          </div>
          <div className="field m-0">
            <label className="text-sm font-medium">{t('partner_portal.proposal_name', { defaultValue: 'Tiêu Đề Đề Xuất' })} *</label>
            <InputText value={formData.title || ''} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
          </div>
          <div className="grid">
            <div className="col-6 field m-0">
              <label className="text-sm font-medium">{t('budget.cap', { defaultValue: 'Ngân sách dự kiến (HTG)' })}</label>
              <InputNumber value={formData.proposedBudgetAmount ?? 0} onValueChange={(e) => setFormData({ ...formData, proposedBudgetAmount: e.value || 0 })} min={0} />
            </div>
            <div className="col-6 field m-0">
              <label className="text-sm font-medium">{t('partner_portal.cofund_ratio', { defaultValue: 'Đối tác góp (%)' })}</label>
              <InputNumber value={formData.coFundRatioPercent ?? 50} onValueChange={(e) => setFormData({ ...formData, coFundRatioPercent: e.value || 0 })} min={0} max={100} suffix="%" />
            </div>
          </div>
          <div className="field m-0">
            <label className="text-sm font-medium">{t('common.description', { defaultValue: 'Mô tả thể lệ chi tiết' })}</label>
            <InputTextarea rows={3} value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
          </div>
        </div>
        <div className="flex justify-content-end gap-2 mt-4">
          <Button label={t('common.cancel', { defaultValue: 'Hủy' })} outlined onClick={() => setShowDialog(false)} />
          <Button label={t('partner_portal.submit_proposal', { defaultValue: 'Gửi Đề xuất' })} icon="pi pi-send" onClick={handleSubmit} loading={submitting} />
        </div>
      </Dialog>
    </div>
  );
};

export default PartnerProgramProposalPage;
