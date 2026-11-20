import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Undo2, Lightbulb, Pencil, Eraser, Trophy, Sparkles } from 'lucide-react';
import { GameSounds } from '../../utils/audio';
import { GameHeader } from '../../components/common/GameHeader';
import { GameTutorialModal } from '../../components/common/GameTutorialModal';

export interface SudokuGameProps {
  onBack: () => void;
  onClaimReward?: (pointsWon: number) => void;
}

type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

const DIGIT_MASK = 0x1ff; // 9 bits mask

// Đếm số bit 1
function popCount(m: number): number {
  let n = 0;
  let temp = m;
  while (temp) {
    temp &= temp - 1;
    n++;
  }
  return n;
}

// Xáo trộn mảng ngẫu nhiên
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
  return a;
}

// Lấy chỉ số cung 3x3 (0 đến 8)
function getBoxIdx(pos: number): number {
  const r = Math.floor(pos / 9);
  const c = pos % 9;
  return Math.floor(r / 3) * 3 + Math.floor(c / 3);
}

// 1. Sinh bảng cờ 9x9 hoàn chỉnh hợp lệ bằng quay lui + bitmask
function generateSolvedGrid(): number[] {
  const g = new Array(81).fill(0);
  const rows = new Array(9).fill(0);
  const cols = new Array(9).fill(0);
  const boxes = new Array(9).fill(0);

  function fill(pos: number): boolean {
    if (pos === 81) return true;
    const r = Math.floor(pos / 9);
    const c = pos % 9;
    const b = getBoxIdx(pos);
    const avail = DIGIT_MASK & ~(rows[r] | cols[c] | boxes[b]);
    const digits: number[] = [];
    for (let d = 1; d <= 9; d++) {
      if (avail & (1 << (d - 1))) digits.push(d);
    }
    const shuffled = shuffle(digits);

    for (const d of shuffled) {
      const bit = 1 << (d - 1);
      g[pos] = d;
      rows[r] |= bit;
      cols[c] |= bit;
      boxes[b] |= bit;

      if (fill(pos + 1)) return true;

      g[pos] = 0;
      rows[r] &= ~bit;
      cols[c] &= ~bit;
      boxes[b] &= ~bit;
    }
    return false;
  }

  fill(0);
  return g;
}

// 2. Thuật toán kiểm tra số nghiệm (dừng ngay khi tìm thấy >= 2 nghiệm để tối ưu hiệu năng)
function countSolutions(grid: number[], limit = 2): number {
  const rows = new Array(9).fill(0);
  const cols = new Array(9).fill(0);
  const boxes = new Array(9).fill(0);

  for (let i = 0; i < 81; i++) {
    const v = grid[i];
    if (!v) continue;
    const bit = 1 << (v - 1);
    const r = Math.floor(i / 9);
    const c = i % 9;
    const b = getBoxIdx(i);
    rows[r] |= bit;
    cols[c] |= bit;
    boxes[b] |= bit;
  }

  let found = 0;

  function rec(): void {
    if (found >= limit) return;
    let pick = -1;
    let pickMask = 0;
    let pickCount = 10;

    for (let p = 0; p < 81; p++) {
      if (grid[p]) continue;
      const r2 = Math.floor(p / 9);
      const c2 = p % 9;
      const b2 = getBoxIdx(p);
      const avail = DIGIT_MASK & ~(rows[r2] | cols[c2] | boxes[b2]);
      const n = popCount(avail);
      if (n === 0) return; // Nhánh cụt
      if (n < pickCount) {
        pickCount = n;
        pick = p;
        pickMask = avail;
        if (n === 1) break;
      }
    }

    if (pick < 0) {
      found++;
      return;
    }

    const rr = Math.floor(pick / 9);
    const cc = pick % 9;
    const bb = getBoxIdx(pick);

    for (let d = 1; d <= 9; d++) {
      const bt = 1 << (d - 1);
      if (!(pickMask & bt)) continue;

      grid[pick] = d;
      rows[rr] |= bt;
      cols[cc] |= bt;
      boxes[bb] |= bt;

      rec();

      grid[pick] = 0;
      rows[rr] &= ~bt;
      cols[cc] &= ~bt;
      boxes[bb] &= ~bt;

      if (found >= limit) return;
    }
  }

  rec();
  return found;
}

