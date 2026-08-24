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

  const getLaneX = (lane: Lane, width: number) => {
    const centerX = width * 0.5;
    const spread = width * 0.28;
    return centerX + (lane - 1) * spread;
  };

  const getLanePerspectiveX = (lane: Lane, yProgress: number, width: number) => {
    const centerX = width * 0.5;
    const clampedProgress = Math.max(0, Math.min(1.2, yProgress));
    // True non-linear perspective convergence towards vanishing point
    const curve = Math.pow(clampedProgress, 1.25);
    const spread = 16 + curve * (width * 0.28 - 16);
    return centerX + (lane - 1) * spread;
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    GameSounds.setMuted(!next);
  };

  const startGame = useCallback(() => {
    const width = canvasRef.current?.parentElement?.clientWidth || 360;
    const centerLaneX = getLaneX(1, width);
    playerRef.current = {
      lane: 1,
      x: centerLaneX,
      targetX: centerLaneX,
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

  // Initialize player position on mount
  useEffect(() => {
    const width = canvasRef.current?.parentElement?.clientWidth || 360;
    const centerLaneX = getLaneX(1, width);
    playerRef.current.x = centerLaneX;
    playerRef.current.targetX = centerLaneX;
  }, []);

  const moveLeft = useCallback(() => {
    if (gameState !== 'RUNNING') return;
    const p = playerRef.current;
    if (p.lane > 0) {
      p.lane = (p.lane - 1) as Lane;
      const width = canvasRef.current?.parentElement?.clientWidth || 360;
      p.targetX = getLaneX(p.lane, width);
      GameSounds.playTap();
      const playerBaseY = Math.min(window.innerHeight - 200, 480) * 0.82;
      fxRef.current.spawnSmokePuff(p.x, playerBaseY, 4);
    }
  }, [gameState]);

  const moveRight = useCallback(() => {
    if (gameState !== 'RUNNING') return;
    const p = playerRef.current;
    if (p.lane < 2) {
      p.lane = (p.lane + 1) as Lane;
      const width = canvasRef.current?.parentElement?.clientWidth || 360;
      p.targetX = getLaneX(p.lane, width);
      GameSounds.playTap();
      const playerBaseY = Math.min(window.innerHeight - 200, 480) * 0.82;
      fxRef.current.spawnSmokePuff(p.x, playerBaseY, 4);
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
      const playerBaseY = Math.min(window.innerHeight - 200, 480) * 0.82;
      fxRef.current.spawnSmokePuff(p.x, playerBaseY, 6);
    }
  }, [gameState, startGame]);

  const slide = useCallback(() => {
    if (gameState !== 'RUNNING') return;
    const p = playerRef.current;
    if (p.state === 'JUMP') {
      p.vy = 16;
    }
    p.state = 'SLIDE';
    p.slideTimer = 34; // ~0.58s
    GameSounds.playScratch();
    const playerBaseY = Math.min(window.innerHeight - 200, 480) * 0.82;
    fxRef.current.spawnSmokePuff(p.x, playerBaseY, 5);
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

  // Main Canvas Render & Animation Loop (60 FPS 2.5D High-Octane Caribbean Parkour)
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

      // Base run speed & Turbo
      const isTurbo = turboTimerRef.current > 0;
      const currentSpeed = (4.8 + Math.min(5.5, distRef.current * 0.009)) * (isTurbo ? 1.55 : 1.0);

      // 0. Screen Shake Offset
      const shake = fxRef.current.getShakeOffset();
      ctx.save();
      ctx.translate(shake.x, shake.y);

      // 1. Caribbean Sunset Sky Gradient with Atmospheric Haze
      const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
      skyGrad.addColorStop(0, '#0F172A');
      skyGrad.addColorStop(0.3, '#581C87');
      skyGrad.addColorStop(0.65, '#BE185D');
      skyGrad.addColorStop(0.85, '#F97316');
      skyGrad.addColorStop(1, '#FDE047');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(-20, -20, width + 40, horizonY + 20);

      // Warm Sun Disk with Multi-layer Flares
      ctx.save();
      ctx.fillStyle = '#FEF08A';
      ctx.shadowColor = '#F97316';
      ctx.shadowBlur = 35;
      ctx.beginPath();
      ctx.arc(width * 0.5, horizonY - 14, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Distant Caribbean Mountains Silhouette
      ctx.fillStyle = '#451A03';
      ctx.beginPath();
      ctx.moveTo(0, horizonY);
      ctx.lineTo(40, horizonY - 22);
      ctx.lineTo(100, horizonY - 8);
      ctx.lineTo(170, horizonY - 28);
      ctx.lineTo(240, horizonY - 12);
      ctx.lineTo(310, horizonY - 26);
      ctx.lineTo(width, horizonY - 14);
      ctx.lineTo(width, horizonY);
      ctx.closePath();
      ctx.fill();

      // Port-au-Prince Distant Skyline & 4G Telecom Towers on Horizon
      ctx.fillStyle = '#1E1B4B';
      for (let bx = 15; bx < width - 15; bx += 32) {
        const bH = 12 + Math.sin(bx * 0.1) * 8;
        ctx.fillRect(bx, horizonY - bH, 20, bH);
        // Neon windows
        ctx.fillStyle = '#FDE047';
        ctx.fillRect(bx + 4, horizonY - bH + 3, 3, 3);
        ctx.fillRect(bx + 12, horizonY - bH + 3, 3, 3);
        ctx.fillStyle = '#1E1B4B';
      }

      // 2. 3D Perspective Highway Road
      // Lush Caribbean Grass Curbs
      ctx.fillStyle = '#14532D';
      ctx.fillRect(0, horizonY, width, height - horizonY);

      // 3D Asphalt Trapezoid
      const asphaltGrad = ctx.createLinearGradient(0, horizonY, 0, height);
      asphaltGrad.addColorStop(0, '#334155');
      asphaltGrad.addColorStop(0.3, '#1E293B');
      asphaltGrad.addColorStop(1, '#0F172A');
      ctx.fillStyle = asphaltGrad;

      ctx.beginPath();
      ctx.moveTo(width * 0.5 - 38, horizonY);
      ctx.lineTo(width * 0.5 + 38, horizonY);
      ctx.lineTo(width * 0.5 + width * 0.46, height);
      ctx.lineTo(width * 0.5 - width * 0.46, height);
      ctx.closePath();
      ctx.fill();

      // 3D Red-and-White Beveled Roadside Curbs
      const curbCount = 14;
      const curbOffset = (time * currentSpeed * 0.04) % 1;
      for (let c = 0; c < curbCount; c++) {
        const p1 = (c + curbOffset) / curbCount;
        const p2 = (c + 1 + curbOffset) / curbCount;
        if (p1 > 1.1) continue;

        const y1 = horizonY + Math.pow(p1, 1.4) * (height - horizonY);
        const y2 = horizonY + Math.pow(p2, 1.4) * (height - horizonY);

        const leftX1 = width * 0.5 - (38 + Math.pow(p1, 1.25) * (width * 0.46 - 38));
        const leftX2 = width * 0.5 - (38 + Math.pow(p2, 1.25) * (width * 0.46 - 38));
        const rightX1 = width * 0.5 + (38 + Math.pow(p1, 1.25) * (width * 0.46 - 38));
        const rightX2 = width * 0.5 + (38 + Math.pow(p2, 1.25) * (width * 0.46 - 38));

        ctx.fillStyle = c % 2 === 0 ? '#DC2626' : '#F8FAFC';
        // Left Curb segment
        ctx.beginPath();
        ctx.moveTo(leftX1, y1);
        ctx.lineTo(leftX1 - 8 * p1, y1);
        ctx.lineTo(leftX2 - 8 * p2, y2);
        ctx.lineTo(leftX2, y2);
        ctx.closePath();
        ctx.fill();

        // Right Curb segment
        ctx.beginPath();
        ctx.moveTo(rightX1, y1);
        ctx.lineTo(rightX1 + 8 * p1, y1);
        ctx.lineTo(rightX2 + 8 * p2, y2);
        ctx.lineTo(rightX2, y2);
        ctx.closePath();
        ctx.fill();
      }

      // Animated 3-Lane Perspective Dividers (Rushing Dashes)
      const dashCount = 12;
      const dashOffset = (time * currentSpeed * 0.05) % 1;
      ctx.lineWidth = 2.5;

      for (let d = 0; d < dashCount; d++) {
        const p1 = (d + dashOffset) / dashCount;
        const p2 = (d + 0.55 + dashOffset) / dashCount;
        if (p1 >= 1.0) continue;

        const y1 = horizonY + Math.pow(p1, 1.4) * (height - horizonY);
        const y2 = horizonY + Math.pow(p2, 1.4) * (height - horizonY);

        const dividerSpread1 = 12 + Math.pow(p1, 1.25) * (width * 0.145 - 12);
        const dividerSpread2 = 12 + Math.pow(p2, 1.25) * (width * 0.145 - 12);

        ctx.strokeStyle = `rgba(254, 240, 138, ${Math.min(1, p1 * 1.5)})`;

        // Left-Center Divider
        ctx.beginPath();
        ctx.moveTo(width * 0.5 - dividerSpread1, y1);
        ctx.lineTo(width * 0.5 - dividerSpread2, y2);
        ctx.stroke();

        // Center-Right Divider
        ctx.beginPath();
        ctx.moveTo(width * 0.5 + dividerSpread1, y1);
        ctx.lineTo(width * 0.5 + dividerSpread2, y2);
        ctx.stroke();
      }

      // Parallax Swaying Palm Trees along curbs
      const treeParallax = (time * currentSpeed * 0.02) % 120;
      for (let tIdx = 0; tIdx < 4; tIdx++) {
        const tProgress = (tIdx * 30 + treeParallax) / 120;
        const tScale = 0.3 + Math.pow(tProgress, 1.3) * 0.9;
        const tY = horizonY + Math.pow(tProgress, 1.4) * (height - horizonY);
        const tLeftX = width * 0.5 - (50 + Math.pow(tProgress, 1.25) * (width * 0.49 - 50));
        const tRightX = width * 0.5 + (50 + Math.pow(tProgress, 1.25) * (width * 0.49 - 50));

        if (tY > horizonY + 10 && tY < height + 40) {
          // Left Tree
          ctx.save();
          ctx.translate(tLeftX, tY);
          ctx.scale(tScale, tScale);
          ctx.fillStyle = '#78350F';
          ctx.fillRect(-3, -40, 6, 40);
          ctx.fillStyle = '#15803D';
          ctx.beginPath();
          ctx.arc(0, -42, 18, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          // Right Tree
          ctx.save();
          ctx.translate(tRightX, tY);
          ctx.scale(tScale, tScale);
          ctx.fillStyle = '#78350F';
          ctx.fillRect(-3, -40, 6, 40);
          ctx.fillStyle = '#16A34A';
          ctx.beginPath();
          ctx.arc(0, -42, 18, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // 3. Spawning & Movement Logic
      if (gameState === 'RUNNING') {
        distRef.current += (isTurbo ? 0.38 : 0.22) * (currentSpeed / 4.8);
        setDistance(Math.floor(distRef.current));
        setSpeedMultiplier(Number((currentSpeed / 4.8).toFixed(1)));

        // Spawn obstacles and items along perspective distance
        if (time - lastSpawnYRef.current > Math.max(850, 1500 - distRef.current * 1.5) / (currentSpeed / 4.8)) {
          lastSpawnYRef.current = time;

          const chosenLane: Lane = Math.floor(Math.random() * 3) as Lane;
          const obsRoll = Math.random();
          const obsType = obsRoll < 0.45 ? 'TAPTAP' : obsRoll < 0.75 ? 'BARRIER_LOW' : 'BARRIER_HIGH';

          obstaclesRef.current.push({
            lane: chosenLane,
            y: 0,
            type: obsType,
            width: 52,
            height: obsType === 'TAPTAP' ? 46 : 28,
            passed: false,
          });

          // Spawn coins on other lanes
          const coinLane: Lane = ((chosenLane + 1 + Math.floor(Math.random() * 2)) % 3) as Lane;
          for (let i = 0; i < 3; i++) {
            coinsRef.current.push({
              lane: coinLane,
              y: -i * 38,
              collected: false,
            });
          }

          // Random Power-Up Spawn (18% chance)
          if (Math.random() < 0.2) {
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

        // Advance obstacles along Y
        for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
          const obs = obstaclesRef.current[i];
          obs.y += currentSpeed * 0.95;
          if (obs.y > height + 90) obstaclesRef.current.splice(i, 1);
        }

        // Advance coins
        for (let i = coinsRef.current.length - 1; i >= 0; i--) {
          const c = coinsRef.current[i];
          c.y += currentSpeed * 0.95;
          if (c.y > height + 90) coinsRef.current.splice(i, 1);
        }

        // Advance power-ups
        for (let i = powerUpsRef.current.length - 1; i >= 0; i--) {
          const pu = powerUpsRef.current[i];
          pu.y += currentSpeed * 0.95;
          if (pu.y > height + 90) powerUpsRef.current.splice(i, 1);
        }

        // Player physics & Smooth Lane Interpolation
        const p = playerRef.current;
        p.x += (p.targetX - p.x) * 0.28;
        p.runCycle += 0.26;

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

          if (obs.lane === p.lane && Math.abs(obsScreenY - playerBaseY) < 30) {
            let safe = false;
            if (obs.type === 'BARRIER_LOW' && p.state === 'JUMP' && p.jumpY < -22) {
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
            const coinYProgress = coin.y / (playerBaseY - horizonY);
            let coinScreenX = getLanePerspectiveX(coin.lane, coinYProgress, width);
            let coinScreenY = horizonY + coin.y;

            if (magnetTimerRef.current > 0) {
              const dist = Math.hypot(pScreenX - coinScreenX, playerBaseY - coinScreenY);
              if (dist < 190) {
                coinScreenX += (pScreenX - coinScreenX) * 0.22;
                coinScreenY += (playerBaseY - coinScreenY) * 0.22;
              }
            }

            const dist = Math.hypot(pScreenX - coinScreenX, pScreenY - 20 - coinScreenY);
            if (dist < 28) {
              coin.collected = true;
              const coinGain = isTurbo ? 2 : 1;
              coinsCountRef.current += coinGain;
              setCoins(coinsCountRef.current);
              fxRef.current.spawnSparkles(coinScreenX, coinScreenY, 14, '#FDE047');
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
            const puYProgress = pu.y / (playerBaseY - horizonY);
            const puScreenX = getLanePerspectiveX(pu.lane, puYProgress, width);
            const puScreenY = horizonY + pu.y;
            const dist = Math.hypot(pScreenX - puScreenX, pScreenY - 20 - puScreenY);

            if (dist < 32) {
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

      // 4. Draw Obstacles (3D Haitian Tap-Tap Buses & Neon Road Barriers)
      obstaclesRef.current.forEach((obs) => {
        if (obs.y < 0) return;
        const yProgress = obs.y / (playerBaseY - horizonY);
        const scale = 0.35 + Math.pow(Math.min(1.2, yProgress), 1.25) * 0.72;
        const screenX = getLanePerspectiveX(obs.lane, yProgress, width);
        const screenY = horizonY + obs.y;

        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.scale(scale, scale);

        if (obs.type === 'TAPTAP') {
          // ── 3D AUTHENTIC HAITIAN TAP-TAP BUS (POP-ART MASTERPIECE) ──
          const bounceY = Math.sin(time * 0.018 + obs.lane * 3) * 1.5;
          ctx.translate(0, bounceY);

          // 1. Soft Ambient Ground Shadow under tires
          ctx.save();
          ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
          ctx.beginPath();
          ctx.ellipse(0, 24, 38, 12, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          // 2. Volumetric Headlight Beams illuminating road
          ctx.save();
          const beamGrad = ctx.createLinearGradient(0, 10, 0, 75);
          beamGrad.addColorStop(0, 'rgba(254, 240, 138, 0.45)');
          beamGrad.addColorStop(1, 'rgba(254, 240, 138, 0.0)');
          ctx.fillStyle = beamGrad;

          ctx.beginPath();
          ctx.moveTo(-18, 10);
          ctx.lineTo(-38, 75);
          ctx.lineTo(-6, 75);
          ctx.closePath();
          ctx.fill();

          ctx.beginPath();
          ctx.moveTo(18, 10);
          ctx.lineTo(6, 75);
          ctx.lineTo(38, 75);
          ctx.closePath();
          ctx.fill();
          ctx.restore();

          // 3. Four 3D Road Tires with Alloy Rims
          ctx.fillStyle = '#0F172A';
          ctx.beginPath();
          ctx.roundRect(-34, 4, 10, 20, 4);
          ctx.fill();
          ctx.fillStyle = '#64748B';
          ctx.fillRect(-32, 8, 6, 12);

          ctx.fillStyle = '#0F172A';
          ctx.beginPath();
          ctx.roundRect(24, 4, 10, 20, 4);
          ctx.fill();
          ctx.fillStyle = '#64748B';
          ctx.fillRect(26, 8, 6, 12);

          // 4. Main Tap-Tap Bus Cab Body (Vibrant Caribbean Blue/Cyan 3D Metallic)
          const cabGrad = ctx.createLinearGradient(-30, -28, 30, 25);
          cabGrad.addColorStop(0, '#0284C7');
          cabGrad.addColorStop(0.3, '#38BDF8');
          cabGrad.addColorStop(0.7, '#0284C7');
          cabGrad.addColorStop(1, '#0C4A6E');
          ctx.fillStyle = cabGrad;
          ctx.beginPath();
          ctx.roundRect(-30, -28, 60, 46, 10);
          ctx.fill();
          ctx.strokeStyle = '#FDE047';
          ctx.lineWidth = 2;
          ctx.stroke();

          // 5. Haitian Kanaval Festive Stripes & Pop-Art Decals
          ctx.fillStyle = '#DC2626'; // Scarlet Red Stripe
          ctx.fillRect(-30, -2, 60, 8);
          ctx.fillStyle = '#F59E0B'; // Marigold Yellow Stripe
          ctx.fillRect(-30, 6, 60, 6);
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(-30, -3, 60, 1.5);

          // Kanaval Geometric Triangular Pattern
          ctx.fillStyle = '#FEF08A';
          for (let px = -24; px < 24; px += 10) {
            ctx.beginPath();
            ctx.moveTo(px, -2);
            ctx.lineTo(px + 5, 5);
            ctx.lineTo(px + 10, -2);
            ctx.closePath();
            ctx.fill();
          }

          // 6. Panoramic Tinted Windshield with Horizon Sunset Reflection
          const glassGrad = ctx.createLinearGradient(0, -24, 0, -8);
          glassGrad.addColorStop(0, '#38BDF8');
          glassGrad.addColorStop(0.5, '#E0F2FE');
          glassGrad.addColorStop(1, '#0284C7');
          ctx.fillStyle = glassGrad;
          ctx.beginPath();
          ctx.roundRect(-24, -24, 48, 18, 5);
          ctx.fill();
          ctx.strokeStyle = '#0369A1';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Sun-Visor Top Banner
          ctx.fillStyle = '#DC2626';
          ctx.fillRect(-24, -24, 48, 6);
          ctx.fillStyle = '#FEF08A';
          ctx.font = 'bold 5px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('NATCOM 4G LTE', 0, -19);

          // Windshield Wipers
          ctx.strokeStyle = '#1E293B';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(-14, -8);
          ctx.lineTo(-4, -16);
          ctx.moveTo(4, -8);
          ctx.lineTo(14, -16);
          ctx.stroke();

          // 7. Heavy-Duty Chrome Bumper & Bull-Bar Grille
          const bumperGrad = ctx.createLinearGradient(0, 12, 0, 22);
          bumperGrad.addColorStop(0, '#F8FAFC');
          bumperGrad.addColorStop(0.5, '#94A3B8');
          bumperGrad.addColorStop(1, '#334155');
          ctx.fillStyle = bumperGrad;
          ctx.beginPath();
          ctx.roundRect(-28, 12, 56, 9, 4);
          ctx.fill();
          ctx.strokeStyle = '#CBD5E1';
          ctx.lineWidth = 1;
          ctx.stroke();

          // License Plate (Haiti)
          ctx.fillStyle = '#0F172A';
          ctx.fillRect(-10, 14, 20, 6);
          ctx.fillStyle = '#FEF08A';
          ctx.font = 'bold 5px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('HT-2048', 0, 19);

          // Dual Crystal Halogen Headlights (Lit)
          ctx.save();
          ctx.shadowColor = '#FBBF24';
          ctx.shadowBlur = 14;
          ctx.fillStyle = '#FEF08A';
          ctx.beginPath();
          ctx.arc(-20, 10, 5.5, 0, Math.PI * 2);
          ctx.arc(20, 10, 5.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(-20, 10, 3, 0, Math.PI * 2);
          ctx.arc(20, 10, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          // Amber Indicator Lights
          ctx.fillStyle = '#F97316';
          ctx.beginPath();
          ctx.arc(-26, 10, 2.5, 0, Math.PI * 2);
          ctx.arc(26, 10, 2.5, 0, Math.PI * 2);
          ctx.fill();

          // 8. Roof Luggage Rack with Packed Haitian Cargo
          ctx.fillStyle = '#475569';
          ctx.fillRect(-26, -32, 52, 4);
          ctx.fillRect(-22, -36, 3, 5);
          ctx.fillRect(19, -36, 3, 5);

          // Woven Haitian Straw Basket
          ctx.fillStyle = '#D97706';
          ctx.beginPath();
          ctx.roundRect(-20, -41, 14, 9, 3);
          ctx.fill();

          // Vintage Orange Suitcase with Leather Straps
          ctx.fillStyle = '#EA580C';
          ctx.beginPath();
          ctx.roundRect(-4, -43, 16, 11, 2);
          ctx.fill();
          ctx.fillStyle = '#78350F';
          ctx.fillRect(-1, -43, 2.5, 11);
          ctx.fillRect(7, -43, 2.5, 11);

          // Spare Tire with Deep Treads
          ctx.fillStyle = '#1E293B';
          ctx.beginPath();
          ctx.ellipse(17, -37, 7, 6, Math.PI * 0.1, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#94A3B8';
          ctx.beginPath();
          ctx.arc(17, -37, 3, 0, Math.PI * 2);
          ctx.fill();

          // 9. Exhaust Tailpipe with Animated Smoke Puffs
          ctx.fillStyle = '#64748B';
          ctx.fillRect(-32, 16, 4, 4);
          const smokePuff = (time * 0.008) % 1;
          ctx.fillStyle = `rgba(226, 232, 240, ${0.45 * (1 - smokePuff)})`;
          ctx.beginPath();
          ctx.arc(-36 - smokePuff * 8, 14 - smokePuff * 4, 3 + smokePuff * 5, 0, Math.PI * 2);
          ctx.fill();
        } else if (obs.type === 'BARRIER_LOW') {
          // ── LOW 3D REFLECTIVE CONSTRUCTION BARRIER (JUMP OVER) ──
          // Ambient Shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
          ctx.beginPath();
          ctx.ellipse(0, 8, 30, 6, 0, 0, Math.PI * 2);
          ctx.fill();

          // Main Barricade Beam
          ctx.fillStyle = '#EA580C';
          ctx.beginPath();
          ctx.roundRect(-28, -16, 56, 16, 3);
          ctx.fill();

          // High-Visibility Diagonal Chevron Reflectors
          ctx.fillStyle = '#FFFFFF';
          for (let x = -24; x < 26; x += 12) {
            ctx.beginPath();
            ctx.moveTo(x, -16);
            ctx.lineTo(x + 6, -16);
            ctx.lineTo(x + 2, 0);
            ctx.lineTo(x - 4, 0);
            ctx.closePath();
            ctx.fill();
          }

          // Steel Support A-Frames
          ctx.fillStyle = '#475569';
          ctx.fillRect(-24, 0, 6, 14);
          ctx.fillRect(18, 0, 6, 14);

          // Pulsing Dual Amber Strobe LEDs
          const blink = Math.sin(time * 0.012) > 0;
          ctx.save();
          ctx.fillStyle = blink ? '#FEF08A' : '#78350F';
          ctx.shadowColor = '#FBBF24';
          ctx.shadowBlur = blink ? 14 : 0;
          ctx.beginPath();
          ctx.arc(-22, -20, 4, 0, Math.PI * 2);
          ctx.arc(22, -20, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else {
          // ── HIGH OVERHEAD 4G LASER GANTRY (SLIDE UNDER) ──
          // Overhead Cyber Signboard
          ctx.fillStyle = '#0F172A';
          ctx.beginPath();
          ctx.roundRect(-34, -48, 68, 22, 4);
          ctx.fill();
          ctx.strokeStyle = '#F59E0B';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Neon Glowing Warning Message
          ctx.fillStyle = '#FEF08A';
          ctx.font = 'bold 8px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('▼ SLIDE 4G ▼', 0, -34);

          // Glowing Holographic Laser Beam
          const laserAlpha = 0.5 + Math.sin(time * 0.01) * 0.3;
          ctx.fillStyle = `rgba(239, 68, 68, ${laserAlpha})`;
          ctx.fillRect(-30, -26, 60, 4);

          // Metal Gantry Support Towers
          ctx.fillStyle = '#64748B';
          ctx.fillRect(-32, -26, 5, 42);
          ctx.fillRect(27, -26, 5, 42);
        }

        ctx.restore();
      });

      // 5. Draw 3D Rotating & Floating Gold Coins
      coinsRef.current.forEach((coin) => {
        if (coin.collected || coin.y < 0) return;
        const yProgress = coin.y / (playerBaseY - horizonY);
        const scale = 0.38 + Math.pow(Math.min(1.2, yProgress), 1.2) * 0.68;
        const screenX = getLanePerspectiveX(coin.lane, yProgress, width);
        const floatY = Math.sin(time * 0.006 + coin.y * 0.02) * 4;
        const screenY = horizonY + coin.y + floatY;

        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.scale(scale, scale);

        // 3D Horizontal Spin Phase
        const spinPhase = time * 0.007 + coin.lane * 1.5 + coin.y * 0.015;
        const spin = Math.cos(spinPhase);
        const xRadius = Math.max(1.8, 11 * Math.abs(spin));
        const isBackSide = spin < 0;

        // Ground Shadow below coin
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
        ctx.beginPath();
        ctx.ellipse(0, 18 - floatY, 12, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Warm Golden Halo Glow
        ctx.shadowColor = '#FBBF24';
        ctx.shadowBlur = 12;

        // 3D Coin Rim Thickness
        if (Math.abs(spin) < 0.92) {
          const rimOffset = (spin > 0 ? 1 : -1) * (1 - Math.abs(spin)) * 3.5;
          ctx.fillStyle = '#B45309';
          ctx.beginPath();
          ctx.ellipse(rimOffset, 0, xRadius, 11, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        // Outer Coin Face (Rich Metallic Gold Gradient)
        const coinGrad = ctx.createRadialGradient(-2, -2, 2, 0, 0, 11);
        coinGrad.addColorStop(0, '#FEF08A');
        coinGrad.addColorStop(0.35, '#F59E0B');
        coinGrad.addColorStop(0.8, '#D97706');
        coinGrad.addColorStop(1, '#92400E');
        ctx.fillStyle = coinGrad;
        ctx.beginPath();
        ctx.ellipse(0, 0, xRadius, 11, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FEF08A';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Inner Beaded Ring & Embossed Star / N Logo
        if (xRadius > 5) {
          ctx.strokeStyle = '#B45309';
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.ellipse(0, 0, xRadius * 0.75, 8.2, 0, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = '#78350F';
          ctx.font = `bold ${Math.round(8 * Math.abs(spin))}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(isBackSide ? '★' : 'N', 0, 0);

          // Specular Light Gleam Sweep
          const sweep = ((time * 0.003 + coin.lane) % 2) - 1;
          if (sweep > -0.8 && sweep < 0.8) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
            ctx.beginPath();
            ctx.ellipse(sweep * xRadius, 0, 2, 8, 0, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        ctx.restore();
      });

      // 6. Draw 3D Floating Power-Ups
      powerUpsRef.current.forEach((pu) => {
        if (pu.collected || pu.y < 0) return;
        const yProgress = pu.y / (playerBaseY - horizonY);
        const scale = 0.48 + Math.pow(Math.min(1.2, yProgress), 1.2) * 0.58;
        const screenX = getLanePerspectiveX(pu.lane, yProgress, width);
        const floatY = Math.sin(time * 0.005 + pu.lane) * 5;
        const screenY = horizonY + pu.y + floatY;

        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.scale(scale, scale);

        if (pu.type === 'SHIELD') {
          ctx.shadowColor = '#38BDF8';
          ctx.shadowBlur = 16;
          ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
          ctx.beginPath();
          ctx.arc(0, 0, 16, 0, Math.PI * 2);
          ctx.fill();
          ctx.font = '16px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🛡️', 0, 0);
        } else if (pu.type === 'MAGNET') {
          ctx.shadowColor = '#EF4444';
          ctx.shadowBlur = 16;
          ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
          ctx.beginPath();
          ctx.arc(0, 0, 16, 0, Math.PI * 2);
          ctx.fill();
          ctx.font = '16px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🧲', 0, 0);
        } else if (pu.type === 'TURBO') {
          ctx.shadowColor = '#F59E0B';
          ctx.shadowBlur = 16;
          ctx.fillStyle = 'rgba(245, 158, 11, 0.4)';
          ctx.beginPath();
          ctx.arc(0, 0, 16, 0, Math.PI * 2);
          ctx.fill();
          ctx.font = '16px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('⭐', 0, 0);
        }

        ctx.restore();
      });

      // 7. Draw 3D Articulated Parkour Runner Athlete Character (Người Chạy)
      const p = playerRef.current;
      const pScreenX = p.x;
      const pScreenY = playerBaseY + p.jumpY;

      ctx.save();
      ctx.translate(pScreenX, pScreenY);

      // Smooth Banking / Tilting Roll during lane transitions
      const rollAngle = Math.max(-0.22, Math.min(0.22, (p.targetX - p.x) * 0.007));
      ctx.rotate(rollAngle);

      // Ground Shadow
      const shadowScale = Math.max(0.3, 1 - Math.abs(p.jumpY) / 120);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(0, 8, 20 * shadowScale, 6 * shadowScale, 0, 0, Math.PI * 2);
      ctx.fill();

      // Active 4G Shield Energy Bubble
      if (p.shield) {
        ctx.save();
        ctx.shadowColor = '#38BDF8';
        ctx.shadowBlur = 22;
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
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.55)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.arc(0, -22, 32, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Turbo Speed Wind Streaks
      if (isTurbo) {
        ctx.fillStyle = 'rgba(245, 158, 11, 0.35)';
        ctx.beginPath();
        ctx.moveTo(-10, -8);
        ctx.lineTo(-28, 4);
        ctx.lineTo(-10, 12);
        ctx.closePath();
        ctx.fill();
      }

      if (p.state === 'SLIDE') {
        // ── SLIDING POSE (Streamlined Low Baseball Slide) ──
        const sparkPhase = (time * 0.03) % 1;
        ctx.fillStyle = '#FDE047';
        ctx.beginPath();
        ctx.arc(-14 - sparkPhase * 12, 6, 2, 0, Math.PI * 2);
        ctx.arc(-8 - sparkPhase * 8, 4, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Trail Leg
        ctx.strokeStyle = '#1E293B';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-12, -4);
        ctx.lineTo(-24, 4);
        ctx.stroke();

        // Lead Sliding Leg with Pro Sneaker
        ctx.strokeStyle = '#0F172A';
        ctx.beginPath();
        ctx.moveTo(4, -4);
        ctx.lineTo(20, 2);
        ctx.stroke();

        // White Sneaker Sole
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.roundRect(16, 1, 10, 4, 2);
        ctx.fill();
        ctx.fillStyle = '#DC2626';
        ctx.fillRect(16, -2, 8, 3);

        // Torso Low Profile (Athletic Red Singlet)
        const torsoGrad = ctx.createLinearGradient(-10, -16, 10, 0);
        torsoGrad.addColorStop(0, '#DC2626');
        torsoGrad.addColorStop(1, '#991B1B');
        ctx.fillStyle = torsoGrad;
        ctx.beginPath();
        ctx.roundRect(-10, -14, 22, 12, 4);
        ctx.fill();

        // Head & Visor
        ctx.fillStyle = '#78350F';
        ctx.beginPath();
        ctx.arc(14, -14, 7, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#38BDF8';
        ctx.beginPath();
        ctx.roundRect(16, -16, 7, 3.5, 1.5);
        ctx.fill();

        // Streamer Ribbon in Wind
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(8, -14);
        ctx.quadraticCurveTo(-2, -18, -14, -12);
        ctx.stroke();
      } else if (p.state === 'JUMP') {
        // ── JUMPING POSE (Airborne Parkour Hurdle Leap) ──
        // Back Tucked Leg
        ctx.strokeStyle = '#1E293B';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-4, -14);
        ctx.lineTo(-14, -4);
        ctx.lineTo(-6, 2);
        ctx.stroke();
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(-8, 1, 8, 4);

        // Front Extended Leg
        ctx.strokeStyle = '#0F172A';
        ctx.beginPath();
        ctx.moveTo(4, -14);
        ctx.lineTo(12, -2);
        ctx.lineTo(18, 6);
        ctx.stroke();
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.roundRect(15, 5, 10, 4, 2);
        ctx.fill();
        ctx.fillStyle = '#DC2626';
        ctx.fillRect(15, 2, 8, 3);

        // Torso in Leap
        const torsoGrad = ctx.createLinearGradient(-9, -36, 9, -12);
        torsoGrad.addColorStop(0, '#DC2626');
        torsoGrad.addColorStop(1, '#7F1D1D');
        ctx.fillStyle = torsoGrad;
        ctx.beginPath();
        ctx.roundRect(-9, -34, 18, 22, 5);
        ctx.fill();

        // Natcom Gold Racing Stripe
        ctx.fillStyle = '#F59E0B';
        ctx.fillRect(-9, -26, 18, 4);

        // Outstretched Balance Arms
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-8, -30);
        ctx.lineTo(-20, -22);
        ctx.moveTo(8, -30);
        ctx.lineTo(20, -24);
        ctx.stroke();

        ctx.fillStyle = '#0F172A';
        ctx.beginPath();
        ctx.arc(-20, -22, 3, 0, Math.PI * 2);
        ctx.arc(20, -24, 3, 0, Math.PI * 2);
        ctx.fill();

        // Head, Visor & Ribbon
        ctx.fillStyle = '#78350F';
        ctx.beginPath();
        ctx.arc(0, -42, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#38BDF8';
        ctx.beginPath();
        ctx.roundRect(1, -44, 8, 4, 1.5);
        ctx.fill();

        ctx.strokeStyle = '#DC2626';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-6, -42);
        ctx.quadraticCurveTo(-14, -48, -24, -42);
        ctx.stroke();
      } else {
        // ── RUNNING POSE (High-Octane 8-Phase Articulated Sprint) ──
        const runCycle = p.runCycle;
        const stride = Math.sin(runCycle);
        const bobY = -Math.abs(Math.sin(runCycle * 2)) * 4.5;
        ctx.translate(0, bobY);

        // 1. Back Leg
        const backHipAngle = -stride * 0.7;
        const backKneeAngle = stride > 0 ? stride * 0.9 : 0.2;
        const backKneeX = -3 + Math.sin(backHipAngle) * 12;
        const backKneeY = -12 + Math.cos(backHipAngle) * 12;
        const backFootX = backKneeX + Math.sin(backHipAngle + backKneeAngle) * 12;
        const backFootY = backKneeY + Math.cos(backHipAngle + backKneeAngle) * 12;

        ctx.strokeStyle = '#1E293B';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-3, -14);
        ctx.lineTo(backKneeX, backKneeY);
        ctx.lineTo(backFootX, backFootY);
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.roundRect(backFootX - 4, backFootY - 2, 10, 4.5, 2);
        ctx.fill();
        ctx.fillStyle = '#DC2626';
        ctx.fillRect(backFootX - 3, backFootY - 4, 7, 3);

        // 2. Front Leg
        const frontHipAngle = stride * 0.7;
        const frontKneeAngle = stride < 0 ? -stride * 0.9 : 0.2;
        const frontKneeX = 3 + Math.sin(frontHipAngle) * 12;
        const frontKneeY = -12 + Math.cos(frontHipAngle) * 12;
        const frontFootX = frontKneeX + Math.sin(frontHipAngle + frontKneeAngle) * 12;
        const frontFootY = frontKneeY + Math.cos(frontHipAngle + frontKneeAngle) * 12;

        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 5.5;
        ctx.beginPath();
        ctx.moveTo(3, -14);
        ctx.lineTo(frontKneeX, frontKneeY);
        ctx.lineTo(frontFootX, frontFootY);
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.roundRect(frontFootX - 4, frontFootY - 2, 11, 5, 2.5);
        ctx.fill();
        ctx.fillStyle = '#F59E0B';
        ctx.fillRect(frontFootX - 3, frontFootY - 5, 8, 3.5);

        // 3. Torso & Singlet with Lean
        ctx.save();
        ctx.rotate(0.08);

        const torsoGrad = ctx.createLinearGradient(-9, -35, 9, -12);
        torsoGrad.addColorStop(0, '#DC2626');
        torsoGrad.addColorStop(0.6, '#B91C1C');
        torsoGrad.addColorStop(1, '#7F1D1D');
        ctx.fillStyle = torsoGrad;
        ctx.beginPath();
        ctx.roundRect(-9, -35, 18, 23, 5);
        ctx.fill();

        ctx.fillStyle = '#FEF08A';
        ctx.fillRect(-9, -26, 18, 4);
        ctx.fillStyle = '#78350F';
        ctx.font = 'bold 7px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('10', 0, -23);

        // Hydration Backpack with Glowing Cyan Status
        ctx.fillStyle = '#1E293B';
        ctx.beginPath();
        ctx.roundRect(-7, -33, 14, 12, 3);
        ctx.fill();
        ctx.fillStyle = '#38BDF8';
        ctx.fillRect(-5, -27, 10, 2.5);

        // 4. Pumping Arms
        const armSwing = -stride * 0.75;
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-7, -30);
        ctx.lineTo(-7 + Math.sin(armSwing) * 11, -20);
        ctx.lineTo(-7 + Math.sin(armSwing) * 16, -14);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(7, -30);
        ctx.lineTo(7 - Math.sin(armSwing) * 11, -20);
        ctx.lineTo(7 - Math.sin(armSwing) * 16, -14);
        ctx.stroke();

        ctx.fillStyle = '#0F172A';
        ctx.beginPath();
        ctx.arc(-7 + Math.sin(armSwing) * 16, -14, 3, 0, Math.PI * 2);
        ctx.arc(7 - Math.sin(armSwing) * 16, -14, 3, 0, Math.PI * 2);
        ctx.fill();

        // 5. Head & Flowing Ribbons
        ctx.fillStyle = '#78350F';
        ctx.beginPath();
        ctx.arc(0, -42, 8, 0, Math.PI * 2);
        ctx.fill();

        const visorGrad = ctx.createLinearGradient(0, -44, 8, -40);
        visorGrad.addColorStop(0, '#38BDF8');
        visorGrad.addColorStop(1, '#F43F5E');
        ctx.fillStyle = visorGrad;
        ctx.beginPath();
        ctx.roundRect(1, -44, 8, 4, 1.5);
        ctx.fill();

        ctx.fillStyle = '#F59E0B';
        ctx.fillRect(-8, -46, 16, 3.5);

        const ribbonWave1 = Math.sin(time * 0.02) * 5;
        const ribbonWave2 = Math.cos(time * 0.025) * 6;
        ctx.strokeStyle = '#DC2626';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-8, -44);
        ctx.quadraticCurveTo(-16, -46 + ribbonWave1, -26, -42 + ribbonWave1 * 1.2);
        ctx.stroke();

        ctx.strokeStyle = '#FEF08A';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-8, -42);
        ctx.quadraticCurveTo(-14, -40 + ribbonWave2, -22, -38 + ribbonWave2);
        ctx.stroke();

        ctx.restore();
      }

      ctx.restore();

      // 8. Speed Tunnel Lines for Turbo and High Speeds
      if (isTurbo || currentSpeed > 7) {
        ctx.save();
        const streakAlpha = isTurbo ? 0.35 : 0.18;
        ctx.strokeStyle = `rgba(254, 240, 138, ${streakAlpha})`;
        ctx.lineWidth = isTurbo ? 2.5 : 1.5;
        for (let s = 0; s < 6; s++) {
          const streakY = (time * 0.6 + s * 80) % height;
          ctx.beginPath();
          ctx.moveTo(8, streakY);
          ctx.lineTo(8, streakY + 45);
          ctx.moveTo(width - 8, streakY);
          ctx.lineTo(width - 8, streakY + 45);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 9. Update and Render Particles & Floating Text FX
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
