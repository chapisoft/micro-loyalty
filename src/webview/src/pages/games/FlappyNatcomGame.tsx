import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { RotateCcw, Shield, Magnet, Zap } from 'lucide-react';
import { GameSounds } from '../../utils/audio';
import { GameFXSystem } from '../../utils/game-fx';
import { GameHeader } from '../../components/common/GameHeader';
import { GameTutorialModal } from '../../components/common/GameTutorialModal';

export interface FlappyNatcomGameProps {
  onBack: () => void;
  onClaimReward?: (pointsWon: number) => void;
}

type PowerUpType = 'SHIELD' | 'MAGNET' | 'DOUBLE';

interface Tower {
  x: number;
  topHeight: number;
  bottomY: number;
  passed: boolean;
  hasCoin: boolean;
  coinCollected: boolean;
  isMoving?: boolean;
  baseTopHeight?: number;
  moveSpeed?: number;
  moveAmp?: number;
  powerUp?: PowerUpType;
  powerUpCollected?: boolean;
}

export const FlappyNatcomGame: React.FC<FlappyNatcomGameProps> = ({ onBack, onClaimReward }) => {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'GAMEOVER'>('IDLE');
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('flappy_best_score') || 0);
    } catch {
      return 0;
    }
  });
  const [soundEnabled, setSoundEnabled] = useState<boolean>(!GameSounds.isSoundMuted());
  const [showRewardModal, setShowRewardModal] = useState<boolean>(false);
  const [rewardAmount, setRewardAmount] = useState<number>(0);
  const [showTutorial, setShowTutorial] = useState<boolean>(false);

  // Power-Up Active States
  const [hasShield, setHasShield] = useState<boolean>(false);
  const [magnetSeconds, setMagnetSeconds] = useState<number>(0);
  const [doubleSeconds, setDoubleSeconds] = useState<number>(0);

  // Physics and Game loop state refs
  const birdRef = useRef<{ y: number; vy: number; angle: number; shield: boolean }>({
    y: 200,
    vy: 0,
    angle: 0,
    shield: false,
  });
  const towersRef = useRef<Tower[]>([]);
  const fxRef = useRef<GameFXSystem>(new GameFXSystem());
  const frameIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const scoreRef = useRef<number>(0);
  const magnetTimerRef = useRef<number>(0);
  const doubleTimerRef = useRef<number>(0);
  const invulnerableUntilRef = useRef<number>(0);

  const GRAVITY = 0.38;
  const JUMP_FORCE = -6.8;
  const TOWER_WIDTH = 56;

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    GameSounds.setMuted(!next);
  };

  const getDynamicSpeed = (currentScore: number) => {
    return 2.5 + Math.min(2.5, currentScore * 0.12);
  };

  const getDynamicGap = (currentScore: number) => {
    return Math.max(92, 130 - currentScore * 1.8);
  };

  const initGame = useCallback(() => {
    const width = canvasRef.current?.parentElement?.clientWidth || 360;
    const firstTowerX = Math.round(width * 0.72);
    const secondTowerX = firstTowerX + 210;

    birdRef.current = { y: 200, vy: 0, angle: 0, shield: false };
    towersRef.current = [
      {
        x: firstTowerX,
        topHeight: 120,
        bottomY: 120 + 130,
        passed: false,
        hasCoin: true,
        coinCollected: false,
        isMoving: false,
      },
      {
        x: secondTowerX,
        topHeight: 170,
        bottomY: 170 + 130,
        passed: false,
        hasCoin: true,
        coinCollected: false,
        isMoving: false,
        powerUp: 'SHIELD',
        powerUpCollected: false,
      },
    ];
    fxRef.current.clear();
    scoreRef.current = 0;
    magnetTimerRef.current = 0;
    doubleTimerRef.current = 0;
    invulnerableUntilRef.current = 0;
    setScore(0);
    setHasShield(false);
    setMagnetSeconds(0);
    setDoubleSeconds(0);
    setGameState('IDLE');
  }, []);

  // Initialize game on component mount
  useEffect(() => {
    initGame();
  }, [initGame]);

  const jump = useCallback(() => {
    if (gameState === 'IDLE') {
      setGameState('PLAYING');
      birdRef.current.vy = JUMP_FORCE;
      GameSounds.playTap();
      const birdX = (canvasRef.current?.clientWidth || 360) * 0.28;
      fxRef.current.spawnSmokePuff(birdX - 10, birdRef.current.y + 6, 5);
    } else if (gameState === 'PLAYING') {
      birdRef.current.vy = JUMP_FORCE;
      GameSounds.playTap();
      const birdX = (canvasRef.current?.clientWidth || 360) * 0.28;
      fxRef.current.spawnSmokePuff(birdX - 10, birdRef.current.y + 6, 5);
    } else if (gameState === 'GAMEOVER') {
      initGame();
      setGameState('PLAYING');
      birdRef.current.vy = JUMP_FORCE;
      GameSounds.playStart();
    }
  }, [gameState, initGame]);

  const handleGameOver = useCallback(() => {
    setGameState('GAMEOVER');
    fxRef.current.addScreenShake(0.8);
    const birdX = (canvasRef.current?.clientWidth || 360) * 0.28;
    fxRef.current.spawnSparkles(birdX, birdRef.current.y, 30, '#EF4444');
    GameSounds.playLose();

    const currentScore = scoreRef.current;
    if (currentScore > highScore) {
      setHighScore(currentScore);
      try {
        localStorage.setItem('flappy_best_score', String(currentScore));
      } catch {}
    }

    if (currentScore >= 5) {
      setRewardAmount(Math.min(250, currentScore * 10));
      setTimeout(() => setShowRewardModal(true), 600);
    }
  }, [highScore]);

  // Main Canvas Render & Animation Loop with 60 FPS Particle FX
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.parentElement?.clientWidth || 360;
    const height = Math.min(window.innerHeight - 200, 490);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const clouds = [
      { x: 30, y: 45, size: 50, speed: 0.3 },
      { x: 180, y: 75, size: 65, speed: 0.45 },
      { x: 320, y: 40, size: 45, speed: 0.25 },
    ];

    const stars = Array.from({ length: 25 }, () => ({
      x: Math.random() * width,
      y: Math.random() * (height * 0.7),
      radius: Math.random() * 1.5 + 0.5,
      twinkle: Math.random() * Math.PI * 2,
    }));

    const render = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const dt = Math.min(0.1, (time - lastTimeRef.current) / 1000);
      lastTimeRef.current = time;

      const currentScore = scoreRef.current;
      const currentSpeed = getDynamicSpeed(currentScore);
      const currentGap = getDynamicGap(currentScore);

      // Power-up timers countdown
      if (gameState === 'PLAYING') {
        if (magnetTimerRef.current > 0) {
          magnetTimerRef.current = Math.max(0, magnetTimerRef.current - dt);
          setMagnetSeconds(Math.ceil(magnetTimerRef.current));
        }
        if (doubleTimerRef.current > 0) {
          doubleTimerRef.current = Math.max(0, doubleTimerRef.current - dt);
          setDoubleSeconds(Math.ceil(doubleTimerRef.current));
        }
      }

      // 0. Screen Shake Offset
      const shake = fxRef.current.getShakeOffset();
      ctx.save();
      ctx.translate(shake.x, shake.y);

      // 1. Dynamic Atmosphere Sky Gradient based on Score Stage
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      if (currentScore < 8) {
        // Stage 1: Caribbean Tropical Sunshine (Daytime)
        skyGrad.addColorStop(0, '#0284C7');
        skyGrad.addColorStop(0.5, '#38BDF8');
        skyGrad.addColorStop(0.85, '#FDE047');
        skyGrad.addColorStop(1, '#166534');
      } else if (currentScore < 18) {
        // Stage 2: Caribbean Sunset
        skyGrad.addColorStop(0, '#311042');
        skyGrad.addColorStop(0.4, '#B91C1C');
        skyGrad.addColorStop(0.75, '#F97316');
        skyGrad.addColorStop(1, '#78350F');
      } else {
        // Stage 3: Cyber Natcom Night
        skyGrad.addColorStop(0, '#030712');
        skyGrad.addColorStop(0.5, '#1E1B4B');
        skyGrad.addColorStop(0.85, '#4338CA');
        skyGrad.addColorStop(1, '#064E3B');
      }
      ctx.fillStyle = skyGrad;
      ctx.fillRect(-20, -20, width + 40, height + 40);

      // Stars in Night Stage
      if (currentScore >= 18) {
        ctx.fillStyle = '#FFFFFF';
        stars.forEach((star) => {
          star.twinkle += 0.05;
          const alpha = 0.4 + Math.sin(star.twinkle) * 0.4;
          ctx.globalAlpha = alpha;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.globalAlpha = 1.0;
      }

      // Sun or Neon Moon Disk
      if (currentScore < 18) {
        ctx.fillStyle = currentScore < 8 ? '#FEF08A' : '#FED7AA';
        ctx.shadowColor = currentScore < 8 ? '#FBBF24' : '#EA580C';
        ctx.shadowBlur = 30;
        ctx.beginPath();
        ctx.arc(width * 0.85, 60, 26, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else {
        // Neon Cyber Moon
        ctx.fillStyle = '#E0E7FF';
        ctx.shadowColor = '#6366F1';
        ctx.shadowBlur = 25;
        ctx.beginPath();
        ctx.arc(width * 0.85, 55, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Animated multi-layer clouds
      ctx.fillStyle = currentScore < 18 ? 'rgba(255, 255, 255, 0.8)' : 'rgba(148, 163, 184, 0.3)';
      clouds.forEach((cloud) => {
        if (gameState === 'PLAYING') {
          cloud.x -= cloud.speed;
          if (cloud.x < -100) cloud.x = width + 50;
        }
        ctx.beginPath();
        ctx.arc(cloud.x, cloud.y, cloud.size * 0.5, 0, Math.PI * 2);
        ctx.arc(cloud.x + cloud.size * 0.35, cloud.y - cloud.size * 0.2, cloud.size * 0.45, 0, Math.PI * 2);
        ctx.arc(cloud.x + cloud.size * 0.7, cloud.y, cloud.size * 0.4, 0, Math.PI * 2);
        ctx.fill();
      });

      // 3. Update & Draw Towers (4G Telecom Masts)
      if (gameState === 'PLAYING') {
        const towers = towersRef.current;
        const bird = birdRef.current;
        const birdX = width * 0.28;

        for (let i = 0; i < towers.length; i++) {
          const t = towers[i];
          t.x -= currentSpeed;

          // Oscillating tower movement
          if (t.isMoving && t.baseTopHeight !== undefined && t.moveSpeed && t.moveAmp) {
            t.topHeight = t.baseTopHeight + Math.sin(time * t.moveSpeed) * t.moveAmp;
            t.bottomY = t.topHeight + currentGap;
          }

          // Passing tower score trigger
          if (!t.passed && t.x + TOWER_WIDTH < birdX) {
            t.passed = true;
            const pts = doubleTimerRef.current > 0 ? 2 : 1;
            scoreRef.current += pts;
            setScore(scoreRef.current);
            fxRef.current.spawnFloatText(
              birdX,
              bird.y - 20,
              pts > 1 ? '+2 (2X ⭐)' : '+1',
              pts > 1 ? '#FDE047' : '#FFFFFF'
            );
            GameSounds.playCorrect();
          }

          // Coin Magnetic attraction and collection
          if (t.hasCoin && !t.coinCollected) {
            let coinX = t.x + TOWER_WIDTH / 2;
            let coinY = t.topHeight + currentGap / 2;

            if (magnetTimerRef.current > 0) {
              const dist = Math.hypot(coinX - birdX, coinY - bird.y);
              if (dist < 180) {
                // Pull coin towards bird
                t.x -= (coinX - birdX) * 0.1;
                coinX -= (coinX - birdX) * 0.1;
                coinY -= (coinY - bird.y) * 0.1;
              }
            }

            const dist = Math.hypot(coinX - birdX, coinY - bird.y);
            if (dist < 28) {
              t.coinCollected = true;
              scoreRef.current += 1;
              setScore(scoreRef.current);
              fxRef.current.spawnSparkles(coinX, coinY, 18, '#FDE047');
              fxRef.current.spawnFloatText(coinX, coinY - 15, '+1 COIN! 🪙', '#F59E0B');
              GameSounds.playCoinRain();
            }
          }

          // Power-up collection
          if (t.powerUp && !t.powerUpCollected) {
            const pX = t.x + TOWER_WIDTH / 2;
            const pY = t.topHeight + currentGap / 2;
            const dist = Math.hypot(pX - birdX, pY - bird.y);
            if (dist < 30) {
              t.powerUpCollected = true;
              GameSounds.playWinFanfare();

              if (t.powerUp === 'SHIELD') {
                birdRef.current.shield = true;
                setHasShield(true);
                fxRef.current.spawnSparkles(pX, pY, 25, '#38BDF8');
                fxRef.current.spawnFloatText(pX, pY - 20, '4G SHIELD! 🛡️', '#38BDF8');
              } else if (t.powerUp === 'MAGNET') {
                magnetTimerRef.current = 6;
                setMagnetSeconds(6);
                fxRef.current.spawnSparkles(pX, pY, 25, '#EF4444');
                fxRef.current.spawnFloatText(pX, pY - 20, 'MAGNET! 🧲', '#EF4444');
              } else if (t.powerUp === 'DOUBLE') {
                doubleTimerRef.current = 8;
                setDoubleSeconds(8);
                fxRef.current.spawnSparkles(pX, pY, 25, '#FBBF24');
                fxRef.current.spawnFloatText(pX, pY - 20, '2X BOOST! ⭐', '#FBBF24');
              }
            }
          }
        }

        // Spawn new towers dynamically with varied challenges
        const spawnInterval = Math.max(140, 210 - currentScore * 2.5);
        const lastTower = towers.length > 0 ? towers[towers.length - 1] : null;
        if (!lastTower || lastTower.x < width - spawnInterval) {
          const minHeight = 55;
          const maxHeight = height - currentGap - 85;
          const topH = Math.floor(minHeight + Math.random() * (maxHeight - minHeight));
          const spawnX = lastTower ? Math.max(width + 20, lastTower.x + spawnInterval) : width + 20;

          // Randomly spawn moving tower starting at score >= 5
          const shouldMove = currentScore >= 5 && Math.random() < 0.45;
          const hasPowerUp = Math.random() < 0.25;
          const powerUpChoices: PowerUpType[] = ['SHIELD', 'MAGNET', 'DOUBLE'];
          const randomPowerUp = hasPowerUp
            ? powerUpChoices[Math.floor(Math.random() * powerUpChoices.length)]
            : undefined;

          towers.push({
            x: spawnX,
            topHeight: topH,
            bottomY: topH + currentGap,
            passed: false,
            hasCoin: !randomPowerUp && Math.random() > 0.25,
            coinCollected: false,
            isMoving: shouldMove,
            baseTopHeight: topH,
            moveSpeed: 0.003 + Math.random() * 0.002,
            moveAmp: Math.min(38, 20 + currentScore * 1.2),
            powerUp: randomPowerUp,
            powerUpCollected: false,
          });
        }

        if (towers.length > 0 && towers[0].x < -TOWER_WIDTH - 30) towers.shift();
      }

      // Draw Towers (Natcom 4G Cellular Antenna Towers)
      towersRef.current.forEach((tower) => {
        // Upper Telecom Tower
        const topGrad = ctx.createLinearGradient(tower.x, 0, tower.x + TOWER_WIDTH, 0);
        topGrad.addColorStop(0, '#1E293B');
        topGrad.addColorStop(0.25, '#CBD5E1');
        topGrad.addColorStop(0.5, '#DC2626'); // Natcom Red Branding Accent
        topGrad.addColorStop(0.75, '#E2E8F0');
        topGrad.addColorStop(1, '#0F172A');
        ctx.fillStyle = topGrad;
        ctx.fillRect(tower.x, 0, TOWER_WIDTH, tower.topHeight);

        // Lower Telecom Tower
        const botGrad = ctx.createLinearGradient(tower.x, 0, tower.x + TOWER_WIDTH, 0);
        botGrad.addColorStop(0, '#0F172A');
        botGrad.addColorStop(0.25, '#E2E8F0');
        botGrad.addColorStop(0.5, '#DC2626');
        botGrad.addColorStop(0.75, '#CBD5E1');
        botGrad.addColorStop(1, '#1E293B');
        ctx.fillStyle = botGrad;
        ctx.fillRect(tower.x, tower.bottomY, TOWER_WIDTH, height - tower.bottomY);

        // Sector Antenna Panels (Red & Steel Cap on Mast Heads)
        ctx.fillStyle = '#DC2626';
        ctx.fillRect(tower.x - 3, tower.topHeight - 12, TOWER_WIDTH + 6, 12);
        ctx.fillRect(tower.x - 3, tower.bottomY, TOWER_WIDTH + 6, 12);

        ctx.fillStyle = '#F8FAFC';
        ctx.fillRect(tower.x + 4, tower.topHeight - 10, 8, 8);
        ctx.fillRect(tower.x + TOWER_WIDTH - 12, tower.topHeight - 10, 8, 8);
        ctx.fillRect(tower.x + 4, tower.bottomY + 2, 8, 8);
        ctx.fillRect(tower.x + TOWER_WIDTH - 12, tower.bottomY + 2, 8, 8);

        // Holographic 4G Signal Waves (Vòng sóng viễn thông phát xạ từ đỉnh cột)
        const waveTime = time * 0.003;
        ctx.save();
        ctx.strokeStyle = '#38BDF8';
        ctx.shadowColor = '#0284C7';
        ctx.shadowBlur = 8;
        for (let w = 0; w < 3; w++) {
          const progress = (waveTime + w * 0.33) % 1;
          const waveRadius = 14 + progress * 32;
          const waveAlpha = Math.max(0, (1 - progress) * 0.8);
          ctx.globalAlpha = waveAlpha;
          ctx.lineWidth = Math.max(1, 2.8 - progress * 1.6);

          // Upper antenna signal wave (pointing downward into the flying lane)
          ctx.beginPath();
          ctx.arc(tower.x + TOWER_WIDTH / 2, tower.topHeight, waveRadius, Math.PI * 0.15, Math.PI * 0.85);
          ctx.stroke();

          // Lower antenna signal wave (pointing upward into the flying lane)
          ctx.beginPath();
          ctx.arc(tower.x + TOWER_WIDTH / 2, tower.bottomY, waveRadius, Math.PI * 1.15, Math.PI * 1.85);
          ctx.stroke();
        }
        ctx.restore();

        // Antenna Mast Rungs / Truss pattern
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1.5;
        for (let y = 10; y < tower.topHeight - 16; y += 18) {
          ctx.beginPath();
          ctx.moveTo(tower.x + 4, y);
          ctx.lineTo(tower.x + TOWER_WIDTH - 4, y + 12);
          ctx.stroke();
        }
        for (let y = tower.bottomY + 16; y < height - 30; y += 18) {
          ctx.beginPath();
          ctx.moveTo(tower.x + 4, y);
          ctx.lineTo(tower.x + TOWER_WIDTH - 4, y + 12);
          ctx.stroke();
        }

        // Flashing Warning Aviation LED on Tower tips
        const ledBlink = Math.sin(time * 0.008) > 0;
        ctx.fillStyle = ledBlink ? '#EF4444' : '#7F1D1D';
        ctx.shadowColor = '#EF4444';
        ctx.shadowBlur = ledBlink ? 12 : 0;
        ctx.beginPath();
        ctx.arc(tower.x + TOWER_WIDTH / 2, tower.topHeight - 6, 4, 0, Math.PI * 2);
        ctx.arc(tower.x + TOWER_WIDTH / 2, tower.bottomY + 6, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Microwave Transmission Dish Art
        ctx.fillStyle = '#94A3B8';
        ctx.beginPath();
        ctx.arc(tower.x + TOWER_WIDTH / 2, tower.topHeight - 20, 8, 0, Math.PI);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(tower.x + TOWER_WIDTH / 2, tower.bottomY + 20, 8, Math.PI, 0);
        ctx.fill();

        // Oscillating Tower Movement Indicator Icon
        if (tower.isMoving) {
          ctx.fillStyle = '#38BDF8';
          ctx.font = '10px sans-serif';
          ctx.fillText('↕', tower.x + TOWER_WIDTH / 2 - 4, tower.topHeight - 28);
        }

        // Draw Floating Coin
        if (tower.hasCoin && !tower.coinCollected) {
          const coinX = tower.x + TOWER_WIDTH / 2;
          const coinY = tower.topHeight + currentGap / 2 + Math.sin(time * 0.006) * 4;

          ctx.save();
          ctx.shadowColor = '#FBBF24';
          ctx.shadowBlur = 12;
          ctx.fillStyle = '#F59E0B';
          ctx.beginPath();
          ctx.arc(coinX, coinY, 9, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#FEF08A';
          ctx.beginPath();
          ctx.arc(coinX, coinY, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#B45309';
          ctx.font = 'bold 8px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('★', coinX, coinY);
          ctx.restore();
        }

        // Draw Floating Power-Up Item
        if (tower.powerUp && !tower.powerUpCollected) {
          const pX = tower.x + TOWER_WIDTH / 2;
          const pY = tower.topHeight + currentGap / 2 + Math.sin(time * 0.005) * 5;

          ctx.save();
          if (tower.powerUp === 'SHIELD') {
            ctx.shadowColor = '#38BDF8';
            ctx.shadowBlur = 15;
            ctx.fillStyle = 'rgba(14, 165, 233, 0.4)';
            ctx.beginPath();
            ctx.arc(pX, pY, 14, 0, Math.PI * 2);
            ctx.fill();
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🛡️', pX, pY);
          } else if (tower.powerUp === 'MAGNET') {
            ctx.shadowColor = '#EF4444';
            ctx.shadowBlur = 15;
            ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
            ctx.beginPath();
            ctx.arc(pX, pY, 14, 0, Math.PI * 2);
            ctx.fill();
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🧲', pX, pY);
          } else if (tower.powerUp === 'DOUBLE') {
            ctx.shadowColor = '#F59E0B';
            ctx.shadowBlur = 15;
            ctx.fillStyle = 'rgba(245, 158, 11, 0.4)';
            ctx.beginPath();
            ctx.arc(pX, pY, 14, 0, Math.PI * 2);
            ctx.fill();
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('⭐', pX, pY);
          }
          ctx.restore();
        }
      });

      // 4. Bird Physics & Collision Logic
      const bird = birdRef.current;
      const birdX = width * 0.28;

      if (gameState === 'PLAYING') {
        bird.vy += GRAVITY;
        bird.y += bird.vy;
        bird.angle = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, bird.vy * 0.08));

        // Ground & Ceiling Collisions
        if (bird.y + 14 >= height - 25 || bird.y - 14 <= 0) {
          if (bird.shield && time > invulnerableUntilRef.current) {
            // Shield absorbs impact!
            bird.shield = false;
            setHasShield(false);
            bird.vy = -4.5;
            invulnerableUntilRef.current = time + 800;
            fxRef.current.addScreenShake(0.5);
            fxRef.current.spawnSparkles(birdX, bird.y, 25, '#38BDF8');
            fxRef.current.spawnFloatText(birdX, bird.y - 25, 'SHIELD BROKEN! 🛡️', '#38BDF8');
            GameSounds.playWinFanfare();
          } else if (time > invulnerableUntilRef.current) {
            handleGameOver();
          }
        }

        // Tower Collisions
        for (const t of towersRef.current) {
          if (birdX + 13 > t.x && birdX - 13 < t.x + TOWER_WIDTH) {
            if (bird.y - 13 < t.topHeight || bird.y + 13 > t.bottomY) {
              if (bird.shield && time > invulnerableUntilRef.current) {
                // Shield absorbs tower impact!
                bird.shield = false;
                setHasShield(false);
                bird.vy = -4.5;
                bird.y = t.topHeight + currentGap / 2;
                invulnerableUntilRef.current = time + 800;
                fxRef.current.addScreenShake(0.6);
                fxRef.current.spawnSparkles(birdX, bird.y, 25, '#38BDF8');
                fxRef.current.spawnFloatText(birdX, bird.y - 25, 'SHIELD SAVED YOU! 🛡️', '#38BDF8');
                GameSounds.playWinFanfare();
              } else if (time > invulnerableUntilRef.current) {
                handleGameOver();
                break;
              }
            }
          }
        }
      } else if (gameState === 'IDLE') {
        bird.y = height * 0.45 + Math.sin(time * 0.005) * 8;
      }

      // 5. Draw Bird
      ctx.save();
      ctx.translate(birdX, bird.y);
      ctx.rotate(bird.angle);

      // Active 4G Shield Aura around Bird
      if (bird.shield) {
        ctx.save();
        ctx.shadowColor = '#38BDF8';
        ctx.shadowBlur = 18;
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 2.5;
        ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
        ctx.beginPath();
        ctx.arc(0, 0, 24 + Math.sin(time * 0.01) * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      // Magnet Aura Trails
      if (magnetTimerRef.current > 0) {
        ctx.save();
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(0, 0, 28, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Bird Body (3D Radial Gradient)
      const birdGrad = ctx.createRadialGradient(-2, -2, 4, 0, 0, 18);
      birdGrad.addColorStop(0, '#FEF08A');
      birdGrad.addColorStop(0.4, '#F59E0B');
      birdGrad.addColorStop(1, '#B45309');
      ctx.fillStyle = birdGrad;
      ctx.beginPath();
      ctx.ellipse(0, 0, 19, 15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#78350F';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Natcom Red Pilot Helmet
      ctx.fillStyle = '#DC2626';
      ctx.beginPath();
      ctx.arc(3, -6, 14, Math.PI * 1.05, Math.PI * 2.15);
      ctx.fill();
      // Gold Pilot Goggles
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.ellipse(8, -8, 6, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#38BDF8';
      ctx.beginPath();
      ctx.ellipse(8, -8, 4, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Feathered Layered Wing
      const wingAngle = bird.vy < 0 ? -Math.PI / 4 : Math.PI / 8;
      ctx.save();
      ctx.translate(-4, 3);
      ctx.rotate(wingAngle);
      ctx.fillStyle = '#FEF08A';
      ctx.beginPath();
      ctx.ellipse(0, 0, 11, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#D97706';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();

      // Expressive Eye
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(9, -2, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0F172A';
      ctx.beginPath();
      ctx.arc(11, -2, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(12, -3, 1.2, 0, Math.PI * 2);
      ctx.fill();

      // Golden Beak with Shadow
      ctx.fillStyle = '#EA580C';
      ctx.beginPath();
      ctx.moveTo(15, -1);
      ctx.lineTo(26, 3);
      ctx.lineTo(15, 7);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#C2410C';
      ctx.beginPath();
      ctx.moveTo(15, 3);
      ctx.lineTo(26, 3);
      ctx.lineTo(15, 7);
      ctx.closePath();
      ctx.fill();

      ctx.restore();

      // 6. Lush 3D Grass Strip
      ctx.fillStyle = currentScore < 18 ? '#14532D' : '#0F172A';
      ctx.fillRect(0, height - 25, width, 25);
      ctx.fillStyle = currentScore < 18 ? '#22C55E' : '#4338CA';
      ctx.fillRect(0, height - 25, width, 6);
      ctx.fillStyle = currentScore < 18 ? '#86EFAC' : '#818CF8';
      ctx.fillRect(0, height - 25, width, 2);

      // 7. Update and Render Particles & Floating Text FX
      fxRef.current.update();
      fxRef.current.render(ctx);

      ctx.restore();

      frameIdRef.current = requestAnimationFrame(render);
    };

    frameIdRef.current = requestAnimationFrame(render);
    return () => {
      if (frameIdRef.current) cancelAnimationFrame(frameIdRef.current);
    };
  }, [gameState, handleGameOver]);

  const claimReward = () => {
    if (onClaimReward && rewardAmount > 0) {
      onClaimReward(rewardAmount);
    }
    setShowRewardModal(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col font-sans select-none pb-12 animate-fade-in">
      <GameHeader
        title={t('games.flappy.title')}
        subtitle={highScore > 0 ? t('games.flappy.best_score', { best: highScore }) : undefined}
        onBack={onBack}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
        onRestart={initGame}
        restartTooltip={t('games.common.btn_play_again')}
        onHelp={() => setShowTutorial(true)}
      />

      {/* ── GAME STAGE CONTAINER ── */}
      <main className="flex-1 max-w-lg mx-auto w-full px-3 py-3 flex flex-col items-center justify-between">
        {/* Compact HUD & Status Bar */}
        <div className="w-full flex items-center justify-between gap-2 mb-2 bg-slate-900/60 border border-slate-800/80 rounded-2xl px-3 py-2">
          <div className="flex items-center gap-2">
            <p className="text-[11px] text-slate-400 font-medium">
              {t('games.flappy.speed_level', { speed: (1 + Math.min(1.0, score * 0.05)).toFixed(1) })}
            </p>
            {/* Active Power-up Badges */}
            <div className="flex items-center gap-1.5">
              {hasShield && (
                <span className="flex items-center gap-1 bg-sky-500/20 text-sky-400 border border-sky-500/40 text-[9px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                  <Shield className="w-3 h-3" />
                  {t('games.flappy.shield_active')}
                </span>
              )}
              {magnetSeconds > 0 && (
                <span className="flex items-center gap-1 bg-red-500/20 text-red-400 border border-red-500/40 text-[9px] font-bold px-2 py-0.5 rounded-full">
                  <Magnet className="w-3 h-3" />
                  {t('games.flappy.magnet_active', { sec: magnetSeconds })}
                </span>
              )}
              {doubleSeconds > 0 && (
                <span className="flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-bold px-2 py-0.5 rounded-full animate-bounce">
                  <Zap className="w-3 h-3" />
                  {t('games.flappy.double_active', { sec: doubleSeconds })}
                </span>
              )}
            </div>
            {/* 4G Signal Badge */}
            <div className="flex items-center gap-1.5 bg-sky-500/15 border border-sky-500/40 px-2 py-0.5 rounded-full text-[9px] text-sky-300 font-bold">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>4G NATCOM</span>
            </div>
          </div>

          <div className="bg-amber-950/60 border border-amber-500/40 px-2.5 py-1 rounded-xl text-center shrink-0">
            <span className="text-[8px] text-amber-300 block uppercase font-bold">{t('games.flappy.high_score', { best: '' })}</span>
            <span className="font-mono font-black text-amber-400 text-xs">{highScore}</span>
          </div>
        </div>

        {/* Interactive Canvas Board */}
        <div
          onClick={jump}
          onTouchStart={(e) => {
            e.preventDefault();
            jump();
          }}
          className="relative w-full aspect-[4/5] max-h-[500px] rounded-3xl overflow-hidden shadow-2xl border-2 border-amber-500/30 cursor-pointer touch-none select-none bg-sky-900"
        >
          <canvas ref={canvasRef} className="w-full h-full block" />

          {/* Live Score Overlay */}
          <div className="absolute top-4 left-0 right-0 flex justify-center pointer-events-none">
            <div className="bg-black/40 backdrop-blur-md px-4 py-1 rounded-full border border-white/20 text-2xl sm:text-3xl font-black font-mono text-white shadow-lg flex items-center gap-2">
              <span>{score}</span>
              {doubleSeconds > 0 && (
                <span className="text-xs text-amber-400 font-bold bg-amber-500/30 px-1.5 py-0.5 rounded border border-amber-400/50">
                  2X ⭐
                </span>
              )}
            </div>
          </div>

          {/* IDLE Start Overlay */}
          {gameState === 'IDLE' && (
            <div className="absolute inset-0 bg-slate-950/30 backdrop-blur-[1px] flex flex-col items-center justify-center p-6 text-center">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center text-3xl shadow-xl animate-bounce mb-3">
                🕊️
              </div>
              <h3 className="text-lg font-black text-white mb-1">{t('games.flappy.btn_start')}</h3>
              <p className="text-xs text-amber-200 mb-4">{t('games.flappy.tap_to_fly')}</p>
              <button
                onClick={jump}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black rounded-xl text-sm shadow-lg hover:brightness-110 active:scale-95 transition"
              >
                {t('games.flappy.btn_start')}
              </button>
            </div>
          )}

          {/* GAME OVER Overlay */}
          {gameState === 'GAMEOVER' && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fade-in">
              <div className="w-14 h-14 rounded-2xl bg-red-600/30 border border-red-500 text-red-400 flex items-center justify-center text-2xl mb-2">
                💥
              </div>
              <h3 className="text-lg font-black text-red-400 mb-1">{t('games.flappy.game_over')}</h3>
              <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-700 w-full max-w-[200px] mb-4 space-y-1">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>{t('games.flappy.score', { score: '' })}</span>
                  <span className="font-mono font-bold text-white text-sm">{score}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>{t('games.flappy.best_score', { best: '' })}</span>
                  <span className="font-mono font-bold text-amber-400 text-sm">{highScore}</span>
                </div>
              </div>
              <button
                onClick={initGame}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black rounded-xl text-sm shadow-lg hover:brightness-110 active:scale-95 transition flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{t('games.flappy.btn_retry')}</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer Action Guide */}
        <div className="w-full text-center mt-3 text-xs text-slate-400">
          <p>{t('games.flappy.tap_to_fly')}</p>
        </div>
      </main>

      {/* ── REWARD CONGRATULATIONS MODAL ── */}
      {showRewardModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-amber-500/50 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl relative overflow-hidden">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center text-3xl mx-auto shadow-xl">
              🎁
            </div>
            <div>
              <h3 className="text-lg font-black text-white">{t('games.common.congratulations')}</h3>
              <p className="text-xs text-slate-400 mt-1">{t('games.flappy.pipes_passed', { count: score })}</p>
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
        gameTitle={t('games.flappy.title')}
        gameIcon="🕊️"
        goal={t('games.flappy.tutorial.goal')}
        controls={t('games.flappy.tutorial.controls')}
        scoring={t('games.flappy.tutorial.scoring')}
        tips={t('games.flappy.tutorial.tips')}
      />
    </div>
  );
};
