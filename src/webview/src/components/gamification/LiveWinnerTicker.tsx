import React, { useState, useEffect } from 'react';
import { Flame } from 'lucide-react';

interface WinnerFeedItem {
  id: string;
  userPhone: string;
  gameName: string;
  prizeText: string;
  icon: string;
  timeAgo: string;
}

const DEFAULT_WINNERS: WinnerFeedItem[] = [
  { id: '1', userPhone: '0987***123', gameName: 'Vé Cào May Mắn', prizeText: '+500 Điểm Thưởng', icon: '👑', timeAgo: 'Vừa xong' },
  { id: '2', userPhone: '5093***456', gameName: 'Rương Báu Caribe', prizeText: '+1,000 Điểm Nổ Hũ', icon: '💎', timeAgo: '1 phút trước' },
  { id: '3', userPhone: '0912***789', gameName: 'Tháp May Mắn', prizeText: 'Nhân x50 Điểm (+1,500)', icon: '🏰', timeAgo: '2 phút trước' },
  { id: '4', userPhone: '5094***888', gameName: 'Sút Phạt Đền', prizeText: '+250 Điểm Tuyệt Phẩm', icon: '⚽', timeAgo: '3 phút trước' },
  { id: '5', userPhone: '0977***999', gameName: 'Thả Bi Plinko', prizeText: 'Hộc Kim Cương x10', icon: '🎯', timeAgo: '4 phút trước' },
  { id: '6', userPhone: '0933***555', gameName: 'Đập Trứng Vàng', prizeText: '+300 Điểm Thần Tài', icon: '🥚', timeAgo: '5 phút trước' },
];

export const LiveWinnerTicker: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFading, setIsFading] = useState<boolean>(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % DEFAULT_WINNERS.length);
        setIsFading(false);
      }, 300);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const current = DEFAULT_WINNERS[currentIndex];

  return (
    <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-red-500/15 border border-amber-500/30 rounded-2xl px-3.5 py-2 flex items-center gap-2.5 backdrop-blur-md shadow-sm overflow-hidden text-xs">
      <div className="flex items-center gap-1 bg-amber-500 text-slate-900 font-bold px-2 py-0.5 rounded-full text-[10px] shrink-0 uppercase tracking-wider animate-pulse">
        <Flame className="w-3 h-3 fill-slate-900" />
        Vinh Danh
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
          <span className="text-slate-500 dark:text-slate-400 truncate">{current.gameName}:</span>
          <span className="font-bold text-amber-600 dark:text-amber-400 shrink-0">{current.prizeText}</span>
        </div>
        <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0 ml-2">{current.timeAgo}</span>
      </div>
    </div>
  );
};
