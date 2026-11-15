import React, { useEffect, useState, useMemo } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { TabView, TabPanel } from 'primereact/tabview';
import { Tooltip } from 'primereact/tooltip';
import { useTranslation } from 'react-i18next';

import {
  useCreateRole,
  useUpdateRole,
  useGetPermissions,
  IRole,
  IRolePayload,
  IPermission,
} from '@/service/admin/admin';
import useToastService from '@/service/toast/toast-service';

interface RoleFormDialogProps {
  visible: boolean;
  role: IRole | null;
  isEditing: boolean;
  onHide: () => void;
  onSuccess: () => void;
}

// Standard module execution order
const MODULE_ORDER = [
  'USER',
  'ROLE',
  'CATEGORY',
  'CUSTOMER',
  'TIER',
  'POLICY',
  'PARTNER',
  'VOUCHER',
  'CAMPAIGN',
  'GAME',
  'TRANSACTION',
  'CLEARING',
  'APPROVAL',
  'REPORT',
  'SYSTEM_PARAM',
  'AUDIT_LOG',
];

// Fallback metadata for modules
const MODULE_METADATA: Record<string, { label: string; desc: string }> = {
  USER: { label: 'Người dùng Quản trị', desc: 'Quản lý tài khoản CMS, mật khẩu và trạng thái' },
  ROLE: { label: 'Vai trò & Phân quyền', desc: 'Thiết lập vai trò quản trị và ma trận quyền' },
  CATEGORY: { label: 'Danh mục Dùng chung', desc: 'Nhóm danh mục và giá trị master data' },
  CUSTOMER: { label: 'Quản lý Hội viên', desc: 'Hồ sơ 360 hội viên, điểm thưởng và thăng hạng' },
  TIER: { label: 'Hạng Hội viên', desc: 'Tiêu chí xét hạng, hệ số tích điểm và đãi ngộ' },
  POLICY: { label: 'Chính sách Điểm', desc: 'Quy tắc công thức tích/tiêu điểm và tỷ lệ hoàn' },
  PARTNER: { label: 'Đối tác Liên minh', desc: 'Hồ sơ doanh nghiệp liên minh và chi nhánh POS' },
  VOUCHER: { label: 'Kho Voucher & Ưu đãi', desc: 'Đợt phát hành voucher, kho mã và đổi ưu đãi' },
  CAMPAIGN: { label: 'Chiến dịch & Cột mốc', desc: 'Chiến dịch Marketing, cột mốc và ngân sách' },
  GAME: { label: 'GameHub & Vòng quay', desc: 'Minigame, vòng quay may mắn và ngân hàng câu hỏi' },
  TRANSACTION: { label: 'Sổ cái & Giao dịch', desc: 'Bút toán FIFO tích/tiêu điểm và điều chỉnh' },
  CLEARING: { label: 'Quyết toán & Bù trừ', desc: 'Đối soát 3 bên, tính công nợ và quyết toán tiền mặt' },
  APPROVAL: { label: 'Hàng đợi Phê duyệt', desc: 'Kiểm soát kép Maker-Checker cho các đề xuất' },
  REPORT: { label: 'Báo cáo & Phân tích', desc: 'Dashboard KPI, doanh thu và báo cáo quản trị' },
  SYSTEM_PARAM: { label: 'Tham số Hệ thống', desc: 'Cấu hình động bảo mật, hạn mức và vận hành' },
  AUDIT_LOG: { label: 'Nhật ký Kiểm toán', desc: 'Dấu vết thao tác bảo mật phục vụ thanh tra' },
};

const MATRIX_ACTIONS = ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'LOCK', 'APPROVE', 'EXPORT', 'OTHER'];

