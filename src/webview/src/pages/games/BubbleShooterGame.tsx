import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshCw } from 'lucide-react';
import { GameSounds } from '../../utils/audio';
import { GameFXSystem } from '../../utils/game-fx';
import { GameHeader } from '../../components/common/GameHeader';
import { GameTutorialModal } from '../../components/common/GameTutorialModal';

export interface BubbleShooterGameProps {
  onBack: () => void;
  onClaimReward?: (pointsWon: number) => void;
}

const BUBBLE_COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'];
const ROWS = 11;
const COLS_EVEN = 9;
const COLS_ODD = 8;

interface BubbleStageConfig {
  rows: number;
  colorCount: number;
  shots: number;
  dropEveryMisses: number;
}

function getBubbleStageConfig(stageNum: number): BubbleStageConfig {
  if (stageNum === 1) return { rows: 4, colorCount: 4, shots: 24, dropEveryMisses: 0 };
  if (stageNum === 2) return { rows: 5, colorCount: 4, shots: 24, dropEveryMisses: 0 };
  if (stageNum === 3) return { rows: 5, colorCount: 5, shots: 26, dropEveryMisses: 7 };
  if (stageNum === 4) return { rows: 6, colorCount: 5, shots: 28, dropEveryMisses: 6 };
  return {
    rows: stageNum >= 7 ? 7 : 6,
    colorCount: 5,
    shots: Math.min(30, 27 + Math.floor(stageNum / 3)),
    dropEveryMisses: Math.max(4, 6 - Math.floor((stageNum - 4) / 2)),
  };
}

interface BubbleCell {
  r: number;
  c: number;
  color: string;
  active: boolean;
}

interface FallingBubble {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
}

function getRowCols(r: number): number {
  return r % 2 === 1 ? COLS_ODD : COLS_EVEN;
}

function getHexNeighbors(r: number, c: number): { r: number; c: number }[] {
  const isOdd = r % 2 === 1;
  const candidates = isOdd
    ? [
        { r, c: c - 1 },
        { r, c: c + 1 },
        { r: r - 1, c },
        { r: r - 1, c: c + 1 },
        { r: r + 1, c },
        { r: r + 1, c: c + 1 },
      ]
    : [
        { r, c: c - 1 },
        { r, c: c + 1 },
        { r: r - 1, c: c - 1 },
        { r: r - 1, c },
        { r: r + 1, c: c - 1 },
        { r: r + 1, c },
      ];
  return candidates.filter((n) => n.r >= 0 && n.r < ROWS && n.c >= 0 && n.c < getRowCols(n.r));
}

function getBubbleCenter(r: number, c: number, radius: number, topOffset: number): { x: number; y: number } {
  const cellH = radius * Math.sqrt(3);
  const x = (r % 2 === 1 ? radius * 2.5 : radius * 1.5) + c * radius * 2;
  const y = topOffset + r * cellH;
  return { x, y };
}

