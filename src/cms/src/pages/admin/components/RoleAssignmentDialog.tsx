import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { useTranslation } from 'react-i18next';
import { IUser, useGetRoles, useAssignRoles, IRole } from '@/service/admin/admin';
import useToastService from '@/service/toast/toast-service';

interface RoleAssignmentDialogProps {
  visible: boolean;
  user: IUser | null;
  onHide: () => void;
  onSuccess: () => void;
}

export const RoleAssignmentDialog: React.FC<RoleAssignmentDialogProps> = ({
  visible,
  user,
  onHide,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const { showToast } = useToastService();
  const { data: rolesData, isLoading: isLoadingRoles } = useGetRoles();
  const assignRolesMutation = useAssignRoles();

  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);

  const allRoles = ((rolesData?.data || rolesData?.roles || []) as IRole[]).filter(
    (r) => r.isActive !== 0
  );

  useEffect(() => {
    if (user && visible) {
      const currentRoleIds = user.roles ? user.roles.map((r) => r.roleId) : [];
      setSelectedRoleIds(currentRoleIds);
    }
  }, [user, visible]);

  const handleToggle = (roleId: number) => {
    if (selectedRoleIds.includes(roleId)) {
      setSelectedRoleIds(selectedRoleIds.filter((id) => id !== roleId));
    } else {
      setSelectedRoleIds([...selectedRoleIds, roleId]);
    }
  };

  const handleSave = () => {
    if (!user) return;
    if (selectedRoleIds.length === 0) {
      showToast({
        severity: 'warn',
        summary: t('common.warning', 'Cảnh báo'),
        detail: 'Vui lòng chọn ít nhất 1 vai trò',
      });
      return;
    }

    assignRolesMutation.mutate(
      {
        id: user.userId,
        roleIds: selectedRoleIds,
      },
      {
        onSuccess: () => {
          showToast({
            severity: 'success',
            summary: t('common.success', 'Thành công'),
            detail: 'Cập nhật vai trò người dùng thành công',
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
  };

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={t('user.assign_roles_title', 'Gán vai trò cho người dùng')}
      style={{ width: '540px' }}
      modal
    >
      <div className="flex flex-column gap-3 py-2">
        <div className="surface-50 p-3 border-round border-1 surface-border">
          <div className="text-xs text-500 mb-1">{t('user.user_label', 'Người dùng:')}</div>
          <div className="font-bold text-900 text-base">{user?.fullName} ({user?.username})</div>
          <div className="text-xs text-600">{user?.email}</div>
        </div>

        <div>
          <div className="text-xs font-semibold text-700 uppercase tracking-wider mb-2">
            {t('user.available_roles_count', {
              selected: selectedRoleIds.length,
              total: allRoles.length,
              defaultValue: `Danh sách vai trò khả dụng (${selectedRoleIds.length}/${allRoles.length} đã chọn)`,
            })}
          </div>

          {isLoadingRoles ? (
            <div className="p-3 text-center text-500 text-xs">{t('common.loading', 'Đang tải...')}</div>
          ) : (
            <div className="flex flex-column gap-2 max-h-20rem overflow-y-auto pr-1">
              {allRoles.map((role) => {
                const isSelected = selectedRoleIds.includes(role.roleId);
                return (
                  <div
                    key={role.roleId}
                    onClick={() => handleToggle(role.roleId)}
                    className={`flex align-items-center justify-content-between p-2 border-round border-1 cursor-pointer transition-colors transition-duration-150 select-none ${
                      isSelected
                        ? 'bg-blue-50 border-blue-200'
                        : 'surface-card surface-border hover:surface-100'
                    }`}
                  >
                    <div className="flex align-items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="cursor-pointer"
                        style={{ width: '16px', height: '16px' }}
                      />
                      <div>
                        <div className="flex align-items-center gap-2">
                          <span className="font-mono text-xs font-bold text-900">{role.code}</span>
                          <span className="text-sm font-medium text-800">
                            {t(`role.name_${role.code}`, role.name)}
                          </span>
                        </div>
                        {role.description && (
                          <div className="text-xs text-500">
                            {t(`role.desc_${role.code}`, role.description)}
                          </div>
                        )}
                      </div>
                    </div>
                    {role.platform && (
                      <span className="text-xs px-2 py-1 border-round bg-gray-100 text-600">
                        {role.platform}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-content-end gap-2 mt-3">
          <Button
            type="button"
            label={t('common.cancel', 'Hủy')}
            outlined
            severity="secondary"
            size="small"
            onClick={onHide}
          />
          <Button
            type="button"
            label={t('common.save', 'Lưu')}
            icon="pi pi-check"
            size="small"
            loading={assignRolesMutation.isPending}
            onClick={handleSave}
          />
        </div>
      </div>
    </Dialog>
  );
};
