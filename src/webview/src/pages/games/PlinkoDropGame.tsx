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
  Play
} from 'lucide-react';
import { LoyaltyApi, GameDetailData } from '../../services/api';
import { soundManager } from '../../utils/audio';
import { ParticleCanvas } from '../../components/effects/ParticleCanvas';

interface PlinkoDropGameProps {
  onBack?: () => void;
  onClaimReward?: (points: number) => void;
}

const DEFAULT_MULTIPLIERS = [10.0, 5.0, 2.0, 1.0, 0.5, 1.0, 2.0, 5.0, 10.0];

export const PlinkoDropGame: React.FC<PlinkoDropGameProps> = ({ onBack, onClaimReward }) => {
  const { t } = useTranslation();
  const [gameConfig, setGameConfig] = useState<GameDetailData | null>(null);
  const [isDropping, setIsDropping] = useState<boolean>(false);
  const [ballPos, setBallPos] = useState<{ x: number; y: number }>({ x: 50, y: 5 });
  const [landingIndex, setLandingIndex] = useState<number | null>(null);
  const [gameResult, setGameResult] = useState<any>(null);
  const [showResultModal, setShowResultModal] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(soundManager.getMuted());
  const [userBalance, setUserBalance] = useState<number>(0);
  const [remainingTurns, setRemainingTurns] = useState<number>(1);
  const [particleTrigger, setParticleTrigger] = useState<number>(0);
  const [activePin, setActivePin] = useState<{ row: number; col: number } | null>(null);

  // 1. Nạp cấu hình ma trận giải thưởng động từ Cơ sở dữ liệu
  useEffect(() => {
    LoyaltyApi.getGameDetail('PLINKO_DROP')
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

  const handleDrop = async () => {
    if (isDropping) return;
    try {
      soundManager.playTap();
      setIsDropping(true);
      setErrorMsg(null);
      setLandingIndex(null);
      setBallPos({ x: 50, y: 5 });

      const res = await LoyaltyApi.playGame('PLINKO_DROP');
      setGameResult(res);

      if (res.newPointBalance !== undefined) {
        setUserBalance(Number(res.newPointBalance));
      }
      if (res.turnsRemaining !== undefined) {
        setRemainingTurns(res.turnsRemaining);
      }

      const path = res.plinkoBouncePath || [0, 1, 0, 1, 0, 1, 0, 1];
      let currentX = 50;

      // Hoạt ảnh bi nảy qua 8 hàng đinh với thang âm chromatic
      for (let step = 0; step < path.length; step++) {
        await new Promise((r) => setTimeout(r, 150));
        soundManager.playChromaticDing(step);
        const dir = path[step]; // 0: left, 1: right
        currentX += dir === 1 ? 5.5 : -5.5;
        const currentY = 15 + step * 10;
        setBallPos({ x: currentX, y: currentY });
        setActivePin({ row: step, col: Math.round((currentX / 100) * (step + 3)) });
        soundManager.triggerHaptic('light');
      }

      // Rơi vào hộc đáy
      await new Promise((r) => setTimeout(r, 180));
      setBallPos({ x: currentX, y: 95 });
      setLandingIndex(res.plinkoLandingIndex ?? 4);
      setActivePin(null);

      const points = Number(res.pointsAwarded || 0);
      if (points >= 100) {
        soundManager.playJackpot();
        soundManager.playCoinRain();
        soundManager.triggerHaptic('success');
        setParticleTrigger((p) => p + 1);
      } else if (points > 0) {
        soundManager.playWinFanfare();
        soundManager.playCoinRain();
        soundManager.triggerHaptic('success');
        setParticleTrigger((p) => p + 1);
      } else {
        soundManager.playLose();
        soundManager.triggerHaptic('warning');
      }

      setTimeout(() => {
        setShowResultModal(true);
        if (res.pointsAwarded && onClaimReward) {
          onClaimReward(points);
        }
        setIsDropping(false);
      }, 700);
    } catch (e: any) {
      soundManager.playLose();
      setErrorMsg(e.message || t('common.error_occurred'));
      setIsDropping(false);
    }
  };

  const handleReset = () => {
    soundManager.playTap();
    setBallPos({ x: 50, y: 5 });
    setLandingIndex(null);
    setGameResult(null);
    setShowResultModal(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans select-none pb-12">
      {/* 1. Header Bar */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-pink-500/20 px-4 py-3 flex items-center justify-between">
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
          <div className="w-8 h-8 rounded-lg bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-pink-400 font-bold text-lg shadow-sm">
            🔮
          </div>
          <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-pink-200 to-rose-400 bg-clip-text text-transparent">
            {gameConfig?.gameName || t('games.plinko.title')}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleSound}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 transition-all text-pink-400"
            title={isMuted ? t('games.common.sound_off') : t('games.common.sound_on')}
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-slate-400" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-1 bg-pink-500/10 border border-pink-500/30 rounded-xl px-2.5 py-1">
            <Coins className="w-4 h-4 text-pink-400" />
            <span className="text-xs font-bold text-pink-300">{userBalance}đ</span>
          </div>
        </div>
      </header>

      {/* 2. Main Plinko Board View */}
      <main className="max-w-md mx-auto w-full px-4 py-4 flex-1 flex flex-col justify-between space-y-4">
        {/* Banner Info */}
        <div className="w-full text-center">
          <p className="text-xs text-slate-300 max-w-xs mx-auto">
            {gameConfig?.description || t('games.plinko.subtitle')}
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/90 border border-slate-700 text-[11px] text-pink-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('games.common.remaining_turns', { turns: remainingTurns })}</span>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs text-center">
            {errorMsg}
          </div>
        )}

        {/* Bàn Đinh Plinko Neon 8 Hàng */}
        <div className="relative bg-gradient-to-b from-slate-900 via-purple-950 to-slate-950 rounded-3xl p-4 border-2 border-pink-500/40 shadow-2xl aspect-[4/5] flex flex-col justify-between overflow-hidden">
          {/* Viên Bi Neon Rơi */}
          <div
            className="absolute z-20 w-5 h-5 rounded-full bg-gradient-to-tr from-yellow-300 to-amber-400 shadow-[0_0_15px_#f59e0b] -translate-x-1/2 -translate-y-1/2 transition-all duration-150 flex items-center justify-center text-[10px] font-black text-slate-950 pointer-events-none"
            style={{ left: `${ballPos.x}%`, top: `${ballPos.y}%` }}
          >
            ★
          </div>

          {/* Lưới Chốt Đinh */}
          <div className="flex-1 flex flex-col justify-around py-4">
            {[3, 4, 5, 6, 7, 8, 9, 10].map((pegsCount, rowIdx) => {
              const isHitRow = activePin?.row === rowIdx;
              return (
                <div key={rowIdx} className="flex justify-around items-center px-2">
                  {Array.from({ length: pegsCount }).map((_, pIdx) => (
                    <div
                      key={pIdx}
                      className={`w-2.5 h-2.5 rounded-full transition-all duration-100 border border-white/40 ${
                        isHitRow
                          ? 'bg-yellow-300 shadow-[0_0_12px_#fde047] scale-125'
                          : 'bg-pink-400/80 shadow-[0_0_8px_#ec4899]'
                      }`}
                    />
                  ))}
                </div>
              );
            })}
          </div>

          {/* 9 Hộc Đáy Multipliers */}
          <div className="grid grid-cols-9 gap-1 pt-2 border-t-2 border-pink-500/30">
            {DEFAULT_MULTIPLIERS.map((mult, idx) => {
              const isHit = landingIndex === idx;
              return (
                <div
                  key={idx}
                  className={`py-2 rounded-lg text-center font-mono font-bold text-[9px] transition-all duration-300 border ${
                    isHit
                      ? 'bg-amber-400 text-slate-950 border-amber-300 scale-110 shadow-lg shadow-amber-400/50'
                      : mult >= 5
                      ? 'bg-pink-900/60 text-pink-300 border-pink-500/40'
                      : mult >= 2
                      ? 'bg-purple-900/60 text-purple-300 border-purple-500/40'
                      : 'bg-slate-900 text-slate-400 border-slate-700'
                  }`}
                >
                  {mult}x
                </div>
              );
            })}
          </div>
        </div>

        {/* Nút Thả Bi */}
        <button
          onClick={handleDrop}
          disabled={isDropping}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-pink-500/20 active:scale-95 transition-all disabled:opacity-50"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>{t('games.plinko.btn_drop')}</span>
        </button>

        {/* 3. Cơ Cấu Giải Thưởng Động từ DB */}
        {gameConfig?.prizes && gameConfig.prizes.length > 0 && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3.5">
            <div className="flex items-center gap-2 mb-2">
              <HelpCircle className="w-4 h-4 text-pink-400" />
              <h4 className="text-xs font-bold text-slate-200">
                {t('games.common.prizes_table_title')}
              </h4>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {gameConfig.prizes.slice(0, 6).map((p) => (
                <div
                  key={p.id}
                  className="p-2 rounded-xl bg-slate-800/40 border border-slate-700/40 text-center"
                >
                  <span className="text-base block mb-0.5">{p.iconSymbol || '🔥'}</span>
                  <p className="text-[10px] font-semibold text-slate-300 truncate">{p.prizeName}</p>
                  <p className="text-[10px] font-bold text-pink-400">x{p.prizeValue}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Security Stamp */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-pink-400" />
          <span>{t('footer.enterprise_security')}</span>
        </div>
      </main>

      {/* 4. Modal Kết Quả */}
      {showResultModal && gameResult && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-pink-500/40 rounded-3xl p-6 max-w-xs w-full text-center shadow-2xl space-y-4">
            <div className="w-16 h-16 rounded-full bg-pink-500/20 border-2 border-pink-500/40 mx-auto flex items-center justify-center text-3xl animate-bounce">
              🔮
            </div>

            <div>
              <h3 className="text-base font-extrabold text-white">
                {t('games.common.congratulations')}
              </h3>
              <p className="text-xs text-pink-300 mt-1">
                {gameResult.message}
              </p>
            </div>

            <div className="bg-pink-500/10 border border-pink-500/30 rounded-2xl p-3">
              <span className="text-xs text-slate-400">{t('games.common.points_won', { points: '' })}</span>
              <p className="text-xl font-black text-pink-400">
                +{gameResult.pointsAwarded || 0} Điểm
              </p>
            </div>

            <button
              onClick={handleReset}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-black text-sm shadow-lg shadow-pink-500/20 active:scale-95 transition-all"
            >
              {t('games.common.btn_play_again')}
            </button>
          </div>
        </div>
      )}

      <ParticleCanvas trigger={particleTrigger} type="confetti" />
    </div>
  );
};
