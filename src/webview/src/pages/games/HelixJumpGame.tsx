import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { soundHaptics } from '../../utils/soundHaptics';
import { GameSounds } from '../../utils/audio';
import { GameHeader } from '../../components/common/GameHeader';
import { GameTutorialModal } from '../../components/common/GameTutorialModal';

export interface HelixJumpGameProps {
  onBack: () => void;
  onClaimReward?: (pointsWon: number) => void;
}

interface Segment {
  startAngle: number;
  endAngle: number;
  isDanger: boolean;
}

interface Splat {
  angle: number;
  radius: number;
}

interface PlatformReward {
  type: 'NATCASH_COIN' | 'DATA_4G';
  angle: number;
  collected: boolean;
}

interface PlatformLevel {
  levelIndex: number;
  worldY: number;
  segments: Segment[];
  splats: Splat[];
  reward?: PlatformReward;
  passed: boolean;
  shattered: boolean;
  shatterPieces?: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    rot: number;
    vrot: number;
    color: string;
    size: number;
  }>;
}

const TOWER_RADIUS = 36;
const PLATFORM_OUTER_R = 112;
const TILT = 0.35;
const PLATFORM_THICKNESS = 16;
const LEVEL_SPACING = 150;
const BOUNCE_VELOCITY = -410;
const GRAVITY = 1150;
const SUPER_SPEED_THRESHOLD = 3;

