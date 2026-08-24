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

interface PenaltyShootoutGameProps {
  onBack?: () => void;
  onClaimReward?: (points: number) => void;
}

const CORNERS = [
  { id: 1, labelKey: 'games.penalty.top_left', pos: 'top-3 left-4' },
  { id: 2, labelKey: 'games.penalty.top_right', pos: 'top-3 right-4' },
  { id: 3, labelKey: 'games.penalty.bottom_left', pos: 'bottom-4 left-4' },
  { id: 4, labelKey: 'games.penalty.bottom_right', pos: 'bottom-4 right-4' },
];

export const PenaltyShootoutGame: React.FC<PenaltyShootoutGameProps> = ({ onBack, onClaimReward }) => {
  const { t } = useTranslation();
  const [gameConfig, setGameConfig] = useState<GameDetailData | null>(null);
  const [selectedCorner, setSelectedCorner] = useState<number | null>(null);
  const [isShooting, setIsShooting] = useState<boolean>(false);
  const [goalieCorner, setGoalieCorner] = useState<number | null>(null);
  const [gameOutcome, setGameOutcome] = useState<'WIN' | 'SAVED' | 'POST' | null>(null);
  const [gameResult, setGameResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showResultModal, setShowResultModal] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(soundManager.getMuted());
  const [userBalance, setUserBalance] = useState<number>(0);
  const [remainingTurns, setRemainingTurns] = useState<number>(1);

  // 1. Nạp cấu hình ma trận giải thưởng động từ Cơ sở dữ liệu
  useEffect(() => {
    LoyaltyApi.getGameDetail('PENALTY_SHOOTOUT')
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

  const handleShoot = async (cornerId: number) => {
    if (isShooting) return;
    try {
      soundManager.playKick();
      setSelectedCorner(cornerId);
      setIsShooting(true);
      setErrorMsg(null);
      setGoalieCorner(null);
      setGameOutcome(null);

      const res = await LoyaltyApi.playGame('PENALTY_SHOOTOUT', cornerId);
      setGameResult(res);

      if (res.newPointBalance !== undefined) {
        setUserBalance(Number(res.newPointBalance));
      }
      if (res.turnsRemaining !== undefined) {
        setRemainingTurns(res.turnsRemaining);
      }

      // Hoạt ảnh thủ môn bay người và bóng bay
      setTimeout(() => {
        setGoalieCorner(res.serverResult || cornerId);
        setGameOutcome(res.outcome as any);
        if (navigator.vibrate) {
          if (res.outcome === 'WIN') navigator.vibrate([100, 50, 200]);
          else navigator.vibrate(100);
        }

        // Phát âm thanh theo kết quả
        if (res.outcome === 'WIN') {
          soundManager.playWinFanfare();
        } else {
          soundManager.playLose();
        }

        // Hiển thị Popup chúc mừng
        setTimeout(() => {
          setShowResultModal(true);
          if (res.pointsAwarded && onClaimReward) {
            onClaimReward(Number(res.pointsAwarded));
          }
          setIsShooting(false);
        }, 1000);
      }, 700);
    } catch (e: any) {
      soundManager.playLose();
      setErrorMsg(e.message || t('common.error_occurred'));
      setIsShooting(false);
    }
  };

  const handleReset = () => {
    soundManager.playTap();
    setSelectedCorner(null);
    setGoalieCorner(null);
    setGameOutcome(null);
    setShowResultModal(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans select-none pb-12">
      {/* 1. Header Bar */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-emerald-500/20 px-4 py-3 flex items-center justify-between">
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
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-lg shadow-sm">
            ⚽
          </div>
          <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-emerald-200 to-green-400 bg-clip-text text-transparent">
            {gameConfig?.gameName || t('games.penalty.title')}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleSound}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 transition-all text-emerald-400"
            title={isMuted ? t('games.common.sound_off') : t('games.common.sound_on')}
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-slate-400" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-2.5 py-1">
            <Coins className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-emerald-300">{userBalance}đ</span>
          </div>
        </div>
      </header>

      {/* 2. Main Pitch View */}
      <main className="max-w-md mx-auto w-full px-4 py-4 flex-1 flex flex-col justify-between space-y-4">
        {/* Banner Info */}
        <div className="w-full text-center">
          <p className="text-xs text-slate-300 max-w-xs mx-auto">
            {gameConfig?.description || t('games.penalty.subtitle')}
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/90 border border-slate-700 text-[11px] text-emerald-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('games.common.remaining_turns', { turns: remainingTurns })}</span>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs text-center">
            {errorMsg}
          </div>
        )}

        {/* Khung Thành & Sân Bóng 11m */}
        <div className="relative bg-gradient-to-b from-slate-900 via-emerald-950 to-emerald-900 rounded-3xl p-4 border-2 border-emerald-500/40 shadow-2xl overflow-hidden aspect-[4/3] flex flex-col justify-between">
          {/* Ánh Sáng Đèn Sân Vận Động */}
          <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-black/80 to-transparent flex justify-around items-center px-4 pointer-events-none opacity-60">
            <div className="w-2 h-2 rounded-full bg-yellow-300 blur-[2px] animate-ping" />
            <div className="w-2 h-2 rounded-full bg-cyan-300 blur-[2px] animate-pulse" />
            <div className="w-2 h-2 rounded-full bg-yellow-300 blur-[2px] animate-ping" />
          </div>

          {/* Khung Thành Trắng */}
          <div className="relative mx-auto w-11/12 h-36 border-4 border-slate-100 rounded-t-lg bg-emerald-950/40 shadow-inner flex items-center justify-center overflow-hidden">
            {/* Lưới Khung Thành */}
            <div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage:
                  'radial-gradient(circle, #fff 1px, transparent 1px)',
                backgroundSize: '10px 10px',
              }}
            />

            {/* 4 Điểm Ngắm Sút Bóng */}
            {CORNERS.map((c) => (
              <button
                key={c.id}
                onClick={() => handleShoot(c.id)}
                disabled={isShooting}
                className={`absolute ${c.pos} z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                  selectedCorner === c.id
                    ? 'bg-amber-400 text-slate-950 scale-110 shadow-lg shadow-amber-400/50'
                    : 'bg-emerald-500/30 border-2 border-emerald-400 text-emerald-200 hover:bg-emerald-400 hover:text-slate-950 active:scale-95'
                }`}
                title={t(c.labelKey)}
              >
                <span className="text-xs font-black">{c.id}</span>
              </button>
            ))}

            {/* Thủ Môn Bay Người */}
            <div
              className={`text-4xl transition-all duration-700 transform ${
                goalieCorner === 1
                  ? '-translate-x-14 -translate-y-8 rotate-[-30deg]'
                  : goalieCorner === 2
                  ? 'translate-x-14 -translate-y-8 rotate-[30deg]'
                  : goalieCorner === 3
                  ? '-translate-x-12 translate-y-4 rotate-[-45deg]'
                  : goalieCorner === 4
                  ? 'translate-x-12 translate-y-4 rotate-[45deg]'
                  : 'translate-y-2'
              }`}
            >
              🧤
            </div>
          </div>

          {/* Chấm Phạt Đền 11m & Quả Bóng */}
          <div className="relative flex justify-center items-center pb-2">
            <div
              className={`text-3xl transition-all duration-700 transform ${
                isShooting && selectedCorner === 1
                  ? '-translate-y-28 -translate-x-14 scale-75'
                  : isShooting && selectedCorner === 2
                  ? '-translate-y-28 translate-x-14 scale-75'
                  : isShooting && selectedCorner === 3
                  ? '-translate-y-16 -translate-x-12 scale-75'
                  : isShooting && selectedCorner === 4
                  ? '-translate-y-16 translate-x-12 scale-75'
                  : 'animate-bounce'
              }`}
            >
              ⚽
            </div>
          </div>
        </div>

        {/* Hướng Dẫn Chọn Góc Sút */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 text-center">
          <p className="text-xs text-slate-300 font-bold mb-2">
            {t('games.penalty.choose_corner')}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {CORNERS.map((c) => (
              <button
                key={c.id}
                onClick={() => handleShoot(c.id)}
                disabled={isShooting}
                className="py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-emerald-600/30 border border-slate-700 hover:border-emerald-400 text-xs font-semibold text-slate-200 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black flex items-center justify-center">
                  {c.id}
                </span>
                <span>{t(c.labelKey)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 3. Cơ Cấu Giải Thưởng Động từ DB */}
        {gameConfig?.prizes && gameConfig.prizes.length > 0 && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3.5">
            <div className="flex items-center gap-2 mb-2">
              <HelpCircle className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-bold text-slate-200">
                {t('games.common.prizes_table_title')}
              </h4>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {gameConfig.prizes.map((p) => (
                <div
                  key={p.id}
                  className="p-2 rounded-xl bg-slate-800/40 border border-slate-700/40 text-center"
                >
                  <span className="text-lg block mb-0.5">{p.iconSymbol || '⚽'}</span>
                  <p className="text-[10px] font-semibold text-slate-300 truncate">{p.prizeName}</p>
                  <p className="text-[10px] font-bold text-emerald-400">+{p.prizeValue}đ</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Security Stamp */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>{t('footer.enterprise_security')}</span>
        </div>
      </main>

      {/* 4. Modal Kết Quả */}
      {showResultModal && gameResult && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-emerald-500/40 rounded-3xl p-6 max-w-xs w-full text-center shadow-2xl space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 mx-auto flex items-center justify-center text-3xl">
              {gameOutcome === 'WIN' ? '🏆' : '🧤'}
            </div>

            <div>
              <h3 className="text-base font-extrabold text-white">
                {gameOutcome === 'WIN'
                  ? t('games.penalty.goal_text')
                  : t('games.penalty.saved_text')}
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                {gameResult.message}
              </p>
            </div>

            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3">
              <span className="text-xs text-slate-400">{t('games.common.points_won', { points: '' })}</span>
              <p className="text-xl font-black text-emerald-400">
                +{gameResult.pointsAwarded || 0} Điểm
              </p>
            </div>

            <button
              onClick={handleReset}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
            >
              {t('games.common.btn_play_again')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
