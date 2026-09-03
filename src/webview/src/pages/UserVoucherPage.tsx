import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Ticket,
  Copy,
  Check,
  Search,
  Gift,
  Coins,
  ArrowRight,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { LoyaltyJSBridge } from '../bridge/LoyaltyJSBridge';
import { LoyaltyApi, UserVoucherItem } from '../services/api';
import { NotificationModal, NotificationType } from '../components/NotificationModal';
import { VoucherBarcodeModal } from '../components/VoucherBarcodeModal';
import { soundHaptics } from '../utils/soundHaptics';

const DEFAULT_MY_VOUCHERS: UserVoucherItem[] = [
  {
    id: 1,
    code: 'DELIMART-50K-9X8Z',
    title: 'Phiếu Giảm 50 HTG Tại Siêu Thị Delimart',
    partnerName: 'Delimart Supermarket',
    category: 'DELIMART',
    discountText: '50 HTG',
    minOrder: 'Áp dụng cho hóa đơn từ 200 HTG',
    validUntil: '31/08/2026',
    status: 'AVAILABLE',
    terms: 'Áp dụng tại tất cả các điểm bán của Delimart trên toàn quốc.',
  },
  {
    id: 2,
    code: 'NATCOM-10PCT-7B2C',
    title: 'Chiết Khấu 10% Khi Nạp Tiền Natcom',
    partnerName: 'Natcom Telecom',
    category: 'NATCOM',
    discountText: '10%',
    minOrder: 'Hóa đơn nạp từ 100 HTG',
    validUntil: '15/09/2026',
    status: 'AVAILABLE',
    terms: 'Áp dụng khi nạp thẻ điện thoại hoặc đăng ký gói cước 4G Natcom.',
  },
  {
    id: 3,
    code: 'DELIMART-20K-1A4F',
    title: 'Phiếu Giảm 20 HTG Mua Sắm Bánh Kẹo',
    partnerName: 'Delimart Supermarket',
    category: 'DELIMART',
    discountText: '20 HTG',
    minOrder: 'Áp dụng cho hóa đơn từ 100 HTG',
    validUntil: '30/09/2026',
    status: 'AVAILABLE',
    terms: 'Áp dụng trực tiếp khi thanh toán bằng mã ví phần thưởng.',
  },
  {
    id: 4,
    code: 'RINGME-VIP-88H2',
    title: 'Gói Hội Viên Ringme Premium 1 Tháng',
    partnerName: 'Ringme Entertainment',
    category: 'ENTERTAINMENT',
    discountText: '1 Tháng',
    minOrder: 'Tài khoản Ringme đã xác thực',
    validUntil: '20/08/2026',
    status: 'EXPIRED',
    terms: 'Đổi tại mục phần thưởng trên ứng dụng Ringme OTT.',
  },
];

interface CatalogVoucherItem {
  id: number;
  partnerName: string;
  category: string;
  title: string;
  discountText: string;
  pointsCost: number;
  minBill: number;
  expiryDays: number;
  badge: string;
}

const REDEEM_CATALOG: CatalogVoucherItem[] = [
  {
    id: 101,
    partnerName: 'Delimart Supermarket',
    category: 'DELIMART',
    title: 'Phiếu Giảm 50 HTG Hóa Đơn Siêu Thị',
    discountText: '50 HTG',
    pointsCost: 200,
    minBill: 200,
    expiryDays: 30,
    badge: 'PHỔ BIẾN',
  },
  {
    id: 102,
    partnerName: 'Delimart Supermarket',
    category: 'DELIMART',
    title: 'Phiếu Giảm 100 HTG Hóa Đơn Lớn',
    discountText: '100 HTG',
    pointsCost: 400,
    minBill: 400,
    expiryDays: 45,
    badge: 'TIẾT KIỆM',
  },
  {
    id: 103,
    partnerName: 'Natcom Telecom',
    category: 'NATCOM',
    title: 'Gói Cước Data 4G Tốc Độ Cao 5GB',
    discountText: '5GB 4G',
    pointsCost: 150,
    minBill: 0,
    expiryDays: 15,
    badge: 'HOT',
  },
  {
    id: 104,
    partnerName: 'Ringme OTT',
    category: 'ENTERTAINMENT',
    title: 'Tài Khoản VIP Xem Phim Không Quảng Cáo',
    discountText: '1 Tháng VIP',
    pointsCost: 300,
    minBill: 0,
    expiryDays: 30,
    badge: 'GIẢI TRÍ',
  },
];

