import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Users, Network as NetworkIcon, ChevronRight, Phone, BookOpen } from 'lucide-react';
import { LoyaltyApi, getDefaultUserId, type AgentDashboardResponse, type AgentSubordinateItem, type AgentPlaybook } from '../../services/api';
import { Screen, Hero, Skeleton, Pill, SecondaryButton, PrimaryButton, Empty, Popup, Sheet, Chip, SlideRow, useLoad, fmt, ddmmyyyy, type Shell } from '../ui';
import { RewardStore, RewardDetail, MyVouchers, MyVoucherDetail } from './Rewards';
import { artEmptyBox, artCup, aiMissions } from '../art';

const uid = () => getDefaultUserId();

/**
 * Agent / Super Agent webview (Figma section 7, 18/11): same framework as customers, no games.
 * Agent bar: Home · Missions · Vouchers. Super Agent bar: Home · Missions · Network · Vouchers.
 * shortcut: the role comes from GET /agents/dashboard (agentRole); move it to the JWT `role` claim when SSO adds it (plan GĐ6).
 */
let cached: Promise<AgentDashboardResponse> | null = null;
const loadDashboard = () => (cached ??= LoyaltyApi.getAgentDashboard(uid()).catch((e) => { cached = null; throw e; }));

type AgentData = { d: AgentDashboardResponse; shell: Shell; coins?: number };
const AgentGate: React.FC<{ children: (a: AgentData) => React.ReactNode; title: string }> = ({ children, title }) => {
  const { t } = useTranslation();
  const userId = uid();
  const [data, failed, reload] = useLoad(async () => {
    if (!userId) return null;
    const [d, p] = await Promise.all([loadDashboard(), LoyaltyApi.getProfile(userId).catch(() => null)]);
    return { d, shell: (d.agentRole === 'SUPER_AGENT' ? 'super' : 'agent') as Shell, coins: p?.currentPoints };
  }, [userId]);
  if (!userId)
    return (
      <Screen title={title}>
        <Empty art={artEmptyBox} title={t('sso.guest_login_required')} text={t('sso.guest_login_required_desc')} />
      </Screen>
    );
  if (failed)
    return (
      <Screen title={title}>
        <Empty art={artEmptyBox} title={t('figma_ui.agent.not_agent_title')} text={t('figma_ui.agent.not_agent_sub')}>
          <SecondaryButton className="mt-3" onClick={reload}>{t('figma_ui.common.try_again')}</SecondaryButton>
        </Empty>
      </Screen>
    );
  if (!data) return <Screen title={title}><Skeleton className="h-[200px]" /><Skeleton className="h-[120px]" /></Screen>;
  return <>{children(data)}</>;
};

/** Last day of the current month — targets are counted then (fixed date, never "X days left"). */
const monthEnd = () => {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth() + 1, 0).toISOString();
};
const Ring: React.FC<{ pct: number; label: string }> = ({ pct, label }) => {
  const r = 42;
  const c = 2 * Math.PI * r;
  return (
    <span className="relative size-[96px] shrink-0">
      <svg viewBox="0 0 100 100" className="size-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#EEF2F6" strokeWidth="11" />
        <circle cx="50" cy="50" r={r} fill="none" stroke="#FE810D" strokeWidth="11" strokeLinecap="round" strokeDasharray={`${(Math.min(Math.max(pct, 0), 100) / 100) * c} ${c}`} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[18px] font-bold">{label}</span>
    </span>
  );
};
const Bar: React.FC<{ pct: number; done?: boolean }> = ({ pct, done }) => (
  <span className="block h-2 w-full overflow-hidden rounded-full bg-slate-100">
    <span className={`block h-full rounded-full ${done ? 'bg-emerald-600' : 'bg-[#FE810D]'}`} style={{ width: `${Math.min(Math.max(pct, 0), 100)}%` }} />
  </span>
);

