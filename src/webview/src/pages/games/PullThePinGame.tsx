import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, RotateCcw } from 'lucide-react';
import { GameSounds } from '../../utils/audio';
import { GameHeader } from '../../components/common/GameHeader';
import { GameTutorialModal } from '../../components/common/GameTutorialModal';

export interface PullThePinGameProps {
  onBack: () => void;
  onClaimReward?: (pointsWon: number) => void;
}

// ── PIN PUZZLE DATA STRUCTURES ──
interface Pin {
  id: string;
  label: string;
  x: number; // %
  y: number; // %
  width: number; // %
  orientation: 'HORIZONTAL' | 'VERTICAL';
  isPulled: boolean;
}

interface ChamberEntity {
  id: string;
  type: 'POLICE' | 'THIEF' | 'TREASURE' | 'WATER' | 'LAVA' | 'WEIGHT';
  name: string;
  icon: string;
  x: number; // %
  y: number; // %
  isEliminated?: boolean;
}

interface LevelStage {
  level: number;
  name: string;
  pins: Pin[];
  entities: ChamberEntity[];
  // Win condition: specific entities safe or eliminated
  requiredEliminatedThief: boolean;
  requiredTreasureCollected: boolean;
}

// ── 5 LEVELS PUZZLE DESIGN ──
const LEVELS: LevelStage[] = [
  {
    level: 1,
    name: 'Khởi Động Tạ Sắt',
    pins: [
      { id: 'pin_top', label: '1', x: 50, y: 32, width: 60, orientation: 'HORIZONTAL', isPulled: false },
      { id: 'pin_mid', label: '2', x: 50, y: 62, width: 60, orientation: 'HORIZONTAL', isPulled: false },
    ],
    entities: [
      { id: 'ent_weight', type: 'WEIGHT', name: 'Tạ Sắt 500kg', icon: '🏋️‍♂️', x: 50, y: 20 },
      { id: 'ent_thief', type: 'THIEF', name: 'Kẻ Trộm', icon: '🦹', x: 50, y: 50 },
      { id: 'ent_treasure', type: 'TREASURE', name: 'Rương Vàng', icon: '💰', x: 30, y: 80 },
      { id: 'ent_police', type: 'POLICE', name: 'Cảnh Sát Natcom', icon: '👮‍♂️', x: 70, y: 80 },
    ],
    requiredEliminatedThief: true,
    requiredTreasureCollected: true,
  },
  {
    level: 2,
    name: 'Nước Dập Dung Nham',
    pins: [
      { id: 'pin_water', label: '1', x: 50, y: 28, width: 55, orientation: 'HORIZONTAL', isPulled: false },
      { id: 'pin_lava', label: '2', x: 50, y: 56, width: 55, orientation: 'HORIZONTAL', isPulled: false },
    ],
    entities: [
      { id: 'ent_water', type: 'WATER', name: 'Bể Nước Xanh', icon: '💧', x: 50, y: 16 },
      { id: 'ent_lava', type: 'LAVA', name: 'Dung Nham Lửa', icon: '🔥', x: 50, y: 42 },
      { id: 'ent_thief', type: 'THIEF', name: 'Kẻ Trộm', icon: '🦹', x: 50, y: 72 },
      { id: 'ent_police', type: 'POLICE', name: 'Cảnh Sát', icon: '👮‍♂️', x: 50, y: 88 },
    ],
    requiredEliminatedThief: true,
    requiredTreasureCollected: false,
  },
  {
    level: 3,
    name: 'Giải Cứu Kho Báu 3 Ngăn',
    pins: [
      { id: 'pin_1', label: '1', x: 30, y: 35, width: 40, orientation: 'HORIZONTAL', isPulled: false },
      { id: 'pin_2', label: '2', x: 70, y: 35, width: 40, orientation: 'HORIZONTAL', isPulled: false },
      { id: 'pin_3', label: '3', x: 50, y: 65, width: 60, orientation: 'HORIZONTAL', isPulled: false },
    ],
    entities: [
      { id: 'ent_weight', type: 'WEIGHT', name: 'Khối Đá', icon: '🪨', x: 30, y: 20 },
      { id: 'ent_gold', type: 'TREASURE', name: 'Kho Báu Natcash', icon: '💎', x: 70, y: 20 },
      { id: 'ent_thief', type: 'THIEF', name: 'Kẻ Cướp', icon: '🦹', x: 30, y: 50 },
      { id: 'ent_police', type: 'POLICE', name: 'Cảnh Sát', icon: '👮‍♂️', x: 50, y: 82 },
    ],
    requiredEliminatedThief: true,
    requiredTreasureCollected: true,
  },
  {
    level: 4,
    name: 'Mê Cung Bẫy Lửa & Nước',
    pins: [
      { id: 'pin_w', label: '1', x: 30, y: 28, width: 35, orientation: 'HORIZONTAL', isPulled: false },
      { id: 'pin_l', label: '2', x: 70, y: 28, width: 35, orientation: 'HORIZONTAL', isPulled: false },
      { id: 'pin_mid', label: '3', x: 50, y: 55, width: 65, orientation: 'HORIZONTAL', isPulled: false },
    ],
    entities: [
      { id: 'ent_water', type: 'WATER', name: 'Nước', icon: '💧', x: 30, y: 16 },
      { id: 'ent_lava', type: 'LAVA', name: 'Nham Thạch', icon: '🔥', x: 70, y: 16 },
      { id: 'ent_thief', type: 'THIEF', name: 'Kẻ Trộm', icon: '🦹', x: 70, y: 42 },
      { id: 'ent_gold', type: 'TREASURE', name: 'Rương Vàng', icon: '💰', x: 30, y: 42 },
      { id: 'ent_police', type: 'POLICE', name: 'Cảnh Sát', icon: '👮‍♂️', x: 50, y: 80 },
    ],
    requiredEliminatedThief: true,
    requiredTreasureCollected: true,
  },
  {
    level: 5,
    name: 'Đại Chiến Trùm Trộm Cực Đại',
    pins: [
      { id: 'pin_1', label: '1', x: 50, y: 24, width: 60, orientation: 'HORIZONTAL', isPulled: false },
      { id: 'pin_2', label: '2', x: 30, y: 48, width: 35, orientation: 'HORIZONTAL', isPulled: false },
      { id: 'pin_3', label: '3', x: 70, y: 48, width: 35, orientation: 'HORIZONTAL', isPulled: false },
      { id: 'pin_4', label: '4', x: 50, y: 72, width: 60, orientation: 'HORIZONTAL', isPulled: false },
    ],
    entities: [
      { id: 'ent_water', type: 'WATER', name: 'Bể Nước', icon: '💧', x: 50, y: 12 },
      { id: 'ent_lava', type: 'LAVA', name: 'Dung Nham', icon: '🔥', x: 30, y: 36 },
      { id: 'ent_weight', type: 'WEIGHT', name: 'Tạ Sắt', icon: '🏋️‍♂️', x: 70, y: 36 },
      { id: 'ent_thief', type: 'THIEF', name: 'Trùm Trộm', icon: '🦹', x: 50, y: 60 },
      { id: 'ent_treasure', type: 'TREASURE', name: 'Kho Vàng Siêu Cấp', icon: '👑', x: 50, y: 85 },
    ],
    requiredEliminatedThief: true,
    requiredTreasureCollected: true,
  },
];

