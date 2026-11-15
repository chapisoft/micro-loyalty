import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { TabView, TabPanel } from 'primereact/tabview';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { Skeleton } from 'primereact/skeleton';
import { useTranslation } from 'react-i18next';
import { AppBreadcrumb } from '@/components/AppBreadcrumb';
import { TenantSelector } from '@/components/TenantSelector';
import { CommonStatus } from '@/models';
import { LoyaltyService, PartnerBranchModel, PartnerProductGroupModel } from '@/service/loyalty.service';
import { StandardPageHeader } from '@/components/StandardPageHeader';
import { UniversalFilterBar } from '@/components/UniversalFilterBar';
import { StandardRowActions } from '@/components/StandardRowActions';
import { exportToExcel } from '@/components/exportHelper';

export const PartnerBranchesProductsPage: React.FC = () => {
  const { t } = useTranslation();
  const toast = useRef<Toast>(null);

  const [selectedTenant, setSelectedTenant] = useState<string>(
    () => localStorage.getItem('selected_tenant_id') || localStorage.getItem('tenant_id') || ''
  );
  const [branches, setBranches] = useState<PartnerBranchModel[]>([]);
  const [productGroups, setProductGroups] = useState<PartnerProductGroupModel[]>([]);
  const [loading, setLoading] = useState(false);

  const [branchKeyword, setBranchKeyword] = useState('');
  const [groupKeyword, setGroupKeyword] = useState('');

  const [showBranchDialog, setShowBranchDialog] = useState(false);
  const [branchForm, setBranchForm] = useState<Partial<PartnerBranchModel>>({});
  const [showGroupDialog, setShowGroupDialog] = useState(false);
  const [groupForm, setGroupForm] = useState<Partial<PartnerProductGroupModel>>({});
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [bList, pList] = await Promise.all([
        LoyaltyService.getPartnerBranches(selectedTenant),
        LoyaltyService.getPartnerProductGroups(selectedTenant),
      ]);
      setBranches(Array.isArray(bList) ? bList : []);
      setProductGroups(Array.isArray(pList) ? pList : []);
    } finally {
      setLoading(false);
    }
  }, [selectedTenant]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleSaveBranch = async () => {
    if (!branchForm.branchCode?.trim() || !branchForm.branchName?.trim()) {
      toast.current?.show({
        severity: 'warn',
        summary: t('common.warn'),
        detail: t('partner_portal.branch_required'),
      });
      return;
    }
    setSubmitting(true);
    try {
      await LoyaltyService.savePartnerBranch(branchForm as PartnerBranchModel, selectedTenant);
      toast.current?.show({
        severity: 'success',
        summary: t('common.success'),
        detail: branchForm.branchCode,
      });
      setShowBranchDialog(false);
      fetchAll();
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

  const handleSaveGroup = async () => {
    if (!groupForm.groupCode?.trim() || !groupForm.groupName?.trim()) {
      toast.current?.show({
        severity: 'warn',
        summary: t('common.warn'),
        detail: t('partner_portal.group_required'),
      });
      return;
    }
    setSubmitting(true);
    try {
      await LoyaltyService.savePartnerProductGroup(
        groupForm as PartnerProductGroupModel,
        selectedTenant
      );
      toast.current?.show({
        severity: 'success',
        summary: t('common.success'),
        detail: groupForm.groupCode,
      });
      setShowGroupDialog(false);
      fetchAll();
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

  const filteredBranches = useMemo(() => {
    if (!branchKeyword.trim()) return branches;
    const kw = branchKeyword.toLowerCase();
    return branches.filter(
      (b) =>
        b.branchCode?.toLowerCase().includes(kw) ||
        b.branchName?.toLowerCase().includes(kw) ||
        b.province?.toLowerCase().includes(kw) ||
        b.address?.toLowerCase().includes(kw) ||
        b.paymentPointCode?.toLowerCase().includes(kw)
    );
  }, [branches, branchKeyword]);

  const filteredProductGroups = useMemo(() => {
    if (!groupKeyword.trim()) return productGroups;
    const kw = groupKeyword.toLowerCase();
    return productGroups.filter(
      (g) =>
        g.groupCode?.toLowerCase().includes(kw) ||
        g.groupName?.toLowerCase().includes(kw)
    );
  }, [productGroups, groupKeyword]);

  const handleExportBranches = () => {
    exportToExcel(
      filteredBranches,
      [
        { header: t('partner_portal.branch_code'), field: 'branchCode' },
        { header: t('partner_portal.branch_name'), field: 'branchName' },
        { header: t('payment_point.province'), field: 'province' },
        { header: t('payment_point.address'), field: 'address' },
        { header: t('payment_point.code'), field: 'paymentPointCode' },
        { header: t('common.status'), field: 'status' },
      ],
      'chi_nhanh_doi_tac'
    );
  };

  const handleExportGroups = () => {
    exportToExcel(
      filteredProductGroups,
      [
        { header: t('partner_portal.group_code'), field: 'groupCode' },
        { header: t('partner_portal.group_name'), field: 'groupName' },
        { header: t('partner_portal.earn_multiplier'), field: 'earnMultiplier' },
        { header: t('partner_portal.burn_allowed'), field: 'allowBurn' },
        { header: t('common.status'), field: 'status' },
      ],
      'nhom_san_pham_doi_tac'
    );
  };

  return (
    <div className="w-full">
      <Toast ref={toast} />
      <AppBreadcrumb items={[{ label: t('partner_portal.nav_branches') }]} />

      <StandardPageHeader
        title={t('partner_portal.branches_title')}
        subtitle={t('partner_portal.branches_subtitle')}
        extraLeft={<TenantSelector value={selectedTenant} onChange={setSelectedTenant} />}
        onRefresh={fetchAll}
        refreshLoading={loading}
      />

      <div className="card shadow-1 border-round surface-card p-4">
        <TabView>
          <TabPanel header={`${t('partner_portal.tab_branches')} (${branches.length})`}>
            <div className="flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
              <UniversalFilterBar
                keyword={branchKeyword}
                onKeywordChange={setBranchKeyword}
                searchPlaceholder={t('common.search')}
                onReset={() => setBranchKeyword('')}
                onExport={handleExportBranches}
              />
              <Button
                label={t('common.create', 'Thêm mới')}
                icon="pi pi-plus"
                size="small"
                onClick={() => {
                  setBranchForm({
                    branchCode: '',
                    branchName: '',
                    paymentPointCode: '',
                    province: '',
                    address: '',
                    status: CommonStatus.ACTIVE,
                  });
                  setShowBranchDialog(true);
                }}
              />
            </div>

            {loading ? (
              <div className="flex flex-column gap-2 mt-3">
                <Skeleton height="2.5rem" />
                <Skeleton height="2.5rem" />
              </div>
            ) : (
              <DataTable<PartnerBranchModel[]>
                value={filteredBranches}
                paginator
                rows={10}
                stripedRows
                responsiveLayout="scroll"
                emptyMessage={t('common.no_data')}
              >
                <Column
                  header={t('common.order_number', 'STT')}
                  body={(_, opt) => opt.rowIndex + 1}
                  style={{ width: '4rem', textAlign: 'center' }}
                />
                <Column
                  header={t('common.action', 'Thao tác')}
                  body={(r: PartnerBranchModel) => (
                    <StandardRowActions
                      onEdit={() => {
                        setBranchForm(r);
                        setShowBranchDialog(true);
                      }}
                    />
                  )}
                  style={{ width: '6rem', textAlign: 'center' }}
                />
                <Column
                  field="branchCode"
                  header={t('partner_portal.branch_code')}
                  body={(r: PartnerBranchModel) => (
                    <span className="font-bold font-mono text-900">{r.branchCode}</span>
                  )}
                  style={{ minWidth: '10rem' }}
                />
                <Column
                  field="branchName"
                  header={t('partner_portal.branch_name')}
                  body={(r: PartnerBranchModel) => <span className="text-900">{r.branchName}</span>}
                  style={{ minWidth: '14rem' }}
                />
                <Column
                  field="province"
                  header={t('payment_point.province')}
                  body={(r: PartnerBranchModel) => <span className="text-900">{r.province || '--'}</span>}
                  style={{ minWidth: '9rem' }}
                />
                <Column
                  field="address"
                  header={t('payment_point.address')}
                  body={(r: PartnerBranchModel) => <span className="text-900">{r.address || '--'}</span>}
                  style={{ minWidth: '15rem' }}
                />
                <Column
                  field="paymentPointCode"
                  header={t('payment_point.code')}
                  body={(r: PartnerBranchModel) => (
                    <span className="text-900 font-mono text-xs">
                      {r.paymentPointCode || '--'}
                    </span>
                  )}
                  style={{ minWidth: '10rem' }}
                />
                <Column
                  field="status"
                  header={t('common.status')}
                  body={(r: PartnerBranchModel) => (
                    <Tag
                      value={r.status}
                      severity={r.status === CommonStatus.ACTIVE ? 'success' : 'secondary'}
                    />
                  )}
                  style={{ minWidth: '8rem', textAlign: 'center' }}
                />
              </DataTable>
            )}
          </TabPanel>

          <TabPanel header={`${t('partner_portal.tab_product_groups')} (${productGroups.length})`}>
            <div className="flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
              <UniversalFilterBar
                keyword={groupKeyword}
                onKeywordChange={setGroupKeyword}
                searchPlaceholder={t('common.search')}
                onReset={() => setGroupKeyword('')}
                onExport={handleExportGroups}
              />
              <Button
                label={t('common.create', 'Thêm mới')}
                icon="pi pi-plus"
                size="small"
                onClick={() => {
                  setGroupForm({
                    groupCode: '',
                    groupName: '',
                    earnMultiplier: 1,
                    allowBurn: true,
                    productCount: 0,
                    status: CommonStatus.ACTIVE,
                  });
                  setShowGroupDialog(true);
                }}
              />
            </div>

            <DataTable<PartnerProductGroupModel[]>
              value={filteredProductGroups}
              paginator
              rows={10}
              stripedRows
              responsiveLayout="scroll"
              emptyMessage={t('common.no_data')}
            >
              <Column
                header={t('common.order_number', 'STT')}
                body={(_, opt) => opt.rowIndex + 1}
                style={{ width: '4rem', textAlign: 'center' }}
              />
              <Column
                header={t('common.action', 'Thao tác')}
                body={(r: PartnerProductGroupModel) => (
                  <StandardRowActions
                    onEdit={() => {
                      setGroupForm(r);
                      setShowGroupDialog(true);
                    }}
                  />
                )}
                style={{ width: '6rem', textAlign: 'center' }}
              />
              <Column
                field="groupCode"
                header={t('partner_portal.group_code')}
                body={(r: PartnerProductGroupModel) => (
                  <span className="font-bold font-mono text-900">{r.groupCode}</span>
                )}
                style={{ minWidth: '10rem' }}
              />
              <Column
                field="groupName"
                header={t('partner_portal.group_name')}
                body={(r: PartnerProductGroupModel) => (
                  <span className="text-900">{r.groupName}</span>
                )}
                style={{ minWidth: '15rem' }}
              />
              <Column
                field="earnMultiplier"
                header={t('partner_portal.earn_multiplier')}
                body={(r: PartnerProductGroupModel) => (
                  <span className="text-900 font-mono">x{r.earnMultiplier}</span>
                )}
                style={{ minWidth: '9rem', textAlign: 'center' }}
              />
              <Column
                field="allowBurn"
                header={t('partner_portal.burn_allowed')}
                body={(r: PartnerProductGroupModel) => (
                  <span className="text-900">
                    {r.allowBurn ? t('common.allow', 'Cho phép') : t('common.not_applicable', 'Không')}
                  </span>
                )}
                style={{ minWidth: '9rem', textAlign: 'center' }}
              />
              <Column
                field="status"
                header={t('common.status')}
                body={(r: PartnerProductGroupModel) => (
                  <Tag
                    value={r.status}
                    severity={r.status === CommonStatus.ACTIVE ? 'success' : 'secondary'}
                  />
                )}
                style={{ minWidth: '8rem', textAlign: 'center' }}
              />
            </DataTable>
          </TabPanel>
        </TabView>
      </div>

      <Dialog
        visible={showBranchDialog}
        onHide={() => setShowBranchDialog(false)}
        header={t('partner_portal.branch_dialog')}
        style={{ width: '36rem' }}
        modal
        className="p-fluid"
      >
        <div className="flex flex-column gap-3">
          <div className="field m-0">
            <label className="text-sm font-medium">{t('partner_portal.branch_code')} *</label>
            <InputText
              value={branchForm.branchCode || ''}
              onChange={(e) =>
                setBranchForm({ ...branchForm, branchCode: e.target.value.toUpperCase() })
              }
              className="font-mono"
            />
          </div>
          <div className="field m-0">
            <label className="text-sm font-medium">{t('partner_portal.branch_name')} *</label>
            <InputText
              value={branchForm.branchName || ''}
              onChange={(e) => setBranchForm({ ...branchForm, branchName: e.target.value })}
            />
          </div>
          <div className="grid">
            <div className="col-6 field m-0">
              <label className="text-sm font-medium">{t('payment_point.province')}</label>
              <InputText
                value={branchForm.province || ''}
                onChange={(e) => setBranchForm({ ...branchForm, province: e.target.value })}
              />
            </div>
            <div className="col-6 field m-0">
              <label className="text-sm font-medium">{t('payment_point.code')}</label>
              <InputText
                value={branchForm.paymentPointCode || ''}
                onChange={(e) =>
                  setBranchForm({
                    ...branchForm,
                    paymentPointCode: e.target.value.toUpperCase(),
                  })
                }
                className="font-mono"
              />
            </div>
          </div>
          <div className="field m-0">
            <label className="text-sm font-medium">{t('payment_point.address')}</label>
            <InputText
              value={branchForm.address || ''}
              onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
            />
          </div>
        </div>
        <div className="flex justify-content-end gap-2 mt-4">
          <Button label={t('common.cancel')} outlined onClick={() => setShowBranchDialog(false)} />
          <Button
            label={t('common.save')}
            icon="pi pi-check"
            onClick={handleSaveBranch}
            loading={submitting}
          />
        </div>
      </Dialog>

      <Dialog
        visible={showGroupDialog}
        onHide={() => setShowGroupDialog(false)}
        header={t('partner_portal.group_dialog')}
        style={{ width: '34rem' }}
        modal
        className="p-fluid"
      >
        <div className="flex flex-column gap-3">
          <div className="field m-0">
            <label className="text-sm font-medium">{t('partner_portal.group_code')} *</label>
            <InputText
              value={groupForm.groupCode || ''}
              onChange={(e) =>
                setGroupForm({ ...groupForm, groupCode: e.target.value.toUpperCase() })
              }
              className="font-mono"
            />
          </div>
          <div className="field m-0">
            <label className="text-sm font-medium">{t('partner_portal.group_name')} *</label>
            <InputText
              value={groupForm.groupName || ''}
              onChange={(e) => setGroupForm({ ...groupForm, groupName: e.target.value })}
            />
          </div>
          <div className="grid">
            <div className="col-6 field m-0">
              <label className="text-sm font-medium">{t('partner_portal.earn_multiplier')}</label>
              <InputNumber
                value={groupForm.earnMultiplier ?? 1}
                onValueChange={(e) =>
                  setGroupForm({ ...groupForm, earnMultiplier: e.value || 1 })
                }
                min={0}
                max={20}
                minFractionDigits={1}
                maxFractionDigits={2}
              />
            </div>
            <div className="col-6 field m-0">
              <label className="text-sm font-medium">{t('partner_portal.burn_allowed')}</label>
              <Dropdown
                value={groupForm.allowBurn ?? true}
                options={[
                  { label: t('common.allow'), value: true },
                  { label: t('common.not_applicable'), value: false },
                ]}
                onChange={(e) => setGroupForm({ ...groupForm, allowBurn: e.value })}
                appendTo="self"
              />
            </div>
          </div>
        </div>
        <div className="flex justify-content-end gap-2 mt-4">
          <Button label={t('common.cancel')} outlined onClick={() => setShowGroupDialog(false)} />
          <Button
            label={t('common.save')}
            icon="pi pi-check"
            onClick={handleSaveGroup}
            loading={submitting}
          />
        </div>
      </Dialog>
    </div>
  );
};

export default PartnerBranchesProductsPage;
