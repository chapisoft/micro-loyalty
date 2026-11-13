import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Clock, Layers, AlertTriangle, Calendar, RefreshCw } from 'lucide-react';
import { LoyaltyApi, ExpiringBucketsResponse, getDefaultUserId } from '../services/api';
import { SkeletonCard, EmptyState } from './common/StateBlocks';
import { soundHaptics } from '../utils/soundHaptics';

interface FifoExpiringBucketsModalProps {
  isOpen: boolean;
  onClose: () => void;
  externalUserId?: string;
}

export const FifoExpiringBucketsModal: React.FC<FifoExpiringBucketsModalProps> = ({
  isOpen,
  onClose,
  externalUserId,
}) => {
  const { t } = useTranslation();
  const userId = externalUserId || getDefaultUserId();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ExpiringBucketsResponse | null>(null);

  const loadBuckets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await LoyaltyApi.getExpiringBuckets(userId);
      setData(res);
    } catch {
      setData(null);
      setError(t('fifo.load_error'));
    } finally {
      setLoading(false);
    }
  }, [userId, t]);

  useEffect(() => {
    if (isOpen) {
      loadBuckets();
    }
  }, [isOpen, loadBuckets]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-lg w-full border border-slate-200 shadow-2xl relative space-y-4 text-slate-900 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-start pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                DT-01 • FIFO
              </span>
              <h2 className="font-black text-base sm:text-lg text-slate-900 leading-tight mt-0.5">
                {t('fifo.title')}
              </h2>
              <p className="text-[11px] text-slate-500">{t('fifo.subtitle')}</p>
            </div>
          </div>

          <button
            onClick={() => {
              soundHaptics.playClick();
              onClose();
            }}
            className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition shrink-0"
            aria-label={t('nav.close')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Summary & FIFO Rule */}
        <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-3.5 text-xs space-y-1.5 shrink-0">
          <div className="flex items-center justify-between">
            <span className="font-bold text-amber-950">{t('fifo.total_expiring_label')}</span>
            <span className="font-mono font-black text-sm text-amber-800">
              {data ? `${data.totalExpiringPoints.toLocaleString()} ${t('nav.points_unit')}` : '—'}
            </span>
          </div>
          <p className="text-[11px] text-amber-800 leading-relaxed">{t('fifo.rule_explanation')}</p>
        </div>

        {/* Buckets List */}
        <div className="space-y-2.5 overflow-y-auto flex-1 pr-1">
          {loading ? (
            <>
              <SkeletonCard rows={2} />
              <SkeletonCard rows={2} />
            </>
          ) : error || !data || !data.buckets || data.buckets.length === 0 ? (
            <EmptyState
              icon={<Clock className="w-6 h-6" />}
              title={error ? t('fifo.error_title') : t('fifo.empty_title')}
              description={error || t('fifo.empty_desc')}
              actionLabel={t('fifo.btn_refresh')}
              onAction={loadBuckets}
            />
          ) : (
            data.buckets.map((bucket, idx) => {
              const isUrgent = typeof bucket.daysRemaining === 'number' && bucket.daysRemaining <= 30;
              return (
                <div
                  key={bucket.bucketId}
                  className={`p-3.5 rounded-2xl border transition flex flex-col gap-2 ${
                    isUrgent
                      ? 'bg-rose-50/60 border-rose-200'
                      : 'bg-slate-50/70 border-slate-200/90'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-mono font-bold bg-slate-900 text-white px-2 py-0.5 rounded-md">
                          #{idx + 1} FIFO
                        </span>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                          {bucket.assetType}
                        </span>
                        {isUrgent && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                            <AlertTriangle className="w-3 h-3" />
                            {t('fifo.expiring_soon_badge', { days: bucket.daysRemaining })}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-slate-900 truncate pt-0.5">
                        {bucket.sourceDescription || bucket.sourceRef || t('fifo.default_source')}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono font-black text-sm text-amber-800 block">
                        {bucket.remainingPoints.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        / {bucket.initialPoints.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1.5 border-t border-slate-200/60">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {t('fifo.earned_at', { date: new Date(bucket.earnedAt).toLocaleDateString() })}
                    </span>
                    <span className={`font-semibold ${isUrgent ? 'text-rose-700' : 'text-slate-700'}`}>
                      {t('fifo.expires_at', { date: new Date(bucket.expiredAt).toLocaleDateString() })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-100 shrink-0 flex items-center gap-2">
          <button
            onClick={() => {
              soundHaptics.playClick();
              loadBuckets();
            }}
            className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl transition active:scale-95"
            title={t('fifo.btn_refresh')}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => {
              soundHaptics.playClick();
              onClose();
            }}
            className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs active:scale-95 transition"
          >
            {t('tiers.btn_got_it')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FifoExpiringBucketsModal;
