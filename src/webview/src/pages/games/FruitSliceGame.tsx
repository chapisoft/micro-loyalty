import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Heart } from 'lucide-react';
import { GameSounds } from '../../utils/audio';
import { GameFXSystem } from '../../utils/game-fx';
import { GameHeader } from '../../components/common/GameHeader';
import { GameTutorialModal } from '../../components/common/GameTutorialModal';

export interface FruitSliceGameProps {
  onBack: () => void;
  onClaimReward?: (pointsWon: number) => void;
}

interface SlicedHalf {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  vRot: number;
  type: 'MANGO' | 'COCONUT' | 'PINEAPPLE' | 'WATERMELON';
  side: 'LEFT' | 'RIGHT';
  radius: number;
  alpha: number;
}

interface FruitItem {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: 'MANGO' | 'COCONUT' | 'PINEAPPLE' | 'WATERMELON' | 'BOMB';
  emoji: string;
  radius: number;
  isSliced: boolean;
  angle: number;
  vRot: number;
}

interface SlashPoint {
  x: number;
  y: number;
  time: number;
}

const FRUIT_TYPES = [
  { type: 'MANGO' as const, emoji: '🥭', radius: 24, juiceColor: '#F59E0B' },
  { type: 'COCONUT' as const, emoji: '🥥', radius: 22, juiceColor: '#F8FAFC' },
  { type: 'PINEAPPLE' as const, emoji: '🍍', radius: 26, juiceColor: '#FBBF24' },
  { type: 'WATERMELON' as const, emoji: '🍉', radius: 25, juiceColor: '#EF4444' },
];

