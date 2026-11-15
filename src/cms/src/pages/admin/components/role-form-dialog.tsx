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

const PLATFORM_OPTIONS = [
  { label: 'Hệ thống Quản trị CMS', value: 'WEB_CMS' },
  { label: 'Cổng Đối tác Liên minh', value: 'PARTNER_PORTAL' },
  { label: 'Tất cả nền tảng', value: 'ALL' },
];

const SCOPE_OPTIONS = [
  { label: 'Toàn hệ thống', value: 'GLOBAL' },
  { label: 'Theo đơn vị thuê bao', value: 'TENANT' },
  { label: 'Theo đối tác cụ thể', value: 'PARTNER' },
  { label: 'Tất cả phạm vi', value: 'ALL' },
];

const STATUS_OPTIONS = [
  { label: 'Hoạt động', value: 'ACTIVE' },
  { label: 'Ngừng hoạt động', value: 'INACTIVE' },
];

// Thứ tự phân hệ chức năng chuẩn mực
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

// Thông tin chi tiết phân hệ chức năng
const MODULE_METADATA: Record<string, { label: string; desc: string; icon: string }> = {
  USER: { label: 'Người dùng Quản trị', desc: 'Quản lý tài khoản CMS, mật khẩu và trạng thái', icon: 'pi pi-users' },
  ROLE: { label: 'Vai trò & Phân quyền', desc: 'Thiết lập vai trò quản trị và ma trận quyền', icon: 'pi pi-shield' },
  CATEGORY: { label: 'Danh mục Dùng chung', desc: 'Nhóm danh mục và giá trị master data', icon: 'pi pi-list' },
  CUSTOMER: { label: 'Quản lý Hội viên', desc: 'Hồ sơ 360 hội viên, điểm thưởng và thăng hạng', icon: 'pi pi-user' },
  TIER: { label: 'Hạng Hội viên', desc: 'Tiêu chí xét hạng, hệ số tích điểm và đãi ngộ', icon: 'pi pi-star' },
  POLICY: { label: 'Chính sách Điểm', desc: 'Quy tắc công thức tích/tiêu điểm và tỷ lệ hoàn', icon: 'pi pi-file-edit' },
  PARTNER: { label: 'Đối tác Liên minh', desc: 'Hồ sơ doanh nghiệp liên minh và chi nhánh POS', icon: 'pi pi-building' },
  VOUCHER: { label: 'Kho Voucher & Ưu đãi', desc: 'Đợt phát hành voucher, kho mã và đổi ưu đãi', icon: 'pi pi-ticket' },
  CAMPAIGN: { label: 'Chiến dịch & Cột mốc', desc: 'Chiến dịch Marketing, cột mốc và ngân sách', icon: 'pi pi-megaphone' },
  GAME: { label: 'GameHub & Vòng quay', desc: 'Minigame, vòng quay may mắn và ngân hàng câu hỏi', icon: 'pi pi-play' },
  TRANSACTION: { label: 'Sổ cái & Giao dịch', desc: 'Bút toán FIFO tích/tiêu điểm và điều chỉnh', icon: 'pi pi-history' },
  CLEARING: { label: 'Quyết toán & Bù trừ', desc: 'Đối soát 3 bên, tính công nợ và quyết toán tiền mặt', icon: 'pi pi-wallet' },
  APPROVAL: { label: 'Hàng đợi Phê duyệt', desc: 'Kiểm soát kép Maker-Checker cho các đề xuất', icon: 'pi pi-check-circle' },
  REPORT: { label: 'Báo cáo & Phân tích', desc: 'Dashboard KPI, doanh thu và báo cáo quản trị', icon: 'pi pi-chart-bar' },
  SYSTEM_PARAM: { label: 'Tham số Hệ thống', desc: 'Cấu hình động bảo mật, hạn mức và vận hành', icon: 'pi pi-cog' },
  AUDIT_LOG: { label: 'Nhật ký Kiểm toán', desc: 'Dấu vết thao tác bảo mật phục vụ thanh tra', icon: 'pi pi-eye' },
};

