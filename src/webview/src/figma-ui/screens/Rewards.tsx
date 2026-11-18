import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Search, SlidersHorizontal, Lock, CalendarDays } from 'lucide-react';
import {
  LoyaltyApi,
  getDefaultUserId,
  type CatalogVoucherItem,
  type UserVoucherItem,
  type VoucherAcquireType,
  type VoucherUsageType,
} from '../../services/api';
import { LoyaltyJSBridge } from '../../bridge/LoyaltyJSBridge';
import { generateBarcode128Svg } from '../../utils/barcode128';
import {
  Screen, Hero, Segmented, Chip, ListCard, Toast, useToast, Popup, Sheet, Skeleton, ErrorBlock, Empty, PrimaryButton, SecondaryButton,
  SlideRow, CoinDot, useLoad, fmt, ddmmyyyy, voucherBase, type Shell,
} from '../ui';
import { QrCode } from '../qr';
import { artGift, artHourglass, artEmptyBox, partnerPhoto, aiGift } from '../art';

const uid = () => getDefaultUserId();

export const cleanBrand = (raw?: string) =>
  (raw || 'Natcom')
    .replace(/\s*\(.*?\)/g, '')
    .replace(/\s+(Telecom|Mobile E-Wallet|Supermarket|Store|Group).*$/i, '')
    .trim() || 'Natcom';

const nice = (s: string) => s.replace(/[_-]/g, ' ').toLowerCase().replace(/^./, (c) => c.toUpperCase());
const isData = (t: string) => /\d+\s*(GB|MB)\b/i.test(t);

/** Older payloads have no acquireType: a 0-coin voucher is free to collect. "Given" vouchers never show in the Store. */
export const acquireOf = (v: CatalogVoucherItem): VoucherAcquireType => v.acquireType || (Number(v.pointCost) === 0 ? 'FREE_COLLECT' : 'COINS');
/** Missing usageType = partner code (the only flow older vouchers had). */
export const usageOf = (v: { usageType?: VoucherUsageType }): VoucherUsageType => v.usageType || 'PARTNER_CODE';

/** Card title is the value ("50 HTG off", "5 GB data"); the condition goes on the next line (Figma MoMo-style card). */
export const valueTitle = (v: CatalogVoucherItem) => {
  const gb = v.title.match(/(\d+\s*(?:GB|MB))/i);
  if (gb) return `${gb[1].toUpperCase().replace(/(\d+)\s*([A-Z]+)/, '$1 $2')} data`;
  if (/PERCENT/i.test(v.discountType) && v.discountValue) return `${v.discountValue}% off`;
  if (v.discountValue) return `${fmt(v.discountValue)} HTG off`;
  return v.title;
};
const condition = (v: CatalogVoucherItem) => (v.minBillAmount ? `Bills from ${fmt(v.minBillAmount)} HTG` : v.title !== valueTitle(v) ? v.title : v.description || '');
const photoOf = (v: { imageUrl?: string; partnerName?: string; title: string }) => v.imageUrl || partnerPhoto(`${v.partnerName} ${v.title}`);

type UState = 'ready' | 'pending' | 'used' | 'expired';
export const userState = (v: UserVoucherItem): UState =>
  /USED|REDEEMED/i.test(v.status) ? 'used' : /EXPIRED/i.test(v.status) ? 'expired' : /PENDING|ISSUING|PROCESSING|AWAIT/i.test(v.status) ? 'pending' : 'ready';

const audienceOf = (shell: Shell): 'CUSTOMER' | 'AGENT' | 'SUPER_AGENT' => (shell === 'super' ? 'SUPER_AGENT' : shell === 'agent' ? 'AGENT' : 'CUSTOMER');

const howToUse: Record<VoucherUsageType, string> = {
  NATCASH_STORE: 'Tap Use, then show your Natcash code at the counter. The cashier scans it and applies this voucher to the bill.',
  PARTNER_CODE: 'Tap Use and show the QR or barcode to the cashier. The partner’s POS scans it; the cashier can also type the code.',
  ONLINE: 'Tap Use to open the Natcash payment screen with this voucher already applied.',
};

/** Use, by the voucher's "How to use" (Figma 18/11): at store → Pay at counter with the voucher picked; partner code → show code; online → service checkout. */
export const openUse = (navigate: ReturnType<typeof useNavigate>, shell: Shell, v: UserVoucherItem) => {
  const u = usageOf(v);
  if (u === 'NATCASH_STORE') navigate(`/pay-at-counter?voucher=${v.id}`);
  else if (u === 'ONLINE') LoyaltyJSBridge.openService(v.serviceLink || '', v.redemptionCode || v.code);
  else navigate(`${voucherBase(shell).mine}/${v.id}/code`);
};

