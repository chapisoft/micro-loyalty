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
import { AppBreadcrumb } from 'components';
import { CommonStatus } from '@/models';

interface GameItem {
  id: number;
  gameCode: string;
  gameName: string;
  category: string;
  pricePerTurn: number;
  freeTurnsDaily: number;
  gameUrl: string;
  status: CommonStatus;
}

interface WheelPrizeItem {
  id: number;
  displayOrder: number;
  prizeName: string;
  prizeType: string;
  prizeValue: number;
  probabilityWeight: number;
  dailyBudgetLimit: number;
  colorCode: string;
  status: CommonStatus;
}

const INITIAL_GAMES: GameItem[] = [
  {
    id: 1,
    gameCode: 'LUCKY_WHEEL_2026',
    gameName: 'Vòng Quay May Mắn Tri Ân Khách Hàng',
    category: 'LUCKY_DRAW',
    pricePerTurn: 20,
    freeTurnsDaily: 1,
    gameUrl: '/wheel',
    status: CommonStatus.ACTIVE,
  },
  {
    id: 2,
    gameCode: 'SUPERMARKET_QUIZ',
    gameName: 'Đấu Trí Mua Sắm Siêu Thị',
    category: 'QUIZ',
    pricePerTurn: 10,
    freeTurnsDaily: 2,
    gameUrl: '/games/quiz',
    status: CommonStatus.ACTIVE,
  },
];

const INITIAL_PRIZES: WheelPrizeItem[] = [
  { id: 1, displayOrder: 1, prizeName: '100 Điểm Thưởng', prizeType: 'POINTS', prizeValue: 100, probabilityWeight: 20, dailyBudgetLimit: 50000, colorCode: '#FFD700', status: CommonStatus.ACTIVE },
  { id: 2, displayOrder: 2, prizeName: 'Voucher 50 HTG', prizeType: 'VOUCHER', prizeValue: 50, probabilityWeight: 15, dailyBudgetLimit: 20000, colorCode: '#FF6B6B', status: CommonStatus.ACTIVE },
  { id: 3, displayOrder: 3, prizeName: 'Chúc Bạn May Mắn', prizeType: 'NO_LUCK', prizeValue: 0, probabilityWeight: 35, dailyBudgetLimit: 0, colorCode: '#4ECDC4', status: CommonStatus.ACTIVE },
  { id: 4, displayOrder: 4, prizeName: '200 Điểm Thưởng', prizeType: 'POINTS', prizeValue: 200, probabilityWeight: 10, dailyBudgetLimit: 30000, colorCode: '#45B7D1', status: CommonStatus.ACTIVE },
  { id: 5, displayOrder: 5, prizeName: 'Thưởng 500 HTG Tiền Mặt', prizeType: 'CASHBACK', prizeValue: 500, probabilityWeight: 5, dailyBudgetLimit: 10000, colorCode: '#96CEB4', status: CommonStatus.ACTIVE },
  { id: 6, displayOrder: 6, prizeName: 'Tặng 1 Lượt Quay Mới', prizeType: 'POINTS', prizeValue: 20, probabilityWeight: 15, dailyBudgetLimit: 15000, colorCode: '#FFEEAD', status: CommonStatus.ACTIVE },
];

