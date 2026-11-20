import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { RotateCcw, Clock, Flame } from 'lucide-react';
import { soundHaptics } from '../../utils/soundHaptics';
import { GameHeader } from '../../components/common/GameHeader';
import { GameTutorialModal } from '../../components/common/GameTutorialModal';

export interface WhackAMoleGameProps {
  onBack: () => void;
  onClaimReward?: (pointsWon: number) => void;
}

type HoleType = 'mole' | 'gold' | 'bomb' | null;

interface FloatingText {
  id: number;
  holeIdx: number;
  text: string;
  color: string;
}

const TOTAL_HOLES = 9;
const GAME_DURATION = 45; // 45 seconds

export const WhackAMoleGame: React.FC<WhackAMoleGameProps> = ({ onBack, onClaimReward }) => {
  const { t } = useTranslation();

  const [holes, setHoles] = useState<HoleType[]>(new Array(TOTAL_HOLES).fill(null));
  const [whackedHole, setWhackedHole] = useState<number | null>(null);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [score, setScore] = useState(0);
  const [hits, setHits] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);

  // Confetti particles on victory
  const [confetti, setConfetti] = useState<
    Array<{ id: number; x: number; y: number; color: string; size: number; delay: number }>
  >([]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const spawnTimerRef = useRef<NodeJS.Timeout | null>(null);
  const nextFloatIdRef = useRef(1);

  const clearAllTimers = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
  };

  const handleGameOver = useCallback(() => {
    clearAllTimers();
    setIsPlaying(false);
    setIsGameOver(true);
    setHoles(new Array(TOTAL_HOLES).fill(null));

    soundHaptics.playVictoryFanfare();

    // Spawn victory confetti
    const parts = Array.from({ length: 35 }, (_, i) => ({
      id: i,
      x: Math.random() * 90 + 5,
      y: Math.random() * 40 + 10,
      color: ['#F59E0B', '#EF4444', '#10B981', '#3B82F6'][i % 4],
      size: Math.random() * 8 + 6,
      delay: Math.random() * 0.4,
    }));
    setConfetti(parts);

    if (onClaimReward && score > 0) {
      const coins = Math.min(100, Math.floor(score / 5));
      onClaimReward(coins);
    }
  }, [score, onClaimReward]);

  const spawnRandomMole = useCallback(() => {
    setHoles((prev) => {
      const emptyIndices = prev
        .map((val, idx) => (val === null ? idx : null))
        .filter((val): val is number => val !== null);

      if (emptyIndices.length === 0) return prev;

      const randomIdx = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
      const roll = Math.random();
      const type: HoleType = roll < 0.65 ? 'mole' : roll < 0.85 ? 'gold' : 'bomb';

      const next = [...prev];
      next[randomIdx] = type;

      // Auto-hide after 1.2s to 1.8s if not whacked
      setTimeout(() => {
        setHoles((curr) => {
          if (curr[randomIdx] === type) {
            const cleared = [...curr];
            cleared[randomIdx] = null;
            return cleared;
          }
          return curr;
        });
      }, 1400);

      return next;
    });
  }, []);

  const startGame = useCallback(() => {
    clearAllTimers();
    setHoles(new Array(TOTAL_HOLES).fill(null));
    setTimeLeft(GAME_DURATION);
    setScore(0);
    setHits(0);
    setStreak(0);
    setWhackedHole(null);
    setFloatingTexts([]);
    setIsGameOver(false);
    setIsPlaying(true);
    setConfetti([]);

    // Main countdown timer
    timerRef.current = setInterval(() => {
      setTimeLeft((tVal) => {
        if (tVal <= 1) {
          handleGameOver();
          return 0;
        }
        return tVal - 1;
      });
    }, 1000);

    // Mole spawn loop
    spawnTimerRef.current = setInterval(() => {
      spawnRandomMole();
    }, 750);
  }, [handleGameOver, spawnRandomMole]);

  useEffect(() => {
    startGame();
    return () => clearAllTimers();
  }, [startGame]);

  const handleWhack = (idx: number) => {
    const target = holes[idx];
    if (!isPlaying || isGameOver || !target) return;

    setWhackedHole(idx);
    setTimeout(() => setWhackedHole(null), 250);

    // Remove from hole
    setHoles((prev) => {
      const next = [...prev];
      next[idx] = null;
      return next;
    });

    let points = 0;
    let floatColor = '#F59E0B';
    let floatLabel = '';

    if (target === 'mole') {
      points = 10;
      floatColor = '#10B981';
      floatLabel = '+10';
      setHits((h) => h + 1);
      setStreak((s) => {
        const nextS = s + 1;
        if (nextS > bestStreak) setBestStreak(nextS);
        return nextS;
      });
      soundHaptics.playClick();
    } else if (target === 'gold') {
      points = 30;
      floatColor = '#FBBF24';
      floatLabel = '+30 ⭐';
      setHits((h) => h + 1);
      setStreak((s) => {
        const nextS = s + 1;
        if (nextS > bestStreak) setBestStreak(nextS);
        return nextS;
      });
      soundHaptics.playMatchSuccess();
    } else if (target === 'bomb') {
      points = -20;
      floatColor = '#EF4444';
      floatLabel = '-20 💥';
      setStreak(0);
      soundHaptics.playBombExplosion();
    }

    setScore((s) => Math.max(0, s + points));

    // Spawn floating score feedback
    const floatId = nextFloatIdRef.current++;
    setFloatingTexts((prev) => [
      ...prev,
      { id: floatId, holeIdx: idx, text: floatLabel, color: floatColor },
    ]);
    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((f) => f.id !== floatId));
    }, 600);
  };

  return (
    <div
      style={{ touchAction: 'none' }}
      className="relative flex flex-col h-[100dvh] w-full max-w-[430px] mx-auto bg-slate-950 select-none overflow-hidden overscroll-none"
    >
      {/* ── 1. PINNED GAME HEADER ── */}
      <GameHeader
        title={t('games.whackamole.title', 'Đập Chuột Nhặt Xu')}
        subtitle={`${t('games.whackamole.time_left', 'Còn lại:')} ${timeLeft}s • ${score} pts`}
        onBack={onBack}
        soundEnabled={soundEnabled}
        onToggleSound={() => {
          soundHaptics.toggleMute();
          setSoundEnabled(!soundHaptics.isMuted());
        }}
        onRestart={startGame}
        onHelp={() => setShowTutorial(true)}
      />

      {/* ── 2. HUD STATUS BAR ── */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800/80 z-10 shrink-0">
        <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700">
          <Clock size={13} className={timeLeft <= 10 ? 'text-rose-400 animate-pulse' : 'text-sky-400'} />
          <span className={`text-xs font-black font-mono ${timeLeft <= 10 ? 'text-rose-400' : 'text-sky-300'}`}>
            {timeLeft}s
          </span>
        </div>

        {streak > 2 && (
          <div className="flex items-center gap-1 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/40">
            <Flame size={12} className="text-amber-400 fill-amber-400" />
            <span className="text-[11px] font-black text-amber-300">COMBO x{streak}</span>
          </div>
        )}

        <div className="text-right">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold leading-none">
            {t('games.whackamole.score_label', 'Điểm')}
          </span>
          <span className="text-base font-black text-amber-400 font-mono leading-none">{score}</span>
        </div>
      </div>

      {/* ── 3. MAIN 3x3 HOLES BURROW ARENA ── */}
      <div className="relative flex-1 w-full flex flex-col items-center justify-center p-4 overflow-hidden">
        <div className="grid grid-cols-3 gap-3 w-full max-w-[340px] aspect-square p-3 bg-gradient-to-b from-stone-900 to-amber-950/40 rounded-3xl border-2 border-stone-800 shadow-2xl">
          {holes.map((hole, idx) => {
            const isWhacked = whackedHole === idx;
            const floatItem = floatingTexts.find((f) => f.holeIdx === idx);

            return (
              <div
                key={idx}
                onClick={() => handleWhack(idx)}
                className="relative rounded-2xl bg-stone-950/90 border-2 border-stone-800 flex items-center justify-center cursor-pointer shadow-inner overflow-hidden active:scale-95 transition"
              >
                {/* Hole Mound shadow */}
                <div className="absolute inset-x-2 bottom-1.5 h-4 bg-stone-900 rounded-full opacity-60" />

                {/* Emerging Entity */}
                {hole && (
                  <div
                    className={`relative text-4xl select-none transition-transform duration-150 animate-bounce ${
                      isWhacked ? 'scale-125 brightness-150' : ''
                    }`}
                  >
                    {hole === 'mole' && '🐹'}
                    {hole === 'gold' && '⭐'}
                    {hole === 'bomb' && '💣'}
                  </div>
                )}

                {/* Hammer Whack Effect */}
                {isWhacked && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-3xl animate-ping">
                    💥
                  </div>
                )}

                {/* Floating Score */}
                {floatItem && (
                  <div
                    style={{ color: floatItem.color }}
                    className="absolute -top-1 left-1/2 -translate-x-1/2 font-black text-xs font-mono drop-shadow-md animate-fade-in pointer-events-none whitespace-nowrap z-20"
                  >
                    {floatItem.text}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Instructions */}
        <p className="mt-4 text-[11px] text-slate-400 font-medium text-center">
          {t('games.whackamole.tip', '👉 Đập chuột 🐹 (+10đ), bắt sao vàng ⭐ (+30đ), né bom 💣 (-20đ)!')}
        </p>

        {/* Confetti particles */}
        {confetti.map((p) => (
          <div
            key={p.id}
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size * 1.4}px`,
              backgroundColor: p.color,
              animationDelay: `${p.delay}s`,
            }}
            className="absolute rounded-sm pointer-events-none animate-fall"
          />
        ))}
      </div>

      {/* ── 4. GAME OVER MODAL ── */}
      {isGameOver && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-amber-500/50 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl relative">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-400 to-yellow-500 text-slate-950 flex items-center justify-center text-3xl mx-auto shadow-xl animate-bounce">
              🔨
            </div>
            <div>
              <h3 className="text-xl font-black text-amber-400">
                {t('games.whackamole.over_title', 'HẾT GIỜ ĐẬP CHUỘT!')}
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                {t('games.whackamole.over_desc', {
                  score,
                  hits,
                  defaultValue: `Bạn đã đập trúng ${hits} mục tiêu với tổng điểm ${score}!`,
                })}
              </p>
            </div>

            <div className="bg-slate-800/80 rounded-2xl p-3 border border-slate-700 text-xs flex justify-between items-center">
              <span className="text-slate-400">{t('games.whackamole.reward_label', 'Xu Natcash thưởng:')}</span>
              <span className="font-mono font-bold text-amber-400">
                +{Math.min(100, Math.floor(score / 5))} {t('games.whackamole.coin_unit', 'Xu 🪙')}
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={startGame}
                className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 text-slate-950 font-black rounded-2xl text-xs shadow-lg active:scale-95 transition flex items-center justify-center gap-1.5"
              >
                <RotateCcw size={14} />
                <span>{t('games.whackamole.btn_retry', 'ĐẬP LẠI')}</span>
              </button>
              <button
                onClick={onBack}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl text-xs border border-slate-700 active:scale-95 transition"
              >
                {t('games.whackamole.btn_hub', 'VỀ GAMEHUB')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 5. TUTORIAL MODAL ── */}
      <GameTutorialModal
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
        gameTitle={t('games.whackamole.title', 'Đập Chuột Nhặt Xu')}
        goal={t('games.whackamole.tut_goal', 'Đập nhanh các chú chuột và ngôi sao may mắn xuất hiện từ các hang đất trước khi chúng thụt xuống.')}
        controls={t('games.whackamole.tut_ctrl', 'Chạm nhanh vào ô có chuột hoặc sao vàng để vung búa đập.')}
        scoring={t('games.whackamole.tut_score', 'Chuột thường: +10 điểm. Sao vàng: +30 điểm. Chú ý: Đập trúng bom bị trừ -20 điểm!')}
        tips={t('games.whackamole.tut_tips', 'Giữ tập trung cao độ ở trung tâm màn hình để phản xạ kịp thời khi sao vàng xuất hiện.')}
      />
    </div>
  );
};
