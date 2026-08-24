import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, Eye, Sparkles, Flame, Zap, RotateCcw } from 'lucide-react';
import { GameSounds } from '../../utils/audio';
import { GameHeader } from '../../components/common/GameHeader';
import { GameTutorialModal } from '../../components/common/GameTutorialModal';

export interface MemoryMatchGameProps {
  onBack: () => void;
  onClaimReward?: (pointsWon: number) => void;
}

export type ThemeType = 'PARTNERS' | 'CARNIVAL' | 'GEMS';
export type DifficultyType = 'EASY' | 'NORMAL' | 'HARD';

interface CardDef {
  pairId: number;
  icon: string;
  label: string;
  bgGradient: string;
  accentColor: string;
}

interface CardItem {
  id: number;
  pairId: number;
  icon: string;
  label: string;
  bgGradient: string;
  accentColor: string;
  isFlipped: boolean;
  isMatched: boolean;
}

// ── THEME 1: ĐỐI TÁC LIÊN MINH & VÍ NATCASH ──
const PARTNERS_THEME_CARDS: CardDef[] = [
  { pairId: 1, icon: '🛒', label: 'Delimart', bgGradient: 'from-amber-500 to-orange-600', accentColor: '#F59E0B' },
  { pairId: 2, icon: '⛽', label: 'Total', bgGradient: 'from-red-500 to-rose-600', accentColor: '#EF4444' },
  { pairId: 3, icon: '📡', label: 'Natcom 4G', bgGradient: 'from-blue-500 to-indigo-600', accentColor: '#3B82F6' },
  { pairId: 4, icon: '👑', label: 'Natcash', bgGradient: 'from-yellow-400 to-amber-500', accentColor: '#EAB308' },
  { pairId: 5, icon: '📱', label: 'Ví Tiền', bgGradient: 'from-emerald-500 to-teal-600', accentColor: '#10B981' },
  { pairId: 6, icon: '💳', label: 'Thẻ Kredi', bgGradient: 'from-purple-500 to-pink-600', accentColor: '#A855F7' },
  { pairId: 7, icon: '☀️', label: 'Solar 24/7', bgGradient: 'from-orange-400 to-amber-600', accentColor: '#F97316' },
  { pairId: 8, icon: '🏬', label: 'Siêu Thị', bgGradient: 'from-cyan-500 to-blue-600', accentColor: '#06B6D4' },
  { pairId: 9, icon: '🎁', label: 'Quà VIP', bgGradient: 'from-rose-500 to-pink-600', accentColor: '#F43F5E' },
  { pairId: 10, icon: '💎', label: 'Kim Cương', bgGradient: 'from-violet-500 to-purple-600', accentColor: '#8B5CF6' },
];

// ── THEME 2: LỄ HỘI KANAVAL & KHO BÁU CARIBE ──
const CARNIVAL_THEME_CARDS: CardDef[] = [
  { pairId: 1, icon: '🥁', label: 'Trống Rara', bgGradient: 'from-amber-500 to-red-600', accentColor: '#F59E0B' },
  { pairId: 2, icon: '🎭', label: 'Mặt Nạ', bgGradient: 'from-purple-500 to-pink-600', accentColor: '#A855F7' },
  { pairId: 3, icon: '🏴‍☠️', label: 'Rương Vàng', bgGradient: 'from-yellow-500 to-amber-700', accentColor: '#EAB308' },
  { pairId: 4, icon: '🏮', label: 'Hải Đăng', bgGradient: 'from-orange-500 to-rose-600', accentColor: '#F97316' },
  { pairId: 5, icon: '⛵', label: 'Thuyền Buồm', bgGradient: 'from-sky-500 to-blue-600', accentColor: '#0EA5E9' },
  { pairId: 6, icon: '🦪', label: 'Ngọc Trai', bgGradient: 'from-teal-400 to-emerald-600', accentColor: '#14B8A6' },
  { pairId: 7, icon: '🌴', label: 'Cọ Caribe', bgGradient: 'from-emerald-500 to-green-700', accentColor: '#10B981' },
  { pairId: 8, icon: '🦜', label: 'Vẹt Nhiệt Đới', bgGradient: 'from-lime-500 to-emerald-600', accentColor: '#84CC16' },
  { pairId: 9, icon: '🐬', label: 'Cá Heo', bgGradient: 'from-cyan-500 to-blue-700', accentColor: '#06B6D4' },
  { pairId: 10, icon: '👑', label: 'Vương Miện', bgGradient: 'from-yellow-400 to-amber-600', accentColor: '#EAB308' },
];

