import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Compass,
  Smartphone,
  ShieldAlert,
  CheckCircle2,
  Code2,
  PlaySquare,
  LogOut,
  Download,
  BookOpen,
  ChevronRight,
  Menu as MenuIcon,
  X,
  FileText,
  Shield,
} from 'lucide-react';
import { useTranslation } from '../i18n/I18nContext';
import { LanguageSelector } from '../components/LanguageSelector';

export function SandboxLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const rawUser = localStorage.getItem('smart_otp_sandbox_user');
  const user = rawUser ? JSON.parse(rawUser) : { username: 'developer', fullName: 'Partner Developer' };

  const menuItems = [
    { id: 1, name: t.navigation.overview, path: '/dashboard', icon: 'LuCompass', group: 'docs' },
    { id: 2, name: t.navigation.provisioning, path: '/docs/2', icon: 'LuSmartphone', group: 'docs' },
    { id: 3, name: t.navigation.challengeInit, path: '/docs/3', icon: 'LuShieldAlert', group: 'docs' },
    { id: 4, name: t.navigation.verifyOtp, path: '/docs/4', icon: 'LuCheckCircle2', group: 'docs' },
    { id: 5, name: t.navigation.mobileSdk, path: '/docs/5', icon: 'LuCode2', group: 'docs' },
    { id: 6, name: t.navigation.simulatorGuide, path: '/docs/6', icon: 'LuBookOpen', group: 'docs' },
    { id: 7, name: t.navigation.liveSimulator, path: '/simulator', icon: 'LuPlaySquare', group: 'tools' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('smart_otp_sandbox_user');
    navigate('/login');
  };

  const getMenuIcon = (path: string) => {
    if (path === '/dashboard') return <Compass style={{ width: '18px', height: '18px' }} />;
    if (path === '/simulator') return <PlaySquare style={{ width: '18px', height: '18px', color: '#EA580C' }} />;
    if (path.includes('2')) return <Smartphone style={{ width: '18px', height: '18px' }} />;
    if (path.includes('3')) return <ShieldAlert style={{ width: '18px', height: '18px' }} />;
    if (path.includes('4')) return <CheckCircle2 style={{ width: '18px', height: '18px' }} />;
    if (path.includes('5')) return <Code2 style={{ width: '18px', height: '18px' }} />;
    if (path.includes('6')) return <BookOpen style={{ width: '18px', height: '18px' }} />;
    return <FileText style={{ width: '18px', height: '18px' }} />;
  };

  const downloadPostman = () => {
    const postmanData = {
      info: {
        name: 'Smart OTP Platform - Developer Sandbox API',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [
        {
          name: '1. Device Register',
          request: {
            method: 'POST',
            url: 'https://api.miotp.io.vn/api/v1/customer/device/register',
            header: [{ key: 'X-Partner-Code', value: 'PARTNER_DEMO_01' }],
          },
        },
        {
          name: '2. Challenge Init',
          request: {
            method: 'POST',
            url: 'https://api.miotp.io.vn/api/v1/otp/challenge/init',
            header: [{ key: 'X-Partner-Code', value: 'PARTNER_DEMO_01' }],
          },
        },
        {
          name: '3. Verify OTP',
          request: {
            method: 'POST',
            url: 'https://api.miotp.io.vn/api/v1/otp/verify',
            header: [{ key: 'X-Partner-Code', value: 'PARTNER_DEMO_01' }],
          },
        },
      ],
    };
    const blob = new Blob([JSON.stringify(postmanData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Smart_OTP_Sandbox_Postman.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: '#F8FAFC', color: '#0F172A' }}>
      {/* Sidebar Desktop */}
      <aside
        style={{
          width: '280px',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#FFFFFF',
          borderRight: '1px solid #E2E8F0',
          boxShadow: '1px 0 4px rgba(0,0,0,0.02)',
          zIndex: 40,
        }}
        className={`fixed inset-y-0 left-0 transition-transform duration-300 md:static ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Logo & Portal Branding */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => navigate('/')}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #FF6B00 0%, #EA580C 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(255, 107, 0, 0.25)',
                }}
              >
                <Shield style={{ width: '20px', height: '20px', color: '#FFFFFF' }} />
              </div>
              <div>
                <span style={{ fontWeight: 700, fontSize: '15px', color: '#0F172A', display: 'block', letterSpacing: '-0.02em' }}>{t.common.sandboxTitle}</span>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#EA580C', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>
                  {t.common.developerPortal}
                </span>
              </div>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden"
              style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}
            >
              <X style={{ width: '20px', height: '20px' }} />
            </button>
          </div>

          {/* Navigation Menu List */}
          <div style={{ padding: '16px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {t.navigation.menuGroupDocs}
              </span>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {menuItems.slice(0, 6).map((item) => {
                const isActive = location.pathname === item.path || (item.path === '/dashboard' && location.pathname === '/');
                return (
                  <Link
                    key={item.id}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? '#EA580C' : '#475569',
                      backgroundColor: isActive ? '#FFF7ED' : 'transparent',
                      textDecoration: 'none',
                      transition: 'all 0.15s ease',
                      borderLeft: isActive ? '3px solid #EA580C' : '3px solid transparent',
                    }}
                    className="hover:bg-slate-50"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                      <span style={{ color: isActive ? '#EA580C' : '#64748B', display: 'flex', flexShrink: 0 }}>
                        {getMenuIcon(item.path)}
                      </span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.name}
                      </span>
                    </div>
                    {isActive && <ChevronRight style={{ width: '14px', height: '14px', color: '#EA580C', flexShrink: 0 }} />}
                  </Link>
                );
              })}
            </nav>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 8px 8px 8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {t.navigation.menuGroupTools}
              </span>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {menuItems.slice(6).map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.id}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? '#EA580C' : '#475569',
                      backgroundColor: isActive ? '#FFF7ED' : 'transparent',
                      textDecoration: 'none',
                      transition: 'all 0.15s ease',
                      borderLeft: isActive ? '3px solid #EA580C' : '3px solid transparent',
                    }}
                    className="hover:bg-slate-50"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                      <span style={{ color: isActive ? '#EA580C' : '#64748B', display: 'flex', flexShrink: 0 }}>
                        {getMenuIcon(item.path)}
                      </span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.name}
                      </span>
                    </div>
                    {isActive && <ChevronRight style={{ width: '14px', height: '14px', color: '#EA580C', flexShrink: 0 }} />}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div style={{ padding: '16px', borderTop: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#FFF7ED',
                  color: '#EA580C',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px',
                  fontWeight: 700,
                  border: '1px solid #FFEDD5',
                  flexShrink: 0,
                }}
              >
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.fullName || user.username}
                </div>
                <div style={{ fontSize: '11px', color: '#16A34A', fontWeight: 500 }}>
                  ● {t.common.partnerActive}
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title={t.common.logout}
              style={{
                background: 'none',
                border: 'none',
                padding: '6px',
                borderRadius: '6px',
                color: '#94A3B8',
                cursor: 'pointer',
                display: 'flex',
              }}
              className="hover:text-red-600 hover:bg-red-50"
            >
              <LogOut style={{ width: '16px', height: '16px' }} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Topbar */}
        <header
          style={{
            height: '64px',
            paddingLeft: '24px',
            paddingRight: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #E2E8F0',
            backgroundColor: '#FFFFFF',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden"
              style={{ background: 'none', border: 'none', color: '#64748B', padding: '6px', cursor: 'pointer' }}
            >
              <MenuIcon style={{ width: '20px', height: '20px' }} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#16A34A' }} />
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#16A34A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {t.common.uatOnline}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Language Selector */}
            <LanguageSelector variant="light" />

            <button
              onClick={downloadPostman}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 500,
                color: '#334155',
                backgroundColor: '#F8FAFC',
                border: '1px solid #CBD5E1',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title={t.common.downloadPostman}
            >
              <Download style={{ width: '14px', height: '14px', color: '#64748B' }} />
              <span className="hidden sm:inline">Postman Collection</span>
            </button>
            <button
              onClick={() => navigate('/simulator')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#FFFFFF',
                border: 'none',
                background: 'linear-gradient(135deg, #FF6B00 0%, #EA580C 100%)',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(255, 107, 0, 0.25)',
              }}
            >
              <PlaySquare style={{ width: '14px', height: '14px' }} />
              <span>{t.common.openSimulator}</span>
            </button>
          </div>
        </header>

        {/* Dynamic Page Viewport */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '24px', backgroundColor: '#F8FAFC' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default SandboxLayout;
