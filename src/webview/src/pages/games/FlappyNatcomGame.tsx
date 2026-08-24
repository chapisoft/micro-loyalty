import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { RotateCcw } from 'lucide-react';
import { GameSounds } from '../../utils/audio';
import { GameFXSystem } from '../../utils/game-fx';
import { GameHeader } from '../../components/common/GameHeader';
import { GameTutorialModal } from '../../components/common/GameTutorialModal';

export interface FlappyNatcomGameProps {
  onBack: () => void;
  onClaimReward?: (pointsWon: number) => void;
}

interface Tower {
  x: number;
  topHeight: number;
  bottomY: number;
  passed: boolean;
  hasCoin: boolean;
  coinCollected: boolean;
}

export const FlappyNatcomGame: React.FC<FlappyNatcomGameProps> = ({ onBack, onClaimReward }) => {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'GAMEOVER'>('IDLE');
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('flappy_best_score') || 0);
    } catch {
      return 0;
    }
  });
  const [soundEnabled, setSoundEnabled] = useState<boolean>(!GameSounds.isSoundMuted());
  const [showRewardModal, setShowRewardModal] = useState<boolean>(false);
  const [rewardAmount, setRewardAmount] = useState<number>(0);
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  const [, setIsGameOverState] = useState(false);

  // Physics and Game loop state refs
  const birdRef = useRef<{ y: number; vy: number; angle: number }>({ y: 200, vy: 0, angle: 0 });
  const towersRef = useRef<Tower[]>([]);
  const fxRef = useRef<GameFXSystem>(new GameFXSystem());
  const frameIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const scoreRef = useRef<number>(0);

  const GRAVITY = 0.35;
  const JUMP_FORCE = -6.5;
  const TOWER_GAP = 135;
  const TOWER_WIDTH = 55;
  const TOWER_SPEED = 2.2;

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    GameSounds.setMuted(!next);
  };

  const initGame = useCallback(() => {
    birdRef.current = { y: 200, vy: 0, angle: 0 };
    towersRef.current = [
      { x: 380, topHeight: 120, bottomY: 120 + TOWER_GAP, passed: false, hasCoin: true, coinCollected: false },
      { x: 580, topHeight: 180, bottomY: 180 + TOWER_GAP, passed: false, hasCoin: true, coinCollected: false },
    ];
    fxRef.current.clear();
    scoreRef.current = 0;
    setScore(0);
    setGameState('IDLE');
    setIsGameOverState(false);
  }, []);

  const jump = useCallback(() => {
    if (gameState === 'IDLE') {
      setGameState('PLAYING');
      birdRef.current.vy = JUMP_FORCE;
      GameSounds.playTap();
      const birdX = (canvasRef.current?.clientWidth || 360) * 0.28;
      fxRef.current.spawnSmokePuff(birdX - 10, birdRef.current.y + 6, 4);
    } else if (gameState === 'PLAYING') {
      birdRef.current.vy = JUMP_FORCE;
      GameSounds.playTap();
      const birdX = (canvasRef.current?.clientWidth || 360) * 0.28;
      fxRef.current.spawnSmokePuff(birdX - 10, birdRef.current.y + 6, 4);
    } else if (gameState === 'GAMEOVER') {
      initGame();
      setGameState('PLAYING');
      birdRef.current.vy = JUMP_FORCE;
      GameSounds.playStart();
    }
  }, [gameState, initGame]);

  const handleGameOver = useCallback(() => {
    setGameState('GAMEOVER');
    setIsGameOverState(true);
    fxRef.current.addScreenShake(0.7);
    const birdX = (canvasRef.current?.clientWidth || 360) * 0.28;
    fxRef.current.spawnSparkles(birdX, birdRef.current.y, 25, '#EF4444');
    GameSounds.playLose();

    const currentScore = scoreRef.current;
    if (currentScore > highScore) {
      setHighScore(currentScore);
      try {
        localStorage.setItem('flappy_best_score', String(currentScore));
      } catch {}
    }

    if (currentScore >= 5) {
      setRewardAmount(Math.min(200, currentScore * 10));
      setTimeout(() => setShowRewardModal(true), 600);
    }
  }, [highScore]);

  // Main Canvas Render & Animation Loop with 60 FPS Particle FX
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

    const clouds = [
      { x: 30, y: 50, size: 50, speed: 0.3 },
      { x: 180, y: 80, size: 65, speed: 0.45 },
      { x: 320, y: 40, size: 45, speed: 0.25 },
    ];

    const render = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      lastTimeRef.current = time;

      // 0. Screen Shake Offset
      const shake = fxRef.current.getShakeOffset();
      ctx.save();
      ctx.translate(shake.x, shake.y);

      // 1. Draw Caribbean Sky Gradient & Sun Glow
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, '#0369A1');
      skyGrad.addColorStop(0.5, '#38BDF8');
      skyGrad.addColorStop(0.85, '#FDE047');
      skyGrad.addColorStop(1, '#166534');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(-20, -20, width + 40, height + 40);

      // Sun Disk & Rays
      ctx.fillStyle = '#FEF08A';
      ctx.shadowColor = '#FBBF24';
      ctx.shadowBlur = 30;
      ctx.beginPath();
      ctx.arc(width * 0.85, 60, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Animated multi-layer clouds
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      clouds.forEach((cloud) => {
        if (gameState === 'PLAYING') {
          cloud.x -= cloud.speed;
          if (cloud.x < -100) cloud.x = width + 50;
        }
        ctx.beginPath();
        ctx.arc(cloud.x, cloud.y, cloud.size * 0.5, 0, Math.PI * 2);
        ctx.arc(cloud.x + cloud.size * 0.35, cloud.y - cloud.size * 0.2, cloud.size * 0.45, 0, Math.PI * 2);
        ctx.arc(cloud.x + cloud.size * 0.7, cloud.y, cloud.size * 0.4, 0, Math.PI * 2);
        ctx.fill();
      });

      // 3. Update & Draw Towers
      if (gameState === 'PLAYING') {
        const towers = towersRef.current;
        for (let i = 0; i < towers.length; i++) {
          const t = towers[i];
          t.x -= TOWER_SPEED;

          if (!t.passed && t.x + TOWER_WIDTH < width * 0.28) {
            t.passed = true;
            scoreRef.current += 1;
            setScore(scoreRef.current);
            fxRef.current.spawnFloatText(width * 0.28, birdRef.current.y - 20, '+1', '#FDE047');
            GameSounds.playCorrect();
          }

          if (t.hasCoin && !t.coinCollected) {
            const coinX = t.x + TOWER_WIDTH / 2;
            const coinY = t.topHeight + TOWER_GAP / 2;
            const birdX = width * 0.28;
            const birdY = birdRef.current.y;
            const dist = Math.hypot(coinX - birdX, coinY - birdY);
            if (dist < 28) {
              t.coinCollected = true;
              scoreRef.current += 1;
              setScore(scoreRef.current);
              fxRef.current.spawnSparkles(coinX, coinY, 16, '#FDE047');
              fxRef.current.spawnFloatText(coinX, coinY - 15, '+1 COIN! 🪙', '#F59E0B');
              GameSounds.playCoinRain();
            }
          }
        }

        if (towers.length > 0 && towers[towers.length - 1].x < width - 170) {
          const minHeight = 60;
          const maxHeight = height - TOWER_GAP - 90;
          const topH = Math.floor(minHeight + Math.random() * (maxHeight - minHeight));
          towers.push({
            x: width + 20,
            topHeight: topH,
            bottomY: topH + TOWER_GAP,
            passed: false,
            hasCoin: Math.random() > 0.3,
            coinCollected: false,
          });
        }
        if (towers.length > 0 && towers[0].x < -TOWER_WIDTH - 20) towers.shift();
      }

      towersRef.current.forEach((tower) => {
        const towerGrad = ctx.createLinearGradient(tower.x, 0, tower.x + TOWER_WIDTH, 0);
        towerGrad.addColorStop(0, '#1E293B');
        towerGrad.addColorStop(0.5, '#64748B');
        towerGrad.addColorStop(1, '#0F172A');
        ctx.fillStyle = towerGrad;
        ctx.fillRect(tower.x, 0, TOWER_WIDTH, tower.topHeight);
        ctx.fillRect(tower.x, tower.bottomY, TOWER_WIDTH, height - tower.bottomY);

        if (tower.hasCoin && !tower.coinCollected) {
          ctx.fillStyle = '#F59E0B';
          ctx.beginPath();
          ctx.arc(tower.x + TOWER_WIDTH / 2, tower.topHeight + TOWER_GAP / 2, 8, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // 4. Bird Physics
      const bird = birdRef.current;
      const birdX = width * 0.28;

      if (gameState === 'PLAYING') {
        bird.vy += GRAVITY;
        bird.y += bird.vy;
        bird.angle = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, bird.vy * 0.08));

        if (bird.y + 14 >= height - 25 || bird.y - 14 <= 0) handleGameOver();

        for (const t of towersRef.current) {
          if (birdX + 13 > t.x && birdX - 13 < t.x + TOWER_WIDTH) {
            if (bird.y - 13 < t.topHeight || bird.y + 13 > t.bottomY) {
              handleGameOver();
              break;
            }
          }
        }
      } else if (gameState === 'IDLE') {
        bird.y = height * 0.45 + Math.sin(time * 0.005) * 8;
      }

      // 5. Draw Bird
      ctx.save();
      ctx.translate(birdX, bird.y);
      ctx.rotate(bird.angle);

      // Bird Body (3D Radial Gradient)
      const birdGrad = ctx.createRadialGradient(-2, -2, 4, 0, 0, 18);
      birdGrad.addColorStop(0, '#FEF08A');
      birdGrad.addColorStop(0.4, '#F59E0B');
      birdGrad.addColorStop(1, '#B45309');
      ctx.fillStyle = birdGrad;
      ctx.beginPath();
      ctx.ellipse(0, 0, 19, 15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#78350F';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Natcom Red Pilot Helmet
      ctx.fillStyle = '#DC2626';
      ctx.beginPath();
      ctx.arc(3, -6, 14, Math.PI * 1.05, Math.PI * 2.15);
      ctx.fill();
      // Gold Pilot Goggles
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.ellipse(8, -8, 6, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#38BDF8';
      ctx.beginPath();
      ctx.ellipse(8, -8, 4, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Feathered Layered Wing
      const wingAngle = bird.vy < 0 ? -Math.PI / 4 : Math.PI / 8;
      ctx.save();
      ctx.translate(-4, 3);
      ctx.rotate(wingAngle);
      ctx.fillStyle = '#FEF08A';
      ctx.beginPath();
      ctx.ellipse(0, 0, 11, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#D97706';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();

      // Expressive Eye
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(9, -2, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0F172A';
      ctx.beginPath();
      ctx.arc(11, -2, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(12, -3, 1.2, 0, Math.PI * 2);
      ctx.fill();

      // Golden Beak with Shadow
      ctx.fillStyle = '#EA580C';
      ctx.beginPath();
      ctx.moveTo(15, -1);
      ctx.lineTo(26, 3);
      ctx.lineTo(15, 7);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#C2410C';
      ctx.beginPath();
      ctx.moveTo(15, 3);
      ctx.lineTo(26, 3);
      ctx.lineTo(15, 7);
      ctx.closePath();
      ctx.fill();

      ctx.restore();

      // 6. Lush 3D Grass Strip
      ctx.fillStyle = '#14532D';
      ctx.fillRect(0, height - 25, width, 25);
      ctx.fillStyle = '#22C55E';
      ctx.fillRect(0, height - 25, width, 6);
      ctx.fillStyle = '#86EFAC';
      ctx.fillRect(0, height - 25, width, 2);

      // 7. Update and Render Particles & Floating Text FX
      fxRef.current.update();
      fxRef.current.render(ctx);

      ctx.restore();

      frameIdRef.current = requestAnimationFrame(render);
    };

    frameIdRef.current = requestAnimationFrame(render);
    return () => {
      if (frameIdRef.current) cancelAnimationFrame(frameIdRef.current);
    };
  }, [gameState, handleGameOver]);

  const claimReward = () => {
    if (onClaimReward && rewardAmount > 0) {
      onClaimReward(rewardAmount);
    }
    setShowRewardModal(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col font-sans select-none pb-12 animate-fade-in">
      <GameHeader
        title={t('games.flappy.title')}
        subtitle={highScore > 0 ? t('games.flappy.best_score', { best: highScore }) : undefined}
        onBack={onBack}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
        onRestart={initGame}
        restartTooltip={t('games.common.btn_play_again')}
        onHelp={() => setShowTutorial(true)}
      />

      {/* ── GAME STAGE CONTAINER ── */}
      <main className="flex-1 max-w-lg mx-auto w-full px-3 py-4 flex flex-col items-center justify-between">
        {/* Title Header */}
        <div className="text-center space-y-1 mb-2">
          <h1 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-400 tracking-tight flex items-center justify-center gap-2">
            <span>🕊️</span> {t('games.flappy.title')}
          </h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            {t('games.flappy.subtitle')}
          </p>
        </div>

        {/* Interactive Canvas Board */}
        <div
          onClick={jump}
          onTouchStart={(e) => {
            e.preventDefault();
            jump();
          }}
          className="relative w-full aspect-[4/5] max-h-[500px] rounded-3xl overflow-hidden shadow-2xl border-2 border-amber-500/30 cursor-pointer touch-none select-none bg-sky-900"
        >
          <canvas ref={canvasRef} className="w-full h-full block" />

          {/* Live Score Overlay */}
          <div className="absolute top-4 left-0 right-0 flex justify-center pointer-events-none">
            <div className="bg-black/40 backdrop-blur-md px-4 py-1 rounded-full border border-white/20 text-2xl sm:text-3xl font-black font-mono text-white shadow-lg">
              {score}
            </div>
          </div>

          {/* IDLE Start Overlay */}
          {gameState === 'IDLE' && (
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center text-3xl shadow-xl animate-bounce mb-3">
                🕊️
              </div>
              <h3 className="text-lg font-black text-white mb-1">{t('games.flappy.btn_start')}</h3>
              <p className="text-xs text-amber-200 mb-4">{t('games.flappy.tap_to_fly')}</p>
              <button
                onClick={jump}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black rounded-xl text-sm shadow-lg hover:brightness-110 active:scale-95 transition"
              >
                {t('games.flappy.btn_start')}
              </button>
            </div>
          )}

          {/* GAME OVER Overlay */}
          {gameState === 'GAMEOVER' && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fade-in">
              <div className="w-14 h-14 rounded-2xl bg-red-600/30 border border-red-500 text-red-400 flex items-center justify-center text-2xl mb-2">
                💥
              </div>
              <h3 className="text-lg font-black text-red-400 mb-1">{t('games.flappy.game_over')}</h3>
              <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-700 w-full max-w-[200px] mb-4 space-y-1">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>{t('games.flappy.score', { score: '' })}</span>
                  <span className="font-mono font-bold text-white text-sm">{score}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>{t('games.flappy.best_score', { best: '' })}</span>
                  <span className="font-mono font-bold text-amber-400 text-sm">{highScore}</span>
                </div>
              </div>
              <button
                onClick={initGame}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black rounded-xl text-sm shadow-lg hover:brightness-110 active:scale-95 transition flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{t('games.flappy.btn_retry')}</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer Action Guide */}
        <div className="w-full text-center mt-3 text-xs text-slate-400">
          <p>{t('games.flappy.tap_to_fly')}</p>
        </div>
      </main>

      {/* ── REWARD CONGRATULATIONS MODAL ── */}
      {showRewardModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-amber-500/50 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl relative overflow-hidden">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center text-3xl mx-auto shadow-xl">
              🎁
            </div>
            <div>
              <h3 className="text-lg font-black text-white">{t('games.common.congratulations')}</h3>
              <p className="text-xs text-slate-400 mt-1">{t('games.flappy.pipes_passed', { count: score })}</p>
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
        gameTitle={t('games.flappy.title')}
        gameIcon="🕊️"
        goal={t('games.flappy.tutorial.goal')}
        controls={t('games.flappy.tutorial.controls')}
        scoring={t('games.flappy.tutorial.scoring')}
        tips={t('games.flappy.tutorial.tips')}
      />
    </div>
  );
};
