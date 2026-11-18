import React, { lazy, Suspense } from 'react';
import { HashRouter, Route, Routes, Navigate, useNavigate } from 'react-router-dom';
import useSSOAuth from '../hooks/useSSOAuth';
import LoyaltyHome from './screens/LoyaltyHome';
import MemberTiers, { ProgramTerms } from './screens/MemberTiers';
import CoinsHistory from './screens/CoinsHistory';
import { MissionsList, MissionDetail, CheckIn } from './screens/Missions';
import { InviteFriends, InvitedWelcome } from './screens/Invite';
import { RewardStore, RewardDetail, RedeemDone, MyVouchers, MyVoucherDetail, ShowVoucher } from './screens/Rewards';
import { GameHub, Wheel, ScratchCard, GameResult, GetPlays, LearningList, LearningDetail, Lesson, PlayHistory } from './screens/Games';
import { PayAtCounter } from './screens/UseCoins';
import { Inbox, OfferDetail, NotificationSettings } from './screens/Inbox';
import { AgentHome, AgentMissions, AgentMissionDetail, AgentNetwork, AgentVouchers, AgentVoucherDetail, AgentMyVouchers, AgentMyVoucherDetail } from './screens/Agent';

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
const ScrewPuzzleGame = lazy(() => import('../pages/games/ScrewPuzzleGame').then((m) => ({ default: m.ScrewPuzzleGame })));
const UntangleRopeGame = lazy(() => import('../pages/games/UntangleRopeGame').then((m) => ({ default: m.UntangleRopeGame })));
const PullThePinGame = lazy(() => import('../pages/games/PullThePinGame').then((m) => ({ default: m.PullThePinGame })));

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
export const Root: React.FC = () => {
  const { loading } = useSSOAuth(); // exchanges ?ticket= for a token before the screens call the API
  if (loading) return <div className="min-h-screen bg-page" />;
  return (
    <HashRouter>
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
        <Route path="/screw" element={<GamePlayer Component={ScrewPuzzleGame} />} />
        <Route path="/untangle" element={<GamePlayer Component={UntangleRopeGame} />} />
        <Route path="/pullpin" element={<GamePlayer Component={PullThePinGame} />} />

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
    </HashRouter>
  );
};

export default Root;
