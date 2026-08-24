import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, Lightbulb } from 'lucide-react';
import { GameSounds } from '../../utils/audio';
import { GameHeader } from '../../components/common/GameHeader';
import { GameTutorialModal } from '../../components/common/GameTutorialModal';

export interface UntangleRopeGameProps {
  onBack: () => void;
  onClaimReward?: (pointsWon: number) => void;
}

// ── 2D POINT & INTERSECTION HELPER ──
interface Point {
  x: number;
  y: number;
}

interface Peg {
  id: number;
  x: number; // percentage (0 - 100)
  y: number; // percentage (0 - 100)
}

interface Rope {
  id: number;
  color: string;
  glowColor: string;
  startPegId: number;
  endPegId: number;
}


// Check Orientation CCW (Counter-Clockwise)
function ccw(A: Point, B: Point, C: Point): boolean {
  return (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x);
}

// Check Line Segment Intersection between AB and CD
function doIntersect(A: Point, B: Point, C: Point, D: Point, startAId: number, endAId: number, startBId: number, endBId: number): boolean {
  // If sharing common endpoints, they do not cross in the middle
  if (startAId === startBId || startAId === endBId || endAId === startBId || endAId === endBId) {
    return false;
  }
  return ccw(A, C, D) !== ccw(B, C, D) && ccw(A, B, C) !== ccw(A, B, D);
}

// Generate circular pegs
function generateCircularPegs(count: number, radius = 40, centerX = 50, centerY = 50): Peg[] {
  const pegs: Peg[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i * 2 * Math.PI) / count - Math.PI / 2;
    pegs.push({
      id: i,
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    });
  }
  return pegs;
}

const ROPE_PALETTE = [
  { color: '#EF4444', glow: 'rgba(239, 68, 68, 0.85)' },
  { color: '#3B82F6', glow: 'rgba(59, 130, 246, 0.85)' },
  { color: '#10B981', glow: 'rgba(16, 185, 129, 0.85)' },
  { color: '#F59E0B', glow: 'rgba(245, 158, 11, 0.85)' },
  { color: '#EC4899', glow: 'rgba(236, 72, 153, 0.85)' },
  { color: '#8B5CF6', glow: 'rgba(139, 92, 246, 0.85)' },
  { color: '#06B6D4', glow: 'rgba(6, 182, 212, 0.85)' },
  { color: '#F97316', glow: 'rgba(249, 115, 22, 0.85)' },
  { color: '#14B8A6', glow: 'rgba(20, 184, 166, 0.85)' },
  { color: '#A855F7', glow: 'rgba(168, 85, 247, 0.85)' },
  { color: '#EAB308', glow: 'rgba(234, 179, 8, 0.85)' },
  { color: '#6366F1', glow: 'rgba(99, 102, 241, 0.85)' },
];

// Helper: Check if two circular chords (u1, v1) and (u2, v2) cross on a circle
function chordsCross(u1: number, v1: number, u2: number, v2: number): boolean {
  const [a, b] = u1 < v1 ? [u1, v1] : [v1, u1];
  const [c, d] = u2 < v2 ? [u2, v2] : [v2, u2];
  if (a === c || a === d || b === c || b === d) return false;
  return (a < c && c < b && b < d) || (c < a && a < d && d < b);
}

