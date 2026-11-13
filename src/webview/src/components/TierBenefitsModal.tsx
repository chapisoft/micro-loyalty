import React from 'react';
import { useTranslation } from 'react-i18next';
import { X, Crown, Check, Clock, FileText, Coins, Award } from 'lucide-react';
import { soundHaptics } from '../utils/soundHaptics';

interface TierPerkInfo {
  code: string;
  nameKey: string;
  upgradeRange: string;
  keepTierThreshold: string;
  multiplier: string;
  dailySpinsCount: number;
  cashback: string;
  perkKeys: string[];
  bgGrad: string;
  badgeColor: string;
}

const TIERS_DATA: TierPerkInfo[] = [
  {
    code: 'SILVER',
    nameKey: 'tiers.tier_silver',
    upgradeRange: '0 – 999',
    keepTierThreshold: '0',
    multiplier: '×1.0',
    dailySpinsCount: 1,
    cashback: '1.0%',
    perkKeys: ['tiers.perk_alliance_earn', 'tiers.perk_spins_1'],
    bgGrad: 'from-slate-100 to-slate-200 text-slate-800 border-slate-300',
    badgeColor: 'bg-slate-200 text-slate-700',
  },
  {
    code: 'GOLD',
    nameKey: 'tiers.tier_gold',
    upgradeRange: '1.000 – 4.999',
    keepTierThreshold: '800',
    multiplier: '×1.2',
    dailySpinsCount: 2,
    cashback: '1.5%',
    perkKeys: ['tiers.perk_mult_12', 'tiers.perk_spins_2', 'tiers.perk_bday_50'],
    bgGrad: 'from-amber-100 via-amber-50 to-yellow-100 text-amber-950 border-amber-300',
    badgeColor: 'bg-amber-400 text-slate-950 font-black',
  },
  {
    code: 'PLATINUM',
    nameKey: 'tiers.tier_platinum',
    upgradeRange: '5.000 – 14.999',
    keepTierThreshold: '4.000',
    multiplier: '×1.5',
    dailySpinsCount: 3,
    cashback: '2.0%',
    perkKeys: ['tiers.perk_mult_15', 'tiers.perk_spins_3', 'tiers.perk_free_transfer', 'tiers.perk_bday_150'],
    bgGrad: 'from-cyan-100 via-sky-50 to-blue-100 text-cyan-950 border-cyan-300',
    badgeColor: 'bg-cyan-500 text-white font-black',
  },
  {
    code: 'DIAMOND',
    nameKey: 'tiers.tier_diamond',
    upgradeRange: '15.000+',
    keepTierThreshold: '12.000',
    multiplier: '×2.0',
    dailySpinsCount: 5,
    cashback: '3.0%',
    perkKeys: ['tiers.perk_mult_20', 'tiers.perk_spins_5', 'tiers.perk_vip_hotline', 'tiers.perk_bday_500'],
    bgGrad: 'from-purple-100 via-fuchsia-50 to-indigo-100 text-purple-950 border-purple-300',
    badgeColor: 'bg-purple-600 text-white font-black',
  },
];

interface TierBenefitsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTierCode?: string;
  natcashCoins?: number | null;
  tierPoints?: number | null;
  onOpenTerms?: () => void;
}

export const TierBenefitsModal: React.FC<TierBenefitsModalProps> = ({
  isOpen,
  onClose,
  currentTierCode,
  natcashCoins = null,
  tierPoints = null,
  onOpenTerms,
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

        {/* Separated Balances: Natcash Coin vs Tier Qualifying Points */}
        <div className="grid grid-cols-2 gap-2.5 shrink-0">
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200/80">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-800 uppercase">
              <Coins className="w-3.5 h-3.5 text-amber-600" />
              <span>{t('tiers.natcash_coin_label')}</span>
            </div>
            <div className="font-mono font-black text-base text-amber-950 mt-0.5">
              {natcashCoins !== null ? natcashCoins.toLocaleString() : '—'}
            </div>
            <p className="text-[10px] text-amber-700/90 mt-0.5">{t('tiers.natcash_coin_hint')}</p>
          </div>

          <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-200/80">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-800 uppercase">
              <Award className="w-3.5 h-3.5 text-indigo-600" />
              <span>{t('tiers.qualifying_points_label')}</span>
            </div>
            <div className="font-mono font-black text-base text-indigo-950 mt-0.5">
              {tierPoints !== null ? tierPoints.toLocaleString() : '—'}
            </div>
            <p className="text-[10px] text-indigo-700/90 mt-0.5">{t('tiers.qualifying_points_hint')}</p>
          </div>
        </div>

        {/* Scrollable Tier Perks Cards */}
        <div className="space-y-3 overflow-y-auto flex-1 pr-1">
          {TIERS_DATA.map((tier) => {
            const isCurrent = Boolean(currentTierCode && tier.code === currentTierCode.toUpperCase());
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
                      {t('tier.your_tier_badge')}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-1.5 my-2 text-center text-[11px] bg-white/85 backdrop-blur-sm p-2 rounded-xl border border-white/60">
                  <div>
                    <span className="text-[9px] text-slate-500 block">{t('tier.multiplier_label')}</span>
                    <span className="font-black text-xs text-amber-700 font-mono">{tier.multiplier}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 block">{t('tier.daily_spins_label')}</span>
                    <span className="font-black text-xs text-indigo-700">
                      {t('tiers.spins_per_day', { count: tier.dailySpinsCount })}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 block">{t('tiers.upgrade_threshold_label')}</span>
                    <span className="font-bold text-[10px] text-slate-800 font-mono">{tier.upgradeRange}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 block">{t('tiers.keep_tier_label')}</span>
                    <span className="font-bold text-[10px] text-emerald-700 font-mono">{tier.keepTierThreshold}</span>
                  </div>
                </div>

                <ul className="space-y-1 mt-2 text-[11px]">
                  {tier.perkKeys.map((pk) => (
                    <li key={pk} className="flex items-center space-x-1.5 opacity-90">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{t(pk)}</span>
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

        {/* Footer Actions */}
        <div className="pt-2 border-t border-slate-100 shrink-0 flex items-center gap-2">
          {onOpenTerms && (
            <button
              onClick={() => {
                soundHaptics.playClick();
                onOpenTerms();
              }}
              className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-2xl text-xs active:scale-95 transition flex items-center justify-center gap-1.5 shrink-0"
            >
              <FileText className="w-3.5 h-3.5 text-amber-600" />
              <span>{t('tiers.btn_program_terms')}</span>
            </button>
          )}
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

export default TierBenefitsModal;