/** AG-02b · Support playbook sheet (Figma 788:35): steps come from the CMS (AG-03). */
const PlaybookSheet: React.FC<{ pb?: AgentPlaybook; onClose: () => void }> = ({ pb, onClose }) => {
  const { t } = useTranslation();
  return (
    <Sheet open={!!pb} onClose={onClose} title={pb?.title || ''}>
      {pb?.steps.map((st, i) => (
        <div key={i} className="flex gap-3 rounded-[14px] bg-[#F7F7F8] p-3">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#FFF1E3] text-[13px] font-bold text-[#FE810D]">{i + 1}</span>
          <span className="flex min-w-0 flex-col"><span className="text-[14px] font-semibold">{st.title}</span><span className="text-[12.5px] leading-5 text-slate-600">{st.detail}</span></span>
        </div>
      ))}
      <SecondaryButton onClick={onClose}>{t('figma_ui.agent.close_btn')}</SecondaryButton>
    </Sheet>
  );
};
const PlaybookCard: React.FC<{ pb: AgentPlaybook; onOpen: () => void }> = ({ pb, onOpen }) => {
  const { t } = useTranslation();
  return (
    <button type="button" onClick={onOpen} className="flex w-full items-center gap-3 rounded-[16px] bg-white p-4 text-left shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#FFF1E3]"><BookOpen className="size-5 text-[#FE810D]" /></span>
      <span className="flex min-w-0 flex-1 flex-col"><span className="text-[15px] font-semibold">{pb.title}</span><span className="text-[12px] text-slate-500">{t('figma_ui.agent.playbook_steps', { count: pb.steps.length })}</span></span>
      <ChevronRight className="size-4 text-slate-300" />
    </button>
  );
};
const playbookFor = (d: AgentDashboardResponse, shell: Shell) =>
  (d.playbooks || []).find((p) => (shell === 'super' ? /NETWORK|COACH/i.test(p.category) : !/NETWORK|COACH/i.test(p.category)));

interface AgentMission { code: string; title: string; sub: string; cur: number; target: number; unit: string; reward: string; rule: string; done: boolean }
/** Missions built from the dashboard figures the service already returns. shortcut: a full agent mission list needs GET /me/missions?role= (plan GĐ3). */
const missionsOf = (d: AgentDashboardResponse, shell: Shell, t: (k: string, o?: Record<string, unknown>) => string): AgentMission[] =>
  shell === 'super'
    ? [{
        code: 'network',
        title: t('figma_ui.agent.super_mission_title', { rate: d.superAgentTargetRate ?? 50 }),
        sub: t('figma_ui.agent.super_mission_sub', { qualified: d.subordinateQualifiedCount ?? 0, total: d.subordinateTotal ?? (d.subordinates || []).length }),
        cur: Math.round(d.superAgentNetworkRate ?? 0),
        target: d.superAgentTargetRate ?? 50,
        unit: '%',
        reward: `${fmt(d.superAgentRewardAmount)} ${d.rewardCurrency}`,
        rule: t('figma_ui.agent.super_mission_rule'),
        done: (d.superAgentNetworkRate ?? 0) >= (d.superAgentTargetRate ?? 50),
      }]
    : [{
        code: 'customers',
        title: t('figma_ui.agent.agent_mission_title', { target: fmt(d.monthlyTargetCustomers) }),
        sub: d.pendingEkycCount ? t('figma_ui.agent.agent_pending_ekyc', { count: d.pendingEkycCount }) : (d.monthLabel || t('figma_ui.agent.this_month')),
        cur: d.currentCustomersCount,
        target: d.monthlyTargetCustomers,
        unit: '',
        reward: `${fmt(d.rewardAmount)} ${d.rewardCurrency}`,
        rule: t('figma_ui.agent.agent_mission_rule'),
        done: d.currentCustomersCount >= d.monthlyTargetCustomers,
      }];

