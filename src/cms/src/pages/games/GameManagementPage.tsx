import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { InputSwitch } from 'primereact/inputswitch';
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

export const GameManagementPage: React.FC = () => {
  const { t } = useTranslation();
  const [selectedTenant, setSelectedTenant] = useState('TENANT_NATCASH');
  const [games, setGames] = useState<GameItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedGames, setSelectedGames] = useState<GameItem[]>([]);
  const [showGameDialog, setShowGameDialog] = useState(false);
  const [showParamsDialog, setShowParamsDialog] = useState(false);
  const [gameFormData, setGameFormData] = useState<Partial<GameItem>>({});
  const [paramsFormData, setParamsFormData] = useState<Partial<GameItem>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [globalFilter, setGlobalFilter] = useState('');

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

  const openNewGame = () => {
    setGameFormData({
      gameCode: '',
      gameName: '',
      category: 'LUCKY_DRAW',
      pricePerTurn: 10,
      pricePerTurnHtg: 10,
      freeTurnsDaily: 1,
      dailyBudgetLimit: 20000,
      allowPointsSpin: true,
      gameUrl: '',
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
    } catch (e) {
      console.error('[saveGame] Error:', e);
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
    } catch (e) {
      console.error('[saveParamsConfig] Error:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusTemplate = (status: CommonStatus) => {
    return status === CommonStatus.ACTIVE ? (
      <Tag severity="success" value={t('common.active', { defaultValue: 'Đang áp dụng' })} />
    ) : (
      <Tag severity="danger" value={t('common.inactive', { defaultValue: 'Tạm dừng' })} />
    );
  };

  const categoryOptions = [
    { label: 'Vòng Quay May Mắn (LUCKY_DRAW)', value: 'LUCKY_DRAW' },
    { label: 'Đố Vui Trí Tuệ (QUIZ)', value: 'QUIZ' },
    { label: 'Nông Trại Trồng Trọt (FARM)', value: 'FARM' },
    { label: 'Lắc Xí Ngầu (DICE)', value: 'DICE' },
    { label: 'Đập Trứng Vàng (EGG_TAP)', value: 'EGG_TAP' },
    { label: 'Lật Hình Trí Nhớ (MEMORY_CARD)', value: 'MEMORY_CARD' },
  ];

  const statusOptions = [
    { label: t('common.active', { defaultValue: 'Đang áp dụng' }), value: CommonStatus.ACTIVE },
    { label: t('common.inactive', { defaultValue: 'Tạm dừng' }), value: CommonStatus.INACTIVE },
  ];

  return (
    <div className="game-management-page">
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
                <span className="block text-600 font-bold text-xs mb-1 uppercase tracking-wide">{t('game.game_list', { defaultValue: 'Tổng Game Vận Hành' })}</span>
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
              <i className="pi pi-check text-xs font-bold" /> 100% Sẵn sàng Webview
            </span>
          </div>
        </div>

        <div className="col-12 md:col-3">
          <div className="card mb-0 shadow-2 border-round-xl surface-card p-3 border-left-3 border-orange-500">
            <div className="flex justify-content-between align-items-center mb-2">
              <div>
                <span className="block text-600 font-bold text-xs mb-1 uppercase tracking-wide">{t('game.today_spins', { defaultValue: 'Tổng lượt chơi hôm nay' })}</span>
                <div className="text-900 font-black text-2xl font-mono tracking-tight text-orange-600">390 Lượt</div>
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
              <i className="pi pi-arrow-up text-xs font-bold" /> +18.4% so với hôm qua
            </span>
          </div>
        </div>

        <div className="col-12 md:col-3">
          <div className="card mb-0 shadow-2 border-round-xl surface-card p-3 border-left-3 border-green-500">
            <div className="flex justify-content-between align-items-center mb-2">
              <div>
                <span className="block text-600 font-bold text-xs mb-1 uppercase tracking-wide">{t('game.today_cost', { defaultValue: 'Tổng ngân sách đã chi' })}</span>
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
            <span className="text-600 font-medium text-xs">Hạn mức: 50,000 HTG (12%)</span>
          </div>
        </div>

        <div className="col-12 md:col-3">
          <div className="card mb-0 shadow-2 border-round-xl surface-card p-3 border-left-3 border-purple-500">
            <div className="flex justify-content-between align-items-center mb-2">
              <div>
                <span className="block text-600 font-bold text-xs mb-1 uppercase tracking-wide">Trạng Thái Đồng Bộ</span>
                <div className="text-900 font-black text-2xl tracking-tight text-purple-600">Hoạt Động Tốt</div>
              </div>
              <div
                className="flex align-items-center justify-content-center border-round-xl shadow-2 flex-shrink-0"
                style={{
                  width: '3.25rem',
                  height: '3.25rem',
                  background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
                }}
              >
                <i className="pi pi-mobile text-white text-2xl font-bold" />
              </div>
            </div>
            <span className="text-purple-600 font-bold text-xs flex align-items-center gap-1">
              <i className="pi pi-check text-xs font-bold" /> Natcash App Bridge sẵn sàng
            </span>
          </div>
        </div>
      </div>

      {/* ── GAME CATALOG & DETAILED PARAMETERS ── */}
      <div className="card shadow-1 border-round-xl surface-card p-4">
        <div className="flex justify-content-between align-items-center mb-3">
          <div>
            <h4 className="m-0 text-primary font-bold">{t('game.management_title', { defaultValue: 'Danh mục Trò chơi & Tham số Chi tiết' })}</h4>
            <p className="text-500 text-xs mt-1 mb-0">Quản trị danh sách các trò chơi minigame, giá lượt chơi HTG, lượt miễn phí và tham số nghiệp vụ từng game.</p>
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
            <Button label={t('game.add_game', { defaultValue: 'Thêm Trò Chơi Mới' })} icon="pi pi-plus" severity="success" onClick={openNewGame} />
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
        >
          <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
          <Column header={t('common.stt', { defaultValue: 'STT' })} body={(_, options) => options.rowIndex + 1} style={{ width: '3.5rem', textAlign: 'center' }} />
          <Column
            body={(rowData: GameItem) => (
              <div className="flex align-items-center justify-content-center" style={{ gap: '0.5rem' }}>
                <Button icon="pi pi-cog" rounded outlined severity="secondary" size="small" onClick={() => openParamsConfig(rowData)} tooltip={t('game.config_params', { defaultValue: 'Cấu hình tham số chi tiết' })} />
                <Button icon="pi pi-pencil" rounded outlined severity="secondary" size="small" onClick={() => editGame(rowData)} tooltip={t('common.edit', { defaultValue: 'Sửa thông tin' })} />
              </div>
            )}
            header={t('common.actions', { defaultValue: 'Thao tác' })}
            style={{ width: '7.5rem', minWidth: '7.5rem', textAlign: 'center' }}
          />
          <Column field="gameCode" header={t('game.game_code', { defaultValue: 'Mã Game' })} sortable style={{ minWidth: '10rem', fontWeight: 600 }} />
          <Column field="gameName" header={t('game.game_name', { defaultValue: 'Tên Trò chơi' })} sortable style={{ minWidth: '16rem' }} />
          <Column field="category" header={t('game.category', { defaultValue: 'Thể loại' })} sortable style={{ minWidth: '8rem' }} />
          <Column field="freeTurnsDaily" header={t('game.free_turns_daily', { defaultValue: 'Lượt miễn phí/ngày' })} body={(row: GameItem) => <span className="font-bold text-green-600">{row.freeTurnsDaily} lượt</span>} sortable style={{ minWidth: '10rem', textAlign: 'center' }} />
          <Column field="pricePerTurnHtg" header={t('game.price_per_turn_htg', { defaultValue: 'Giá mua lượt (HTG)' })} body={(row: GameItem) => row.pricePerTurnHtg > 0 ? <span className="font-bold font-mono text-orange-600">{row.pricePerTurnHtg} HTG</span> : <Tag severity="info" value="Miễn phí" />} sortable style={{ minWidth: '10rem', textAlign: 'center' }} />
          <Column field="dailyBudgetLimit" header={t('game.daily_budget_total', { defaultValue: 'Hạn mức ngày (HTG)' })} body={(row: GameItem) => row.dailyBudgetLimit > 0 ? <span className="font-mono">{row.dailyBudgetLimit.toLocaleString()} HTG</span> : 'Không giới hạn'} sortable style={{ minWidth: '11rem' }} />
          <Column field="status" body={(row: GameItem) => statusTemplate(row.status)} header={t('common.status', { defaultValue: 'Trạng thái' })} sortable style={{ minWidth: '8rem' }} />
        </DataTable>
      </div>

      {/* ── DIALOG 1: GAME CREATION & BASIC INFO ── */}
      <Dialog
        visible={showGameDialog}
        style={{ width: '550px' }}
        header={gameFormData.id ? t('game.edit_game', { defaultValue: 'Cập nhật Trò chơi' }) : t('game.create_game', { defaultValue: 'Thêm mới Trò chơi' })}
        modal
        className="p-fluid"
        onHide={() => setShowGameDialog(false)}
      >
        <div className="field mb-3">
          <label htmlFor="gameCode" className="font-bold">{t('game.game_code', { defaultValue: 'Mã Game' })}</label>
          <InputText id="gameCode" value={gameFormData.gameCode || ''} onChange={(e) => setGameFormData({ ...gameFormData, gameCode: e.target.value })} placeholder="Ví dụ: LUCKY_WHEEL_2026" required disabled={!!gameFormData.id} />
        </div>
        <div className="field mb-3">
          <label htmlFor="gameName" className="font-bold">{t('game.game_name', { defaultValue: 'Tên Trò chơi' })}</label>
          <InputText id="gameName" value={gameFormData.gameName || ''} onChange={(e) => setGameFormData({ ...gameFormData, gameName: e.target.value })} placeholder="Ví dụ: Vòng Quay May Mắn Tri Ân" required />
        </div>
        <div className="grid">
          <div className="col-12 md:col-6 field mb-3">
            <label htmlFor="category" className="font-bold">{t('game.category', { defaultValue: 'Thể loại' })}</label>
            <Dropdown id="category" value={gameFormData.category || 'LUCKY_DRAW'} options={categoryOptions} onChange={(e) => setGameFormData({ ...gameFormData, category: e.value })} />
          </div>
          <div className="col-12 md:col-6 field mb-3">
            <label htmlFor="freeTurnsDaily" className="font-bold">{t('game.free_turns_daily', { defaultValue: 'Lượt miễn phí/ngày' })}</label>
            <InputNumber id="freeTurnsDaily" value={gameFormData.freeTurnsDaily || 0} min={0} onValueChange={(e) => setGameFormData({ ...gameFormData, freeTurnsDaily: e.value || 0 })} />
          </div>
        </div>
        <div className="grid">
          <div className="col-12 md:col-6 field mb-3">
            <label htmlFor="pricePerTurnHtg" className="font-bold">{t('game.price_per_turn_htg', { defaultValue: 'Giá mua lượt (HTG)' })}</label>
            <InputNumber id="pricePerTurnHtg" value={gameFormData.pricePerTurnHtg || 0} min={0} onValueChange={(e) => setGameFormData({ ...gameFormData, pricePerTurnHtg: e.value || 0 })} />
          </div>
          <div className="col-12 md:col-6 field mb-3">
            <label htmlFor="dailyBudgetLimit" className="font-bold">{t('game.daily_budget_total', { defaultValue: 'Hạn mức chi/ngày (HTG)' })}</label>
            <InputNumber id="dailyBudgetLimit" value={gameFormData.dailyBudgetLimit ?? 50000} onValueChange={(e) => setGameFormData({ ...gameFormData, dailyBudgetLimit: e.value ?? 50000 })} />
          </div>
        </div>
        <div className="field mb-3">
          <label htmlFor="gameUrl" className="font-bold">Đường dẫn Nhúng Game HTML5 (URL)</label>
          <InputText id="gameUrl" value={gameFormData.gameUrl || ''} onChange={(e) => setGameFormData({ ...gameFormData, gameUrl: e.target.value })} placeholder="Ví dụ: https://game-studio.com/games/bubble-shooter" />
          <small className="text-500">Đường dẫn máy chủ bên thứ ba chạy qua giao thức HTTPS.</small>
        </div>
        <div className="grid">
          <div className="col-12 md:col-6 field mb-3">
            <label htmlFor="partnerCode" className="font-bold">Mã Đối tác Game Studio</label>
            <InputText id="partnerCode" value={gameFormData.partnerCode || ''} onChange={(e) => setGameFormData({ ...gameFormData, partnerCode: e.target.value })} placeholder="Ví dụ: STUDIO_PHASER_VN" />
          </div>
          <div className="col-12 md:col-6 field mb-3">
            <label htmlFor="revenueSharePercent" className="font-bold">Tỷ lệ Chia sẻ Doanh thu (%)</label>
            <InputNumber id="revenueSharePercent" value={gameFormData.revenueSharePercent ?? 70} min={0} max={100} suffix="%" onValueChange={(e) => setGameFormData({ ...gameFormData, revenueSharePercent: e.value ?? 70 })} />
          </div>
        </div>
        <div className="field mb-3">
          <label htmlFor="webhookUrl" className="font-bold">Đường dẫn Webhook Nhận Kết quả (URL)</label>
          <InputText id="webhookUrl" value={gameFormData.webhookUrl || ''} onChange={(e) => setGameFormData({ ...gameFormData, webhookUrl: e.target.value })} placeholder="Ví dụ: https://game-studio.com/api/v1/callbacks/result" />
          <small className="text-500">Hệ thống sẽ gửi bản tin có ký số HMAC-SHA256 về URL này khi ván chơi hoàn tất.</small>
        </div>
        <div className="field mb-3">
          <label htmlFor="status" className="font-bold">{t('common.status', { defaultValue: 'Trạng thái' })}</label>
          <Dropdown id="status" value={gameFormData.status || CommonStatus.ACTIVE} options={statusOptions} onChange={(e) => setGameFormData({ ...gameFormData, status: e.value })} />
        </div>
        <div className="flex justify-content-end gap-2 mt-4">
          <Button label={t('common.cancel', { defaultValue: 'Hủy' })} icon="pi pi-times" outlined onClick={() => setShowGameDialog(false)} disabled={isSubmitting} />
          <Button label={t('common.save', { defaultValue: 'Lưu thay đổi' })} icon="pi pi-check" onClick={saveGame} loading={isSubmitting} disabled={isSubmitting} />
        </div>
      </Dialog>

      {/* ── DIALOG 2: DETAILED GAME PARAMETERS CONFIGURATION ── */}
      <Dialog
        visible={showParamsDialog}
        style={{ width: '650px' }}
        header={`Cấu hình tham số chi tiết: ${paramsFormData.gameName || ''}`}
        modal
        className="p-fluid"
        onHide={() => setShowParamsDialog(false)}
      >
        <div className="p-3 bg-blue-50 border-1 border-blue-200 border-round-xl mb-4 text-blue-900">
          <div className="flex align-items-center gap-2 mb-1">
            <i className="pi pi-info-circle text-blue-600 font-bold" />
            <span className="font-bold">Mã trò chơi: {paramsFormData.gameCode}</span>
          </div>
          <span className="text-xs">Tham số dưới đây sẽ được nạp động vào Webview Game khi hội viên bắt đầu phiên chơi.</span>
        </div>

        {/* Dynamic Parameter Fields Based On Game Category */}
        {paramsFormData.category === 'QUIZ' && (
          <div className="grid">
            <div className="col-12 md:col-6 field mb-3">
              <label htmlFor="quizQuestionCount" className="font-bold">Số lượng câu hỏi mỗi phiên</label>
              <InputNumber id="quizQuestionCount" value={paramsFormData.quizQuestionCount || 5} min={1} max={20} onValueChange={(e) => setParamsFormData({ ...paramsFormData, quizQuestionCount: e.value || 5 })} />
              <small className="text-500">Số câu hỏi người chơi cần trả lời liên tiếp.</small>
            </div>
            <div className="col-12 md:col-6 field mb-3">
              <label htmlFor="quizCountdownSec" className="font-bold">Thời gian trả lời (Giây/câu)</label>
              <InputNumber id="quizCountdownSec" value={paramsFormData.quizCountdownSec || 20} min={5} max={60} onValueChange={(e) => setParamsFormData({ ...paramsFormData, quizCountdownSec: e.value || 20 })} />
              <small className="text-500">Thời gian đếm ngược cho mỗi câu hỏi.</small>
            </div>
            <div className="col-12 field mb-3">
              <label htmlFor="quizRewardPoints" className="font-bold">Điểm thưởng khi trả lời đúng 100%</label>
              <InputNumber id="quizRewardPoints" value={paramsFormData.quizRewardPoints || 150} min={10} onValueChange={(e) => setParamsFormData({ ...paramsFormData, quizRewardPoints: e.value || 150 })} />
            </div>
          </div>
        )}

        {paramsFormData.category === 'FARM' && (
          <div className="grid">
            <div className="col-12 md:col-6 field mb-3">
              <label htmlFor="farmSeasonDays" className="font-bold">Thời gian mùa vụ thu hoạch (Ngày)</label>
              <InputNumber id="farmSeasonDays" value={paramsFormData.farmSeasonDays || 7} min={1} max={30} onValueChange={(e) => setParamsFormData({ ...paramsFormData, farmSeasonDays: e.value || 7 })} />
              <small className="text-500">Chu kỳ từ lúc gieo hạt đến khi đổi nông sản.</small>
            </div>
            <div className="col-12 md:col-6 field mb-3">
              <label htmlFor="farmVoucherLimit" className="font-bold">Giới hạn đổi voucher mỗi mùa</label>
              <InputNumber id="farmVoucherLimit" value={paramsFormData.farmVoucherLimit || 5} min={1} onValueChange={(e) => setParamsFormData({ ...paramsFormData, farmVoucherLimit: e.value || 5 })} />
            </div>
          </div>
        )}

        {paramsFormData.category === 'DICE' && (
          <div className="grid">
            <div className="col-12 md:col-6 field mb-3">
              <label htmlFor="diceMultiplierMax" className="font-bold">Hệ số nhân thưởng tối đa (xTimes)</label>
              <InputNumber id="diceMultiplierMax" value={paramsFormData.diceMultiplierMax || 10} min={2} max={100} onValueChange={(e) => setParamsFormData({ ...paramsFormData, diceMultiplierMax: e.value || 10 })} />
              <small className="text-500">Mức nhân điểm thưởng tối đa khi đổ 3 mặt đồng nhất.</small>
            </div>
          </div>
        )}

        {paramsFormData.category === 'LUCKY_DRAW' && (
          <div className="p-3 bg-amber-50 border-1 border-amber-200 border-round-xl text-amber-900">
            <div className="flex align-items-center gap-2 mb-1">
              <i className="pi pi-sliders-h text-orange-600 font-bold" />
              <span className="font-bold">Vòng Quay May Mắn Tri Ân Khách Hàng</span>
            </div>
            <span className="text-xs">Ma trận xác suất 8 ô thưởng của Vòng Quay được cấu hình tại trang <strong>Cấu hình Chung Cổng Game & Vòng Quay</strong>.</span>
          </div>
        )}

        <div className="field mb-3 mt-3">
          <div className="flex align-items-center justify-content-between p-2 border-1 surface-border border-round">
            <span className="font-bold text-sm">Cho phép dùng Điểm thưởng để quay/chơi</span>
            <InputSwitch
              checked={paramsFormData.allowPointsSpin ?? true}
              onChange={(e) => setParamsFormData({ ...paramsFormData, allowPointsSpin: e.value })}
            />
          </div>
        </div>

        <div className="flex justify-content-end gap-2 mt-4">
          <Button label={t('common.cancel', { defaultValue: 'Hủy' })} icon="pi pi-times" outlined onClick={() => setShowParamsDialog(false)} disabled={isSubmitting} />
          <Button label={t('common.save', { defaultValue: 'Lưu cấu hình tham số' })} icon="pi pi-check" onClick={saveParamsConfig} loading={isSubmitting} disabled={isSubmitting} />
        </div>
      </Dialog>
    </div>
  );
};

export default GameManagementPage;
