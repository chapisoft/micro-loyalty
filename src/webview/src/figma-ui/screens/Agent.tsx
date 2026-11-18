import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
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
  const [data, failed, reload] = useLoad(async () => {
    const [d, p] = await Promise.all([loadDashboard(), LoyaltyApi.getProfile(uid()).catch(() => null)]);
    return { d, shell: (d.agentRole === 'SUPER_AGENT' ? 'super' : 'agent') as Shell, coins: p?.currentPoints };
  });
  if (failed)
    return (
      <Screen title={title}>
        <Empty art={artEmptyBox} title="This page is for Natcash agents" text="Your account is not registered as an Agent or Super Agent.">
          <SecondaryButton className="mt-3" onClick={reload}>Try again</SecondaryButton>
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
const PlaybookSheet: React.FC<{ pb?: AgentPlaybook; onClose: () => void }> = ({ pb, onClose }) => (
  <Sheet open={!!pb} onClose={onClose} title={pb?.title || ''}>
    {pb?.steps.map((st, i) => (
      <div key={i} className="flex gap-3 rounded-[14px] bg-[#F7F7F8] p-3">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#FFF1E3] text-[13px] font-bold text-[#FE810D]">{i + 1}</span>
        <span className="flex min-w-0 flex-col"><span className="text-[14px] font-semibold">{st.title}</span><span className="text-[12.5px] leading-5 text-slate-600">{st.detail}</span></span>
      </div>
    ))}
    <SecondaryButton onClick={onClose}>Close</SecondaryButton>
  </Sheet>
);
const PlaybookCard: React.FC<{ pb: AgentPlaybook; onOpen: () => void }> = ({ pb, onOpen }) => (
  <button type="button" onClick={onOpen} className="flex w-full items-center gap-3 rounded-[16px] bg-white p-4 text-left shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#FFF1E3]"><BookOpen className="size-5 text-[#FE810D]" /></span>
    <span className="flex min-w-0 flex-1 flex-col"><span className="text-[15px] font-semibold">{pb.title}</span><span className="text-[12px] text-slate-500">{pb.steps.length} steps</span></span>
    <ChevronRight className="size-4 text-slate-300" />
  </button>
);
const playbookFor = (d: AgentDashboardResponse, shell: Shell) =>
  (d.playbooks || []).find((p) => (shell === 'super' ? /NETWORK|COACH/i.test(p.category) : !/NETWORK|COACH/i.test(p.category)));

interface AgentMission { code: string; title: string; sub: string; cur: number; target: number; unit: string; reward: string; rule: string; done: boolean }
/** Missions built from the dashboard figures the service already returns. shortcut: a full agent mission list needs GET /me/missions?role= (plan GĐ3). */
const missionsOf = (d: AgentDashboardResponse, shell: Shell): AgentMission[] =>
  shell === 'super'
    ? [{
        code: 'network',
        title: `${d.superAgentTargetRate ?? 50}% of your network on target`,
        sub: `${d.subordinateQualifiedCount ?? 0} of ${d.subordinateTotal ?? (d.subordinates || []).length} agents on target`,
        cur: Math.round(d.superAgentNetworkRate ?? 0),
        target: d.superAgentTargetRate ?? 50,
        unit: '%',
        reward: `${fmt(d.superAgentRewardAmount)} ${d.rewardCurrency}`,
        rule: 'Counted on the last day of the month. Below the goal, your area manager starts the support playbook with you.',
        done: (d.superAgentNetworkRate ?? 0) >= (d.superAgentTargetRate ?? 50),
      }]
    : [{
        code: 'customers',
        title: `Care for ${fmt(d.monthlyTargetCustomers)} customers`,
        sub: d.pendingEkycCount ? `${d.pendingEkycCount} waiting for eKYC` : `${d.monthLabel || 'This month'}`,
        cur: d.currentCustomersCount,
        target: d.monthlyTargetCustomers,
        unit: '',
        reward: `${fmt(d.rewardAmount)} ${d.rewardCurrency}`,
        rule: 'A customer counts when they complete eKYC and make at least one payment in the month.',
        done: d.currentCustomersCount >= d.monthlyTargetCustomers,
      }];

const MissionCard: React.FC<{ m: AgentMission; onClick: () => void }> = ({ m, onClick }) => (
  <button type="button" onClick={onClick} className="flex w-full flex-col gap-2.5 rounded-[16px] bg-white p-4 text-left shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
    <span className="flex w-full items-start gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#FFF1E3]">{m.unit ? <NetworkIcon className="size-5 text-[#FE810D]" /> : <Users className="size-5 text-[#FE810D]" />}</span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-[15px] font-semibold">{m.title}</span>
        <span className="text-[12px] text-slate-500">{m.sub}</span>
      </span>
      {m.done ? <Pill tone="green">Done</Pill> : <span className="whitespace-nowrap text-[13px] font-semibold text-[#FE810D]">{m.reward}</span>}
    </span>
    <Bar pct={(m.cur / Math.max(m.target, 1)) * 100} done={m.done} />
    <span className="flex justify-between text-[12px] text-slate-500">
      <span>{fmt(m.cur)}{m.unit} / {fmt(m.target)}{m.unit}</span>
      <span>Until {ddmmyyyy(monthEnd())}</span>
    </span>
  </button>
);

// ───────────────────────── AG-00 Agent home · AG-10 Super Agent home (Figma 744:33 / 744:219) ─────────────────────────
export const AgentHome: React.FC = () => (
  <AgentGate title="Agent Rewards">{(a) => <AgentHomeView {...a} />}</AgentGate>
);
const AgentHomeView: React.FC<AgentData> = ({ d, shell, coins }) => {
  const navigate = useNavigate();
  const ms = missionsOf(d, shell);
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

  return (
    <Screen
      title={shell === 'super' ? 'Super Agent Rewards' : 'Agent Rewards'}
      back="/"
      tab={{ shell, active: 'home' }}
      hero={<Hero title={shell === 'super' ? 'Super Agent Rewards' : 'Agent Rewards'} sub={`${d.agentName} · ${d.agentCode}`} coins={coins} onCoins={() => navigate('/coins')} art={aiMissions} />}
    >
      <div className="flex w-full items-center gap-4 rounded-[16px] bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
        <Ring pct={(m.cur / Math.max(m.target, 1)) * 100} label={shell === 'super' ? `${m.cur}%` : `${Math.round((m.cur / Math.max(m.target, 1)) * 100)}%`} />
        <div className="min-w-0 flex-1">
          <p className="text-[12px] text-slate-500">{shell === 'super' ? 'Agents on target' : 'Customers cared for'} · {d.monthLabel || 'this month'}</p>
          <p className="text-[22px] font-bold">{shell === 'super' ? m.sub.split(' agents')[0] : `${fmt(m.cur)} / ${fmt(m.target)}`}</p>
          <p className="text-[13px] font-semibold text-[#FE810D]">Reward {m.reward}</p>
          {d.rewardClaimed && <Pill tone="green">Claimed</Pill>}
        </div>
      </div>

      <div className="flex items-end">
        <h2 className="flex-1 text-[17px] font-semibold">Missions</h2>
        <button type="button" onClick={() => navigate('/agent/missions')} className="h-8 text-[13px] font-semibold text-[#FE810D]">See all ›</button>
      </div>
      {ms.map((x) => <MissionCard key={x.code} m={x} onClick={() => navigate(`/agent/missions/${x.code}`)} />)}

      {shell === 'super' && behind.length > 0 && (
        <>
          <div className="flex items-end">
            <h2 className="flex-1 text-[17px] font-semibold">Agents needing support</h2>
            <button type="button" onClick={() => navigate('/agent/network')} className="h-8 text-[13px] font-semibold text-[#FE810D]">See network ›</button>
          </div>
          <div className="w-full divide-y divide-slate-100 rounded-[16px] bg-white px-4">
            {behind.map((s) => (
              <button key={s.agentId} type="button" onClick={() => navigate(`/agent/network?agent=${encodeURIComponent(s.agentId)}`)} className="flex w-full items-center gap-3 py-3 text-left">
                <span className="flex size-9 items-center justify-center rounded-full bg-[#FFF1E3] text-[13px] font-bold text-[#FE810D]">{s.agentName.slice(0, 1)}</span>
                <span className="flex min-w-0 flex-1 flex-col"><span className="truncate text-[14px] font-semibold">{s.agentName}</span><span className="text-[12px] text-slate-500">{s.ekycCount} / {s.targetCount} customers</span></span>
                <ChevronRight className="size-4 text-slate-300" />
              </button>
            ))}
          </div>
        </>
      )}

      {pb && <PlaybookCard pb={pb} onOpen={() => setPbOpen(true)} />}
      <PlaybookSheet pb={pbOpen ? pb : undefined} onClose={() => setPbOpen(false)} />

      <button type="button" onClick={() => navigate('/agent/vouchers')} className="flex w-full items-center gap-3 rounded-[16px] bg-white p-4 text-left shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
        <span className="flex min-w-0 flex-1 flex-col"><span className="text-[15px] font-semibold">Vouchers</span><span className="text-[12px] text-slate-500">Use your coins for partner deals</span></span>
        <ChevronRight className="size-4 text-slate-300" />
      </button>

      {/* AG-05 · Target reached (Figma 784:417) */}
      <Popup open={popup} onClose={() => setPopup(false)}>
        <img src={artCup} alt="" className="size-24 object-contain" />
        <h2 className="text-[19px] font-semibold">Target reached · {fmt(m.cur)} / {fmt(m.target)}!</h2>
        <p className="text-[13px] leading-5 text-slate-500">You cared for {fmt(m.cur)} customers in {d.monthLabel || 'this month'}. Your reward of {m.reward} is paid after the month is checked.</p>
        <div className="mt-2 flex w-full flex-col gap-2">
          <PrimaryButton onClick={() => { setPopup(false); navigate('/agent/missions/customers'); }}>See details</PrimaryButton>
          <SecondaryButton onClick={() => setPopup(false)}>Later</SecondaryButton>
        </div>
      </Popup>
    </Screen>
  );
};

// ───────────────────────── AG-01b / AG-11 · Missions (Figma 784:2 / 748:202) ─────────────────────────
export const AgentMissions: React.FC = () => (
  <AgentGate title="Missions">
    {({ d, shell }) => <AgentMissionsView d={d} shell={shell} />}
  </AgentGate>
);
const AgentMissionsView: React.FC<{ d: AgentDashboardResponse; shell: Shell }> = ({ d, shell }) => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'progress' | 'done'>('progress');
  const ms = missionsOf(d, shell).filter((m) => (tab === 'done' ? m.done : !m.done));
  return (
    <Screen title="Missions" back="/agent" tab={{ shell, active: 'missions' }} hero={<Hero title="Missions" sub={shell === 'super' ? 'Grow your network this month' : 'Care for customers, earn rewards'} art={aiMissions} />}>
      <SlideRow>
        <Chip on={tab === 'progress'} onClick={() => setTab('progress')}>In progress</Chip>
        <Chip on={tab === 'done'} onClick={() => setTab('done')}>Completed</Chip>
      </SlideRow>
      {ms.length === 0 && <Empty art={artEmptyBox} title={tab === 'done' ? 'No completed missions yet' : 'All missions completed'} />}
      {ms.map((m) => <MissionCard key={m.code} m={m} onClick={() => navigate(`/agent/missions/${m.code}`)} />)}
    </Screen>
  );
};

