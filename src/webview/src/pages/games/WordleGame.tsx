import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Delete, Lightbulb, Sparkles } from 'lucide-react';
import { GameSounds } from '../../utils/audio';
import { GameHeader } from '../../components/common/GameHeader';
import { GameTutorialModal } from '../../components/common/GameTutorialModal';

export interface WordleGameProps {
  onBack: () => void;
  onClaimReward?: (pointsWon: number) => void;
}

interface WordEntry {
  word: string;
  topic: string;
  meaning: string;
  language: 'games.wordle.lang_ht' | 'games.wordle.lang_fr' | 'games.wordle.lang_en' | 'games.wordle.lang_natcom';
}

const WORD_DATABASE: WordEntry[] = [
  // ── NHÓM 1: VIỄN THÔNG & NATCOM (25 TỪ) ──
  { word: 'NATCO', topic: 'games.wordle.words.w0.topic', meaning: 'games.wordle.words.w0.meaning', language: 'games.wordle.lang_natcom' },
  { word: 'PWENW', topic: 'games.wordle.words.w1.topic', meaning: 'games.wordle.words.w1.meaning', language: 'games.wordle.lang_ht' },
  { word: 'KREDI', topic: 'games.wordle.words.w2.topic', meaning: 'games.wordle.words.w2.meaning', language: 'games.wordle.lang_ht' },
  { word: 'BONUS', topic: 'games.wordle.words.w3.topic', meaning: 'games.wordle.words.w3.meaning', language: 'games.wordle.lang_en' },
  { word: 'FIBER', topic: 'games.wordle.words.w4.topic', meaning: 'games.wordle.words.w4.meaning', language: 'games.wordle.lang_en' },
  { word: 'SPEED', topic: 'games.wordle.words.w5.topic', meaning: 'games.wordle.words.w5.meaning', language: 'games.wordle.lang_en' },
  { word: 'VOICE', topic: 'games.wordle.words.w6.topic', meaning: 'games.wordle.words.w6.meaning', language: 'games.wordle.lang_en' },
  { word: 'PHONE', topic: 'games.wordle.words.w7.topic', meaning: 'games.wordle.words.w7.meaning', language: 'games.wordle.lang_en' },
  { word: 'SIGNAL', topic: 'games.wordle.words.w8.topic', meaning: 'games.wordle.words.w8.meaning', language: 'games.wordle.lang_en' },
  { word: 'TOWER', topic: 'games.wordle.words.w9.topic', meaning: 'games.wordle.words.w9.meaning', language: 'games.wordle.lang_en' },
  { word: 'ROUTER', topic: 'games.wordle.words.w10.topic', meaning: 'games.wordle.words.w10.meaning', language: 'games.wordle.lang_en' },
  { word: 'ONLINE', topic: 'games.wordle.words.w11.topic', meaning: 'games.wordle.words.w11.meaning', language: 'games.wordle.lang_en' },
  { word: 'STREAM', topic: 'games.wordle.words.w12.topic', meaning: 'games.wordle.words.w12.meaning', language: 'games.wordle.lang_en' },
  { word: 'PORTAL', topic: 'games.wordle.words.w13.topic', meaning: 'games.wordle.words.w13.meaning', language: 'games.wordle.lang_en' },
  { word: 'BUNDLE', topic: 'games.wordle.words.w14.topic', meaning: 'games.wordle.words.w14.meaning', language: 'games.wordle.lang_en' },
  { word: 'PACKS', topic: 'games.wordle.words.w15.topic', meaning: 'games.wordle.words.w15.meaning', language: 'games.wordle.lang_en' },
  { word: 'RECHAR', topic: 'games.wordle.words.w16.topic', meaning: 'games.wordle.words.w16.meaning', language: 'games.wordle.lang_fr' },
  { word: 'PLANS', topic: 'games.wordle.words.w17.topic', meaning: 'games.wordle.words.w17.meaning', language: 'games.wordle.lang_en' },
  { word: 'HOTSP', topic: 'games.wordle.words.w18.topic', meaning: 'games.wordle.words.w18.meaning', language: 'games.wordle.lang_en' },
  { word: 'ROAMY', topic: 'games.wordle.words.w19.topic', meaning: 'games.wordle.words.w19.meaning', language: 'games.wordle.lang_en' },

  // ── NHÓM 2: VÍ NATCASH & TÀI CHÍNH SỐ (25 TỪ) ──
  { word: 'KASHA', topic: 'games.wordle.words.w20.topic', meaning: 'games.wordle.words.w20.meaning', language: 'games.wordle.lang_ht' },
  { word: 'MONEY', topic: 'games.wordle.words.w21.topic', meaning: 'games.wordle.words.w21.meaning', language: 'games.wordle.lang_en' },
  { word: 'GOURD', topic: 'games.wordle.words.w22.topic', meaning: 'games.wordle.words.w22.meaning', language: 'games.wordle.lang_ht' },
  { word: 'SOLDE', topic: 'games.wordle.words.w23.topic', meaning: 'games.wordle.words.w23.meaning', language: 'games.wordle.lang_fr' },
  { word: 'CARTE', topic: 'games.wordle.words.w24.topic', meaning: 'games.wordle.words.w24.meaning', language: 'games.wordle.lang_fr' },
  { word: 'PAYER', topic: 'games.wordle.words.w25.topic', meaning: 'games.wordle.words.w25.meaning', language: 'games.wordle.lang_fr' },
  { word: 'AGENT', topic: 'games.wordle.words.w26.topic', meaning: 'games.wordle.words.w26.meaning', language: 'games.wordle.lang_en' },
  { word: 'STORE', topic: 'games.wordle.words.w27.topic', meaning: 'games.wordle.words.w27.meaning', language: 'games.wordle.lang_en' },
  { word: 'VAULT', topic: 'games.wordle.words.w28.topic', meaning: 'games.wordle.words.w28.meaning', language: 'games.wordle.lang_en' },
  { word: 'EARNS', topic: 'games.wordle.words.w29.topic', meaning: 'games.wordle.words.w29.meaning', language: 'games.wordle.lang_en' },
  { word: 'TIERS', topic: 'games.wordle.words.w30.topic', meaning: 'games.wordle.words.w30.meaning', language: 'games.wordle.lang_en' },
  { word: 'CASHB', topic: 'games.wordle.words.w31.topic', meaning: 'games.wordle.words.w31.meaning', language: 'games.wordle.lang_en' },
  { word: 'PRIME', topic: 'games.wordle.words.w32.topic', meaning: 'games.wordle.words.w32.meaning', language: 'games.wordle.lang_en' },
  { word: 'OFFER', topic: 'games.wordle.words.w33.topic', meaning: 'games.wordle.words.w33.meaning', language: 'games.wordle.lang_en' },
  { word: 'GIFTS', topic: 'games.wordle.words.w34.topic', meaning: 'games.wordle.words.w34.meaning', language: 'games.wordle.lang_en' },
  { word: 'TOKEN', topic: 'games.wordle.words.w35.topic', meaning: 'games.wordle.words.w35.meaning', language: 'games.wordle.lang_en' },
  { word: 'CLAIM', topic: 'games.wordle.words.w36.topic', meaning: 'games.wordle.words.w36.meaning', language: 'games.wordle.lang_en' },
  { word: 'TRADE', topic: 'games.wordle.words.w37.topic', meaning: 'games.wordle.words.w37.meaning', language: 'games.wordle.lang_en' },
  { word: 'ASSET', topic: 'games.wordle.words.w38.topic', meaning: 'games.wordle.words.w38.meaning', language: 'games.wordle.lang_en' },
  { word: 'SMART', topic: 'games.wordle.words.w39.topic', meaning: 'games.wordle.words.w39.meaning', language: 'games.wordle.lang_en' },

  // ── NHÓM 3: ĐỐI TÁC LIÊN MINH & MUA SẮM (25 TỪ) ──
  { word: 'TOTAL', topic: 'games.wordle.words.w40.topic', meaning: 'games.wordle.words.w40.meaning', language: 'games.wordle.lang_en' },
  { word: 'DELIM', topic: 'games.wordle.words.w41.topic', meaning: 'games.wordle.words.w41.meaning', language: 'games.wordle.lang_en' },
  { word: 'PLAZA', topic: 'games.wordle.words.w42.topic', meaning: 'games.wordle.words.w42.meaning', language: 'games.wordle.lang_en' },
  { word: 'SUPER', topic: 'games.wordle.words.w43.topic', meaning: 'games.wordle.words.w43.meaning', language: 'games.wordle.lang_en' },
  { word: 'MARKT', topic: 'games.wordle.words.w44.topic', meaning: 'games.wordle.words.w44.meaning', language: 'games.wordle.lang_en' },
  { word: 'HOTEL', topic: 'games.wordle.words.w45.topic', meaning: 'games.wordle.words.w45.meaning', language: 'games.wordle.lang_en' },
  { word: 'CAFEZ', topic: 'games.wordle.words.w46.topic', meaning: 'games.wordle.words.w46.meaning', language: 'games.wordle.lang_fr' },
  { word: 'RESTO', topic: 'games.wordle.words.w47.topic', meaning: 'games.wordle.words.w47.meaning', language: 'games.wordle.lang_fr' },
  { word: 'PIZZA', topic: 'games.wordle.words.w48.topic', meaning: 'games.wordle.words.w48.meaning', language: 'games.wordle.lang_en' },
  { word: 'DRINK', topic: 'games.wordle.words.w49.topic', meaning: 'games.wordle.words.w49.meaning', language: 'games.wordle.lang_en' },
  { word: 'PETRO', topic: 'games.wordle.words.w50.topic', meaning: 'games.wordle.words.w50.meaning', language: 'games.wordle.lang_en' },
  { word: 'SOLAR', topic: 'games.wordle.words.w51.topic', meaning: 'games.wordle.words.w51.meaning', language: 'games.wordle.lang_en' },
  { word: 'CLEAN', topic: 'games.wordle.words.w52.topic', meaning: 'games.wordle.words.w52.meaning', language: 'games.wordle.lang_en' },
  { word: 'FRESH', topic: 'games.wordle.words.w53.topic', meaning: 'games.wordle.words.w53.meaning', language: 'games.wordle.lang_en' },
  { word: 'MANGO', topic: 'games.wordle.words.w54.topic', meaning: 'games.wordle.words.w54.meaning', language: 'games.wordle.lang_en' },
  { word: 'SWEET', topic: 'games.wordle.words.w55.topic', meaning: 'games.wordle.words.w55.meaning', language: 'games.wordle.lang_en' },
  { word: 'BREAD', topic: 'games.wordle.words.w56.topic', meaning: 'games.wordle.words.w56.meaning', language: 'games.wordle.lang_en' },
  { word: 'JUICE', topic: 'games.wordle.words.w57.topic', meaning: 'games.wordle.words.w57.meaning', language: 'games.wordle.lang_en' },
  { word: 'SNACK', topic: 'games.wordle.words.w58.topic', meaning: 'games.wordle.words.w58.meaning', language: 'games.wordle.lang_en' },
  { word: 'FASHT', topic: 'games.wordle.words.w59.topic', meaning: 'games.wordle.words.w59.meaning', language: 'games.wordle.lang_en' },

  // ── NHÓM 4: VĂN HÓA, DU LỊCH & LỄ HỘI CARIBE (25 TỪ) ──
  { word: 'CARIB', topic: 'games.wordle.words.w60.topic', meaning: 'games.wordle.words.w60.meaning', language: 'games.wordle.lang_en' },
  { word: 'FESTA', topic: 'games.wordle.words.w61.topic', meaning: 'games.wordle.words.w61.meaning', language: 'games.wordle.lang_ht' },
  { word: 'OCEAN', topic: 'games.wordle.words.w62.topic', meaning: 'games.wordle.words.w62.meaning', language: 'games.wordle.lang_en' },
  { word: 'BEACH', topic: 'games.wordle.words.w63.topic', meaning: 'games.wordle.words.w63.meaning', language: 'games.wordle.lang_en' },
  { word: 'SUNNY', topic: 'games.wordle.words.w64.topic', meaning: 'games.wordle.words.w64.meaning', language: 'games.wordle.lang_en' },
  { word: 'ISLAN', topic: 'games.wordle.words.w65.topic', meaning: 'games.wordle.words.w65.meaning', language: 'games.wordle.lang_en' },
  { word: 'MUSIC', topic: 'games.wordle.words.w66.topic', meaning: 'games.wordle.words.w66.meaning', language: 'games.wordle.lang_en' },
  { word: 'DANCE', topic: 'games.wordle.words.w67.topic', meaning: 'games.wordle.words.w67.meaning', language: 'games.wordle.lang_en' },
  { word: 'DRUMS', topic: 'games.wordle.words.w68.topic', meaning: 'games.wordle.words.w68.meaning', language: 'games.wordle.lang_en' },
  { word: 'SMILE', topic: 'games.wordle.words.w69.topic', meaning: 'games.wordle.words.w69.meaning', language: 'games.wordle.lang_en' },
  { word: 'HAPPY', topic: 'games.wordle.words.w70.topic', meaning: 'games.wordle.words.w70.meaning', language: 'games.wordle.lang_en' },
  { word: 'UNITY', topic: 'games.wordle.words.w71.topic', meaning: 'games.wordle.words.w71.meaning', language: 'games.wordle.lang_en' },
  { word: 'PEACE', topic: 'games.wordle.words.w72.topic', meaning: 'games.wordle.words.w72.meaning', language: 'games.wordle.lang_en' },
  { word: 'ROYAL', topic: 'games.wordle.words.w73.topic', meaning: 'games.wordle.words.w73.meaning', language: 'games.wordle.lang_en' },
  { word: 'MAGIC', topic: 'games.wordle.words.w74.topic', meaning: 'games.wordle.words.w74.meaning', language: 'games.wordle.lang_en' },
  { word: 'DREAM', topic: 'games.wordle.words.w75.topic', meaning: 'games.wordle.words.w75.meaning', language: 'games.wordle.lang_en' },
  { word: 'STARS', topic: 'games.wordle.words.w76.topic', meaning: 'games.wordle.words.w76.meaning', language: 'games.wordle.lang_en' },
  { word: 'QUEEN', topic: 'games.wordle.words.w77.topic', meaning: 'games.wordle.words.w77.meaning', language: 'games.wordle.lang_en' },
  { word: 'KINGS', topic: 'games.wordle.words.w78.topic', meaning: 'games.wordle.words.w78.meaning', language: 'games.wordle.lang_en' },
  { word: 'CHAMP', topic: 'games.wordle.words.w79.topic', meaning: 'games.wordle.words.w79.meaning', language: 'games.wordle.lang_en' },

  // ── NHÓM 5: GIAO TIẾP & TRÍ TUỆ (25 TỪ) ──
  { word: 'MERCI', topic: 'games.wordle.words.w80.topic', meaning: 'games.wordle.words.w80.meaning', language: 'games.wordle.lang_fr' },
  { word: 'LUCKY', topic: 'games.wordle.words.w81.topic', meaning: 'games.wordle.words.w81.meaning', language: 'games.wordle.lang_en' },
  { word: 'BRAVO', topic: 'games.wordle.words.w82.topic', meaning: 'games.wordle.words.w82.meaning', language: 'games.wordle.lang_fr' },
  { word: 'GREAT', topic: 'games.wordle.words.w83.topic', meaning: 'games.wordle.words.w83.meaning', language: 'games.wordle.lang_en' },
  { word: 'SUPER', topic: 'games.wordle.words.w84.topic', meaning: 'games.wordle.words.w84.meaning', language: 'games.wordle.lang_en' },
  { word: 'QUICK', topic: 'games.wordle.words.w85.topic', meaning: 'games.wordle.words.w85.meaning', language: 'games.wordle.lang_en' },
  { word: 'SHARP', topic: 'games.wordle.words.w86.topic', meaning: 'games.wordle.words.w86.meaning', language: 'games.wordle.lang_en' },
  { word: 'LOGIC', topic: 'games.wordle.words.w87.topic', meaning: 'games.wordle.words.w87.meaning', language: 'games.wordle.lang_en' },
  { word: 'FOCUS', topic: 'games.wordle.words.w88.topic', meaning: 'games.wordle.words.w88.meaning', language: 'games.wordle.lang_en' },
  { word: 'LEVEL', topic: 'games.wordle.words.w89.topic', meaning: 'games.wordle.words.w89.meaning', language: 'games.wordle.lang_en' },
  { word: 'SCORE', topic: 'games.wordle.words.w90.topic', meaning: 'games.wordle.words.w90.meaning', language: 'games.wordle.lang_en' },
  { word: 'QUEST', topic: 'games.wordle.words.w91.topic', meaning: 'games.wordle.words.w91.meaning', language: 'games.wordle.lang_en' },
  { word: 'MATCH', topic: 'games.wordle.words.w92.topic', meaning: 'games.wordle.words.w92.meaning', language: 'games.wordle.lang_en' },
  { word: 'COLOR', topic: 'games.wordle.words.w93.topic', meaning: 'games.wordle.words.w93.meaning', language: 'games.wordle.lang_en' },
  { word: 'LIGHT', topic: 'games.wordle.words.w94.topic', meaning: 'games.wordle.words.w94.meaning', language: 'games.wordle.lang_en' },
  { word: 'POWER', topic: 'games.wordle.words.w95.topic', meaning: 'games.wordle.words.w95.meaning', language: 'games.wordle.lang_en' },
  { word: 'BRAIN', topic: 'games.wordle.words.w96.topic', meaning: 'games.wordle.words.w96.meaning', language: 'games.wordle.lang_en' },
  { word: 'SOLVE', topic: 'games.wordle.words.w97.topic', meaning: 'games.wordle.words.w97.meaning', language: 'games.wordle.lang_en' },
  { word: 'GUARD', topic: 'games.wordle.words.w98.topic', meaning: 'games.wordle.words.w98.meaning', language: 'games.wordle.lang_en' },
  { word: 'FLASH', topic: 'games.wordle.words.w99.topic', meaning: 'games.wordle.words.w99.meaning', language: 'games.wordle.lang_en' },
];

