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
import { LoyaltyService, PartnerProgramProposalModel } from '@/service/loyalty.service';

export const PartnerProgramProposalPage: React.FC = () => {
  const { t } = useTranslation();
  const toast = useRef<Toast>(null);

  const [selectedTenant, setSelectedTenant] = useState<string>(
    () => localStorage.getItem('selected_tenant_id') || 'TENANT_NATCASH'
  );
  const [proposals, setProposals] = useState<PartnerProgramProposalModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<PartnerProgramProposalModel>>({});

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
    const today = new Date().toISOString().slice(0, 10);
    setFormData({
      fundingType: 'CO_FUNDED_CAMPAIGN',
      programName: '',
      description: '',
      proposedBudget: 0,
      natcashCoFundPercent: 50,
      earnRateBoostPercent: 10,
      startDate: today,
      endDate: today,
    });
    setShowDialog(true);
  };

  const handleSubmit = async () => {
    if (!formData.programName?.trim()) {
      toast.current?.show({ severity: 'warn', summary: t('common.warn', { defaultValue: 'Thiếu thông tin' }), detail: t('partner_portal.proposal_title_required', { defaultValue: 'Vui lòng nhập Tiêu đề Đề xuất.' }) });
      return;
    }
    setSubmitting(true);
    try {
      await LoyaltyService.createPartnerProposal(formData as PartnerProgramProposalModel, selectedTenant);
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
          <DataTable<PartnerProgramProposalModel[]> value={proposals} paginator rows={10} stripedRows responsiveLayout="scroll" emptyMessage={t('common.no_data', { defaultValue: 'Chưa có đề xuất chương trình nào.' })}>
            <Column field="proposalCode" header={t('partner_portal.proposal_code', { defaultValue: 'Mã Đề Xuất' })} body={(r: PartnerProgramProposalModel) => <span className="font-mono white-space-nowrap font-medium text-primary">{r.proposalCode || '--'}</span>} style={{ minWidth: '11rem' }} />
            <Column field="fundingType" header={t('partner_portal.proposal_type', { defaultValue: 'Hình Thức Tài Trợ' })} body={(r: PartnerProgramProposalModel) => <Tag value={r.fundingType} severity="info" />} style={{ minWidth: '11rem' }} />
            <Column field="programName" header={t('partner_portal.proposal_name', { defaultValue: 'Tên Chương Trình' })} style={{ minWidth: '16rem' }} />
            <Column field="proposedBudget" header={t('budget.cap', { defaultValue: 'Ngân Sách Đề Xuất' })} body={(r: PartnerProgramProposalModel) => <span className="font-mono">{Number(r.proposedBudget || 0).toLocaleString()} HTG</span>} style={{ minWidth: '10rem', textAlign: 'right' }} />
            <Column field="natcashCoFundPercent" header={t('partner_portal.cofund_ratio', { defaultValue: 'Natcash Đồng Tài Trợ' })} body={(r: PartnerProgramProposalModel) => `${r.natcashCoFundPercent || 0}%`} style={{ minWidth: '9rem', textAlign: 'center' }} />
            <Column field="status" header={t('common.status', { defaultValue: 'Trạng Thái' })} body={(r: PartnerProgramProposalModel) => <Tag value={r.status || ProposalStatus.PENDING_APPROVAL} severity={r.status === ProposalStatus.APPROVED ? 'success' : r.status === ProposalStatus.REJECTED ? 'danger' : 'warning'} />} style={{ minWidth: '8.5rem', textAlign: 'center' }} />
          </DataTable>
        )}
      </div>

      <Dialog visible={showDialog} onHide={() => setShowDialog(false)} header={t('partner_portal.create_proposal', { defaultValue: 'Tạo Đề xuất Chương trình Đồng tài trợ' })} style={{ width: '38rem' }} modal className="p-fluid">
        <div className="flex flex-column gap-3">
          <div className="field m-0">
            <label className="text-sm font-medium">{t('partner_portal.proposal_type', { defaultValue: 'Loại Đề Xuất' })}</label>
            <Dropdown value={formData.fundingType} options={[{ label: 'CO_FUNDED_CAMPAIGN', value: 'CO_FUNDED_CAMPAIGN' }, { label: 'VOUCHER_SUPPLY', value: 'VOUCHER_SUPPLY' }, { label: 'TIER_PERK', value: 'TIER_PERK' }]} onChange={(e) => setFormData({ ...formData, fundingType: e.value })} appendTo="self" />
          </div>
          <div className="field m-0">
            <label className="text-sm font-medium">{t('partner_portal.proposal_name', { defaultValue: 'Tên Chương Trình' })} *</label>
            <InputText value={formData.programName || ''} onChange={(e) => setFormData({ ...formData, programName: e.target.value })} />
          </div>
          <div className="grid">
            <div className="col-6 field m-0">
              <label className="text-sm font-medium">{t('budget.cap', { defaultValue: 'Ngân sách dự kiến (HTG)' })}</label>
              <InputNumber value={formData.proposedBudget ?? 0} onValueChange={(e) => setFormData({ ...formData, proposedBudget: e.value || 0 })} min={0} />
            </div>
            <div className="col-6 field m-0">
              <label className="text-sm font-medium">{t('partner_portal.cofund_ratio', { defaultValue: 'Natcash đồng tài trợ (%)' })}</label>
              <InputNumber value={formData.natcashCoFundPercent ?? 50} onValueChange={(e) => setFormData({ ...formData, natcashCoFundPercent: e.value || 0 })} min={0} max={100} suffix="%" />
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