export const GameManagementPage: React.FC = () => {
  const { t } = useTranslation();
  const [games, setGames] = useState<GameItem[]>(INITIAL_GAMES);
  const [prizes, setPrizes] = useState<WheelPrizeItem[]>(INITIAL_PRIZES);
  const [selectedGames, setSelectedGames] = useState<GameItem[]>([]);
  const [selectedPrizes, setSelectedPrizes] = useState<WheelPrizeItem[]>([]);
  const [showGameDialog, setShowGameDialog] = useState(false);
  const [showPrizeDialog, setShowPrizeDialog] = useState(false);
  const [gameFormData, setGameFormData] = useState<Partial<GameItem>>({});
  const [prizeFormData, setPrizeFormData] = useState<Partial<WheelPrizeItem>>({});
  const [isEdit, setIsEdit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openNewGame = () => {
    setGameFormData({
      category: 'HTML5',
      pricePerTurn: 10,
      freeTurnsDaily: 1,
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
          freeTurnsDaily: gameFormData.freeTurnsDaily ?? 1,
          gameUrl: gameFormData.gameUrl || '/games/new',
          status: gameFormData.status || CommonStatus.ACTIVE,
        };
        setGames([...games, newItem]);
      }
      setIsSubmitting(false);
      setShowGameDialog(false);
    }, 300);
  };

  const editPrize = (item: WheelPrizeItem) => {
    setPrizeFormData({ ...item });
    setIsEdit(true);
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
          colorCode: prizeFormData.colorCode || '#FFD700',
          status: prizeFormData.status || CommonStatus.ACTIVE,
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

  const colorBadgeTemplate = (rowData: WheelPrizeItem) => (
    <div className="flex align-items-center gap-2">
      <span style={{ backgroundColor: rowData.colorCode, width: '16px', height: '16px', borderRadius: '4px', display: 'inline-block' }} />
      <span>{rowData.colorCode}</span>
    </div>
  );

  const statusOptions = [
    { label: t('common.active', { defaultValue: 'Đang áp dụng' }), value: CommonStatus.ACTIVE },
    { label: t('common.inactive', { defaultValue: 'Tạm dừng' }), value: CommonStatus.INACTIVE },
  ];

  return (
    <div>
      <AppBreadcrumb items={[{ label: t('nav.games', { defaultValue: 'Cổng Game & Vòng Quay' }) }]} />
      <div className="card shadow-1 border-round surface-card p-4">
        <TabView>
          <TabPanel header={t('game.game_list', { defaultValue: 'Danh mục Trò chơi' })}>
            <div className="flex justify-content-between align-items-center mb-3">
              <h4 className="m-0 text-primary font-bold">{t('game.management_title', { defaultValue: 'Quản trị Cổng Game Đa Năng' })}</h4>
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
              <Column header={t('common.stt', { defaultValue: 'STT' })} body={(_, options) => options.rowIndex + 1} style={{ width: '4rem', textAlign: 'center' }} />
              <Column
                body={(rowData: GameItem) => (
                  <Button icon="pi pi-pencil" rounded outlined severity="warning" size="small" onClick={() => editGame(rowData)} tooltip={t('common.edit', { defaultValue: 'Sửa' })} />
                )}
                header={t('common.actions', { defaultValue: 'Thao tác' })}
                style={{ width: '6rem' }}
              />
              <Column field="gameCode" header={t('game.game_code', { defaultValue: 'Mã Game' })} sortable style={{ minWidth: '10rem' }} />
              <Column field="gameName" header={t('game.game_name', { defaultValue: 'Tên Trò chơi' })} sortable style={{ minWidth: '16rem' }} />
              <Column field="category" header={t('game.category', { defaultValue: 'Danh mục' })} sortable style={{ minWidth: '8rem' }} />
              <Column field="pricePerTurn" header={t('game.price_per_turn', { defaultValue: 'Giá lượt (Điểm)' })} sortable style={{ minWidth: '8rem', textAlign: 'center' }} />
              <Column field="freeTurnsDaily" header={t('game.free_turns_daily', { defaultValue: 'Lượt miễn phí/ngày' })} sortable style={{ minWidth: '10rem', textAlign: 'center' }} />
              <Column field="status" body={(row: GameItem) => statusTemplate(row.status)} header={t('common.status', { defaultValue: 'Trạng thái' })} sortable style={{ minWidth: '8rem' }} />
            </DataTable>
          </TabPanel>

          <TabPanel header={t('game.wheel_config', { defaultValue: 'Cơ cấu Giải thưởng Vòng quay' })}>
            <div className="flex justify-content-between align-items-center mb-3">
              <h4 className="m-0 text-primary font-bold">{t('game.wheel_matrix_title', { defaultValue: 'Ma Trận Xác Suất & Ngân Sách Vòng Quay' })}</h4>
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
              <Column header={t('common.stt', { defaultValue: 'STT' })} body={(_, options) => options.rowIndex + 1} style={{ width: '4rem', textAlign: 'center' }} />
              <Column
                body={(rowData: WheelPrizeItem) => (
                  <Button icon="pi pi-pencil" rounded outlined severity="warning" size="small" onClick={() => editPrize(rowData)} tooltip={t('common.edit', { defaultValue: 'Sửa' })} />
                )}
                header={t('common.actions', { defaultValue: 'Thao tác' })}
                style={{ width: '6rem' }}
              />
              <Column field="displayOrder" header={t('game.display_order', { defaultValue: 'Vị trí nan' })} sortable style={{ minWidth: '6rem', textAlign: 'center' }} />
              <Column field="prizeName" header={t('game.prize_name', { defaultValue: 'Tên Giải thưởng' })} sortable style={{ minWidth: '14rem' }} />
              <Column field="prizeType" header={t('game.prize_type', { defaultValue: 'Loại quà' })} sortable style={{ minWidth: '8rem' }} />
              <Column field="probabilityWeight" header={t('game.probability_weight', { defaultValue: 'Tỷ lệ trọng số' })} body={(row: WheelPrizeItem) => `${row.probabilityWeight}%`} sortable style={{ minWidth: '8rem', textAlign: 'center' }} />
              <Column field="dailyBudgetLimit" header={t('game.daily_budget_limit', { defaultValue: 'Ngân sách ngày (HTG)' })} body={(row: WheelPrizeItem) => row.dailyBudgetLimit > 0 ? `${row.dailyBudgetLimit.toLocaleString()} HTG` : 'Không giới hạn'} sortable style={{ minWidth: '12rem' }} />
              <Column field="colorCode" body={colorBadgeTemplate} header={t('game.color_code', { defaultValue: 'Màu nan quạt' })} style={{ minWidth: '8rem' }} />
              <Column field="status" body={(row: WheelPrizeItem) => statusTemplate(row.status)} header={t('common.status', { defaultValue: 'Trạng thái' })} sortable style={{ minWidth: '8rem' }} />
            </DataTable>
          </TabPanel>
        </TabView>
      </div>

      <Dialog
        visible={showGameDialog}
        style={{ width: '32rem' }}
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
            <label htmlFor="pricePerTurn" className="font-bold">{t('game.price_per_turn', { defaultValue: 'Giá lượt (Điểm)' })}</label>
            <InputNumber id="pricePerTurn" value={gameFormData.pricePerTurn ?? 10} onValueChange={(e) => setGameFormData({ ...gameFormData, pricePerTurn: e.value ?? 10 })} />
          </div>
          <div className="col-6 field mb-3">
            <label htmlFor="freeTurnsDaily" className="font-bold">{t('game.free_turns_daily', { defaultValue: 'Lượt miễn phí/ngày' })}</label>
            <InputNumber id="freeTurnsDaily" value={gameFormData.freeTurnsDaily ?? 1} onValueChange={(e) => setGameFormData({ ...gameFormData, freeTurnsDaily: e.value ?? 1 })} />
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

      <Dialog
        visible={showPrizeDialog}
        style={{ width: '32rem' }}
        header={t('game.edit_prize', { defaultValue: 'Cập nhật Cơ cấu Ô Thưởng Vòng Quay' })}
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
            <label htmlFor="probabilityWeight" className="font-bold">{t('game.probability_weight', { defaultValue: 'Trọng số xác suất (%)' })}</label>
            <InputNumber id="probabilityWeight" value={prizeFormData.probabilityWeight ?? 10} onValueChange={(e) => setPrizeFormData({ ...prizeFormData, probabilityWeight: e.value ?? 10 })} />
          </div>
          <div className="col-6 field mb-3">
            <label htmlFor="dailyBudgetLimit" className="font-bold">{t('game.daily_budget_limit', { defaultValue: 'Hạn mức ngân sách ngày (HTG)' })}</label>
            <InputNumber id="dailyBudgetLimit" value={prizeFormData.dailyBudgetLimit ?? 10000} onValueChange={(e) => setPrizeFormData({ ...prizeFormData, dailyBudgetLimit: e.value ?? 10000 })} />
          </div>
        </div>
        <div className="field mb-3">
          <label htmlFor="colorCode" className="font-bold">{t('game.color_code', { defaultValue: 'Mã màu sắc (Hex)' })}</label>
          <InputText id="colorCode" value={prizeFormData.colorCode || '#FFD700'} onChange={(e) => setPrizeFormData({ ...prizeFormData, colorCode: e.target.value })} />
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
