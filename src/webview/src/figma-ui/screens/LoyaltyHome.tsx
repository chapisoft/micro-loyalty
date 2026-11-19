import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { QrCode, ShieldCheck, Sparkles, ArrowRightLeft, Briefcase } from 'lucide-react';
import useSSOAuth from '../../hooks/useSSOAuth';
import {
  LoyaltyApi,
  getDefaultUserId,
  type ApplicablePolicyItem,
  type CatalogVoucherItem,
  type ContentBannerItem,
  type UserVoucherItem,
  type ExpiringBucketsResponse,
  type MemberProfile,
  type MilestoneItem,
  type RecommendedMissionItem,
  type RecommendedVoucherItem,
  type TenantUserContextResponse,
} from '../../services/api';
import { GameArt } from '../GameArt';
import { Screen, SectionHeader, Skeleton, ErrorBlock, SlideRow, Popup, Pill, CoinDot, PrimaryButton, SecondaryButton, fmt, ddmm, ddmmyyyy, toDate } from '../ui';
import { userState } from './Rewards';
import { artGift, artHourglass, artCup } from '../art';
import { tierLook, tierLabel } from '../tiers';
import { normMilestone } from '../data';
import { loadGames, type GameEntry } from '../games';
import { partnerPhoto } from '../art';
import type { SegmentProfileResponse } from '../../services/api';
import iconHistory from '../../assets/figma/icon-history.svg';
import iconBell from '../../assets/figma/icon-bell.svg';
import illCalendar from '../../assets/figma/ill-calendar-gold.svg';
import illTicket2 from '../../assets/figma/ill-ticket-gold-2.svg';
import illGift from '../../assets/figma/ill-gift-gold.svg';
import iconFuel from '../../assets/figma/icon-fuel.svg';
import iconCheck from '../../assets/figma/icon-check.svg';
import iconGift from '../../assets/figma/icon-gift.svg';

interface Mission {
  code: string;
  name: string;
  steps: MilestoneItem[];
  totalReward: number;
  toGo: number;
}

const groupMissions = (items: MilestoneItem[]): Mission[] => {
  const by = new Map<string, MilestoneItem[]>();
  items.forEach((m) => by.set(m.campaignCode, [...(by.get(m.campaignCode) || []), m]));
  return [...by.entries()]
    .map(([code, steps]) => {
      const sorted = [...steps].sort((a, b) => a.milestoneStep - b.milestoneStep);
      const next = sorted.find((s) => s.status === 'IN_PROGRESS');
      return {
        code,
        name: sorted[0].campaignName,
        steps: sorted,
        totalReward: sorted.reduce((s, x) => s + (x.rewardPoints || 0), 0),
        toGo: next ? Math.max(0, next.targetValue - next.currentProgress) : 0,
      };
    })
    .filter((m) => m.steps.some((s) => s.status === 'IN_PROGRESS' || s.status === 'COMPLETED'));
};

const dealPhoto = (v: CatalogVoucherItem) => partnerPhoto(`${v.partnerName} ${v.title}`);

interface HomeData {
  profile: MemberProfile | null;
  missions: Mission[];
  expiring: ExpiringBucketsResponse | null;
  deals: CatalogVoucherItem[];
  referralCount: number;
  referralReward: number;
  games: GameEntry[];
  segment: SegmentProfileResponse | null;
  vouchers: UserVoucherItem[];
  banners: ContentBannerItem[];
  userContext: TenantUserContextResponse | null;
}

interface Reminder { art: string; title: string; text: string; cta: string; to: string }
const DAY = 86_400_000;
/**
 * Reminder popup when Loyalty opens (Figma 582:1234 / 1524 / 1814; CMS CN-06): at most one per opening,
 * priority reward waiting > voucher about to expire (≤ 3 days) > mission about to end (≤ 2 days), only 08:00–20:00.
 * shortcut: rules are applied here from data the app already loads; move to GET /me/popup when CN-06 ships (plan GĐ5).
 */
