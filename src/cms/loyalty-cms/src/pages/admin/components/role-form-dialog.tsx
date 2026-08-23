import React, { useEffect, useMemo } from 'react';
import { useCreateRole, useUpdateRole, useGetPermissions, IRole, IRolePayload } from '@/service/admin/admin';
import useToastService from '@/service/toast/toast-service';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { t } from 'i18next';
import './role-form-dialog.scss';

const roleSchema = z.object({
  code: z.string().min(1, { message: t('validate.role_code_required') }),
  name: z.string().min(1, { message: t('validate.role_name_required') }),
  description: z.string().optional(),
  permissionIds: z.array(z.number()).optional(),
});

type RoleFormValues = z.infer<typeof roleSchema>;

interface RoleFormDialogProps {
  visible: boolean;
  role: IRole | null;
  isEditing: boolean;
  onHide: () => void;
  onSuccess: () => void;
}

const RoleFormDialog: React.FC<RoleFormDialogProps> = ({
  visible,
  role,
  isEditing,
  onHide,
  onSuccess,
}) => {
  const { showToast } = useToastService();
  const createRoleMutation = useCreateRole();
  const updateRoleMutation = useUpdateRole();
  const { data: permissionsData } = useGetPermissions();
  const permissionOptions = (Array.isArray(permissionsData?.data) ? permissionsData.data : []) as any[];
  const permissionGroups = useMemo(() => {
    const sortedPermissions = [...permissionOptions].sort((a: any, b: any) => {
      const moduleA = String(a?.module || '').toUpperCase();
      const moduleB = String(b?.module || '').toUpperCase();
      if (moduleA !== moduleB) return moduleA.localeCompare(moduleB);

      const actionA = String(a?.action || '').toUpperCase();
      const actionB = String(b?.action || '').toUpperCase();
      if (actionA !== actionB) return actionA.localeCompare(actionB);

      return String(a?.name || '').localeCompare(String(b?.name || ''));
    });

    return sortedPermissions.reduce(
      (acc: Array<{ module: string; permissions: any[] }>, permission: any) => {
        const moduleName = permission?.module || 'OTHER';
        const existing = acc.find((group) => group.module === moduleName);
        if (existing) {
          existing.permissions.push(permission);
        } else {
          acc.push({ module: moduleName, permissions: [permission] });
        }
        return acc;
      },
      []
    );
  }, [permissionOptions]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RoleFormValues>({
    defaultValues: {
      code: '',
      name: '',
      description: '',
      permissionIds: [],
    },
    resolver: zodResolver(roleSchema),
  });

  useEffect(() => {
    if (isEditing && role) {
      reset({
        code: role.code,
        name: role.name,
        description: role.description,
        permissionIds: role.permissions?.map((p) => p.permissionId) || [],
      });
    } else {
      reset({
        code: '',
        name: '',
        description: '',
        permissionIds: [],
      });
    }
  }, [visible, role, isEditing, reset]);

  const onSubmit = (data: RoleFormValues) => {
    const payload: IRolePayload = {
      code: data.code,
      name: data.name,
      description: data.description || '',
      permissionIds: data.permissionIds,
    };

    if (isEditing && role) {
      updateRoleMutation.mutate(
        { id: role.roleId, data: payload },
        {
          onSuccess: () => {
            showToast({
              severity: 'success',
              summary: t('common.success'),
              detail: t('role.update_success'),
            });
            onSuccess();
          },
          onError: (error: any) => {
            showToast({
              severity: 'error',
              summary: t('common.error'),
              detail: error?.response?.data?.message || t('role.update_failed'),
            });
          },
        }
      );
    } else {
      createRoleMutation.mutate(payload, {
        onSuccess: () => {
          showToast({
            severity: 'success',
            summary: t('common.success'),
            detail: t('role.create_success'),
          });
          onSuccess();
        },
        onError: (error: any) => {
          showToast({
            severity: 'error',
            summary: t('common.error'),
            detail: error?.response?.data?.message || t('role.create_failed'),
          });
        },
      });
    }
  };

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={isEditing ? t('role.edit_role') : t('role.create_role')}
      modal
      className="role-form-dialog"
      style={{ width: '65vw', maxWidth: '980px' }}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="form-content">
        <div className="form-group">
          <label>{t('role.code')}</label>
          <Controller
            name="code"
            control={control}
            render={({ field }) => (
              <InputText
                {...field}
                disabled={isEditing}
                className={errors.code ? 'p-invalid' : ''}
              />
            )}
          />
          {errors.code && <span className="error-message">{errors.code.message}</span>}
        </div>

        <div className="form-group">
          <label>{t('role.name')}</label>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <InputText {...field} className={errors.name ? 'p-invalid' : ''} />
            )}
          />
          {errors.name && <span className="error-message">{errors.name.message}</span>}
        </div>

        <div className="form-group">
          <label>{t('role.description')}</label>
          <Controller
            name="description"
            control={control}
            render={({ field }) => <InputTextarea {...field} rows={3} />}
          />
        </div>

        <div className="form-group">
          <label>{t('role.permissions')}</label>
          <Controller
            name="permissionIds"
            control={control}
            render={({ field }) => {
              const selectedPermissionIds: number[] = Array.isArray(field.value) ? field.value : [];

              const togglePermission = (permissionId: number) => {
                if (selectedPermissionIds.includes(permissionId)) {
                  field.onChange(selectedPermissionIds.filter((id) => id !== permissionId));
                } else {
                  field.onChange([...selectedPermissionIds, permissionId]);
                }
              };

              return (
                <div className="permissions-list-view">
                  {permissionGroups.map((group) => {
                    const selectedCount = group.permissions.filter((p) => selectedPermissionIds.includes(p.permissionId)).length;

                    return (
                      <div key={group.module} className="permission-group">
                        <div className="permission-group-header">
                          <span className="permission-module">{group.module}</span>
                          <span className="permission-count">{selectedCount}/{group.permissions.length}</span>
                        </div>

                        <div className="permission-items">
                          {group.permissions.map((permission) => {
                            const checked = selectedPermissionIds.includes(permission.permissionId);
                            return (
                              <label key={permission.permissionId} className="permission-item">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => togglePermission(permission.permissionId)}
                                />
                                <span className="permission-item-content">
                                  <span className="permission-name">{permission.name}</span>
                                  <span className="permission-meta">{permission.action}.{permission.code}</span>
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            }}
          />
        </div>

        <div className="dialog-footer">
          <Button
            label={t('common.cancel')}
            icon="pi pi-times"
            onClick={onHide}
            className="p-button-text"
          />
          <Button
            label={t('common.save')}
            icon="pi pi-check"
            type="submit"
            loading={createRoleMutation.isPending || updateRoleMutation.isPending}
          />
        </div>
      </form>
    </Dialog>
  );
};

export default RoleFormDialog;
