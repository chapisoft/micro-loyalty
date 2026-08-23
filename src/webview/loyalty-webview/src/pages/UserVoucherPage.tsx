import React, { useState } from 'react';
import { ArrowLeft, Ticket, QrCode, Copy, Check, Clock, Store, ShieldCheck, X } from 'lucide-react';
import { LoyaltyJSBridge } from '../bridge/LoyaltyJSBridge';

interface VoucherData {
  id: number;
  code: string;
  title: string;
  partnerName: string;
  discountText: string;
  minOrder: string;
  validUntil: string;
  status: 'AVAILABLE' | 'USED' | 'EXPIRED';
}

const MOCK_USER_VOUCHERS: VoucherData[] = [
  {
    id: 1,
    code: 'DELIMART-50K-9X8Z',
    title: 'Phiếu Giảm 50 HTG Tại Siêu Thị Delimart',
    partnerName: 'Delimart Supermarket',
    discountText: '50 HTG',
    minOrder: 'Áp dụng cho hóa đơn từ 200 HTG',
    validUntil: '31/08/2026',
    status: 'AVAILABLE',
  },
  {
    id: 2,
    code: 'NATCOM-10PCT-7B2C',
    title: 'Chiết Khấu 10% Khi Nạp Tiền Natcom',
    partnerName: 'Natcom Telecom',
    discountText: '10%',
    minOrder: 'Hóa đơn nạp từ 100 HTG',
    validUntil: '15/09/2026',
    status: 'AVAILABLE',
  },
  {
    id: 3,
    code: 'DELIMART-20K-1A4F',
    title: 'Phiếu Giảm 20 HTG Mua Sắm',
    partnerName: 'Delimart Supermarket',
    discountText: '20 HTG',
    minOrder: 'Áp dụng cho hóa đơn từ 100 HTG',
    validUntil: '10/08/2026',
    status: 'USED',
  },
];

export const UserVoucherPage: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'AVAILABLE' | 'USED' | 'EXPIRED'>('AVAILABLE');
  const [selectedVoucher, setSelectedVoucher] = useState<VoucherData | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const filteredVouchers = MOCK_USER_VOUCHERS.filter((v) => v.status === activeTab);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-12 font-sans flex flex-col">
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-indigo-700 via-blue-600 to-indigo-800 text-white p-4 pt-6 shadow-md flex items-center justify-between sticky top-0 z-30">
        <button
          onClick={onBack ? onBack : () => LoyaltyJSBridge.closeWebview()}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition active:scale-95"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-extrabold text-base tracking-tight">Kho Ưu Đãi Của Tôi</h1>
        <div className="w-9" />
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 px-4 flex justify-around sticky top-[68px] z-20 shadow-sm">
        <button
          onClick={() => setActiveTab('AVAILABLE')}
          className={`py-3 text-xs font-black border-b-2 transition ${
            activeTab === 'AVAILABLE' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-400'
          }`}
        >
          Khả Dụng ({MOCK_USER_VOUCHERS.filter((v) => v.status === 'AVAILABLE').length})
        </button>
        <button
          onClick={() => setActiveTab('USED')}
          className={`py-3 text-xs font-black border-b-2 transition ${
            activeTab === 'USED' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-400'
          }`}
        >
          Đã Sử Dụng ({MOCK_USER_VOUCHERS.filter((v) => v.status === 'USED').length})
        </button>
        <button
          onClick={() => setActiveTab('EXPIRED')}
          className={`py-3 text-xs font-black border-b-2 transition ${
            activeTab === 'EXPIRED' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-400'
          }`}
        >
          Đã Hết Hạn (0)
        </button>
      </div>

      {/* Voucher List */}
      <div className="p-4 space-y-3 max-w-md mx-auto w-full flex-1">
        {filteredVouchers.length === 0 ? (
          <div className="text-center py-16 text-slate-400 space-y-2">
            <Ticket className="w-12 h-12 mx-auto text-slate-300 stroke-1" />
            <p className="text-xs">Không có phiếu ưu đãi nào trong mục này</p>
          </div>
        ) : (
          filteredVouchers.map((voucher) => (
            <div
              key={voucher.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex relative transition active:scale-[0.99]"
            >
              {/* Left Cutout Color Strip */}
              <div className="w-24 bg-gradient-to-br from-amber-500 to-orange-500 text-white flex flex-col items-center justify-center p-2 text-center relative border-r-2 border-dashed border-slate-100">
                <span className="text-lg font-black">{voucher.discountText}</span>
                <span className="text-[10px] font-bold opacity-90">GIẢM NGAY</span>
              </div>

              {/* Right Content */}
              <div className="flex-1 p-3.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center space-x-1 text-[11px] font-bold text-slate-400 mb-0.5">
                    <Store className="w-3 h-3 text-indigo-500" />
                    <span>{voucher.partnerName}</span>
                  </div>
                  <h3 className="font-bold text-xs text-slate-800 leading-snug">{voucher.title}</h3>
                  <p className="text-[10px] text-slate-500 mt-1">{voucher.minOrder}</p>
                </div>

                <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center space-x-1 text-[10px] text-slate-400">
                    <Clock className="w-3 h-3" />
                    <span>HSD: {voucher.validUntil}</span>
                  </div>
                  {voucher.status === 'AVAILABLE' && (
                    <button
                      onClick={() => setSelectedVoucher(voucher)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] rounded-xl shadow-sm active:scale-95 transition"
                    >
                      Dùng Ngay
                    </button>
                  )}
                  {voucher.status === 'USED' && (
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">
                      Đã sử dụng
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Barcode & QR Code Modal for Cashier */}
      {selectedVoucher && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl relative text-center space-y-4 animate-scale-up">
            <button
              onClick={() => setSelectedVoucher(null)}
              className="absolute right-4 top-4 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-600 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Mã Ưu Đãi Hợp Lệ
              </span>
              <h3 className="font-black text-base text-slate-800 mt-1">{selectedVoucher.title}</h3>
            </div>

            {/* QR Code Container */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 inline-block shadow-inner">
              <div className="w-44 h-44 bg-white border-2 border-slate-800 rounded-xl flex flex-col items-center justify-center p-2">
                <QrCode className="w-36 h-36 text-slate-900" />
              </div>
            </div>

            {/* Voucher Code Copy Bar */}
            <div className="flex items-center justify-between bg-slate-100 p-2.5 rounded-xl border border-slate-200">
              <span className="font-mono font-bold text-sm text-slate-800">{selectedVoucher.code}</span>
              <button
                onClick={() => handleCopyCode(selectedVoucher.code)}
                className="px-2.5 py-1 bg-white hover:bg-slate-200 rounded-lg text-xs font-bold text-indigo-600 flex items-center gap-1 shadow-sm transition"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Đã chép' : 'Sao chép'}</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-400">
              Đưa mã QR hoặc đọc mã phiếu cho nhân viên thu ngân tại quầy thanh toán.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserVoucherPage;
