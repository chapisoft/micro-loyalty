import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Flag, Shovel, Trophy, Sparkles } from 'lucide-react';
import { GameSounds } from '../../utils/audio';
import { GameHeader } from '../../components/common/GameHeader';
import { GameTutorialModal } from '../../components/common/GameTutorialModal';

export interface MinesweeperGameProps {
  onBack: () => void;
  onClaimReward?: (pointsWon: number) => void;
}

type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
type CellState = 'CLOSED' | 'OPEN' | 'FLAG';

interface Cell {
  x: number;
  y: number;
  mine: boolean;
  adj: number;
  state: CellState;
  isHit?: boolean;
  isWrongFlag?: boolean;
}

interface DifficultyConfig {
  cols: number;
  rows: number;
  mines: number;
  cellSize: number;
  rewardBase: number;
}

const CONFIGS: Record<Difficulty, DifficultyConfig> = {
  EASY: { cols: 9, rows: 9, mines: 10, cellSize: 34, rewardBase: 35 },
  MEDIUM: { cols: 12, rows: 12, mines: 22, cellSize: 26, rewardBase: 70 },
  HARD: { cols: 14, rows: 14, mines: 38, cellSize: 22, rewardBase: 120 },
};

const NUMBER_COLORS: Record<number, string> = {
  1: '#60A5FA', // Blue
  2: '#4ADE80', // Green
  3: '#F87171', // Red
  4: '#C084FC', // Purple
  5: '#FBBF24', // Amber
  6: '#2DD4BF', // Teal
  7: '#F472B6', // Pink
  8: '#E2E8F0', // Light slate
};

