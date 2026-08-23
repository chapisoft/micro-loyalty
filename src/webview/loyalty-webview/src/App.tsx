import React, { useState } from 'react';
import { Gift, Zap, QrCode, X, Trophy, Sparkles } from 'lucide-react';
import { LoyaltyJSBridge } from './bridge/LoyaltyJSBridge';

export const App: React.FC = () => {
  const [points] = useState(1250);
  const [tier] = useState('GOLD');
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);

  const handleBuyGameTurn = async () => {
    setPaymentStatus('Đang mở xác thực mã PIN ví...');
    try {
      const res = await LoyaltyJSBridge.requestPayment({
        amount: 5000,
        itemCode: 'EXTRA_SPIN_5K',
        itemName: 'Mua 1 Lượt Quay May Mắn',
        transactionRef: 'REF_' + Date.now(),
      });
      if (res.success) {
        setPaymentStatus('Thanh toán ví thành công! Đã cộng lượt chơi.');
      } else {
        setPaymentStatus('Giao dịch bị hủy: ' + (res.message || 'Không thành công'));
      }
    } catch {
      setPaymentStatus('Lỗi kết nối với ứng dụng native.');
    }
  };

  const handleScanQR = async () => {
    try {
      const res = await LoyaltyJSBridge.requestScanQR();
      if (res.success && res.qrData) {
        alert('Quét mã thành công: ' + res.qrData);
      }
    } catch {
      alert('Không thể mở camera quét QR.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-12 flex flex-col">
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 pt-6 shadow-md flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center space-x-2">
          <Trophy className="w-6 h-6 text-amber-300" />
          <h1 className="font-bold text-lg">Trung Tâm Hội Viên &amp; Game</h1>
        </div>
        <button
          onClick={() => LoyaltyJSBridge.closeWebview()}
          className="p-1 rounded-full bg-white/20 hover:bg-white/30 text-white transition"
          aria-label="Đóng webview"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 space-y-4 max-w-md mx-auto w-full">
        {/* VIP Tier Card */}
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="text-xs uppercase font-semibold tracking-wider text-amber-200">Hạng Hội Viên</span>
              <h2 className="text-2xl font-black">{tier === 'GOLD' ? 'Vàng (Gold VIP)' : tier}</h2>
            </div>
            <div className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm">
              x1.5 Tích Điểm
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/20 flex justify-between items-end">
            <div>
              <div className="text-xs text-amber-100">Điểm Khả Dụng</div>
              <div className="text-3xl font-extrabold">{points.toLocaleString()} <span className="text-sm font-normal">điểm</span></div>
            </div>
            <button
              onClick={handleScanQR}
              className="bg-white text-amber-700 font-bold px-4 py-2 rounded-xl text-sm shadow flex items-center space-x-1 active:scale-95 transition"
            >
              <QrCode className="w-4 h-4" />
              <span>Quét Mã</span>
            </button>
          </div>
        </div>

        {/* Quick Action Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
              <Gift className="w-5 h-5" />
            </div>
            <span className="font-bold text-sm">Kho Voucher</span>
            <span className="text-xs text-slate-400 mt-1">12 ưu đãi tại quầy</span>
          </div>

          <div
            onClick={handleBuyGameTurn}
            className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center text-center cursor-pointer active:bg-slate-50 transition"
          >
            <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-2">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-bold text-sm">Vòng Quay May Mắn</span>
            <span className="text-xs text-amber-600 font-medium mt-1">Mua thêm lượt (5.000đ)</span>
          </div>
        </div>

        {paymentStatus && (
          <div className="p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl text-xs flex items-center space-x-2">
            <Zap className="w-4 h-4 shrink-0" />
            <span>{paymentStatus}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
