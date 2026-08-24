import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Flame } from 'lucide-react';

export const LiveWinnerTicker: React.FC = () => {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFading, setIsFading] = useState<boolean>(false);

  const WINNERS = [
    { id: '1', userPhone: '5093***123', gameKey: 'games.flappy.title', defaultGame: 'Flappy Natcom', points: 120, icon: '🕊️', mins: 0 },
    { id: '2', userPhone: '5094***456', gameKey: 'games.fruit.title', defaultGame: 'Chém Hoa Quả', points: 250, icon: '🥭', mins: 1 },
    { id: '3', userPhone: '5093***789', gameKey: 'gamehub.game1_name', defaultGame: 'Vòng Quay Tri Ân', points: 500, icon: '🎡', mins: 2 },
    { id: '4', userPhone: '5094***888', gameKey: 'games.knife.title', defaultGame: 'Phi Dao Gỗ', points: 180, icon: '🗡️', mins: 3 },
    { id: '5', userPhone: '5093***999', gameKey: 'games.bubble.title', defaultGame: 'Bắn Bóng Kanaval', points: 300, icon: '🔮', mins: 4 },
    { id: '6', userPhone: '5094***555', gameKey: 'games.block.title', defaultGame: 'Xếp Gạch Kim Cương', points: 400, icon: '💎', mins: 5 },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % WINNERS.length);
        setIsFading(false);
      }, 300);
    }, 4000);

    return () => clearInterval(interval);
  }, [WINNERS.length]);

  const current = WINNERS[currentIndex];
  const timeText = current.mins === 0
    ? t('ticker.just_now', { defaultValue: 'Vừa xong' })
    : t('ticker.mins_ago', { count: current.mins, defaultValue: `${current.mins} phút trước` });

  return (
    <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-red-500/15 border border-amber-500/30 rounded-2xl px-3.5 py-2 flex items-center gap-2.5 backdrop-blur-md shadow-sm overflow-hidden text-xs">
      <div className="flex items-center gap-1 bg-amber-500 text-slate-900 font-bold px-2 py-0.5 rounded-full text-[10px] shrink-0 uppercase tracking-wider animate-pulse">
        <Flame className="w-3 h-3 fill-slate-900" />
        {t('ticker.honors', { defaultValue: 'VINH DANH' })}
      </div>

      <div
        className={`flex-1 flex items-center justify-between transition-opacity duration-300 ${
          isFading ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0'
        }`}
      >
        <div className="flex items-center gap-1.5 truncate">
          <span className="text-sm">{current.icon}</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{current.userPhone}</span>
          <span className="text-slate-400">•</span>
          <span className="text-slate-500 dark:text-slate-400 truncate">
            {t(current.gameKey, { defaultValue: current.defaultGame })}:
          </span>
          <span className="font-bold text-amber-600 dark:text-amber-400 shrink-0">
            +{current.points} {t('nav.points_unit', { defaultValue: 'Điểm' })}
          </span>
        </div>
        <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0 ml-2">{timeText}</span>
      </div>
    </div>
  );
};
