import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock } from 'lucide-react';
import { GameSounds } from '../../utils/audio';
import { GameHeader } from '../../components/common/GameHeader';
import { GameTutorialModal } from '../../components/common/GameTutorialModal';

export interface MemoryMatchGameProps {
  onBack: () => void;
  onClaimReward?: (pointsWon: number) => void;
}

interface CardItem {
  id: number;
  pairId: number;
  icon: string;
  label: string;
  bgGradient: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const PARTNER_CARDS = [
  { pairId: 1, icon: '🛒', label: 'Delimart', bgGradient: 'from-amber-500 to-orange-600' },
  { pairId: 2, icon: '⛽', label: 'Total', bgGradient: 'from-red-500 to-rose-600' },
  { pairId: 3, icon: '📡', label: 'Natcom 4G', bgGradient: 'from-blue-500 to-indigo-600' },
  { pairId: 4, icon: '👑', label: 'Natcash', bgGradient: 'from-yellow-400 to-amber-500' },
  { pairId: 5, icon: '🌴', label: 'Caribe', bgGradient: 'from-emerald-500 to-teal-600' },
  { pairId: 6, icon: '🎭', label: 'Kanaval', bgGradient: 'from-purple-500 to-pink-600' },
];

export const MemoryMatchGame: React.FC<MemoryMatchGameProps> = ({ onBack, onClaimReward }) => {
  const { t } = useTranslation();

  const [cards, setCards] = useState<CardItem[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [matchedCount, setMatchedCount] = useState<number>(0);
  const [moves, setMoves] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(45);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isWon, setIsWon] = useState<boolean>(false);
  const [isTimeout, setIsTimeout] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(!GameSounds.isSoundMuted());
  const [showRewardModal, setShowRewardModal] = useState<boolean>(false);
  const [rewardAmount, setRewardAmount] = useState<number>(0);
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  const [matchPopup, setMatchPopup] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    GameSounds.setMuted(!next);
  };

  const shuffleDeck = useCallback(() => {
    const deck: CardItem[] = [];
    let idCounter = 0;

    PARTNER_CARDS.forEach((card) => {
      // 2 cards for each pair
      deck.push({
        id: idCounter++,
        pairId: card.pairId,
        icon: card.icon,
        label: card.label,
        bgGradient: card.bgGradient,
        isFlipped: false,
        isMatched: false,
      });
      deck.push({
        id: idCounter++,
        pairId: card.pairId,
        icon: card.icon,
        label: card.label,
        bgGradient: card.bgGradient,
        isFlipped: false,
        isMatched: false,
      });
    });

    // Shuffle deck array
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    setCards(deck);
    setFlippedIndices([]);
    setMatchedCount(0);
    setMoves(0);
    setTimeLeft(45);
    setIsPlaying(true);
    setIsWon(false);
    setIsTimeout(false);
  }, []);

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

