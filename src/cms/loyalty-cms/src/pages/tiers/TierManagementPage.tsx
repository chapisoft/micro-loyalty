import React, { useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Tag } from 'primereact/tag';
import { Dropdown } from 'primereact/dropdown';
import { useTranslation } from 'react-i18next';
import { AppBreadcrumb } from 'components';
import { TierLevel, CommonStatus } from '@/models';

export interface TierConfig {
  id: number;
  code: TierLevel;
  name: string;
  tierLevel: number;
  minPoints: number;
  pointMultiplier: number;
  freeDailyTurns: number;
  description: string;
  status: CommonStatus;
}

const INITIAL_TIERS: TierConfig[] = [
  {
    id: 1,
    code: TierLevel.SILVER,
    name: 'Hạng Bạc',
    tierLevel: 1,
    minPoints: 0,
    pointMultiplier: 1.0,
    freeDailyTurns: 1,
    description: 'Hạng hội viên khởi đầu khi đăng ký tài khoản',
    status: CommonStatus.ACTIVE,
  },
  {
    id: 2,
    code: TierLevel.GOLD,
    name: 'Hạng Vàng',
    tierLevel: 2,
    minPoints: 1000,
    pointMultiplier: 1.2,
    freeDailyTurns: 2,
    description: 'Tích lũy từ 1.000 điểm trong chu kỳ 12 tháng',
    status: CommonStatus.ACTIVE,
  },
  {
    id: 3,
    code: TierLevel.PLATINUM,
    name: 'Hạng Bạch Kim',
    tierLevel: 3,
    minPoints: 5000,
    pointMultiplier: 1.5,
    freeDailyTurns: 3,
    description: 'Tích lũy từ 5.000 điểm trong chu kỳ 12 tháng',
    status: CommonStatus.ACTIVE,
  },
  {
    id: 4,
    code: TierLevel.DIAMOND,
    name: 'Hạng Kim Cương',
    tierLevel: 4,
    minPoints: 20000,
    pointMultiplier: 2.0,
    freeDailyTurns: 5,
    description: 'Hạng đặc quyền cao cấp nhất tích lũy từ 20.000 điểm',
    status: CommonStatus.ACTIVE,
  },
];

