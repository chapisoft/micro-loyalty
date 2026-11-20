import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Flame, ShoppingBag, Sparkles, Clock } from 'lucide-react';
import { soundHaptics } from '../../utils/soundHaptics';
import { GameSounds } from '../../utils/audio';
import { GameFXSystem } from '../../utils/game-fx';
import { GameHeader } from '../../components/common/GameHeader';
import { GameTutorialModal } from '../../components/common/GameTutorialModal';

export interface GoldMinerGameProps {
  onBack: () => void;
  onClaimReward?: (pointsWon: number) => void;
}

export type MineItemKind =
  | 'GOLD_L'
  | 'GOLD_M'
  | 'GOLD_S'
  | 'DIAMOND'
  | 'ROCK_L'
  | 'ROCK_S'
  | 'MYSTERY_BAG'
  | 'TNT_BARREL'
  | 'MOLE'
  | 'DIAMOND_MOLE';

export interface MineItem {
  id: number;
  kind: MineItemKind;
  x: number;
  y: number;
  radius: number;
  weight: number;
  value: number;
  vx?: number;
  minX?: number;
  maxX?: number;
  seed: number;
}

export interface GoldMinerStageConfig {
  stage: number;
  targetDelta: number;
  timeSec: number;
  goldL: number;
  goldM: number;
  goldS: number;
  diamonds: number;
  rockL: number;
  rockS: number;
  bags: number;
  tnts: number;
  moles: number;
  diamondMoles: number;
}

export interface ShopBuffs {
  strength: boolean;
  diamondPolish: boolean;
  luckyClover: boolean;
  rockBook: boolean;
}

type HookPhase = 'SWINGING' | 'EXTENDING' | 'RETRACTING';
type MinerPlayState = 'IDLE' | 'PLAYING' | 'SHOP' | 'GAMEOVER';

interface ShopOffer {
  id: 'DYNAMITE' | 'STRENGTH' | 'DIAMOND' | 'CLOVER' | 'ROCKBOOK';
  icon: string;
  titleKey: string;
  descKey: string;
  cost: number;
}

export function getGoldMinerStageConfig(stage: number): GoldMinerStageConfig {
  if (stage === 1) {
    return {
      stage: 1,
      targetDelta: 450,
      timeSec: 30,
      goldL: 2,
      goldM: 3,
      goldS: 4,
      diamonds: 0,
      rockL: 1,
      rockS: 2,
      bags: 1,
      tnts: 0,
      moles: 0,
      diamondMoles: 0,
    };
  }
  if (stage === 2) {
    return {
      stage: 2,
      targetDelta: 600,
      timeSec: 28,
      goldL: 2,
      goldM: 3,
      goldS: 3,
      diamonds: 1,
      rockL: 2,
      rockS: 3,
      bags: 2,
      tnts: 0,
      moles: 0,
      diamondMoles: 0,
    };
  }
  if (stage === 3) {
    return {
      stage: 3,
      targetDelta: 750,
      timeSec: 26,
      goldL: 2,
      goldM: 3,
      goldS: 2,
      diamonds: 2,
      rockL: 2,
      rockS: 3,
      bags: 2,
      tnts: 2,
      moles: 1,
      diamondMoles: 0,
    };
  }
  if (stage === 4) {
    return {
      stage: 4,
      targetDelta: 900,
      timeSec: 24,
      goldL: 2,
      goldM: 2,
      goldS: 2,
      diamonds: 2,
      rockL: 3,
      rockS: 4,
      bags: 2,
      tnts: 2,
      moles: 2,
      diamondMoles: 1,
    };
  }
  const extra = stage - 5;
  return {
    stage,
    targetDelta: Math.min(2500, 1050 + extra * 180),
    timeSec: Math.max(20, 24 - Math.floor(extra / 2)),
    goldL: Math.min(4, 2 + Math.floor(extra / 2)),
    goldM: 3,
    goldS: 2,
    diamonds: Math.min(4, 2 + Math.floor(extra / 2)),
    rockL: Math.min(5, 3 + Math.floor(extra / 2)),
    rockS: Math.min(6, 4 + Math.floor(extra / 2)),
    bags: 2,
    tnts: Math.min(5, 2 + Math.floor(extra / 2)),
    moles: Math.min(4, 2 + Math.floor(extra / 2)),
    diamondMoles: Math.min(3, 1 + Math.floor(extra / 2)),
  };
}

function getItemSpec(kind: MineItemKind): { radius: number; weight: number; value: number; deepBias: boolean } {
  switch (kind) {
    case 'GOLD_L':
      return { radius: 24, weight: 4.5, value: 500, deepBias: true };
    case 'GOLD_M':
      return { radius: 17, weight: 2.35, value: 250, deepBias: false };
    case 'GOLD_S':
      return { radius: 12, weight: 1.25, value: 50, deepBias: false };
    case 'DIAMOND':
      return { radius: 11, weight: 1.0, value: 650, deepBias: true };
    case 'ROCK_L':
      return { radius: 24, weight: 5.4, value: 20, deepBias: true };
    case 'ROCK_S':
      return { radius: 16, weight: 2.9, value: 11, deepBias: false };
    case 'MYSTERY_BAG':
      return { radius: 15, weight: 1.6, value: 0, deepBias: false };
    case 'TNT_BARREL':
      return { radius: 17, weight: 1.0, value: 0, deepBias: false };
    case 'MOLE':
      return { radius: 15, weight: 1.1, value: 5, deepBias: false };
    case 'DIAMOND_MOLE':
      return { radius: 15, weight: 1.15, value: 750, deepBias: true };
  }
}

