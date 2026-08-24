import React, { useState, useEffect } from 'react';
import { Crown, Sparkles, Flame } from 'lucide-react';

export const MegaJackpotBanner: React.FC = () => {
  const [jackpotAmount, setJackpotAmount] = useState<number>(258450);

  useEffect(() => {
    const interval = setInterval(() => {
      setJackpotAmount((prev) => prev + Math.floor(Math.random() * 15) + 5);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-600 via-yellow-600 to-amber-700 p-0.5 shadow-xl shadow-amber-500/20">
      {/* Background Animated Glow */}
      <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-amber-300 to-orange-500 rounded-3xl blur opacity-30 animate-pulse" />

      <div className="relative rounded-[22px] bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-4 text-white">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
              <Crown className="w-5 h-5 text-amber-400 animate-bounce" />
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  Hũ Rồng Vàng Siêu Cấp
                </span>
                <span className="bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase animate-pulse">
                  HOT
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Tích lũy toàn hệ thống tuần này</p>
            </div>
          </div>

          <div className="text-right">
            <span className="inline-flex items-center gap-1 text-[10px] text-amber-300/80 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
              <Sparkles className="w-3 h-3 text-amber-300" />
              100% Trúng Ngẫu Nhiên
            </span>
          </div>
        </div>

        {/* Counter Display */}
        <div className="mt-1 bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/80 border border-amber-500/40 rounded-2xl py-2.5 px-4 text-center">
          <div className="text-2xl sm:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-400 drop-shadow-[0_2px_10px_rgba(245,158,11,0.5)] font-mono">
            {jackpotAmount.toLocaleString()} <span className="text-sm font-sans font-bold text-amber-400">HTG</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Tương đương <span className="text-amber-300 font-semibold">{Math.round(jackpotAmount / 5).toLocaleString()} Điểm Thưởng Loyalty</span>
          </div>
        </div>
      </div>
    </div>
  );
};
