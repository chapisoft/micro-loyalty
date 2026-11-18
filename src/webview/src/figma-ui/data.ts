import { LoyaltyApi, type MilestoneItem } from '../services/api';

/**
 * Adapters between loyalty-service payloads and the screens.
 * Values that operations configure in the CMS come from system parameters; when a key is not set yet
 * the screens hide that detail instead of showing invented numbers.
 */

/** Milestones: the service sends `milestoneId` / `endDate`; older payloads used `id` / `expiresAt`. */
export const normMilestone = (m: MilestoneItem): MilestoneItem => ({
  ...m,
  id: m.milestoneId ?? m.id,
  expiresAt: m.expiresAt ?? m.endDate,
  claimDeadline: m.claimDeadline ?? m.endDate,
  targetValue: Number(m.targetValue) || 0,
  currentProgress: Number(m.currentProgress) || 0,
  rewardPoints: Number(m.rewardPoints) || 0,
});

/** CMS system parameter holding JSON (or plain text). Returns undefined when the key is not configured. */
export async function paramJson<T>(key: string): Promise<T | undefined> {
  try {
    const p = await LoyaltyApi.getSystemParameter(key);
    const raw = p.paramValue ?? p.defaultValue;
    if (!raw) return undefined;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return raw as unknown as T;
    }
  } catch {
    return undefined;
  }
}

/** CMS keys the webview reads. */
export const PARAM = {
  /** JSON array of 7 coin amounts, day 1 → day 7, e.g. [10,20,30,40,50,80,200] */
  CHECKIN_REWARDS: 'LOYALTY_CHECKIN_REWARDS',
  /** JSON { version, effectiveDate, sections: [{ title, body }] } or plain text */
  PROGRAM_TERMS: 'LOYALTY_PROGRAM_TERMS',
  /** Amount above which the Natcash app asks for the PIN after the cashier scans (QT-05, 18/11) */
  PIN_LIMIT: 'PAY_AT_COUNTER_PIN_LIMIT_HTG',
} as const;

export interface ProgramTermsDoc {
  version?: string;
  effectiveDate?: string;
  sections: { title: string; body: string }[];
}
