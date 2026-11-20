import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { RotateCcw } from 'lucide-react';
import { soundHaptics } from '../../utils/soundHaptics';
import { GameHeader } from '../../components/common/GameHeader';
import { GameTutorialModal } from '../../components/common/GameTutorialModal';

export interface MergeDropGameProps {
  onBack: () => void;
  onClaimReward?: (pointsWon: number) => void;
}

interface FruitDef {
  tier: number;
  emoji: string;
  name: string;
  r: number;
  color: string;
  points: number;
}

const FRUITS: FruitDef[] = [
  { tier: 0, emoji: '🍒', name: 'Cherry', r: 15, color: '#EF4444', points: 2 },
  { tier: 1, emoji: '🍓', name: 'Strawberry', r: 20, color: '#F43F5E', points: 4 },
  { tier: 2, emoji: '🍇', name: 'Grape', r: 26, color: '#8B5CF6', points: 8 },
  { tier: 3, emoji: '🍋', name: 'Lemon', r: 32, color: '#EAB308', points: 16 },
  { tier: 4, emoji: '🍊', name: 'Orange', r: 39, color: '#F97316', points: 32 },
  { tier: 5, emoji: '🍎', name: 'Apple', r: 47, color: '#DC2626', points: 64 },
  { tier: 6, emoji: '🍑', name: 'Peach', r: 56, color: '#FB7185', points: 128 },
  { tier: 7, emoji: '🍍', name: 'Pineapple', r: 66, color: '#FBBF24', points: 256 },
  { tier: 8, emoji: '🍈', name: 'Melon', r: 78, color: '#84CC16', points: 512 },
  { tier: 9, emoji: '🍉', name: 'Watermelon', r: 92, color: '#10B981', points: 1000 },
];

interface CircleBody {
  id: number;
  tier: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
}

const W = 400;
const H = 580;
const DANGER_Y = 85;

