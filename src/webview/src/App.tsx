import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import {
  QrCode,
  X,
  Sparkles,
  Clock,
  CheckCircle2,
  ShieldCheck,
  Flame,
  Home,
  Ticket,
  Gamepad2,
  History,
  Gift,
  ChevronRight,
  Smartphone,
  Store,
  Copy,
  Check,
  Crown
} from 'lucide-react';
import { LoyaltyJSBridge } from './bridge/LoyaltyJSBridge';
import { GameHubPage } from './pages/GameHubPage';
import { LuckyWheelPage } from './pages/LuckyWheelPage';
import { FlappyNatcomGame } from './pages/games/FlappyNatcomGame';
import { Game2048Page } from './pages/games/Game2048Page';
import { MemoryMatchGame } from './pages/games/MemoryMatchGame';
import { BubbleShooterGame } from './pages/games/BubbleShooterGame';
import { FruitSliceGame } from './pages/games/FruitSliceGame';
import { KnifeHitGame } from './pages/games/KnifeHitGame';
import { BlockPuzzleGame } from './pages/games/BlockPuzzleGame';
import { EndlessRunnerGame } from './pages/games/EndlessRunnerGame';
import { WordleGame } from './pages/games/WordleGame';
import { UserVoucherPage } from './pages/UserVoucherPage';
import { GameCoverArt } from './components/game-assets/GameArtAssets';
import { LanguageSelector } from './components/LanguageSelector';
import { TierBenefitsModal } from './components/TierBenefitsModal';
import { NotificationModal, NotificationType } from './components/NotificationModal';
import { LoyaltyApi, MemberProfile, MilestoneItem, LedgerItem, PartnerItem, getDefaultUserId, getTenantId } from './services/api';

export type AppTabType =
  | 'HOME'
  | 'GAMEHUB'
  | 'WHEEL'
  | 'FLAPPY'
  | 'GAME2048'
  | 'MEMORY'
  | 'BUBBLE'
  | 'FRUIT'
  | 'KNIFE'
  | 'BLOCK'
  | 'RUNNER'
  | 'WORDLE'
  | 'VOUCHERS';

