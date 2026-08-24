import React, { useEffect, useState } from 'react';
import logo_home from '@/assets/imgs/logo_home.png';
import { IForgotPasswordParams, useForgotPassword } from '@/service/auth/login';
import useToastService from '@/service/toast/toast-service';
import { zodResolver } from '@hookform/resolvers/zod';
import { AppButton, AppInputText } from 'components';
import AppDialog from 'components/src/components/core/dialog';
import { t } from 'i18next';
import { Controller, ControllerFieldState, ControllerRenderProps, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';

import { paths } from '@/paths';

interface ForgotPasswordControllerProps {
  visible: boolean;
  onHide: () => void;
  email?: string;
}

const schema = z.object({
  email: z
    .string()
    .transform((val) => val.trim())
    .refine((val) => val.length > 0, { message: t('login.please_enter_your_email') }),
});

type Values = z.infer<typeof schema>;

const defaultValues = {
  email: '',
};

const ForgotPasswordController: React.FC<ForgotPasswordControllerProps> = ({ visible, onHide, email }) => {
  const { showToast } = useToastService();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const forgotPasswordMutate = useForgotPassword();

  const { control, handleSubmit, reset } = useForm<Values>({
    defaultValues,
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (email) {
      reset({ email });
    }
  }, [email, reset]);

  const onSubmit = (data: any) => {
    const { email } = data;
    const body: IForgotPasswordParams = {
      email,
    };
    setLoading(true);
    forgotPasswordMutate.mutate(body, {
      onSuccess: (res) => {
        if (res.status == 0) {
          showToast({
            code: 200,
            detail: res.message || t('login.request_successful'),
          });
          setLoading(false);
          reset();
          onHide();
        } else {
          showToast({
            code: 400,
            detail: res.message || t('network_error_please_try_again'),
          });
          setLoading(false);
        }
      },
      onError: (error) => {
        showToast({
          code: 400,
          detail: error?.message,
        });
        setLoading(false);
      },
      onSettled: () => {
        setLoading(false);
      },
    });
  };

  return (
    <AppDialog
      visible={visible}
      focusOnShow={false}
      onHide={() => {
        reset();
        onHide();
      }}
    >
      <div className="card p-5 justify-content-center align-items-center flex flex-column">
        <img alt="logo" src={logo_home} className="w-8 h-4 mb-6" />
        <div className="p-fluid">
          <div className="field">
            <Controller
              name="email"
              control={control}
              render={({
                field,
                fieldState,
              }: {
                field: ControllerRenderProps<IForgotPasswordParams, 'email'>;
                fieldState: ControllerFieldState;
              }) => {
                return (
                  <AppInputText
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    placeholder={t('login.enter_your_email')}
                    label={t('login.email')}
                    required
                    inputId="email"
                    id="email"
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
          <AppButton label="Send" className="mt-4" loading={loading} onClick={handleSubmit(onSubmit)} />
        </div>
      </div>
    </AppDialog>
  );
};

export default ForgotPasswordController;
