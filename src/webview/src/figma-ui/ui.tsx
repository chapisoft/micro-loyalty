import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { LoyaltyJSBridge } from '../bridge/LoyaltyJSBridge';
import useSSOAuth from '../hooks/useSSOAuth';
import { changeLanguage, SUPPORTED_LANGUAGES } from '../language';
import iconArrowLeft from '../assets/figma/icon-arrow-left.svg';
import iconEllipsis from '../assets/figma/icon-ellipsis.svg';
import iconX from '../assets/figma/icon-x.svg';

/** Shared building blocks of the Figma "App · Customer journeys" screens (Natcash · Webview frame). */

export const fmt = (n: number | undefined | null) => Math.round(Number(n) || 0).toLocaleString('en-US');

/** Accepts ISO dates and the service's dd/MM/yyyy strings. */
export const toDate = (v?: string) => {
  if (!v) return new Date(NaN);
  const m = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return m ? new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1])) : new Date(v);
};

export const ddmm = (iso?: string) => {
  if (!iso) return '';
  const d = toDate(iso);
  return Number.isNaN(d.getTime()) ? '' : `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export const ddmmyyyy = (iso?: string) => {
  const s = ddmm(iso);
  return s ? `${s}/${toDate(iso).getFullYear()}` : '';
};

/** Phone column: every screen, bar and sheet is centred at this width so tablets and desktop browsers keep the phone layout. */
const COL = 'mx-auto w-full max-w-[430px]';

/**
 * Webview top bar: back · title · [… | ×].
 * Back rule (Figma 17/11): detail screens go to the previous screen (no `back`), post-action screens pass their flow root,
 * tab roots pass "/" (Loyalty Home). "…" opens the More sheet over the current screen; "×" closes Loyalty.
 * `orange`: transparent bar on the orange header background (white icons, white title).
 */
export const WebviewHeader: React.FC<{ title: string; back?: string; orange?: boolean; transparent?: boolean; hideTitle?: boolean }> = ({
  title,
  back,
  orange,
  transparent,
  hideTitle,
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [more, setMore] = React.useState(false);
  const goBack = () => (back ? navigate(back) : window.history.length > 1 ? navigate(-1) : LoyaltyJSBridge.closeWebview());
  const overlay = !!orange || !!transparent;
  return (
    <header className={overlay ? 'relative z-10' : 'sticky top-0 z-30 bg-white'}>
      <div className="flex h-[52px] items-center gap-2 px-4">
        <button
          type="button"
          aria-label={t('figma_ui.common.back')}
          onClick={goBack}
          className={
            transparent
              ? 'flex size-9 shrink-0 items-center justify-center rounded-full bg-white/90 shadow-sm'
              : '-ml-2 flex size-11 shrink-0 items-center justify-center'
          }
        >
          <img src={iconArrowLeft} alt="" className={`size-[20px] ${orange ? 'brightness-0 invert' : ''}`} />
        </button>
        <h1 className={`min-w-0 flex-1 truncate text-[15px] font-semibold leading-5 ${orange ? 'text-white' : 'text-slate-900'} ${hideTitle ? 'invisible' : ''}`}>{title}</h1>
        <div className={`flex h-10 w-[88px] shrink-0 items-center justify-around rounded-[20px] bg-white ${transparent ? 'shadow-sm' : orange ? '' : 'border border-slate-200'}`}>
          <button type="button" aria-label={t('figma_ui.common.more_options')} onClick={() => setMore(true)} className="flex size-10 items-center justify-center">
            <img src={iconEllipsis} alt="" className="size-[18px]" />
          </button>
          <button type="button" aria-label={t('figma_ui.common.close_loyalty')} onClick={() => LoyaltyJSBridge.closeWebview()} className="flex size-10 items-center justify-center">
            <img src={iconX} alt="" className="size-[18px]" />
          </button>
        </div>
      </div>
      <MoreSheet open={more} onClose={() => setMore(false)} />
    </header>
  );
};

/**
 * Orange header background exported from Figma ("Top gradient" 706:260 / 706:102 / 706:221 / 708:36): solid #FE810D with a
 * curved bottom and two soft white shapes. All tab roots use the same drawing; only the height changes.
 * Heights are the Figma ones minus the 32 px phone status bar (the native app draws that).
 */
export const HEADER_H = { home: 234, missions: 194, games: 210, vouchers: 246, network: 194 } as const;
/** Where the content starts under the orange header (Figma y minus the status bar): Home card overlaps the curve, Missions starts below it. */
const CONTENT_Y = { home: 120, missions: 186, games: 150, vouchers: 212, network: 186 } as const;
const HeaderBg: React.FC<{ h: number }> = ({ h }) => {
  const c = h - 56;
  return (
    <svg aria-hidden className="pointer-events-none absolute inset-x-0 top-0 w-full" height={h} viewBox={`0 0 390 ${h}`} preserveAspectRatio="none">
      <path d={`M0 0H390V${c}C260 ${c + 37.333} 130 ${c + 37.333} 0 ${c}V0Z`} fill="#FE810D" />
      <ellipse cx="350" cy="-22" rx="150" ry="90" fill="#fff" fillOpacity="0.07" />
      <ellipse cx="40" cy={c - 14} rx="120" ry="50" fill="#fff" fillOpacity="0.05" />
    </svg>
  );
};

// ───────────── Bottom tab bars (Figma components 593:218 customer · 743:221 agent · 743:462 super agent) ─────────────
export type Shell = 'customer' | 'agent' | 'super';
export type TabKey = 'home' | 'missions' | 'games' | 'network' | 'vouchers';
const TAB_LABEL_KEY: Record<TabKey, string> = {
  home: 'figma_ui.tabs.home',
  missions: 'figma_ui.tabs.missions',
  games: 'figma_ui.tabs.games',
  network: 'figma_ui.tabs.network',
  vouchers: 'figma_ui.tabs.vouchers',
};
/** Outline icon when idle, filled when selected (Figma tab bar). */
const TabIcon: React.FC<{ k: TabKey; on: boolean }> = ({ k, on }) => {
  const p = { fill: on ? 'currentColor' : 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const cut = on ? '#fff' : 'currentColor';
  return (
    <svg viewBox="0 0 24 24" className="size-6" aria-hidden>
      {k === 'home' && <><path {...p} d="M3.5 10.2 12 3.5l8.5 6.7V19a1.5 1.5 0 0 1-1.5 1.5h-4.2v-5.7H9.2v5.7H5A1.5 1.5 0 0 1 3.5 19z" />{on && <rect x="9.6" y="14.2" width="4.8" height="6.3" rx="0.8" fill="#fff" />}</>}
      {k === 'missions' && <><circle cx="12" cy="12" r="8.6" fill="none" stroke="currentColor" strokeWidth={on ? 2.6 : 1.8} /><circle cx="12" cy="12" r="3.6" fill={on ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.8} /></>}
      {k === 'games' && <><rect {...p} x="2.5" y="6.5" width="19" height="11.5" rx="4.5" /><path d="M7 12.3h4M9 10.3v4" stroke={cut} strokeWidth={1.8} strokeLinecap="round" /><circle cx="15.6" cy="11.4" r="1" fill={cut} /><circle cx="17.6" cy="13.6" r="1" fill={cut} /></>}
      {k === 'network' && <><circle {...p} cx="9" cy="8" r="3.2" /><path {...p} d="M3 20a6 6 0 0 1 12 0z" /><circle {...p} cx="17.2" cy="9" r="2.5" /><path fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" d="M16.2 14.3a5 5 0 0 1 5 5.3" /></>}
      {k === 'vouchers' && <><path {...p} d="M3 8.2a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2.3a1.8 1.8 0 0 0 0 3.6v2.3a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2.3a1.8 1.8 0 0 0 0-3.6z" /><path d="M9.5 6.5v11" stroke={cut} strokeWidth={1.6} strokeDasharray="1.6 1.8" /></>}
    </svg>
  );
};
export const SHELL_TABS: Record<Shell, [TabKey, string][]> = {
  customer: [['home', '/'], ['missions', '/missions'], ['games', '/games'], ['vouchers', '/rewards']],
  agent: [['home', '/agent'], ['missions', '/agent/missions'], ['vouchers', '/agent/vouchers']],
  super: [['home', '/agent'], ['missions', '/agent/missions'], ['network', '/agent/network'], ['vouchers', '/agent/vouchers']],
};
/** Base path of the voucher screens for a shell (customer `/rewards`, agents `/agent/vouchers`). */
export const voucherBase = (shell: Shell) => (shell === 'customer' ? { store: '/rewards', mine: '/my-vouchers' } : { store: '/agent/vouchers', mine: '/agent/my-vouchers' });

export const TabBar: React.FC<{ shell: Shell; active: TabKey }> = ({ shell, active }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  return (
    <>
      <div className="h-[84px]" />
      <nav aria-label="Loyalty menu" className="fixed inset-x-0 bottom-0 z-20">
        <div className={`${COL} flex h-[70px] rounded-t-[20px] bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(0,0,0,0.06)]`}>
          {SHELL_TABS[shell].map(([k, to]) => {
            const on = k === active;
            return (
              <button key={k} type="button" onClick={() => !on && navigate(to)} aria-current={on ? 'page' : undefined} className={`relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 ${on ? 'text-[#FE810D]' : 'text-[#8B8B93]'}`}>
                {on && <span className="absolute left-1/2 top-0 h-[3px] w-9 -translate-x-1/2 rounded-b-[3px] bg-[#FE810D]" />}
                <TabIcon k={k} on={on} />
                <span className={`truncate text-[12px] ${on ? 'font-semibold' : 'font-medium'}`}>{t(TAB_LABEL_KEY[k])}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};

/**
 * Page in the phone column (max 430 px, centred on tablets and desktop) on the Figma grey #F5F5F5, Be Vietnam Pro.
 * `hero` + `heroH`: tab-root orange header (Figma 17/11) drawn behind the bar and the hero block; content may overlap its curve.
 * `barTitle`: keep the title in the bar (Home shows "Rewards" in the bar); otherwise the hero carries the title, not shown twice.
 * `tab`: bottom tab bar of the shell.
 */
export const Screen: React.FC<{
  title: string;
  back?: string;
  hero?: React.ReactNode;
  heroH?: number;
  cover?: string;
  coverClass?: string;
  barTitle?: boolean;
  tab?: { shell: Shell; active: TabKey };
  children: React.ReactNode;
}> = ({ title, back, hero, heroH, cover, coverClass = '', barTitle, tab, children }) => (
  <div className="min-h-screen bg-[#F5F5F5] font-nc text-[#1F1F24]">
    <div className={`${COL} relative min-h-screen`}>
      {hero && <HeaderBg h={heroH ?? HEADER_H[tab?.active || 'missions']} />}
      {!hero && cover && (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[210px] overflow-hidden">
          <img src={cover} alt="" className={`size-full object-cover ${coverClass}`} />
          <span className="absolute inset-x-0 top-0 h-[108px] bg-gradient-to-b from-white/95 via-white/60 to-transparent" />
        </div>
      )}
      <WebviewHeader title={title} back={back} orange={!!hero} transparent={!hero && !!cover} hideTitle={!!hero && !barTitle} />
      {hero && <div className="relative px-4 pb-3 text-white" style={{ minHeight: CONTENT_Y[tab?.active || 'missions'] - 52 }}>{hero}</div>}
      <main className={`relative flex flex-col gap-[14px] px-4 ${tab ? 'pb-4' : 'pb-8'} ${hero ? 'pt-1' : cover ? 'pt-[118px]' : 'pt-4'}`}>{children}</main>
    </div>
    {tab && <TabBar shell={tab.shell} active={tab.active} />}
  </div>
);

/** Content of the orange header (Figma Missions / Games / Vouchers): title 22, one line, white coins pill, AI illustration on orange. */
export const Hero: React.FC<{ title: string; sub?: string; coins?: number; onCoins?: () => void; art?: string; children?: React.ReactNode }> = ({ title, sub, coins, onCoins, art, children }) => (
  <div className="flex flex-col gap-3.5">
    <div className="flex items-center gap-2">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <h2 className="text-[22px] font-bold leading-7">{title}</h2>
        {sub && <p className="text-[13px] leading-[18px] text-white/90">{sub}</p>}
        {coins !== undefined && (
          <button type="button" onClick={onCoins} className="mt-2 flex h-8 w-fit items-center gap-1.5 rounded-full bg-white pl-1.5 pr-3 text-[15px] font-bold text-[#1F1F24]">
            <CoinDot className="size-[22px]" /> {fmt(coins)} <span className="ml-0.5 text-[16px] font-semibold text-[#FE810D]">›</span>
          </button>
        )}
      </div>
      {art && <img src={art} alt="" className="-my-3 h-[96px] w-[128px] shrink-0 object-contain [mask-image:radial-gradient(closest-side,#000_72%,transparent)]" />}
    </div>
    {children}
  </div>
);

export const CoinDot: React.FC<{ className?: string }> = ({ className = 'size-[18px]' }) => (
  <svg viewBox="0 0 20 20" className={className} aria-hidden>
    <circle cx="10" cy="10" r="9.5" fill="#FFD36B" />
    <circle cx="10" cy="10" r="7" fill="#FFB020" />
    <circle cx="10" cy="10" r="4" fill="none" stroke="#FFF3D1" strokeWidth="1.6" />
  </svg>
);

/** Pill segmented control inside the orange header (Store / My vouchers): white track 20 %, selected pill white with orange text. */
export const Segmented: React.FC<{ items: { key: string; label: React.ReactNode }[]; value: string; onChange: (k: string) => void }> = ({ items, value, onChange }) => (
  <div role="tablist" className="flex w-full rounded-full bg-white/20 p-1">
    {items.map((it) => (
      <button key={it.key} type="button" role="tab" aria-selected={value === it.key} onClick={() => onChange(it.key)} className={`flex h-9 min-w-0 flex-1 items-center justify-center gap-1.5 truncate rounded-full text-[14px] font-semibold ${value === it.key ? 'bg-white text-[#FE810D] shadow-sm' : 'text-white'}`}>
        {it.label}
      </button>
    ))}
  </div>
);

/** Soft filter chip (selected: #FFE9D4 with orange text). */
export const Chip: React.FC<{ on?: boolean; onClick?: () => void; children: React.ReactNode }> = ({ on, onClick, children }) => (
  <button type="button" onClick={onClick} className={`flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-[13px] ${on ? 'border border-[#FE810D] bg-[#FFF4EA] font-semibold text-[#FE810D]' : 'border border-slate-200 bg-white text-slate-700'}`}>
    {children}
  </button>
);

/**
 * Standard list card (Figma "My vouchers" 330:250, the reference the reviewer approved):
 * white, radius 16, soft shadow; photo 100×80 with the partner tag; 3 lines; action on the right.
 */
export const ListCard: React.FC<{
  photo: string;
  tag?: string;
  tagIcon?: React.ReactNode;
  title: string;
  sub?: string;
  line3?: React.ReactNode;
  action?: React.ReactNode;
  dim?: boolean;
  onClick?: () => void;
}> = ({ photo, tag, tagIcon, title, sub, line3, action, dim, onClick }) => (
  <div className="flex w-full items-center gap-2.5 rounded-[16px] bg-white p-1.5 pr-3 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
    <button type="button" onClick={onClick} className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
      <span className="relative h-20 w-[100px] shrink-0 overflow-hidden rounded-[12px]">
        <img src={photo} alt="" className={`size-full object-cover ${dim ? 'opacity-50 grayscale' : ''}`} />
        {tag && (
          <span className="absolute left-1.5 top-1.5 inline-flex max-w-[90px] items-center gap-1 rounded-full bg-white/95 px-1.5 py-0.5 text-[11px] font-medium text-slate-900 shadow-sm">
            {tagIcon}
            <span className="truncate">{tag}</span>
          </span>
        )}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className={`truncate text-[16px] font-bold leading-5 ${dim ? 'text-slate-400' : ''}`}>{title}</span>
        {sub && <span className="truncate text-[12.5px] leading-4 text-[#8B8B93]">{sub}</span>}
        {line3 && <span className="mt-1 flex min-w-0">{line3}</span>}
      </span>
    </button>
    {action && <span className="shrink-0">{action}</span>}
  </div>
);

/** Small dark toast above the tab bar ("Saved to My vouchers · View"). */
export const Toast: React.FC<{ text: string | null; action?: string; onAction?: () => void }> = ({ text, action, onAction }) =>
  text ? (
    <div role="status" className="fixed inset-x-0 bottom-[88px] z-40 px-4">
      <div className={`${COL} flex items-center gap-2.5 rounded-[14px] bg-[#1F1F24]/95 px-3.5 py-3 text-[14px] font-medium text-white shadow-lg`}>
        <svg viewBox="0 0 24 24" className="size-5 shrink-0" aria-hidden><circle cx="12" cy="12" r="10" fill="#22C55E" /><path d="M7.5 12.5l3 3 6-6.5" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        <span className="min-w-0 flex-1">{text}</span>
        {action && <button type="button" onClick={onAction} className="font-semibold text-[#FFB066]">{action}</button>}
      </div>
    </div>
  ) : null;

