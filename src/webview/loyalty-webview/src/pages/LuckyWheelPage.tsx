import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Trophy, PlusCircle, ArrowLeft, Volume2, VolumeX, Flame } from 'lucide-react';
import { LoyaltyJSBridge } from '../bridge/LoyaltyJSBridge';

interface PrizeSlice {
  id: number;
  name: string;
  type: string;
  value: number;
  color: string;
}

const PRIZES: PrizeSlice[] = [
  { id: 1, name: '100 Điểm Thưởng', type: 'POINTS', value: 100, color: '#FFB800' },
  { id: 2, name: 'Voucher 50 HTG', type: 'VOUCHER', value: 50, color: '#FF5C5C' },
  { id: 3, name: 'Chúc Bạn May Mắn', type: 'NO_LUCK', value: 0, color: '#3BC9DB' },
  { id: 4, name: '200 Điểm Thưởng', type: 'POINTS', value: 200, color: '#4D96FF' },
  { id: 5, name: '500 HTG Tiền Mặt', type: 'CASHBACK', value: 500, color: '#6BCB77' },
  { id: 6, name: 'Thêm 1 Lượt Quay', type: 'TURNS', value: 1, color: '#FFA07A' },
];

export const LuckyWheelPage: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentAngle, setCurrentAngle] = useState(0);
  const [freeTurns, setFreeTurns] = useState(2);
  const [points, setPoints] = useState(1250);
  const [wonPrize, setWonPrize] = useState<PrizeSlice | null>(null);
  const [showPrizeModal, setShowPrizeModal] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Play synthetic beep sound via Web Audio API
  const playSound = (freq: number, duration: number) => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch {
      // Audio context might be restricted before interaction
    }
  };

  const drawWheel = (angleOffset: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = width / 2 - 15;
    const numSlices = PRIZES.length;
    const sliceAngle = (2 * Math.PI) / numSlices;

    ctx.clearRect(0, 0, width, height);

    // Outer Glow Ring
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 8, 0, 2 * Math.PI);
    ctx.fillStyle = '#FFD700';
    ctx.shadowColor = '#FFA500';
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.restore();

    // Draw Slices
    for (let i = 0; i < numSlices; i++) {
      const startAngle = i * sliceAngle + angleOffset;
      const endAngle = startAngle + sliceAngle;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = PRIZES[i].color;
      ctx.fill();

      // Border between slices
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Slice Text
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 12px sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 4;
      ctx.fillText(PRIZES[i].name, radius - 20, 4);
      ctx.restore();
    }

    // Outer Lights / Dots
    for (let i = 0; i < 24; i++) {
      const dotAngle = (i * (2 * Math.PI)) / 24 + angleOffset;
      const dotX = centerX + (radius + 4) * Math.cos(dotAngle);
      const dotY = centerY + (radius + 4) * Math.sin(dotAngle);
      ctx.beginPath();
      ctx.arc(dotX, dotY, 3, 0, 2 * Math.PI);
      ctx.fillStyle = i % 2 === 0 ? '#FFFFFF' : '#FFD700';
      ctx.fill();
    }

    // Center Pin
    ctx.beginPath();
    ctx.arc(centerX, centerY, 24, 0, 2 * Math.PI);
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 6;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(centerX, centerY, 18, 0, 2 * Math.PI);
    ctx.fillStyle = '#4F46E5';
    ctx.fill();
  };

  useEffect(() => {
    drawWheel(currentAngle);
  }, [currentAngle]);

  const handleSpin = () => {
    if (isSpinning) return;
    if (freeTurns <= 0 && points < 20) {
      alert('Bạn không đủ điểm hoặc lượt quay! Vui lòng nạp thêm.');
      return;
    }

    if (freeTurns > 0) {
      setFreeTurns((t) => t - 1);
    } else {
      setPoints((p) => p - 20);
    }

    setIsSpinning(true);
    setWonPrize(null);

    // Random target slice (or predetermined from backend)
    const targetPrizeIndex = Math.floor(Math.random() * PRIZES.length);
    const selectedPrize = PRIZES[targetPrizeIndex];

    const sliceAngle = (2 * Math.PI) / PRIZES.length;
    // Pointer is at the top (3*PI/2)
    const targetAngle = 3 * Math.PI / 2 - (targetPrizeIndex * sliceAngle + sliceAngle / 2);
    const totalRotations = 6 * 2 * Math.PI; // 6 full spins
    const finalAngle = totalRotations + targetAngle;

    const duration = 4000; // 4 seconds
    const startTime = performance.now();
    const startAngle = currentAngle % (2 * Math.PI);

    let lastTickAngle = startAngle;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const angle = startAngle + (finalAngle - startAngle) * easeOut;

      setCurrentAngle(angle);

      // Sound tick on each slice pass
      if (Math.abs(angle - lastTickAngle) > sliceAngle) {
        playSound(600 + Math.random() * 200, 0.05);
        lastTickAngle = angle;
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsSpinning(false);
        setWonPrize(selectedPrize);
        setShowPrizeModal(true);
        playSound(880, 0.3); // Win chord
        if (selectedPrize.type === 'POINTS') {
          setPoints((p) => p + selectedPrize.value);
        } else if (selectedPrize.type === 'TURNS') {
          setFreeTurns((t) => t + selectedPrize.value);
        }
      }
    };

    requestAnimationFrame(animate);
  };

  const handleBuyTurn = async () => {
    try {
      const res = await LoyaltyJSBridge.requestPayment({
        amount: 20,
        itemCode: 'BUY_SPIN_20HTG',
        itemName: 'Mua 1 Lượt Quay May Mắn',
        transactionRef: 'SPIN_' + Date.now(),
      });
      if (res.success) {
        setFreeTurns((t) => t + 1);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-between pb-12 font-sans relative overflow-hidden">
      {/* Background Decorative Blur */}
      <div className="absolute -top-20 -left-20 w-72 h-72 bg-indigo-600/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-amber-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="w-full max-w-md p-4 pt-6 flex items-center justify-between z-10">
        <button
          onClick={onBack ? onBack : () => LoyaltyJSBridge.closeWebview()}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition active:scale-95"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <h1 className="text-lg font-black tracking-tight text-amber-300 flex items-center gap-1.5 justify-center">
            <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" /> Vòng Quay Tri Ân
          </h1>
          <p className="text-[11px] text-slate-400">100% Cơ Hội Trúng Thưởng</p>
        </div>
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition active:scale-95"
        >
          {soundEnabled ? <Volume2 className="w-5 h-5 text-amber-300" /> : <VolumeX className="w-5 h-5 text-slate-400" />}
        </button>
      </div>

      {/* Stats Bar */}
      <div className="w-full max-w-md px-6 flex justify-between gap-3 z-10 my-2">
        <div className="flex-1 bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[11px] text-slate-300 block">Lượt miễn phí</span>
            <span className="text-lg font-black text-amber-300">{freeTurns} <span className="text-xs font-normal text-slate-300">lượt</span></span>
          </div>
          <button
            onClick={handleBuyTurn}
            className="w-8 h-8 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-900 flex items-center justify-center shadow-md active:scale-95 transition"
            title="Mua thêm lượt"
          >
            <PlusCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[11px] text-slate-300 block">Điểm khả dụng</span>
            <span className="text-lg font-black text-emerald-400">{points.toLocaleString()} <span className="text-xs font-normal text-slate-300">đ</span></span>
          </div>
          <Trophy className="w-6 h-6 text-amber-300/80" />
        </div>
      </div>

      {/* Wheel Canvas Container */}
      <div className="relative my-4 flex items-center justify-center z-10">
        {/* Top Pointer Indicator */}
        <div className="absolute -top-3 z-20 w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[28px] border-t-amber-400 filter drop-shadow-md" />

        <canvas
          ref={canvasRef}
          width={320}
          height={320}
          className="rounded-full shadow-2xl transition-transform"
        />
      </div>

      {/* Spin Button */}
      <div className="w-full max-w-xs px-4 z-10">
        <button
          onClick={handleSpin}
          disabled={isSpinning}
          className={`w-full py-4 rounded-3xl font-black text-base shadow-xl flex items-center justify-center space-x-2 transition-all transform active:scale-95 ${
            isSpinning
              ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-900 shadow-orange-500/30'
          }`}
        >
          <Flame className="w-5 h-5 text-slate-900" />
          <span>{isSpinning ? 'ĐANG QUAY SỐ...' : freeTurns > 0 ? 'QUAY NGAY (MIỄN PHÍ)' : 'QUAY (20 ĐIỂM)'}</span>
        </button>
      </div>

      {/* Prize Modal */}
      {showPrizeModal && wonPrize && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-amber-400/40 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4 animate-scale-up relative">
            <div className="w-16 h-16 rounded-full bg-amber-400/20 border-2 border-amber-300 text-amber-300 flex items-center justify-center mx-auto shadow-inner">
              <Trophy className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs uppercase tracking-widest text-amber-300 font-bold">Xin Chúc Mừng!</span>
              <h3 className="text-2xl font-black text-white mt-1">{wonPrize.name}</h3>
              <p className="text-xs text-slate-400 mt-1">
                {wonPrize.type === 'NO_LUCK'
                  ? 'Rất tiếc lượt này bạn chưa trúng giải lớn. Hãy thử lại!'
                  : 'Phần thưởng đã được cộng trực tiếp vào Ví Hội Viên của bạn!'}
              </p>
            </div>

            <button
              onClick={() => setShowPrizeModal(false)}
              className="w-full py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 font-black rounded-2xl text-sm shadow-lg active:scale-95 transition"
            >
              Nhận Thưởng &amp; Tiếp Tục
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LuckyWheelPage;
