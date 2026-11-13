import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { AppBreadcrumb } from 'components';
import { TenantSelector } from '@/components/TenantSelector';
import { CommonStatus } from '@/models';
import { LoyaltyService, PartnerBranchModel, PartnerProductGroupModel } from '@/service/loyalty.service';

export const PartnerBranchesProductsPage: React.FC = () => {
  const { t } = useTranslation();
  const toast = useRef<Toast>(null);

  const [selectedTenant, setSelectedTenant] = useState<string>(
    () => localStorage.getItem('selected_tenant_id') || 'TENANT_NATCASH'
  );
  const [branches, setBranches] = useState<PartnerBranchModel[]>([]);
  const [productGroups, setProductGroups] = useState<PartnerProductGroupModel[]>([]);
  const [loading, setLoading] = useState(false);

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
      toast.current?.show({ severity: 'warn', summary: t('common.warn', { defaultValue: 'Thiếu thông tin' }), detail: t('partner_portal.branch_required', { defaultValue: 'Nhập Mã và Tên chi nhánh.' }) });
      return;
    }
    setSubmitting(true);
    try {
      await LoyaltyService.savePartnerBranch(branchForm as PartnerBranchModel, selectedTenant);
      toast.current?.show({ severity: 'success', summary: t('common.success', { defaultValue: 'Thành công' }), detail: branchForm.branchCode });
      setShowBranchDialog(false);
      fetchAll();
    } catch (err: any) {
      toast.current?.show({ severity: 'error', summary: t('common.error', { defaultValue: 'Lỗi' }), detail: err?.response?.data?.message || err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveGroup = async () => {
    if (!groupForm.groupCode?.trim() || !groupForm.groupName?.trim()) {
      toast.current?.show({ severity: 'warn', summary: t('common.warn', { defaultValue: 'Thiếu thông tin' }), detail: t('partner_portal.group_required', { defaultValue: 'Nhập Mã và Tên nhóm sản phẩm.' }) });
      return;
    }
    setSubmitting(true);
    try {
      await LoyaltyService.savePartnerProductGroup(groupForm as PartnerProductGroupModel, selectedTenant);
      toast.current?.show({ severity: 'success', summary: t('common.success', { defaultValue: 'Thành công' }), detail: groupForm.groupCode });
      setShowGroupDialog(false);
      fetchAll();
    } catch (err: any) {
      toast.current?.show({ severity: 'error', summary: t('common.error', { defaultValue: 'Lỗi' }), detail: err?.response?.data?.message || err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Toast ref={toast} />
      <AppBreadcrumb items={[{ label: t('partner_portal.nav_branches', { defaultValue: 'Partner Portal · Chi nhánh & Sản phẩm (LM-08)' }) }]} />

      <div className="card shadow-1 border-round surface-card p-4">
        <div className="flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
          <div>
            <h4 className="m-0 text-primary font-semibold">{t('partner_portal.branches_title', { defaultValue: 'Chi nhánh Quầy thu ngân & Nhóm Sản phẩm (LM-08)' })}</h4>
            <p className="m-0 text-xs text-500 mt-1">{t('partner_portal.branches_subtitle', { defaultValue: 'Quản lý danh sách cửa hàng/chi nhánh và tỷ lệ tích điểm theo từng nhóm mặt hàng.' })}</p>
          </div>
          <div className="flex gap-2 align-items-center">
            <TenantSelector value={selectedTenant} onChange={setSelectedTenant} />
            <Button icon="pi pi-refresh" outlined rounded onClick={fetchAll} loading={loading} />
          </div>
        </div>

        <TabView>
          <TabPanel header={t('partner_portal.tab_branches', { defaultValue: `Chi nhánh (${branches.length})` })} leftIcon="pi pi-map-marker mr-2">
            <div className="flex justify-content-end mb-3">
              <Button icon="pi pi-plus" label={t('partner_portal.add_branch', { defaultValue: 'Thêm Chi nhánh' })} severity="success" size="small" onClick={() => { setBranchForm({ branchCode: '', branchName: '', city: '', address: '', phone: '', status: CommonStatus.ACTIVE }); setShowBranchDialog(true); }} />
            </div>
            {loading ? (
              <div className="flex flex-column gap-2"><Skeleton height="2.5rem" /><Skeleton height="2.5rem" /></div>
            ) : (
              <DataTable<PartnerBranchModel> value={branches} paginator rows={10} stripedRows responsiveLayout="scroll" emptyMessage={t('common.no_data', { defaultValue: 'Chưa có chi nhánh nào.' })}>
                <Column field="branchCode" header={t('partner_portal.branch_code', { defaultValue: 'Mã CN' })} body={(r) => <span className="font-mono white-space-nowrap font-medium text-primary">{r.branchCode}</span>} style={{ minWidth: '10rem' }} />
                <Column field="branchName" header={t('partner_portal.branch_name', { defaultValue: 'Tên Chi Nhánh' })} style={{ minWidth: '14rem' }} />
                <Column field="city" header={t('payment_point.city', { defaultValue: 'Thành phố' })} style={{ minWidth: '9rem' }} />
                <Column field="address" header={t('payment_point.address', { defaultValue: 'Địa Chỉ' })} style={{ minWidth: '15rem' }} />
                <Column field="phone" header={t('customer.phone', { defaultValue: 'Điện Thoại' })} body={(r) => <span className="font-mono white-space-nowrap">{r.phone || '--'}</span>} style={{ minWidth: '10rem' }} />
                <Column field="status" header={t('common.status', { defaultValue: 'Trạng Thái' })} body={(r) => <Tag value={r.status} severity={r.status === CommonStatus.ACTIVE ? 'success' : 'secondary'} />} style={{ minWidth: '8rem', textAlign: 'center' }} />
                <Column header={t('common.action', { defaultValue: 'Sửa' })} body={(r) => <Button icon="pi pi-pencil" text rounded size="small" onClick={() => { setBranchForm(r); setShowBranchDialog(true); }} />} style={{ minWidth: '5rem' }} />
              </DataTable>
            )}
          </TabPanel>

          <TabPanel header={t('partner_portal.tab_product_groups', { defaultValue: `Nhóm Sản phẩm (${productGroups.length})` })} leftIcon="pi pi-tags mr-2">
            <div className="flex justify-content-end mb-3">
              <Button icon="pi pi-plus" label={t('partner_portal.add_group', { defaultValue: 'Thêm Nhóm Sản phẩm' })} severity="success" size="small" onClick={() => { setGroupForm({ groupCode: '', groupName: '', earnMultiplier: 1, burnAllowed: true, status: CommonStatus.ACTIVE }); setShowGroupDialog(true); }} />
            </div>
            <DataTable<PartnerProductGroupModel> value={productGroups} paginator rows={10} stripedRows responsiveLayout="scroll" emptyMessage={t('common.no_data', { defaultValue: 'Chưa có nhóm sản phẩm nào.' })}>
              <Column field="groupCode" header={t('partner_portal.group_code', { defaultValue: 'Mã Nhóm' })} body={(r) => <span className="font-mono white-space-nowrap font-medium text-primary">{r.groupCode}</span>} style={{ minWidth: '10rem' }} />
              <Column field="groupName" header={t('partner_portal.group_name', { defaultValue: 'Tên Nhóm Sản Phẩm' })} style={{ minWidth: '15rem' }} />
              <Column field="earnMultiplier" header={t('partner_portal.earn_multiplier', { defaultValue: 'Hệ số Tích điểm' })} body={(r) => <Tag value={`x${r.earnMultiplier}`} severity="info" />} style={{ minWidth: '9rem', textAlign: 'center' }} />
              <Column field="burnAllowed" header={t('partner_portal.burn_allowed', { defaultValue: 'Cho phép Tiêu điểm' })} body={(r) => <Tag value={r.burnAllowed ? 'YES' : 'NO'} severity={r.burnAllowed ? 'success' : 'warning'} />} style={{ minWidth: '9rem', textAlign: 'center' }} />
              <Column field="status" header={t('common.status', { defaultValue: 'Trạng Thái' })} body={(r) => <Tag value={r.status} severity={r.status === CommonStatus.ACTIVE ? 'success' : 'secondary'} />} style={{ minWidth: '8rem', textAlign: 'center' }} />
              <Column header={t('common.action', { defaultValue: 'Sửa' })} body={(r) => <Button icon="pi pi-pencil" text rounded size="small" onClick={() => { setGroupForm(r); setShowGroupDialog(true); }} />} style={{ minWidth: '5rem' }} />
            </DataTable>
          </TabPanel>
        </TabView>
      </div>

      <Dialog visible={showBranchDialog} onHide={() => setShowBranchDialog(false)} header={t('partner_portal.branch_dialog', { defaultValue: 'Thông tin Chi nhánh Đối tác' })} style={{ width: '36rem' }} modal className="p-fluid">
        <div className="flex flex-column gap-3">
          <div className="field m-0">
            <label className="text-sm font-medium">{t('partner_portal.branch_code', { defaultValue: 'Mã Chi Nhánh' })} *</label>
            <InputText value={branchForm.branchCode || ''} onChange={(e) => setBranchForm({ ...branchForm, branchCode: e.target.value.toUpperCase() })} className="font-mono" />
          </div>
          <div className="field m-0">
            <label className="text-sm font-medium">{t('partner_portal.branch_name', { defaultValue: 'Tên Chi Nhánh' })} *</label>
            <InputText value={branchForm.branchName || ''} onChange={(e) => setBranchForm({ ...branchForm, branchName: e.target.value })} />
          </div>
          <div className="grid">
            <div className="col-6 field m-0">
              <label className="text-sm font-medium">{t('payment_point.city', { defaultValue: 'Thành phố' })}</label>
              <InputText value={branchForm.city || ''} onChange={(e) => setBranchForm({ ...branchForm, city: e.target.value })} />
            </div>
            <div className="col-6 field m-0">
              <label className="text-sm font-medium">{t('customer.phone', { defaultValue: 'Điện thoại' })}</label>
              <InputText value={branchForm.phone || ''} onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })} className="font-mono" />
            </div>
          </div>
          <div className="field m-0">
            <label className="text-sm font-medium">{t('payment_point.address', { defaultValue: 'Địa chỉ' })}</label>
            <InputText value={branchForm.address || ''} onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })} />
          </div>
        </div>
        <div className="flex justify-content-end gap-2 mt-4">
          <Button label={t('common.cancel', { defaultValue: 'Hủy' })} outlined onClick={() => setShowBranchDialog(false)} />
          <Button label={t('common.save', { defaultValue: 'Lưu' })} icon="pi pi-check" onClick={handleSaveBranch} loading={submitting} />
        </div>
      </Dialog>

      <Dialog visible={showGroupDialog} onHide={() => setShowGroupDialog(false)} header={t('partner_portal.group_dialog', { defaultValue: 'Thông tin Nhóm Sản phẩm' })} style={{ width: '34rem' }} modal className="p-fluid">
        <div className="flex flex-column gap-3">
          <div className="field m-0">
            <label className="text-sm font-medium">{t('partner_portal.group_code', { defaultValue: 'Mã Nhóm' })} *</label>
            <InputText value={groupForm.groupCode || ''} onChange={(e) => setGroupForm({ ...groupForm, groupCode: e.target.value.toUpperCase() })} className="font-mono" />
          </div>
          <div className="field m-0">
            <label className="text-sm font-medium">{t('partner_portal.group_name', { defaultValue: 'Tên Nhóm' })} *</label>
            <InputText value={groupForm.groupName || ''} onChange={(e) => setGroupForm({ ...groupForm, groupName: e.target.value })} />
          </div>
          <div className="grid">
            <div className="col-6 field m-0">
              <label className="text-sm font-medium">{t('partner_portal.earn_multiplier', { defaultValue: 'Hệ số Tích điểm' })}</label>
              <InputNumber value={groupForm.earnMultiplier ?? 1} onValueChange={(e) => setGroupForm({ ...groupForm, earnMultiplier: e.value || 1 })} min={0} max={20} minFractionDigits={1} maxFractionDigits={2} />
            </div>
            <div className="col-6 field m-0">
              <label className="text-sm font-medium">{t('partner_portal.burn_allowed', { defaultValue: 'Cho phép Tiêu điểm' })}</label>
              <Dropdown value={groupForm.burnAllowed ?? true} options={[{ label: 'Cho phép', value: true }, { label: 'Không áp dụng', value: false }]} onChange={(e) => setGroupForm({ ...groupForm, burnAllowed: e.value })} appendTo="self" />
            </div>
          </div>
        </div>
        <div className="flex justify-content-end gap-2 mt-4">
          <Button label={t('common.cancel', { defaultValue: 'Hủy' })} outlined onClick={() => setShowGroupDialog(false)} />
          <Button label={t('common.save', { defaultValue: 'Lưu' })} icon="pi pi-check" onClick={handleSaveGroup} loading={submitting} />
        </div>
      </Dialog>
    </div>
  );
};

export default PartnerBranchesProductsPage;
