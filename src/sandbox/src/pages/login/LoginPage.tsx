import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Key, Lock, User, Eye, EyeOff, ArrowRight, Shield, ArrowLeft } from 'lucide-react';
import { loginSandbox } from '../../services/api';
import { useTranslation } from '../../i18n/I18nContext';
import { LanguageSelector } from '../../components/LanguageSelector';

export function LoginPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [username, setUsername] = useState('developer');
  const [password, setPassword] = useState('Dev@123456');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = await loginSandbox(username, password);
      localStorage.setItem('smart_otp_sandbox_user', JSON.stringify(user));
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || t.login.loginFailed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#F8FAFC',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        position: 'relative',
      }}
    >
      {/* Top Bar Language Selector */}
      <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
        <LanguageSelector variant="light" />
      </div>

      <div style={{ width: '100%', maxWidth: '440px' }}>
        {/* Back to Landing Page Link */}
        <div style={{ marginBottom: '16px' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748B',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <ArrowLeft style={{ width: '16px', height: '16px' }} />
            <span>{t.common.backToHome}</span>
          </button>
        </div>

        {/* Card */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            padding: '36px 28px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
            border: '1px solid #E2E8F0',
          }}
        >
          {/* Logo & Title */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '12px',
                margin: '0 auto 16px auto',
                background: 'linear-gradient(135deg, #FF6B00 0%, #EA580C 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(255, 107, 0, 0.25)',
              }}
            >
              <Shield style={{ width: '26px', height: '26px', color: '#FFFFFF' }} />
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A', letterSpacing: '-0.02em' }}>
              {t.login.title}
            </h1>
            <p style={{ fontSize: '13px', color: '#64748B', marginTop: '6px', fontWeight: 500 }}>
              {t.login.subtitle}
            </p>
          </div>

          {error && (
            <div
              style={{
                marginBottom: '20px',
                padding: '12px 14px',
                borderRadius: '8px',
                backgroundColor: '#FEF2F2',
                border: '1px solid #FCA5A5',
                fontSize: '13px',
                color: '#DC2626',
                fontWeight: 500,
              }}
            >
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
                {t.login.usernameLabel}
              </label>
              <div style={{ position: 'relative' }}>
                <User style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', width: '18px', height: '18px' }} />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t.login.usernamePlaceholder}
                  style={{
                    width: '100%',
                    paddingLeft: '38px',
                    paddingRight: '14px',
                    paddingTop: '10px',
                    paddingBottom: '10px',
                    borderRadius: '8px',
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #CBD5E1',
                    fontSize: '14px',
                    color: '#0F172A',
                    outline: 'none',
                    fontWeight: 500,
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
                {t.login.passwordLabel}
              </label>
              <div style={{ position: 'relative' }}>
                <Lock style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', width: '18px', height: '18px' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.login.passwordPlaceholder}
                  style={{
                    width: '100%',
                    paddingLeft: '38px',
                    paddingRight: '40px',
                    paddingTop: '10px',
                    paddingBottom: '10px',
                    borderRadius: '8px',
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #CBD5E1',
                    fontSize: '14px',
                    color: '#0F172A',
                    outline: 'none',
                    fontWeight: 500,
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    display: 'flex',
                  }}
                >
                  {showPassword ? <EyeOff style={{ width: '18px', height: '18px' }} /> : <Eye style={{ width: '18px', height: '18px' }} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                marginTop: '8px',
                padding: '12px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '14px',
                color: '#FFFFFF',
                border: 'none',
                background: 'linear-gradient(135deg, #FF6B00 0%, #EA580C 100%)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(255, 107, 0, 0.25)',
                opacity: loading ? 0.7 : 1,
              }}
            >
              <span>{loading ? t.common.loading : t.login.btnLogin}</span>
              <ArrowRight style={{ width: '16px', height: '16px' }} />
            </button>
          </form>

          {/* Quick Demo Credentials Footer */}
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #F1F5F9', textAlign: 'center' }}>
            <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>
              {t.login.quickDemoNote}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
