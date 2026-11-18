import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Wallet, Ticket, Clock } from 'lucide-react';
import { LoyaltyApi, getDefaultUserId, type UserVoucherItem } from '../../services/api';
import { Screen, Skeleton, ErrorBlock, useLoad, fmt } from '../ui';
import { paramJson, PARAM } from '../data';
import { CodeTabs, cleanBrand } from './Rewards';

const uid = () => getDefaultUserId();

/**
 * LM-17 · Pay at counter (Figma 692:2 / 768:2; with a voucher picked 765:137 / 768:405).
 * The customer shows the code, the cashier scans it. Cart and amount live on the POS; the POS shows the customer's coins and
 * vouchers (wallet/inquiry) and the cashier applies what the customer asks for. No coin switch on the phone (decision 18/11).
 * Scan = paid; above PAY_AT_COUNTER_PIN_LIMIT_HTG the Natcash app asks for the PIN. The result is the Natcash app's own
 * Payment results screen, so this screen never jumps to a result by itself.
 */
export const PayAtCounter: React.FC = () => {
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const voucherId = sp.get('voucher');
  const [token, setToken] = useState<string>();
  const [left, setLeft] = useState(60);
  const [failed, setFailed] = useState(false);
  const [voucher] = useLoad<UserVoucherItem | undefined>(
    async () => (voucherId ? (await LoyaltyApi.getUserVouchers(uid())).find((v) => String(v.id) === voucherId) : undefined),
    [voucherId],
  );
  const [pinLimit] = useLoad(() => paramJson<number>(PARAM.PIN_LIMIT));

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
    if (left <= 0 && token) void refresh(); // each code works once and expires; fetch a fresh one
  }, [left, token]);

  return (
    <Screen title="Pay at counter">
      {failed && <ErrorBlock onRetry={refresh} />}
      {!token && !failed && <Skeleton className="h-[380px]" />}
      {token && (
        <div className="flex w-full flex-col items-center gap-3 rounded-[16px] bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <h2 className="text-[17px] font-semibold">Show this code to the cashier</h2>
          <p className="flex items-center gap-1 text-[12px] text-slate-500">
            <Clock className="size-3.5" /> Refreshes in 0:{String(Math.max(left, 0)).padStart(2, '0')} · works once
          </p>
          <CodeTabs value={token} />
        </div>
      )}
      <div className="w-full divide-y divide-slate-100 rounded-[16px] bg-white px-4">
        <div className="flex items-center gap-3 py-3">
          <span className="flex size-9 items-center justify-center rounded-full bg-[#FFF1E3]"><Wallet className="size-[18px] text-[#FE810D]" /></span>
          <span className="flex-1 text-[15px] font-semibold">Natcash wallet</span>
        </div>
        {voucherId && (
          <button type="button" onClick={() => navigate(-1)} className="flex w-full items-center gap-3 py-3 text-left">
            <span className="flex size-9 items-center justify-center rounded-full bg-[#FFF1E3]"><Ticket className="size-[18px] text-[#FE810D]" /></span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-[15px] font-semibold">{voucher ? `${cleanBrand(voucher.partnerName)} · ${voucher.discountText || voucher.title}` : 'Voucher'}</span>
              <span className="text-[12px] text-slate-500">Cashier applies it when scanning</span>
            </span>
            <span className="text-[14px] font-semibold text-[#FE810D]">Change</span>
          </button>
        )}
      </div>
      <p className="rounded-[14px] bg-[#FFF4EA] p-3 text-[13px] leading-5 text-slate-700">
        The cashier scans your code. Your coins and vouchers show on the cashier’s screen – tell them what to use. {pinLimit ? `Amounts above ${fmt(Number(pinLimit))} HTG ask for your PIN.` : 'Large amounts ask for your PIN in Natcash.'}
      </p>
    </Screen>
  );
};
