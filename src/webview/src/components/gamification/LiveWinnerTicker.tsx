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
    <div className="bg-amber-50/95 border-2 border-amber-300 rounded-2xl px-3.5 py-2.5 flex items-center gap-2.5 shadow-sm overflow-hidden text-xs">
      <div className="flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black px-2.5 py-0.5 rounded-full text-[10px] shrink-0 uppercase tracking-wider shadow-xs animate-pulse">
        <Flame className="w-3 h-3 fill-slate-950 text-slate-950" />
        {t('ticker.honors', { defaultValue: 'VINH DANH' })}
      </div>

      <div
        className={`flex-1 flex items-center justify-between transition-opacity duration-300 ${
          isFading ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0'
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          <span className="text-base">{current.icon}</span>
          <span className="font-black text-slate-900 font-mono tracking-tight text-xs sm:text-sm">
            {current.userPhone}
          </span>
          <span className="text-amber-500 font-bold">•</span>
          <span className="font-bold text-slate-900 text-xs truncate">
            {t(current.gameKey, { defaultValue: current.defaultGame })}:
          </span>
          <span className="font-black text-amber-900 bg-amber-200/90 border border-amber-400 px-2 py-0.5 rounded-lg text-xs shrink-0 shadow-2xs">
            +{current.points} {t('nav.points_unit', { defaultValue: 'Điểm' })}
          </span>
        </div>
        <span className="text-[11px] font-bold text-slate-600 shrink-0 ml-2 hidden sm:inline-block">
          {timeText}
        </span>
      </div>
    </div>
  );
};

