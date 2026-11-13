import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { X, QrCode, RefreshCw, Copy, Check, ShieldCheck, MapPin, Hash, AlertCircle } from 'lucide-react';
import { LoyaltyApi, getDefaultUserId } from '../services/api';
import { generateQrCodeSvgDataUri } from '../utils/qrCodeSvg';
import { SkeletonCard } from './common/StateBlocks';

export interface RewardWalletQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  externalUserId?: string;
  availableCoins?: number | null;
  onOpenWhereToUse?: () => void;
  onOpenUssd?: () => void;
}

export const RewardWalletQrModal: React.FC<RewardWalletQrModalProps> = ({
  isOpen,
  onClose,
  externalUserId,
  availableCoins,
  onOpenWhereToUse,
  onOpenUssd,
}) => {
  const { t } = useTranslation();
  const userId = externalUserId || getDefaultUserId();
  const [qrToken, setQrToken] = useState<string>('');
  const [ttlSeconds, setTtlSeconds] = useState<number>(0);
  const [totalSeconds, setTotalSeconds] = useState<number>(60);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const fetchToken = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await LoyaltyApi.generateRewardQrToken(userId);
      setQrToken(res.qrToken);
      const sec = res.expiresInSeconds && res.expiresInSeconds > 0 ? res.expiresInSeconds : 60;
      setTotalSeconds(sec);
      setTtlSeconds(sec);
    } catch (err) {
      setQrToken('');
      setTtlSeconds(0);
      setErrorMsg(err instanceof Error ? err.message : t('qrModal.load_error'));
    } finally {
      setLoading(false);
    }
  }, [t, userId]);

  useEffect(() => {
    if (!isOpen) return;
    void fetchToken();
  }, [isOpen, fetchToken]);

  useEffect(() => {
    if (!isOpen || !qrToken) return;
    const timer = window.setInterval(() => {
      setTtlSeconds((prev) => {
        if (prev <= 1) {
          void fetchToken();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isOpen, qrToken, fetchToken]);

  const qrDataUri = useMemo(
    () => (qrToken ? generateQrCodeSvgDataUri(qrToken, 210) : ''),
    [qrToken]
  );

  if (!isOpen) return null;

  const handleCopy = async () => {
    if (!qrToken) return;
    try {
      await navigator.clipboard.writeText(qrToken);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const progressPct = totalSeconds > 0 ? Math.max(0, Math.min(100, (ttlSeconds / totalSeconds) * 100)) : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold truncate">{t('qrModal.title')}</h3>
              <p className="text-[11px] text-amber-50 truncate">{t('qrModal.subtitle')}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Coin Balance Bar */}
          <div className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-2.5 flex items-center justify-between text-xs">
            <span className="text-amber-900 font-medium">{t('qrModal.available_coins')}</span>
            <span className="font-mono font-bold text-amber-700">
              {availableCoins !== null && availableCoins !== undefined
                ? `${availableCoins.toLocaleString()} ${t('common.points_unit')}`
                : '—'}
            </span>
          </div>

          {loading ? (
            <SkeletonCard rows={5} />
          ) : errorMsg ? (
            <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-center space-y-3">
              <AlertCircle className="w-6 h-6 text-rose-600 mx-auto" />
              <p className="text-xs text-rose-800">{errorMsg}</p>
              <button
                type="button"
                onClick={() => void fetchToken()}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{t('common.retry')}</span>
              </button>
            </div>
          ) : (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 flex flex-col items-center space-y-3">
              <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
                {qrDataUri && (
                  <img
                    src={qrDataUri}
                    alt={t('qrModal.qr_alt')}
                    className="w-48 h-48 block"
                  />
                )}
              </div>

              {/* Token + Copy */}
              <div className="w-full flex items-center justify-between gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2">
                <span className="font-mono text-xs text-slate-800 truncate">{qrToken}</span>
                <button
                  type="button"
                  onClick={() => void handleCopy()}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold inline-flex items-center gap-1 shrink-0"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? t('common.copied') : t('common.copy')}</span>
                </button>
              </div>

              {/* 60s Auto-refresh Progress */}
              <div className="w-full space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-600">
                  <span className="inline-flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    {t('qrModal.auto_refresh_label')}
                  </span>
                  <span className="font-mono font-semibold text-amber-700">
                    {ttlSeconds}s
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-1000"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => void fetchToken()}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 active:scale-95 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{t('qrModal.refresh_now')}</span>
              </button>
            </div>
          )}

          {/* Cross-links to LM-04 and USSD *202# */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            {onOpenWhereToUse && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenWhereToUse();
                }}
                className="py-2.5 px-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5"
              >
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t('qrModal.btn_where_to_use')}</span>
              </button>
            )}
            {onOpenUssd && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenUssd();
                }}
                className="py-2.5 px-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5"
              >
                <Hash className="w-3.5 h-3.5 text-indigo-600" />
                <span>{t('qrModal.btn_ussd')}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RewardWalletQrModal;
