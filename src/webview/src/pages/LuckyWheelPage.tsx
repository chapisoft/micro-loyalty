import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Sparkles,
  Trophy,
  PlusCircle,
  ArrowLeft,
  Volume2,
  VolumeX,
  Gift,
  Zap,
  Flame
} from 'lucide-react';
import { LoyaltyJSBridge } from '../bridge/LoyaltyJSBridge';
import { LoyaltyApi, WheelPrizeItem } from '../services/api';

interface ConfettiParticle {
  x: number;
  y: number;
  size: number;
  color: string;
  speedX: number;
  speedY: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
}

const DEFAULT_PRIZES: WheelPrizeItem[] = [
  { prizeId: 1, prizeName: '100 Điểm Thưởng', prizeType: 'POINTS', prizeValue: 100, displayOrder: 0, colorCode: '#F59E0B' },
  { prizeId: 2, prizeName: 'Voucher 50 HTG', prizeType: 'VOUCHER', prizeValue: 50, displayOrder: 1, colorCode: '#EF4444' },
  { prizeId: 3, prizeName: 'Chúc May Mắn', prizeType: 'NO_LUCK', prizeValue: 0, displayOrder: 2, colorCode: '#06B6D4' },
  { prizeId: 4, prizeName: '200 Điểm Thưởng', prizeType: 'POINTS', prizeValue: 200, displayOrder: 3, colorCode: '#3B82F6' },
  { prizeId: 5, prizeName: '500 HTG Tiền Mặt', prizeType: 'CASHBACK', prizeValue: 500, displayOrder: 4, colorCode: '#10B981' },
  { prizeId: 6, prizeName: 'Thêm 1 Lượt Quay', prizeType: 'TURNS', prizeValue: 1, displayOrder: 5, colorCode: '#8B5CF6' },
];

const SLICE_GRADIENTS = [
  ['#F59E0B', '#B45309'], // Gold
  ['#EF4444', '#991B1B'], // Crimson
  ['#06B6D4', '#0E7490'], // Cyan
  ['#3B82F6', '#1D4ED8'], // Blue
  ['#10B981', '#047857'], // Emerald
  ['#8B5CF6', '#5B21B6'], // Purple
  ['#EC4899', '#9D174D'], // Pink
  ['#F97316', '#C2410C'], // Orange
];

const RECENT_WINNERS = [
  { phone: '0987***123', prize: '500 HTG Tiền Mặt Ví', time: 'Vừa xong', avatar: '🎁' },
  { phone: '0976***456', prize: 'Voucher 100 HTG Delimart', time: '1 phút trước', avatar: '🎟️' },
  { phone: '0965***789', prize: '200 Điểm Thưởng Liên Minh', time: '3 phút trước', avatar: '⭐' },
  { phone: '0988***999', prize: '100 Điểm Thưởng Natcash', time: '6 phút trước', avatar: '✨' },
  { phone: '0912***888', prize: '1GB Data 4G Tốc Độ Cao', time: '9 phút trước', avatar: '⚡' },
];

const numSlicesDefault = DEFAULT_PRIZES.length || 6;
const defaultSliceAngle = (2 * Math.PI) / numSlicesDefault;
// Initial angle to perfectly center Prize 0 at 9 o'clock pointer (PI)
const INITIAL_WHEEL_ANGLE = Math.PI - defaultSliceAngle / 2;

