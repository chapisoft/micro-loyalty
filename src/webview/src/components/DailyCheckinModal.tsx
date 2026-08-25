import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Check, Gift, Sparkles, Trophy } from 'lucide-react';
import { soundHaptics } from '../utils/soundHaptics';

interface DailyCheckinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClaimReward: (pointsAwarded: number, dayNumber: number) => void;
  currentStreakDays?: number;
  hasCheckedInToday?: boolean;
}

const CHECKIN_REWARDS = [
  { day: 1, points: 10, label: '+10 Điểm' },
  { day: 2, points: 20, label: '+20 Điểm' },
  { day: 3, points: 30, label: '+30 Điểm' },
  { day: 4, points: 40, label: '+40 Điểm' },
  { day: 5, points: 50, label: '+50 Điểm' },
  { day: 6, points: 80, label: '+80 Điểm' },
  { day: 7, points: 200, label: 'RƯƠNG VÀNG: +200 Điểm & Voucher', isChest: true },
];

export const DailyCheckinModal: React.FC<DailyCheckinModalProps> = ({
  isOpen,
  onClose,
  onClaimReward,
  currentStreakDays = 1,
  hasCheckedInToday = false,
}) => {
  const { t } = useTranslation();
  const [streak, setStreak] = useState(currentStreakDays);
  const [checkedToday, setCheckedToday] = useState(hasCheckedInToday);
  const [claimedAnim, setClaimedAnim] = useState(false);

  useEffect(() => {
    setStreak(currentStreakDays);
    setCheckedToday(hasCheckedInToday);
  }, [currentStreakDays, hasCheckedInToday]);

  if (!isOpen) return null;

  const currentDayIndex = Math.min(streak, 7);

  const handleClaim = () => {
    if (checkedToday) return;
    const reward = CHECKIN_REWARDS[currentDayIndex - 1] || CHECKIN_REWARDS[0];
    
    if (reward.isChest) {
      soundHaptics.playVictoryFanfare();
    } else {
      soundHaptics.playCoinPickup();
    }

    setClaimedAnim(true);
    setCheckedToday(true);
    onClaimReward(reward.points, currentDayIndex);

    setTimeout(() => {
      setClaimedAnim(false);
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-amber-500/30 rounded-3xl p-6 shadow-2xl text-white overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-yellow-500/20 rounded-full blur-3xl" />

        {/* Header */}
        <div className="flex items-center justify-between mb-4 relative z-10">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center font-black text-xl shadow-lg">
              📅
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-amber-300">
                {t('checkin.title', { defaultValue: 'Chuỗi Điểm Danh 7 Ngày' })}
              </h3>
              <p className="text-xs text-slate-400">
                {t('checkin.subtitle', { defaultValue: 'Điểm danh mỗi ngày để mở Rương Báu Hoàng Kim' })}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundHaptics.playClick();
              onClose();
            }}
            className="p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 7-Day Grid */}
        <div className="grid grid-cols-4 gap-2.5 my-4 relative z-10">
          {CHECKIN_REWARDS.slice(0, 6).map((item) => {
            const isCompleted = item.day < streak || (item.day === streak && checkedToday);
            const isCurrent = item.day === streak && !checkedToday;

            return (
              <div
                key={item.day}
                className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border transition-all duration-300 relative ${
                  isCompleted
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                    : isCurrent
                    ? 'bg-gradient-to-b from-amber-500/25 to-yellow-500/10 border-amber-400 shadow-md shadow-amber-500/20 scale-105 animate-pulse'
                    : 'bg-slate-800/40 border-slate-700/50 text-slate-400 opacity-60'
                }`}
              >
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  {t('checkin.day_label', { day: item.day, defaultValue: `Ngày ${item.day}` })}
                </span>
                <div className="my-1 text-lg">
                  {isCompleted ? (
                    <div className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-black">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  ) : (
                    '🪙'
                  )}
                </div>
                <span className="text-[10px] font-black text-amber-200">+{item.points}đ</span>
              </div>
            );
          })}

          {/* Day 7 Chest (Spans 2 cols) */}
          <div
            className={`col-span-2 flex items-center justify-between p-3 rounded-2xl border transition-all duration-300 relative ${
              streak >= 7 && checkedToday
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                : streak >= 7 && !checkedToday
                ? 'bg-gradient-to-r from-amber-500/30 to-yellow-500/20 border-amber-400 shadow-lg shadow-amber-500/30 animate-bounce'
                : 'bg-slate-800/40 border-slate-700/50 text-slate-400 opacity-70'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <div className="text-2xl animate-spin-slow">🎁</div>
              <div>
                <div className="flex items-center space-x-1">
                  <span className="text-xs font-black text-amber-300 uppercase">
                    {t('checkin.day_7_chest', { defaultValue: 'Ngày 7: Rương Vàng' })}
                  </span>
                  <Sparkles className="w-3.5 h-3.5 text-yellow-400 animate-ping" />
                </div>
                <p className="text-[10px] text-amber-200 font-semibold">+200 Điểm & Voucher</p>
              </div>
            </div>
            {streak >= 7 && checkedToday ? (
              <div className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-black">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            ) : (
              <Trophy className="w-5 h-5 text-amber-400" />
            )}
          </div>
        </div>

        {/* Claim Success Notification */}
        {claimedAnim && (
          <div className="my-2 p-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-center font-extrabold text-sm shadow-xl animate-bounce">
            🎉 {t('checkin.claimed_success', { defaultValue: 'Điểm danh thành công! Đã cộng điểm vào tài khoản.' })}
          </div>
        )}

        {/* Action Button */}
        <div className="mt-4 relative z-10">
          <button
            onClick={handleClaim}
            disabled={checkedToday}
            className={`w-full py-3.5 px-4 rounded-2xl font-black text-sm uppercase tracking-wider transition duration-300 flex items-center justify-center space-x-2 shadow-lg ${
              checkedToday
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 hover:brightness-110 active:scale-98 shadow-amber-500/25 cursor-pointer'
            }`}
          >
            <Gift className="w-4 h-4" />
            <span>
              {checkedToday
                ? t('checkin.btn_checked', { defaultValue: 'ĐÃ ĐIỂM DANH HÔM NAY' })
                : t('checkin.btn_claim', { defaultValue: 'NHẬN THƯỞNG ĐIỂM DANH' })}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
