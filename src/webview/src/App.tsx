import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { DailyCheckinModal } from './components/DailyCheckinModal';
import { soundHaptics } from './utils/soundHaptics';

enum MilestoneStatus {
  CLAIMED = 'CLAIMED',
  CLAIMABLE = 'CLAIMABLE',
  COMPLETED = 'COMPLETED',
}
import {
  Volume2,
  VolumeX,
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
  Store,
  Copy,
  Check,
  Crown,
  Bell,
  MapPin,
  Hash,
  UserPlus,
  FileText,
  Briefcase,
  Settings,
  GraduationCap,
} from 'lucide-react';
import { LoyaltyJSBridge } from './bridge/LoyaltyJSBridge';
const GameHubPage = lazy(() => import('./pages/GameHubPage').then((m) => ({ default: m.GameHubPage })));
const LuckyWheelPage = lazy(() => import('./pages/LuckyWheelPage').then((m) => ({ default: m.LuckyWheelPage })));
const LuckyScratchCardGame = lazy(() => import('./pages/games/LuckyScratchCardGame').then((m) => ({ default: m.LuckyScratchCardGame })));
const LearningQuizPage = lazy(() => import('./pages/LearningQuizPage').then((m) => ({ default: m.LearningQuizPage })));
const FlappyNatcomGame = lazy(() => import('./pages/games/FlappyNatcomGame').then((m) => ({ default: m.FlappyNatcomGame })));
const Game2048Page = lazy(() => import('./pages/games/Game2048Page').then((m) => ({ default: m.Game2048Page })));
const MemoryMatchGame = lazy(() => import('./pages/games/MemoryMatchGame').then((m) => ({ default: m.MemoryMatchGame })));
const BubbleShooterGame = lazy(() => import('./pages/games/BubbleShooterGame').then((m) => ({ default: m.BubbleShooterGame })));
const FruitSliceGame = lazy(() => import('./pages/games/FruitSliceGame').then((m) => ({ default: m.FruitSliceGame })));
const KnifeHitGame = lazy(() => import('./pages/games/KnifeHitGame').then((m) => ({ default: m.KnifeHitGame })));
const BlockPuzzleGame = lazy(() => import('./pages/games/BlockPuzzleGame').then((m) => ({ default: m.BlockPuzzleGame })));
const EndlessRunnerGame = lazy(() => import('./pages/games/EndlessRunnerGame').then((m) => ({ default: m.EndlessRunnerGame })));
const WordleGame = lazy(() => import('./pages/games/WordleGame').then((m) => ({ default: m.WordleGame })));
const UntangleRopeGame = lazy(() => import('./pages/games/UntangleRopeGame').then((m) => ({ default: m.UntangleRopeGame })));
const JigsawPuzzleGame = lazy(() => import('./pages/games/JigsawPuzzleGame').then((m) => ({ default: m.JigsawPuzzleGame })));
const WaterSortGame = lazy(() => import('./pages/games/WaterSortGame').then((m) => ({ default: m.WaterSortGame })));
const StackTowerGame = lazy(() => import('./pages/games/StackTowerGame').then((m) => ({ default: m.StackTowerGame })));
const PipeConnectGame = lazy(() => import('./pages/games/PipeConnectGame').then((m) => ({ default: m.PipeConnectGame })));
const MergeDropGame = lazy(() => import('./pages/games/MergeDropGame').then((m) => ({ default: m.MergeDropGame })));
const WhackAMoleGame = lazy(() => import('./pages/games/WhackAMoleGame').then((m) => ({ default: m.WhackAMoleGame })));
const MinesweeperGame = lazy(() => import('./pages/games/MinesweeperGame').then((m) => ({ default: m.MinesweeperGame })));
const SudokuGame = lazy(() => import('./pages/games/SudokuGame').then((m) => ({ default: m.SudokuGame })));
const UserVoucherPage = lazy(() => import('./pages/UserVoucherPage').then((m) => ({ default: m.UserVoucherPage })));
import { GameCoverArt } from './components/game-assets/GameArtAssets';
import { LanguageSelector } from './components/LanguageSelector';
import { TierBenefitsModal } from './components/TierBenefitsModal';
import { ProgramTermsModal } from './components/ProgramTermsModal';
import { FifoExpiringBucketsModal } from './components/FifoExpiringBucketsModal';
import { InviteFriendsModal } from './components/InviteFriendsModal';
import { WhereToUseModal } from './components/WhereToUseModal';
import { RewardWalletQrModal } from './components/RewardWalletQrModal';
import { UssdSimulatorModal } from './components/UssdSimulatorModal';
import { SegmentBannerRenderer } from './components/SegmentBannerRenderer';
import { InboxModal } from './components/InboxModal';
import { NotificationSettingsModal } from './components/NotificationSettingsModal';
import { AgentPortalModal } from './components/AgentPortalModal';
import { NotificationModal, NotificationType } from './components/NotificationModal';
import { SkeletonCard, SkeletonLine, EmptyState } from './components/common/StateBlocks';
import { generateQrCodeSvgDataUri } from './utils/qrCodeSvg';
import {
  LoyaltyApi,
  MemberProfile,
  MilestoneItem,
  LedgerItem,
  PartnerItem,
  ExpiringBucketsResponse,
  SegmentProfileResponse,
  getDefaultUserId,
  getTenantId,
} from './services/api';

export type AppTabType =
  | 'HOME'
  | 'GAMEHUB'
  | 'WHEEL'
  | 'SCRATCH'
  | 'LEARNING'
  | 'FLAPPY'
  | 'GAME2048'
  | 'MEMORY'
  | 'BUBBLE'
  | 'FRUIT'
  | 'KNIFE'
  | 'BLOCK'
  | 'RUNNER'
  | 'WORDLE'
  | 'UNTANGLE'
  | 'JIGSAW'
  | 'WATERSORT'
  | 'STACKTOWER'
  | 'PIPECONNECT'
  | 'MERGEDROP'
  | 'WHACKAMOLE'
  | 'MINESWEEPER'
  | 'SUDOKU'
  | 'VOUCHERS';