// ───────────────────────── AG-04 / AG-12 · Mission details (Figma 784:250 / 788:313) ─────────────────────────
export const AgentMissionDetail: React.FC = () => (
  <AgentGate title="Mission details">{({ d, shell }) => <AgentMissionDetailView d={d} shell={shell} />}</AgentGate>
);
const AgentMissionDetailView: React.FC<{ d: AgentDashboardResponse; shell: Shell }> = ({ d, shell }) => {
  const { code = '' } = useParams();
  const navigate = useNavigate();
  const m = missionsOf(d, shell).find((x) => x.code === code);
  if (!m) return <Screen title="Mission details"><Empty art={artEmptyBox} title="Mission not found" /></Screen>;
  const closest = (d.subordinates || []).filter((s) => s.qualified === false && s.ekycCount !== undefined).sort((a, b) => (b.ekycCount || 0) / b.targetCount - (a.ekycCount || 0) / a.targetCount).slice(0, 5);
  return (
    <Screen title="Mission details">
      <div className="flex w-full flex-col gap-3 rounded-[16px] bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-[19px] font-semibold leading-6">{m.title}</h2>
            <p className="text-[12px] text-slate-500">Until {ddmmyyyy(monthEnd())}</p>
          </div>
          <img src={artCup} alt="" className="size-14 object-contain" />
        </div>
        <div className="flex items-center justify-between rounded-[12px] bg-[#FFF4EA] p-3">
          <span className="text-[12px] text-slate-600">Total reward</span>
          <span className="text-[20px] font-bold text-[#FE810D]">{m.reward}</span>
        </div>
        <Bar pct={(m.cur / Math.max(m.target, 1)) * 100} done={m.done} />
        <p className="text-[13px] font-semibold">{fmt(m.cur)}{m.unit} of {fmt(m.target)}{m.unit}{m.done ? ' · target reached' : ''}</p>
      </div>
      <div className="w-full rounded-[16px] bg-white p-4">
        <h3 className="text-[16px] font-semibold">Mission rules</h3>
        <p className="mt-1.5 text-[13px] leading-5 text-slate-600">{m.rule} Rewards are paid after a second approval.</p>
      </div>
      {shell === 'super' && closest.length > 0 && (
        <>
          <h3 className="text-[16px] font-semibold">Closest agents to target</h3>
          <div className="w-full divide-y divide-slate-100 rounded-[16px] bg-white px-4">
            {closest.map((s) => (
              <div key={s.agentId} className="flex items-center gap-3 py-3">
                <span className="flex size-9 items-center justify-center rounded-full bg-[#FFF1E3] text-[13px] font-bold text-[#FE810D]">{s.agentName.slice(0, 1)}</span>
                <span className="flex min-w-0 flex-1 flex-col"><span className="truncate text-[14px] font-semibold">{s.agentName}</span><span className="text-[12px] text-slate-500">{s.ekycCount} / {s.targetCount} customers</span></span>
                <span className="text-[12px] font-semibold text-[#FE810D]">{Math.max(s.targetCount - (s.ekycCount || 0), 0)} left</span>
              </div>
            ))}
          </div>
          <PrimaryButton onClick={() => navigate('/agent/network')}>Open Network</PrimaryButton>
        </>
      )}
    </Screen>
  );
};

