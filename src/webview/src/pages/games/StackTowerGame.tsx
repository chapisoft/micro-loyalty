import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { RotateCcw, Zap } from 'lucide-react';
import { soundHaptics } from '../../utils/soundHaptics';
import { GameHeader } from '../../components/common/GameHeader';
import { GameTutorialModal } from '../../components/common/GameTutorialModal';

export interface StackTowerGameProps {
  onBack: () => void;
  onClaimReward?: (pointsWon: number) => void;
}

interface Block {
  x: number;
  w: number;
  y?: number;
  colorIdx?: number;
}

interface Debris {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  rot: number;
  vRot: number;
  color: string;
}

const W = 400;
const H = 600;
const BH = 26; // Block height
const BASE_W = 180;
const BASE_Y = H - 80;
const PERFECT_TOL = 4;

const TOWER_PALETTES = [
  '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6', '#3B82F6',
  '#06B6D4', '#10B981', '#84CC16', '#EAB308', '#F97316'
];

export const StackTowerGame: React.FC<StackTowerGameProps> = ({ onBack, onClaimReward }) => {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);
  const [combo, setCombo] = useState(0);

  // Confetti particles on victory
  const [confetti, setConfetti] = useState<
    Array<{ id: number; x: number; y: number; color: string; size: number; delay: number }>
  >([]);

  // Engine state in ref for 60fps loop
  const engineRef = useRef<{
    stack: Block[];
    mover: { x: number; w: number; y: number; vx: number };
    side: number;
    debris: Debris[];
    camY: number;
    camTarget: number;
    combo: number;
    animId: number | null;
  }>({
    stack: [],
    mover: { x: 0, w: BASE_W, y: 0, vx: 3.5 },
    side: 1,
    debris: [],
    camY: 0,
    camTarget: 0,
    combo: 0,
    animId: null,
  });

  const getBlockColor = useCallback((idx: number) => {
    return TOWER_PALETTES[idx % TOWER_PALETTES.length];
  }, []);

  const resetGame = useCallback(() => {
    const eng = engineRef.current;
    eng.stack = [{ x: (W - BASE_W) / 2, w: BASE_W }];
    eng.debris = [];
    eng.camY = 0;
    eng.camTarget = 0;
    eng.side = 1;
    eng.combo = 0;

    const speed = 3.5;
    eng.mover = {
      w: BASE_W,
      x: -BASE_W,
      vx: speed,
      y: BASE_Y - BH,
    };

    setScore(0);
    setCombo(0);
    setIsGameOver(false);
    setIsPlaying(true);
    setConfetti([]);
  }, []);

  const spawnNextMover = useCallback(() => {
    const eng = engineRef.current;
    const top = eng.stack[eng.stack.length - 1];
    const lvl = eng.stack.length;
    const speed = Math.min(7.0, 3.2 + lvl * 0.12);

    eng.side *= -1;
    eng.mover = {
      w: top.w,
      x: eng.side > 0 ? -top.w : W,
      vx: speed * eng.side,
      y: BASE_Y - lvl * BH,
    };

    if (lvl > 5) {
      eng.camTarget = (lvl - 5) * BH;
    }
  }, []);

  const handleGameOver = useCallback(() => {
    setIsPlaying(false);
    setIsGameOver(true);
    soundHaptics.playBombExplosion();

    const currentScore = engineRef.current.stack.length - 1;
    setScore(currentScore);
    if (currentScore > bestScore) {
      setBestScore(currentScore);
    }

    if (currentScore >= 10) {
      const parts = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: Math.random() * 90 + 5,
        y: Math.random() * 40 + 10,
        color: TOWER_PALETTES[i % TOWER_PALETTES.length],
        size: Math.random() * 8 + 6,
        delay: Math.random() * 0.4,
      }));
      setConfetti(parts);
      soundHaptics.playVictoryFanfare();
    }

    if (onClaimReward && currentScore > 0) {
      const coins = Math.min(100, currentScore * 3);
      onClaimReward(coins);
    }
  }, [bestScore, onClaimReward]);

  const placeBlock = useCallback(() => {
    const eng = engineRef.current;
    if (!isPlaying || isGameOver) return;

    const top = eng.stack[eng.stack.length - 1];
    const { x, w, y } = eng.mover;

    const left = Math.max(top.x, x);
    const right = Math.min(top.x + top.w, x + w);
    const overlap = right - left;

    // Missed completely
    if (overlap <= 0) {
      // Add falling full block debris
      eng.debris.push({
        x,
        y,
        w,
        h: BH,
        vx: eng.mover.vx * 0.4,
        vy: 2,
        rot: 0,
        vRot: (Math.random() - 0.5) * 0.2,
        color: getBlockColor(eng.stack.length),
      });
      handleGameOver();
      return;
    }

    const offsetL = x - top.x;
    const isPerfect = Math.abs(offsetL) <= PERFECT_TOL;

    let newX = left;
    let newW = overlap;

    if (isPerfect) {
      // Perfect snap!
      newX = top.x;
      newW = top.w;
      eng.combo++;
      setCombo(eng.combo);
      soundHaptics.playMatchSuccess();

      // Bonus width on high combo
      if (eng.combo >= 5) {
        newW = Math.min(BASE_W, newW + 6);
        newX = Math.max(20, newX - 3);
      }
    } else {
      eng.combo = 0;
      setCombo(0);
      soundHaptics.playClick();

      // Sliced overhang piece falls as debris
      const color = getBlockColor(eng.stack.length);
      if (offsetL > 0) {
        // Dropped to the right
        eng.debris.push({
          x: top.x + top.w,
          y,
          w: Math.abs(offsetL),
          h: BH,
          vx: 2 + Math.random() * 2,
          vy: 1,
          rot: 0,
          vRot: 0.08,
          color,
        });
      } else {
        // Dropped to the left
        eng.debris.push({
          x,
          y,
          w: Math.abs(offsetL),
          h: BH,
          vx: -(2 + Math.random() * 2),
          vy: 1,
          rot: 0,
          vRot: -0.08,
          color,
        });
      }
    }

    eng.stack.push({ x: newX, w: newW });
    setScore(eng.stack.length - 1);
    spawnNextMover();
  }, [isPlaying, isGameOver, getBlockColor, spawnNextMover, handleGameOver]);

  // Main render and physics loop
  useEffect(() => {
    let animId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const eng = engineRef.current;

      // Update camera smooth follow
      eng.camY += (eng.camTarget - eng.camY) * 0.1;

      // Update mover position
      if (isPlaying && !isGameOver) {
        eng.mover.x += eng.mover.vx;
        if (eng.mover.x < -eng.mover.w - 20 || eng.mover.x > W + 20) {
          eng.mover.vx *= -1;
        }
      }

      // Update debris
      for (let i = eng.debris.length - 1; i >= 0; i--) {
        const d = eng.debris[i];
        d.x += d.vx;
        d.y += d.vy;
        d.vy += 0.4; // Gravity
        d.rot += d.vRot;
        if (d.y > H + 100) {
          eng.debris.splice(i, 1);
        }
      }

      // Clear Canvas with rich night sky gradient
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(0.5, '#1e1b4b');
      grad.addColorStop(1, '#090d16');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      ctx.save();
      ctx.translate(0, eng.camY);

      // Draw Stack Blocks
      eng.stack.forEach((b, i) => {
        const y = BASE_Y - i * BH;
        const color = getBlockColor(i);

        // Block body
        ctx.fillStyle = color;
        ctx.fillRect(b.x, y, b.w, BH - 2);

        // 3D Top bevel highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.fillRect(b.x, y, b.w, 4);

        // 3D Bottom bevel shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.fillRect(b.x, y + BH - 6, b.w, 4);
      });

      // Draw Moving Block
      if (isPlaying && !isGameOver) {
        const { x, w, y } = eng.mover;
        const color = getBlockColor(eng.stack.length);

        ctx.fillStyle = color;
        ctx.fillRect(x, y, w, BH - 2);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.fillRect(x, y, w, 4);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(x, y + BH - 6, w, 4);
      }

      // Draw Debris Pieces
      eng.debris.forEach((d) => {
        ctx.save();
        ctx.translate(d.x + d.w / 2, d.y + d.h / 2);
        ctx.rotate(d.rot);
        ctx.fillStyle = d.color;
        ctx.fillRect(-d.w / 2, -d.h / 2, d.w, d.h);
        ctx.restore();
      });

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, isGameOver, getBlockColor]);

  useEffect(() => {
    resetGame();
  }, [resetGame]);

  return (
    <div
      style={{ touchAction: 'none' }}
      className="relative flex flex-col h-[100dvh] w-full max-w-[430px] mx-auto bg-slate-950 select-none overflow-hidden overscroll-none"
    >
      {/* ── 1. PINNED GAME HEADER ── */}
      <GameHeader
        title={t('games.stacktower.title', 'Xây Tháp Chồng Gạch')}
        subtitle={`${t('games.stacktower.height_label', 'Tầng:')} ${score} • ${t('games.stacktower.best_label', 'Kỷ lục:')} ${bestScore}`}
        onBack={onBack}
        soundEnabled={soundEnabled}
        onToggleSound={() => {
          soundHaptics.toggleMute();
          setSoundEnabled(!soundHaptics.isMuted());
        }}
        onRestart={resetGame}
        onHelp={() => setShowTutorial(true)}
      />

      {/* ── 2. HUD STATUS BAR ── */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800/80 z-10 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400">{t('games.stacktower.height_label', 'Tầng')}:</span>
          <span className="text-sm font-black text-amber-400 font-mono">{score} 🏗️</span>
        </div>

        {combo > 1 && (
          <div className="flex items-center gap-1.5 bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-500/40 animate-pulse">
            <Zap size={13} className="text-amber-400 fill-amber-400" />
            <span className="text-xs font-black text-amber-300">COMBO x{combo}!</span>
          </div>
        )}

        <div className="text-right">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold leading-none">
            {t('games.stacktower.best_label', 'Kỷ Lục')}
          </span>
          <span className="text-sm font-black text-emerald-400 font-mono leading-none">{bestScore}</span>
        </div>
      </div>

      {/* ── 3. MAIN INTERACTIVE CANVAS ── */}
      <div
        onClick={placeBlock}
        className="relative flex-1 w-full flex items-center justify-center cursor-pointer overflow-hidden"
      >
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="w-full h-full object-contain pointer-events-none"
        />

        {/* Tap guide overlay if ready */}
        {score === 0 && isPlaying && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 px-4 py-2 bg-slate-900/80 border border-slate-700/80 rounded-2xl text-xs font-bold text-amber-300 pointer-events-none animate-bounce">
            👆 {t('games.stacktower.tap_to_drop', 'Chạm vào màn hình để thả gạch!')}
          </div>
        )}

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
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-400 to-orange-400 text-slate-950 flex items-center justify-center text-3xl mx-auto shadow-xl animate-bounce">
              🏗️
            </div>
            <div>
              <h3 className="text-xl font-black text-amber-400">
                {t('games.stacktower.over_title', 'TÒA THÁP ĐÃ ĐẠT ĐỈNH!')}
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                {t('games.stacktower.over_desc', {
                  height: score,
                  defaultValue: `Bạn đã xây được tháp cao ${score} tầng tuyệt đẹp!`,
                })}
              </p>
            </div>

            <div className="bg-slate-800/80 rounded-2xl p-3 border border-slate-700 text-xs flex justify-between items-center">
              <span className="text-slate-400">{t('games.stacktower.reward_label', 'Xu thưởng Natcash:')}</span>
              <span className="font-mono font-bold text-amber-400">
                +{Math.min(100, score * 3)} {t('games.stacktower.coin_unit', 'Xu 🪙')}
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={resetGame}
                className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 text-slate-950 font-black rounded-2xl text-xs shadow-lg active:scale-95 transition flex items-center justify-center gap-1.5"
              >
                <RotateCcw size={14} />
                <span>{t('games.stacktower.btn_retry', 'XÂY LẠI THÁP')}</span>
              </button>
              <button
                onClick={onBack}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl text-xs border border-slate-700 active:scale-95 transition"
              >
                {t('games.stacktower.btn_hub', 'VỀ GAMEHUB')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 5. TUTORIAL MODAL ── */}
      <GameTutorialModal
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
        gameTitle={t('games.stacktower.title', 'Xây Tháp Chồng Gạch')}
        goal={t('games.stacktower.tut_goal', 'Xây dựng tòa tháp cao nhất có thể bằng cách xếp chồng các khối gạch hoàn hảo.')}
        controls={t('games.stacktower.tut_ctrl', 'Chạm vào bất kỳ vị trí nào trên màn hình để thả khối gạch đang trượt xuống.')}
        scoring={t('games.stacktower.tut_score', 'Mỗi tầng tháp tính 1 điểm. Càng lên cao nhận càng nhiều xu thưởng Natcash.')}
        tips={t('games.stacktower.tut_tips', 'Căn thời điểm thật chuẩn khi khối gạch trùng khớp với khối dưới để kích hoạt chuỗi Combo!')}
      />
    </div>
  );
};
