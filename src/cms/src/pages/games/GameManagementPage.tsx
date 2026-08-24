import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { TabView, TabPanel } from 'primereact/tabview';
import { ProgressBar } from 'primereact/progressbar';
import { InputSwitch } from 'primereact/inputswitch';
import { AppBreadcrumb } from 'components';
import { CommonStatus } from '@/models';

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
  status: CommonStatus;
  // Specific Game Parameters
  quizQuestionCount?: number;
  quizCountdownSec?: number;
  quizRewardPoints?: number;
  farmSeasonDays?: number;
  farmVoucherLimit?: number;
  diceMultiplierMax?: number;
}

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

interface SpinLogItem {
  id: number;
  phone: string;
  prizeName: string;
  prizeType: string;
  prizeValue: number;
  spinTime: string;
  transactionRef: string;
  status: string;
}

const INITIAL_GAMES: GameItem[] = [
  {
    id: 1,
    gameCode: 'LUCKY_WHEEL_2026',
    gameName: 'Vòng Quay May Mắn Tri Ân Khách Hàng',
    category: 'LUCKY_DRAW',
    pricePerTurn: 20,
    pricePerTurnHtg: 20,
    freeTurnsDaily: 2,
    dailyBudgetLimit: 50000,
    allowPointsSpin: true,
    gameUrl: '/wheel',
    status: CommonStatus.ACTIVE,
  },
  {
    id: 2,
    gameCode: 'SUPERMARKET_QUIZ',
    gameName: 'Đố Vui Trí Tuệ & Săn Điểm Thưởng',
    category: 'QUIZ',
    pricePerTurn: 10,
    pricePerTurnHtg: 10,
    freeTurnsDaily: 2,
    dailyBudgetLimit: 20000,
    allowPointsSpin: true,
    gameUrl: '/games/quiz',
    status: CommonStatus.ACTIVE,
    quizQuestionCount: 5,
    quizCountdownSec: 20,
    quizRewardPoints: 150,
  },
  {
    id: 3,
    gameCode: 'DELIMART_FARM',
    gameName: 'Nông Trại Delimart Đổi Nông Sản',
    category: 'FARM',
    pricePerTurn: 0,
    pricePerTurnHtg: 0,
    freeTurnsDaily: 1,
    dailyBudgetLimit: 30000,
    allowPointsSpin: false,
    gameUrl: '/games/farm',
    status: CommonStatus.ACTIVE,
    farmSeasonDays: 7,
    farmVoucherLimit: 5,
  },
  {
    id: 4,
    gameCode: 'LUCKY_DICE',
    gameName: 'Lắc Xí Ngầu Lễ Hội Mùa Màng',
    category: 'DICE',
    pricePerTurn: 15,
    pricePerTurnHtg: 15,
    freeTurnsDaily: 1,
    dailyBudgetLimit: 40000,
    allowPointsSpin: true,
    gameUrl: '/games/dice',
    status: CommonStatus.ACTIVE,
    diceMultiplierMax: 10,
  },
];

const INITIAL_PRIZES: WheelPrizeItem[] = [
  { id: 1, displayOrder: 1, prizeName: '100 Điểm Thưởng', prizeType: 'POINTS', prizeValue: 100, probabilityWeight: 25, dailyBudgetLimit: 50000, dailyMaxWinners: 500, colorCode: '#F59E0B', status: CommonStatus.ACTIVE, actualWinCountToday: 142 },
  { id: 2, displayOrder: 2, prizeName: 'Voucher 50 HTG', prizeType: 'VOUCHER', prizeValue: 50, probabilityWeight: 20, dailyBudgetLimit: 20000, dailyMaxWinners: 100, colorCode: '#EF4444', status: CommonStatus.ACTIVE, actualWinCountToday: 78 },
  { id: 3, displayOrder: 3, prizeName: 'Chúc Bạn May Mắn', prizeType: 'NO_LUCK', prizeValue: 0, probabilityWeight: 20, dailyBudgetLimit: 0, dailyMaxWinners: 0, colorCode: '#06B6D4', status: CommonStatus.ACTIVE, actualWinCountToday: 89 },
  { id: 4, displayOrder: 4, prizeName: '200 Điểm Thưởng', prizeType: 'POINTS', prizeValue: 200, probabilityWeight: 15, dailyBudgetLimit: 30000, dailyMaxWinners: 150, colorCode: '#3B82F6', status: CommonStatus.ACTIVE, actualWinCountToday: 55 },
  { id: 5, displayOrder: 5, prizeName: '500 HTG Tiền Mặt Ví', prizeType: 'CASHBACK', prizeValue: 500, probabilityWeight: 5, dailyBudgetLimit: 10000, dailyMaxWinners: 20, colorCode: '#10B981', status: CommonStatus.ACTIVE, actualWinCountToday: 12 },
  { id: 6, displayOrder: 6, prizeName: 'Thêm 1 Lượt Quay', prizeType: 'TURNS', prizeValue: 1, probabilityWeight: 15, dailyBudgetLimit: 15000, dailyMaxWinners: 300, colorCode: '#8B5CF6', status: CommonStatus.ACTIVE, actualWinCountToday: 64 },
];