export function generateMinerStageItems(stage: number, width: number, height: number): MineItem[] {
  const cfg = getGoldMinerStageConfig(stage);
  const specs: MineItemKind[] = [];

  for (let i = 0; i < cfg.rockL; i++) specs.push('ROCK_L');
  for (let i = 0; i < cfg.goldL; i++) specs.push('GOLD_L');
  for (let i = 0; i < cfg.tnts; i++) specs.push('TNT_BARREL');
  for (let i = 0; i < cfg.goldM; i++) specs.push('GOLD_M');
  for (let i = 0; i < cfg.rockS; i++) specs.push('ROCK_S');
  for (let i = 0; i < cfg.bags; i++) specs.push('MYSTERY_BAG');
  for (let i = 0; i < cfg.diamondMoles; i++) specs.push('DIAMOND_MOLE');
  for (let i = 0; i < cfg.moles; i++) specs.push('MOLE');
  for (let i = 0; i < cfg.goldS; i++) specs.push('GOLD_S');
  for (let i = 0; i < cfg.diamonds; i++) specs.push('DIAMOND');

  const padX = 16;
  const minYBase = 148;
  const maxYBase = Math.max(260, height - 26);
  const placed: MineItem[] = [];
  let nextId = 1;

  for (const kind of specs) {
    const info = getItemSpec(kind);
    const r = info.radius;
    const minX = padX + r;
    const maxX = Math.max(minX + 10, width - padX - r);
    const minY = info.deepBias ? minYBase + (maxYBase - minYBase) * 0.32 + r : minYBase + r;
    const maxY = Math.max(minY + 12, maxYBase - r);

    let chosenX = (minX + maxX) / 2;
    let chosenY = (minY + maxY) / 2;
    let found = false;

    for (let attempt = 0; attempt < 260; attempt++) {
      const cx = minX + Math.random() * (maxX - minX);
      const cy = minY + Math.random() * (maxY - minY);
      const ok = placed.every((other) => Math.hypot(cx - other.x, cy - other.y) >= r + other.radius + 8);
      if (ok) {
        chosenX = cx;
        chosenY = cy;
        found = true;
        break;
      }
    }

    if (!found) {
      let bestMinClearance = -Infinity;
      const cols = 8;
      const rows = 6;
      for (let gx = 0; gx <= cols; gx++) {
        for (let gy = 0; gy <= rows; gy++) {
          const cx = minX + (gx / cols) * (maxX - minX);
          const cy = minYBase + r + (gy / rows) * Math.max(12, maxYBase - minYBase - r * 2);
          let minClearance = Infinity;
          for (const other of placed) {
            const c = Math.hypot(cx - other.x, cy - other.y) - (r + other.radius);
            if (c < minClearance) minClearance = c;
          }
          if (minClearance > bestMinClearance) {
            bestMinClearance = minClearance;
            chosenX = cx;
            chosenY = cy;
          }
        }
      }
    }

    const isMole = kind === 'MOLE' || kind === 'DIAMOND_MOLE';
    const patrolHalf = 68;
    const laneMinX = Math.max(minX, chosenX - patrolHalf);
    const laneMaxX = Math.min(maxX, chosenX + patrolHalf);

    placed.push({
      id: nextId++,
      kind,
      x: chosenX,
      y: chosenY,
      radius: r,
      weight: info.weight,
      value: info.value,
      vx: isMole ? (Math.random() < 0.5 ? 1 : -1) * (52 + stage * 8 + Math.random() * 26) : undefined,
      minX: isMole ? laneMinX : undefined,
      maxX: isMole ? laneMaxX : undefined,
      seed: Math.random() * Math.PI * 2,
    });
  }

  return placed;
}

const DEFAULT_BUFFS: ShopBuffs = {
  strength: false,
  diamondPolish: false,
  luckyClover: false,
  rockBook: false,
};

function isValuableItem(kind: MineItemKind): boolean {
  return (
    kind === 'GOLD_L' ||
    kind === 'GOLD_M' ||
    kind === 'GOLD_S' ||
    kind === 'DIAMOND' ||
    kind === 'MYSTERY_BAG' ||
    kind === 'DIAMOND_MOLE'
  );
}