const MAX_GUESSES = 6;
const WORD_LENGTH = 5;

type LetterState = 'CORRECT' | 'PRESENT' | 'ABSENT' | 'EMPTY';

// In-session Non-repeating Word Deck
let remainingWordIndices: number[] = [];

function getNextWord(): WordEntry {
  if (remainingWordIndices.length === 0) {
    remainingWordIndices = Array.from({ length: WORD_DATABASE.length }, (_, i) => i);
    // Fisher-Yates shuffle
    for (let i = remainingWordIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [remainingWordIndices[i], remainingWordIndices[j]] = [remainingWordIndices[j], remainingWordIndices[i]];
    }
  }
  const chosenIndex = remainingWordIndices.pop()!;
  return WORD_DATABASE[chosenIndex];
}

export const WordleGame: React.FC<WordleGameProps> = ({ onBack, onClaimReward }) => {
  const { t } = useTranslation();

  const [currentEntry, setCurrentEntry] = useState<WordEntry>(WORD_DATABASE[0]);
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState<string>('');
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isWon, setIsWon] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(!GameSounds.isSoundMuted());
  const [showRewardModal, setShowRewardModal] = useState<boolean>(false);
  const [rewardAmount, setRewardAmount] = useState<number>(0);
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [shakeRow, setShakeRow] = useState<boolean>(false);
  const [revealedLetterIdx, setRevealedLetterIdx] = useState<number | null>(null);

  const secretWord = useMemo(() => currentEntry.word, [currentEntry]);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    GameSounds.setMuted(!next);
  };

  const startNewGame = useCallback(() => {
    const chosen = getNextWord();
    setCurrentEntry(chosen);
    setGuesses([]);
    setCurrentGuess('');
    setIsGameOver(false);
    setIsWon(false);
    setShowHint(false);
    setRevealedLetterIdx(null);
    setShakeRow(false);
    GameSounds.playStart();
  }, []);

  useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  const handleKeyPress = useCallback(
    (char: string) => {
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
        // Only accept A-Z
        const upper = char.toUpperCase();
        if (/^[A-Z]$/.test(upper)) {
          setCurrentGuess((prev) => prev + upper);
          GameSounds.playTap();
        }
      }
    },
    [isGameOver, isWon, currentGuess, guesses, secretWord]
  );

  // Global Physical Keyboard Support (A-Z, Enter, Backspace)
  useEffect(() => {
    const handlePhysicalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleKeyPress('ENTER');
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleKeyPress('BACKSPACE');
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault();
        handleKeyPress(e.key.toUpperCase());
      }
    };

    window.addEventListener('keydown', handlePhysicalKeyDown);
    return () => window.removeEventListener('keydown', handlePhysicalKeyDown);
  }, [handleKeyPress]);

  const revealOneLetterHint = () => {
    if (revealedLetterIdx !== null || isGameOver || isWon) return;
    const unrevealedIndices: number[] = [];
    for (let i = 0; i < WORD_LENGTH; i++) {
      let isAlreadyKnown = false;
      for (const g of guesses) {
        if (g[i] === secretWord[i]) {
          isAlreadyKnown = true;
          break;
        }
      }
      if (!isAlreadyKnown) unrevealedIndices.push(i);
    }

    if (unrevealedIndices.length > 0) {
      const pick = unrevealedIndices[Math.floor(Math.random() * unrevealedIndices.length)];
      setRevealedLetterIdx(pick);
      GameSounds.playWinFanfare();
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
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans select-none pb-10 animate-fade-in">
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
      <main className="flex-1 max-w-md mx-auto w-full px-3 py-2 flex flex-col items-center justify-between">
        {/* Topic Badge & Hint Trigger Banner */}
        <div className="w-full bg-slate-900/70 border border-slate-800/90 rounded-2xl p-2.5 shadow-lg space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <div className="min-w-0">
                <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">
                  {t('games.wordle.topic_label', { topic: t(currentEntry.topic), lang: t(currentEntry.language) })}
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowHint((prev) => !prev)}
              className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-[11px] font-bold flex items-center gap-1 active:scale-95 transition shrink-0"
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              <span>{t('games.wordle.btn_hint')}</span>
            </button>
          </div>

          {/* Expandable Clue & Meaning Box */}
          {showHint && (
            <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-2 text-xs text-amber-200 animate-fade-in flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium">
                  <strong className="text-amber-300">{t('games.wordle.hint_title')}:</strong> {t(currentEntry.meaning)}
                </p>
                {revealedLetterIdx === null ? (
                  <button
                    onClick={revealOneLetterHint}
                    className="text-[10px] bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded-md hover:bg-amber-400 transition"
                  >
                    {t('games.wordle.unlock_letter_btn')}
                  </button>
                ) : (
                  <p className="text-[11px] text-emerald-400 font-bold">
                    {t('games.wordle.revealed_letter_info', {
                      pos: revealedLetterIdx + 1,
                      letter: secretWord[revealedLetterIdx],
                    })}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 6x5 3D Glassmorphism Letter Grid */}
        <div className="grid grid-rows-6 gap-1.5 my-2 w-full max-w-[280px] p-2 bg-slate-900/60 border border-slate-800/80 rounded-3xl backdrop-blur-md shadow-2xl">
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
                    if (state === 'CORRECT') {
                      cellStyle =
                        'bg-gradient-to-br from-emerald-400 via-emerald-600 to-teal-800 border-emerald-300 text-white shadow-lg shadow-emerald-950/60 ring-1 ring-emerald-300 animate-flip';
                    } else if (state === 'PRESENT') {
                      cellStyle =
                        'bg-gradient-to-br from-yellow-300 via-amber-500 to-orange-700 border-yellow-200 text-white shadow-lg shadow-amber-950/60 ring-1 ring-yellow-200 animate-flip';
                    } else {
                      cellStyle = 'bg-slate-800/90 border-slate-700 text-slate-400';
                    }
                  } else if (letter) {
                    cellStyle =
                      'bg-slate-800 border-amber-400 text-white scale-105 shadow-md shadow-amber-500/30';
                  } else if (isCurrentRow && revealedLetterIdx === cIdx) {
                    cellStyle =
                      'bg-emerald-950/40 border-emerald-500/80 text-emerald-400 animate-pulse';
                  }

                  return (
                    <div
                      key={cIdx}
                      className={`aspect-square rounded-xl border-2 flex items-center justify-center font-mono font-black text-lg sm:text-xl transition-all duration-200 relative overflow-hidden ${cellStyle}`}
                    >
                      {/* 3D Specular Highlight */}
                      <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none rounded-t-xl" />
                      <span className="relative z-10 drop-shadow-md">
                        {letter || (isCurrentRow && revealedLetterIdx === cIdx ? secretWord[cIdx] : '')}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Clear Color Meaning Legend Bar */}
        <div className="w-full max-w-[340px] flex items-center justify-center gap-3 bg-slate-900/50 border border-slate-800/80 rounded-xl px-2.5 py-1 text-[10px] text-slate-300">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 border border-emerald-300" />
            <span>{t('games.wordle.legend_correct')}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 border border-yellow-200" />
            <span>{t('games.wordle.legend_present')}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-700 border border-slate-600" />
            <span>{t('games.wordle.legend_absent')}</span>
          </div>
        </div>

        {/* Secret Word Reveal on Game Over */}
        {isGameOver && !isWon && (
          <div className="bg-red-950/80 border border-red-500/50 px-4 py-2 rounded-xl text-center text-xs text-red-300 font-mono my-1 shadow-lg animate-fade-in">
            {t('games.wordle.correct_word', { word: secretWord, meaning: t(currentEntry.meaning) })}
          </div>
        )}

        {/* Cyberpunk Virtual Keyboard */}
        <div className="w-full max-w-[360px] space-y-1 mt-1.5">
          {KEYBOARD_ROWS.map((row, rIdx) => (
            <div key={rIdx} className="flex justify-center gap-1">
              {row.map((key) => {
                const keyStatus = getKeyboardKeyStatus(key);
                let btnStyle = 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border-slate-700/80 shadow-xs';

                if (keyStatus === 'CORRECT')
                  btnStyle =
                    'bg-gradient-to-br from-emerald-500 to-teal-700 text-white border-emerald-300 shadow-md shadow-emerald-950/50';
                else if (keyStatus === 'PRESENT')
                  btnStyle =
                    'bg-gradient-to-br from-amber-400 to-yellow-600 text-white border-yellow-200 shadow-md shadow-amber-950/50';
                else if (keyStatus === 'ABSENT')
                  btnStyle = 'bg-slate-900/60 text-slate-600 border-slate-800/80';

                return (
                  <button
                    key={key}
                    onClick={() => handleKeyPress(key)}
                    className={`py-2.5 sm:py-3 rounded-xl border font-mono font-bold text-xs sm:text-sm active:scale-95 transition flex items-center justify-center ${
                      key === 'ENTER' || key === 'BACKSPACE'
                        ? 'px-2 sm:px-3 text-[10px] bg-slate-700/90 text-amber-300 border-slate-600 font-black'
                        : 'flex-1'
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
              🏆
            </div>
            <div>
              <h3 className="text-lg font-black text-white">{t('games.wordle.win_title')}</h3>
              <p className="text-xs text-amber-300 mt-1 font-mono font-bold">
                &quot;{secretWord}&quot; • {t(currentEntry.meaning)}
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
