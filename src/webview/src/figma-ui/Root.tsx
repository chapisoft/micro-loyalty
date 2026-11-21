import React, { lazy, Suspense, useEffect } from 'react';
import { HashRouter, Route, Routes, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { SSOAuthProvider, useSSOAuth } from '../hooks/useSSOAuth';
import { Skeleton } from './ui';
import LoyaltyHome from './screens/LoyaltyHome';

const MemberTiers = lazy(() => import('./screens/MemberTiers'));
const ProgramTerms = lazy(() => import('./screens/MemberTiers').then((m) => ({ default: m.ProgramTerms })));
const CoinsHistory = lazy(() => import('./screens/CoinsHistory'));
const MissionsList = lazy(() => import('./screens/Missions').then((m) => ({ default: m.MissionsList })));
const MissionDetail = lazy(() => import('./screens/Missions').then((m) => ({ default: m.MissionDetail })));
const CheckIn = lazy(() => import('./screens/Missions').then((m) => ({ default: m.CheckIn })));
const InviteFriends = lazy(() => import('./screens/Invite').then((m) => ({ default: m.InviteFriends })));
const InvitedWelcome = lazy(() => import('./screens/Invite').then((m) => ({ default: m.InvitedWelcome })));
const RewardStore = lazy(() => import('./screens/Rewards').then((m) => ({ default: m.RewardStore })));
const RewardDetail = lazy(() => import('./screens/Rewards').then((m) => ({ default: m.RewardDetail })));
const RedeemDone = lazy(() => import('./screens/Rewards').then((m) => ({ default: m.RedeemDone })));
const MyVouchers = lazy(() => import('./screens/Rewards').then((m) => ({ default: m.MyVouchers })));
const MyVoucherDetail = lazy(() => import('./screens/Rewards').then((m) => ({ default: m.MyVoucherDetail })));
const ShowVoucher = lazy(() => import('./screens/Rewards').then((m) => ({ default: m.ShowVoucher })));
const GameHub = lazy(() => import('./screens/Games').then((m) => ({ default: m.GameHub })));
const Wheel = lazy(() => import('./screens/Games').then((m) => ({ default: m.Wheel })));
const ScratchCard = lazy(() => import('./screens/Games').then((m) => ({ default: m.ScratchCard })));
const GameResult = lazy(() => import('./screens/Games').then((m) => ({ default: m.GameResult })));
const GetPlays = lazy(() => import('./screens/Games').then((m) => ({ default: m.GetPlays })));
const LearningList = lazy(() => import('./screens/Games').then((m) => ({ default: m.LearningList })));
const LearningDetail = lazy(() => import('./screens/Games').then((m) => ({ default: m.LearningDetail })));
const Lesson = lazy(() => import('./screens/Games').then((m) => ({ default: m.Lesson })));
const PlayHistory = lazy(() => import('./screens/Games').then((m) => ({ default: m.PlayHistory })));
const PayAtCounter = lazy(() => import('./screens/UseCoins').then((m) => ({ default: m.PayAtCounter })));
const Inbox = lazy(() => import('./screens/Inbox').then((m) => ({ default: m.Inbox })));
const OfferDetail = lazy(() => import('./screens/Inbox').then((m) => ({ default: m.OfferDetail })));
const NotificationSettings = lazy(() => import('./screens/Inbox').then((m) => ({ default: m.NotificationSettings })));
const AgentHome = lazy(() => import('./screens/Agent').then((m) => ({ default: m.AgentHome })));
const AgentMissions = lazy(() => import('./screens/Agent').then((m) => ({ default: m.AgentMissions })));
const AgentMissionDetail = lazy(() => import('./screens/Agent').then((m) => ({ default: m.AgentMissionDetail })));
const AgentNetwork = lazy(() => import('./screens/Agent').then((m) => ({ default: m.AgentNetwork })));
const AgentVouchers = lazy(() => import('./screens/Agent').then((m) => ({ default: m.AgentVouchers })));
const AgentVoucherDetail = lazy(() => import('./screens/Agent').then((m) => ({ default: m.AgentVoucherDetail })));
const AgentMyVouchers = lazy(() => import('./screens/Agent').then((m) => ({ default: m.AgentMyVouchers })));
const AgentMyVoucherDetail = lazy(() => import('./screens/Agent').then((m) => ({ default: m.AgentMyVoucherDetail })));

const ScreenFallback = (
  <div className="min-h-screen bg-[#F5F5F5]">
    <div className="mx-auto flex w-full max-w-[430px] flex-col gap-3 p-4 pt-10">
      <Skeleton className="h-[177px]" />
      <Skeleton className="h-[96px]" />
      <Skeleton className="h-[120px]" />
    </div>
  </div>
);

// In-house mini-game players (routed with back navigation returning directly to /games)
const FlappyNatcomGame = lazy(() => import('../pages/games/FlappyNatcomGame').then((m) => ({ default: m.FlappyNatcomGame })));
const Game2048Page = lazy(() => import('../pages/games/Game2048Page').then((m) => ({ default: m.Game2048Page })));
const MemoryMatchGame = lazy(() => import('../pages/games/MemoryMatchGame').then((m) => ({ default: m.MemoryMatchGame })));
const BubbleShooterGame = lazy(() => import('../pages/games/BubbleShooterGame').then((m) => ({ default: m.BubbleShooterGame })));
const FruitSliceGame = lazy(() => import('../pages/games/FruitSliceGame').then((m) => ({ default: m.FruitSliceGame })));
const KnifeHitGame = lazy(() => import('../pages/games/KnifeHitGame').then((m) => ({ default: m.KnifeHitGame })));
const BlockPuzzleGame = lazy(() => import('../pages/games/BlockPuzzleGame').then((m) => ({ default: m.BlockPuzzleGame })));
const EndlessRunnerGame = lazy(() => import('../pages/games/EndlessRunnerGame').then((m) => ({ default: m.EndlessRunnerGame })));
const WordleGame = lazy(() => import('../pages/games/WordleGame').then((m) => ({ default: m.WordleGame })));
const UntangleRopeGame = lazy(() => import('../pages/games/UntangleRopeGame').then((m) => ({ default: m.UntangleRopeGame })));
const GoldMinerGame = lazy(() => import('../pages/games/GoldMinerGame').then((m) => ({ default: m.GoldMinerGame })));
const HelixJumpGame = lazy(() => import('../pages/games/HelixJumpGame').then((m) => ({ default: m.HelixJumpGame })));
const JigsawPuzzleGame = lazy(() => import('../pages/games/JigsawPuzzleGame').then((m) => ({ default: m.JigsawPuzzleGame })));
const WaterSortGame = lazy(() => import('../pages/games/WaterSortGame').then((m) => ({ default: m.WaterSortGame })));
const StackTowerGame = lazy(() => import('../pages/games/StackTowerGame').then((m) => ({ default: m.StackTowerGame })));
const PipeConnectGame = lazy(() => import('../pages/games/PipeConnectGame').then((m) => ({ default: m.PipeConnectGame })));
const MergeDropGame = lazy(() => import('../pages/games/MergeDropGame').then((m) => ({ default: m.MergeDropGame })));
const WhackAMoleGame = lazy(() => import('../pages/games/WhackAMoleGame').then((m) => ({ default: m.WhackAMoleGame })));
const MinesweeperGame = lazy(() => import('../pages/games/MinesweeperGame').then((m) => ({ default: m.MinesweeperGame })));
const SudokuGame = lazy(() => import('../pages/games/SudokuGame').then((m) => ({ default: m.SudokuGame })));

const GamePlayer: React.FC<{ Component: React.ComponentType<{ onBack: () => void }> }> = ({ Component }) => {
  const navigate = useNavigate();
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-white"><div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <Component onBack={() => navigate('/games')} />
    </Suspense>
  );
};

