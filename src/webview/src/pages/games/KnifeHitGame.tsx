import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { GameSounds } from '../../utils/audio';
import { GameFXSystem } from '../../utils/game-fx';
import { GameHeader } from '../../components/common/GameHeader';
import { GameTutorialModal } from '../../components/common/GameTutorialModal';

export interface KnifeHitGameProps {
  onBack: () => void;
  onClaimReward?: (pointsWon: number) => void;
}

interface PinnedKnife {
  angle: number; // Angle relative to rotating log (+Y down = 0)
}

interface TargetItem {
  angle: number;
  icon: string;
  type?: 'RED_ENVELOPE' | 'DATA_PACK';
  points: number;
  collected: boolean;
}

interface FlyingKnife {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vrot: number;
  active: boolean;
  clashed: boolean;
}

export const KnifeHitGame: React.FC<KnifeHitGameProps> = ({ onBack, onClaimReward }) => {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [stage, setStage] = useState<number>(1);
  const [score, setScore] = useState<number>(0);
  const [knivesLeft, setKnivesLeft] = useState<number>(8);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [, setIsStageClear] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(!GameSounds.isSoundMuted());
  const [showRewardModal, setShowRewardModal] = useState<boolean>(false);
  const [rewardAmount, setRewardAmount] = useState<number>(0);
  const [showTutorial, setShowTutorial] = useState<boolean>(false);

  // Rotating target and knife state refs
  const stageRef = useRef<number>(1);
  const logAngleRef = useRef<number>(0);
  const logSpeedRef = useRef<number>(0.025);
  const pinnedKnivesRef = useRef<PinnedKnife[]>([]);
  const targetItemsRef = useRef<TargetItem[]>([]);
  const flyingKnifeRef = useRef<FlyingKnife | null>(null);
  const knivesLeftRef = useRef<number>(8);
  const isGameOverRef = useRef<boolean>(false);
  const isStageClearRef = useRef<boolean>(false);
  const fxRef = useRef<GameFXSystem>(new GameFXSystem());
  const frameIdRef = useRef<number | null>(null);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    GameSounds.setMuted(!next);
  };

  const initStage = useCallback((stageNum: number) => {
    stageRef.current = stageNum;
    setStage(stageNum);
    logAngleRef.current = 0;
    logSpeedRef.current = 0.024 + stageNum * 0.005;

    // Stage setups with initial pre-pinned knives & gifts in local log coords
    pinnedKnivesRef.current = [];
    if (stageNum > 1) {
      pinnedKnivesRef.current.push({ angle: Math.PI * 0.5 });
    }
    if (stageNum > 2) {
      pinnedKnivesRef.current.push({ angle: Math.PI * 1.3 });
    }
    if (stageNum > 3) {
      pinnedKnivesRef.current.push({ angle: Math.PI * 0.85 });
    }

    targetItemsRef.current = [
      { angle: Math.PI * 0.25, icon: '🧧', type: 'RED_ENVELOPE', points: 30, collected: false },
      { angle: Math.PI * 1.65, icon: '📶', type: 'DATA_PACK', points: 50, collected: false },
    ];

    const totalKnives = 6 + stageNum;
    knivesLeftRef.current = totalKnives;
    setKnivesLeft(totalKnives);

    flyingKnifeRef.current = null;
    fxRef.current.clear();
    isGameOverRef.current = false;
    isStageClearRef.current = false;
    setIsGameOver(false);
    setIsStageClear(false);
  }, []);

  useEffect(() => {
    initStage(1);
  }, [initStage]);

  const throwKnife = useCallback(() => {
    if (
      flyingKnifeRef.current?.active ||
      isGameOverRef.current ||
      isStageClearRef.current ||
      knivesLeftRef.current <= 0
    ) {
      return;
    }

    flyingKnifeRef.current = {
      x: 0, // centered
      y: 375,
      vx: 0,
      vy: -24,
      rot: 0,
      vrot: 0,
      active: true,
      clashed: false,
    };

    knivesLeftRef.current -= 1;
    setKnivesLeft(knivesLeftRef.current);
    GameSounds.playTap();
  }, []);

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

    const logCenterX = width / 2;
    const logCenterY = 145;
    const logRadius = 65;

    const render = (time: number) => {
      // 0. Screen Shake Offset
      const shake = fxRef.current.getShakeOffset();
      ctx.save();
      ctx.translate(shake.x, shake.y);

      // 1. Draw Background Stage
      ctx.fillStyle = '#0B1329';
      ctx.fillRect(-20, -20, width + 40, height + 40);

      // Background subtle glow behind log
      const bgGlow = ctx.createRadialGradient(logCenterX, logCenterY, 20, logCenterX, logCenterY, 150);
      bgGlow.addColorStop(0, 'rgba(245, 158, 11, 0.2)');
      bgGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = bgGlow;
      ctx.beginPath();
      ctx.arc(logCenterX, logCenterY, 150, 0, Math.PI * 2);
      ctx.fill();

      // Dynamic variable rotation speeds based on stage
      if (!isGameOverRef.current && !isStageClearRef.current) {
        const curStage = stageRef.current;
        let speedMultiplier = 1.0;

        if (curStage === 2) {
          // Subtle pulsation
          speedMultiplier = 1.0 + 0.4 * Math.sin(time * 0.003);
        } else if (curStage === 3) {
          // Reversing direction
          speedMultiplier = Math.cos(time * 0.002) * 1.3;
        } else if (curStage >= 4) {
          // Erratic sudden stops & fast spins
          speedMultiplier = Math.sin(time * 0.0035) > 0 ? 1.5 : -1.0;
        }

        logAngleRef.current += logSpeedRef.current * speedMultiplier;
      }

      // 2. Draw Rotating Wooden Target Log
      ctx.save();
      ctx.translate(logCenterX, logCenterY);
      ctx.rotate(logAngleRef.current);

      // Realistic Tree Growth Rings
      const woodGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, logRadius);
      woodGrad.addColorStop(0, '#D97706');
      woodGrad.addColorStop(0.3, '#B45309');
      woodGrad.addColorStop(0.6, '#92400E');
      woodGrad.addColorStop(0.85, '#78350F');
      woodGrad.addColorStop(1, '#451A03');
      ctx.fillStyle = woodGrad;
      ctx.beginPath();
      ctx.arc(0, 0, logRadius, 0, Math.PI * 2);
      ctx.fill();

      // Growth Rings Texture
      ctx.strokeStyle = 'rgba(69, 26, 3, 0.4)';
      ctx.lineWidth = 2;
      [0.25, 0.45, 0.65, 0.85].forEach((ratio) => {
        ctx.beginPath();
        ctx.arc(0, 0, logRadius * ratio, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Golden Filigree Edge Rim
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 5;
      ctx.stroke();
      ctx.strokeStyle = '#FEF08A';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Center Natcash 3D Gemstone VIP Emblem
      const hubGrad = ctx.createRadialGradient(-3, -3, 2, 0, 0, 24);
      hubGrad.addColorStop(0, '#FFFBEB');
      hubGrad.addColorStop(0.4, '#FDE047');
      hubGrad.addColorStop(0.8, '#D97706');
      hubGrad.addColorStop(1, '#78350F');
      ctx.fillStyle = hubGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFFBEB';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#78350F';
      ctx.font = '900 10.5px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('NATCASH', 0, 0.5);

      // Draw Pinned Items (Red Envelopes & 4G Data Packs)
      targetItemsRef.current.forEach((item) => {
        if (!item.collected) {
          ctx.save();
          ctx.rotate(item.angle);
          ctx.translate(0, logRadius - 12);

          if (item.type === 'RED_ENVELOPE') {
            // 3D Red Velvet Envelope
            ctx.fillStyle = '#DC2626';
            ctx.strokeStyle = '#FEF08A';
            ctx.lineWidth = 1.5;
            ctx.fillRect(-9, -12, 18, 24);
            ctx.strokeRect(-9, -12, 18, 24);
            ctx.fillStyle = '#FDE047';
            ctx.beginPath();
            ctx.arc(0, 0, 4, 0, Math.PI * 2);
            ctx.fill();
          } else {
            // 3D 4G Data Card
            ctx.fillStyle = '#0284C7';
            ctx.strokeStyle = '#BAE6FD';
            ctx.lineWidth = 1.5;
            ctx.fillRect(-10, -12, 20, 24);
            ctx.strokeRect(-10, -12, 20, 24);
            ctx.fillStyle = '#FEF08A';
            ctx.font = '900 8px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('4G', 0, 0);
          }
          ctx.restore();
        }
      });

      // Draw Pinned Damascus Daggers (Pointing into log at angle)
      pinnedKnivesRef.current.forEach((k) => {
        ctx.save();
        ctx.rotate(k.angle);
        ctx.translate(0, logRadius - 5);

        // Damascus Steel Blade
        const bladeGrad = ctx.createLinearGradient(-4, 0, 4, 0);
        bladeGrad.addColorStop(0, '#94A3B8');
        bladeGrad.addColorStop(0.5, '#FFFFFF');
        bladeGrad.addColorStop(1, '#64748B');
        ctx.fillStyle = bladeGrad;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(4, 25);
        ctx.lineTo(-4, 25);
        ctx.closePath();
        ctx.fill();

        // Golden Guard
        ctx.fillStyle = '#F59E0B';
        ctx.fillRect(-7, 25, 14, 5);

        // Ruby Crimson Handle
        ctx.fillStyle = '#BE123C';
        ctx.fillRect(-4, 30, 8, 20);

        // Gold Pommel
        ctx.fillStyle = '#FEF08A';
        ctx.beginPath();
        ctx.arc(0, 52, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      });

      ctx.restore(); // Restore Log Translate

      // 3. Update and Draw Flying Knife Physics & Collision Check
      const knife = flyingKnifeRef.current;
      if (knife) {
        if (knife.active) {
          knife.y += knife.vy;

          // Check Impact with Log Rim at bottom (y = logCenterY + logRadius)
          if (knife.y <= logCenterY + logRadius + 2) {
            knife.active = false;

            // Compute exact local angle on log when hit at bottom (+Y axis)
            const rawAngle = -logAngleRef.current;
            const normalizedHitAngle = ((rawAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);

            // Check Clash with already pinned knives
            const hasClashed = pinnedKnivesRef.current.some((pinned) => {
              let diff = Math.abs(normalizedHitAngle - pinned.angle);
              if (diff > Math.PI) diff = Math.PI * 2 - diff;
              return diff < 0.22; // ~12.6 degrees collision envelope
            });

            if (hasClashed) {
              // KNIFE CLASH: Knife bounces off and tumbles down with sparks!
              knife.clashed = true;
              knife.vx = (Math.random() - 0.5) * 8;
              knife.vy = 7;
              knife.vrot = 0.25;

              isGameOverRef.current = true;
              setIsGameOver(true);
              fxRef.current.spawnSparkles(logCenterX, logCenterY + logRadius, 30, '#EF4444');
              fxRef.current.addScreenShake(0.85);
              GameSounds.playTowerCrash();
            } else {
              // SUCCESSFUL STICK: Pin knife into log at exact impact point!
              flyingKnifeRef.current = null;
              pinnedKnivesRef.current.push({ angle: normalizedHitAngle });

              fxRef.current.spawnWoodSplinters(logCenterX, logCenterY + logRadius, 14);
              fxRef.current.spawnFloatText(logCenterX, logCenterY + logRadius + 30, '+20', '#FEF08A');
              fxRef.current.addScreenShake(0.25);
              GameSounds.playKick();
              setScore((s) => s + 20);

              // Check if hit gift items
              targetItemsRef.current.forEach((item) => {
                if (!item.collected) {
                  let diff = Math.abs(normalizedHitAngle - item.angle);
                  if (diff > Math.PI) diff = Math.PI * 2 - diff;
                  if (diff < 0.28) {
                    item.collected = true;
                    fxRef.current.spawnSparkles(logCenterX, logCenterY + logRadius, 24, '#FDE047');
                    fxRef.current.spawnFloatText(
                      logCenterX,
                      logCenterY + logRadius + 50,
                      `+${item.points} GIFT! 🧧`,
                      '#F43F5E'
                    );
                    fxRef.current.addScreenShake(0.35);
                    setScore((s) => s + item.points);
                    GameSounds.playCoinRain();
                  }
                }
              });

              // Check if stage cleared
              if (knivesLeftRef.current <= 0) {
                isStageClearRef.current = true;
                setIsStageClear(true);
                fxRef.current.spawnConfettiExplosion(logCenterX, logCenterY, 50);
                GameSounds.playWinFanfare();
                const bonusReward = 120 + stageRef.current * 40;
                setRewardAmount(bonusReward);
                setTimeout(() => {
                  setShowRewardModal(true);
                }, 600);
              }
            }
          }
        } else if (knife.clashed) {
          // Deflected knife falling animation
          knife.x += knife.vx;
          knife.y += knife.vy;
          knife.vy += 0.5; // gravity
          knife.rot += knife.vrot;

          if (knife.y > height + 80) {
            flyingKnifeRef.current = null;
          }
        }

        // Draw Flying / Falling Knife
        ctx.save();
        ctx.translate(logCenterX + knife.x, knife.y);
        ctx.rotate(knife.rot);

        // Damascus Steel Blade
        const bladeGrad = ctx.createLinearGradient(-4, 0, 4, 0);
        bladeGrad.addColorStop(0, '#94A3B8');
        bladeGrad.addColorStop(0.5, '#FFFFFF');
        bladeGrad.addColorStop(1, '#64748B');
        ctx.fillStyle = bladeGrad;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(4, 26);
        ctx.lineTo(-4, 26);
        ctx.closePath();
        ctx.fill();

        // Golden Guard & Bolster
        ctx.fillStyle = '#F59E0B';
        ctx.fillRect(-7, 26, 14, 5);

        // Ruby Crimson Handle
        ctx.fillStyle = '#BE123C';
        ctx.fillRect(-4, 31, 8, 20);

        // Gold Pommel
        ctx.fillStyle = '#FEF08A';
        ctx.beginPath();
        ctx.arc(0, 53, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 4. Draw Ready Knife at Bottom Launcher
      if (
        !flyingKnifeRef.current?.active &&
        !isGameOverRef.current &&
        !isStageClearRef.current &&
        knivesLeftRef.current > 0
      ) {
        ctx.save();
        ctx.translate(logCenterX, 375);
        // Ready Glow
        ctx.shadowColor = '#F59E0B';
        ctx.shadowBlur = 14;

        // Damascus Blade
        const bladeGrad = ctx.createLinearGradient(-4, 0, 4, 0);
        bladeGrad.addColorStop(0, '#94A3B8');
        bladeGrad.addColorStop(0.5, '#FFFFFF');
        bladeGrad.addColorStop(1, '#64748B');
        ctx.fillStyle = bladeGrad;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(4, 28);
        ctx.lineTo(-4, 28);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;

        // Golden Guard & Handle
        ctx.fillStyle = '#F59E0B';
        ctx.fillRect(-8, 28, 16, 5);
        ctx.fillStyle = '#BE123C';
        ctx.fillRect(-4, 33, 8, 22);
        ctx.fillStyle = '#FEF08A';
        ctx.beginPath();
        ctx.arc(0, 57, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 5. Update and Render Particles & Floating Text FX
      fxRef.current.update();
      fxRef.current.render(ctx);

      ctx.restore();

      frameIdRef.current = requestAnimationFrame(render);
    };

    frameIdRef.current = requestAnimationFrame(render);
    return () => {
      if (frameIdRef.current) cancelAnimationFrame(frameIdRef.current);
    };
  }, []);

  const nextStage = () => {
    const nextS = stage + 1;
    initStage(nextS);
    setShowRewardModal(false);
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
        title={t('games.knife.title')}
        subtitle={t('games.knife.stage', { stage })}
        onBack={onBack}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
        onRestart={() => initStage(1)}
        restartTooltip={t('games.knife.btn_throw')}
        onHelp={() => setShowTutorial(true)}
      />

      {/* ── MAIN STAGE ── */}
      <main className="flex-1 max-w-md mx-auto w-full px-3 py-3 flex flex-col items-center justify-between">
        {/* Stage & Knives Left Bar */}
        <div className="w-full flex items-center justify-between gap-3 mb-2 bg-slate-900/60 border border-slate-800/80 rounded-2xl px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-amber-400 bg-amber-500/20 px-2.5 py-0.5 rounded-lg border border-amber-400/30 font-mono">
              {t('games.knife.stage', { stage })}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="bg-slate-800/90 border border-slate-700/80 px-2.5 py-1 rounded-xl text-center min-w-[60px]">
              <span className="text-[8px] text-slate-400 block uppercase font-bold">{t('games.knife.knives_left', { left: '' })}</span>
              <span className="font-mono font-black text-amber-400 text-xs">{knivesLeft}</span>
            </div>
            <div className="bg-amber-950/60 border border-amber-500/40 px-2.5 py-1 rounded-xl text-center min-w-[60px]">
              <span className="text-[8px] text-amber-300 block uppercase font-bold">{t('games.common.points_won', { points: '' })}</span>
              <span className="font-mono font-black text-white text-xs">{score}</span>
            </div>
          </div>
        </div>

        {/* Canvas Knife Hit Arena */}
        <div
          onClick={throwKnife}
          className="relative w-full aspect-[4/5] max-h-[460px] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border-2 border-amber-500/40 touch-none select-none cursor-pointer"
        >
          <canvas ref={canvasRef} className="w-full h-full block" />

          {/* Game Over Overlay */}
          {isGameOver && (
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fade-in z-20">
              <div className="w-14 h-14 rounded-2xl bg-red-600/30 border border-red-500 text-red-400 flex items-center justify-center text-2xl mb-2">
                🗡️💥
              </div>
              <h3 className="text-lg font-black text-red-400 mb-1">{t('games.knife.hit_knife')}</h3>
              <p className="text-xs text-slate-300 mb-4">{t('games.common.points_won', { points: score })}</p>
              <button
                onClick={() => initStage(1)}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black rounded-xl text-sm shadow-lg active:scale-95 transition"
              >
                {t('games.common.btn_play_again')}
              </button>
            </div>
          )}
        </div>

        {/* Big Throw Action Button */}
        <button
          onClick={throwKnife}
          className="w-full max-w-[280px] py-3 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black rounded-2xl text-sm shadow-xl active:scale-95 transition mt-3 flex items-center justify-center gap-2"
        >
          <span>🗡️</span>
          <span>{t('games.knife.btn_throw')}</span>
        </button>
      </main>

      {/* ── STAGE CLEAR / REWARD MODAL ── */}
      {showRewardModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-amber-500/50 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl relative overflow-hidden">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center text-3xl mx-auto shadow-xl animate-bounce">
              🏆
            </div>
            <div>
              <h3 className="text-lg font-black text-white">{t('games.knife.stage_clear')}</h3>
              <p className="text-xs text-slate-400 mt-1">{t('games.knife.stage', { stage })}</p>
              <div className="text-3xl font-black text-amber-400 font-mono mt-2">
                +{rewardAmount} {t('nav.points_unit')}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={nextStage}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs border border-slate-700 active:scale-95 transition"
              >
                {t('games.knife.stage', { stage: stage + 1 })}
              </button>
              <button
                onClick={claimReward}
                className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black rounded-xl text-xs shadow-lg active:scale-95 transition"
              >
                {t('games.common.btn_claim')}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── GAME TUTORIAL MODAL ── */}
      <GameTutorialModal
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
        gameTitle={t('games.knife.title')}
        gameIcon="🗡️"
        goal={t('games.knife.tutorial.goal')}
        controls={t('games.knife.tutorial.controls')}
        scoring={t('games.knife.tutorial.scoring')}
        tips={t('games.knife.tutorial.tips')}
      />
    </div>
  );
};