export const HelixJumpGame: React.FC<HelixJumpGameProps> = ({ onBack, onClaimReward }) => {
  const { t } = useTranslation();
  const tRef = useRef(t);
  useEffect(() => {
    tRef.current = t;
  }, [t]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // React states for HUD
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => {
    try {
      return parseInt(localStorage.getItem('helix_best_score') || '0', 10);
    } catch {
      return 0;
    }
  });
  const [currentStage, setCurrentStage] = useState(1);
  const [lives, setLives] = useState(3);
  const [combo, setCombo] = useState(0);
  const [isSuperMode, setIsSuperMode] = useState(false);
  const [natcashEarned, setNatcashEarned] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Modals & Revive countdown
  const [isGameOver, setIsGameOver] = useState(false);
  const [isStageClear, setIsStageClear] = useState(false);
  const [isReviveActive, setIsReviveActive] = useState(false);
  const [reviveCountdown, setReviveCountdown] = useState(3);
  const [showTutorial, setShowTutorial] = useState(false);

  // Stable references to prevent useEffect from re-mounting
  const bestScoreRef = useRef(bestScore);
  useEffect(() => {
    bestScoreRef.current = bestScore;
  }, [bestScore]);

  const onClaimRewardRef = useRef(onClaimReward);
  useEffect(() => {
    onClaimRewardRef.current = onClaimReward;
  }, [onClaimReward]);

  const startRevivePhaseRef = useRef<() => void>(() => {});

  // Mutable game loop references
  const playStateRef = useRef<'PLAYING' | 'REVIVE' | 'GAMEOVER' | 'STAGECLEAR'>('PLAYING');
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const stageRef = useRef(1);
  const comboStreakRef = useRef(0);
  const hasRevivedRef = useRef(false);
  const natcashCoinsRef = useRef(0);
  const invulnerableUntilRef = useRef(0);

  // Tower & Ball physics
  const towerAngleRef = useRef(0);
  const towerTargetAngleRef = useRef(0);
  const ballWorldYRef = useRef(0);
  const ballVyRef = useRef(0);
  const cameraYRef = useRef(0);
  const ballSquishRef = useRef(1.0);
  const isSuperModeRef = useRef(false);

  // Particles & Floating badges
  const particlesRef = useRef<
    Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      radius: number;
      alpha: number;
      life: number;
    }>
  >([]);

  const floatingBadgesRef = useRef<
    Array<{
      id: number;
      text: string;
      x: number;
      y: number;
      color: string;
      alpha: number;
    }>
  >([]);
  const nextBadgeIdRef = useRef(1);

  const platformsRef = useRef<PlatformLevel[]>([]);
  const screenShakeRef = useRef(0);

  // Drag controls
  const isDraggingRef = useRef(false);
  const lastPointerXRef = useRef(0);

  // Helper to generate levels for a given stage
  const generatePlatforms = useCallback((stage: number) => {
    const list: PlatformLevel[] = [];
    const totalLevels = 12 + stage * 2;
    const NUM_SLICES = 12;
    const sliceAngle = (Math.PI * 2) / NUM_SLICES;

    for (let i = 0; i < totalLevels; i++) {
      const worldY = i * LEVEL_SPACING;

      // Level 0: Tầng xuất phát trên cùng -> 1 khe rơi (2 ô), 0 ô nguy hiểm để bắt đầu an toàn
      if (i === 0) {
        const segments: Segment[] = [];
        for (let s = 2; s < NUM_SLICES; s++) {
          segments.push({
            startAngle: s * sliceAngle,
            endAngle: (s + 1) * sliceAngle,
            isDanger: false,
          });
        }
        list.push({
          levelIndex: i,
          worldY,
          segments,
          splats: [],
          passed: false,
          shattered: false,
        });
        continue;
      }

      // Level cuối cùng: Tầng đích vinh quang -> Tất cả 12 ô an toàn
      if (i === totalLevels - 1) {
        const segments: Segment[] = [];
        for (let s = 0; s < NUM_SLICES; s++) {
          segments.push({
            startAngle: s * sliceAngle,
            endAngle: (s + 1) * sliceAngle,
            isDanger: false,
          });
        }
        list.push({
          levelIndex: i,
          worldY,
          segments,
          splats: [],
          passed: false,
          shattered: false,
        });
        continue;
      }

      // Các tầng chơi bình thường:
      // 1. Khe hở (Lỗ rơi): 2 ô liền kề (khoảng 60 độ)
      const gapWidth = stage >= 4 ? 1 : 2;
      const gapStart = Math.floor(Math.random() * NUM_SLICES);
      const gapIndices = new Set<number>();
      for (let g = 0; g < gapWidth; g++) {
        gapIndices.add((gapStart + g) % NUM_SLICES);
      }

      // 2. Chướng ngại vật Gai Đỏ (DANGER OBSTACLES):
      // Stage 1: 2 ô đỏ (~60 độ nguy hiểm)
      // Stage 2: 2 - 3 ô đỏ
      // Stage 3+: 3 - 4 ô đỏ
      const numDanger = Math.min(4, Math.max(2, Math.floor(1 + stage * 0.7)));
      // Bố trí chướng ngại vật lệch sang phía đối diện khe hở để người chơi có khoảng đệm an toàn
      const dangerStart = (gapStart + gapWidth + 1 + Math.floor(Math.random() * 2)) % NUM_SLICES;
      const dangerIndices = new Set<number>();
      for (let d = 0; d < numDanger; d++) {
        const dIdx = (dangerStart + d) % NUM_SLICES;
        if (!gapIndices.has(dIdx)) {
          dangerIndices.add(dIdx);
        }
      }

      // 3. Xây dựng các phân đoạn (TUYỆT ĐỐI TÁCH BẠCH, KHÔNG CHỒNG LẤN LÊN NHAU)
      const segments: Segment[] = [];
      for (let s = 0; s < NUM_SLICES; s++) {
        if (gapIndices.has(s)) {
          // Khe rơi void - không thêm vào segments, bóng sẽ lọt qua
          continue;
        }

        const isDanger = dangerIndices.has(s);
        segments.push({
          startAngle: s * sliceAngle,
          endAngle: (s + 1) * sliceAngle,
          isDanger,
        });
      }

      // Phần thưởng Xu Natcash hoặc 4G rơi ngẫu nhiên trên ô an toàn
      let reward: PlatformReward | undefined = undefined;
      if (i % 3 === 0) {
        const safeSlices = Array.from({ length: NUM_SLICES }, (_, idx) => idx).filter(
          (idx) => !gapIndices.has(idx) && !dangerIndices.has(idx)
        );
        if (safeSlices.length > 0) {
          const rwSlice = safeSlices[Math.floor(Math.random() * safeSlices.length)];
          reward = {
            type: Math.random() < 0.65 ? 'NATCASH_COIN' : 'DATA_4G',
            angle: (rwSlice + 0.5) * sliceAngle,
            collected: false,
          };
        }
      }

      list.push({
        levelIndex: i,
        worldY,
        segments,
        splats: [],
        reward,
        passed: false,
        shattered: false,
      });
    }

    return list;
  }, []);

  // Reset or start stage
  const startNewStage = useCallback(
    (stage: number, resetScore = false) => {
      stageRef.current = stage;
      setCurrentStage(stage);
      if (resetScore) {
        scoreRef.current = 0;
        setScore(0);
        livesRef.current = 3;
        setLives(3);
        hasRevivedRef.current = false;
        natcashCoinsRef.current = 0;
        setNatcashEarned(0);
      }
      playStateRef.current = 'PLAYING';
      setIsGameOver(false);
      setIsStageClear(false);
      setIsReviveActive(false);

      towerAngleRef.current = 0;
      towerTargetAngleRef.current = 0;
      ballWorldYRef.current = -50;
      ballVyRef.current = 0;
      cameraYRef.current = -50;
      comboStreakRef.current = 0;
      setCombo(0);
      isSuperModeRef.current = false;
      setIsSuperMode(false);
      particlesRef.current = [];
      floatingBadgesRef.current = [];
      screenShakeRef.current = 0;

      platformsRef.current = generatePlatforms(stage);
    },
    [generatePlatforms]
  );

  const triggerShatter = (plat: PlatformLevel, cx: number, cy: number) => {
    plat.shattered = true;
    screenShakeRef.current = 0.55;
    soundHaptics.triggerHaptic([25, 20, 35]);
    GameSounds.playTowerCrash();

    plat.shatterPieces = Array.from({ length: 14 }, (_, idx) => {
      const a = (idx / 14) * Math.PI * 2;
      const spd = 130 + Math.random() * 190;
      return {
        x: cx + Math.cos(a) * (TOWER_RADIUS + 30),
        y: cy + Math.sin(a) * (TOWER_RADIUS + 30) * TILT,
        vx: Math.cos(a) * spd,
        vy: -130 + Math.random() * 80,
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 8,
        color: idx % 3 === 0 ? '#EF4444' : '#4ADE80',
        size: 10 + Math.random() * 12,
      };
    });
  };

  // Revive Countdown Handler
  const startRevivePhase = useCallback(() => {
    playStateRef.current = 'REVIVE';
    setIsReviveActive(true);
    setReviveCountdown(3);
    soundHaptics.playHeartbeatTick();

    let count = 3;
    const interval = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setReviveCountdown(count);
        soundHaptics.playHeartbeatTick();
      } else {
        clearInterval(interval);
        setIsReviveActive(false);
        playStateRef.current = 'GAMEOVER';
        setIsGameOver(true);
        soundHaptics.playGameOver();
        if (onClaimRewardRef.current) onClaimRewardRef.current(scoreRef.current);
      }
    }, 1000);
  }, []);

  useEffect(() => {
    startRevivePhaseRef.current = startRevivePhase;
  }, [startRevivePhase]);

  const handleReviveNow = () => {
    setIsReviveActive(false);
    hasRevivedRef.current = true;
    livesRef.current = 1;
    setLives(1);
    invulnerableUntilRef.current = performance.now() + 2500; // 2.5s shield

    // Find closest platform and clear danger
    const currentY = ballWorldYRef.current;
    const nearby = platformsRef.current.find((p) => Math.abs(p.worldY - currentY) < LEVEL_SPACING * 0.8);
    if (nearby) {
      nearby.segments = nearby.segments.map((s) => ({ ...s, isDanger: false }));
    }

    ballVyRef.current = BOUNCE_VELOCITY * 1.1;
    ballSquishRef.current = 0.5;
    playStateRef.current = 'PLAYING';
    soundHaptics.playFeverActive();
  };

  // Main 60fps game render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = canvas.parentElement?.clientWidth || 360;
    const height = Math.min(window.innerHeight - 170, 680);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    startNewStage(1, true);

    const cx = width / 2;
    const ballScreenY = height * 0.38;

    // Cache static background gradients matching Image 2 "Fruit Jump Zagoo" (lush mint-sky & deep teal pole)
    const bgSky = ctx.createLinearGradient(0, 0, 0, height);
    bgSky.addColorStop(0, '#E8F7EC');
    bgSky.addColorStop(0.5, '#D2F2DA');
    bgSky.addColorStop(1, '#B9EAC4');

    const cylGrad = ctx.createLinearGradient(cx - TOWER_RADIUS, 0, cx + TOWER_RADIUS, 0);
    cylGrad.addColorStop(0, '#0F3942');
    cylGrad.addColorStop(0.3, '#195B6A');
    cylGrad.addColorStop(0.65, '#287B8D');
    cylGrad.addColorStop(1, '#0C323B');

    let animId = 0;
    let lastTime = performance.now();

    const render = (time: number) => {
      const dt = Math.min(0.045, (time - lastTime) / 1000);
      lastTime = time;

      // ── 1. UPDATE PHYSICS ──
      if (playStateRef.current === 'PLAYING') {
        towerAngleRef.current += (towerTargetAngleRef.current - towerAngleRef.current) * 0.22;

        ballVyRef.current += GRAVITY * dt;
        ballWorldYRef.current += ballVyRef.current * dt;

        if (ballVyRef.current < -50) {
          ballSquishRef.current = Math.min(1.3, 1.0 + Math.abs(ballVyRef.current) * 0.0006);
        } else if (ballVyRef.current > 50) {
          ballSquishRef.current = Math.max(0.8, 1.0 - ballVyRef.current * 0.0004);
        } else {
          ballSquishRef.current = 1.0;
        }

        cameraYRef.current += (ballWorldYRef.current - cameraYRef.current) * 0.16;

        if (screenShakeRef.current > 0) {
          screenShakeRef.current = Math.max(0, screenShakeRef.current - dt * 2.5);
        }

        // Spawn Super Mode trail particles
        if (isSuperModeRef.current) {
          for (let sp = 0; sp < 2; sp++) {
            particlesRef.current.push({
              x: cx + (Math.random() - 0.5) * 14,
              y: ballScreenY + (Math.random() - 0.5) * 10,
              vx: (Math.random() - 0.5) * 40,
              vy: -60 - Math.random() * 60,
              color: Math.random() < 0.5 ? '#EF4444' : '#F59E0B',
              radius: 3 + Math.random() * 3,
              alpha: 0.9,
              life: 0.35,
            });
          }
        }

        const currentBallAngle = (-towerAngleRef.current + Math.PI / 2) % (Math.PI * 2);
        const normAngle = (currentBallAngle + Math.PI * 2) % (Math.PI * 2);

        for (const plat of platformsRef.current) {
          if (plat.shattered) continue;

          // Check reward collection
          if (plat.reward && !plat.reward.collected) {
            const rDiff = Math.abs((plat.reward.angle + towerAngleRef.current) % (Math.PI * 2) - Math.PI / 2);
            if (rDiff < 0.45 && Math.abs(ballWorldYRef.current - plat.worldY) < 30) {
              plat.reward.collected = true;
              soundHaptics.playNatcashReward();

              const isCoin = plat.reward.type === 'NATCASH_COIN';
              const amt = isCoin ? 15 : 30;
              natcashCoinsRef.current += amt;
              setNatcashEarned(natcashCoinsRef.current);

              floatingBadgesRef.current.push({
                id: nextBadgeIdRef.current++,
                text: isCoin ? `+${amt} Xu Natcash!` : `+50MB 4G Data!`,
                x: cx,
                y: ballScreenY - 30,
                color: isCoin ? '#FACC15' : '#38BDF8',
                alpha: 1.0,
              });
            }
          }

          // Check platform passing or collision
          const prevY = ballWorldYRef.current - ballVyRef.current * dt;
          if (prevY <= plat.worldY && ballWorldYRef.current >= plat.worldY) {
            let hitDanger = false;
            let hitSafe = false;

            for (const seg of plat.segments) {
              const start = (seg.startAngle + Math.PI * 2) % (Math.PI * 2);
              const end = (seg.endAngle + Math.PI * 2) % (Math.PI * 2);

              let inRange = false;
              if (start <= end) {
                inRange = normAngle >= start && normAngle <= end;
              } else {
                inRange = normAngle >= start || normAngle <= end;
              }

              if (inRange) {
                if (seg.isDanger) hitDanger = true;
                else hitSafe = true;
                break;
              }
            }

            if (!hitSafe && !hitDanger) {
              // BALL PASSED THROUGH GAP!
              if (!plat.passed) {
                plat.passed = true;
                comboStreakRef.current += 1;
                setCombo(comboStreakRef.current);

                // Ascending pitch-ladder combo chime with haptic
                soundHaptics.playComboProgress(comboStreakRef.current);

                const pts = 10 * comboStreakRef.current;
                scoreRef.current += pts;
                setScore(scoreRef.current);
                if (scoreRef.current > bestScoreRef.current) {
                  bestScoreRef.current = scoreRef.current;
                  setBestScore(scoreRef.current);
                  try {
                    localStorage.setItem('helix_best_score', String(scoreRef.current));
                  } catch {
                    // Ignore storage errors
                  }
                }

                // Super Fireball Mode
                if (comboStreakRef.current >= SUPER_SPEED_THRESHOLD && !isSuperModeRef.current) {
                  isSuperModeRef.current = true;
                  setIsSuperMode(true);
                  soundHaptics.playFeverActive();
                }

                if (plat.levelIndex === platformsRef.current.length - 1) {
                  playStateRef.current = 'STAGECLEAR';
                  setIsStageClear(true);
                  soundHaptics.playVictoryFanfare();
                  if (onClaimRewardRef.current) onClaimRewardRef.current(scoreRef.current);
                }
              }
            } else {
              // BALL HIT PLATFORM SURFACE
              if (isSuperModeRef.current) {
                // SUPER MODE SMASHES THE PLATFORM!
                triggerShatter(plat, cx, ballScreenY);
                scoreRef.current += 60;
                setScore(scoreRef.current);
                comboStreakRef.current = 1;
                isSuperModeRef.current = false;
                setIsSuperMode(false);
              } else if (hitDanger && performance.now() > invulnerableUntilRef.current) {
                // HIT DANGER ZONE!
                livesRef.current -= 1;
                setLives(livesRef.current);
                screenShakeRef.current = 0.65;
                soundHaptics.triggerHaptic(65);
                GameSounds.playTowerCrash();
                comboStreakRef.current = 0;
                setCombo(0);

                if (livesRef.current <= 0) {
                  if (!hasRevivedRef.current) {
                    startRevivePhaseRef.current();
                  } else {
                    playStateRef.current = 'GAMEOVER';
                    setIsGameOver(true);
                    soundHaptics.playGameOver();
                    if (onClaimRewardRef.current) onClaimRewardRef.current(scoreRef.current);
                  }
                } else {
                  ballWorldYRef.current = plat.worldY - 2;
                  ballVyRef.current = BOUNCE_VELOCITY * 0.85;
                  ballSquishRef.current = 0.65;
                }
              } else {
                // NORMAL SAFE BOUNCE!
                ballWorldYRef.current = plat.worldY - 1;
                ballVyRef.current = BOUNCE_VELOCITY;
                ballSquishRef.current = 0.6;
                comboStreakRef.current = 0;
                setCombo(0);
                isSuperModeRef.current = false;
                setIsSuperMode(false);

                // Tactile feedback on bounce
                soundHaptics.playComboProgress(1);

                if (plat.splats.length < 8) {
                  plat.splats.push({
                    angle: normAngle,
                    radius: 12 + Math.random() * 8,
                  });
                }

                for (let p = 0; p < 7; p++) {
                  particlesRef.current.push({
                    x: cx + (Math.random() - 0.5) * 16,
                    y: ballScreenY + 12,
                    vx: (Math.random() - 0.5) * 80,
                    vy: -40 - Math.random() * 70,
                    color: '#F97316',
                    radius: 2 + Math.random() * 2.5,
                    alpha: 1.0,
                    life: 0.35,
                  });
                }
              }
            }
          }
        }
      }

      // Update particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += GRAVITY * 0.6 * dt;
        p.alpha -= dt / p.life;
        if (p.alpha <= 0) {
          particlesRef.current.splice(i, 1);
        }
      }

      // Update floating badges
      for (let b = floatingBadgesRef.current.length - 1; b >= 0; b--) {
        const badge = floatingBadgesRef.current[b];
        badge.y -= 40 * dt;
        badge.alpha -= dt * 1.2;
        if (badge.alpha <= 0) {
          floatingBadgesRef.current.splice(b, 1);
        }
      }

      // ── 2. DRAWING SCENE ──
      ctx.save();
      if (screenShakeRef.current > 0) {
        const shakeMag = screenShakeRef.current * 8;
        ctx.translate((Math.random() - 0.5) * shakeMag, (Math.random() - 0.5) * shakeMag);
      }

      // Sky background
      ctx.fillStyle = bgSky;
      ctx.fillRect(0, 0, width, height);

      // Central cylinder column
      ctx.fillStyle = cylGrad;
      ctx.fillRect(cx - TOWER_RADIUS, 0, TOWER_RADIUS * 2, height);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.fillRect(cx - TOWER_RADIUS + 4, 0, 4, height);

      // Draw visible platform levels
      const visiblePlats = platformsRef.current.filter((p) => {
        const sy = ballScreenY + (p.worldY - cameraYRef.current);
        return sy >= -120 && sy <= height + 120;
      });

      visiblePlats.sort((a, b) => a.worldY - b.worldY);

      for (const plat of visiblePlats) {
        const py = ballScreenY + (plat.worldY - cameraYRef.current);

        if (plat.shattered && plat.shatterPieces) {
          for (const pc of plat.shatterPieces) {
            pc.x += pc.vx * dt;
            pc.y += pc.vy * dt;
            pc.vy += GRAVITY * dt;
            pc.rot += pc.vrot * dt;

            ctx.save();
            ctx.translate(pc.x, pc.y);
            ctx.rotate(pc.rot);
            ctx.fillStyle = pc.color;
            ctx.fillRect(-pc.size / 2, -pc.size / 4, pc.size, pc.size / 2);
            ctx.restore();
          }
          continue;
        }

        ctx.save();
        ctx.translate(cx, py);

        // Draw Segments
        for (const seg of plat.segments) {
          const sAngle = seg.startAngle + towerAngleRef.current;
          const eAngle = seg.endAngle + towerAngleRef.current;

          const baseColor = seg.isDanger ? '#DC2626' : '#76C043';
          const rimColor = seg.isDanger ? '#991B1B' : '#54942A';
          const topHighlight = seg.isDanger ? '#F87171' : '#9CE466';

          // 3D side skirt
          ctx.beginPath();
          ctx.ellipse(0, PLATFORM_THICKNESS, PLATFORM_OUTER_R, PLATFORM_OUTER_R * TILT, 0, sAngle, eAngle);
          ctx.ellipse(0, 0, PLATFORM_OUTER_R, PLATFORM_OUTER_R * TILT, 0, eAngle, sAngle, true);
          ctx.closePath();
          ctx.fillStyle = rimColor;
          ctx.fill();

          // Top Face
          ctx.beginPath();
          ctx.ellipse(0, 0, PLATFORM_OUTER_R, PLATFORM_OUTER_R * TILT, 0, sAngle, eAngle);
          ctx.ellipse(0, 0, TOWER_RADIUS, TOWER_RADIUS * TILT, 0, eAngle, sAngle, true);
          ctx.closePath();
          ctx.fillStyle = baseColor;
          ctx.fill();

          ctx.strokeStyle = topHighlight;
          ctx.lineWidth = 2.5;
          ctx.stroke();

          // Dấu hiệu chướng ngại vật nguy hiểm gai đỏ
          if (seg.isDanger) {
            const midAngle = (sAngle + eAngle) / 2;
            const midDist = (TOWER_RADIUS + PLATFORM_OUTER_R) * 0.52;
            const mx = Math.cos(midAngle) * midDist;
            const my = Math.sin(midAngle) * midDist * TILT;

            ctx.save();
            ctx.translate(mx, my);
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 11px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = 'rgba(0,0,0,0.6)';
            ctx.shadowBlur = 4;
            ctx.fillText('✕', 0, 0);
            ctx.restore();
          }
        }

        // Draw Natcash Reward badge on platform
        if (plat.reward && !plat.reward.collected) {
          const rwAngle = plat.reward.angle + towerAngleRef.current;
          const dist = (TOWER_RADIUS + PLATFORM_OUTER_R) * 0.52;
          const rx = Math.cos(rwAngle) * dist;
          const ry = Math.sin(rwAngle) * dist * TILT;

          // Bobbing animation
          const bobY = ry - 14 + Math.sin(time * 0.007) * 4;

          if (plat.reward.type === 'NATCASH_COIN') {
            ctx.fillStyle = '#F59E0B';
            ctx.beginPath();
            ctx.arc(rx, bobY, 9, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#FEF08A';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 9px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('N', rx, bobY + 3);
          } else {
            ctx.fillStyle = '#0284C7';
            ctx.beginPath();
            ctx.arc(rx, bobY, 9, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 8px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('4G', rx, bobY + 3);
          }
        }

        // Splatters matching Image 2 "Fruit Jump Zagoo" (juicy orange splats with satellite droplets)
        for (const sp of plat.splats) {
          const spAngle = sp.angle + towerAngleRef.current;
          const dist = (TOWER_RADIUS + PLATFORM_OUTER_R) * 0.52;
          const sx = Math.cos(spAngle) * dist;
          const sy = Math.sin(spAngle) * dist * TILT;

          ctx.fillStyle = 'rgba(255, 115, 0, 0.85)';
          // Main central puddle
          ctx.beginPath();
          ctx.ellipse(sx, sy, sp.radius, sp.radius * TILT, 0, 0, Math.PI * 2);
          ctx.fill();
          // Satellite droplets
          ctx.beginPath();
          ctx.ellipse(sx + sp.radius * 0.85, sy - sp.radius * 0.35 * TILT, sp.radius * 0.32, sp.radius * 0.32 * TILT, 0, 0, Math.PI * 2);
          ctx.ellipse(sx - sp.radius * 0.75, sy + sp.radius * 0.45 * TILT, sp.radius * 0.28, sp.radius * 0.28 * TILT, 0, 0, Math.PI * 2);
          ctx.ellipse(sx + sp.radius * 0.3, sy + sp.radius * 0.9 * TILT, sp.radius * 0.24, sp.radius * 0.24 * TILT, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      // Draw Particles
      for (const p of particlesRef.current) {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;

      // ── 3. DRAW BOUNCING BALL ──
      const ballRadius = 14;
      const bSquish = ballSquishRef.current;
      const ballX = cx;
      const ballY = ballScreenY;

      ctx.save();
      ctx.translate(ballX, ballY);
      ctx.scale(1 / Math.sqrt(bSquish), bSquish);

      // Super mode fireball aura (Zero shadowBlur - translucent halo)
      if (isSuperModeRef.current) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.beginPath();
        ctx.arc(0, 0, ballRadius * 2.1, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(245, 158, 11, 0.65)';
        ctx.beginPath();
        ctx.arc(0, 0, ballRadius * 1.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = 'rgba(249, 115, 22, 0.25)';
        ctx.beginPath();
        ctx.arc(0, 0, ballRadius * 1.45, 0, Math.PI * 2);
        ctx.fill();
      }

      // Invulnerability shield gleam
      if (performance.now() < invulnerableUntilRef.current) {
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, ballRadius * 1.6, 0, Math.PI * 2);
        ctx.stroke();
      }

      const ballGrad = ctx.createRadialGradient(-3, -4, 2, 0, 0, ballRadius);
      ballGrad.addColorStop(0, '#FED7AA');
      ballGrad.addColorStop(0.3, '#F97316');
      ballGrad.addColorStop(1, '#C2410C');
      ctx.fillStyle = ballGrad;
      ctx.beginPath();
      ctx.arc(0, 0, ballRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.ellipse(-4, -5, 3.5, 2, -0.4, 0, Math.PI * 2);
      ctx.fill();

      // Fruit green stem & leaf matching Image 2
      ctx.fillStyle = '#15803D';
      ctx.fillRect(-1, -ballRadius - 3, 2, 4);
      ctx.fillStyle = '#22C55E';
      ctx.beginPath();
      ctx.ellipse(3, -ballRadius - 2, 4, 2, 0.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // Draw Floating Reward Badges
      for (const badge of floatingBadgesRef.current) {
        ctx.save();
        ctx.font = 'bold 15px sans-serif';
        ctx.fillStyle = badge.color;
        ctx.globalAlpha = Math.max(0, badge.alpha);
        ctx.textAlign = 'center';
        ctx.fillText(badge.text, badge.x, badge.y);
        ctx.restore();
      }

      // Combo callout overlay
      if (comboStreakRef.current >= 2) {
        ctx.save();
        ctx.font = 'black 16px sans-serif';
        ctx.fillStyle = isSuperModeRef.current ? '#F43F5E' : '#F59E0B';
        ctx.textAlign = 'center';
        ctx.fillText(`x${comboStreakRef.current} COMBO!`, cx, ballScreenY - 34);
        ctx.restore();
      }

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, []); // Run exactly once on mount so state changes never reset the game!

  // Touch / pointer drag listeners
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    isDraggingRef.current = true;
    lastPointerXRef.current = e.clientX;
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastPointerXRef.current;
    lastPointerXRef.current = e.clientX;
    towerTargetAngleRef.current += dx * 0.016;
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore capture errors
    }
    isDraggingRef.current = false;
  };

  return (
    <div
      ref={containerRef}
      style={{ touchAction: 'none' }}
      className={`relative flex flex-col h-[100dvh] w-full max-w-[430px] mx-auto bg-slate-950 select-none overflow-hidden overscroll-none transition-all duration-300 ${
        isSuperMode ? 'ring-4 ring-amber-500 shadow-[0_0_35px_rgba(245,158,11,0.5)]' : ''
      }`}
    >
      {/* ── 1. PINNED GAME HEADER ── */}
      <GameHeader
        title={t('games.helix.title')}
        subtitle={t('games.helix.subtitle')}
        onBack={onBack}
        soundEnabled={soundEnabled}
        onToggleSound={() => {
          soundHaptics.toggleMute();
          setSoundEnabled(!soundHaptics.isMuted());
        }}
        onRestart={() => startNewStage(1, true)}
        onHelp={() => setShowTutorial(true)}
      />

      {/* ── 2. HUD STATUS BAR WITH NATCASH REWARDS ── */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/90 border-b border-slate-800/80 z-10 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400">{t('games.helix.lives_label')}:</span>
          <div className="flex gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <span key={i} className={`text-sm ${i < lives ? 'opacity-100 scale-100' : 'opacity-25 grayscale'}`}>
                ❤️
              </span>
            ))}
          </div>

          {combo >= 2 && (
            <span className="ml-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-[10px] font-black text-amber-300 animate-pulse">
              {combo}x Combo!
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Natcash coins collected badge */}
          <div className="flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
            <span className="text-xs">🪙</span>
            <span className="text-xs font-black text-amber-400 font-mono">+{natcashEarned}</span>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
              {t('games.helix.score_label')}
            </span>
            <span className="text-base font-black text-amber-400 font-mono leading-none">{score}</span>
          </div>
        </div>
      </div>

      {/* FEVER MODE BANNER */}
      {isSuperMode && (
        <div className="w-full bg-gradient-to-r from-red-600 via-amber-500 to-red-600 text-slate-950 text-center font-black text-xs py-1 animate-pulse tracking-wider shadow-lg z-20">
          🔥 {t('games.helix.fever_banner')} 🔥
        </div>
      )}

      {/* ── 3. INTERACTIVE CANVAS ARENA ── */}
      <div
        className="relative flex-1 w-full flex items-center justify-center overflow-hidden touch-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Drag Hint Footer */}
        <div className="absolute bottom-3 left-0 right-0 pointer-events-none text-center">
          <span className="inline-block px-3 py-1 bg-slate-900/80 backdrop-blur-sm border border-slate-700/60 rounded-full text-[11px] font-medium text-slate-300 shadow-md">
            ↔️ {t('games.helix.tap_hint')}
          </span>
        </div>
      </div>

      {/* ── 4. DRAMATIC 3-SECOND REVIVE COUNTDOWN MODAL ── */}
      {isReviveActive && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-amber-500/80 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-[0_0_50px_rgba(245,158,11,0.3)] relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center text-4xl mx-auto font-black font-mono shadow-2xl animate-pulse">
              {reviveCountdown}
            </div>
            <div>
              <h3 className="text-xl font-black text-white">{t('games.helix.revive_title')}</h3>
              <p className="text-xs text-amber-300 font-bold mt-1">
                {score >= bestScore
                  ? t('games.helix.revive_new_record')
                  : t('games.helix.revive_gap', { points: Math.max(10, bestScore - score) })}
              </p>
            </div>
            <button
              onClick={handleReviveNow}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-green-400 hover:from-emerald-400 text-slate-950 font-black rounded-2xl text-sm shadow-xl active:scale-95 transition flex items-center justify-center gap-2"
            >
              <span>❤️ {t('games.helix.btn_revive_free')}</span>
            </button>
            <p className="text-[11px] text-slate-400">{t('games.helix.revive_shield_note')}</p>
          </div>
        </div>
      )}

      {/* ── 5. GAME OVER MODAL WITH NATCASH REWARDS ── */}
      {isGameOver && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-red-500/50 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl relative">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-red-500 to-rose-600 text-white flex items-center justify-center text-3xl mx-auto shadow-xl">
              💥
            </div>
            <div>
              <h3 className="text-xl font-black text-white">{t('games.helix.game_over_title')}</h3>
              <p className="text-xs text-slate-400 mt-1">{t('games.helix.game_over_desc', { score })}</p>
              <div className="text-3xl font-black text-amber-400 font-mono mt-2">{score} {t('common.points_short')}</div>

              {/* Natcash coins earned in run */}
              <div className="mt-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300">🎁 {t('games.helix.coins_earned_label')}</span>
                <span className="text-sm font-black text-amber-400 font-mono">{t('games.helix.coins_value', { coins: natcashEarned })}</span>
              </div>
            </div>
            <button
              onClick={() => startNewStage(1, true)}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 text-slate-950 font-black rounded-2xl text-sm shadow-xl active:scale-95 transition"
            >
              🔄 {t('games.helix.btn_retry')}
            </button>
          </div>
        </div>
      )}

      {/* ── 6. STAGE CLEAR MODAL ── */}
      {isStageClear && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-emerald-500/50 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl relative">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-500 to-green-400 text-slate-950 flex items-center justify-center text-3xl mx-auto shadow-xl animate-bounce">
              🏆
            </div>
            <div>
              <h3 className="text-xl font-black text-white">{t('games.helix.stage_clear_title', { stage: currentStage })}</h3>
              <p className="text-xs text-slate-400 mt-1">{t('games.helix.stage_clear_desc')}</p>
              <div className="text-3xl font-black text-emerald-400 font-mono mt-2">+{score} {t('common.points_short')}</div>

              <div className="mt-3 p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-300">{t('games.helix.stage_bonus_label')}</span>
                <span className="text-xs font-black text-emerald-400 font-mono">{t('games.helix.stage_bonus_value')}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => startNewStage(currentStage + 1, false)}
                className="flex-1 py-3.5 bg-gradient-to-r from-emerald-500 to-green-400 text-slate-950 font-black rounded-2xl text-sm shadow-xl active:scale-95 transition"
              >
                {t('games.helix.next_stage_btn', { stage: currentStage + 1 })} ➡️
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 7. TUTORIAL MODAL ── */}
      <GameTutorialModal
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
        gameTitle={t('games.helix.title')}
        gameIcon="🌀"
        goal={t('games.helix.tutorial.goal')}
        controls={t('games.helix.tutorial.controls')}
        scoring={t('games.helix.tutorial.scoring')}
        tips={t('games.helix.tutorial.tips')}
      />
    </div>
  );
};
