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
  Compass
} from 'lucide-react';
import { LoyaltyApi, GameDetailData } from '../../services/api';
import { soundManager } from '../../utils/audio';

interface TreasureChestGameProps {
  onBack?: () => void;
  onClaimReward?: (points: number) => void;
}

const CHEST_LABELS = [
  'Rương Ngọc Biển',
  'Rương San Hô',
  'Rương Thuyền Trưởng',
  'Rương Đảo Hoang',
  'Rương Vàng Hải Tặc',
];

export const TreasureChestGame: React.FC<TreasureChestGameProps> = ({ onBack, onClaimReward }) => {
  const { t } = useTranslation();
  const [gameConfig, setGameConfig] = useState<GameDetailData | null>(null);
  const [selectedChest, setSelectedChest] = useState<number | null>(null);
  const [isOpening, setIsOpening] = useState<boolean>(false);
  const [gameResult, setGameResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showResultModal, setShowResultModal] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(soundManager.getMuted());
  const [userBalance, setUserBalance] = useState<number>(0);
  const [remainingTurns, setRemainingTurns] = useState<number>(1);

  // 1. Nạp cấu hình ma trận giải thưởng động từ Cơ sở dữ liệu
  useEffect(() => {
    LoyaltyApi.getGameDetail('TREASURE_CHEST')
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

  const handleOpenChest = async (chestId: number) => {
    if (isOpening) return;
    try {
      soundManager.playChestOpen();
      setSelectedChest(chestId);
      setIsOpening(true);
      setErrorMsg(null);

      const res = await LoyaltyApi.playGame('TREASURE_CHEST', chestId);
      setGameResult(res);

      if (res.newPointBalance !== undefined) {
        setUserBalance(Number(res.newPointBalance));
      }
      if (res.turnsRemaining !== undefined) {
        setRemainingTurns(res.turnsRemaining);
      }

      if (navigator.vibrate) navigator.vibrate([80, 40, 150]);

      setTimeout(() => {
        const points = Number(res.pointsAwarded || 0);
        if (points >= 150) {
          soundManager.playJackpot();
        } else if (points > 0) {
          soundManager.playWinFanfare();
        } else {
          soundManager.playLose();
        }

        setShowResultModal(true);
        if (res.pointsAwarded && onClaimReward) {
          onClaimReward(points);
        }
        setIsOpening(false);
      }, 900);
    } catch (e: any) {
      soundManager.playLose();
      setErrorMsg(e.message || t('common.error_occurred'));
      setIsOpening(false);
    }
  };

  const handleReset = () => {
    soundManager.playTap();
    setSelectedChest(null);
    setGameResult(null);
    setShowResultModal(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans select-none pb-12">
      {/* 1. Header Bar */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-cyan-500/20 px-4 py-3 flex items-center justify-between">
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
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold text-lg shadow-sm">
            🏴‍☠️
          </div>
          <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-cyan-200 to-teal-400 bg-clip-text text-transparent">
            {gameConfig?.gameName || t('games.chest.title')}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleSound}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 transition-all text-cyan-400"
            title={isMuted ? t('games.common.sound_off') : t('games.common.sound_on')}
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-slate-400" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-1 bg-cyan-500/10 border border-cyan-500/30 rounded-xl px-2.5 py-1">
            <Coins className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-cyan-300">{userBalance}đ</span>
          </div>
        </div>
      </header>

      {/* 2. Main Island View */}
      <main className="max-w-md mx-auto w-full px-4 py-4 flex-1 flex flex-col justify-between space-y-4">
        {/* Banner Info */}
        <div className="w-full text-center">
          <p className="text-xs text-slate-300 max-w-xs mx-auto">
            {gameConfig?.description || t('games.chest.subtitle')}
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/90 border border-slate-700 text-[11px] text-cyan-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('games.common.remaining_turns', { turns: remainingTurns })}</span>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs text-center">
            {errorMsg}
          </div>
        )}

        {/* Khung Cảnh Vùng Vịnh & 5 Rương Kho Báu */}
        <div className="relative bg-gradient-to-b from-cyan-950 via-teal-950 to-slate-900 rounded-3xl p-5 border-2 border-cyan-500/40 shadow-2xl overflow-hidden space-y-4">
          <div className="flex items-center justify-between text-xs text-cyan-300 font-bold border-b border-cyan-500/20 pb-2">
            <span className="flex items-center gap-1">
              <Compass className="w-4 h-4 text-cyan-400 animate-spin" /> Vùng Vịnh Caribe
            </span>
            <span className="bg-cyan-500/20 px-2.5 py-0.5 rounded-full border border-cyan-400/30">
              5 Rương Cổ
            </span>
          </div>

          <div className="text-center text-xs text-cyan-200 font-medium">
            {t('games.chest.choose_chest')}
          </div>

          {/* Lưới 5 Rương Báu */}
          <div className="grid grid-cols-2 gap-3.5 pt-2">
            {[1, 2, 3, 4, 5].map((chestId, idx) => {
              const isSelected = selectedChest === chestId;
              const isLast = idx === 4;

              return (
                <button
                  key={chestId}
                  onClick={() => handleOpenChest(chestId)}
                  disabled={isOpening}
                  className={`${
                    isLast ? 'col-span-2 mx-auto w-1/2' : 'w-full'
                  } group relative p-4 rounded-2xl transition-all duration-300 flex flex-col items-center justify-center gap-2 border-2 ${
                    isSelected
                      ? 'bg-gradient-to-b from-cyan-600/40 to-teal-900 border-cyan-400 scale-105 shadow-xl shadow-cyan-500/30'
                      : 'bg-slate-900/80 border-cyan-500/30 hover:border-cyan-400 active:scale-95 hover:bg-slate-800'
                  }`}
                >
                  <div
                    className={`text-4xl transition-transform duration-500 filter drop-shadow-md ${
                      isSelected && isOpening
                        ? 'animate-bounce scale-125'
                        : isSelected
                        ? 'scale-110'
                        : 'group-hover:scale-110'
                    }`}
                  >
                    {isSelected ? '💎' : '🎁'}
                  </div>
                  <span className="text-[11px] font-bold text-cyan-200">
                    {CHEST_LABELS[idx] || `Rương ${chestId}`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Cơ Cấu Giải Thưởng Động từ DB */}
        {gameConfig?.prizes && gameConfig.prizes.length > 0 && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3.5">
            <div className="flex items-center gap-2 mb-2">
              <HelpCircle className="w-4 h-4 text-cyan-400" />
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
                  <span className="text-base">{p.iconSymbol || '💎'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-slate-300 truncate">{p.prizeName}</p>
                    <p className="text-[10px] font-bold text-cyan-400">+{p.prizeValue}đ</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Security Stamp */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span>{t('footer.enterprise_security')}</span>
        </div>
      </main>

      {/* 4. Modal Kết Quả */}
      {showResultModal && gameResult && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-cyan-500/40 rounded-3xl p-6 max-w-xs w-full text-center shadow-2xl space-y-4">
            <div className="w-16 h-16 rounded-full bg-cyan-500/20 border-2 border-cyan-500/40 mx-auto flex items-center justify-center text-3xl animate-bounce">
              💎
            </div>

            <div>
              <h3 className="text-base font-extrabold text-white">
                {t('games.common.congratulations')}
              </h3>
              <p className="text-xs text-cyan-300 mt-1">
                {gameResult.message}
              </p>
            </div>

            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-2xl p-3">
              <span className="text-xs text-slate-400">{t('games.common.points_won', { points: '' })}</span>
              <p className="text-xl font-black text-cyan-400">
                +{gameResult.pointsAwarded || 0} Điểm
              </p>
            </div>

            <button
              onClick={handleReset}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
            >
              {t('games.chest.btn_again')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
