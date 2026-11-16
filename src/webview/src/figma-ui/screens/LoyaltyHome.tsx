import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LoyaltyApi,
  getDefaultUserId,
  type CatalogVoucherItem,
  type ExpiringBucketsResponse,
  type MemberProfile,
  type MilestoneItem,
} from '../../services/api';
import { GameArt } from '../GameArt';
import { Screen, SectionHeader, Skeleton, ErrorBlock, SlideRow, fmt, ddmm } from '../ui';
import { tierLook, tierLabel } from '../tiers';
import { normMilestone } from '../data';
import { loadGames, type GameEntry } from '../games';
import { partnerPhoto } from '../art';
import type { SegmentProfileResponse } from '../../services/api';
import iconHistory from '../../assets/figma/icon-history.svg';
import iconBell from '../../assets/figma/icon-bell.svg';
import illCalendar from '../../assets/figma/ill-calendar-gold.svg';
import illTicket from '../../assets/figma/ill-ticket-gold.svg';
import illGame from '../../assets/figma/ill-game.svg';
import illShop from '../../assets/figma/ill-shop-gold.svg';
import illTicket2 from '../../assets/figma/ill-ticket-gold-2.svg';
import illGift from '../../assets/figma/ill-gift-gold.svg';
import iconFuel from '../../assets/figma/icon-fuel.svg';
import iconCheck from '../../assets/figma/icon-check.svg';
import iconGift from '../../assets/figma/icon-gift.svg';
import iconUsers from '../../assets/figma/icon-users.svg';

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
}

export const LoyaltyHome: React.FC = () => {
  const navigate = useNavigate();
  const go = (path: string) => navigate(path);
  const userId = getDefaultUserId();
  const [data, setData] = useState<HomeData | null>(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    setFailed(false);
    try {
      const [profile, ms, expiring, deals, refs, games, segment] = await Promise.all([
        LoyaltyApi.getProfile(userId),
        LoyaltyApi.getMilestones(userId).catch(() => ({ milestones: [] as unknown[] })),
        LoyaltyApi.getExpiringBuckets(userId).catch(() => null),
        LoyaltyApi.getVoucherCatalog().catch(() => [] as CatalogVoucherItem[]),
        LoyaltyApi.getMyReferrals(userId).catch(() => null),
        loadGames(),
        LoyaltyApi.getSegmentProfile(userId).catch(() => null), // CN-01 · content for the member's segment
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
      });
    } catch {
      setFailed(true);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const p = data?.profile;
  const look = tierLook(p?.tier?.code);
  const isNew = !!p && !p.currentPoints && !p.tierPoints && !data?.missions.length;
  const expiringCoins = data?.expiring?.totalExpiringPoints || 0;
  const year = useMemo(() => new Date().getFullYear(), []);

  return (
    <Screen title="Rewards">
      <div className="flex w-full items-center gap-2">
        <p className="min-w-0 flex-1 text-[14px] font-medium leading-5 text-slate-500">{isNew ? 'Your journey starts here' : 'Your benefits'}</p>
        <button type="button" aria-label="Coins history" onClick={() => go('/coins')} className="flex size-11 items-center justify-center">
          <img src={iconHistory} alt="" className="size-5" />
        </button>
        <button type="button" aria-label="Inbox" onClick={() => go('/inbox')} className="flex size-11 items-center justify-center">
          <img src={iconBell} alt="" className="size-5" />
        </button>
      </div>

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
          {/* Member card · HV-02 274:1272 */}
          <button type="button" onClick={() => go('/tiers')} className="flex w-full flex-col gap-2 rounded-[20px] p-4 text-left" style={{ background: look.cardBg }}>
            <div className="flex w-full items-center gap-1.5">
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-[17px] font-semibold leading-[17px] text-brand">{tierLabel(p.tier?.name, p.tier?.code)} tier ›</span>
                <span className="text-[36px] font-semibold leading-[52px]">{fmt(p.currentPoints)}</span>
                <span className="text-[12px] leading-[17px] text-slate-500">available coins</span>
              </div>
              <img src={look.medal} alt="" className="size-[112px] shrink-0" />
            </div>
            <div className="h-px w-full bg-slate-200" />
            <span className="text-[11px] leading-4 text-slate-500">
              {isNew ? 'Start earning today' : `${fmt(p.tierPoints)} tier pts · ${year} period`}
            </span>
          </button>

          {/* Quick actions · 274:1296 */}
          <div className="grid w-full grid-cols-4 gap-2.5">
            {[
              { ill: illCalendar, label: 'Check-in', to: '/checkin' },
              { ill: illTicket, label: 'Redeem', to: '/rewards' },
              { ill: illGame, label: 'Games', to: '/games' },
              { ill: illShop, label: 'Use coins', to: '/use-coins' },
            ].map((a) => (
              <button key={a.label} type="button" onClick={() => go(a.to)} className="flex flex-col items-center gap-1">
                <img src={a.ill} alt="" className="size-[52px]" />
                <span className="text-center text-[11px] font-medium leading-4">{a.label}</span>
              </button>
            ))}
          </div>

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

          {/* Coins expiring soon · 274:1341 */}
          {expiringCoins > 0 && (
            <button type="button" onClick={() => go('/coins/expiring')} className="flex w-full items-center gap-2.5 rounded-[20px] bg-[#EDF5EF] p-3.5 text-left">
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-[11px] font-medium leading-4 text-emerald-700">Coins expiring soon</span>
                <span className="text-[16px] font-semibold leading-[23px]">
                  {fmt(expiringCoins)} coins{data.expiring?.nearestExpiryDate ? ` · Use by ${ddmm(data.expiring.nearestExpiryDate)}` : ''}
                </span>
                <span className="text-[12px] leading-[17px] text-slate-500">Redeem a reward before they expire.</span>
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
                  <button key={m.code} type="button" onClick={() => go(`/missions/${encodeURIComponent(m.code)}`)} className="flex w-[358px] max-w-full shrink-0 snap-start flex-col gap-2.5 rounded-[20px] bg-white p-3.5 text-left">
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

          {/* Invite friends · pinned, always on · 545:923 */}
          <button type="button" onClick={() => go('/invite')} className="flex w-full flex-col gap-2 rounded-[20px] bg-brand-soft p-4 text-left">
            <span className="flex w-full items-center gap-2.5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-[20px] bg-white">
                <img src={iconUsers} alt="" className="size-[19px]" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-[15px] font-semibold leading-[22px]">Invite friends</span>
                <span className="text-[12px] leading-[17px] text-slate-500">
                  Always on{data.referralReward ? ` · you +${fmt(data.referralReward)} coins per friend` : ''} · {data.referralCount} joined
                </span>
              </span>
            </span>
            <span className="text-[12px] font-semibold leading-[17px] text-brand">Invite &amp; track ›</span>
          </button>

          {/* Hot deals · 274:1428 */}
          <SectionHeader title="Hot deals" action="See all ›" onAction={() => go('/rewards')} />
          {data.deals.length === 0 ? (
            <button type="button" onClick={() => go('/rewards')} className="flex w-full items-center gap-3 rounded-[20px] bg-white p-3.5 text-left">
              <img src={dealPhoto({ partnerName: '', title: '' } as CatalogVoucherItem)} alt="" className="size-16 shrink-0 rounded-[14px] object-cover opacity-80" />
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-[15px] font-semibold">New partner deals are on the way</span>
                <span className="text-[12px] leading-[17px] text-slate-500">Browse the Reward store to see what you can redeem with coins.</span>
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
        </>
      )}
    </Screen>
  );
};

export default LoyaltyHome;
