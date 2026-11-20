import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Heart, Flame } from 'lucide-react';
import { GameSounds } from '../../utils/audio';
import { GameFXSystem } from '../../utils/game-fx';
import { GameHeader } from '../../components/common/GameHeader';
import { GameTutorialModal } from '../../components/common/GameTutorialModal';

export interface FruitSliceGameProps {
  onBack: () => void;
  onClaimReward?: (pointsWon: number) => void;
}

type FruitKind = 'MANGO' | 'COCONUT' | 'PINEAPPLE' | 'WATERMELON' | 'GOLDEN_STAR';

interface SlicedHalf {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  vRot: number;
  type: FruitKind;
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
  type: FruitKind | 'BOMB';
  radius: number;
  isSliced: boolean;
  angle: number;
  vRot: number;
}

interface PendingSpawn {
  dueTime: number;
  x: number;
  targetX: number;
  peakRatio: number;
  kind: FruitKind | 'BOMB';
}

interface JuiceSplatter {
  x: number;
  y: number;
  radius: number;
  color: string;
  alpha: number;
  blobs: { dx: number; dy: number; r: number }[];
}

interface SlashPoint {
  x: number;
  y: number;
  time: number;
}

const FRUIT_TYPES: { type: Exclude<FruitKind, 'GOLDEN_STAR'>; radius: number; juiceColor: string }[] = [
  { type: 'MANGO', radius: 26, juiceColor: '#F59E0B' },
  { type: 'COCONUT', radius: 24, juiceColor: '#F8FAFC' },
  { type: 'PINEAPPLE', radius: 28, juiceColor: '#FBBF24' },
  { type: 'WATERMELON', radius: 27, juiceColor: '#EF4444' },
];

const GRAVITY = 0.16;

function distPointToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - x1, py - y1);
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

