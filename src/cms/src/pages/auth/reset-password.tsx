import left_login_background from '@/assets/imgs/left_login_background.png';
import logo_home from '@/assets/imgs/logo_home.png';
import { IResetPasswordParams, useResetPassword } from '@/service/auth/login';
import useToastService from '@/service/toast/toast-service';
import { zodResolver } from '@hookform/resolvers/zod';
import { AppButton, AppInputText } from 'components';
import { t } from 'i18next';
import React, { useEffect, useRef, useState } from 'react';
import { Controller, ControllerFieldState, ControllerRenderProps, useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';

import { paths } from '@/paths';

const schema = z
  .object({
    newPassword: z
      .string()
      .transform((val) => val.trim())
      .refine((val) => val.length > 0, { message: t('validate.this_field_cannot_be_left_empty') }),
    confirmPassword: z
      .string()
      .transform((val) => val.trim())
      .refine((val) => val.length > 0, { message: t('validate.this_field_cannot_be_left_empty') }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: t('validate.passwords_must_match'),
    path: ['confirmPassword'],
  });

type Values = z.infer<typeof schema>;

const defaultValues = {
  newPassword: '',
  confirmPassword: '',
};

export function Page(): React.JSX.Element {
  const { showToast } = useToastService();
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string>('');
  const invalidTokenHandledRef = useRef(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resetPasswordMutate = useResetPassword();

  useEffect(() => {
    const urlToken = searchParams.get('token');
    if (urlToken) {
      setToken(urlToken);
    } else {
      if (invalidTokenHandledRef.current) {
        return;
      }
      invalidTokenHandledRef.current = true;
      showToast({
        code: 400,
        detail: t('login.invalid_reset_token'),
      });
      navigate(paths.login);
    }
  }, [searchParams, navigate, showToast]);

  const { control, handleSubmit } = useForm<Values>({
    defaultValues,
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: any) => {
    const { newPassword, confirmPassword } = data;
    const body = {
      newPassword,
      confirmPassword,
      token,
    };
    setLoading(true);
    resetPasswordMutate.mutate(body, {
      onSuccess: (res) => {
        if (res?.status == 0) {
          showToast({
            code: 200,
            detail: res.message || t('login.reset_successful'),
          });
          navigate(paths.login);
        } else {
          showToast({
            code: 400,
            detail: res.message || t('network_error_please_try_again'),
          });
        }
      },
      onError: (error) => {
        showToast({
          code: 400,
          detail: error?.message,
        });
      },
      onSettled: () => {
        setLoading(false);
      },
    });
  };

  const handleKeyDown = (event: any) => {
    if (event.key === 'Enter') {
      handleSubmit(onSubmit)();
    }
  };

  return (
    <div className="w-full h-screen grid m-0">
      <div className="hidden md:block col-6 p-0 h-screen">
        <img src={left_login_background} alt="background" className="w-full h-screen object-cover" />
      </div>
      <div className="justify-content-center align-items-center flex flex-column col-12 md:col-6">
        <div className="card justify-content-center align-items-center flex flex-column p-4">
          <img alt="logo" src={logo_home} className="w-6 h-6 mb-7" />
          <div className="p-fluid">
            <div className="field">
              <Controller
                name="newPassword"
                control={control}
                render={({
                  field,
                  fieldState,
                }: {
                  field: ControllerRenderProps<IResetPasswordParams, 'newPassword'>;
                  fieldState: ControllerFieldState;
                }) => {
                  return (
                    <AppInputText
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      placeholder={t('login.enter_your_password')}
                      label={t('login.password')}
                      required
                      inputId="newPassword"
                      id="newPassword"
                      maxLength={50}
                      invalid={fieldState.invalid}
                      error={fieldState.error?.message}
                      style={{
                        borderRadius: '5px',
                        backgroundColor: '#1a4b59',
                        color: '#ffffff',
                        borderColor: fieldState.invalid ? '#FF5252' : 'transparent',
                      }}
                    />
                  );
                }}
              />
            </div>
            <div className="field mt-3">
              <Controller
                name="confirmPassword"
                control={control}
                render={({
                  field,
                  fieldState,
                }: {
                  field: ControllerRenderProps<IResetPasswordParams, 'confirmPassword'>;
                  fieldState: ControllerFieldState;
                }) => {
                  return (
                    <AppInputText
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={t('login.enter_your_confirm_password')}
                      label={t('login.confirm_password')}
                      required
                      inputId="confirmPassword"
                      id="confirmPassword"
                      maxLength={50}
                      invalid={fieldState.invalid}
                      error={fieldState.error?.message}
                      style={{
                        borderRadius: '5px',
                        backgroundColor: '#1a4b59',
                        color: '#ffffff',
                        borderColor: fieldState.invalid ? '#FF5252' : 'transparent',
                      }}
                    />
                  );
                }}
              />
            </div>
            <AppButton label={t('button.save')} className="mt-6" loading={loading} onClick={handleSubmit(onSubmit)} />
          </div>
        </div>
      </div>
    </div>
  );
}
