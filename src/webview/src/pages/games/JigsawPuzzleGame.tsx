import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Hash, Sparkles, RotateCcw, ArrowRight } from 'lucide-react';
import { soundHaptics } from '../../utils/soundHaptics';
import { GameHeader } from '../../components/common/GameHeader';
import { GameTutorialModal } from '../../components/common/GameTutorialModal';

// Project art assets
import aiGift from '../../assets/figma/ai-gift-orange.png';
import photoGrocery from '../../assets/figma/photo-grocery.jpg';
import photoData from '../../assets/figma/photo-data.jpg';
import aiGames from '../../assets/figma/ai-games-orange.png';
import aiMissions from '../../assets/figma/ai-missions-orange.png';

export interface JigsawPuzzleGameProps {
  onBack: () => void;
  onClaimReward?: (pointsWon: number) => void;
}

interface PuzzleLevel {
  level: number;
  titleKey: string;
  defaultTitle: string;
  gridSize: number; // 3 for 3x3, 4 for 4x4
  image: string;
  rewardNatcash: number;
  timeLimitSec?: number;
}

const PUZZLE_LEVELS: PuzzleLevel[] = [
  {
    level: 1,
    titleKey: 'games.jigsaw.level_1_title',
    defaultTitle: 'Hộp Quà May Mắn 3D',
    gridSize: 3,
    image: aiGift,
    rewardNatcash: 20,
  },
  {
    level: 2,
    titleKey: 'games.jigsaw.level_2_title',
    defaultTitle: 'Siêu Thị Tiện Lợi Natcash',
    gridSize: 3,
    image: photoGrocery,
    rewardNatcash: 30,
  },
  {
    level: 3,
    titleKey: 'games.jigsaw.level_3_title',
    defaultTitle: 'Thế Giới Công Nghệ Số',
    gridSize: 3,
    image: photoData,
    rewardNatcash: 40,
  },
  {
    level: 4,
    titleKey: 'games.jigsaw.level_4_title',
    defaultTitle: 'Đấu Trường GameHub 3D',
    gridSize: 4,
    image: aiGames,
    rewardNatcash: 60,
  },
  {
    level: 5,
    titleKey: 'games.jigsaw.level_5_title',
    defaultTitle: 'Hành Tinh Sứ Mệnh Kho Báu',
    gridSize: 4,
    image: aiMissions,
    rewardNatcash: 100,
  },
];