// ───────────────────────── AG-02 · Network (Super Agent, Figma 495:2776 + sheet 788:174) ─────────────────────────
type Bucket = 'reached' | 'close' | 'none';
const bucketOf = (s: AgentSubordinateItem): Bucket => (s.qualified ? 'reached' : (s.ekycCount || 0) >= s.targetCount * 0.7 ? 'close' : 'none');

export const AgentNetwork: React.FC = () => (
  <AgentGate title="Network">{({ d, shell }) => (shell === 'super' ? <AgentNetworkView d={d} /> : <Navigate to="/agent" replace />)}</AgentGate>
);
const AgentNetworkView: React.FC<{ d: AgentDashboardResponse }> = ({ d }) => {
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
    <Screen title="Network" back="/agent" tab={{ shell: 'super', active: 'network' }} hero={<Hero title="Network" sub={`${d.monthLabel || 'This month'} · goal ${target}% of agents on target`} />}>
      <div className="flex w-full items-center gap-4 rounded-[16px] bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
        <Ring pct={rate} label={`${rate}%`} />
        <div className="min-w-0 flex-1">
          <p className="text-[12px] text-slate-500">Agents on target</p>
          <p className="text-[22px] font-bold">{d.subordinateQualifiedCount ?? 0} of {d.subordinateTotal ?? subs.length}</p>
          <p className="text-[13px] font-semibold text-[#FE810D]">Reward {fmt(d.superAgentRewardAmount)} {d.rewardCurrency}</p>
        </div>
      </div>
      {rate < target && <p className="rounded-[14px] bg-[#FFF4EA] p-3 text-[13px] leading-5">Below {target}%: your area manager is alerted and runs the support playbook with you this month.</p>}
      {pb && <PlaybookCard pb={pb} onOpen={() => setPbOpen(true)} />}
      <PlaybookSheet pb={pbOpen ? pb : undefined} onClose={() => setPbOpen(false)} />
      {!known && <h2 className="text-[17px] font-semibold">Agents in your network · {subs.length}</h2>}
      {known && <SlideRow>
        {(['none', 'close', 'reached'] as Bucket[]).map((k) => (
          <Chip key={k} on={tab === k} onClick={() => setTab(k)}>
            {k === 'reached' ? 'On target' : k === 'close' ? 'Close' : 'Not started'}
            <span className="text-[12px] font-normal text-slate-400">{subs.filter((s) => bucketOf(s) === k).length}</span>
          </Chip>
        ))}
      </SlideRow>}
      {shown.length === 0 && <Empty title="No agents in this group" />}
      {shown.map((s) => (
        <button key={s.agentId} type="button" onClick={() => setOpen(s)} className="flex w-full flex-col gap-2 rounded-[16px] bg-white p-4 text-left shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
          <span className="flex w-full items-center gap-2 text-[14px]">
            <span className="min-w-0 flex-1 truncate font-semibold">{s.agentName}{s.province ? ` · ${s.province}` : ''}</span>
            {s.ekycCount !== undefined ? (
              <span className={`font-semibold ${s.qualified ? 'text-emerald-700' : 'text-[#FE810D]'}`}>{s.ekycCount} / {s.targetCount}</span>
            ) : (
              <span className="text-[12px] text-slate-500">Target {fmt(s.targetCount)}</span>
            )}
          </span>
          {s.ekycCount !== undefined && <Bar pct={(s.ekycCount / Math.max(s.targetCount, 1)) * 100} done={s.qualified} />}
        </button>
      ))}
      <Sheet open={!!open} onClose={() => setOpen(undefined)} title={open ? `Agent · ${open.agentName}` : ''}>
        {open && (
          <>
            <p className="text-[13px] text-slate-500">{open.agentCode}{open.province ? ` · ${open.province}` : ''}{open.lastActiveAt ? ` · last active ${ddmmyyyy(open.lastActiveAt)}` : ''}</p>
            <div className="rounded-[14px] bg-[#F7F7F8] p-3">
              <p className="text-[12px] text-slate-500">Customers cared for · {d.monthLabel || 'this month'}</p>
              <p className="text-[22px] font-bold">{open.ekycCount !== undefined ? `${open.ekycCount} / ${open.targetCount}` : `Target ${fmt(open.targetCount)}`}</p>
              {open.ekycCount !== undefined && <Bar pct={(open.ekycCount / Math.max(open.targetCount, 1)) * 100} done={open.qualified} />}
            </div>
            {open.ekycCount !== undefined && (
              <p className="text-[13px] leading-5 text-slate-600">
                {open.qualified ? 'On target this month.' : `${Math.max(open.targetCount - open.ekycCount, 0)} more customers needed. Check who finished eKYC but has not paid yet.`}
              </p>
            )}
            {open.phoneNumber && (
              <a href={`tel:${open.phoneNumber}`} className="flex h-[46px] w-full items-center justify-center gap-2 rounded-[14px] bg-[#FE810D] text-[14px] font-semibold text-white">
                <Phone className="size-4" /> Call {open.phoneNumber}
              </a>
            )}
            {/* shortcut: "Send nudge to agent" needs a remind endpoint and channel Natcash has not chosen yet (plan §5) */}
            <SecondaryButton onClick={() => { setOpen(undefined); navigate('/agent/missions/network'); }}>See network mission</SecondaryButton>
          </>
        )}
      </Sheet>
    </Screen>
  );
};

// ───────────────────────── Agent vouchers (Figma 748:368 / 784:552, 748:662 / 788:488) ─────────────────────────
export const AgentVouchers: React.FC = () => <AgentGate title="Vouchers">{({ shell }) => <RewardStore shell={shell} />}</AgentGate>;
export const AgentVoucherDetail: React.FC = () => <AgentGate title="Voucher details">{({ shell }) => <RewardDetail shell={shell} />}</AgentGate>;
export const AgentMyVouchers: React.FC = () => <AgentGate title="My vouchers">{({ shell }) => <MyVouchers shell={shell} />}</AgentGate>;
export const AgentMyVoucherDetail: React.FC = () => <AgentGate title="My voucher">{({ shell }) => <MyVoucherDetail shell={shell} />}</AgentGate>;
