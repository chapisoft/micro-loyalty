import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { ProgressBar } from 'primereact/progressbar';
import { InputSwitch } from 'primereact/inputswitch';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { StandardPageHeader } from '@/components/StandardPageHeader';
import { UniversalFilterBar } from '@/components/UniversalFilterBar';
import { StandardRowActions } from '@/components/StandardRowActions';
import { StatusBadge, TypeBadge } from '@/components/StatusBadge';
import { exportToExcel } from '@/components/exportHelper';
import { CommonStatus } from '@/models';
import { LoyaltyService, GameDashboardStats } from '@/service/loyalty.service';

interface GameItem {
  id: number;
  gameCode: string;
  gameName: string;
  category: string;
  pricePerTurn: number;
  pricePerTurnHtg: number;
  freeTurnsDaily: number;
  dailyBudgetLimit: number;
  allowPointsSpin: boolean;
  gameUrl: string;
  iconUrl?: string;
  bannerUrl?: string;
  description?: string;
  rulesText?: string;
  status: CommonStatus;
  // Third-Party Game Studio Config
  partnerCode?: string;
  webhookUrl?: string;
  revenueSharePercent?: number;
  // Specific Game Parameters
  quizQuestionCount?: number;
  quizCountdownSec?: number;
  quizRewardPoints?: number;
  farmSeasonDays?: number;
  farmVoucherLimit?: number;
  diceMultiplierMax?: number;
}

interface GamePrizeItem {
  id?: number;
  gameCode?: string;
  prizeCode: string;
  prizeName: string;
  nameVi?: string;
  nameEn?: string;
  nameFr?: string;
  nameHt?: string;
  prizeType: string;
  prizeValue: number;
  probabilityWeight: number;
  dailyBudgetLimit?: number;
  weeklyBudgetLimit?: number;
  monthlyBudgetLimit?: number;
  dailyMaxWinners?: number;
  weeklyMaxWinners?: number;
  monthlyMaxWinners?: number;
  colorCode: string;
  iconSymbol: string;
  bgImageUrl?: string;
  displayOrder: number;
  status: string;
}