// ── THEME 3: ĐÁ QUÝ & THẦN TÀI MAY MẮN ──
const GEMS_THEME_CARDS: CardDef[] = [
  { pairId: 1, icon: '💎', label: 'Kim Cương', bgGradient: 'from-cyan-400 to-blue-600', accentColor: '#06B6D4' },
  { pairId: 2, icon: '🔴', label: 'Ruby Đỏ', bgGradient: 'from-rose-500 to-red-600', accentColor: '#F43F5E' },
  { pairId: 3, icon: '🟢', label: 'Lục Bảo', bgGradient: 'from-emerald-400 to-teal-600', accentColor: '#10B981' },
  { pairId: 4, icon: '🔮', label: 'Thạch Anh', bgGradient: 'from-purple-500 to-indigo-600', accentColor: '#A855F7' },
  { pairId: 5, icon: '🪙', label: 'Xu Vàng', bgGradient: 'from-amber-400 to-yellow-600', accentColor: '#F59E0B' },
  { pairId: 6, icon: '🔔', label: 'Chuông Vàng', bgGradient: 'from-yellow-400 to-orange-500', accentColor: '#EAB308' },
  { pairId: 7, icon: '⭐', label: 'Sao Vàng', bgGradient: 'from-amber-300 to-orange-500', accentColor: '#F59E0B' },
  { pairId: 8, icon: '🔥', label: 'Lửa Thần', bgGradient: 'from-orange-500 to-red-600', accentColor: '#F97316' },
  { pairId: 9, icon: '🍀', label: 'Cỏ 4 Lá', bgGradient: 'from-green-400 to-emerald-600', accentColor: '#22C55E' },
  { pairId: 10, icon: '💖', label: 'Trái Tim', bgGradient: 'from-pink-500 to-rose-600', accentColor: '#EC4899' },
];

