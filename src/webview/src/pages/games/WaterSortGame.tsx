import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { RotateCcw, Undo2, ArrowRight } from 'lucide-react';
import { soundHaptics } from '../../utils/soundHaptics';
import { GameHeader } from '../../components/common/GameHeader';
import { GameTutorialModal } from '../../components/common/GameTutorialModal';

export interface WaterSortGameProps {
  onBack: () => void;
  onClaimReward?: (pointsWon: number) => void;
}

interface PourAnimation {
  sourceIdx: number;
  targetIdx: number;
  color: string;
  count: number;
  tx: number;
  ty: number;
  rotateDeg: number;
  transformOrigin: string;
  stage: 'tilting' | 'pouring' | 'resetting';
  stream?: {
    x: number;
    yTop: number;
    yBottom: number;
  };
}

const CAP = 4;
const COLORS = [
  '#EF4444', // 1. Red
  '#3B82F6', // 2. Blue
  '#F59E0B', // 3. Amber
  '#10B981', // 4. Emerald Green
  '#8B5CF6', // 5. Purple
  '#EC4899', // 6. Pink
  '#06B6D4', // 7. Cyan
  '#F97316', // 8. Orange
  '#84CC16', // 9. Lime Green
  '#6366F1', // 10. Indigo
  '#14B8A6', // 11. Teal
  '#D946EF', // 12. Fuchsia
];

// Helper: lấy dải màu cùng loại liên tiếp trên đỉnh lọ
function getTopRun(tube: string[]): { color: string | null; count: number } {
  if (!tube.length) return { color: null, count: 0 };
  const color = tube[tube.length - 1];
  let count = 0;
  for (let i = tube.length - 1; i >= 0 && tube[i] === color; i--) {
    count++;
  }
  return { color, count };
}

// Helper: băm trạng thái để tránh vòng lặp trong DFS solver
function canonState(state: string[][]): string {
  return state.map((t) => t.join('')).sort().join('|');
}

// Fast DFS Solver: đảm bảo 100% màn sinh ra có lời giải và đo độ sâu số bước
function solvePuzzle(startState: string[][], maxNodes = 12000): number | null {
  const seen: Record<string, boolean> = {};
  let nodes = 0;

  function dfs(st: string[][], depth: number): number | null {
    if (++nodes > maxNodes) return null;
    if (st.every((t) => t.length === 0 || (t.length === CAP && t.every((c) => c === t[0])))) {
      return depth;
    }
    const key = canonState(st);
    if (seen[key]) return null;
    seen[key] = true;

    const candidateMoves: { from: number; to: number; score: number }[] = [];
    for (let a = 0; a < st.length; a++) {
      if (!st[a].length) continue;
      const fRun = getTopRun(st[a]);
      for (let b = 0; b < st.length; b++) {
        if (a === b) continue;
        const toTube = st[b];
        if (toTube.length >= CAP) continue;
        if (toTube.length > 0 && toTube[toTube.length - 1] !== fRun.color) continue;
        if (toTube.length === 0 && st[a].length === CAP && fRun.count === CAP) continue;

        const pourCount = Math.min(fRun.count, CAP - toTube.length);
        let score = 0;
        if (toTube.length + pourCount === CAP) score += 4;
        if (st[a].length === pourCount) score += 3;
        if (toTube.length > 0) score += 2;

        candidateMoves.push({ from: a, to: b, score });
      }
    }

    candidateMoves.sort((x, y) => y.score - x.score);

    for (let i = 0; i < candidateMoves.length; i++) {
      const { from, to } = candidateMoves[i];
      const nextSt = st.map((t) => [...t]);
      const fRun = getTopRun(nextSt[from]);
      const count = Math.min(fRun.count, CAP - nextSt[to].length);
      for (let k = 0; k < count; k++) {
        nextSt[to].push(nextSt[from].pop()!);
      }

      const res = dfs(nextSt, depth + 1);
      if (res !== null) return res;
    }

    return null;
  }

  return dfs(startState, 0);
}

