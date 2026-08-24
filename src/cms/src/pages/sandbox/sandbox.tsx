import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TabView, TabPanel } from 'primereact/tabview';
import { SandboxUsersPage } from '@/pages/admin/sandbox/users';
import { SandboxGroupsPage } from '@/pages/admin/sandbox/groups';
import { SandboxMenusPage } from '@/pages/admin/sandbox/menus';

export function SandboxHubPage() {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="surface-ground p-3 md:p-4 min-h-screen">
      {/* Page Header */}
      <div className="surface-card p-4 shadow-1 border-round-xl mb-4 border-1 surface-border">
        <div className="flex flex-column md:flex-row justify-content-between align-items-start md:align-items-center gap-3">
          <div>
            <div className="flex align-items-center gap-2 mb-1">
              <span className="text-xs font-semibold px-2 py-1 border-round bg-orange-50 text-orange-600 border-1 border-orange-200">
                Developer Ecosystem
              </span>
              <span className="text-xs text-500 font-medium">Smart OTP Platform • Sandbox Admin</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-900 m-0">
              Quản Lý Hệ Thống Developer Sandbox
            </h1>
            <p className="text-sm text-600 mt-1 mb-0 font-medium">
              Quản lý tài khoản lập trình viên đối tác, phân quyền nhóm và cấu hình bài viết tài liệu tích hợp (giống hệ thống DIP)
            </p>
          </div>

          <div className="flex align-items-center gap-2">
            <a
              href="https://sandbox.miotp.io.vn"
              target="_blank"
              rel="noreferrer"
              className="p-button p-component p-button-outlined p-button-sm p-button-warning flex align-items-center gap-2 text-decoration-none"
            >
              <i className="pi pi-external-link" />
              <span className="font-semibold">Mở Cổng Sandbox Portal</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main TabView Management */}
      <div className="surface-card p-2 md:p-3 shadow-1 border-round-xl border-1 surface-border">
        <TabView activeIndex={activeIndex} onTabChange={(e) => setActiveIndex(e.index)}>
          <TabPanel
            header="Tài Khoản Đối Tác (Users)"
            leftIcon="pi pi-users mr-2"
          >
            <SandboxUsersPage />
          </TabPanel>

          <TabPanel
            header="Nhóm & Phân Quyền (Groups)"
            leftIcon="pi pi-sitemap mr-2"
          >
            <SandboxGroupsPage />
          </TabPanel>

          <TabPanel
            header="Menu & Bài Viết Tài Liệu (Menus & Content)"
            leftIcon="pi pi-file-edit mr-2"
          >
            <SandboxMenusPage />
          </TabPanel>
        </TabView>
      </div>
    </div>
  );
}

export default SandboxHubPage;