const RECENT_SPIN_LOGS: SpinLogItem[] = [
  { id: 1, phone: '0987***123', prizeName: '500 HTG Tiền Mặt Ví', prizeType: 'CASHBACK', prizeValue: 500, spinTime: '24/08/2026 10:05:12', transactionRef: 'SPIN_994821', status: 'SUCCESS' },
  { id: 2, phone: '0976***456', prizeName: 'Voucher 50 HTG', prizeType: 'VOUCHER', prizeValue: 50, spinTime: '24/08/2026 10:04:30', transactionRef: 'SPIN_994820', status: 'SUCCESS' },
  { id: 3, phone: '0965***789', prizeName: '200 Điểm Thưởng', prizeType: 'POINTS', prizeValue: 200, spinTime: '24/08/2026 10:02:18', transactionRef: 'SPIN_994819', status: 'SUCCESS' },
  { id: 4, phone: '0988***999', prizeName: '100 Điểm Thưởng', prizeType: 'POINTS', prizeValue: 100, spinTime: '24/08/2026 10:01:05', transactionRef: 'SPIN_994818', status: 'SUCCESS' },
  { id: 5, phone: '0912***888', prizeName: 'Thêm 1 Lượt Quay', prizeType: 'TURNS', prizeValue: 1, spinTime: '24/08/2026 09:59:44', transactionRef: 'SPIN_994817', status: 'SUCCESS' },
  { id: 6, phone: '0933***111', prizeName: 'Chúc Bạn May Mắn', prizeType: 'NO_LUCK', prizeValue: 0, spinTime: '24/08/2026 09:58:10', transactionRef: 'SPIN_994816', status: 'SUCCESS' },
];