const MissionCard: React.FC<{ m: AgentMission; onClick: () => void }> = ({ m, onClick }) => {
  const { t } = useTranslation();
  return (
    <button type="button" onClick={onClick} className="flex w-full flex-col gap-2.5 rounded-[16px] bg-white p-4 text-left shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      <span className="flex w-full items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#FFF1E3]">{m.unit ? <NetworkIcon className="size-5 text-[#FE810D]" /> : <Users className="size-5 text-[#FE810D]" />}</span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-[15px] font-semibold">{m.title}</span>
          <span className="text-[12px] text-slate-500">{m.sub}</span>
        </span>
        {m.done ? <Pill tone="green">{t('figma_ui.agent.done_badge')}</Pill> : <span className="whitespace-nowrap text-[13px] font-semibold text-[#FE810D]">{m.reward}</span>}
      </span>
      <Bar pct={(m.cur / Math.max(m.target, 1)) * 100} done={m.done} />
      <span className="flex justify-between text-[12px] text-slate-500">
        <span>{fmt(m.cur)}{m.unit} / {fmt(m.target)}{m.unit}</span>
        <span>{t('figma_ui.agent.until_date', { date: ddmmyyyy(monthEnd()) })}</span>
      </span>
    </button>
  );
};

// ───────────────────────── AG-00 Agent home · AG-10 Super Agent home (Figma 744:33 / 744:219) ─────────────────────────
export const AgentHome: React.FC = () => {
  const { t } = useTranslation();
  return <AgentGate title={t('figma_ui.agent.agent_rewards')}>{(a) => <AgentHomeView {...a} />}</AgentGate>;
};
const AgentHomeView: React.FC<AgentData> = ({ d, shell, coins }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const ms = missionsOf(d, shell, t);
  const m = ms[0];
  const reached = shell === 'agent' && m.done && !d.rewardClaimed;
  const [popup, setPopup] = useState(false);
  useEffect(() => {
    // AG-05 shows by itself once per opening when the target is reached and the reward is not claimed yet
    if (!reached) return;
    try {
      const k = `ag05_${d.agentCode}_${d.monthLabel}`;
      if (sessionStorage.getItem(k)) return;
      sessionStorage.setItem(k, '1');
    } catch { /* private mode: still show */ }
    setPopup(true);
  }, [reached, d.agentCode, d.monthLabel]);
  const behind = (d.subordinates || []).filter((s) => s.qualified === false).slice(0, 3);
  const pb = playbookFor(d, shell);
  const [pbOpen, setPbOpen] = useState(false);
  const screenTitle = shell === 'super' ? t('figma_ui.agent.super_agent_rewards') : t('figma_ui.agent.agent_rewards');

  return (
    <Screen
      title={screenTitle}
      back="/"
      tab={{ shell, active: 'home' }}
      hero={<Hero title={screenTitle} sub={`${d.agentName} · ${d.agentCode}`} coins={coins} onCoins={() => navigate('/coins')} art={aiMissions} />}
    >
      <div className="flex w-full items-center gap-4 rounded-[16px] bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
        <Ring pct={(m.cur / Math.max(m.target, 1)) * 100} label={shell === 'super' ? `${m.cur}%` : `${Math.round((m.cur / Math.max(m.target, 1)) * 100)}%`} />
        <div className="min-w-0 flex-1">
          <p className="text-[12px] text-slate-500">
            {shell === 'super' ? t('figma_ui.agent.agents_on_target') : t('figma_ui.agent.customers_cared')} · {d.monthLabel || t('figma_ui.agent.this_month_lower')}
          </p>
          <p className="text-[22px] font-bold">
            {shell === 'super'
              ? t('figma_ui.agent.x_of_y', { x: d.subordinateQualifiedCount ?? 0, y: d.subordinateTotal ?? (d.subordinates || []).length })
              : `${fmt(m.cur)} / ${fmt(m.target)}`}
          </p>
          <p className="text-[13px] font-semibold text-[#FE810D]">{t('figma_ui.agent.reward_prefix', { reward: m.reward })}</p>
          {d.rewardClaimed && <Pill tone="green">{t('figma_ui.agent.claimed_badge')}</Pill>}
        </div>
      </div>

      <div className="flex items-end">
        <h2 className="flex-1 text-[17px] font-semibold">{t('figma_ui.agent.missions_title')}</h2>
        <button type="button" onClick={() => navigate('/agent/missions')} className="h-8 text-[13px] font-semibold text-[#FE810D]">{t('figma_ui.common.see_all')} ›</button>
      </div>
      {ms.map((x) => <MissionCard key={x.code} m={x} onClick={() => navigate(`/agent/missions/${x.code}`)} />)}

      {shell === 'super' && behind.length > 0 && (
        <>
          <div className="flex items-end">
            <h2 className="flex-1 text-[17px] font-semibold">{t('figma_ui.agent.agents_needing_support')}</h2>
            <button type="button" onClick={() => navigate('/agent/network')} className="h-8 text-[13px] font-semibold text-[#FE810D]">{t('figma_ui.agent.see_network')}</button>
          </div>
          <div className="w-full divide-y divide-slate-100 rounded-[16px] bg-white px-4">
            {behind.map((s) => (
              <button key={s.agentId} type="button" onClick={() => navigate(`/agent/network?agent=${encodeURIComponent(s.agentId)}`)} className="flex w-full items-center gap-3 py-3 text-left">
                <span className="flex size-9 items-center justify-center rounded-full bg-[#FFF1E3] text-[13px] font-bold text-[#FE810D]">{s.agentName.slice(0, 1)}</span>
                <span className="flex min-w-0 flex-1 flex-col"><span className="truncate text-[14px] font-semibold">{s.agentName}</span><span className="text-[12px] text-slate-500">{t('figma_ui.agent.customers_count', { current: s.ekycCount, target: s.targetCount })}</span></span>
                <ChevronRight className="size-4 text-slate-300" />
              </button>
            ))}
          </div>
        </>
      )}

      {pb && <PlaybookCard pb={pb} onOpen={() => setPbOpen(true)} />}
      <PlaybookSheet pb={pbOpen ? pb : undefined} onClose={() => setPbOpen(false)} />

      <button type="button" onClick={() => navigate('/agent/vouchers')} className="flex w-full items-center gap-3 rounded-[16px] bg-white p-4 text-left shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
        <span className="flex min-w-0 flex-1 flex-col"><span className="text-[15px] font-semibold">{t('figma_ui.agent.vouchers_title')}</span><span className="text-[12px] text-slate-500">{t('figma_ui.agent.vouchers_sub')}</span></span>
        <ChevronRight className="size-4 text-slate-300" />
      </button>

      {/* AG-05 · Target reached (Figma 784:417) */}
      <Popup open={popup} onClose={() => setPopup(false)}>
        <img src={artCup} alt="" className="size-24 object-contain" />
        <h2 className="text-[19px] font-semibold">{t('figma_ui.agent.target_reached_title', { current: fmt(m.cur), target: fmt(m.target) })}</h2>
        <p className="text-[13px] leading-5 text-slate-500">{t('figma_ui.agent.target_reached_sub', { current: fmt(m.cur), month: d.monthLabel || t('figma_ui.agent.this_month_lower'), reward: m.reward })}</p>
        <div className="mt-2 flex w-full flex-col gap-2">
          <PrimaryButton onClick={() => { setPopup(false); navigate('/agent/missions/customers'); }}>{t('figma_ui.agent.see_details')}</PrimaryButton>
          <SecondaryButton onClick={() => setPopup(false)}>{t('figma_ui.agent.later_btn')}</SecondaryButton>
        </div>
      </Popup>
    </Screen>
  );
};

