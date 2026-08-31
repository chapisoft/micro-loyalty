import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { Checkbox } from 'primereact/checkbox';
import { sandboxAdminService, SandboxGroup, SandboxMenu } from '@/service/sandbox.service';

export function SandboxGroupsPage() {
  const { t } = useTranslation();
  const toast = useRef<Toast>(null);

  const [groups, setGroups] = useState<SandboxGroup[]>([]);
  const [menus, setMenus] = useState<SandboxMenu[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Dialog State
  const [showCreateDialog, setShowCreateDialog] = useState<boolean>(false);
  const [showPermissionDialog, setShowPermissionDialog] = useState<boolean>(false);
  const [selectedGroup, setSelectedGroup] = useState<SandboxGroup | null>(null);
  const [selectedMenuIds, setSelectedMenuIds] = useState<number[]>([]);

  const [formData, setFormData] = useState<Partial<SandboxGroup>>({
    name: '',
    description: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [gList, mList] = await Promise.all([
        sandboxAdminService.getGroups(),
        sandboxAdminService.getMenus(),
      ]);
      setGroups(gList);
      setMenus(mList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenPermissions = (group: SandboxGroup) => {
    setSelectedGroup(group);
    setSelectedMenuIds(group.menuIds || []);
    setShowPermissionDialog(true);
  };

  const handleToggleMenu = (menuId: number) => {
    setSelectedMenuIds((prev) =>
      prev.includes(menuId) ? prev.filter((id) => id !== menuId) : [...prev, menuId]
    );
  };

  const handleSavePermissions = async () => {
    if (!selectedGroup || !selectedGroup.id) return;
    try {
      await sandboxAdminService.assignGroupMenus(selectedGroup.id, selectedMenuIds);
      toast.current?.show({
        severity: 'success',
        summary: t('common.success', { defaultValue: 'Thành công' }),
        detail: t('sandbox.save_permissions_success', { defaultValue: 'Đã lưu phân quyền menu bài viết cho nhóm đối tác' }),
        life: 2500,
      });
      setShowPermissionDialog(false);
      loadData();
    } catch (e) {
      toast.current?.show({
        severity: 'error',
        summary: t('common.error', { defaultValue: 'Lỗi' }),
        detail: t('sandbox.save_permissions_failed', { defaultValue: 'Không thể lưu phân quyền' }),
        life: 2500,
      });
    }
  };

  const handleSaveGroup = async () => {
    if (!formData.name) {
      toast.current?.show({
        severity: 'warn',
        summary: t('common.warning', { defaultValue: 'Thiếu thông tin' }),
        detail: t('sandbox.enter_group_name', { defaultValue: 'Vui lòng nhập tên nhóm đối tác' }),
        life: 2500,
      });
      return;
    }

    try {
      await sandboxAdminService.createGroup(formData as SandboxGroup);
      toast.current?.show({
        severity: 'success',
        summary: t('common.success', { defaultValue: 'Thành công' }),
        detail: t('sandbox.create_group_success', { defaultValue: 'Đã tạo nhóm đối tác mới' }),
        life: 2500,
      });
      setShowCreateDialog(false);
      loadData();
    } catch (e) {
      toast.current?.show({
        severity: 'error',
        summary: t('common.error', { defaultValue: 'Lỗi' }),
        detail: t('sandbox.create_group_failed', { defaultValue: 'Không thể tạo nhóm' }),
        life: 2500,
      });
    }
  };

  return (
    <div className="p-3 md:p-4 surface-ground min-h-screen">
      <Toast ref={toast} />

      {/* Header */}
      <div className="flex flex-column md:flex-row justify-content-between align-items-start md:align-items-center mb-4 gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-900 m-0">{t('sandbox.groups_title', { defaultValue: 'Quản Lý Nhóm & Phân Quyền Sandbox' })}</h1>
          <p className="text-xs text-500 m-0 mt-1 font-medium">
            {t('sandbox.groups_subtitle', { defaultValue: 'Tạo nhóm đối tác và phân quyền xem các danh mục menu & bài viết hướng dẫn' })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button label={t('common.refresh', { defaultValue: 'Làm mới' })} icon="pi pi-refresh" outlined onClick={loadData} className="p-button-sm font-medium" />
          <Button
            label={t('sandbox.create_group_btn', { defaultValue: 'Tạo Nhóm Mới' })}
            icon="pi pi-plus"
            onClick={() => {
              setFormData({ name: '', description: '' });
              setShowCreateDialog(true);
            }}
            className="p-button-sm font-semibold border-none"
            style={{ background: '#FF6B00', color: '#ffffff' }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="surface-card p-4 border-round-2xl border-1 surface-border shadow-1">
        <DataTable value={groups} loading={loading} paginator rows={10} emptyMessage={t('sandbox.no_groups', { defaultValue: 'Chưa có nhóm nào' })} className="p-datatable-sm">
          <Column field="name" header={t('sandbox.group_name', { defaultValue: 'Tên nhóm đối tác' })} body={(r: SandboxGroup) => <span className="font-semibold text-900">{r.name}</span>} />
          <Column field="description" header={t('common.description', { defaultValue: 'Mô tả' })} />
          <Column
            header={t('sandbox.assigned_menus_count', { defaultValue: 'Số Menu Phân Quyền' })}
            body={(r: SandboxGroup) => <span className="font-mono font-semibold text-orange-600">{(r.menuIds || []).length} {t('sandbox.menus_unit', { defaultValue: 'Menu' })}</span>}
          />
          <Column
            header={t('common.actions', { defaultValue: 'Thao tác' })}
            body={(r: SandboxGroup) => (
              <Button
                label={t('sandbox.assign_menu_btn', { defaultValue: 'Phân quyền Menu' })}
                icon="pi pi-shield"
                size="small"
                outlined
                onClick={() => handleOpenPermissions(r)}
              />
            )}
          />
        </DataTable>
      </div>

      {/* Permission Assignment Dialog */}
      <Dialog
        header={t('sandbox.permission_dialog_header', { name: selectedGroup?.name || '', defaultValue: `Phân Quyền Menu Bài Viết Cho Nhóm: ${selectedGroup?.name}` })}
        visible={showPermissionDialog}
        style={{ width: '560px' }}
        onHide={() => setShowPermissionDialog(false)}
        footer={
          <div className="flex justify-content-end gap-2">
            <Button label={t('common.cancel', { defaultValue: 'Hủy' })} severity="secondary" outlined onClick={() => setShowPermissionDialog(false)} />
            <Button
              label={t('sandbox.save_permissions_btn', { defaultValue: 'Lưu Phân Quyền' })}
              icon="pi pi-check"
              onClick={handleSavePermissions}
              style={{ background: '#FF6B00', borderColor: '#FF6B00', color: '#ffffff' }}
            />
          </div>
        }
      >
        <p className="text-xs text-500 mb-3 font-medium">{t('sandbox.select_menus_hint', { defaultValue: 'Chọn các danh mục tài liệu & menu mà đối tác trong nhóm này được phép xem:' })}</p>
        <div className="flex flex-column gap-2 max-h-20rem overflow-y-auto border-1 surface-border p-3 border-round-xl">
          {menus.map((m) => {
            const isChecked = selectedMenuIds.includes(m.id || 0);
            return (
              <div
                key={m.id}
                className="flex align-items-center justify-content-between p-2 border-round surface-50 hover:surface-100 cursor-pointer"
                onClick={() => m.id && handleToggleMenu(m.id)}
              >
                <div className="flex align-items-center gap-2">
                  <Checkbox checked={isChecked} onChange={() => m.id && handleToggleMenu(m.id)} />
                  <span className="text-sm font-semibold text-800">{m.name}</span>
                </div>
                <span className="font-mono text-xs text-500">{m.path}</span>
              </div>
            );
          })}
        </div>
      </Dialog>

      {/* Create Group Dialog */}
      <Dialog
        header={t('sandbox.create_group_dialog_header', { defaultValue: 'Tạo Mới Nhóm Đối Tác' })}
        visible={showCreateDialog}
        style={{ width: '480px' }}
        onHide={() => setShowCreateDialog(false)}
        footer={
          <div className="flex justify-content-end gap-2">
            <Button label={t('common.cancel', { defaultValue: 'Hủy' })} severity="secondary" outlined onClick={() => setShowCreateDialog(false)} />
            <Button
              label={t('sandbox.create_group_submit', { defaultValue: 'Tạo Nhóm' })}
              icon="pi pi-check"
              onClick={handleSaveGroup}
              style={{ background: '#FF6B00', borderColor: '#FF6B00', color: '#ffffff' }}
            />
          </div>
        }
      >
        <div className="flex flex-column gap-3 mt-2">
          <div>
            <label className="text-xs font-semibold text-700 block mb-1">{t('sandbox.group_name_label', { defaultValue: 'Tên nhóm *' })}</label>
            <InputText
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="VD: Banking Partners High Security"
              className="w-full p-inputtext-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-700 block mb-1">{t('sandbox.group_desc_label', { defaultValue: 'Mô tả nhóm' })}</label>
            <InputText
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t('sandbox.group_desc_placeholder', { defaultValue: 'Mô tả phạm vi hoặc phân khúc đối tác...' })}
              className="w-full p-inputtext-sm"
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}

export default SandboxGroupsPage;
