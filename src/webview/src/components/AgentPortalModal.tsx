import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  Briefcase,
  Users,
  CheckCircle2,
  TrendingUp,
  Award,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { LoyaltyApi, AgentDashboardResponse, getDefaultUserId } from '../services/api';
import { SkeletonCard, EmptyState } from './common/StateBlocks';

export interface AgentPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  externalUserId?: string;
}

export const AgentPortalModal: React.FC<AgentPortalModalProps> = ({
  isOpen,
  onClose,
  externalUserId,
}) => {
  const { t } = useTranslation();
  const userId = externalUserId || getDefaultUserId();
  const [data, setData] = useState<AgentDashboardResponse | null>(null);
  const [activeView, setActiveView] = useState<'AG_01' | 'AG_02'>('AG_01');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await LoyaltyApi.getAgentDashboard(userId);
      setData(res);
      if (res.agentRole === 'SUPER_AGENT') {
        setActiveView('AG_02');
      } else {
        setActiveView('AG_01');
      }
    } catch (err) {
      setData(null);
      setErrorMsg(err instanceof Error ? err.message : t('agent.load_error'));
    } finally {
      setLoading(false);
    }
  }, [t, userId]);

  useEffect(() => {
    if (isOpen) {
      void loadDashboard();
    }
  }, [isOpen, loadDashboard]);

  if (!isOpen) return null;

  const targetCustomers = data?.monthlyTargetCustomers || 100;
  const activeCustomers = data?.currentCustomersCount ?? 0;
  const agentProgressPct = Math.min(100, Math.round((activeCustomers / targetCustomers) * 100));

  const networkThreshold = data?.superAgentTargetRate || 50;
  const networkRate = data?.superAgentNetworkRate ?? 0;
  const superQualified = networkRate >= networkThreshold;
  const subordinates = data?.subordinates || [];

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col overflow-hidden">
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
              <Briefcase className="w-4 h-4 text-amber-300" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold truncate">{t('agent.title')}</h3>
              <p className="text-[11px] text-slate-300 truncate">{t('agent.subtitle')}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveView('AG_01')}
            className={`py-2 px-3 rounded-xl text-xs font-semibold border transition ${
              activeView === 'AG_01'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200'
            }`}
          >
            {t('agent.tab_ag01')}
          </button>
          <button
            type="button"
            onClick={() => setActiveView('AG_02')}
            className={`py-2 px-3 rounded-xl text-xs font-semibold border transition ${
              activeView === 'AG_02'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200'
            }`}
          >
            {t('agent.tab_ag02')}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {errorMsg && (
            <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => void loadDashboard()}
                className="px-2.5 py-1 rounded-lg bg-white border border-rose-200 font-semibold inline-flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>{t('common.retry')}</span>
              </button>
            </div>
          )}

          {loading ? (
            <>
              <SkeletonCard rows={4} />
              <SkeletonCard rows={3} />
            </>
          ) : !data ? (
            <EmptyState
              icon={<Briefcase className="w-6 h-6 text-slate-400" />}
              title={t('agent.empty_title')}
              description={t('agent.empty_desc')}
            />
          ) : activeView === 'AG_01' ? (
            <div className="space-y-3">
              <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase text-amber-800">
                    AG-01 · {data.monthLabel || t('agent.current_month')}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                      activeCustomers >= targetCustomers
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-200/70 text-amber-900'
                    }`}
                  >
                    {activeCustomers >= targetCustomers
                      ? t('agent.status_qualified')
                      : t('agent.status_in_progress')}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-900">{t('agent.ag01_heading')}</h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {t('agent.ag01_reward_desc', {
                      target: targetCustomers.toLocaleString(),
                      reward: (data.rewardAmount || 2000).toLocaleString(),
                    })}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">{t('agent.customers_progress')}</span>
                    <span className="font-mono font-bold text-slate-900">
                      {activeCustomers.toLocaleString()} / {targetCustomers.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-white rounded-full overflow-hidden border border-amber-200">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                      style={{ width: `${agentProgressPct}%` }}
                    />
                  </div>
                </div>

                <div className="rounded-2xl bg-white border border-amber-100 p-3 flex items-center justify-between text-xs">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-600" />
                    {t('agent.reward_tier_label')}
                  </span>
                  <span className="font-mono font-bold text-emerald-700">
                    {(data.rewardAmount || 2000).toLocaleString()} {data.rewardCurrency || 'HTG / Coin'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-sky-50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase text-indigo-800">
                    AG-02 · {data.monthLabel || t('agent.current_month')}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold inline-flex items-center gap-1 ${
                      superQualified
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    {superQualified ? t('agent.status_qualified') : t('agent.status_in_progress')}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-900">{t('agent.ag02_heading')}</h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {t('agent.ag02_reward_desc', {
                      pct: networkThreshold,
                      reward: (data.superAgentRewardAmount || 10000).toLocaleString(),
                    })}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-2xl bg-white border border-indigo-100 p-2.5">
                    <p className="text-[10px] text-slate-500">{t('agent.qualified_agents')}</p>
                    <p className="text-sm font-mono font-bold text-indigo-700 mt-0.5">
                      {data.subordinateQualifiedCount ?? 0}/{data.subordinateTotal ?? subordinates.length}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white border border-indigo-100 p-2.5">
                    <p className="text-[10px] text-slate-500">{t('agent.network_rate')}</p>
                    <p className="text-sm font-mono font-bold text-slate-900 mt-0.5">
                      {networkRate}%
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white border border-indigo-100 p-2.5">
                    <p className="text-[10px] text-slate-500">{t('agent.super_bonus')}</p>
                    <p className="text-sm font-mono font-bold text-emerald-700 mt-0.5">
                      {(data.superAgentRewardAmount || 10000).toLocaleString()} HTG
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-indigo-600" />
                    {t('agent.sub_agents_list')}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                    <TrendingUp className="w-3.5 h-3.5" />
                    {subordinates.length}
                  </span>
                </div>

                {subordinates.length === 0 ? (
                  <EmptyState
                    icon={<Users className="w-5 h-5 text-slate-400" />}
                    title={t('agent.empty_sub_agents')}
                    description={t('agent.empty_sub_agents_desc')}
                  />
                ) : (
                  <div className="divide-y divide-slate-100">
                    {subordinates.map((sub) => (
                      <div
                        key={sub.agentId}
                        className="py-2 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate">{sub.agentName}</p>
                          <p className="text-[11px] font-mono text-slate-500">
                            {sub.ekycCount.toLocaleString()} / {(sub.targetCount || targetCustomers).toLocaleString()}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${
                            sub.qualified
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {sub.qualified ? t('agent.sub_qualified') : t('agent.sub_pending')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentPortalModal;
