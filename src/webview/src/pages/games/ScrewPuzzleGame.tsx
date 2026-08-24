import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, Undo2, PlusCircle, Hammer } from 'lucide-react';
import { GameSounds } from '../../utils/audio';
import { GameHeader } from '../../components/common/GameHeader';
import { GameTutorialModal } from '../../components/common/GameTutorialModal';

export interface ScrewPuzzleGameProps {
  onBack: () => void;
  onClaimReward?: (pointsWon: number) => void;
}

// ── DATA STRUCTURES ──
interface Plate {
  id: number;
  name: string;
  shape: 'RECT_H' | 'RECT_V' | 'CROSS' | 'TRIANGLE' | 'BAR_DIAG_L' | 'BAR_DIAG_R';
  x: number; // percentage (0 - 100)
  y: number; // percentage (0 - 100)
  width: number;
  height: number;
  rotation: number; // degrees
  colorGradient: string;
  borderColor: string;
  screwHoles: string[]; // List of Hole IDs that pierce through this plate
  isFallen: boolean;
  fallTranslateY: number;
  fallRotate: number;
  layer: number;
}

interface Hole {
  id: string;
  x: number; // % relative to board
  y: number; // % relative to board
  isExtra?: boolean;
}

interface ScrewPin {
  id: number;
  color: string;
  currentHoleId: string;
}

interface LevelData {
  level: number;
  name: string;
  freeHoles: Hole[];
  boardHoles: Hole[];
  plates: Plate[];
  screws: ScrewPin[];
  targetTime: number;
}