export const WaterSortGame: React.FC<WaterSortGameProps> = ({ onBack, onClaimReward }) => {
  const { t } = useTranslation();

  const [level, setLevel] = useState(1);
  const [tubes, setTubes] = useState<string[][]>([]);
  const [selectedTube, setSelectedTube] = useState<number | null>(null);
  const [history, setHistory] = useState<string[][][]>([]);
  const [moves, setMoves] = useState(0);
  const [score, setScore] = useState(0);
  const [isWon, setIsWon] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);
  const [nopeTube, setNopeTube] = useState<number | null>(null);
  const [justPouredTube, setJustPouredTube] = useState<number | null>(null);
  const [pourAnimation, setPourAnimation] = useState<PourAnimation | null>(null);
  const [isPouring, setIsPouring] = useState(false);

  const arenaRef = useRef<HTMLDivElement | null>(null);
  const tubeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  }, []);

  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);

  // Confetti particles on victory
  const [confetti, setConfetti] = useState<
    Array<{ id: number; x: number; y: number; color: string; size: number; delay: number }>
  >([]);

  // Helpers
  const isDone = useCallback((tube: string[]) => {
    if (tube.length !== CAP) return false;
    return tube.every((c) => c === tube[0]);
  }, []);

  const isSolved = useCallback(
    (currentTubes: string[][]) => {
      return currentTubes.every((t) => t.length === 0 || isDone(t));
    },
    [isDone],
  );

  const canPour = useCallback(
    (fromIdx: number, toIdx: number, currentTubes: string[][]) => {
      if (fromIdx === toIdx) return false;
      const from = currentTubes[fromIdx];
      const to = currentTubes[toIdx];
      if (!from.length) return false;
      if (to.length >= CAP) return false;
      if (to.length > 0 && to[to.length - 1] !== from[from.length - 1]) return false;
      // Don't pour fully completed tube into empty tube
      if (to.length === 0 && isDone(from)) return false;
      return true;
    },
    [isDone],
  );

  // Generate solvable puzzle với cơ chế tịnh tiến độ khó chuẩn mực
  const generateLevel = useCallback((lvl: number): string[][] => {
    // Độ khó tịnh tiến:
    // Màn 1: 3 màu (5 lọ)
    // Màn 2: 4 màu (6 lọ)
    // Màn 3: 5 màu (7 lọ)
    // Màn 4: 6 màu (8 lọ)
    // Màn 5: 7 màu (9 lọ)
    // Màn 6+: tăng dần đến tối đa 10 màu
    const numColors = Math.min(3 + (lvl - 1), 10);
    const empties = 2;
    const minRequiredSteps = Math.min(4 + (lvl - 1) * 3, 20);

    let bestDeal: string[][] | null = null;
    let validCandidate: string[][] | null = null;

    for (let attempt = 0; attempt < 35; attempt++) {
      const pool: string[] = [];
      for (let c = 0; c < numColors; c++) {
        for (let i = 0; i < CAP; i++) {
          pool.push(COLORS[c]);
        }
      }

      // Fisher-Yates shuffle
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }

      const candidate: string[][] = [];
      for (let c = 0; c < numColors; c++) {
        candidate.push(pool.slice(c * CAP, c * CAP + CAP));
      }
      for (let i = 0; i < empties; i++) {
        candidate.push([]);
      }

      // Không cho phép lọ nào bắt đầu đã đầy 1 màu sẵn
      if (candidate.some(isDone)) continue;

      // Xác minh giải được và độ sâu giải đố
      const solutionSteps = solvePuzzle(candidate, 12000);
      if (solutionSteps !== null) {
        if (!validCandidate) validCandidate = candidate;
        if (solutionSteps >= minRequiredSteps) {
          bestDeal = candidate;
          break;
        }
      }
    }

    if (bestDeal) return bestDeal;
    if (validCandidate) return validCandidate;

    // Fallback nếu vượt quá số lần thử
    const fallback: string[][] = [];
    for (let c = 0; c < numColors; c++) {
      fallback.push([COLORS[c], COLORS[(c + 1) % numColors], COLORS[c], COLORS[(c + 1) % numColors]]);
    }
    for (let i = 0; i < empties; i++) {
      fallback.push([]);
    }
    return fallback;
  }, [isDone]);

  const startLevel = useCallback(
    (lvl: number) => {
      clearAllTimers();
      setPourAnimation(null);
      setIsPouring(false);
      setLevel(lvl);
      const newTubes = generateLevel(lvl);
      setTubes(newTubes);
      setSelectedTube(null);
      setHistory([]);
      setMoves(0);
      setIsWon(false);
      setNopeTube(null);
      setJustPouredTube(null);
      setConfetti([]);
    },
    [clearAllTimers, generateLevel],
  );

  useEffect(() => {
    startLevel(1);
  }, [startLevel]);

  // Handle Tube Click
  const handleTubeClick = (idx: number) => {
    if (isWon || isPouring) return;

    if (selectedTube === null) {
      // Pick source tube
      if (tubes[idx].length === 0) return;
      if (isDone(tubes[idx])) {
        // Already completed
        setNopeTube(idx);
        setTimeout(() => setNopeTube(null), 300);
        return;
      }
      setSelectedTube(idx);
      soundHaptics.playCardFlip();
    } else {
      if (selectedTube === idx) {
        // Deselect
        setSelectedTube(null);
        return;
      }

      // Try pour
      if (canPour(selectedTube, idx, tubes)) {
        const sourceIdx = selectedTube;
        const targetIdx = idx;
        const sourceEl = tubeRefs.current[sourceIdx];
        const targetEl = tubeRefs.current[targetIdx];
        const arenaEl = arenaRef.current;

        // Save history for Undo
        setHistory((prev) => [...prev, tubes.map((t) => [...t])]);

        const fromTube = tubes[sourceIdx];
        const toTube = tubes[targetIdx];
        const colorToPour = fromTube[fromTube.length - 1];

        // Count how many matching top items will pour
        let pouredCount = 0;
        while (
          fromTube.length - 1 - pouredCount >= 0 &&
          fromTube[fromTube.length - 1 - pouredCount] === colorToPour &&
          toTube.length + pouredCount < CAP
        ) {
          pouredCount++;
        }

        const nextTubes = tubes.map((t) => [...t]);
        const nextFrom = nextTubes[sourceIdx];
        const nextTo = nextTubes[targetIdx];
        for (let i = 0; i < pouredCount; i++) {
          nextTo.push(nextFrom.pop()!);
        }

        if (sourceEl && targetEl && arenaEl) {
          setIsPouring(true);
          const arenaRect = arenaEl.getBoundingClientRect();
          const sourceRect = sourceEl.getBoundingClientRect();
          const targetRect = targetEl.getBoundingClientRect();

          const sLeft = sourceRect.left - arenaRect.left;
          const sTop = sourceRect.top - arenaRect.top;
          const tLeft = targetRect.left - arenaRect.left;
          const tTop = targetRect.top - arenaRect.top;

          const dx = tLeft - sLeft;
          const isFromLeft = dx >= 0;

          const targetWidth = targetRect.width || 44;
          const targetHeight = targetRect.height || 148;
          const slotHeight = (targetHeight - 8) / CAP;

          // Tilting angle & translation offsets so spout hovers right above target lip
          const rotateDeg = isFromLeft ? 72 : -72;
          const transformOrigin = isFromLeft ? '100% 0%' : '0% 0%';
          const tx = isFromLeft ? tLeft - sLeft - targetWidth * 0.42 : tLeft - sLeft + targetWidth * 0.42;
          const ty = tTop - sTop - 36;

          // Mouth coordinate where liquid stream emerges
          const mouthX = isFromLeft ? tLeft + targetWidth * 0.42 : tLeft + targetWidth * 0.58;
          const mouthY = tTop - 18;

          // Surface height calculation inside target tube where stream lands
          const currentTargetCount = toTube.length;
          const targetSurfaceY = Math.max(tTop + 16, tTop + targetHeight - ((currentTargetCount + pouredCount) * slotHeight) + 8);

          // 1. Stage 'tilting': glide & tilt to target
          setPourAnimation({
            sourceIdx,
            targetIdx,
            color: colorToPour,
            count: pouredCount,
            tx,
            ty,
            rotateDeg,
            transformOrigin,
            stage: 'tilting',
          });

          // 2. Stage 'pouring': show stream, transfer water, play sound
          const t1 = setTimeout(() => {
            soundHaptics.playWaterPour(pouredCount + 1);
            setTubes(nextTubes);
            setJustPouredTube(targetIdx);

            setPourAnimation((prev) =>
              prev
                ? {
                    ...prev,
                    stage: 'pouring',
                    stream: {
                      x: mouthX,
                      yTop: mouthY,
                      yBottom: targetSurfaceY,
                    },
                  }
                : null,
            );
          }, 220);

          // 3. Stage 'resetting': stream vanishes, tube returns straight
          const t2 = setTimeout(() => {
            setPourAnimation((prev) =>
              prev
                ? {
                    ...prev,
                    stage: 'resetting',
                    stream: undefined,
                  }
                : null,
            );
          }, 600);

          // 4. Finish animation: cleanup, check match and victory
          const t3 = setTimeout(() => {
            setPourAnimation(null);
            setSelectedTube(null);
            setIsPouring(false);
            setMoves((m) => m + 1);
            setJustPouredTube(null);

            // Check if target tube is now done
            if (isDone(nextTo)) {
              soundHaptics.playMatchSuccess();
            }

            // Check win
            if (isSolved(nextTubes)) {
              handleVictory(level);
            }
          }, 820);

          timersRef.current.push(t1, t2, t3);
        } else {
          // Instant fallback
          setTubes(nextTubes);
          setSelectedTube(null);
          setMoves((m) => m + 1);
          setJustPouredTube(targetIdx);
          setTimeout(() => setJustPouredTube(null), 400);

          soundHaptics.playClick();
          if (isDone(nextTo)) {
            soundHaptics.playMatchSuccess();
          }
          if (isSolved(nextTubes)) {
            handleVictory(level);
          }
        }
      } else {
        // Illegal move
        setNopeTube(idx);
        setTimeout(() => setNopeTube(null), 300);
        setSelectedTube(null);
      }
    }
  };

  const handleUndo = () => {
    if (history.length === 0 || isWon || isPouring) return;
    const last = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setTubes(last);
    setSelectedTube(null);
    setMoves((m) => Math.max(0, m - 1));
    soundHaptics.playClick();
  };

  const handleVictory = (completedLevel: number) => {
    setIsWon(true);
    const rewardCoins = 20 + completedLevel * 10;
    const addedScore = 150 + Math.max(0, 100 - moves * 2);
    setScore((s) => s + addedScore);

    // Spawn confetti
    const parts = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 90 + 5,
      y: Math.random() * 40 + 10,
      color: COLORS[i % COLORS.length],
      size: Math.random() * 8 + 6,
      delay: Math.random() * 0.4,
    }));
    setConfetti(parts);
    soundHaptics.playVictoryFanfare();

    if (onClaimReward) {
      onClaimReward(rewardCoins);
    }
  };

  const completedTubesCount = useMemo(() => {
    return tubes.filter(isDone).length;
  }, [tubes, isDone]);

  const totalRequiredColors = useMemo(() => {
    const set = new Set<string>();
    tubes.forEach((t) => t.forEach((c) => set.add(c)));
    return set.size;
  }, [tubes]);

  return (
    <div
      style={{ touchAction: 'none' }}
      className="relative flex flex-col h-[100dvh] w-full max-w-[430px] mx-auto bg-slate-950 select-none overflow-hidden overscroll-none"
    >
      {/* ── 1. PINNED GAME HEADER ── */}
      <GameHeader
        title={t('games.watersort.title', 'Rót Nước Phân Màu')}
        subtitle={`${t('games.watersort.level_label', { level })} • ${completedTubesCount}/${totalRequiredColors} 🧪`}
        onBack={onBack}
        soundEnabled={soundEnabled}
        onToggleSound={() => {
          soundHaptics.toggleMute();
          setSoundEnabled(!soundHaptics.isMuted());
        }}
        onRestart={() => !isPouring && startLevel(level)}
        onHelp={() => setShowTutorial(true)}
      />

      {/* ── 2. HUD STATUS BAR ── */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800/80 z-10 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400">{t('games.watersort.completed', 'Hoàn tất')}:</span>
          <span className="text-xs font-black text-emerald-400 font-mono">
            {completedTubesCount} / {totalRequiredColors}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400">{t('games.watersort.moves', 'Bước rót')}:</span>
          <span className="text-xs font-black text-sky-400 font-mono">{moves}</span>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold leading-none">
            {t('games.watersort.score', 'Điểm')}
          </span>
          <span className="text-base font-black text-amber-400 font-mono leading-none">{score}</span>
        </div>
      </div>

      {/* ── 3. TOOLBAR CONTROLS ── */}
      <div className="flex items-center justify-between px-6 py-2.5 bg-slate-900/40 z-10">
        <button
          onClick={handleUndo}
          disabled={history.length === 0 || isWon || isPouring}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition border ${
            history.length > 0 && !isWon && !isPouring
              ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 shadow-sm active:scale-95'
              : 'opacity-40 bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed'
          }`}
        >
          <Undo2 size={15} />
          <span>{t('games.watersort.undo', 'Hoàn tác')} ({history.length})</span>
        </button>

        <button
          onClick={() => !isPouring && startLevel(level)}
          disabled={isPouring}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition ${
            isPouring ? 'opacity-40 cursor-not-allowed' : 'active:scale-95'
          }`}
        >
          <RotateCcw size={15} />
          <span>{t('games.watersort.reset', 'Làm lại')}</span>
        </button>
      </div>

      {/* ── 4. TUBES PLAYING ARENA ── */}
      <div
        ref={arenaRef}
        className="relative flex-1 w-full flex flex-col items-center justify-center p-4 overflow-y-auto"
      >
        {/* Animated Liquid Stream between tubes */}
        {pourAnimation?.stage === 'pouring' && pourAnimation.stream && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-30">
            <defs>
              <filter id="stream-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {/* Soft glow back-stream */}
            <line
              x1={pourAnimation.stream.x}
              y1={pourAnimation.stream.yTop}
              x2={pourAnimation.stream.x}
              y2={pourAnimation.stream.yBottom}
              stroke={pourAnimation.color}
              strokeWidth="7"
              strokeLinecap="round"
              opacity="0.5"
              filter="url(#stream-glow)"
            />
            {/* Core bright liquid stream */}
            <line
              x1={pourAnimation.stream.x}
              y1={pourAnimation.stream.yTop}
              x2={pourAnimation.stream.x}
              y2={pourAnimation.stream.yBottom}
              stroke={pourAnimation.color}
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Spout droplet */}
            <circle
              cx={pourAnimation.stream.x}
              cy={pourAnimation.stream.yTop}
              r="3.5"
              fill="#ffffff"
              opacity="0.9"
            />
            {/* Surface splash impact */}
            <ellipse
              cx={pourAnimation.stream.x}
              cy={pourAnimation.stream.yBottom}
              rx="7"
              ry="3"
              fill={pourAnimation.color}
              opacity="0.8"
              className="animate-ping"
            />
          </svg>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3 max-w-[390px] mx-auto py-3">
          {tubes.map((tube, idx) => {
            const isPouringSource = pourAnimation?.sourceIdx === idx;
            const isPouringTarget = pourAnimation?.targetIdx === idx;
            const isSelected = selectedTube === idx && !isPouring;
            const isCompleted = isDone(tube);
            const isNoping = nopeTube === idx;
            const isPoured = justPouredTube === idx;

            // Responsive sizing based on tube count
            const isCompact = tubes.length > 7;
            const tubeSizeClass = isCompact ? 'w-[40px] h-[136px]' : 'w-[44px] h-[148px]';
            const lipWidthClass = isCompact ? 'w-[48px]' : 'w-[52px]';

            // Transform styles for tilting & pouring
            let transformStyle: string | undefined = undefined;
            let transformOriginStyle = 'center bottom';
            let transitionStyle = 'all 0.2s cubic-bezier(0.3, 0.75, 0.4, 1)';
            let zIndex = 1;

            if (isPouringSource && pourAnimation) {
              zIndex = 40;
              transformOriginStyle = pourAnimation.transformOrigin;
              if (pourAnimation.stage === 'resetting') {
                transformStyle = 'translate3d(0, 0, 0) rotate(0deg)';
                transitionStyle = 'transform 0.22s ease-out';
              } else {
                transformStyle = `translate3d(${pourAnimation.tx}px, ${pourAnimation.ty}px, 0) rotate(${pourAnimation.rotateDeg}deg)`;
                transitionStyle = 'transform 0.24s cubic-bezier(0.22, 1, 0.36, 1)';
              }
            }

            return (
              <div
                key={idx}
                ref={(el) => {
                  tubeRefs.current[idx] = el;
                }}
                onClick={() => handleTubeClick(idx)}
                className={`relative flex flex-col-reverse ${tubeSizeClass} p-1 rounded-b-2xl border-2 cursor-pointer select-none ${
                  isPouringSource
                    ? 'border-amber-400 shadow-2xl ring-2 ring-amber-400/50 bg-slate-800/90'
                    : isPouringTarget && pourAnimation?.stage === 'pouring'
                    ? 'border-sky-400 shadow-lg shadow-sky-500/30 ring-2 ring-sky-400/40 bg-slate-800/80'
                    : isSelected
                    ? 'border-amber-400 -translate-y-4 shadow-xl shadow-amber-500/30 ring-2 ring-amber-400/50 bg-slate-800/80'
                    : isCompleted
                    ? 'border-emerald-400/80 shadow-md shadow-emerald-500/20 bg-emerald-950/20'
                    : isNoping
                    ? 'border-rose-500 translate-x-1 animate-pulse bg-rose-950/20'
                    : 'border-slate-600/70 hover:border-slate-400 bg-slate-900/60 active:scale-95'
                }`}
                style={{
                  borderTop: 'none',
                  transform: transformStyle,
                  transformOrigin: transformOriginStyle,
                  transition: transitionStyle,
                  zIndex,
                }}
              >
                {/* Tube glass lip highlight */}
                <div
                  className={`absolute -top-1.5 left-1/2 -translate-x-1/2 ${lipWidthClass} h-3 rounded-full border-2 transition ${
                    isPouringSource || isSelected
                      ? 'border-amber-400 bg-amber-400/20'
                      : isCompleted
                      ? 'border-emerald-400 bg-emerald-400/20'
                      : 'border-slate-500 bg-slate-800/80'
                  }`}
                />

                {/* 4 Liquid slots */}
                {Array.from({ length: CAP }).map((_, slotIdx) => {
                  const color = tube[slotIdx];
                  const isTopItem = slotIdx === tube.length - 1;
                  return (
                    <div
                      key={slotIdx}
                      style={{
                        backgroundColor: color || 'transparent',
                        borderBottomLeftRadius: slotIdx === 0 ? '14px' : '0px',
                        borderBottomRightRadius: slotIdx === 0 ? '14px' : '0px',
                        borderTopLeftRadius: isTopItem && color ? '6px' : '0px',
                        borderTopRightRadius: isTopItem && color ? '6px' : '0px',
                      }}
                      className={`flex-1 transition-all duration-200 ${
                        isPoured && isTopItem ? 'animate-pulse' : ''
                      }`}
                    />
                  );
                })}

                {/* Completed badge */}
                {isCompleted && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-base font-black text-white drop-shadow-md">✓</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Instructions */}
        <p className="mt-2 text-[11px] text-slate-400 font-medium text-center">
          {t('games.watersort.tip', '👉 Chạm vào ống để chọn, chạm ống thứ hai để rót nước cùng màu!')}
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

      {/* ── 5. VICTORY MODAL ── */}
      {isWon && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-emerald-500/50 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl relative">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-cyan-400 to-emerald-400 text-slate-950 flex items-center justify-center text-3xl mx-auto shadow-xl animate-bounce">
              🧪
            </div>
            <div>
              <h3 className="text-xl font-black text-emerald-400">
                {t('games.watersort.win_title', { level, defaultValue: `HOÀN THÀNH MÀN ${level}!` })}
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                {t('games.watersort.win_desc', {
                  moves,
                  defaultValue: `Tuyệt vời! Bạn đã phân tách hoàn hảo các ống nghiệm chỉ trong ${moves} bước rót!`,
                })}
              </p>
            </div>

            <div className="bg-slate-800/80 rounded-2xl p-3 border border-slate-700 text-xs flex justify-between items-center">
              <span className="text-slate-400">{t('games.watersort.reward_label', 'Xu Natcash thưởng:')}</span>
              <span className="font-mono font-bold text-amber-400">
                +{20 + level * 10} {t('games.watersort.coin_unit', 'Xu 🪙')}
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => startLevel(level + 1)}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-green-400 hover:from-emerald-400 text-slate-950 font-black rounded-2xl text-xs shadow-lg active:scale-95 transition flex items-center justify-center gap-1.5"
              >
                <span>{t('games.watersort.btn_next', 'MÀN TIẾP THEO')}</span>
                <ArrowRight size={14} />
              </button>
              <button
                onClick={onBack}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl text-xs border border-slate-700 active:scale-95 transition"
              >
                {t('games.watersort.btn_hub', 'VỀ GAMEHUB')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 6. TUTORIAL MODAL ── */}
      <GameTutorialModal
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
        gameTitle={t('games.watersort.title', 'Rót Nước Phân Màu')}
        goal={t('games.watersort.tut_goal', 'Rót chất lỏng giữa các ống nghiệm sao cho mỗi ống chỉ chứa 1 màu duy nhất.')}
        controls={t('games.watersort.tut_ctrl', 'Chạm vào ống thứ nhất để nhấc lên, chạm vào ống thứ hai để rót. Chỉ rót được khi ống nhận có cùng màu ở trên cùng hoặc là ống rỗng.')}
        scoring={t('games.watersort.tut_score', 'Mỗi màn thắng cộng ngay +150 Điểm và Xu thưởng Natcash tương ứng.')}
        tips={t('games.watersort.tut_tips', 'Tận dụng các ống rỗng làm bước đệm trung gian để dồn các màu giống nhau lại.')}
      />
    </div>
  );
};