// 7 Hành động nghiệp vụ chuẩn mực + Khác (OTHER)
const MATRIX_COLUMNS: { key: string; label: string; badge: string; color: string }[] = [
  { key: 'VIEW', label: 'Xem', badge: 'VIEW', color: '#1D4ED8' },
  { key: 'CREATE', label: 'Thêm', badge: 'CREATE', color: '#15803D' },
  { key: 'EDIT', label: 'Sửa', badge: 'EDIT', color: '#B45309' },
  { key: 'DELETE', label: 'Xóa', badge: 'DELETE', color: '#B91C1C' },
  { key: 'LOCK', label: 'Khóa', badge: 'LOCK', color: '#475569' },
  { key: 'APPROVE', label: 'Duyệt', badge: 'APPROVE', color: '#047857' },
  { key: 'EXPORT', label: 'Xuất DL', badge: 'EXPORT', color: '#4338CA' },
  { key: 'OTHER', label: 'Khác', badge: 'KHÁC', color: '#6D28D9' },
];

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

  const allPermissions: IPermission[] = useMemo(() => {
    if (!permissionsData) return [];
    if (Array.isArray(permissionsData)) return permissionsData as any;
    if (permissionsData.data && Array.isArray(permissionsData.data)) return permissionsData.data;
    return [];
  }, [permissionsData]);

  // Phân bổ quyền theo ma trận: Map<Module, Map<ActionKey, IPermission[]>>
  const moduleMatrix = useMemo(() => {
    // Thu thập tất cả các module có trong allPermissions
    const foundModules = Array.from(new Set(allPermissions.map((p) => (p.module || 'SYSTEM').toUpperCase())));

    // Sắp xếp theo thứ tự MODULE_ORDER trước, sau đó là các module phát sinh
    const sortedModules = [
      ...MODULE_ORDER.filter((m) => foundModules.includes(m)),
      ...foundModules.filter((m) => !MODULE_ORDER.includes(m)),
    ];

    return sortedModules.map((mod) => {
      const permsInMod = allPermissions.filter((p) => (p.module || 'SYSTEM').toUpperCase() === mod);

      // Phân bổ theo 8 cột
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
        icon: 'pi pi-folder',
      };

      return {
        module: mod,
        label: meta.label,
        desc: meta.desc,
        icon: meta.icon,
        actionMap,
        allPermIdsInMod: permsInMod.map((p) => p.permissionId),
      };
    });
  }, [allPermissions]);

  // Lọc theo từ khóa tìm kiếm
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

  // Bật/tắt 1 quyền cụ thể
  const handleTogglePerm = (permId: number) => {
    if (selectedPermissionIds.includes(permId)) {
      setSelectedPermissionIds(selectedPermissionIds.filter((id) => id !== permId));
    } else {
      setSelectedPermissionIds([...selectedPermissionIds, permId]);
    }
  };

  // Chọn/bỏ chọn toàn bộ quyền của 1 phân hệ (Row Toggle)
  const handleToggleRow = (permIds: number[], isChecked: boolean) => {
    if (isChecked) {
      const newIds = Array.from(new Set([...selectedPermissionIds, ...permIds]));
      setSelectedPermissionIds(newIds);
    } else {
      setSelectedPermissionIds(selectedPermissionIds.filter((id) => !permIds.includes(id)));
    }
  };

  // Chọn/bỏ chọn toàn bộ quyền của 1 hành động trên toàn hệ thống (Column Toggle)
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

  // Chọn tất cả / Bỏ chọn tất cả ma trận
  const handleToggleAllMatrix = () => {
    if (selectedPermissionIds.length === allPermissions.length) {
      setSelectedPermissionIds([]);
    } else {
      setSelectedPermissionIds(allPermissions.map((p) => p.permissionId));
    }
  };

  // Chọn nhanh quyền Chỉ Xem (Read-only)
  const handleSelectReadOnly = () => {
    const viewPermIds = allPermissions
      .filter((p) => (p.action || '').toUpperCase() === 'VIEW')
      .map((p) => p.permissionId);
    setSelectedPermissionIds(viewPermIds);
  };

  // Chọn nhanh Toàn quyền Quản trị (Full Access)
  const handleSelectFullAdmin = () => {
    setSelectedPermissionIds(allPermissions.map((p) => p.permissionId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim() || !name.trim()) {
      showToast({
        severity: 'warn',
        summary: t('common.warning', 'Cảnh báo'),
        detail: 'Vui lòng nhập đầy đủ mã và tên vai trò',
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
              detail: 'Cập nhật vai trò & ma trận phân quyền thành công',
            });
            onSuccess();
            onHide();
          },
          onError: (err: any) => {
            showToast({
              severity: 'error',
              summary: t('common.error', 'Lỗi'),
              detail: err?.response?.data?.message || 'Không thể cập nhật vai trò',
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
            detail: 'Thêm mới vai trò quản trị thành công',
          });
          onSuccess();
          onHide();
        },
        onError: (err: any) => {
          showToast({
            severity: 'error',
            summary: t('common.error', 'Lỗi'),
            detail: err?.response?.data?.message || 'Không thể thêm mới vai trò',
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
          <span className="font-bold text-lg">
            {isEditing ? 'Cập nhật vai trò & Ma trận phân quyền' : 'Thêm mới vai trò & Cấu hình quyền'}
          </span>
        </div>
      }
      style={{ width: '1050px', maxWidth: '98vw' }}
      modal
      className="p-fluid"
    >
      <Tooltip target=".perm-checkbox-item" position="top" />

      <form onSubmit={handleSubmit} className="flex flex-column gap-2">
        <TabView activeIndex={activeTab} onTabChange={(e) => setActiveTab(e.index)}>
          {/* TAB 1: THÔNG TIN VAI TRÒ */}
          <TabPanel header="Thông tin vai trò" leftIcon="pi pi-id-card mr-2">
            <div className="flex flex-column gap-3 pt-2">
              <div className="grid">
                <div className="col-12 md:col-6 flex flex-column gap-1">
                  <label className="text-xs font-semibold text-700">
                    Mã vai trò <span className="text-red-500">*</span>
                  </label>
                  <InputText
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="Ví dụ: ADMIN, CS_OFFICER, FINANCE_AUDITOR..."
                    disabled={isEditing}
                    className="p-inputtext-sm font-mono font-bold"
                  />
                  <small className="text-xs text-500">Mã viết hoa, không dấu, dùng nhận diện trong mã nguồn</small>
                </div>

                <div className="col-12 md:col-6 flex flex-column gap-1">
                  <label className="text-xs font-semibold text-700">
                    Tên hiển thị <span className="text-red-500">*</span>
                  </label>
                  <InputText
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ví dụ: Quản trị viên hệ thống"
                    className="p-inputtext-sm font-medium"
                  />
                  <small className="text-xs text-500">Tên định danh hiển thị trên giao diện người dùng</small>
                </div>

                <div className="col-12 md:col-4 flex flex-column gap-1">
                  <label className="text-xs font-semibold text-700">Nền tảng áp dụng</label>
                  <Dropdown
                    value={platform}
                    options={PLATFORM_OPTIONS}
                    onChange={(e) => setPlatform(e.value)}
                    className="p-inputtext-sm"
                  />
                </div>

                <div className="col-12 md:col-4 flex flex-column gap-1">
                  <label className="text-xs font-semibold text-700">Phạm vi tác động</label>
                  <Dropdown
                    value={scope}
                    options={SCOPE_OPTIONS}
                    onChange={(e) => setScope(e.value)}
                    className="p-inputtext-sm"
                  />
                </div>

                <div className="col-12 md:col-4 flex flex-column gap-1">
                  <label className="text-xs font-semibold text-700">Trạng thái hoạt động</label>
                  <Dropdown
                    value={status}
                    options={STATUS_OPTIONS}
                    onChange={(e) => setStatus(e.value)}
                    className="p-inputtext-sm"
                  />
                </div>

                <div className="col-12 flex flex-column gap-1">
                  <label className="text-xs font-semibold text-700">Mô tả chức trách vai trò</label>
                  <InputTextarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Mô tả chức năng, thẩm quyền và trách nhiệm của vai trò trong quy trình vận hành..."
                    rows={2}
                    className="p-inputtext-sm"
                  />
                </div>
              </div>

              {/* Thanh điều hướng nhanh sang Ma trận quyền */}
              <div className="surface-50 p-3 border-round border-1 surface-border flex align-items-center justify-content-between mt-2">
                <div className="flex align-items-center gap-3">
                  <div className="w-2rem h-2rem border-round bg-blue-100 flex align-items-center justify-content-center text-blue-700 font-bold">
                    <i className="pi pi-table" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-900">
                      Ma trận phân quyền: Đã chọn {selectedPermissionIds.length} / {allPermissions.length} quyền
                    </div>
                    <div className="text-xs text-500">
                      Chuyển sang tab "Phân quyền chi tiết" để cấu hình chi tiết theo Phân hệ chức năng & Hành động
                    </div>
                  </div>
                </div>
                <Button
                  type="button"
                  label="Mở Ma trận phân quyền"
                  icon="pi pi-arrow-right"
                  size="small"
                  outlined
                  onClick={() => setActiveTab(1)}
                  className="p-button-sm font-medium"
                />
              </div>
            </div>
          </TabPanel>

          {/* TAB 2: MA TRẬN PHÂN QUYỀN CHI TIẾT (MODULE × ACTION) */}
          <TabPanel
            header={
              <div className="flex align-items-center gap-2">
                <i className="pi pi-table" />
                <span>Phân quyền chi tiết ({selectedPermissionIds.length})</span>
              </div>
            }
          >
            <div className="flex flex-column gap-2 pt-1">
              {/* Toolbar điều khiển ma trận */}
              <div className="flex flex-wrap align-items-center justify-content-between gap-2 p-2 surface-50 border-round border-1 surface-border">
                {/* Ô tìm kiếm */}
                <div className="p-inputgroup flex-1" style={{ maxWidth: '22rem' }}>
                  <span className="p-inputgroup-addon py-1">
                    <i className="pi pi-search text-500 text-xs" />
                  </span>
                  <InputText
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    placeholder="Tìm theo phân hệ, mã quyền, tên..."
                    className="p-inputtext-sm"
                  />
                  {searchKeyword && (
                    <Button
                      type="button"
                      icon="pi pi-times"
                      text
                      size="small"
                      onClick={() => setSearchKeyword('')}
                    />
                  )}
                </div>

                {/* Các nút chọn nhanh */}
                <div className="flex align-items-center gap-1 flex-wrap">
                  <Button
                    type="button"
                    label={selectedPermissionIds.length === allPermissions.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                    icon={selectedPermissionIds.length === allPermissions.length ? 'pi pi-times' : 'pi pi-check-square'}
                    size="small"
                    outlined
                    severity="secondary"
                    onClick={handleToggleAllMatrix}
                    className="p-button-sm text-xs"
                  />
                  <Button
                    type="button"
                    label="Chỉ xem"
                    icon="pi pi-eye"
                    size="small"
                    outlined
                    severity="info"
                    onClick={handleSelectReadOnly}
                    className="p-button-sm text-xs"
                  />
                  <Button
                    type="button"
                    label="Toàn quyền"
                    icon="pi pi-star"
                    size="small"
                    outlined
                    severity="success"
                    onClick={handleSelectFullAdmin}
                    className="p-button-sm text-xs"
                  />
                  <span className="text-xs font-bold px-2 py-1 border-round bg-blue-100 text-blue-800 ml-1">
                    {selectedPermissionIds.length} / {allPermissions.length} quyền
                  </span>
                </div>
              </div>

              {/* Bảng Ma trận Phân quyền Chức năng × Hành động */}
              {isLoadingPerms ? (
                <div className="p-5 text-center text-500 text-sm">
                  <i className="pi pi-spin pi-spinner text-xl mr-2 text-primary" />
                  Đang tải ma trận quyền hệ thống...
                </div>
              ) : (
                <div
                  className="border-round border-1 surface-border overflow-x-auto"
                  style={{ maxHeight: '27rem' }}
                >
                  <table
                    className="w-full text-left"
                    style={{ borderCollapse: 'collapse', minWidth: '920px' }}
                  >
                    {/* Header Columns */}
                    <thead className="surface-100 sticky top-0 z-2 border-bottom-1 surface-border">
                      <tr>
                        {/* Cột 1: Chức năng / Phân hệ */}
                        <th
                          style={{
                            width: '280px',
                            minWidth: '260px',
                            padding: '10px 12px',
                            fontSize: '12.5px',
                            fontWeight: 700,
                            color: '#0F172A',
                          }}
                        >
                          Phân hệ / Chức năng
                        </th>

                        {/* Cột 2-9: Các hành động nghiệp vụ */}
                        {MATRIX_COLUMNS.map((col) => {
                          const colPerms = allPermissions.filter((p) => {
                            const act = (p.action || '').toUpperCase();
                            return col.key === 'OTHER'
                              ? !['VIEW', 'CREATE', 'EDIT', 'DELETE', 'LOCK', 'APPROVE', 'EXPORT'].includes(act)
                              : act === col.key;
                          });
                          const isColAllChecked =
                            colPerms.length > 0 &&
                            colPerms.every((p) => selectedPermissionIds.includes(p.permissionId));
                          const isColSomeChecked =
                            colPerms.length > 0 &&
                            colPerms.some((p) => selectedPermissionIds.includes(p.permissionId));

                          return (
                            <th
                              key={col.key}
                              style={{
                                width: '90px',
                                minWidth: '85px',
                                padding: '8px 6px',
                                textAlign: 'center',
                                fontSize: '12px',
                                fontWeight: 700,
                                color: col.color,
                                borderLeft: '1px solid #E2E8F0',
                              }}
                            >
                              <div
                                onClick={() => handleToggleColumn(col.key)}
                                className="flex flex-column align-items-center gap-1 cursor-pointer hover:surface-200 p-1 border-round select-none transition-colors"
                                title={`Nhấp để chọn/bỏ chọn toàn bộ quyền "${col.label}"`}
                              >
                                <span className="font-bold text-xs">{col.label}</span>
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
                                    accentColor: col.color,
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
                            Không tìm thấy phân hệ hoặc quyền nào phù hợp từ khóa
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
                              <td style={{ padding: '8px 12px', verticalAlign: 'middle' }}>
                                <label className="flex align-items-center gap-2 cursor-pointer select-none">
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
                                    }}
                                  />
                                  <div className="flex flex-column gap-0">
                                    <div className="flex align-items-center gap-1">
                                      <i className={`${rowItem.icon} text-primary text-xs`} />
                                      <span className="font-bold text-xs text-900">
                                        {rowItem.label}
                                      </span>
                                      <span
                                        className="font-mono text-10 font-bold px-1 border-round"
                                        style={{ background: '#F1F5F9', color: '#475569' }}
                                      >
                                        {rowItem.module}
                                      </span>
                                    </div>
                                    <div
                                      className="text-11 text-500 overflow-hidden text-overflow-ellipsis white-space-nowrap"
                                      style={{ maxWidth: '230px' }}
                                    >
                                      {rowItem.desc}
                                    </div>
                                  </div>
                                  <span
                                    className="ml-auto text-10 font-bold px-2 py-0 border-round"
                                    style={{
                                      background: selectedCountInRow > 0 ? '#DBEAFE' : '#F1F5F9',
                                      color: selectedCountInRow > 0 ? '#1E40AF' : '#64748B',
                                    }}
                                  >
                                    {selectedCountInRow}/{rowItem.allPermIdsInMod.length}
                                  </span>
                                </label>
                              </td>

                              {/* Cột 2-9: Các ô hành động */}
                              {MATRIX_COLUMNS.map((col) => {
                                const perms = rowItem.actionMap[col.key] || [];

                                if (perms.length === 0) {
                                  return (
                                    <td
                                      key={col.key}
                                      style={{
                                        textAlign: 'center',
                                        verticalAlign: 'middle',
                                        color: '#CBD5E1',
                                        borderLeft: '1px solid #F1F5F9',
                                      }}
                                    >
                                      —
                                    </td>
                                  );
                                }

                                return (
                                  <td
                                    key={col.key}
                                    style={{
                                      textAlign: 'center',
                                      verticalAlign: 'middle',
                                      padding: '4px',
                                      borderLeft: '1px solid #F1F5F9',
                                    }}
                                  >
                                    <div className="flex flex-column align-items-center justify-content-center gap-1">
                                      {perms.map((p) => {
                                        const isChecked = selectedPermissionIds.includes(p.permissionId);
                                        const tooltipText = `${p.code}: ${p.name}${p.description ? ` (${p.description})` : ''}`;

                                        return (
                                          <label
                                            key={p.permissionId}
                                            className={`perm-checkbox-item flex align-items-center justify-content-center border-round cursor-pointer transition-colors p-1 ${
                                              isChecked
                                                ? 'bg-blue-100 border-1 border-blue-300'
                                                : 'hover:surface-200'
                                            }`}
                                            style={{ minWidth: '24px', minHeight: '24px' }}
                                            data-pr-tooltip={tooltipText}
                                            onClick={() => handleTogglePerm(p.permissionId)}
                                          >
                                            <input
                                              type="checkbox"
                                              checked={isChecked}
                                              onChange={() => {}}
                                              style={{
                                                width: '15px',
                                                height: '15px',
                                                cursor: 'pointer',
                                                accentColor: '#2563EB',
                                              }}
                                            />
                                            {col.key === 'OTHER' && (
                                              <span
                                                className="text-10 font-bold ml-1 px-1 border-round"
                                                style={{ background: '#EDE9FE', color: '#6D28D9' }}
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
          />
          <Button
            type="submit"
            label={t('common.save', 'Lưu thay đổi')}
            icon="pi pi-check"
            size="small"
            loading={createRoleMutation.isPending || updateRoleMutation.isPending}
            className="p-button-sm font-semibold"
          />
        </div>
      </form>
    </Dialog>
  );
};

export default RoleFormDialog;