export const GameManagementPage: React.FC = () => {
  const { t } = useTranslation();
  const [games, setGames] = useState<GameItem[]>(INITIAL_GAMES);
  const [prizes, setPrizes] = useState<WheelPrizeItem[]>(INITIAL_PRIZES);
  const [selectedGames, setSelectedGames] = useState<GameItem[]>([]);
  const [selectedPrizes, setSelectedPrizes] = useState<WheelPrizeItem[]>([]);

  // Dialog States
  const [showGameDialog, setShowGameDialog] = useState(false);
  const [showPrizeDialog, setShowPrizeDialog] = useState(false);
  const [showParamsDialog, setShowParamsDialog] = useState(false);

  // Form States
  const [gameFormData, setGameFormData] = useState<Partial<GameItem>>({});
  const [prizeFormData, setPrizeFormData] = useState<Partial<WheelPrizeItem>>({});
  const [selectedGameForParams, setSelectedGameForParams] = useState<GameItem | null>(null);

  const [isEdit, setIsEdit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate total probability
  const totalProbability = prizes.reduce((sum, p) => sum + (p.status === CommonStatus.ACTIVE ? p.probabilityWeight : 0), 0);
  const isProbabilityBalanced = totalProbability === 100;

  // Auto-balance weights to 100%
  const handleAutoBalanceProbability = () => {
    if (totalProbability === 0) return;
    const factor = 100 / totalProbability;
    const balanced = prizes.map((p) => ({
      ...p,
      probabilityWeight: Math.round(p.probabilityWeight * factor),
    }));
    // Adjust remainder on first active prize
    const newSum = balanced.reduce((s, p) => s + p.probabilityWeight, 0);
    if (newSum !== 100 && balanced.length > 0) {
      balanced[0].probabilityWeight += 100 - newSum;
    }
    setPrizes(balanced);
  };

  const openNewGame = () => {
    setGameFormData({
      category: 'HTML5',
      pricePerTurn: 10,
      pricePerTurnHtg: 10,
      freeTurnsDaily: 1,
      dailyBudgetLimit: 10000,
      allowPointsSpin: true,
      status: CommonStatus.ACTIVE,
    });
    setIsEdit(false);
    setShowGameDialog(true);
  };

  const editGame = (item: GameItem) => {
    setGameFormData({ ...item });
    setIsEdit(true);
    setShowGameDialog(true);
  };

  const openParamsConfig = (item: GameItem) => {
    setSelectedGameForParams({ ...item });
    setShowParamsDialog(true);
  };

  const saveGame = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      if (isEdit && gameFormData.id) {
        setGames(games.map((g) => (g.id === gameFormData.id ? ({ ...g, ...gameFormData } as GameItem) : g)));
      } else {
        const newItem: GameItem = {
          id: Date.now(),
          gameCode: gameFormData.gameCode || 'NEW_GAME',
          gameName: gameFormData.gameName || 'Trò chơi mới',
          category: gameFormData.category || 'HTML5',
          pricePerTurn: gameFormData.pricePerTurn ?? 10,
          pricePerTurnHtg: gameFormData.pricePerTurnHtg ?? 10,
          freeTurnsDaily: gameFormData.freeTurnsDaily ?? 1,
          dailyBudgetLimit: gameFormData.dailyBudgetLimit ?? 10000,
          allowPointsSpin: gameFormData.allowPointsSpin ?? true,
          gameUrl: gameFormData.gameUrl || '/games/new',
          status: gameFormData.status || CommonStatus.ACTIVE,
        };
        setGames([...games, newItem]);
      }
      setIsSubmitting(false);
      setShowGameDialog(false);
    }, 300);
  };

  const saveParamsConfig = () => {
    if (!selectedGameForParams) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setGames(games.map((g) => (g.id === selectedGameForParams.id ? selectedGameForParams : g)));
      setIsSubmitting(false);
      setShowParamsDialog(false);
    }, 300);
  };

  const editPrize = (item: WheelPrizeItem) => {
    setPrizeFormData({ ...item });
    setIsEdit(true);
    setShowPrizeDialog(true);
  };

  const openNewPrize = () => {
    setPrizeFormData({
      displayOrder: prizes.length + 1,
      prizeName: 'Ô Thưởng Mới',
      prizeType: 'POINTS',
      prizeValue: 100,
      probabilityWeight: 10,
      dailyBudgetLimit: 10000,
      dailyMaxWinners: 100,
      colorCode: '#FFD700',
      status: CommonStatus.ACTIVE,
    });
    setIsEdit(false);
    setShowPrizeDialog(true);
  };

  const savePrize = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      if (isEdit && prizeFormData.id) {
        setPrizes(prizes.map((p) => (p.id === prizeFormData.id ? ({ ...p, ...prizeFormData } as WheelPrizeItem) : p)));
      } else {
        const newItem: WheelPrizeItem = {
          id: Date.now(),
          displayOrder: prizeFormData.displayOrder || prizes.length + 1,
          prizeName: prizeFormData.prizeName || 'Phần thưởng mới',
          prizeType: prizeFormData.prizeType || 'POINTS',
          prizeValue: prizeFormData.prizeValue ?? 100,
          probabilityWeight: prizeFormData.probabilityWeight ?? 10,
          dailyBudgetLimit: prizeFormData.dailyBudgetLimit ?? 10000,
          dailyMaxWinners: prizeFormData.dailyMaxWinners ?? 100,
          colorCode: prizeFormData.colorCode || '#FFD700',
          status: prizeFormData.status || CommonStatus.ACTIVE,
          actualWinCountToday: 0,
        };
        setPrizes([...prizes, newItem]);
      }
      setIsSubmitting(false);
      setShowPrizeDialog(false);
    }, 300);
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
        return <Tag severity="warning" value="Điểm Loyalty" icon="pi pi-star" />;
      case 'VOUCHER':
        return <Tag severity="danger" value="Voucher Đối Tác" icon="pi pi-ticket" />;
      case 'CASHBACK':
        return <Tag severity="success" value="Tiền Mặt Ví" icon="pi pi-dollar" />;
      case 'TURNS':
        return <Tag severity="info" value="Thêm Lượt Quay" icon="pi pi-bolt" />;
      case 'NO_LUCK':
      default:
        return <Tag severity="secondary" value="Chúc May Mắn" icon="pi pi-heart" />;
    }
  };

  const colorBadgeTemplate = (rowData: WheelPrizeItem) => (
    <div className="flex align-items-center gap-2">
      <span
        style={{
          backgroundColor: rowData.colorCode,
          width: '18px',
          height: '18px',
          borderRadius: '6px',
          border: '1px solid rgba(0,0,0,0.15)',
          display: 'inline-block',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      />
      <span className="font-mono text-xs font-bold">{rowData.colorCode}</span>
    </div>
  );

  const probabilityBarTemplate = (rowData: WheelPrizeItem) => (
    <div className="flex align-items-center gap-2" style={{ minWidth: '8rem' }}>
      <ProgressBar value={rowData.probabilityWeight} showValue={false} style={{ height: '8px', width: '60px' }} color={rowData.probabilityWeight > 20 ? '#10B981' : rowData.probabilityWeight >= 10 ? '#F59E0B' : '#6366F1'} />
      <span className="font-bold text-sm">{rowData.probabilityWeight}%</span>
    </div>
  );

  const statusOptions = [
    { label: t('common.active', { defaultValue: 'Đang áp dụng' }), value: CommonStatus.ACTIVE },
    { label: t('common.inactive', { defaultValue: 'Tạm dừng' }), value: CommonStatus.INACTIVE },
  ];

  const prizeTypeOptions = [
    { label: 'Điểm Loyalty (POINTS)', value: 'POINTS' },
    { label: 'Phiếu Giảm Giá Đối Tác (VOUCHER)', value: 'VOUCHER' },
    { label: 'Tiền Mặt Cộng Số Dư Ví (CASHBACK)', value: 'CASHBACK' },
    { label: 'Thêm Lượt Chơi Mới (TURNS)', value: 'TURNS' },
    { label: 'Chúc Bạn May Mắn (NO_LUCK)', value: 'NO_LUCK' },
  ];

  return (
    <div>
      <AppBreadcrumb items={[{ label: t('nav.games', { defaultValue: 'Cổng Game & Vòng Quay' }) }]} />

      {/* ── KPI METRIC CARDS ── */}
      <div className="grid mb-4">
        <div className="col-12 md:col-3">
          <div className="card mb-0 shadow-1 border-round surface-card p-3 border-left-3 border-primary">
            <div className="flex justify-content-between mb-2">
              <div>
                <span className="block text-500 font-medium text-xs mb-1">{t('game.game_list', { defaultValue: 'Tổng Game Vận Hành' })}</span>
                <div className="text-900 font-bold text-2xl">4 Game</div>
              </div>
              <div className="flex align-items-center justify-content-center bg-blue-100 border-round w-2.5rem h-2.5rem">
                <i className="pi pi-th-large text-blue-600 text-xl" />
              </div>
            </div>
            <span className="text-green-500 font-medium text-xs">100% Sẵn sàng Webview</span>
          </div>
        </div>

        <div className="col-12 md:col-3">
          <div className="card mb-0 shadow-1 border-round surface-card p-3 border-left-3 border-orange-500">
            <div className="flex justify-content-between mb-2">
              <div>
                <span className="block text-500 font-medium text-xs mb-1">{t('game.today_spins', { defaultValue: 'Tổng Lượt Chơi Hôm Nay' })}</span>
                <div className="text-900 font-bold text-2xl font-mono">390 Lượt</div>
              </div>
              <div className="flex align-items-center justify-content-center bg-orange-100 border-round w-2.5rem h-2.5rem">
                <i className="pi pi-spin pi-spinner text-orange-600 text-xl" />
              </div>
            </div>
            <span className="text-orange-500 font-medium text-xs">+18.4% so với hôm qua</span>
          </div>
        </div>

        <div className="col-12 md:col-3">
          <div className="card mb-0 shadow-1 border-round surface-card p-3 border-left-3 border-green-500">
            <div className="flex justify-content-between mb-2">
              <div>
                <span className="block text-500 font-medium text-xs mb-1">{t('game.today_cost', { defaultValue: 'Ngân Sách Chi Trả Ngày' })}</span>
                <div className="text-900 font-bold text-2xl font-mono text-green-600">6,000 HTG</div>
              </div>
              <div className="flex align-items-center justify-content-center bg-green-100 border-round w-2.5rem h-2.5rem">
                <i className="pi pi-wallet text-green-600 text-xl" />
              </div>
            </div>
            <span className="text-500 font-medium text-xs">Hạn mức: 50,000 HTG (12%)</span>
          </div>
        </div>

        <div className="col-12 md:col-3">
          <div className="card mb-0 shadow-1 border-round surface-card p-3 border-left-3 border-purple-500">
            <div className="flex justify-content-between mb-2">
              <div>
                <span className="block text-500 font-medium text-xs mb-1">{t('game.total_probability', { defaultValue: 'Cân Bằng Ma Trận Xác Suất' })}</span>
                <div className={`font-bold text-2xl ${isProbabilityBalanced ? 'text-green-600' : 'text-red-600'}`}>
                  {totalProbability}%
                </div>
              </div>
              <div className={`flex align-items-center justify-center border-round w-2.5rem h-2.5rem ${isProbabilityBalanced ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                <i className={`pi ${isProbabilityBalanced ? 'pi-check-circle' : 'pi-exclamation-triangle'} text-xl`} />
              </div>
            </div>
            <span className={`font-medium text-xs ${isProbabilityBalanced ? 'text-green-500' : 'text-red-500'}`}>
              {isProbabilityBalanced ? t('game.probability_balanced', { defaultValue: 'Cân bằng hoàn hảo 100%' }) : t('game.probability_unbalanced', { defaultValue: 'Chưa đủ 100%' })}
            </span>
          </div>
        </div>
      </div>

      {/* ── MAIN TABBED VIEWS ── */}
      <div className="card shadow-1 border-round surface-card p-4">
        <TabView>
          {/* TAB 1: Game Catalog & Parameters */}
          <TabPanel header={t('game.game_list', { defaultValue: 'Danh mục Trò chơi & Tham số' })} leftIcon="pi pi-list mr-2">
            <div className="flex justify-content-between align-items-center mb-3">
              <div>
                <h4 className="m-0 text-primary font-bold">{t('game.management_title', { defaultValue: 'Quản trị Cổng Game Đa Thuê Bao' })}</h4>
                <p className="text-500 text-xs mt-1 mb-0">Cấu hình giá lượt, số lượt miễn phí hàng ngày, hạn mức ngân sách và tham số vận hành cho từng trò chơi.</p>
              </div>
              <Button label={t('game.add_game', { defaultValue: 'Thêm Game Mới' })} icon="pi pi-plus" severity="success" onClick={openNewGame} />
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
            >
              <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
              <Column header={t('common.stt', { defaultValue: 'STT' })} body={(_, options) => options.rowIndex + 1} style={{ width: '3.5rem', textAlign: 'center' }} />
              <Column
                body={(rowData: GameItem) => (
                  <div className="flex gap-1.5">
                    <Button icon="pi pi-cog" rounded severity="info" size="small" onClick={() => openParamsConfig(rowData)} tooltip={t('game.config_params', { defaultValue: 'Cấu hình tham số' })} />
                    <Button icon="pi pi-pencil" rounded outlined severity="warning" size="small" onClick={() => editGame(rowData)} tooltip={t('common.edit', { defaultValue: 'Sửa' })} />
                  </div>
                )}
                header={t('common.actions', { defaultValue: 'Thao tác' })}
                style={{ width: '7rem', textAlign: 'center' }}
              />
              <Column field="gameCode" header={t('game.game_code', { defaultValue: 'Mã Game' })} sortable style={{ minWidth: '10rem', fontWeight: 600 }} />
              <Column field="gameName" header={t('game.game_name', { defaultValue: 'Tên Trò chơi' })} sortable style={{ minWidth: '16rem' }} />
              <Column field="category" header={t('game.category', { defaultValue: 'Thể loại' })} sortable style={{ minWidth: '8rem' }} />
              <Column field="freeTurnsDaily" header={t('game.free_turns_daily', { defaultValue: 'Lượt miễn phí/ngày' })} body={(row: GameItem) => <span className="font-bold text-green-600">{row.freeTurnsDaily} lượt</span>} sortable style={{ minWidth: '10rem', textAlign: 'center' }} />
              <Column field="pricePerTurnHtg" header={t('game.price_per_turn_htg', { defaultValue: 'Giá mua lượt (HTG)' })} body={(row: GameItem) => row.pricePerTurnHtg > 0 ? <span className="font-bold font-mono text-orange-600">{row.pricePerTurnHtg} HTG</span> : <Tag severity="info" value="Miễn phí" />} sortable style={{ minWidth: '10rem', textAlign: 'center' }} />
              <Column field="dailyBudgetLimit" header={t('game.daily_budget_total', { defaultValue: 'Hạn mức ngày (HTG)' })} body={(row: GameItem) => row.dailyBudgetLimit > 0 ? <span className="font-mono">{row.dailyBudgetLimit.toLocaleString()} HTG</span> : 'Không giới hạn'} sortable style={{ minWidth: '11rem' }} />
              <Column field="status" body={(row: GameItem) => statusTemplate(row.status)} header={t('common.status', { defaultValue: 'Trạng thái' })} sortable style={{ minWidth: '8rem' }} />
            </DataTable>
          </TabPanel>

          {/* TAB 2: Lucky Wheel Prize Matrix & Probability Settings */}
          <TabPanel header={t('game.wheel_config', { defaultValue: 'Ma trận Xác suất Ô Thưởng Vòng Quay' })} leftIcon="pi pi-percentage mr-2">
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
            <div className={`p-3 border-round mb-3 flex align-items-center justify-content-between ${isProbabilityBalanced ? 'bg-green-50 border-1 border-green-200 text-green-900' : 'bg-red-50 border-1 border-red-200 text-red-900'}`}>
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
                  <Button icon="pi pi-pencil" rounded outlined severity="warning" size="small" onClick={() => editPrize(rowData)} tooltip={t('common.edit', { defaultValue: 'Sửa' })} />
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
          </TabPanel>

          {/* TAB 3: Spin Logs & Win Rates Analytics */}
          <TabPanel header={t('game.spin_analytics', { defaultValue: 'Thống kê Trúng thưởng & Nhật ký' })} leftIcon="pi pi-chart-bar mr-2">
            <div className="mb-3">
              <h4 className="m-0 text-primary font-bold">{t('game.recent_winners', { defaultValue: 'Nhật Ký Trúng Thưởng Thời Gian Thực' })}</h4>
              <p className="text-500 text-xs mt-1 mb-0">Theo dõi toàn bộ các lượt quay trúng thưởng, loại phần thưởng và mã tham chiếu giao dịch hệ thống.</p>
            </div>

            <DataTable<any>
              value={RECENT_SPIN_LOGS}
              dataKey="id"
              paginator
              rows={10}
              stripedRows
              responsiveLayout="scroll"
            >
              <Column header={t('common.stt', { defaultValue: 'STT' })} body={(_, options) => options.rowIndex + 1} style={{ width: '3.5rem', textAlign: 'center' }} />
              <Column field="phone" header="Số Điện Thoại Hội Viên" sortable style={{ minWidth: '10rem', fontWeight: 600 }} />
              <Column field="prizeName" header="Phần Thưởng Trúng" sortable style={{ minWidth: '14rem' }} />
              <Column field="prizeType" header="Loại Thưởng" body={(r: SpinLogItem) => prizeTypeTemplate(r.prizeType)} sortable style={{ minWidth: '10rem' }} />
              <Column field="prizeValue" header="Giá Trị" body={(r: SpinLogItem) => <span className="font-mono font-bold">{r.prizeValue.toLocaleString()}</span>} sortable style={{ minWidth: '8rem', textAlign: 'right' }} />
              <Column field="spinTime" header="Thời Gian Quay" sortable style={{ minWidth: '11rem', fontFamily: 'monospace' }} />
              <Column field="transactionRef" header="Mã Giao Dịch" body={(r: SpinLogItem) => <span className="font-mono text-xs text-500">{r.transactionRef}</span>} sortable style={{ minWidth: '10rem' }} />
              <Column field="status" header="Trạng Thái Phát Quà" body={() => <Tag severity="success" value="Đã Phát Thưởng" />} sortable style={{ minWidth: '9rem' }} />
            </DataTable>
          </TabPanel>
        </TabView>
      </div>

      {/* ── DIALOG 1: GAME CREATION & BASIC INFO ── */}
      <Dialog
        visible={showGameDialog}
        style={{ width: '36rem' }}
        header={isEdit ? t('game.edit_game', { defaultValue: 'Cập nhật Trò chơi' }) : t('game.add_game', { defaultValue: 'Thêm Game Mới' })}
        modal
        className="p-fluid"
        onHide={() => setShowGameDialog(false)}
      >
        <div className="field mb-3">
          <label htmlFor="gameCode" className="font-bold">{t('game.game_code', { defaultValue: 'Mã Game' })}</label>
          <InputText id="gameCode" value={gameFormData.gameCode || ''} onChange={(e) => setGameFormData({ ...gameFormData, gameCode: e.target.value })} required disabled={isEdit} />
        </div>
        <div className="field mb-3">
          <label htmlFor="gameName" className="font-bold">{t('game.game_name', { defaultValue: 'Tên Trò chơi' })}</label>
          <InputText id="gameName" value={gameFormData.gameName || ''} onChange={(e) => setGameFormData({ ...gameFormData, gameName: e.target.value })} required />
        </div>
        <div className="grid">
          <div className="col-6 field mb-3">
            <label htmlFor="category" className="font-bold">{t('game.category', { defaultValue: 'Thể loại' })}</label>
            <InputText id="category" value={gameFormData.category || 'HTML5'} onChange={(e) => setGameFormData({ ...gameFormData, category: e.target.value })} />
          </div>
          <div className="col-6 field mb-3">
            <label htmlFor="freeTurnsDaily" className="font-bold">{t('game.free_turns_daily', { defaultValue: 'Lượt miễn phí/ngày' })}</label>
            <InputNumber id="freeTurnsDaily" value={gameFormData.freeTurnsDaily ?? 1} onValueChange={(e) => setGameFormData({ ...gameFormData, freeTurnsDaily: e.value ?? 1 })} min={0} max={10} />
          </div>
        </div>
        <div className="grid">
          <div className="col-6 field mb-3">
            <label htmlFor="pricePerTurnHtg" className="font-bold">{t('game.price_per_turn_htg', { defaultValue: 'Giá mua lượt (HTG)' })}</label>
            <InputNumber id="pricePerTurnHtg" value={gameFormData.pricePerTurnHtg ?? 20} onValueChange={(e) => setGameFormData({ ...gameFormData, pricePerTurnHtg: e.value ?? 20 })} />
          </div>
          <div className="col-6 field mb-3">
            <label htmlFor="dailyBudgetLimit" className="font-bold">{t('game.daily_budget_total', { defaultValue: 'Hạn mức ngày (HTG)' })}</label>
            <InputNumber id="dailyBudgetLimit" value={gameFormData.dailyBudgetLimit ?? 50000} onValueChange={(e) => setGameFormData({ ...gameFormData, dailyBudgetLimit: e.value ?? 50000 })} />
          </div>
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
        style={{ width: '40rem' }}
        header={`Cấu hình Tham số Vận hành: ${selectedGameForParams?.gameName || ''}`}
        modal
        className="p-fluid"
        onHide={() => setShowParamsDialog(false)}
      >
        {selectedGameForParams && (
          <div>
            {/* Common Base Parameters */}
            <div className="surface-100 p-3 border-round mb-4">
              <h5 className="m-0 mb-3 text-primary font-bold text-sm">1. Tham Số Lượt Chơi & Chi Phí</h5>
              <div className="grid">
                <div className="col-6 field mb-2">
                  <label className="font-bold text-xs">Số lượt miễn phí/ngày</label>
                  <InputNumber
                    value={selectedGameForParams.freeTurnsDaily}
                    onValueChange={(e) => setSelectedGameForParams({ ...selectedGameForParams, freeTurnsDaily: e.value ?? 1 })}
                    min={0}
                    max={20}
                  />
                  <small className="text-500">Tự động làm mới vào 23:59:59</small>
                </div>
                <div className="col-6 field mb-2">
                  <label className="font-bold text-xs">Giá mua thêm 1 lượt (HTG)</label>
                  <InputNumber
                    value={selectedGameForParams.pricePerTurnHtg}
                    onValueChange={(e) => setSelectedGameForParams({ ...selectedGameForParams, pricePerTurnHtg: e.value ?? 20 })}
                    min={0}
                  />
                  <small className="text-500">Khấu trừ số dư ví Natcash</small>
                </div>
              </div>

              <div className="grid mt-2">
                <div className="col-6 field mb-2">
                  <label className="font-bold text-xs">Hạn mức ngân sách giải thưởng ngày (HTG)</label>
                  <InputNumber
                    value={selectedGameForParams.dailyBudgetLimit}
                    onValueChange={(e) => setSelectedGameForParams({ ...selectedGameForParams, dailyBudgetLimit: e.value ?? 50000 })}
                    min={0}
                  />
                  <small className="text-500">Khống chế tổng chi thưởng/ngày</small>
                </div>
                <div className="col-6 field mb-2 flex flex-column justify-content-center">
                  <label className="font-bold text-xs mb-2">Cho phép chơi bằng Điểm Loyalty</label>
                  <div className="flex align-items-center gap-2">
                    <InputSwitch
                      checked={selectedGameForParams.allowPointsSpin}
                      onChange={(e) => setSelectedGameForParams({ ...selectedGameForParams, allowPointsSpin: e.value ?? true })}
                    />
                    <span className="text-sm font-semibold">{selectedGameForParams.allowPointsSpin ? 'Cho phép' : 'Tắt'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Game-Specific Specialized Parameters */}
            {selectedGameForParams.gameCode.includes('QUIZ') && (
              <div className="surface-100 p-3 border-round mb-3">
                <h5 className="m-0 mb-3 text-indigo-600 font-bold text-sm">2. Tham Số Trò Chơi Đố Vui (Trivia Quiz)</h5>
                <div className="grid">
                  <div className="col-4 field mb-2">
                    <label className="font-bold text-xs">Số câu hỏi mỗi lượt</label>
                    <InputNumber
                      value={selectedGameForParams.quizQuestionCount ?? 5}
                      onValueChange={(e) => setSelectedGameForParams({ ...selectedGameForParams, quizQuestionCount: e.value ?? 5 })}
                      min={1}
                      max={20}
                    />
                  </div>
                  <div className="col-4 field mb-2">
                    <label className="font-bold text-xs">Thời gian trả lời/câu (s)</label>
                    <InputNumber
                      value={selectedGameForParams.quizCountdownSec ?? 20}
                      onValueChange={(e) => setSelectedGameForParams({ ...selectedGameForParams, quizCountdownSec: e.value ?? 20 })}
                      min={5}
                      max={60}
                    />
                  </div>
                  <div className="col-4 field mb-2">
                    <label className="font-bold text-xs">Điểm thưởng hoàn thành</label>
                    <InputNumber
                      value={selectedGameForParams.quizRewardPoints ?? 150}
                      onValueChange={(e) => setSelectedGameForParams({ ...selectedGameForParams, quizRewardPoints: e.value ?? 150 })}
                      min={0}
                    />
                  </div>
                </div>
              </div>
            )}

            {selectedGameForParams.gameCode.includes('WHEEL') && (
              <div className="surface-100 p-3 border-round mb-3">
                <h5 className="m-0 mb-3 text-amber-600 font-bold text-sm">2. Tham Số Bánh Xe Vòng Quay 3D</h5>
                <p className="text-xs text-600 mb-2">Để cấu hình chi tiết tỷ lệ % xác suất trúng từng ô quà và mã màu sắc nan quạt, vui lòng chuyển qua tab <strong>"Ma trận Xác suất Ô Thưởng Vòng Quay"</strong>.</p>
              </div>
            )}

            {selectedGameForParams.gameCode.includes('FARM') && (
              <div className="surface-100 p-3 border-round mb-3">
                <h5 className="m-0 mb-3 text-green-600 font-bold text-sm">2. Tham Số Nông Trại Delimart</h5>
                <div className="grid">
                  <div className="col-6 field mb-2">
                    <label className="font-bold text-xs">Chu kỳ mùa vụ thu hoạch (ngày)</label>
                    <InputNumber
                      value={selectedGameForParams.farmSeasonDays ?? 7}
                      onValueChange={(e) => setSelectedGameForParams({ ...selectedGameForParams, farmSeasonDays: e.value ?? 7 })}
                      min={1}
                      max={30}
                    />
                  </div>
                  <div className="col-6 field mb-2">
                    <label className="font-bold text-xs">Hạn mức voucher đổi/tháng</label>
                    <InputNumber
                      value={selectedGameForParams.farmVoucherLimit ?? 5}
                      onValueChange={(e) => setSelectedGameForParams({ ...selectedGameForParams, farmVoucherLimit: e.value ?? 5 })}
                      min={1}
                      max={50}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-content-end gap-2 mt-4">
              <Button label={t('common.cancel', { defaultValue: 'Hủy' })} icon="pi pi-times" outlined onClick={() => setShowParamsDialog(false)} disabled={isSubmitting} />
              <Button label={t('common.save', { defaultValue: 'Lưu cấu hình tham số' })} icon="pi pi-check" onClick={saveParamsConfig} loading={isSubmitting} disabled={isSubmitting} />
            </div>
          </div>
        )}
      </Dialog>

      {/* ── DIALOG 3: WHEEL PRIZE & PROBABILITY CONFIGURATION ── */}
      <Dialog
        visible={showPrizeDialog}
        style={{ width: '36rem' }}
        header={isEdit ? t('game.edit_prize', { defaultValue: 'Cập nhật Cơ cấu Ô Thưởng Vòng Quay' }) : t('game.add_prize', { defaultValue: 'Thêm Ô Thưởng Mới' })}
        modal
        className="p-fluid"
        onHide={() => setShowPrizeDialog(false)}
      >
        <div className="field mb-3">
          <label htmlFor="prizeName" className="font-bold">{t('game.prize_name', { defaultValue: 'Tên Giải thưởng' })}</label>
          <InputText id="prizeName" value={prizeFormData.prizeName || ''} onChange={(e) => setPrizeFormData({ ...prizeFormData, prizeName: e.target.value })} required />
        </div>

        <div className="grid">
          <div className="col-6 field mb-3">
            <label htmlFor="prizeType" className="font-bold">{t('game.prize_type', { defaultValue: 'Loại phần thưởng' })}</label>
            <Dropdown id="prizeType" value={prizeFormData.prizeType || 'POINTS'} options={prizeTypeOptions} onChange={(e) => setPrizeFormData({ ...prizeFormData, prizeType: e.value })} />
          </div>
          <div className="col-6 field mb-3">
            <label htmlFor="prizeValue" className="font-bold">{t('game.prize_value', { defaultValue: 'Giá trị phần thưởng' })}</label>
            <InputNumber id="prizeValue" value={prizeFormData.prizeValue ?? 100} onValueChange={(e) => setPrizeFormData({ ...prizeFormData, prizeValue: e.value ?? 100 })} />
          </div>
        </div>

        <div className="grid">
          <div className="col-6 field mb-3">
            <label htmlFor="probabilityWeight" className="font-bold">{t('game.probability_weight', { defaultValue: 'Trọng số xác suất trúng (%)' })}</label>
            <InputNumber id="probabilityWeight" value={prizeFormData.probabilityWeight ?? 10} onValueChange={(e) => setPrizeFormData({ ...prizeFormData, probabilityWeight: e.value ?? 10 })} min={0} max={100} suffix="%" />
            <small className="text-500">Tỷ lệ xác suất quay trúng ô này</small>
          </div>
          <div className="col-6 field mb-3">
            <label htmlFor="dailyBudgetLimit" className="font-bold">{t('game.daily_budget_limit', { defaultValue: 'Ngân sách tối đa/ngày (HTG)' })}</label>
            <InputNumber id="dailyBudgetLimit" value={prizeFormData.dailyBudgetLimit ?? 10000} onValueChange={(e) => setPrizeFormData({ ...prizeFormData, dailyBudgetLimit: e.value ?? 10000 })} />
            <small className="text-500">0 = Không giới hạn ngân sách</small>
          </div>
        </div>

        <div className="grid">
          <div className="col-6 field mb-3">
            <label htmlFor="dailyMaxWinners" className="font-bold">{t('game.daily_max_winners', { defaultValue: 'Số giải phát tối đa/ngày' })}</label>
            <InputNumber id="dailyMaxWinners" value={prizeFormData.dailyMaxWinners ?? 100} onValueChange={(e) => setPrizeFormData({ ...prizeFormData, dailyMaxWinners: e.value ?? 100 })} min={0} />
            <small className="text-500">0 = Không giới hạn số lượng</small>
          </div>
          <div className="col-6 field mb-3">
            <label htmlFor="displayOrder" className="font-bold">{t('game.display_order', { defaultValue: 'Vị trí nan quạt (1..8)' })}</label>
            <InputNumber id="displayOrder" value={prizeFormData.displayOrder ?? 1} onValueChange={(e) => setPrizeFormData({ ...prizeFormData, displayOrder: e.value ?? 1 })} min={1} max={12} />
          </div>
        </div>

        <div className="grid">
          <div className="col-6 field mb-3">
            <label htmlFor="colorCode" className="font-bold">{t('game.color_code', { defaultValue: 'Mã màu sắc (Hex)' })}</label>
            <div className="p-inputgroup">
              <span className="p-inputgroup-addon" style={{ backgroundColor: prizeFormData.colorCode || '#FFD700' }} />
              <InputText id="colorCode" value={prizeFormData.colorCode || '#FFD700'} onChange={(e) => setPrizeFormData({ ...prizeFormData, colorCode: e.target.value })} />
            </div>
          </div>
          <div className="col-6 field mb-3">
            <label htmlFor="prizeStatus" className="font-bold">{t('common.status', { defaultValue: 'Trạng thái' })}</label>
            <Dropdown id="prizeStatus" value={prizeFormData.status || CommonStatus.ACTIVE} options={statusOptions} onChange={(e) => setPrizeFormData({ ...prizeFormData, status: e.value })} />
          </div>
        </div>

        <div className="flex justify-content-end gap-2 mt-4">
          <Button label={t('common.cancel', { defaultValue: 'Hủy' })} icon="pi pi-times" outlined onClick={() => setShowPrizeDialog(false)} disabled={isSubmitting} />
          <Button label={t('common.save', { defaultValue: 'Lưu ô thưởng' })} icon="pi pi-check" onClick={savePrize} loading={isSubmitting} disabled={isSubmitting} />
        </div>
      </Dialog>
    </div>
  );
};

export default GameManagementPage;
