import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check, Gift, Fuel, ShoppingBag, Smartphone, Users, Info, ChevronDown, QrCode, Sparkles, Lock } from 'lucide-react';
import { LoyaltyApi, getDefaultUserId, type MemberProfile, type MilestoneItem } from '../../services/api';
import { LoyaltyJSBridge } from '../../bridge/LoyaltyJSBridge';
import {
  Screen, Hero, SectionHeader, Skeleton, ErrorBlock, Pill, BottomBar, PrimaryButton, SecondaryButton, Popup, Empty, SlideRow, useLoad, fmt, ddmm, ddmmyyyy,
} from '../ui';
import { artCalendar, artGift, artEmptyBox, aiMissions } from '../art';
import { normMilestone, paramJson, PARAM } from '../data';

const uid = () => getDefaultUserId();

export interface Mission {
  code: string;
  name: string;
  partner?: string;
  description?: string;
  steps: MilestoneItem[];
  total: number;
  done: number;
  claimable: MilestoneItem[];
  deadline?: string;
}

export const toMissions = (items: MilestoneItem[]): Mission[] => {
  const by = new Map<string, MilestoneItem[]>();
  items.forEach((m) => by.set(m.campaignCode, [...(by.get(m.campaignCode) || []), m]));
  return [...by.entries()].map(([code, raw]) => {
    const steps = [...raw].sort((a, b) => a.milestoneStep - b.milestoneStep);
    return {
      code,
      name: steps[0].campaignName,
      partner: steps[0].partnerName,
      description: steps[0].description,
      steps,
      total: steps.reduce((s, x) => s + (x.rewardPoints || 0), 0),
      done: steps.filter((s) => s.status === 'COMPLETED' || s.status === 'CLAIMED').length,
      claimable: steps.filter((s) => s.status === 'COMPLETED'),
      deadline: steps[0].claimDeadline || steps[0].expiresAt,
    };
  });
};

const missionIcon = (m: Mission) => {
  const s = `${m.code} ${m.name} ${m.steps[0]?.campaignCategory || ''}`.toLowerCase();
  if (/fuel|xăng|gas/.test(s)) return Fuel;
  if (/top.?up|recharge|airtime|nạp/.test(s)) return Smartphone;
  if (/refer|invite|friend/.test(s)) return Users;
  return ShoppingBag;
};

const loadMissions = async () => {
  const r = (await LoyaltyApi.getMilestones(uid())) as { milestones?: MilestoneItem[] };
  return { missions: toMissions((r.milestones || []).map(normMilestone)) };
};

/** In progress = some progress, Available = not started yet, Completed = every goal claimed. */
const stateOf = (m: Mission) =>
  m.steps.every((s) => s.status === 'CLAIMED') ? 'COMPLETED' : m.claimable.length || m.steps.some((s) => s.currentProgress > 0) ? 'IN_PROGRESS' : 'AVAILABLE';

const GoalChips: React.FC<{ steps: MilestoneItem[] }> = ({ steps }) => (
  <div className="flex w-full flex-wrap gap-1.5">
    {steps.map((s) => {
      const done = s.status === 'COMPLETED' || s.status === 'CLAIMED';
      return (
        <span key={s.id} className={`flex min-w-[96px] flex-1 items-center justify-center gap-1 rounded-full p-1.5 ${done ? 'bg-emerald-50' : 'bg-brand-soft'}`}>
          {done ? <Check className="size-[13px] text-emerald-700" /> : <Gift className="size-[13px] text-brand" />}
          <span className="text-[11px] font-medium text-slate-500">Goal {s.milestoneStep}</span>
          <span className={`text-[11px] font-semibold ${done ? 'text-emerald-700' : 'text-brand'}`}>+{fmt(s.rewardPoints)}</span>
        </span>
      );
    })}
  </div>
);