const pickReminder = (d: HomeData): Reminder | null => {
  const h = new Date().getHours();
  if (h < 8 || h >= 20) return null;
  const now = Date.now();
  const claim = d.missions.find((m) => m.steps.some((s) => s.status === 'COMPLETED'));
  if (claim) return { art: artCup, title: 'You have a reward to claim', text: `${claim.name}: your reward is waiting.`, cta: 'Claim reward', to: `/missions/${encodeURIComponent(claim.code)}` };
  const exp = (x: UserVoucherItem) => toDate(x.expiresAt || x.validUntil).getTime();
  const v = d.vouchers.find((x) => userState(x) === 'ready' && exp(x) - now <= 3 * DAY && exp(x) > now);
  if (v) return { art: artGift, title: 'Your voucher expires soon', text: `${v.discountText || v.title} · valid until ${ddmmyyyy(v.validUntil)}.`, cta: 'Use voucher', to: `/my-vouchers/${v.id}` };
  const end = d.missions.find((m) => m.steps.some((s) => s.status === 'IN_PROGRESS' && s.expiresAt && new Date(s.expiresAt).getTime() - now <= 2 * DAY && new Date(s.expiresAt).getTime() > now));
  if (end) return { art: artHourglass, title: 'A mission ends soon', text: `${end.name} ends in 2 days or less.`, cta: 'See mission', to: `/missions/${encodeURIComponent(end.code)}` };
  return null;
};

