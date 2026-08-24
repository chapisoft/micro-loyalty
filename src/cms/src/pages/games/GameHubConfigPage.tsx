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
import { ProgressBar } from 'primereact/progressbar';
import { InputSwitch } from 'primereact/inputswitch';
import { AppBreadcrumb } from 'components';
import { CommonStatus } from '@/models';
import { LoyaltyService } from '@/service/loyalty.service';

interface WheelPrizeItem {
  id: number;
  displayOrder: number;
  prizeName: string;
  prizeType: string;
  prizeValue: number;
  probabilityWeight: number;
  dailyBudgetLimit: number;
  dailyMaxWinners: number;
  colorCode: string;
  status: CommonStatus;
  actualWinCountToday?: number;
}

interface GameHubGlobalSettings {
  pointsPerTurnExchange: number;
  goldenHourMultiplierEnabled: boolean;
  gameHubMaintenanceMode: boolean;
  maxDailyTurnsPerUser: number;
  welcomeBannerText: string;
}

export const GameHubConfigPage: React.FC = () => {
  const { t } = useTranslation();
  const [selectedTenant, setSelectedTenant] = useState('TENANT_NATCASH');
  const [prizes, setPrizes] = useState<WheelPrizeItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPrizes, setSelectedPrizes] = useState<WheelPrizeItem[]>([]);
  const [showPrizeDialog, setShowPrizeDialog] = useState(false);
  const [prizeFormData, setPrizeFormData] = useState<Partial<WheelPrizeItem>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Global settings state
  const [globalSettings, setGlobalSettings] = useState<GameHubGlobalSettings>({
    pointsPerTurnExchange: 50,
    goldenHourMultiplierEnabled: true,
    gameHubMaintenanceMode: false,
    maxDailyTurnsPerUser: 10,
    welcomeBannerText: 'Tham gia minigame mỗi ngày nhận quà siêu khủng từ Natcash!',
  });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [prizesData, configData] = await Promise.all([
        LoyaltyService.getWheelPrizes(selectedTenant),
        LoyaltyService.getGlobalGameConfig(selectedTenant),
      ]);
      if (Array.isArray(prizesData) && prizesData.length > 0) {
        setPrizes(prizesData);
      } else {
        setPrizes([]);
      }
      if (configData) {
        setGlobalSettings({
          pointsPerTurnExchange: configData.pointsPerTurnExchange ?? 50,
          goldenHourMultiplierEnabled: configData.goldenHourEnabled ?? true,
          gameHubMaintenanceMode: configData.maintenanceMode ?? false,
          maxDailyTurnsPerUser: configData.maxDailyTurnsPerUser ?? 10,
          welcomeBannerText: configData.welcomeBannerText || 'Tham gia minigame mỗi ngày nhận quà siêu khủng từ Natcash!',
        });
      }
    } catch (e) {
      console.error('[GameHubConfigPage] Load data error:', e);
    } finally {
      setIsLoading(false);
    }
  }, [selectedTenant]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalProbability = prizes
    .filter((p) => p.status === CommonStatus.ACTIVE)
    .reduce((sum, item) => sum + (item.probabilityWeight || 0), 0);

  const isProbabilityBalanced = totalProbability === 100;
  const activePrizesCount = prizes.filter((p) => p.status === CommonStatus.ACTIVE).length;
  const totalDailyBudget = prizes.reduce((sum, item) => sum + (item.dailyBudgetLimit || 0), 0);

  const openNewPrize = () => {
    setPrizeFormData({
      displayOrder: prizes.length + 1,
      prizeName: '',
      prizeType: 'POINTS',
      prizeValue: 100,
      probabilityWeight: 10,
      dailyBudgetLimit: 20000,
      dailyMaxWinners: 100,
      colorCode: '#FF6B00',
      status: CommonStatus.ACTIVE,
    });
    setShowPrizeDialog(true);
  };

  const editPrize = (prize: WheelPrizeItem) => {
    setPrizeFormData({ ...prize });
    setShowPrizeDialog(true);
  };

  const savePrize = async () => {
    setIsSubmitting(true);
    try {
      await LoyaltyService.saveWheelPrize(prizeFormData, selectedTenant);
      await loadData();
      setShowPrizeDialog(false);
    } catch (e) {
      console.error('[savePrize] Error:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAutoBalanceProbability = async () => {
    setIsSubmitting(true);
    try {
      const res = await LoyaltyService.autoBalanceWheelPrizes(selectedTenant);
      if (res && Array.isArray(res.prizes)) {
        setPrizes(res.prizes);
      } else {
        await loadData();
      }
    } catch (e) {
      console.error('[handleAutoBalanceProbability] Error:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveGlobalSettings = async () => {
    setIsSubmitting(true);
    try {
      await LoyaltyService.saveGlobalGameConfig(
        {
          pointsPerTurnExchange: globalSettings.pointsPerTurnExchange,
          goldenHourEnabled: globalSettings.goldenHourMultiplierEnabled,
          maintenanceMode: globalSettings.gameHubMaintenanceMode,
          maxDailyTurnsPerUser: globalSettings.maxDailyTurnsPerUser,
          welcomeBannerText: globalSettings.welcomeBannerText,
        },
        selectedTenant
      );
      await loadData();
    } catch (e) {
      console.error('[handleSaveGlobalSettings] Error:', e);
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

  const prizeTypeTemplate = (type: string) => {
    switch (type) {
      case 'POINTS':
        return <Tag severity="warning" value="Điểm Thưởng" icon="pi pi-star-fill" />;
      case 'VOUCHER':
        return <Tag severity="info" value="Voucher Giảm Giá" icon="pi pi-ticket" />;
      case 'CASHBACK':
        return <Tag severity="success" value="Tiền Mặt Ví" icon="pi pi-wallet" />;
      case 'TURNS':
        return <Tag severity="help" value="Thêm Lượt Quay" icon="pi pi-bolt" />;
      default:
        return <Tag severity="secondary" value="Chúc May Mắn" icon="pi pi-face-smile" />;
    }
  };

  const probabilityBarTemplate = (row: WheelPrizeItem) => {
    return (
      <div className="flex align-items-center gap-2" style={{ minWidth: '8rem' }}>
        <ProgressBar value={row.probabilityWeight} showValue={false} style={{ height: '8px', flex: 1 }} />
        <span className="font-bold text-xs font-mono">{row.probabilityWeight}%</span>
      </div>
    );
  };

  const colorBadgeTemplate = (row: WheelPrizeItem) => {
    return (
      <div className="flex align-items-center gap-2">
        <span className="border-circle inline-block shadow-1" style={{ width: '1.25rem', height: '1.25rem', backgroundColor: row.colorCode, border: '2px solid #fff' }} />
        <span className="font-mono text-xs">{row.colorCode}</span>
      </div>
    );
  };

  const prizeTypeOptions = [
    { label: 'Điểm Thưởng Loyalty (POINTS)', value: 'POINTS' },
    { label: 'Voucher Đối Tác (VOUCHER)', value: 'VOUCHER' },
    { label: 'Tiền Mặt Ví Điện Tử (CASHBACK)', value: 'CASHBACK' },
    { label: 'Lượt Quay Miễn Phí (TURNS)', value: 'TURNS' },
    { label: 'Chúc May Mắn Lần Sau (NO_LUCK)', value: 'NO_LUCK' },
  ];

  const statusOptions = [
    { label: t('common.active', { defaultValue: 'Đang áp dụng' }), value: CommonStatus.ACTIVE },
    { label: t('common.inactive', { defaultValue: 'Tạm dừng' }), value: CommonStatus.INACTIVE },
  ];

  return (
    <div className="game-hub-config-page">
      <AppBreadcrumb
        items={[
          { label: t('nav.rewards_games', { defaultValue: 'Khuyến mãi & Game' }) },
          { label: t('nav.game_hub_config', { defaultValue: 'Cấu hình Chung Cổng Game & Vòng Quay' }) },
        ]}
      />

      {/* ── KPI METRIC CARDS ── */}
      <div className="grid mb-4">
        <div className="col-12 md:col-3">
          <div className="card mb-0 shadow-2 border-round-xl surface-card p-3 border-left-3 border-purple-500">
            <div className="flex justify-content-between align-items-center mb-2">
              <div>
                <span className="block text-600 font-bold text-xs mb-1 uppercase tracking-wide">{t('game.total_probability', { defaultValue: 'Tổng trọng số xác suất:' })}</span>
                <div className={`font-black text-2xl tracking-tight ${isProbabilityBalanced ? 'text-purple-600' : 'text-red-600'}`}>
                  {totalProbability}%
                </div>
              </div>
              <div
                className="flex align-items-center justify-content-center border-round-xl shadow-2 flex-shrink-0"
                style={{
                  width: '3.25rem',
                  height: '3.25rem',
                  background: isProbabilityBalanced
                    ? 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)'
                    : 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                }}
              >
                <i className={`pi ${isProbabilityBalanced ? 'pi-check-circle' : 'pi-exclamation-triangle'} text-white text-2xl font-bold`} />
              </div>
            </div>
            <span className={`font-bold text-xs flex align-items-center gap-1 ${isProbabilityBalanced ? 'text-purple-600' : 'text-red-600'}`}>
              <i className={`pi ${isProbabilityBalanced ? 'pi-check' : 'pi-times'} text-xs font-bold`} />
              {isProbabilityBalanced ? t('game.probability_balanced', { defaultValue: 'Trọng số đã cân bằng 100%' }) : t('game.probability_unbalanced', { defaultValue: 'Chưa đủ 100%' })}
            </span>
          </div>
        </div>

        <div className="col-12 md:col-3">
          <div className="card mb-0 shadow-2 border-round-xl surface-card p-3 border-left-3 border-green-500">
            <div className="flex justify-content-between align-items-center mb-2">
              <div>
                <span className="block text-600 font-bold text-xs mb-1 uppercase tracking-wide">{t('game.today_cost', { defaultValue: 'Tổng ngân sách ngày' })}</span>
                <div className="text-900 font-black text-2xl font-mono tracking-tight text-green-600">{totalDailyBudget.toLocaleString()} HTG</div>
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
            <span className="text-600 font-medium text-xs">Quản lý quỹ giải thưởng tự động</span>
          </div>
        </div>

        <div className="col-12 md:col-3">
          <div className="card mb-0 shadow-2 border-round-xl surface-card p-3 border-left-3 border-blue-500">
            <div className="flex justify-content-between align-items-center mb-2">
              <div>
                <span className="block text-600 font-bold text-xs mb-1 uppercase tracking-wide">Số Ô Thưởng Hoạt Động</span>
                <div className="text-900 font-black text-2xl tracking-tight text-blue-600">{activePrizesCount} Ô Thưởng</div>
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
              <i className="pi pi-check text-xs font-bold" /> Nan quạt 3D sẵn sàng
            </span>
          </div>
        </div>

        <div className="col-12 md:col-3">
          <div className="card mb-0 shadow-2 border-round-xl surface-card p-3 border-left-3 border-orange-500">
            <div className="flex justify-content-between align-items-center mb-2">
              <div>
                <span className="block text-600 font-bold text-xs mb-1 uppercase tracking-wide">Giới Hạn Lượt/Hội Viên</span>
                <div className="text-900 font-black text-2xl font-mono tracking-tight text-orange-600">{globalSettings.maxDailyTurnsPerUser} Lượt/Ngày</div>
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
              <i className="pi pi-shield text-xs font-bold" /> Khống chế gian lận
            </span>
          </div>
        </div>
      </div>

      {/* ── SECTION 1: GLOBAL GAMEHUB PARAMETERS CONFIGURATION ── */}
      <div className="card shadow-1 border-round-xl surface-card p-4 mb-4">
        <div className="flex justify-content-between align-items-center mb-3">
          <div>
            <h4 className="m-0 text-primary font-bold">{t('game.global_config_title', { defaultValue: 'Cấu hình Tham số Chung Toàn Cổng Game' })}</h4>
            <p className="text-500 text-xs mt-1 mb-0">Thiết lập các quy tắc đổi điểm, giới hạn lượt chơi và chế độ vận hành chung cho toàn bộ Webview Game.</p>
          </div>
          <Button label="Lưu Cấu Hình Chung" icon="pi pi-save" onClick={handleSaveGlobalSettings} loading={isSubmitting} />
        </div>

        <div className="grid">
          <div className="col-12 md:col-4">
            <label htmlFor="pointsPerTurn" className="font-bold block mb-1">Quy đổi Điểm sang Lượt chơi</label>
            <div className="p-inputgroup">
              <InputNumber
                id="pointsPerTurn"
                value={globalSettings.pointsPerTurnExchange}
                onValueChange={(e) => setGlobalSettings({ ...globalSettings, pointsPerTurnExchange: e.value ?? 50 })}
              />
              <span className="p-inputgroup-addon font-bold">Điểm / Lượt</span>
            </div>
            <small className="text-500">Số điểm hội viên cần tiêu để mua 1 lượt chơi minigame.</small>
          </div>

          <div className="col-12 md:col-4">
            <label htmlFor="maxDailyTurns" className="font-bold block mb-1">Giới hạn mua lượt tối đa / ngày</label>
            <div className="p-inputgroup">
              <InputNumber
                id="maxDailyTurns"
                value={globalSettings.maxDailyTurnsPerUser}
                onValueChange={(e) => setGlobalSettings({ ...globalSettings, maxDailyTurnsPerUser: e.value ?? 10 })}
              />
              <span className="p-inputgroup-addon font-bold">Lượt / ngày</span>
            </div>
            <small className="text-500">Khống chế số lượt mua tối đa mỗi tài khoản mỗi ngày.</small>
          </div>

          <div className="col-12 md:col-4">
            <label className="font-bold block mb-2">Chế độ vận hành đặc biệt</label>
            <div className="flex align-items-center justify-content-between p-2 border-1 surface-border border-round mb-2">
              <span className="text-sm font-semibold">Khung Giờ Vàng (x2 Lượt)</span>
              <InputSwitch
                checked={globalSettings.goldenHourMultiplierEnabled}
                onChange={(e) => setGlobalSettings({ ...globalSettings, goldenHourMultiplierEnabled: e.value })}
              />
            </div>
            <div className="flex align-items-center justify-content-between p-2 border-1 surface-border border-round">
              <span className="text-sm font-semibold text-red-600">Bảo trì toàn bộ Cổng Game</span>
              <InputSwitch
                checked={globalSettings.gameHubMaintenanceMode}
                onChange={(e) => setGlobalSettings({ ...globalSettings, gameHubMaintenanceMode: e.value })}
              />
            </div>
          </div>

          <div className="col-12">
            <label htmlFor="welcomeBanner" className="font-bold block mb-1">Thông điệp chào mừng sảnh Game Webview</label>
            <InputText
              id="welcomeBanner"
              value={globalSettings.welcomeBannerText}
              onChange={(e) => setGlobalSettings({ ...globalSettings, welcomeBannerText: e.target.value })}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* ── SECTION 2: LUCKY WHEEL PRIZE MATRIX & PROBABILITY ── */}
      <div className="card shadow-1 border-round-xl surface-card p-4">
        <div className="flex flex-column md:flex-row justify-content-between align-items-start md:align-items-center mb-3 gap-2">
          <div>
            <h4 className="m-0 text-primary font-bold">{t('game.wheel_matrix_title', { defaultValue: 'Cấu hình Ma Trận Xác Suất Trúng Thưởng & Ngân Sách Ô' })}</h4>
            <p className="text-500 text-xs mt-1 mb-0">Thiết lập tỷ lệ trúng cho từng nan quạt 3D. Tổng tỷ lệ trọng số phải đạt 100% để đảm bảo cân bằng tài chính.</p>
          </div>
          <div className="flex gap-2">
            {!isProbabilityBalanced && (
              <Button label="Tự Động Cân Bằng 100%" icon="pi pi-sliders-h" severity="warning" outlined onClick={handleAutoBalanceProbability} />
            )}
            <Button label={t('game.add_prize', { defaultValue: 'Thêm Ô Thưởng' })} icon="pi pi-plus" severity="success" onClick={openNewPrize} />
          </div>
        </div>

        {/* Probability Status Alert Banner */}
        <div className={`p-3 border-round-xl mb-3 flex align-items-center justify-content-between ${isProbabilityBalanced ? 'bg-green-50 border-1 border-green-200 text-green-900' : 'bg-red-50 border-1 border-red-200 text-red-900'}`}>
          <div className="flex align-items-center gap-2">
            <i className={`pi ${isProbabilityBalanced ? 'pi-check-circle text-green-600' : 'pi-exclamation-triangle text-red-600'} text-xl`} />
            <div>
              <span className="font-bold">{isProbabilityBalanced ? 'Ma trận xác suất hợp lệ:' : 'Ma trận chưa cân bằng:'} </span>
              <span>Tổng trọng số của các ô đang hoạt động là <strong>{totalProbability}%</strong> (Chuẩn: 100%).</span>
            </div>
          </div>
          <div className="font-bold text-lg font-mono">
            {totalProbability} / 100%
          </div>
        </div>

        <DataTable<any>
          value={prizes}
          selection={selectedPrizes}
          onSelectionChange={(e: any) => setSelectedPrizes(e.value || [])}
          dataKey="id"
          paginator
          rows={10}
          stripedRows
          responsiveLayout="scroll"
        >
          <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
          <Column header={t('common.stt', { defaultValue: 'STT' })} body={(_, options) => options.rowIndex + 1} style={{ width: '3.5rem', textAlign: 'center' }} />
          <Column
            body={(rowData: WheelPrizeItem) => (
              <div className="flex align-items-center justify-content-center">
                <Button icon="pi pi-pencil" rounded outlined severity="secondary" size="small" onClick={() => editPrize(rowData)} tooltip={t('common.edit', { defaultValue: 'Sửa' })} />
              </div>
            )}
            header={t('common.actions', { defaultValue: 'Thao tác' })}
            style={{ width: '5.5rem', textAlign: 'center' }}
          />
          <Column field="displayOrder" header={t('game.display_order', { defaultValue: 'Vị trí nan (1..8)' })} body={(r: WheelPrizeItem) => <span className="font-bold bg-slate-100 border-circle w-2rem h-2rem inline-flex align-items-center justify-content-center">{r.displayOrder}</span>} sortable style={{ minWidth: '7rem', textAlign: 'center' }} />
          <Column field="prizeName" header={t('game.prize_name', { defaultValue: 'Tên Giải thưởng' })} sortable style={{ minWidth: '14rem', fontWeight: 600 }} />
          <Column field="prizeType" header={t('game.prize_type', { defaultValue: 'Loại quà' })} body={(r: WheelPrizeItem) => prizeTypeTemplate(r.prizeType)} sortable style={{ minWidth: '11rem' }} />
          <Column field="prizeValue" header={t('game.prize_value', { defaultValue: 'Giá trị' })} body={(r: WheelPrizeItem) => <span className="font-mono font-bold">{r.prizeValue.toLocaleString()}</span>} sortable style={{ minWidth: '8rem', textAlign: 'right' }} />
          <Column field="probabilityWeight" header={t('game.probability_weight', { defaultValue: 'Tỷ lệ xác suất (%)' })} body={probabilityBarTemplate} sortable style={{ minWidth: '10rem' }} />
          <Column field="dailyBudgetLimit" header={t('game.daily_budget_limit', { defaultValue: 'Hạn mức ngày (HTG)' })} body={(row: WheelPrizeItem) => row.dailyBudgetLimit > 0 ? <span className="font-mono font-bold text-orange-600">{row.dailyBudgetLimit.toLocaleString()} HTG</span> : <Tag severity="info" value="Không giới hạn" />} sortable style={{ minWidth: '12rem' }} />
          <Column field="dailyMaxWinners" header={t('game.daily_max_winners', { defaultValue: 'Số giải tối đa/ngày' })} body={(row: WheelPrizeItem) => row.dailyMaxWinners > 0 ? `${row.dailyMaxWinners} giải` : 'Vô hạn'} sortable style={{ minWidth: '10rem', textAlign: 'center' }} />
          <Column field="colorCode" body={colorBadgeTemplate} header={t('game.color_code', { defaultValue: 'Màu nan quạt' })} style={{ minWidth: '9rem' }} />
          <Column field="status" body={(row: WheelPrizeItem) => statusTemplate(row.status)} header={t('common.status', { defaultValue: 'Trạng thái' })} sortable style={{ minWidth: '8rem' }} />
        </DataTable>
      </div>

      {/* ── DIALOG: WHEEL PRIZE CONFIGURATION ── */}
      <Dialog
        visible={showPrizeDialog}
        style={{ width: '500px' }}
        header={prizeFormData.id ? t('game.edit_prize', { defaultValue: 'Cập nhật Ô Thưởng Vòng Quay' }) : t('game.create_prize', { defaultValue: 'Thêm mới Ô Thưởng' })}
        modal
        className="p-fluid"
        onHide={() => setShowPrizeDialog(false)}
      >
        <div className="grid">
          <div className="col-12 md:col-6 field mb-3">
            <label htmlFor="displayOrder" className="font-bold">{t('game.display_order', { defaultValue: 'Vị trí nan (1..8)' })}</label>
            <InputNumber id="displayOrder" value={prizeFormData.displayOrder || 1} min={1} max={8} onValueChange={(e) => setPrizeFormData({ ...prizeFormData, displayOrder: e.value || 1 })} />
          </div>
          <div className="col-12 md:col-6 field mb-3">
            <label htmlFor="colorCode" className="font-bold">{t('game.color_code', { defaultValue: 'Mã màu Hex' })}</label>
            <div className="p-inputgroup">
              <span className="p-inputgroup-addon" style={{ backgroundColor: prizeFormData.colorCode || '#FF6B00', width: '2.5rem' }} />
              <InputText id="colorCode" value={prizeFormData.colorCode || '#FF6B00'} onChange={(e) => setPrizeFormData({ ...prizeFormData, colorCode: e.target.value })} />
            </div>
          </div>
        </div>

        <div className="field mb-3">
          <label htmlFor="prizeName" className="font-bold">{t('game.prize_name', { defaultValue: 'Tên Giải thưởng' })}</label>
          <InputText id="prizeName" value={prizeFormData.prizeName || ''} onChange={(e) => setPrizeFormData({ ...prizeFormData, prizeName: e.target.value })} placeholder="Ví dụ: 100 Điểm Thưởng" required />
        </div>

        <div className="grid">
          <div className="col-12 md:col-6 field mb-3">
            <label htmlFor="prizeType" className="font-bold">{t('game.prize_type', { defaultValue: 'Loại quà' })}</label>
            <Dropdown id="prizeType" value={prizeFormData.prizeType || 'POINTS'} options={prizeTypeOptions} onChange={(e) => setPrizeFormData({ ...prizeFormData, prizeType: e.value })} />
          </div>
          <div className="col-12 md:col-6 field mb-3">
            <label htmlFor="prizeValue" className="font-bold">{t('game.prize_value', { defaultValue: 'Giá trị' })}</label>
            <InputNumber id="prizeValue" value={prizeFormData.prizeValue || 0} onValueChange={(e) => setPrizeFormData({ ...prizeFormData, prizeValue: e.value || 0 })} />
          </div>
        </div>

        <div className="grid">
          <div className="col-12 md:col-6 field mb-3">
            <label htmlFor="probabilityWeight" className="font-bold">{t('game.probability_weight', { defaultValue: 'Tỷ lệ xác suất (%)' })}</label>
            <InputNumber id="probabilityWeight" value={prizeFormData.probabilityWeight || 0} min={0} max={100} onValueChange={(e) => setPrizeFormData({ ...prizeFormData, probabilityWeight: e.value || 0 })} />
          </div>
          <div className="col-12 md:col-6 field mb-3">
            <label htmlFor="dailyMaxWinners" className="font-bold">{t('game.daily_max_winners', { defaultValue: 'Số giải tối đa/ngày' })}</label>
            <InputNumber id="dailyMaxWinners" value={prizeFormData.dailyMaxWinners || 0} onValueChange={(e) => setPrizeFormData({ ...prizeFormData, dailyMaxWinners: e.value || 0 })} placeholder="0: Không giới hạn" />
          </div>
        </div>

        <div className="grid">
          <div className="col-12 md:col-6 field mb-3">
            <label htmlFor="dailyBudgetLimit" className="font-bold">{t('game.daily_budget_limit', { defaultValue: 'Hạn mức ngày (HTG)' })}</label>
            <InputNumber id="dailyBudgetLimit" value={prizeFormData.dailyBudgetLimit || 0} onValueChange={(e) => setPrizeFormData({ ...prizeFormData, dailyBudgetLimit: e.value || 0 })} placeholder="0: Không giới hạn" />
          </div>
          <div className="col-12 md:col-6 field mb-3">
            <label htmlFor="prizeStatus" className="font-bold">{t('common.status', { defaultValue: 'Trạng thái' })}</label>
            <Dropdown id="prizeStatus" value={prizeFormData.status || CommonStatus.ACTIVE} options={statusOptions} onChange={(e) => setPrizeFormData({ ...prizeFormData, status: e.value })} />
          </div>
        </div>

        <div className="flex justify-content-end gap-2 mt-4">
          <Button label={t('common.cancel', { defaultValue: 'Hủy' })} icon="pi pi-times" outlined onClick={() => setShowPrizeDialog(false)} disabled={isSubmitting} />
          <Button label={t('common.save', { defaultValue: 'Lưu thay đổi' })} icon="pi pi-check" onClick={savePrize} loading={isSubmitting} disabled={isSubmitting} />
        </div>
      </Dialog>
    </div>
  );
};

export default GameHubConfigPage;