// ── 5 LEVELS CONFIGURATION ──
const LEVELS: LevelData[] = [
  {
    level: 1,
    name: 'Khởi Động Tháo Vít',
    freeHoles: [
      { id: 'free_1', x: 25, y: 8, isExtra: true },
      { id: 'free_2', x: 50, y: 8, isExtra: true },
      { id: 'free_3', x: 75, y: 8, isExtra: true },
    ],
    boardHoles: [
      { id: 'h_1', x: 30, y: 35 },
      { id: 'h_2', x: 70, y: 35 },
      { id: 'h_3', x: 50, y: 65 },
    ],
    plates: [
      {
        id: 1,
        name: 'Thanh Lam',
        shape: 'RECT_H',
        x: 50,
        y: 35,
        width: 60,
        height: 14,
        rotation: 0,
        colorGradient: 'from-blue-600 to-indigo-800',
        borderColor: '#93C5FD',
        screwHoles: ['h_1', 'h_2'],
        isFallen: false,
        fallTranslateY: 0,
        fallRotate: 0,
        layer: 2,
      },
      {
        id: 2,
        name: 'Thanh Hổ Phách',
        shape: 'RECT_V',
        x: 50,
        y: 50,
        width: 14,
        height: 50,
        rotation: 0,
        colorGradient: 'from-amber-500 to-orange-700',
        borderColor: '#FDE047',
        screwHoles: ['h_1', 'h_3'],
        isFallen: false,
        fallTranslateY: 0,
        fallRotate: 0,
        layer: 1,
      },
    ],
    screws: [
      { id: 1, color: '#3B82F6', currentHoleId: 'h_1' },
      { id: 2, color: '#EAB308', currentHoleId: 'h_2' },
      { id: 3, color: '#EF4444', currentHoleId: 'h_3' },
    ],
    targetTime: 60,
  },
  {
    level: 2,
    name: 'Tam Giác Liên Hoàn',
    freeHoles: [
      { id: 'free_1', x: 20, y: 8, isExtra: true },
      { id: 'free_2', x: 40, y: 8, isExtra: true },
      { id: 'free_3', x: 60, y: 8, isExtra: true },
      { id: 'free_4', x: 80, y: 8, isExtra: true },
    ],
    boardHoles: [
      { id: 'h_1', x: 25, y: 30 },
      { id: 'h_2', x: 75, y: 30 },
      { id: 'h_3', x: 50, y: 70 },
      { id: 'h_4', x: 50, y: 40 },
    ],
    plates: [
      {
        id: 1,
        name: 'Thanh Chéo Xanh',
        shape: 'BAR_DIAG_R',
        x: 50,
        y: 50,
        width: 65,
        height: 12,
        rotation: 35,
        colorGradient: 'from-emerald-500 to-teal-800',
        borderColor: '#6EE7B7',
        screwHoles: ['h_1', 'h_3'],
        isFallen: false,
        fallTranslateY: 0,
        fallRotate: 0,
        layer: 3,
      },
      {
        id: 2,
        name: 'Thanh Chéo Đỏ',
        shape: 'BAR_DIAG_L',
        x: 50,
        y: 50,
        width: 65,
        height: 12,
        rotation: -35,
        colorGradient: 'from-rose-500 to-red-800',
        borderColor: '#FCA5A5',
        screwHoles: ['h_2', 'h_3'],
        isFallen: false,
        fallTranslateY: 0,
        fallRotate: 0,
        layer: 2,
      },
      {
        id: 3,
        name: 'Thanh Ngang Vàng',
        shape: 'RECT_H',
        x: 50,
        y: 30,
        width: 65,
        height: 12,
        rotation: 0,
        colorGradient: 'from-yellow-400 to-amber-600',
        borderColor: '#FEF08A',
        screwHoles: ['h_1', 'h_2'],
        isFallen: false,
        fallTranslateY: 0,
        fallRotate: 0,
        layer: 1,
      },
    ],
    screws: [
      { id: 1, color: '#10B981', currentHoleId: 'h_1' },
      { id: 2, color: '#EF4444', currentHoleId: 'h_2' },
      { id: 3, color: '#EAB308', currentHoleId: 'h_3' },
      { id: 4, color: '#8B5CF6', currentHoleId: 'h_4' },
    ],
    targetTime: 75,
  },
  {
    level: 3,
    name: 'Cối Xay Gió 4 Cánh',
    freeHoles: [
      { id: 'free_1', x: 20, y: 8, isExtra: true },
      { id: 'free_2', x: 40, y: 8, isExtra: true },
      { id: 'free_3', x: 60, y: 8, isExtra: true },
      { id: 'free_4', x: 80, y: 8, isExtra: true },
    ],
    boardHoles: [
      { id: 'h_center', x: 50, y: 50 },
      { id: 'h_top', x: 50, y: 25 },
      { id: 'h_bottom', x: 50, y: 75 },
      { id: 'h_left', x: 25, y: 50 },
      { id: 'h_right', x: 75, y: 50 },
    ],
    plates: [
      {
        id: 1,
        name: 'Cánh Thẳng Đứng',
        shape: 'RECT_V',
        x: 50,
        y: 50,
        width: 14,
        height: 60,
        rotation: 0,
        colorGradient: 'from-purple-600 to-indigo-900',
        borderColor: '#D8B4FE',
        screwHoles: ['h_top', 'h_center', 'h_bottom'],
        isFallen: false,
        fallTranslateY: 0,
        fallRotate: 0,
        layer: 3,
      },
      {
        id: 2,
        name: 'Cánh Nằm Ngang',
        shape: 'RECT_H',
        x: 50,
        y: 50,
        width: 60,
        height: 14,
        rotation: 0,
        colorGradient: 'from-cyan-500 to-blue-800',
        borderColor: '#A5F3FC',
        screwHoles: ['h_left', 'h_center', 'h_right'],
        isFallen: false,
        fallTranslateY: 0,
        fallRotate: 0,
        layer: 2,
      },
      {
        id: 3,
        name: 'Khung Vuông Phụ',
        shape: 'RECT_H',
        x: 50,
        y: 25,
        width: 40,
        height: 10,
        rotation: 0,
        colorGradient: 'from-amber-500 to-orange-700',
        borderColor: '#FDE047',
        screwHoles: ['h_top'],
        isFallen: false,
        fallTranslateY: 0,
        fallRotate: 0,
        layer: 1,
      },
    ],
    screws: [
      { id: 1, color: '#A855F7', currentHoleId: 'h_top' },
      { id: 2, color: '#06B6D4', currentHoleId: 'h_left' },
      { id: 3, color: '#EAB308', currentHoleId: 'h_center' },
      { id: 4, color: '#3B82F6', currentHoleId: 'h_right' },
      { id: 5, color: '#EC4899', currentHoleId: 'h_bottom' },
    ],
    targetTime: 90,
  },
  {
    level: 4,
    name: 'Khung Lưới Đan Chéo',
    freeHoles: [
      { id: 'free_1', x: 15, y: 8, isExtra: true },
      { id: 'free_2', x: 38, y: 8, isExtra: true },
      { id: 'free_3', x: 62, y: 8, isExtra: true },
      { id: 'free_4', x: 85, y: 8, isExtra: true },
    ],
    boardHoles: [
      { id: 'h_1', x: 25, y: 30 },
      { id: 'h_2', x: 75, y: 30 },
      { id: 'h_3', x: 25, y: 70 },
      { id: 'h_4', x: 75, y: 70 },
      { id: 'h_5', x: 50, y: 50 },
    ],
    plates: [
      {
        id: 1,
        name: 'Thanh Ngang Trên',
        shape: 'RECT_H',
        x: 50,
        y: 30,
        width: 65,
        height: 12,
        rotation: 0,
        colorGradient: 'from-amber-400 to-yellow-600',
        borderColor: '#FEF08A',
        screwHoles: ['h_1', 'h_2'],
        isFallen: false,
        fallTranslateY: 0,
        fallRotate: 0,
        layer: 4,
      },
      {
        id: 2,
        name: 'Thanh Ngang Dưới',
        shape: 'RECT_H',
        x: 50,
        y: 70,
        width: 65,
        height: 12,
        rotation: 0,
        colorGradient: 'from-rose-500 to-red-700',
        borderColor: '#FCA5A5',
        screwHoles: ['h_3', 'h_4'],
        isFallen: false,
        fallTranslateY: 0,
        fallRotate: 0,
        layer: 3,
      },
      {
        id: 3,
        name: 'Thanh Dọc Trái',
        shape: 'RECT_V',
        x: 25,
        y: 50,
        width: 12,
        height: 55,
        rotation: 0,
        colorGradient: 'from-emerald-500 to-teal-800',
        borderColor: '#6EE7B7',
        screwHoles: ['h_1', 'h_3'],
        isFallen: false,
        fallTranslateY: 0,
        fallRotate: 0,
        layer: 2,
      },
      {
        id: 4,
        name: 'Thanh Dọc Phải',
        shape: 'RECT_V',
        x: 75,
        y: 50,
        width: 12,
        height: 55,
        rotation: 0,
        colorGradient: 'from-blue-600 to-indigo-800',
        borderColor: '#93C5FD',
        screwHoles: ['h_2', 'h_4'],
        isFallen: false,
        fallTranslateY: 0,
        fallRotate: 0,
        layer: 1,
      },
    ],
    screws: [
      { id: 1, color: '#F59E0B', currentHoleId: 'h_1' },
      { id: 2, color: '#EF4444', currentHoleId: 'h_2' },
      { id: 3, color: '#10B981', currentHoleId: 'h_3' },
      { id: 4, color: '#3B82F6', currentHoleId: 'h_4' },
      { id: 5, color: '#8B5CF6', currentHoleId: 'h_5' },
    ],
    targetTime: 100,
  },
  {
    level: 5,
    name: 'Bậc Thầy Gỡ Vít Kim Loại',
    freeHoles: [
      { id: 'free_1', x: 15, y: 8, isExtra: true },
      { id: 'free_2', x: 38, y: 8, isExtra: true },
      { id: 'free_3', x: 62, y: 8, isExtra: true },
      { id: 'free_4', x: 85, y: 8, isExtra: true },
    ],
    boardHoles: [
      { id: 'h_1', x: 20, y: 28 },
      { id: 'h_2', x: 80, y: 28 },
      { id: 'h_3', x: 50, y: 50 },
      { id: 'h_4', x: 20, y: 72 },
      { id: 'h_5', x: 80, y: 72 },
      { id: 'h_6', x: 50, y: 28 },
      { id: 'h_7', x: 50, y: 72 },
    ],
    plates: [
      {
        id: 1,
        name: 'Khung Tâm Chữ Thập',
        shape: 'CROSS',
        x: 50,
        y: 50,
        width: 70,
        height: 70,
        rotation: 0,
        colorGradient: 'from-amber-400 via-orange-500 to-amber-600',
        borderColor: '#FDE047',
        screwHoles: ['h_6', 'h_3', 'h_7'],
        isFallen: false,
        fallTranslateY: 0,
        fallRotate: 0,
        layer: 5,
      },
      {
        id: 2,
        name: 'Thanh Chéo 1',
        shape: 'BAR_DIAG_R',
        x: 50,
        y: 50,
        width: 75,
        height: 12,
        rotation: 40,
        colorGradient: 'from-purple-600 to-pink-700',
        borderColor: '#E879F9',
        screwHoles: ['h_1', 'h_3', 'h_5'],
        isFallen: false,
        fallTranslateY: 0,
        fallRotate: 0,
        layer: 4,
      },
      {
        id: 3,
        name: 'Thanh Chéo 2',
        shape: 'BAR_DIAG_L',
        x: 50,
        y: 50,
        width: 75,
        height: 12,
        rotation: -40,
        colorGradient: 'from-cyan-500 to-blue-700',
        borderColor: '#67E8F9',
        screwHoles: ['h_2', 'h_3', 'h_4'],
        isFallen: false,
        fallTranslateY: 0,
        fallRotate: 0,
        layer: 3,
      },
      {
        id: 4,
        name: 'Đế Đáy',
        shape: 'RECT_H',
        x: 50,
        y: 72,
        width: 70,
        height: 12,
        rotation: 0,
        colorGradient: 'from-emerald-500 to-teal-800',
        borderColor: '#6EE7B7',
        screwHoles: ['h_4', 'h_7', 'h_5'],
        isFallen: false,
        fallTranslateY: 0,
        fallRotate: 0,
        layer: 2,
      },
      {
        id: 5,
        name: 'Đỉnh Vòm',
        shape: 'RECT_H',
        x: 50,
        y: 28,
        width: 70,
        height: 12,
        rotation: 0,
        colorGradient: 'from-rose-500 to-red-800',
        borderColor: '#FDA4AF',
        screwHoles: ['h_1', 'h_6', 'h_2'],
        isFallen: false,
        fallTranslateY: 0,
        fallRotate: 0,
        layer: 1,
      },
    ],
    screws: [
      { id: 1, color: '#F59E0B', currentHoleId: 'h_1' },
      { id: 2, color: '#EC4899', currentHoleId: 'h_2' },
      { id: 3, color: '#A855F7', currentHoleId: 'h_3' },
      { id: 4, color: '#3B82F6', currentHoleId: 'h_4' },
      { id: 5, color: '#10B981', currentHoleId: 'h_5' },
      { id: 6, color: '#06B6D4', currentHoleId: 'h_6' },
      { id: 7, color: '#EF4444', currentHoleId: 'h_7' },
    ],
    targetTime: 120,
  },
];

