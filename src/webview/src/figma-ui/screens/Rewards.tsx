import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Search,
  SlidersHorizontal,
  Lock,
  CalendarDays,
  Store,
  Ticket,
  Gift,
  CupSoda,
  ShoppingCart,
  Fuel,
  Radio,
  Music,
  Heart,
  ShoppingBag,
  Tag as TagIcon,
  HelpCircle,
  ChevronRight,
  MapPin,
  Clock,
  Copy,
  Check,
  RefreshCw,
  type LucideIcon,
} from 'lucide-react';
import {
  LoyaltyApi,
  getDefaultUserId,
  type CatalogVoucherItem,
  type GeneralCategoryItem,
  type PartnerLocationItem,
  type UserVoucherItem,
  type VoucherAcquireType,
  type VoucherUsageType,
  type VoucherUseCodeResponse,
} from '../../services/api';
import { LoyaltyJSBridge } from '../../bridge/LoyaltyJSBridge';
import { generateBarcode128Svg } from '../../utils/barcode128';
import {
  AudienceRoleEnum,
  CommonStatus,
  CurrencyCode,
  GeneralCategoryType,
  VoucherAcquireTypeEnum,
  VoucherHowFilter,
  VoucherSortMode,
  VoucherUsageTypeEnum,
  VoucherWhereFilter,
  type VoucherHowFilterValue,
  type VoucherSortModeValue,
  type VoucherWhereFilterValue,
} from '../../constants/enums';
import {
  Screen,
  Hero,
  Segmented,
  Chip,
  ListCard,
  Toast,
  useToast,
  Popup,
  Sheet,
  Skeleton,
  ErrorBlock,
  Empty,
  PrimaryButton,
  SecondaryButton,
  SlideRow,
  CoinDot,
  Switch,
  useLoad,
  fmt,
  ddmmyyyy,
  voucherBase,
  type Shell,
} from '../ui';
import { QrCode } from '../qr';
import { artGift, artHourglass, artEmptyBox, partnerPhoto, aiGift } from '../art';

const uid = () => getDefaultUserId();

export const cleanBrand = (raw?: string) =>
  (raw || '')
    .replace(/\s*\(.*?\)/g, '')
    .replace(/\s+(Telecom|Mobile E-Wallet|Supermarket|Store|Group).*$/i, '')
    .trim();

const nice = (s: string) => s.replace(/[_-]/g, ' ').toLowerCase().replace(/^./, (c) => c.toUpperCase());
const isData = (t: string) => /\d+\s*(GB|MB)\b/i.test(t);

interface CategoryVisual {
  Icon: LucideIcon;
  pillBg: string;
  pillText: string;
  iconBg: string;
  iconColor: string;
}

const DEFAULT_CATEGORY_VISUAL: CategoryVisual = {
  Icon: TagIcon,
  pillBg: 'bg-slate-100',
  pillText: 'text-slate-700',
  iconBg: 'bg-slate-100',
  iconColor: 'text-slate-600',
};

