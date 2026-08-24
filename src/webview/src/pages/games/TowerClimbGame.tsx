import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  Coins,
  ShieldCheck,
  HelpCircle,
  Sparkles,
  Flame,
  TrendingUp
} from 'lucide-react';
import { LoyaltyApi, GameDetailData } from '../../services/api';
import { soundManager } from '../../utils/audio';
import { ParticleCanvas } from '../../components/effects/ParticleCanvas';

interface TowerClimbGameProps {
  onBack?: () => void;
  onClaimReward?: (points: number) => void;
}

const DEFAULT_FLOORS = [
  { floor: 5, multiplier: '50.0x', points: 1000, color: 'from-amber-400 to-yellow-500', name: 'Đỉnh Tháp Kim Cương' },
  { floor: 4, multiplier: '10.0x', points: 200, color: 'from-purple-500 to-indigo-600', name: 'Tầng Rồng Lửa' },
  { floor: 3, multiplier: '5.0x', points: 100, color: 'from-blue-500 to-cyan-500', name: 'Tầng Thạch Anh' },
  { floor: 2, multiplier: '2.5x', points: 50, color: 'from-teal-500 to-emerald-500', name: 'Tầng Ngọc Lục Bảo' },
  { floor: 1, multiplier: '1.5x', points: 30, color: 'from-slate-600 to-slate-500', name: 'Cổng Tháp Khởi Đầu' },
];

