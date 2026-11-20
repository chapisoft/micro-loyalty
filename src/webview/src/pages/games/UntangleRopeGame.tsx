import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, Lightbulb } from 'lucide-react';
import { GameSounds } from '../../utils/audio';
import { GameHeader } from '../../components/common/GameHeader';
import { GameTutorialModal } from '../../components/common/GameTutorialModal';

export interface UntangleRopeGameProps {
  onBack: () => void;
  onClaimReward?: (pointsWon: number) => void;
}

const SVG_SIZE = 360;
const SNAP_RADIUS = 28;

interface Peg {
  id: number;
  x: number; // 0..360 SVG coordinates
  y: number; // 0..360 SVG coordinates
}

interface Rope {
  id: number;
  color: string;
  glowColor: string;
  startPegId: number;
  endPegId: number;
}

interface CrossingPoint {
  x: number;
  y: number;
  ropeAId: number;
  ropeBId: number;
}

interface HintMove {
  fromPegId: number;
  toPegId: number;
}

interface DragState {
  ropeId: number;
  isStart: boolean;
  originPegId: number;
  startClientX: number;
  startClientY: number;
  curX: number;
  curY: number;
  moved: boolean;
  hoverPegId: number | null;
}

const ROPE_PALETTE = [
  { color: '#F43F5E', glow: 'rgba(244, 63, 94, 0.7)' }, // Coral Rose
  { color: '#38BDF8', glow: 'rgba(56, 189, 248, 0.7)' }, // Sky Cyan
  { color: '#F59E0B', glow: 'rgba(245, 158, 11, 0.7)' }, // Amber Gold
  { color: '#A855F7', glow: 'rgba(168, 85, 247, 0.7)' }, // Royal Violet
  { color: '#10B981', glow: 'rgba(16, 185, 129, 0.7)' }, // Emerald
  { color: '#EC4899', glow: 'rgba(236, 72, 153, 0.7)' }, // Magenta
  { color: '#06B6D4', glow: 'rgba(6, 182, 212, 0.7)' }, // Turquoise
  { color: '#FB923C', glow: 'rgba(251, 146, 60, 0.7)' }, // Tangerine
];

// Exact 2D line-segment intersection point (strict interior cross, shared endpoints don't cross)
function getSegmentIntersection(
  A: { x: number; y: number },
  B: { x: number; y: number },
  C: { x: number; y: number },
  D: { x: number; y: number }
): { x: number; y: number } | null {
  const denom = (B.x - A.x) * (D.y - C.y) - (B.y - A.y) * (D.x - C.x);
  if (Math.abs(denom) < 1e-6) return null;

  const t = ((C.x - A.x) * (D.y - C.y) - (C.y - A.y) * (D.x - C.x)) / denom;
  const u = ((C.x - A.x) * (B.y - A.y) - (C.y - A.y) * (B.x - A.x)) / denom;

  if (t > 0.02 && t < 0.98 && u > 0.02 && u < 0.98) {
    return {
      x: A.x + t * (B.x - A.x),
      y: A.y + t * (B.y - A.y),
    };
  }
  return null;
}

// Generate strictly convex socket layouts in SVG coordinates (no 3 collinear points)
function generatePegLayout(count: number, levelNum: number): Peg[] {
  const pegs: Peg[] = [];
  const center = SVG_SIZE / 2;

  if (levelNum >= 5 && levelNum % 2 === 0) {
    // Double-row convex stadium bridge layout (strictly convex curve along top & bottom)
    const topCount = Math.ceil(count / 2);
    const botCount = count - topCount;
    for (let i = 0; i < topCount; i++) {
      const t = topCount > 1 ? i / (topCount - 1) : 0.5;
      const x = 52 + t * (SVG_SIZE - 104);
      const y = 92 - Math.sin(t * Math.PI) * 28;
      pegs.push({ id: i, x, y });
    }
    for (let j = 0; j < botCount; j++) {
      const t = botCount > 1 ? j / (botCount - 1) : 0.5;
      const x = SVG_SIZE - 52 - t * (SVG_SIZE - 104);
      const y = SVG_SIZE - 92 + Math.sin(t * Math.PI) * 28;
      pegs.push({ id: topCount + j, x, y });
    }
    return pegs;
  }

  // Circular / Octagonal ring layout
  const radius = 136;
  for (let i = 0; i < count; i++) {
    const angle = (i * 2 * Math.PI) / count - Math.PI / 2;
    pegs.push({
      id: i,
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    });
  }
  return pegs;
}