export const RoleFormDialog: React.FC<RoleFormDialogProps> = ({
  visible,
  role,
  isEditing,
  onHide,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const { showToast } = useToastService();
  const createRoleMutation = useCreateRole();
  const updateRoleMutation = useUpdateRole();
  const { data: permissionsData, isLoading: isLoadingPerms } = useGetPermissions();

  const [activeTab, setActiveTab] = useState(0);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [platform, setPlatform] = useState('WEB_CMS');
  const [scope, setScope] = useState('ALL');
  const [status, setStatus] = useState('ACTIVE');
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');

  const platformOptions = useMemo(
    () => [
      { label: t('role.platform_web_cms', 'Hệ thống Quản trị CMS'), value: 'WEB_CMS' },
      { label: t('role.platform_partner_portal', 'Cổng Đối tác Liên minh'), value: 'PARTNER_PORTAL' },
      { label: t('role.platform_all', 'Tất cả nền tảng'), value: 'ALL' },
    ],
    [t]
  );

  const scopeOptions = useMemo(
    () => [
      { label: t('role.scope_global', 'Toàn hệ thống'), value: 'GLOBAL' },
      { label: t('role.scope_tenant', 'Theo đơn vị thuê bao'), value: 'TENANT' },
      { label: t('role.scope_partner', 'Theo đối tác cụ thể'), value: 'PARTNER' },
      { label: t('role.scope_all', 'Tất cả phạm vi'), value: 'ALL' },
    ],
    [t]
  );

  const statusOptions = useMemo(
    () => [
      { label: t('status.ACTIVE', 'Hoạt động'), value: 'ACTIVE' },
      { label: t('status.INACTIVE', 'Ngừng hoạt động'), value: 'INACTIVE' },
    ],
    [t]
  );

  const allPermissions: IPermission[] = useMemo(() => {
    if (!permissionsData) return [];
    if (Array.isArray(permissionsData)) return permissionsData as any;
    if (permissionsData.data && Array.isArray(permissionsData.data)) return permissionsData.data;
    return [];
  }, [permissionsData]);

  // Matrix allocation: Map<Module, Map<ActionKey, IPermission[]>>
  const moduleMatrix = useMemo(() => {
    const foundModules = Array.from(new Set(allPermissions.map((p) => (p.module || 'SYSTEM').toUpperCase())));

    const sortedModules = [
      ...MODULE_ORDER.filter((m) => foundModules.includes(m)),
      ...foundModules.filter((m) => !MODULE_ORDER.includes(m)),
    ];

    return sortedModules.map((mod) => {
      const permsInMod = allPermissions.filter((p) => (p.module || 'SYSTEM').toUpperCase() === mod);

      const actionMap: Record<string, IPermission[]> = {
        VIEW: [],
        CREATE: [],
        EDIT: [],
        DELETE: [],
        LOCK: [],
        APPROVE: [],
        EXPORT: [],
        OTHER: [],
      };

      permsInMod.forEach((p) => {
        const act = (p.action || '').toUpperCase();
        if (actionMap[act]) {
          actionMap[act].push(p);
        } else {
          actionMap.OTHER.push(p);
        }
      });

      const meta = MODULE_METADATA[mod] || {
        label: mod,
        desc: `Phân hệ chức năng ${mod}`,
      };

      return {
        module: mod,
        label: meta.label,
        desc: meta.desc,
        actionMap,
        allPermIdsInMod: permsInMod.map((p) => p.permissionId),
      };
    });
  }, [allPermissions]);

  // Keyword filter
  const filteredMatrix = useMemo(() => {
    if (!searchKeyword.trim()) return moduleMatrix;
    const kw = searchKeyword.toLowerCase().trim();
    return moduleMatrix.filter((item) => {
      const matchMod = item.module.toLowerCase().includes(kw);
      const matchLabel = item.label.toLowerCase().includes(kw);
      const matchDesc = item.desc.toLowerCase().includes(kw);
      const matchPerms = Object.values(item.actionMap)
        .flat()
        .some((p) => p.code?.toLowerCase().includes(kw) || p.name?.toLowerCase().includes(kw));
      return matchMod || matchLabel || matchDesc || matchPerms;
    });
  }, [moduleMatrix, searchKeyword]);

  useEffect(() => {
    if (visible) {
      setActiveTab(0);
      setSearchKeyword('');
      if (isEditing && role) {
        setCode(role.code);
        setName(role.name);
        setDescription(role.description || '');
        setPlatform(role.platform || 'WEB_CMS');
        setScope(role.scope || 'ALL');
        setStatus(role.status || (role.isActive !== 0 ? 'ACTIVE' : 'INACTIVE'));
        setSelectedPermissionIds(role.permissions?.map((p) => p.permissionId) || []);
      } else {
        setCode('');
        setName('');
        setDescription('');
        setPlatform('WEB_CMS');
        setScope('ALL');
        setStatus('ACTIVE');
        setSelectedPermissionIds([]);
      }
    }
  }, [visible, role, isEditing]);

  const handleTogglePerm = (permId: number) => {
    if (selectedPermissionIds.includes(permId)) {
      setSelectedPermissionIds(selectedPermissionIds.filter((id) => id !== permId));
    } else {
      setSelectedPermissionIds([...selectedPermissionIds, permId]);
    }
  };

  const handleToggleRow = (permIds: number[], isChecked: boolean) => {
    if (isChecked) {
      const newIds = Array.from(new Set([...selectedPermissionIds, ...permIds]));
      setSelectedPermissionIds(newIds);
    } else {
      setSelectedPermissionIds(selectedPermissionIds.filter((id) => !permIds.includes(id)));
    }
  };

  const handleToggleColumn = (actionKey: string) => {
    const colPermIds: number[] = [];
    allPermissions.forEach((p) => {
      const act = (p.action || '').toUpperCase();
      if (actionKey === 'OTHER') {
        if (!['VIEW', 'CREATE', 'EDIT', 'DELETE', 'LOCK', 'APPROVE', 'EXPORT'].includes(act)) {
          colPermIds.push(p.permissionId);
        }
      } else if (act === actionKey) {
        colPermIds.push(p.permissionId);
      }
    });

    const allChecked = colPermIds.length > 0 && colPermIds.every((id) => selectedPermissionIds.includes(id));
    if (allChecked) {
      setSelectedPermissionIds(selectedPermissionIds.filter((id) => !colPermIds.includes(id)));
    } else {
      const newIds = Array.from(new Set([...selectedPermissionIds, ...colPermIds]));
      setSelectedPermissionIds(newIds);
    }
  };

  const handleToggleAllMatrix = () => {
    if (selectedPermissionIds.length === allPermissions.length) {
      setSelectedPermissionIds([]);
    } else {
      setSelectedPermissionIds(allPermissions.map((p) => p.permissionId));
    }
  };

  const handleSelectReadOnly = () => {
    const viewPermIds = allPermissions
      .filter((p) => (p.action || '').toUpperCase() === 'VIEW')
      .map((p) => p.permissionId);
    setSelectedPermissionIds(viewPermIds);
  };

  const handleSelectFullAdmin = () => {
    setSelectedPermissionIds(allPermissions.map((p) => p.permissionId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim() || !name.trim()) {
      showToast({
        severity: 'warn',
        summary: t('common.warning', 'Cảnh báo'),
        detail: t('validate.role_code_required', 'Vui lòng nhập đầy đủ mã và tên vai trò'),
      });
      setActiveTab(0);
      return;
    }

    const payload: IRolePayload = {
      code: code.toUpperCase().trim(),
      name: name.trim(),
      description: description.trim(),
      platform,
      scope,
      status,
      permissionIds: selectedPermissionIds,
    };

    if (isEditing && role) {
      updateRoleMutation.mutate(
        { id: role.roleId, data: payload },
        {
          onSuccess: () => {
            showToast({
              severity: 'success',
              summary: t('common.success', 'Thành công'),
              detail: t('role.update_success', 'Cập nhật vai trò thành công'),
            });
            onSuccess();
            onHide();
          },
          onError: (err: any) => {
            showToast({
              severity: 'error',
              summary: t('common.error', 'Lỗi'),
              detail: err?.response?.data?.message || t('role.update_failed', 'Không thể cập nhật vai trò'),
            });
          },
        }
      );
    } else {
      createRoleMutation.mutate(payload, {
        onSuccess: () => {
          showToast({
            severity: 'success',
            summary: t('common.success', 'Thành công'),
            detail: t('role.create_success', 'Tạo vai trò thành công'),
          });
          onSuccess();
          onHide();
        },
        onError: (err: any) => {
          showToast({
            severity: 'error',
            summary: t('common.error', 'Lỗi'),
            detail: err?.response?.data?.message || t('role.create_failed', 'Không thể tạo vai trò'),
          });
        },
      });
    }
  };

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={
        <div className="flex align-items-center gap-2">
          <i className="pi pi-shield text-primary text-xl" />
          <span className="font-bold text-lg text-900">
            {isEditing ? t('role.edit_title', 'Cập nhật vai trò & phân quyền') : t('role.create_title', 'Thêm mới vai trò')}
          </span>
        </div>
      }
      style={{ width: '1060px', maxWidth: '96vw' }}
      modal
    >
      <Tooltip target=".perm-checkbox-item" position="top" />

      <form onSubmit={handleSubmit} className="flex flex-column gap-2">
        <TabView activeIndex={activeTab} onTabChange={(e) => setActiveTab(e.index)}>
          {/* TAB 1: THÔNG TIN VAI TRÒ */}
          <TabPanel header={t('role.tab_info', 'Thông tin vai trò')} leftIcon="pi pi-id-card mr-2">
            <div className="flex flex-column gap-3 pt-2">
              <div className="grid p-fluid">
                <div className="col-12 md:col-6 flex flex-column gap-1">
                  <label className="text-xs font-semibold text-700">
                    {t('role.code', 'Mã vai trò')} <span className="text-red-500">*</span>
                  </label>
                  <InputText
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder={t('role.code_placeholder', 'Ví dụ: ADMIN, CS_OFFICER, FINANCE_AUDITOR...')}
                    disabled={isEditing}
                    className="p-inputtext-sm font-mono font-semibold"
                  />
                  <small className="text-xs text-500">{t('role.code_hint', 'Mã viết hoa, không dấu, dùng nhận diện trong mã nguồn')}</small>
                </div>

                <div className="col-12 md:col-6 flex flex-column gap-1">
                  <label className="text-xs font-semibold text-700">
                    {t('role.name', 'Tên vai trò')} <span className="text-red-500">*</span>
                  </label>
                  <InputText
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('role.name_placeholder', 'Ví dụ: Quản trị viên hệ thống')}
                    className="p-inputtext-sm font-medium"
                  />
                  <small className="text-xs text-500">{t('role.name_hint', 'Tên định danh hiển thị trên giao diện người dùng')}</small>
                </div>

                <div className="col-12 md:col-4 flex flex-column gap-1">
                  <label className="text-xs font-semibold text-700">{t('role.platform', 'Nền tảng')}</label>
                  <Dropdown
                    value={platform}
                    options={platformOptions}
                    onChange={(e) => setPlatform(e.value)}
                    className="p-inputtext-sm"
                  />
                </div>

                <div className="col-12 md:col-4 flex flex-column gap-1">
                  <label className="text-xs font-semibold text-700">{t('role.scope', 'Phạm vi')}</label>
                  <Dropdown
                    value={scope}
                    options={scopeOptions}
                    onChange={(e) => setScope(e.value)}
                    className="p-inputtext-sm"
                  />
                </div>

                <div className="col-12 md:col-4 flex flex-column gap-1">
                  <label className="text-xs font-semibold text-700">{t('common.status', 'Trạng thái')}</label>
                  <Dropdown
                    value={status}
                    options={statusOptions}
                    onChange={(e) => setStatus(e.value)}
                    className="p-inputtext-sm"
                  />
                </div>

                <div className="col-12 flex flex-column gap-1">
                  <label className="text-xs font-semibold text-700">{t('role.description', 'Mô tả chức năng')}</label>
                  <InputTextarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t('role.desc_placeholder', 'Mô tả chức năng, thẩm quyền và trách nhiệm của vai trò trong quy trình vận hành...')}
                    rows={2}
                    className="p-inputtext-sm"
                  />
                </div>
              </div>

              {/* Thanh điều hướng nhanh sang Ma trận quyền */}
              <div className="surface-50 p-3 border-round border-1 surface-border flex align-items-center justify-content-between mt-2">
                <div className="flex align-items-center gap-3">
                  <div className="w-2rem h-2rem border-round bg-blue-50 flex align-items-center justify-content-center text-blue-700 font-bold border-1 border-blue-200">
                    <i className="pi pi-table" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-900">
                      {t('role.matrix_info', 'Đã phân quyền:')} {selectedPermissionIds.length} / {allPermissions.length} {t('role.perms_suffix', 'quyền')}
                    </div>
                    <div className="text-xs text-500">
                      {t('role.tab_matrix_hint', 'Chuyển sang tab "Phân quyền chi tiết" để cấu hình theo Phân hệ chức năng & Hành động')}
                    </div>
                  </div>
                </div>
                <Button
                  type="button"
                  label={t('role.configure_permissions', 'Phân quyền chi tiết')}
                  icon="pi pi-arrow-right"
                  size="small"
                  outlined
                  onClick={() => setActiveTab(1)}
                  className="p-button-sm font-medium"
                  style={{ width: 'auto' }}
                />
              </div>
            </div>
          </TabPanel>

          {/* TAB 2: MA TRẬN PHÂN QUYỀN CHI TIẾT (MODULE × ACTION) */}
          <TabPanel
            header={
              <div className="flex align-items-center gap-2">
                <i className="pi pi-table" />
                <span>{t('role.tab_matrix', 'Phân quyền chi tiết')} ({selectedPermissionIds.length})</span>
              </div>
            }
          >
            <div className="flex flex-column gap-2 pt-1">
              {/* Toolbar điều khiển ma trận */}
              <div className="flex flex-wrap align-items-center justify-content-between gap-2 p-2 surface-50 border-round border-1 surface-border">
                {/* Ô tìm kiếm */}
                <div className="p-inputgroup flex-1" style={{ maxWidth: '20rem' }}>
                  <span className="p-inputgroup-addon py-1 px-2">
                    <i className="pi pi-search text-500 text-xs" />
                  </span>
                  <InputText
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    placeholder={t('role.search_perms', 'Tìm theo phân hệ, mã quyền, tên...')}
                    className="p-inputtext-sm text-xs"
                    style={{ height: '34px' }}
                  />
                  {searchKeyword && (
                    <Button
                      type="button"
                      icon="pi pi-times"
                      text
                      size="small"
                      onClick={() => setSearchKeyword('')}
                      style={{ width: '34px', height: '34px' }}
                    />
                  )}
                </div>

                {/* Các nút chọn nhanh */}
                <div className="flex align-items-center gap-2 flex-wrap">
                  <Button
                    type="button"
                    label={selectedPermissionIds.length === allPermissions.length ? t('common.unselect_all', 'Bỏ chọn tất cả') : t('common.select_all', 'Chọn tất cả')}
                    icon={selectedPermissionIds.length === allPermissions.length ? 'pi pi-times' : 'pi pi-check-square'}
                    size="small"
                    outlined
                    severity="secondary"
                    onClick={handleToggleAllMatrix}
                    className="p-button-sm text-xs py-1 px-3"
                    style={{ width: 'auto', height: '34px' }}
                  />
                  <Button
                    type="button"
                    label={t('role.view_only', 'Chỉ xem')}
                    icon="pi pi-eye"
                    size="small"
                    outlined
                    severity="secondary"
                    onClick={handleSelectReadOnly}
                    className="p-button-sm text-xs py-1 px-3"
                    style={{ width: 'auto', height: '34px' }}
                  />
                  <Button
                    type="button"
                    label={t('role.full_access', 'Toàn quyền')}
                    icon="pi pi-star"
                    size="small"
                    outlined
                    severity="secondary"
                    onClick={handleSelectFullAdmin}
                    className="p-button-sm text-xs py-1 px-3"
                    style={{ width: 'auto', height: '34px' }}
                  />
                  <span
                    className="text-xs font-semibold px-2 py-1 border-round bg-blue-50 text-blue-700 border-1 border-blue-200 ml-1 white-space-nowrap"
                    style={{ height: '34px', display: 'inline-flex', alignItems: 'center' }}
                  >
                    {selectedPermissionIds.length} / {allPermissions.length} {t('role.perms_suffix', 'quyền')}
                  </span>
                </div>
              </div>

              {/* Bảng Ma trận Phân quyền Chức năng × Hành động */}
              {isLoadingPerms ? (
                <div className="p-5 text-center text-500 text-sm">
                  <i className="pi pi-spin pi-spinner text-xl mr-2 text-primary" />
                  {t('role.loading_matrix', 'Đang tải ma trận quyền hệ thống...')}
                </div>
              ) : (
                <div
                  className="border-round border-1 surface-border overflow-x-auto"
                  style={{ maxHeight: '28rem' }}
                >
                  <table
                    className="w-full text-left"
                    style={{ borderCollapse: 'collapse', minWidth: '950px' }}
                  >
                    {/* Header Columns */}
                    <thead className="surface-100 sticky top-0 z-2 border-bottom-1 surface-border">
                      <tr>
                        {/* Cột 1: Chức năng / Phân hệ */}
                        <th
                          style={{
                            width: '280px',
                            minWidth: '260px',
                            padding: '8px 12px',
                            fontSize: '12px',
                            fontWeight: 600,
                            color: '#475569',
                          }}
                        >
                          {t('role.col_module', 'Phân hệ / Chức năng')}
                        </th>

                        {/* Cột 2-9: Các hành động nghiệp vụ */}
                        {MATRIX_ACTIONS.map((actionKey) => {
                          const colPerms = allPermissions.filter((p) => {
                            const act = (p.action || '').toUpperCase();
                            return actionKey === 'OTHER'
                              ? !['VIEW', 'CREATE', 'EDIT', 'DELETE', 'LOCK', 'APPROVE', 'EXPORT'].includes(act)
                              : act === actionKey;
                          });
                          const isColAllChecked =
                            colPerms.length > 0 &&
                            colPerms.every((p) => selectedPermissionIds.includes(p.permissionId));
                          const isColSomeChecked =
                            colPerms.length > 0 &&
                            colPerms.some((p) => selectedPermissionIds.includes(p.permissionId));
                          const isOther = actionKey === 'OTHER';
                          const colLabel = t(`action.${actionKey}`, actionKey);

                          return (
                            <th
                              key={actionKey}
                              style={{
                                width: isOther ? '140px' : '72px',
                                minWidth: isOther ? '130px' : '68px',
                                padding: '6px 4px',
                                textAlign: 'center',
                                fontSize: '12px',
                                fontWeight: 600,
                                color: '#475569',
                                borderLeft: '1px solid #E2E8F0',
                              }}
                            >
                              <div
                                onClick={() => handleToggleColumn(actionKey)}
                                className="flex flex-column align-items-center gap-1 cursor-pointer hover:surface-200 p-1 border-round select-none transition-colors"
                                title={t('role.toggle_col_tooltip', { col: colLabel, defaultValue: `Nhấp để chọn/bỏ chọn toàn bộ quyền "${colLabel}"` })}
                              >
                                <span className="font-semibold text-xs text-700 white-space-nowrap">{colLabel}</span>
                                <input
                                  type="checkbox"
                                  checked={isColAllChecked}
                                  ref={(el) => {
                                    if (el) el.indeterminate = !isColAllChecked && isColSomeChecked;
                                  }}
                                  onChange={() => {}}
                                  style={{
                                    width: '14px',
                                    height: '14px',
                                    cursor: 'pointer',
                                    accentColor: '#2563EB',
                                  }}
                                />
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>

                    {/* Table Body Rows */}
                    <tbody>
                      {filteredMatrix.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="p-4 text-center text-500 text-xs">
                            {t('role.no_perms_found', 'Không tìm thấy phân hệ hoặc quyền nào phù hợp từ khóa')}
                          </td>
                        </tr>
                      ) : (
                        filteredMatrix.map((rowItem, rIdx) => {
                          const isRowAllChecked =
                            rowItem.allPermIdsInMod.length > 0 &&
                            rowItem.allPermIdsInMod.every((id) => selectedPermissionIds.includes(id));
                          const isRowSomeChecked =
                            rowItem.allPermIdsInMod.length > 0 &&
                            rowItem.allPermIdsInMod.some((id) => selectedPermissionIds.includes(id));
                          const selectedCountInRow = rowItem.allPermIdsInMod.filter((id) =>
                            selectedPermissionIds.includes(id)
                          ).length;

                          return (
                            <tr
                              key={rowItem.module}
                              className={`border-bottom-1 surface-border transition-colors ${
                                rIdx % 2 === 0 ? 'bg-white' : 'surface-50'
                              } hover:surface-100`}
                            >
                              {/* Cột 1: Thông tin phân hệ + Checkbox chọn cả dòng */}
                              <td style={{ padding: '6px 12px', verticalAlign: 'middle' }}>
                                <label
                                  className="flex align-items-center gap-2 cursor-pointer select-none m-0"
                                  title={t(`module.${rowItem.module}_desc`, rowItem.desc)}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isRowAllChecked}
                                    ref={(el) => {
                                      if (el) el.indeterminate = !isRowAllChecked && isRowSomeChecked;
                                    }}
                                    onChange={(e) =>
                                      handleToggleRow(rowItem.allPermIdsInMod, e.target.checked)
                                    }
                                    style={{
                                      width: '15px',
                                      height: '15px',
                                      cursor: 'pointer',
                                      accentColor: '#2563EB',
                                      flexShrink: 0,
                                    }}
                                  />
                                  <span className="font-medium text-xs text-900 white-space-nowrap">
                                    {t(`module.${rowItem.module}`, rowItem.label)}
                                  </span>
                                  <span
                                    className="font-mono text-10 text-500 font-medium px-1 border-round surface-200 white-space-nowrap"
                                    style={{ lineHeight: '16px' }}
                                  >
                                    {rowItem.module}
                                  </span>
                                  <span
                                    className="ml-auto text-10 font-medium px-2 py-0 border-round white-space-nowrap"
                                    style={{
                                      background: selectedCountInRow > 0 ? '#EFF6FF' : '#F1F5F9',
                                      color: selectedCountInRow > 0 ? '#1D4ED8' : '#64748B',
                                      flexShrink: 0,
                                      lineHeight: '18px',
                                    }}
                                  >
                                    {selectedCountInRow}/{rowItem.allPermIdsInMod.length}
                                  </span>
                                </label>
                              </td>

                              {/* Cột 2-9: Các ô hành động */}
                              {MATRIX_ACTIONS.map((actionKey) => {
                                const perms = rowItem.actionMap[actionKey] || [];

                                if (perms.length === 0) {
                                  return (
                                    <td
                                      key={actionKey}
                                      style={{
                                        textAlign: 'center',
                                        verticalAlign: 'middle',
                                        color: '#CBD5E1',
                                        borderLeft: '1px solid #F1F5F9',
                                        padding: '4px',
                                      }}
                                    >
                                      —
                                    </td>
                                  );
                                }

                                return (
                                  <td
                                    key={actionKey}
                                    style={{
                                      textAlign: 'center',
                                      verticalAlign: 'middle',
                                      padding: '4px',
                                      borderLeft: '1px solid #F1F5F9',
                                    }}
                                  >
                                    <div className="flex flex-wrap align-items-center justify-content-center gap-1">
                                      {perms.map((p) => {
                                        const isChecked = selectedPermissionIds.includes(p.permissionId);
                                        const tooltipText = `${p.code}: ${p.name}${p.description ? ` (${p.description})` : ''}`;

                                        return (
                                          <label
                                            key={p.permissionId}
                                            className={`perm-checkbox-item flex align-items-center justify-content-center border-round cursor-pointer transition-colors px-1 py-0.5 m-0 ${
                                              isChecked
                                                ? 'bg-blue-50 border-1 border-blue-200'
                                                : 'hover:surface-200'
                                            }`}
                                            style={{ minWidth: '22px', minHeight: '22px' }}
                                            data-pr-tooltip={tooltipText}
                                            onClick={() => handleTogglePerm(p.permissionId)}
                                          >
                                            <input
                                              type="checkbox"
                                              checked={isChecked}
                                              onChange={() => {}}
                                              style={{
                                                width: '14px',
                                                height: '14px',
                                                cursor: 'pointer',
                                                accentColor: '#2563EB',
                                              }}
                                            />
                                            {actionKey === 'OTHER' && (
                                              <span
                                                className="text-10 font-mono text-600 ml-1 px-1 border-round surface-200 white-space-nowrap"
                                              >
                                                {p.action}
                                              </span>
                                            )}
                                          </label>
                                        );
                                      })}
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabPanel>
        </TabView>

        <div className="flex justify-content-end gap-2 mt-2 pt-2 border-top-1 surface-border">
          <Button
            type="button"
            label={t('common.cancel', 'Hủy')}
            outlined
            severity="secondary"
            size="small"
            onClick={onHide}
            className="p-button-sm font-medium"
            style={{ width: 'auto', minWidth: '85px' }}
          />
          <Button
            type="submit"
            label={t('common.save', 'Lưu')}
            icon="pi pi-check"
            size="small"
            loading={createRoleMutation.isPending || updateRoleMutation.isPending}
            className="p-button-sm font-semibold"
            style={{ width: 'auto', minWidth: '100px' }}
          />
        </div>
      </form>
    </Dialog>
  );
};

export default RoleFormDialog;
