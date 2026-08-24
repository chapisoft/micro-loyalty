import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  Coins,
  ShieldCheck,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { LoyaltyApi, GameDetailData } from '../../services/api';
import { soundManager } from '../../utils/audio';
import { ParticleCanvas } from '../../components/effects/ParticleCanvas';

interface GoldenEggGameProps {
  onBack?: () => void;
  onClaimReward?: (points: number) => void;
}

const EGG_LABELS = [
  'Trứng Vàng Thần Tài',
  'Trứng Vàng Phát Lộc',
  'Trứng Vàng May Mắn',
  'Trứng Vàng Thịnh Vượng',
  'Trứng Vàng Như Ý',
];

export const GoldenEggGame: React.FC<GoldenEggGameProps> = ({ onBack, onClaimReward }) => {
  const { t } = useTranslation();
  const [gameConfig, setGameConfig] = useState<GameDetailData | null>(null);
  const [selectedEgg, setSelectedEgg] = useState<number | null>(null);
  const [isSmashing, setIsSmashing] = useState<boolean>(false);
  const [crackStage, setCrackStage] = useState<number>(0);
  const [gameResult, setGameResult] = useState<any>(null);
  const [showResultModal, setShowResultModal] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(soundManager.getMuted());
  const [userBalance, setUserBalance] = useState<number>(0);
  const [remainingTurns, setRemainingTurns] = useState<number>(1);
  const [particleTrigger, setParticleTrigger] = useState<number>(0);

  // 1. Nạp cấu hình ma trận giải thưởng động từ Cơ sở dữ liệu
  useEffect(() => {
    LoyaltyApi.getGameDetail('GOLDEN_EGG')
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

  const handleSmash = async (eggId: number) => {
    if (isSmashing) return;
    try {
      soundManager.playHammerSmash();
      setSelectedEgg(eggId);
      setIsSmashing(true);
      setCrackStage(1);
      setErrorMsg(null);

      const res = await LoyaltyApi.playGame('GOLDEN_EGG', eggId);
      setGameResult(res);

      if (res.newPointBalance !== undefined) {
        setUserBalance(Number(res.newPointBalance));
      }
      if (res.turnsRemaining !== undefined) {
        setRemainingTurns(res.turnsRemaining);
      }

      // Stage 2: Vỡ toác vỏ trứng
      setTimeout(() => {
        soundManager.playEggCrack();
        setCrackStage(2);
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
          setIsSmashing(false);
        }, 800);
      }, 500);
    } catch (e: any) {
      soundManager.playLose();
      setErrorMsg(e.message || t('common.error_occurred'));
      setIsSmashing(false);
      setCrackStage(0);
    }
  };

  const handleReset = () => {
    soundManager.playTap();
    setSelectedEgg(null);
    setCrackStage(0);
    setGameResult(null);
    setShowResultModal(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans select-none pb-12">
      {/* 1. Header Bar */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-amber-500/20 px-4 py-3 flex items-center justify-between">
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
            🥚
          </div>
          <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-amber-200 to-yellow-400 bg-clip-text text-transparent">
            {gameConfig?.gameName || t('games.egg.title')}
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

      {/* 2. Main Egg Nest View */}
      <main className="max-w-md mx-auto w-full px-4 py-4 flex-1 flex flex-col justify-between space-y-4">
        {/* Banner Info */}
        <div className="w-full text-center">
          <p className="text-xs text-slate-300 max-w-xs mx-auto">
            {gameConfig?.description || t('games.egg.subtitle')}
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/90 border border-slate-700 text-[11px] text-amber-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('games.common.remaining_turns', { turns: remainingTurns })}</span>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs text-center">
            {errorMsg}
          </div>
        )}

        {/* Ổ Trứng Vàng 5 Quả */}
        <div className="relative bg-gradient-to-b from-amber-950/60 via-slate-900 to-slate-950 rounded-3xl p-5 border-2 border-amber-500/40 shadow-2xl space-y-4">
          <div className="text-center text-xs text-amber-200 font-bold">
            Chạm vào 1 quả trứng vàng để dùng búa thần gõ vỡ:
          </div>

          {/* Lưới 5 Trứng Vàng */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            {[1, 2, 3, 4, 5].map((eggId, idx) => {
              const isSelected = selectedEgg === eggId;
              const isLast = idx === 4;

              return (
                <div
                  key={eggId}
                  onClick={() => handleSmash(eggId)}
                  className={`${
                    isLast ? 'col-span-2 mx-auto w-1/2' : ''
                  } group relative bg-gradient-to-b from-amber-900/40 to-slate-900 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 active:scale-95 text-center shadow-lg ${
                    isSelected
                      ? 'border-yellow-300 scale-105 shadow-yellow-500/40 animate-pulse'
                      : 'border-amber-600/40 hover:border-amber-400 hover:bg-slate-800'
                  }`}
                >
                  <div
                    className={`text-5xl mb-2 transition-transform duration-300 ${
                      isSelected && isSmashing
                        ? 'animate-bounce scale-125'
                        : isSelected
                        ? 'scale-110'
                        : 'group-hover:scale-110'
                    }`}
                  >
                    {isSelected && crackStage === 2 ? '👑' : isSelected && crackStage === 1 ? '💥' : '🥚'}
                  </div>
                  <span className="text-xs font-black text-amber-200 block">
                    {isSelected && crackStage === 2 ? 'THẦN TÀI' : EGG_LABELS[idx] || `Trứng ${eggId}`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Cơ Cấu Giải Thưởng Động từ DB */}
        {gameConfig?.prizes && gameConfig.prizes.length > 0 && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3.5">
            <div className="flex items-center gap-2 mb-2">
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
                  <span className="text-base">{p.iconSymbol || '🐣'}</span>
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

      {/* 4. Modal Kết Quả */}
      {showResultModal && gameResult && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-amber-500/40 rounded-3xl p-6 max-w-xs w-full text-center shadow-2xl space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-500/40 mx-auto flex items-center justify-center text-3xl animate-bounce">
              👑
            </div>

            <div>
              <h3 className="text-base font-extrabold text-white">
                {t('games.common.congratulations')}
              </h3>
              <p className="text-xs text-amber-300 mt-1">
                {gameResult.message}
              </p>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3">
              <span className="text-xs text-slate-400">{t('games.common.points_won', { points: '' })}</span>
              <p className="text-xl font-black text-amber-400">
                +{gameResult.pointsAwarded || 0} Điểm
              </p>
            </div>

            <button
              onClick={handleReset}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
            >
              {t('games.egg.btn_play_again')}
            </button>
          </div>
        </div>
      )}

      <ParticleCanvas trigger={particleTrigger} type="coins" />
    </div>
  );
};
