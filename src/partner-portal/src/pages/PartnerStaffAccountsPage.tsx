import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Skeleton } from 'primereact/skeleton';
import { useTranslation } from 'react-i18next';
import { TenantSelector } from '@/components/TenantSelector';
import { KeyStorage, PARTNER_PORTAL_CONSTANTS } from '@/constants';
import { CommonStatus, PartnerStaffRole } from '@/models';
import { LoyaltyService, PartnerStaffAccountModel, PartnerBranchModel } from '@/service/loyalty.service';
import { StandardPageHeader } from '@/components/StandardPageHeader';
import { UniversalFilterBar } from '@/components/UniversalFilterBar';
import { StandardRowActions, RowActionItem } from '@/components/StandardRowActions';
import { exportToExcel } from '@/components/exportHelper';

export const PartnerStaffAccountsPage: React.FC = () => {
  const { t } = useTranslation();
  const toast = useRef<Toast>(null);

  const [selectedTenant, setSelectedTenant] = useState<string>(
    () => localStorage.getItem(KeyStorage.SELECTED_TENANT_ID) || PARTNER_PORTAL_CONSTANTS.DEFAULT_TENANT_ID
  );
  const [staffList, setStaffList] = useState<PartnerStaffAccountModel[]>([]);
  const [branches, setBranches] = useState<PartnerBranchModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [branchFilter, setBranchFilter] = useState<string>('ALL');

  const [showDialog, setShowDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<PartnerStaffAccountModel>>({});

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const [list, branchList] = await Promise.all([
        LoyaltyService.getPartnerStaff(selectedTenant),
        LoyaltyService.getPartnerBranches(selectedTenant),
      ]);
      setStaffList(Array.isArray(list) ? list : []);
      setBranches(Array.isArray(branchList) ? branchList : []);
    } finally {
      setLoading(false);
    }
  }, [selectedTenant]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const openNew = () => {
    setFormData({
      username: '',
      fullName: '',
      roleCode: PartnerStaffRole.PARTNER_CASHIER,
      branchId: branches[0]?.id,
      branchName: branches[0]?.branchName || '',
      phoneNumber: '',
      status: CommonStatus.ACTIVE,
    });
    setShowDialog(true);
  };

  const handleEdit = (staff: PartnerStaffAccountModel) => {
    setFormData({ ...staff });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formData.username?.trim() || !formData.fullName?.trim()) {
      toast.current?.show({
        severity: 'warn',
        summary: t('common.warn', 'Cảnh báo'),
        detail: t('partner_portal.staff_required', 'Vui lòng nhập tài khoản và họ tên'),
      });
      return;
    }
    setSubmitting(true);
    try {
      await LoyaltyService.savePartnerStaff(formData as PartnerStaffAccountModel, selectedTenant);
      toast.current?.show({
        severity: 'success',
        summary: t('common.success', 'Thành công'),
        detail: t('common.saved', 'Đã lưu thông tin nhân viên'),
      });
      setShowDialog(false);
      fetchStaff();
    } catch (err: any) {
      toast.current?.show({
        severity: 'error',
        summary: t('common.error', 'Lỗi'),
        detail: err?.response?.data?.message || err.message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleLock = (staff: PartnerStaffAccountModel) => {
    if (!staff.id) return;
    const isLocking = staff.status === CommonStatus.ACTIVE;
    confirmDialog({
      message: `${isLocking ? t('common.confirm_lock', 'Bạn có chắc chắn muốn khóa tài khoản') : t('common.confirm_unlock', 'Bạn có chắc chắn muốn mở khóa tài khoản')} ${staff.username}?`,
      header: t('common.confirm', 'Xác nhận'),
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: isLocking ? 'p-button-danger' : 'p-button-success',
      acceptLabel: isLocking ? t('common.lock', 'Khóa') : t('common.unlock', 'Mở khóa'),
      rejectLabel: t('common.cancel', 'Hủy'),
      accept: async () => {
        try {
          await LoyaltyService.togglePartnerStaffLock(staff.id!, selectedTenant);
          toast.current?.show({
            severity: 'success',
            summary: t('common.success', 'Thành công'),
            detail: `${staff.username} ${isLocking ? 'đã bị khóa' : 'đã được mở khóa'}`,
          });
          fetchStaff();
        } catch (err: any) {
          toast.current?.show({
            severity: 'error',
            summary: t('common.error', 'Lỗi'),
            detail: err?.response?.data?.message || err.message,
          });
        }
      },
    });
  };

  const handleDelete = (staff: PartnerStaffAccountModel) => {
    if (!staff.id) return;
    confirmDialog({
      message: `${t('common.confirm_delete', 'Bạn có chắc chắn muốn xóa nhân viên')} ${staff.fullName} (${staff.username})?`,
      header: t('common.confirm', 'Xác nhận xóa'),
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      acceptLabel: t('common.delete', 'Xóa'),
      rejectLabel: t('common.cancel', 'Hủy'),
      accept: async () => {
        try {
          await LoyaltyService.deletePartnerStaff(staff.id!, selectedTenant);
          toast.current?.show({
            severity: 'success',
            summary: t('common.success', 'Thành công'),
            detail: t('common.deleted', 'Đã xóa nhân viên thành công'),
          });
          fetchStaff();
        } catch (err: any) {
          toast.current?.show({
            severity: 'error',
            summary: t('common.error', 'Lỗi'),
            detail: err?.response?.data?.message || err.message,
          });
        }
      },
    });
  };

  const filteredStaff = useMemo(() => {
    return staffList.filter((s) => {
      if (keyword.trim()) {
        const kw = keyword.toLowerCase();
        const matchesKw =
          s.username?.toLowerCase().includes(kw) ||
          s.fullName?.toLowerCase().includes(kw) ||
          s.phoneNumber?.toLowerCase().includes(kw) ||
          s.branchName?.toLowerCase().includes(kw);
        if (!matchesKw) return false;
      }
      if (roleFilter !== 'ALL' && s.roleCode !== roleFilter) return false;
      if (statusFilter !== 'ALL' && s.status !== statusFilter) return false;
      if (branchFilter !== 'ALL' && String(s.branchId) !== String(branchFilter)) return false;
      return true;
    });
  }, [staffList, keyword, roleFilter, statusFilter, branchFilter]);

  const handleExport = () => {
    exportToExcel(
      filteredStaff.map((s) => {
        const branch = branches.find((b) => String(b.id) === String(s.branchId));
        return {
          ...s,
          resolvedBranchName: branch?.branchName || s.branchName || (s.branchId ? `Chi nhánh #${s.branchId}` : t('common.all', 'Tất cả')),
        };
      }),
      [
        { header: t('common.stt', 'STT') },
        { header: t('partner_portal.username', 'Tài khoản'), field: 'username' },
        { header: t('partner_portal.staff_name', 'Họ và tên'), field: 'fullName' },
        { header: t('partner_portal.role', 'Vai trò'), field: 'roleCode' },
        { header: t('partner_portal.branch', 'Chi nhánh'), field: 'resolvedBranchName' },
        { header: t('customer.phone', 'Số điện thoại'), field: 'phoneNumber' },
        { header: t('common.status', 'Trạng thái'), field: 'status' },
      ],
      'nhan_vien_doi_tac'
    );
  };

  const roleFilterOptions = useMemo(
    () => [
      { label: t('partner_portal.all_roles', 'Tất cả vai trò'), value: 'ALL' },
      { label: t('enum.partner_staff_role.PARTNER_ADMIN', 'Quản trị đối tác'), value: PartnerStaffRole.PARTNER_ADMIN },
      { label: t('enum.partner_staff_role.PARTNER_BRANCH_MANAGER', 'Quản lý chi nhánh'), value: PartnerStaffRole.PARTNER_BRANCH_MANAGER },
      { label: t('enum.partner_staff_role.PARTNER_CASHIER', 'Thu ngân POS'), value: PartnerStaffRole.PARTNER_CASHIER },
    ],
    [t]
  );

  const statusFilterOptions = useMemo(
    () => [
      { label: t('common.all_status', 'Tất cả trạng thái'), value: 'ALL' },
      { label: t('common.active', 'Hoạt động'), value: CommonStatus.ACTIVE },
      { label: t('common.inactive', 'Tạm khóa'), value: CommonStatus.INACTIVE },
    ],
    [t]
  );

  const branchFilterOptions = useMemo(
    () => [
      { label: t('partner_portal.all_branches', 'Tất cả chi nhánh'), value: 'ALL' },
      ...branches.map((b) => ({
        label: `${b.branchName} (${b.branchCode})`,
        value: String(b.id),
      })),
    ],
    [branches, t]
  );

  const renderRowActions = (r: PartnerStaffAccountModel) => {
    const actions: RowActionItem[] = [
      {
        id: 'edit',
        label: t('common.edit', 'Sửa'),
        icon: 'pi pi-pencil',
        severity: 'secondary',
        onClick: () => handleEdit(r),
      },
      {
        id: 'toggleLock',
        label: r.status === CommonStatus.ACTIVE ? t('common.lock', 'Khóa') : t('common.unlock', 'Mở khóa'),
        icon: r.status === CommonStatus.ACTIVE ? 'pi pi-lock' : 'pi pi-lock-open',
        severity: r.status === CommonStatus.ACTIVE ? 'warning' : 'success',
        onClick: () => handleToggleLock(r),
      },
      {
        id: 'delete',
        label: t('common.delete', 'Xóa'),
        icon: 'pi pi-trash',
        danger: true,
        onClick: () => handleDelete(r),
      },
    ];
    return <StandardRowActions actions={actions} maxInline={3} />;
  };

  return (
    <div className="w-full flex flex-column gap-2">
      <Toast ref={toast} />
      <ConfirmDialog />

      <StandardPageHeader
        breadcrumbs={[{ label: t('partner_portal.nav_staff', 'Nhân viên') }]}
        title={t('partner_portal.staff_title', 'Tài khoản nhân viên')}
        subtitle="Quản lý danh sách nhân sự đối tác, phân quyền thu ngân và gán chi nhánh vận hành"
        primaryAction={{
          label: t('common.add_new', 'Thêm mới'),
          icon: 'pi pi-plus',
          onClick: openNew,
        }}
        extraLeft={<TenantSelector value={selectedTenant} onChange={setSelectedTenant} />}
        onRefresh={fetchStaff}
        refreshLoading={loading}
      />

      <div className="card shadow-1 border-round surface-card p-4 w-full">
        <UniversalFilterBar
          keyword={keyword}
          onKeywordChange={setKeyword}
          searchPlaceholder={t('common.search', 'Tìm tài khoản, họ tên, SĐT...')}
          primaryFilters={
            <>
              <Dropdown
                value={roleFilter}
                options={roleFilterOptions}
                onChange={(e) => setRoleFilter(e.value || 'ALL')}
                className="p-inputtext-sm w-12rem"
              />
              <Dropdown
                value={branchFilter}
                options={branchFilterOptions}
                onChange={(e) => setBranchFilter(e.value || 'ALL')}
                className="p-inputtext-sm w-13rem"
              />
              <Dropdown
                value={statusFilter}
                options={statusFilterOptions}
                onChange={(e) => setStatusFilter(e.value || 'ALL')}
                className="p-inputtext-sm w-11rem"
              />
            </>
          }
          onReset={() => {
            setKeyword('');
            setRoleFilter('ALL');
            setBranchFilter('ALL');
            setStatusFilter('ALL');
          }}
          onRefresh={fetchStaff}
          onExport={handleExport}
        />

        {loading ? (
          <div className="flex flex-column gap-2 mt-3">
            <Skeleton height="2.75rem" />
            <Skeleton height="2.75rem" />
          </div>
        ) : (
          <DataTable<PartnerStaffAccountModel[]>
            value={filteredStaff}
            paginator
            rows={10}
            stripedRows
            responsiveLayout="scroll"
            emptyMessage={t('common.no_data', 'Không có dữ liệu')}
            className="mt-3 p-datatable-sm"
          >
            <Column
              header={t('common.stt', 'STT')}
              body={(_, opt) => opt.rowIndex + 1}
              style={{ width: '3.5rem', textAlign: 'center' }}
            />
            <Column
              header={t('common.actions', 'Thao tác')}
              body={renderRowActions}
              style={{ width: '7rem', textAlign: 'left' }}
              exportable={false}
            />
            <Column
              field="username"
              header={t('partner_portal.username', 'Tài khoản')}
              body={(r: PartnerStaffAccountModel) => (
                <span className="font-bold font-mono text-900">{r.username}</span>
              )}
              sortable
              style={{ minWidth: '10rem' }}
            />
            <Column
              field="fullName"
              header={t('partner_portal.staff_name', 'Họ và tên')}
              body={(r: PartnerStaffAccountModel) => <span className="text-900">{r.fullName}</span>}
              sortable
              style={{ minWidth: '13rem' }}
            />
            <Column
              field="roleCode"
              header={t('partner_portal.role', 'Vai trò')}
              body={(r: PartnerStaffAccountModel) => (
                <span className="text-900">
                  {t(`enum.partner_staff_role.${r.roleCode}`) || r.roleCode || '—'}
                </span>
              )}
              sortable
              style={{ minWidth: '10rem' }}
            />
            <Column
              field="branchName"
              header={t('partner_portal.branch', 'Chi nhánh')}
              body={(r: PartnerStaffAccountModel) => {
                const branch = branches.find((b) => String(b.id) === String(r.branchId));
                return (
                  <span className="text-900">
                    {branch?.branchName || r.branchName || (r.branchId ? `Chi nhánh #${r.branchId}` : t('common.all', 'Tất cả'))}
                  </span>
                );
              }}
              sortable
              style={{ minWidth: '12rem' }}
            />
            <Column
              field="phoneNumber"
              header={t('customer.phone', 'Số điện thoại')}
              body={(r: PartnerStaffAccountModel) => (
                <span className="text-900 font-mono text-xs">{r.phoneNumber || '—'}</span>
              )}
              style={{ minWidth: '10rem' }}
            />
            <Column
              field="status"
              header={t('common.status', 'Trạng thái')}
              body={(r: PartnerStaffAccountModel) => (
                <Tag
                  value={t(r.status === CommonStatus.ACTIVE ? 'common.active' : 'common.inactive')}
                  severity={r.status === CommonStatus.ACTIVE ? 'success' : 'secondary'}
                  className="font-normal"
                />
              )}
              sortable
              style={{ minWidth: '8rem', textAlign: 'center' }}
            />
          </DataTable>
        )}
      </div>

      <Dialog
        visible={showDialog}
        onHide={() => setShowDialog(false)}
        header={formData.id ? t('partner_portal.edit_staff', 'Chỉnh sửa nhân viên') : t('partner_portal.add_staff', 'Thêm mới nhân viên')}
        style={{ width: '38rem' }}
        modal
        className="p-fluid"
      >
        <div className="grid">
          <div className="col-12 md:col-6 field mb-3">
            <label htmlFor="staffUsername" className="text-sm font-medium text-900">
              {t('partner_portal.username', 'Tài khoản')} <span className="text-red-500">*</span>
            </label>
            <InputText
              id="staffUsername"
              value={formData.username || ''}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="font-mono"
              disabled={Boolean(formData.id)}
            />
          </div>
          <div className="col-12 md:col-6 field mb-3">
            <label htmlFor="staffRole" className="text-sm font-medium text-900">
              {t('partner_portal.role', 'Vai trò')} <span className="text-red-500">*</span>
            </label>
            <Dropdown
              id="staffRole"
              value={formData.roleCode}
              options={Object.values(PartnerStaffRole).map((role) => ({
                label: t(`enum.partner_staff_role.${role}`),
                value: role,
              }))}
              onChange={(e) => setFormData({ ...formData, roleCode: e.value })}
              appendTo="self"
            />
          </div>
          <div className="col-12 md:col-6 field mb-3">
            <label htmlFor="staffFullName" className="text-sm font-medium text-900">
              {t('customer.name', 'Họ và tên')} <span className="text-red-500">*</span>
            </label>
            <InputText
              id="staffFullName"
              value={formData.fullName || ''}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            />
          </div>
          <div className="col-12 md:col-6 field mb-3">
            <label htmlFor="staffPhone" className="text-sm font-medium text-900">
              {t('customer.phone', 'Số điện thoại')}
            </label>
            <InputText
              id="staffPhone"
              value={formData.phoneNumber || ''}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              className="font-mono"
            />
          </div>
          <div className="col-12 field mb-3">
            <label htmlFor="staffBranch" className="text-sm font-medium text-900">
              {t('partner_portal.branch_code', 'Chi nhánh trực thuộc')}
            </label>
            <Dropdown
              id="staffBranch"
              value={formData.branchId}
              options={[
                { label: t('common.all_branches', 'Tất cả chi nhánh (Quản lý vùng)'), value: null },
                ...branches.map((b) => ({
                  label: `${b.branchName} (${b.branchCode})`,
                  value: b.id,
                })),
              ]}
              onChange={(e) => {
                const selected = branches.find((b) => b.id === e.value);
                setFormData({
                  ...formData,
                  branchId: e.value,
                  branchName: selected ? selected.branchName : '',
                });
              }}
              placeholder={t('partner_portal.select_branch', 'Chọn chi nhánh')}
              appendTo="self"
            />
          </div>
        </div>
        <div className="flex justify-content-end gap-2 mt-4">
          <Button
            label={t('common.cancel', 'Hủy')}
            icon="pi pi-times"
            outlined
            onClick={() => setShowDialog(false)}
            disabled={submitting}
          />
          <Button
            label={t('common.save', 'Lưu')}
            icon="pi pi-check"
            onClick={handleSave}
            loading={submitting}
            disabled={submitting}
          />
        </div>
      </Dialog>
    </div>
  );
};

export default PartnerStaffAccountsPage;
