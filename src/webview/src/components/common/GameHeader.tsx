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
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800/80 px-3 sm:px-4 py-2.5 shadow-sm select-none">
      <div className="max-w-md mx-auto w-full flex items-center justify-between gap-2">
        {/* Left: Back to Games Catalog Button */}
        <button
          onClick={onBack}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 active:scale-95 transition text-xs font-bold text-slate-200 border border-slate-700/80 shadow-xs shrink-0"
        >
          <ArrowLeft className="w-4 h-4 text-amber-400" />
          <span className="hidden xs:inline sm:inline">{t('games.common.btn_back')}</span>
        </button>

        {/* Center: Game Title & Tag */}
        <div className="flex flex-col items-center justify-center text-center px-1 min-w-0 flex-1">
          <h1 className="text-xs sm:text-sm md:text-base font-black bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 bg-clip-text text-transparent truncate tracking-tight uppercase">
            {title}
          </h1>
          {subtitle && (
            <span className="text-[9px] sm:text-[10px] text-amber-400/90 font-medium truncate leading-none mt-0.5">
              {subtitle}
            </span>
          )}
        </div>

        {/* Right: Action Buttons (Extra Stat / Help / Restart / Sound Toggle) */}
        <div className="flex items-center gap-1.5 shrink-0">
          {rightExtra}

          {onHelp && (
            <button
              onClick={onHelp}
              className="p-1.5 sm:p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 active:scale-95 transition text-amber-400 hover:text-amber-300 border border-slate-700/80 shadow-xs"
              title={t('games.common.btn_how_to_play')}
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          )}

          {onRestart && (
            <button
              onClick={onRestart}
              className="p-1.5 sm:p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 active:scale-95 transition text-slate-300 border border-slate-700/80 shadow-xs"
              title={restartTooltip || t('games.common.btn_play_again')}
            >
              <RotateCcw className="w-4 h-4 text-amber-400" />
            </button>
          )}

          <button
            onClick={onToggleSound}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 active:scale-95 transition text-slate-300 border border-slate-700/80 shadow-xs"
            title={soundEnabled ? t('games.common.sound_off') : t('games.common.sound_on')}
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
