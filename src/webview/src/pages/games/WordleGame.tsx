import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Delete, Sparkles } from 'lucide-react';
import { GameSounds } from '../../utils/audio';
import { GameHeader } from '../../components/common/GameHeader';
import { GameTutorialModal } from '../../components/common/GameTutorialModal';

export interface WordleGameProps {
  onBack: () => void;
  onClaimReward?: (pointsWon: number) => void;
}

const WORD_LIST = [
  'NATCO',
  'PWENW',
  'KREDI',
  'KASHA',
  'LIDAT',
  'BONUS',
  'CARIB',
  'SOLAR',
  'MERCI',
  'PLAZA',
  'LUCKY',
  'TIGER',
];

const MAX_GUESSES = 6;
const WORD_LENGTH = 5;

type LetterState = 'CORRECT' | 'PRESENT' | 'ABSENT' | 'EMPTY';

export const WordleGame: React.FC<WordleGameProps> = ({ onBack, onClaimReward }) => {
  const { t } = useTranslation();

  const [secretWord, setSecretWord] = useState<string>('');
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState<string>('');
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isWon, setIsWon] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(!GameSounds.isSoundMuted());
  const [showRewardModal, setShowRewardModal] = useState<boolean>(false);
  const [rewardAmount, setRewardAmount] = useState<number>(0);
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  const [shakeRow, setShakeRow] = useState<boolean>(false);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    GameSounds.setMuted(!next);
  };

  const startNewGame = useCallback(() => {
    const chosen = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
    setSecretWord(chosen);
    setGuesses([]);
    setCurrentGuess('');
    setIsGameOver(false);
    setIsWon(false);
    setShakeRow(false);
    GameSounds.playStart();
  }, []);

  useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  const handleKeyPress = (char: string) => {
    if (isGameOver || isWon) return;

    if (char === 'ENTER') {
      if (currentGuess.length !== WORD_LENGTH) {
        setShakeRow(true);
        setTimeout(() => setShakeRow(false), 400);
        GameSounds.playWrong();
        return;
      }

      const nextGuesses = [...guesses, currentGuess];
      setGuesses(nextGuesses);

      if (currentGuess === secretWord) {
        setIsWon(true);
        setIsGameOver(true);
        const reward = 100 + (MAX_GUESSES - nextGuesses.length) * 25;
        setRewardAmount(reward);
        setTimeout(() => {
          setShowRewardModal(true);
          GameSounds.playWinFanfare();
        }, 500);
      } else if (nextGuesses.length >= MAX_GUESSES) {
        setIsGameOver(true);
        GameSounds.playLose();
      } else {
        GameSounds.playCorrect();
      }
      setCurrentGuess('');
    } else if (char === 'BACKSPACE') {
      if (currentGuess.length > 0) {
        setCurrentGuess((prev) => prev.slice(0, -1));
        GameSounds.playTap();
      }
    } else if (currentGuess.length < WORD_LENGTH) {
      setCurrentGuess((prev) => prev + char);
      GameSounds.playTap();
    }
  };

  const getLetterState = (word: string, index: number): LetterState => {
    const char = word[index];
    if (char === secretWord[index]) return 'CORRECT';
    if (secretWord.includes(char)) return 'PRESENT';
    return 'ABSENT';
  };

  const getKeyboardKeyStatus = (char: string): LetterState => {
    let status: LetterState = 'EMPTY';
    for (const g of guesses) {
      for (let i = 0; i < g.length; i++) {
        if (g[i] === char) {
          if (secretWord[i] === char) return 'CORRECT';
          if (secretWord.includes(char)) status = 'PRESENT';
          else if (status === 'EMPTY') status = 'ABSENT';
        }
      }
    }
    return status;
  };

  const KEYBOARD_ROWS = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE'],
  ];

  const claimReward = () => {
    if (onClaimReward && rewardAmount > 0) {
      onClaimReward(rewardAmount);
    }
    setShowRewardModal(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans select-none pb-12 animate-fade-in">
      <GameHeader
        title={t('games.wordle.title')}
        subtitle={t('games.wordle.guesses_left', { count: MAX_GUESSES - guesses.length })}
        onBack={onBack}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
        onRestart={startNewGame}
        restartTooltip={t('games.wordle.btn_new_word')}
        onHelp={() => setShowTutorial(true)}
      />

      {/* ── MAIN STAGE ── */}
      <main className="flex-1 max-w-md mx-auto w-full px-3 py-4 flex flex-col items-center justify-between">
        {/* Title Header */}
        <div className="text-center space-y-1 mb-2">
          <h1 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-400 tracking-tight flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span>{t('games.wordle.title')}</span>
          </h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto font-medium">
            {t('games.wordle.guesses_left', { count: MAX_GUESSES - guesses.length })}
          </p>
        </div>

        {/* 6x5 3D Glassmorphism Letter Grid */}
        <div className="grid grid-rows-6 gap-2 my-2 w-full max-w-[290px] p-2 bg-slate-900/60 border border-slate-800/80 rounded-3xl backdrop-blur-md shadow-2xl">
          {Array.from({ length: MAX_GUESSES }).map((_, rIdx) => {
            const isCurrentRow = rIdx === guesses.length;
            const rowGuess = guesses[rIdx] || (isCurrentRow ? currentGuess : '');

            return (
              <div
                key={rIdx}
                className={`grid grid-cols-5 gap-1.5 transition-transform ${
                  isCurrentRow && shakeRow ? 'scale-105 rotate-1 border border-red-500 rounded-xl' : ''
                }`}
              >
                {Array.from({ length: WORD_LENGTH }).map((_, cIdx) => {
                  const letter = rowGuess[cIdx] || '';
                  let cellStyle = 'bg-slate-800/50 border-slate-700/40 text-slate-400';

                  if (rIdx < guesses.length) {
                    const state = getLetterState(guesses[rIdx], cIdx);
                    if (state === 'CORRECT') cellStyle = 'bg-gradient-to-br from-emerald-400 via-emerald-600 to-teal-800 border-emerald-300 text-white shadow-lg shadow-emerald-950/60 ring-1 ring-emerald-300';
                    else if (state === 'PRESENT') cellStyle = 'bg-gradient-to-br from-yellow-300 via-amber-500 to-orange-700 border-yellow-200 text-white shadow-lg shadow-amber-950/60 ring-1 ring-yellow-200';
                    else cellStyle = 'bg-slate-800/90 border-slate-700 text-slate-400';
                  } else if (letter) {
                    cellStyle = 'bg-slate-800 border-amber-400 text-white scale-105 shadow-md shadow-amber-500/30';
                  }

                  return (
                    <div
                      key={cIdx}
                      className={`aspect-square rounded-xl border-2 flex items-center justify-center font-mono font-black text-lg sm:text-xl transition-all duration-200 relative overflow-hidden ${cellStyle}`}
                    >
                      {/* 3D Specular Highlight */}
                      <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none rounded-t-xl" />
                      <span className="relative z-10 drop-shadow-md">{letter}</span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Secret Word Reveal on Game Over */}
        {isGameOver && !isWon && (
          <div className="bg-red-950/80 border border-red-500/50 px-4 py-1.5 rounded-xl text-center text-xs text-red-300 font-mono mb-2 shadow-lg animate-fade-in">
            {t('games.wordle.correct_word', { word: secretWord })}
          </div>
        )}

        {/* Cyberpunk Virtual Keyboard */}
        <div className="w-full max-w-[360px] space-y-1.5 mt-2">
          {KEYBOARD_ROWS.map((row, rIdx) => (
            <div key={rIdx} className="flex justify-center gap-1">
              {row.map((key) => {
                const keyStatus = getKeyboardKeyStatus(key);
                let btnStyle = 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border-slate-700/80 shadow-xs';

                if (keyStatus === 'CORRECT') btnStyle = 'bg-gradient-to-br from-emerald-500 to-teal-700 text-white border-emerald-300 shadow-md shadow-emerald-950/50';
                else if (keyStatus === 'PRESENT') btnStyle = 'bg-gradient-to-br from-amber-400 to-yellow-600 text-white border-yellow-200 shadow-md shadow-amber-950/50';
                else if (keyStatus === 'ABSENT') btnStyle = 'bg-slate-900/60 text-slate-600 border-slate-800/80';

                return (
                  <button
                    key={key}
                    onClick={() => handleKeyPress(key)}
                    className={`py-2.5 sm:py-3 rounded-xl border font-mono font-bold text-xs sm:text-sm active:scale-95 transition flex items-center justify-center ${
                      key === 'ENTER' || key === 'BACKSPACE' ? 'px-2 sm:px-3 text-[10px] bg-slate-700/90 text-amber-300 border-slate-600' : 'flex-1'
                    } ${btnStyle}`}
                  >
                    {key === 'BACKSPACE' ? <Delete className="w-4 h-4" /> : key}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </main>

      {/* ── REWARD MODAL ── */}
      {showRewardModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-amber-500/50 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl relative overflow-hidden">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center mx-auto shadow-xl animate-bounce border-2 border-white">
              <span className="font-black text-2xl text-amber-950">VIP</span>
            </div>
            <div>
              <h3 className="text-lg font-black text-white">{t('games.wordle.win_title')}</h3>
              <p className="text-xs text-slate-400 mt-1">{t('games.wordle.correct_word', { word: secretWord })}</p>
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
        gameTitle={t('games.wordle.title')}
        gameIcon="🔤"
        goal={t('games.wordle.tutorial.goal')}
        controls={t('games.wordle.tutorial.controls')}
        scoring={t('games.wordle.tutorial.scoring')}
        tips={t('games.wordle.tutorial.tips')}
      />
    </div>
  );
};
