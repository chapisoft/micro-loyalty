import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Gamepad2,
  Sparkles,
  HelpCircle,
  Trophy,
  Zap,
  PlusCircle,
  Flame,
  Award,
  Gift
} from 'lucide-react';
import { LoyaltyJSBridge } from '../bridge/LoyaltyJSBridge';
import { LiveWinnerTicker } from '../components/gamification/LiveWinnerTicker';
import { MegaJackpotBanner } from '../components/gamification/MegaJackpotBanner';
import { DailyMissionModal } from '../components/gamification/DailyMissionModal';
import { ComboStreakBadge } from '../components/gamification/ComboStreakBadge';
import { GameCoverArt } from '../components/game-assets/GameArtAssets';

export interface GameHubPageProps {
  onBack?: () => void;
  onSelectGame: (gameId: 'WHEEL' | 'FLAPPY' | 'GAME2048' | 'MEMORY' | 'BUBBLE' | 'FRUIT' | 'KNIFE' | 'BLOCK' | 'RUNNER' | 'WORDLE') => void;
  freeTurns?: number;
  perpetualTurns?: number;
  points?: number;
  onUpdateTurns?: (newFree: number, newPerpetual: number) => void;
}

interface GameHubItem {
  id: string;
  name: string;
  category: string;
  categoryLabel: string;
  icon: string;
  bgGradient: string;
  badge?: string;
  badgeBg?: string;
  perk?: string;
  description: string;
  action: () => void;
}

const LEADERBOARD_USERS = [
  { rank: 1, name: 'Nguyễn Văn A', phone: '0987***123', points: 15400, avatar: '👑', badge: 'Quán Quân' },
  { rank: 2, name: 'Jean Baptiste', phone: '5093***456', points: 12850, avatar: '🥈', badge: 'Á Quân' },
  { rank: 3, name: 'Trần Thị M', phone: '0912***789', points: 10200, avatar: '🥉', badge: 'Top 3' },
  { rank: 4, name: 'Pierre Louis', phone: '5094***888', points: 8900, avatar: '⭐', badge: 'Top 10' },
  { rank: 5, name: 'Lê Hoàng K', phone: '0977***999', points: 7650, avatar: '✨', badge: 'Top 10' },
];

