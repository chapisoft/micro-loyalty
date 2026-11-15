import React, { useEffect, useState, useMemo } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { TabView, TabPanel } from 'primereact/tabview';
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
  { label: 'Hệ thống Quản trị CMS (WEB_CMS)', value: 'WEB_CMS' },
  { label: 'Cổng Đối tác Liên minh (PARTNER_PORTAL)', value: 'PARTNER_PORTAL' },
  { label: 'Tất cả nền tảng (ALL)', value: 'ALL' },
];

const SCOPE_OPTIONS = [
  { label: 'Toàn hệ thống (GLOBAL)', value: 'GLOBAL' },
  { label: 'Theo đơn vị thuê bao (TENANT)', value: 'TENANT' },
  { label: 'Theo đối tác cụ thể (PARTNER)', value: 'PARTNER' },
  { label: 'Tất cả phạm vi (ALL)', value: 'ALL' },
];

const STATUS_OPTIONS = [
  { label: 'Hoạt động (ACTIVE)', value: 'ACTIVE' },
  { label: 'Ngừng hoạt động (INACTIVE)', value: 'INACTIVE' },
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
  const [permSearch, setPermSearch] = useState('');

  const allPermissions: IPermission[] = useMemo(() => {
    if (!permissionsData) return [];
    if (Array.isArray(permissionsData)) return permissionsData as any;
    if (permissionsData.data && Array.isArray(permissionsData.data)) return permissionsData.data;
    return [];
  }, [permissionsData]);

  // Group permissions by module
  const permissionGroups = useMemo(() => {
    const filtered = allPermissions.filter((p) => {
      if (!permSearch.trim()) return true;
      const kw = permSearch.toLowerCase().trim();
      return (
        p.code?.toLowerCase().includes(kw) ||
        p.name?.toLowerCase().includes(kw) ||
        p.module?.toLowerCase().includes(kw) ||
        p.description?.toLowerCase().includes(kw)
      );
    });

    const groups: Record<string, IPermission[]> = {};
    filtered.forEach((p) => {
      const mod = p.module || 'SYSTEM';
      if (!groups[mod]) {
        groups[mod] = [];
      }
      groups[mod].push(p);
    });

    return Object.entries(groups).map(([moduleName, perms]) => ({
      module: moduleName,
      permissions: perms,
    }));
  }, [allPermissions, permSearch]);

  useEffect(() => {
    if (visible) {
      setActiveTab(0);
      setPermSearch('');
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

  const handleToggleModule = (modulePermIds: number[], isChecked: boolean) => {
    if (isChecked) {
      const newIds = Array.from(new Set([...selectedPermissionIds, ...modulePermIds]));
      setSelectedPermissionIds(newIds);
    } else {
      setSelectedPermissionIds(
        selectedPermissionIds.filter((id) => !modulePermIds.includes(id))
      );
    }
  };

  const handleSelectAllAll = () => {
    if (selectedPermissionIds.length === allPermissions.length) {
      setSelectedPermissionIds([]);
    } else {
      setSelectedPermissionIds(allPermissions.map((p) => p.permissionId));
    }
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
              detail: 'Cập nhật vai trò thành công',
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
            detail: 'Thêm mới vai trò thành công',
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
      header={isEditing ? 'Cập nhật vai trò quản trị' : 'Thêm mới vai trò quản trị'}
      style={{ width: '800px', maxWidth: '95vw' }}
      modal
      className="p-fluid"
    >
      <form onSubmit={handleSubmit} className="flex flex-column gap-3">
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
                    placeholder="Ví dụ: ADMIN, CS_OFFICER, FINANCE..."
                    disabled={isEditing}
                    className="p-inputtext-sm font-mono font-bold"
                  />
                  <small className="text-xs text-500">Mã viết hoa, không dấu, dùng phân quyền</small>
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
                </div>

                <div className="col-12 md:col-6 flex flex-column gap-1">
                  <label className="text-xs font-semibold text-700">Nền tảng áp dụng</label>
                  <Dropdown
                    value={platform}
                    options={PLATFORM_OPTIONS}
                    onChange={(e) => setPlatform(e.value)}
                    className="p-inputtext-sm"
                  />
                </div>

                <div className="col-12 md:col-6 flex flex-column gap-1">
                  <label className="text-xs font-semibold text-700">Phạm vi tác động</label>
                  <Dropdown
                    value={scope}
                    options={SCOPE_OPTIONS}
                    onChange={(e) => setScope(e.value)}
                    className="p-inputtext-sm"
                  />
                </div>

                <div className="col-12 md:col-6 flex flex-column gap-1">
                  <label className="text-xs font-semibold text-700">Trạng thái</label>
                  <Dropdown
                    value={status}
                    options={STATUS_OPTIONS}
                    onChange={(e) => setStatus(e.value)}
                    className="p-inputtext-sm"
                  />
                </div>

                <div className="col-12 flex flex-column gap-1">
                  <label className="text-xs font-semibold text-700">Mô tả vai trò</label>
                  <InputTextarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Mô tả chức trách và nhiệm vụ của vai trò này..."
                    rows={3}
                    className="p-inputtext-sm"
                  />
                </div>
              </div>

              <div className="surface-50 p-3 border-round border-1 surface-border flex align-items-center justify-content-between mt-2">
                <div className="flex align-items-center gap-2">
                  <i className="pi pi-shield text-primary text-xl" />
                  <div>
                    <div className="text-sm font-bold text-900">
                      Đã chọn {selectedPermissionIds.length} / {allPermissions.length} quyền
                    </div>
                    <div className="text-xs text-500">Chuyển sang tab "Phân quyền chi tiết" để gán chức năng</div>
                  </div>
                </div>
                <Button
                  type="button"
                  label="Cấu hình quyền"
                  icon="pi pi-arrow-right"
                  size="small"
                  outlined
                  onClick={() => setActiveTab(1)}
                  className="p-button-sm font-medium"
                />
              </div>
            </div>
          </TabPanel>

          {/* TAB 2: PHÂN QUYỀN CHI TIẾT */}
          <TabPanel
            header={`Phân quyền chi tiết (${selectedPermissionIds.length})`}
            leftIcon="pi pi-shield mr-2"
          >
            <div className="flex flex-column gap-3 pt-2">
              <div className="flex flex-wrap align-items-center justify-content-between gap-2">
                <span className="p-input-icon-left flex-1" style={{ maxWidth: '20rem' }}>
                  <i className="pi pi-search text-400" />
                  <InputText
                    value={permSearch}
                    onChange={(e) => setPermSearch(e.target.value)}
                    placeholder="Tìm theo mã quyền, tên, phân hệ..."
                    className="p-inputtext-sm w-full"
                  />
                </span>

                <div className="flex align-items-center gap-2">
                  <Button
                    type="button"
                    label={
                      selectedPermissionIds.length === allPermissions.length
                        ? 'Bỏ chọn tất cả'
                        : 'Chọn tất cả'
                    }
                    size="small"
                    outlined
                    severity="secondary"
                    onClick={handleSelectAllAll}
                    className="p-button-sm font-medium"
                  />
                  <span className="text-xs font-semibold px-2 py-1 border-round bg-blue-50 text-blue-700">
                    {selectedPermissionIds.length} / {allPermissions.length} quyền
                  </span>
                </div>
              </div>

              {isLoadingPerms ? (
                <div className="p-4 text-center text-500 text-sm">Đang tải danh sách quyền...</div>
              ) : (
                <div className="flex flex-column gap-3 max-h-24rem overflow-y-auto pr-1">
                  {permissionGroups.map((group) => {
                    const groupPermIds = group.permissions.map((p) => p.permissionId);
                    const allInGroupChecked = groupPermIds.every((id) =>
                      selectedPermissionIds.includes(id)
                    );
                    const someInGroupChecked = groupPermIds.some((id) =>
                      selectedPermissionIds.includes(id)
                    );

                    return (
                      <div
                        key={group.module}
                        className="border-round border-1 surface-border overflow-hidden"
                      >
                        {/* Module header */}
                        <div className="surface-100 p-2 px-3 flex align-items-center justify-content-between border-bottom-1 surface-border">
                          <label className="flex align-items-center gap-2 cursor-pointer font-bold text-sm text-900 select-none">
                            <input
                              type="checkbox"
                              checked={allInGroupChecked}
                              ref={(el) => {
                                if (el) el.indeterminate = !allInGroupChecked && someInGroupChecked;
                              }}
                              onChange={(e) => handleToggleModule(groupPermIds, e.target.checked)}
                              className="cursor-pointer"
                              style={{ width: '15px', height: '15px' }}
                            />
                            <span>{group.module}</span>
                          </label>
                          <span className="text-xs font-medium text-600 bg-white px-2 py-0 border-round border-1 surface-border">
                            {groupPermIds.filter((id) => selectedPermissionIds.includes(id)).length} /{' '}
                            {groupPermIds.length}
                          </span>
                        </div>

                        {/* Module 2-column permissions grid */}
                        <div className="grid p-2 m-0 surface-card">
                          {group.permissions.map((perm) => {
                            const isChecked = selectedPermissionIds.includes(perm.permissionId);
                            return (
                              <div key={perm.permissionId} className="col-12 md:col-6 p-1">
                                <label
                                  onClick={() => handleTogglePerm(perm.permissionId)}
                                  className={`flex align-items-start gap-2 p-2 border-round border-1 cursor-pointer transition-colors transition-duration-150 h-full select-none ${
                                    isChecked
                                      ? 'bg-blue-50 border-blue-200'
                                      : 'surface-ground surface-border hover:surface-100'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {}}
                                    className="cursor-pointer mt-1"
                                    style={{ width: '15px', height: '15px' }}
                                  />
                                  <div className="flex flex-column gap-0 flex-1">
                                    <div className="flex align-items-center gap-1 justify-content-between">
                                      <span className="font-mono text-xs font-bold text-900">
                                        {perm.code}
                                      </span>
                                      {perm.action && (
                                        <span className="text-10 font-bold px-1 border-round bg-gray-100 text-500 uppercase">
                                          {perm.action}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-xs text-700 font-medium">{perm.name}</div>
                                    {perm.description && (
                                      <div className="text-xs text-400">{perm.description}</div>
                                    )}
                                  </div>
                                </label>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
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
            label={t('common.save', 'Lưu')}
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