export const LoyaltyHome: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const go = (path: string) => navigate(path);
  const { session, userContext: authContext, logout } = useSSOAuth();
  const userId = session?.externalUserId || getDefaultUserId();
  const [data, setData] = useState<HomeData | null>(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    setFailed(false);
    try {
      const [profile, ms, expiring, deals, refs, games, segment, vouchers, homeContent, freshContext] = await Promise.all([
        LoyaltyApi.getProfile(userId),
        LoyaltyApi.getMilestones(userId).catch(() => ({ milestones: [] as unknown[] })),
        LoyaltyApi.getExpiringBuckets(userId).catch(() => null),
        LoyaltyApi.getVoucherCatalog().catch(() => [] as CatalogVoucherItem[]),
        LoyaltyApi.getMyReferrals(userId).catch(() => null),
        loadGames(),
        LoyaltyApi.getSegmentProfile(userId).catch(() => null), // CN-01 · content for the member's segment
        LoyaltyApi.getUserVouchers(userId).catch(() => [] as UserVoucherItem[]),
        LoyaltyApi.getMeHome(userId, 'LOYALTY_HOME').catch(() => ({ banners: [] as ContentBannerItem[] })),
        LoyaltyApi.getMeContext(userId).catch(() => authContext),
      ]);
      // The live API returns {items, ekycVerifiedCount}; the typed client says {referrals, totalEkycVerified}.
      const r = refs as unknown as Record<string, unknown> | null;
      const refItems = (r?.referrals || r?.items || []) as unknown[];
      setData({
        profile,
        missions: groupMissions((((ms as { milestones?: unknown[] }).milestones || []) as MilestoneItem[]).map(normMilestone)),
        games: games.games.slice(0, 8),
        segment,
        expiring: Array.isArray(expiring) ? null : expiring,
        deals: (deals || []).filter((d) => d.status !== 'INACTIVE').slice(0, 6),
        referralCount: refItems.length,
        referralReward: Number(r?.rewardPerReferral) || 0,
        vouchers,
        banners: homeContent?.banners || [],
        userContext: freshContext || authContext,
      });
    } catch {
      setFailed(true);
    }
  }, [userId, authContext]);

  useEffect(() => {
    void load();
  }, [load]);

  const p = data?.profile;
  const look = tierLook(p?.tier?.code);
  const isNew = !!p && !p.currentPoints && !p.tierPoints && !data?.missions.length;
  const expiringCoins = data?.expiring?.totalExpiringPoints || 0;
  const year = useMemo(() => new Date().getFullYear(), []);
  const [reminder, setReminder] = useState<Reminder | null>(null);
  useEffect(() => {
    if (!data) return;
    let cancelled = false;
    const resolvePopup = async () => {
      try {
        if (sessionStorage.getItem('loyalty_popup_shown')) return;
      } catch {
        // ignore storage errors
      }
      const now = Date.now();
      const hasClaimableReward = data.missions.some((m) => m.steps.some((s) => s.status === 'COMPLETED'));
      const voucherDays = data.vouchers
        .filter((x) => userState(x) === 'ready')
        .map((x) => Math.ceil((toDate(x.expiresAt || x.validUntil).getTime() - now) / DAY))
        .filter((d) => d >= 0)
        .sort((a, b) => a - b)[0];
      const missionDays = data.missions
        .flatMap((m) => m.steps)
        .filter((s) => s.status === 'IN_PROGRESS' && s.expiresAt)
        .map((s) => Math.ceil((new Date(s.expiresAt!).getTime() - now) / DAY))
        .filter((d) => d >= 0)
        .sort((a, b) => a - b)[0];

      try {
        const res = await LoyaltyApi.getMePopup({
          externalUserId: userId,
          hasClaimableReward,
          expiringVoucherDays: voucherDays,
          endingMissionDays: missionDays,
          localHour: new Date().getHours(),
        });
        if (cancelled) return;
        if (res?.popup) {
          const pop = res.popup;
          const art = pop.popupType === 'VOUCHER_EXPIRING' ? artGift : pop.popupType === 'MISSION_ENDING' ? artHourglass : artCup;
          try { sessionStorage.setItem('loyalty_popup_shown', '1'); } catch { /* ignore */ }
          setReminder({
            art,
            title: pop.title,
            text: pop.body || '',
            cta: pop.ctaLabel || 'Open',
            to: pop.deepLink?.startsWith('/') ? pop.deepLink : '/missions',
          });
        }
      } catch {
        if (cancelled) return;
        const r = pickReminder(data);
        if (r) {
          try { sessionStorage.setItem('loyalty_popup_shown', '1'); } catch { /* ignore */ }
        }
        setReminder(r);
      }
    };
    void resolvePopup();
    return () => { cancelled = true; };
  }, [data, userId]);

  return (
    <Screen
      title="Rewards"
      tab={{ shell: 'customer', active: 'home' }}
      barTitle
      hero={
        <div className="flex items-center gap-1 pt-3">
          <p className="min-w-0 flex-1 text-[15px] font-semibold">{isNew ? 'Your journey starts here' : 'Your benefits'}</p>
          <button type="button" aria-label="Coins history" onClick={() => go('/coins')} className="flex size-10 items-center justify-center">
            <img src={iconHistory} alt="" className="size-[22px] brightness-0 invert" />
          </button>
          <button type="button" aria-label="Notifications" onClick={() => go('/inbox')} className="-mr-2 flex size-10 items-center justify-center">
            <img src={iconBell} alt="" className="size-[22px] brightness-0 invert" />
          </button>
        </div>
      }
    >

      {failed && <ErrorBlock onRetry={load} />}
      {!data && !failed && (
        <>
          <Skeleton className="h-[177px]" />
          <Skeleton className="h-[72px]" />
          <Skeleton className="h-[120px]" />
        </>
      )}

      {data && p && (
        <>
          {/* Member card · HV-02 (Figma 330:230): overlaps the orange header; "Pay at counter" opens LM-17 */}
          <div role="button" tabIndex={0} onClick={() => go('/tiers')} onKeyDown={(e) => e.key === 'Enter' && go('/tiers')} className="flex w-full cursor-pointer flex-col gap-2 rounded-[20px] p-4 text-left shadow-[0_2px_12px_rgba(0,0,0,0.06)]" style={{ background: look.cardBg }}>
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-slate-900">
                  {p.fullName || p.externalUserId}
                  <span className="ml-1.5 text-[11.5px] font-normal text-slate-500">· {p.phoneNumber || p.externalUserId}</span>
                </p>
                <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                  <Pill tone="grey">{session?.tenantId || p.tenantId}</Pill>
                  {data.userContext?.accountRole && (
                    <Pill tone={data.userContext.accountRole === 'CUSTOMER' ? 'orange' : 'blue'}>
                      {data.userContext.accountRole === 'SUPER_AGENT'
                        ? t('sso.role_super_agent')
                        : data.userContext.accountRole === 'AGENT'
                          ? t('sso.role_agent')
                          : t('sso.role_customer')}
                    </Pill>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                {(data.userContext?.accountRole === 'AGENT' || data.userContext?.accountRole === 'SUPER_AGENT') && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); go('/agent'); }}
                    className="flex h-7 items-center gap-1 rounded-full bg-white/90 px-2.5 text-[11.5px] font-semibold text-slate-800 shadow-sm"
                  >
                    <Briefcase className="size-3.5 text-[#FE810D]" />
                    {t('sso.open_agent_portal')}
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); logout(); }}
                  className="flex h-7 items-center gap-1 rounded-full bg-white/90 px-2.5 text-[11.5px] font-semibold text-slate-700 shadow-sm"
                >
                  <ArrowRightLeft className="size-3 text-slate-500" />
                  {t('sso.switch_account')}
                </button>
              </div>
            </div>
            <div className="flex w-full items-center gap-1.5">
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-[17px] font-semibold leading-[22px] text-brand">{tierLabel(p.tier?.name, p.tier?.code)} tier ›</span>
                <span className="text-[36px] font-semibold leading-[48px]">{fmt(p.currentPoints)}</span>
                <span className="text-[13px] leading-[18px] text-slate-500">available coins</span>
              </div>
              <img src={look.medal} alt="" className="size-[104px] shrink-0" />
            </div>
            <div className="h-px w-full bg-black/10" />
            <div className="flex items-center gap-2">
              <span className="min-w-0 flex-1 truncate text-[12px] leading-4 text-slate-500">{isNew ? 'Start earning today' : `${fmt(p.tierPoints)} tier pts · ${year} period`}</span>
              <button type="button" onClick={(e) => { e.stopPropagation(); go('/pay-at-counter'); }} className="flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-white px-3 text-[13px] font-semibold text-[#FE810D]">
                <QrCode className="size-4" /> Pay at counter
              </button>
            </div>
          </div>

          {/* CMS Banners · CN-06 (GET /me/home) */}
          {data.banners.length > 0 && (
            <SlideRow className="gap-3">
              {data.banners.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => b.deepLink && go(b.deepLink.startsWith('/') ? b.deepLink : '/rewards')}
                  className={`flex ${data.banners.length === 1 ? 'w-full' : 'w-[300px]'} max-w-full shrink-0 snap-start items-center gap-3 rounded-[20px] bg-gradient-to-r from-[#FFF3E3] to-[#FFE4C4] p-3.5 text-left`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-semibold text-slate-900">{b.title}</p>
                    {b.subtitle && <p className="mt-0.5 line-clamp-2 text-[12px] leading-[17px] text-slate-600">{b.subtitle}</p>}
                    {b.ctaLabel && <span className="mt-1.5 inline-block text-[12px] font-semibold text-brand">{b.ctaLabel} ›</span>}
                  </div>
                  {b.imageUrl && <img src={b.imageUrl} alt="" className="size-14 shrink-0 rounded-xl object-cover" />}
                </button>
              ))}
            </SlideRow>
          )}

          {/* Play every day · 274:1443 */}
          <SectionHeader title="Play every day" action="Games ›" onAction={() => go('/games')} />
          <SlideRow className="gap-3">
            {data.games.map((g) => (
              <button key={g.code} type="button" onClick={() => go(g.route || `/games?open=${encodeURIComponent(g.code)}`)} className="flex w-[88px] shrink-0 flex-col items-center gap-1.5">
                <span className="size-[68px] overflow-hidden rounded-[16px]">
                  <GameArt code={g.code} iconUrl={g.iconUrl} />
                </span>
                <span className="line-clamp-2 text-center text-[11px] font-medium leading-4">{g.name}</span>
              </button>
            ))}
          </SlideRow>
          {/* Coins expiring soon · 274:1341 */}
          {expiringCoins > 0 && (
            <button type="button" onClick={() => go('/coins/expiring')} className="flex w-full items-center gap-2.5 rounded-[20px] bg-[#EDF5EF] p-3.5 text-left">
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-[11px] font-medium leading-4 text-emerald-700">Coins expiring soon</span>
                <span className="text-[16px] font-semibold leading-[23px]">
                  {fmt(expiringCoins)} coins{data.expiring?.nearestExpiryDate ? ` · Use by ${ddmm(data.expiring.nearestExpiryDate)}` : ''}
                </span>
                <span className="text-[12px] leading-[17px] text-slate-500">Get a voucher before they expire.</span>
              </div>
              <img src={illTicket2} alt="" className="size-14 shrink-0" />
            </button>
          )}

          {/* Missions in progress · 274:1355 / new customer "Get started" · 330:228 */}
          {data.missions.length > 0 ? (
            <>
              <SectionHeader title="Missions in progress" action="See all ›" onAction={() => go('/missions')} />
              <SlideRow className="gap-3">
                {data.missions.map((m) => (
                  <button key={m.code} type="button" onClick={() => go(`/missions/${encodeURIComponent(m.code)}`)} className={`flex ${data.missions.length === 1 ? 'w-full' : 'w-[300px]'} max-w-full shrink-0 snap-start flex-col gap-2.5 rounded-[20px] bg-white p-3.5 text-left`}>
                    <div className="flex w-full items-center gap-2.5">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-2xl bg-brand-soft">
                        <img src={iconFuel} alt="" className="size-[15px]" />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="truncate text-[14px] font-semibold leading-5">{m.name}</span>
                        <span className="text-[11px] leading-4 text-slate-500">
                          {fmt(m.totalReward)} coins{m.toGo ? ` · ${fmt(m.toGo)} to go` : ''}
                        </span>
                      </span>
                    </div>
                    <div className="flex w-full gap-1.5">
                      {m.steps.slice(0, 3).map((s) => {
                        const done = s.status === 'COMPLETED' || s.status === 'CLAIMED';
                        return (
                          <span key={s.id} className={`flex min-w-0 flex-1 items-center justify-center gap-1 rounded-full p-1.5 ${done ? 'bg-emerald-50' : 'bg-brand-soft'}`}>
                            <img src={done ? iconCheck : iconGift} alt="" className="size-[13px]" />
                            <span className="whitespace-nowrap text-[11px] font-medium leading-[15px] text-slate-500">Goal {s.milestoneStep}</span>
                            <span className={`whitespace-nowrap text-[11px] font-semibold leading-4 ${done ? 'text-emerald-700' : 'text-brand'}`}>+{fmt(s.rewardPoints)}</span>
                          </span>
                        );
                      })}
                    </div>
                  </button>
                ))}
              </SlideRow>
            </>
          ) : (
            <button type="button" onClick={() => go('/missions')} className="flex w-full items-center gap-2.5 rounded-[20px] bg-brand-soft p-3.5 text-left">
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-[11px] font-medium leading-4 text-brand">Get started</span>
                <span className="text-[16px] font-semibold leading-[23px]">Your first mission is waiting</span>
                <span className="text-[12px] leading-[17px] text-slate-500">See open programs and conditions.</span>
              </span>
              <img src={illGift} alt="" className="size-14 shrink-0" />
            </button>
          )}

          {/* CN-01 · Home by segment — headline and call to action are set per segment in the CMS */}
          {data.segment && (data.segment.headline || data.segment.segmentName) && (
            <button
              type="button"
              onClick={() => go(data.segment?.ctaTarget?.replace(/^#/, '') || '/missions')}
              className="flex w-full items-center gap-3 rounded-[20px] bg-[#EDF5EF] p-4 text-left"
            >
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-[11px] font-medium text-brand">{data.segment.badgeText || data.segment.segmentName}</span>
                <span className="text-[18px] font-semibold leading-6">{data.segment.headline || data.segment.segmentName}</span>
                {(data.segment.subheadline || (data.segment as { description?: string }).description) && (
                  <span className="text-[12px] leading-[17px] text-slate-500">{data.segment.subheadline || (data.segment as { description?: string }).description}</span>
                )}
                <span className="text-[12px] font-semibold text-brand">{data.segment.ctaLabel || 'See missions'} ›</span>
              </span>
              <img src={illCalendar} alt="" className="size-16 shrink-0 rounded-full bg-white p-2" />
            </button>
          )}

          {/* Hot deals · 274:1428 */}
          <SectionHeader title="Hot deals" action="See all ›" onAction={() => go('/rewards')} />
          {data.deals.length === 0 ? (
            <button type="button" onClick={() => go('/rewards')} className="flex w-full items-center gap-3 rounded-[20px] bg-white p-3.5 text-left">
              <img src={dealPhoto({ partnerName: '', title: '' } as CatalogVoucherItem)} alt="" className="size-16 shrink-0 rounded-[14px] object-cover opacity-80" />
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-[15px] font-semibold">New partner deals are on the way</span>
                <span className="text-[12px] leading-[17px] text-slate-500">Open the Store to see vouchers you can get with coins.</span>
              </span>
            </button>
          ) : (
            <>
              <SlideRow className="gap-3">
                {data.deals.map((v) => {
                  const enough = (p.currentPoints || 0) >= v.pointCost;
                  return (
                    <button key={v.id} type="button" onClick={() => go(`/rewards/${v.id}`)} className="relative flex h-[150px] w-[173px] shrink-0 flex-col justify-end gap-0.5 overflow-hidden rounded-[20px] px-3.5 pb-3.5 pt-3 text-left">
                      <img src={dealPhoto(v)} alt="" className="absolute inset-0 size-full object-cover" />
                      <span className="absolute inset-0 bg-gradient-to-b from-[rgba(15,23,41,0)] from-35% to-[rgba(15,23,41,0.78)]" />
                      <span className="absolute left-3 top-3 rounded-full bg-brand px-2.5 py-1 text-[12px] font-semibold leading-[17px] text-white">
                        {enough ? '' : 'Needs '}
                        {fmt(v.pointCost)} coins
                      </span>
                      <span className="relative truncate text-[12px] font-medium leading-[17px] text-white/90">{v.partnerName}</span>
                      <span className="relative line-clamp-1 text-[20px] font-semibold leading-[29px] text-white">{v.title}</span>
                    </button>
                  );
                })}
              </SlideRow>
            </>
          )}

          {/* Tenant User Applicable Policies & Tier Perks */}
          <section className="flex flex-col gap-2.5 rounded-[20px] bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 shrink-0 text-[#FE810D]" />
              <h2 className="min-w-0 flex-1 text-[16px] font-semibold text-slate-900">{t('sso.policies_section_title')}</h2>
            </div>
            <div className="grid grid-cols-3 gap-2 rounded-[14px] bg-[#FFF8F2] p-2.5 text-center">
              <div>
                <p className="text-[15px] font-bold text-[#FE810D]">×{Number(p.tier?.pointMultiplier || 1).toFixed(2).replace(/\.00$/, '')}</p>
                <p className="text-[11px] leading-4 text-slate-500">{t('sso.policies_earn_multiplier')}</p>
              </div>
              <div>
                <p className="text-[15px] font-bold text-slate-900">{p.tier?.freeDailyTurns ?? 1}</p>
                <p className="text-[11px] leading-4 text-slate-500">{t('sso.policies_free_plays_day')}</p>
              </div>
              <div>
                <p className="text-[15px] font-bold text-slate-900">{fmt(data.userContext?.payAtCounterPinLimitHtg ?? 2000)} HTG</p>
                <p className="text-[11px] leading-4 text-slate-500">{t('sso.policies_pin_limit')}</p>
              </div>
            </div>
            {(data.userContext?.applicablePolicies || []).length > 0 && (
              <div className="flex flex-col gap-2">
                {(data.userContext?.applicablePolicies || []).map((pol: ApplicablePolicyItem, idx: number) => (
                  <div key={pol.partnerCode || idx} className="flex items-center justify-between gap-2 rounded-[12px] border border-slate-100 bg-[#FAFAFB] px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-slate-800">{pol.partnerName}</p>
                      <p className="text-[11.5px] text-slate-500">
                        {t('sso.policies_exchange_rate', { rate: pol.pointExchangeRate })} · {t('sso.policies_max_burn', { pct: pol.maxBurnPercentage })}
                      </p>
                    </div>
                    <Pill tone="green">{fmt(pol.maxBurnPointsPerTx)} max</Pill>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Personalized Recommendations tailored to user's Tier, Role, Segment & Coins */}
          {(((data.userContext?.recommendedVouchers || []).length > 0) || ((data.userContext?.recommendedMissions || []).length > 0)) && (
            <section className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 shrink-0 text-[#FE810D]" />
                <h2 className="min-w-0 flex-1 text-[18px] font-semibold leading-[26px] text-slate-900">{t('sso.recommended_section_title')}</h2>
              </div>

              {(data.userContext?.recommendedVouchers || []).length > 0 && (
                <>
                  <p className="-mt-1.5 text-[12px] text-slate-500">{t('sso.recommended_vouchers_sub')}</p>
                  <SlideRow className="gap-3">
                    {(data.userContext?.recommendedVouchers || []).map((rv: RecommendedVoucherItem) => (
                      <button
                        key={rv.id}
                        type="button"
                        onClick={() => go(`/rewards/${rv.id}`)}
                        className="flex w-[224px] shrink-0 flex-col justify-between gap-2 rounded-[18px] bg-white p-3.5 text-left shadow-[0_2px_12px_rgba(0,0,0,0.05)]"
                      >
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="truncate text-[11px] font-semibold text-slate-500">{rv.partnerName}</span>
                            <Pill tone={rv.freeCollect ? 'green' : rv.affordable ? 'orange' : 'grey'}>
                              {rv.freeCollect ? 'Free' : `${fmt(rv.pointCost)} ${t('sso.coins_short')}`}
                            </Pill>
                          </div>
                          <p className="line-clamp-2 text-[14px] font-semibold leading-5 text-slate-900">{rv.title}</p>
                        </div>
                        {rv.matchReason && (
                          <span className="inline-flex w-fit items-center gap-1 rounded-full bg-[#FFF4EA] px-2.5 py-0.5 text-[11px] font-medium text-[#E06C00]">
                            <CoinDot className="size-3" /> {rv.matchReason}
                          </span>
                        )}
                      </button>
                    ))}
                  </SlideRow>
                </>
              )}

              {(data.userContext?.recommendedMissions || []).length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-[12px] text-slate-500">{t('sso.recommended_missions_sub')}</p>
                  {(data.userContext?.recommendedMissions || []).slice(0, 3).map((rm: RecommendedMissionItem) => (
                    <button
                      key={rm.milestoneId}
                      type="button"
                      onClick={() => go(`/missions/${encodeURIComponent(rm.campaignCode)}`)}
                      className="flex w-full items-center justify-between gap-3 rounded-[16px] bg-white p-3.5 text-left shadow-[0_2px_10px_rgba(0,0,0,0.04)]"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-[14px] font-semibold text-slate-900">{rm.campaignName}</span>
                          {rm.matchReason && <Pill tone={rm.status === 'COMPLETED' ? 'green' : 'orange'}>{rm.matchReason}</Pill>}
                        </div>
                        <p className="mt-0.5 text-[12px] text-slate-500">
                          {fmt(rm.currentProgress)} / {fmt(rm.targetValue)} · +{fmt(rm.rewardPoints)} {t('sso.coins_short')}
                        </p>
                      </div>
                      <span className="text-slate-400">›</span>
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}

        </>
      )}
      <Popup open={!!reminder} onClose={() => setReminder(null)}>
        {reminder && (
          <>
            <img src={reminder.art} alt="" className="size-24 object-contain" />
            <h2 className="text-[19px] font-semibold">{reminder.title}</h2>
            <p className="text-[13px] leading-5 text-slate-500">{reminder.text}</p>
            <div className="mt-2 flex w-full flex-col gap-2">
              <PrimaryButton onClick={() => { setReminder(null); go(reminder.to); }}>{reminder.cta}</PrimaryButton>
              <SecondaryButton onClick={() => setReminder(null)}>Later</SecondaryButton>
            </div>
          </>
        )}
      </Popup>
    </Screen>
  );
};

export default LoyaltyHome;
