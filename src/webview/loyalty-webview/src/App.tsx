import React, { useState, useEffect } from 'react';
import { Zap, QrCode, X, Trophy, Sparkles, Clock, CheckCircle2, ShieldCheck, Flame } from 'lucide-react';
import { LoyaltyJSBridge } from './bridge/LoyaltyJSBridge';

export const App: React.FC = () => {
  const [points, setPoints] = useState(1250);
  const [tierName] = useState('Hạng Vàng');
  const [nextTierPoints] = useState(5000);
  const [currentTierPoints] = useState(3850);
  const [pointsNeeded] = useState(1150);
  const [progressPercent] = useState(77.0);

  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrCountdown, setQrCountdown] = useState(60);
  const [qrToken, setQrToken] = useState('NATCASH_PAY_TOKEN_' + Math.floor(Math.random() * 1000000));

  // Auto refresh dynamic QR code every 60s
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showQrModal) {
      timer = setInterval(() => {
        setQrCountdown((prev) => {
          if (prev <= 1) {
            setQrToken('NATCASH_PAY_TOKEN_' + Math.floor(Math.random() * 1000000));
            return 60;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [showQrModal]);

  const handleBuyGameTurn = async () => {
    setPaymentStatus('Đang mở xác thực mã PIN ví...');
    try {
      const res = await LoyaltyJSBridge.requestPayment({
        amount: 50,
        itemCode: 'EXTRA_SPIN_50HTG',
        itemName: 'Mua 1 Lượt Quay May Mắn',
        transactionRef: 'REF_' + Date.now(),
      });
      if (res.success) {
        setPaymentStatus('Thanh toán ví thành công! Đã cộng lượt quay.');
      } else {
        setPaymentStatus('Giao dịch bị hủy: ' + (res.message || 'Không thành công'));
      }
    } catch {
      setPaymentStatus('Lỗi kết nối với ứng dụng native.');
    }
  };

  const handleDailyCheckin = () => {
    setPoints((p) => p + 20);
    setPaymentStatus('Điểm danh thành công! Bạn nhận được +20 điểm.');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16 flex flex-col font-sans">
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-indigo-700 via-blue-600 to-indigo-800 text-white p-4 pt-6 shadow-md flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-amber-400/20 flex items-center justify-center border border-amber-300/40">
            <Trophy className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-tight">Trung Tâm Hội Viên &amp; Game</h1>
            <p className="text-[11px] text-blue-200">Hệ sinh thái khách hàng thân thiết</p>
          </div>
        </div>
        <button
          onClick={() => LoyaltyJSBridge.closeWebview()}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition active:scale-95"
          aria-label="Đóng webview"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 space-y-4 max-w-md mx-auto w-full">
        {/* Nudge Alert Card: Silent Smart Nudge */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl p-3.5 flex items-start space-x-3 shadow-sm">
          <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
            <Flame className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-amber-900">Sắp thăng Hạng Bạch Kim!</span>
              <span className="text-[10px] bg-amber-200/70 text-amber-900 font-bold px-1.5 py-0.5 rounded">Gợi ý</span>
            </div>
            <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
              Bạn chỉ còn thiếu <span className="font-black text-orange-600">{pointsNeeded.toLocaleString()} điểm</span> để thăng hạng và nhân đôi tỷ lệ thưởng!
            </p>
          </div>
        </div>

        {/* 3D Tier Card with Glassmorphism */}
        <div className="relative rounded-3xl p-6 text-white shadow-xl overflow-hidden bg-gradient-to-br from-amber-500 via-amber-600 to-yellow-600 transition-transform transform active:scale-[0.99]">
          <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/15 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -left-10 -bottom-10 w-36 h-36 bg-amber-800/20 rounded-full blur-xl pointer-events-none" />

          <div className="flex justify-between items-start mb-4 relative z-10">
            <div>
              <span className="text-[11px] uppercase font-bold tracking-wider text-amber-100 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Hạng Thành Viên
              </span>
              <h2 className="text-2xl font-black tracking-wide mt-0.5 drop-shadow-sm">{tierName} (Gold VIP)</h2>
            </div>
            <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black border border-white/30 text-amber-50 shadow-sm">
              ×1.2 Tích Điểm
            </div>
          </div>

          {/* Progress Bar towards next tier */}
          <div className="space-y-1.5 my-4 relative z-10">
            <div className="flex justify-between text-[11px] text-amber-100 font-medium">
              <span>Tiến độ thăng hạng Bạch Kim</span>
              <span className="font-bold text-white">{currentTierPoints.toLocaleString()} / {nextTierPoints.toLocaleString()}</span>
            </div>
            <div className="w-full h-2.5 bg-black/20 rounded-full overflow-hidden p-0.5 backdrop-blur-sm">
              <div
                className="h-full bg-gradient-to-r from-yellow-200 to-white rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="pt-3 border-t border-white/20 flex justify-between items-end relative z-10">
            <div>
              <div className="text-[11px] text-amber-100 font-medium">Điểm Thưởng Khả Dụng</div>
              <div className="text-3xl font-black tracking-tight">{points.toLocaleString()} <span className="text-sm font-normal opacity-90">điểm</span></div>
            </div>
            <button
              onClick={() => setShowQrModal(true)}
              className="bg-white text-amber-700 font-black px-4 py-2.5 rounded-2xl text-xs shadow-md hover:bg-amber-50 flex items-center space-x-1.5 active:scale-95 transition"
            >
              <QrCode className="w-4 h-4" />
              <span>Mã Ví Tiêu Điểm</span>
            </button>
          </div>
        </div>

        {/* Quick Action Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div
            onClick={() => setShowQrModal(true)}
            className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/70 flex flex-col items-center text-center cursor-pointer hover:border-blue-400 active:scale-98 transition"
          >
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2 shadow-inner">
              <QrCode className="w-6 h-6" />
            </div>
            <span className="font-bold text-sm text-slate-800">Ví Tiêu Điểm</span>
            <span className="text-[11px] text-slate-400 mt-0.5">Trừ điểm tại quầy POS</span>
          </div>

          <div
            onClick={handleBuyGameTurn}
            className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/70 flex flex-col items-center text-center cursor-pointer hover:border-amber-400 active:scale-98 transition"
          >
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2 shadow-inner">
              <Sparkles className="w-6 h-6" />
            </div>
            <span className="font-bold text-sm text-slate-800">Vòng Quay May Mắn</span>
            <span className="text-[11px] text-amber-600 font-bold mt-0.5">Mua thêm lượt (50 HTG)</span>
          </div>
        </div>

        {/* Daily Mission / Check-in Card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/70 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Nhiệm Vụ &amp; Điểm Danh
            </h3>
            <span className="text-xs text-indigo-600 font-bold cursor-pointer">Xem tất cả</span>
          </div>

          <div className="divide-y divide-slate-100">
            <div className="py-2.5 flex items-center justify-between">
              <div>
                <p className="font-bold text-xs text-slate-700">Điểm danh ngày hôm nay</p>
                <p className="text-[11px] text-slate-400">Nhận ngay +20 điểm thưởng</p>
              </div>
              <button
                onClick={handleDailyCheckin}
                className="px-3 py-1.5 bg-indigo-50 text-indigo-700 font-bold rounded-xl text-xs hover:bg-indigo-100 active:scale-95 transition"
              >
                Nhận +20đ
              </button>
            </div>

            <div className="py-2.5 flex items-center justify-between">
              <div>
                <p className="font-bold text-xs text-slate-700">Mua sắm tại Delimart từ 500 HTG</p>
                <p className="text-[11px] text-slate-400">Tiến độ: 1/1 hóa đơn</p>
              </div>
              <span className="text-[11px] text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-lg">
                Đã hoàn thành
              </span>
            </div>
          </div>
        </div>

        {paymentStatus && (
          <div className="p-3.5 bg-blue-50 border border-blue-200 text-blue-800 rounded-2xl text-xs flex items-center space-x-2.5 shadow-sm animate-fade-in">
            <Zap className="w-4 h-4 shrink-0 text-blue-600" />
            <span className="font-medium">{paymentStatus}</span>
          </div>
        )}
      </div>

      {/* Dynamic QR Payment Modal (WV-05) */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl relative animate-scale-up space-y-4 text-center">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute right-4 top-4 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="font-black text-lg text-slate-800">Mã QR Ví Phần Thưởng</h3>
              <p className="text-xs text-slate-500 mt-0.5">Đưa mã này cho thu ngân để trừ điểm hoặc áp voucher</p>
            </div>

            {/* Dynamic QR Container */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 inline-block shadow-inner">
              <div className="w-48 h-48 bg-white border-2 border-slate-800 rounded-xl flex flex-col items-center justify-center p-3 relative">
                <QrCode className="w-36 h-36 text-slate-900" />
                <span className="text-[9px] font-mono text-slate-500 mt-1 font-bold">{qrToken.substring(0, 24)}</span>
              </div>
            </div>

            {/* 60s Countdown indicator */}
            <div className="flex items-center justify-center space-x-2 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200/70 py-2 px-3 rounded-xl">
              <Clock className="w-4 h-4 animate-spin text-amber-600" />
              <span>Tự động làm mới sau: <span className="font-mono text-sm">{qrCountdown}s</span></span>
            </div>

            <div className="text-[11px] text-slate-400">
              Mã bảo mật chỉ có hiệu lực trong 60 giây để chống chụp ảnh màn hình gian lận.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