// 3. Đục lỗ có kiểm soát nghiệm duy nhất
const HOLES_COUNT: Record<Difficulty, number> = {
  EASY: 36, // còn 45 số gợi ý
  MEDIUM: 46, // còn 35 số gợi ý
  HARD: 52, // còn 29 số gợi ý
};

const REWARDS: Record<Difficulty, number> = {
  EASY: 40,
  MEDIUM: 80,
  HARD: 150,
};

export const SudokuGame: React.FC<SudokuGameProps> = ({ onBack, onClaimReward }) => {
  const { t } = useTranslation();

  const [difficulty, setDifficulty] = useState<Difficulty>('EASY');
  const [board, setBoard] = useState<number[]>(new Array(81).fill(0));
  const [initialClues, setInitialClues] = useState<boolean[]>(new Array(81).fill(false));
  const [notes, setNotes] = useState<number[][]>(new Array(81).fill([]));
  const [selectedCell, setSelectedCell] = useState<number>(-1);
  const [isNoteMode, setIsNoteMode] = useState<boolean>(false);
  const [hintsLeft, setHintsLeft] = useState<number>(3);
  const [mistakes, setMistakes] = useState<number>(0);
  const [timer, setTimer] = useState<number>(0);
  const [isWon, setIsWon] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(!GameSounds.isSoundMuted());
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  const [showRewardModal, setShowRewardModal] = useState<boolean>(false);
  const [rewardAmount, setRewardAmount] = useState<number>(0);

  const solutionRef = useRef<number[]>([]);
  const historyRef = useRef<{ board: number[]; notes: number[][] }[]>([]);
  const timerRef = useRef<number | null>(null);

  // Tạo ván cờ mới
  const startNewGame = useCallback((diff: Difficulty) => {
    if (timerRef.current) clearInterval(timerRef.current);

    const fullSolution = generateSolvedGrid();
    solutionRef.current = fullSolution;

    const puzzle = [...fullSolution];
    const order = shuffle(Array.from({ length: 81 }, (_, i) => i));
    const targetHoles = HOLES_COUNT[diff];
    let removed = 0;

    for (const pos of order) {
      if (removed >= targetHoles) break;
      const backup = puzzle[pos];
      puzzle[pos] = 0;

      // Nếu sau khi xóa mà vẫn đảm bảo nghiệm duy nhất -> giữ lại lỗ
      if (countSolutions([...puzzle], 2) === 1) {
        removed++;
      } else {
        // Nếu tạo ra đa nghiệm -> hoàn lại giá trị
        puzzle[pos] = backup;
      }
    }

    const fixed = puzzle.map((v) => v > 0);
    setBoard(puzzle);
    setInitialClues(fixed);
    setNotes(new Array(81).fill([]));
    setSelectedCell(-1);
    setMistakes(0);
    setHintsLeft(3);
    setTimer(0);
    setIsWon(false);
    setShowRewardModal(false);
    historyRef.current = [];

    // Bắt đầu tính giờ
    timerRef.current = window.setInterval(() => {
      setTimer((prev) => prev + 1);
    }, 1000);
  }, []);

  useEffect(() => {
    startNewGame(difficulty);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [difficulty, startNewGame]);

  // Kiểm tra xung đột (hàng, cột, hoặc 3x3 trùng số)
  const getConflicts = useCallback(() => {
    const bad = new Set<number>();
    for (let i = 0; i < 81; i++) {
      const v = board[i];
      if (!v) continue;
      const ri = Math.floor(i / 9);
      const ci = i % 9;
      const bi = getBoxIdx(i);

      for (let j = i + 1; j < 81; j++) {
        if (board[j] !== v) continue;
        const rj = Math.floor(j / 9);
        const cj = j % 9;
        const bj = getBoxIdx(j);

        if (ri === rj || ci === cj || bi === bj) {
          bad.add(i);
          bad.add(j);
        }
      }
    }
    return bad;
  }, [board]);

  const conflicts = getConflicts();

  // Kiểm tra chiến thắng
  const checkWin = (currentBoard: number[]) => {
    // Phải lấp đầy 81 ô
    for (let i = 0; i < 81; i++) {
      if (currentBoard[i] === 0) return;
    }

    // Không còn bất kỳ xung đột nào
    for (let i = 0; i < 81; i++) {
      if (currentBoard[i] !== solutionRef.current[i]) return;
    }

    // CHIẾN THẮNG!
    setIsWon(true);
    if (timerRef.current) clearInterval(timerRef.current);
    GameSounds.playWinFanfare();

    const timeBonus = Math.max(0, 300 - timer);
    const earned = REWARDS[difficulty] + Math.floor(timeBonus / 10);
    setRewardAmount(earned);
    setTimeout(() => setShowRewardModal(true), 600);
  };

  // Điền số hoặc ghi chú
  const handleInputNumber = (num: number) => {
    if (selectedCell < 0 || initialClues[selectedCell] || isWon) return;

    // Lưu lịch sử để Hoàn tác
    historyRef.current.push({
      board: [...board],
      notes: notes.map((n) => [...n]),
    });

    if (isNoteMode) {
      // Chế độ Ghi chú (Pencil)
      setNotes((prevNotes) => {
        const nextNotes = prevNotes.map((n) => [...n]);
        const currentList = nextNotes[selectedCell];
        if (currentList.includes(num)) {
          nextNotes[selectedCell] = currentList.filter((x) => x !== num);
        } else {
          nextNotes[selectedCell] = [...currentList, num].sort();
        }
        return nextNotes;
      });
      GameSounds.playTap();
    } else {
      // Chế độ Điền số chính thức
      const nextBoard = [...board];
      const isErasing = nextBoard[selectedCell] === num;
      nextBoard[selectedCell] = isErasing ? 0 : num;

      // Xóa ghi chú ô hiện tại khi đã điền số
      const nextNotes = notes.map((n) => [...n]);
      nextNotes[selectedCell] = [];

      // Kiểm tra xem số điền vào có đúng với lời giải không
      if (!isErasing && num !== solutionRef.current[selectedCell]) {
        setMistakes((m) => m + 1);
        GameSounds.playWrong();
      } else {
        GameSounds.playCoinPickup(1.1);
      }

      setBoard(nextBoard);
      setNotes(nextNotes);
      checkWin(nextBoard);
    }
  };

  // Nút Xóa ô
  const handleErase = () => {
    if (selectedCell < 0 || initialClues[selectedCell] || isWon) return;
    if (board[selectedCell] === 0 && notes[selectedCell].length === 0) return;

    historyRef.current.push({
      board: [...board],
      notes: notes.map((n) => [...n]),
    });

    const nextBoard = [...board];
    nextBoard[selectedCell] = 0;
    const nextNotes = notes.map((n) => [...n]);
    nextNotes[selectedCell] = [];

    setBoard(nextBoard);
    setNotes(nextNotes);
    GameSounds.playTap();
  };

  // Nút Hoàn tác (Undo)
  const handleUndo = () => {
    if (historyRef.current.length === 0 || isWon) return;
    const prev = historyRef.current.pop()!;
    setBoard(prev.board);
    setNotes(prev.notes);
    GameSounds.playTap();
  };

  // Nút Gợi ý (Hint)
  const handleHint = () => {
    if (hintsLeft <= 0 || isWon) return;

    // Tìm các ô trống chưa điền
    const emptyIndices: number[] = [];
    for (let i = 0; i < 81; i++) {
      if (board[i] === 0 || board[i] !== solutionRef.current[i]) {
        emptyIndices.push(i);
      }
    }

    if (emptyIndices.length === 0) return;

    const targetIdx = selectedCell >= 0 && (board[selectedCell] === 0 || board[selectedCell] !== solutionRef.current[selectedCell])
      ? selectedCell
      : emptyIndices[Math.floor(Math.random() * emptyIndices.length)];

    historyRef.current.push({
      board: [...board],
      notes: notes.map((n) => [...n]),
    });

    const nextBoard = [...board];
    nextBoard[targetIdx] = solutionRef.current[targetIdx];
    const nextNotes = notes.map((n) => [...n]);
    nextNotes[targetIdx] = [];

    setBoard(nextBoard);
    setNotes(nextNotes);
    setSelectedCell(targetIdx);
    setHintsLeft((h) => h - 1);
    GameSounds.playPowerUp();
    checkWin(nextBoard);
  };

  // Hỗ trợ phím bàn phím PC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isWon) return;
      if (e.key >= '1' && e.key <= '9') {
        handleInputNumber(parseInt(e.key, 10));
      } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        handleErase();
      } else if (e.key === 'ArrowUp' && selectedCell >= 9) {
        setSelectedCell((c) => c - 9);
      } else if (e.key === 'ArrowDown' && selectedCell < 72) {
        setSelectedCell((c) => c + 9);
      } else if (e.key === 'ArrowLeft' && selectedCell % 9 > 0) {
        setSelectedCell((c) => c - 1);
      } else if (e.key === 'ArrowRight' && selectedCell % 9 < 8) {
        setSelectedCell((c) => c + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, isWon, isNoteMode, board, initialClues]);

  // Thông tin ô đang chọn
  const selRow = selectedCell >= 0 ? Math.floor(selectedCell / 9) : -1;
  const selCol = selectedCell >= 0 ? selectedCell % 9 : -1;
  const selBox = selectedCell >= 0 ? getBoxIdx(selectedCell) : -1;
  const selValue = selectedCell >= 0 ? board[selectedCell] : 0;

  // Định dạng thời gian
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      style={{ touchAction: 'manipulation' }}
      className="relative flex flex-col h-[100dvh] w-full max-w-[430px] mx-auto bg-slate-950 select-none overflow-hidden overscroll-none"
    >
      {/* ── 1. PINNED GAME HEADER ── */}
      <GameHeader
        title={t('games.sudoku.title', 'Sudoku Trí Tuệ')}
        subtitle={`${t(`games.sudoku.diff_${difficulty.toLowerCase()}`, difficulty)} • ${formatTime(timer)} • 9×9`}
        onBack={onBack}
        soundEnabled={soundEnabled}
        onToggleSound={() => {
          GameSounds.toggleMute();
          setSoundEnabled(!GameSounds.isSoundMuted());
        }}
        onRestart={() => startNewGame(difficulty)}
        onHelp={() => setShowTutorial(true)}
      />

      {/* ── 2. HUD STATUS BAR ── */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/90 border-b border-slate-800/80 z-10 shrink-0">
        {/* Chọn độ khó */}
        <div className="flex gap-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800/70">
          {(['EASY', 'MEDIUM', 'HARD'] as Difficulty[]).map((d) => (
            <button
              key={d}
              onClick={() => {
                setDifficulty(d);
                startNewGame(d);
              }}
              className={`px-2 py-0.5 rounded-lg text-xs font-bold transition ${
                difficulty === d
                  ? 'bg-sky-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t(`games.sudoku.diff_${d.toLowerCase()}`, d)}
            </button>
          ))}
        </div>

        {/* Lỗi sai */}
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
          <span>{t('games.sudoku.mistakes', 'Lỗi')}:</span>
          <span className={`font-mono ${mistakes > 0 ? 'text-rose-400 font-black' : 'text-slate-300'}`}>
            {mistakes}
          </span>
        </div>

        {/* Thời gian */}
        <div className="flex items-center gap-1 bg-slate-950/80 px-2.5 py-1 rounded-xl border border-slate-800">
          <span className="text-xs">⏱️</span>
          <span className="text-xs font-black font-mono text-sky-400">{formatTime(timer)}</span>
        </div>
      </div>

      {/* ── 3. CHÍNH: BÀN CỜ SUDOKU 9x9 ── */}
      <div className="flex-1 flex items-center justify-center p-2 overflow-hidden">
        <div
          className="grid grid-cols-9 grid-rows-9 gap-0 bg-slate-800 border-2 border-slate-600 rounded-2xl overflow-hidden shadow-2xl"
          style={{
            width: 'min(360px, 92vw)',
            height: 'min(360px, 92vw)',
          }}
        >
          {board.map((val, idx) => {
            const r = Math.floor(idx / 9);
            const c = idx % 9;
            const b = getBoxIdx(idx);

            const isInitial = initialClues[idx];
            const isSelected = idx === selectedCell;
            const isPeer = selectedCell >= 0 && (r === selRow || c === selCol || b === selBox);
            const isSameNum = val > 0 && selValue > 0 && val === selValue;
            const isConflict = conflicts.has(idx);

            // Đường viền 3x3 đậm
            const borderRight = c % 3 === 2 && c !== 8 ? 'border-r-2 border-r-slate-400/80' : 'border-r border-r-slate-800/80';
            const borderBottom = r % 3 === 2 && r !== 8 ? 'border-b-2 border-b-slate-400/80' : 'border-b border-b-slate-800/80';

            return (
              <button
                key={idx}
                onClick={() => {
                  setSelectedCell(idx);
                  GameSounds.playTap();
                }}
                className={`relative flex items-center justify-center font-bold transition-colors select-none ${borderRight} ${borderBottom} ${
                  isSelected
                    ? 'bg-sky-500/50 shadow-inner'
                    : isConflict
                    ? 'bg-rose-950/80'
                    : isSameNum
                    ? 'bg-sky-500/25'
                    : isPeer
                    ? 'bg-slate-800/70'
                    : 'bg-slate-900/90'
                }`}
              >
                {val > 0 ? (
                  <span
                    className={`text-base sm:text-lg font-black ${
                      isConflict
                        ? 'text-rose-400 animate-pulse'
                        : isInitial
                        ? 'text-white'
                        : 'text-sky-300'
                    }`}
                  >
                    {val}
                  </span>
                ) : notes[idx].length > 0 ? (
                  /* Lưới ghi chú bút chì 3x3 */
                  <div className="grid grid-cols-3 grid-rows-3 w-full h-full p-0.5 pointer-events-none">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                      <span
                        key={n}
                        className="text-[8px] sm:text-[9px] font-semibold text-slate-400 flex items-center justify-center leading-none"
                      >
                        {notes[idx].includes(n) ? n : ''}
                      </span>
                    ))}
                  </div>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 4. THANH CÔNG CỤ ĐIỀU KHIỂN (Undo, Erase, Notes, Hint) ── */}
      <div className="flex items-center justify-around px-4 py-2 bg-slate-900/60 border-t border-slate-800/60 shrink-0">
        {/* Nút Hoàn tác */}
        <button
          onClick={handleUndo}
          className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-200 active:scale-95 transition"
        >
          <div className="w-10 h-10 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center">
            <Undo2 size={18} />
          </div>
          <span className="text-[10px] font-bold">{t('games.sudoku.undo', 'Hoàn tác')}</span>
        </button>

        {/* Nút Xóa */}
        <button
          onClick={handleErase}
          className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-200 active:scale-95 transition"
        >
          <div className="w-10 h-10 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center">
            <Eraser size={18} />
          </div>
          <span className="text-[10px] font-bold">{t('games.sudoku.erase', 'Xóa')}</span>
        </button>

        {/* Bật/Tắt Ghi chú bút chì */}
        <button
          onClick={() => {
            setIsNoteMode((m) => !m);
            GameSounds.playTap();
          }}
          className={`flex flex-col items-center gap-1 transition ${
            isNoteMode ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center border transition ${
              isNoteMode
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/30'
                : 'bg-slate-800/80 border-slate-700/80'
            }`}
          >
            <Pencil size={18} />
          </div>
          <span className="text-[10px] font-bold">
            {t('games.sudoku.notes', 'Ghi chú')} ({isNoteMode ? 'BẬT' : 'TẮT'})
          </span>
        </button>

        {/* Nút Gợi ý */}
        <button
          onClick={handleHint}
          disabled={hintsLeft <= 0}
          className={`flex flex-col items-center gap-1 transition ${
            hintsLeft > 0 ? 'text-slate-400 hover:text-slate-200 active:scale-95' : 'opacity-40 cursor-not-allowed text-slate-600'
          }`}
        >
          <div className="relative w-10 h-10 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center">
            <Lightbulb size={18} className={hintsLeft > 0 ? 'text-amber-400' : ''} />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black flex items-center justify-center">
              {hintsLeft}
            </span>
          </div>
          <span className="text-[10px] font-bold">{t('games.sudoku.hint', 'Gợi ý')}</span>
        </button>
      </div>

      {/* ── 5. BÀN PHÍM SỐ ẢO (1 - 9) ── */}
      <div className="grid grid-cols-9 gap-1 px-3 py-3 bg-slate-900 border-t border-slate-800 shrink-0">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <button
            key={n}
            onClick={() => handleInputNumber(n)}
            className="h-12 rounded-xl bg-slate-800/90 border border-slate-700/80 text-sky-400 hover:text-sky-200 hover:bg-slate-700 active:scale-95 transition flex items-center justify-center font-black text-lg shadow"
          >
            {n}
          </button>
        ))}
      </div>

      {/* ── 6. POPUP NHẬN THƯỞNG CHIẾN THẮNG ── */}
      {showRewardModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-sky-500/40 rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl relative overflow-hidden">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-400 flex items-center justify-center shadow-lg shadow-sky-500/30">
              <Trophy size={36} className="text-slate-950 fill-current" />
            </div>

            <h3 className="text-xl font-black text-white mb-1">
              {t('games.sudoku.win_title', 'GIẢI MÃ HOÀN TẤT!')}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              {t('games.sudoku.win_desc', { time: formatTime(timer), mistakes })}
            </p>

            <div className="bg-slate-950/70 border border-sky-500/30 rounded-2xl p-4 mb-5">
              <span className="text-xs text-sky-400 font-bold block mb-1">
                {t('games.sudoku.reward_label', 'Phần Thưởng Điểm Tích Lũy')}
              </span>
              <div className="flex items-center justify-center gap-1.5 text-2xl font-black text-amber-300">
                <Sparkles size={22} className="text-amber-400 fill-current animate-pulse" />
                <span>+{rewardAmount} 🪙</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => startNewGame(difficulty)}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition border border-slate-700"
              >
                {t('common.play_again', 'Chơi ván mới')}
              </button>
              <button
                onClick={() => {
                  if (onClaimReward) onClaimReward(rewardAmount);
                  setShowRewardModal(false);
                }}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 text-white font-black text-xs transition shadow-lg shadow-sky-500/30"
              >
                {t('common.claim_reward', 'Nhận thưởng')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 7. GAME TUTORIAL MODAL ── */}
      <GameTutorialModal
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
        gameTitle={t('games.sudoku.title', 'Sudoku Trí Tuệ')}
        gameIcon={<span>🔢</span>}
        goal={t(
          'games.sudoku.tut_goal',
          'Điền các chữ số từ 1 đến 9 vào tất cả các ô sao cho mỗi hàng, mỗi cột và mỗi khối 3×3 đều chứa đủ 9 số không trùng lặp.'
        )}
        controls={t(
          'games.sudoku.tut_ctrl',
          'Chạm vào ô cần điền trên bàn cờ, sau đó chọn số từ bàn phím số phía dưới. Bật "Ghi chú" để lưu tạm các số khả dĩ.'
        )}
        scoring={t(
          'games.sudoku.tut_score',
          'Độ khó Dễ (+40đ), Vừa (+80đ), Khó (+150đ). Giải càng nhanh càng nhận được thêm điểm thưởng thời gian.'
        )}
        tips={t(
          'games.sudoku.tut_tips',
          '100% ván cờ đều có duy nhất 1 đáp án logic! Hãy tận dụng ô tô màu các số giống nhau để loại trừ khả năng nhanh chóng.'
        )}
      />
    </div>
  );
};