export const JigsawPuzzleGame: React.FC<JigsawPuzzleGameProps> = ({ onBack, onClaimReward }) => {
  const { t } = useTranslation();

  const [currentLevel, setCurrentLevel] = useState(1);
  const [tiles, setTiles] = useState<number[]>([]); // tiles[currentSlotIndex] = originalPieceId
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [score, setScore] = useState(0);
  const [natcashEarned, setNatcashEarned] = useState(0);
  const [isWon, setIsWon] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showNumbers, setShowNumbers] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hintsRemaining, setHintsRemaining] = useState(3);
  const [justSnappedSlot, setJustSnappedSlot] = useState<number | null>(null);

  // Confetti particles on victory
  const [confetti, setConfetti] = useState<
    Array<{ id: number; x: number; y: number; color: string; size: number; delay: number }>
  >([]);

  const activeLevel = PUZZLE_LEVELS.find((l) => l.level === currentLevel) || PUZZLE_LEVELS[0];
  const totalPieces = activeLevel.gridSize * activeLevel.gridSize;

  // Scramble tiles with guarantee that it's not solved at start
  const scrambleTiles = useCallback((count: number): number[] => {
    let array = Array.from({ length: count }, (_, i) => i);
    let isSolved = true;
    let attempts = 0;

    while (isSolved && attempts < 20) {
      attempts++;
      // Fisher-Yates shuffle
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      // Check if at least 2 tiles are displaced
      let matchingCount = 0;
      for (let i = 0; i < array.length; i++) {
        if (array[i] === i) matchingCount++;
      }
      if (matchingCount < array.length - 2) {
        isSolved = false;
      }
    }
    return array;
  }, []);

  // Initialize or reset level
  const startLevel = useCallback(
    (lvlNum: number) => {
      const lvl = PUZZLE_LEVELS.find((l) => l.level === lvlNum) || PUZZLE_LEVELS[0];
      setCurrentLevel(lvl.level);
      setIsWon(false);
      setSelectedSlot(null);
      setMoves(0);
      setHintsRemaining(3);
      setJustSnappedSlot(null);
      setConfetti([]);

      const initialTiles = scrambleTiles(lvl.gridSize * lvl.gridSize);
      setTiles(initialTiles);
    },
    [scrambleTiles]
  );

  useEffect(() => {
    startLevel(1);
  }, [startLevel]);

  // Handle tile tap / swap interaction
  const handleTileClick = (slotIndex: number) => {
    if (isWon) return;

    soundHaptics.playClick();
    soundHaptics.triggerHaptic([25]);

    // If no tile selected yet, select this tile
    if (selectedSlot === null) {
      setSelectedSlot(slotIndex);
      return;
    }

    // If tapped the same tile, deselect
    if (selectedSlot === slotIndex) {
      setSelectedSlot(null);
      return;
    }

    // Swap the two tiles!
    const newTiles = [...tiles];
    const prevSlot = selectedSlot;
    [newTiles[prevSlot], newTiles[slotIndex]] = [newTiles[slotIndex], newTiles[prevSlot]];

    soundHaptics.playCardFlip();
    soundHaptics.triggerHaptic([35]);
    setSelectedSlot(null);
    setMoves((m) => m + 1);
    setTiles(newTiles);

    // Check if one of the swapped tiles landed on its correct position
    if (newTiles[slotIndex] === slotIndex || newTiles[prevSlot] === prevSlot) {
      const correctSlot = newTiles[slotIndex] === slotIndex ? slotIndex : prevSlot;
      setJustSnappedSlot(correctSlot);
      soundHaptics.playMatchSuccess();
      setTimeout(() => setJustSnappedSlot(null), 600);
    }

    // Check win condition: all tiles match their slot indices!
    const allCorrect = newTiles.every((val, idx) => val === idx);
    if (allCorrect) {
      handleVictory(activeLevel);
    }
  };

  // Victory celebration
  const handleVictory = (levelConfig: PuzzleLevel) => {
    setIsWon(true);
    soundHaptics.playVictoryFanfare();
    soundHaptics.triggerHaptic([80, 50, 100, 50, 160]);

    const reward = levelConfig.rewardNatcash;
    setScore((s) => s + 100);
    setNatcashEarned((prev) => prev + reward);
    if (onClaimReward) onClaimReward(reward);

    // Generate confetti burst
    const colors = ['#F59E0B', '#10B981', '#3B82F6', '#EC4899', '#8B5CF6', '#EF4444'];
    const parts = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -10 - Math.random() * 20,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 6 + Math.random() * 8,
      delay: Math.random() * 0.6,
    }));
    setConfetti(parts);
  };

  // Helper Hint: Swap 1 wrong tile into its correct position
  const handleUseHint = () => {
    if (hintsRemaining <= 0 || isWon) return;

    // Find first incorrectly placed tile
    const wrongSlot = tiles.findIndex((targetId, slot) => targetId !== slot);
    if (wrongSlot === -1) return;

    // The piece that belongs to `wrongSlot` is currently sitting at `sourceSlot`
    const pieceWanted = wrongSlot;
    const sourceSlot = tiles.indexOf(pieceWanted);

    if (sourceSlot === -1) return;

    // Perform the swap
    const newTiles = [...tiles];
    [newTiles[wrongSlot], newTiles[sourceSlot]] = [newTiles[sourceSlot], newTiles[wrongSlot]];

    setTiles(newTiles);
    setHintsRemaining((h) => h - 1);
    setMoves((m) => m + 1);
    soundHaptics.playMatchSuccess();
    soundHaptics.triggerHaptic([50, 30, 70]);

    setJustSnappedSlot(wrongSlot);
    setTimeout(() => setJustSnappedSlot(null), 700);

    // Check if that completed the puzzle
    if (newTiles.every((v, i) => v === i)) {
      handleVictory(activeLevel);
    }
  };

  // Count correct pieces
  const correctCount = tiles.filter((targetId, slot) => targetId === slot).length;

  return (
    <div
      style={{ touchAction: 'none' }}
      className="relative flex flex-col h-[100dvh] w-full max-w-[430px] mx-auto bg-slate-950 select-none overflow-hidden overscroll-none"
    >
      {/* ── 1. PINNED GAME HEADER ── */}
      <GameHeader
        title={t('games.jigsaw.title', 'Ghép Hình: Jigsaw Puzzle')}
        subtitle={`${t(activeLevel.titleKey, activeLevel.defaultTitle)} • ${activeLevel.gridSize}x${activeLevel.gridSize}`}
        onBack={onBack}
        soundEnabled={soundEnabled}
        onToggleSound={() => {
          soundHaptics.toggleMute();
          setSoundEnabled(!soundHaptics.isMuted());
        }}
        onRestart={() => startLevel(currentLevel)}
        onHelp={() => setShowTutorial(true)}
      />

      {/* ── 2. HUD STATUS BAR ── */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800/80 z-10 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400">{t('games.jigsaw.matched', 'Khớp')}:</span>
          <span className="text-xs font-black text-amber-400 font-mono">
            {correctCount} / {totalPieces} 🧩
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400">{t('games.jigsaw.moves', 'Lượt đổi')}:</span>
          <span className="text-xs font-black text-sky-400 font-mono">{moves}</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
            <span className="text-xs">🪙</span>
            <span className="text-xs font-black text-amber-400 font-mono">+{natcashEarned}</span>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold leading-none">
              {t('games.jigsaw.score', 'Điểm')}
            </span>
            <span className="text-base font-black text-amber-400 font-mono leading-none">{score}</span>
          </div>
        </div>
      </div>

      {/* ── 3. TOOLBAR CONTROLS ── */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/40 z-10">
        <div className="flex items-center gap-2">
          {/* Peek preview button */}
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 border ${
              showPreview
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                : 'bg-slate-800/90 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
            <span>{showPreview ? t('games.jigsaw.hide_peek', 'Ẩn Mẫu') : t('games.jigsaw.peek', 'Xem Mẫu')}</span>
          </button>

          {/* Show / Hide Numbers Toggle */}
          <button
            onClick={() => setShowNumbers(!showNumbers)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 border ${
              showNumbers
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                : 'bg-slate-800/90 text-slate-400 border-slate-700'
            }`}
          >
            <Hash size={14} />
            <span>{t('games.jigsaw.numbers', 'Số')}</span>
          </button>
        </div>

        {/* Hint Button */}
        <button
          onClick={handleUseHint}
          disabled={hintsRemaining <= 0 || isWon}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 border ${
            hintsRemaining > 0 && !isWon
              ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-pink-300 border-pink-500/40 shadow-sm'
              : 'opacity-40 bg-slate-800 text-slate-500 border-slate-700'
          }`}
        >
          <Sparkles size={14} className="text-pink-400" />
          <span>{t('games.jigsaw.hint', 'Gợi ý')} ({hintsRemaining})</span>
        </button>
      </div>

      {/* ── 4. MAIN PUZZLE ARENA ── */}
      <div className="relative flex-1 w-full flex flex-col items-center justify-center p-4 overflow-hidden">
        {/* Full Image Preview Modal / Overlay */}
        {showPreview && (
          <div
            onClick={() => setShowPreview(false)}
            className="absolute inset-0 z-30 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center p-6 animate-fade-in cursor-pointer"
          >
            <div className="relative p-2 bg-slate-900 border-2 border-amber-500 rounded-2xl shadow-2xl max-w-[320px] w-full">
              <img
                src={activeLevel.image}
                alt="Preview"
                className="w-full aspect-square object-cover rounded-xl pointer-events-none"
              />
              <p className="text-center text-xs font-bold text-amber-400 mt-2">
                {t('games.jigsaw.tap_to_close_preview', '👆 Chạm bất kỳ đâu để đóng ảnh mẫu')}
              </p>
            </div>
          </div>
        )}

        {/* Puzzle Board Grid Container */}
        <div
          className={`relative w-full max-w-[340px] aspect-square rounded-2xl p-2 bg-slate-900 border-2 shadow-2xl transition-all duration-300 ${
            isWon ? 'border-emerald-500 shadow-emerald-500/20' : 'border-slate-800'
          }`}
        >
          {/* Ghost outline background to help visual positioning */}
          <div
            className="absolute inset-2 rounded-xl opacity-10 bg-cover bg-center pointer-events-none"
            style={{ backgroundImage: `url(${activeLevel.image})` }}
          />

          {/* Grid of tiles */}
          <div
            className="relative w-full h-full grid gap-1.5"
            style={{
              gridTemplateColumns: `repeat(${activeLevel.gridSize}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${activeLevel.gridSize}, minmax(0, 1fr))`,
            }}
          >
            {tiles.map((targetPieceId, slotIndex) => {
              const gridSize = activeLevel.gridSize;
              const origRow = Math.floor(targetPieceId / gridSize);
              const origCol = targetPieceId % gridSize;

              // Calculate sprite offset
              const bgPosX = (origCol / (gridSize - 1)) * 100;
              const bgPosY = (origRow / (gridSize - 1)) * 100;

              const isSelected = selectedSlot === slotIndex;
              const isCorrect = targetPieceId === slotIndex;
              const isSnapped = justSnappedSlot === slotIndex;

              return (
                <div
                  key={slotIndex}
                  onClick={() => handleTileClick(slotIndex)}
                  style={{
                    backgroundImage: `url(${activeLevel.image})`,
                    backgroundSize: `${gridSize * 100}% ${gridSize * 100}%`,
                    backgroundPosition: `${bgPosX}% ${bgPosY}%`,
                  }}
                  className={`relative rounded-xl cursor-pointer overflow-hidden transition-all duration-200 select-none ${
                    isSelected
                      ? 'ring-4 ring-amber-400 scale-95 shadow-xl z-20 brightness-110'
                      : isSnapped
                      ? 'ring-4 ring-emerald-400 scale-105 shadow-xl z-10 animate-bounce'
                      : isCorrect
                      ? 'ring-1 ring-emerald-500/40 shadow-sm'
                      : 'border border-slate-700/60 active:scale-95'
                  }`}
                >
                  {/* Correct checkmark badge */}
                  {isCorrect && !isWon && (
                    <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-emerald-500/90 text-slate-950 flex items-center justify-center text-[9px] font-black shadow pointer-events-none">
                      ✓
                    </div>
                  )}

                  {/* Tile number helper */}
                  {showNumbers && !isWon && (
                    <div
                      className={`absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-black font-mono shadow pointer-events-none ${
                        isCorrect
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/50'
                          : 'bg-slate-950/80 text-slate-300 border border-slate-700/50'
                      }`}
                    >
                      {targetPieceId + 1}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Full-bleed Victory Overlay (Seamlessly reveals un-fragmented image) */}
          {isWon && (
            <div className="absolute inset-2 rounded-xl overflow-hidden shadow-2xl animate-fade-in z-20 border-2 border-emerald-400">
              <img
                src={activeLevel.image}
                alt="Completed Puzzle"
                className="w-full h-full object-cover pointer-events-none animate-pulse"
              />
            </div>
          )}
        </div>

        {/* Instructional tip footer */}
        <p className="mt-4 text-[11px] text-slate-400 font-medium text-center">
          {t('games.jigsaw.tap_instructions', '👉 Chạm vào mảnh thứ nhất, sau đó chạm mảnh thứ hai để đổi chỗ!')}
        </p>

        {/* Confetti particles */}
        {confetti.map((p) => (
          <div
            key={p.id}
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size * 1.4}px`,
              backgroundColor: p.color,
              animationDelay: `${p.delay}s`,
            }}
            className="absolute rounded-sm pointer-events-none animate-fall"
          />
        ))}
      </div>

      {/* ── 5. VICTORY MODAL ── */}
      {isWon && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-emerald-500/50 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl relative">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-400 to-emerald-400 text-slate-950 flex items-center justify-center text-3xl mx-auto shadow-xl animate-bounce">
              🏆
            </div>
            <div>
              <h3 className="text-xl font-black text-emerald-400">
                {t('games.jigsaw.level_cleared', { level: currentLevel, defaultValue: `HOÀN THÀNH MÀN ${currentLevel}!` })}
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                {t('games.jigsaw.cleared_desc', {
                  title: t(activeLevel.titleKey, activeLevel.defaultTitle),
                  moves: moves,
                  defaultValue: `Xuất sắc! Bạn đã ghép thành công bức tranh "${t(activeLevel.titleKey, activeLevel.defaultTitle)}" chỉ trong ${moves} lượt đổi!`,
                })}
              </p>
            </div>

            <div className="bg-slate-800/80 rounded-2xl p-3 border border-slate-700 text-xs flex justify-between items-center">
              <span className="text-slate-400">{t('games.jigsaw.reward_label', 'Xu Natcash thưởng:')}</span>
              <span className="font-mono font-bold text-amber-400">
                +{activeLevel.rewardNatcash} {t('games.jigsaw.coin_unit', 'Xu 🪙')}
              </span>
            </div>

            <div className="flex gap-2">
              {currentLevel < PUZZLE_LEVELS.length ? (
                <button
                  onClick={() => startLevel(currentLevel + 1)}
                  className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-green-400 hover:from-emerald-400 text-slate-950 font-black rounded-2xl text-xs shadow-lg active:scale-95 transition flex items-center justify-center gap-1.5"
                >
                  <span>{t('games.jigsaw.next_level', 'MÀN TIẾP THEO')}</span>
                  <ArrowRight size={14} />
                </button>
              ) : (
                <button
                  onClick={() => startLevel(1)}
                  className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 text-slate-950 font-black rounded-2xl text-xs shadow-lg active:scale-95 transition flex items-center justify-center gap-1.5"
                >
                  <RotateCcw size={14} />
                  <span>{t('games.jigsaw.play_again', 'CHƠI LẠI TỪ ĐẦU')}</span>
                </button>
              )}
              <button
                onClick={onBack}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl text-xs border border-slate-700 active:scale-95 transition"
              >
                {t('games.jigsaw.back_to_hub', 'VỀ GAMEHUB')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 6. TUTORIAL MODAL ── */}
      <GameTutorialModal
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
        gameTitle={t('games.jigsaw.title', 'Ghép Hình: Jigsaw Puzzle')}
        goal={t('games.jigsaw.tutorial_goal', 'Hoán đổi các mảnh ghép để sắp xếp lại thành bức ảnh phần thưởng hoàn chỉnh.')}
        controls={t('games.jigsaw.tutorial_controls', 'Chạm vào mảnh thứ nhất, sau đó chạm vào mảnh thứ hai để đổi chỗ hai mảnh cho nhau. Bật số thứ tự hoặc xem ảnh mẫu để hỗ trợ.')}
        scoring={t('games.jigsaw.tutorial_scoring', 'Mỗi màn hoàn thành cộng ngay +100 Điểm và Xu thưởng Natcash tương ứng.')}
        tips={t('games.jigsaw.tutorial_tips', 'Nên ghép các góc và mép ngoài trước, sau đó tìm các chi tiết nổi bật ở trung tâm bức ảnh.')}
      />
    </div>
  );
};