export const GameHubPage: React.FC<GameHubPageProps> = ({
  onSelectGame,
  freeTurns = 2,
  perpetualTurns = 5,
  points: _points = 2480,
  onUpdateTurns,
}) => {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [showBuyModal, setShowBuyModal] = useState<boolean>(false);
  const [showMissionModal, setShowMissionModal] = useState<boolean>(false);
  const [winStreak] = useState<number>(3);

  const handleBuyTurn = async (turnsCount: number = 1, amountHtg: number = 20) => {
    try {
      const res = await LoyaltyJSBridge.requestPayment({
        amount: amountHtg,
        itemCode: `BUY_SPIN_${turnsCount}_TURNS`,
        itemName: `Mua ${turnsCount} Lượt Chơi GameHub`,
        transactionRef: 'GAMEHUB_' + Date.now(),
      });
      if (res.success) {
        if (onUpdateTurns) {
          onUpdateTurns(freeTurns, perpetualTurns + turnsCount);
        }
        setShowBuyModal(false);
      }
    } catch {
      if (onUpdateTurns) {
        onUpdateTurns(freeTurns, perpetualTurns + turnsCount);
      }
      setShowBuyModal(false);
    }
  };

  const handleClaimMissionTurns = (addedTurns: number, _addedPoints: number) => {
    if (onUpdateTurns) {
      onUpdateTurns(freeTurns + addedTurns, perpetualTurns);
    }
  };

  // Comprehensive 10-Game Catalog (1 Lucky Wheel + 9 Proven HTML5 Classics)
  const GAMES_LIST: GameHubItem[] = [
    {
      id: 'WHEEL',
      name: t('gamehub.game1_name', { defaultValue: 'Vòng Quay Tri Ân' }),
      category: 'LUCKY',
      categoryLabel: t('gamehub.cat_lucky', { defaultValue: 'May Mắn' }),
      icon: '🎡',
      bgGradient: 'bg-gradient-to-br from-amber-500 via-orange-500 to-yellow-500',
      badge: 'HOT',
      badgeBg: 'bg-red-600',
      perk: freeTurns > 0 ? `${freeTurns} Free` : '20 HTG',
      description: t('gamehub.game1_desc', { defaultValue: 'Vòng quay may mắn 100% trúng quà: Điểm Loyalty, tiền mặt và Voucher.' }),
      action: () => onSelectGame('WHEEL'),
    },
    {
      id: 'FLAPPY',
      name: t('games.flappy.title', { defaultValue: 'Flappy Natcom' }),
      category: 'SKILL',
      categoryLabel: t('gamehub.cat_skill', { defaultValue: 'Phản Xạ' }),
      icon: '🕊️',
      bgGradient: 'bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700',
      badge: 'NEW',
      badgeBg: 'bg-emerald-600',
      perk: 'Data 4G',
      description: t('games.flappy.subtitle', { defaultValue: 'Điều khiển chú chim bay vượt cột sóng 4G Natcom, nhặt xu vàng nhận quà khủng!' }),
      action: () => onSelectGame('FLAPPY'),
    },
    {
      id: 'GAME2048',
      name: t('games.game2048.title', { defaultValue: '2048 Natcash' }),
      category: 'PUZZLE',
      categoryLabel: t('gamehub.cat_puzzle', { defaultValue: 'Trí Tuệ' }),
      icon: '🔢',
      bgGradient: 'bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-600',
      badge: '2048 HTG',
      badgeBg: 'bg-amber-600',
      perk: t('gamehub.perk_merge', { defaultValue: 'Gộp Tiền' }),
      description: t('games.game2048.subtitle', { defaultValue: 'Ghép các mệnh giá tiền Gourde HTG & biểu tượng Natcom để đạt mốc 2048!' }),
      action: () => onSelectGame('GAME2048'),
    },
    {
      id: 'MEMORY',
      name: t('games.memory.title', { defaultValue: 'Lật Thẻ Tìm Cặp' }),
      category: 'PUZZLE',
      categoryLabel: t('gamehub.cat_puzzle', { defaultValue: 'Trí Tuệ' }),
      icon: '🃏',
      bgGradient: 'bg-gradient-to-br from-purple-600 via-indigo-600 to-pink-600',
      badge: t('gamehub.badge_45s', { defaultValue: '45 Giây' }),
      badgeBg: 'bg-purple-600',
      perk: 'Delimart',
      description: t('games.memory.subtitle', { defaultValue: 'Khám phá các cặp logo đối tác Delimart, TotalEnergies, Natcom trong 45 giây!' }),
      action: () => onSelectGame('MEMORY'),
    },
    {
      id: 'BUBBLE',
      name: t('games.bubble.title', { defaultValue: 'Bắn Bóng Kanaval' }),
      category: 'CASUAL',
      categoryLabel: t('gamehub.cat_casual', { defaultValue: 'Giải Trí' }),
      icon: '🔮',
      bgGradient: 'bg-gradient-to-br from-pink-500 via-rose-600 to-amber-500',
      badge: t('gamehub.badge_jackpot', { defaultValue: 'NỔ HŨ' }),
      badgeBg: 'bg-pink-600',
      perk: 'Combo x5',
      description: t('games.bubble.subtitle', { defaultValue: 'Súng thần công ngắm bắn vỡ cụm 3 bóng rực rỡ lễ hội Kanaval Haiti!' }),
      action: () => onSelectGame('BUBBLE'),
    },
    {
      id: 'FRUIT',
      name: t('games.fruit.title', { defaultValue: 'Chém Hoa Quả' }),
      category: 'SKILL',
      categoryLabel: t('gamehub.cat_skill', { defaultValue: 'Phản Xạ' }),
      icon: '🥭',
      bgGradient: 'bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600',
      badge: t('gamehub.badge_slash', { defaultValue: 'VUNG KIẾM' }),
      badgeBg: 'bg-emerald-600',
      perk: 'Caribe',
      description: t('games.fruit.subtitle', { defaultValue: 'Vuốt tay chém hoa quả nhiệt đới xoài Francisque, dừa, dứa, né bom bẫy!' }),
      action: () => onSelectGame('FRUIT'),
    },
    {
      id: 'KNIFE',
      name: t('games.knife.title', { defaultValue: 'Phi Dao Gỗ' }),
      category: 'SKILL',
      categoryLabel: t('gamehub.cat_skill', { defaultValue: 'Phản Xạ' }),
      icon: '🗡️',
      bgGradient: 'bg-gradient-to-br from-amber-600 via-orange-600 to-red-700',
      badge: t('gamehub.badge_red_envelope', { defaultValue: 'LÌ XÌ' }),
      badgeBg: 'bg-red-600',
      perk: t('gamehub.perk_fortune', { defaultValue: 'Thần Tài' }),
      description: t('games.knife.subtitle', { defaultValue: 'Căn nhịp phi dao cắm bia gỗ xoay tròn trúng phong bao lì xì và gói Data!' }),
      action: () => onSelectGame('KNIFE'),
    },
    {
      id: 'BLOCK',
      name: t('games.block.title', { defaultValue: 'Xếp Gạch Kim Cương' }),
      category: 'PUZZLE',
      categoryLabel: t('gamehub.cat_puzzle', { defaultValue: 'Trí Tuệ' }),
      icon: '💎',
      bgGradient: 'bg-gradient-to-br from-blue-600 via-cyan-600 to-indigo-700',
      badge: t('gamehub.badge_8x8', { defaultValue: '8x8 LƯỚI' }),
      badgeBg: 'bg-cyan-600',
      perk: t('gamehub.perk_diamond', { defaultValue: 'Kim Cương' }),
      description: t('games.block.subtitle', { defaultValue: 'Kéo thả khối gạch đá quý lấp đầy hàng ngang hoặc cột dọc để kích nổ điểm!' }),
      action: () => onSelectGame('BLOCK'),
    },
    {
      id: 'RUNNER',
      name: t('games.runner.title', { defaultValue: 'Đường Đua Siêu Tốc' }),
      category: 'SKILL',
      categoryLabel: t('gamehub.cat_skill', { defaultValue: 'Phản Xạ' }),
      icon: '🏃',
      bgGradient: 'bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500',
      badge: 'TAP-TAP',
      badgeBg: 'bg-orange-600',
      perk: t('gamehub.perk_speed', { defaultValue: 'Siêu Tốc' }),
      description: t('games.runner.subtitle', { defaultValue: 'Nhảy và trượt né xe buýt Tap-Tap, nhặt tiền vàng trên đường phố Haiti!' }),
      action: () => onSelectGame('RUNNER'),
    },
    {
      id: 'WORDLE',
      name: t('games.wordle.title', { defaultValue: 'Đoán Chữ May Mắn' }),
      category: 'PUZZLE',
      categoryLabel: t('gamehub.cat_puzzle', { defaultValue: 'Trí Tuệ' }),
      icon: '🔤',
      bgGradient: 'bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700',
      badge: t('gamehub.badge_5_letters', { defaultValue: '5 CHỮ CÁI' }),
      badgeBg: 'bg-violet-600',
      perk: 'Kreyòl/Fr',
      description: t('games.wordle.subtitle', { defaultValue: 'Đoán từ vựng bí ẩn 5 chữ cái trong 6 lần thử để nhận điểm thưởng!' }),
      action: () => onSelectGame('WORDLE'),
    },
  ];

  const filteredGames = GAMES_LIST.filter(
    (g) => selectedCategory === 'ALL' || g.category === selectedCategory
  );

  return (
    <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 py-3 sm:py-6 space-y-4 sm:space-y-6 animate-fade-in">
      {/* ── 0. REALTIME LIVE WINNER TICKER ── */}
      <LiveWinnerTicker />

      {/* ── TOP HERO: TURN BALANCES & FAST RECHARGE ── */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 rounded-3xl p-4 sm:p-7 text-white shadow-xl shadow-amber-500/15 relative overflow-hidden isolate">
        {/* Glows */}
        <div className="absolute inset-0 bg-gradient-to-t from-amber-950/20 via-transparent to-white/20 pointer-events-none" />
        <div className="absolute top-0 right-0 w-48 h-48 bg-radial from-white/25 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest bg-black/20 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/20">
                GAMEHUB CENTER
              </span>
              <span className="text-[9px] sm:text-[10px] font-bold bg-white/25 px-2 py-0.5 rounded-full">
                {t('gamehub.games_count', { count: GAMES_LIST.length, defaultValue: `${GAMES_LIST.length} Trò Chơi` })}
              </span>
              <ComboStreakBadge streak={winStreak} />
            </div>
            <h1 className="text-lg sm:text-2xl md:text-3xl font-black mt-1 tracking-tight">
              {t('gamehub.title')}
            </h1>
            <p className="text-xs text-amber-50/90 max-w-xl mt-0.5 hidden sm:block">
              {t('gamehub.subtitle')}
            </p>
          </div>

          {/* Turn Balances Card */}
          <div className="bg-black/20 backdrop-blur-xl p-2.5 sm:p-4 rounded-2xl border border-white/20 flex items-center justify-between md:justify-start gap-2.5 sm:gap-4 shrink-0">
            <div>
              <span className="text-[9px] sm:text-[10px] text-amber-100 uppercase tracking-wide font-medium block">
                {t('gamehub.free_daily_turns')}
              </span>
              <div className="text-lg sm:text-2xl font-black text-yellow-200 font-mono leading-tight">
                {freeTurns} <span className="text-xs text-white/80 font-normal">{t('gamehub.unit_turns', { defaultValue: 'lượt' })}</span>
              </div>
            </div>

            <div className="h-7 w-px bg-white/20" />

            <div>
              <span className="text-[9px] sm:text-[10px] text-amber-100 uppercase tracking-wide font-medium block">
                {t('gamehub.perpetual_turns')}
              </span>
              <div className="text-lg sm:text-2xl font-black text-white font-mono leading-tight">
                {perpetualTurns} <span className="text-xs text-white/80 font-normal">{t('gamehub.unit_turns', { defaultValue: 'lượt' })}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowMissionModal(true)}
                className="bg-amber-400/30 hover:bg-amber-400/40 text-yellow-200 border border-yellow-300/40 active:scale-95 font-black px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs flex items-center gap-1 shadow-sm transition animate-pulse"
                title={t('gamehub.btn_missions', { defaultValue: 'Nhiệm Vụ' })}
              >
                <Gift className="w-3.5 h-3.5 text-yellow-300" />
                <span>{t('gamehub.btn_missions', { defaultValue: 'Nhiệm Vụ' })}</span>
              </button>

              <button
                onClick={() => setShowBuyModal(true)}
                className="bg-white text-slate-950 hover:bg-amber-50 active:scale-95 font-black px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs flex items-center gap-1 shadow-md transition"
                title={t('gamehub.btn_buy_turns')}
              >
                <PlusCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>{t('gamehub.btn_buy_turns', { defaultValue: 'Nạp Lượt' })}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── MEGA JACKPOT PROGRESSIVE POOL ── */}
      <MegaJackpotBanner />

      {/* ── CATEGORY FILTER PILLS (COMPACT, NO SCROLLBAR) ── */}
      <div className="flex items-center space-x-1.5 sm:space-x-2 overflow-x-auto pb-1 no-scrollbar [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {[
          { key: 'ALL', label: t('gamehub.filter_all', { defaultValue: 'Tất Cả' }), icon: Gamepad2, count: GAMES_LIST.length },
          { key: 'LUCKY', label: t('gamehub.filter_lucky', { defaultValue: 'May Mắn' }), icon: Sparkles, count: GAMES_LIST.filter((g) => g.category === 'LUCKY').length },
          { key: 'SKILL', label: t('gamehub.filter_skill', { defaultValue: 'Phản Xạ' }), icon: Flame, count: GAMES_LIST.filter((g) => g.category === 'SKILL').length },
          { key: 'PUZZLE', label: t('gamehub.filter_quiz', { defaultValue: 'Trí Tuệ' }), icon: HelpCircle, count: GAMES_LIST.filter((g) => g.category === 'PUZZLE').length },
          { key: 'CASUAL', label: t('gamehub.filter_casual', { defaultValue: 'Giải Trí' }), icon: Zap, count: GAMES_LIST.filter((g) => g.category === 'CASUAL').length },
        ].map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition flex items-center space-x-1.5 active:scale-95 shrink-0 ${
                isSelected
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black shadow-md shadow-orange-500/20'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 shadow-xs'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-slate-950/20 text-slate-950 font-black' : 'bg-slate-100 text-slate-500'}`}>
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── HIGH-DENSITY 3-COLUMN RESPONSIVE GAME GRID (MOBILE: 3/ROW, TABLET: 4/ROW, DESKTOP: 6/ROW) ── */}
      <div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2.5 sm:gap-3.5">
          {filteredGames.map((game) => (
            <div
              key={game.id}
              onClick={game.action}
              className="group flex flex-col items-center bg-white rounded-3xl p-1.5 sm:p-2 border border-slate-100/90 shadow-xs hover:shadow-xl hover:border-amber-400 hover:-translate-y-1.5 active:scale-95 transition-all duration-200 cursor-pointer relative select-none"
            >
              {/* Full-Bleed Square Game Tile with Giant Icon (Occupying 80% height) */}
              <div className={`w-full aspect-square rounded-2xl sm:rounded-3xl ${game.bgGradient} flex items-center justify-center relative overflow-hidden shadow-inner group-hover:shadow-xl transition-all duration-300 border border-white/25`}>
                
                {/* Radial Ambient Glow */}
                <div className="absolute inset-0 bg-radial from-white/35 via-transparent to-black/25 pointer-events-none" />
                <div className="absolute -top-10 -right-10 w-24 h-24 bg-white/30 rounded-full blur-xl pointer-events-none" />

                {/* Floating Top Badge */}
                {game.badge && (
                  <span className={`absolute top-1.5 left-1.5 ${game.badgeBg || 'bg-red-600'} text-white text-[8px] sm:text-[9px] font-black px-1.5 sm:px-2 py-0.5 rounded-full uppercase tracking-tight shadow-md z-10 leading-none`}>
                    {game.badge}
                  </span>
                )}

                {/* 3D High-End Vector Art Cover (Replacing generic emoji) */}
                <div className="relative z-0 w-full h-full flex items-center justify-center p-1.5 group-hover:scale-105 transition-all duration-300 select-none">
                  <GameCoverArt gameId={game.id} className="w-full h-full object-contain drop-shadow-xl" />
                </div>

                {/* Floating Bottom Perk Tag */}
                {game.perk && (
                  <span className="absolute bottom-1.5 right-1.5 bg-slate-950/85 backdrop-blur-md text-amber-300 text-[8px] sm:text-[9px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-lg border border-white/20 shadow-md z-10 leading-none">
                    {game.perk}
                  </span>
                )}
              </div>

              {/* Game Title & Category */}
              <div className="w-full text-center mt-1.5 px-0.5 pb-1">
                <h4 className="text-[11px] sm:text-xs font-black text-slate-800 group-hover:text-amber-600 line-clamp-1 leading-tight tracking-tight">
                  {game.name}
                </h4>
                <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium block mt-0.5 line-clamp-1">
                  {game.categoryLabel}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SECTION: TURN PACKAGES & LEADERBOARD ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-start pt-2">
        {/* Left: Turn Packages Shop */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-sm space-y-3 sm:space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-black text-xs sm:text-base text-slate-900 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500" /> {t('gamehub.turn_shop_title')}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-slate-500">{t('gamehub.turn_shop_subtitle')}</p>
            </div>
            <span className="text-[9px] sm:text-[10px] bg-amber-50 text-amber-900 font-bold px-2 py-0.5 rounded-full border border-amber-200">
              Ví Phần Thưởng
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div
              onClick={() => handleBuyTurn(1, 20)}
              className="p-2.5 sm:p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 cursor-pointer active:scale-95 transition flex flex-col justify-between shadow-xs"
            >
              <span className="text-[11px] sm:text-xs font-black text-slate-800">{t('wheel.pack_1_turn')}</span>
              <span className="text-xs text-amber-600 font-mono font-black mt-2">20 HTG</span>
            </div>

            <div
              onClick={() => handleBuyTurn(5, 100)}
              className="p-2.5 sm:p-3 rounded-2xl bg-amber-50 hover:bg-amber-100/60 border border-amber-300 cursor-pointer active:scale-95 transition flex flex-col justify-between shadow-xs"
            >
              <div className="flex justify-center">
                <span className="text-[8px] sm:text-[9px] bg-amber-500 text-slate-950 font-black px-1.5 rounded-full">
                  {t('wheel.bonus_1')}
                </span>
              </div>
              <span className="text-[11px] sm:text-xs font-black text-amber-950 mt-1">{t('wheel.pack_5_turns')}</span>
              <span className="text-xs text-amber-700 font-mono font-black mt-1">100 HTG</span>
            </div>

            <div
              onClick={() => handleBuyTurn(10, 180)}
              className="p-2.5 sm:p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100/60 border border-emerald-300 cursor-pointer active:scale-95 transition flex flex-col justify-between shadow-xs"
            >
              <div className="flex justify-center">
                <span className="text-[8px] sm:text-[9px] bg-emerald-500 text-white font-black px-1.5 rounded-full">
                  {t('wheel.save_10')}
                </span>
              </div>
              <span className="text-[11px] sm:text-xs font-black text-emerald-950 mt-1">{t('wheel.pack_10_turns')}</span>
              <span className="text-xs text-emerald-700 font-mono font-black mt-1">180 HTG</span>
            </div>
          </div>
        </div>

        {/* Right: Leaderboard */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-black text-xs sm:text-base text-slate-900 flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-500" /> {t('gamehub.leaderboard_title')}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-slate-500">{t('gamehub.leaderboard_subtitle')}</p>
            </div>
            <span className="text-[9px] sm:text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Award className="w-3 h-3" /> Tuần Này
            </span>
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            {LEADERBOARD_USERS.map((user) => (
              <div
                key={user.rank}
                className="p-2 sm:p-2.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
              >
                <div className="flex items-center space-x-2.5">
                  <span className="w-6 h-6 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-black text-xs text-slate-800 shrink-0">
                    {user.avatar}
                  </span>
                  <div>
                    <div className="font-bold text-slate-900 flex items-center gap-1.5 text-[11px] sm:text-xs">
                      <span>{user.name}</span>
                      <span className="text-[9px] sm:text-[10px] font-normal text-slate-400 font-mono">({user.phone})</span>
                    </div>
                    <span className="text-[9px] sm:text-[10px] text-amber-600 font-semibold">{user.badge}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-black text-amber-600 font-mono text-[11px] sm:text-xs">
                    +{user.points.toLocaleString()}đ
                  </div>
                  <span className="text-[8px] sm:text-[9px] text-slate-400">Điểm Thưởng</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FAST BUY TURNS MODAL ── */}
      {showBuyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-sm w-full border border-slate-200 shadow-2xl relative space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-sm sm:text-base">{t('gamehub.turn_shop_title')}</h3>
              <button
                onClick={() => setShowBuyModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-500">{t('gamehub.turn_shop_subtitle')}</p>
            <div className="space-y-2">
              <button
                onClick={() => handleBuyTurn(1, 20)}
                className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 font-black text-xs text-slate-800 flex justify-between items-center transition"
              >
                <span>{t('wheel.pack_1_turn')}</span>
                <span className="text-amber-600 font-mono">20 HTG</span>
              </button>
              <button
                onClick={() => handleBuyTurn(5, 100)}
                className="w-full p-3 rounded-2xl bg-amber-50 hover:bg-amber-100/60 border border-amber-300 font-black text-xs text-amber-950 flex justify-between items-center transition"
              >
                <div className="text-left">
                  <span>{t('wheel.pack_5_turns')}</span>
                  <span className="ml-2 text-[9px] bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded-full">
                    {t('wheel.bonus_1')}
                  </span>
                </div>
                <span className="text-amber-700 font-mono">100 HTG</span>
              </button>
              <button
                onClick={() => handleBuyTurn(10, 180)}
                className="w-full p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100/60 border border-emerald-300 font-black text-xs text-emerald-950 flex justify-between items-center transition"
              >
                <div className="text-left">
                  <span>{t('wheel.pack_10_turns')}</span>
                  <span className="ml-2 text-[9px] bg-emerald-500 text-white px-1.5 py-0.2 rounded-full">
                    {t('wheel.save_10')}
                  </span>
                </div>
                <span className="text-emerald-700 font-mono">180 HTG</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DAILY MISSION REWARD MODAL ── */}
      <DailyMissionModal
        isOpen={showMissionModal}
        onClose={() => setShowMissionModal(false)}
        onClaimTurns={handleClaimMissionTurns}
      />
    </div>
  );
};

export default GameHubPage;
