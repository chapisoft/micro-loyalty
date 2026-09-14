import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Sparkles,
  Undo2,
  PlusCircle,
  Hammer,
  Palette,
  Check,
  Star,
  Clock,
  RotateCcw,
  Home,
  ChevronRight,
  AlertTriangle,
  PackageCheck,
} from 'lucide-react';
import { GameSounds } from '../../utils/audio';
import { GameHeader } from '../../components/common/GameHeader';
import { GameTutorialModal } from '../../components/common/GameTutorialModal';
import { loyaltyApi } from '../../services/api';

export interface ScrewPuzzleGameProps {
  onBack: () => void;
  onClaimReward?: (pointsWon: number) => void;
  userPoints?: number;
  userTurns?: number;
  onUpdateTurns?: (remainingTurns: number) => void;
  onDeductPoints?: (deducted: number) => void;
}

// ── DATA STRUCTURES ──
export interface PlateDetail {
  type: 'circle' | 'path' | 'line';
  cx?: number;
  cy?: number;
  r?: number;
  x?: number;
  y?: number;
  radius?: number;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  d?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
}

export interface InterlockingPlate {
  id: number;
  name: string;
  // Unified SVG Path in 0 0 100 100 space
  pathData: string;
  // True Center of Mass for exact gravity alignment physics
  centerOfMass: { x: number; y: number };
  colorStart: string;
  colorEnd: string;
  borderColor: string;
  // List of Hole IDs that pierce through this plate
  screwHoles: string[];
  occludedHoles?: string[];
  layer: number;
  isFallen: boolean;
  fallTranslateY: number;
  fallRotate: number;
  currentRotation: number;
  pivotPoint: { x: number; y: number } | null;
  details?: PlateDetail[];
}

export interface Hole {
  id: string;
  x: number; // % in 0 - 100 board coordinate
  y: number; // % in 0 - 100 board coordinate
  isExtra?: boolean;
}

export interface ScrewPin {
  id: number;
  color: string;
  currentHoleId: string;
  layer?: number;
}

export interface LevelBoxConfig {
  color: string;
  colorNameKey: string;
  capacity?: number; // 3 or 4
}

export interface ScrewBox {
  id: string;
  color: string;
  colorNameKey: string;
  capacity: number; // 3 or 4
  collectedCount: number;
  isCompleted: boolean;
}

export interface LevelData {
  level: number;
  name: string;
  artNameKey: string;
  artIcon: string;
  silhouettePaths: { d: string; opacity?: number }[];
  boxes: LevelBoxConfig[];
  freeHoles: Hole[];
  boardHoles: Hole[];
  plates: InterlockingPlate[];
  screws: ScrewPin[];
  targetTime: number;
  maxMoves?: number;
}

// ── THEME DEFINITIONS (MATCHING LUCKY WHEEL) ──
export interface ScrewThemeConfig {
  key: string;
  nameKey: string;
  icon: string;
  boardBg: string;
  trayBg: string;
  trayBorder: string;
  boardBorder: string;
  statusBg: string;
  accentText: string;
  ctaBtn: string;
  screwColors: string[];
}

export const SCREW_THEMES: Record<string, ScrewThemeConfig> = {
  THEME_DEFAULT: {
    key: 'THEME_DEFAULT',
    nameKey: 'games.themes.theme_default',
    icon: '👑',
    boardBg: 'from-slate-900 via-indigo-950 to-slate-900',
    trayBg: 'bg-slate-950/85 border-slate-800',
    trayBorder: 'border-amber-500/40',
    boardBorder: 'border-slate-800 shadow-amber-500/10',
    statusBg: 'bg-slate-900/95 border-slate-800',
    accentText: 'text-amber-400',
    ctaBtn: 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950',
    screwColors: ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'],
  },
  THEME_KANAVAL: {
    key: 'THEME_KANAVAL',
    nameKey: 'games.themes.theme_kanaval',
    icon: '🔥',
    boardBg: 'from-stone-950 via-red-950 to-neutral-950',
    trayBg: 'bg-red-950/75 border-red-800/80',
    trayBorder: 'border-orange-500/50',
    boardBorder: 'border-red-900/80 shadow-red-500/20',
    statusBg: 'bg-red-950/90 border-red-800',
    accentText: 'text-orange-400',
    ctaBtn: 'bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500 text-white',
    screwColors: ['#EF4444', '#F97316', '#FBBF24', '#DC2626', '#EA580C', '#E11D48', '#B45309', '#991B1B'],
  },
  THEME_CARIBBEAN: {
    key: 'THEME_CARIBBEAN',
    nameKey: 'games.themes.theme_caribbean',
    icon: '🏝️',
    boardBg: 'from-slate-950 via-cyan-950 to-slate-900',
    trayBg: 'bg-cyan-950/75 border-teal-800/80',
    trayBorder: 'border-cyan-400/50',
    boardBorder: 'border-teal-900/80 shadow-cyan-500/20',
    statusBg: 'bg-cyan-950/90 border-teal-800',
    accentText: 'text-cyan-300',
    ctaBtn: 'bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-600 text-white',
    screwColors: ['#06B6D4', '#14B8A6', '#3B82F6', '#0284C7', '#10B981', '#6366F1', '#38BDF8', '#0D9488'],
  },
  THEME_HOLIDAY: {
    key: 'THEME_HOLIDAY',
    nameKey: 'games.themes.theme_holiday',
    icon: '🎄',
    boardBg: 'from-zinc-950 via-emerald-950 to-zinc-950',
    trayBg: 'bg-emerald-950/75 border-emerald-800/80',
    trayBorder: 'border-rose-400/50',
    boardBorder: 'border-emerald-900/80 shadow-emerald-500/20',
    statusBg: 'bg-emerald-950/90 border-emerald-800',
    accentText: 'text-rose-300',
    ctaBtn: 'bg-gradient-to-r from-rose-600 via-pink-500 to-emerald-600 text-white',
    screwColors: ['#E11D48', '#10B981', '#F59E0B', '#059669', '#DC2626', '#BE123C', '#34D399', '#D97706'],
  },
};

// ── 5-STAGE RANDOM CAMPAIGN CONSTANTS & LEVEL GENERATOR ──
export const TOTAL_SESSION_STAGES = 5;
export const GAME_TIME_LIMIT_SECONDS = 60; // 1-minute fixed time limit per puzzle stage

