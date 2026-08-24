import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { RotateCcw } from 'lucide-react';
import { GameSounds } from '../../utils/audio';
import { GameHeader } from '../../components/common/GameHeader';
import { GameTutorialModal } from '../../components/common/GameTutorialModal';

export interface BlockPuzzleGameProps {
  onBack: () => void;
  onClaimReward?: (pointsWon: number) => void;
}

const GRID_SIZE = 8;

interface PieceShape {
  id: number;
  matrix: number[][]; // 2D array of 0 and 1
  color: string;
  used: boolean;
}

const PIECE_TEMPLATES: { matrix: number[][]; color: string; label: string }[] = [
  { matrix: [[1]], color: 'bg-gradient-to-br from-amber-300 to-yellow-500 border border-yellow-100 shadow-md shadow-amber-500/40', label: 'TOPAZ' },
  { matrix: [[1, 1]], color: 'bg-gradient-to-br from-sky-400 to-blue-600 border border-sky-100 shadow-md shadow-blue-500/40', label: 'SAPPHIRE' },
  { matrix: [[1], [1]], color: 'bg-gradient-to-br from-sky-400 to-blue-600 border border-sky-100 shadow-md shadow-blue-500/40', label: 'SAPPHIRE' },
  { matrix: [[1, 1, 1]], color: 'bg-gradient-to-br from-emerald-400 to-teal-600 border border-emerald-100 shadow-md shadow-emerald-500/40', label: 'EMERALD' },
  { matrix: [[1], [1], [1]], color: 'bg-gradient-to-br from-emerald-400 to-teal-600 border border-emerald-100 shadow-md shadow-emerald-500/40', label: 'EMERALD' },
  { matrix: [[1, 1], [1, 1]], color: 'bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-500 border border-white shadow-lg shadow-yellow-500/50', label: 'GOLD' },
  { matrix: [[1, 0], [1, 1]], color: 'bg-gradient-to-br from-purple-400 to-indigo-600 border border-purple-100 shadow-md shadow-purple-500/40', label: 'AMETHYST' },
  { matrix: [[0, 1], [1, 1]], color: 'bg-gradient-to-br from-purple-400 to-indigo-600 border border-purple-100 shadow-md shadow-purple-500/40', label: 'AMETHYST' },
  { matrix: [[1, 1, 1], [0, 1, 0]], color: 'bg-gradient-to-br from-rose-400 to-red-600 border border-rose-100 shadow-md shadow-rose-500/40', label: 'RUBY' },
];

