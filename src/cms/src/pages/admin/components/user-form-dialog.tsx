import React, { useEffect, useState } from 'react';
import { useCreateUser, useUpdateUser, useLockUser, IUser, IUserPayload, useGetRoles } from '@/service/admin/admin';
import useToastService from '@/service/toast/toast-service';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { MultiSelect } from 'primereact/multiselect';
import { Button } from 'primereact/button';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { t } from 'i18next';
import './user-form-dialog.scss';

const userSchema = z.object({
  username: z.string().min(3, { message: 'validate.username_required' }),
  email: z.string().email({ message: 'validate.invalid_email' }),
  fullName: z.string().min(1, { message: 'validate.fullname_required' }),
  phone: z.string().optional(),
  password: z.string().optional(),
  roleIds: z.array(z.number()).optional(),
});

type UserFormValues = z.infer<typeof userSchema>;

interface UserFormDialogProps {
  visible: boolean;
  user: IUser | null;
  isEditing: boolean;
  onHide: () => void;
  onSuccess: () => void;
}

const UserFormDialog: React.FC<UserFormDialogProps> = ({
  visible,
  user,
  isEditing,
  onHide,
  onSuccess,
}) => {
  const { showToast } = useToastService();
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const { data: rolesData } = useGetRoles();
  const roleOptions = (rolesData?.data || rolesData?.roles || []) as any[];

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserFormValues>({
    defaultValues: {
      username: '',
      email: '',
      fullName: '',
      phone: '',
      password: '',
      roleIds: [],
    },
    resolver: zodResolver(userSchema),
  });

  useEffect(() => {
    if (isEditing && user) {
      reset({
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone || '',
        password: '',
        roleIds: user.roles?.map((r) => r.roleId) || [],
      });
    } else {
      reset({
        username: '',
        email: '',
        fullName: '',
        phone: '',
        password: '',
        roleIds: [],
      });
    }
  }, [visible, user, isEditing, reset]);

  const onSubmit = (data: UserFormValues) => {
    const payload: IUserPayload = {
      username: data.username,
      email: data.email,
      fullName: data.fullName,
      phone: data.phone,
      roleIds: data.roleIds,
    };

    if (data.password) {
      payload.password = data.password;
    }

    if (isEditing && user) {
      updateUserMutation.mutate(
        { id: user.userId, data: payload },
        {
          onSuccess: () => {
            showToast({
              severity: 'success',
              summary: t('common.success'),
              detail: t('user.update_success'),
            });
            onSuccess();
          },
          onError: (error: any) => {
            showToast({
              severity: 'error',
              summary: t('common.error'),
              detail: error?.response?.data?.message || t('user.update_failed'),
            });
          },
        }
      );
    } else {
      if (!data.password) {
        showToast({
          severity: 'error',
          summary: t('common.error'),
          detail: t('user.password_required'),
        });
        return;
      }

      createUserMutation.mutate(payload, {
        onSuccess: () => {
          showToast({
            severity: 'success',
            summary: t('common.success'),
            detail: t('user.create_success'),
          });
          onSuccess();
        },
        onError: (error: any) => {
          showToast({
            severity: 'error',
            summary: t('common.error'),
            detail: error?.response?.data?.message || t('user.create_failed'),
          });
        },
      });
    }
  };

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={isEditing ? t('user.edit_user') : t('user.create_user')}
      modal
      className="user-form-dialog"
      style={{ width: '50vw' }}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="form-content">
        <div className="form-group">
          <label>{t('user.username')}</label>
          <Controller
            name="username"
            control={control}
            render={({ field }) => (
              <InputText
                {...field}
                disabled={isEditing}
                className={errors.username ? 'p-invalid' : ''}
              />
            )}
          />
          {errors.username && <span className="error-message">{t(errors.username.message as string)}</span>}
        </div>

        <div className="form-group">
          <label>{t('user.email')}</label>
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <InputText
                {...field}
                type="email"
                className={errors.email ? 'p-invalid' : ''}
              />
            )}
          />
          {errors.email && <span className="error-message">{t(errors.email.message as string)}</span>}
        </div>

        <div className="form-group">
          <label>{t('user.full_name')}</label>
          <Controller
            name="fullName"
            control={control}
            render={({ field }) => (
              <InputText {...field} className={errors.fullName ? 'p-invalid' : ''} />
            )}
          />
          {errors.fullName && <span className="error-message">{t(errors.fullName.message as string)}</span>}
        </div>

        <div className="form-group">
          <label>{t('user.phone')}</label>
          <Controller
            name="phone"
            control={control}
            render={({ field }) => <InputText {...field} />}
          />
        </div>

        <div className="form-group">
          <label>{t('user.roles')}</label>
          <Controller
            name="roleIds"
            control={control}
            render={({ field }) => (
              <MultiSelect
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={roleOptions}
                optionLabel="name"
                optionValue="roleId"
                placeholder={t('select')}
                maxSelectedLabels={3}
                className="w-full"
              />
            )}
          />
        </div>

        <div className="form-group">
          <label>
            {isEditing ? t('user.new_password') : t('user.password')}
            {isEditing && ' (' + t('common.optional') + ')'}
          </label>
          <Controller
            name="password"
            control={control}
            render={({ field }) => <InputText {...field} type="password" />}
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
            loading={createUserMutation.isPending || updateUserMutation.isPending}
          />
        </div>
      </form>
    </Dialog>
  );
};

export default UserFormDialog;