export function useToast(ms = 3500): [string | null, (t: string) => void] {
  const [text, setText] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (!text) return;
    const t = setTimeout(() => setText(null), ms);
    return () => clearTimeout(t);
  }, [text, ms]);
  return [text, setText];
}

// ───────────── "…" More sheet (Figma 732:2) and Language sheet (CN-05b) ─────────────
const MoreSheet: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const [lang, setLang] = React.useState(false);
  const { t, i18n } = useTranslation();
  const { session, userContext, logout } = useSSOAuth();
  const go = (to: string) => {
    onClose();
    navigate(to);
  };
  const isAgent = typeof window !== 'undefined' && window.location.hash.startsWith('#/agent');
  const accountRole = userContext?.accountRole || session?.accountRole || 'CUSTOMER';
  const canAccessAgent = accountRole === 'AGENT' || accountRole === 'SUPER_AGENT';
  const rows: [string, () => void][] = [
    ...(canAccessAgent
      ? [[isAgent ? t('sso.open_customer_portal') : t('sso.open_agent_portal'), () => go(isAgent ? '/' : '/agent')] as [string, () => void]]
      : []),
    ...(isAgent ? [] : ([[t('figma_ui.more.share_rewards'), () => go('/invite')]] as [string, () => void][])),
    [t('figma_ui.more.coins_history'), () => go('/coins')],
    [t('figma_ui.more.notification_settings'), () => go('/notifications')],
    [t('figma_ui.more.language'), () => setLang(true)],
    [t('figma_ui.more.program_terms'), () => go('/terms')],
    ...(session
      ? [[t('sso.sign_out'), () => { onClose(); logout(); navigate('/', { replace: true }); }] as [string, () => void]]
      : []),
  ];
  return (
    <>
      <Sheet open={open && !lang} onClose={onClose} title={t('figma_ui.common.more')}>
        {session ? (
          <div className="rounded-[16px] bg-[#FFF4EA] px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#E06C00]">{t('sso.current_account_label')}</p>
            <p className="mt-0.5 truncate text-[14px] font-bold text-slate-900">
              {session.fullName || session.externalUserId}
              <span className="ml-1.5 text-[12px] font-normal text-slate-600">· {session.phoneNumber || session.externalUserId}</span>
            </p>
            <p className="mt-0.5 text-[12px] text-slate-600">
              {t('sso.tenant_label')}: <span className="font-semibold">{session.tenantId}</span> · {accountRole}
            </p>
          </div>
        ) : (
          <div className="rounded-[16px] bg-slate-100 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{t('sso.guest_badge_title')}</p>
            <p className="mt-0.5 text-[12.5px] leading-5 text-slate-700">{t('sso.guest_badge_sub')}</p>
          </div>
        )}
        <div className="divide-y divide-slate-100 rounded-[16px] bg-[#F7F7F8]">
          {rows.map(([label, fn]) => (
            <button key={label} type="button" onClick={fn} className="flex h-12 w-full items-center px-4 text-left text-[15px]">
              <span className={`flex-1 ${label === t('sso.sign_out') ? 'font-semibold text-[#FE810D]' : ''}`}>{label}</span>
              <span className="text-slate-400">›</span>
            </button>
          ))}
        </div>
      </Sheet>
      <Sheet open={open && lang} onClose={() => { setLang(false); onClose(); }} title={t('figma_ui.common.language')}>
        <div className="divide-y divide-slate-100 rounded-[16px] bg-[#F7F7F8]">
          {SUPPORTED_LANGUAGES.map(({ code, label }) => (
            <button key={code} type="button" onClick={() => { changeLanguage(code); setLang(false); onClose(); }} className="flex h-12 w-full items-center px-4 text-left text-[15px]">
              <span className={`flex-1 ${i18n.language === code ? 'font-semibold' : ''}`}>{label}</span>
              {i18n.language === code && <span className="text-[#FE810D]">✓</span>}
            </button>
          ))}
        </div>
      </Sheet>
    </>
  );
};