export const BlockPuzzleGame: React.FC<BlockPuzzleGameProps> = ({ onBack, onClaimReward }) => {
  const { t } = useTranslation();

  const [grid, setGrid] = useState<string[][]>(() =>
    Array(GRID_SIZE)
      .fill(null)
      .map(() => Array(GRID_SIZE).fill(''))
  );
  const [pieces, setPieces] = useState<PieceShape[]>([]);
  const [selectedPieceIndex, setSelectedPieceIndex] = useState<number | null>(null);
  const [score, setScore] = useState<number>(0);
  const [linesCleared, setLinesCleared] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('block_puzzle_best_score') || 0);
    } catch {
      return 0;
    }
  });
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(!GameSounds.isSoundMuted());
  const [showRewardModal, setShowRewardModal] = useState<boolean>(false);
  const [rewardAmount, setRewardAmount] = useState<number>(0);
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  const [comboText, setComboText] = useState<string | null>(null);
  const [shakeBoard, setShakeBoard] = useState<boolean>(false);
  const [hoverPos, setHoverPos] = useState<{ r: number; c: number } | null>(null);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    GameSounds.setMuted(!next);
  };

  const generateNewPieces = useCallback((): PieceShape[] => {
    const newPieces: PieceShape[] = [];
    for (let i = 0; i < 3; i++) {
      const template = PIECE_TEMPLATES[Math.floor(Math.random() * PIECE_TEMPLATES.length)];
      newPieces.push({
        id: Date.now() + i,
        matrix: template.matrix,
        color: template.color,
        used: false,
      });
    }
    return newPieces;
  }, []);

  const resetGame = useCallback(() => {
    setGrid(
      Array(GRID_SIZE)
        .fill(null)
        .map(() => Array(GRID_SIZE).fill(''))
    );
    setScore(0);
    setLinesCleared(0);
    setIsGameOver(false);
    setSelectedPieceIndex(null);
    setHoverPos(null);
    setPieces(generateNewPieces());
    GameSounds.playTap();
  }, [generateNewPieces]);

  useEffect(() => {
    resetGame();
  }, [resetGame]);

  // Check if piece fits at (startR, startC)
  const canFitAt = (currentGrid: string[][], matrix: number[][], startR: number, startC: number): boolean => {
    const rows = matrix.length;
    const cols = matrix[0].length;

    if (startR + rows > GRID_SIZE || startC + cols > GRID_SIZE) return false;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (matrix[r][c] === 1) {
          if (currentGrid[startR + r][startC + c] !== '') {
            return false;
          }
        }
      }
    }
    return true;
  };

  // Check if piece can fit anywhere on board
  const canFitAnywhere = (currentGrid: string[][], matrix: number[][]): boolean => {
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (canFitAt(currentGrid, matrix, r, c)) {
          return true;
        }
      }
    }
    return false;
  };

  // Place piece on board at target cell
  const handleCellClick = (targetR: number, targetC: number) => {
    if (selectedPieceIndex === null || isGameOver) return;
    const piece = pieces[selectedPieceIndex];
    if (!piece || piece.used) return;

    if (!canFitAt(grid, piece.matrix, targetR, targetC)) {
      GameSounds.playWrong();
      return;
    }

    // Place piece
    const newGrid = grid.map((row) => [...row]);
    let blockCount = 0;
    for (let r = 0; r < piece.matrix.length; r++) {
      for (let c = 0; c < piece.matrix[0].length; c++) {
        if (piece.matrix[r][c] === 1) {
          newGrid[targetR + r][targetC + c] = piece.color;
          blockCount++;
        }
      }
    }

    // Mark piece as used
    const updatedPieces = [...pieces];
    updatedPieces[selectedPieceIndex].used = true;
    setSelectedPieceIndex(null);
    setHoverPos(null);

    // Check full rows & columns to clear
    const fullRows: number[] = [];
    const fullCols: number[] = [];

    for (let r = 0; r < GRID_SIZE; r++) {
      if (newGrid[r].every((cell) => cell !== '')) fullRows.push(r);
    }
    for (let c = 0; c < GRID_SIZE; c++) {
      let isColFull = true;
      for (let r = 0; r < GRID_SIZE; r++) {
        if (newGrid[r][c] === '') {
          isColFull = false;
          break;
        }
      }
      if (isColFull) fullCols.push(c);
    }

    // Clear lines
    fullRows.forEach((r) => {
      for (let c = 0; c < GRID_SIZE; c++) newGrid[r][c] = '';
    });
    fullCols.forEach((c) => {
      for (let r = 0; r < GRID_SIZE; r++) newGrid[r][c] = '';
    });

    const linesCount = fullRows.length + fullCols.length;
    let pointsGain = blockCount * 10;

    if (linesCount > 0) {
      pointsGain += linesCount * 100 * linesCount;
      setLinesCleared((l) => l + linesCount);
      setComboText(`+${pointsGain} (${linesCount}x LINE CLEAR!) 🔥`);
      setShakeBoard(true);
      setTimeout(() => setShakeBoard(false), 400);
      setTimeout(() => setComboText(null), 1400);
      GameSounds.playCoinRain();
    } else {
      GameSounds.playTap();
    }

    const newScore = score + pointsGain;
    setScore(newScore);
    if (newScore > highScore) {
      setHighScore(newScore);
      try {
        localStorage.setItem('block_puzzle_best_score', String(newScore));
      } catch {}
    }

    setGrid(newGrid);

    let nextPieces = updatedPieces;
    if (updatedPieces.every((p) => p.used)) {
      nextPieces = generateNewPieces();
      setPieces(nextPieces);
    } else {
      setPieces(updatedPieces);
    }

    const availablePieces = nextPieces.filter((p) => !p.used);
    const hasAnyMove = availablePieces.some((p) => canFitAnywhere(newGrid, p.matrix));
    if (!hasAnyMove) {
      setIsGameOver(true);
      GameSounds.playLose();
      if (newScore >= 300) {
        setRewardAmount(Math.min(150, Math.floor(newScore / 10)));
        setTimeout(() => setShowRewardModal(true), 600);
      }
    }
  };

  const claimReward = () => {
    if (onClaimReward && rewardAmount > 0) onClaimReward(rewardAmount);
    setShowRewardModal(false);
  };

  // Check if cell is covered by hover preview
  const isCellHovered = (rIdx: number, cIdx: number) => {
    if (selectedPieceIndex === null || !hoverPos) return false;
    const piece = pieces[selectedPieceIndex];
    if (!piece || piece.used) return false;

    const rowOffset = rIdx - hoverPos.r;
    const colOffset = cIdx - hoverPos.c;

    if (
      rowOffset >= 0 &&
      rowOffset < piece.matrix.length &&
      colOffset >= 0 &&
      colOffset < piece.matrix[0].length
    ) {
      return piece.matrix[rowOffset][colOffset] === 1;
    }
    return false;
  };

  const isHoverValid = () => {
    if (selectedPieceIndex === null || !hoverPos) return false;
    const piece = pieces[selectedPieceIndex];
    if (!piece || piece.used) return false;
    return canFitAt(grid, piece.matrix, hoverPos.r, hoverPos.c);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none pb-12 animate-fade-in">
      <GameHeader
        title={t('games.block.title')}
        subtitle={t('games.block.high_score', { best: highScore })}
        onBack={onBack}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
        onRestart={resetGame}
        restartTooltip={t('games.common.btn_play_again')}
        onHelp={() => setShowTutorial(true)}
      />

      <main className="flex-1 flex flex-col items-center justify-center p-3 max-w-md mx-auto w-full">
        {/* HUD Info Status Bar */}
        <div className="w-full grid grid-cols-3 gap-2 mb-3">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-2 flex flex-col items-center shadow-md">
            <span className="text-[9px] text-slate-400 font-medium uppercase">{t('games.block.score', { score: '' })}</span>
            <span className="font-mono font-black text-amber-400 text-sm">{score}</span>
          </div>
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-2 flex flex-col items-center shadow-md">
            <span className="text-[9px] text-slate-400 font-medium uppercase">{t('games.block.lines_cleared', { lines: '' })}</span>
            <span className="font-mono font-black text-emerald-400 text-sm">{linesCleared}</span>
          </div>
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-2 flex flex-col items-center shadow-md">
            <span className="text-[9px] text-slate-400 font-medium uppercase">{t('games.block.high_score', { best: '' })}</span>
            <span className="font-mono font-black text-yellow-400 text-sm">{highScore}</span>
          </div>
        </div>

        {/* Symmetrical 8x8 Grid Board with Zero Overflow */}
        <div
          className={`relative w-full aspect-square max-w-[360px] bg-slate-900/95 border-2 border-amber-500/50 rounded-3xl p-2.5 shadow-2xl touch-none select-none transition-transform flex flex-col items-center justify-center ${
            shakeBoard ? 'scale-105 rotate-1' : ''
          }`}
          onMouseLeave={() => setHoverPos(null)}
        >
          {comboText && (
            <div className="absolute -top-3.5 inset-x-0 flex justify-center z-30 pointer-events-none animate-bounce">
              <span className="px-4 py-1 bg-gradient-to-r from-amber-500 via-rose-500 to-yellow-400 text-slate-950 font-black text-xs rounded-full shadow-xl border border-yellow-200">
                {comboText}
              </span>
            </div>
          )}

          <div
            className="grid gap-1 sm:gap-1.5 w-full h-full"
            style={{
              gridTemplateColumns: 'repeat(8, minmax(0, 1fr))',
              gridTemplateRows: 'repeat(8, minmax(0, 1fr))',
            }}
          >
            {grid.map((row, rIdx) =>
              row.map((cell, cIdx) => {
                const hovered = isCellHovered(rIdx, cIdx);
                const validPlacement = isHoverValid();

                return (
                  <div
                    key={`${rIdx}-${cIdx}`}
                    onClick={() => handleCellClick(rIdx, cIdx)}
                    onMouseEnter={() => setHoverPos({ r: rIdx, c: cIdx })}
                    className={`w-full h-full aspect-square rounded-lg cursor-pointer transition-all duration-150 relative overflow-hidden flex items-center justify-center ${
                      cell
                        ? `${cell} shadow-md border border-white/40 scale-100`
                        : hovered
                        ? validPlacement
                          ? 'bg-emerald-500/40 border-2 border-emerald-400 animate-pulse'
                          : 'bg-rose-500/40 border-2 border-rose-400'
                        : 'bg-slate-800/40 border border-slate-700/30 hover:bg-slate-700/50'
                    }`}
                  >
                    {cell && (
                      <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent pointer-events-none rounded-t-lg" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {isGameOver && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center p-6 text-center animate-fade-in z-20 border border-red-500/40">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-rose-700 border-2 border-red-300 text-white flex items-center justify-center mb-2 shadow-xl">
                <RotateCcw className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-black text-red-400 mb-1">{t('games.block.game_over')}</h3>
              <p className="text-xs text-slate-300 mb-4">{t('games.block.score', { score })}</p>
              <button
                onClick={resetGame}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black rounded-xl text-sm shadow-lg active:scale-95 transition"
              >
                {t('games.block.btn_new_game')}
              </button>
            </div>
          )}
        </div>

        {/* 3 Available Pieces Tray */}
        <div className="w-full max-w-[360px] grid grid-cols-3 gap-2 mt-4">
          {pieces.map((piece, pIdx) => (
            <div
              key={piece.id}
              onClick={() => !piece.used && setSelectedPieceIndex(pIdx)}
              className={`aspect-square rounded-2xl p-2 flex items-center justify-center border-2 transition cursor-pointer ${
                piece.used
                  ? 'opacity-20 border-slate-800 bg-slate-900/30 cursor-not-allowed'
                  : selectedPieceIndex === pIdx
                  ? 'border-amber-400 bg-amber-500/20 shadow-lg scale-105'
                  : 'border-slate-800 bg-slate-900 hover:border-slate-700 active:scale-95'
              }`}
            >
              {!piece.used && (
                <div
                  className="grid gap-1"
                  style={{
                    gridTemplateRows: `repeat(${piece.matrix.length}, minmax(0, 1fr))`,
                    gridTemplateColumns: `repeat(${piece.matrix[0].length}, minmax(0, 1fr))`,
                  }}
                >
                  {piece.matrix.map((row, r) =>
                    row.map((val, c) => (
                      <div
                        key={`${r}-${c}`}
                        className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-sm ${val === 1 ? piece.color : 'opacity-0'}`}
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <p className="text-[11px] text-slate-400 mt-2 text-center">{t('games.block.subtitle')}</p>
      </main>

      {/* ── REWARD MODAL ── */}
      {showRewardModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-amber-500/50 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl relative overflow-hidden">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center text-3xl mx-auto shadow-xl animate-bounce">
              🏆
            </div>
            <div>
              <h3 className="text-lg font-black text-white">{t('games.common.congratulations')}</h3>
              <p className="text-xs text-slate-400 mt-1">{t('games.block.score', { score })}</p>
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
        gameTitle={t('games.block.title')}
        gameIcon="💎"
        goal={t('games.block.tutorial.goal')}
        controls={t('games.block.tutorial.controls')}
        scoring={t('games.block.tutorial.scoring')}
        tips={t('games.block.tutorial.tips')}
      />
    </div>
  );
};