export const ScrewPuzzleGame: React.FC<ScrewPuzzleGameProps> = ({ onBack, onClaimReward }) => {
  const { t } = useTranslation();

  const [currentLevelIdx, setCurrentLevelIdx] = useState<number>(0);
  const [levelData, setLevelData] = useState<LevelData>(LEVELS[0]);

  // Active Game State
  const [plates, setPlates] = useState<Plate[]>([]);
  const [screws, setScrews] = useState<ScrewPin[]>([]);
  const [freeHoles, setFreeHoles] = useState<Hole[]>([]);
  const [boardHoles, setBoardHoles] = useState<Hole[]>([]);
  const [selectedScrewId, setSelectedScrewId] = useState<number | null>(null);
  const [history, setHistory] = useState<{ screws: ScrewPin[]; plates: Plate[] }[]>([]);

  const [extraHolesUnlocked, setExtraHolesUnlocked] = useState<number>(0);
  const [hammerActive, setHammerActive] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(!GameSounds.isSoundMuted());
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  const [showWinModal, setShowWinModal] = useState<boolean>(false);
  const [rewardAmount, setRewardAmount] = useState<number>(0);
  const [score, setScore] = useState<number>(0);

  // Initialize level
  const loadLevel = useCallback((lvlIdx: number) => {
    const data = LEVELS[lvlIdx % LEVELS.length];
    setLevelData(data);
    setPlates(JSON.parse(JSON.stringify(data.plates)));
    setScrews(JSON.parse(JSON.stringify(data.screws)));
    setFreeHoles(JSON.parse(JSON.stringify(data.freeHoles)));
    setBoardHoles(JSON.parse(JSON.stringify(data.boardHoles)));
    setSelectedScrewId(null);
    setHistory([]);
    setExtraHolesUnlocked(0);
    setHammerActive(false);
    setShowWinModal(false);
  }, []);

  useEffect(() => {
    loadLevel(currentLevelIdx);
  }, [currentLevelIdx, loadLevel]);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    GameSounds.setMuted(!next);
  };

  // Combine all valid holes
  const allHoles = [...freeHoles, ...boardHoles];

  // Helper to check if a hole is occupied by a screw
  const getScrewInHole = (holeId: string) => {
    return screws.find((s) => s.currentHoleId === holeId);
  };

  // Check which plates should fall
  const evaluatePlatesFall = useCallback((currentScrews: ScrewPin[]) => {
    setPlates((prevPlates) => {
      let newlyFallenCount = 0;
      const updated = prevPlates.map((plate) => {
        if (plate.isFallen) return plate;

        // Check how many screws currently occupy holes pierced by this plate
        const activeScrewsOnPlate = plate.screwHoles.filter((hId) =>
          currentScrews.some((s) => s.currentHoleId === hId)
        );

        if (activeScrewsOnPlate.length === 0) {
          // Plate is completely free -> Trigger drop physics animation!
          newlyFallenCount++;
          return {
            ...plate,
            isFallen: true,
            fallTranslateY: 450,
            fallRotate: (Math.random() - 0.5) * 80,
          };
        } else if (activeScrewsOnPlate.length === 1) {
          // Exactly 1 screw left -> Tilt rotation
          return {
            ...plate,
            rotation: plate.rotation + 15,
          };
        }
        return plate;
      });

      if (newlyFallenCount > 0) {
        GameSounds.playCorrect();
        setScore((s) => s + newlyFallenCount * 50);

        // Check Win Condition
        const allFallen = updated.every((p) => p.isFallen);
        if (allFallen) {
          setTimeout(() => {
            const reward = 100 + (currentLevelIdx + 1) * 30;
            setRewardAmount(reward);
            setShowWinModal(true);
            GameSounds.playWinFanfare();
          }, 800);
        }
      }

      return updated;
    });
  }, [currentLevelIdx]);

  // Handle Screw Selection
  const handleScrewClick = (screwId: number) => {
    if (hammerActive) {
      // Hammer destroys this screw
      GameSounds.playChestOpen();
      setHistory((prev) => [...prev, { screws: JSON.parse(JSON.stringify(screws)), plates: JSON.parse(JSON.stringify(plates)) }]);
      const nextScrews = screws.filter((s) => s.id !== screwId);
      setScrews(nextScrews);
      setHammerActive(false);
      evaluatePlatesFall(nextScrews);
      return;
    }

    GameSounds.playTap();
    if (selectedScrewId === screwId) {
      setSelectedScrewId(null);
    } else {
      setSelectedScrewId(screwId);
    }
  };

  // Handle Target Hole Click
  const handleHoleClick = (holeId: string) => {
    if (selectedScrewId === null) return;

    // Check if hole is empty
    const isOccupied = screws.some((s) => s.currentHoleId === holeId);
    if (isOccupied) return;

    // Save history for Undo
    setHistory((prev) => [
      ...prev,
      {
        screws: JSON.parse(JSON.stringify(screws)),
        plates: JSON.parse(JSON.stringify(plates)),
      },
    ]);

    GameSounds.playTap();

    // Move screw to new hole
    const nextScrews = screws.map((s) => (s.id === selectedScrewId ? { ...s, currentHoleId: holeId } : s));
    setScrews(nextScrews);
    setSelectedScrewId(null);

    // Evaluate plate drops
    evaluatePlatesFall(nextScrews);
  };

  // Booster: Add 1 Extra Hole
  const handleAddHole = () => {
    if (extraHolesUnlocked >= 2) return;
    GameSounds.playFiftyFifty();
    const newHoleId = `extra_${extraHolesUnlocked + 1}`;
    const xPos = 92 - extraHolesUnlocked * 12;
    setFreeHoles((prev) => [...prev, { id: newHoleId, x: xPos, y: 8, isExtra: true }]);
    setExtraHolesUnlocked((c) => c + 1);
  };

  // Booster: Undo Last Move
  const handleUndo = () => {
    if (history.length === 0) return;
    GameSounds.playTap();
    const lastState = history[history.length - 1];
    setScrews(lastState.screws);
    setPlates(lastState.plates);
    setHistory((prev) => prev.slice(0, -1));
    setSelectedScrewId(null);
  };

  // Booster: Hammer Mode
  const toggleHammer = () => {
    GameSounds.playTap();
    setHammerActive((h) => !h);
  };

  const remainingPlates = plates.filter((p) => !p.isFallen).length;

  const handleNextLevel = () => {
    if (currentLevelIdx < LEVELS.length - 1) {
      setCurrentLevelIdx((l) => l + 1);
    } else {
      setCurrentLevelIdx(0);
    }
  };

  const claimReward = () => {
    if (onClaimReward && rewardAmount > 0) {
      onClaimReward(rewardAmount);
    }
    setShowWinModal(false);
    handleNextLevel();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans select-none pb-12 animate-fade-in">
      <GameHeader
        title={t('games.screw.title')}
        subtitle={t('games.screw.level_label', { level: currentLevelIdx + 1 })}
        onBack={onBack}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
        onRestart={() => loadLevel(currentLevelIdx)}
        restartTooltip={t('games.memory.btn_restart')}
        onHelp={() => setShowTutorial(true)}
      />

      {/* ── MAIN STAGE ── */}
      <main className="flex-1 max-w-md mx-auto w-full px-3 py-2 flex flex-col items-center justify-between space-y-3">
        {/* Top Status & Boosters Bar */}
        <div className="w-full bg-slate-900/90 border border-slate-800 px-3 py-2 rounded-2xl shadow-md flex items-center justify-between gap-2">
          {/* Level & Remaining Plates */}
          <div className="flex items-center gap-2">
            <span className="bg-amber-500 text-slate-950 font-black text-xs px-2.5 py-1 rounded-xl shadow-xs">
              Lvl {currentLevelIdx + 1}
            </span>
            <span className="text-xs font-bold text-slate-300">
              {t('games.screw.plates_left', { count: remainingPlates })}
            </span>
            <span className="bg-slate-800/80 text-amber-400 font-mono font-bold text-xs px-2 py-0.5 rounded-lg border border-slate-700">
              {score} pts
            </span>
          </div>

          {/* Boosters */}
          <div className="flex items-center gap-1.5">
            {/* Undo */}
            <button
              onClick={handleUndo}
              disabled={history.length === 0}
              className={`p-1.5 rounded-xl border transition flex items-center gap-1 text-[11px] font-bold ${
                history.length > 0
                  ? 'bg-slate-800 border-slate-700 text-slate-200 hover:text-white active:scale-95'
                  : 'bg-slate-900/50 border-slate-800 text-slate-600 cursor-not-allowed'
              }`}
              title={t('games.screw.btn_undo')}
            >
              <Undo2 className="w-4 h-4" />
            </button>

            {/* Hammer */}
            <button
              onClick={toggleHammer}
              className={`px-2 py-1 rounded-xl border transition flex items-center gap-1 text-[11px] font-bold ${
                hammerActive
                  ? 'bg-red-600 border-red-400 text-white animate-pulse shadow-md shadow-red-500/30'
                  : 'bg-slate-800 border-slate-700 text-slate-200 hover:text-white active:scale-95'
              }`}
              title="Búa Phá Ốc"
            >
              <Hammer className="w-3.5 h-3.5" />
              <span>Búa</span>
            </button>

            {/* Add Extra Hole */}
            <button
              onClick={handleAddHole}
              disabled={extraHolesUnlocked >= 2}
              className={`px-2 py-1 rounded-xl border transition flex items-center gap-1 text-[11px] font-bold ${
                extraHolesUnlocked < 2
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 border-amber-300 text-slate-950 font-black hover:brightness-110 active:scale-95'
                  : 'bg-slate-900/50 border-slate-800 text-slate-600 cursor-not-allowed'
              }`}
              title={t('games.screw.btn_add_hole')}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+1 Lỗ</span>
            </button>
          </div>
        </div>

        {/* ── INTERACTIVE SCREW PUZZLE BOARD ── */}
        <div className="relative w-full max-w-[380px] aspect-[4/5] bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 rounded-3xl border-2 border-slate-800 shadow-2xl p-2 overflow-hidden">
          {/* Background Metallic Plate Grid Pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

          {/* Top Free Holes Tray Header */}
          <div className="absolute top-2 inset-x-2 h-12 bg-slate-950/70 backdrop-blur-md rounded-2xl border border-slate-800/80 flex items-center px-2 z-10">
            <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider mr-2">Hộp Ốc:</span>
          </div>

          {/* 1. RENDER ALL HOLES (Free Holes on top & Board Holes) */}
          {allHoles.map((hole) => {
            const occupantScrew = getScrewInHole(hole.id);
            const isSelectedHole = occupantScrew && occupantScrew.id === selectedScrewId;

            return (
              <div
                key={hole.id}
                onClick={() => {
                  if (occupantScrew) {
                    handleScrewClick(occupantScrew.id);
                  } else {
                    handleHoleClick(hole.id);
                  }
                }}
                className={`absolute w-8 h-8 -ml-4 -mt-4 rounded-full flex items-center justify-center cursor-pointer z-30 transition-all duration-200 ${
                  hole.isExtra ? 'border-2 border-dashed border-amber-400/40 bg-slate-950/80' : 'bg-slate-950 border border-slate-700 shadow-inner'
                }`}
                style={{ left: `${hole.x}%`, top: `${hole.y}%` }}
              >
                {/* Hole Inner Thread Groove */}
                <div className="w-5 h-5 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center shadow-inner">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-950" />
                </div>

                {/* Screw Pin on Top of this Hole (if occupied) */}
                {occupantScrew && (
                  <div
                    className={`absolute inset-0 rounded-full flex items-center justify-center transition-transform duration-200 ${
                      isSelectedHole
                        ? 'scale-125 -translate-y-2.5 drop-shadow-[0_8px_16px_rgba(234,179,8,0.7)] z-40'
                        : 'hover:scale-110 drop-shadow-md'
                    }`}
                  >
                    {/* Screw Head */}
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center border-2 border-white/80 shadow-md relative"
                      style={{
                        background: `radial-gradient(circle at 35% 35%, #ffffff 0%, ${occupantScrew.color} 60%, #0f172a 100%)`,
                      }}
                    >
                      {/* Philips Cross Slot */}
                      <div className="w-3.5 h-0.5 bg-slate-950/80 absolute rounded-full" />
                      <div className="h-3.5 w-0.5 bg-slate-950/80 absolute rounded-full" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* 2. RENDER OVERLAPPING METAL & WOOD PLATES */}
          {plates.map((plate) => {
            return (
              <div
                key={plate.id}
                className={`absolute rounded-2xl border-2 flex items-center justify-center pointer-events-none transition-all duration-700 ${
                  plate.isFallen ? 'opacity-0 scale-90' : 'opacity-100 shadow-xl'
                }`}
                style={{
                  left: `${plate.x}%`,
                  top: `${plate.y}%`,
                  width: `${plate.width}%`,
                  height: `${plate.height}%`,
                  transform: `translate(-50%, -50%) rotate(${plate.rotation}deg) translateY(${plate.fallTranslateY}px) rotate(${plate.fallRotate}deg)`,
                  background: `linear-gradient(135deg, ${plate.borderColor} 0%, rgba(15,23,42,0.8) 100%)`,
                  borderColor: plate.borderColor,
                  zIndex: plate.isFallen ? 0 : plate.layer + 5,
                }}
              >
                {/* Plate Inner Texture */}
                <div
                  className={`w-full h-full rounded-xl bg-gradient-to-br ${plate.colorGradient} opacity-90 p-1 flex items-center justify-center relative overflow-hidden`}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/30 pointer-events-none" />
                  <span className="text-[10px] font-black tracking-widest text-white/70 uppercase select-none drop-shadow">
                    {plate.name}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Subtitle */}
        <p className="text-[11px] text-slate-400 text-center max-w-xs leading-relaxed">
          {t('games.screw.subtitle')}
        </p>
      </main>

      {/* ── WIN STAGE REWARD MODAL ── */}
      {showWinModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border-2 border-amber-500/70 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl relative overflow-hidden">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center text-3xl mx-auto shadow-xl animate-bounce">
              🔩
            </div>
            <div>
              <h3 className="text-lg font-black text-white">{t('games.screw.win_title')}</h3>
              <p className="text-xs text-slate-400 mt-1">
                {levelData.name} • {t('games.screw.level_label', { level: currentLevelIdx + 1 })}
              </p>
              <div className="text-3xl font-black text-amber-400 font-mono mt-2 flex items-center justify-center gap-1.5">
                <Sparkles className="w-6 h-6 text-yellow-300 animate-spin" />
                <span>+{rewardAmount}</span>
                <span className="text-sm font-bold text-amber-200">{t('nav.points_unit')}</span>
              </div>
            </div>
            <button
              onClick={claimReward}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black rounded-xl text-sm shadow-lg active:scale-95 transition"
            >
              {t('games.screw.btn_next_level')}
            </button>
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