export const MinesweeperGame: React.FC<MinesweeperGameProps> = ({ onBack, onClaimReward }) => {
  const { t } = useTranslation();

  const [difficulty, setDifficulty] = useState<Difficulty>('EASY');
  const [grid, setGrid] = useState<Cell[]>([]);
  const [mode, setMode] = useState<'DIG' | 'FLAG'>('DIG');
  const [status, setStatus] = useState<'IDLE' | 'PLAYING' | 'WON' | 'LOST'>('IDLE');
  const [flagsCount, setFlagsCount] = useState<number>(0);
  const [timer, setTimer] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(!GameSounds.isSoundMuted());
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  const [showRewardModal, setShowRewardModal] = useState<boolean>(false);
  const [rewardAmount, setRewardAmount] = useState<number>(0);

  const timerRef = useRef<number | null>(null);
  const firstClickRef = useRef<boolean>(true);
  const longPressTimerRef = useRef<number | null>(null);
  const longPressedRef = useRef<boolean>(false);
  const currentDiffRef = useRef<DifficultyConfig>(CONFIGS.EASY);

  currentDiffRef.current = CONFIGS[difficulty];

  // Helper index
  const getIdx = (x: number, y: number, cols: number) => y * cols + x;

  // Lấy các ô lân cận (tối đa 8 ô)
  const getNeighbors = (x: number, y: number, cols: number, rows: number): [number, number][] => {
    const list: [number, number][] = [];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
          list.push([nx, ny]);
        }
      }
    }
    return list;
  };

  // Khởi tạo bàn cờ mới
  const initBoard = useCallback((diff: Difficulty) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const cfg = CONFIGS[diff];
    const newGrid: Cell[] = [];
    for (let y = 0; y < cfg.rows; y++) {
      for (let x = 0; x < cfg.cols; x++) {
        newGrid.push({
          x,
          y,
          mine: false,
          adj: 0,
          state: 'CLOSED',
        });
      }
    }
    setGrid(newGrid);
    setStatus('IDLE');
    setFlagsCount(0);
    setTimer(0);
    firstClickRef.current = true;
    setShowRewardModal(false);
  }, []);

  useEffect(() => {
    initBoard(difficulty);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [difficulty, initBoard]);

  // Bộ đếm thời gian
  useEffect(() => {
    if (status === 'PLAYING') {
      timerRef.current = window.setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

  // Rải mìn đảm bảo First-Click-Safe 100%
  const placeMines = (safeX: number, safeY: number, initialGrid: Cell[], cfg: DifficultyConfig): Cell[] => {
    const workingGrid = initialGrid.map((c) => ({ ...c }));
    const bannedSet = new Set<number>();
    bannedSet.add(getIdx(safeX, safeY, cfg.cols));

    // Cấm mìn ở cả 8 ô xung quanh ô click đầu tiên
    getNeighbors(safeX, safeY, cfg.cols, cfg.rows).forEach(([nx, ny]) => {
      bannedSet.add(getIdx(nx, ny, cfg.cols));
    });

    let placed = 0;
    const totalCells = cfg.cols * cfg.rows;
    while (placed < cfg.mines) {
      const randIdx = Math.floor(Math.random() * totalCells);
      if (bannedSet.has(randIdx) || workingGrid[randIdx].mine) continue;
      workingGrid[randIdx].mine = true;
      placed++;
    }

    // Tính toán số lượng mìn lân cận (adj)
    for (let y = 0; y < cfg.rows; y++) {
      for (let x = 0; x < cfg.cols; x++) {
        const c = workingGrid[getIdx(x, y, cfg.cols)];
        c.adj = 0;
        getNeighbors(x, y, cfg.cols, cfg.rows).forEach(([nx, ny]) => {
          if (workingGrid[getIdx(nx, ny, cfg.cols)].mine) {
            c.adj++;
          }
        });
      }
    }

    return workingGrid;
  };

  // Cắm / Bỏ cờ 🚩
  const toggleFlag = (x: number, y: number) => {
    if (status === 'WON' || status === 'LOST') return;
    const cfg = currentDiffRef.current;
    const idx = getIdx(x, y, cfg.cols);

    setGrid((prevGrid) => {
      const cell = prevGrid[idx];
      if (cell.state === 'OPEN') return prevGrid;

      const nextGrid = [...prevGrid];
      let nextFlags = flagsCount;

      if (cell.state === 'FLAG') {
        nextGrid[idx] = { ...cell, state: 'CLOSED' };
        nextFlags--;
      } else {
        nextGrid[idx] = { ...cell, state: 'FLAG' };
        nextFlags++;
        GameSounds.playTap();
      }

      setFlagsCount(nextFlags);
      return nextGrid;
    });
  };

  // Mở ô (Reveal)
  const revealCell = (x: number, y: number) => {
    if (status === 'WON' || status === 'LOST') return;
    const cfg = currentDiffRef.current;
    let workingGrid = grid;

    // Lần chạm đầu tiên -> Kích hoạt First-Click-Safe
    if (firstClickRef.current) {
      firstClickRef.current = false;
      workingGrid = placeMines(x, y, grid, cfg);
      setStatus('PLAYING');
    }

    const idx = getIdx(x, y, cfg.cols);
    const targetCell = workingGrid[idx];

    // Không mở ô đã cắm cờ hoặc đã mở
    if (targetCell.state === 'FLAG' || targetCell.state === 'OPEN') return;

    // NỔ MÌN -> THUA CUỘC
    if (targetCell.mine) {
      handleGameOver(workingGrid, x, y);
      return;
    }

    // Mở ô an toàn bằng Flood Fill
    const nextGrid = workingGrid.map((c) => ({ ...c }));
    const stack: [number, number][] = [[x, y]];

    while (stack.length > 0) {
      const [cx, cy] = stack.pop()!;
      const cIdx = getIdx(cx, cy, cfg.cols);
      const cell = nextGrid[cIdx];

      if (cell.state === 'OPEN' || cell.state === 'FLAG') continue;

      cell.state = 'OPEN';

      // Nếu ô có 0 mìn lân cận, lan truyền mở tiếp các ô xung quanh
      if (cell.adj === 0 && !cell.mine) {
        getNeighbors(cx, cy, cfg.cols, cfg.rows).forEach(([nx, ny]) => {
          const nCell = nextGrid[getIdx(nx, ny, cfg.cols)];
          if (nCell.state !== 'OPEN') {
            stack.push([nx, ny]);
          }
        });
      }
    }

    GameSounds.playCoinPickup(1.0);
    setGrid(nextGrid);
    checkWinCondition(nextGrid, cfg);
  };

  // Chord Click: Khi nhấn vào ô đã mở có số, nếu đã cắm đủ cờ xung quanh -> tự mở các ô còn lại
  const handleChord = (x: number, y: number) => {
    if (status !== 'PLAYING') return;
    const cfg = currentDiffRef.current;
    const cell = grid[getIdx(x, y, cfg.cols)];
    if (cell.state !== 'OPEN' || cell.adj === 0) return;

    const neighbors = getNeighbors(x, y, cfg.cols, cfg.rows);
    const flaggedCount = neighbors.filter(([nx, ny]) => grid[getIdx(nx, ny, cfg.cols)].state === 'FLAG').length;

    if (flaggedCount !== cell.adj) return;

    let hitMine = false;
    let hitCoords: [number, number] = [0, 0];

    // Kiểm tra xem có mở trúng mìn do cắm cờ sai không
    for (const [nx, ny] of neighbors) {
      const nCell = grid[getIdx(nx, ny, cfg.cols)];
      if (nCell.state === 'CLOSED' && nCell.mine) {
        hitMine = true;
        hitCoords = [nx, ny];
        break;
      }
    }

    if (hitMine) {
      handleGameOver(grid, hitCoords[0], hitCoords[1]);
      return;
    }

    // Mở an toàn tất cả các ô lân cận chưa cắm cờ
    const nextGrid = grid.map((c) => ({ ...c }));
    neighbors.forEach(([nx, ny]) => {
      const nCell = nextGrid[getIdx(nx, ny, cfg.cols)];
      if (nCell.state === 'CLOSED') {
        nCell.state = 'OPEN';
        if (nCell.adj === 0) {
          // Lan tiếp nếu gặp 0
          getNeighbors(nx, ny, cfg.cols, cfg.rows).forEach(([nnx, nny]) => {
            const nnCell = nextGrid[getIdx(nnx, nny, cfg.cols)];
            if (nnCell.state === 'CLOSED') nnCell.state = 'OPEN';
          });
        }
      }
    });

    GameSounds.playCoinPickup(1.2);
    setGrid(nextGrid);
    checkWinCondition(nextGrid, cfg);
  };

  // Kiểm tra điều kiện chiến thắng
  const checkWinCondition = (currentGrid: Cell[], cfg: DifficultyConfig) => {
    let openedCount = 0;
    for (const c of currentGrid) {
      if (c.state === 'OPEN') openedCount++;
    }

    const targetOpened = cfg.cols * cfg.rows - cfg.mines;
    if (openedCount === targetOpened) {
      setStatus('WON');
      GameSounds.playWinFanfare();

      // Tự động cắm cờ toàn bộ các ô mìn còn lại
      const finalGrid = currentGrid.map((c) => {
        if (c.mine) return { ...c, state: 'FLAG' as CellState };
        return c;
      });
      setGrid(finalGrid);
      setFlagsCount(cfg.mines);

      // Tính điểm thưởng
      const timeBonus = Math.max(0, 180 - timer);
      const earned = cfg.rewardBase + Math.floor(timeBonus / 5);
      setRewardAmount(earned);
      setTimeout(() => setShowRewardModal(true), 600);
    }
  };

  // Xử lý thua trận nổ mìn
  const handleGameOver = (currentGrid: Cell[], hitX: number, hitY: number) => {
    setStatus('LOST');
    GameSounds.playTowerCrash();

    const hitIdx = getIdx(hitX, hitY, currentDiffRef.current.cols);
    const revealedGrid = currentGrid.map((c, i) => {
      if (c.mine) {
        return {
          ...c,
          state: 'OPEN' as CellState,
          isHit: i === hitIdx,
        };
      }
      if (c.state === 'FLAG' && !c.mine) {
        return {
          ...c,
          isWrongFlag: true,
        };
      }
      return c;
    });

    setGrid(revealedGrid);
  };

  // Nhấn chạm chuột / màn hình
  const handleCellClick = (x: number, y: number) => {
    if (longPressedRef.current) {
      longPressedRef.current = false;
      return;
    }

    const cfg = currentDiffRef.current;
    const cell = grid[getIdx(x, y, cfg.cols)];

    if (cell.state === 'OPEN') {
      handleChord(x, y);
      return;
    }

    if (mode === 'FLAG') {
      toggleFlag(x, y);
    } else {
      revealCell(x, y);
    }
  };

  // Hỗ trợ nhấn giữ (Long Press) để cắm cờ trên màn hình cảm ứng
  const handleTouchStart = (x: number, y: number) => {
    longPressedRef.current = false;
    longPressTimerRef.current = window.setTimeout(() => {
      longPressedRef.current = true;
      toggleFlag(x, y);
    }, 350);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const remainingMines = CONFIGS[difficulty].mines - flagsCount;

  return (
    <div
      style={{ touchAction: 'manipulation' }}
      className="relative flex flex-col h-[100dvh] w-full max-w-[430px] mx-auto bg-slate-950 select-none overflow-hidden overscroll-none"
    >
      {/* ── 1. PINNED GAME HEADER ── */}
      <GameHeader
        title={t('games.minesweeper.title', 'Dò Mìn Chiến Thuật')}
        subtitle={`${t(`games.minesweeper.diff_${difficulty.toLowerCase()}`, difficulty)} • ${CONFIGS[difficulty].cols}×${CONFIGS[difficulty].rows} • ${CONFIGS[difficulty].mines} 💣`}
        onBack={onBack}
        soundEnabled={soundEnabled}
        onToggleSound={() => {
          GameSounds.toggleMute();
          setSoundEnabled(!GameSounds.isSoundMuted());
        }}
        onRestart={() => initBoard(difficulty)}
        onHelp={() => setShowTutorial(true)}
      />

      {/* ── 2. HUD STATUS BAR ── */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/90 border-b border-slate-800/80 z-10 shrink-0">
        <div className="flex items-center gap-1.5 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
          <span className="text-base">💣</span>
          <span className={`text-base font-black font-mono ${remainingMines < 0 ? 'text-rose-400' : 'text-amber-400'}`}>
            {String(remainingMines).padStart(2, '0')}
          </span>
        </div>

        {/* Nút mặt cười cảm xúc */}
        <button
          onClick={() => initBoard(difficulty)}
          className="w-10 h-10 rounded-xl bg-slate-800/90 border border-slate-700 flex items-center justify-center text-xl hover:bg-slate-700 active:scale-95 transition shadow-inner"
        >
          {status === 'WON' ? '😎' : status === 'LOST' ? '😵' : status === 'PLAYING' ? '🙂' : '😐'}
        </button>

        <div className="flex items-center gap-1.5 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
          <span className="text-base">⏱️</span>
          <span className="text-base font-black font-mono text-sky-400">
            {String(timer).padStart(3, '0')}s
          </span>
        </div>
      </div>

      {/* ── 3. TOOLBAR CHỌN ĐỘ KHÓ & CHẾ ĐỘ THAO TÁC ── */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/40 border-b border-slate-800/40 z-10">
        {/* Chọn độ khó */}
        <div className="flex gap-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800/70">
          {(['EASY', 'MEDIUM', 'HARD'] as Difficulty[]).map((d) => (
            <button
              key={d}
              onClick={() => {
                setDifficulty(d);
                initBoard(d);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                difficulty === d
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t(`games.minesweeper.diff_${d.toLowerCase()}`, d)}
            </button>
          ))}
        </div>

        {/* Chuyển đổi Đào ⛏️ / Cắm cờ 🚩 */}
        <button
          onClick={() => {
            const nextMode = mode === 'DIG' ? 'FLAG' : 'DIG';
            setMode(nextMode);
            GameSounds.playTap();
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition border shadow-sm ${
            mode === 'FLAG'
              ? 'bg-rose-500 text-white border-rose-400 shadow-rose-900/40 animate-pulse'
              : 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-900/40'
          }`}
        >
          {mode === 'FLAG' ? (
            <>
              <Flag size={14} className="fill-current" />
              <span>{t('games.minesweeper.mode_flag', 'CẮM CỜ')}</span>
            </>
          ) : (
            <>
              <Shovel size={14} />
              <span>{t('games.minesweeper.mode_dig', 'ĐÀO Ô')}</span>
            </>
          )}
        </button>
      </div>

      {/* ── 4. CHÍNH: BÀN CỜ DÒ MÌN TRUNG TÂM ── */}
      <div className="flex-1 flex items-center justify-center p-2 overflow-auto">
        <div
          className="grid gap-[2px] p-2 rounded-2xl bg-slate-900/80 border-2 border-slate-800 shadow-2xl touch-manipulation"
          style={{
            gridTemplateColumns: `repeat(${CONFIGS[difficulty].cols}, minmax(0, 1fr))`,
            width: `${CONFIGS[difficulty].cols * (CONFIGS[difficulty].cellSize + 2) + 16}px`,
            maxWidth: '100%',
          }}
        >
          {grid.map((cell) => {
            const isOpen = cell.state === 'OPEN';
            const isFlag = cell.state === 'FLAG';
            const num = cell.adj;

            return (
              <button
                key={`${cell.x}-${cell.y}`}
                onClick={() => handleCellClick(cell.x, cell.y)}
                onTouchStart={() => handleTouchStart(cell.x, cell.y)}
                onTouchEnd={handleTouchEnd}
                onContextMenu={(e) => {
                  e.preventDefault();
                  toggleFlag(cell.x, cell.y);
                }}
                style={{
                  height: `${CONFIGS[difficulty].cellSize}px`,
                }}
                className={`flex items-center justify-center font-black rounded transition-all select-none ${
                  isOpen
                    ? cell.mine
                      ? cell.isHit
                        ? 'bg-rose-600 text-white animate-bounce'
                        : 'bg-slate-950 text-white border border-rose-900/60'
                      : 'bg-slate-950/70 border border-slate-900/60'
                    : isFlag
                    ? 'bg-slate-800 border-t-2 border-l-2 border-slate-600 border-b-2 border-r-2 border-slate-950'
                    : 'bg-slate-700/90 border-t-2 border-l-2 border-slate-500 border-b-2 border-r-2 border-slate-900 active:scale-95 hover:bg-slate-600'
                }`}
              >
                {isOpen ? (
                  cell.mine ? (
                    <span className="text-sm">💣</span>
                  ) : num > 0 ? (
                    <span
                      style={{
                        color: NUMBER_COLORS[num] || '#FFFFFF',
                        fontSize: `${Math.max(12, CONFIGS[difficulty].cellSize * 0.55)}px`,
                      }}
                      className="drop-shadow"
                    >
                      {num}
                    </span>
                  ) : null
                ) : isFlag ? (
                  <span className="text-xs">🚩</span>
                ) : cell.isWrongFlag ? (
                  <span className="text-xs text-rose-500 font-bold">❌</span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 5. THANH HƯỚNG DẪN NHANH DƯỚI ĐÁY ── */}
      <div className="px-4 py-2 bg-slate-900/60 border-t border-slate-800/80 text-center text-[11px] text-slate-400 shrink-0">
        <span>{t('games.minesweeper.hint_footer', '👉 Nhấn giữ để cắm cờ • Chạm ô số để mở nhanh các ô lân cận')}</span>
      </div>

      {/* ── 6. POPUP NHẬN THƯỞNG CHIẾN THẮNG ── */}
      {showRewardModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl relative overflow-hidden">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Trophy size={36} className="text-slate-950 fill-current" />
            </div>

            <h3 className="text-xl font-black text-white mb-1">
              {t('games.minesweeper.win_title', 'PHÁ ĐẢO THÀNH CÔNG!')}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              {t('games.minesweeper.win_desc', { sec: timer, count: CONFIGS[difficulty].mines })}
            </p>

            <div className="bg-slate-950/70 border border-amber-500/30 rounded-2xl p-4 mb-5">
              <span className="text-xs text-amber-400 font-bold block mb-1">
                {t('games.minesweeper.reward_label', 'Phần Thưởng Điểm Tích Lũy')}
              </span>
              <div className="flex items-center justify-center gap-1.5 text-2xl font-black text-amber-300">
                <Sparkles size={22} className="text-amber-400 fill-current animate-pulse" />
                <span>+{rewardAmount} 🪙</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => initBoard(difficulty)}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition border border-slate-700"
              >
                {t('common.play_again', 'Chơi lại')}
              </button>
              <button
                onClick={() => {
                  if (onClaimReward) onClaimReward(rewardAmount);
                  setShowRewardModal(false);
                }}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 font-black text-xs transition shadow-lg shadow-amber-500/30"
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
        gameTitle={t('games.minesweeper.title', 'Dò Mìn Chiến Thuật')}
        gameIcon={<span>💣</span>}
        goal={t(
          'games.minesweeper.tut_goal',
          'Mở toàn bộ các ô an toàn trên bản đồ mà không đào trúng bất kỳ quả mìn nào.'
        )}
        controls={t(
          'games.minesweeper.tut_ctrl',
          'Chế độ Đào: Chạm để mở ô. Chế độ Cắm cờ: Chạm hoặc nhấn giữ ô 0.4s để cắm cờ đánh dấu mìn. Chạm vào ô số đã mở để mở nhanh các ô lân cận.'
        )}
        scoring={t(
          'games.minesweeper.tut_score',
          'Độ khó Dễ (+35đ), Vừa (+70đ), Khó (+120đ). Thời gian phá đảo càng nhanh sẽ được cộng thêm điểm thưởng thời gian.'
        )}
        tips={t(
          'games.minesweeper.tut_tips',
          'Nước đi đầu tiên luôn an toàn 100%! Hãy quan sát các góc và cạnh có số 1 để cắm cờ trước, sau đó suy luận các ô tiếp theo.'
        )}
      />
    </div>
  );
};