export const GameManagementPage: React.FC = () => {
  const { t } = useTranslation();
  const [selectedTenant] = useState('ALL');
  const [games, setGames] = useState<GameItem[]>([]);
  const [stats, setStats] = useState<GameDashboardStats>({
    totalGames: 0,
    activeGames: 0,
    todaySpins: 0,
    yesterdaySpins: 0,
    spinGrowthPercent: 0,
    todaySpentAmount: 0,
    dailyBudgetLimit: 0,
    budgetUsagePercent: 0,
    uniquePlayersToday: 0,
    lockMechanism: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedGames, setSelectedGames] = useState<GameItem[]>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const prizeTypes = useMemo(() => [
    { label: t('game.prize_type_points'), value: 'POINTS' },
    { label: t('game.prize_type_voucher'), value: 'VOUCHER' },
    { label: t('game.prize_type_cashback'), value: 'CASHBACK' },
    { label: t('game.prize_type_multiplier'), value: 'MULTIPLIER' },
    { label: t('game.prize_type_turns'), value: 'TURNS' },
    { label: t('game.prize_type_no_luck'), value: 'NO_LUCK' },
  ], [t]);

  // Dialog States
  const [showGameDialog, setShowGameDialog] = useState(false);
  const [showParamsDialog, setShowParamsDialog] = useState(false);
  const [showPrizeDialog, setShowPrizeDialog] = useState(false);
  const [showPrizeFormDialog, setShowPrizeFormDialog] = useState(false);

  // Form Data States
  const [gameFormData, setGameFormData] = useState<Partial<GameItem>>({});
  const [paramsFormData, setParamsFormData] = useState<Partial<GameItem>>({});
  const [selectedGameForPrizes, setSelectedGameForPrizes] = useState<GameItem | null>(null);
  const [prizesList, setPrizesList] = useState<GamePrizeItem[]>([]);
  const [isPrizesLoading, setIsPrizesLoading] = useState(false);
  const [prizeFormData, setPrizeFormData] = useState<Partial<GamePrizeItem>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useRef<Toast>(null);

  // 1. Tải số liệu thống kê thời gian thực từ Backend
  const loadStats = useCallback(async () => {
    try {
      const data = await LoyaltyService.getGameDashboardStats(selectedTenant);
      if (data) {
        setStats(data);
      }
    } catch (e) {
      console.error('[GameManagementPage] Load stats error:', e);
    }
  }, [selectedTenant]);

  // 2. Tải danh mục trò chơi từ Backend
  const loadGames = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await LoyaltyService.getGames(selectedTenant);
      if (Array.isArray(data) && data.length > 0) {
        setGames(data);
      } else {
        setGames([]);
      }
    } catch (e) {
      console.error('[GameManagementPage] Load games error:', e);
    } finally {
      setIsLoading(false);
    }
  }, [selectedTenant]);

  useEffect(() => {
    loadGames();
    loadStats();
  }, [loadGames, loadStats]);

  // 2. Tải danh sách ô giải thưởng của trò chơi
  const loadGamePrizes = async (gameCode: string) => {
    setIsPrizesLoading(true);
    try {
      const data = await LoyaltyService.getGamePrizes(gameCode, selectedTenant);
      setPrizesList(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('[loadGamePrizes] Error:', e);
      setPrizesList([]);
    } finally {
      setIsPrizesLoading(false);
    }
  };

  const openPrizesManager = (game: GameItem) => {
    setSelectedGameForPrizes(game);
    loadGamePrizes(game.gameCode);
    setShowPrizeDialog(true);
  };

  const openNewPrize = () => {
    setPrizeFormData({
      prizeCode: 'PRIZE_' + (prizesList.length + 1),
      prizeName: '',
      prizeType: 'POINTS',
      prizeValue: 100,
      probabilityWeight: 10,
      dailyBudgetLimit: 5000,
      colorCode: '#F59E0B',
      iconSymbol: '🎁',
      displayOrder: prizesList.length + 1,
      status: 'ACTIVE',
    });
    setShowPrizeFormDialog(true);
  };

  const editPrize = (prize: GamePrizeItem) => {
    setPrizeFormData({ ...prize });
    setShowPrizeFormDialog(true);
  };

  const savePrize = async () => {
    if (!selectedGameForPrizes) return;
    confirmDialog({
      message: t('game.confirm_save_prize', {
        name: prizeFormData.prizeName || t('common.new_item')
      }),
      header: t('common.confirm_save'),
      icon: 'pi pi-question-circle',
      acceptLabel: t('common.confirm'),
      rejectLabel: t('common.cancel'),
      accept: async () => {
        setIsSubmitting(true);
        try {
          await LoyaltyService.saveGamePrize(selectedGameForPrizes.gameCode, prizeFormData, selectedTenant);
          await loadGamePrizes(selectedGameForPrizes.gameCode);
          setShowPrizeFormDialog(false);
          toast.current?.show({
            severity: 'success',
            summary: t('common.success'),
            detail: t('game.save_prize_success'),
            life: 3000,
          });
        } catch (e: any) {
          console.error('[savePrize] Error:', e);
          toast.current?.show({
            severity: 'error',
            summary: t('common.error'),
            detail: t('game.save_prize_failed') + ': ' + (e?.message || ''),
            life: 4000,
          });
        } finally {
          setIsSubmitting(false);
        }
      },
    });
  };

  const deletePrize = async (prize: GamePrizeItem) => {
    if (!selectedGameForPrizes || !prize.id) return;
    confirmDialog({
      message: t('game.confirm_delete_prize', {
        name: prize.prizeName
      }),
      header: t('common.confirm_delete'),
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      acceptLabel: t('common.delete'),
      rejectLabel: t('common.cancel'),
      accept: async () => {
        setIsSubmitting(true);
        try {
          await LoyaltyService.deleteGamePrize(prize.id!, selectedTenant);
          await loadGamePrizes(selectedGameForPrizes.gameCode);
          toast.current?.show({
            severity: 'success',
            summary: t('common.success'),
            detail: t('game.delete_prize_success'),
            life: 3000,
          });
        } catch (e: any) {
          console.error('[deletePrize] Error:', e);
          toast.current?.show({
            severity: 'error',
            summary: t('common.error'),
            detail: t('game.delete_prize_failed') + ': ' + (e?.message || ''),
            life: 4000,
          });
        } finally {
          setIsSubmitting(false);
        }
      },
    });
  };

  const autoBalancePrizes = async () => {
    if (!selectedGameForPrizes) return;
    setIsSubmitting(true);
    try {
      const updated = await LoyaltyService.autoBalanceGamePrizes(selectedGameForPrizes.gameCode, selectedTenant);
      setPrizesList(Array.isArray(updated) ? updated : []);
      toast.current?.show({
        severity: 'success',
        summary: t('common.success'),
        detail: t('game.rebalance_success'),
        life: 3000,
      });
    } catch (e: any) {
      console.error('[autoBalancePrizes] Error:', e);
      toast.current?.show({
        severity: 'error',
        summary: t('common.error'),
        detail: t('game.rebalance_failed') + ': ' + (e?.message || ''),
        life: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openNewGame = () => {
    setGameFormData({
      gameCode: '',
      gameName: '',
      category: 'INSTANT_WIN',
      pricePerTurn: 10,
      pricePerTurnHtg: 10,
      freeTurnsDaily: 1,
      dailyBudgetLimit: 20000,
      allowPointsSpin: true,
      gameUrl: '',
      description: '',
      rulesText: '',
      status: CommonStatus.ACTIVE,
    });
    setShowGameDialog(true);
  };

  const editGame = (game: GameItem) => {
    setGameFormData({ ...game });
    setShowGameDialog(true);
  };

  const openParamsConfig = (game: GameItem) => {
    setParamsFormData({ ...game });
    setShowParamsDialog(true);
  };

  const saveGame = async () => {
    setIsSubmitting(true);
    try {
      await LoyaltyService.saveGame(gameFormData, selectedTenant);
      await loadGames();
      setShowGameDialog(false);
      toast.current?.show({
        severity: 'success',
        summary: t('common.success'),
        detail: gameFormData.id
          ? t('game.update_game_success')
          : t('game.create_game_success'),
        life: 3000,
      });
    } catch (e: any) {
      console.error('[saveGame] Error:', e);
      toast.current?.show({
        severity: 'error',
        summary: t('common.error'),
        detail: t('game.save_game_failed') + ': ' + (e?.message || ''),
        life: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveParamsConfig = async () => {
    setIsSubmitting(true);
    try {
      await LoyaltyService.saveGame(paramsFormData, selectedTenant);
      await loadGames();
      setShowParamsDialog(false);
      toast.current?.show({
        severity: 'success',
        summary: t('common.success'),
        detail: t('game.update_params_success'),
        life: 3000,
      });
    } catch (e: any) {
      console.error('[saveParamsConfig] Error:', e);
      toast.current?.show({
        severity: 'error',
        summary: t('common.error'),
        detail: t('game.save_params_failed') + ': ' + (e?.message || ''),
        life: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteGameItem = (game: GameItem) => {
    confirmDialog({
      message: t('game.delete_confirm_msg', { name: game.gameName }),
      header: t('game.delete_confirm_title', 'Xác nhận xóa trò chơi'),
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      acceptLabel: t('common.yes'),
      rejectLabel: t('common.no'),
      accept: async () => {
        setIsLoading(true);
        try {
          await LoyaltyService.deleteGame(game.id, selectedTenant);
          toast.current?.show({
            severity: 'success',
            summary: t('common.success'),
            detail: t('game.delete_game_success', 'Đã xóa trò chơi thành công'),
            life: 3000,
          });
          await loadGames();
        } catch (e: any) {
          console.error('[deleteGame] Error:', e);
          toast.current?.show({
            severity: 'error',
            summary: t('common.error'),
            detail: e?.message || t('game.delete_game_failed', 'Xóa trò chơi thất bại'),
            life: 4000,
          });
        } finally {
          setIsLoading(false);
        }
      },
    });
  };

  const handleExport = () => {
    exportToExcel(
      games.map((g, idx) => ({
        stt: idx + 1,
        gameCode: g.gameCode,
        gameName: g.gameName,
        category: g.category,
        freeTurnsDaily: g.freeTurnsDaily,
        pricePerTurnHtg: g.pricePerTurnHtg,
        dailyBudgetLimit: g.dailyBudgetLimit,
        status: g.status,
      })),
      [
        { key: 'stt', header: t('common.stt') },
        { key: 'gameCode', header: t('game.game_code') },
        { key: 'gameName', header: t('game.game_name') },
        { key: 'category', header: t('game.category') },
        { key: 'freeTurnsDaily', header: t('game.free_turns_daily') },
        { key: 'pricePerTurnHtg', header: t('game.price_per_turn_htg') },
        { key: 'dailyBudgetLimit', header: t('game.daily_budget_total') },
        { key: 'status', header: t('common.status') },
      ],
      `Danh_Sach_Tro_Choi_${selectedTenant}`
    );
  };

  const statusTemplate = (status: CommonStatus | string) => {
    return <StatusBadge status={status} />;
  };

  const categoryOptions = useMemo(() => [
    { label: t('game.cat_lucky_draw'), value: 'LUCKY_DRAW' },
    { label: t('game.cat_instant_win'), value: 'INSTANT_WIN' },
    { label: t('game.cat_action'), value: 'ACTION' },
    { label: t('game.cat_adventure'), value: 'ADVENTURE' },
    { label: t('game.cat_board_3d'), value: 'BOARD_3D' },
    { label: t('game.cat_quiz'), value: 'QUIZ' },
    { label: t('game.cat_casual'), value: 'CASUAL' },
  ], [t]);

  const statusOptions = [
    { label: t('common.active'), value: CommonStatus.ACTIVE },
    { label: t('common.inactive'), value: CommonStatus.INACTIVE },
  ];

  // Tính toán tổng trọng số và % xác suất
  const totalPrizeWeight = prizesList
    .filter((p) => p.status === CommonStatus.ACTIVE)
    .reduce((sum, item) => sum + (item.probabilityWeight || 0), 0);

  return (
    <div className="w-full">
      <Toast ref={toast} position="top-right" />
      <ConfirmDialog />
      <StandardPageHeader
        title={t('nav.game_catalog')}
        subtitle={t('game.page_subtitle', 'Quản lý danh mục trò chơi, cấu hình tỷ lệ trúng thưởng và hạn mức ngân sách')}
        breadcrumbs={[
          { label: t('nav.rewards_games') },
          { label: t('nav.game_catalog') },
        ]}
        primaryAction={{
          label: t('common.add_new'),
          icon: 'pi pi-plus',
          onClick: openNewGame,
        }}
      />

      {/* ── KPI METRIC CARDS ── */}
      <div className="grid mb-3">
        <div className="col-12 md:col-3">
          <div className="card mb-0 shadow-1 border-round surface-card p-3 border-left-3 border-blue-500">
            <div className="flex justify-content-between align-items-center mb-2">
              <div>
                <span className="block text-600 font-bold text-xs mb-1 uppercase tracking-wide">
                  {t('game.game_list')}
                </span>
                <div className="text-900 font-bold text-2xl tracking-tight">
                  {stats.totalGames > 0 ? stats.totalGames : games.length} {t('common.games')}
                </div>
              </div>
              <div
                className="flex align-items-center justify-content-center border-round shadow-1 flex-shrink-0"
                style={{
                  width: '3rem',
                  height: '3rem',
                  background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                }}
              >
                <i className="pi pi-th-large text-white text-xl" />
              </div>
            </div>
            <span className="text-green-600 font-medium text-xs flex align-items-center gap-1">
              <i className="pi pi-check text-xs font-bold" /> {stats.activeGames > 0 ? stats.activeGames : games.filter(g => g.status === CommonStatus.ACTIVE).length} {t('game.active_count')}
            </span>
          </div>
        </div>

        <div className="col-12 md:col-3">
          <div className="card mb-0 shadow-1 border-round surface-card p-3 border-left-3 border-orange-500">
            <div className="flex justify-content-between align-items-center mb-2">
              <div>
                <span className="block text-600 font-bold text-xs mb-1 uppercase tracking-wide">
                  {t('game.today_spins')}
                </span>
                <div className="text-900 font-bold text-2xl font-mono tracking-tight text-orange-600">
                  {stats.todaySpins.toLocaleString()} {t('common.spins')}
                </div>
              </div>
              <div
                className="flex align-items-center justify-content-center border-round shadow-1 flex-shrink-0"
                style={{
                  width: '3rem',
                  height: '3rem',
                  background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                }}
              >
                <i className="pi pi-bolt text-white text-xl" />
              </div>
            </div>
            <span className={`font-medium text-xs flex align-items-center gap-1 ${stats.spinGrowthPercent >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              <i className={`pi ${stats.spinGrowthPercent >= 0 ? 'pi-arrow-up' : 'pi-arrow-down'} text-xs font-bold`} />{' '}
              {stats.spinGrowthPercent >= 0 ? `+${stats.spinGrowthPercent}%` : `${stats.spinGrowthPercent}%`} {t('game.vs_yesterday')}
            </span>
          </div>
        </div>

        <div className="col-12 md:col-3">
          <div className="card mb-0 shadow-1 border-round surface-card p-3 border-left-3 border-green-500">
            <div className="flex justify-content-between align-items-center mb-2">
              <div>
                <span className="block text-600 font-bold text-xs mb-1 uppercase tracking-wide">
                  {t('game.today_cost')}
                </span>
                <div className="text-900 font-bold text-2xl font-mono tracking-tight text-green-600">
                  {stats.todaySpentAmount.toLocaleString()} HTG
                </div>
              </div>
              <div
                className="flex align-items-center justify-content-center border-round shadow-1 flex-shrink-0"
                style={{
                  width: '3rem',
                  height: '3rem',
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                }}
              >
                <i className="pi pi-wallet text-white text-xl" />
              </div>
            </div>
            <span className="text-600 font-medium text-xs">
              {t('game.budget_limit_note', {
                limit: stats.dailyBudgetLimit.toLocaleString(),
                percent: stats.budgetUsagePercent
              })}
            </span>
          </div>
        </div>

        <div className="col-12 md:col-3">
          <div className="card mb-0 shadow-1 border-round surface-card p-3 border-left-3 border-purple-500">
            <div className="flex justify-content-between align-items-center mb-2">
              <div>
                <span className="block text-600 font-bold text-xs mb-1 uppercase tracking-wide">{t('game.lock_ledger_mechanism')}</span>
                <div className="text-900 font-bold text-2xl tracking-tight text-purple-600">
                  {stats.lockMechanism || 'Redisson RLock'}
                </div>
              </div>
              <div
                className="flex align-items-center justify-content-center border-round shadow-1 flex-shrink-0"
                style={{
                  width: '3rem',
                  height: '3rem',
                  background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
                }}
              >
                <i className="pi pi-shield text-white text-xl" />
              </div>
            </div>
            <span className="text-purple-600 font-medium text-xs flex align-items-center gap-1">
              <i className="pi pi-check text-xs font-bold" /> {t('game.integrity_status')}
            </span>
          </div>
        </div>
      </div>

      {/* ── GAME CATALOG & DETAILED PARAMETERS ── */}
      <div className="card shadow-1 border-round surface-card p-3 w-full">
        <UniversalFilterBar
          searchValue={globalFilter}
          onSearchChange={setGlobalFilter}
          searchPlaceholder={t('common.search')}
          onExport={handleExport}
          onReset={() => setGlobalFilter('')}
          onRefresh={() => {
            loadGames();
            loadStats();
          }}
        />

        <DataTable<any>
          value={games}
          selection={selectedGames}
          onSelectionChange={(e: any) => setSelectedGames(e.value || [])}
          dataKey="id"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          stripedRows
          responsiveLayout="scroll"
          globalFilter={globalFilter}
          loading={isLoading}
          emptyMessage={t('common.no_data')}
        >
          <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
          <Column
            header={t('common.order_number', 'STT')}
            body={(_, options) => options.rowIndex + 1}
            style={{ width: '4rem', textAlign: 'center' }}
          />
          <Column
            header={t('common.action', 'Thao tác')}
            body={(rowData: GameItem) => (
              <StandardRowActions
                onEdit={() => editGame(rowData)}
                onDelete={() => deleteGameItem(rowData)}
                extraActions={[
                  {
                    label: t('game.dynamic_prizes_tooltip'),
                    icon: 'pi pi-gift',
                    onClick: () => openPrizesManager(rowData),
                  },
                  {
                    label: t('game.config_params'),
                    icon: 'pi pi-cog',
                    onClick: () => openParamsConfig(rowData),
                  },
                ]}
              />
            )}
            style={{ width: '8.5rem', textAlign: 'center' }}
          />
          <Column
            field="gameCode"
            header={t('game.game_code')}
            body={(row: GameItem) => <span className="font-bold font-mono text-900">{row.gameCode}</span>}
            sortable
            style={{ minWidth: '9rem' }}
          />
          <Column
            field="gameName"
            header={t('game.game_name')}
            body={(row: GameItem) => <span className="text-900">{row.gameName}</span>}
            sortable
            style={{ minWidth: '13rem' }}
          />
          <Column
            field="category"
            header={t('game.category')}
            body={(row: GameItem) => <span className="text-900">{row.category}</span>}
            sortable
            style={{ minWidth: '8rem' }}
          />
          <Column
            field="freeTurnsDaily"
            header={t('game.free_turns_daily')}
            body={(row: GameItem) => <span className="text-900">{row.freeTurnsDaily} {t('common.spins')}</span>}
            sortable
            style={{ minWidth: '8rem', textAlign: 'center' }}
          />
          <Column
            field="pricePerTurnHtg"
            header={t('game.price_per_turn_htg')}
            body={(row: GameItem) =>
              row.pricePerTurnHtg > 0 ? (
                <span className="text-900">{row.pricePerTurnHtg} HTG</span>
              ) : (
                <span className="text-900">{t('common.free')}</span>
              )
            }
            sortable
            style={{ minWidth: '8.5rem', textAlign: 'center' }}
          />
          <Column
            field="dailyBudgetLimit"
            header={t('game.daily_budget_total')}
            body={(row: GameItem) =>
              row.dailyBudgetLimit > 0 ? (
                <span className="text-900">{row.dailyBudgetLimit.toLocaleString()} HTG</span>
              ) : (
                <span className="text-500 text-xs">{t('common.unlimited')}</span>
              )
            }
            sortable
            style={{ minWidth: '9rem', textAlign: 'center' }}
          />
          <Column
            field="status"
            body={(row: GameItem) => statusTemplate(row.status)}
            header={t('common.status')}
            sortable
            style={{ minWidth: '8rem', textAlign: 'center' }}
          />
        </DataTable>
      </div>

      {/* ── DIALOG 1: DYNAMIC PRIZE MATRIX MANAGER ── */}
      <Dialog
        visible={showPrizeDialog}
        style={{ width: '900px' }}
        header={
          <div className="flex align-items-center gap-2">
            <i className="pi pi-gift text-orange-500 font-bold text-xl" />
            <span className="font-bold">
              {t('game.prizes_manager_title', {
                name: selectedGameForPrizes?.gameName || '',
                code: selectedGameForPrizes?.gameCode || ''
              })}
            </span>
          </div>
        }
        modal
        onHide={() => setShowPrizeDialog(false)}
      >
        {/* Metric Summary Header */}
        <div className="grid mb-3">
          <div className="col-12 md:col-4">
            <div className="p-3 surface-100 border-round-xl text-center">
              <span className="text-xs text-500 font-bold uppercase block mb-1">{t('game.active_prizes_count')}</span>
              <span className="text-xl font-bold text-900">{prizesList.length} {t('game.prizes_unit')}</span>
            </div>
          </div>
          <div className="col-12 md:col-4">
            <div className="p-3 surface-100 border-round-xl text-center">
              <span className="text-xs text-500 font-bold uppercase block mb-1">{t('game.total_probability_weight')}</span>
              <span className="text-xl font-bold font-mono text-blue-600">{totalPrizeWeight}</span>
            </div>
          </div>
          <div className="col-12 md:col-4">
            <div className="p-3 surface-100 border-round-xl text-center">
              <span className="text-xs text-500 font-bold uppercase block mb-1">{t('game.balance_status')}</span>
              <span className="text-xl font-bold text-green-600">{t('game.rng_normalized')}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-content-between align-items-center mb-3">
          <span className="text-xs text-600">
            {t('game.prizes_note')}
          </span>
          <div className="flex gap-2">
            <Button
              label={t('game.auto_balance_btn')}
              icon="pi pi-sliders-h"
              severity="secondary"
              outlined
              size="small"
              onClick={autoBalancePrizes}
              loading={isSubmitting}
            />
            <Button
              label={t('common.add_new', 'Thêm mới')}
              tooltip={t('game.add_prize_btn', 'Thêm phần thưởng')}
              icon="pi pi-plus"
              severity="warning"
              size="small"
              onClick={openNewPrize}
            />
          </div>
        </div>

        <DataTable<any>
          value={prizesList}
          dataKey="id"
          stripedRows
          responsiveLayout="scroll"
          loading={isPrizesLoading}
          emptyMessage={t('game.no_prizes_configured')}
        >
          <Column field="displayOrder" header={t('common.order_number', 'STT')} style={{ width: '4rem', textAlign: 'center' }} />
          <Column
            header={t('common.action', 'Thao tác')}
            body={(row: GamePrizeItem) => (
              <div className="flex gap-1 justify-content-center">
                <Button icon="pi pi-pencil" rounded text severity="secondary" size="small" onClick={() => editPrize(row)} tooltip={t('common.edit')} />
                <Button icon="pi pi-trash" rounded text severity="danger" size="small" onClick={() => deletePrize(row)} tooltip={t('common.delete')} />
              </div>
            )}
            style={{ width: '6rem', textAlign: 'center' }}
          />
          <Column
            field="iconSymbol"
            header={t('game.prize_icon')}
            body={(row: GamePrizeItem) => <span className="text-xl">{row.iconSymbol || '🎁'}</span>}
            style={{ width: '4rem', textAlign: 'center' }}
          />
          <Column
            field="prizeCode"
            header={t('game.prize_code')}
            body={(row: GamePrizeItem) => <span className="font-bold font-mono text-900">{row.prizeCode}</span>}
            sortable
            style={{ minWidth: '9rem' }}
          />
          <Column
            field="prizeName"
            header={t('game.prize_name')}
            body={(row: GamePrizeItem) => <span className="text-900">{row.prizeName}</span>}
            sortable
            style={{ minWidth: '12rem' }}
          />
          <Column
            field="prizeType"
            header={t('game.prize_type')}
            body={(row: GamePrizeItem) => <TypeBadge type={row.prizeType} />}
            style={{ minWidth: '8rem', textAlign: 'center' }}
          />
          <Column
            field="prizeValue"
            header={t('game.prize_value')}
            body={(row: GamePrizeItem) => <span className="font-bold font-mono text-900">+{row.prizeValue}</span>}
            style={{ minWidth: '6rem', textAlign: 'right' }}
          />
          <Column
            field="probabilityWeight"
            header={t('game.probability_weight')}
            body={(row: GamePrizeItem) => <span className="font-mono">{row.probabilityWeight}</span>}
            style={{ minWidth: '6rem', textAlign: 'center' }}
          />
          <Column
            header={t('game.probability_pct')}
            body={(row: GamePrizeItem) => {
              const pct = totalPrizeWeight > 0 ? (row.probabilityWeight / totalPrizeWeight) * 100 : 0;
              return (
                <div style={{ minWidth: '6rem' }}>
                  <span className="font-mono text-xs font-bold text-900 block mb-1">{pct.toFixed(1)}%</span>
                  <ProgressBar value={pct} showValue={false} style={{ height: '5px' }} />
                </div>
              );
            }}
            style={{ minWidth: '7rem' }}
          />
          <Column
            field="status"
            header={t('common.status')}
            body={(row: GamePrizeItem) => statusTemplate(row.status)}
            style={{ minWidth: '7rem' }}
          />
        </DataTable>
      </Dialog>

      {/* ── DIALOG 2: ADD/EDIT PRIZE SUB-FORM ── */}
      <Dialog
        visible={showPrizeFormDialog}
        style={{ width: '640px' }}
        header={prizeFormData.id ? t('game.edit_prize_title') : t('game.add_prize_title')}
        modal
        onHide={() => setShowPrizeFormDialog(false)}
      >
        <div className="p-fluid">
        <div className="surface-100 p-3 border-round-lg mb-3">
          <div className="font-bold text-sm mb-2 text-primary">{t('game.prize_section_1')}</div>
          <div className="field mb-2">
            <label htmlFor="prizeCode" className="font-bold text-xs">{t('game.prize_code_label')}</label>
            <InputText
              id="prizeCode"
              value={prizeFormData.prizeCode || ''}
              onChange={(e) => setPrizeFormData({ ...prizeFormData, prizeCode: e.target.value })}
              placeholder={t('game.prize_code_placeholder')}
              required
            />
          </div>

          <div className="grid">
            <div className="col-12 md:col-6 field mb-2">
              <label htmlFor="nameVi" className="font-bold text-xs">{t('game.name_vi_label')}</label>
              <InputText
                id="nameVi"
                value={prizeFormData.nameVi || prizeFormData.prizeName || ''}
                onChange={(e) => setPrizeFormData({ ...prizeFormData, nameVi: e.target.value, prizeName: e.target.value })}
                placeholder={t('game.name_vi_placeholder')}
                required
              />
            </div>
            <div className="col-12 md:col-6 field mb-2">
              <label htmlFor="nameEn" className="font-bold text-xs">{t('game.name_en_label')}</label>
              <InputText
                id="nameEn"
                value={prizeFormData.nameEn || ''}
                onChange={(e) => setPrizeFormData({ ...prizeFormData, nameEn: e.target.value })}
                placeholder={t('game.name_en_placeholder')}
              />
            </div>
            <div className="col-12 md:col-6 field mb-2">
              <label htmlFor="nameFr" className="font-bold text-xs">{t('game.name_fr_label')}</label>
              <InputText
                id="nameFr"
                value={prizeFormData.nameFr || ''}
                onChange={(e) => setPrizeFormData({ ...prizeFormData, nameFr: e.target.value })}
                placeholder="100 Points Bonus"
              />
            </div>
            <div className="col-12 md:col-6 field mb-2">
              <label htmlFor="nameHt" className="font-bold text-xs">{t('game.name_ht_label')}</label>
              <InputText
                id="nameHt"
                value={prizeFormData.nameHt || ''}
                onChange={(e) => setPrizeFormData({ ...prizeFormData, nameHt: e.target.value })}
                placeholder="100 Pwen Kado"
              />
            </div>
          </div>
        </div>

        <div className="surface-100 p-3 border-round-lg mb-3">
          <div className="font-bold text-sm mb-2 text-primary">{t('game.prize_section_2')}</div>
          <div className="grid">
            <div className="col-12 md:col-6 field mb-2">
              <label htmlFor="prizeType" className="font-bold text-xs">{t('game.prize_type_label')}</label>
              <Dropdown
                id="prizeType"
                value={prizeFormData.prizeType || 'POINTS'}
                options={prizeTypes}
                onChange={(e) => setPrizeFormData({ ...prizeFormData, prizeType: e.value })}
              />
            </div>
            <div className="col-12 md:col-6 field mb-2">
              <label htmlFor="prizeValue" className="font-bold text-xs">{t('game.prize_value_label')}</label>
              <InputNumber
                id="prizeValue"
                value={prizeFormData.prizeValue || 0}
                min={0}
                onValueChange={(e) => setPrizeFormData({ ...prizeFormData, prizeValue: e.value || 0 })}
              />
            </div>
          </div>

          <div className="grid">
            <div className="col-12 md:col-4 field mb-2">
              <label htmlFor="probabilityWeight" className="font-bold text-xs">{t('game.probability_weight_label')}</label>
              <InputNumber
                id="probabilityWeight"
                value={prizeFormData.probabilityWeight || 100}
                min={1}
                onValueChange={(e) => setPrizeFormData({ ...prizeFormData, probabilityWeight: e.value || 100 })}
              />
            </div>
            <div className="col-12 md:col-4 field mb-2">
              <label htmlFor="displayOrder" className="font-bold text-xs">{t('game.display_order_label')}</label>
              <InputNumber
                id="displayOrder"
                value={prizeFormData.displayOrder || 1}
                min={1}
                onValueChange={(e) => setPrizeFormData({ ...prizeFormData, displayOrder: e.value || 1 })}
              />
            </div>
            <div className="col-12 md:col-4 field mb-2">
              <label htmlFor="iconSymbol" className="font-bold text-xs">{t('game.icon_symbol_label')}</label>
              <InputText
                id="iconSymbol"
                value={prizeFormData.iconSymbol || '🎁'}
                onChange={(e) => setPrizeFormData({ ...prizeFormData, iconSymbol: e.target.value })}
                placeholder="🏆, 💎, ⚽, 🎁"
              />
            </div>
          </div>
        </div>

        <div className="surface-100 p-3 border-round-lg mb-3">
          <div className="font-bold text-sm mb-2 text-primary">{t('game.prize_section_3')}</div>
          <div className="grid">
            <div className="col-12 md:col-4 field mb-2">
              <label htmlFor="dailyBudgetLimit" className="font-bold text-xs">{t('game.daily_budget_label')}</label>
              <InputNumber
                id="dailyBudgetLimit"
                value={prizeFormData.dailyBudgetLimit || 0}
                onValueChange={(e) => setPrizeFormData({ ...prizeFormData, dailyBudgetLimit: e.value || 0 })}
                placeholder={t('game.unlimited_zero_hint')}
              />
            </div>
            <div className="col-12 md:col-4 field mb-2">
              <label htmlFor="weeklyBudgetLimit" className="font-bold text-xs">{t('game.weekly_budget_label')}</label>
              <InputNumber
                id="weeklyBudgetLimit"
                value={prizeFormData.weeklyBudgetLimit || 0}
                onValueChange={(e) => setPrizeFormData({ ...prizeFormData, weeklyBudgetLimit: e.value || 0 })}
                placeholder={t('game.unlimited_zero_hint')}
              />
            </div>
            <div className="col-12 md:col-4 field mb-2">
              <label htmlFor="monthlyBudgetLimit" className="font-bold text-xs">{t('game.monthly_budget_label')}</label>
              <InputNumber
                id="monthlyBudgetLimit"
                value={prizeFormData.monthlyBudgetLimit || 0}
                onValueChange={(e) => setPrizeFormData({ ...prizeFormData, monthlyBudgetLimit: e.value || 0 })}
                placeholder={t('game.unlimited_zero_hint')}
              />
            </div>

            <div className="col-12 md:col-4 field mb-2">
              <label htmlFor="dailyMaxWinners" className="font-bold text-xs">{t('game.daily_max_winners_label')}</label>
              <InputNumber
                id="dailyMaxWinners"
                value={prizeFormData.dailyMaxWinners || 0}
                onValueChange={(e) => setPrizeFormData({ ...prizeFormData, dailyMaxWinners: e.value || 0 })}
                placeholder={t('game.unlimited_zero_hint')}
              />
            </div>
            <div className="col-12 md:col-4 field mb-2">
              <label htmlFor="weeklyMaxWinners" className="font-bold text-xs">{t('game.weekly_max_winners_label')}</label>
              <InputNumber
                id="weeklyMaxWinners"
                value={prizeFormData.weeklyMaxWinners || 0}
                onValueChange={(e) => setPrizeFormData({ ...prizeFormData, weeklyMaxWinners: e.value || 0 })}
                placeholder={t('game.unlimited_zero_hint')}
              />
            </div>
            <div className="col-12 md:col-4 field mb-2">
              <label htmlFor="monthlyMaxWinners" className="font-bold text-xs">{t('game.monthly_max_winners_label')}</label>
              <InputNumber
                id="monthlyMaxWinners"
                value={prizeFormData.monthlyMaxWinners || 0}
                onValueChange={(e) => setPrizeFormData({ ...prizeFormData, monthlyMaxWinners: e.value || 0 })}
                placeholder={t('game.unlimited_zero_hint')}
              />
            </div>
          </div>
        </div>

        <div className="field mb-3">
          <label htmlFor="prizeStatus" className="font-bold">{t('common.status')}</label>
          <Dropdown
            id="prizeStatus"
            value={prizeFormData.status || CommonStatus.ACTIVE}
            options={[
              { label: t('common.active'), value: CommonStatus.ACTIVE },
              { label: t('common.inactive'), value: CommonStatus.INACTIVE },
            ]}
            onChange={(e) => setPrizeFormData({ ...prizeFormData, status: e.value })}
          />
        </div>
        </div>

        <div className="flex justify-content-end gap-2 mt-4">
          <Button
            label={t('common.cancel')}
            icon="pi pi-times"
            outlined
            onClick={() => setShowPrizeFormDialog(false)}
            disabled={isSubmitting}
          />
          <Button
            label={t('common.save')}
            icon="pi pi-check"
            onClick={savePrize}
            loading={isSubmitting}
            disabled={isSubmitting}
          />
        </div>
      </Dialog>

      {/* ── DIALOG 3: GAME CREATION & BASIC INFO ── */}
      <Dialog
        visible={showGameDialog}
        style={{ width: '600px' }}
        header={
          gameFormData.id
            ? t('game.edit_game')
            : t('game.create_game')
        }
        modal
        onHide={() => setShowGameDialog(false)}
      >
        <div className="p-fluid">
        <div className="field mb-3">
          <label htmlFor="gameCode" className="font-bold">
            {t('game.game_code')}
          </label>
          <InputText
            id="gameCode"
            value={gameFormData.gameCode || ''}
            onChange={(e) => setGameFormData({ ...gameFormData, gameCode: e.target.value })}
            placeholder={t('game.game_code_placeholder')}
            required
            disabled={!!gameFormData.id}
          />
        </div>
        <div className="field mb-3">
          <label htmlFor="gameName" className="font-bold">
            {t('game.game_name')}
          </label>
          <InputText
            id="gameName"
            value={gameFormData.gameName || ''}
            onChange={(e) => setGameFormData({ ...gameFormData, gameName: e.target.value })}
            placeholder={t('game.game_name_placeholder')}
            required
          />
        </div>
        <div className="grid">
          <div className="col-12 md:col-6 field mb-3">
            <label htmlFor="category" className="font-bold">
              {t('game.category')}
            </label>
            <Dropdown
              id="category"
              value={gameFormData.category || 'INSTANT_WIN'}
              options={categoryOptions}
              onChange={(e) => setGameFormData({ ...gameFormData, category: e.value })}
            />
          </div>
          <div className="col-12 md:col-6 field mb-3">
            <label htmlFor="freeTurnsDaily" className="font-bold">
              {t('game.free_turns_daily')}
            </label>
            <InputNumber
              id="freeTurnsDaily"
              value={gameFormData.freeTurnsDaily || 0}
              min={0}
              onValueChange={(e) => setGameFormData({ ...gameFormData, freeTurnsDaily: e.value || 0 })}
            />
          </div>
        </div>
        <div className="grid">
          <div className="col-12 md:col-6 field mb-3">
            <label htmlFor="pricePerTurnHtg" className="font-bold">
              {t('game.price_per_turn_htg')}
            </label>
            <InputNumber
              id="pricePerTurnHtg"
              value={gameFormData.pricePerTurnHtg || 0}
              min={0}
              onValueChange={(e) => setGameFormData({ ...gameFormData, pricePerTurnHtg: e.value || 0 })}
            />
          </div>
          <div className="col-12 md:col-6 field mb-3">
            <label htmlFor="dailyBudgetLimit" className="font-bold">
              {t('game.daily_budget_total')}
            </label>
            <InputNumber
              id="dailyBudgetLimit"
              value={gameFormData.dailyBudgetLimit ?? 0}
              onValueChange={(e) => setGameFormData({ ...gameFormData, dailyBudgetLimit: e.value ?? 0 })}
            />
          </div>
        </div>
        <div className="field mb-3">
          <label htmlFor="description" className="font-bold">{t('game.description_label')}</label>
          <InputTextarea
            id="description"
            rows={2}
            value={gameFormData.description || ''}
            onChange={(e) => setGameFormData({ ...gameFormData, description: e.target.value })}
            placeholder={t('game.description_placeholder')}
          />
        </div>
        <div className="field mb-3">
          <label htmlFor="rulesText" className="font-bold">{t('game.rules_text_label')}</label>
          <InputTextarea
            id="rulesText"
            rows={3}
            value={gameFormData.rulesText || ''}
            onChange={(e) => setGameFormData({ ...gameFormData, rulesText: e.target.value })}
            placeholder={t('game.rules_text_placeholder')}
          />
        </div>
        <div className="field mb-3">
          <label htmlFor="status" className="font-bold">
            {t('common.status')}
          </label>
          <Dropdown
            id="status"
            value={gameFormData.status || CommonStatus.ACTIVE}
            options={statusOptions}
            onChange={(e) => setGameFormData({ ...gameFormData, status: e.value })}
          />
        </div>
        </div>
        <div className="flex justify-content-end gap-2 mt-4">
          <Button
            label={t('common.cancel')}
            icon="pi pi-times"
            outlined
            onClick={() => setShowGameDialog(false)}
            disabled={isSubmitting}
          />
          <Button
            label={t('common.save')}
            icon="pi pi-check"
            onClick={saveGame}
            loading={isSubmitting}
            disabled={isSubmitting}
          />
        </div>
      </Dialog>

      {/* ── DIALOG 4: DETAILED GAME PARAMETERS CONFIGURATION ── */}
      <Dialog
        visible={showParamsDialog}
        style={{ width: '650px' }}
        header={t('game.params_config_title', {
          name: paramsFormData.gameName || ''
        })}
        modal
        onHide={() => setShowParamsDialog(false)}
      >
        <div className="p-fluid">
        <div className="p-3 bg-blue-50 border-1 border-blue-200 border-round-xl mb-4 text-blue-900">
          <div className="flex align-items-center gap-2 mb-1">
            <i className="pi pi-info-circle text-blue-600 font-bold" />
            <span className="font-bold">{t('game.game_code_label')}: {paramsFormData.gameCode}</span>
          </div>
          <span className="text-xs">
            {t('game.params_note')}
          </span>
        </div>

        {/* Dynamic Parameter Fields Based On Game Category */}
        {paramsFormData.category === 'QUIZ' && (
          <div className="grid">
            <div className="col-12 md:col-6 field mb-3">
              <label htmlFor="quizQuestionCount" className="font-bold">{t('game.quiz_question_count_label')}</label>
              <InputNumber
                id="quizQuestionCount"
                value={paramsFormData.quizQuestionCount || 5}
                min={1}
                max={20}
                onValueChange={(e) => setParamsFormData({ ...paramsFormData, quizQuestionCount: e.value || 5 })}
              />
              <small className="text-500">{t('game.quiz_question_count_desc')}</small>
            </div>
            <div className="col-12 md:col-6 field mb-3">
              <label htmlFor="quizCountdownSec" className="font-bold">{t('game.quiz_countdown_label')}</label>
              <InputNumber
                id="quizCountdownSec"
                value={paramsFormData.quizCountdownSec || 20}
                min={5}
                max={60}
                onValueChange={(e) => setParamsFormData({ ...paramsFormData, quizCountdownSec: e.value || 20 })}
              />
              <small className="text-500">{t('game.quiz_countdown_desc')}</small>
            </div>
            <div className="col-12 field mb-3">
              <label htmlFor="quizRewardPoints" className="font-bold">{t('game.quiz_reward_points_label')}</label>
              <InputNumber
                id="quizRewardPoints"
                value={paramsFormData.quizRewardPoints || 150}
                min={10}
                onValueChange={(e) => setParamsFormData({ ...paramsFormData, quizRewardPoints: e.value || 150 })}
              />
            </div>
          </div>
        )}

        <div className="field mb-3 mt-3">
          <div className="flex align-items-center justify-content-between p-2 border-1 surface-border border-round">
            <span className="font-bold text-sm">{t('game.allow_points_spin_label')}</span>
            <InputSwitch
              checked={paramsFormData.allowPointsSpin ?? true}
              onChange={(e) => setParamsFormData({ ...paramsFormData, allowPointsSpin: e.value })}
            />
          </div>
        </div>
        </div>

        <div className="flex justify-content-end gap-2 mt-4">
          <Button
            label={t('common.cancel')}
            icon="pi pi-times"
            outlined
            onClick={() => setShowParamsDialog(false)}
            disabled={isSubmitting}
          />
          <Button
            label={t('common.save')}
            icon="pi pi-check"
            onClick={saveParamsConfig}
            loading={isSubmitting}
            disabled={isSubmitting}
          />
        </div>
      </Dialog>
    </div>
  );
};

export default GameManagementPage;
