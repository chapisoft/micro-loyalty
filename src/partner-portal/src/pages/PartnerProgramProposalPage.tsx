import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { AppBreadcrumb } from '@/components/AppBreadcrumb';
import { TenantSelector } from '@/components/TenantSelector';
import { ProposalFundingType, ProposalStatus } from '@/models';
import { LoyaltyService, PartnerProgramProposalModel } from '@/service/loyalty.service';
import { StandardPageHeader } from '@/components/StandardPageHeader';
import { UniversalFilterBar } from '@/components/UniversalFilterBar';
import { StandardRowActions } from '@/components/StandardRowActions';
import { exportToExcel } from '@/components/exportHelper';

export const PartnerProgramProposalPage: React.FC = () => {
  const { t } = useTranslation();
  const toast = useRef<Toast>(null);

  const [selectedTenant, setSelectedTenant] = useState<string>(
    () => localStorage.getItem('selected_tenant_id') || localStorage.getItem('tenant_id') || ''
  );
  const [proposals, setProposals] = useState<PartnerProgramProposalModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
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
      fundingType: ProposalFundingType.CO_FUNDED_CAMPAIGN,
      programName: '',
      description: '',
      proposedBudget: undefined,
      natcashCoFundPercent: undefined,
      earnRateBoostPercent: undefined,
      startDate: today,
      endDate: today,
    });
    setShowDialog(true);
  };

  const handleSubmit = async () => {
    if (!formData.programName?.trim()) {
      toast.current?.show({
        severity: 'warn',
        summary: t('common.warn'),
        detail: t('partner_portal.proposal_title_required'),
      });
      return;
    }
    setSubmitting(true);
    try {
      await LoyaltyService.createPartnerProposal(
        formData as PartnerProgramProposalModel,
        selectedTenant
      );
      toast.current?.show({
        severity: 'success',
        summary: t('common.success'),
        detail: t('partner_portal.proposal_submitted'),
      });
      setShowDialog(false);
      fetchProposals();
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

  const filteredProposals = useMemo(() => {
    if (!keyword.trim()) return proposals;
    const kw = keyword.toLowerCase();
    return proposals.filter(
      (p) =>
        p.proposalCode?.toLowerCase().includes(kw) ||
        p.programName?.toLowerCase().includes(kw) ||
        p.fundingType?.toLowerCase().includes(kw)
    );
  }, [proposals, keyword]);

  const handleExport = () => {
    exportToExcel(
      filteredProposals,
      [
        { header: t('partner_portal.proposal_code'), field: 'proposalCode' },
        { header: t('partner_portal.proposal_type'), field: 'fundingType' },
        { header: t('partner_portal.proposal_name'), field: 'programName' },
        { header: t('budget.cap'), field: 'proposedBudget' },
        { header: t('partner_portal.cofund_ratio'), field: 'natcashCoFundPercent' },
        { header: t('common.status'), field: 'status' },
      ],
      'de_xuat_chuong_trinh'
    );
  };

  return (
    <div className="w-full">
      <Toast ref={toast} />
      <AppBreadcrumb items={[{ label: t('partner_portal.nav_proposals') }]} />

      <StandardPageHeader
        title={t('partner_portal.proposals_title')}
        subtitle={t('partner_portal.proposals_subtitle')}
        primaryAction={{
          label: t('common.create', 'Thêm mới'),
          onClick: openNew,
        }}
        extraLeft={<TenantSelector value={selectedTenant} onChange={setSelectedTenant} />}
        onRefresh={fetchProposals}
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
          <DataTable<PartnerProgramProposalModel[]>
            value={filteredProposals}
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
              body={(r: PartnerProgramProposalModel) => (
                <StandardRowActions
                  onEdit={
                    r.status === ProposalStatus.PENDING_APPROVAL
                      ? () => {
                          setFormData(r);
                          setShowDialog(true);
                        }
                      : undefined
                  }
                  actions={
                    r.status !== ProposalStatus.PENDING_APPROVAL
                      ? [
                          {
                            icon: 'pi pi-eye',
                            label: t('common.view', 'Xem chi tiết'),
                            onClick: () => {
                              setFormData(r);
                              setShowDialog(true);
                            },
                          },
                        ]
                      : undefined
                  }
                />
              )}
              style={{ width: '6rem', textAlign: 'center' }}
            />
            <Column
              field="proposalCode"
              header={t('partner_portal.proposal_code')}
              body={(r: PartnerProgramProposalModel) => (
                <span className="font-bold font-mono text-900">{r.proposalCode || '--'}</span>
              )}
              style={{ minWidth: '11rem' }}
            />
            <Column
              field="fundingType"
              header={t('partner_portal.proposal_type')}
              body={(r: PartnerProgramProposalModel) => (
                <span className="text-900 text-sm">
                  {r.fundingType ? t(`enum.proposal_funding_type.${r.fundingType}`) : '--'}
                </span>
              )}
              style={{ minWidth: '11rem' }}
            />
            <Column
              field="programName"
              header={t('partner_portal.proposal_name')}
              body={(r: PartnerProgramProposalModel) => (
                <span className="text-900">{r.programName}</span>
              )}
              style={{ minWidth: '16rem' }}
            />
            <Column
              field="proposedBudget"
              header={t('budget.cap')}
              body={(r: PartnerProgramProposalModel) => (
                <span className="text-900 font-mono">
                  {Number(r.proposedBudget || 0).toLocaleString()} HTG
                </span>
              )}
              style={{ minWidth: '10rem', textAlign: 'right' }}
            />
            <Column
              field="natcashCoFundPercent"
              header={t('partner_portal.cofund_ratio')}
              body={(r: PartnerProgramProposalModel) => (
                <span className="text-900 font-mono">
                  {r.natcashCoFundPercent != null ? `${r.natcashCoFundPercent}%` : '--'}
                </span>
              )}
              style={{ minWidth: '9rem', textAlign: 'center' }}
            />
            <Column
              field="status"
              header={t('common.status')}
              body={(r: PartnerProgramProposalModel) => (
                <Tag
                  value={r.status || ProposalStatus.PENDING_APPROVAL}
                  severity={
                    r.status === ProposalStatus.APPROVED
                      ? 'success'
                      : r.status === ProposalStatus.REJECTED
                      ? 'danger'
                      : 'warning'
                  }
                />
              )}
              style={{ minWidth: '8.5rem', textAlign: 'center' }}
            />
          </DataTable>
        )}
      </div>

      <Dialog
        visible={showDialog}
        onHide={() => setShowDialog(false)}
        header={t('partner_portal.create_proposal')}
        style={{ width: '38rem' }}
        modal
        className="p-fluid"
      >
        <div className="flex flex-column gap-3">
          <div className="field m-0">
            <label className="text-sm font-medium">{t('partner_portal.proposal_type')}</label>
            <Dropdown
              value={formData.fundingType}
              options={Object.values(ProposalFundingType).map((ft) => ({
                label: t(`enum.proposal_funding_type.${ft}`),
                value: ft,
              }))}
              onChange={(e) => setFormData({ ...formData, fundingType: e.value })}
              appendTo="self"
            />
          </div>
          <div className="field m-0">
            <label className="text-sm font-medium">{t('partner_portal.proposal_name')} *</label>
            <InputText
              value={formData.programName || ''}
              onChange={(e) => setFormData({ ...formData, programName: e.target.value })}
            />
          </div>
          <div className="grid">
            <div className="col-6 field m-0">
              <label className="text-sm font-medium">{t('budget.cap')}</label>
              <InputNumber
                value={formData.proposedBudget ?? undefined}
                onValueChange={(e) =>
                  setFormData({ ...formData, proposedBudget: e.value ?? undefined })
                }
                min={0}
              />
            </div>
            <div className="col-6 field m-0">
              <label className="text-sm font-medium">{t('partner_portal.cofund_ratio')} (%)</label>
              <InputNumber
                value={formData.natcashCoFundPercent ?? undefined}
                onValueChange={(e) =>
                  setFormData({ ...formData, natcashCoFundPercent: e.value ?? undefined })
                }
                min={0}
                max={100}
              />
            </div>
          </div>
          <div className="field m-0">
            <label className="text-sm font-medium">{t('common.description')}</label>
            <InputTextarea
              rows={3}
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
        </div>
        <div className="flex justify-content-end gap-2 mt-4">
          <Button label={t('common.cancel')} outlined onClick={() => setShowDialog(false)} />
          <Button
            label={t('common.save')}
            icon="pi pi-check"
            onClick={handleSubmit}
            loading={submitting}
          />
        </div>
      </Dialog>
    </div>
  );
};

export default PartnerProgramProposalPage;
