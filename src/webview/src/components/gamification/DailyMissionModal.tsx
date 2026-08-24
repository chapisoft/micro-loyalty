import React, { useState } from 'react';
import { X, Gift, CheckCircle2 } from 'lucide-react';
import { soundManager } from '../../utils/audio';

export interface DailyMissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClaimTurns: (addedTurns: number, addedPoints: number) => void;
}

interface MissionItem {
  id: string;
  title: string;
  desc: string;
  rewardTurns: number;
  rewardPoints: number;
  icon: string;
  progress: number;
  target: number;
  isClaimed: boolean;
}

export const DailyMissionModal: React.FC<DailyMissionModalProps> = ({
  isOpen,
  onClose,
  onClaimTurns,
}) => {
  const [missions, setMissions] = useState<MissionItem[]>([
    {
      id: 'LOGIN_DAILY',
      title: 'Điểm Danh Mỗi Ngày',
      desc: 'Mở ứng dụng GameHub nhận quà khởi động',
      rewardTurns: 1,
      rewardPoints: 20,
      icon: '📅',
      progress: 1,
      target: 1,
      isClaimed: false,
    },
    {
      id: 'PLAY_3_GAMES',
      title: 'Nhà Thám Hiểm GameHub',
      desc: 'Trải nghiệm 3 trò chơi bất kỳ hôm nay',
      rewardTurns: 2,
      rewardPoints: 50,
      icon: '🎮',
      progress: 2,
      target: 3,
      isClaimed: false,
    },
    {
      id: 'SHARE_WIN',
      title: 'Chia Sẻ Chiến Tích',
      desc: 'Khoe kết quả trúng thưởng với bạn bè',
      rewardTurns: 1,
      rewardPoints: 30,
      icon: '📣',
      progress: 1,
      target: 1,
      isClaimed: false,
    },
    {
      id: 'WALLET_TRANSACTION',
      title: 'Giao Dịch Ví Natcash',
      desc: 'Thực hiện thanh toán hoặc nạp tiền ví từ 50 HTG',
      rewardTurns: 5,
      rewardPoints: 200,
      icon: '💳',
      progress: 0,
      target: 1,
      isClaimed: false,
    },
  ]);

  if (!isOpen) return null;

  const handleClaim = (id: string, turns: number, points: number) => {
    soundManager.playWinFanfare();
    soundManager.playCoinRain();
    setMissions((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isClaimed: true } : m))
    );
    onClaimTurns(turns, points);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border border-amber-500/40 rounded-3xl p-5 shadow-2xl text-white">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60 hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
            <Gift className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-400">
              Trạm Nhiệm Vụ Săn Lượt
            </h3>
            <p className="text-xs text-slate-400">Hoàn thành nhiệm vụ mỗi ngày để nhận lượt chơi miễn phí!</p>
          </div>
        </div>

        {/* Missions List */}
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {missions.map((mission) => {
            const isCompleted = mission.progress >= mission.target;

            return (
              <div
                key={mission.id}
                className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between gap-3 hover:border-amber-500/30 transition"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{mission.icon}</span>
                  <div>
                    <div className="font-semibold text-sm text-slate-100 flex items-center gap-2">
                      {mission.title}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-tight">{mission.desc}</p>
                    <div className="flex items-center gap-2 mt-1.5 text-[10px]">
                      <span className="bg-amber-500/15 text-amber-400 font-bold px-2 py-0.5 rounded-md border border-amber-500/30">
                        +{mission.rewardTurns} Lượt Free
                      </span>
                      <span className="bg-emerald-500/15 text-emerald-400 font-bold px-2 py-0.5 rounded-md border border-emerald-500/30">
                        +{mission.rewardPoints} Điểm
                      </span>
                      <span className="text-slate-500">
                        ({mission.progress}/{mission.target})
                      </span>
                    </div>
                  </div>
                </div>

                {mission.isClaimed ? (
                  <span className="flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-800 px-3 py-1.5 rounded-xl">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Đã Nhận
                  </span>
                ) : isCompleted ? (
                  <button
                    onClick={() => handleClaim(mission.id, mission.rewardTurns, mission.rewardPoints)}
                    className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs px-3.5 py-1.5 rounded-xl shadow-lg shadow-amber-500/30 transition active:scale-95 animate-pulse"
                  >
                    Nhận Quà
                  </button>
                ) : (
                  <button
                    onClick={onClose}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs px-3 py-1.5 rounded-xl transition"
                  >
                    Thực Hiện
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-800 text-center">
          <p className="text-[11px] text-slate-500">
            Nhiệm vụ tự động làm mới vào lúc <span className="text-amber-400 font-bold">00:00 hàng ngày</span>.
          </p>
        </div>
      </div>
    </div>
  );
};
