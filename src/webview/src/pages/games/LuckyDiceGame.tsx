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
  Dices
} from 'lucide-react';
import { LoyaltyApi, GameDetailData } from '../../services/api';
import { soundManager } from '../../utils/audio';
import { ParticleCanvas } from '../../components/effects/ParticleCanvas';

interface LuckyDiceGameProps {
  onBack?: () => void;
  onClaimReward?: (points: number) => void;
}

const DICE_FACES: Record<number, string> = {
  1: '⚀',
  2: '⚁',
  3: '⚂',
  4: '⚃',
  5: '⚄',
  6: '⚅',
};

export const LuckyDiceGame: React.FC<LuckyDiceGameProps> = ({ onBack, onClaimReward }) => {
  const { t } = useTranslation();
  const [gameConfig, setGameConfig] = useState<GameDetailData | null>(null);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [diceValues, setDiceValues] = useState<number[]>([6, 6, 6]);
  const [gameResult, setGameResult] = useState<any>(null);
  const [showResultModal, setShowResultModal] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(soundManager.getMuted());
  const [userBalance, setUserBalance] = useState<number>(0);
  const [remainingTurns, setRemainingTurns] = useState<number>(1);
  const [particleTrigger, setParticleTrigger] = useState<number>(0);
  const [comboName, setComboName] = useState<string | null>(null);

  // 1. Nạp cấu hình ma trận giải thưởng động từ Cơ sở dữ liệu
  useEffect(() => {
    LoyaltyApi.getGameDetail('LUCKY_DICE')
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

  const checkCombo = (vals: number[]) => {
    const [d1, d2, d3] = [...vals].sort((a, b) => a - b);
    if (d1 === d2 && d2 === d3) {
      return 'BÃO TAM XÚC ĐỒNG NHẤT (SIÊU THƯỞNG)';
    }
    if ((d1 + 1 === d2 && d2 + 1 === d3) || (d1 === 1 && d2 === 2 && d3 === 3) || (d1 === 4 && d2 === 5 && d3 === 6)) {
      return 'BỘ SẢNH TIẾN LIÊN HOÀN';
    }
    if (d1 === d2 || d2 === d3 || d1 === d3) {
      return 'CẶP ĐÔI SONG HỶ';
    }
    return null;
  };

  const handleRoll = async () => {
    if (isRolling) return;
    try {
      soundManager.playDiceShake();
      setIsRolling(true);
      setErrorMsg(null);
      setComboName(null);

      // Hiệu ứng xúc xắc đảo nhanh
      const shakeInterval = setInterval(() => {
        setDiceValues([
          Math.floor(Math.random() * 6) + 1,
          Math.floor(Math.random() * 6) + 1,
          Math.floor(Math.random() * 6) + 1,
        ]);
        soundManager.triggerHaptic('light');
      }, 70);

      const res = await LoyaltyApi.playGame('LUCKY_DICE');
      setGameResult(res);

      if (res.newPointBalance !== undefined) {
        setUserBalance(Number(res.newPointBalance));
      }
      if (res.turnsRemaining !== undefined) {
        setRemainingTurns(res.turnsRemaining);
      }

      setTimeout(() => {
        clearInterval(shakeInterval);
        const finalDice = (res.diceValues && res.diceValues.length === 3) ? res.diceValues : [6, 6, 6];
        setDiceValues(finalDice);
        const combo = checkCombo(finalDice);
        setComboName(combo);

        const points = Number(res.pointsAwarded || 0);
        if (points >= 100 || combo?.includes('BÃO')) {
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
          setIsRolling(false);
        }, 600);
      }, 900);
    } catch (e: any) {
      soundManager.playLose();
      setErrorMsg(e.message || t('common.error_occurred'));
      setIsRolling(false);
    }
  };

  const handleReset = () => {
    soundManager.playTap();
    setGameResult(null);
    setShowResultModal(false);
  };

  const totalPoints = diceValues.reduce((a, b) => a + b, 0);

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
            🎲
          </div>
          <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-purple-200 to-indigo-400 bg-clip-text text-transparent">
            {gameConfig?.gameName || t('games.dice.title')}
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

      {/* 2. Main Dice Table View */}
      <main className="max-w-md mx-auto w-full px-4 py-4 flex-1 flex flex-col justify-between space-y-4">
        {/* Banner Info */}
        <div className="w-full text-center">
          <p className="text-xs text-slate-300 max-w-xs mx-auto">
            {gameConfig?.description || t('games.dice.subtitle')}
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

        {/* Bàn Lắc Xúc Xắc VIP */}
        <div className="relative bg-gradient-to-b from-purple-950 via-slate-900 to-slate-950 rounded-3xl p-6 border-2 border-purple-500/40 shadow-2xl space-y-6 text-center">
          {/* Cốc Lắc Kim Loại */}
          <div className="relative flex items-center justify-center">
            <div
              className={`w-24 h-24 rounded-3xl bg-gradient-to-tr from-amber-600 via-yellow-500 to-amber-400 p-1 shadow-2xl shadow-amber-500/30 flex items-center justify-center transition-transform duration-300 ${
                isRolling ? 'animate-bounce rotate-12 scale-110' : ''
              }`}
            >
              <div className="w-full h-full bg-slate-950/80 rounded-2xl flex items-center justify-center text-4xl">
                🏆
              </div>
            </div>
          </div>

          {/* Combo Banner */}
          {comboName && (
            <div className="p-2.5 bg-gradient-to-r from-amber-500/20 via-yellow-500/30 to-orange-500/20 border border-yellow-400 rounded-2xl animate-bounce">
              <span className="text-xs font-black text-yellow-300 flex items-center justify-center gap-1.5">
                <Sparkles className="w-4 h-4 text-yellow-300 animate-spin" />
                {comboName}
              </span>
            </div>
          )}

          {/* 3 Viên Xúc Xắc 3D */}
          <div className="flex justify-center items-center gap-4">
            {diceValues.map((val, idx) => (
              <div
                key={idx}
                className={`w-16 h-16 rounded-2xl bg-white text-slate-950 flex items-center justify-center text-4xl font-black shadow-xl shadow-white/10 border-2 border-slate-200 transition-transform ${
                  isRolling ? 'animate-spin' : 'hover:scale-105'
                }`}
              >
                {DICE_FACES[val] || '⚀'}
              </div>
            ))}
          </div>

          {/* Tổng Nút & Tỷ Lệ Thưởng */}
          <div className="bg-purple-900/40 border border-purple-500/30 rounded-2xl p-3 flex items-center justify-around text-xs">
            <div>
              <span className="text-slate-400 text-[10px] block">TỔNG NÚT:</span>
              <span className="text-base font-black text-amber-400">{totalPoints} Điểm</span>
            </div>
            <div className="h-6 w-px bg-purple-500/30" />
            <div>
              <span className="text-slate-400 text-[10px] block">TỔ HỢP:</span>
              <span className="text-xs font-black text-purple-300">
                {comboName || (diceValues[0] === diceValues[1] && diceValues[1] === diceValues[2]
                  ? t('games.dice.triple_bonus')
                  : t('games.dice.straight_bonus'))}
              </span>
            </div>
          </div>
        </div>

        {/* Nút Lắc Xúc Xắc */}
        <button
          onClick={handleRoll}
          disabled={isRolling}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 active:scale-95 transition-all disabled:opacity-50"
        >
          <Dices className="w-5 h-5" />
          <span>{t('games.dice.btn_roll')}</span>
        </button>

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
                  <span className="text-base">{p.iconSymbol || '🎲'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-slate-300 truncate">{p.prizeName}</p>
                    <p className="text-[10px] font-bold text-purple-400">+{p.prizeValue}đ</p>
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
              🎲
            </div>

            <div>
              <h3 className="text-base font-extrabold text-white">
                {t('games.common.congratulations')}
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
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-black text-sm shadow-lg shadow-purple-500/20 active:scale-95 transition-all"
            >
              {t('games.dice.btn_roll_again')}
            </button>
          </div>
        </div>
      )}

      <ParticleCanvas trigger={particleTrigger} type="coins" />
    </div>
  );
};
