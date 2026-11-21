import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LoyaltyApi, getDefaultUserId, type TierItem } from '../../services/api';
import { toDateLocale } from '../../language';
import { Screen, Skeleton, ErrorBlock, Empty, SecondaryButton, useLoad, fmt, ddmmyyyy } from '../ui';
import { tierLook, tierLabel } from '../tiers';
import { paramJson, PARAM, type ProgramTermsDoc } from '../data';
import { artEmptyBox } from '../art';
import iconCheck from '../../assets/figma/icon-check.svg';
import iconShield from '../../assets/figma/icon-shield-check.svg';

/** HV-03 · Member tiers (Figma 274:1610) — thresholds, multipliers and plays from GET /loyalty/v1/tiers. */
export const MemberTiers: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [data, failed, reload] = useLoad(async () => {
    const userId = getDefaultUserId();
    const [tiers, profile] = await Promise.all([
      LoyaltyApi.getTiers(),
      userId ? LoyaltyApi.getProfile(userId).catch(() => null) : Promise.resolve(null),
    ]);
    return {
      tiers: tiers.filter((tier) => tier.status !== 'INACTIVE').sort((a, b) => a.tierLevel - b.tierLevel || a.minPoints - b.minPoints),
      current: profile?.tier?.code?.toUpperCase(),
    };
  });
  const tiers: TierItem[] = data?.tiers || [];
  const range = (i: number) => {
    const tier = tiers[i];
    const next = tiers[i + 1];
    return next
      ? t('figma_ui.tiers.range_between', { min: fmt(tier.minPoints), max: fmt(Number(next.minPoints) - 1) })
      : t('figma_ui.tiers.range_plus', { min: fmt(tier.minPoints) });
  };
  const hero = tierLook(data?.current);
  const tierCountLabel =
    tiers.length === 4
      ? t('figma_ui.tiers.four_tiers')
      : t(tiers.length === 1 ? 'figma_ui.tiers.n_tier_one' : 'figma_ui.tiers.n_tier_other', { count: tiers.length });

  return (
    <Screen title={t('figma_ui.tiers.page_title')} back="/">
      <h2 className="text-[22px] font-semibold leading-8">{t('figma_ui.tiers.member_benefits')}</h2>
      {failed && <ErrorBlock onRetry={reload} />}
      {!data && !failed && <Skeleton className="h-[132px]" />}
      {data && tiers.length === 0 && <Empty art={artEmptyBox} title={t('figma_ui.tiers.empty_title')} text={t('figma_ui.tiers.empty_sub')} />}
      {tiers.length > 0 && (
        <>
          <div className="flex w-full items-center gap-2.5 rounded-[20px] p-4" style={{ background: tierLook('GOLD').cardBg }}>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="text-[12px] leading-[17px] text-slate-500">
                {data?.current ? t('figma_ui.tiers.you_are_tier', { tier: tierLabel(undefined, data.current) }) : t('figma_ui.tiers.member_benefits')}
              </span>
              <span className="text-[27px] font-semibold leading-[39px]">{tierCountLabel}</span>
              <span className="text-[12px] leading-[17px] text-slate-500">{t('figma_ui.tiers.perks_every_tier')}</span>
            </div>
            <img src={hero.medal} alt="" className="size-[100px] shrink-0" />
          </div>

          <h3 className="text-[18px] font-semibold leading-[26px]">{t('figma_ui.tiers.membership_tiers')}</h3>
          <div className="grid w-full gap-2.5" style={{ gridTemplateColumns: `repeat(${Math.min(tiers.length, 4)}, minmax(0, 1fr))` }}>
            {tiers.map((tier) => (
              <button key={tier.code} type="button" onClick={() => document.getElementById(`tier-${tier.code}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })} className="flex flex-col items-center gap-1">
                <img src={tierLook(tier.code).medal} alt="" className="size-14" />
                <span className="text-center text-[10px] font-medium leading-[15px]">{tierLabel(tier.name, tier.code)}</span>
              </button>
            ))}
          </div>

          {tiers.map((tier, i) => {
            const mine = tier.code.toUpperCase() === data?.current;
            return (
              <section key={tier.code} id={`tier-${tier.code}`} className={`flex w-full flex-col gap-3 rounded-[20px] p-4 ${mine ? 'ring-2 ring-brand' : ''}`} style={{ background: tierLook(tier.code).listBg }}>
                <div className="flex items-center gap-3">
                  <img src={tierLook(tier.code).medal} alt="" className="size-[60px] shrink-0" />
                  <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
                    <span className="text-[19px] font-semibold leading-7">
                      {t('figma_ui.tiers.tier_heading', { tier: tierLabel(tier.name, tier.code) })}
                      {mine && <span className="ml-2 align-middle text-[11px] font-semibold text-brand">{t('figma_ui.tiers.your_tier')}</span>}
                    </span>
                    <span className="text-[12px] font-medium leading-[17px] text-slate-500">{range(i)}</span>
                  </div>
                </div>
                <div className="flex w-full rounded-xl bg-white/75 px-1 py-2.5 text-center leading-[19px]">
                  <div className="flex flex-1 flex-col gap-0.5">
                    <span className="text-[16px] font-semibold">×{Number(tier.pointMultiplier).toLocaleString(toDateLocale(i18n.language), { maximumFractionDigits: 2, minimumFractionDigits: 1 })}</span>
                    <span className="text-[11px] text-slate-500">{t('figma_ui.tiers.earn_multiplier')}</span>
                  </div>
                  <div className="w-px self-stretch bg-slate-200" />
                  <div className="flex flex-1 flex-col gap-0.5">
                    <span className="text-[16px] font-semibold">
                      {t(tier.freeDailyTurns === 1 ? 'figma_ui.tiers.play_unit_one' : 'figma_ui.tiers.play_unit_other', { count: tier.freeDailyTurns })}
                    </span>
                    <span className="text-[11px] text-slate-500">{t('figma_ui.tiers.free_plays')}</span>
                  </div>
                </div>
                {tier.keepTierPoints ? (
                  <div className="flex items-center gap-2 text-[12px] leading-[17px]"><img src={iconCheck} alt="" className="size-4" /> {t('figma_ui.tiers.keep_tier_rule', { points: fmt(tier.keepTierPoints) })}</div>
                ) : null}
                {(tier.description || '')
                  .split(/\n|·|;/)
                  .map((s) => s.trim())
                  .filter(Boolean)
                  .map((perk) => (
                    <div key={perk} className="flex items-center gap-2">
                      <img src={iconCheck} alt="" className="size-4 shrink-0" />
                      <span className="text-[12px] leading-[17px]">{perk}</span>
                    </div>
                  ))}
              </section>
            );
          })}

          <button type="button" onClick={() => navigate('/terms')} className="flex w-full items-center gap-2.5 rounded-[14px] bg-brand-soft p-3 text-left">
            <img src={iconShield} alt="" className="size-[18px] shrink-0" />
            <p className="text-[12px] leading-[17px]">
              {t('figma_ui.tiers.cycle_notice')}
              <span className="font-semibold text-brand"> {t('figma_ui.tiers.program_terms_link')}</span>
            </p>
          </button>
        </>
      )}
    </Screen>
  );
};

/** HV-01 · Program terms (Figma 330:232) — content published from the CMS (system parameter LOYALTY_PROGRAM_TERMS). */
export const ProgramTerms: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [doc, failed, reload] = useLoad(async () => {
    const v = await paramJson<ProgramTermsDoc | string>(PARAM.PROGRAM_TERMS);
    if (!v) return null;
    return typeof v === 'string' ? ({ sections: [{ title: '', body: v }] } as ProgramTermsDoc) : v;
  });
  return (
    <Screen title={t('figma_ui.tiers.terms_title')} back="/tiers">
      <h2 className="text-[22px] font-semibold">{t('figma_ui.tiers.terms_title')}</h2>
      {failed && <ErrorBlock onRetry={reload} />}
      {doc === undefined && !failed && <Skeleton className="h-[300px]" />}
      {doc === null && <Empty art={artEmptyBox} title={t('figma_ui.tiers.terms_empty_title')} text={t('figma_ui.tiers.terms_empty_sub')} />}
      {doc && (
        <>
          {(doc.version || doc.effectiveDate) && (
            <p className="-mt-3 text-[12px] text-slate-500">
              {[doc.version && t('figma_ui.tiers.terms_version', { version: doc.version }), doc.effectiveDate && (ddmmyyyy(doc.effectiveDate) || doc.effectiveDate)].filter(Boolean).join(' · ')}
            </p>
          )}
          {doc.sections.map((s, i) => (
            <section key={i} className="w-full">
              {s.title && <h3 className="mb-1.5 text-[17px] font-semibold">{s.title}</h3>}
              <p className="whitespace-pre-line text-[14px] leading-6 text-slate-600">{s.body}</p>
            </section>
          ))}
        </>
      )}
      <SecondaryButton onClick={() => navigate('/')}>{t('figma_ui.tiers.back_to_rewards')}</SecondaryButton>
    </Screen>
  );
};

export default MemberTiers;
