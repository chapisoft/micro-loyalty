import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, Eye, Sparkles, Flame, Zap, RotateCcw, Award, ArrowRight } from 'lucide-react';
import { GameSounds } from '../../utils/audio';
import { GameHeader } from '../../components/common/GameHeader';
import { GameTutorialModal } from '../../components/common/GameTutorialModal';

export interface MemoryMatchGameProps {
  onBack: () => void;
  onClaimReward?: (pointsWon: number) => void;
}

interface CardDef {
  pairId: number;
  icon: string;
  label: string;
  bgGradient: string;
  accentColor: string;
}

interface CardItem {
  id: number;
  pairId: number;
  icon: string;
  label: string;
  bgGradient: string;
  accentColor: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export interface ThemeCategory {
  id: string;
  name: string;
  badge: string;
  icon: string;
  bgGradient: string;
  cards: CardDef[];
}

// ─────────────────────────────────────────────────────────────
// 21 DIVERSE, VIBRANT THEMATIC CARD DECKS (20+ CHỦ ĐỀ ĐẶC SẮC)
// ─────────────────────────────────────────────────────────────
export const ALL_THEMES: ThemeCategory[] = [
  // 1. Đối Tác & Ví Natcash
  {
    id: 'PARTNERS',
    name: 'Đối Tác & Ví Natcash',
    badge: 'Natcom Alliance',
    icon: '🏢',
    bgGradient: 'from-amber-500 to-orange-600',
    cards: [
      { pairId: 1, icon: '🛒', label: 'Delimart', bgGradient: 'from-amber-500 to-orange-600', accentColor: '#F59E0B' },
      { pairId: 2, icon: '⛽', label: 'Total', bgGradient: 'from-red-500 to-rose-600', accentColor: '#EF4444' },
      { pairId: 3, icon: '📡', label: 'Natcom 4G', bgGradient: 'from-blue-500 to-indigo-600', accentColor: '#3B82F6' },
      { pairId: 4, icon: '👑', label: 'Natcash', bgGradient: 'from-yellow-400 to-amber-500', accentColor: '#EAB308' },
      { pairId: 5, icon: '📱', label: 'Ví Tiền', bgGradient: 'from-emerald-500 to-teal-600', accentColor: '#10B981' },
      { pairId: 6, icon: '💳', label: 'Thẻ Kredi', bgGradient: 'from-purple-500 to-pink-600', accentColor: '#A855F7' },
      { pairId: 7, icon: '☀️', label: 'Solar 24/7', bgGradient: 'from-orange-400 to-amber-600', accentColor: '#F97316' },
      { pairId: 8, icon: '🏬', label: 'Siêu Thị', bgGradient: 'from-cyan-500 to-blue-600', accentColor: '#06B6D4' },
      { pairId: 9, icon: '🎁', label: 'Quà VIP', bgGradient: 'from-rose-500 to-pink-600', accentColor: '#F43F5E' },
      { pairId: 10, icon: '💎', label: 'Kim Cương', bgGradient: 'from-violet-500 to-purple-600', accentColor: '#8B5CF6' },
      { pairId: 11, icon: '🪙', label: 'Xu Vàng', bgGradient: 'from-yellow-500 to-amber-700', accentColor: '#EAB308' },
      { pairId: 12, icon: '📲', label: 'Mã QR', bgGradient: 'from-teal-500 to-emerald-700', accentColor: '#14B8A6' },
    ],
  },
  // 2. Lễ Hội Kanaval Caribe
  {
    id: 'CARNIVAL',
    name: 'Lễ Hội Kanaval Caribe',
    badge: 'Haitian Kanaval',
    icon: '🎭',
    bgGradient: 'from-pink-500 to-purple-600',
    cards: [
      { pairId: 1, icon: '🥁', label: 'Trống Rara', bgGradient: 'from-amber-500 to-red-600', accentColor: '#F59E0B' },
      { pairId: 2, icon: '🎭', label: 'Mặt Nạ', bgGradient: 'from-purple-500 to-pink-600', accentColor: '#A855F7' },
      { pairId: 3, icon: '🏴‍☠️', label: 'Rương Vàng', bgGradient: 'from-yellow-500 to-amber-700', accentColor: '#EAB308' },
      { pairId: 4, icon: '🏮', label: 'Hải Đăng', bgGradient: 'from-orange-500 to-rose-600', accentColor: '#F97316' },
      { pairId: 5, icon: '⛵', label: 'Thuyền Buồm', bgGradient: 'from-sky-500 to-blue-600', accentColor: '#0EA5E9' },
      { pairId: 6, icon: '🦪', label: 'Ngọc Trai', bgGradient: 'from-teal-400 to-emerald-600', accentColor: '#14B8A6' },
      { pairId: 7, icon: '🌴', label: 'Cọ Caribe', bgGradient: 'from-emerald-500 to-green-700', accentColor: '#10B981' },
      { pairId: 8, icon: '🦜', label: 'Vẹt Sặc Sỡ', bgGradient: 'from-lime-500 to-emerald-600', accentColor: '#84CC16' },
      { pairId: 9, icon: '🐬', label: 'Cá Heo', bgGradient: 'from-cyan-500 to-blue-700', accentColor: '#06B6D4' },
      { pairId: 10, icon: '👑', label: 'Vương Miện', bgGradient: 'from-yellow-400 to-amber-600', accentColor: '#EAB308' },
      { pairId: 11, icon: '🎺', label: 'Kèn Kanaval', bgGradient: 'from-rose-500 to-amber-600', accentColor: '#F43F5E' },
      { pairId: 12, icon: '🎆', label: 'Pháo Hoa', bgGradient: 'from-indigo-500 to-purple-700', accentColor: '#6366F1' },
    ],
  },
  // 3. Đá Quý & Thần Tài
  {
    id: 'GEMS',
    name: 'Đá Quý & Thần Tài',
    badge: 'Lucky Treasure',
    icon: '💎',
    bgGradient: 'from-cyan-500 to-blue-600',
    cards: [
      { pairId: 1, icon: '💎', label: 'Kim Cương', bgGradient: 'from-cyan-400 to-blue-600', accentColor: '#06B6D4' },
      { pairId: 2, icon: '🔴', label: 'Ruby Đỏ', bgGradient: 'from-rose-500 to-red-600', accentColor: '#F43F5E' },
      { pairId: 3, icon: '🟢', label: 'Lục Bảo', bgGradient: 'from-emerald-400 to-teal-600', accentColor: '#10B981' },
      { pairId: 4, icon: '🔮', label: 'Thạch Anh', bgGradient: 'from-purple-500 to-indigo-600', accentColor: '#A855F7' },
      { pairId: 5, icon: '🪙', label: 'Xu Vàng', bgGradient: 'from-amber-400 to-yellow-600', accentColor: '#F59E0B' },
      { pairId: 6, icon: '🔔', label: 'Chuông Vàng', bgGradient: 'from-yellow-400 to-orange-500', accentColor: '#EAB308' },
      { pairId: 7, icon: '⭐', label: 'Sao Vàng', bgGradient: 'from-amber-300 to-orange-500', accentColor: '#F59E0B' },
      { pairId: 8, icon: '🔥', label: 'Lửa Thần', bgGradient: 'from-orange-500 to-red-600', accentColor: '#F97316' },
      { pairId: 9, icon: '🍀', label: 'Cỏ 4 Lá', bgGradient: 'from-green-400 to-emerald-600', accentColor: '#22C55E' },
      { pairId: 10, icon: '💖', label: 'Trái Tim', bgGradient: 'from-pink-500 to-rose-600', accentColor: '#EC4899' },
      { pairId: 11, icon: '🔱', label: 'Đinh Ba Thần', bgGradient: 'from-blue-400 to-cyan-600', accentColor: '#38BDF8' },
      { pairId: 12, icon: '🧿', label: 'Mắt Thần', bgGradient: 'from-indigo-400 to-violet-600', accentColor: '#818CF8' },
    ],
  },
  // 4. Ẩm Thực Đường Phố Haiti
  {
    id: 'HAITI_FOOD',
    name: 'Ẩm Thực Đường Phố Haiti',
    badge: 'Creole Flavors',
    icon: '🍲',
    bgGradient: 'from-amber-600 to-red-600',
    cards: [
      { pairId: 1, icon: '🍖', label: 'Heo Griot', bgGradient: 'from-amber-600 to-orange-700', accentColor: '#D97706' },
      { pairId: 2, icon: '🥟', label: 'Bánh Paté', bgGradient: 'from-yellow-500 to-amber-600', accentColor: '#F59E0B' },
      { pairId: 3, icon: '🍌', label: 'Chuối Chiên', bgGradient: 'from-yellow-400 to-amber-500', accentColor: '#EAB308' },
      { pairId: 4, icon: '🍚', label: 'Cơm Djon', bgGradient: 'from-slate-700 to-slate-900', accentColor: '#475569' },
      { pairId: 5, icon: '🥣', label: 'Súp Joumou', bgGradient: 'from-orange-500 to-amber-600', accentColor: '#F97316' },
      { pairId: 6, icon: '☕', label: 'Cà Phê Rebo', bgGradient: 'from-amber-800 to-stone-900', accentColor: '#78350F' },
      { pairId: 7, icon: '🥥', label: 'Nước Dừa', bgGradient: 'from-emerald-500 to-teal-600', accentColor: '#10B981' },
      { pairId: 8, icon: '🦐', label: 'Tôm Lanbi', bgGradient: 'from-rose-500 to-red-600', accentColor: '#F43F5E' },
      { pairId: 9, icon: '🥭', label: 'Xoài Francis', bgGradient: 'from-amber-400 to-orange-500', accentColor: '#F59E0B' },
      { pairId: 10, icon: '🌽', label: 'Bắp Mayi', bgGradient: 'from-yellow-400 to-emerald-600', accentColor: '#EAB308' },
      { pairId: 11, icon: '🥑', label: 'Quả Bơ', bgGradient: 'from-lime-500 to-emerald-700', accentColor: '#84CC16' },
      { pairId: 12, icon: '🍹', label: 'Nước Ép Rum', bgGradient: 'from-pink-500 to-rose-700', accentColor: '#EC4899' },
    ],
  },
  // 5. Động Vật Hoang Dã
  {
    id: 'WILD_ANIMALS',
    name: 'Động Vật Hoang Dã',
    badge: 'Safari Wildlife',
    icon: '🦁',
    bgGradient: 'from-emerald-600 to-teal-700',
    cards: [
      { pairId: 1, icon: '🦁', label: 'Sư Tử', bgGradient: 'from-amber-500 to-yellow-600', accentColor: '#F59E0B' },
      { pairId: 2, icon: '🐘', label: 'Voi Rừng', bgGradient: 'from-slate-500 to-slate-700', accentColor: '#64748B' },
      { pairId: 3, icon: '🐯', label: 'Hổ Vằn', bgGradient: 'from-orange-500 to-red-600', accentColor: '#F97316' },
      { pairId: 4, icon: '🦒', label: 'Hươu Cao Cổ', bgGradient: 'from-yellow-500 to-amber-600', accentColor: '#EAB308' },
      { pairId: 5, icon: '🐼', label: 'Gấu Trúc', bgGradient: 'from-zinc-700 to-zinc-900', accentColor: '#3F3F46' },
      { pairId: 6, icon: '🐆', label: 'Báo Đốm', bgGradient: 'from-amber-400 to-orange-600', accentColor: '#F59E0B' },
      { pairId: 7, icon: '🦅', label: 'Đại Bàng', bgGradient: 'from-stone-600 to-stone-800', accentColor: '#78716C' },
      { pairId: 8, icon: '🐒', label: 'Khỉ Vui Nhộn', bgGradient: 'from-amber-600 to-amber-800', accentColor: '#D97706' },
      { pairId: 9, icon: '🦛', label: 'Hà Mã', bgGradient: 'from-blue-600 to-slate-700', accentColor: '#2563EB' },
      { pairId: 10, icon: '🦓', label: 'Ngựa Vằn', bgGradient: 'from-slate-800 to-slate-950', accentColor: '#1E293B' },
      { pairId: 11, icon: '🐺', label: 'Chó Sói', bgGradient: 'from-cyan-700 to-blue-900', accentColor: '#0E7490' },
      { pairId: 12, icon: '🦘', label: 'Kangaroo', bgGradient: 'from-orange-600 to-amber-700', accentColor: '#EA580C' },
    ],
  },
  // 6. Vũ Trụ & Thiên Văn
  {
    id: 'SPACE',
    name: 'Vũ Trụ & Thiên Văn',
    badge: 'Cosmic Galaxy',
    icon: '🚀',
    bgGradient: 'from-indigo-600 to-purple-800',
    cards: [
      { pairId: 1, icon: '🚀', label: 'Tên Lửa', bgGradient: 'from-rose-500 to-red-600', accentColor: '#F43F5E' },
      { pairId: 2, icon: '🪐', label: 'Sao Thổ', bgGradient: 'from-amber-500 to-yellow-600', accentColor: '#F59E0B' },
      { pairId: 3, icon: '☀️', label: 'Mặt Trời', bgGradient: 'from-yellow-400 to-orange-500', accentColor: '#EAB308' },
      { pairId: 4, icon: '🌙', label: 'Mặt Trăng', bgGradient: 'from-blue-400 to-indigo-600', accentColor: '#60A5FA' },
      { pairId: 5, icon: '☄️', label: 'Thiên Thạch', bgGradient: 'from-orange-500 to-red-700', accentColor: '#F97316' },
      { pairId: 6, icon: '🔭', label: 'Kính Thiên Văn', bgGradient: 'from-teal-500 to-cyan-700', accentColor: '#14B8A6' },
      { pairId: 7, icon: '👨‍🚀', label: 'Phi Hành Gia', bgGradient: 'from-sky-400 to-blue-600', accentColor: '#38BDF8' },
      { pairId: 8, icon: '🛰️', label: 'Vệ Tinh 4G', bgGradient: 'from-blue-500 to-indigo-600', accentColor: '#3B82F6' },
      { pairId: 9, icon: '🌌', label: 'Ngân Hà', bgGradient: 'from-purple-600 to-indigo-900', accentColor: '#9333EA' },
      { pairId: 10, icon: '🛸', label: 'Đĩa Bay UFO', bgGradient: 'from-emerald-400 to-teal-600', accentColor: '#10B981' },
      { pairId: 11, icon: '🌠', label: 'Sao Băng', bgGradient: 'from-amber-300 to-yellow-500', accentColor: '#FDE047' },
      { pairId: 12, icon: '🌍', label: 'Trái Đất', bgGradient: 'from-cyan-500 to-blue-600', accentColor: '#06B6D4' },
    ],
  },
  // 7. Thể Thao & Parkour
  {
    id: 'SPORTS',
    name: 'Thể Thao & Parkour',
    badge: 'Pro Athletes',
    icon: '⚽',
    bgGradient: 'from-blue-600 to-emerald-600',
    cards: [
      { pairId: 1, icon: '⚽', label: 'Bóng Đá', bgGradient: 'from-emerald-500 to-teal-700', accentColor: '#10B981' },
      { pairId: 2, icon: '🏀', label: 'Bóng Rổ', bgGradient: 'from-orange-500 to-amber-600', accentColor: '#F97316' },
      { pairId: 3, icon: '👟', label: 'Giày Chạy', bgGradient: 'from-rose-500 to-red-600', accentColor: '#F43F5E' },
      { pairId: 4, icon: '🥇', label: 'Huy Chương', bgGradient: 'from-yellow-400 to-amber-500', accentColor: '#EAB308' },
      { pairId: 5, icon: '🏆', label: 'Cúp Vàng', bgGradient: 'from-amber-400 to-yellow-600', accentColor: '#F59E0B' },
      { pairId: 6, icon: '🛹', label: 'Ván Trượt', bgGradient: 'from-cyan-500 to-blue-600', accentColor: '#06B6D4' },
      { pairId: 7, icon: '🎾', label: 'Quần Vợt', bgGradient: 'from-lime-400 to-emerald-500', accentColor: '#84CC16' },
      { pairId: 8, icon: '🥊', label: 'Găng Boxing', bgGradient: 'from-red-600 to-rose-700', accentColor: '#DC2626' },
      { pairId: 9, icon: '🥋', label: 'Võ Thuật', bgGradient: 'from-slate-700 to-slate-900', accentColor: '#334155' },
      { pairId: 10, icon: '📢', label: 'Còi Trọng Tài', bgGradient: 'from-yellow-500 to-amber-600', accentColor: '#F59E0B' },
      { pairId: 11, icon: '🏸', label: 'Cầu Lông', bgGradient: 'from-sky-400 to-blue-600', accentColor: '#38BDF8' },
      { pairId: 12, icon: '🎯', label: 'Phi Tiêu', bgGradient: 'from-purple-500 to-indigo-600', accentColor: '#A855F7' },
    ],
  },
  // 8. Công Nghệ & Kỹ Thuật Số
  {
    id: 'TECHNOLOGY',
    name: 'Công Nghệ & Số Hóa',
    badge: 'Cyber Future',
    icon: '💻',
    bgGradient: 'from-cyan-600 to-indigo-700',
    cards: [
      { pairId: 1, icon: '📱', label: 'Điện Thoại', bgGradient: 'from-blue-500 to-cyan-600', accentColor: '#3B82F6' },
      { pairId: 2, icon: '💻', label: 'Laptop', bgGradient: 'from-slate-600 to-slate-800', accentColor: '#64748B' },
      { pairId: 3, icon: '🎧', label: 'Tai Nghe', bgGradient: 'from-purple-500 to-pink-600', accentColor: '#A855F7' },
      { pairId: 4, icon: '🤖', label: 'Robot AI', bgGradient: 'from-emerald-400 to-teal-600', accentColor: '#10B981' },
      { pairId: 5, icon: '🎮', label: 'Tay Game', bgGradient: 'from-rose-500 to-red-600', accentColor: '#F43F5E' },
      { pairId: 6, icon: '🚁', label: 'Drone Bay', bgGradient: 'from-amber-500 to-orange-600', accentColor: '#F59E0B' },
      { pairId: 7, icon: '💽', label: 'Vi Mạch', bgGradient: 'from-teal-500 to-emerald-700', accentColor: '#14B8A6' },
      { pairId: 8, icon: '⌚', label: 'Smartwatch', bgGradient: 'from-indigo-500 to-purple-600', accentColor: '#6366F1' },
      { pairId: 9, icon: '🥽', label: 'Kính VR', bgGradient: 'from-cyan-400 to-blue-600', accentColor: '#06B6D4' },
      { pairId: 10, icon: '💾', label: 'Ổ Cứng SSD', bgGradient: 'from-yellow-400 to-amber-600', accentColor: '#EAB308' },
      { pairId: 11, icon: '⌨️', label: 'Bàn Phím', bgGradient: 'from-stone-600 to-stone-800', accentColor: '#78716C' },
      { pairId: 12, icon: '🖱️', label: 'Chuột Quang', bgGradient: 'from-red-500 to-orange-600', accentColor: '#EF4444' },
    ],
  },
  // 9. Kỳ Quan Thiên Nhiên
  {
    id: 'WONDERS',
    name: 'Kỳ Quan Thiên Nhiên',
    badge: 'Earth Wonders',
    icon: '🌋',
    bgGradient: 'from-teal-600 to-emerald-700',
    cards: [
      { pairId: 1, icon: '🌋', label: 'Núi Lửa', bgGradient: 'from-red-600 to-amber-700', accentColor: '#DC2626' },
      { pairId: 2, icon: '🌊', label: 'Thác Nước', bgGradient: 'from-cyan-500 to-blue-600', accentColor: '#06B6D4' },
      { pairId: 3, icon: '🕳️', label: 'Hang Động', bgGradient: 'from-stone-700 to-stone-900', accentColor: '#44403C' },
      { pairId: 4, icon: '🪸', label: 'San Hô', bgGradient: 'from-pink-500 to-rose-600', accentColor: '#EC4899' },
      { pairId: 5, icon: '🏖️', label: 'Bãi Biển', bgGradient: 'from-amber-400 to-yellow-500', accentColor: '#F59E0B' },
      { pairId: 6, icon: '🌈', label: 'Cầu Vồng', bgGradient: 'from-indigo-500 to-purple-600', accentColor: '#8B5CF6' },
      { pairId: 7, icon: '🌲', label: 'Rừng Rậm', bgGradient: 'from-emerald-600 to-green-800', accentColor: '#059669' },
      { pairId: 8, icon: '🌅', label: 'Hoàng Hôn', bgGradient: 'from-orange-500 to-rose-600', accentColor: '#F97316' },
      { pairId: 9, icon: '🏝️', label: 'Đảo Ngọc', bgGradient: 'from-teal-400 to-cyan-600', accentColor: '#14B8A6' },
      { pairId: 10, icon: '🏜️', label: 'Sa Mạc', bgGradient: 'from-yellow-600 to-amber-700', accentColor: '#D97706' },
      { pairId: 11, icon: '🏔️', label: 'Núi Tuyết', bgGradient: 'from-blue-300 to-indigo-500', accentColor: '#93C5FD' },
      { pairId: 12, icon: '🧊', label: 'Tảng Băng', bgGradient: 'from-sky-300 to-blue-500', accentColor: '#7DD3FC' },
    ],
  },
  // 10. Phù Thủy & Phép Thuật
  {
    id: 'MAGIC',
    name: 'Phù Thủy & Ma Pháp',
    badge: 'Magic Spellbook',
    icon: '🧙‍♂️',
    bgGradient: 'from-purple-600 to-violet-800',
    cards: [
      { pairId: 1, icon: '🪄', label: 'Đũa Thần', bgGradient: 'from-amber-400 to-yellow-600', accentColor: '#F59E0B' },
      { pairId: 2, icon: '🧙', label: 'Mũ Phù Thủy', bgGradient: 'from-purple-600 to-indigo-800', accentColor: '#9333EA' },
      { pairId: 3, icon: '🧪', label: 'Thần Dược', bgGradient: 'from-emerald-400 to-teal-600', accentColor: '#10B981' },
      { pairId: 4, icon: '📖', label: 'Sách Phép', bgGradient: 'from-amber-700 to-amber-900', accentColor: '#B45309' },
      { pairId: 5, icon: '🔮', label: 'Cầu Pha Lê', bgGradient: 'from-pink-500 to-purple-600', accentColor: '#D946EF' },
      { pairId: 6, icon: '🐉', label: 'Rồng Lửa', bgGradient: 'from-red-600 to-orange-700', accentColor: '#DC2626' },
      { pairId: 7, icon: '🧹', label: 'Chổi Bay', bgGradient: 'from-yellow-600 to-amber-800', accentColor: '#D97706' },
      { pairId: 8, icon: '🧥', label: 'Áo Tàng Hình', bgGradient: 'from-indigo-500 to-slate-800', accentColor: '#6366F1' },
      { pairId: 9, icon: '🗝️', label: 'Khóa Cổ', bgGradient: 'from-yellow-400 to-amber-600', accentColor: '#EAB308' },
      { pairId: 10, icon: '🕯️', label: 'Nến Thần', bgGradient: 'from-orange-400 to-red-500', accentColor: '#F97316' },
      { pairId: 11, icon: '🥣', label: 'Vạc Thuốc', bgGradient: 'from-teal-600 to-emerald-800', accentColor: '#0D9488' },
      { pairId: 12, icon: '✨', label: 'Bụi Tiên', bgGradient: 'from-yellow-300 to-amber-400', accentColor: '#FDE047' },
    ],
  },
  // 11. Trái Cây Nhiệt Đới
  {
    id: 'FRUITS',
    name: 'Trái Cây Nhiệt Đới',
    badge: 'Tropical Orchard',
    icon: '🍉',
    bgGradient: 'from-emerald-500 to-lime-600',
    cards: [
      { pairId: 1, icon: '🍉', label: 'Dưa Hấu', bgGradient: 'from-red-500 to-emerald-600', accentColor: '#EF4444' },
      { pairId: 2, icon: '🥑', label: 'Trái Bơ', bgGradient: 'from-lime-500 to-emerald-700', accentColor: '#84CC16' },
      { pairId: 3, icon: '🍍', label: 'Dứa Mật', bgGradient: 'from-amber-400 to-yellow-600', accentColor: '#F59E0B' },
      { pairId: 4, icon: '🍌', label: 'Chuối Vàng', bgGradient: 'from-yellow-400 to-amber-500', accentColor: '#EAB308' },
      { pairId: 5, icon: '🍓', label: 'Dâu Tây', bgGradient: 'from-rose-500 to-red-600', accentColor: '#F43F5E' },
      { pairId: 6, icon: '🍊', label: 'Cam Ngọt', bgGradient: 'from-orange-400 to-amber-500', accentColor: '#F97316' },
      { pairId: 7, icon: '🍎', label: 'Táo Đỏ', bgGradient: 'from-red-500 to-rose-600', accentColor: '#EF4444' },
      { pairId: 8, icon: '🍇', label: 'Nho Tím', bgGradient: 'from-purple-500 to-indigo-600', accentColor: '#A855F7' },
      { pairId: 9, icon: '🍈', label: 'Đu Đủ', bgGradient: 'from-yellow-500 to-orange-600', accentColor: '#F59E0B' },
      { pairId: 10, icon: '🍋', label: 'Chanh Vàng', bgGradient: 'from-yellow-300 to-lime-500', accentColor: '#FDE047' },
      { pairId: 11, icon: '🍑', label: 'Quả Đào', bgGradient: 'from-pink-400 to-rose-500', accentColor: '#F472B6' },
      { pairId: 12, icon: '🥥', label: 'Trái Dừa', bgGradient: 'from-amber-700 to-stone-800', accentColor: '#78350F' },
    ],
  },
  // 12. Phương Tiện Giao Thông
  {
    id: 'VEHICLES',
    name: 'Phương Tiện & Tốc Độ',
    badge: 'Turbo Speed',
    icon: '🚗',
    bgGradient: 'from-red-600 to-orange-600',
    cards: [
      { pairId: 1, icon: '🚌', label: 'Xe Tap-Tap', bgGradient: 'from-cyan-500 to-blue-600', accentColor: '#06B6D4' },
      { pairId: 2, icon: '🏎️', label: 'Siêu Xe', bgGradient: 'from-red-600 to-rose-700', accentColor: '#DC2626' },
      { pairId: 3, icon: '🚁', label: 'Trực Thăng', bgGradient: 'from-amber-500 to-orange-600', accentColor: '#F59E0B' },
      { pairId: 4, icon: '🚄', label: 'Tàu Tốc Hành', bgGradient: 'from-blue-500 to-indigo-600', accentColor: '#3B82F6' },
      { pairId: 5, icon: '🚤', label: 'Ca Nô', bgGradient: 'from-teal-500 to-cyan-600', accentColor: '#14B8A6' },
      { pairId: 6, icon: '🏍️', label: 'Mô Tô Khủng', bgGradient: 'from-orange-500 to-red-600', accentColor: '#F97316' },
      { pairId: 7, icon: '🚀', label: 'Tàu Vũ Trụ', bgGradient: 'from-purple-600 to-indigo-700', accentColor: '#9333EA' },
      { pairId: 8, icon: '🚒', label: 'Xe Cứu Hỏa', bgGradient: 'from-red-500 to-rose-600', accentColor: '#EF4444' },
      { pairId: 9, icon: '✈️', label: 'Máy Bay', bgGradient: 'from-sky-400 to-blue-600', accentColor: '#38BDF8' },
      { pairId: 10, icon: '🚢', label: 'Du Thuyền', bgGradient: 'from-blue-600 to-slate-700', accentColor: '#2563EB' },
      { pairId: 11, icon: '🎈', label: 'Khinh Khí Cầu', bgGradient: 'from-pink-500 to-rose-600', accentColor: '#EC4899' },
      { pairId: 12, icon: '🚜', label: 'Máy Kéo', bgGradient: 'from-emerald-600 to-green-700', accentColor: '#059669' },
    ],
  },
  // 13. Âm Nhạc & Nhạc Cụ
  {
    id: 'MUSIC',
    name: 'Âm Nhạc & Nhạc Cụ',
    badge: 'Melody Symphony',
    icon: '🎸',
    bgGradient: 'from-violet-600 to-fuchsia-700',
    cards: [
      { pairId: 1, icon: '🎸', label: 'Guitar Điện', bgGradient: 'from-rose-500 to-red-600', accentColor: '#F43F5E' },
      { pairId: 2, icon: '🎷', label: 'Saxophone', bgGradient: 'from-amber-400 to-yellow-600', accentColor: '#F59E0B' },
      { pairId: 3, icon: '🎹', label: 'Đàn Piano', bgGradient: 'from-slate-800 to-slate-950', accentColor: '#1E293B' },
      { pairId: 4, icon: '🥁', label: 'Trống Jazz', bgGradient: 'from-orange-500 to-amber-600', accentColor: '#F97316' },
      { pairId: 5, icon: '🎻', label: 'Đàn Violin', bgGradient: 'from-amber-700 to-amber-900', accentColor: '#B45309' },
      { pairId: 6, icon: '🎤', label: 'Micro Vàng', bgGradient: 'from-yellow-400 to-amber-500', accentColor: '#EAB308' },
      { pairId: 7, icon: '📻', label: 'Đĩa Than', bgGradient: 'from-stone-700 to-stone-900', accentColor: '#44403C' },
      { pairId: 8, icon: '🎧', label: 'Tai Nghe DJ', bgGradient: 'from-cyan-500 to-blue-600', accentColor: '#06B6D4' },
      { pairId: 9, icon: '🎵', label: 'Nốt Nhạc', bgGradient: 'from-purple-500 to-indigo-600', accentColor: '#A855F7' },
      { pairId: 10, icon: '🎺', label: 'Kèn Trumpet', bgGradient: 'from-yellow-500 to-amber-600', accentColor: '#F59E0B' },
      { pairId: 11, icon: '🎼', label: 'Bản Nhạc', bgGradient: 'from-teal-500 to-emerald-600', accentColor: '#14B8A6' },
      { pairId: 12, icon: '🔔', label: 'Chuông Gió', bgGradient: 'from-sky-400 to-blue-500', accentColor: '#38BDF8' },
    ],
  },
  // 14. Thời Tiết & Bốn Mùa
  {
    id: 'WEATHER',
    name: 'Thời Tiết & Bốn Mùa',
    badge: 'Seasonal Elements',
    icon: '⚡',
    bgGradient: 'from-sky-500 to-indigo-600',
    cards: [
      { pairId: 1, icon: '⚡', label: 'Sấm Sét', bgGradient: 'from-yellow-400 to-amber-600', accentColor: '#F59E0B' },
      { pairId: 2, icon: '🌪️', label: 'Lốc Xoáy', bgGradient: 'from-slate-500 to-slate-700', accentColor: '#64748B' },
      { pairId: 3, icon: '❄️', label: 'Bông Tuyết', bgGradient: 'from-sky-300 to-blue-500', accentColor: '#38BDF8' },
      { pairId: 4, icon: '☀️', label: 'Nắng Hè', bgGradient: 'from-amber-400 to-orange-500', accentColor: '#EAB308' },
      { pairId: 5, icon: '🍁', label: 'Lá Phong Thu', bgGradient: 'from-orange-500 to-red-600', accentColor: '#F97316' },
      { pairId: 6, icon: '🌧️', label: 'Mưa Rào', bgGradient: 'from-blue-400 to-indigo-600', accentColor: '#60A5FA' },
      { pairId: 7, icon: '☁️', label: 'Mây Trắng', bgGradient: 'from-slate-400 to-slate-600', accentColor: '#94A3B8' },
      { pairId: 8, icon: '💨', label: 'Gió Cuốn', bgGradient: 'from-teal-400 to-cyan-600', accentColor: '#14B8A6' },
      { pairId: 9, icon: '🌈', label: 'Cầu Vồng', bgGradient: 'from-pink-500 to-purple-600', accentColor: '#EC4899' },
      { pairId: 10, icon: '🌃', label: 'Đêm Sao', bgGradient: 'from-indigo-700 to-slate-900', accentColor: '#4338CA' },
      { pairId: 11, icon: '🌫️', label: 'Sương Mù', bgGradient: 'from-zinc-500 to-zinc-700', accentColor: '#71717A' },
      { pairId: 12, icon: '🌄', label: 'Bình Minh', bgGradient: 'from-rose-400 to-amber-500', accentColor: '#FB7185' },
    ],
  },
  // 15. Khảo Cổ & Cổ Đại
  {
    id: 'ANCIENT',
    name: 'Khảo Cổ & Cổ Đại',
    badge: 'Ancient Relics',
    icon: '🏺',
    bgGradient: 'from-amber-700 to-yellow-800',
    cards: [
      { pairId: 1, icon: '🏛️', label: 'Kim Tự Tháp', bgGradient: 'from-amber-500 to-yellow-600', accentColor: '#F59E0B' },
      { pairId: 2, icon: '🏺', label: 'Bình Cổ', bgGradient: 'from-orange-600 to-amber-700', accentColor: '#EA580C' },
      { pairId: 3, icon: '🪙', label: 'Xu La Mã', bgGradient: 'from-yellow-400 to-amber-500', accentColor: '#EAB308' },
      { pairId: 4, icon: '📜', label: 'Cuộn Giấy Cổ', bgGradient: 'from-stone-400 to-stone-600', accentColor: '#A8A29E' },
      { pairId: 5, icon: '⌛', label: 'Đồng Hồ Cát', bgGradient: 'from-amber-400 to-orange-500', accentColor: '#F59E0B' },
      { pairId: 6, icon: '🧭', label: 'La Bàn', bgGradient: 'from-teal-500 to-emerald-700', accentColor: '#14B8A6' },
      { pairId: 7, icon: '🔑', label: 'Khóa Vàng', bgGradient: 'from-yellow-400 to-amber-600', accentColor: '#EAB308' },
      { pairId: 8, icon: '👑', label: 'Trượng Hoàng Gia', bgGradient: 'from-purple-500 to-indigo-600', accentColor: '#A855F7' },
      { pairId: 9, icon: '🗿', label: 'Tượng Cổ', bgGradient: 'from-slate-600 to-slate-800', accentColor: '#64748B' },
      { pairId: 10, icon: '🪔', label: 'Đèn Dầu Thần', bgGradient: 'from-amber-500 to-rose-600', accentColor: '#F59E0B' },
      { pairId: 11, icon: '🗺️', label: 'Bản Đồ Báu', bgGradient: 'from-amber-600 to-yellow-700', accentColor: '#D97706' },
      { pairId: 12, icon: '🛡️', label: 'Khiên Đồng', bgGradient: 'from-stone-500 to-stone-700', accentColor: '#78716C' },
    ],
  },
  // 16. Nông Trại Vui Vẻ
  {
    id: 'FARM',
    name: 'Nông Trại Vui Vẻ',
    badge: 'Sunny Farm',
    icon: '🚜',
    bgGradient: 'from-emerald-600 to-amber-600',
    cards: [
      { pairId: 1, icon: '🎡', label: 'Cối Xay Gió', bgGradient: 'from-amber-500 to-orange-600', accentColor: '#F59E0B' },
      { pairId: 2, icon: '🚜', label: 'Máy Cày', bgGradient: 'from-red-500 to-rose-600', accentColor: '#EF4444' },
      { pairId: 3, icon: '🐄', label: 'Bò Sữa', bgGradient: 'from-zinc-600 to-zinc-800', accentColor: '#52525B' },
      { pairId: 4, icon: '🐑', label: 'Cừu Trắng', bgGradient: 'from-slate-400 to-slate-600', accentColor: '#94A3B8' },
      { pairId: 5, icon: '🐓', label: 'Gà Trống', bgGradient: 'from-rose-500 to-amber-600', accentColor: '#F43F5E' },
      { pairId: 6, icon: '🌽', label: 'Bắp Ngô', bgGradient: 'from-yellow-400 to-amber-500', accentColor: '#EAB308' },
      { pairId: 7, icon: '🥕', label: 'Cà Rốt', bgGradient: 'from-orange-500 to-amber-600', accentColor: '#F97316' },
      { pairId: 8, icon: '🥚', label: 'Trứng Gà', bgGradient: 'from-amber-200 to-yellow-400', accentColor: '#FDE047' },
      { pairId: 9, icon: '🪣', label: 'Bình Nước', bgGradient: 'from-blue-400 to-cyan-600', accentColor: '#38BDF8' },
      { pairId: 10, icon: '🌾', label: 'Bù Nhìn Rơm', bgGradient: 'from-amber-600 to-yellow-700', accentColor: '#D97706' },
      { pairId: 11, icon: '🐖', label: 'Heo Hồng', bgGradient: 'from-pink-400 to-rose-500', accentColor: '#F472B6' },
      { pairId: 12, icon: '🐎', label: 'Chú Ngựa', bgGradient: 'from-amber-700 to-stone-800', accentColor: '#78350F' },
    ],
  },
  // 17. Điệp Viên & Cảnh Sát
  {
    id: 'DETECTIVE',
    name: 'Điệp Viên & Đặc Vụ',
    badge: 'Secret Agent',
    icon: '🕵️‍♂️',
    bgGradient: 'from-slate-700 to-zinc-900',
    cards: [
      { pairId: 1, icon: '🛡️', label: 'Huy Hiệu', bgGradient: 'from-yellow-400 to-amber-600', accentColor: '#EAB308' },
      { pairId: 2, icon: '🕶️', label: 'Kính Đen', bgGradient: 'from-slate-800 to-black', accentColor: '#0F172A' },
      { pairId: 3, icon: '💼', label: 'Vali Mật Mã', bgGradient: 'from-stone-600 to-stone-800', accentColor: '#78716C' },
      { pairId: 4, icon: '📻', label: 'Bộ Đàm', bgGradient: 'from-teal-600 to-slate-700', accentColor: '#0D9488' },
      { pairId: 5, icon: '🚨', label: 'Còi Đèn', bgGradient: 'from-red-600 to-blue-600', accentColor: '#DC2626' },
      { pairId: 6, icon: '⛓️', label: 'Còng Tay', bgGradient: 'from-slate-400 to-slate-600', accentColor: '#94A3B8' },
      { pairId: 7, icon: '🥽', label: 'Kính Đêm', bgGradient: 'from-emerald-500 to-teal-700', accentColor: '#10B981' },
      { pairId: 8, icon: '🔍', label: 'Dấu Vân Tay', bgGradient: 'from-cyan-400 to-blue-600', accentColor: '#06B6D4' },
      { pairId: 9, icon: '📍', label: 'Định Vị GPS', bgGradient: 'from-rose-500 to-red-600', accentColor: '#F43F5E' },
      { pairId: 10, icon: '📦', label: 'Hộp Đen', bgGradient: 'from-zinc-700 to-zinc-900', accentColor: '#3F3F46' },
      { pairId: 11, icon: '🔭', label: 'Ống Nhòm', bgGradient: 'from-indigo-500 to-purple-600', accentColor: '#6366F1' },
      { pairId: 12, icon: '📷', label: 'Máy Ảnh Nhỏ', bgGradient: 'from-amber-500 to-orange-600', accentColor: '#F59E0B' },
    ],
  },
  // 18. Sinh Vật Biển Sâu
  {
    id: 'OCEAN',
    name: 'Sinh Vật Biển Sâu',
    badge: 'Deep Ocean',
    icon: '🐙',
    bgGradient: 'from-blue-600 to-cyan-800',
    cards: [
      { pairId: 1, icon: '🐙', label: 'Bạch Tuộc', bgGradient: 'from-purple-500 to-rose-600', accentColor: '#A855F7' },
      { pairId: 2, icon: '🐋', label: 'Cá Voi Xanh', bgGradient: 'from-blue-500 to-indigo-700', accentColor: '#3B82F6' },
      { pairId: 3, icon: '⭐', label: 'Sao Biển', bgGradient: 'from-amber-400 to-orange-500', accentColor: '#F59E0B' },
      { pairId: 4, icon: '🐢', label: 'Rùa Biển', bgGradient: 'from-emerald-500 to-teal-700', accentColor: '#10B981' },
      { pairId: 5, icon: '🦀', label: 'Cua Biển', bgGradient: 'from-red-500 to-rose-600', accentColor: '#EF4444' },
      { pairId: 6, icon: '🪼', label: 'Sứa Phát Sáng', bgGradient: 'from-cyan-400 to-pink-500', accentColor: '#06B6D4' },
      { pairId: 7, icon: '🐡', label: 'Cá Nóc Gai', bgGradient: 'from-yellow-400 to-amber-600', accentColor: '#EAB308' },
      { pairId: 8, icon: '🐚', label: 'Ốc Biển', bgGradient: 'from-pink-300 to-rose-400', accentColor: '#F472B6' },
      { pairId: 9, icon: '🦈', label: 'Cá Mập', bgGradient: 'from-slate-600 to-slate-800', accentColor: '#64748B' },
      { pairId: 10, icon: '🦑', label: 'Mực Ống', bgGradient: 'from-rose-400 to-orange-500', accentColor: '#FB7185' },
      { pairId: 11, icon: '🪸', label: 'San Hô Đỏ', bgGradient: 'from-rose-500 to-red-600', accentColor: '#F43F5E' },
      { pairId: 12, icon: '🦞', label: 'Tôm Hùm', bgGradient: 'from-red-600 to-orange-700', accentColor: '#DC2626' },
    ],
  },
  // 19. Tiệm Bánh & Tráng Miệng
  {
    id: 'SWEETS',
    name: 'Bánh Ngọt & Tráng Miệng',
    badge: 'Sweet Bakery',
    icon: '🎂',
    bgGradient: 'from-pink-500 to-rose-600',
    cards: [
      { pairId: 1, icon: '🎂', label: 'Bánh Kem', bgGradient: 'from-pink-400 to-rose-500', accentColor: '#F472B6' },
      { pairId: 2, icon: '🍩', label: 'Bánh Donut', bgGradient: 'from-amber-500 to-rose-600', accentColor: '#F59E0B' },
      { pairId: 3, icon: '🍦', label: 'Kem Ốc Quế', bgGradient: 'from-yellow-300 to-amber-500', accentColor: '#FDE047' },
      { pairId: 4, icon: '🍭', label: 'Kẹo Mút', bgGradient: 'from-purple-400 to-pink-500', accentColor: '#C084FC' },
      { pairId: 5, icon: '🧁', label: 'Cupcake', bgGradient: 'from-rose-400 to-red-500', accentColor: '#FB7185' },
      { pairId: 6, icon: '🍫', label: 'Socola Đen', bgGradient: 'from-amber-800 to-stone-900', accentColor: '#78350F' },
      { pairId: 7, icon: '🥐', label: 'Bánh Bơ', bgGradient: 'from-amber-400 to-yellow-600', accentColor: '#F59E0B' },
      { pairId: 8, icon: '🧋', label: 'Trà Sữa', bgGradient: 'from-amber-600 to-amber-800', accentColor: '#D97706' },
      { pairId: 9, icon: '🍬', label: 'Kẹo Dẻo', bgGradient: 'from-emerald-400 to-teal-500', accentColor: '#34D399' },
      { pairId: 10, icon: '🍪', label: 'Bánh Cookie', bgGradient: 'from-yellow-600 to-amber-700', accentColor: '#CA8A04' },
      { pairId: 11, icon: '🥧', label: 'Bánh Tart', bgGradient: 'from-orange-400 to-red-500', accentColor: '#FB923C' },
      { pairId: 12, icon: '🍨', label: 'Kem Ly Trái Cây', bgGradient: 'from-cyan-400 to-blue-500', accentColor: '#38BDF8' },
    ],
  },
  // 20. Hiệp Sĩ & Trung Cổ
  {
    id: 'KNIGHTS',
    name: 'Hiệp Sĩ & Trung Cổ',
    badge: 'Medieval Kingdom',
    icon: '⚔️',
    bgGradient: 'from-amber-700 to-slate-800',
    cards: [
      { pairId: 1, icon: '🛡️', label: 'Khiên Hiệp Sĩ', bgGradient: 'from-blue-600 to-indigo-800', accentColor: '#2563EB' },
      { pairId: 2, icon: '⚔️', label: 'Kiếm Thánh', bgGradient: 'from-cyan-400 to-blue-600', accentColor: '#06B6D4' },
      { pairId: 3, icon: '🦺', label: 'Áo Giáp Sắt', bgGradient: 'from-slate-500 to-slate-700', accentColor: '#64748B' },
      { pairId: 4, icon: '🏰', label: 'Lâu Đài', bgGradient: 'from-stone-600 to-stone-800', accentColor: '#78716C' },
      { pairId: 5, icon: '🐎', label: 'Ngựa Chiến', bgGradient: 'from-amber-700 to-amber-900', accentColor: '#B45309' },
      { pairId: 6, icon: '🏹', label: 'Cung Tên', bgGradient: 'from-yellow-600 to-amber-700', accentColor: '#D97706' },
      { pairId: 7, icon: '🪵', label: 'Đuốc Đêm', bgGradient: 'from-orange-500 to-red-600', accentColor: '#F97316' },
      { pairId: 8, icon: '🚩', label: 'Cờ Hiệu', bgGradient: 'from-red-600 to-rose-700', accentColor: '#DC2626' },
      { pairId: 9, icon: '🪓', label: 'Rìu Chiến', bgGradient: 'from-zinc-600 to-zinc-800', accentColor: '#52525B' },
      { pairId: 10, icon: '🏯', label: 'Tháp Pháo', bgGradient: 'from-slate-700 to-slate-900', accentColor: '#334155' },
      { pairId: 11, icon: '👑', label: 'Vương Miện Vua', bgGradient: 'from-yellow-400 to-amber-500', accentColor: '#EAB308' },
      { pairId: 12, icon: '🐲', label: 'Rồng Canh Giữ', bgGradient: 'from-emerald-600 to-teal-800', accentColor: '#059669' },
    ],
  },
  // 21. Khu Vườn Hoàng Gia
  {
    id: 'FLOWERS',
    name: 'Khu Vườn Hoàng Gia',
    badge: 'Royal Garden',
    icon: '🌺',
    bgGradient: 'from-emerald-500 to-teal-600',
    cards: [
      { pairId: 1, icon: '🌹', label: 'Hoa Hồng Đỏ', bgGradient: 'from-rose-500 to-red-600', accentColor: '#F43F5E' },
      { pairId: 2, icon: '🌻', label: 'Hoa Hướng Dương', bgGradient: 'from-yellow-400 to-amber-500', accentColor: '#EAB308' },
      { pairId: 3, icon: '🪷', label: 'Hoa Sen', bgGradient: 'from-pink-400 to-rose-500', accentColor: '#F472B6' },
      { pairId: 4, icon: '🌸', label: 'Hoa Lan Quý', bgGradient: 'from-purple-400 to-pink-500', accentColor: '#C084FC' },
      { pairId: 5, icon: '🌵', label: 'Xương Rồng', bgGradient: 'from-emerald-600 to-green-700', accentColor: '#059669' },
      { pairId: 6, icon: '🍄', label: 'Nấm Rừng', bgGradient: 'from-red-500 to-orange-600', accentColor: '#EF4444' },
      { pairId: 7, icon: '🌷', label: 'Hoa Tulip', bgGradient: 'from-pink-500 to-purple-600', accentColor: '#EC4899' },
      { pairId: 8, icon: '🌼', label: 'Hoa Cúc Vàng', bgGradient: 'from-amber-300 to-yellow-500', accentColor: '#FDE047' },
      { pairId: 9, icon: '🌺', label: 'Hoa Râm Bụt', bgGradient: 'from-rose-600 to-red-700', accentColor: '#E11D48' },
      { pairId: 10, icon: '🍀', label: 'Cỏ May Mắn', bgGradient: 'from-green-400 to-emerald-600', accentColor: '#22C55E' },
      { pairId: 11, icon: '🌱', label: 'Chồi Non', bgGradient: 'from-lime-400 to-emerald-500', accentColor: '#84CC16' },
      { pairId: 12, icon: '🌳', label: 'Cây Cổ Thụ', bgGradient: 'from-emerald-700 to-teal-900', accentColor: '#047857' },
    ],
  },
];

// ─────────────────────────────────────────────────────────────
// STAGE DIFFICULTY & PROGRESSION FORMULA
// ─────────────────────────────────────────────────────────────
export interface StageConfig {
  stage: number;
  theme: ThemeCategory;
  pairsCount: number;
  totalCards: number;
  initialTime: number;
  difficultyLabelKey: string;
  gridColsClass: string;
  pointMultiplier: number;
}

export const getStageConfig = (stage: number): StageConfig => {
  const themeIndex = (stage - 1) % ALL_THEMES.length;
  const theme = ALL_THEMES[themeIndex];

  let pairsCount = 4;
  let initialTime = 35;
  let difficultyLabelKey = 'games.memory.difficulty_starter';
  let gridColsClass = 'grid-cols-4';
  let pointMultiplier = 1.0;

  if (stage === 1) {
    pairsCount = 4; // 8 thẻ (4x2)
    initialTime = 35;
    difficultyLabelKey = 'games.memory.difficulty_starter';
    gridColsClass = 'grid-cols-4';
    pointMultiplier = 1.0;
  } else if (stage === 2) {
    pairsCount = 6; // 12 thẻ (4x3)
    initialTime = 45;
    difficultyLabelKey = 'games.memory.difficulty_easy';
    gridColsClass = 'grid-cols-4';
    pointMultiplier = 1.1;
  } else if (stage === 3) {
    pairsCount = 6; // 12 thẻ (4x3)
    initialTime = 38;
    difficultyLabelKey = 'games.memory.difficulty_easy';
    gridColsClass = 'grid-cols-4';
    pointMultiplier = 1.25;
  } else if (stage === 4) {
    pairsCount = 8; // 16 thẻ (4x4)
    initialTime = 55;
    difficultyLabelKey = 'games.memory.difficulty_medium';
    gridColsClass = 'grid-cols-4';
    pointMultiplier = 1.4;
  } else if (stage === 5) {
    pairsCount = 8; // 16 thẻ (4x4)
    initialTime = 46;
    difficultyLabelKey = 'games.memory.difficulty_medium';
    gridColsClass = 'grid-cols-4';
    pointMultiplier = 1.55;
  } else if (stage === 6) {
    pairsCount = 8; // 16 thẻ (4x4)
    initialTime = 40;
    difficultyLabelKey = 'games.memory.difficulty_expert';
    gridColsClass = 'grid-cols-4';
    pointMultiplier = 1.7;
  } else if (stage === 7) {
    pairsCount = 10; // 20 thẻ (5x4)
    initialTime = 65;
    difficultyLabelKey = 'games.memory.difficulty_master';
    gridColsClass = 'grid-cols-4 sm:grid-cols-5';
    pointMultiplier = 1.9;
  } else if (stage === 8) {
    pairsCount = 10; // 20 thẻ (5x4)
    initialTime = 54;
    difficultyLabelKey = 'games.memory.difficulty_master';
    gridColsClass = 'grid-cols-4 sm:grid-cols-5';
    pointMultiplier = 2.1;
  } else if (stage === 9) {
    pairsCount = 12; // 24 thẻ (6x4)
    initialTime = 70;
    difficultyLabelKey = 'games.memory.difficulty_legend';
    gridColsClass = 'grid-cols-4 sm:grid-cols-6';
    pointMultiplier = 2.4;
  } else {
    // Stage 10+ Huyền Thoại Vô Tận
    pairsCount = 12; // 24 thẻ (6x4)
    initialTime = Math.max(38, 70 - (stage - 9) * 3);
    difficultyLabelKey = 'games.memory.difficulty_legend';
    gridColsClass = 'grid-cols-4 sm:grid-cols-6';
    pointMultiplier = 2.6 + (stage - 10) * 0.2;
  }

  return {
    stage,
    theme,
    pairsCount,
    totalCards: pairsCount * 2,
    initialTime,
    difficultyLabelKey,
    gridColsClass,
    pointMultiplier,
  };
};

export const MemoryMatchGame: React.FC<MemoryMatchGameProps> = ({ onBack, onClaimReward }) => {
  const { t } = useTranslation();

  // Stage Progression State & LocalStorage Persistence
  const [currentStage, setCurrentStage] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('memory_game_stage');
      return saved ? Math.max(1, parseInt(saved, 10)) : 1;
    } catch {
      return 1;
    }
  });

  const [accumulatedScore, setAccumulatedScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('memory_game_score');
      return saved ? Math.max(0, parseInt(saved, 10)) : 0;
    } catch {
      return 0;
    }
  });

  const [highestStage, setHighestStage] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('memory_game_highest_stage');
      return saved ? Math.max(1, parseInt(saved, 10)) : 1;
    } catch {
      return 1;
    }
  });

  const [stageScoreWon, setStageScoreWon] = useState<number>(0);

  // Active Game State
  const [cards, setCards] = useState<CardItem[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [matchedCount, setMatchedCount] = useState<number>(0);
  const [moves, setMoves] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(35);
  const [totalTime, setTotalTime] = useState<number>(35);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isWon, setIsWon] = useState<boolean>(false);
  const [isTimeout, setIsTimeout] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(!GameSounds.isSoundMuted());
  const [showRewardModal, setShowRewardModal] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  const [matchPopup, setMatchPopup] = useState<string | null>(null);

  // Power-ups and Combos
  const [peekAvailable, setPeekAvailable] = useState<boolean>(true);
  const [isPeeking, setIsPeeking] = useState<boolean>(false);
  const [freezeAvailable, setFreezeAvailable] = useState<boolean>(true);
  const [comboStreak, setComboStreak] = useState<number>(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    GameSounds.setMuted(!next);
  };

  const stageConfig = getStageConfig(currentStage);

  // Initialize and shuffle deck for a specific stage
  const initStageDeck = useCallback((stageNum: number) => {
    const config = getStageConfig(stageNum);
    const availableCards = config.theme.cards.slice(0, config.pairsCount);
    const deck: CardItem[] = [];
    let idCounter = 0;

    availableCards.forEach((card) => {
      deck.push({
        id: idCounter++,
        pairId: card.pairId,
        icon: card.icon,
        label: card.label,
        bgGradient: card.bgGradient,
        accentColor: card.accentColor,
        isFlipped: false,
        isMatched: false,
      });
      deck.push({
        id: idCounter++,
        pairId: card.pairId,
        icon: card.icon,
        label: card.label,
        bgGradient: card.bgGradient,
        accentColor: card.accentColor,
        isFlipped: false,
        isMatched: false,
      });
    });

    // Fisher-Yates Shuffle
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    setCards(deck);
    setFlippedIndices([]);
    setMatchedCount(0);
    setMoves(0);
    setTimeLeft(config.initialTime);
    setTotalTime(config.initialTime);
    setIsPlaying(true);
    setIsWon(false);
    setIsTimeout(false);
    setPeekAvailable(true);
    setIsPeeking(false);
    setFreezeAvailable(true);
    setComboStreak(0);
  }, []);

  // Mount or stage change
  useEffect(() => {
    initStageDeck(currentStage);
  }, [currentStage, initStageDeck]);

  // Countdown timer loop
  useEffect(() => {
    if (!isPlaying || isWon || isTimeout) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setIsPlaying(false);
          setIsTimeout(true);
          GameSounds.playLose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, isWon, isTimeout]);

  // Power-up 1: X-Ray Peek (Lật ngửa toàn bộ thẻ trong 1.5s)
  const handleXRayPeek = () => {
    if (!peekAvailable || !isPlaying || isWon || isTimeout || isPeeking) return;
    setPeekAvailable(false);
    setIsPeeking(true);
    GameSounds.playFiftyFifty();

    setCards((prev) => prev.map((c) => ({ ...c, isFlipped: true })));

    setTimeout(() => {
      setCards((prev) =>
        prev.map((c) => (c.isMatched ? { ...c, isFlipped: true } : { ...c, isFlipped: false }))
      );
      setIsPeeking(false);
      setFlippedIndices([]);
    }, 1500);
  };

  // Power-up 2: Time Freeze (+10 Giây)
  const handleTimeFreeze = () => {
    if (!freezeAvailable || !isPlaying || isWon || isTimeout) return;
    setFreezeAvailable(false);
    GameSounds.playFiftyFifty();
    setTimeLeft((prev) => prev + 10);
    setMatchPopup('+10s TIME BONUS! ⏳');
    setTimeout(() => setMatchPopup(null), 1200);
  };

  // Card flip interaction
  const handleCardClick = (index: number) => {
    if (!isPlaying || isWon || isTimeout || isPeeking) return;
    if (cards[index]?.isFlipped || cards[index]?.isMatched) return;
    if (flippedIndices.length >= 2) return;

    GameSounds.playTap();
    const newFlipped = [...flippedIndices, index];

    setCards((prev) => {
      const next = prev.map((c, i) => (i === index ? { ...c, isFlipped: true } : c));
      return next;
    });
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      const [firstIdx, secondIdx] = newFlipped;
      const firstCard = cards[firstIdx];
      const secondCard = cards[secondIdx];

      if (firstCard && secondCard && firstCard.pairId === secondCard.pairId) {
        // MATCHED!
        setTimeout(() => {
          GameSounds.playCorrect();
          const nextStreak = comboStreak + 1;
          setComboStreak(nextStreak);

          setCards((prev) =>
            prev.map((c, i) =>
              i === firstIdx || i === secondIdx ? { ...c, isMatched: true, isFlipped: true } : c
            )
          );
          setFlippedIndices([]);

          if (nextStreak >= 2) {
            setMatchPopup(`COMBO x${nextStreak}! 🔥`);
          } else {
            setMatchPopup(`${firstCard.label} MATCH! ✨`);
          }
          setTimeout(() => setMatchPopup(null), 1000);

          setMatchedCount((prev) => {
            const nextMatched = prev + 1;
            if (nextMatched === stageConfig.pairsCount) {
              setIsWon(true);
              setIsPlaying(false);

              // Calculate stage score
              const basePoints = stageConfig.pairsCount * 25;
              const timeBonus = Math.round(timeLeft * 2 * stageConfig.pointMultiplier);
              const comboBonus = nextStreak * 15;
              const thisStageScore = Math.round(basePoints + timeBonus + comboBonus);

              setStageScoreWon(thisStageScore);
              setAccumulatedScore((oldTotal) => {
                const newTotal = oldTotal + thisStageScore;
                const nextStageNum = currentStage + 1;
                const newHighest = Math.max(highestStage, nextStageNum);
                setHighestStage(newHighest);

                try {
                  localStorage.setItem('memory_game_stage', String(nextStageNum));
                  localStorage.setItem('memory_game_score', String(newTotal));
                  localStorage.setItem('memory_game_highest_stage', String(newHighest));
                } catch {}

                return newTotal;
              });

              setTimeout(() => {
                setShowRewardModal(true);
                GameSounds.playWinFanfare();
              }, 600);
            }
            return nextMatched;
          });
        }, 350);
      } else {
        // NO MATCH -> Reset combo and flip back
        setTimeout(() => {
          GameSounds.playWrong();
          setComboStreak(0);
          setCards((prev) =>
            prev.map((c, i) =>
              (i === firstIdx || i === secondIdx) && !c.isMatched ? { ...c, isFlipped: false } : c
            )
          );
          setFlippedIndices([]);
        }, 650);
      }
    }
  };

  // Next stage transition
  const handleProceedToNextStage = () => {
    setShowRewardModal(false);
    setCurrentStage((prev) => prev + 1);
  };

  // Restart from Stage 1
  const handleRestartFromStage1 = () => {
    setAccumulatedScore(0);
    setCurrentStage(1);
    try {
      localStorage.setItem('memory_game_stage', '1');
      localStorage.setItem('memory_game_score', '0');
    } catch {}
    initStageDeck(1);
  };

  // Claim all accumulated reward points and finish
  const handleClaimAndExit = () => {
    if (onClaimReward && accumulatedScore > 0) {
      onClaimReward(accumulatedScore);
    }
    setAccumulatedScore(0);
    setCurrentStage(1);
    try {
      localStorage.setItem('memory_game_stage', '1');
      localStorage.setItem('memory_game_score', '0');
    } catch {}
    setShowRewardModal(false);
  };

  const progressPercent = Math.min(100, Math.round((matchedCount / stageConfig.pairsCount) * 100));
  const nextStagePreview = getStageConfig(currentStage + 1);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans select-none pb-12 animate-fade-in">
      <GameHeader
        title={t('games.memory.title')}
        subtitle={`${t('games.memory.stage', { stage: currentStage })}: ${stageConfig.theme.name}`}
        onBack={onBack}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
        onRestart={() => initStageDeck(currentStage)}
        restartTooltip={t('games.memory.btn_restart')}
        onHelp={() => setShowTutorial(true)}
      />

      {/* ── MAIN STAGE ── */}
      <main className="flex-1 max-w-lg mx-auto w-full px-3 py-2 flex flex-col items-center justify-between space-y-2.5">
        {/* ── 1. STAGE INFO & THEME BADGE BAR ── */}
        <div className="w-full bg-slate-900/95 border border-slate-800/90 p-2.5 rounded-2xl shadow-lg flex items-center justify-between gap-2">
          {/* Stage & Theme Title */}
          <div className="flex items-center gap-2 overflow-hidden">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${stageConfig.theme.bgGradient} flex items-center justify-center text-lg shadow-md shrink-0 border border-white/20`}>
              {stageConfig.theme.icon}
            </div>
            <div className="overflow-hidden">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.2 rounded-md">
                  {t('games.memory.stage', { stage: currentStage })}
                </span>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.2 rounded-md">
                  {t(stageConfig.difficultyLabelKey)}
                </span>
              </div>
              <h2 className="text-xs sm:text-sm font-black text-white truncate drop-shadow-xs mt-0.5">
                {stageConfig.theme.name}
              </h2>
            </div>
          </div>

          {/* Accumulated Points Counter */}
          <div className="bg-amber-950/50 border border-amber-500/40 px-2.5 py-1 rounded-xl text-center shrink-0">
            <span className="text-[8px] text-amber-300 block uppercase font-black">
              {t('games.memory.total_score')}
            </span>
            <span className="font-mono font-black text-amber-400 text-xs sm:text-sm flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3 text-yellow-300" />
              {accumulatedScore}
            </span>
          </div>
        </div>

        {/* ── 2. STATS & POWER-UP ACTION BAR ── */}
        <div className="w-full bg-slate-900/90 border border-slate-800 px-3.5 py-2 rounded-2xl shadow-md flex items-center justify-between gap-2">
          {/* Timer with Warning Animation */}
          <div className="flex items-center gap-2">
            <Clock className={`w-4 h-4 ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-amber-400'}`} />
            <div>
              <div className="flex items-center gap-1">
                <span className={`font-mono text-sm font-black ${timeLeft <= 10 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                  {timeLeft}s
                </span>
                <span className="text-[10px] text-slate-400">/ {totalTime}s</span>
              </div>
            </div>
          </div>

          {/* Combo & Matches Tracker */}
          <div className="flex items-center gap-2">
            {comboStreak > 1 && (
              <span className="flex items-center gap-1 text-[11px] font-black text-amber-400 bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 rounded-full animate-bounce">
                <Flame className="w-3 h-3 fill-amber-400" />
                x{comboStreak}
              </span>
            )}
            <span className="text-xs font-mono text-slate-300">
              {moves} {t('games.memory.moves_unit', { defaultValue: 'lượt' })}
            </span>
            <span className="bg-amber-500 text-slate-950 font-black text-xs px-2 py-0.5 rounded-lg shadow-xs">
              {matchedCount}/{stageConfig.pairsCount}
            </span>
          </div>

          {/* Interactive Power-up Buttons */}
          <div className="flex items-center gap-1.5">
            {/* X-Ray Peek Button */}
            <button
              onClick={handleXRayPeek}
              disabled={!peekAvailable || isPeeking}
              className={`px-2 py-1 rounded-xl text-[10px] sm:text-[11px] font-black flex items-center gap-1 border transition shadow-xs ${
                peekAvailable && !isPeeking
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 border-blue-400 text-white hover:brightness-110 active:scale-95'
                  : 'bg-slate-800/60 border-slate-700 text-slate-500 cursor-not-allowed opacity-50'
              }`}
              title={t('games.memory.btn_peek', { defaultValue: 'Mắt Thần (1.5s)' })}
            >
              <Eye className="w-3 h-3" />
              <span>{t('games.memory.btn_peek', { defaultValue: 'Mắt Thần' })}</span>
            </button>

            {/* Time Freeze (+10s) */}
            <button
              onClick={handleTimeFreeze}
              disabled={!freezeAvailable}
              className={`px-2 py-1 rounded-xl text-[10px] sm:text-[11px] font-black flex items-center gap-1 border transition shadow-xs ${
                freezeAvailable
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 border-emerald-400 text-white hover:brightness-110 active:scale-95'
                  : 'bg-slate-800/60 border-slate-700 text-slate-500 cursor-not-allowed opacity-50'
              }`}
              title={t('games.memory.btn_freeze', { defaultValue: '+10 Giây' })}
            >
              <Zap className="w-3 h-3" />
              <span>{t('games.memory.btn_freeze', { defaultValue: '+10s' })}</span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-400 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* ── 3. DYNAMIC 3D CARDS BOARD ── */}
        <div className="relative w-full max-w-md flex-1 flex items-center justify-center p-1">
          {matchPopup && (
            <div className="absolute -top-3 inset-x-0 flex justify-center z-30 pointer-events-none animate-bounce">
              <span className="px-4 py-1.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black text-xs rounded-full shadow-2xl border-2 border-yellow-200">
                {matchPopup}
              </span>
            </div>
          )}

          <div className={`w-full grid ${stageConfig.gridColsClass} gap-2 sm:gap-2.5`}>
            {cards.map((card, idx) => {
              const isRevealed = card.isFlipped || card.isMatched;

              return (
                <div
                  key={card.id}
                  onClick={() => handleCardClick(idx)}
                  className="relative aspect-square rounded-2xl cursor-pointer perspective-1000 transition-transform duration-200 active:scale-95 select-none group"
                >
                  <div
                    className={`w-full h-full rounded-2xl transition-transform duration-500 transform-style-3d relative ${
                      isRevealed ? 'rotate-y-180 shadow-xl' : 'shadow-md'
                    }`}
                  >
                    {/* Card Back (Facedown - Luxury Gold Pattern) */}
                    <div
                      className={`absolute inset-0 backface-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border-2 border-amber-400/60 rounded-2xl flex flex-col items-center justify-center p-1.5 group-hover:border-amber-300 transition overflow-hidden ${
                        isRevealed ? 'pointer-events-none opacity-0' : 'z-10 opacity-100'
                      }`}
                    >
                      <div className="absolute inset-1 rounded-xl border border-amber-400/20 border-dashed" />
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 flex items-center justify-center shadow-lg border border-yellow-200 group-hover:scale-110 transition">
                        <span className="text-amber-950 font-black text-sm sm:text-base">★</span>
                      </div>
                      <span className="text-[7px] sm:text-[8px] font-black text-amber-300 uppercase tracking-widest mt-1">
                        NATCASH
                      </span>
                    </div>

                    {/* Card Front (Faceup - Thematic Vector Art) */}
                    <div
                      className={`absolute inset-0 backface-hidden rotate-y-180 bg-gradient-to-br ${card.bgGradient} rounded-2xl border-2 ${
                        card.isMatched ? 'border-amber-300 ring-2 ring-amber-400/70 shadow-amber-500/30' : 'border-white/70'
                      } flex flex-col items-center justify-center p-1.5 text-white shadow-xl overflow-hidden ${
                        isRevealed ? 'z-10 opacity-100' : 'pointer-events-none opacity-0'
                      }`}
                    >
                      <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/35 to-transparent pointer-events-none" />

                      {/* Icon */}
                      <span className="text-2xl sm:text-3xl drop-shadow-md transform transition group-hover:scale-110">
                        {card.icon}
                      </span>

                      {/* Label */}
                      <span className="text-[8px] sm:text-[9px] font-black tracking-tight text-white mt-1 uppercase text-center line-clamp-1 leading-none drop-shadow">
                        {card.label}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Timeout Overlay */}
          {isTimeout && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center p-6 text-center animate-fade-in z-30 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-red-600/30 border border-red-500 text-red-400 flex items-center justify-center text-2xl animate-bounce">
                ⏰
              </div>
              <div>
                <h3 className="text-lg font-black text-red-400">
                  {t('games.memory.game_over_stage', { stage: currentStage })}
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  {t('games.memory.matches', { matched: matchedCount, total: stageConfig.pairsCount })}
                </p>
                {accumulatedScore > 0 && (
                  <div className="mt-2 bg-slate-900 border border-amber-500/40 px-3 py-1.5 rounded-xl">
                    <span className="text-xs text-slate-400 block">{t('games.memory.total_score')}</span>
                    <span className="text-lg font-black text-amber-400 font-mono">+{accumulatedScore} {t('nav.points_unit')}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 w-full max-w-xs">
                {accumulatedScore > 0 && (
                  <button
                    onClick={handleClaimAndExit}
                    className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black rounded-xl text-sm shadow-lg active:scale-95 transition"
                  >
                    {t('games.memory.btn_claim_and_exit')}
                  </button>
                )}
                <button
                  onClick={handleRestartFromStage1}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs border border-slate-700 transition flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{t('games.memory.btn_retry_from_stage_1')}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Subtitle */}
        <p className="text-[11px] text-slate-400 text-center max-w-xs leading-relaxed">
          {t('games.memory.subtitle')}
        </p>
      </main>

      {/* ── STAGE CLEARED MODAL (VƯỢT ẢI THÀNH CÔNG) ── */}
      {showRewardModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border-2 border-amber-500/70 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl relative overflow-hidden">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center text-3xl mx-auto shadow-xl animate-bounce">
              🏆
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-amber-400 bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 rounded-full">
                {t('games.memory.stage', { stage: currentStage })} • {stageConfig.theme.name}
              </span>
              <h3 className="text-xl font-black text-white mt-1.5">{t('games.memory.stage_cleared')}</h3>
              <p className="text-xs text-slate-400 mt-1">
                {moves} {t('games.memory.moves_unit', { defaultValue: 'lượt' })} • {timeLeft}s {t('games.memory.time_bonus_label', { defaultValue: 'thời gian dư' })}
              </p>

              {/* Points Summary Box */}
              <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-2xl mt-3 space-y-1.5">
                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span>Màn này:</span>
                  <span className="font-mono font-bold text-emerald-400">+{stageScoreWon} {t('nav.points_unit')}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-bold text-white border-t border-slate-800 pt-1">
                  <span>{t('games.memory.total_score')}:</span>
                  <span className="font-mono font-black text-amber-400 text-base">+{accumulatedScore} {t('nav.points_unit')}</span>
                </div>
              </div>

              {/* Next Stage Preview */}
              <div className="bg-slate-800/60 border border-slate-700/60 p-2 rounded-xl mt-3 flex items-center justify-between text-left">
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="text-base">{nextStagePreview.theme.icon}</span>
                  <div className="overflow-hidden">
                    <span className="text-[9px] text-slate-400 block font-bold">Màn Tiếp Theo:</span>
                    <span className="text-[11px] font-black text-amber-300 truncate block">
                      {t('games.memory.stage', { stage: currentStage + 1 })}: {nextStagePreview.theme.name}
                    </span>
                  </div>
                </div>
                <Award className="w-4 h-4 text-yellow-400 shrink-0" />
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-1">
              <button
                onClick={handleProceedToNextStage}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black rounded-xl text-sm shadow-lg active:scale-95 transition flex items-center justify-center gap-2"
              >
                <span>{t('games.memory.btn_next_stage')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={handleClaimAndExit}
                className="w-full py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs border border-slate-700 transition"
              >
                {t('games.memory.btn_claim_and_exit')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── GAME TUTORIAL MODAL ── */}
      <GameTutorialModal
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
        gameTitle={t('games.memory.title')}
        gameIcon="🧠"
        goal={t('games.memory.tutorial.goal')}
        controls={t('games.memory.tutorial.controls')}
        scoring={t('games.memory.tutorial.scoring')}
        tips={t('games.memory.tutorial.tips')}
      />
    </div>
  );
};
