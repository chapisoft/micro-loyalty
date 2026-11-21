import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LoyaltyApi, getDefaultUserId, type ExpiringBucketItem, type ExpiringBucketsResponse, type LedgerItem, type MemberProfile } from '../../services/api';
import { toDateLocale } from '../../language';
import { CalendarCheck, Fuel, Gamepad2, Gift, Hourglass, Ticket, Users } from 'lucide-react';
import { Screen, Skeleton, ErrorBlock, CoinDot, Empty, fmt, ddmmyyyy } from '../ui';
import { artEmptyBox } from '../art';

const PAGE = 20;

const monthTitle = (iso: string, lng?: string) => new Date(iso).toLocaleDateString(toDateLocale(lng), { month: 'long', year: 'numeric' });

const hhmm = (iso: string, lng?: string) => new Date(iso).toLocaleTimeString(toDateLocale(lng), { hour: '2-digit', minute: '2-digit' });

// Figma DT-01 row icons: colour by what the coins came from
const rowIcon = (item: LedgerItem) => {
  const s = `${item.changeType} ${item.description}`;
  if (isExpiry(item)) return { Icon: Hourglass, bg: 'bg-slate-100', fg: 'text-slate-500' };
  if (item.pointChange < 0) return { Icon: Ticket, bg: 'bg-[#FFF3E6]', fg: 'text-[#FF8600]' };
  if (/check.?in|streak/i.test(s)) return { Icon: CalendarCheck, bg: 'bg-emerald-50', fg: 'text-emerald-600' };
  if (/invite|refer|friend/i.test(s)) return { Icon: Users, bg: 'bg-blue-50', fg: 'text-blue-600' };
  if (/wheel|spin|game|scratch|play|tr[oò] ch[oơ]i|v[oò]ng quay/i.test(s)) return { Icon: Gamepad2, bg: 'bg-violet-50', fg: 'text-violet-600' };
  if (/mission|goal|milestone|fuel|payment/i.test(s)) return { Icon: Fuel, bg: 'bg-sky-50', fg: 'text-sky-600' };
  return { Icon: Gift, bg: 'bg-[#FFF3E6]', fg: 'text-[#FF8600]' };
};

type LedgerTab = 'earned' | 'used' | 'expired';
const isExpiry = (it: LedgerItem) => /EXPIR/i.test(it.changeType);
const tabOf = (it: LedgerItem): LedgerTab => (isExpiry(it) ? 'expired' : it.pointChange >= 0 ? 'earned' : 'used');

const daysLeft = (iso: string) => Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);