// Catalan matching: guarantees K strictly vertex-disjoint, non-crossing chords on 2K cyclic indices
function buildNonCrossingPairs(indices: number[]): [number, number][] {
  if (indices.length < 2) return [];
  const possibleSplits: number[] = [];
  for (let m = 1; m < indices.length; m += 2) {
    possibleSplits.push(m);
  }
  const splitIdx = possibleSplits[Math.floor(Math.random() * possibleSplits.length)];
  const pair: [number, number] = [indices[0], indices[splitIdx]];
  const inside = buildNonCrossingPairs(indices.slice(1, splitIdx));
  const outside = buildNonCrossingPairs(indices.slice(splitIdx + 1));
  return [pair, ...inside, ...outside];
}

function countAllCrossings(pegs: Peg[], ropes: Rope[]): { crossings: CrossingPoint[]; intersectedIds: Set<number> } {
  const crossings: CrossingPoint[] = [];
  const intersectedIds = new Set<number>();

  for (let i = 0; i < ropes.length; i++) {
    for (let j = i + 1; j < ropes.length; j++) {
      const rA = ropes[i];
      const rB = ropes[j];
      if (
        rA.startPegId === rB.startPegId ||
        rA.startPegId === rB.endPegId ||
        rA.endPegId === rB.startPegId ||
        rA.endPegId === rB.endPegId
      ) {
        continue;
      }
      const pA1 = pegs[rA.startPegId];
      const pA2 = pegs[rA.endPegId];
      const pB1 = pegs[rB.startPegId];
      const pB2 = pegs[rB.endPegId];
      if (!pA1 || !pA2 || !pB1 || !pB2) continue;

      const pt = getSegmentIntersection(pA1, pA2, pB1, pB2);
      if (pt) {
        crossings.push({ x: pt.x, y: pt.y, ropeAId: rA.id, ropeBId: rB.id });
        intersectedIds.add(rA.id);
        intersectedIds.add(rB.id);
      }
    }
  }
  return { crossings, intersectedIds };
}

function generateProceduralLevel(levelNum: number): {
  pegs: Peg[];
  ropes: Rope[];
  solutionRopes: Rope[];
} {
  let ropeCount = 3;
  let minCross = 2;
  let maxCross = 3;

  if (levelNum === 1) {
    ropeCount = 3;
    minCross = 2;
    maxCross = 3;
  } else if (levelNum === 2) {
    ropeCount = 4;
    minCross = 3;
    maxCross = 5;
  } else if (levelNum === 3) {
    ropeCount = 5;
    minCross = 5;
    maxCross = 8;
  } else if (levelNum === 4) {
    ropeCount = 6;
    minCross = 7;
    maxCross = 11;
  } else {
    ropeCount = Math.min(8, 6 + Math.floor((levelNum - 5) / 2));
    minCross = 8;
    maxCross = 14;
  }

  const totalPegs = ropeCount * 2 + 2; // Always keep 2 open sockets for smooth play
  const pegs = generatePegLayout(totalPegs, levelNum);

  // Pick 2K cyclic sockets (leaving 2 open sockets) and build 0-crossing solution chords
  const allIndices = Array.from({ length: totalPegs }, (_, i) => i);
  const omit1 = Math.floor(Math.random() * totalPegs);
  const omit2 = (omit1 + Math.floor(totalPegs / 2)) % totalPegs;
  const cyclicActive = allIndices.filter((id) => id !== omit1 && id !== omit2);
  const solvedPairs = buildNonCrossingPairs(cyclicActive);

  const solutionRopes: Rope[] = solvedPairs.map(([u, v], idx) => {
    const pal = ROPE_PALETTE[idx % ROPE_PALETTE.length];
    return {
      id: idx + 1,
      color: pal.color,
      glowColor: pal.glow,
      startPegId: u,
      endPegId: v,
    };
  });

  // Shuffle vertex assignment until crossing count hits [minCross, maxCross]
  let bestRopes = solutionRopes;
  let bestDiff = Infinity;

  for (let attempt = 0; attempt < 150; attempt++) {
    const perm = [...allIndices];
    for (let i = perm.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [perm[i], perm[j]] = [perm[j], perm[i]];
    }

    const candidateRopes = solutionRopes.map((r) => ({
      ...r,
      startPegId: perm[r.startPegId],
      endPegId: perm[r.endPegId],
    }));

    const { crossings } = countAllCrossings(pegs, candidateRopes);
    const c = crossings.length;
    if (c >= minCross && c <= maxCross) {
      bestRopes = candidateRopes;
      break;
    }
    if (c > 0) {
      const mid = (minCross + maxCross) / 2;
      const diff = Math.abs(c - mid);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestRopes = candidateRopes;
      }
    }
  }

  // Fallback safeguard: if random shuffle somehow got 0 crossings, force a simple swap
  if (countAllCrossings(pegs, bestRopes).crossings.length === 0 && bestRopes.length >= 2) {
    bestRopes = bestRopes.map((r, idx) => {
      if (idx === 0) return { ...r, endPegId: bestRopes[1].endPegId };
      if (idx === 1) return { ...r, endPegId: bestRopes[0].endPegId };
      return r;
    });
  }

  return { pegs, ropes: bestRopes, solutionRopes };
}

