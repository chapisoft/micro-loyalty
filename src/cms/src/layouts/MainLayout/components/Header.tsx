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
  const isPolicyGroupActive = [
    paths.tierManagement,
    paths.policyConfig,
    paths.campaignMilestones,
    paths.customers,
    paths.customerSegments,
    paths.reminderScenarios,
  ].some((p) => location.pathname.startsWith(p));

  const isRewardsGroupActive = [
    paths.voucherManagement,
    paths.gameManagement,
    paths.gameHubConfig,
    paths.learningQuizBank,
    paths.gameStatistics,
  ].some((p) => location.pathname.startsWith(p));

  const isPartnerGroupActive = [
    paths.partners,
    paths.natcashPaymentPoints,
    paths.transactions,
    paths.clearingSettlement,
    paths.agentLoyaltyManagement,
  ].some((p) => location.pathname.startsWith(p));

  const isReportsGroupActive = [
    paths.budgetManagement,
    paths.programEffectiveness,
    paths.alertCenter,
    paths.advancedReports,
  ].some((p) => location.pathname.startsWith(p));


  const isAdminActive = [
    paths.userManagement,
    paths.roleManagement,
    paths.categoryManagement,
    paths.auditManagement,
    paths.deadLetterManagement,
    paths.approvalQueue,
    paths.systemParameters,
  ].some((p) => location.pathname.startsWith(p));

  const menuItems: MenuItem[] = React.useMemo(
    () => [
      {
        label: t('nav.dashboard'),
        icon: 'pi pi-chart-bar',
        className: isDashboardActive ? 'menu-pill-active' : 'menu-pill-item',
        command: () => handleNavigate(paths.dashboard),
      },
      {
        label: t('nav.loyalty_policies'),
        icon: 'pi pi-star',
        className: isPolicyGroupActive ? 'menu-pill-active' : 'menu-pill-item',
        items: [
          {
            label: t('nav.tiers'),
            icon: 'pi pi-star-fill',
            command: () => handleNavigate(paths.tierManagement),
          },
          {
            label: t('nav.policies'),
            icon: 'pi pi-sliders-h',
            command: () => handleNavigate(paths.policyConfig),
          },
          {
            label: t('nav.campaigns'),
            icon: 'pi pi-flag',
            command: () => handleNavigate(paths.campaignMilestones),
          },
          { separator: true },
          {
            label: t('nav.customers'),
            icon: 'pi pi-users',
            command: () => handleNavigate(paths.customers),
          },
          {
            label: t('nav.segments'),
            icon: 'pi pi-filter',
            command: () => handleNavigate(paths.customerSegments),
          },
          {
            label: t('nav.scenarios'),
            icon: 'pi pi-bell',
            command: () => handleNavigate(paths.reminderScenarios),
          },
        ],
      },
      {
        label: t('nav.rewards_games'),
        icon: 'pi pi-gift',
        className: isRewardsGroupActive ? 'menu-pill-active' : 'menu-pill-item',
        items: [
          {
            label: t('nav.vouchers'),
            icon: 'pi pi-ticket',
            command: () => handleNavigate(paths.voucherManagement),
          },
          {
            label: t('nav.game_catalog'),
            icon: 'pi pi-th-large',
            command: () => handleNavigate(paths.gameManagement),
          },
          {
            label: t('nav.game_hub_config'),
            icon: 'pi pi-cog',
            command: () => handleNavigate(paths.gameHubConfig),
          },
          {
            label: t('nav.learning_quiz'),
            icon: 'pi pi-book',
            command: () => handleNavigate(paths.learningQuizBank),
          },
          {
            label: t('nav.game_stats'),
            icon: 'pi pi-chart-line',
            command: () => handleNavigate(paths.gameStatistics),
          },
        ],
      },
      {
        label: t('nav.partner_network'),
        icon: 'pi pi-building',
        className: isPartnerGroupActive ? 'menu-pill-active' : 'menu-pill-item',
        items: [
          {
            label: t('nav.partners'),
            icon: 'pi pi-building',
            command: () => handleNavigate(paths.partners),
          },
          {
            label: t('nav.payment_points'),
            icon: 'pi pi-map-marker',
            command: () => handleNavigate(paths.natcashPaymentPoints),
          },
          {
            label: t('nav.transactions'),
            icon: 'pi pi-history',
            command: () => handleNavigate(paths.transactions),
          },
          {
            label: t('nav.clearing'),
            icon: 'pi pi-chart-pie',
            command: () => handleNavigate(paths.clearingSettlement),
          },
          {
            label: t('nav.agent_loyalty'),
            icon: 'pi pi-briefcase',
            command: () => handleNavigate(paths.agentLoyaltyManagement),
          },
        ],
      },
      {
        label: t('nav.reports_budget'),
        icon: 'pi pi-chart-line',
        className: isReportsGroupActive ? 'menu-pill-active' : 'menu-pill-item',
        items: [
          {
            label: t('nav.budgets'),
            icon: 'pi pi-wallet',
            command: () => handleNavigate(paths.budgetManagement),
          },
          {
            label: t('nav.effectiveness'),
            icon: 'pi pi-percentage',
            command: () => handleNavigate(paths.programEffectiveness),
          },
          {
            label: t('nav.alerts'),
            icon: 'pi pi-exclamation-triangle',
            command: () => handleNavigate(paths.alertCenter),
          },
          {
            label: t('nav.advanced_reports'),
            icon: 'pi pi-file-excel',
            command: () => handleNavigate(paths.advancedReports),
          },
        ],
      },
      {
        label: t('nav.admin'),
        icon: 'pi pi-shield',
        className: isAdminActive ? 'menu-pill-active' : 'menu-pill-item',
        items: [
          {
            label: t('nav.approvals'),
            icon: 'pi pi-check-square',
            command: () => handleNavigate(paths.approvalQueue),
          },
          {
            separator: true,
          },
          {
            label: t('user.management'),
            icon: 'pi pi-user-edit',
            command: () => handleNavigate(paths.userManagement),
          },
          {
            label: t('role.management'),
            icon: 'pi pi-lock',
            command: () => handleNavigate(paths.roleManagement),
          },
          {
            separator: true,
          },
          {
            label: t('nav.categories', 'Danh mục dữ liệu'),
            icon: 'pi pi-folder',
            command: () => handleNavigate(paths.categoryManagement),
          },
          {
            label: t('nav.system_parameters'),
            icon: 'pi pi-cog',
            command: () => handleNavigate(paths.systemParameters),
          },
          {
            label: t('nav.audit_logs'),
            icon: 'pi pi-list',
            command: () => handleNavigate(paths.auditManagement),
          },
          {
            label: t('nav.dead_letter'),
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
      isPolicyGroupActive,
      isRewardsGroupActive,
      isPartnerGroupActive,
      isReportsGroupActive,
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
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14a2 2 0 0 1 2 2H3a2 2 0 0 1 2-2z" />
        </svg>
      </div>
      <div className="flex flex-column">
        <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px', lineHeight: 1.1 }}>
          Micro <span style={{ color: '#FF6B00' }}>Loyalty</span>
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

  const currentUser = React.useMemo(() => {
    if (user && (user.fullName || user.userName || (user as any)?.username)) {
      return user;
    }
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    return user;
  }, [user]);

  const rawName = currentUser?.fullName || currentUser?.userName || (currentUser as any)?.username;
  const displayName = React.useMemo(() => {
    if (!rawName) return t('common.administrator');
    if (rawName.toLowerCase() === 'admin') return t('common.system_admin');
    return rawName;
  }, [rawName, t]);

  const userEmail = currentUser?.email || (currentUser?.userName ? `${currentUser.userName}@mid.io.vn` : 'admin@mid.io.vn');

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
              {displayName.charAt(0).toUpperCase()}
            </span>
          </span>
          <span
            className="user-name text-sm"
            style={{ fontWeight: 550 }}
            title={displayName}
          >
            {displayName}
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
                {displayName}
              </div>
              <div className="text-500 text-xs">
                {userEmail}
              </div>
            </div>
            <div
              className="custom-dropdown-item"
              onClick={() => {
                setIsProfileOpen(false);
                handleNavigate(paths.changeProfile);
              }}
            >
              <i className="pi pi-user text-primary mr-2" />
              <span>{t('profile.change_profile')}</span>
            </div>
            <div
              className="custom-dropdown-item"
              onClick={() => {
                setIsProfileOpen(false);
                handleNavigate(paths.changePassword);
              }}
            >
              <i className="pi pi-key text-primary mr-2" />
              <span>{t('profile.change_password')}</span>
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
              <span>{t('common.logout')}</span>
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
        header={t('common.confirm_logout')}
        message={t('common.confirm_logout_message')}
        acceptLabel={t('common.logout')}
        rejectLabel={t('common.cancel')}
        severity="danger"
      />
    </header>
  );
};

export default Header;
