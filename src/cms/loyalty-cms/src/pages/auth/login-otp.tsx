import React, { useEffect, useState } from 'react';
import logo_home from '@/assets/imgs/logo_home.png';
import { FieldType } from '@/constants';
import { ILoginOtpParams, useLoginOtp, useResendOtp } from '@/service/auth/login';
import { apiClient, cmsApiClient } from '@/service/config';
import { fetchProfile } from '@/service/profile/change-profile';
import useToastService from '@/service/toast/toast-service';
import FormField from '@/ui/FormField';
import { setCookie } from '@/utils/cookies';
import { zodResolver } from '@hookform/resolvers/zod';
import { AppButton } from 'components';
import AppDialog from 'components/src/components/core/dialog';
import { t } from 'i18next';
import { LocalStorage, useUser } from 'micro-sdk';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';

import { paths } from '@/paths';

interface LoginOtpControllerProps {
  visible: boolean;
  onHide: () => void;
  email?: string;
  otp?: string;
}

const schema = z.object({
  otp: z
    .union([z.string(), z.number()])
    .transform((val) => String(val).trim())
    .refine((val) => val.length > 0, { message: t('login.please_enter_your_otp') })
    .refine((val) => val.length === 6, { message: t('login.otp_must_be_6_digits') }),
});

type Values = z.infer<typeof schema>;

const defaultValues = {
  otp: '',
};

const SECOND = 90;

const LoginOtpController: React.FC<LoginOtpControllerProps> = ({ visible, onHide, email, otp }) => {
  const { showToast } = useToastService();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const loginOtpMutate = useLoginOtp();
  const resendOtpMutate = useResendOtp();
  const { setUser } = useUser();

  const { control, handleSubmit, reset } = useForm<Values>({
    defaultValues,
    resolver: zodResolver(schema),
  });

  const [secondsLeft, setSecondsLeft] = useState<number>(SECOND);
  const [resendLoading, setResendLoading] = useState<boolean>(false);

  // Start / reset countdown whenever the dialog becomes visible or the otp/email changes
  useEffect(() => {
    if (!visible) return;
    setSecondsLeft(SECOND);
    const iv = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(iv);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [visible, otp, email]);

  const handleResend = () => {
    if (secondsLeft > 0) return; // guard
    if (!email) {
      showToast({ code: 400, detail: t('login.email_not_provided') });
      return;
    }
    setResendLoading(true);
    resendOtpMutate.mutate(String(email), {
      onSuccess: () => {
        showToast({ code: 200, detail: t('login.otp_resent') });
        setSecondsLeft(SECOND);
        const iv = setInterval(() => {
          setSecondsLeft((s) => {
            if (s <= 1) {
              clearInterval(iv);
              return 0;
            }
            return s - 1;
          });
        }, 1000);
      },
      onError: (err: any) => {
        showToast({ code: 400, detail: err?.message || t('network_error_please_try_again') });
      },
      onSettled: () => setResendLoading(false),
    });
  };

  useEffect(() => {
    if (otp) {
      reset({ otp });
    }
  }, [otp, reset]);

  const onSubmit = (data: any) => {
    const { otp } = data;
    const body: ILoginOtpParams = {
      otp,
      email: email || '',
    };
    setLoading(true);
    loginOtpMutate.mutate(body, {
      onSuccess: (res) => {
        if (res?.status == 0) {
          LocalStorage.setToken(res.accessToken);
          apiClient.setAccessToken(res.accessToken);
          cmsApiClient.setAccessToken(res.accessToken);
          if (res.refreshToken) {
            const maxAge = 30 * 24 * 60 * 60;
            setCookie('refreshToken', res.refreshToken, {
              maxAge,
              path: '/',
              secure: location.protocol === 'https:',
              sameSite: 'Strict',
            });
          }
          (async () => {
            try {
              const profile = await fetchProfile();
              if (setUser) {
                setUser({
                  accessToken: res.accessToken,
                  id: profile?.id ?? res.userId,
                  fullName: profile?.fullName,
                  userName: profile?.username,
                  phoneNumber: profile?.phoneNumber,
                  roles: profile?.roles,
                });
              }
            } catch (err) {
              if (setUser) {
                setUser({ accessToken: res.accessToken });
              }
            }
          })();
          setLoading(false);
          showToast({
            code: 200,
            detail: res.message || t('login.login_successful', { defaultValue: 'Đăng nhập thành công' }),
          });
          navigate(paths.dashboard, { replace: true });
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
      <div className="card p-2 justify-content-center align-items-center flex flex-column">
        <img alt="logo" src={logo_home} className="w-7 h-3 mb-6" />
        <div className="p-fluid">
          <div className="field">
            <FormField
              name="otp"
              type={FieldType.NUMBER}
              control={control}
              label={t('login.otp')}
              required
              maxLength={6}
            />
          </div>
          <div className="justify-content-center align-items-center flex mt-2">
            {secondsLeft > 0 ? (
              <span style={{ color: '#6c757d' }}>
                {t('login.resend')} ({secondsLeft}s)
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={resendLoading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: resendLoading ? '#6c757d' : '#00659F',
                  cursor: resendLoading ? 'default' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  textDecoration: 'none',
                  transition: 'color 0.3s ease',
                }}
              >
                {t('login.resend')}
              </button>
            )}
          </div>
          <AppButton label={t('login.login')} className="mt-4" loading={loading} onClick={handleSubmit(onSubmit)} />
        </div>
      </div>
    </AppDialog>
  );
};

export default LoginOtpController;