export const MemoryMatchGame: React.FC<MemoryMatchGameProps> = ({ onBack, onClaimReward }) => {
  const { t } = useTranslation();

  // Settings state
  const [currentTheme, setCurrentTheme] = useState<ThemeType>('PARTNERS');
  const [difficulty, setDifficulty] = useState<DifficultyType>('EASY');

  // Game state
  const [cards, setCards] = useState<CardItem[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [matchedCount, setMatchedCount] = useState<number>(0);
  const [moves, setMoves] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(45);
  const [totalTime, setTotalTime] = useState<number>(45);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isWon, setIsWon] = useState<boolean>(false);
  const [isTimeout, setIsTimeout] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(!GameSounds.isSoundMuted());
  const [showRewardModal, setShowRewardModal] = useState<boolean>(false);
  const [rewardAmount, setRewardAmount] = useState<number>(0);
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  const [matchPopup, setMatchPopup] = useState<string | null>(null);

  // Power-ups and Combos
  const [peekAvailable, setPeekAvailable] = useState<boolean>(true);
  const [isPeeking, setIsPeeking] = useState<boolean>(false);
  const [freezeAvailable, setFreezeAvailable] = useState<boolean>(true);
  const [comboStreak, setComboStreak] = useState<number>(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    GameSounds.setMuted(!next);
  };

  // Get active source deck based on theme & difficulty
  const getDeckConfig = useCallback(() => {
    let sourcePool: CardDef[];
    if (currentTheme === 'CARNIVAL') {
      sourcePool = CARNIVAL_THEME_CARDS;
    } else if (currentTheme === 'GEMS') {
      sourcePool = GEMS_THEME_CARDS;
    } else {
      sourcePool = PARTNERS_THEME_CARDS;
    }

    let pairsCount = 6; // EASY: 12 cards (4x3)
    let initialTime = 45;

    if (difficulty === 'NORMAL') {
      pairsCount = 8; // NORMAL: 16 cards (4x4)
      initialTime = 55;
    } else if (difficulty === 'HARD') {
      pairsCount = 10; // HARD: 20 cards (5x4)
      initialTime = 65;
    }

    return {
      cards: sourcePool.slice(0, pairsCount),
      pairsCount,
      initialTime,
    };
  }, [currentTheme, difficulty]);

  // Shuffle and start new game
  const shuffleDeck = useCallback(() => {
    const config = getDeckConfig();
    const deck: CardItem[] = [];
    let idCounter = 0;

    config.cards.forEach((card) => {
      deck.push({
        id: idCounter++,
        pairId: card.pairId,
        icon: card.icon,
        label: card.label,
        bgGradient: card.bgGradient,
        accentColor: card.accentColor,
        isFlipped: false,
        isMatched: false,
      });
      deck.push({
        id: idCounter++,
        pairId: card.pairId,
        icon: card.icon,
        label: card.label,
        bgGradient: card.bgGradient,
        accentColor: card.accentColor,
        isFlipped: false,
        isMatched: false,
      });
    });

    // Fisher-Yates Shuffle
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    setCards(deck);
    setFlippedIndices([]);
    setMatchedCount(0);
    setMoves(0);
    setTimeLeft(config.initialTime);
    setTotalTime(config.initialTime);
    setIsPlaying(true);
    setIsWon(false);
    setIsTimeout(false);
    setPeekAvailable(true);
    setIsPeeking(false);
    setFreezeAvailable(true);
    setComboStreak(0);
  }, [getDeckConfig]);

  useEffect(() => {
    shuffleDeck();
  }, [shuffleDeck]);

  // Countdown timer
  useEffect(() => {
    if (!isPlaying || isWon || isTimeout) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setIsPlaying(false);
          setIsTimeout(true);
          GameSounds.playLose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, isWon, isTimeout]);

  // Power-up 1: X-Ray Peek (Lật ngửa toàn bộ thẻ trong 1.5s)
  const handleXRayPeek = () => {
    if (!peekAvailable || !isPlaying || isWon || isTimeout || isPeeking) return;
    setPeekAvailable(false);
    setIsPeeking(true);
    GameSounds.playFiftyFifty();

    setCards((prev) => prev.map((c) => ({ ...c, isFlipped: true })));

    setTimeout(() => {
      setCards((prev) =>
        prev.map((c) => (c.isMatched ? { ...c, isFlipped: true } : { ...c, isFlipped: false }))
      );
      setIsPeeking(false);
      setFlippedIndices([]);
    }, 1500);
  };

  // Power-up 2: Time Freeze (+10 Giây)
  const handleTimeFreeze = () => {
    if (!freezeAvailable || !isPlaying || isWon || isTimeout) return;
    setFreezeAvailable(false);
    GameSounds.playFiftyFifty();
    setTimeLeft((prev) => prev + 10);
    setMatchPopup('+10s TIME BONUS! ⏳');
    setTimeout(() => setMatchPopup(null), 1200);
  };

  // Card flip interaction
  const handleCardClick = (index: number) => {
    if (!isPlaying || isWon || isTimeout || isPeeking) return;
    if (cards[index]?.isFlipped || cards[index]?.isMatched) return;
    if (flippedIndices.length >= 2) return;

    GameSounds.playTap();
    const newFlipped = [...flippedIndices, index];

    setCards((prev) => {
      const next = prev.map((c, i) => (i === index ? { ...c, isFlipped: true } : c));
      return next;
    });
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      const [firstIdx, secondIdx] = newFlipped;
      const firstCard = cards[firstIdx];
      const secondCard = cards[secondIdx];

      if (firstCard && secondCard && firstCard.pairId === secondCard.pairId) {
        // MATCHED!
        setTimeout(() => {
          GameSounds.playCorrect();
          const nextStreak = comboStreak + 1;
          setComboStreak(nextStreak);

          setCards((prev) =>
            prev.map((c, i) =>
              i === firstIdx || i === secondIdx ? { ...c, isMatched: true, isFlipped: true } : c
            )
          );
          setFlippedIndices([]);

          if (nextStreak >= 2) {
            setMatchPopup(`COMBO x${nextStreak}! 🔥`);
          } else {
            setMatchPopup(`${firstCard.label} MATCH! ✨`);
          }
          setTimeout(() => setMatchPopup(null), 1000);

          const config = getDeckConfig();
          setMatchedCount((prev) => {
            const nextMatched = prev + 1;
            if (nextMatched === config.pairsCount) {
              setIsWon(true);
              setIsPlaying(false);
              const difficultyMultiplier = difficulty === 'HARD' ? 1.5 : difficulty === 'NORMAL' ? 1.2 : 1.0;
              const basePoints = config.pairsCount * 20;
              const timeBonus = Math.round(timeLeft * 2 * difficultyMultiplier);
              const comboBonus = nextStreak * 15;
              const totalReward = Math.round(basePoints + timeBonus + comboBonus);

              setRewardAmount(totalReward);
              setTimeout(() => {
                setShowRewardModal(true);
                GameSounds.playWinFanfare();
              }, 600);
            }
            return nextMatched;
          });
        }, 350);
      } else {
        // NO MATCH -> Reset combo and flip back
        setTimeout(() => {
          GameSounds.playWrong();
          setComboStreak(0);
          setCards((prev) =>
            prev.map((c, i) =>
              (i === firstIdx || i === secondIdx) && !c.isMatched ? { ...c, isFlipped: false } : c
            )
          );
          setFlippedIndices([]);
        }, 650);
      }
    }
  };

  const claimReward = () => {
    if (onClaimReward && rewardAmount > 0) {
      onClaimReward(rewardAmount);
    }
    setShowRewardModal(false);
  };

  const config = getDeckConfig();
  const progressPercent = Math.min(100, Math.round((matchedCount / config.pairsCount) * 100));

  // Determine grid columns
  const gridColsClass = difficulty === 'HARD' ? 'grid-cols-4 sm:grid-cols-5' : 'grid-cols-4';

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans select-none pb-12 animate-fade-in">
      <GameHeader
        title={t('games.memory.title')}
        subtitle={t('games.memory.matches', { matched: matchedCount, total: config.pairsCount })}
        onBack={onBack}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
        onRestart={shuffleDeck}
        restartTooltip={t('games.memory.btn_restart')}
        onHelp={() => setShowTutorial(true)}
      />

      {/* ── MAIN STAGE ── */}
      <main className="flex-1 max-w-lg mx-auto w-full px-3 py-2 flex flex-col items-center justify-between space-y-3">
        {/* ── 1. THEME & DIFFICULTY SELECTOR TABS ── */}
        <div className="w-full space-y-2">
          {/* Theme Selector */}
          <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 p-1 rounded-2xl gap-1 shadow-md">
            <button
              onClick={() => {
                setCurrentTheme('PARTNERS');
              }}
              className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] sm:text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                currentTheme === 'PARTNERS'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🏢</span>
              <span>{t('games.memory.theme_partners', { defaultValue: 'Đối Tác & Ví' })}</span>
            </button>
            <button
              onClick={() => {
                setCurrentTheme('CARNIVAL');
              }}
              className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] sm:text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                currentTheme === 'CARNIVAL'
                  ? 'bg-pink-500 text-white shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🎭</span>
              <span>{t('games.memory.theme_carnival', { defaultValue: 'Lễ Hội Caribe' })}</span>
            </button>
            <button
              onClick={() => {
                setCurrentTheme('GEMS');
              }}
              className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] sm:text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                currentTheme === 'GEMS'
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>💎</span>
              <span>{t('games.memory.theme_gems', { defaultValue: 'Đá Quý May Mắn' })}</span>
            </button>
          </div>

          {/* Difficulty Levels */}
          <div className="flex items-center justify-between gap-1.5 text-[10px] sm:text-[11px] font-bold">
            <button
              onClick={() => setDifficulty('EASY')}
              className={`flex-1 py-1 px-1.5 rounded-lg border text-center transition ${
                difficulty === 'EASY'
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-black'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {t('games.memory.level_easy', { defaultValue: 'Tập Sự (12 Thẻ)' })}
            </button>
            <button
              onClick={() => setDifficulty('NORMAL')}
              className={`flex-1 py-1 px-1.5 rounded-lg border text-center transition ${
                difficulty === 'NORMAL'
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-black'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {t('games.memory.level_normal', { defaultValue: 'Chuyên Gia (16 Thẻ)' })}
            </button>
            <button
              onClick={() => setDifficulty('HARD')}
              className={`flex-1 py-1 px-1.5 rounded-lg border text-center transition ${
                difficulty === 'HARD'
                  ? 'bg-rose-500/20 border-rose-400 text-rose-300 font-black'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {t('games.memory.level_hard', { defaultValue: 'Bậc Thầy (20 Thẻ)' })}
            </button>
          </div>
        </div>

        {/* ── 2. STATS & POWER-UP ACTION BAR ── */}
        <div className="w-full bg-slate-900/90 border border-slate-800 px-3.5 py-2.5 rounded-2xl shadow-md flex items-center justify-between gap-2">
          {/* Timer with Progress Indicator */}
          <div className="flex items-center gap-2">
            <Clock className={`w-4 h-4 ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-amber-400'}`} />
            <div>
              <div className="flex items-center gap-1.5">
                <span className={`font-mono text-sm font-black ${timeLeft <= 10 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                  {timeLeft}s
                </span>
                <span className="text-[10px] text-slate-400">/ {totalTime}s</span>
              </div>
            </div>
          </div>

          {/* Combo & Moves Tracker */}
          <div className="flex items-center gap-2">
            {comboStreak > 1 && (
              <span className="flex items-center gap-1 text-[11px] font-black text-amber-400 bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 rounded-full animate-bounce">
                <Flame className="w-3 h-3 fill-amber-400" />
                x{comboStreak}
              </span>
            )}
            <span className="text-xs font-mono text-slate-300">
              {moves} {t('games.memory.moves_unit', { defaultValue: 'lượt' })}
            </span>
            <span className="bg-amber-500 text-slate-950 font-black text-xs px-2 py-0.5 rounded-lg shadow-xs">
              {matchedCount}/{config.pairsCount}
            </span>
          </div>

          {/* Interactive Power-up Buttons */}
          <div className="flex items-center gap-1.5">
            {/* X-Ray Peek Button */}
            <button
              onClick={handleXRayPeek}
              disabled={!peekAvailable || isPeeking}
              className={`px-2 py-1 rounded-xl text-[10px] sm:text-[11px] font-black flex items-center gap-1 border transition shadow-xs ${
                peekAvailable && !isPeeking
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 border-blue-400 text-white hover:brightness-110 active:scale-95'
                  : 'bg-slate-800/60 border-slate-700 text-slate-500 cursor-not-allowed opacity-50'
              }`}
              title={t('games.memory.btn_peek', { defaultValue: 'Mắt Thần (1.5s)' })}
            >
              <Eye className="w-3 h-3" />
              <span>{t('games.memory.btn_peek', { defaultValue: 'Mắt Thần' })}</span>
            </button>

            {/* Time Freeze (+10s) */}
            <button
              onClick={handleTimeFreeze}
              disabled={!freezeAvailable}
              className={`px-2 py-1 rounded-xl text-[10px] sm:text-[11px] font-black flex items-center gap-1 border transition shadow-xs ${
                freezeAvailable
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 border-emerald-400 text-white hover:brightness-110 active:scale-95'
                  : 'bg-slate-800/60 border-slate-700 text-slate-500 cursor-not-allowed opacity-50'
              }`}
              title={t('games.memory.btn_freeze', { defaultValue: '+10 Giây' })}
            >
              <Zap className="w-3 h-3" />
              <span>{t('games.memory.btn_freeze', { defaultValue: '+10s' })}</span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-400 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* ── 3. DYNAMIC 3D CARDS BOARD ── */}
        <div className="relative w-full max-w-md flex-1 flex items-center justify-center p-1">
          {matchPopup && (
            <div className="absolute -top-3 inset-x-0 flex justify-center z-30 pointer-events-none animate-bounce">
              <span className="px-4 py-1.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black text-xs rounded-full shadow-2xl border-2 border-yellow-200">
                {matchPopup}
              </span>
            </div>
          )}

          <div className={`w-full grid ${gridColsClass} gap-2 sm:gap-2.5`}>
            {cards.map((card, idx) => {
              const isRevealed = card.isFlipped || card.isMatched;

              return (
                <div
                  key={card.id}
                  onClick={() => handleCardClick(idx)}
                  className="relative aspect-square rounded-2xl cursor-pointer perspective-1000 transition-transform duration-200 active:scale-95 select-none group"
                >
                  <div
                    className={`w-full h-full rounded-2xl transition-transform duration-500 transform-style-3d relative ${
                      isRevealed ? 'rotate-y-180 shadow-xl' : 'shadow-md'
                    }`}
                  >
                    {/* Card Back (Facedown - Luxury Gold Pattern) */}
                    <div
                      className={`absolute inset-0 backface-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border-2 border-amber-400/60 rounded-2xl flex flex-col items-center justify-center p-1.5 group-hover:border-amber-300 transition overflow-hidden ${
                        isRevealed ? 'pointer-events-none opacity-0' : 'z-10 opacity-100'
                      }`}
                    >
                      <div className="absolute inset-1 rounded-xl border border-amber-400/20 border-dashed" />
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 flex items-center justify-center shadow-lg border border-yellow-200 group-hover:scale-110 transition">
                        <span className="text-amber-950 font-black text-sm sm:text-base">★</span>
                      </div>
                      <span className="text-[7px] sm:text-[8px] font-black text-amber-300 uppercase tracking-widest mt-1">
                        NATCASH
                      </span>
                    </div>

                    {/* Card Front (Faceup - Thematic Vector Art) */}
                    <div
                      className={`absolute inset-0 backface-hidden rotate-y-180 bg-gradient-to-br ${card.bgGradient} rounded-2xl border-2 ${
                        card.isMatched ? 'border-amber-300 ring-2 ring-amber-400/70 shadow-amber-500/30' : 'border-white/70'
                      } flex flex-col items-center justify-center p-1.5 text-white shadow-xl overflow-hidden ${
                        isRevealed ? 'z-10 opacity-100' : 'pointer-events-none opacity-0'
                      }`}
                    >
                      <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/35 to-transparent pointer-events-none" />

                      {/* Icon */}
                      <span className="text-2xl sm:text-3xl drop-shadow-md transform transition group-hover:scale-110">
                        {card.icon}
                      </span>

                      {/* Label */}
                      <span className="text-[8.5px] sm:text-[9.5px] font-black tracking-tight text-white mt-1 uppercase text-center line-clamp-1 leading-none drop-shadow">
                        {card.label}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Timeout Overlay */}
          {isTimeout && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center p-6 text-center animate-fade-in z-30">
              <div className="w-14 h-14 rounded-2xl bg-red-600/30 border border-red-500 text-red-400 flex items-center justify-center text-2xl mb-2 animate-bounce">
                ⏰
              </div>
              <h3 className="text-lg font-black text-red-400 mb-1">{t('games.memory.timeout_title')}</h3>
              <p className="text-xs text-slate-300 mb-4">
                {t('games.memory.matches', { matched: matchedCount, total: config.pairsCount })}
              </p>
              <button
                onClick={shuffleDeck}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black rounded-xl text-sm shadow-lg active:scale-95 transition flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{t('games.memory.btn_restart')}</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer Subtitle */}
        <p className="text-[11px] text-slate-400 text-center max-w-xs leading-relaxed">
          {t('games.memory.subtitle')}
        </p>
      </main>

      {/* ── REWARD MODAL ── */}
      {showRewardModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border-2 border-amber-500/70 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl relative overflow-hidden">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center text-3xl mx-auto shadow-xl animate-bounce">
              🏆
            </div>
            <div>
              <h3 className="text-lg font-black text-white">{t('games.memory.win_title')}</h3>
              <p className="text-xs text-slate-400 mt-1">
                {moves} {t('games.memory.moves_unit', { defaultValue: 'lượt' })} • {timeLeft}s {t('games.memory.time_bonus_label', { defaultValue: 'thời gian dư' })}
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
              {t('games.common.btn_claim')}
            </button>
          </div>
        </div>
      )}

      {/* ── GAME TUTORIAL MODAL ── */}
      <GameTutorialModal
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
        gameTitle={t('games.memory.title')}
        gameIcon="🧠"
        goal={t('games.memory.tutorial.goal')}
        controls={t('games.memory.tutorial.controls')}
        scoring={t('games.memory.tutorial.scoring')}
        tips={t('games.memory.tutorial.tips')}
      />
    </div>
  );
};