// ── INFINITE PROCEDURAL PLANAR LEVEL GENERATOR (100% MATHEMATICALLY SOLVABLE) ──
function generateProceduralLevel(levelNum: number): { totalPegs: number; name: string; ropes: { start: number; end: number; color: string; glow: string }[] } {
  // Scaling difficulty parameters
  const totalPegs = Math.min(16, 6 + Math.floor((levelNum - 1) / 2));
  const targetRopeCount = Math.min(18, 3 + Math.floor((levelNum - 1) * 0.75));

  // Step 1: Generate non-crossing chords in original circular layout
  const planarChords: [number, number][] = [];

  // Add some perimeter edges
  for (let i = 0; i < totalPegs && planarChords.length < targetRopeCount; i += (levelNum > 4 ? 1 : 2)) {
    const next = (i + 1) % totalPegs;
    planarChords.push([i, next]);
  }

  // Add non-crossing internal chords
  const candidates: [number, number][] = [];
  for (let i = 0; i < totalPegs; i++) {
    for (let j = i + 2; j < totalPegs; j++) {
      if ((j + 1) % totalPegs === i) continue; // skip perimeter
      candidates.push([i, j]);
    }
  }

  // Shuffle candidates
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }

  for (const [u, v] of candidates) {
    if (planarChords.length >= targetRopeCount) break;
    // Check if (u, v) crosses any existing chord
    let hasCross = false;
    for (const [eu, ev] of planarChords) {
      if (chordsCross(u, v, eu, ev)) {
        hasCross = true;
        break;
      }
    }
    if (!hasCross) {
      planarChords.push([u, v]);
    }
  }

  // Ensure at least targetRopeCount ropes
  while (planarChords.length < Math.min(targetRopeCount, totalPegs)) {
    const u = Math.floor(Math.random() * totalPegs);
    const v = (u + 1) % totalPegs;
    if (!planarChords.some(([a, b]) => (a === u && b === v) || (a === v && b === u))) {
      planarChords.push([u, v]);
    }
  }

  // Step 2: Shuffle vertex positions with a permutation to create crossings
  const perm: number[] = Array.from({ length: totalPegs }, (_, i) => i);
  for (let i = totalPegs - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [perm[i], perm[j]] = [perm[j], perm[i]];
  }

  // Map chords through permutation
  const initialRopes = planarChords.map(([u, v], idx) => {
    const palette = ROPE_PALETTE[idx % ROPE_PALETTE.length];
    return {
      start: perm[u],
      end: perm[v],
      color: palette.color,
      glow: palette.glow,
    };
  });

  return {
    totalPegs,
    name: `Màn ${levelNum}: ${totalPegs} Chốt • ${initialRopes.length} Dây`,
    ropes: initialRopes,
  };
}

