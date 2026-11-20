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
        summary: t('common.success'),
        detail: t('sandbox.save_permissions_success'),
        life: 2500,
      });
      setShowPermissionDialog(false);
      loadData();
    } catch {
      toast.current?.show({
        severity: 'error',
        summary: t('common.error'),
        detail: t('sandbox.save_permissions_failed'),
        life: 2500,
      });
    }
  };

  const handleSaveGroup = async () => {
    if (!formData.name) {
      toast.current?.show({
        severity: 'warn',
        summary: t('common.warning'),
        detail: t('sandbox.enter_group_name'),
        life: 2500,
      });
      return;
    }

    try {
      await sandboxAdminService.createGroup(formData as SandboxGroup);
      toast.current?.show({
        severity: 'success',
        summary: t('common.success'),
        detail: t('sandbox.create_group_success'),
        life: 2500,
      });
      setShowCreateDialog(false);
      loadData();
    } catch {
      toast.current?.show({
        severity: 'error',
        summary: t('common.error'),
        detail: t('sandbox.create_group_failed'),
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
          <h1 className="text-xl md:text-2xl font-semibold text-900 m-0">{t('sandbox.groups_title')}</h1>
          <p className="text-xs text-500 m-0 mt-1 font-medium">
            {t('sandbox.groups_subtitle')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button label={t('common.refresh')} icon="pi pi-refresh" outlined onClick={loadData} className="p-button-sm font-medium" />
          <Button
            label={t('sandbox.create_group_btn')}
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
      <div className="surface-card p-4 border-round-xl border-1 surface-border shadow-1">
        <DataTable value={groups} loading={loading} paginator rows={10} emptyMessage={t('sandbox.no_groups')} className="p-datatable-sm">
          <Column
            header={t('common.order_number', 'STT')}
            body={(_, options) => (
              <span className="font-mono text-xs text-600 font-normal">
                {options.rowIndex + 1}
              </span>
            )}
            style={{ width: '4rem', textAlign: 'center' }}
          />
          <Column
            header={t('common.action', 'Thao tác')}
            body={(r: SandboxGroup) => (
              <Button
                label={t('sandbox.assign_menu_btn')}
                icon="pi pi-shield"
                size="small"
                outlined
                onClick={() => handleOpenPermissions(r)}
              />
            )}
            style={{ width: '10rem', textAlign: 'center' }}
          />
          <Column field="name" header={t('sandbox.group_name')} body={(r: SandboxGroup) => <span className="font-bold text-900">{r.name}</span>} />
          <Column field="description" header={t('common.description')} body={(r: SandboxGroup) => <span className="text-900">{r.description || '--'}</span>} />
          <Column
            header={t('sandbox.assigned_menus_count')}
            body={(r: SandboxGroup) => <span className="font-mono text-900">{(r.menuIds || []).length} {t('sandbox.menus_unit')}</span>}
            style={{ width: '9rem', textAlign: 'center' }}
          />
        </DataTable>
      </div>

      {/* Permission Assignment Dialog */}
      <Dialog
        header={t('sandbox.permission_dialog_header', { name: selectedGroup?.name || '' })}
        visible={showPermissionDialog}
        style={{ width: '560px' }}
        onHide={() => setShowPermissionDialog(false)}
        footer={
          <div className="flex justify-content-end gap-2">
            <Button label={t('common.cancel')} severity="secondary" outlined onClick={() => setShowPermissionDialog(false)} />
            <Button
              label={t('sandbox.save_permissions_btn')}
              icon="pi pi-check"
              onClick={handleSavePermissions}
              style={{ background: '#FF6B00', borderColor: '#FF6B00', color: '#ffffff' }}
            />
          </div>
        }
      >
        <p className="text-xs text-500 mb-3 font-medium">{t('sandbox.select_menus_hint')}</p>
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
        header={t('sandbox.create_group_dialog_header')}
        visible={showCreateDialog}
        style={{ width: '480px' }}
        onHide={() => setShowCreateDialog(false)}
        footer={
          <div className="flex justify-content-end gap-2">
            <Button label={t('common.cancel')} severity="secondary" outlined onClick={() => setShowCreateDialog(false)} />
            <Button
              label={t('sandbox.create_group_submit')}
              icon="pi pi-check"
              onClick={handleSaveGroup}
              style={{ background: '#FF6B00', borderColor: '#FF6B00', color: '#ffffff' }}
            />
          </div>
        }
      >
        <div className="flex flex-column gap-3 mt-2">
          <div>
            <label className="text-xs font-semibold text-700 block mb-1">{t('sandbox.group_name_label')}</label>
            <InputText
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={t('sandbox.group_name')}
              className="w-full p-inputtext-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-700 block mb-1">{t('sandbox.group_desc_label')}</label>
            <InputText
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t('sandbox.group_desc_placeholder')}
              className="w-full p-inputtext-sm"
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}

export default SandboxGroupsPage;
