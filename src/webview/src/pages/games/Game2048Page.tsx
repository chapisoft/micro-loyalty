import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { RotateCcw } from 'lucide-react';
import { GameSounds } from '../../utils/audio';
import { GameHeader } from '../../components/common/GameHeader';
import { GameTutorialModal } from '../../components/common/GameTutorialModal';

export interface Game2048PageProps {
  onBack: () => void;
  onClaimReward?: (pointsWon: number) => void;
}

type Board = number[][];

const BOARD_SIZE = 4;

export const Game2048Page: React.FC<Game2048PageProps> = ({ onBack, onClaimReward }) => {
  const { t } = useTranslation();

  const [board, setBoard] = useState<Board>(() => getInitialBoard());
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('game2048_best_score') || 0);
    } catch {
      return 0;
    }
  });
  const [soundEnabled, setSoundEnabled] = useState<boolean>(!GameSounds.isSoundMuted());
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [gameWon, setGameWon] = useState<boolean>(false);
  const [showRewardModal, setShowRewardModal] = useState<boolean>(false);
  const [rewardAmount, setRewardAmount] = useState<number>(0);
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  const [gainPopup, setGainPopup] = useState<number | null>(null);
  const [shake, setShake] = useState<boolean>(false);

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    GameSounds.setMuted(!next);
  };

  function getInitialBoard(): Board {
    const newBoard = Array(BOARD_SIZE)
      .fill(null)
      .map(() => Array(BOARD_SIZE).fill(0));
    addRandomTile(newBoard);
    addRandomTile(newBoard);
    return newBoard;
  }

  function addRandomTile(b: Board): boolean {
    const emptyCells: { r: number; c: number }[] = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (b[r][c] === 0) emptyCells.push({ r, c });
      }
    }
    if (emptyCells.length === 0) return false;
    const { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    b[r][c] = Math.random() < 0.9 ? 2 : 4;
    return true;
  }

  const resetGame = useCallback(() => {
    const freshBoard = getInitialBoard();
    setBoard(freshBoard);
    setScore(0);
    setGameOver(false);
    setGameWon(false);
    GameSounds.playTap();
  }, []);

  // Slide and merge one row towards the left
  function slideLeft(row: number[]): { newRow: number[]; scoreGain: number; changed: boolean } {
    let filtered = row.filter((val) => val !== 0);
    let scoreGain = 0;
    let newRow: number[] = [];

    for (let i = 0; i < filtered.length; i++) {
      if (i < filtered.length - 1 && filtered[i] === filtered[i + 1]) {
        const mergedVal = filtered[i] * 2;
        newRow.push(mergedVal);
        scoreGain += mergedVal;
        i++; // skip next merged item
      } else {
        newRow.push(filtered[i]);
      }
    }
    while (newRow.length < BOARD_SIZE) {
      newRow.push(0);
    }
    const changed = row.some((val, idx) => val !== newRow[idx]);
    return { newRow, scoreGain, changed };
  }

  function rotateClockwise(b: Board): Board {
    const res: Board = Array(BOARD_SIZE)
      .fill(null)
      .map(() => Array(BOARD_SIZE).fill(0));
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        res[c][BOARD_SIZE - 1 - r] = b[r][c];
      }
    }
    return res;
  }

  function checkGameOver(b: Board): boolean {
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (b[r][c] === 0) return false;
        if (c < BOARD_SIZE - 1 && b[r][c] === b[r][c + 1]) return false;
        if (r < BOARD_SIZE - 1 && b[r][c] === b[r + 1][c]) return false;
      }
    }
    return true;
  }

  const move = useCallback(
    (direction: 'LEFT' | 'RIGHT' | 'UP' | 'DOWN') => {
      if (gameOver) return;

      let rotatedBoard = board.map((row) => [...row]);
      let rotations = 0;

      if (direction === 'UP') rotations = 3;
      else if (direction === 'RIGHT') rotations = 2;
      else if (direction === 'DOWN') rotations = 1;

      for (let i = 0; i < rotations; i++) {
        rotatedBoard = rotateClockwise(rotatedBoard);
      }

      let boardChanged = false;
      let totalGain = 0;

      const newRotatedBoard = rotatedBoard.map((row) => {
        const { newRow, scoreGain, changed } = slideLeft(row);
        if (changed) boardChanged = true;
        totalGain += scoreGain;
        return newRow;
      });

      if (!boardChanged) return;

      // Rotate back
      let finalBoard = newRotatedBoard;
      for (let i = 0; i < (4 - rotations) % 4; i++) {
        finalBoard = rotateClockwise(finalBoard);
      }

      addRandomTile(finalBoard);
      setBoard(finalBoard);

      const newScore = score + totalGain;
      setScore(newScore);
      if (newScore > highScore) {
        setHighScore(newScore);
        try {
          localStorage.setItem('game2048_best_score', String(newScore));
        } catch {}
      }

      if (totalGain > 0) {
        setGainPopup(totalGain);
        setTimeout(() => setGainPopup(null), 800);
        if (totalGain >= 128) {
          setShake(true);
          setTimeout(() => setShake(false), 300);
        }
        GameSounds.playCorrect();
      } else {
        GameSounds.playTap();
      }

      // Check win 2048
      const has2048 = finalBoard.some((row) => row.some((cell) => cell >= 2048));
      if (has2048 && !gameWon) {
        setGameWon(true);
        setRewardAmount(200);
        setShowRewardModal(true);
        GameSounds.playWinFanfare();
      }

      // Check game over
      if (checkGameOver(finalBoard)) {
        setGameOver(true);
        GameSounds.playLose();
        if (newScore >= 500) {
          const reward = Math.min(100, Math.floor(newScore / 20));
          setRewardAmount(reward);
          setShowRewardModal(true);
        }
      }
    },
    [board, gameOver, gameWon, highScore, score]
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        move('LEFT');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        move('RIGHT');
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        move('UP');
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        move('DOWN');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [move]);

  // Touch swipe gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    if (Math.hypot(dx, dy) < 25) return; // ignore short tap

    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) move('RIGHT');
      else move('LEFT');
    } else {
      if (dy > 0) move('DOWN');
      else move('UP');
    }
  };

  const getTileStyle = (val: number) => {
    switch (val) {
      case 2:
        return {
          bg: 'bg-gradient-to-br from-amber-100 via-amber-200 to-amber-300 border-2 border-amber-300 text-amber-950',
          size: 'text-2xl sm:text-3xl font-black',
          shadow: 'shadow-md shadow-amber-900/20 shadow-inner',
          label: '2 HTG',
          badge: 'BRONZE'
        };
      case 4:
        return {
          bg: 'bg-gradient-to-br from-amber-200 via-amber-300 to-amber-400 border-2 border-amber-400 text-amber-950',
          size: 'text-2xl sm:text-3xl font-black',
          shadow: 'shadow-md shadow-amber-900/30 shadow-inner',
          label: '4 HTG',
          badge: 'BRONZE'
        };
      case 8:
        return {
          bg: 'bg-gradient-to-br from-slate-200 via-slate-100 to-slate-300 border-2 border-white text-slate-900',
          size: 'text-2xl sm:text-3xl font-black',
          shadow: 'shadow-lg shadow-slate-900/40 shadow-inner',
          label: '8 HTG',
          badge: 'SILVER'
        };
      case 16:
        return {
          bg: 'bg-gradient-to-br from-slate-100 via-sky-200 to-slate-300 border-2 border-sky-200 text-slate-900',
          size: 'text-2xl sm:text-3xl font-black',
          shadow: 'shadow-lg shadow-sky-900/40 shadow-inner',
          label: '16 HTG',
          badge: 'SILVER'
        };
      case 32:
        return {
          bg: 'bg-gradient-to-br from-rose-500 via-rose-600 to-red-700 border-2 border-rose-300 text-white',
          size: 'text-2xl sm:text-3xl font-black',
          shadow: 'shadow-lg shadow-rose-900/50 shadow-inner',
          label: '32 HTG',
          badge: 'RUBY'
        };
      case 64:
        return {
          bg: 'bg-gradient-to-br from-red-600 via-rose-700 to-red-900 border-2 border-red-300 text-white',
          size: 'text-2xl sm:text-3xl font-black',
          shadow: 'shadow-xl shadow-red-950/60 shadow-inner',
          label: '64 HTG',
          badge: 'RUBY'
        };
      case 128:
        return {
          bg: 'bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-500 border-2 border-yellow-200 text-amber-950',
          size: 'text-xl sm:text-2xl font-black',
          shadow: 'shadow-xl shadow-amber-900/50 ring-2 ring-yellow-300 shadow-inner',
          label: '128 HTG',
          badge: 'GOLD'
        };
      case 256:
        return {
          bg: 'bg-gradient-to-br from-yellow-200 via-amber-400 to-orange-500 border-2 border-white text-slate-950',
          size: 'text-xl sm:text-2xl font-black',
          shadow: 'shadow-xl shadow-amber-900/60 ring-2 ring-yellow-200 shadow-inner',
          label: '256 HTG',
          badge: 'GOLD'
        };
      case 512:
        return {
          bg: 'bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-600 border-2 border-yellow-100 text-slate-950',
          size: 'text-lg sm:text-xl font-black',
          shadow: 'shadow-2xl shadow-yellow-900/70 ring-3 ring-amber-300 shadow-inner',
          label: '512 HTG',
          badge: 'GOLD VIP'
        };
      case 1024:
        return {
          bg: 'bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-700 border-2 border-emerald-200 text-white',
          size: 'text-base sm:text-lg font-black',
          shadow: 'shadow-2xl shadow-emerald-950/70 ring-3 ring-emerald-300 shadow-inner',
          label: '1024 HTG',
          badge: 'EMERALD'
        };
      case 2048:
        return {
          bg: 'bg-gradient-to-br from-yellow-300 via-amber-500 to-rose-600 border-3 border-yellow-200 text-white animate-pulse',
          size: 'text-base sm:text-lg font-black',
          shadow: 'shadow-2xl shadow-yellow-500/80 ring-4 ring-yellow-300 shadow-inner',
          label: '2048 NATCASH',
          badge: 'DIAMOND VIP'
        };
      default:
        return {
          bg: 'bg-slate-800 text-white font-black',
          size: 'text-xs',
          shadow: 'shadow-2xl',
          label: `${val}`,
          badge: 'VIP'
        };
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
        title={t('games.game2048.title')}
        subtitle={highScore > 0 ? t('games.game2048.best', { best: highScore }) : undefined}
        onBack={onBack}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
        onRestart={resetGame}
        restartTooltip={t('games.common.btn_play_again')}
        onHelp={() => setShowTutorial(true)}
      />

      {/* ── MAIN STAGE ── */}
      <main className="flex-1 max-w-md mx-auto w-full px-3 py-4 flex flex-col items-center justify-between">
        {/* Header & Score Bar */}
        <div className="w-full flex items-center justify-between gap-3 mb-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-400 tracking-tight">
              {t('games.game2048.title')}
            </h1>
            <p className="text-[11px] text-slate-400">{t('games.game2048.subtitle')}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-2xl text-center min-w-[70px]">
              <span className="text-[9px] text-slate-400 block uppercase font-bold">{t('games.game2048.score', { score: '' })}</span>
              <span className="font-mono font-black text-white text-sm">{score}</span>
            </div>
            <div className="bg-amber-950/60 border border-amber-500/40 px-3 py-1.5 rounded-2xl text-center min-w-[70px]">
              <span className="text-[9px] text-amber-300 block uppercase font-bold">{t('games.game2048.best_score', { best: '' })}</span>
              <span className="font-mono font-black text-amber-400 text-sm">{highScore}</span>
            </div>
          </div>
        </div>

        {/* 2048 4x4 Grid Board with dynamic Screen Shake & Floating Merge FX */}
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className={`relative w-full aspect-square max-w-[360px] bg-slate-900/90 border-2 border-amber-500/40 rounded-3xl p-3 sm:p-4 shadow-2xl touch-none select-none flex flex-col justify-between transition-transform ${
            shake ? 'scale-105 rotate-1' : ''
          }`}
        >
          {gainPopup !== null && (
            <div className="absolute -top-4 inset-x-0 flex justify-center z-30 pointer-events-none animate-bounce">
              <span className="px-4 py-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black text-xs rounded-full shadow-xl border border-yellow-200">
                +{gainPopup} MERGE! ✨
              </span>
            </div>
          )}

          <div className="grid grid-cols-4 gap-2 sm:gap-3 w-full h-full">
            {board.map((row, rIdx) =>
              row.map((cell, cIdx) => {
                const style = getTileStyle(cell);
                return (
                  <div
                    key={`${rIdx}-${cIdx}`}
                    className={`rounded-2xl flex flex-col items-center justify-center font-mono font-black transition-all duration-150 relative overflow-hidden ${
                      cell === 0 ? 'bg-slate-800/40 border border-slate-700/30' : `${style.bg} ${style.shadow} transform scale-100 active:scale-95`
                    }`}
                  >
                    {cell > 0 && (
                      <>
                        {/* 3D Specular Highlight Gloss */}
                        <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/35 to-transparent rounded-t-2xl pointer-events-none" />
                        <span className={`${style.size} leading-none drop-shadow-md relative z-10 tracking-tight`}>{cell}</span>
                        <span className="text-[7.5px] sm:text-[8.5px] opacity-90 uppercase tracking-wider font-extrabold leading-none mt-0.5 relative z-10">
                          {style.label}
                        </span>
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Game Over Overlay */}
          {gameOver && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center p-6 text-center animate-fade-in z-20 border border-red-500/40">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-rose-700 border-2 border-red-300 text-white flex items-center justify-center mb-2 shadow-xl">
                <RotateCcw className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-black text-red-400 mb-1">{t('games.game2048.game_over')}</h3>
              <p className="text-xs text-slate-300 mb-4">{t('games.game2048.score', { score: score })}</p>
              <button
                onClick={resetGame}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black rounded-xl text-sm shadow-lg active:scale-95 transition"
              >
                {t('games.game2048.btn_new_game')}
              </button>
            </div>
          )}

          {/* Win 2048 Overlay */}
          {gameWon && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center p-6 text-center animate-fade-in z-20 border border-amber-400/50">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-yellow-300 via-amber-500 to-orange-600 text-slate-950 flex items-center justify-center mb-3 shadow-2xl animate-bounce border-2 border-white">
                <span className="font-black text-2xl text-amber-950">2048</span>
              </div>
              <h3 className="text-xl font-black text-amber-300 mb-1">{t('games.game2048.win_2048')}</h3>
              <p className="text-xs text-slate-300 mb-4">{t('games.game2048.score', { score: score })}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setGameWon(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs border border-slate-700 active:scale-95 transition"
                >
                  {t('games.game2048.btn_continue')}
                </button>
                <button
                  onClick={resetGame}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black rounded-xl text-xs shadow-lg active:scale-95 transition"
                >
                  {t('games.game2048.btn_new_game')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Directional Pad Controls for Mobile Helper */}
        <div className="w-full max-w-[280px] grid grid-cols-3 gap-2 mt-4 select-none">
          <div />
          <button
            onClick={() => move('UP')}
            className="py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-90 transition rounded-xl text-sm font-bold text-slate-200 border border-slate-700 shadow-md flex items-center justify-center"
          >
            ▲
          </button>
          <div />
          <button
            onClick={() => move('LEFT')}
            className="py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-90 transition rounded-xl text-sm font-bold text-slate-200 border border-slate-700 shadow-md flex items-center justify-center"
          >
            ◀
          </button>
          <button
            onClick={() => move('DOWN')}
            className="py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-90 transition rounded-xl text-sm font-bold text-slate-200 border border-slate-700 shadow-md flex items-center justify-center"
          >
            ▼
          </button>
          <button
            onClick={() => move('RIGHT')}
            className="py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-90 transition rounded-xl text-sm font-bold text-slate-200 border border-slate-700 shadow-md flex items-center justify-center"
          >
            ▶
          </button>
        </div>

        <p className="text-[11px] text-slate-400 mt-2 text-center max-w-xs">{t('games.game2048.how_to_play')}</p>
      </main>

      {/* ── REWARD MODAL ── */}
      {showRewardModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-amber-500/50 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl relative overflow-hidden">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center text-3xl mx-auto shadow-xl">
              🏆
            </div>
            <div>
              <h3 className="text-lg font-black text-white">{t('games.common.congratulations')}</h3>
              <p className="text-xs text-slate-400 mt-1">{t('games.game2048.score', { score })}</p>
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
        gameTitle={t('games.game2048.title')}
        gameIcon="🔢"
        goal={t('games.game2048.tutorial.goal')}
        controls={t('games.game2048.tutorial.controls')}
        scoring={t('games.game2048.tutorial.scoring')}
        tips={t('games.game2048.tutorial.tips')}
      />
    </div>
  );
};
