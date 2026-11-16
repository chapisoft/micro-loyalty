import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoyaltyApi, getDefaultUserId, type PartnerLocationItem } from '../../services/api';
import { generateBarcode128Svg } from '../../utils/barcode128';
import { Screen, SectionHeader, Skeleton, ErrorBlock, Pill, SecondaryButton, Empty, SlideRow, useLoad, fmt } from '../ui';
import { QrCode } from '../qr';
import { artMap, artGift, artEmptyBox, partnerPhoto } from '../art';

const uid = () => getDefaultUserId();
const nice = (s: string) => s.replace(/_/g, ' ').toLowerCase().replace(/^./, (c) => c.toUpperCase());

// ───────────────────────── LM-04 · Where to use coins ─────────────────────────
export const WhereToUse: React.FC = () => {
  const navigate = useNavigate();
  const [cat, setCat] = useState('All');
  const [data, failed, reload] = useLoad(async () => {
    const [p, partners] = await Promise.all([LoyaltyApi.getProfile(uid()), LoyaltyApi.getWhereToUsePartners().catch(() => [] as PartnerLocationItem[])]);
    return { coins: p.currentPoints || 0, partners: partners.filter((x) => !x.status || x.status === 'ACTIVE') };
  });
  // Category chips come from the partners' categories (CMS), one row per partner with its branch count.
  const CATS = ['All', ...Array.from(new Set((data?.partners || []).map((p) => p.category).filter(Boolean)))];
  const grouped = Object.values(
    (data?.partners || []).reduce<Record<string, { p: PartnerLocationItem; n: number }>>((acc, p) => {
      acc[p.partnerCode] = acc[p.partnerCode] ? { ...acc[p.partnerCode], n: acc[p.partnerCode].n + 1 } : { p, n: 1 };
      return acc;
    }, {}),
  ).filter(({ p }) => cat === 'All' || p.category === cat);

  return (
    <Screen title="Use coins" back="/">
      <div>
        <h2 className="text-[24px] font-semibold leading-8">Where to use coins</h2>
        <p className="text-[13px] text-slate-500">1 coin = 1 HTG at partners. Pick the way that suits you.</p>
      </div>
      {failed && <ErrorBlock onRetry={reload} />}
      {!data && !failed && <Skeleton className="h-[240px]" />}
      {data && (
        <>
          <div className="w-full overflow-hidden rounded-[20px] bg-white">
            <div className="flex h-[150px] items-center justify-center bg-brand-soft"><img src={artMap} alt="" className="size-[130px] object-contain" /></div>
            <div className="flex items-end gap-3 p-4">
              <div className="flex-1">
                <p className="text-[12px] text-slate-500">Available coins</p>
                <p className="text-[28px] font-semibold">{fmt(data.coins)} coins</p>
              </div>
              <Pill tone="green">≈ {fmt(data.coins)} HTG</Pill>
            </div>
          </div>
          <SectionHeader title="2 ways to use coins" />
          <button type="button" onClick={() => navigate('/pay-at-counter')} className="flex w-full items-start gap-3 rounded-[20px] bg-white p-4 text-left">
            <img src={partnerPhoto('grocery')} alt="" className="size-16 rounded-[14px] object-cover" />
            <span className="flex flex-1 flex-col gap-1">
              <span className="flex items-center gap-2 text-[15px] font-semibold"><span className="flex size-5 items-center justify-center rounded-full bg-brand text-[11px] text-white">1</span>Pay with coins in Natcash</span>
              <span className="text-[12px] text-slate-500">On the payment confirmation screen, the app suggests how many coins you can use at accepting stores. At the counter, show your reward QR.</span>
              <span className="text-[12px] font-semibold text-brand">Show my reward QR ›</span>
            </span>
          </button>
          <button type="button" onClick={() => navigate('/rewards')} className="flex w-full items-start gap-3 rounded-[20px] bg-white p-4 text-left">
            <img src={artGift} alt="" className="size-16 rounded-[14px] bg-brand-soft object-contain p-1" />
            <span className="flex flex-1 flex-col gap-1">
              <span className="flex items-center gap-2 text-[15px] font-semibold"><span className="flex size-5 items-center justify-center rounded-full bg-brand text-[11px] text-white">2</span>Redeem for vouchers</span>
              <span className="text-[12px] text-slate-500">Pick a reward in the Reward store. Vouchers are saved in “My vouchers”.</span>
              <span className="text-[12px] font-semibold text-brand">Open Reward store ›</span>
            </span>
          </button>
          <SectionHeader title="Partners accepting coins" />
          <SlideRow>
            {CATS.map((c) => (
              <button key={c} type="button" onClick={() => setCat(c)} className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-semibold ${cat === c ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white'}`}>{c === 'All' ? c : nice(c)}</button>
            ))}
          </SlideRow>
          {grouped.length === 0 && <Empty art={artEmptyBox} title="No partners in this category yet" />}
          {grouped.length > 0 && (
            <div className="w-full divide-y divide-slate-100 rounded-[20px] bg-white px-4">
              {grouped.map(({ p, n }) => (
                <div key={p.partnerCode} className="flex items-center gap-3 py-3">
                  <img src={partnerPhoto(`${p.partnerName} ${p.category}`)} alt="" className="size-11 rounded-xl object-cover" />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-[14px] font-semibold">{p.partnerName}</span>
                    <span className="text-[11px] text-slate-500">{nice(p.category)} · {n} {n === 1 ? 'store' : 'stores'}</span>
                  </span>
                  <Pill tone="orange">{p.burnPolicyText || 'Natcash payment'}</Pill>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </Screen>
  );
};

// ───────────────────────── LM-17 · Pay at the counter · reward wallet QR (60 s) ─────────────────────────
export const PayAtCounter: React.FC = () => {
  const navigate = useNavigate();
  const [token, setToken] = useState<string>();
  const [left, setLeft] = useState(60);
  const [failed, setFailed] = useState(false);
  const [profile] = useLoad(() => LoyaltyApi.getProfile(uid()));

  const refresh = async () => {
    setFailed(false);
    try {
      const r = await LoyaltyApi.generateRewardQrToken(uid());
      setToken(r.qrToken);
      setLeft(r.expiresInSeconds > 0 ? r.expiresInSeconds : 60);
    } catch {
      setFailed(true);
    }
  };
  useEffect(() => {
    void refresh();
  }, []);
  useEffect(() => {
    const t = setInterval(() => setLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (left <= 0 && token) void refresh(); // each code is single-use and expires; fetch a fresh one
  }, [left, token]);

  return (
    <Screen title="Pay at the counter" back="/use-coins">
      <div>
        <h2 className="text-[22px] font-semibold">Show this at the cashier</h2>
        <p className="text-[13px] text-slate-500">The POS scans it and applies coins and vouchers to the bill.</p>
      </div>
      {failed && <ErrorBlock onRetry={refresh} />}
      {!token && !failed && <Skeleton className="h-[380px]" />}
      {token && (
        <div className="flex w-full flex-col items-center gap-3 rounded-[20px] bg-white p-4">
          <QrCode value={token} size={190} />
          <div className="w-full" dangerouslySetInnerHTML={{ __html: generateBarcode128Svg(token.slice(0, 24), 56) }} />
          <Pill tone="orange" className="px-4 py-1.5 text-[12px]">Refreshes in 0:{String(Math.max(left, 0)).padStart(2, '0')}</Pill>
          <div className="mt-1 grid w-full grid-cols-2 gap-2 border-t border-slate-100 pt-3">
            <div><p className="text-[11px] text-slate-500">Coins available</p><p className="text-[18px] font-semibold">{fmt(profile?.currentPoints)} coins</p></div>
            <div><p className="text-[11px] text-slate-500">Usable here</p><p className="text-[13px] font-semibold">per the store's policy</p></div>
          </div>
        </div>
      )}
      <p className="text-[12px] text-slate-500">Each code is signed, works once and expires after 60 seconds, so a screenshot cannot be reused.</p>
      <SecondaryButton onClick={() => navigate('/use-coins')}>I’m done</SecondaryButton>
    </Screen>
  );
};
