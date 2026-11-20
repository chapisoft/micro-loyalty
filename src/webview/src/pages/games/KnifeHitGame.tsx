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

const KNIFE_BONUS_TYPES = {
  RED_ENVELOPE: 'RED_ENVELOPE',
  DATA_PACK: 'DATA_PACK',
  GOLD_CHEST: 'GOLD_CHEST',
  DIAMOND: 'DIAMOND',
  GOLD_COIN: 'GOLD_COIN',
} as const;

type KnifeBonusType = (typeof KNIFE_BONUS_TYPES)[keyof typeof KNIFE_BONUS_TYPES];

interface TargetItem {
  id: string;
  angle: number;
  icon: string;
  label: string;
  type: KnifeBonusType;
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

export type KnifeStageMechanic = 'STEADY' | 'PULSE' | 'REVERSE_ON_HIT' | 'ARMORED' | 'BOSS';

interface ShatteredLogHalf {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vrot: number;
  side: 'LEFT' | 'RIGHT';
}

export interface KnifeStageTheme {
  name: string;
  badge: string;
  coreGradient: [string, string, string, string]; // 4 stop colors
  ringColor: string;
  rimColor: string;
  emblemBg: [string, string];
  emblemText: string;
  textColor: string;
  particleColor: string;
  bgGlowColor: string;
}

// eslint-disable-next-line react-refresh/only-export-components
export const STAGE_THEMES: KnifeStageTheme[] = [
  // Stage 1: Caribe Ancient Wood
  {
    name: 'games.knife.theme_1_name',
    badge: 'games.knife.theme_1_badge',
    coreGradient: ['#D97706', '#B45309', '#92400E', '#451A03'],
    ringColor: 'rgba(69, 26, 3, 0.45)',
    rimColor: '#F59E0B',
    emblemBg: ['#FEF08A', '#D97706'],
    emblemText: 'NATCASH',
    textColor: '#78350F',
    particleColor: '#F59E0B',
    bgGlowColor: 'rgba(245, 158, 11, 0.22)',
  },
  // Stage 2: Golden Fortune Ring
  {
    name: 'games.knife.theme_2_name',
    badge: 'games.knife.theme_2_badge',
    coreGradient: ['#FFFBEB', '#FDE047', '#EAB308', '#854D0E'],
    ringColor: 'rgba(161, 98, 7, 0.4)',
    rimColor: '#FEF08A',
    emblemBg: ['#FFFFFF', '#EAB308'],
    emblemText: 'GOLD VIP',
    textColor: '#713F12',
    particleColor: '#FDE047',
    bgGlowColor: 'rgba(234, 179, 8, 0.25)',
  },
  // Stage 3: Inferno Magma Shield
  {
    name: 'games.knife.theme_3_name',
    badge: 'games.knife.theme_3_badge',
    coreGradient: ['#F97316', '#DC2626', '#991B1B', '#1E1B4B'],
    ringColor: 'rgba(239, 68, 68, 0.5)',
    rimColor: '#F87171',
    emblemBg: ['#FEE2E2', '#EF4444'],
    emblemText: 'MAGMA',
    textColor: '#7F1D1D',
    particleColor: '#EF4444',
    bgGlowColor: 'rgba(239, 68, 68, 0.28)',
  },
  // Stage 4: Crystal Ice Matrix
  {
    name: 'games.knife.theme_4_name',
    badge: 'games.knife.theme_4_badge',
    coreGradient: ['#E0F2FE', '#38BDF8', '#0284C7', '#082F49'],
    ringColor: 'rgba(56, 189, 248, 0.4)',
    rimColor: '#BAE6FD',
    emblemBg: ['#FFFFFF', '#38BDF8'],
    emblemText: 'CRYO ICE',
    textColor: '#075985',
    particleColor: '#38BDF8',
    bgGlowColor: 'rgba(56, 189, 248, 0.25)',
  },
  // Stage 5: Cosmic Nebula Core
  {
    name: 'games.knife.theme_5_name',
    badge: 'games.knife.theme_5_badge',
    coreGradient: ['#F5D0FE', '#C084FC', '#7E22CE', '#1E1B4B'],
    ringColor: 'rgba(192, 132, 252, 0.45)',
    rimColor: '#F0ABFC',
    emblemBg: ['#FAF5FF', '#A855F7'],
    emblemText: 'COSMIC',
    textColor: '#581C87',
    particleColor: '#C084FC',
    bgGlowColor: 'rgba(168, 85, 247, 0.28)',
  },
  // Stage 6+: Immortal Diamond Shield
  {
    name: 'games.knife.theme_6_name',
    badge: 'games.knife.theme_6_badge',
    coreGradient: ['#F0FDFA', '#5EEAD4', '#0D9488', '#134E4A'],
    ringColor: 'rgba(94, 234, 212, 0.4)',
    rimColor: '#99F6E4',
    emblemBg: ['#FFFFFF', '#14B8A6'],
    emblemText: 'DIAMOND',
    textColor: '#115E59',
    particleColor: '#5EEAD4',
    bgGlowColor: 'rgba(20, 184, 166, 0.3)',
  },
];

// eslint-disable-next-line react-refresh/only-export-components
export const getStageTheme = (stageNum: number): KnifeStageTheme => {
  const idx = Math.min(STAGE_THEMES.length - 1, Math.max(0, stageNum - 1));
  return STAGE_THEMES[idx];
};

// Calculate dynamic target scale factor based on stage
// eslint-disable-next-line react-refresh/only-export-components
export const getTargetScale = (stageNum: number): number => {
  if (stageNum === 1) return 1.0;
  if (stageNum === 2) return 0.96;
  if (stageNum === 3) return 0.92;
  if (stageNum === 4) return 0.88;
  if (stageNum === 5) return 0.84;
  return Math.max(0.78, 0.84 - (stageNum - 5) * 0.02);
};

// Calculate base rotation speed based on stage (rad per 60Hz tick)
// eslint-disable-next-line react-refresh/only-export-components
export const getBaseRotationSpeed = (stageNum: number): number => {
  if (stageNum === 1) return 0.020;
  if (stageNum === 2) return 0.024;
  if (stageNum === 3) return 0.028;
  if (stageNum === 4) return 0.031;
  if (stageNum === 5) return 0.034;
  return Math.min(0.044, 0.034 + (stageNum - 5) * 0.0025);
};

// eslint-disable-next-line react-refresh/only-export-components
export const getStageMechanic = (stageNum: number): KnifeStageMechanic => {
  if (stageNum === 1) return 'STEADY';
  if (stageNum === 2) return 'PULSE';
  if (stageNum === 3) return 'REVERSE_ON_HIT';
  if (stageNum === 4) return 'ARMORED';
  if (stageNum % 5 === 0) return 'BOSS';
  const cycle: KnifeStageMechanic[] = ['ARMORED', 'REVERSE_ON_HIT', 'PULSE'];
  return cycle[(stageNum - 6) % cycle.length];
};

const getMechanicLabelKey = (mechanic: KnifeStageMechanic): string => {
  switch (mechanic) {
    case 'STEADY':
      return 'games.knife.mode_steady';
    case 'PULSE':
      return 'games.knife.mode_pulse';
    case 'REVERSE_ON_HIT':
      return 'games.knife.mode_reverse_hit';
    case 'ARMORED':
      return 'games.knife.mode_armored';
    case 'BOSS':
      return 'games.knife.mode_boss';
  }
};

export const KnifeHitGame: React.FC<KnifeHitGameProps> = ({ onBack, onClaimReward }) => {
  const { t } = useTranslation();
  const tRef = useRef(t);
  tRef.current = t;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [stage, setStage] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('knife_hit_stage');
      return saved ? Math.max(1, parseInt(saved, 10)) : 1;
    } catch {
      return 1;
    }
  });
  const [score, setScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('knife_hit_score');
      return saved ? Math.max(0, parseInt(saved, 10)) : 0;
    } catch {
      return 0;
    }
  });
  const [highestStage, setHighestStage] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('knife_hit_highest_stage');
      return saved ? Math.max(1, parseInt(saved, 10)) : 1;
    } catch {
      return 1;
    }
  });

  const [knivesLeft, setKnivesLeft] = useState<number>(7);
  const [totalStageKnives, setTotalStageKnives] = useState<number>(7);
  const [targetItems, setTargetItems] = useState<TargetItem[]>([]);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [, setIsStageClear] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(!GameSounds.isSoundMuted());
  const [showRewardModal, setShowRewardModal] = useState<boolean>(false);
  const [rewardAmount, setRewardAmount] = useState<number>(0);
  const [rewardBreakdown, setRewardBreakdown] = useState<{ base: number; targetsBonus: number; unusedKnivesBonus: number }>({
    base: 0,
    targetsBonus: 0,
    unusedKnivesBonus: 0,
  });
  const [showTutorial, setShowTutorial] = useState<boolean>(false);

  // Rotating target and knife state refs
  const stageRef = useRef<number>(stage);
  const mechanicRef = useRef<KnifeStageMechanic>(getStageMechanic(stage));
  const logAngleRef = useRef<number>(0);
  const logSpeedRef = useRef<number>(getBaseRotationSpeed(stage));
  const currentAngularVelRef = useRef<number>(getBaseRotationSpeed(stage));
  const spinDirRef = useRef<number>(1);
  const hitsThisStageRef = useRef<number>(0);
  const logRecoilYRef = useRef<number>(0);
  const armorAnglesRef = useRef<number[]>([]);
  const shatterHalvesRef = useRef<ShatteredLogHalf[]>([]);
  const pinnedKnivesRef = useRef<PinnedKnife[]>([]);
  const targetItemsRef = useRef<TargetItem[]>([]);
  const flyingKnifeRef = useRef<FlyingKnife | null>(null);
  const knivesLeftRef = useRef<number>(7);
  const totalKnivesRef = useRef<number>(7);
  const isGameOverRef = useRef<boolean>(false);
  const isStageClearRef = useRef<boolean>(false);
  const fxRef = useRef<GameFXSystem>(new GameFXSystem());
  const frameIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const launcherYRef = useRef<number>(350);

  const currentTheme = getStageTheme(stage);
  const currentMechanic = getStageMechanic(stage);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    GameSounds.setMuted(!next);
  };

  // Generate Stage configuration with progressive difficulty & diverse stage mechanics
  const initStage = useCallback((stageNum: number) => {
    const mechanic = getStageMechanic(stageNum);
    stageRef.current = stageNum;
    mechanicRef.current = mechanic;
    setStage(stageNum);
    logAngleRef.current = 0;
    const baseSpeed = getBaseRotationSpeed(stageNum);
    logSpeedRef.current = baseSpeed;
    currentAngularVelRef.current = baseSpeed;
    spinDirRef.current = 1;
    hitsThisStageRef.current = 0;
    logRecoilYRef.current = 0;
    shatterHalvesRef.current = [];
    lastTimeRef.current = 0;

    // Steel armor plates for ARMORED and BOSS stages
    if (mechanic === 'ARMORED') {
      armorAnglesRef.current = [Math.PI * 0.9];
    } else if (mechanic === 'BOSS') {
      armorAnglesRef.current = [Math.PI * 0.5, Math.PI * 1.5];
    } else {
      armorAnglesRef.current = [];
    }

    // Obstacle knives pre-pinned on the log (placed clear of armor arcs)
    pinnedKnivesRef.current = [];
    if (stageNum === 2) {
      pinnedKnivesRef.current.push({ angle: Math.PI * 0.65 });
    } else if (stageNum === 3) {
      pinnedKnivesRef.current.push({ angle: Math.PI * 0.4 }, { angle: Math.PI * 1.35 });
    } else if (stageNum === 4) {
      pinnedKnivesRef.current.push({ angle: Math.PI * 0.2 }, { angle: Math.PI * 1.55 });
    } else if (mechanic === 'BOSS') {
      pinnedKnivesRef.current.push(
        { angle: Math.PI * 0.05 },
        { angle: Math.PI * 0.95 },
        { angle: Math.PI * 1.88 }
      );
    } else if (stageNum >= 6) {
      pinnedKnivesRef.current.push(
        { angle: Math.PI * 0.25 },
        { angle: Math.PI * 1.25 },
        { angle: Math.PI * 1.65 }
      );
    }

    // Config targets to hit (placed safely away from armor & pre-pinned knives)
    const newTargets: TargetItem[] = [];
    if (stageNum === 1) {
      newTargets.push(
        { id: 't1', angle: Math.PI * 0.25, icon: '🧧', label: 'games.knife.item_red_envelope', type: 'RED_ENVELOPE', points: 30, collected: false },
        { id: 't2', angle: Math.PI * 1.65, icon: '📶', label: 'games.knife.item_data_pack', type: 'DATA_PACK', points: 50, collected: false }
      );
    } else if (stageNum === 2) {
      newTargets.push(
        { id: 't1', angle: Math.PI * 0.15, icon: '🧧', label: 'games.knife.item_red_envelope', type: 'RED_ENVELOPE', points: 35, collected: false },
        { id: 't2', angle: Math.PI * 1.15, icon: '📶', label: 'games.knife.item_data_pack', type: 'DATA_PACK', points: 50, collected: false },
        { id: 't3', angle: Math.PI * 1.75, icon: '🧧', label: 'games.knife.item_red_envelope', type: 'RED_ENVELOPE', points: 35, collected: false }
      );
    } else if (stageNum === 3) {
      newTargets.push(
        { id: 't1', angle: Math.PI * 0.12, icon: '👑', label: 'games.knife.item_gold_chest', type: 'GOLD_CHEST', points: 80, collected: false },
        { id: 't2', angle: Math.PI * 0.85, icon: '📶', label: 'games.knife.item_data_pack', type: 'DATA_PACK', points: 50, collected: false },
        { id: 't3', angle: Math.PI * 1.82, icon: '🧧', label: 'games.knife.item_red_envelope', type: 'RED_ENVELOPE', points: 40, collected: false }
      );
    } else if (stageNum === 4) {
      newTargets.push(
        { id: 't1', angle: Math.PI * 0.48, icon: '💎', label: 'games.knife.item_diamond', type: 'DIAMOND', points: 120, collected: false },
        { id: 't2', angle: Math.PI * 1.25, icon: '📶', label: 'games.knife.item_data_pack', type: 'DATA_PACK', points: 60, collected: false },
        { id: 't3', angle: Math.PI * 1.85, icon: '👑', label: 'games.knife.item_gold_chest', type: 'GOLD_CHEST', points: 90, collected: false }
      );
    } else {
      newTargets.push(
        { id: 't1', angle: Math.PI * 0.25, icon: '🪙', label: 'games.knife.item_gold_coin', type: 'GOLD_COIN', points: 150, collected: false },
        { id: 't2', angle: Math.PI * 0.72, icon: '💎', label: 'games.knife.item_diamond', type: 'DIAMOND', points: 150, collected: false },
        { id: 't3', angle: Math.PI * 1.22, icon: '📶', label: 'games.knife.item_data_pack', type: 'DATA_PACK', points: 80, collected: false },
        { id: 't4', angle: Math.PI * 1.72, icon: '👑', label: 'games.knife.item_gold_chest', type: 'GOLD_CHEST', points: 100, collected: false }
      );
    }

    targetItemsRef.current = newTargets;
    setTargetItems(newTargets);

    const totalKnives =
      stageNum === 1
        ? 6
        : stageNum === 2
        ? 7
        : stageNum <= 4
        ? 8
        : stageNum === 5
        ? 9
        : Math.min(10, 8 + Math.floor((stageNum - 3) / 2));
    knivesLeftRef.current = totalKnives;
    totalKnivesRef.current = totalKnives;
    setKnivesLeft(totalKnives);
    setTotalStageKnives(totalKnives);

    flyingKnifeRef.current = null;
    fxRef.current.clear();
    isGameOverRef.current = false;
    isStageClearRef.current = false;
    setIsGameOver(false);
    setIsStageClear(false);
    setShowRewardModal(false);
  }, []);

  // Initialize on mount with saved stage
  useEffect(() => {
    initStage(stage);
  }, [initStage, stage]);

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
      x: 0,
      y: launcherYRef.current,
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

  // Spacebar support to throw knife
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        throwKnife();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [throwKnife]);

  // Main Canvas Render & Animation Loop with 60 FPS Particle FX
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = canvas.parentElement?.clientWidth || 360;
    const height = Math.min(window.innerHeight - 220, 480);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const logCenterX = width / 2;
    const baseLogCenterY = 148;
    const logRadius = 66;
    launcherYRef.current = Math.min(height - 76, 350);
    lastTimeRef.current = 0;

    const render = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const dtSec = Math.min(0.05, Math.max(0.001, (time - lastTimeRef.current) / 1000));
      const dt60 = dtSec * 60;
      lastTimeRef.current = time;

      // Decay log vertical impact recoil smoothly
      logRecoilYRef.current *= Math.pow(0.75, dt60);
      if (Math.abs(logRecoilYRef.current) < 0.05) logRecoilYRef.current = 0;
      const logCenterY = baseLogCenterY - logRecoilYRef.current;

      // 0. Screen Shake Offset
      const shake = fxRef.current.getShakeOffset();
      ctx.save();
      ctx.translate(shake.x, shake.y);

      // 1. Draw Background Stage
      ctx.fillStyle = '#0B1329';
      ctx.fillRect(-20, -20, width + 40, height + 40);

      const curStage = stageRef.current;
      const mechanic = mechanicRef.current;
      const theme = getStageTheme(curStage);
      const targetScale = getTargetScale(curStage);

      // Background subtle glow behind log matching theme
      const bgGlow = ctx.createRadialGradient(logCenterX, logCenterY, 20, logCenterX, logCenterY, 155);
      bgGlow.addColorStop(0, theme.bgGlowColor);
      bgGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = bgGlow;
      ctx.beginPath();
      ctx.arc(logCenterX, logCenterY, 155, 0, Math.PI * 2);
      ctx.fill();

      // Framerate-independent angular velocity easing per stage archetype
      if (!isGameOverRef.current && !isStageClearRef.current) {
        const base = logSpeedRef.current;
        let targetAngularVel = base * spinDirRef.current;

        if (mechanic === 'STEADY') {
          targetAngularVel = base;
        } else if (mechanic === 'PULSE') {
          targetAngularVel = base * (1.0 + 0.45 * Math.sin(time * 0.0024));
        } else if (mechanic === 'REVERSE_ON_HIT') {
          targetAngularVel = base * spinDirRef.current * (1.0 + 0.15 * Math.sin(time * 0.002));
        } else if (mechanic === 'ARMORED') {
          targetAngularVel = base * (0.95 + 0.25 * Math.sin(time * 0.0022));
        } else if (mechanic === 'BOSS') {
          // Smooth stop-go-reverse rhythm
          targetAngularVel = base * Math.sin(time * 0.002) * 1.45;
        }

        const easeFactor = Math.min(1, 0.08 * dt60);
        currentAngularVelRef.current += (targetAngularVel - currentAngularVelRef.current) * easeFactor;
        logAngleRef.current += currentAngularVelRef.current * dt60;
      }

      // Spin direction indicator arcs for REVERSE_ON_HIT & BOSS stages
      if (!isStageClearRef.current && (mechanic === 'REVERSE_ON_HIT' || mechanic === 'BOSS')) {
        const dirSign = currentAngularVelRef.current >= 0 ? 1 : -1;
        ctx.save();
        ctx.strokeStyle = dirSign > 0 ? 'rgba(56, 189, 248, 0.4)' : 'rgba(244, 63, 94, 0.45)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 8]);
        ctx.beginPath();
        ctx.arc(logCenterX, logCenterY, logRadius + 24, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = dirSign > 0 ? '#38BDF8' : '#FB7185';
        ctx.font = '900 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(dirSign > 0 ? '↻' : '↺', logCenterX + logRadius + 30, logCenterY + 4);
        ctx.fillText(dirSign > 0 ? '↻' : '↺', logCenterX - logRadius - 30, logCenterY + 4);
        ctx.restore();
      }

      // 2. Draw Rotating Wooden / Elemental Target Log (Only when not shattered)
      if (!isStageClearRef.current) {
        ctx.save();
        ctx.translate(logCenterX, logCenterY);
        ctx.rotate(logAngleRef.current);

        // Core Gradient Texture matching theme
        const coreGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, logRadius);
        coreGrad.addColorStop(0, theme.coreGradient[0]);
        coreGrad.addColorStop(0.3, theme.coreGradient[1]);
        coreGrad.addColorStop(0.65, theme.coreGradient[2]);
        coreGrad.addColorStop(1, theme.coreGradient[3]);
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        if (mechanic === 'PULSE') {
          // Octagonal scalloped wheel silhouette for PULSE stages
          const points = 16;
          for (let i = 0; i < points; i++) {
            const a = (i * Math.PI * 2) / points;
            const rad = i % 2 === 0 ? logRadius : logRadius - 4;
            if (i === 0) ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
            else ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
          }
          ctx.closePath();
        } else {
          ctx.arc(0, 0, logRadius, 0, Math.PI * 2);
        }
        ctx.fill();

        // Rings Texture
        ctx.strokeStyle = theme.ringColor;
        ctx.lineWidth = 2;
        [0.25, 0.45, 0.65, 0.85].forEach((ratio) => {
          ctx.beginPath();
          ctx.arc(0, 0, logRadius * ratio, 0, Math.PI * 2);
          ctx.stroke();
        });

        // Golden / Metallic Filigree Edge Rim
        ctx.strokeStyle = theme.rimColor;
        ctx.lineWidth = 5;
        ctx.stroke();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Steel Armor Arcs (ARMORED & BOSS stages)
        armorAnglesRef.current.forEach((armorCenterAngle) => {
          ctx.save();
          // Rotate so angle 0 is +Y down (consistent with pinned knives)
          const canvasArcCenter = armorCenterAngle + Math.PI / 2;
          const halfArc = 0.31; // ~36 deg total steel plate
          ctx.strokeStyle = '#94A3B8';
          ctx.lineWidth = 11;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.arc(0, 0, logRadius + 1, canvasArcCenter - halfArc, canvasArcCenter + halfArc);
          ctx.stroke();

          ctx.strokeStyle = '#E2E8F0';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(0, 0, logRadius + 1, canvasArcCenter - halfArc * 0.85, canvasArcCenter + halfArc * 0.85);
          ctx.stroke();

          // Rivets
          ctx.fillStyle = '#334155';
          for (const offset of [-halfArc * 0.72, 0, halfArc * 0.72]) {
            const ra = canvasArcCenter + offset;
            ctx.beginPath();
            ctx.arc(Math.cos(ra) * (logRadius + 1), Math.sin(ra) * (logRadius + 1), 2.3, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        });

        // Center Emblem
        const hubGrad = ctx.createRadialGradient(-3, -3, 2, 0, 0, 22);
        hubGrad.addColorStop(0, theme.emblemBg[0]);
        hubGrad.addColorStop(1, theme.emblemBg[1]);
        ctx.fillStyle = hubGrad;
        ctx.beginPath();
        ctx.arc(0, 0, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = theme.rimColor;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = theme.textColor;
        ctx.font = '900 9.5px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(theme.emblemText, 0, 0.5);

        // Draw Pinned Items (Scaled micro-targets dynamically)
        targetItemsRef.current.forEach((item) => {
          if (!item.collected) {
            ctx.save();
            ctx.rotate(item.angle);
            ctx.translate(0, logRadius - 10);
            ctx.scale(targetScale, targetScale); // Dynamically scale target icon based on stage

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
            } else if (item.type === 'GOLD_CHEST') {
              // 3D Golden Chest
              ctx.fillStyle = '#EAB308';
              ctx.strokeStyle = '#FEF08A';
              ctx.lineWidth = 2;
              ctx.fillRect(-11, -12, 22, 22);
              ctx.strokeRect(-11, -12, 22, 22);
              ctx.fillStyle = '#78350F';
              ctx.fillRect(-11, -2, 22, 4);
              ctx.fillStyle = '#FFFFFF';
              ctx.font = '900 10px sans-serif';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText('👑', 0, -2);
            } else if (item.type === KNIFE_BONUS_TYPES.DIAMOND) {
              // 3D Brilliant Diamond Gem
              ctx.fillStyle = '#38BDF8';
              ctx.strokeStyle = '#FFFFFF';
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.moveTo(0, -12);
              ctx.lineTo(11, -3);
              ctx.lineTo(0, 12);
              ctx.lineTo(-11, -3);
              ctx.closePath();
              ctx.fill();
              ctx.stroke();
              ctx.fillStyle = '#E0F2FE';
              ctx.beginPath();
              ctx.moveTo(0, -12);
              ctx.lineTo(5, -3);
              ctx.lineTo(0, 12);
              ctx.fill();
            } else if (item.type === 'GOLD_COIN') {
              // 3D Golden VIP Coin
              ctx.fillStyle = '#F59E0B';
              ctx.strokeStyle = '#FEF08A';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.arc(0, 0, 11, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
              ctx.fillStyle = '#78350F';
              ctx.font = '900 8.5px sans-serif';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText('VIP', 0, 0.5);
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
      }

      // 2B. Draw Shattered Log Halves tumbling away on Stage Clear
      if (isStageClearRef.current && shatterHalvesRef.current.length > 0) {
        shatterHalvesRef.current.forEach((half) => {
          half.x += half.vx * dt60;
          half.y += half.vy * dt60;
          half.vy += 0.35 * dt60;
          half.rot += half.vrot * dt60;

          ctx.save();
          ctx.translate(half.x, half.y);
          ctx.rotate(half.rot);
          const coreGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, logRadius);
          coreGrad.addColorStop(0, theme.coreGradient[0]);
          coreGrad.addColorStop(0.6, theme.coreGradient[2]);
          coreGrad.addColorStop(1, theme.coreGradient[3]);
          ctx.fillStyle = coreGrad;
          ctx.beginPath();
          if (half.side === 'LEFT') {
            ctx.arc(0, 0, logRadius, Math.PI * 0.5, Math.PI * 1.5);
          } else {
            ctx.arc(0, 0, logRadius, -Math.PI * 0.5, Math.PI * 0.5);
          }
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = theme.rimColor;
          ctx.lineWidth = 4;
          ctx.stroke();
          ctx.restore();
        });
      }

      // 3. Update and Draw Flying Knife Physics & Collision Check
      const knife = flyingKnifeRef.current;
      if (knife) {
        if (knife.active) {
          knife.y += knife.vy * dt60;

          // Check Impact with Log Rim at bottom (y = logCenterY + logRadius)
          if (knife.y <= logCenterY + logRadius + 4) {
            knife.active = false;

            // Compute exact local angle on log when hit at bottom (+Y axis)
            const rawAngle = -logAngleRef.current;
            const normalizedHitAngle = ((rawAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);

            // 1) Check Steel Armor Plate Deflection (ARMORED / BOSS stages)
            const hitArmor = armorAnglesRef.current.some((armorAngle) => {
              let diff = Math.abs(normalizedHitAngle - armorAngle);
              if (diff > Math.PI) diff = Math.PI * 2 - diff;
              return diff < 0.31;
            });

            if (hitArmor) {
              // Metallic deflection — refund knife so stage cannot be cheesed, penalize 15 pts
              knife.clashed = true;
              knife.vx = (Math.random() > 0.5 ? 1 : -1) * (4 + Math.random() * 2.5);
              knife.vy = 6.5;
              knife.vrot = 0.24;
              knivesLeftRef.current += 1;
              setKnivesLeft(knivesLeftRef.current);
              setScore((s) => Math.max(0, s - 15));
              logRecoilYRef.current = 4;
              fxRef.current.spawnSparkles(logCenterX, logCenterY + logRadius, 24, '#E2E8F0');
              fxRef.current.spawnFloatText(
                logCenterX,
                logCenterY + logRadius + 28,
                tRef.current('games.knife.armor_deflect_fx'),
                '#94A3B8'
              );
              fxRef.current.addScreenShake(0.45);
              GameSounds.playWrong();
            } else {
              // 2) Check Clash with already pinned knives
              const hasClashed = pinnedKnivesRef.current.some((pinned) => {
                let diff = Math.abs(normalizedHitAngle - pinned.angle);
                if (diff > Math.PI) diff = Math.PI * 2 - diff;
                return diff < 0.19; // Collision envelope between knives
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
                // SUCCESSFUL STICK: Pin knife into log with physical recoil kick!
                flyingKnifeRef.current = null;
                pinnedKnivesRef.current.push({ angle: normalizedHitAngle });
                logRecoilYRef.current = 7;
                hitsThisStageRef.current += 1;

                // Reverse rotation every 2nd stuck knife in REVERSE_ON_HIT stages
                if (mechanic === 'REVERSE_ON_HIT' && hitsThisStageRef.current % 2 === 0) {
                  spinDirRef.current *= -1;
                }

                fxRef.current.spawnWoodSplinters(logCenterX, logCenterY + logRadius, 14);
                fxRef.current.spawnFloatText(logCenterX, logCenterY + logRadius + 30, '+20', '#FEF08A');
                fxRef.current.addScreenShake(0.22);
                GameSounds.playKick();
                setScore((s) => s + 20);

                // Check if hit gift items with precise target scale hitbox envelope
                let newlyCollected = false;
                let itemPointsTotal = 0;
                const hitTolerance = Math.max(0.14, 0.30 * targetScale);

                targetItemsRef.current.forEach((item) => {
                  if (!item.collected) {
                    let diff = Math.abs(normalizedHitAngle - item.angle);
                    if (diff > Math.PI) diff = Math.PI * 2 - diff;
                    if (diff < hitTolerance) {
                      item.collected = true;
                      newlyCollected = true;
                      itemPointsTotal += item.points;
                      fxRef.current.spawnSparkles(logCenterX, logCenterY + logRadius, 28, '#FDE047');
                      fxRef.current.spawnFloatText(
                        logCenterX,
                        logCenterY + logRadius + 45,
                        `+${item.points} ${tRef.current(item.label)} ${item.icon}`,
                        '#F43F5E'
                      );
                      fxRef.current.addScreenShake(0.35);
                      setScore((s) => s + item.points);
                      GameSounds.playCoinRain();
                    }
                  }
                });

                if (newlyCollected) {
                  setTargetItems([...targetItemsRef.current]);
                }

                // Win condition: ALL TARGETS HIT OR ALL KNIVES PINNED
                const allTargetsCollected =
                  targetItemsRef.current.length > 0 && targetItemsRef.current.every((i) => i.collected);
                const allKnivesPinned = knivesLeftRef.current <= 0;

                if (allTargetsCollected || allKnivesPinned) {
                  isStageClearRef.current = true;
                  setIsStageClear(true);

                  // Spawn 2 splitting log halves tumbling outward
                  shatterHalvesRef.current = [
                    { x: logCenterX - 6, y: logCenterY, vx: -3.2, vy: -4.2, rot: logAngleRef.current, vrot: -0.09, side: 'LEFT' },
                    { x: logCenterX + 6, y: logCenterY, vx: 3.2, vy: -4.2, rot: logAngleRef.current, vrot: 0.09, side: 'RIGHT' },
                  ];

                  // Wood log shatter physics & explosion!
                  fxRef.current.spawnWoodSplinters(logCenterX, logCenterY, 40);
                  fxRef.current.spawnSparkles(logCenterX, logCenterY, 30, theme.particleColor);
                  fxRef.current.spawnConfettiExplosion(logCenterX, logCenterY, 60);
                  fxRef.current.addScreenShake(0.85);

                  GameSounds.playTowerCrash();
                  GameSounds.playWinFanfare();

                  const unusedKnivesBonus = allTargetsCollected ? Math.max(0, knivesLeftRef.current) * 50 : 0;
                  if (unusedKnivesBonus > 0) {
                    fxRef.current.spawnFloatText(
                      logCenterX,
                      logCenterY - 40,
                      `+${unusedKnivesBonus} ${tRef.current('games.knife.bonus_unused_knives_fx')} 🎯`,
                      '#10B981'
                    );
                    setScore((s) => s + unusedKnivesBonus);
                  }

                  const baseStageReward = 120 + stageRef.current * 40;
                  const totalStageReward = baseStageReward + unusedKnivesBonus;
                  setRewardAmount(totalStageReward);
                  setRewardBreakdown({
                    base: baseStageReward,
                    targetsBonus: itemPointsTotal,
                    unusedKnivesBonus,
                  });

                  setTimeout(() => {
                    setShowRewardModal(true);
                  }, 750);
                }
              }
            }
          }
        } else if (knife.clashed) {
          // Deflected knife falling animation
          knife.x += knife.vx * dt60;
          knife.y += knife.vy * dt60;
          knife.vy += 0.45 * dt60; // gravity
          knife.rot += knife.vrot * dt60;

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
      const launcherY = Math.min(height - 76, 350);
      if (
        !flyingKnifeRef.current?.active &&
        !isGameOverRef.current &&
        !isStageClearRef.current &&
        knivesLeftRef.current > 0
      ) {
        ctx.save();
        ctx.translate(logCenterX, launcherY);

        // Damascus Blade with crisp translucent amber edge aura (zero shadowBlur)
        const bladeGrad = ctx.createLinearGradient(-4, 0, 4, 0);
        bladeGrad.addColorStop(0, '#94A3B8');
        bladeGrad.addColorStop(0.5, '#FFFFFF');
        bladeGrad.addColorStop(1, '#64748B');
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(4, 28);
        ctx.lineTo(-4, 28);
        ctx.closePath();
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.fillStyle = bladeGrad;
        ctx.fill();

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

      // 4B. Vertical Knife Rack along bottom-left edge
      const totalRack = totalKnivesRef.current;
      const remainingRack = knivesLeftRef.current;
      for (let kIdx = 0; kIdx < totalRack; kIdx++) {
        const isAvailable = kIdx < remainingRack;
        const ry = height - 24 - kIdx * 16;
        ctx.save();
        ctx.translate(22, ry);
        ctx.globalAlpha = isAvailable ? 1.0 : 0.28;
        ctx.fillStyle = isAvailable ? '#E2E8F0' : '#475569';
        ctx.beginPath();
        ctx.moveTo(14, 0);
        ctx.lineTo(3, -2.5);
        ctx.lineTo(3, 2.5);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = isAvailable ? '#F59E0B' : '#334155';
        ctx.fillRect(0, -4, 3, 8);
        ctx.fillStyle = isAvailable ? '#BE123C' : '#1E293B';
        ctx.fillRect(-8, -2, 8, 4);
        ctx.restore();
      }

      // 5. Update and Render Particles & Floating Text FX
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

  const nextStage = () => {
    const nextS = stage + 1;
    const newHighest = Math.max(highestStage, nextS);
    setHighestStage(newHighest);
    try {
      localStorage.setItem('knife_hit_stage', String(nextS));
      localStorage.setItem('knife_hit_score', String(score));
      localStorage.setItem('knife_hit_highest_stage', String(newHighest));
    } catch {
      /* ignore storage errors */
    }
    initStage(nextS);
    setShowRewardModal(false);
  };

  const restartGame = () => {
    setScore(0);
    try {
      localStorage.setItem('knife_hit_stage', '1');
      localStorage.setItem('knife_hit_score', '0');
    } catch {
      /* ignore storage errors */
    }
    initStage(1);
  };

  const claimReward = () => {
    if (onClaimReward && rewardAmount > 0) {
      onClaimReward(rewardAmount);
    }
    setScore(0);
    try {
      localStorage.setItem('knife_hit_stage', '1');
      localStorage.setItem('knife_hit_score', '0');
    } catch {
      /* ignore storage errors */
    }
    setShowRewardModal(false);
  };

  return (
    <div className="h-[100dvh] bg-slate-950 text-white flex flex-col overflow-hidden overscroll-none font-sans select-none">
      <GameHeader
        title={t('games.knife.title')}
        subtitle={
          highestStage > 1
              ? `${t('games.knife.record_stage', { highestStage })} • ${t('games.knife.stage', { stage })}: ${t(currentTheme.badge)}`
              : `${t('games.knife.stage', { stage })}: ${t(currentTheme.badge)}`
        }
        onBack={onBack}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
        onRestart={restartGame}
        restartTooltip={t('games.memory.btn_restart')}
        onHelp={() => setShowTutorial(true)}
      />

      {/* ── MAIN STAGE ── */}
      <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain max-w-md mx-auto w-full px-3 py-3 pb-4 flex flex-col items-center justify-center gap-3">
        {/* ── 1. STAGE & TARGET CHECKLIST HUD ── */}
        <div className="w-full flex flex-col gap-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-2.5 shadow-lg">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs font-black text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-lg border border-amber-400/30 font-mono shrink-0">
                {t('games.knife.stage', { stage })}
              </span>
              <span className="text-[10px] font-extrabold text-sky-300 bg-sky-500/15 border border-sky-400/30 px-2 py-0.5 rounded-lg shrink-0">
                {t(getMechanicLabelKey(currentMechanic))}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <div className="bg-slate-800/90 border border-slate-700/80 px-2 py-0.5 rounded-xl text-center flex items-center gap-1">
                <span className="text-[10px] text-slate-400 font-bold">{t('games.knife.knives_label')}</span>
                <span className="font-mono font-black text-amber-400 text-xs">
                  {knivesLeft}/{totalStageKnives}
                </span>
              </div>
              <div className="bg-amber-950/60 border border-amber-500/40 px-2 py-0.5 rounded-xl text-center flex items-center gap-1">
                <span className="text-[10px] text-amber-300 font-bold">{t('games.knife.score_label')}</span>
                <span className="font-mono font-black text-white text-xs">{score}</span>
              </div>
            </div>
          </div>

          {/* Dynamic Target Badges */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1.5 border-t border-slate-800/80">
            {targetItems.map((item) => (
              <div
                key={item.id}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all duration-300 ${
                  item.collected
                    ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 line-through opacity-85 shadow-sm'
                    : 'bg-amber-500/15 border border-amber-500/30 text-amber-300'
                }`}
              >
                <span>{item.icon}</span>
                <span>{t(item.label)}</span>
                <span className="text-[10px] opacity-80">+{item.points}</span>
                {item.collected && <span className="text-emerald-400 font-black not-italic">✓</span>}
              </div>
            ))}
          </div>
        </div>

        {/* ── 2. CANVAS KNIFE HIT ARENA ── */}
        <div
          onPointerDown={(e) => {
            e.preventDefault();
            throwKnife();
          }}
          className="relative w-full aspect-[4/5] max-h-[460px] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border-2 border-amber-500/40 touch-none select-none cursor-pointer"
        >
          <canvas ref={canvasRef} className="w-full h-full block" />

          {/* Game Over Overlay */}
          {isGameOver && (
            <div
              onPointerDown={(e) => e.stopPropagation()}
              className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fade-in z-20"
            >
              <div className="w-14 h-14 rounded-2xl bg-red-600/30 border border-red-500 text-red-400 flex items-center justify-center text-2xl mb-2">
                🗡️💥
              </div>
              <h3 className="text-lg font-black text-red-400 mb-1">{t('games.knife.hit_knife')}</h3>
              <p className="text-xs text-slate-300 mb-4">{t('games.common.points_won', { points: score })}</p>
              <button
                onClick={restartGame}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black rounded-xl text-sm shadow-lg active:scale-95 transition"
              >
                {t('games.common.btn_play_again')}
              </button>
            </div>
          )}
        </div>

        {/* ── 3. COMPACT THROW ACTION BAR & TAP HINT ── */}
        <div className="w-full max-w-[300px] flex flex-col items-center gap-1.5">
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              throwKnife();
            }}
            className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black rounded-2xl text-sm shadow-xl active:scale-95 transition flex items-center justify-center gap-2"
          >
            <span>🗡️</span>
            <span>{t('games.knife.btn_throw')}</span>
          </button>
          <p className="text-[11px] text-slate-400 text-center">{t('games.knife.tap_to_throw')}</p>
        </div>
      </main>

      {/* ── 4. STAGE CLEAR / VICTORY MODAL ── */}
      {showRewardModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-amber-500/50 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl relative overflow-hidden">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center text-3xl mx-auto shadow-xl animate-bounce">
              🏆
            </div>
            <div>
              <h3 className="text-lg font-black text-white">{t('games.knife.stage_clear')}</h3>
              <p className="text-xs text-slate-400 mt-1">{t('games.knife.stage', { stage })}: {t(currentTheme.name)}</p>
              <div className="text-3xl font-black text-amber-400 font-mono mt-2">
                +{rewardAmount} {t('nav.points_unit')}
              </div>

              {rewardBreakdown.unusedKnivesBonus > 0 && (
                <p className="text-xs font-bold text-emerald-400 mt-1">
                  🎯 {t('games.knife.early_finish_bonus', { bonus: rewardBreakdown.unusedKnivesBonus, knives: knivesLeft })}
                </p>
              )}
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

      {/* ── 5. GAME TUTORIAL MODAL ── */}
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