// ───────────────────────── AG-01b / AG-11 · Missions (Figma 784:2 / 748:202) ─────────────────────────
export const AgentMissions: React.FC = () => {
  const { t } = useTranslation();
  return (
    <AgentGate title={t('figma_ui.agent.missions_title')}>
      {({ d, shell }) => <AgentMissionsView d={d} shell={shell} />}
    </AgentGate>
  );
};
const AgentMissionsView: React.FC<{ d: AgentDashboardResponse; shell: Shell }> = ({ d, shell }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'progress' | 'done'>('progress');
  const ms = missionsOf(d, shell, t).filter((m) => (tab === 'done' ? m.done : !m.done));
  return (
    <Screen title={t('figma_ui.agent.missions_title')} back="/agent" tab={{ shell, active: 'missions' }} hero={<Hero title={t('figma_ui.agent.missions_title')} sub={shell === 'super' ? t('figma_ui.agent.missions_super_sub') : t('figma_ui.agent.missions_agent_sub')} art={aiMissions} />}>
      <SlideRow>
        <Chip on={tab === 'progress'} onClick={() => setTab('progress')}>{t('figma_ui.agent.tab_in_progress')}</Chip>
        <Chip on={tab === 'done'} onClick={() => setTab('done')}>{t('figma_ui.agent.tab_completed')}</Chip>
      </SlideRow>
      {ms.length === 0 && <Empty art={artEmptyBox} title={tab === 'done' ? t('figma_ui.agent.empty_done_missions') : t('figma_ui.agent.empty_progress_missions')} />}
      {ms.map((m) => <MissionCard key={m.code} m={m} onClick={() => navigate(`/agent/missions/${m.code}`)} />)}
    </Screen>
  );
};