const PricePill: React.FC<{ coins: number }> = ({ coins }) => (
  <span className="flex h-8 items-center gap-1 rounded-full bg-[#FE810D] pl-1.5 pr-3 text-[14px] font-bold text-white">
    <CoinDot className="size-[20px]" /> {fmt(coins)}
  </span>
);
const ActionPill: React.FC<{ kind: 'collect' | 'use' | 'locked' | 'gone'; onClick?: () => void; small?: boolean }> = ({ kind, onClick, small }) => {
  const base = `flex ${small ? 'h-7 px-3 text-[13px]' : 'h-8 px-3.5 text-[14px]'} items-center gap-1 whitespace-nowrap rounded-full font-semibold`;
  if (kind === 'collect') return <button type="button" onClick={onClick} className={`${base} border border-[#FE810D] bg-white text-[#FE810D]`}>Collect</button>;
  if (kind === 'use') return <button type="button" onClick={onClick} className={`${base} bg-[#FE810D] text-white`}>Use</button>;
  if (kind === 'locked') return <span className={`${base} bg-slate-100 text-slate-500`}><Lock className="size-3.5" /> Locked</span>;
  return <span className={`${base} bg-slate-100 text-slate-500`}>All gone</span>;
};
const Tag: React.FC<{ tone: 'orange' | 'green' | 'purple' | 'grey'; children: React.ReactNode }> = ({ tone, children }) => (
  <span className={`truncate rounded-full px-2 py-0.5 text-[11.5px] font-semibold ${{ orange: 'bg-[#FFF1E3] text-[#E06C00]', green: 'bg-emerald-50 text-emerald-700', purple: 'bg-violet-50 text-violet-600', grey: 'bg-slate-100 text-slate-500' }[tone]}`}>{children}</span>
);

/** Orange header shared by Store and My vouchers, with the segmented control inside it (Figma 17/11 "no orange twice"). */
const VoucherHero: React.FC<{ shell: Shell; active: 'store' | 'mine'; coins?: number; mine?: number }> = ({ shell, active, coins, mine }) => {
  const navigate = useNavigate();
  const b = voucherBase(shell);
  return (
    <Hero title="Vouchers" sub="Partner deals, free or with coins" coins={coins} onCoins={() => navigate('/coins')} art={aiGift}>
      <Segmented
        value={active}
        onChange={(k) => navigate(k === 'store' ? b.store : b.mine)}
        items={[
          { key: 'store', label: 'Store' },
          { key: 'mine', label: <>My vouchers{mine ? <span className={`rounded-full px-1.5 text-[11px] ${active === 'mine' ? 'bg-[#FE810D] text-white' : 'bg-white text-[#FE810D]'}`}>{mine}</span> : null}</> },
        ]}
      />
    </Hero>
  );
};

type Sort = 'recommended' | 'coins' | 'ending' | 'newest';
type How = 'all' | 'free' | 'coins';