export const TierManagementPage: React.FC = () => {
  const { t } = useTranslation();
  const [tiers, setTiers] = useState<TierConfig[]>(INITIAL_TIERS);
  const [selectedTiers, setSelectedTiers] = useState<TierConfig[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState<Partial<TierConfig>>({});
  const [isEdit, setIsEdit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const editItem = (item: TierConfig) => {
    setFormData({ ...item });
    setIsEdit(true);
    setShowDialog(true);
  };

  const saveItem = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      if (isEdit && formData.id) {
        setTiers(tiers.map((tItem) => (tItem.id === formData.id ? ({ ...tItem, ...formData } as TierConfig) : tItem)));
      }
      setIsSubmitting(false);
      setShowDialog(false);
    }, 300);
  };

  const actionTemplate = (rowData: TierConfig) => (
    <div className="flex gap-2">
      <Button
        icon="pi pi-pencil"
        rounded
        outlined
        severity="warning"
        size="small"
        onClick={() => editItem(rowData)}
        tooltip={t('common.edit', { defaultValue: 'Sửa' })}
      />
    </div>
  );

  const tierBadgeTemplate = (rowData: TierConfig) => {
    const colorMap: Record<string, string> = {
      SILVER: '#718096',
      GOLD: '#D69E2E',
      PLATINUM: '#319795',
      DIAMOND: '#805AD5',
    };
    return (
      <span
        style={{
          backgroundColor: colorMap[rowData.code] || '#718096',
          color: '#fff',
          padding: '4px 10px',
          borderRadius: '12px',
          fontWeight: 'bold',
          fontSize: '12px',
        }}
      >
        {rowData.name}
      </span>
    );
  };

  const multiplierTemplate = (rowData: TierConfig) => (
    <span className="font-bold text-success">×{rowData.pointMultiplier.toFixed(1)}</span>
  );

  const statusTemplate = (rowData: TierConfig) => {
    return rowData.status === CommonStatus.ACTIVE ? (
      <Tag severity="success" value={t('common.active', { defaultValue: 'Đang áp dụng' })} />
    ) : (
      <Tag severity="danger" value={t('common.inactive', { defaultValue: 'Tạm dừng' })} />
    );
  };

  const statusOptions = [
    { label: t('common.active', { defaultValue: 'Đang áp dụng' }), value: CommonStatus.ACTIVE },
    { label: t('common.inactive', { defaultValue: 'Tạm dừng' }), value: CommonStatus.INACTIVE },
  ];

  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <h4 className="m-0 text-primary font-bold">{t('tier.management_title', { defaultValue: 'Quản trị Hạng Hội Viên & Ma Trận Đặc Quyền' })}</h4>
    </div>
  );

  return (
    <div>
      <AppBreadcrumb items={[{ label: t('nav.tiers', { defaultValue: 'Hạng Hội Viên' }) }]} />
      <div className="card shadow-1 border-round surface-card p-4">
        <DataTable<any>
          value={tiers}
          selection={selectedTiers}
          onSelectionChange={(e: any) => setSelectedTiers(e.value || [])}
          header={header}
          dataKey="id"
          paginator
          rows={10}
          emptyMessage={t('common.no_data', { defaultValue: 'Không có dữ liệu hạng hội viên' })}
          stripedRows
          responsiveLayout="scroll"
        >
          {/* Cột 1: Checkbox */}
          <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />

          {/* Cột 2: STT */}
          <Column
            header={t('common.stt', { defaultValue: 'STT' })}
            body={(_, options) => options.rowIndex + 1}
            style={{ width: '4rem', textAlign: 'center' }}
          />

          {/* Cột 3: Thao tác */}
          <Column body={actionTemplate} exportable={false} header={t('common.actions', { defaultValue: 'Thao tác' })} style={{ width: '6rem' }} />

          {/* Cột 4 trở đi: Dữ liệu */}
          <Column field="code" header={t('tier.code', { defaultValue: 'Mã Hạng' })} sortable style={{ minWidth: '8rem' }} />
          <Column field="name" body={tierBadgeTemplate} header={t('tier.name', { defaultValue: 'Tên Hạng' })} sortable style={{ minWidth: '10rem' }} />
          <Column field="tierLevel" header={t('tier.level', { defaultValue: 'Cấp độ' })} sortable style={{ minWidth: '6rem', textAlign: 'center' }} />
          <Column field="minPoints" header={t('tier.min_points', { defaultValue: 'Điểm xét hạng' })} sortable style={{ minWidth: '10rem' }} />
          <Column field="pointMultiplier" body={multiplierTemplate} header={t('tier.multiplier', { defaultValue: 'Hệ số nhân điểm' })} sortable style={{ minWidth: '10rem' }} />
          <Column field="freeDailyTurns" header={t('tier.free_turns', { defaultValue: 'Lượt quay miễn phí/ngày' })} sortable style={{ minWidth: '12rem', textAlign: 'center' }} />
          <Column field="status" body={statusTemplate} header={t('common.status', { defaultValue: 'Trạng thái' })} sortable style={{ minWidth: '9rem' }} />
        </DataTable>
      </div>

      <Dialog
        visible={showDialog}
        style={{ width: '32rem' }}
        breakpoints={{ '960px': '75vw', '641px': '90vw' }}
        header={t('tier.edit_title', { defaultValue: 'Cập nhật Cấu hình Hạng Hội Viên' })}
        modal
        className="p-fluid"
        onHide={() => setShowDialog(false)}
      >
        <div className="field mb-3">
          <label htmlFor="tierName" className="font-bold">{t('tier.name', { defaultValue: 'Tên Hạng' })}</label>
          <InputText
            id="tierName"
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div className="field mb-3">
          <label htmlFor="minPoints" className="font-bold">{t('tier.min_points', { defaultValue: 'Ngưỡng điểm xét hạng (chu kỳ 12 tháng)' })}</label>
          <InputNumber
            id="minPoints"
            value={formData.minPoints ?? 0}
            onValueChange={(e) => setFormData({ ...formData, minPoints: e.value ?? 0 })}
          />
        </div>
        <div className="field mb-3">
          <label htmlFor="pointMultiplier" className="font-bold">{t('tier.multiplier', { defaultValue: 'Hệ số nhân điểm thưởng' })}</label>
          <InputNumber
            id="pointMultiplier"
            value={formData.pointMultiplier ?? 1.0}
            onValueChange={(e) => setFormData({ ...formData, pointMultiplier: e.value ?? 1.0 })}
            minFractionDigits={1}
            maxFractionDigits={2}
          />
        </div>
        <div className="field mb-3">
          <label htmlFor="freeDailyTurns" className="font-bold">{t('tier.free_turns', { defaultValue: 'Lượt quay may mắn miễn phí/ngày' })}</label>
          <InputNumber
            id="freeDailyTurns"
            value={formData.freeDailyTurns ?? 1}
            onValueChange={(e) => setFormData({ ...formData, freeDailyTurns: e.value ?? 1 })}
          />
        </div>
        <div className="field mb-3">
          <label htmlFor="status" className="font-bold">{t('common.status', { defaultValue: 'Trạng thái' })}</label>
          <Dropdown
            id="status"
            value={formData.status || CommonStatus.ACTIVE}
            options={statusOptions}
            onChange={(e) => setFormData({ ...formData, status: e.value })}
          />
        </div>
        <div className="flex justify-content-end gap-2 mt-4">
          <Button label={t('common.cancel', { defaultValue: 'Hủy' })} icon="pi pi-times" outlined onClick={() => setShowDialog(false)} disabled={isSubmitting} />
          <Button label={t('common.save', { defaultValue: 'Lưu thay đổi' })} icon="pi pi-check" onClick={saveItem} loading={isSubmitting} disabled={isSubmitting} />
        </div>
      </Dialog>
    </div>
  );
};

export default TierManagementPage;
