import React, { useMemo, useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Search, Copy, ShieldCheck, ChevronRight } from 'lucide-react';
import { LoyaltyApi, getDefaultUserId, type CatalogVoucherItem, type UserVoucherItem } from '../../services/api';
import { generateBarcode128Svg } from '../../utils/barcode128';
import {
  Screen, SectionHeader, Skeleton, ErrorBlock, PrimaryButton, SecondaryButton, ResultBlock, InfoRows, Empty, useLoad, fmt, ddmmyyyy,
} from '../ui';
import { QrCode } from '../qr';
import { artGift, artHourglass, artEmptyBox, partnerPhoto } from '../art';

const uid = () => getDefaultUserId();

export const cleanBrand = (raw?: string) =>
  (raw || 'Natcom')
    .replace(/\s*\(.*?\)/g, '')
    .replace(/\s+(Telecom|Mobile E-Wallet|Supermarket|Store|Group).*$/i, '')
    .trim() || 'Natcom';

export const formatVoucherValidity = (v: CatalogVoucherItem) => {
  const durationMatch = v.title.match(/\((\d+\s*(?:Hours?|Days?|Giờ|Ngày))\)/i);
  if (durationMatch) {
    return durationMatch[1].toLowerCase();
  }
  if (v.endDate) {
    const days = Math.ceil((new Date(v.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (days > 0 && days <= 60) {
      return `${days} days`;
    }
  }
  return '30 days after redeeming';
};

const Barcode: React.FC<{ value: string }> = ({ value }) => (
  <div className="w-full" dangerouslySetInnerHTML={{ __html: generateBarcode128Svg(value, 64) }} />
);

/** QR + Code128 + typed code, as on VQ-02 result and VQ-03 "Show at checkout". */
const ScanBlock: React.FC<{ code: string; title?: string }> = ({ code, title = 'Scan at the counter' }) => (
  <div className="flex w-full flex-col items-center gap-3 rounded-[20px] bg-white p-4">
    <div className="w-full">
      <p className="text-[14px] font-semibold">{title}</p>
      <p className="text-[12px] text-slate-500">The cashier scans the QR or the barcode</p>
    </div>
    <QrCode value={code} size={150} />
    <Barcode value={code} />
    <p className="text-[18px] font-semibold tracking-wide">{code}</p>
  </div>
);

// ───────────────────────── VQ-01 · Reward store ─────────────────────────
export const RewardStore: React.FC = () => {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [data, failed, reload] = useLoad(async () => {
    const [p, c, mine] = await Promise.all([
      LoyaltyApi.getProfile(uid()),
      LoyaltyApi.getVoucherCatalog(),
      LoyaltyApi.getUserVouchers(uid()).catch(() => [] as UserVoucherItem[]),
    ]);
    return { coins: p.currentPoints || 0, catalog: c.filter((v) => v.status !== 'INACTIVE'), mine: mine.length };
  });
  const list = useMemo(
    () => (data?.catalog || []).filter((v) => `${v.title} ${v.partnerName}`.toLowerCase().includes(q.toLowerCase())),
    [data, q],
  );
  const [hero, ...rest] = list;

  const heroFormat = useMemo(() => {
    if (!hero) return null;
    const brand = cleanBrand(hero.partnerName);
    const dataMatch = hero.title.match(/(\d+\s*(?:GB|MB))/i);
    let heroText = '';
    let subText = '';
    const isData = !!dataMatch || /data|telecom/i.test(hero.title);

    if (dataMatch) {
      heroText = dataMatch[1].toUpperCase().replace(/(\d+)([A-Z]+)/, '$1 $2');
      subText = 'High-speed 4G data';
    } else if (hero.discountType === 'PERCENT' || hero.discountType === 'PERCENTAGE') {
      heroText = `${hero.discountValue}%`;
      subText = hero.minBillAmount ? `Off bills from ${fmt(hero.minBillAmount)} HTG` : 'Discount voucher';
    } else {
      heroText = `${fmt(hero.discountValue)} HTG`;
      subText = hero.minBillAmount ? `Off bills from ${fmt(hero.minBillAmount)} HTG` : hero.title;
    }

    return { brand, heroText, subText, isData };
  }, [hero]);

  return (
    <Screen title="Reward store" back="/">
      <div className="flex items-center">
        <h2 className="flex-1 text-[24px] font-bold text-slate-900">Rewards</h2>
        {data && (
          <span className="rounded-full bg-[#FFF5EA] px-3.5 py-1.5 text-[13px] font-bold text-brand shadow-sm">
            {fmt(data.coins)} coins
          </span>
        )}
      </div>

      <label className="flex h-12 w-full items-center gap-2.5 rounded-[16px] bg-white px-4 shadow-[0_2px_8px_rgba(15,23,42,0.03)]">
        <Search className="size-[18px] text-slate-400 shrink-0" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search rewards or brands"
          className="min-w-0 flex-1 bg-transparent text-[14px] font-medium text-slate-900 outline-none placeholder:text-slate-400"
        />
      </label>

      <div className="grid w-full grid-cols-2 gap-2.5">
        <button
          type="button"
          className="h-11 rounded-[16px] bg-brand text-[14px] font-bold text-white shadow-[0_4px_12px_rgba(255,134,0,0.25)]"
        >
          Redeem
        </button>
        <button
          type="button"
          onClick={() => navigate('/my-vouchers')}
          className="h-11 rounded-[16px] border border-slate-200 bg-white text-[14px] font-bold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          My vouchers{data ? ` · ${data.mine}` : ''}
        </button>
      </div>

      {failed && <ErrorBlock onRetry={reload} />}
      {!data && !failed && <Skeleton className="h-[200px]" />}
      {data && list.length === 0 && (
        <Empty art={artEmptyBox} title={q ? 'No rewards match your search' : 'No rewards yet'} text="New partner rewards are added every week." />
      )}

      {hero && (
        <button
          type="button"
          onClick={() => navigate(`/rewards/${hero.id}`)}
          className="flex w-full flex-col overflow-hidden rounded-[24px] bg-white text-left shadow-[0_2px_12px_rgba(15,23,42,0.04)] hover:shadow-md transition-shadow"
        >
          <div
            className={`relative h-[156px] w-full ${
              heroFormat?.isData
                ? 'bg-gradient-to-r from-[#EBF7FD] via-[#E1F3FB] to-[#CDE9F7]'
                : 'bg-gradient-to-r from-[#FFF5EC] via-[#FFF8F2] to-[#FFEFE2]'
            }`}
          >
            <img
              src={partnerPhoto(`${hero.partnerName} ${hero.title}`)}
              alt=""
              className="absolute inset-y-0 right-0 h-full w-[58%] object-cover [mask-image:linear-gradient(to_right,transparent,black_25%)]"
            />
            <div className="relative flex h-full flex-col justify-center gap-0.5 p-5">
              <span className="text-[13px] font-bold text-[#FF8600]">{heroFormat?.brand}</span>
              <span className="my-1 text-[32px] font-extrabold leading-none tracking-tight text-slate-900">
                {heroFormat?.heroText}
              </span>
              <span className="text-[12px] font-medium text-slate-500">{heroFormat?.subText}</span>
            </div>
          </div>
          <div className="flex items-center justify-between p-4">
            <div className="flex flex-col">
              <span className="text-[11px] font-medium text-slate-400">Coins needed</span>
              <span className="text-[20px] font-extrabold text-brand leading-tight">{fmt(hero.pointCost)} coins</span>
            </div>
            <span className="flex h-10 items-center justify-center rounded-[16px] bg-brand px-8 text-[14px] font-bold text-white shadow-[0_4px_12px_rgba(255,134,0,0.25)]">
              View
            </span>
          </div>
        </button>
      )}

      {rest.length > 0 && <SectionHeader title="More partner rewards" />}

      {rest.map((v) => {
        const brand = cleanBrand(v.partnerName);
        const validity = formatVoucherValidity(v);
        return (
          <button
            key={v.id}
            type="button"
            onClick={() => navigate(`/rewards/${v.id}`)}
            className="flex w-full items-center gap-3.5 rounded-[22px] bg-white p-3.5 text-left shadow-[0_2px_8px_rgba(15,23,42,0.03)] hover:shadow-md transition-all active:scale-[0.99]"
          >
            <img
              src={partnerPhoto(`${v.partnerName} ${v.title}`)}
              alt=""
              className="size-[80px] rounded-[18px] object-cover shrink-0"
            />
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-[11px] font-medium text-slate-400">{brand}</span>
              <span className="text-[14px] font-bold text-slate-900 leading-snug line-clamp-1">{v.title}</span>
              <span className="text-[11px] font-normal text-slate-400">{validity}</span>
              <span className="mt-0.5 text-[14px] font-extrabold text-brand">{fmt(v.pointCost)} coins</span>
            </span>
            <ChevronRight className="size-4 text-slate-300 shrink-0" />
          </button>
        );
      })}

      <div className="flex items-center gap-2.5 rounded-[18px] bg-[#FFF8EE] border border-[#FFE7CC]/70 p-3.5 text-[11px] font-medium text-slate-600">
        <ShieldCheck className="size-4 shrink-0 text-brand" />
        <span>Check conditions, validity and coins before you confirm.</span>
      </div>
    </Screen>
  );
};

// ───────────────────────── VQ-02 · Reward details ─────────────────────────
export const RewardDetail: React.FC = () => {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [data, failed, reload] = useLoad(async () => {
    const [p, c] = await Promise.all([LoyaltyApi.getProfile(uid()), LoyaltyApi.getVoucherCatalog()]);
    return { coins: p.currentPoints || 0, v: c.find((x) => String(x.id) === id) };
  }, [id]);
  const v = data?.v;
  const after = (data?.coins || 0) - (v?.pointCost || 0);
  const soldOut = v?.availableQuantity === 0;

  const redeem = async () => {
    if (!v) return;
    setBusy(true);
    try {
      const item = await LoyaltyApi.redeemVoucher(uid(), v.voucherCode);
      navigate(`/rewards/${v.id}/done`, { state: { item, v, coinsLeft: after } });
    } catch (e) {
      navigate(`/rewards/${v.id}/done`, { state: { v, error: String((e as Error).message) } });
    } finally {
      setBusy(false);
    }
  };

  const banner = useMemo(() => {
    if (!v) return null;
    const rawBrand = v.partnerName || 'Natcom';
    const brand =
      rawBrand
        .replace(/\s*\(.*?\)/g, '')
        .replace(/\s+(Telecom|Mobile E-Wallet|Supermarket|Store|Group).*$/i, '')
        .trim() || 'Natcom';

    // Parse data packages (e.g. 1GB, 5 GB, 500MB) or discounts
    const dataMatch = v.title.match(/(\d+\s*(?:GB|MB))/i);
    let hero = '';
    let sub = '';

    if (dataMatch) {
      hero = dataMatch[1].toUpperCase().replace(/(\d+)([A-Z]+)/, '$1 $2');
      sub = 'High-speed 4G data';
    } else if (v.discountType === 'PERCENT' || v.discountType === 'PERCENTAGE') {
      hero = `${v.discountValue}%`;
      sub = v.minBillAmount ? `Off bills from ${fmt(v.minBillAmount)} HTG` : 'Discount voucher';
    } else {
      hero = `${fmt(v.discountValue)} HTG`;
      sub = v.minBillAmount ? `Bills from ${fmt(v.minBillAmount)} HTG` : 'Cashback on bill payment';
    }

    const durationMatch = v.title.match(/\((\d+\s*(?:Hours?|Days?|Giờ|Ngày))\)/i);
    const validity = durationMatch
      ? durationMatch[1].toLowerCase()
      : v.endDate
      ? (() => {
          const days = Math.ceil((new Date(v.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          return days > 0 && days <= 60 ? `${days} days` : '15 days';
        })()
      : '15 days';

    return { brand, hero, sub, validity };
  }, [v]);

  return (
    <Screen title="Reward details" back="/rewards">
      {failed && <ErrorBlock onRetry={reload} />}
      {!data && !failed && <Skeleton className="h-[300px]" />}
      {data && !v && <Empty art={artEmptyBox} title="This reward is no longer available" />}
      {v && banner && (
        <>
          <p className="text-[13px] font-medium text-slate-500">Reward details</p>

          <div className="relative h-[172px] w-full overflow-hidden rounded-[24px] bg-gradient-to-r from-[#EBF7FD] via-[#E1F3FB] to-[#CDE9F7]">
            <img
              src={partnerPhoto(`${v.partnerName} ${v.title}`)}
              alt=""
              className="absolute inset-y-0 right-0 h-full w-[60%] object-cover [mask-image:linear-gradient(to_right,transparent,black_28%)]"
            />
            <div className="relative flex h-full flex-col justify-center gap-1 p-5">
              <span className="text-[13px] font-bold text-[#FF8600]">{banner.brand}</span>
              <span className="text-[32px] font-extrabold leading-none tracking-tight text-slate-900">{banner.hero}</span>
              <span className="mt-1 text-[12px] font-medium text-slate-500">{banner.sub}</span>
            </div>
          </div>

          <h2 className="text-[20px] font-bold leading-snug text-slate-900">{v.title}</h2>

          <div className="w-full rounded-[24px] bg-white p-4 shadow-[0_2px_10px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-between py-1.5 text-[13px]">
              <span className="text-slate-500">Coins needed</span>
              <span className="font-semibold text-brand">{fmt(v.pointCost)} coins</span>
            </div>
            <div className="flex items-center justify-between py-1.5 text-[13px]">
              <span className="text-slate-500">Available coins</span>
              <span className="font-semibold text-slate-900">{fmt(data!.coins)} coins</span>
            </div>
            <div className="flex items-center justify-between py-1.5 text-[13px]">
              <span className="text-slate-500">After redeeming</span>
              <span className="font-semibold text-slate-900">{fmt(Math.max(after, 0))} coins</span>
            </div>

            <div className="my-2 border-t border-slate-100" />

            <div className="flex items-center justify-between py-1.5 text-[13px]">
              <span className="text-slate-500">Valid for</span>
              <span className="font-semibold text-slate-900">{banner.validity}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <h3 className="text-[15px] font-bold text-slate-900">Terms of use</h3>
            <p className="text-[12px] leading-relaxed text-slate-500">
              The {banner.brand} pack is issued once confirmed. If it's still processing, the result goes to your inbox; don't resend the request.
            </p>
          </div>

          <div className="h-[80px]" />
          <div className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-[430px] border-t border-slate-100 bg-white px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-3 shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-col">
                <span className="text-[20px] font-bold leading-none text-brand">
                  {fmt(v.pointCost)} coins
                </span>
                <span className="mt-1 text-[11px] font-medium text-slate-500">
                  {after >= 0 ? `${fmt(after)} coins left after redeeming` : `You need ${fmt(-after)} more coins`}
                </span>
                <span className="mt-0.5 text-[10px] text-slate-400">
                  Check the conditions before you redeem.
                </span>
              </div>

              <button
                type="button"
                disabled={busy || after < 0 || soldOut}
                onClick={redeem}
                className="flex h-12 min-w-[140px] items-center justify-center rounded-[16px] bg-brand px-7 text-[15px] font-bold text-white shadow-[0_4px_12px_rgba(255,134,0,0.3)] transition-transform active:scale-[0.98] disabled:opacity-50 disabled:shadow-none"
              >
                {soldOut ? 'Sold out' : busy ? 'Redeeming...' : 'Redeem'}
              </button>
            </div>
          </div>
        </>
      )}
    </Screen>
  );
};

// ───────────────────────── VQ-02 · Result (ready · issuing · sold out / failed) ─────────────────────────
export const RedeemResult: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useLocation() as { state?: { item?: UserVoucherItem; v?: CatalogVoucherItem; coinsLeft?: number; error?: string } };
  if (!state?.v) return <Navigate to="/rewards" replace />;
  const { item, v, coinsLeft, error } = state;
  const code = item?.redemptionCode || item?.code || '';
  const pending = !!item && /PENDING|ISSUING|PROCESSING|AWAIT/i.test(item.status || '');

  if (error || !item) {
    return (
      <Screen title="Redeem reward" back="/rewards">
        <ResultBlock art={artEmptyBox} title={/40[49]|SOLD|STOCK/i.test(error || '') ? 'This reward is sold out' : 'We couldn’t redeem this reward'} sub="No coins were deducted. Try another reward or come back later." />
        <PrimaryButton onClick={() => navigate('/rewards')}>Back to Reward store</PrimaryButton>
      </Screen>
    );
  }
  return (
    <Screen title="Redeem reward" back="/rewards">
      {pending ? (
        /* VQ-02 · Result · awaiting partner / issuing (330:251, 330:256) */
        <ResultBlock art={artHourglass} title="Confirming your reward" value={v.title} valueTone="slate" sub={`Your request has been sent to ${v.partnerName}.`} />
      ) : (
        <ResultBlock art={artGift} title="Your reward is ready" value={v.title} sub={`${v.partnerName} voucher`} />
      )}
      <InfoRows
        rows={[
          ...(pending && code ? ([['Request ID', code]] as [string, string][]) : []),
          [pending ? 'Coins on hold' : 'Coins used', `${fmt(v.pointCost)} coins`],
          [pending ? 'Available coins' : 'Coins left', `${fmt(coinsLeft)} coins`],
          ...(pending ? ([['Status', 'Awaiting confirmation']] as [string, string][]) : []),
          ...(code && !pending ? ([['Voucher code', code]] as [string, string][]) : []),
          ...(item.validUntil ? ([['Valid until', ddmmyyyy(item.validUntil) || item.validUntil]] as [string, string][]) : []),
        ]}
      />
      {pending && (
        <div className="flex items-start gap-2 rounded-[14px] bg-brand-soft p-3 text-[12px]">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand" /> Don't resend while it's processing. If issuing fails, your coins are refunded. The result will be sent to your inbox.
        </div>
      )}
      {code && !pending && <ScanBlock code={code} />}
      {pending ? (
        <>
          <PrimaryButton onClick={() => navigate('/inbox')}>See result notice</PrimaryButton>
          <SecondaryButton onClick={() => navigate('/rewards')}>Back to Reward store</SecondaryButton>
        </>
      ) : (
        <>
          <PrimaryButton onClick={() => navigate('/my-vouchers')}>Open My vouchers</PrimaryButton>
          <SecondaryButton onClick={() => navigate('/rewards')}>Back to Reward store</SecondaryButton>
        </>
      )}
    </Screen>
  );
};

// ───────────────────────── VQ-03 · My vouchers ─────────────────────────
const statusTone = (s: string) => (/ACTIVE|AVAILABLE|UNUSED/i.test(s) ? 'green' : /USED|REDEEMED/i.test(s) ? 'grey' : 'red') as 'green' | 'grey' | 'red';

export const MyVouchers: React.FC = () => {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [data, failed, reload] = useLoad(() => LoyaltyApi.getUserVouchers(uid()));
  const list = (data || []).filter((v) => `${v.title} ${v.partnerName} ${v.code}`.toLowerCase().includes(q.toLowerCase()));
  const ready = (data || []).filter((v) => statusTone(v.status) === 'green').length;
  return (
    <Screen title="My vouchers" back="/rewards">
      <div className="flex items-center">
        <h2 className="flex-1 text-[24px] font-semibold">My vouchers</h2>
        <button type="button" onClick={() => navigate('/rewards')} className="text-[12px] font-semibold text-brand">Redeem ›</button>
      </div>
      <label className="flex h-12 w-full items-center gap-2 rounded-[14px] bg-white px-4">
        <Search className="size-[18px] text-slate-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search your vouchers" className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-slate-400" />
      </label>
      {data && <p className="text-[12px] text-slate-500">{data.length} vouchers · {ready} ready to use</p>}
      {failed && <ErrorBlock onRetry={reload} />}
      {!data && !failed && <Skeleton className="h-[200px]" />}
      {data && list.length === 0 && <Empty art={artEmptyBox} title="No vouchers yet" text="Redeem coins for partner vouchers in the Reward store."><PrimaryButton className="mt-3" onClick={() => navigate('/rewards')}>Open Reward store</PrimaryButton></Empty>}
      {list.map((v) => {
        const tone = statusTone(v.status);
        const code = v.redemptionCode || v.code;
        return (
          <div key={v.id} className={`flex w-full flex-col gap-3 rounded-[20px] bg-white p-4 ${tone !== 'green' ? 'opacity-70' : ''}`}>
            <div className="flex gap-3">
              <img src={partnerPhoto(`${v.partnerName} ${v.title}`)} alt="" className={`size-[84px] rounded-[14px] object-cover ${tone !== 'green' ? 'grayscale' : ''}`} />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-[11px] text-slate-500">{v.partnerName}</span>
                <span className="text-[15px] font-semibold">{v.title}</span>
                <span className={`text-[11px] font-semibold ${tone === 'green' ? 'text-emerald-700' : tone === 'red' ? 'text-red-600' : 'text-slate-500'}`}>
                  {tone === 'green' ? 'Active' : tone === 'red' ? 'Expired' : 'Used'}
                </span>
                {v.validUntil && <span className="text-[11px] text-slate-500">Exp · {ddmmyyyy(v.validUntil) || v.validUntil}</span>}
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-[12px] font-semibold">
              {code}
              <button type="button" aria-label="Copy code" onClick={() => void navigator.clipboard?.writeText(code)}><Copy className="size-4 text-slate-500" /></button>
            </div>
            {tone === 'green' && <SecondaryButton onClick={() => navigate(`/my-vouchers/${v.id}`)}>Use voucher</SecondaryButton>}
          </div>
        );
      })}
    </Screen>
  );
};

// ───────────────────────── VQ-03 · Show voucher at checkout ─────────────────────────
export const ShowVoucher: React.FC = () => {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [data, failed, reload] = useLoad(() => LoyaltyApi.getUserVouchers(uid()), [id]);
  const v = data?.find((x) => String(x.id) === id);
  const code = v ? v.redemptionCode || v.code : '';
  return (
    <Screen title="My vouchers" back="/my-vouchers">
      {failed && <ErrorBlock onRetry={reload} />}
      {!data && !failed && <Skeleton className="h-[420px]" />}
      {data && !v && <Empty art={artEmptyBox} title="Voucher not found" />}
      {v && (
        <>
          <div className="flex w-full flex-col items-center gap-3 rounded-[20px] bg-white p-4">
            <div className="w-full">
              <p className="text-[12px] text-slate-500">{v.partnerName}</p>
              <p className="text-[24px] font-semibold">{v.discountText || v.title}</p>
              <p className="text-[12px] text-slate-500">{[v.minOrder, v.validUntil && `valid until ${ddmmyyyy(v.validUntil) || v.validUntil}`].filter(Boolean).join(' · ')}</p>
            </div>
            <QrCode value={code} size={180} />
            <Barcode value={code} />
            <p className="text-[20px] font-semibold tracking-wide">{code}</p>
            <p className="text-[12px] text-slate-500">Show this to the cashier. The POS scans the QR or the barcode (Code128); the cashier can also type the code.</p>
          </div>
          <SecondaryButton onClick={() => navigate('/my-vouchers')}>Back to My vouchers</SecondaryButton>
          <p className="text-[11px] text-slate-500">The voucher turns “Used” once the partner records it in the Partner portal.</p>
        </>
      )}
    </Screen>
  );
};