// ───────────────────────── VQ-01 · Store (Figma 330:247) ─────────────────────────
export const RewardStore: React.FC<{ shell?: Shell }> = ({ shell = 'customer' }) => {
  const navigate = useNavigate();
  const b = voucherBase(shell);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<string>('all'); // 'all' | 'free' | category code
  const [sort, setSort] = useState<Sort>('recommended');
  const [how, setHow] = useState<How>('all');
  const [affordable, setAffordable] = useState(false);
  const [filters, setFilters] = useState(false);
  const [collected, setCollected] = useState<Set<string>>(new Set());
  const [toast, setToast] = useToast();
  const [data, failed, reload] = useLoad(async () => {
    const [p, c, mine] = await Promise.all([
      LoyaltyApi.getProfile(uid()),
      LoyaltyApi.getVoucherCatalog(audienceOf(shell)),
      LoyaltyApi.getUserVouchers(uid()).catch(() => [] as UserVoucherItem[]),
    ]);
    return {
      coins: p.currentPoints || 0,
      tier: p.tier?.code || '',
      catalog: c.filter((v) => v.status !== 'INACTIVE' && acquireOf(v) !== 'GIVEN'),
      mine,
    };
  });

  const ownCodes = useMemo(() => new Set([...(data?.mine || []).filter((m) => userState(m) !== 'used').map((m) => m.voucherCode || ''), ...collected]), [data, collected]);
  const cats = useMemo(() => Array.from(new Set((data?.catalog || []).map((v) => v.categoryCode).filter(Boolean) as string[])), [data]);
  const free = (data?.catalog || []).filter((v) => acquireOf(v) === 'FREE_COLLECT');
  const locked = (v: CatalogVoucherItem) => !!v.eligibleTiers?.length && !v.eligibleTiers.includes(data?.tier || '');
  const state = (v: CatalogVoucherItem) => (ownCodes.has(v.voucherCode) ? 'use' : locked(v) ? 'locked' : v.availableQuantity === 0 ? 'gone' : 'collect') as 'use' | 'locked' | 'gone' | 'collect';

  const list = useMemo(() => {
    let l = (data?.catalog || []).filter((v) => `${v.title} ${v.partnerName}`.toLowerCase().includes(q.toLowerCase()));
    if (cat === 'free' || how === 'free') l = l.filter((v) => acquireOf(v) === 'FREE_COLLECT');
    if (how === 'coins') l = l.filter((v) => acquireOf(v) === 'COINS');
    if (cat !== 'all' && cat !== 'free') l = l.filter((v) => v.categoryCode === cat);
    if (affordable) l = l.filter((v) => acquireOf(v) !== 'COINS' || v.pointCost <= (data?.coins || 0));
    if (sort === 'coins') l = [...l].sort((a, z) => a.pointCost - z.pointCost);
    if (sort === 'ending') l = [...l].sort((a, z) => (a.endDate || '9').localeCompare(z.endDate || '9'));
    if (sort === 'newest') l = [...l].sort((a, z) => (z.startDate || '').localeCompare(a.startDate || ''));
    return l;
  }, [data, q, cat, how, affordable, sort]);

  const collect = async (v: CatalogVoucherItem) => {
    try {
      await LoyaltyApi.collectVoucher(uid(), v.voucherCode);
      setCollected((s) => new Set(s).add(v.voucherCode));
      setToast('Saved to My vouchers');
    } catch (e) {
      setToast(/409|LIMIT/i.test(String((e as Error).message)) ? 'You already collected this voucher' : 'Couldn’t save this voucher. Try again later.');
    }
  };
  const open = (v: CatalogVoucherItem) => navigate(`${b.store}/${v.id}`);
  const mineCount = (data?.mine || []).filter((m) => userState(m) === 'ready').length;
  const tab = { shell, active: 'vouchers' as const };
  const back = shell === 'customer' ? '/' : '/agent';

  return (
    <Screen title="Vouchers" back={back} tab={tab} hero={<VoucherHero shell={shell} active="store" coins={data?.coins} mine={mineCount} />}>
      <div className="flex w-full gap-2.5">
        <label className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-[14px] bg-white px-3.5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
          <Search className="size-[18px] shrink-0 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search vouchers or brands" className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-slate-400" />
        </label>
        <button type="button" aria-label="Filter vouchers" onClick={() => setFilters(true)} className="flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
          <SlidersHorizontal className="size-[18px] text-slate-600" />
        </button>
      </div>

      <SlideRow>
        <Chip on={cat === 'all'} onClick={() => setCat('all')}>All</Chip>
        {free.length > 0 && <Chip on={cat === 'free'} onClick={() => setCat('free')}>Free</Chip>}
        {cats.map((c) => <Chip key={c} on={cat === c} onClick={() => setCat(c)}>{nice(c)}</Chip>)}
      </SlideRow>

      {failed && <ErrorBlock onRetry={reload} />}
      {!data && !failed && <><Skeleton className="h-[92px]" /><Skeleton className="h-[92px]" /><Skeleton className="h-[92px]" /></>}

      {/* Free to collect strip — only when the catalogue has free vouchers */}
      {data && cat === 'all' && how === 'all' && !q && free.length > 0 && (
        <section className="flex w-full flex-col gap-2">
          <div className="flex items-end">
            <div className="min-w-0 flex-1">
              <h2 className="text-[16px] font-bold">Free to collect</h2>
              <p className="text-[12px] text-slate-500">No coins needed · while stock lasts</p>
            </div>
            <button type="button" onClick={() => setCat('free')} className="h-8 text-[13px] font-semibold text-[#FE810D]">See all ›</button>
          </div>
          <SlideRow className="gap-2.5 pb-3">
            {free.map((v) => {
              const st = state(v);
              return (
                <div key={v.id} className="flex w-[156px] shrink-0 flex-col gap-1.5 rounded-[16px] bg-white p-1.5 pb-2.5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
                  <button type="button" onClick={() => open(v)} className="flex flex-col gap-1.5 text-left">
                    <span className="relative h-20 w-full overflow-hidden rounded-[12px]">
                      <img src={photoOf(v)} alt="" className={`size-full object-cover ${st === 'gone' ? 'opacity-50' : ''}`} />
                      <span className="absolute left-1.5 top-1.5 max-w-[130px] truncate rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-medium">{cleanBrand(v.partnerName)}</span>
                    </span>
                    <span className="px-1">
                      <span className={`block truncate text-[15px] font-bold ${st === 'gone' ? 'text-slate-400' : ''}`}>{valueTitle(v)}</span>
                      <span className="block truncate text-[12px] text-slate-500">{condition(v)}</span>
                    </span>
                  </button>
                  <div className="flex items-center gap-1 px-1">
                    <span className={`min-w-0 flex-1 truncate text-[11.5px] font-semibold ${st === 'use' ? 'text-emerald-700' : st === 'locked' ? 'text-violet-600' : 'text-[#E06C00]'}`}>
                      {st === 'use' ? 'Collected' : st === 'locked' ? (v.eligibleTiers || []).map(nice).join(', ') : v.availableQuantity !== undefined ? `${fmt(v.availableQuantity)} left` : ''}
                    </span>
                    <ActionPill small kind={st} onClick={() => (st === 'use' ? navigate(b.mine) : collect(v))} />
                  </div>
                </div>
              );
            })}
          </SlideRow>
        </section>
      )}

      {data && list.length === 0 && <Empty art={artEmptyBox} title={q ? 'No vouchers match your search' : 'No vouchers here yet'} text="New partner deals are added every week." />}
      {list.map((v) => {
        const isFree = acquireOf(v) === 'FREE_COLLECT';
        const st = state(v);
        return (
          <ListCard
            key={v.id}
            photo={photoOf(v)}
            tag={cleanBrand(v.partnerName)}
            title={valueTitle(v)}
            sub={condition(v)}
            dim={isFree && st === 'gone'}
            onClick={() => open(v)}
            line3={
              isFree ? (
                <Tag tone={st === 'use' ? 'green' : st === 'locked' ? 'purple' : st === 'gone' ? 'grey' : 'orange'}>
                  {st === 'use' ? 'Collected' : st === 'locked' ? `${(v.eligibleTiers || []).map(nice).join(', ')} members` : st === 'gone' ? '0 left' : `Free${v.availableQuantity !== undefined ? ` · ${fmt(v.availableQuantity)} left` : ''}`}
                </Tag>
              ) : v.categoryCode ? <Tag tone="green">{nice(v.categoryCode)}</Tag> : v.endDate ? <span className="text-[12px] text-slate-500">Until {ddmmyyyy(v.endDate)}</span> : null
            }
            action={isFree ? <ActionPill kind={st} onClick={() => (st === 'use' ? navigate(b.mine) : collect(v))} /> : <button type="button" onClick={() => open(v)}><PricePill coins={v.pointCost} /></button>}
          />
        );
      })}

      <Sheet open={filters} onClose={() => setFilters(false)} title="Filter vouchers">
        <p className="text-[14px] font-semibold">Sort by</p>
        <div className="flex flex-wrap gap-2">
          {([['recommended', 'Recommended'], ['coins', 'Coins: low to high'], ['ending', 'Ending soon'], ['newest', 'Newest']] as [Sort, string][]).map(([k, l]) => <Chip key={k} on={sort === k} onClick={() => setSort(k)}>{l}</Chip>)}
        </div>
        <p className="text-[14px] font-semibold">How to get</p>
        <div className="flex flex-wrap gap-2">
          {([['all', 'All'], ['free', 'Free'], ['coins', 'With coins']] as [How, string][]).map(([k, l]) => <Chip key={k} on={how === k} onClick={() => setHow(k)}>{l}</Chip>)}
        </div>
        {cats.length > 0 && (
          <>
            <p className="text-[14px] font-semibold">Category</p>
            <div className="flex flex-wrap gap-2">
              {cats.map((c) => <Chip key={c} on={cat === c} onClick={() => setCat(cat === c ? 'all' : c)}>{nice(c)}</Chip>)}
            </div>
          </>
        )}
        <label className="flex items-center gap-3 py-1 text-[14px]">
          <span className="flex-1">Only what I can get now{data ? ` (${fmt(data.coins)} coins)` : ''}</span>
          <input type="checkbox" checked={affordable} onChange={(e) => setAffordable(e.target.checked)} className="size-5 accent-[#FE810D]" />
        </label>
        <div className="flex gap-2.5 pt-1">
          <SecondaryButton className="w-[110px] shrink-0" onClick={() => { setSort('recommended'); setHow('all'); setCat('all'); setAffordable(false); }}>Reset</SecondaryButton>
          <PrimaryButton onClick={() => setFilters(false)}>Show {list.length} vouchers</PrimaryButton>
        </div>
      </Sheet>
      <Toast text={toast} action={toast === 'Saved to My vouchers' ? 'View' : undefined} onAction={() => navigate(b.mine)} />
    </Screen>
  );
};