export const MergeDropGame: React.FC<MergeDropGameProps> = ({ onBack, onClaimReward }) => {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);
  const [nextTier, setNextTier] = useState(0);
  const [aimX, setAimX] = useState(W / 2);

  // Confetti particles on victory / milestone
  const [confetti, setConfetti] = useState<
    Array<{ id: number; x: number; y: number; color: string; size: number; delay: number }>
  >([]);

  const bodiesRef = useRef<CircleBody[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const nextIdRef = useRef(1);
  const isDroppingRef = useRef(false);
  const dangerTimerRef = useRef(0);

  const getRandomSpawnTier = () => Math.floor(Math.random() * 4); // Only small tiers 0..3

  const resetGame = useCallback(() => {
    bodiesRef.current = [];
    particlesRef.current = [];
    isDroppingRef.current = false;
    dangerTimerRef.current = 0;
    setScore(0);
    setIsGameOver(false);
    setNextTier(getRandomSpawnTier());
    setAimX(W / 2);
    setConfetti([]);
  }, []);

  const handleGameOver = useCallback(() => {
    setIsGameOver(true);
    soundHaptics.playBombExplosion();

    setScore((s) => {
      if (s > bestScore) setBestScore(s);
      if (onClaimReward && s > 0) {
        const coins = Math.min(100, Math.floor(s / 20));
        onClaimReward(coins);
      }
      return s;
    });
  }, [bestScore, onClaimReward]);

  const dropCurrentFruit = useCallback(() => {
    if (isGameOver || isDroppingRef.current) return;

    isDroppingRef.current = true;
    const def = FRUITS[nextTier];

    bodiesRef.current.push({
      id: nextIdRef.current++,
      tier: nextTier,
      x: Math.max(def.r + 10, Math.min(W - def.r - 10, aimX)),
      y: 50,
      vx: (Math.random() - 0.5) * 0.5,
      vy: 2.5,
      r: def.r,
    });

    soundHaptics.playClick();
    setNextTier(getRandomSpawnTier());

    setTimeout(() => {
      isDroppingRef.current = false;
    }, 450);
  }, [isGameOver, nextTier, aimX]);

  // Main Physics and Rendering Loop
  useEffect(() => {
    let animId: number;

    const loop = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const bodies = bodiesRef.current;
      const particles = particlesRef.current;

      // ── Physics update ──
      const GRAV = 0.38;
      const DAMP = 0.985;
      const RESTIT = 0.28;

      bodies.forEach((b) => {
        b.vy += GRAV;
        b.vx *= DAMP;
        b.vy *= DAMP;
        b.x += b.vx;
        b.y += b.vy;

        // Wall collisions
        if (b.x - b.r < 8) {
          b.x = 8 + b.r;
          b.vx = -b.vx * RESTIT;
        } else if (b.x + b.r > W - 8) {
          b.x = W - 8 - b.r;
          b.vx = -b.vx * RESTIT;
        }

        // Floor collision
        if (b.y + b.r > H - 12) {
          b.y = H - 12 - b.r;
          b.vy = -b.vy * RESTIT;
          if (Math.abs(b.vy) < 0.2) b.vy = 0;
        }
      });

      // Pairwise circle collisions and Merging
      const toRemove = new Set<number>();
      const toSpawn: CircleBody[] = [];

      for (let i = 0; i < bodies.length; i++) {
        for (let j = i + 1; j < bodies.length; j++) {
          const b1 = bodies[i];
          const b2 = bodies[j];
          if (toRemove.has(b1.id) || toRemove.has(b2.id)) continue;

          const dx = b2.x - b1.x;
          const dy = b2.y - b1.y;
          const dist = Math.hypot(dx, dy);
          const minDist = b1.r + b2.r;

          if (dist < minDist && dist > 0.001) {
            // Collision detected!
            if (b1.tier === b2.tier && b1.tier < FRUITS.length - 1) {
              // MERGE!
              toRemove.add(b1.id);
              toRemove.add(b2.id);

              const newTier = b1.tier + 1;
              const nextDef = FRUITS[newTier];
              const midX = (b1.x + b2.x) / 2;
              const midY = (b1.y + b2.y) / 2;

              toSpawn.push({
                id: nextIdRef.current++,
                tier: newTier,
                x: midX,
                y: midY,
                vx: (b1.vx + b2.vx) * 0.3,
                vy: -1.5,
                r: nextDef.r,
              });

              setScore((s) => s + nextDef.points);
              soundHaptics.playMatchSuccess();

              // Spawn splash particles
              for (let k = 0; k < 12; k++) {
                const angle = Math.random() * Math.PI * 2;
                const spd = 1.5 + Math.random() * 3;
                particles.push({
                  x: midX,
                  y: midY,
                  vx: Math.cos(angle) * spd,
                  vy: Math.sin(angle) * spd,
                  color: nextDef.color,
                  life: 1.0,
                });
              }

              // Watermelon fanfare
              if (newTier === FRUITS.length - 1) {
                soundHaptics.playVictoryFanfare();
              }
            } else {
              // Push apart
              const overlap = (minDist - dist) * 0.5;
              const nx = dx / dist;
              const ny = dy / dist;

              b1.x -= nx * overlap;
              b1.y -= ny * overlap;
              b2.x += nx * overlap;
              b2.y += ny * overlap;

              // Elastic impulse
              const kx = b1.vx - b2.vx;
              const ky = b1.vy - b2.vy;
              const p = 2 * (nx * kx + ny * ky) / 2;

              b1.vx -= p * nx * 0.5;
              b1.vy -= p * ny * 0.5;
              b2.vx += p * nx * 0.5;
              b2.vy += p * ny * 0.5;
            }
          }
        }
      }

      // Apply merges
      if (toRemove.size > 0) {
        bodiesRef.current = bodies.filter((b) => !toRemove.has(b.id)).concat(toSpawn);
      }

      // Danger line check (only bodies that settled)
      let isOverflowing = false;
      bodiesRef.current.forEach((b) => {
        if (b.y - b.r < DANGER_Y && Math.abs(b.vy) < 0.2 && b.y > 60) {
          isOverflowing = true;
        }
      });

      if (isOverflowing && !isGameOver) {
        dangerTimerRef.current += 1 / 60;
        if (dangerTimerRef.current > 2.5) {
          handleGameOver();
        }
      } else {
        dangerTimerRef.current = Math.max(0, dangerTimerRef.current - 1 / 60);
      }

      // ── Rendering ──
      // Clear arena background
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, W, H);

      // Arena walls
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, 8, H);
      ctx.fillRect(W - 8, 0, 8, H);
      ctx.fillRect(0, H - 12, W, 12);

      // Danger Overflow Line
      ctx.strokeStyle = dangerTimerRef.current > 0 ? '#EF4444' : '#64748B40';
      ctx.lineWidth = dangerTimerRef.current > 0 ? 3 : 1.5;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(8, DANGER_Y);
      ctx.lineTo(W - 8, DANGER_Y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Aim Guide Line & Preview Fruit
      if (!isGameOver) {
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(aimX, 50);
        ctx.lineTo(aimX, H - 12);
        ctx.stroke();
        ctx.setLineDash([]);

        // Preview fruit at top
        const def = FRUITS[nextTier];
        ctx.beginPath();
        ctx.arc(aimX, 45, def.r, 0, Math.PI * 2);
        ctx.fillStyle = def.color;
        ctx.fill();
        ctx.font = `${Math.floor(def.r * 1.2)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(def.emoji, aimX, 47);
      }

      // Draw Settled Fruit Bodies
      bodiesRef.current.forEach((b) => {
        const def = FRUITS[b.tier];
        // Outer glowing body
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = def.color;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.stroke();

        // Fruit Emoji
        ctx.font = `${Math.floor(b.r * 1.15)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(def.emoji, b.x, b.y + 1);
      });

      // Update and draw particles
      for (let pIdx = particles.length - 1; pIdx >= 0; pIdx--) {
        const p = particles[pIdx];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.03;
        if (p.life <= 0) {
          particles.splice(pIdx, 1);
          continue;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4 * p.life, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isGameOver, nextTier, aimX, handleGameOver]);

  useEffect(() => {
    resetGame();
  }, [resetGame]);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const scale = W / rect.width;
    setAimX(Math.max(30, Math.min(W - 30, clientX * scale)));
  };

  return (
    <div
      style={{ touchAction: 'none' }}
      className="relative flex flex-col h-[100dvh] w-full max-w-[430px] mx-auto bg-slate-950 select-none overflow-hidden overscroll-none"
    >
      {/* ── 1. PINNED GAME HEADER ── */}
      <GameHeader
        title={t('games.mergedrop.title', 'Hợp Nhất Trái Cây')}
        subtitle={`${t('games.mergedrop.next_label', 'Tiếp theo:')} ${FRUITS[nextTier].emoji} • ${score} pts`}
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
          <span className="text-[11px] font-bold text-slate-400">{t('games.mergedrop.next', 'Quả kế:')}</span>
          <span className="text-xl leading-none">{FRUITS[nextTier].emoji}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400">{t('games.mergedrop.score_label', 'Điểm')}:</span>
          <span className="text-sm font-black text-amber-400 font-mono">{score}</span>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold leading-none">
            {t('games.mergedrop.best_label', 'Kỷ Lục')}
          </span>
          <span className="text-sm font-black text-emerald-400 font-mono leading-none">{bestScore}</span>
        </div>
      </div>

      {/* ── 3. MAIN ARENA CANVAS ── */}
      <div
        onPointerMove={handlePointerMove}
        onPointerUp={dropCurrentFruit}
        className="relative flex-1 w-full flex items-center justify-center cursor-crosshair overflow-hidden"
      >
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="w-full h-full object-contain pointer-events-none"
        />

        {/* Tip */}
        <p className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-slate-400 font-medium text-center pointer-events-none whitespace-nowrap">
          {t('games.mergedrop.tip', '👉 Kéo để ngắm, nhả tay để thả trái cây xuống!')}
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
          <div className="bg-slate-900 border border-emerald-500/50 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl relative">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-400 to-green-500 text-slate-950 flex items-center justify-center text-3xl mx-auto shadow-xl animate-bounce">
              🍉
            </div>
            <div>
              <h3 className="text-xl font-black text-emerald-400">
                {t('games.mergedrop.over_title', 'HỘP TRÁI CÂY ĐÃ ĐẦY!')}
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                {t('games.mergedrop.over_desc', {
                  score,
                  defaultValue: `Bạn đã hợp nhất được tổng cộng ${score} điểm!`,
                })}
              </p>
            </div>

            <div className="bg-slate-800/80 rounded-2xl p-3 border border-slate-700 text-xs flex justify-between items-center">
              <span className="text-slate-400">{t('games.mergedrop.reward_label', 'Xu Natcash thưởng:')}</span>
              <span className="font-mono font-bold text-amber-400">
                +{Math.min(100, Math.floor(score / 20))} {t('games.mergedrop.coin_unit', 'Xu 🪙')}
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={resetGame}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-green-400 hover:from-emerald-400 text-slate-950 font-black rounded-2xl text-xs shadow-lg active:scale-95 transition flex items-center justify-center gap-1.5"
              >
                <RotateCcw size={14} />
                <span>{t('games.mergedrop.btn_retry', 'THỬ LẠI')}</span>
              </button>
              <button
                onClick={onBack}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl text-xs border border-slate-700 active:scale-95 transition"
              >
                {t('games.mergedrop.btn_hub', 'VỀ GAMEHUB')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 5. TUTORIAL MODAL ── */}
      <GameTutorialModal
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
        gameTitle={t('games.mergedrop.title', 'Hợp Nhất Trái Cây')}
        goal={t('games.mergedrop.tut_goal', 'Thả các loại quả giống nhau va chạm vào nhau để tiến hóa lên quả to hơn, mục tiêu là Quả Dưa Hấu Khổng Lồ!')}
        controls={t('games.mergedrop.tut_ctrl', 'Di chuyển ngón tay để ngắm vị trí thả, nhấc tay ra để thả quả rơi xuống.')}
        scoring={t('games.mergedrop.tut_score', 'Mỗi lần hợp nhất tạo quả to hơn sẽ nhận được số điểm tương ứng.')}
        tips={t('games.mergedrop.tut_tips', 'Nên dồn các quả to sang một góc đáy thùng để tránh làm nghẽn vạch nguy hiểm ở trên.')}
      />
    </div>
  );
};