export const TowerClimbGame: React.FC<TowerClimbGameProps> = ({ onBack, onClaimReward }) => {
  const { t } = useTranslation();
  const [gameConfig, setGameConfig] = useState<GameDetailData | null>(null);
  const [currentFloor, setCurrentFloor] = useState<number>(0);
  const [isClimbing, setIsClimbing] = useState<boolean>(false);
  const [isCrashed, setIsCrashed] = useState<boolean>(false);
  const [gameResult, setGameResult] = useState<any>(null);
  const [showResultModal, setShowResultModal] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(soundManager.getMuted());
  const [userBalance, setUserBalance] = useState<number>(0);
  const [remainingTurns, setRemainingTurns] = useState<number>(1);
  const [particleTrigger, setParticleTrigger] = useState<number>(0);

  // 1. Nạp cấu hình ma trận giải thưởng động từ Cơ sở dữ liệu
  useEffect(() => {
    LoyaltyApi.getGameDetail('TOWER_CLIMB')
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

  const handleStep = async (action: 'PLAY' | 'CASH_OUT') => {
    if (isClimbing) return;
    try {
      if (action === 'PLAY' && currentFloor >= 2) {
        soundManager.playHeartbeat();
      } else {
        soundManager.playTap();
      }
      setIsClimbing(true);
      setErrorMsg(null);

      const nextFloor = action === 'PLAY' ? currentFloor + 1 : currentFloor;
      const res = await LoyaltyApi.playGame('TOWER_CLIMB', undefined, nextFloor, undefined, action);
      setGameResult(res);

      if (res.newPointBalance !== undefined) {
        setUserBalance(Number(res.newPointBalance));
      }
      if (res.turnsRemaining !== undefined) {
        setRemainingTurns(res.turnsRemaining);
      }

      if (action === 'CASH_OUT') {
        soundManager.playWinFanfare();
        soundManager.playCoinRain();
        soundManager.triggerHaptic('success');
        setParticleTrigger((p) => p + 1);
        setShowResultModal(true);
        if (res.pointsAwarded && onClaimReward) {
          onClaimReward(Number(res.pointsAwarded));
        }
        setIsClimbing(false);
        return;
      }

      if (res.outcome === 'CRASH') {
        soundManager.playLose();
        soundManager.triggerHaptic('error');
        setIsCrashed(true);
        setTimeout(() => {
          setShowResultModal(true);
          if (res.pointsAwarded && onClaimReward) {
            onClaimReward(Number(res.pointsAwarded));
          }
          setIsClimbing(false);
        }, 700);
      } else {
        soundManager.playClimbStep(nextFloor);
        soundManager.triggerHaptic('medium');
        setCurrentFloor(res.towerCurrentFloor || nextFloor);

        if (res.outcome === 'WIN' || nextFloor >= 5) {
          soundManager.playJackpot();
          soundManager.playCoinRain();
          soundManager.triggerHaptic('success');
          setParticleTrigger((p) => p + 1);
          setTimeout(() => {
            setShowResultModal(true);
            if (res.pointsAwarded && onClaimReward) {
              onClaimReward(Number(res.pointsAwarded));
            }
            setIsClimbing(false);
          }, 800);
        } else {
          setIsClimbing(false);
        }
      }
    } catch (e: any) {
      soundManager.playLose();
      setErrorMsg(e.message || t('common.error_occurred'));
      setIsClimbing(false);
    }
  };

  const handleReset = () => {
    soundManager.playTap();
    setCurrentFloor(0);
    setIsCrashed(false);
    setGameResult(null);
    setShowResultModal(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans select-none pb-12">
      {/* 1. Header Bar */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-purple-500/20 px-4 py-3 flex items-center justify-between">
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
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 font-bold text-lg shadow-sm">
            🏰
          </div>
          <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-purple-200 to-pink-400 bg-clip-text text-transparent">
            {gameConfig?.gameName || t('games.tower.title')}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleSound}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 transition-all text-purple-400"
            title={isMuted ? t('games.common.sound_off') : t('games.common.sound_on')}
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-slate-400" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-1 bg-purple-500/10 border border-purple-500/30 rounded-xl px-2.5 py-1">
            <Coins className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-bold text-purple-300">{userBalance}đ</span>
          </div>
        </div>
      </header>

      {/* 2. Main Tower Climb View */}
      <main className="max-w-md mx-auto w-full px-4 py-4 flex-1 flex flex-col justify-between space-y-4">
        {/* Banner Info */}
        <div className="w-full text-center">
          <p className="text-xs text-slate-300 max-w-xs mx-auto">
            {gameConfig?.description || t('games.tower.subtitle')}
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/90 border border-slate-700 text-[11px] text-purple-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('games.common.remaining_turns', { turns: remainingTurns })}</span>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs text-center">
            {errorMsg}
          </div>
        )}

        {/* Tháp 5 Tầng Ma Thuật */}
        <div className="relative bg-gradient-to-b from-purple-950/60 via-slate-900 to-slate-950 rounded-3xl p-5 border-2 border-purple-500/40 shadow-2xl space-y-2.5">
          {DEFAULT_FLOORS.map((f) => {
            const isCurrent = currentFloor === f.floor;
            const isPassed = currentFloor > f.floor;

            return (
              <div
                key={f.floor}
                className={`relative p-3 rounded-2xl flex items-center justify-between border-2 transition-all duration-500 ${
                  isCurrent
                    ? 'bg-purple-600/30 border-purple-400 scale-[1.03] shadow-lg shadow-purple-500/30'
                    : isPassed
                    ? 'bg-emerald-950/40 border-emerald-500/50 opacity-90'
                    : 'bg-slate-900/60 border-slate-800/80 opacity-60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black ${
                      isCurrent
                        ? 'bg-purple-500 text-white animate-pulse'
                        : isPassed
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isPassed ? '✓' : f.floor}
                  </span>
                  <div>
                    <span className="text-xs font-bold text-slate-200">{f.name}</span>
                    <span className="text-[10px] text-purple-300 block font-mono">
                      {f.multiplier}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-black text-amber-400">+{f.points}đ</span>
                  {isCurrent && (
                    <span className="flex items-center gap-0.5 text-[9px] text-emerald-400 font-bold justify-end animate-bounce mt-0.5">
                      <Flame className="w-3 h-3" /> ĐANG Ở ĐÂY
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Nút Điều Khiển Leo Tiếp / Bảo Toàn */}
        <div className="flex gap-2 pt-2">
          {currentFloor > 0 && (
            <button
              onClick={() => handleStep('CASH_OUT')}
              disabled={isClimbing}
              className="flex-1 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 font-bold text-xs text-amber-300 flex items-center justify-center gap-1.5 transition-all shadow-md"
            >
              <TrendingUp className="w-4 h-4" />
              <span>{t('games.tower.btn_cashout')}</span>
            </button>
          )}

          <button
            onClick={() => handleStep('PLAY')}
            disabled={isClimbing || currentFloor >= 5}
            className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-purple-500/20 active:scale-95 transition-all disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>
              {currentFloor === 0
                ? t('games.common.btn_play')
                : t('games.tower.btn_climb')}
            </span>
          </button>
        </div>

        {/* 3. Cơ Cấu Giải Thưởng Động từ DB */}
        {gameConfig?.prizes && gameConfig.prizes.length > 0 && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3.5">
            <div className="flex items-center gap-2 mb-2">
              <HelpCircle className="w-4 h-4 text-purple-400" />
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
                  <span className="text-base">{p.iconSymbol || '🏰'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-slate-300 truncate">{p.prizeName}</p>
                    <p className="text-[10px] font-bold text-purple-400">x{p.prizeValue}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Security Stamp */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
          <span>{t('footer.enterprise_security')}</span>
        </div>
      </main>

      {/* 4. Modal Kết Quả */}
      {showResultModal && gameResult && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-purple-500/40 rounded-3xl p-6 max-w-xs w-full text-center shadow-2xl space-y-4">
            <div className="w-16 h-16 rounded-full bg-purple-500/20 border-2 border-purple-500/40 mx-auto flex items-center justify-center text-3xl animate-bounce">
              {isCrashed ? '💥' : '👑'}
            </div>

            <div>
              <h3 className="text-base font-extrabold text-white">
                {isCrashed
                  ? t('games.tower.crash_text')
                  : t('games.tower.win_text')}
              </h3>
              <p className="text-xs text-purple-300 mt-1">
                {gameResult.message}
              </p>
            </div>

            <div className="bg-purple-500/10 border border-purple-500/30 rounded-2xl p-3">
              <span className="text-xs text-slate-400">{t('games.common.points_won', { points: '' })}</span>
              <p className="text-xl font-black text-purple-400">
                +{gameResult.pointsAwarded || 0} Điểm
              </p>
            </div>

            <button
              onClick={handleReset}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-black text-sm shadow-lg shadow-purple-500/20 active:scale-95 transition-all"
            >
              {t('games.common.btn_play_again')}
            </button>
          </div>
        </div>
      )}

      <ParticleCanvas trigger={particleTrigger} type="coins" />
    </div>
  );
};
