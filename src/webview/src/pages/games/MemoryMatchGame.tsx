import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, Eye, Sparkles, Flame, Zap, RotateCcw, Award, ArrowRight, Check } from 'lucide-react';
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
// eslint-disable-next-line react-refresh/only-export-components
export const ALL_THEMES: ThemeCategory[] = [
  // 1. Đối Tác & Ví Natcash
  {
    id: 'PARTNERS',
    name: 'games.memory.decks.partners.name',
    badge: 'Natcom Alliance',
    icon: '🏢',
    bgGradient: 'from-amber-500 to-orange-600',
    cards: [
      { pairId: 1, icon: '🛒', label: 'games.memory.decks.partners.c1', bgGradient: 'from-amber-500 to-orange-600', accentColor: '#F59E0B' },
      { pairId: 2, icon: '⛽', label: 'games.memory.decks.partners.c2', bgGradient: 'from-red-500 to-rose-600', accentColor: '#EF4444' },
      { pairId: 3, icon: '📡', label: 'games.memory.decks.partners.c3', bgGradient: 'from-blue-500 to-indigo-600', accentColor: '#3B82F6' },
      { pairId: 4, icon: '👑', label: 'games.memory.decks.partners.c4', bgGradient: 'from-yellow-400 to-amber-500', accentColor: '#EAB308' },
      { pairId: 5, icon: '📱', label: 'games.memory.decks.partners.c5', bgGradient: 'from-emerald-500 to-teal-600', accentColor: '#10B981' },
      { pairId: 6, icon: '💳', label: 'games.memory.decks.partners.c6', bgGradient: 'from-purple-500 to-pink-600', accentColor: '#A855F7' },
      { pairId: 7, icon: '☀️', label: 'games.memory.decks.partners.c7', bgGradient: 'from-orange-400 to-amber-600', accentColor: '#F97316' },
      { pairId: 8, icon: '🏬', label: 'games.memory.decks.partners.c8', bgGradient: 'from-cyan-500 to-blue-600', accentColor: '#06B6D4' },
      { pairId: 9, icon: '🎁', label: 'games.memory.decks.partners.c9', bgGradient: 'from-rose-500 to-pink-600', accentColor: '#F43F5E' },
      { pairId: 10, icon: '💎', label: 'games.memory.decks.partners.c10', bgGradient: 'from-violet-500 to-purple-600', accentColor: '#8B5CF6' },
      { pairId: 11, icon: '🪙', label: 'games.memory.decks.partners.c11', bgGradient: 'from-yellow-500 to-amber-700', accentColor: '#EAB308' },
      { pairId: 12, icon: '📲', label: 'games.memory.decks.partners.c12', bgGradient: 'from-teal-500 to-emerald-700', accentColor: '#14B8A6' },
    ],
  },
  // 2. Lễ Hội Kanaval Caribe
  {
    id: 'CARNIVAL',
    name: 'games.memory.decks.carnival.name',
    badge: 'Haitian Kanaval',
    icon: '🎭',
    bgGradient: 'from-pink-500 to-purple-600',
    cards: [
      { pairId: 1, icon: '🥁', label: 'games.memory.decks.carnival.c1', bgGradient: 'from-amber-500 to-red-600', accentColor: '#F59E0B' },
      { pairId: 2, icon: '🎭', label: 'games.memory.decks.carnival.c2', bgGradient: 'from-purple-500 to-pink-600', accentColor: '#A855F7' },
      { pairId: 3, icon: '🏴‍☠️', label: 'games.memory.decks.carnival.c3', bgGradient: 'from-yellow-500 to-amber-700', accentColor: '#EAB308' },
      { pairId: 4, icon: '🏮', label: 'games.memory.decks.carnival.c4', bgGradient: 'from-orange-500 to-rose-600', accentColor: '#F97316' },
      { pairId: 5, icon: '⛵', label: 'games.memory.decks.carnival.c5', bgGradient: 'from-sky-500 to-blue-600', accentColor: '#0EA5E9' },
      { pairId: 6, icon: '🦪', label: 'games.memory.decks.carnival.c6', bgGradient: 'from-teal-400 to-emerald-600', accentColor: '#14B8A6' },
      { pairId: 7, icon: '🌴', label: 'games.memory.decks.carnival.c7', bgGradient: 'from-emerald-500 to-green-700', accentColor: '#10B981' },
      { pairId: 8, icon: '🦜', label: 'games.memory.decks.carnival.c8', bgGradient: 'from-lime-500 to-emerald-600', accentColor: '#84CC16' },
      { pairId: 9, icon: '🐬', label: 'games.memory.decks.carnival.c9', bgGradient: 'from-cyan-500 to-blue-700', accentColor: '#06B6D4' },
      { pairId: 10, icon: '👑', label: 'games.memory.decks.carnival.c10', bgGradient: 'from-yellow-400 to-amber-600', accentColor: '#EAB308' },
      { pairId: 11, icon: '🎺', label: 'games.memory.decks.carnival.c11', bgGradient: 'from-rose-500 to-amber-600', accentColor: '#F43F5E' },
      { pairId: 12, icon: '🎆', label: 'games.memory.decks.carnival.c12', bgGradient: 'from-indigo-500 to-purple-700', accentColor: '#6366F1' },
    ],
  },
  // 3. Đá Quý & Thần Tài
  {
    id: 'GEMS',
    name: 'games.memory.decks.gems.name',
    badge: 'Lucky Treasure',
    icon: '💎',
    bgGradient: 'from-cyan-500 to-blue-600',
    cards: [
      { pairId: 1, icon: '💎', label: 'games.memory.decks.gems.c1', bgGradient: 'from-cyan-400 to-blue-600', accentColor: '#06B6D4' },
      { pairId: 2, icon: '🔴', label: 'games.memory.decks.gems.c2', bgGradient: 'from-rose-500 to-red-600', accentColor: '#F43F5E' },
      { pairId: 3, icon: '🟢', label: 'games.memory.decks.gems.c3', bgGradient: 'from-emerald-400 to-teal-600', accentColor: '#10B981' },
      { pairId: 4, icon: '🔮', label: 'games.memory.decks.gems.c4', bgGradient: 'from-purple-500 to-indigo-600', accentColor: '#A855F7' },
      { pairId: 5, icon: '🪙', label: 'games.memory.decks.gems.c5', bgGradient: 'from-amber-400 to-yellow-600', accentColor: '#F59E0B' },
      { pairId: 6, icon: '🔔', label: 'games.memory.decks.gems.c6', bgGradient: 'from-yellow-400 to-orange-500', accentColor: '#EAB308' },
      { pairId: 7, icon: '⭐', label: 'games.memory.decks.gems.c7', bgGradient: 'from-amber-300 to-orange-500', accentColor: '#F59E0B' },
      { pairId: 8, icon: '🔥', label: 'games.memory.decks.gems.c8', bgGradient: 'from-orange-500 to-red-600', accentColor: '#F97316' },
      { pairId: 9, icon: '🍀', label: 'games.memory.decks.gems.c9', bgGradient: 'from-green-400 to-emerald-600', accentColor: '#22C55E' },
      { pairId: 10, icon: '💖', label: 'games.memory.decks.gems.c10', bgGradient: 'from-pink-500 to-rose-600', accentColor: '#EC4899' },
      { pairId: 11, icon: '🔱', label: 'games.memory.decks.gems.c11', bgGradient: 'from-blue-400 to-cyan-600', accentColor: '#38BDF8' },
      { pairId: 12, icon: '🧿', label: 'games.memory.decks.gems.c12', bgGradient: 'from-indigo-400 to-violet-600', accentColor: '#818CF8' },
    ],
  },
  // 4. Ẩm Thực Đường Phố Haiti
  {
    id: 'HAITI_FOOD',
    name: 'games.memory.decks.haiti_food.name',
    badge: 'Creole Flavors',
    icon: '🍲',
    bgGradient: 'from-amber-600 to-red-600',
    cards: [
      { pairId: 1, icon: '🍖', label: 'games.memory.decks.haiti_food.c1', bgGradient: 'from-amber-600 to-orange-700', accentColor: '#D97706' },
      { pairId: 2, icon: '🥟', label: 'games.memory.decks.haiti_food.c2', bgGradient: 'from-yellow-500 to-amber-600', accentColor: '#F59E0B' },
      { pairId: 3, icon: '🍌', label: 'games.memory.decks.haiti_food.c3', bgGradient: 'from-yellow-400 to-amber-500', accentColor: '#EAB308' },
      { pairId: 4, icon: '🍚', label: 'games.memory.decks.haiti_food.c4', bgGradient: 'from-slate-700 to-slate-900', accentColor: '#475569' },
      { pairId: 5, icon: '🥣', label: 'games.memory.decks.haiti_food.c5', bgGradient: 'from-orange-500 to-amber-600', accentColor: '#F97316' },
      { pairId: 6, icon: '☕', label: 'games.memory.decks.haiti_food.c6', bgGradient: 'from-amber-800 to-stone-900', accentColor: '#78350F' },
      { pairId: 7, icon: '🥥', label: 'games.memory.decks.haiti_food.c7', bgGradient: 'from-emerald-500 to-teal-600', accentColor: '#10B981' },
      { pairId: 8, icon: '🦐', label: 'games.memory.decks.haiti_food.c8', bgGradient: 'from-rose-500 to-red-600', accentColor: '#F43F5E' },
      { pairId: 9, icon: '🥭', label: 'games.memory.decks.haiti_food.c9', bgGradient: 'from-amber-400 to-orange-500', accentColor: '#F59E0B' },
      { pairId: 10, icon: '🌽', label: 'games.memory.decks.haiti_food.c10', bgGradient: 'from-yellow-400 to-emerald-600', accentColor: '#EAB308' },
      { pairId: 11, icon: '🥑', label: 'games.memory.decks.haiti_food.c11', bgGradient: 'from-lime-500 to-emerald-700', accentColor: '#84CC16' },
      { pairId: 12, icon: '🍹', label: 'games.memory.decks.haiti_food.c12', bgGradient: 'from-pink-500 to-rose-700', accentColor: '#EC4899' },
    ],
  },
  // 5. Động Vật Hoang Dã
  {
    id: 'WILD_ANIMALS',
    name: 'games.memory.decks.wild_animals.name',
    badge: 'Safari Wildlife',
    icon: '🦁',
    bgGradient: 'from-emerald-600 to-teal-700',
    cards: [
      { pairId: 1, icon: '🦁', label: 'games.memory.decks.wild_animals.c1', bgGradient: 'from-amber-500 to-yellow-600', accentColor: '#F59E0B' },
      { pairId: 2, icon: '🐘', label: 'games.memory.decks.wild_animals.c2', bgGradient: 'from-slate-500 to-slate-700', accentColor: '#64748B' },
      { pairId: 3, icon: '🐯', label: 'games.memory.decks.wild_animals.c3', bgGradient: 'from-orange-500 to-red-600', accentColor: '#F97316' },
      { pairId: 4, icon: '🦒', label: 'games.memory.decks.wild_animals.c4', bgGradient: 'from-yellow-500 to-amber-600', accentColor: '#EAB308' },
      { pairId: 5, icon: '🐼', label: 'games.memory.decks.wild_animals.c5', bgGradient: 'from-zinc-700 to-zinc-900', accentColor: '#3F3F46' },
      { pairId: 6, icon: '🐆', label: 'games.memory.decks.wild_animals.c6', bgGradient: 'from-amber-400 to-orange-600', accentColor: '#F59E0B' },
      { pairId: 7, icon: '🦅', label: 'games.memory.decks.wild_animals.c7', bgGradient: 'from-stone-600 to-stone-800', accentColor: '#78716C' },
      { pairId: 8, icon: '🐒', label: 'games.memory.decks.wild_animals.c8', bgGradient: 'from-amber-600 to-amber-800', accentColor: '#D97706' },
      { pairId: 9, icon: '🦛', label: 'games.memory.decks.wild_animals.c9', bgGradient: 'from-blue-600 to-slate-700', accentColor: '#2563EB' },
      { pairId: 10, icon: '🦓', label: 'games.memory.decks.wild_animals.c10', bgGradient: 'from-slate-800 to-slate-950', accentColor: '#1E293B' },
      { pairId: 11, icon: '🐺', label: 'games.memory.decks.wild_animals.c11', bgGradient: 'from-cyan-700 to-blue-900', accentColor: '#0E7490' },
      { pairId: 12, icon: '🦘', label: 'games.memory.decks.wild_animals.c12', bgGradient: 'from-orange-600 to-amber-700', accentColor: '#EA580C' },
    ],
  },
  // 6. Vũ Trụ & Thiên Văn
  {
    id: 'SPACE',
    name: 'games.memory.decks.space.name',
    badge: 'Cosmic Galaxy',
    icon: '🚀',
    bgGradient: 'from-indigo-600 to-purple-800',
    cards: [
      { pairId: 1, icon: '🚀', label: 'games.memory.decks.space.c1', bgGradient: 'from-rose-500 to-red-600', accentColor: '#F43F5E' },
      { pairId: 2, icon: '🪐', label: 'games.memory.decks.space.c2', bgGradient: 'from-amber-500 to-yellow-600', accentColor: '#F59E0B' },
      { pairId: 3, icon: '☀️', label: 'games.memory.decks.space.c3', bgGradient: 'from-yellow-400 to-orange-500', accentColor: '#EAB308' },
      { pairId: 4, icon: '🌙', label: 'games.memory.decks.space.c4', bgGradient: 'from-blue-400 to-indigo-600', accentColor: '#60A5FA' },
      { pairId: 5, icon: '☄️', label: 'games.memory.decks.space.c5', bgGradient: 'from-orange-500 to-red-700', accentColor: '#F97316' },
      { pairId: 6, icon: '🔭', label: 'games.memory.decks.space.c6', bgGradient: 'from-teal-500 to-cyan-700', accentColor: '#14B8A6' },
      { pairId: 7, icon: '👨‍🚀', label: 'games.memory.decks.space.c7', bgGradient: 'from-sky-400 to-blue-600', accentColor: '#38BDF8' },
      { pairId: 8, icon: '🛰️', label: 'games.memory.decks.space.c8', bgGradient: 'from-blue-500 to-indigo-600', accentColor: '#3B82F6' },
      { pairId: 9, icon: '🌌', label: 'games.memory.decks.space.c9', bgGradient: 'from-purple-600 to-indigo-900', accentColor: '#9333EA' },
      { pairId: 10, icon: '🛸', label: 'games.memory.decks.space.c10', bgGradient: 'from-emerald-400 to-teal-600', accentColor: '#10B981' },
      { pairId: 11, icon: '🌠', label: 'games.memory.decks.space.c11', bgGradient: 'from-amber-300 to-yellow-500', accentColor: '#FDE047' },
      { pairId: 12, icon: '🌍', label: 'games.memory.decks.space.c12', bgGradient: 'from-cyan-500 to-blue-600', accentColor: '#06B6D4' },
    ],
  },
  // 7. Thể Thao & Parkour
  {
    id: 'SPORTS',
    name: 'games.memory.decks.sports.name',
    badge: 'Pro Athletes',
    icon: '⚽',
    bgGradient: 'from-blue-600 to-emerald-600',
    cards: [
      { pairId: 1, icon: '⚽', label: 'games.memory.decks.sports.c1', bgGradient: 'from-emerald-500 to-teal-700', accentColor: '#10B981' },
      { pairId: 2, icon: '🏀', label: 'games.memory.decks.sports.c2', bgGradient: 'from-orange-500 to-amber-600', accentColor: '#F97316' },
      { pairId: 3, icon: '👟', label: 'games.memory.decks.sports.c3', bgGradient: 'from-rose-500 to-red-600', accentColor: '#F43F5E' },
      { pairId: 4, icon: '🥇', label: 'games.memory.decks.sports.c4', bgGradient: 'from-yellow-400 to-amber-500', accentColor: '#EAB308' },
      { pairId: 5, icon: '🏆', label: 'games.memory.decks.sports.c5', bgGradient: 'from-amber-400 to-yellow-600', accentColor: '#F59E0B' },
      { pairId: 6, icon: '🛹', label: 'games.memory.decks.sports.c6', bgGradient: 'from-cyan-500 to-blue-600', accentColor: '#06B6D4' },
      { pairId: 7, icon: '🎾', label: 'games.memory.decks.sports.c7', bgGradient: 'from-lime-400 to-emerald-500', accentColor: '#84CC16' },
      { pairId: 8, icon: '🥊', label: 'games.memory.decks.sports.c8', bgGradient: 'from-red-600 to-rose-700', accentColor: '#DC2626' },
      { pairId: 9, icon: '🥋', label: 'games.memory.decks.sports.c9', bgGradient: 'from-slate-700 to-slate-900', accentColor: '#334155' },
      { pairId: 10, icon: '📢', label: 'games.memory.decks.sports.c10', bgGradient: 'from-yellow-500 to-amber-600', accentColor: '#F59E0B' },
      { pairId: 11, icon: '🏸', label: 'games.memory.decks.sports.c11', bgGradient: 'from-sky-400 to-blue-600', accentColor: '#38BDF8' },
      { pairId: 12, icon: '🎯', label: 'games.memory.decks.sports.c12', bgGradient: 'from-purple-500 to-indigo-600', accentColor: '#A855F7' },
    ],
  },
  // 8. Công Nghệ & Kỹ Thuật Số
  {
    id: 'TECHNOLOGY',
    name: 'games.memory.decks.technology.name',
    badge: 'Cyber Future',
    icon: '💻',
    bgGradient: 'from-cyan-600 to-indigo-700',
    cards: [
      { pairId: 1, icon: '📱', label: 'games.memory.decks.technology.c1', bgGradient: 'from-blue-500 to-cyan-600', accentColor: '#3B82F6' },
      { pairId: 2, icon: '💻', label: 'games.memory.decks.technology.c2', bgGradient: 'from-slate-600 to-slate-800', accentColor: '#64748B' },
      { pairId: 3, icon: '🎧', label: 'games.memory.decks.technology.c3', bgGradient: 'from-purple-500 to-pink-600', accentColor: '#A855F7' },
      { pairId: 4, icon: '🤖', label: 'games.memory.decks.technology.c4', bgGradient: 'from-emerald-400 to-teal-600', accentColor: '#10B981' },
      { pairId: 5, icon: '🎮', label: 'games.memory.decks.technology.c5', bgGradient: 'from-rose-500 to-red-600', accentColor: '#F43F5E' },
      { pairId: 6, icon: '🚁', label: 'games.memory.decks.technology.c6', bgGradient: 'from-amber-500 to-orange-600', accentColor: '#F59E0B' },
      { pairId: 7, icon: '💽', label: 'games.memory.decks.technology.c7', bgGradient: 'from-teal-500 to-emerald-700', accentColor: '#14B8A6' },
      { pairId: 8, icon: '⌚', label: 'games.memory.decks.technology.c8', bgGradient: 'from-indigo-500 to-purple-600', accentColor: '#6366F1' },
      { pairId: 9, icon: '🥽', label: 'games.memory.decks.technology.c9', bgGradient: 'from-cyan-400 to-blue-600', accentColor: '#06B6D4' },
      { pairId: 10, icon: '💾', label: 'games.memory.decks.technology.c10', bgGradient: 'from-yellow-400 to-amber-600', accentColor: '#EAB308' },
      { pairId: 11, icon: '⌨️', label: 'games.memory.decks.technology.c11', bgGradient: 'from-stone-600 to-stone-800', accentColor: '#78716C' },
      { pairId: 12, icon: '🖱️', label: 'games.memory.decks.technology.c12', bgGradient: 'from-red-500 to-orange-600', accentColor: '#EF4444' },
    ],
  },
  // 9. Kỳ Quan Thiên Nhiên
  {
    id: 'WONDERS',
    name: 'games.memory.decks.wonders.name',
    badge: 'Earth Wonders',
    icon: '🌋',
    bgGradient: 'from-teal-600 to-emerald-700',
    cards: [
      { pairId: 1, icon: '🌋', label: 'games.memory.decks.wonders.c1', bgGradient: 'from-red-600 to-amber-700', accentColor: '#DC2626' },
      { pairId: 2, icon: '🌊', label: 'games.memory.decks.wonders.c2', bgGradient: 'from-cyan-500 to-blue-600', accentColor: '#06B6D4' },
      { pairId: 3, icon: '🕳️', label: 'games.memory.decks.wonders.c3', bgGradient: 'from-stone-700 to-stone-900', accentColor: '#44403C' },
      { pairId: 4, icon: '🪸', label: 'games.memory.decks.wonders.c4', bgGradient: 'from-pink-500 to-rose-600', accentColor: '#EC4899' },
      { pairId: 5, icon: '🏖️', label: 'games.memory.decks.wonders.c5', bgGradient: 'from-amber-400 to-yellow-500', accentColor: '#F59E0B' },
      { pairId: 6, icon: '🌈', label: 'games.memory.decks.wonders.c6', bgGradient: 'from-indigo-500 to-purple-600', accentColor: '#8B5CF6' },
      { pairId: 7, icon: '🌲', label: 'games.memory.decks.wonders.c7', bgGradient: 'from-emerald-600 to-green-800', accentColor: '#059669' },
      { pairId: 8, icon: '🌅', label: 'games.memory.decks.wonders.c8', bgGradient: 'from-orange-500 to-rose-600', accentColor: '#F97316' },
      { pairId: 9, icon: '🏝️', label: 'games.memory.decks.wonders.c9', bgGradient: 'from-teal-400 to-cyan-600', accentColor: '#14B8A6' },
      { pairId: 10, icon: '🏜️', label: 'games.memory.decks.wonders.c10', bgGradient: 'from-yellow-600 to-amber-700', accentColor: '#D97706' },
      { pairId: 11, icon: '🏔️', label: 'games.memory.decks.wonders.c11', bgGradient: 'from-blue-300 to-indigo-500', accentColor: '#93C5FD' },
      { pairId: 12, icon: '🧊', label: 'games.memory.decks.wonders.c12', bgGradient: 'from-sky-300 to-blue-500', accentColor: '#7DD3FC' },
    ],
  },
  // 10. Phù Thủy & Phép Thuật
  {
    id: 'MAGIC',
    name: 'games.memory.decks.magic.name',
    badge: 'Magic Spellbook',
    icon: '🧙‍♂️',
    bgGradient: 'from-purple-600 to-violet-800',
    cards: [
      { pairId: 1, icon: '🪄', label: 'games.memory.decks.magic.c1', bgGradient: 'from-amber-400 to-yellow-600', accentColor: '#F59E0B' },
      { pairId: 2, icon: '🧙', label: 'games.memory.decks.magic.c2', bgGradient: 'from-purple-600 to-indigo-800', accentColor: '#9333EA' },
      { pairId: 3, icon: '🧪', label: 'games.memory.decks.magic.c3', bgGradient: 'from-emerald-400 to-teal-600', accentColor: '#10B981' },
      { pairId: 4, icon: '📖', label: 'games.memory.decks.magic.c4', bgGradient: 'from-amber-700 to-amber-900', accentColor: '#B45309' },
      { pairId: 5, icon: '🔮', label: 'games.memory.decks.magic.c5', bgGradient: 'from-pink-500 to-purple-600', accentColor: '#D946EF' },
      { pairId: 6, icon: '🐉', label: 'games.memory.decks.magic.c6', bgGradient: 'from-red-600 to-orange-700', accentColor: '#DC2626' },
      { pairId: 7, icon: '🧹', label: 'games.memory.decks.magic.c7', bgGradient: 'from-yellow-600 to-amber-800', accentColor: '#D97706' },
      { pairId: 8, icon: '🧥', label: 'games.memory.decks.magic.c8', bgGradient: 'from-indigo-500 to-slate-800', accentColor: '#6366F1' },
      { pairId: 9, icon: '🗝️', label: 'games.memory.decks.magic.c9', bgGradient: 'from-yellow-400 to-amber-600', accentColor: '#EAB308' },
      { pairId: 10, icon: '🕯️', label: 'games.memory.decks.magic.c10', bgGradient: 'from-orange-400 to-red-500', accentColor: '#F97316' },
      { pairId: 11, icon: '🥣', label: 'games.memory.decks.magic.c11', bgGradient: 'from-teal-600 to-emerald-800', accentColor: '#0D9488' },
      { pairId: 12, icon: '✨', label: 'games.memory.decks.magic.c12', bgGradient: 'from-yellow-300 to-amber-400', accentColor: '#FDE047' },
    ],
  },
  // 11. Trái Cây Nhiệt Đới
  {
    id: 'FRUITS',
    name: 'games.memory.decks.fruits.name',
    badge: 'Tropical Orchard',
    icon: '🍉',
    bgGradient: 'from-emerald-500 to-lime-600',
    cards: [
      { pairId: 1, icon: '🍉', label: 'games.memory.decks.fruits.c1', bgGradient: 'from-red-500 to-emerald-600', accentColor: '#EF4444' },
      { pairId: 2, icon: '🥑', label: 'games.memory.decks.fruits.c2', bgGradient: 'from-lime-500 to-emerald-700', accentColor: '#84CC16' },
      { pairId: 3, icon: '🍍', label: 'games.memory.decks.fruits.c3', bgGradient: 'from-amber-400 to-yellow-600', accentColor: '#F59E0B' },
      { pairId: 4, icon: '🍌', label: 'games.memory.decks.fruits.c4', bgGradient: 'from-yellow-400 to-amber-500', accentColor: '#EAB308' },
      { pairId: 5, icon: '🍓', label: 'games.memory.decks.fruits.c5', bgGradient: 'from-rose-500 to-red-600', accentColor: '#F43F5E' },
      { pairId: 6, icon: '🍊', label: 'games.memory.decks.fruits.c6', bgGradient: 'from-orange-400 to-amber-500', accentColor: '#F97316' },
      { pairId: 7, icon: '🍎', label: 'games.memory.decks.fruits.c7', bgGradient: 'from-red-500 to-rose-600', accentColor: '#EF4444' },
      { pairId: 8, icon: '🍇', label: 'games.memory.decks.fruits.c8', bgGradient: 'from-purple-500 to-indigo-600', accentColor: '#A855F7' },
      { pairId: 9, icon: '🍈', label: 'games.memory.decks.fruits.c9', bgGradient: 'from-yellow-500 to-orange-600', accentColor: '#F59E0B' },
      { pairId: 10, icon: '🍋', label: 'games.memory.decks.fruits.c10', bgGradient: 'from-yellow-300 to-lime-500', accentColor: '#FDE047' },
      { pairId: 11, icon: '🍑', label: 'games.memory.decks.fruits.c11', bgGradient: 'from-pink-400 to-rose-500', accentColor: '#F472B6' },
      { pairId: 12, icon: '🥥', label: 'games.memory.decks.fruits.c12', bgGradient: 'from-amber-700 to-stone-800', accentColor: '#78350F' },
    ],
  },
  // 12. Phương Tiện Giao Thông
  {
    id: 'VEHICLES',
    name: 'games.memory.decks.vehicles.name',
    badge: 'Turbo Speed',
    icon: '🚗',
    bgGradient: 'from-red-600 to-orange-600',
    cards: [
      { pairId: 1, icon: '🚌', label: 'games.memory.decks.vehicles.c1', bgGradient: 'from-cyan-500 to-blue-600', accentColor: '#06B6D4' },
      { pairId: 2, icon: '🏎️', label: 'games.memory.decks.vehicles.c2', bgGradient: 'from-red-600 to-rose-700', accentColor: '#DC2626' },
      { pairId: 3, icon: '🚁', label: 'games.memory.decks.vehicles.c3', bgGradient: 'from-amber-500 to-orange-600', accentColor: '#F59E0B' },
      { pairId: 4, icon: '🚄', label: 'games.memory.decks.vehicles.c4', bgGradient: 'from-blue-500 to-indigo-600', accentColor: '#3B82F6' },
      { pairId: 5, icon: '🚤', label: 'games.memory.decks.vehicles.c5', bgGradient: 'from-teal-500 to-cyan-600', accentColor: '#14B8A6' },
      { pairId: 6, icon: '🏍️', label: 'games.memory.decks.vehicles.c6', bgGradient: 'from-orange-500 to-red-600', accentColor: '#F97316' },
      { pairId: 7, icon: '🚀', label: 'games.memory.decks.vehicles.c7', bgGradient: 'from-purple-600 to-indigo-700', accentColor: '#9333EA' },
      { pairId: 8, icon: '🚒', label: 'games.memory.decks.vehicles.c8', bgGradient: 'from-red-500 to-rose-600', accentColor: '#EF4444' },
      { pairId: 9, icon: '✈️', label: 'games.memory.decks.vehicles.c9', bgGradient: 'from-sky-400 to-blue-600', accentColor: '#38BDF8' },
      { pairId: 10, icon: '🚢', label: 'games.memory.decks.vehicles.c10', bgGradient: 'from-blue-600 to-slate-700', accentColor: '#2563EB' },
      { pairId: 11, icon: '🎈', label: 'games.memory.decks.vehicles.c11', bgGradient: 'from-pink-500 to-rose-600', accentColor: '#EC4899' },
      { pairId: 12, icon: '🚜', label: 'games.memory.decks.vehicles.c12', bgGradient: 'from-emerald-600 to-green-700', accentColor: '#059669' },
    ],
  },
  // 13. Âm Nhạc & Nhạc Cụ
  {
    id: 'MUSIC',
    name: 'games.memory.decks.music.name',
    badge: 'Melody Symphony',
    icon: '🎸',
    bgGradient: 'from-violet-600 to-fuchsia-700',
    cards: [
      { pairId: 1, icon: '🎸', label: 'games.memory.decks.music.c1', bgGradient: 'from-rose-500 to-red-600', accentColor: '#F43F5E' },
      { pairId: 2, icon: '🎷', label: 'games.memory.decks.music.c2', bgGradient: 'from-amber-400 to-yellow-600', accentColor: '#F59E0B' },
      { pairId: 3, icon: '🎹', label: 'games.memory.decks.music.c3', bgGradient: 'from-slate-800 to-slate-950', accentColor: '#1E293B' },
      { pairId: 4, icon: '🥁', label: 'games.memory.decks.music.c4', bgGradient: 'from-orange-500 to-amber-600', accentColor: '#F97316' },
      { pairId: 5, icon: '🎻', label: 'games.memory.decks.music.c5', bgGradient: 'from-amber-700 to-amber-900', accentColor: '#B45309' },
      { pairId: 6, icon: '🎤', label: 'games.memory.decks.music.c6', bgGradient: 'from-yellow-400 to-amber-500', accentColor: '#EAB308' },
      { pairId: 7, icon: '📻', label: 'games.memory.decks.music.c7', bgGradient: 'from-stone-700 to-stone-900', accentColor: '#44403C' },
      { pairId: 8, icon: '🎧', label: 'games.memory.decks.music.c8', bgGradient: 'from-cyan-500 to-blue-600', accentColor: '#06B6D4' },
      { pairId: 9, icon: '🎵', label: 'games.memory.decks.music.c9', bgGradient: 'from-purple-500 to-indigo-600', accentColor: '#A855F7' },
      { pairId: 10, icon: '🎺', label: 'games.memory.decks.music.c10', bgGradient: 'from-yellow-500 to-amber-600', accentColor: '#F59E0B' },
      { pairId: 11, icon: '🎼', label: 'games.memory.decks.music.c11', bgGradient: 'from-teal-500 to-emerald-600', accentColor: '#14B8A6' },
      { pairId: 12, icon: '🔔', label: 'games.memory.decks.music.c12', bgGradient: 'from-sky-400 to-blue-500', accentColor: '#38BDF8' },
    ],
  },
  // 14. Thời Tiết & Bốn Mùa
  {
    id: 'WEATHER',
    name: 'games.memory.decks.weather.name',
    badge: 'Seasonal Elements',
    icon: '⚡',
    bgGradient: 'from-sky-500 to-indigo-600',
    cards: [
      { pairId: 1, icon: '⚡', label: 'games.memory.decks.weather.c1', bgGradient: 'from-yellow-400 to-amber-600', accentColor: '#F59E0B' },
      { pairId: 2, icon: '🌪️', label: 'games.memory.decks.weather.c2', bgGradient: 'from-slate-500 to-slate-700', accentColor: '#64748B' },
      { pairId: 3, icon: '❄️', label: 'games.memory.decks.weather.c3', bgGradient: 'from-sky-300 to-blue-500', accentColor: '#38BDF8' },
      { pairId: 4, icon: '☀️', label: 'games.memory.decks.weather.c4', bgGradient: 'from-amber-400 to-orange-500', accentColor: '#EAB308' },
      { pairId: 5, icon: '🍁', label: 'games.memory.decks.weather.c5', bgGradient: 'from-orange-500 to-red-600', accentColor: '#F97316' },
      { pairId: 6, icon: '🌧️', label: 'games.memory.decks.weather.c6', bgGradient: 'from-blue-400 to-indigo-600', accentColor: '#60A5FA' },
      { pairId: 7, icon: '☁️', label: 'games.memory.decks.weather.c7', bgGradient: 'from-slate-400 to-slate-600', accentColor: '#94A3B8' },
      { pairId: 8, icon: '💨', label: 'games.memory.decks.weather.c8', bgGradient: 'from-teal-400 to-cyan-600', accentColor: '#14B8A6' },
      { pairId: 9, icon: '🌈', label: 'games.memory.decks.weather.c9', bgGradient: 'from-pink-500 to-purple-600', accentColor: '#EC4899' },
      { pairId: 10, icon: '🌃', label: 'games.memory.decks.weather.c10', bgGradient: 'from-indigo-700 to-slate-900', accentColor: '#4338CA' },
      { pairId: 11, icon: '🌫️', label: 'games.memory.decks.weather.c11', bgGradient: 'from-zinc-500 to-zinc-700', accentColor: '#71717A' },
      { pairId: 12, icon: '🌄', label: 'games.memory.decks.weather.c12', bgGradient: 'from-rose-400 to-amber-500', accentColor: '#FB7185' },
    ],
  },
  // 15. Khảo Cổ & Cổ Đại
  {
    id: 'ANCIENT',
    name: 'games.memory.decks.ancient.name',
    badge: 'Ancient Relics',
    icon: '🏺',
    bgGradient: 'from-amber-700 to-yellow-800',
    cards: [
      { pairId: 1, icon: '🏛️', label: 'games.memory.decks.ancient.c1', bgGradient: 'from-amber-500 to-yellow-600', accentColor: '#F59E0B' },
      { pairId: 2, icon: '🏺', label: 'games.memory.decks.ancient.c2', bgGradient: 'from-orange-600 to-amber-700', accentColor: '#EA580C' },
      { pairId: 3, icon: '🪙', label: 'games.memory.decks.ancient.c3', bgGradient: 'from-yellow-400 to-amber-500', accentColor: '#EAB308' },
      { pairId: 4, icon: '📜', label: 'games.memory.decks.ancient.c4', bgGradient: 'from-stone-400 to-stone-600', accentColor: '#A8A29E' },
      { pairId: 5, icon: '⌛', label: 'games.memory.decks.ancient.c5', bgGradient: 'from-amber-400 to-orange-500', accentColor: '#F59E0B' },
      { pairId: 6, icon: '🧭', label: 'games.memory.decks.ancient.c6', bgGradient: 'from-teal-500 to-emerald-700', accentColor: '#14B8A6' },
      { pairId: 7, icon: '🔑', label: 'games.memory.decks.ancient.c7', bgGradient: 'from-yellow-400 to-amber-600', accentColor: '#EAB308' },
      { pairId: 8, icon: '👑', label: 'games.memory.decks.ancient.c8', bgGradient: 'from-purple-500 to-indigo-600', accentColor: '#A855F7' },
      { pairId: 9, icon: '🗿', label: 'games.memory.decks.ancient.c9', bgGradient: 'from-slate-600 to-slate-800', accentColor: '#64748B' },
      { pairId: 10, icon: '🪔', label: 'games.memory.decks.ancient.c10', bgGradient: 'from-amber-500 to-rose-600', accentColor: '#F59E0B' },
      { pairId: 11, icon: '🗺️', label: 'games.memory.decks.ancient.c11', bgGradient: 'from-amber-600 to-yellow-700', accentColor: '#D97706' },
      { pairId: 12, icon: '🛡️', label: 'games.memory.decks.ancient.c12', bgGradient: 'from-stone-500 to-stone-700', accentColor: '#78716C' },
    ],
  },
  // 16. Nông Trại Vui Vẻ
  {
    id: 'FARM',
    name: 'games.memory.decks.farm.name',
    badge: 'Sunny Farm',
    icon: '🚜',
    bgGradient: 'from-emerald-600 to-amber-600',
    cards: [
      { pairId: 1, icon: '🎡', label: 'games.memory.decks.farm.c1', bgGradient: 'from-amber-500 to-orange-600', accentColor: '#F59E0B' },
      { pairId: 2, icon: '🚜', label: 'games.memory.decks.farm.c2', bgGradient: 'from-red-500 to-rose-600', accentColor: '#EF4444' },
      { pairId: 3, icon: '🐄', label: 'games.memory.decks.farm.c3', bgGradient: 'from-zinc-600 to-zinc-800', accentColor: '#52525B' },
      { pairId: 4, icon: '🐑', label: 'games.memory.decks.farm.c4', bgGradient: 'from-slate-400 to-slate-600', accentColor: '#94A3B8' },
      { pairId: 5, icon: '🐓', label: 'games.memory.decks.farm.c5', bgGradient: 'from-rose-500 to-amber-600', accentColor: '#F43F5E' },
      { pairId: 6, icon: '🌽', label: 'games.memory.decks.farm.c6', bgGradient: 'from-yellow-400 to-amber-500', accentColor: '#EAB308' },
      { pairId: 7, icon: '🥕', label: 'games.memory.decks.farm.c7', bgGradient: 'from-orange-500 to-amber-600', accentColor: '#F97316' },
      { pairId: 8, icon: '🥚', label: 'games.memory.decks.farm.c8', bgGradient: 'from-amber-200 to-yellow-400', accentColor: '#FDE047' },
      { pairId: 9, icon: '🪣', label: 'games.memory.decks.farm.c9', bgGradient: 'from-blue-400 to-cyan-600', accentColor: '#38BDF8' },
      { pairId: 10, icon: '🌾', label: 'games.memory.decks.farm.c10', bgGradient: 'from-amber-600 to-yellow-700', accentColor: '#D97706' },
      { pairId: 11, icon: '🐖', label: 'games.memory.decks.farm.c11', bgGradient: 'from-pink-400 to-rose-500', accentColor: '#F472B6' },
      { pairId: 12, icon: '🐎', label: 'games.memory.decks.farm.c12', bgGradient: 'from-amber-700 to-stone-800', accentColor: '#78350F' },
    ],
  },
  // 17. Điệp Viên & Cảnh Sát
  {
    id: 'DETECTIVE',
    name: 'games.memory.decks.detective.name',
    badge: 'Secret Agent',
    icon: '🕵️‍♂️',
    bgGradient: 'from-slate-700 to-zinc-900',
    cards: [
      { pairId: 1, icon: '🛡️', label: 'games.memory.decks.detective.c1', bgGradient: 'from-yellow-400 to-amber-600', accentColor: '#EAB308' },
      { pairId: 2, icon: '🕶️', label: 'games.memory.decks.detective.c2', bgGradient: 'from-slate-800 to-black', accentColor: '#0F172A' },
      { pairId: 3, icon: '💼', label: 'games.memory.decks.detective.c3', bgGradient: 'from-stone-600 to-stone-800', accentColor: '#78716C' },
      { pairId: 4, icon: '📻', label: 'games.memory.decks.detective.c4', bgGradient: 'from-teal-600 to-slate-700', accentColor: '#0D9488' },
      { pairId: 5, icon: '🚨', label: 'games.memory.decks.detective.c5', bgGradient: 'from-red-600 to-blue-600', accentColor: '#DC2626' },
      { pairId: 6, icon: '⛓️', label: 'games.memory.decks.detective.c6', bgGradient: 'from-slate-400 to-slate-600', accentColor: '#94A3B8' },
      { pairId: 7, icon: '🥽', label: 'games.memory.decks.detective.c7', bgGradient: 'from-emerald-500 to-teal-700', accentColor: '#10B981' },
      { pairId: 8, icon: '🔍', label: 'games.memory.decks.detective.c8', bgGradient: 'from-cyan-400 to-blue-600', accentColor: '#06B6D4' },
      { pairId: 9, icon: '📍', label: 'games.memory.decks.detective.c9', bgGradient: 'from-rose-500 to-red-600', accentColor: '#F43F5E' },
      { pairId: 10, icon: '📦', label: 'games.memory.decks.detective.c10', bgGradient: 'from-zinc-700 to-zinc-900', accentColor: '#3F3F46' },
      { pairId: 11, icon: '🔭', label: 'games.memory.decks.detective.c11', bgGradient: 'from-indigo-500 to-purple-600', accentColor: '#6366F1' },
      { pairId: 12, icon: '📷', label: 'games.memory.decks.detective.c12', bgGradient: 'from-amber-500 to-orange-600', accentColor: '#F59E0B' },
    ],
  },
  // 18. Sinh Vật Biển Sâu
  {
    id: 'OCEAN',
    name: 'games.memory.decks.ocean.name',
    badge: 'Deep Ocean',
    icon: '🐙',
    bgGradient: 'from-blue-600 to-cyan-800',
    cards: [
      { pairId: 1, icon: '🐙', label: 'games.memory.decks.ocean.c1', bgGradient: 'from-purple-500 to-rose-600', accentColor: '#A855F7' },
      { pairId: 2, icon: '🐋', label: 'games.memory.decks.ocean.c2', bgGradient: 'from-blue-500 to-indigo-700', accentColor: '#3B82F6' },
      { pairId: 3, icon: '⭐', label: 'games.memory.decks.ocean.c3', bgGradient: 'from-amber-400 to-orange-500', accentColor: '#F59E0B' },
      { pairId: 4, icon: '🐢', label: 'games.memory.decks.ocean.c4', bgGradient: 'from-emerald-500 to-teal-700', accentColor: '#10B981' },
      { pairId: 5, icon: '🦀', label: 'games.memory.decks.ocean.c5', bgGradient: 'from-red-500 to-rose-600', accentColor: '#EF4444' },
      { pairId: 6, icon: '🪼', label: 'games.memory.decks.ocean.c6', bgGradient: 'from-cyan-400 to-pink-500', accentColor: '#06B6D4' },
      { pairId: 7, icon: '🐡', label: 'games.memory.decks.ocean.c7', bgGradient: 'from-yellow-400 to-amber-600', accentColor: '#EAB308' },
      { pairId: 8, icon: '🐚', label: 'games.memory.decks.ocean.c8', bgGradient: 'from-pink-300 to-rose-400', accentColor: '#F472B6' },
      { pairId: 9, icon: '🦈', label: 'games.memory.decks.ocean.c9', bgGradient: 'from-slate-600 to-slate-800', accentColor: '#64748B' },
      { pairId: 10, icon: '🦑', label: 'games.memory.decks.ocean.c10', bgGradient: 'from-rose-400 to-orange-500', accentColor: '#FB7185' },
      { pairId: 11, icon: '🪸', label: 'games.memory.decks.ocean.c11', bgGradient: 'from-rose-500 to-red-600', accentColor: '#F43F5E' },
      { pairId: 12, icon: '🦞', label: 'games.memory.decks.ocean.c12', bgGradient: 'from-red-600 to-orange-700', accentColor: '#DC2626' },
    ],
  },
  // 19. Tiệm Bánh & Tráng Miệng
  {
    id: 'SWEETS',
    name: 'games.memory.decks.sweets.name',
    badge: 'Sweet Bakery',
    icon: '🎂',
    bgGradient: 'from-pink-500 to-rose-600',
    cards: [
      { pairId: 1, icon: '🎂', label: 'games.memory.decks.sweets.c1', bgGradient: 'from-pink-400 to-rose-500', accentColor: '#F472B6' },
      { pairId: 2, icon: '🍩', label: 'games.memory.decks.sweets.c2', bgGradient: 'from-amber-500 to-rose-600', accentColor: '#F59E0B' },
      { pairId: 3, icon: '🍦', label: 'games.memory.decks.sweets.c3', bgGradient: 'from-yellow-300 to-amber-500', accentColor: '#FDE047' },
      { pairId: 4, icon: '🍭', label: 'games.memory.decks.sweets.c4', bgGradient: 'from-purple-400 to-pink-500', accentColor: '#C084FC' },
      { pairId: 5, icon: '🧁', label: 'games.memory.decks.sweets.c5', bgGradient: 'from-rose-400 to-red-500', accentColor: '#FB7185' },
      { pairId: 6, icon: '🍫', label: 'games.memory.decks.sweets.c6', bgGradient: 'from-amber-800 to-stone-900', accentColor: '#78350F' },
      { pairId: 7, icon: '🥐', label: 'games.memory.decks.sweets.c7', bgGradient: 'from-amber-400 to-yellow-600', accentColor: '#F59E0B' },
      { pairId: 8, icon: '🧋', label: 'games.memory.decks.sweets.c8', bgGradient: 'from-amber-600 to-amber-800', accentColor: '#D97706' },
      { pairId: 9, icon: '🍬', label: 'games.memory.decks.sweets.c9', bgGradient: 'from-emerald-400 to-teal-500', accentColor: '#34D399' },
      { pairId: 10, icon: '🍪', label: 'games.memory.decks.sweets.c10', bgGradient: 'from-yellow-600 to-amber-700', accentColor: '#CA8A04' },
      { pairId: 11, icon: '🥧', label: 'games.memory.decks.sweets.c11', bgGradient: 'from-orange-400 to-red-500', accentColor: '#FB923C' },
      { pairId: 12, icon: '🍨', label: 'games.memory.decks.sweets.c12', bgGradient: 'from-cyan-400 to-blue-500', accentColor: '#38BDF8' },
    ],
  },
  // 20. Hiệp Sĩ & Trung Cổ
  {
    id: 'KNIGHTS',
    name: 'games.memory.decks.knights.name',
    badge: 'Medieval Kingdom',
    icon: '⚔️',
    bgGradient: 'from-amber-700 to-slate-800',
    cards: [
      { pairId: 1, icon: '🛡️', label: 'games.memory.decks.knights.c1', bgGradient: 'from-blue-600 to-indigo-800', accentColor: '#2563EB' },
      { pairId: 2, icon: '⚔️', label: 'games.memory.decks.knights.c2', bgGradient: 'from-cyan-400 to-blue-600', accentColor: '#06B6D4' },
      { pairId: 3, icon: '🦺', label: 'games.memory.decks.knights.c3', bgGradient: 'from-slate-500 to-slate-700', accentColor: '#64748B' },
      { pairId: 4, icon: '🏰', label: 'games.memory.decks.knights.c4', bgGradient: 'from-stone-600 to-stone-800', accentColor: '#78716C' },
      { pairId: 5, icon: '🐎', label: 'games.memory.decks.knights.c5', bgGradient: 'from-amber-700 to-amber-900', accentColor: '#B45309' },
      { pairId: 6, icon: '🏹', label: 'games.memory.decks.knights.c6', bgGradient: 'from-yellow-600 to-amber-700', accentColor: '#D97706' },
      { pairId: 7, icon: '🪵', label: 'games.memory.decks.knights.c7', bgGradient: 'from-orange-500 to-red-600', accentColor: '#F97316' },
      { pairId: 8, icon: '🚩', label: 'games.memory.decks.knights.c8', bgGradient: 'from-red-600 to-rose-700', accentColor: '#DC2626' },
      { pairId: 9, icon: '🪓', label: 'games.memory.decks.knights.c9', bgGradient: 'from-zinc-600 to-zinc-800', accentColor: '#52525B' },
      { pairId: 10, icon: '🏯', label: 'games.memory.decks.knights.c10', bgGradient: 'from-slate-700 to-slate-900', accentColor: '#334155' },
      { pairId: 11, icon: '👑', label: 'games.memory.decks.knights.c11', bgGradient: 'from-yellow-400 to-amber-500', accentColor: '#EAB308' },
      { pairId: 12, icon: '🐲', label: 'games.memory.decks.knights.c12', bgGradient: 'from-emerald-600 to-teal-800', accentColor: '#059669' },
    ],
  },
  // 21. Khu Vườn Hoàng Gia
  {
    id: 'FLOWERS',
    name: 'games.memory.decks.flowers.name',
    badge: 'Royal Garden',
    icon: '🌺',
    bgGradient: 'from-emerald-500 to-teal-600',
    cards: [
      { pairId: 1, icon: '🌹', label: 'games.memory.decks.flowers.c1', bgGradient: 'from-rose-500 to-red-600', accentColor: '#F43F5E' },
      { pairId: 2, icon: '🌻', label: 'games.memory.decks.flowers.c2', bgGradient: 'from-yellow-400 to-amber-500', accentColor: '#EAB308' },
      { pairId: 3, icon: '🪷', label: 'games.memory.decks.flowers.c3', bgGradient: 'from-pink-400 to-rose-500', accentColor: '#F472B6' },
      { pairId: 4, icon: '🌸', label: 'games.memory.decks.flowers.c4', bgGradient: 'from-purple-400 to-pink-500', accentColor: '#C084FC' },
      { pairId: 5, icon: '🌵', label: 'games.memory.decks.flowers.c5', bgGradient: 'from-emerald-600 to-green-700', accentColor: '#059669' },
      { pairId: 6, icon: '🍄', label: 'games.memory.decks.flowers.c6', bgGradient: 'from-red-500 to-orange-600', accentColor: '#EF4444' },
      { pairId: 7, icon: '🌷', label: 'games.memory.decks.flowers.c7', bgGradient: 'from-pink-500 to-purple-600', accentColor: '#EC4899' },
      { pairId: 8, icon: '🌼', label: 'games.memory.decks.flowers.c8', bgGradient: 'from-amber-300 to-yellow-500', accentColor: '#FDE047' },
      { pairId: 9, icon: '🌺', label: 'games.memory.decks.flowers.c9', bgGradient: 'from-rose-600 to-red-700', accentColor: '#E11D48' },
      { pairId: 10, icon: '🍀', label: 'games.memory.decks.flowers.c10', bgGradient: 'from-green-400 to-emerald-600', accentColor: '#22C55E' },
      { pairId: 11, icon: '🌱', label: 'games.memory.decks.flowers.c11', bgGradient: 'from-lime-400 to-emerald-500', accentColor: '#84CC16' },
      { pairId: 12, icon: '🌳', label: 'games.memory.decks.flowers.c12', bgGradient: 'from-emerald-700 to-teal-900', accentColor: '#047857' },
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

// eslint-disable-next-line react-refresh/only-export-components
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
  const [mismatchIndices, setMismatchIndices] = useState<number[]>([]);
  const [justMatchedPairId, setJustMatchedPairId] = useState<number | null>(null);

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
    setMismatchIndices([]);
    setJustMatchedPairId(null);
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
          setJustMatchedPairId(firstCard.pairId);
          setTimeout(() => setJustMatchedPairId(null), 450);

          if (nextStreak >= 2) {
            setMatchPopup(t('games.memory.combo_streak', { count: nextStreak }));
          } else {
            setMatchPopup(`${t(firstCard.label)} ✨`);
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
                } catch {
                  /* ignore storage errors */
                }

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
        // NO MATCH -> Shake briefly, reset combo and flip back
        setMismatchIndices([firstIdx, secondIdx]);
        setTimeout(() => {
          GameSounds.playWrong();
          setComboStreak(0);
          setMismatchIndices([]);
          setCards((prev) =>
            prev.map((c, i) =>
              (i === firstIdx || i === secondIdx) && !c.isMatched ? { ...c, isFlipped: false } : c
            )
          );
          setFlippedIndices([]);
        }, 620);
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
    } catch {
      /* ignore storage errors */
    }
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
    } catch {
      /* ignore storage errors */
    }
    setShowRewardModal(false);
  };

  const progressPercent = Math.min(100, Math.round((matchedCount / stageConfig.pairsCount) * 100));
  const timePercent = Math.min(100, Math.max(0, Math.round((timeLeft / Math.max(1, totalTime)) * 100)));
  const isCompactGrid = stageConfig.pairsCount >= 10;
  const nextStagePreview = getStageConfig(currentStage + 1);

  return (
    <div className="h-[100dvh] bg-slate-950 text-white flex flex-col overflow-hidden overscroll-none font-sans select-none">
      <GameHeader
        title={t('games.memory.title')}
        subtitle={`${t('games.memory.stage', { stage: currentStage })} • ${t(stageConfig.theme.name)}`}
        onBack={onBack}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
        onRestart={() => initStageDeck(currentStage)}
        restartTooltip={t('games.memory.btn_restart')}
        onHelp={() => setShowTutorial(true)}
      />

      {/* ── MAIN STAGE ── */}
      <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain max-w-lg mx-auto w-full px-3 py-3 pb-4 flex flex-col items-center justify-center gap-3">
        {/* ── 1. UNIFIED SLEEK TOP HUD CARD WITH INTEGRATED TIMER/PROGRESS BAR ── */}
        <div className="w-full bg-slate-900/90 border border-slate-800/90 rounded-2xl shadow-lg overflow-hidden">
          <div className="px-3.5 py-2.5 flex items-center justify-between gap-2">
            {/* Stage & Theme Title */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-9 h-9 rounded-xl bg-gradient-to-br ${stageConfig.theme.bgGradient} flex items-center justify-center text-lg shadow-md shrink-0 border border-white/20`}
              >
                {stageConfig.theme.icon}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 rounded-md">
                    {t('games.memory.stage', { stage: currentStage })}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded-md">
                    {t(stageConfig.difficultyLabelKey)}
                  </span>
                </div>
                <h2 className="text-xs sm:text-sm font-black text-white truncate mt-0.5">
                  {t(stageConfig.theme.name)}
                </h2>
              </div>
            </div>

            {/* Compact Timer & Total Score Pills */}
            <div className="flex items-center gap-2 shrink-0">
              <div
                className={`px-2.5 py-1 rounded-xl border flex items-center gap-1.5 ${
                  timeLeft <= 10
                    ? 'bg-red-950/70 border-red-500/50 text-red-300 animate-pulse'
                    : 'bg-slate-800/90 border-slate-700/80 text-white'
                }`}
              >
                <Clock className={`w-3.5 h-3.5 ${timeLeft <= 10 ? 'text-red-400' : 'text-amber-400'}`} />
                <span className="font-mono text-xs font-black">{timeLeft}s</span>
              </div>

              <div className="bg-amber-950/50 border border-amber-500/40 px-2.5 py-1 rounded-xl flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-yellow-300" />
                <span className="font-mono font-black text-amber-400 text-xs">{accumulatedScore}</span>
              </div>
            </div>
          </div>

          {/* Slim Dual-Tone Timer Bar */}
          <div className="w-full h-1 bg-slate-800">
            <div
              className={`h-full transition-all duration-500 ${
                timeLeft <= 10
                  ? 'bg-gradient-to-r from-red-500 to-rose-400'
                  : 'bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-400'
              }`}
              style={{ width: `${timePercent}%` }}
            />
          </div>
        </div>

        {/* ── 2. DYNAMIC 3D CARDS BOARD ── */}
        <div className="relative w-full flex-1 flex items-center justify-center py-1">
          {matchPopup && (
            <div className="absolute -top-2 inset-x-0 flex justify-center z-30 pointer-events-none animate-bounce">
              <span className="px-4 py-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black text-xs rounded-full shadow-2xl border border-yellow-200">
                {matchPopup}
              </span>
            </div>
          )}

          <div className={`w-full grid ${stageConfig.gridColsClass} gap-2 sm:gap-2.5`}>
            {cards.map((card, idx) => {
              const isRevealed = card.isFlipped || card.isMatched;
              const isMismatch = mismatchIndices.includes(idx);
              const isJustMatched = card.isMatched && justMatchedPairId === card.pairId;

              return (
                <div
                  key={card.id}
                  onClick={() => handleCardClick(idx)}
                  className={`relative ${
                    isCompactGrid ? 'aspect-square' : 'aspect-[4/5]'
                  } rounded-2xl cursor-pointer perspective-1000 transition-transform duration-200 active:scale-95 select-none group ${
                    isMismatch ? 'animate-card-shake' : isJustMatched ? 'animate-card-match' : ''
                  }`}
                >
                  <div
                    className={`w-full h-full rounded-2xl transition-transform duration-500 ease-out transform-style-3d relative ${
                      isRevealed ? 'rotate-y-180 shadow-xl' : 'shadow-lg group-hover:-translate-y-0.5'
                    }`}
                  >
                    {/* Card Back (Deep Midnight Royal Card with Diagonal Lattice & Gold Crest) */}
                    <div
                      className="absolute inset-0 backface-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-[#161e38] to-slate-950 border border-amber-400/50 group-hover:border-amber-300/90 flex flex-col items-center justify-center p-1.5 overflow-hidden shadow-inner"
                      style={{
                        backgroundImage:
                          'repeating-linear-gradient(45deg, rgba(251,191,36,0.05) 0px, rgba(251,191,36,0.05) 2px, transparent 2px, transparent 10px)',
                      }}
                    >
                      <div className="absolute inset-1.5 rounded-xl border border-amber-400/25 pointer-events-none" />
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-600 flex items-center justify-center shadow-[0_0_16px_rgba(245,158,11,0.35)] border border-yellow-200/80">
                        <span className="text-slate-950 font-black text-sm leading-none">★</span>
                      </div>
                    </div>

                    {/* Card Front (Cohesive Luminous Jewel Surface + Tinted Radial Glow Medallion) */}
                    <div
                      className={`absolute inset-0 backface-hidden rotate-y-180 rounded-2xl bg-gradient-to-b from-slate-800/95 via-slate-900 to-slate-950 border-2 flex flex-col items-center justify-between p-1.5 sm:p-2 overflow-hidden ${
                        card.isMatched
                          ? 'border-emerald-400/80 ring-2 ring-emerald-400/30 opacity-90'
                          : isMismatch
                          ? 'border-rose-500/80'
                          : 'border-slate-500/60'
                      }`}
                    >
                      {/* Subtle thematic radial glow behind medallion */}
                      <div
                        className="absolute inset-0 pointer-events-none opacity-25"
                        style={{
                          background: `radial-gradient(circle at 50% 42%, ${card.accentColor}, transparent 72%)`,
                        }}
                      />

                      {/* Corner matched check badge */}
                      {card.isMatched && (
                        <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow z-20">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </span>
                      )}

                      <div className="flex-1 flex items-center justify-center w-full relative z-10">
                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-xs flex items-center justify-center shadow-inner">
                          <span className="text-2xl sm:text-3xl leading-none drop-shadow">{card.icon}</span>
                        </div>
                      </div>

                      <span className="w-full text-[8px] sm:text-[9px] font-bold tracking-tight text-slate-100 bg-slate-950/70 border border-white/10 rounded-lg px-1 py-0.5 text-center truncate relative z-10">
                        {t(card.label)}
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

        {/* ── 3. COMPACT BOTTOM DOCK (MATCH PROGRESS + POWER-UPS) ── */}
        <div className="w-full bg-slate-900/90 border border-slate-800 px-3.5 py-2 rounded-2xl shadow-md flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="bg-amber-500 text-slate-950 font-black text-xs px-2 py-0.5 rounded-lg shadow-xs font-mono">
              {matchedCount}/{stageConfig.pairsCount}
            </span>
            <div className="hidden sm:block w-14 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-400 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-[11px] font-mono text-slate-300">
              {moves} {t('games.memory.moves_unit')}
            </span>
            {comboStreak > 1 && (
              <span className="flex items-center gap-0.5 text-[10px] font-black text-amber-400 bg-amber-500/20 border border-amber-500/40 px-1.5 py-0.5 rounded-full">
                <Flame className="w-3 h-3 fill-amber-400" />
                x{comboStreak}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleXRayPeek}
              disabled={!peekAvailable || isPeeking}
              className={`px-2.5 py-1.5 rounded-full text-[11px] font-black flex items-center gap-1 border transition ${
                peekAvailable && !isPeeking
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 border-blue-400/80 text-white hover:brightness-110 active:scale-95 shadow-sm'
                  : 'bg-slate-800/60 border-slate-700 text-slate-500 cursor-not-allowed opacity-50'
              }`}
              title={t('games.memory.btn_peek')}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{t('games.memory.btn_peek')}</span>
            </button>

            <button
              onClick={handleTimeFreeze}
              disabled={!freezeAvailable}
              className={`px-2.5 py-1.5 rounded-full text-[11px] font-black flex items-center gap-1 border transition ${
                freezeAvailable
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 border-emerald-400/80 text-white hover:brightness-110 active:scale-95 shadow-sm'
                  : 'bg-slate-800/60 border-slate-700 text-slate-500 cursor-not-allowed opacity-50'
              }`}
              title={t('games.memory.btn_freeze')}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{t('games.memory.btn_freeze')}</span>
            </button>
          </div>
        </div>
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
                {t('games.memory.stage', { stage: currentStage })} • {t(stageConfig.theme.name)}
              </span>
              <h3 className="text-xl font-black text-white mt-1.5">{t('games.memory.stage_cleared')}</h3>
              <p className="text-xs text-slate-400 mt-1">
                {moves} {t('games.memory.moves_unit')} • {timeLeft}s {t('games.memory.time_bonus_label')}
              </p>

              {/* Points Summary Box */}
              <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-2xl mt-3 space-y-1.5">
                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span>{t('games.memory.stage_score_label')}</span>
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
                    <span className="text-[9px] text-slate-400 block font-bold">{t('games.memory.next_stage_label')}</span>
                    <span className="text-[11px] font-black text-amber-300 truncate block">
                      {t('games.memory.stage', { stage: currentStage + 1 })}: {t(nextStagePreview.theme.name)}
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
