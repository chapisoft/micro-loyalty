import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
import { StandardPageHeader } from '@/components/StandardPageHeader';

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
    pointsPerTurnExchange: 0,
    goldenHourEnabled: false,
    goldenHourMultiplier: 1,
    goldenHourSchedule: '',
    maintenanceMode: false,
    maintenanceNotice: '',
    maxDailyTurnsPerUser: 0,
    defaultDailyFreeTurns: 0,
    globalDailyBudgetLimit: 0,
    welcomeBannerText: '',
    welcomeBannerTextEn: '',
    welcomeBannerTextFr: '',
    welcomeBannerTextHt: '',
    lobbyBannerUrl: '',
    lobbyCtaText: '',
    soundEffectsEnabled: false,
    cooldownSeconds: 0,
    maxTurnsPerDeviceDaily: 0,
    autoLockSuspicious: false,
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
          pointsPerTurnExchange: configData.pointsPerTurnExchange ?? 0,
          goldenHourEnabled: Boolean(configData.goldenHourEnabled),
          maintenanceMode: Boolean(configData.maintenanceMode),
          maxDailyTurnsPerUser: configData.maxDailyTurnsPerUser ?? 0,
          welcomeBannerText: configData.welcomeBannerText || prev.welcomeBannerText,
        }));
      }

      if (Array.isArray(gamesData) && gamesData.length > 0) {
        setGames(
          gamesData.map((g: any, index: number) => ({
            ...g,
            displayOrder: g.displayOrder ?? index + 1,
            lobbyBadge: g.lobbyBadge ?? (index === 0 ? 'HOT' : index === 1 ? 'NEW' : 'NORMAL'),
            lobbyVisible: g.status === CommonStatus.ACTIVE,
          }))
        );
      } else {
        setGames([]);
      }
    } catch (e) {
      console.error('[GameHubConfigPage] Load data error:', e);
      toast.current?.show({
        severity: 'error',
        summary: t('toast.error'),
        detail: t('toast.generic_error'),
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
        summary: t('toast.success'),
        detail: t('game_hub.save_success'),
      });
      await loadData();
    } catch (e) {
      console.error('[handleSaveGlobalSettings] Error:', e);
      toast.current?.show({
        severity: 'error',
        summary: t('toast.error'),
        detail: t('game_hub.save_failed'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeGamesCount = games.filter((g) => g.status === CommonStatus.ACTIVE).length;

  const multiplierOptions = useMemo(() => [
    { label: t('game_hub.multiplier_2x'), value: 2 },
    { label: t('game_hub.multiplier_3x'), value: 3 },
    { label: t('game_hub.multiplier_5x'), value: 5 },
  ], [t]);

  // Render text thuần cho thể loại không dùng style màu mè
  const categoryTextTemplate = (rowData: GameItem) => {
    const label = rowData.category
      ? t(`game.cat_${rowData.category.toLowerCase()}`)
      : '-';
    return <span className="text-700">{label}</span>;
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
      return <span className="text-orange-600 font-bold text-xs">{t('game_hub.badge_event')}</span>;
    }
    return <span className="text-400 text-xs">{t('game_hub.badge_normal')}</span>;
  };

  // Render text thuần cho trạng thái hiển thị
  const lobbyVisibilityTemplate = (rowData: GameItem) => {
    return rowData.lobbyVisible ? (
      <span className="text-green-600 font-medium text-xs">{t('game_hub.visibility_visible')}</span>
    ) : (
      <span className="text-500 text-xs">{t('game_hub.visibility_hidden')}</span>
    );
  };

  const gameInfoTemplate = (rowData: GameItem) => {
    return (
      <div className="flex align-items-center gap-2">
        <div>
          <div className="font-bold text-sm text-900">{rowData.gameName}</div>
          <div className="font-mono text-xs font-bold text-900">{rowData.gameCode}</div>
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
          <span>{t('game_hub.action_prizes')}</span>
        </button>
      </div>
    );
  };

  return (
    <div className="game-hub-config-page">
      <Toast ref={toast} />

      <AppBreadcrumb
        items={[
          { label: t('nav.rewards_games') },
          { label: t('nav.game_hub_config') },
        ]}
      />

      <StandardPageHeader
        title={t('game_hub.title')}
        subtitle={t('game_hub.subtitle')}
        primaryAction={{
          label: t('game_hub.save_config', 'Lưu cấu hình'),
          icon: 'pi pi-save',
          onClick: handleSaveGlobalSettings,
          loading: isSubmitting,
        }}
        onRefresh={loadData}
        refreshLoading={isLoading}
      />

      {/* ── KPI STATS CARDS ── */}
      <div className="grid mb-4">
        {/* KPI 1: Active Games */}
        <div className="col-12 sm:col-6 lg:col-3">
          <div className="card mb-0 shadow-1 border-round-lg surface-card p-3 border-1 border-200 h-full">
            <div className="flex justify-content-between align-items-center mb-2">
              <div>
                <span className="block text-600 font-medium text-xs mb-1">
                  {t('game_hub.kpi_active_games_title')}
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
              {t('game_hub.kpi_active_games_sub')}
            </span>
          </div>
        </div>

        {/* KPI 2: Exchange Rate */}
        <div className="col-12 sm:col-6 lg:col-3">
          <div className="card mb-0 shadow-1 border-round-lg surface-card p-3 border-1 border-200 h-full">
            <div className="flex justify-content-between align-items-center mb-2">
              <div>
                <span className="block text-600 font-medium text-xs mb-1">
                  {t('game_hub.kpi_exchange_rate_title')}
                </span>
                <div className="text-900 font-bold text-2xl font-mono tracking-tight">
                  {globalSettings.pointsPerTurnExchange} {t('game_hub.points_unit')}
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
              {t('game_hub.kpi_exchange_rate_sub')}
            </span>
          </div>
        </div>

        {/* KPI 3: Daily Cap */}
        <div className="col-12 sm:col-6 lg:col-3">
          <div className="card mb-0 shadow-1 border-round-lg surface-card p-3 border-1 border-200 h-full">
            <div className="flex justify-content-between align-items-center mb-2">
              <div>
                <span className="block text-600 font-medium text-xs mb-1">
                  {t('game_hub.kpi_daily_limit_title')}
                </span>
                <div className="text-900 font-bold text-2xl font-mono tracking-tight">
                  {globalSettings.maxDailyTurnsPerUser} {t('game_hub.turns_unit')}
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
              {t('game_hub.kpi_daily_limit_sub')}
            </span>
          </div>
        </div>

        {/* KPI 4: Lobby Status */}
        <div className="col-12 sm:col-6 lg:col-3">
          <div className="card mb-0 shadow-1 border-round-lg surface-card p-3 border-1 border-200 h-full">
            <div className="flex justify-content-between align-items-center mb-2">
              <div>
                <span className="block text-600 font-medium text-xs mb-1">
                  {t('game_hub.kpi_lobby_status_title')}
                </span>
                <div className="text-900 font-bold text-2xl tracking-tight">
                  {globalSettings.maintenanceMode
                    ? t('game_hub.kpi_lobby_status_maintenance')
                    : globalSettings.goldenHourEnabled
                    ? t('game_hub.kpi_lobby_status_golden')
                    : t('game_hub.kpi_lobby_status_active')}
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
              {t('game_hub.jsbridge_status')}
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
              {t('game_hub.section_economy_title')}
            </h5>
            <p className="text-500 text-xs mb-4">
              {t('game_hub.section_economy_desc')}
            </p>

            <div className="grid">
              <div className="col-12 sm:col-6 field mb-3">
                <label htmlFor="pointsPerTurnExchange" className="font-bold text-xs block mb-1">
                  {t('game_hub.points_per_turn')}
                </label>
                <InputNumber
                  id="pointsPerTurnExchange"
                  value={globalSettings.pointsPerTurnExchange}
                  onValueChange={(e) =>
                    setGlobalSettings({ ...globalSettings, pointsPerTurnExchange: e.value ?? 0 })
                  }
                  suffix={` ${t('game_hub.points_unit')}`}
                  min={1}
                  max={10000}
                  className="w-full"
                />
                <small className="text-500 block mt-1">
                  {t('game_hub.points_per_turn_help')}
                </small>
              </div>

              <div className="col-12 sm:col-6 field mb-3">
                <label htmlFor="maxDailyTurnsPerUser" className="font-bold text-xs block mb-1">
                  {t('game_hub.max_daily_turns')}
                </label>
                <InputNumber
                  id="maxDailyTurnsPerUser"
                  value={globalSettings.maxDailyTurnsPerUser}
                  onValueChange={(e) =>
                    setGlobalSettings({ ...globalSettings, maxDailyTurnsPerUser: e.value ?? 0 })
                  }
                  suffix={` ${t('game_hub.turns_unit')}`}
                  min={1}
                  max={500}
                  className="w-full"
                />
                <small className="text-500 block mt-1">
                  {t('game_hub.max_daily_turns_help')}
                </small>
              </div>

              <div className="col-12 sm:col-6 field mb-3">
                <label htmlFor="defaultDailyFreeTurns" className="font-bold text-xs block mb-1">
                  {t('game_hub.daily_free_turns')}
                </label>
                <InputNumber
                  id="defaultDailyFreeTurns"
                  value={globalSettings.defaultDailyFreeTurns}
                  onValueChange={(e) =>
                    setGlobalSettings({ ...globalSettings, defaultDailyFreeTurns: e.value ?? 0 })
                  }
                  suffix={` ${t('game_hub.turns_day_unit')}`}
                  min={0}
                  max={10}
                  className="w-full"
                />
                <small className="text-500 block mt-1">
                  {t('game_hub.daily_free_turns_help')}
                </small>
              </div>

              <div className="col-12 sm:col-6 field mb-3">
                <label htmlFor="globalDailyBudgetLimit" className="font-bold text-xs block mb-1">
                  {t('game_hub.global_daily_budget')}
                </label>
                <InputNumber
                  id="globalDailyBudgetLimit"
                  value={globalSettings.globalDailyBudgetLimit}
                  onValueChange={(e) =>
                    setGlobalSettings({ ...globalSettings, globalDailyBudgetLimit: e.value ?? 0 })
                  }
                  suffix={` ${t('game_hub.htg_day_unit')}`}
                  min={0}
                  className="w-full"
                />
                <small className="text-500 block mt-1">
                  {t('game_hub.global_daily_budget_help')}
                </small>
              </div>
            </div>
          </div>

          {/* Card 2: Lobby Operations & Events */}
          <div className="card shadow-1 border-round-lg surface-card p-4 border-1 border-200 h-full">
            <h5 className="m-0 font-bold text-900 mb-1">
              {t('game_hub.section_ops_title')}
            </h5>
            <p className="text-500 text-xs mb-4">
              {t('game_hub.section_ops_desc')}
            </p>

            <div className="flex flex-column gap-3">
              {/* Golden Hour Row */}
              <div className="p-3 border-round surface-50 border-1 border-200">
                <div className="flex align-items-center justify-content-between mb-2">
                  <div>
                    <span className="font-bold text-sm text-900 block">
                      {t('game_hub.golden_hour_toggle')}
                    </span>
                    <small className="text-500">
                      {t('game_hub.golden_hour_help')}
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
                        {t('game_hub.golden_hour_multiplier')}
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
                        {t('game_hub.golden_hour_schedule')}
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
                      {t('game_hub.maintenance_toggle')}
                    </span>
                    <small className="text-500">
                      {t('game_hub.maintenance_help')}
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
                      {t('game_hub.maintenance_message')}
                    </label>
                    <InputTextarea
                      rows={2}
                      value={globalSettings.maintenanceNotice}
                      onChange={(e) =>
                        setGlobalSettings({ ...globalSettings, maintenanceNotice: e.target.value })
                      }
                      className="w-full text-sm"
                      placeholder={t('game_hub.maintenance_message_placeholder')}
                    />
                  </div>
                )}
              </div>

              {/* Sound & Graphic Effects */}
              <div className="p-3 border-round surface-50 border-1 border-200 flex align-items-center justify-content-between">
                <div>
                  <span className="font-bold text-sm text-900 block">
                    {t('game_hub.sound_effects_toggle')}
                  </span>
                  <small className="text-500">
                    {t('game_hub.sound_effects_help')}
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
              {t('game_hub.section_ui_title')}
            </h5>
            <p className="text-500 text-xs mb-4">
              {t('game_hub.section_ui_desc')}
            </p>

            <div className="grid">
              <div className="col-12 field mb-3">
                <label htmlFor="welcomeVi" className="font-bold text-xs block mb-1">
                  {t('game_hub.welcome_message_vi')}
                </label>
                <InputText
                  id="welcomeVi"
                  value={globalSettings.welcomeBannerText}
                  onChange={(e) =>
                    setGlobalSettings({ ...globalSettings, welcomeBannerText: e.target.value })
                  }
                  className="w-full"
                  placeholder={t('game_hub.welcome_placeholder')}
                />
              </div>

              <div className="col-12 field mb-3">
                <label htmlFor="welcomeEn" className="font-bold text-xs block mb-1">
                  {t('game_hub.welcome_message_en')}
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
                  {t('game_hub.welcome_message_fr')}
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
                  {t('game_hub.welcome_message_ht')}
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
                  {t('game_hub.banner_url')}
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
                  {t('game_hub.lobby_cta_text')}
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
              {t('game_hub.section_security_title')}
            </h5>
            <p className="text-500 text-xs mb-4">
              {t('game_hub.section_security_desc')}
            </p>

            <div className="grid">
              <div className="col-12 sm:col-6 field mb-3">
                <label htmlFor="cooldownSeconds" className="font-bold text-xs block mb-1">
                  {t('game_hub.cooldown_seconds')}
                </label>
                <InputNumber
                  id="cooldownSeconds"
                  value={globalSettings.cooldownSeconds}
                  onValueChange={(e) =>
                    setGlobalSettings({ ...globalSettings, cooldownSeconds: e.value ?? 0 })
                  }
                  suffix={` ${t('game_hub.cooldown_unit')}`}
                  min={1}
                  max={30}
                  className="w-full"
                />
                <small className="text-500 block mt-1">
                  {t('game_hub.cooldown_help')}
                </small>
              </div>

              <div className="col-12 sm:col-6 field mb-3">
                <label htmlFor="maxTurnsPerDeviceDaily" className="font-bold text-xs block mb-1">
                  {t('game_hub.max_device_spins')}
                </label>
                <InputNumber
                  id="maxTurnsPerDeviceDaily"
                  value={globalSettings.maxTurnsPerDeviceDaily}
                  onValueChange={(e) =>
                    setGlobalSettings({ ...globalSettings, maxTurnsPerDeviceDaily: e.value ?? 0 })
                  }
                  suffix={` ${t('game_hub.max_spins_unit')}`}
                  min={5}
                  max={1000}
                  className="w-full"
                />
                <small className="text-500 block mt-1">
                  {t('game_hub.max_device_spins_help')}
                </small>
              </div>

              <div className="col-12 field mb-0">
                <div className="p-3 border-round surface-50 border-1 border-200 flex align-items-center justify-content-between">
                  <div>
                    <span className="font-bold text-sm text-900 block">
                      {t('game_hub.auto_lock_suspicious')}
                    </span>
                    <small className="text-500">
                      {t('game_hub.auto_lock_help')}
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
                  {t('game_hub.section_matrix_title')}
                </h5>
                <p className="text-500 text-xs mt-1 mb-0">
                  {t('game_hub.section_matrix_desc')}
                </p>
              </div>
              <div className="flex gap-2">
                <span className="p-input-icon-left">
                  <i className="pi pi-search" />
                  <InputText
                    type="search"
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    placeholder={t('common.search')}
                    className="p-inputtext-sm"
                  />
                </span>
                <Button
                  label={t('game.game_list')}
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
              emptyMessage={t('common.no_data')}
            >
              <Column
                header={t('common.order_number', 'STT')}
                body={(_, options) => options.rowIndex + 1}
                style={{ width: '4rem', textAlign: 'center' }}
              />
              <Column
                header={t('common.action', 'Thao tác')}
                body={actionTemplate}
                style={{ width: '8rem', textAlign: 'center' }}
              />
              <Column
                header={t('game_hub.game_name')}
                body={gameInfoTemplate}
                style={{ minWidth: '15rem' }}
              />
              <Column
                header={t('game_hub.game_category')}
                body={categoryTextTemplate}
                style={{ minWidth: '11rem' }}
              />
              <Column
                header={t('game_hub.turn_price')}
                body={(row: GameItem) => (
                  <span className="text-sm text-700">
                    {row.pricePerTurn || 10} Pts • {row.pricePerTurnHtg || 10} HTG
                  </span>
                )}
                style={{ minWidth: '9rem' }}
              />
              <Column
                header={t('game_hub.lobby_order')}
                body={lobbyOrderTemplate}
                style={{ width: '7rem', textAlign: 'center' }}
              />
              <Column
                header={t('game_hub.lobby_badge')}
                body={lobbyBadgeTemplate}
                style={{ minWidth: '8rem', textAlign: 'center' }}
              />
              <Column
                header={t('game_hub.lobby_visibility')}
                body={lobbyVisibilityTemplate}
                style={{ minWidth: '9rem', textAlign: 'center' }}
              />
            </DataTable>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameHubConfigPage;
