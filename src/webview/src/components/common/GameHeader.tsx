import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Volume2, VolumeX, RotateCcw, HelpCircle } from 'lucide-react';

export interface GameHeaderProps {
  title: string;
  subtitle?: string;
  onBack: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onRestart?: () => void;
  restartTooltip?: string;
  onHelp?: () => void;
  rightExtra?: React.ReactNode;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  title,
  subtitle,
  onBack,
  soundEnabled,
  onToggleSound,
  onRestart,
  restartTooltip,
  onHelp,
  rightExtra,
}) => {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80 shadow-md select-none">
      <div className="max-w-md md:max-w-xl mx-auto w-full px-3 sm:px-4 h-13 sm:h-14 flex items-center justify-between gap-2">
        {/* Left: Back Icon Button (Square, Sleek & Compact) */}
        <button
          onClick={onBack}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 transition flex items-center justify-center border border-slate-700 text-amber-400 hover:text-amber-300 shadow-xs shrink-0"
          title={t('games.common.btn_back_tooltip') || t('games.common.btn_back')}
          aria-label={t('games.common.btn_back')}
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
        </button>

        {/* Center: Game Title & Subtitle Badge */}
        <div className="flex-1 min-w-0 flex flex-col items-center justify-center text-center px-1">
          <h1 className="text-xs sm:text-sm font-black bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 bg-clip-text text-transparent truncate tracking-wide uppercase max-w-full">
            {title}
          </h1>
          {subtitle && (
            <span className="text-[10px] sm:text-[11px] text-amber-400/80 font-semibold truncate leading-tight mt-0.5 font-mono">
              {subtitle}
            </span>
          )}
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {rightExtra}

          {onHelp && (
            <button
              onClick={onHelp}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 transition flex items-center justify-center border border-slate-700 text-amber-400 hover:text-amber-300 shadow-xs"
              title={t('games.common.btn_how_to_play')}
              aria-label={t('games.common.btn_how_to_play')}
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          )}

          {onRestart && (
            <button
              onClick={onRestart}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 transition flex items-center justify-center border border-slate-700 text-slate-200 hover:text-white shadow-xs"
              title={restartTooltip || t('games.common.btn_play_again')}
              aria-label={restartTooltip || t('games.common.btn_play_again')}
            >
              <RotateCcw className="w-4 h-4 text-amber-400" />
            </button>
          )}

          <button
            onClick={onToggleSound}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 transition flex items-center justify-center border border-slate-700 text-slate-200 hover:text-white shadow-xs"
            title={soundEnabled ? t('games.common.sound_off') : t('games.common.sound_on')}
            aria-label={soundEnabled ? t('games.common.sound_off') : t('games.common.sound_on')}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-amber-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