export const App: React.FC = () => {
  const { t } = useTranslation();
  const [currentTab, setCurrentTab] = useState<AppTabType>('HOME');
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [milestones, setMilestones] = useState<MilestoneItem[]>([]);
  const [ledgerItems, setLedgerItems] = useState<LedgerItem[]>([]);
  const [partners, setPartners] = useState<PartnerItem[]>([]);

  // User state
  const [userPoints, setUserPoints] = useState<number>(2480);
  const [freeTurns, setFreeTurns] = useState<number>(2);
  const [perpetualTurns, setPerpetualTurns] = useState<number>(5);

  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [showTierModal, setShowTierModal] = useState<boolean>(false);
  const [notifyModal, setNotifyModal] = useState<{
    isOpen: boolean;
    type: NotificationType;
    title?: string;
    message: string;
    badge?: string;
  }>({
    isOpen: false,
    type: 'info',
    message: '',
  });
  const [qrCountdown, setQrCountdown] = useState<number>(60);
  const [qrToken, setQrToken] = useState<string>('NATCASH_PAY_TOKEN_' + Math.floor(100000 + Math.random() * 900000));
  const [copiedToken, setCopiedToken] = useState<boolean>(false);

  const userId = getDefaultUserId();
  const tenantId = getTenantId();

  // Smooth Scroll to Top Helper
  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    const rootEl = document.getElementById('root');
    if (rootEl) rootEl.scrollTop = 0;
  }, []);

  // URL Hash Synchronized Navigation for Seamless Browser / Hardware Back Button
  const navigateToTab = useCallback((tab: AppTabType) => {
    if (tab === 'HOME') {
      window.location.hash = '#/';
    } else {
      window.location.hash = `#/${tab.toLowerCase()}`;
    }
    setCurrentTab(tab);
    scrollToTop();
  }, [scrollToTop]);

  // Scroll to Top on tab change
  useEffect(() => {
    scrollToTop();
  }, [currentTab, scrollToTop]);

  useEffect(() => {
    const handleHashChange = () => {
      const rawHash = window.location.hash.replace(/^#\/?/, '').toUpperCase();
      if (rawHash === 'GAMEHUB') {
        setCurrentTab('GAMEHUB');
      } else if (rawHash === 'WHEEL' || rawHash === 'GAMEHUB/WHEEL') {
        setCurrentTab('WHEEL');
      } else if (rawHash === 'FLAPPY' || rawHash === 'GAMEHUB/FLAPPY') {
        setCurrentTab('FLAPPY');
      } else if (rawHash === 'GAME2048' || rawHash === '2048' || rawHash === 'GAMEHUB/2048') {
        setCurrentTab('GAME2048');
      } else if (rawHash === 'MEMORY' || rawHash === 'GAMEHUB/MEMORY') {
        setCurrentTab('MEMORY');
      } else if (rawHash === 'BUBBLE' || rawHash === 'GAMEHUB/BUBBLE') {
        setCurrentTab('BUBBLE');
      } else if (rawHash === 'FRUIT' || rawHash === 'GAMEHUB/FRUIT') {
        setCurrentTab('FRUIT');
      } else if (rawHash === 'KNIFE' || rawHash === 'GAMEHUB/KNIFE') {
        setCurrentTab('KNIFE');
      } else if (rawHash === 'BLOCK' || rawHash === 'GAMEHUB/BLOCK') {
        setCurrentTab('BLOCK');
      } else if (rawHash === 'RUNNER' || rawHash === 'GAMEHUB/RUNNER') {
        setCurrentTab('RUNNER');
      } else if (rawHash === 'WORDLE' || rawHash === 'GAMEHUB/WORDLE') {
        setCurrentTab('WORDLE');
      } else if (rawHash === 'VOUCHERS' || rawHash === 'REWARDS') {
        setCurrentTab('VOUCHERS');
      } else {
        setCurrentTab('HOME');
      }
      scrollToTop();
    };

    handleHashChange();

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, [scrollToTop]);

  const loadData = useCallback(async () => {
    try {
      const [profileData, milestoneData, ledgerData, partnerData] = await Promise.all([
        LoyaltyApi.getProfile(userId).catch(() => null),
        LoyaltyApi.getMilestones(userId).catch(() => ({ campaigns: [], milestones: [] })),
        LoyaltyApi.getPointLedger(userId, 0, 5).catch(() => ({ items: [], totalElements: 0 })),
        LoyaltyApi.getPartners().catch(() => []),
      ]);

      if (profileData) {
        setProfile(profileData);
        if (profileData.currentPoints) setUserPoints(profileData.currentPoints);
      }
      if (milestoneData?.milestones) setMilestones(milestoneData.milestones);
      if (ledgerData?.items) setLedgerItems(ledgerData.items);
      if (partnerData) setPartners(partnerData);
    } catch (e) {
      console.error('Lỗi nạp dữ liệu API:', e);
    }
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto refresh dynamic QR code every 60s
  useEffect(() => {
    const timer = setInterval(() => {
      setQrCountdown((prev) => {
        if (prev <= 1) {
          setQrToken('NATCASH_PAY_TOKEN_' + Math.floor(100000 + Math.random() * 900000));
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCopyQrToken = () => {
    navigator.clipboard.writeText(qrToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handleDailyCheckin = async () => {
    setUserPoints((p) => p + 20);
    setPaymentStatus(t('wallet.checkin_success'));
    setTimeout(() => setPaymentStatus(null), 4000);
  };

  const points = userPoints;
  const tierName = profile?.tier?.name || t('hero.current_tier');
  const tierMultiplier = profile?.tier?.pointMultiplier ? `×${profile.tier.pointMultiplier}` : '×1.2';
  const currentTierPoints = profile?.nextTierProgress?.currentTierPoints ?? profile?.tierPoints ?? 2480;
  const nextTierPoints = profile?.nextTierProgress?.requiredPoints ?? 5000;
  const progressPercent = profile?.nextTierProgress?.progressPercentage ?? Math.min(100, Math.round((currentTierPoints / nextTierPoints) * 100));
  const pointsNeeded = profile?.nextTierProgress?.pointsNeeded ?? Math.max(0, nextTierPoints - currentTierPoints);

  const isPlayingGame = currentTab !== 'HOME' && currentTab !== 'GAMEHUB' && currentTab !== 'VOUCHERS';

  return (
    <div className={`min-h-screen ${isPlayingGame ? 'bg-slate-950 pb-0' : 'bg-slate-50 text-slate-800 pb-20 md:pb-0'} flex flex-col font-sans selection:bg-amber-500 selection:text-white`}>
      {/* ── TOP LUXURY DESKTOP & MOBILE HEADER (Light Theme) ── */}
      {!isPlayingGame && (
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo and Brand */}
          <div
            onClick={() => navigateToTab('HOME')}
            className="flex items-center space-x-3 cursor-pointer select-none group"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center font-black text-xl shadow-md group-hover:scale-105 transition duration-300">
              👑
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900">
                  {t('header.crown_title')}
                </span>
                <span className="text-[9px] bg-amber-500 text-slate-950 font-black px-1.5 py-0.2 rounded-full uppercase tracking-wider">
                  {tenantId}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 hidden sm:block">{t('nav.tagline')}</p>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/80">
            <button
              onClick={() => navigateToTab('HOME')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                currentTab === 'HOME'
                  ? 'bg-white text-slate-950 shadow-sm font-extrabold'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>{t('nav.home')}</span>
            </button>

            <button
              onClick={() => navigateToTab('GAMEHUB')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 relative ${
                currentTab !== 'HOME' && currentTab !== 'VOUCHERS'
                  ? 'bg-white text-amber-700 shadow-sm font-extrabold'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
              <Gamepad2 className="w-3.5 h-3.5 text-amber-600" />
              <span>{t('nav.gamehub')}</span>
              <span className="text-[9px] bg-red-600 text-white font-black px-1.5 py-0.2 rounded-full uppercase">
                {t('header.hot_badge')}
              </span>
            </button>

            <button
              onClick={() => navigateToTab('VOUCHERS')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                currentTab === 'VOUCHERS'
                  ? 'bg-white text-slate-950 shadow-sm font-extrabold'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              <Ticket className="w-3.5 h-3.5 text-indigo-600" />
              <span>{t('nav.vouchers')}</span>
            </button>
          </nav>

          {/* Right Action: Points Badge, Language Dropdown & Close */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Live Point Balance Chip */}
            <div
              onClick={() => setShowTierModal(true)}
              className="bg-amber-50 hover:bg-amber-100/70 border border-amber-200/80 px-2.5 sm:px-3 py-1.5 rounded-2xl flex items-center space-x-2 text-xs font-bold cursor-pointer transition active:scale-95 shadow-xs"
              title={t('hero.btn_view_perks')}
            >
              <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center font-black text-[10px] shadow-xs">
                ★
              </div>
              <div className="flex flex-col text-right leading-none">
                <span className="font-mono font-black text-amber-900 text-xs">
                  {points.toLocaleString()}
                </span>
                <span className="text-[9px] text-amber-700 font-semibold">{tierName}</span>
              </div>
            </div>

            {/* Language Dropdown */}
            <LanguageSelector />

            {/* Close Webview Button */}
            <button
              onClick={() => LoyaltyJSBridge.closeWebview()}
              className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-95 transition text-slate-600 hover:text-slate-900 border border-slate-200"
              title={t('nav.close')}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>
      )}

      {/* ── MAIN CONTENT ROUTER ── */}
      <main className="flex-1">
        {/* TAB: CỔNG GAME (GAMEHUB) */}
        {currentTab === 'GAMEHUB' && (
          <GameHubPage
            onBack={() => navigateToTab('HOME')}
            onSelectGame={(gameId) => navigateToTab(gameId)}
            freeTurns={freeTurns}
            perpetualTurns={perpetualTurns}
            points={points}
            onUpdateTurns={(free, perp) => {
              setFreeTurns(free);
              setPerpetualTurns(perp);
            }}
          />
        )}

        {/* SUBGAME: VÒNG QUAY TRI ÂN */}
        {currentTab === 'WHEEL' && (
          <LuckyWheelPage onBack={() => navigateToTab('GAMEHUB')} />
        )}

        {/* SUBGAME 1: FLAPPY NATCOM */}
        {currentTab === 'FLAPPY' && (
          <FlappyNatcomGame
            onBack={() => navigateToTab('GAMEHUB')}
            onClaimReward={(earnedPoints) => setUserPoints((p) => p + earnedPoints)}
          />
        )}

        {/* SUBGAME 2: 2048 NATCASH */}
        {currentTab === 'GAME2048' && (
          <Game2048Page
            onBack={() => navigateToTab('GAMEHUB')}
            onClaimReward={(earnedPoints) => setUserPoints((p) => p + earnedPoints)}
          />
        )}

        {/* SUBGAME 3: LẬT THẺ TÌM CẶP */}
        {currentTab === 'MEMORY' && (
          <MemoryMatchGame
            onBack={() => navigateToTab('GAMEHUB')}
            onClaimReward={(earnedPoints) => setUserPoints((p) => p + earnedPoints)}
          />
        )}

        {/* SUBGAME 4: BẮN BÓNG KANAVAL */}
        {currentTab === 'BUBBLE' && (
          <BubbleShooterGame
            onBack={() => navigateToTab('GAMEHUB')}
            onClaimReward={(earnedPoints) => setUserPoints((p) => p + earnedPoints)}
          />
        )}

        {/* SUBGAME 5: CHÉM HOA QUẢ CARIBE */}
        {currentTab === 'FRUIT' && (
          <FruitSliceGame
            onBack={() => navigateToTab('GAMEHUB')}
            onClaimReward={(earnedPoints) => setUserPoints((p) => p + earnedPoints)}
          />
        )}

        {/* SUBGAME 6: PHI DAO VÒNG GỖ */}
        {currentTab === 'KNIFE' && (
          <KnifeHitGame
            onBack={() => navigateToTab('GAMEHUB')}
            onClaimReward={(earnedPoints) => setUserPoints((p) => p + earnedPoints)}
          />
        )}

        {/* SUBGAME 7: XẾP GẠCH KIM CƯƠNG */}
        {currentTab === 'BLOCK' && (
          <BlockPuzzleGame
            onBack={() => navigateToTab('GAMEHUB')}
            onClaimReward={(earnedPoints) => setUserPoints((p) => p + earnedPoints)}
          />
        )}

        {/* SUBGAME 8: ĐƯỜNG ĐUA SIÊU TỐC */}
        {currentTab === 'RUNNER' && (
          <EndlessRunnerGame
            onBack={() => navigateToTab('GAMEHUB')}
            onClaimReward={(earnedPoints) => setUserPoints((p) => p + earnedPoints)}
          />
        )}

        {/* SUBGAME 9: ĐOÁN CHỮ MAY MẮN */}
        {currentTab === 'WORDLE' && (
          <WordleGame
            onBack={() => navigateToTab('GAMEHUB')}
            onClaimReward={(earnedPoints) => setUserPoints((p) => p + earnedPoints)}
          />
        )}

        {/* TAB: KHO ƯU ĐÃI & ĐỔI THƯỞNG */}
        {currentTab === 'VOUCHERS' && (
          <UserVoucherPage
            onBack={() => navigateToTab('HOME')}
            userPoints={points}
            onDeductPoints={(pts) => setUserPoints((p) => Math.max(0, p - pts))}
          />
        )}

        {/* TAB: TRANG CHỦ TỔNG HỢP (HOME) */}
        {currentTab === 'HOME' && (
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5 animate-fade-in">
            {/* Status Alert Banner */}
            {paymentStatus && (
              <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-2xl flex items-center justify-between text-xs sm:text-sm animate-fade-in shadow-sm">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold">{paymentStatus}</span>
                </div>
                <button onClick={() => setPaymentStatus(null)} className="text-emerald-700 hover:text-emerald-900">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* ── SECTION 1: HERO VIP CARD & DYNAMIC QR HUB ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
              {/* Left Column: 3D Metallic VIP Tier Card */}
              <div className="lg:col-span-7 flex flex-col justify-between space-y-3 sm:space-y-4 overflow-hidden no-scrollbar">
                {/* Smart VIP Tier Nudge */}
                <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100/60 border border-amber-200/90 rounded-2xl p-3 sm:p-3.5 flex items-center space-x-3 shadow-xs">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shrink-0 shadow-md">
                    <Flame className="w-4 h-4 animate-pulse" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-[11px] sm:text-xs text-amber-950 uppercase tracking-wider">
                        {t('hero.nudge_title')}
                      </span>
                      <span className="text-[9px] bg-amber-200/80 text-amber-900 font-bold px-2 py-0.5 rounded-full border border-amber-300">
                        {t('hero.nudge_badge')}
                      </span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-amber-900 mt-0.5 leading-snug">
                      <Trans
                        i18nKey="hero.nudge_desc"
                        values={{ points: pointsNeeded.toLocaleString() }}
                        components={{ bold: <strong className="font-bold text-orange-700 font-mono" /> }}
                      />
                    </p>
                  </div>
                </div>

                {/* 3D VIP Card */}
                <div className="relative rounded-3xl p-4 sm:p-7 text-white shadow-xl shadow-amber-500/15 overflow-hidden bg-gradient-to-br from-amber-500 via-amber-600 to-yellow-600 border border-amber-400/40 no-scrollbar select-none isolate">
                  {/* Decorative Ambient Inset Glows (Safe from WebKit blur clipping bugs) */}
                  <div className="absolute inset-0 bg-gradient-to-t from-amber-950/25 via-transparent to-white/20 pointer-events-none" />
                  <div className="absolute top-0 right-0 w-48 h-48 bg-radial from-white/25 via-transparent to-transparent pointer-events-none" />

                  {/* Top: Tier Info */}
                  <div className="flex justify-between items-start mb-3 sm:mb-6 relative z-10">
                    <div>
                      <span className="text-[10px] sm:text-xs uppercase font-extrabold tracking-widest text-amber-100 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-200" /> {t('hero.card_type')}
                      </span>
                      <h2 className="text-xl sm:text-2xl font-black tracking-wide mt-1 drop-shadow-sm flex items-center gap-2">
                        {tierName}{' '}
                        <span className="text-[10px] font-bold bg-white/25 backdrop-blur-md px-2 py-0.5 rounded-full text-amber-50 border border-white/30">
                          {t('hero.vip_badge')}
                        </span>
                      </h2>
                      <p className="text-[10px] sm:text-xs text-amber-100/90 font-mono mt-0.5">
                        {t('hero.card_id', { userId })}
                      </p>
                    </div>

                    <div className="bg-white/25 backdrop-blur-md px-2.5 sm:px-3 py-1 rounded-xl text-xs font-black border border-white/30 text-white shadow-sm flex items-center gap-1">
                      <span>{tierMultiplier}</span>
                      <span className="text-[9px] opacity-90 font-normal uppercase">{t('hero.earn_rate')}</span>
                    </div>
                  </div>

                  {/* Middle: Progress Bar */}
                  <div className="space-y-1.5 my-3 sm:my-5 relative z-10 bg-black/15 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-white/15">
                    <div className="flex justify-between text-[11px] sm:text-xs text-amber-100 font-medium">
                      <span>{t('hero.next_tier_progress')}</span>
                      <span className="font-bold text-white font-mono">
                        {currentTierPoints.toLocaleString()} / {nextTierPoints.toLocaleString()} {t('nav.points_unit')}
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-black/30 rounded-full overflow-hidden p-0.5">
                      <div
                        className="h-full bg-gradient-to-r from-yellow-200 via-amber-100 to-white rounded-full transition-all duration-700"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-amber-200/90">
                      <span>{tierName}</span>
                      <span>{t('hero.progress_status', { percent: progressPercent })}</span>
                    </div>
                  </div>

                  {/* Bottom: Points Available & Fast Actions */}
                  <div className="pt-3 border-t border-white/20 flex flex-col sm:flex-row sm:items-end justify-between gap-3 relative z-10">
                    <div>
                      <div className="text-[10px] sm:text-xs text-amber-100 font-medium">{t('hero.points_balance')}</div>
                      <div className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-baseline gap-1 font-mono">
                        {points.toLocaleString()}
                        <span className="text-xs sm:text-sm font-normal opacity-90 font-sans">{t('nav.points_unit')}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center">
                      <button
                        onClick={() => setShowTierModal(true)}
                        className="bg-black/20 hover:bg-black/30 backdrop-blur-md text-white font-bold px-2.5 sm:px-3 py-2 rounded-xl text-xs border border-white/30 flex items-center justify-center gap-1 transition active:scale-95"
                      >
                        <Crown className="w-3.5 h-3.5 text-yellow-200 shrink-0" />
                        <span className="truncate">{t('hero.btn_view_perks')}</span>
                      </button>

                      <button
                        onClick={() => setShowQrModal(true)}
                        className="bg-white text-slate-950 font-black px-2.5 sm:px-3.5 py-2 rounded-xl text-xs shadow-lg hover:bg-amber-50 flex items-center justify-center space-x-1.5 active:scale-95 transition"
                      >
                        <QrCode className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span className="truncate">{t('hero.btn_wallet_code')}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Embedded Dynamic QR Payment Card */}
              <div className="lg:col-span-5 flex flex-col justify-between space-y-3 sm:space-y-4">
                <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between flex-1 relative overflow-hidden">
                  <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
                    <div>
                      <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-1.5">
                        <QrCode className="w-4 h-4 text-amber-600" /> {t('wallet.title')}
                      </h3>
                      <p className="text-[11px] text-slate-500">{t('wallet.subtitle')}</p>
                    </div>
                    <div className="flex items-center space-x-1 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg">
                      <Clock className="w-3 h-3 animate-spin text-amber-600" />
                      <span className="font-mono">{qrCountdown}{t('wallet.seconds')}</span>
                    </div>
                  </div>

                  {/* QR Display */}
                  <div className="my-3 bg-slate-50 p-3 sm:p-4 rounded-2xl border border-slate-200/80 flex flex-col items-center justify-center text-center">
                    <div className="bg-white p-2.5 rounded-2xl border-2 border-slate-900 shadow-md inline-block">
                      <QrCode className="w-28 h-28 sm:w-36 sm:h-36 text-slate-950" />
                    </div>
                    <div className="mt-2.5 flex items-center space-x-1.5">
                      <span className="text-[11px] font-mono font-bold text-slate-800 bg-white px-2.5 py-0.5 rounded border border-slate-300">
                        {qrToken}
                      </span>
                      <button
                        onClick={handleCopyQrToken}
                        className="p-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 transition"
                        title={t('wallet.copy_hint')}
                      >
                        {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Fast Action Buttons Grid */}
                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <button
                      onClick={handleDailyCheckin}
                      className="py-2 px-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center space-x-1 shadow-md shadow-amber-500/20 active:scale-95 transition"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{t('wallet.btn_checkin')}</span>
                    </button>

                    <button
                      onClick={() => navigateToTab('VOUCHERS')}
                      className="py-2 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center justify-center space-x-1 border border-slate-200 active:scale-95 transition"
                    >
                      <Ticket className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{t('wallet.btn_vouchers')}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ── SECTION 2: PROMOTIONAL EVENT BANNER (Configured by CMS) ── */}
            <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 rounded-3xl p-5 sm:p-6 text-white border border-amber-500/30 shadow-lg relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="relative z-10 max-w-xl space-y-1.5">
                <span className="bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow">
                  {t('promo.featured_badge')}
                </span>
                <h3 className="text-base sm:text-lg font-black text-amber-200">
                  {t('promo.banner_title')}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {t('promo.banner_desc')}
                </p>
              </div>

              <div className="relative z-10 flex items-center space-x-2.5 shrink-0 w-full md:w-auto">
                <button
                  onClick={() => navigateToTab('WHEEL')}
                  className="flex-1 md:flex-none py-2.5 px-4 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black rounded-xl text-xs shadow-md active:scale-95 transition flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{t('promo.btn_play_featured')}</span>
                </button>

                <button
                  onClick={() => navigateToTab('GAMEHUB')}
                  className="py-2.5 px-3.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs border border-white/20 active:scale-95 transition"
                >
                  {t('promo.btn_explore_games')}
                </button>
              </div>
            </div>

            {/* ── SECTION 3: FEATURED 6 GAMES ON DASHBOARD (3-COLUMN RESPONSIVE GRID) ── */}
            <div className="space-y-3 sm:space-y-3.5">
              <div className="flex justify-between items-end">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                    <Gamepad2 className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" /> {t('gamehub.title')}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-500">{t('gamehub.subtitle')}</p>
                </div>
                <button
                  onClick={() => navigateToTab('GAMEHUB')}
                  className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-0.5"
                >
                  <span>{t('promo.btn_explore_games')}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* 6 Featured Games Grid (Mobile: 3/row, Tablet/Desktop: 6/row) */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5 sm:gap-3.5">
                {[
                  {
                    id: 'WHEEL',
                    name: t('gamehub.game1_name', { defaultValue: 'Vòng Quay Tri Ân' }),
                    categoryLabel: t('gamehub.cat_lucky', { defaultValue: 'May Mắn' }),
                    icon: '🎡',
                    bgGradient: 'bg-gradient-to-br from-amber-500 via-orange-500 to-yellow-500',
                    badge: 'HOT',
                    badgeBg: 'bg-red-600',
                    perk: freeTurns > 0 ? `${freeTurns} Free` : '20 HTG',
                    action: () => navigateToTab('WHEEL'),
                  },
                  {
                    id: 'FLAPPY',
                    name: t('games.flappy.title', { defaultValue: 'Flappy Natcom' }),
                    categoryLabel: t('gamehub.cat_skill', { defaultValue: 'Phản Xạ' }),
                    icon: '🕊️',
                    bgGradient: 'bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700',
                    badge: 'NEW',
                    badgeBg: 'bg-emerald-600',
                    perk: 'Data 4G',
                    action: () => navigateToTab('FLAPPY'),
                  },
                  {
                    id: 'GAME2048',
                    name: t('games.game2048.title', { defaultValue: '2048 Natcash' }),
                    categoryLabel: t('gamehub.cat_puzzle', { defaultValue: 'Trí Tuệ' }),
                    icon: '🔢',
                    bgGradient: 'bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-600',
                    badge: '2048 HTG',
                    badgeBg: 'bg-amber-600',
                    perk: t('gamehub.perk_merge', { defaultValue: 'Gộp Tiền' }),
                    action: () => navigateToTab('GAME2048'),
                  },
                  {
                    id: 'MEMORY',
                    name: t('games.memory.title', { defaultValue: 'Lật Thẻ Tìm Cặp' }),
                    categoryLabel: t('gamehub.cat_puzzle', { defaultValue: 'Trí Tuệ' }),
                    icon: '🃏',
                    bgGradient: 'bg-gradient-to-br from-purple-600 via-indigo-600 to-pink-600',
                    badge: t('gamehub.badge_45s', { defaultValue: '45 Giây' }),
                    badgeBg: 'bg-purple-600',
                    perk: 'Delimart',
                    action: () => navigateToTab('MEMORY'),
                  },
                  {
                    id: 'BUBBLE',
                    name: t('games.bubble.title', { defaultValue: 'Bắn Bóng Kanaval' }),
                    categoryLabel: t('gamehub.cat_casual', { defaultValue: 'Giải Trí' }),
                    icon: '🔮',
                    bgGradient: 'bg-gradient-to-br from-pink-500 via-rose-600 to-amber-500',
                    badge: t('gamehub.badge_jackpot', { defaultValue: 'NỔ HŨ' }),
                    badgeBg: 'bg-pink-600',
                    perk: 'Combo x5',
                    action: () => navigateToTab('BUBBLE'),
                  },
                  {
                    id: 'FRUIT',
                    name: t('games.fruit.title', { defaultValue: 'Chém Hoa Quả' }),
                    categoryLabel: t('gamehub.cat_skill', { defaultValue: 'Phản Xạ' }),
                    icon: '🥭',
                    bgGradient: 'bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600',
                    badge: t('gamehub.badge_slash', { defaultValue: 'VUNG KIẾM' }),
                    badgeBg: 'bg-emerald-600',
                    perk: 'Caribe',
                    action: () => navigateToTab('FRUIT'),
                  },
                ].map((game) => (
                  <div
                    key={game.id}
                    onClick={game.action}
                    className="group flex flex-col items-center bg-white rounded-3xl p-1.5 sm:p-2 border border-slate-100/90 shadow-xs hover:shadow-xl hover:border-amber-400 hover:-translate-y-1.5 active:scale-95 transition-all duration-200 cursor-pointer relative select-none"
                  >
                    {/* Full-Bleed Square Game Tile with Giant Icon (Occupying 80% height) */}
                    <div className={`w-full aspect-square rounded-2xl sm:rounded-3xl ${game.bgGradient} flex items-center justify-center relative overflow-hidden shadow-inner group-hover:shadow-xl transition-all duration-300 border border-white/25`}>
                      {/* Radial Ambient Glow */}
                      <div className="absolute inset-0 bg-radial from-white/35 via-transparent to-black/25 pointer-events-none" />
                      <div className="absolute -top-10 -right-10 w-24 h-24 bg-white/30 rounded-full blur-xl pointer-events-none" />

                      {/* Floating Top Badge */}
                      {game.badge && (
                        <span className={`absolute top-1.5 left-1.5 ${game.badgeBg || 'bg-red-600'} text-white text-[8px] sm:text-[9px] font-black px-1.5 sm:px-2 py-0.5 rounded-full uppercase tracking-tight shadow-md z-10 leading-none`}>
                          {game.badge}
                        </span>
                      )}

                      {/* 3D High-End Vector Art Cover (Replacing generic emoji) */}
                      <div className="relative z-0 w-full h-full flex items-center justify-center p-1.5 group-hover:scale-105 transition-all duration-300 select-none">
                        <GameCoverArt gameId={game.id} className="w-full h-full object-contain drop-shadow-xl" />
                      </div>

                      {/* Floating Bottom Perk Tag */}
                      {game.perk && (
                        <span className="absolute bottom-1.5 right-1.5 bg-slate-950/85 backdrop-blur-md text-amber-300 text-[8px] sm:text-[9px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-lg border border-white/20 shadow-md z-10 leading-none">
                          {game.perk}
                        </span>
                      )}
                    </div>

                    {/* Game Title & Category */}
                    <div className="w-full text-center mt-1.5 px-0.5 pb-1">
                      <h4 className="text-[11px] sm:text-xs font-black text-slate-800 group-hover:text-amber-600 line-clamp-1 leading-tight tracking-tight">
                        {game.name}
                      </h4>
                      <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium block mt-0.5 line-clamp-1">
                        {game.categoryLabel}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── SECTION 4: MILESTONE MISSIONS ── */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" /> {t('missions.title')}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-500">{t('missions.subtitle')}</p>
                </div>
                <button
                  onClick={() => navigateToTab('VOUCHERS')}
                  className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-0.5"
                >
                  <span>{t('missions.view_rewards')}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                {milestones.length > 0 ? (
                  milestones.map((m) => (
                    <div key={m.id} className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
                          <Store className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate">{m.campaignName}</h4>
                          <p className="text-[11px] text-slate-500">{t('missions.target', { target: m.targetValue, points: m.rewardPoints })}</p>
                        </div>
                      </div>
                      <div className="mt-3 pt-2 border-t border-slate-100 flex justify-between items-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          m.status === 'COMPLETED' ? 'text-emerald-700 bg-emerald-50' : 'text-amber-800 bg-amber-50'
                        }`}>
                          {m.status === 'COMPLETED' ? t('missions.completed') : t('missions.in_progress')}
                        </span>
                        <span className="text-xs font-black text-amber-600">{t('missions.plus_points', { points: m.rewardPoints })}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
                          <Store className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate">{t('missions.default1_title')}</h4>
                          <p className="text-[11px] text-slate-500">{t('missions.default1_sub')}</p>
                        </div>
                      </div>
                      <div className="mt-3 pt-2 border-t border-slate-100 flex justify-between items-center">
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">{t('missions.completed')} (1/1)</span>
                        <span className="text-xs font-black text-amber-600">{t('missions.plus_points', { points: 100 })}</span>
                      </div>
                    </div>

                    <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
                          <Smartphone className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate">{t('missions.default2_title')}</h4>
                          <p className="text-[11px] text-slate-500">{t('missions.default2_sub')}</p>
                        </div>
                      </div>
                      <div className="mt-3 pt-2 border-t border-slate-100 flex justify-between items-center">
                        <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-md">{t('missions.in_progress')} (0/1)</span>
                        <span className="text-xs font-black text-amber-600">{t('missions.plus_points', { points: 50 })}</span>
                      </div>
                    </div>

                    <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold shrink-0">
                          <Gift className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate">{t('missions.default3_title')}</h4>
                          <p className="text-[11px] text-slate-500">{t('missions.default3_sub')}</p>
                        </div>
                      </div>
                      <div className="mt-3 pt-2 border-t border-slate-100 flex justify-between items-center">
                        <span className="text-[10px] text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded-md">{t('missions.in_progress')} (2/3)</span>
                        <span className="text-xs font-black text-amber-600">{t('missions.plus_points', { points: 300 })}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* ── SECTION 5: POINT ACTIVITY & PARTNERS ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Left: Point History */}
              <div className="lg:col-span-7 bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3">
                <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-1.5">
                    <History className="w-4 h-4 text-amber-600" /> {t('ledger.title')}
                  </h3>
                  <span className="text-[11px] font-bold text-amber-600">{t('ledger.subtitle')}</span>
                </div>

                <div className="divide-y divide-slate-100">
                  {ledgerItems.length > 0 ? (
                    ledgerItems.map((item) => (
                      <div key={item.id} className="py-2.5 flex items-center justify-between">
                        <div className="flex items-center space-x-2.5">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                            item.pointChange >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                          }`}>
                            {item.pointChange >= 0 ? '+' : '-'}
                          </div>
                          <div>
                            <p className="font-bold text-xs text-slate-800">{item.description}</p>
                            <p className="text-[10px] text-slate-400">{t('ledger.ref_code', { code: item.referenceCode })}</p>
                          </div>
                        </div>
                        <span className={`font-mono font-black text-xs ${
                          item.pointChange >= 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {item.pointChange >= 0 ? `+${item.pointChange}` : `${item.pointChange}`} {t('nav.points_unit')}
                        </span>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="py-2.5 flex items-center justify-between">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">+</div>
                          <div>
                            <p className="font-bold text-xs text-slate-800">{t('ledger.default1_desc')}</p>
                            <p className="text-[10px] text-slate-400">{t('ledger.ref_code', { code: 'POS_TX_123' })}</p>
                          </div>
                        </div>
                        <span className="font-mono font-black text-emerald-600 text-xs">+150 {t('nav.points_unit')}</span>
                      </div>
                      <div className="py-2.5 flex items-center justify-between">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs">★</div>
                          <div>
                            <p className="font-bold text-xs text-slate-800">{t('ledger.default2_desc')}</p>
                            <p className="text-[10px] text-slate-400">{t('ledger.ref_code', { code: 'SPIN_TX_456' })}</p>
                          </div>
                        </div>
                        <span className="font-mono font-black text-amber-600 text-xs">+100 {t('nav.points_unit')}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Right: Partner Ecosystem */}
              <div className="lg:col-span-5 bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3">
                <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-1.5">
                    <Store className="w-4 h-4 text-amber-600" /> {t('partners.title')}
                  </h3>
                  <span className="text-[11px] text-slate-400">{t('partners.brands_count', { count: partners.length || 2 })}</span>
                </div>

                <div className="space-y-2">
                  <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center font-black text-xs">DLM</div>
                      <div>
                        <p className="font-bold text-xs text-slate-800">{t('partners.delimart_name')}</p>
                        <p className="text-[10px] text-slate-400">{t('partners.delimart_desc')}</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">{t('partners.connected')}</span>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black text-xs">NTC</div>
                      <div>
                        <p className="font-bold text-xs text-slate-800">{t('partners.natcom_name')}</p>
                        <p className="text-[10px] text-slate-400">{t('partners.natcom_desc')}</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">{t('partners.connected')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── MOBILE BOTTOM NAVIGATION BAR & DESKTOP FOOTER (HIDDEN DURING GAMEPLAY) ── */}
      {!isPlayingGame && (
        <>
          <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-2xl border-t border-slate-200/80 px-3 py-2 flex justify-around items-center z-40 shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
            {[
              {
                id: 'HOME',
                label: t('nav.home'),
                icon: Home,
                isActive: currentTab === 'HOME',
                onClick: () => navigateToTab('HOME'),
              },
              {
                id: 'GAMEHUB',
                label: t('nav.gamehub'),
                icon: Gamepad2,
                isActive: currentTab !== 'HOME' && currentTab !== 'VOUCHERS',
                onClick: () => navigateToTab('GAMEHUB'),
                hasDot: true,
              },
              {
                id: 'VOUCHERS',
                label: t('nav.vouchers'),
                icon: Ticket,
                isActive: currentTab === 'VOUCHERS',
                onClick: () => navigateToTab('VOUCHERS'),
              },
              {
                id: 'WALLET_CODE',
                label: t('nav.wallet_code'),
                icon: QrCode,
                isActive: showQrModal,
                onClick: () => setShowQrModal(true),
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={item.onClick}
                  className={`flex flex-col items-center justify-center py-1.5 px-3.5 rounded-2xl transition-all duration-200 active:scale-95 relative ${
                    item.isActive
                      ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white font-black shadow-md shadow-orange-500/30'
                      : 'text-slate-500 hover:text-slate-900 font-semibold'
                  }`}
                >
                  {item.hasDot && !item.isActive && (
                    <span className="absolute top-1 right-2 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                  )}
                  <Icon className={`w-4 h-4 mb-0.5 ${item.isActive ? 'text-white stroke-[2.5px]' : 'text-slate-500 stroke-[2px]'}`} />
                  <span className={`text-[10px] tracking-tight ${item.isActive ? 'font-black text-white' : 'font-semibold text-slate-500'}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ── DESKTOP FOOTER ── */}
          <footer className="hidden md:block bg-white text-slate-500 text-xs py-6 border-t border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>{t('footer.enterprise_security')}</span>
              </div>
              <div>
                <span>{t('footer.copyright')}</span>
              </div>
            </div>
          </footer>
        </>
      )}

      {/* ── DYNAMIC QR MODAL ── */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-5 sm:p-7 max-w-sm w-full border border-slate-200 shadow-2xl relative space-y-4 text-center">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute right-3.5 top-3.5 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition"
              aria-label={t('nav.close')}
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-1.5 font-black">
                <QrCode className="w-5 h-5" />
              </div>
              <h3 className="font-black text-lg text-slate-900">{t('wallet.modal_title')}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">{t('wallet.modal_desc')}</p>
            </div>

            {/* Dynamic QR Box */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 inline-block shadow-inner">
              <div className="w-44 h-44 bg-white border-2 border-slate-900 rounded-2xl flex flex-col items-center justify-center p-2 relative shadow-md">
                <QrCode className="w-40 h-40 text-slate-950" />
              </div>
              <div className="mt-2.5 flex items-center justify-center space-x-1.5">
                <span className="text-[11px] font-mono font-bold text-slate-800 bg-white px-2.5 py-0.5 rounded border border-slate-300">
                  {qrToken}
                </span>
                <button
                  onClick={handleCopyQrToken}
                  className="p-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 transition"
                  title={t('wallet.copy_hint')}
                >
                  {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* 60s Countdown */}
            <div className="flex items-center justify-center space-x-2 text-[11px] font-bold text-amber-900 bg-amber-50 border border-amber-200 py-2 px-3 rounded-xl">
              <Clock className="w-3.5 h-3.5 animate-spin text-amber-600" />
              <span>
                {t('wallet.refresh_in')}{' '}
                <span className="font-mono text-sm font-black">{qrCountdown}{t('wallet.seconds')}</span>
              </span>
            </div>

            <p className="text-[10px] text-slate-400 leading-tight">
              {t('wallet.modal_security_note')}
            </p>
          </div>
        </div>
      )}

      {/* ── TIER PRIVILEGES MODAL ── */}
      <TierBenefitsModal
        isOpen={showTierModal}
        onClose={() => setShowTierModal(false)}
        currentTierCode={profile?.tier?.code || 'GOLD'}
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

export default App;
