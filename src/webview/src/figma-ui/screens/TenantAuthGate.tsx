import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Smartphone, KeyRound, Ticket, UserCheck, Building2, ChevronRight, Sparkles } from 'lucide-react';
import useSSOAuth from '../../hooks/useSSOAuth';
import { LoyaltyApi, type TenantAccountSummary } from '../../services/api';
import { changeLanguage } from '../../language';
import { CoinDot, Pill, SecondaryButton, Skeleton, fmt } from '../ui';
import { tierLook, tierLabel } from '../tiers';

const TENANTS = [
  { id: 'TENANT_NATCASH', key: 'sso.tenant_natcash', badge: '#FE810D' },
  { id: 'TENANT_DELIMART', key: 'sso.tenant_delimart', badge: '#2E7D32' },
  { id: 'TENANT_MICRO_CRM', key: 'sso.tenant_micro_crm', badge: '#2563EB' },
] as const;

const LANG_OPTIONS = [
  { code: 'vi', label: 'VI' },
  { code: 'en', label: 'EN' },
  { code: 'fr', label: 'FR' },
  { code: 'ht', label: 'HT' },
] as const;

export const TenantAuthGate: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { selectedTenantId, setTenantId, loginWithTenantAccount, loginWithTicket, error: authError } = useSSOAuth();

  const [accounts, setAccounts] = useState<TenantAccountSummary[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState<boolean>(false);
  const [authTab, setAuthTab] = useState<'account' | 'ticket'>('account');
  const [userIdInput, setUserIdInput] = useState<string>('');
  const [fullNameInput, setFullNameInput] = useState<string>('');
  const [verifyCodeInput, setVerifyCodeInput] = useState<string>('');
  const [ticketInput, setTicketInput] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const loadTenantAccounts = useCallback(async (tenantId: string) => {
    setLoadingAccounts(true);
    try {
      const list = await LoyaltyApi.getTenantAccounts(tenantId);
      setAccounts(Array.isArray(list) ? list : []);
    } catch {
      setAccounts([]);
    } finally {
      setLoadingAccounts(false);
    }
  }, []);

  useEffect(() => {
    void loadTenantAccounts(selectedTenantId);
  }, [selectedTenantId, loadTenantAccounts]);

  const routeAfterLogin = (accountRole?: string) => {
    if (accountRole === 'AGENT' || accountRole === 'SUPER_AGENT') {
      navigate('/agent', { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  };

  const handleSelectTenant = (tenantId: string) => {
    setLocalError(null);
    setTenantId(tenantId);
  };

  const handleQuickSwitch = async (acc: TenantAccountSummary) => {
    setLocalError(null);
    setSubmitting(true);
    try {
      const ctx = await loginWithTenantAccount({
        tenantId: selectedTenantId,
        externalUserId: acc.externalUserId,
        phoneNumber: acc.phoneNumber,
        fullName: acc.fullName,
        accountRole: acc.accountRole,
        authMethod: 'SSO_SWITCH',
      });
      routeAfterLogin(ctx.accountRole);
    } catch (err: any) {
      setLocalError(err?.message || t('sso.auth_failed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    const trimmedUser = userIdInput.trim();
    if (!trimmedUser) {
      setLocalError(t('sso.input_user_label'));
      return;
    }
    setSubmitting(true);
    try {
      const ctx = await loginWithTenantAccount({
        tenantId: selectedTenantId,
        externalUserId: trimmedUser,
        phoneNumber: trimmedUser,
        fullName: fullNameInput.trim() || undefined,
        verifyCode: verifyCodeInput.trim(),
        authMethod: 'OTP_PIN',
      });
      routeAfterLogin(ctx.accountRole);
    } catch (err: any) {
      setLocalError(err?.message || t('sso.auth_failed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateDemoTicket = async () => {
    setLocalError(null);
    const targetUser = userIdInput.trim() || accounts[0]?.externalUserId;
    if (!targetUser) {
      setLocalError(t('sso.input_user_label'));
      return;
    }
    const matched = accounts.find((a) => a.externalUserId === targetUser);
    setSubmitting(true);
    try {
      const res = await LoyaltyApi.generateSsoTicket(
        {
          partnerCode: selectedTenantId.replace(/^TENANT_/, ''),
          externalUserId: targetUser,
          phoneNumber: matched?.phoneNumber || targetUser,
          fullName: fullNameInput.trim() || matched?.fullName,
          accountRole: matched?.accountRole,
        },
        selectedTenantId
      );
      setTicketInput(res.sessionTicket);
    } catch (err: any) {
      setLocalError(err?.message || t('sso.auth_failed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleExchangeTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    const ticket = ticketInput.trim();
    if (!ticket) {
      setLocalError(t('sso.ticket_input_label'));
      return;
    }
    setSubmitting(true);
    try {
      const ctx = await loginWithTicket(ticket, selectedTenantId);
      routeAfterLogin(ctx.accountRole);
    } catch (err: any) {
      setLocalError(err?.message || t('sso.auth_failed'));
    } finally {
      setSubmitting(false);
    }
  };

  const roleLabel = (role?: string) => {
    if (role === 'SUPER_AGENT') return t('sso.role_super_agent');
    if (role === 'AGENT') return t('sso.role_agent');
    return t('sso.role_customer');
  };

  const roleTone = (role?: string): 'orange' | 'blue' | 'green' => {
    if (role === 'SUPER_AGENT') return 'blue';
    if (role === 'AGENT') return 'green';
    return 'orange';
  };

  const activeError = localError || authError;

  return (
    <div className="min-h-screen bg-[#F5F5F5] font-nc text-[#1F1F24]">
      <div className="mx-auto relative min-h-screen w-full max-w-[430px] pb-10">
        {/* Curved orange header matching Figma Webview design */}
        <svg aria-hidden className="pointer-events-none absolute inset-x-0 top-0 w-full" height={200} viewBox="0 0 390 200" preserveAspectRatio="none">
          <path d="M0 0H390V146C260 183.333 130 183.333 0 146V0Z" fill="#FE810D" />
          <ellipse cx="350" cy="-22" rx="150" ry="90" fill="#fff" fillOpacity="0.07" />
          <ellipse cx="40" cy="132" rx="120" ry="50" fill="#fff" fillOpacity="0.05" />
        </svg>

        <div className="relative z-10 flex items-center justify-between px-4 pt-4">
          <div className="flex items-center gap-2 text-white">
            <span className="flex size-9 items-center justify-center rounded-full bg-white/20">
              <ShieldCheck className="size-5 text-white" />
            </span>
            <span className="text-[15px] font-semibold">Natcash Loyalty</span>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-white/20 p-1">
            {LANG_OPTIONS.map((lng) => (
              <button
                key={lng.code}
                type="button"
                onClick={() => changeLanguage(lng.code)}
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-colors ${
                  i18n.language === lng.code ? 'bg-white text-[#FE810D]' : 'text-white/90'
                }`}
              >
                {lng.label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative z-10 px-4 pt-4 pb-3 text-white">
          <h1 className="text-[22px] font-bold leading-7">{t('sso.gate_title')}</h1>
          <p className="mt-1 text-[13px] leading-[18px] text-white/90">{t('sso.gate_subtitle')}</p>
        </div>

        <main className="relative z-10 flex flex-col gap-3.5 px-4 pt-1">
          {activeError && (
            <div role="alert" className="rounded-[16px] border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] font-medium text-red-700">
              {activeError}
            </div>
          )}

          {/* Tenant selector card */}
          <section className="flex flex-col gap-2.5 rounded-[20px] bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
            <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-700">
              <Building2 className="size-4 text-[#FE810D]" />
              <span>{t('sso.select_tenant_label')}</span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {TENANTS.map((item) => {
                const selected = selectedTenantId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectTenant(item.id)}
                    className={`flex items-center justify-between rounded-[14px] border px-3.5 py-2.5 text-left transition-colors ${
                      selected
                        ? 'border-[#FE810D] bg-[#FFF4EA] text-[#1F1F24]'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.badge }} />
                      <span className="truncate text-[13.5px] font-semibold">{t(item.key)}</span>
                    </span>
                    <span className="ml-2 shrink-0 text-[11px] font-semibold text-slate-400">{item.id}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Quick Identity Switcher for Tenant accounts */}
          <section className="flex flex-col gap-2.5 rounded-[20px] bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
            <div className="flex items-center gap-2">
              <UserCheck className="size-4 shrink-0 text-[#FE810D]" />
              <div className="min-w-0 flex-1">
                <h2 className="text-[15px] font-semibold">{t('sso.quick_switch_title', { tenant: selectedTenantId })}</h2>
                <p className="text-[12px] leading-4 text-slate-500">{t('sso.quick_switch_subtitle')}</p>
              </div>
            </div>

            {loadingAccounts ? (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-[68px]" />
                <Skeleton className="h-[68px]" />
              </div>
            ) : accounts.length === 0 ? (
              <p className="rounded-[14px] bg-slate-50 p-3 text-[12px] leading-[17px] text-slate-500">
                {t('sso.no_accounts_found')}
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {accounts.map((acc) => {
                  const look = tierLook(acc.tierCode);
                  return (
                    <button
                      key={acc.externalUserId}
                      type="button"
                      disabled={submitting}
                      onClick={() => handleQuickSwitch(acc)}
                      className="flex items-center gap-3 rounded-[16px] border border-slate-100 bg-[#FAFAFB] p-3 text-left transition-colors hover:border-[#FE810D] disabled:opacity-60"
                    >
                      <img src={look.medal} alt="" className="size-10 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-[14px] font-semibold text-slate-900">
                            {acc.fullName || acc.externalUserId}
                          </span>
                          <Pill tone={roleTone(acc.accountRole)}>{roleLabel(acc.accountRole)}</Pill>
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-slate-500">
                          <span>{acc.phoneNumber || acc.externalUserId}</span>
                          <span>·</span>
                          <span>{tierLabel(acc.tierName, acc.tierCode)}</span>
                          {acc.segmentName && (
                            <>
                              <span>·</span>
                              <span className="truncate">{acc.segmentName}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span className="flex items-center gap-1 rounded-full bg-[#FFF4EA] px-2 py-0.5 text-[12px] font-bold text-[#FE810D]">
                          <CoinDot className="size-3.5" />
                          {fmt(acc.currentPoints)}
                        </span>
                        <ChevronRight className="size-4 text-slate-400" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* Manual Account Verification / SSO Ticket Exchange */}
          <section className="flex flex-col gap-3 rounded-[20px] bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
            <div className="flex rounded-full bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => { setAuthTab('account'); setLocalError(null); }}
                className={`flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full text-[13px] font-semibold ${
                  authTab === 'account' ? 'bg-white text-[#FE810D] shadow-sm' : 'text-slate-600'
                }`}
              >
                <Smartphone className="size-4" />
                {t('sso.tab_account_login')}
              </button>
              <button
                type="button"
                onClick={() => { setAuthTab('ticket'); setLocalError(null); }}
                className={`flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full text-[13px] font-semibold ${
                  authTab === 'ticket' ? 'bg-white text-[#FE810D] shadow-sm' : 'text-slate-600'
                }`}
              >
                <Ticket className="size-4" />
                {t('sso.tab_sso_ticket')}
              </button>
            </div>

            {authTab === 'account' ? (
              <form onSubmit={handleAccountSubmit} className="flex flex-col gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-[12px] font-semibold text-slate-600">{t('sso.input_user_label')}</span>
                  <input
                    type="text"
                    value={userIdInput}
                    onChange={(e) => setUserIdInput(e.target.value)}
                    placeholder={t('sso.input_user_placeholder')}
                    className="h-11 rounded-[12px] border border-slate-200 px-3 text-[14px] outline-none focus:border-[#FE810D]"
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-[12px] font-semibold text-slate-600">{t('sso.input_name_label')}</span>
                  <input
                    type="text"
                    value={fullNameInput}
                    onChange={(e) => setFullNameInput(e.target.value)}
                    placeholder={t('sso.input_name_placeholder')}
                    className="h-11 rounded-[12px] border border-slate-200 px-3 text-[14px] outline-none focus:border-[#FE810D]"
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-600">
                    <KeyRound className="size-3.5 text-[#FE810D]" />
                    {t('sso.input_pin_label')}
                  </span>
                  <input
                    type="password"
                    value={verifyCodeInput}
                    onChange={(e) => setVerifyCodeInput(e.target.value)}
                    placeholder={t('sso.input_pin_placeholder')}
                    className="h-11 rounded-[12px] border border-slate-200 px-3 text-[14px] outline-none focus:border-[#FE810D]"
                  />
                </label>

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-1 flex h-[46px] w-full items-center justify-center gap-2 rounded-[14px] bg-brand text-[14px] font-semibold text-white disabled:opacity-50"
                >
                  {submitting ? t('sso.verifying') : t('sso.btn_verify_login')}
                </button>
              </form>
            ) : (
              <form onSubmit={handleExchangeTicket} className="flex flex-col gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-[12px] font-semibold text-slate-600">{t('sso.ticket_input_label')}</span>
                  <input
                    type="text"
                    value={ticketInput}
                    onChange={(e) => setTicketInput(e.target.value)}
                    placeholder={t('sso.ticket_input_placeholder')}
                    className="h-11 rounded-[12px] border border-slate-200 px-3 text-[13px] font-mono outline-none focus:border-[#FE810D]"
                  />
                </label>

                <SecondaryButton onClick={handleGenerateDemoTicket}>
                  <Sparkles className="size-4 text-[#FE810D]" />
                  {t('sso.btn_generate_demo_ticket')}
                </SecondaryButton>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex h-[46px] w-full items-center justify-center gap-2 rounded-[14px] bg-brand text-[14px] font-semibold text-white disabled:opacity-50"
                >
                  {submitting ? t('sso.verifying') : t('sso.btn_exchange_ticket')}
                </button>
              </form>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};

export default TenantAuthGate;
