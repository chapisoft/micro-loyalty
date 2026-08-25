import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, Zap } from 'lucide-react';

interface TurnRegenCountdownProps {
  freeTurns: number;
  maxTurns?: number;
  onTurnRegenerated?: () => void;
}

export const TurnRegenCountdown: React.FC<TurnRegenCountdownProps> = ({
  freeTurns,
  maxTurns = 3,
  onTurnRegenerated,
}) => {
  const { t } = useTranslation();
  const REGEN_CYCLE_SECONDS = 4 * 3600; // 4 tiếng = 14400 giây

  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
    try {
      const lastRegen = localStorage.getItem('MICRO_LOYALTY_LAST_REGEN_TIME');
      if (lastRegen) {
        const elapsed = Math.floor((Date.now() - parseInt(lastRegen, 10)) / 1000);
        const remaining = REGEN_CYCLE_SECONDS - (elapsed % REGEN_CYCLE_SECONDS);
        return remaining > 0 ? remaining : REGEN_CYCLE_SECONDS;
      }
    } catch {}
    return REGEN_CYCLE_SECONDS;
  });

  useEffect(() => {
    if (freeTurns >= maxTurns) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          try {
            localStorage.setItem('MICRO_LOYALTY_LAST_REGEN_TIME', Date.now().toString());
          } catch {}
          if (onTurnRegenerated) onTurnRegenerated();
          return REGEN_CYCLE_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [freeTurns, maxTurns, onTurnRegenerated]);

  if (freeTurns >= maxTurns) {
    return (
      <div className="flex items-center space-x-1.5 bg-emerald-500/15 border border-emerald-500/30 px-3 py-1.5 rounded-2xl text-emerald-400 text-xs font-bold shadow-xs">
        <Zap className="w-3.5 h-3.5 fill-emerald-400" />
        <span>{t('gamehub.energy_full', { defaultValue: 'ĐẦY LƯỢT MIỄN PHÍ' })}</span>
      </div>
    );
  }

  const hours = Math.floor(secondsRemaining / 3600);
  const minutes = Math.floor((secondsRemaining % 3600) / 60);
  const seconds = secondsRemaining % 60;
  const timeFormatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div className="flex items-center space-x-1.5 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-2xl text-amber-300 text-xs font-mono font-bold shadow-xs">
      <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
      <span className="text-[10px] text-amber-200/80 font-sans">{t('gamehub.next_turn_in', { defaultValue: 'Hồi 1 lượt sau:' })}</span>
      <span className="font-black text-amber-300">{timeFormatted}</span>
    </div>
  );
};