export const generateRandomSessionLevelIndices = (totalPoolSize: number, sessionCount: number = TOTAL_SESSION_STAGES): number[] => {
  const indices = Array.from({ length: totalPoolSize }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices.slice(0, Math.min(sessionCount, totalPoolSize));
};

// ── 9 TANGRAM POLY-ART GAME LEVELS ──
import { LEVELS } from './levels';
export { LEVELS };

export const ScrewPuzzleGame: React.FC<ScrewPuzzleGameProps> = ({
  onBack,
  onClaimReward,
  userPoints: propUserPoints,
  userTurns: propUserTurns,
  onUpdateTurns,
  onDeductPoints,
}) => {
  const { t } = useTranslation();

  // ── USER TURNS & LOYALTY POINTS STATE ──
  const userId = new URLSearchParams(window.location.search).get('userId') || '50937123456';
  const today = new Date().toISOString().slice(0, 10);

  const [points, setPoints] = useState<number>(() => {
    if (propUserPoints !== undefined) return propUserPoints;
    const saved = localStorage.getItem(`loyalty_points_${userId}`);
    return saved !== null ? Number(saved) : 2480;
  });

  const [turns, setTurns] = useState<number>(() => {
    if (propUserTurns !== undefined) return propUserTurns;
    const saved = localStorage.getItem(`screw_puzzle_turns_${userId}_${today}`);
    return saved !== null ? Number(saved) : 3;
  });

  const [showBuyTurnsModal, setShowBuyTurnsModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; color: string } | null>(null);
  const [sessionToken, setSessionToken] = useState<string>('');
  const [_gameConfig, setGameConfig] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    let isMounted = true;
    loyaltyApi.getGameDetail('SCREW_PUZZLE', userId).then((detail: any) => {
      if (isMounted && detail) {
        if (detail.gameParams) setGameConfig(detail.gameParams);
        if (typeof detail.userPointBalance === 'number' && propUserPoints === undefined) {
          setPoints(detail.userPointBalance);
        }
      }
    }).catch(() => {});

    loyaltyApi.initGameSession('SCREW_PUZZLE', userId).then((res: any) => {
      if (isMounted && res) {
        if (res.sessionToken) setSessionToken(res.sessionToken);
      }
    }).catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [userId, propUserPoints, propUserTurns, onUpdateTurns]);

  useEffect(() => {
    if (propUserPoints !== undefined) setPoints(propUserPoints);
  }, [propUserPoints]);

  useEffect(() => {
    if (propUserTurns !== undefined) setTurns(propUserTurns);
  }, [propUserTurns]);

  const updateTurnsState = (newTurns: number) => {
    setTurns(newTurns);
    try {
      localStorage.setItem(`screw_puzzle_turns_${userId}_${today}`, String(newTurns));
    } catch {}
    if (onUpdateTurns) onUpdateTurns(newTurns);
  };

  const updatePointsState = (newPoints: number, deducted: number) => {
    setPoints(newPoints);
    try {
      localStorage.setItem(`loyalty_points_${userId}`, String(newPoints));
    } catch {}
    if (onDeductPoints) onDeductPoints(deducted);
  };

  // ── THEME STATE ──
  const [currentThemeKey, setCurrentThemeKey] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('screw_puzzle_theme');
      return saved && SCREW_THEMES[saved] ? saved : 'THEME_DEFAULT';
    } catch {
      return 'THEME_DEFAULT';
    }
  });
  const [showThemeModal, setShowThemeModal] = useState<boolean>(false);
  const activeTheme = SCREW_THEMES[currentThemeKey] || SCREW_THEMES.THEME_DEFAULT;

  const handleSelectTheme = (themeKey: string) => {
    setCurrentThemeKey(themeKey);
    try {
      localStorage.setItem('screw_puzzle_theme', themeKey);
    } catch {}
    setShowThemeModal(false);
    GameSounds.playTap();
  };

  // ── 5-STAGE RANDOM CAMPAIGN SESSION STATE (CHỌN NGẪU NHIÊN 5 MÀN TỪ 9 MÀN TANGRAM) ──
  const [sessionLevelIndices, setSessionLevelIndices] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('screw_session_levels');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          Array.isArray(parsed) &&
          parsed.length === TOTAL_SESSION_STAGES &&
          parsed.every((i) => typeof i === 'number' && i >= 0 && i < LEVELS.length)
        ) {
          return parsed;
        }
      }
    } catch {}
    return generateRandomSessionLevelIndices(LEVELS.length, TOTAL_SESSION_STAGES);
  });

  const [currentStageIndex, setCurrentStageIndex] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('screw_session_stage');
      const idx = saved ? parseInt(saved, 10) : 0;
      return idx >= 0 && idx < TOTAL_SESSION_STAGES ? idx : 0;
    } catch {
      return 0;
    }
  });

  const [levelData, setLevelData] = useState<LevelData>(() => {
    const firstIdx = sessionLevelIndices[0] ?? 0;
    return LEVELS[firstIdx % LEVELS.length];
  });

  // Active Game State
  const [plates, setPlates] = useState<InterlockingPlate[]>([]);
  const [screws, setScrews] = useState<ScrewPin[]>([]);
  const [freeHoles, setFreeHoles] = useState<Hole[]>([]);
  const [boardHoles, setBoardHoles] = useState<Hole[]>([]);
  const [boxes, setBoxes] = useState<ScrewBox[]>([]);
  const [activeBoxIndices, setActiveBoxIndices] = useState<number[]>([0]);
  const [selectedScrewId, setSelectedScrewId] = useState<number | null>(null);
  const [history, setHistory] = useState<{ screws: ScrewPin[]; plates: InterlockingPlate[]; boxes: ScrewBox[]; activeBoxIndices?: number[]; movesLeft: number }[]>([]);

  // Boosters & Game Flow
  const [extraHolesUnlocked, setExtraHolesUnlocked] = useState<number>(0);
  const [hammerActive, setHammerActive] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(!GameSounds.isSoundMuted());
  const [showTutorial, setShowTutorial] = useState<boolean>(false);

  // Time & Moves & Deadlock & Game Over
  const [timeLeft, setTimeLeft] = useState<number>(GAME_TIME_LIMIT_SECONDS);
  const [movesLeft, setMovesLeft] = useState<number>(30);
  const [isDeadlocked, setIsDeadlocked] = useState<boolean>(false);
  const [showLoseModal, setShowLoseModal] = useState<boolean>(false);
  const [loseReason, setLoseReason] = useState<'deadlock' | 'timeout' | 'moves'>('deadlock');
  const deadlockTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [usedHammerCount, setUsedHammerCount] = useState<number>(0);

  // ── 1-SECOND GAME ENTRY LOADING OVERLAY STATE ──
  const [isLoadingLevel, setIsLoadingLevel] = useState<boolean>(true);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [gameRunKey, setGameRunKey] = useState<number>(0);
  const hasLoadedGameOnceRef = useRef<boolean>(false);
  const loadingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const loadingProgressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Win Modal & 3-Star Celebration
  const [showWinModal, setShowWinModal] = useState<boolean>(false);
  const [earnedStars, setEarnedStars] = useState<number>(3);
  const [rewardBreakdown, setRewardBreakdown] = useState<{
    base: number;
    timeBonus: number;
    masterBonus: number;
    total: number;
  }>({ base: 100, timeBonus: 0, masterBonus: 0, total: 100 });

  // VFX & Particles
  interface SparkParticle {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    size: number;
    alpha: number;
  }
  interface FloatingText {
    id: number;
    text: string;
    x: number;
    y: number;
    color: string;
    alpha: number;
  }
  interface ActiveFlyingScrew {
    id: number;
    screwId: number;
    color: string;
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
    startTime: number;
    duration: number;
    targetType: 'BOX' | 'HOLE';
    targetId: string;
    boxIdx?: number;
    slotIdx?: number;
  }
  const [sparks, setSparks] = useState<SparkParticle[]>([]);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [flyingScrews, setFlyingScrews] = useState<ActiveFlyingScrew[]>([]);
  const [flightTime, setFlightTime] = useState<number>(0);
  const flightIdRef = useRef<number>(0);
  const completedFlightIdsRef = useRef<Set<number>>(new Set());
  const inFlightScrewIdsRef = useRef<Set<number>>(new Set());
  const inFlightTargetHoleIdsRef = useRef<Set<string>>(new Set());
  const autoCollectingScrewIdsRef = useRef<Set<number>>(new Set());
  const [screenShake, setScreenShake] = useState<boolean>(false);
  const particleIdRef = useRef<number>(0);

  // ── DRAG & DROP INTERACTION REFS & STATE ──
  const boardRef = useRef<HTMLDivElement>(null);
  const [draggedScrewId, setDraggedScrewId] = useState<number | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredTargetId, setHoveredTargetId] = useState<string | null>(null);
  const dragStartPosRef = useRef<{ clientX: number; clientY: number }>({ clientX: 0, clientY: 0 });
  const isDraggingRef = useRef<boolean>(false);

  // Helper to get board-relative percentage coordinates (0 - 100%)
  const getBoardRelativeCoords = useCallback((clientX: number, clientY: number) => {
    if (!boardRef.current) return { x: 50, y: 50 };
    const rect = boardRef.current.getBoundingClientRect();
    const x = Math.max(5, Math.min(95, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(5, Math.min(95, ((clientY - rect.top) / rect.height) * 100));
    return { x, y };
  }, []);

  // Trigger Screen Shake
  const triggerScreenShake = () => {
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 400);
  };

  // Spawn Spark FX
  const spawnSparks = useCallback((x: number, y: number, color: string, count = 12) => {
    const newSparks: SparkParticle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = 1.5 + Math.random() * 3.5;
      newSparks.push({
        id: ++particleIdRef.current,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 3 + Math.random() * 4,
        alpha: 1,
      });
    }
    setSparks((prev) => [...prev, ...newSparks]);
  }, []);

  // Spawn Floating Text FX
  const spawnFloatingText = useCallback((text: string, x: number, y: number, color = '#FDE047') => {
    const newText: FloatingText = {
      id: ++particleIdRef.current,
      text,
      x,
      y,
      color,
      alpha: 1,
    };
    setFloatingTexts((prev) => [...prev, newText]);
  }, []);

  // Animate Sparks & Floating Text
  useEffect(() => {
    if (sparks.length === 0 && floatingTexts.length === 0) return;

    const timer = setInterval(() => {
      setSparks((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx * 0.3,
            y: p.y + p.vy * 0.3 + 0.15, // gravity
            alpha: p.alpha - 0.05,
          }))
          .filter((p) => p.alpha > 0)
      );

      setFloatingTexts((prev) =>
        prev
          .map((ft) => ({
            ...ft,
            y: ft.y - 0.8,
            alpha: ft.alpha - 0.04,
          }))
          .filter((ft) => ft.alpha > 0)
      );
    }, 30);

    return () => clearInterval(timer);
  }, [sparks.length, floatingTexts.length]);

  // ── EXACT CENTER-OF-MASS GRAVITY ALIGNMENT SIMULATION ──
  const calculatePlatePhysics = useCallback((plate: InterlockingPlate, currentScrews: ScrewPin[], boardHolesList: Hole[]) => {
    if (plate.isFallen) return plate;

    // Remaining screws pinning this plate
    const remainingScrewPins = currentScrews.filter(
      (s) => plate.screwHoles.includes(s.currentHoleId) && !s.currentHoleId.startsWith('box_')
    );

    // Case 1: 0 Screws -> FREE FALL GRAVITY (Preserve current rotation and pivot to prevent matrix jumps)
    if (remainingScrewPins.length === 0) {
      return {
        ...plate,
        isFallen: true,
        fallTranslateY: 620 + Math.random() * 80,
        fallRotate: (Math.random() - 0.5) * 35,
      };
    }

    // Case 2: Exactly 1 Screw -> NATURAL GRAVITY PIVOT SWING
    if (remainingScrewPins.length === 1) {
      const pivotScrew = remainingScrewPins[0];
      const pivotHole = boardHolesList.find((h) => h.id === pivotScrew.currentHoleId);

      if (pivotHole) {
        const xp = pivotHole.x;
        const yp = pivotHole.y;
        const xg = plate.centerOfMass.x;
        const yg = plate.centerOfMass.y;

        // Vector from pivot to center of mass
        const dx = xg - xp;
        const dy = yg - yp;

        // Initial angle in degrees (0 = horizontal right, 90 = straight down)
        const initialAngleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;

        // Downward gravity aims for +90 degrees
        let targetRotation = 90 - initialAngleDeg;
        while (targetRotation > 180) targetRotation -= 360;
        while (targetRotation < -180) targetRotation += 360;

        return {
          ...plate,
          currentRotation: targetRotation,
          pivotPoint: { x: xp, y: yp },
        };
      }
    }

    // Case 3: >= 2 Screws -> LOCKED RIGID
    return {
      ...plate,
      currentRotation: 0,
      pivotPoint: null,
    };
  }, []);

  // ── OCCLUSION / COVERED SCREW DETECTION ──
  const isScrewOccluded = useCallback((screwId: number, currentPlates: InterlockingPlate[], currentScrews: ScrewPin[]): boolean => {
    const targetScrew = currentScrews.find((s) => s.id === screwId);
    if (!targetScrew) return false;
    if (
      targetScrew.currentHoleId.startsWith('free_') ||
      targetScrew.currentHoleId.startsWith('extra_') ||
      targetScrew.currentHoleId.startsWith('box_')
    ) {
      return false;
    }

    // Check 1: Plate explicitly occludes this hole (via occludedHoles)
    const hasExplicitOcclusion = currentPlates.some(
      (p) => !p.isFallen && p.occludedHoles?.includes(targetScrew.currentHoleId)
    );
    if (hasExplicitOcclusion) return true;

    // Check 2: Multi-layer overlap where a higher-layer plate covers this hole
    const activePlatesAtHole = currentPlates.filter(
      (p) => !p.isFallen && p.screwHoles.includes(targetScrew.currentHoleId)
    );
    if (activePlatesAtHole.length > 1 && targetScrew.layer !== undefined) {
      const maxActiveLayer = Math.max(...activePlatesAtHole.map((p) => p.layer));
      if (maxActiveLayer > targetScrew.layer) return true;
    }

    return false;
  }, []);

  // Initialize level based on current 5-stage random campaign session
  const loadLevel = useCallback(
    (stageIdx: number, customSessionLevels?: number[]) => {
      const activeSession = customSessionLevels || sessionLevelIndices;
      const actualLevelIdx = activeSession[stageIdx % activeSession.length] ?? 0;
      const data = LEVELS[actualLevelIdx % LEVELS.length];
      setLevelData(data);
      setFreeHoles(JSON.parse(JSON.stringify(data.freeHoles)));
      setBoardHoles(JSON.parse(JSON.stringify(data.boardHoles)));
      setScrews(JSON.parse(JSON.stringify(data.screws)));

      // Initialize Moves
      const initialMoves = data.maxMoves || Math.max(25, data.screws.length + 10);
      setMovesLeft(initialMoves);

      // Initialize Boxes
      const initBoxes: ScrewBox[] = data.boxes.map((b, idx) => ({
        id: `box_${idx}`,
        color: b.color,
        colorNameKey: b.colorNameKey,
        capacity: b.capacity || 3,
        collectedCount: 0,
        isCompleted: false,
      }));
      setBoxes(initBoxes);
      setActiveBoxIndices(initBoxes.length > 0 ? [0] : []);

      // Initialize Plates with Physics (Deep-cloned to prevent in-place mutation on restart)
      const cleanPlates: InterlockingPlate[] = JSON.parse(JSON.stringify(data.plates));
      const initialPlates = cleanPlates.map((p) => {
        p.isFallen = false;
        p.fallTranslateY = 0;
        p.fallRotate = 0;
        p.currentRotation = 0;
        p.pivotPoint = null;
        return calculatePlatePhysics(p, data.screws, [...data.freeHoles, ...data.boardHoles]);
      });
      setPlates(initialPlates);

      setSelectedScrewId(null);
      setDraggedScrewId(null);
      setHoveredTargetId(null);
      setHistory([]);
      setExtraHolesUnlocked(0);
      setHammerActive(false);
      setShowWinModal(false);
      setShowLoseModal(false);
      setTimeLeft(data.targetTime || GAME_TIME_LIMIT_SECONDS);
      setGameRunKey((k) => k + 1); // Triggers clean countdown timer interval restart
      setIsDeadlocked(false);
      if (deadlockTimerRef.current) {
        clearTimeout(deadlockTimerRef.current);
        deadlockTimerRef.current = null;
      }
      setUsedHammerCount(0);
      setSparks([]);
      setFloatingTexts([]);
      setFlyingScrews([]);
      completedFlightIdsRef.current.clear();
      inFlightScrewIdsRef.current.clear();
      inFlightTargetHoleIdsRef.current.clear();
      autoCollectingScrewIdsRef.current.clear();

      // ── START 1-SECOND LUXURY GAME ENTRY LOADING TRANSITION (ONLY ONCE ON INITIAL ENTRY) ──
      if (!hasLoadedGameOnceRef.current) {
        hasLoadedGameOnceRef.current = true;
        setIsLoadingLevel(true);
        setLoadingProgress(0);

        if (loadingTimerRef.current) {
          clearTimeout(loadingTimerRef.current);
          loadingTimerRef.current = null;
        }
        if (loadingProgressIntervalRef.current) {
          clearInterval(loadingProgressIntervalRef.current);
          loadingProgressIntervalRef.current = null;
        }

        const startTime = Date.now();
        const loadingDuration = 1000; // Exact 1-second duration

        loadingProgressIntervalRef.current = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(100, Math.round((elapsed / loadingDuration) * 100));
          setLoadingProgress(progress);
        }, 25);

        loadingTimerRef.current = setTimeout(() => {
          if (loadingProgressIntervalRef.current) {
            clearInterval(loadingProgressIntervalRef.current);
            loadingProgressIntervalRef.current = null;
          }
          setLoadingProgress(100);
          setIsLoadingLevel(false);
        }, 1000);
      } else {
        setIsLoadingLevel(false);
      }

      try {
        localStorage.setItem('screw_session_stage', String(stageIdx));
        localStorage.setItem('screw_session_levels', JSON.stringify(activeSession));
      } catch {}
    },
    [calculatePlatePhysics, sessionLevelIndices]
  );

  useEffect(() => {
    loadLevel(currentStageIndex);
  }, [currentStageIndex, loadLevel]);

  // Clean up timers on component unmount
  useEffect(() => {
    return () => {
      if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
      if (loadingProgressIntervalRef.current) clearInterval(loadingProgressIntervalRef.current);
      if (deadlockTimerRef.current) clearTimeout(deadlockTimerRef.current);
    };
  }, []);

  // ── COUNTDOWN TIMER LOOP (PAUSES DURING 1S LOADING & RESTARTS FRESH ON GAMERUNKEY) ──
  useEffect(() => {
    if (showWinModal || showLoseModal || isLoadingLevel) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setShowLoseModal(true);
          setLoseReason('timeout');
          GameSounds.playLose();
          GameSounds.triggerHaptic('error');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showWinModal, showLoseModal, isLoadingLevel, gameRunKey]);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    GameSounds.setMuted(!next);
  };

  const allHoles = [...freeHoles, ...boardHoles];

  // Helper to check if a hole is occupied by a screw
  const getScrewInHole = (holeId: string) => {
    return screws.find((s) => s.currentHoleId === holeId);
  };

  // ── RE-EVALUATE PHYSICS & CHECK WIN ──
  const evaluateGameState = useCallback(
    (currentScrews: ScrewPin[], currentBoxes: ScrewBox[]) => {
      let latestPlates: InterlockingPlate[] = [];

      // 1. Update Plates Physics (Swing / Fall)
      setPlates((prevPlates) => {
        let anyPlateFell = false;

        const updated = prevPlates.map((plate) => {
          const nextP = calculatePlatePhysics(plate, currentScrews, allHoles);
          if (!plate.isFallen && nextP.isFallen) {
            anyPlateFell = true;
          }
          return nextP;
        });
        latestPlates = updated;

        if (anyPlateFell) {
          GameSounds.playChestOpen();
          try {
            if (navigator.vibrate) navigator.vibrate([40, 60, 40]);
          } catch {}
          triggerScreenShake();

          // Check if any previously occluded screw is now unlocked
          currentScrews.forEach((screw) => {
            const wasOccluded = isScrewOccluded(screw.id, prevPlates, currentScrews);
            const isNowOccluded = isScrewOccluded(screw.id, updated, currentScrews);
            if (wasOccluded && !isNowOccluded) {
              const h = allHoles.find((hole) => hole.id === screw.currentHoleId);
              if (h) {
                spawnSparks(h.x, h.y, '#FBBF24', 12);
                spawnFloatingText(t('games.screw.fx_screw_unlocked'), h.x, h.y, '#FBBF24');
              }
            }
          });

          // Check if ALL plates have fallen -> Level Complete!
          const allFallen = updated.every((p) => p.isFallen);
          if (allFallen) {
            setTimeout(() => {
              let stars = 1;
              const usedTime = levelData.targetTime - timeLeft;
              const isFast = usedTime <= levelData.targetTime * 0.6;
              const noHammer = usedHammerCount === 0;

              if (isFast && noHammer) {
                stars = 3;
              } else if (noHammer || isFast) {
                stars = 2;
              }
              setEarnedStars(stars);

              const base = 100 + (currentStageIndex + 1) * 20;
              const timeBonus = Math.max(0, Math.floor(timeLeft * 2));
              const masterBonus = stars === 3 ? 50 : 0;
              const total = base + timeBonus + masterBonus;

              setRewardBreakdown({ base, timeBonus, masterBonus, total });
              setShowWinModal(true);
              GameSounds.playWinFanfare();

              try {
                if (navigator.vibrate) navigator.vibrate([100, 50, 150, 50, 200]);
              } catch {}
            }, 700);
          }
        }

        return updated;
      });

      // 2. Deadlock Detection & Trigger Lose Modal (Strict & Accurate)
      // Nếu có ốc đang bay hoặc chuẩn bị bay -> Đang có chuyển động, tuyệt đối KHÔNG deadlock
      if (flyingScrews.length > 0 || inFlightScrewIdsRef.current.size > 0) {
        setIsDeadlocked(false);
        if (deadlockTimerRef.current) {
          clearTimeout(deadlockTimerRef.current);
          deadlockTimerRef.current = null;
        }
        return;
      }

      // Nếu tất cả các tấm đã rơi hoặc tất cả khay đã hoàn thành -> Không deadlock
      const allPlatesFallen = latestPlates.length > 0 ? latestPlates.every((p) => p.isFallen) : plates.every((p) => p.isFallen);
      const allBoxesCompleted = currentBoxes.every((b) => b.isCompleted);
      if (allPlatesFallen || allBoxesCompleted) {
        setIsDeadlocked(false);
        if (deadlockTimerRef.current) {
          clearTimeout(deadlockTimerRef.current);
          deadlockTimerRef.current = null;
        }
        return;
      }

      // Xác định khay mở hiện tại (hoặc khay chưa hoàn thành kế tiếp)
      const currentActiveBox = currentBoxes.find((b, idx) => activeBoxIndices.includes(idx) && !b.isCompleted) 
        || currentBoxes.find((b) => !b.isCompleted);

      if (!currentActiveBox) {
        setIsDeadlocked(false);
        if (deadlockTimerRef.current) {
          clearTimeout(deadlockTimerRef.current);
          deadlockTimerRef.current = null;
        }
        return;
      }

      const activeTargetColor = currentActiveBox.color;

      // Đếm số lượng ốc đang nằm trong lỗ chờ tạm (buffer slots)
      const bufferScrews = currentScrews.filter(
        (s) => (s.currentHoleId.startsWith('free_') || s.currentHoleId.startsWith('extra_')) && !s.currentHoleId.startsWith('flying_')
      );
      const freeHolesOccupied = bufferScrews.length;
      const totalFreeHoles = freeHoles.length;

      // Nếu vẫn còn ít nhất 1 lỗ chờ trống -> Người chơi vẫn tháo tiếp được -> Không deadlock
      if (freeHolesOccupied < totalFreeHoles) {
        setIsDeadlocked(false);
        if (deadlockTimerRef.current) {
          clearTimeout(deadlockTimerRef.current);
          deadlockTimerRef.current = null;
        }
        return;
      }

      // Khi toàn bộ lỗ chờ đã kín:
      // Kiểm tra 1: Có con ốc nào trong lỗ chờ cùng màu với khay đang mở không? (Nếu có -> Tự động hút vào khay)
      const hasMovableBufferScrew = bufferScrews.some((s) => s.color === activeTargetColor);

      // Kiểm tra 2: Có con ốc nào trên bàn cờ chưa bị đè cùng màu với khay đang mở không? (Nếu có -> Người chơi bấm tháo vào khay được)
      const checkPlates = latestPlates.length > 0 ? latestPlates : plates;
      const unoccludedBoardScrews = currentScrews.filter(
        (s) =>
          !s.currentHoleId.startsWith('free_') &&
          !s.currentHoleId.startsWith('extra_') &&
          !s.currentHoleId.startsWith('box_') &&
          !s.currentHoleId.startsWith('flying_') &&
          !isScrewOccluded(s.id, checkPlates, currentScrews)
      );
      const hasMovableBoardScrew = unoccludedBoardScrews.some((s) => s.color === activeTargetColor);

      const isReallyDeadlocked = !hasMovableBufferScrew && !hasMovableBoardScrew;
      setIsDeadlocked(isReallyDeadlocked);

      if (isReallyDeadlocked) {
        if (!deadlockTimerRef.current) {
          deadlockTimerRef.current = setTimeout(() => {
            setShowLoseModal(true);
            setLoseReason('deadlock');
            GameSounds.playLose();
            GameSounds.triggerHaptic('error');
          }, 1200);
        }
      } else {
        if (deadlockTimerRef.current) {
          clearTimeout(deadlockTimerRef.current);
          deadlockTimerRef.current = null;
        }
      }
    },
    [activeBoxIndices, allHoles, calculatePlatePhysics, currentStageIndex, freeHoles.length, isScrewOccluded, levelData.targetTime, plates, timeLeft, usedHammerCount, flyingScrews.length]
  );

  // ── COMPLETE FLYING SCREW FLIGHT & TOUCHDOWN ──
  const completeScrewFlight = useCallback(
    (flight: ActiveFlyingScrew) => {
      // Prevent double completion invocation
      if (completedFlightIdsRef.current.has(flight.id)) return;
      completedFlightIdsRef.current.add(flight.id);

      GameSounds.playTap();
      try {
        if (navigator.vibrate) navigator.vibrate(15);
      } catch {}

      let updatedBoxes: ScrewBox[] = [];

      setBoxes((prevBoxes) => {
        const nextBoxes = prevBoxes.map((b, idx) => {
          if (flight.targetType === 'BOX' && flight.boxIdx === idx) {
            const newCount = Math.min(b.capacity, b.collectedCount + 1);
            const isNowCompleted = newCount === b.capacity;
            return {
              ...b,
              collectedCount: newCount,
              isCompleted: isNowCompleted,
            };
          }
          return b;
        });
        updatedBoxes = nextBoxes;

        if (flight.targetType === 'BOX' && flight.boxIdx !== undefined) {
          const targetBox = nextBoxes[flight.boxIdx];
          spawnSparks(flight.toX, flight.toY, targetBox.color, 14);
          spawnFloatingText(t('games.screw.fx_pin_collected'), flight.toX, flight.toY, targetBox.color);

          if (targetBox.isCompleted && !prevBoxes[flight.boxIdx].isCompleted) {
            GameSounds.playWinFanfare();
            spawnFloatingText(t('games.screw.box_packed'), 50, 8, '#FBBF24');

            setActiveBoxIndices((prevActive) => {
              const remainingInactive = nextBoxes
                .map((b, i) => (!b.isCompleted && !prevActive.includes(i) ? i : -1))
                .filter((i) => i >= 0);

              if (remainingInactive.length > 0) {
                return [remainingInactive[0]];
              }
              return prevActive;
            });
          }
        }

        return nextBoxes;
      });

      setScrews((prevScrews) => {
        let nextScrews = [...prevScrews];
        if (flight.targetType === 'BOX' && flight.boxIdx !== undefined) {
          const sIdx = flight.slotIdx !== undefined ? flight.slotIdx : 0;
          nextScrews = nextScrews.map((s) =>
            s.id === flight.screwId ? { ...s, currentHoleId: `box_${flight.boxIdx}_${sIdx}` } : s
          );
        } else {
          nextScrews = nextScrews.map((s) =>
            s.id === flight.screwId ? { ...s, currentHoleId: flight.targetId } : s
          );
          spawnSparks(flight.toX, flight.toY, flight.color, 10);
          spawnFloatingText(t('games.screw.fx_locked_in'), flight.toX, flight.toY, '#38BDF8');
        }

        evaluateGameState(nextScrews, updatedBoxes.length > 0 ? updatedBoxes : boxes);
        return nextScrews;
      });

      // Remove completed flight from in-flight lock refs and state
      inFlightScrewIdsRef.current.delete(flight.screwId);
      if (flight.targetType === 'HOLE') {
        inFlightTargetHoleIdsRef.current.delete(flight.targetId);
      }
      setFlyingScrews((prev) => prev.filter((f) => f.id !== flight.id));
    },
    [boxes, evaluateGameState, spawnFloatingText, spawnSparks, t]
  );

  // ── FLYING SCREWS RAF LOOP ──
  useEffect(() => {
    if (flyingScrews.length === 0) return;

    let animFrameId: number;
    const loop = () => {
      const now = performance.now();
      setFlightTime(now);

      const completed = flyingScrews.filter(
        (f) => now - f.startTime >= f.duration && !completedFlightIdsRef.current.has(f.id)
      );
      if (completed.length > 0) {
        completed.forEach((f) => completeScrewFlight(f));
      }

      if (flyingScrews.some((f) => !completedFlightIdsRef.current.has(f.id))) {
        animFrameId = requestAnimationFrame(loop);
      }
    };

    animFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameId);
  }, [flyingScrews, completeScrewFlight]);

  // ── MOVE SCREW TO TOP BOX OR BUFFER HOLE WITH SMOOTH PARABOLIC ARC FLIGHT ──
  const transferScrew = (screwId: number, targetType: 'BOX' | 'HOLE', targetId: string, isAuto = false) => {
    // 1. Anti-spam / Anti-race condition lock
    if (inFlightScrewIdsRef.current.has(screwId)) return;
    if (flyingScrews.some((f) => f.screwId === screwId)) return;

    const targetScrew = screws.find((s) => s.id === screwId);
    if (!targetScrew) return;

    // Immediately lock screw and target hole
    inFlightScrewIdsRef.current.add(screwId);
    if (targetType === 'HOLE') {
      inFlightTargetHoleIdsRef.current.add(targetId);
    }

    // Save history for Undo (chỉ khi người chơi manual thao tác)
    if (!isAuto) {
      setHistory((prev) => [
        ...prev,
        {
          screws: JSON.parse(JSON.stringify(screws)),
          plates: JSON.parse(JSON.stringify(plates)),
          boxes: JSON.parse(JSON.stringify(boxes)),
          activeBoxIndices: [...activeBoxIndices],
          movesLeft,
        },
      ]);

      const nextMoves = Math.max(0, movesLeft - 1);
      setMovesLeft(nextMoves);

      if (nextMoves === 0) {
        setTimeout(() => {
          setPlates((curPlates) => {
            if (!curPlates.every((p) => p.isFallen)) {
              setShowLoseModal(true);
              setLoseReason('moves');
              GameSounds.playLose();
              GameSounds.triggerHaptic('error');
            }
            return curPlates;
          });
        }, 700);
      }
    }

    GameSounds.playTap();
    try {
      if (navigator.vibrate) navigator.vibrate([15, 30]);
    } catch {}

    // Determine Source Coordinates (fromX, fromY)
    let fromX = 50;
    let fromY = 50;
    const sourceHole = allHoles.find((h) => h.id === targetScrew.currentHoleId);
    if (sourceHole) {
      fromX = sourceHole.x;
      fromY = sourceHole.y;
    } else if (dragPos.x && dragPos.y) {
      fromX = dragPos.x;
      fromY = dragPos.y;
    }

    // Determine Target Coordinates (toX, toY)
    let toX = 50;
    let toY = 50;
    let targetBoxIdx: number | undefined;
    let targetSlotIdx: number | undefined;

    if (targetType === 'BOX') {
      targetBoxIdx = parseInt(targetId.replace('box_', ''), 10);
      const box = boxes[targetBoxIdx];
      if (!box) {
        inFlightScrewIdsRef.current.delete(screwId);
        return;
      }

      const activeIdx = activeBoxIndices.indexOf(targetBoxIdx);
      const totalActive = activeBoxIndices.length;
      const boxCenterX = totalActive === 1 ? 24 : activeIdx === 0 ? 25 : 75;

      // Count screws currently flying to this box to assign slot index safely
      const flyingToThisBox = flyingScrews.filter((f) => f.targetType === 'BOX' && f.boxIdx === targetBoxIdx).length;
      targetSlotIdx = Math.min(box.capacity - 1, box.collectedCount + flyingToThisBox);
      toX = boxCenterX + (targetSlotIdx - (box.capacity - 1) / 2) * 5.8;
      toY = 6.0;

      if (isAuto) {
        spawnFloatingText(t('games.screw.fx_auto_collect'), fromX, fromY - 4, targetScrew.color);
      }
    } else {
      const targetHole = allHoles.find((h) => h.id === targetId);
      if (targetHole) {
        toX = targetHole.x;
        toY = targetHole.y;
      }
    }

    // Spawn subtle unscrew sparks at source
    spawnSparks(fromX, fromY, targetScrew.color, 6);

    // Immediately detach screw from plate by marking temporary flying hole ID
    const tempScrews = screws.map((s) =>
      s.id === screwId ? { ...s, currentHoleId: `flying_${screwId}` } : s
    );
    setScrews(tempScrews);
    setSelectedScrewId(null);

    // Trigger slow, heavy metal plate tilting / swinging physics immediately
    evaluateGameState(tempScrews, boxes);

    // Launch smooth 3D parabolic flying screw
    const newFlight: ActiveFlyingScrew = {
      id: ++flightIdRef.current,
      screwId,
      color: targetScrew.color,
      fromX,
      fromY,
      toX,
      toY,
      startTime: performance.now(),
      duration: 420,
      targetType,
      targetId,
      boxIdx: targetBoxIdx,
      slotIdx: targetSlotIdx,
    };

    setFlyingScrews((prev) => [...prev, newFlight]);
  };

  // ── AUTO-COLLECT BUFFER SCREWS INTO MATCHING ACTIVE BOX ──
  useEffect(() => {
    if (isLoadingLevel || showWinModal || showLoseModal) return;

    // Xác định khay active chưa hoàn thành (hoặc khay tiếp theo nếu activeBoxIndices chưa kịp cập nhật)
    const activeIdxCandidate = activeBoxIndices.find((idx) => boxes[idx] && !boxes[idx].isCompleted);
    const boxIdx = activeIdxCandidate !== undefined ? activeIdxCandidate : boxes.findIndex((b) => !b.isCompleted);
    if (boxIdx === -1) return;

    const box = boxes[boxIdx];
    if (!box || box.isCompleted) return;

    const flyingToThisBox = flyingScrews.filter((f) => f.targetType === 'BOX' && f.boxIdx === boxIdx).length;
    const availableCapacity = box.capacity - (box.collectedCount + flyingToThisBox);
    if (availableCapacity <= 0) return;

    // Tìm ốc đang ở lỗ buffer (free_* hoặc extra_*) có cùng màu với khay này và chưa bay
    const matchingBufferScrews = screws.filter(
      (s) =>
        (s.currentHoleId.startsWith('free_') || s.currentHoleId.startsWith('extra_')) &&
        !s.currentHoleId.startsWith('flying_') &&
        s.color === box.color &&
        !flyingScrews.some((f) => f.screwId === s.id) &&
        !inFlightScrewIdsRef.current.has(s.id) &&
        !autoCollectingScrewIdsRef.current.has(s.id)
    );

    if (matchingBufferScrews.length > 0) {
      const screwToCollect = matchingBufferScrews[0];
      autoCollectingScrewIdsRef.current.add(screwToCollect.id);
      const timer = setTimeout(() => {
        autoCollectingScrewIdsRef.current.delete(screwToCollect.id);
        transferScrew(screwToCollect.id, 'BOX', `box_${boxIdx}`, true);
      }, 150);
      return () => {
        clearTimeout(timer);
        autoCollectingScrewIdsRef.current.delete(screwToCollect.id);
      };
    }
  }, [activeBoxIndices, boxes, screws, flyingScrews, isLoadingLevel, showWinModal, showLoseModal]);

  // Handle Screw Tap / Auto-fly to Matching Box
  const handleScrewClick = (screwId: number) => {
    if (inFlightScrewIdsRef.current.has(screwId)) return;
    if (flyingScrews.some((f) => f.screwId === screwId)) return;

    if (hammerActive) {
      GameSounds.playChestOpen();
      try {
        if (navigator.vibrate) navigator.vibrate(80);
      } catch {}

      const targetScrew = screws.find((s) => s.id === screwId);
      const targetHole = allHoles.find((h) => h.id === targetScrew?.currentHoleId);
      if (targetHole) {
        spawnSparks(targetHole.x, targetHole.y, '#EF4444', 20);
        spawnFloatingText(t('games.screw.fx_hammer_smash'), targetHole.x, targetHole.y, '#EF4444');
      }

      setHistory((prev) => [
        ...prev,
        {
          screws: JSON.parse(JSON.stringify(screws)),
          plates: JSON.parse(JSON.stringify(plates)),
          boxes: JSON.parse(JSON.stringify(boxes)),
          activeBoxIndices: [...activeBoxIndices],
          movesLeft,
        },
      ]);

      const nextScrews = screws.filter((s) => s.id !== screwId);
      setScrews(nextScrews);
      setHammerActive(false);
      setUsedHammerCount((c) => c + 1);
      evaluateGameState(nextScrews, boxes);
      return;
    }

    const clickedScrew = screws.find((s) => s.id === screwId);
    if (!clickedScrew) return;

    // Check if screw is occluded by upper plates
    if (isScrewOccluded(screwId, plates, screws)) {
      GameSounds.triggerHaptic('error');
      GameSounds.playTap();
      const hole = allHoles.find((h) => h.id === clickedScrew.currentHoleId);
      spawnFloatingText(t('games.screw.fx_screw_blocked_tip'), hole?.x ?? 50, hole?.y ?? 50, '#EF4444');
      return;
    }

    // Check if there is an active matching top box with room (including flying screws)
    const matchingBoxIdx = activeBoxIndices.find((idx) => {
      const b = boxes[idx];
      if (!b || b.color !== clickedScrew.color) return false;
      const flyingToThisBox = flyingScrews.filter((f) => f.targetType === 'BOX' && f.boxIdx === idx).length;
      return b.collectedCount + flyingToThisBox < b.capacity;
    });

    if (matchingBoxIdx !== undefined) {
      transferScrew(screwId, 'BOX', `box_${matchingBoxIdx}`);
      return;
    }

    // Otherwise, check if there is an empty buffer hole (excluding in-flight target holes)
    const firstEmptyBufferHole = freeHoles.find(
      (h) =>
        !screws.some((s) => s.currentHoleId === h.id) &&
        !flyingScrews.some((f) => f.targetType === 'HOLE' && f.targetId === h.id) &&
        !inFlightTargetHoleIdsRef.current.has(h.id)
    );
    if (firstEmptyBufferHole && !clickedScrew.currentHoleId.startsWith('free_') && !clickedScrew.currentHoleId.startsWith('extra_')) {
      transferScrew(screwId, 'HOLE', firstEmptyBufferHole.id);
      return;
    }

    // Toggle selection
    GameSounds.playTap();
    if (selectedScrewId === screwId) {
      setSelectedScrewId(null);
    } else {
      setSelectedScrewId(screwId);
    }
  };

  // ── DRAG & DROP POINTER HANDLERS ──
  const handleScrewPointerDown = (e: React.PointerEvent, screwId: number, currentHole: Hole) => {
    if (inFlightScrewIdsRef.current.has(screwId)) return;
    if (flyingScrews.some((f) => f.screwId === screwId)) return;

    if (hammerActive) {
      handleScrewClick(screwId);
      return;
    }

    if (isScrewOccluded(screwId, plates, screws)) {
      GameSounds.triggerHaptic('error');
      GameSounds.playTap();
      spawnFloatingText(t('games.screw.fx_screw_blocked_tip'), currentHole.x, currentHole.y, '#EF4444');
      return;
    }

    if (e.button !== 0) return;

    e.preventDefault();
    e.stopPropagation();

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}

    dragStartPosRef.current = { clientX: e.clientX, clientY: e.clientY };
    isDraggingRef.current = false;
    setDraggedScrewId(screwId);
    setDragPos({ x: currentHole.x, y: currentHole.y });
    setHoveredTargetId(null);

    try {
      if (navigator.vibrate) navigator.vibrate(12);
    } catch {}
  };

  const handleBoardPointerMove = (e: React.PointerEvent) => {
    if (draggedScrewId === null) return;
    e.preventDefault();

    const dx = e.clientX - dragStartPosRef.current.clientX;
    const dy = e.clientY - dragStartPosRef.current.clientY;
    if (Math.hypot(dx, dy) > 5) {
      isDraggingRef.current = true;
    }

    const { x, y } = getBoardRelativeCoords(e.clientX, e.clientY);
    setDragPos({ x, y });

    const draggedScrew = screws.find((s) => s.id === draggedScrewId);
    if (!draggedScrew) return;

    // Check if near top boxes (y < 18%)
    if (y < 18) {
      const activeBoxes = activeBoxIndices
        .map((idx) => ({ idx, box: boxes[idx] }))
        .filter(({ box }) => box && box.color === draggedScrew.color && box.collectedCount < box.capacity);

      if (activeBoxes.length > 0) {
        setHoveredTargetId(`box_${activeBoxes[0].idx}`);
        return;
      }
    }

    // Check closest empty free buffer hole
    let closestTargetId: string | null = null;
    let minDistance = 10;

    freeHoles.forEach((h) => {
      const isOccupied =
        screws.some((s) => s.currentHoleId === h.id && s.id !== draggedScrewId) ||
        flyingScrews.some((f) => f.targetType === 'HOLE' && f.targetId === h.id) ||
        inFlightTargetHoleIdsRef.current.has(h.id);
      if (!isOccupied) {
        const d = Math.hypot(h.x - x, h.y - y);
        if (d < minDistance) {
          minDistance = d;
          closestTargetId = h.id;
        }
      }
    });

    setHoveredTargetId(closestTargetId);
  };

  const handleBoardPointerUp = (e: React.PointerEvent) => {
    if (draggedScrewId === null) return;
    e.preventDefault();

    const screwId = draggedScrewId;
    const targetId = hoveredTargetId;
    const wasDragging = isDraggingRef.current;

    setDraggedScrewId(null);
    setHoveredTargetId(null);
    isDraggingRef.current = false;

    if (inFlightScrewIdsRef.current.has(screwId)) return;

    if (wasDragging) {
      if (targetId) {
        if (targetId.startsWith('box_')) {
          transferScrew(screwId, 'BOX', targetId);
        } else {
          transferScrew(screwId, 'HOLE', targetId);
        }
      }
    } else {
      handleScrewClick(screwId);
    }
  };

  // Booster: Add 1 Extra Hole
  const handleAddHole = () => {
    if (extraHolesUnlocked >= 2) return;
    GameSounds.playFiftyFifty();
    try {
      if (navigator.vibrate) navigator.vibrate([30, 30]);
    } catch {}

    const newHoleId = `extra_${extraHolesUnlocked + 1}`;
    const xPos = 92 - extraHolesUnlocked * 10;
    setFreeHoles((prev) => [...prev, { id: newHoleId, x: xPos, y: 22, isExtra: true }]);
    setExtraHolesUnlocked((c) => c + 1);
    setIsDeadlocked(false);
    setShowLoseModal(false);
    if (deadlockTimerRef.current) {
      clearTimeout(deadlockTimerRef.current);
      deadlockTimerRef.current = null;
    }
    spawnFloatingText(t('games.screw.fx_slot_added'), xPos, 22, '#F59E0B');
  };

  // ── TURN & POINTS MANAGEMENT HANDLERS ──
  // Dùng 1 lượt chơi để cứu thua & tiếp tục ván đấu
  const handleUseTurnToRescue = () => {
    if (turns <= 0) {
      setToastMessage({ text: t('games.screw.no_turns_badge'), color: '#EF4444' });
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    GameSounds.playFiftyFifty();
    try {
      if (navigator.vibrate) navigator.vibrate([40, 40]);
    } catch {}
    updateTurnsState(turns - 1);
    if (loseReason === 'moves') {
      setMovesLeft((prev) => prev + 10);
    } else {
      handleAddHole();
    }
    setShowLoseModal(false);
    setIsDeadlocked(false);
    spawnFloatingText(t('games.screw.fx_turn_consumed'), 50, 20, '#EF4444');
  };

  // Chơi lại màn bằng 1 lượt
  const handleRetryWithTurn = () => {
    if (turns <= 0) {
      setToastMessage({ text: t('games.screw.no_turns_badge'), color: '#EF4444' });
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    GameSounds.playTap();
    try {
      if (navigator.vibrate) navigator.vibrate(30);
    } catch {}
    updateTurnsState(turns - 1);
    setShowLoseModal(false);
    loadLevel(currentStageIndex);
    spawnFloatingText(t('games.screw.fx_turn_consumed'), 50, 20, '#EF4444');
  };

  // Mua thêm lượt chơi bằng điểm thưởng
  const handleBuyTurns = (amount: number, cost: number) => {
    if (points < cost) {
      GameSounds.triggerHaptic('error');
      setToastMessage({ text: t('games.screw.insufficient_points_toast', { points: cost }), color: '#EF4444' });
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    GameSounds.playWinFanfare();
    try {
      if (navigator.vibrate) navigator.vibrate([40, 40]);
    } catch {}
    updatePointsState(points - cost, cost);
    const nextTurns = turns + amount;
    updateTurnsState(nextTurns);
    spawnFloatingText(t('games.screw.fx_turn_bought'), 50, 20, '#10B981');
    spawnFloatingText(t('games.screw.fx_points_deducted', { points: cost }), 50, 30, '#F59E0B');
    setShowBuyTurnsModal(false);

    if (sessionToken) {
      loyaltyApi.inGameCheckout({
        sessionToken,
        gameCode: 'SCREW_PUZZLE',
        itemType: amount >= 3 ? 'TURN_TRIPLE' : 'TURN_SINGLE',
        amount: cost,
        externalUserId: userId,
      }).then((res) => {
        if (res) {
          if (typeof res.remainingPointBalance === 'number') setPoints(res.remainingPointBalance);
          if (typeof res.totalTurnsAvailable === 'number') updateTurnsState(res.totalTurnsAvailable);
        }
      }).catch(() => {});
    }

    // Nếu đang mở Lose Modal do Deadlock -> Tự động cứu thua luôn!
    if (showLoseModal) {
      if (loseReason === 'moves') {
        setMovesLeft((prev) => prev + 10);
      } else {
        handleAddHole();
      }
      setShowLoseModal(false);
      setIsDeadlocked(false);
    }
  };

  // Cứu thua khẩn cấp bằng điểm (+1 Slot)
  const handleEmergencySlotBuy = (cost: number = 30) => {
    if (points < cost) {
      GameSounds.triggerHaptic('error');
      setToastMessage({ text: t('games.screw.insufficient_points_toast', { points: cost }), color: '#EF4444' });
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    GameSounds.playFiftyFifty();
    try {
      if (navigator.vibrate) navigator.vibrate([40, 40]);
    } catch {}
    updatePointsState(points - cost, cost);
    if (loseReason === 'moves') {
      setMovesLeft((prev) => prev + 8);
    } else {
      handleAddHole();
    }
    setShowLoseModal(false);
    setIsDeadlocked(false);
    spawnFloatingText(t('games.screw.fx_slot_added'), 50, 20, '#F59E0B');
    spawnFloatingText(t('games.screw.fx_points_deducted', { points: cost }), 50, 30, '#EF4444');

    if (sessionToken) {
      loyaltyApi.inGameCheckout({
        sessionToken,
        gameCode: 'SCREW_PUZZLE',
        itemType: 'EXTRA_HOLE',
        amount: cost,
        externalUserId: userId,
      }).catch(() => {});
    }
  };

  // Booster: Undo Last Move
  const handleUndo = () => {
    if (history.length === 0) return;
    GameSounds.playTap();
    try {
      if (navigator.vibrate) navigator.vibrate(20);
    } catch {}

    const lastState = history[history.length - 1];
    setScrews(lastState.screws);
    setPlates(lastState.plates);
    setBoxes(lastState.boxes);
    if (lastState.activeBoxIndices) {
      setActiveBoxIndices(lastState.activeBoxIndices);
    }
    if (lastState.movesLeft !== undefined) {
      setMovesLeft(lastState.movesLeft);
    }
    setHistory((prev) => prev.slice(0, -1));
    setSelectedScrewId(null);
    setIsDeadlocked(false);
    setShowLoseModal(false);
    inFlightScrewIdsRef.current.clear();
    inFlightTargetHoleIdsRef.current.clear();
    autoCollectingScrewIdsRef.current.clear();
    completedFlightIdsRef.current.clear();
    setFlyingScrews([]);
    if (deadlockTimerRef.current) {
      clearTimeout(deadlockTimerRef.current);
      deadlockTimerRef.current = null;
    }
  };

  // Booster: Hammer Mode
  const toggleHammer = () => {
    GameSounds.playTap();
    setHammerActive((prev) => !prev);
    setSelectedScrewId(null);
  };

  // Claim Reward and Advance Stage (5-Stage Random Campaign)
  const claimReward = () => {
    setShowWinModal(false);
    if (onClaimReward) {
      onClaimReward(rewardBreakdown.total);
    }
    if (sessionToken) {
      loyaltyApi.submitGameResult({
        gameCode: 'SCREW_PUZZLE',
        sessionToken,
        score: currentStageIndex + 1,
        details: JSON.stringify({
          stars: earnedStars,
          stage: currentStageIndex + 1,
          stageReward: rewardBreakdown.total,
          timeLeft,
          usedHammer: usedHammerCount,
        }),
        externalUserId: userId,
      }).then((res) => {
        if (res && typeof res.newPointBalance === 'number') {
          setPoints(res.newPointBalance);
        }
      }).catch(() => {});
    }
    if (currentStageIndex < TOTAL_SESSION_STAGES - 1) {
      const nextStage = currentStageIndex + 1;
      setCurrentStageIndex(nextStage);
      loadLevel(nextStage);
    } else {
      // Completed full 5-stage tournament! Generate fresh random 5-level session
      const newSession = generateRandomSessionLevelIndices(LEVELS.length, TOTAL_SESSION_STAGES);
      setSessionLevelIndices(newSession);
      setCurrentStageIndex(0);
      loadLevel(0, newSession);
    }
  };

  const remainingPlatesCount = plates.filter((p) => !p.isFallen).length;

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans select-none overflow-x-hidden">
      {/* ── TOP HEADER ── */}
      <GameHeader
        title={t('games.screw.title')}
        onBack={onBack}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
        onRestart={() => {
          GameSounds.playTap();
          try {
            if (navigator.vibrate) navigator.vibrate(20);
          } catch {}
          loadLevel(currentStageIndex);
        }}
        onHelp={() => setShowTutorial(true)}
      />

      {/* ── MAIN CONTENT AREA ── */}
      <main className="flex-1 max-w-lg mx-auto w-full px-3 py-2 flex flex-col items-center justify-between gap-2">
        {/* ── STATUS & DASHBOARD BAR (RESPONSIVE 2-TIER LAYOUT) ── */}
        <div
          className={`w-full ${activeTheme.statusBg} backdrop-blur-md rounded-2xl border ${
            activeTheme.boardBorder
          } p-2.5 sm:p-3 shadow-lg transition-all space-y-2`}
        >
          {/* Row 1: Level Identifier & User Loyalty Balance */}
          <div className="flex items-center justify-between gap-2">
            {/* Level Pill */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800/90 border border-slate-700/80 shadow-xs min-w-0">
              <span className="text-base shrink-0">{levelData.artIcon}</span>
              <span className="text-xs font-black text-amber-300 uppercase tracking-wide shrink-0">
                {t('games.screw.level_label', { level: currentStageIndex + 1, total: TOTAL_SESSION_STAGES })}:
              </span>
              <span className="text-xs font-bold text-white truncate">
                {t(levelData.artNameKey)}
              </span>
            </div>

            {/* Turns & Points Group */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Turns Button */}
              <button
                onClick={() => setShowBuyTurnsModal(true)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-black shadow-xs active:scale-95 transition"
                title={t('games.screw.turns_label')}
              >
                <span>🎟️</span>
                <span className="font-mono font-bold">{turns}</span>
                <span className="text-[10px] text-amber-400 font-bold bg-amber-500/30 w-3.5 h-3.5 rounded-full flex items-center justify-center">+</span>
              </button>

              {/* Points Badge */}
              <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200 text-xs font-mono font-bold">
                <span>💎</span>
                <span>{points.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Row 2: 3-Column Metrics Grid (Balanced & Never Squished) */}
          <div className="grid grid-cols-3 gap-1.5">
            {/* Moves Left Badge */}
            <div
              className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all ${
                movesLeft <= 5
                  ? 'bg-amber-950/80 border-amber-500 text-amber-400 animate-pulse'
                  : 'bg-slate-900/80 border-slate-800 text-slate-300'
              }`}
              title={t('games.screw.moves_left_label')}
            >
              <span>🎯</span>
              <span>{movesLeft}</span>
            </div>

            {/* Timer Badge */}
            <div
              className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all ${
                timeLeft <= 15
                  ? 'bg-red-950/80 border-red-500 text-red-400 animate-pulse'
                  : 'bg-slate-900/80 border-slate-800 text-slate-300'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{timeLeft}s</span>
            </div>

            {/* Remaining Plates Badge */}
            <div className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-bold text-amber-400 truncate">
              <span>🧩</span>
              <span>{t('games.screw.plates_left', { count: remainingPlatesCount })}</span>
            </div>
          </div>
        </div>

        {/* ── BOOSTER & CONTROLS TOOLBAR (SYMMETRIC 4-BUTTON GRID) ── */}
        <div className="w-full grid grid-cols-4 gap-1.5 px-0.5">
          {/* Theme Selector Button */}
          <button
            onClick={() => setShowThemeModal(true)}
            className="py-2 px-1 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 active:scale-95 transition flex items-center justify-center gap-1 text-[11px] text-slate-300 font-bold shadow-xs"
          >
            <Palette className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">{t('games.screw.theme_btn')}</span>
          </button>

          {/* Undo Booster */}
          <button
            onClick={handleUndo}
            disabled={history.length === 0}
            className={`py-2 px-1 rounded-xl border transition flex items-center justify-center gap-1 text-[11px] font-bold shadow-xs ${
              history.length > 0
                ? 'bg-slate-800 border-slate-700 text-slate-200 hover:text-white active:scale-95'
                : 'bg-slate-900/50 border-slate-800/80 text-slate-600 cursor-not-allowed'
            }`}
            title={t('games.screw.btn_undo')}
          >
            <Undo2 className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{t('games.screw.btn_undo')}</span>
          </button>

          {/* Hammer Booster */}
          <button
            onClick={toggleHammer}
            className={`py-2 px-1 rounded-xl border transition flex items-center justify-center gap-1 text-[11px] font-bold shadow-xs ${
              hammerActive
                ? 'bg-red-600 border-red-400 text-white animate-pulse shadow-md shadow-red-500/50'
                : 'bg-slate-800 border-slate-700 text-slate-200 hover:text-white active:scale-95'
            }`}
            title={t('games.screw.hammer_active_tip')}
          >
            <Hammer className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{t('games.screw.btn_hammer')}</span>
          </button>

          {/* Add Extra Hole Booster */}
          <button
            onClick={handleAddHole}
            disabled={extraHolesUnlocked >= 2}
            className={`py-2 px-1 rounded-xl border transition flex items-center justify-center gap-1 text-[11px] font-bold shadow-xs ${
              extraHolesUnlocked < 2
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 border-amber-300 text-slate-950 font-black hover:brightness-110 active:scale-95 shadow-md shadow-amber-500/20'
                : 'bg-slate-900/50 border-slate-800/80 text-slate-600 cursor-not-allowed'
            }`}
            title={t('games.screw.btn_add_hole')}
          >
            <PlusCircle className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{t('games.screw.btn_add_hole')}</span>
          </button>
        </div>

        {/* ── DEADLOCK WARNING TOAST ── */}
        {isDeadlocked && (
          <div className="w-full bg-red-950/90 border border-red-500 rounded-2xl p-2.5 flex items-center gap-2 animate-bounce shadow-lg shadow-red-950/50">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <div className="text-[11px] leading-tight text-red-200">
              <span className="font-bold text-red-100 block">{t('games.screw.deadlock_title')}</span>
              <span>{t('games.screw.deadlock_hint')}</span>
            </div>
          </div>
        )}

        {/* ── INTERACTIVE SCREW PUZZLE BOARD ── */}
        <div
          ref={boardRef}
          onPointerMove={handleBoardPointerMove}
          onPointerUp={handleBoardPointerUp}
          onPointerCancel={handleBoardPointerUp}
          style={{ touchAction: 'none' }}
          className={`relative w-full max-w-[380px] aspect-[4/5] bg-gradient-to-b ${activeTheme.boardBg} rounded-3xl border-2 ${
            activeTheme.boardBorder
          } p-2 overflow-hidden transition-all duration-300 touch-none select-none ${screenShake ? 'scale-[0.99] translate-y-1' : ''}`}
        >
          {/* Workshop Metallic Background Grid */}
          <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

          {/* ── 0. TOP COLOR-CODED SCREW BOX (ONLY 1 ACTIVE TRAY + MYSTERY QUEUE / FINAL TRAY) ── */}
          <div className="absolute top-2 inset-x-2 h-14 bg-slate-950/90 backdrop-blur-md rounded-2xl border border-slate-800 flex items-center justify-between px-3 z-20 shadow-md">
            {/* 0.1 Active Open Tray (Always prominently displayed) */}
            <div className="flex items-center gap-2">
              {activeBoxIndices.map((boxIdx) => {
                const box = boxes[boxIdx];
                if (!box) return null;
                const isHoveredBox = hoveredTargetId === `box_${boxIdx}`;
                const isBoxDone = box.isCompleted || box.collectedCount >= box.capacity;

                return (
                  <div
                    key={box.id}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 transition-all duration-300 ${
                      isHoveredBox
                        ? 'scale-105 shadow-lg brightness-125 animate-pulse'
                        : isBoxDone
                        ? 'border-amber-400 bg-amber-500/20 shadow-md shadow-amber-500/25'
                        : 'shadow-sm'
                    }`}
                    style={{
                      backgroundColor: isBoxDone ? 'rgba(245, 158, 11, 0.2)' : `${box.color}22`,
                      borderColor: isBoxDone ? '#F59E0B' : box.color,
                    }}
                  >
                    <PackageCheck className="w-4 h-4" style={{ color: isBoxDone ? '#F59E0B' : box.color }} />
                    {/* Dynamic Circular Sockets for this box (capacity: 3 or 4) */}
                    <div className="flex items-center gap-1.5">
                      {Array.from({ length: box.capacity }).map((_, slotIdx) => {
                        const isFilled = slotIdx < box.collectedCount;
                        return (
                          <div
                            key={slotIdx}
                            className="w-5 h-5 rounded-full border border-white/60 flex items-center justify-center shadow-inner transition-all"
                            style={{
                              backgroundColor: isFilled ? box.color : 'rgba(15, 23, 42, 0.9)',
                            }}
                          >
                            {isFilled && (
                              <div className="w-2.5 h-0.5 bg-slate-950 rounded-full" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {isBoxDone && (
                      <span className="text-[10px] font-black text-amber-300 uppercase tracking-wider ml-0.5">
                        {t('games.screw.box_full')}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 0.2 Mystery Queue (Shows remaining hidden boxes, or Final Tray badge when on the last tray) */}
            {(() => {
              const remainingBoxes = boxes.filter(
                (b, idx) => !activeBoxIndices.includes(idx) && !b.isCompleted
              );
              if (remainingBoxes.length > 0) {
                return (
                  <div
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-700/80 bg-slate-900/90 shadow-sm shrink-0"
                    title={t('games.screw.next_box')}
                  >
                    <span className="text-slate-400 text-[9px] font-bold uppercase tracking-wider">
                      {t('games.screw.next_box')}:
                    </span>
                    <div className="w-5 h-5 rounded-lg border border-amber-500/50 bg-amber-500/15 flex items-center justify-center text-amber-400 font-black text-xs shadow-inner select-none">
                      ?
                    </div>
                    <span className="font-mono text-[10px] text-slate-400 font-bold">
                      ({remainingBoxes.length})
                    </span>
                  </div>
                );
              }
              return (
                <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 shadow-sm shrink-0">
                  <span className="text-amber-300 text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                    <span>🏁</span>
                    <span>{t('games.screw.final_box_label')}</span>
                  </span>
                </div>
              );
            })()}
          </div>

          {/* ── 0.1 FREE BUFFER HOLES HEADER ── */}
          <div className="absolute top-18 inset-x-3 flex items-center justify-between text-[9px] font-black uppercase text-slate-400 z-10">
            <span>{t('games.screw.free_holes_label')}</span>
          </div>

          {/* 0.2 RENDER BACKGROUND SILHOUETTE OF THE PUZZLE ARTPIECE */}
          {levelData.silhouettePaths && levelData.silhouettePaths.length > 0 && (
            <div className="absolute inset-0 pointer-events-none z-0 flex items-center justify-center p-4">
              <svg viewBox="0 0 100 100" className="w-full h-full opacity-20">
                {levelData.silhouettePaths.map((sp, idx) => (
                  <path
                    key={idx}
                    d={sp.d}
                    fill="#94A3B8"
                    stroke="#E2E8F0"
                    strokeWidth="1.5"
                    strokeDasharray="4 3"
                    opacity={sp.opacity || 0.3}
                  />
                ))}
              </svg>
            </div>
          )}

          {/* ── 1. RENDER INTERLOCKING ACRYLIC GLASS PLATES WITH CENTER-OF-MASS GRAVITY ALIGNMENT ── */}
          {plates.map((plate) => {
            const gradientId = `plate_grad_${plate.id}`;
            const glareId = `plate_glare_${plate.id}`;
            // Preserve pivotPoint or centerOfMass consistently to avoid CSS matrix pivot jump
            const transformOrigin = plate.pivotPoint
              ? `${plate.pivotPoint.x}% ${plate.pivotPoint.y}%`
              : `${plate.centerOfMass.x}% ${plate.centerOfMass.y}%`;

            // Khi rơi: translateY world-space từ đúng góc nghiêng hiện tại của tấm
            const plateTransform = plate.isFallen
              ? `translateY(${plate.fallTranslateY}px) rotate(${plate.currentRotation + plate.fallRotate}deg)`
              : `rotate(${plate.currentRotation}deg)`;

            const plateTransition = plate.isFallen
              ? 'transform 950ms cubic-bezier(0.55, 0.055, 0.675, 0.19), opacity 250ms ease-in 700ms'
              : 'transform 800ms cubic-bezier(0.4, 0, 0.2, 1), opacity 200ms ease-out';

            const plateOpacity = plate.isFallen ? 0 : 1;

            return (
              <div
                key={plate.id}
                className="absolute inset-0 pointer-events-none"
                style={{
                  transformOrigin,
                  transform: plateTransform,
                  opacity: plateOpacity,
                  zIndex: plate.isFallen ? 0 : plate.layer + 5,
                  transition: plateTransition,
                  willChange: 'transform, opacity',
                }}
              >

                <svg
                  viewBox="0 0 100 100"
                  className={`w-full h-full overflow-visible transition-all ${
                    plate.isFallen ? '' : 'drop-shadow-[0_4px_10px_rgba(0,0,0,0.35)]'
                  }`}
                >
                  <defs>
                    <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor={plate.colorStart} stopOpacity="0.94" />
                      <stop offset="100%" stopColor={plate.colorEnd} stopOpacity="0.86" />
                    </linearGradient>
                    <linearGradient id={glareId} x1="0%" y1="0%" x2="100%" y2="80%">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity="0.65" />
                      <stop offset="35%" stopColor="#ffffff" stopOpacity="0.12" />
                      <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* Outer Frosted Glass Base with Thick Glowing White Stroke */}
                  <path
                    d={plate.pathData}
                    fill={`url(#${gradientId})`}
                    stroke="rgba(255, 255, 255, 0.95)"
                    strokeWidth="2.8"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />

                  {/* Surface Glare Reflection */}
                  <path d={plate.pathData} fill={`url(#${glareId})`} />

                  {/* Inner Secondary Stroke Outline */}
                  <path
                    d={plate.pathData}
                    fill="none"
                    stroke={plate.borderColor}
                    strokeWidth="1.2"
                    strokeDasharray="4 2"
                    opacity="0.6"
                  />

                  {/* Decorative Details */}
                  {plate.details?.map((dt, idx) => {
                    if (dt.type === 'circle') {
                      return (
                        <circle
                          key={idx}
                          cx={dt.cx ?? dt.x}
                          cy={dt.cy ?? dt.y}
                          r={dt.r ?? dt.radius}
                          fill={dt.fill || '#FFFFFF'}
                          stroke={dt.stroke}
                          strokeWidth={dt.strokeWidth}
                          opacity={dt.opacity ?? 0.9}
                        />
                      );
                    }
                    if (dt.type === 'line') {
                      return (
                        <line
                          key={idx}
                          x1={dt.x1}
                          y1={dt.y1}
                          x2={dt.x2}
                          y2={dt.y2}
                          stroke={dt.stroke || 'rgba(255, 255, 255, 0.45)'}
                          strokeWidth={dt.strokeWidth || 1.2}
                          opacity={dt.opacity ?? 0.8}
                          strokeLinecap="round"
                        />
                      );
                    }
                    if (dt.type === 'path' && dt.d) {
                      return (
                        <path
                          key={idx}
                          d={dt.d}
                          fill={dt.fill || 'none'}
                          stroke={dt.stroke || 'rgba(255, 255, 255, 0.5)'}
                          strokeWidth={dt.strokeWidth || 1.5}
                          opacity={dt.opacity ?? 0.8}
                          strokeLinecap="round"
                        />
                      );
                    }
                    return null;
                  })}
                </svg>
              </div>
            );
          })}

          {/* ── 2. RENDER ALL HOLES & SCREW PINS ── */}
          {allHoles.map((hole) => {
            const occupantScrew = getScrewInHole(hole.id);
            const isSelectedHole = occupantScrew && occupantScrew.id === selectedScrewId;
            const isHoveredTarget = hole.id === hoveredTargetId;
            const isBeingDragged = occupantScrew && occupantScrew.id === draggedScrewId;
            const isFlying =
              occupantScrew &&
              (occupantScrew.currentHoleId.startsWith('flying_') ||
                flyingScrews.some((f) => f.screwId === occupantScrew.id));
            const isOccluded = occupantScrew ? isScrewOccluded(occupantScrew.id, plates, screws) : false;

            return (
              <div
                key={hole.id}
                onClick={() => {
                  if (occupantScrew) {
                    if (inFlightScrewIdsRef.current.has(occupantScrew.id)) return;
                    if (hammerActive) handleScrewClick(occupantScrew.id);
                  } else {
                    if (selectedScrewId && !inFlightScrewIdsRef.current.has(selectedScrewId)) {
                      transferScrew(selectedScrewId, 'HOLE', hole.id);
                    }
                  }
                }}
                className={`absolute w-[26px] h-[26px] -ml-[13px] -mt-[13px] rounded-full flex items-center justify-center transition-all duration-150 ${
                  isHoveredTarget
                    ? 'border-2 border-amber-400 bg-amber-400/30 scale-125 shadow-[0_0_18px_rgba(251,191,36,0.9)] animate-pulse z-40'
                    : hole.isExtra
                    ? 'border-2 border-dashed border-amber-400/50 bg-slate-950/80 shadow-inner'
                    : 'bg-slate-950 border border-slate-700 shadow-inner'
                } ${isOccluded ? 'z-20 cursor-not-allowed opacity-75' : 'cursor-pointer z-30'}`}
                style={{ left: `${hole.x}%`, top: `${hole.y}%` }}
              >
                {/* Hole Inner Thread Groove */}
                <div className="w-4 h-4 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center shadow-inner">
                  <div className="w-2 h-2 rounded-full bg-slate-950" />
                </div>

                {/* Screw Pin on Top of this Hole (if occupied, not being dragged, and not currently flying) */}
                {occupantScrew && !isBeingDragged && !isFlying && (
                  <div
                    onPointerDown={(e) => handleScrewPointerDown(e, occupantScrew.id, hole)}
                    className={`absolute inset-0 rounded-full flex items-center justify-center transition-all duration-200 ${
                      isOccluded
                        ? 'cursor-not-allowed filter brightness-75 saturate-75'
                        : isSelectedHole
                        ? 'scale-125 -translate-y-2 drop-shadow-[0_8px_16px_rgba(234,179,8,0.8)] z-40 animate-bounce cursor-grab active:cursor-grabbing'
                        : 'hover:scale-115 drop-shadow-md cursor-grab active:cursor-grabbing'
                    }`}
                  >
                    {/* Screw Head 3D Bevel (24px diameter) */}
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center border-2 border-white/90 shadow-md relative pointer-events-none"
                      style={{
                        background: `radial-gradient(circle at 35% 35%, #ffffff 0%, ${occupantScrew.color} 55%, #0f172a 100%)`,
                      }}
                    >
                      {/* Philips Cross Slot */}
                      <div className="w-3 h-[2px] bg-slate-950/90 absolute rounded-full shadow-xs" />
                      <div className="h-3 w-[2px] bg-slate-950/90 absolute rounded-full shadow-xs" />

                      {/* Lock Badge Overlay for Occluded Screws */}
                      {isOccluded && (
                        <div className="absolute inset-0 rounded-full bg-slate-950/60 backdrop-blur-[0.5px] flex items-center justify-center border border-amber-500/40">
                          <span className="text-[8px] drop-shadow-sm leading-none">🔒</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Ghost Silhouette at Origin Hole while Dragging */}
                {isBeingDragged && (
                  <div className="absolute inset-0 rounded-full border border-dashed border-amber-400/40 bg-amber-400/10 animate-pulse" />
                )}
              </div>
            );
          })}

          {/* ── 3. RENDER FLOATING DRAGGED SCREW PIN (FOLLOWING POINTER) ── */}
          {draggedScrewId !== null && (() => {
            const draggedScrew = screws.find((s) => s.id === draggedScrewId);
            if (!draggedScrew) return null;
            return (
              <div
                className="absolute w-6 h-6 -ml-3 -mt-3 rounded-full flex items-center justify-center z-[90] pointer-events-none scale-135 drop-shadow-[0_12px_24px_rgba(251,191,36,0.95)]"
                style={{ left: `${dragPos.x}%`, top: `${dragPos.y}%` }}
              >
                <div
                  className="w-[22px] h-[22px] rounded-full flex items-center justify-center border-2 border-white shadow-2xl relative"
                  style={{
                    background: `radial-gradient(circle at 35% 35%, #ffffff 0%, ${draggedScrew.color} 55%, #0f172a 100%)`,
                  }}
                >
                  <div className="w-2.5 h-0.5 bg-slate-950/90 absolute rounded-full shadow-xs" />
                  <div className="h-2.5 w-0.5 bg-slate-950/90 absolute rounded-full shadow-xs" />
                </div>
              </div>
            );
          })()}

          {/* ── 3.1 RENDER SMOOTH FLYING SCREW ARCS WITH 3D POP & ROTATION (TOP-LEVEL ROOT LAYER) ── */}
          {flyingScrews.map((flight) => {
            const elapsed = flightTime - flight.startTime;
            const t = Math.min(1, Math.max(0, elapsed / flight.duration));

            // Horizontal easing: Ease-out quad
            const currentX = flight.fromX + (flight.toX - flight.fromX) * (1 - (1 - t) * (1 - t));

            // Vertical parabolic arc: base linear + parabola bump
            const baseLinearY = flight.fromY + (flight.toY - flight.fromY) * t;
            const arcHeight = flight.fromY > flight.toY ? 8 : 16;
            const parabolaOffset = -4 * arcHeight * t * (1 - t);
            const currentY = baseLinearY + parabolaOffset;

            // Scale (pops out towards camera in mid-air)
            const currentScale = 1.0 + 0.45 * Math.sin(Math.PI * t);

            // Spin rotation (unscrewing & flying spin -720 deg)
            const currentRotate = -720 * t;

            return (
              <div
                key={flight.id}
                className="absolute w-6 h-6 -ml-3 -mt-3 rounded-full flex items-center justify-center z-[100] pointer-events-none select-none drop-shadow-[0_14px_28px_rgba(0,0,0,0.7)]"
                style={{
                  left: `${currentX}%`,
                  top: `${currentY}%`,
                  transform: `scale(${currentScale}) rotate(${currentRotate}deg)`,
                }}
              >
                <div
                  className="w-[22px] h-[22px] rounded-full flex items-center justify-center border-2 border-white shadow-2xl relative"
                  style={{
                    background: `radial-gradient(circle at 35% 35%, #ffffff 0%, ${flight.color} 55%, #0f172a 100%)`,
                  }}
                >
                  <div className="w-2.5 h-0.5 bg-slate-950/90 absolute rounded-full shadow-xs" />
                  <div className="h-2.5 w-0.5 bg-slate-950/90 absolute rounded-full shadow-xs" />
                </div>
              </div>
            );
          })}

          {/* ── 4. RENDER SPARKS PARTICLES ── */}
          {sparks.map((spark) => (
            <div
              key={spark.id}
              className="absolute rounded-full pointer-events-none z-50 transition-opacity"
              style={{
                left: `${spark.x}%`,
                top: `${spark.y}%`,
                width: `${spark.size}px`,
                height: `${spark.size}px`,
                backgroundColor: spark.color,
                opacity: spark.alpha,
                boxShadow: `0 0 6px ${spark.color}`,
              }}
            />
          ))}

          {/* ── 5. RENDER FLOATING TEXTS ── */}
          {floatingTexts.map((ft) => (
            <div
              key={ft.id}
              className="absolute pointer-events-none z-50 font-mono font-black text-xs whitespace-nowrap drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] -translate-x-1/2"
              style={{
                left: `${ft.x}%`,
                top: `${ft.y}%`,
                color: ft.color,
                opacity: ft.alpha,
              }}
            >
              {ft.text}
            </div>
          ))}
        </div>

        {/* Footer Subtitle */}
        <p className="text-[11px] text-slate-400 text-center max-w-xs leading-relaxed">
          {t('games.screw.subtitle')}
        </p>
      </main>

      {/* ── THEME SELECTOR MODAL ── */}
      {showThemeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Palette className="w-5 h-5 text-amber-400" />
                <span>{t('games.screw.theme_modal_title')}</span>
              </h3>
              <button
                onClick={() => setShowThemeModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {Object.values(SCREW_THEMES).map((th) => {
                const isSelected = th.key === currentThemeKey;
                return (
                  <button
                    key={th.key}
                    onClick={() => handleSelectTheme(th.key)}
                    className={`w-full p-3 rounded-2xl border flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-slate-800 border-amber-400 shadow-md scale-[1.02]'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{th.icon}</span>
                      <div className="text-left">
                        <span className="font-bold text-xs text-white block">{t(th.nameKey)}</span>
                        <div className="flex items-center gap-1 mt-1">
                          {th.screwColors.slice(0, 5).map((c, idx) => (
                            <div key={idx} className="w-3 h-3 rounded-full border border-white/40" style={{ backgroundColor: c }} />
                          ))}
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── LUXURY 3-STAR WIN STAGE REWARD MODAL ── */}
      {showWinModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border-2 border-amber-500/80 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl relative overflow-hidden">
            {/* Confetti Glow Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 via-transparent to-purple-500/10 pointer-events-none" />

            {/* Art Piece Icon & 3 Animated Stars */}
            <div className="flex flex-col items-center gap-2 pt-2">
              <span className="text-4xl animate-bounce">{levelData.artIcon}</span>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3].map((starIdx) => {
                  const isEarned = starIdx <= earnedStars;
                  return (
                    <div
                      key={starIdx}
                      className={`transition-all duration-500 ${
                        isEarned
                          ? 'text-amber-400 scale-110 drop-shadow-[0_0_12px_rgba(251,191,36,0.8)] animate-bounce'
                          : 'text-slate-700 opacity-40'
                      }`}
                      style={{ animationDelay: `${starIdx * 200}ms` }}
                    >
                      <Star className="w-8 h-8 fill-current stroke-[1.5]" />
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-black text-white">
                {earnedStars === 3
                  ? t('games.screw.stars_title_3')
                  : earnedStars === 2
                  ? t('games.screw.stars_title_2')
                  : t('games.screw.stars_title_1')}
              </h3>
              <p className="text-xs text-amber-300 font-bold mt-1">
                {levelData.artIcon} {t(levelData.artNameKey)} • {t('games.screw.level_label', { level: currentStageIndex + 1, total: TOTAL_SESSION_STAGES })}
              </p>
            </div>

            {/* Detailed Ledger Reward Card */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 text-left space-y-1.5">
              <div className="flex justify-between text-xs text-slate-400">
                <span>{t('games.screw.base_reward', { points: rewardBreakdown.base })}</span>
                <span className="font-mono font-bold text-slate-200">+{rewardBreakdown.base}</span>
              </div>
              {rewardBreakdown.timeBonus > 0 && (
                <div className="flex justify-between text-xs text-emerald-400">
                  <span>{t('games.screw.time_bonus', { bonus: rewardBreakdown.timeBonus })}</span>
                  <span className="font-mono font-bold">+{rewardBreakdown.timeBonus}</span>
                </div>
              )}
              {rewardBreakdown.masterBonus > 0 && (
                <div className="flex justify-between text-xs text-amber-400">
                  <span>{t('games.screw.master_bonus', { bonus: rewardBreakdown.masterBonus })}</span>
                  <span className="font-mono font-bold">+{rewardBreakdown.masterBonus}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                <span className="text-xs font-bold text-white">{t('games.screw.total_reward')}</span>
                <div className="text-xl font-black text-amber-400 font-mono flex items-center gap-1">
                  <Sparkles className="w-5 h-5 text-yellow-300 animate-spin" />
                  <span>+{rewardBreakdown.total}</span>
                  <span className="text-xs font-bold text-amber-200">{t('nav.points_unit')}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                onClick={claimReward}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black rounded-xl text-sm shadow-lg active:scale-95 transition flex items-center justify-center gap-1.5"
              >
                <span>
                  {currentStageIndex === TOTAL_SESSION_STAGES - 1
                    ? t('games.screw.btn_new_campaign')
                    : t('games.screw.btn_next_level')}
                </span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setShowWinModal(false);
                    loadLevel(currentStageIndex);
                  }}
                  className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{t('games.screw.btn_retry_stars')}</span>
                </button>
                <button
                  onClick={() => {
                    setShowWinModal(false);
                    onBack();
                  }}
                  className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>{t('games.screw.btn_back_hub')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── LOSE / GAME OVER MODAL (DEADLOCK OR TIMEOUT) ── */}
      {showLoseModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border-2 border-red-500/80 rounded-3xl p-5 max-w-sm w-full text-center space-y-4 shadow-2xl relative overflow-hidden">
            {/* Warning Glow Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-red-500/15 via-transparent to-orange-500/10 pointer-events-none" />

            {/* Icon Header */}
            <div className="flex flex-col items-center gap-1.5 pt-1">
              <div className="w-14 h-14 rounded-full bg-red-950/80 border-2 border-red-500 flex items-center justify-center text-2xl shadow-lg animate-bounce">
                {loseReason === 'moves' ? '🎯' : loseReason === 'deadlock' ? '⚠️' : '⏰'}
              </div>
              <h3 className="text-base font-black text-white">
                {loseReason === 'moves'
                  ? t('games.screw.lose_title_moves')
                  : loseReason === 'deadlock'
                  ? t('games.screw.lose_title_deadlock')
                  : t('games.screw.lose_title_timeout')}
              </h3>
              <p className="text-[11px] text-slate-300 px-2 leading-relaxed">
                {loseReason === 'moves'
                  ? t('games.screw.lose_desc_moves')
                  : loseReason === 'deadlock'
                  ? t('games.screw.lose_desc_deadlock')
                  : t('games.screw.lose_desc_timeout')}
              </p>
            </div>

            {/* Level Info & Turns/Points Balance Card */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-2.5 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-bold flex items-center gap-1">
                <span>{levelData.artIcon}</span>
                <span>{t(levelData.artNameKey)}</span>
              </span>
              <div className="flex items-center gap-2 font-mono">
                <span className="text-amber-400 font-bold">🎟️ {turns}</span>
                <span className="text-slate-300 font-bold">💎 {points.toLocaleString()}</span>
              </div>
            </div>

            {/* Action Buttons: Branch based on whether user has remaining turns */}
            <div className="space-y-2 pt-1">
              {turns > 0 ? (
                <>
                  {/* Option 1: Rescue with 1 Turn & Continue current board */}
                  <button
                    onClick={handleUseTurnToRescue}
                    className="w-full py-3 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black rounded-xl text-xs shadow-lg active:scale-95 transition flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4 text-slate-950" />
                    <span>{t('games.screw.btn_use_turn_continue', { turns })}</span>
                  </button>

                  {/* Option 2: Retry level with 1 Turn */}
                  <button
                    onClick={handleRetryWithTurn}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs active:scale-95 transition flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{t('games.screw.btn_retry_use_turn')}</span>
                  </button>
                </>
              ) : (
                <>
                  {/* Out of turns badge */}
                  <div className="bg-red-950/80 border border-red-500/60 rounded-xl p-2 text-center">
                    <span className="text-xs font-black text-red-400 block">{t('games.screw.no_turns_badge')}</span>
                    <span className="text-[10px] text-slate-300 block mt-0.5">{t('games.screw.current_balance', { points: points.toLocaleString() })}</span>
                  </div>

                  {/* Option 1: Buy 1 Turn (-50 pts) */}
                  <button
                    onClick={() => handleBuyTurns(1, 50)}
                    className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:brightness-110 text-white font-black rounded-xl text-xs shadow-md active:scale-95 transition flex items-center justify-between px-3.5"
                  >
                    <span className="flex items-center gap-1.5">
                      <span>🎟️</span>
                      <span>{t('games.screw.buy_pack_single')}</span>
                    </span>
                    <span className="bg-slate-950/40 px-2 py-0.5 rounded-lg text-[10px] font-bold">50 💎</span>
                  </button>

                  {/* Option 2: Buy 3 Turns (-120 pts) */}
                  <button
                    onClick={() => handleBuyTurns(3, 120)}
                    className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:brightness-110 text-slate-950 font-black rounded-xl text-xs shadow-md active:scale-95 transition flex items-center justify-between px-3.5"
                  >
                    <span className="flex items-center gap-1.5">
                      <span>🎟️🎟️🎟️</span>
                      <span>{t('games.screw.buy_pack_triple')}</span>
                    </span>
                    <span className="bg-slate-950/20 px-2 py-0.5 rounded-lg text-[10px] font-black">120 💎</span>
                  </button>

                  {/* Option 3: Emergency Slot (-30 pts) */}
                  <button
                    onClick={() => handleEmergencySlotBuy(30)}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 font-bold rounded-xl text-xs active:scale-95 transition flex items-center justify-between px-3.5"
                  >
                    <span className="flex items-center gap-1.5">
                      <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
                      <span>{t('games.screw.buy_pack_emergency')}</span>
                    </span>
                    <span className="text-amber-400 font-bold text-[10px]">30 💎</span>
                  </button>
                </>
              )}

              {/* Back to Hub Button */}
              <button
                onClick={() => {
                  setShowLoseModal(false);
                  onBack();
                }}
                className="w-full py-2 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition"
              >
                <Home className="w-3.5 h-3.5" />
                <span>{t('games.screw.btn_back_hub')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── BUY TURNS & BOOSTER SHOP MODAL ── */}
      {showBuyTurnsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎟️</span>
                <h3 className="text-sm font-black text-white">{t('games.screw.buy_turns_modal_title')}</h3>
              </div>
              <button
                onClick={() => setShowBuyTurnsModal(false)}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              {t('games.screw.buy_turns_modal_desc')}
            </p>

            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-bold">{t('games.screw.points_label')}</span>
              <span className="text-sm font-black text-amber-400 font-mono">💎 {points.toLocaleString()}</span>
            </div>

            <div className="space-y-2.5">
              {/* Option 1: 1 Play */}
              <button
                onClick={() => handleBuyTurns(1, 50)}
                className="w-full p-3 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-2xl flex items-center justify-between transition active:scale-95 text-left"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">🎟️</span>
                  <div>
                    <div className="text-xs font-black text-white">{t('games.screw.buy_pack_single')}</div>
                    <div className="text-[10px] text-slate-400">{t('games.screw.buy_pack_single_price')}</div>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-xl text-xs font-black">50 💎</span>
              </button>

              {/* Option 2: 3 Plays */}
              <button
                onClick={() => handleBuyTurns(3, 120)}
                className="w-full p-3 bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/10 hover:border-amber-500/60 border border-amber-500/40 rounded-2xl flex items-center justify-between transition active:scale-95 text-left"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">🎟️🎟️🎟️</span>
                  <div>
                    <div className="text-xs font-black text-amber-300">{t('games.screw.buy_pack_triple')}</div>
                    <div className="text-[10px] text-slate-400">{t('games.screw.buy_pack_triple_price')}</div>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-amber-500 text-slate-950 rounded-xl text-xs font-black shadow-xs">120 💎</span>
              </button>

              {/* Option 3: Extra Slot */}
              <button
                onClick={() => handleEmergencySlotBuy(30)}
                className="w-full p-3 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-2xl flex items-center justify-between transition active:scale-95 text-left"
              >
                <div className="flex items-center gap-2.5">
                  <PlusCircle className="w-5 h-5 text-amber-400" />
                  <div>
                    <div className="text-xs font-black text-white">{t('games.screw.buy_pack_emergency')}</div>
                    <div className="text-[10px] text-slate-400">{t('games.screw.buy_pack_emergency_price')}</div>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-sky-500/20 text-sky-400 border border-sky-500/40 rounded-xl text-xs font-black">30 💎</span>
              </button>
            </div>

            <button
              onClick={() => setShowBuyTurnsModal(false)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition"
            >
              {t('games.screw.btn_close_modal')}
            </button>
          </div>
        </div>
      )}

      {/* ── FLOATING TOAST NOTIFICATION ── */}
      {toastMessage && (
        <div className="fixed top-16 inset-x-4 z-50 flex justify-center pointer-events-none animate-bounce">
          <div
            className="px-4 py-2.5 rounded-2xl shadow-2xl text-xs font-black text-white flex items-center gap-2 border"
            style={{
              backgroundColor: toastMessage.color,
              borderColor: 'rgba(255,255,255,0.3)',
            }}
          >
            <span>⚠️</span>
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* ── 1-SECOND LUXURY LEVEL LOADING SCREEN OVERLAY ── */}
      {isLoadingLevel && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 select-none animate-fade-in">
          <div className="relative max-w-sm w-full bg-slate-900/95 border border-amber-500/40 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center space-y-5 overflow-hidden">
            {/* Ambient background glow */}
            <div className="absolute -top-20 -left-20 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-yellow-500/15 rounded-full blur-3xl pointer-events-none" />

            {/* Center Icon & Spinning Gear Aura */}
            <div className="relative w-28 h-28 flex items-center justify-center">
              {/* Rotating Outer Gear/Rings */}
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-amber-400/40 animate-spin-slow" />
              <div className="absolute inset-2 rounded-full border border-yellow-300/20 animate-spin" style={{ animationDuration: '6s' }} />

              {/* Glowing Center Badge */}
              <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 border border-amber-500/50 flex items-center justify-center shadow-[0_0_25px_rgba(245,158,11,0.3)] animate-pulse">
                <span className="text-4xl filter drop-shadow-md select-none">{levelData.artIcon}</span>
              </div>
            </div>

            {/* Stage Info & Name */}
            <div className="space-y-1.5 z-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black tracking-wider uppercase shadow-xs">
                <span>🎯</span>
                <span>{t('games.screw.stage_indicator', { current: currentStageIndex + 1, total: TOTAL_SESSION_STAGES })}</span>
              </div>
              <h2 className="text-xl font-black text-white tracking-wide">
                {t(levelData.artNameKey)}
              </h2>
              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 font-bold">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>{t('games.screw.loading_time_badge')}</span>
              </div>
            </div>

            {/* Smooth 1s Progress Bar */}
            <div className="w-full space-y-2 z-10">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                <span className="text-amber-400">{loadingProgress >= 100 ? t('games.screw.loading_ready') : t('games.screw.loading_title')}</span>
                <span className="font-mono text-white">{loadingProgress}%</span>
              </div>
              <div className="w-full h-3 bg-slate-950/80 rounded-full p-0.5 border border-slate-700/80 overflow-hidden shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 rounded-full transition-all duration-75 ease-out shadow-[0_0_10px_rgba(251,191,36,0.6)]"
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>
            </div>

            {/* Friendly Game Tip Card */}
            <div className="w-full bg-slate-950/60 border border-slate-800 rounded-2xl p-3 text-left space-y-1 z-10">
              <div className="flex items-center gap-1.5 text-[11px] font-black text-amber-300">
                <span>💡</span>
                <span>{t('games.screw.loading_tip_title')}</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                {t('games.screw.loading_tip_desc')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── GAME TUTORIAL MODAL ── */}
      <GameTutorialModal
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
        gameTitle={t('games.screw.title')}
        gameIcon="🔩"
        goal={t('games.screw.tutorial.goal')}
        controls={t('games.screw.tutorial.controls')}
        scoring={t('games.screw.tutorial.scoring')}
        tips={t('games.screw.tutorial.tips')}
      />
    </div>
  );
};
