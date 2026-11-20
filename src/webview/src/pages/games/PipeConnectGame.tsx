import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import { soundHaptics } from '../../utils/soundHaptics';
import { GameHeader } from '../../components/common/GameHeader';
import { GameTutorialModal } from '../../components/common/GameTutorialModal';

export interface PipeConnectGameProps {
  onBack: () => void;
  onClaimReward?: (pointsWon: number) => void;
}

// 4 directions: 0=Up, 1=Right, 2=Down, 3=Left
const DIRS = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
];

interface Tile {
  mask: number; // 4-bit mask for base arms
  rot: number;  // 0, 1, 2, 3 (* 90 deg)
  isWet: boolean;
  isFixed?: boolean;
}

export const PipeConnectGame: React.FC<PipeConnectGameProps> = ({ onBack, onClaimReward }) => {
  const { t } = useTranslation();

  const [level, setLevel] = useState(1);
  const [gridSize, setGridSize] = useState(5);
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [moves, setMoves] = useState(0);
  const [isWon, setIsWon] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);
  const [score, setScore] = useState(0);

  // Confetti particles on victory
  const [confetti, setConfetti] = useState<
    Array<{ id: number; x: number; y: number; color: string; size: number; delay: number }>
  >([]);

  const hasArm = (tile: Tile, dir: number) => {
    return ((tile.mask >> ((dir - tile.rot + 4) % 4)) & 1) === 1;
  };

  // Re-calculate water flow from source (0,0) to sink (N-1, N-1)
  const computeFlow = useCallback((currentTiles: Tile[], n: number) => {
    const N = n * n;
    const visited = new Array(N).fill(false);
    const q: number[] = [];

    // Source at index 0 has water if it connects to West (dir=3)
    if (currentTiles[0] && hasArm(currentTiles[0], 3)) {
      visited[0] = true;
      q.push(0);
    }

    while (q.length > 0) {
      const cur = q.shift()!;
      const x = cur % n;
      const y = Math.floor(cur / n);

      for (let d = 0; d < 4; d++) {
        if (!hasArm(currentTiles[cur], d)) continue;
        const nx = x + DIRS[d][0];
        const ny = y + DIRS[d][1];
        if (nx < 0 || ny < 0 || nx >= n || ny >= n) continue;

        const nextIdx = ny * n + nx;
        if (visited[nextIdx]) continue;

        // Must connect reciprocally
        const oppositeDir = (d + 2) % 4;
        if (!hasArm(currentTiles[nextIdx], oppositeDir)) continue;

        visited[nextIdx] = true;
        q.push(nextIdx);
      }
    }

    const updated = currentTiles.map((tile, idx) => ({
      ...tile,
      isWet: visited[idx],
    }));

    // Check if water reached sink (last tile must connect to East dir=1)
    const lastIdx = N - 1;
    const sinkReached = visited[lastIdx] && hasArm(currentTiles[lastIdx], 1);

    return { updated, sinkReached };
  }, []);

  // Generate solvable puzzle using randomized spanning tree
  const generateLevel = useCallback((lvl: number) => {
    const n = lvl <= 2 ? 4 : lvl <= 4 ? 5 : 6;
    setGridSize(n);
    const N = n * n;

    let bestTiles: Tile[] = [];

    for (let attempt = 0; attempt < 25; attempt++) {
      const m = new Array(N).fill(0);
      const vis = new Array(N).fill(false);
      const stack = [0];
      vis[0] = true;

      while (stack.length > 0) {
        const cur = stack[stack.length - 1];
        const x = cur % n;
        const y = Math.floor(cur / n);
        const opts: Array<[number, number]> = [];

        for (let d = 0; d < 4; d++) {
          const nx = x + DIRS[d][0];
          const ny = y + DIRS[d][1];
          if (nx < 0 || ny < 0 || nx >= n || ny >= n) continue;
          const nextIdx = ny * n + nx;
          if (!vis[nextIdx]) {
            opts.push([d, nextIdx]);
          }
        }

        if (opts.length === 0) {
          stack.pop();
          continue;
        }

        const [pickedDir, pickedNext] = opts[Math.floor(Math.random() * opts.length)];
        m[cur] |= 1 << pickedDir;
        m[pickedNext] |= 1 << ((pickedDir + 2) % 4);
        vis[pickedNext] = true;
        stack.push(pickedNext);
      }

      // Add inlet (West) at tile 0 and outlet (East) at tile N-1
      m[0] |= 1 << 3;
      m[N - 1] |= 1 << 1;

      // Scramble initial rotations
      const initialTiles: Tile[] = m.map((mask) => {
        const randomRot = Math.floor(Math.random() * 4);
        return {
          mask,
          rot: randomRot,
          isWet: false,
          isFixed: false,
        };
      });

      const { updated, sinkReached } = computeFlow(initialTiles, n);
      if (!sinkReached) {
        bestTiles = updated;
        break;
      }
    }

    if (bestTiles.length === 0) {
      // Fallback
      bestTiles = new Array(N).fill(null).map((_, i) => ({
        mask: i === 0 ? 0b1010 : 0b0101,
        rot: Math.floor(Math.random() * 4),
        isWet: false,
      }));
    }

    return { bestTiles, n };
  }, [computeFlow]);

  const startLevel = useCallback(
    (lvl: number) => {
      setLevel(lvl);
      const { bestTiles, n } = generateLevel(lvl);
      const { updated } = computeFlow(bestTiles, n);
      setTiles(updated);
      setMoves(0);
      setIsWon(false);
      setConfetti([]);
    },
    [generateLevel, computeFlow],
  );

  useEffect(() => {
    startLevel(1);
  }, [startLevel]);

  const handleRotate = (idx: number) => {
    if (isWon) return;

    soundHaptics.playClick();

    const next = tiles.map((t, i) =>
      i === idx ? { ...t, rot: (t.rot + 1) % 4 } : t,
    );
    const { updated, sinkReached } = computeFlow(next, gridSize);
    setTiles(updated);
    setMoves((m) => m + 1);

    if (sinkReached) {
      setIsWon(true);
      const rewardCoins = 25 + level * 10;
      setScore((s) => s + 200);

      // Confetti burst
      const parts = Array.from({ length: 40 }, (_, i) => ({
        id: i,
        x: Math.random() * 90 + 5,
        y: Math.random() * 40 + 10,
        color: ['#38BDF8', '#0284C7', '#F59E0B', '#10B981'][i % 4],
        size: Math.random() * 8 + 6,
        delay: Math.random() * 0.4,
      }));
      setConfetti(parts);
      soundHaptics.playVictoryFanfare();

      if (onClaimReward) {
        onClaimReward(rewardCoins);
      }
    }
  };

  return (
    <div
      style={{ touchAction: 'none' }}
      className="relative flex flex-col h-[100dvh] w-full max-w-[430px] mx-auto bg-slate-950 select-none overflow-hidden overscroll-none"
    >
      {/* ── 1. PINNED GAME HEADER ── */}
      <GameHeader
        title={t('games.pipeconnect.title', 'Nối Ống Nước')}
        subtitle={`${t('games.pipeconnect.level_label', { level })} • ${gridSize}x${gridSize}`}
        onBack={onBack}
        soundEnabled={soundEnabled}
        onToggleSound={() => {
          soundHaptics.toggleMute();
          setSoundEnabled(!soundHaptics.isMuted());
        }}
        onRestart={() => startLevel(level)}
        onHelp={() => setShowTutorial(true)}
      />

      {/* ── 2. HUD STATUS BAR ── */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800/80 z-10 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400">{t('games.pipeconnect.status', 'Nguồn nước')}:</span>
          <span className={`text-xs font-black font-mono ${isWon ? 'text-cyan-400' : 'text-amber-400'}`}>
            {isWon ? '💧 ĐÃ THÔNG DÒNG' : '⚠️ CHƯA THÔNG'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400">{t('games.pipeconnect.moves', 'Lượt xoay')}:</span>
          <span className="text-xs font-black text-sky-400 font-mono">{moves}</span>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold leading-none">
            {t('games.pipeconnect.score', 'Điểm')}
          </span>
          <span className="text-base font-black text-amber-400 font-mono leading-none">{score}</span>
        </div>
      </div>

      {/* ── 3. MAIN PIPE GRID ARENA ── */}
      <div className="relative flex-1 w-full flex flex-col items-center justify-center p-4 overflow-hidden">
        {/* Source & Sink indicators */}
        <div className="flex items-center justify-between w-full max-w-[340px] px-2 mb-2 text-xs font-bold">
          <div className="flex items-center gap-1.5 text-cyan-400">
            <span>💧</span>
            <span>{t('games.pipeconnect.inlet', 'Nguồn Nước')}</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span>{t('games.pipeconnect.outlet', 'Cống Thoát')}</span>
            <span>🏁</span>
          </div>
        </div>

        <div
          className={`grid gap-1.5 p-2 bg-slate-900 border-2 rounded-2xl shadow-2xl transition-all duration-300 ${
            isWon ? 'border-cyan-400 shadow-cyan-500/20' : 'border-slate-800'
          }`}
          style={{
            gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
            width: '100%',
            maxWidth: '340px',
            aspectRatio: '1 / 1',
          }}
        >
          {tiles.map((tile, idx) => {
            const up = hasArm(tile, 0);
            const right = hasArm(tile, 1);
            const down = hasArm(tile, 2);
            const left = hasArm(tile, 3);
            const isWet = tile.isWet;

            return (
              <div
                key={idx}
                onClick={() => handleRotate(idx)}
                className={`relative rounded-xl cursor-pointer flex items-center justify-center transition-all duration-150 select-none ${
                  isWet
                    ? 'bg-cyan-950/40 border border-cyan-500/40'
                    : 'bg-slate-800/80 border border-slate-700/60 active:scale-95'
                }`}
              >
                {/* SVG Pipe Graphics */}
                <svg viewBox="0 0 100 100" className="w-full h-full pointer-events-none p-1">
                  {/* Center junction hub */}
                  <circle
                    cx="50"
                    cy="50"
                    r="12"
                    fill={isWet ? '#38BDF8' : '#64748B'}
                    className={isWet ? 'animate-pulse' : ''}
                  />

                  {/* Arms */}
                  {up && (
                    <rect
                      x="40"
                      y="0"
                      width="20"
                      height="50"
                      rx="4"
                      fill={isWet ? '#38BDF8' : '#64748B'}
                    />
                  )}
                  {down && (
                    <rect
                      x="40"
                      y="50"
                      width="20"
                      height="50"
                      rx="4"
                      fill={isWet ? '#38BDF8' : '#64748B'}
                    />
                  )}
                  {left && (
                    <rect
                      x="0"
                      y="40"
                      width="50"
                      height="20"
                      rx="4"
                      fill={isWet ? '#38BDF8' : '#64748B'}
                    />
                  )}
                  {right && (
                    <rect
                      x="50"
                      y="40"
                      width="50"
                      height="20"
                      rx="4"
                      fill={isWet ? '#38BDF8' : '#64748B'}
                    />
                  )}

                  {/* Liquid flow glow core */}
                  {isWet && (
                    <circle cx="50" cy="50" r="5" fill="#FFFFFF" />
                  )}
                </svg>

                {/* Corner tags for source and sink */}
                {idx === 0 && (
                  <span className="absolute top-0.5 left-0.5 text-[8px] font-black text-cyan-300">IN</span>
                )}
                {idx === tiles.length - 1 && (
                  <span className="absolute bottom-0.5 right-0.5 text-[8px] font-black text-emerald-300">OUT</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Tip */}
        <p className="mt-4 text-[11px] text-slate-400 font-medium text-center">
          {t('games.pipeconnect.tip', '👉 Chạm vào từng đoạn ống để xoay 90° dẫn nước về đích!')}
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

      {/* ── 4. VICTORY MODAL ── */}
      {isWon && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-cyan-500/50 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl relative">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-cyan-400 to-blue-500 text-slate-950 flex items-center justify-center text-3xl mx-auto shadow-xl animate-bounce">
              🔧
            </div>
            <div>
              <h3 className="text-xl font-black text-cyan-400">
                {t('games.pipeconnect.win_title', { level, defaultValue: `HOÀN THÀNH MÀN ${level}!` })}
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                {t('games.pipeconnect.win_desc', {
                  moves,
                  defaultValue: `Tuyệt đỉnh! Dòng nước đã thông suốt hoàn toàn chỉ với ${moves} lượt xoay!`,
                })}
              </p>
            </div>

            <div className="bg-slate-800/80 rounded-2xl p-3 border border-slate-700 text-xs flex justify-between items-center">
              <span className="text-slate-400">{t('games.pipeconnect.reward_label', 'Xu Natcash thưởng:')}</span>
              <span className="font-mono font-bold text-amber-400">
                +{25 + level * 10} {t('games.pipeconnect.coin_unit', 'Xu 🪙')}
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => startLevel(level + 1)}
                className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 text-slate-950 font-black rounded-2xl text-xs shadow-lg active:scale-95 transition flex items-center justify-center gap-1.5"
              >
                <span>{t('games.pipeconnect.btn_next', 'MÀN TIẾP THEO')}</span>
                <ArrowRight size={14} />
              </button>
              <button
                onClick={onBack}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl text-xs border border-slate-700 active:scale-95 transition"
              >
                {t('games.pipeconnect.btn_hub', 'VỀ GAMEHUB')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 5. TUTORIAL MODAL ── */}
      <GameTutorialModal
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
        gameTitle={t('games.pipeconnect.title', 'Nối Ống Nước')}
        goal={t('games.pipeconnect.tut_goal', 'Xoay các đoạn ống để nối một đường dẫn kín từ Nguồn Nước (Góc trên trái) sang Cống Thoát (Góc dưới phải).')}
        controls={t('games.pipeconnect.tut_ctrl', 'Chạm vào đoạn ống bất kỳ để xoay theo chiều kim đồng hồ.')}
        scoring={t('games.pipeconnect.tut_score', 'Mỗi màn giải thành công nhận ngay +200 Điểm và Xu thưởng Natcash.')}
        tips={t('games.pipeconnect.tut_tips', 'Bắt đầu từ nguồn nước (IN) và lần theo các đoạn ống dẫn sáng màu xanh nước biển.')}
      />
    </div>
  );
};
