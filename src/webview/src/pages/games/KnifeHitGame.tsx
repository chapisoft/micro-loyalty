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
  id: string;
  angle: number;
  icon: string;
  label: string;
  type: 'RED_ENVELOPE' | 'DATA_PACK' | 'GOLD_CHEST' | 'DIAMOND' | 'GOLD_COIN';
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

export const STAGE_THEMES: KnifeStageTheme[] = [
  // Stage 1: Thớt Gỗ Cổ Thụ Caribe
  {
    name: 'Thớt Gỗ Cổ Thụ Caribe',
    badge: 'Gỗ Sồi Cổ',
    coreGradient: ['#D97706', '#B45309', '#92400E', '#451A03'],
    ringColor: 'rgba(69, 26, 3, 0.45)',
    rimColor: '#F59E0B',
    emblemBg: ['#FEF08A', '#D97706'],
    emblemText: 'NATCASH',
    textColor: '#78350F',
    particleColor: '#F59E0B',
    bgGlowColor: 'rgba(245, 158, 11, 0.22)',
  },
  // Stage 2: Vòng Kim Tiền Hoàng Kim
  {
    name: 'Vòng Kim Tiền Hoàng Kim',
    badge: 'Thần Tài 24K',
    coreGradient: ['#FFFBEB', '#FDE047', '#EAB308', '#854D0E'],
    ringColor: 'rgba(161, 98, 7, 0.4)',
    rimColor: '#FEF08A',
    emblemBg: ['#FFFFFF', '#EAB308'],
    emblemText: 'GOLD VIP',
    textColor: '#713F12',
    particleColor: '#FDE047',
    bgGlowColor: 'rgba(234, 179, 8, 0.25)',
  },
  // Stage 3: Khiên Dung Nham Hỏa Ngục
  {
    name: 'Khiên Dung Nham Hỏa Ngục',
    badge: 'Hỏa Thạch',
    coreGradient: ['#F97316', '#DC2626', '#991B1B', '#1E1B4B'],
    ringColor: 'rgba(239, 68, 68, 0.5)',
    rimColor: '#F87171',
    emblemBg: ['#FEE2E2', '#EF4444'],
    emblemText: 'MAGMA',
    textColor: '#7F1D1D',
    particleColor: '#EF4444',
    bgGlowColor: 'rgba(239, 68, 68, 0.28)',
  },
  // Stage 4: Ma Trận Băng Tuyết Tinh Thể
  {
    name: 'Ma Trận Băng Tuyết Tinh Thể',
    badge: 'Băng Pha Lê',
    coreGradient: ['#E0F2FE', '#38BDF8', '#0284C7', '#082F49'],
    ringColor: 'rgba(56, 189, 248, 0.4)',
    rimColor: '#BAE6FD',
    emblemBg: ['#FFFFFF', '#38BDF8'],
    emblemText: 'CRYO ICE',
    textColor: '#075985',
    particleColor: '#38BDF8',
    bgGlowColor: 'rgba(56, 189, 248, 0.25)',
  },
  // Stage 5: Lõi Không Gian Vũ Trụ
  {
    name: 'Lõi Không Gian Vũ Trụ VIP',
    badge: 'Tinh Vân',
    coreGradient: ['#F5D0FE', '#C084FC', '#7E22CE', '#1E1B4B'],
    ringColor: 'rgba(192, 132, 252, 0.45)',
    rimColor: '#F0ABFC',
    emblemBg: ['#FAF5FF', '#A855F7'],
    emblemText: 'COSMIC',
    textColor: '#581C87',
    particleColor: '#C084FC',
    bgGlowColor: 'rgba(168, 85, 247, 0.28)',
  },
  // Stage 6+: Khiên Kim Cương Bất Diệt
  {
    name: 'Khiên Kim Cương Bất Diệt',
    badge: 'Tối Thượng',
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

export const getStageTheme = (stageNum: number): KnifeStageTheme => {
  const idx = Math.min(STAGE_THEMES.length - 1, Math.max(0, stageNum - 1));
  return STAGE_THEMES[idx];
};

// Calculate dynamic target scale factor based on stage
export const getTargetScale = (stageNum: number): number => {
  if (stageNum === 1) return 1.0;
  if (stageNum === 2) return 0.88;
  if (stageNum === 3) return 0.78;
  if (stageNum === 4) return 0.68;
  if (stageNum === 5) return 0.58;
  return Math.max(0.44, 0.58 - (stageNum - 5) * 0.035);
};

// Calculate base rotation speed based on stage
export const getBaseRotationSpeed = (stageNum: number): number => {
  if (stageNum === 1) return 0.038;
  if (stageNum === 2) return 0.050;
  if (stageNum === 3) return 0.062;
  if (stageNum === 4) return 0.075;
  if (stageNum === 5) return 0.088;
  return Math.min(0.12, 0.088 + (stageNum - 5) * 0.008);
};

export const KnifeHitGame: React.FC<KnifeHitGameProps> = ({ onBack, onClaimReward }) => {
  const { t } = useTranslation();
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

  const [knivesLeft, setKnivesLeft] = useState<number>(8);
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
  const logAngleRef = useRef<number>(0);
  const logSpeedRef = useRef<number>(0.038);
  const pinnedKnivesRef = useRef<PinnedKnife[]>([]);
  const targetItemsRef = useRef<TargetItem[]>([]);
  const flyingKnifeRef = useRef<FlyingKnife | null>(null);
  const knivesLeftRef = useRef<number>(8);
  const isGameOverRef = useRef<boolean>(false);
  const isStageClearRef = useRef<boolean>(false);
  const fxRef = useRef<GameFXSystem>(new GameFXSystem());
  const frameIdRef = useRef<number | null>(null);

  const currentTheme = getStageTheme(stage);
  const currentTargetScale = getTargetScale(stage);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    GameSounds.setMuted(!next);
  };

  // Generate Stage configuration with progressive difficulty, dynamic speeds & micro-targets
  const initStage = useCallback((stageNum: number) => {
    stageRef.current = stageNum;
    setStage(stageNum);
    logAngleRef.current = 0;
    logSpeedRef.current = getBaseRotationSpeed(stageNum);

    // Obstacle knives pre-pinned on the log (Higher stages have more obstacles)
    pinnedKnivesRef.current = [];
    if (stageNum === 2) {
      pinnedKnivesRef.current.push({ angle: Math.PI * 0.5 });
    } else if (stageNum === 3) {
      pinnedKnivesRef.current.push({ angle: Math.PI * 0.4 }, { angle: Math.PI * 1.35 });
    } else if (stageNum === 4) {
      pinnedKnivesRef.current.push({ angle: Math.PI * 0.3 }, { angle: Math.PI * 0.95 }, { angle: Math.PI * 1.65 });
    } else if (stageNum === 5) {
      pinnedKnivesRef.current.push(
        { angle: Math.PI * 0.2 },
        { angle: Math.PI * 0.7 },
        { angle: Math.PI * 1.2 },
        { angle: Math.PI * 1.75 }
      );
    } else if (stageNum >= 6) {
      pinnedKnivesRef.current.push(
        { angle: Math.PI * 0.15 },
        { angle: Math.PI * 0.55 },
        { angle: Math.PI * 0.95 },
        { angle: Math.PI * 1.35 },
        { angle: Math.PI * 1.75 }
      );
    }

    // Config targets to hit (Target scale shrinks each stage)
    const newTargets: TargetItem[] = [];
    if (stageNum === 1) {
      newTargets.push(
        { id: 't1', angle: Math.PI * 0.25, icon: '🧧', label: 'Bao Lì Xì', type: 'RED_ENVELOPE', points: 30, collected: false },
        { id: 't2', angle: Math.PI * 1.65, icon: '📶', label: 'Gói Data 4G', type: 'DATA_PACK', points: 50, collected: false }
      );
    } else if (stageNum === 2) {
      newTargets.push(
        { id: 't1', angle: Math.PI * 0.15, icon: '🧧', label: 'Bao Lì Xì', type: 'RED_ENVELOPE', points: 35, collected: false },
        { id: 't2', angle: Math.PI * 0.95, icon: '📶', label: 'Gói Data 4G', type: 'DATA_PACK', points: 50, collected: false },
        { id: 't3', angle: Math.PI * 1.75, icon: '🧧', label: 'Bao Lì Xì', type: 'RED_ENVELOPE', points: 35, collected: false }
      );
    } else if (stageNum === 3) {
      newTargets.push(
        { id: 't1', angle: Math.PI * 0.18, icon: '👑', label: 'Rương Vàng', type: 'GOLD_CHEST', points: 80, collected: false },
        { id: 't2', angle: Math.PI * 0.78, icon: '📶', label: 'Gói Data 4G', type: 'DATA_PACK', points: 50, collected: false },
        { id: 't3', angle: Math.PI * 1.8, icon: '🧧', label: 'Bao Lì Xì', type: 'RED_ENVELOPE', points: 40, collected: false }
      );
    } else if (stageNum === 4) {
      newTargets.push(
        { id: 't1', angle: Math.PI * 0.12, icon: '💎', label: 'Kim Cương', type: 'DIAMOND', points: 120, collected: false },
        { id: 't2', angle: Math.PI * 0.65, icon: '📶', label: 'Gói Data 4G', type: 'DATA_PACK', points: 60, collected: false },
        { id: 't3', angle: Math.PI * 1.15, icon: '👑', label: 'Rương Vàng', type: 'GOLD_CHEST', points: 90, collected: false },
        { id: 't4', angle: Math.PI * 1.82, icon: '🧧', label: 'Bao Lì Xì', type: 'RED_ENVELOPE', points: 50, collected: false }
      );
    } else {
      newTargets.push(
        { id: 't1', angle: Math.PI * 0.1, icon: '🪙', label: 'Xu VIP', type: 'GOLD_COIN', points: 150, collected: false },
        { id: 't2', angle: Math.PI * 0.6, icon: '💎', label: 'Kim Cương', type: 'DIAMOND', points: 150, collected: false },
        { id: 't3', angle: Math.PI * 1.1, icon: '📶', label: 'Gói Data 4G', type: 'DATA_PACK', points: 80, collected: false },
        { id: 't4', angle: Math.PI * 1.6, icon: '👑', label: 'Rương Vàng', type: 'GOLD_CHEST', points: 100, collected: false }
      );
    }

    targetItemsRef.current = newTargets;
    setTargetItems(newTargets);

    const totalKnives = Math.min(12, 6 + stageNum);
    knivesLeftRef.current = totalKnives;
    setKnivesLeft(totalKnives);

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
      x: 0, // centered
      y: 375,
      vx: 0,
      vy: -26,
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

      const curStage = stageRef.current;
      const theme = getStageTheme(curStage);
      const targetScale = getTargetScale(curStage);

      // Background subtle glow behind log matching theme
      const bgGlow = ctx.createRadialGradient(logCenterX, logCenterY, 20, logCenterX, logCenterY, 150);
      bgGlow.addColorStop(0, theme.bgGlowColor);
      bgGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = bgGlow;
      ctx.beginPath();
      ctx.arc(logCenterX, logCenterY, 150, 0, Math.PI * 2);
      ctx.fill();

      // Dynamic variable rotation speeds & pattern modulation based on stage
      if (!isGameOverRef.current && !isStageClearRef.current) {
        let speedMultiplier = 1.0;

        if (curStage === 1) {
          // Smooth steady rotation
          speedMultiplier = 1.0;
        } else if (curStage === 2) {
          // Subtle pulsation
          speedMultiplier = 1.0 + 0.35 * Math.sin(time * 0.003);
        } else if (curStage === 3) {
          // Reversing direction smoothly
          speedMultiplier = Math.cos(time * 0.0028) * 1.4;
        } else if (curStage === 4) {
          // Erratic sudden stops & fast spins
          speedMultiplier = Math.sin(time * 0.004) > 0.15 ? 1.55 : (Math.sin(time * 0.004) < -0.15 ? -1.25 : 0.25);
        } else {
          // Stage 5+: Complex dual-wave modulation with sudden bursts
          speedMultiplier = Math.sin(time * 0.005) * 1.6 + Math.cos(time * 0.0025) * 0.9;
        }

        logAngleRef.current += logSpeedRef.current * speedMultiplier;
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
        ctx.arc(0, 0, logRadius, 0, Math.PI * 2);
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
            } else if (item.type === 'DIAMOND') {
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
              return diff < 0.20; // Collision envelope between knives
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

              // Check if hit gift items with precise target scale hitbox envelope
              let newlyCollected = false;
              let itemPointsTotal = 0;
              const hitTolerance = Math.max(0.13, 0.30 * targetScale); // Target hitbox envelope shrinks with stage

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
                      `+${item.points} ${item.label} ${item.icon}`,
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

                // Wood log shatter physics & explosion!
                fxRef.current.spawnWoodSplinters(logCenterX, logCenterY, 40);
                fxRef.current.spawnSparkles(logCenterX, logCenterY, 30, theme.particleColor);
                fxRef.current.spawnConfettiExplosion(logCenterX, logCenterY, 60);
                fxRef.current.addScreenShake(0.85);

                GameSounds.playTowerCrash();
                GameSounds.playWinFanfare();

                // Bonus for finishing early with leftover knives
                const unusedKnivesBonus = allTargetsCollected ? Math.max(0, knivesLeftRef.current) * 50 : 0;
                if (unusedKnivesBonus > 0) {
                  fxRef.current.spawnFloatText(
                    logCenterX,
                    logCenterY - 40,
                    `+${unusedKnivesBonus} THƯỞNG DAO DƯ! 🎯`,
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
    const newHighest = Math.max(highestStage, nextS);
    setHighestStage(newHighest);
    try {
      localStorage.setItem('knife_hit_stage', String(nextS));
      localStorage.setItem('knife_hit_score', String(score));
      localStorage.setItem('knife_hit_highest_stage', String(newHighest));
    } catch {}
    initStage(nextS);
    setShowRewardModal(false);
  };

  const restartGame = () => {
    setScore(0);
    try {
      localStorage.setItem('knife_hit_stage', '1');
      localStorage.setItem('knife_hit_score', '0');
    } catch {}
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
    } catch {}
    setShowRewardModal(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans select-none pb-12 animate-fade-in">
      <GameHeader
        title={t('games.knife.title')}
        subtitle={
          highestStage > 1
            ? `Kỷ lục: Màn ${highestStage} • ${t('games.knife.stage', { stage })}: ${currentTheme.badge}`
            : `${t('games.knife.stage', { stage })}: ${currentTheme.badge}`
        }
        onBack={onBack}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
        onRestart={restartGame}
        restartTooltip={t('games.memory.btn_restart')}
        onHelp={() => setShowTutorial(true)}
      />

      {/* ── MAIN STAGE ── */}
      <main className="flex-1 max-w-md mx-auto w-full px-3 py-2 flex flex-col items-center justify-between">
        {/* ── 1. STAGE & TARGET CHECKLIST HUD ── */}
        <div className="w-full flex flex-col gap-2 mb-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-2.5 shadow-lg">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 overflow-hidden">
              <span className="text-xs font-black text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-lg border border-amber-400/30 font-mono shrink-0">
                {t('games.knife.stage', { stage })}
              </span>
              <span className="text-[11px] font-extrabold text-slate-200 truncate">
                {currentTheme.name}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="bg-slate-800/90 border border-slate-700/80 px-2 py-0.5 rounded-xl text-center flex items-center gap-1">
                <span className="text-[10px] text-slate-400 font-bold">Dao:</span>
                <span className="font-mono font-black text-amber-400 text-xs">{knivesLeft}</span>
              </div>
              <div className="bg-amber-950/60 border border-amber-500/40 px-2 py-0.5 rounded-xl text-center flex items-center gap-1">
                <span className="text-[10px] text-amber-300 font-bold">Điểm:</span>
                <span className="font-mono font-black text-white text-xs">{score}</span>
              </div>
            </div>
          </div>

          {/* Dynamic Target Badges & Difficulty Indicators */}
          <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-slate-800/80">
            <div className="flex items-center gap-1.5 flex-wrap">
              {targetItems.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold transition-all duration-300 ${
                    item.collected
                      ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 line-through opacity-85 shadow-sm'
                      : 'bg-amber-500/15 border border-amber-500/30 text-amber-300 animate-pulse'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                  <span className="text-[10px] opacity-80">+{item.points}đ</span>
                  {item.collected && <span className="text-emerald-400 font-black not-italic">✓</span>}
                </div>
              ))}
            </div>

            <div className="shrink-0 text-[10px] font-bold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700">
              Kích cỡ: {Math.round(currentTargetScale * 100)}%
            </div>
          </div>
        </div>

        {/* ── 2. CANVAS KNIFE HIT ARENA ── */}
        <div
          onClick={throwKnife}
          className="relative w-full aspect-[4/5] max-h-[440px] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border-2 border-amber-500/40 touch-none select-none cursor-pointer"
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
                onClick={restartGame}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black rounded-xl text-sm shadow-lg active:scale-95 transition"
              >
                {t('games.common.btn_play_again')}
              </button>
            </div>
          )}
        </div>

        {/* ── 3. BIG THROW ACTION BUTTON ── */}
        <button
          onClick={throwKnife}
          className="w-full max-w-[280px] py-3 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black rounded-2xl text-sm shadow-xl active:scale-95 transition mt-3 flex items-center justify-center gap-2"
        >
          <span>🗡️</span>
          <span>{t('games.knife.btn_throw')}</span>
        </button>
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
              <p className="text-xs text-slate-400 mt-1">{t('games.knife.stage', { stage })}: {currentTheme.name}</p>
              <div className="text-3xl font-black text-amber-400 font-mono mt-2">
                +{rewardAmount} {t('nav.points_unit')}
              </div>

              {rewardBreakdown.unusedKnivesBonus > 0 && (
                <p className="text-xs font-bold text-emerald-400 mt-1">
                  🎯 Thưởng hoàn thành sớm: +{rewardBreakdown.unusedKnivesBonus} điểm ({knivesLeft} dao dư)
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
