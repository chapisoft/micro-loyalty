import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Sparkles,
  Trophy,
  RotateCcw,
  Zap,
  Volume2,
  VolumeX,
  Coins,
  ShieldCheck,
  HelpCircle
} from 'lucide-react';
import { LoyaltyApi, GameDetailData } from '../../services/api';
import { soundManager } from '../../utils/audio';
import { ParticleCanvas } from '../../components/effects/ParticleCanvas';

interface ScratchCardGameProps {
  onBack?: () => void;
  onClaimReward?: (points: number) => void;
}

const SYMBOL_MAP: Record<string, { icon: string; name: string; color: string }> = {
  GOLD_CHEST: { icon: '👑', name: 'Hòm Vàng VIP', color: 'from-amber-400 to-yellow-500' },
  SILVER_COIN: { icon: '🪙', name: 'Đồng Xu Bạc', color: 'from-slate-300 to-slate-400' },
  BRONZE_STAR: { icon: '⭐', name: 'Sao May Mắn', color: 'from-orange-400 to-amber-500' },
  DIAMOND: { icon: '💎', name: 'Kim Cương', color: 'from-cyan-400 to-blue-500' },
  CROWN: { icon: '🏆', name: 'Cúp Vô Địch', color: 'from-yellow-400 to-amber-600' },
  RUBY: { icon: '❤️', name: 'Ngọc Bích', color: 'from-red-500 to-pink-600' },
  TREASURE: { icon: '🎁', name: 'Hộp Quà', color: 'from-purple-500 to-indigo-600' },
  COIN_BAG: { icon: '💰', name: 'Túi Tiền', color: 'from-emerald-400 to-green-600' },
};

