import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { TabView, TabPanel } from 'primereact/tabview';
import { sandboxAdminService, SandboxMenu, SandboxContent } from '@/service/sandbox.service';

export function SandboxMenusPage() {
  const { t } = useTranslation();
  const toast = useRef<Toast>(null);

  const [menus, setMenus] = useState<SandboxMenu[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Create Menu Dialog
  const [showCreateMenuDialog, setShowCreateMenuDialog] = useState<boolean>(false);
  const [menuForm, setMenuForm] = useState<Partial<SandboxMenu>>({
    name: '',
    path: '',
    icon: 'LuFileText',
    menuOrder: 1,
  });

  // Edit Content Dialog
  const [showContentDialog, setShowContentDialog] = useState<boolean>(false);
  const [selectedMenu, setSelectedMenu] = useState<SandboxMenu | null>(null);
  const [contentForm, setContentForm] = useState<Partial<SandboxContent>>({
    title: '',
    bodyMarkdown: '',
    codeDemo: '',
    testAccountInfo: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const list = await sandboxAdminService.getMenus();
      setMenus(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenEditContent = async (menu: SandboxMenu) => {
    if (!menu.id) return;
    setSelectedMenu(menu);
    try {
      const content = await sandboxAdminService.getContent(menu.id);
      setContentForm(content);
    } catch {
      setContentForm({
        menuId: menu.id,
        title: menu.name,
        bodyMarkdown: `# ${menu.name}\n\n${t('sandbox.default_body_content')}`,
        codeDemo: 'curl -X POST "https://api.miotp.io.vn/api/v1/otp/verify"',
        testAccountInfo: 'Base URL: https://api.miotp.io.vn/api/v1',
      });
    }
    setShowContentDialog(true);
  };

  const handleSaveContent = async () => {
    if (!selectedMenu || !selectedMenu.id) return;
    try {
      await sandboxAdminService.saveContent(selectedMenu.id, {
        ...contentForm,
        menuId: selectedMenu.id,
      } as SandboxContent);
      toast.current?.show({
        severity: 'success',
        summary: t('common.success'),
        detail: t('sandbox.save_content_success'),
        life: 2500,
      });
      setShowContentDialog(false);
    } catch {
      toast.current?.show({
        severity: 'error',
        summary: t('common.error'),
        detail: t('sandbox.save_content_failed'),
        life: 2500,
      });
    }
  };

  const handleSaveMenu = async () => {
    if (!menuForm.name || !menuForm.path) {
      toast.current?.show({
        severity: 'warn',
        summary: t('common.warning'),
        detail: t('sandbox.enter_menu_and_path'),
        life: 2500,
      });
      return;
    }

    try {
      await sandboxAdminService.createMenu(menuForm as SandboxMenu);
      toast.current?.show({
        severity: 'success',
        summary: t('common.success'),
        detail: t('sandbox.create_menu_success'),
        life: 2500,
      });
      setShowCreateMenuDialog(false);
      loadData();
    } catch {
      toast.current?.show({
        severity: 'error',
        summary: t('common.error'),
        detail: t('sandbox.create_menu_failed'),
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
          <h1 className="text-xl md:text-2xl font-semibold text-900 m-0">{t('sandbox.menus_title')}</h1>
          <p className="text-xs text-500 m-0 mt-1 font-medium">
            {t('sandbox.menus_subtitle')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button label={t('common.refresh')} icon="pi pi-refresh" outlined onClick={loadData} className="p-button-sm font-medium" />
          <Button
            label={t('sandbox.add_menu_btn')}
            icon="pi pi-plus"
            onClick={() => {
              setMenuForm({ name: '', path: '/docs/' + (menus.length + 1), icon: 'LuFileText', menuOrder: menus.length + 1 });
              setShowCreateMenuDialog(true);
            }}
            className="p-button-sm font-semibold border-none"
            style={{ background: '#FF6B00', color: '#ffffff' }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="surface-card p-4 border-round-2xl border-1 surface-border shadow-1">
        <DataTable value={menus} loading={loading} paginator rows={10} emptyMessage={t('sandbox.no_menus')} className="p-datatable-sm">
          <Column field="menuOrder" header={t('common.stt')} style={{ width: '80px' }} />
          <Column field="name" header={t('sandbox.menu_name')} body={(r: SandboxMenu) => <span className="font-semibold text-900">{r.name}</span>} />
          <Column field="path" header={t('sandbox.route_path')} body={(r: SandboxMenu) => <span className="font-mono text-xs text-600">{r.path}</span>} />
          <Column
            header={t('common.actions')}
            body={(r: SandboxMenu) => (
              <div className="flex gap-2">
                <Button
                  label={t('sandbox.edit_content_btn')}
                  icon="pi pi-pencil"
                  size="small"
                  outlined
                  onClick={() => handleOpenEditContent(r)}
                />
              </div>
            )}
          />
        </DataTable>
      </div>

      {/* Content Editor Dialog */}
      <Dialog
        header={t('sandbox.edit_content_dialog_header', { name: selectedMenu?.name || '' })}
        visible={showContentDialog}
        style={{ width: '85vw', maxWidth: '1100px' }}
        maximized
        onHide={() => setShowContentDialog(false)}
        footer={
          <div className="flex justify-content-end gap-2">
            <Button label={t('common.cancel')} severity="secondary" outlined onClick={() => setShowContentDialog(false)} />
            <Button
              label={t('sandbox.save_article_btn')}
              icon="pi pi-save"
              onClick={handleSaveContent}
              style={{ background: '#FF6B00', borderColor: '#FF6B00', color: '#ffffff' }}
            />
          </div>
        }
      >
        <div className="flex flex-column gap-3 mt-2">
          <div>
            <label className="text-xs font-semibold text-700 block mb-1">{t('sandbox.article_title_label')}</label>
            <InputText
              value={contentForm.title || ''}
              onChange={(e) => setContentForm({ ...contentForm, title: e.target.value })}
              className="w-full p-inputtext-sm font-semibold"
            />
          </div>

          <TabView>
            <TabPanel header={t('sandbox.tab_markdown')}>
              <div className="flex flex-column gap-1">
                <span className="text-xs text-500">{t('sandbox.markdown_editor_hint')}</span>
                <InputTextarea
                  value={contentForm.bodyMarkdown || ''}
                  onChange={(e) => setContentForm({ ...contentForm, bodyMarkdown: e.target.value })}
                  rows={16}
                  className="w-full font-mono text-xs p-3 surface-50"
                  style={{ minHeight: '380px' }}
                />
              </div>
            </TabPanel>

            <TabPanel header={t('sandbox.tab_code_demo')}>
              <div className="flex flex-column gap-1">
                <span className="text-xs text-500">{t('sandbox.code_demo_hint')}</span>
                <InputTextarea
                  value={contentForm.codeDemo || ''}
                  onChange={(e) => setContentForm({ ...contentForm, codeDemo: e.target.value })}
                  rows={14}
                  className="w-full font-mono text-xs p-3 surface-900 text-slate-100"
                />
              </div>
            </TabPanel>

            <TabPanel header={t('sandbox.tab_credentials')}>
              <div className="flex flex-column gap-1">
                <span className="text-xs text-500">{t('sandbox.credentials_hint')}</span>
                <InputTextarea
                  value={contentForm.testAccountInfo || ''}
                  onChange={(e) => setContentForm({ ...contentForm, testAccountInfo: e.target.value })}
                  rows={10}
                  className="w-full font-mono text-xs p-3 surface-50"
                />
              </div>
            </TabPanel>
          </TabView>
        </div>
      </Dialog>

      {/* Create Menu Dialog */}
      <Dialog
        header={t('sandbox.create_menu_dialog_header')}
        visible={showCreateMenuDialog}
        style={{ width: '480px' }}
        onHide={() => setShowCreateMenuDialog(false)}
        footer={
          <div className="flex justify-content-end gap-2">
            <Button label={t('common.cancel')} severity="secondary" outlined onClick={() => setShowCreateMenuDialog(false)} />
            <Button
              label={t('sandbox.create_menu_submit')}
              icon="pi pi-check"
              onClick={handleSaveMenu}
              style={{ background: '#FF6B00', borderColor: '#FF6B00', color: '#ffffff' }}
            />
          </div>
        }
      >
        <div className="flex flex-column gap-3 mt-2">
          <div>
            <label className="text-xs font-semibold text-700 block mb-1">{t('sandbox.menu_name_label')}</label>
            <InputText
              value={menuForm.name}
              onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })}
              placeholder={t('sandbox.menu_name_placeholder')}
              className="w-full p-inputtext-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-700 block mb-1">{t('sandbox.menu_route_label')}</label>
            <InputText
              value={menuForm.path}
              onChange={(e) => setMenuForm({ ...menuForm, path: e.target.value })}
              placeholder={t('sandbox.menu_route_placeholder')}
              className="w-full p-inputtext-sm font-mono"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-700 block mb-1">{t('sandbox.menu_order_label')}</label>
            <InputText
              type="number"
              value={String(menuForm.menuOrder || 1)}
              onChange={(e) => setMenuForm({ ...menuForm, menuOrder: parseInt(e.target.value) || 1 })}
              className="w-full p-inputtext-sm"
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}

export default SandboxMenusPage;