  // Card flip interaction
  const handleCardClick = (index: number) => {
    if (!isPlaying || isWon || isTimeout) return;
    if (cards[index].isFlipped || cards[index].isMatched) return;
    if (flippedIndices.length >= 2) return; // wait for checking

    GameSounds.playTap();
    const newFlipped = [...flippedIndices, index];

    // Flip target card
    const updatedCards = [...cards];
    updatedCards[index].isFlipped = true;
    setCards(updatedCards);
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      const [firstIdx, secondIdx] = newFlipped;
      const firstCard = updatedCards[firstIdx];
      const secondCard = updatedCards[secondIdx];

      if (firstCard.pairId === secondCard.pairId) {
        // MATCHED!
        setTimeout(() => {
          GameSounds.playCorrect();
          updatedCards[firstIdx].isMatched = true;
          updatedCards[secondIdx].isMatched = true;
          setCards([...updatedCards]);
          setFlippedIndices([]);

          setMatchPopup(`${firstCard.label} MATCH! ✨`);
          setTimeout(() => setMatchPopup(null), 1000);

          const nextMatched = matchedCount + 1;
          setMatchedCount(nextMatched);

          if (nextMatched === PARTNER_CARDS.length) {
            setIsWon(true);
            setIsPlaying(false);
            const reward = 100 + timeLeft * 2;
            setRewardAmount(reward);
            setTimeout(() => {
              setShowRewardModal(true);
              GameSounds.playWinFanfare();
            }, 600);
          }
        }, 400);
      } else {
        // NO MATCH -> Flip back after delay
        setTimeout(() => {
          GameSounds.playWrong();
          updatedCards[firstIdx].isFlipped = false;
          updatedCards[secondIdx].isFlipped = false;
          setCards([...updatedCards]);
          setFlippedIndices([]);
        }, 800);
      }
    }
  };

  const claimReward = () => {
    if (onClaimReward && rewardAmount > 0) {
      onClaimReward(rewardAmount);
    }
    setShowRewardModal(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans select-none pb-12 animate-fade-in">
      <GameHeader
        title={t('games.memory.title')}
        subtitle={t('games.memory.matches', { matched: matchedCount, total: PARTNER_CARDS.length })}
        onBack={onBack}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
        onRestart={shuffleDeck}
        restartTooltip={t('games.memory.btn_restart')}
        onHelp={() => setShowTutorial(true)}
      />

      {/* ── MAIN STAGE ── */}
      <main className="flex-1 max-w-md mx-auto w-full px-3 py-4 flex flex-col items-center justify-between">
        {/* Title Header */}
        <div className="text-center space-y-1 mb-2">
          <h1 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-400 tracking-tight flex items-center justify-center gap-2">
            <span>🃏</span> {t('games.memory.title')}
          </h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">{t('games.memory.subtitle')}</p>
        </div>

        {/* Stats Status Bar */}
        <div className="w-full flex items-center justify-between bg-slate-900/90 border border-slate-800 px-4 py-2 rounded-2xl mb-3 shadow-md">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-300">
            <Clock className={`w-4 h-4 ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-amber-400'}`} />
            <span className={`font-mono text-sm ${timeLeft <= 10 ? 'text-red-400 font-black' : 'text-white'}`}>
              {t('games.memory.time_left', { time: timeLeft })}
            </span>
          </div>

          <div className="flex items-center space-x-2 text-xs font-bold">
            <span className="text-slate-400 font-mono">{t('games.memory.moves', { moves })}</span>
            <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-lg border border-amber-500/30">
              {t('games.memory.matches', { matched: matchedCount, total: PARTNER_CARDS.length })}
            </span>
          </div>
        </div>

        {/* 4x3 Cards Grid Board with Floating Match Popup */}
        <div className="relative w-full aspect-[4/3] max-w-[380px] grid grid-cols-4 gap-2.5 sm:gap-3 p-1">
          {matchPopup && (
            <div className="absolute -top-3 inset-x-0 flex justify-center z-30 pointer-events-none animate-bounce">
              <span className="px-4 py-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black text-xs rounded-full shadow-xl border border-yellow-200">
                {matchPopup}
              </span>
            </div>
          )}

          {cards.map((card, idx) => (
            <div
              key={card.id}
              onClick={() => handleCardClick(idx)}
              className="relative aspect-square rounded-2xl cursor-pointer perspective-1000 transition-all duration-300 active:scale-95 select-none"
            >
              <div
                className={`w-full h-full rounded-2xl transition-all duration-500 transform-style-3d relative ${
                  card.isFlipped || card.isMatched ? 'rotate-y-180 shadow-2xl' : 'shadow-md'
                }`}
              >
                {/* Card Back (Facedown - Luxury Gold Foil Filigree) */}
                <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border-2 border-amber-400/60 rounded-2xl flex flex-col items-center justify-center p-2 hover:border-amber-300 transition group overflow-hidden">
                  <div className="absolute inset-1 rounded-xl border border-amber-400/20 border-dashed" />
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center shadow-lg border border-yellow-200">
                    <span className="text-amber-950 font-black text-base">★</span>
                  </div>
                  <span className="text-[7.5px] font-black text-amber-300 uppercase tracking-widest mt-1">NATCASH</span>
                </div>

                {/* Card Front (Faceup - Authentic High-DPI Partner Vector Crest) */}
                <div
                  className={`absolute inset-0 backface-hidden rotate-y-180 bg-gradient-to-br ${card.bgGradient} rounded-2xl border-2 border-white/60 flex flex-col items-center justify-center p-1.5 text-white shadow-xl overflow-hidden`}
                >
                  <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
                  
                  {/* SVG Partner Crests */}
                  <div className="w-10 h-10 flex items-center justify-center drop-shadow-md">
                    {card.pairId === 1 && (
                      <svg viewBox="0 0 48 48" className="w-9 h-9" fill="none">
                        <circle cx="24" cy="24" r="22" fill="#0284C7" stroke="#BAE6FD" strokeWidth="2" />
                        <path d="M12 16 H16 L20 30 H34 L37 20 H18" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="22" cy="35" r="2.5" fill="#FDE047" />
                        <circle cx="32" cy="35" r="2.5" fill="#FDE047" />
                      </svg>
                    )}
                    {card.pairId === 2 && (
                      <svg viewBox="0 0 48 48" className="w-9 h-9" fill="none">
                        <circle cx="24" cy="24" r="22" fill="#BE123C" stroke="#FDA4AF" strokeWidth="2" />
                        <path d="M24 8 C24 8 32 18 32 26 C32 30.4 28.4 34 24 34 C19.6 34 16 30.4 16 26 C16 18 24 8 24 8 Z" fill="#F59E0B" />
                        <path d="M24 16 C24 16 28 22 28 27 C28 29.2 26.2 31 24 31 C21.8 31 20 29.2 20 27 C20 22 24 16 24 16 Z" fill="#FEF08A" />
                      </svg>
                    )}
                    {card.pairId === 3 && (
                      <svg viewBox="0 0 48 48" className="w-9 h-9" fill="none">
                        <circle cx="24" cy="24" r="22" fill="#1D4ED8" stroke="#93C5FD" strokeWidth="2" />
                        <path d="M24 14 L24 36 M18 20 L24 14 L30 20 M14 26 L24 14 L34 26" stroke="#FEF08A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="24" cy="14" r="2" fill="#EF4444" />
                      </svg>
                    )}
                    {card.pairId === 4 && (
                      <svg viewBox="0 0 48 48" className="w-9 h-9" fill="none">
                        <circle cx="24" cy="24" r="22" fill="#B45309" stroke="#FEF08A" strokeWidth="2" />
                        <path d="M12 30 L15 16 L24 23 L33 16 L36 30 Z" fill="#FEF08A" stroke="#78350F" strokeWidth="1.5" />
                        <circle cx="15" cy="15" r="2" fill="#EF4444" />
                        <circle cx="24" cy="22" r="2" fill="#10B981" />
                        <circle cx="33" cy="15" r="2" fill="#EF4444" />
                      </svg>
                    )}
                    {card.pairId === 5 && (
                      <svg viewBox="0 0 48 48" className="w-9 h-9" fill="none">
                        <circle cx="24" cy="24" r="22" fill="#047857" stroke="#A7F3D0" strokeWidth="2" />
                        <circle cx="32" cy="16" r="6" fill="#FDE047" />
                        <path d="M22 36 C22 28 26 22 28 18" stroke="#78350F" strokeWidth="3" strokeLinecap="round" />
                        <path d="M28 18 Q20 14 14 18 Q22 20 28 18 Z" fill="#22C55E" />
                        <path d="M28 18 Q34 12 40 15 Q34 18 28 18 Z" fill="#16A34A" />
                      </svg>
                    )}
                    {card.pairId === 6 && (
                      <svg viewBox="0 0 48 48" className="w-9 h-9" fill="none">
                        <circle cx="24" cy="24" r="22" fill="#7E22CE" stroke="#E9D5FF" strokeWidth="2" />
                        <path d="M14 22 C14 18 20 16 24 16 C28 16 34 18 34 22 C34 28 28 32 24 32 C20 32 14 28 14 22 Z" fill="#FDE047" stroke="#B45309" strokeWidth="1.5" />
                        <ellipse cx="19" cy="22" rx="3" ry="2" fill="#1E1B4B" />
                        <ellipse cx="29" cy="22" rx="3" ry="2" fill="#1E1B4B" />
                        <path d="M24 16 Q20 8 18 6 Q24 12 24 16 Z" fill="#EF4444" />
                        <path d="M24 16 Q28 8 30 6 Q24 12 24 16 Z" fill="#3B82F6" />
                      </svg>
                    )}
                  </div>

                  <span className="text-[9px] sm:text-[10px] font-black tracking-tight text-white mt-1 uppercase text-center line-clamp-1 leading-tight">
                    {card.label}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {/* Timeout Overlay */}
          {isTimeout && (
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center p-6 text-center animate-fade-in z-20">
              <div className="w-14 h-14 rounded-2xl bg-red-600/30 border border-red-500 text-red-400 flex items-center justify-center text-2xl mb-2">
                ⏰
              </div>
              <h3 className="text-lg font-black text-red-400 mb-1">{t('games.memory.timeout_title')}</h3>
              <p className="text-xs text-slate-300 mb-4">{t('games.memory.matches', { matched: matchedCount, total: PARTNER_CARDS.length })}</p>
              <button
                onClick={shuffleDeck}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black rounded-xl text-sm shadow-lg active:scale-95 transition"
              >
                {t('games.memory.btn_restart')}
              </button>
            </div>
          )}
        </div>

        {/* Footer Hint */}
        <p className="text-[11px] text-slate-400 mt-4 text-center max-w-xs">{t('games.memory.subtitle')}</p>
      </main>

      {/* ── REWARD MODAL ── */}
      {showRewardModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-amber-500/50 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl relative overflow-hidden">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center text-3xl mx-auto shadow-xl animate-bounce">
              🏆
            </div>
            <div>
              <h3 className="text-lg font-black text-white">{t('games.memory.win_title')}</h3>
              <p className="text-xs text-slate-400 mt-1">
                {t('games.memory.time_left', { time: timeLeft })} • {t('games.memory.moves', { moves })}
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
        gameTitle={t('games.memory.title')}
        gameIcon="🃏"
        goal={t('games.memory.tutorial.goal')}
        controls={t('games.memory.tutorial.controls')}
        scoring={t('games.memory.tutorial.scoring')}
        tips={t('games.memory.tutorial.tips')}
      />
    </div>
  );
};
