import medalSilver from '../assets/figma/ill-medal-silver.svg';
import medalGold from '../assets/figma/ill-medal-gold.svg';
import medalPlatinum from '../assets/figma/ill-medal-platinum.svg';
import medalDiamond from '../assets/figma/ill-medal-diamond.svg';

/**
 * Visual identity per tier code, as drawn in Figma (HV-02 member card = cardBg, HV-03 tier list = listBg).
 * Thresholds, multipliers and plays are NOT here — they come from GET /loyalty/v1/tiers.
 */
const LOOK: Record<string, { medal: string; cardBg: string; listBg: string }> = {
  SILVER: { medal: medalSilver, cardBg: '#EEF2F6', listBg: '#F1F5F8' },
  GOLD: { medal: medalGold, cardBg: '#FFF2D1', listBg: '#FFF6E4' },
  // shortcut: Figma draws only Silver and Gold member cards; Platinum/Diamond card tints follow their medals.
  PLATINUM: { medal: medalPlatinum, cardBg: '#E7F3F6', listBg: '#EEF7F9' },
  DIAMOND: { medal: medalDiamond, cardBg: '#E6EFFB', listBg: '#EDF4FC' },
};

export const tierLook = (code?: string) => LOOK[code?.toUpperCase() || ''] || LOOK.SILVER;

/** "Silver Tier" / "SILVER" → "Silver" */
export const tierLabel = (name?: string, code?: string) => {
  const base = (name || code || '').replace(/\s*tier$/i, '').trim();
  return base ? base.charAt(0).toUpperCase() + base.slice(1).toLowerCase() : '';
};
