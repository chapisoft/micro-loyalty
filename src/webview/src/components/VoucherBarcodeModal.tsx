import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  Copy,
  Check,
  QrCode,
  MapPin,
  Calendar,
  AlertCircle,
  CheckCircle2,
  ScanLine,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { generateBarcode128Svg } from '../utils/barcode128';
import { generateQrCodeSvgDataUri } from '../utils/qrCodeSvg';
import { soundHaptics } from '../utils/soundHaptics';

interface VoucherBarcodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshCode?: () => Promise<void> | void;
  refreshing?: boolean;
  mode?: 'REDEEM_RESULT' | 'CHECKOUT';
  voucher: {
    id: number;
    dynamicCode: string;
    expiresInSeconds?: number;
    dynamicExpiresAt?: string;
    voucherTitle: string;
    partnerName: string;
    discountValue?: number;
    discountType?: string;
    discountText?: string;
    expiredAt: string;
    minSpendAmount?: number;
    minOrder?: string;
    terms?: string;
    status?: string;
  } | null;
}

const formatCountdown = (seconds: number): string => {
  const safe = Math.max(0, seconds);
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export const VoucherBarcodeModal: React.FC<VoucherBarcodeModalProps> = ({
  isOpen,
  onClose,
  onRefreshCode,
  refreshing = false,
  mode = 'CHECKOUT',
  voucher,
}) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);

  useEffect(() => {
    if (!isOpen || !voucher) return;
    const calcInitial = () => {
      if (voucher.dynamicExpiresAt) {
        const diff = Math.floor((new Date(voucher.dynamicExpiresAt).getTime() - Date.now()) / 1000);
        if (Number.isFinite(diff)) return Math.max(0, diff);
      }
      return Math.max(0, voucher.expiresInSeconds ?? 300);
    };
    setRemainingSeconds(calcInitial());

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, voucher?.dynamicCode, voucher?.dynamicExpiresAt, voucher?.expiresInSeconds]);

  if (!isOpen || !voucher) return null;

  const isDynamicExpired = remainingSeconds <= 0;

  const handleCopyCode = () => {
    if (isDynamicExpired) return;
    soundHaptics.playClick();
    navigator.clipboard.writeText(voucher.dynamicCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const barcodeSvg = generateBarcode128Svg(voucher.dynamicCode, 72);
  const qrDataUri = generateQrCodeSvgDataUri(voucher.dynamicCode, 152);
  const isRedeemResult = mode === 'REDEEM_RESULT';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-sm bg-white rounded-3xl p-5 sm:p-6 shadow-2xl text-slate-900 overflow-hidden border border-slate-200 my-auto max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-black px-2.5 py-1 rounded-xl bg-amber-500/15 text-amber-900 uppercase">
              {voucher.partnerName}
            </span>
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-mono font-black px-2.5 py-0.5 rounded-full ${
                isDynamicExpired
                  ? 'bg-rose-100 text-rose-700'
                  : remainingSeconds <= 60
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>{isDynamicExpired ? t('vouchers.dynamic_expired_badge') : formatCountdown(remainingSeconds)}</span>
            </span>
          </div>
          <button
            onClick={() => {
              soundHaptics.playClick();
              onClose();
            }}
            className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
            aria-label={t('nav.close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* VQ-02 Result Ready Banner */}
        {isRedeemResult && (
          <div className="mb-3 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-xs font-black text-emerald-950">{t('voucher.redeem_ready_title')}</p>
              <p className="text-[11px] text-emerald-800">{t('voucher.redeem_ready_desc')}</p>
            </div>
          </div>
        )}

        {/* Voucher Title & Value */}
        <div className="text-center my-2">
          <h3 className="font-black text-base sm:text-lg text-slate-900 leading-tight">
            {voucher.voucherTitle}
          </h3>
          {voucher.discountText && (
            <span className="inline-block mt-1 text-xs font-black bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full">
              {voucher.discountText}
            </span>
          )}
          <p className="text-xs text-slate-500 mt-1">
            {t('vouchers.dynamic_code_ttl_hint')}
          </p>
        </div>

        {/* Scan at the counter Card: QR Code + Code128 Barcode + 8-Char Dynamic Code */}
        <div className="my-3.5 p-4 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center space-y-3 shadow-inner relative">
          <div className="w-full flex items-center justify-between text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <ScanLine className="w-3.5 h-3.5 text-amber-600" />
              {t('voucher.scan_at_counter')}
            </span>
            <QrCode className="w-3.5 h-3.5 text-slate-400" />
          </div>

          {isDynamicExpired ? (
            <div className="w-full py-8 flex flex-col items-center justify-center text-center space-y-3">
              <p className="text-xs font-bold text-rose-700">{t('vouchers.dynamic_code_expired_desc')}</p>
              {onRefreshCode && (
                <button
                  onClick={() => {
                    soundHaptics.playClick();
                    void onRefreshCode();
                  }}
                  disabled={refreshing}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-sm transition disabled:opacity-60"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                  <span>{t('vouchers.regenerate_dynamic_code')}</span>
                </button>
              )}
            </div>
          ) : (
            <>
              {/* 1. QR Code */}
              <div className="w-36 h-36 bg-white border border-slate-200 rounded-2xl p-2 flex items-center justify-center shadow-xs">
                <img
                  src={qrDataUri}
                  alt={voucher.dynamicCode}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* 2. Code128 Barcode SVG */}
              <div
                className="w-full bg-white rounded-xl border border-slate-200 px-2 py-1.5 flex justify-center overflow-hidden"
                dangerouslySetInnerHTML={{ __html: barcodeSvg }}
              />

              {/* 3. Dynamic 8-char Alphanumeric Code with Copy Button */}
              <div className="flex items-center space-x-2 bg-white border border-slate-200 px-3 py-2 rounded-xl w-full justify-between">
                <span className="font-mono font-black text-base tracking-[0.18em] text-slate-900 select-all">
                  {voucher.dynamicCode}
                </span>
                <button
                  onClick={handleCopyCode}
                  className="flex items-center space-x-1 text-xs font-bold text-amber-800 hover:text-amber-900 transition shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-700 stroke-[3]" />
                      <span className="text-emerald-700">{t('common.copied')}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>{t('common.copy')}</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Terms & Expiry info */}
        <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100">
          <div className="flex items-center space-x-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>
              {t('voucher.valid_until')}{' '}
              <strong className="text-slate-800">{voucher.expiredAt}</strong>
            </span>
          </div>
          <div className="flex items-center space-x-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>
              {t('voucher.apply_at')}{' '}
              <strong className="text-slate-800">{voucher.partnerName}</strong>
            </span>
          </div>
          {(voucher.minSpendAmount || voucher.minOrder) && (
            <div className="flex items-center space-x-1.5 text-[11px] text-slate-500">
              <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span>
                {voucher.minOrder || t('vouchers.min_bill', { amount: voucher.minSpendAmount?.toLocaleString() })}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