export const GoldMinerGame: React.FC<GoldMinerGameProps> = ({ onBack, onClaimReward }) => {
  const { t } = useTranslation();
  const tRef = useRef(t);
  tRef.current = t;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const arenaRef = useRef<HTMLDivElement | null>(null);

  const [stage, setStage] = useState<number>(1);
  const [cash, setCash] = useState<number>(0);
  const [stageGoal, setStageGoal] = useState<number>(650);
  const [timeLeft, setTimeLeft] = useState<number>(55);
  const [dynamiteCount, setDynamiteCount] = useState<number>(1);
  const [buffs, setBuffs] = useState<ShopBuffs>(DEFAULT_BUFFS);
  const [playState, setPlayState] = useState<MinerPlayState>('IDLE');
  const [isReelingHeavy, setIsReelingHeavy] = useState<boolean>(false);
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('goldminer_best_cash') || 0);
    } catch {
      return 0;
    }
  });
  const [soundEnabled, setSoundEnabled] = useState<boolean>(!GameSounds.isSoundMuted());
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  const [rewardAmount, setRewardAmount] = useState<number>(0);
  const [shopOffers, setShopOffers] = useState<ShopOffer[]>([]);
  const [boughtThisShop, setBoughtThisShop] = useState<Set<string>>(new Set());

  // Mutable 60fps simulation refs (zero React frame churn)
  const playStateRef = useRef<MinerPlayState>('IDLE');
  const stageRef = useRef<number>(1);
  const cashRef = useRef<number>(0);
  const stageGoalRef = useRef<number>(650);
  const timeLeftRef = useRef<number>(55);
  const lastShownTimeRef = useRef<number>(55);
  const dynamiteRef = useRef<number>(1);
  const buffsRef = useRef<ShopBuffs>({ ...DEFAULT_BUFFS });
  const highScoreRef = useRef<number>(highScore);
  highScoreRef.current = highScore;

  const itemsRef = useRef<MineItem[]>([]);
  const hookRef = useRef<{
    phase: HookPhase;
    angle: number;
    swingPhase: number;
    length: number;
    grabbedItem: MineItem | null;
  }>({
    phase: 'SWINGING',
    angle: 0,
    swingPhase: 0,
    length: 34,
    grabbedItem: null,
  });

  const minerFaceRef = useRef<{ mood: 'NORMAL' | 'STRAIN' | 'HAPPY'; until: number }>({
    mood: 'NORMAL',
    until: 0,
  });

  const fxRef = useRef<GameFXSystem>(new GameFXSystem());
  const frameIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const canvasSizeRef = useRef<{ width: number; height: number }>({ width: 360, height: 420 });

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    GameSounds.setMuted(!next);
  };

  const buildShopOffers = useCallback((nextStageNum: number): ShopOffer[] => {
    const dynCost = 120 + Math.min(100, (nextStageNum - 2) * 20);
    const strCost = 180 + Math.min(120, (nextStageNum - 2) * 25);
    const pool: ShopOffer[] = [
      {
        id: 'DYNAMITE',
        icon: '🧨',
        titleKey: 'games.goldminer.shop_dynamite',
        descKey: 'games.goldminer.shop_dynamite_desc',
        cost: dynCost,
      },
      {
        id: 'STRENGTH',
        icon: '💪',
        titleKey: 'games.goldminer.shop_strength',
        descKey: 'games.goldminer.shop_strength_desc',
        cost: strCost,
      },
      {
        id: 'DIAMOND',
        icon: '💎',
        titleKey: 'games.goldminer.shop_diamond',
        descKey: 'games.goldminer.shop_diamond_desc',
        cost: 240,
      },
      {
        id: 'CLOVER',
        icon: '🍀',
        titleKey: 'games.goldminer.shop_clover',
        descKey: 'games.goldminer.shop_clover_desc',
        cost: 150,
      },
      {
        id: 'ROCKBOOK',
        icon: '📘',
        titleKey: 'games.goldminer.shop_rockbook',
        descKey: 'games.goldminer.shop_rockbook_desc',
        cost: 120,
      },
    ];
    // Always offer Dynamite + Strength, plus 2 rotating specialty buffs
    const rotated = [pool[0], pool[1]];
    const specials = pool.slice(2);
    const offset = nextStageNum % specials.length;
    rotated.push(specials[offset], specials[(offset + 1) % specials.length]);
    return rotated;
  }, []);

  const setupStage = useCallback((targetStage: number, startingCash: number, nextBuffs: ShopBuffs, dynCount: number, startActive: boolean) => {
    const cfg = getGoldMinerStageConfig(targetStage);
    const { width, height } = canvasSizeRef.current;
    const items = generateMinerStageItems(targetStage, width, height);

    stageRef.current = targetStage;
    cashRef.current = startingCash;
    stageGoalRef.current = startingCash + cfg.targetDelta;
    timeLeftRef.current = cfg.timeSec;
    lastShownTimeRef.current = cfg.timeSec;
    dynamiteRef.current = dynCount;
    buffsRef.current = { ...nextBuffs };
    itemsRef.current = items;
    hookRef.current = {
      phase: 'SWINGING',
      angle: 0,
      swingPhase: 0,
      length: 34,
      grabbedItem: null,
    };
    minerFaceRef.current = { mood: 'NORMAL', until: 0 };
    fxRef.current.clear();
    lastTimeRef.current = 0;

    setStage(targetStage);
    setCash(startingCash);
    setStageGoal(startingCash + cfg.targetDelta);
    setTimeLeft(cfg.timeSec);
    setDynamiteCount(dynCount);
    setBuffs({ ...nextBuffs });
    setIsReelingHeavy(false);

    const nextState: MinerPlayState = startActive ? 'PLAYING' : 'IDLE';
    playStateRef.current = nextState;
    setPlayState(nextState);
  }, []);

  const startFreshRun = useCallback(() => {
    setupStage(1, 0, { ...DEFAULT_BUFFS }, 1, true);
    setBoughtThisShop(new Set());
    setRewardAmount(0);
    GameSounds.playStart();
  }, [setupStage]);

  const finishStageEarlyOrTimeout = useCallback(() => {
    if (playStateRef.current !== 'PLAYING') return;
    hookRef.current.grabbedItem = null;
    hookRef.current.phase = 'SWINGING';
    hookRef.current.length = 34;
    setIsReelingHeavy(false);

    // Bonus $5 for each leftover second when board cleared early
    const secLeft = Math.floor(Math.max(0, timeLeftRef.current));
    if (secLeft > 0) {
      cashRef.current += secLeft * 5;
      setCash(cashRef.current);
    }

    if (cashRef.current > highScoreRef.current) {
      highScoreRef.current = cashRef.current;
      setHighScore(cashRef.current);
      try {
        localStorage.setItem('goldminer_best_cash', String(cashRef.current));
      } catch {
        /* ignore storage errors */
      }
    }

    if (cashRef.current >= stageGoalRef.current) {
      playStateRef.current = 'SHOP';
      setPlayState('SHOP');
      setShopOffers(buildShopOffers(stageRef.current + 1));
      setBoughtThisShop(new Set());
      setBuffs({ ...DEFAULT_BUFFS });
      buffsRef.current = { ...DEFAULT_BUFFS };
      const pts = Math.min(250, Math.round(stageRef.current * 35 + cashRef.current * 0.04));
      setRewardAmount(pts);
      GameSounds.playWinFanfare();
    } else {
      playStateRef.current = 'GAMEOVER';
      setPlayState('GAMEOVER');
      const pts = cashRef.current >= 300 ? Math.min(200, Math.round(cashRef.current * 0.05)) : 0;
      setRewardAmount(pts);
      GameSounds.playLose();
    }
  }, [buildShopOffers]);

  const launchHook = useCallback(() => {
    if (playStateRef.current === 'IDLE') {
      playStateRef.current = 'PLAYING';
      setPlayState('PLAYING');
      lastTimeRef.current = 0;
      GameSounds.playStart();
    }
    if (playStateRef.current !== 'PLAYING') return;
    if (hookRef.current.phase !== 'SWINGING') return;
    hookRef.current.phase = 'EXTENDING';
    soundHaptics.playClick();
    GameSounds.playTap();
  }, []);

  const triggerDynamite = useCallback(() => {
    if (playStateRef.current !== 'PLAYING') return;
    const h = hookRef.current;
    if (h.phase !== 'RETRACTING' || !h.grabbedItem || dynamiteRef.current <= 0) return;

    const { width } = canvasSizeRef.current;
    const pivotX = width / 2;
    const pivotY = 78;
    const tipX = pivotX + Math.sin(h.angle) * h.length;
    const tipY = pivotY + Math.cos(h.angle) * h.length;

    dynamiteRef.current -= 1;
    setDynamiteCount(dynamiteRef.current);
    h.grabbedItem = null;
    setIsReelingHeavy(false);

    fxRef.current.spawnSparkles(tipX, tipY, 22, '#F97316');
    fxRef.current.spawnFloatText(tipX, tipY - 12, tRef.current('games.goldminer.fx_dynamite'), '#F97316');
    fxRef.current.addScreenShake(0.6);
    GameSounds.playTowerCrash();
  }, []);

  // Keyboard shortcuts (Space/ArrowDown = fire, ArrowUp/D = dynamite)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        launchHook();
      } else if (e.key === 'ArrowUp' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        triggerDynamite();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [launchHook, triggerDynamite]);

  // Initial mount stage seeding & single-mount 60fps loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = canvas.parentElement?.clientWidth || 360;
    const height = Math.max(330, Math.min(window.innerHeight - 235, Math.round(width * 1.15)));
    canvasSizeRef.current = { width, height };
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    if (arenaRef.current) {
      arenaRef.current.style.height = `${height}px`;
    }
    ctx.scale(dpr, dpr);

    // Seed initial Stage 1 items cleanly with measured canvas dimensions
    setupStage(1, 0, { ...DEFAULT_BUFFS }, 1, false);

    // Cache static mine gradients once outside 60fps loop
    const pivotX = width / 2;
    const pivotY = 78;
    const groundY = 92;

    const skyGrad = ctx.createLinearGradient(0, 0, 0, groundY);
    skyGrad.addColorStop(0, '#1e1b4b');
    skyGrad.addColorStop(0.55, '#7c2d12');
    skyGrad.addColorStop(1, '#d97706');

    const earthGrad = ctx.createLinearGradient(0, groundY, 0, height);
    earthGrad.addColorStop(0, '#78350f');
    earthGrad.addColorStop(0.28, '#5c280b');
    earthGrad.addColorStop(0.7, '#3b1806');
    earthGrad.addColorStop(1, '#1e0b03');

    const pebbles = Array.from({ length: 42 }, (_, i) => ({
      x: ((i * 89 + 29) % (width - 20)) + 10,
      y: groundY + 18 + ((i * 61 + 17) % Math.max(80, height - groundY - 30)),
      r: 1.4 + (i % 3) * 0.9,
      alpha: 0.14 + (i % 4) * 0.04,
    }));

    const drawGoldNugget = (x: number, y: number, r: number, seed: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((seed % 1.2) - 0.6);
      ctx.beginPath();
      const verts = 7;
      for (let i = 0; i < verts; i++) {
        const a = (i * Math.PI * 2) / verts;
        const wobble = 0.84 + 0.22 * Math.sin(seed * 3 + i * 2.1);
        const px = Math.cos(a) * r * wobble;
        const py = Math.sin(a) * r * wobble;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = '#F59E0B';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#FEF08A';
      ctx.stroke();
      // Facet glint
      ctx.fillStyle = '#FFFBEB';
      ctx.beginPath();
      ctx.ellipse(-r * 0.28, -r * 0.28, r * 0.34, r * 0.18, -0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const drawDiamond = (x: number, y: number, r: number, time: number) => {
      ctx.save();
      ctx.translate(x, y);
      // Lightweight halo (zero shadowBlur)
      ctx.fillStyle = 'rgba(56, 189, 248, 0.22)';
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.45, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(-r * 0.65, -r * 0.45);
      ctx.lineTo(r * 0.65, -r * 0.45);
      ctx.lineTo(r * 1.0, 0);
      ctx.lineTo(0, r * 1.05);
      ctx.lineTo(-r * 1.0, 0);
      ctx.closePath();
      ctx.fillStyle = '#38BDF8';
      ctx.fill();
      ctx.strokeStyle = '#E0F2FE';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      ctx.fillStyle = '#BAE6FD';
      ctx.beginPath();
      ctx.moveTo(-r * 0.4, -r * 0.4);
      ctx.lineTo(r * 0.2, -r * 0.4);
      ctx.lineTo(0, r * 0.2);
      ctx.closePath();
      ctx.fill();

      if (Math.sin(time * 0.008 + x) > 0.35) {
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(-r * 0.9, -r * 0.9);
        ctx.lineTo(-r * 0.5, -r * 0.9);
        ctx.moveTo(-r * 0.7, -r * 1.1);
        ctx.lineTo(-r * 0.7, -r * 0.7);
        ctx.stroke();
      }
      ctx.restore();
    };

    const drawRock = (x: number, y: number, r: number, seed: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(seed);
      ctx.beginPath();
      const sides = 6;
      for (let i = 0; i < sides; i++) {
        const a = (i * Math.PI * 2) / sides;
        const wob = 0.8 + 0.22 * Math.cos(seed + i * 1.9);
        const px = Math.cos(a) * r * wob;
        const py = Math.sin(a) * r * wob;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = '#64748B';
      ctx.fill();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2.2;
      ctx.stroke();

      ctx.fillStyle = '#94A3B8';
      ctx.beginPath();
      ctx.ellipse(-r * 0.22, -r * 0.25, r * 0.35, r * 0.2, -0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const drawTntBarrel = (x: number, y: number, r: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = '#DC2626';
      ctx.strokeStyle = '#7F1D1D';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-r * 0.85, -r * 0.95, r * 1.7, r * 1.9, 5);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#FACC15';
      ctx.fillRect(-r * 0.85, -7, r * 1.7, 14);
      ctx.fillStyle = '#7F1D1D';
      ctx.font = '900 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('TNT', 0, 0.5);
      ctx.restore();
    };

    const drawMysteryBag = (x: number, y: number, r: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = '#7C3AED';
      ctx.strokeStyle = '#FDE047';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 3, r * 0.85, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#5B21B6';
      ctx.beginPath();
      ctx.moveTo(-6, -r * 0.45);
      ctx.lineTo(6, -r * 0.45);
      ctx.lineTo(3, -r * 0.95);
      ctx.lineTo(-3, -r * 0.95);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#FEF08A';
      ctx.font = '900 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('?', 0, 4);
      ctx.restore();
    };

    const drawMole = (item: MineItem) => {
      const dir = (item.vx ?? 1) >= 0 ? 1 : -1;
      ctx.save();
      ctx.translate(item.x, item.y);
      ctx.scale(dir, 1);

      // Body
      ctx.fillStyle = '#78350F';
      ctx.strokeStyle = '#451A03';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.ellipse(0, 3, item.radius * 0.95, item.radius * 0.72, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Snout & nose
      ctx.fillStyle = '#FDBA74';
      ctx.beginPath();
      ctx.ellipse(item.radius * 0.65, 3, 5, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#F43F5E';
      ctx.beginPath();
      ctx.arc(item.radius * 0.85, 2, 2.2, 0, Math.PI * 2);
      ctx.fill();

      // Miner hat (with diamond if DIAMOND_MOLE)
      ctx.fillStyle = item.kind === 'DIAMOND_MOLE' ? '#0EA5E9' : '#F59E0B';
      ctx.beginPath();
      ctx.arc(2, -4, item.radius * 0.56, Math.PI, 0);
      ctx.fill();
      if (item.kind === 'DIAMOND_MOLE') {
        ctx.fillStyle = '#E0F2FE';
        ctx.beginPath();
        ctx.moveTo(4, -15);
        ctx.lineTo(9, -10);
        ctx.lineTo(4, -5);
        ctx.lineTo(-1, -10);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    };

    const drawItem = (item: MineItem, time: number) => {
      switch (item.kind) {
        case 'GOLD_L':
        case 'GOLD_M':
        case 'GOLD_S':
          drawGoldNugget(item.x, item.y, item.radius, item.seed);
          break;
        case 'DIAMOND':
          drawDiamond(item.x, item.y, item.radius, time);
          break;
        case 'ROCK_L':
        case 'ROCK_S':
          drawRock(item.x, item.y, item.radius, item.seed);
          break;
        case 'TNT_BARREL':
          drawTntBarrel(item.x, item.y, item.radius);
          break;
        case 'MYSTERY_BAG':
          drawMysteryBag(item.x, item.y, item.radius);
          break;
        case 'MOLE':
        case 'DIAMOND_MOLE':
          drawMole(item);
          break;
      }
    };

    const render = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const dtSec = Math.min(0.05, Math.max(0.001, (time - lastTimeRef.current) / 1000));
      const dt60 = dtSec * 60;
      lastTimeRef.current = time;

      const isPlaying = playStateRef.current === 'PLAYING';
      const h = hookRef.current;

      // 1. Update Countdown & Mole Patrols
      if (isPlaying) {
        timeLeftRef.current = Math.max(0, timeLeftRef.current - dtSec);
        const wholeSec = Math.ceil(timeLeftRef.current);
        if (wholeSec !== lastShownTimeRef.current) {
          lastShownTimeRef.current = wholeSec;
          setTimeLeft(wholeSec);
        }

        if (timeLeftRef.current <= 0) {
          finishStageEarlyOrTimeout();
        }
      }

      if (playStateRef.current === 'PLAYING' || playStateRef.current === 'IDLE') {
        for (const item of itemsRef.current) {
          if (item.vx && item.minX !== undefined && item.maxX !== undefined) {
            item.x += item.vx * dtSec;
            if (item.x <= item.minX) {
              item.x = item.minX;
              item.vx = Math.abs(item.vx);
            } else if (item.x >= item.maxX) {
              item.x = item.maxX;
              item.vx = -Math.abs(item.vx);
            }
          }
        }
      }

      // 2. Hook Pendulum, Launch & Winch Retraction Physics
      if (isPlaying) {
        const curStage = stageRef.current;
        if (h.phase === 'SWINGING') {
          const swingSpeed = 2.05 + Math.min(0.9, (curStage - 1) * 0.12);
          h.swingPhase += dtSec * swingSpeed;
          h.angle = Math.sin(h.swingPhase) * 1.29;
          h.length = 34;
        } else if (h.phase === 'EXTENDING') {
          const extendSpeed = 365 + Math.min(80, (curStage - 1) * 12);
          h.length += extendSpeed * dtSec;
          const tipX = pivotX + Math.sin(h.angle) * h.length;
          const tipY = pivotY + Math.cos(h.angle) * h.length;

          // Check Collision with Underground Items
          let hitIdx = -1;
          for (let i = 0; i < itemsRef.current.length; i++) {
            const it = itemsRef.current[i];
            if (Math.hypot(tipX - it.x, tipY - it.y) <= it.radius + 9) {
              hitIdx = i;
              break;
            }
          }

          if (hitIdx >= 0) {
            const hitItem = itemsRef.current.splice(hitIdx, 1)[0];
            if (hitItem.kind === 'TNT_BARREL') {
              // TNT Chain Blast — clears nearby objects in 84px radius
              const blastR = 84;
              for (let k = itemsRef.current.length - 1; k >= 0; k--) {
                const other = itemsRef.current[k];
                if (Math.hypot(other.x - hitItem.x, other.y - hitItem.y) <= blastR) {
                  itemsRef.current.splice(k, 1);
                }
              }
              fxRef.current.spawnSparkles(hitItem.x, hitItem.y, 26, '#EF4444');
              fxRef.current.spawnFloatText(hitItem.x, hitItem.y - 16, tRef.current('games.goldminer.fx_tnt_boom'), '#EF4444');
              fxRef.current.addScreenShake(0.85);
              soundHaptics.triggerHaptic([40, 30, 70]);
              GameSounds.playTowerCrash();
              h.phase = 'RETRACTING';
              h.grabbedItem = null;
              setIsReelingHeavy(false);
            } else {
              h.phase = 'RETRACTING';
              h.grabbedItem = hitItem;
              setIsReelingHeavy(true);
              soundHaptics.triggerHaptic(hitItem.weight >= 3.0 ? [30, 20, 45] : 20);
              if (hitItem.weight >= 3.0) {
                minerFaceRef.current = { mood: 'STRAIN', until: time + 3000 };
              }
              GameSounds.playKick();
            }
          } else if (tipX < 10 || tipX > width - 10 || tipY > height - 10) {
            h.phase = 'RETRACTING';
            h.grabbedItem = null;
            setIsReelingHeavy(false);
          }
        } else if (h.phase === 'RETRACTING') {
          const item = h.grabbedItem;
          const strengthMul = buffsRef.current.strength ? 1.65 : 1.0;
          const basePull = Math.max(220, 310 - (curStage - 1) * 9);
          const speed = item ? Math.max(40, (basePull / item.weight) * strengthMul) : 480;
          h.length -= speed * dtSec;

          if (item && item.weight >= 3.0) {
            minerFaceRef.current = { mood: 'STRAIN', until: time + 200 };
          }

          if (h.length <= 34) {
            h.length = 34;
            h.phase = 'SWINGING';
            setIsReelingHeavy(false);

            if (item) {
              h.grabbedItem = null;
              soundHaptics.playCoinPickup();
              let payout = item.value;
              let floatLabel = payout > 0 ? `+$${payout}` : '';
              let floatColor = '#FDE047';

              if (item.kind === 'DIAMOND' || item.kind === 'DIAMOND_MOLE') {
                if (buffsRef.current.diamondPolish) payout = Math.round(payout * 1.5);
                floatLabel = `+$${payout}`;
                floatColor = '#38BDF8';
                GameSounds.playCoinRain();
              } else if (item.kind === 'ROCK_L' || item.kind === 'ROCK_S') {
                if (buffsRef.current.rockBook) payout *= 3;
                floatLabel = `+$${payout}`;
                floatColor = '#CBD5E1';
                GameSounds.playTap();
              } else if (item.kind === 'MYSTERY_BAG') {
                const roll = Math.random();
                if (roll < 0.58) {
                  const baseBag = buffsRef.current.luckyClover ? 420 : 200;
                  payout = baseBag + Math.floor(Math.random() * 240);
                  floatLabel = tRef.current('games.goldminer.fx_mystery_cash', { amt: payout });
                  floatColor = '#FDE047';
                  GameSounds.playCoinRain();
                } else if (roll < 0.80) {
                  dynamiteRef.current = Math.min(5, dynamiteRef.current + 1);
                  setDynamiteCount(dynamiteRef.current);
                  floatLabel = tRef.current('games.goldminer.fx_mystery_tnt');
                  floatColor = '#F97316';
                  GameSounds.playChestOpen();
                } else {
                  buffsRef.current.strength = true;
                  setBuffs({ ...buffsRef.current });
                  floatLabel = tRef.current('games.goldminer.fx_mystery_power');
                  floatColor = '#34D399';
                  GameSounds.playCorrect();
                }
              } else {
                GameSounds.playCorrect();
              }

              if (payout > 0) {
                cashRef.current += payout;
                setCash(cashRef.current);
                minerFaceRef.current = { mood: 'HAPPY', until: time + 900 };
              }
              if (floatLabel) {
                fxRef.current.spawnFloatText(pivotX, pivotY + 26, floatLabel, floatColor);
              }

              // Early clear if no valuable treasures left on board AND quota reached
              const anyTreasureLeft = itemsRef.current.some((it) => isValuableItem(it.kind));
              if (!anyTreasureLeft && cashRef.current >= stageGoalRef.current) {
                finishStageEarlyOrTimeout();
              }
            }
          }
        }
      }

      // 3. Render Scene
      const shake = fxRef.current.getShakeOffset();
      ctx.save();
      ctx.translate(shake.x, shake.y);

      // Surface backdrop & strata earth
      ctx.fillStyle = skyGrad;
      ctx.fillRect(-20, -20, width + 40, groundY + 20);

      // Wooden mine beams & timber floor
      ctx.fillStyle = '#451A03';
      ctx.fillRect(0, groundY - 6, width, 10);
      ctx.fillStyle = '#92400E';
      ctx.fillRect(0, groundY - 8, width, 4);

      ctx.fillStyle = earthGrad;
      ctx.fillRect(-20, groundY, width + 40, height - groundY + 20);

      // Underground subtle strata pebbles
      for (const pb of pebbles) {
        ctx.fillStyle = `rgba(255, 237, 213, ${pb.alpha})`;
        ctx.beginPath();
        ctx.arc(pb.x, pb.y, pb.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Prospector Character & Winch Cart at Top Center
      const mood = time < minerFaceRef.current.until ? minerFaceRef.current.mood : 'NORMAL';
      ctx.save();
      ctx.translate(pivotX, groundY - 12);
      // Mine Cart Box
      ctx.fillStyle = '#334155';
      ctx.strokeStyle = '#94A3B8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-24, -14, 48, 20, 5);
      ctx.fill();
      ctx.stroke();

      // Miner torso & beard & helmet
      ctx.fillStyle = '#B91C1C';
      ctx.beginPath();
      ctx.arc(-8, -22, 11, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = '#FED7AA';
      ctx.beginPath();
      ctx.arc(-8, -28, 9, 0, Math.PI * 2);
      ctx.fill();
      // Yellow hard hat + headlamp
      ctx.fillStyle = '#FACC15';
      ctx.beginPath();
      ctx.arc(-8, -31, 10, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = mood === 'HAPPY' ? '#38BDF8' : mood === 'STRAIN' ? '#F97316' : '#FEF08A';
      ctx.beginPath();
      ctx.arc(1, -33, 3.2, 0, Math.PI * 2);
      ctx.fill();

      // Winch drum on cart
      ctx.fillStyle = '#F59E0B';
      ctx.strokeStyle = '#FEF08A';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(10, -4, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Draw Underground Treasures & Obstacles
      for (const item of itemsRef.current) {
        drawItem(item, time);
      }

      // Draw Winch Cable, Articulated Claw & Grabbed Payload
      const tipX = pivotX + Math.sin(h.angle) * h.length;
      const tipY = pivotY + Math.cos(h.angle) * h.length;

      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(pivotX, pivotY);
      ctx.lineTo(tipX, tipY);
      ctx.stroke();

      if (h.grabbedItem) {
        const gItem = h.grabbedItem;
        const offsetDist = gItem.radius * 0.72;
        drawItem(
          {
            ...gItem,
            x: tipX + Math.sin(h.angle) * offsetDist,
            y: tipY + Math.cos(h.angle) * offsetDist,
          },
          time
        );
      }

      // Articulated 2-prong claw
      ctx.save();
      ctx.translate(tipX, tipY);
      ctx.rotate(-h.angle);
      const clawSpread = h.grabbedItem ? 0.35 : 0.72;
      ctx.strokeStyle = '#CBD5E1';
      ctx.lineWidth = 3.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-Math.sin(clawSpread) * 14, Math.cos(clawSpread) * 14);
      ctx.lineTo(-4, 19);
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.sin(clawSpread) * 14, Math.cos(clawSpread) * 14);
      ctx.lineTo(4, 19);
      ctx.stroke();

      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Particles & Floating Texts
      fxRef.current.update(dt60);
      fxRef.current.render(ctx);

      ctx.restore();
      frameIdRef.current = requestAnimationFrame(render);
    };

    frameIdRef.current = requestAnimationFrame(render);
    return () => {
      if (frameIdRef.current) cancelAnimationFrame(frameIdRef.current);
    };
  }, [finishStageEarlyOrTimeout, setupStage]);

  const handleBuyOffer = (offer: ShopOffer) => {
    if (boughtThisShop.has(offer.id) || cash < offer.cost) return;
    if (offer.id === 'DYNAMITE' && dynamiteCount >= 5) return;

    const remaining = cash - offer.cost;
    setCash(remaining);
    cashRef.current = remaining;
    setBoughtThisShop((prev) => new Set(prev).add(offer.id));
    GameSounds.playChestOpen();

    if (offer.id === 'DYNAMITE') {
      const nextDyn = Math.min(5, dynamiteCount + 1);
      setDynamiteCount(nextDyn);
      dynamiteRef.current = nextDyn;
    } else if (offer.id === 'STRENGTH') {
      const nextB = { ...buffs, strength: true };
      setBuffs(nextB);
      buffsRef.current = nextB;
    } else if (offer.id === 'DIAMOND') {
      const nextB = { ...buffs, diamondPolish: true };
      setBuffs(nextB);
      buffsRef.current = nextB;
    } else if (offer.id === 'CLOVER') {
      const nextB = { ...buffs, luckyClover: true };
      setBuffs(nextB);
      buffsRef.current = nextB;
    } else if (offer.id === 'ROCKBOOK') {
      const nextB = { ...buffs, rockBook: true };
      setBuffs(nextB);
      buffsRef.current = nextB;
    }
  };

  const handleAdvanceNextStage = () => {
    const nextStage = stage + 1;
    setupStage(nextStage, cashRef.current, { ...buffsRef.current }, dynamiteRef.current, true);
    GameSounds.playStart();
  };

  const handleClaimReward = () => {
    if (onClaimReward && rewardAmount > 0) {
      onClaimReward(rewardAmount);
    }
    if (playState === 'SHOP') {
      handleAdvanceNextStage();
    } else {
      startFreshRun();
    }
  };

  const quotaPct = Math.min(100, Math.round((cash / Math.max(1, stageGoal)) * 100));

  return (
    <div style={{ touchAction: 'none' }} className="h-[100dvh] bg-slate-950 text-white flex flex-col overflow-hidden overscroll-none font-sans select-none">
      <GameHeader
        title={t('games.goldminer.title')}
        subtitle={
          highScore > 0
            ? `${t('games.goldminer.stage_label', { stage })} • ${t('games.goldminer.best_label', { best: highScore })}`
            : t('games.goldminer.stage_label', { stage })
        }
        onBack={onBack}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
        onRestart={startFreshRun}
        restartTooltip={t('games.goldminer.btn_retry')}
        onHelp={() => setShowTutorial(true)}
      />

      {/* ── MAIN STAGE ── */}
      <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain max-w-md mx-auto w-full px-3 py-2 pb-4 flex flex-col items-center justify-center gap-2">
        {/* Compact Miner HUD */}
        <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl px-3 py-2 shadow-lg space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="bg-amber-500 text-slate-950 font-black text-[11px] px-2 py-0.5 rounded-lg shrink-0">
                {t('games.goldminer.stage_label', { stage })}
              </span>
              <span className="font-mono font-black text-emerald-400 text-sm">${cash}</span>
              <span className="text-[11px] text-slate-400 font-mono truncate">
                / {t('games.goldminer.goal_label')} ${stageGoal}
              </span>
            </div>

            <div
              className={`flex items-center gap-1 px-2.5 py-0.5 rounded-lg font-mono font-black text-xs border shrink-0 ${
                timeLeft <= 10 && playState === 'PLAYING'
                  ? 'bg-rose-500/20 border-rose-400 text-rose-300 animate-pulse'
                  : 'bg-slate-800 border-slate-700 text-amber-300'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{timeLeft}s</span>
            </div>
          </div>

          {/* Quota Progress Bar */}
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                cash >= stageGoal ? 'bg-emerald-400' : 'bg-gradient-to-r from-amber-500 to-yellow-300'
              }`}
              style={{ width: `${quotaPct}%` }}
            />
          </div>
        </div>

        {/* Canvas Arena */}
        <div
          ref={arenaRef}
          onPointerDown={launchHook}
          className="relative w-full rounded-3xl overflow-hidden shadow-2xl border-2 border-amber-500/40 bg-amber-950 touch-none select-none cursor-pointer shrink-0"
        >
          <canvas ref={canvasRef} className="w-full h-full block" />

          {/* IDLE Start Overlay */}
          {playState === 'IDLE' && (
            <div
              onPointerDown={(e) => {
                e.stopPropagation();
                launchHook();
              }}
              className="absolute inset-0 bg-slate-950/60 flex flex-col items-center justify-center p-6 text-center z-20"
            >
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center text-3xl shadow-xl animate-bounce mb-3">
                ⛏️
              </div>
              <h3 className="text-lg font-black text-white mb-1">{t('games.goldminer.title')}</h3>
              <p className="text-xs text-amber-200/90 max-w-xs mb-4">{t('games.goldminer.subtitle')}</p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  launchHook();
                }}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black rounded-xl text-sm shadow-lg active:scale-95 transition"
              >
                {t('games.goldminer.btn_start')}
              </button>
            </div>
          )}

          {/* GAME OVER Overlay */}
          {playState === 'GAMEOVER' && (
            <div
              onPointerDown={(e) => e.stopPropagation()}
              className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center z-20 animate-fade-in"
            >
              <div className="w-14 h-14 rounded-2xl bg-rose-600/30 border border-rose-500 text-rose-300 flex items-center justify-center text-2xl mb-2">
                ⛏️
              </div>
              <h3 className="text-lg font-black text-rose-400 mb-1">{t('games.goldminer.game_over_title')}</h3>
              <p className="text-xs text-slate-300 mb-4">
                {t('games.goldminer.game_over_desc', { cash, goal: stageGoal })}
              </p>
              <div className="flex flex-col gap-2 w-full max-w-[220px]">
                <button
                  type="button"
                  onClick={startFreshRun}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black rounded-xl text-sm shadow-lg active:scale-95 transition"
                >
                  {t('games.goldminer.btn_retry')}
                </button>
                {rewardAmount > 0 && onClaimReward && (
                  <button
                    type="button"
                    onClick={handleClaimReward}
                    className="w-full py-2 bg-slate-800 border border-amber-500/40 text-amber-300 font-bold rounded-xl text-xs active:scale-95 transition"
                  >
                    {t('games.common.btn_claim')} (+{rewardAmount})
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Control Row: Tactile Dynamite Button + Active Buffs */}
        <div className="w-full flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={triggerDynamite}
            disabled={!isReelingHeavy || dynamiteCount <= 0 || playState !== 'PLAYING'}
            className={`px-3.5 py-2 rounded-xl font-black text-xs border flex items-center gap-1.5 transition active:scale-95 shrink-0 ${
              isReelingHeavy && dynamiteCount > 0 && playState === 'PLAYING'
                ? 'bg-gradient-to-r from-rose-600 to-orange-500 border-amber-300 text-white shadow-lg animate-pulse'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            <Flame className="w-4 h-4 text-amber-300" />
            <span>{t('games.goldminer.dynamite_btn', { count: dynamiteCount })}</span>
          </button>

          <div className="flex items-center gap-1 shrink-0">
            {buffs.strength && (
              <span title={t('games.goldminer.shop_strength')} className="px-1.5 py-0.5 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-xs">
                💪
              </span>
            )}
            {buffs.diamondPolish && (
              <span title={t('games.goldminer.shop_diamond')} className="px-1.5 py-0.5 rounded-lg bg-sky-500/20 border border-sky-400/40 text-xs">
                💎
              </span>
            )}
            {buffs.luckyClover && (
              <span title={t('games.goldminer.shop_clover')} className="px-1.5 py-0.5 rounded-lg bg-lime-500/20 border border-lime-400/40 text-xs">
                🍀
              </span>
            )}
            {buffs.rockBook && (
              <span title={t('games.goldminer.shop_rockbook')} className="px-1.5 py-0.5 rounded-lg bg-amber-500/20 border border-amber-400/40 text-xs">
                📘
              </span>
            )}
          </div>

          <p className="text-[10px] text-slate-400 text-right leading-tight flex-1 truncate">{t('games.goldminer.tap_hint')}</p>
        </div>
      </main>

      {/* ── BETWEEN-STAGE UPGRADE SHOP MODAL ── */}
      {playState === 'SHOP' && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-amber-500/50 rounded-3xl p-5 max-w-sm w-full space-y-3.5 shadow-2xl">
            <div className="text-center space-y-1">
              <div className="inline-flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-400/40 text-emerald-300 px-3 py-0.5 rounded-full text-[10px] font-black uppercase">
                <Sparkles className="w-3 h-3" />
                {t('games.goldminer.stage_clear_title', { stage })}
              </div>
              <h3 className="text-base font-black text-white flex items-center justify-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-amber-400" />
                <span>{t('games.goldminer.shop_title')}</span>
              </h3>
              <p className="text-xs text-amber-300 font-bold font-mono">
                {t('games.goldminer.shop_subtitle', { cash })}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2 max-h-[42vh] overflow-y-auto pr-0.5">
              {shopOffers.map((offer) => {
                const bought = boughtThisShop.has(offer.id);
                const maxedDyn = offer.id === 'DYNAMITE' && dynamiteCount >= 5;
                const affordable = cash >= offer.cost && !bought && !maxedDyn;
                return (
                  <button
                    key={offer.id}
                    type="button"
                    disabled={!affordable}
                    onClick={() => handleBuyOffer(offer)}
                    className={`w-full flex items-center justify-between gap-2.5 p-2.5 rounded-2xl border text-left transition ${
                      bought
                        ? 'bg-emerald-950/40 border-emerald-500/40 opacity-85'
                        : affordable
                        ? 'bg-slate-800/90 border-slate-700 hover:border-amber-400/60 active:scale-[0.98]'
                        : 'bg-slate-900/60 border-slate-800 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-9 h-9 rounded-xl bg-slate-950 border border-slate-700 flex items-center justify-center text-lg shrink-0">
                        {offer.icon}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-white truncate">{t(offer.titleKey)}</p>
                        <p className="text-[10px] text-slate-400 leading-snug line-clamp-2">{t(offer.descKey)}</p>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-black font-mono shrink-0 ${
                        bought
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : affordable
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {bought ? t('games.goldminer.shop_bought') : `$${offer.cost}`}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={handleAdvanceNextStage}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black rounded-xl text-sm shadow-lg active:scale-95 transition"
              >
                {t('games.goldminer.btn_next_stage')} →
              </button>
              {onClaimReward && rewardAmount > 0 && (
                <button
                  type="button"
                  onClick={handleClaimReward}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 font-bold rounded-xl text-xs active:scale-95 transition"
                >
                  {t('games.common.btn_claim')} (+{rewardAmount} {t('nav.points_unit')})
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── GAME TUTORIAL MODAL ── */}
      <GameTutorialModal
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
        gameTitle={t('games.goldminer.title')}
        gameIcon="⛏️"
        goal={t('games.goldminer.tutorial.goal')}
        controls={t('games.goldminer.tutorial.controls')}
        scoring={t('games.goldminer.tutorial.scoring')}
        tips={t('games.goldminer.tutorial.tips')}
      />
    </div>
  );
};