// ───────────────────────── AG-04 / AG-12 · Mission details (Figma 784:250 / 788:313) ─────────────────────────
export const AgentMissionDetail: React.FC = () => {
  const { t } = useTranslation();
  return <AgentGate title={t('figma_ui.agent.mission_details_title')}>{({ d, shell }) => <AgentMissionDetailView d={d} shell={shell} />}</AgentGate>;
};
const AgentMissionDetailView: React.FC<{ d: AgentDashboardResponse; shell: Shell }> = ({ d, shell }) => {
  const { t } = useTranslation();
  const { code = '' } = useParams();
  const navigate = useNavigate();
  const m = missionsOf(d, shell, t).find((x) => x.code === code);
  if (!m) return <Screen title={t('figma_ui.agent.mission_details_title')}><Empty art={artEmptyBox} title={t('figma_ui.agent.mission_not_found')} /></Screen>;
  const closest = (d.subordinates || []).filter((s) => s.qualified === false && s.ekycCount !== undefined).sort((a, b) => (b.ekycCount || 0) / b.targetCount - (a.ekycCount || 0) / a.targetCount).slice(0, 5);
  return (
    <Screen title={t('figma_ui.agent.mission_details_title')}>
      <div className="flex w-full flex-col gap-3 rounded-[16px] bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-[19px] font-semibold leading-6">{m.title}</h2>
            <p className="text-[12px] text-slate-500">{t('figma_ui.agent.until_date', { date: ddmmyyyy(monthEnd()) })}</p>
          </div>
          <img src={artCup} alt="" className="size-14 object-contain" />
        </div>
        <div className="flex items-center justify-between rounded-[12px] bg-[#FFF4EA] p-3">
          <span className="text-[12px] text-slate-600">{t('figma_ui.agent.total_reward')}</span>
          <span className="text-[20px] font-bold text-[#FE810D]">{m.reward}</span>
        </div>
        <Bar pct={(m.cur / Math.max(m.target, 1)) * 100} done={m.done} />
        <p className="text-[13px] font-semibold">
          {t('figma_ui.agent.progress_of', { cur: fmt(m.cur), target: fmt(m.target), unit: m.unit })}
          {m.done ? t('figma_ui.agent.target_reached_tag') : ''}
        </p>
      </div>
      <div className="w-full rounded-[16px] bg-white p-4">
        <h3 className="text-[16px] font-semibold">{t('figma_ui.agent.mission_rules')}</h3>
        <p className="mt-1.5 text-[13px] leading-5 text-slate-600">{m.rule} {t('figma_ui.agent.second_approval_note')}</p>
      </div>
      {shell === 'super' && closest.length > 0 && (
        <>
          <h3 className="text-[16px] font-semibold">{t('figma_ui.agent.closest_agents')}</h3>
          <div className="w-full divide-y divide-slate-100 rounded-[16px] bg-white px-4">
            {closest.map((s) => (
              <div key={s.agentId} className="flex items-center gap-3 py-3">
                <span className="flex size-9 items-center justify-center rounded-full bg-[#FFF1E3] text-[13px] font-bold text-[#FE810D]">{s.agentName.slice(0, 1)}</span>
                <span className="flex min-w-0 flex-1 flex-col"><span className="truncate text-[14px] font-semibold">{s.agentName}</span><span className="text-[12px] text-slate-500">{t('figma_ui.agent.customers_count', { current: s.ekycCount, target: s.targetCount })}</span></span>
                <span className="text-[12px] font-semibold text-[#FE810D]">{t('figma_ui.agent.left_count', { count: Math.max(s.targetCount - (s.ekycCount || 0), 0) })}</span>
              </div>
            ))}
          </div>
          <PrimaryButton onClick={() => navigate('/agent/network')}>{t('figma_ui.agent.open_network_btn')}</PrimaryButton>
        </>
      )}
    </Screen>
  );
};