export const LuckyWheelPage: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const confettiCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [prizes, setPrizes] = useState<WheelPrizeItem[]>(DEFAULT_PRIZES);
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentAngle, setCurrentAngle] = useState(INITIAL_WHEEL_ANGLE);
  const [freeTurns, setFreeTurns] = useState(2);
  const [points, setPoints] = useState(2480);
  const [wonPrize, setWonPrize] = useState<WheelPrizeItem | null>(null);
  const [showPrizeModal, setShowPrizeModal] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [pointerWobble, setPointerWobble] = useState(0);
  const [ledPhase, setLedPhase] = useState(0);

  const tenantId = new URLSearchParams(window.location.search).get('tenantId') || 'TENANT_NATCASH';
  const userId = new URLSearchParams(window.location.search).get('userId') || '50937123456';
  const wheelCode = tenantId === 'TENANT_MICRO_CRM' ? 'LUCKY_WHEEL_CRM' : 'LUCKY_WHEEL_NATCASH';

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (window.location.hash && window.location.hash !== '#/' && window.location.hash !== '') {
      window.history.back();
    } else {
      LoyaltyJSBridge.closeWebview();
    }
  };

  // Load live wheel configuration and prizes from DB/API
  const loadWheelConfig = useCallback(async () => {
    try {
      const config = await LoyaltyApi.getLuckyWheelConfig(userId, wheelCode);
      if (config?.prizes && config.prizes.length > 0) {
        setPrizes(config.prizes);
      }
      if (config?.remainingSpinsToday !== undefined) {
        setFreeTurns(config.remainingSpinsToday);
      }
    } catch (e) {
      console.warn('Sử dụng cấu hình vòng quay mặc định:', e);
    }
  }, [userId, wheelCode]);

  useEffect(() => {
    loadWheelConfig();
  }, [loadWheelConfig]);

  // Audio synthesis Web Audio API (Tick & Win Melody)
  const playSound = (freq: number, type: OscillatorType = 'sine', duration = 0.08, gainVal = 0.15) => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(gainVal, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Ignore audio context errors
    }
  };

  const playWinMelody = () => {
    if (!soundEnabled) return;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      setTimeout(() => {
        playSound(freq, 'triangle', 0.25, 0.2);
      }, i * 120);
    });
  };

  // Canvas 2D High-Resolution Wheel Rendering
  const drawWheel = useCallback((angle: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Retina display sharp rendering
    const dpr = window.devicePixelRatio || 2;
    const size = 500;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 16;
    const numSlices = prizes.length || 6;
    const sliceAngle = (2 * Math.PI) / numSlices;

    ctx.clearRect(0, 0, size, size);

    // 1. Outer Golden Metallic Rim Ring
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 12, 0, 2 * Math.PI);
    const rimGrad = ctx.createLinearGradient(0, 0, size, size);
    rimGrad.addColorStop(0, '#F59E0B');
    rimGrad.addColorStop(0.25, '#FEF3C7');
    rimGrad.addColorStop(0.5, '#D97706');
    rimGrad.addColorStop(0.75, '#FDE68A');
    rimGrad.addColorStop(1, '#78350F');
    ctx.fillStyle = rimGrad;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 8;
    ctx.fill();
    ctx.restore();

    // 2. Outer Bezel Inner Ring with Pulsing LED Bulbs
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 3, 0, 2 * Math.PI);
    ctx.fillStyle = '#1E1B4B'; // Deep Indigo
    ctx.fill();
    ctx.restore();

    // Draw 20 LED Bulbs
    const numLeds = 20;
    for (let i = 0; i < numLeds; i++) {
      const ledAngle = (i * 2 * Math.PI) / numLeds + angle * 0.1;
      const ledX = centerX + (radius + 7.5) * Math.cos(ledAngle);
      const ledY = centerY + (radius + 7.5) * Math.sin(ledAngle);

      ctx.save();
      ctx.beginPath();
      ctx.arc(ledX, ledY, 4, 0, 2 * Math.PI);
      const isLit = (i + ledPhase) % 2 === 0;
      ctx.fillStyle = isLit ? '#FEF08A' : '#78350F';
      if (isLit) {
        ctx.shadowColor = '#FBBF24';
        ctx.shadowBlur = 10;
      }
      ctx.fill();
      ctx.restore();
    }

    // 3. Wheel Slices & Content
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(angle);

    prizes.forEach((prize, i) => {
      const startAngle = i * sliceAngle;
      const endAngle = startAngle + sliceAngle;
      const midAngle = startAngle + sliceAngle / 2;

      // Draw Slice Wedge
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.closePath();

      // Slice Gradient
      const gradColors = SLICE_GRADIENTS[i % SLICE_GRADIENTS.length];
      const sliceGrad = ctx.createRadialGradient(0, 0, 20, 0, 0, radius);
      sliceGrad.addColorStop(0, gradColors[0]);
      sliceGrad.addColorStop(1, gradColors[1]);
      ctx.fillStyle = sliceGrad;
      ctx.fill();

      // Slice Divider Line (Gold Shimmer)
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(radius * Math.cos(startAngle), radius * Math.sin(startAngle));
      ctx.strokeStyle = '#FEF3C7';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Inner Light Bevel Arc
      ctx.beginPath();
      ctx.arc(0, 0, radius - 4, startAngle, endAngle);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // ── DRAW SLICE CONTENT: TEXT FLOWS FROM OUTSIDE TO INSIDE ──
      ctx.save();
      ctx.rotate(midAngle);

      // 3.1 Mini Icon at outer position (r = radius - 20)
      let icon = '🎁';
      if (prize.prizeType === 'POINTS') icon = '⭐';
      else if (prize.prizeType === 'VOUCHER') icon = '🎟️';
      else if (prize.prizeType === 'CASHBACK') icon = '💵';
      else if (prize.prizeType === 'TURNS') icon = '⚡';
      else if (prize.prizeType === 'NO_LUCK') icon = '🍀';

      ctx.save();
      ctx.translate(radius - 20, 0);
      ctx.rotate(Math.PI / 2);
      ctx.font = '19px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(icon, 0, 0);
      ctx.restore();

      // 3.2 Prize Text: starts from outside (radius - 46) and writes inwards towards center
      ctx.save();
      ctx.translate(radius - 46, 0);
      ctx.rotate(Math.PI); // Inverts direction: writes horizontally from outer rim towards center

      ctx.font = 'bold 14.5px "Inter", -apple-system, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
      ctx.shadowBlur = 5;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;

      const name = prize.prizeName || 'Quà Tặng';
      ctx.fillText(name, 0, 0);
      ctx.restore();

      ctx.restore();
    });

    ctx.restore();

    // 4. Compact Elegant Center Gold Hub Base (Radius 24px, no text overlap)
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, 24, 0, 2 * Math.PI);
    const centerGrad = ctx.createLinearGradient(centerX - 24, centerY - 24, centerX + 24, centerY + 24);
    centerGrad.addColorStop(0, '#FEF3C7');
    centerGrad.addColorStop(0.5, '#F59E0B');
    centerGrad.addColorStop(1, '#78350F');
    ctx.fillStyle = centerGrad;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 3;
    ctx.fill();
    ctx.restore();

    // Center Inner Chrome Ring
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, 18, 0, 2 * Math.PI);
    ctx.fillStyle = '#0F172A';
    ctx.fill();
    ctx.strokeStyle = '#FDE68A';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Center Sparkling Star Icon
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✨', centerX, centerY);
    ctx.restore();
  }, [prizes, ledPhase]);

  // Initial draw and LED bulb chase animation
  useEffect(() => {
    drawWheel(currentAngle);
  }, [drawWheel, currentAngle]);

  useEffect(() => {
    const timer = setInterval(() => {
      setLedPhase((p) => (p + 1) % 2);
    }, 450);
    return () => clearInterval(timer);
  }, []);

  // Confetti Particle Explosion
  const triggerConfetti = () => {
    const canvas = confettiCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#F59E0B', '#EF4444', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#FEF08A'];
    const particles: ConfettiParticle[] = [];

    for (let i = 0; i < 120; i++) {
      particles.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedX: (Math.random() - 0.5) * 16,
        speedY: (Math.random() - 0.8) * 16,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 12,
        opacity: 1,
      });
    }

    let start: number | null = null;
    const duration = 2800;

    const render = (time: number) => {
      if (!start) start = time;
      const elapsed = time - start;
      const progress = elapsed / duration;

      if (progress < 1) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach((p) => {
          p.x += p.speedX;
          p.y += p.speedY;
          p.speedY += 0.35; // Gravity
          p.rotation += p.rotationSpeed;
          p.opacity = 1 - progress;

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.globalAlpha = Math.max(0, p.opacity);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
          ctx.restore();
        });
        requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    render(performance.now());
  };

  // Spin Execution
  const handleSpin = async () => {
    if (isSpinning) return;
    if (freeTurns <= 0 && points < 20) {
      setShowBuyModal(true);
      return;
    }

    setIsSpinning(true);
    setWonPrize(null);

    // Haptic vibration feedback
    if (navigator.vibrate) navigator.vibrate(50);

    let targetSliceIndex = 0;
    let serverPrize: WheelPrizeItem | null = null;

    try {
      const result = await LoyaltyApi.spinLuckyWheel(userId, false, wheelCode);
      if (result && result.wonPrize) {
        targetSliceIndex = result.wonPrize.sliceIndex ?? 0;
        serverPrize = {
          prizeId: result.wonPrize.prizeId,
          prizeName: result.wonPrize.prizeName,
          prizeType: result.wonPrize.prizeType,
          prizeValue: result.wonPrize.prizeValue,
          displayOrder: targetSliceIndex,
          colorCode: '#F59E0B',
        };
        if (result.newPointBalance !== undefined) {
          setPoints(result.newPointBalance);
        }
      }
    } catch {
      targetSliceIndex = Math.floor(Math.random() * prizes.length);
      serverPrize = prizes[targetSliceIndex];
    }

    const selectedPrize = serverPrize || prizes[targetSliceIndex] || DEFAULT_PRIZES[0];
    setFreeTurns((prev) => Math.max(0, prev - 1));

    const numSlices = prizes.length || 6;
    const sliceAngle = (2 * Math.PI) / numSlices;
    // Exact target angle to place the midAngle of targetSliceIndex at 9 o'clock (PI)
    const targetMidAngle = targetSliceIndex * sliceAngle + sliceAngle / 2;
    const targetOffset = Math.PI - targetMidAngle;

    // Normalize current angle and target offset to [0, 2*PI)
    const normalizedCurrent = ((currentAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    const normalizedTarget = ((targetOffset % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

    let delta = normalizedTarget - normalizedCurrent;
    if (delta <= 0) {
      delta += 2 * Math.PI;
    }
    const totalRounds = 6 + Math.floor(Math.random() * 2);
    const finalAngle = currentAngle + totalRounds * 2 * Math.PI + delta;
    const startAngle = currentAngle;

    const startTime = performance.now();
    const duration = 4500;
    let lastTickAngle = startAngle;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Custom smooth deceleration cubic-bezier ease-out
      const easeOut = 1 - Math.pow(1 - progress, 4);
      const angle = startAngle + (finalAngle - startAngle) * easeOut;

      setCurrentAngle(angle);
      drawWheel(angle);

      // Tick sound and pointer micro-wobble
      if (Math.abs(angle - lastTickAngle) >= sliceAngle * 0.9) {
        playSound(700 + Math.random() * 150, 'triangle', 0.03, 0.12);
        setPointerWobble(15);
        setTimeout(() => setPointerWobble(0), 60);
        if (navigator.vibrate) navigator.vibrate(10);
        lastTickAngle = angle;
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsSpinning(false);
        setWonPrize(selectedPrize);
        setShowPrizeModal(true);
        playWinMelody();
        triggerConfetti();

        if (selectedPrize.prizeType === 'POINTS') {
          setPoints((p) => p + selectedPrize.prizeValue);
        } else if (selectedPrize.prizeType === 'TURNS') {
          setFreeTurns((t) => t + selectedPrize.prizeValue);
        }
      }
    };

    requestAnimationFrame(animate);
  };

  const handleBuyTurn = async (turnsCount: number = 1, amountHtg: number = 20) => {
    try {
      const res = await LoyaltyJSBridge.requestPayment({
        amount: amountHtg,
        itemCode: `BUY_SPIN_${turnsCount}_TURNS`,
        itemName: `Mua ${turnsCount} Lượt Quay May Mắn`,
        transactionRef: 'SPIN_' + Date.now(),
      });
      if (res.success) {
        setFreeTurns((t) => t + turnsCount);
        setShowBuyModal(false);
      }
    } catch {
      setFreeTurns((t) => t + turnsCount);
      setShowBuyModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans relative overflow-x-hidden select-none pb-24 md:pb-12">
      {/* Confetti Explosion Canvas */}
      <canvas
        ref={confettiCanvasRef}
        className="fixed inset-0 pointer-events-none z-50"
      />

      {/* ── ATMOSPHERIC CASINO LIGHTING & SUNBURST RAYS (Light Theme) ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Ambient Warm Glow Orbs */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[550px] h-[550px] bg-gradient-to-b from-amber-200/40 via-orange-200/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-indigo-100/50 rounded-full blur-3xl" />
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-amber-100/60 rounded-full blur-3xl" />
      </div>

      {/* ── TOP LUXURY APP BAR (Light Theme) ── */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 sm:h-16 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-95 transition flex items-center justify-center text-slate-700 border border-slate-200"
            title={t('nav.back')}
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
              <h1 className="text-sm sm:text-base font-black tracking-wider uppercase bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                {t('wheel.title')}
              </h1>
            </div>
            <p className="text-[10px] text-amber-700 font-medium tracking-wide">{t('wheel.subtitle')}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-95 transition flex items-center justify-center text-amber-600 border border-slate-200"
              title="Âm thanh"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            </button>
          </div>
        </div>

        {/* Live Winners Marquee Ticker (Continuous Auto-scrolling Floating Marquee) */}
        <div className="bg-amber-50 border-t border-b border-amber-200/80 py-1.5 px-3 flex items-center overflow-hidden relative select-none">
          {/* Sticky Badge Label */}
          <div className="flex items-center space-x-1.5 z-10 shrink-0 pr-2.5 bg-amber-50">
            <span className="bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping" />
              {t('wheel.news_tag')}
            </span>
          </div>

          {/* Auto Floating Track Container */}
          <div className="flex-1 overflow-hidden relative whitespace-nowrap">
            <div className="animate-marquee-infinite flex items-center space-x-8">
              {/* Loop Set 1 */}
              {RECENT_WINNERS.map((w, idx) => (
                <span key={`w1-${idx}`} className="inline-flex items-center space-x-1.5 text-xs text-amber-950 font-medium shrink-0">
                  <span>{w.avatar}</span>
                  <span className="text-slate-900 font-bold">{w.phone}</span>
                  <span className="text-amber-800 font-normal">{t('wheel.just_won')}</span>
                  <span className="text-orange-700 font-black">{w.prize}</span>
                  <span className="text-amber-300 font-bold">•</span>
                </span>
              ))}
              {/* Loop Set 2 (Duplicate for Seamless Endless Scroll) */}
              {RECENT_WINNERS.map((w, idx) => (
                <span key={`w2-${idx}`} className="inline-flex items-center space-x-1.5 text-xs text-amber-950 font-medium shrink-0">
                  <span>{w.avatar}</span>
                  <span className="text-slate-900 font-bold">{w.phone}</span>
                  <span className="text-amber-800 font-normal">{t('wheel.just_won')}</span>
                  <span className="text-orange-700 font-black">{w.prize}</span>
                  <span className="text-amber-300 font-bold">•</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* ── MAIN RESPONSIVE CONTENT ── */}
      <main className="max-w-6xl mx-auto px-2 sm:px-4 py-3 sm:py-6 flex-1 w-full relative z-10 flex flex-col justify-between">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 items-start">
          
          {/* ── LEFT COLUMN: Turn & Point Badges, 3D Canvas Wheel, Big CTA ── */}
          <div className="lg:col-span-7 flex flex-col items-center space-y-3 sm:space-y-5 w-full">
            
            {/* Balance Cards */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 w-full max-w-md">
              {/* Free Turns Card */}
              <div className="bg-white rounded-2xl p-3 sm:p-4 border border-amber-200 shadow-sm flex items-center justify-between relative overflow-hidden group">
                <div>
                  <span className="text-[11px] text-slate-500 font-medium">{t('wheel.free_turns')}</span>
                  <div className="text-lg sm:text-2xl font-black text-amber-600 tracking-tight leading-none mt-1 font-mono">
                    {freeTurns} <span className="text-xs font-semibold text-slate-400">{t('wheel.turns_unit')}</span>
                  </div>
                </div>
                <button
                  onClick={() => setShowBuyModal(true)}
                  className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 active:scale-95 text-slate-950 flex items-center justify-center font-black shadow-sm transition"
                  title={t('wheel.modal_buy_title')}
                >
                  <PlusCircle className="w-5 h-5" />
                </button>
              </div>

              {/* Point Balance Card */}
              <div className="bg-white rounded-2xl p-3 sm:p-4 border border-emerald-200 shadow-sm flex items-center justify-between relative overflow-hidden">
                <div>
                  <span className="text-[11px] text-slate-500 font-medium">{t('wheel.available_points')}</span>
                  <div className="text-lg sm:text-2xl font-black text-emerald-600 tracking-tight leading-none mt-1 font-mono">
                    {points.toLocaleString()} <span className="text-xs font-semibold text-slate-400">{t('nav.points_unit')}</span>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
                  <Trophy className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* ── 3D CANVAS WHEEL CONTAINER (EXPANDED TO SCREEN BORDER) ── */}
            <div className="relative flex items-center justify-center my-1 sm:my-2 w-full max-w-[460px] sm:max-w-[490px] px-0.5">
              
              {/* 3D Golden Needle Pointer at 9 O'Clock (Left side, Pointing Right into Wheel) */}
              <div
                className="absolute left-0 z-30 transition-transform duration-100 flex items-center pointer-events-none"
                style={{
                  top: '50%',
                  transform: `translateX(-6px) translateY(-50%) rotate(${pointerWobble}deg)`,
                  transformOrigin: 'left center',
                }}
              >
                {/* Pointer Jewel Crown Bulb */}
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 via-yellow-300 to-amber-100 border-2 border-amber-950 shadow-2xl flex items-center justify-center -mr-1.5 relative z-10">
                  <div className="w-3 h-3 rounded-full bg-red-600 border border-white shadow-inner animate-pulse" />
                </div>
                {/* 3D Arrow Needle Pointing Right */}
                <div
                  className="w-0 h-0 border-y-[13px] border-y-transparent border-l-[32px] border-l-amber-500 drop-shadow-xl"
                />
              </div>

              {/* Canvas Wheel Outer Stand Base (Enlarged to edge of screen) */}
              <div className="p-1 sm:p-2.5 rounded-full bg-gradient-to-b from-amber-200/90 via-white to-amber-100 shadow-2xl border-2 border-amber-300 w-full aspect-square max-w-[440px] max-h-[440px] flex items-center justify-center">
                <canvas
                  ref={canvasRef}
                  className="rounded-full cursor-pointer touch-none select-none w-full h-full"
                  onClick={!isSpinning ? handleSpin : undefined}
                />
              </div>

              {/* Floating Compact Luxury Center Pin (No text, never covers slice text) */}
              <button
                onClick={handleSpin}
                disabled={isSpinning}
                aria-label={t('wheel.btn_spin')}
                className="absolute z-20 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-300 to-amber-600 hover:scale-105 active:scale-90 disabled:cursor-not-allowed transition transform shadow-xl shadow-amber-500/40 border-2 border-white flex items-center justify-center cursor-pointer"
              >
                <Flame className={`w-5 h-5 text-slate-950 fill-current ${isSpinning ? 'animate-spin' : 'animate-pulse'}`} />
              </button>
            </div>

            {/* ── BIG GLOWING BOTTOM CTA BUTTON ── */}
            <div className="w-full max-w-md pt-1">
              <button
                onClick={handleSpin}
                disabled={isSpinning}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm sm:text-base tracking-wider uppercase shadow-xl shadow-amber-500/30 border-t-2 border-yellow-200 active:scale-98 disabled:opacity-70 transition flex items-center justify-center space-x-2 animate-shimmer"
              >
                <Flame className="w-5 h-5 fill-current" />
                <span>{freeTurns > 0 ? t('wheel.btn_spin_now') : t('wheel.btn_spin_points')}</span>
              </button>
              <p className="text-center text-[11px] text-slate-500 mt-2">
                {freeTurns > 0 ? t('wheel.hint_free', { turns: freeTurns }) : t('wheel.hint_points')}
              </p>
            </div>
          </div>

          {/* ── RIGHT COLUMN: Winners, Prize Matrix & Turn Shop ── */}
          <div className="lg:col-span-5 space-y-4 sm:space-y-6">
            
            {/* Live Winners Card */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                <div className="flex items-center space-x-2 font-black text-sm text-slate-900">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span>{t('wheel.winners_board')}</span>
                </div>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> {t('wheel.live_badge')}
                </span>
              </div>

              <div className="space-y-2">
                {RECENT_WINNERS.slice(0, 4).map((winner, idx) => (
                  <div key={idx} className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
                        {winner.avatar}
                      </div>
                      <div>
                        <div className="font-mono font-bold text-slate-800">{winner.phone}</div>
                        <div className="text-[10px] text-slate-400">{winner.time}</div>
                      </div>
                    </div>
                    <span className="font-black text-amber-600">{winner.prize}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Prize Rewards List */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center space-x-2 font-black text-sm text-slate-900">
                  <Gift className="w-4 h-4 text-indigo-600" />
                  <span>{t('wheel.prizes_structure')}</span>
                </div>
                <span className="text-[10px] text-slate-500 font-medium">{t('wheel.prizes_100_percent')}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {prizes.map((prize, idx) => (
                  <div
                    key={prize.prizeId || idx}
                    className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center space-x-2.5 text-xs hover:border-amber-300 transition"
                  >
                    <span className="w-3 h-3 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: prize.colorCode }} />
                    <span className="font-semibold text-slate-800 truncate">{prize.prizeName}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Buy Turns Banner */}
            <div className="bg-gradient-to-br from-indigo-50 via-white to-indigo-50/80 rounded-3xl p-4 sm:p-5 border border-indigo-200 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2 font-black text-sm text-indigo-950">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>{t('wheel.saving_packages')}</span>
                </div>
                <span className="text-[10px] text-indigo-700 font-bold bg-indigo-100 px-2 py-0.5 rounded-full">{t('wheel.reward_wallet')}</span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div
                  onClick={() => handleBuyTurn(1, 20)}
                  className="p-2.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 cursor-pointer active:scale-95 transition flex flex-col justify-between shadow-xs"
                >
                  <span className="text-xs font-black text-slate-800">{t('wheel.pack_1_turn')}</span>
                  <span className="text-[11px] text-amber-600 font-bold mt-1">20 HTG</span>
                </div>

                <div
                  onClick={() => handleBuyTurn(5, 100)}
                  className="p-2.5 rounded-2xl bg-amber-50 hover:bg-amber-100/60 border border-amber-300 cursor-pointer active:scale-95 transition flex flex-col justify-between shadow-xs"
                >
                  <div className="flex justify-center">
                    <span className="text-[9px] bg-amber-500 text-slate-950 font-black px-1 rounded-full">{t('wheel.bonus_1')}</span>
                  </div>
                  <span className="text-xs font-black text-amber-950 mt-0.5">{t('wheel.pack_5_turns')}</span>
                  <span className="text-[11px] text-amber-700 font-bold mt-0.5">100 HTG</span>
                </div>

                <div
                  onClick={() => handleBuyTurn(10, 180)}
                  className="p-2.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100/60 border border-emerald-300 cursor-pointer active:scale-95 transition flex flex-col justify-between shadow-xs"
                >
                  <div className="flex justify-center">
                    <span className="text-[9px] bg-emerald-500 text-white font-black px-1 rounded-full">{t('wheel.save_10')}</span>
                  </div>
                  <span className="text-xs font-black text-emerald-950 mt-0.5">{t('wheel.pack_10_turns')}</span>
                  <span className="text-[11px] text-emerald-700 font-bold mt-0.5">180 HTG</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* ── PRIZE WIN CELEBRATION MODAL (Light Theme) ── */}
      {showPrizeModal && wonPrize && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border-2 border-amber-300 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl relative animate-scale-up text-center space-y-4">
            
            {/* Top Trophy */}
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-400 to-yellow-300 flex items-center justify-center mx-auto text-slate-950 shadow-xl animate-bounce">
              <Trophy className="w-8 h-8 stroke-[2.5]" />
            </div>

            <div>
              <span className="text-xs uppercase font-black text-amber-600 tracking-widest">{t('wheel.congrats')}</span>
              <h3 className="text-2xl font-black text-slate-900 mt-1">
                {wonPrize.prizeName}
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                {t('wheel.congrats_desc')}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-500">{t('wheel.balance_after_spin')}</span>
              <span className="font-black text-emerald-600 font-mono">{points.toLocaleString()} HTG</span>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShowPrizeModal(false)}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black rounded-2xl text-sm shadow-md active:scale-95 transition"
              >
                {t('wheel.btn_claim_continue')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── BUY TURNS MODAL (Light Theme) ── */}
      {showBuyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" /> {t('wheel.modal_buy_title')}
              </h3>
              <button onClick={() => setShowBuyModal(false)} className="text-slate-400 hover:text-slate-700 text-sm font-bold">
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              {t('wheel.modal_buy_desc')}
            </p>

            <div className="space-y-2.5">
              <div
                onClick={() => handleBuyTurn(1, 20)}
                className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-between cursor-pointer active:scale-95 transition"
              >
                <div>
                  <div className="font-black text-sm text-slate-900">{t('wheel.pack_1_turn')}</div>
                  <div className="text-[11px] text-slate-500">{t('wheel.pack_1_desc')}</div>
                </div>
                <span className="font-black text-amber-600 text-sm font-mono">20 HTG</span>
              </div>

              <div
                onClick={() => handleBuyTurn(5, 100)}
                className="p-3.5 rounded-2xl bg-amber-50 hover:bg-amber-100/60 border border-amber-300 flex items-center justify-between cursor-pointer active:scale-95 transition"
              >
                <div>
                  <div className="font-black text-sm text-amber-950 flex items-center gap-1.5">
                    {t('wheel.pack_5_turns')} <span className="text-[9px] bg-amber-500 text-slate-950 font-black px-1.5 py-0.2 rounded-full">{t('wheel.bonus_1')}</span>
                  </div>
                  <div className="text-[11px] text-amber-800/80">{t('wheel.pack_5_desc')}</div>
                </div>
                <span className="font-black text-amber-700 text-sm font-mono">100 HTG</span>
              </div>

              <div
                onClick={() => handleBuyTurn(10, 180)}
                className="p-3.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100/60 border border-emerald-300 flex items-center justify-between cursor-pointer active:scale-95 transition"
              >
                <div>
                  <div className="font-black text-sm text-emerald-950 flex items-center gap-1.5">
                    {t('wheel.pack_10_turns')} <span className="text-[9px] bg-emerald-500 text-white font-black px-1.5 py-0.2 rounded-full">{t('wheel.save_10')}</span>
                  </div>
                  <div className="text-[11px] text-emerald-800/80">{t('wheel.pack_10_desc')}</div>
                </div>
                <span className="font-black text-emerald-700 text-sm font-mono">180 HTG</span>
              </div>
            </div>

            <button
              onClick={() => setShowBuyModal(false)}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs active:scale-95 transition"
            >
              {t('wheel.btn_close')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LuckyWheelPage;
