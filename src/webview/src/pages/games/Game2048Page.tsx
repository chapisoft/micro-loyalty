import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { RotateCcw, Undo2 } from 'lucide-react';
import { GameSounds } from '../../utils/audio';
import { GameHeader } from '../../components/common/GameHeader';
import { GameTutorialModal } from '../../components/common/GameTutorialModal';

export interface Game2048PageProps {
  onBack: () => void;
  onClaimReward?: (pointsWon: number) => void;
}

type Board = number[][];

const BOARD_SIZE = 4;
const MAX_UNDO_HISTORY = 5;

function addRandomTile(b: Board): { r: number; c: number } | null {
  const emptyCells: { r: number; c: number }[] = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (b[r][c] === 0) emptyCells.push({ r, c });
    }
  }
  if (emptyCells.length === 0) return null;
  const chosen = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  b[chosen.r][chosen.c] = Math.random() < 0.9 ? 2 : 4;
  return chosen;
}

function getInitialBoard(): Board {
  const newBoard = Array(BOARD_SIZE)
    .fill(null)
    .map(() => Array(BOARD_SIZE).fill(0));
  addRandomTile(newBoard);
  addRandomTile(newBoard);
  return newBoard;
}

function cloneBoard(b: Board): Board {
  return b.map((row) => [...row]);
}