// ───────────────────────── AG-02 · Network (Super Agent, Figma 495:2776 + sheet 788:174) ─────────────────────────
type Bucket = 'reached' | 'close' | 'none';
const bucketOf = (s: AgentSubordinateItem): Bucket => (s.qualified ? 'reached' : (s.ekycCount || 0) >= s.targetCount * 0.7 ? 'close' : 'none');

export const AgentNetwork: React.FC = () => {
  const { t } = useTranslation();
  return <AgentGate title={t('figma_ui.agent.network_title')}>{({ d, shell }) => (shell === 'super' ? <AgentNetworkView d={d} /> : <Navigate to="/agent" replace />)}</AgentGate>;
};
const AgentNetworkView: React.FC<{ d: AgentDashboardResponse }> = ({ d }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const subs = d.subordinates || [];
  const initial = new URLSearchParams(window.location.hash.split('?')[1] || '').get('agent');
  const [tab, setTab] = useState<Bucket>('none');
  const [open, setOpen] = useState<AgentSubordinateItem | undefined>(subs.find((s) => s.agentId === initial));
  const rate = Math.round(d.superAgentNetworkRate ?? 0);
  const target = d.superAgentTargetRate ?? 50;
  const known = subs.some((s) => s.ekycCount !== undefined); // per-agent progress is not in the API yet
  const shown = known ? subs.filter((s) => bucketOf(s) === tab) : subs;
  const pb = playbookFor(d, 'super');
  const [pbOpen, setPbOpen] = useState(false);
  return (
    <Screen title={t('figma_ui.agent.network_title')} back="/agent" tab={{ shell: 'super', active: 'network' }} hero={<Hero title={t('figma_ui.agent.network_title')} sub={t('figma_ui.agent.network_sub', { month: d.monthLabel || t('figma_ui.agent.this_month'), target })} />}>
      <div className="flex w-full items-center gap-4 rounded-[16px] bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
        <Ring pct={rate} label={`${rate}%`} />
        <div className="min-w-0 flex-1">
          <p className="text-[12px] text-slate-500">{t('figma_ui.agent.agents_on_target')}</p>
          <p className="text-[22px] font-bold">{t('figma_ui.agent.x_of_y', { x: d.subordinateQualifiedCount ?? 0, y: d.subordinateTotal ?? subs.length })}</p>
          <p className="text-[13px] font-semibold text-[#FE810D]">{t('figma_ui.agent.reward_prefix', { reward: `${fmt(d.superAgentRewardAmount)} ${d.rewardCurrency}` })}</p>
        </div>
      </div>
      {rate < target && <p className="rounded-[14px] bg-[#FFF4EA] p-3 text-[13px] leading-5">{t('figma_ui.agent.below_target_warn', { target })}</p>}
      {pb && <PlaybookCard pb={pb} onOpen={() => setPbOpen(true)} />}
      <PlaybookSheet pb={pbOpen ? pb : undefined} onClose={() => setPbOpen(false)} />
      {!known && <h2 className="text-[17px] font-semibold">{t('figma_ui.agent.agents_in_network', { count: subs.length })}</h2>}
      {known && <SlideRow>
        {(['none', 'close', 'reached'] as Bucket[]).map((k) => (
          <Chip key={k} on={tab === k} onClick={() => setTab(k)}>
            {k === 'reached' ? t('figma_ui.agent.bucket_reached') : k === 'close' ? t('figma_ui.agent.bucket_close') : t('figma_ui.agent.bucket_none')}
            <span className="text-[12px] font-normal text-slate-400">{subs.filter((s) => bucketOf(s) === k).length}</span>
          </Chip>
        ))}
      </SlideRow>}
      {shown.length === 0 && <Empty title={t('figma_ui.agent.no_agents_group')} />}
      {shown.map((s) => (
        <button key={s.agentId} type="button" onClick={() => setOpen(s)} className="flex w-full flex-col gap-2 rounded-[16px] bg-white p-4 text-left shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
          <span className="flex w-full items-center gap-2 text-[14px]">
            <span className="min-w-0 flex-1 truncate font-semibold">{s.agentName}{s.province ? ` · ${s.province}` : ''}</span>
            {s.ekycCount !== undefined ? (
              <span className={`font-semibold ${s.qualified ? 'text-emerald-700' : 'text-[#FE810D]'}`}>{s.ekycCount} / {s.targetCount}</span>
            ) : (
              <span className="text-[12px] text-slate-500">{t('figma_ui.agent.target_prefix', { target: fmt(s.targetCount) })}</span>
            )}
          </span>
          {s.ekycCount !== undefined && <Bar pct={(s.ekycCount / Math.max(s.targetCount, 1)) * 100} done={s.qualified} />}
        </button>
      ))}
      <Sheet open={!!open} onClose={() => setOpen(undefined)} title={open ? t('figma_ui.agent.agent_sheet_title', { name: open.agentName }) : ''}>
        {open && (
          <>
            <p className="text-[13px] text-slate-500">{open.agentCode}{open.province ? ` · ${open.province}` : ''}{open.lastActiveAt ? ` · ${t('figma_ui.agent.last_active', { date: ddmmyyyy(open.lastActiveAt) })}` : ''}</p>
            <div className="rounded-[14px] bg-[#F7F7F8] p-3">
              <p className="text-[12px] text-slate-500">{t('figma_ui.agent.customers_cared')} · {d.monthLabel || t('figma_ui.agent.this_month_lower')}</p>
              <p className="text-[22px] font-bold">{open.ekycCount !== undefined ? `${open.ekycCount} / ${open.targetCount}` : t('figma_ui.agent.target_prefix', { target: fmt(open.targetCount) })}</p>
              {open.ekycCount !== undefined && <Bar pct={(open.ekycCount / Math.max(open.targetCount, 1)) * 100} done={open.qualified} />}
            </div>
            {open.ekycCount !== undefined && (
              <p className="text-[13px] leading-5 text-slate-600">
                {open.qualified
                  ? t('figma_ui.agent.agent_on_target_msg')
                  : t('figma_ui.agent.agent_need_more_msg', { count: Math.max(open.targetCount - open.ekycCount, 0) })}
              </p>
            )}
            {open.phoneNumber && (
              <a href={`tel:${open.phoneNumber}`} className="flex h-[46px] w-full items-center justify-center gap-2 rounded-[14px] bg-[#FE810D] text-[14px] font-semibold text-white">
                <Phone className="size-4" /> {t('figma_ui.agent.call_btn', { phone: open.phoneNumber })}
              </a>
            )}
            {/* shortcut: "Send nudge to agent" needs a remind endpoint and channel Natcash has not chosen yet (plan §5) */}
            <SecondaryButton onClick={() => { setOpen(undefined); navigate('/agent/missions/network'); }}>{t('figma_ui.agent.see_network_mission')}</SecondaryButton>
          </>
        )}
      </Sheet>
    </Screen>
  );
};

// ───────────────────────── Agent vouchers (Figma 748:368 / 784:552, 748:662 / 788:488) ─────────────────────────
export const AgentVouchers: React.FC = () => {
  const { t } = useTranslation();
  return <AgentGate title={t('figma_ui.agent.vouchers_title')}>{({ shell }) => <RewardStore shell={shell} />}</AgentGate>;
};
export const AgentVoucherDetail: React.FC = () => {
  const { t } = useTranslation();
  return <AgentGate title={t('figma_ui.agent.voucher_details_title')}>{({ shell }) => <RewardDetail shell={shell} />}</AgentGate>;
};
export const AgentMyVouchers: React.FC = () => {
  const { t } = useTranslation();
  return <AgentGate title={t('figma_ui.agent.my_vouchers_title')}>{({ shell }) => <MyVouchers shell={shell} />}</AgentGate>;
};
export const AgentMyVoucherDetail: React.FC = () => {
  const { t } = useTranslation();
  return <AgentGate title={t('figma_ui.agent.my_voucher_title')}>{({ shell }) => <MyVoucherDetail shell={shell} />}</AgentGate>;
};
