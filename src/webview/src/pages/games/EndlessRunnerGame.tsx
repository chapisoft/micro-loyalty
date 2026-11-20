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
  z: number; // world depth from player (0 = player, 110 = horizon)
  type: 'TAPTAP' | 'BARRIER_LOW' | 'BARRIER_HIGH';
  passed: boolean;
}

interface CoinItem {
  lane: Lane;
  z: number;
  collected: boolean;
}

interface PowerUpItem {
  lane: Lane;
  z: number;
  type: PowerUpType;
  collected: boolean;
}

const FOV = 24;
const MAX_Z = 115;

function projectZ(z: number, horizonY: number, playerBaseY: number) {
  const clampedZ = Math.max(-10, z);
  const scale = FOV / (FOV + clampedZ);
  const screenY = horizonY + scale * (playerBaseY - horizonY);
  return { scale, screenY };
}

function getLaneXAtZ(lane: number, z: number, width: number, horizonY: number, playerBaseY: number) {
  const { scale } = projectZ(z, horizonY, playerBaseY);
  const roadHalfBottom = width * 0.44;
  const laneOffset = (lane - 1) * (roadHalfBottom * 0.64) * scale;
  return width * 0.5 + laneOffset;
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
    targetLane: Lane;
    lanePos: number;
    jumpHeight: number;
    jumpVel: number;
    state: 'RUN' | 'JUMP' | 'SLIDE';
    slideTimer: number;
    pendingSlide: boolean;
    shield: boolean;
    runCycle: number;
  }>({
    targetLane: 1,
    lanePos: 1,
    jumpHeight: 0,
    jumpVel: 0,
    state: 'RUN',
    slideTimer: 0,
    pendingSlide: false,
    shield: false,
    runCycle: 0,
  });

  const gameStateRef = useRef<'IDLE' | 'RUNNING' | 'GAMEOVER'>(gameState);
  gameStateRef.current = gameState;
  const highScoreRef = useRef<number>(highScore);
  highScoreRef.current = highScore;

  const obstaclesRef = useRef<Obstacle[]>([]);
  const coinsRef = useRef<CoinItem[]>([]);
  const powerUpsRef = useRef<PowerUpItem[]>([]);
  const fxRef = useRef<GameFXSystem>(new GameFXSystem());
  const frameIdRef = useRef<number | null>(null);
  const distRef = useRef<number>(0);
  const coinsCountRef = useRef<number>(0);
  const spawnCooldownRef = useRef<number>(1.25);
  const roadScrollZRef = useRef<number>(0);
  const magnetTimerRef = useRef<number>(0);
  const turboTimerRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const pointerStartRef = useRef<{ x: number; y: number; time: number; consumed: boolean } | null>(null);
  const lastReportedDistRef = useRef<number>(-1);
  const lastReportedSpeedRef = useRef<number>(-1);
  const lastHudSyncRef = useRef<number>(0);
  const bufferedActionRef = useRef<{ action: 'JUMP' | 'SLIDE'; expiresAt: number } | null>(null);
  const invulnerableUntilRef = useRef<number>(0);
  const canvasSizeRef = useRef<{ width: number; height: number }>({ width: 360, height: 460 });
  const lastCoinSoundTimeRef = useRef<number>(0);
  const coinPitchStepRef = useRef<number>(0);

  const RUNNER_GRAVITY = 1480; // px/s^2
  const RUNNER_JUMP_VEL = 430; // px/s (~0.58s airtime)

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    GameSounds.setMuted(!next);
  };

  const startGame = useCallback(() => {
    playerRef.current = {
      targetLane: 1,
      lanePos: 1,
      jumpHeight: 0,
      jumpVel: 0,
      state: 'RUN',
      slideTimer: 0,
      pendingSlide: false,
      shield: false,
      runCycle: 0,
    };
    obstaclesRef.current = [];
    coinsRef.current = [];
    powerUpsRef.current = [];
    fxRef.current.clear();
    distRef.current = 0;
    coinsCountRef.current = 0;
    spawnCooldownRef.current = 1.25; // Safe start runway before first obstacle arrives
    roadScrollZRef.current = 0;
    magnetTimerRef.current = 0;
    turboTimerRef.current = 0;
    lastTimeRef.current = 0;
    lastReportedDistRef.current = 0;
    lastReportedSpeedRef.current = 1;
    lastHudSyncRef.current = 0;
    bufferedActionRef.current = null;
    invulnerableUntilRef.current = 0;

    gameStateRef.current = 'RUNNING';
    setDistance(0);
    setCoins(0);
    setHasShield(false);
    setMagnetSeconds(0);
    setTurboSeconds(0);
    setSpeedMultiplier(1);
    setShowRewardModal(false);
    setGameState('RUNNING');
    GameSounds.playStart();
  }, []);

  const moveLeft = useCallback(() => {
    if (gameStateRef.current !== 'RUNNING') return;
    const p = playerRef.current;
    if (p.targetLane > 0) {
      p.targetLane = (p.targetLane - 1) as Lane;
      GameSounds.playTap();
      const { width, height } = canvasSizeRef.current;
      const horizonY = height * 0.28;
      const playerBaseY = height * 0.80;
      const px = getLaneXAtZ(p.lanePos, 0, width, horizonY, playerBaseY);
      fxRef.current.spawnSmokePuff(px, playerBaseY, 4);
    }
  }, []);

  const moveRight = useCallback(() => {
    if (gameStateRef.current !== 'RUNNING') return;
    const p = playerRef.current;
    if (p.targetLane < 2) {
      p.targetLane = (p.targetLane + 1) as Lane;
      GameSounds.playTap();
      const { width, height } = canvasSizeRef.current;
      const horizonY = height * 0.28;
      const playerBaseY = height * 0.80;
      const px = getLaneXAtZ(p.lanePos, 0, width, horizonY, playerBaseY);
      fxRef.current.spawnSmokePuff(px, playerBaseY, 4);
    }
  }, []);

  const jump = useCallback(() => {
    if (gameStateRef.current !== 'RUNNING') {
      startGame();
      return;
    }
    const p = playerRef.current;
    if (p.jumpHeight <= 1 && p.state !== 'JUMP') {
      p.jumpVel = RUNNER_JUMP_VEL;
      p.state = 'JUMP';
      p.pendingSlide = false;
      GameSounds.playTap();
      const { width, height } = canvasSizeRef.current;
      const horizonY = height * 0.28;
      const playerBaseY = height * 0.80;
      const px = getLaneXAtZ(p.lanePos, 0, width, horizonY, playerBaseY);
      fxRef.current.spawnSmokePuff(px, playerBaseY, 6);
    } else {
      // Input buffer for smooth chained jump on touchdown
      bufferedActionRef.current = { action: 'JUMP', expiresAt: performance.now() + 140 };
    }
  }, [startGame]);

  const slide = useCallback(() => {
    if (gameStateRef.current !== 'RUNNING') return;
    const p = playerRef.current;
    if (p.state === 'JUMP') {
      // Fast-fall mid-air and seamlessly chain into slide
      p.jumpVel = Math.min(p.jumpVel, -680);
      p.pendingSlide = true;
      bufferedActionRef.current = { action: 'SLIDE', expiresAt: performance.now() + 220 };
      GameSounds.playScratch();
      return;
    }
    p.state = 'SLIDE';
    p.slideTimer = 0.62;
    GameSounds.playScratch();
    const { width, height } = canvasSizeRef.current;
    const horizonY = height * 0.28;
    const playerBaseY = height * 0.80;
    const px = getLaneXAtZ(p.lanePos, 0, width, horizonY, playerBaseY);
    fxRef.current.spawnSmokePuff(px, playerBaseY, 5);
  }, []);

  // Global Keyboard Controls (WASD / Arrows / Space)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.code === 'Space') {
        e.preventDefault();
        jump();
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        slide();
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        moveLeft();
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        moveRight();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [jump, slide, moveLeft, moveRight]);

  // Unified Pointer Swipe Gesture Handlers (instant trigger on drag threshold)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    pointerStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now(), consumed: false };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const start = pointerStartRef.current;
    if (!start || start.consumed || gameStateRef.current !== 'RUNNING') return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.hypot(dx, dy) < 24) return;

    start.consumed = true;
    if (Math.abs(dy) > Math.abs(dx)) {
      if (dy < 0) jump();
      else slide();
    } else {
      if (dx < 0) moveLeft();
      else moveRight();
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const start = pointerStartRef.current;
    if (!start) return;
    pointerStartRef.current = null;
    if (start.consumed) return;

    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    const elapsed = Date.now() - start.time;

    if (gameStateRef.current !== 'RUNNING') {
      if (Math.hypot(dx, dy) < 20) startGame();
      return;
    }

    if (elapsed > 700) return;
    if (Math.hypot(dx, dy) < 16) {
      jump();
    }
  };

  // Main Canvas Render & Animation Loop (60 FPS 2.5D High-Octane Caribbean Parkour)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = canvas.parentElement?.clientWidth || 360;
    const height = Math.min(window.innerHeight - 210, 470);
    canvasSizeRef.current = { width, height };
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const horizonY = height * 0.28;
    const playerBaseY = height * 0.80;

    // Cache static sky & asphalt gradients once outside render loop
    const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
    skyGrad.addColorStop(0, '#0F172A');
    skyGrad.addColorStop(0.3, '#581C87');
    skyGrad.addColorStop(0.65, '#BE185D');
    skyGrad.addColorStop(0.85, '#F97316');
    skyGrad.addColorStop(1, '#FDE047');

    const asphaltGrad = ctx.createLinearGradient(0, horizonY, 0, height);
    asphaltGrad.addColorStop(0, '#334155');
    asphaltGrad.addColorStop(0.35, '#1E293B');
    asphaltGrad.addColorStop(1, '#0F172A');

    lastTimeRef.current = 0;

    const render = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const dtSec = Math.min(0.05, Math.max(0.001, (time - lastTimeRef.current) / 1000));
      const dt60 = dtSec * 60;
      lastTimeRef.current = time;

      const isRunning = gameStateRef.current === 'RUNNING';

      // Power-up timers countdown
      if (isRunning) {
        if (magnetTimerRef.current > 0) {
          magnetTimerRef.current = Math.max(0, magnetTimerRef.current - dtSec);
          setMagnetSeconds(Math.ceil(magnetTimerRef.current));
        }
        if (turboTimerRef.current > 0) {
          turboTimerRef.current = Math.max(0, turboTimerRef.current - dtSec);
          setTurboSeconds(Math.ceil(turboTimerRef.current));
        }
      }

      // Unified world speed in Z-units per second
      const isTurbo = turboTimerRef.current > 0;
      const baseWorldSpeed = 38 + Math.min(34, distRef.current * 0.045);
      const worldSpeed = baseWorldSpeed * (isTurbo ? 1.4 : 1.0);
      if (isRunning) {
        roadScrollZRef.current = (roadScrollZRef.current + worldSpeed * dtSec) % 16;
      }

      // 0. Screen Shake Offset
      const shake = fxRef.current.getShakeOffset();
      ctx.save();
      ctx.translate(shake.x, shake.y);

      // 1. Caribbean Sunset Sky Gradient with Atmospheric Haze
      ctx.fillStyle = skyGrad;
      ctx.fillRect(-20, -20, width + 40, horizonY + 20);

      // Warm Sun Disk with Lightweight Translucent Flare Halo (zero shadowBlur)
      ctx.fillStyle = 'rgba(249, 115, 22, 0.28)';
      ctx.beginPath();
      ctx.arc(width * 0.5, horizonY - 14, 42, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FEF08A';
      ctx.beginPath();
      ctx.arc(width * 0.5, horizonY - 14, 28, 0, Math.PI * 2);
      ctx.fill();

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

      // Port-au-Prince Distant Skyline
      ctx.fillStyle = '#1E1B4B';
      for (let bx = 15; bx < width - 15; bx += 32) {
        const bH = 12 + Math.sin(bx * 0.1) * 8;
        ctx.fillRect(bx, horizonY - bH, 20, bH);
        ctx.fillStyle = '#FDE047';
        ctx.fillRect(bx + 4, horizonY - bH + 3, 3, 3);
        ctx.fillRect(bx + 12, horizonY - bH + 3, 3, 3);
        ctx.fillStyle = '#1E1B4B';
      }

      // 2. Unified 3D Perspective Highway Road (Driven 100% by projectZ)
      ctx.fillStyle = '#14532D';
      ctx.fillRect(0, horizonY, width, height - horizonY);

      const farZ = 240;
      const nearScale = (height - horizonY) / (playerBaseY - horizonY);
      const nearZ = FOV / nearScale - FOV;
      const farProj = projectZ(farZ, horizonY, playerBaseY);
      const nearProj = projectZ(nearZ, horizonY, playerBaseY);
      const roadHalfFar = width * 0.44 * farProj.scale;
      const roadHalfNear = width * 0.44 * nearProj.scale;

      // 3D Asphalt Trapezoid
      ctx.fillStyle = asphaltGrad;
      ctx.beginPath();
      ctx.moveTo(width * 0.5 - roadHalfFar, farProj.screenY);
      ctx.lineTo(width * 0.5 + roadHalfFar, farProj.screenY);
      ctx.lineTo(width * 0.5 + roadHalfNear, height);
      ctx.lineTo(width * 0.5 - roadHalfNear, height);
      ctx.closePath();
      ctx.fill();

      // Unified 3D Red-and-White Curbs & Yellow Lane Dashes (stepped in world Z)
      const zStep = 8;
      const scrollMod = roadScrollZRef.current;
      for (let idx = 0; idx < 22; idx++) {
        const zFarSeg = 176 - idx * zStep - (scrollMod % 16);
        const zNearSeg = zFarSeg - zStep;
        if (zFarSeg <= nearZ || zNearSeg >= farZ) continue;

        const pFar = projectZ(Math.min(farZ, zFarSeg), horizonY, playerBaseY);
        const pNear = projectZ(Math.max(nearZ, zNearSeg), horizonY, playerBaseY);

        const halfW1 = width * 0.44 * pFar.scale;
        const halfW2 = width * 0.44 * pNear.scale;

        ctx.fillStyle = idx % 2 === 0 ? '#DC2626' : '#F8FAFC';
        // Left curb
        ctx.beginPath();
        ctx.moveTo(width * 0.5 - halfW1, pFar.screenY);
        ctx.lineTo(width * 0.5 - halfW1 - 9 * pFar.scale, pFar.screenY);
        ctx.lineTo(width * 0.5 - halfW2 - 9 * pNear.scale, pNear.screenY);
        ctx.lineTo(width * 0.5 - halfW2, pNear.screenY);
        ctx.closePath();
        ctx.fill();

        // Right curb
        ctx.beginPath();
        ctx.moveTo(width * 0.5 + halfW1, pFar.screenY);
        ctx.lineTo(width * 0.5 + halfW1 + 9 * pFar.scale, pFar.screenY);
        ctx.lineTo(width * 0.5 + halfW2 + 9 * pNear.scale, pNear.screenY);
        ctx.lineTo(width * 0.5 + halfW2, pNear.screenY);
        ctx.closePath();
        ctx.fill();

        // Alternating lane dividers
        if (idx % 2 === 0) {
          const zDashNear = Math.max(nearZ, zFarSeg - zStep * 0.55);
          const pDashNear = projectZ(zDashNear, horizonY, playerBaseY);
          const div1 = halfW1 * 0.32;
          const div2 = width * 0.44 * pDashNear.scale * 0.32;
          ctx.strokeStyle = `rgba(254, 240, 138, ${Math.min(0.95, pFar.scale * 1.4)})`;
          ctx.lineWidth = Math.max(1, 2.8 * pDashNear.scale);

          ctx.beginPath();
          ctx.moveTo(width * 0.5 - div1, pFar.screenY);
          ctx.lineTo(width * 0.5 - div2, pDashNear.screenY);
          ctx.moveTo(width * 0.5 + div1, pFar.screenY);
          ctx.lineTo(width * 0.5 + div2, pDashNear.screenY);
          ctx.stroke();
        }
      }

      // Unified 3D Palm Trees along curbs
      for (let tIdx = 5; tIdx >= 0; tIdx--) {
        const treeZ = 180 - tIdx * 32 - ((scrollMod * 2) % 32);
        if (treeZ <= nearZ + 2 || treeZ > 190) continue;
        const pTree = projectZ(treeZ, horizonY, playerBaseY);
        const roadHalf = width * 0.44 * pTree.scale;
        const tLeftX = width * 0.5 - roadHalf - 22 * pTree.scale;
        const tRightX = width * 0.5 + roadHalf + 22 * pTree.scale;

        ctx.save();
        ctx.translate(tLeftX, pTree.screenY);
        ctx.scale(pTree.scale, pTree.scale);
        ctx.fillStyle = '#78350F';
        ctx.fillRect(-3, -44, 6, 44);
        ctx.fillStyle = '#15803D';
        ctx.beginPath();
        ctx.arc(0, -46, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.translate(tRightX, pTree.screenY);
        ctx.scale(pTree.scale, pTree.scale);
        ctx.fillStyle = '#78350F';
        ctx.fillRect(-3, -44, 6, 44);
        ctx.fillStyle = '#16A34A';
        ctx.beginPath();
        ctx.arc(0, -46, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 3. Spawning & World-Z Movement Logic
      const p = playerRef.current;

      if (isRunning) {
        distRef.current += worldSpeed * 0.28 * dtSec;
        const nextDist = Math.floor(distRef.current);
        if (nextDist !== lastReportedDistRef.current && time - lastHudSyncRef.current >= 120) {
          lastReportedDistRef.current = nextDist;
          lastHudSyncRef.current = time;
          setDistance(nextDist);
        }
        const nextSpeed = Number((worldSpeed / 38).toFixed(1));
        if (nextSpeed !== lastReportedSpeedRef.current) {
          lastReportedSpeedRef.current = nextSpeed;
          setSpeedMultiplier(nextSpeed);
        }

        spawnCooldownRef.current -= dtSec;
        if (spawnCooldownRef.current <= 0) {
          const minDelay = Math.max(0.68, 1.18 - distRef.current * 0.00055);
          spawnCooldownRef.current = minDelay / (isTurbo ? 1.25 : 1.0);

          // Guarantee at least 1 open safe lane every wave!
          const safeLane: Lane = Math.floor(Math.random() * 3) as Lane;
          const otherLanes = ([0, 1, 2] as Lane[]).filter((l) => l !== safeLane);
          const doubleProb =
            distRef.current < 60
              ? 0
              : distRef.current < 180
              ? 0.28
              : Math.min(0.48, 0.28 + (distRef.current - 180) * 0.0005);
          const doubleObstacle = Math.random() < doubleProb;
          const obstacleLanes = doubleObstacle
            ? otherLanes
            : [otherLanes[Math.floor(Math.random() * otherLanes.length)]];

          obstacleLanes.forEach((lane) => {
            const obsRoll = Math.random();
            const obsType = obsRoll < 0.42 ? 'TAPTAP' : obsRoll < 0.72 ? 'BARRIER_LOW' : 'BARRIER_HIGH';
            obstaclesRef.current.push({
              lane,
              z: MAX_Z,
              type: obsType,
              passed: false,
            });
          });

          // Spawn 3 coins along the open safe lane
          for (let i = 0; i < 3; i++) {
            coinsRef.current.push({
              lane: safeLane,
              z: MAX_Z + i * 10,
              collected: false,
            });
          }

          // Random Power-Up Spawn (20% chance) in safe lane ahead of coins
          if (Math.random() < 0.2) {
            const puChoices: PowerUpType[] = ['SHIELD', 'MAGNET', 'TURBO'];
            const puType = puChoices[Math.floor(Math.random() * puChoices.length)];
            powerUpsRef.current.push({
              lane: safeLane,
              z: MAX_Z + 34,
              type: puType,
              collected: false,
            });
          }
        }

        // Advance world entities toward player (z -> negative)
        for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
          const obs = obstaclesRef.current[i];
          obs.z -= worldSpeed * dtSec;
          if (obs.z < nearZ - 8) obstaclesRef.current.splice(i, 1);
        }

        for (let i = coinsRef.current.length - 1; i >= 0; i--) {
          const c = coinsRef.current[i];
          c.z -= worldSpeed * dtSec;
          if (c.z < nearZ - 8) coinsRef.current.splice(i, 1);
        }

        for (let i = powerUpsRef.current.length - 1; i >= 0; i--) {
          const pu = powerUpsRef.current[i];
          pu.z -= worldSpeed * dtSec;
          if (pu.z < nearZ - 8) powerUpsRef.current.splice(i, 1);
        }

        // Smooth Exponential Lane Interpolation + Run/Jump/Slide Physics
        p.lanePos += (p.targetLane - p.lanePos) * (1 - Math.exp(-18 * dtSec));
        p.runCycle += 15 * dtSec;

        if (p.state === 'JUMP') {
          p.jumpHeight += p.jumpVel * dtSec;
          p.jumpVel -= RUNNER_GRAVITY * dtSec;
          if (p.jumpHeight <= 0) {
            p.jumpHeight = 0;
            p.jumpVel = 0;
            const playerScreenX = getLaneXAtZ(p.lanePos, 0, width, horizonY, playerBaseY);
            fxRef.current.spawnSmokePuff(playerScreenX, playerBaseY, 4);

            const nowPerf = performance.now();
            const buffered = bufferedActionRef.current;
            if (p.pendingSlide || (buffered && buffered.action === 'SLIDE' && nowPerf <= buffered.expiresAt)) {
              p.state = 'SLIDE';
              p.slideTimer = 0.62;
              p.pendingSlide = false;
              bufferedActionRef.current = null;
            } else if (buffered && buffered.action === 'JUMP' && nowPerf <= buffered.expiresAt) {
              p.jumpVel = RUNNER_JUMP_VEL;
              p.state = 'JUMP';
              bufferedActionRef.current = null;
              GameSounds.playTap();
            } else {
              p.state = 'RUN';
            }
          }
        } else if (p.state === 'SLIDE') {
          p.slideTimer -= dtSec;
          if (p.slideTimer <= 0) {
            p.state = 'RUN';
          }
        }

        const pScreenX = getLaneXAtZ(p.lanePos, 0, width, horizonY, playerBaseY);
        const pScreenY = playerBaseY - p.jumpHeight;

        // Accurate World-Z & Lane-Overlap Collision Check
        for (const obs of obstaclesRef.current) {
          if (obs.z > -4.5 && obs.z < 6.5 && Math.abs(obs.lane - p.lanePos) < 0.44) {
            let safe = false;
            if (obs.type === 'BARRIER_LOW' && p.jumpHeight > 22) {
              safe = true;
            } else if (obs.type === 'BARRIER_HIGH' && p.state === 'SLIDE') {
              safe = true;
            }

            if (!safe && time > invulnerableUntilRef.current) {
              if (p.shield) {
                p.shield = false;
                setHasShield(false);
                invulnerableUntilRef.current = time + 1000;
                fxRef.current.addScreenShake(0.6);
                fxRef.current.spawnSparkles(pScreenX, pScreenY - 20, 30, '#38BDF8');
                fxRef.current.spawnFloatText(pScreenX, pScreenY - 35, 'SHIELD SAVED! 🛡️', '#38BDF8');
                GameSounds.playPowerUp();
              } else {
                gameStateRef.current = 'GAMEOVER';
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

                if (distRef.current > highScoreRef.current) {
                  const newBest = Math.floor(distRef.current);
                  highScoreRef.current = newBest;
                  setHighScore(newBest);
                  try {
                    localStorage.setItem('runner_best_distance', String(newBest));
                  } catch {
                    /* ignore storage errors */
                  }
                }
                break;
              }
            }
          }
        }

        // Coin Magnetic Attraction & Collection
        coinsRef.current.forEach((coin) => {
          if (!coin.collected && coin.z < MAX_Z) {
            const proj = projectZ(coin.z, horizonY, playerBaseY);
            let coinScreenX = getLaneXAtZ(coin.lane, coin.z, width, horizonY, playerBaseY);
            let coinScreenY = proj.screenY;

            if (magnetTimerRef.current > 0 && coin.z < 55) {
              const pull = Math.min(0.4, 10 * dtSec);
              coinScreenX += (pScreenX - coinScreenX) * pull;
              coinScreenY += (pScreenY - 16 - coinScreenY) * pull;
            }

            const laneClose = Math.abs(coin.lane - p.lanePos) < 0.65 || magnetTimerRef.current > 0;
            const zClose = coin.z > -6 && coin.z < 10;
            const screenClose = Math.hypot(pScreenX - coinScreenX, pScreenY - 18 - coinScreenY) < 34;
            if ((laneClose && zClose) || screenClose) {
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
              // Tiết lưu âm thanh nhặt xu (tối thiểu 70ms giữa các nốt) để không phát dồn dập đinh tai
              const nowPerf = performance.now();
              if (nowPerf - lastCoinSoundTimeRef.current >= 70) {
                lastCoinSoundTimeRef.current = nowPerf;
                coinPitchStepRef.current = (coinPitchStepRef.current + 1) % 8;
                GameSounds.playCoinPickup(1.0 + coinPitchStepRef.current * 0.04);
              }
            }
          }
        });

        // Power-Up Collection
        powerUpsRef.current.forEach((pu) => {
          if (!pu.collected && pu.z > -6 && pu.z < 10 && Math.abs(pu.lane - p.lanePos) < 0.55) {
            pu.collected = true;
            const puProj = projectZ(pu.z, horizonY, playerBaseY);
            const puScreenX = getLaneXAtZ(pu.lane, pu.z, width, horizonY, playerBaseY);
            const puScreenY = puProj.screenY;
            GameSounds.playPowerUp();

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
        });
      }

      // 4. Depth-Sorted Back-to-Front Rendering of Obstacles, Coins & Power-Ups
      type RenderableItem =
        | { z: number; kind: 'OBS'; obs: Obstacle }
        | { z: number; kind: 'COIN'; coin: CoinItem }
        | { z: number; kind: 'PU'; pu: PowerUpItem };

      const renderList: RenderableItem[] = [];
      obstaclesRef.current.forEach((obs) => {
        if (obs.z <= MAX_Z && obs.z > nearZ) renderList.push({ z: obs.z, kind: 'OBS', obs });
      });
      coinsRef.current.forEach((coin) => {
        if (!coin.collected && coin.z <= MAX_Z && coin.z > nearZ) renderList.push({ z: coin.z, kind: 'COIN', coin });
      });
      powerUpsRef.current.forEach((pu) => {
        if (!pu.collected && pu.z <= MAX_Z && pu.z > nearZ) renderList.push({ z: pu.z, kind: 'PU', pu });
      });
      renderList.sort((a, b) => b.z - a.z);

      renderList.forEach((entry) => {
        const proj = projectZ(entry.z, horizonY, playerBaseY);
        const scale = proj.scale;

        if (entry.kind === 'OBS') {
          const obs = entry.obs;
          const screenX = getLaneXAtZ(obs.lane, obs.z, width, horizonY, playerBaseY);
          const screenY = proj.screenY;

          ctx.save();
          ctx.translate(screenX, screenY);
          ctx.scale(scale, scale);

          if (obs.type === 'TAPTAP') {
            // ── 3D AUTHENTIC HAITIAN TAP-TAP BUS ──
            const bounceY = Math.sin(time * 0.018 + obs.lane * 3) * 1.5;
            ctx.translate(0, bounceY);

            ctx.save();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
            ctx.beginPath();
            ctx.ellipse(0, 4, 38, 10, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            ctx.translate(0, -20);

            const beamGrad = ctx.createLinearGradient(0, 10, 0, 60);
            beamGrad.addColorStop(0, 'rgba(254, 240, 138, 0.4)');
            beamGrad.addColorStop(1, 'rgba(254, 240, 138, 0.0)');
            ctx.fillStyle = beamGrad;
            ctx.beginPath();
            ctx.moveTo(-18, 10);
            ctx.lineTo(-34, 60);
            ctx.lineTo(-6, 60);
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(18, 10);
            ctx.lineTo(6, 60);
            ctx.lineTo(34, 60);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#0F172A';
            ctx.beginPath();
            ctx.roundRect(-34, 4, 10, 20, 4);
            ctx.roundRect(24, 4, 10, 20, 4);
            ctx.fill();

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

            ctx.fillStyle = '#DC2626';
            ctx.fillRect(-30, -2, 60, 8);
            ctx.fillStyle = '#F59E0B';
            ctx.fillRect(-30, 6, 60, 6);

            const glassGrad = ctx.createLinearGradient(0, -24, 0, -8);
            glassGrad.addColorStop(0, '#38BDF8');
            glassGrad.addColorStop(0.5, '#E0F2FE');
            glassGrad.addColorStop(1, '#0284C7');
            ctx.fillStyle = glassGrad;
            ctx.beginPath();
            ctx.roundRect(-24, -24, 48, 18, 5);
            ctx.fill();

            ctx.fillStyle = '#DC2626';
            ctx.fillRect(-24, -24, 48, 6);
            ctx.fillStyle = '#FEF08A';
            ctx.font = 'bold 5px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('NATCOM 4G LTE', 0, -19);

            ctx.fillStyle = '#FEF08A';
            ctx.beginPath();
            ctx.arc(-20, 10, 5, 0, Math.PI * 2);
            ctx.arc(20, 10, 5, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#D97706';
            ctx.beginPath();
            ctx.roundRect(-20, -40, 14, 9, 3);
            ctx.fill();
            ctx.fillStyle = '#EA580C';
            ctx.beginPath();
            ctx.roundRect(-4, -42, 16, 11, 2);
            ctx.fill();
          } else if (obs.type === 'BARRIER_LOW') {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
            ctx.beginPath();
            ctx.ellipse(0, 2, 30, 6, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#EA580C';
            ctx.beginPath();
            ctx.roundRect(-28, -22, 56, 16, 3);
            ctx.fill();

            ctx.fillStyle = '#FFFFFF';
            for (let x = -24; x < 26; x += 12) {
              ctx.beginPath();
              ctx.moveTo(x, -22);
              ctx.lineTo(x + 6, -22);
              ctx.lineTo(x + 2, -6);
              ctx.lineTo(x - 4, -6);
              ctx.closePath();
              ctx.fill();
            }

            ctx.fillStyle = '#475569';
            ctx.fillRect(-24, -6, 6, 10);
            ctx.fillRect(18, -6, 6, 10);

            const blink = Math.sin(time * 0.012) > 0;
            ctx.fillStyle = blink ? '#FEF08A' : '#78350F';
            ctx.beginPath();
            ctx.arc(-22, -26, 4, 0, Math.PI * 2);
            ctx.arc(22, -26, 4, 0, Math.PI * 2);
            ctx.fill();
          } else {
            // HIGH OVERHEAD 4G LASER GANTRY (SLIDE UNDER)
            ctx.fillStyle = '#0F172A';
            ctx.beginPath();
            ctx.roundRect(-34, -56, 68, 22, 4);
            ctx.fill();
            ctx.strokeStyle = '#F59E0B';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.fillStyle = '#FEF08A';
            ctx.font = 'bold 8px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('▼ SLIDE 4G ▼', 0, -42);

            const laserAlpha = 0.55 + Math.sin(time * 0.01) * 0.3;
            ctx.fillStyle = `rgba(239, 68, 68, ${laserAlpha})`;
            ctx.fillRect(-30, -34, 60, 4);

            ctx.fillStyle = '#64748B';
            ctx.fillRect(-32, -34, 5, 38);
            ctx.fillRect(27, -34, 5, 38);
          }

          ctx.restore();
        } else if (entry.kind === 'COIN') {
          const coin = entry.coin;
          const screenX = getLaneXAtZ(coin.lane, coin.z, width, horizonY, playerBaseY);
          const floatY = Math.sin(time * 0.006 + coin.z * 0.15) * 4;
          const screenY = proj.screenY - 18 * scale + floatY;

          ctx.save();
          ctx.translate(screenX, screenY);
          ctx.scale(scale, scale);

          const spinPhase = time * 0.007 + coin.lane * 1.5 + coin.z * 0.08;
          const spin = Math.cos(spinPhase);
          const xRadius = Math.max(1.8, 11 * Math.abs(spin));
          const isBackSide = spin < 0;

          ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
          ctx.beginPath();
          ctx.ellipse(0, 18 - floatY, 12, 4, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = 'rgba(251, 191, 36, 0.24)';
          ctx.beginPath();
          ctx.ellipse(0, 0, xRadius + 3, 14, 0, 0, Math.PI * 2);
          ctx.fill();

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

          if (xRadius > 5) {
            ctx.fillStyle = '#78350F';
            ctx.font = `bold ${Math.round(8 * Math.abs(spin))}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(isBackSide ? '★' : 'N', 0, 0);
          }

          ctx.restore();
        } else {
          const pu = entry.pu;
          const screenX = getLaneXAtZ(pu.lane, pu.z, width, horizonY, playerBaseY);
          const floatY = Math.sin(time * 0.005 + pu.lane) * 5;
          const screenY = proj.screenY - 22 * scale + floatY;

          ctx.save();
          ctx.translate(screenX, screenY);
          ctx.scale(scale, scale);

          if (pu.type === 'SHIELD') {
            ctx.fillStyle = 'rgba(56, 189, 248, 0.22)';
            ctx.beginPath();
            ctx.arc(0, 0, 21, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(56, 189, 248, 0.42)';
            ctx.beginPath();
            ctx.arc(0, 0, 16, 0, Math.PI * 2);
            ctx.fill();
            ctx.font = '16px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🛡️', 0, 0);
          } else if (pu.type === 'MAGNET') {
            ctx.fillStyle = 'rgba(239, 68, 68, 0.22)';
            ctx.beginPath();
            ctx.arc(0, 0, 21, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(239, 68, 68, 0.42)';
            ctx.beginPath();
            ctx.arc(0, 0, 16, 0, Math.PI * 2);
            ctx.fill();
            ctx.font = '16px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🧲', 0, 0);
          } else {
            ctx.fillStyle = 'rgba(245, 158, 11, 0.22)';
            ctx.beginPath();
            ctx.arc(0, 0, 21, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(245, 158, 11, 0.42)';
            ctx.beginPath();
            ctx.arc(0, 0, 16, 0, Math.PI * 2);
            ctx.fill();
            ctx.font = '16px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('⭐', 0, 0);
          }
          ctx.restore();
        }
      });

      // 5. Draw 3D Articulated Parkour Runner Athlete Character
      const pScreenX = getLaneXAtZ(p.lanePos, 0, width, horizonY, playerBaseY);
      const pScreenY = playerBaseY - p.jumpHeight;

      ctx.save();
      ctx.translate(pScreenX, pScreenY);

      // Smooth Banking / Tilting Roll during lane transitions
      const rollAngle = Math.max(-0.24, Math.min(0.24, (p.targetLane - p.lanePos) * 0.25));
      ctx.rotate(rollAngle);

      // Ground Shadow anchored to player ground Y
      const shadowScale = Math.max(0.32, 1 - p.jumpHeight / 120);
      ctx.save();
      ctx.translate(0, p.jumpHeight);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
      ctx.beginPath();
      ctx.ellipse(0, 8, 20 * shadowScale, 6 * shadowScale, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Active 4G Shield Energy Bubble (zero shadowBlur)
      if (p.shield) {
        const shieldR = 28 + Math.sin(time * 0.01) * 2;
        ctx.save();
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.32)';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(0, -22, shieldR + 2, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 2.5;
        ctx.fillStyle = 'rgba(56, 189, 248, 0.22)';
        ctx.beginPath();
        ctx.arc(0, -22, shieldR, 0, Math.PI * 2);
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
      if (isTurbo || worldSpeed > 52) {
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
      fxRef.current.update(dt60);
      fxRef.current.render(ctx);

      ctx.restore();

      frameIdRef.current = requestAnimationFrame(render);
    };

    frameIdRef.current = requestAnimationFrame(render);
    return () => {
      if (frameIdRef.current) cancelAnimationFrame(frameIdRef.current);
    };
  }, []);

  const claimReward = () => {
    if (onClaimReward && rewardAmount > 0) {
      onClaimReward(rewardAmount);
    }
    setShowRewardModal(false);
  };

  return (
    <div className="h-[100dvh] bg-slate-950 text-white flex flex-col overflow-hidden overscroll-none font-sans select-none">
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
      <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain max-w-md mx-auto w-full px-3 py-2 pb-4 flex flex-col items-center justify-between">
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
            <div className="bg-slate-800/90 border border-slate-700/80 px-2.5 py-0.5 rounded-xl text-center min-w-[60px]">
              <span className="text-[8px] text-slate-400 block uppercase font-bold">
                {t('games.runner.distance_label')}
              </span>
              <span className="font-mono font-black text-white text-xs">{distance}m</span>
            </div>
            <div className="bg-amber-950/60 border border-amber-500/40 px-2.5 py-0.5 rounded-xl text-center min-w-[60px]">
              <span className="text-[8px] text-amber-300 block uppercase font-bold">
                {t('games.runner.coins_label')}
              </span>
              <span className="font-mono font-black text-amber-400 text-xs">★ {coins}</span>
            </div>
          </div>
        </div>

        {/* Interactive 3D Canvas Runner Arena with Unified Touch & Drag Swipe */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={() => {
            pointerStartRef.current = null;
          }}
          className="relative w-full aspect-[4/5] max-h-[470px] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border-2 border-amber-500/40 touch-none select-none cursor-pointer"
        >
          <canvas ref={canvasRef} className="w-full h-full block" />

          {/* IDLE Overlay */}
          {gameState === 'IDLE' && (
            <div
              onPointerDown={(e) => e.stopPropagation()}
              className="absolute inset-0 bg-slate-950/75 flex flex-col items-center justify-center p-6 text-center"
            >
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
            <div
              onPointerDown={(e) => e.stopPropagation()}
              className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fade-in z-20"
            >
              <div className="w-14 h-14 rounded-2xl bg-red-600/30 border border-red-500 text-red-400 flex items-center justify-center text-2xl mb-2">
                💥
              </div>
              <h3 className="text-lg font-black text-red-400 mb-1">{t('games.runner.game_over')}</h3>
              <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-700 w-full max-w-[200px] mb-4 space-y-1">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>{t('games.runner.distance_label')}</span>
                  <span className="font-mono font-bold text-white text-sm">{distance}m</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>{t('games.runner.coins_label')}</span>
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

        {/* Sleek Translucent Icon Pads + Subtle Swipe Hint */}
        <div className="w-full max-w-[320px] grid grid-cols-4 gap-2 mt-2">
          <button
            onClick={moveLeft}
            aria-label={t('games.runner.btn_left')}
            className="py-2 bg-slate-900/80 hover:bg-slate-800 active:scale-90 active:bg-amber-500 active:text-slate-950 transition rounded-xl text-amber-400 border border-slate-700/80 shadow-md flex items-center justify-center"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            onClick={jump}
            aria-label={t('games.runner.btn_jump')}
            className="py-2 bg-amber-500/20 hover:bg-amber-500/30 active:scale-90 active:bg-amber-500 active:text-slate-950 transition rounded-xl text-amber-300 border border-amber-400/40 shadow-md flex items-center justify-center"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
          <button
            onClick={slide}
            aria-label={t('games.runner.btn_slide')}
            className="py-2 bg-slate-900/80 hover:bg-slate-800 active:scale-90 active:bg-amber-500 active:text-slate-950 transition rounded-xl text-amber-400 border border-slate-700/80 shadow-md flex items-center justify-center"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
          <button
            onClick={moveRight}
            aria-label={t('games.runner.btn_right')}
            className="py-2 bg-slate-900/80 hover:bg-slate-800 active:scale-90 active:bg-amber-500 active:text-slate-950 transition rounded-xl text-amber-400 border border-slate-700/80 shadow-md flex items-center justify-center"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[11px] text-slate-400 mt-1.5 text-center">{t('games.runner.swipe_hint')}</p>
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
