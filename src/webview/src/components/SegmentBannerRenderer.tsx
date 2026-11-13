import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Sparkles,
  Crown,
  Gift,
  ShoppingBag,
  Zap,
  Compass,
  ArrowRight,
  HeartHandshake,
} from 'lucide-react';
import { SegmentProfileResponse, SegmentCode } from '../services/api';
import { SkeletonLine } from './common/StateBlocks';

export interface SegmentBannerRendererProps {
  segment: SegmentProfileResponse | null;
  loading?: boolean;
  onAction?: (actionKey: string) => void;
}

const SEGMENT_THEMES: Record<
  SegmentCode,
  { gradient: string; badgeBg: string; icon: React.ReactNode }
> = {
  NEW_CUSTOMER: {
    gradient: 'from-sky-600 via-blue-600 to-indigo-600',
    badgeBg: 'bg-sky-400/25 text-sky-50 border-sky-200/30',
    icon: <Sparkles className="w-5 h-5 text-sky-100" />,
  },
  LOW_ACTIVITY: {
    gradient: 'from-amber-500 via-orange-500 to-rose-500',
    badgeBg: 'bg-amber-300/25 text-amber-50 border-amber-200/30',
    icon: <Zap className="w-5 h-5 text-amber-100" />,
  },
  HIGH_VALUE: {
    gradient: 'from-slate-900 via-indigo-950 to-amber-900',
    badgeBg: 'bg-amber-400/25 text-amber-200 border-amber-300/40',
    icon: <Crown className="w-5 h-5 text-amber-300" />,
  },
  SINGLE_SERVICE: {
    gradient: 'from-teal-600 via-emerald-600 to-green-600',
    badgeBg: 'bg-emerald-300/25 text-emerald-50 border-emerald-200/30',
    icon: <Compass className="w-5 h-5 text-emerald-100" />,
  },
  WIN_BACK: {
    gradient: 'from-rose-600 via-pink-600 to-purple-700',
    badgeBg: 'bg-rose-300/25 text-rose-50 border-rose-200/30',
    icon: <HeartHandshake className="w-5 h-5 text-rose-100" />,
  },
  PARTNER_SHOPPER: {
    gradient: 'from-emerald-600 via-cyan-600 to-blue-700',
    badgeBg: 'bg-cyan-300/25 text-cyan-50 border-cyan-200/30',
    icon: <ShoppingBag className="w-5 h-5 text-cyan-100" />,
  },
  GENERAL: {
    gradient: 'from-indigo-600 via-purple-600 to-slate-800',
    badgeBg: 'bg-white/20 text-white border-white/25',
    icon: <Gift className="w-5 h-5 text-indigo-100" />,
  },
};

export const SegmentBannerRenderer: React.FC<SegmentBannerRendererProps> = ({
  segment,
  loading = false,
  onAction,
}) => {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="rounded-3xl bg-white border border-slate-200 p-4 space-y-2.5 shadow-xs">
        <SkeletonLine className="w-28 h-4" />
        <SkeletonLine className="w-3/4 h-5" />
        <SkeletonLine className="w-full h-3" />
      </div>
    );
  }

  if (!segment) return null;

  const rawCode = segment.segmentCode as SegmentCode;
  const code: SegmentCode = SEGMENT_THEMES[rawCode] ? rawCode : 'GENERAL';
  const theme = SEGMENT_THEMES[code];
  const keySlug = code.toLowerCase();

  return (
    <div
      className={`rounded-3xl bg-gradient-to-r ${theme.gradient} p-4 sm:p-5 text-white shadow-lg relative overflow-hidden`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5 min-w-0">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide border ${theme.badgeBg}`}
          >
            {segment.badgeText || t(`segments.${keySlug}.badge`)}
          </span>
          <h3 className="text-sm sm:text-base font-bold leading-snug">
            {segment.headline || t(`segments.${keySlug}.title`)}
          </h3>
          <p className="text-xs text-white/85 leading-relaxed">
            {segment.subheadline || t(`segments.${keySlug}.subtitle`)}
          </p>
        </div>

        <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
          {theme.icon}
        </div>
      </div>

      {onAction && (
        <div className="mt-3 pt-3 border-t border-white/15 flex items-center justify-between gap-2">
          <span className="text-[11px] text-white/75 font-mono">{code}</span>
          <button
            type="button"
            onClick={() => onAction(segment.ctaTarget || code)}
            className="px-3.5 py-1.5 rounded-xl bg-white text-slate-900 hover:bg-amber-50 text-xs font-bold inline-flex items-center gap-1.5 shadow-xs active:scale-95 transition"
          >
            <span>{segment.ctaLabel || t(`segments.${keySlug}.cta`)}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default SegmentBannerRenderer;
