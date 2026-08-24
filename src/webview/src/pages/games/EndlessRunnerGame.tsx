import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { GameSounds } from '../../utils/audio';
import { GameFXSystem } from '../../utils/game-fx';
import { GameHeader } from '../../components/common/GameHeader';
import { GameTutorialModal } from '../../components/common/GameTutorialModal';

export interface EndlessRunnerGameProps {
  onBack: () => void;
  onClaimReward?: (pointsWon: number) => void;
}

interface Obstacle {
  x: number;
  type: 'TAPTAP' | 'BARRIER' | 'CONE';
  width: number;
  height: number;
  y: number;
  passed: boolean;
}

interface Coin {
  x: number;
  y: number;
  collected: boolean;
}

export const EndlessRunnerGame: React.FC<EndlessRunnerGameProps> = ({ onBack, onClaimReward }) => {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [gameState, setGameState] = useState<'IDLE' | 'RUNNING' | 'GAMEOVER'>('IDLE');
  const [distance, setDistance] = useState<number>(0);
  const [coins, setCoins] = useState<number>(0);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(!GameSounds.isSoundMuted());
  const [showRewardModal, setShowRewardModal] = useState<boolean>(false);
  const [rewardAmount, setRewardAmount] = useState<number>(0);
  const [showTutorial, setShowTutorial] = useState<boolean>(false);

  const playerRef = useRef<{
    y: number;
    vy: number;
    state: 'RUN' | 'JUMP' | 'SLIDE';
    slideTimer: number;
  }>({ y: 0, vy: 0, state: 'RUN', slideTimer: 0 });

  const obstaclesRef = useRef<Obstacle[]>([]);
  const coinsRef = useRef<Coin[]>([]);
  const fxRef = useRef<GameFXSystem>(new GameFXSystem());
  const frameIdRef = useRef<number | null>(null);
  const distRef = useRef<number>(0);
  const coinsCountRef = useRef<number>(0);
  const lastObstacleSpawnRef = useRef<number>(0);

  const GROUND_Y = 340;
  const GRAVITY = 0.65;
  const JUMP_VELOCITY = -13;

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    GameSounds.setMuted(!next);
  };

  const startGame = useCallback(() => {
    playerRef.current = { y: GROUND_Y, vy: 0, state: 'RUN', slideTimer: 0 };
    obstaclesRef.current = [];
    coinsRef.current = [];
    fxRef.current.clear();
    distRef.current = 0;
    coinsCountRef.current = 0;
    setDistance(0);
    setCoins(0);
    setSpeedMultiplier(1);
    setGameState('RUNNING');
    GameSounds.playStart();
  }, []);

  const jump = useCallback(() => {
    const p = playerRef.current;
    if (gameState === 'RUNNING' && p.y >= GROUND_Y - 2) {
      p.vy = JUMP_VELOCITY;
      p.state = 'JUMP';
      fxRef.current.spawnSmokePuff(55 - 10, GROUND_Y, 5);
      GameSounds.playTap();
    }
  }, [gameState]);

  const slide = useCallback(() => {
    const p = playerRef.current;
    if (gameState === 'RUNNING' && p.y >= GROUND_Y - 2) {
      p.state = 'SLIDE';
      p.slideTimer = 35; // 35 frames (~0.6s)
      fxRef.current.spawnSmokePuff(55 - 10, GROUND_Y, 4);
      GameSounds.playScratch();
    }
  }, [gameState]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.parentElement?.clientWidth || 360;
    const height = Math.min(window.innerHeight - 200, 480);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    playerRef.current.y = GROUND_Y;

    const cityBuildings = [
      { x: 20, w: 60, h: 100, color: '#1E293B' },
      { x: 100, w: 45, h: 140, color: '#0F172A' },
      { x: 170, w: 70, h: 90, color: '#334155' },
      { x: 260, w: 55, h: 120, color: '#1E293B' },
      { x: 330, w: 80, h: 160, color: '#0F172A' },
    ];

    const render = (time: number) => {
      const shake = fxRef.current.getShakeOffset();
      ctx.save();
      ctx.translate(shake.x, shake.y);

      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, '#0F172A');
      skyGrad.addColorStop(0.5, '#C2410C');
      skyGrad.addColorStop(0.8, '#F59E0B');
      skyGrad.addColorStop(1, '#1E293B');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(-20, -20, width + 40, height + 40);

      const bgSpeed = gameState === 'RUNNING' ? 1.2 : 0;
      cityBuildings.forEach((b) => {
        b.x -= bgSpeed;
        if (b.x + b.w < -20) b.x = width + 30;
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x, GROUND_Y - b.h + 20, b.w, b.h);
        ctx.fillStyle = '#FEF08A';
        ctx.fillRect(b.x + 10, GROUND_Y - b.h + 30, 8, 10);
        ctx.fillRect(b.x + 30, GROUND_Y - b.h + 30, 8, 10);
      });

      ctx.fillStyle = '#0F172A';
      ctx.fillRect(0, GROUND_Y + 20, width, height - (GROUND_Y + 20));
      ctx.fillStyle = '#F59E0B';
      const dashOffset = (time * 0.25) % 40;
      for (let x = -dashOffset; x < width; x += 40) {
        ctx.fillRect(x, GROUND_Y + 45, 20, 4);
      }

      const runSpeed = 4.5 + Math.min(4, distRef.current * 0.005);

      if (gameState === 'RUNNING') {
        distRef.current += 0.2;
        setDistance(Math.floor(distRef.current));
        setSpeedMultiplier(Number((runSpeed / 4.5).toFixed(1)));

        if (Math.random() < 0.25 && playerRef.current.y >= GROUND_Y - 2) {
          fxRef.current.spawnSmokePuff(55 - 10, GROUND_Y, 1);
        }

        if (time - lastObstacleSpawnRef.current > 1400 / (runSpeed / 4.5)) {
          lastObstacleSpawnRef.current = time;
          const obsType = Math.random() < 0.4 ? 'TAPTAP' : Math.random() < 0.7 ? 'BARRIER' : 'CONE';
          if (obsType === 'TAPTAP') {
            obstaclesRef.current.push({ x: width + 20, type: 'TAPTAP', width: 55, height: 38, y: GROUND_Y - 18, passed: false });
          } else if (obsType === 'BARRIER') {
            obstaclesRef.current.push({ x: width + 20, type: 'BARRIER', width: 45, height: 30, y: GROUND_Y - 55, passed: false });
          } else {
            obstaclesRef.current.push({ x: width + 20, type: 'CONE', width: 25, height: 25, y: GROUND_Y - 5, passed: false });
          }
          const startCoinX = width + 90;
          for (let i = 0; i < 3; i++) {
            coinsRef.current.push({ x: startCoinX + i * 28, y: GROUND_Y - 30 - Math.sin((i / 2) * Math.PI) * 25, collected: false });
          }
        }

        for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
          obstaclesRef.current[i].x -= runSpeed;
          if (obstaclesRef.current[i].x < -60) obstaclesRef.current.splice(i, 1);
        }
        for (let i = coinsRef.current.length - 1; i >= 0; i--) {
          coinsRef.current[i].x -= runSpeed;
          if (coinsRef.current[i].x < -30) coinsRef.current.splice(i, 1);
        }

        const p = playerRef.current;
        if (p.state === 'JUMP') {
          p.vy += GRAVITY;
          p.y += p.vy;
          if (p.y >= GROUND_Y) {
            p.y = GROUND_Y;
            p.vy = 0;
            p.state = 'RUN';
            fxRef.current.spawnSmokePuff(55, GROUND_Y, 3);
          }
        } else if (p.state === 'SLIDE') {
          p.slideTimer -= 1;
          if (p.slideTimer <= 0) {
            p.state = 'RUN';
          }
        }

        const px = 55;
        const py = p.y;
        const pw = 20;
        const ph = p.state === 'SLIDE' ? 15 : 35;

        for (const obs of obstaclesRef.current) {
          const isColliding = px + pw > obs.x && px < obs.x + obs.width && py > obs.y && py - ph < obs.y + obs.height;
          if (isColliding) {
            setGameState('GAMEOVER');
            fxRef.current.addScreenShake(0.85);
            fxRef.current.spawnSparkles(px, py - 15, 25, '#EF4444');
            GameSounds.playTowerCrash();
            const earned = Math.min(200, Math.floor(distRef.current / 5) + coinsCountRef.current * 10);
            if (earned >= 30) {
              setRewardAmount(earned);
              setTimeout(() => setShowRewardModal(true), 600);
            }
            break;
          }
        }

        for (const c of coinsRef.current) {
          if (!c.collected) {
            const dist = Math.hypot(px - c.x, py - 18 - c.y);
            if (dist < 22) {
              c.collected = true;
              coinsCountRef.current += 1;
              setCoins(coinsCountRef.current);
              fxRef.current.spawnSparkles(c.x, c.y, 10, '#FDE047');
              fxRef.current.spawnFloatText(c.x, c.y - 12, '+1', '#FEF08A');
              GameSounds.playCoinRain();
            }
          }
        }
      }

      obstaclesRef.current.forEach((obs) => {
        if (obs.type === 'TAPTAP') {
          ctx.fillStyle = '#0284C7';
          ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
          ctx.fillStyle = '#DC2626';
          ctx.fillRect(obs.x, obs.y + 12, obs.width, 6);
          ctx.fillStyle = '#FDE047';
          ctx.fillRect(obs.x, obs.y + 18, obs.width, 4);
          ctx.fillStyle = '#BAE6FD';
          ctx.fillRect(obs.x + 6, obs.y + 3, 12, 8);
          ctx.fillRect(obs.x + 22, obs.y + 3, 12, 8);
          ctx.fillRect(obs.x + 38, obs.y + 3, 12, 8);
          ctx.fillStyle = '#0F172A';
          ctx.beginPath();
          ctx.arc(obs.x + 12, obs.y + obs.height, 6, 0, Math.PI * 2);
          ctx.arc(obs.x + obs.width - 12, obs.y + obs.height, 6, 0, Math.PI * 2);
          ctx.fill();
        } else if (obs.type === 'BARRIER') {
          ctx.fillStyle = '#F59E0B';
          ctx.fillRect(obs.x, obs.y, obs.width, 10);
          ctx.fillStyle = '#0F172A';
          ctx.fillRect(obs.x + 8, obs.y + 2, 8, 6);
          ctx.fillRect(obs.x + 24, obs.y + 2, 8, 6);
          ctx.fillStyle = '#64748B';
          ctx.fillRect(obs.x + 2, obs.y + 10, 6, 35);
          ctx.fillRect(obs.x + obs.width - 8, obs.y + 10, 6, 35);
        } else {
          ctx.fillStyle = '#EA580C';
          ctx.beginPath();
          ctx.moveTo(obs.x + obs.width / 2, obs.y);
          ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
          ctx.lineTo(obs.x, obs.y + obs.height);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(obs.x + obs.width * 0.25, obs.y + obs.height * 0.45, obs.width * 0.5, 4);
        }
      });

      coinsRef.current.forEach((coin) => {
        if (!coin.collected) {
          ctx.fillStyle = '#F59E0B';
          ctx.beginPath();
          ctx.arc(coin.x, coin.y, 8, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      const p = playerRef.current;
      ctx.save();
      ctx.translate(55, p.y);
      if (p.state === 'SLIDE') {
        ctx.fillStyle = '#DC2626';
        ctx.ellipse(4, -8, 16, 7, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = '#DC2626';
        ctx.fillRect(-6, -26, 14, 16);
        ctx.fillStyle = '#F59E0B';
        ctx.beginPath();
        ctx.arc(1, -31, 6.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      fxRef.current.update();
      fxRef.current.render(ctx);

      ctx.restore();
      frameIdRef.current = requestAnimationFrame(render);
    };

    frameIdRef.current = requestAnimationFrame(render);
    return () => {
      if (frameIdRef.current) cancelAnimationFrame(frameIdRef.current);
    };
  }, [gameState]);

  const claimReward = () => {
    if (onClaimReward && rewardAmount > 0) {
      onClaimReward(rewardAmount);
    }
    setShowRewardModal(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans select-none pb-12 animate-fade-in">
      <GameHeader
        title={t('games.runner.title')}
        subtitle={distance > 0 ? `${distance}m • ${coins} 🪙` : undefined}
        onBack={onBack}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
        onRestart={startGame}
        restartTooltip={t('games.runner.btn_start_run')}
        onHelp={() => setShowTutorial(true)}
      />

      {/* ── MAIN STAGE ── */}
      <main className="flex-1 max-w-md mx-auto w-full px-3 py-4 flex flex-col items-center justify-between">
        {/* Score & Coins Bar */}
        <div className="w-full flex items-center justify-between gap-3 mb-2">
          <div>
            <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-400 tracking-tight">
              {t('games.runner.title')}
            </h1>
            <p className="text-[11px] text-slate-400">{t('games.runner.speed', { speed: speedMultiplier })}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-2xl text-center min-w-[70px]">
              <span className="text-[9px] text-slate-400 block uppercase font-bold">{t('games.runner.distance', { meters: '' })}</span>
              <span className="font-mono font-black text-white text-sm">{distance}m</span>
            </div>
            <div className="bg-amber-950/60 border border-amber-500/40 px-3 py-1.5 rounded-2xl text-center min-w-[70px]">
              <span className="text-[9px] text-amber-300 block uppercase font-bold">{t('games.runner.coins', { coins: '' })}</span>
              <span className="font-mono font-black text-amber-400 text-sm">★ {coins}</span>
            </div>
          </div>
        </div>

        {/* Canvas Runner Arena */}
        <div className="relative w-full aspect-[4/5] max-h-[460px] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border-2 border-amber-500/40 touch-none select-none">
          <canvas ref={canvasRef} className="w-full h-full block" />

          {/* IDLE Overlay */}
          {gameState === 'IDLE' && (
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center text-3xl shadow-xl animate-bounce mb-3">
                🏃
              </div>
              <h3 className="text-lg font-black text-white mb-1">{t('games.runner.title')}</h3>
              <p className="text-xs text-amber-200 mb-4 max-w-xs">{t('games.runner.subtitle')}</p>
              <button
                onClick={startGame}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black rounded-xl text-sm shadow-lg active:scale-95 transition"
              >
                {t('games.runner.btn_start_run')}
              </button>
            </div>
          )}

          {/* Game Over Overlay */}
          {gameState === 'GAMEOVER' && (
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fade-in z-20">
              <div className="w-14 h-14 rounded-2xl bg-red-600/30 border border-red-500 text-red-400 flex items-center justify-center text-2xl mb-2">
                💥
              </div>
              <h3 className="text-lg font-black text-red-400 mb-1">{t('games.runner.game_over')}</h3>
              <p className="text-xs text-slate-300 mb-4">
                {t('games.runner.distance', { meters: distance })} • {t('games.runner.coins', { coins })}
              </p>
              <button
                onClick={startGame}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black rounded-xl text-sm shadow-lg active:scale-95 transition"
              >
                {t('games.common.btn_play_again')}
              </button>
            </div>
          )}
        </div>

        {/* Dual Control Buttons for Mobile (Jump / Slide) */}
        <div className="w-full max-w-[320px] grid grid-cols-2 gap-3 mt-3">
          <button
            onClick={jump}
            className="py-3 bg-gradient-to-r from-amber-500 to-yellow-400 active:scale-95 transition rounded-2xl text-slate-950 font-black text-sm shadow-lg flex items-center justify-center gap-1.5"
          >
            <span>▲</span>
            <span>{t('games.runner.btn_jump')}</span>
          </button>
          <button
            onClick={slide}
            className="py-3 bg-slate-800 hover:bg-slate-700 active:scale-95 transition rounded-2xl text-slate-200 border border-slate-700 font-black text-sm shadow-lg flex items-center justify-center gap-1.5"
          >
            <span>▼</span>
            <span>{t('games.runner.btn_slide')}</span>
          </button>
        </div>
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
              <p className="text-xs text-slate-400 mt-1">
                {t('games.runner.distance', { meters: distance })} • {t('games.runner.coins', { coins })}
              </p>
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
        gameTitle={t('games.runner.title')}
        gameIcon="🏃"
        goal={t('games.runner.tutorial.goal')}
        controls={t('games.runner.tutorial.controls')}
        scoring={t('games.runner.tutorial.scoring')}
        tips={t('games.runner.tutorial.tips')}
      />
    </div>
  );
};