function rotateGridClockwise<T>(grid: T[][]): T[][] {
  const res: T[][] = Array(BOARD_SIZE)
    .fill(null)
    .map(() => [] as T[]);
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      res[c][BOARD_SIZE - 1 - r] = grid[r][c];
    }
  }
  return res;
}

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
  const [history, setHistory] = useState<{ board: Board; score: number }[]>([]);
  const [spawnedCell, setSpawnedCell] = useState<string | null>(null);
  const [mergedCells, setMergedCells] = useState<Set<string>>(new Set());
  const [moveSeq, setMoveSeq] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(!GameSounds.isSoundMuted());
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [gameWon, setGameWon] = useState<boolean>(false);
  const [showRewardModal, setShowRewardModal] = useState<boolean>(false);
  const [rewardAmount, setRewardAmount] = useState<number>(0);
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  const [gainPopup, setGainPopup] = useState<number | null>(null);
  const [shake, setShake] = useState<boolean>(false);

  const pointerStartRef = useRef<{ x: number; y: number; consumed: boolean } | null>(null);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    GameSounds.setMuted(!next);
  };

  const resetGame = useCallback(() => {
    const freshBoard = getInitialBoard();
    setBoard(freshBoard);
    setScore(0);
    setHistory([]);
    setSpawnedCell(null);
    setMergedCells(new Set());
    setGameOver(false);
    setGameWon(false);
    GameSounds.playTap();
  }, []);

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setBoard(cloneBoard(prev.board));
    setScore(prev.score);
    setHistory((h) => h.slice(0, -1));
    setSpawnedCell(null);
    setMergedCells(new Set());
    setGameOver(false);
    GameSounds.playTap();
  }, [history]);

  // Slide and merge one row towards the left
  function slideLeft(row: number[]): {
    newRow: number[];
    mergedFlags: boolean[];
    scoreGain: number;
    changed: boolean;
  } {
    const filtered = row.filter((val) => val !== 0);
    let scoreGain = 0;
    const newRow: number[] = [];
    const mergedFlags: boolean[] = [];

    for (let i = 0; i < filtered.length; i++) {
      if (i < filtered.length - 1 && filtered[i] === filtered[i + 1]) {
        const mergedVal = filtered[i] * 2;
        newRow.push(mergedVal);
        mergedFlags.push(true);
        scoreGain += mergedVal;
        i++; // skip next merged item
      } else {
        newRow.push(filtered[i]);
        mergedFlags.push(false);
      }
    }
    while (newRow.length < BOARD_SIZE) {
      newRow.push(0);
      mergedFlags.push(false);
    }
    const changed = row.some((val, idx) => val !== newRow[idx]);
    return { newRow, mergedFlags, scoreGain, changed };
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

      let rotatedBoard = cloneBoard(board);
      let rotations = 0;

      if (direction === 'UP') rotations = 3;
      else if (direction === 'RIGHT') rotations = 2;
      else if (direction === 'DOWN') rotations = 1;

      for (let i = 0; i < rotations; i++) {
        rotatedBoard = rotateGridClockwise(rotatedBoard);
      }

      let boardChanged = false;
      let totalGain = 0;
      const rotatedMergedGrid: boolean[][] = [];

      const newRotatedBoard = rotatedBoard.map((row) => {
        const { newRow, mergedFlags, scoreGain, changed } = slideLeft(row);
        if (changed) boardChanged = true;
        totalGain += scoreGain;
        rotatedMergedGrid.push(mergedFlags);
        return newRow;
      });

      if (!boardChanged) return;

      // Save undo snapshot (capped at MAX_UNDO_HISTORY steps)
      setHistory((prev) => [...prev.slice(-(MAX_UNDO_HISTORY - 1)), { board: cloneBoard(board), score }]);

      // Rotate board & merge flags back to world orientation
      let finalBoard = newRotatedBoard;
      let finalMergedGrid = rotatedMergedGrid;
      for (let i = 0; i < (4 - rotations) % 4; i++) {
        finalBoard = rotateGridClockwise(finalBoard);
        finalMergedGrid = rotateGridClockwise(finalMergedGrid);
      }

      const spawned = addRandomTile(finalBoard);
      const nextMerged = new Set<string>();
      for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
          if (finalMergedGrid[r][c]) {
            nextMerged.add(`${r}-${c}`);
          }
        }
      }

      setBoard(finalBoard);
      setSpawnedCell(spawned ? `${spawned.r}-${spawned.c}` : null);
      setMergedCells(nextMerged);
      setMoveSeq((s) => s + 1);

      const newScore = score + totalGain;
      setScore(newScore);
      if (newScore > highScore) {
        setHighScore(newScore);
        try {
          localStorage.setItem('game2048_best_score', String(newScore));
        } catch {
          /* ignore storage errors */
        }
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

  // Keyboard navigation (Arrow keys + WASD)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        move('LEFT');
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        move('RIGHT');
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        move('UP');
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        move('DOWN');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [move]);

  // Unified pointer swipe gesture handlers (fires immediately once swipe threshold crossed)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    pointerStartRef.current = { x: e.clientX, y: e.clientY, consumed: false };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const start = pointerStartRef.current;
    if (!start || start.consumed) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;

    if (Math.hypot(dx, dy) < 26) return;
    start.consumed = true;

    if (Math.abs(dx) > Math.abs(dy)) {
      move(dx > 0 ? 'RIGHT' : 'LEFT');
    } else {
      move(dy > 0 ? 'DOWN' : 'UP');
    }
  };

  const handlePointerUp = () => {
    pointerStartRef.current = null;
  };

  const getTileStyle = (val: number) => {
    switch (val) {
      case 2:
        return {
          bg: 'bg-gradient-to-br from-amber-100 via-amber-200 to-amber-300 border-2 border-amber-300 text-amber-950',
          size: 'text-2xl sm:text-3xl font-black',
          shadow: 'shadow-md shadow-amber-900/20',
          label: '2 HTG',
        };
      case 4:
        return {
          bg: 'bg-gradient-to-br from-amber-200 via-amber-300 to-amber-400 border-2 border-amber-400 text-amber-950',
          size: 'text-2xl sm:text-3xl font-black',
          shadow: 'shadow-md shadow-amber-900/30',
          label: '4 HTG',
        };
      case 8:
        return {
          bg: 'bg-gradient-to-br from-slate-200 via-slate-100 to-slate-300 border-2 border-white text-slate-900',
          size: 'text-2xl sm:text-3xl font-black',
          shadow: 'shadow-lg shadow-slate-900/40',
          label: '8 HTG',
        };
      case 16:
        return {
          bg: 'bg-gradient-to-br from-slate-100 via-sky-200 to-slate-300 border-2 border-sky-200 text-slate-900',
          size: 'text-2xl sm:text-3xl font-black',
          shadow: 'shadow-lg shadow-sky-900/40',
          label: '16 HTG',
        };
      case 32:
        return {
          bg: 'bg-gradient-to-br from-rose-500 via-rose-600 to-red-700 border-2 border-rose-300 text-white',
          size: 'text-2xl sm:text-3xl font-black',
          shadow: 'shadow-lg shadow-rose-900/50',
          label: '32 HTG',
        };
      case 64:
        return {
          bg: 'bg-gradient-to-br from-red-600 via-rose-700 to-red-900 border-2 border-red-300 text-white',
          size: 'text-2xl sm:text-3xl font-black',
          shadow: 'shadow-xl shadow-red-950/60',
          label: '64 HTG',
        };
      case 128:
        return {
          bg: 'bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-500 border-2 border-yellow-200 text-amber-950',
          size: 'text-xl sm:text-2xl font-black',
          shadow: 'shadow-xl shadow-amber-900/50 ring-2 ring-yellow-300',
          label: '128 HTG',
        };
      case 256:
        return {
          bg: 'bg-gradient-to-br from-yellow-200 via-amber-400 to-orange-500 border-2 border-white text-slate-950',
          size: 'text-xl sm:text-2xl font-black',
          shadow: 'shadow-xl shadow-amber-900/60 ring-2 ring-yellow-200',
          label: '256 HTG',
        };
      case 512:
        return {
          bg: 'bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-600 border-2 border-yellow-100 text-slate-950',
          size: 'text-lg sm:text-xl font-black',
          shadow: 'shadow-2xl shadow-yellow-900/70 ring-2 ring-amber-300',
          label: '512 HTG',
        };
      case 1024:
        return {
          bg: 'bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-700 border-2 border-emerald-200 text-white',
          size: 'text-base sm:text-lg font-black',
          shadow: 'shadow-2xl shadow-emerald-950/70 ring-2 ring-emerald-300',
          label: '1024 HTG',
        };
      case 2048:
        return {
          bg: 'bg-gradient-to-br from-yellow-300 via-amber-500 to-rose-600 border-2 border-yellow-200 text-white animate-pulse',
          size: 'text-sm sm:text-base font-black',
          shadow: 'shadow-2xl shadow-yellow-500/80 ring-4 ring-yellow-300',
          label: '2048 VIP',
        };
      default:
        return {
          bg: 'bg-gradient-to-br from-purple-500 to-indigo-700 border-2 border-purple-300 text-white',
          size: 'text-sm font-black',
          shadow: 'shadow-2xl',
          label: `${val}`,
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
    <div className="h-[100dvh] bg-slate-950 text-white flex flex-col overflow-hidden overscroll-none font-sans select-none">
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
      <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain max-w-md mx-auto w-full px-3 py-4 pb-4 flex flex-col items-center justify-center gap-3.5">
        {/* Score HUD Bar */}
        <div className="w-full max-w-[368px] flex items-center justify-between gap-2 bg-slate-900/80 border border-slate-800/90 rounded-2xl px-3.5 py-2.5 shadow-lg">
          <p className="text-[11px] text-slate-300 font-medium leading-snug">{t('games.game2048.subtitle')}</p>

          <div className="flex items-center gap-2 shrink-0">
            <div className="bg-slate-800/90 border border-slate-700/80 px-3 py-1 rounded-xl text-center min-w-[64px]">
              <span className="text-[9px] text-slate-400 block uppercase font-bold tracking-wider">
                {t('games.game2048.score_label')}
              </span>
              <span className="font-mono font-black text-white text-sm">{score}</span>
            </div>
            <div className="bg-amber-950/60 border border-amber-500/40 px-3 py-1 rounded-xl text-center min-w-[64px]">
              <span className="text-[9px] text-amber-300 block uppercase font-bold tracking-wider">
                {t('games.game2048.best_label')}
              </span>
              <span className="font-mono font-black text-amber-400 text-sm">{highScore}</span>
            </div>
          </div>
        </div>

        {/* 2048 4x4 Grid Board with Locked Square Rows & Smooth Spawn/Merge Animations */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={() => {
            pointerStartRef.current = null;
          }}
          className={`relative w-full aspect-square max-w-[368px] bg-gradient-to-b from-slate-900 via-[#10182e] to-slate-950 border-2 border-amber-500/40 rounded-3xl p-3 shadow-[0_20px_50px_rgba(0,0,0,0.65)] touch-none select-none transition-transform cursor-grab active:cursor-grabbing ${
            shake ? 'scale-[1.02]' : ''
          }`}
        >
          {gainPopup !== null && (
            <div className="absolute -top-4 inset-x-0 flex justify-center z-30 pointer-events-none animate-bounce">
              <span className="px-4 py-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black text-xs rounded-full shadow-xl border border-yellow-200">
                +{gainPopup} ✨
              </span>
            </div>
          )}

          <div className="grid grid-cols-4 grid-rows-4 gap-2.5 w-full h-full">
            {board.map((row, rIdx) =>
              row.map((cell, cIdx) => {
                const cellKey = `${rIdx}-${cIdx}`;
                const style = getTileStyle(cell);
                const isSpawned = spawnedCell === cellKey;
                const isMerged = mergedCells.has(cellKey);
                const animClass = isMerged ? 'animate-tile-merge' : isSpawned ? 'animate-tile-spawn' : '';

                return (
                  <div
                    key={cellKey}
                    className="rounded-2xl bg-slate-800/45 border border-slate-700/35 relative overflow-hidden"
                  >
                    {cell > 0 && (
                      <div
                        key={`${cellKey}-${moveSeq}-${cell}`}
                        className={`w-full h-full rounded-2xl flex flex-col items-center justify-center font-mono font-black relative overflow-hidden will-change-transform ${style.bg} ${style.shadow} ${animClass}`}
                      >
                        {/* 3D Specular Highlight Gloss */}
                        <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/35 to-transparent rounded-t-2xl pointer-events-none" />
                        <span className={`${style.size} leading-none drop-shadow-sm relative z-10 tracking-tight`}>
                          {cell}
                        </span>
                        <span className="text-[8px] opacity-85 uppercase tracking-wider font-extrabold leading-none mt-1 relative z-10">
                          {style.label}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Game Over Overlay */}
          {gameOver && (
            <div
              onPointerDown={(e) => e.stopPropagation()}
              className="absolute inset-0 bg-slate-950/90 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center p-6 text-center animate-fade-in z-20 border border-red-500/40"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-rose-700 border-2 border-red-300 text-white flex items-center justify-center mb-2 shadow-xl">
                <RotateCcw className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-black text-red-400 mb-1">{t('games.game2048.game_over')}</h3>
              <p className="text-xs text-slate-300 mb-4">{t('games.game2048.score', { score })}</p>
              <div className="flex gap-2">
                {history.length > 0 && (
                  <button
                    onClick={handleUndo}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-sm border border-slate-700 active:scale-95 transition flex items-center gap-1.5"
                  >
                    <Undo2 className="w-4 h-4" />
                    <span>{t('games.game2048.btn_undo')}</span>
                  </button>
                )}
                <button
                  onClick={resetGame}
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black rounded-xl text-sm shadow-lg active:scale-95 transition"
                >
                  {t('games.game2048.btn_new_game')}
                </button>
              </div>
            </div>
          )}

          {/* Win 2048 Overlay */}
          {gameWon && (
            <div
              onPointerDown={(e) => e.stopPropagation()}
              className="absolute inset-0 bg-slate-950/90 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center p-6 text-center animate-fade-in z-20 border border-amber-400/50"
            >
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-yellow-300 via-amber-500 to-orange-600 text-slate-950 flex items-center justify-center mb-3 shadow-2xl animate-bounce border-2 border-white">
                <span className="font-black text-2xl text-amber-950">2048</span>
              </div>
              <h3 className="text-xl font-black text-amber-300 mb-1">{t('games.game2048.win_2048')}</h3>
              <p className="text-xs text-slate-300 mb-4">{t('games.game2048.score', { score })}</p>
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

        {/* Sleek 2-Button Action Bar (Undo + New Game) */}
        <div className="w-full max-w-[368px] flex items-center gap-2.5">
          <button
            onClick={handleUndo}
            disabled={history.length === 0}
            className={`flex-1 py-2.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
              history.length > 0
                ? 'bg-slate-800/90 hover:bg-slate-700 border-slate-700 text-white active:scale-95 shadow-md'
                : 'bg-slate-900/50 border-slate-800/70 text-slate-600 cursor-not-allowed'
            }`}
          >
            <Undo2 className="w-4 h-4 text-amber-400" />
            <span>
              {t('games.game2048.btn_undo')}
              {history.length > 0 ? ` (${history.length})` : ''}
            </span>
          </button>

          <button
            onClick={resetGame}
            className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:brightness-105 text-slate-950 font-black rounded-2xl text-xs shadow-lg active:scale-95 transition flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{t('games.game2048.btn_new_game')}</span>
          </button>
        </div>

        <p className="text-[11px] text-slate-400 text-center max-w-xs">{t('games.game2048.swipe_hint')}</p>
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
