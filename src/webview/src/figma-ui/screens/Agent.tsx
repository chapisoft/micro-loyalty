import React, { useState } from 'react';
import { LoyaltyApi, getDefaultUserId, type AgentSubordinateItem } from '../../services/api';
import { Screen, Skeleton, Pill, SecondaryButton, Empty, useLoad, fmt } from '../ui';
import { artEmptyBox, artShield } from '../art';

const Ring: React.FC<{ pct: number }> = ({ pct }) => {
  const r = 42;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 100 100" className="size-[110px] -rotate-90">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#EEF2F6" strokeWidth="12" />
      <circle cx="50" cy="50" r={r} fill="none" stroke="#FF8600" strokeWidth="12" strokeLinecap="round" strokeDasharray={`${(Math.min(pct, 100) / 100) * c} ${c}`} />
    </svg>
  );
};

/** AG-01 Agent missions · AG-02 Super Agent dashboard — one route, the API decides the role. */
export const AgentHome: React.FC = () => {
  const [data, failed, reload] = useLoad(() => LoyaltyApi.getAgentDashboard(getDefaultUserId()));
  const [tab, setTab] = useState<'reached' | 'close' | 'none'>('reached');
  const isSuper = data?.agentRole === 'SUPER_AGENT';
  const subs = data?.subordinates || [];
  const bucket = (s: AgentSubordinateItem) => (s.qualified ? 'reached' : s.ekycCount >= s.targetCount * 0.7 ? 'close' : 'none');
  const shown = subs.filter((s) => bucket(s) === tab);
  const rate = data?.superAgentNetworkRate ?? 0;
  const target = data?.superAgentTargetRate ?? 50;
  const pct = data ? Math.round((data.currentCustomersCount / Math.max(data.monthlyTargetCustomers, 1)) * 100) : 0;

  return (
    <Screen title={isSuper ? 'My network' : 'Agent missions'} back="/">
      {failed && <Empty art={artEmptyBox} title="This page is for Natcash agents" text="Your account is not registered as an Agent or Super Agent."><SecondaryButton className="mt-3" onClick={reload}>Try again</SecondaryButton></Empty>}
      {!data && !failed && <Skeleton className="h-[260px]" />}
      {data && !isSuper && (
        <>
          <div>
            <h2 className="text-[22px] font-semibold">{data.monthLabel || 'This month'} missions</h2>
            <p className="text-[13px] text-slate-500">{data.agentName} · {data.agentCode}</p>
          </div>
          <div className="flex w-full items-center gap-4 rounded-[20px] bg-white p-4">
            <div className="relative"><Ring pct={pct} /><span className="absolute inset-0 flex items-center justify-center text-[20px] font-semibold">{pct}%</span></div>
            <div className="flex-1">
              <p className="text-[12px] text-slate-500">Customers cared for</p>
              <p className="text-[24px] font-semibold">{fmt(data.currentCustomersCount)} / {fmt(data.monthlyTargetCustomers)}</p>
              {data.pendingEkycCount ? <p className="text-[12px] text-brand">{data.pendingEkycCount} waiting for eKYC</p> : null}
            </div>
          </div>
          <div className="flex w-full items-center gap-3 rounded-[20px] bg-brand-soft p-4">
            <img src={artShield} alt="" className="size-14 object-contain" />
            <div>
              <p className="text-[12px] text-slate-500">Reward when you reach {fmt(data.monthlyTargetCustomers)}</p>
              <p className="text-[18px] font-semibold text-brand">{fmt(data.rewardAmount)} {data.rewardCurrency}</p>
              {data.rewardClaimed && <Pill tone="green">Claimed</Pill>}
            </div>
          </div>
          <p className="text-[12px] text-slate-500">A customer counts when they complete eKYC and make at least one payment in the month.</p>
        </>
      )}
      {data && isSuper && (
        <>
          <h2 className="text-[22px] font-semibold">Network this month</h2>
          <div className="flex w-full items-center gap-4 rounded-[20px] bg-white p-4">
            <div className="relative"><Ring pct={rate} /><span className="absolute inset-0 flex items-center justify-center text-[20px] font-semibold">{Math.round(rate)}%</span></div>
            <div className="flex-1">
              <p className="text-[12px] text-slate-500">Agents on target</p>
              <p className="text-[22px] font-semibold">{data.subordinateQualifiedCount ?? 0} of {data.subordinateTotal ?? subs.length}</p>
              <p className="text-[12px] text-slate-500">Goal: {target}% of the network</p>
              <p className="text-[15px] font-semibold text-brand">Reward {fmt(data.superAgentRewardAmount)} {data.rewardCurrency}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {(['reached', 'close', 'none'] as const).map((k) => (
              <button key={k} type="button" onClick={() => setTab(k)} className={`rounded-full px-3 py-1.5 text-[12px] font-semibold ${tab === k ? 'bg-brand text-white' : 'border border-slate-200 bg-white'}`}>
                {k === 'reached' ? 'Reached' : k === 'close' ? 'Close' : 'Not started'} {subs.filter((s) => bucket(s) === k).length}
              </button>
            ))}
          </div>
          {shown.length === 0 && <Empty title="No agents in this group" />}
          {shown.map((s) => {
            const p = Math.round((s.ekycCount / Math.max(s.targetCount, 1)) * 100);
            return (
              <div key={s.agentId} className="w-full rounded-[16px] bg-white p-4">
                <div className="mb-2 flex items-center justify-between text-[14px]">
                  <span className="font-semibold">{s.agentName}{s.province ? ` · ${s.province}` : ''}</span>
                  <span className={`font-semibold ${s.qualified ? 'text-emerald-700' : 'text-brand'}`}>{s.ekycCount} / {s.targetCount}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${s.qualified ? 'bg-emerald-700' : 'bg-brand'}`} style={{ width: `${Math.min(p, 100)}%` }} /></div>
              </div>
            );
          })}
          {/* shortcut: the "Start support playbook" action (Figma AG-02) needs POST /super-agents/{code}/support-playbook/trigger, not in loyalty-service yet */}
          {rate < target && <p className="rounded-[14px] bg-brand-soft p-3 text-[12px]">Below {target}%: your area manager is alerted to support agents who are behind.</p>}
        </>
      )}
    </Screen>
  );
};
