import React from 'react';
import { useTranslation } from 'react-i18next';
import { X, Crown, Check, Clock } from 'lucide-react';

interface TierPerkInfo {
  code: string;
  nameKey: string;
  minPoints: string;
  multiplier: string;
  dailySpins: string;
  cashback: string;
  perks: string[];
  bgGrad: string;
  badgeColor: string;
}

const TIERS_DATA: TierPerkInfo[] = [
  {
    code: 'SILVER',
    nameKey: 'tiers.tier_silver',
    minPoints: '0 - 2.999 đ',
    multiplier: '×1.0',
    dailySpins: '1 lượt/ngày',
    cashback: '1.0%',
    perks: ['Tích điểm liên minh', '1 Lượt quay miễn phí/ngày'],
    bgGrad: 'from-slate-100 to-slate-200 text-slate-800 border-slate-300',
    badgeColor: 'bg-slate-200 text-slate-700',
  },
  {
    code: 'GOLD',
    nameKey: 'tiers.tier_gold',
    minPoints: '3.000 - 9.999 đ',
    multiplier: '×1.2',
    dailySpins: '2 lượt/ngày',
    cashback: '1.5%',
    perks: ['Tích điểm nhân ×1.2', '2 Lượt quay miễn phí/ngày', 'Quà sinh nhật +50 điểm'],
    bgGrad: 'from-amber-100 via-amber-50 to-yellow-100 text-amber-950 border-amber-300',
    badgeColor: 'bg-amber-400 text-slate-950 font-black',
  },
  {
    code: 'PLATINUM',
    nameKey: 'tiers.tier_platinum',
    minPoints: '10.000 - 29.999 đ',
    multiplier: '×1.5',
    dailySpins: '3 lượt/ngày',
    cashback: '2.0%',
    perks: ['Tích điểm nhân ×1.5', '3 Lượt quay miễn phí/ngày', 'Miễn phí chuyển tiền ví', 'Quà sinh nhật +150 điểm'],
    bgGrad: 'from-cyan-100 via-sky-50 to-blue-100 text-cyan-950 border-cyan-300',
    badgeColor: 'bg-cyan-500 text-white font-black',
  },
  {
    code: 'DIAMOND',
    nameKey: 'tiers.tier_diamond',
    minPoints: 'Từ 30.000 đ',
    multiplier: '×2.0',
    dailySpins: '5 lượt/ngày',
    cashback: '3.0%',
    perks: ['Nhân đôi điểm thưởng (×2.0)', '5 Lượt quay miễn phí/ngày', 'Tổng đài VIP 24/7', 'Voucher sinh nhật 500 HTG'],
    bgGrad: 'from-purple-100 via-fuchsia-50 to-indigo-100 text-purple-950 border-purple-300',
    badgeColor: 'bg-purple-600 text-white font-black',
  },
];

export const TierBenefitsModal: React.FC<{ isOpen: boolean; onClose: () => void; currentTierCode?: string }> = ({
  isOpen,
  onClose,
  currentTierCode = 'GOLD',
}) => {
  const { t } = useTranslation();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl p-5 sm:p-7 max-w-lg w-full border border-slate-200 shadow-2xl relative space-y-4 text-slate-900 my-8 animate-scale-up max-h-[90vh] flex flex-col">
        {/* Header Bar */}
        <div className="flex justify-between items-start pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center font-black shadow-md">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-base sm:text-lg text-slate-900 leading-tight">
                {t('tiers.modal_title')}
              </h2>
              <p className="text-[11px] text-slate-500">{t('tiers.modal_subtitle')}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition shrink-0"
            aria-label={t('nav.close')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Tier Perks Cards */}
        <div className="space-y-3 overflow-y-auto flex-1 pr-1">
          {TIERS_DATA.map((tier) => {
            const isCurrent = tier.code === currentTierCode;
            return (
              <div
                key={tier.code}
                className={`p-4 rounded-2xl border transition-all ${
                  isCurrent ? 'ring-2 ring-amber-500/50 shadow-md' : 'shadow-xs'
                } bg-gradient-to-br ${tier.bgGrad}`}
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center space-x-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider ${tier.badgeColor}`}>
                      {tier.code}
                    </span>
                    <h3 className="font-black text-sm">{t(tier.nameKey)}</h3>
                  </div>
                  {isCurrent && (
                    <span className="text-[10px] bg-amber-500 text-slate-950 font-extrabold px-2 py-0.5 rounded-full">
                      ✓ Hạng của bạn
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 my-2 text-center text-[11px] bg-white/80 backdrop-blur-sm p-2 rounded-xl border border-white/60">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Tích điểm</span>
                    <span className="font-black text-xs text-amber-700">{tier.multiplier}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Quay miễn phí</span>
                    <span className="font-black text-xs text-indigo-700">{tier.dailySpins}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Xét hạng</span>
                    <span className="font-bold text-[10px] text-slate-700">{tier.minPoints}</span>
                  </div>
                </div>

                <ul className="space-y-1 mt-2 text-[11px]">
                  {tier.perks.map((p, idx) => (
                    <li key={idx} className="flex items-center space-x-1.5 opacity-90">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}

          {/* 12-Month Rolling Cycle Card */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-1">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              <span>{t('tiers.cycle_title')}</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              {t('tiers.cycle_desc')}
            </p>
          </div>
        </div>

        {/* Footer Close Button */}
        <div className="pt-2 border-t border-slate-100 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs active:scale-95 transition"
          >
            {t('tiers.btn_got_it')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TierBenefitsModal;
