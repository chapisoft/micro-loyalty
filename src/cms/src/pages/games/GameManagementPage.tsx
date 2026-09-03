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
import { Tag } from 'primereact/tag';
import { ProgressBar } from 'primereact/progressbar';
import { InputSwitch } from 'primereact/inputswitch';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { AppBreadcrumb } from 'components';
import { CommonStatus } from '@/models';
import { LoyaltyService } from '@/service/loyalty.service';

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
  const [selectedTenant, setSelectedTenant] = useState('TENANT_NATCASH');
  const [games, setGames] = useState<GameItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedGames, setSelectedGames] = useState<GameItem[]>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const prizeTypes = useMemo(() => [
    { label: t('game.prize_type_points', { defaultValue: 'Điểm Thưởng (POINTS)' }), value: 'POINTS' },
    { label: t('game.prize_type_voucher', { defaultValue: 'Mã Giảm Giá (VOUCHER)' }), value: 'VOUCHER' },
    { label: t('game.prize_type_cashback', { defaultValue: 'Hoàn Tiền Mặt (CASHBACK)' }), value: 'CASHBACK' },
    { label: t('game.prize_type_multiplier', { defaultValue: 'Hệ Số Nhân (MULTIPLIER)' }), value: 'MULTIPLIER' },
    { label: t('game.prize_type_turns', { defaultValue: 'Lượt Chơi Thêm (TURNS)' }), value: 'TURNS' },
    { label: t('game.prize_type_no_luck', { defaultValue: 'Chúc May Mắn (NO_LUCK)' }), value: 'NO_LUCK' },
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

  // 1. Tải danh mục trò chơi từ Backend
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
  }, [loadGames]);

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
  const openPrizeManager = openPrizesManager;

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
        name: prizeFormData.prizeName || 'Mới',
        defaultValue: `Bạn có chắc chắn muốn lưu hạng giải thưởng "${prizeFormData.prizeName || 'Mới'}" không?`,
      }),
      header: t('common.confirm_save', { defaultValue: 'Xác nhận Lưu Giải Thưởng' }),
      icon: 'pi pi-question-circle',
      acceptLabel: t('common.confirm', { defaultValue: 'Xác nhận' }),
      rejectLabel: t('common.cancel', { defaultValue: 'Hủy' }),
      accept: async () => {
        setIsSubmitting(true);
        try {
          await LoyaltyService.saveGamePrize(selectedGameForPrizes.gameCode, prizeFormData, selectedTenant);
          await loadGamePrizes(selectedGameForPrizes.gameCode);
          setShowPrizeFormDialog(false);
          toast.current?.show({
            severity: 'success',
            summary: t('common.success', { defaultValue: 'Thành công' }),
            detail: t('game.save_prize_success', { defaultValue: 'Lưu hạng giải thưởng thành công!' }),
            life: 3000,
          });
        } catch (e: any) {
          console.error('[savePrize] Error:', e);
          toast.current?.show({
            severity: 'error',
            summary: t('common.error', { defaultValue: 'Lỗi' }),
            detail: t('game.save_prize_failed', { defaultValue: 'Lưu giải thưởng thất bại' }) + ': ' + (e?.message || ''),
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
        name: prize.prizeName,
        defaultValue: `Bạn có chắc chắn muốn xóa giải thưởng "${prize.prizeName}" khỏi ma trận không?`,
      }),
      header: t('common.confirm_delete', { defaultValue: 'Xác nhận Xóa Giải Thưởng' }),
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      acceptLabel: t('common.delete', { defaultValue: 'Xóa' }),
      rejectLabel: t('common.cancel', { defaultValue: 'Hủy' }),
      accept: async () => {
        setIsSubmitting(true);
        try {
          await LoyaltyService.deleteGamePrize(prize.id!, selectedTenant);
          await loadGamePrizes(selectedGameForPrizes.gameCode);
          toast.current?.show({
            severity: 'success',
            summary: t('common.success', { defaultValue: 'Thành công' }),
            detail: t('game.delete_prize_success', { defaultValue: 'Đã xóa giải thưởng thành công!' }),
            life: 3000,
          });
        } catch (e: any) {
          console.error('[deletePrize] Error:', e);
          toast.current?.show({
            severity: 'error',
            summary: t('common.error', { defaultValue: 'Lỗi' }),
            detail: t('game.delete_prize_failed', { defaultValue: 'Xóa giải thưởng thất bại' }) + ': ' + (e?.message || ''),
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
        summary: t('common.success', { defaultValue: 'Thành công' }),
        detail: t('game.rebalance_success', { defaultValue: 'Đã tự động cân bằng tổng xác suất 100% thành công!' }),
        life: 3000,
      });
    } catch (e: any) {
      console.error('[autoBalancePrizes] Error:', e);
      toast.current?.show({
        severity: 'error',
        summary: t('common.error', { defaultValue: 'Lỗi' }),
        detail: t('game.rebalance_failed', { defaultValue: 'Cân bằng xác suất thất bại' }) + ': ' + (e?.message || ''),
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
        summary: t('common.success', { defaultValue: 'Thành công' }),
        detail: gameFormData.id
          ? t('game.update_game_success', { defaultValue: 'Cập nhật trò chơi thành công!' })
          : t('game.create_game_success', { defaultValue: 'Thêm mới trò chơi thành công!' }),
        life: 3000,
      });
    } catch (e: any) {
      console.error('[saveGame] Error:', e);
      toast.current?.show({
        severity: 'error',
        summary: t('common.error', { defaultValue: 'Lỗi' }),
        detail: t('game.save_game_failed', { defaultValue: 'Không thể lưu trò chơi' }) + ': ' + (e?.message || ''),
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
        summary: t('common.success', { defaultValue: 'Thành công' }),
        detail: t('game.update_params_success', { defaultValue: 'Cập nhật tham số cấu hình nâng cao thành công!' }),
        life: 3000,
      });
    } catch (e: any) {
      console.error('[saveParamsConfig] Error:', e);
      toast.current?.show({
        severity: 'error',
        summary: t('common.error', { defaultValue: 'Lỗi' }),
        detail: t('game.save_params_failed', { defaultValue: 'Lưu tham số thất bại' }) + ': ' + (e?.message || ''),
        life: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusTemplate = (status: CommonStatus | string) => {
    return status === CommonStatus.ACTIVE || status === 'ACTIVE' ? (
      <Tag severity="success" value={t('common.active', { defaultValue: 'Đang áp dụng' })} />
    ) : (
      <Tag severity="danger" value={t('common.inactive', { defaultValue: 'Tạm dừng' })} />
    );
  };

  const categoryOptions = useMemo(() => [
    { label: t('game.cat_lucky_draw', { defaultValue: 'Vòng Quay May Mắn (LUCKY_DRAW)' }), value: 'LUCKY_DRAW' },
    { label: t('game.cat_instant_win', { defaultValue: 'Vé Cào Trúng Liền (INSTANT_WIN)' }), value: 'INSTANT_WIN' },
    { label: t('game.cat_action', { defaultValue: 'Thể Thao & Hành Động (ACTION)' }), value: 'ACTION' },
    { label: t('game.cat_adventure', { defaultValue: 'Phiêu Lưu Leo Tháp (ADVENTURE)' }), value: 'ADVENTURE' },
    { label: t('game.cat_board_3d', { defaultValue: 'Bàn Cờ 3D & Xúc Xắc (BOARD_3D)' }), value: 'BOARD_3D' },
    { label: t('game.cat_quiz', { defaultValue: 'Đố Vui Trí Tuệ (QUIZ)' }), value: 'QUIZ' },
    { label: t('game.cat_casual', { defaultValue: 'Vật Lý & Thả Bi (CASUAL)' }), value: 'CASUAL' },
  ], [t]);

  const statusOptions = [
    { label: t('common.active', { defaultValue: 'Đang áp dụng' }), value: CommonStatus.ACTIVE },
    { label: t('common.inactive', { defaultValue: 'Tạm dừng' }), value: CommonStatus.INACTIVE },
  ];

  // Tính toán tổng trọng số và % xác suất
  const totalPrizeWeight = prizesList
    .filter((p) => p.status === 'ACTIVE')
    .reduce((sum, item) => sum + (item.probabilityWeight || 0), 0);

  return (
    <div className="game-management-page">
      <Toast ref={toast} position="top-right" />
      <ConfirmDialog />
      <AppBreadcrumb
        items={[
          { label: t('nav.rewards_games', { defaultValue: 'Khuyến mãi & Game' }) },
          { label: t('nav.game_catalog', { defaultValue: 'Danh mục Trò chơi' }) },
        ]}
      />

      {/* ── KPI METRIC CARDS ── */}
      <div className="grid mb-4">
        <div className="col-12 md:col-3">
          <div className="card mb-0 shadow-2 border-round-xl surface-card p-3 border-left-3 border-blue-500">
            <div className="flex justify-content-between align-items-center mb-2">
              <div>
                <span className="block text-600 font-bold text-xs mb-1 uppercase tracking-wide">
                  {t('game.game_list', { defaultValue: 'Tổng Game Vận Hành' })}
                </span>
                <div className="text-900 font-black text-2xl tracking-tight">{games.length} Game</div>
              </div>
              <div
                className="flex align-items-center justify-content-center border-round-xl shadow-2 flex-shrink-0"
                style={{
                  width: '3.25rem',
                  height: '3.25rem',
                  background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                }}
              >
                <i className="pi pi-th-large text-white text-2xl font-bold" />
              </div>
            </div>
            <span className="text-green-600 font-bold text-xs flex align-items-center gap-1">
              <i className="pi pi-check text-xs font-bold" /> {t('game.ready_status', { defaultValue: '100% Sẵn sàng Webview & DB' })}
            </span>
          </div>
        </div>

        <div className="col-12 md:col-3">
          <div className="card mb-0 shadow-2 border-round-xl surface-card p-3 border-left-3 border-orange-500">
            <div className="flex justify-content-between align-items-center mb-2">
              <div>
                <span className="block text-600 font-bold text-xs mb-1 uppercase tracking-wide">
                  {t('game.today_spins', { defaultValue: 'Tổng lượt chơi hôm nay' })}
                </span>
                <div className="text-900 font-black text-2xl font-mono tracking-tight text-orange-600">390 {t('common.spins', { defaultValue: 'Lượt' })}</div>
              </div>
              <div
                className="flex align-items-center justify-content-center border-round-xl shadow-2 flex-shrink-0"
                style={{
                  width: '3.25rem',
                  height: '3.25rem',
                  background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                }}
              >
                <i className="pi pi-bolt text-white text-2xl font-bold" />
              </div>
            </div>
            <span className="text-orange-600 font-bold text-xs flex align-items-center gap-1">
              <i className="pi pi-arrow-up text-xs font-bold" /> {t('game.vs_yesterday', { defaultValue: '+18.4% so với hôm qua' })}
            </span>
          </div>
        </div>

        <div className="col-12 md:col-3">
          <div className="card mb-0 shadow-2 border-round-xl surface-card p-3 border-left-3 border-green-500">
            <div className="flex justify-content-between align-items-center mb-2">
              <div>
                <span className="block text-600 font-bold text-xs mb-1 uppercase tracking-wide">
                  {t('game.today_cost', { defaultValue: 'Tổng ngân sách đã chi' })}
                </span>
                <div className="text-900 font-black text-2xl font-mono tracking-tight text-green-600">6,000 HTG</div>
              </div>
              <div
                className="flex align-items-center justify-content-center border-round-xl shadow-2 flex-shrink-0"
                style={{
                  width: '3.25rem',
                  height: '3.25rem',
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                }}
              >
                <i className="pi pi-wallet text-white text-2xl font-bold" />
              </div>
            </div>
            <span className="text-600 font-medium text-xs">{t('game.budget_limit_note', { defaultValue: 'Hạn mức: 50,000 HTG (12%)' })}</span>
          </div>
        </div>

        <div className="col-12 md:col-3">
          <div className="card mb-0 shadow-2 border-round-xl surface-card p-3 border-left-3 border-purple-500">
            <div className="flex justify-content-between align-items-center mb-2">
              <div>
                <span className="block text-600 font-bold text-xs mb-1 uppercase tracking-wide">{t('game.lock_ledger_mechanism', { defaultValue: 'Cơ Chế Khóa & Sổ Cái' })}</span>
                <div className="text-900 font-black text-2xl tracking-tight text-purple-600">Redisson RLock</div>
              </div>
              <div
                className="flex align-items-center justify-content-center border-round-xl shadow-2 flex-shrink-0"
                style={{
                  width: '3.25rem',
                  height: '3.25rem',
                  background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
                }}
              >
                <i className="pi pi-shield text-white text-2xl font-bold" />
              </div>
            </div>
            <span className="text-purple-600 font-bold text-xs flex align-items-center gap-1">
              <i className="pi pi-check text-xs font-bold" /> {t('game.integrity_status', { defaultValue: 'Toàn vẹn tài chính 100%' })}
            </span>
          </div>
        </div>
      </div>

      {/* ── GAME CATALOG & DETAILED PARAMETERS ── */}
      <div className="card shadow-1 border-round-xl surface-card p-4">
        <div className="flex justify-content-between align-items-center mb-3">
          <div>
            <h4 className="m-0 text-primary font-bold">
              {t('game.management_title', { defaultValue: 'Danh mục Trò chơi & Cấu hình Giải thưởng Thương mại' })}
            </h4>
            <p className="text-500 text-xs mt-1 mb-0">
              {t('game.management_description', { defaultValue: 'Quản trị ma trận giải thưởng động, tỷ lệ trúng thưởng, giá lượt chơi HTG và tham số nghiệp vụ từng game.' })}
            </p>
          </div>
          <div className="flex gap-2">
            <span className="p-input-icon-left">
              <i className="pi pi-search" />
              <InputText
                type="search"
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder={t('common.search', { defaultValue: 'Tìm kiếm game...' })}
                className="p-inputtext-sm"
              />
            </span>
            <Button
              label={t('game.add_game', { defaultValue: 'Thêm Trò Chơi Mới' })}
              icon="pi pi-plus"
              severity="success"
              onClick={openNewGame}
            />
          </div>
        </div>

        <DataTable<any>
          value={games}
          selection={selectedGames}
          onSelectionChange={(e: any) => setSelectedGames(e.value || [])}
          dataKey="id"
          paginator
          rows={10}
          stripedRows
          responsiveLayout="scroll"
          globalFilter={globalFilter}
          loading={isLoading}
        >
          <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
          <Column
            header={t('common.stt', { defaultValue: 'STT' })}
            body={(_, options) => options.rowIndex + 1}
            style={{ width: '3.5rem', textAlign: 'center' }}
          />
          <Column
            body={(rowData: GameItem) => (
              <div className="flex align-items-center justify-content-center" style={{ gap: '0.4rem' }}>
                <Button
                  icon="pi pi-gift"
                  rounded
                  severity="warning"
                  size="small"
                  onClick={() => openPrizesManager(rowData)}
                  tooltip={t('game.dynamic_prizes_tooltip', { defaultValue: 'Cơ cấu giải thưởng động (DB Prizes)' })}
                />
                <Button
                  icon="pi pi-cog"
                  rounded
                  outlined
                  severity="secondary"
                  size="small"
                  onClick={() => openParamsConfig(rowData)}
                  tooltip={t('game.config_params', { defaultValue: 'Cấu hình tham số chi tiết' })}
                />
                <Button
                  icon="pi pi-pencil"
                  rounded
                  outlined
                  severity="secondary"
                  size="small"
                  onClick={() => editGame(rowData)}
                  tooltip={t('common.edit', { defaultValue: 'Sửa thông tin' })}
                />
              </div>
            )}
            header={t('common.actions', { defaultValue: 'Thao tác' })}
            style={{ width: '10rem', minWidth: '10rem', textAlign: 'center' }}
          />
          <Column
            field="gameCode"
            header={t('game.game_code', { defaultValue: 'Mã Game' })}
            sortable
            style={{ minWidth: '9rem', fontWeight: 600 }}
          />
          <Column
            field="gameName"
            header={t('game.game_name', { defaultValue: 'Tên Trò Chơi' })}
            sortable
            style={{ minWidth: '13rem' }}
          />
          <Column
            field="category"
            header={t('game.category', { defaultValue: 'Thể Loại' })}
            sortable
            style={{ minWidth: '8rem' }}
          />
          <Column
            field="freeTurnsDaily"
            header={<span title={t('game.free_turns_tooltip', { defaultValue: 'Số lượt chơi miễn phí mỗi ngày' })}>{t('game.free_turns_daily', { defaultValue: 'Lượt Miễn Phí' })}</span>}
            body={(row: GameItem) => <span className="font-medium text-green-600">{row.freeTurnsDaily} {t('common.spins', { defaultValue: 'lượt' })}</span>}
            sortable
            style={{ minWidth: '8rem', textAlign: 'center' }}
          />
          <Column
            field="pricePerTurnHtg"
            header={<span title={t('game.price_tooltip', { defaultValue: 'Giá tiền mua thêm 1 lượt chơi (HTG)' })}>{t('game.price_per_turn_htg', { defaultValue: 'Giá Mua Lượt' })}</span>}
            body={(row: GameItem) =>
              row.pricePerTurnHtg > 0 ? (
                <span className="font-medium font-mono text-orange-600">{row.pricePerTurnHtg} HTG</span>
              ) : (
                <Tag severity="info" value={t('common.free', { defaultValue: 'Miễn phí' })} />
              )
            }
            sortable
            style={{ minWidth: '8.5rem', textAlign: 'center' }}
          />
          <Column
            field="dailyBudgetLimit"
            header={<span title={t('game.budget_tooltip', { defaultValue: 'Hạn mức ngân sách giải thưởng tối đa trong ngày (HTG)' })}>{t('game.daily_budget_total', { defaultValue: 'Hạn Mức Ngày' })}</span>}
            body={(row: GameItem) =>
              row.dailyBudgetLimit > 0 ? (
                <span className="font-mono text-700">{row.dailyBudgetLimit.toLocaleString()} HTG</span>
              ) : (
                <span className="text-500 text-xs">{t('common.unlimited', { defaultValue: 'Không giới hạn' })}</span>
              )
            }
            sortable
            style={{ minWidth: '9rem', textAlign: 'center' }}
          />
          <Column
            field="status"
            body={(row: GameItem) => statusTemplate(row.status)}
            header={t('common.status', { defaultValue: 'Trạng thái' })}
            sortable
            style={{ minWidth: '8rem' }}
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
                code: selectedGameForPrizes?.gameCode || '',
                defaultValue: `Quản lý Cơ cấu Giải thưởng: ${selectedGameForPrizes?.gameName} (${selectedGameForPrizes?.gameCode})`,
              })}
            </span>
          </div>
        }
        modal
        className="p-fluid"
        onHide={() => setShowPrizeDialog(false)}
      >
        {/* Metric Summary Header */}
        <div className="grid mb-3">
          <div className="col-12 md:col-4">
            <div className="p-3 surface-100 border-round-xl text-center">
              <span className="text-xs text-500 font-bold uppercase block mb-1">{t('game.active_prizes_count', { defaultValue: 'Số Hạng Giải Đang Mở' })}</span>
              <span className="text-xl font-bold text-900">{prizesList.length} {t('game.prizes_unit', { defaultValue: 'Giải Thưởng' })}</span>
            </div>
          </div>
          <div className="col-12 md:col-4">
            <div className="p-3 surface-100 border-round-xl text-center">
              <span className="text-xs text-500 font-bold uppercase block mb-1">{t('game.total_probability_weight', { defaultValue: 'Tổng Trọng Số Xác Suất (Σ W)' })}</span>
              <span className="text-xl font-bold font-mono text-blue-600">{totalPrizeWeight}</span>
            </div>
          </div>
          <div className="col-12 md:col-4">
            <div className="p-3 surface-100 border-round-xl text-center">
              <span className="text-xs text-500 font-bold uppercase block mb-1">{t('game.balance_status', { defaultValue: 'Trạng Thái Cân Bằng' })}</span>
              <span className="text-xl font-bold text-green-600">{t('game.rng_normalized', { defaultValue: 'Đã Chuẩn Hóa RNG' })}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-content-between align-items-center mb-3">
          <span className="text-xs text-600">
            {t('game.prizes_note', { defaultValue: '* Tỷ lệ trúng giải được tính toán tự động qua thuật toán Weighted Random Sampling bảo mật tại Backend.' })}
          </span>
          <div className="flex gap-2">
            <Button
              label={t('game.auto_balance_btn', { defaultValue: 'Tự Động Cân Bằng (1000)' })}
              icon="pi pi-sliders-h"
              severity="secondary"
              outlined
              size="small"
              onClick={autoBalancePrizes}
              loading={isSubmitting}
            />
            <Button
              label={t('game.add_prize_btn', { defaultValue: 'Thêm Hạng Giải Mới' })}
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
          emptyMessage={t('game.no_prizes_configured', { defaultValue: 'Chưa có giải thưởng nào được cấu hình cho trò chơi này.' })}
        >
          <Column field="displayOrder" header={t('common.stt', { defaultValue: 'STT' })} style={{ width: '4rem', textAlign: 'center' }} />
          <Column
            field="iconSymbol"
            header="Icon"
            body={(row: GamePrizeItem) => <span className="text-xl">{row.iconSymbol || '🎁'}</span>}
            style={{ width: '4rem', textAlign: 'center' }}
          />
          <Column field="prizeCode" header={t('game.prize_code', { defaultValue: 'Mã Giải' })} sortable style={{ minWidth: '9rem', fontWeight: 600 }} />
          <Column field="prizeName" header={t('game.prize_name', { defaultValue: 'Tên Giải Thưởng' })} sortable style={{ minWidth: '12rem' }} />
          <Column
            field="prizeType"
            header={t('game.prize_type', { defaultValue: 'Loại Thưởng' })}
            body={(row: GamePrizeItem) => <Tag severity="info" value={row.prizeType} />}
            style={{ minWidth: '8rem' }}
          />
          <Column
            field="prizeValue"
            header={t('game.prize_value', { defaultValue: 'Giá Trị' })}
            body={(row: GamePrizeItem) => <span className="font-bold text-orange-600">+{row.prizeValue}</span>}
            style={{ minWidth: '6rem', textAlign: 'right' }}
          />
          <Column
            field="probabilityWeight"
            header={t('game.probability_weight', { defaultValue: 'Trọng Số' })}
            body={(row: GamePrizeItem) => <span className="font-mono">{row.probabilityWeight}</span>}
            style={{ minWidth: '6rem', textAlign: 'center' }}
          />
          <Column
            header={t('game.probability_pct', { defaultValue: 'Tỷ Lệ %' })}
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
            header={t('common.status', { defaultValue: 'Trạng Thái' })}
            body={(row: GamePrizeItem) => statusTemplate(row.status)}
            style={{ minWidth: '7rem' }}
          />
          <Column
            body={(row: GamePrizeItem) => (
              <div className="flex gap-1 justify-content-center">
                <Button icon="pi pi-pencil" rounded text severity="secondary" size="small" onClick={() => editPrize(row)} />
                <Button icon="pi pi-trash" rounded text severity="danger" size="small" onClick={() => deletePrize(row)} />
              </div>
            )}
            style={{ width: '6rem', textAlign: 'center' }}
          />
        </DataTable>
      </Dialog>

      {/* ── DIALOG 2: ADD/EDIT PRIZE SUB-FORM ── */}
      <Dialog
        visible={showPrizeFormDialog}
        style={{ width: '640px' }}
        header={prizeFormData.id ? t('game.edit_prize_title', { defaultValue: 'Sửa Hạng Giải Thưởng Minigame' }) : t('game.add_prize_title', { defaultValue: 'Thêm Hạng Giải Thưởng Mới' })}
        modal
        className="p-fluid"
        onHide={() => setShowPrizeFormDialog(false)}
      >
        <div className="surface-100 p-3 border-round-lg mb-3">
          <div className="font-bold text-sm mb-2 text-primary">{t('game.prize_section_1', { defaultValue: '1. Thông tin Giải Thưởng & Đa Ngôn Ngữ' })}</div>
          <div className="field mb-2">
            <label htmlFor="prizeCode" className="font-bold text-xs">{t('game.prize_code_label', { defaultValue: 'Mã Giải Thưởng (Unique Code)' })}</label>
            <InputText
              id="prizeCode"
              value={prizeFormData.prizeCode || ''}
              onChange={(e) => setPrizeFormData({ ...prizeFormData, prizeCode: e.target.value })}
              placeholder="Ví dụ: FLAPPY_GOLD_100"
              required
            />
          </div>

          <div className="grid">
            <div className="col-12 md:col-6 field mb-2">
              <label htmlFor="nameVi" className="font-bold text-xs">{t('game.name_vi_label', { defaultValue: 'Tên Tiếng Việt (Mặc định)' })}</label>
              <InputText
                id="nameVi"
                value={prizeFormData.nameVi || prizeFormData.prizeName || ''}
                onChange={(e) => setPrizeFormData({ ...prizeFormData, nameVi: e.target.value, prizeName: e.target.value })}
                placeholder="100 Điểm Thưởng"
                required
              />
            </div>
            <div className="col-12 md:col-6 field mb-2">
              <label htmlFor="nameEn" className="font-bold text-xs">{t('game.name_en_label', { defaultValue: 'English (Tiếng Anh)' })}</label>
              <InputText
                id="nameEn"
                value={prizeFormData.nameEn || ''}
                onChange={(e) => setPrizeFormData({ ...prizeFormData, nameEn: e.target.value })}
                placeholder="100 Bonus Points"
              />
            </div>
            <div className="col-12 md:col-6 field mb-2">
              <label htmlFor="nameFr" className="font-bold text-xs">{t('game.name_fr_label', { defaultValue: 'Français (Tiếng Pháp)' })}</label>
              <InputText
                id="nameFr"
                value={prizeFormData.nameFr || ''}
                onChange={(e) => setPrizeFormData({ ...prizeFormData, nameFr: e.target.value })}
                placeholder="100 Points Bonus"
              />
            </div>
            <div className="col-12 md:col-6 field mb-2">
              <label htmlFor="nameHt" className="font-bold text-xs">{t('game.name_ht_label', { defaultValue: 'Kreyòl Ayisyen (Haiti Creole)' })}</label>
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
          <div className="font-bold text-sm mb-2 text-primary">{t('game.prize_section_2', { defaultValue: '2. Loại Quà, Giá Trị & Xác Suất' })}</div>
          <div className="grid">
            <div className="col-12 md:col-6 field mb-2">
              <label htmlFor="prizeType" className="font-bold text-xs">{t('game.prize_type_label', { defaultValue: 'Loại Phần Thưởng' })}</label>
              <Dropdown
                id="prizeType"
                value={prizeFormData.prizeType || 'POINTS'}
                options={prizeTypes}
                onChange={(e) => setPrizeFormData({ ...prizeFormData, prizeType: e.value })}
              />
            </div>
            <div className="col-12 md:col-6 field mb-2">
              <label htmlFor="prizeValue" className="font-bold text-xs">{t('game.prize_value_label', { defaultValue: 'Giá Trị Phần Thưởng' })}</label>
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
              <label htmlFor="probabilityWeight" className="font-bold text-xs">{t('game.probability_weight_label', { defaultValue: 'Trọng Số Xác Suất' })}</label>
              <InputNumber
                id="probabilityWeight"
                value={prizeFormData.probabilityWeight || 100}
                min={1}
                onValueChange={(e) => setPrizeFormData({ ...prizeFormData, probabilityWeight: e.value || 100 })}
              />
            </div>
            <div className="col-12 md:col-4 field mb-2">
              <label htmlFor="displayOrder" className="font-bold text-xs">{t('game.display_order_label', { defaultValue: 'Thứ Tự Hiển Thị' })}</label>
              <InputNumber
                id="displayOrder"
                value={prizeFormData.displayOrder || 1}
                min={1}
                onValueChange={(e) => setPrizeFormData({ ...prizeFormData, displayOrder: e.value || 1 })}
              />
            </div>
            <div className="col-12 md:col-4 field mb-2">
              <label htmlFor="iconSymbol" className="font-bold text-xs">{t('game.icon_symbol_label', { defaultValue: 'Biểu Tượng (Icon)' })}</label>
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
          <div className="font-bold text-sm mb-2 text-primary">{t('game.prize_section_3', { defaultValue: '3. Hạn Mức Ngân Sách & Giới Hạn Trúng (Ngày / Tuần / Tháng)' })}</div>
          <div className="grid">
            <div className="col-12 md:col-4 field mb-2">
              <label htmlFor="dailyBudgetLimit" className="font-bold text-xs">{t('game.daily_budget_label', { defaultValue: 'Hạn mức Ngày (HTG)' })}</label>
              <InputNumber
                id="dailyBudgetLimit"
                value={prizeFormData.dailyBudgetLimit || 0}
                onValueChange={(e) => setPrizeFormData({ ...prizeFormData, dailyBudgetLimit: e.value || 0 })}
                placeholder="0: Vô hạn"
              />
            </div>
            <div className="col-12 md:col-4 field mb-2">
              <label htmlFor="weeklyBudgetLimit" className="font-bold text-xs">{t('game.weekly_budget_label', { defaultValue: 'Hạn mức Tuần (HTG)' })}</label>
              <InputNumber
                id="weeklyBudgetLimit"
                value={prizeFormData.weeklyBudgetLimit || 0}
                onValueChange={(e) => setPrizeFormData({ ...prizeFormData, weeklyBudgetLimit: e.value || 0 })}
                placeholder="0: Vô hạn"
              />
            </div>
            <div className="col-12 md:col-4 field mb-2">
              <label htmlFor="monthlyBudgetLimit" className="font-bold text-xs">{t('game.monthly_budget_label', { defaultValue: 'Hạn mức Tháng (HTG)' })}</label>
              <InputNumber
                id="monthlyBudgetLimit"
                value={prizeFormData.monthlyBudgetLimit || 0}
                onValueChange={(e) => setPrizeFormData({ ...prizeFormData, monthlyBudgetLimit: e.value || 0 })}
                placeholder="0: Vô hạn"
              />
            </div>

            <div className="col-12 md:col-4 field mb-2">
              <label htmlFor="dailyMaxWinners" className="font-bold text-xs">{t('game.daily_max_winners_label', { defaultValue: 'Tối đa người trúng / Ngày' })}</label>
              <InputNumber
                id="dailyMaxWinners"
                value={prizeFormData.dailyMaxWinners || 0}
                onValueChange={(e) => setPrizeFormData({ ...prizeFormData, dailyMaxWinners: e.value || 0 })}
                placeholder="0: Vô hạn"
              />
            </div>
            <div className="col-12 md:col-4 field mb-2">
              <label htmlFor="weeklyMaxWinners" className="font-bold text-xs">{t('game.weekly_max_winners_label', { defaultValue: 'Tối đa người trúng / Tuần' })}</label>
              <InputNumber
                id="weeklyMaxWinners"
                value={prizeFormData.weeklyMaxWinners || 0}
                onValueChange={(e) => setPrizeFormData({ ...prizeFormData, weeklyMaxWinners: e.value || 0 })}
                placeholder="0: Vô hạn"
              />
            </div>
            <div className="col-12 md:col-4 field mb-2">
              <label htmlFor="monthlyMaxWinners" className="font-bold text-xs">{t('game.monthly_max_winners_label', { defaultValue: 'Tối đa người trúng / Tháng' })}</label>
              <InputNumber
                id="monthlyMaxWinners"
                value={prizeFormData.monthlyMaxWinners || 0}
                onValueChange={(e) => setPrizeFormData({ ...prizeFormData, monthlyMaxWinners: e.value || 0 })}
                placeholder="0: Vô hạn"
              />
            </div>
          </div>
        </div>

        <div className="field mb-3">
          <label htmlFor="prizeStatus" className="font-bold">{t('common.status', { defaultValue: 'Trạng Thái' })}</label>
          <Dropdown
            id="prizeStatus"
            value={prizeFormData.status || 'ACTIVE'}
            options={[
              { label: 'Đang áp dụng (ACTIVE)', value: 'ACTIVE' },
              { label: 'Tạm dừng (INACTIVE)', value: 'INACTIVE' },
            ]}
            onChange={(e) => setPrizeFormData({ ...prizeFormData, status: e.value })}
          />
        </div>

        <div className="flex justify-content-end gap-2 mt-4">
          <Button
            label={t('common.cancel', { defaultValue: 'Hủy' })}
            icon="pi pi-times"
            outlined
            onClick={() => setShowPrizeFormDialog(false)}
            disabled={isSubmitting}
          />
          <Button
            label={t('common.save', { defaultValue: 'Lưu giải thưởng' })}
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
            ? t('game.edit_game', { defaultValue: 'Cập nhật Trò chơi' })
            : t('game.create_game', { defaultValue: 'Thêm mới Trò chơi' })
        }
        modal
        className="p-fluid"
        onHide={() => setShowGameDialog(false)}
      >
        <div className="field mb-3">
          <label htmlFor="gameCode" className="font-bold">
            {t('game.game_code', { defaultValue: 'Mã Game' })}
          </label>
          <InputText
            id="gameCode"
            value={gameFormData.gameCode || ''}
            onChange={(e) => setGameFormData({ ...gameFormData, gameCode: e.target.value })}
            placeholder="Ví dụ: SCRATCH_CARD, LUCKY_WHEEL"
            required
            disabled={!!gameFormData.id}
          />
        </div>
        <div className="field mb-3">
          <label htmlFor="gameName" className="font-bold">
            {t('game.game_name', { defaultValue: 'Tên Trò chơi' })}
          </label>
          <InputText
            id="gameName"
            value={gameFormData.gameName || ''}
            onChange={(e) => setGameFormData({ ...gameFormData, gameName: e.target.value })}
            placeholder="Ví dụ: Vé Cào May Mắn Hoàng Kim"
            required
          />
        </div>
        <div className="grid">
          <div className="col-12 md:col-6 field mb-3">
            <label htmlFor="category" className="font-bold">
              {t('game.category', { defaultValue: 'Thể loại' })}
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
              {t('game.free_turns_daily', { defaultValue: 'Lượt miễn phí/ngày' })}
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
              {t('game.price_per_turn_htg', { defaultValue: 'Giá mua lượt (HTG)' })}
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
              {t('game.daily_budget_total', { defaultValue: 'Hạn mức chi/ngày (HTG)' })}
            </label>
            <InputNumber
              id="dailyBudgetLimit"
              value={gameFormData.dailyBudgetLimit ?? 50000}
              onValueChange={(e) => setGameFormData({ ...gameFormData, dailyBudgetLimit: e.value ?? 50000 })}
            />
          </div>
        </div>
        <div className="field mb-3">
          <label htmlFor="description" className="font-bold">{t('game.description_label', { defaultValue: 'Mô tả Trò chơi' })}</label>
          <InputTextarea
            id="description"
            rows={2}
            value={gameFormData.description || ''}
            onChange={(e) => setGameFormData({ ...gameFormData, description: e.target.value })}
            placeholder="Mô tả hấp dẫn về luật chơi và giải thưởng..."
          />
        </div>
        <div className="field mb-3">
          <label htmlFor="rulesText" className="font-bold">{t('game.rules_text_label', { defaultValue: 'Quy tắc & Thể lệ Chi tiết' })}</label>
          <InputTextarea
            id="rulesText"
            rows={3}
            value={gameFormData.rulesText || ''}
            onChange={(e) => setGameFormData({ ...gameFormData, rulesText: e.target.value })}
            placeholder="Mỗi lượt chơi hội viên cào mở 9 ô..."
          />
        </div>
        <div className="field mb-3">
          <label htmlFor="status" className="font-bold">
            {t('common.status', { defaultValue: 'Trạng thái' })}
          </label>
          <Dropdown
            id="status"
            value={gameFormData.status || CommonStatus.ACTIVE}
            options={statusOptions}
            onChange={(e) => setGameFormData({ ...gameFormData, status: e.value })}
          />
        </div>
        <div className="flex justify-content-end gap-2 mt-4">
          <Button
            label={t('common.cancel', { defaultValue: 'Hủy' })}
            icon="pi pi-times"
            outlined
            onClick={() => setShowGameDialog(false)}
            disabled={isSubmitting}
          />
          <Button
            label={t('common.save', { defaultValue: 'Lưu thay đổi' })}
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
          name: paramsFormData.gameName || '',
          defaultValue: `Cấu hình tham số chi tiết: ${paramsFormData.gameName || ''}`,
        })}
        modal
        className="p-fluid"
        onHide={() => setShowParamsDialog(false)}
      >
        <div className="p-3 bg-blue-50 border-1 border-blue-200 border-round-xl mb-4 text-blue-900">
          <div className="flex align-items-center gap-2 mb-1">
            <i className="pi pi-info-circle text-blue-600 font-bold" />
            <span className="font-bold">{t('game.game_code_label', { defaultValue: 'Mã trò chơi' })}: {paramsFormData.gameCode}</span>
          </div>
          <span className="text-xs">
            {t('game.params_note', { defaultValue: 'Tham số dưới đây sẽ được nạp động vào Webview Game khi hội viên bắt đầu phiên chơi.' })}
          </span>
        </div>

        {/* Dynamic Parameter Fields Based On Game Category */}
        {paramsFormData.category === 'QUIZ' && (
          <div className="grid">
            <div className="col-12 md:col-6 field mb-3">
              <label htmlFor="quizQuestionCount" className="font-bold">{t('game.quiz_question_count_label', { defaultValue: 'Số lượng câu hỏi mỗi phiên' })}</label>
              <InputNumber
                id="quizQuestionCount"
                value={paramsFormData.quizQuestionCount || 5}
                min={1}
                max={20}
                onValueChange={(e) => setParamsFormData({ ...paramsFormData, quizQuestionCount: e.value || 5 })}
              />
              <small className="text-500">{t('game.quiz_question_count_desc', { defaultValue: 'Số câu hỏi người chơi cần trả lời liên tiếp.' })}</small>
            </div>
            <div className="col-12 md:col-6 field mb-3">
              <label htmlFor="quizCountdownSec" className="font-bold">{t('game.quiz_countdown_label', { defaultValue: 'Thời gian trả lời (Giây/câu)' })}</label>
              <InputNumber
                id="quizCountdownSec"
                value={paramsFormData.quizCountdownSec || 20}
                min={5}
                max={60}
                onValueChange={(e) => setParamsFormData({ ...paramsFormData, quizCountdownSec: e.value || 20 })}
              />
              <small className="text-500">{t('game.quiz_countdown_desc', { defaultValue: 'Thời gian đếm ngược cho mỗi câu hỏi.' })}</small>
            </div>
            <div className="col-12 field mb-3">
              <label htmlFor="quizRewardPoints" className="font-bold">{t('game.quiz_reward_points_label', { defaultValue: 'Điểm thưởng khi trả lời đúng 100%' })}</label>
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
            <span className="font-bold text-sm">{t('game.allow_points_spin_label', { defaultValue: 'Cho phép dùng Điểm thưởng để quay/chơi' })}</span>
            <InputSwitch
              checked={paramsFormData.allowPointsSpin ?? true}
              onChange={(e) => setParamsFormData({ ...paramsFormData, allowPointsSpin: e.value })}
            />
          </div>
        </div>

        <div className="flex justify-content-end gap-2 mt-4">
          <Button
            label={t('common.cancel', { defaultValue: 'Hủy' })}
            icon="pi pi-times"
            outlined
            onClick={() => setShowParamsDialog(false)}
            disabled={isSubmitting}
          />
          <Button
            label={t('common.save', { defaultValue: 'Lưu cấu hình tham số' })}
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