export const FruitSliceGame: React.FC<FruitSliceGameProps> = ({ onBack, onClaimReward }) => {
  const { t } = useTranslation();
  const tRef = useRef(t);
  tRef.current = t;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [score, setScore] = useState<number>(0);
  const [lives, setLives] = useState<number>(3);
  const [wave, setWave] = useState<number>(1);
  const [combo, setCombo] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(!GameSounds.isSoundMuted());
  const [showRewardModal, setShowRewardModal] = useState<boolean>(false);
  const [rewardAmount, setRewardAmount] = useState<number>(0);
  const [showTutorial, setShowTutorial] = useState<boolean>(false);

  // Synced refs for zero-teardown 60fps canvas loop
  const isPlayingRef = useRef<boolean>(false);
  const isGameOverRef = useRef<boolean>(false);
  const scoreRef = useRef<number>(0);
  const livesRef = useRef<number>(3);
  const waveRef = useRef<number>(1);
  const wavesInLevelRef = useRef<number>(0);
  const comboRef = useRef<number>(1);
  const canvasSizeRef = useRef<{ width: number; height: number }>({ width: 360, height: 440 });

  const fruitsRef = useRef<FruitItem[]>([]);
  const pendingSpawnsRef = useRef<PendingSpawn[]>([]);
  const slicedHalvesRef = useRef<SlicedHalf[]>([]);
  const splattersRef = useRef<JuiceSplatter[]>([]);
  const slashTrailRef = useRef<SlashPoint[]>([]);
  const fxRef = useRef<GameFXSystem>(new GameFXSystem());
  const isPointerDownRef = useRef<boolean>(false);
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);
  const swipeComboRef = useRef<{ count: number; lastSliceTime: number }>({ count: 0, lastSliceTime: 0 });
  const comboDecayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const frameIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const lastVolleyTimeRef = useRef<number>(0);
  const idCounterRef = useRef<number>(0);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    GameSounds.setMuted(!next);
  };

  const triggerGameOver = useCallback(() => {
    if (isGameOverRef.current) return;
    isGameOverRef.current = true;
    isPlayingRef.current = false;
    setIsGameOver(true);
    setIsPlaying(false);
    pendingSpawnsRef.current = [];
    GameSounds.playLose();
    const finalScore = scoreRef.current;
    if (finalScore >= 50) {
      setRewardAmount(Math.min(180, Math.floor(finalScore / 6)));
      setTimeout(() => setShowRewardModal(true), 550);
    }
  }, []);

  const launchFruitItem = useCallback((kind: FruitKind | 'BOMB', startX: number, targetX: number, peakRatio: number) => {
    const { height } = canvasSizeRef.current;
    const radius =
      kind === 'BOMB'
        ? 24
        : kind === 'GOLDEN_STAR'
        ? 25
        : FRUIT_TYPES.find((f) => f.type === kind)?.radius ?? 25;

    const targetPeakY = height * peakRatio;
    const riseDist = Math.max(120, height + 24 - targetPeakY);
    const vy = -Math.sqrt(2 * GRAVITY * riseDist);
    const airTicks = Math.max(40, Math.abs((2 * vy) / GRAVITY));
    const vx = (targetX - startX) / (airTicks * 0.9);

    fruitsRef.current.push({
      id: ++idCounterRef.current,
      x: startX,
      y: height + 24,
      vx,
      vy,
      type: kind,
      radius,
      isSliced: false,
      angle: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.055,
    });
  }, []);

  const scheduleWaveVolley = useCallback((now: number) => {
    const { width } = canvasSizeRef.current;
    const currentWave = waveRef.current;
    const volleyIdx = wavesInLevelRef.current;
    const isFrenzy = currentWave >= 5 && volleyIdx === 3;

    let fruitCount = 2;
    let bombMax = 0;
    let bombProb = 0.1;

    if (currentWave === 1) {
      fruitCount = 2 + (Math.random() < 0.45 ? 1 : 0);
      bombMax = 0;
      bombProb = 0;
    } else if (currentWave === 2) {
      fruitCount = 3 + (Math.random() < 0.5 ? 1 : 0);
      bombMax = 1;
      bombProb = 0.14;
    } else if (currentWave === 3) {
      fruitCount = 4 + (Math.random() < 0.5 ? 1 : 0);
      bombMax = 1;
      bombProb = 0.18;
    } else if (currentWave === 4) {
      fruitCount = 5 + (Math.random() < 0.5 ? 1 : 0);
      bombMax = 2;
      bombProb = 0.2;
    } else {
      fruitCount = isFrenzy ? 6 + Math.floor(Math.random() * 2) : 5 + Math.floor(Math.random() * 3);
      bombMax = isFrenzy ? 0 : 2;
      bombProb = isFrenzy ? 0 : 0.22;
    }

    if (isFrenzy) {
      fxRef.current.spawnFloatText(width / 2, 76, tRef.current('games.fruit.frenzy_fx'), '#FDE047');
    }

    // Fan-spread launch X positions so fruits arc cleanly across the board
    const useStaggered = currentWave >= 2 && (isFrenzy || Math.random() < 0.55);
    const staggerStep = isFrenzy ? 105 : 140;

    for (let i = 0; i < fruitCount; i++) {
      const slotNorm = fruitCount > 1 ? i / (fruitCount - 1) : 0.5;
      const startX = width * (0.14 + slotNorm * 0.72) + (Math.random() - 0.5) * 24;
      // Converging cross-arc pattern on higher waves for combo slices
      const targetX =
        currentWave >= 3 && i % 2 === 0
          ? width * (0.72 - slotNorm * 0.44)
          : width * (0.22 + slotNorm * 0.56);

      let kind: FruitKind = FRUIT_TYPES[Math.floor(Math.random() * FRUIT_TYPES.length)].type;
      if (currentWave >= 4 && Math.random() < 0.1) {
        kind = 'GOLDEN_STAR';
      }

      pendingSpawnsRef.current.push({
        dueTime: now + (useStaggered ? i * staggerStep : i * 45),
        x: Math.max(36, Math.min(width - 36, startX)),
        targetX: Math.max(48, Math.min(width - 48, targetX)),
        peakRatio: 0.15 + Math.random() * 0.22,
        kind,
      });
    }

    // Spawn bombs horizontally separated from the main fruit cluster
    let bombsSpawned = 0;
    for (let b = 0; b < bombMax; b++) {
      if (Math.random() < bombProb) {
        bombsSpawned++;
        const bombX = b === 0 ? width * (0.16 + Math.random() * 0.22) : width * (0.62 + Math.random() * 0.22);
        pendingSpawnsRef.current.push({
          dueTime: now + 180 + b * 240,
          x: bombX,
          targetX: width * (0.3 + Math.random() * 0.4),
          peakRatio: 0.2 + Math.random() * 0.2,
          kind: 'BOMB',
        });
      }
    }

    // Advance wave every 3 volleys
    wavesInLevelRef.current += 1;
    if (wavesInLevelRef.current >= 3) {
      wavesInLevelRef.current = 0;
      const nextWave = currentWave + 1;
      waveRef.current = nextWave;
      setWave(nextWave);
      const nextCount = Math.min(7, 2 + nextWave);
      setTimeout(() => {
        if (!isGameOverRef.current && isPlayingRef.current) {
          fxRef.current.spawnFloatText(
            width / 2,
            115,
            tRef.current('games.fruit.wave_up_fx', { wave: nextWave, count: nextCount }),
            '#38BDF8'
          );
        }
      }, 350 + bombsSpawned * 10);
    }
  }, []);

  const startGame = useCallback(() => {
    fruitsRef.current = [];
    pendingSpawnsRef.current = [];
    slicedHalvesRef.current = [];
    splattersRef.current = [];
    slashTrailRef.current = [];
    fxRef.current.clear();
    lastTimeRef.current = 0;
    lastVolleyTimeRef.current = 0;
    scoreRef.current = 0;
    livesRef.current = 3;
    waveRef.current = 1;
    wavesInLevelRef.current = 0;
    comboRef.current = 1;
    swipeComboRef.current = { count: 0, lastSliceTime: 0 };

    isGameOverRef.current = false;
    isPlayingRef.current = true;
    setScore(0);
    setLives(3);
    setWave(1);
    setCombo(1);
    setIsGameOver(false);
    setIsPlaying(true);
    setShowRewardModal(false);
    GameSounds.playStart();
  }, []);

  // Main Game Animation Loop with 60 FPS Framerate-Independent Physics
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = canvas.parentElement?.clientWidth || 360;
    const height = Math.min(window.innerHeight - 210, 480);
    canvasSizeRef.current = { width, height };
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Cache static dojo wood backdrop gradients once per setup
    const woodGrad = ctx.createLinearGradient(0, 0, 0, height);
    woodGrad.addColorStop(0, '#1e140d');
    woodGrad.addColorStop(0.5, '#170f0a');
    woodGrad.addColorStop(1, '#100a06');

    const spotlight = ctx.createRadialGradient(width / 2, height * 0.42, 20, width / 2, height * 0.45, width * 0.78);
    spotlight.addColorStop(0, 'rgba(245, 158, 11, 0.07)');
    spotlight.addColorStop(1, 'rgba(0, 0, 0, 0.42)');

    lastTimeRef.current = 0;

    const render = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const dtSec = Math.min(0.05, Math.max(0.001, (time - lastTimeRef.current) / 1000));
      const dt60 = dtSec * 60;
      lastTimeRef.current = time;

      const shake = fxRef.current.getShakeOffset();
      ctx.save();
      ctx.translate(shake.x, shake.y);

      // 1. Rich Warm Dark-Oak Dojo Board Backdrop
      ctx.fillStyle = woodGrad;
      ctx.fillRect(-20, -20, width + 40, height + 40);

      // Horizontal dojo timber planks
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.08)';
      ctx.lineWidth = 1.5;
      for (let y = 56; y < height; y += 56) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      // Subtle radial dojo spotlight vignette
      ctx.fillStyle = spotlight;
      ctx.fillRect(0, 0, width, height);

      // 2. Render & Fade Board Juice Splatters
      const splatters = splattersRef.current;
      for (let i = splatters.length - 1; i >= 0; i--) {
        const sp = splatters[i];
        sp.alpha -= 0.0045 * dt60;
        if (sp.alpha <= 0) {
          splatters.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.globalAlpha = sp.alpha;
        ctx.fillStyle = sp.color;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.radius, 0, Math.PI * 2);
        ctx.fill();
        sp.blobs.forEach((b) => {
          ctx.beginPath();
          ctx.arc(sp.x + b.dx, sp.y + b.dy, b.r, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.restore();
      }

      // 3. Gameplay Simulation
      if (isPlayingRef.current && !isGameOverRef.current) {
        const cadenceMs = Math.max(1550, 1950 - (waveRef.current - 1) * 75);
        if (lastVolleyTimeRef.current === 0 || (time - lastVolleyTimeRef.current > cadenceMs && pendingSpawnsRef.current.length === 0)) {
          lastVolleyTimeRef.current = time;
          scheduleWaveVolley(time);
        }

        // Release due staggered fruits
        for (let i = pendingSpawnsRef.current.length - 1; i >= 0; i--) {
          const item = pendingSpawnsRef.current[i];
          if (time >= item.dueTime) {
            launchFruitItem(item.kind, item.x, item.targetX, item.peakRatio);
            pendingSpawnsRef.current.splice(i, 1);
          }
        }

        const fruits = fruitsRef.current;
        for (let i = fruits.length - 1; i >= 0; i--) {
          const f = fruits[i];
          f.vy += GRAVITY * dt60;
          f.x += f.vx * dt60;
          f.y += f.vy * dt60;
          f.angle += f.vRot * dt60;

          if (f.y > height + 48 && f.vy > 0) {
            if (!f.isSliced && f.type !== 'BOMB' && f.type !== 'GOLDEN_STAR') {
              const nextLives = livesRef.current - 1;
              livesRef.current = nextLives;
              setLives(nextLives);
              fxRef.current.spawnFloatText(
                Math.max(40, Math.min(width - 40, f.x)),
                height - 26,
                tRef.current('games.fruit.missed_fruit_fx'),
                '#F87171'
              );
              GameSounds.playWrong();
              if (nextLives <= 0) {
                triggerGameOver();
              }
            }
            fruits.splice(i, 1);
          }
        }

        // Update Flying Sliced Halves Physics
        const halves = slicedHalvesRef.current;
        for (let i = halves.length - 1; i >= 0; i--) {
          const h = halves[i];
          h.vy += GRAVITY * 1.15 * dt60;
          h.x += h.vx * dt60;
          h.y += h.vy * dt60;
          h.angle += h.vRot * dt60;
          h.alpha -= 0.015 * dt60;

          if (h.y > height + 60 || h.alpha <= 0) {
            halves.splice(i, 1);
          }
        }
      }

      // 4. Draw Flying Sliced Halves (Clean Half-Fruit Cross-Sections)
      slicedHalvesRef.current.forEach((h) => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, h.alpha);
        ctx.translate(h.x, h.y);
        ctx.rotate(h.angle);
        const r = h.radius;
        const startA = h.side === 'LEFT' ? Math.PI * 0.5 : -Math.PI * 0.5;
        const endA = h.side === 'LEFT' ? Math.PI * 1.5 : Math.PI * 0.5;

        if (h.type === 'WATERMELON') {
          ctx.fillStyle = '#15803D';
          ctx.beginPath();
          ctx.arc(0, 0, r, startA, endA);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = '#EF4444';
          ctx.beginPath();
          ctx.arc(0, 0, r * 0.78, startA, endA);
          ctx.closePath();
          ctx.fill();
        } else if (h.type === 'COCONUT') {
          ctx.fillStyle = '#78350F';
          ctx.beginPath();
          ctx.arc(0, 0, r, startA, endA);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = '#F8FAFC';
          ctx.beginPath();
          ctx.arc(0, 0, r * 0.72, startA, endA);
          ctx.closePath();
          ctx.fill();
        } else if (h.type === 'GOLDEN_STAR') {
          ctx.fillStyle = '#FDE047';
          ctx.beginPath();
          ctx.arc(0, 0, r * 0.85, startA, endA);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.fillStyle = h.type === 'MANGO' ? '#F59E0B' : '#FBBF24';
          ctx.beginPath();
          ctx.arc(0, 0, r * 0.92, startA, endA);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = '#FEF08A';
          ctx.beginPath();
          ctx.arc(0, 0, r * 0.65, startA, endA);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      });

      // 5. Draw Unsliced 3D Vector Fruits & Bombs
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
          ctx.ellipse(0, 0, r, r * 0.78, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#15803D';
          ctx.beginPath();
          ctx.ellipse(-r * 0.65, -r * 0.5, r * 0.35, r * 0.16, -Math.PI / 4, 0, Math.PI * 2);
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
          // Stripes
          ctx.strokeStyle = '#052e16';
          ctx.lineWidth = 2.5;
          for (const offset of [-0.45, 0, 0.45]) {
            ctx.beginPath();
            ctx.arc(offset * r, 0, r * 0.72, -Math.PI * 0.35, Math.PI * 0.35);
            ctx.stroke();
          }
        } else if (f.type === 'PINEAPPLE') {
          const pineGrad = ctx.createLinearGradient(-r, -r, r, r);
          pineGrad.addColorStop(0, '#FEF08A');
          pineGrad.addColorStop(0.6, '#F59E0B');
          pineGrad.addColorStop(1, '#B45309');
          ctx.fillStyle = pineGrad;
          ctx.beginPath();
          ctx.ellipse(0, 4, r * 0.72, r * 0.95, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#16A34A';
          ctx.beginPath();
          ctx.moveTo(-r * 0.5, -r * 0.55);
          ctx.lineTo(0, -r * 1.25);
          ctx.lineTo(r * 0.5, -r * 0.55);
          ctx.fill();
        } else if (f.type === 'GOLDEN_STAR') {
          ctx.fillStyle = 'rgba(253, 224, 71, 0.22)';
          ctx.beginPath();
          ctx.arc(0, 0, r * 1.25, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#FACC15';
          ctx.beginPath();
          for (let p = 0; p < 5; p++) {
            const outerA = (p * Math.PI * 2) / 5 - Math.PI / 2;
            const innerA = outerA + Math.PI / 5;
            const ox = Math.cos(outerA) * r;
            const oy = Math.sin(outerA) * r;
            const ix = Math.cos(innerA) * (r * 0.46);
            const iy = Math.sin(innerA) * (r * 0.46);
            if (p === 0) ctx.moveTo(ox, oy);
            else ctx.lineTo(ox, oy);
            ctx.lineTo(ix, iy);
          }
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        } else if (f.type === 'BOMB') {
          const bombGrad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 2, 0, 0, r);
          bombGrad.addColorStop(0, '#64748B');
          bombGrad.addColorStop(0.5, '#1E293B');
          bombGrad.addColorStop(1, '#020617');
          ctx.fillStyle = bombGrad;
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#EF4444';
          ctx.lineWidth = 2.5;
          ctx.stroke();
          // Danger X mark
          ctx.strokeStyle = '#FCA5A5';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(-7, -7);
          ctx.lineTo(7, 7);
          ctx.moveTo(7, -7);
          ctx.lineTo(-7, 7);
          ctx.stroke();
          // Sizzling fuse
          ctx.strokeStyle = '#EA580C';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(0, -r);
          ctx.quadraticCurveTo(8, -r - 10, 14, -r - 6);
          ctx.stroke();
          const sparkR = 4 + Math.sin(time * 0.02) * 2;
          ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
          ctx.beginPath();
          ctx.arc(14, -r - 6, sparkR + 3.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#FDE047';
          ctx.beginPath();
          ctx.arc(14, -r - 6, sparkR, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });

      // 6. Update and Render Particles & Floating Text FX
      fxRef.current.update(dt60);
      fxRef.current.render(ctx);

      // 7. Draw Multi-Layer Luminous Golden Blade Slash Trail (double-stroke halo avoids shadowBlur)
      const now = Date.now();
      slashTrailRef.current = slashTrailRef.current.filter((pt) => now - pt.time < 170);

      if (slashTrailRef.current.length > 1) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(slashTrailRef.current[0].x, slashTrailRef.current[0].y);
        for (let i = 1; i < slashTrailRef.current.length; i++) {
          ctx.lineTo(slashTrailRef.current[i].x, slashTrailRef.current[i].y);
        }
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.25)';
        ctx.lineWidth = 13;
        ctx.stroke();
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.65)';
        ctx.lineWidth = 7;
        ctx.stroke();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }

      ctx.restore();

      frameIdRef.current = requestAnimationFrame(render);
    };

    frameIdRef.current = requestAnimationFrame(render);
    return () => {
      if (frameIdRef.current) cancelAnimationFrame(frameIdRef.current);
      if (comboDecayTimerRef.current) clearTimeout(comboDecayTimerRef.current);
    };
  }, [launchFruitItem, scheduleWaveVolley, triggerGameOver]);

  const checkSliceSegment = (x1: number, y1: number, x2: number, y2: number) => {
    slashTrailRef.current.push({ x: x2, y: y2, time: Date.now() });
    if (!isPlayingRef.current || isGameOverRef.current) return;

    const now = Date.now();
    let slicedFruitsCount = 0;

    fruitsRef.current.forEach((f) => {
      if (!f.isSliced) {
        const dist = distPointToSegment(f.x, f.y, x1, y1, x2, y2);
        if (dist < f.radius * 1.38) {
          f.isSliced = true;
          if (f.type === 'BOMB') {
            fxRef.current.spawnConfettiExplosion(f.x, f.y, 30);
            fxRef.current.spawnSparkles(f.x, f.y, 28, '#EF4444');
            fxRef.current.addScreenShake(0.95);
            const nextLives = livesRef.current - 1;
            livesRef.current = nextLives;
            setLives(nextLives);
            swipeComboRef.current = { count: 0, lastSliceTime: 0 };
            comboRef.current = 1;
            setCombo(1);
            if (nextLives <= 0) {
              triggerGameOver();
            } else {
              GameSounds.playTowerCrash();
            }
          } else {
            GameSounds.playScratch();
            slicedFruitsCount++;

            if (now - swipeComboRef.current.lastSliceTime <= 240) {
              swipeComboRef.current.count += 1;
            } else {
              swipeComboRef.current.count = 1;
            }
            swipeComboRef.current.lastSliceTime = now;

            const activeMultiplier = swipeComboRef.current.count >= 3 ? Math.min(5, swipeComboRef.current.count - 1) : 1;
            comboRef.current = activeMultiplier;
            setCombo(activeMultiplier);
            if (comboDecayTimerRef.current) clearTimeout(comboDecayTimerRef.current);
            comboDecayTimerRef.current = setTimeout(() => {
              comboRef.current = 1;
              setCombo(1);
            }, 1200);

            const basePts = f.type === 'GOLDEN_STAR' ? 60 : 20;
            const pointsGain = basePts * activeMultiplier;
            scoreRef.current += pointsGain;
            setScore(scoreRef.current);

            const juiceColor =
              f.type === 'MANGO'
                ? '#F59E0B'
                : f.type === 'COCONUT'
                ? '#F8FAFC'
                : f.type === 'WATERMELON'
                ? '#EF4444'
                : '#FACC15';

            // Paint fading splatter stain on wooden board
            splattersRef.current.push({
              x: f.x,
              y: f.y,
              radius: 18 + Math.random() * 8,
              color: juiceColor,
              alpha: 0.28,
              blobs: Array.from({ length: 4 }, () => {
                const a = Math.random() * Math.PI * 2;
                const d = 16 + Math.random() * 14;
                return { dx: Math.cos(a) * d, dy: Math.sin(a) * d, r: 4 + Math.random() * 5 };
              }),
            });

            fxRef.current.spawnJuiceSplash(f.x, f.y, 16, juiceColor);
            fxRef.current.spawnSparkles(f.x, f.y, f.type === 'GOLDEN_STAR' ? 18 : 8, '#FEF08A');
            fxRef.current.spawnFloatText(f.x, f.y - 15, `+${pointsGain}`, '#FDE047');
            fxRef.current.addScreenShake(0.2);

            if (swipeComboRef.current.count >= 3) {
              const comboBonus = swipeComboRef.current.count * 15;
              scoreRef.current += comboBonus;
              setScore(scoreRef.current);
              fxRef.current.spawnFloatText(
                f.x,
                f.y - 36,
                `${swipeComboRef.current.count}x COMBO +${comboBonus}! 🔥`,
                '#F43F5E'
              );
              fxRef.current.addScreenShake(0.35);
              GameSounds.playCorrect();
            }

            slicedHalvesRef.current.push(
              {
                x: f.x - 4,
                y: f.y,
                vx: f.vx - 2.6,
                vy: f.vy - 1.5,
                angle: f.angle,
                vRot: -0.1,
                type: f.type,
                side: 'LEFT',
                radius: f.radius,
                alpha: 1,
              },
              {
                x: f.x + 4,
                y: f.y,
                vx: f.vx + 2.6,
                vy: f.vy - 1.5,
                angle: f.angle,
                vRot: 0.1,
                type: f.type,
                side: 'RIGHT',
                radius: f.radius,
                alpha: 1,
              }
            );
          }
        }
      }
    });

    if (slicedFruitsCount > 0 && comboRef.current > 1) {
      GameSounds.playTap();
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isPointerDownRef.current = true;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      lastPointerRef.current = { x, y };
      checkSliceSegment(x, y, x, y);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDownRef.current) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const prev = lastPointerRef.current || { x, y };
      lastPointerRef.current = { x, y };
      checkSliceSegment(prev.x, prev.y, x, y);
    }
  };

  const handlePointerUp = () => {
    isPointerDownRef.current = false;
    lastPointerRef.current = null;
  };

  const claimReward = () => {
    if (onClaimReward && rewardAmount > 0) {
      onClaimReward(rewardAmount);
    }
    setShowRewardModal(false);
  };

  return (
    <div className="h-[100dvh] bg-slate-950 text-white flex flex-col overflow-hidden overscroll-none font-sans select-none">
      <GameHeader
        title={t('games.fruit.title')}
        subtitle={combo > 1 ? t('games.fruit.combo', { combo }) : t('games.fruit.wave_label', { wave })}
        onBack={onBack}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
        onRestart={startGame}
        restartTooltip={t('games.fruit.btn_play_again')}
        onHelp={() => setShowTutorial(true)}
      />

      {/* ── MAIN STAGE ── */}
      <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain max-w-md mx-auto w-full px-3 py-3 pb-4 flex flex-col items-center justify-center gap-3">
        {/* Score, Wave & Lives HUD */}
        <div className="w-full flex items-center justify-between gap-2 bg-slate-900/80 border border-slate-800/90 rounded-2xl px-3.5 py-2 shadow-lg">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {[1, 2, 3].map((i) => (
                <Heart key={i} className={`w-4 h-4 transition-transform ${i <= lives ? 'text-red-500 fill-red-500 scale-100' : 'text-slate-700 scale-90'}`} />
              ))}
            </div>
            <span className="text-[10px] font-black text-sky-300 bg-sky-500/15 border border-sky-400/35 px-2 py-0.5 rounded-full uppercase">
              {t('games.fruit.wave_label', { wave })}
            </span>
            {combo > 1 && (
              <span className="text-[10px] font-black text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-400/40 animate-pulse font-mono flex items-center gap-0.5">
                <Flame className="w-3 h-3 text-amber-400" />
                {combo}x
              </span>
            )}
          </div>

          <div className="bg-slate-800/90 border border-slate-700/80 px-3 py-1 rounded-xl text-center min-w-[74px]">
            <span className="text-[9px] text-slate-400 block uppercase font-bold tracking-wider">
              {t('games.fruit.score_label')}
            </span>
            <span className="font-mono font-black text-amber-400 text-sm">{score}</span>
          </div>
        </div>

        {/* Canvas Fruit Ninja Arena */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className="relative w-full aspect-[4/5] max-h-[480px] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border-2 border-amber-500/40 touch-none select-none cursor-crosshair"
        >
          <canvas ref={canvasRef} className="w-full h-full block" />

          {/* Start Screen Overlay */}
          {!isPlaying && !isGameOver && (
            <div
              onPointerDown={(e) => e.stopPropagation()}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center"
            >
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
            <div
              onPointerDown={(e) => e.stopPropagation()}
              className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fade-in z-20"
            >
              <div className="w-14 h-14 rounded-2xl bg-red-600/30 border border-red-500 text-red-400 flex items-center justify-center text-2xl mb-2">
                💥
              </div>
              <h3 className="text-lg font-black text-red-400 mb-1">{t('games.fruit.game_over')}</h3>
              <p className="text-xs text-slate-300 mb-4">
                {t('games.fruit.score', { score })} • {t('games.fruit.wave_label', { wave })}
              </p>
              <button
                onClick={startGame}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black rounded-xl text-sm shadow-lg active:scale-95 transition"
              >
                {t('games.fruit.btn_play_again')}
              </button>
            </div>
          )}
        </div>

        <p className="text-[11px] text-slate-400 text-center max-w-xs">{t('games.fruit.subtitle')}</p>
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
