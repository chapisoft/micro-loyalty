import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dialog } from 'primereact/dialog';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { sandboxAdminService, SandboxUser, SandboxGroup } from '@/service/sandbox.service';

export enum SandboxUserStatus {
  APPROVED = 'APPROVED',
  PENDING = 'PENDING',
  LOCKED = 'LOCKED',
  REJECTED = 'REJECTED',
}

export function SandboxUsersPage() {
  const { t } = useTranslation();
  const toast = useRef<Toast>(null);

  const [users, setUsers] = useState<SandboxUser[]>([]);
  const [groups, setGroups] = useState<SandboxGroup[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');

  // Dialog State
  const [showDialog, setShowDialog] = useState<boolean>(false);
  const [formData, setFormData] = useState<Partial<SandboxUser>>({
    username: '',
    fullName: '',
    email: '',
    phone: '',
    password: '',
    status: SandboxUserStatus.APPROVED,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [uList, gList] = await Promise.all([
        sandboxAdminService.getUsers(),
        sandboxAdminService.getGroups(),
      ]);
      setUsers(uList);
      setGroups(gList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (id: number) => {
    try {
      await sandboxAdminService.approveUser(id);
      toast.current?.show({
        severity: 'success',
        summary: 'Thành công',
        detail: 'Đã duyệt tài khoản thành công',
        life: 2500,
      });
      loadData();
    } catch (e) {
      toast.current?.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể duyệt tài khoản',
        life: 2500,
      });
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'LOCKED' ? 'APPROVED' : 'LOCKED';
    try {
      await sandboxAdminService.toggleUserStatus(id, nextStatus);
      toast.current?.show({
        severity: 'info',
        summary: 'Cập nhật',
        detail: `Đã chuyển trạng thái tài khoản sang ${nextStatus}`,
        life: 2500,
      });
      loadData();
    } catch (e) {
      toast.current?.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể đổi trạng thái',
        life: 2500,
      });
    }
  };

  const handleSaveUser = async () => {
    if (!formData.username || !formData.fullName) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Thiếu thông tin',
        detail: 'Vui lòng nhập tên đăng nhập và họ tên đối tác',
        life: 2500,
      });
      return;
    }

    try {
      await sandboxAdminService.createUser(formData as SandboxUser);
      toast.current?.show({
        severity: 'success',
        summary: 'Thành công',
        detail: 'Đã tạo tài khoản Sandbox cho đối tác',
        life: 2500,
      });
      setShowDialog(false);
      loadData();
    } catch (e) {
      toast.current?.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể tạo tài khoản',
        life: 2500,
      });
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-3 md:p-4 surface-ground min-h-screen">
      <Toast ref={toast} />

      {/* Header */}
      <div className="flex flex-column md:flex-row justify-content-between align-items-start md:align-items-center mb-4 gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-900 m-0">Quản Lý Tài Khoản Sandbox (Developers)</h1>
          <p className="text-xs text-500 m-0 mt-1 font-medium">
            Quản lý tài khoản lập trình viên và đối tác truy cập cổng Sandbox Portal Smart OTP
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            label="Làm mới"
            icon="pi pi-refresh"
            outlined
            onClick={loadData}
            className="p-button-sm font-medium"
          />
          <Button
            label="Thêm Tài Khoản"
            icon="pi pi-plus"
            onClick={() => {
              setFormData({
                username: '',
                fullName: '',
                email: '',
                phone: '',
                password: 'Dev@123456',
                status: 'APPROVED',
              });
              setShowDialog(true);
            }}
            className="p-button-sm font-semibold border-none"
            style={{ background: '#FF6B00', color: '#ffffff' }}
          />
        </div>
      </div>

      {/* Main Table Card */}
      <div className="surface-card p-4 border-round-2xl border-1 surface-border shadow-1">
        <div className="flex justify-content-between align-items-center mb-3">
          <span className="p-input-icon-left w-full md:w-20rem">
            <i className="pi pi-search" />
            <InputText
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm tài khoản, email..."
              className="w-full p-inputtext-sm"
            />
          </span>
          <span className="text-xs text-500 font-medium">Tổng: {filteredUsers.length} tài khoản</span>
        </div>

        <DataTable
          value={filteredUsers}
          loading={loading}
          paginator
          rows={10}
          emptyMessage="Chưa có tài khoản Sandbox nào"
          className="p-datatable-sm"
        >
          <Column field="username" header="Tên đăng nhập" body={(r: SandboxUser) => <span className="font-semibold text-900">{r.username}</span>} />
          <Column field="fullName" header="Họ và tên / Đơn vị" />
          <Column field="email" header="Email" body={(r: SandboxUser) => r.email || '-'} />
          <Column field="phone" header="Số điện thoại" body={(r: SandboxUser) => r.phone || '-'} />
          <Column
            header="Nhóm quyền"
            body={(r: SandboxUser) => (
              <div className="flex flex-wrap gap-1">
                {r.groupNames && r.groupNames.length > 0 ? (
                  r.groupNames.map((g, idx) => <Tag key={idx} value={g} severity="info" className="text-xs" />)
                ) : (
                  <span className="text-xs text-400">Chưa gán</span>
                )}
              </div>
            )}
          />
          <Column
            field="status"
            header="Trạng thái"
            body={(r: SandboxUser) => {
              const statusMap: Record<string, { label: string; severity: 'success' | 'warning' | 'danger' | 'info' }> = {
                APPROVED: { label: 'Đã duyệt', severity: 'success' },
                PENDING: { label: 'Chờ duyệt', severity: 'warning' },
                LOCKED: { label: 'Đã khóa', severity: 'danger' },
                REJECTED: { label: 'Từ chối', severity: 'danger' },
              };
              const item = statusMap[r.status] || { label: r.status, severity: 'info' };
              return <Tag value={item.label} severity={item.severity} className="font-semibold text-xs" />;
            }}
          />
          <Column
            header="Thao tác"
            body={(r: SandboxUser) => (
              <div className="flex gap-2">
                {r.status === SandboxUserStatus.PENDING && (
                  <Button
                    label="Duyệt"
                    icon="pi pi-check"
                    severity="success"
                    size="small"
                    outlined
                    onClick={() => r.id && handleApprove(r.id)}
                  />
                )}
                <Button
                  label={r.status === SandboxUserStatus.LOCKED ? 'Mở khóa' : 'Khóa'}
                  icon={r.status === SandboxUserStatus.LOCKED ? 'pi pi-lock-open' : 'pi pi-lock'}
                  severity={r.status === SandboxUserStatus.LOCKED ? 'info' : 'danger'}
                  size="small"
                  outlined
                  onClick={() => r.id && handleToggleStatus(r.id, r.status)}
                />
              </div>
            )}
          />
        </DataTable>
      </div>

      {/* Create Dialog */}
      <Dialog
        header="Tạo Mới Tài Khoản Sandbox Cho Đối Tác"
        visible={showDialog}
        style={{ width: '480px' }}
        onHide={() => setShowDialog(false)}
        footer={
          <div className="flex justify-content-end gap-2">
            <Button label="Hủy" severity="secondary" outlined onClick={() => setShowDialog(false)} />
            <Button
              label="Tạo Tài Khoản"
              icon="pi pi-check"
              onClick={handleSaveUser}
              style={{ background: '#FF6B00', borderColor: '#FF6B00', color: '#ffffff' }}
            />
          </div>
        }
      >
        <div className="flex flex-column gap-3 mt-2">
          <div>
            <label className="text-xs font-semibold text-700 block mb-1">Tên đăng nhập (Username) *</label>
            <InputText
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="VD: dev_acb_bank"
              className="w-full p-inputtext-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-700 block mb-1">Mật khẩu khởi tạo</label>
            <InputText
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Mặc định: Dev@123456"
              className="w-full p-inputtext-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-700 block mb-1">Họ tên / Đơn vị đại diện *</label>
            <InputText
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="VD: ACB Fintech Team"
              className="w-full p-inputtext-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-700 block mb-1">Email</label>
            <InputText
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="developer@acb.com.vn"
              className="w-full p-inputtext-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-700 block mb-1">Số điện thoại</label>
            <InputText
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="0988123456"
              className="w-full p-inputtext-sm"
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}

export default SandboxUsersPage;
