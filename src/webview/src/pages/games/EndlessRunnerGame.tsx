import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Shield, Magnet, Zap } from 'lucide-react';
import { GameSounds } from '../../utils/audio';
import { GameFXSystem } from '../../utils/game-fx';
import { GameHeader } from '../../components/common/GameHeader';
import { GameTutorialModal } from '../../components/common/GameTutorialModal';

export interface EndlessRunnerGameProps {
  onBack: () => void;
  onClaimReward?: (pointsWon: number) => void;
}

type Lane = 0 | 1 | 2; // Left (0), Center (1), Right (2)
type PowerUpType = 'SHIELD' | 'MAGNET' | 'TURBO';

interface Obstacle {
  lane: Lane;
  y: number; // distance from top (horizon) to bottom (screen)
  type: 'TAPTAP' | 'BARRIER_LOW' | 'BARRIER_HIGH';
  width: number;
  height: number;
  passed: boolean;
}

interface CoinItem {
  lane: Lane;
  y: number;
  collected: boolean;
}

interface PowerUpItem {
  lane: Lane;
  y: number;
  type: PowerUpType;
  collected: boolean;
}

export const EndlessRunnerGame: React.FC<EndlessRunnerGameProps> = ({ onBack, onClaimReward }) => {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [gameState, setGameState] = useState<'IDLE' | 'RUNNING' | 'GAMEOVER'>('IDLE');
  const [distance, setDistance] = useState<number>(0);
  const [coins, setCoins] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('runner_best_distance') || 0);
    } catch {
      return 0;
    }
  });
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(!GameSounds.isSoundMuted());
  const [showRewardModal, setShowRewardModal] = useState<boolean>(false);
  const [rewardAmount, setRewardAmount] = useState<number>(0);
  const [showTutorial, setShowTutorial] = useState<boolean>(false);

  // Active Power-up States
  const [hasShield, setHasShield] = useState<boolean>(false);
  const [magnetSeconds, setMagnetSeconds] = useState<number>(0);
  const [turboSeconds, setTurboSeconds] = useState<number>(0);

  // Runner player ref
  const playerRef = useRef<{
    lane: Lane;
    x: number;
    targetX: number;
    jumpY: number;
    vy: number;
    state: 'RUN' | 'JUMP' | 'SLIDE';
    slideTimer: number;
    shield: boolean;
    runCycle: number;
  }>({
    lane: 1,
    x: 180,
    targetX: 180,
    jumpY: 0,
    vy: 0,
    state: 'RUN',
    slideTimer: 0,
    shield: false,
    runCycle: 0,
  });

  const obstaclesRef = useRef<Obstacle[]>([]);
  const coinsRef = useRef<CoinItem[]>([]);
  const powerUpsRef = useRef<PowerUpItem[]>([]);
  const fxRef = useRef<GameFXSystem>(new GameFXSystem());
  const frameIdRef = useRef<number | null>(null);
  const distRef = useRef<number>(0);
  const coinsCountRef = useRef<number>(0);
  const lastSpawnYRef = useRef<number>(0);
  const magnetTimerRef = useRef<number>(0);
  const turboTimerRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const invulnerableUntilRef = useRef<number>(0);

  const GRAVITY = 0.85;
  const JUMP_FORCE = -14.5;
  const LANE_X_POSITIONS = [75, 180, 285];

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    GameSounds.setMuted(!next);
  };

  const startGame = useCallback(() => {
    playerRef.current = {
      lane: 1,
      x: 180,
      targetX: 180,
      jumpY: 0,
      vy: 0,
      state: 'RUN',
      slideTimer: 0,
      shield: false,
      runCycle: 0,
    };
    obstaclesRef.current = [];
    coinsRef.current = [];
    powerUpsRef.current = [];
    fxRef.current.clear();
    distRef.current = 0;
    coinsCountRef.current = 0;
    lastSpawnYRef.current = 0;
    magnetTimerRef.current = 0;
    turboTimerRef.current = 0;
    invulnerableUntilRef.current = 0;
    setDistance(0);
    setCoins(0);
    setHasShield(false);
    setMagnetSeconds(0);
    setTurboSeconds(0);
    setSpeedMultiplier(1);
    setGameState('RUNNING');
    GameSounds.playStart();
  }, []);

  const moveLeft = useCallback(() => {
    if (gameState !== 'RUNNING') return;
    const p = playerRef.current;
    if (p.lane > 0) {
      p.lane = (p.lane - 1) as Lane;
      p.targetX = LANE_X_POSITIONS[p.lane];
      GameSounds.playTap();
      fxRef.current.spawnSmokePuff(p.x, 380, 3);
    }
  }, [gameState]);

  const moveRight = useCallback(() => {
    if (gameState !== 'RUNNING') return;
    const p = playerRef.current;
    if (p.lane < 2) {
      p.lane = (p.lane + 1) as Lane;
      p.targetX = LANE_X_POSITIONS[p.lane];
      GameSounds.playTap();
      fxRef.current.spawnSmokePuff(p.x, 380, 3);
    }
  }, [gameState]);

  const jump = useCallback(() => {
    if (gameState === 'IDLE') {
      startGame();
      return;
    }
    if (gameState === 'GAMEOVER') {
      startGame();
      return;
    }
    const p = playerRef.current;
    if (p.jumpY <= 0.1 && p.state !== 'JUMP') {
      p.vy = JUMP_FORCE;
      p.state = 'JUMP';
      GameSounds.playTap();
      fxRef.current.spawnSmokePuff(p.x, 380, 6);
    }
  }, [gameState, startGame]);

  const slide = useCallback(() => {
    if (gameState !== 'RUNNING') return;
    const p = playerRef.current;
    if (p.state === 'JUMP') {
      // Fast drop down
      p.vy = 16;
    }
    p.state = 'SLIDE';
    p.slideTimer = 32; // ~0.55s
    GameSounds.playScratch();
    fxRef.current.spawnSmokePuff(p.x, 380, 4);
  }, [gameState]);

  // Global Keyboard Controls (WASD / Arrows / Space)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'KeyW' || e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        jump();
      } else if (e.key === 'ArrowDown' || e.key === 'KeyS') {
        e.preventDefault();
        slide();
      } else if (e.key === 'ArrowLeft' || e.key === 'KeyA') {
        e.preventDefault();
        moveLeft();
      } else if (e.key === 'ArrowRight' || e.key === 'KeyD') {
        e.preventDefault();
        moveRight();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [jump, slide, moveLeft, moveRight]);

  // Touch Swipe Gesture Handlers on Canvas
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const elapsed = Date.now() - touchStartRef.current.time;
    touchStartRef.current = null;

    if (elapsed > 600) return;

    if (Math.abs(dy) > Math.abs(dx)) {
      if (dy < -25) {
        jump();
      } else if (dy > 25) {
        slide();
      }
    } else {
      if (dx < -25) {
        moveLeft();
      } else if (dx > 25) {
        moveRight();
      } else {
        jump();
      }
    }
  };

  // Main Canvas Render & Animation Loop (60 FPS 2.5D Caribbean Parkour)
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

    const horizonY = height * 0.28;
    const playerBaseY = height * 0.82;

    const palmTrees = [
      { x: 25, size: 45, side: 'left' },
      { x: width - 25, size: 48, side: 'right' },
    ];

    const render = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const dt = Math.min(0.1, (time - lastTimeRef.current) / 1000);
      lastTimeRef.current = time;

      // Power-up timers countdown
      if (gameState === 'RUNNING') {
        if (magnetTimerRef.current > 0) {
          magnetTimerRef.current = Math.max(0, magnetTimerRef.current - dt);
          setMagnetSeconds(Math.ceil(magnetTimerRef.current));
        }
        if (turboTimerRef.current > 0) {
          turboTimerRef.current = Math.max(0, turboTimerRef.current - dt);
          setTurboSeconds(Math.ceil(turboTimerRef.current));
        }
      }

      // Base run speed
      const isTurbo = turboTimerRef.current > 0;
      const currentSpeed = (4.8 + Math.min(5.0, distRef.current * 0.008)) * (isTurbo ? 1.5 : 1.0);

      // 0. Screen Shake Offset
      const shake = fxRef.current.getShakeOffset();
      ctx.save();
      ctx.translate(shake.x, shake.y);

      // 1. Caribbean Sunset Sky Gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
      skyGrad.addColorStop(0, '#0F172A');
      skyGrad.addColorStop(0.35, '#831843');
      skyGrad.addColorStop(0.7, '#EA580C');
      skyGrad.addColorStop(1, '#FDE047');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(-20, -20, width + 40, horizonY + 20);

      // Sun Disk with Warm Flare
      ctx.save();
      ctx.fillStyle = '#FEF08A';
      ctx.shadowColor = '#F97316';
      ctx.shadowBlur = 35;
      ctx.beginPath();
      ctx.arc(width * 0.5, horizonY - 15, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Distant Caribbean Mountain Silhouettes
      ctx.fillStyle = '#451A03';
      ctx.beginPath();
      ctx.moveTo(0, horizonY);
      ctx.lineTo(50, horizonY - 24);
      ctx.lineTo(120, horizonY - 10);
      ctx.lineTo(200, horizonY - 30);
      ctx.lineTo(290, horizonY - 12);
      ctx.lineTo(width, horizonY - 20);
      ctx.lineTo(width, horizonY);
      ctx.closePath();
      ctx.fill();

      // 2. 3D Perspective Road (Asphalt Highway)
      // Sidewalk / Grass sides
      ctx.fillStyle = '#14532D';
      ctx.fillRect(0, horizonY, width, height - horizonY);

      // Asphalt Trapezoid
      ctx.fillStyle = '#1E293B';
      ctx.beginPath();
      ctx.moveTo(width * 0.38, horizonY);
      ctx.lineTo(width * 0.62, horizonY);
      ctx.lineTo(width + 20, height);
      ctx.lineTo(-20, height);
      ctx.closePath();
      ctx.fill();

      // Road Golden Neon Borders
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(width * 0.38, horizonY);
      ctx.lineTo(-20, height);
      ctx.moveTo(width * 0.62, horizonY);
      ctx.lineTo(width + 20, height);
      ctx.stroke();

      // 3-Lane Perspective Dividers (Animated Dashes)
      const roadOffset = (time * currentSpeed * 0.25) % 60;
      ctx.strokeStyle = 'rgba(254, 240, 138, 0.6)';
      ctx.lineWidth = 2;
      ctx.setLineDash([16, 16]);
      ctx.lineDashOffset = -roadOffset;

      // Divider 1 (Left-Center)
      ctx.beginPath();
      ctx.moveTo(width * 0.46, horizonY);
      ctx.lineTo(width * 0.35, height);
      ctx.stroke();

      // Divider 2 (Center-Right)
      ctx.beginPath();
      ctx.moveTo(width * 0.54, horizonY);
      ctx.lineTo(width * 0.65, height);
      ctx.stroke();
      ctx.setLineDash([]);

      // Swaying Palm Trees along curbs
      palmTrees.forEach((tree) => {
        ctx.fillStyle = '#78350F';
        ctx.fillRect(tree.x - 3, horizonY + 20, 6, 60);
        ctx.fillStyle = '#15803D';
        ctx.beginPath();
        ctx.arc(tree.x, horizonY + 20, tree.size * 0.4, 0, Math.PI * 2);
        ctx.fill();
      });

      // 3. Spawning & Movement Logic
      if (gameState === 'RUNNING') {
        distRef.current += (isTurbo ? 0.35 : 0.2) * (currentSpeed / 4.8);
        setDistance(Math.floor(distRef.current));
        setSpeedMultiplier(Number((currentSpeed / 4.8).toFixed(1)));

        // Spawn obstacles and items along perspective distance
        if (time - lastSpawnYRef.current > Math.max(900, 1600 - distRef.current * 1.5) / (currentSpeed / 4.8)) {
          lastSpawnYRef.current = time;

          const chosenLane: Lane = Math.floor(Math.random() * 3) as Lane;
          const obsRoll = Math.random();
          const obsType = obsRoll < 0.45 ? 'TAPTAP' : obsRoll < 0.75 ? 'BARRIER_LOW' : 'BARRIER_HIGH';

          obstaclesRef.current.push({
            lane: chosenLane,
            y: 0,
            type: obsType,
            width: 46,
            height: obsType === 'TAPTAP' ? 42 : 28,
            passed: false,
          });

          // Spawn coins on other lanes
          const coinLane: Lane = ((chosenLane + 1 + Math.floor(Math.random() * 2)) % 3) as Lane;
          for (let i = 0; i < 3; i++) {
            coinsRef.current.push({
              lane: coinLane,
              y: -i * 35,
              collected: false,
            });
          }

          // Random Power-Up Spawn (15% chance)
          if (Math.random() < 0.18) {
            const puChoices: PowerUpType[] = ['SHIELD', 'MAGNET', 'TURBO'];
            const puType = puChoices[Math.floor(Math.random() * puChoices.length)];
            const puLane: Lane = ((chosenLane + 2) % 3) as Lane;
            powerUpsRef.current.push({
              lane: puLane,
              y: -50,
              type: puType,
              collected: false,
            });
          }
        }

        // Advance obstacles along Y (from horizon 0 to playerBaseY 1.0)
        for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
          const obs = obstaclesRef.current[i];
          obs.y += currentSpeed * 0.9;
          if (obs.y > height + 80) obstaclesRef.current.splice(i, 1);
        }

        // Advance coins
        for (let i = coinsRef.current.length - 1; i >= 0; i--) {
          const c = coinsRef.current[i];
          c.y += currentSpeed * 0.9;
          if (c.y > height + 80) coinsRef.current.splice(i, 1);
        }

        // Advance power-ups
        for (let i = powerUpsRef.current.length - 1; i >= 0; i--) {
          const pu = powerUpsRef.current[i];
          pu.y += currentSpeed * 0.9;
          if (pu.y > height + 80) powerUpsRef.current.splice(i, 1);
        }

        // Player physics
        const p = playerRef.current;
        p.x += (p.targetX - p.x) * 0.28; // smooth lane transition
        p.runCycle += 0.25;

        if (p.state === 'JUMP') {
          p.vy += GRAVITY;
          p.jumpY += p.vy;
          if (p.jumpY >= 0) {
            p.jumpY = 0;
            p.vy = 0;
            p.state = 'RUN';
            fxRef.current.spawnSmokePuff(p.x, playerBaseY, 4);
          }
        } else if (p.state === 'SLIDE') {
          p.slideTimer -= 1;
          if (p.slideTimer <= 0) {
            p.state = 'RUN';
          }
        }

        // Collisions check with obstacles
        const pScreenX = p.x;
        const pScreenY = playerBaseY + p.jumpY;

        for (const obs of obstaclesRef.current) {
          const obsScreenY = horizonY + obs.y;

          // Check proximity on Y and same lane
          if (obs.lane === p.lane && Math.abs(obsScreenY - playerBaseY) < 28) {
            let safe = false;
            if (obs.type === 'BARRIER_LOW' && p.state === 'JUMP' && p.jumpY < -20) {
              safe = true; // jumped over low barrier
            } else if (obs.type === 'BARRIER_HIGH' && p.state === 'SLIDE') {
              safe = true; // slid under high barrier
            }

            if (!safe && time > invulnerableUntilRef.current) {
              if (p.shield) {
                // Shield absorbs hit!
                p.shield = false;
                setHasShield(false);
                invulnerableUntilRef.current = time + 1000;
                fxRef.current.addScreenShake(0.6);
                fxRef.current.spawnSparkles(pScreenX, pScreenY - 20, 30, '#38BDF8');
                fxRef.current.spawnFloatText(pScreenX, pScreenY - 35, 'SHIELD SAVED! 🛡️', '#38BDF8');
                GameSounds.playWinFanfare();
              } else {
                // GAMEOVER
                setGameState('GAMEOVER');
                fxRef.current.addScreenShake(0.9);
                fxRef.current.spawnSparkles(pScreenX, pScreenY - 20, 35, '#EF4444');
                GameSounds.playTowerCrash();

                const earned = Math.min(
                  250,
                  Math.floor(distRef.current / 4) + coinsCountRef.current * 10
                );
                if (earned >= 25) {
                  setRewardAmount(earned);
                  setTimeout(() => setShowRewardModal(true), 600);
                }

                if (distRef.current > highScore) {
                  setHighScore(Math.floor(distRef.current));
                  try {
                    localStorage.setItem('runner_best_distance', String(Math.floor(distRef.current)));
                  } catch {}
                }
                break;
              }
            }
          }
        }

        // Coin Magnetic Attraction & Collection
        coinsRef.current.forEach((coin) => {
          if (!coin.collected && coin.y > 0) {
            let coinScreenX = LANE_X_POSITIONS[coin.lane];
            let coinScreenY = horizonY + coin.y;

            if (magnetTimerRef.current > 0) {
              const dist = Math.hypot(pScreenX - coinScreenX, playerBaseY - coinScreenY);
              if (dist < 180) {
                coinScreenX += (pScreenX - coinScreenX) * 0.18;
                coinScreenY += (playerBaseY - coinScreenY) * 0.18;
              }
            }

            const dist = Math.hypot(pScreenX - coinScreenX, pScreenY - 20 - coinScreenY);
            if (dist < 26) {
              coin.collected = true;
              const coinGain = isTurbo ? 2 : 1;
              coinsCountRef.current += coinGain;
              setCoins(coinsCountRef.current);
              fxRef.current.spawnSparkles(coinScreenX, coinScreenY, 12, '#FDE047');
              fxRef.current.spawnFloatText(
                coinScreenX,
                coinScreenY - 14,
                coinGain > 1 ? '+2 🪙' : '+1 🪙',
                '#F59E0B'
              );
              GameSounds.playCoinRain();
            }
          }
        });

        // Power-Up Collection
        powerUpsRef.current.forEach((pu) => {
          if (!pu.collected && pu.y > 0) {
            const puScreenX = LANE_X_POSITIONS[pu.lane];
            const puScreenY = horizonY + pu.y;
            const dist = Math.hypot(pScreenX - puScreenX, pScreenY - 20 - puScreenY);

            if (dist < 30) {
              pu.collected = true;
              GameSounds.playWinFanfare();

              if (pu.type === 'SHIELD') {
                playerRef.current.shield = true;
                setHasShield(true);
                fxRef.current.spawnSparkles(puScreenX, puScreenY, 25, '#38BDF8');
                fxRef.current.spawnFloatText(puScreenX, puScreenY - 25, '4G SHIELD! 🛡️', '#38BDF8');
              } else if (pu.type === 'MAGNET') {
                magnetTimerRef.current = 7;
                setMagnetSeconds(7);
                fxRef.current.spawnSparkles(puScreenX, puScreenY, 25, '#EF4444');
                fxRef.current.spawnFloatText(puScreenX, puScreenY - 25, 'MAGNET! 🧲', '#EF4444');
              } else if (pu.type === 'TURBO') {
                turboTimerRef.current = 6;
                setTurboSeconds(6);
                fxRef.current.spawnSparkles(puScreenX, puScreenY, 25, '#F59E0B');
                fxRef.current.spawnFloatText(puScreenX, puScreenY - 25, '2X TURBO! ⭐', '#F59E0B');
              }
            }
          }
        });
      }

      // 4. Draw Obstacles (Haitian Tap-Tap Buses & Road Barriers)
      obstaclesRef.current.forEach((obs) => {
        if (obs.y < 0) return;
        const scale = 0.4 + Math.min(0.65, (obs.y / (playerBaseY - horizonY)) * 0.65);
        const screenX = LANE_X_POSITIONS[obs.lane];
        const screenY = horizonY + obs.y;

        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.scale(scale, scale);

        if (obs.type === 'TAPTAP') {
          // Authentic 3D Haitian Tap-Tap Bus (Colorful Mini-bus)
          // Ground Shadow
          ctx.fillStyle = 'rgba(0,0,0,0.4)';
          ctx.beginPath();
          ctx.ellipse(0, 22, 34, 10, 0, 0, Math.PI * 2);
          ctx.fill();

          // Headlight Ground Beams
          ctx.fillStyle = 'rgba(254, 240, 138, 0.18)';
          ctx.beginPath();
          ctx.moveTo(-18, 12);
          ctx.lineTo(-30, 60);
          ctx.lineTo(-6, 60);
          ctx.closePath();
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(18, 12);
          ctx.lineTo(6, 60);
          ctx.lineTo(30, 60);
          ctx.closePath();
          ctx.fill();

          // Main Tap-Tap Chassis (Vibrant Cyan & Gold)
          const busGrad = ctx.createLinearGradient(-30, -25, 30, 25);
          busGrad.addColorStop(0, '#0284C7');
          busGrad.addColorStop(0.5, '#06B6D4');
          busGrad.addColorStop(1, '#0369A1');
          ctx.fillStyle = busGrad;
          ctx.beginPath();
          ctx.roundRect(-28, -26, 56, 44, 8);
          ctx.fill();
          ctx.strokeStyle = '#FEF08A';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Colorful Haitian Pop Art Side Stripes
          ctx.fillStyle = '#DC2626';
          ctx.fillRect(-28, -2, 56, 7);
          ctx.fillStyle = '#F59E0B';
          ctx.fillRect(-28, 5, 56, 5);

          // Front Windshield (Glass reflection)
          ctx.fillStyle = '#BAE6FD';
          ctx.beginPath();
          ctx.roundRect(-22, -22, 44, 16, 4);
          ctx.fill();
          ctx.strokeStyle = '#0284C7';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Headlights (Lit)
          ctx.fillStyle = '#FEF08A';
          ctx.shadowColor = '#FBBF24';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(-18, 10, 4.5, 0, Math.PI * 2);
          ctx.arc(18, 10, 4.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;

          // Chrome Front Grille & Natcom Slogan
          ctx.fillStyle = '#E2E8F0';
          ctx.fillRect(-12, 6, 24, 8);
          ctx.fillStyle = '#0F172A';
          ctx.font = 'bold 6px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('NATCOM', 0, 12);

          // Roof Luggage Rack with Luggage
          ctx.fillStyle = '#78350F';
          ctx.fillRect(-24, -30, 48, 4);
          ctx.fillStyle = '#EA580C';
          ctx.fillRect(-16, -37, 14, 7);
          ctx.fillStyle = '#16A34A';
          ctx.fillRect(2, -36, 16, 6);
        } else if (obs.type === 'BARRIER_LOW') {
          // Low Striped Construction Barrier (JUMP OVER)
          ctx.fillStyle = '#EA580C';
          ctx.fillRect(-26, -14, 52, 14);
          ctx.fillStyle = '#FFFFFF';
          // Diagonal stripes
          for (let x = -22; x < 24; x += 12) {
            ctx.beginPath();
            ctx.moveTo(x, -14);
            ctx.lineTo(x + 6, -14);
            ctx.lineTo(x + 2, 0);
            ctx.lineTo(x - 4, 0);
            ctx.closePath();
            ctx.fill();
          }
          // Support Legs
          ctx.fillStyle = '#64748B';
          ctx.fillRect(-22, 0, 5, 14);
          ctx.fillRect(17, 0, 5, 14);

          // Flashing Amber Warning LED
          const blink = Math.sin(time * 0.01) > 0;
          ctx.fillStyle = blink ? '#FDE047' : '#B45309';
          ctx.beginPath();
          ctx.arc(0, -18, 4, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // High Overhead Signboard Barrier (SLIDE UNDER)
          ctx.fillStyle = '#1E293B';
          ctx.fillRect(-32, -45, 64, 20);
          ctx.strokeStyle = '#F59E0B';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(-32, -45, 64, 20);

          ctx.fillStyle = '#FEF08A';
          ctx.font = 'bold 8px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('▼ SLIDE ▼', 0, -32);

          // Tall Metal Support Pillars
          ctx.fillStyle = '#94A3B8';
          ctx.fillRect(-30, -25, 4, 38);
          ctx.fillRect(26, -25, 4, 38);
        }

        ctx.restore();
      });

      // 5. Draw 3D Floating Gold Coins
      coinsRef.current.forEach((coin) => {
        if (coin.collected || coin.y < 0) return;
        const scale = 0.45 + Math.min(0.55, (coin.y / (playerBaseY - horizonY)) * 0.55);
        const screenX = LANE_X_POSITIONS[coin.lane];
        const screenY = horizonY + coin.y;

        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.scale(scale, scale);

        ctx.shadowColor = '#FBBF24';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#F59E0B';
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FEF08A';
        ctx.beginPath();
        ctx.arc(0, 0, 7.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#B45309';
        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('★', 0, 0);

        ctx.restore();
      });

      // 6. Draw 3D Floating Power-Ups
      powerUpsRef.current.forEach((pu) => {
        if (pu.collected || pu.y < 0) return;
        const scale = 0.5 + Math.min(0.5, (pu.y / (playerBaseY - horizonY)) * 0.5);
        const screenX = LANE_X_POSITIONS[pu.lane];
        const screenY = horizonY + pu.y;

        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.scale(scale, scale);

        if (pu.type === 'SHIELD') {
          ctx.shadowColor = '#38BDF8';
          ctx.shadowBlur = 15;
          ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
          ctx.beginPath();
          ctx.arc(0, 0, 15, 0, Math.PI * 2);
          ctx.fill();
          ctx.font = '15px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🛡️', 0, 0);
        } else if (pu.type === 'MAGNET') {
          ctx.shadowColor = '#EF4444';
          ctx.shadowBlur = 15;
          ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
          ctx.beginPath();
          ctx.arc(0, 0, 15, 0, Math.PI * 2);
          ctx.fill();
          ctx.font = '15px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🧲', 0, 0);
        } else if (pu.type === 'TURBO') {
          ctx.shadowColor = '#F59E0B';
          ctx.shadowBlur = 15;
          ctx.fillStyle = 'rgba(245, 158, 11, 0.4)';
          ctx.beginPath();
          ctx.arc(0, 0, 15, 0, Math.PI * 2);
          ctx.fill();
          ctx.font = '15px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('⭐', 0, 0);
        }

        ctx.restore();
      });

      // 7. Draw 3D Articulated Parkour Runner Character
      const p = playerRef.current;
      const pScreenX = p.x;
      const pScreenY = playerBaseY + p.jumpY;

      ctx.save();
      ctx.translate(pScreenX, pScreenY);

      // Ground Shadow
      const shadowScale = Math.max(0.3, 1 - Math.abs(p.jumpY) / 120);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(0, 8, 18 * shadowScale, 6 * shadowScale, 0, 0, Math.PI * 2);
      ctx.fill();

      // Active 4G Shield Bubble
      if (p.shield) {
        ctx.save();
        ctx.shadowColor = '#38BDF8';
        ctx.shadowBlur = 20;
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 2.5;
        ctx.fillStyle = 'rgba(56, 189, 248, 0.22)';
        ctx.beginPath();
        ctx.arc(0, -22, 28 + Math.sin(time * 0.01) * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      // Magnet Aura
      if (magnetTimerRef.current > 0) {
        ctx.save();
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.arc(0, -22, 32, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Turbo Speed Trail
      if (turboTimerRef.current > 0) {
        ctx.fillStyle = 'rgba(245, 158, 11, 0.3)';
        ctx.beginPath();
        ctx.moveTo(-10, -5);
        ctx.lineTo(-25, 5);
        ctx.lineTo(-10, 10);
        ctx.closePath();
        ctx.fill();
      }

      if (p.state === 'SLIDE') {
        // Sliding Pose (Low Profile)
        ctx.fillStyle = '#DC2626';
        ctx.beginPath();
        ctx.ellipse(0, -10, 18, 9, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#F59E0B';
        ctx.beginPath();
        ctx.arc(14, -13, 7, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Upright Running & Jumping Animation Pose
        const legAngle = p.state === 'JUMP' ? Math.PI / 4 : Math.sin(p.runCycle) * 0.55;

        // Back Leg
        ctx.strokeStyle = '#1E293B';
        ctx.lineWidth = 4.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-2, -12);
        ctx.lineTo(-2 - Math.sin(legAngle) * 14, 2);
        ctx.stroke();

        // Front Leg
        ctx.strokeStyle = '#0F172A';
        ctx.beginPath();
        ctx.moveTo(2, -12);
        ctx.lineTo(2 + Math.sin(legAngle) * 14, 2);
        ctx.stroke();

        // Runner Torso (Natcom Athletic Red & Gold Jersey)
        const torsoGrad = ctx.createLinearGradient(-8, -32, 8, -10);
        torsoGrad.addColorStop(0, '#DC2626');
        torsoGrad.addColorStop(1, '#991B1B');
        ctx.fillStyle = torsoGrad;
        ctx.beginPath();
        ctx.roundRect(-8, -32, 16, 20, 4);
        ctx.fill();

        // Gold Natcom Logo Stripe
        ctx.fillStyle = '#F59E0B';
        ctx.fillRect(-8, -24, 16, 3.5);

        // Swinging Arms
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(-6, -28);
        ctx.lineTo(-6 + Math.sin(legAngle) * 10, -18);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(6, -28);
        ctx.lineTo(6 - Math.sin(legAngle) * 10, -18);
        ctx.stroke();

        // Runner Head & Hair
        ctx.fillStyle = '#78350F';
        ctx.beginPath();
        ctx.arc(0, -38, 7.5, 0, Math.PI * 2);
        ctx.fill();

        // Natcom Gold Headband with Flying Ribbons
        ctx.fillStyle = '#F59E0B';
        ctx.fillRect(-7.5, -42, 15, 3.5);
        ctx.beginPath();
        ctx.moveTo(-7.5, -40);
        ctx.lineTo(-15, -43);
        ctx.lineTo(-13, -38);
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();

      // 8. Update and Render Particles & Floating Text FX
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
        subtitle={highScore > 0 ? t('games.runner.high_score', { best: highScore }) : undefined}
        onBack={onBack}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
        onRestart={startGame}
        restartTooltip={t('games.runner.btn_start_run')}
        onHelp={() => setShowTutorial(true)}
      />

      {/* ── MAIN STAGE ── */}
      <main className="flex-1 max-w-md mx-auto w-full px-3 py-2 flex flex-col items-center justify-between">
        {/* HUD Info Status Bar */}
        <div className="w-full flex items-center justify-between gap-2 mb-2 bg-slate-900/60 border border-slate-800/80 rounded-2xl px-3 py-1.5">
          <div className="flex items-center gap-1.5 overflow-hidden">
            <span className="text-[11px] text-slate-400 font-medium">
              {t('games.runner.speed', { speed: speedMultiplier })}
            </span>
            {hasShield && (
              <span className="flex items-center gap-1 bg-sky-500/20 text-sky-400 border border-sky-500/40 text-[9px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                <Shield className="w-3 h-3" />
              </span>
            )}
            {magnetSeconds > 0 && (
              <span className="flex items-center gap-1 bg-red-500/20 text-red-400 border border-red-500/40 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                <Magnet className="w-3 h-3" />
                {magnetSeconds}s
              </span>
            )}
            {turboSeconds > 0 && (
              <span className="flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-bold px-1.5 py-0.5 rounded-full animate-bounce">
                <Zap className="w-3 h-3" />
                {turboSeconds}s
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="bg-slate-800/90 border border-slate-700/80 px-2.5 py-0.5 rounded-xl text-center min-w-[55px]">
              <span className="text-[7px] text-slate-400 block uppercase font-bold">{t('games.runner.distance', { meters: '' })}</span>
              <span className="font-mono font-black text-white text-xs">{distance}m</span>
            </div>
            <div className="bg-amber-950/60 border border-amber-500/40 px-2.5 py-0.5 rounded-xl text-center min-w-[55px]">
              <span className="text-[7px] text-amber-300 block uppercase font-bold">{t('games.runner.coins', { coins: '' })}</span>
              <span className="font-mono font-black text-amber-400 text-xs">★ {coins}</span>
            </div>
          </div>
        </div>

        {/* Interactive 3D Canvas Runner Arena with Touch Gestures */}
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onClick={() => {
            if (gameState !== 'RUNNING') startGame();
          }}
          className="relative w-full aspect-[4/5] max-h-[460px] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border-2 border-amber-500/40 touch-none select-none cursor-pointer"
        >
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
              <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-700 w-full max-w-[200px] mb-4 space-y-1">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>{t('games.runner.distance', { meters: '' })}</span>
                  <span className="font-mono font-bold text-white text-sm">{distance}m</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>{t('games.runner.coins', { coins: '' })}</span>
                  <span className="font-mono font-bold text-amber-400 text-sm">★ {coins}</span>
                </div>
              </div>
              <button
                onClick={startGame}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black rounded-xl text-sm shadow-lg active:scale-95 transition"
              >
                {t('games.common.btn_play_again')}
              </button>
            </div>
          )}
        </div>

        {/* 4-Way Mobile Tactile Controls (Left, Right, Jump, Slide) */}
        <div className="w-full max-w-[340px] grid grid-cols-4 gap-2 mt-2.5">
          <button
            onClick={moveLeft}
            className="py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-90 active:bg-amber-500 active:text-slate-950 transition rounded-2xl text-slate-200 border border-slate-700 font-black text-xs shadow-lg flex flex-col items-center justify-center gap-0.5"
          >
            <ArrowLeft className="w-4 h-4 text-amber-400" />
            <span className="text-[10px]">{t('games.runner.btn_left')}</span>
          </button>
          <button
            onClick={jump}
            className="py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 active:scale-90 transition rounded-2xl text-slate-950 font-black text-xs shadow-lg flex flex-col items-center justify-center gap-0.5"
          >
            <ArrowUp className="w-4 h-4 text-slate-950" />
            <span className="text-[10px]">{t('games.runner.btn_jump')}</span>
          </button>
          <button
            onClick={slide}
            className="py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-90 active:bg-amber-500 active:text-slate-950 transition rounded-2xl text-slate-200 border border-slate-700 font-black text-xs shadow-lg flex flex-col items-center justify-center gap-0.5"
          >
            <ArrowDown className="w-4 h-4 text-amber-400" />
            <span className="text-[10px]">{t('games.runner.btn_slide')}</span>
          </button>
          <button
            onClick={moveRight}
            className="py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-90 active:bg-amber-500 active:text-slate-950 transition rounded-2xl text-slate-200 border border-slate-700 font-black text-xs shadow-lg flex flex-col items-center justify-center gap-0.5"
          >
            <ArrowRight className="w-4 h-4 text-amber-400" />
            <span className="text-[10px]">{t('games.runner.btn_right')}</span>
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
