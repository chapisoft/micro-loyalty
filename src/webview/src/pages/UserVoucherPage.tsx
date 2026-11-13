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
  CheckCircle2,
  Clock,
  Ban,
} from 'lucide-react';
import { LoyaltyJSBridge } from '../bridge/LoyaltyJSBridge';
import { LoyaltyApi, UserVoucherItem, CatalogVoucherItem, getDefaultUserId } from '../services/api';
import { NotificationModal, NotificationType } from '../components/NotificationModal';
import { VoucherBarcodeModal } from '../components/VoucherBarcodeModal';
import { SkeletonCard, EmptyState } from '../components/common/StateBlocks';
import { soundHaptics } from '../utils/soundHaptics';

export const UserVoucherPage: React.FC<{
  onBack?: () => void;
  userPoints?: number | null;
  onDeductPoints?: (pts: number) => void;
}> = ({ onBack, userPoints = null, onDeductPoints }) => {
  const { t } = useTranslation();
  const userId = getDefaultUserId();
  const [activeMainTab, setActiveMainTab] = useState<'MY_VOUCHERS' | 'REDEEM_CATALOG' | 'CASHBACK'>('MY_VOUCHERS');

  // My Vouchers states (zero fake defaults)
  const [vouchers, setVouchers] = useState<UserVoucherItem[]>([]);
  const [loadingVouchers, setLoadingVouchers] = useState<boolean>(true);
  const [catalog, setCatalog] = useState<CatalogVoucherItem[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState<boolean>(true);
  const [redeemingCode, setRedeemingCode] = useState<string | null>(null);

  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'AVAILABLE' | 'AWAITING_CONFIRMATION' | 'USED' | 'EXPIRED'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedVoucher, setSelectedVoucher] = useState<{
    item: UserVoucherItem;
    mode: 'REDEEM_RESULT' | 'CHECKOUT';
  } | null>(null);
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

  // Cashback states (no hardcoded default value)
  const [cashbackPointsInput, setCashbackPointsInput] = useState<string>('');
  const [cashbackSuccess, setCashbackSuccess] = useState<boolean>(false);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [activeMainTab]);

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
    setLoadingVouchers(true);
    try {
      const data = await LoyaltyApi.getUserVouchers(userId, filterStatus);
      setVouchers(Array.isArray(data) ? data : []);
    } catch {
      setVouchers([]);
    } finally {
      setLoadingVouchers(false);
    }
  }, [userId, filterStatus]);

  const loadCatalog = useCallback(async () => {
    setLoadingCatalog(true);
    try {
      const data = await LoyaltyApi.getVoucherCatalog();
      setCatalog(Array.isArray(data) ? data : []);
    } catch {
      setCatalog([]);
    } finally {
      setLoadingCatalog(false);
    }
  }, []);

  useEffect(() => {
    loadVouchers();
  }, [loadVouchers]);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const handleCopyCode = (code: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    soundHaptics.playClick();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const availablePoints = userPoints ?? 0;

  const handleRedeemFromCatalog = async (item: CatalogVoucherItem) => {
    const isSoldOut = item.status === 'SOLD_OUT' || (typeof item.availableQuantity === 'number' && item.availableQuantity <= 0);
    if (isSoldOut) return;

    if (availablePoints < item.pointCost) {
      setNotifyModal({
        isOpen: true,
        type: 'warning',
        title: t('vouchers.insufficient_points_title'),
        message: t('vouchers.insufficient_points_msg', {
          minPoints: item.pointCost,
          title: item.title,
        }),
        badge: t('vouchers.badge_need_points'),
      });
      return;
    }

    setRedeemingCode(item.voucherCode);
    try {
      const redeemed = await LoyaltyApi.redeemVoucher(userId, item.voucherCode);
      soundHaptics.playVictoryFanfare();
      if (onDeductPoints) {
        onDeductPoints(item.pointCost);
      }
      await Promise.all([loadVouchers(), loadCatalog()]);
      showToast(t('vouchers.redeem_success_toast'));
      // VQ-02 Result · reward ready with Scan at the counter card
      setSelectedVoucher({ item: redeemed, mode: 'REDEEM_RESULT' });
    } catch {
      setNotifyModal({
        isOpen: true,
        type: 'error',
        title: t('vouchers.redeem_failed_title'),
        message: t('vouchers.redeem_failed_msg'),
        badge: t('vouchers.badge_redeem_error'),
      });
    } finally {
      setRedeemingCode(null);
    }
  };

  const handleConfirmCashback = () => {
    const pts = parseInt(cashbackPointsInput, 10);
    if (isNaN(pts) || pts < 100) {
      setNotifyModal({
        isOpen: true,
        type: 'warning',
        title: t('vouchers.invalid_points_title'),
        message: t('vouchers.invalid_points_msg'),
        badge: t('vouchers.badge_input_notice'),
      });
      return;
    }
    if (pts > availablePoints) {
      setNotifyModal({
        isOpen: true,
        type: 'warning',
        title: t('vouchers.insufficient_balance_title'),
        message: t('vouchers.insufficient_balance_msg', {
          pts,
          balance: availablePoints.toLocaleString(),
        }),
        badge: t('vouchers.badge_insufficient_balance'),
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

  const categories = ['ALL', ...Array.from(new Set(vouchers.map((v) => v.category).filter(Boolean)))];

  const filteredVouchers = vouchers.filter((v) => {
    const matchCat = filterCategory === 'ALL' || v.category === filterCategory;
    const matchStat = filterStatus === 'ALL' || v.status === filterStatus;
    const q = searchQuery.toLowerCase();
    const matchQuery =
      q === '' ||
      v.title.toLowerCase().includes(q) ||
      v.code.toLowerCase().includes(q) ||
      v.partnerName.toLowerCase().includes(q);
    return matchCat && matchStat && matchQuery;
  });

  const getStatusMeta = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return { label: t('vouchers.status_active'), cls: 'bg-emerald-100 text-emerald-800', icon: null };
      case 'AWAITING_CONFIRMATION':
        return {
          label: t('vouchers.status_awaiting_confirmation'),
          cls: 'bg-amber-100 text-amber-800',
          icon: <Clock className="w-3 h-3" />,
        };
      case 'USED':
        return { label: t('vouchers.status_used'), cls: 'bg-slate-200 text-slate-700', icon: null };
      default:
        return { label: t('vouchers.status_expired'), cls: 'bg-rose-100 text-rose-800', icon: null };
    }
  };

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
            <span>
              {userPoints !== null ? `${userPoints.toLocaleString()} ${t('common.points_short')}` : '—'}
            </span>
          </div>
        </div>

        {/* 3-SUBTABS SWITCHER */}
        <div className="max-w-4xl mx-auto px-4 flex items-center border-t border-slate-100 text-xs font-bold overflow-x-auto no-scrollbar">
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

      {/* MAIN CONTENT */}
      <main className="max-w-4xl mx-auto px-4 py-5 flex-1 w-full space-y-4">
        {/* SUBTAB 1: MY VOUCHERS */}
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
                <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar py-0.5">
                  {categories.map((cat) => (
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

                <div className="flex items-center space-x-1 text-[11px] overflow-x-auto no-scrollbar">
                  {(['ALL', 'AVAILABLE', 'AWAITING_CONFIRMATION', 'USED', 'EXPIRED'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setFilterStatus(st)}
                      className={`px-2 py-0.5 rounded-lg font-bold whitespace-nowrap transition ${
                        filterStatus === st
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      {st === 'ALL'
                        ? t('vouchers.all_status')
                        : st === 'AVAILABLE'
                        ? t('vouchers.status_active')
                        : st === 'AWAITING_CONFIRMATION'
                        ? t('vouchers.status_awaiting_confirmation')
                        : st === 'USED'
                        ? t('vouchers.status_used')
                        : t('vouchers.status_expired')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {loadingVouchers ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <SkeletonCard rows={3} />
                <SkeletonCard rows={3} />
              </div>
            ) : filteredVouchers.length === 0 ? (
              <EmptyState
                icon={<Ticket className="w-6 h-6" />}
                title={t('vouchers.empty_title')}
                description={t('vouchers.empty_desc')}
                actionLabel={t('vouchers.refresh')}
                onAction={loadVouchers}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredVouchers.map((v) => {
                  const isAvailable = v.status === 'AVAILABLE';
                  const meta = getStatusMeta(v.status);
                  return (
                    <div
                      key={v.id}
                      onClick={() => {
                        if (isAvailable) {
                          soundHaptics.playClick();
                          setSelectedVoucher({ item: v, mode: 'CHECKOUT' });
                        }
                      }}
                      className={`bg-white rounded-2xl border p-4 shadow-xs transition flex flex-col justify-between relative overflow-hidden ${
                        isAvailable
                          ? 'border-slate-200/90 hover:border-amber-400 hover:shadow-md cursor-pointer'
                          : 'border-slate-200/60 opacity-75 bg-slate-50/70'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-md">
                            {v.partnerName}
                          </span>
                          <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${meta.cls}`}>
                            {meta.icon}
                            <span>{meta.label}</span>
                          </span>
                        </div>

                        <h3 className="font-black text-sm text-slate-900 line-clamp-1">{v.title}</h3>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-1">{v.minOrder}</p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs gap-2">
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

        {/* SUBTAB 2: REDEEM CATALOG */}
        {activeMainTab === 'REDEEM_CATALOG' && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-4 rounded-2xl border border-amber-200 flex items-center justify-between text-xs">
              <div>
                <span className="font-black text-amber-950 text-sm block">{t('vouchers.partner_catalog_title')}</span>
                <span className="text-amber-800/80 text-[11px]">{t('vouchers.partner_catalog_desc')}</span>
              </div>
              <span className="bg-amber-500 text-slate-950 font-black px-2.5 py-1 rounded-xl text-xs font-mono shadow-xs">
                {userPoints !== null ? `${userPoints.toLocaleString()} ${t('common.points_short')}` : '—'}
              </span>
            </div>

            {loadingCatalog ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SkeletonCard rows={3} />
                <SkeletonCard rows={3} />
              </div>
            ) : catalog.length === 0 ? (
              <EmptyState
                icon={<Gift className="w-6 h-6" />}
                title={t('vouchers.catalog_empty_title')}
                description={t('vouchers.catalog_empty_desc')}
                actionLabel={t('vouchers.refresh')}
                onAction={loadCatalog}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {catalog.map((catItem) => {
                  const isSoldOut =
                    catItem.status === 'SOLD_OUT' ||
                    (typeof catItem.availableQuantity === 'number' && catItem.availableQuantity <= 0);
                  const canAfford = !isSoldOut && availablePoints >= catItem.pointCost;
                  const isRedeeming = redeemingCode === catItem.voucherCode;

                  return (
                    <div
                      key={catItem.id}
                      className={`bg-white rounded-3xl border p-4 shadow-xs transition flex flex-col justify-between space-y-3 ${
                        isSoldOut ? 'border-slate-200 opacity-75' : 'border-slate-200/90 hover:border-amber-400 hover:shadow-md'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                            {catItem.partnerName || catItem.partnerCode}
                          </span>
                          {isSoldOut ? (
                            <span className="inline-flex items-center gap-1 text-[9px] font-black bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full uppercase">
                              <Ban className="w-3 h-3" />
                              {t('vouchers.status_sold_out')}
                            </span>
                          ) : (
                            <span className="text-[9px] font-black bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full uppercase font-mono">
                              {catItem.voucherCode}
                            </span>
                          )}
                        </div>

                        <h3 className="font-black text-sm text-slate-900">{catItem.title}</h3>
                        <p className="text-xs text-slate-500 mt-1">
                          {catItem.description ||
                            t('vouchers.min_bill', { amount: (catItem.minBillAmount ?? 0).toLocaleString() })}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 block">{t('vouchers.points_to_redeem')}</span>
                          <span className="font-black text-amber-700 font-mono text-sm">
                            {t('vouchers.required_points', { points: catItem.pointCost })}
                          </span>
                        </div>

                        <button
                          onClick={() => handleRedeemFromCatalog(catItem)}
                          disabled={!canAfford || isRedeeming || isSoldOut}
                          className={`px-4 py-2 rounded-xl text-xs font-black transition active:scale-95 ${
                            isSoldOut
                              ? 'bg-rose-50 text-rose-400 border border-rose-200 cursor-not-allowed'
                              : canAfford
                              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md'
                              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          {isSoldOut
                            ? t('vouchers.status_sold_out')
                            : isRedeeming
                            ? t('vouchers.redeeming')
                            : t('vouchers.btn_redeem_now')}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* SUBTAB 3: CASHBACK */}
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
                {userPoints !== null ? `${userPoints.toLocaleString()} ${t('common.points_unit')}` : '—'}
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {t('vouchers.points_to_convert_label')}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="100"
                    min="100"
                    max={availablePoints}
                    value={cashbackPointsInput}
                    onChange={(e) => setCashbackPointsInput(e.target.value)}
                    placeholder={t('vouchers.input_points_placeholder')}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-mono font-black text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    {t('common.points_unit')}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200/80 flex items-center justify-between text-xs">
                <div>
                  <span className="text-emerald-950 font-bold block">{t('vouchers.received_amount_label')}</span>
                  <span className="text-[10px] text-emerald-700/80">{t('vouchers.rate_exchange_desc')}</span>
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

      {/* MODAL: VQ-02 & VQ-03 SCAN AT THE COUNTER (QR + CODE128 + ALPHANUMERIC CODE) */}
      <VoucherBarcodeModal
        isOpen={Boolean(selectedVoucher)}
        onClose={() => setSelectedVoucher(null)}
        mode={selectedVoucher?.mode || 'CHECKOUT'}
        voucher={
          selectedVoucher
            ? {
                id: selectedVoucher.item.id,
                voucherCode: selectedVoucher.item.code,
                voucherTitle: selectedVoucher.item.title,
                partnerName: selectedVoucher.item.partnerName,
                discountText: selectedVoucher.item.discountText,
                expiredAt: selectedVoucher.item.validUntil,
                minOrder: selectedVoucher.item.minOrder,
                terms: selectedVoucher.item.terms,
                status: selectedVoucher.item.status,
              }
            : null
        }
      />

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