/**
 * Figma Customer Journey Screens ("App · Customer journeys").
 * Fully replaces legacy App.tsx layout so the new design renders consistently across all views.
 */
const AppRoutes: React.FC = () => {
  const { loading } = useSSOAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F5]">
        <div className="mx-auto flex w-full max-w-[430px] flex-col gap-3 p-4 pt-10">
          <Skeleton className="h-[177px]" />
          <Skeleton className="h-[96px]" />
          <Skeleton className="h-[120px]" />
        </div>
      </div>
    );
  }
  return (
    <Suspense fallback={ScreenFallback}>
      <Routes>
        {/* 1 · Entry & membership */}
        <Route path="/" element={<LoyaltyHome />} />
        <Route path="/tiers" element={<MemberTiers />} />
        <Route path="/terms" element={<ProgramTerms />} />
        <Route path="/coins" element={<CoinsHistory />} />
        <Route path="/coins/expiring" element={<CoinsHistory sheet />} />

        {/* 2 · Earn */}
        <Route path="/missions" element={<MissionsList />} />
        <Route path="/missions/:code" element={<MissionDetail />} />
        <Route path="/checkin" element={<CheckIn />} />
        <Route path="/invite" element={<InviteFriends />} />
        <Route path="/invited" element={<InvitedWelcome />} />

        {/* 3 · Vouchers: Store / My vouchers (Get voucher with coins, Collect free ones, Use by "How to use") */}
        <Route path="/rewards" element={<RewardStore />} />
        <Route path="/rewards/:id" element={<RewardDetail />} />
        <Route path="/rewards/:id/done" element={<RedeemDone />} />
        <Route path="/my-vouchers" element={<MyVouchers />} />
        <Route path="/my-vouchers/:id" element={<MyVoucherDetail />} />
        <Route path="/my-vouchers/:id/code" element={<ShowVoucher />} />

        {/* 4 · Play & GameHub */}
        <Route path="/games" element={<GameHub />} />
        <Route path="/games/wheel" element={<Wheel />} />
        <Route path="/games/scratch" element={<ScratchCard />} />
        <Route path="/games/result" element={<GameResult />} />
        <Route path="/games/get-plays" element={<GetPlays />} />
        <Route path="/games/history" element={<PlayHistory />} />
        <Route path="/learning" element={<LearningList />} />
        <Route path="/learning/:id" element={<LearningDetail />} />
        <Route path="/learning/:id/lesson" element={<Lesson />} />

        {/* In-house mini-game players */}
        <Route path="/flappy" element={<GamePlayer Component={FlappyNatcomGame} />} />
        <Route path="/game2048" element={<GamePlayer Component={Game2048Page} />} />
        <Route path="/memory" element={<GamePlayer Component={MemoryMatchGame} />} />
        <Route path="/bubble" element={<GamePlayer Component={BubbleShooterGame} />} />
        <Route path="/fruit" element={<GamePlayer Component={FruitSliceGame} />} />
        <Route path="/knife" element={<GamePlayer Component={KnifeHitGame} />} />
        <Route path="/block" element={<GamePlayer Component={BlockPuzzleGame} />} />
        <Route path="/runner" element={<GamePlayer Component={EndlessRunnerGame} />} />
        <Route path="/wordle" element={<GamePlayer Component={WordleGame} />} />
        <Route path="/untangle" element={<GamePlayer Component={UntangleRopeGame} />} />
        <Route path="/goldminer" element={<GamePlayer Component={GoldMinerGame} />} />
        <Route path="/helix" element={<GamePlayer Component={HelixJumpGame} />} />
        <Route path="/jigsaw" element={<GamePlayer Component={JigsawPuzzleGame} />} />
        <Route path="/watersort" element={<GamePlayer Component={WaterSortGame} />} />
        <Route path="/stacktower" element={<GamePlayer Component={StackTowerGame} />} />
        <Route path="/pipeconnect" element={<GamePlayer Component={PipeConnectGame} />} />
        <Route path="/mergedrop" element={<GamePlayer Component={MergeDropGame} />} />
        <Route path="/whackamole" element={<GamePlayer Component={WhackAMoleGame} />} />
        <Route path="/minesweeper" element={<GamePlayer Component={MinesweeperGame} />} />
        <Route path="/sudoku" element={<GamePlayer Component={SudokuGame} />} />

        {/* 5 · Pay at counter (LM-17): the customer shows the code, the cashier scans it. LM-04 "Where to use" was removed (17/11). */}
        <Route path="/pay-at-counter" element={<PayAtCounter />} />
        <Route path="/use-coins" element={<Navigate to="/rewards" replace />} />

        {/* 6 · Targeted content */}
        <Route path="/inbox" element={<Inbox />} />
        <Route path="/inbox/:id" element={<OfferDetail />} />
        <Route path="/notifications" element={<NotificationSettings />} />

        {/* 7 · Agent & Super Agent (no games; bar Home · Missions · [Network] · Vouchers) */}
        <Route path="/agent" element={<AgentHome />} />
        <Route path="/agent/missions" element={<AgentMissions />} />
        <Route path="/agent/missions/:code" element={<AgentMissionDetail />} />
        <Route path="/agent/network" element={<AgentNetwork />} />
        <Route path="/agent/vouchers" element={<AgentVouchers />} />
        <Route path="/agent/vouchers/:id" element={<AgentVoucherDetail />} />
        <Route path="/agent/my-vouchers" element={<AgentMyVouchers />} />
        <Route path="/agent/my-vouchers/:id" element={<AgentMyVoucherDetail />} />
        <Route path="/agent/my-vouchers/:id/code" element={<ShowVoucher />} />

        {/* Legacy route redirects to new Figma UI */}
        <Route path="/gamehub" element={<Navigate to="/games" replace />} />
        <Route path="/gamehub/*" element={<Navigate to="/games" replace />} />
        <Route path="/wheel" element={<Navigate to="/games/wheel" replace />} />
        <Route path="/scratch" element={<Navigate to="/games/scratch" replace />} />
        <Route path="/vouchers" element={<Navigate to="/my-vouchers" replace />} />
        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname]);
  return null;
};

/**
 * Figma Customer Journey Screens ("App · Customer journeys").
 * Fully replaces legacy App.tsx layout so the new design renders consistently across all views.
 */
export const Root: React.FC = () => (
  <SSOAuthProvider>
    <HashRouter>
      <ScrollToTop />
      <AppRoutes />
    </HashRouter>
  </SSOAuthProvider>
);

export default Root;
