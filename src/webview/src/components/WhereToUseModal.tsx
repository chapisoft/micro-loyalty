import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { X, MapPin, Search, Store, Sparkles, RefreshCw } from 'lucide-react';
import { LoyaltyApi, PartnerLocationItem } from '../services/api';
import { SkeletonCard, EmptyState } from './common/StateBlocks';

export interface WhereToUseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenQrPay?: () => void;
}

const PARTNER_CATEGORIES = ['ALL', 'RETAIL', 'FOOD', 'TELECOM', 'UTILITY'] as const;

export const WhereToUseModal: React.FC<WhereToUseModalProps> = ({
  isOpen,
  onClose,
  onOpenQrPay,
}) => {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [partners, setPartners] = useState<PartnerLocationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadLocations = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const catParam = selectedCategory === 'ALL' ? undefined : selectedCategory;
      const list = await LoyaltyApi.getWhereToUsePartners(catParam);
      setPartners(list);
    } catch (err) {
      setPartners([]);
      setErrorMsg(err instanceof Error ? err.message : t('whereToUse.load_error'));
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, t]);

  useEffect(() => {
    if (isOpen) {
      void loadLocations();
    }
  }, [isOpen, loadLocations]);

  if (!isOpen) return null;

  const filtered = partners.filter((item) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      item.partnerName.toLowerCase().includes(q) ||
      (item.branchName || '').toLowerCase().includes(q) ||
      (item.address || '').toLowerCase().includes(q) ||
      (item.province || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 max-h-[88vh] flex flex-col overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900 truncate">{t('whereToUse.title')}</h3>
              <p className="text-[11px] text-slate-500 truncate">{t('whereToUse.subtitle')}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 pt-3 pb-2 space-y-2.5 border-b border-slate-100 bg-slate-50/70">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('whereToUse.search_placeholder')}
              className="w-full pl-9 pr-3 py-2 rounded-2xl bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {PARTNER_CATEGORIES.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold whitespace-nowrap border transition ${
                    active
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {t(`whereToUse.cat_${cat.toLowerCase()}`)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {errorMsg && (
            <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 flex items-center justify-between gap-2">
              <span>{errorMsg}</span>
              <button
                type="button"
                onClick={() => void loadLocations()}
                className="px-2.5 py-1 rounded-lg bg-white border border-rose-200 font-semibold inline-flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>{t('common.retry')}</span>
              </button>
            </div>
          )}

          {loading ? (
            <>
              <SkeletonCard rows={3} />
              <SkeletonCard rows={3} />
            </>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<Store className="w-6 h-6 text-slate-400" />}
              title={t('whereToUse.empty_title')}
              description={t('whereToUse.empty_desc')}
            />
          ) : (
            filtered.map((loc) => (
              <div
                key={loc.id}
                className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="text-xs font-semibold text-slate-900 truncate">
                      {loc.branchName ? `${loc.partnerName} · ${loc.branchName}` : loc.partnerName}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {[loc.address, loc.province].filter(Boolean).join(' · ') || t('whereToUse.nationwide')}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-medium shrink-0">
                    {loc.category}
                  </span>
                </div>

                {(loc.earnPolicyText || loc.burnPolicyText || onOpenQrPay) && (
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px]">
                    <div className="flex flex-wrap items-center gap-1.5 text-emerald-700">
                      {loc.earnPolicyText && (
                        <span className="px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200">
                          {loc.earnPolicyText}
                        </span>
                      )}
                      {loc.burnPolicyText && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
                          <Sparkles className="w-3 h-3" />
                          {loc.burnPolicyText}
                        </span>
                      )}
                    </div>

                    {onOpenQrPay && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenQrPay();
                        }}
                        className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold"
                      >
                        {t('whereToUse.pay_with_qr')}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default WhereToUseModal;