export const ScratchCardGame: React.FC<ScratchCardGameProps> = ({ onBack, onClaimReward }) => {
  const { t } = useTranslation();
  const [gameConfig, setGameConfig] = useState<GameDetailData | null>(null);
  const [revealed, setRevealed] = useState<boolean[]>(Array(9).fill(false));
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [scratchMatrix, setScratchMatrix] = useState<string[]>(Array(9).fill('GOLD_CHEST'));
  const [rewardPoints, setRewardPoints] = useState<number>(0);
  const [gameResult, setGameResult] = useState<any>(null);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(soundManager.getMuted());
  const [userBalance, setUserBalance] = useState<number>(0);
  const [remainingTurns, setRemainingTurns] = useState<number>(1);
  const [particleTrigger, setParticleTrigger] = useState<number>(0);
  const [nearMissSymbol, setNearMissSymbol] = useState<string | null>(null);

  // 1. Nạp cấu hình ma trận giải thưởng động từ Cơ sở dữ liệu
  useEffect(() => {
    LoyaltyApi.getGameDetail('SCRATCH_CARD')
      .then((cfg) => {
        setGameConfig(cfg);
        setUserBalance(cfg.userPointBalance || 0);
        setRemainingTurns(cfg.remainingTurnsToday || 1);
      })
      .catch(() => {});
  }, []);

  const toggleSound = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
    if (!muted) soundManager.playTap();
  };

  const startNewCard = async () => {
    try {
      soundManager.playTap();
      setIsPlaying(true);
      setErrorMsg(null);
      setRevealed(Array(9).fill(false));
      setIsFinished(false);
      setGameResult(null);
      setNearMissSymbol(null);

      const res = await LoyaltyApi.playGame('SCRATCH_CARD');
      if (res.scratchMatrix) {
        setScratchMatrix(res.scratchMatrix);
      }
      setRewardPoints(Number(res.pointsAwarded || 0));
      setGameResult(res);
      if (res.newPointBalance !== undefined) {
        setUserBalance(Number(res.newPointBalance));
      }
      if (res.turnsRemaining !== undefined) {
        setRemainingTurns(res.turnsRemaining);
      }
    } catch (e: any) {
      soundManager.playLose();
      setErrorMsg(e.message || t('common.error_occurred'));
    } finally {
      setIsPlaying(false);
    }
  };

  const checkNearMiss = (currentRevealed: boolean[]) => {
    const revealedSymbols: Record<string, number> = {};
    currentRevealed.forEach((isRev, i) => {
      if (isRev) {
        const sym = scratchMatrix[i];
        revealedSymbols[sym] = (revealedSymbols[sym] || 0) + 1;
      }
    });

    // Check if any symbol has appeared 2 times
    const twoMatches = Object.entries(revealedSymbols).find(([_, count]) => count === 2);
    if (twoMatches && !currentRevealed.every(Boolean)) {
      setNearMissSymbol(twoMatches[0]);
      soundManager.playHeartbeat();
    } else {
      setNearMissSymbol(null);
    }
  };

  const handleRevealCell = (idx: number) => {
    soundManager.playScratch();
    soundManager.triggerHaptic('light');

    if (!gameResult) {
      startNewCard().then(() => {
        setRevealed((prev) => {
          const next = [...prev];
          next[idx] = true;
          checkNearMiss(next);
          return next;
        });
      });
      return;
    }

    if (revealed[idx]) return;

    setRevealed((prev) => {
      const next = [...prev];
      next[idx] = true;
      checkNearMiss(next);
      if (next.every(Boolean)) {
        handleGameEnd();
      }
      return next;
    });
  };

  const handleRevealAll = () => {
    soundManager.playScratch();
    soundManager.triggerHaptic('heavy');

    if (!gameResult) {
      startNewCard().then(() => {
        setRevealed(Array(9).fill(true));
        handleGameEnd();
      });
      return;
    }
    setRevealed(Array(9).fill(true));
    handleGameEnd();
  };

  const handleGameEnd = () => {
    setIsFinished(true);
    setNearMissSymbol(null);
    if (rewardPoints > 20) {
      soundManager.playJackpot();
      soundManager.playCoinRain();
      setParticleTrigger((p) => p + 1);
    } else if (rewardPoints > 0) {
      soundManager.playWinFanfare();
      soundManager.playCoinRain();
      setParticleTrigger((p) => p + 1);
    } else {
      soundManager.playLose();
    }
    if (onClaimReward && rewardPoints > 0) {
      onClaimReward(rewardPoints);
    }
  };

  const allRevealed = revealed.every(Boolean);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans pb-12 select-none">
      {/* 1. Header Bar */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => {
            soundManager.playTap();
            onBack?.();
          }}
          className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 transition-all text-slate-300"
          aria-label={t('games.common.btn_back')}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-lg shadow-sm">
            👑
          </div>
          <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-amber-200 to-yellow-400 bg-clip-text text-transparent">
            {gameConfig?.gameName || t('games.scratch.title')}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleSound}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 transition-all text-amber-400"
            title={isMuted ? t('games.common.sound_off') : t('games.common.sound_on')}
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-slate-400" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 rounded-xl px-2.5 py-1">
            <Coins className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-amber-300">{userBalance}đ</span>
          </div>
        </div>
      </header>

      {/* 2. Main Stage */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 py-4 flex flex-col items-center">
        {/* Banner Info */}
        <div className="w-full text-center mb-3">
          <p className="text-xs text-slate-300 max-w-xs mx-auto">
            {gameConfig?.description || t('games.scratch.subtitle')}
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/90 border border-slate-700 text-[11px] text-amber-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('games.common.remaining_turns', { turns: remainingTurns })}</span>
          </div>
        </div>

        {errorMsg && (
          <div className="w-full mb-3 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs text-center">
            {errorMsg}
          </div>
        )}

        {/* 3. Tấm Thẻ Cào Hoàng Gia 3x3 */}
        <div className="w-full relative p-4 rounded-3xl bg-gradient-to-b from-amber-500/20 via-slate-900 to-slate-950 border-2 border-amber-500/40 shadow-2xl shadow-amber-500/10">
          {/* Header Thẻ Cào */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-amber-500/20">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              <span className="text-xs font-bold text-amber-200 uppercase tracking-wider">
                {t('games.scratch.prize_hint')}
              </span>
            </div>
            <span className="text-[11px] font-black px-2 py-0.5 rounded bg-amber-500 text-slate-950">
              TOP 100đ
            </span>
          </div>

          {/* Banner Hồi Hộp Near-Miss */}
          {nearMissSymbol && !allRevealed && (
            <div className="mb-3 p-2 bg-gradient-to-r from-red-600/30 via-amber-500/30 to-orange-500/30 border border-amber-400 rounded-xl text-center animate-bounce">
              <span className="text-[11px] font-black text-yellow-300 flex items-center justify-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-spin" />
                HỒI HỘP NGHẸT THỞ! ĐÃ CÓ 2 {SYMBOL_MAP[nearMissSymbol]?.name?.toUpperCase()}!
              </span>
            </div>
          )}

          {/* Lưới 9 Ô Cào */}
          <div className="grid grid-cols-3 gap-2.5 aspect-square">
            {scratchMatrix.map((symKey, idx) => {
              const isCellRevealed = revealed[idx];
              const symInfo = SYMBOL_MAP[symKey] || SYMBOL_MAP.GOLD_CHEST;
              const isPulsingTarget = nearMissSymbol && !isCellRevealed;

              return (
                <button
                  key={idx}
                  onClick={() => handleRevealCell(idx)}
                  disabled={isPlaying}
                  className={`relative rounded-2xl flex flex-col items-center justify-center transition-all duration-300 overflow-hidden ${
                    isCellRevealed
                      ? 'bg-slate-800/90 border-2 border-amber-500/60 shadow-inner scale-100'
                      : isPulsingTarget
                      ? 'bg-gradient-to-br from-amber-900/60 via-slate-800 to-slate-900 border-2 border-yellow-400 shadow-lg shadow-yellow-500/40 animate-pulse active:scale-95'
                      : 'bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 border-2 border-amber-500/30 hover:border-amber-400 active:scale-95 shadow-md'
                  }`}
                >
                  {isCellRevealed ? (
                    <div className="animate-in zoom-in duration-300 flex flex-col items-center">
                      <span className="text-3xl mb-0.5 filter drop-shadow">{symInfo.icon}</span>
                      <span className="text-[10px] font-bold text-amber-300 text-center leading-none px-1">
                        {symInfo.name}
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400 group">
                      <div className={`w-9 h-9 rounded-full ${isPulsingTarget ? 'bg-amber-500/30 border-yellow-400' : 'bg-slate-700/80 border-slate-600/80'} border flex items-center justify-center group-hover:border-amber-400 transition-colors`}>
                        <Zap className={`w-4 h-4 ${isPulsingTarget ? 'text-yellow-300 animate-bounce' : 'text-amber-400'}`} />
                      </div>
                      <span className={`text-[9px] font-bold ${isPulsingTarget ? 'text-yellow-300 font-black' : 'text-slate-400'} mt-1 uppercase tracking-widest`}>
                        {isPulsingTarget ? 'MỞ NGAY' : 'CÀO'}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Nút Thao Tác Cào Nhanh */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleRevealAll}
              disabled={isPlaying || allRevealed}
              className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 font-bold text-xs text-amber-300 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{t('games.scratch.btn_scratch_all')}</span>
            </button>

            <button
              onClick={startNewCard}
              disabled={isPlaying}
              className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 active:scale-95 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t('games.scratch.btn_new_card')}</span>
            </button>
          </div>
        </div>

        {/* 4. Modal Kết Quả Trúng Thưởng */}
        {isFinished && gameResult && (
          <div className="w-full mt-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-amber-500/20 border border-amber-500/40 animate-in fade-in slide-in-from-bottom-3 duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-6 h-6 text-amber-400 animate-bounce" />
                <div>
                  <h3 className="text-sm font-extrabold text-white">
                    {gameResult.message || t('games.common.congratulations')}
                  </h3>
                  <p className="text-xs text-amber-300 font-bold">
                    {t('games.common.points_won', { points: rewardPoints })}
                  </p>
                </div>
              </div>

              <button
                onClick={startNewCard}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition-all active:scale-95"
              >
                {t('games.common.btn_play_again')}
              </button>
            </div>
          </div>
        )}

        {/* 5. Ma trận cơ cấu giải thưởng từ DB */}
        {gameConfig?.prizes && gameConfig.prizes.length > 0 && (
          <div className="w-full mt-5 bg-slate-900/60 border border-slate-800 rounded-2xl p-3.5">
            <div className="flex items-center gap-2 mb-2.5">
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-bold text-slate-200">
                {t('games.common.prizes_table_title')}
              </h4>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {gameConfig.prizes.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-2 p-2 rounded-xl bg-slate-800/40 border border-slate-700/40 text-xs"
                >
                  <span className="text-base">{p.iconSymbol || '🎁'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-slate-300 truncate">{p.prizeName}</p>
                    <p className="text-[10px] font-bold text-amber-400">+{p.prizeValue}đ</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Security Stamp */}
        <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>{t('footer.enterprise_security')}</span>
        </div>
      </main>

      <ParticleCanvas trigger={particleTrigger} type="coins" />
    </div>
  );
};
