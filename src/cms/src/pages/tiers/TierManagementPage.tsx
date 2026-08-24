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

import { LoyaltyService } from '@/service/loyalty.service';

export const TierManagementPage: React.FC = () => {
  const { t } = useTranslation();
  const [tiers, setTiers] = useState<TierConfig[]>(INITIAL_TIERS);
  const [selectedTiers, setSelectedTiers] = useState<TierConfig[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState<Partial<TierConfig>>({});
  const [isEdit, setIsEdit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    LoyaltyService.getTiers().then((data) => {
      if (data && data.length > 0) {
        setTiers(
          data.map((item) => ({
            id: item.id,
            code: item.code as TierLevel,
            name: item.name,
            tierLevel: item.tierLevel,
            minPoints: item.minPoints !== undefined ? item.minPoints : (item.requiredPoints ?? 0),
            pointMultiplier: item.pointMultiplier,
            freeDailyTurns: item.freeDailyTurns,
            description: item.description,
            status: item.status as CommonStatus,
          }))
        );
      }
    });
  }, []);

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
    <div className="flex justify-content-center">
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
      SILVER: '#64748B',
      GOLD: '#D97706',
      PLATINUM: '#0D9488',
      DIAMOND: '#7C3AED',
    };
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          backgroundColor: colorMap[rowData.code] || '#64748B',
          color: '#ffffff',
          padding: '5px 14px',
          borderRadius: '9999px',
          fontWeight: 700,
          fontSize: '12px',
          whiteSpace: 'nowrap',
          boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
        }}
      >
        {rowData.name}
      </span>
    );
  };

  const levelTemplate = (rowData: TierConfig) => (
    <span className="font-bold text-900 font-mono" style={{ fontSize: '13px' }}>
      {rowData.tierLevel}
    </span>
  );

  const pointsTemplate = (rowData: TierConfig) => (
    <span className="font-bold font-mono text-900" style={{ fontSize: '13px' }}>
      {(rowData.minPoints ?? 0).toLocaleString()} <span className="text-500 font-normal text-xs">điểm</span>
    </span>
  );

  const multiplierTemplate = (rowData: TierConfig) => (
    <span className="font-black text-primary font-mono" style={{ fontSize: '13px' }}>
      ×{rowData.pointMultiplier.toFixed(1)}
    </span>
  );

  const turnsTemplate = (rowData: TierConfig) => (
    <span className="font-bold font-mono text-900" style={{ fontSize: '13px' }}>
      {rowData.freeDailyTurns} <span className="text-500 font-normal text-xs">lượt</span>
    </span>
  );

  const statusTemplate = (rowData: TierConfig) => {
    return rowData.status === CommonStatus.ACTIVE ? (
      <Tag severity="success" value={t('common.active', { defaultValue: 'Hoạt động' })} />
    ) : (
      <Tag severity="danger" value={t('common.inactive', { defaultValue: 'Tạm dừng' })} />
    );
  };

  const statusOptions = [
    { label: t('common.active', { defaultValue: 'Hoạt động' }), value: CommonStatus.ACTIVE },
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
          <Column body={actionTemplate} exportable={false} header={t('common.actions', { defaultValue: 'Thao tác' })} style={{ width: '5.5rem', textAlign: 'center' }} />

          {/* Cột 4 trở đi: Dữ liệu */}
          <Column field="code" header={t('tier.code', { defaultValue: 'Mã Hạng' })} sortable style={{ minWidth: '8rem' }} />
          <Column field="name" body={tierBadgeTemplate} header={t('tier.name', { defaultValue: 'Tên Hạng' })} sortable style={{ minWidth: '15rem' }} />
          <Column field="tierLevel" body={levelTemplate} header={t('tier.level', { defaultValue: 'Cấp độ' })} sortable style={{ minWidth: '6rem', textAlign: 'center' }} />
          <Column field="minPoints" body={pointsTemplate} header={t('tier.min_points', { defaultValue: 'Ngưỡng điểm xét hạng (chu kỳ 12 tháng)' })} sortable style={{ minWidth: '16rem' }} />
          <Column field="pointMultiplier" body={multiplierTemplate} header={t('tier.multiplier', { defaultValue: 'Hệ số nhân điểm thưởng' })} sortable style={{ minWidth: '12rem', textAlign: 'center' }} />
          <Column field="freeDailyTurns" body={turnsTemplate} header={t('tier.free_turns', { defaultValue: 'Lượt quay may mắn miễn phí/ngày' })} sortable style={{ minWidth: '13rem', textAlign: 'center' }} />
          <Column field="status" body={statusTemplate} header={t('common.status', { defaultValue: 'Trạng thái' })} sortable style={{ minWidth: '9rem', textAlign: 'center' }} />
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
