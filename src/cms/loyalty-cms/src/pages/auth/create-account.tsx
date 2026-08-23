import { useState } from 'react';
import logo_home from '@/assets/imgs/logo_home.png';
import Form from '@/component/Form/Form';
import { useBoolean } from '@/hooks';
import { IRegisterParams, IRegisterResponse, useRegisterAccount } from '@/service/auth/login';
import useToastService from '@/service/toast/toast-service.ts';
import CloseModalConfirm from '@/ui/CloseModalConfirm';
import FormField from '@/ui/FormField';
import { zodResolver } from '@hookform/resolvers/zod';
import { AxiosError } from 'axios';
import { AppButton, CardLayout } from 'components';
import { t } from 'i18next';
import { Button } from 'primereact/button';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';

import { paths } from '@/paths';

type IRegisterFormParams = IRegisterParams & {
  confirm_password: string;
};

const schema = z
  .object({
    fullName: z
      .string()
      .trim()
      .nonempty({ message: t('validate.this_field_cannot_be_left_empty') }),
    username: z
      .string()
      .trim()
      .nonempty({ message: t('validate.this_field_cannot_be_left_empty') }),
    email: z
      .string()
      .trim()
      .nonempty({ message: t('validate.this_field_cannot_be_left_empty') })
      .email({ message: t('validate.invalid_email') }),
    phoneNumber: z
      .string()
      .trim()
      .nonempty({ message: t('validate.this_field_cannot_be_left_empty') })
      .regex(/^(?:509\d{8})$/, { message: t('validate.invalid_phone_number') }),
    password: z
      .string()
      .trim()
      .nonempty({ message: t('validate.this_field_cannot_be_left_empty') }),
    confirm_password: z
      .string()
      .trim()
      .nonempty({ message: t('validate.this_field_cannot_be_left_empty') }),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: t('validate.passwords_must_match'),
    path: ['confirm_password'],
  });

const defaultValues: IRegisterFormParams = {
  fullName: '',
  userName: '',
  email: '',
  phoneNumber: '',
  password: '',
  confirm_password: '',
};

export function Page(): React.JSX.Element {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showToast } = useToastService();
  const [loading, setLoading] = useState(false);
  const registerAccount = useRegisterAccount();
  const form = useForm<IRegisterFormParams>({
    defaultValues,
    resolver: zodResolver(schema),
    mode: 'all',
  });
  const [visibleConfirm, { on: onVisibleConfirm, off: offVisibleConfirm }] = useBoolean(false);
  const { control, handleSubmit, reset } = form;

  const handleRegister = async (data: IRegisterParams) => {
    registerAccount.mutate(data, {
      onSuccess: (res: IRegisterResponse) => {
        if (res.status == 0) {
          navigate(paths.login);
          showToast({
            code: 200,
            detail: res.message || t('login.register_successful'),
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

  const onSubmit = (formData: IRegisterFormParams) => {
    setLoading(true);
    const apiData = { ...formData } as any;
    // remove confirm_password before sending to API
    delete apiData.confirm_password;
    handleRegister(apiData as IRegisterParams);
  };

  return (
    <>
      <div className="layout-topbar" style={{ height: '3rem', zIndex: 1100 }}>
        <img alt="logo" src={logo_home} style={{ height: '2rem' }} />
        <div className="layout-topbar-menu">
          <Button
            icon="pi pi-user"
            className="p-link layout-topbar-button"
            onClick={() => {
              navigate(-1);
            }}
            style={{ borderWidth: 0, backgroundColor: 'transparent', boxShadow: 'none' }}
          />
        </div>
      </div>
      <CardLayout
        styleClass="mt-6 pt-8 w-full h-screen align-items-center flex flex-column"
        cardTitle={t('login.sign_up_title')}
        body={
          <Form form={form} onSubmit={handleSubmit(onSubmit)} className="grid mt-3">
            <div className="col-12 lg:col-6">
              <FormField name="phoneNumber" control={control} label={t('login.phoneNumber')} required maxLength={11} />
            </div>
            <div className="col-12 lg:col-6">
              <FormField name="email" control={control} label={t('login.emailAddress')} required />
            </div>
            <div className="col-12 lg:col-6">
              <FormField control={control} name="fullName" label={t('login.fullName')} required />
            </div>
            <div className="col-12 lg:col-6">
              <FormField control={control} name="username" label={t('login.userName')} required />
            </div>
            <div className="col-12 lg:col-6">
              <FormField control={control} name="password" label={t('login.password')} required />
            </div>
            <div className="col-12 lg:col-6">
              <FormField control={control} name="confirm_password" label={t('login.confirm_password')} required />
            </div>
            {/* <Show when={!isDetail}>
            <div className="col-12 mt-4 flex justify-content-center gap-4">
              <AppButton label={t('save')} type="submit" size="large" loading={loading} />
              <AppButton label={t('save_and_add_new')} type="submit" size="large" loading={loading} />
              <AppButton label={t('cancel')} type="button" size="large" onClick={() => navigate(paths.spaService)} />
            </div>
          </Show> */}
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
                    const fieldState = control.getFieldState(key as keyof IRegisterFormParams);
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
            <AppButton
              variant={'create'}
              label={t('button.create')}
              loading={loading}
              type="submit"
              onClick={handleSubmit(onSubmit)}
            />
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
