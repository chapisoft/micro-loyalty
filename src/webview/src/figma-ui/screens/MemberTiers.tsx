import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LoyaltyApi, getDefaultUserId, type TierItem } from '../../services/api';
import { Screen, Skeleton, ErrorBlock, Empty, SecondaryButton, useLoad, fmt, ddmmyyyy } from '../ui';
import { tierLook, tierLabel } from '../tiers';
import { paramJson, PARAM, type ProgramTermsDoc } from '../data';
import { artEmptyBox } from '../art';
import iconCheck from '../../assets/figma/icon-check.svg';
import iconShield from '../../assets/figma/icon-shield-check.svg';

/** HV-03 · Member tiers (Figma 274:1610) — thresholds, multipliers and plays from GET /loyalty/v1/tiers. */
export const MemberTiers: React.FC = () => {
  const navigate = useNavigate();
  const [data, failed, reload] = useLoad(async () => {
    const [tiers, profile] = await Promise.all([LoyaltyApi.getTiers(), LoyaltyApi.getProfile(getDefaultUserId()).catch(() => null)]);
    return {
      tiers: tiers.filter((t) => t.status !== 'INACTIVE').sort((a, b) => a.tierLevel - b.tierLevel || a.minPoints - b.minPoints),
      current: profile?.tier?.code?.toUpperCase(),
    };
  });
  const tiers: TierItem[] = data?.tiers || [];
  const range = (i: number) => {
    const t = tiers[i];
    const next = tiers[i + 1];
    return next ? `${fmt(t.minPoints)}–${fmt(Number(next.minPoints) - 1)} tier pts` : `${fmt(t.minPoints)}+ tier pts`;
  };
  const hero = tierLook(data?.current);

  return (
    <Screen title="Member tiers" back="/">
      <h2 className="text-[22px] font-semibold leading-8">Member benefits</h2>
      {failed && <ErrorBlock onRetry={reload} />}
      {!data && !failed && <Skeleton className="h-[132px]" />}
      {data && tiers.length === 0 && <Empty art={artEmptyBox} title="Tiers are not set up yet" text="Member tiers will appear here once Natcash publishes them." />}
      {tiers.length > 0 && (
        <>
          <div className="flex w-full items-center gap-2.5 rounded-[20px] p-4" style={{ background: tierLook('GOLD').cardBg }}>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="text-[12px] leading-[17px] text-slate-500">{data?.current ? `You are ${tierLabel(undefined, data.current)}` : 'Member benefits'}</span>
              <span className="text-[27px] font-semibold leading-[39px]">{tiers.length === 4 ? 'Four tiers' : `${tiers.length} ${tiers.length === 1 ? 'tier' : 'tiers'}`}</span>
              <span className="text-[12px] leading-[17px] text-slate-500">Perks for every tier</span>
            </div>
            <img src={hero.medal} alt="" className="size-[100px] shrink-0" />
          </div>

          <h3 className="text-[18px] font-semibold leading-[26px]">Membership tiers</h3>
          <div className="grid w-full gap-2.5" style={{ gridTemplateColumns: `repeat(${Math.min(tiers.length, 4)}, minmax(0, 1fr))` }}>
            {tiers.map((t) => (
              <button key={t.code} type="button" onClick={() => document.getElementById(`tier-${t.code}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })} className="flex flex-col items-center gap-1">
                <img src={tierLook(t.code).medal} alt="" className="size-14" />
                <span className="text-center text-[10px] font-medium leading-[15px]">{tierLabel(t.name, t.code)}</span>
              </button>
            ))}
          </div>

          {tiers.map((t, i) => {
            const mine = t.code.toUpperCase() === data?.current;
            return (
              <section key={t.code} id={`tier-${t.code}`} className={`flex w-full flex-col gap-3 rounded-[20px] p-4 ${mine ? 'ring-2 ring-brand' : ''}`} style={{ background: tierLook(t.code).listBg }}>
                <div className="flex items-center gap-3">
                  <img src={tierLook(t.code).medal} alt="" className="size-[60px] shrink-0" />
                  <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
                    <span className="text-[19px] font-semibold leading-7">
                      {tierLabel(t.name, t.code)} tier{mine && <span className="ml-2 align-middle text-[11px] font-semibold text-brand">Your tier</span>}
                    </span>
                    <span className="text-[12px] font-medium leading-[17px] text-slate-500">{range(i)}</span>
                  </div>
                </div>
                <div className="flex w-full rounded-xl bg-white/75 px-1 py-2.5 text-center leading-[19px]">
                  <div className="flex flex-1 flex-col gap-0.5">
                    <span className="text-[16px] font-semibold">×{Number(t.pointMultiplier).toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 1 })}</span>
                    <span className="text-[11px] text-slate-500">Earn multiplier</span>
                  </div>
                  <div className="w-px self-stretch bg-slate-200" />
                  <div className="flex flex-1 flex-col gap-0.5">
                    <span className="text-[16px] font-semibold">{t.freeDailyTurns} {t.freeDailyTurns === 1 ? 'play' : 'plays'}</span>
                    <span className="text-[11px] text-slate-500">Free plays</span>
                  </div>
                </div>
                {t.keepTierPoints ? (
                  <div className="flex items-center gap-2 text-[12px] leading-[17px]"><img src={iconCheck} alt="" className="size-4" /> Keep the tier with {fmt(t.keepTierPoints)} tier pts a year</div>
                ) : null}
                {(t.description || '')
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
              Tiers are reviewed over a 12-month calendar year. Reach the threshold and you move up right away; if you fall short at period end, you drop one tier only.
              <span className="font-semibold text-brand"> Program terms ›</span>
            </p>
          </button>
        </>
      )}
    </Screen>
  );
};

/** HV-01 · Program terms (Figma 330:232) — content published from the CMS (system parameter LOYALTY_PROGRAM_TERMS). */
export const ProgramTerms: React.FC = () => {
  const navigate = useNavigate();
  const [doc, failed, reload] = useLoad(async () => {
    const v = await paramJson<ProgramTermsDoc | string>(PARAM.PROGRAM_TERMS);
    if (!v) return null;
    return typeof v === 'string' ? ({ sections: [{ title: '', body: v }] } as ProgramTermsDoc) : v;
  });
  return (
    <Screen title="Program terms" back="/tiers">
      <h2 className="text-[22px] font-semibold">Program terms</h2>
      {failed && <ErrorBlock onRetry={reload} />}
      {doc === undefined && !failed && <Skeleton className="h-[300px]" />}
      {doc === null && <Empty art={artEmptyBox} title="Terms are not published yet" text="Natcash will publish the program terms here." />}
      {doc && (
        <>
          {(doc.version || doc.effectiveDate) && (
            <p className="-mt-3 text-[12px] text-slate-500">{[doc.version && `Version ${doc.version}`, doc.effectiveDate && (ddmmyyyy(doc.effectiveDate) || doc.effectiveDate)].filter(Boolean).join(' · ')}</p>
          )}
          {doc.sections.map((s, i) => (
            <section key={i} className="w-full">
              {s.title && <h3 className="mb-1.5 text-[17px] font-semibold">{s.title}</h3>}
              <p className="whitespace-pre-line text-[14px] leading-6 text-slate-600">{s.body}</p>
            </section>
          ))}
        </>
      )}
      <SecondaryButton onClick={() => navigate('/')}>Back to Rewards</SecondaryButton>
    </Screen>
  );
};

export default MemberTiers;
