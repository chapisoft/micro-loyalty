import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Skeleton } from 'primereact/skeleton';
import { useTranslation } from 'react-i18next';
import { AppBreadcrumb } from 'components';
import { TenantSelector } from '@/components/TenantSelector';
import { LoyaltyService, GameStatisticsResponseModel } from '@/service/loyalty.service';
import { StandardPageHeader } from '@/components/StandardPageHeader';
import { UniversalFilterBar } from '@/components/UniversalFilterBar';
import { exportToExcel } from '@/components/exportHelper';

export const GameStatisticsPage: React.FC = () => {
  const { t } = useTranslation();

  const [selectedTenant, setSelectedTenant] = useState<string>(
    () => localStorage.getItem('selected_tenant_id') || 'TENANT_NATCASH'
  );
  const [stats, setStats] = useState<GameStatisticsResponseModel | null>(null);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await LoyaltyService.getGameStatistics(undefined, selectedTenant);
      setStats(res);
    } finally {
      setLoading(false);
    }
  }, [selectedTenant]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const byGame = useMemo(() => stats?.byGame || [], [stats]);
  const recentSessions = useMemo(() => stats?.recentSessions || [], [stats]);

  const filteredSessions = useMemo(() => {
    if (!keyword.trim()) return recentSessions;
    const kw = keyword.toLowerCase();
    return recentSessions.filter(
      (s) =>
        s.sessionId?.toLowerCase().includes(kw) ||
        s.externalUserId?.toLowerCase().includes(kw) ||
        s.gameCode?.toLowerCase().includes(kw) ||
        s.prizeName?.toLowerCase().includes(kw)
    );
  }, [recentSessions, keyword]);

  const handleExport = () => {
    exportToExcel(
      filteredSessions,
      [
        { header: t('game.session_id'), field: 'sessionId' },
        { header: t('customer.phone'), field: 'externalUserId' },
        { header: t('game.code'), field: 'gameCode' },
        { header: t('game.reward'), field: 'prizeName' },
        { header: t('common.points'), field: 'pointsWon' },
        { header: t('common.created_at'), field: 'playedAt' },
      ],
      'thong_ke_phien_choi_game'
    );
  };

  return (
    <div className="w-full">
      <AppBreadcrumb items={[{ label: t('nav.game_stats') }]} />

      <StandardPageHeader
        title={t('game.stats_title')}
        subtitle={t('game.stats_subtitle')}
        extraLeft={<TenantSelector value={selectedTenant} onChange={setSelectedTenant} />}
        onRefresh={fetchStats}
        refreshLoading={loading}
      />

      <div className="card shadow-1 border-round surface-card p-4">
        {/* KPI Summary Cards */}
        <div className="grid mb-4">
          <div className="col-12 md:col-3">
            <div className="p-3 border-round surface-50 border-1 surface-border">
              <div className="text-xs text-500 uppercase">{t('game.total_plays')}</div>
              <div className="text-2xl font-mono font-semibold text-primary mt-1">
                {Number(stats?.totalSessions || 0).toLocaleString()}
              </div>
            </div>
          </div>
          <div className="col-12 md:col-3">
            <div className="p-3 border-round surface-50 border-1 surface-border">
              <div className="text-xs text-500 uppercase">{t('game.unique_players')}</div>
              <div className="text-2xl font-mono font-semibold text-blue-600 mt-1">
                {Number(stats?.uniquePlayers || 0).toLocaleString()}
              </div>
            </div>
          </div>
          <div className="col-12 md:col-3">
            <div className="p-3 border-round surface-50 border-1 surface-border">
              <div className="text-xs text-500 uppercase">{t('game.points_awarded')}</div>
              <div className="text-2xl font-mono font-semibold text-green-600 mt-1">
                {Number(stats?.totalPointsAwarded || 0).toLocaleString()}
              </div>
            </div>
          </div>
          <div className="col-12 md:col-3">
            <div className="p-3 border-round surface-50 border-1 surface-border">
              <div className="text-xs text-500 uppercase">{t('game.turns_consumed')}</div>
              <div className="text-2xl font-mono font-semibold text-orange-600 mt-1">
                {Number(stats?.totalTurnsConsumed || 0).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        <h5 className="mb-3 text-900 font-semibold">{t('game.breakdown_by_game')}</h5>
        {loading ? (
          <div className="flex flex-column gap-2 mb-4">
            <Skeleton height="2.5rem" />
            <Skeleton height="2.5rem" />
          </div>
        ) : (
          <DataTable<GameStatisticsResponseModel['byGame']>
            value={byGame}
            paginator
            rows={5}
            stripedRows
            responsiveLayout="scroll"
            className="mb-4"
            emptyMessage={t('common.no_data')}
          >
            <Column
              field="gameCode"
              header={t('game.code')}
              body={(r) => <span className="font-bold font-mono text-900">{r.gameCode}</span>}
              style={{ minWidth: '10rem' }}
            />
            <Column
              field="gameName"
              header={t('game.name')}
              body={(r) => <span className="text-900">{r.gameName}</span>}
              style={{ minWidth: '14rem' }}
            />
            <Column
              field="category"
              header={t('game.category')}
              body={(r) => <Tag value={r.category} severity="info" />}
              style={{ minWidth: '9rem' }}
            />
            <Column
              field="sessionsCount"
              header={t('game.total_plays')}
              body={(r) => (
                <span className="text-900 font-mono">
                  {Number(r.sessionsCount || 0).toLocaleString()}
                </span>
              )}
              style={{ minWidth: '8rem', textAlign: 'right' }}
            />
            <Column
              field="pointsAwarded"
              header={t('game.points_awarded')}
              body={(r) => (
                <span className="text-900 font-mono">
                  {Number(r.pointsAwarded || 0).toLocaleString()}
                </span>
              )}
              style={{ minWidth: '9rem', textAlign: 'right' }}
            />
            <Column
              field="winRatePercent"
              header={t('game.win_rate')}
              body={(r) => (
                <span className="text-900 font-mono">
                  {Number(r.winRatePercent || 0).toFixed(1)}%
                </span>
              )}
              style={{ minWidth: '8rem', textAlign: 'right' }}
            />
          </DataTable>
        )}

        <h5 className="mb-2 text-900 font-semibold">{t('game.recent_sessions')}</h5>
        <UniversalFilterBar
          keyword={keyword}
          onKeywordChange={setKeyword}
          searchPlaceholder={t('common.search')}
          onReset={() => setKeyword('')}
          onExport={handleExport}
        />

        <DataTable<GameStatisticsResponseModel['recentSessions']>
          value={filteredSessions}
          paginator
          rows={10}
          stripedRows
          responsiveLayout="scroll"
          emptyMessage={t('common.no_data')}
          className="mt-3"
        >
          <Column
            field="sessionId"
            header={t('game.session_id')}
            body={(r) => (
              <span className="font-bold font-mono text-900 text-xs">{r.sessionId}</span>
            )}
            style={{ minWidth: '13rem' }}
          />
          <Column
            field="externalUserId"
            header={t('customer.phone')}
            body={(r) => (
              <span className="text-900 font-mono">{r.externalUserId}</span>
            )}
            style={{ minWidth: '10rem' }}
          />
          <Column
            field="gameCode"
            header={t('game.code')}
            body={(r) => (
              <span className="text-900 font-mono">{r.gameCode}</span>
            )}
            style={{ minWidth: '9rem' }}
          />
          <Column
            field="prizeName"
            header={t('game.reward')}
            body={(r) => <span className="text-900">{r.prizeName}</span>}
            style={{ minWidth: '12rem' }}
          />
          <Column
            field="pointsWon"
            header={t('common.points')}
            body={(r) => <span className="text-900 font-mono">{r.pointsWon || 0}</span>}
            style={{ minWidth: '7rem', textAlign: 'right' }}
          />
          <Column
            field="playedAt"
            header={t('common.created_at')}
            body={(r) => (
              <span className="text-900 font-mono text-xs">
                {r.playedAt ? new Date(r.playedAt).toLocaleString('vi-VN') : '--'}
              </span>
            )}
            style={{ minWidth: '11rem' }}
          />
        </DataTable>
      </div>
    </div>
  );
};

export default GameStatisticsPage;
