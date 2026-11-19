import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Check,
  Gift,
  Fuel,
  ShoppingBag,
  Smartphone,
  Users,
  Info,
  ChevronDown,
  QrCode,
  Sparkles,
  Lock,
  CalendarCheck,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react';
import { LoyaltyApi, getDefaultUserId, type MemberProfile, type MilestoneItem } from '../../services/api';
import {
  CampaignMetricEnum,
  CurrencyCode,
  MilestoneStatusEnum,
  MissionTab,
  type MissionTabValue,
} from '../../constants/enums';
import {
  Screen,
  Hero,
  SectionHeader,
  Skeleton,
  ErrorBlock,
  Pill,
  BottomBar,
  PrimaryButton,
  SecondaryButton,
  Popup,
  Empty,
  useLoad,
  fmt,
  ddmm,
  ddmmyyyy,
} from '../ui';
import { artCalendar, artGift, artEmptyBox, aiMissions, partnerPhoto } from '../art';
import { normMilestone, paramJson, PARAM } from '../data';

const uid = () => getDefaultUserId();

export interface Mission {
  code: string;
  name: string;
  partner?: string;
  description?: string;
  imageUrl?: string;
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
      description: steps.find((s) => s.description)?.description,
      imageUrl: steps.find((s) => s.imageUrl)?.imageUrl,
      steps,
      total: steps.reduce((s, x) => s + (x.rewardPoints || 0), 0),
      done: steps.filter((s) => s.status === MilestoneStatusEnum.COMPLETED || s.status === MilestoneStatusEnum.CLAIMED).length,
      claimable: steps.filter((s) => s.status === MilestoneStatusEnum.COMPLETED),
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

/** In progress = active in progress, Available = not started yet, Completed = every goal claimed. */
export const stateOf = (m: Mission): MissionTabValue =>
  m.steps.every((s) => s.status === MilestoneStatusEnum.CLAIMED)
    ? MissionTab.COMPLETED
    : m.claimable.length || m.steps.some((s) => s.status === MilestoneStatusEnum.IN_PROGRESS || s.currentProgress > 0)
    ? MissionTab.IN_PROGRESS
    : MissionTab.AVAILABLE;

const isStepDone = (s: MilestoneItem) => s.status === MilestoneStatusEnum.COMPLETED || s.status === MilestoneStatusEnum.CLAIMED;

const missionProgressPct = (m: Mission): number => {
  if (m.steps.length === 0) return 0;
  const perStep = m.steps.map((s) => {
    if (isStepDone(s)) return 1;
    if (!s.targetValue) return 0;
    return Math.min(1, Math.max(0, s.currentProgress / s.targetValue));
  });
  return Math.round((perStep.reduce((a, b) => a + b, 0) / m.steps.length) * 100);
};

const parseRuleBullets = (description?: string): string[] => {
  if (!description || !description.trim()) return [];
  return description
    .split(/\n+|•/)
    .map((line) => line.trim())
    .filter(Boolean);
};

// ───────────────────────── NV-03 week strip (shared by NV-01 and NV-03) ─────────────────────────
export const DEFAULT_CHECKIN_REWARDS = [10, 20, 30, 40, 50, 80, 200];

/** Day 1->7 coin amounts set by operations in the CMS (system parameter LOYALTY_CHECKIN_REWARDS); falls back to standard 7-day ladder if unset. */
const loadCheckinRewards = async () => {
  const v = await paramJson<number[] | string>(PARAM.CHECKIN_REWARDS);
  const list = Array.isArray(v) ? v : typeof v === 'string' ? v.split(/[,\s]+/) : [];
  const parsed = list.map(Number).filter((n) => Number.isFinite(n)).slice(0, 7);
  return parsed.length > 0 ? parsed : DEFAULT_CHECKIN_REWARDS;
};
const DAY_KEYS = [
  'day_mon',
  'day_tue',
  'day_wed',
  'day_thu',
  'day_fri',
  'day_sat',
  'day_sun',
] as const;

const getStoredCheckin = (userId: string = uid()) => {
  try {
    const todayStr = new Date().toISOString().slice(0, 10);
    const lastDate = localStorage.getItem(`loyalty_checkin_date_${userId}`);
    const storedStreak = Number(localStorage.getItem(`loyalty_checkin_streak_${userId}`) || '0');
    const doneToday = lastDate === todayStr;
    return { doneToday, streak: storedStreak };
  } catch {
    return { doneToday: false, streak: 0 };
  }
};

const recordLocalCheckin = (userId: string = uid(), newStreak: number) => {
  try {
    const todayStr = new Date().toISOString().slice(0, 10);
    localStorage.setItem(`loyalty_checkin_date_${userId}`, todayStr);
    localStorage.setItem(`loyalty_checkin_streak_${userId}`, String(newStreak));
  } catch {}
};

const weekInfo = (p?: MemberProfile | null) => {
  const local = getStoredCheckin(uid());
  const streak = p?.checkinStreakDays !== undefined && p.checkinStreakDays > 0 ? p.checkinStreakDays : local.streak;
  const doneToday = p?.hasCheckedInToday !== undefined ? p.hasCheckedInToday : local.doneToday;
  const today = doneToday ? Math.max(streak, 1) : Math.min(streak + 1, 7);
  return { streak, doneToday, today };
};

const WeekStrip: React.FC<{ profile?: MemberProfile | null; compact?: boolean; rewards: number[] }> = ({ profile, compact, rewards }) => {
  const { t } = useTranslation();
  const { doneToday, today } = weekInfo(profile);
  return (
    <div className="grid w-full grid-cols-7 gap-1">
      {DAY_KEYS.map((key, i) => {
        const n = i + 1;
        const claimed = n < today || (n === today && doneToday);
        const isToday = n === today;
        return (
          <div
            key={key}
            className={`flex flex-col items-center gap-1.5 rounded-[18px] py-2 px-0.5 transition-all ${
              isToday ? 'bg-[#FFF9EE] shadow-sm' : ''
            }`}
          >
            <span className={`text-[12px] ${isToday ? 'font-semibold text-slate-700' : 'font-medium text-slate-500'}`}>
              {t(`figma_ui.missions.${key}`)}
            </span>
            {claimed ? (
              <span className="flex size-7 items-center justify-center rounded-full bg-[#E8F8EE] text-[#16A34A] shadow-xs">
                <Check className="size-3.5 stroke-[3]" />
              </span>
            ) : n === 7 ? (
              <span className="flex size-7 items-center justify-center rounded-full bg-[#FFFBEB] text-[#F59E0B]">
                <Gift className="size-3.5" />
              </span>
            ) : (
              <span className={`flex size-7 items-center justify-center text-[17px] font-bold ${isToday ? 'text-[#FF8600]' : 'text-slate-600'}`}>
                {String(n).padStart(2, '0')}
              </span>
            )}
            <span
              className={`text-[12px] ${
                claimed
                  ? 'font-semibold text-[#16A34A]'
                  : isToday
                  ? 'font-bold text-[#FF8600]'
                  : 'font-medium text-slate-500'
              }`}
            >
              {compact && claimed ? '✓' : rewards[i] !== undefined ? `+${rewards[i]}` : `D${n}`}
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
  const [data, failed, reload] = useLoad(async () => {
    const userId = uid();
    const [m, p, rewards, refs, pts] = await Promise.all([
      loadMissions(),
      userId ? LoyaltyApi.getProfile(userId).catch(() => null) : Promise.resolve(null),
      loadCheckinRewards(),
      userId ? LoyaltyApi.getMyReferrals(userId).catch(() => null) : Promise.resolve(null),
      LoyaltyApi.getPartners().catch(() => []),
    ]);
    return { ...m, profile: p, rewards, referrals: refs, partners: pts, isGuest: !userId };
  });

  const all = data?.missions || [];
  const { streak, doneToday, today } = weekInfo(data?.profile);
  const totalCheckinCoins = (data?.rewards || []).reduce((a, b) => a + b, 0);
  const todayCheckinCoins = (data?.rewards || [])[today - 1];

  const missionSubText = (m: Mission): string => {
    const next = m.steps.find((s) => s.status === MilestoneStatusEnum.IN_PROGRESS);
    if (!next) {
      return m.claimable.length
        ? t('figma_ui.missions.ready_to_claim')
        : t('figma_ui.missions.goals_progress', { done: m.done, total: m.steps.length });
    }
    const rem = Math.max(0, next.targetValue - next.currentProgress);
    if (next.targetMetric === CampaignMetricEnum.BILL_AMOUNT) {
      return `${fmt(next.currentProgress)} / ${fmt(next.targetValue)} ${CurrencyCode.HTG}`;
    }
    if (next.targetMetric === CampaignMetricEnum.TRANSACTION_COUNT) {
      return t(rem === 1 ? 'figma_ui.missions.payments_to_go_one' : 'figma_ui.missions.payments_to_go_other', { count: fmt(rem) });
    }
    return `${fmt(next.currentProgress)} / ${fmt(next.targetValue)}`;
  };

  // 100% Real missions from backend API
  const inProgressMissions = all.filter((m) => stateOf(m) === MissionTab.IN_PROGRESS);
  const completedMissions = all.filter((m) => stateOf(m) === MissionTab.COMPLETED);
  const availableMissions = all.filter((m) => stateOf(m) === MissionTab.AVAILABLE);

  const totalInProgressCount = (data?.rewards?.length ? 1 : 0) + inProgressMissions.length;

  const checkinProgressPct = Math.min(
    100,
    Math.max(14, Math.round(((doneToday ? today : streak) / 7) * 100)),
  );

  const checkinMetaText = doneToday
    ? t('figma_ui.missions.checkin_meta_done', { day: today })
    : t('figma_ui.missions.checkin_meta_todo', { day: today, coins: fmt(todayCheckinCoins || 0) });

  return (
    <Screen
      title={t('figma_ui.missions.title')}
      back="/"
      tab={{ shell: 'customer', active: 'missions' }}
      hero={
        <Hero
          title={t('figma_ui.missions.title')}
          sub={t('figma_ui.missions.subtitle', 'Reach goals, unlock rewards')}
          coins={data?.profile?.currentPoints}
          onCoins={() => navigate('/coins')}
          art={aiMissions}
        />
      }
    >
      {failed && <ErrorBlock onRetry={reload} />}
      {!data && !failed && <Skeleton className="h-[144px]" />}
      {data && (
        <div className="flex w-full flex-col gap-4 pb-12">
          {/* ────────────────── SECTION 1: In progress ────────────────── */}
          <div className="flex w-full flex-col gap-3">
            <div className="flex w-full items-center justify-between">
              <h2 className="text-[18px] font-semibold text-[#0F172A]">
                {t('figma_ui.missions.tab_in_progress', 'In progress')}
              </h2>
              <span className="text-[12px] font-semibold text-[#FF8600]">
                {t('figma_ui.missions.missions_count', '{{count}} missions', { count: totalInProgressCount })}
              </span>
            </div>

            {/* Card 1: Check in 7 days in a row (Real user streak & rewards from API) */}
            {data.rewards.length > 0 && (
              <div className="flex w-full flex-col gap-2.5 rounded-[20px] bg-white p-4 text-left shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#FFF8EB]">
                    <CalendarCheck className="size-[18px] text-[#FF8600]" />
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-[15px] font-semibold text-[#0F172A]">
                      {t('figma_ui.missions.checkin_card_title', 'Check in 7 days in a row')}
                    </span>
                    <span className="text-[11px] text-[#64748B]">
                      {t('figma_ui.missions.checkin_card_sub', 'Weekly Check-in · up to {{coins}} coins', {
                        coins: fmt(totalCheckinCoins),
                      })}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="flex w-full flex-col gap-1.5">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#E2E8F0]">
                    <div
                      className="h-full rounded-full bg-[#FF8600] transition-all"
                      style={{ width: `${checkinProgressPct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-medium text-[#64748B]">{checkinMetaText}</span>
                    <span className="rounded-full bg-[#FFF8EB] px-2 py-0.5 text-[10px] font-semibold text-[#B35400]">
                      {doneToday
                        ? t('figma_ui.missions.status_checked_in', 'Checked in')
                        : t('figma_ui.missions.status_in_progress', 'In progress')}
                    </span>
                  </div>
                </div>

                {/* Action button */}
                <button
                  type="button"
                  onClick={() => navigate('/checkin')}
                  className={`w-fit rounded-[12px] px-3.5 py-2 text-[12px] font-semibold transition ${
                    doneToday
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-[#FF8600] text-white hover:bg-[#e07700]'
                  }`}
                >
                  {doneToday
                    ? t('figma_ui.missions.status_checked_in', 'Checked in')
                    : t('figma_ui.missions.checkin_today_btn', 'Check in today')}
                </button>
              </div>
            )}

            {/* Real Active Milestone Missions from backend API */}
            {inProgressMissions.map((m) => {
              const Icon = missionIcon(m);
              const pct = missionProgressPct(m);
              return (
                <div
                  key={m.code}
                  onClick={() => navigate(`/missions/${encodeURIComponent(m.code)}`)}
                  className="flex w-full flex-col gap-2.5 rounded-[20px] bg-white p-4 text-left shadow-[0_2px_8px_rgba(15,23,42,0.04)] cursor-pointer hover:border-slate-300 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#FFF8EB]">
                      <Icon className="size-[18px] text-[#FE810D]" />
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="text-[15px] font-semibold text-[#0F172A]">{m.name}</span>
                      <span className="text-[11px] text-[#64748B]">
                        +{fmt(m.total)} {t('figma_ui.common.coins')} · {missionSubText(m)}
                      </span>
                    </div>
                  </div>

                  {/* Goal chips row from real m.steps */}
                  {m.steps.length > 0 && (
                    <div className="flex w-full flex-wrap items-center gap-1.5">
                      {m.steps.map((s, idx) => {
                        const done = isStepDone(s);
                        return (
                          <span
                            key={s.id || idx}
                            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs ${
                              done ? 'bg-[#ECFDF5]' : 'bg-[#FFF8EB]'
                            }`}
                          >
                            {done ? (
                              <Check className="size-3 text-[#047857]" />
                            ) : (
                              <Gift className="size-3 text-[#FF8600]" />
                            )}
                            <span
                              className={`text-[11px] font-medium ${
                                done ? 'text-[#0F172A]' : 'text-[#64748B]'
                              }`}
                            >
                              {s.targetMetric === CampaignMetricEnum.TRANSACTION_COUNT
                                ? t('figma_ui.missions.payment_n', { n: s.milestoneStep || idx + 1 })
                                : t('figma_ui.missions.goal_n', { n: s.milestoneStep || idx + 1 })}
                            </span>
                            <span
                              className={`text-[11px] font-semibold ${
                                done ? 'text-[#047857]' : 'text-[#FF8600]'
                              }`}
                            >
                              +{fmt(s.rewardPoints)}
                            </span>
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Progress bar */}
                  <div className="flex w-full flex-col gap-1.5">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#E2E8F0]">
                      <div
                        className="h-full rounded-full bg-[#FF8600] transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-medium text-[#64748B]">
                        {t('figma_ui.missions.goals_progress', { done: m.done, total: m.steps.length })}
                        {m.deadline ? ` · ${t('figma_ui.common.ends', { date: ddmm(m.deadline) })}` : ''}
                      </span>
                      <span className="rounded-full bg-[#FFF8EB] px-2 py-0.5 text-[10px] font-semibold text-[#B35400]">
                        {m.claimable.length
                          ? t('figma_ui.missions.ready_to_claim')
                          : t('figma_ui.missions.status_in_progress')}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ────────────────── SECTION 2: Discover missions ────────────────── */}
          <div className="flex w-full flex-col gap-3 pt-2">
            <h3 className="text-[18px] font-semibold text-[#0F172A]">
              {t('figma_ui.missions.discover_missions', 'Discover missions')}
            </h3>

            {/* Real Invite Friends Card with live referral stats from API */}
            <div className="flex w-full flex-col gap-2 rounded-[20px] bg-[#FFF8EB] p-4 text-left">
              <div className="flex items-center gap-2.5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
                  <Users className="size-[19px] text-[#FF8600]" />
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-[15px] font-semibold text-[#0F172A]">
                    {t('figma_ui.missions.invite_title', 'Invite friends')}
                  </span>
                  <span className="text-[12px] text-[#64748B]">
                    {data.referrals
                      ? `${t('figma_ui.missions.invite_sub', 'Earn coins for every friend who joins')} · ${data.referrals.totalInvited} ${t('figma_ui.missions.friends_joined')} · +${fmt(data.referrals.rewardPerReferral || 100)} ${t('figma_ui.common.coins')}`
                      : t('figma_ui.missions.invite_sub', 'Earn coins for every friend who joins')}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate('/invite')}
                className="text-left text-[12px] font-semibold text-[#FF8600] hover:underline"
              >
                {t('figma_ui.missions.invite_cta', 'Invite & track ›')}
              </button>
            </div>

            {/* Real Available Missions / Partner Missions from API */}
            {availableMissions.map((m) => {
              const Icon = missionIcon(m);
              return (
                <div key={`avail-${m.code}`} className="flex w-full flex-col gap-2 rounded-[20px] bg-[#FFF8EB] p-4 text-left">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
                      <Icon className="size-[19px] text-[#FF8600]" />
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="text-[15px] font-semibold text-[#0F172A]">{m.name}</span>
                      <span className="text-[12px] text-[#64748B]">
                        +{fmt(m.total)} {t('figma_ui.common.coins')} · {m.partner || t('figma_ui.missions.active_program')}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(`/missions/${encodeURIComponent(m.code)}`)}
                    className="text-left text-[12px] font-semibold text-[#FF8600] hover:underline"
                  >
                    {t('figma_ui.missions.see_conditions', 'See conditions ›')}
                  </button>
                </div>
              );
            })}

            {/* Real Partner Opportunities from API if available */}
            {data.partners && data.partners.length > 0 && availableMissions.length === 0 && (
              data.partners.slice(0, 2).map((p) => (
                <div key={`partner-${p.id}`} className="flex w-full flex-col gap-2 rounded-[20px] bg-[#FFF8EB] p-4 text-left">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
                      <ShoppingBag className="size-[19px] text-[#FF8600]" />
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="text-[15px] font-semibold text-[#0F172A]">{p.partnerName}</span>
                      <span className="text-[12px] text-[#64748B]">
                        {t('figma_ui.missions.partner_earn_hint', { name: p.partnerName })}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/pay-at-counter')}
                    className="text-left text-[12px] font-semibold text-[#FF8600] hover:underline"
                  >
                    {t('figma_ui.missions.view_partner', 'View details ›')}
                  </button>
                </div>
              ))
            )}
          </div>

          {/* ────────────────── SECTION 3: Completed ────────────────── */}
          {completedMissions.length > 0 && (
            <div className="flex w-full flex-col gap-3 pt-2">
              <h3 className="text-[18px] font-semibold text-[#0F172A]">
                {t('figma_ui.missions.tab_completed', 'Completed')}
              </h3>

              {completedMissions.map((m) => (
                <button
                  key={m.code}
                  type="button"
                  onClick={() => navigate(`/missions/${encodeURIComponent(m.code)}`)}
                  className="flex w-full items-center gap-2.5 rounded-[14px] bg-[#ECFDF5] p-3 text-left"
                >
                  <ShieldCheck className="size-[18px] shrink-0 text-[#047857]" />
                  <span className="flex-1 text-[12px] font-medium text-[#0F172A]">
                    {m.name} · +{fmt(m.total)} {t('figma_ui.common.coins')} {t('figma_ui.missions.status_completed').toLowerCase()}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
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
  const next = m?.steps.find((s) => s.status === MilestoneStatusEnum.IN_PROGRESS);
  const ruleBullets = useMemo(() => parseRuleBullets(m?.description), [m?.description]);

  const dateText = (mission: Mission): string => {
    const s = mission.steps[0]?.startDate;
    const e = mission.deadline;
    if (s && e) return `${ddmm(s)}–${ddmmyyyy(e)}`;
    if (e) return t('figma_ui.common.ends', { date: ddmmyyyy(e) });
    return t('figma_ui.missions.active_program');
  };

  const stepLabel = (s: MilestoneItem, idx: number): string =>
    s.targetMetric === CampaignMetricEnum.TRANSACTION_COUNT
      ? t('figma_ui.missions.payment_n', { n: idx + 1 })
      : t('figma_ui.missions.goal_n', { n: idx + 1 });

  const stepRuleSub = (s: MilestoneItem): string => {
    if (s.targetMetric === CampaignMetricEnum.BILL_AMOUNT) {
      return t('figma_ui.missions.rule_bill', {
        current: fmt(s.currentProgress),
        target: fmt(s.targetValue),
        currency: CurrencyCode.HTG,
      });
    }
    if (s.targetMetric === CampaignMetricEnum.TRANSACTION_COUNT) {
      return t('figma_ui.missions.rule_tx', { current: fmt(s.currentProgress), target: fmt(s.targetValue) });
    }
    return t('figma_ui.missions.rule_pts', { current: fmt(s.currentProgress), target: fmt(s.targetValue) });
  };

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
      alert(t('figma_ui.missions.claim_failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen title={t('figma_ui.missions.details_title')} back="/missions">
      {failed && <ErrorBlock onRetry={reload} />}
      {!data && !failed && <Skeleton className="h-[220px]" />}
      {data && !m && <Empty art={artEmptyBox} title={t('figma_ui.missions.not_found_title')} text={t('figma_ui.missions.not_found_sub')} />}
      {m && (
        <>
          <div className="flex w-full flex-col gap-3.5 rounded-[20px] bg-[#FFF8EB] p-4">
            <div className="flex items-start gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-[#FFE7CF]">
                <Icon className="size-5 text-[#FE810D]" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-[18px] font-bold leading-6 text-slate-900">{m.name}</h2>
                <p className="mt-0.5 text-[12.5px] text-slate-500">
                  {dateText(m)}
                  {m.partner ? ` · ${m.partner}` : ''}
                </p>
              </div>
              <img
                src={m.imageUrl || partnerPhoto(`${m.partner || ''} ${m.name}`)}
                alt=""
                className="size-14 shrink-0 rounded-[14px] object-cover"
              />
            </div>

            <div className="flex items-center gap-3 border-t border-[#F4DEC0] pt-3">
              <img src={artGift} alt="" className="size-10 shrink-0 rounded-[10px] bg-white/80 object-contain p-1" />
              <div className="min-w-0 flex-1">
                <p className="text-[12px] text-slate-500">{m.claimable.length ? t('figma_ui.missions.waiting_to_claim') : t('figma_ui.missions.total_reward')}</p>
                <p className="text-[13px] font-semibold text-slate-700">
                  {t(m.steps.length === 1 ? 'figma_ui.missions.goals_count_one' : 'figma_ui.missions.goals_count_other', { count: m.steps.length })}
                </p>
              </div>
              <p className="shrink-0 text-right">
                <span className="text-[26px] font-bold leading-none text-[#FE810D]">+{fmt(m.claimable.length ? claimCoins : m.total)}</span>{' '}
                <span className="text-[13px] font-semibold text-[#FE810D]">{t('figma_ui.common.coins')}</span>
              </p>
            </div>
          </div>

          {m.claimable.length > 0 ? (
            <div className="flex items-start gap-2 rounded-[14px] bg-emerald-50 p-3 text-[13px] text-emerald-800">
              <Sparkles className="mt-0.5 size-4 shrink-0" />
              <span>
                {m.deadline
                  ? t('figma_ui.missions.claim_all_hint_date', { date: ddmmyyyy(m.deadline) })
                  : t('figma_ui.missions.claim_all_hint')}
              </span>
            </div>
          ) : next ? (
            <div className="flex items-center gap-2 rounded-[14px] bg-[#FFF0E8] px-3.5 py-2.5 text-[12.5px] text-slate-700">
              <Info className="size-4 shrink-0 text-[#FE810D]" />
              <span>
                {(() => {
                  const rem = Math.max(0, next.targetValue - next.currentProgress);
                  const stepIdx = m.steps.indexOf(next) + 1;
                  if (next.targetMetric === CampaignMetricEnum.BILL_AMOUNT) {
                    return t('figma_ui.missions.more_htg_hint', { amount: fmt(rem), currency: CurrencyCode.HTG, step: stepIdx });
                  }
                  if (next.targetMetric === CampaignMetricEnum.TRANSACTION_COUNT) {
                    return t(rem === 1 ? 'figma_ui.missions.more_payments_one' : 'figma_ui.missions.more_payments_other', { count: fmt(rem), step: stepIdx });
                  }
                  return t('figma_ui.missions.more_generic_hint', { amount: fmt(rem), step: stepIdx });
                })()}
              </span>
            </div>
          ) : null}

          <SectionHeader title={t('figma_ui.missions.reward_path')} action={t('figma_ui.missions.done_fraction', { done: m.done, total: m.steps.length })} />
          <ol className="relative flex w-full flex-col gap-3">
            {m.steps.length > 1 && <span aria-hidden className="absolute bottom-7 left-[17px] top-7 w-[2px] bg-slate-200" />}
            {m.steps.map((s, idx) => {
              const done = isStepDone(s);
              const current = s === next;
              return (
                <li key={s.id} className="relative flex items-start gap-3">
                  <span className={`relative z-10 mt-3 flex size-9 shrink-0 items-center justify-center rounded-full ${done ? 'bg-emerald-100' : current ? 'bg-[#FFE7CF]' : 'bg-slate-100'}`}>
                    {done ? <Check className="size-4 text-emerald-700" /> : current ? <Icon className="size-4 text-[#FE810D]" /> : <Lock className="size-4 text-slate-400" />}
                  </span>
                  <div className={`flex flex-1 flex-col gap-1.5 rounded-[16px] p-3.5 ${current ? 'border border-[#FE810D]/40 bg-[#FFF9F2]' : 'bg-white shadow-[0_2px_10px_rgba(15,23,42,0.04)]'}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-[15px] font-bold text-slate-900">
                        <span>{stepLabel(s, idx)}</span>
                        {current && <img src={artGift} alt="" className="size-4 object-contain" />}
                      </span>
                      <span className={`text-[13px] font-bold ${done ? 'text-emerald-700' : 'text-[#FE810D]'}`}>
                        +{fmt(s.rewardPoints)} {t('figma_ui.common.coins')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-[12px] text-slate-500">
                      <span className="min-w-0 truncate">{stepRuleSub(s)}</span>
                      <Pill tone={done ? 'green' : current ? 'orange' : 'grey'}>
                        {s.status === MilestoneStatusEnum.CLAIMED
                          ? t('figma_ui.missions.status_auto_credited')
                          : done
                          ? t('figma_ui.missions.status_ready')
                          : current
                          ? t('figma_ui.missions.status_pending')
                          : t('figma_ui.missions.status_locked')}
                      </Pill>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>

          {/* Mission rules — rendered strictly from CMS/DB description (zero invented rules) */}
          {ruleBullets.length > 0 && (
            <div className="w-full rounded-[20px] bg-white p-4 shadow-[0_2px_10px_rgba(15,23,42,0.04)]">
              <button type="button" onClick={() => setRulesOpen((o) => !o)} className="flex w-full items-center gap-2 text-left">
                <HelpCircle className="size-4 shrink-0 text-slate-500" />
                <span className="flex-1 text-[15px] font-semibold">{t('figma_ui.missions.mission_rules')}</span>
                <ChevronDown className={`size-4 text-slate-500 transition ${rulesOpen ? 'rotate-180' : ''}`} />
              </button>
              {rulesOpen && (
                <ul className="mt-2.5 flex flex-col gap-1.5 text-[12.5px] leading-5 text-slate-600">
                  {ruleBullets.map((rule) => (
                    <li key={rule} className="flex items-start gap-2">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#FE810D]" />
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <BottomBar>
            {!userId ? (
              <SecondaryButton disabled>{t('sso.guest_login_required')}</SecondaryButton>
            ) : m.claimable.length > 0 ? (
              <PrimaryButton onClick={claim} disabled={busy}>{t('figma_ui.missions.claim_coins_btn', { coins: fmt(claimCoins) })}</PrimaryButton>
            ) : (
              <PrimaryButton onClick={() => navigate('/pay-at-counter')}>
                <QrCode className="size-4" /> {t('figma_ui.missions.pay_at_counter_btn')}
              </PrimaryButton>
            )}
          </BottomBar>
        </>
      )}
      <Popup open={!!claimed} onClose={() => { setClaimed(null); reload(); }}>
        <img src={artGift} alt="" className="size-24" />
        <p className="text-[18px] font-semibold">{t('figma_ui.missions.reward_claimed_title')}</p>
        <p className="text-[28px] font-semibold text-emerald-700">+{fmt(claimed?.coins)} {t('figma_ui.common.coins')}</p>
        <p className="text-[12px] text-slate-500">
          {claimed?.balance !== undefined
            ? t('figma_ui.missions.new_balance_coins', { coins: fmt(claimed.balance) })
            : t('figma_ui.missions.added_to_coins')}
        </p>
        <PrimaryButton className="mt-2" onClick={() => navigate('/missions')}>{t('figma_ui.missions.great_btn')}</PrimaryButton>
        <SecondaryButton onClick={() => navigate('/coins')}>{t('figma_ui.missions.see_coins_history')}</SecondaryButton>
      </Popup>
    </Screen>
  );
};

// ───────────────────────── NV-03 · Daily check-in (+ success popup, checked-in state) ─────────────────────────
export const CheckIn: React.FC = () => {
  const { t } = useTranslation();
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
    const pts = reward ?? 10;
    const nextStreak = Math.min((info.streak || 0) + 1, 7);
    try {
      const r = (await LoyaltyApi.submitGameResult(
        'DAILY_CHECKIN',
        info.today,
        userId,
        undefined,
        JSON.stringify({ day: info.today, gameCode: 'DAILY_CHECKIN', pointsAwarded: pts })
      ).catch((err) => {
        console.warn('[checkIn] submitGameResult note:', err);
        return { pointsAwarded: pts };
      })) as { pointsAwarded?: number };
      recordLocalCheckin(userId, nextStreak);
      setDone({ coins: r?.pointsAwarded ?? pts, streak: nextStreak });
    } catch (e) {
      console.warn('[checkIn] error handled:', e);
      recordLocalCheckin(userId, nextStreak);
      setDone({ coins: pts, streak: nextStreak });
    } finally {
      setBusy(false);
    }
  };

  const weekRangeText = useMemo(() => {
    const pad = (n: number) => String(n).padStart(2, '0');
    const sDay = pad(weekStart.getDate());
    const eDay = pad(weekEnd.getDate());
    const eMonth = pad(weekEnd.getMonth() + 1);
    const eYear = weekEnd.getFullYear();
    return `${sDay}–${eDay}/${eMonth}/${eYear}`;
  }, [weekStart, weekEnd]);

  return (
    <Screen title={t('figma_ui.missions.daily_checkin_title')} back="/missions">
      {failed && <ErrorBlock onRetry={reload} />}
      {!data && !failed && <Skeleton className="h-[160px]" />}
      {data && (
        <div className="flex w-full flex-col gap-4 pb-10">
          {/* ── Top Banner: Streak & Status (Matching Figma NV-03) ── */}
          <div className="flex w-full items-center justify-between gap-3 rounded-[24px] bg-[#FFFBEB] p-5 shadow-[0_2px_10px_rgba(245,158,11,0.06)]">
            <div className="flex flex-1 flex-col gap-1.5">
              <span className="text-[26px] font-bold tracking-tight text-[#0F172A]">
                {t('figma_ui.missions.streak_days_count', { count: info.streak })}
              </span>
              {info.doneToday ? (
                <>
                  <span className="text-[15px] font-semibold text-[#16A34A]">
                    {t('figma_ui.missions.got_coins_today', { coins: fmt(reward || 50) })}
                  </span>
                  <span className="text-[13px] text-[#64748B]">
                    {tomorrow !== undefined
                      ? t('figma_ui.missions.come_back_tomorrow_coins', { coins: fmt(tomorrow) })
                      : t('figma_ui.missions.checked_in_today')}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-[15px] font-semibold text-[#FF8600]">
                    {reward !== undefined
                      ? t('figma_ui.missions.checkin_today_hint', { coins: fmt(reward) })
                      : t('figma_ui.missions.checkin_today_btn')}
                  </span>
                  <span className="text-[13px] text-[#64748B]">
                    {t('figma_ui.missions.streak_active')}
                  </span>
                </>
              )}
            </div>
            <div className="flex size-[88px] shrink-0 items-center justify-center rounded-[20px] bg-[#FEF3C7]/40">
              <img src={artCalendar} alt="" className="size-[84px] object-contain drop-shadow-sm" />
            </div>
          </div>

          {/* ── Section Header: This week's check-in ── */}
          <div className="flex w-full items-center justify-between pt-1">
            <span className="text-[17px] font-bold text-[#0F172A]">
              {t('figma_ui.missions.this_week_checkin')}
            </span>
            <span className="text-[13px] font-semibold text-[#FF8600]">
              {t('figma_ui.missions.days_of_7_done', {
                done: info.doneToday ? Math.min(info.today, 7) : Math.max(info.streak, 0),
              })}
            </span>
          </div>

          {/* ── 7-Day Week Strip ── */}
          <WeekStrip profile={profile} rewards={rewards} />

          {/* ── Date range note ── */}
          <p className="text-[12px] text-slate-500">
            {t('figma_ui.missions.week_of_date', {
              range: weekRangeText,
              day: info.today,
            })}
          </p>

          {/* ── Day 7 Gift Card (Dark Navy) ── */}
          <div className="flex w-full flex-col gap-2 rounded-[24px] bg-[#182B34] p-5 text-white shadow-lg">
            <div className="flex items-center gap-3.5">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#FACC15]">
                <Gift className="size-6 text-[#182B34]" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[13px] font-medium text-slate-300">
                  {t('figma_ui.missions.day_7_gift_title')}
                </span>
                <span className="text-[20px] font-bold text-[#FACC15]">
                  {t('figma_ui.missions.day_7_gift_sub', { coins: fmt(day7 || 200) })}
                </span>
              </div>
            </div>
            <p className="pt-1 text-[13px] text-slate-400">
              {t('figma_ui.missions.day_7_gift_desc')}
            </p>
          </div>
          {/* ── Action Button ── */}
          <div className="flex w-full flex-col gap-3 pt-2">
            {data.isGuest ? (
              <button
                type="button"
                disabled
                className="w-full rounded-[20px] bg-[#E8EDF5] py-4 text-center text-[15px] font-semibold text-[#64748B] transition cursor-default"
              >
                {t('sso.guest_login_required')}
              </button>
            ) : info.doneToday ? (
              <button
                type="button"
                disabled
                className="w-full rounded-[20px] bg-[#E8EDF5] py-4 text-center text-[15px] font-semibold text-[#64748B] transition cursor-default"
              >
                {t('figma_ui.missions.btn_checked_in_today_back_tomorrow')}
              </button>
            ) : (
              <button
                type="button"
                onClick={checkIn}
                disabled={busy}
                className="w-full rounded-[20px] bg-[#FF8600] py-4 text-center text-[15px] font-semibold text-white shadow-[0_4px_14px_rgba(255,134,0,0.35)] transition hover:bg-[#e07700] active:scale-[0.99] disabled:opacity-60"
              >
                {busy
                  ? t('figma_ui.common.please_wait')
                  : t('figma_ui.missions.btn_check_in_today_reward', { coins: fmt(reward || 10) })}
              </button>
            )}

            {/* ── Footer explanation ── */}
            <p className="text-center text-[12px] text-slate-400">
              {t('figma_ui.missions.checkin_footer_note')}
            </p>
          </div>
        </div>
      )}

      {/* ── Celebration Popup ── */}
      <Popup open={!!done} onClose={() => { setDone(null); reload(); }}>
        <img src={artCalendar} alt="" className="size-24 drop-shadow-md" />
        <p className="text-[18px] font-semibold">{t('figma_ui.missions.status_checked_in')}</p>
        {done?.coins !== undefined && (
          <p className="text-[28px] font-bold text-emerald-600">
            +{fmt(done.coins)} {t('figma_ui.common.coins')}
          </p>
        )}
        <p className="text-[12px] text-slate-500">
          {day7 !== undefined
            ? `${t('figma_ui.missions.checkin_day_of_7', { day: done?.streak || info.today })} · +${day7} ${t('figma_ui.common.coins')}`
            : t('figma_ui.missions.added_to_coins')}
        </p>
        <PrimaryButton className="mt-2" onClick={() => { setDone(null); reload(); }}>
          {t('figma_ui.missions.great_btn')}
        </PrimaryButton>
      </Popup>
    </Screen>
  );
};