export const BubbleShooterGame: React.FC<BubbleShooterGameProps> = ({ onBack, onClaimReward }) => {
  const { t } = useTranslation();
  const tRef = useRef(t);
  tRef.current = t;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [stage, setStage] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('bubble_shooter_stage');
      return saved ? Math.max(1, parseInt(saved, 10)) : 1;
    } catch {
      return 1;
    }
  });
  const stageCfg = getBubbleStageConfig(stage);

  const [score, setScore] = useState<number>(0);
  const [shotsLeft, setShotsLeft] = useState<number>(stageCfg.shots);
  const [missesUntilDrop, setMissesUntilDrop] = useState<number>(stageCfg.dropEveryMisses);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(!GameSounds.isSoundMuted());
  const [currentBubbleColor, setCurrentBubbleColor] = useState<string>(BUBBLE_COLORS[0]);
  const [nextBubbleColor, setNextBubbleColor] = useState<string>(BUBBLE_COLORS[1]);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [lossReasonKey, setLossReasonKey] = useState<string>('games.bubble.out_of_shots');
  const [showRewardModal, setShowRewardModal] = useState<boolean>(false);
  const [rewardAmount, setRewardAmount] = useState<number>(0);
  const [showTutorial, setShowTutorial] = useState<boolean>(false);

  // Synced refs so Canvas animation loop NEVER tears down mid-shot!
  const stageRef = useRef<number>(stage);
  stageRef.current = stage;
  const gridRef = useRef<BubbleCell[][]>([]);
  const fallingBubblesRef = useRef<FallingBubble[]>([]);
  const projectileRef = useRef<{ x: number; y: number; vx: number; vy: number; color: string; active: boolean } | null>(null);
  const aimAngleRef = useRef<number>(-Math.PI / 2);
  const isAimingRef = useRef<boolean>(false);
  const recoilRef = useRef<number>(0);
  const fxRef = useRef<GameFXSystem>(new GameFXSystem());
  const frameIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const scoreRef = useRef<number>(0);
  const shotsLeftRef = useRef<number>(stageCfg.shots);
  const missesUntilDropRef = useRef<number>(stageCfg.dropEveryMisses);
  const currentColorRef = useRef<string>(BUBBLE_COLORS[0]);
  const nextColorRef = useRef<string>(BUBBLE_COLORS[1]);
  const isGameOverRef = useRef<boolean>(false);
  const isClearedRef = useRef<boolean>(false);
  const canvasSizeRef = useRef<{ width: number; height: number }>({ width: 360, height: 470 });

  const getActiveBoardColor = useCallback((paletteOverride?: string[]): string => {
    const present = new Set<string>();
    for (const row of gridRef.current) {
      for (const b of row) {
        if (b.active) present.add(b.color);
      }
    }
    const fallbackPool = paletteOverride || BUBBLE_COLORS.slice(0, getBubbleStageConfig(stageRef.current).colorCount);
    const pool = present.size > 0 ? Array.from(present) : fallbackPool;
    return pool[Math.floor(Math.random() * pool.length)];
  }, []);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    GameSounds.setMuted(!next);
  };

  const initGrid = useCallback(
    (targetStageNum?: number) => {
      const activeStage = typeof targetStageNum === 'number' ? targetStageNum : stageRef.current;
      const cfg = getBubbleStageConfig(activeStage);
      const stagePalette = BUBBLE_COLORS.slice(0, cfg.colorCount);

      const newGrid: BubbleCell[][] = [];
      for (let r = 0; r < ROWS; r++) {
        const cols = getRowCols(r);
        const row: BubbleCell[] = [];
        for (let c = 0; c < cols; c++) {
          let color = stagePalette[Math.floor(Math.random() * stagePalette.length)];
          // Clustered neighbor seeding on initial active rows for match-3 chains
          if (r < cfg.rows) {
            const leftNeighbor = c > 0 ? row[c - 1]?.color : null;
            const upNeighbor = r > 0 ? newGrid[r - 1]?.[Math.min(c, getRowCols(r - 1) - 1)]?.color : null;
            if (leftNeighbor && Math.random() < 0.42) color = leftNeighbor;
            else if (upNeighbor && Math.random() < 0.35) color = upNeighbor;
          }
          row.push({
            r,
            c,
            color,
            active: r < cfg.rows,
          });
        }
        newGrid.push(row);
      }

      gridRef.current = newGrid;
      fallingBubblesRef.current = [];
      projectileRef.current = null;
      fxRef.current.clear();
      recoilRef.current = 0;
      lastTimeRef.current = 0;
      aimAngleRef.current = -Math.PI / 2;

      scoreRef.current = 0;
      shotsLeftRef.current = cfg.shots;
      missesUntilDropRef.current = cfg.dropEveryMisses;
      isGameOverRef.current = false;
      isClearedRef.current = false;

      const c1 = getActiveBoardColor(stagePalette);
      const c2 = getActiveBoardColor(stagePalette);
      currentColorRef.current = c1;
      nextColorRef.current = c2;

      setScore(0);
      setShotsLeft(cfg.shots);
      setMissesUntilDrop(cfg.dropEveryMisses);
      setCurrentBubbleColor(c1);
      setNextBubbleColor(c2);
      setIsGameOver(false);
      setShowRewardModal(false);
    },
    [getActiveBoardColor]
  );

  useEffect(() => {
    initGrid(stage);
    try {
      localStorage.setItem('bubble_shooter_stage', String(stage));
    } catch {
      /* ignore storage errors */
    }
  }, [stage, initGrid]);

  // 6-Neighbor Hex BFS for matching color pops
  const findMatches = useCallback((startR: number, startC: number, targetColor: string): { r: number; c: number }[] => {
    const queue: { r: number; c: number }[] = [{ r: startR, c: startC }];
    const visited = new Set<string>([`${startR},${startC}`]);
    const matches: { r: number; c: number }[] = [];

    while (queue.length > 0) {
      const curr = queue.shift()!;
      matches.push(curr);

      for (const n of getHexNeighbors(curr.r, curr.c)) {
        const key = `${n.r},${n.c}`;
        if (!visited.has(key)) {
          const b = gridRef.current[n.r]?.[n.c];
          if (b && b.active && b.color === targetColor) {
            visited.add(key);
            queue.push(n);
          }
        }
      }
    }
    return matches;
  }, []);

  // Ceiling-anchor BFS to drop floating disconnected clusters
  const findFloatingBubbles = useCallback((): { r: number; c: number }[] => {
    const anchored = new Set<string>();
    const queue: { r: number; c: number }[] = [];

    const topRow = gridRef.current[0] || [];
    for (const b of topRow) {
      if (b.active) {
        const key = `0,${b.c}`;
        anchored.add(key);
        queue.push({ r: 0, c: b.c });
      }
    }

    while (queue.length > 0) {
      const curr = queue.shift()!;
      for (const n of getHexNeighbors(curr.r, curr.c)) {
        const key = `${n.r},${n.c}`;
        if (!anchored.has(key)) {
          const b = gridRef.current[n.r]?.[n.c];
          if (b && b.active) {
            anchored.add(key);
            queue.push(n);
          }
        }
      }
    }

    const floating: { r: number; c: number }[] = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < getRowCols(r); c++) {
        const b = gridRef.current[r]?.[c];
        if (b && b.active && !anchored.has(`${r},${c}`)) {
          floating.push({ r, c });
        }
      }
    }
    return floating;
  }, []);

  const swapBubbles = useCallback(() => {
    if (projectileRef.current?.active || isGameOverRef.current || isClearedRef.current) return;
    const prevCurr = currentColorRef.current;
    const prevNext = nextColorRef.current;
    currentColorRef.current = prevNext;
    nextColorRef.current = prevCurr;
    setCurrentBubbleColor(prevNext);
    setNextBubbleColor(prevCurr);
    GameSounds.playTap();
  }, []);

  const shoot = useCallback(() => {
    if (
      projectileRef.current?.active ||
      isGameOverRef.current ||
      isClearedRef.current ||
      shotsLeftRef.current <= 0
    ) {
      return;
    }

    const angle = aimAngleRef.current;
    const speed = 13.5;
    const { width, height } = canvasSizeRef.current;
    const shooterX = width / 2;
    const shooterY = height - 42;

    projectileRef.current = {
      x: shooterX,
      y: shooterY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: currentColorRef.current,
      active: true,
    };

    recoilRef.current = 8;
    fxRef.current.spawnSmokePuff(shooterX, shooterY, 6);
    GameSounds.playTap();

    const nextShots = shotsLeftRef.current - 1;
    shotsLeftRef.current = nextShots;
    setShotsLeft(nextShots);

    const upcomingCurrent = nextColorRef.current;
    const upcomingNext = getActiveBoardColor();
    currentColorRef.current = upcomingCurrent;
    nextColorRef.current = upcomingNext;
    setCurrentBubbleColor(upcomingCurrent);
    setNextBubbleColor(upcomingNext);
  }, [getActiveBoardColor]);

  // Keyboard aim & fire support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        aimAngleRef.current = Math.max(-Math.PI * 0.9, aimAngleRef.current - 0.06);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        aimAngleRef.current = Math.min(-Math.PI * 0.1, aimAngleRef.current + 0.06);
      } else if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        shoot();
      } else if (e.key === 'ArrowUp' || e.key === 'x' || e.key === 'X') {
        e.preventDefault();
        swapBubbles();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shoot, swapBubbles]);

  // Single-mount 60 FPS Canvas Loop (zero teardown on shot!)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = canvas.parentElement?.clientWidth || 360;
    const height = Math.min(window.innerHeight - 190, 490);
    canvasSizeRef.current = { width, height };
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Cache twilight sky backdrop gradient once per setup
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#0c1228');
    bgGrad.addColorStop(0.55, '#131636');
    bgGrad.addColorStop(1, '#1b143b');

    const radius = width / (COLS_EVEN * 2 + 1);
    const topOffset = radius + 8;
    const shooterX = width / 2;
    const shooterY = height - 42;
    const dangerLineY = shooterY - 38;
    lastTimeRef.current = 0;

    // Subtle carnival bokeh stars
    const stars = Array.from({ length: 28 }, (_, i) => ({
      x: ((i * 67 + 23) % Math.max(100, Math.floor(width))),
      y: ((i * 53 + 17) % Math.max(120, Math.floor(height * 0.72))),
      r: 0.8 + (i % 3) * 0.6,
      phase: i * 0.7,
    }));

    const drawGlossyBubble = (x: number, y: number, r: number, color: string) => {
      ctx.save();
      const grad = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, 1.5, x, y, r);
      grad.addColorStop(0, '#FFFFFF');
      grad.addColorStop(0.32, color);
      grad.addColorStop(0.85, color);
      grad.addColorStop(1, '#020617');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, r - 0.8, 0, Math.PI * 2);
      ctx.fill();

      // Top Specular Highlight Glint
      ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
      ctx.beginPath();
      ctx.ellipse(x - r * 0.32, y - r * 0.34, r * 0.32, r * 0.18, -Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();

      // Colorblind-friendly subtle inner motif per color
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.38)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      if (color === '#EF4444') {
        ctx.arc(x, y + 1, r * 0.3, 0, Math.PI * 2);
      } else if (color === '#F59E0B') {
        ctx.moveTo(x, y - r * 0.32);
        ctx.lineTo(x + r * 0.32, y);
        ctx.lineTo(x, y + r * 0.32);
        ctx.lineTo(x - r * 0.32, y);
        ctx.closePath();
      } else if (color === '#10B981') {
        ctx.moveTo(x, y - r * 0.3);
        ctx.lineTo(x + r * 0.28, y + r * 0.24);
        ctx.lineTo(x - r * 0.28, y + r * 0.24);
        ctx.closePath();
      } else if (color === '#3B82F6') {
        ctx.rect(x - r * 0.22, y - r * 0.22, r * 0.44, r * 0.44);
      } else {
        ctx.arc(x, y, r * 0.18, 0, Math.PI * 2);
      }
      ctx.stroke();

      // Bottom Refractive Arc
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.32)';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.arc(x, y, r - 2.5, Math.PI * 0.22, Math.PI * 0.78);
      ctx.stroke();
      ctx.restore();
    };

    const render = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const dtSec = Math.min(0.05, Math.max(0.001, (time - lastTimeRef.current) / 1000));
      const dt60 = dtSec * 60;
      lastTimeRef.current = time;

      recoilRef.current *= Math.pow(0.75, dt60);
      if (recoilRef.current < 0.05) recoilRef.current = 0;

      const shake = fxRef.current.getShakeOffset();
      ctx.save();
      ctx.translate(shake.x, shake.y);

      // 1. Twilight Carnival Gradient Sky Backdrop
      ctx.fillStyle = bgGrad;
      ctx.fillRect(-20, -20, width + 40, height + 40);

      stars.forEach((s) => {
        ctx.fillStyle = `rgba(254, 240, 138, ${0.15 + Math.sin(time * 0.002 + s.phase) * 0.12})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // Top ceiling frame
      ctx.fillStyle = '#F59E0B';
      ctx.fillRect(0, 0, width, 4);

      // Danger Threshold Line above turret
      ctx.save();
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([7, 6]);
      ctx.beginPath();
      ctx.moveTo(10, dangerLineY);
      ctx.lineTo(width - 10, dangerLineY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // 2. Draw Hex Grid Bubbles
      for (let r = 0; r < ROWS; r++) {
        const cols = getRowCols(r);
        for (let c = 0; c < cols; c++) {
          const bubble = gridRef.current[r]?.[c];
          if (bubble && bubble.active) {
            const { x: bx, y: by } = getBubbleCenter(r, c, radius, topOffset);
            drawGlossyBubble(bx, by, radius, bubble.color);
          }
        }
      }

      // 2B. Update & Draw Falling Disconnected Avalanche Bubbles
      const falling = fallingBubblesRef.current;
      for (let i = falling.length - 1; i >= 0; i--) {
        const fb = falling[i];
        fb.vy += 0.34 * dt60;
        fb.x += fb.vx * dt60;
        fb.y += fb.vy * dt60;
        fb.alpha -= 0.015 * dt60;
        if (fb.y > height + 30 || fb.alpha <= 0) {
          falling.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.globalAlpha = Math.max(0, fb.alpha);
        drawGlossyBubble(fb.x, fb.y, radius * 0.92, fb.color);
        ctx.restore();
      }

      // 3. Sub-stepped Framerate-Independent Projectile Physics (Zero Vanishing Guarantee)
      const proj = projectileRef.current;
      if (proj && proj.active) {
        const steps = 4;
        const stepDt = dt60 / steps;
        let collided = false;

        for (let s = 0; s < steps; s++) {
          proj.x += proj.vx * stepDt;
          proj.y += proj.vy * stepDt;

          // Clamped Wall Bounce
          if (proj.x <= radius) {
            proj.x = radius;
            proj.vx = Math.abs(proj.vx);
            GameSounds.playTap();
          } else if (proj.x >= width - radius) {
            proj.x = width - radius;
            proj.vx = -Math.abs(proj.vx);
            GameSounds.playTap();
          }

          if (proj.y <= topOffset + 2) {
            proj.y = topOffset;
            collided = true;
            break;
          }

          for (let r = 0; r < ROWS; r++) {
            const cols = getRowCols(r);
            for (let c = 0; c < cols; c++) {
              const b = gridRef.current[r]?.[c];
              if (b && b.active) {
                const { x: bx, y: by } = getBubbleCenter(r, c, radius, topOffset);
                if (Math.hypot(proj.x - bx, proj.y - by) < radius * 1.86) {
                  collided = true;
                  break;
                }
              }
            }
            if (collided) break;
          }
          if (collided) break;
        }

        if (collided) {
          proj.active = false;
          projectileRef.current = null;

          // Scan ALL currently empty valid hex cells and pick exact nearest empty cell
          let bestCell: { r: number; c: number; dist: number; x: number; y: number } | null = null;
          for (let r = 0; r < ROWS; r++) {
            const cols = getRowCols(r);
            for (let c = 0; c < cols; c++) {
              const cell = gridRef.current[r]?.[c];
              if (cell && !cell.active) {
                const { x: cx, y: cy } = getBubbleCenter(r, c, radius, topOffset);
                const d = Math.hypot(proj.x - cx, proj.y - cy);
                if (!bestCell || d < bestCell.dist) {
                  bestCell = { r, c, dist: d, x: cx, y: cy };
                }
              }
            }
          }

          if (bestCell && gridRef.current[bestCell.r]?.[bestCell.c]) {
            const { r: snapR, c: snapC, x: snapX, y: snapY } = bestCell;
            gridRef.current[snapR][snapC] = { r: snapR, c: snapC, color: proj.color, active: true };

            const matches = findMatches(snapR, snapC, proj.color);
            if (matches.length >= 3) {
              GameSounds.playEggCrack();
              matches.forEach((m) => {
                const { x: bx, y: by } = getBubbleCenter(m.r, m.c, radius, topOffset);
                fxRef.current.spawnCrystalShards(bx, by, 9, gridRef.current[m.r][m.c].color);
                fxRef.current.spawnSparkles(bx, by, 5, '#FEF08A');
                gridRef.current[m.r][m.c].active = false;
              });

              let gain = matches.length * 25;

              // Avalanche drop for disconnected clusters
              const floating = findFloatingBubbles();
              if (floating.length > 0) {
                const dropBonus = floating.length * 45;
                gain += dropBonus;
                floating.forEach((f) => {
                  const cell = gridRef.current[f.r][f.c];
                  const { x: fx, y: fy } = getBubbleCenter(f.r, f.c, radius, topOffset);
                  fallingBubblesRef.current.push({
                    x: fx,
                    y: fy,
                    vx: (Math.random() - 0.5) * 2.4,
                    vy: -1.5,
                    color: cell.color,
                    alpha: 1,
                  });
                  cell.active = false;
                });
                fxRef.current.spawnFloatText(
                  width / 2,
                  height * 0.45,
                  tRef.current('games.bubble.avalanche_fx', { pts: dropBonus }),
                  '#34D399'
                );
                GameSounds.playCoinRain();
              }

              scoreRef.current += gain;
              setScore(scoreRef.current);
              fxRef.current.spawnFloatText(snapX, snapY - 12, `+${gain} 🔥`, '#F59E0B');
              fxRef.current.addScreenShake(0.24);
            } else {
              GameSounds.playTap();
              const curStageCfg = getBubbleStageConfig(stageRef.current);
              if (curStageCfg.dropEveryMisses > 0) {
                missesUntilDropRef.current -= 1;
                if (missesUntilDropRef.current <= 0) {
                  missesUntilDropRef.current = curStageCfg.dropEveryMisses;
                  const stagePalette = BUBBLE_COLORS.slice(0, curStageCfg.colorCount);
                  const shifted: BubbleCell[][] = [];
                  const newTopRow: BubbleCell[] = [];
                  for (let c = 0; c < getRowCols(0); c++) {
                    let color = stagePalette[Math.floor(Math.random() * stagePalette.length)];
                    if (c > 0 && Math.random() < 0.42) color = newTopRow[c - 1].color;
                    newTopRow.push({ r: 0, c, color, active: true });
                  }
                  shifted.push(newTopRow);
                  for (let r = 1; r < ROWS; r++) {
                    const cols = getRowCols(r);
                    const prevRow = gridRef.current[r - 1] || [];
                    const nextRow: BubbleCell[] = [];
                    for (let c = 0; c < cols; c++) {
                      const src = prevRow[c];
                      nextRow.push({
                        r,
                        c,
                        color: src ? src.color : stagePalette[0],
                        active: src ? src.active : false,
                      });
                    }
                    if (
                      prevRow.length > cols &&
                      prevRow[cols]?.active &&
                      nextRow[cols - 1] &&
                      !nextRow[cols - 1].active
                    ) {
                      nextRow[cols - 1].active = true;
                      nextRow[cols - 1].color = prevRow[cols].color;
                    }
                    shifted.push(nextRow);
                  }
                  gridRef.current = shifted;
                  fxRef.current.spawnFloatText(
                    width / 2,
                    height * 0.28,
                    tRef.current('games.bubble.ceiling_drop_fx'),
                    '#F97316'
                  );
                  fxRef.current.addScreenShake(0.35);
                  GameSounds.playKick();
                }
                setMissesUntilDrop(missesUntilDropRef.current);
              }
            }

            // Refresh active colors so remaining bubbles are always clearable
            const activeColors = new Set<string>();
            let gridBreachedDanger = false;
            for (let r = 0; r < ROWS; r++) {
              const row = gridRef.current[r];
              if (!row) continue;
              for (const cell of row) {
                if (cell.active) {
                  activeColors.add(cell.color);
                  const { y: cellY } = getBubbleCenter(cell.r, cell.c, radius, topOffset);
                  if (cell.r >= ROWS - 1 || cellY + radius >= dangerLineY) {
                    gridBreachedDanger = true;
                  }
                }
              }
            }

            if (activeColors.size === 0) {
              isClearedRef.current = true;
              fxRef.current.spawnConfettiExplosion(width / 2, height / 2, 50);
              const shotBonus = shotsLeftRef.current * 10;
              const stageBonus = stageRef.current * 15;
              const finalPts = Math.min(250, 100 + shotBonus + stageBonus);
              setRewardAmount(finalPts);
              setTimeout(() => {
                setShowRewardModal(true);
                GameSounds.playWinFanfare();
              }, 500);
            } else {
              if (!activeColors.has(currentColorRef.current)) {
                const nextCurr = getActiveBoardColor();
                currentColorRef.current = nextCurr;
                setCurrentBubbleColor(nextCurr);
              }
              if (!activeColors.has(nextColorRef.current)) {
                const nextPreview = getActiveBoardColor();
                nextColorRef.current = nextPreview;
                setNextBubbleColor(nextPreview);
              }

              // Check Danger Line Breach OR Out of Shots
              const breachedDanger = snapR >= ROWS - 1 || snapY + radius >= dangerLineY || gridBreachedDanger;
              if (breachedDanger) {
                isGameOverRef.current = true;
                setLossReasonKey('games.bubble.danger_breached');
                setIsGameOver(true);
                GameSounds.playLose();
              } else if (shotsLeftRef.current <= 0) {
                isGameOverRef.current = true;
                setLossReasonKey('games.bubble.out_of_shots');
                setIsGameOver(true);
                GameSounds.playLose();
              }
            }
          }
        }

        if (proj.active) {
          drawGlossyBubble(proj.x, proj.y, radius, proj.color);
        }
      }

      // 4. Raycasted Trajectory Laser with Wall Ricochet + Landing Ghost Ring
      if (!isGameOverRef.current && !isClearedRef.current) {
        const angle = aimAngleRef.current;
        const activeCol = currentColorRef.current;
        const rayPoints: { x: number; y: number }[] = [{ x: shooterX, y: shooterY }];
        let rx = shooterX;
        let ry = shooterY;
        let rdx = Math.cos(angle) * 6;
        let rdy = Math.sin(angle) * 6;
        let bounces = 0;

        for (let step = 0; step < 95; step++) {
          rx += rdx;
          ry += rdy;
          if (rx <= radius) {
            rx = radius;
            rdx = Math.abs(rdx);
            bounces++;
            rayPoints.push({ x: rx, y: ry });
          } else if (rx >= width - radius) {
            rx = width - radius;
            rdx = -Math.abs(rdx);
            bounces++;
            rayPoints.push({ x: rx, y: ry });
          }

          let hitBubble = ry <= topOffset;
          if (!hitBubble) {
            for (let r = 0; r < ROWS && !hitBubble; r++) {
              const cols = getRowCols(r);
              for (let c = 0; c < cols; c++) {
                const b = gridRef.current[r]?.[c];
                if (b && b.active) {
                  const { x: bx, y: by } = getBubbleCenter(r, c, radius, topOffset);
                  if (Math.hypot(rx - bx, ry - by) < radius * 1.82) {
                    hitBubble = true;
                    break;
                  }
                }
              }
            }
          }
          if (hitBubble || bounces > 1) {
            rayPoints.push({ x: rx, y: ry });
            break;
          }
        }
        if (rayPoints.length === 1) {
          rayPoints.push({ x: rx, y: ry });
        }

        ctx.save();
        ctx.strokeStyle = activeCol;
        ctx.globalAlpha = isAimingRef.current ? 0.85 : 0.55;
        ctx.lineWidth = 2.5;
        ctx.setLineDash([5, 7]);
        ctx.beginPath();
        ctx.moveTo(rayPoints[0].x, rayPoints[0].y);
        for (let i = 1; i < rayPoints.length; i++) {
          ctx.lineTo(rayPoints[i].x, rayPoints[i].y);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Landing ghost ring
        const endPt = rayPoints[rayPoints.length - 1];
        ctx.strokeStyle = activeCol;
        ctx.globalAlpha = 0.65;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(endPt.x, endPt.y, radius * 0.75, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // 5. Carnival Brass Cannon Turret with Recoil Kick
      const angle = aimAngleRef.current;
      const recoilOffset = recoilRef.current;
      const barrelBaseX = shooterX - Math.cos(angle) * recoilOffset;
      const barrelBaseY = shooterY - Math.sin(angle) * recoilOffset;

      ctx.save();
      ctx.translate(barrelBaseX, barrelBaseY);
      ctx.rotate(angle + Math.PI / 2);
      const barrelGrad = ctx.createLinearGradient(-10, 0, 10, 0);
      barrelGrad.addColorStop(0, '#78350F');
      barrelGrad.addColorStop(0.5, '#FDE047');
      barrelGrad.addColorStop(1, '#92400E');
      ctx.fillStyle = barrelGrad;
      ctx.fillRect(-10, -40, 20, 30);
      ctx.strokeStyle = '#FEF08A';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-10, -40, 20, 30);
      ctx.restore();

      ctx.fillStyle = '#1E293B';
      ctx.beginPath();
      ctx.arc(shooterX, shooterY, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Loaded Bubble in Cannon Base
      drawGlossyBubble(shooterX, shooterY, radius * 0.96, currentColorRef.current);

      // Interactive Next Bubble Preview Orb (tap to swap!)
      const swapX = shooterX - 56;
      const swapY = shooterY + 4;
      ctx.save();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(swapX, swapY, radius * 0.88, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      drawGlossyBubble(swapX, swapY, radius * 0.68, nextColorRef.current);
      ctx.restore();

      // 6. Update and Render Particles & Floating Text FX
      fxRef.current.update(dt60);
      fxRef.current.render(ctx);

      ctx.restore();
      frameIdRef.current = requestAnimationFrame(render);
    };

    frameIdRef.current = requestAnimationFrame(render);
    return () => {
      if (frameIdRef.current) cancelAnimationFrame(frameIdRef.current);
    };
  }, [findFloatingBubbles, findMatches, getActiveBoardColor]);

  // Unified Aim & Shoot Pointer Handlers
  const getCanvasCoords = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
      width: rect.width,
      height: rect.height,
    };
  };

  const updateAimFromCoords = (x: number, y: number, width: number, height: number) => {
    const shooterX = width / 2;
    const shooterY = height - 42;
    const angle = Math.atan2(Math.min(y, shooterY - 18) - shooterY, x - shooterX);
    aimAngleRef.current = Math.max(-Math.PI * 0.9, Math.min(-Math.PI * 0.1, angle));
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const coords = getCanvasCoords(e.clientX, e.clientY);
    if (!coords) return;
    const shooterX = coords.width / 2;
    const shooterY = coords.height - 42;

    // Tapping Next Bubble orb swaps bubbles instead of aiming/shooting
    if (Math.hypot(coords.x - (shooterX - 56), coords.y - (shooterY + 4)) <= 26) {
      swapBubbles();
      return;
    }

    isAimingRef.current = true;
    updateAimFromCoords(coords.x, coords.y, coords.width, coords.height);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const coords = getCanvasCoords(e.clientX, e.clientY);
    if (!coords) return;
    if (isAimingRef.current || e.pointerType === 'mouse') {
      updateAimFromCoords(coords.x, coords.y, coords.width, coords.height);
    }
  };

  const handlePointerUp = () => {
    if (!isAimingRef.current) return;
    isAimingRef.current = false;
    shoot();
  };

  const handleNextStage = () => {
    setShowRewardModal(false);
    setStage((s) => s + 1);
  };

  const claimReward = () => {
    if (onClaimReward && rewardAmount > 0) {
      onClaimReward(rewardAmount);
    }
    handleNextStage();
  };

  return (
    <div className="h-[100dvh] bg-slate-950 text-white flex flex-col overflow-hidden overscroll-none font-sans select-none">
      <GameHeader
        title={t('games.bubble.title')}
        subtitle={`${t('games.bubble.stage_label', { stage })} • ${t('games.bubble.shots', { count: shotsLeft })}`}
        onBack={onBack}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
        onRestart={() => initGrid(stageRef.current)}
        restartTooltip={t('games.bubble.btn_retry')}
        onHelp={() => setShowTutorial(true)}
      />

      {/* ── MAIN STAGE ── */}
      <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain max-w-md mx-auto w-full px-3 py-3 pb-4 flex flex-col items-center justify-center gap-2.5">
        {/* Clean HUD Bar */}
        <div className="w-full flex items-center justify-between gap-2 bg-slate-900/80 border border-slate-800/90 rounded-2xl px-3 py-2 shadow-lg">
          <div className="flex items-center gap-1.5 min-w-0">
            <button
              onClick={swapBubbles}
              className="flex items-center gap-1.5 bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 px-2.5 py-1 rounded-xl text-xs font-bold text-slate-200 active:scale-95 transition shrink-0"
              title={t('games.bubble.swap_label')}
            >
              <span
                className="w-3.5 h-3.5 rounded-full border border-white/60 shadow-inner"
                style={{ backgroundColor: currentBubbleColor }}
              />
              <RefreshCw className="w-3 h-3 text-amber-400" />
              <span
                className="w-3 h-3 rounded-full border border-white/40 opacity-85"
                style={{ backgroundColor: nextBubbleColor }}
              />
            </button>
            <span className="bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-lg uppercase shrink-0">
              {t('games.bubble.stage_label', { stage })}
            </span>
            {stageCfg.dropEveryMisses > 0 && (
              <span className="bg-orange-500/15 border border-orange-400/35 text-orange-300 text-[9px] font-bold px-1.5 py-0.5 rounded-lg truncate">
                {t('games.bubble.miss_counter', { left: missesUntilDrop })}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="bg-slate-800/90 border border-slate-700/80 px-2.5 py-1 rounded-xl text-center min-w-[60px]">
              <span className="text-[9px] text-slate-400 block uppercase font-bold">
                {t('games.bubble.score_label')}
              </span>
              <span className="font-mono font-black text-white text-xs">{score}</span>
            </div>
            <div className="bg-amber-950/60 border border-amber-500/40 px-2.5 py-1 rounded-xl text-center min-w-[60px]">
              <span className="text-[9px] text-amber-300 block uppercase font-bold">
                {t('games.bubble.shots_label')}
              </span>
              <span className="font-mono font-black text-amber-400 text-xs">{shotsLeft}</span>
            </div>
          </div>
        </div>

        {/* Canvas Game Arena (Drag to aim, release to shoot) */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={() => {
            isAimingRef.current = false;
          }}
          className="relative w-full aspect-[4/5] max-h-[490px] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border-2 border-amber-500/40 touch-none select-none cursor-crosshair"
        >
          <canvas ref={canvasRef} className="w-full h-full block" />

          {/* Game Over Overlay */}
          {isGameOver && (
            <div
              onPointerDown={(e) => e.stopPropagation()}
              className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fade-in z-20"
            >
              <div className="w-14 h-14 rounded-2xl bg-red-600/30 border border-red-500 text-red-400 flex items-center justify-center text-2xl mb-2">
                💥
              </div>
              <h3 className="text-lg font-black text-red-400 mb-1">{t(lossReasonKey)}</h3>
              <p className="text-xs text-slate-300 mb-4">{t('games.bubble.score', { score })}</p>
              <button
                onClick={() => initGrid(stageRef.current)}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black rounded-xl text-sm shadow-lg active:scale-95 transition"
              >
                {t('games.bubble.btn_retry')}
              </button>
            </div>
          )}
        </div>

        <p className="text-[11px] text-slate-400 text-center max-w-xs">{t('games.bubble.drag_aim_hint')}</p>
      </main>

      {/* ── REWARD MODAL ── */}
      {showRewardModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-amber-500/50 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl relative overflow-hidden">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center text-3xl mx-auto shadow-xl animate-bounce">
              🏆
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 bg-amber-500/15 border border-amber-500/35 px-2.5 py-0.5 rounded-full">
                {t('games.bubble.stage_label', { stage })}
              </span>
              <h3 className="text-lg font-black text-white mt-2">{t('games.bubble.clear_title')}</h3>
              <p className="text-xs text-slate-400 mt-1">{t('games.bubble.score', { score })}</p>
              <div className="text-3xl font-black text-amber-400 font-mono mt-2">
                +{rewardAmount} {t('nav.points_unit')}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleNextStage}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black rounded-xl text-sm shadow-lg active:scale-95 transition"
              >
                {t('games.bubble.btn_next_stage')} →
              </button>
              <button
                onClick={claimReward}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 font-bold rounded-xl text-xs active:scale-95 transition"
              >
                {t('games.common.btn_claim')}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── GAME TUTORIAL MODAL ── */}
      <GameTutorialModal
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
        gameTitle={t('games.bubble.title')}
        gameIcon="🫧"
        goal={t('games.bubble.tutorial.goal')}
        controls={t('games.bubble.tutorial.controls')}
        scoring={t('games.bubble.tutorial.scoring')}
        tips={t('games.bubble.tutorial.tips')}
      />
    </div>
  );
};
