import React from 'react';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Menubar } from 'primereact/menubar';
import { MenuItem } from 'primereact/menuitem';
import { useTranslation } from 'react-i18next';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';

import { KeyStorage, PARTNER_PORTAL_CONSTANTS, SUPPORTED_LANGUAGES } from '@/constants';
import { paths } from '@/paths';
import { getStoredPartnerUser, logoutPartnerAccount } from '@/service/auth';
import { LocalStorage } from '@/utils/localStorage';

export const MainLayout: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLangOpen, setIsLangOpen] = React.useState(false);

  const token = LocalStorage.get<string>(KeyStorage.ACCESS_TOKEN);
  const currentUser = getStoredPartnerUser();

  if (!token) {
    return <Navigate to={paths.login} replace />;
  }

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const handleConfirmLogout = () => {
    confirmDialog({
      message: t('common.confirm_logout_message'),
      header: t('common.confirm_logout'),
      icon: 'pi pi-sign-out',
      acceptLabel: t('common.confirm'),
      rejectLabel: t('common.cancel'),
      acceptClassName: 'p-button-danger',
      accept: () => {
        logoutPartnerAccount();
        navigate(paths.login, { replace: true });
      },
    });
  };

  const isOperationsActive = [paths.branches, paths.policy, paths.staff, paths.proposals, paths.vouchers].some((p) =>
    location.pathname.startsWith(p)
  );
  const isFinanceActive = [paths.transactions, paths.settlement].some((p) => location.pathname.startsWith(p));
  const isDeveloperActive = [paths.notifications, paths.apiKeys].some((p) => location.pathname.startsWith(p));

  const menuItems: MenuItem[] = [
    {
      label: t('partner_portal.nav_dashboard'),
      icon: 'pi pi-chart-bar',
      className: location.pathname === paths.dashboard ? 'p-menuitem-active font-semibold' : '',
      command: () => handleNavigate(paths.dashboard),
    },
    {
      label: t('nav.operations'),
      icon: 'pi pi-building',
      className: isOperationsActive ? 'p-menuitem-active font-semibold' : '',
      items: [
        { label: t('partner_portal.nav_branches'), icon: 'pi pi-sitemap', command: () => handleNavigate(paths.branches) },
        { label: t('partner_portal.nav_policy'), icon: 'pi pi-sliders-h', command: () => handleNavigate(paths.policy) },
        { label: t('partner_portal.nav_staff'), icon: 'pi pi-users', command: () => handleNavigate(paths.staff) },
        { label: t('partner_portal.nav_proposals'), icon: 'pi pi-send', command: () => handleNavigate(paths.proposals) },
        { label: t('partner_portal.nav_vouchers'), icon: 'pi pi-ticket', command: () => handleNavigate(paths.vouchers) },
      ],
    },
    {
      label: t('nav.settlement_finance'),
      icon: 'pi pi-wallet',
      className: isFinanceActive ? 'p-menuitem-active font-semibold' : '',
      items: [
        { label: t('partner_portal.nav_transactions'), icon: 'pi pi-list', command: () => handleNavigate(paths.transactions) },
        { label: t('partner_portal.nav_settlement'), icon: 'pi pi-calculator', command: () => handleNavigate(paths.settlement) },
      ],
    },
    {
      label: t('nav.developer'),
      icon: 'pi pi-code',
      className: isDeveloperActive ? 'p-menuitem-active font-semibold' : '',
      items: [
        { label: t('partner_portal.nav_notifications'), icon: 'pi pi-bell', command: () => handleNavigate(paths.notifications) },
        { label: t('partner_portal.nav_api_keys'), icon: 'pi pi-key', command: () => handleNavigate(paths.apiKeys) },
      ],
    },
  ];

  const start = (
    <div
      className="flex align-items-center gap-2 cursor-pointer pr-4"
      onClick={() => handleNavigate(paths.dashboard)}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: 'linear-gradient(135deg, #FF6B00 0%, #EA580C 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(255, 107, 0, 0.30)',
        }}
      >
        <i className="pi pi-briefcase text-white text-base" />
      </div>
      <div className="flex align-items-center gap-2">
        <span className="font-bold text-lg text-900" style={{ letterSpacing: '-0.3px' }}>
          Micro <span style={{ color: '#FF6B00' }}>Loyalty</span>
        </span>
        <span
          className="text-xs px-2 py-1 border-round-xl font-semibold"
          style={{
            background: '#FFF7ED',
            color: '#EA580C',
            border: '1px solid #FDBA74',
          }}
        >
          {t('nav.partner_portal')}
        </span>
      </div>
    </div>
  );

  const displayName = currentUser?.fullName || currentUser?.username || t('common.partner_admin');
  const avatarInitial = displayName.charAt(0).toUpperCase();
  const normalizedLang = (i18n.language || PARTNER_PORTAL_CONSTANTS.DEFAULT_LANGUAGE).split('-')[0].toLowerCase();

  const end = (
    <div className="flex align-items-center gap-2">
      <div className="relative">
        <button
          type="button"
          className="language-pill-btn"
          onClick={() => setIsLangOpen((prev) => !prev)}
        >
          <i className="pi pi-globe" />
          <span className="lang-code uppercase">{normalizedLang}</span>
          <i className={`pi ${isLangOpen ? 'pi-chevron-up' : 'pi-chevron-down'}`} />
        </button>
        {isLangOpen && (
          <div className="custom-dropdown-overlay">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <div
                key={lang.code}
                className={`custom-dropdown-item justify-content-between ${
                  normalizedLang === lang.code ? 'active' : ''
                }`}
                onClick={() => {
                  i18n.changeLanguage(lang.code);
                  LocalStorage.set(KeyStorage.LANGUAGE, lang.code);
                  setIsLangOpen(false);
                }}
              >
                <span className="text-sm">{lang.name}</span>
                {normalizedLang === lang.code && <i className="pi pi-check text-xs" />}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="hidden sm:flex align-items-center gap-2 user-profile-pill">
        <div className="user-avatar-circle flex align-items-center justify-content-center">{avatarInitial}</div>
        <span className="user-name" title={displayName}>
          {displayName}
        </span>
      </div>

      <button
        type="button"
        className="p-button p-component p-button-outlined p-button-secondary p-button-sm border-round-3xl cursor-pointer"
        onClick={handleConfirmLogout}
        title={t('common.logout')}
      >
        <i className="pi pi-sign-out" />
        <span className="hidden md:inline p-button-label">{t('common.logout')}</span>
      </button>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-column">
      <ConfirmDialog />
      <header className="partner-header px-3 lg:px-5">
        <Menubar model={menuItems} start={start} end={end} />
      </header>
      <main className="flex-1 px-3 py-2 md:px-4 md:py-3 w-full">
        <Outlet />
      </main>
    </div>
  );
};