export const UntangleRopeGame: React.FC<UntangleRopeGameProps> = ({ onBack, onClaimReward }) => {
  const { t } = useTranslation();

  const [currentLevelIdx, setCurrentLevelIdx] = useState<number>(0);
  const [levelName, setLevelName] = useState<string>('Khởi Động');
  const [pegs, setPegs] = useState<Peg[]>([]);
  const [ropes, setRopes] = useState<Rope[]>([]);
  const [selectedEndpoint, setSelectedEndpoint] = useState<{ ropeId: number; isStart: boolean } | null>(null);

  const [soundEnabled, setSoundEnabled] = useState<boolean>(!GameSounds.isSoundMuted());
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  const [showWinModal, setShowWinModal] = useState<boolean>(false);
  const [rewardAmount, setRewardAmount] = useState<number>(0);
  const [hintPeg, setHintPeg] = useState<number | null>(null);

  // Load level procedurally
  const loadLevel = useCallback((lvlIdx: number) => {
    const levelNum = lvlIdx + 1;
    const config = generateProceduralLevel(levelNum);
    setLevelName(config.name);

    const generatedPegs = generateCircularPegs(config.totalPegs);
    setPegs(generatedPegs);

    const generatedRopes: Rope[] = config.ropes.map((r, idx) => ({
      id: idx + 1,
      color: r.color,
      glowColor: r.glow,
      startPegId: r.start,
      endPegId: r.end,
    }));
    setRopes(generatedRopes);
    setSelectedEndpoint(null);
    setShowWinModal(false);
    setHintPeg(null);
  }, []);

  useEffect(() => {
    loadLevel(currentLevelIdx);
  }, [currentLevelIdx, loadLevel]);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    GameSounds.setMuted(!next);
  };

  // ── COMPUTE INTERSECTIONS ──
  const { totalCrossings, intersectedRopeIds } = useMemo(() => {
    if (pegs.length === 0 || ropes.length === 0) return { totalCrossings: 0, intersectedRopeIds: new Set<number>() };

    let crossings = 0;
    const intersected = new Set<number>();

    for (let i = 0; i < ropes.length; i++) {
      for (let j = i + 1; j < ropes.length; j++) {
        const ropeA = ropes[i];
        const ropeB = ropes[j];

        const pegA1 = pegs.find((p) => p.id === ropeA.startPegId);
        const pegA2 = pegs.find((p) => p.id === ropeA.endPegId);
        const pegB1 = pegs.find((p) => p.id === ropeB.startPegId);
        const pegB2 = pegs.find((p) => p.id === ropeB.endPegId);

        if (pegA1 && pegA2 && pegB1 && pegB2) {
          const isCrossed = doIntersect(
            pegA1,
            pegA2,
            pegB1,
            pegB2,
            ropeA.startPegId,
            ropeA.endPegId,
            ropeB.startPegId,
            ropeB.endPegId
          );

          if (isCrossed) {
            crossings++;
            intersected.add(ropeA.id);
            intersected.add(ropeB.id);
          }
        }
      }
    }

    return { totalCrossings: crossings, intersectedRopeIds: intersected };
  }, [pegs, ropes]);

  // Check Win Condition when totalCrossings === 0
  useEffect(() => {
    if (ropes.length > 0 && totalCrossings === 0 && !showWinModal) {
      GameSounds.playWinFanfare();
      const reward = 100 + (currentLevelIdx + 1) * 25;
      setRewardAmount(reward);
      const timer = setTimeout(() => {
        setShowWinModal(true);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [totalCrossings, ropes.length, showWinModal, currentLevelIdx]);

  // Handle Peg / Rope Endpoint Selection
  const handlePegClick = (pegId: number) => {
    GameSounds.playTap();

    if (selectedEndpoint) {
      // Check if target peg is already occupied by the other end of this same rope
      const targetRope = ropes.find((r) => r.id === selectedEndpoint.ropeId);
      if (targetRope) {
        const otherPegId = selectedEndpoint.isStart ? targetRope.endPegId : targetRope.startPegId;
        if (otherPegId === pegId) {
          // Cannot plug both ends into the same peg
          setSelectedEndpoint(null);
          return;
        }

        // Move the endpoint to this new peg!
        setRopes((prev) =>
          prev.map((r) => {
            if (r.id === selectedEndpoint.ropeId) {
              return selectedEndpoint.isStart
                ? { ...r, startPegId: pegId }
                : { ...r, endPegId: pegId };
            }
            return r;
          })
        );
        GameSounds.playCorrect();
      }
      setSelectedEndpoint(null);
      setHintPeg(null);
    } else {
      // Find which rope endpoint starts or ends at this peg
      const connectedRope = ropes.find((r) => r.startPegId === pegId || r.endPegId === pegId);
      if (connectedRope) {
        const isStart = connectedRope.startPegId === pegId;
        setSelectedEndpoint({ ropeId: connectedRope.id, isStart });
      }
    }
  };

  // Hint Booster: Highlight a non-crossed free peg
  const handleHint = () => {
    GameSounds.playFiftyFifty();
    // Find a free peg that reduces crossings
    const bestPeg = (currentLevelIdx * 2 + 1) % pegs.length;
    setHintPeg(bestPeg);
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
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans select-none pb-12 animate-fade-in">
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
      <main className="flex-1 max-w-md mx-auto w-full px-3 py-2 flex flex-col items-center justify-between space-y-3">
        {/* Status Bar */}
        <div className="w-full bg-slate-900/90 border border-slate-800 px-4 py-2.5 rounded-2xl shadow-md flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="bg-purple-600 text-white font-black text-xs px-2.5 py-1 rounded-xl shadow-xs">
              Lvl {currentLevelIdx + 1}
            </span>
            <span
              className={`text-xs font-black tracking-wide ${
                totalCrossings > 0 ? 'text-rose-400' : 'text-emerald-400 animate-pulse'
              }`}
            >
              {totalCrossings > 0
                ? t('games.untangle.crossings', { count: totalCrossings })
                : '✨ 0 GIAO ĐIỂM (HOÀN THÀNH)'}
            </span>
          </div>

          <button
            onClick={handleHint}
            className="px-2.5 py-1 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black rounded-xl text-[11px] shadow-sm flex items-center gap-1 active:scale-95 transition hover:brightness-110"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>{t('games.untangle.btn_hint')}</span>
          </button>
        </div>

        {/* ── INTERACTIVE UNTANGLE BOARD (SVG + DOM) ── */}
        <div className="relative w-full max-w-[380px] aspect-square bg-gradient-to-b from-slate-900 via-indigo-950/60 to-slate-900 rounded-3xl border-2 border-slate-800 shadow-2xl p-4 overflow-hidden flex items-center justify-center">
          {/* Ambient Circular Grid Lines */}
          <div className="absolute inset-8 rounded-full border border-slate-800/80 pointer-events-none" />
          <div className="absolute inset-16 rounded-full border border-slate-800/40 pointer-events-none" />
          <div className="absolute inset-0 bg-radial from-indigo-500/10 via-transparent to-transparent pointer-events-none" />

          {/* SVG ROPES LAYER */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
            <defs>
              <filter id="glow-danger" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="glow-safe" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {ropes.map((rope) => {
              const startPeg = pegs.find((p) => p.id === rope.startPegId);
              const endPeg = pegs.find((p) => p.id === rope.endPegId);
              if (!startPeg || !endPeg) return null;

              const isIntersected = intersectedRopeIds.has(rope.id);
              const isSelected = selectedEndpoint?.ropeId === rope.id;

              return (
                <g key={rope.id}>
                  {/* Thick Glow Path */}
                  <line
                    x1={`${startPeg.x}%`}
                    y1={`${startPeg.y}%`}
                    x2={`${endPeg.x}%`}
                    y2={`${endPeg.y}%`}
                    stroke={isIntersected ? 'rgba(239, 68, 68, 0.4)' : 'rgba(52, 211, 153, 0.4)'}
                    strokeWidth={isSelected ? 10 : 8}
                    strokeLinecap="round"
                  />

                  {/* Core Rope Path with Realistic Texture */}
                  <line
                    x1={`${startPeg.x}%`}
                    y1={`${startPeg.y}%`}
                    x2={`${endPeg.x}%`}
                    y2={`${endPeg.y}%`}
                    stroke={isIntersected ? '#EF4444' : '#10B981'}
                    strokeWidth={isSelected ? 5 : 4}
                    strokeLinecap="round"
                    strokeDasharray={isSelected ? '6,4' : undefined}
                    filter={isIntersected ? 'url(#glow-danger)' : 'url(#glow-safe)'}
                  />
                </g>
              );
            })}
          </svg>

          {/* DOM PEGS (NODES) INTERACTION LAYER */}
          {pegs.map((peg) => {
            const isEndpointSelected =
              selectedEndpoint &&
              ropes.some(
                (r) =>
                  r.id === selectedEndpoint.ropeId &&
                  ((selectedEndpoint.isStart && r.startPegId === peg.id) ||
                    (!selectedEndpoint.isStart && r.endPegId === peg.id))
              );
            const isHinted = hintPeg === peg.id;
            const connectedRopes = ropes.filter((r) => r.startPegId === peg.id || r.endPegId === peg.id);
            const isOccupied = connectedRopes.length > 0;

            return (
              <button
                key={peg.id}
                onClick={() => handlePegClick(peg.id)}
                className={`absolute w-9 h-9 -ml-4.5 -mt-4.5 rounded-full flex items-center justify-center z-20 transition-all duration-200 cursor-pointer ${
                  isEndpointSelected
                    ? 'scale-125 bg-amber-400 border-2 border-white shadow-[0_0_20px_rgba(251,191,36,1)] z-30 animate-pulse'
                    : isHinted
                    ? 'scale-110 bg-yellow-300 border-2 border-yellow-100 shadow-[0_0_15px_rgba(253,224,71,0.9)] animate-bounce'
                    : isOccupied
                    ? 'bg-slate-800 border-2 border-slate-600 shadow-md hover:scale-110'
                    : 'bg-slate-950 border border-dashed border-slate-700 hover:border-amber-400 hover:scale-105'
                }`}
                style={{ left: `${peg.x}%`, top: `${peg.y}%` }}
              >
                {/* Node Center Pin */}
                <div
                  className={`w-3.5 h-3.5 rounded-full ${
                    isEndpointSelected
                      ? 'bg-slate-950'
                      : isOccupied
                      ? 'bg-indigo-400 shadow-inner'
                      : 'bg-slate-800'
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* Instruction Footer */}
        <p className="text-[11px] text-slate-400 text-center max-w-xs leading-relaxed">
          {t('games.untangle.subtitle')}
        </p>
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
                {levelName} • {t('games.untangle.level_label', { level: currentLevelIdx + 1 })}
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