export const FruitSliceGame: React.FC<FruitSliceGameProps> = ({ onBack, onClaimReward }) => {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [score, setScore] = useState<number>(0);
  const [lives, setLives] = useState<number>(3);
  const [combo, setCombo] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(!GameSounds.isSoundMuted());
  const [showRewardModal, setShowRewardModal] = useState<boolean>(false);
  const [rewardAmount, setRewardAmount] = useState<number>(0);
  const [showTutorial, setShowTutorial] = useState<boolean>(false);

  const fruitsRef = useRef<FruitItem[]>([]);
  const slicedHalvesRef = useRef<SlicedHalf[]>([]);
  const slashTrailRef = useRef<SlashPoint[]>([]);
  const fxRef = useRef<GameFXSystem>(new GameFXSystem());
  const isMouseDownRef = useRef<boolean>(false);
  const frameIdRef = useRef<number | null>(null);
  const idCounterRef = useRef<number>(0);
  const lastSpawnRef = useRef<number>(0);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    GameSounds.setMuted(!next);
  };

  const startGame = useCallback(() => {
    fruitsRef.current = [];
    slicedHalvesRef.current = [];
    slashTrailRef.current = [];
    fxRef.current.clear();
    setScore(0);
    setLives(3);
    setCombo(1);
    setIsGameOver(false);
    setIsPlaying(true);
    GameSounds.playStart();
  }, []);

  const spawnFruit = (width: number, height: number) => {
    const isBomb = Math.random() < 0.22;
    const itemConfig = isBomb
      ? { type: 'BOMB' as const, emoji: '💣', radius: 23 }
      : FRUIT_TYPES[Math.floor(Math.random() * FRUIT_TYPES.length)];

    const startX = width * 0.15 + Math.random() * (width * 0.7);
    const targetX = width * 0.5 + (Math.random() - 0.5) * (width * 0.4);
    const vx = (targetX - startX) * 0.022;
    const vy = -12.5 - Math.random() * 3.5;

    fruitsRef.current.push({
      id: ++idCounterRef.current,
      x: startX,
      y: height + 30,
      vx,
      vy,
      type: itemConfig.type,
      emoji: itemConfig.emoji,
      radius: itemConfig.radius,
      isSliced: false,
      angle: Math.random() * Math.PI,
      vRot: (Math.random() - 0.5) * 0.08,
    });
  };

  // Main Game Animation Loop with 60 FPS Particle FX
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.parentElement?.clientWidth || 360;
    const height = Math.min(window.innerHeight - 220, 480);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const GRAVITY = 0.28;

    const render = (time: number) => {
      // 0. Screen Shake Offset
      const shake = fxRef.current.getShakeOffset();
      ctx.save();
      ctx.translate(shake.x, shake.y);

      // 1. Draw Caribbean Night Wooden Board
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(-20, -20, width + 40, height + 40);

      // Wood plank decorative lines
      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = 2;
      for (let y = 60; y < height; y += 60) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      if (isPlaying && !isGameOver) {
        if (time - lastSpawnRef.current > 1100) {
          lastSpawnRef.current = time;
          const count = 1 + Math.floor(Math.random() * 2);
          for (let i = 0; i < count; i++) {
            spawnFruit(width, height);
          }
        }

        const fruits = fruitsRef.current;
        for (let i = fruits.length - 1; i >= 0; i--) {
          const f = fruits[i];
          f.vy += GRAVITY;
          f.x += f.vx;
          f.y += f.vy;
          f.angle += f.vRot;

          if (f.y > height + 50 && f.vy > 0) {
            if (!f.isSliced && f.type !== 'BOMB') {
              setLives((l) => {
                const nextLives = l - 1;
                if (nextLives <= 0) {
                  setIsGameOver(true);
                  setIsPlaying(false);
                  GameSounds.playLose();
                }
                return nextLives;
              });
            }
            fruits.splice(i, 1);
          }
        }

        // Update Flying Sliced Halves Physics
        const halves = slicedHalvesRef.current;
        for (let i = halves.length - 1; i >= 0; i--) {
          const h = halves[i];
          h.vy += GRAVITY * 1.1;
          h.x += h.vx;
          h.y += h.vy;
          h.angle += h.vRot;
          h.alpha -= 0.015;

          if (h.y > height + 60 || h.alpha <= 0) {
            halves.splice(i, 1);
          }
        }
      }

      // 2. Draw Flying Sliced Halves (Smooth Physical Splitting)
      slicedHalvesRef.current.forEach((h) => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, h.alpha);
        ctx.translate(h.x, h.y);
        ctx.rotate(h.angle);
        const r = h.radius;

        if (h.type === 'MANGO') {
          ctx.fillStyle = '#F59E0B';
          ctx.beginPath();
          ctx.ellipse(h.side === 'LEFT' ? -6 : 6, 0, r * 0.45, r * 0.7, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (h.type === 'COCONUT') {
          ctx.fillStyle = '#78350F';
          ctx.beginPath();
          ctx.arc(h.side === 'LEFT' ? -5 : 5, 0, r * 0.9, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(h.side === 'LEFT' ? -5 : 5, 0, r * 0.65, 0, Math.PI * 2);
          ctx.fill();
        } else if (h.type === 'WATERMELON') {
          ctx.fillStyle = '#15803D';
          ctx.beginPath();
          ctx.arc(h.side === 'LEFT' ? -5 : 5, 0, r * 0.9, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#EF4444';
          ctx.beginPath();
          ctx.arc(h.side === 'LEFT' ? -5 : 5, 0, r * 0.7, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = '#F59E0B';
          ctx.beginPath();
          ctx.ellipse(h.side === 'LEFT' ? -6 : 6, 0, r * 0.5, r * 0.75, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      // 3. Draw Unsliced 3D Vector Fruits & Bombs
      fruitsRef.current.forEach((f) => {
        if (f.isSliced) return;
        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.rotate(f.angle);

        const r = f.radius;

        if (f.type === 'MANGO') {
          const mangoGrad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 2, 0, 0, r);
          mangoGrad.addColorStop(0, '#FEF08A');
          mangoGrad.addColorStop(0.5, '#F59E0B');
          mangoGrad.addColorStop(0.85, '#EF4444');
          mangoGrad.addColorStop(1, '#84CC16');
          ctx.fillStyle = mangoGrad;
          ctx.beginPath();
          ctx.ellipse(0, 0, r, r * 0.75, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#15803D';
          ctx.beginPath();
          ctx.ellipse(-r * 0.7, -r * 0.5, r * 0.35, r * 0.15, -Math.PI / 4, 0, Math.PI * 2);
          ctx.fill();
        } else if (f.type === 'COCONUT') {
          const cocoGrad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 2, 0, 0, r);
          cocoGrad.addColorStop(0, '#A16207');
          cocoGrad.addColorStop(0.7, '#78350F');
          cocoGrad.addColorStop(1, '#451A03');
          ctx.fillStyle = cocoGrad;
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#451A03';
          ctx.beginPath();
          ctx.arc(-4, -5, 2.5, 0, Math.PI * 2);
          ctx.arc(4, -5, 2.5, 0, Math.PI * 2);
          ctx.arc(0, 2, 2.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (f.type === 'WATERMELON') {
          const melonGrad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 2, 0, 0, r);
          melonGrad.addColorStop(0, '#4ADE80');
          melonGrad.addColorStop(0.6, '#16A34A');
          melonGrad.addColorStop(1, '#14532D');
          ctx.fillStyle = melonGrad;
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.fill();
        } else if (f.type === 'PINEAPPLE') {
          const pineGrad = ctx.createLinearGradient(-r, -r, r, r);
          pineGrad.addColorStop(0, '#FEF08A');
          pineGrad.addColorStop(0.6, '#F59E0B');
          pineGrad.addColorStop(1, '#B45309');
          ctx.fillStyle = pineGrad;
          ctx.beginPath();
          ctx.ellipse(0, 4, r * 0.75, r, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#16A34A';
          ctx.beginPath();
          ctx.moveTo(-r * 0.5, -r * 0.6);
          ctx.lineTo(0, -r * 1.3);
          ctx.lineTo(r * 0.5, -r * 0.6);
          ctx.fill();
        } else if (f.type === 'BOMB') {
          const bombGrad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 2, 0, 0, r);
          bombGrad.addColorStop(0, '#64748B');
          bombGrad.addColorStop(0.5, '#1E293B');
          bombGrad.addColorStop(1, '#020617');
          ctx.fillStyle = bombGrad;
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#DC2626';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.strokeStyle = '#EA580C';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(0, -r);
          ctx.quadraticCurveTo(8, -r - 10, 14, -r - 6);
          ctx.stroke();
          ctx.fillStyle = '#FDE047';
          ctx.shadowColor = '#EF4444';
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(14, -r - 6, 4 + Math.sin(time * 0.02) * 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }

        ctx.restore();
      });

      // 4. Update and Render Particles & Floating Text FX
      fxRef.current.update();
      fxRef.current.render(ctx);

      // 5. Draw Multi-Layer Luminous Golden Blade Slash Trail
      const trail = slashTrailRef.current;
      const now = Date.now();
      slashTrailRef.current = trail.filter((pt) => now - pt.time < 180);

      if (slashTrailRef.current.length > 1) {
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
        ctx.shadowColor = '#F59E0B';
        ctx.shadowBlur = 16;
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(slashTrailRef.current[0].x, slashTrailRef.current[0].y);
        for (let i = 1; i < slashTrailRef.current.length; i++) {
          ctx.lineTo(slashTrailRef.current[i].x, slashTrailRef.current[i].y);
        }
        ctx.stroke();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2.5;
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.moveTo(slashTrailRef.current[0].x, slashTrailRef.current[0].y);
        for (let i = 1; i < slashTrailRef.current.length; i++) {
          ctx.lineTo(slashTrailRef.current[i].x, slashTrailRef.current[i].y);
        }
        ctx.stroke();
      }

      ctx.restore();

      frameIdRef.current = requestAnimationFrame(render);
    };

    frameIdRef.current = requestAnimationFrame(render);
    return () => {
      if (frameIdRef.current) cancelAnimationFrame(frameIdRef.current);
    };
  }, [isGameOver, isPlaying]);

  const checkSlice = (x: number, y: number) => {
    slashTrailRef.current.push({ x, y, time: Date.now() });

    let slicedCountThisFrame = 0;
    fruitsRef.current.forEach((f) => {
      if (!f.isSliced) {
        const dist = Math.hypot(x - f.x, y - f.y);
        if (dist < f.radius * 1.4) {
          f.isSliced = true;
          if (f.type === 'BOMB') {
            fxRef.current.spawnConfettiExplosion(f.x, f.y, 35);
            fxRef.current.spawnSparkles(f.x, f.y, 25, '#EF4444');
            fxRef.current.addScreenShake(0.85);
            GameSounds.playLose();
            setIsGameOver(true);
            setIsPlaying(false);
            setRewardAmount(Math.min(150, Math.floor(score / 5)));
            if (score >= 50) {
              setTimeout(() => setShowRewardModal(true), 500);
            }
          } else {
            GameSounds.playScratch();
            slicedCountThisFrame++;
            const pointsGain = 20 * combo;
            setScore((s) => s + pointsGain);

            const juiceColor = f.type === 'MANGO' ? '#F59E0B' : f.type === 'COCONUT' ? '#F8FAFC' : f.type === 'WATERMELON' ? '#EF4444' : '#FBBF24';
            fxRef.current.spawnJuiceSplash(f.x, f.y, 16, juiceColor);
            fxRef.current.spawnSparkles(f.x, f.y, 8, '#FEF08A');
            fxRef.current.spawnFloatText(f.x, f.y - 15, `+${pointsGain}`, '#FDE047');
            fxRef.current.addScreenShake(0.22);

            slicedHalvesRef.current.push(
              {
                x: f.x - 4,
                y: f.y,
                vx: f.vx - 3.5,
                vy: f.vy - 3,
                angle: f.angle,
                vRot: -0.15,
                type: f.type as SlicedHalf['type'],
                side: 'LEFT',
                radius: f.radius,
                alpha: 1,
              },
              {
                x: f.x + 4,
                y: f.y,
                vx: f.vx + 3.5,
                vy: f.vy - 3,
                angle: f.angle,
                vRot: 0.15,
                type: f.type as SlicedHalf['type'],
                side: 'RIGHT',
                radius: f.radius,
                alpha: 1,
              }
            );
          }
        }
      }
    });

    if (slicedCountThisFrame >= 2) {
      setCombo((c) => Math.min(5, c + 1));
      fxRef.current.spawnFloatText(x, y - 30, `${combo + 1}x COMBO! 🔥`, '#F43F5E');
      fxRef.current.addScreenShake(0.35);
      GameSounds.playCorrect();
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    isMouseDownRef.current = true;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      checkSlice(e.clientX - rect.left, e.clientY - rect.top);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isMouseDownRef.current) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      checkSlice(e.clientX - rect.left, e.clientY - rect.top);
    }
  };

  const handlePointerUp = () => {
    isMouseDownRef.current = false;
  };

  const claimReward = () => {
    if (onClaimReward && rewardAmount > 0) {
      onClaimReward(rewardAmount);
    }
    setShowRewardModal(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans select-none pb-12 animate-fade-in">
      <GameHeader
        title={t('games.fruit.title')}
        subtitle={combo > 1 ? t('games.fruit.combo', { combo }) : undefined}
        onBack={onBack}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
        onRestart={startGame}
        restartTooltip={t('games.fruit.btn_play_again')}
        onHelp={() => setShowTutorial(true)}
      />

      {/* ── MAIN STAGE ── */}
      <main className="flex-1 max-w-md mx-auto w-full px-3 py-4 flex flex-col items-center justify-between">
        {/* Score & Lives HUD */}
        <div className="w-full flex items-center justify-between gap-3 mb-2">
          <div>
            <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-400 tracking-tight">
              {t('games.fruit.title')}
            </h1>
            <div className="flex items-center gap-1 mt-0.5">
              {[1, 2, 3].map((i) => (
                <Heart key={i} className={`w-3.5 h-3.5 ${i <= lives ? 'text-red-500 fill-red-500' : 'text-slate-700'}`} />
              ))}
              {combo > 1 && (
                <span className="ml-2 text-[10px] font-black text-amber-300 bg-amber-500/20 px-1.5 py-0.2 rounded border border-amber-400/40 animate-pulse">
                  {t('games.fruit.combo', { combo })}
                </span>
              )}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 px-4 py-1.5 rounded-2xl text-center min-w-[80px]">
            <span className="text-[9px] text-slate-400 block uppercase font-bold">{t('games.fruit.score', { score: '' })}</span>
            <span className="font-mono font-black text-amber-400 text-base">{score}</span>
          </div>
        </div>

        {/* Canvas Fruit Ninja Arena */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="relative w-full aspect-[4/5] max-h-[460px] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border-2 border-amber-500/40 touch-none select-none cursor-crosshair"
        >
          <canvas ref={canvasRef} className="w-full h-full block" />

          {/* Start Screen Overlay */}
          {!isPlaying && !isGameOver && (
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center text-3xl shadow-xl animate-bounce mb-3">
                🥭
              </div>
              <h3 className="text-lg font-black text-white mb-1">{t('games.fruit.title')}</h3>
              <p className="text-xs text-amber-200 mb-4 max-w-xs">{t('games.fruit.subtitle')}</p>
              <button
                onClick={startGame}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black rounded-xl text-sm shadow-lg active:scale-95 transition"
              >
                {t('games.fruit.btn_slice_start')}
              </button>
            </div>
          )}

          {/* Game Over Overlay */}
          {isGameOver && (
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fade-in z-20">
              <div className="w-14 h-14 rounded-2xl bg-red-600/30 border border-red-500 text-red-400 flex items-center justify-center text-2xl mb-2">
                💥
              </div>
              <h3 className="text-lg font-black text-red-400 mb-1">{t('games.fruit.game_over')}</h3>
              <p className="text-xs text-slate-300 mb-4">{t('games.fruit.score', { score })}</p>
              <button
                onClick={startGame}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black rounded-xl text-sm shadow-lg active:scale-95 transition"
              >
                {t('games.fruit.btn_play_again')}
              </button>
            </div>
          )}
        </div>

        <p className="text-[11px] text-slate-400 mt-2 text-center">{t('games.fruit.subtitle')}</p>
      </main>

      {/* ── REWARD MODAL ── */}
      {showRewardModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-amber-500/50 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl relative overflow-hidden">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center text-3xl mx-auto shadow-xl animate-bounce">
              🏆
            </div>
            <div>
              <h3 className="text-lg font-black text-white">{t('games.common.congratulations')}</h3>
              <p className="text-xs text-slate-400 mt-1">{t('games.fruit.score', { score })}</p>
              <div className="text-3xl font-black text-amber-400 font-mono mt-2">
                +{rewardAmount} {t('nav.points_unit')}
              </div>
            </div>
            <button
              onClick={claimReward}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black rounded-xl text-sm shadow-lg active:scale-95 transition"
            >
              {t('games.common.btn_claim')}
            </button>
          </div>
        </div>
      )}
      {/* ── GAME TUTORIAL MODAL ── */}
      <GameTutorialModal
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
        gameTitle={t('games.fruit.title')}
        gameIcon="🍉"
        goal={t('games.fruit.tutorial.goal')}
        controls={t('games.fruit.tutorial.controls')}
        scoring={t('games.fruit.tutorial.scoring')}
        tips={t('games.fruit.tutorial.tips')}
      />
    </div>
  );
};
