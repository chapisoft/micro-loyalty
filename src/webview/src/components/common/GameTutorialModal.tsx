import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  Target,
  Gamepad2,
  Trophy,
  Sparkles,
  Lightbulb,
  CheckCircle2,
} from 'lucide-react';
import { GameSounds } from '../../utils/audio';

export interface GameTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameTitle: string;
  gameIcon?: React.ReactNode;
  goal: string;
  controls: string;
  scoring: string;
  tips: string;
}

export const GameTutorialModal: React.FC<GameTutorialModalProps> = ({
  isOpen,
  onClose,
  gameTitle,
  gameIcon,
  goal,
  controls,
  scoring,
  tips,
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const handleClose = () => {
    GameSounds.playTap();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in select-none">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="relative bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-600/20 p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center font-black text-lg shadow-md shrink-0">
              {gameIcon || <Sparkles className="w-5 h-5 text-slate-950" />}
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block leading-none mb-1">
                {t('games.common.tutorial_title')}
              </span>
              <h2 className="text-base sm:text-lg font-black text-white truncate tracking-tight uppercase">
                {gameTitle}
              </h2>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-400 hover:text-white transition border border-slate-700 shrink-0 ml-2"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Instruction Cards */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 no-scrollbar text-xs sm:text-sm">
          {/* Card 1: Mục Tiêu Trò Chơi */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5 space-y-1.5">
            <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs uppercase tracking-wide">
              <Target className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{t('games.common.section_goal')}</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-xs sm:text-[13px]">
              {goal}
            </p>
          </div>

          {/* Card 2: Cách Thức Điều Khiển */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5 space-y-1.5">
            <div className="flex items-center space-x-2 text-indigo-400 font-bold text-xs uppercase tracking-wide">
              <Gamepad2 className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>{t('games.common.section_controls')}</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-xs sm:text-[13px]">
              {controls}
            </p>
          </div>

          {/* Card 3: Tính Điểm & Phần Thưởng */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5 space-y-1.5">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs uppercase tracking-wide">
              <Trophy className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{t('games.common.section_scoring')}</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-xs sm:text-[13px]">
              {scoring}
            </p>
          </div>

          {/* Card 4: Mẹo Đạt Điểm Kỷ Lục */}
          <div className="bg-amber-950/30 border border-amber-500/40 rounded-2xl p-3.5 space-y-1.5">
            <div className="flex items-center space-x-2 text-amber-300 font-bold text-xs uppercase tracking-wide">
              <Lightbulb className="w-4 h-4 text-amber-300 shrink-0 animate-pulse" />
              <span>{t('games.common.section_tips')}</span>
            </div>
            <p className="text-amber-100/90 leading-relaxed text-xs sm:text-[13px]">
              {tips}
            </p>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800">
          <button
            onClick={handleClose}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 active:scale-95 hover:brightness-105 transition flex items-center justify-center space-x-2"
          >
            <CheckCircle2 className="w-4 h-4 text-slate-950" />
            <span>{t('games.common.btn_start_game')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