export const UntangleRopeGame: React.FC<UntangleRopeGameProps> = ({ onBack, onClaimReward }) => {
  const { t } = useTranslation();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragRafRef = useRef<number | null>(null);
  const pendingDragPosRef = useRef<{ clientX: number; clientY: number } | null>(null);

  useEffect(() => {
    return () => {
      if (dragRafRef.current !== null) {
        cancelAnimationFrame(dragRafRef.current);
      }
    };
  }, []);

  const [currentLevelIdx, setCurrentLevelIdx] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('untangle_rope_level');
      return saved ? Math.max(0, parseInt(saved, 10)) : 0;
    } catch {
      return 0;
    }
  });
  const [pegs, setPegs] = useState<Peg[]>([]);
  const [ropes, setRopes] = useState<Rope[]>([]);
  const [solutionRopes, setSolutionRopes] = useState<Rope[]>([]);
  const [moves, setMoves] = useState<number>(0);
  const [selectedEndpoint, setSelectedEndpoint] = useState<{ ropeId: number; isStart: boolean } | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);

  const [soundEnabled, setSoundEnabled] = useState<boolean>(!GameSounds.isSoundMuted());
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  const [showWinModal, setShowWinModal] = useState<boolean>(false);
  const [rewardAmount, setRewardAmount] = useState<number>(0);
  const [hintMove, setHintMove] = useState<HintMove | null>(null);

  const loadLevel = useCallback((lvlIdx: number) => {
    const levelNum = lvlIdx + 1;
    const { pegs: newPegs, ropes: newRopes, solutionRopes: sol } = generateProceduralLevel(levelNum);
    setPegs(newPegs);
    setRopes(newRopes);
    setSolutionRopes(sol);
    setMoves(0);
    setSelectedEndpoint(null);
    setDragState(null);
    setShowWinModal(false);
    setHintMove(null);
  }, []);

  useEffect(() => {
    loadLevel(currentLevelIdx);
    try {
      localStorage.setItem('untangle_rope_level', String(currentLevelIdx));
    } catch {
      /* ignore storage errors */
    }
  }, [currentLevelIdx, loadLevel]);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    GameSounds.setMuted(!next);
  };

  // Occupied map (1 endpoint per socket!)
  const occupiedPegMap = useMemo(() => {
    const map = new Map<number, { ropeId: number; isStart: boolean; rope: Rope }>();
    ropes.forEach((r) => {
      map.set(r.startPegId, { ropeId: r.id, isStart: true, rope: r });
      map.set(r.endPegId, { ropeId: r.id, isStart: false, rope: r });
    });
    return map;
  }, [ropes]);

  // Live ropes incorporating drag preview snap if hovering an empty socket
  const displayRopes = useMemo(() => {
    if (!dragState || dragState.hoverPegId === null) return ropes;
    return ropes.map((r) => {
      if (r.id !== dragState.ropeId) return r;
      return dragState.isStart
        ? { ...r, startPegId: dragState.hoverPegId! }
        : { ...r, endPegId: dragState.hoverPegId! };
    });
  }, [ropes, dragState]);

  const { crossings: crossingPoints, intersectedIds: intersectedRopeIds } = useMemo(
    () => countAllCrossings(pegs, displayRopes),
    [pegs, displayRopes]
  );

  const committedCrossings = useMemo(() => countAllCrossings(pegs, ropes).crossings.length, [pegs, ropes]);
  const clearRopesCount = ropes.length - intersectedRopeIds.size;

  // Check Win Condition when committed crossings reach 0
  useEffect(() => {
    if (ropes.length > 0 && committedCrossings === 0 && !showWinModal && !dragState) {
      GameSounds.playWinFanfare();
      const reward = 100 + (currentLevelIdx + 1) * 25;
      setRewardAmount(reward);
      const timer = setTimeout(() => {
        setShowWinModal(true);
      }, 550);
      return () => clearTimeout(timer);
    }
  }, [committedCrossings, ropes.length, showWinModal, currentLevelIdx, dragState]);

  // Convert client pointer position to 0..360 SVG coordinates
  const clientToSvg = (clientX: number, clientY: number): { x: number; y: number } => {
    const svg = svgRef.current;
    if (!svg) return { x: 180, y: 180 };
    const rect = svg.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * SVG_SIZE,
      y: ((clientY - rect.top) / rect.height) * SVG_SIZE,
    };
  };

  const findNearestEmptySocket = (x: number, y: number, originPegId: number): number | null => {
    let bestId: number | null = null;
    let bestDist = SNAP_RADIUS;
    for (const peg of pegs) {
      if (peg.id !== originPegId && occupiedPegMap.has(peg.id)) continue;
      if (peg.id === originPegId) continue;
      const d = Math.hypot(x - peg.x, y - peg.y);
      if (d < bestDist) {
        bestDist = d;
        bestId = peg.id;
      }
    }
    return bestId;
  };

  const moveKnotToSocket = useCallback((ropeId: number, isStart: boolean, targetPegId: number) => {
    setRopes((prev) =>
      prev.map((r) => {
        if (r.id !== ropeId) return r;
        return isStart ? { ...r, startPegId: targetPegId } : { ...r, endPegId: targetPegId };
      })
    );
    setMoves((m) => m + 1);
    setSelectedEndpoint(null);
    setHintMove(null);
    GameSounds.playCorrect();
  }, []);

  const handleKnotPointerDown = (e: React.PointerEvent, ropeId: number, isStart: boolean, pegId: number) => {
    e.stopPropagation();
    if (showWinModal) return;
    if (svgRef.current) {
      try {
        svgRef.current.setPointerCapture(e.pointerId);
      } catch {
        /* ignore pointer capture errors */
      }
    }
    const svgPt = clientToSvg(e.clientX, e.clientY);
    GameSounds.playTap();
    setDragState({
      ropeId,
      isStart,
      originPegId: pegId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      curX: svgPt.x,
      curY: svgPt.y,
      moved: false,
      hoverPegId: null,
    });
  };

  const handleSvgPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragState) return;
    pendingDragPosRef.current = { clientX: e.clientX, clientY: e.clientY };
    if (dragRafRef.current !== null) return;

    dragRafRef.current = requestAnimationFrame(() => {
      dragRafRef.current = null;
      const pt = pendingDragPosRef.current;
      pendingDragPosRef.current = null;
      if (!pt) return;
      const svgPt = clientToSvg(pt.clientX, pt.clientY);

      setDragState((prev) => {
        if (!prev) return null;
        const clientMoved = Math.hypot(pt.clientX - prev.startClientX, pt.clientY - prev.startClientY) > 7;
        const hoverPegId = findNearestEmptySocket(svgPt.x, svgPt.y, prev.originPegId);
        return {
          ...prev,
          curX: svgPt.x,
          curY: svgPt.y,
          moved: prev.moved || clientMoved,
          hoverPegId,
        };
      });
    });
  };

  const handleSvgPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (dragRafRef.current !== null) {
      cancelAnimationFrame(dragRafRef.current);
      dragRafRef.current = null;
    }
    pendingDragPosRef.current = null;
    if (!dragState) return;
    if (svgRef.current) {
      try {
        svgRef.current.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    }

    const wasMoved =
      dragState.moved || Math.hypot(e.clientX - dragState.startClientX, e.clientY - dragState.startClientY) > 7;
    if (wasMoved) {
      const svgPt = clientToSvg(e.clientX, e.clientY);
      const dropPegId = dragState.hoverPegId ?? findNearestEmptySocket(svgPt.x, svgPt.y, dragState.originPegId);
      if (dropPegId !== null) {
        moveKnotToSocket(dragState.ropeId, dragState.isStart, dropPegId);
      }
    } else {
      // Short tap: toggle knot selection for tap-to-move accessibility
      setSelectedEndpoint((prev) =>
        prev && prev.ropeId === dragState.ropeId && prev.isStart === dragState.isStart
          ? null
          : { ropeId: dragState.ropeId, isStart: dragState.isStart }
      );
    }
    setDragState(null);
  };

  const handleEmptySocketClick = (pegId: number) => {
    if (showWinModal || occupiedPegMap.has(pegId)) return;
    if (selectedEndpoint) {
      moveKnotToSocket(selectedEndpoint.ropeId, selectedEndpoint.isStart, pegId);
    }
  };

  // Real 1-Step Greedy Solver + Solution Fallback for Hint Arrow
  const handleHint = () => {
    if (committedCrossings === 0) return;
    GameSounds.playFiftyFifty();

    const emptyPegIds = pegs.filter((p) => !occupiedPegMap.has(p.id)).map((p) => p.id);
    let bestMove: HintMove | null = null;
    let bestCrossCount = committedCrossings;

    for (const r of ropes) {
      for (const isStart of [true, false]) {
        const fromId = isStart ? r.startPegId : r.endPegId;
        for (const toId of emptyPegIds) {
          const testRopes = ropes.map((tr) =>
            tr.id === r.id ? (isStart ? { ...tr, startPegId: toId } : { ...tr, endPegId: toId }) : tr
          );
          const count = countAllCrossings(pegs, testRopes).crossings.length;
          if (count < bestCrossCount) {
            bestCrossCount = count;
            bestMove = { fromPegId: fromId, toPegId: toId };
          }
        }
      }
    }

    // Fallback: move a knot that participates in crossings toward an open socket
    if (!bestMove && emptyPegIds.length > 0) {
      for (const r of ropes) {
        if (intersectedRopeIds.has(r.id)) {
          const sol = solutionRopes.find((sr) => sr.id === r.id);
          if (sol && emptyPegIds.includes(sol.startPegId) && r.startPegId !== sol.startPegId) {
            bestMove = { fromPegId: r.startPegId, toPegId: sol.startPegId };
            break;
          }
          if (sol && emptyPegIds.includes(sol.endPegId) && r.endPegId !== sol.endPegId) {
            bestMove = { fromPegId: r.endPegId, toPegId: sol.endPegId };
            break;
          }
          bestMove = { fromPegId: r.startPegId, toPegId: emptyPegIds[0] };
          break;
        }
      }
    }

    setHintMove(bestMove);
  };

  const handleNextLevel = () => {
    setCurrentLevelIdx((l) => l + 1);
  };

  const claimReward = () => {
    if (onClaimReward && rewardAmount > 0) {
      onClaimReward(rewardAmount);
    }
    setShowWinModal(false);
    handleNextLevel();
  };

  return (
    <div className="h-[100dvh] bg-slate-950 text-white flex flex-col overflow-hidden overscroll-none font-sans select-none">
      <GameHeader
        title={t('games.untangle.title')}
        subtitle={t('games.untangle.level_label', { level: currentLevelIdx + 1 })}
        onBack={onBack}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
        onRestart={() => loadLevel(currentLevelIdx)}
        restartTooltip={t('games.memory.btn_restart')}
        onHelp={() => setShowTutorial(true)}
      />

      {/* ── MAIN STAGE ── */}
      <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain max-w-md mx-auto w-full px-3 py-3 pb-4 flex flex-col items-center justify-center gap-3">
        {/* Status & Hint Bar */}
        <div className="w-full bg-slate-900/90 border border-slate-800 px-3.5 py-2.5 rounded-2xl shadow-lg flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-purple-600 text-white font-black text-xs px-2.5 py-1 rounded-xl shadow-xs">
              Lvl {currentLevelIdx + 1}
            </span>
            <span
              className={`text-xs font-black tracking-wide ${
                crossingPoints.length > 0 ? 'text-rose-400' : 'text-emerald-400 animate-pulse'
              }`}
            >
              {crossingPoints.length > 0
                ? t('games.untangle.crossings', { count: crossingPoints.length })
                : t('games.untangle.completed_no_crossings')}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] font-mono text-slate-300 bg-slate-800 border border-slate-700 px-2 py-1 rounded-lg">
              {t('games.untangle.ropes_clear', { clear: clearRopesCount, total: ropes.length })}
            </span>
            <button
              onClick={handleHint}
              className="px-2.5 py-1 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black rounded-xl text-[11px] shadow-sm flex items-center gap-1 active:scale-95 transition hover:brightness-110"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>{t('games.untangle.btn_hint')}</span>
            </button>
          </div>
        </div>

        {/* ── UNIFIED INTERACTIVE SVG BOARD (0.00px Alignment) ── */}
        <div className="relative w-full max-w-[380px] aspect-square bg-gradient-to-b from-slate-900 via-[#121936] to-slate-950 rounded-3xl border-2 border-slate-800 shadow-2xl p-2 overflow-hidden">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
            onPointerMove={handleSvgPointerMove}
            onPointerUp={handleSvgPointerUp}
            onPointerCancel={() => {
              if (dragRafRef.current !== null) {
                cancelAnimationFrame(dragRafRef.current);
                dragRafRef.current = null;
              }
              pendingDragPosRef.current = null;
              setDragState(null);
            }}
            className="w-full h-full touch-none select-none"
          >
            <defs>
              <radialGradient id="boardPlate" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#1e293b" stopOpacity="0.65" />
                <stop offset="85%" stopColor="#0f172a" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#020617" stopOpacity="1" />
              </radialGradient>
              <marker id="hintArrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                <path d="M0,1 L7,4 L0,7 Z" fill="#FDE047" />
              </marker>
            </defs>

            {/* Pegboard Base */}
            <circle cx={180} cy={180} r={162} fill="url(#boardPlate)" stroke="rgba(148,163,184,0.18)" strokeWidth="2" />
            <circle cx={180} cy={180} r={136} fill="none" stroke="rgba(148,163,184,0.1)" strokeWidth="1" strokeDasharray="4 6" />
            <circle cx={180} cy={180} r={86} fill="none" stroke="rgba(148,163,184,0.08)" strokeWidth="1" />

            {/* 1. Empty Peg Sockets (Glow when dragging or selecting a knot) */}
            {pegs.map((peg) => {
              const isOccupied = occupiedPegMap.has(peg.id);
              const isOriginOfDrag = dragState?.originPegId === peg.id;
              const isHovered = dragState?.hoverPegId === peg.id;
              const canAcceptDrop = !isOccupied && (Boolean(dragState) || Boolean(selectedEndpoint));

              if (isOccupied && !isOriginOfDrag) {
                return (
                  <circle
                    key={`socket-${peg.id}`}
                    cx={peg.x}
                    cy={peg.y}
                    r={14}
                    fill="#020617"
                    stroke="#334155"
                    strokeWidth={2}
                  />
                );
              }

              return (
                <g
                  key={`socket-empty-${peg.id}`}
                  onClick={() => handleEmptySocketClick(peg.id)}
                  className={canAcceptDrop ? 'cursor-pointer' : ''}
                >
                  {canAcceptDrop && (
                    <circle
                      cx={peg.x}
                      cy={peg.y}
                      r={isHovered ? 22 : 19}
                      fill={isHovered ? 'rgba(250, 204, 21, 0.25)' : 'rgba(250, 204, 21, 0.08)'}
                      stroke="#FACC15"
                      strokeWidth={isHovered ? 2.5 : 1.5}
                      strokeDasharray={isHovered ? undefined : '4 3'}
                    />
                  )}
                  <circle
                    cx={peg.x}
                    cy={peg.y}
                    r={14}
                    fill="#090d1a"
                    stroke={isHovered ? '#FDE047' : canAcceptDrop ? '#F59E0B' : '#475569'}
                    strokeWidth={2}
                    strokeDasharray={!canAcceptDrop ? '3 3' : undefined}
                  />
                  <circle cx={peg.x} cy={peg.y} r={5} fill="#020617" />
                </g>
              );
            })}

            {/* 2. Braided Multi-Color Ropes */}
            {ropes.map((rope) => {
              const pStart = pegs[rope.startPegId];
              const pEnd = pegs[rope.endPegId];
              if (!pStart || !pEnd) return null;

              const isDraggingThis = dragState && dragState.ropeId === rope.id && dragState.moved;
              const hoverPeg = isDraggingThis && dragState.hoverPegId !== null ? pegs[dragState.hoverPegId] : null;

              const x1 = isDraggingThis && dragState.isStart ? (hoverPeg ? hoverPeg.x : dragState.curX) : pStart.x;
              const y1 = isDraggingThis && dragState.isStart ? (hoverPeg ? hoverPeg.y : dragState.curY) : pStart.y;
              const x2 = isDraggingThis && !dragState.isStart ? (hoverPeg ? hoverPeg.x : dragState.curX) : pEnd.x;
              const y2 = isDraggingThis && !dragState.isStart ? (hoverPeg ? hoverPeg.y : dragState.curY) : pEnd.y;

              const isIntersected = intersectedRopeIds.has(rope.id);
              const isSelected = selectedEndpoint?.ropeId === rope.id || isDraggingThis;

              return (
                <g key={`rope-${rope.id}`} className="pointer-events-none">
                  {/* Dark Shadow Depth */}
                  <line x1={x1} y1={y1 + 2} x2={x2} y2={y2 + 2} stroke="rgba(0,0,0,0.6)" strokeWidth={11} strokeLinecap="round" />

                  {/* Clear Status Halo or Selected Glow */}
                  {(!isIntersected || isSelected) && (
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={isSelected ? 'rgba(253,224,71,0.55)' : 'rgba(52,211,153,0.35)'}
                      strokeWidth={13}
                      strokeLinecap="round"
                    />
                  )}

                  {/* Vivid Outer Rope Sheath */}
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={rope.color}
                    strokeWidth={7.5}
                    strokeLinecap="round"
                  />

                  {/* Braided Twisted Weave Pattern */}
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="rgba(255,255,255,0.42)"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeDasharray="6 6"
                  />
                </g>
              );
            })}

            {/* 3. Exact Geometric Intersection Markers (Pulsing Crimson Halo + White ✕) */}
            {crossingPoints.map((cp, idx) => (
              <g key={`cross-${idx}-${cp.ropeAId}-${cp.ropeBId}`} className="pointer-events-none">
                <circle cx={cp.x} cy={cp.y} r={13} fill="rgba(239, 68, 68, 0.35)" />
                <circle cx={cp.x} cy={cp.y} r={8.5} fill="#DC2626" stroke="#FFFFFF" strokeWidth={1.6} />
                <path
                  d={`M ${cp.x - 3.2} ${cp.y - 3.2} L ${cp.x + 3.2} ${cp.y + 3.2} M ${cp.x + 3.2} ${cp.y - 3.2} L ${cp.x - 3.2} ${cp.y + 3.2}`}
                  stroke="#FFFFFF"
                  strokeWidth={2}
                  strokeLinecap="round"
                />
              </g>
            ))}

            {/* 4. Hint Arrow Overlay */}
            {hintMove && pegs[hintMove.fromPegId] && pegs[hintMove.toPegId] && (
              <g className="pointer-events-none">
                <line
                  x1={pegs[hintMove.fromPegId].x}
                  y1={pegs[hintMove.fromPegId].y}
                  x2={pegs[hintMove.toPegId].x}
                  y2={pegs[hintMove.toPegId].y}
                  stroke="#FDE047"
                  strokeWidth={3.5}
                  strokeDasharray="7 5"
                  markerEnd="url(#hintArrow)"
                />
                <circle
                  cx={pegs[hintMove.toPegId].x}
                  cy={pegs[hintMove.toPegId].y}
                  r={18}
                  fill="none"
                  stroke="#FDE047"
                  strokeWidth={2.5}
                />
              </g>
            )}

            {/* 5. Draggable Knot Handle Caps (1 Endpoint per Socket) */}
            {ropes.map((rope) =>
              ([true, false] as const).map((isStart) => {
                const pegId = isStart ? rope.startPegId : rope.endPegId;
                const peg = pegs[pegId];
                if (!peg) return null;

                const isDraggingThis =
                  dragState && dragState.ropeId === rope.id && dragState.isStart === isStart && dragState.moved;
                const hoverPeg = isDraggingThis && dragState.hoverPegId !== null ? pegs[dragState.hoverPegId] : null;
                const cx = isDraggingThis ? (hoverPeg ? hoverPeg.x : dragState.curX) : peg.x;
                const cy = isDraggingThis ? (hoverPeg ? hoverPeg.y : dragState.curY) : peg.y;

                const isSelected =
                  selectedEndpoint?.ropeId === rope.id && selectedEndpoint.isStart === isStart;
                const isClear = !intersectedRopeIds.has(rope.id);

                return (
                  <g
                    key={`knot-${rope.id}-${isStart ? 's' : 'e'}`}
                    onPointerDown={(e) => handleKnotPointerDown(e, rope.id, isStart, pegId)}
                    className="cursor-grab active:cursor-grabbing"
                  >
                    {/* Generous invisible hit area for thumb ergonomics */}
                    <circle cx={cx} cy={cy} r={21} fill="transparent" />

                    {(isSelected || isDraggingThis) && (
                      <circle cx={cx} cy={cy} r={18} fill="rgba(253, 224, 71, 0.3)" stroke="#FDE047" strokeWidth={2} />
                    )}

                    <circle
                      cx={cx}
                      cy={cy}
                      r={isDraggingThis ? 14 : 12.5}
                      fill={rope.color}
                      stroke={isSelected || isDraggingThis ? '#FFFFFF' : isClear ? '#A7F3D0' : '#F8FAFC'}
                      strokeWidth={2.4}
                    />
                    <circle cx={cx - 3} cy={cy - 3} r={3.5} fill="rgba(255,255,255,0.45)" />
                  </g>
                );
              })
            )}
          </svg>
        </div>

        {/* Footer Moves & Drag Hint */}
        <div className="w-full max-w-[380px] flex items-center justify-between px-1">
          <span className="text-[11px] font-mono font-bold text-slate-300 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-xl">
            {t('games.untangle.moves_label', { count: moves })}
          </span>
          <p className="text-[11px] text-slate-400 text-right truncate ml-2">{t('games.untangle.drag_hint')}</p>
        </div>
      </main>

      {/* ── WIN STAGE REWARD MODAL ── */}
      {showWinModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border-2 border-purple-500/70 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl relative overflow-hidden">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-purple-600 to-pink-500 text-white flex items-center justify-center text-3xl mx-auto shadow-xl animate-bounce">
              🪢
            </div>
            <div>
              <h3 className="text-lg font-black text-white">{t('games.untangle.win_title')}</h3>
              <p className="text-xs text-slate-400 mt-1">
                {t('games.untangle.level_label', { level: currentLevelIdx + 1 })} • {t('games.untangle.moves_label', { count: moves })}
              </p>
              <div className="text-3xl font-black text-amber-400 font-mono mt-2 flex items-center justify-center gap-1.5">
                <Sparkles className="w-6 h-6 text-yellow-300 animate-spin" />
                <span>+{rewardAmount}</span>
                <span className="text-sm font-bold text-amber-200">{t('nav.points_unit')}</span>
              </div>
            </div>
            <button
              onClick={claimReward}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-black rounded-xl text-sm shadow-lg active:scale-95 transition"
            >
              {t('games.untangle.btn_next_level')}
            </button>
          </div>
        </div>
      )}

      {/* ── GAME TUTORIAL MODAL ── */}
      <GameTutorialModal
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
        gameTitle={t('games.untangle.title')}
        gameIcon="🪢"
        goal={t('games.untangle.tutorial.goal')}
        controls={t('games.untangle.tutorial.controls')}
        scoring={t('games.untangle.tutorial.scoring')}
        tips={t('games.untangle.tutorial.tips')}
      />
    </div>
  );
};
