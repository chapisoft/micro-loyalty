import React, { useState, useRef } from 'react';
import { useForm, Controller, ControllerRenderProps, ControllerFieldState } from 'react-hook-form';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Menu } from 'primereact/menu';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LocalStorage } from 'micro-sdk';
import { paths } from '@/paths';
import { useLogin, ILoginParams } from '@/service/auth/login';

interface FormValues extends ILoginParams {}

export function Login() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const menuLanguageRef = useRef<Menu>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { mutate: loginMutate, isPending: loading } = useLogin();

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = (data: FormValues) => {
    setErrorMessage(null);
    loginMutate(data, {
      onSuccess: (response) => {
        if (response && response.accessToken) {
          LocalStorage.setToken(response.accessToken);
          localStorage.setItem('token', response.accessToken);
          if (response.refreshToken) {
            localStorage.setItem('refreshToken', response.refreshToken);
          }
          localStorage.setItem(
            'user',
            JSON.stringify({
              userId: response.userId,
              username: response.username || data.username,
              fullName: response.fullName || response.username || data.username,
              roles: response.roles || ['SUPER_ADMIN'],
              email: response.email || `${data.username}@miotp.io.vn`,
              accessToken: response.accessToken,
            })
          );
          navigate(paths.dashboard);
        } else {
          setErrorMessage(t('login.login_failed', { defaultValue: 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.' }));
        }
      },
      onError: (err: any) => {
        console.error('[Login] Exception:', err);
        const msg = err?.response?.data?.message || err?.message || t('login.login_failed', { defaultValue: 'Tên đăng nhập hoặc mật khẩu không chính xác' });
        setErrorMessage(msg);
      },
    });
  };

  const fillDemo = () => {
    setValue('username', 'admin', { shouldValidate: true });
    setValue('password', 'Admin@123456', { shouldValidate: true });
  };

  const languages = [
    { code: 'vi', label: 'Tiếng Việt (VN)', short: 'VI' },
    { code: 'en', label: 'English (EN)', short: 'EN' },
    { code: 'fr', label: 'Français (FR)', short: 'FR' },
    { code: 'ht', label: 'Kreyòl Ayisyen (HT)', short: 'HT' },
    { code: 'zh', label: '中文 (ZH)', short: 'ZH' },
    { code: 'ja', label: '日本語 (JA)', short: 'JA' },
    { code: 'ko', label: '한국어 (KO)', short: 'KO' },
  ];

  const menuItems = languages.map((lang) => ({
    label: lang.label,
    command: () => {
      i18n.changeLanguage(lang.code);
      localStorage.setItem('lng', lang.code);
      localStorage.setItem('language', lang.code);
    },
  }));

  const currentLangLabel = languages.find((l) => l.code === i18n.language)?.short || 'VI';

  return (
    <div
      className="min-h-screen w-full flex flex-column md:flex-row align-items-stretch"
      style={{
        background: '#f8fafc',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* LEFT BRANDING PANEL */}
      <div
        className="hidden md:flex md:col-6 lg:col-7 flex-column justify-content-between p-6 lg:p-8 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #FFF7ED 0%, #EFF6FF 50%, #F8FAFC 100%)',
          borderRight: '1.5px solid rgba(226, 232, 240, 0.8)',
        }}
      >
        {/* Soft Background Orbs */}
        <div
          style={{
            position: 'absolute',
            top: '-15%',
            left: '-10%',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255, 107, 0, 0.12) 0%, transparent 70%)',
            filter: 'blur(60px)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-10%',
            right: '-10%',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(2, 132, 199, 0.10) 0%, transparent 70%)',
            filter: 'blur(80px)',
            pointerEvents: 'none',
          }}
        />

        {/* Top Branding */}
        <div className="flex align-items-center gap-3 relative z-1">
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #FF6B00 0%, #EA580C 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 20px rgba(255, 107, 0, 0.35)',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <div className="flex flex-column">
            <span style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px', lineHeight: 1.1 }}>
              Smart <span style={{ color: '#FF6B00' }}>OTP</span>
            </span>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '1px' }}>
              {t('login.suite_subtitle', { defaultValue: 'Enterprise Security Suite' })}
            </span>
          </div>
        </div>

        {/* Middle Value Pitch */}
        <div className="my-auto py-5 relative z-1" style={{ maxWidth: 580 }}>
          <div
            className="inline-flex align-items-center gap-2 px-3 py-1 mb-4 border-round-3xl"
            style={{
              background: 'rgba(255, 107, 0, 0.08)',
              border: '1.5px solid rgba(255, 107, 0, 0.25)',
              color: '#EA580C',
              fontSize: '0.85rem',
              fontWeight: 700,
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
            {t('login.online_system', { defaultValue: 'Hệ Thống Trực Tuyến • Sẵn Sàng 99.99%' })}
          </div>

          <h1
            style={{
              fontSize: '2.5rem',
              fontWeight: 800,
              color: '#0f172a',
              lineHeight: 1.25,
              marginBottom: '1.25rem',
              letterSpacing: '-1px',
            }}
          >
            {t('login.hero_title', { defaultValue: 'Nền Tảng Quản Trị Xác Thực Giao Dịch Bảo Mật' })}
          </h1>

          <p style={{ fontSize: '1.05rem', color: '#334155', lineHeight: 1.7, marginBottom: '2.5rem', fontWeight: 500 }}>
            {t('login.hero_subtitle', { defaultValue: 'Hạ tầng sinh và kiểm thực mã OTP thế hệ mới chuẩn quốc tế, bảo vệ giao dịch ngân hàng & tài chính số với độ trễ phản hồi siêu tốc.' })}
          </p>

          {/* Feature Grid */}
          <div className="grid gap-3">
            <div
              className="col-12 md:col-6 p-3 border-round-xl"
              style={{
                background: 'rgba(255, 255, 255, 0.92)',
                backdropFilter: 'blur(12px)',
                border: '1.5px solid rgba(226, 232, 240, 0.95)',
                boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
              }}
            >
              <div className="flex align-items-center gap-3">
                <div
                  className="flex align-items-center justify-content-center border-round-lg text-primary"
                  style={{ width: 40, height: 40, background: 'rgba(255, 107, 0, 0.12)' }}
                >
                  <i className="pi pi-shield font-bold" style={{ fontSize: '1.2rem', color: '#FF6B00' }} />
                </div>
                <div>
                  <div className="font-bold text-sm" style={{ color: '#0f172a' }}>{t('login.feature_ocra_title', { defaultValue: 'Chuẩn OCRA RFC 6287' })}</div>
                  <div className="text-xs font-medium" style={{ color: '#475569' }}>{t('login.feature_ocra_desc', { defaultValue: 'Thuật toán Challenge-Response' })}</div>
                </div>
              </div>
            </div>

            <div
              className="col-12 md:col-6 p-3 border-round-xl"
              style={{
                background: 'rgba(255, 255, 255, 0.92)',
                backdropFilter: 'blur(12px)',
                border: '1.5px solid rgba(226, 232, 240, 0.95)',
                boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
              }}
            >
              <div className="flex align-items-center gap-3">
                <div
                  className="flex align-items-center justify-content-center border-round-lg text-blue-600"
                  style={{ width: 40, height: 40, background: 'rgba(2, 132, 199, 0.12)' }}
                >
                  <i className="pi pi-bolt font-bold" style={{ fontSize: '1.2rem', color: '#0284c7' }} />
                </div>
                <div>
                  <div className="font-bold text-sm" style={{ color: '#0f172a' }}>{t('login.feature_speed_title', { defaultValue: 'Tốc độ < 50ms' })}</div>
                  <div className="text-xs font-medium" style={{ color: '#475569' }}>{t('login.feature_speed_desc', { defaultValue: 'Bộ đệm Redis Cache phân tán' })}</div>
                </div>
              </div>
            </div>

            <div
              className="col-12 md:col-6 p-3 border-round-xl"
              style={{
                background: 'rgba(255, 255, 255, 0.92)',
                backdropFilter: 'blur(12px)',
                border: '1.5px solid rgba(226, 232, 240, 0.95)',
                boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
              }}
            >
              <div className="flex align-items-center gap-3">
                <div
                  className="flex align-items-center justify-content-center border-round-lg text-green-600"
                  style={{ width: 40, height: 40, background: 'rgba(34, 197, 94, 0.12)' }}
                >
                  <i className="pi pi-lock font-bold" style={{ fontSize: '1.2rem', color: '#16a34a' }} />
                </div>
                <div>
                  <div className="font-bold text-sm" style={{ color: '#0f172a' }}>{t('login.feature_pin_title', { defaultValue: 'Khóa PIN Thiết bị' })}</div>
                  <div className="text-xs font-medium" style={{ color: '#475569' }}>{t('login.feature_pin_desc', { defaultValue: 'Tự động chống tấn công brute-force' })}</div>
                </div>
              </div>
            </div>

            <div
              className="col-12 md:col-6 p-3 border-round-xl"
              style={{
                background: 'rgba(255, 255, 255, 0.92)',
                backdropFilter: 'blur(12px)',
                border: '1.5px solid rgba(226, 232, 240, 0.95)',
                boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
              }}
            >
              <div className="flex align-items-center gap-3">
                <div
                  className="flex align-items-center justify-content-center border-round-lg text-purple-600"
                  style={{ width: 40, height: 40, background: 'rgba(124, 58, 237, 0.12)' }}
                >
                  <i className="pi pi-eye font-bold" style={{ fontSize: '1.2rem', color: '#7c3aed' }} />
                </div>
                <div>
                  <div className="font-bold text-sm" style={{ color: '#0f172a' }}>{t('login.feature_audit_title', { defaultValue: 'Audit Log Toàn Diện' })}</div>
                  <div className="text-xs font-medium" style={{ color: '#475569' }}>{t('login.feature_audit_desc', { defaultValue: 'Ghi vết và giám sát 24/7' })}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-content-between align-items-center text-xs relative z-1 font-semibold" style={{ color: '#475569' }}>
          <span>© 2026 Microtec JSC • Smart OTP Platform</span>
          <span>{t('login.copyright_owner', { defaultValue: 'Bản quyền thuộc Microtec' })}</span>
        </div>
      </div>

      {/* RIGHT FORM PANEL */}
      <div className="col-12 md:col-6 lg:col-5 flex flex-column justify-content-between p-4 md:p-6 lg:p-7 min-h-screen">
        {/* Top bar with Language Switcher */}
        <div className="flex justify-content-end align-items-center mb-4">
          <Menu model={menuItems} popup ref={menuLanguageRef} id="popup_menu_lang_login" />
          <button
            type="button"
            onClick={(e) => menuLanguageRef.current?.toggle(e)}
            className="language-pill-btn flex align-items-center gap-2 cursor-pointer"
          >
            <i className="pi pi-globe" style={{ fontSize: '1.15rem', color: '#FF6B00' }} />
            <span className="lang-code font-bold text-xs uppercase" style={{ color: '#0f172a' }}>{currentLangLabel}</span>
            <i className="pi pi-chevron-down text-xs" style={{ color: '#475569' }} />
          </button>
        </div>

        {/* Center Card */}
        <div className="my-auto mx-auto w-full" style={{ maxWidth: 460 }}>
          <div
            className="p-5 md:p-6 border-round-2xl"
            style={{
              background: 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              border: '1.5px solid rgba(226, 232, 240, 0.95)',
              boxShadow: '0 20px 48px -6px rgba(15, 23, 42, 0.12), 0 4px 16px rgba(0, 0, 0, 0.04)',
            }}
          >
            {/* Header */}
            <div className="text-center mb-5">
              <div
                className="inline-flex align-items-center justify-content-center border-round-xl mb-3 shadow-2"
                style={{
                  width: 56,
                  height: 56,
                  background: 'linear-gradient(135deg, #FF6B00 0%, #EA580C 100%)',
                  boxShadow: '0 8px 20px rgba(255, 107, 0, 0.3)',
                }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
              <h2 className="text-2xl font-extrabold m-0 mb-2" style={{ color: '#0f172a' }}>
                {t('login.title', { defaultValue: 'Đăng nhập Quản trị' })}
              </h2>
              <p className="text-sm m-0 font-medium" style={{ color: '#475569' }}>
                {t('login.form_subtitle', { defaultValue: 'Nhập thông tin quản trị viên để truy cập bảng điều khiển' })}
              </p>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div
                className="p-3 mb-4 border-round-lg flex align-items-center gap-2"
                style={{ background: '#fef2f2', border: '1.5px solid #fecaca', color: '#b91c1c' }}
              >
                <i className="pi pi-exclamation-circle text-lg flex-shrink-0" />
                <span className="text-sm font-medium">{errorMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
              {/* Username Input - Unified Icon on RIGHT */}
              <div className="field mb-4">
                <label className="font-bold text-sm block mb-2" style={{ color: '#0f172a' }}>
                  {t('login.username', { defaultValue: 'Tên đăng nhập' })}
                </label>
                <div className="relative w-full">
                  <Controller
                    name="username"
                    control={control}
                    rules={{ required: t('login.please_enter_your_username', { defaultValue: 'Vui lòng nhập tên đăng nhập' }) }}
                    render={({ field, fieldState }: { field: ControllerRenderProps<any, 'username'>; fieldState: ControllerFieldState }) => (
                      <InputText
                        id="username"
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        placeholder={t('login.enter_your_username', { defaultValue: 'Nhập tên đăng nhập (vd: admin)' })}
                        className={`w-full py-3 px-3 border-round-lg ${fieldState.invalid ? 'p-invalid' : ''}`}
                        style={{
                          paddingRight: '2.85rem',
                          background: '#ffffff',
                          border: '1.5px solid #cbd5e1',
                          fontSize: '0.95rem',
                          color: '#0f172a',
                          fontWeight: 500,
                        }}
                      />
                    )}
                  />
                  <i
                    className="pi pi-user absolute"
                    style={{
                      right: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '1.1rem',
                      color: '#64748b',
                      pointerEvents: 'none',
                    }}
                  />
                </div>
                {errors.username && <small className="p-error block mt-1">{errors.username.message}</small>}
              </div>

              {/* Password Input - Icon / Toggle Mask on RIGHT */}
              <div className="field mb-4">
                <label className="font-bold text-sm block mb-2" style={{ color: '#0f172a' }}>
                  {t('login.password', { defaultValue: 'Mật khẩu' })}
                </label>
                <Controller
                  name="password"
                  control={control}
                  rules={{ required: t('login.please_enter_your_password', { defaultValue: 'Vui lòng nhập mật khẩu' }) }}
                  render={({ field, fieldState }: { field: ControllerRenderProps<any, 'password'>; fieldState: ControllerFieldState }) => (
                    <Password
                      id="password"
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      placeholder={t('login.enter_your_password', { defaultValue: 'Nhập mật khẩu quản trị' })}
                      toggleMask
                      feedback={false}
                      className={`w-full ${fieldState.invalid ? 'p-invalid' : ''}`}
                      inputClassName="w-full py-3 border-round-lg"
                      inputStyle={{
                        background: '#ffffff',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '0.95rem',
                        color: '#0f172a',
                        fontWeight: 500,
                      }}
                    />
                  )}
                />
                {errors.password && <small className="p-error block mt-1">{errors.password.message}</small>}
              </div>

              {/* Demo Fill Helper */}
              <div className="flex justify-content-between align-items-center mb-4">
                <span
                  onClick={fillDemo}
                  className="text-xs cursor-pointer hover:underline flex align-items-center gap-1 font-bold"
                  style={{ color: '#EA580C' }}
                >
                  <i className="pi pi-key text-xs" /> {t('login.demo_account', { defaultValue: 'Điền nhanh tài khoản mẫu (admin)' })}
                </span>
                <span className="text-xs font-semibold" style={{ color: '#64748b' }}>
                  {t('login.default_account', { defaultValue: 'Mặc định: Admin@123456' })}
                </span>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                label={t('login.login', { defaultValue: 'Đăng nhập' })}
                icon={loading ? 'pi pi-spin pi-spinner' : 'pi pi-sign-in'}
                loading={loading}
                className="w-full py-3 font-bold border-none shadow-3 border-round-lg cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, #FF7A00 0%, #EA580C 100%)',
                  color: '#ffffff',
                  fontSize: '1.05rem',
                  letterSpacing: '0.2px',
                  boxShadow: '0 8px 24px rgba(245, 130, 32, 0.35)',
                }}
              />
            </form>
          </div>
        </div>

        {/* Bottom Note */}
        <div className="text-center text-xs mt-4 font-semibold" style={{ color: '#64748b' }}>
          {t('login.portal_secured', { defaultValue: 'Smart OTP Admin Portal v2.0 • Secured by TLS 1.3' })}
        </div>
      </div>
    </div>
  );
}

export const Page = Login;
export default Login;
