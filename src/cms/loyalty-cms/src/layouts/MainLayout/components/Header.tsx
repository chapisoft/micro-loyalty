import React from 'react';
import { useBoolean } from '@/hooks';
import { ILanguage } from '@/models';
import { AppConfirmDialog } from 'components';
import { LocalStorage, useUser } from 'micro-sdk';
import { Menubar } from 'primereact/menubar';
import { MenuItem } from 'primereact/menuitem';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';

import { paths } from '@/paths';

const languages: ILanguage[] = [
  { code: 'vi', name: 'Tiếng Việt (VN)' },
  { code: 'en', name: 'English (EN)' },
  { code: 'fr', name: 'Français (FR)' },
  { code: 'ht', name: 'Kreyòl Ayisyen (HT)' },
  { code: 'zh', name: '中文 (ZH)' },
  { code: 'ja', name: '日本語 (JA)' },
  { code: 'ko', name: '한국어 (KO)' },
];

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const [isLangOpen, setIsLangOpen] = React.useState(false);
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);
  const langTimerRef = React.useRef<any>(null);
  const profileTimerRef = React.useRef<any>(null);
  const [visibleLogout, { on: onLogout, off: offLogout }] = useBoolean(false);
  const { user } = useUser();

  const handleNavigate = React.useCallback(
    (path: string) => {
      React.startTransition(() => {
        navigate(path);
      });
    },
    [navigate]
  );

  const handleLangEnter = () => {
    if (langTimerRef.current) clearTimeout(langTimerRef.current);
    setIsLangOpen(true);
  };

  const handleLangLeave = () => {
    langTimerRef.current = setTimeout(() => {
      setIsLangOpen(false);
    }, 180);
  };

  const handleProfileEnter = () => {
    if (profileTimerRef.current) clearTimeout(profileTimerRef.current);
    setIsProfileOpen(true);
  };

  const handleProfileLeave = () => {
    profileTimerRef.current = setTimeout(() => {
      setIsProfileOpen(false);
    }, 180);
  };

  const isDashboardActive = location.pathname === paths.dashboard || location.pathname === '/';
  const isCustomersActive = location.pathname.startsWith(paths.customers);
  const isPartnersActive = location.pathname.startsWith(paths.partners);
  const isTransactionsActive = location.pathname.startsWith(paths.transactions);
  const isPolicyActive = location.pathname.startsWith(paths.policyConfig);
  const isTierActive = location.pathname.startsWith(paths.tierManagement);
  const isCampaignActive = location.pathname.startsWith(paths.campaignMilestones);
  const isParametersActive = location.pathname.startsWith(paths.systemParameters);
  const isSandboxActive = location.pathname.startsWith(paths.sandbox);
  const isAdminActive = [paths.userManagement, paths.roleManagement, paths.auditManagement].some((p) =>
    location.pathname.startsWith(p)
  );

  const menuItems: MenuItem[] = React.useMemo(
    () => [
      {
        label: t('nav.dashboard', { defaultValue: 'Tổng quan' }),
        icon: 'pi pi-chart-bar',
        className: isDashboardActive ? 'menu-pill-active' : 'menu-pill-item',
        command: () => handleNavigate(paths.dashboard),
      },
      {
        label: t('nav.tiers', { defaultValue: 'Hạng Hội viên' }),
        icon: 'pi pi-star',
        className: isTierActive ? 'menu-pill-active' : 'menu-pill-item',
        command: () => handleNavigate(paths.tierManagement),
      },
      {
        label: t('nav.policies', { defaultValue: 'Chính sách Điểm' }),
        icon: 'pi pi-sliders-h',
        className: isPolicyActive ? 'menu-pill-active' : 'menu-pill-item',
        command: () => handleNavigate(paths.policyConfig),
      },
      {
        label: t('nav.campaigns', { defaultValue: 'Chiến dịch & Cột mốc' }),
        icon: 'pi pi-flag',
        className: isCampaignActive ? 'menu-pill-active' : 'menu-pill-item',
        command: () => handleNavigate(paths.campaignMilestones),
      },
      {
        label: t('nav.partners', { defaultValue: 'Đối tác' }),
        icon: 'pi pi-building',
        className: isPartnersActive ? 'menu-pill-active' : 'menu-pill-item',
        command: () => handleNavigate(paths.partners),
      },
      {
        label: t('nav.transactions', { defaultValue: 'Giao dịch OTP' }),
        icon: 'pi pi-history',
        className: isTransactionsActive ? 'menu-pill-active' : 'menu-pill-item',
        command: () => handleNavigate(paths.transactions),
      },
      {
        label: t('nav.system_parameters', { defaultValue: 'Tham số hệ thống' }),
        icon: 'pi pi-cog',
        className: isParametersActive ? 'menu-pill-active' : 'menu-pill-item',
        command: () => handleNavigate(paths.systemParameters),
      },
      {
        label: t('nav.sandbox', { defaultValue: 'Quản lý Sandbox' }),
        icon: 'pi pi-code',
        className: isSandboxActive ? 'menu-pill-active' : 'menu-pill-item',
        items: [
          {
            label: 'Tổng quan Quản lý Sandbox',
            icon: 'pi pi-compass',
            command: () => handleNavigate(paths.sandbox),
          },
          {
            separator: true,
          },
          {
            label: t('nav.sandbox_users', { defaultValue: 'Quản lý User Sandbox' }),
            icon: 'pi pi-users',
            command: () => handleNavigate(paths.sandboxUsers),
          },
          {
            label: t('nav.sandbox_groups', { defaultValue: 'Quản lý Nhóm & Quyền' }),
            icon: 'pi pi-sitemap',
            command: () => handleNavigate(paths.sandboxGroups),
          },
          {
            label: t('nav.sandbox_menus', { defaultValue: 'Quản lý Menu & Bài viết' }),
            icon: 'pi pi-file-edit',
            command: () => handleNavigate(paths.sandboxMenus),
          },
        ],
      },
      {
        label: t('nav.admin', { defaultValue: 'Quản trị' }),
        icon: 'pi pi-shield',
        className: isAdminActive ? 'menu-pill-active' : 'menu-pill-item',
        items: [
          {
            label: t('user.management', { defaultValue: 'Quản lý Tài khoản' }),
            icon: 'pi pi-user-edit',
            command: () => handleNavigate(paths.userManagement),
          },
          {
            label: t('role.management', { defaultValue: 'Quản lý Vai trò' }),
            icon: 'pi pi-lock',
            command: () => handleNavigate(paths.roleManagement),
          },
          {
            separator: true,
          },
          {
            label: t('nav.audit_logs', { defaultValue: 'Nhật ký Hoạt động' }),
            icon: 'pi pi-list',
            command: () => handleNavigate(paths.auditManagement),
          },
          {
            label: t('nav.dead_letter', { defaultValue: 'Lỗi Webhook (Dead-Letter)' }),
            icon: 'pi pi-exclamation-circle',
            command: () => handleNavigate(paths.deadLetterManagement),
          },
        ],
      },
    ],
    [
      handleNavigate,
      t,
      isDashboardActive,
      isCustomersActive,
      isPartnersActive,
      isTransactionsActive,
      isParametersActive,
      isSandboxActive,
      isAdminActive,
    ]
  );

  const start = (
    <div
      className="flex align-items-center gap-2 cursor-pointer pr-3"
      onClick={() => handleNavigate(paths.dashboard)}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 12,
          background: 'linear-gradient(135deg, #FF6B00 0%, #EA580C 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 14px rgba(255, 107, 0, 0.35)',
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
      </div>
      <div className="flex flex-column">
        <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px', lineHeight: 1.1 }}>
          Smart <span style={{ color: '#FF6B00' }}>OTP</span>
        </span>
      </div>
      <span
        className="text-xs px-2 py-0.5 border-round-xl ml-1"
        style={{
          background: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)',
          color: '#EA580C',
          border: '1.5px solid #FDBA74',
          fontWeight: 600,
          boxShadow: '0 2px 6px rgba(245, 130, 32, 0.15)',
        }}
      >
        CMS
      </span>
    </div>
  );

  const end = (
    <div className="flex align-items-center gap-3 pl-2">
      {/* Language Hover Dropdown */}
      <div className="relative" onMouseEnter={handleLangEnter} onMouseLeave={handleLangLeave}>
        <button
          type="button"
          className="language-pill-btn flex align-items-center gap-2 cursor-pointer"
          title="Change Language"
        >
          <i className="pi pi-globe" style={{ fontSize: '1.15rem', color: '#FF6B00' }} />
          <span className="lang-code text-xs uppercase" style={{ color: '#0f172a', fontWeight: 550 }}>
            {i18n.language || 'VI'}
          </span>
          <i className={`pi pi-chevron-${isLangOpen ? 'up' : 'down'} text-xs`} style={{ color: '#64748b' }} />
        </button>

        {isLangOpen && (
          <div
            className="custom-dropdown-overlay language-dropdown"
            onMouseEnter={handleLangEnter}
            onMouseLeave={handleLangLeave}
          >
            {languages.map((item) => (
              <div
                key={item.code}
                className={`custom-dropdown-item ${i18n.language === item.code ? 'active' : ''}`}
                onClick={() => {
                  i18n.changeLanguage(item.code);
                  localStorage.setItem('lng', item.code);
                  localStorage.setItem('language', item.code);
                  setIsLangOpen(false);
                }}
              >
                <span className="font-medium">{item.name}</span>
                {i18n.language === item.code && (
                  <i className="pi pi-check text-primary font-medium ml-auto" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User Profile Hover Dropdown */}
      <div className="relative" onMouseEnter={handleProfileEnter} onMouseLeave={handleProfileLeave}>
        <button type="button" className="user-profile-pill flex align-items-center gap-2 cursor-pointer">
          <span className="user-avatar-circle flex align-items-center justify-content-center">
            <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>
              {(user?.fullName || user?.userName || (user as any)?.username || 'Admin').charAt(0).toUpperCase()}
            </span>
          </span>
          <span className="user-name text-sm" style={{ fontWeight: 550 }}>
            {user?.fullName || user?.userName || (user as any)?.username || 'Super Admin'}
          </span>
          <i className={`pi pi-chevron-${isProfileOpen ? 'up' : 'down'} text-xs chevron-icon ml-1`} />
        </button>

        {isProfileOpen && (
          <div
            className="custom-dropdown-overlay profile-dropdown"
            onMouseEnter={handleProfileEnter}
            onMouseLeave={handleProfileLeave}
          >
            <div className="px-3 py-2 border-bottom-1 surface-border">
              <div className="text-900 text-sm" style={{ fontWeight: 600 }}>
                {user?.fullName || user?.userName || (user as any)?.username || 'Super Administrator'}
              </div>
              <div className="text-500 text-xs">{(user as any)?.email || 'admin@miotp.io.vn'}</div>
            </div>
            <div
              className="custom-dropdown-item"
              onClick={() => {
                setIsProfileOpen(false);
                handleNavigate(paths.changeProfile);
              }}
            >
              <i className="pi pi-user text-primary mr-2" />
              <span>{t('profile.change_profile', { defaultValue: 'Thông tin cá nhân' })}</span>
            </div>
            <div
              className="custom-dropdown-item"
              onClick={() => {
                setIsProfileOpen(false);
                handleNavigate(paths.changePassword);
              }}
            >
              <i className="pi pi-key text-primary mr-2" />
              <span>{t('profile.change_password', { defaultValue: 'Đổi mật khẩu' })}</span>
            </div>
            <div className="border-top-1 surface-border my-1" />
            <div
              className="custom-dropdown-item text-red-600 font-semibold"
              onClick={() => {
                setIsProfileOpen(false);
                onLogout();
              }}
            >
              <i className="pi pi-sign-out text-red-500 mr-2" />
              <span>{t('common.logout', { defaultValue: 'Đăng xuất' })}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const onConfirmLogout = () => {
    try {
      LocalStorage.removeToken();
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('refreshToken');
      sessionStorage.clear();
      offLogout();
      window.location.href = paths.login;
    } catch (e) {
      console.error('Logout error:', e);
      window.location.href = paths.login;
    }
  };

  return (
    <header className="sticky top-0 z-5 shadow-1 border-none surface-card w-full flex align-items-center">
      <Menubar
        model={menuItems}
        start={start}
        end={end}
        className="border-none w-full"
        style={{ borderRadius: 0 }}
      />
      <AppConfirmDialog
        visible={visibleLogout}
        onHide={offLogout}
        onAccept={onConfirmLogout}
        header={t('common.confirm_logout', { defaultValue: 'Xác nhận Đăng xuất' })}
        message={t('common.confirm_logout_message', {
          defaultValue: 'Bạn có chắc chắn muốn đăng xuất khỏi hệ thống Smart OTP CMS?',
        })}
        acceptLabel={t('common.logout', { defaultValue: 'Đăng xuất' })}
        rejectLabel={t('common.cancel', { defaultValue: 'Hủy bỏ' })}
        severity="danger"
      />
    </header>
  );
};

export default Header;
