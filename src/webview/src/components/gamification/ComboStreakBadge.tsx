import React from 'react';
import { useTranslation } from 'react-i18next';
import { Flame } from 'lucide-react';

export interface ComboStreakBadgeProps {
  streak: number;
}

export const ComboStreakBadge: React.FC<ComboStreakBadgeProps> = ({ streak }) => {
  const { t } = useTranslation();
  if (streak < 2) return null;

  const isFrenzy = streak >= 5;
  const multiplier = streak >= 5 ? 'x2.0' : streak >= 3 ? 'x1.5' : 'x1.2';

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black shadow-lg transition active:scale-95 ${
        isFrenzy
          ? 'bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500 text-white animate-bounce shadow-red-500/40 border border-yellow-300'
          : 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-amber-500/30'
      }`}
    >
      <Flame className={`w-3.5 h-3.5 ${isFrenzy ? 'fill-yellow-300 text-yellow-300 animate-spin' : 'fill-slate-950'}`} />
      <span>
        {isFrenzy ? t('gamehub.streak_frenzy', { defaultValue: 'CHẾ ĐỘ FRENZY' }) : t('gamehub.streak_label', { count: streak, defaultValue: `CHUỖI THẮNG ${streak} VÁN` })}
      </span>
      <span className="bg-black/25 text-white px-1.5 py-0.2 rounded-md text-[10px] tracking-wide">
        {t('gamehub.streak_multiplier', { multiplier, defaultValue: `${multiplier} ĐIỂM` })}
      </span>
    </div>
  );
};
