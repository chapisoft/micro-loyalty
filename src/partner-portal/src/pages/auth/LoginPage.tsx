import React, { useRef, useState } from 'react';
import { Controller, ControllerFieldState, ControllerRenderProps, useForm } from 'react-hook-form';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Menu } from 'primereact/menu';
import { Password } from 'primereact/password';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate } from 'react-router-dom';

import { KeyStorage, PARTNER_PORTAL_CONSTANTS, SUPPORTED_LANGUAGES } from '@/constants';
import { paths } from '@/paths';
import { LoginPayload, loginPartnerAccount } from '@/service/auth';
import { LocalStorage } from '@/utils/localStorage';

export const LoginPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const menuLanguageRef = useRef<Menu>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginPayload>({
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const existingToken = LocalStorage.get<string>(KeyStorage.ACCESS_TOKEN);
  if (existingToken) {
    return <Navigate to={paths.dashboard} replace />;
  }

  const onSubmit = async (data: LoginPayload) => {
    setErrorMessage(null);
    setLoading(true);
    try {
      await loginPartnerAccount({
        username: data.username.trim(),
        password: data.password,
      });
      navigate(paths.dashboard, { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error && err.message && err.message !== 'Authentication failed'
        ? err.message
        : t('login.login_failed');
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const normalizedLang = (i18n.language || PARTNER_PORTAL_CONSTANTS.DEFAULT_LANGUAGE).split('-')[0].toLowerCase();
  const currentLangLabel = SUPPORTED_LANGUAGES.find((l) => l.code === normalizedLang)?.short
    || PARTNER_PORTAL_CONSTANTS.DEFAULT_LANGUAGE.toUpperCase();

  const languageMenuItems = SUPPORTED_LANGUAGES.map((lang) => ({
    label: lang.name,
    command: () => {
      i18n.changeLanguage(lang.code);
      LocalStorage.set(KeyStorage.LANGUAGE, lang.code);
    },
  }));

  const featureCards = [
    {
      icon: 'pi-sitemap',
      color: '#FF6B00',
      bg: 'rgba(255, 107, 0, 0.12)',
      titleKey: 'login.feature_branch_title',
      descKey: 'login.feature_branch_desc',
    },
    {
      icon: 'pi-sliders-h',
      color: '#0284c7',
      bg: 'rgba(2, 132, 199, 0.12)',
      titleKey: 'login.feature_policy_title',
      descKey: 'login.feature_policy_desc',
    },
    {
      icon: 'pi-ticket',
      color: '#16a34a',
      bg: 'rgba(34, 197, 94, 0.12)',
      titleKey: 'login.feature_voucher_title',
      descKey: 'login.feature_voucher_desc',
    },
    {
      icon: 'pi-calculator',
      color: '#7c3aed',
      bg: 'rgba(124, 58, 237, 0.12)',
      titleKey: 'login.feature_settlement_title',
      descKey: 'login.feature_settlement_desc',
    },
  ];

  return (
    <div
      className="min-h-screen w-full flex flex-column md:flex-row align-items-stretch m-0"
      style={{ background: '#f8fafc' }}
    >
      {/* LEFT BRANDING & FEATURE SHOWCASE */}
      <div
        className="hidden md:flex md:col-6 lg:col-7 flex-column justify-content-between p-6 lg:p-8 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #FFF7ED 0%, #EFF6FF 50%, #F8FAFC 100%)',
          borderRight: '1.5px solid rgba(226, 232, 240, 0.85)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-15%',
            left: '-10%',
            width: '560px',
            height: '560px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255, 107, 0, 0.14) 0%, transparent 70%)',
            filter: 'blur(60px)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-12%',
            right: '-8%',
            width: '480px',
            height: '480px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(2, 132, 199, 0.12) 0%, transparent 70%)',
            filter: 'blur(80px)',
            pointerEvents: 'none',
          }}
        />

        {/* Top Brand Badge */}
        <div className="flex align-items-center gap-3 relative z-1">
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #FF6B00 0%, #EA580C 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 20px rgba(255, 107, 0, 0.35)',
            }}
          >
            <i className="pi pi-briefcase text-white" style={{ fontSize: '1.35rem' }} />
          </div>
          <div className="flex flex-column">
            <span
              style={{
                fontSize: '1.45rem',
                fontWeight: 800,
                color: '#0f172a',
                letterSpacing: '-0.5px',
                lineHeight: 1.1,
              }}
            >
              Micro <span style={{ color: '#FF6B00' }}>Loyalty</span>
            </span>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#475569',
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
              }}
            >
              {t('login.suite_subtitle')}
            </span>
          </div>
        </div>

        {/* Middle Hero & 2x2 Feature Grid */}
        <div className="my-auto py-5 relative z-1" style={{ maxWidth: 620 }}>
          <div
            className="inline-flex align-items-center gap-2 px-3 py-1 mb-4 border-round-3xl"
            style={{
              background: 'rgba(255, 107, 0, 0.08)',
              border: '1.5px solid rgba(255, 107, 0, 0.25)',
              color: '#EA580C',
              fontSize: '0.85rem',
              fontWeight: 600,
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
            {t('login.online_system')}
          </div>

          <h1
            style={{
              fontSize: '2.4rem',
              fontWeight: 800,
              color: '#0f172a',
              lineHeight: 1.25,
              marginTop: 0,
              marginBottom: '1rem',
              letterSpacing: '-0.8px',
            }}
          >
            {t('login.hero_title')}
          </h1>

          <p style={{ fontSize: '1.02rem', color: '#334155', lineHeight: 1.7, marginBottom: '2rem', fontWeight: 500 }}>
            {t('login.hero_subtitle')}
          </p>

          {/* 2x2 Glassmorphism Feature Grid */}
          <div className="grid -m-2">
            {featureCards.map((item) => (
              <div key={item.titleKey} className="col-12 lg:col-6 p-2">
                <div
                  className="p-3 border-round-xl h-full"
                  style={{
                    background: 'rgba(255, 255, 255, 0.92)',
                    backdropFilter: 'blur(12px)',
                    border: '1.5px solid rgba(226, 232, 240, 0.95)',
                    boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
                  }}
                >
                  <div className="flex align-items-start gap-3">
                    <div
                      className="flex align-items-center justify-content-center border-round-lg flex-shrink-0"
                      style={{ width: 40, height: 40, background: item.bg }}
                    >
                      <i className={`pi ${item.icon}`} style={{ fontSize: '1.15rem', color: item.color }} />
                    </div>
                    <div>
                      <div className="font-semibold text-sm mb-1" style={{ color: '#0f172a' }}>
                        {t(item.titleKey)}
                      </div>
                      <div className="text-xs line-height-3" style={{ color: '#475569' }}>
                        {t(item.descKey)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Left Footer */}
        <div
          className="flex justify-content-between align-items-center text-xs relative z-1 font-medium"
          style={{ color: '#475569' }}
        >
          <span>© 2026 Chapisoft / Natcash • Partner Portal</span>
          <span>{t('login.copyright_owner')}</span>
        </div>
      </div>

      {/* RIGHT LOGIN CARD PANEL */}
      <div className="col-12 md:col-6 lg:col-5 flex flex-column justify-content-between p-4 md:p-6 lg:p-7 min-h-screen">
        {/* Top Bar Language Switcher */}
        <div className="flex justify-content-between md:justify-content-end align-items-center mb-4">
          <div className="flex md:hidden align-items-center gap-2">
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #FF6B00 0%, #EA580C 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <i className="pi pi-briefcase text-white text-sm" />
            </div>
            <span className="font-bold text-lg text-900">
              Micro <span style={{ color: '#FF6B00' }}>Loyalty</span>
            </span>
          </div>

          <div>
            <Menu model={languageMenuItems} popup ref={menuLanguageRef} id="popup_menu_lang_partner_login" />
            <button
              type="button"
              onClick={(e) => menuLanguageRef.current?.toggle(e)}
              className="language-pill-btn"
            >
              <i className="pi pi-globe" />
              <span className="lang-code uppercase">{currentLangLabel}</span>
              <i className="pi pi-chevron-down" />
            </button>
          </div>
        </div>

        {/* Centered Glassmorphism Card */}
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
            {/* Card Header */}
            <div className="text-center mb-5">
              <div
                className="inline-flex align-items-center justify-content-center border-round-xl mb-3"
                style={{
                  width: 58,
                  height: 58,
                  background: 'linear-gradient(135deg, #FF6B00 0%, #EA580C 100%)',
                  boxShadow: '0 8px 20px rgba(255, 107, 0, 0.30)',
                }}
              >
                <i className="pi pi-briefcase text-white" style={{ fontSize: '1.55rem' }} />
              </div>
              <h2 className="text-2xl font-bold m-0 mb-2" style={{ color: '#0f172a' }}>
                {t('login.title')}
              </h2>
              <p className="text-sm m-0 line-height-3" style={{ color: '#475569' }}>
                {t('login.form_subtitle')}
              </p>
            </div>

            {/* Inline Error Banner */}
            {errorMessage && (
              <div
                className="p-3 mb-4 border-round-lg flex align-items-center gap-2"
                style={{ background: '#fef2f2', border: '1.5px solid #fecaca', color: '#b91c1c' }}
              >
                <i className="pi pi-exclamation-circle text-lg flex-shrink-0" />
                <span className="text-sm font-medium">{errorMessage}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
              <div className="field mb-4">
                <label htmlFor="partner-username" className="font-semibold text-sm block mb-2" style={{ color: '#0f172a' }}>
                  {t('login.username')}
                </label>
                <div className="relative w-full">
                  <Controller
                    name="username"
                    control={control}
                    rules={{ required: t('login.please_enter_your_username') }}
                    render={({
                      field,
                      fieldState,
                    }: {
                      field: ControllerRenderProps<LoginPayload, 'username'>;
                      fieldState: ControllerFieldState;
                    }) => (
                      <InputText
                        id="partner-username"
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        placeholder={t('login.enter_your_username')}
                        autoComplete="username"
                        className={`w-full py-3 px-3 border-round-lg ${fieldState.invalid ? 'p-invalid' : ''}`}
                        style={{
                          paddingRight: '2.85rem',
                          background: '#ffffff',
                          border: '1.5px solid #cbd5e1',
                          fontSize: '0.95rem',
                          color: '#0f172a',
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
                      fontSize: '1.05rem',
                      color: '#64748b',
                      pointerEvents: 'none',
                    }}
                  />
                </div>
                {errors.username && <small className="p-error block mt-1">{errors.username.message}</small>}
              </div>

              <div className="field mb-4">
                <label htmlFor="partner-password" className="font-semibold text-sm block mb-2" style={{ color: '#0f172a' }}>
                  {t('login.password')}
                </label>
                <Controller
                  name="password"
                  control={control}
                  rules={{ required: t('login.please_enter_your_password') }}
                  render={({
                    field,
                    fieldState,
                  }: {
                    field: ControllerRenderProps<LoginPayload, 'password'>;
                    fieldState: ControllerFieldState;
                  }) => (
                    <Password
                      inputId="partner-password"
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      placeholder={t('login.enter_your_password')}
                      toggleMask
                      feedback={false}
                      autoComplete="current-password"
                      className={`w-full ${fieldState.invalid ? 'p-invalid' : ''}`}
                      inputClassName="w-full py-3 px-3 border-round-lg"
                      inputStyle={{
                        background: '#ffffff',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '0.95rem',
                        color: '#0f172a',
                      }}
                    />
                  )}
                />
                {errors.password && <small className="p-error block mt-1">{errors.password.message}</small>}
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full py-3 border-none shadow-3 border-round-lg cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, #FF7A00 0%, #EA580C 100%)',
                  color: '#ffffff',
                  boxShadow: '0 8px 24px rgba(245, 130, 32, 0.32)',
                }}
              >
                <div className="flex align-items-center justify-content-center gap-2 w-full">
                  {loading ? (
                    <i className="pi pi-spin pi-spinner" style={{ fontSize: '1.1rem' }} />
                  ) : (
                    <i className="pi pi-sign-in" style={{ fontSize: '1.1rem' }} />
                  )}
                  <span style={{ fontSize: '1rem', fontWeight: 600 }}>{t('login.login_button')}</span>
                </div>
              </Button>
            </form>
          </div>
        </div>

        {/* Bottom Security Note */}
        <div className="text-center text-xs mt-4 font-medium" style={{ color: '#64748b' }}>
          {t('login.portal_secured')}
        </div>
      </div>
    </div>
  );
};
