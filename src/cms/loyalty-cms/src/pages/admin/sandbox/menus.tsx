import React, { useState, useEffect, useRef } from 'react';
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
    } catch (e) {
      setContentForm({
        menuId: menu.id,
        title: menu.name,
        bodyMarkdown: `# ${menu.name}\n\nNội dung hướng dẫn...`,
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
        summary: 'Thành công',
        detail: 'Đã lưu nội dung tài liệu hướng dẫn thành công',
        life: 2500,
      });
      setShowContentDialog(false);
    } catch (e) {
      toast.current?.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể lưu nội dung',
        life: 2500,
      });
    }
  };

  const handleSaveMenu = async () => {
    if (!menuForm.name || !menuForm.path) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Thiếu thông tin',
        detail: 'Vui lòng nhập tên menu và đường dẫn',
        life: 2500,
      });
      return;
    }

    try {
      await sandboxAdminService.createMenu(menuForm as SandboxMenu);
      toast.current?.show({
        severity: 'success',
        summary: 'Thành công',
        detail: 'Đã tạo menu Sandbox mới',
        life: 2500,
      });
      setShowCreateMenuDialog(false);
      loadData();
    } catch (e) {
      toast.current?.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể tạo menu',
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
          <h1 className="text-xl md:text-2xl font-semibold text-900 m-0">Quản Lý Menu & Bài Viết Sandbox</h1>
          <p className="text-xs text-500 m-0 mt-1 font-medium">
            Quản lý cấu trúc danh mục tài liệu tích hợp và trình soạn thảo Markdown / Code Demo
          </p>
        </div>
        <div className="flex gap-2">
          <Button label="Làm mới" icon="pi pi-refresh" outlined onClick={loadData} className="p-button-sm font-medium" />
          <Button
            label="Thêm Menu Mới"
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
        <DataTable value={menus} loading={loading} paginator rows={10} emptyMessage="Chưa có menu nào" className="p-datatable-sm">
          <Column field="menuOrder" header="Thứ tự" style={{ width: '80px' }} />
          <Column field="name" header="Tên danh mục Menu" body={(r: SandboxMenu) => <span className="font-semibold text-900">{r.name}</span>} />
          <Column field="path" header="Đường dẫn (Route)" body={(r: SandboxMenu) => <span className="font-mono text-xs text-600">{r.path}</span>} />
          <Column
            header="Thao tác"
            body={(r: SandboxMenu) => (
              <div className="flex gap-2">
                <Button
                  label="Soạn thảo Nội dung"
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
        header={`Soạn Thảo Bài Viết Tích Hợp: ${selectedMenu?.name}`}
        visible={showContentDialog}
        style={{ width: '85vw', maxWidth: '1100px' }}
        maximized
        onHide={() => setShowContentDialog(false)}
        footer={
          <div className="flex justify-content-end gap-2">
            <Button label="Hủy" severity="secondary" outlined onClick={() => setShowContentDialog(false)} />
            <Button
              label="Lưu Bài Viết"
              icon="pi pi-save"
              onClick={handleSaveContent}
              style={{ background: '#FF6B00', borderColor: '#FF6B00', color: '#ffffff' }}
            />
          </div>
        }
      >
        <div className="flex flex-column gap-3 mt-2">
          <div>
            <label className="text-xs font-semibold text-700 block mb-1">Tiêu đề bài viết (Title) *</label>
            <InputText
              value={contentForm.title || ''}
              onChange={(e) => setContentForm({ ...contentForm, title: e.target.value })}
              className="w-full p-inputtext-sm font-semibold"
            />
          </div>

          <TabView>
            <TabPanel header="Nội dung Markdown (Body)">
              <div className="flex flex-column gap-1">
                <span className="text-xs text-500">Soạn thảo nội dung theo chuẩn Markdown hỗ trợ Code block, Alerts, Headers:</span>
                <InputTextarea
                  value={contentForm.bodyMarkdown || ''}
                  onChange={(e) => setContentForm({ ...contentForm, bodyMarkdown: e.target.value })}
                  rows={16}
                  className="w-full font-mono text-xs p-3 surface-50"
                  style={{ minHeight: '380px' }}
                />
              </div>
            </TabPanel>

            <TabPanel header="Mã Nguồn Mẫu (Code Demo)">
              <div className="flex flex-column gap-1">
                <span className="text-xs text-500">Mã cURL hoặc SDK mẫu cho menu này:</span>
                <InputTextarea
                  value={contentForm.codeDemo || ''}
                  onChange={(e) => setContentForm({ ...contentForm, codeDemo: e.target.value })}
                  rows={14}
                  className="w-full font-mono text-xs p-3 surface-900 text-slate-100"
                />
              </div>
            </TabPanel>

            <TabPanel header="Thông Tin Tài Khoản Test (Credentials)">
              <div className="flex flex-column gap-1">
                <span className="text-xs text-500">Các tham số test: Base URL, Partner Code, Secret Key...</span>
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
        header="Thêm Menu Sandbox Mới"
        visible={showCreateMenuDialog}
        style={{ width: '480px' }}
        onHide={() => setShowCreateMenuDialog(false)}
        footer={
          <div className="flex justify-content-end gap-2">
            <Button label="Hủy" severity="secondary" outlined onClick={() => setShowCreateMenuDialog(false)} />
            <Button
              label="Tạo Menu"
              icon="pi pi-check"
              onClick={handleSaveMenu}
              style={{ background: '#FF6B00', borderColor: '#FF6B00', color: '#ffffff' }}
            />
          </div>
        }
      >
        <div className="flex flex-column gap-3 mt-2">
          <div>
            <label className="text-xs font-semibold text-700 block mb-1">Tên menu *</label>
            <InputText
              value={menuForm.name}
              onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })}
              placeholder="VD: 6. Tích hợp Webhook Callbacks"
              className="w-full p-inputtext-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-700 block mb-1">Đường dẫn Route *</label>
            <InputText
              value={menuForm.path}
              onChange={(e) => setMenuForm({ ...menuForm, path: e.target.value })}
              placeholder="VD: /docs/6"
              className="w-full p-inputtext-sm font-mono"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-700 block mb-1">Thứ tự hiển thị (Order)</label>
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