export const UserVoucherPage: React.FC<{
  onBack?: () => void;
  userPoints?: number;
  onDeductPoints?: (pts: number) => void;
}> = ({ onBack, userPoints = 2480, onDeductPoints }) => {
  const { t } = useTranslation();
  const [activeMainTab, setActiveMainTab] = useState<'MY_VOUCHERS' | 'REDEEM_CATALOG' | 'CASHBACK'>('MY_VOUCHERS');

  // My Vouchers states
  const [vouchers, setVouchers] = useState<UserVoucherItem[]>(DEFAULT_MY_VOUCHERS);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'AVAILABLE' | 'USED' | 'EXPIRED'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedVoucher, setSelectedVoucher] = useState<UserVoucherItem | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [notifyModal, setNotifyModal] = useState<{
    isOpen: boolean;
    type: NotificationType;
    title?: string;
    message: string;
    badge?: string;
  }>({
    isOpen: false,
    type: 'warning',
    message: '',
  });

  // Cashback states
  const [cashbackPointsInput, setCashbackPointsInput] = useState<string>('500');
  const [cashbackSuccess, setCashbackSuccess] = useState<boolean>(false);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [activeMainTab]);

  const userId = '84988888888';

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (window.location.hash && window.location.hash !== '#/' && window.location.hash !== '') {
      window.history.back();
    } else {
      LoyaltyJSBridge.closeWebview();
    }
  };

  const loadVouchers = useCallback(async () => {
    try {
      const data = await LoyaltyApi.getUserVouchers(userId, filterStatus);
      if (data && data.length > 0) {
        setVouchers(data);
      }
    } catch {
      // fallback to mock
    }
  }, [filterStatus]);

  useEffect(() => {
    loadVouchers();
  }, [loadVouchers]);

  const handleCopyCode = (code: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleRedeemFromCatalog = (item: CatalogVoucherItem) => {
    if (userPoints < item.pointsCost) {
      setNotifyModal({
        isOpen: true,
        type: 'warning',
        title: t('vouchers.insufficient_points_title', { defaultValue: 'Chưa Đủ Điểm Đổi Voucher' }),
        message: t('vouchers.insufficient_points_msg', {
          minPoints: item.pointsCost,
          title: item.title,
          defaultValue: `Bạn cần tối thiểu ${item.pointsCost} điểm để đổi phiếu ưu đãi "${item.title}". Hãy tích thêm điểm qua các nhiệm vụ hoặc GameHub!`,
        }),
        badge: t('vouchers.badge_need_points', { defaultValue: 'CẦN THÊM ĐIỂM' }),
      });
      return;
    }

    if (onDeductPoints) {
      onDeductPoints(item.pointsCost);
    }

    // Add to My Vouchers
    const newVoucher: UserVoucherItem = {
      id: Date.now(),
      code: `${item.category}-${item.discountText.replace(/\s+/g, '')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      title: item.title,
      partnerName: item.partnerName,
      category: item.category,
      discountText: item.discountText,
      minOrder: t('vouchers.min_order_desc', { minBill: item.minBill, defaultValue: `Áp dụng cho đơn từ ${item.minBill} HTG` }),
      validUntil: '30/09/2026',
      status: 'AVAILABLE',
      terms: t('vouchers.terms_redeemed_loyalty', { defaultValue: 'Đổi từ điểm thưởng Loyalty.' }),
    };

    setVouchers((prev) => [newVoucher, ...prev]);
    showToast(t('vouchers.redeem_success_toast'));
  };

  const handleConfirmCashback = () => {
    const pts = parseInt(cashbackPointsInput, 10);
    if (isNaN(pts) || pts < 100) {
      setNotifyModal({
        isOpen: true,
        type: 'warning',
        title: t('vouchers.invalid_points_title', { defaultValue: 'Số Điểm Không Hợp Lệ' }),
        message: t('vouchers.invalid_points_msg', { defaultValue: 'Vui lòng nhập tối thiểu 100 điểm thưởng (bội số của 100) để thực hiện quy đổi tiền mặt vào ví.' }),
        badge: t('vouchers.badge_input_notice', { defaultValue: 'LƯU Ý NHẬP LIỆU' }),
      });
      return;
    }
    if (pts > userPoints) {
      setNotifyModal({
        isOpen: true,
        type: 'warning',
        title: t('vouchers.insufficient_balance_title', { defaultValue: 'Số Dư Điểm Không Đủ' }),
        message: t('vouchers.insufficient_balance_msg', {
          pts,
          balance: userPoints.toLocaleString(),
          defaultValue: `Số điểm muốn quy đổi (${pts} điểm) vượt quá số dư khả dụng hiện tại (${userPoints.toLocaleString()} điểm).`,
        }),
        badge: t('vouchers.badge_insufficient_balance', { defaultValue: 'SỐ DƯ KHÔNG ĐỦ' }),
      });
      return;
    }

    if (onDeductPoints) {
      onDeductPoints(pts);
    }

    setCashbackSuccess(true);
    setTimeout(() => {
      setCashbackSuccess(false);
    }, 4000);
  };

  const filteredVouchers = vouchers.filter((v) => {
    const matchCat = filterCategory === 'ALL' || v.category === filterCategory;
    const matchStat = filterStatus === 'ALL' || v.status === filterStatus;
    const matchQuery =
      searchQuery === '' ||
      v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.partnerName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchStat && matchQuery;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-950 text-white px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-fade-in border border-amber-400/40">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 transition flex items-center gap-1.5 text-xs font-bold text-slate-700 border border-slate-200"
            title={t('nav.back')}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{t('nav.home')}</span>
          </button>

          <div className="text-center">
            <h1 className="text-sm sm:text-base font-black text-slate-900 flex items-center justify-center gap-1.5">
              <Gift className="w-4 h-4 text-amber-600" />
              <span>{t('vouchers.title')}</span>
            </h1>
            <p className="text-[10px] text-slate-500">{t('vouchers.subtitle')}</p>
          </div>

          <div className="flex items-center space-x-1 text-xs font-mono font-bold bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl text-amber-900">
            <Coins className="w-3.5 h-3.5 text-amber-600" />
            <span>{userPoints.toLocaleString()} đ</span>
          </div>
        </div>

        {/* ── 3-SUBTABS SWITCHER ── */}
        <div className="max-w-4xl mx-auto px-4 flex items-center border-t border-slate-100 text-xs font-bold overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveMainTab('MY_VOUCHERS')}
            className={`py-3 px-3.5 sm:px-5 border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
              activeMainTab === 'MY_VOUCHERS'
                ? 'border-amber-500 text-amber-700 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>{t('vouchers.tab_my_vouchers')}</span>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-full font-mono">
              {vouchers.length}
            </span>
          </button>

          <button
            onClick={() => setActiveMainTab('REDEEM_CATALOG')}
            className={`py-3 px-3.5 sm:px-5 border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
              activeMainTab === 'REDEEM_CATALOG'
                ? 'border-amber-500 text-amber-700 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{t('vouchers.tab_redeem_catalog')}</span>
          </button>

          <button
            onClick={() => setActiveMainTab('CASHBACK')}
            className={`py-3 px-3.5 sm:px-5 border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
              activeMainTab === 'CASHBACK'
                ? 'border-amber-500 text-amber-700 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Coins className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t('vouchers.tab_cashback')}</span>
          </button>
        </div>
      </header>

      {/* ── MAIN CONTENT ACCORDING TO ACTIVE SUBTAB ── */}
      <main className="max-w-4xl mx-auto px-4 py-5 flex-1 w-full space-y-4">
        {/* ======================================================== */}
        {/* SUBTAB 1: VOUCHER CỦA TÔI                               */}
        {/* ======================================================== */}
        {activeMainTab === 'MY_VOUCHERS' && (
          <div className="space-y-4 animate-fade-in">
            {/* Search & Filter Bar */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('vouchers.search_placeholder')}
                  className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 text-slate-800 placeholder-slate-400"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-xs">
                {/* Category Pills */}
                <div className="flex items-center space-x-1 overflow-x-auto scrollbar-none py-0.5">
                  {['ALL', 'DELIMART', 'NATCOM', 'ENTERTAINMENT'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setFilterCategory(cat)}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition ${
                        filterCategory === cat
                          ? 'bg-amber-500 text-slate-950 shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat === 'ALL' ? t('vouchers.all') : cat}
                    </button>
                  ))}
                </div>

                {/* Status Pills */}
                <div className="flex items-center space-x-1 text-[11px]">
                  {(['ALL', 'AVAILABLE', 'USED', 'EXPIRED'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setFilterStatus(st)}
                      className={`px-2 py-0.5 rounded-lg font-bold transition ${
                        filterStatus === st
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      {st === 'ALL'
                        ? t('vouchers.all_status')
                        : st === 'AVAILABLE'
                        ? t('vouchers.status_active')
                        : st === 'USED'
                        ? t('vouchers.status_used')
                        : t('vouchers.status_expired')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Vouchers List */}
            {filteredVouchers.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-3 shadow-xs">
                <Ticket className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-sm font-bold text-slate-700">{t('vouchers.empty_title')}</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">{t('vouchers.empty_desc')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredVouchers.map((v) => {
                  const isAvailable = v.status === 'AVAILABLE';
                  return (
                    <div
                      key={v.id}
                      onClick={() => {
                        if (isAvailable) {
                          soundHaptics.playClick();
                          setSelectedVoucher(v);
                        }
                      }}
                      className={`bg-white rounded-2xl border p-4 shadow-xs transition flex flex-col justify-between relative overflow-hidden ${
                        isAvailable
                          ? 'border-slate-200/90 hover:border-amber-400 hover:shadow-md cursor-pointer'
                          : 'border-slate-200/60 opacity-60 bg-slate-50/70'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-md">
                            {v.partnerName}
                          </span>
                          <span
                            className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                              isAvailable
                                ? 'bg-emerald-100 text-emerald-800'
                                : v.status === 'USED'
                                ? 'bg-slate-200 text-slate-700'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {isAvailable
                              ? t('vouchers.status_active')
                              : v.status === 'USED'
                              ? t('vouchers.status_used')
                              : t('vouchers.status_expired')}
                          </span>
                        </div>

                        <h3 className="font-black text-sm text-slate-900 line-clamp-1">{v.title}</h3>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-1">{v.minOrder}</p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <div className="font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5">
                          <span>{v.code}</span>
                          <button
                            onClick={(e) => handleCopyCode(v.code, e)}
                            className="text-slate-400 hover:text-amber-600 transition"
                            title={t('vouchers.btn_copy')}
                          >
                            {copiedCode === v.code ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        <span className="text-[11px] text-slate-400 font-medium">
                          {t('vouchers.expiry', { date: v.validUntil })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* SUBTAB 2: ĐỔI ĐIỂM LẤY VOUCHER ĐỐI TÁC                  */}
        {/* ======================================================== */}
        {activeMainTab === 'REDEEM_CATALOG' && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-4 rounded-2xl border border-amber-200 flex items-center justify-between text-xs">
              <div>
                <span className="font-black text-amber-950 text-sm block">{t('vouchers.partner_catalog_title', { defaultValue: 'Kho Voucher Đối Tác Liên Minh' })}</span>
                <span className="text-amber-800/80 text-[11px]">{t('vouchers.partner_catalog_desc', { defaultValue: 'Đổi điểm Loyalty lấy mã giảm giá Delimart, Natcom & Ringme' })}</span>
              </div>
              <span className="bg-amber-500 text-slate-950 font-black px-2.5 py-1 rounded-xl text-xs font-mono shadow-xs">
                {userPoints.toLocaleString()} {t('common.points_short', { defaultValue: 'đ' })}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {REDEEM_CATALOG.map((catItem) => {
                const canAfford = userPoints >= catItem.pointsCost;
                return (
                  <div
                    key={catItem.id}
                    className="bg-white rounded-3xl border border-slate-200/90 p-4 shadow-xs hover:border-amber-400 hover:shadow-md transition flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                          {catItem.partnerName}
                        </span>
                        <span className="text-[9px] font-black bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full uppercase">
                          {catItem.badge}
                        </span>
                      </div>

                      <h3 className="font-black text-sm text-slate-900">{catItem.title}</h3>
                      <p className="text-xs text-slate-500 mt-1">
                        {t('vouchers.min_bill_expiry', { minBill: catItem.minBill, expiryDays: catItem.expiryDays, defaultValue: `Áp dụng đơn từ ${catItem.minBill} HTG • Hạn dùng ${catItem.expiryDays} ngày` })}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block">{t('vouchers.points_to_redeem', { defaultValue: 'Điểm cần đổi' })}</span>
                        <span className="font-black text-amber-700 font-mono text-sm">
                          {t('vouchers.required_points', { points: catItem.pointsCost })}
                        </span>
                      </div>

                      <button
                        onClick={() => handleRedeemFromCatalog(catItem)}
                        disabled={!canAfford}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition active:scale-95 ${
                          canAfford
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        {t('vouchers.btn_redeem_now')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SUBTAB 3: ĐỔI ĐIỂM HOÀN TIỀN VÍ (CASHBACK)               */}
        {/* ======================================================== */}
        {activeMainTab === 'CASHBACK' && (
          <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-sm space-y-5 animate-fade-in max-w-xl mx-auto">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2 border border-emerald-200 shadow-inner">
                <Coins className="w-6 h-6" />
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                {t('vouchers.cashback_title')}
              </h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                {t('vouchers.cashback_desc')}
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs">
              <span className="text-slate-600">{t('vouchers.available_points_label')}</span>
              <span className="font-mono font-black text-amber-700 text-sm">
                {userPoints.toLocaleString()} {t('common.points_unit', { defaultValue: 'Điểm' })}
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {t('vouchers.points_to_convert_label', { defaultValue: 'Số điểm muốn quy đổi:' })}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="100"
                    min="100"
                    max={userPoints}
                    value={cashbackPointsInput}
                    onChange={(e) => setCashbackPointsInput(e.target.value)}
                    placeholder={t('vouchers.input_points_placeholder')}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-mono font-black text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    {t('common.points_unit', { defaultValue: 'Điểm' })}
                  </span>
                </div>
              </div>

              {/* Converted Cash Calculation */}
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200/80 flex items-center justify-between text-xs">
                <div>
                  <span className="text-emerald-950 font-bold block">{t('vouchers.received_amount_label')}</span>
                  <span className="text-[10px] text-emerald-700/80">{t('vouchers.rate_exchange_desc', { defaultValue: 'Tỷ lệ: 100 Điểm = 10 HTG' })}</span>
                </div>
                <span className="font-mono font-black text-emerald-800 text-lg">
                  {Math.floor((parseInt(cashbackPointsInput, 10) || 0) / 10)} HTG
                </span>
              </div>
            </div>

            {cashbackSuccess ? (
              <div className="p-3.5 bg-emerald-100 text-emerald-900 font-bold text-xs rounded-2xl text-center border border-emerald-300">
                {t('vouchers.cashback_success', { amount: Math.floor((parseInt(cashbackPointsInput, 10) || 0) / 10) })}
              </div>
            ) : (
              <button
                onClick={handleConfirmCashback}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-xs shadow-md active:scale-95 transition flex items-center justify-center gap-1.5"
              >
                <span>{t('vouchers.btn_submit_cashback')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </main>

      {/* ── MODAL: HIGH-CONTRAST BARCODE & QR CODE DIALOG ── */}
      <VoucherBarcodeModal
        isOpen={Boolean(selectedVoucher)}
        onClose={() => setSelectedVoucher(null)}
        voucher={
          selectedVoucher
            ? {
                id: selectedVoucher.id,
                voucherCode: selectedVoucher.code,
                voucherTitle: selectedVoucher.title,
                partnerName: selectedVoucher.partnerName,
                discountValue: 50,
                discountType: 'FIXED_AMOUNT',
                expiredAt: selectedVoucher.validUntil,
                terms: selectedVoucher.terms,
              }
            : null
        }
      />

      {/* ── HIGH-END NOTIFICATION MODAL ── */}
      <NotificationModal
        isOpen={notifyModal.isOpen}
        type={notifyModal.type}
        title={notifyModal.title}
        message={notifyModal.message}
        badge={notifyModal.badge}
        onClose={() => setNotifyModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default UserVoucherPage;