export const SectionHeader: React.FC<{ title: string; action?: string; onAction?: () => void }> = ({ title, action, onAction }) => (
  <div className="flex w-full items-center gap-2">
    <h2 className="min-w-0 flex-1 text-[18px] font-semibold leading-[26px] text-slate-900">{title}</h2>
    {action && (
      <button type="button" onClick={onAction} className="flex h-11 items-center justify-end whitespace-nowrap text-[12px] font-semibold leading-[17px] text-brand">
        {action}
      </button>
    )}
  </div>
);

/** White rounded card (radius 20, padding 16). */
export const Card: React.FC<{ className?: string; children: React.ReactNode; onClick?: () => void; tint?: string }> = ({
  className = '',
  children,
  onClick,
  tint,
}) => {
  const cls = `flex w-full flex-col gap-2.5 rounded-[20px] p-4 text-left ${tint ? '' : 'bg-white'} ${className}`;
  return onClick ? (
    <button type="button" onClick={onClick} className={cls} style={tint ? { background: tint } : undefined}>
      {children}
    </button>
  ) : (
    <div className={cls} style={tint ? { background: tint } : undefined}>
      {children}
    </div>
  );
};

type Tone = 'green' | 'orange' | 'red' | 'grey' | 'blue';
const TONE: Record<Tone, string> = {
  green: 'bg-emerald-50 text-emerald-700',
  orange: 'bg-brand-soft text-[#B35400]',
  red: 'bg-[#FDE2E1] text-[#C0392B]',
  grey: 'bg-slate-100 text-slate-500',
  blue: 'bg-sky-50 text-sky-700',
};
export const Pill: React.FC<{ tone?: Tone; children: React.ReactNode; className?: string }> = ({ tone = 'grey', children, className = '' }) => (
  <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold leading-4 ${TONE[tone]} ${className}`}>
    {children}
  </span>
);

export const PrimaryButton: React.FC<{ children: React.ReactNode; onClick?: () => void; disabled?: boolean; className?: string }> = ({
  children,
  onClick,
  disabled,
  className = '',
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`flex h-[46px] ${/\b(w-|flex-)/.test(className) ? '' : 'w-full'} items-center justify-center gap-2 rounded-[14px] bg-brand text-[14px] font-semibold text-white disabled:opacity-50 ${className}`}
  >
    {children}
  </button>
);

export const SecondaryButton: React.FC<{ children: React.ReactNode; onClick?: () => void; disabled?: boolean; className?: string }> = ({ children, onClick, disabled, className = '' }) => (
  <button type="button" onClick={onClick} disabled={disabled} className={`flex h-[46px] ${/\b(w-|flex-)/.test(className) ? '' : 'w-full'} items-center justify-center gap-2 rounded-[14px] border border-slate-200 bg-white text-[14px] font-semibold disabled:opacity-60 ${className}`}>
    {children}
  </button>
);

export const Switch: React.FC<{ on: boolean; disabled?: boolean; onChange?: (v: boolean) => void; label: string }> = ({ on, disabled, onChange, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={on}
    aria-label={label}
    disabled={disabled}
    onClick={() => onChange?.(!on)}
    className={`relative h-7 w-12 shrink-0 rounded-full transition ${on ? 'bg-[#FE810D]' : 'bg-slate-200'} disabled:opacity-60`}
  >
    <span className={`absolute top-1 size-5 rounded-full bg-white shadow transition-all ${on ? 'left-6' : 'left-1'}`} />
  </button>
);

/** Bottom action bar pinned to the screen bottom (e.g. "Scan to pay", "Claim 150 coins"). */
export const BottomBar: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <>
    <div className="h-[70px]" />
    <div className="fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-[430px] bg-white/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur">{children}</div>
  </>
);

export const InfoRows: React.FC<{ rows: [string, React.ReactNode][] }> = ({ rows }) => (
  <div className="w-full divide-y divide-slate-100 rounded-[20px] bg-white px-4">
    {rows.map(([k, v]) => (
      <div key={k} className="flex items-center justify-between gap-3 py-3 text-[13px]">
        <span className="text-slate-500">{k}</span>
        <span className="text-right font-semibold">{v}</span>
      </div>
    ))}
  </div>
);

/** Result layout shared by reward / game / payment outcomes: 3D illustration, title, big value, rows, actions. */
export const ResultBlock: React.FC<{
  art: string;
  title: string;
  value?: React.ReactNode;
  valueTone?: 'green' | 'orange' | 'slate';
  sub?: React.ReactNode;
  children?: React.ReactNode;
}> = ({ art, title, value, valueTone = 'green', sub, children }) => (
  <div className="flex w-full flex-col items-center overflow-hidden rounded-[20px] bg-white pb-5 text-center">
    <div className="flex h-[150px] w-full items-center justify-center bg-brand-soft">
      <img src={art} alt="" className="size-[120px] object-contain mix-blend-multiply" />
    </div>
    <h2 className="mt-4 px-4 text-[20px] font-semibold leading-7">{title}</h2>
    {value !== undefined && (
      <p className={`mt-1 text-[32px] font-semibold leading-[44px] ${valueTone === 'green' ? 'text-emerald-700' : valueTone === 'orange' ? 'text-brand' : 'text-slate-900'}`}>{value}</p>
    )}
    {sub && <p className="mt-1 px-6 text-[13px] leading-5 text-slate-500">{sub}</p>}
    {children}
  </div>
);

/** Centered popup over a dimmed screen (check-in complete, reward claimed, lesson complete). */
export const Popup: React.FC<{ open: boolean; onClose: () => void; children: React.ReactNode }> = ({ open, onClose, children }) => {
  const { t } = useTranslation();
  return open ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6" role="dialog">
      <button type="button" aria-label={t('figma_ui.common.close')} onClick={onClose} className="absolute inset-0 bg-slate-900/45" />
      <div className="relative flex w-full max-w-[340px] flex-col items-center gap-2 rounded-[24px] bg-white p-5 text-center font-nc">{children}</div>
    </div>
  ) : null;
};

/** Bottom sheet (FIFO batches, filters). */
export const Sheet: React.FC<{ open: boolean; onClose: () => void; title: string; centerTitle?: boolean; children: React.ReactNode }> = ({
  open,
  onClose,
  title,
  centerTitle = false,
  children,
}) => {
  const { t } = useTranslation();
  return open ? (
    <div className="fixed inset-0 z-40 flex flex-col justify-end font-nc" role="dialog" aria-label={title}>
      <button type="button" aria-label={t('figma_ui.common.close')} onClick={onClose} className="absolute inset-0 bg-slate-900/45" />
      <div className="relative mx-auto flex max-h-[88vh] w-full max-w-[430px] flex-col gap-3 overflow-y-auto rounded-t-[24px] bg-white px-5 pb-6 pt-2.5">
        <span className="mx-auto h-1 w-10 shrink-0 rounded-sm bg-slate-300" />
        <div className="flex items-center gap-2 pt-1">
          <h2 className={`min-w-0 flex-1 text-[18px] font-semibold ${centerTitle ? 'pl-8 text-center' : ''}`}>{title}</h2>
          <button type="button" aria-label={t('figma_ui.common.close')} onClick={onClose} className="flex size-8 shrink-0 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100">
            <X className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  ) : null;
};

export const Empty: React.FC<{ art?: string; title: string; text?: string; children?: React.ReactNode }> = ({ art, title, text, children }) => (
  <div className="flex w-full flex-col items-center gap-1 rounded-[20px] bg-white p-5 text-center">
    {art && <img src={art} alt="" className="mb-1 size-20 object-contain mix-blend-multiply" />}
    <p className="text-[15px] font-semibold">{title}</p>
    {text && <p className="text-[12px] leading-[17px] text-slate-500">{text}</p>}
    {children}
  </div>
);

/**
 * Horizontal slider row: touch-swipe on phones, click-and-drag with a mouse on desktop
 * (desktop browsers don't scroll horizontally on drag by themselves).
 */
export const SlideRow: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const drag = React.useRef<{ x: number; left: number; moved: boolean } | null>(null);
  return (
    <div
      ref={ref}
      className={`no-scrollbar -mx-4 flex cursor-grab touch-pan-x select-none gap-2 overflow-x-auto scroll-smooth px-4 pb-1 active:cursor-grabbing ${className}`}
      onMouseDown={(e) => (drag.current = { x: e.clientX, left: ref.current?.scrollLeft || 0, moved: false })}
      onMouseMove={(e) => {
        if (!drag.current || !ref.current) return;
        const dx = e.clientX - drag.current.x;
        if (Math.abs(dx) > 4) drag.current.moved = true;
        ref.current.style.scrollBehavior = 'auto';
        ref.current.scrollLeft = drag.current.left - dx;
      }}
      onMouseUp={() => setTimeout(() => (drag.current = null), 0)}
      onMouseLeave={() => (drag.current = null)}
      onClickCapture={(e) => {
        if (drag.current?.moved) {
          e.stopPropagation(); // a drag is not a tap on the chip underneath
          e.preventDefault();
        }
      }}
    >
      {children}
    </div>
  );
};

/** Generic async loader: returns [data, error, reload]. */
export function useLoad<T>(fn: () => Promise<T>, deps: React.DependencyList = []): [T | undefined, boolean, () => void] {
  const [data, setData] = React.useState<T>();
  const [failed, setFailed] = React.useState(false);
  const run = React.useCallback(() => {
    setFailed(false);
    fn().then(setData).catch(() => setFailed(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  React.useEffect(run, [run]);
  return [data, failed, run];
}

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse rounded-[20px] bg-slate-200/70 ${className}`} />
);

export const ErrorBlock: React.FC<{ onRetry: () => void }> = ({ onRetry }) => {
  const { t } = useTranslation();
  return (
    <div className="rounded-[20px] bg-white p-4 text-center">
      <p className="text-[14px] font-semibold">{t('figma_ui.common.load_error_title')}</p>
      <p className="mt-1 text-[12px] text-slate-500">{t('figma_ui.common.load_error_sub')}</p>
      <button type="button" onClick={onRetry} className="mt-3 h-11 rounded-[14px] bg-brand px-5 text-[14px] font-semibold text-white">
        {t('figma_ui.common.try_again')}
      </button>
    </div>
  );
};