/** DT-01 · Coins history (Figma 274:2420); with `sheet` the FIFO batch sheet (495:1294) opens on top. */
export const CoinsHistory: React.FC<{ sheet?: boolean }> = ({ sheet = false }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const userId = getDefaultUserId();
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [expiring, setExpiring] = useState<ExpiringBucketsResponse | null>(null);
  const [items, setItems] = useState<LedgerItem[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [failed, setFailed] = useState(false);
  const [tab, setTab] = useState<LedgerTab>('earned');

  const load = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      setExpiring(null);
      setItems([]);
      setTotal(0);
      setFailed(false);
      return;
    }
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
  (items || []).filter((it) => tabOf(it) === tab).forEach((it) => {
    const m = monthTitle(it.createdAt, i18n.language);
    const last = months[months.length - 1];
    if (last && last[0] === m) last[1].push(it);
    else months.push([m, [it]]);
  });

  const buckets: ExpiringBucketItem[] = (expiring?.buckets || [])
    .filter((b) => b.assetType !== 'TIER_POINT' && b.remainingPoints > 0)
    .sort((a, b) => a.expiredAt.localeCompare(b.expiredAt));

  const todayKey = new Date().toDateString();
  const earnedToday = (items || [])
    .filter((it) => it.pointChange > 0 && !isExpiry(it) && new Date(it.createdAt).toDateString() === todayKey)
    .reduce((s, it) => s + it.pointChange, 0);
  const comingUp = buckets.find((b) => daysLeft(b.expiredAt) <= 30);

  return (
    <Screen title={t('figma_ui.coins_history.title')}>
      {!userId ? (
        <Empty art={artEmptyBox} title={t('sso.guest_login_required')} text={t('sso.guest_login_required_desc')} />
      ) : (
        <>
          {/* Figma DT-01 (274:2420 · 720:3): white page, balance + Earn more, underline tabs, grey month bands, plain rows */}
          <div className="-mx-4 -mb-8 -mt-4 min-h-[calc(100vh-52px)] bg-white pb-8">
            {failed && <div className="p-4"><ErrorBlock onRetry={load} /></div>}
            {!profile && !failed && <div className="p-4"><Skeleton className="h-[110px]" /></div>}

        {profile && (
          <div className="flex items-start gap-3 px-4 pb-4 pt-3">
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="flex items-center gap-2 text-[28px] font-bold leading-9 text-slate-900">
                <CoinDot className="size-8" /> {fmt(profile.currentPoints)}
              </span>
              {earnedToday > 0 && (
                <span className="text-[14px] text-slate-700">
                  {t('figma_ui.coins_history.got_today_prefix')}
                  <b className="font-semibold text-[#FF8600]">{t('figma_ui.coins_history.got_today_highlight', { coins: fmt(earnedToday) })}</b>
                  {t('figma_ui.coins_history.got_today_suffix')}
                </span>
              )}
              <button type="button" onClick={() => navigate('/coins/expiring')} className="w-fit text-left text-[13px] font-medium text-[#FF8600]">
                {expiring?.totalExpiringPoints
                  ? t('figma_ui.coins_history.expire_on', { coins: fmt(expiring.totalExpiringPoints), date: ddmmyyyy(expiring.nearestExpiryDate) })
                  : t('figma_ui.coins_history.no_expiring_see_batches')}
              </button>
            </div>
            <button type="button" onClick={() => navigate('/missions')} className="h-10 shrink-0 rounded-[12px] bg-[#FF8600] px-4 text-[15px] font-semibold text-white">
              {t('figma_ui.coins_history.earn_more')}
            </button>
          </div>
        )}

        {items && (
          <div className="grid grid-cols-3 border-b border-slate-200">
            {(['earned', 'used', 'expired'] as LedgerTab[]).map((k) => (
              <button key={k} type="button" onClick={() => setTab(k)} className={`relative h-11 text-[16px] ${tab === k ? 'font-semibold text-[#FF8600]' : 'text-slate-600'}`}>
                {k === 'earned' ? t('figma_ui.coins_history.tab_earned') : k === 'used' ? t('figma_ui.coins_history.tab_used') : t('figma_ui.coins_history.tab_expired')}
                {tab === k && <span className="absolute inset-x-[22%] bottom-0 h-0.5 rounded-full bg-[#FF8600]" />}
              </button>
            ))}
          </div>
        )}

        {items && tab === 'expired' && (
          <>
            <p className="bg-[#FFF3E6] px-4 py-2.5 text-[13px] leading-[18px] text-slate-700">
              {t('figma_ui.coins_history.fifo_banner')}
            </p>
            {comingUp && (
              <>
                <h3 className="bg-[#F1F5F9] px-4 py-2.5 text-[15px] font-semibold">{t('figma_ui.coins_history.coming_up')}</h3>
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#FFE9D6]"><Hourglass className="size-5 text-[#FF8600]" /></span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-[15px] font-medium leading-5">{t('figma_ui.coins_history.coins_expire_on', { coins: fmt(comingUp.remainingPoints), date: ddmmyyyy(comingUp.expiredAt) })}</span>
                    <span className="text-[13px] text-slate-500">{t('figma_ui.coins_history.received_on', { date: ddmmyyyy(comingUp.earnedAt) })}</span>
                    <button type="button" onClick={() => navigate('/rewards')} className="w-fit text-[13px] font-semibold text-[#FF8600]">{t('figma_ui.coins_history.use_now')}</button>
                  </span>
                  <span className="shrink-0 text-[15px] font-semibold text-[#FF8600]">−{t('figma_ui.coins_history.amount_coins', { coins: fmt(comingUp.remainingPoints) })}</span>
                </div>
              </>
            )}
          </>
        )}

        {items && items.length > 0 && months.length === 0 && !(tab === 'expired' && comingUp) && (
          <p className="px-4 py-8 text-center text-[13px] text-slate-500">
            {tab === 'expired' ? t('figma_ui.coins_history.empty_expired') : tab === 'used' ? t('figma_ui.coins_history.empty_used') : t('figma_ui.coins_history.empty_earned_page')}
          </p>
        )}

        {items && items.length === 0 && (
          <div className="px-4 py-8 text-center">
            <p className="text-[15px] font-medium">{t('figma_ui.coins_history.empty_title')}</p>
            <p className="mt-1 text-[13px] text-slate-500">{t('figma_ui.coins_history.empty_sub')}</p>
          </div>
        )}

        {months.map(([month, rows]) => (
          <React.Fragment key={month}>
            <h3 className="bg-[#F1F5F9] px-4 py-2.5 text-[15px] font-semibold">{month}</h3>
            {rows.map((it, i) => {
              const ic = rowIcon(it);
              const expired = isExpiry(it);
              const plus = it.pointChange >= 0;
              return (
                <div key={it.id} className={`mx-4 flex items-center gap-3 py-3.5 ${i ? 'border-t border-slate-100' : ''}`}>
                  <span className={`flex size-11 shrink-0 items-center justify-center rounded-full ${ic.bg}`}>
                    <ic.Icon className={`size-5 ${ic.fg}`} />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="line-clamp-2 text-[15px] font-medium leading-5">{expired ? t('figma_ui.coins_history.coins_expired_row') : it.description || it.changeType}</span>
                    <span className="text-[13px] text-slate-500">
                      {expired
                        ? t('figma_ui.coins_history.from_earlier', { source: it.description || t('figma_ui.coins_history.earlier_rewards') })
                        : `${hhmm(it.createdAt, i18n.language)} · ${ddmmyyyy(it.createdAt)}`}
                    </span>
                  </span>
                  <span className={`shrink-0 text-[15px] font-semibold ${expired ? 'text-slate-500' : plus ? 'text-[#FF8600]' : 'text-slate-900'}`}>
                    {plus ? '+' : '−'}
                    {t('figma_ui.coins_history.amount_coins', { coins: fmt(Math.abs(it.pointChange)) })}
                  </span>
                </div>
              );
            })}
          </React.Fragment>
        ))}

        {items && items.length < total && (
          <div className="px-4 pt-3">
            <button type="button" onClick={loadMore} className="h-11 w-full rounded-[12px] border border-slate-200 bg-white text-[14px] font-semibold">
              {t('figma_ui.coins_history.load_more')}
            </button>
          </div>
        )}
      </div>

      {sheet && (
        <div className="fixed inset-0 z-40 flex flex-col justify-end" role="dialog" aria-label={t('figma_ui.coins_history.batch_sheet_title')}>
          <button type="button" aria-label={t('figma_ui.common.close')} onClick={() => navigate('/coins')} className="absolute inset-0 bg-slate-900/45" />
          <div className="relative mx-auto flex max-h-[85vh] w-full max-w-[430px] flex-col gap-3 overflow-y-auto rounded-t-[24px] bg-white px-5 pb-6 pt-2.5">
            <span className="mx-auto h-1 w-10 rounded-sm bg-slate-300" />
            <h2 className="mt-2 text-[19px] font-semibold">{t('figma_ui.coins_history.batch_sheet_title')}</h2>
            <p className="text-[13px] text-slate-500">{t('figma_ui.coins_history.batch_sheet_desc')}</p>
            {buckets.length === 0 && <p className="rounded-[14px] bg-page p-3.5 text-[13px] text-slate-500">{t('figma_ui.coins_history.batch_empty')}</p>}
            {buckets.map((b, i) => {
              const d = daysLeft(b.expiredAt);
              return (
                <div key={b.bucketId} className="flex items-start gap-2 rounded-[14px] bg-page p-3.5">
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="text-[16px] font-semibold">{t('figma_ui.coins_history.amount_coins', { coins: fmt(b.remainingPoints) })}</span>
                    <span className="text-[12px] text-slate-500">
                      {t('figma_ui.coins_history.batch_dates', { earned: ddmmyyyy(b.earnedAt), expired: ddmmyyyy(b.expiredAt) })}
                    </span>
                  </div>
                  {i === 0 && d <= 30 && (
                    <span className="rounded-xl bg-[#FDE2E1] px-2.5 py-1 text-[11px] font-semibold text-[#C0392B]">
                      {t('figma_ui.coins_history.expires_in_days', { days: Math.max(d, 0) })}
                    </span>
                  )}
                  {((i === 0 && d > 30) || (i === 1 && daysLeft(buckets[0].expiredAt) <= 30)) && (
                    <span className="rounded-xl bg-[#FFF3E0] px-2.5 py-1 text-[11px] font-semibold text-[#B35400]">
                      {t('figma_ui.coins_history.next_badge')}
                    </span>
                  )}
                </div>
              );
            })}
            <button type="button" onClick={() => navigate('/rewards')} className="mt-2 h-[46px] rounded-[14px] bg-brand text-[14px] font-semibold text-white">
              {t('figma_ui.coins_history.use_before_expire')}
            </button>
          </div>
        </div>
      )}
        </>
      )}
    </Screen>
  );
};

export default CoinsHistory;