/** Pure icon/color styling mapped by master-data category code; labels & list always come from CMS/API. */
const CATEGORY_VISUALS: Record<string, CategoryVisual> = {
  FOOD_DRINK: { Icon: CupSoda, pillBg: 'bg-orange-50', pillText: 'text-[#E06C00]', iconBg: 'bg-[#FFF1E3]', iconColor: 'text-[#FE810D]' },
  GROCERY: { Icon: ShoppingCart, pillBg: 'bg-emerald-50', pillText: 'text-emerald-700', iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
  FUEL: { Icon: Fuel, pillBg: 'bg-sky-50', pillText: 'text-sky-700', iconBg: 'bg-sky-50', iconColor: 'text-sky-600' },
  TELECOM: { Icon: Radio, pillBg: 'bg-rose-50', pillText: 'text-rose-600', iconBg: 'bg-rose-50', iconColor: 'text-rose-500' },
  ENTERTAINMENT: { Icon: Music, pillBg: 'bg-violet-50', pillText: 'text-violet-600', iconBg: 'bg-violet-50', iconColor: 'text-violet-600' },
  HEALTH_BEAUTY: { Icon: Heart, pillBg: 'bg-pink-50', pillText: 'text-pink-600', iconBg: 'bg-pink-50', iconColor: 'text-pink-500' },
  SHOPPING: { Icon: ShoppingBag, pillBg: 'bg-blue-50', pillText: 'text-blue-600', iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
};

const visualOfCategory = (code?: string | null): CategoryVisual => {
  if (!code) return DEFAULT_CATEGORY_VISUAL;
  return CATEGORY_VISUALS[code.trim().toUpperCase()] || DEFAULT_CATEGORY_VISUAL;
};

/** Older payloads have no acquireType: a 0-coin voucher is free to collect. "Given" vouchers never show in the Store. */
export const acquireOf = (v: CatalogVoucherItem): VoucherAcquireType =>
  v.acquireType || (Number(v.pointCost) === 0 ? VoucherAcquireTypeEnum.FREE_COLLECT : VoucherAcquireTypeEnum.COINS);

/** Missing usageType = partner code (the only flow older vouchers had). */
export const usageOf = (v: { usageType?: VoucherUsageType }): VoucherUsageType => v.usageType || VoucherUsageTypeEnum.PARTNER_CODE;

/** Card title is the value ("50 HTG off", "5 GB data"); the condition goes on the next line. */
export const valueTitle = (v: CatalogVoucherItem) => {
  const gb = v.title.match(/(\d+\s*(?:GB|MB))/i);
  if (gb) return `${gb[1].toUpperCase().replace(/(\d+)\s*([A-Z]+)/, '$1 $2')} data`;
  if (/PERCENT/i.test(v.discountType) && v.discountValue) return `${v.discountValue}% off`;
  if (v.discountValue) return `${fmt(v.discountValue)} ${CurrencyCode.HTG} off`;
  return v.title;
};

// API sends "50.00 HTG" / "10%" and "Valid for orders from 0 HTG"; Figma shows "50 HTG off" and hides a 0 minimum
export const userValueTitle = (v: UserVoucherItem) => {
  const m = (v.discountText || '').trim().match(/^([\d.,]+)\s*(%|[A-Z]{3})$/);
  if (!m) return v.discountText || v.title;
  const n = Number(m[1].replace(/,/g, ''));
  return m[2] === '%' ? `${n}% off` : `${fmt(n)} ${m[2]} off`;
};
export const userCondition = (v: UserVoucherItem) =>
  v.minOrder && !/from 0([.,]0+)?\s/i.test(v.minOrder) ? v.minOrder : v.title !== userValueTitle(v) ? v.title : '';

const photoOf = (v: { imageUrl?: string; partnerName?: string; title: string }) => v.imageUrl || partnerPhoto(`${v.partnerName || ''} ${v.title}`);

type UState = 'ready' | 'pending' | 'used' | 'expired';
export const userState = (v: UserVoucherItem): UState =>
  /USED|REDEEMED/i.test(v.status) ? 'used' : /EXPIRED/i.test(v.status) ? 'expired' : /PENDING|ISSUING|PROCESSING|AWAIT/i.test(v.status) ? 'pending' : 'ready';

const audienceOf = (shell: Shell) =>
  shell === 'super' ? AudienceRoleEnum.SUPER_AGENT : shell === 'agent' ? AudienceRoleEnum.AGENT : AudienceRoleEnum.CUSTOMER;

const HOW_TO_USE_KEY: Record<VoucherUsageType, string> = {
  [VoucherUsageTypeEnum.NATCASH_STORE]: 'figma_ui.vouchers.how_natcash_store',
  [VoucherUsageTypeEnum.PARTNER_CODE]: 'figma_ui.vouchers.how_partner_code',
  [VoucherUsageTypeEnum.ONLINE]: 'figma_ui.vouchers.how_online',
};

/** Use, by the voucher's "How to use": at store -> Pay at counter with voucher; partner/online -> generate 5-min dynamic code. */
export const openUse = (navigate: ReturnType<typeof useNavigate>, shell: Shell, v: UserVoucherItem) => {
  const u = usageOf(v);
  if (u === VoucherUsageTypeEnum.NATCASH_STORE) navigate(`/pay-at-counter?voucher=${v.id}`);
  else navigate(`${voucherBase(shell).mine}/${v.id}/code`);
};

const PricePill: React.FC<{ coins: number }> = ({ coins }) => (
  <span className="flex h-8 items-center gap-1 rounded-full bg-[#FE810D] pl-1.5 pr-3 text-[14px] font-bold text-white">
    <CoinDot className="size-[20px]" /> {fmt(coins)}
  </span>
);

const ActionPill: React.FC<{ kind: 'collect' | 'use' | 'locked' | 'gone'; onClick?: () => void; small?: boolean }> = ({ kind, onClick, small }) => {
  const { t } = useTranslation();
  const base = `flex ${small ? 'h-7 px-3 text-[13px]' : 'h-8 px-3.5 text-[14px]'} items-center gap-1 whitespace-nowrap rounded-full font-semibold`;
  if (kind === 'collect') return <button type="button" onClick={onClick} className={`${base} border border-[#FE810D] bg-white text-[#FE810D]`}>{t('figma_ui.vouchers.collect')}</button>;
  if (kind === 'use') return <button type="button" onClick={onClick} className={`${base} bg-[#FE810D] text-white`}>{t('figma_ui.vouchers.use')}</button>;
  if (kind === 'locked') return <span className={`${base} bg-slate-100 text-slate-500`}><Lock className="size-3.5" /> {t('figma_ui.vouchers.locked')}</span>;
  return <span className={`${base} bg-slate-100 text-slate-500`}>{t('figma_ui.vouchers.all_gone')}</span>;
};

const Tag: React.FC<{ tone: 'orange' | 'green' | 'purple' | 'grey'; children: React.ReactNode }> = ({ tone, children }) => (
  <span className={`truncate rounded-full px-2 py-0.5 text-[11.5px] font-semibold ${{ orange: 'bg-[#FFF1E3] text-[#E06C00]', green: 'bg-emerald-50 text-emerald-700', purple: 'bg-violet-50 text-violet-600', grey: 'bg-slate-100 text-slate-500' }[tone]}`}>{children}</span>
);

/** Orange header shared by Store and My vouchers, with the segmented control inside it. */
const VoucherHero: React.FC<{ shell: Shell; active: 'store' | 'mine'; coins?: number; mine?: number }> = ({ shell, active, coins, mine }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const b = voucherBase(shell);
  return (
    <Hero title={t('figma_ui.vouchers.title')} sub={t('figma_ui.vouchers.subtitle')} coins={coins} onCoins={() => navigate('/coins')} art={aiGift}>
      <Segmented
        value={active}
        onChange={(k) => navigate(k === 'store' ? b.store : b.mine)}
        items={[
          { key: 'store', label: <><Store className="size-4 shrink-0" /><span>{t('figma_ui.vouchers.store')}</span></> },
          {
            key: 'mine',
            label: (
              <>
                <Ticket className="size-4 shrink-0" />
                <span>{t('figma_ui.vouchers.my_vouchers')}</span>
                {mine ? <span className={`rounded-full px-1.5 py-0.5 text-[11px] leading-none ${active === 'mine' ? 'bg-[#FE810D] text-white' : 'bg-white text-[#FE810D]'}`}>{mine}</span> : null}
              </>
            ),
          },
        ]}
      />
    </Hero>
  );
};

const SORT_OPTIONS: [VoucherSortModeValue, string][] = [
  [VoucherSortMode.RECOMMENDED, 'figma_ui.vouchers.sort_recommended'],
  [VoucherSortMode.POPULAR, 'figma_ui.vouchers.sort_popular'],
  [VoucherSortMode.NEWEST, 'figma_ui.vouchers.sort_newest'],
  [VoucherSortMode.COINS, 'figma_ui.vouchers.sort_coins_asc'],
  [VoucherSortMode.ENDING, 'figma_ui.vouchers.sort_ending'],
];

const WHERE_OPTIONS: [VoucherWhereFilterValue, string][] = [
  [VoucherWhereFilter.ALL, 'figma_ui.common.all'],
  [VoucherWhereFilter.STORE, 'figma_ui.vouchers.where_at_store'],
  [VoucherWhereFilter.ONLINE, 'figma_ui.vouchers.where_online'],
];

const HOW_OPTIONS: [VoucherHowFilterValue, string][] = [
  [VoucherHowFilter.ALL, 'figma_ui.common.all'],
  [VoucherHowFilter.FREE, 'figma_ui.common.free'],
  [VoucherHowFilter.COINS, 'figma_ui.vouchers.how_with_coins'],
];

const FILTER_ALL = 'all';
const FILTER_FREE = 'free';
const INITIAL_PARTNER_LIMIT = 5;

// ───────────────────────── VQ-01 · Store (Figma 330:247) ─────────────────────────
export const RewardStore: React.FC<{ shell?: Shell }> = ({ shell = 'customer' }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const b = voucherBase(shell);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<string>(FILTER_ALL);
  const [sort, setSort] = useState<VoucherSortModeValue>(VoucherSortMode.RECOMMENDED);
  const [where, setWhere] = useState<VoucherWhereFilterValue>(VoucherWhereFilter.ALL);
  const [how, setHow] = useState<VoucherHowFilterValue>(VoucherHowFilter.ALL);
  const [partner, setPartner] = useState<string | null>(null);
  const [partnerQ, setPartnerQ] = useState('');
  const [allPartnersOpen, setAllPartnersOpen] = useState(false);
  const [affordable, setAffordable] = useState(false);
  const [filters, setFilters] = useState(false);
  const [collected, setCollected] = useState<Set<string>>(new Set());
  const [toast, setToast] = useToast();

  const [data, failed, reload] = useLoad(async () => {
    const userId = uid();
    const [p, c, mine, masterCategories] = await Promise.all([
      userId ? LoyaltyApi.getProfile(userId).catch(() => null) : Promise.resolve(null),
      LoyaltyApi.getVoucherCatalog(audienceOf(shell)),
      userId ? LoyaltyApi.getUserVouchers(userId).catch(() => [] as UserVoucherItem[]) : Promise.resolve([] as UserVoucherItem[]),
      LoyaltyApi.getGeneralCategories(GeneralCategoryType.VOUCHER_CATEGORY).catch(() => [] as GeneralCategoryItem[]),
    ]);
    return {
      isGuest: !userId,
      coins: p?.currentPoints || 0,
      tier: p?.tier?.code || '',
      catalog: c.filter((v) => v.status !== CommonStatus.INACTIVE && acquireOf(v) !== VoucherAcquireTypeEnum.GIVEN),
      mine,
      masterCategories: masterCategories
        .filter((item) => item.status === undefined || item.status === 1)
        .sort((a, z) => (a.displayOrder ?? 999) - (z.displayOrder ?? 999)),
    };
  });

  const conditionText = (v: CatalogVoucherItem) =>
    v.minBillAmount
      ? t('figma_ui.vouchers.bills_from', { amount: fmt(v.minBillAmount), currency: CurrencyCode.HTG })
      : v.title !== valueTitle(v)
      ? v.title
      : v.description || '';

  const categoryNameMap = useMemo(() => {
    const map = new Map<string, string>();
    (data?.masterCategories || []).forEach((c) => map.set(c.code.trim().toUpperCase(), c.name));
    return map;
  }, [data]);

  const categoryLabelOf = (code?: string | null) => {
    if (!code) return '';
    const key = code.trim().toUpperCase();
    return categoryNameMap.get(key) || nice(key);
  };

  const ownCodes = useMemo(
    () => new Set([...(data?.mine || []).filter((m) => userState(m) !== 'used').map((m) => m.voucherCode || ''), ...collected]),
    [data, collected],
  );

  /** Categories actually present in the catalog for top quick-filter chips (100% real API data). */
  const catalogCategories = useMemo(() => {
    const seen = new Set<string>();
    (data?.catalog || []).forEach((v) => {
      if (v.categoryCode) seen.add(v.categoryCode.trim().toUpperCase());
    });
    const ordered: { code: string; name: string }[] = [];
    (data?.masterCategories || []).forEach((mc) => {
      const code = mc.code.trim().toUpperCase();
      if (seen.has(code)) {
        ordered.push({ code, name: mc.name });
        seen.delete(code);
      }
    });
    seen.forEach((code) => ordered.push({ code, name: nice(code) }));
    return ordered;
  }, [data]);

  /** Categories shown in Filter sheet: master data from CMS when configured, else distinct catalog codes. */
  const filterCategories = useMemo(() => {
    const master = data?.masterCategories || [];
    if (master.length > 0) {
      return master.map((mc) => ({ code: mc.code.trim().toUpperCase(), name: mc.name }));
    }
    return catalogCategories;
  }, [data, catalogCategories]);

  /** Partners derived 100% from real catalog records. */
  const partners = useMemo(() => {
    const byBrand = new Map<string, { brand: string; categoryCode?: string }>();
    (data?.catalog || []).forEach((v) => {
      const brand = cleanBrand(v.partnerName);
      if (brand && !byBrand.has(brand)) byBrand.set(brand, { brand, categoryCode: v.categoryCode });
    });
    return [...byBrand.values()];
  }, [data]);

  const visiblePartners = useMemo(() => {
    const kw = partnerQ.trim().toLowerCase();
    const matched = kw ? partners.filter((p) => p.brand.toLowerCase().includes(kw)) : partners;
    return allPartnersOpen || kw ? matched : matched.slice(0, INITIAL_PARTNER_LIMIT);
  }, [partners, partnerQ, allPartnersOpen]);

  const free = useMemo(
    () =>
      (data?.catalog || [])
        .filter((v) => acquireOf(v) === VoucherAcquireTypeEnum.FREE_COLLECT)
        .sort((a, z) => (a.stripOrder ?? 999) - (z.stripOrder ?? 999)),
    [data],
  );

  const locked = (v: CatalogVoucherItem) => !!v.eligibleTiers?.length && !v.eligibleTiers.includes(data?.tier || '');
  const state = (v: CatalogVoucherItem) =>
    (ownCodes.has(v.voucherCode) ? 'use' : locked(v) ? 'locked' : v.availableQuantity === 0 ? 'gone' : 'collect') as 'use' | 'locked' | 'gone' | 'collect';

  const list = useMemo(() => {
    let l = (data?.catalog || []).filter((v) => `${v.title} ${v.partnerName || ''}`.toLowerCase().includes(q.toLowerCase()));
    if (cat === FILTER_FREE || how === VoucherHowFilter.FREE) l = l.filter((v) => acquireOf(v) === VoucherAcquireTypeEnum.FREE_COLLECT);
    if (how === VoucherHowFilter.COINS) l = l.filter((v) => acquireOf(v) === VoucherAcquireTypeEnum.COINS);
    if (where === VoucherWhereFilter.ONLINE) l = l.filter((v) => usageOf(v) === VoucherUsageTypeEnum.ONLINE);
    if (where === VoucherWhereFilter.STORE) l = l.filter((v) => usageOf(v) !== VoucherUsageTypeEnum.ONLINE);
    if (cat !== FILTER_ALL && cat !== FILTER_FREE) l = l.filter((v) => (v.categoryCode || '').trim().toUpperCase() === cat);
    if (partner) l = l.filter((v) => cleanBrand(v.partnerName) === partner);
    if (affordable) l = l.filter((v) => acquireOf(v) !== VoucherAcquireTypeEnum.COINS || v.pointCost <= (data?.coins || 0));
    if (sort === VoucherSortMode.COINS) l = [...l].sort((a, z) => a.pointCost - z.pointCost);
    if (sort === VoucherSortMode.POPULAR) {
      l = [...l].sort((a, z) => ((z.totalQuantity || 0) - (z.availableQuantity || 0)) - ((a.totalQuantity || 0) - (a.availableQuantity || 0)));
    }
    if (sort === VoucherSortMode.ENDING) l = [...l].sort((a, z) => (a.endDate || '9').localeCompare(z.endDate || '9'));
    if (sort === VoucherSortMode.NEWEST) l = [...l].sort((a, z) => (z.startDate || '').localeCompare(a.startDate || ''));
    return l;
  }, [data, q, cat, how, where, partner, affordable, sort]);

  const activeFilterCount =
    (sort !== VoucherSortMode.RECOMMENDED ? 1 : 0) +
    (where !== VoucherWhereFilter.ALL ? 1 : 0) +
    (how !== VoucherHowFilter.ALL ? 1 : 0) +
    (cat !== FILTER_ALL ? 1 : 0) +
    (partner ? 1 : 0) +
    (affordable ? 1 : 0);

  const resetFilters = () => {
    setSort(VoucherSortMode.RECOMMENDED);
    setWhere(VoucherWhereFilter.ALL);
    setHow(VoucherHowFilter.ALL);
    setCat(FILTER_ALL);
    setPartner(null);
    setPartnerQ('');
    setAffordable(false);
  };

  const savedToastText = t('figma_ui.vouchers.saved_toast');
  const collect = async (v: CatalogVoucherItem) => {
    const userId = uid();
    if (!userId) {
      setToast(t('sso.guest_login_required_desc'));
      return;
    }
    try {
      await LoyaltyApi.collectVoucher(userId, v.voucherCode);
      setCollected((s) => new Set(s).add(v.voucherCode));
      setToast(savedToastText);
    } catch (e) {
      setToast(/409|LIMIT/i.test(String((e as Error).message)) ? t('figma_ui.vouchers.already_collected_toast') : t('figma_ui.vouchers.collect_failed_toast'));
    }
  };

  const open = (v: CatalogVoucherItem) => navigate(`${b.store}/${v.id}`);
  const mineCount = (data?.mine || []).filter((m) => userState(m) === 'ready').length;
  const tab = { shell, active: 'vouchers' as const };
  const back = shell === 'customer' ? '/' : '/agent';

  return (
    <Screen title={t('figma_ui.vouchers.title')} back={back} tab={tab} hero={<VoucherHero shell={shell} active="store" coins={data?.coins} mine={mineCount} />}>
      <div className="flex w-full gap-2.5">
        <label className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-[14px] bg-white px-3.5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
          <Search className="size-[18px] shrink-0 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('figma_ui.vouchers.search_placeholder')} className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-slate-400" />
        </label>
        <button type="button" aria-label={t('figma_ui.vouchers.filter_title')} onClick={() => setFilters(true)} className="relative flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
          <SlidersHorizontal className="size-[18px] text-slate-600" />
          {activeFilterCount > 0 && <span className="absolute right-2 top-2 size-2 rounded-full bg-[#FE810D]" />}
        </button>
      </div>

      <SlideRow>
        <Chip on={cat === FILTER_ALL} onClick={() => setCat(FILTER_ALL)}>{t('figma_ui.common.all')}</Chip>
        {free.length > 0 && (
          <Chip on={cat === FILTER_FREE} onClick={() => setCat(FILTER_FREE)}>
            <Gift className="size-3.5 text-[#FE810D]" /> {t('figma_ui.common.free')}
          </Chip>
        )}
        {catalogCategories.map((c) => {
          const vis = visualOfCategory(c.code);
          return (
            <Chip key={c.code} on={cat === c.code} onClick={() => setCat(c.code)}>
              <vis.Icon className={`size-3.5 ${vis.iconColor}`} />
              {c.name}
            </Chip>
          );
        })}
      </SlideRow>

      {failed && <ErrorBlock onRetry={reload} />}
      {!data && !failed && <><Skeleton className="h-[92px]" /><Skeleton className="h-[92px]" /><Skeleton className="h-[92px]" /></>}

      {/* Free to collect strip — only when the catalogue has real free vouchers */}
      {data && cat === FILTER_ALL && how === VoucherHowFilter.ALL && where === VoucherWhereFilter.ALL && !partner && !q && free.length > 0 && (
        <section className="flex w-full flex-col gap-2">
          <div className="flex items-end">
            <div className="min-w-0 flex-1">
              <h2 className="text-[16px] font-bold">{t('figma_ui.vouchers.free_strip_title')}</h2>
              <p className="text-[12px] text-slate-500">{t('figma_ui.vouchers.free_strip_sub')}</p>
            </div>
            <button type="button" onClick={() => setCat(FILTER_FREE)} className="h-8 text-[13px] font-semibold text-[#FE810D]">{t('figma_ui.common.see_all')} ›</button>
          </div>
          <SlideRow className="gap-2.5 pb-3">
            {free.map((v) => {
              const st = state(v);
              const vis = visualOfCategory(v.categoryCode);
              const brand = cleanBrand(v.partnerName);
              return (
                <div key={v.id} className="flex w-[158px] shrink-0 flex-col gap-1.5 rounded-[16px] bg-white p-1.5 pb-2.5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
                  <button type="button" onClick={() => open(v)} className="flex flex-col gap-1.5 text-left">
                    <span className="relative h-20 w-full overflow-hidden rounded-[12px]">
                      <img src={photoOf(v)} alt="" className={`size-full object-cover ${st === 'gone' ? 'opacity-50' : ''}`} />
                      {brand && (
                        <span className="absolute left-1.5 top-1.5 inline-flex max-w-[132px] items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-medium text-slate-900 shadow-sm">
                          <vis.Icon className={`size-3 shrink-0 ${vis.iconColor}`} />
                          <span className="truncate">{brand}</span>
                        </span>
                      )}
                    </span>
                    <span className="px-1">
                      <span className={`block truncate text-[15px] font-bold ${st === 'gone' ? 'text-slate-400' : ''}`}>{valueTitle(v)}</span>
                      <span className="block truncate text-[12px] text-slate-500">{conditionText(v)}</span>
                    </span>
                  </button>
                  <div className="flex items-center gap-1 px-1">
                    {st === 'locked' ? (
                      <span className="inline-flex min-w-0 flex-1 items-center gap-1 truncate text-[11.5px] font-semibold text-violet-600">
                        <Lock className="size-3 shrink-0" />
                        <span className="truncate">{(v.eligibleTiers || []).map(nice).join(', ')}</span>
                      </span>
                    ) : (
                      <span className={`min-w-0 flex-1 truncate text-[11.5px] font-semibold ${st === 'use' ? 'text-emerald-700' : 'text-[#E06C00]'}`}>
                        {st === 'use' ? t('figma_ui.vouchers.collected') : v.availableQuantity !== undefined ? t('figma_ui.vouchers.left_count', { count: fmt(v.availableQuantity) }) : ''}
                      </span>
                    )}
                    {st !== 'locked' && <ActionPill small kind={st} onClick={() => (st === 'use' ? navigate(b.mine) : collect(v))} />}
                  </div>
                </div>
              );
            })}
          </SlideRow>
        </section>
      )}

      {data && list.length === 0 && (
        <Empty
          art={artEmptyBox}
          title={q || activeFilterCount > 0 ? t('figma_ui.vouchers.empty_filtered') : t('figma_ui.vouchers.empty_store')}
          text={t('figma_ui.vouchers.empty_store_sub')}
        />
      )}
      {list.map((v) => {
        const isFree = acquireOf(v) === VoucherAcquireTypeEnum.FREE_COLLECT;
        const st = state(v);
        const vis = visualOfCategory(v.categoryCode);
        const catName = categoryLabelOf(v.categoryCode);
        return (
          <ListCard
            key={v.id}
            photo={photoOf(v)}
            tag={cleanBrand(v.partnerName) || undefined}
            tagIcon={v.categoryCode ? <vis.Icon className={`size-3 shrink-0 ${vis.iconColor}`} /> : undefined}
            title={valueTitle(v)}
            sub={conditionText(v)}
            dim={isFree && st === 'gone'}
            onClick={() => open(v)}
            line3={
              isFree ? (
                <Tag tone={st === 'use' ? 'green' : st === 'locked' ? 'purple' : st === 'gone' ? 'grey' : 'orange'}>
                  {st === 'use'
                    ? t('figma_ui.vouchers.collected')
                    : st === 'locked'
                    ? t('figma_ui.vouchers.members_tier', { tiers: (v.eligibleTiers || []).map(nice).join(', ') })
                    : st === 'gone'
                    ? t('figma_ui.vouchers.left_count', { count: '0' })
                    : v.availableQuantity !== undefined
                    ? `${t('figma_ui.common.free')} · ${t('figma_ui.vouchers.left_count', { count: fmt(v.availableQuantity) })}`
                    : t('figma_ui.common.free')}
                </Tag>
              ) : catName ? (
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-semibold ${vis.pillBg} ${vis.pillText}`}>
                  <vis.Icon className="size-3 shrink-0" />
                  <span>{catName}</span>
                </span>
              ) : null
            }
            action={isFree ? <ActionPill kind={st} onClick={() => (st === 'use' ? navigate(b.mine) : collect(v))} /> : <button type="button" onClick={() => open(v)}><PricePill coins={v.pointCost} /></button>}
          />
        );
      })}

      <Sheet open={filters} onClose={() => setFilters(false)} title={t('figma_ui.vouchers.filter_title')} centerTitle>
        <div className="flex flex-col gap-2">
          <p className="text-[14px] font-semibold text-slate-900">{t('figma_ui.vouchers.sort_by')}</p>
          <div className="flex flex-wrap gap-2">
            {SORT_OPTIONS.map(([k, key]) => <Chip key={k} on={sort === k} onClick={() => setSort(k)}>{t(key)}</Chip>)}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-[14px] font-semibold text-slate-900">{t('figma_ui.vouchers.where_to_use')}</p>
          <div className="flex flex-wrap gap-2">
            {WHERE_OPTIONS.map(([k, key]) => <Chip key={k} on={where === k} onClick={() => setWhere(k)}>{t(key)}</Chip>)}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-[14px] font-semibold text-slate-900">{t('figma_ui.vouchers.how_to_get')}</p>
          <div className="flex flex-wrap gap-2">
            {HOW_OPTIONS.map(([k, key]) => <Chip key={k} on={how === k} onClick={() => setHow(k)}>{t(key)}</Chip>)}
          </div>
        </div>

        {filterCategories.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-[14px] font-semibold text-slate-900">{t('figma_ui.vouchers.category')}</p>
            <div className="flex flex-wrap gap-2">
              {filterCategories.map((c) => {
                const on = cat === c.code;
                const vis = visualOfCategory(c.code);
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => setCat(on ? FILTER_ALL : c.code)}
                    className={`flex h-9 items-center gap-1.5 rounded-full pl-1.5 pr-3 text-[13px] ${on ? 'border border-[#FE810D] bg-[#FFF4EA] font-semibold text-[#FE810D]' : 'border border-slate-200 bg-white text-slate-700'}`}
                  >
                    <span className={`flex size-6 items-center justify-center rounded-full ${vis.iconBg}`}>
                      <vis.Icon className={`size-3.5 ${vis.iconColor}`} />
                    </span>
                    <span>{c.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {partners.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-[14px] font-semibold text-slate-900">{t('figma_ui.vouchers.partner')}</p>
              {partners.length > INITIAL_PARTNER_LIMIT && (
                <button type="button" onClick={() => setAllPartnersOpen((o) => !o)} className="text-[12.5px] font-semibold text-[#FE810D]">
                  {allPartnersOpen ? t('figma_ui.common.show_less') : `${t('figma_ui.common.see_all')} ${fmt(partners.length)} ›`}
                </button>
              )}
            </div>
            <label className="flex h-10 w-full items-center gap-2 rounded-[12px] bg-[#F5F5F5] px-3">
              <Search className="size-4 shrink-0 text-slate-400" />
              <input
                value={partnerQ}
                onChange={(e) => setPartnerQ(e.target.value)}
                placeholder={t('figma_ui.vouchers.search_partners')}
                className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-slate-400"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              {visiblePartners.map(({ brand, categoryCode }) => {
                const on = partner === brand;
                const vis = visualOfCategory(categoryCode);
                return (
                  <button
                    key={brand}
                    type="button"
                    onClick={() => setPartner(on ? null : brand)}
                    className={`flex h-9 items-center gap-1.5 rounded-full pl-1.5 pr-3 text-[13px] ${on ? 'border border-[#FE810D] bg-[#FFF4EA] font-semibold text-[#FE810D]' : 'border border-slate-200 bg-white text-slate-700'}`}
                  >
                    <span className={`flex size-6 items-center justify-center rounded-full ${vis.iconBg}`}>
                      <vis.Icon className={`size-3.5 ${vis.iconColor}`} />
                    </span>
                    <span>{brand}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <p className="text-[14px] font-semibold text-slate-900">{t('figma_ui.vouchers.coins_section')}</p>
          <div className="flex items-center justify-between gap-3 py-1 text-[14px]">
            <span className="min-w-0 flex-1 text-slate-700">
              {data ? t('figma_ui.vouchers.only_affordable_with_coins', { coins: fmt(data.coins) }) : t('figma_ui.vouchers.only_affordable')}
            </span>
            <Switch label={t('figma_ui.vouchers.only_affordable')} on={affordable} onChange={setAffordable} />
          </div>
        </div>

        <div className="flex w-full gap-2.5 pt-2">
          <SecondaryButton className="w-[112px] shrink-0" onClick={resetFilters}>{t('figma_ui.common.reset')}</SecondaryButton>
          <PrimaryButton className="flex-1" onClick={() => setFilters(false)}>
            {t(list.length === 1 ? 'figma_ui.vouchers.show_count_one' : 'figma_ui.vouchers.show_count_other', { count: fmt(list.length) })}
          </PrimaryButton>
        </div>
      </Sheet>
      <Toast text={toast} action={toast === savedToastText ? t('figma_ui.common.view') : undefined} onAction={() => navigate(b.mine)} />
    </Screen>
  );
};

type Result = null | 'added' | 'data' | 'pending' | 'short' | 'soldout' | 'failed';

const TERMS_PREVIEW_BULLETS = 3;
const STORES_PREVIEW_COUNT = 3;

const parseTermsLines = (text?: string, extra?: string): string[] => {
  const lines = (text || '')
    .split(/\n+|•|;/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (extra) lines.push(extra);
  return lines;
};

const filterStoresForVoucher = (
  locations: PartnerLocationItem[],
  v: { partnerId?: number; partnerCode?: string; partnerName?: string; branchScope?: string; usageType?: VoucherUsageType },
): PartnerLocationItem[] => {
  if (usageOf(v) === VoucherUsageTypeEnum.ONLINE) return [];
  const brand = cleanBrand(v.partnerName).toLowerCase();
  const branchSet = v.branchScope
    ? new Set(
        v.branchScope
          .split(',')
          .map((s) => s.trim().toUpperCase())
          .filter(Boolean),
      )
    : null;
  return locations.filter((loc) => {
    if (loc.status === CommonStatus.INACTIVE) return false;
    const partnerMatch =
      (v.partnerId !== undefined && loc.partnerId === v.partnerId) ||
      (!!v.partnerCode && !!loc.partnerCode && loc.partnerCode.toUpperCase() === v.partnerCode.toUpperCase()) ||
      (!!brand && cleanBrand(loc.partnerName).toLowerCase() === brand);
    if (!partnerMatch) return false;
    if (branchSet && branchSet.size > 0) {
      return !!loc.branchCode && branchSet.has(loc.branchCode.trim().toUpperCase());
    }
    return true;
  });
};

const VoucherTermsCard: React.FC<{ lines: string[] }> = ({ lines }) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  if (lines.length === 0) return null;
  const collapsible = lines.length > TERMS_PREVIEW_BULLETS;
  const visible = collapsible && !expanded ? lines.slice(0, TERMS_PREVIEW_BULLETS) : lines;
  return (
    <div className="w-full rounded-[16px] bg-white p-4 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
      <h3 className="text-[16px] font-semibold text-slate-900">{t('figma_ui.vouchers.terms_of_use')}</h3>
      <ul className="mt-2 flex flex-col gap-1.5 text-[13px] leading-5 text-slate-600">
        {visible.map((line) => (
          <li key={line} className="flex items-start gap-2">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-slate-800" />
            <span>{line}</span>
          </li>
        ))}
      </ul>
      {collapsible && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="mt-3 flex w-full items-center justify-center text-[13px] font-semibold text-[#FE810D]"
        >
          {expanded ? t('figma_ui.common.see_less') : `${t('figma_ui.common.see_more')} ›`}
        </button>
      )}
    </div>
  );
};

const HowToUseRow: React.FC<{ usageType: VoucherUsageType }> = ({ usageType }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-[16px] bg-white px-4 py-3.5 text-left shadow-[0_2px_10px_rgba(0,0,0,0.04)]"
      >
        <HelpCircle className="size-5 shrink-0 text-slate-700" />
        <span className="flex-1 text-[15px] font-medium text-slate-900">{t('figma_ui.vouchers.how_to_use')}</span>
        <ChevronRight className="size-5 shrink-0 text-slate-400" />
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title={t('figma_ui.vouchers.how_to_use')}>
        <p className="text-[14px] leading-6 text-slate-600">{t(HOW_TO_USE_KEY[usageType])}</p>
      </Sheet>
    </>
  );
};

const VoucherStoresSection: React.FC<{ stores: PartnerLocationItem[] }> = ({ stores }) => {
  const { t } = useTranslation();
  const [allOpen, setAllOpen] = useState(false);
  if (stores.length === 0) return null;
  const preview = stores.slice(0, STORES_PREVIEW_COUNT);
  const renderRow = (loc: PartnerLocationItem) => (
    <div key={loc.id} className="flex w-full items-center gap-3 rounded-[16px] bg-white p-3.5 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#FFF3E5]">
        <MapPin className="size-5 text-[#FE810D]" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-semibold text-slate-900">{loc.branchName || loc.partnerName}</p>
        {(loc.address || loc.province) && (
          <p className="truncate text-[12px] text-slate-500">{[loc.address, loc.province].filter(Boolean).join(' · ')}</p>
        )}
      </div>
    </div>
  );
  return (
    <section className="flex w-full flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <h3 className="text-[16px] font-bold text-slate-900">{t('figma_ui.vouchers.stores_count', { count: fmt(stores.length) })}</h3>
        {stores.length > STORES_PREVIEW_COUNT && (
          <button type="button" onClick={() => setAllOpen(true)} className="text-[13px] font-semibold text-[#FE810D]">
            {t('figma_ui.common.see_all')}
          </button>
        )}
      </div>
      <div className="flex flex-col gap-2">{preview.map(renderRow)}</div>
      <Sheet open={allOpen} onClose={() => setAllOpen(false)} title={t('figma_ui.vouchers.stores_count', { count: fmt(stores.length) })}>
        <div className="flex flex-col gap-2">{stores.map(renderRow)}</div>
      </Sheet>
    </section>
  );
};

// ───────────────────────── VQ-02 · Voucher details (Figma 330:248, free 818:60) ─────────────────────────
export const RewardDetail: React.FC<{ shell?: Shell }> = ({ shell = 'customer' }) => {
  const { id = '' } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const b = voucherBase(shell);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result>(null);
  const [issued, setIssued] = useState<UserVoucherItem>();
  const [collectedNow, setCollectedNow] = useState(false);
  const [toast, setToast] = useToast();
  const [data, failed, reload] = useLoad(async () => {
    const userId = uid();
    const [p, c, mine, locations] = await Promise.all([
      userId ? LoyaltyApi.getProfile(userId).catch(() => null) : Promise.resolve(null),
      LoyaltyApi.getVoucherCatalog(audienceOf(shell)),
      userId ? LoyaltyApi.getUserVouchers(userId).catch(() => [] as UserVoucherItem[]) : Promise.resolve([] as UserVoucherItem[]),
      LoyaltyApi.getWhereToUsePartners().catch(() => [] as PartnerLocationItem[]),
    ]);
    return { isGuest: !userId, coins: p?.currentPoints || 0, tier: p?.tier?.code || '', v: c.find((x) => String(x.id) === id), mine, locations };
  }, [id]);
  const v = data?.v;
  const free = v ? acquireOf(v) === VoucherAcquireTypeEnum.FREE_COLLECT : false;
  const owned = collectedNow || !!(v && data?.mine.some((m) => m.voucherCode === v.voucherCode && userState(m) !== 'used'));
  const locked = !!v?.eligibleTiers?.length && !v.eligibleTiers.includes(data?.tier || '');
  const soldOut = v?.availableQuantity === 0;
  const savedToastText = t('figma_ui.vouchers.saved_toast');

  const conditionText = (item: CatalogVoucherItem) =>
    item.minBillAmount
      ? t('figma_ui.vouchers.bills_from', { amount: fmt(item.minBillAmount), currency: CurrencyCode.HTG })
      : item.title !== valueTitle(item)
      ? item.title
      : item.description || '';

  const getVoucher = async () => {
    if (!v || !data) return;
    const userId = uid();
    if (!userId) {
      setToast(t('sso.guest_login_required_desc'));
      return;
    }
    if (data.coins < v.pointCost) return setResult('short');
    setBusy(true);
    try {
      const item = await LoyaltyApi.redeemVoucher(userId, v.voucherCode);
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
    const userId = uid();
    if (!userId) {
      setToast(t('sso.guest_login_required_desc'));
      return;
    }
    setBusy(true);
    try {
      await LoyaltyApi.collectVoucher(userId, v.voucherCode);
      setCollectedNow(true);
      setToast(savedToastText);
    } catch {
      setToast(t('figma_ui.vouchers.collect_failed_toast'));
    } finally {
      setBusy(false);
    }
  };

  const validity = v
    ? free && v.validDaysAfterCollect
      ? t('figma_ui.vouchers.valid_days_after_collect', { days: v.validDaysAfterCollect })
      : v.endDate
      ? t('figma_ui.vouchers.valid_until', { date: ddmmyyyy(v.endDate) })
      : ''
    : '';

  const brand = v ? cleanBrand(v.partnerName) : '';
  const termsLines = useMemo(
    () =>
      v
        ? parseTermsLines(
            v.terms || v.description,
            free && v.perCustomerLimit ? t('figma_ui.vouchers.per_customer_limit', { count: v.perCustomerLimit }) : undefined,
          )
        : [],
    [v, free, t],
  );
  const stores = useMemo(() => (v ? filterStoresForVoucher(data?.locations || [], v) : []), [data, v]);

  return (
    <>
      <Screen title={t('figma_ui.vouchers.voucher_details')} cover={v ? photoOf(v) : undefined}>
        {failed && <ErrorBlock onRetry={reload} />}
        {!data && !failed && <Skeleton className="h-[360px]" />}
        {data && !v && <Empty art={artEmptyBox} title={t('figma_ui.vouchers.not_available')} />}
        {v && (
          <>
            <div className="flex w-full flex-col items-center gap-1 rounded-[16px] bg-white p-4 text-center shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
              <h2 className="text-[26px] font-bold leading-8">{valueTitle(v)}</h2>
              {conditionText(v) && <p className="text-[14px] text-slate-600">{conditionText(v)}</p>}
              {validity && <p className="text-[13px] text-[#FE810D]">{validity}</p>}
              <div className="mt-3 flex w-full items-center gap-2 border-t border-dashed border-slate-200 pt-3 text-left text-[14px]">
                {brand && <span className="flex size-6 items-center justify-center rounded-full bg-emerald-50 text-[11px] font-bold text-emerald-700">{brand.slice(0, 1)}</span>}
                <span className="flex-1">{brand}</span>
                <span className="text-slate-400">{usageOf(v) === VoucherUsageTypeEnum.ONLINE ? t('figma_ui.vouchers.where_online') : t('figma_ui.vouchers.where_at_store')}</span>
              </div>
            </div>
            <VoucherTermsCard lines={termsLines} />
            <HowToUseRow usageType={usageOf(v)} />
            <VoucherStoresSection stores={stores} />
            <div className="h-[84px]" />
            <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-100 bg-white">
              <div className="mx-auto flex w-full max-w-[430px] items-center gap-3 px-4 pb-[max(14px,env(safe-area-inset-bottom))] pt-3">
                <div className="min-w-0 flex-1">
                  {free ? (
                    <p className={`text-[20px] font-bold ${owned ? 'text-emerald-700' : 'text-[#FE810D]'}`}>{owned ? t('figma_ui.vouchers.collected_check') : t('figma_ui.common.free')}</p>
                  ) : (
                    <p className="flex items-center gap-1 text-[20px] font-bold text-[#FE810D]"><CoinDot className="size-5" />{fmt(v.pointCost)}</p>
                  )}
                  <p className="truncate text-[12px] text-slate-500">
                    {free
                      ? locked
                        ? t('figma_ui.vouchers.tiers_only', { tiers: (v.eligibleTiers || []).map(nice).join(', ') })
                        : v.availableQuantity !== undefined
                        ? t('figma_ui.vouchers.left_count', { count: fmt(v.availableQuantity) })
                        : t('figma_ui.vouchers.while_stock_lasts')
                      : data?.isGuest
                      ? t('sso.guest_login_required')
                      : t('figma_ui.vouchers.balance_coins', { coins: fmt(data!.coins) })}
                  </p>
                </div>
                {free && locked ? (
                  <button type="button" onClick={() => navigate('/tiers')} className="h-12 min-w-[150px] rounded-[14px] border border-[#FE810D] px-5 text-[15px] font-semibold text-[#FE810D]">{t('figma_ui.vouchers.see_member_tiers')}</button>
                ) : free && owned ? (
                  <button type="button" onClick={() => navigate(b.mine)} className="h-12 min-w-[150px] rounded-[14px] bg-[#FE810D] px-5 text-[15px] font-semibold text-white">{t('figma_ui.vouchers.use_voucher')}</button>
                ) : (
                  <button
                    type="button"
                    disabled={busy || soldOut}
                    onClick={free ? collect : getVoucher}
                    className="h-12 min-w-[150px] rounded-[14px] bg-[#FE810D] px-5 text-[15px] font-semibold text-white disabled:opacity-50"
                  >
                    {soldOut
                      ? free
                        ? t('figma_ui.vouchers.all_gone')
                        : t('figma_ui.vouchers.sold_out')
                      : busy
                      ? t('figma_ui.common.please_wait')
                      : free
                      ? t('figma_ui.vouchers.collect')
                      : t('figma_ui.vouchers.get_voucher')}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </Screen>

      <Popup open={!!result} onClose={() => setResult(null)}>
        <img src={result === 'added' || result === 'data' ? artGift : result === 'pending' ? artHourglass : artEmptyBox} alt="" className="size-24 object-contain" />
        <h2 className="text-[19px] font-semibold">
          {t(
            {
              added: 'figma_ui.vouchers.result_added',
              data: 'figma_ui.vouchers.result_data',
              pending: 'figma_ui.vouchers.result_pending',
              short: 'figma_ui.vouchers.result_short',
              soldout: 'figma_ui.vouchers.result_soldout',
              failed: 'figma_ui.vouchers.result_failed',
            }[result || 'failed'],
          )}
        </h2>
        <p className="text-[13px] leading-5 text-slate-500">
          {result === 'added' &&
            (issued?.validUntil
              ? t('figma_ui.vouchers.result_added_valid_desc', { title: v ? valueTitle(v) : '', date: ddmmyyyy(issued.validUntil) })
              : t('figma_ui.vouchers.result_added_desc', { title: v ? valueTitle(v) : '' }))}
          {result === 'data' && t('figma_ui.vouchers.result_data_desc')}
          {result === 'pending' && t('figma_ui.vouchers.result_pending_desc', { partner: v?.partnerName || '' })}
          {result === 'short' && v && data && t('figma_ui.vouchers.result_short_desc', { coins: fmt(v.pointCost - data.coins) })}
          {result === 'soldout' && t('figma_ui.vouchers.result_soldout_desc')}
          {result === 'failed' && t('figma_ui.vouchers.result_failed_desc')}
        </p>
        <div className="mt-2 flex w-full flex-col gap-2">
          {(result === 'added' || result === 'data' || result === 'pending') && <PrimaryButton onClick={() => navigate(b.mine)}>{t('figma_ui.vouchers.go_to_my_vouchers')}</PrimaryButton>}
          {result === 'short' && <PrimaryButton onClick={() => navigate(shell === 'customer' ? '/missions' : '/agent/missions')}>{t('figma_ui.vouchers.earn_coins')}</PrimaryButton>}
          <SecondaryButton onClick={() => navigate(b.store)}>{t('figma_ui.vouchers.back_to_store')}</SecondaryButton>
        </div>
      </Popup>
      <Toast text={toast} action={toast === savedToastText ? t('figma_ui.common.view') : undefined} onAction={() => navigate(b.mine)} />
    </>
  );
};

type MineTab = 'all' | 'ready' | 'used' | 'expired';

// ───────────────────────── VQ-03 · My vouchers (Figma 330:250) ─────────────────────────
export const MyVouchers: React.FC<{ shell?: Shell }> = ({ shell = 'customer' }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const b = voucherBase(shell);
  const [q, setQ] = useState('');
  const [tab, setTab] = useState<MineTab>('all');
  const [data, failed, reload] = useLoad(async () => {
    const userId = uid();
    if (!userId) return { isGuest: true, coins: undefined, mine: [] as UserVoucherItem[] };
    const [p, mine] = await Promise.all([LoyaltyApi.getProfile(userId).catch(() => null), LoyaltyApi.getUserVouchers(userId)]);
    return { isGuest: false, coins: p?.currentPoints, mine };
  });
  const all = data?.mine || [];
  const count = (tabKey: MineTab) => (tabKey === 'all' ? all.length : all.filter((v) => (tabKey === 'ready' ? ['ready', 'pending'] : [tabKey]).includes(userState(v))).length);
  const list = all
    .filter((v) => tab === 'all' || (tab === 'ready' ? ['ready', 'pending'] : [tab]).includes(userState(v)))
    .filter((v) => `${v.title} ${v.partnerName || ''}`.toLowerCase().includes(q.toLowerCase()));

  const tabs: [MineTab, string][] = [
    ['all', 'figma_ui.common.all'],
    ['ready', 'figma_ui.vouchers.tab_ready'],
    ['used', 'figma_ui.vouchers.tab_used'],
    ['expired', 'figma_ui.vouchers.tab_expired'],
  ];

  return (
    <Screen title={t('figma_ui.vouchers.my_vouchers')} back={shell === 'customer' ? '/' : '/agent'} tab={{ shell, active: 'vouchers' }} hero={<VoucherHero shell={shell} active="mine" coins={data?.coins} mine={count('ready')} />}>
      <label className="flex h-11 w-full items-center gap-2 rounded-[14px] bg-white px-3.5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
        <Search className="size-[18px] text-slate-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('figma_ui.vouchers.search_my_placeholder')} className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-slate-400" />
      </label>
      <SlideRow>
        {tabs.map(([k, key]) => (
          <Chip key={k} on={tab === k} onClick={() => setTab(k)}>
            {t(key)}
            {count(k) > 0 && k !== 'used' && <span className="text-[12px] font-normal text-slate-400">{count(k)}</span>}
          </Chip>
        ))}
      </SlideRow>
      {failed && <ErrorBlock onRetry={reload} />}
      {!data && !failed && <><Skeleton className="h-[92px]" /><Skeleton className="h-[92px]" /></>}
      {data && list.length === 0 && (
        <Empty
          art={artEmptyBox}
          title={data.isGuest ? t('sso.guest_login_required') : tab === 'all' ? t('figma_ui.vouchers.empty_mine') : t('figma_ui.vouchers.empty_mine_tab')}
          text={data.isGuest ? t('sso.guest_login_required_desc') : t('figma_ui.vouchers.empty_mine_sub')}
        >
          <PrimaryButton className="mt-3" onClick={() => navigate(b.store)}>{t('figma_ui.vouchers.open_store')}</PrimaryButton>
        </Empty>
      )}
      {list.map((v) => {
        const st = userState(v);
        const vis = visualOfCategory(v.category);
        const dateLabel = ddmmyyyy(v.validUntil) || v.validUntil || '';
        return (
          <ListCard
            key={v.id}
            photo={photoOf(v)}
            tag={cleanBrand(v.partnerName) || undefined}
            tagIcon={v.category ? <vis.Icon className={`size-3 shrink-0 ${vis.iconColor}`} /> : undefined}
            title={userValueTitle(v)}
            sub={userCondition(v) || v.partnerName}
            dim={st === 'used' || st === 'expired'}
            onClick={() => navigate(`${b.mine}/${v.id}`)}
            line3={
              <span className={`flex items-center gap-1 text-[12px] ${st === 'expired' ? 'text-red-600' : 'text-slate-500'}`}>
                <CalendarDays className="size-3.5" />
                {st === 'used'
                  ? t('figma_ui.vouchers.status_used')
                  : st === 'pending'
                  ? t('figma_ui.vouchers.status_activating')
                  : st === 'expired'
                  ? t('figma_ui.vouchers.expired_on', { date: dateLabel })
                  : t('figma_ui.vouchers.valid_until', { date: dateLabel })}
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
  const { t } = useTranslation();
  const [data, failed, reload] = useLoad(async () => {
    const userId = uid();
    const [mine, locations] = await Promise.all([
      userId ? LoyaltyApi.getUserVouchers(userId).catch(() => [] as UserVoucherItem[]) : Promise.resolve([] as UserVoucherItem[]),
      LoyaltyApi.getWhereToUsePartners().catch(() => [] as PartnerLocationItem[]),
    ]);
    return { v: mine.find((x) => String(x.id) === id), locations };
  }, [id]);
  const v = data?.v;
  const st = v ? userState(v) : 'ready';
  const brand = v ? cleanBrand(v.partnerName) : '';
  const dateLabel = v ? ddmmyyyy(v.validUntil) || v.validUntil || '' : '';
  const termsLines = useMemo(() => (v ? parseTermsLines(v.terms) : []), [v]);
  const stores = useMemo(() => (v ? filterStoresForVoucher(data?.locations || [], v) : []), [data, v]);
  return (
    <Screen
      title={t('figma_ui.vouchers.my_voucher')}
      cover={v ? photoOf(v) : undefined}
      coverClass={st === 'ready' || st === 'pending' ? '' : 'grayscale'}
    >
      {failed && <ErrorBlock onRetry={reload} />}
      {!data && !failed && <Skeleton className="h-[360px]" />}
      {data && !v && <Empty art={artEmptyBox} title={t('figma_ui.vouchers.not_found')} />}
      {v && (
        <>
          <div className="flex w-full flex-col items-center gap-1 rounded-[16px] bg-white p-4 text-center shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
            <h2 className="text-[26px] font-bold leading-8">{userValueTitle(v)}</h2>
            {userCondition(v) && <p className="text-[14px] text-slate-600">{userCondition(v)}</p>}
            <p className={`text-[13px] ${st === 'expired' ? 'text-red-600' : 'text-[#FE810D]'}`}>
              {st === 'used'
                ? t('figma_ui.vouchers.status_used')
                : st === 'pending'
                ? t('figma_ui.vouchers.status_activating')
                : st === 'expired'
                ? t('figma_ui.vouchers.expired_on', { date: dateLabel })
                : t('figma_ui.vouchers.valid_until', { date: dateLabel })}
            </p>
            <div className="mt-3 flex w-full items-center gap-2 border-t border-dashed border-slate-200 pt-3 text-left text-[14px]">
              {brand && <span className="flex size-6 items-center justify-center rounded-full bg-emerald-50 text-[11px] font-bold text-emerald-700">{brand.slice(0, 1)}</span>}
              <span className="flex-1">{brand}</span>
              <span className="text-slate-400">{usageOf(v) === VoucherUsageTypeEnum.ONLINE ? t('figma_ui.vouchers.where_online') : t('figma_ui.vouchers.where_at_store')}</span>
            </div>
          </div>
          <VoucherTermsCard lines={termsLines} />
          <HowToUseRow usageType={usageOf(v)} />
          <VoucherStoresSection stores={stores} />
          {st === 'ready' && (
            <>
              <div className="h-[76px]" />
              <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-100 bg-white">
                <div className="mx-auto w-full max-w-[430px] px-4 pb-[max(14px,env(safe-area-inset-bottom))] pt-3">
                  <PrimaryButton onClick={() => openUse(navigate, shell, v)}>{t('figma_ui.vouchers.use_voucher')}</PrimaryButton>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </Screen>
  );
};

/** QR / Barcode tabs (QR by default) with the digits always shown. */
export const CodeTabs: React.FC<{ value: string; digits?: string }> = ({ value, digits }) => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'qr' | 'bar'>('qr');
  const shown = digits ?? (value.length <= 24 ? value : '');
  return (
    <div className="flex w-full flex-col items-center gap-3">
      <div role="tablist" className="flex rounded-full bg-slate-100 p-1">
        {(['qr', 'bar'] as const).map((m) => (
          <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => setMode(m)} className={`h-8 rounded-full px-5 text-[13px] font-semibold ${mode === m ? 'bg-white text-[#FE810D] shadow-sm' : 'text-slate-500'}`}>
            {m === 'qr' ? t('figma_ui.vouchers.qr_code') : t('figma_ui.vouchers.barcode')}
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

const formatMmSs = (seconds: number) => {
  const s = Math.max(0, seconds);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

// ───────────────────────── VQ-03 · Show dynamic 5-min partner/online code ─────────────────────────
export const ShowVoucher: React.FC = () => {
  const { id = '' } = useParams();
  const { t } = useTranslation();
  const [useCode, setUseCode] = useState<VoucherUseCodeResponse | null>(null);
  const [left, setLeft] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [failed, setFailed] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const issueDynamicCode = React.useCallback(async () => {
    const userId = uid();
    if (!userId || !id) {
      setLoading(false);
      setFailed(true);
      return;
    }
    setLoading(true);
    setFailed(false);
    try {
      const res = await LoyaltyApi.useVoucher(userId, id);
      setUseCode(res);
      const diff = res.expiresAt
        ? Math.max(0, Math.floor((new Date(res.expiresAt).getTime() - Date.now()) / 1000))
        : res.expiresInSeconds;
      setLeft(diff > 0 ? diff : res.expiresInSeconds || 300);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    void issueDynamicCode();
  }, [issueDynamicCode]);

  React.useEffect(() => {
    if (!useCode) return;
    const tmr = setInterval(() => {
      setLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(tmr);
  }, [useCode?.dynamicCode]);

  const expired = Boolean(useCode && left <= 0);
  const handleCopy = () => {
    if (!useCode || expired) return;
    navigator.clipboard.writeText(useCode.dynamicCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Screen title={t('figma_ui.vouchers.show_code')}>
      {failed && <ErrorBlock onRetry={() => void issueDynamicCode()} />}
      {loading && !failed && <Skeleton className="h-[420px]" />}
      {!loading && !failed && !useCode && <Empty art={artEmptyBox} title={t('figma_ui.vouchers.not_found')} />}
      {!loading && useCode && (
        <div className="flex w-full flex-col items-center gap-3 rounded-[16px] bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <div className="w-full text-center">
            {cleanBrand(useCode.partnerName) && <p className="text-[13px] text-slate-500">{cleanBrand(useCode.partnerName)}</p>}
            <p className="text-[22px] font-bold">{useCode.discountText || useCode.voucherTitle}</p>
            <p className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-[#FFF4EA] px-3 py-1 text-[12px] font-semibold text-[#E06C00]">
              <Clock className="size-3.5" />
              {expired ? t('vouchers.dynamic_expired_badge') : `${t('vouchers.dynamic_valid_for')} ${formatMmSs(left)}`}
            </p>
          </div>

          {expired ? (
            <div className="flex w-full flex-col items-center gap-3 rounded-[14px] bg-slate-50 p-6 text-center">
              <p className="text-[13px] font-medium text-rose-600">{t('vouchers.dynamic_code_expired_desc')}</p>
              <PrimaryButton onClick={() => void issueDynamicCode()}>
                <span className="inline-flex items-center gap-1.5">
                  <RefreshCw className="size-4" />
                  {t('vouchers.regenerate_dynamic_code')}
                </span>
              </PrimaryButton>
            </div>
          ) : (
            <>
              <CodeTabs value={useCode.dynamicCode} digits={useCode.dynamicCode} />
              <div className="flex w-full items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-100"
                >
                  {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
                  <span>{copied ? t('common.copied') : t('common.copy')}</span>
                </button>
                {useCode.usageType === VoucherUsageTypeEnum.ONLINE && useCode.serviceLink && (
                  <button
                    type="button"
                    onClick={() => LoyaltyJSBridge.openService(useCode.serviceLink || '', useCode.dynamicCode)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#FE810D] px-4 py-1.5 text-[13px] font-semibold text-white"
                  >
                    {t('figma_ui.vouchers.use_voucher')}
                  </button>
                )}
              </div>
              <p className="text-center text-[12px] text-slate-500">{t('vouchers.dynamic_code_ttl_hint')}</p>
            </>
          )}
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
