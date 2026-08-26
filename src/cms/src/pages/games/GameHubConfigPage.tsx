import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { InputSwitch } from 'primereact/inputswitch';
import { Toast } from 'primereact/toast';
import { AppBreadcrumb } from 'components';
import { CommonStatus } from '@/models';
import { LoyaltyService } from '@/service/loyalty.service';
import { paths } from '@/paths';

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
  status: CommonStatus | string;
  displayOrder?: number;
  lobbyBadge?: 'HOT' | 'NEW' | 'EVENT' | 'NORMAL';
  lobbyVisible?: boolean;
}

interface GameHubGlobalSettings {
  pointsPerTurnExchange: number;
  goldenHourEnabled: boolean;
  goldenHourMultiplier: number;
  goldenHourSchedule: string;
  maintenanceMode: boolean;
  maintenanceNotice: string;
  maxDailyTurnsPerUser: number;
  defaultDailyFreeTurns: number;
  globalDailyBudgetLimit: number;
  welcomeBannerText: string;
  welcomeBannerTextEn: string;
  welcomeBannerTextFr: string;
  welcomeBannerTextHt: string;
  lobbyBannerUrl: string;
  lobbyCtaText: string;
  soundEffectsEnabled: boolean;
  cooldownSeconds: number;
  maxTurnsPerDeviceDaily: number;
  autoLockSuspicious: boolean;
}

const CATEGORY_NAMES: Record<string, string> = {
  LUCKY_DRAW: 'Vòng quay may mắn',
  SMASH_EGG: 'Đập trứng vàng',
  INSTANT_WIN: 'Vé cào trúng liền',
  DICE_BOARD: 'Xúc xắc bàn cờ',
  SPORTS_CHALLENGE: 'Sút phạt thể thao',
  PHYSICS_LUCK: 'Thả bi may mắn',
  DAILY_CHECKIN: 'Nhiệm vụ điểm danh',
  ADVENTURE_RISK: 'Phiêu lưu kho báu',
  LUCKY_CHEST: 'Rương báu may mắn',
  QUIZ: 'Đố vui trí tuệ',
  CASUAL: 'Nông trại thu hoạch',
};

