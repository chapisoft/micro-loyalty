import React, { useCallback, useEffect, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Skeleton } from 'primereact/skeleton';
import { useTranslation } from 'react-i18next';
import { AppBreadcrumb } from 'components';
import { TenantSelector } from '@/components/TenantSelector';
import { LoyaltyService, GameStatisticsResponseModel } from '@/service/loyalty.service';

export const GameStatisticsPage: React.FC = () => {
  const { t } = useTranslation();

  const [selectedTenant, setSelectedTenant] = useState<string>(
    () => localStorage.getItem('selected_tenant_id') || 'TENANT_NATCASH'
  );
  const [stats, setStats] = useState<GameStatisticsResponseModel | null>(null);
  const [loading, setLoading] = useState(false);

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

  const byGame = stats?.byGame || [];
  const recentSessions = stats?.recentSessions || [];

  return (
    <div>
      <AppBreadcrumb items={[{ label: t('nav.game_stats', { defaultValue: 'Thống kê & Lịch sử Game (GM-07)' }) }]} />

      <div className="card shadow-1 border-round surface-card p-4">
        <div className="flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
          <div>
            <h4 className="m-0 text-primary font-semibold">
              {t('game.stats_title', { defaultValue: 'Thống kê Hiệu suất GameHub & Lịch sử Chơi (GM-07)' })}
            </h4>
            <p className="m-0 text-xs text-500 mt-1">
              {t('game.stats_subtitle', { defaultValue: 'Tổng lượt chơi, số người tham gia duy nhất, tổng điểm/voucher phát thưởng và nhật ký phiên chơi.' })}
            </p>
          </div>
          <div className="flex gap-2 align-items-center">
            <TenantSelector value={selectedTenant} onChange={setSelectedTenant} />
            <Button icon="pi pi-refresh" outlined rounded onClick={fetchStats} loading={loading} />
          </div>
        </div>

        <div className="grid mb-4">
          <div className="col-12 md:col-3">
            <div className="p-3 border-round surface-50 border-1 surface-border">
              <div className="text-xs text-500 uppercase">{t('game.total_plays', { defaultValue: 'Tổng Lượt Chơi' })}</div>
              <div className="text-2xl font-mono font-semibold text-primary mt-1">{Number(stats?.totalSessions || 0).toLocaleString()}</div>
            </div>
          </div>
          <div className="col-12 md:col-3">
            <div className="p-3 border-round surface-50 border-1 surface-border">
              <div className="text-xs text-500 uppercase">{t('game.unique_players', { defaultValue: 'Người Chơi Duy Nhất' })}</div>
              <div className="text-2xl font-mono font-semibold text-blue-600 mt-1">{Number(stats?.uniquePlayers || 0).toLocaleString()}</div>
            </div>
          </div>
          <div className="col-12 md:col-3">
            <div className="p-3 border-round surface-50 border-1 surface-border">
              <div className="text-xs text-500 uppercase">{t('game.points_awarded', { defaultValue: 'Điểm Đã Thưởng' })}</div>
              <div className="text-2xl font-mono font-semibold text-green-600 mt-1">{Number(stats?.totalPointsAwarded || 0).toLocaleString()}</div>
            </div>
          </div>
          <div className="col-12 md:col-3">
            <div className="p-3 border-round surface-50 border-1 surface-border">
              <div className="text-xs text-500 uppercase">{t('game.turns_consumed', { defaultValue: 'Lượt Quay Đã Dùng' })}</div>
              <div className="text-2xl font-mono font-semibold text-orange-600 mt-1">{Number(stats?.totalTurnsConsumed || 0).toLocaleString()}</div>
            </div>
          </div>
        </div>

        <h5 className="mb-2 text-800">{t('game.breakdown_by_game', { defaultValue: 'Phân rã theo Từng Tựa Game' })}</h5>
        {loading ? (
          <div className="flex flex-column gap-2 mb-4"><Skeleton height="2.5rem" /><Skeleton height="2.5rem" /></div>
        ) : (
          <DataTable<GameStatisticsResponseModel['byGame']> value={byGame} paginator rows={5} stripedRows responsiveLayout="scroll" className="mb-4" emptyMessage={t('common.no_data', { defaultValue: 'Chưa có thống kê lượt chơi theo game.' })}>
            <Column field="gameCode" header={t('game.code', { defaultValue: 'Mã Game' })} body={(r) => <span className="font-mono white-space-nowrap font-medium text-primary">{r.gameCode}</span>} style={{ minWidth: '10rem' }} />
            <Column field="gameName" header={t('game.name', { defaultValue: 'Tên Game' })} style={{ minWidth: '14rem' }} />
            <Column field="category" header={t('game.category', { defaultValue: 'Thể Loại' })} body={(r) => <Tag value={r.category} severity="info" />} style={{ minWidth: '9rem' }} />
            <Column field="sessionsCount" header={t('game.total_plays', { defaultValue: 'Lượt Chơi' })} body={(r) => Number(r.sessionsCount || 0).toLocaleString()} style={{ minWidth: '8rem', textAlign: 'right' }} />
            <Column field="pointsAwarded" header={t('game.points_awarded', { defaultValue: 'Điểm Thưởng' })} body={(r) => <span className="font-mono">{Number(r.pointsAwarded || 0).toLocaleString()}</span>} style={{ minWidth: '9rem', textAlign: 'right' }} />
            <Column field="winRatePercent" header={t('game.win_rate', { defaultValue: 'Tỷ Lệ Trúng' })} body={(r) => <span className="font-mono">{Number(r.winRatePercent || 0).toFixed(1)}%</span>} style={{ minWidth: '8rem', textAlign: 'right' }} />
          </DataTable>
        )}

        <h5 className="mb-2 text-800">{t('game.recent_sessions', { defaultValue: 'Nhật ký Phiên Chơi Gần Đây' })}</h5>
        <DataTable<GameStatisticsResponseModel['recentSessions']> value={recentSessions} paginator rows={10} stripedRows responsiveLayout="scroll" emptyMessage={t('common.no_data', { defaultValue: 'Chưa có phiên chơi nào được ghi nhận.' })}>
          <Column field="sessionId" header="Session ID" body={(r) => <span className="font-mono white-space-nowrap text-xs">{r.sessionId}</span>} style={{ minWidth: '13rem' }} />
          <Column field="externalUserId" header={t('customer.phone', { defaultValue: 'Hội Viên' })} body={(r) => <span className="font-mono white-space-nowrap">{r.externalUserId}</span>} style={{ minWidth: '10rem' }} />
          <Column field="gameCode" header={t('game.code', { defaultValue: 'Game' })} style={{ minWidth: '9rem' }} />
          <Column field="prizeName" header={t('game.reward', { defaultValue: 'Phần Thưởng' })} style={{ minWidth: '12rem' }} />
          <Column field="pointsWon" header={t('common.points', { defaultValue: 'Điểm' })} body={(r) => <span className="font-mono">{r.pointsWon || 0}</span>} style={{ minWidth: '6.5rem', textAlign: 'right' }} />
          <Column field="playedAt" header={t('common.created_at', { defaultValue: 'Thời Gian' })} body={(r) => <span className="font-mono white-space-nowrap text-xs">{r.playedAt ? new Date(r.playedAt).toLocaleString('vi-VN') : '--'}</span>} style={{ minWidth: '11rem' }} />
        </DataTable>
      </div>
    </div>
  );
};

export default GameStatisticsPage;
