import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LoyaltyApi,
  getDefaultUserId,
  type ExpiringBucketItem,
  type ExpiringBucketsResponse,
  type LedgerItem,
  type MemberProfile,
} from '../../services/api';
import { Screen, Skeleton, ErrorBlock, fmt, ddmmyyyy } from '../ui';
import iconCalendar from '../../assets/figma/icon-calendar-days.svg';
import iconTicket from '../../assets/figma/icon-ticket.svg';
import iconFuel from '../../assets/figma/icon-fuel-green.svg';

const PAGE = 20;

const monthTitle = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

const rowIcon = (item: LedgerItem) => {
  if (item.pointChange < 0) return { src: iconTicket, bg: 'bg-brand-soft' };
  if (/check.?in|streak/i.test(`${item.changeType} ${item.description}`)) return { src: iconCalendar, bg: 'bg-emerald-50' };
  return { src: iconFuel, bg: 'bg-emerald-50' };
};

const daysLeft = (iso: string) => Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);

/** DT-01 · Coins history (Figma 274:2420); with `sheet` the FIFO batch sheet (495:1294) opens on top. */
export const CoinsHistory: React.FC<{ sheet?: boolean }> = ({ sheet = false }) => {
  const navigate = useNavigate();
  const userId = getDefaultUserId();
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [expiring, setExpiring] = useState<ExpiringBucketsResponse | null>(null);
  const [items, setItems] = useState<LedgerItem[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    setFailed(false);
    try {
      const [p, e, l] = await Promise.all([
        LoyaltyApi.getProfile(userId),
        LoyaltyApi.getExpiringBuckets(userId).catch(() => null),
        LoyaltyApi.getPointLedger(userId, 0, PAGE),
      ]);
      setProfile(p);
      setExpiring(Array.isArray(e) ? null : e);
      setItems(l.items || []);
      setTotal(l.totalElements || 0);
      setPage(0);
    } catch {
      setFailed(true);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const loadMore = async () => {
    const next = page + 1;
    const l = await LoyaltyApi.getPointLedger(userId, next, PAGE).catch(() => null);
    if (!l) return;
    setItems((prev) => [...(prev || []), ...(l.items || [])]);
    setPage(next);
  };

  const months: [string, LedgerItem[]][] = [];
  (items || []).forEach((it) => {
    const m = monthTitle(it.createdAt);
    const last = months[months.length - 1];
    if (last && last[0] === m) last[1].push(it);
    else months.push([m, [it]]);
  });

  const buckets: ExpiringBucketItem[] = (expiring?.buckets || [])
    .filter((b) => b.assetType !== 'TIER_POINT' && b.remainingPoints > 0)
    .sort((a, b) => a.expiredAt.localeCompare(b.expiredAt));

  return (
    <Screen title="Coins history" back="/">
      <h2 className="text-[22px] font-semibold leading-8">Coins history</h2>
      {failed && <ErrorBlock onRetry={load} />}
      {!profile && !failed && <Skeleton className="h-[170px]" />}

      {profile && (
        <button type="button" onClick={() => navigate('/coins/expiring')} className="flex w-full flex-col gap-3 rounded-[20px] bg-brand-soft p-5 text-left">
          <span className="text-[12px] leading-[17px] text-slate-500">Available coins</span>
          <span className="text-[32px] font-semibold leading-[46px]">{fmt(profile.currentPoints)} coins</span>
          <span className="h-px w-full bg-slate-200" />
          <span className="text-[12px] font-medium leading-[17px] text-brand">
            {expiring?.totalExpiringPoints
              ? `${fmt(expiring.totalExpiringPoints)} coins expire on ${ddmmyyyy(expiring.nearestExpiryDate)}`
              : 'No coins expiring soon · see batches ›'}
          </span>
        </button>
      )}

      {items && items.length === 0 && (
        <div className="rounded-[20px] bg-white p-5 text-center">
          <p className="text-[15px] font-medium">No coin activity yet</p>
          <p className="mt-1 text-[12px] text-slate-500">Complete a mission or pay with Natcash to earn your first coins.</p>
        </div>
      )}

      {months.map(([month, rows]) => (
        <React.Fragment key={month}>
          <h3 className="text-[18px] font-semibold leading-[26px]">{month}</h3>
          {rows.map((it) => {
            const ic = rowIcon(it);
            const plus = it.pointChange >= 0;
            return (
              <div key={it.id} className="flex w-full flex-col gap-2.5 rounded-[20px] bg-white p-4">
                <span className="text-[11px] leading-4 text-slate-500">{ddmmyyyy(it.createdAt)}</span>
                <div className="flex items-center gap-2.5">
                  <span className={`flex size-9 shrink-0 items-center justify-center rounded-[18px] ${ic.bg}`}>
                    <img src={ic.src} alt="" className="size-[17px]" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-[5px]">
                    <span className="text-[15px] font-medium leading-[22px]">{it.description || it.changeType}</span>
                    <span className={`text-[21px] font-semibold leading-[30px] ${plus ? 'text-emerald-700' : 'text-brand'}`}>
                      {plus ? '+' : '−'}
                      {fmt(Math.abs(it.pointChange))} coins
                    </span>
                  </span>
                </div>
                <span className="text-[12px] leading-[17px] text-slate-500">
                  {it.referenceCode ? `${it.referenceCode} · ` : ''}
                  {plus ? 'Credited' : 'Completed'}
                </span>
              </div>
            );
          })}
        </React.Fragment>
      ))}

      {items && items.length < total && (
        <button type="button" onClick={loadMore} className="h-11 rounded-[14px] border border-slate-200 bg-white text-[14px] font-semibold">
          Load more
        </button>
      )}

      {sheet && (
        <div className="fixed inset-0 z-40 flex flex-col justify-end" role="dialog" aria-label="Coins by batch">
          <button type="button" aria-label="Close" onClick={() => navigate('/coins')} className="absolute inset-0 bg-slate-900/45" />
          <div className="relative mx-auto flex max-h-[85vh] w-full max-w-[430px] flex-col gap-3 overflow-y-auto rounded-t-[24px] bg-white px-5 pb-6 pt-2.5">
            <span className="mx-auto h-1 w-10 rounded-sm bg-slate-300" />
            <h2 className="mt-2 text-[19px] font-semibold">Coins by batch</h2>
            <p className="text-[13px] text-slate-500">Oldest coins are used first (FIFO). Each batch expires 12 months after you receive it.</p>
            {buckets.length === 0 && <p className="rounded-[14px] bg-page p-3.5 text-[13px] text-slate-500">You have no coin batches yet.</p>}
            {buckets.map((b, i) => {
              const d = daysLeft(b.expiredAt);
              return (
                <div key={b.bucketId} className="flex items-start gap-2 rounded-[14px] bg-page p-3.5">
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="text-[16px] font-semibold">{fmt(b.remainingPoints)} coins</span>
                    <span className="text-[12px] text-slate-500">
                      Received {ddmmyyyy(b.earnedAt)} · Expires {ddmmyyyy(b.expiredAt)}
                    </span>
                  </div>
                  {i === 0 && d <= 30 && (
                    <span className="rounded-xl bg-[#FDE2E1] px-2.5 py-1 text-[11px] font-semibold text-[#C0392B]">Expires in {Math.max(d, 0)} days</span>
                  )}
                  {((i === 0 && d > 30) || (i === 1 && daysLeft(buckets[0].expiredAt) <= 30)) && (
                    <span className="rounded-xl bg-[#FFF3E0] px-2.5 py-1 text-[11px] font-semibold text-[#B35400]">Next</span>
                  )}
                </div>
              );
            })}
            <button type="button" onClick={() => navigate('/rewards')} className="mt-2 h-[46px] rounded-[14px] bg-brand text-[14px] font-semibold text-white">
              Use coins before they expire
            </button>
          </div>
        </div>
      )}
    </Screen>
  );
};

export default CoinsHistory;