export const PullThePinGame: React.FC<PullThePinGameProps> = ({ onBack, onClaimReward }) => {
  const { t } = useTranslation();

  const [currentLevelIdx, setCurrentLevelIdx] = useState<number>(0);
  const [levelData, setLevelData] = useState<LevelStage>(LEVELS[0]);

  const [pins, setPins] = useState<Pin[]>([]);
  const [entities, setEntities] = useState<ChamberEntity[]>([]);

  const [soundEnabled, setSoundEnabled] = useState<boolean>(!GameSounds.isSoundMuted());
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  const [showWinModal, setShowWinModal] = useState<boolean>(false);
  const [showFailModal, setShowFailModal] = useState<boolean>(false);
  const [rewardAmount, setRewardAmount] = useState<number>(0);

  // Initialize level
  const loadLevel = useCallback((lvlIdx: number) => {
    const stage = LEVELS[lvlIdx % LEVELS.length];
    setLevelData(stage);
    setPins(JSON.parse(JSON.stringify(stage.pins)));
    setEntities(JSON.parse(JSON.stringify(stage.entities)));
    setShowWinModal(false);
    setShowFailModal(false);
  }, []);

  useEffect(() => {
    loadLevel(currentLevelIdx);
  }, [currentLevelIdx, loadLevel]);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    GameSounds.setMuted(!next);
  };

  // ── PULL PIN INTERACTION & REACTION ENGINE ──
  const handlePullPin = (pinId: string) => {
    GameSounds.playTap();

    setPins((prevPins) =>
      prevPins.map((p) => (p.id === pinId ? { ...p, isPulled: true } : p))
    );

    // Trigger reaction chain after animation
    setTimeout(() => {
      evaluateReactions(pinId);
    }, 400);
  };

  const evaluateReactions = (pulledPinId: string) => {
    setEntities((prevEntities) => {
      let updated = [...prevEntities];

      // Reaction Rules based on Level Stage:
      if (currentLevelIdx === 0) {
        // Level 1: If top pin pulled -> Weight drops on Thief!
        if (pulledPinId === 'pin_top') {
          GameSounds.playCorrect();
          updated = updated.map((e) => {
            if (e.id === 'ent_thief') return { ...e, isEliminated: true, name: 'Đã Bị Hạ!' };
            if (e.id === 'ent_weight') return { ...e, y: 50 };
            return e;
          });
        }
        // If mid pin pulled when thief is still alive -> Thief harms police!
        if (pulledPinId === 'pin_mid') {
          const isThiefAlive = updated.some((e) => e.id === 'ent_thief' && !e.isEliminated);
          if (isThiefAlive) {
            GameSounds.playLose();
            setShowFailModal(true);
            return updated;
          } else {
            GameSounds.playChestOpen();
            // Police gets treasure!
            triggerWin();
          }
        }
      } else if (currentLevelIdx === 1) {
        // Level 2: Water meets Lava
        if (pulledPinId === 'pin_water') {
          GameSounds.playCorrect();
          // Water solidifies Lava into rock!
          updated = updated.map((e) => {
            if (e.id === 'ent_lava') return { ...e, icon: '🪨', name: 'Đá Tảng Cứng' };
            if (e.id === 'ent_water') return { ...e, isEliminated: true };
            return e;
          });
        }
        if (pulledPinId === 'pin_lava') {
          const isLavaHot = updated.some((e) => e.id === 'ent_lava' && e.icon === '🔥');
          if (isLavaHot) {
            // Lava burns police!
            GameSounds.playLose();
            setShowFailModal(true);
          } else {
            // Rock drops on thief and police is safe!
            GameSounds.playWinFanfare();
            updated = updated.map((e) => (e.id === 'ent_thief' ? { ...e, isEliminated: true } : e));
            triggerWin();
          }
        }
      } else {
        // Levels 3, 4, 5
        GameSounds.playCorrect();
        // Check if all pins pulled
        const allPulled = pins.every((p) => p.id === pulledPinId || p.isPulled);
        if (allPulled) {
          triggerWin();
        }
      }

      return updated;
    });
  };

  const triggerWin = () => {
    GameSounds.playWinFanfare();
    const reward = 100 + (currentLevelIdx + 1) * 30;
    setRewardAmount(reward);
    setTimeout(() => {
      setShowWinModal(true);
    }, 600);
  };

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
        title={t('games.pullpin.title')}
        subtitle={t('games.pullpin.level_label', { level: currentLevelIdx + 1 })}
        onBack={onBack}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
        onRestart={() => loadLevel(currentLevelIdx)}
        restartTooltip={t('games.memory.btn_restart')}
        onHelp={() => setShowTutorial(true)}
      />

      {/* ── MAIN STAGE ── */}
      <main className="flex-1 max-w-md mx-auto w-full px-3 py-2 flex flex-col items-center justify-between space-y-3">
        {/* Status Bar */}
        <div className="w-full bg-slate-900/90 border border-slate-800 px-4 py-2.5 rounded-2xl shadow-md flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="bg-amber-500 text-slate-950 font-black text-xs px-2.5 py-1 rounded-xl shadow-xs">
              Lvl {currentLevelIdx + 1}
            </span>
            <span className="text-xs font-extrabold text-slate-200">{levelData.name}</span>
          </div>

          <span className="text-[11px] font-bold text-amber-400">
            {t('games.pullpin.btn_pull')} 👉
          </span>
        </div>

        {/* ── INTERACTIVE PIN PUZZLE CHAMBER (TOWER) ── */}
        <div className="relative w-full max-w-[360px] aspect-[3/4] bg-gradient-to-b from-slate-900 via-amber-950/20 to-slate-900 rounded-3xl border-4 border-amber-500/40 shadow-2xl p-4 overflow-hidden flex items-center justify-center">
          {/* Brick Stone Wall Texture */}
          <div className="absolute inset-0 bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:20px_20px] opacity-20 pointer-events-none" />

          {/* 1. RENDER ENTITIES (POLICE, THIEF, TREASURE, WATER, LAVA) */}
          {entities.map((entity) => {
            if (entity.isEliminated) return null;

            return (
              <div
                key={entity.id}
                className="absolute flex flex-col items-center justify-center -ml-7 -mt-7 transition-all duration-500 z-10"
                style={{ left: `${entity.x}%`, top: `${entity.y}%` }}
              >
                {/* Character / Item Icon Bubble */}
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-xl border-2 transition-transform ${
                    entity.type === 'POLICE'
                      ? 'bg-blue-600 border-blue-300 shadow-blue-500/30'
                      : entity.type === 'THIEF'
                      ? 'bg-rose-600 border-rose-300 shadow-rose-500/30 animate-pulse'
                      : entity.type === 'TREASURE'
                      ? 'bg-amber-500 border-yellow-200 shadow-yellow-500/50'
                      : entity.type === 'WATER'
                      ? 'bg-cyan-500 border-cyan-200 shadow-cyan-500/40'
                      : entity.type === 'LAVA'
                      ? 'bg-orange-600 border-red-300 shadow-red-500/40'
                      : 'bg-slate-700 border-slate-400'
                  }`}
                >
                  {entity.icon}
                </div>
                <span className="text-[10px] font-black text-white/90 bg-black/60 px-2 py-0.5 rounded-md mt-1 backdrop-blur-xs whitespace-nowrap">
                  {entity.name}
                </span>
              </div>
            );
          })}

          {/* 2. RENDER INTERACTIVE PINS (PULLABLE PINS) */}
          {pins.map((pin) => {
            return (
              <div
                key={pin.id}
                onClick={() => !pin.isPulled && handlePullPin(pin.id)}
                className={`absolute h-7 rounded-full flex items-center justify-between cursor-pointer z-30 transition-all duration-500 ${
                  pin.isPulled
                    ? 'translate-x-[150%] opacity-0 pointer-events-none'
                    : 'hover:scale-105 active:scale-95'
                }`}
                style={{
                  left: `${pin.x - pin.width / 2}%`,
                  top: `${pin.y}%`,
                  width: `${pin.width}%`,
                }}
              >
                {/* Golden Pull Ring Handle */}
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 border-2 border-white shadow-lg flex items-center justify-center font-black text-xs text-slate-950 -ml-2 shrink-0 animate-bounce">
                  {pin.label}
                </div>

                {/* Metallic Pin Shaft */}
                <div className="flex-1 h-3.5 bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 rounded-full border border-yellow-100 shadow-md flex items-center justify-center">
                  <div className="w-full h-1 bg-white/40 rounded-full" />
                </div>

                {/* Pointy Tip */}
                <div className="w-3 h-3 bg-amber-600 rounded-r-full -mr-1 shrink-0" />
              </div>
            );
          })}
        </div>

        {/* Footer Subtitle */}
        <p className="text-[11px] text-slate-400 text-center max-w-xs leading-relaxed">
          {t('games.pullpin.subtitle')}
        </p>
      </main>

      {/* ── WIN STAGE REWARD MODAL ── */}
      {showWinModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border-2 border-amber-500/70 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl relative overflow-hidden">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center text-3xl mx-auto shadow-xl animate-bounce">
              👮‍♂️
            </div>
            <div>
              <h3 className="text-lg font-black text-white">{t('games.pullpin.win_title')}</h3>
              <p className="text-xs text-slate-400 mt-1">
                {levelData.name} • {t('games.pullpin.level_label', { level: currentLevelIdx + 1 })}
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
              {t('games.pullpin.btn_next_level')}
            </button>
          </div>
        </div>
      )}

      {/* ── FAIL / TRAPPED MODAL ── */}
      {showFailModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border-2 border-rose-500/70 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl relative overflow-hidden">
            <div className="w-16 h-16 rounded-3xl bg-rose-600 text-white flex items-center justify-center text-3xl mx-auto shadow-xl animate-pulse">
              💥
            </div>
            <div>
              <h3 className="text-lg font-black text-white">{t('games.pullpin.fail_trap_title')}</h3>
              <p className="text-xs text-slate-400 mt-1">
                Kẻ trộm hoặc bẫy đã làm hỏng nhiệm vụ! Hãy thử lại theo thứ tự khác.
              </p>
            </div>
            <button
              onClick={() => loadLevel(currentLevelIdx)}
              className="w-full py-3 bg-gradient-to-r from-rose-600 to-red-500 text-white font-black rounded-xl text-sm shadow-lg active:scale-95 transition flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Chơi Lại Màn Này</span>
            </button>
          </div>
        </div>
      )}

      {/* ── GAME TUTORIAL MODAL ── */}
      <GameTutorialModal
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
        gameTitle={t('games.pullpin.title')}
        gameIcon="📌"
        goal={t('games.pullpin.tutorial.goal')}
        controls={t('games.pullpin.tutorial.controls')}
        scoring={t('games.pullpin.tutorial.scoring')}
        tips={t('games.pullpin.tutorial.tips')}
      />
    </div>
  );
};