export const GameHubConfigPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useRef<Toast>(null);
  const selectedTenant = 'TENANT_NATCASH';

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [games, setGames] = useState<GameItem[]>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  // Global settings state
  const [globalSettings, setGlobalSettings] = useState<GameHubGlobalSettings>({
    pointsPerTurnExchange: 50,
    goldenHourEnabled: true,
    goldenHourMultiplier: 2,
    goldenHourSchedule: '11:00 - 13:00, 19:00 - 21:00',
    maintenanceMode: false,
    maintenanceNotice: 'Hệ thống Cổng Game đang được nâng cấp tính năng mới. Vui lòng quay lại sau!',
    maxDailyTurnsPerUser: 10,
    defaultDailyFreeTurns: 1,
    globalDailyBudgetLimit: 50000,
    welcomeBannerText: 'Tham gia minigame mỗi ngày nhận quà siêu khủng từ Natcash!',
    welcomeBannerTextEn: 'Play minigames every day to win mega rewards from Natcash!',
    welcomeBannerTextFr: 'Jouez à des mini-jeux chaque jour pour gagner des méga récompenses!',
    welcomeBannerTextHt: 'Jwe minije chak jou pou genyen gwo rekonpans nan men Natcash!',
    lobbyBannerUrl: 'https://cdn.natcash.ht/gamehub/banner-lobby-v2.png',
    lobbyCtaText: 'Đổi điểm nhận lượt chơi • Thắng quà liền tay!',
    soundEffectsEnabled: true,
    cooldownSeconds: 3,
    maxTurnsPerDeviceDaily: 50,
    autoLockSuspicious: true,
  });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [configData, gamesData] = await Promise.all([
        LoyaltyService.getGlobalGameConfig(selectedTenant),
        LoyaltyService.getGames(selectedTenant),
      ]);

      if (configData) {
        setGlobalSettings((prev) => ({
          ...prev,
          pointsPerTurnExchange: configData.pointsPerTurnExchange ?? 50,
          goldenHourEnabled: configData.goldenHourEnabled ?? true,
          maintenanceMode: configData.maintenanceMode ?? false,
          maxDailyTurnsPerUser: configData.maxDailyTurnsPerUser ?? 10,
          welcomeBannerText: configData.welcomeBannerText || prev.welcomeBannerText,
        }));
      }

      if (Array.isArray(gamesData) && gamesData.length > 0) {
        setGames(
          gamesData.map((g: any, index: number) => ({
            ...g,
            displayOrder: g.displayOrder ?? index + 1,
            lobbyBadge: g.lobbyBadge ?? (index === 0 ? 'HOT' : index === 1 ? 'NEW' : 'NORMAL'),
            lobbyVisible: g.status === CommonStatus.ACTIVE || g.status === 'ACTIVE',
          }))
        );
      } else {
        setGames([]);
      }
    } catch (e) {
      console.error('[GameHubConfigPage] Load data error:', e);
      toast.current?.show({
        severity: 'error',
        summary: t('toast.error', { defaultValue: 'Lỗi' }),
        detail: t('toast.generic_error', { defaultValue: 'Không thể tải dữ liệu cấu hình' }),
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedTenant, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveGlobalSettings = async () => {
    setIsSubmitting(true);
    try {
      await LoyaltyService.saveGlobalGameConfig(
        {
          pointsPerTurnExchange: globalSettings.pointsPerTurnExchange,
          goldenHourEnabled: globalSettings.goldenHourEnabled,
          maintenanceMode: globalSettings.maintenanceMode,
          maxDailyTurnsPerUser: globalSettings.maxDailyTurnsPerUser,
          welcomeBannerText: globalSettings.welcomeBannerText,
        },
        selectedTenant
      );

      toast.current?.show({
        severity: 'success',
        summary: t('toast.success', { defaultValue: 'Thành công' }),
        detail: t('game_hub.save_success', { defaultValue: 'Lưu cấu hình sảnh Cổng Game thành công' }),
      });
      await loadData();
    } catch (e) {
      console.error('[handleSaveGlobalSettings] Error:', e);
      toast.current?.show({
        severity: 'error',
        summary: t('toast.error', { defaultValue: 'Lỗi' }),
        detail: t('game_hub.save_failed', { defaultValue: 'Lưu cấu hình sảnh Cổng Game thất bại' }),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeGamesCount = games.filter(
    (g) => g.status === CommonStatus.ACTIVE || g.status === 'ACTIVE'
  ).length;

  const multiplierOptions = [
    { label: 'x2 Lượt chơi (Gấp đôi)', value: 2 },
    { label: 'x3 Lượt chơi (Gấp ba)', value: 3 },
    { label: 'x5 Lượt chơi (Đặc biệt)', value: 5 },
  ];

  // Render text thuần cho thể loại không dùng style màu mè
  const categoryTextTemplate = (rowData: GameItem) => {
    const text = CATEGORY_NAMES[rowData.category] || rowData.category || '-';
    return <span className="text-700">{text}</span>;
  };

  // Render text thuần cho thứ tự sảnh
  const lobbyOrderTemplate = (rowData: GameItem) => {
    return <span className="text-700 font-medium">{rowData.displayOrder || 1}</span>;
  };

  // Render text thuần cho huy hiệu sảnh
  const lobbyBadgeTemplate = (rowData: GameItem) => {
    if (rowData.lobbyBadge === 'HOT') {
      return <span className="text-red-600 font-bold text-xs">HOT</span>;
    }
    if (rowData.lobbyBadge === 'NEW') {
      return <span className="text-blue-600 font-bold text-xs">NEW</span>;
    }
    if (rowData.lobbyBadge === 'EVENT') {
      return <span className="text-orange-600 font-bold text-xs">Sự kiện</span>;
    }
    return <span className="text-400 text-xs">Bình thường</span>;
  };

  // Render text thuần cho trạng thái hiển thị
  const lobbyVisibilityTemplate = (rowData: GameItem) => {
    return rowData.lobbyVisible ? (
      <span className="text-green-600 font-medium text-xs">Đang hiển thị</span>
    ) : (
      <span className="text-500 text-xs">Tạm ẩn</span>
    );
  };

  const gameInfoTemplate = (rowData: GameItem) => {
    return (
      <div className="flex align-items-center gap-2">
        <div
          className="flex align-items-center justify-content-center border-round surface-100 flex-shrink-0"
          style={{ width: '2.25rem', height: '2.25rem', fontSize: '1.1rem' }}
        >
          {rowData.iconUrl ? (
            <img src={rowData.iconUrl} alt={rowData.gameName} style={{ width: '100%', height: '100%', borderRadius: '4px' }} />
          ) : (
            '🎮'
          )}
        </div>
        <div>
          <div className="font-bold text-sm text-900">{rowData.gameName}</div>
          <div className="font-mono text-xs text-500">{rowData.gameCode}</div>
        </div>
      </div>
    );
  };

  // Action template tinh gọn, không lỗi màu nền, text link rõ ràng
  const actionTemplate = () => {
    return (
      <div className="flex justify-content-center">
        <button
          type="button"
          className="p-link text-primary font-medium text-xs flex align-items-center gap-1 hover:underline"
          onClick={() => navigate(paths.gameManagement)}
        >
          <i className="pi pi-cog text-xs" />
          <span>{t('game_hub.action_prizes', { defaultValue: 'Cấu hình giải thưởng' })}</span>
        </button>
      </div>
    );
  };

  return (
    <div className="game-hub-config-page">
      <Toast ref={toast} />

      <AppBreadcrumb
        items={[
          { label: t('nav.rewards_games', { defaultValue: 'Khuyến mãi & Game' }) },
          { label: t('nav.game_hub_config', { defaultValue: 'Cấu hình Chung Cổng Game' }) },
        ]}
      />

      {/* ── TOP ACTION HEADER ── */}
      <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-3 mb-4">
        <div>
          <h3 className="m-0 text-900 font-bold tracking-tight">
            {t('game_hub.title', { defaultValue: 'Cấu hình Chung Cổng Game & Sảnh Webview' })}
          </h3>
          <p className="text-500 text-xs mt-1 mb-0">
            {t('game_hub.subtitle', {
              defaultValue:
                'Quản trị quy tắc quy đổi, sự kiện khung giờ vàng, chế độ bảo trì, hiển thị trò chơi trên sảnh và chính sách chống gian lận.',
            })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            label={t('common.refresh', { defaultValue: 'Làm mới' })}
            icon="pi pi-refresh"
            outlined
            onClick={loadData}
            loading={isLoading}
          />
          <Button
            label={t('game_hub.save_config', { defaultValue: 'Lưu Cấu Hình Sảnh' })}
            icon="pi pi-save"
            onClick={handleSaveGlobalSettings}
            loading={isSubmitting}
          />
        </div>
      </div>

      {/* ── KPI STATS CARDS ── */}
      <div className="grid mb-4">
        {/* KPI 1: Active Games */}
        <div className="col-12 sm:col-6 lg:col-3">
          <div className="card mb-0 shadow-1 border-round-lg surface-card p-3 border-1 border-200 h-full">
            <div className="flex justify-content-between align-items-center mb-2">
              <div>
                <span className="block text-600 font-medium text-xs mb-1">
                  {t('game_hub.kpi_active_games_title', { defaultValue: 'Trò Chơi Sảnh Vận Hành' })}
                </span>
                <div className="text-900 font-bold text-2xl tracking-tight">
                  {activeGamesCount} / {games.length} Game
                </div>
              </div>
              <div
                className="flex align-items-center justify-content-center border-round surface-100 text-700 flex-shrink-0"
                style={{ width: '2.75rem', height: '2.75rem' }}
              >
                <i className="pi pi-th-large text-xl" />
              </div>
            </div>
            <span className="text-500 text-xs">
              {t('game_hub.kpi_active_games_sub', { defaultValue: 'Sẵn sàng trên Webview GameHub' })}
            </span>
          </div>
        </div>

        {/* KPI 2: Exchange Rate */}
        <div className="col-12 sm:col-6 lg:col-3">
          <div className="card mb-0 shadow-1 border-round-lg surface-card p-3 border-1 border-200 h-full">
            <div className="flex justify-content-between align-items-center mb-2">
              <div>
                <span className="block text-600 font-medium text-xs mb-1">
                  {t('game_hub.kpi_exchange_rate_title', { defaultValue: 'Tỷ Lệ Đổi Điểm Chuẩn' })}
                </span>
                <div className="text-900 font-bold text-2xl font-mono tracking-tight">
                  {globalSettings.pointsPerTurnExchange} {t('game_hub.points_unit', { defaultValue: 'Điểm / Lượt' })}
                </div>
              </div>
              <div
                className="flex align-items-center justify-content-center border-round surface-100 text-700 flex-shrink-0"
                style={{ width: '2.75rem', height: '2.75rem' }}
              >
                <i className="pi pi-sync text-xl" />
              </div>
            </div>
            <span className="text-500 text-xs">
              {t('game_hub.kpi_exchange_rate_sub', { defaultValue: 'Áp dụng toàn bộ minigame' })}
            </span>
          </div>
        </div>

        {/* KPI 3: Daily Cap */}
        <div className="col-12 sm:col-6 lg:col-3">
          <div className="card mb-0 shadow-1 border-round-lg surface-card p-3 border-1 border-200 h-full">
            <div className="flex justify-content-between align-items-center mb-2">
              <div>
                <span className="block text-600 font-medium text-xs mb-1">
                  {t('game_hub.kpi_daily_limit_title', { defaultValue: 'Hạn Mức Lượt / Hội Viên' })}
                </span>
                <div className="text-900 font-bold text-2xl font-mono tracking-tight">
                  {globalSettings.maxDailyTurnsPerUser} {t('game_hub.turns_unit', { defaultValue: 'Lượt / Ngày' })}
                </div>
              </div>
              <div
                className="flex align-items-center justify-content-center border-round surface-100 text-700 flex-shrink-0"
                style={{ width: '2.75rem', height: '2.75rem' }}
              >
                <i className="pi pi-bolt text-xl" />
              </div>
            </div>
            <span className="text-500 text-xs">
              {t('game_hub.kpi_daily_limit_sub', { defaultValue: 'Khống chế chống lạm dụng' })}
            </span>
          </div>
        </div>

        {/* KPI 4: Lobby Status */}
        <div className="col-12 sm:col-6 lg:col-3">
          <div className="card mb-0 shadow-1 border-round-lg surface-card p-3 border-1 border-200 h-full">
            <div className="flex justify-content-between align-items-center mb-2">
              <div>
                <span className="block text-600 font-medium text-xs mb-1">
                  {t('game_hub.kpi_lobby_status_title', { defaultValue: 'Trạng Thái Vận Hành Sảnh' })}
                </span>
                <div className="text-900 font-bold text-2xl tracking-tight">
                  {globalSettings.maintenanceMode
                    ? t('game_hub.kpi_lobby_status_maintenance', { defaultValue: 'Đang Bảo Trì' })
                    : globalSettings.goldenHourEnabled
                    ? t('game_hub.kpi_lobby_status_golden', { defaultValue: 'Khung Giờ Vàng (x2)' })
                    : t('game_hub.kpi_lobby_status_active', { defaultValue: 'Sảnh Đang Mở' })}
                </div>
              </div>
              <div
                className="flex align-items-center justify-content-center border-round surface-100 text-700 flex-shrink-0"
                style={{ width: '2.75rem', height: '2.75rem' }}
              >
                <i className="pi pi-globe text-xl" />
              </div>
            </div>
            <span className="text-500 text-xs">
              Cầu nối JSBridge & Webview Live
            </span>
          </div>
        </div>
      </div>

      {/* ── 2-COLUMN CONFIGURATION FORMS ── */}
      <div className="grid">
        {/* LEFT COLUMN: Economic Rules & Lobby Events */}
        <div className="col-12 lg:col-6 flex flex-column gap-4">
          {/* Card 1: Economic Rules */}
          <div className="card shadow-1 border-round-lg surface-card p-4 border-1 border-200 h-full">
            <h5 className="m-0 font-bold text-900 mb-1">
              {t('game_hub.section_economy_title', {
                defaultValue: 'Quy Tắc Kinh Tế & Tham Số Quy Đổi Lượt Chơi',
              })}
            </h5>
            <p className="text-500 text-xs mb-4">
              {t('game_hub.section_economy_desc', {
                defaultValue:
                  'Thiết lập tỷ giá đổi điểm sang lượt chơi và hạn mức mua lượt áp dụng đồng bộ toàn hệ thống GameHub.',
              })}
            </p>

            <div className="grid">
              <div className="col-12 sm:col-6 field mb-3">
                <label htmlFor="pointsPerTurnExchange" className="font-bold text-xs block mb-1">
                  {t('game_hub.points_per_turn', { defaultValue: 'Quy đổi Điểm sang Lượt chơi' })}
                </label>
                <InputNumber
                  id="pointsPerTurnExchange"
                  value={globalSettings.pointsPerTurnExchange}
                  onValueChange={(e) =>
                    setGlobalSettings({ ...globalSettings, pointsPerTurnExchange: e.value || 50 })
                  }
                  suffix={` ${t('game_hub.points_unit', { defaultValue: 'Điểm / Lượt' })}`}
                  min={1}
                  max={10000}
                  className="w-full"
                />
                <small className="text-500 block mt-1">
                  {t('game_hub.points_per_turn_help', {
                    defaultValue: 'Số điểm Loyalty hội viên cần tiêu để đổi lấy 1 lượt chơi.',
                  })}
                </small>
              </div>

              <div className="col-12 sm:col-6 field mb-3">
                <label htmlFor="maxDailyTurnsPerUser" className="font-bold text-xs block mb-1">
                  {t('game_hub.max_daily_turns', { defaultValue: 'Giới hạn mua lượt tối đa / ngày' })}
                </label>
                <InputNumber
                  id="maxDailyTurnsPerUser"
                  value={globalSettings.maxDailyTurnsPerUser}
                  onValueChange={(e) =>
                    setGlobalSettings({ ...globalSettings, maxDailyTurnsPerUser: e.value || 10 })
                  }
                  suffix={` ${t('game_hub.turns_unit', { defaultValue: 'Lượt / Ngày' })}`}
                  min={1}
                  max={500}
                  className="w-full"
                />
                <small className="text-500 block mt-1">
                  {t('game_hub.max_daily_turns_help', {
                    defaultValue: 'Khống chế số lượt mua tối đa mỗi tài khoản trong 24 giờ.',
                  })}
                </small>
              </div>

              <div className="col-12 sm:col-6 field mb-3">
                <label htmlFor="defaultDailyFreeTurns" className="font-bold text-xs block mb-1">
                  {t('game_hub.daily_free_turns', { defaultValue: 'Lượt chơi miễn phí điểm danh' })}
                </label>
                <InputNumber
                  id="defaultDailyFreeTurns"
                  value={globalSettings.defaultDailyFreeTurns}
                  onValueChange={(e) =>
                    setGlobalSettings({ ...globalSettings, defaultDailyFreeTurns: e.value || 1 })
                  }
                  suffix={` ${t('game_hub.turns_day_unit', { defaultValue: 'Lượt / Ngày' })}`}
                  min={0}
                  max={10}
                  className="w-full"
                />
                <small className="text-500 block mt-1">
                  {t('game_hub.daily_free_turns_help', {
                    defaultValue: 'Số lượt chơi miễn phí tặng mỗi ngày khi hội viên truy cập Sảnh Game.',
                  })}
                </small>
              </div>

              <div className="col-12 sm:col-6 field mb-3">
                <label htmlFor="globalDailyBudgetLimit" className="font-bold text-xs block mb-1">
                  {t('game_hub.global_daily_budget', { defaultValue: 'Hạn mức ngân sách phát thưởng toàn sàn' })}
                </label>
                <InputNumber
                  id="globalDailyBudgetLimit"
                  value={globalSettings.globalDailyBudgetLimit}
                  onValueChange={(e) =>
                    setGlobalSettings({ ...globalSettings, globalDailyBudgetLimit: e.value || 50000 })
                  }
                  suffix={` ${t('game_hub.htg_day_unit', { defaultValue: 'HTG / Ngày' })}`}
                  min={0}
                  className="w-full"
                />
                <small className="text-500 block mt-1">
                  {t('game_hub.global_daily_budget_help', {
                    defaultValue: 'Ngưỡng ngân sách an toàn tối đa phát thưởng toàn bộ các game trong ngày.',
                  })}
                </small>
              </div>
            </div>
          </div>

          {/* Card 2: Lobby Operations & Events */}
          <div className="card shadow-1 border-round-lg surface-card p-4 border-1 border-200 h-full">
            <h5 className="m-0 font-bold text-900 mb-1">
              {t('game_hub.section_ops_title', {
                defaultValue: 'Chế Độ Vận Hành Đặc Biệt & Sự Kiện Sảnh',
              })}
            </h5>
            <p className="text-500 text-xs mb-4">
              {t('game_hub.section_ops_desc', {
                defaultValue:
                  'Kích hoạt khung giờ nhân đôi quà tặng hoặc bật chế độ bảo trì sảnh Webview khi nâng cấp hệ thống.',
              })}
            </p>

            <div className="flex flex-column gap-3">
              {/* Golden Hour Row */}
              <div className="p-3 border-round surface-50 border-1 border-200">
                <div className="flex align-items-center justify-content-between mb-2">
                  <div>
                    <span className="font-bold text-sm text-900 block">
                      {t('game_hub.golden_hour_toggle', { defaultValue: 'Khung Giờ Vàng (Nhân Hệ Số Thưởng)' })}
                    </span>
                    <small className="text-500">
                      {t('game_hub.golden_hour_help', {
                        defaultValue: 'Tự động nhân đôi lượt chơi hoặc điểm thưởng trong khung giờ cao điểm.',
                      })}
                    </small>
                  </div>
                  <InputSwitch
                    checked={globalSettings.goldenHourEnabled}
                    onChange={(e) =>
                      setGlobalSettings({ ...globalSettings, goldenHourEnabled: e.value || false })
                    }
                  />
                </div>

                {globalSettings.goldenHourEnabled && (
                  <div className="grid mt-2 pt-2 border-top-1 border-200">
                    <div className="col-12 sm:col-5 field mb-0">
                      <label className="font-bold text-xs block mb-1">
                        {t('game_hub.golden_hour_multiplier', { defaultValue: 'Hệ số nhân thưởng' })}
                      </label>
                      <Dropdown
                        value={globalSettings.goldenHourMultiplier}
                        options={multiplierOptions}
                        onChange={(e) =>
                          setGlobalSettings({ ...globalSettings, goldenHourMultiplier: e.value })
                        }
                        className="w-full"
                      />
                    </div>
                    <div className="col-12 sm:col-7 field mb-0">
                      <label className="font-bold text-xs block mb-1">
                        {t('game_hub.golden_hour_schedule', { defaultValue: 'Khung giờ áp dụng trong ngày' })}
                      </label>
                      <InputText
                        value={globalSettings.goldenHourSchedule}
                        onChange={(e) =>
                          setGlobalSettings({ ...globalSettings, goldenHourSchedule: e.target.value })
                        }
                        className="w-full font-mono text-sm"
                        placeholder="11:00 - 13:00, 19:00 - 21:00"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Maintenance Mode Row */}
              <div className="p-3 border-round surface-50 border-1 border-200">
                <div className="flex align-items-center justify-content-between mb-2">
                  <div>
                    <span className="font-bold text-sm text-900 block">
                      {t('game_hub.maintenance_toggle', { defaultValue: 'Bảo Trì Toàn Bộ Cổng Game' })}
                    </span>
                    <small className="text-500">
                      {t('game_hub.maintenance_help', {
                        defaultValue: 'Tạm đóng sảnh Webview GameHub và hiển thị thông điệp nâng cấp hệ thống.',
                      })}
                    </small>
                  </div>
                  <InputSwitch
                    checked={globalSettings.maintenanceMode}
                    onChange={(e) =>
                      setGlobalSettings({ ...globalSettings, maintenanceMode: e.value || false })
                    }
                  />
                </div>

                {globalSettings.maintenanceMode && (
                  <div className="mt-2 pt-2 border-top-1 border-200">
                    <label className="font-bold text-xs block mb-1 text-red-600">
                      {t('game_hub.maintenance_message', {
                        defaultValue: 'Thông điệp thông báo bảo trì hiển thị trên Webview',
                      })}
                    </label>
                    <InputTextarea
                      rows={2}
                      value={globalSettings.maintenanceNotice}
                      onChange={(e) =>
                        setGlobalSettings({ ...globalSettings, maintenanceNotice: e.target.value })
                      }
                      className="w-full text-sm"
                      placeholder={t('game_hub.maintenance_message_placeholder', {
                        defaultValue: 'Hệ thống Cổng Game đang được nâng cấp tính năng mới. Vui lòng quay lại sau!',
                      })}
                    />
                  </div>
                )}
              </div>

              {/* Sound & Graphic Effects */}
              <div className="p-3 border-round surface-50 border-1 border-200 flex align-items-center justify-content-between">
                <div>
                  <span className="font-bold text-sm text-900 block">
                    {t('game_hub.sound_effects_toggle', { defaultValue: 'Âm thanh nền & Hiệu ứng Sảnh' })}
                  </span>
                  <small className="text-500">
                    {t('game_hub.sound_effects_help', {
                      defaultValue: 'Bật nhạc nền sảnh minigame và hiệu ứng đồ họa động.',
                    })}
                  </small>
                </div>
                <InputSwitch
                  checked={globalSettings.soundEffectsEnabled}
                  onChange={(e) =>
                    setGlobalSettings({ ...globalSettings, soundEffectsEnabled: e.value || false })
                  }
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Multilingual UI & Anti-Fraud */}
        <div className="col-12 lg:col-6 flex flex-column gap-4">
          {/* Card 3: Multilingual UI & Banner */}
          <div className="card shadow-1 border-round-lg surface-card p-4 border-1 border-200 h-full">
            <h5 className="m-0 font-bold text-900 mb-1">
              {t('game_hub.section_ui_title', {
                defaultValue: 'Giao Diện Sảnh Webview & Thông Điệp Đa Ngôn Ngữ',
              })}
            </h5>
            <p className="text-500 text-xs mb-4">
              {t('game_hub.section_ui_desc', {
                defaultValue:
                  'Nội dung thông điệp biểu ngữ chào mừng và hình ảnh đại diện hiển thị tại sảnh chính Webview.',
              })}
            </p>

            <div className="grid">
              <div className="col-12 field mb-3">
                <label htmlFor="welcomeVi" className="font-bold text-xs block mb-1">
                  {t('game_hub.welcome_message_vi', { defaultValue: 'Thông điệp chào mừng (Tiếng Việt)' })}
                </label>
                <InputText
                  id="welcomeVi"
                  value={globalSettings.welcomeBannerText}
                  onChange={(e) =>
                    setGlobalSettings({ ...globalSettings, welcomeBannerText: e.target.value })
                  }
                  className="w-full"
                  placeholder={t('game_hub.welcome_placeholder', {
                    defaultValue: 'Tham gia minigame mỗi ngày nhận quà siêu khủng từ Natcash!',
                  })}
                />
              </div>

              <div className="col-12 field mb-3">
                <label htmlFor="welcomeEn" className="font-bold text-xs block mb-1">
                  {t('game_hub.welcome_message_en', { defaultValue: 'Thông điệp chào mừng (English)' })}
                </label>
                <InputText
                  id="welcomeEn"
                  value={globalSettings.welcomeBannerTextEn}
                  onChange={(e) =>
                    setGlobalSettings({ ...globalSettings, welcomeBannerTextEn: e.target.value })
                  }
                  className="w-full"
                />
              </div>

              <div className="col-12 sm:col-6 field mb-3">
                <label htmlFor="welcomeFr" className="font-bold text-xs block mb-1">
                  {t('game_hub.welcome_message_fr', { defaultValue: 'Thông điệp chào mừng (Français)' })}
                </label>
                <InputText
                  id="welcomeFr"
                  value={globalSettings.welcomeBannerTextFr}
                  onChange={(e) =>
                    setGlobalSettings({ ...globalSettings, welcomeBannerTextFr: e.target.value })
                  }
                  className="w-full"
                />
              </div>

              <div className="col-12 sm:col-6 field mb-3">
                <label htmlFor="welcomeHt" className="font-bold text-xs block mb-1">
                  {t('game_hub.welcome_message_ht', { defaultValue: 'Thông điệp chào mừng (Kreyòl Ayisyen)' })}
                </label>
                <InputText
                  id="welcomeHt"
                  value={globalSettings.welcomeBannerTextHt}
                  onChange={(e) =>
                    setGlobalSettings({ ...globalSettings, welcomeBannerTextHt: e.target.value })
                  }
                  className="w-full"
                />
              </div>

              <div className="col-12 field mb-3">
                <label htmlFor="bannerUrl" className="font-bold text-xs block mb-1">
                  {t('game_hub.banner_url', { defaultValue: 'Đường dẫn ảnh biểu ngữ Sảnh Game (Banner URL)' })}
                </label>
                <InputText
                  id="bannerUrl"
                  value={globalSettings.lobbyBannerUrl}
                  onChange={(e) =>
                    setGlobalSettings({ ...globalSettings, lobbyBannerUrl: e.target.value })
                  }
                  className="w-full"
                  placeholder="https://cdn.natcash.ht/gamehub/banner-main.png"
                />
              </div>

              <div className="col-12 field mb-0">
                <label htmlFor="lobbyCta" className="font-bold text-xs block mb-1">
                  {t('game_hub.lobby_cta_text', {
                    defaultValue: 'Tiêu đề phụ / Lời kêu gọi hành động (Call to Action)',
                  })}
                </label>
                <InputText
                  id="lobbyCta"
                  value={globalSettings.lobbyCtaText}
                  onChange={(e) =>
                    setGlobalSettings({ ...globalSettings, lobbyCtaText: e.target.value })
                  }
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Card 4: Anti-Fraud & Security */}
          <div className="card shadow-1 border-round-lg surface-card p-4 border-1 border-200 h-full">
            <h5 className="m-0 font-bold text-900 mb-1">
              {t('game_hub.section_security_title', {
                defaultValue: 'Kiểm Soát An Toàn & Chống Gian Lận (Anti-Fraud)',
              })}
            </h5>
            <p className="text-500 text-xs mb-4">
              {t('game_hub.section_security_desc', {
                defaultValue:
                  'Rào chắn an ninh tự động bảo vệ quỹ thưởng và ngăn chặn công cụ tự động (Bot / Clicker).',
              })}
            </p>

            <div className="grid">
              <div className="col-12 sm:col-6 field mb-3">
                <label htmlFor="cooldownSeconds" className="font-bold text-xs block mb-1">
                  {t('game_hub.cooldown_seconds', {
                    defaultValue: 'Thời gian giãn cách tối thiểu giữa 2 lượt chơi',
                  })}
                </label>
                <InputNumber
                  id="cooldownSeconds"
                  value={globalSettings.cooldownSeconds}
                  onValueChange={(e) =>
                    setGlobalSettings({ ...globalSettings, cooldownSeconds: e.value || 3 })
                  }
                  suffix={` ${t('game_hub.cooldown_unit', { defaultValue: 'Giây' })}`}
                  min={1}
                  max={30}
                  className="w-full"
                />
                <small className="text-500 block mt-1">
                  {t('game_hub.cooldown_help', {
                    defaultValue: 'Chống click dồn dập và tấn công chuỗi yêu cầu tự động.',
                  })}
                </small>
              </div>

              <div className="col-12 sm:col-6 field mb-3">
                <label htmlFor="maxTurnsPerDeviceDaily" className="font-bold text-xs block mb-1">
                  {t('game_hub.max_device_spins', {
                    defaultValue: 'Giới hạn số lượt tối đa trên 1 IP / Thiết bị',
                  })}
                </label>
                <InputNumber
                  id="maxTurnsPerDeviceDaily"
                  value={globalSettings.maxTurnsPerDeviceDaily}
                  onValueChange={(e) =>
                    setGlobalSettings({ ...globalSettings, maxTurnsPerDeviceDaily: e.value || 50 })
                  }
                  suffix={` ${t('game_hub.max_spins_unit', { defaultValue: 'Lượt / Thiết bị' })}`}
                  min={5}
                  max={1000}
                  className="w-full"
                />
                <small className="text-500 block mt-1">
                  {t('game_hub.max_device_spins_help', {
                    defaultValue: 'Ngăn chặn tạo nhiều tài khoản ảo trên cùng một thiết bị.',
                  })}
                </small>
              </div>

              <div className="col-12 field mb-0">
                <div className="p-3 border-round surface-50 border-1 border-200 flex align-items-center justify-content-between">
                  <div>
                    <span className="font-bold text-sm text-900 block">
                      {t('game_hub.auto_lock_suspicious', {
                        defaultValue: 'Tự động tạm khóa giao dịch khi phát hiện bất thường',
                      })}
                    </span>
                    <small className="text-500">
                      {t('game_hub.auto_lock_help', {
                        defaultValue:
                          'Kích hoạt khóa Redisson tức thì khi phát sinh xung đột số dư hoặc chữ ký không hợp lệ.',
                      })}
                    </small>
                  </div>
                  <InputSwitch
                    checked={globalSettings.autoLockSuspicious}
                    onChange={(e) =>
                      setGlobalSettings({ ...globalSettings, autoLockSuspicious: e.value || false })
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── FULL WIDTH BOTTOM CARD: Lobby Display Priority Matrix ── */}
        <div className="col-12">
          <div className="card shadow-1 border-round-lg surface-card p-4 border-1 border-200">
            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-3 mb-3">
              <div>
                <h5 className="m-0 font-bold text-900">
                  {t('game_hub.section_matrix_title', {
                    defaultValue: 'Danh Sách & Thứ Tự Ưu Tiên Trò Chơi Trên Sảnh Webview',
                  })}
                </h5>
                <p className="text-500 text-xs mt-1 mb-0">
                  {t('game_hub.section_matrix_desc', {
                    defaultValue:
                      'Quản trị vị trí xuất hiện, huy hiệu nổi bật và trạng thái mở từng trò chơi trên giao diện Sảnh Game.',
                  })}
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
                  label={t('game.game_list', { defaultValue: 'Danh mục Trò chơi & Tham số' })}
                  icon="pi pi-external-link"
                  outlined
                  onClick={() => navigate(paths.gameManagement)}
                />
              </div>
            </div>

            <DataTable<any>
              value={games}
              dataKey="id"
              paginator
              rows={10}
              stripedRows
              responsiveLayout="scroll"
              globalFilter={globalFilter}
              loading={isLoading}
              emptyMessage={t('common.no_data', { defaultValue: 'Không có dữ liệu trò chơi' })}
            >
              <Column
                header={t('common.stt', { defaultValue: 'STT' })}
                body={(_, options) => options.rowIndex + 1}
                style={{ width: '3.5rem', textAlign: 'center' }}
              />
              <Column
                header={t('game_hub.game_name', { defaultValue: 'TÊN TRÒ CHƠI' })}
                body={gameInfoTemplate}
                style={{ minWidth: '15rem' }}
              />
              <Column
                header={t('game_hub.game_category', { defaultValue: 'THỂ LOẠI' })}
                body={categoryTextTemplate}
                style={{ minWidth: '11rem' }}
              />
              <Column
                header={t('game_hub.turn_price', { defaultValue: 'GIÁ LƯỢT' })}
                body={(row: GameItem) => (
                  <span className="text-sm text-700">
                    {row.pricePerTurn || 10} Pts • {row.pricePerTurnHtg || 10} HTG
                  </span>
                )}
                style={{ minWidth: '9rem' }}
              />
              <Column
                header={t('game_hub.lobby_order', { defaultValue: 'THỨ TỰ SẢNH' })}
                body={lobbyOrderTemplate}
                style={{ width: '7rem', textAlign: 'center' }}
              />
              <Column
                header={t('game_hub.lobby_badge', { defaultValue: 'HUY HIỆU SẢNH' })}
                body={lobbyBadgeTemplate}
                style={{ minWidth: '8rem', textAlign: 'center' }}
              />
              <Column
                header={t('game_hub.lobby_visibility', { defaultValue: 'HIỂN THỊ SẢNH' })}
                body={lobbyVisibilityTemplate}
                style={{ minWidth: '9rem', textAlign: 'center' }}
              />
              <Column
                header={t('common.actions', { defaultValue: 'THAO TÁC' })}
                body={actionTemplate}
                style={{ width: '12rem', textAlign: 'center' }}
              />
            </DataTable>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameHubConfigPage;