type Result = null | 'added' | 'data' | 'pending' | 'short' | 'soldout' | 'failed';

// ───────────────────────── VQ-02 · Voucher details (Figma 330:248, free 818:60) ─────────────────────────
export const RewardDetail: React.FC<{ shell?: Shell }> = ({ shell = 'customer' }) => {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const b = voucherBase(shell);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result>(null);
  const [issued, setIssued] = useState<UserVoucherItem>();
  const [collectedNow, setCollectedNow] = useState(false);
  const [toast, setToast] = useToast();
  const [data, failed, reload] = useLoad(async () => {
    const [p, c, mine] = await Promise.all([LoyaltyApi.getProfile(uid()), LoyaltyApi.getVoucherCatalog(audienceOf(shell)), LoyaltyApi.getUserVouchers(uid()).catch(() => [] as UserVoucherItem[])]);
    return { coins: p.currentPoints || 0, tier: p.tier?.code || '', v: c.find((x) => String(x.id) === id), mine };
  }, [id]);
  const v = data?.v;
  const free = v ? acquireOf(v) === 'FREE_COLLECT' : false;
  const owned = collectedNow || !!(v && data?.mine.some((m) => m.voucherCode === v.voucherCode && userState(m) !== 'used'));
  const locked = !!v?.eligibleTiers?.length && !v.eligibleTiers.includes(data?.tier || '');
  const soldOut = v?.availableQuantity === 0;

  const getVoucher = async () => {
    if (!v || !data) return;
    if (data.coins < v.pointCost) return setResult('short');
    setBusy(true);
    try {
      const item = await LoyaltyApi.redeemVoucher(uid(), v.voucherCode);
      setIssued(item);
      setResult(/PENDING|ISSUING|PROCESSING|AWAIT/i.test(item.status || '') ? 'pending' : isData(v.title) ? 'data' : 'added');
    } catch (e) {
      setResult(/40[49]|SOLD|STOCK/i.test(String((e as Error).message)) ? 'soldout' : 'failed');
    } finally {
      setBusy(false);
    }
  };
  const collect = async () => {
    if (!v) return;
    setBusy(true);
    try {
      await LoyaltyApi.collectVoucher(uid(), v.voucherCode);
      setCollectedNow(true);
      setToast('Saved to My vouchers');
    } catch {
      setToast('Couldn’t save this voucher. Try again later.');
    } finally {
      setBusy(false);
    }
  };

  const validity = v
    ? free && v.validDaysAfterCollect
      ? `Valid ${v.validDaysAfterCollect} days after you collect`
      : v.endDate
      ? `Valid until ${ddmmyyyy(v.endDate)}`
      : ''
    : '';

  return (
    <>
      <Screen title="Voucher details">
        {failed && <ErrorBlock onRetry={reload} />}
        {!data && !failed && <Skeleton className="h-[360px]" />}
        {data && !v && <Empty art={artEmptyBox} title="This voucher is no longer available" />}
        {v && (
          <>
            <img src={photoOf(v)} alt="" className="-mx-4 -mt-4 h-[170px] w-[calc(100%+2rem)] max-w-none object-cover" />
            <div className="-mt-10 flex w-full flex-col items-center gap-1 rounded-[16px] bg-white p-4 text-center shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
              <h2 className="text-[26px] font-bold leading-8">{valueTitle(v)}</h2>
              {condition(v) && <p className="text-[14px] text-slate-600">{condition(v)}</p>}
              {validity && <p className="text-[13px] text-[#FE810D]">{validity}</p>}
              <div className="mt-3 flex w-full items-center gap-2 border-t border-dashed border-slate-200 pt-3 text-left text-[14px]">
                <span className="flex size-6 items-center justify-center rounded-full bg-emerald-50 text-[11px] font-bold text-emerald-700">{cleanBrand(v.partnerName).slice(0, 1)}</span>
                <span className="flex-1">{cleanBrand(v.partnerName)}</span>
                <span className="text-slate-400">{usageOf(v) === 'ONLINE' ? 'Online' : 'At store'}</span>
              </div>
            </div>
            <div className="w-full rounded-[16px] bg-white p-4">
              <h3 className="text-[16px] font-semibold">Terms of use</h3>
              <p className="mt-1.5 whitespace-pre-line text-[13px] leading-5 text-slate-600">
                {v.terms || v.description || 'Not exchangeable for cash; can’t be combined with other offers.'}
                {free && v.perCustomerLimit ? `\n• ${v.perCustomerLimit} per customer while stock lasts.` : ''}
              </p>
            </div>
            <div className="w-full rounded-[16px] bg-white p-4">
              <h3 className="text-[16px] font-semibold">How to use</h3>
              <p className="mt-1.5 text-[13px] leading-5 text-slate-600">{howToUse[usageOf(v)]}</p>
            </div>
            <div className="h-[84px]" />
            <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-100 bg-white">
              <div className="mx-auto flex w-full max-w-[430px] items-center gap-3 px-4 pb-[max(14px,env(safe-area-inset-bottom))] pt-3">
                <div className="min-w-0 flex-1">
                  {free ? (
                    <p className={`text-[20px] font-bold ${owned ? 'text-emerald-700' : 'text-[#FE810D]'}`}>{owned ? 'Collected ✓' : 'Free'}</p>
                  ) : (
                    <p className="flex items-center gap-1 text-[20px] font-bold text-[#FE810D]"><CoinDot className="size-5" />{fmt(v.pointCost)}</p>
                  )}
                  <p className="truncate text-[12px] text-slate-500">
                    {free ? (locked ? `${(v.eligibleTiers || []).map(nice).join(', ')} only` : v.availableQuantity !== undefined ? `${fmt(v.availableQuantity)} left` : 'While stock lasts') : `Balance ${fmt(data!.coins)} coins`}
                  </p>
                </div>
                {free && locked ? (
                  <button type="button" onClick={() => navigate('/tiers')} className="h-12 min-w-[150px] rounded-[14px] border border-[#FE810D] px-5 text-[15px] font-semibold text-[#FE810D]">See member tiers</button>
                ) : free && owned ? (
                  <button type="button" onClick={() => navigate(b.mine)} className="h-12 min-w-[150px] rounded-[14px] bg-[#FE810D] px-5 text-[15px] font-semibold text-white">Use voucher</button>
                ) : (
                  <button
                    type="button"
                    disabled={busy || soldOut}
                    onClick={free ? collect : getVoucher}
                    className="h-12 min-w-[150px] rounded-[14px] bg-[#FE810D] px-5 text-[15px] font-semibold text-white disabled:opacity-50"
                  >
                    {soldOut ? (free ? 'All gone' : 'Sold out') : busy ? 'Please wait…' : free ? 'Collect' : 'Get voucher'}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </Screen>

      {/* VQ-02 result popups (Figma 330:249 / 258 / 252 / 256 / 251 / 615:357) */}
      <Popup open={!!result} onClose={() => setResult(null)}>
        <img src={result === 'added' || result === 'data' ? artGift : result === 'pending' ? artHourglass : artEmptyBox} alt="" className="size-24 object-contain" />
        <h2 className="text-[19px] font-semibold">
          {{ added: 'Voucher added', data: 'Data pack added', pending: 'Activating your data pack', short: 'Not enough coins', soldout: 'Sold out', failed: 'We couldn’t get this voucher' }[result || 'failed']}
        </h2>
        <p className="text-[13px] leading-5 text-slate-500">
          {result === 'added' && `${v ? valueTitle(v) : ''} is in My vouchers${issued?.validUntil ? ` · valid until ${ddmmyyyy(issued.validUntil)}` : ''}.`}
          {result === 'data' && 'The data is added to your line. You can see it in My vouchers.'}
          {result === 'pending' && `${v?.partnerName || 'The partner'} is adding it now. It usually takes under a minute and we’ll notify you. If it fails, your coins are refunded.`}
          {result === 'short' && v && data && `You need ${fmt(v.pointCost - data.coins)} more coins. Complete missions to earn them.`}
          {result === 'soldout' && 'This voucher has just run out. No coins were deducted.'}
          {result === 'failed' && 'No coins were deducted. Try again later.'}
        </p>
        <div className="mt-2 flex w-full flex-col gap-2">
          {(result === 'added' || result === 'data' || result === 'pending') && <PrimaryButton onClick={() => navigate(b.mine)}>Go to My vouchers</PrimaryButton>}
          {result === 'short' && <PrimaryButton onClick={() => navigate(shell === 'customer' ? '/missions' : '/agent/missions')}>Earn coins</PrimaryButton>}
          <SecondaryButton onClick={() => navigate(b.store)}>Back to Store</SecondaryButton>
        </div>
      </Popup>
      <Toast text={toast} action={toast === 'Saved to My vouchers' ? 'View' : undefined} onAction={() => navigate(b.mine)} />
    </>
  );
};

type MineTab = 'all' | 'ready' | 'used' | 'expired';

// ───────────────────────── VQ-03 · My vouchers (Figma 330:250) ─────────────────────────
export const MyVouchers: React.FC<{ shell?: Shell }> = ({ shell = 'customer' }) => {
  const navigate = useNavigate();
  const b = voucherBase(shell);
  const [q, setQ] = useState('');
  const [tab, setTab] = useState<MineTab>('all');
  const [data, failed, reload] = useLoad(async () => {
    const [p, mine] = await Promise.all([LoyaltyApi.getProfile(uid()).catch(() => null), LoyaltyApi.getUserVouchers(uid())]);
    return { coins: p?.currentPoints, mine };
  });
  const all = data?.mine || [];
  const count = (t: MineTab) => (t === 'all' ? all.length : all.filter((v) => (t === 'ready' ? ['ready', 'pending'] : [t]).includes(userState(v))).length);
  const list = all
    .filter((v) => tab === 'all' || (tab === 'ready' ? ['ready', 'pending'] : [tab]).includes(userState(v)))
    .filter((v) => `${v.title} ${v.partnerName} ${v.code}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <Screen title="My vouchers" back={shell === 'customer' ? '/' : '/agent'} tab={{ shell, active: 'vouchers' }} hero={<VoucherHero shell={shell} active="mine" coins={data?.coins} mine={count('ready')} />}>
      <label className="flex h-11 w-full items-center gap-2 rounded-[14px] bg-white px-3.5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
        <Search className="size-[18px] text-slate-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search my vouchers" className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-slate-400" />
      </label>
      <SlideRow>
        {([['all', 'All'], ['ready', 'Ready'], ['used', 'Used'], ['expired', 'Expired']] as [MineTab, string][]).map(([k, l]) => (
          <Chip key={k} on={tab === k} onClick={() => setTab(k)}>
            {l}
            {count(k) > 0 && k !== 'used' && <span className="text-[12px] font-normal text-slate-400">{count(k)}</span>}
          </Chip>
        ))}
      </SlideRow>
      {failed && <ErrorBlock onRetry={reload} />}
      {!data && !failed && <><Skeleton className="h-[92px]" /><Skeleton className="h-[92px]" /></>}
      {data && list.length === 0 && (
        <Empty art={artEmptyBox} title={tab === 'all' ? 'No vouchers yet' : 'Nothing here'} text="Get vouchers with coins, or collect free ones in the Store.">
          <PrimaryButton className="mt-3" onClick={() => navigate(b.store)}>Open Store</PrimaryButton>
        </Empty>
      )}
      {list.map((v) => {
        const st = userState(v);
        return (
          <ListCard
            key={v.id}
            photo={photoOf(v)}
            tag={cleanBrand(v.partnerName)}
            title={v.discountText || v.title}
            sub={v.minOrder || v.partnerName}
            dim={st === 'used' || st === 'expired'}
            onClick={() => navigate(`${b.mine}/${v.id}`)}
            line3={
              <span className={`flex items-center gap-1 text-[12px] ${st === 'expired' ? 'text-red-600' : 'text-slate-500'}`}>
                <CalendarDays className="size-3.5" />
                {st === 'used' ? 'Used' : st === 'pending' ? 'Activating…' : `${st === 'expired' ? 'Expired' : 'Valid until'} ${ddmmyyyy(v.validUntil) || v.validUntil || ''}`}
              </span>
            }
            action={st === 'ready' ? <ActionPill kind="use" onClick={() => openUse(navigate, shell, v)} /> : undefined}
          />
        );
      })}
    </Screen>
  );
};

// ───────────────────────── VQ-03 · My voucher details (Figma 765:2) ─────────────────────────
export const MyVoucherDetail: React.FC<{ shell?: Shell }> = ({ shell = 'customer' }) => {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [data, failed, reload] = useLoad(() => LoyaltyApi.getUserVouchers(uid()), [id]);
  const v = data?.find((x) => String(x.id) === id);
  const st = v ? userState(v) : 'ready';
  return (
    <Screen title="My voucher">
      {failed && <ErrorBlock onRetry={reload} />}
      {!data && !failed && <Skeleton className="h-[360px]" />}
      {data && !v && <Empty art={artEmptyBox} title="Voucher not found" />}
      {v && (
        <>
          <img src={photoOf(v)} alt="" className={`-mx-4 -mt-4 h-[170px] w-[calc(100%+2rem)] max-w-none object-cover ${st === 'ready' || st === 'pending' ? '' : 'grayscale'}`} />
          <div className="-mt-10 flex w-full flex-col items-center gap-1 rounded-[16px] bg-white p-4 text-center shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
            <h2 className="text-[26px] font-bold leading-8">{v.discountText || v.title}</h2>
            {v.minOrder && <p className="text-[14px] text-slate-600">{v.minOrder}</p>}
            <p className={`text-[13px] ${st === 'expired' ? 'text-red-600' : 'text-[#FE810D]'}`}>
              {st === 'used' ? 'Used' : st === 'pending' ? 'Activating…' : `${st === 'expired' ? 'Expired' : 'Valid until'} ${ddmmyyyy(v.validUntil) || v.validUntil || ''}`}
            </p>
            <div className="mt-3 flex w-full items-center gap-2 border-t border-dashed border-slate-200 pt-3 text-left text-[14px]">
              <span className="flex size-6 items-center justify-center rounded-full bg-emerald-50 text-[11px] font-bold text-emerald-700">{cleanBrand(v.partnerName).slice(0, 1)}</span>
              <span className="flex-1">{cleanBrand(v.partnerName)}</span>
              <span className="text-slate-400">{usageOf(v) === 'ONLINE' ? 'Online' : 'At store'}</span>
            </div>
          </div>
          {v.terms && (
            <div className="w-full rounded-[16px] bg-white p-4">
              <h3 className="text-[16px] font-semibold">Terms of use</h3>
              <p className="mt-1.5 whitespace-pre-line text-[13px] leading-5 text-slate-600">{v.terms}</p>
            </div>
          )}
          <div className="w-full rounded-[16px] bg-white p-4">
            <h3 className="text-[16px] font-semibold">How to use</h3>
            <p className="mt-1.5 text-[13px] leading-5 text-slate-600">{howToUse[usageOf(v)]}</p>
          </div>
          {st === 'ready' && (
            <>
              <div className="h-[76px]" />
              <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-100 bg-white">
                <div className="mx-auto w-full max-w-[430px] px-4 pb-[max(14px,env(safe-area-inset-bottom))] pt-3">
                  <PrimaryButton onClick={() => openUse(navigate, shell, v)}>Use voucher</PrimaryButton>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </Screen>
  );
};

/** QR / Barcode tabs (QR by default) with the digits always shown — Figma LM-17 692:2 / 768:2 and VQ-03 495:1494 / 581:1182. */
export const CodeTabs: React.FC<{ value: string; digits?: string }> = ({ value, digits }) => {
  const [mode, setMode] = useState<'qr' | 'bar'>('qr');
  const shown = digits ?? (value.length <= 24 ? value : '');
  return (
    <div className="flex w-full flex-col items-center gap-3">
      <div role="tablist" className="flex rounded-full bg-slate-100 p-1">
        {(['qr', 'bar'] as const).map((m) => (
          <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => setMode(m)} className={`h-8 rounded-full px-5 text-[13px] font-semibold ${mode === m ? 'bg-white text-[#FE810D] shadow-sm' : 'text-slate-500'}`}>
            {m === 'qr' ? 'QR code' : 'Barcode'}
          </button>
        ))}
      </div>
      {mode === 'qr' ? (
        <QrCode value={value} size={200} />
      ) : (
        <div className="w-full max-w-[320px]" dangerouslySetInnerHTML={{ __html: generateBarcode128Svg(value.slice(0, 24), 80) }} />
      )}
      {shown && <p className="text-[20px] font-semibold tracking-[0.12em]">{shown.replace(/(.{4})(?=.)/g, '$1 ')}</p>}
    </div>
  );
};

// ───────────────────────── VQ-03 · Show partner code (Figma 495:1494) ─────────────────────────
export const ShowVoucher: React.FC = () => {
  const { id = '' } = useParams();
  const [data, failed, reload] = useLoad(() => LoyaltyApi.getUserVouchers(uid()), [id]);
  const v = data?.find((x) => String(x.id) === id);
  const code = v ? v.redemptionCode || v.code : '';
  return (
    <Screen title="Show code">
      {failed && <ErrorBlock onRetry={reload} />}
      {!data && !failed && <Skeleton className="h-[420px]" />}
      {data && !v && <Empty art={artEmptyBox} title="Voucher not found" />}
      {v && (
        <div className="flex w-full flex-col items-center gap-3 rounded-[16px] bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <div className="w-full text-center">
            <p className="text-[13px] text-slate-500">{cleanBrand(v.partnerName)}</p>
            <p className="text-[22px] font-bold">{v.discountText || v.title}</p>
            {v.validUntil && <p className="text-[12px] text-slate-500">Valid until {ddmmyyyy(v.validUntil) || v.validUntil}</p>}
          </div>
          <CodeTabs value={code} digits={code} />
          <p className="text-center text-[12px] text-slate-500">Show this to the cashier. The POS scans the QR or the barcode; the cashier can also type the code.</p>
        </div>
      )}
    </Screen>
  );
};

/** Old result route: results are popups now. */
export const RedeemDone: React.FC = () => {
  const navigate = useNavigate();
  React.useEffect(() => navigate('/my-vouchers', { replace: true }), [navigate]);
  return null;
};