export const App: React.FC = () => {
  const { t } = useTranslation();
  const [currentTab, setCurrentTab] = useState<AppTabType>('HOME');
  const [loadingHome, setLoadingHome] = useState<boolean>(true);
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [milestones, setMilestones] = useState<MilestoneItem[]>([]);
  const [selectedCampaignFilter, setSelectedCampaignFilter] = useState<string>('ALL');
  const [claimingMilestoneId, setClaimingMilestoneId] = useState<number | null>(null);
  const [ledgerItems, setLedgerItems] = useState<LedgerItem[]>([]);
  const [partners, setPartners] = useState<PartnerItem[]>([]);
  const [expiringBuckets, setExpiringBuckets] = useState<ExpiringBucketsResponse | null>(null);
  const [segmentProfile, setSegmentProfile] = useState<SegmentProfileResponse | null>(null);
  const [inboxUnreadCount, setInboxUnreadCount] = useState<number>(0);

  const userId = getDefaultUserId();
  const tenantId = getTenantId();

  // User balances hydrated exclusively from backend API (no fake defaults)
  const [userPoints, setUserPoints] = useState<number | null>(null);
  const [freeTurns, setFreeTurns] = useState<number | null>(null);
  const [perpetualTurns, setPerpetualTurns] = useState<number | null>(null);

  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [showTierModal, setShowTierModal] = useState<boolean>(false);
  const [showTermsModal, setShowTermsModal] = useState<boolean>(false);
  const [showFifoModal, setShowFifoModal] = useState<boolean>(false);
  const [showInviteModal, setShowInviteModal] = useState<boolean>(false);
  const [showWhereToUseModal, setShowWhereToUseModal] = useState<boolean>(false);
  const [showUssdModal, setShowUssdModal] = useState<boolean>(false);
  const [showInboxModal, setShowInboxModal] = useState<boolean>(false);
  const [showNotifSettingsModal, setShowNotifSettingsModal] = useState<boolean>(false);
  const [showAgentPortalModal, setShowAgentPortalModal] = useState<boolean>(false);
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
  const [qrToken, setQrToken] = useState<string>('');
  const [copiedToken, setCopiedToken] = useState<boolean>(false);
  const [showCheckinModal, setShowCheckinModal] = useState<boolean>(false);
  const [checkinStreak, setCheckinStreak] = useState<number>(0);
  const [hasCheckedInToday, setHasCheckedInToday] = useState<boolean>(false);
  const [soundMuted, setSoundMuted] = useState<boolean>(soundHaptics.isMuted());

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
      } else if (rawHash === 'SCRATCH' || rawHash === 'GAMEHUB/SCRATCH') {
        setCurrentTab('SCRATCH');
      } else if (rawHash === 'LEARNING' || rawHash === 'GAMEHUB/LEARNING') {
        setCurrentTab('LEARNING');
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
      } else if (rawHash === 'UNTANGLE' || rawHash === 'GAMEHUB/UNTANGLE') {
        setCurrentTab('UNTANGLE');
      } else if (rawHash === 'JIGSAW' || rawHash === 'GAMEHUB/JIGSAW') {
        setCurrentTab('JIGSAW');
      } else if (rawHash === 'WATERSORT' || rawHash === 'GAMEHUB/WATERSORT') {
        setCurrentTab('WATERSORT');
      } else if (rawHash === 'STACKTOWER' || rawHash === 'GAMEHUB/STACKTOWER') {
        setCurrentTab('STACKTOWER');
      } else if (rawHash === 'PIPECONNECT' || rawHash === 'GAMEHUB/PIPECONNECT') {
        setCurrentTab('PIPECONNECT');
      } else if (rawHash === 'MERGEDROP' || rawHash === 'GAMEHUB/MERGEDROP') {
        setCurrentTab('MERGEDROP');
      } else if (rawHash === 'WHACKAMOLE' || rawHash === 'GAMEHUB/WHACKAMOLE') {
        setCurrentTab('WHACKAMOLE');
      } else if (rawHash === 'MINESWEEPER' || rawHash === 'GAMEHUB/MINESWEEPER') {
        setCurrentTab('MINESWEEPER');
      } else if (rawHash === 'SUDOKU' || rawHash === 'GAMEHUB/SUDOKU') {
        setCurrentTab('SUDOKU');
        setCurrentTab('WHACKAMOLE');
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

  const refreshEmbeddedQrToken = useCallback(async () => {
    try {
      const res = await LoyaltyApi.generateRewardQrToken(userId);
      setQrToken(res.qrToken);
      setQrCountdown(res.expiresInSeconds && res.expiresInSeconds > 0 ? res.expiresInSeconds : 60);
    } catch {
      setQrToken('');
    }
  }, [userId]);

  const loadData = useCallback(async () => {
    setLoadingHome(true);
    try {
      const [
        profileData,
        milestoneData,
        ledgerData,
        partnerData,
        bucketsData,
        segmentData,
        inboxData,
      ] = await Promise.all([
        LoyaltyApi.getProfile(userId).catch(() => null),
        LoyaltyApi.getMilestones(userId).catch(() => ({ campaigns: [], milestones: [] })),
        LoyaltyApi.getPointLedger(userId, 0, 5).catch(() => ({ items: [], totalElements: 0 })),
        LoyaltyApi.getPartners().catch(() => []),
        LoyaltyApi.getExpiringBuckets(userId).catch(() => null),
        LoyaltyApi.getSegmentProfile(userId).catch(() => null),
        LoyaltyApi.getInboxMessages(userId).catch(() => null),
      ]);

      if (profileData) {
        setProfile(profileData);
        setUserPoints(profileData.currentPoints ?? 0);
        setFreeTurns(profileData.freeDailyTurns ?? profileData.tier?.freeDailyTurns ?? 0);
        setPerpetualTurns(profileData.perpetualTurns ?? 0);
        setCheckinStreak(profileData.checkinStreakDays ?? 0);
        setHasCheckedInToday(Boolean(profileData.hasCheckedInToday));
      } else {
        setUserPoints(0);
        setFreeTurns(0);
        setPerpetualTurns(0);
      }
      setMilestones(milestoneData?.milestones || []);
      setLedgerItems(ledgerData?.items || []);
      setPartners(partnerData || []);
      setExpiringBuckets(bucketsData);
      setSegmentProfile(segmentData);
      if (inboxData) {
        setInboxUnreadCount(inboxData.unreadCount);
      }
    } catch (e) {
      console.error('[LoyaltyWebview] Failed to load API data:', e);
    } finally {
      setLoadingHome(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadData();
    void refreshEmbeddedQrToken();
  }, [loadData, refreshEmbeddedQrToken]);

  // Auto refresh dynamic QR code every 60s from backend
  useEffect(() => {
    if (!qrToken) return;
    const timer = window.setInterval(() => {
      setQrCountdown((prev) => {
        if (prev <= 1) {
          void refreshEmbeddedQrToken();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [qrToken, refreshEmbeddedQrToken]);

  const handleCopyQrToken = () => {
    if (!qrToken) return;
    navigator.clipboard.writeText(qrToken);
    setCopiedToken(true);
    window.setTimeout(() => setCopiedToken(false), 2000);
  };

  const handleMinigameReward = async (gameCode: string, earnedPoints: number, score: number = 0) => {
    try {
      const res = await LoyaltyApi.submitGameResult(
        gameCode,
        score > 0 ? score : earnedPoints,
        userId,
        undefined,
        JSON.stringify({ pointsAwarded: earnedPoints, gameCode })
      );
      if (res?.newPointBalance !== undefined) {
        setUserPoints(res.newPointBalance);
      } else if (res?.pointsAwarded !== undefined) {
        setUserPoints((p) => (p ?? 0) + res.pointsAwarded);
      } else {
        setUserPoints((p) => (p ?? 0) + earnedPoints);
      }
      void LoyaltyApi.getProfile(userId).then((p) => {
        if (p) setProfile(p);
      });
      void LoyaltyApi.getPointLedger(userId, 0, 5).then((l) => {
        if (l?.items) setLedgerItems(l.items);
      });
    } catch (e) {
      console.warn('[handleMinigameReward] Failed to record reward:', e);
    }
  };

  const handleClaimMission = async (milestone: MilestoneItem) => {
    if (claimingMilestoneId !== null) return;
    setClaimingMilestoneId(milestone.id);
    soundHaptics.playClick();
    try {
      const res = await LoyaltyApi.claimMission(milestone.id, userId);
      setUserPoints(res.newPointBalance);
      setMilestones((prev) =>
        prev.map((m) =>
          m.id === milestone.id
            ? { ...m, status: (res.status as MilestoneItem['status']) || 'CLAIMED' }
            : m
        )
      );
      soundHaptics.playVictoryFanfare();
      setNotifyModal({
        isOpen: true,
        type: 'success',
        title: t('missions.claim_success_title'),
        message: t('missions.claim_success_msg', { points: res.pointsAwarded.toLocaleString() }),
        badge: `+${res.pointsAwarded.toLocaleString()} ${t('common.points_unit')}`,
      });
      void LoyaltyApi.getPointLedger(userId, 0, 5).then((l) => {
        if (l?.items) setLedgerItems(l.items);
      });
    } catch (err) {
      setNotifyModal({
        isOpen: true,
        type: 'error',
        title: t('missions.claim_error_title'),
        message: err instanceof Error ? err.message : t('missions.claim_error_msg'),
      });
    } finally {
      setClaimingMilestoneId(null);
    }
  };

  const points = userPoints ?? 0;
  const tierName = profile?.tier?.name || (loadingHome ? '...' : t('hero.current_tier'));
  const tierMultiplier = profile?.tier?.pointMultiplier ? `×${profile.tier.pointMultiplier}` : '—';
  const currentTierPoints = profile?.nextTierProgress?.currentTierPoints ?? profile?.tierPoints ?? 0;
  const nextTierPoints = profile?.nextTierProgress?.requiredPoints ?? 0;
  const progressPercent =
    profile?.nextTierProgress?.progressPercentage ??
    (nextTierPoints > 0 ? Math.min(100, Math.round((currentTierPoints / nextTierPoints) * 100)) : 0);
  const pointsNeeded =
    profile?.nextTierProgress?.pointsNeeded ?? Math.max(0, nextTierPoints - currentTierPoints);

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
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${currentTab === 'HOME'
                    ? 'bg-white text-slate-950 shadow-sm font-extrabold'
                    : 'text-slate-600 hover:text-slate-950'
                  }`}
              >
                <Home className="w-3.5 h-3.5" />
                <span>{t('nav.home')}</span>
              </button>

              <button
                onClick={() => navigateToTab('GAMEHUB')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 relative ${currentTab !== 'HOME' && currentTab !== 'VOUCHERS'
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
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${currentTab === 'VOUCHERS'
                    ? 'bg-white text-slate-950 shadow-sm font-extrabold'
                    : 'text-slate-600 hover:text-slate-950'
                  }`}
              >
                <Ticket className="w-3.5 h-3.5 text-indigo-600" />
                <span>{t('nav.vouchers')}</span>
              </button>
            </nav>

            {/* Right Action: Points Badge, Inbox, Settings, Language Dropdown & Close */}
            <div className="flex items-center space-x-1.5 sm:space-x-2.5">
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
                  <span className="font-mono font-bold text-amber-900 text-xs">
                    {userPoints === null ? '—' : userPoints.toLocaleString()}
                  </span>
                  <span className="text-[9px] text-amber-700 font-semibold">{tierName}</span>
                </div>
              </div>

              {/* Inbox Button (CN-02) */}
              <button
                type="button"
                onClick={() => setShowInboxModal(true)}
                className="relative p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-95 transition text-slate-600 hover:text-slate-900 border border-slate-200"
                title={t('inbox.title')}
              >
                <Bell className="w-4 h-4" />
                {inboxUnreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-mono font-bold flex items-center justify-center">
                    {inboxUnreadCount}
                  </span>
                )}
              </button>

              {/* Notification & Language Settings Button (CN-04) */}
              <button
                type="button"
                onClick={() => setShowNotifSettingsModal(true)}
                className="hidden sm:flex p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-95 transition text-slate-600 hover:text-slate-900 border border-slate-200"
                title={t('notifSettings.title')}
              >
                <Settings className="w-4 h-4" />
              </button>

              {/* Sound Mute Toggle */}
              <button
                onClick={() => {
                  const next = soundHaptics.toggleMute();
                  setSoundMuted(next);
                }}
                className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-95 transition text-slate-600 hover:text-slate-900 border border-slate-200"
                title={soundMuted ? t('common.unmute') : t('common.mute')}
              >
                {soundMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-emerald-600" />}
              </button>

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
        <Suspense fallback={<div className="min-h-[40vh] flex items-center justify-center"><div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>}>
          {/* TAB: CỔNG GAME (GAMEHUB) */}
          {currentTab === 'GAMEHUB' && (
            <GameHubPage
              onBack={() => navigateToTab('HOME')}
              onSelectGame={(gameId) => navigateToTab(gameId)}
              freeTurns={freeTurns ?? 0}
              perpetualTurns={perpetualTurns ?? 0}
              points={points}
              streakDays={checkinStreak}
              onUpdateTurns={(free, perp) => {
                setFreeTurns(free);
                setPerpetualTurns(perp);
              }}
            />
          )}

          {/* SUBGAME: VÒNG QUAY TRI ÂN */}
          {currentTab === 'WHEEL' && (
            <LuckyWheelPage
              onBack={() => {
                void loadData();
                navigateToTab('GAMEHUB');
              }}
              userPoints={points}
              freeTurns={freeTurns ?? 0}
              onClaimReward={(earnedPoints, newBalance) => {
                if (newBalance !== undefined) {
                  setUserPoints(newBalance);
                } else {
                  setUserPoints((p) => (p ?? 0) + earnedPoints);
                }
                void LoyaltyApi.getProfile(userId).then((p) => {
                  if (p) setProfile(p);
                });
                void LoyaltyApi.getPointLedger(userId, 0, 5).then((l) => {
                  if (l?.items) setLedgerItems(l.items);
                });
              }}
              onUpdateTurns={(remainingTurns) => {
                setFreeTurns(remainingTurns);
              }}
            />
          )}

          {/* SUBGAME: THẺ CÀO MAY MẮN (GM-02) */}
          {currentTab === 'SCRATCH' && (
            <LuckyScratchCardGame
              onBack={() => {
                void loadData();
                navigateToTab('GAMEHUB');
              }}
              externalUserId={userId}
              availableTurns={(freeTurns ?? 0) + (perpetualTurns ?? 0)}
              onClaimReward={(earnedPoints, newBalance) => {
                if (newBalance !== undefined) {
                  setUserPoints(newBalance);
                } else {
                  setUserPoints((p) => (p ?? 0) + earnedPoints);
                }
                void LoyaltyApi.getProfile(userId).then((p) => {
                  if (p) setProfile(p);
                });
              }}
            />
          )}

          {/* SUBGAME: HỌC TẬP & TRẮC NGHIỆM (LEARNING & QUIZ) */}
          {currentTab === 'LEARNING' && (
            <LearningQuizPage
              onBack={() => {
                void loadData();
                navigateToTab('GAMEHUB');
              }}
              externalUserId={userId}
              onPointsUpdated={(earnedPoints, newBalance) => {
                if (newBalance !== undefined) {
                  setUserPoints(newBalance);
                } else {
                  setUserPoints((p) => (p ?? 0) + earnedPoints);
                }
              }}
            />
          )}

          {/* SUBGAME 1: FLAPPY NATCOM */}
          {currentTab === 'FLAPPY' && (
            <FlappyNatcomGame
              onBack={() => {
                loadData();
                navigateToTab('GAMEHUB');
              }}
              onClaimReward={(earnedPoints) => handleMinigameReward('FLAPPY_NATCOM', earnedPoints)}
            />
          )}

          {/* SUBGAME 2: 2048 NATCASH */}
          {currentTab === 'GAME2048' && (
            <Game2048Page
              onBack={() => {
                loadData();
                navigateToTab('GAMEHUB');
              }}
              onClaimReward={(earnedPoints) => handleMinigameReward('GAME_2048', earnedPoints)}
            />
          )}

          {/* SUBGAME 3: LẬT THẺ TÌM CẶP */}
          {currentTab === 'MEMORY' && (
            <MemoryMatchGame
              onBack={() => {
                loadData();
                navigateToTab('GAMEHUB');
              }}
              onClaimReward={(earnedPoints) => handleMinigameReward('MEMORY_MATCH', earnedPoints)}
            />
          )}

          {/* SUBGAME 4: BẮN BÓNG KANAVAL */}
          {currentTab === 'BUBBLE' && (
            <BubbleShooterGame
              onBack={() => {
                loadData();
                navigateToTab('GAMEHUB');
              }}
              onClaimReward={(earnedPoints) => handleMinigameReward('BUBBLE_SHOOTER', earnedPoints)}
            />
          )}

          {/* SUBGAME 5: CHÉM HOA QUẢ CARIBE */}
          {currentTab === 'FRUIT' && (
            <FruitSliceGame
              onBack={() => {
                loadData();
                navigateToTab('GAMEHUB');
              }}
              onClaimReward={(earnedPoints) => handleMinigameReward('FRUIT_SLICE', earnedPoints)}
            />
          )}

          {/* SUBGAME 6: PHI DAO VÒNG GỖ */}
          {currentTab === 'KNIFE' && (
            <KnifeHitGame
              onBack={() => {
                loadData();
                navigateToTab('GAMEHUB');
              }}
              onClaimReward={(earnedPoints) => handleMinigameReward('KNIFE_HIT', earnedPoints)}
            />
          )}

          {/* SUBGAME 7: XẾP GẠCH KIM CƯƠNG */}
          {currentTab === 'BLOCK' && (
            <BlockPuzzleGame
              onBack={() => {
                loadData();
                navigateToTab('GAMEHUB');
              }}
              onClaimReward={(earnedPoints) => handleMinigameReward('BLOCK_PUZZLE', earnedPoints)}
            />
          )}

          {/* SUBGAME 8: ĐƯỜNG ĐUA SIÊU TỐC */}
          {currentTab === 'RUNNER' && (
            <EndlessRunnerGame
              onBack={() => {
                loadData();
                navigateToTab('GAMEHUB');
              }}
              onClaimReward={(earnedPoints) => handleMinigameReward('ENDLESS_RUNNER', earnedPoints)}
            />
          )}

          {/* SUBGAME 9: ĐOÁN CHỮ MAY MẮN */}
          {currentTab === 'WORDLE' && (
            <WordleGame
              onBack={() => {
                loadData();
                navigateToTab('GAMEHUB');
              }}
              onClaimReward={(earnedPoints) => handleMinigameReward('WORDLE_GAME', earnedPoints)}
            />
          )}

          {/* SUBGAME 11: GỠ RỐI DÂY THỪNG 3D */}
          {currentTab === 'UNTANGLE' && (
            <UntangleRopeGame
              onBack={() => {
                loadData();
                navigateToTab('GAMEHUB');
              }}
              onClaimReward={(earnedPoints) => handleMinigameReward('UNTANGLE_ROPE', earnedPoints)}
            />
          )}

          {/* SUBGAME 13: GHÉP HÌNH JIGSAW PUZZLE */}
          {currentTab === 'JIGSAW' && (
            <JigsawPuzzleGame
              onBack={() => {
                loadData();
                navigateToTab('GAMEHUB');
              }}
              onClaimReward={(earnedPoints) => handleMinigameReward('JIGSAW_PUZZLE', earnedPoints)}
            />
          )}

          {/* SUBGAME 14: RÓT NƯỚC PHÂN MÀU */}
          {currentTab === 'WATERSORT' && (
            <WaterSortGame
              onBack={() => {
                loadData();
                navigateToTab('GAMEHUB');
              }}
              onClaimReward={(earnedPoints) => handleMinigameReward('WATER_SORT', earnedPoints)}
            />
          )}

          {/* SUBGAME 15: XÂY THÁP CHỒNG GẠCH */}
          {currentTab === 'STACKTOWER' && (
            <StackTowerGame
              onBack={() => {
                loadData();
                navigateToTab('GAMEHUB');
              }}
              onClaimReward={(earnedPoints) => handleMinigameReward('STACK_TOWER', earnedPoints)}
            />
          )}

          {/* SUBGAME 16: NỐI ỐNG NƯỚC */}
          {currentTab === 'PIPECONNECT' && (
            <PipeConnectGame
              onBack={() => {
                loadData();
                navigateToTab('GAMEHUB');
              }}
              onClaimReward={(earnedPoints) => handleMinigameReward('PIPE_CONNECT', earnedPoints)}
            />
          )}

          {/* SUBGAME 17: HỢP NHẤT TRÁI CÂY */}
          {currentTab === 'MERGEDROP' && (
            <MergeDropGame
              onBack={() => {
                loadData();
                navigateToTab('GAMEHUB');
              }}
              onClaimReward={(earnedPoints) => handleMinigameReward('MERGE_DROP', earnedPoints)}
            />
          )}

          {/* SUBGAME 18: ĐẬP CHUỘT NHẶT XU */}
          {currentTab === 'WHACKAMOLE' && (
            <WhackAMoleGame
              onBack={() => {
                loadData();
                navigateToTab('GAMEHUB');
              }}
              onClaimReward={(earnedPoints) => handleMinigameReward('WHACK_A_MOLE', earnedPoints)}
            />
          )}

          {/* SUBGAME 19: DÒ MÌN CHIẾN THUẬT */}
          {currentTab === 'MINESWEEPER' && (
            <MinesweeperGame
              onBack={() => {
                loadData();
                navigateToTab('GAMEHUB');
              }}
              onClaimReward={(earnedPoints) => handleMinigameReward('MINESWEEPER', earnedPoints)}
            />
          )}

          {/* SUBGAME 20: SUDOKU TRÍ TUỆ */}
          {currentTab === 'SUDOKU' && (
            <SudokuGame
              onBack={() => {
                loadData();
                navigateToTab('GAMEHUB');
              }}
              onClaimReward={(earnedPoints) => handleMinigameReward('SUDOKU', earnedPoints)}
            />
          )}

          {/* TAB: KHO ƯU ĐÃI & ĐỔI THƯỞNG */}
          {currentTab === 'VOUCHERS' && (
            <UserVoucherPage
              onBack={() => {
                void loadData();
                navigateToTab('HOME');
              }}
              userPoints={userPoints}
              onDeductPoints={(pts) => {
                setUserPoints((p) => Math.max(0, (p ?? 0) - pts));
              }}
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

              {/* ── NC-HM-01: NATCASH ENTRY TOUCHPOINT & QUICK ECOSYSTEM BAR ── */}
              <div className="bg-white rounded-3xl border border-slate-200/90 p-3.5 sm:p-4 shadow-xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                      NC
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{t('home.nc_entry_title')}</p>
                      <p className="text-[11px] text-slate-500">
                        {t('home.nc_entry_subtitle', {
                          coins: userPoints === null ? '—' : userPoints.toLocaleString(),
                          tierPts: currentTierPoints.toLocaleString(),
                        })}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowTermsModal(true)}
                    className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold inline-flex items-center gap-1"
                  >
                    <FileText className="w-3 h-3" />
                    <span>{t('terms.open_btn')}</span>
                  </button>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {[
                    {
                      key: 'QR_PAY',
                      label: t('home.quick_qr_pay'),
                      icon: QrCode,
                      color: 'text-amber-600 bg-amber-50 border-amber-200',
                      onClick: () => setShowQrModal(true),
                    },
                    {
                      key: 'WHERE',
                      label: t('home.quick_where_to_use'),
                      icon: MapPin,
                      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
                      onClick: () => setShowWhereToUseModal(true),
                    },
                    {
                      key: 'INVITE',
                      label: t('home.quick_invite'),
                      icon: UserPlus,
                      color: 'text-sky-600 bg-sky-50 border-sky-200',
                      onClick: () => setShowInviteModal(true),
                    },
                    {
                      key: 'LEARNING',
                      label: t('home.quick_learning'),
                      icon: GraduationCap,
                      color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
                      onClick: () => navigateToTab('LEARNING'),
                    },
                    {
                      key: 'USSD',
                      label: t('home.quick_ussd'),
                      icon: Hash,
                      color: 'text-violet-600 bg-violet-50 border-violet-200',
                      onClick: () => setShowUssdModal(true),
                    },
                    {
                      key: 'AGENT',
                      label: t('home.quick_agent'),
                      icon: Briefcase,
                      color: 'text-slate-700 bg-slate-100 border-slate-200',
                      onClick: () => setShowAgentPortalModal(true),
                    },
                  ].map((act) => {
                    const Icon = act.icon;
                    return (
                      <button
                        key={act.key}
                        type="button"
                        onClick={() => {
                          soundHaptics.playClick();
                          act.onClick();
                        }}
                        className="flex flex-col items-center justify-center gap-1 p-2 rounded-2xl border border-slate-100 hover:border-slate-300 bg-slate-50/70 hover:bg-white transition active:scale-95"
                      >
                        <span className={`w-8 h-8 rounded-xl border flex items-center justify-center ${act.color}`}>
                          <Icon className="w-4 h-4" />
                        </span>
                        <span className="text-[10px] font-semibold text-slate-700 text-center leading-tight line-clamp-1">
                          {act.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── CN-01: PERSONALIZED SEGMENT BANNER ── */}
              <SegmentBannerRenderer
                segment={segmentProfile}
                loading={loadingHome && !segmentProfile}
                onAction={(actionKey) => {
                  if (actionKey === 'VOUCHERS') navigateToTab('VOUCHERS');
                  else if (actionKey === 'WHERE_TO_USE') setShowWhereToUseModal(true);
                  else if (actionKey === 'GAMEHUB') navigateToTab('GAMEHUB');
                  else if (actionKey === 'INVITE') setShowInviteModal(true);
                  else navigateToTab('GAMEHUB');
                }}
              />

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

                    {/* Middle: Progress Bar (Tier Qualifying Points vs Upgrade Threshold) */}
                    <div className="space-y-1.5 my-3 sm:my-5 relative z-10 bg-black/15 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-white/15">
                      <div className="flex justify-between text-[11px] sm:text-xs text-amber-100 font-medium">
                        <span>{t('hero.next_tier_progress')}</span>
                        <span className="font-bold text-white font-mono">
                          {nextTierPoints > 0
                            ? `${currentTierPoints.toLocaleString()} / ${nextTierPoints.toLocaleString()} ${t('hero.tier_points_unit')}`
                            : `${currentTierPoints.toLocaleString()} ${t('hero.tier_points_unit')}`}
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

                    {/* Bottom: Natcash Coin Balance & Fast Actions */}
                    <div className="pt-3 border-t border-white/20 flex flex-col sm:flex-row sm:items-end justify-between gap-3 relative z-10">
                      <div>
                        <div className="text-[10px] sm:text-xs text-amber-100 font-medium">{t('hero.points_balance')}</div>
                        {loadingHome && userPoints === null ? (
                          <SkeletonLine className="w-28 h-7" />
                        ) : (
                          <div className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-baseline gap-1 font-mono">
                            {points.toLocaleString()}
                            <span className="text-xs sm:text-sm font-normal opacity-90 font-sans">{t('nav.points_unit')}</span>
                          </div>
                        )}
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

                  {/* DT-01: Smart Point Expiration Warning Chip (Real FIFO Buckets) */}
                  {expiringBuckets && expiringBuckets.totalExpiringPoints > 0 && (
                    <div
                      onClick={() => {
                        soundHaptics.playClick();
                        setShowFifoModal(true);
                      }}
                      className="bg-gradient-to-r from-amber-50 to-orange-50/80 hover:from-amber-100 hover:to-orange-100 border border-amber-200/90 rounded-2xl p-3 flex items-center justify-between cursor-pointer transition active:scale-98 shadow-xs"
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-900 flex items-center justify-center font-bold text-sm shrink-0">
                          ⏳
                        </div>
                        <div className="text-xs min-w-0">
                          <span className="font-bold text-amber-950 block truncate">
                            {t('home.points_expiration_warning', {
                              count: expiringBuckets.totalExpiringPoints,
                              date: expiringBuckets.nearestExpiryDate
                                ? new Date(expiringBuckets.nearestExpiryDate).toLocaleDateString()
                                : '—',
                            })}
                          </span>
                          <p className="text-[11px] text-amber-800 truncate">{t('home.points_expiration_hint')}</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-amber-900 bg-amber-200/80 hover:bg-amber-300 px-2.5 py-1 rounded-xl transition shrink-0">
                        {t('fifo.view_batches_btn')}
                      </span>
                    </div>
                  )}
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
                      {qrToken ? (
                        <>
                          <div className="bg-white p-2 rounded-2xl border-2 border-slate-900 shadow-md inline-block">
                            <img
                              src={generateQrCodeSvgDataUri(qrToken, 136)}
                              alt={t('qrModal.qr_alt')}
                              className="w-28 h-28 sm:w-36 sm:h-36 block"
                            />
                          </div>
                          <div className="mt-2.5 flex items-center space-x-1.5 max-w-full">
                            <span className="text-[11px] font-mono font-bold text-slate-800 bg-white px-2.5 py-0.5 rounded border border-slate-300 truncate max-w-[180px]">
                              {qrToken}
                            </span>
                            <button
                              onClick={handleCopyQrToken}
                              className="p-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 transition shrink-0"
                              title={t('wallet.copy_hint')}
                            >
                              {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="py-6 space-y-2">
                          <QrCode className="w-10 h-10 text-slate-300 mx-auto" />
                          <p className="text-[11px] text-slate-500">{t('qrModal.tap_to_generate')}</p>
                          <button
                            type="button"
                            onClick={() => void refreshEmbeddedQrToken()}
                            className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-[11px] font-semibold"
                          >
                            {t('qrModal.refresh_now')}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Fast Action Buttons Grid */}
                    <div className="grid grid-cols-2 gap-2.5 pt-1">
                      <button
                        onClick={() => {
                          soundHaptics.playClick();
                          setShowCheckinModal(true);
                        }}
                        className="py-2.5 px-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition"
                      >
                        <Gift className="w-4 h-4" />
                        <span>{t('wallet.btn_checkin')}</span>
                      </button>

                      <button
                        onClick={() => {
                          soundHaptics.playClick();
                          navigateToTab('VOUCHERS');
                        }}
                        className="py-2.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center justify-center space-x-1 border border-slate-200 active:scale-95 transition"
                      >
                        <Ticket className="w-4 h-4 text-indigo-600" />
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

              {/* ── SECTION 3: TOÀN BỘ 15 TRÒ CHƠI & HỌC TẬP GAMEHUB ── */}
              <div className="space-y-3 sm:space-y-3.5">
                <div className="flex justify-between items-end">
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                      <Gamepad2 className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" /> {t('gamehub.title')}
                      <span className="text-[10px] font-extrabold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                        {t('gamehub.games_count', { count: 15 })}
                      </span>
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

                {/* Toàn bộ 13 trò chơi (Mobile: 3 cột, Tablet: 4-5 cột, Desktop: 6-7 cột) */}
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-2.5 sm:gap-3.5">
                  {[
                    {
                      id: 'WHEEL',
                      name: t('gamehub.game1_name'),
                      categoryLabel: t('gamehub.cat_lucky'),
                      icon: '🎡',
                      bgGradient: 'bg-gradient-to-br from-amber-500 via-orange-500 to-yellow-500',
                      badge: 'HOT',
                      badgeBg: 'bg-red-600',
                      perk: (freeTurns ?? 0) > 0 ? `${freeTurns} Free` : '20 HTG',
                      action: () => navigateToTab('WHEEL'),
                    },
                    {
                      id: 'FLAPPY',
                      name: t('games.flappy.title'),
                      categoryLabel: t('gamehub.cat_skill'),
                      icon: '🕊️',
                      bgGradient: 'bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700',
                      badge: 'NEW',
                      badgeBg: 'bg-emerald-600',
                      perk: 'Data 4G',
                      action: () => navigateToTab('FLAPPY'),
                    },
                    {
                      id: 'GAME2048',
                      name: t('games.game2048.title'),
                      categoryLabel: t('gamehub.cat_puzzle'),
                      icon: '🔢',
                      bgGradient: 'bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-600',
                      badge: '2048 HTG',
                      badgeBg: 'bg-amber-600',
                      perk: t('gamehub.perk_merge'),
                      action: () => navigateToTab('GAME2048'),
                    },
                    {
                      id: 'MEMORY',
                      name: t('games.memory.title'),
                      categoryLabel: t('gamehub.cat_puzzle'),
                      icon: '🃏',
                      bgGradient: 'bg-gradient-to-br from-purple-600 via-indigo-600 to-pink-600',
                      badge: 'HOT',
                      badgeBg: 'bg-purple-600',
                      perk: 'Delimart',
                      action: () => navigateToTab('MEMORY'),
                    },
                    {
                      id: 'BUBBLE',
                      name: t('games.bubble.title'),
                      categoryLabel: t('gamehub.cat_casual'),
                      icon: '🔮',
                      bgGradient: 'bg-gradient-to-br from-pink-500 via-rose-600 to-amber-500',
                      badge: t('gamehub.badge_jackpot'),
                      badgeBg: 'bg-pink-600',
                      perk: 'Combo x5',
                      action: () => navigateToTab('BUBBLE'),
                    },
                    {
                      id: 'FRUIT',
                      name: t('games.fruit.title'),
                      categoryLabel: t('gamehub.cat_skill'),
                      icon: '🥭',
                      bgGradient: 'bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600',
                      badge: t('gamehub.badge_slash'),
                      badgeBg: 'bg-emerald-600',
                      perk: 'Caribe',
                      action: () => navigateToTab('FRUIT'),
                    },
                    {
                      id: 'KNIFE',
                      name: t('games.knife.title'),
                      categoryLabel: t('gamehub.cat_skill'),
                      icon: '🗡️',
                      bgGradient: 'bg-gradient-to-br from-amber-600 via-orange-600 to-red-700',
                      badge: t('gamehub.badge_red_envelope'),
                      badgeBg: 'bg-red-600',
                      perk: t('gamehub.perk_fortune'),
                      action: () => navigateToTab('KNIFE'),
                    },
                    {
                      id: 'BLOCK',
                      name: t('games.block.title'),
                      categoryLabel: t('gamehub.cat_puzzle'),
                      icon: '💎',
                      bgGradient: 'bg-gradient-to-br from-blue-600 via-cyan-600 to-indigo-700',
                      badge: t('gamehub.badge_8x8'),
                      badgeBg: 'bg-cyan-600',
                      perk: t('gamehub.perk_diamond'),
                      action: () => navigateToTab('BLOCK'),
                    },
                    {
                      id: 'RUNNER',
                      name: t('games.runner.title'),
                      categoryLabel: t('gamehub.cat_skill'),
                      icon: '🏃',
                      bgGradient: 'bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500',
                      badge: 'TAP-TAP',
                      badgeBg: 'bg-orange-600',
                      perk: t('gamehub.perk_speed'),
                      action: () => navigateToTab('RUNNER'),
                    },
                    {
                      id: 'WORDLE',
                      name: t('games.wordle.title'),
                      categoryLabel: t('gamehub.cat_puzzle'),
                      icon: '🔤',
                      bgGradient: 'bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700',
                      badge: t('gamehub.badge_5_letters'),
                      badgeBg: 'bg-violet-600',
                      perk: t('gamehub.perk_wordle'),
                      action: () => navigateToTab('WORDLE'),
                    },
                    {
                      id: 'UNTANGLE',
                      name: t('games.untangle.title'),
                      categoryLabel: t('gamehub.cat_puzzle'),
                      icon: '🪢',
                      bgGradient: 'bg-gradient-to-br from-purple-700 via-indigo-800 to-pink-700',
                      badge: 'IQ PRO',
                      badgeBg: 'bg-purple-600',
                      perk: 'Laser',
                      action: () => navigateToTab('UNTANGLE'),
                    },
                    {
                      id: 'JIGSAW',
                      name: t('games.jigsaw.title', 'Ghép Hình: Jigsaw'),
                      categoryLabel: t('gamehub.cat_puzzle', 'Trí Tuệ'),
                      icon: '🧩',
                      bgGradient: 'bg-gradient-to-br from-indigo-700 via-purple-800 to-pink-900',
                      badge: 'HOT',
                      badgeBg: 'bg-emerald-500',
                      perk: t('gamehub.perk_jigsaw', 'Ghép Tranh Nhận Xu'),
                      action: () => navigateToTab('JIGSAW'),
                    },
                    {
                      id: 'WATERSORT',
                      name: t('games.watersort.title'),
                      categoryLabel: t('gamehub.cat_puzzle'),
                      icon: '🧪',
                      bgGradient: 'bg-gradient-to-br from-cyan-600 via-sky-700 to-blue-900',
                      badge: 'HOT',
                      badgeBg: 'bg-cyan-500',
                      perk: t('gamehub.perk_watersort'),
                      action: () => navigateToTab('WATERSORT'),
                    },
                    {
                      id: 'STACKTOWER',
                      name: t('games.stacktower.title'),
                      categoryLabel: t('gamehub.cat_arcade'),
                      icon: '🏗️',
                      bgGradient: 'bg-gradient-to-br from-indigo-700 via-purple-800 to-pink-800',
                      badge: '1-TAP',
                      badgeBg: 'bg-amber-500',
                      perk: t('gamehub.perk_stacktower'),
                      action: () => navigateToTab('STACKTOWER'),
                    },
                    {
                      id: 'PIPECONNECT',
                      name: t('games.pipeconnect.title'),
                      categoryLabel: t('gamehub.cat_puzzle'),
                      icon: '🔧',
                      bgGradient: 'bg-gradient-to-br from-slate-700 via-teal-800 to-cyan-900',
                      badge: 'LOGIC',
                      badgeBg: 'bg-teal-500',
                      perk: t('gamehub.perk_pipeconnect'),
                      action: () => navigateToTab('PIPECONNECT'),
                    },
                    {
                      id: 'MERGEDROP',
                      name: t('games.mergedrop.title'),
                      categoryLabel: t('gamehub.cat_puzzle'),
                      icon: '🍉',
                      bgGradient: 'bg-gradient-to-br from-emerald-600 via-green-700 to-teal-900',
                      badge: 'SUIKA',
                      badgeBg: 'bg-emerald-500',
                      perk: t('gamehub.perk_mergedrop'),
                      action: () => navigateToTab('MERGEDROP'),
                    },
                    {
                      id: 'WHACKAMOLE',
                      name: t('games.whackamole.title'),
                      categoryLabel: t('gamehub.cat_arcade'),
                      icon: '🔨',
                      bgGradient: 'bg-gradient-to-br from-amber-700 via-orange-800 to-yellow-900',
                      badge: 'FAST',
                      badgeBg: 'bg-orange-500',
                      perk: t('gamehub.perk_whackamole'),
                      action: () => navigateToTab('WHACKAMOLE'),
                    },
                    {
                      id: 'SCRATCH',
                      name: t('scratch.title'),
                      categoryLabel: t('gamehub.filter_lucky'),
                      icon: '🎫',
                      bgGradient: 'bg-gradient-to-br from-amber-500 via-orange-500 to-rose-600',
                      badge: 'NEW',
                      badgeBg: 'bg-amber-600',
                      perk: t('scratch.perk_badge'),
                      action: () => navigateToTab('SCRATCH'),
                    },
                    {
                      id: 'LEARNING',
                      name: t('learning.title'),
                      categoryLabel: t('gamehub.filter_learning'),
                      icon: '🎓',
                      bgGradient: 'bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-600',
                      badge: 'QUIZ',
                      badgeBg: 'bg-indigo-600',
                      perk: t('learning.perk_badge'),
                      action: () => navigateToTab('LEARNING'),
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

              {/* ── SECTION 4: MILESTONE MISSIONS (CAMPAIGN FILTER + CLAIM) ── */}
              <div className="space-y-3 sm:space-y-4">
                <div className="flex flex-wrap justify-between items-end gap-2">
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" /> {t('missions.title')}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-slate-500">{t('missions.subtitle')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowInviteModal(true)}
                      className="px-2.5 py-1 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 text-[11px] font-semibold inline-flex items-center gap-1"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>{t('referrals.invite_btn')}</span>
                    </button>
                    <button
                      onClick={() => navigateToTab('VOUCHERS')}
                      className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-0.5"
                    >
                      <span>{t('missions.view_rewards')}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Campaign Filter Pills */}
                {milestones.length > 0 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                    {['ALL', ...Array.from(new Set(milestones.map((m) => m.campaignName).filter(Boolean)))].map(
                      (camp) => {
                        const active = selectedCampaignFilter === camp;
                        return (
                          <button
                            key={camp}
                            type="button"
                            onClick={() => setSelectedCampaignFilter(camp)}
                            className={`px-3 py-1 rounded-xl text-[11px] font-semibold whitespace-nowrap border transition ${active
                                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                              }`}
                          >
                            {camp === 'ALL' ? t('missions.filter_all') : camp}
                          </button>
                        );
                      }
                    )}
                  </div>
                )}

                {loadingHome && milestones.length === 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                    <SkeletonCard rows={3} />
                    <SkeletonCard rows={3} />
                    <SkeletonCard rows={3} />
                  </div>
                ) : milestones.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-slate-200/80 p-4">
                    <EmptyState
                      icon={<CheckCircle2 className="w-6 h-6 text-slate-400" />}
                      title={t('missions.empty_title')}
                      description={t('missions.empty_desc')}
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                    {milestones
                      .filter(
                        (m) => selectedCampaignFilter === 'ALL' || m.campaignName === selectedCampaignFilter
                      )
                      .map((m) => {
                        const normalizedStatus = (m.status || '').toUpperCase();
                        const isClaimed = normalizedStatus === MilestoneStatus.CLAIMED;
                        const isClaimable =
                          !isClaimed &&
                          (normalizedStatus === MilestoneStatus.CLAIMABLE ||
                            normalizedStatus === MilestoneStatus.COMPLETED);
                        return (
                          <div
                            key={m.id}
                            className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
                                <Store className="w-4 h-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="font-semibold text-xs sm:text-sm text-slate-900 truncate">
                                  {m.campaignName}
                                </h4>
                                <p className="text-[11px] text-slate-500">
                                  {t('missions.target', { target: m.targetValue, points: m.rewardPoints })}
                                </p>
                              </div>
                            </div>

                            <div className="mt-3 pt-2 border-t border-slate-100 flex justify-between items-center gap-2">
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${isClaimed
                                    ? 'text-slate-600 bg-slate-100'
                                    : isClaimable
                                      ? 'text-emerald-700 bg-emerald-50'
                                      : 'text-amber-800 bg-amber-50'
                                  }`}
                              >
                                {isClaimed
                                  ? t('missions.claimed')
                                  : isClaimable
                                    ? t('missions.completed')
                                    : t('missions.in_progress')}
                              </span>

                              {isClaimable ? (
                                <button
                                  type="button"
                                  disabled={claimingMilestoneId === m.id}
                                  onClick={() => void handleClaimMission(m)}
                                  className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-[11px] font-bold active:scale-95 transition"
                                >
                                  {claimingMilestoneId === m.id
                                    ? t('common.processing')
                                    : t('missions.claim_btn')}
                                </button>
                              ) : (
                                <span className="text-xs font-mono font-bold text-amber-600">
                                  {t('missions.plus_points', { points: m.rewardPoints })}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* ── SECTION 5: POINT ACTIVITY & PARTNERS ── */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                {/* Left: Point History */}
                <div className="lg:col-span-7 bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3">
                  <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-1.5">
                      <History className="w-4 h-4 text-amber-600" /> {t('ledger.title')}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowFifoModal(true)}
                      className="text-[11px] font-semibold text-amber-700 hover:text-amber-800 underline"
                    >
                      {t('fifo.view_batches_btn')}
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {loadingHome && ledgerItems.length === 0 ? (
                      <div className="py-2">
                        <SkeletonCard rows={3} />
                      </div>
                    ) : ledgerItems.length === 0 ? (
                      <EmptyState
                        icon={<History className="w-5 h-5 text-slate-400" />}
                        title={t('ledger.empty_title')}
                        description={t('ledger.empty_desc')}
                      />
                    ) : (
                      ledgerItems.map((item) => (
                        <div key={item.id} className="py-2.5 flex items-center justify-between gap-2">
                          <div className="flex items-center space-x-2.5 min-w-0">
                            <div
                              className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${item.pointChange >= 0
                                  ? 'bg-emerald-50 text-emerald-600'
                                  : 'bg-rose-50 text-rose-600'
                                }`}
                            >
                              {item.pointChange >= 0 ? '+' : '-'}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-xs text-slate-800 truncate">
                                {item.description}
                              </p>
                              <p className="text-[10px] text-slate-400 font-mono truncate">
                                {t('ledger.ref_code', { code: item.referenceCode })}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`font-mono font-bold text-xs shrink-0 ${item.pointChange >= 0 ? 'text-emerald-600' : 'text-rose-600'
                              }`}
                          >
                            {item.pointChange >= 0 ? `+${item.pointChange}` : `${item.pointChange}`}{' '}
                            {t('nav.points_unit')}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Right: Partner Ecosystem */}
                <div className="lg:col-span-5 bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3">
                  <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-1.5">
                      <Store className="w-4 h-4 text-amber-600" /> {t('partners.title')}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowWhereToUseModal(true)}
                      className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-0.5"
                    >
                      <span>{t('whereToUse.see_all_btn')}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    {loadingHome && partners.length === 0 ? (
                      <SkeletonCard rows={3} />
                    ) : partners.length === 0 ? (
                      <EmptyState
                        icon={<Store className="w-5 h-5 text-slate-400" />}
                        title={t('partners.empty_title')}
                        description={t('partners.empty_desc')}
                      />
                    ) : (
                      partners.map((partner) => (
                        <div
                          key={partner.id}
                          className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center space-x-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                              {(partner.partnerCode || partner.partnerName || 'PT').slice(0, 3).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-xs text-slate-800 truncate">
                                {partner.partnerName}
                              </p>
                              <p className="text-[10px] text-slate-500 truncate">{partner.partnerCode}</p>
                            </div>
                          </div>
                          <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">
                            {partner.status || t('partners.connected')}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </Suspense>
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
                  className={`flex flex-col items-center justify-center py-1.5 px-3.5 rounded-2xl transition-all duration-200 active:scale-95 relative ${item.isActive
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

      {/* ── LM-17: REWARD WALLET 60S QR MODAL ── */}
      <RewardWalletQrModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        externalUserId={userId}
        availableCoins={userPoints}
        onOpenWhereToUse={() => setShowWhereToUseModal(true)}
        onOpenUssd={() => setShowUssdModal(true)}
      />

      {/* ── DAILY CHECKIN 7-DAY STREAK MODAL ── */}
      <DailyCheckinModal
        isOpen={showCheckinModal}
        onClose={() => setShowCheckinModal(false)}
        currentStreakDays={checkinStreak}
        hasCheckedInToday={hasCheckedInToday}
        onClaimReward={(pts, dayNum) => {
          void handleMinigameReward('DAILY_CHECKIN', pts, dayNum);
          setHasCheckedInToday(true);
          setCheckinStreak((prev) => (prev >= 7 ? 1 : prev + 1));
        }}
      />

      {/* ── HV-03: TIER PRIVILEGES MODAL ── */}
      <TierBenefitsModal
        isOpen={showTierModal}
        onClose={() => setShowTierModal(false)}
        currentTierCode={profile?.tier?.code || 'BRONZE'}
        natcashCoins={userPoints ?? 0}
        tierPoints={currentTierPoints}
        onOpenTerms={() => {
          setShowTierModal(false);
          setShowTermsModal(true);
        }}
      />

      {/* ── HV-01: PROGRAM TERMS MODAL ── */}
      <ProgramTermsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
      />

      {/* ── DT-01: FIFO EXPIRING BUCKETS MODAL ── */}
      <FifoExpiringBucketsModal
        isOpen={showFifoModal}
        onClose={() => setShowFifoModal(false)}
        externalUserId={userId}
      />

      {/* ── NV-06: INVITE FRIENDS & REFERRAL MODAL ── */}
      <InviteFriendsModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        externalUserId={userId}
      />

      {/* ── LM-04: WHERE TO USE PARTNERS MODAL ── */}
      <WhereToUseModal
        isOpen={showWhereToUseModal}
        onClose={() => setShowWhereToUseModal(false)}
        onOpenQrPay={() => setShowQrModal(true)}
      />

      {/* ── USSD *202# SIMULATOR MODAL ── */}
      <UssdSimulatorModal
        isOpen={showUssdModal}
        onClose={() => setShowUssdModal(false)}
        externalUserId={userId}
      />

      {/* ── CN-02: INBOX MODAL ── */}
      <InboxModal
        isOpen={showInboxModal}
        onClose={() => setShowInboxModal(false)}
        externalUserId={userId}
        onOpenSettings={() => setShowNotifSettingsModal(true)}
        onUnreadChange={(count) => setInboxUnreadCount(count)}
      />

      {/* ── CN-04: NOTIFICATION & LANGUAGE PREFERENCES MODAL ── */}
      <NotificationSettingsModal
        isOpen={showNotifSettingsModal}
        onClose={() => setShowNotifSettingsModal(false)}
        externalUserId={userId}
      />

      {/* ── AG-01 / AG-02: AGENT & SUPER AGENT PORTAL MODAL ── */}
      <AgentPortalModal
        isOpen={showAgentPortalModal}
        onClose={() => setShowAgentPortalModal(false)}
        externalUserId={userId}
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
