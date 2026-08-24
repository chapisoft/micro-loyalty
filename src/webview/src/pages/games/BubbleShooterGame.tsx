import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react';
import { GameSounds } from '../../utils/audio';
import { GameFXSystem } from '../../utils/game-fx';
import { GameHeader } from '../../components/common/GameHeader';
import { GameTutorialModal } from '../../components/common/GameTutorialModal';

export interface BubbleShooterGameProps {
  onBack: () => void;
  onClaimReward?: (pointsWon: number) => void;
}

const BUBBLE_COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6']; // Red, Gold, Green, Blue, Purple
const RADIUS = 16;
const COLS = 8;
const ROWS = 6;

interface Bubble {
  r: number;
  c: number;
  color: string;
  active: boolean;
}

export const BubbleShooterGame: React.FC<BubbleShooterGameProps> = ({ onBack, onClaimReward }) => {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [score, setScore] = useState<number>(0);
  const [shotsLeft, setShotsLeft] = useState<number>(20);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(!GameSounds.isSoundMuted());
  const [currentBubbleColor, setCurrentBubbleColor] = useState<string>(() => getRandomColor());
  const [nextBubbleColor, setNextBubbleColor] = useState<string>(() => getRandomColor());
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isCleared, setIsCleared] = useState<boolean>(false);
  const [showRewardModal, setShowRewardModal] = useState<boolean>(false);
  const [rewardAmount, setRewardAmount] = useState<number>(0);
  const [showTutorial, setShowTutorial] = useState<boolean>(false);

  const gridRef = useRef<Bubble[][]>([]);
  const projectileRef = useRef<{ x: number; y: number; vx: number; vy: number; color: string; active: boolean } | null>(null);
  const aimAngleRef = useRef<number>(-Math.PI / 2);
  const fxRef = useRef<GameFXSystem>(new GameFXSystem());
  const frameIdRef = useRef<number | null>(null);

  function getRandomColor(): string {
    return BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)];
  }

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    GameSounds.setMuted(!next);
  };

  const initGrid = useCallback(() => {
    const newGrid: Bubble[][] = [];
    for (let r = 0; r < ROWS; r++) {
      const row: Bubble[] = [];
      for (let c = 0; c < COLS; c++) {
        // First 3 rows active
        row.push({
          r,
          c,
          color: getRandomColor(),
          active: r < 3,
        });
      }
      newGrid.push(row);
    }
    gridRef.current = newGrid;
    projectileRef.current = null;
    fxRef.current.clear();
    setScore(0);
    setShotsLeft(20);
    setIsGameOver(false);
    setIsCleared(false);
    setCurrentBubbleColor(getRandomColor());
    setNextBubbleColor(getRandomColor());
  }, []);

  useEffect(() => {
    initGrid();
  }, [initGrid]);

  // Find connected bubbles of same color using BFS
  const findMatches = (startR: number, startC: number, targetColor: string): { r: number; c: number }[] => {
    const queue: { r: number; c: number }[] = [{ r: startR, c: startC }];
    const visited = new Set<string>();
    visited.add(`${startR},${startC}`);
    const matches: { r: number; c: number }[] = [];

    while (queue.length > 0) {
      const curr = queue.shift()!;
      matches.push(curr);

      // 4-Direction Neighbors
      const neighbors = [
        { r: curr.r - 1, c: curr.c },
        { r: curr.r + 1, c: curr.c },
        { r: curr.r, c: curr.c - 1 },
        { r: curr.r, c: curr.c + 1 },
      ];

      for (const n of neighbors) {
        if (n.r >= 0 && n.r < ROWS && n.c >= 0 && n.c < COLS) {
          const key = `${n.r},${n.c}`;
          if (!visited.has(key)) {
            const b = gridRef.current[n.r]?.[n.c];
            if (b && b.active && b.color === targetColor) {
              visited.add(key);
              queue.push(n);
            }
          }
        }
      }
    }

    return matches;
  };

  const shoot = () => {
    if (projectileRef.current?.active || isGameOver || isCleared || shotsLeft <= 0) return;

    const angle = aimAngleRef.current;
    const speed = 15;
    const width = canvasRef.current?.parentElement?.clientWidth || 360;
    const height = Math.min(window.innerHeight - 220, 480);

    const shooterX = width / 2;
    const shooterY = height - 40;

    projectileRef.current = {
      x: shooterX,
      y: shooterY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: currentBubbleColor,
      active: true,
    };

    fxRef.current.spawnSmokePuff(shooterX, shooterY, 6);
    GameSounds.playTap();
    setShotsLeft((s) => s - 1);
    setCurrentBubbleColor(nextBubbleColor);
    setNextBubbleColor(getRandomColor());
  };

  // Main Canvas Render & Animation Loop with 60 FPS Particle FX
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

    const cellW = width / COLS;
    const cellH = RADIUS * 2 + 2;

    const render = () => {
      // 0. Screen Shake Offset
      const shake = fxRef.current.getShakeOffset();
      ctx.save();
      ctx.translate(shake.x, shake.y);

      // 1. Draw Carnival Stage Background
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(-20, -20, width + 40, height + 40);

      // Ceiling Hazard Line
      ctx.fillStyle = '#DC2626';
      ctx.fillRect(0, 0, width, 4);

      // Helper function to draw 3D glossy crystal bubble
      const drawGlossyBubble = (x: number, y: number, r: number, color: string) => {
        ctx.save();
        // Inner Glass Sphere
        const grad = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, 2, x, y, r);
        grad.addColorStop(0, '#FFFFFF');
        grad.addColorStop(0.35, color);
        grad.addColorStop(0.85, color);
        grad.addColorStop(1, '#020617');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, r - 1, 0, Math.PI * 2);
        ctx.fill();

        // Top Specular Highlight Glint
        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.beginPath();
        ctx.ellipse(x - r * 0.35, y - r * 0.35, r * 0.35, r * 0.2, -Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();

        // Bottom Refractive Arc
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x, y, r - 3, Math.PI * 0.2, Math.PI * 0.8);
        ctx.stroke();
        ctx.restore();
      };

      // 2. Draw Grid Bubbles
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const bubble = gridRef.current[r]?.[c];
          if (bubble && bubble.active) {
            const bx = c * cellW + cellW / 2;
            const by = r * cellH + RADIUS + 10;
            drawGlossyBubble(bx, by, RADIUS, bubble.color);
          }
        }
      }

      // 3. Update & Draw Projectile Bubble
      const proj = projectileRef.current;
      if (proj && proj.active) {
        proj.x += proj.vx;
        proj.y += proj.vy;

        // Wall Bounce
        if (proj.x - RADIUS <= 0 || proj.x + RADIUS >= width) {
          proj.vx = -proj.vx;
          GameSounds.playTap();
        }

        // Top Wall Collision or Grid Collision
        let collided = false;
        if (proj.y - RADIUS <= 10) {
          collided = true;
        } else {
          // Check collision with existing bubbles
          for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
              const b = gridRef.current[r]?.[c];
              if (b && b.active) {
                const bx = c * cellW + cellW / 2;
                const by = r * cellH + RADIUS + 10;
                const dist = Math.hypot(proj.x - bx, proj.y - by);
                if (dist < RADIUS * 1.8) {
                  collided = true;
                  break;
                }
              }
            }
            if (collided) break;
          }
        }

        if (collided) {
          proj.active = false;
          // Snap to nearest grid row/col
          const snapR = Math.min(ROWS - 1, Math.max(0, Math.round((proj.y - RADIUS - 10) / cellH)));
          const snapC = Math.min(COLS - 1, Math.max(0, Math.round((proj.x - cellW / 2) / cellW)));

          if (gridRef.current[snapR]) {
            gridRef.current[snapR][snapC] = { r: snapR, c: snapC, color: proj.color, active: true };
            const matches = findMatches(snapR, snapC, proj.color);
            if (matches.length >= 3) {
              GameSounds.playEggCrack();
              matches.forEach((m) => {
                const bx = m.c * cellW + cellW / 2;
                const by = m.r * cellH + RADIUS + 10;
                fxRef.current.spawnCrystalShards(bx, by, 10, gridRef.current[m.r][m.c].color);
                fxRef.current.spawnSparkles(bx, by, 5, '#FEF08A');
                gridRef.current[m.r][m.c].active = false;
              });
              const gain = matches.length * 30;
              setScore((s) => s + gain);
              fxRef.current.spawnFloatText(proj.x, proj.y - 15, `+${gain} (${matches.length}x POP!) 🔥`, '#F59E0B');
              fxRef.current.addScreenShake(0.25);

              // Check if all cleared
              const anyLeft = gridRef.current.some((row) => row.some((b) => b.active));
              if (!anyLeft) {
                setIsCleared(true);
                fxRef.current.spawnConfettiExplosion(width / 2, height / 2, 45);
                setRewardAmount(200);
                setTimeout(() => {
                  setShowRewardModal(true);
                  GameSounds.playWinFanfare();
                }, 500);
              }
            }
          }

          // Check if out of shots
          if (shotsLeft <= 1) {
            setIsGameOver(true);
            GameSounds.playLose();
          }
        }

        // Draw moving bubble
        drawGlossyBubble(proj.x, proj.y, RADIUS, proj.color);
      }

      // 4. Draw Carnival Brass Cannon Pointer & Aim Laser Line
      const shooterX = width / 2;
      const shooterY = height - 40;
      const angle = aimAngleRef.current;

      // Glowing Neon Laser guide line
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.7)';
      ctx.shadowColor = '#F59E0B';
      ctx.shadowBlur = 8;
      ctx.setLineDash([6, 6]);
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(shooterX, shooterY);
      ctx.lineTo(shooterX + Math.cos(angle) * 140, shooterY + Math.sin(angle) * 140);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.shadowBlur = 0;

      // Brass Cannon Barrel
      ctx.save();
      ctx.translate(shooterX, shooterY);
      ctx.rotate(angle + Math.PI / 2);
      const barrelGrad = ctx.createLinearGradient(-10, 0, 10, 0);
      barrelGrad.addColorStop(0, '#78350F');
      barrelGrad.addColorStop(0.5, '#FDE047');
      barrelGrad.addColorStop(1, '#92400E');
      ctx.fillStyle = barrelGrad;
      ctx.fillRect(-10, -42, 20, 32);
      ctx.strokeStyle = '#FEF08A';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-10, -42, 20, 32);
      ctx.restore();

      // Cannon Base Wheel & Hub
      ctx.fillStyle = '#1E293B';
      ctx.beginPath();
      ctx.arc(shooterX, shooterY, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 3;
      ctx.stroke();

      // 5. Draw Loaded Bubble in Cannon Base
      drawGlossyBubble(shooterX, shooterY, RADIUS, currentBubbleColor);

      // Next Bubble Preview
      ctx.fillStyle = nextBubbleColor;
      ctx.beginPath();
      ctx.arc(shooterX - 48, shooterY, 10, 0, Math.PI * 2);
      ctx.fill();

      // 6. Update and Render Particles & Floating Text FX
      fxRef.current.update();
      fxRef.current.render(ctx);

      ctx.restore();

      frameIdRef.current = requestAnimationFrame(render);
    };

    frameIdRef.current = requestAnimationFrame(render);
    return () => {
      if (frameIdRef.current) cancelAnimationFrame(frameIdRef.current);
    };
  }, [currentBubbleColor, nextBubbleColor, shotsLeft]);

  // Aim handler on touch/mouse move
  const updateAim = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const shooterX = rect.width / 2;
    const shooterY = rect.height - 40;

    const angle = Math.atan2(y - shooterY, x - shooterX);
    // Restrict angle to upper half-plane (-160 deg to -20 deg)
    if (angle < -Math.PI * 0.1 && angle > -Math.PI * 0.9) {
      aimAngleRef.current = angle;
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    updateAim(e.clientX, e.clientY);
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
        title={t('games.bubble.title')}
        subtitle={t('games.bubble.shots', { count: shotsLeft })}
        onBack={onBack}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
        onRestart={initGrid}
        restartTooltip={t('games.bubble.btn_retry')}
        onHelp={() => setShowTutorial(true)}
      />

      {/* ── MAIN STAGE ── */}
      <main className="flex-1 max-w-md mx-auto w-full px-3 py-4 flex flex-col items-center justify-between">
        {/* Score & Shots Status */}
        <div className="w-full flex items-center justify-between gap-3 mb-2 bg-slate-900/60 border border-slate-800/80 rounded-2xl px-3 py-2">
          <p className="text-[11px] text-slate-400 font-medium">{t('games.bubble.subtitle')}</p>

          <div className="flex items-center gap-2 shrink-0">
            <div className="bg-slate-800/90 border border-slate-700/80 px-2.5 py-1 rounded-xl text-center min-w-[60px]">
              <span className="text-[8px] text-slate-400 block uppercase font-bold">{t('games.bubble.score', { score: '' })}</span>
              <span className="font-mono font-black text-white text-xs">{score}</span>
            </div>
            <div className="bg-amber-950/60 border border-amber-500/40 px-2.5 py-1 rounded-xl text-center min-w-[60px]">
              <span className="text-[8px] text-amber-300 block uppercase font-bold">{t('games.bubble.shots_left', { shots: '' })}</span>
              <span className="font-mono font-black text-amber-400 text-xs">{shotsLeft}</span>
            </div>
          </div>
        </div>

        {/* Canvas Game Arena */}
        <div
          onPointerMove={handlePointerMove}
          onPointerUp={shoot}
          className="relative w-full aspect-[4/5] max-h-[460px] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border-2 border-amber-500/40 touch-none select-none cursor-crosshair"
        >
          <canvas ref={canvasRef} className="w-full h-full block" />

          {/* Game Over Overlay */}
          {isGameOver && (
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fade-in z-20">
              <div className="w-14 h-14 rounded-2xl bg-red-600/30 border border-red-500 text-red-400 flex items-center justify-center text-2xl mb-2">
                💥
              </div>
              <h3 className="text-lg font-black text-red-400 mb-1">{t('games.bubble.clear_title')}</h3>
              <p className="text-xs text-slate-300 mb-4">{t('games.bubble.score', { score })}</p>
              <button
                onClick={initGrid}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black rounded-xl text-sm shadow-lg active:scale-95 transition"
              >
                {t('games.bubble.btn_retry')}
              </button>
            </div>
          )}
        </div>

        {/* Quick Shoot Action Button */}
        <button
          onClick={shoot}
          className="w-full max-w-[280px] py-3 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black rounded-2xl text-sm shadow-xl active:scale-95 transition mt-3 flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>{t('games.bubble.btn_shoot')}</span>
        </button>
      </main>

      {/* ── REWARD MODAL ── */}
      {showRewardModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-amber-500/50 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl relative overflow-hidden">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center text-3xl mx-auto shadow-xl animate-bounce">
              🏆
            </div>
            <div>
              <h3 className="text-lg font-black text-white">{t('games.bubble.clear_title')}</h3>
              <p className="text-xs text-slate-400 mt-1">{t('games.bubble.score', { score })}</p>
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
        gameTitle={t('games.bubble.title')}
        gameIcon="🫧"
        goal={t('games.bubble.tutorial.goal')}
        controls={t('games.bubble.tutorial.controls')}
        scoring={t('games.bubble.tutorial.scoring')}
        tips={t('games.bubble.tutorial.tips')}
      />
    </div>
  );
};
