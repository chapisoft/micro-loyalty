import Form from '@/component/Form/Form';
import { useBoolean } from '@/hooks';
import { IChangePasswordParams, IChangePasswordResponse, useChangePassword } from '@/service/profile/change-password';
import useToastService from '@/service/toast/toast-service.ts';
import CloseModalConfirm from '@/ui/CloseModalConfirm';
import FormField from '@/ui/FormField';
import { zodResolver } from '@hookform/resolvers/zod';
import { AxiosError } from 'axios';
import { AppButton, CardLayout } from 'components';
import { t } from 'i18next';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';

const schema = z
  .object({
    oldPassword: z
      .string()
      .trim()
      .nonempty({ message: t('validate.this_field_cannot_be_left_empty') }),
    newPassword: z
      .string()
      .trim()
      .nonempty({ message: t('validate.this_field_cannot_be_left_empty') }),
    confirmPassword: z
      .string()
      .trim()
      .nonempty({ message: t('validate.this_field_cannot_be_left_empty') }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: t('validate.passwords_must_match'),
    path: ['confirmPassword'],
  });

const defaultValues: IChangePasswordParams = {
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
};

export function Page(): React.JSX.Element {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showToast } = useToastService();
  const [loading, setLoading] = useState(false);

  const changePasswordMutate = useChangePassword();

  const form = useForm<IChangePasswordParams>({
    defaultValues,
    resolver: zodResolver(schema),
    mode: 'all',
  });
  const [visibleConfirm, { on: onVisibleConfirm, off: offVisibleConfirm }] = useBoolean(false);
  const { control, handleSubmit, reset } = form;

  const onSubmit = (formData: IChangePasswordParams) => {
    changePasswordMutate.mutate(formData, {
      onSuccess: (res: IChangePasswordResponse) => {
        if (res.status === 0) {
          reset();
          showToast({
            code: 200,
            detail: res.message || t('successfully_changed_password'),
          });
        } else {
          showToast({
            code: 400,
            detail: res.message || t('network_error_please_try_again'),
          });
        }
      },
      onError: (error: AxiosError) => {
        showToast({
          code: 400,
          detail: error?.message || t('network_error_please_try_again'),
        });
      },
      onSettled: () => setLoading(false),
    });
  };

  return (
    <>
      <CardLayout
        cardTitle={t('change-password')}
        body={
          <Form form={form} onSubmit={handleSubmit(onSubmit)} className="w-full grid">
            <div className="col-12">
              <FormField control={control} name="oldPassword" label={t('old_password')} required />
            </div>
            <div className="col-12">
              <FormField control={control} name="newPassword" label={t('new_password')} required />
            </div>
            <div className="col-12">
              <FormField control={control} name="confirmPassword" label={t('confirm_password')} required />
            </div>
          </Form>
        }
        footer={
          <div className="flex justify-content-center gap-2 mt-8">
            <AppButton
              variant="close-confirm"
              className="p-button-outlined"
              onClick={() => {
                if (
                  Object.keys(defaultValues).some((key) => {
                    const fieldState = control.getFieldState(key as keyof IChangePasswordParams);
                    return fieldState.isDirty;
                  })
                ) {
                  onVisibleConfirm();
                } else {
                  reset();
                  navigate(-1);
                }
              }}
            />
            <AppButton variant='isave' label={t('button.save')} loading={loading} type="submit" onClick={handleSubmit(onSubmit)} />
          </div>
        }
      />
      <CloseModalConfirm
        visible={visibleConfirm}
        rejectAction={offVisibleConfirm}
        acceptAction={() => {
          offVisibleConfirm();
          reset();
          navigate(-1);
        }}
      />
    </>
  );
}