// ───────────────────────── NV-03 week strip (shared by NV-01 and NV-03) ─────────────────────────
/** Day 1→7 coin amounts set by operations in the CMS (system parameter LOYALTY_CHECKIN_REWARDS); [] when not set. */
const loadCheckinRewards = async () => {
  const v = await paramJson<number[] | string>(PARAM.CHECKIN_REWARDS);
  const list = Array.isArray(v) ? v : typeof v === 'string' ? v.split(/[,\s]+/) : [];
  return list.map(Number).filter((n) => Number.isFinite(n)).slice(0, 7);
};
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const weekInfo = (p?: MemberProfile | null) => {
  const streak = p?.checkinStreakDays || 0;
  const doneToday = !!p?.hasCheckedInToday;
  const today = doneToday ? Math.max(streak, 1) : Math.min(streak + 1, 7); // 1-based position in the 7-day ladder
  return { streak, doneToday, today };
};

const WeekStrip: React.FC<{ profile?: MemberProfile | null; compact?: boolean; rewards: number[] }> = ({ profile, compact, rewards }) => {
  const { doneToday, today } = weekInfo(profile);
  return (
    <div className="grid w-full grid-cols-7 gap-1">
      {DAYS.map((d, i) => {
        const n = i + 1;
        const claimed = n < today || (n === today && doneToday);
        const isToday = n === today && !doneToday;
        return (
          <div key={d} className={`flex flex-col items-center gap-1 rounded-xl py-1.5 ${isToday ? 'bg-brand-soft' : ''}`}>
            <span className="text-[11px] text-slate-500">{d}</span>
            {claimed ? (
              <span className="flex size-7 items-center justify-center rounded-full bg-emerald-50"><Check className="size-3.5 text-emerald-700" /></span>
            ) : n === 7 ? (
              <span className="flex size-7 items-center justify-center rounded-full bg-brand-soft"><Gift className="size-3.5 text-brand" /></span>
            ) : (
              <span className={`flex size-7 items-center justify-center text-[18px] font-semibold ${isToday ? 'text-brand' : 'text-slate-500'}`}>
                {String(n).padStart(2, '0')}
              </span>
            )}
            <span className={`text-[11px] font-semibold ${claimed ? 'text-emerald-700' : isToday ? 'text-brand' : 'text-slate-500'}`}>
              {compact && claimed ? 'Claimed' : compact && n > today ? 'Locked' : rewards[i] !== undefined ? `+${rewards[i]}` : `Day ${n}`}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ───────────────────────── NV-01 · Missions & weekly check-in ─────────────────────────
export const MissionsList: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'IN_PROGRESS' | 'AVAILABLE' | 'COMPLETED'>(() => (uid() ? 'IN_PROGRESS' : 'AVAILABLE'));
  const [program, setProgram] = useState<string>('All');
  const [open, setOpen] = useState<string | null>(null);
  const [data, failed, reload] = useLoad(async () => {
    const userId = uid();
    const [m, p, rewards] = await Promise.all([
      loadMissions(),
      userId ? LoyaltyApi.getProfile(userId).catch(() => null) : Promise.resolve(null),
      loadCheckinRewards(),
    ]);
    return { ...m, profile: p, rewards, isGuest: !userId };
  });
  const all = data?.missions || [];
  const count = (s: string) => all.filter((m) => stateOf(m) === s).length;
  // Program filter chips come from the categories present in the data (CMS-defined), not a fixed list.
  const programs = ['All', ...Array.from(new Set(all.map((m) => m.steps[0]?.campaignCategory).filter(Boolean) as string[]))];
  const inTab = all.filter((m) => stateOf(m) === tab && (program === 'All' || m.steps[0]?.campaignCategory === program));
  const { streak, doneToday, today } = weekInfo(data?.profile);
  const byPartner = Object.entries(
    inTab.reduce<Record<string, Mission[]>>((acc, m) => ((acc[m.partner || m.steps[0]?.campaignCategory || 'Natcash'] ||= []).push(m), acc), {}),
  );

  return (
    <Screen
      title="Missions"
      back="/"
      tab={{ shell: 'customer', active: 'missions' }}
      hero={<Hero title="Missions" sub="Reach goals, unlock rewards" coins={data?.profile?.currentPoints} onCoins={() => navigate('/coins')} art={aiMissions} />}
    >
      {failed && <ErrorBlock onRetry={reload} />}
      {!data && !failed && <Skeleton className="h-[144px]" />}
      {data && (
        <>
          {/* Check-in is a mission set in the CMS (17/11): the strip shows only while a check-in program is configured */}
          {data.rewards.length > 0 && <button type="button" onClick={() => navigate('/checkin')} className="flex w-full flex-col gap-2 rounded-[20px] bg-white p-3.5 text-left">
            <span className="flex w-full items-center gap-2">
              <span className="flex-1 text-[15px] font-semibold">This week's check-in · {streak}-day streak</span>
              {!doneToday && <span className="rounded-[12px] bg-brand px-3 py-1.5 text-[12px] font-semibold text-white">Check in</span>}
            </span>
            <WeekStrip profile={data.profile} rewards={data.rewards} compact />
            <span className="text-[11px] text-slate-500">
              {doneToday ? 'Checked in today · come back tomorrow' : data.rewards[today - 1] !== undefined ? `Check in today for +${data.rewards[today - 1]} coins` : 'Check in 7 days for a weekend gift.'}
            </span>
          </button>}

          {/* Tabs · In progress / Available / Completed (330:246) */}
          <div className="grid w-full grid-cols-3 gap-1.5 rounded-[16px] bg-white p-1">
            {(['IN_PROGRESS', 'AVAILABLE', 'COMPLETED'] as const).map((k) => (
              <button key={k} type="button" onClick={() => setTab(k)} className={`h-10 rounded-[12px] text-[13px] font-semibold ${tab === k ? 'bg-brand text-white' : 'text-slate-600'}`}>
                {k === 'IN_PROGRESS' ? 'In progress' : k === 'AVAILABLE' ? 'Available' : 'Completed'} {count(k)}
              </button>
            ))}
          </div>
          {programs.length > 1 && (
            <SlideRow>
              {programs.map((p) => (
                <button key={p} type="button" onClick={() => setProgram(p)} className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[12px] font-semibold ${program === p ? 'bg-brand-soft text-brand ring-1 ring-brand' : 'border border-slate-200 bg-white'}`}>
                  {p === 'All' ? 'All' : p.replace(/_/g, ' ').toLowerCase().replace(/^./, (c) => c.toUpperCase())}
                </button>
              ))}
            </SlideRow>
          )}

          {/* Pinned · always-on referral (16/11) */}
          <button type="button" onClick={() => navigate('/invite')} className="flex w-full flex-col gap-2 rounded-[20px] bg-brand-soft p-4 text-left">
            <span className="flex items-center gap-2.5">
              <span className="flex size-10 items-center justify-center rounded-[20px] bg-white"><Users className="size-[19px] text-brand" /></span>
              <span className="flex flex-col gap-1">
                <span className="text-[15px] font-semibold">Invite friends</span>
                <span className="text-[12px] text-slate-500">Always on · earn coins for every friend who joins</span>
              </span>
            </span>
            <span className="text-[12px] font-semibold text-brand">Invite &amp; track ›</span>
          </button>

          {inTab.length === 0 && (
            <Empty
              art={artGift}
              title={data.isGuest && tab !== 'AVAILABLE' ? t('sso.guest_login_required') : tab === 'IN_PROGRESS' ? 'No missions in progress' : tab === 'AVAILABLE' ? 'No new missions right now' : 'No completed missions yet'}
              text={data.isGuest && tab !== 'AVAILABLE' ? t('sso.guest_login_required_desc') : tab === 'IN_PROGRESS' ? 'Open Available to pick a mission.' : 'New programs are added by Natcash and partners.'}
            />
          )}

          {/* Available · recommended first, then grouped by program/partner (330:246) */}
          {tab === 'AVAILABLE' && inTab.length > 0 && (
            <>
              <SectionHeader title="Recommended for you" />
              {inTab.slice(0, 3).map((m) => (
                <button key={`rec-${m.code}`} type="button" onClick={() => navigate(`/missions/${encodeURIComponent(m.code)}`)} className="flex w-full items-center gap-3 rounded-[16px] bg-white p-3.5 text-left">
                  <span className="flex size-9 items-center justify-center rounded-[18px] bg-brand-soft">{React.createElement(missionIcon(m), { className: 'size-4 text-brand' })}</span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-[14px] font-semibold">{m.name}</span>
                    <span className="text-[11px] text-slate-500">{[m.partner, m.deadline && `ends ${ddmm(m.deadline)}`].filter(Boolean).join(' · ')}</span>
                  </span>
                  <span className="text-right"><span className="block text-[14px] font-semibold text-brand">+{fmt(m.total)} coins</span><span className="text-[10px] text-slate-500">reward</span></span>
                </button>
              ))}
              <SectionHeader title="By program" />
              {byPartner.map(([partner, ms]) => (
                <div key={partner} className="w-full overflow-hidden rounded-[16px] bg-white">
                  <button type="button" onClick={() => setOpen(open === partner ? null : partner)} className="flex w-full items-center gap-3 p-3.5 text-left">
                    <span className="flex size-9 items-center justify-center rounded-[18px] bg-brand-soft"><Sparkles className="size-4 text-brand" /></span>
                    <span className="flex flex-1 flex-col">
                      <span className="text-[14px] font-semibold">{partner}</span>
                      <span className="text-[11px] text-slate-500">{ms.length} missions · up to {fmt(ms.reduce((s, m) => s + m.total, 0))} coins</span>
                    </span>
                    <ChevronDown className={`size-4 transition ${open === partner ? 'rotate-180' : ''}`} />
                  </button>
                  {open === partner && ms.map((m) => (
                    <button key={m.code} type="button" onClick={() => navigate(`/missions/${encodeURIComponent(m.code)}`)} className="flex w-full items-center justify-between border-t border-slate-100 px-3.5 py-3 text-left text-[13px]">
                      <span className="font-medium">{m.name}</span>
                      <span className="font-semibold text-brand">+{fmt(m.total)} coins</span>
                    </button>
                  ))}
                </div>
              ))}
            </>
          )}

          {tab !== 'AVAILABLE' && inTab.map((m) => {
            const Icon = missionIcon(m);
            const next = m.steps.find((s) => s.status === 'IN_PROGRESS');
            return (
              <button key={m.code} type="button" onClick={() => navigate(`/missions/${encodeURIComponent(m.code)}`)} className="flex w-full flex-col gap-2.5 rounded-[20px] bg-white p-4 text-left">
                <span className="flex items-center gap-2.5">
                  <span className="flex size-9 items-center justify-center rounded-[18px] bg-brand-soft"><Icon className="size-4 text-brand" /></span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-[15px] font-semibold">{m.name}</span>
                    <span className="text-[11px] text-slate-500">
                      {fmt(m.total)} coins{next ? ` · ${fmt(Math.max(0, next.targetValue - next.currentProgress))} to go` : m.claimable.length ? ' · ready to claim' : ''}
                    </span>
                  </span>
                </span>
                <GoalChips steps={m.steps} />
              </button>
            );
          })}

        </>
      )}
    </Screen>
  );
};

// ───────────────────────── NV-02 · Mission details (+ ready to claim + claimed popup) ─────────────────────────
export const MissionDetail: React.FC = () => {
  const { code = '' } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [data, failed, reload] = useLoad(loadMissions, [code]);
  const [rulesOpen, setRulesOpen] = useState(true);
  const [claimed, setClaimed] = useState<{ coins: number; balance?: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const userId = uid();
  const m = data?.missions.find((x) => x.code === code);
  const Icon = m ? missionIcon(m) : Fuel;
  const claimCoins = m?.claimable.reduce((s, x) => s + x.rewardPoints, 0) || 0;
  const next = m?.steps.find((s) => s.status === 'IN_PROGRESS');

  const claim = async () => {
    if (!m) return;
    if (!userId) {
      alert(t('sso.guest_login_required_desc'));
      return;
    }
    setBusy(true);
    try {
      let balance: number | undefined;
      for (const s of m.claimable) balance = (await LoyaltyApi.claimMission(s.id, userId)).newPointBalance ?? balance;
      setClaimed({ coins: claimCoins, balance });
    } catch {
      alert('Could not claim the reward. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen title="Mission details" back="/missions">
      {failed && <ErrorBlock onRetry={reload} />}
      {!data && !failed && <Skeleton className="h-[220px]" />}
      {data && !m && <Empty art={artEmptyBox} title="Mission not found" text="It may have ended. Go back to see your other missions." />}
      {m && (
        <>
          <div>
            <h2 className="text-[22px] font-semibold leading-8">{m.name}</h2>
            <p className="text-[13px] text-slate-500">
              {m.partner ? `${m.partner} · ` : ''}
              {m.deadline ? `ends ${ddmmyyyy(m.deadline)}` : 'Reach payment goals to earn coins'}
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 rounded-[20px] bg-brand-soft p-4">
            <div className="flex items-center gap-3">
              <span className="flex size-12 items-center justify-center rounded-[24px] bg-white"><Icon className="size-6 text-brand" /></span>
              <div className="flex-1">
                <p className="text-[17px] font-semibold">{m.done} / {m.steps.length} goals reached</p>
                <p className="text-[12px] text-slate-500">{fmt(m.claimable.length ? claimCoins : m.total)} coins {m.claimable.length ? 'waiting for you' : 'in total'}</p>
              </div>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white">
              <div className="h-full rounded-full bg-emerald-700" style={{ width: `${(m.done / m.steps.length) * 100}%` }} />
            </div>
          </div>
          {m.claimable.length > 0 ? (
            <div className="flex items-start gap-2 rounded-[14px] bg-emerald-50 p-3 text-[13px] text-emerald-800">
              <Sparkles className="mt-0.5 size-4 shrink-0" />
              All goals reached. Tap Claim{m.deadline ? ` before ${ddmmyyyy(m.deadline)}` : ''}, or the reward expires.
            </div>
          ) : next ? (
            <div className="flex items-start gap-2 rounded-[14px] bg-[#FDECEA] p-3 text-[12px]">
              <Info className="mt-0.5 size-4 shrink-0 text-brand" />
              {fmt(Math.max(0, next.targetValue - next.currentProgress))} more to reach goal {next.milestoneStep}.
            </div>
          ) : null}

          <SectionHeader title="Reward path" action={`${m.done}/${m.steps.length} done`} />
          <ol className="relative flex w-full flex-col gap-3">
            {m.steps.map((s) => {
              const done = s.status === 'COMPLETED' || s.status === 'CLAIMED';
              const current = s === next;
              return (
                <li key={s.id} className="flex items-start gap-3">
                  <span className={`mt-3 flex size-9 shrink-0 items-center justify-center rounded-full ${done ? 'bg-emerald-50' : current ? 'bg-brand-soft' : 'bg-slate-100'}`}>
                    {done ? <Check className="size-4 text-emerald-700" /> : current ? <Icon className="size-4 text-brand" /> : <Lock className="size-4 text-slate-400" />}
                  </span>
                  <div className={`flex flex-1 flex-col gap-1 rounded-[16px] p-3.5 ${current ? 'border border-brand/30 bg-brand-soft' : 'bg-white'}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[15px] font-semibold">Goal {s.milestoneStep}</span>
                      <span className={`text-[13px] font-semibold ${done ? 'text-emerald-700' : 'text-brand'}`}>+{fmt(s.rewardPoints)} coins</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
                      <span>{fmt(s.currentProgress)} / {fmt(s.targetValue)}</span>
                      <Pill tone={done ? 'green' : 'orange'}>{s.status === 'CLAIMED' ? 'Claimed' : done ? 'Ready' : 'Pending'}</Pill>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>

          {m.description && (
            <div className="w-full rounded-[20px] bg-white p-4">
              <button type="button" onClick={() => setRulesOpen((o) => !o)} className="flex w-full items-center gap-2 text-left">
                <Info className="size-4 text-slate-500" />
                <span className="flex-1 text-[15px] font-semibold">Mission rules</span>
                <ChevronDown className={`size-4 transition ${rulesOpen ? 'rotate-180' : ''}`} />
              </button>
              {rulesOpen && <p className="mt-2 whitespace-pre-line text-[12px] leading-5 text-slate-500">{m.description}</p>}
            </div>
          )}

          <BottomBar>
            {!userId ? (
              <SecondaryButton disabled>{t('sso.guest_login_required')}</SecondaryButton>
            ) : m.claimable.length > 0 ? (
              <PrimaryButton onClick={claim} disabled={busy}>Claim {fmt(claimCoins)} coins</PrimaryButton>
            ) : (
              <PrimaryButton onClick={() => LoyaltyJSBridge.requestScanQR().catch(() => undefined)}>
                <QrCode className="size-4" /> Scan to pay
              </PrimaryButton>
            )}
          </BottomBar>
        </>
      )}
      <Popup open={!!claimed} onClose={() => { setClaimed(null); reload(); }}>
        <img src={artGift} alt="" className="size-24" />
        <p className="text-[18px] font-semibold">Reward claimed!</p>
        <p className="text-[28px] font-semibold text-emerald-700">+{fmt(claimed?.coins)} coins</p>
        <p className="text-[12px] text-slate-500">Added to your coins.{claimed?.balance !== undefined ? ` New balance ${fmt(claimed.balance)} coins.` : ''}</p>
        <PrimaryButton className="mt-2" onClick={() => navigate('/missions')}>Great!</PrimaryButton>
        <SecondaryButton onClick={() => navigate('/coins')}>See coins history</SecondaryButton>
      </Popup>
    </Screen>
  );
};

// ───────────────────────── NV-03 · Daily check-in (+ success popup, checked-in state) ─────────────────────────
export const CheckIn: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [data, failed, reload] = useLoad(async () => {
    const userId = uid();
    const [p, rewards] = await Promise.all([
      userId ? LoyaltyApi.getProfile(userId).catch(() => null) : Promise.resolve(null),
      loadCheckinRewards(),
    ]);
    return { p, rewards, isGuest: !userId };
  });
  const profile = data?.p;
  const rewards = data?.rewards || [];
  const [done, setDone] = useState<{ coins?: number; streak: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const info = useMemo(() => weekInfo(profile), [profile]);
  const reward: number | undefined = rewards[info.today - 1];
  const tomorrow: number | undefined = rewards[Math.min(info.today, 6)];
  const day7: number | undefined = rewards[6];
  const weekStart = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return d;
  }, []);
  const weekEnd = new Date(weekStart.getTime() + 6 * 86_400_000);

  const checkIn = async () => {
    const userId = uid();
    if (!userId) {
      alert(t('sso.guest_login_required_desc'));
      return;
    }
    setBusy(true);
    try {
      // shortcut: loyalty-service has no dedicated check-in endpoint; the legacy app records it as a DAILY_CHECKIN game result
      // The amount shown comes from the CMS table; the server's response is what we display after the call.
      const r = (await LoyaltyApi.submitGameResult('DAILY_CHECKIN', info.today, userId, undefined, JSON.stringify({ day: info.today, gameCode: 'DAILY_CHECKIN', pointsAwarded: reward }))) as { pointsAwarded?: number };
      setDone({ coins: r?.pointsAwarded ?? reward, streak: info.streak + 1 });
    } catch {
      alert('Check-in failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen title="Daily check-in" back="/">
      <h2 className="text-[22px] font-semibold leading-8">Check-in</h2>
      {failed && <ErrorBlock onRetry={reload} />}
      {!data && !failed && <Skeleton className="h-[160px]" />}
      {data && (
        <>
          <div className="flex w-full items-center gap-3 rounded-[20px] bg-brand-soft p-5">
            <div className="flex flex-1 flex-col gap-2">
              <span className="text-[24px] font-semibold leading-8">{info.streak}-day streak</span>
              <span className="text-[15px] font-medium text-brand">
                {data.isGuest
                  ? t('sso.guest_login_required_desc')
                  : info.doneToday
                  ? tomorrow !== undefined ? `Come back tomorrow for +${tomorrow} coins.` : 'Come back tomorrow to keep your streak.'
                  : reward !== undefined ? `Check in today for +${reward} coins.` : 'Check in today to keep your streak.'}
              </span>
              <span className="text-[12px] text-slate-500">Check in every day for a weekend gift.</span>
            </div>
            <img src={artCalendar} alt="" className="size-[88px] rounded-[20px] object-contain" />
          </div>
          <div className="flex w-full items-center">
            <span className="flex-1 text-[16px] font-semibold">This week's check-in</span>
            <span className="text-[12px] font-semibold text-brand">{Math.min(info.today - (info.doneToday ? 0 : 1), 7)} of 7 days</span>
          </div>
          <WeekStrip profile={profile} rewards={rewards} />
          <p className="text-[11px] text-slate-500">
            Week of {ddmm(weekStart.toISOString())}–{ddmmyyyy(weekEnd.toISOString())} · today is day {info.today}
          </p>
          <div className="flex w-full flex-col gap-3 rounded-[20px] bg-[#1C2B33] p-4 text-white">
            <div className="flex items-center gap-3">
              <span className="flex size-12 items-center justify-center rounded-full bg-[#FFD7A3]"><Gift className="size-6 text-[#1C2B33]" /></span>
              <div>
                <p className="text-[13px] font-semibold">Day 7 gift</p>
                <p className="text-[20px] font-semibold text-[#FFD7A3]">{day7 !== undefined ? `+${fmt(day7)} coins` : 'Weekend gift'}</p>
              </div>
            </div>
            <p className="text-[12px] text-white/80">Complete all 7 days to open it.</p>
          </div>
          {data.isGuest ? (
            <SecondaryButton disabled className="bg-slate-100 text-slate-500">{t('sso.guest_login_required')}</SecondaryButton>
          ) : info.doneToday ? (
            <SecondaryButton className="bg-slate-100 text-slate-500">Checked in today · back tomorrow</SecondaryButton>
          ) : (
            <PrimaryButton onClick={checkIn} disabled={busy}>Check in</PrimaryButton>
          )}
          <p className="text-[12px] text-slate-500">Rewards appear in your coins history after each check-in.</p>
        </>
      )}
      <Popup open={!!done} onClose={() => { setDone(null); reload(); }}>
        <img src={artCalendar} alt="" className="size-24" />
        <p className="text-[18px] font-semibold">Check-in complete!</p>
        {done?.coins !== undefined && <p className="text-[28px] font-semibold text-emerald-700">+{fmt(done.coins)} coins</p>}
        <p className="text-[12px] text-slate-500">{done?.streak}-day streak · {Math.max(0, 7 - (done?.streak || 0))} days to the day 7 gift</p>
        <PrimaryButton className="mt-2" onClick={() => { setDone(null); reload(); }}>Great!</PrimaryButton>
        <SecondaryButton onClick={() => navigate('/coins')}>See coins history</SecondaryButton>
      </Popup>
    </Screen>
  );
};
